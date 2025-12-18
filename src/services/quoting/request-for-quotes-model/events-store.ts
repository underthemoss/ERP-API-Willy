import { MongoClient } from 'mongodb';
import {
  combineReducers,
  EventReducer,
  EventStore,
} from '../../../lib/eventStore';
import { z } from 'zod';

const rfqLineItemType = z.enum(['RENTAL', 'SALE', 'SERVICE']);

// 1) common stuff that *every* line item has (RFQ only contains requirements, no pricing)
const baseLineItemSchema = z.object({
  id: z.string().uuid().optional(), // or just z.string()
  description: z.string(),
  quantity: z.number().positive().default(1),
});

// 2) service line
const serviceLineItemSchema = baseLineItemSchema.extend({
  type: z.literal(rfqLineItemType.Values.SERVICE),
});

// 3) rental line
const rentalLineItemSchema = baseLineItemSchema.extend({
  pimCategoryId: z.string(),
  type: z.literal(rfqLineItemType.Values.RENTAL),
  rentalStartDate: z.date(),
  rentalEndDate: z.date(),
});

// 4) sale line
const saleLineItemSchema = baseLineItemSchema.extend({
  pimCategoryId: z.string(),
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
