import {
  objectType,
  queryField,
  intArg,
  inputObjectType,
  mutationField,
  arg,
  enumType,
  unionType,
  nonNull,
} from 'nexus';
import {
  SalesOrdersService,
  RentalSalesOrderLineItemDoc,
  SaleSalesOrderLineItemDoc,
} from '../../services/sales_orders';
import { LINEITEM_STATUS } from '../../services/sales_orders/sales-order-line-items-model';

export const SalesOrderStatus = enumType({
  name: 'SalesOrderStatus',
  members: ['DRAFT', 'SUBMITTED'],
});

export const LineItemStatus = enumType({
  name: 'LineItemStatus',
  members: Object.keys(LINEITEM_STATUS),
});

export const DeliveryMethod = enumType({
  name: 'DeliveryMethod',
  members: ['DELIVERY', 'PICKUP'],
});

export const LineItemRentalPeriod = objectType({
  name: 'LineItemRentalPeriod',
  definition(t) {
    t.nonNull.int('days28');
    t.nonNull.int('days7');
    t.nonNull.int('days1');
  },
});

export const LineItemPricing = objectType({
  name: 'LineItemPricing',
  definition(t) {
    t.nonNull.int('pricePer28DaysInCents');
    t.nonNull.int('pricePer7DaysInCents');
    t.nonNull.int('pricePer1DayInCents');
  },
});

export const LineItemCostOptionDetails = objectType({
  name: 'LineItemCostOptionDetails',
  definition(t) {
    t.nonNull.field('exactSplitDistribution', { type: 'LineItemRentalPeriod' });
    t.nonNull.field('optimalSplit', { type: 'LineItemRentalPeriod' });
    t.nonNull.field('rates', { type: 'LineItemPricing' });
    t.nonNull.string('plainText');
  },
});

type LineItemPrice = Awaited<
  ReturnType<SalesOrdersService['getPriceForLineItem']>
>;

type ForcastResponse = Extract<
  NonNullable<LineItemPrice>,
  { forecast: unknown }
>['forecast'];

type ForcastResponseDay = ForcastResponse['days'][number];

export const LineItemPriceForecastDay = objectType({
  name: 'LineItemPriceForecastDay',
  definition(t) {
    t.nonNull.int('day');
    t.nonNull.int('accumulative_cost_in_cents', {
      resolve: (parent) =>
        (parent as ForcastResponseDay).accumulativeCostInCents,
    });
    t.nonNull.string('strategy');
    t.nonNull.int('cost_in_cents', {
      resolve: (parent) => (parent as ForcastResponseDay).costInCents,
    });
    t.nonNull.field('rental_period', {
      type: 'LineItemRentalPeriod',
      resolve: (parent) => (parent as ForcastResponseDay).rentalPeriod,
    });
    t.nonNull.int('savings_compared_to_exact_split_in_cents', {
      resolve: (parent) =>
        (parent as ForcastResponseDay).savingsComparedToExactSplitInCents,
    });
    t.nonNull.int('savings_compared_to_day_rate_in_cents', {
      resolve: (parent) =>
        (parent as ForcastResponseDay).savingsComparedToDayRateInCents,
    });
    t.nonNull.float('savings_compared_to_day_rate_in_fraction', {
      resolve: (parent) =>
        (parent as ForcastResponseDay).savingsComparedToDayRateInFraction,
    });
    t.nonNull.field('details', {
      type: 'LineItemCostOptionDetails',
      resolve: (parent) => (parent as ForcastResponseDay).details,
    });
  },
});

export const LineItemPriceForecast = objectType({
  name: 'LineItemPriceForecast',
  definition(t) {
    t.nonNull.list.nonNull.field('days', { type: 'LineItemPriceForecastDay' });
    t.nonNull.int('accumulative_cost_in_cents', {
      resolve: (parent) => (parent as ForcastResponse).accumulativeCostInCents,
    });
  },
});

export const SalesOrderLineItemPriceEstimate = objectType({
  name: 'SalesOrderLineItemPriceEstimate',
  definition(t) {
    t.string('strategy');
    t.int('costInCents');
    t.field('rentalPeriod', { type: 'LineItemRentalPeriod' });
    t.int('savingsComparedToExactSplitInCents');
    t.int('savingsComparedToDayRateInCents');
    t.float('savingsComparedToDayRateInFraction');
    t.field('details', { type: 'LineItemCostOptionDetails' });
    t.int('delivery_cost_in_cents', {
      description: 'Delivery cost in cents for this line item',
      resolve: (parent) => {
        if (!parent) return null;
        const price = parent as Awaited<
          ReturnType<SalesOrdersService['getPriceForLineItem']>
        >;
        if (
          price?.type === 'fixed_term_rental_price_estimate' ||
          price?.type === 'unfixed_term_rental_price_estimate'
        ) {
          return price?.deliveryCostInCents ?? null;
        }
        return null;
      },
    });
    t.int('total_including_delivery_in_cents', {
      description: 'Total cost including delivery in cents for this line item',
      resolve: (parent) => {
        if (!parent) return null;
        const price = parent as ReturnType<typeof mapPriceEstimateToGql>;

        return price?.type === 'fixed_term_rental_price_estimate'
          ? price.total_including_delivery_in_cents
          : price?.type === 'unfixed_term_rental_price_estimate'
            ? null
            : price?.type === 'sales_item_price_estimate'
              ? price.costInCents
              : null;
      },
    });
    t.field('forecast', {
      type: 'LineItemPriceForecast',
      description: 'Forecast of accumulative cost over a range of days',
      args: {
        number_of_days: intArg({ default: 200 }),
      },
      resolve: (parent, args) => {
        if (!parent) return null;
        const price = parent as LineItemPrice;
        if (price?.type === 'sales_item_price_estimate') {
          return null;
        }
        const forecast = price?.forecast ?? null;
        if (!forecast) return null;
        const numberOfDays =
          (args as { number_of_days?: number })?.number_of_days ?? 200;
        return {
          ...forecast,
          days: Array.isArray(forecast.days)
            ? forecast.days.slice(0, numberOfDays)
            : [],
        };
      },
    });
  },
});

/**
 * Maps the result of getPriceForLineItem to the SalesOrderLineItemPriceEstimate GraphQL type.
 */
function mapPriceEstimateToGql(
  price: Awaited<ReturnType<SalesOrdersService['getPriceForLineItem']>>,
) {
  if (!price) return null;
  if (price.type === 'fixed_term_rental_price_estimate') {
    return {
      type: price.type,
      strategy: price.strategy ?? null,
      costInCents: price.costInCents ?? null,
      rentalPeriod: price.rentalPeriod ?? null,
      savingsComparedToExactSplitInCents:
        price.savingsComparedToExactSplitInCents ?? null,
      savingsComparedToDayRateInCents:
        price.savingsComparedToDayRateInCents ?? null,
      savingsComparedToDayRateInFraction:
        price.savingsComparedToDayRateInFraction ?? null,
      details: price.details ?? null,
      delivery_cost_in_cents: price.deliveryCostInCents ?? null,
      total_including_delivery_in_cents:
        price.totalIncludingDeliveryInCents ?? null,
      forecast: price.forecast ?? null,
    };
  }
  if (price.type === 'unfixed_term_rental_price_estimate') {
    return {
      type: price.type,
      strategy: null,
      costInCents: null,
      rentalPeriod: null,
      savingsComparedToExactSplitInCents: null,
      savingsComparedToDayRateInCents: null,
      savingsComparedToDayRateInFraction: null,
      details: null,
      delivery_cost_in_cents: price.deliveryCostInCents ?? null,
      total_including_delivery_in_cents: null,
      forecast: price.forecast ?? null,
    };
  }
  if (price.type === 'sales_item_price_estimate') {
    return {
      type: price.type,
      strategy: null,
      costInCents: price.subtotal,
      rentalPeriod: null,
      savingsComparedToExactSplitInCents: null,
      savingsComparedToDayRateInCents: null,
      savingsComparedToDayRateInFraction: null,
      details: null,
      total_including_delivery_in_cents: null,
    };
  }
  return null;
}

// RentalSalesOrderLineItem GQL type
export const RentalSalesOrderLineItem = objectType({
  name: 'RentalSalesOrderLineItem',
  sourceType: {
    export: 'RentalSalesOrderLineItemDoc',
    module: require.resolve('../../services/sales_orders'),
  },
  definition(t) {
    t.nonNull.string('id', { resolve: (parent) => parent._id });
    t.string('so_pim_id'); // cat or prod id
    t.int('so_quantity');
    t.string('company_id');
    t.string('created_at');
    t.string('created_by');
    t.string('updated_at');
    t.string('updated_by');
    t.nonNull.field('lineitem_type', { type: 'LineItemType' });
    t.string('price_id');
    t.field('lineitem_status', { type: 'LineItemStatus' });
    t.nonNull.string('sales_order_id');
    t.string('intake_form_submission_line_item_id');
    t.string('quote_revision_line_item_id');
    t.string('deleted_at', {
      resolve: (parent: any) =>
        parent.deleted_at
          ? parent.deleted_at instanceof Date
            ? parent.deleted_at.toISOString()
            : parent.deleted_at
          : null,
    });
    t.field('price', {
      type: 'Price',
      resolve: async (parent, _, ctx) => {
        if (!parent.price_id) return null;
        return ctx.dataloaders.prices.getPriceById.load(parent.price_id);
      },
    });
    t.field('calulate_price', {
      type: SalesOrderLineItemPriceEstimate,
      description:
        'Full calculated price estimate for the line item (fixed or unfixed term)',
      resolve: async (parent, _, ctx) => {
        if (!parent._id || !ctx.user) return null;
        const price = await ctx.services.salesOrdersService.getPriceForLineItem(
          parent._id,
          ctx.user,
        );
        return mapPriceEstimateToGql(price);
      },
    });
    t.field('created_by_user', {
      type: 'User',
      resolve: async (parent, _, ctx) => {
        if (!parent.created_by) return null;
        return ctx.dataloaders.users.getUsersById.load(parent.created_by);
      },
    });
    t.field('updated_by_user', {
      type: 'User',
      resolve: async (parent, _, ctx) => {
        if (!parent.updated_by) return null;
        return ctx.dataloaders.users.getUsersById.load(parent.updated_by);
      },
    });
    t.field('delivery_method', { type: 'DeliveryMethod' });
    t.string('delivery_location');
    t.int('delivery_charge_in_cents');
    t.string('delivery_date');
    t.string('off_rent_date');
    t.string('deliveryNotes');
    t.int('totalDaysOnRent', {
      description:
        'Total days on rent (inclusive of start date, exclusive of end date)',
      resolve: (parent) => {
        if (!parent.delivery_date || !parent.off_rent_date) {
          return null;
        }

        try {
          const deliveryDate = new Date(parent.delivery_date);
          const offRentDate = new Date(parent.off_rent_date);

          // Check if dates are valid
          if (isNaN(deliveryDate.getTime()) || isNaN(offRentDate.getTime())) {
            return null;
          }

          // Calculate difference in milliseconds
          const diffInMs = offRentDate.getTime() - deliveryDate.getTime();

          // Convert to days (1 day = 24 * 60 * 60 * 1000 ms)
          const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

          // Return null if the result would be negative
          if (diffInDays < 0) {
            return null;
          }

          return diffInDays;
        } catch (error) {
          return null;
        }
      },
    });

    t.field('so_pim_product', {
      type: 'PimProduct',
      resolve: async (parent, _, ctx) => {
        if (!parent.so_pim_id) return null;
        return ctx.dataloaders.pimProducts.getPimProductsById.load(
          parent.so_pim_id,
        );
      },
    });
    t.field('so_pim_category', {
      type: 'PimCategory',
      resolve: async (parent, _, ctx) => {
        if (!parent.so_pim_id) return null;
        return ctx.dataloaders.pimCategories.getPimCategoriesById.load(
          parent.so_pim_id,
        );
      },
    });
    t.field('intakeFormSubmissionLineItem', {
      type: 'IntakeFormLineItem',
      description:
        'The intake form submission line item associated with this sales order line item',
      resolve: async (parent, _, ctx) => {
        if (!parent.intake_form_submission_line_item_id) return null;
        return ctx.services.intakeFormService.getLineItemById(
          parent.intake_form_submission_line_item_id,
          ctx.user,
        );
      },
    });
  },
});

// SaleSalesOrderLineItem GQL type
export const SaleSalesOrderLineItem = objectType({
  name: 'SaleSalesOrderLineItem',
  sourceType: {
    export: 'SaleSalesOrderLineItemDoc',
    module: require.resolve('../../services/sales_orders'),
  },
  definition(t) {
    t.nonNull.string('id', { resolve: (parent) => parent._id });
    t.string('so_pim_id');
    t.int('so_quantity');
    t.string('company_id');
    t.string('created_at');
    t.string('created_by');
    t.string('updated_at');
    t.string('updated_by');
    t.nonNull.field('lineitem_type', { type: 'LineItemType' });
    t.string('price_id');
    t.field('lineitem_status', { type: 'LineItemStatus' });
    t.nonNull.string('sales_order_id');
    t.string('intake_form_submission_line_item_id');
    t.string('quote_revision_line_item_id');
    t.string('deleted_at');
    t.field('price', {
      type: 'Price',
      resolve: async (parent, _, ctx) => {
        if (!parent.price_id) return null;
        return ctx.dataloaders.prices.getPriceById.load(parent.price_id);
      },
    });
    t.field('created_by_user', {
      type: 'User',
      resolve: async (parent, _, ctx) => {
        if (!parent.created_by) return null;
        return ctx.dataloaders.users.getUsersById.load(parent.created_by);
      },
    });
    t.field('updated_by_user', {
      type: 'User',
      resolve: async (parent, _, ctx) => {
        if (!parent.updated_by) return null;
        return ctx.dataloaders.users.getUsersById.load(parent.updated_by);
      },
    });
    t.string('deliveryNotes');
    t.field('delivery_method', { type: 'DeliveryMethod' });
    t.string('delivery_location');
    t.int('delivery_charge_in_cents');
    t.string('delivery_date');
    t.field('so_pim_product', {
      type: 'PimProduct',
      resolve: async (parent, _, ctx) => {
        if (!parent.so_pim_id) return null;
        return ctx.dataloaders.pimProducts.getPimProductsById.load(
          parent.so_pim_id,
        );
      },
    });
    t.field('so_pim_category', {
      type: 'PimCategory',
      resolve: async (parent, _, ctx) => {
        if (!parent.so_pim_id) return null;
        return ctx.dataloaders.pimCategories.getPimCategoriesById.load(
          parent.so_pim_id,
        );
      },
    });
    t.field('intakeFormSubmissionLineItem', {
      type: 'IntakeFormLineItem',
      description:
        'The intake form submission line item associated with this sales order line item',
      resolve: async (parent, _, ctx) => {
        if (!parent.intake_form_submission_line_item_id) return null;
        return ctx.services.intakeFormService.getLineItemById(
          parent.intake_form_submission_line_item_id,
          ctx.user,
        );
      },
    });
  },
});

export const SalesOrderLineItem = unionType({
  name: 'SalesOrderLineItem',
  definition(t) {
    t.members(RentalSalesOrderLineItem, SaleSalesOrderLineItem);
  },
  resolveType(item) {
    if (item.lineitem_type === 'RENTAL') return 'RentalSalesOrderLineItem';
    if (item.lineitem_type === 'SALE') return 'SaleSalesOrderLineItem';
    return null;
  },
});

export const SalesOrderPricing = objectType({
  name: 'SalesOrderPricing',
  definition(t) {
    t.int('sub_total_in_cents', {
      description: 'Sum of all line item totals (pre-tax)',
    });
    t.int('total_in_cents', {
      description: 'Total amount (same as sub_total_in_cents, no tax included)',
    });
  },
});

export const SalesOrder = objectType({
  name: 'SalesOrder',
  sourceType: {
    export: 'SalesOrderDoc',
    module: require.resolve('../../services/sales_orders'),
  },
  definition(t) {
    t.nonNull.string('id', { resolve: (parent) => parent._id });
    t.nonNull.field('status', {
      type: SalesOrderStatus,
      description: 'Status of the sales order',
    });
    t.string('workspace_id');
    t.string('intake_form_submission_id');
    t.string('project_id');
    t.nonNull.string('buyer_id');
    t.string('purchase_order_number');
    t.nonNull.string('sales_order_number');
    t.string('quote_id');
    t.string('quote_revision_id');
    t.nonNull.string('company_id', {
      deprecation: 'Use workspace_id instead',
      resolve: (parent, args, ctx) => ctx.user?.companyId || '',
    });
    t.nonNull.string('created_at');
    t.nonNull.string('created_by');
    t.nonNull.string('updated_at');
    t.nonNull.string('updated_by');
    t.string('deleted_at', {
      resolve: (parent: any) =>
        parent.deleted_at
          ? parent.deleted_at instanceof Date
            ? parent.deleted_at.toISOString()
            : parent.deleted_at
          : null,
    });
    t.field('created_by_user', {
      type: 'User',
      resolve: async (parent, _, ctx) => {
        if (!parent.created_by) return null;
        return ctx.dataloaders.users.getUsersById.load(parent.created_by);
      },
    });
    t.field('updated_by_user', {
      type: 'User',
      resolve: async (parent, _, ctx) => {
        if (!parent.updated_by) return null;
        return ctx.dataloaders.users.getUsersById.load(parent.updated_by);
      },
    });
    t.field('project', {
      type: 'Project',
      resolve: (parent, _, ctx) => {
        if (!parent.project_id) return null;
        return ctx.dataloaders.projects.getProjectsById.load(parent.project_id);
      },
    });
    t.field('buyer', {
      type: 'Contact',
      resolve: async (parent, _, ctx) => {
        if (!parent.buyer_id) return null;
        return ctx.dataloaders.contacts.getContactsById.load(parent.buyer_id);
      },
    });
    t.list.field('line_items', {
      type: 'SalesOrderLineItem',
      async resolve(parent, _args, ctx) {
        const salesOrderId = parent._id;
        const items =
          await ctx.services.salesOrdersService.getLineItemsBySalesOrderId(
            salesOrderId,
            ctx.user,
          );

        return items;
      },
    });

    t.nonNull.list.nonNull.field('lineItems', {
      type: 'LineItem',
      description: 'Canonical line items for this sales order (source of truth).',
      async resolve(parent, _args, ctx) {
        if (!ctx.user) return [];
        const workspaceId = parent.workspace_id;
        if (!workspaceId) return [];
        return ctx.services.lineItemsService.listLineItemsByDocumentRef(
          workspaceId,
          { type: 'SALES_ORDER', id: parent._id },
          ctx.user,
        );
      },
    });

    t.field('pricing', {
      type: 'SalesOrderPricing',
      description: 'Pricing summary for the sales order',
      async resolve(parent, _args, ctx) {
        const salesOrderId = parent._id;
        const user = ctx.user;
        if (!user) return null;
        return ctx.services.salesOrdersService.getSalesOrderPricing(
          salesOrderId,
          user,
        );
      },
    });

    t.field('intakeFormSubmission', {
      type: 'IntakeFormSubmission',
      description:
        'The intake form submission associated with this sales order',
      async resolve(parent, _args, ctx) {
        if (parent.intake_form_submission_id) {
          return ctx.services.intakeFormService.getIntakeFormSubmissionById(
            parent.intake_form_submission_id,
            ctx.user,
          );
        }

        const salesOrderId = parent._id;
        const user = ctx.user;
        if (!user) return null;

        try {
          return await ctx.services.intakeFormService.getIntakeFormSubmissionBySalesOrderId(
            salesOrderId,
            user,
          );
        } catch (error) {
          // Return null if no submission found or user doesn't have permission
          return null;
        }
      },
    });
  },
});

export const SalesOrderInput = inputObjectType({
  name: 'SalesOrderInput',
  definition(t) {
    t.nonNull.string('workspace_id');
    t.string('project_id');
    t.nonNull.string('buyer_id');
    t.string('purchase_order_number');
    t.string('sales_order_number');
    t.string('intake_form_submission_id');
    // order_id, created_at, updated_at, companyId will be set by backend
  },
});

export const UpdateSalesOrderInput = inputObjectType({
  name: 'UpdateSalesOrderInput',
  definition(t) {
    t.nonNull.string('id');
    t.string('workspace_id');
    t.string('project_id');
    t.string('buyer_id');
    t.string('purchase_order_number');
    t.string('sales_order_number');
  },
});

export const CreateRentalSalesOrderLineItemInput = inputObjectType({
  name: 'CreateRentalSalesOrderLineItemInput',
  definition(t) {
    t.nonNull.string('sales_order_id');
    t.string('intake_form_submission_line_item_id');
    t.string('so_pim_id');
    t.int('so_quantity');
    t.string('price_id');
    t.field('lineitem_status', { type: 'LineItemStatus' });
    t.field('delivery_method', { type: 'DeliveryMethod' });
    t.string('delivery_location');
    t.int('delivery_charge_in_cents');
    t.string('delivery_date');
    t.string('off_rent_date');
    t.string('deliveryNotes');
  },
});

export const CreateSaleSalesOrderLineItemInput = inputObjectType({
  name: 'CreateSaleSalesOrderLineItemInput',
  definition(t) {
    t.nonNull.string('sales_order_id');
    t.string('intake_form_submission_line_item_id');
    t.string('so_pim_id');
    t.int('so_quantity');
    t.string('price_id');
    t.field('lineitem_status', { type: 'LineItemStatus' });
    t.string('deliveryNotes');
    t.string('delivery_location');
    t.int('delivery_charge_in_cents');
    t.string('delivery_date');
    t.field('delivery_method', { type: 'DeliveryMethod' });
  },
});
export const UpdateSalesOrderLineItemInput = inputObjectType({
  name: 'UpdateSalesOrderLineItemInput',
  definition(t) {
    t.nonNull.string('id');
    t.string('so_pim_id');
    t.int('so_quantity');
    t.field('lineitem_type', { type: 'LineItemType' });
    t.string('price_id');
    // RENTAL fields
    t.field('delivery_method', { type: 'DeliveryMethod' });
    t.string('delivery_location');
    t.int('delivery_charge_in_cents');
    t.string('delivery_date');
    t.string('off_rent_date');
    // Both types
    t.field('lineitem_status', { type: 'LineItemStatus' });
    t.string('deliveryNotes');
  },
});

export const UpdateRentalSalesOrderLineItemInput = inputObjectType({
  name: 'UpdateRentalSalesOrderLineItemInput',
  definition(t) {
    t.nonNull.string('id');
    t.string('so_pim_id');
    t.int('so_quantity');
    t.string('price_id');
    t.field('lineitem_status', { type: 'LineItemStatus' });
    t.field('delivery_method', { type: 'DeliveryMethod' });
    t.string('delivery_location');
    t.int('delivery_charge_in_cents');
    t.string('delivery_date');
    t.string('off_rent_date');
    t.string('deliveryNotes');
  },
});

export const UpdateSaleSalesOrderLineItemInput = inputObjectType({
  name: 'UpdateSaleSalesOrderLineItemInput',
  definition(t) {
    t.nonNull.string('id');
    t.string('so_pim_id');
    t.int('so_quantity');
    t.string('price_id');
    t.field('lineitem_status', { type: 'LineItemStatus' });
    t.string('deliveryNotes');
    t.string('delivery_location');
    t.int('delivery_charge_in_cents');
    t.string('delivery_date');
    t.field('delivery_method', { type: 'DeliveryMethod' });
  },
});

export const createSalesOrder = mutationField('createSalesOrder', {
  type: 'SalesOrder',
  args: {
    input: arg({ type: 'SalesOrderInput' }),
  },
  async resolve(_, { input }, ctx) {
    if (!input) {
      throw new Error('Input is required');
    }

    if (!ctx.user) {
      throw new Error('User is not authenticated');
    }

    let salesOrderNumber = input.sales_order_number;

    if (!salesOrderNumber) {
      salesOrderNumber =
        await ctx.services.referenceNumberService.generateReferenceNumberForEntity(
          {
            entityType: 'SO',
            workspaceId: input.workspace_id,
            projectId: input.project_id || undefined,
            contactId: input.buyer_id || undefined,
          },
          ctx.user,
        );
    }

    const created = await ctx.services.salesOrdersService.createSalesOrder(
      {
        workspace_id: input.workspace_id,
        project_id: input.project_id || undefined,
        buyer_id: input.buyer_id,
        purchase_order_number: input.purchase_order_number || undefined,
        sales_order_number: salesOrderNumber,
        intake_form_submission_id: input.intake_form_submission_id || undefined,
      },
      ctx.user,
    );
    if (!created) {
      return null;
    }

    return created;
  },
});

export const updateSalesOrder = mutationField('updateSalesOrder', {
  type: 'SalesOrder',
  args: {
    input: arg({ type: 'UpdateSalesOrderInput' }),
  },
  async resolve(_, { input }, ctx) {
    if (!input) {
      throw new Error('Input is required');
    }
    const { id, ...patch } = input;
    const sanitizedPatch = Object.fromEntries(
      Object.entries(patch).filter(([_, v]) => v !== undefined),
    );
    const updated = await ctx.services.salesOrdersService.patchSalesOrder(
      id,
      sanitizedPatch,
      ctx.user,
    );
    if (!updated) {
      return null;
    }

    return updated;
  },
});

export const createRentalSalesOrderLineItem = mutationField(
  'createRentalSalesOrderLineItem',
  {
    type: 'RentalSalesOrderLineItem',
    args: {
      input: arg({ type: 'CreateRentalSalesOrderLineItemInput' }),
    },
    async resolve(_, { input }, ctx) {
      if (!input) {
        throw new Error('Input is required');
      }

      const sanitizedInput = Object.fromEntries(
        Object.entries(input).map(([k, v]) => [k, v === null ? undefined : v]),
      );
      const created =
        (await ctx.services.salesOrdersService.createSalesOrderLineItem(
          { ...(sanitizedInput as any), lineitem_type: 'RENTAL' },
          ctx.user,
        )) as RentalSalesOrderLineItemDoc;

      if (!created) {
        return null;
      }

      return created;
    },
  },
);

export const createSaleSalesOrderLineItem = mutationField(
  'createSaleSalesOrderLineItem',
  {
    type: 'SaleSalesOrderLineItem',
    args: {
      input: arg({ type: 'CreateSaleSalesOrderLineItemInput' }),
    },
    async resolve(_, { input }, ctx) {
      if (!input) {
        throw new Error('Input is required');
      }
      const sanitizedInput = Object.fromEntries(
        Object.entries(input).map(([k, v]) => [k, v === null ? undefined : v]),
      );
      const created =
        (await ctx.services.salesOrdersService.createSalesOrderLineItem(
          { ...(sanitizedInput as any), lineitem_type: 'SALE' },
          ctx.user,
        )) as SaleSalesOrderLineItemDoc;

      if (!created) {
        return null;
      }

      return created;
    },
  },
);

export const updateSalesOrderLineItem = mutationField(
  'updateSalesOrderLineItem',
  {
    type: 'SalesOrderLineItem',
    deprecation: 'use updateSaleSalesOrderLineItem',
    args: {
      input: arg({ type: 'UpdateSalesOrderLineItemInput' }),
    },
    async resolve(_, { input }, ctx) {
      if (!input) {
        throw new Error('Input is required');
      }
      const { id, ...patch } = input;
      const sanitizedPatch = Object.fromEntries(
        Object.entries(patch).filter(([_, v]) => v !== undefined),
      );
      const updated =
        await ctx.services.salesOrdersService.patchSalesOrderLineItem(
          id,
          sanitizedPatch,
          ctx.user,
        );
      if (!updated) {
        return null;
      }

      return updated;
    },
  },
);

export const updateRentalSalesOrderLineItem = mutationField(
  'updateRentalSalesOrderLineItem',
  {
    type: 'RentalSalesOrderLineItem',
    args: {
      input: arg({ type: 'UpdateRentalSalesOrderLineItemInput' }),
    },
    async resolve(_, { input }, ctx) {
      if (!input) {
        throw new Error('Input is required');
      }
      const { id, ...patch } = input;
      const sanitizedPatch = Object.fromEntries(
        Object.entries(patch).filter(([_, v]) => v !== null),
      );
      const updated =
        (await ctx.services.salesOrdersService.patchRentalSalesOrderLineItem(
          id,
          sanitizedPatch,
          ctx.user,
        )) as RentalSalesOrderLineItemDoc;
      if (!updated) {
        return null;
      }

      return updated;
    },
  },
);

export const updateSaleSalesOrderLineItem = mutationField(
  'updateSaleSalesOrderLineItem',
  {
    type: 'SaleSalesOrderLineItem',
    args: {
      input: arg({ type: 'UpdateSaleSalesOrderLineItemInput' }),
    },
    async resolve(_, { input }, ctx) {
      if (!input) {
        throw new Error('Input is required');
      }
      const { id, ...patch } = input;
      const sanitizedPatch = Object.fromEntries(
        Object.entries(patch).filter(([_, v]) => v !== undefined),
      );

      // First, fetch the line item to verify it's a SALE type
      const lineItem = await ctx.services.salesOrdersService.getLineItemById(
        id,
        ctx.user,
      );
      if (!lineItem) {
        throw new Error('Line item not found');
      }
      if (lineItem.lineitem_type !== 'SALE') {
        throw new Error('Line item is not of type SALE');
      }

      const updated =
        (await ctx.services.salesOrdersService.patchSalesOrderLineItem(
          id,
          sanitizedPatch,
          ctx.user,
        )) as SaleSalesOrderLineItemDoc;
      if (!updated) {
        return null;
      }

      return updated;
    },
  },
);

export const softDeleteSalesOrderLineItem = mutationField(
  'softDeleteSalesOrderLineItem',
  {
    type: 'SalesOrderLineItem',
    args: {
      id: 'String',
    },
    async resolve(_, { id }, ctx) {
      if (!id) {
        throw new Error('id is required');
      }
      const deleted =
        await ctx.services.salesOrdersService.softDeleteSalesOrderLineItem(
          id,
          ctx.user,
        );
      if (!deleted) {
        return null;
      }

      return deleted;
    },
  },
);

export const SalesOrderListResult = objectType({
  name: 'SalesOrderListResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: 'SalesOrder' });
    t.nonNull.int('total');
    t.nonNull.int('limit');
    t.nonNull.int('offset');
    // Add more fields as needed, e.g. details
  },
});

export const listSalesOrders = queryField('listSalesOrders', {
  type: SalesOrderListResult,
  args: {
    workspaceId: nonNull(arg({ type: 'String' })),
    limit: intArg({ default: 20 }),
    offset: intArg({ default: 0 }),
  },
  resolve: async (_root, args, ctx) => {
    const limit = args.limit ?? undefined;
    const offset = args.offset ?? undefined;
    const result = await ctx.services.salesOrdersService.listSalesOrders(
      {
        filter: { workspace_id: args.workspaceId },
        limit,
        offset,
      },
      ctx.user,
    );
    return {
      items: result.data,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  },
});

export const getSalesOrderById = queryField('getSalesOrderById', {
  type: 'SalesOrder',
  args: {
    id: 'String',
  },
  resolve: async (_root, { id }, ctx) => {
    if (!id) return null;
    const [order] =
      await ctx.services.salesOrdersService.batchGetSalesOrdersById(
        [id],
        ctx.user,
      );
    return order;
  },
});

export const getSalesOrderLineItemById = queryField(
  'getSalesOrderLineItemById',
  {
    type: 'SalesOrderLineItem',
    args: {
      id: 'String',
    },
    resolve: async (_root, { id }, ctx) => {
      if (!id) return null;
      const item = await ctx.services.salesOrdersService.getLineItemById(
        id,
        ctx.user,
      );

      return item;
    },
  },
);

export const submitSalesOrder = mutationField('submitSalesOrder', {
  type: 'SalesOrder',
  args: {
    id: nonNull(arg({ type: 'ID' })),
  },
  async resolve(_, args, ctx) {
    const saleOrderItems =
      await ctx.services.salesOrdersService.getLineItemsBySalesOrderId(
        args.id,
        ctx.user,
      );

    for (const item of saleOrderItems) {
      await ctx.services.fulfilmentService.createFulfilmentFromSalesOrderItem(
        {
          salesOrderId: args.id,
          salesOrderLineItemId: item._id,
        },
        ctx.user,
      );
    }

    const submitted = await ctx.services.salesOrdersService.submitSalesOrder(
      args.id,
      ctx.user,
    );
    return submitted;
  },
});

export const softDeleteSalesOrder = mutationField('softDeleteSalesOrder', {
  type: 'SalesOrder',
  args: {
    id: 'String',
  },
  async resolve(_, { id }, ctx) {
    if (!id) {
      throw new Error('id is required');
    }
    const deleted = await ctx.services.salesOrdersService.softDeleteSalesOrder(
      id,
      ctx.user,
    );
    if (!deleted) {
      return null;
    }
    return deleted;
  },
});
