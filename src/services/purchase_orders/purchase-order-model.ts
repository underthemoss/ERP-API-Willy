import {
  type MongoClient,
  type Db,
  type Collection,
  Filter,
  ClientSession,
} from 'mongodb';
import { generateId } from '../../lib/id-generator';

export type PurchaseOrderStatus = 'DRAFT' | 'SUBMITTED';

export type PurchaseOrderDoc = {
  _id: string;
  workspace_id: string;
  project_id?: string;
  seller_id: string;
  purchase_order_number: string;
  quote_id?: string;
  quote_revision_id?: string;
  intake_form_submission_id?: string;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  status: PurchaseOrderStatus;
  deleted_at?: Date;
};

export class PurchaseOrdersModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'purchase_orders';
  private db: Db;
  private collection: Collection<PurchaseOrderDoc>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<PurchaseOrderDoc>(this.collectionName);
  }

  async updatePurchaseOrderStatus(
    opts: {
      id: string;
      status: PurchaseOrderStatus;
      updatedBy: string;
    },
    session?: ClientSession,
  ): Promise<PurchaseOrderDoc | null> {
    const currentStatus = await this.collection.findOne(
      { _id: opts.id },
      { session },
    );

    if (opts.status === 'DRAFT' && currentStatus?.status !== 'DRAFT') {
      throw new Error(
        `Purchase order can not be set to DRAFT from current status: ${currentStatus?.status}`,
      );
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: opts.id },
      {
        $set: {
          status: opts.status,
          updated_at: new Date(),
          updated_by: opts.updatedBy,
        },
      },
      { returnDocument: 'after', session },
    );
    return result;
  }

  async patchPurchaseOrder(
    id: string,
    patch: Partial<Omit<PurchaseOrderDoc, '_id' | 'created_at' | 'created_by'>>,
  ): Promise<PurchaseOrderDoc | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      {
        $set: patch,
      },
      { returnDocument: 'after' },
    );
    return result;
  }

  async getPurchaseOrdersByIds(
    orderIds: string[],
  ): Promise<PurchaseOrderDoc[]> {
    if (!orderIds.length) return [];
    // Find all purchase orders with order_id in the provided array
    const docs = await this.collection
      .find({ _id: { $in: orderIds }, deleted_at: { $exists: false } })
      .toArray();
    return docs;
  }

  async softDeletePurchaseOrder(id: string, updatedBy: string): Promise<void> {
    const now = new Date();
    await this.collection.findOneAndUpdate(
      { _id: id, deleted_at: { $exists: false } },
      { $set: { deleted_at: now, updated_at: now, updated_by: updatedBy } },
      { returnDocument: 'after' },
    );
  }

  async getPurchaseOrderByIdAnyStatus(
    id: string,
  ): Promise<PurchaseOrderDoc | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ?? null;
  }

  async createPurchaseOrder(doc: Omit<PurchaseOrderDoc, '_id'>) {
    if (!doc.updated_by) {
      throw new Error('updated_by is required');
    }
    if (!doc.created_by) {
      throw new Error('created_by is required');
    }
    const purchaseOrderWithId: PurchaseOrderDoc = {
      _id: generateId('PO', doc.workspace_id),
      ...doc,
    };
    const result = await this.collection.insertOne(purchaseOrderWithId);
    if (!result.insertedId) {
      throw new Error('Failed to insert purchase order');
    }
    // Fetch the inserted document from the database and return it
    const inserted = await this.collection.findOne({
      _id: purchaseOrderWithId._id,
    });
    if (!inserted) {
      throw new Error('Inserted purchase order not found');
    }
    return inserted;
  }

  async getPurchaseOrders(
    options: {
      filter?: Filter<PurchaseOrderDoc>;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{
    data: PurchaseOrderDoc[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const { filter = {}, limit = 20, offset = 0 } = options;
    const mergedFilter = { ...filter, deleted_at: { $exists: false } };
    const cursor = this.collection.find(mergedFilter).skip(offset).limit(limit);
    const [data, total] = await Promise.all([
      cursor.toArray(),
      this.collection.countDocuments(mergedFilter),
    ]);
    return { data, total, limit, offset };
  }
}

export const createPurchaseOrdersModel = (config: {
  mongoClient: MongoClient;
}) => {
  const purchaseOrdersModel = new PurchaseOrdersModel(config);
  return purchaseOrdersModel;
};
