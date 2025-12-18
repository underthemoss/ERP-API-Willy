import { type MongoClient } from 'mongodb';
import {
  SalesOrdersModel,
  createSalesOrdersModel,
  SalesOrderDoc,
} from './sales-order-model';
import { UserAuthPayload } from '../../authentication';
import {
  SalesOrderLineItemDoc,
  SalesOrderLineItemsModel,
  createSalesOrderLineItemsModel,
  RentalSalesOrderLineItemDoc,
  SaleSalesOrderLineItemDoc,
} from './sales-order-line-items-model';
// service dependencies
import { type PriceEngineService } from '../price_engine';
import { Price, PricesService } from '../prices';
import { z } from 'zod';
import { type AuthZ } from '../../lib/authz';
import {
  ERP_SALES_ORDER_SUBJECT_RELATIONS,
  ERP_SALES_ORDER_SUBJECT_PERMISSIONS,
  ERP_WORKSPACE_SUBJECT_PERMISSIONS,
  ERP_INTAKE_FORM_SUBMISSION_SUBJECT_PERMISSIONS,
} from '../../lib/authz/spicedb-generated-types';

// re-export types for external use
export type {
  SalesOrderDoc,
  SalesOrderLineItemDoc,
  RentalSalesOrderLineItemDoc,
  SaleSalesOrderLineItemDoc,
};

export class SalesOrdersService {
  private model: SalesOrdersModel;
  private priceEngineService: PriceEngineService;
  private lineItemModel: SalesOrderLineItemsModel;
  private pricesService: PricesService;
  private authZ: AuthZ;

  constructor(config: {
    model: SalesOrdersModel;
    lineItemModel: SalesOrderLineItemsModel;
    priceEngineService: PriceEngineService;
    pricesService: PricesService;
    authZ: AuthZ;
  }) {
    this.model = config.model;
    this.lineItemModel = config.lineItemModel;
    this.priceEngineService = config.priceEngineService;
    this.pricesService = config.pricesService;
    this.authZ = config.authZ;
  }

  /**
   * Calculates the pricing summary for a sales order.
   * Returns { sub_total_in_cents, total_in_cents }
   */
  async getSalesOrderPricing(
    salesOrderId: string,
    user: UserAuthPayload,
  ): Promise<{
    sub_total_in_cents: number;
    total_in_cents: number;
  } | null> {
    if (!user) return null;
    const items = await this.getLineItemsBySalesOrderId(salesOrderId, user);
    let subTotal = 0;
    for (const item of items) {
      if (item.lineitem_type === 'RENTAL') {
        // Use price engine for rental
        const price = await this.getPriceForLineItem(item._id, user);
        if (
          price?.type === 'fixed_term_rental_price_estimate' &&
          typeof price.totalIncludingDeliveryInCents === 'number'
        ) {
          subTotal += price.totalIncludingDeliveryInCents;
        }
      } else if (item.lineitem_type === 'SALE') {
        const price = await this.getPriceForLineItem(item._id, user);

        if (price?.type === 'sales_item_price_estimate' && price.subtotal) {
          subTotal += price.subtotal;
        }
        // subTotal += price?.type === 'fixed_term_rental_price_estimate';
        // subTotal += price?.type === '' * item.so_quantity;
      }
    }
    return {
      sub_total_in_cents: subTotal,
      total_in_cents: subTotal,
    };
  }

  async batchGetSalesOrdersById(
    orderIds: string[],
    user?: UserAuthPayload,
  ): Promise<(SalesOrderDoc | null)[]> {
    if (!user) {
      return orderIds.map(() => null);
    }
    // Fetch all sales orders with the given orderIds
    const docs = (await this.model.getSalesOrdersByIds(orderIds)).filter(
      (doc) => doc.workspace_id,
    );

    const allowedDocs = (
      await this.authZ.salesOrder.bulkHasPermissions(
        docs.map((doc) => ({
          resourceId: doc._id,
          permission: ERP_SALES_ORDER_SUBJECT_PERMISSIONS.USER_READ,
          subjectId: user.id,
        })),
      )
    )
      .filter((check) => check.hasPermission)
      .map(({ resourceId }) => docs.find((d) => d._id === resourceId));

    // Return in the same order as input, null for missing/unauthorized
    return orderIds.map((id) => allowedDocs.find((d) => d?._id === id) ?? null);
  }

  async batchGetSalesOrderLineItemsById(
    ids: string[],
    user?: UserAuthPayload,
  ): Promise<(SalesOrderLineItemDoc | null)[]> {
    if (!user) {
      return ids.map(() => null);
    }
    // Fetch all sales orders with the given orderIds
    const docs = await this.lineItemModel.getLineItemsByIds(ids);
    const docsByOrderLineItemId: Record<string, SalesOrderLineItemDoc> = {};
    for (const doc of docs) {
      docsByOrderLineItemId[doc._id] = doc;
    }
    // Return in the same order as input, null for missing/unauthorized
    return ids.map((id) => docsByOrderLineItemId[id] ?? null);
  }

  async batchGetSalesOrdersByIntakeFormSubmissionIds(
    submissionIds: readonly string[],
    user?: UserAuthPayload,
  ): Promise<(SalesOrderDoc | null)[]> {
    if (!user) {
      return submissionIds.map(() => null);
    }

    const docs = (
      await this.model.getSalesOrdersByIntakeFormSubmissionIds(
        Array.from(submissionIds),
      )
    ).filter((doc) => doc.workspace_id);

    const portalAccessChecks = await this.authZ.salesOrder.bulkHasPermissions(
      docs.map((doc) => ({
        resourceId: doc._id,
        permission: ERP_SALES_ORDER_SUBJECT_PERMISSIONS.USER_PORTAL_ACCESS,
        subjectId: user.id,
      })),
    );

    // Combine both permission checks - user needs either read OR portal_access
    const allowedResourceIds = new Set<string>();
    for (const check of portalAccessChecks) {
      if (check.hasPermission && check.resourceId) {
        allowedResourceIds.add(check.resourceId);
      }
    }

    const allowedDocs = docs.filter((d) => allowedResourceIds.has(d._id));

    // Return in the same order as input, null for missing/unauthorized
    return submissionIds.map(
      (submissionId) =>
        allowedDocs.find(
          (d) => d?.intake_form_submission_id === submissionId,
        ) ?? null,
    );
  }

  async batchGetSalesOrderLineItemsByIntakeFormSubmissionLineItemIds(
    lineItemIds: readonly string[],
    user?: UserAuthPayload,
  ): Promise<(SalesOrderLineItemDoc | null)[]> {
    if (!user) {
      return lineItemIds.map(() => null);
    }

    // Fetch line items by intake form submission line item IDs
    const lineItems =
      await this.lineItemModel.getSalesOrderLineItemsByIntakeFormSubmissionLineItemIds(
        Array.from(lineItemIds),
      );

    if (!lineItems.length) {
      return lineItemIds.map(() => null);
    }

    // Get unique sales order IDs to check permissions on parent sales orders
    const salesOrderIds = [
      ...new Set(lineItems.map((li) => li.sales_order_id)),
    ];
    const salesOrders = await this.model.getSalesOrdersByIds(salesOrderIds);

    // Check portal_access permission on parent sales orders
    const portalAccessChecks = await this.authZ.salesOrder.bulkHasPermissions(
      salesOrders
        .filter((so) => so.workspace_id)
        .map((so) => ({
          resourceId: so._id,
          permission: ERP_SALES_ORDER_SUBJECT_PERMISSIONS.USER_PORTAL_ACCESS,
          subjectId: user.id,
        })),
    );

    // Build set of allowed sales order IDs
    const allowedSalesOrderIds = new Set<string>();
    for (const check of portalAccessChecks) {
      if (check.hasPermission && check.resourceId) {
        allowedSalesOrderIds.add(check.resourceId);
      }
    }

    // Filter line items to only those whose parent sales order is accessible
    const allowedLineItems = lineItems.filter((li) =>
      allowedSalesOrderIds.has(li.sales_order_id),
    );

    // Return in the same order as input, null for missing/unauthorized
    return lineItemIds.map(
      (lineItemId) =>
        allowedLineItems.find(
          (li) => li.intake_form_submission_line_item_id === lineItemId,
        ) ?? null,
    );
  }

  async createSalesOrder(
    input: {
      workspace_id: string;
      project_id?: string;
      buyer_id: string;
      purchase_order_number?: string;
      sales_order_number: string;
      intake_form_submission_id?: string;
      quote_id?: string;
      quote_revision_id?: string;
    },
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User context is required to create sales order');
    }

    // Check if user has permission to manage sales orders in the workspace
    const canManageSalesOrders = await this.authZ.workspace.hasPermission({
      permission:
        ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_SALES_ORDERS,
      resourceId: input.workspace_id,
      subjectId: user.id,
    });

    if (!canManageSalesOrders) {
      throw new Error(
        'You do not have permission to create sales orders in this workspace',
      );
    }

    if (input.intake_form_submission_id) {
      const canReadSubmission =
        await this.authZ.intakeFormSubmission.hasPermission({
          permission: ERP_INTAKE_FORM_SUBMISSION_SUBJECT_PERMISSIONS.USER_READ,
          resourceId: input.intake_form_submission_id,
          subjectId: user.id,
        });

      if (!canReadSubmission) {
        throw new Error(
          'You do not have permission to access the specified intake form submission',
        );
      }
    }

    const now = new Date();

    const created = await this.model.createSalesOrder({
      workspace_id: input.workspace_id,
      project_id: input.project_id ?? undefined,
      buyer_id: input.buyer_id,
      purchase_order_number: input.purchase_order_number,
      sales_order_number: input.sales_order_number,
      created_at: now,
      created_by: user.id,
      updated_at: now,
      updated_by: user.id,
      status: 'DRAFT',
      intake_form_submission_id: input.intake_form_submission_id,
      quote_id: input.quote_id,
      quote_revision_id: input.quote_revision_id,
    });

    // Create SpiceDB relationship between sales order and workspace
    if (created) {
      try {
        await this.authZ.salesOrder.writeRelation({
          resourceId: created._id,
          subjectId: input.workspace_id,
          relation: ERP_SALES_ORDER_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
        });

        if (input.intake_form_submission_id) {
          await this.authZ.salesOrder.writeRelation({
            resourceId: created._id,
            subjectId: input.intake_form_submission_id,
            relation:
              ERP_SALES_ORDER_SUBJECT_RELATIONS.INTAKE_FORM_SUBMISSION_INTAKE_FORM_SUBMISSION,
          });
        }
      } catch (error) {
        console.error(
          'Failed to create SpiceDB relationship for sales order:',
          error,
        );
        // Don't fail the creation, but log the error
      }
    }

    return created;
  }

  async listSalesOrders(
    options: {
      filter?: { project_id?: string; workspace_id?: string };
      limit?: number;
      offset?: number;
    } = {},
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User context is required to list sales orders');
    }

    const { filter = {}, limit, offset } = options;
    const mergedFilter: Record<string, any> = { ...filter };

    // workspace_id is now required, so it should always be provided
    if (!filter.workspace_id) {
      throw new Error('workspace_id is required to list sales orders');
    }

    // Check permission for the specific workspace
    const canReadSalesOrders = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_READ_SALES_ORDERS,
      resourceId: filter.workspace_id,
      subjectId: user.id,
    });

    if (!canReadSalesOrders) {
      // User doesn't have permission, return empty result
      return { data: [], total: 0, limit: limit || 20, offset: offset || 0 };
    }

    mergedFilter.workspace_id = filter.workspace_id;

    const result = await this.model.getSalesOrders({
      filter: mergedFilter,
      limit,
      offset,
    });
    return result;
  }

  async getLineItemsBySalesOrderId(
    salesOrderId: string,
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User context is required to get sales order line items');
    }
    return this.lineItemModel.getLineItemsBySalesOrderIdAndCompanyId(
      salesOrderId,
    );
  }

  async createSalesOrderLineItem(
    input: Omit<
      SalesOrderLineItemDoc,
      '_id' | 'created_by' | 'created_at' | 'updated_at' | 'updated_by'
    >,
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error(
        'User context is required to create sales order line item',
      );
    }

    // Validate rental line item quantity must be exactly 1
    if (input.lineitem_type === 'RENTAL') {
      const quantity = input.so_quantity ?? 1;
      if (quantity !== 1) {
        throw new Error(
          'Rental line items must have a quantity of exactly 1. Received quantity: ' +
            quantity,
        );
      }
    }

    const now = new Date();
    const lineItem: Omit<SalesOrderLineItemDoc, '_id'> = {
      ...input,
      created_at: now,
      created_by: user.id,
      updated_at: now,
      updated_by: user.id,
    };
    return this.lineItemModel.createLineItem(lineItem);
  }

  async patchSalesOrderLineItem(
    id: string,
    patch: Partial<
      Omit<SalesOrderLineItemDoc, '_id' | 'created_by' | 'created_at'>
    >,
    user?: UserAuthPayload,
  ): Promise<SalesOrderLineItemDoc | null> {
    if (!user) {
      throw new Error(
        'User context is required to patch sales order line item',
      );
    }

    // Fetch existing line item to check if it's rental
    const [existingLineItem] = await this.lineItemModel.getLineItemsByIds([id]);
    if (!existingLineItem) {
      throw new Error('Line item not found');
    }

    // Validate rental line item quantity must be exactly 1
    if (
      existingLineItem.lineitem_type === 'RENTAL' &&
      patch.so_quantity !== undefined
    ) {
      if (patch.so_quantity !== 1) {
        throw new Error(
          'Rental line items must have a quantity of exactly 1. Received quantity: ' +
            patch.so_quantity,
        );
      }
    }

    const now = new Date();
    await this.lineItemModel.patchLineItem(id, {
      ...patch,
      updated_at: now,
      updated_by: user.id,
    });
    const [updated] = await this.lineItemModel.getLineItemsByIds([id]);
    return updated ?? null;
  }

  async patchRentalSalesOrderLineItem(
    id: string,
    patch: Partial<
      Omit<SalesOrderLineItemDoc, '_id' | 'created_by' | 'created_at'>
    >,
    user?: UserAuthPayload,
  ): Promise<SalesOrderLineItemDoc | null> {
    if (!user) {
      throw new Error(
        'User context is required to patch rental sales order line item',
      );
    }
    const [lineItem] = await this.lineItemModel.getLineItemsByIds([id]);
    if (!lineItem) {
      throw new Error('Line item not found');
    }
    if (lineItem.lineitem_type !== 'RENTAL') {
      throw new Error('Line item is not of type RENTAL');
    }
    return this.patchSalesOrderLineItem(id, patch, user);
  }

  async getLineItemById(id: string): Promise<SalesOrderLineItemDoc | null> {
    const [item] = await this.lineItemModel.getLineItemsByIds([id]);
    return item ?? null;
  }

  async softDeleteSalesOrderLineItem(
    id: string,
    user?: UserAuthPayload,
  ): Promise<SalesOrderLineItemDoc | null> {
    if (!user) {
      throw new Error(
        'User context is required to soft delete sales order line item',
      );
    }
    // Fetch the line item (including soft-deleted ones)
    const lineItem = await this.lineItemModel.getLineItemByIdAnyStatus(id);
    if (!lineItem) {
      throw new Error('Line item not found');
    }
    await this.lineItemModel.softDeleteLineItem(id, user.id);
    // Fetch the item again, including soft-deleted ones
    const item = await this.lineItemModel.getLineItemByIdAnyStatus(id);
    return item ?? null;
  }

  private getApplicableRentalRates(
    item: SalesOrderLineItemDoc,
    price: Price | null,
  ) {
    if (item?.lineitem_type !== 'RENTAL') {
      throw new Error('Line item entry is not for rental pricing');
    }

    if (price?.priceType !== 'RENTAL') {
      return null;
    }

    const rates = {
      pricePer1DayInCents: price.pricePerDayInCents,
      pricePer7DaysInCents: price?.pricePerWeekInCents,
      pricePer28DaysInCents: price?.pricePerMonthInCents,
    };

    const ratesSchema = z.object({
      pricePer1DayInCents: z.number(),
      pricePer7DaysInCents: z.number(),
      pricePer28DaysInCents: z.number(),
    });

    const parsed = ratesSchema.safeParse(rates);
    if (!parsed.success) {
      // Instead of throwing, return null so the resolver can handle missing rates gracefully
      return null;
    }
    return parsed.data;
  }

  private async getPriceForFixedTermRentalLineItem(
    item: SalesOrderLineItemDoc,
    price: Price | null,
  ) {
    if (
      !(
        item.lineitem_type === 'RENTAL' &&
        item.delivery_date &&
        item.off_rent_date
      )
    ) {
      return null;
    }

    const rates = this.getApplicableRentalRates(item, price);
    if (!rates) {
      return null;
    }

    const forecast = this.priceEngineService.forecastPricing({
      startDate: new Date(item.delivery_date),
      numberOfDaysToForcast: 365,
      rentalEndDate: item.off_rent_date
        ? new Date(item.off_rent_date)
        : undefined,
      ...rates,
    });
    const rentalPricing = this.priceEngineService.calculateOptimalCost({
      startDate: new Date(item.delivery_date),
      endDate: new Date(item.off_rent_date),
      ...rates,
    });

    return {
      type: 'fixed_term_rental_price_estimate' as const,
      ...rentalPricing,
      deliveryCostInCents: item.delivery_charge_in_cents,
      totalIncludingDeliveryInCents:
        rentalPricing.costInCents + (item.delivery_charge_in_cents ?? 0),
      forecast,
    };
  }

  private async getPriceForUnfixedTermRentalLineItem(
    item: SalesOrderLineItemDoc,
    price: Price | null,
  ) {
    if (!(item.lineitem_type === 'RENTAL')) {
      return null;
    }

    const rates = this.getApplicableRentalRates(item, price);
    if (!rates) {
      return null;
    }
    const forecast = this.priceEngineService.forecastPricing({
      startDate: new Date(),
      numberOfDaysToForcast: 365,
      ...rates,
    });

    return {
      type: 'unfixed_term_rental_price_estimate' as const,
      deliveryCostInCents: item.delivery_charge_in_cents,
      forecast,
    };
  }

  private getPriceForSalesItemLineItem(
    item: SalesOrderLineItemDoc,
    price: Price | null,
  ) {
    if (item.lineitem_type !== 'SALE') {
      return null;
    }

    const priceBookPrice =
      price?.priceType === 'SALE' ? price.unitCostInCents : null;
    const subtotal = priceBookPrice || null;
    return {
      type: 'sales_item_price_estimate' as const,
      subtotal,
    };
  }

  async getPriceForLineItem(
    id: string,
    user: UserAuthPayload,
  ): Promise<
    | ReturnType<typeof this.getPriceForFixedTermRentalLineItem>
    | ReturnType<typeof this.getPriceForUnfixedTermRentalLineItem>
    | ReturnType<typeof this.getPriceForSalesItemLineItem>
    | null
  > {
    const [item] = await this.lineItemModel.getLineItemsByIds([id]);

    const [price] = item.price_id
      ? await this.pricesService.batchGetPricesByIds([item.price_id], user)
      : [];

    if (!price || price instanceof Error) {
      return null;
    }

    return (
      (await this.getPriceForFixedTermRentalLineItem(item, price)) ||
      (await this.getPriceForUnfixedTermRentalLineItem(item, price)) ||
      (await this.getPriceForSalesItemLineItem(item, price)) ||
      null
    );
  }

  async patchSalesOrder(
    id: string,
    patch: Partial<{
      project_id?: string;
      buyer_id: string;
      purchase_order_number?: string;
    }>,
    user?: UserAuthPayload,
  ): Promise<SalesOrderDoc | null> {
    if (!user) {
      throw new Error('User context is required to patch sales order');
    }

    // First, fetch the sales order to verify it exists and user has access
    const [salesOrder] = await this.batchGetSalesOrdersById([id], user);
    if (!salesOrder) {
      throw new Error('Sales order not found or access denied');
    }

    // Check if user has update permission on this specific sales order
    try {
      const canUpdate = await this.authZ.salesOrder.hasPermission({
        permission: ERP_SALES_ORDER_SUBJECT_PERMISSIONS.USER_UPDATE,
        resourceId: id,
        subjectId: user.id,
      });
      if (!canUpdate) {
        throw new Error(
          'You do not have permission to update this sales order',
        );
      }
    } catch (error) {
      console.error(
        `Failed to check update permission for sales order ${id}:`,
        error,
      );
      // Fall back to existing access check (already done above)
    }

    const now = new Date();
    const updated = await this.model.patchSalesOrder(id, {
      ...patch,
      updated_at: now,
      updated_by: user.id,
    });

    return updated;
  }

  async submitSalesOrder(
    id: string,
    user?: UserAuthPayload,
  ): Promise<SalesOrderDoc | null> {
    if (!user) {
      throw new Error('User context is required to update sales order status');
    }

    const salesOrder = await this.model.updateSalesOrderStatus({
      id,
      status: 'SUBMITTED',
      updatedBy: user.id,
    });

    if (!salesOrder) {
      throw new Error('Sales order not found');
    }

    return salesOrder;
  }

  async softDeleteSalesOrder(
    id: string,
    user?: UserAuthPayload,
  ): Promise<SalesOrderDoc | null> {
    if (!user) {
      throw new Error('User context is required to soft delete sales order');
    }
    // Fetch the sales order (including soft-deleted ones)
    const salesOrder = await this.model.getSalesOrderByIdAnyStatus(id);
    if (!salesOrder) {
      throw new Error('Sales order not found');
    }

    await this.authZ.salesOrder.hasPermissionOrThrow({
      permission: ERP_SALES_ORDER_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    await this.model.softDeleteSalesOrder(id, user.id);
    // Fetch the order again, including soft-deleted ones
    const order = await this.model.getSalesOrderByIdAnyStatus(id);
    return order ?? null;
  }
}

export const createSalesOrdersService = async (config: {
  mongoClient: MongoClient;
  priceEngineService: PriceEngineService;
  pricesService: PricesService;
  authZ: AuthZ;
}) => {
  const model = createSalesOrdersModel(config);
  const lineItemModel = createSalesOrderLineItemsModel(config);
  const salesOrdersService = new SalesOrdersService({
    model,
    lineItemModel,
    priceEngineService: config.priceEngineService,
    pricesService: config.pricesService,
    authZ: config.authZ,
  });
  return salesOrdersService;
};
