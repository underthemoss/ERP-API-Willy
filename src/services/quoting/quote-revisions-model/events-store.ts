import { MongoClient } from 'mongodb';
import {
  combineReducers,
  EventReducer,
  EventStore,
} from '../../../lib/eventStore';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export const revisionStatusSchema = z.enum(['DRAFT', 'SENT']);

const quoteLineItemType = z.enum(['RENTAL', 'SALE', 'SERVICE']);
const quoteLineItemProductKindSchema = z.enum([
  'MATERIAL_PRODUCT',
  'SERVICE_PRODUCT',
  'ASSEMBLY_PRODUCT',
]);
const quoteLineItemProductRefSchema = z.object({
  kind: quoteLineItemProductKindSchema,
  productId: z.string(),
});
const quoteLineItemTimeWindowSchema = z.object({
  startAt: z.date().optional(),
  endAt: z.date().optional(),
});
const quoteLineItemPlaceKindSchema = z.enum([
  'JOBSITE',
  'BRANCH',
  'YARD',
  'ADDRESS',
  'GEOFENCE',
  'OTHER',
]);
const quoteLineItemPlaceRefSchema = z.object({
  kind: quoteLineItemPlaceKindSchema,
  id: z.string(),
});
const normalizeQuoteLineItemPlaceRefInput = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return { kind: 'OTHER', id: trimmed };
  }
  return value;
};
const quoteLineItemPlaceRefInputSchema = z
  .preprocess(normalizeQuoteLineItemPlaceRefInput, quoteLineItemPlaceRefSchema)
  .optional();
const quoteLineItemConstraintStrengthSchema = z.enum([
  'REQUIRED',
  'PREFERRED',
  'EXCLUDED',
]);
const quoteLineItemConstraintSchema = z
  .object({
    strength: quoteLineItemConstraintStrengthSchema,
  })
  .passthrough();
const quoteLineItemPricingRefSchema = z
  .object({
    priceId: z.string().optional(),
    priceBookId: z.string().optional(),
    priceType: z.enum(['RENTAL', 'SALE', 'SERVICE']).optional(),
  })
  .passthrough();
const quoteLineItemInputValueSchema = z.object({
  attributeTypeId: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  unitCode: z.string().optional(),
  contextTags: z.array(z.string()).optional(),
});
const quoteLineItemPricingSpecSnapshotSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('UNIT'),
    unitCode: z.string(),
    rateInCents: z.number().int().nonnegative(),
  }),
  z.object({
    kind: z.literal('TIME'),
    unitCode: z.string(),
    rateInCents: z.number().int().nonnegative(),
  }),
  z.object({
    kind: z.literal('RENTAL_RATE_TABLE'),
    pricePerDayInCents: z.number().int().nonnegative(),
    pricePerWeekInCents: z.number().int().nonnegative(),
    pricePerMonthInCents: z.number().int().nonnegative(),
  }),
]);
const serviceTargetSelectorSchema = z.discriminatedUnion('kind', [
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

// Delivery method enum
const deliveryMethodSchema = z.enum(['PICKUP', 'DELIVERY']);

// 1) common stuff that *every* line item has (Quote references seller's price catalog)
// Input schema (id is optional; when provided it is preserved for stable identity)
const baseLineItemInputSchema = z.object({
  id: z.string().optional(),
  description: z.string(),
  quantity: z.number().positive().default(1),
  sellersPriceId: z.string().optional(), // Reference to seller's price catalog (optional - required before sending)
  subtotalInCents: z.number().nonnegative(), // Calculated from price lookup (0 if no priceId)
  // Tracking field for intake form conversion
  intakeFormSubmissionLineItemId: z.string().optional().nullable(),
  // Delivery fields
  deliveryMethod: deliveryMethodSchema.optional(),
  deliveryLocation: z.string().optional(),
  deliveryNotes: z.string().optional(),
  // Extensible line item fields
  productRef: quoteLineItemProductRefSchema.optional(),
  unitCode: z.string().optional(),
  timeWindow: quoteLineItemTimeWindowSchema.optional(),
  placeRef: quoteLineItemPlaceRefInputSchema,
  constraints: z.array(quoteLineItemConstraintSchema).optional(),
  inputs: z.array(quoteLineItemInputValueSchema).optional(),
  pricingRef: quoteLineItemPricingRefSchema.optional(),
  pricingSpecSnapshot: quoteLineItemPricingSpecSnapshotSchema.optional(),
  rateInCentsSnapshot: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});

// Stored schema (with id)
const baseLineItemSchema = baseLineItemInputSchema.extend({
  id: z.string(), // Stable line item id (uuid v4 today; may evolve)
});

// 2) service line - input (no id)
const serviceLineItemInputSchema = baseLineItemInputSchema.extend({
  type: z.literal(quoteLineItemType.Values.SERVICE),
  targetSelectors: z.array(serviceTargetSelectorSchema).optional(),
});

// 3) rental line - input (no id)
const rentalLineItemInputSchema = baseLineItemInputSchema.extend({
  pimCategoryId: z.string().optional(),
  type: z.literal(quoteLineItemType.Values.RENTAL),
  rentalStartDate: z.date(),
  rentalEndDate: z.date(),
});

// 4) sale line - input (no id)
const saleLineItemInputSchema = baseLineItemInputSchema.extend({
  pimCategoryId: z.string().optional(),
  type: z.literal(quoteLineItemType.Values.SALE),
});

// Input union (no id)
export const revisionLineItemInputSchema = z.discriminatedUnion('type', [
  serviceLineItemInputSchema,
  rentalLineItemInputSchema,
  saleLineItemInputSchema,
]);

// 5) service line - stored (with id)
const serviceLineItemSchema = baseLineItemSchema.extend({
  type: z.literal(quoteLineItemType.Values.SERVICE),
  targetSelectors: z.array(serviceTargetSelectorSchema).optional(),
});

// 6) rental line - stored (with id)
const rentalLineItemSchema = baseLineItemSchema.extend({
  pimCategoryId: z.string().optional(),
  type: z.literal(quoteLineItemType.Values.RENTAL),
  rentalStartDate: z.date(),
  rentalEndDate: z.date(),
});

// 7) sale line - stored (with id)
const saleLineItemSchema = baseLineItemSchema.extend({
  pimCategoryId: z.string().optional(),
  type: z.literal(quoteLineItemType.Values.SALE),
});

// 8) the union of all stored (with id)
export const revisionLineItemSchema = z.discriminatedUnion('type', [
  serviceLineItemSchema,
  rentalLineItemSchema,
  saleLineItemSchema,
]);

export const quoteRevisionDocSchema = z.object({
  _id: z.string(),
  quoteId: z.string(),
  revisionNumber: z.number(),
  validUntil: z.date().optional(),

  // status
  status: revisionStatusSchema,

  // metadata
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string(),

  // lineItems
  lineItems: z.array(revisionLineItemSchema),
});

// TS types
export type RevisionStatus = z.infer<typeof revisionStatusSchema>;
export type DeliveryMethod = z.infer<typeof deliveryMethodSchema>;
export type QuoteRevisionServiceLineItem = z.infer<
  typeof serviceLineItemSchema
>;
export type QuoteRevisionRentalLineItem = z.infer<typeof rentalLineItemSchema>;
export type QuoteRevisionSaleLineItem = z.infer<typeof saleLineItemSchema>;
export type QuoteRevisionLineItemType = z.infer<typeof revisionLineItemSchema>;
export type QuoteRevisionLineItem = z.infer<typeof revisionLineItemSchema>;
export type QuoteRevisionDoc = z.infer<typeof quoteRevisionDocSchema>;

// For CREATE: use input schema (without IDs in line items)
const createQuoteEventSchema = quoteRevisionDocSchema
  .omit({ _id: true, lineItems: true }) // events don't have the db _id, and line items use input schema
  .extend({
    type: z.literal('CREATE_QUOTE_REVISION'),
    lineItems: z.array(revisionLineItemInputSchema), // Input schema without id
  });

// For UPDATE: can use input schema for line items too
const updateQuoteRevisionSchema = z
  .object({
    validUntil: quoteRevisionDocSchema.shape.validUntil,
    updatedAt: quoteRevisionDocSchema.shape.updatedAt,
    updatedBy: quoteRevisionDocSchema.shape.updatedBy,
    lineItems: z.array(revisionLineItemInputSchema), // Input schema without id
    status: quoteRevisionDocSchema.shape.status,
  })
  .partial()
  .extend({
    type: z.literal('UPDATE_QUOTE_REVISION'),
  });

const quoteRevisionEventSchema = z.discriminatedUnion('type', [
  createQuoteEventSchema,
  updateQuoteRevisionSchema,
]);

type QuoteRevisionReducer = EventReducer<
  QuoteRevisionDoc,
  typeof quoteRevisionEventSchema
>;

const quoteRevisionReducer: QuoteRevisionReducer = (state, event) => {
  if (event.payload.type === 'CREATE_QUOTE_REVISION') {
    // Generate IDs for all line items using explicit type narrowing
    const lineItemsWithIds: QuoteRevisionLineItem[] =
      event.payload.lineItems.map((item) => {
        const id = item.id ?? uuidv4();
        switch (item.type) {
          case 'SERVICE':
            return {
              ...item,
              id,
              type: 'SERVICE',
            } as QuoteRevisionServiceLineItem;
          case 'RENTAL':
            return {
              ...item,
              id,
              type: 'RENTAL',
            } as QuoteRevisionRentalLineItem;
          case 'SALE':
            return { ...item, id, type: 'SALE' } as QuoteRevisionSaleLineItem;
          default:
            throw new Error(`Unknown line item type: ${(item as any).type}`);
        }
      });

    return {
      _id: event.aggregateId,
      ...event.payload,
      lineItems: lineItemsWithIds,
    };
  }
  if (!state) {
    throw new Error('Not initialised correctly');
  }

  if (event.payload.type === 'UPDATE_QUOTE_REVISION') {
    // Generate IDs for new line items if line items are being updated
    const lineItemsWithIds: QuoteRevisionLineItem[] | undefined = event.payload
      .lineItems
      ? event.payload.lineItems.map((item) => {
          const id = item.id ?? uuidv4();
          switch (item.type) {
            case 'SERVICE':
              return {
                ...item,
                id,
                type: 'SERVICE',
              } as QuoteRevisionServiceLineItem;
            case 'RENTAL':
              return {
                ...item,
                id,
                type: 'RENTAL',
              } as QuoteRevisionRentalLineItem;
            case 'SALE':
              return { ...item, id, type: 'SALE' } as QuoteRevisionSaleLineItem;
            default:
              throw new Error(`Unknown line item type: ${(item as any).type}`);
          }
        })
      : undefined;

    const { type, lineItems, ...updates } = event.payload;
    return {
      ...state,
      ...updates,
      ...(lineItemsWithIds && { lineItems: lineItemsWithIds }),
      updatedBy: event.principalId,
      updatedAt: new Date(event.ts),
    };
  }

  return state;
};

export const createQuoteRevisionsEventStore = (config: {
  mongoClient: MongoClient;
}) => {
  return new EventStore({
    client: config.mongoClient,
    collection: 'quote_revisions',
    eventSchema: quoteRevisionEventSchema,
    reducer: combineReducers([quoteRevisionReducer]),
  });
};
