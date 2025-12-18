import { MongoClient } from 'mongodb';
import { EventReducer, EventStore } from '../../lib/eventStore';
import { z } from 'zod';
import { InventoryDoc } from './model';

const createInventoryEventSchema = z.object({
  type: z.literal('CREATE_INVENTORY'),
  companyId: z.string(),
  workspaceId: z.string().optional(),
  status: z.enum(['ON_ORDER', 'RECEIVED']),
  fulfilmentId: z.string().optional(),
  purchaseOrderId: z.string().optional(),
  purchaseOrderLineItemId: z.string().optional(),
  isThirdPartyRental: z.boolean(),
  assetId: z.string().optional(),
  pimCategoryId: z.string().optional(),
  pimCategoryPath: z.string().optional(),
  pimCategoryName: z.string().optional(),
  pimProductId: z.string().optional(),
  expectedReturnDate: z.string().optional(), // ISO date string
  actualReturnDate: z.string().optional(), // ISO date string
});

const inventoryReceivedEventSchema = z.object({
  type: z.literal('INVENTORY_RECEIVED'),
  receivedAt: z.string().optional(), // ISO date string
  receiptNotes: z.string().optional(),
  pimProductId: z.string().optional(),
  resourceMapId: z.string().optional(),
  conditionOnReceipt: z
    .enum(['NEW', 'USED', 'DAMAGED', 'REFURBISHED'])
    .optional(),
  conditionNotes: z.string().optional(),
  expectedReturnDate: z.string().optional(), // ISO date string - for third-party rentals
  assetId: z.string().optional(), // Asset ID can be set when marking as received
});

const updateInventorySerialisedIdEventSchema = z.object({
  type: z.literal('UPDATE_INVENTORY_SERIALISED_ID'),
  assetId: z.string(),
});

const updateInventoryExpectedReturnDateEventSchema = z.object({
  type: z.literal('UPDATE_INVENTORY_EXPECTED_RETURN_DATE'),
  expectedReturnDate: z.string(), // ISO date string
});

const updateInventoryActualReturnDateEventSchema = z.object({
  type: z.literal('UPDATE_INVENTORY_ACTUAL_RETURN_DATE'),
  actualReturnDate: z.string(), // ISO date string
});

const deleteInventoryEventSchema = z.object({
  type: z.literal('DELETE_INVENTORY'),
  reason: z.string(),
});

const inventoryEventSchema = z.discriminatedUnion('type', [
  createInventoryEventSchema,
  inventoryReceivedEventSchema,
  updateInventorySerialisedIdEventSchema,
  updateInventoryExpectedReturnDateEventSchema,
  updateInventoryActualReturnDateEventSchema,
  deleteInventoryEventSchema,
]);

type InventoryReducer = EventReducer<InventoryDoc, typeof inventoryEventSchema>;

const baseInventoryReducer: InventoryReducer = (state, event) => {
  if (event.payload.type === 'CREATE_INVENTORY') {
    return {
      _id: event.aggregateId,
      companyId: event.payload.companyId,
      workspaceId: event.payload.workspaceId,
      status: event.payload.status,
      fulfilmentId: event.payload.fulfilmentId,
      purchaseOrderId: event.payload.purchaseOrderId,
      purchaseOrderLineItemId: event.payload.purchaseOrderLineItemId,
      isThirdPartyRental: event.payload.isThirdPartyRental,
      assetId: event.payload.assetId,
      pimCategoryId: event.payload.pimCategoryId,
      pimCategoryPath: event.payload.pimCategoryPath,
      pimCategoryName: event.payload.pimCategoryName,
      pimProductId: event.payload.pimProductId,
      expectedReturnDate: event.payload.expectedReturnDate
        ? new Date(event.payload.expectedReturnDate)
        : undefined,
      actualReturnDate: event.payload.actualReturnDate
        ? new Date(event.payload.actualReturnDate)
        : undefined,
      createdAt: new Date(event.ts),
      updatedAt: new Date(event.ts),
      createdBy: event.principalId,
      updatedBy: event.principalId,
    };
  }
  if (!state) {
    throw new Error('Not initialised correctly');
  }
  if (event.payload.type === 'DELETE_INVENTORY') {
    // Delete event now includes a reason
    return null;
  }
  if (event.payload.type === 'INVENTORY_RECEIVED') {
    return {
      ...state,
      status: 'RECEIVED',
      receivedAt: event.payload.receivedAt
        ? new Date(event.payload.receivedAt)
        : new Date(event.ts),
      receiptNotes: event.payload.receiptNotes ?? state.receiptNotes,
      pimProductId: event.payload.pimProductId ?? state.pimProductId,
      resourceMapId: event.payload.resourceMapId ?? state.resourceMapId,
      conditionOnReceipt:
        event.payload.conditionOnReceipt ?? state.conditionOnReceipt,
      conditionNotes: event.payload.conditionNotes ?? state.conditionNotes,
      expectedReturnDate: event.payload.expectedReturnDate
        ? new Date(event.payload.expectedReturnDate)
        : state.expectedReturnDate,
      assetId: event.payload.assetId ?? state.assetId,
      updatedBy: event.principalId,
      updatedAt: new Date(event.ts),
    };
  }
  if (event.payload.type === 'UPDATE_INVENTORY_SERIALISED_ID') {
    return {
      ...state,
      assetId: event.payload.assetId,
      updatedBy: event.principalId,
      updatedAt: new Date(event.ts),
    };
  }
  if (event.payload.type === 'UPDATE_INVENTORY_EXPECTED_RETURN_DATE') {
    return {
      ...state,
      expectedReturnDate: new Date(event.payload.expectedReturnDate),
      updatedBy: event.principalId,
      updatedAt: new Date(event.ts),
    };
  }
  if (event.payload.type === 'UPDATE_INVENTORY_ACTUAL_RETURN_DATE') {
    return {
      ...state,
      actualReturnDate: new Date(event.payload.actualReturnDate),
      updatedBy: event.principalId,
      updatedAt: new Date(event.ts),
    };
  }
  return state;
};

export type InventoryEventStore = EventStore<
  typeof inventoryEventSchema,
  InventoryDoc
>;

export const createInventoryEventStore = (config: {
  mongoClient: MongoClient;
}) => {
  return new EventStore({
    client: config.mongoClient,
    collection: 'inventory',
    eventSchema: inventoryEventSchema,
    reducer: baseInventoryReducer,
  });
};
