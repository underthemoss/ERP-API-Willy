import { MongoClient, Db, Collection } from 'mongodb';
import { generateId } from '../../lib/id-generator';

type LineItemType = 'RENTAL' | 'SALE';

export const LINEITEM_STATUS = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  SUBMITTED: 'SUBMITTED',
} as const;
export type LineItemStatus = keyof typeof LINEITEM_STATUS;

interface BasePurchaseOrderLineItemDoc<T extends LineItemType = LineItemType> {
  _id: string;
  purchase_order_id: string;
  intake_form_submission_line_item_id?: string;
  quote_revision_line_item_id?: string;
  po_pim_id?: string;
  po_quantity?: number;
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

export interface RentalPurchaseOrderLineItemDoc
  extends BasePurchaseOrderLineItemDoc<'RENTAL'> {
  off_rent_date?: Date;
}

export interface SalePurchaseOrderLineItemDoc
  extends BasePurchaseOrderLineItemDoc<'SALE'> {}

export type PurchaseOrderLineItemDoc =
  | RentalPurchaseOrderLineItemDoc
  | SalePurchaseOrderLineItemDoc;

export class PurchaseOrderLineItemsModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'purchase_order_line_items';
  private db: Db;
  private collection: Collection<PurchaseOrderLineItemDoc>;
  private ID_PREFIX: string;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<PurchaseOrderLineItemDoc>(
      this.collectionName,
    );
    this.ID_PREFIX = 'POLI';
  }

  generatePOLineItemId(tenantId: string): string {
    return generateId(this.ID_PREFIX, tenantId);
  }

  async createLineItem(doc: Omit<PurchaseOrderLineItemDoc, '_id'>) {
    if (!doc.updated_by) throw new Error('updated_by is required');
    if (!doc.created_by) throw new Error('created_by is required');

    let lineItemWithId: PurchaseOrderLineItemDoc;
    if (doc.lineitem_type === 'RENTAL') {
      lineItemWithId = {
        _id: this.generatePOLineItemId(doc.purchase_order_id),
        ...(doc as Omit<RentalPurchaseOrderLineItemDoc, '_id'>),
      };
    } else if (doc.lineitem_type === 'SALE') {
      lineItemWithId = {
        _id: this.generatePOLineItemId(doc.purchase_order_id),
        ...(doc as Omit<SalePurchaseOrderLineItemDoc, '_id'>),
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

  async getLineItemsByIds(ids: string[]): Promise<PurchaseOrderLineItemDoc[]> {
    if (!ids.length) return [];
    return this.collection
      .find({ _id: { $in: ids }, deleted_at: { $exists: false } })
      .toArray();
  }

  async getLineItemsByPurchaseOrderId(
    purchase_order_id: string,
  ): Promise<PurchaseOrderLineItemDoc[]> {
    return this.collection
      .find({
        purchase_order_id,
        deleted_at: { $exists: false },
        lineitem_status: { $ne: 'DRAFT' },
      })
      .toArray();
  }

  async getLineItemsByPurchaseOrderIdAndCompanyId(
    purchase_order_id: string,
  ): Promise<PurchaseOrderLineItemDoc[]> {
    return this.collection
      .find({
        purchase_order_id,
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
      Omit<PurchaseOrderLineItemDoc, '_id' | 'created_by' | 'created_at'>
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
  ): Promise<PurchaseOrderLineItemDoc | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ?? null;
  }

  async getPurchaseOrderItemsById(
    ids: string[],
  ): Promise<PurchaseOrderLineItemDoc[]> {
    if (!ids.length) return [];
    const docs = await this.collection.find({ _id: { $in: ids } }).toArray();
    return docs;
  }
}

export const createPurchaseOrderLineItemsModel = (config: {
  mongoClient: MongoClient;
}) => {
  return new PurchaseOrderLineItemsModel(config);
};
