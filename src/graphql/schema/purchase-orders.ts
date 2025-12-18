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
  type PurchaseOrdersService,
  RentalPurchaseOrderLineItemDoc,
  SalePurchaseOrderLineItemDoc,
} from '../../services/purchase_orders';
import { LINEITEM_STATUS } from '../../services/purchase_orders/purchase-order-line-items-model';

export const POLineItemType = enumType({
  name: 'POLineItemType',
  members: ['RENTAL', 'SALE'],
});

export const PurchaseOrderStatus = enumType({
  name: 'PurchaseOrderStatus',
  members: ['DRAFT', 'SUBMITTED'],
});

export const POLineItemStatus = enumType({
  name: 'POLineItemStatus',
  members: Object.keys(LINEITEM_STATUS),
});

// export const LineItemRentalPeriod = objectType({
//   name: 'LineItemRentalPeriod',
//   definition(t) {
//     t.nonNull.int('days28');
//     t.nonNull.int('days7');
//     t.nonNull.int('days1');
//   },
// });

// export const LineItemPricing = objectType({
//   name: 'LineItemPricing',
//   definition(t) {
//     t.nonNull.int('pricePer28DaysInCents');
//     t.nonNull.int('pricePer7DaysInCents');
//     t.nonNull.int('pricePer1DayInCents');
//   },
// });

// export const LineItemCostOptionDetails = objectType({
//   name: 'LineItemCostOptionDetails',
//   definition(t) {
//     t.nonNull.field('exactSplitDistribution', { type: 'LineItemRentalPeriod' });
//     t.nonNull.field('optimalSplit', { type: 'LineItemRentalPeriod' });
//     t.nonNull.field('rates', { type: 'LineItemPricing' });
//     t.nonNull.string('plainText');
//   },
// });

type LineItemPrice = Awaited<
  ReturnType<PurchaseOrdersService['getPriceForLineItem']>
>;

// export const LineItemPriceForecastDay = objectType({
//   name: 'LineItemPriceForecastDay',
//   definition(t) {
//     t.nonNull.int('day');
//     t.nonNull.int('accumulative_cost_in_cents', {
//       resolve: (parent) =>
//         (parent as ForcastResponseDay).accumulativeCostInCents,
//     });
//     t.nonNull.string('strategy');
//     t.nonNull.int('cost_in_cents', {
//       resolve: (parent) => (parent as ForcastResponseDay).costInCents,
//     });
//     t.nonNull.field('rental_period', {
//       type: 'LineItemRentalPeriod',
//       resolve: (parent) => (parent as ForcastResponseDay).rentalPeriod,
//     });
//     t.nonNull.int('savings_compared_to_exact_split_in_cents', {
//       resolve: (parent) =>
//         (parent as ForcastResponseDay).savingsComparedToExactSplitInCents,
//     });
//     t.nonNull.int('savings_compared_to_day_rate_in_cents', {
//       resolve: (parent) =>
//         (parent as ForcastResponseDay).savingsComparedToDayRateInCents,
//     });
//     t.nonNull.float('savings_compared_to_day_rate_in_fraction', {
//       resolve: (parent) =>
//         (parent as ForcastResponseDay).savingsComparedToDayRateInFraction,
//     });
//     t.nonNull.field('details', {
//       type: 'LineItemCostOptionDetails',
//       resolve: (parent) => (parent as ForcastResponseDay).details,
//     });
//   },
// });

// export const LineItemPriceForecast = objectType({
//   name: 'LineItemPriceForecast',
//   definition(t) {
//     t.nonNull.list.nonNull.field('days', { type: 'LineItemPriceForecastDay' });
//     t.nonNull.int('accumulative_cost_in_cents', {
//       resolve: (parent) => (parent as ForcastResponse).accumulativeCostInCents,
//     });
//   },
// });

export const PurchaseOrderLineItemPriceEstimate = objectType({
  name: 'PurchaseOrderLineItemPriceEstimate',
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
          ReturnType<PurchaseOrdersService['getPriceForLineItem']>
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
 * Maps the result of getPriceForLineItem to the PurchaseOrderLineItemPriceEstimate GraphQL type.
 */
function mapPriceEstimateToGql(
  price: Awaited<ReturnType<PurchaseOrdersService['getPriceForLineItem']>>,
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

// RentalPurchaseOrderLineItem GQL type
export const RentalPurchaseOrderLineItem = objectType({
  name: 'RentalPurchaseOrderLineItem',
  sourceType: {
    export: 'RentalPurchaseOrderLineItemDoc',
    module: require.resolve('../../services/purchase_orders'),
  },
  definition(t) {
    t.nonNull.string('id', { resolve: (parent) => parent._id });
    t.string('po_pim_id'); // cat or prod id
    t.int('po_quantity');
    t.string('company_id');
    t.string('created_at');
    t.string('created_by');
    t.string('updated_at');
    t.string('updated_by');
    t.nonNull.field('lineitem_type', { type: 'POLineItemType' });
    t.string('price_id');
    t.field('lineitem_status', { type: 'POLineItemStatus' });
    t.nonNull.string('purchase_order_id');
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
      type: PurchaseOrderLineItemPriceEstimate,
      description:
        'Full calculated price estimate for the line item (fixed or unfixed term)',
      resolve: async (parent, _, ctx) => {
        if (!parent._id || !ctx.user) return null;
        const price =
          await ctx.services.purchaseOrdersService.getPriceForLineItem(
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
        if (!parent.po_pim_id) return null;
        return ctx.dataloaders.pimProducts.getPimProductsById.load(
          parent.po_pim_id,
        );
      },
    });
    t.field('so_pim_category', {
      type: 'PimCategory',
      resolve: async (parent, _, ctx) => {
        if (!parent.po_pim_id) return null;
        return ctx.dataloaders.pimCategories.getPimCategoriesById.load(
          parent.po_pim_id,
        );
      },
    });
    t.field('purchaseOrder', {
      type: 'PurchaseOrder',
      resolve: async (parent, _, ctx) => {
        return ctx.dataloaders.purchaseOrders.getPurchaseOrdersById.load(
          parent.purchase_order_id,
        );
      },
    });
  },
});

// SalePurchaseOrderLineItem GQL type
export const SalePurchaseOrderLineItem = objectType({
  name: 'SalePurchaseOrderLineItem',
  sourceType: {
    export: 'SalePurchaseOrderLineItemDoc',
    module: require.resolve('../../services/purchase_orders'),
  },
  definition(t) {
    t.nonNull.string('id', { resolve: (parent) => parent._id });
    t.string('po_pim_id');
    t.int('po_quantity');
    t.string('company_id');
    t.string('created_at');
    t.string('created_by');
    t.string('updated_at');
    t.string('updated_by');
    t.nonNull.field('lineitem_type', { type: 'POLineItemType' });
    t.string('price_id');
    t.field('lineitem_status', { type: 'POLineItemStatus' });
    t.nonNull.string('purchase_order_id');
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
        if (!parent.po_pim_id) return null;
        return ctx.dataloaders.pimProducts.getPimProductsById.load(
          parent.po_pim_id,
        );
      },
    });
    t.field('so_pim_category', {
      type: 'PimCategory',
      resolve: async (parent, _, ctx) => {
        if (!parent.po_pim_id) return null;
        return ctx.dataloaders.pimCategories.getPimCategoriesById.load(
          parent.po_pim_id,
        );
      },
    });
    t.field('purchaseOrder', {
      type: 'PurchaseOrder',
      resolve: async (parent, _, ctx) => {
        return ctx.dataloaders.purchaseOrders.getPurchaseOrdersById.load(
          parent.purchase_order_id,
        );
      },
    });
  },
});

export const PurchaseOrderLineItem = unionType({
  name: 'PurchaseOrderLineItem',
  definition(t) {
    t.members(RentalPurchaseOrderLineItem, SalePurchaseOrderLineItem);
  },
  resolveType(item) {
    if (item.lineitem_type === 'RENTAL') return 'RentalPurchaseOrderLineItem';
    if (item.lineitem_type === 'SALE') return 'SalePurchaseOrderLineItem';
    return null;
  },
});

export const PurchaseOrderPricing = objectType({
  name: 'PurchaseOrderPricing',
  definition(t) {
    t.int('sub_total_in_cents', {
      description: 'Sum of all line item totals (pre-tax)',
    });
    t.int('total_in_cents', {
      description: 'Total amount (same as sub_total_in_cents, no tax included)',
    });
  },
});

export const PurchaseOrder = objectType({
  name: 'PurchaseOrder',
  sourceType: {
    export: 'PurchaseOrderDoc',
    module: require.resolve('../../services/purchase_orders'),
  },
  definition(t) {
    t.nonNull.string('id', { resolve: (parent) => parent._id });
    t.nonNull.field('status', {
      type: PurchaseOrderStatus,
      description: 'Status of the purchase order',
    });
    t.string('workspace_id');
    t.string('project_id');
    t.nonNull.string('seller_id');
    t.nonNull.string('purchase_order_number');
    t.string('quote_id');
    t.string('quote_revision_id');
    t.nonNull.string('company_id', {
      deprecation: 'Use workspaceId instead',
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
    t.field('seller', {
      type: 'Contact',
      resolve: async (parent, _, ctx) => {
        if (!parent.seller_id) return null;
        return ctx.dataloaders.contacts.getContactsById.load(parent.seller_id);
      },
    });
    t.list.field('line_items', {
      type: 'PurchaseOrderLineItem',
      async resolve(parent, _args, ctx) {
        const purchaseOrderId = parent._id;
        const items =
          await ctx.services.purchaseOrdersService.getLineItemsByPurchaseOrderId(
            purchaseOrderId,
            ctx.user,
          );

        return items;
      },
    });

    t.field('pricing', {
      type: 'PurchaseOrderPricing',
      description: 'Pricing summary for the sales order',
      async resolve(parent, _args, ctx) {
        const purchaseOrderId = parent._id;
        const user = ctx.user;
        if (!user) return null;
        return ctx.services.purchaseOrdersService.getPurchaseOrderPricing(
          purchaseOrderId,
          user,
        );
      },
    });

    t.field('intakeFormSubmission', {
      type: 'IntakeFormSubmission',
      description:
        'The intake form submission associated with this purchase order',
      async resolve(parent, _args, ctx) {
        const user = ctx.user;
        if (!user) return null;

        // Direct lookup if ID is present
        if (parent.intake_form_submission_id) {
          return ctx.services.intakeFormService.getIntakeFormSubmissionById(
            parent.intake_form_submission_id,
            user,
          );
        }

        // Fallback to indirect lookup by purchase order ID
        const purchaseOrderId = parent._id;
        try {
          return await ctx.services.intakeFormService.getIntakeFormSubmissionByPurchaseOrderId(
            purchaseOrderId,
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

export const PurchaseOrderInput = inputObjectType({
  name: 'PurchaseOrderInput',
  definition(t) {
    t.nonNull.string('workspace_id');
    t.string('project_id');
    t.nonNull.string('seller_id');
    t.string('purchase_order_number');
    // order_id, created_at, updated_at, companyId will be set by backend
  },
});

export const UpdatePurchaseOrderInput = inputObjectType({
  name: 'UpdatePurchaseOrderInput',
  definition(t) {
    t.nonNull.string('id');
    t.string('workspace_id');
    t.string('project_id');
    t.string('seller_id');
    t.string('purchase_order_number');
  },
});

export const CreateRentalPurchaseOrderLineItemInput = inputObjectType({
  name: 'CreateRentalPurchaseOrderLineItemInput',
  definition(t) {
    t.nonNull.string('purchase_order_id');
    t.string('po_pim_id');
    t.int('po_quantity');
    t.string('price_id');
    t.field('lineitem_status', { type: 'POLineItemStatus' });
    t.field('delivery_method', { type: 'DeliveryMethod' });
    t.string('delivery_location');
    t.int('delivery_charge_in_cents');
    t.string('delivery_date');
    t.string('off_rent_date');
    t.string('deliveryNotes');
  },
});

export const CreateSalePurchaseOrderLineItemInput = inputObjectType({
  name: 'CreateSalePurchaseOrderLineItemInput',
  definition(t) {
    t.nonNull.string('purchase_order_id');
    t.string('po_pim_id');
    t.int('po_quantity');
    t.string('price_id');
    t.field('lineitem_status', { type: 'POLineItemStatus' });
    t.string('deliveryNotes');
    t.string('delivery_location');
    t.int('delivery_charge_in_cents');
    t.string('delivery_date');
    t.field('delivery_method', { type: 'DeliveryMethod' });
  },
});
export const UpdatePurchaseOrderLineItemInput = inputObjectType({
  name: 'UpdatePurchaseOrderLineItemInput',
  definition(t) {
    t.nonNull.string('id');
    t.string('po_pim_id');
    t.int('po_quantity');
    t.field('lineitem_type', { type: 'POLineItemType' });
    t.string('price_id');
    // RENTAL fields
    t.field('delivery_method', { type: 'DeliveryMethod' });
    t.string('delivery_location');
    t.int('delivery_charge_in_cents');
    t.string('delivery_date');
    t.string('off_rent_date');
    // Both types
    t.field('lineitem_status', { type: 'POLineItemStatus' });
    t.string('deliveryNotes');
  },
});

export const UpdateRentalPurchaseOrderLineItemInput = inputObjectType({
  name: 'UpdateRentalPurchaseOrderLineItemInput',
  definition(t) {
    t.nonNull.string('id');
    t.string('po_pim_id');
    t.int('po_quantity');
    t.string('price_id');
    t.field('lineitem_status', { type: 'POLineItemStatus' });
    t.field('delivery_method', { type: 'DeliveryMethod' });
    t.string('delivery_location');
    t.int('delivery_charge_in_cents');
    t.string('delivery_date');
    t.string('off_rent_date');
    t.string('deliveryNotes');
  },
});

export const UpdateSalePurchaseOrderLineItemInput = inputObjectType({
  name: 'UpdateSalePurchaseOrderLineItemInput',
  definition(t) {
    t.nonNull.string('id');
    t.string('po_pim_id');
    t.int('po_quantity');
    t.string('price_id');
    t.field('lineitem_status', { type: 'POLineItemStatus' });
    t.string('deliveryNotes');
    t.string('delivery_location');
    t.int('delivery_charge_in_cents');
    t.string('delivery_date');
    t.field('delivery_method', { type: 'DeliveryMethod' });
  },
});

export const createPurchaseOrder = mutationField('createPurchaseOrder', {
  type: 'PurchaseOrder',
  args: {
    input: arg({ type: 'PurchaseOrderInput' }),
  },
  async resolve(_, { input }, ctx) {
    if (!input) {
      throw new Error('Input is required');
    }

    if (!ctx.user) {
      throw new Error('User is not authenticated');
    }

    let purchaseOrderNumber = input.purchase_order_number;

    if (!purchaseOrderNumber) {
      purchaseOrderNumber =
        await ctx.services.referenceNumberService.generateReferenceNumberForEntity(
          {
            entityType: 'PO',
            workspaceId: input.workspace_id,
            projectId: input.project_id || undefined,
            contactId: input.seller_id || undefined,
          },
          ctx.user,
        );
    }

    const created =
      await ctx.services.purchaseOrdersService.createPurchaseOrder(
        {
          workspace_id: input.workspace_id,
          project_id: input.project_id || undefined,
          seller_id: input.seller_id,
          purchase_order_number: purchaseOrderNumber,
        },
        ctx.user,
      );
    if (!created) {
      return null;
    }

    return created;
  },
});

export const updatePurchaseOrder = mutationField('updatePurchaseOrder', {
  type: 'PurchaseOrder',
  args: {
    input: arg({ type: 'UpdatePurchaseOrderInput' }),
  },
  async resolve(_, { input }, ctx) {
    if (!input) {
      throw new Error('Input is required');
    }
    const { id, ...patch } = input;
    const sanitizedPatch = Object.fromEntries(
      Object.entries(patch).filter(([_, v]) => v !== undefined),
    );
    const updated = await ctx.services.purchaseOrdersService.patchPurchaseOrder(
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

export const createRentalPurchaseOrderLineItem = mutationField(
  'createRentalPurchaseOrderLineItem',
  {
    type: 'RentalPurchaseOrderLineItem',
    args: {
      input: arg({ type: 'CreateRentalPurchaseOrderLineItemInput' }),
    },
    async resolve(_, { input }, ctx) {
      if (!input) {
        throw new Error('Input is required');
      }
      const sanitizedInput = Object.fromEntries(
        Object.entries(input).map(([k, v]) => [k, v === null ? undefined : v]),
      );
      const created =
        (await ctx.services.purchaseOrdersService.createPurchaseOrderLineItem(
          { ...(sanitizedInput as any), lineitem_type: 'RENTAL' },
          ctx.user,
        )) as RentalPurchaseOrderLineItemDoc;

      if (!created) {
        return null;
      }

      return created;
    },
  },
);

export const createSalePurchaseOrderLineItem = mutationField(
  'createSalePurchaseOrderLineItem',
  {
    type: 'SalePurchaseOrderLineItem',
    args: {
      input: arg({ type: 'CreateSalePurchaseOrderLineItemInput' }),
    },
    async resolve(_, { input }, ctx) {
      if (!input) {
        throw new Error('Input is required');
      }
      const sanitizedInput = Object.fromEntries(
        Object.entries(input).map(([k, v]) => [k, v === null ? undefined : v]),
      );
      const created =
        (await ctx.services.purchaseOrdersService.createPurchaseOrderLineItem(
          { ...(sanitizedInput as any), lineitem_type: 'SALE' },
          ctx.user,
        )) as SalePurchaseOrderLineItemDoc;

      if (!created) {
        return null;
      }

      return created;
    },
  },
);

export const updatePurchaseOrderLineItem = mutationField(
  'updatePurchaseOrderLineItem',
  {
    type: 'PurchaseOrderLineItem',
    deprecation: 'use updateSalePurchaseOrderLineItem',
    args: {
      input: arg({ type: 'UpdatePurchaseOrderLineItemInput' }),
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
        await ctx.services.purchaseOrdersService.patchPurchaseOrderLineItem(
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

export const updateRentalPurchaseOrderLineItem = mutationField(
  'updateRentalPurchaseOrderLineItem',
  {
    type: 'RentalPurchaseOrderLineItem',
    args: {
      input: arg({ type: 'UpdateRentalPurchaseOrderLineItemInput' }),
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
        (await ctx.services.purchaseOrdersService.patchRentalPurchaseOrderLineItem(
          id,
          sanitizedPatch,
          ctx.user,
        )) as RentalPurchaseOrderLineItemDoc;
      if (!updated) {
        return null;
      }

      return updated;
    },
  },
);

export const updateSalePurchaseOrderLineItem = mutationField(
  'updateSalePurchaseOrderLineItem',
  {
    type: 'SalePurchaseOrderLineItem',
    args: {
      input: arg({ type: 'UpdateSalePurchaseOrderLineItemInput' }),
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
      const lineItem =
        await ctx.services.purchaseOrdersService.getLineItemById(id);
      if (!lineItem) {
        throw new Error('Line item not found');
      }
      if (lineItem.lineitem_type !== 'SALE') {
        throw new Error('Line item is not of type SALE');
      }

      const updated =
        (await ctx.services.purchaseOrdersService.patchPurchaseOrderLineItem(
          id,
          sanitizedPatch,
          ctx.user,
        )) as SalePurchaseOrderLineItemDoc;
      if (!updated) {
        return null;
      }

      return updated;
    },
  },
);

export const softDeletePurchaseOrderLineItem = mutationField(
  'softDeletePurchaseOrderLineItem',
  {
    type: 'PurchaseOrderLineItem',
    args: {
      id: 'String',
    },
    async resolve(_, { id }, ctx) {
      if (!id) {
        throw new Error('id is required');
      }
      const deleted =
        await ctx.services.purchaseOrdersService.softDeletePurchaseOrderLineItem(
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

export const PurchaseOrderListResult = objectType({
  name: 'PurchaseOrderListResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: 'PurchaseOrder' });
    t.nonNull.int('total');
    t.nonNull.int('limit');
    t.nonNull.int('offset');
    // Add more fields as needed, e.g. details
  },
});

export const listPurchaseOrders = queryField('listPurchaseOrders', {
  type: PurchaseOrderListResult,
  args: {
    workspaceId: nonNull(arg({ type: 'String' })),
    limit: intArg({ default: 20 }),
    offset: intArg({ default: 0 }),
  },
  resolve: async (_root, args, ctx) => {
    const limit = args.limit ?? undefined;
    const offset = args.offset ?? undefined;
    const result = await ctx.services.purchaseOrdersService.listPurchaseOrders(
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

export const getPurchaseOrderById = queryField('getPurchaseOrderById', {
  type: 'PurchaseOrder',
  args: {
    id: 'String',
  },
  resolve: async (_root, { id }, ctx) => {
    if (!id) return null;
    const [order] =
      await ctx.services.purchaseOrdersService.batchGetPurchaseOrdersById(
        [id],
        ctx.user,
      );
    return order;
  },
});

export const getPurchaseOrderLineItemById = queryField(
  'getPurchaseOrderLineItemById',
  {
    type: 'PurchaseOrderLineItem',
    args: {
      id: 'String',
    },
    resolve: async (_root, { id }, ctx) => {
      if (!id) return null;
      const item = await ctx.services.purchaseOrdersService.getLineItemById(id);

      return item;
    },
  },
);

export const submitPurchaseOrder = mutationField('submitPurchaseOrder', {
  type: 'PurchaseOrder',
  args: {
    id: nonNull(arg({ type: 'ID' })),
  },
  async resolve(_, args, ctx) {
    if (!ctx.user) {
      throw new Error('User is not authenticated');
    }

    const order = await ctx.services.purchaseOrdersService.submitPurchaseOrder(
      args.id,
      ctx.user,
    );

    if (!order) {
      throw new Error('Failed to submit purchase order');
    }

    return order;
  },
});

export const softDeletePurchaseOrder = mutationField(
  'softDeletePurchaseOrder',
  {
    type: 'PurchaseOrder',
    args: {
      id: 'String',
    },
    async resolve(_, { id }, ctx) {
      if (!id) {
        throw new Error('id is required');
      }
      const deleted =
        await ctx.services.purchaseOrdersService.softDeletePurchaseOrder(
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
