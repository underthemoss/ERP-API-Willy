import { MongoClient, Collection } from 'mongodb';

type LegacySalesOrderLineItem = {
  _id: string;
  sales_order_id: string;
  intake_form_submission_line_item_id?: string;
  quote_revision_line_item_id?: string;
  so_pim_id?: string;
  so_quantity?: number;
  lineitem_type: 'RENTAL' | 'SALE';
  price_id?: string;
  lineitem_status?: string;
  deleted_at?: Date;
  deliveryNotes?: string;
  delivery_location?: string;
  delivery_charge_in_cents?: number;
  delivery_date?: Date | string;
  off_rent_date?: Date | string;
  delivery_method?: 'DELIVERY' | 'PICKUP';
  created_at?: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
};

type LegacyPurchaseOrderLineItem = {
  _id: string;
  purchase_order_id: string;
  intake_form_submission_line_item_id?: string;
  quote_revision_line_item_id?: string;
  po_pim_id?: string;
  po_quantity?: number;
  lineitem_type: 'RENTAL' | 'SALE';
  price_id?: string;
  lineitem_status?: string;
  deleted_at?: Date;
  deliveryNotes?: string;
  delivery_location?: string;
  delivery_charge_in_cents?: number;
  delivery_date?: Date | string;
  off_rent_date?: Date | string;
  delivery_method?: 'DELIVERY' | 'PICKUP';
  created_at?: Date;
  created_by?: string;
  updated_at?: Date;
  updated_by?: string;
};

type LineItemDoc = {
  _id: string;
  workspaceId: string;
  documentRef: {
    type: 'SALES_ORDER' | 'PURCHASE_ORDER';
    id: string;
    revisionId?: string | null;
  };
  type: 'RENTAL' | 'SALE';
  description: string;
  quantity: string;
  unitCode?: string | null;
  productRef?: {
    kind: 'PIM_PRODUCT';
    productId: string;
  } | null;
  timeWindow?: { startAt?: Date | null; endAt?: Date | null } | null;
  placeRef?: LineItemPlaceRef | null;
  constraints?: null;
  pricingRef?: { priceId?: string | null } | null;
  subtotalInCents?: number | null;
  delivery?: {
    method?: 'PICKUP' | 'DELIVERY' | null;
    location?: string | null;
    notes?: string | null;
  } | null;
  deliveryChargeInCents?: number | null;
  notes?: string | null;
  targetSelectors?: null;
  intakeFormSubmissionLineItemId?: string | null;
  quoteRevisionLineItemId?: string | null;
  status?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  deletedAt?: Date | null;
};

type LineItemPlaceKind =
  | 'JOBSITE'
  | 'BRANCH'
  | 'YARD'
  | 'ADDRESS'
  | 'GEOFENCE'
  | 'OTHER';

type LineItemPlaceRef = {
  kind: LineItemPlaceKind;
  id: string;
};

const parseDateValue = (value?: string | Date | null) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatQuantityString = (value?: number | null) => {
  if (value === undefined || value === null) return '1';
  return Number.isFinite(value) ? value.toString() : '1';
};

const buildTimeWindow = (start?: string | Date | null, end?: string | Date | null) => {
  const startAt = parseDateValue(start);
  const endAt = parseDateValue(end);
  if (!startAt && !endAt) return null;
  return { startAt, endAt };
};

const buildDelivery = (
  method?: 'DELIVERY' | 'PICKUP',
  location?: string,
  notes?: string,
) => {
  if (!method && !location && !notes) return null;
  return {
    method: method ?? null,
    location: location ?? null,
    notes: notes ?? null,
  };
};

const mapLegacySalesLineItem = (
  item: LegacySalesOrderLineItem,
  workspaceId: string,
): LineItemDoc => {
  const timeWindow = buildTimeWindow(item.delivery_date, item.off_rent_date);
  const delivery = buildDelivery(
    item.delivery_method,
    item.delivery_location,
    item.deliveryNotes,
  );
  const now = new Date();
  return {
    _id: item._id,
    workspaceId,
    documentRef: { type: 'SALES_ORDER', id: item.sales_order_id },
    type: item.lineitem_type,
    description: item.so_pim_id
      ? `PIM ${item.so_pim_id}`
      : `${item.lineitem_type} line item`,
    quantity: formatQuantityString(item.so_quantity),
    unitCode: null,
    productRef: item.so_pim_id
      ? { kind: 'PIM_PRODUCT', productId: item.so_pim_id }
      : null,
    timeWindow,
    placeRef: null,
    constraints: null,
    pricingRef: item.price_id ? { priceId: item.price_id } : null,
    subtotalInCents: null,
    delivery,
    deliveryChargeInCents: item.delivery_charge_in_cents ?? null,
    notes: null,
    targetSelectors: null,
    intakeFormSubmissionLineItemId:
      item.intake_form_submission_line_item_id ?? null,
    quoteRevisionLineItemId: item.quote_revision_line_item_id ?? null,
    status: item.lineitem_status ?? null,
    createdAt: item.created_at ?? now,
    updatedAt: item.updated_at ?? now,
    createdBy: item.created_by ?? 'system',
    updatedBy: item.updated_by ?? item.created_by ?? 'system',
    ...(item.deleted_at ? { deletedAt: item.deleted_at } : {}),
  };
};

const mapLegacyPurchaseLineItem = (
  item: LegacyPurchaseOrderLineItem,
  workspaceId: string,
): LineItemDoc => {
  const timeWindow = buildTimeWindow(item.delivery_date, item.off_rent_date);
  const delivery = buildDelivery(
    item.delivery_method,
    item.delivery_location,
    item.deliveryNotes,
  );
  const now = new Date();
  return {
    _id: item._id,
    workspaceId,
    documentRef: { type: 'PURCHASE_ORDER', id: item.purchase_order_id },
    type: item.lineitem_type,
    description: item.po_pim_id
      ? `PIM ${item.po_pim_id}`
      : `${item.lineitem_type} line item`,
    quantity: formatQuantityString(item.po_quantity),
    unitCode: null,
    productRef: item.po_pim_id
      ? { kind: 'PIM_PRODUCT', productId: item.po_pim_id }
      : null,
    timeWindow,
    placeRef: null,
    constraints: null,
    pricingRef: item.price_id ? { priceId: item.price_id } : null,
    subtotalInCents: null,
    delivery,
    deliveryChargeInCents: item.delivery_charge_in_cents ?? null,
    notes: null,
    targetSelectors: null,
    intakeFormSubmissionLineItemId:
      item.intake_form_submission_line_item_id ?? null,
    quoteRevisionLineItemId: item.quote_revision_line_item_id ?? null,
    status: item.lineitem_status ?? null,
    createdAt: item.created_at ?? now,
    updatedAt: item.updated_at ?? now,
    createdBy: item.created_by ?? 'system',
    updatedBy: item.updated_by ?? item.created_by ?? 'system',
    ...(item.deleted_at ? { deletedAt: item.deleted_at } : {}),
  };
};

const writeBatches = async (
  ops: Parameters<Collection<LineItemDoc>['bulkWrite']>[0],
  collection: Collection<LineItemDoc>,
  batchSize: number,
) => {
  for (let i = 0; i < ops.length; i += batchSize) {
    const batch = ops.slice(i, i + batchSize);
    if (!batch.length) continue;
    await collection.bulkWrite(batch, { ordered: false });
  }
};

const main = async () => {
  const uri = process.env.MONGO_CONNECTION_STRING;
  if (!uri) {
    throw new Error('MONGO_CONNECTION_STRING is required');
  }
  const dbName = process.env.MONGO_DB_NAME || 'es-erp';
  const batchSize = Number(process.env.BATCH_SIZE ?? 500);

  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db(dbName);
  const lineItemsCollection = db.collection<LineItemDoc>('line_items');

  const salesOrders = await db
    .collection('sales_orders')
    .find({}, { projection: { _id: 1, workspace_id: 1 } })
    .toArray();
  const purchaseOrders = await db
    .collection('purchase_orders')
    .find({}, { projection: { _id: 1, workspace_id: 1 } })
    .toArray();

  const salesOrderWorkspaceById = new Map(
    salesOrders.map((order) => [order._id, order.workspace_id]),
  );
  const purchaseOrderWorkspaceById = new Map(
    purchaseOrders.map((order) => [order._id, order.workspace_id]),
  );

  const salesLineItems = await db
    .collection<LegacySalesOrderLineItem>('sales_order_line_items')
    .find({})
    .toArray();
  const purchaseLineItems = await db
    .collection<LegacyPurchaseOrderLineItem>('purchase_order_line_items')
    .find({})
    .toArray();

  let skipped = 0;
  const ops: Parameters<Collection<LineItemDoc>['bulkWrite']>[0] = [];

  for (const item of salesLineItems) {
    const workspaceId = salesOrderWorkspaceById.get(item.sales_order_id);
    if (!workspaceId) {
      skipped += 1;
      continue;
    }
    const doc = mapLegacySalesLineItem(item, workspaceId);
    ops.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $setOnInsert: doc },
        upsert: true,
      },
    });
  }

  for (const item of purchaseLineItems) {
    const workspaceId = purchaseOrderWorkspaceById.get(item.purchase_order_id);
    if (!workspaceId) {
      skipped += 1;
      continue;
    }
    const doc = mapLegacyPurchaseLineItem(item, workspaceId);
    ops.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $setOnInsert: doc },
        upsert: true,
      },
    });
  }

  if (ops.length) {
    await writeBatches(ops, lineItemsCollection, batchSize);
  }

  console.log(
    JSON.stringify(
      {
        dbName,
        attempted: ops.length,
        skipped,
        salesLineItems: salesLineItems.length,
        purchaseLineItems: purchaseLineItems.length,
      },
      null,
      2,
    ),
  );

  await client.close();
};

main().catch((error) => {
  console.error('Line item backfill failed:', error);
  process.exit(1);
});
