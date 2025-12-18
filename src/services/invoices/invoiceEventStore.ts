import { MongoClient } from 'mongodb';
import {
  combineReducers,
  EventReducer,
  EventStore,
} from '../../lib/eventStore';
import { z } from 'zod';
import { InvoiceDoc, TaxLineItem } from './model';

const createInvoiceEventSchema = z.object({
  type: z.literal('CREATE_INVOICE'),
  workspaceId: z.string(),
  companyId: z.string(),
  sellerId: z.string(),
  buyerId: z.string(),
  invoiceNumber: z.string(),
});

const deleteInvoiceEventSchema = z.object({
  type: z.literal('DELETE_INVOICE'),
});
const cancelInvoiceEventSchema = z.object({
  type: z.literal('CANCEL_INVOICE'),
});
const invoiceMarkAsSentEventSchema = z.object({
  type: z.literal('MARK_AS_SENT'),
  date: z.date(),
});
const invoiceMarkAsPaidEventSchema = z.object({
  type: z.literal('MARK_AS_PAID'),
  date: z.date(),
});
const addChargeToInvoiceEventSchema = z.object({
  type: z.literal('ADD_CHARGE'),
  chargeId: z.string(),
  totalInCents: z.number().int(),
  description: z.string(),
  // AY: we potentially want capture quantity and unit cost for sales order types
  // but maybe just putting those details in the description is enough?
});

// New tax line item events
const addTaxLineItemEventSchema = z.object({
  type: z.literal('ADD_TAX_LINE_ITEM'),
  taxLineItem: z.object({
    id: z.string(),
    description: z.string(),
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    value: z.number(),
    order: z.number(),
  }),
});

const updateTaxLineItemEventSchema = z.object({
  type: z.literal('UPDATE_TAX_LINE_ITEM'),
  taxLineItemId: z.string(),
  updates: z.object({
    description: z.string().optional(),
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
    value: z.number().optional(),
    order: z.number().optional(),
  }),
});

const removeTaxLineItemEventSchema = z.object({
  type: z.literal('REMOVE_TAX_LINE_ITEM'),
  taxLineItemId: z.string(),
});

const clearTaxesEventSchema = z.object({
  type: z.literal('CLEAR_TAXES'),
});

const invoiceEventSchema = z.discriminatedUnion('type', [
  createInvoiceEventSchema,
  deleteInvoiceEventSchema,
  invoiceMarkAsSentEventSchema,
  invoiceMarkAsPaidEventSchema,
  cancelInvoiceEventSchema,
  addChargeToInvoiceEventSchema,
  addTaxLineItemEventSchema,
  updateTaxLineItemEventSchema,
  removeTaxLineItemEventSchema,
  clearTaxesEventSchema,
]);

type InvoiceReducer = EventReducer<InvoiceDoc, typeof invoiceEventSchema>;

const baseInvoiceReducer: InvoiceReducer = (state, event) => {
  if (event.payload.type === 'CREATE_INVOICE') {
    return {
      _id: event.aggregateId,
      workspaceId: event.payload.workspaceId,
      companyId: event.payload.companyId,
      invoiceNumber: event.payload.invoiceNumber,
      status: 'DRAFT',
      subTotalInCents: 0,
      taxPercent: 0.08,
      taxesInCents: 0,
      totalTaxesInCents: 0,
      finalSumInCents: 0,
      sellerId: event.payload.sellerId,
      buyerId: event.payload.buyerId,
      createdAt: new Date(event.ts),
      updatedAt: new Date(event.ts),
      createdBy: event.principalId,
      updatedBy: event.principalId,
      taxLineItems: [],
    };
  }
  if (!state) {
    throw new Error('Not initialised correctly');
  }
  if (event.payload.type === 'DELETE_INVOICE') {
    return null;
  }
  if (event.payload.type === 'MARK_AS_SENT') {
    return {
      ...state,
      status: 'SENT',
      invoiceSentDate: event.payload.date,
      updatedBy: event.principalId,
      updatedAt: new Date(event.ts),
    };
  }
  if (event.payload.type === 'MARK_AS_PAID') {
    return {
      ...state,
      status: 'PAID',
      invoicePaidDate: event.payload.date,
      updatedBy: event.principalId,
      updatedAt: new Date(event.ts),
    };
  }
  if (event.payload.type === 'CANCEL_INVOICE') {
    return {
      ...state,
      status: 'CANCELLED',
      updatedBy: event.principalId,
      updatedAt: new Date(event.ts),
    };
  }
  if (event.payload.type === 'ADD_CHARGE') {
    return {
      ...state,
      lineItems: [
        ...(state.lineItems || []),
        {
          chargeId: event.payload.chargeId,
          description: event.payload.description,
          totalInCents: event.payload.totalInCents,
        },
      ],
      updatedBy: event.principalId,
      updatedAt: new Date(event.ts),
    };
  }
  if (event.payload.type === 'ADD_TAX_LINE_ITEM') {
    return {
      ...state,
      taxLineItems: [...(state.taxLineItems || []), event.payload.taxLineItem],
      updatedBy: event.principalId,
      updatedAt: new Date(event.ts),
    };
  }
  if (event.payload.type === 'UPDATE_TAX_LINE_ITEM') {
    const { taxLineItemId, updates } = event.payload;
    return {
      ...state,
      taxLineItems: (state.taxLineItems || []).map((t) =>
        t.id === taxLineItemId ? { ...t, ...updates } : t,
      ),
      updatedBy: event.principalId,
      updatedAt: new Date(event.ts),
    };
  }
  if (event.payload.type === 'REMOVE_TAX_LINE_ITEM') {
    const { taxLineItemId } = event.payload;
    return {
      ...state,
      taxLineItems: (state.taxLineItems || []).filter(
        (t) => t.id !== taxLineItemId,
      ),
      updatedBy: event.principalId,
      updatedAt: new Date(event.ts),
    };
  }
  if (event.payload.type === 'CLEAR_TAXES') {
    return {
      ...state,
      taxLineItems: [],
      taxPercent: 0,
      updatedBy: event.principalId,
      updatedAt: new Date(event.ts),
    };
  }
  return state;
};

// Helper function to calculate taxes with multiple tax line items
function calculateTaxes(
  subtotal: number,
  taxLineItems: TaxLineItem[],
): {
  taxLineItems: TaxLineItem[];
  totalTaxes: number;
} {
  if (!taxLineItems || taxLineItems.length === 0) {
    return { taxLineItems: [], totalTaxes: 0 };
  }

  const runningTotal = subtotal;
  const calculatedTaxLineItems = taxLineItems
    .sort((a, b) => a.order - b.order)
    .map((tax) => {
      let amount: number;

      if (tax.type === 'PERCENTAGE') {
        amount = Math.round(runningTotal * tax.value);
      } else {
        amount = tax.value; // Fixed amount in cents
      }

      // For compound taxes (tax on tax), add to running total
      // This is optional and depends on business requirements
      // runningTotal += amount;

      return {
        ...tax,
        calculatedAmountInCents: amount,
      };
    });

  const totalTaxes = calculatedTaxLineItems.reduce(
    (sum, tax) => sum + (tax.calculatedAmountInCents || 0),
    0,
  );

  return { taxLineItems: calculatedTaxLineItems, totalTaxes };
}

const invoiceCalculatedTotalsReducer: InvoiceReducer = (state, event) => {
  if (state && state.lineItems) {
    const subtotal = state.lineItems.reduce(
      (acc, item) => acc + item.totalInCents,
      0,
    );

    // Calculate taxes using the new tax line items system
    const { taxLineItems, totalTaxes } = calculateTaxes(
      subtotal,
      state.taxLineItems || [],
    );

    const finalTaxAmount = totalTaxes;

    return {
      ...state,
      subTotalInCents: subtotal,
      totalTaxesInCents: finalTaxAmount,
      finalSumInCents: Math.round(subtotal + finalTaxAmount),
      taxLineItems,
    };
  }
  return state;
};

export type InvoiceEventStore = EventStore<
  typeof invoiceEventSchema,
  InvoiceDoc
>;

export const createInvoiceEventStore = (config: {
  mongoClient: MongoClient;
}) => {
  return new EventStore({
    client: config.mongoClient,
    collection: 'invoices',
    eventSchema: invoiceEventSchema,
    reducer: combineReducers([
      baseInvoiceReducer,
      invoiceCalculatedTotalsReducer,
    ]),
  });
};
