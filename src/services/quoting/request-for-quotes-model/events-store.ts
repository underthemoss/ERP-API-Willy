import { MongoClient } from 'mongodb';
import {
  combineReducers,
  EventReducer,
  EventStore,
} from '../../../lib/eventStore';
import { z } from 'zod';

const rfqLineItemType = z.enum(['RENTAL', 'SALE', 'SERVICE']);
const rfqLineItemProductKindSchema = z.enum([
  'MATERIAL_PRODUCT',
  'SERVICE_PRODUCT',
  'ASSEMBLY_PRODUCT',
]);
const rfqLineItemProductRefSchema = z.object({
  kind: rfqLineItemProductKindSchema,
  productId: z.string(),
});
const rfqLineItemTimeWindowSchema = z.object({
  startAt: z.date().optional(),
  endAt: z.date().optional(),
});
const rfqLineItemPlaceKindSchema = z.enum([
  'JOBSITE',
  'BRANCH',
  'YARD',
  'ADDRESS',
  'GEOFENCE',
  'OTHER',
]);
const rfqLineItemPlaceRefSchema = z.object({
  kind: rfqLineItemPlaceKindSchema,
  id: z.string(),
});
const normalizeRfqLineItemPlaceRefInput = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return { kind: 'OTHER', id: trimmed };
  }
  return value;
};
const rfqLineItemPlaceRefInputSchema = z
  .preprocess(normalizeRfqLineItemPlaceRefInput, rfqLineItemPlaceRefSchema)
  .optional();
const rfqLineItemConstraintStrengthSchema = z.enum([
  'REQUIRED',
  'PREFERRED',
  'EXCLUDED',
]);
const rfqLineItemConstraintSchema = z
  .object({
    strength: rfqLineItemConstraintStrengthSchema,
  })
  .passthrough();
const rfqLineItemInputValueSchema = z.object({
  attributeTypeId: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  unitCode: z.string().optional(),
  contextTags: z.array(z.string()).optional(),
});
const rfqServiceTargetSelectorSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('tags'),
    tagIds: z.array(z.string()).min(1),
  }),
  z.object({
    kind: z.literal('product'),
    targetProductId: z.string(),
  }),
  z.object({
    kind: z.literal('line_item'),
    targetLineItemIds: z.array(z.string()).min(1),
  }),
]);

// 1) common stuff that *every* line item has (RFQ only contains requirements, no pricing)
const baseLineItemSchema = z.object({
  id: z.string().uuid().optional(), // or just z.string()
  description: z.string(),
  quantity: z.number().positive().default(1),
  productRef: rfqLineItemProductRefSchema.optional(),
  unitCode: z.string().optional(),
  timeWindow: rfqLineItemTimeWindowSchema.optional(),
  placeRef: rfqLineItemPlaceRefInputSchema,
  constraints: z.array(rfqLineItemConstraintSchema).optional(),
  inputs: z.array(rfqLineItemInputValueSchema).optional(),
  notes: z.string().optional(),
});

// 2) service line
const serviceLineItemSchema = baseLineItemSchema.extend({
  type: z.literal(rfqLineItemType.Values.SERVICE),
  targetSelectors: z.array(rfqServiceTargetSelectorSchema).optional(),
});

// 3) rental line
const rentalLineItemSchema = baseLineItemSchema.extend({
  pimCategoryId: z.string().optional(),
  type: z.literal(rfqLineItemType.Values.RENTAL),
  rentalStartDate: z.date(),
  rentalEndDate: z.date(),
});

// 4) sale line
const saleLineItemSchema = baseLineItemSchema.extend({
  pimCategoryId: z.string().optional(),
  type: z.literal(rfqLineItemType.Values.SALE),
});

// 5) the union of all
export const rfqLineItemSchema = z.discriminatedUnion('type', [
  serviceLineItemSchema,
  rentalLineItemSchema,
  saleLineItemSchema,
]);

export const rfqDocSchema = z.object({
  _id: z.string(),
  buyersWorkspaceId: z.string(),
  responseDeadline: z.date().optional(),
  invitedSellerContactIds: z.array(z.string()),
  invitedSellerUserIds: z.array(z.string()),
  status: z.enum([
    'DRAFT',
    'SENT',
    'ACCEPTED',
    'REJECTED',
    'CANCELLED',
    'EXPIRED',
  ]),
  description: z.string().optional(),

  // metadata
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string(),

  // lineItems
  lineItems: z.array(rfqLineItemSchema),
});

const createQuoteEventSchema = rfqDocSchema
  .omit({ _id: true }) // events don’t have the db _id
  .extend({
    type: z.literal('CREATE_RFQ'),
  });

const updateQuoteRevisionSchema = rfqDocSchema
  .pick({
    responseDeadline: true,
    lineItems: true,
    invitedSellerContactIds: true,
    invitedSellerUserIds: true,
    status: true,
    description: true,
  })
  .partial()
  .extend({
    type: z.literal('UPDATE_RFQ'),
  });

const rfqEventSchema = z.discriminatedUnion('type', [
  createQuoteEventSchema,
  updateQuoteRevisionSchema,
]);

// TS types
export type RFQServiceLineItem = z.infer<typeof serviceLineItemSchema>;
export type RFQRentalLineItem = z.infer<typeof rentalLineItemSchema>;
export type RFQSaleLineItem = z.infer<typeof saleLineItemSchema>;
export type RFQLineItemType = z.infer<typeof rfqLineItemSchema>;
export type RFQDoc = z.infer<typeof rfqDocSchema>;
export type CreateRFQInput = z.infer<typeof createQuoteEventSchema>;
export type UpdateRFQInput = z.infer<typeof updateQuoteRevisionSchema>;

const rfqRevisionReducer: EventReducer<RFQDoc, typeof rfqEventSchema> = (
  state,
  event,
) => {
  if (event.payload.type === 'CREATE_RFQ') {
    return {
      _id: event.aggregateId,
      ...event.payload,
    };
  }
  if (!state) {
    throw new Error('Not initialised correctly');
  }

  if (event.payload.type === 'UPDATE_RFQ') {
    const newState = {
      ...state,
      ...event.payload,
      updatedBy: event.principalId,
      updatedAt: new Date(event.ts),
    };

    return newState;
  }

  return state;
};

export const createRFQEventStore = (config: { mongoClient: MongoClient }) => {
  return new EventStore({
    client: config.mongoClient,
    collection: 'request_for_quotes',
    eventSchema: rfqEventSchema,
    reducer: combineReducers([rfqRevisionReducer]),
  });
};
