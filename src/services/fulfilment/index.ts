import { ClientSession, type MongoClient } from 'mongodb';
import { min, max, differenceInCalendarDays, addDays } from 'date-fns';
import Pulse from '@pulsecron/pulse';
import { logger } from '../../lib/logger';
import {
  createFulfilmentModel,
  FulfilmentModel,
  CreateRentalFulfilmentInput,
  CreateSaleFulfilmentInput,
  CreateServiceFulfilmentInput,
  UpdateRentalFulfilmentInput,
  UpdateSaleFulfilmentInput,
  UpdateServiceFulfilmentInput,
  ListFulfilmentsQuery,
  SalesOrderType,
  Fulfilment,
  RentalFulfilment,
  SaleFulfilment,
  ServiceFulfilment,
} from './model';
import { type UserAuthPayload } from '../../authentication';
import {
  SalesOrderLineItemDoc,
  type SalesOrdersService,
} from '../sales_orders';
import { type PricesService } from '../prices';
import { type PriceEngineService } from '../price_engine';
import { type ChargeService } from '../charges';
import { type AuthZ } from '../../lib/authz';
import {
  ERP_FULFILMENT_SUBJECT_RELATIONS,
  ERP_FULFILMENT_SUBJECT_PERMISSIONS,
  ERP_WORKSPACE_SUBJECT_PERMISSIONS,
} from '../../lib/authz/spicedb-generated-types';
import { InventoryService } from '../inventory';

// Re-export DTOs if needed
export type {
  Fulfilment,
  RentalFulfilment,
  SaleFulfilment,
  ServiceFulfilment,
  CreateRentalFulfilmentInput,
  CreateSaleFulfilmentInput,
  CreateServiceFulfilmentInput,
  UpdateRentalFulfilmentInput,
  UpdateSaleFulfilmentInput,
  UpdateServiceFulfilmentInput,
  ListFulfilmentsQuery,
  SalesOrderType,
};

type BaseCreateGeneratedFields =
  | 'workspace_id'
  | 'projectId'
  | 'contactId'
  | 'purchaseOrderNumber';

type BaseCreateInputWithOutFields<OmitList extends string, R extends {} = {}> =
  | (Omit<CreateRentalFulfilmentInput, OmitList> & R)
  | (Omit<CreateSaleFulfilmentInput, OmitList> & R)
  | (Omit<CreateServiceFulfilmentInput, OmitList> & R);

export class FulfilmentService {
  private model: FulfilmentModel;
  private salesOrdersService: SalesOrdersService;
  private pricesService: PricesService;
  private priceEngineService: PriceEngineService;
  private chargeService: ChargeService;
  private pulseService: Pulse;
  private authZ: AuthZ;
  private inventoryService: InventoryService;
  private readonly systemUser: UserAuthPayload;
  private readonly PULSE_CALCULATE_CHARGES_FOR_RENTAL_FULFILMENT =
    'calculateChargesForRentalFulfilment';
  private readonly PULSE_CREATE_DELIVERY_CHARGE_FOR_RENTAL =
    'createDeliveryChargeForRental';
  // TODO, this should ideally be configurable
  public readonly MIN_DAYS_FOR_AUTOMATED_CHARGING = 28;

  constructor(config: {
    model: FulfilmentModel;
    salesOrdersService: SalesOrdersService;
    pricesService: PricesService;
    priceEngineService: PriceEngineService;
    chargeService: ChargeService;
    pulseService: Pulse;
    authZ: AuthZ;
    systemUser: UserAuthPayload;
    inventoryService: InventoryService;
  }) {
    this.model = config.model;
    this.salesOrdersService = config.salesOrdersService;
    this.pricesService = config.pricesService;
    this.priceEngineService = config.priceEngineService;
    this.chargeService = config.chargeService;
    this.pulseService = config.pulseService;
    this.authZ = config.authZ;
    this.systemUser = config.systemUser;
    this.inventoryService = config.inventoryService;

    this.pulseService.define<{
      fulfilmentId: string;
      minimumDays?: number;
      source: string;
    }>(
      this.PULSE_CALCULATE_CHARGES_FOR_RENTAL_FULFILMENT,
      async ({ attrs }) => {
        logger.info(
          { attrs },
          '[FulfilmentService] Pulse job triggered for rental charges',
        );

        await this.model.withTransaction(async (session) => {
          await this.createRentalCharges({
            id: attrs.data.fulfilmentId,
            minimumDays: attrs.data.minimumDays,
            session,
          });
        });
      },
      {
        concurrency: 1,
      },
    );

    this.pulseService.define<{
      fulfilmentId: string;
      deliveryChargeInCents: number;
    }>(
      this.PULSE_CREATE_DELIVERY_CHARGE_FOR_RENTAL,
      async ({ attrs }) => {
        logger.info(
          { attrs },
          '[FulfilmentService] Pulse job triggered for delivery charge',
        );

        await this.model.withTransaction(async (session) => {
          // Get the fulfilment to find the sales order line item
          const fulfilment = await this.model.getFulfilmentById(
            attrs.data.fulfilmentId,
            session,
          );

          if (!fulfilment || !fulfilment.salesOrderLineItemId) {
            throw new Error('Fulfilment or sales order line item not found');
          }

          // Get the sales order line item
          const saleOrderItem = await this.salesOrdersService.getLineItemById(
            fulfilment.salesOrderLineItemId,
          );

          await this.createDeliveryCharge({
            fulfilmentId: attrs.data.fulfilmentId,
            deliveryChargeInCents: attrs.data.deliveryChargeInCents,
            salesOrderLineItem: saleOrderItem,
            session,
          });
        });
      },
      {
        concurrency: 1,
      },
    );

    this.pulseService.define<{ user: UserAuthPayload }>(
      'nightlyRentalChargesJob',
      async ({ attrs }) => {
        const user = attrs.data.user || this.systemUser;
        logger.info(
          { attrs },
          '[FulfilmentService] Pulse job triggered for nightly rental charges',
        );
        await this.nightlyRentalChargesJob(user);
      },
    );
    this.pulseService.every('0 0 * * *', 'nightlyRentalChargesJob');
  }

  calculateActiveRentalDays(opts: {
    from: Date;
    pausedPeriods: { start: Date; end: Date | null }[];
    to: Date;
  }): number {
    const { from, pausedPeriods, to } = opts;
    let pausedDays = 0;

    for (const period of pausedPeriods) {
      const pausedStart = max([from, period.start]);
      const pausedEnd = period.end ? min([period.end, to]) : to;

      if (pausedEnd > pausedStart) {
        pausedDays += differenceInCalendarDays(pausedEnd, pausedStart);
      }
    }

    return differenceInCalendarDays(to, from) - pausedDays;
  }

  async cancelScheduledDeliveryChargeJobs(fulfilmentId: string) {
    try {
      // Cancel any existing scheduled delivery charge jobs for this fulfilment
      await this.pulseService.cancel({
        name: this.PULSE_CREATE_DELIVERY_CHARGE_FOR_RENTAL,
        'data.fulfilmentId': fulfilmentId,
      });
      logger.info(
        { fulfilmentId },
        `[FulfilmentService] Cancelled scheduled delivery charge jobs for fulfilment ${fulfilmentId}`,
      );
    } catch (err) {
      logger.error(
        { err, fulfilmentId },
        `[FulfilmentService] Error cancelling scheduled delivery charge jobs for fulfilment ${fulfilmentId}`,
      );
    }
  }

  async createDeliveryCharge(opts: {
    fulfilmentId: string;
    deliveryChargeInCents: number;
    salesOrderLineItem?: SalesOrderLineItemDoc | null;
    session?: ClientSession;
  }) {
    const fulfilment = await this.model.getFulfilmentById(
      opts.fulfilmentId,
      opts.session,
    );
    if (!fulfilment) {
      throw new Error('Fulfilment not found');
    }

    // Check if delivery charge already exists to prevent duplicates
    const existingCharges = await this.chargeService.listCharges(
      {
        filter: {
          fulfilmentId: opts.fulfilmentId,
          chargeType: 'SERVICE',
        },
      },
      this.systemUser,
      opts.session,
    );

    // Check if any existing charge has the delivery charge description
    const hasDeliveryCharge = existingCharges.items.some((charge) =>
      charge.description.startsWith('Delivery charge for'),
    );

    if (hasDeliveryCharge) {
      logger.info(
        { fulfilmentId: opts.fulfilmentId },
        `[FulfilmentService] Delivery charge already exists for fulfilment ${opts.fulfilmentId}`,
      );
      return;
    }

    // Determine billing dates based on priority:
    // 1. salesOrderLineItem.delivery_date
    // 2. fulfilment.rentalStartDate (if it's a rental and it's set)
    // 3. fulfilment.createdAt
    let billingDate: Date;

    if (opts.salesOrderLineItem?.delivery_date) {
      billingDate = new Date(opts.salesOrderLineItem.delivery_date);
    } else if (
      fulfilment.salesOrderType === 'RENTAL' &&
      fulfilment.rentalStartDate
    ) {
      billingDate = fulfilment.rentalStartDate;
    } else {
      billingDate = fulfilment.createdAt;
    }

    // Create a SERVICE charge for delivery
    await this.chargeService.createCharge(
      {
        workspaceId: fulfilment.workspace_id,
        amountInCents: opts.deliveryChargeInCents,
        salesOrderId: fulfilment.salesOrderId,
        chargeType: 'SERVICE',
        salesOrderLineItemId: fulfilment.salesOrderLineItemId,
        purchaseOrderNumber: fulfilment.purchaseOrderNumber,
        contactId: fulfilment.contactId,
        projectId: fulfilment.projectId,
        fulfilmentId: fulfilment.id,
        description: `Delivery charge for ${fulfilment.pimCategoryName}${fulfilment.priceName ? ': ' + fulfilment.priceName : ''}`,
        priceId: fulfilment.priceId,
        billingPeriodStart: billingDate,
        billingPeriodEnd: billingDate,
      },
      this.systemUser,
      opts.session,
    );
  }

  calculateRentalBillingPeriods(opts: {
    from: Date;
    to: Date;
    maxDays: number;
  }) {
    const billingPeriods: { from: Date; to: Date; days: number }[] = [];

    let currentStart = opts.from;
    const endDate = opts.to;

    while (currentStart < endDate) {
      // Calculate the end of this billing period
      const potentialEnd = addDays(currentStart, opts.maxDays);
      const periodEnd = potentialEnd > endDate ? endDate : potentialEnd;

      // Add the billing period
      billingPeriods.push({
        from: currentStart,
        to: periodEnd,
        days: differenceInCalendarDays(periodEnd, currentStart),
      });

      // Move to the next period start
      currentStart = periodEnd;
    }

    return billingPeriods;
  }

  async createRentalCharges(opts: {
    id: string;
    minimumDays?: number;
    session?: ClientSession;
  }) {
    const fulfilment = await this.model.getFulfilmentById(
      opts.id,
      opts.session,
    );
    if (!fulfilment) {
      throw new Error('Fulfilment not found');
    }

    if (fulfilment.salesOrderType !== 'RENTAL') {
      throw new Error('Fulfilment is not a rental fulfilment');
    }
    if (!fulfilment.rentalStartDate) {
      throw new Error('Rental start date must be set before creating charges');
    }

    const billingPeriods = this.calculateRentalBillingPeriods({
      from: fulfilment.lastBillingPeriodEnd || fulfilment.rentalStartDate,
      to: fulfilment.rentalEndDate || new Date(),
      maxDays: this.MIN_DAYS_FOR_AUTOMATED_CHARGING,
    });

    for (const period of billingPeriods) {
      if (opts.minimumDays && period.days < opts.minimumDays) {
        continue;
      }

      const cost = this.priceEngineService.calculateOptimalCost({
        startDate: period.from,
        endDate: period.to,
        totalDays: period.days,
        pricePer1DayInCents: fulfilment.pricePerDayInCents,
        pricePer7DaysInCents: fulfilment.pricePerWeekInCents,
        pricePer28DaysInCents: fulfilment.pricePerMonthInCents,
      });

      const charge = await this.chargeService.createCharge(
        {
          workspaceId: fulfilment.workspace_id,
          amountInCents: cost.costInCents,
          salesOrderId: fulfilment.salesOrderId,
          chargeType: 'RENTAL',
          salesOrderLineItemId: fulfilment.salesOrderLineItemId,
          purchaseOrderNumber: fulfilment.purchaseOrderNumber,
          contactId: fulfilment.contactId,
          projectId: fulfilment.projectId,
          fulfilmentId: fulfilment.id,
          // update description to include billing period details
          description: `Rental charge for ${fulfilment.pimCategoryName}: ${fulfilment.priceName ? fulfilment.priceName + ',' : ''} ${period.days} ${period.days > 1 ? 'days' : 'day'}: ${cost.details.plainText}`,
          priceId: fulfilment.priceId,
          billingPeriodStart: period.from,
          billingPeriodEnd: period.to,
        },
        this.systemUser,
        opts.session,
      );

      await this.model.setRentalLastChargedAt(
        {
          id: fulfilment.id,
          lastChargedAt: charge.createdAt,
          lastBillingPeriodEnd: period.to,
          userId: this.systemUser.id,
          daysCharged: period.days,
        },
        opts.session,
      );
    }
  }

  async nightlyRentalChargesJob(user: UserAuthPayload) {
    const isERPAdmin = await this.authZ.isERPAdmin(user);

    if (!isERPAdmin) {
      throw new Error('Unauthorized: User is not an ERP admin');
    }

    const fulfilments = await this.model.getRentalFulfilmentsDueForCharge({
      billingPeriodInDays: this.MIN_DAYS_FOR_AUTOMATED_CHARGING,
    });

    logger.info(
      { fulfilmentCount: fulfilments.length },
      `[FulfilmentService] dailyJob: Found ${fulfilments.length} rental fulfilments due for charge`,
    );

    for (const fulfilment of fulfilments) {
      try {
        await this.pulseService.now(
          this.PULSE_CALCULATE_CHARGES_FOR_RENTAL_FULFILMENT,
          {
            fulfilmentId: fulfilment.id,
            source: 'nightlyRentalChargesJob',
          },
        );
      } catch (err) {
        logger.error(
          { err, fulfilmentId: fulfilment.id },
          `[FulfilmentService] dailyJob: Error creating rental charges for fulfilment ${fulfilment.id}`,
        );
      }
    }

    return fulfilments;
  }

  async nightlyRentalChargesJobAsync(user: UserAuthPayload) {
    return await this.pulseService.now('nightlyRentalChargesJob', {
      user,
    });
  }

  async createFulfilment(
    input: BaseCreateInputWithOutFields<BaseCreateGeneratedFields>,
    user: UserAuthPayload,
    session?: ClientSession,
  ) {
    // auth, validation, business logic can be added here
    if (!user) {
      throw new Error('User not authenticated');
    }

    const [salesOrder] = await this.salesOrdersService.batchGetSalesOrdersById(
      [input.salesOrderId],
      user,
    );

    if (!salesOrder) {
      throw new Error('Sales order not found for id: ' + input.salesOrderId);
    }

    if (!salesOrder.workspace_id) {
      throw new Error('Sales order does not have a workspace_id');
    }

    const doc = await this.model.createFulfilment(
      {
        ...input,
        workspace_id: salesOrder.workspace_id,
        projectId: salesOrder.project_id ?? undefined,
        contactId: salesOrder.buyer_id,
        purchaseOrderNumber: salesOrder.purchase_order_number || '',
        createdBy: user.id,
      },
      user.id,
      session,
    );
    if (!doc) {
      throw new Error('Failed to create fulfilment');
    }

    await this.authZ.fulfilment.writeRelations([
      {
        resourceId: doc.id,
        subjectId: salesOrder.workspace_id,
        relation: ERP_FULFILMENT_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
      },
      {
        resourceId: doc.id,
        subjectId: input.salesOrderId,
        relation: ERP_FULFILMENT_SUBJECT_RELATIONS.SALES_ORDER_SALES_ORDER,
      },
    ]);

    return doc;
  }

  async createFulfilmentFromSalesOrderItem(
    input: {
      salesOrderId: string;
      salesOrderLineItemId: string;
    },
    user?: UserAuthPayload,
  ) {
    // auth, validation, business logic can be added here
    if (!user) {
      throw new Error('User not authenticated');
    }

    const [saleOrder] = await this.salesOrdersService.batchGetSalesOrdersById(
      [input.salesOrderId],
      user,
    );

    if (!saleOrder) {
      throw new Error('Sales order not found for id: ' + input.salesOrderId);
    }

    const saleOrderItem = await this.salesOrdersService.getLineItemById(
      input.salesOrderLineItemId,
    );
    if (!saleOrderItem) {
      throw new Error('Sales order item not found');
    }

    if (!saleOrderItem.price_id) {
      throw new Error('Sales order item does not have a price ID');
    }

    const [price] = await this.pricesService.batchGetPricesByIds(
      [saleOrderItem.price_id],
      user,
    );

    if (!price || price instanceof Error) {
      throw new Error('Price not found for sales order line item');
    }

    if (saleOrderItem.lineitem_type === 'RENTAL') {
      if (price.priceType !== 'RENTAL') {
        throw new Error(
          `Price type ${price.priceType} does not match sales order item type RENTAL`,
        );
      }

      return this.model.withTransaction(async (session) => {
        const fulfilment = await this.createFulfilment(
          {
            salesOrderId: input.salesOrderId,
            salesOrderLineItemId: input.salesOrderLineItemId,
            salesOrderType: 'RENTAL',
            priceId: price.id,
            priceName: price.name,
            pimCategoryId: price.pimCategoryId,
            pimCategoryPath: price.pimCategoryPath,
            pimCategoryName: price.pimCategoryName,
            pimProductId: price.pimProductId,
            createdBy: user.id,
            pricePerDayInCents: price.pricePerDayInCents,
            pricePerWeekInCents: price.pricePerWeekInCents,
            pricePerMonthInCents: price.pricePerMonthInCents,
            rentalStartDate: saleOrderItem.delivery_date
              ? new Date(saleOrderItem.delivery_date)
              : undefined,
            expectedRentalEndDate: saleOrderItem.off_rent_date
              ? new Date(saleOrderItem.off_rent_date)
              : undefined,
          },
          user,
          session,
        );

        // If rental start date is set and is in the past, check if we need to create charges
        if (
          fulfilment.salesOrderType === 'RENTAL' &&
          fulfilment.rentalStartDate
        ) {
          const daysSinceStart = differenceInCalendarDays(
            new Date(),
            fulfilment.rentalStartDate,
          );

          // If the rental started >= MIN_DAYS_FOR_AUTOMATED_CHARGING days ago, create charges
          if (daysSinceStart >= this.MIN_DAYS_FOR_AUTOMATED_CHARGING) {
            await this.createRentalCharges({
              id: fulfilment.id,
              minimumDays: this.MIN_DAYS_FOR_AUTOMATED_CHARGING,
              session,
            });
          }
        }

        // Handle delivery charge if present for RENTAL
        if (
          saleOrderItem.delivery_charge_in_cents &&
          saleOrderItem.delivery_charge_in_cents > 0 &&
          fulfilment.salesOrderType === 'RENTAL'
        ) {
          if (fulfilment.rentalStartDate) {
            const now = new Date();
            if (fulfilment.rentalStartDate <= now) {
              // Create delivery charge immediately if rental has started
              await this.createDeliveryCharge({
                fulfilmentId: fulfilment.id,
                deliveryChargeInCents: saleOrderItem.delivery_charge_in_cents,
                salesOrderLineItem: saleOrderItem,
                session,
              });
            } else {
              // Schedule delivery charge for rental start date
              await this.pulseService.schedule(
                fulfilment.rentalStartDate,
                this.PULSE_CREATE_DELIVERY_CHARGE_FOR_RENTAL,
                {
                  fulfilmentId: fulfilment.id,
                  deliveryChargeInCents: saleOrderItem.delivery_charge_in_cents,
                },
              );
            }
          }
        }

        return fulfilment;
      });
    }

    if (saleOrderItem.lineitem_type === 'SALE') {
      if (price.priceType !== 'SALE') {
        throw new Error(
          `Price type ${price.priceType} does not match sales order item type SALE`,
        );
      }

      return this.model.withTransaction(async (session) => {
        const fulfilment = await this.createFulfilment(
          {
            ...input,
            salesOrderId: input.salesOrderId,
            salesOrderLineItemId: input.salesOrderLineItemId,
            salesOrderType: 'SALE',
            priceId: price.id,
            priceName: price.name,
            pimCategoryId: price.pimCategoryId,
            pimCategoryPath: price.pimCategoryPath,
            pimCategoryName: price.pimCategoryName,
            pimProductId: price.pimProductId,
            createdBy: user.id,
            unitCostInCents: price.unitCostInCents,
            quantity: saleOrderItem.so_quantity || 1,
          },
          user,
          session,
        );

        if (
          fulfilment.salesOrderType === 'SALE' &&
          fulfilment.unitCostInCents !== 0
        ) {
          // Create a charge immediately for the sale fulfilment
          await this.chargeService.createCharge(
            {
              workspaceId: fulfilment.workspace_id,
              amountInCents: fulfilment.unitCostInCents * fulfilment.quantity,
              chargeType: 'SALE',
              contactId: fulfilment.contactId,
              description: `Sale of ${price.pimCategoryName}: ${price.name ? price.name + ',' : ''} ($${(fulfilment.unitCostInCents / 100).toFixed(2)}) x ${fulfilment.quantity}`,
              fulfilmentId: fulfilment.id,
              salesOrderId: fulfilment.salesOrderId,
              salesOrderLineItemId: fulfilment.salesOrderLineItemId,
              purchaseOrderNumber: fulfilment.purchaseOrderNumber,
              projectId: fulfilment.projectId,
              priceId: fulfilment.priceId,
              billingPeriodStart: fulfilment.createdAt,
              billingPeriodEnd: fulfilment.createdAt,
            },
            user,
            session,
          );
        }

        // Handle delivery charge if present for SALE
        if (
          saleOrderItem.delivery_charge_in_cents &&
          saleOrderItem.delivery_charge_in_cents > 0
        ) {
          await this.createDeliveryCharge({
            fulfilmentId: fulfilment.id,
            deliveryChargeInCents: saleOrderItem.delivery_charge_in_cents,
            salesOrderLineItem: saleOrderItem,
            session,
          });
        }

        return fulfilment;
      });
    }

    throw new Error(
      // @ts-ignore
      `Unsupported sales order item type: ${saleOrderItem.lineitem_type}`,
    );
  }

  // Delete
  async deleteFulfilment(id: string, user?: UserAuthPayload) {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has permission to delete this fulfilment
    const canDelete = await this.authZ.fulfilment.hasPermission({
      permission: ERP_FULFILMENT_SUBJECT_PERMISSIONS.USER_DELETE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canDelete) {
      throw new Error('You do not have permission to delete this fulfilment');
    }

    // auth, validation, business logic can be added here
    const deleted = await this.model.deleteFulfilment(id, user.id);
    if (!deleted) {
      throw new Error('Fulfilment not found');
    }
    return deleted;
  }

  // Get by ID
  async getFulfilmentById(id: string, user?: UserAuthPayload) {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const doc = await this.model.getFulfilmentById(id);
    if (!doc) {
      throw new Error('Fulfilment not found');
    }

    // Check if user has permission to read this fulfilment
    const canRead = await this.authZ.fulfilment.hasPermission({
      permission: ERP_FULFILMENT_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canRead) {
      throw new Error('You do not have permission to view this fulfilment');
    }

    return doc;
  }

  async getFulfilmentBySalesOrderLineItemId(
    salesOrderLineItemId: string,
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const doc =
      await this.model.getFulfilmentBySalesOrderLineItemId(
        salesOrderLineItemId,
      );
    if (!doc) {
      return null;
    }

    // Check if user has permission to read this fulfilment
    const canRead = await this.authZ.fulfilment.hasPermission({
      permission: ERP_FULFILMENT_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: doc.id,
      subjectId: user.id,
    });

    if (!canRead) {
      throw new Error('You do not have permission to view this fulfilment');
    }

    return doc;
  }

  // List
  async listFulfilments(query: ListFulfilmentsQuery, user?: UserAuthPayload) {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Workspace is required for listing fulfilments
    if (!query.filter.workspace_id) {
      throw new Error('workspace_id is required to list fulfilments');
    }

    // Check if user has permission to read sales orders in the workspace
    const canReadSalesOrders = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_READ_SALES_ORDERS,
      resourceId: query.filter.workspace_id,
      subjectId: user.id,
    });

    if (!canReadSalesOrders) {
      // User doesn't have permission, return empty result
      return {
        items: [],
        page: {
          number: query.page?.number ?? 1,
          size: query.page?.size ?? 10,
          totalItems: 0,
          totalPages: 0,
        },
      };
    }

    const filter = {
      ...query?.filter,
      workspace_id: query.filter.workspace_id,
    };

    const items = await this.model.listFulfilments({ ...query, filter });
    const totalItems = await this.model.countFulfilments(filter);
    return {
      items,
      page: {
        number: query.page?.number ?? 1,
        size: query.page?.size ?? 10,
        totalItems,
        totalPages: Math.ceil(totalItems / (query.page?.size ?? 10)) || 0,
      },
    };
  }

  // List Rental Fulfilments
  async listRentalFulfilments(
    query: {
      filter?: {
        workspace_id?: string;
        salesOrderId?: string;
        salesOrderLineItemId?: string;
        purchaseOrderLineItemId?: string;
        workflowId?: string;
        workflowColumnId?: string;
        assignedToId?: string;
        contactId?: string;
        projectId?: string;
        pimCategoryId?: string;
        timelineStartDate?: Date;
        timelineEndDate?: Date;
        hasInventoryAssigned?: boolean;
      };
      page?: {
        size?: number;
        number?: number;
      };
    },
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Workspace is required for listing fulfilments
    if (!query.filter?.workspace_id) {
      throw new Error('workspace_id is required to list rental fulfilments');
    }

    // Check if user has permission to read sales orders in the workspace
    const canReadSalesOrders = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_READ_SALES_ORDERS,
      resourceId: query.filter.workspace_id,
      subjectId: user.id,
    });

    if (!canReadSalesOrders) {
      // User doesn't have permission, return empty result
      return {
        items: [],
        page: {
          number: query.page?.number ?? 1,
          size: query.page?.size ?? 10,
          totalItems: 0,
          totalPages: 0,
        },
      };
    }

    const filter = {
      ...query?.filter,
      workspace_id: query.filter.workspace_id,
    };

    const items = await this.model.listRentalFulfilments({
      filter,
      page: query.page,
    });
    const totalItems = await this.model.countRentalFulfilments(filter);

    return {
      items,
      page: {
        number: query.page?.number ?? 1,
        size: query.page?.size ?? 10,
        totalItems,
        totalPages: Math.ceil(totalItems / (query.page?.size ?? 10)) || 0,
      },
    };
  }

  async updateColumn(
    id: string,
    workflowColumnId: string | null,
    workflowId: string | null,
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has permission to update this fulfilment
    const canUpdate = await this.authZ.fulfilment.hasPermission({
      permission: ERP_FULFILMENT_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canUpdate) {
      throw new Error('You do not have permission to update this fulfilment');
    }

    const updated = await this.model.updateColumn(
      id,
      workflowColumnId,
      workflowId,
      user.id,
    );
    if (!updated) {
      throw new Error('Fulfilment not found');
    }
    return updated;
  }

  async updateAssignee(
    id: string,
    assignTo: string | null,
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has permission to update this fulfilment
    const canUpdate = await this.authZ.fulfilment.hasPermission({
      permission: ERP_FULFILMENT_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canUpdate) {
      throw new Error('You do not have permission to update this fulfilment');
    }

    const updated = await this.model.updateAssignee(id, assignTo, user.id);
    if (!updated) {
      throw new Error('Fulfilment not found');
    }
    return updated;
  }

  async setRentalStartDate(
    id: string,
    rentalStartDate: Date,
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has permission to manage rental periods for this fulfilment
    const canManageRentalPeriod = await this.authZ.fulfilment.hasPermission({
      permission: ERP_FULFILMENT_SUBJECT_PERMISSIONS.USER_MANAGE_RENTAL_PERIOD,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canManageRentalPeriod) {
      throw new Error(
        'You do not have permission to manage rental periods for this fulfilment',
      );
    }

    // verify the fulfilment is a rental fulfilment
    const fulfilment = await this.model.getFulfilmentById(id);
    if (!fulfilment) {
      throw new Error('Fulfilment not found');
    }
    if (fulfilment.salesOrderType !== 'RENTAL') {
      throw new Error('Fulfilment is not a rental fulfilment');
    }

    if (
      fulfilment.expectedRentalEndDate &&
      rentalStartDate >= fulfilment.expectedRentalEndDate
    ) {
      throw new Error(
        'Rental start date must be before the expected rental end date',
      );
    }

    return this.model.withTransaction(async (session) => {
      const hasAnyChargesBeenInvoiced =
        await this.chargeService.hasAnyChargesBeenInvoicedForFulfillment(
          fulfilment.id,
          user,
          session,
        );

      if (hasAnyChargesBeenInvoiced) {
        throw new Error(
          'Rental start date cannot be changed after charges have been invoiced',
        );
      }

      await this.model.setRentalStartDate(
        { id, rentalStartDate, userId: user.id },
        session,
      );

      await this.chargeService.deleteAllChargesByFulfilmentId(
        id,
        this.systemUser,
        session,
      );

      await this.model.resetRentalLastChargedAt(
        {
          id,
          userId: this.systemUser.id,
        },
        session,
      );

      await this.createRentalCharges({
        id,
        minimumDays: this.MIN_DAYS_FOR_AUTOMATED_CHARGING,
        session,
      });

      // Handle delivery charge when setting rental start date
      if (fulfilment.salesOrderLineItemId) {
        // First, cancel any previously scheduled delivery charge jobs
        await this.cancelScheduledDeliveryChargeJobs(id);

        const saleOrderItem = await this.salesOrdersService.getLineItemById(
          fulfilment.salesOrderLineItemId,
        );

        if (
          saleOrderItem &&
          saleOrderItem.lineitem_type === 'RENTAL' &&
          saleOrderItem.delivery_charge_in_cents &&
          saleOrderItem.delivery_charge_in_cents > 0
        ) {
          const now = new Date();
          if (rentalStartDate <= now) {
            // Create delivery charge immediately if rental has started
            await this.createDeliveryCharge({
              fulfilmentId: id,
              deliveryChargeInCents: saleOrderItem.delivery_charge_in_cents,
              salesOrderLineItem: saleOrderItem,
              session,
            });
          } else {
            // Schedule delivery charge for rental start date
            await this.pulseService.schedule(
              rentalStartDate,
              this.PULSE_CREATE_DELIVERY_CHARGE_FOR_RENTAL,
              {
                fulfilmentId: id,
                deliveryChargeInCents: saleOrderItem.delivery_charge_in_cents,
              },
            );
          }
        }
      }

      const updatedFulfilment = await this.model.getFulfilmentById(id, session);

      if (!updatedFulfilment) {
        throw new Error('Fulfilment not found after setting rental start date');
      }

      return updatedFulfilment as RentalFulfilment;
    });
  }

  async setExpectedRentalEndDate(
    id: string,
    expectedRentalEndDate: Date,
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has permission to manage rental periods for this fulfilment
    const canManageRentalPeriod = await this.authZ.fulfilment.hasPermission({
      permission: ERP_FULFILMENT_SUBJECT_PERMISSIONS.USER_MANAGE_RENTAL_PERIOD,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canManageRentalPeriod) {
      throw new Error(
        'You do not have permission to manage rental periods for this fulfilment',
      );
    }

    // verify the fulfilment is a rental fulfilment
    const fulfilment = await this.model.getFulfilmentById(id);
    if (!fulfilment) {
      throw new Error('Fulfilment not found');
    }

    if (fulfilment.salesOrderType !== 'RENTAL') {
      throw new Error('Fulfilment is not a rental fulfilment');
    }

    if (
      fulfilment.rentalStartDate &&
      expectedRentalEndDate <= fulfilment.rentalStartDate
    ) {
      throw new Error('Expected end date must be after the start date');
    }

    return this.model.setExpectedRentalEndDate(
      id,
      expectedRentalEndDate,
      user.id,
    );
  }

  async setRentalEndDate(
    id: string,
    rentalEndDate: Date,
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has permission to manage rental periods for this fulfilment
    const canManageRentalPeriod = await this.authZ.fulfilment.hasPermission({
      permission: ERP_FULFILMENT_SUBJECT_PERMISSIONS.USER_MANAGE_RENTAL_PERIOD,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canManageRentalPeriod) {
      throw new Error(
        'You do not have permission to manage rental periods for this fulfilment',
      );
    }

    // verify the rental start date is set
    const fulfilment = await this.model.getFulfilmentById(id);
    if (!fulfilment) {
      throw new Error('Fulfilment not found');
    }

    // verify the fulfilment is a rental fulfilment
    if (fulfilment.salesOrderType !== 'RENTAL') {
      throw new Error('Fulfilment is not a rental fulfilment');
    }

    if (!fulfilment.rentalStartDate) {
      throw new Error('Rental start date must be set before setting end date');
    }

    // verify the rental end date is after the start date
    if (rentalEndDate <= fulfilment.rentalStartDate) {
      throw new Error('Rental end date must be after the start date');
    }

    return this.model.withTransaction(async (session) => {
      await this.model.setRentalEndDate({
        id,
        rentalEndDate,
        userId: user.id,
        session,
      });

      await this.createRentalCharges({
        id,
        session,
      });

      const updatedFulfilment = await this.model.getFulfilmentById(id, session);
      if (!updatedFulfilment) {
        throw new Error('Fulfilment not found after setting rental end date');
      }

      return updatedFulfilment as RentalFulfilment;
    });
  }

  assignInventoryToFulfilment(
    input: {
      fulfilmentId: string;
      inventoryId: string;
    },
    user: UserAuthPayload,
    session?: ClientSession,
  ) {
    return this.model.assignInventoryToFulfilment(
      input.fulfilmentId,
      input.inventoryId,
      user.id,
      session,
    );
  }

  async assignInventoryToRentalFulfilmentWithReservation(
    input: {
      fulfilmentId: string;
      inventoryId: string;
      allowOverlappingReservations?: boolean;
    },
    user: UserAuthPayload,
  ): Promise<RentalFulfilment> {
    return this.model.withTransaction(async (session) => {
      // 1. Get fulfilment for validation and dates
      const fulfilment = await this.model.getFulfilmentById(
        input.fulfilmentId,
        session,
      );

      if (!fulfilment) {
        throw new Error(`Fulfilment with ID ${input.fulfilmentId} not found`);
      }

      if (fulfilment.salesOrderType !== 'RENTAL') {
        throw new Error(
          `Fulfilment with ID ${input.fulfilmentId} is not a rental fulfilment`,
        );
      }

      // 2. Get inventory to obtain PO line item ID
      const inventory = await this.inventoryService.getInventoryById(
        input.inventoryId,
        user,
      );

      if (!inventory) {
        throw new Error(`Inventory with ID ${input.inventoryId} not found`);
      }

      const startDate: Date =
        fulfilment.rentalStartDate || fulfilment.createdAt;
      const endDate: Date =
        fulfilment.expectedRentalEndDate || fulfilment.createdAt;

      // 3. Create fulfilment reservation (with session)
      await this.inventoryService.createFulfilmentReservation(
        {
          fulfilmentId: input.fulfilmentId,
          inventoryId: input.inventoryId,
          startDate,
          endDate,
          salesOrderType: fulfilment.salesOrderType,
          allowOverlappingReservations:
            input.allowOverlappingReservations ?? false,
        },
        user,
        session,
      );

      // 4. Assign inventory to fulfilment (with session)
      await this.assignInventoryToFulfilment(
        {
          fulfilmentId: input.fulfilmentId,
          inventoryId: input.inventoryId,
        },
        user,
        session,
      );

      // 5. Set PO line item ID if inventory has one (with session)
      if (inventory.purchaseOrderLineItemId) {
        await this.setPurchaseOrderLineItemId(
          input.fulfilmentId,
          inventory.purchaseOrderLineItemId,
          user,
          session,
        );
      }

      // 6. Get and return updated fulfilment
      const updatedFulfilment = await this.model.getFulfilmentById(
        input.fulfilmentId,
        session,
      );

      if (!updatedFulfilment || updatedFulfilment.salesOrderType !== 'RENTAL') {
        throw new Error(
          'Unexpected error: fulfilment not found or not rental type',
        );
      }

      return updatedFulfilment as RentalFulfilment;
    });
  }

  unassignInventoryFromFulfilment(
    input: {
      fulfilmentId: string;
    },
    user: UserAuthPayload,
  ) {
    return this.model.unassignInventoryToFulfilment(
      input.fulfilmentId,
      user.id,
    );
  }

  async setPurchaseOrderLineItemId(
    id: string,
    purchaseOrderLineItemId: string | null,
    user: UserAuthPayload,
    session?: ClientSession,
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user has permission to update this fulfilment
    const canUpdate = await this.authZ.fulfilment.hasPermission({
      permission: ERP_FULFILMENT_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!canUpdate) {
      throw new Error('You do not have permission to update this fulfilment');
    }

    const updated = await this.model.setPurchaseOrderLineItemId(
      id,
      purchaseOrderLineItemId,
      user.id,
      session,
    );
    if (!updated) {
      throw new Error('Fulfilment not found');
    }
    return updated;
  }
}

export const createFulfilmentService = (config: {
  mongoClient: MongoClient;
  salesOrdersService: SalesOrdersService;
  pricesService: PricesService;
  priceEngineService: PriceEngineService;
  chargeService: ChargeService;
  pulseService: Pulse;
  authZ: AuthZ;
  systemUser: UserAuthPayload;
  inventoryService: InventoryService;
}) => {
  const model = createFulfilmentModel(config);
  const fulfilmentService = new FulfilmentService({
    model,
    salesOrdersService: config.salesOrdersService,
    pricesService: config.pricesService,
    priceEngineService: config.priceEngineService,
    chargeService: config.chargeService,
    pulseService: config.pulseService,
    authZ: config.authZ,
    systemUser: config.systemUser,
    inventoryService: config.inventoryService,
  });
  return fulfilmentService;
};
