import { MongoClient, Db, Collection } from 'mongodb';
import { generateId } from '../../lib/id-generator';

type LineItemType = 'RENTAL' | 'SALE';

export const LINEITEM_STATUS = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  SUBMITTED: 'SUBMITTED',
} as const;
export type LineItemStatus = keyof typeof LINEITEM_STATUS;

interface BaseSalesOrderLineItemDoc<T extends LineItemType = LineItemType> {
  _id: string;
  sales_order_id: string;
  intake_form_submission_line_item_id?: string;
  quote_revision_line_item_id?: string;
  so_pim_id?: string;
  so_quantity?: number;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  lineitem_type: T;
  price_id?: string;
  lineitem_status?: LineItemStatus;
  deleted_at?: Date;
  deliveryNotes?: string;
  delivery_location?: string;
  delivery_charge_in_cents?: number;
  delivery_date?: Date;
  delivery_method?: 'DELIVERY' | 'PICKUP';
}

export interface RentalSalesOrderLineItemDoc
  extends BaseSalesOrderLineItemDoc<'RENTAL'> {
  off_rent_date?: Date;
}

export interface SaleSalesOrderLineItemDoc
  extends BaseSalesOrderLineItemDoc<'SALE'> {}

export type SalesOrderLineItemDoc =
  | RentalSalesOrderLineItemDoc
  | SaleSalesOrderLineItemDoc;

export class SalesOrderLineItemsModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'sales_order_line_items';
  private db: Db;
  private collection: Collection<SalesOrderLineItemDoc>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<SalesOrderLineItemDoc>(
      this.collectionName,
    );
  }

  async createLineItem(doc: Omit<SalesOrderLineItemDoc, '_id'>) {
    if (!doc.updated_by) throw new Error('updated_by is required');
    if (!doc.created_by) throw new Error('created_by is required');

    let lineItemWithId: SalesOrderLineItemDoc;
    if (doc.lineitem_type === 'RENTAL') {
      lineItemWithId = {
        _id: generateId('SOLI', doc.sales_order_id),
        ...(doc as Omit<RentalSalesOrderLineItemDoc, '_id'>),
      };
    } else if (doc.lineitem_type === 'SALE') {
      lineItemWithId = {
        _id: generateId('SOLI', doc.sales_order_id),
        ...(doc as Omit<SaleSalesOrderLineItemDoc, '_id'>),
      };
    } else {
      throw new Error('Invalid lineitem_type');
    }

    const result = await this.collection.insertOne(lineItemWithId);
    if (!result.insertedId) throw new Error('Failed to insert line item');
    const inserted = await this.collection.findOne({ _id: lineItemWithId._id });
    if (!inserted) throw new Error('Inserted line item not found');
    return inserted;
  }

  async getLineItemsByIds(ids: string[]): Promise<SalesOrderLineItemDoc[]> {
    if (!ids.length) return [];
    return this.collection
      .find({ _id: { $in: ids }, deleted_at: { $exists: false } })
      .toArray();
  }

  async getLineItemsBySalesOrderId(
    sales_order_id: string,
  ): Promise<SalesOrderLineItemDoc[]> {
    return this.collection
      .find({ sales_order_id, deleted_at: { $exists: false } })
      .toArray();
  }

  async getLineItemsBySalesOrderIdAndCompanyId(
    sales_order_id: string,
  ): Promise<SalesOrderLineItemDoc[]> {
    return this.collection
      .find({
        sales_order_id,
        deleted_at: { $exists: false },
        lineitem_status: { $ne: 'DRAFT' },
      })
      .toArray();
  }

  async softDeleteLineItem(id: string, updated_by: string): Promise<void> {
    const now = new Date();
    await this.collection.findOneAndUpdate(
      { _id: id, deleted_at: { $exists: false } },
      { $set: { deleted_at: now, updated_at: now, updated_by } },
      { returnDocument: 'after' },
    );
  }

  async patchLineItem(
    id: string,
    patch: Partial<
      Omit<SalesOrderLineItemDoc, '_id' | 'created_by' | 'created_at'>
    >,
  ): Promise<void> {
    const { _id, created_by, created_at, ...allowedPatch } = patch as any;
    await this.collection.findOneAndUpdate(
      { _id: id },
      { $set: allowedPatch },
      { returnDocument: 'after' },
    );
  }

  // Fetch a line item by id regardless of deleted_at status
  async getLineItemByIdAnyStatus(
    id: string,
  ): Promise<SalesOrderLineItemDoc | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ?? null;
  }

  async getSalesOrderItemsById(
    ids: string[],
  ): Promise<SalesOrderLineItemDoc[]> {
    if (!ids.length) return [];
    const docs = await this.collection.find({ _id: { $in: ids } }).toArray();
    return docs;
  }

  async getSalesOrderLineItemsByIntakeFormSubmissionLineItemIds(
    lineItemIds: string[],
  ): Promise<SalesOrderLineItemDoc[]> {
    if (!lineItemIds.length) return [];
    return this.collection
      .find({
        intake_form_submission_line_item_id: { $in: lineItemIds },
        deleted_at: { $exists: false },
      })
      .toArray();
  }
}

export const createSalesOrderLineItemsModel = (config: {
  mongoClient: MongoClient;
}) => {
  return new SalesOrderLineItemsModel(config);
};
