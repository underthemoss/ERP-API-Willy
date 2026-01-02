import { type MongoClient } from 'mongodb';
import {
  PurchaseOrdersModel,
  createPurchaseOrdersModel,
  PurchaseOrderDoc,
} from './purchase-order-model';
import { UserAuthPayload } from '../../authentication';
import {
  PurchaseOrderLineItemDoc,
  RentalPurchaseOrderLineItemDoc,
  SalePurchaseOrderLineItemDoc,
} from './purchase-order-line-items-model';
import { LineItem, LineItemsService, CreateLineItemInput } from '../line_items';
// service dependencies
import { type PriceEngineService } from '../price_engine';
import { Price, PricesService } from '../prices';
import { z } from 'zod';
import { InventoryService } from '../inventory';
import { PimProductsService } from '../pim_products';
import { PimCategoriesService } from '../pim_categories';
import { FulfilmentService } from '../fulfilment';
import { logger } from '../../lib/logger';
import { AuthZ } from '../../lib/authz';
import {
  ERP_PURCHASE_ORDER_SUBJECT_RELATIONS,
  ERP_PURCHASE_ORDER_SUBJECT_PERMISSIONS,
  ERP_WORKSPACE_SUBJECT_PERMISSIONS,
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

const isPurchaseLineItemType = (value: string): value is 'RENTAL' | 'SALE' =>
  value === 'RENTAL' || value === 'SALE';

// re-export types for external use
export type {
  PurchaseOrderDoc,
  PurchaseOrderLineItemDoc,
  RentalPurchaseOrderLineItemDoc,
  SalePurchaseOrderLineItemDoc,
};

export class PurchaseOrdersService {
  private model: PurchaseOrdersModel;
  private priceEngineService: PriceEngineService;
  private lineItemsService: LineItemsService;
  private pricesService: PricesService;
  private inventoryService: InventoryService;
  private pimProductsService: PimProductsService;
  private pimCategoriesService: PimCategoriesService;
  private fulfilmentService: FulfilmentService;
  private mongoClient: MongoClient;
  private authZ: AuthZ;

  constructor(config: {
    model: PurchaseOrdersModel;
    lineItemsService: LineItemsService;
    priceEngineService: PriceEngineService;
    pricesService: PricesService;
    inventoryService: InventoryService;
    pimProductsService: PimProductsService;
    pimCategoriesService: PimCategoriesService;
    fulfilmentService: FulfilmentService;
    mongoClient: MongoClient;
    authZ: AuthZ;
  }) {
    this.model = config.model;
    this.lineItemsService = config.lineItemsService;
    this.priceEngineService = config.priceEngineService;
    this.pricesService = config.pricesService;
    this.inventoryService = config.inventoryService;
    this.pimProductsService = config.pimProductsService;
    this.pimCategoriesService = config.pimCategoriesService;
    this.fulfilmentService = config.fulfilmentService;
    this.mongoClient = config.mongoClient;
    this.authZ = config.authZ;
  }

  private mapLineItemToPurchaseOrderLineItemDoc(
    item: LineItem,
  ): PurchaseOrderLineItemDoc | null {
    if (item.documentRef.type !== 'PURCHASE_ORDER') return null;
    if (!isPurchaseLineItemType(item.type)) return null;

    const baseFields = {
      _id: item.id,
      purchase_order_id: item.documentRef.id,
      intake_form_submission_line_item_id:
        item.intakeFormSubmissionLineItemId ?? undefined,
      quote_revision_line_item_id: item.quoteRevisionLineItemId ?? undefined,
      po_pim_id: item.productRef?.productId ?? undefined,
      po_quantity: parseQuantityNumber(item.quantity),
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
      } as RentalPurchaseOrderLineItemDoc;
    }

    return baseFields as SalePurchaseOrderLineItemDoc;
  }

  private buildLegacyLineItemDescription(input: {
    lineitem_type: 'RENTAL' | 'SALE';
    po_pim_id?: string;
  }) {
    if (input.po_pim_id) {
      return `PIM ${input.po_pim_id}`;
    }
    return `${input.lineitem_type} line item`;
  }

  private mapLegacyPurchaseOrderLineItemInputToLineItemInput(
    input: Omit<
      PurchaseOrderLineItemDoc,
      '_id' | 'created_by' | 'created_at' | 'updated_at' | 'updated_by'
    >,
    workspaceId: string,
  ): CreateLineItemInput {
    const startAt = parseDateValue(input.delivery_date);
    const endAt =
      input.lineitem_type === 'RENTAL'
        ? parseDateValue(
            (input as RentalPurchaseOrderLineItemDoc).off_rent_date,
          )
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
      documentRef: { type: 'PURCHASE_ORDER', id: input.purchase_order_id },
      type: input.lineitem_type,
      description: this.buildLegacyLineItemDescription({
        lineitem_type: input.lineitem_type,
        po_pim_id: input.po_pim_id,
      }),
      quantity: formatQuantityString(input.po_quantity),
      unitCode: null,
      productRef: input.po_pim_id
        ? { kind: 'PIM_PRODUCT', productId: input.po_pim_id }
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

  private mapLegacyPurchaseOrderLineItemPatchToLineItemUpdates(
    patch: Partial<
      Omit<PurchaseOrderLineItemDoc, '_id' | 'created_by' | 'created_at'>
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
      if (!isPurchaseLineItemType(patch.lineitem_type)) {
        throw new Error('Unsupported purchase order line item type');
      }
      updates.type = patch.lineitem_type;
    }

    if (hasOwnProperty(patch, 'po_quantity') && patch.po_quantity !== null) {
      updates.quantity = formatQuantityString(patch.po_quantity);
    }

    if (hasOwnProperty(patch, 'po_pim_id')) {
      updates.productRef = patch.po_pim_id
        ? { kind: 'PIM_PRODUCT', productId: patch.po_pim_id }
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
      const rentalPatch = patch as Partial<RentalPurchaseOrderLineItemDoc>;
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
  async getPurchaseOrderPricing(
    purchaseOrderId: string,
    user: UserAuthPayload,
  ): Promise<{
    sub_total_in_cents: number;
    total_in_cents: number;
  } | null> {
    if (!user) return null;
    const items = await this.getLineItemsByPurchaseOrderId(
      purchaseOrderId,
      user,
    );
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

  async batchGetPurchaseOrdersById(
    orderIds: string[],
    user?: UserAuthPayload,
  ): Promise<(PurchaseOrderDoc | null)[]> {
    if (!user) {
      return orderIds.map(() => null);
    }
    // Fetch all purchase orders with the given orderIds
    const docs = (await this.model.getPurchaseOrdersByIds(orderIds)).filter(
      (doc) => doc.workspace_id,
    );

    const allowedDocs = (
      await this.authZ.purchaseOrder.bulkHasPermissions(
        docs.map((doc) => ({
          resourceId: doc._id,
          permission: ERP_PURCHASE_ORDER_SUBJECT_PERMISSIONS.USER_READ,
          subjectId: user.id,
        })),
      )
    )
      .filter((check) => check.hasPermission)
      .map(({ resourceId }) => docs.find((d) => d._id === resourceId));

    // Return in the same order as input, null for missing/unauthorized
    return orderIds.map((id) => allowedDocs.find((d) => d?._id === id) ?? null);
  }

  async batchGetPurchaseOrderLineItemsById(
    ids: string[],
    user?: UserAuthPayload,
  ): Promise<(PurchaseOrderLineItemDoc | null)[]> {
    if (!user) {
      return ids.map(() => null);
    }
    const items = await this.lineItemsService.batchGetLineItemsByIds(ids, user);
    return items.map((item) =>
      item ? this.mapLineItemToPurchaseOrderLineItemDoc(item) : null,
    );
  }

  async createPurchaseOrder(
    input: {
      workspace_id: string;
      project_id?: string;
      seller_id: string;
      purchase_order_number: string;
      quote_id?: string;
      quote_revision_id?: string;
      intake_form_submission_id?: string;
      line_items?: any[];
    },
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User context is required to create purchase order');
    }

    // Check if user has permission to manage purchase orders in the workspace
    const canManagePurchaseOrders = await this.authZ.workspace.hasPermission({
      permission:
        ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_PURCHASE_ORDERS,
      resourceId: input.workspace_id,
      subjectId: user.id,
    });

    if (!canManagePurchaseOrders) {
      throw new Error(
        'You do not have permission to create purchase orders in this workspace',
      );
    }

    const now = new Date();

    const created = await this.model.createPurchaseOrder({
      workspace_id: input.workspace_id,
      project_id: input.project_id ?? undefined,
      seller_id: input.seller_id,
      purchase_order_number: input.purchase_order_number,
      created_at: now,
      created_by: user.id,
      updated_at: now,
      updated_by: user.id,
      status: 'DRAFT',
      quote_id: input.quote_id,
      quote_revision_id: input.quote_revision_id,
      intake_form_submission_id: input.intake_form_submission_id,
    });

    // Create SpiceDB relationship between purchase order and workspace
    if (created) {
      try {
        await this.authZ.purchaseOrder.writeRelation({
          resourceId: created._id,
          subjectId: input.workspace_id,
          relation: ERP_PURCHASE_ORDER_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
        });
      } catch (error) {
        console.error(
          'Failed to create SpiceDB relationship for purchase order:',
          error,
        );
        // Don't fail the creation, but log the error
      }
    }

    return created;
  }

  async listPurchaseOrders(
    options: {
      filter?: { project_id?: string; workspace_id?: string };
      limit?: number;
      offset?: number;
    } = {},
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User context is required to list purchase orders');
    }

    const { filter = {}, limit, offset } = options;
    const mergedFilter: Record<string, any> = { ...filter };

    // workspace_id is now required, so it should always be provided
    if (!filter.workspace_id) {
      throw new Error('workspace_id is required to list purchase orders');
    }

    // Check permission for the specific workspace
    const canReadPurchaseOrders = await this.authZ.workspace.hasPermission({
      permission:
        ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_READ_PURCHASE_ORDERS,
      resourceId: filter.workspace_id,
      subjectId: user.id,
    });

    if (!canReadPurchaseOrders) {
      // User doesn't have permission, return empty result
      return { data: [], total: 0, limit: limit || 20, offset: offset || 0 };
    }

    mergedFilter.workspace_id = filter.workspace_id;

    const result = await this.model.getPurchaseOrders({
      filter: mergedFilter,
      limit,
      offset,
    });
    return result;
  }

  async getLineItemsByPurchaseOrderId(
    purchaseOrderId: string,
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error(
        'User context is required to get purchase order line items',
      );
    }
    const [purchaseOrder] = await this.batchGetPurchaseOrdersById(
      [purchaseOrderId],
      user,
    );
    if (!purchaseOrder) {
      throw new Error('Purchase order not found or access denied');
    }
    const items = await this.lineItemsService.listLineItemsByDocumentRef(
      purchaseOrder.workspace_id,
      { type: 'PURCHASE_ORDER', id: purchaseOrderId },
      user,
    );
    return items
      .map((item) => this.mapLineItemToPurchaseOrderLineItemDoc(item))
      .filter((item): item is PurchaseOrderLineItemDoc => Boolean(item))
      .filter((item) => item.lineitem_status !== 'DRAFT');
  }

  async createPurchaseOrderLineItem(
    input: Omit<
      PurchaseOrderLineItemDoc,
      '_id' | 'created_by' | 'created_at' | 'updated_at' | 'updated_by'
    >,
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error(
        'User context is required to create purchase order line item',
      );
    }

    // Validate rental line item quantity must be exactly 1
    if (input.lineitem_type === 'RENTAL') {
      const quantity = input.po_quantity ?? 1;
      if (quantity !== 1) {
        throw new Error(
          'Rental line items must have a quantity of exactly 1. Received quantity: ' +
            quantity,
        );
      }
    }

    if (!isPurchaseLineItemType(input.lineitem_type)) {
      throw new Error('Unsupported purchase order line item type');
    }

    const purchaseOrder = await this.model.getPurchaseOrderByIdAnyStatus(
      input.purchase_order_id,
    );
    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    const lineItem = await this.lineItemsService.createLineItem(
      this.mapLegacyPurchaseOrderLineItemInputToLineItemInput(
        input,
        purchaseOrder.workspace_id,
      ),
      user,
    );

    const mapped = this.mapLineItemToPurchaseOrderLineItemDoc(lineItem);
    if (!mapped) {
      throw new Error('Failed to map created line item');
    }
    return mapped;
  }

  async patchPurchaseOrderLineItem(
    id: string,
    patch: Partial<
      Omit<PurchaseOrderLineItemDoc, '_id' | 'created_by' | 'created_at'>
    >,
    user?: UserAuthPayload,
  ): Promise<PurchaseOrderLineItemDoc | null> {
    if (!user) {
      throw new Error(
        'User context is required to patch purchase order line item',
      );
    }

    const existing = await this.lineItemsService.getLineItemById(id, user);
    if (!existing || existing.documentRef.type !== 'PURCHASE_ORDER') {
      throw new Error('Line item not found');
    }

    // Validate rental line item quantity must be exactly 1
    if (
      existing.type === 'RENTAL' &&
      patch.po_quantity !== undefined &&
      patch.po_quantity !== null
    ) {
      if (patch.po_quantity !== 1) {
        throw new Error(
          'Rental line items must have a quantity of exactly 1. Received quantity: ' +
            patch.po_quantity,
        );
      }
    }

    const updates = this.mapLegacyPurchaseOrderLineItemPatchToLineItemUpdates(
      patch,
      existing,
    );
    const updated = await this.lineItemsService.updateLineItem(
      id,
      updates,
      user,
    );
    if (!updated) return null;
    return this.mapLineItemToPurchaseOrderLineItemDoc(updated);
  }

  async patchRentalPurchaseOrderLineItem(
    id: string,
    patch: Partial<
      Omit<PurchaseOrderLineItemDoc, '_id' | 'created_by' | 'created_at'>
    >,
    user?: UserAuthPayload,
  ): Promise<PurchaseOrderLineItemDoc | null> {
    if (!user) {
      throw new Error(
        'User context is required to patch rental purchase order line item',
      );
    }
    const lineItem = await this.lineItemsService.getLineItemById(id, user);
    if (!lineItem || lineItem.documentRef.type !== 'PURCHASE_ORDER') {
      throw new Error('Line item not found');
    }
    if (lineItem.type !== 'RENTAL') {
      throw new Error('Line item is not of type RENTAL');
    }
    return this.patchPurchaseOrderLineItem(id, patch, user);
  }

  async getLineItemById(
    id: string,
    user?: UserAuthPayload,
  ): Promise<PurchaseOrderLineItemDoc | null> {
    if (!user) {
      throw new Error(
        'User context is required to get purchase order line item',
      );
    }
    const item = await this.lineItemsService.getLineItemById(id, user);
    if (!item || item.documentRef.type !== 'PURCHASE_ORDER') {
      return null;
    }
    return this.mapLineItemToPurchaseOrderLineItemDoc(item);
  }

  async softDeletePurchaseOrderLineItem(
    id: string,
    user?: UserAuthPayload,
  ): Promise<PurchaseOrderLineItemDoc | null> {
    if (!user) {
      throw new Error(
        'User context is required to soft delete purchase order line item',
      );
    }
    const existing = await this.lineItemsService.getLineItemById(id, user);
    if (!existing || existing.documentRef.type !== 'PURCHASE_ORDER') {
      throw new Error('Line item not found');
    }

    await this.authZ.purchaseOrder.hasPermissionOrThrow({
      permission: ERP_PURCHASE_ORDER_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    const deleted = await this.lineItemsService.softDeleteLineItem(id, user);
    return deleted ? this.mapLineItemToPurchaseOrderLineItemDoc(deleted) : null;
  }

  private getApplicableRentalRates(
    item: PurchaseOrderLineItemDoc,
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
    item: PurchaseOrderLineItemDoc,
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
    item: PurchaseOrderLineItemDoc,
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
    item: PurchaseOrderLineItemDoc,
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
    const item = this.mapLineItemToPurchaseOrderLineItemDoc(lineItem);
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

  async patchPurchaseOrder(
    id: string,
    patch: Partial<{
      project_id?: string;
      seller_id: string;
      purchase_order_number: string;
    }>,
    user?: UserAuthPayload,
  ): Promise<PurchaseOrderDoc | null> {
    if (!user) {
      throw new Error('User context is required to patch purchase order');
    }

    // First, fetch the purchase order to verify it exists and user has access
    const [purchaseOrder] = await this.batchGetPurchaseOrdersById([id], user);
    if (!purchaseOrder) {
      throw new Error('Purchase order not found or access denied');
    }

    // Check if user has update permission on this specific purchase order
    try {
      const canUpdate = await this.authZ.purchaseOrder.hasPermission({
        permission: ERP_PURCHASE_ORDER_SUBJECT_PERMISSIONS.USER_UPDATE,
        resourceId: id,
        subjectId: user.id,
      });
      if (!canUpdate) {
        throw new Error(
          'You do not have permission to update this purchase order',
        );
      }
    } catch (error) {
      console.error(
        `Failed to check update permission for purchase order ${id}:`,
        error,
      );
      // Fall back to existing access check (already done above)
    }

    const now = new Date();
    const updated = await this.model.patchPurchaseOrder(id, {
      ...patch,
      updated_at: now,
      updated_by: user.id,
    });

    return updated;
  }

  async submitPurchaseOrder(
    id: string,
    user?: UserAuthPayload,
  ): Promise<PurchaseOrderDoc | null> {
    if (!user) {
      throw new Error(
        'User context is required to update purchase order status',
      );
    }

    // Start a transaction to ensure atomicity
    const session = this.mongoClient.startSession();

    try {
      let purchaseOrder: PurchaseOrderDoc | null = null;

      await session.withTransaction(async () => {
        // Update the purchase order status within the transaction
        purchaseOrder = await this.model.updatePurchaseOrderStatus(
          {
            id,
            status: 'SUBMITTED',
            updatedBy: user.id,
          },
          session,
        );

        if (!purchaseOrder) {
          throw new Error('Purchase order not found');
        }

        // Get all line items for this purchase order
        const lineItems =
          await this.lineItemsService.listLineItemsByDocumentRef(
            purchaseOrder.workspace_id,
            { type: 'PURCHASE_ORDER', id },
            user,
          );
        const purchaseOrderLineItems = lineItems
          .map((item) => this.mapLineItemToPurchaseOrderLineItemDoc(item))
          .filter((item): item is PurchaseOrderLineItemDoc => Boolean(item))
          .filter((item) => item.lineitem_status !== 'DRAFT');

        logger.info(
          `Creating on_order inventory for ${purchaseOrderLineItems.length} line items in PO ${id}`,
        );

        // Create inventory records for each line item
        for (const lineItem of purchaseOrderLineItems) {
          const quantity = lineItem.po_quantity || 1;

          // Determine if this is a PIM product or category
          let pimProductId: string | undefined;
          let pimCategoryId: string | undefined;
          let pimCategoryPath: string | undefined;
          let pimCategoryName: string | undefined;

          if (lineItem.po_pim_id) {
            // Try to load as product first
            const pimProduct = await this.pimProductsService.getPimProductById(
              lineItem.po_pim_id,
              user,
            );

            if (pimProduct) {
              pimProductId = pimProduct._id;
              // Also get category info from the product
              if (pimProduct.pim_category_id) {
                const pimCategory =
                  await this.pimCategoriesService.getPimCategoryById(
                    pimProduct.pim_category_id,
                    user,
                  );
                if (pimCategory) {
                  pimCategoryId = pimCategory._id;
                  pimCategoryPath = pimCategory.path;
                  pimCategoryName = pimCategory.name;
                }
              }
            } else {
              // Try as category
              const pimCategory =
                await this.pimCategoriesService.getPimCategoryById(
                  lineItem.po_pim_id,
                  user,
                );
              if (pimCategory) {
                pimCategoryId = pimCategory._id;
                pimCategoryPath = pimCategory.path;
                pimCategoryName = pimCategory.name;
              }
            }
          }

          // Track created inventory IDs for this line item
          const createdInventoryIds: string[] = [];

          // Create inventory records based on quantity
          for (let i = 0; i < quantity; i++) {
            const inventory = await this.inventoryService.createInventory(
              {
                workspaceId: purchaseOrder.workspace_id,
                status: 'ON_ORDER',
                purchaseOrderId: id,
                purchaseOrderLineItemId: lineItem._id,
                isThirdPartyRental: false, // Owned inventory
                pimProductId,
                pimCategoryId,
                pimCategoryPath,
                pimCategoryName,
              },
              user,
              session,
            );
            createdInventoryIds.push(inventory.id);
          }

          logger.info(
            `Created ${quantity} on_order inventory records for line item ${lineItem._id}`,
          );

          // Find fulfilments associated with this PO line item that need inventory
          const fulfilmentsResult =
            await this.fulfilmentService.listRentalFulfilments(
              {
                filter: {
                  workspace_id: purchaseOrder.workspace_id,
                  purchaseOrderLineItemId: lineItem._id,
                  hasInventoryAssigned: false, // Only unassigned fulfilments
                },
                page: {
                  size: quantity, // Limit to the number of inventory items we created
                },
              },
              user,
            );

          logger.info(
            `Found ${fulfilmentsResult.items.length} unassigned fulfilments for PO line item ${lineItem._id}`,
          );

          // Assign inventory to fulfilments (one-to-one mapping, ordered by creation date)
          let assignedCount = 0;
          for (const fulfilment of fulfilmentsResult.items) {
            if (createdInventoryIds.length > 0) {
              const inventoryId = createdInventoryIds.shift()!;
              try {
                await this.fulfilmentService.assignInventoryToFulfilment(
                  { fulfilmentId: fulfilment.id, inventoryId },
                  user,
                  session,
                );
                assignedCount++;
                logger.info(
                  `Assigned inventory ${inventoryId} to fulfilment ${fulfilment.id}`,
                );
              } catch (error) {
                logger.error(
                  `Failed to assign inventory ${inventoryId} to fulfilment ${fulfilment.id}:`,
                  error,
                );
                // Continue with other assignments even if one fails
              }
            }
          }

          if (assignedCount > 0) {
            logger.info(
              `Successfully assigned ${assignedCount} inventory items to fulfilments for PO line item ${lineItem._id}`,
            );
          }
        }
      });

      await session.commitTransaction();
      return purchaseOrder;
    } catch (error) {
      logger.error(
        error,
        'Failed to submit purchase order and create inventory:',
      );
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async softDeletePurchaseOrder(
    id: string,
    user?: UserAuthPayload,
  ): Promise<PurchaseOrderDoc | null> {
    if (!user) {
      throw new Error('User context is required to soft delete purchase order');
    }
    // Fetch the purchase order (including soft-deleted ones)
    const purchaseOrder = await this.model.getPurchaseOrderByIdAnyStatus(id);
    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    await this.authZ.purchaseOrder.hasPermissionOrThrow({
      permission: ERP_PURCHASE_ORDER_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    await this.model.softDeletePurchaseOrder(id, user.id);
    // Fetch the order again, including soft-deleted ones
    const order = await this.model.getPurchaseOrderByIdAnyStatus(id);
    return order ?? null;
  }
}

export const createPurchaseOrdersService = async (config: {
  mongoClient: MongoClient;
  priceEngineService: PriceEngineService;
  pricesService: PricesService;
  inventoryService: InventoryService;
  pimProductsService: PimProductsService;
  pimCategoriesService: PimCategoriesService;
  fulfilmentService: FulfilmentService;
  lineItemsService: LineItemsService;
  authZ: AuthZ;
}) => {
  const model = createPurchaseOrdersModel(config);
  const purchaseOrdersService = new PurchaseOrdersService({
    model,
    authZ: config.authZ,
    priceEngineService: config.priceEngineService,
    pricesService: config.pricesService,
    inventoryService: config.inventoryService,
    pimProductsService: config.pimProductsService,
    pimCategoriesService: config.pimCategoriesService,
    fulfilmentService: config.fulfilmentService,
    lineItemsService: config.lineItemsService,
    mongoClient: config.mongoClient,
  });
  return purchaseOrdersService;
};
