import { MongoClient } from 'mongodb';
import { EventReducer, EventStore } from '../../lib/eventStore';
import { z } from 'zod';
import { InventoryReservationDoc } from './inventory-reservation-model';

const createReservationEventSchema = z.object({
  type: z.literal('CREATE_FULFILMENT_RESERVATION'),
  companyId: z.string(),
  inventoryId: z.string(),
  startDate: z.string(), // ISO date string
  endDate: z.string(), // ISO date string
  fulfilmentId: z.string(),
  salesOrderType: z.enum(['RENTAL', 'SALE', 'SERVICE']),
});

const deleteReservationEventSchema = z.object({
  type: z.literal('DELETE_RESERVATION'),
});

const inventoryReservationEventSchema = z.discriminatedUnion('type', [
  createReservationEventSchema,
  deleteReservationEventSchema,
]);

type InventoryReservationReducer = EventReducer<
  InventoryReservationDoc,
  typeof inventoryReservationEventSchema
>;

const baseInventoryReservationReducer: InventoryReservationReducer = (
  state,
  event,
) => {
  if (event.payload.type === 'CREATE_FULFILMENT_RESERVATION') {
    return {
      _id: event.aggregateId,
      type: 'FULFILMENT',
      salesOrderType: event.payload.salesOrderType,
      inventoryId: event.payload.inventoryId,
      startDate: new Date(event.payload.startDate),
      endDate: new Date(event.payload.endDate),
      fulfilmentId: event.payload.fulfilmentId,
      companyId: event.payload.companyId,
      createdAt: new Date(event.ts),
      updatedAt: new Date(event.ts),
      createdBy: event.principalId,
      updatedBy: event.principalId,
      deleted: false,
    };
  }

  if (!state) {
    throw new Error('Not initialised correctly');
  }

  if (event.payload.type === 'DELETE_RESERVATION') {
    return null;
  }

  return state;
};

export type InventoryReservationEventStore = EventStore<
  typeof inventoryReservationEventSchema,
  InventoryReservationDoc
>;

export const createInventoryReservationEventStore = (config: {
  mongoClient: MongoClient;
}) => {
  return new EventStore({
    client: config.mongoClient,
    collection: 'inventory_reservations',
    eventSchema: inventoryReservationEventSchema,
    reducer: baseInventoryReservationReducer,
  });
};
