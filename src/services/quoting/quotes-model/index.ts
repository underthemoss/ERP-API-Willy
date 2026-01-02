import {
  type MongoClient,
  type Db,
  type Collection,
  ClientSession,
  WithTransactionCallback,
} from 'mongodb';
import {
  QuoteEventStore,
  createQuoteEventStore,
  QuoteDoc,
  QuoteStatus,
} from './events-store';
import { generateId } from '../../../lib/id-generator';

export type { QuoteStatus } from './events-store';

export type Quote = Omit<QuoteDoc, '_id'> & { id: string };

export type CreateQuoteInput = Omit<
  QuoteDoc,
  '_id' | 'createdAt' | 'updatedAt'
>;
export type UpdateQuoteInput = Partial<
  Omit<QuoteDoc, '_id' | 'createdAt' | 'createdBy'>
>;

export type ListQuotesFilter = Partial<
  Pick<Quote, 'buyerWorkspaceId' | 'sellerWorkspaceId' | 'status' | 'rfqId'>
>;
export type ListQuotesQuery = {
  filter: ListQuotesFilter;
  page?: {
    size?: number;
    number?: number;
  };
};

export class QuotesModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private db: Db;
  private collection: Collection<QuoteDoc>;
  private eventStore: QuoteEventStore;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.eventStore = createQuoteEventStore({ mongoClient: this.client });
    this.collection = this.db.collection<QuoteDoc>(this.eventStore.collection);
  }

  withTransaction<T = any>(
    cb: WithTransactionCallback<T>,
    options?: Parameters<ClientSession['withTransaction']>[1],
  ) {
    return this.client.withSession<T>((session) => {
      return session.withTransaction<T>(cb, options);
    });
  }

  mapQuote(doc: QuoteDoc): Quote {
    const { _id, ...fields } = doc;
    return { ...fields, id: _id };
  }

  async listQuotes({ filter, page }: ListQuotesQuery): Promise<Quote[]> {
    const limit = page?.size || 10;
    const skip = page?.number ? (page.number - 1) * limit : 0;
    const docs = await this.collection
      .find(filter, { limit, skip })
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map((d) => this.mapQuote(d));
  }

  async countQuotes(filter: ListQuotesFilter): Promise<number> {
    return this.collection.countDocuments(filter);
  }

  async getQuoteById(id: string): Promise<Quote | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.mapQuote(doc) : null;
  }

  async createQuote(
    input: CreateQuoteInput,
    session?: ClientSession,
  ): Promise<Quote> {
    const id = generateId('QUO', input.sellerWorkspaceId);
    const now = new Date();
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'CREATE_QUOTE',
        ...input,
        createdAt: now,
        updatedAt: now,
      },
      { principalId: input.createdBy },
      session,
    );
    if (!state) throw new Error('Unexpected error');
    return this.mapQuote(state);
  }

  async updateQuoteStatus(
    id: string,
    status: QuoteStatus,
    userId: string,
  ): Promise<Quote | null> {
    const quote = await this.getQuoteById(id);
    if (!quote) {
      return null;
    }
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'UPDATE_QUOTE_STATUS',
        status,
      },
      { principalId: userId },
    );
    return state ? this.mapQuote(state) : null;
  }

  async updateQuote(
    id: string,
    updates: Partial<
      Pick<
        QuoteDoc,
        | 'sellersBuyerContactId'
        | 'sellersProjectId'
        | 'status'
        | 'currentRevisionId'
        | 'validUntil'
        | 'buyerUserId'
        | 'approvalConfirmation'
        | 'signatureS3Key'
        | 'buyerAcceptedFullLegalName'
      >
    >,
    userId: string,
    session?: ClientSession,
  ): Promise<Quote | null> {
    const quote = await this.getQuoteById(id);
    if (!quote) {
      return null;
    }

    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'UPDATE_QUOTE',
        ...updates,
      },
      { principalId: userId },
      session,
    );

    return state ? this.mapQuote(state) : null;
  }

  async getQuotesByIntakeFormSubmissionIds(
    submissionIds: readonly string[],
  ): Promise<(Quote | null)[]> {
    if (submissionIds.length === 0) {
      return [];
    }

    const docs = await this.collection
      .find({ intakeFormSubmissionId: { $in: [...submissionIds] } })
      .toArray();

    // Return in same order as input, null for missing
    return submissionIds.map((id) => {
      const doc = docs.find((d) => d.intakeFormSubmissionId === id);
      return doc ? this.mapQuote(doc) : null;
    });
  }
}

export const createQuotesModel = (config: { mongoClient: MongoClient }) => {
  return new QuotesModel(config);
};
