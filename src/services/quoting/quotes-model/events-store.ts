import { MongoClient } from 'mongodb';
import {
  combineReducers,
  EventReducer,
  EventStore,
} from '../../../lib/eventStore';
import { z } from 'zod';

export const quoteStatusSchema = z.enum([
  'ACTIVE',
  'ACCEPTED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED',
]);

export const quoteDocSchema = z.object({
  _id: z.string(),

  // seller info
  sellerWorkspaceId: z.string(),
  sellersBuyerContactId: z.string(),
  sellersProjectId: z.string(),

  // buyer info
  buyerWorkspaceId: z.string().optional(),
  buyersSellerContactId: z.string().optional(),
  buyersProjectId: z.string().optional(),
  buyerUserId: z.string().optional(),
  rfqId: z.string().optional(),

  // intake form tracking
  intakeFormSubmissionId: z.string().optional(),

  // metadata
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  updatedBy: z.string(),

  // status
  status: quoteStatusSchema,
  currentRevisionId: z.string().optional(),
  validUntil: z.date().optional(),

  // approval (when seller accepts on behalf of buyer)
  approvalConfirmation: z.string().optional(),

  // signature (when buyer accepts quote)
  signatureS3Key: z.string().optional(),

  // buyer's full legal name (when accepting quote)
  buyerAcceptedFullLegalName: z.string().optional(),
});

// TS types
export type QuoteStatus = z.infer<typeof quoteStatusSchema>;
export type QuoteDoc = z.infer<typeof quoteDocSchema>;

const createQuoteEventSchema = quoteDocSchema
  .omit({ _id: true }) // events don’t have the db _id
  .extend({
    type: z.literal('CREATE_QUOTE'),
  });

const updateQuoteStatusSchema = quoteDocSchema
  .pick({ status: true }) // we only need the status field
  .extend({
    type: z.literal('UPDATE_QUOTE_STATUS'),
  });

const updateQuoteSchema = quoteDocSchema
  .pick({
    sellersBuyerContactId: true,
    sellersProjectId: true,
    status: true,
    currentRevisionId: true,
    validUntil: true,
    buyerUserId: true,
    signatureS3Key: true,
    buyerAcceptedFullLegalName: true,
  })
  .partial() // all fields are optional for partial updates
  .extend({
    type: z.literal('UPDATE_QUOTE'),
  });

const quoteEventSchema = z.discriminatedUnion('type', [
  createQuoteEventSchema,
  updateQuoteStatusSchema,
  updateQuoteSchema,
]);

type QuoteReducer = EventReducer<QuoteDoc, typeof quoteEventSchema>;

const baseQuoteReducer: QuoteReducer = (state, event) => {
  if (event.payload.type === 'CREATE_QUOTE') {
    const { type, ...quote } = event.payload;
    return {
      _id: event.aggregateId,
      ...quote,
    };
  }
  if (!state) {
    throw new Error('Not initialised correctly');
  }

  if (event.payload.type === 'UPDATE_QUOTE_STATUS') {
    return {
      ...state,
      status: event.payload.status,
      updatedBy: event.principalId,
      updatedAt: new Date(event.ts),
    };
  }

  if (event.payload.type === 'UPDATE_QUOTE') {
    const { type, ...updates } = event.payload;
    return {
      ...state,
      ...updates,
      updatedBy: event.principalId,
      updatedAt: new Date(event.ts),
    };
  }

  return state;
};

export type QuoteEventStore = EventStore<typeof quoteEventSchema, QuoteDoc>;

export const createQuoteEventStore = (config: { mongoClient: MongoClient }) => {
  return new EventStore({
    client: config.mongoClient,
    collection: 'quotes',
    eventSchema: quoteEventSchema,
    reducer: combineReducers([baseQuoteReducer]),
  });
};
