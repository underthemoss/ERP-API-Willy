import {
  type MongoClient,
  type Db,
  type Collection,
  ClientSession,
  WithTransactionCallback,
} from 'mongodb';
import {
  createQuoteRevisionsEventStore,
  QuoteRevisionDoc,
  RevisionStatus,
} from './events-store';
import { generateId } from '../../../lib/id-generator';

export type {
  RevisionStatus,
  QuoteRevisionLineItem,
  QuoteRevisionServiceLineItem,
  QuoteRevisionRentalLineItem,
  QuoteRevisionSaleLineItem,
} from './events-store';
export type QuoteRevision = Omit<QuoteRevisionDoc, '_id'> & { id: string };

export type CreateQuoteRevisionInput = Omit<
  QuoteRevisionDoc,
  '_id' | 'createdAt' | 'updatedAt' | 'status'
> & { status?: RevisionStatus };
export type UpdateQuoteRevisionInput = Partial<
  Pick<QuoteRevisionDoc, 'validUntil' | 'lineItems' | 'status'>
>;

export type ListQuoteRevisionsFilter = Partial<Pick<QuoteRevision, 'quoteId'>>;
export type ListQuoteRevisionsQuery = {
  filter: ListQuoteRevisionsFilter;
  page?: {
    size?: number;
    number?: number;
  };
};

export class QuoteRevisionsModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private db: Db;
  private collection: Collection<QuoteRevisionDoc>;
  private eventStore: ReturnType<typeof createQuoteRevisionsEventStore>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.eventStore = createQuoteRevisionsEventStore({
      mongoClient: this.client,
    });
    this.collection = this.db.collection<QuoteRevisionDoc>(
      this.eventStore.collection,
    );
  }

  withTransaction<T = any>(
    cb: WithTransactionCallback<T>,
    options?: Parameters<ClientSession['withTransaction']>[1],
  ) {
    return this.client.withSession<T>((session) => {
      return session.withTransaction<T>(cb, options);
    });
  }

  mapQuoteRevision(doc: QuoteRevisionDoc): QuoteRevision {
    const { _id, ...fields } = doc;
    return { ...fields, id: _id };
  }

  async listQuoteRevisions({
    filter,
    page,
  }: ListQuoteRevisionsQuery): Promise<QuoteRevision[]> {
    const limit = page?.size || 10;
    const skip = page?.number ? (page.number - 1) * limit : 0;
    const docs = await this.collection.find(filter, { limit, skip }).toArray();
    return docs.map((d) => this.mapQuoteRevision(d));
  }

  async countQuoteRevisions(filter: ListQuoteRevisionsFilter): Promise<number> {
    return this.collection.countDocuments(filter);
  }

  async getQuoteRevisionById(id: string): Promise<QuoteRevision | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.mapQuoteRevision(doc) : null;
  }

  async createQuoteRevision(
    input: CreateQuoteRevisionInput,
    session?: ClientSession,
  ): Promise<QuoteRevision> {
    const id = generateId('QREV', input.quoteId);
    const now = new Date();
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'CREATE_QUOTE_REVISION',
        ...input,
        status: input.status ?? 'DRAFT',
        createdAt: now,
        updatedAt: now,
      },
      { principalId: input.createdBy },
      session,
    );
    if (!state) throw new Error('Unexpected error');
    return this.mapQuoteRevision(state);
  }

  async updateQuoteRevision(
    id: string,
    input: UpdateQuoteRevisionInput,
    userId: string,
    session?: ClientSession,
  ): Promise<QuoteRevision | null> {
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'UPDATE_QUOTE_REVISION',
        ...input,
        updatedAt: new Date(),
        updatedBy: userId,
      },
      { principalId: userId },
      session,
    );
    return state ? this.mapQuoteRevision(state) : null;
  }
}

export const createQuoteRevisionsModel = (config: {
  mongoClient: MongoClient;
}) => {
  return new QuoteRevisionsModel(config);
};
