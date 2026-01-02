import {
  type MongoClient,
  type Db,
  type Collection,
  WithTransactionCallback,
  ClientSession,
  Filter,
} from 'mongodb';
import { generateId } from '../../lib/id-generator';
import {
  createFulfilmentEventStore,
  FulfilmentEventStore,
} from './fulfilmentEventStore';

export type SalesOrderType = 'RENTAL' | 'SALE' | 'SERVICE';
type BaseGeneratedFields = '_id' | 'createdAt' | 'updatedAt';

export type ServiceFulfilmentTaskStatus = 'OPEN' | 'DONE' | 'SKIPPED';

export type ServiceFulfilmentTask = {
  id: string;
  title: string;
  activityTagIds: string[];
  contextTagIds?: string[];
  notes?: string;
  status: ServiceFulfilmentTaskStatus;
  completedAt?: Date;
  completedBy?: string;
};

export type BaseFulfilmentDoc<T = SalesOrderType> = {
  _id: string;
  workspace_id: string;
  workflowId?: string | null;
  workflowColumnId?: string | null;
  assignedToId?: string | null;
  createdAt: Date;
  createdBy?: string;
  updatedAt: Date;
  updatedBy?: string;

  // Sales order fields - denormalized for filtering
  salesOrderId: string;
  projectId?: string;
  contactId: string;
  purchaseOrderNumber?: string;

  // Sale Order Line Item fields - denormalized for filtering
  salesOrderLineItemId?: string;
  salesOrderType: T;

  // Purchase Order Line Item fields - denormalized for filtering
  purchaseOrderLineItemId?: string;

  // price fields - denormalized for filtering
  priceId?: string;
  priceName?: string; // optional, if this is a specific price
  pimCategoryId?: string;
  pimCategoryPath?: string;
  pimCategoryName?: string;
  pimProductId?: string; // if this price is for a specific product
};

export type RentalFulfilmentDoc = BaseFulfilmentDoc<'RENTAL'> & {
  pimCategoryId: string;
  pimCategoryPath: string;
  pimCategoryName: string;
  pimProductId?: string; // if this price is for a specific product
  inventoryId?: string;
  pricePerDayInCents: number;
  pricePerWeekInCents: number;
  pricePerMonthInCents: number;
  rentalStartDate?: Date;
  rentalEndDate?: Date;
  expectedRentalEndDate?: Date;
  lastChargedAt?: Date;
  lastBillingPeriodEnd?: Date;
  totalDaysCharged?: number;
};

export type SaleFulfilmentDoc = BaseFulfilmentDoc<'SALE'> & {
  // TODO: tracking inventory items for bulk sales.
  pimCategoryId: string;
  pimCategoryPath: string;
  pimCategoryName: string;
  pimProductId?: string; // if this price is for a specific product
  unitCostInCents: number;
  quantity: number;
};

export type ServiceFulfilmentDoc = BaseFulfilmentDoc<'SERVICE'> & {
  unitCostInCents: number;
  serviceDate?: Date;
  tasks?: ServiceFulfilmentTask[];
};

export type FulfilmentDoc =
  | ServiceFulfilmentDoc
  | SaleFulfilmentDoc
  | RentalFulfilmentDoc;

// DTO's
export type RentalFulfilment = Omit<RentalFulfilmentDoc, '_id'> & {
  id: string;
};
export type SaleFulfilment = Omit<SaleFulfilmentDoc, '_id'> & {
  id: string;
};
export type ServiceFulfilment = Omit<ServiceFulfilmentDoc, '_id'> & {
  id: string;
};

export type Fulfilment = RentalFulfilment | SaleFulfilment | ServiceFulfilment;

// input types
export type CreateRentalFulfilmentInput = Omit<
  RentalFulfilmentDoc,
  BaseGeneratedFields
>;
export type CreateSaleFulfilmentInput = Omit<
  SaleFulfilmentDoc,
  BaseGeneratedFields
>;
export type CreateServiceFulfilmentInput = Omit<
  ServiceFulfilmentDoc,
  BaseGeneratedFields
>;
// union type for create inputs
export type CreateFulfilmentInput =
  | CreateRentalFulfilmentInput
  | CreateSaleFulfilmentInput
  | CreateServiceFulfilmentInput;

// update types
export type UpdateRentalFulfilmentInput = Partial<
  Omit<
    RentalFulfilmentDoc,
    BaseGeneratedFields | 'salesOrderType' | 'workspace_id'
  >
>;
export type UpdateSaleFulfilmentInput = Partial<
  Omit<
    SaleFulfilmentDoc,
    BaseGeneratedFields | 'salesOrderType' | 'workspace_id'
  >
>;
export type UpdateServiceFulfilmentInput = Partial<
  Omit<
    ServiceFulfilmentDoc,
    BaseGeneratedFields | 'salesOrderType' | 'workspace_id'
  >
>;

// union type for update inputs
export type UpdateFulfilmentInput =
  | UpdateRentalFulfilmentInput
  | UpdateSaleFulfilmentInput
  | UpdateServiceFulfilmentInput;

export type ListFulfilmentsFilter = Partial<
  Pick<
    BaseFulfilmentDoc,
    | 'assignedToId'
    | 'workspace_id'
    | 'contactId'
    | 'pimCategoryId'
    | 'projectId'
    | 'purchaseOrderNumber'
    | 'salesOrderId'
    | 'salesOrderType'
    | 'workflowId'
  >
>;

export type ListRentalFulfilmentsFilter = Partial<
  Pick<
    BaseFulfilmentDoc,
    | 'assignedToId'
    | 'workspace_id'
    | 'contactId'
    | 'pimCategoryId'
    | 'projectId'
    | 'salesOrderId'
    | 'salesOrderLineItemId'
    | 'purchaseOrderLineItemId'
    | 'workflowId'
    | 'workflowColumnId'
  >
> & {
  timelineStartDate?: Date;
  timelineEndDate?: Date;
  hasInventoryAssigned?: boolean;
};

export type ListFulfilmentsQuery = {
  filter: ListFulfilmentsFilter;
  page?: {
    size?: number;
    number?: number;
  };
};

export type ListRentalFulfilmentsQuery = {
  filter: ListRentalFulfilmentsFilter;
  page?: {
    size?: number;
    number?: number;
  };
};

export type FulfilmentTypeMap = {
  RENTAL: {
    input: CreateRentalFulfilmentInput;
    output: RentalFulfilment;
  };
  SALE: {
    input: CreateSaleFulfilmentInput;
    output: SaleFulfilment;
  };
  SERVICE: {
    input: CreateServiceFulfilmentInput;
    output: ServiceFulfilment;
  };
};

export class FulfilmentModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'fulfilments';
  private db: Db;
  private collection: Collection<FulfilmentDoc>;
  private eventStore: FulfilmentEventStore;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<FulfilmentDoc>(this.collectionName);
    this.eventStore = createFulfilmentEventStore({ mongoClient: this.client });
  }

  withTransaction<T = any>(
    cb: WithTransactionCallback<T>,
    options?: Parameters<ClientSession['withTransaction']>[1],
  ) {
    return this.client.withSession<T>((session) => {
      return session.withTransaction<T>(cb, options);
    });
  }

  mapFulfilment(fulfilmentDoc: FulfilmentDoc) {
    if (fulfilmentDoc.salesOrderType === 'RENTAL') {
      return this.mapRentalFulfilment(fulfilmentDoc);
    } else if (fulfilmentDoc.salesOrderType === 'SALE') {
      return this.mapSaleFulfilment(fulfilmentDoc);
    } else if (fulfilmentDoc.salesOrderType === 'SERVICE') {
      return this.mapServiceFulfilment(fulfilmentDoc);
    }
    throw new Error('Invalid fulfilment type');
  }

  mapRentalFulfilment(fulfilmentDoc: RentalFulfilmentDoc): RentalFulfilment {
    const { _id, ...fields } = fulfilmentDoc;
    return {
      ...fields,
      id: fulfilmentDoc._id,
    };
  }
  mapSaleFulfilment(fulfilmentDoc: SaleFulfilmentDoc): SaleFulfilment {
    const { _id, ...fields } = fulfilmentDoc;
    return {
      ...fields,
      id: fulfilmentDoc._id,
    };
  }
  mapServiceFulfilment(fulfilmentDoc: ServiceFulfilmentDoc): ServiceFulfilment {
    const { _id, ...fields } = fulfilmentDoc;
    return {
      ...fields,
      id: fulfilmentDoc._id,
    };
  }

  async listFulfilments({
    filter,
    page,
  }: ListFulfilmentsQuery): Promise<Fulfilment[]> {
    const limit = page?.size || 10;
    const skip = page?.number ? (page.number - 1) * limit : 0;

    // Map assignedTo to assignedToId for DB query
    const dbFilter: any = { ...filter };
    if (dbFilter.assignedTo) {
      dbFilter.assignedToId = dbFilter.assignedTo;
      delete dbFilter.assignedTo;
    }
    return (
      await this.collection.find(dbFilter, { limit, skip }).toArray()
    ).map((d) => this.mapFulfilment(d));
  }

  async countFulfilments(query: ListFulfilmentsFilter) {
    // Map assignedTo to assignedToId for DB query
    const dbQuery: any = { ...query };
    if (dbQuery.assignedTo) {
      dbQuery.assignedToId = dbQuery.assignedTo;
      delete dbQuery.assignedTo;
    }
    return this.collection.countDocuments({ ...dbQuery });
  }

  async listRentalFulfilments({
    filter,
    page,
  }: ListRentalFulfilmentsQuery): Promise<RentalFulfilment[]> {
    const limit = page?.size || 10;
    const skip = page?.number ? (page.number - 1) * limit : 0;

    // Build the MongoDB filter
    const dbFilter: Filter<RentalFulfilmentDoc> = {
      salesOrderType: 'RENTAL',
    };

    // Add basic filters
    if (filter.workspace_id) dbFilter.workspace_id = filter.workspace_id;
    if (filter.salesOrderId) dbFilter.salesOrderId = filter.salesOrderId;
    if (filter.salesOrderLineItemId) {
      dbFilter.salesOrderLineItemId = filter.salesOrderLineItemId;
    }
    if (filter.purchaseOrderLineItemId) {
      dbFilter.purchaseOrderLineItemId = filter.purchaseOrderLineItemId;
    }
    if (filter.workflowId) dbFilter.workflowId = filter.workflowId;
    if (filter.workflowColumnId) {
      dbFilter.workflowColumnId = filter.workflowColumnId;
    }
    if (filter.assignedToId) dbFilter.assignedToId = filter.assignedToId;
    if (filter.contactId) dbFilter.contactId = filter.contactId;
    if (filter.projectId) dbFilter.projectId = filter.projectId;
    if (filter.pimCategoryId) dbFilter.pimCategoryId = filter.pimCategoryId;

    // Handle timeline filters
    if (filter.timelineStartDate || filter.timelineEndDate) {
      // Rentals that overlap with the timeline period
      if (filter.timelineStartDate && filter.timelineEndDate) {
        dbFilter.$or = [
          // Rental starts within the timeline
          {
            rentalStartDate: {
              $gte: filter.timelineStartDate,
              $lte: filter.timelineEndDate,
            },
          },
          // Rental ends within the timeline
          {
            $or: [
              {
                rentalEndDate: {
                  $gte: filter.timelineStartDate,
                  $lte: filter.timelineEndDate,
                },
              },
              {
                expectedRentalEndDate: {
                  $gte: filter.timelineStartDate,
                  $lte: filter.timelineEndDate,
                },
              },
            ],
          },
          // Rental spans the entire timeline
          {
            rentalStartDate: { $lte: filter.timelineStartDate },
            $or: [
              { rentalEndDate: { $gte: filter.timelineEndDate } },
              { expectedRentalEndDate: { $gte: filter.timelineEndDate } },
              { rentalEndDate: { $exists: false } },
              // @ts-ignore
              { rentalEndDate: { $eq: null } },
            ],
          },
        ];
      } else if (filter.timelineStartDate) {
        // Rentals that are active after the start date
        dbFilter.$or = [
          { rentalStartDate: { $gte: filter.timelineStartDate } },
          {
            rentalStartDate: { $lte: filter.timelineStartDate },
            $or: [
              { rentalEndDate: { $gte: filter.timelineStartDate } },
              { expectedRentalEndDate: { $gte: filter.timelineStartDate } },
              { rentalEndDate: { $exists: false } },
              // @ts-ignore
              { rentalEndDate: { $eq: null } },
            ],
          },
        ];
      } else if (filter.timelineEndDate) {
        // Rentals that started before the end date
        dbFilter.rentalStartDate = { $lte: filter.timelineEndDate };
      }
    }

    // Handle inventory assignment filter
    if (filter.hasInventoryAssigned !== undefined) {
      if (filter.hasInventoryAssigned) {
        dbFilter.inventoryId = { $exists: true, $ne: null } as any;
      } else {
        dbFilter.$or = [
          { inventoryId: { $exists: false } },
          // @ts-ignore
          { inventoryId: { $eq: null } },
        ];
      }
    }

    const results = await this.collection
      .find(dbFilter as Filter<FulfilmentDoc>, { limit, skip })
      .toArray();

    return results.map((d) =>
      this.mapRentalFulfilment(d as RentalFulfilmentDoc),
    );
  }

  async countRentalFulfilments(
    filter: ListRentalFulfilmentsFilter,
  ): Promise<number> {
    // Build the same filter as listRentalFulfilments
    const dbFilter: Filter<RentalFulfilmentDoc> = {
      salesOrderType: 'RENTAL',
    };

    // Add basic filters
    if (filter.workspace_id) dbFilter.workspace_id = filter.workspace_id;
    if (filter.salesOrderId) dbFilter.salesOrderId = filter.salesOrderId;
    if (filter.salesOrderLineItemId) {
      dbFilter.salesOrderLineItemId = filter.salesOrderLineItemId;
    }
    if (filter.purchaseOrderLineItemId) {
      dbFilter.purchaseOrderLineItemId = filter.purchaseOrderLineItemId;
    }
    if (filter.workflowId) dbFilter.workflowId = filter.workflowId;
    if (filter.workflowColumnId) {
      dbFilter.workflowColumnId = filter.workflowColumnId;
    }
    if (filter.assignedToId) dbFilter.assignedToId = filter.assignedToId;
    if (filter.contactId) dbFilter.contactId = filter.contactId;
    if (filter.projectId) dbFilter.projectId = filter.projectId;
    if (filter.pimCategoryId) dbFilter.pimCategoryId = filter.pimCategoryId;

    // Handle timeline filters (same logic as listRentalFulfilments)
    if (filter.timelineStartDate || filter.timelineEndDate) {
      if (filter.timelineStartDate && filter.timelineEndDate) {
        dbFilter.$or = [
          {
            rentalStartDate: {
              $gte: filter.timelineStartDate,
              $lte: filter.timelineEndDate,
            },
          },
          {
            $or: [
              {
                rentalEndDate: {
                  $gte: filter.timelineStartDate,
                  $lte: filter.timelineEndDate,
                },
              },
              {
                expectedRentalEndDate: {
                  $gte: filter.timelineStartDate,
                  $lte: filter.timelineEndDate,
                },
              },
            ],
          },
          {
            rentalStartDate: { $lte: filter.timelineStartDate },
            $or: [
              { rentalEndDate: { $gte: filter.timelineEndDate } },
              { expectedRentalEndDate: { $gte: filter.timelineEndDate } },
              { rentalEndDate: { $exists: false } },
              // @ts-ignore
              { rentalEndDate: { $eq: null } },
            ],
          },
        ];
      } else if (filter.timelineStartDate) {
        dbFilter.$or = [
          { rentalStartDate: { $gte: filter.timelineStartDate } },
          {
            rentalStartDate: { $lte: filter.timelineStartDate },
            $or: [
              { rentalEndDate: { $gte: filter.timelineStartDate } },
              { expectedRentalEndDate: { $gte: filter.timelineStartDate } },
              { rentalEndDate: { $exists: false } },
              // @ts-ignore
              { rentalEndDate: { $eq: null } },
            ],
          },
        ];
      } else if (filter.timelineEndDate) {
        dbFilter.rentalStartDate = { $lte: filter.timelineEndDate };
      }
    }

    // Handle inventory assignment filter
    if (filter.hasInventoryAssigned !== undefined) {
      if (filter.hasInventoryAssigned) {
        dbFilter.inventoryId = { $exists: true, $ne: null } as any;
      } else {
        dbFilter.$or = [
          { inventoryId: { $exists: false } },
          //@ts-ignore
          { inventoryId: { $eq: null } },
        ];
      }
    }

    return this.collection.countDocuments(dbFilter as Filter<FulfilmentDoc>);
  }

  async getFulfilmentById(
    id: string,
    session?: ClientSession,
  ): Promise<Fulfilment | null> {
    const query = {
      _id: id,
    };
    const result = await this.collection.findOne(query, { session });
    return result ? this.mapFulfilment(result) : null;
  }

  async getFulfilmentBySalesOrderLineItemId(
    salesOrderLineItemId: string,
    session?: ClientSession,
  ): Promise<Fulfilment | null> {
    const query = {
      salesOrderLineItemId,
    };
    const result = await this.collection.findOne(query, { session });
    return result ? this.mapFulfilment(result) : null;
  }

  async createFulfilment(
    input: CreateFulfilmentInput,
    userId: string,
    session?: ClientSession,
  ) {
    const id = generateId('FLMT', input.workspace_id);
    if (input.salesOrderType === 'RENTAL') {
      const { state } = await this.eventStore.applyEvent(
        id,
        {
          ...input,
          type: 'CREATE_RENTAL_FULFILMENT',
          salesOrderType: 'RENTAL',
        },
        { principalId: userId },
        session,
      );
      if (!state) throw new Error('Unexpected error');
      return this.mapFulfilment(state) as RentalFulfilment;
    }
    if (input.salesOrderType === 'SALE') {
      const { state } = await this.eventStore.applyEvent(
        id,
        {
          ...input,
          type: 'CREATE_SALES_FULFILMENT',
        },
        { principalId: userId },
        session,
      );
      if (!state) throw new Error('Unexpected error');
      return this.mapFulfilment(state) as SaleFulfilment;
    }
    if (input.salesOrderType === 'SERVICE') {
      const { state } = await this.eventStore.applyEvent(
        id,
        {
          type: 'CREATE_SERVICE_FULFILMENT',
          ...input,
        },
        { principalId: userId },
        session,
      );
      if (!state) throw new Error('Unexpected error');
      return this.mapFulfilment(state) as ServiceFulfilment;
    }
    throw new Error('not supported');
  }

  async deleteFulfilment(id: string, userId: string): Promise<boolean> {
    await this.eventStore.applyEvent(
      id,
      {
        type: 'DELETE_FULFILMENT',
      },
      { principalId: userId },
    );
    return true;
  }

  async updateColumn(
    id: string,
    workflowColumnId: string | null,
    workflowId: string | null,
    userId: string,
  ): Promise<Fulfilment | null> {
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'UPDATE_COLUMN',
        workflowColumnId,
        workflowId,
      },
      { principalId: userId },
    );
    if (!state) throw new Error('Unexpected error');
    return this.mapFulfilment(state);
  }

  async updateAssignee(
    id: string,
    assignTo: string | null,
    userId: string,
  ): Promise<Fulfilment | null> {
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'UPDATE_ASSIGNEE',
        assignToId: assignTo,
      },
      { principalId: userId },
    );
    if (!state) throw new Error('Unexpected error');
    return this.mapFulfilment(state);
  }

  async updateServiceTaskStatus(
    id: string,
    params: { taskId: string; status: ServiceFulfilmentTaskStatus },
    userId: string,
  ): Promise<Fulfilment | null> {
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'UPDATE_SERVICE_TASK_STATUS',
        taskId: params.taskId,
        status: params.status,
      },
      { principalId: userId },
    );
    if (!state) throw new Error('Unexpected error');
    return this.mapFulfilment(state);
  }

  async setRentalStartDate(
    opts: { id: string; rentalStartDate: Date; userId: string },
    session?: ClientSession,
  ) {
    const { id, rentalStartDate, userId } = opts;
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'SET_RENTAL_START_DATE',
        rentalStartDate,
      },
      { principalId: userId },
      session,
    );
    if (!state) throw new Error('Unexpected error');
    return this.mapFulfilment(state) as RentalFulfilment;
  }

  async setRentalEndDate(opts: {
    id: string;
    rentalEndDate: Date;
    userId: string;
    session?: ClientSession;
  }) {
    const { id, rentalEndDate, userId, session } = opts;
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'SET_RENTAL_END_DATE',
        rentalEndDate,
      },
      { principalId: userId },
      session,
    );
    if (!state) throw new Error('Unexpected error');
    return this.mapFulfilment(state) as RentalFulfilment;
  }

  async setExpectedRentalEndDate(
    id: string,
    expectedRentalEndDate: Date,
    userId: string,
  ) {
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'SET_EXPECTED_RENTAL_END_DATE',
        expectedRentalEndDate,
      },
      { principalId: userId },
    );
    if (!state) throw new Error('Unexpected error');
    return this.mapFulfilment(state) as RentalFulfilment;
  }

  async setRentalLastChargedAt(
    opts: {
      id: string;
      lastChargedAt: Date;
      lastBillingPeriodEnd: Date;
      userId: string;
      daysCharged: number;
    },
    session?: ClientSession,
  ) {
    const { id, lastChargedAt, userId, daysCharged } = opts;
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'UPDATE_LAST_CHARGED_AT',
        lastBillingPeriodEnd: opts.lastBillingPeriodEnd,
        lastChargedAt,
        daysCharged,
      },
      { principalId: userId },
      session,
    );
    if (!state) throw new Error('Unexpected error');
    return this.mapFulfilment(state) as RentalFulfilment;
  }

  async resetRentalLastChargedAt(
    opts: { id: string; userId: string },
    session?: ClientSession,
  ) {
    const { id, userId } = opts;
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'RESET_LAST_CHARGED_AT',
      },
      { principalId: userId },
      session,
    );
    if (!state) throw new Error('Unexpected error');
    return this.mapFulfilment(state) as RentalFulfilment;
  }

  async getRentalFulfilmentsDueForCharge(opts: {
    billingPeriodInDays: number;
    workspaceId?: string;
  }) {
    const today = new Date();
    const dateThreshold = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - opts.billingPeriodInDays,
    );

    const findQuery: Filter<FulfilmentDoc> = {
      salesOrderType: 'RENTAL',
      rentalStartDate: { $lte: dateThreshold },
      $and: [
        {
          $or: [{ rentalEndDate: { $exists: false } }, { rentalEndDate: null }],
        },
        {
          $or: [
            { lastChargedAt: { $exists: false } },
            { lastChargedAt: null },
            { lastChargedAt: { $lte: dateThreshold } },
          ],
        },
      ],
    };

    if (opts.workspaceId) {
      findQuery.workspaceId = opts.workspaceId;
    }

    return (await this.collection.find(findQuery).toArray()).map(
      (d) => this.mapFulfilment(d) as RentalFulfilment,
    );
  }

  async assignInventoryToFulfilment(
    id: string,
    inventoryId: string,
    userId: string,
    session?: ClientSession,
  ) {
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'ASSIGN_INVENTORY_TO_FULFILMENT',
        inventoryId,
      },
      { principalId: userId },
      session,
    );
    if (!state) throw new Error('Unexpected error');
    return this.mapFulfilment(state);
  }

  async unassignInventoryToFulfilment(id: string, userId: string) {
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'UNASSIGN_INVENTORY_TO_FULFILMENT',
      },
      { principalId: userId },
    );
    if (!state) throw new Error('Unexpected error');
    return this.mapFulfilment(state);
  }

  async setPurchaseOrderLineItemId(
    id: string,
    purchaseOrderLineItemId: string | null,
    userId: string,
    session?: ClientSession,
  ): Promise<Fulfilment | null> {
    const { state } = await this.eventStore.applyEvent(
      id,
      {
        type: 'SET_PURCHASE_ORDER_LINE_ITEM_ID',
        purchaseOrderLineItemId,
      },
      { principalId: userId },
      session,
    );
    if (!state) throw new Error('Unexpected error');
    return this.mapFulfilment(state);
  }
}

export const createFulfilmentModel = (config: { mongoClient: MongoClient }) => {
  const fulfilmentModel = new FulfilmentModel(config);
  return fulfilmentModel;
};
