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

// Delivery method enum
const deliveryMethodSchema = z.enum(['PICKUP', 'DELIVERY']);

// 1) common stuff that *every* line item has (Quote references seller's price catalog)
// Input schema (no id - will be generated)
const baseLineItemInputSchema = z.object({
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
});

// Stored schema (with id)
const baseLineItemSchema = baseLineItemInputSchema.extend({
  id: z.string().uuid(), // Generated v4 UUID for line item traceability
});

// 2) service line - input (no id)
const serviceLineItemInputSchema = baseLineItemInputSchema.extend({
  type: z.literal(quoteLineItemType.Values.SERVICE),
});

// 3) rental line - input (no id)
const rentalLineItemInputSchema = baseLineItemInputSchema.extend({
  pimCategoryId: z.string(),
  type: z.literal(quoteLineItemType.Values.RENTAL),
  rentalStartDate: z.date(),
  rentalEndDate: z.date(),
});

// 4) sale line - input (no id)
const saleLineItemInputSchema = baseLineItemInputSchema.extend({
  pimCategoryId: z.string(),
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
});

// 6) rental line - stored (with id)
const rentalLineItemSchema = baseLineItemSchema.extend({
  pimCategoryId: z.string(),
  type: z.literal(quoteLineItemType.Values.RENTAL),
  rentalStartDate: z.date(),
  rentalEndDate: z.date(),
});

// 7) sale line - stored (with id)
const saleLineItemSchema = baseLineItemSchema.extend({
  pimCategoryId: z.string(),
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
        const id = uuidv4();
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
          const id = uuidv4();
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
