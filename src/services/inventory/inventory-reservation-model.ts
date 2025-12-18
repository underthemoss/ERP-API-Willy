import {
  type MongoClient,
  type Db,
  type Collection,
  type Filter,
  ClientSession,
} from 'mongodb';
import {
  createInventoryReservationEventStore,
  InventoryReservationEventStore,
} from './inventoryReservationEventStore';
import { generateId } from '../../lib/id-generator';

type BaseGeneratedFields = '_id' | 'createdAt' | 'updatedAt';

export type ReservationType = 'FULFILMENT'; // string union for support for additional others later

export type BaseInventoryReservationDoc<T = ReservationType> = {
  _id: string;
  type: T;
  inventoryId: string;
  startDate: Date;
  endDate: Date;
  companyId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
  deleted: boolean;
};

export type FulfilmentReservationDoc =
  BaseInventoryReservationDoc<'FULFILMENT'> & {
    fulfilmentId: string;
    salesOrderType: 'RENTAL' | 'SALE' | 'SERVICE';
  };

export type InventoryReservationDoc = FulfilmentReservationDoc; // Union type for future additions

export type FulfilmentReservation = Omit<FulfilmentReservationDoc, '_id'> & {
  id: string;
};

export type InventoryReservation = FulfilmentReservation; // Union type for future additions

export type CreateFulfilmentReservationInput = Omit<
  FulfilmentReservationDoc,
  BaseGeneratedFields | 'type'
>;

export type ListInventoryReservationsFilter = {
  companyId?: string;
  inventoryId?: string;
  fulfilmentId?: string;
  type?: ReservationType;
  startDate?: Date;
  endDate?: Date;
  deleted?: boolean;
};

export type ListInventoryReservationsQuery = {
  filter: ListInventoryReservationsFilter;
  page?: {
    size?: number;
    number?: number;
  };
};

export class InventoryReservationModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'inventory_reservations';
  private db: Db;
  private collection: Collection<InventoryReservationDoc>;
  private eventStore: InventoryReservationEventStore;
  private ID_PREFIX = 'INV_RES';

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<InventoryReservationDoc>(
      this.collectionName,
    );
    this.eventStore = createInventoryReservationEventStore({
      mongoClient: this.client,
    });
  }

  generateReservationId(tenantId: string): string {
    return generateId(this.ID_PREFIX, tenantId);
  }

  mapReservation(doc: InventoryReservationDoc): InventoryReservation {
    const { _id, ...fields } = doc;
    return { ...fields, id: _id } as InventoryReservation;
  }

  private buildMongoFilter(
    inputFilter: ListInventoryReservationsQuery['filter'],
  ) {
    const filter: Filter<InventoryReservationDoc> = {};

    if (inputFilter.companyId) filter.companyId = inputFilter.companyId;
    if (inputFilter.inventoryId) filter.inventoryId = inputFilter.inventoryId;
    if (inputFilter.fulfilmentId) {
      filter.fulfilmentId = inputFilter.fulfilmentId;
    }
    if (inputFilter.type) filter.type = inputFilter.type;
    if (inputFilter.deleted !== undefined) filter.deleted = inputFilter.deleted;

    // Date range filtering for overlapping reservations
    if (inputFilter.startDate || inputFilter.endDate) {
      filter.$or = [];

      if (inputFilter.startDate && inputFilter.endDate) {
        // Check for overlapping date ranges
        filter.$or.push(
          // Reservation starts within the filter range
          {
            startDate: {
              $gte: inputFilter.startDate,
              $lte: inputFilter.endDate,
            },
          },
          // Reservation ends within the filter range
          {
            endDate: {
              $gte: inputFilter.startDate,
              $lte: inputFilter.endDate,
            },
          },
          // Reservation encompasses the entire filter range
          {
            startDate: { $lte: inputFilter.startDate },
            endDate: { $gte: inputFilter.endDate },
          },
        );
      } else if (inputFilter.startDate) {
        // Reservation ends after or on the start date
        filter.endDate = { $gte: inputFilter.startDate };
      } else if (inputFilter.endDate) {
        // Reservation starts before or on the end date
        filter.startDate = { $lte: inputFilter.endDate };
      }
    }

    return filter;
  }

  async listReservations({
    filter,
    page,
  }: ListInventoryReservationsQuery): Promise<InventoryReservation[]> {
    const limit = page?.size || 10;
    const skip = page?.number ? (page.number - 1) * limit : 0;
    const mongoFilter = this.buildMongoFilter(filter);

    const docs = await this.collection
      .find(mongoFilter)
      .skip(skip)
      .limit(limit)
      .toArray();

    return docs.map((d) => this.mapReservation(d));
  }

  async countReservations(
    filter: ListInventoryReservationsFilter,
  ): Promise<number> {
    // Build the MongoDB query
    const mongoFilter = this.buildMongoFilter(filter);

    return this.collection.countDocuments(mongoFilter);
  }

  async getReservationById(id: string): Promise<InventoryReservation | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.mapReservation(doc) : null;
  }

  async createFulfilmentReservation(
    input: CreateFulfilmentReservationInput,
    principalId: string,
    session?: ClientSession,
  ): Promise<InventoryReservation> {
    const id = this.generateReservationId(input.companyId);

    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'CREATE_FULFILMENT_RESERVATION',
        companyId: input.companyId,
        inventoryId: input.inventoryId,
        startDate: input.startDate.toISOString(),
        endDate: input.endDate.toISOString(),
        fulfilmentId: input.fulfilmentId,
        salesOrderType: input.salesOrderType,
      },
      { principalId },
      session,
    );

    if (!state) throw new Error('Unexpected error creating reservation');
    return this.mapReservation(state);
  }

  async deleteReservation(opts: {
    id: string;
    principalId: string;
    session?: ClientSession;
  }): Promise<boolean> {
    const reservation = await this.getReservationById(opts.id);
    if (!reservation) {
      return false;
    }

    const { state } = await this.eventStore.applyEvent(
      opts.id,
      {
        type: 'DELETE_RESERVATION',
      },
      { principalId: opts.principalId },
      opts.session,
    );

    return state !== null && state.deleted === true;
  }
}

export const createInventoryReservationModel = (config: {
  mongoClient: MongoClient;
}) => {
  return new InventoryReservationModel(config);
};
