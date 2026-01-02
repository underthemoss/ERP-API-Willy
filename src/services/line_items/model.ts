import {
  type Collection,
  type Db,
  type MongoClient,
  type Filter,
} from 'mongodb';
import { type PricingSpec } from '../prices/prices-model';
import { generateId } from '../../lib/id-generator';

export type LineItemType = 'RENTAL' | 'SALE' | 'SERVICE' | 'WORK' | 'TRANSFER';
export type LineItemDocumentType =
  | 'QUOTE_REVISION'
  | 'SALES_ORDER'
  | 'PURCHASE_ORDER'
  | 'WORK_ORDER'
  | 'INTAKE_SUBMISSION';
export type LineItemProductKind =
  | 'CATALOG_PRODUCT'
  | 'MATERIAL_PRODUCT'
  | 'SERVICE_PRODUCT'
  | 'ASSEMBLY_PRODUCT'
  | 'PIM_CATEGORY'
  | 'PIM_PRODUCT';
export type LineItemConstraintStrength = 'REQUIRED' | 'PREFERRED' | 'EXCLUDED';
export type LineItemConstraintKind =
  | 'TAG'
  | 'ATTRIBUTE'
  | 'BRAND'
  | 'SCHEDULE'
  | 'LOCATION'
  | 'OTHER';

export type LineItemDocumentRef = {
  type: LineItemDocumentType;
  id: string;
  revisionId?: string | null;
};

export type LineItemProductRef = {
  kind: LineItemProductKind;
  productId: string;
};

export type LineItemPlaceKind =
  | 'JOBSITE'
  | 'BRANCH'
  | 'YARD'
  | 'ADDRESS'
  | 'GEOFENCE'
  | 'OTHER';

export type LineItemPlaceRef = {
  kind: LineItemPlaceKind;
  id: string;
};

export type LineItemTimeWindow = {
  startAt?: Date | null;
  endAt?: Date | null;
};

export type LineItemConstraintAttributeOp =
  | 'EQ'
  | 'NEQ'
  | 'IN'
  | 'NOT_IN'
  | 'GT'
  | 'GTE'
  | 'LT'
  | 'LTE';

export type LineItemConstraintDataTag = { tagIds: string[] };
export type LineItemConstraintDataAttribute = {
  attributeTypeId: string;
  op: LineItemConstraintAttributeOp;
  value: string | number | boolean;
  unitCode?: string | null;
  contextTags?: string[] | null;
};
export type LineItemConstraintDataBrand = {
  brandId?: string | null;
  manufacturerId?: string | null;
};
export type LineItemConstraintDataSchedule = {
  startAt?: Date | null;
  endAt?: Date | null;
};
export type LineItemConstraintDataLocation = {
  placeRef: LineItemPlaceRef;
};
export type LineItemConstraintDataOther = {
  note: string;
};

export type LineItemInputValue = {
  attributeTypeId: string;
  value: string | number | boolean;
  unitCode?: string | null;
  contextTags?: string[] | null;
};

export type ServiceScopeTask = {
  id: string;
  sourceTemplateId?: string | null;
  title: string;
  activityTagIds: string[];
  contextTagIds?: string[] | null;
  notes?: string | null;
};

export type LineItemConstraint =
  | {
      kind: 'TAG';
      strength: LineItemConstraintStrength;
      data: LineItemConstraintDataTag;
    }
  | {
      kind: 'ATTRIBUTE';
      strength: LineItemConstraintStrength;
      data: LineItemConstraintDataAttribute;
    }
  | {
      kind: 'BRAND';
      strength: LineItemConstraintStrength;
      data: LineItemConstraintDataBrand;
    }
  | {
      kind: 'SCHEDULE';
      strength: LineItemConstraintStrength;
      data: LineItemConstraintDataSchedule;
    }
  | {
      kind: 'LOCATION';
      strength: LineItemConstraintStrength;
      data: LineItemConstraintDataLocation;
    }
  | {
      kind: 'OTHER';
      strength: LineItemConstraintStrength;
      data: LineItemConstraintDataOther;
    };

export type LineItemPricingRef = {
  priceId?: string | null;
  priceBookId?: string | null;
  priceType?: LineItemType | null;
};

export type LineItemDelivery = {
  method?: 'PICKUP' | 'DELIVERY' | null;
  location?: string | null;
  notes?: string | null;
};

export type LineItemTargetSelector =
  | { kind: 'tags'; tagIds: string[] }
  | { kind: 'product'; targetProductId: string }
  | { kind: 'line_item'; targetLineItemIds: string[] };

export type LineItemStatus = 'DRAFT' | 'CONFIRMED' | 'SUBMITTED';

export type LineItemDoc = {
  _id: string;
  workspaceId: string;
  documentRef: LineItemDocumentRef;
  type: LineItemType;
  description: string;
  quantity: string;
  unitCode?: string | null;
  productRef?: LineItemProductRef | null;
  scopeTasks?: ServiceScopeTask[] | null;
  timeWindow?: LineItemTimeWindow | null;
  placeRef?: LineItemPlaceRef | null;
  constraints?: LineItemConstraint[] | null;
  inputs?: LineItemInputValue[] | null;
  pricingRef?: LineItemPricingRef | null;
  pricingSpecSnapshot?: PricingSpec | null;
  rateInCentsSnapshot?: number | null;
  subtotalInCents?: number | null;
  delivery?: LineItemDelivery | null;
  deliveryChargeInCents?: number | null;
  customPriceName?: string | null;
  notes?: string | null;
  targetSelectors?: LineItemTargetSelector[] | null;
  intakeFormSubmissionLineItemId?: string | null;
  quoteRevisionLineItemId?: string | null;
  sourceLineItemId?: string | null;
  status?: LineItemStatus | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  deletedAt?: Date | null;
};

export type LineItem = Omit<LineItemDoc, '_id'> & { id: string };

export type CreateLineItemInput = Omit<
  LineItemDoc,
  '_id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
>;

export type CreateLineItemDoc = Omit<LineItemDoc, '_id'>;

export type UpdateLineItemInput = Partial<
  Omit<LineItemDoc, '_id' | 'workspaceId' | 'documentRef' | 'createdAt'>
> & {
  updatedBy: string;
  updatedAt: Date;
};

export type ListLineItemsQuery = {
  filter: {
    workspaceId: string;
    documentRef?: Partial<LineItemDocumentRef>;
    type?: LineItemType;
    includeDeleted?: boolean;
  };
  page?: {
    number?: number;
    size?: number;
  };
};

export class LineItemsModel {
  private client: MongoClient;
  private db: Db;
  private collection: Collection<LineItemDoc>;
  private dbName = 'es-erp';
  private collectionName = 'line_items';

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<LineItemDoc>(this.collectionName);
  }

  private map(doc: LineItemDoc): LineItem {
    const { _id, ...fields } = doc;
    return { ...fields, id: _id };
  }

  async createLineItem(input: CreateLineItemDoc): Promise<LineItem> {
    const id = generateId('LITEM', input.workspaceId);
    const result = await this.collection.insertOne({
      ...input,
      _id: id,
    });
    if (!result.insertedId) {
      throw new Error('Failed to insert line item');
    }
    const doc = await this.collection.findOne({ _id: id });
    if (!doc) {
      throw new Error('Line item not found after insert');
    }
    return this.map(doc);
  }

  async getLineItemsByIds(
    ids: string[],
    opts?: { includeDeleted?: boolean },
  ): Promise<LineItem[]> {
    if (!ids.length) return [];
    const filter: Filter<LineItemDoc> = { _id: { $in: ids } };
    if (!opts?.includeDeleted) {
      filter.deletedAt = { $exists: false };
    }
    const docs = await this.collection.find(filter).toArray();
    return docs.map((doc) => this.map(doc));
  }

  async getLineItemByIdAnyStatus(id: string): Promise<LineItem | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.map(doc) : null;
  }

  async updateLineItem(
    id: string,
    updates: UpdateLineItemInput,
  ): Promise<LineItem | null> {
    await this.collection.updateOne({ _id: id }, { $set: { ...updates } });
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.map(doc) : null;
  }

  async softDeleteLineItem(id: string, updatedBy: string) {
    const now = new Date();
    await this.collection.updateOne(
      { _id: id, deletedAt: { $exists: false } },
      { $set: { deletedAt: now, updatedAt: now, updatedBy } },
    );
    return this.getLineItemByIdAnyStatus(id);
  }

  async listLineItems(query: ListLineItemsQuery) {
    const pageNumber = query.page?.number ?? 1;
    const pageSize = query.page?.size ?? 50;
    const skip = (pageNumber - 1) * pageSize;

    const includeDeleted = query.filter.includeDeleted ?? false;
    const deletedFilter = includeDeleted
      ? {}
      : { deletedAt: { $exists: false } };

    const filter: Filter<LineItemDoc> = {
      workspaceId: query.filter.workspaceId,
      ...deletedFilter,
    };

    if (query.filter.type) {
      filter.type = query.filter.type;
    }

    if (query.filter.documentRef?.type) {
      filter['documentRef.type'] = query.filter.documentRef.type;
    }
    if (query.filter.documentRef?.id) {
      filter['documentRef.id'] = query.filter.documentRef.id;
    }
    if (query.filter.documentRef?.revisionId) {
      filter['documentRef.revisionId'] = query.filter.documentRef.revisionId;
    }

    const [items, totalItems] = await Promise.all([
      this.collection
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .toArray(),
      this.collection.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      items: items.map((doc) => this.map(doc)),
      page: {
        number: pageNumber,
        size: pageSize,
        totalItems,
        totalPages,
      },
    };
  }

  async listLineItemsByDocumentRef(params: {
    workspaceId: string;
    documentRef: LineItemDocumentRef;
  }): Promise<LineItem[]> {
    const docs = await this.collection
      .find({
        workspaceId: params.workspaceId,
        'documentRef.type': params.documentRef.type,
        'documentRef.id': params.documentRef.id,
        ...(params.documentRef.revisionId
          ? { 'documentRef.revisionId': params.documentRef.revisionId }
          : {}),
        deletedAt: { $exists: false },
      })
      .toArray();
    return docs.map((doc) => this.map(doc));
  }

  async listLineItemsByIntakeFormSubmissionLineItemIds(
    lineItemIds: string[],
  ): Promise<LineItem[]> {
    if (!lineItemIds.length) return [];
    const docs = await this.collection
      .find({
        intakeFormSubmissionLineItemId: { $in: lineItemIds },
        deletedAt: { $exists: false },
      })
      .toArray();
    return docs.map((doc) => this.map(doc));
  }
}

export const createLineItemsModel = (config: { mongoClient: MongoClient }) =>
  new LineItemsModel(config);
