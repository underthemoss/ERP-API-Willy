import {
  type MongoClient,
  type Db,
  type Collection,
  WithTransactionCallback,
  ClientSession,
} from 'mongodb';
import { createRFQEventStore, RFQDoc } from './events-store';
import { generateId } from '../../../lib/id-generator';

export type {
  RFQLineItemType,
  RFQServiceLineItem,
  RFQRentalLineItem,
  RFQSaleLineItem,
} from './events-store';
export type RFQ = Omit<RFQDoc, '_id'> & { id: string };

export type CreateRFQInput = Omit<RFQDoc, '_id' | 'createdAt' | 'updatedAt'>;
export type UpdateRFQInput = Omit<RFQDoc, '_id' | 'createdAt' | 'createdBy'>;

export type ListRFQsFilter = {
  buyersWorkspaceId: string;
  status?: RFQ['status'];
  invitedSellerContactIds?: string[];
  createdAtStart?: Date;
  createdAtEnd?: Date;
  updatedAtStart?: Date;
  updatedAtEnd?: Date;
};

export type ListRFQsQuery = {
  filter: ListRFQsFilter;
  page?: {
    size?: number;
    number?: number;
  };
};

export class RFQsModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private db: Db;
  private collection: Collection<RFQDoc>;
  private eventStore: ReturnType<typeof createRFQEventStore>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.eventStore = createRFQEventStore({
      mongoClient: this.client,
    });
    this.collection = this.db.collection<RFQDoc>(this.eventStore.collection);
  }

  withTransaction<T = any>(
    cb: WithTransactionCallback<T>,
    options?: Parameters<ClientSession['withTransaction']>[1],
  ) {
    return this.client.withSession<T>((session) => {
      return session.withTransaction<T>(cb, options);
    });
  }

  mapRFQ(doc: RFQDoc): RFQ {
    const { _id, ...fields } = doc;
    return { ...fields, id: _id };
  }

  private buildMongoQuery(filter: ListRFQsFilter): any {
    const query: any = {
      buyersWorkspaceId: filter.buyersWorkspaceId,
    };

    if (filter.status) {
      query.status = filter.status;
    }

    if (
      filter.invitedSellerContactIds &&
      filter.invitedSellerContactIds.length > 0
    ) {
      query.invitedSellerContactIds = { $in: filter.invitedSellerContactIds };
    }

    if (filter.createdAtStart || filter.createdAtEnd) {
      query.createdAt = {};
      if (filter.createdAtStart) {
        query.createdAt.$gte = filter.createdAtStart;
      }
      if (filter.createdAtEnd) {
        query.createdAt.$lte = filter.createdAtEnd;
      }
    }

    if (filter.updatedAtStart || filter.updatedAtEnd) {
      query.updatedAt = {};
      if (filter.updatedAtStart) {
        query.updatedAt.$gte = filter.updatedAtStart;
      }
      if (filter.updatedAtEnd) {
        query.updatedAt.$lte = filter.updatedAtEnd;
      }
    }

    return query;
  }

  async listRFQs({ filter, page }: ListRFQsQuery): Promise<RFQ[]> {
    const limit = page?.size || 10;
    const skip = page?.number ? (page.number - 1) * limit : 0;
    const query = this.buildMongoQuery(filter);
    const docs = await this.collection.find(query, { limit, skip }).toArray();
    return docs.map((d) => this.mapRFQ(d));
  }

  async countRFQs(filter: ListRFQsFilter): Promise<number> {
    const query = this.buildMongoQuery(filter);
    return this.collection.countDocuments(query);
  }

  async getRFQById(id: string): Promise<RFQ | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.mapRFQ(doc) : null;
  }

  async createRFQ(
    input: CreateRFQInput,
    session?: ClientSession,
  ): Promise<RFQ> {
    const id = generateId('RFQ', input.buyersWorkspaceId);
    const now = new Date();
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'CREATE_RFQ',
        ...input,
        createdAt: now,
        updatedAt: now,
      },
      { principalId: input.createdBy },
      session,
    );
    if (!state) throw new Error('Unexpected error');
    return this.mapRFQ(state);
  }

  async updateRFQ(
    id: string,
    input: Partial<UpdateRFQInput>,
    userId: string,
  ): Promise<RFQ | null> {
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'UPDATE_RFQ',
        ...input,
      },
      { principalId: userId },
    );
    return state ? this.mapRFQ(state) : null;
  }
}

export const createRFQsModel = (config: { mongoClient: MongoClient }) => {
  return new RFQsModel(config);
};
