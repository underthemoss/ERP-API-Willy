import {
  type MongoClient,
  type Db,
  type Collection,
  WithTransactionCallback,
  ClientSession,
} from 'mongodb';
import { generateId } from '../../lib/id-generator';

type BaseGeneratedFields = '_id' | 'createdAt' | 'updatedAt';

type PriceBookDoc = {
  _id: string;
  workspaceId: string;
  parentPriceBookId?: string;
  parentPriceBookPercentageFactor?: number;
  name: string;
  notes: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
  businessContactId?: string;
  projectId?: string;
  location?: string;
  deleted: boolean;
};

// DTOs
export type PriceBook = Omit<PriceBookDoc, '_id'> & { id: string };

// input types
export type CreatePriceBookInput = Omit<
  PriceBookDoc,
  BaseGeneratedFields | 'deleted'
>;

export type UpdatePriceBookInput = {
  name?: string; // Required field, cannot be null
  notes?: string | null;
  location?: string | null;
  businessContactId?: string | null;
  projectId?: string | null;
  updatedBy: string;
};

export type ListPriceBooksQuery = {
  filter: {
    workspaceId: string;
    parentPriceBookId?: string;
    businessContactId?: string;
    projectId?: string;
  };
  page?: {
    size?: number;
    number?: number;
  };
};

export class PriceBookModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'price_books';
  private db: Db;
  private collection: Collection<PriceBookDoc>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<PriceBookDoc>(this.collectionName);
  }

  withTransaction<T = any>(
    cb: WithTransactionCallback<T>,
    options?: Parameters<ClientSession['withTransaction']>[1],
  ) {
    return this.client.withSession<T>((session) => {
      return session.withTransaction<T>(cb, options);
    });
  }

  private mapPriceBook(doc: PriceBookDoc): PriceBook {
    const { _id, ...fields } = doc;
    return { ...fields, id: doc._id };
  }

  async createPriceBook(
    input: CreatePriceBookInput,
    session?: ClientSession,
  ): Promise<PriceBook> {
    const now = new Date();
    const result = await this.collection.insertOne(
      {
        ...input,
        _id: generateId('PB', input.workspaceId),
        createdAt: now,
        updatedAt: now,
        deleted: false,
      },
      { session },
    );

    const doc = await this.collection.findOne<PriceBookDoc>(
      {
        _id: result.insertedId,
      },
      { session },
    );
    if (!doc) {
      throw new Error('Price book not found');
    }
    return this.mapPriceBook(doc);
  }

  async listPriceBooks(query: ListPriceBooksQuery): Promise<PriceBook[]> {
    const { filter = {}, page } = query;
    const limit = page?.size ?? 10;
    const skip = page?.number ? (page.number - 1) * limit : 0;
    const docs = await this.collection
      .find({ ...filter, deleted: { $ne: true } }, { limit, skip })
      .toArray();
    return docs.map((doc) => this.mapPriceBook(doc));
  }

  async countPriceBooks(
    filter: ListPriceBooksQuery['filter'],
  ): Promise<number> {
    return this.collection.countDocuments({
      ...filter,
      deleted: { $ne: true },
    });
  }

  async deletePriceBookById(id: string): Promise<void> {
    const result = await this.collection.updateOne(
      { _id: id },
      { $set: { deleted: true } },
    );
    if (result.matchedCount === 0) {
      throw new Error('Price book not found');
    }
  }

  async getPriceBookById(id: string): Promise<PriceBook | null> {
    const doc = await this.collection.findOne<PriceBookDoc>({
      _id: id,
      deleted: { $ne: true },
    });
    if (!doc) {
      return null;
    }
    return this.mapPriceBook(doc);
  }

  async batchGetPriceBooksById(
    ids: readonly string[],
  ): Promise<Array<PriceBook | null>> {
    const priceBooks = await this.collection
      .find({ _id: { $in: ids }, deleted: { $ne: true } })
      .toArray();

    const mappedPriceBooks = new Map(
      priceBooks.map((priceBook) => [
        String(priceBook._id),
        this.mapPriceBook(priceBook),
      ]),
    );

    return ids.map((id) => mappedPriceBooks.get(id) ?? null);
  }

  async updatePriceBook(
    id: string,
    update: UpdatePriceBookInput,
  ): Promise<PriceBook> {
    const now = new Date();
    const updateDoc: any = {
      $set: {
        updatedAt: now,
        updatedBy: update.updatedBy,
      },
      $unset: {},
    };

    // Handle name update (required field, cannot be null)
    if (update.name !== undefined) {
      updateDoc.$set.name = update.name;
    }

    // Handle nullable fields (allow clearing by passing null)
    if (update.notes !== undefined) {
      if (update.notes === null) {
        updateDoc.$unset.notes = '';
      } else {
        updateDoc.$set.notes = update.notes;
      }
    }

    if (update.location !== undefined) {
      if (update.location === null) {
        updateDoc.$unset.location = '';
      } else {
        updateDoc.$set.location = update.location;
      }
    }

    if (update.businessContactId !== undefined) {
      if (update.businessContactId === null) {
        updateDoc.$unset.businessContactId = '';
      } else {
        updateDoc.$set.businessContactId = update.businessContactId;
      }
    }

    if (update.projectId !== undefined) {
      if (update.projectId === null) {
        updateDoc.$unset.projectId = '';
      } else {
        updateDoc.$set.projectId = update.projectId;
      }
    }

    // Remove $unset if empty
    if (Object.keys(updateDoc.$unset).length === 0) {
      delete updateDoc.$unset;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: id, deleted: { $ne: true } },
      updateDoc,
      { returnDocument: 'after' },
    );

    if (!result) {
      throw new Error('Price book not found');
    }

    return this.mapPriceBook(result);
  }
}

export const createPriceBookModel = (config: { mongoClient: MongoClient }) => {
  const priceBookModel = new PriceBookModel(config);
  return priceBookModel;
};
