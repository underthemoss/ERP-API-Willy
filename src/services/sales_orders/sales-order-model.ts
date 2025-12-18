import { type MongoClient, type Db, type Collection, Filter } from 'mongodb';
import { generateId } from '../../lib/id-generator';

export type SalesOrderStatus = 'DRAFT' | 'SUBMITTED';

export type SalesOrderDoc = {
  _id: string;
  workspace_id: string;
  project_id?: string;
  buyer_id: string;
  purchase_order_number?: string;
  sales_order_number: string;
  intake_form_submission_id?: string;
  quote_id?: string;
  quote_revision_id?: string;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  status: SalesOrderStatus;
  deleted_at?: Date;
};

export class SalesOrdersModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'sales_orders';
  private db: Db;
  private collection: Collection<SalesOrderDoc>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<SalesOrderDoc>(this.collectionName);
  }

  async updateSalesOrderStatus(opts: {
    id: string;
    status: SalesOrderStatus;
    updatedBy: string;
  }): Promise<SalesOrderDoc | null> {
    const currentStatus = await this.collection.findOne({ _id: opts.id });

    if (opts.status === 'DRAFT' && currentStatus?.status !== 'DRAFT') {
      throw new Error(
        `Sales order can not be set to DRAFT from current status: ${currentStatus?.status}`,
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
      { returnDocument: 'after' },
    );
    return result;
  }

  async patchSalesOrder(
    id: string,
    patch: Partial<Omit<SalesOrderDoc, '_id' | 'created_at' | 'created_by'>>,
  ): Promise<SalesOrderDoc | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      {
        $set: patch,
      },
      { returnDocument: 'after' },
    );
    return result;
  }

  async getSalesOrdersByIds(orderIds: string[]): Promise<SalesOrderDoc[]> {
    if (!orderIds.length) return [];
    // Find all sales orders with order_id in the provided array
    const docs = await this.collection
      .find({ _id: { $in: orderIds }, deleted_at: { $exists: false } })
      .toArray();
    return docs;
  }

  async softDeleteSalesOrder(id: string, updatedBy: string): Promise<void> {
    const now = new Date();
    await this.collection.findOneAndUpdate(
      { _id: id, deleted_at: { $exists: false } },
      { $set: { deleted_at: now, updated_at: now, updated_by: updatedBy } },
      { returnDocument: 'after' },
    );
  }

  async getSalesOrderByIdAnyStatus(id: string): Promise<SalesOrderDoc | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ?? null;
  }

  async createSalesOrder(doc: Omit<SalesOrderDoc, '_id'>) {
    if (!doc.updated_by) {
      throw new Error('updated_by is required');
    }
    if (!doc.created_by) {
      throw new Error('created_by is required');
    }
    const salesOrderWithId: SalesOrderDoc = {
      _id: generateId('SO', doc.workspace_id),
      ...doc,
    };
    const result = await this.collection.insertOne(salesOrderWithId);
    if (!result.insertedId) {
      throw new Error('Failed to insert sales order');
    }
    // Fetch the inserted document from the database and return it
    const inserted = await this.collection.findOne({
      _id: salesOrderWithId._id,
    });
    if (!inserted) {
      throw new Error('Inserted sales order not found');
    }
    return inserted;
  }

  async getSalesOrders(
    options: {
      filter?: Filter<SalesOrderDoc>;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{
    data: SalesOrderDoc[];
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

  async getSalesOrdersByIntakeFormSubmissionIds(
    submissionIds: string[],
  ): Promise<SalesOrderDoc[]> {
    if (!submissionIds.length) return [];
    const docs = await this.collection
      .find({
        intake_form_submission_id: { $in: submissionIds },
        deleted_at: { $exists: false },
      })
      .toArray();
    return docs;
  }
}

export const createSalesOrdersModel = (config: {
  mongoClient: MongoClient;
}) => {
  const salesOrdersModel = new SalesOrdersModel(config);
  return salesOrdersModel;
};
