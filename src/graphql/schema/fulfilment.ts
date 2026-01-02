import {
  objectType,
  unionType,
  inputObjectType,
  enumType,
  interfaceType,
  extendType,
  nonNull,
  arg,
  list,
} from 'nexus';
import { PaginationInfo } from './common';
import { dropNullKeys } from '../utils';

// === Enums ===
export const FulfilmentTypeEnum = enumType({
  name: 'FulfilmentType',
  members: ['RENTAL', 'SALE', 'SERVICE'],
});

export const ServiceFulfilmentTaskStatusEnum = enumType({
  name: 'ServiceFulfilmentTaskStatus',
  members: ['OPEN', 'DONE', 'SKIPPED'],
});

export const ServiceFulfilmentTask = objectType({
  name: 'ServiceFulfilmentTask',
  sourceType: {
    module: require.resolve('../../services/fulfilment'),
    export: 'ServiceFulfilmentTask',
  },
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('title');
    t.nonNull.list.nonNull.string('activityTagIds');
    t.list.nonNull.string('contextTagIds');
    t.string('notes');
    t.nonNull.field('status', { type: ServiceFulfilmentTaskStatusEnum });
    t.field('completedAt', { type: 'DateTime' });
    t.string('completedBy');
  },
});

// === Interface for common fields ===
export const FulfilmentBase = interfaceType({
  name: 'FulfilmentBase',
  sourceType: {
    module: require.resolve('../../services/fulfilment'),
    export: 'Fulfilment',
  },
  definition(t) {
    t.nonNull.id('id');
    t.id('companyId', {
      deprecation:
        'CompanyId is deprecated and will be removed in future versions. Use workspaceId instead.',
      // @ts-ignore
      resolve: (parent) => parent.companyId || '',
    });
    t.nonNull.id('workspaceId', {
      resolve: (parent) => parent.workspace_id,
    });
    t.id('contactId');
    t.field('contact', {
      type: 'Contact',
      resolve: (parent, _, ctx) => {
        if (!parent.contactId) return null;
        return ctx.dataloaders.contacts.getContactsById.load(parent.contactId);
      },
    });
    t.id('projectId');
    t.field('project', {
      type: 'Project',
      resolve: (parent, _, ctx) => {
        if (!parent.projectId) return null;
        return ctx.dataloaders.projects.getProjectsById.load(parent.projectId);
      },
    });
    t.nonNull.string('purchaseOrderNumber');
    t.nonNull.id('salesOrderId');
    t.field('salesOrder', {
      type: 'SalesOrder',
      resolve: (parent, _, ctx) => {
        return ctx.dataloaders.salesOrders.getSalesOrdersById.load(
          parent.salesOrderId,
        );
      },
    });
    t.nonNull.id('salesOrderLineItemId');
    t.string('salesOrderPONumber');
    t.field('salesOrderLineItem', {
      type: 'SalesOrderLineItem',
      resolve: (parent, _, ctx) => {
        if (!parent.salesOrderLineItemId) {
          return null;
        }

        return ctx.dataloaders.salesOrders.getSalesOrderLineItemsById.load(
          parent.salesOrderLineItemId,
        );
      },
    });
    t.id('purchaseOrderLineItemId');
    t.field('purchaseOrderLineItem', {
      type: 'PurchaseOrderLineItem',
      resolve: (parent, _, ctx) => {
        if (!parent.purchaseOrderLineItemId) {
          return null;
        }

        return ctx.dataloaders.purchaseOrders.getPurchaseOrderLineItemsById.load(
          parent.purchaseOrderLineItemId,
        );
      },
    });
    t.nonNull.field('salesOrderType', { type: FulfilmentTypeEnum });
    t.id('workflowId');
    t.id('workflowColumnId');
    t.id('assignedToId');
    t.field('assignedTo', {
      type: 'User',
      resolve: (parent, _, ctx) => {
        if (!parent.assignedToId) return null;
        return ctx.dataloaders.users.getUsersById.load(parent.assignedToId);
      },
    });
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.nonNull.field('updatedAt', { type: 'DateTime' });
    t.id('priceId');
    t.field('price', {
      type: 'Price',
      resolve: (parent, _, ctx) => {
        if (!parent.priceId) return null;
        return ctx.dataloaders.prices.getPriceById.load(parent.priceId);
      },
    });
    t.id('pimCategoryId');
    t.field('pimCategory', {
      type: 'PimCategory',
      resolve: (parent, _, ctx) => {
        if (!parent.pimCategoryId) return null;
        return ctx.dataloaders.pimCategories.getPimCategoriesById.load(
          parent.pimCategoryId,
        );
      },
    });
    t.string('pimCategoryPath');
    t.string('pimCategoryName');
    t.string('priceName');
    t.id('pimProductId');
    t.field('pimProduct', {
      type: 'PimProduct',
      resolve: (parent, _, ctx) => {
        if (!parent.pimProductId) return null;
        return ctx.dataloaders.pimProducts.getPimProductsById.load(
          parent.pimProductId,
        );
      },
    });
  },
  resolveType(item) {
    switch (item.salesOrderType) {
      case 'RENTAL':
        return 'RentalFulfilment';
      case 'SALE':
        return 'SaleFulfilment';
      case 'SERVICE':
        return 'ServiceFulfilment';
      default:
        return null;
    }
  },
});

// === Object Types ===
export const RentalFulfilment = objectType({
  name: 'RentalFulfilment',
  sourceType: {
    module: require.resolve('../../services/fulfilment'),
    export: 'RentalFulfilment',
  },
  definition(t) {
    t.implements(FulfilmentBase);
    t.field('inventoryId', { type: 'ID' });
    t.field('inventory', {
      type: 'Inventory',
      resolve: (parent, _, ctx) => {
        if (!parent.inventoryId) return null;
        return ctx.dataloaders.inventory.getInventoriesById.load(
          parent.inventoryId,
        );
      },
    });
    t.field('rentalStartDate', { type: 'DateTime' });
    t.field('rentalEndDate', { type: 'DateTime' });
    t.field('expectedRentalEndDate', { type: 'DateTime' });
    t.nonNull.int('pricePerDayInCents');
    t.nonNull.int('pricePerWeekInCents');
    t.nonNull.int('pricePerMonthInCents');
    t.field('lastChargedAt', { type: 'DateTime' });
  },
});

export const SaleFulfilment = objectType({
  name: 'SaleFulfilment',
  sourceType: {
    module: require.resolve('../../services/fulfilment'),
    export: 'SaleFulfilment',
  },
  definition(t) {
    t.implements(FulfilmentBase);
    t.nonNull.int('quantity');
    t.float('salePrice', {
      resolve: (parent) => {
        // @ts-ignore
        return parent.unitCostInCents || parent.salePrice;
      },
    });
    t.nonNull.int('unitCostInCents', {
      resolve: (parent) => {
        // @ts-ignore
        return parent.unitCostInCents || parent.salePrice;
      },
    });
  },
});

export const ServiceFulfilment = objectType({
  name: 'ServiceFulfilment',
  sourceType: {
    module: require.resolve('../../services/fulfilment'),
    export: 'ServiceFulfilment',
  },
  definition(t) {
    t.implements(FulfilmentBase);
    t.field('serviceDate', { type: 'DateTime' });
    t.nonNull.int('unitCostInCents');
    t.list.field('tasks', { type: ServiceFulfilmentTask });
  },
});

export const Fulfilment = unionType({
  name: 'Fulfilment',
  definition(t) {
    t.members(RentalFulfilment, SaleFulfilment, ServiceFulfilment);
  },
  resolveType(item) {
    switch (item.salesOrderType) {
      case 'RENTAL':
        return 'RentalFulfilment';
      case 'SALE':
        return 'SaleFulfilment';
      case 'SERVICE':
        return 'ServiceFulfilment';
      default:
        return null;
    }
  },
});

// === Input Types ===

export const FulfilmentPimInput = inputObjectType({
  name: 'FulfilmentPimInput',
  definition(t) {
    t.nonNull.id('pimCategoryId');
    t.nonNull.string('pimCategoryPath');
    t.nonNull.string('pimCategoryName');
    t.id('pimProductId');
  },
});

export const CreateRentalFulfilmentInput = inputObjectType({
  name: 'CreateRentalFulfilmentInput',
  definition(t) {
    t.nonNull.string('salesOrderId');
    t.string('salesOrderLineItemId');
    t.string('assignedToId');
    t.field('rentalStartDate', { type: 'DateTime' });
    t.field('expectedRentalEndDate', { type: 'DateTime' });
    t.field('rentalEndDate', { type: 'DateTime' });
    t.id('workflowId');
    t.id('workflowColumnId');
    t.field('pimDetails', {
      type: FulfilmentPimInput,
      description:
        'If salesOrderLineItemId is not provided, these fields are required',
    });
    t.nonNull.int('pricePerDayInCents');
    t.nonNull.int('pricePerWeekInCents');
    t.nonNull.int('pricePerMonthInCents');
  },
});

export const CreateSaleFulfilmentInput = inputObjectType({
  name: 'CreateSaleFulfilmentInput',
  definition(t) {
    t.nonNull.string('salesOrderId');
    t.string('salesOrderLineItemId');
    t.string('assignedToId');
    t.nonNull.int('unitCostInCents');
    t.nonNull.int('quantity');
    t.id('workflowId');
    t.id('workflowColumnId');
    t.field('pimDetails', {
      type: FulfilmentPimInput,
      description:
        'If salesOrderLineItemId is not provided, these fields are required',
    });
  },
});

export const CreateServiceFulfilmentInput = inputObjectType({
  name: 'CreateServiceFulfilmentInput',
  definition(t) {
    t.nonNull.string('salesOrderId');
    t.string('salesOrderLineItemId');
    t.id('workflowId');
    t.id('workflowColumnId');
    t.string('assignedToId');
    t.nonNull.field('serviceDate', { type: 'DateTime' });
    t.field('pimDetails', {
      type: FulfilmentPimInput,
      description:
        'If salesOrderLineItemId is not provided, these fields are required',
    });
    t.nonNull.int('unitCostInCents');
  },
});

export const CreateServiceFulfilmentFromLineItemInput = inputObjectType({
  name: 'CreateServiceFulfilmentFromLineItemInput',
  definition(t) {
    t.nonNull.id('lineItemId');
    t.field('serviceDate', { type: 'DateTime' });
    t.id('workflowId');
    t.id('workflowColumnId');
    t.id('assignedToId');
  },
});

export const UpdateServiceFulfilmentTaskStatusInput = inputObjectType({
  name: 'UpdateServiceFulfilmentTaskStatusInput',
  definition(t) {
    t.nonNull.id('fulfilmentId');
    t.nonNull.string('taskId');
    t.nonNull.field('status', { type: ServiceFulfilmentTaskStatusEnum });
  },
});

export const ListFulfilmentsFilter = inputObjectType({
  name: 'ListFulfilmentsFilter',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.id('salesOrderId');
    t.id('salesOrderLineItemId');
    t.field('salesOrderType', { type: FulfilmentTypeEnum });
    t.id('workflowId');
    t.id('workflowColumnId');
    t.id('assignedTo');
  },
});

const ListFulfilmentsPage = inputObjectType({
  name: 'ListFulfilmentsPage',
  definition(t) {
    t.int('number', { default: 1 });
    t.int('size', { default: 10 });
  },
});

export const ListRentalFulfilmentsFilter = inputObjectType({
  name: 'ListRentalFulfilmentsFilter',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.id('salesOrderId');
    t.id('salesOrderLineItemId');
    t.field('salesOrderType', { type: FulfilmentTypeEnum });
    t.id('workflowId');
    t.id('workflowColumnId');
    t.id('assignedToId');
    t.field('timelineStartDate', { type: 'DateTime' });
    t.field('timelineEndDate', { type: 'DateTime' });
    t.boolean('hasInventoryAssigned');
    t.id('contactId');
    t.id('projectId');
    t.id('pimCategoryId');
  },
});

// === List Result Types ===
export const RentalFulfilments = list(nonNull(RentalFulfilment));

export const ListFulfilmentsResult = objectType({
  name: 'ListFulfilmentsResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: Fulfilment });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const ListRentalFulfilmentsResult = objectType({
  name: 'ListRentalFulfilmentsResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: RentalFulfilment });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

// === Query and Mutation extensions ===

export const FulfilmentQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('getFulfilmentById', {
      type: Fulfilment,
      args: {
        id: nonNull(arg({ type: 'ID' })),
      },
      async resolve(_, { id }, ctx) {
        return ctx.services.fulfilmentService.getFulfilmentById(id, ctx.user);
      },
    });
    t.field('listFulfilments', {
      type: ListFulfilmentsResult,
      args: {
        filter: nonNull(arg({ type: ListFulfilmentsFilter })),
        page: arg({
          type: ListFulfilmentsPage,
        }),
      },
      async resolve(_, args, ctx) {
        const filter: any = dropNullKeys(args.filter || {});
        // Map workspaceId to workspace_id for the service layer
        if (filter.workspaceId) {
          filter.workspace_id = filter.workspaceId;
          delete filter.workspaceId;
        }

        const { items, page } =
          await ctx.services.fulfilmentService.listFulfilments(
            {
              filter,
              page: {
                number: args.page?.number ?? 1,
                size: args.page?.size ?? 10,
              },
            },
            ctx.user,
          );
        return {
          items,
          page,
        };
      },
    });

    t.field('listRentalFulfilments', {
      type: ListRentalFulfilmentsResult,
      args: {
        filter: nonNull(arg({ type: ListRentalFulfilmentsFilter })),
        page: arg({
          type: ListFulfilmentsPage,
        }),
      },
      async resolve(_, args, ctx) {
        const cleanFilter: any = dropNullKeys(args.filter || {});
        // Map workspaceId to workspace_id for the service layer
        if (cleanFilter.workspaceId) {
          cleanFilter.workspace_id = cleanFilter.workspaceId;
          delete cleanFilter.workspaceId;
        }

        const { items, page } =
          await ctx.services.fulfilmentService.listRentalFulfilments(
            {
              filter: cleanFilter,
              page: {
                number: args.page?.number ?? 1,
                size: args.page?.size ?? 10,
              },
            },
            ctx.user,
          );
        return {
          items,
          page,
        };
      },
    });
  },
});

export const FulfilmentMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createRentalFulfilment', {
      type: RentalFulfilment,
      args: {
        input: nonNull(arg({ type: CreateRentalFulfilmentInput })),
      },
      // @ts-ignore
      async resolve(_, { input }, ctx) {
        if (!input.salesOrderLineItemId && !input.pimDetails) {
          throw new Error(
            'If salesOrderLineItemId is not provided, pimDetails are required',
          );
        }

        if (input.pimDetails) {
          return ctx.services.fulfilmentService.createFulfilment(
            dropNullKeys({
              ...input,
              ...input.pimDetails,
              salesOrderType: 'RENTAL' as const,
            }),
            ctx.user!,
          );
        }

        if (!input.salesOrderLineItemId) {
          throw new Error(
            'salesOrderLineItemId is required if pimDetails are not provided',
          );
        }

        return ctx.services.fulfilmentService.createFulfilmentFromSalesOrderItem(
          dropNullKeys({
            ...input,
            salesOrderLineItemId: input.salesOrderLineItemId,
            salesOrderType: 'RENTAL' as const,
          }),
          ctx.user,
        );
      },
    });
    t.field('createSaleFulfilment', {
      type: SaleFulfilment,
      args: {
        input: nonNull(arg({ type: CreateSaleFulfilmentInput })),
      },
      // @ts-ignore
      async resolve(_, { input }, ctx) {
        if (!input.salesOrderLineItemId && !input.pimDetails) {
          throw new Error(
            'If salesOrderLineItemId is not provided, pimDetails are required',
          );
        }

        if (input.pimDetails) {
          return ctx.services.fulfilmentService.createFulfilment(
            dropNullKeys({
              ...input,
              ...input.pimDetails,
              salesOrderType: 'SALE' as const,
            }),
            ctx.user!,
          );
        }

        if (!input.salesOrderLineItemId) {
          throw new Error(
            'salesOrderLineItemId is required if pimDetails are not provided',
          );
        }

        const r =
          await ctx.services.fulfilmentService.createFulfilmentFromSalesOrderItem(
            dropNullKeys({
              ...input,
              salesOrderLineItemId: input.salesOrderLineItemId,
              salesOrderType: 'SALE' as const,
            }),
            ctx.user,
          );

        return r;
      },
    });
    t.field('createServiceFulfilment', {
      type: ServiceFulfilment,
      args: {
        input: nonNull(arg({ type: CreateServiceFulfilmentInput })),
      },
      // @ts-ignore
      async resolve(_, { input }, ctx) {
        if (!input.salesOrderLineItemId && !input.pimDetails) {
          throw new Error(
            'If salesOrderLineItemId is not provided, pimDetails are required',
          );
        }

        if (input.pimDetails) {
          return ctx.services.fulfilmentService.createFulfilment(
            dropNullKeys({
              ...input,
              ...input.pimDetails,
              salesOrderType: 'SERVICE' as const,
            }),
            ctx.user!,
          );
        }

        if (!input.salesOrderLineItemId) {
          throw new Error(
            'salesOrderLineItemId is required if pimDetails are not provided',
          );
        }

        return ctx.services.fulfilmentService.createFulfilmentFromSalesOrderItem(
          dropNullKeys({
            ...input,
            salesOrderLineItemId: input.salesOrderLineItemId,
          }),
          ctx.user,
        );
      },
    });

    t.field('createServiceFulfilmentFromLineItem', {
      type: ServiceFulfilment,
      args: {
        input: nonNull(arg({ type: CreateServiceFulfilmentFromLineItemInput })),
      },
      async resolve(_, { input }, ctx) {
        return ctx.services.fulfilmentService.createServiceFulfilmentFromLineItem(
          {
            lineItemId: input.lineItemId,
            serviceDate: input.serviceDate ?? null,
            workflowId: input.workflowId ?? null,
            workflowColumnId: input.workflowColumnId ?? null,
            assignedToId: input.assignedToId ?? null,
          },
          ctx.user,
        );
      },
    });

    t.field('deleteFulfilment', {
      type: 'Boolean',
      args: {
        id: nonNull(arg({ type: 'ID' })),
      },
      async resolve(_, { id }, ctx) {
        return ctx.services.fulfilmentService.deleteFulfilment(id, ctx.user);
      },
    });

    t.field('updateServiceFulfilmentTaskStatus', {
      type: ServiceFulfilment,
      args: {
        input: nonNull(arg({ type: UpdateServiceFulfilmentTaskStatusInput })),
      },
      async resolve(_, { input }, ctx) {
        return ctx.services.fulfilmentService.updateServiceTaskStatus(
          input.fulfilmentId,
          { taskId: input.taskId, status: input.status as any },
          ctx.user,
        );
      },
    });

    t.field('updateFulfilmentColumn', {
      type: FulfilmentBase,
      args: {
        fulfilmentId: nonNull(arg({ type: 'ID' })),
        workflowColumnId: arg({ type: 'ID' }),
        workflowId: arg({ type: 'ID' }),
      },
      async resolve(_, { fulfilmentId, workflowColumnId, workflowId }, ctx) {
        return ctx.services.fulfilmentService.updateColumn(
          fulfilmentId,
          workflowColumnId || null,
          workflowId || null,
          ctx.user,
        );
      },
    });

    t.field('updateFulfilmentAssignee', {
      type: FulfilmentBase,
      args: {
        fulfilmentId: nonNull(arg({ type: 'ID' })),
        assignedToId: arg({ type: 'ID' }),
      },
      async resolve(_, { fulfilmentId, assignedToId }, ctx) {
        return ctx.services.fulfilmentService.updateAssignee(
          fulfilmentId,
          assignedToId || null,
          ctx.user,
        );
      },
    });

    t.field('setRentalStartDate', {
      type: RentalFulfilment,
      args: {
        fulfilmentId: nonNull(arg({ type: 'ID' })),
        rentalStartDate: nonNull(arg({ type: 'DateTime' })),
      },
      async resolve(_, { fulfilmentId, rentalStartDate }, ctx) {
        return ctx.services.fulfilmentService.setRentalStartDate(
          fulfilmentId,
          rentalStartDate,
          ctx.user,
        );
      },
    });
    t.field('setRentalEndDate', {
      type: RentalFulfilment,
      args: {
        fulfilmentId: nonNull(arg({ type: 'ID' })),
        rentalEndDate: nonNull(arg({ type: 'DateTime' })),
      },
      async resolve(_, { fulfilmentId, rentalEndDate }, ctx) {
        return ctx.services.fulfilmentService.setRentalEndDate(
          fulfilmentId,
          rentalEndDate,
          ctx.user,
        );
      },
    });

    t.field('setExpectedRentalEndDate', {
      type: RentalFulfilment,
      args: {
        fulfilmentId: nonNull(arg({ type: 'ID' })),
        expectedRentalEndDate: nonNull(arg({ type: 'DateTime' })),
      },
      async resolve(_, { fulfilmentId, expectedRentalEndDate }, ctx) {
        return ctx.services.fulfilmentService.setExpectedRentalEndDate(
          fulfilmentId,
          expectedRentalEndDate,
          ctx.user,
        );
      },
    });

    t.field('runNightlyRentalChargesJob', {
      type: nonNull(list(nonNull(RentalFulfilment))),
      async resolve(_parent, _args, ctx) {
        if (!ctx.user) {
          throw new Error('User must be authenticated to run this job');
        }
        return ctx.services.fulfilmentService.nightlyRentalChargesJob(ctx.user);
      },
    });

    t.field('runNightlyRentalChargesJobAsync', {
      type: 'Boolean',
      async resolve(_parent, _args, ctx) {
        if (!ctx.user) {
          throw new Error('User must be authenticated to run this job');
        }
        try {
          await ctx.services.fulfilmentService.nightlyRentalChargesJobAsync(
            ctx.user,
          );
          return true;
        } catch (error) {
          return false;
        }
      },
    });

    t.field('assignInventoryToRentalFulfilment', {
      type: RentalFulfilment,
      args: {
        fulfilmentId: nonNull(arg({ type: 'ID' })),
        inventoryId: nonNull(arg({ type: 'ID' })),
        allowOverlappingReservations: arg({ type: 'Boolean', default: false }),
      },
      async resolve(
        _,
        { fulfilmentId, inventoryId, allowOverlappingReservations },
        ctx,
      ) {
        if (!ctx.user) {
          throw new Error('User must be authenticated to assign inventory');
        }

        return ctx.services.fulfilmentService.assignInventoryToRentalFulfilmentWithReservation(
          {
            fulfilmentId,
            inventoryId,
            allowOverlappingReservations: allowOverlappingReservations ?? false,
          },
          ctx.user,
        );
      },
    });

    t.field('unassignInventoryFromRentalFulfilment', {
      type: RentalFulfilment,
      args: {
        fulfilmentId: nonNull(arg({ type: 'ID' })),
      },
      async resolve(_, { fulfilmentId }, ctx) {
        if (!ctx.user) {
          throw new Error('User must be authenticated to unassign inventory');
        }

        const fulfilment =
          await ctx.services.fulfilmentService.getFulfilmentById(
            fulfilmentId,
            ctx.user,
          );

        if (!fulfilment) {
          throw new Error(`Fulfilment with ID ${fulfilmentId} not found`);
        }

        if (fulfilment.salesOrderType !== 'RENTAL') {
          throw new Error(
            `Fulfilment with ID ${fulfilmentId} is not a rental fulfilment`,
          );
        }

        if (!fulfilment.inventoryId) {
          throw new Error(
            `Fulfilment with ID ${fulfilmentId} has no inventory assigned`,
          );
        }

        // TODO make this async
        // inventory service listens to fulfilment assignment changes
        // and deletes the reservation
        await ctx.services.inventoryService.deleteFulfilmentReservation(
          {
            fulfilmentId,
            inventoryId: fulfilment.inventoryId,
          },
          ctx.user,
        );

        const result =
          await ctx.services.fulfilmentService.unassignInventoryFromFulfilment(
            {
              fulfilmentId,
            },
            ctx.user,
          );

        if (result.salesOrderType !== 'RENTAL') {
          // makes TS happy
          throw new Error(
            `Fulfilment with ID ${fulfilmentId} is not a rental fulfilment`,
          );
        }

        return result;
      },
    });

    t.field('setFulfilmentPurchaseOrderLineItemId', {
      type: FulfilmentBase,
      args: {
        fulfilmentId: nonNull(arg({ type: 'ID' })),
        purchaseOrderLineItemId: arg({ type: 'ID' }),
      },
      async resolve(_, { fulfilmentId, purchaseOrderLineItemId }, ctx) {
        if (!ctx.user) {
          throw new Error('User must be authenticated');
        }

        return ctx.services.fulfilmentService.setPurchaseOrderLineItemId(
          fulfilmentId,
          purchaseOrderLineItemId || null,
          ctx.user,
        );
      },
    });
  },
});
