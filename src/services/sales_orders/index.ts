import { type MongoClient } from 'mongodb';
import {
  SalesOrdersModel,
  createSalesOrdersModel,
  SalesOrderDoc,
} from './sales-order-model';
import { UserAuthPayload } from '../../authentication';
import {
  SalesOrderLineItemDoc,
  RentalSalesOrderLineItemDoc,
  SaleSalesOrderLineItemDoc,
} from './sales-order-line-items-model';
import { LineItem, LineItemsService, CreateLineItemInput } from '../line_items';
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

const hasOwnProperty = <T extends object>(obj: T, key: string) =>
  Object.prototype.hasOwnProperty.call(obj, key);

const parseDateValue = (value?: string | Date | null) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatQuantityString = (value?: number | null) => {
  if (value === undefined || value === null) return '1';
  return Number.isFinite(value) ? value.toString() : '1';
};

const parseQuantityNumber = (value?: string | number | null) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const isSalesLineItemType = (value: string): value is 'RENTAL' | 'SALE' =>
  value === 'RENTAL' || value === 'SALE';

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
  private lineItemsService: LineItemsService;
  private pricesService: PricesService;
  private authZ: AuthZ;

  constructor(config: {
    model: SalesOrdersModel;
    lineItemsService: LineItemsService;
    priceEngineService: PriceEngineService;
    pricesService: PricesService;
    authZ: AuthZ;
  }) {
    this.model = config.model;
    this.lineItemsService = config.lineItemsService;
    this.priceEngineService = config.priceEngineService;
    this.pricesService = config.pricesService;
    this.authZ = config.authZ;
  }

  private mapLineItemToSalesOrderLineItemDoc(
    item: LineItem,
  ): SalesOrderLineItemDoc | null {
    if (item.documentRef.type !== 'SALES_ORDER') return null;
    if (!isSalesLineItemType(item.type)) return null;

    const baseFields = {
      _id: item.id,
      sales_order_id: item.documentRef.id,
      intake_form_submission_line_item_id:
        item.intakeFormSubmissionLineItemId ?? undefined,
      quote_revision_line_item_id: item.quoteRevisionLineItemId ?? undefined,
      so_pim_id: item.productRef?.productId ?? undefined,
      so_quantity: parseQuantityNumber(item.quantity),
      created_at: item.createdAt,
      created_by: item.createdBy,
      updated_at: item.updatedAt,
      updated_by: item.updatedBy,
      lineitem_type: item.type,
      price_id: item.pricingRef?.priceId ?? undefined,
      lineitem_status: item.status ?? undefined,
      deleted_at: item.deletedAt ?? undefined,
      deliveryNotes: item.delivery?.notes ?? undefined,
      delivery_location: item.delivery?.location ?? undefined,
      delivery_charge_in_cents: item.deliveryChargeInCents ?? undefined,
      delivery_date: item.timeWindow?.startAt ?? undefined,
      delivery_method: item.delivery?.method ?? undefined,
    };

    if (item.type === 'RENTAL') {
      return {
        ...baseFields,
        off_rent_date: item.timeWindow?.endAt ?? undefined,
      } as RentalSalesOrderLineItemDoc;
    }

    return baseFields as SaleSalesOrderLineItemDoc;
  }

  private buildLegacyLineItemDescription(input: {
    lineitem_type: 'RENTAL' | 'SALE';
    so_pim_id?: string;
  }) {
    if (input.so_pim_id) {
      return `PIM ${input.so_pim_id}`;
    }
    return `${input.lineitem_type} line item`;
  }

  private mapLegacySalesOrderLineItemInputToLineItemInput(
    input: Omit<
      SalesOrderLineItemDoc,
      '_id' | 'created_by' | 'created_at' | 'updated_at' | 'updated_by'
    >,
    workspaceId: string,
  ): CreateLineItemInput {
    const startAt = parseDateValue(input.delivery_date);
    const endAt =
      input.lineitem_type === 'RENTAL'
        ? parseDateValue((input as RentalSalesOrderLineItemDoc).off_rent_date)
        : null;

    const delivery =
      input.delivery_method || input.delivery_location || input.deliveryNotes
        ? {
            method: input.delivery_method ?? null,
            location: input.delivery_location ?? null,
            notes: input.deliveryNotes ?? null,
          }
        : null;

    return {
      workspaceId,
      documentRef: { type: 'SALES_ORDER', id: input.sales_order_id },
      type: input.lineitem_type,
      description: this.buildLegacyLineItemDescription({
        lineitem_type: input.lineitem_type,
        so_pim_id: input.so_pim_id,
      }),
      quantity: formatQuantityString(input.so_quantity),
      unitCode: null,
      productRef: input.so_pim_id
        ? { kind: 'PIM_PRODUCT', productId: input.so_pim_id }
        : null,
      timeWindow: startAt || endAt ? { startAt, endAt } : null,
      placeRef: null,
      constraints: null,
      pricingRef: input.price_id ? { priceId: input.price_id } : null,
      subtotalInCents: null,
      delivery,
      deliveryChargeInCents: input.delivery_charge_in_cents ?? null,
      notes: null,
      targetSelectors: null,
      intakeFormSubmissionLineItemId:
        input.intake_form_submission_line_item_id ?? null,
      quoteRevisionLineItemId: input.quote_revision_line_item_id ?? null,
      status: input.lineitem_status ?? null,
    };
  }

  private mapLegacySalesOrderLineItemPatchToLineItemUpdates(
    patch: Partial<
      Omit<SalesOrderLineItemDoc, '_id' | 'created_by' | 'created_at'>
    >,
    existing: LineItem,
  ) {
    const updates: Partial<
      Omit<LineItem, 'id' | 'workspaceId' | 'documentRef'>
    > = {};

    if (hasOwnProperty(patch, 'lineitem_type')) {
      if (!patch.lineitem_type) {
        throw new Error('lineitem_type cannot be cleared');
      }
      if (!isSalesLineItemType(patch.lineitem_type)) {
        throw new Error('Unsupported sales order line item type');
      }
      updates.type = patch.lineitem_type;
    }

    if (hasOwnProperty(patch, 'so_quantity') && patch.so_quantity !== null) {
      updates.quantity = formatQuantityString(patch.so_quantity);
    }

    if (hasOwnProperty(patch, 'so_pim_id')) {
      updates.productRef = patch.so_pim_id
        ? { kind: 'PIM_PRODUCT', productId: patch.so_pim_id }
        : null;
    }

    if (hasOwnProperty(patch, 'price_id')) {
      updates.pricingRef = patch.price_id ? { priceId: patch.price_id } : null;
    }

    if (hasOwnProperty(patch, 'lineitem_status')) {
      updates.status = patch.lineitem_status ?? null;
    }

    if (hasOwnProperty(patch, 'delivery_charge_in_cents')) {
      updates.deliveryChargeInCents = patch.delivery_charge_in_cents ?? null;
    }

    if (
      hasOwnProperty(patch, 'delivery_date') ||
      hasOwnProperty(patch, 'off_rent_date')
    ) {
      const rentalPatch = patch as Partial<RentalSalesOrderLineItemDoc>;
      const nextTimeWindow = {
        ...(existing.timeWindow ?? {}),
      };
      if (hasOwnProperty(patch, 'delivery_date')) {
        nextTimeWindow.startAt = parseDateValue(patch.delivery_date);
      }
      if (hasOwnProperty(patch, 'off_rent_date')) {
        if (existing.type !== 'RENTAL') {
          throw new Error('off_rent_date is only valid for rental line items');
        }
        nextTimeWindow.endAt = parseDateValue(rentalPatch.off_rent_date);
      }
      updates.timeWindow =
        nextTimeWindow.startAt || nextTimeWindow.endAt ? nextTimeWindow : null;
    }

    if (
      hasOwnProperty(patch, 'delivery_method') ||
      hasOwnProperty(patch, 'delivery_location') ||
      hasOwnProperty(patch, 'deliveryNotes')
    ) {
      const nextDelivery = {
        ...(existing.delivery ?? {}),
      };
      if (hasOwnProperty(patch, 'delivery_method')) {
        nextDelivery.method = patch.delivery_method ?? null;
      }
      if (hasOwnProperty(patch, 'delivery_location')) {
        nextDelivery.location = patch.delivery_location ?? null;
      }
      if (hasOwnProperty(patch, 'deliveryNotes')) {
        nextDelivery.notes = patch.deliveryNotes ?? null;
      }
      updates.delivery =
        nextDelivery.method || nextDelivery.location || nextDelivery.notes
          ? nextDelivery
          : null;
    }

    return updates;
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
    const items = await this.lineItemsService.batchGetLineItemsByIds(ids, user);
    return items.map((item) =>
      item ? this.mapLineItemToSalesOrderLineItemDoc(item) : null,
    );
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

    const lineItems =
      await this.lineItemsService.listLineItemsByIntakeFormSubmissionLineItemIds(
        Array.from(lineItemIds),
        user,
      );
    const salesOrderLineItems = lineItems.filter(
      (item) => item.documentRef.type === 'SALES_ORDER',
    );

    if (!salesOrderLineItems.length) {
      return lineItemIds.map(() => null);
    }

    // Get unique sales order IDs to check permissions on parent sales orders
    const salesOrderIds = [
      ...new Set(salesOrderLineItems.map((li) => li.documentRef.id)),
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
    const allowedLineItems = salesOrderLineItems
      .filter((li) => allowedSalesOrderIds.has(li.documentRef.id))
      .map((li) => this.mapLineItemToSalesOrderLineItemDoc(li))
      .filter((li): li is SalesOrderLineItemDoc => Boolean(li));

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
    const [salesOrder] = await this.batchGetSalesOrdersById(
      [salesOrderId],
      user,
    );
    if (!salesOrder) {
      throw new Error('Sales order not found or access denied');
    }
    const items = await this.lineItemsService.listLineItemsByDocumentRef(
      salesOrder.workspace_id,
      { type: 'SALES_ORDER', id: salesOrderId },
      user,
    );
    return items
      .map((item) => this.mapLineItemToSalesOrderLineItemDoc(item))
      .filter((item): item is SalesOrderLineItemDoc => Boolean(item))
      .filter((item) => item.lineitem_status !== 'DRAFT');
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

    if (!isSalesLineItemType(input.lineitem_type)) {
      throw new Error('Unsupported sales order line item type');
    }

    const salesOrder = await this.model.getSalesOrderByIdAnyStatus(
      input.sales_order_id,
    );
    if (!salesOrder) {
      throw new Error('Sales order not found');
    }

    const lineItem = await this.lineItemsService.createLineItem(
      this.mapLegacySalesOrderLineItemInputToLineItemInput(
        input,
        salesOrder.workspace_id,
      ),
      user,
    );

    const mapped = this.mapLineItemToSalesOrderLineItemDoc(lineItem);
    if (!mapped) {
      throw new Error('Failed to map created line item');
    }
    return mapped;
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

    const existing = await this.lineItemsService.getLineItemById(id, user);
    if (!existing || existing.documentRef.type !== 'SALES_ORDER') {
      throw new Error('Line item not found');
    }

    // Validate rental line item quantity must be exactly 1
    if (
      existing.type === 'RENTAL' &&
      patch.so_quantity !== undefined &&
      patch.so_quantity !== null
    ) {
      if (patch.so_quantity !== 1) {
        throw new Error(
          'Rental line items must have a quantity of exactly 1. Received quantity: ' +
            patch.so_quantity,
        );
      }
    }

    const updates = this.mapLegacySalesOrderLineItemPatchToLineItemUpdates(
      patch,
      existing,
    );
    const updated = await this.lineItemsService.updateLineItem(
      id,
      updates,
      user,
    );
    if (!updated) return null;
    return this.mapLineItemToSalesOrderLineItemDoc(updated);
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
    const lineItem = await this.lineItemsService.getLineItemById(id, user);
    if (!lineItem || lineItem.documentRef.type !== 'SALES_ORDER') {
      throw new Error('Line item not found');
    }
    if (lineItem.type !== 'RENTAL') {
      throw new Error('Line item is not of type RENTAL');
    }
    return this.patchSalesOrderLineItem(id, patch, user);
  }

  async getLineItemById(
    id: string,
    user?: UserAuthPayload,
  ): Promise<SalesOrderLineItemDoc | null> {
    if (!user) {
      throw new Error('User context is required to get sales order line item');
    }
    const item = await this.lineItemsService.getLineItemById(id, user);
    if (!item || item.documentRef.type !== 'SALES_ORDER') {
      return null;
    }
    return this.mapLineItemToSalesOrderLineItemDoc(item);
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
    const existing = await this.lineItemsService.getLineItemById(id, user);
    if (!existing || existing.documentRef.type !== 'SALES_ORDER') {
      throw new Error('Line item not found');
    }
    const deleted = await this.lineItemsService.softDeleteLineItem(id, user);
    return deleted ? this.mapLineItemToSalesOrderLineItemDoc(deleted) : null;
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
    const lineItem = await this.lineItemsService.getLineItemById(id, user);
    if (!lineItem) return null;
    const item = this.mapLineItemToSalesOrderLineItemDoc(lineItem);
    if (!item) return null;

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
  lineItemsService: LineItemsService;
  authZ: AuthZ;
}) => {
  const model = createSalesOrdersModel(config);
  const salesOrdersService = new SalesOrdersService({
    model,
    priceEngineService: config.priceEngineService,
    pricesService: config.pricesService,
    lineItemsService: config.lineItemsService,
    authZ: config.authZ,
  });
  return salesOrdersService;
};
