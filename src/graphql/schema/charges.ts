import {
  objectType,
  inputObjectType,
  stringArg,
  arg,
  nonNull,
  queryField,
  mutationField,
  enumType,
  extendType,
} from 'nexus';
import { GraphQLContext } from '../context';
import { PaginationInfo, PageInfoInput } from './common';
import { dropNullKeys } from '../utils';

export const ChargeTypeEnum = enumType({
  name: 'ChargeType',
  members: ['RENTAL', 'SALE', 'SERVICE'],
});

// Charge object type
export const Charge = objectType({
  name: 'Charge',
  sourceType: {
    module: require.resolve('../../services/charges'),
    export: 'Charge',
  },
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.id('workspaceId');
    t.id('companyId', {
      deprecation: 'No longer used',
      // @ts-ignore
      resolve: (charge) => charge.companyId || '',
    });
    t.nonNull.int('amountInCents');
    t.nonNull.string('description');
    t.nonNull.field('chargeType', { type: ChargeTypeEnum });
    t.nonNull.id('contactId');
    t.field('contact', {
      type: 'Contact',
      resolve: (charge, _args, ctx: GraphQLContext) => {
        if (!ctx.user) {
          throw new Error('User not authenticated');
        }
        return ctx.dataloaders.contacts.getContactsById.load(charge.contactId);
      },
    });
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.id('projectId');
    t.field('project', {
      type: 'Project',
      resolve: (charge, _args, ctx: GraphQLContext) => {
        if (!charge.projectId) {
          return null;
        }
        return ctx.dataloaders.projects.getProjectsById.load(charge.projectId);
      },
    });
    t.id('salesOrderId');
    t.field('salesOrder', {
      type: 'SalesOrder',
      resolve: (charge, _args, ctx: GraphQLContext) => {
        if (!charge.salesOrderId) {
          return null;
        }
        return ctx.dataloaders.salesOrders.getSalesOrdersById.load(
          charge.salesOrderId,
        );
      },
    });
    t.string('purchaseOrderNumber');
    t.id('salesOrderLineItemId');
    t.field('salesOrderLineItem', {
      type: 'SalesOrderLineItem',
      resolve: (charge, _args, ctx: GraphQLContext) => {
        if (!charge.salesOrderLineItemId) {
          return null;
        }
        return ctx.dataloaders.salesOrders.getSalesOrderLineItemsById.load(
          charge.salesOrderLineItemId,
        );
      },
    });
    t.id('fulfilmentId');
    t.field('fulfilment', {
      type: 'Fulfilment',
      resolve: (charge, _args, ctx: GraphQLContext) => {
        if (!charge.fulfilmentId) {
          return null;
        }
        return ctx.services.fulfilmentService.getFulfilmentById(
          charge.fulfilmentId,
          ctx.user,
        );
      },
    });
    t.id('invoiceId');
    t.field('invoice', {
      type: 'Invoice',
      resolve: (charge, _args, ctx: GraphQLContext) => {
        if (!charge.invoiceId) {
          return null;
        }

        if (!ctx.user) {
          throw new Error('User not authenticated');
        }
        return ctx.services.invoiceService.getInvoiceById(
          charge.invoiceId,
          ctx.user,
        );
      },
    });
    t.field('billingPeriodStart', { type: 'DateTime' });
    t.field('billingPeriodEnd', { type: 'DateTime' });
  },
});

// ChargePage object for paginated results
export const ChargePage = objectType({
  name: 'ChargePage',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: Charge });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

// Input types
export const CreateChargeInput = inputObjectType({
  name: 'CreateChargeInput',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.nonNull.int('amountInCents');
    t.nonNull.string('description');
    t.nonNull.field('chargeType', { type: ChargeTypeEnum });
    t.nonNull.id('contactId');
    t.id('projectId');
    t.id('salesOrderId');
    t.id('purchaseOrderNumber');
    t.id('salesOrderLineItemId');
    t.id('fulfilmentId');
    t.id('invoiceId');
  },
});

export const ListChargesFilter = inputObjectType({
  name: 'ListChargesFilter',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.id('contactId');
    t.id('projectId');
    t.id('salesOrderId');
    t.id('purchaseOrderNumber');
    t.id('fulfilmentId');
    t.id('invoiceId');
    t.field('chargeType', { type: ChargeTypeEnum });
  },
});

// Queries
export const ListCharges = queryField('listCharges', {
  type: ChargePage,
  args: {
    filter: nonNull(arg({ type: ListChargesFilter })),
    page: PageInfoInput,
  },
  async resolve(_root, { filter, page }, ctx: GraphQLContext) {
    if (!ctx.user) {
      throw new Error('User not authenticated');
    }
    return ctx.services.chargeService.listCharges(
      {
        filter: {
          ...dropNullKeys(filter),
          workspaceId: filter.workspaceId,
        },
        page: {
          number: page?.number ?? 1,
          size: page?.size ?? 10,
        },
      },
      ctx.user,
    );
  },
});

export const HasAnyChargesBeenInvoicedForFulfillment = extendType({
  type: 'Fulfilment',
  definition(t) {
    t.nonNull.field('hasAnyChargesBeenInvoiced', {
      type: 'Boolean',
      args: {
        fulfilmentId: nonNull(stringArg()),
      },
      async resolve(_root, { fulfilmentId }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('User not authenticated');
        }
        return ctx.services.chargeService.hasAnyChargesBeenInvoicedForFulfillment(
          fulfilmentId,
          ctx.user,
        );
      },
    });
  },
});

export const CreateCharge = mutationField('createCharge', {
  type: Charge,
  args: {
    input: nonNull(arg({ type: CreateChargeInput })),
  },
  async resolve(_root, { input }, ctx: GraphQLContext) {
    if (!ctx.user) {
      throw new Error('User not authenticated');
    }
    return ctx.services.chargeService.createCharge(
      {
        workspaceId: input.workspaceId,
        amountInCents: input.amountInCents,
        description: input.description,
        chargeType: input.chargeType,
        contactId: input.contactId,
        projectId: input.projectId ?? undefined,
        salesOrderId: input.salesOrderId ?? undefined,
        salesOrderLineItemId: input.salesOrderLineItemId ?? undefined,
        fulfilmentId: input.fulfilmentId ?? undefined,
        invoiceId: input.invoiceId ?? undefined,
      },
      ctx.user,
    );
  },
});
