import { type MongoClient, ClientSession } from 'mongodb';
import type { KafkaJS } from '@confluentinc/kafka-javascript';
import { type EnvConfig } from '../../config';
import {
  createInventoryModel,
  InventoryModel,
  Inventory,
  CreateInventoryInput,
  UpdateInventorySerialisedIdInput,
  MarkInventoryReceivedInput,
  DeleteInventoryInput,
  ListInventoryQuery,
  ListInventoryFilter,
  InventoryGroupedByCategory,
} from './model';
import {
  createInventoryReservationModel,
  InventoryReservationModel,
  InventoryReservation,
  ListInventoryReservationsFilter,
  ListInventoryReservationsQuery,
  ReservationType,
  FulfilmentReservation,
} from './inventory-reservation-model';
import { ANON_USER_AUTH_PAYLOAD, UserAuthPayload } from '../../authentication';
import { ResourceMapResourcesService } from '../resource_map';
import {
  RESOURCE_MAP_TAG_TYPE,
  normalizeResourceMapTagType,
} from '../resource_map/tag-types';

// Re-export DTOs if needed
export type {
  Inventory,
  CreateInventoryInput,
  UpdateInventorySerialisedIdInput,
  DeleteInventoryInput,
  ListInventoryQuery,
  ListInventoryFilter,
  InventoryGroupedByCategory,
  InventoryReservation,
  ListInventoryReservationsFilter,
  ListInventoryReservationsQuery,
  ReservationType,
  FulfilmentReservation,
};

export class InventoryService {
  private model: InventoryModel;
  private reservationModel: InventoryReservationModel;
  private systemUserId: string = 'system';
  private mongoClient: MongoClient;
  private resourceMapResourcesService: ResourceMapResourcesService;
  private envConfig: EnvConfig;

  constructor(config: {
    model: InventoryModel;
    reservationModel: InventoryReservationModel;
    mongoClient: MongoClient;
    resourceMapResourcesService: ResourceMapResourcesService;
    envConfig: EnvConfig;
  }) {
    this.model = config.model;
    this.reservationModel = config.reservationModel;
    this.mongoClient = config.mongoClient;
    this.resourceMapResourcesService = config.resourceMapResourcesService;
    this.envConfig = config.envConfig;
  }

  private buildResourceMapIds(input: {
    resourceMapId?: string;
    resourceMapIds?: string[];
  }) {
    const ids = new Set<string>();
    if (input.resourceMapId) {
      ids.add(input.resourceMapId);
    }
    for (const id of input.resourceMapIds || []) {
      ids.add(id);
    }
    return Array.from(ids);
  }

  private async validateInventoryResourceMap(
    input: {
      resourceMapId?: string;
      resourceMapIds?: string[];
    },
    user: UserAuthPayload,
    opts: { requireLocation: boolean },
  ): Promise<{ resourceMapIds?: string[]; resourceMapId?: string }> {
    const resourceMapIds = this.buildResourceMapIds(input);

    if (this.envConfig.IN_TEST_MODE) {
      return {
        resourceMapIds: resourceMapIds.length ? resourceMapIds : undefined,
        resourceMapId: input.resourceMapId,
      };
    }

    if (resourceMapIds.length === 0) {
      if (opts.requireLocation) {
        throw new Error('resourceMapId is required');
      }
      return {
        resourceMapIds: undefined,
        resourceMapId: undefined,
      };
    }

    const { entries } = await this.resourceMapResourcesService.validateResourceMapIds(
      {
        ids: resourceMapIds,
        allowedTypes: [
          RESOURCE_MAP_TAG_TYPE.LOCATION,
          RESOURCE_MAP_TAG_TYPE.BUSINESS_UNIT,
        ],
        requiredTypes: opts.requireLocation
          ? [RESOURCE_MAP_TAG_TYPE.LOCATION]
          : undefined,
        user,
      },
    );

    const locationEntry = entries.find(
      (entry) =>
        normalizeResourceMapTagType(entry.type) ===
        RESOURCE_MAP_TAG_TYPE.LOCATION,
    );

    if (opts.requireLocation && !locationEntry) {
      throw new Error('Inventory requires at least one location tag');
    }

    return {
      resourceMapIds,
      resourceMapId: locationEntry?._id ?? input.resourceMapId,
    };
  }

  async listInventory(query: ListInventoryQuery, user: UserAuthPayload) {
    return this.model.listInventory({
      ...query,
      filter: { ...query.filter, companyId: user.companyId },
    });
  }

  async countInventory(filter: ListInventoryFilter, user: UserAuthPayload) {
    return this.model.countInventory({
      ...filter,
      companyId: user.companyId,
    });
  }

  async getInventoryById(id: string, user: UserAuthPayload) {
    return this.model.getInventoryById(id, user.companyId);
  }

  async createInventory(
    input: CreateInventoryInput,
    user: UserAuthPayload,
    session?: ClientSession,
  ) {
    const requireLocation = input.status === 'RECEIVED';
    const resourceMap = await this.validateInventoryResourceMap(
      {
        resourceMapId: input.resourceMapId,
        resourceMapIds: input.resourceMapIds,
      },
      user,
      { requireLocation },
    );

    return this.model.createInventory(
      {
        ...input,
        companyId: user.companyId,
        resourceMapId: resourceMap.resourceMapId,
        resourceMapIds: resourceMap.resourceMapIds,
      },
      user?.id,
      session,
    );
  }

  async updateInventorySerialisedId(
    id: string,
    input: UpdateInventorySerialisedIdInput,
    user: UserAuthPayload,
  ) {
    // Get inventory to check if it exists
    const inventory = await this.model.getInventoryById(id, user.companyId);
    if (!inventory) {
      return null;
    }

    return this.model.updateInventorySerialisedId(
      id,
      user.companyId,
      input,
      user?.id,
    );
  }

  async updateInventoryReturnDates(
    id: string,
    input: { expectedReturnDate?: Date; actualReturnDate?: Date },
    user: UserAuthPayload,
  ) {
    // Get inventory to check if it exists
    const inventory = await this.model.getInventoryById(id, user.companyId);
    if (!inventory) {
      return null;
    }

    // Call the appropriate method(s) based on what's being updated
    let result: Inventory | null = inventory;

    if (input.expectedReturnDate) {
      result = await this.model.updateInventoryExpectedReturnDate(
        id,
        user.companyId,
        input.expectedReturnDate,
        user?.id,
      );
      if (!result) return null;
    }

    if (input.actualReturnDate) {
      result = await this.model.updateInventoryActualReturnDate(
        id,
        user.companyId,
        input.actualReturnDate,
        user?.id,
      );
    }

    return result;
  }

  async deleteInventory(
    id: string,
    input: DeleteInventoryInput,
    user: UserAuthPayload,
  ) {
    // Get inventory to check if it exists
    const inventory = await this.model.getInventoryById(id, user.companyId);
    if (!inventory) {
      return false;
    }

    return this.model.deleteInventory(id, user.companyId, input, user?.id);
  }

  async listInventoryGroupedByPimCategoryId(
    query: ListInventoryQuery,
    user: UserAuthPayload,
  ) {
    return this.model.listInventoryGroupedByPimCategoryId({
      ...query,
      filter: { ...query.filter, companyId: user.companyId },
    });
  }

  async countInventoryGroupedByPimCategoryId(
    filter: ListInventoryFilter,
    user: UserAuthPayload,
  ) {
    return this.model.countInventoryGroupedByPimCategoryId({
      ...filter,
      companyId: user.companyId,
    });
  }

  async batchGetInventoriesById(
    ids: readonly string[],
    user: UserAuthPayload | undefined,
  ): Promise<(Inventory | null)[]> {
    if (!user) {
      return ids.map(() => null);
    }
    return this.model.batchGetInventoriesById(ids, user.companyId);
  }

  async batchGetInventoriesByPurchaseOrderLineItemId(
    lineItemIds: readonly string[],
    user: UserAuthPayload | undefined,
  ): Promise<Inventory[][]> {
    if (!user) {
      return lineItemIds.map(() => []);
    }
    return this.model.batchGetInventoriesByPurchaseOrderLineItemId(
      lineItemIds,
      user.companyId,
    );
  }

  async batchGetInventoriesByPurchaseOrderId(
    purchaseOrderIds: readonly string[],
    user: UserAuthPayload | undefined,
  ): Promise<Inventory[][]> {
    if (!user) {
      return purchaseOrderIds.map(() => []);
    }
    return this.model.batchGetInventoriesByPurchaseOrderId(
      purchaseOrderIds,
      user.companyId,
    );
  }

  /**
   * Bulk mark inventory items as received
   * This is a transactional operation that updates multiple inventory items at once
   */
  async bulkMarkInventoryReceived(
    ids: string[],
    input: MarkInventoryReceivedInput,
    user: UserAuthPayload,
  ): Promise<{ items: Inventory[]; totalProcessed: number }> {
    // Validate assetId usage: cannot set assetId for multiple inventory items
    if (input.assetId && ids.length > 1) {
      throw new Error(
        'Cannot set assetId for multiple inventory items. Asset IDs must be unique per inventory item.',
      );
    }

    const resourceMap = await this.validateInventoryResourceMap(
      {
        resourceMapId: input.resourceMapId,
        resourceMapIds: input.resourceMapIds,
      },
      user,
      { requireLocation: true },
    );

    const session = this.mongoClient.startSession();

    try {
      await session.withTransaction(async () => {
        const processedItems: Inventory[] = [];

        for (const id of ids) {
          const updatedInventory = await this.model.markInventoryReceived(
            id,
            user.companyId,
            {
              ...input,
              resourceMapId: resourceMap.resourceMapId,
              resourceMapIds: resourceMap.resourceMapIds,
            },
            user?.id,
            session,
          );

          if (!updatedInventory) {
            throw new Error(
              `Inventory INV-${id} not found or not authorized for update`,
            );
          }

          processedItems.push(updatedInventory);
        }

        return {
          items: processedItems,
          totalProcessed: processedItems.length,
        };
      });

      // Fetch all updated items outside the transaction for return
      const updatedItems: Inventory[] = [];
      for (const id of ids) {
        const item = await this.model.getInventoryById(id, user.companyId);
        if (item) {
          updatedItems.push(item);
        }
      }

      return {
        items: updatedItems,
        totalProcessed: updatedItems.length,
      };
    } finally {
      await session.endSession();
    }
  }

  // Inventory Reservation Methods

  /**
   * Get a single inventory reservation by ID
   */
  async getReservationById(
    id: string,
    user: UserAuthPayload,
  ): Promise<InventoryReservation | null> {
    // TODO authz
    return this.reservationModel.getReservationById(id);
  }

  /**
   * List inventory reservations with filtering and pagination
   */
  async listInventoryReservations(
    query: {
      filter: Omit<ListInventoryReservationsFilter, 'companyId'>;
      page?: ListInventoryReservationsQuery['page'];
    },
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<InventoryReservation[]> {
    return this.reservationModel.listReservations({
      ...query,
      filter: {
        ...query.filter,
        // Only filter by companyId if it's not a wildcard (system user)
        ...(user.companyId !== '*' && { companyId: user.companyId }),
      },
    });
  }

  /**
   * Count inventory reservations
   */
  async countInventoryReservations(
    filter: ListInventoryReservationsFilter,
    user: UserAuthPayload,
  ): Promise<number> {
    return this.reservationModel.countReservations({
      ...filter,
      companyId: user.companyId,
    });
  }

  /**
   * Create a fulfilment reservation for inventory
   */
  async createFulfilmentReservation(
    input: {
      allowOverlappingReservations?: boolean;
      inventoryId: string;
      startDate: Date;
      endDate: Date;
      fulfilmentId: string;
      salesOrderType: 'RENTAL' | 'SALE' | 'SERVICE';
    },
    user: UserAuthPayload,
    session?: ClientSession,
  ): Promise<InventoryReservation> {
    if (!input.allowOverlappingReservations) {
      const overlappingReservations = await this.listInventoryReservations(
        {
          filter: {
            inventoryId: input.inventoryId,
            startDate: input.startDate,
            endDate: input.endDate,
          },
        },
        user,
      );

      if (overlappingReservations.length > 0) {
        throw new Error(
          `Inventory with ID ${input.inventoryId} is already reserved for the specified dates.`,
        );
      }
    }

    return this.reservationModel.createFulfilmentReservation(
      {
        ...input,
        companyId: user.companyId,
        createdBy: user.id,
        updatedBy: user.id,
        deleted: false,
      },
      user.id,
      session,
    );
  }

  async deleteFulfilmentReservation(
    input: {
      inventoryId: string;
      fulfilmentId: string;
    },
    user: UserAuthPayload,
    session?: ClientSession,
  ) {
    const reservations = await this.reservationModel.listReservations({
      filter: {
        inventoryId: input.inventoryId,
        fulfilmentId: input.fulfilmentId,
        companyId: user.companyId,
      },
    });

    if (reservations.length === 0) {
      throw new Error(
        `No reservation found for inventory ID ${input.inventoryId} and fulfilment ID ${input.fulfilmentId}.`,
      );
    }

    await Promise.all(
      reservations.map((reservation) =>
        this.reservationModel.deleteReservation({
          id: reservation.id,
          principalId: user.id,
        }),
      ),
    );
  }
}

export const createInventoryService = async (config: {
  mongoClient: MongoClient;
  envConfig: EnvConfig;
  kafkaClient?: KafkaJS.Kafka;
  resourceMapResourcesService: ResourceMapResourcesService;
}) => {
  const model = createInventoryModel({ mongoClient: config.mongoClient });
  const reservationModel = createInventoryReservationModel({
    mongoClient: config.mongoClient,
  });
  const inventoryService = new InventoryService({
    model,
    reservationModel,
    mongoClient: config.mongoClient,
    resourceMapResourcesService: config.resourceMapResourcesService,
    envConfig: config.envConfig,
  });

  return inventoryService;
};
