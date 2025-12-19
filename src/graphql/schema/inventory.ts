import {
  objectType,
  inputObjectType,
  enumType,
  nonNull,
  arg,
  extendType,
  unionType,
} from 'nexus';
import { dropUndefinedKeys } from '../utils';
import { Inventory as InventoryType } from '../../services/inventory';

export const InventoryStatus = enumType({
  name: 'InventoryStatus',
  members: ['ON_ORDER', 'RECEIVED'],
});

export const InventoryCondition = enumType({
  name: 'InventoryCondition',
  members: ['NEW', 'USED', 'DAMAGED', 'REFURBISHED'],
});

export const Inventory = objectType({
  name: 'Inventory',
  sourceType: {
    module: require.resolve('../../services/inventory/model'),
    export: 'Inventory',
  },
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('companyId');
    t.string('workspaceId');
    t.nonNull.field('status', { type: InventoryStatus });
    t.string('fulfilmentId');
    t.field('fulfilment', {
      type: 'Fulfilment',
      async resolve(inventory, _args, ctx) {
        if (!inventory.fulfilmentId) return null;
        return ctx.services.fulfilmentService.getFulfilmentById(
          inventory.fulfilmentId,
          ctx.user,
        );
      },
    });
    t.string('purchaseOrderId');
    t.string('purchaseOrderLineItemId');
    t.nonNull.boolean('isThirdPartyRental');
    t.string('assetId');
    t.string('pimCategoryId');
    t.field('pimCategory', {
      type: 'PimCategory',
      async resolve(inventory, _args, ctx) {
        if (!inventory.pimCategoryId) return null;
        return ctx.dataloaders.pimCategories.getPimCategoriesById.load(
          inventory.pimCategoryId,
        );
      },
    });
    t.string('pimCategoryPath');
    t.string('pimCategoryName');
    t.string('pimProductId');
    t.field('pimProduct', {
      type: 'PimProduct',
      async resolve(inventory, _args, ctx) {
        if (!inventory.pimProductId) return null;
        return ctx.dataloaders.pimProducts.getPimProductsById.load(
          inventory.pimProductId,
        );
      },
    });
    t.field('receivedAt', { type: 'DateTime' });
    t.string('receiptNotes');
    t.string('resourceMapId');
    t.field('resourceMap', {
      type: 'ResourceMapResource',
      async resolve(inventory, _args, ctx) {
        if (!inventory.resourceMapId) return null;
        return ctx.services.resourceMapResourcesService.getResourceMapEntryById(
          inventory.resourceMapId,
          ctx.user,
        );
      },
    });
    t.list.nonNull.string('resourceMapIds');
    t.list.nonNull.field('resource_map_entries', {
      type: 'ResourceMapResource',
      async resolve(inventory, _args, ctx) {
        const resourceMapIds = inventory.resourceMapIds || [];
        if (!resourceMapIds.length) return [];
        const entries =
          await ctx.dataloaders.resourceMapResources.getResourceMapEntriesById.loadMany(
            resourceMapIds,
          );
        return entries.filter(Boolean);
      },
    });
    t.field('conditionOnReceipt', { type: InventoryCondition });
    t.string('conditionNotes');
    t.field('expectedReturnDate', { type: 'DateTime' });
    t.field('actualReturnDate', { type: 'DateTime' });
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.nonNull.field('updatedAt', { type: 'DateTime' });
    t.nonNull.string('createdBy');
    t.nonNull.string('updatedBy');

    t.field('createdByUser', {
      type: 'User',
      async resolve(inventory, _args, ctx) {
        if (!inventory.createdBy) return null;
        return ctx.dataloaders.users.getUsersById.load(inventory.createdBy);
      },
    });
    t.field('updatedByUser', {
      type: 'User',
      async resolve(inventory, _args, ctx) {
        if (!inventory.updatedBy) return null;
        return ctx.dataloaders.users.getUsersById.load(inventory.updatedBy);
      },
    });
    t.field('purchaseOrder', {
      type: 'PurchaseOrder',
      async resolve(inventory, _args, ctx) {
        if (!inventory.purchaseOrderId) return null;
        return ctx.dataloaders.purchaseOrders.getPurchaseOrdersById.load(
          inventory.purchaseOrderId,
        );
      },
    });
    t.field('purchaseOrderLineItem', {
      type: 'PurchaseOrderLineItem',
      async resolve(inventory, _args, ctx) {
        if (!inventory.purchaseOrderLineItemId) return null;
        return ctx.dataloaders.purchaseOrders.getPurchaseOrderLineItemsById.load(
          inventory.purchaseOrderLineItemId,
        );
      },
    });
  },
});

export const ListInventoryFilter = inputObjectType({
  name: 'ListInventoryFilter',
  definition(t) {
    t.string('companyId');
    t.string('workspaceId');
    t.field('status', { type: InventoryStatus });
    t.boolean('isThirdPartyRental');
    t.string('fulfilmentId');
    t.string('purchaseOrderId');
    t.string('assetId');
    t.string('pimCategoryId');
    t.field('startDate', { type: 'DateTime' });
    t.field('endDate', { type: 'DateTime' });
  },
});

export const ListInventoryPage = inputObjectType({
  name: 'ListInventoryPage',
  definition(t) {
    t.int('size');
    t.int('number');
  },
});

export const ListInventoryQuery = inputObjectType({
  name: 'ListInventoryQuery',
  definition(t) {
    t.field('filter', { type: ListInventoryFilter });
    t.field('page', { type: ListInventoryPage });
  },
});

export const InventoryResponse = objectType({
  name: 'InventoryResponse',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: Inventory });
  },
});

export const InventoryGroupedByCategory = objectType({
  name: 'InventoryGroupedByCategory',
  sourceType: {
    module: require.resolve('../../services/inventory/model'),
    export: 'InventoryGroupedByCategory',
  },
  definition(t) {
    t.string('pimCategoryId');
    t.string('pimCategoryName');
    t.string('pimCategoryPath');
    t.nonNull.int('quantityOnOrder');
    t.nonNull.int('quantityReceived');
    t.nonNull.int('totalQuantity');
    t.nonNull.list.nonNull.string('sampleInventoryIds');

    // Dataloader-resolved field for sample inventories
    t.nonNull.list.field('sampleInventories', {
      type: 'Inventory',
      async resolve(parent, _args, ctx) {
        if (
          !parent.sampleInventoryIds ||
          parent.sampleInventoryIds.length === 0
        ) {
          return [];
        }
        const inventories = await Promise.all(
          parent.sampleInventoryIds.map((id: string) =>
            ctx.dataloaders.inventory.getInventoriesById.load(id),
          ),
        );
        // Filter out nulls and return only valid inventories
        return inventories.filter(
          (inv): inv is NonNullable<typeof inv> => inv !== null,
        );
      },
    });
  },
});

export const InventoryGroupedByCategoryResponse = objectType({
  name: 'InventoryGroupedByCategoryResponse',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: InventoryGroupedByCategory });
    t.nonNull.int('totalCount');
    t.nonNull.int('pageNumber');
    t.nonNull.int('pageSize');
    t.nonNull.int('totalPages');
  },
});

// --- Inventory Reservation Types ---

export const ReservationType = enumType({
  name: 'ReservationType',
  members: ['FULFILMENT'],
});

export const FulfilmentReservation = objectType({
  name: 'FulfilmentReservation',
  sourceType: {
    module: require.resolve('../../services/inventory'),
    export: 'FulfilmentReservation',
  },
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.field('type', { type: ReservationType });
    t.nonNull.string('inventoryId');
    t.nonNull.field('startDate', { type: 'DateTime' });
    t.nonNull.field('endDate', { type: 'DateTime' });
    t.nonNull.string('companyId');
    t.nonNull.string('fulfilmentId');
    t.nonNull.string('createdBy');
    t.nonNull.field('salesOrderType', { type: 'FulfilmentType' });
    t.field('createdByUser', {
      type: 'User',
      async resolve(reservation, _args, ctx) {
        if (!reservation.createdBy) return null;
        return ctx.dataloaders.users.getUsersById.load(reservation.createdBy);
      },
    });
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.nonNull.field('updatedAt', { type: 'DateTime' });
    t.nonNull.string('updatedBy');
    t.field('updatedByUser', {
      type: 'User',
      async resolve(reservation, _args, ctx) {
        if (!reservation.updatedBy) return null;
        return ctx.dataloaders.users.getUsersById.load(reservation.updatedBy);
      },
    });
    t.nonNull.boolean('deleted');
    t.field('inventory', {
      type: 'Inventory',
      async resolve(reservation, _args, ctx) {
        return ctx.dataloaders.inventory.getInventoriesById.load(
          reservation.inventoryId,
        );
      },
    });
    t.field('fulfilment', {
      type: 'Fulfilment',
      async resolve(reservation, _args, ctx) {
        return ctx.services.fulfilmentService.getFulfilmentById(
          reservation.fulfilmentId,
          ctx.user,
        );
      },
    });
  },
});

// Union type for inventory reservations - extensible for future reservation types
export const InventoryReservation = unionType({
  name: 'InventoryReservation',
  definition(t) {
    t.members(FulfilmentReservation);
  },
  resolveType(item) {
    // Type guard to check if the item has a 'type' property
    if ('type' in item) {
      switch (item.type) {
        case 'FULFILMENT':
          return 'FulfilmentReservation';
        // Add more cases here as new reservation types are added
        default:
          return null;
      }
    }
    return null;
  },
});

export const ListInventoryReservationsFilter = inputObjectType({
  name: 'ListInventoryReservationsFilter',
  definition(t) {
    t.string('pimCategoryId');
    t.field('startDate', { type: 'DateTime' });
    t.field('endDate', { type: 'DateTime' });
    t.string('inventoryId');
    t.string('fulfilmentId');
    t.field('type', { type: ReservationType });
  },
});

export const InventoryReservationsResponse = objectType({
  name: 'InventoryReservationsResponse',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: InventoryReservation });
    t.nonNull.field('page', {
      type: objectType({
        name: 'InventoryReservationsPage',
        definition(t) {
          t.nonNull.int('number');
          t.nonNull.int('size');
          t.nonNull.int('totalItems');
          t.nonNull.int('totalPages');
        },
      }),
    });
  },
});

export const InventoryQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('listInventory', {
      type: nonNull(InventoryResponse),
      args: {
        query: arg({ type: ListInventoryQuery }),
      },
      async resolve(_root, { query }, ctx) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        const filter = query?.filter ?? {};
        const page = query?.page ?? {};

        let pimCategoryPath: string | undefined;

        if (filter.pimCategoryId) {
          const category =
            await ctx.dataloaders.pimCategories.getPimCategoriesById.load(
              filter.pimCategoryId,
            );

          if (!category) {
            throw new Error(
              `PIM Category with ID ${filter.pimCategoryId} not found`,
            );
          }
          pimCategoryPath = category.path;
        }

        const items = await ctx.services.inventoryService.listInventory(
          {
            filter: dropUndefinedKeys({
              companyId: filter.companyId ?? undefined,
              workspaceId: filter.workspaceId ?? undefined,
              status: filter.status ?? undefined,
              isThirdPartyRental: filter.isThirdPartyRental ?? undefined,
              fulfilmentId: filter.fulfilmentId ?? undefined,
              purchaseOrderId: filter.purchaseOrderId ?? undefined,
              assetId: filter.assetId ?? undefined,
              pimCategoryPath,
              startDate: filter.startDate ?? undefined,
              endDate: filter.endDate ?? undefined,
            }),
            page: {
              size: page.size ?? undefined,
              number: page.number ?? undefined,
            },
          },
          ctx.user,
        );
        return { items };
      },
    });

    t.field('inventoryById', {
      type: Inventory,
      args: {
        id: nonNull('String'),
      },
      async resolve(_root, { id }, ctx) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        return ctx.services.inventoryService.getInventoryById(id, ctx.user);
      },
    });

    t.field('listInventoryGroupedByPimCategoryId', {
      type: nonNull(InventoryGroupedByCategoryResponse),
      args: {
        query: arg({ type: ListInventoryQuery }),
      },
      async resolve(_root, { query }, ctx) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        const filter = query?.filter ?? {};
        const page = query?.page ?? {};
        // Coerce nulls to undefined for type safety
        const safeFilter = {
          companyId: filter.companyId ?? undefined,
          workspaceId: filter.workspaceId ?? undefined,
          status: filter.status ?? undefined,
          isThirdPartyRental: filter.isThirdPartyRental ?? undefined,
          fulfilmentId: filter.fulfilmentId ?? undefined,
          purchaseOrderId: filter.purchaseOrderId ?? undefined,
          assetId: filter.assetId ?? undefined,
          pimCategoryId: filter.pimCategoryId ?? undefined,
        };
        const safePage = {
          size: page.size ?? 10, // Default page size
          number: page.number ?? 1, // Default page number
        };

        // Get items and total count
        const items =
          await ctx.services.inventoryService.listInventoryGroupedByPimCategoryId(
            {
              filter: safeFilter,
              page: safePage,
            },
            ctx.user,
          );

        const totalCount =
          await ctx.services.inventoryService.countInventoryGroupedByPimCategoryId(
            safeFilter,
            ctx.user,
          );

        const pageSize = safePage.size;
        const pageNumber = safePage.number;
        const totalPages = Math.ceil(totalCount / pageSize);

        return {
          items,
          totalCount,
          pageNumber,
          pageSize,
          totalPages,
        };
      },
    });

    t.field('getInventoryReservationById', {
      type: InventoryReservation,
      args: {
        id: nonNull('ID'),
      },
      async resolve(_root, { id }, ctx) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        return ctx.services.inventoryService.getReservationById(id, ctx.user);
      },
    });

    t.field('listInventoryReservations', {
      type: nonNull(InventoryReservationsResponse),
      args: {
        filter: arg({ type: ListInventoryReservationsFilter }),
        page: arg({ type: ListInventoryPage }),
      },
      async resolve(_root, { filter, page }, ctx) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        // Convert nulls to undefined for type safety
        const safeFilter = dropUndefinedKeys({
          pimCategoryId: filter?.pimCategoryId ?? undefined,
          startDate: filter?.startDate ?? undefined,
          endDate: filter?.endDate ?? undefined,
          inventoryId: filter?.inventoryId ?? undefined,
          fulfilmentId: filter?.fulfilmentId ?? undefined,
          type: filter?.type ?? undefined,
        });

        const safePage = {
          size: page?.size ?? 10, // Default page size
          number: page?.number ?? 1, // Default page number
        };

        // Get items
        const items =
          await ctx.services.inventoryService.listInventoryReservations(
            {
              filter: safeFilter,
              page: safePage,
            },
            ctx.user,
          );

        // Get total count for pagination
        const totalItems =
          await ctx.services.inventoryService.countInventoryReservations(
            safeFilter,
            ctx.user,
          );

        const pageSize = safePage.size;
        const pageNumber = safePage.number;
        const totalPages = Math.ceil(totalItems / pageSize);

        return {
          items,
          page: {
            number: pageNumber,
            size: pageSize,
            totalItems,
            totalPages,
          },
        };
      },
    });
  },
});

// --- Mutation inputs ---

export const CreateInventoryInput = inputObjectType({
  name: 'CreateInventoryInput',
  definition(t) {
    t.string('workspaceId');
    t.nonNull.field('status', { type: InventoryStatus });
    t.string('fulfilmentId');
    t.string('purchaseOrderId');
    t.string('purchaseOrderLineItemId');
    t.nonNull.boolean('isThirdPartyRental');
    t.string('assetId');
    t.string('pimCategoryId');
    t.string('pimCategoryPath');
    t.string('pimCategoryName');
    t.string('pimProductId');
    t.string('resourceMapId');
    t.list.nonNull.id('resourceMapIds');
    t.field('expectedReturnDate', { type: 'DateTime' });
    t.field('actualReturnDate', { type: 'DateTime' });
  },
});

export const UpdateInventorySerialisedIdInput = inputObjectType({
  name: 'UpdateInventorySerialisedIdInput',
  definition(t) {
    t.nonNull.string('assetId');
  },
});

export const BulkMarkInventoryReceivedInput = inputObjectType({
  name: 'BulkMarkInventoryReceivedInput',
  definition(t) {
    t.nonNull.list.nonNull.string('ids');
    t.field('receivedAt', { type: 'DateTime' });
    t.string('receiptNotes');
    t.string('pimProductId');
    t.string('resourceMapId');
    t.list.nonNull.id('resourceMapIds');
    t.field('conditionOnReceipt', { type: InventoryCondition });
    t.string('conditionNotes');
    t.string('assetId');
  },
});

export const BulkMarkInventoryReceivedResult = objectType({
  name: 'BulkMarkInventoryReceivedResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: Inventory });
    t.nonNull.int('totalProcessed');
  },
});

export const DeleteInventoryInput = inputObjectType({
  name: 'DeleteInventoryInput',
  definition(t) {
    t.nonNull.string('reason');
  },
});

export const CreateFulfilmentReservationInput = inputObjectType({
  name: 'CreateFulfilmentReservationInput',
  definition(t) {
    t.nonNull.id('inventoryId');
    t.nonNull.field('startDate', { type: 'DateTime' });
    t.nonNull.field('endDate', { type: 'DateTime' });
    t.nonNull.id('fulfilmentId');
    t.nonNull.field('salesOrderType', { type: 'FulfilmentType' });
  },
});

// Extend PurchaseOrder line item types with inventory field
export const RentalPurchaseOrderLineItemInventoryExtension = extendType({
  type: 'RentalPurchaseOrderLineItem',
  definition(t) {
    t.nonNull.list.nonNull.field('inventory', {
      type: 'Inventory',
      description: 'Inventory items associated with this line item',
      async resolve(parent, _args, ctx) {
        if (!parent._id) return [];
        return ctx.dataloaders.inventory.getInventoriesByPurchaseOrderLineItemId.load(
          parent._id,
        );
      },
    });
  },
});

export const SalePurchaseOrderLineItemInventoryExtension = extendType({
  type: 'SalePurchaseOrderLineItem',
  definition(t) {
    t.nonNull.list.nonNull.field('inventory', {
      type: 'Inventory',
      description: 'Inventory items associated with this line item',
      async resolve(parent, _args, ctx) {
        if (!parent._id) return [];
        return ctx.dataloaders.inventory.getInventoriesByPurchaseOrderLineItemId.load(
          parent._id,
        );
      },
    });
  },
});

// Fulfillment progress type for purchase orders
export const PurchaseOrderFulfillmentProgress = objectType({
  name: 'PurchaseOrderFulfillmentProgress',
  definition(t) {
    t.nonNull.int('totalItems', {
      description: 'Total number of inventory items for this purchase order',
    });
    t.nonNull.int('receivedItems', {
      description: 'Number of inventory items that have been received',
    });
    t.nonNull.int('onOrderItems', {
      description: 'Number of inventory items still on order',
    });
    t.nonNull.float('fulfillmentPercentage', {
      description: 'Percentage of items received (0-100)',
    });
    t.nonNull.boolean('isFullyFulfilled', {
      description: 'True when all items have been received',
    });
    t.nonNull.boolean('isPartiallyFulfilled', {
      description: 'True when some but not all items have been received',
    });
    t.nonNull.field('status', {
      type: 'String',
      description: 'Human-readable fulfillment status',
      resolve(parent: any) {
        if (parent.isFullyFulfilled) return 'FULLY_FULFILLED';
        if (parent.isPartiallyFulfilled) return 'PARTIALLY_FULFILLED';
        if (parent.onOrderItems > 0) return 'ON_ORDER';
        return 'NOT_STARTED';
      },
    });
  },
});

// Extend PurchaseOrder type with inventory and fulfillment progress
export const PurchaseOrderInventoryExtension = extendType({
  type: 'PurchaseOrder',
  definition(t) {
    t.nonNull.list.nonNull.field('inventory', {
      type: 'Inventory',
      description: 'All inventory items associated with this purchase order',
      async resolve(parent, _args, ctx) {
        if (!parent._id) return [];
        return ctx.dataloaders.inventory.getInventoriesByPurchaseOrderId.load(
          parent._id,
        );
      },
    });

    t.field('fulfillmentProgress', {
      type: 'PurchaseOrderFulfillmentProgress',
      description: 'Progress of inventory fulfillment for this purchase order',
      async resolve(parent, _args, ctx) {
        if (!parent._id) return null;

        const inventoryItems =
          await ctx.dataloaders.inventory.getInventoriesByPurchaseOrderId.load(
            parent._id,
          );

        const totalItems = inventoryItems.length;
        if (totalItems === 0) {
          return {
            totalItems: 0,
            receivedItems: 0,
            onOrderItems: 0,
            fulfillmentPercentage: 0,
            isFullyFulfilled: false,
            isPartiallyFulfilled: false,
          };
        }

        const receivedItems = inventoryItems.filter(
          (item: InventoryType) => item.status === 'RECEIVED',
        ).length;
        const onOrderItems = inventoryItems.filter(
          (item: InventoryType) => item.status === 'ON_ORDER',
        ).length;
        const fulfillmentPercentage = (receivedItems / totalItems) * 100;

        return {
          totalItems,
          receivedItems,
          onOrderItems,
          fulfillmentPercentage,
          isFullyFulfilled: receivedItems === totalItems,
          isPartiallyFulfilled: receivedItems > 0 && receivedItems < totalItems,
        };
      },
    });
  },
});

export const InventoryMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createInventory', {
      type: nonNull(Inventory),
      args: {
        input: nonNull(arg({ type: 'CreateInventoryInput' })),
      },
      async resolve(_root, { input }, ctx) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        const created = await ctx.services.inventoryService.createInventory(
          {
            workspaceId: input.workspaceId ?? undefined,
            status: input.status,
            fulfilmentId: input.fulfilmentId ?? undefined,
            purchaseOrderId: input.purchaseOrderId ?? undefined,
            purchaseOrderLineItemId: input.purchaseOrderLineItemId ?? undefined,
            isThirdPartyRental: input.isThirdPartyRental,
            assetId: input.assetId ?? undefined,
            pimCategoryId: input.pimCategoryId ?? undefined,
            pimCategoryPath: input.pimCategoryPath ?? undefined,
            pimCategoryName: input.pimCategoryName ?? undefined,
            pimProductId: input.pimProductId ?? undefined,
            resourceMapId: input.resourceMapId ?? undefined,
            resourceMapIds: input.resourceMapIds ?? undefined,
            expectedReturnDate: input.expectedReturnDate ?? undefined,
            actualReturnDate: input.actualReturnDate ?? undefined,
          },
          ctx.user,
        );

        return created;
      },
    });

    t.field('updateInventorySerialisedId', {
      type: Inventory,
      args: {
        id: nonNull('String'),
        input: nonNull(arg({ type: 'UpdateInventorySerialisedIdInput' })),
      },
      async resolve(_root, { id, input }, ctx) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        const updated =
          await ctx.services.inventoryService.updateInventorySerialisedId(
            id,
            input,
            ctx.user,
          );

        if (!updated) {
          throw new Error('Inventory not found or not authorized');
        }

        return updated;
      },
    });

    t.field('updateInventoryExpectedReturnDate', {
      type: Inventory,
      args: {
        id: nonNull('String'),
        expectedReturnDate: nonNull(arg({ type: 'DateTime' })),
      },
      async resolve(_root, { id, expectedReturnDate }, ctx) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        const updated =
          await ctx.services.inventoryService.updateInventoryReturnDates(
            id,
            {
              expectedReturnDate,
            },
            ctx.user,
          );

        if (!updated) {
          throw new Error('Inventory not found or not authorized');
        }

        return updated;
      },
    });

    t.field('updateInventoryActualReturnDate', {
      type: Inventory,
      args: {
        id: nonNull('String'),
        actualReturnDate: nonNull(arg({ type: 'DateTime' })),
      },
      async resolve(_root, { id, actualReturnDate }, ctx) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        const updated =
          await ctx.services.inventoryService.updateInventoryReturnDates(
            id,
            {
              actualReturnDate,
            },
            ctx.user,
          );

        if (!updated) {
          throw new Error('Inventory not found or not authorized');
        }

        return updated;
      },
    });

    t.field('deleteInventory', {
      type: nonNull('Boolean'),
      args: {
        id: nonNull('String'),
        input: nonNull(arg({ type: 'DeleteInventoryInput' })),
      },
      async resolve(_root, { id, input }, ctx) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        return ctx.services.inventoryService.deleteInventory(
          id,
          input,
          ctx.user,
        );
      },
    });

    t.field('bulkMarkInventoryReceived', {
      type: nonNull(BulkMarkInventoryReceivedResult),
      args: {
        input: nonNull(arg({ type: 'BulkMarkInventoryReceivedInput' })),
      },
      async resolve(_root, { input }, ctx) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        // Convert input to service format
        const serviceInput = {
          receivedAt: input.receivedAt ?? undefined,
          receiptNotes: input.receiptNotes ?? undefined,
          pimProductId: input.pimProductId ?? undefined,
          resourceMapId: input.resourceMapId ?? undefined,
          resourceMapIds: input.resourceMapIds ?? undefined,
          conditionOnReceipt: input.conditionOnReceipt ?? undefined,
          conditionNotes: input.conditionNotes ?? undefined,
          assetId: input.assetId ?? undefined,
        };

        // Call the transactional bulk service method
        const result =
          await ctx.services.inventoryService.bulkMarkInventoryReceived(
            input.ids,
            serviceInput,
            ctx.user,
          );

        return result;
      },
    });

    t.field('createFulfilmentReservation', {
      type: nonNull(FulfilmentReservation),
      args: {
        input: nonNull(arg({ type: 'CreateFulfilmentReservationInput' })),
      },
      async resolve(_root, { input }, ctx) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        const reservation =
          await ctx.services.inventoryService.createFulfilmentReservation(
            {
              inventoryId: input.inventoryId,
              startDate: input.startDate,
              endDate: input.endDate,
              fulfilmentId: input.fulfilmentId,
              salesOrderType: input.salesOrderType,
            },
            ctx.user,
          );

        return reservation;
      },
    });
  },
});
