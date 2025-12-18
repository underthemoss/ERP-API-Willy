import {
  type MongoClient,
  type Db,
  type Collection,
  type Filter,
  ClientSession,
} from 'mongodb';
import {
  createInventoryEventStore,
  InventoryEventStore,
} from './inventoryEventStore';
import { generateId } from '../../lib/id-generator';

export type InventoryStatus = 'ON_ORDER' | 'RECEIVED';

export type InventoryCondition = 'NEW' | 'USED' | 'DAMAGED' | 'REFURBISHED';

export type InventoryDoc = {
  _id: string;
  companyId: string;
  workspaceId?: string;
  status: InventoryStatus;
  fulfilmentId?: string;
  purchaseOrderId?: string;
  purchaseOrderLineItemId?: string;
  isThirdPartyRental: boolean;
  assetId?: string;
  pimCategoryId?: string;
  pimCategoryPath?: string;
  pimCategoryName?: string;
  pimProductId?: string;
  receivedAt?: Date;
  receiptNotes?: string;
  resourceMapId?: string;
  conditionOnReceipt?: InventoryCondition;
  conditionNotes?: string;
  expectedReturnDate?: Date;
  actualReturnDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
};

export type Inventory = Omit<InventoryDoc, '_id'> & { id: string };

export type CreateInventoryInput = {
  workspaceId?: string;
  status: InventoryStatus;
  fulfilmentId?: string;
  purchaseOrderId?: string;
  purchaseOrderLineItemId?: string;
  isThirdPartyRental: boolean;
  assetId?: string;
  pimCategoryId?: string;
  pimCategoryPath?: string;
  pimCategoryName?: string;
  pimProductId?: string;
  expectedReturnDate?: Date;
  actualReturnDate?: Date;
};

export type UpdateInventorySerialisedIdInput = {
  assetId: string;
};

export type MarkInventoryReceivedInput = {
  receivedAt?: Date;
  receiptNotes?: string;
  pimProductId?: string;
  resourceMapId?: string;
  conditionOnReceipt?: InventoryCondition;
  conditionNotes?: string;
  expectedReturnDate?: Date;
  assetId?: string;
};

export type DeleteInventoryInput = {
  reason: string;
};

export type ListInventoryFilter = Partial<
  Pick<
    InventoryDoc,
    | 'companyId'
    | 'workspaceId'
    | 'status'
    | 'isThirdPartyRental'
    | 'fulfilmentId'
    | 'purchaseOrderId'
    | 'assetId'
    | 'pimCategoryPath'
  > & {
    excludedInventoryIds?: string[];
  }
>;

export type ListInventoryQuery = {
  filter: ListInventoryFilter;
  page?: {
    size?: number;
    number?: number;
  };
};

export type InventoryGroupedByCategory = {
  pimCategoryId?: string;
  pimCategoryName?: string;
  pimCategoryPath?: string;
  quantityOnOrder: number;
  quantityReceived: number;
  totalQuantity: number;
  sampleInventoryIds: string[];
};

export class InventoryModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'inventory';
  private db: Db;
  private collection: Collection<InventoryDoc>;
  private eventStore: InventoryEventStore;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<InventoryDoc>(this.collectionName);
    this.eventStore = createInventoryEventStore({ mongoClient: this.client });
  }

  mapInventory(doc: InventoryDoc): Inventory {
    const { _id, ...fields } = doc;
    return { ...fields, id: _id };
  }

  private buildMongoFilter(filter: ListInventoryFilter) {
    const { pimCategoryPath, excludedInventoryIds, ...otherFilters } = filter;

    // Filter out undefined values from otherFilters
    const cleanedFilters = Object.entries(otherFilters).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {} as any,
    );

    const generatedFilter: Filter<InventoryDoc> = {
      ...cleanedFilters,
    };

    // Handle excluded inventory IDs
    if (excludedInventoryIds && excludedInventoryIds.length > 0) {
      generatedFilter._id = { $nin: excludedInventoryIds };
    }

    // Handle PIM category hierarchical filtering
    if (pimCategoryPath) {
      // Create regex pattern for hierarchical matching
      // If path is "|A|B|C|", we want to match any paths that start with "|A|B|C|"
      // This will match both exact "|A|B|C|" and hierarchical "|A|B|C|D|", "|A|B|C|D|E|", etc.

      const escaped = pimCategoryPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Normalize: ensure pattern ends with a single literal pipe to anchor at segment boundary
      const normalized = escaped.endsWith('\\|') ? escaped : `${escaped}\\|`;

      generatedFilter.pimCategoryPath = {
        $regex: new RegExp(`^${normalized}`),
      };
    }

    return generatedFilter;
  }

  async listInventory({
    filter,
    page,
  }: ListInventoryQuery): Promise<Inventory[]> {
    const limit = page?.size || 10;
    const skip = page?.number ? (page.number - 1) * limit : 0;

    // Clean up filter to remove undefined values
    const mongoFilter = this.buildMongoFilter(filter);

    const docs = await this.collection
      .find(mongoFilter)
      .limit(limit)
      .skip(skip)
      .toArray();
    return docs.map((d) => this.mapInventory(d));
  }

  async countInventory(filter: ListInventoryFilter): Promise<number> {
    // Clean up filter to remove undefined values
    const cleanFilter = Object.entries(filter).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    return this.collection.countDocuments(cleanFilter);
  }

  async getInventoryById(
    id: string,
    companyId: string,
  ): Promise<Inventory | null> {
    const doc = await this.collection.findOne({ _id: id, companyId });
    return doc ? this.mapInventory(doc) : null;
  }

  async createInventory(
    input: CreateInventoryInput & { companyId: string },
    principalId: string,
    session?: ClientSession,
  ): Promise<Inventory> {
    const id = generateId('INV', input.companyId);
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'CREATE_INVENTORY',
        companyId: input.companyId,
        workspaceId: input.workspaceId,
        status: input.status,
        fulfilmentId: input.fulfilmentId,
        purchaseOrderId: input.purchaseOrderId,
        purchaseOrderLineItemId: input.purchaseOrderLineItemId,
        isThirdPartyRental: input.isThirdPartyRental,
        assetId: input.assetId,
        pimCategoryId: input.pimCategoryId,
        pimCategoryPath: input.pimCategoryPath,
        pimCategoryName: input.pimCategoryName,
        pimProductId: input.pimProductId,
        expectedReturnDate: input.expectedReturnDate?.toISOString(),
        actualReturnDate: input.actualReturnDate?.toISOString(),
      },
      { principalId },
      session,
    );
    if (!state) throw new Error('Unexpected error');
    return this.mapInventory(state);
  }

  async markInventoryReceived(
    id: string,
    companyId: string,
    input: MarkInventoryReceivedInput | undefined,
    principalId: string,
    session?: ClientSession,
  ): Promise<Inventory | null> {
    // Ensure the inventory belongs to the company before updating
    const inventory = await this.getInventoryById(id, companyId);
    if (!inventory) {
      return null;
    }

    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'INVENTORY_RECEIVED',
        receivedAt: input?.receivedAt?.toISOString(),
        receiptNotes: input?.receiptNotes,
        pimProductId: input?.pimProductId,
        resourceMapId: input?.resourceMapId,
        conditionOnReceipt: input?.conditionOnReceipt,
        conditionNotes: input?.conditionNotes,
        expectedReturnDate: input?.expectedReturnDate?.toISOString(),
        assetId: input?.assetId,
      },
      { principalId },
      session,
    );
    return state ? this.mapInventory(state) : null;
  }

  async updateInventorySerialisedId(
    id: string,
    companyId: string,
    input: UpdateInventorySerialisedIdInput,
    principalId: string,
    session?: ClientSession,
  ): Promise<Inventory | null> {
    // Ensure the inventory belongs to the company before updating
    const inventory = await this.getInventoryById(id, companyId);
    if (!inventory) {
      return null;
    }

    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'UPDATE_INVENTORY_SERIALISED_ID',
        assetId: input.assetId,
      },
      { principalId },
      session,
    );
    return state ? this.mapInventory(state) : null;
  }

  async updateInventoryExpectedReturnDate(
    id: string,
    companyId: string,
    expectedReturnDate: Date,
    principalId: string,
    session?: ClientSession,
  ): Promise<Inventory | null> {
    // Ensure the inventory belongs to the company before updating
    const inventory = await this.getInventoryById(id, companyId);
    if (!inventory) {
      return null;
    }

    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'UPDATE_INVENTORY_EXPECTED_RETURN_DATE',
        expectedReturnDate: expectedReturnDate.toISOString(),
      },
      { principalId },
      session,
    );

    return state ? this.mapInventory(state) : null;
  }

  async updateInventoryActualReturnDate(
    id: string,
    companyId: string,
    actualReturnDate: Date,
    principalId: string,
    session?: ClientSession,
  ): Promise<Inventory | null> {
    // Ensure the inventory belongs to the company before updating
    const inventory = await this.getInventoryById(id, companyId);
    if (!inventory) {
      return null;
    }

    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'UPDATE_INVENTORY_ACTUAL_RETURN_DATE',
        actualReturnDate: actualReturnDate.toISOString(),
      },
      { principalId },
      session,
    );

    return state ? this.mapInventory(state) : null;
  }

  async deleteInventory(
    id: string,
    companyId: string,
    input: DeleteInventoryInput,
    principalId: string,
    session?: ClientSession,
  ): Promise<boolean> {
    // Ensure the inventory belongs to the company before deleting
    const inventory = await this.getInventoryById(id, companyId);
    if (!inventory) {
      return false;
    }

    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'DELETE_INVENTORY',
        reason: input.reason,
      },
      { principalId },
      session,
    );
    return state === null;
  }

  async listInventoryGroupedByPimCategoryId({
    filter,
    page,
  }: ListInventoryQuery): Promise<InventoryGroupedByCategory[]> {
    const limit = page?.size || 10;
    const skip = page?.number ? (page.number - 1) * limit : 0;

    // Use the same filter building logic as listInventory for consistency
    const mongoFilter = this.buildMongoFilter(filter);

    const pipeline: any[] = [
      { $match: mongoFilter },
      {
        $group: {
          _id: '$pimCategoryId',
          quantityOnOrder: {
            $sum: { $cond: [{ $eq: ['$status', 'ON_ORDER'] }, 1, 0] },
          },
          quantityReceived: {
            $sum: { $cond: [{ $eq: ['$status', 'RECEIVED'] }, 1, 0] },
          },
          totalQuantity: { $sum: 1 },
          pimCategoryName: { $first: '$pimCategoryName' },
          pimCategoryPath: { $first: '$pimCategoryPath' },
          sampleInventoryIds: { $push: '$_id' },
        },
      },
      {
        $project: {
          pimCategoryId: '$_id',
          pimCategoryName: 1,
          pimCategoryPath: 1,
          quantityOnOrder: 1,
          quantityReceived: 1,
          totalQuantity: 1,
          sampleInventoryIds: { $slice: ['$sampleInventoryIds', 5] },
        },
      },
      { $sort: { totalQuantity: -1, pimCategoryId: 1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const results = await this.collection.aggregate(pipeline).toArray();

    return results.map((doc: any) => ({
      pimCategoryId: doc.pimCategoryId,
      pimCategoryName: doc.pimCategoryName,
      pimCategoryPath: doc.pimCategoryPath,
      quantityOnOrder: doc.quantityOnOrder,
      quantityReceived: doc.quantityReceived,
      totalQuantity: doc.totalQuantity,
      sampleInventoryIds: doc.sampleInventoryIds,
    }));
  }

  async countInventoryGroupedByPimCategoryId(
    filter: ListInventoryFilter,
  ): Promise<number> {
    // Use the same filter building logic as listInventory for consistency
    const mongoFilter = this.buildMongoFilter(filter);

    const pipeline: any[] = [
      { $match: mongoFilter },
      {
        $group: {
          _id: '$pimCategoryId',
        },
      },
      {
        $count: 'total',
      },
    ];

    const results = await this.collection.aggregate(pipeline).toArray();
    return results[0]?.total || 0;
  }

  async batchGetInventoriesById(
    ids: readonly string[],
    companyId: string,
  ): Promise<(Inventory | null)[]> {
    const uniqueIds = Array.from(new Set(ids));
    const docs = await this.collection
      .find({ _id: { $in: uniqueIds }, companyId })
      .toArray();

    const docMap = new Map(docs.map((doc) => [doc._id, doc]));

    // Return in the same order as requested, with nulls for not found
    return ids.map((id) => {
      const doc = docMap.get(id);
      return doc ? this.mapInventory(doc) : null;
    });
  }

  async batchGetInventoriesByPurchaseOrderLineItemId(
    lineItemIds: readonly string[],
    companyId: string,
  ): Promise<Inventory[][]> {
    const uniqueIds = Array.from(new Set(lineItemIds));

    // Fetch all inventory items for the given line item IDs
    const docs = await this.collection
      .find({
        purchaseOrderLineItemId: { $in: uniqueIds },
        companyId,
      })
      .toArray();

    // Group inventory items by line item ID
    const inventoryByLineItemId = new Map<string, InventoryDoc[]>();
    for (const doc of docs) {
      if (doc.purchaseOrderLineItemId) {
        const existing =
          inventoryByLineItemId.get(doc.purchaseOrderLineItemId) || [];
        existing.push(doc);
        inventoryByLineItemId.set(doc.purchaseOrderLineItemId, existing);
      }
    }

    // Return in the same order as requested, with empty arrays for line items with no inventory
    return lineItemIds.map((lineItemId) => {
      const docs = inventoryByLineItemId.get(lineItemId) || [];
      return docs.map((doc) => this.mapInventory(doc));
    });
  }

  async batchGetInventoriesByPurchaseOrderId(
    purchaseOrderIds: readonly string[],
    companyId: string,
  ): Promise<Inventory[][]> {
    const uniqueIds = Array.from(new Set(purchaseOrderIds));

    // Fetch all inventory items for the given purchase order IDs
    const docs = await this.collection
      .find({
        purchaseOrderId: { $in: uniqueIds },
        companyId,
      })
      .toArray();

    // Group inventory items by purchase order ID
    const inventoryByPurchaseOrderId = new Map<string, InventoryDoc[]>();
    for (const doc of docs) {
      if (doc.purchaseOrderId) {
        const existing =
          inventoryByPurchaseOrderId.get(doc.purchaseOrderId) || [];
        existing.push(doc);
        inventoryByPurchaseOrderId.set(doc.purchaseOrderId, existing);
      }
    }

    // Return in the same order as requested, with empty arrays for POs with no inventory
    return purchaseOrderIds.map((purchaseOrderId) => {
      const docs = inventoryByPurchaseOrderId.get(purchaseOrderId) || [];
      return docs.map((doc) => this.mapInventory(doc));
    });
  }
}

export const createInventoryModel = (config: { mongoClient: MongoClient }) => {
  return new InventoryModel(config);
};
