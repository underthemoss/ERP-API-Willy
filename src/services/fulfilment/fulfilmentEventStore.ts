import { MongoClient } from 'mongodb';
import { EventReducer, EventStore } from '../../lib/eventStore';
import { z } from 'zod';
import { FulfilmentDoc } from './model';

const sharedCreateFields = {
  workspace_id: z.string(),
  projectId: z.string().optional(),
  salesOrderId: z.string(),
  contactId: z.string(),
  purchaseOrderNumber: z.string().optional(),
  priceId: z.string().optional(),
  priceName: z.string().optional(),
  pimCategoryId: z.string(),
  pimCategoryPath: z.string(),
  pimCategoryName: z.string(),
  salesOrderLineItemId: z.string().optional(),
  workflowId: z.string().nullable().optional(),
  workflowColumnId: z.string().nullable().optional(),
};

const createSalesFulfilmentEventSchema = z.object({
  type: z.literal('CREATE_SALES_FULFILMENT'),
  salesOrderType: z.literal('SALE'),
  unitCostInCents: z.number(),
  quantity: z.number(),
  ...sharedCreateFields,
});

const createRentalFulfilmentEventSchema = z.object({
  type: z.literal('CREATE_RENTAL_FULFILMENT'),
  salesOrderType: z.literal('RENTAL'),
  rentalStartDate: z.date().optional(),
  rentalEndDate: z.date().optional(),
  expectedRentalEndDate: z.date().optional(),
  lastChargeDate: z.date().optional(),
  pricePerDayInCents: z.number(),
  pricePerWeekInCents: z.number(),
  pricePerMonthInCents: z.number(),
  ...sharedCreateFields,
});

const createServiceFulfilmentEventSchema = z.object({
  type: z.literal('CREATE_SERVICE_FULFILMENT'),
  salesOrderType: z.literal('SERVICE'),
  serviceDate: z.date().optional(),
  unitCostInCents: z.number(),
  ...sharedCreateFields,
});

const updateFulfilmentColumnEventSchema = z.object({
  type: z.literal('UPDATE_COLUMN'),
  workflowColumnId: z.string().nullable(),
  workflowId: z.string().nullable(),
});
const updateFulfilmentAssigneeEventSchema = z.object({
  type: z.literal('UPDATE_ASSIGNEE'),
  assignToId: z.string().nullable(),
});
const deleteFulfilmentEventSchema = z.object({
  type: z.literal('DELETE_FULFILMENT'),
});

const setRentalStartDateEventSchema = z.object({
  type: z.literal('SET_RENTAL_START_DATE'),
  rentalStartDate: z.date(),
});

const setRentalEndDateEventSchema = z.object({
  type: z.literal('SET_RENTAL_END_DATE'),
  rentalEndDate: z.date(),
});

const setExpectedRentalEndDateEventSchema = z.object({
  type: z.literal('SET_EXPECTED_RENTAL_END_DATE'),
  expectedRentalEndDate: z.date(),
});

const updateLastChargedAtEventSchema = z.object({
  type: z.literal('UPDATE_LAST_CHARGED_AT'),
  lastBillingPeriodEnd: z.date(),
  lastChargedAt: z.date().optional(),
  daysCharged: z.number().min(0),
});

const resetLastChargedAtEventSchema = z.object({
  type: z.literal('RESET_LAST_CHARGED_AT'),
});

const assignInventoryToFulfilmentEventSchema = z.object({
  type: z.literal('ASSIGN_INVENTORY_TO_FULFILMENT'),
  inventoryId: z.string(),
});

const unassignInventoryToFulfilmentEventSchema = z.object({
  type: z.literal('UNASSIGN_INVENTORY_TO_FULFILMENT'),
});

const setPurchaseOrderLineItemIdEventSchema = z.object({
  type: z.literal('SET_PURCHASE_ORDER_LINE_ITEM_ID'),
  purchaseOrderLineItemId: z.string().nullable(),
});

const fulfilmentEventSchema = z.discriminatedUnion('type', [
  createSalesFulfilmentEventSchema,
  createRentalFulfilmentEventSchema,
  createServiceFulfilmentEventSchema,
  updateFulfilmentColumnEventSchema,
  updateFulfilmentAssigneeEventSchema,
  deleteFulfilmentEventSchema,
  setRentalStartDateEventSchema,
  setRentalEndDateEventSchema,
  setExpectedRentalEndDateEventSchema,
  updateLastChargedAtEventSchema,
  resetLastChargedAtEventSchema,
  assignInventoryToFulfilmentEventSchema,
  unassignInventoryToFulfilmentEventSchema,
  setPurchaseOrderLineItemIdEventSchema,
]);

const reducer: EventReducer<FulfilmentDoc, typeof fulfilmentEventSchema> = (
  state,
  event,
) => {
  if (
    event.payload.type === 'CREATE_SALES_FULFILMENT' ||
    event.payload.type === 'CREATE_RENTAL_FULFILMENT' ||
    event.payload.type === 'CREATE_SERVICE_FULFILMENT'
  ) {
    const { type, ...payload } = event.payload;
    return {
      _id: event.aggregateId,
      createdAt: new Date(event.ts),
      updatedAt: new Date(event.ts),
      createdBy: event.principalId,
      ...payload,
    };
  }

  if (!state) {
    throw new Error('Not initialised correctly');
  }

  if (event.payload.type === 'UPDATE_ASSIGNEE') {
    return {
      ...state,
      assignedToId: event.payload.assignToId,
      updatedAt: new Date(event.ts),
      updatedBy: event.principalId,
    };
  }
  if (event.payload.type === 'UPDATE_COLUMN') {
    return {
      ...state,
      workflowColumnId: event.payload.workflowColumnId,
      workflowId: event.payload.workflowId,
      updatedAt: new Date(event.ts),
      updatedBy: event.principalId,
    };
  }

  if (event.payload.type === 'SET_RENTAL_START_DATE') {
    return {
      ...state,
      rentalStartDate: event.payload.rentalStartDate,
      updatedAt: new Date(event.ts),
      updatedBy: event.principalId,
    };
  }

  if (event.payload.type === 'SET_RENTAL_END_DATE') {
    return {
      ...state,
      rentalEndDate: event.payload.rentalEndDate,
      updatedAt: new Date(event.ts),
      updatedBy: event.principalId,
    };
  }

  if (event.payload.type === 'SET_EXPECTED_RENTAL_END_DATE') {
    return {
      ...state,
      expectedRentalEndDate: event.payload.expectedRentalEndDate,
      updatedAt: new Date(event.ts),
      updatedBy: event.principalId,
    };
  }

  if (event.payload.type === 'UPDATE_LAST_CHARGED_AT') {
    if (state.salesOrderType !== 'RENTAL') {
      throw new Error(
        'Cannot update last charged at for non-rental fulfilment',
      );
    }

    return {
      ...state,
      lastChargedAt: event.payload.lastChargedAt,
      lastBillingPeriodEnd: event.payload.lastBillingPeriodEnd,
      updatedAt: new Date(event.ts),
      updatedBy: event.principalId,
      totalDaysCharged:
        (state.totalDaysCharged || 0) + event.payload.daysCharged,
    };
  }

  if (event.payload.type === 'RESET_LAST_CHARGED_AT') {
    if (state.salesOrderType !== 'RENTAL') {
      throw new Error(
        'Cannot update last charged at for non-rental fulfilment',
      );
    }

    return {
      ...state,
      lastChargedAt: undefined,
      lastBillingPeriodEnd: undefined,
      updatedAt: new Date(event.ts),
      updatedBy: event.principalId,
      totalDaysCharged: 0,
    };
  }

  if (event.payload.type === 'ASSIGN_INVENTORY_TO_FULFILMENT') {
    return {
      ...state,
      inventoryId: event.payload.inventoryId,
      updatedAt: new Date(event.ts),
      updatedBy: event.principalId,
    };
  }

  if (event.payload.type === 'UNASSIGN_INVENTORY_TO_FULFILMENT') {
    return {
      ...state,
      inventoryId: undefined,
      updatedAt: new Date(event.ts),
      updatedBy: event.principalId,
    };
  }

  if (event.payload.type === 'SET_PURCHASE_ORDER_LINE_ITEM_ID') {
    return {
      ...state,
      purchaseOrderLineItemId:
        event.payload.purchaseOrderLineItemId ?? undefined,
      updatedAt: new Date(event.ts),
      updatedBy: event.principalId,
    };
  }

  if (event.payload.type === 'DELETE_FULFILMENT') {
    return null; // tombstone
  }
  return state;
};

export type FulfilmentEventStore = EventStore<
  typeof fulfilmentEventSchema,
  FulfilmentDoc
>;

export const createFulfilmentEventStore = (config: {
  mongoClient: MongoClient;
}) => {
  return new EventStore({
    client: config.mongoClient,
    collection: 'fulfilments',
    eventSchema: fulfilmentEventSchema,
    reducer,
  });
};
