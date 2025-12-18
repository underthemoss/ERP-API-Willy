import { type MongoClient } from 'mongodb';
import {
  createQuotesModel,
  type QuotesModel,
  type CreateQuoteInput,
  type ListQuotesQuery,
  type QuoteStatus,
} from './quotes-model';
import {
  CreateQuoteRevisionInput,
  createQuoteRevisionsModel,
  type QuoteRevisionsModel,
} from './quote-revisions-model';

import {
  createRFQsModel,
  type RFQsModel,
  type CreateRFQInput,
  type UpdateRFQInput,
  type ListRFQsQuery,
} from './request-for-quotes-model';

import { UserAuthPayload } from '../../authentication';
import { EnvConfig } from '../../config';
import { PriceEngineService } from '../price_engine';
import { PricesService } from '../prices';
import {
  ERP_QUOTE_SUBJECT_PERMISSIONS,
  ERP_QUOTE_SUBJECT_RELATIONS,
  ERP_RFQ_SUBJECT_PERMISSIONS,
  ERP_RFQ_SUBJECT_RELATIONS,
  ERP_WORKSPACE_SUBJECT_PERMISSIONS,
  ERP_PRICEBOOK_PRICE_SUBJECT_RELATIONS,
  type AuthZ,
} from '../../lib/authz';

// DTOs
export type {
  QuoteRevision,
  QuoteRevisionLineItem,
  QuoteRevisionServiceLineItem,
  QuoteRevisionRentalLineItem,
  QuoteRevisionSaleLineItem,
} from './quote-revisions-model';
export type { Quote } from './quotes-model';
export type {
  RFQ,
  RFQLineItemType,
  RFQServiceLineItem,
  RFQRentalLineItem,
  RFQSaleLineItem,
} from './request-for-quotes-model';

export class QuotingService {
  private quotesModel: QuotesModel;
  private quoteRevisionsModel: QuoteRevisionsModel;
  private rfqsModel: RFQsModel;
  private envConfig: EnvConfig;
  private priceEngineService: PriceEngineService;
  private pricesService: PricesService;
  private authZ: AuthZ;

  constructor(config: {
    quotesModel: QuotesModel;
    quoteRevisionsModel: QuoteRevisionsModel;
    rfqsModel: RFQsModel;
    envConfig: EnvConfig;
    priceEngineService: PriceEngineService;
    pricesService: PricesService;
    authZ: AuthZ;
  }) {
    this.quotesModel = config.quotesModel;
    this.quoteRevisionsModel = config.quoteRevisionsModel;
    this.rfqsModel = config.rfqsModel;
    this.envConfig = config.envConfig;
    this.priceEngineService = config.priceEngineService;
    this.pricesService = config.pricesService;
    this.authZ = config.authZ;
  }

  /**************************
   * QUOTES METHODS
   ************************/
  async createQuote(
    input: Omit<CreateQuoteInput, 'createdBy' | 'updatedBy'>,
    user: UserAuthPayload,
  ) {
    await this.authZ.workspace.hasPermissionOrThrow({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_QUOTES,
      resourceId: input.sellerWorkspaceId,
      subjectId: user.id,
    });

    return this.quotesModel.withTransaction(async (session) => {
      const quote = await this.quotesModel.createQuote(
        {
          ...input,
          createdBy: user.id,
          updatedBy: user.id,
        },
        session,
      );

      await this.authZ.quote.writeRelation({
        subjectId: input.sellerWorkspaceId,
        relation: ERP_QUOTE_SUBJECT_RELATIONS.WORKSPACE_SELLERS_WORKSPACE,
        resourceId: quote.id,
      });

      if (input.buyerWorkspaceId) {
        await this.authZ.quote.writeRelation({
          subjectId: input.buyerWorkspaceId,
          relation: ERP_QUOTE_SUBJECT_RELATIONS.WORKSPACE_BUYERS_WORKSPACE,
          resourceId: quote.id,
        });
      }

      return quote;
    });
  }

  async listQuotes(query: ListQuotesQuery, user: UserAuthPayload) {
    if (!query.filter.buyerWorkspaceId && !query.filter.sellerWorkspaceId) {
      throw new Error(
        'Either buyerWorkspaceId or sellerWorkspaceId must be provided in filter',
      );
    }

    if (query.filter.buyerWorkspaceId) {
      await this.authZ.workspace.hasPermissionOrThrow({
        permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_READ_QUOTES,
        resourceId: query.filter.buyerWorkspaceId,
        subjectId: user.id,
      });
    }

    if (query.filter.sellerWorkspaceId) {
      await this.authZ.workspace.hasPermissionOrThrow({
        permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_READ_QUOTES,
        resourceId: query.filter.sellerWorkspaceId,
        subjectId: user.id,
      });
    }

    return this.quotesModel.listQuotes(query);
  }

  async getQuoteById(id: string, user: UserAuthPayload) {
    await this.authZ.quote.hasPermissionOrThrow({
      permission: ERP_QUOTE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: id,
      subjectId: user.id,
    });

    return this.quotesModel.getQuoteById(id);
  }

  async batchGetQuotesByIntakeFormSubmissionIds(
    submissionIds: readonly string[],
    user: UserAuthPayload,
  ) {
    // Get all quotes by submission IDs
    const quotes =
      await this.quotesModel.getQuotesByIntakeFormSubmissionIds(submissionIds);

    // Filter out quotes the user doesn't have permission to read
    const results = await Promise.all(
      quotes.map(async (quote) => {
        if (!quote) return null;

        const hasPermission = await this.authZ.quote.hasPermission({
          permission: ERP_QUOTE_SUBJECT_PERMISSIONS.USER_READ,
          resourceId: quote.id,
          subjectId: user.id,
        });

        return hasPermission ? quote : null;
      }),
    );

    return results;
  }

  async updateQuoteStatus(
    id: string,
    status: QuoteStatus,
    user: UserAuthPayload,
  ) {
    await this.authZ.quote.hasPermissionOrThrow({
      permission: ERP_QUOTE_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    return this.quotesModel.updateQuoteStatus(id, status, user.id);
  }

  async updateQuote(
    id: string,
    updates: Partial<{
      sellersBuyerContactId: string;
      sellersProjectId: string;
      status: QuoteStatus;
      currentRevisionId: string;
      validUntil: Date;
    }>,
    user: UserAuthPayload,
  ) {
    await this.authZ.quote.hasPermissionOrThrow({
      permission: ERP_QUOTE_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    return this.quotesModel.updateQuote(id, updates, user.id);
  }

  /**************************
   * QUOTE REVISIONS METHODS
   ************************/

  async createQuoteRevision(
    input: Omit<CreateQuoteRevisionInput, 'createdBy' | 'updatedBy'>,
    user: UserAuthPayload,
  ) {
    await this.authZ.quote.hasPermissionOrThrow({
      permission: ERP_QUOTE_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: input.quoteId,
      subjectId: user.id,
    });

    // Process line items: fetch prices and calculate subtotals
    const lineItemsWithSubtotals = await this.processLineItemsWithSubtotals(
      input.lineItems,
      user,
    );

    return this.quoteRevisionsModel.withTransaction(async (session) => {
      const revision = await this.quoteRevisionsModel.createQuoteRevision(
        {
          ...input,
          lineItems: lineItemsWithSubtotals,
          createdBy: user.id,
          updatedBy: user.id,
        },
        session,
      );

      // Write price relations to SpiceDB so buyers can read prices
      // Filter out undefined priceIds (unpriced line items)
      const uniquePriceIds = new Set(
        lineItemsWithSubtotals
          .map((item) => item.sellersPriceId)
          .filter((priceId): priceId is string => !!priceId),
      );

      if (uniquePriceIds.size > 0) {
        const priceRelations = Array.from(uniquePriceIds).map((priceId) => ({
          subjectId: input.quoteId,
          relation: ERP_PRICEBOOK_PRICE_SUBJECT_RELATIONS.QUOTE_QUOTE,
          resourceId: priceId,
        }));

        await this.authZ.priceBookPrice.writeRelations(priceRelations);
      }

      return revision;
    });
  }

  async getQuoteRevisionById(id: string, user: UserAuthPayload) {
    const revision = await this.quoteRevisionsModel.getQuoteRevisionById(id);
    if (!revision) {
      return null;
    }

    await this.authZ.quote.hasPermissionOrThrow({
      permission: ERP_QUOTE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: revision.quoteId,
      subjectId: user.id,
    });

    return revision;
  }

  async updateQuoteRevision(
    id: string,
    updates: Partial<{
      validUntil: Date;
      lineItems: any[];
    }>,
    user: UserAuthPayload,
  ) {
    // Get the revision to check authorization and status
    const revision = await this.quoteRevisionsModel.getQuoteRevisionById(id);
    if (!revision) {
      return null;
    }

    // Check if user has permission to update the quote
    await this.authZ.quote.hasPermissionOrThrow({
      permission: ERP_QUOTE_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: revision.quoteId,
      subjectId: user.id,
    });

    // Check if revision is editable (status must be DRAFT)
    if (revision.status !== 'DRAFT') {
      throw new Error(
        'Cannot update a revision that has been sent. Create a new revision instead.',
      );
    }

    // Process line items: fetch prices and calculate subtotals if provided
    let lineItemsWithSubtotals:
      | Awaited<ReturnType<typeof this.processLineItemsWithSubtotals>>
      | undefined;
    if (updates.lineItems) {
      // Preserve intakeFormSubmissionLineItemId from existing line items
      // when not provided in the update (matched by line item id)
      const existingLineItemsById = new Map(
        revision.lineItems.map((item) => [item.id, item]),
      );

      const lineItemsWithPreservedTracking = updates.lineItems.map((item) => {
        // If the item has an id and matches an existing item, preserve the tracking field
        if (item.id && existingLineItemsById.has(item.id)) {
          const existingItem = existingLineItemsById.get(item.id)!;
          return {
            ...item,
            // Preserve intakeFormSubmissionLineItemId if not explicitly provided
            intakeFormSubmissionLineItemId:
              item.intakeFormSubmissionLineItemId ||
              existingItem.intakeFormSubmissionLineItemId,
          };
        }
        // For new items, ensure null is converted to undefined for Zod validation
        return {
          ...item,
          intakeFormSubmissionLineItemId:
            item.intakeFormSubmissionLineItemId || undefined,
        };
      });

      lineItemsWithSubtotals = await this.processLineItemsWithSubtotals(
        lineItemsWithPreservedTracking,
        user,
      );
    }

    return this.quoteRevisionsModel.withTransaction(async (session) => {
      const updatedRevision =
        await this.quoteRevisionsModel.updateQuoteRevision(
          id,
          {
            ...updates,
            ...(lineItemsWithSubtotals && {
              lineItems: lineItemsWithSubtotals,
            }),
          },
          user.id,
          session,
        );

      // Write price relations to SpiceDB if line items were updated
      // Filter out undefined priceIds (unpriced line items)
      if (lineItemsWithSubtotals) {
        const uniquePriceIds = new Set(
          lineItemsWithSubtotals
            .map((item) => item.sellersPriceId)
            .filter((priceId): priceId is string => !!priceId),
        );

        if (uniquePriceIds.size > 0) {
          const priceRelations = Array.from(uniquePriceIds).map((priceId) => ({
            subjectId: revision.quoteId,
            relation: ERP_PRICEBOOK_PRICE_SUBJECT_RELATIONS.QUOTE_QUOTE,
            resourceId: priceId,
          }));

          await this.authZ.priceBookPrice.writeRelations(priceRelations);
        }
      }

      return updatedRevision;
    });
  }

  async sendQuote(
    quoteId: string,
    revisionId: string,
    buyerUserId: string,
    user: UserAuthPayload,
  ) {
    // Check permission to update the quote
    await this.authZ.quote.hasPermissionOrThrow({
      permission: ERP_QUOTE_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: quoteId,
      subjectId: user.id,
    });

    // Get the quote
    const quote = await this.quotesModel.getQuoteById(quoteId);
    if (!quote) {
      throw new Error('Quote not found');
    }

    // Get the revision
    const revision =
      await this.quoteRevisionsModel.getQuoteRevisionById(revisionId);
    if (!revision) {
      throw new Error('Revision not found');
    }

    // Verify revision belongs to the quote
    if (revision.quoteId !== quoteId) {
      throw new Error('Revision does not belong to this quote');
    }

    // Validate all line items have prices (subtotalInCents > 0)
    const hasInvalidLineItems = revision.lineItems.some(
      (item) => !item.sellersPriceId,
    );
    if (hasInvalidLineItems) {
      throw new Error(
        'All line items must have valid prices before sending the quote',
      );
    }

    // Use a transaction to update both revision status and quote
    return this.quotesModel.withTransaction(async (session) => {
      // Update revision status to SENT
      await this.quoteRevisionsModel.updateQuoteRevision(
        revisionId,
        { status: 'SENT' },
        user.id,
        session,
      );

      // Determine new quote status
      // If this is the first time sending (no previous currentRevisionId), set to SENT
      // If there was already a revision sent, this is a revision, so don't change status
      const hadPreviousRevision = !!quote.currentRevisionId;
      const newQuoteStatus = hadPreviousRevision ? quote.status : 'ACTIVE';

      // Update quote with currentRevisionId, status, and buyerUserId
      const updatedQuote = await this.quotesModel.updateQuote(
        quoteId,
        {
          currentRevisionId: revisionId,
          status: newQuoteStatus,
          buyerUserId,
        },
        user.id,
        session,
      );

      if (!updatedQuote) {
        throw new Error('Failed to update quote');
      }

      // Write buyer relation to SpiceDB so the buyer user can view the quote
      await this.authZ.quote.writeRelation({
        subjectId: buyerUserId,
        relation: ERP_QUOTE_SUBJECT_RELATIONS.USER_BUYER,
        resourceId: quoteId,
      });

      return updatedQuote;
    });
  }

  async acceptQuote(
    quoteId: string,
    user: UserAuthPayload,
    approvalConfirmation?: string,
    signatureS3Key?: string,
    buyerAcceptedFullLegalName?: string,
  ) {
    // Get the quote with full details
    const quote = await this.quotesModel.getQuoteById(quoteId);
    if (!quote) {
      throw new Error('Quote not found');
    }

    // Authorization: verify user has accept permission
    await this.authZ.quote.hasPermissionOrThrow({
      permission: ERP_QUOTE_SUBJECT_PERMISSIONS.USER_ACCEPT,
      resourceId: quoteId,
      subjectId: user.id,
    });

    // Determine if user is buyer (for conditional approval confirmation requirement)
    const isBuyerUser = user.id === quote.buyerUserId;
    const hasBuyerWorkspacePermission = quote.buyerWorkspaceId
      ? await this.authZ.workspace.hasPermission({
          permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
          resourceId: quote.buyerWorkspaceId,
          subjectId: user.id,
        })
      : false;

    // If seller is accepting on behalf of buyer, approvalConfirmation is required
    if (!isBuyerUser && !hasBuyerWorkspacePermission) {
      if (!approvalConfirmation) {
        throw new Error(
          'approvalConfirmation is required when seller accepts on behalf of buyer',
        );
      }
    }

    // Validate quote status is ACTIVE
    if (quote.status !== 'ACTIVE') {
      throw new Error(`Cannot accept quote with status: ${quote.status}`);
    }

    // Get current revision
    if (!quote.currentRevisionId) {
      throw new Error('Quote has no current revision');
    }

    const revision = await this.quoteRevisionsModel.getQuoteRevisionById(
      quote.currentRevisionId,
    );
    if (!revision) {
      throw new Error('Current revision not found');
    }

    // Validate revision status is SENT
    if (revision.status !== 'SENT') {
      throw new Error(
        `Cannot accept quote with revision status: ${revision.status}`,
      );
    }

    // Check if quote is expired
    if (revision.validUntil && new Date() > revision.validUntil) {
      throw new Error('Quote has expired');
    }

    // Use transaction to perform all operations atomically
    return this.quotesModel.withTransaction(async (session) => {
      // 1. Update quote status to ACCEPTED (with approval confirmation and signature if provided)
      const updatedQuote = await this.quotesModel.updateQuote(
        quoteId,
        {
          status: 'ACCEPTED',
          ...(approvalConfirmation && { approvalConfirmation }),
          ...(signatureS3Key && { signatureS3Key }),
          ...(buyerAcceptedFullLegalName && { buyerAcceptedFullLegalName }),
        },
        user.id,
        session,
      );

      if (!updatedQuote) {
        throw new Error('Failed to update quote status');
      }

      // 2. If rfqId exists, update RFQ status to ACCEPTED
      if (quote.rfqId) {
        await this.rfqsModel.updateRFQ(
          quote.rfqId,
          { status: 'ACCEPTED' },
          user.id,
        );

        // 3. Reject other quotes for the same RFQ
        const quotesForRFQ = await this.quotesModel.listQuotes({
          filter: { rfqId: quote.rfqId, status: 'ACTIVE' },
        });

        for (const otherQuote of quotesForRFQ) {
          if (otherQuote.id !== quote.id) {
            await this.quotesModel.updateQuote(
              otherQuote.id,
              { status: 'REJECTED' },
              user.id,
              session,
            );
          }
        }
      }

      return updatedQuote;
    });
  }

  async rejectQuote(quoteId: string, user: UserAuthPayload) {
    // Get the quote
    const quote = await this.quotesModel.getQuoteById(quoteId);
    if (!quote) {
      throw new Error('Quote not found');
    }

    // Validate quote status is ACTIVE
    if (quote.status !== 'ACTIVE') {
      throw new Error(`Cannot reject quote with status: ${quote.status}`);
    }

    // Authorization: verify user has reject permission
    await this.authZ.quote.hasPermissionOrThrow({
      permission: ERP_QUOTE_SUBJECT_PERMISSIONS.USER_REJECT,
      resourceId: quoteId,
      subjectId: user.id,
    });

    // Update quote status to REJECTED
    const updatedQuote = await this.quotesModel.updateQuote(
      quoteId,
      { status: 'REJECTED' },
      user.id,
    );

    if (!updatedQuote) {
      throw new Error('Failed to update quote status');
    }

    return updatedQuote;
  }

  /**************************
   * RFQ METHODS
   ************************/
  async createRFQ(
    input: Omit<CreateRFQInput, 'createdBy' | 'updatedBy'>,
    user: UserAuthPayload,
  ) {
    // first check can they create rfqs in the buyersWorkspaceId
    const hasPermission = await this.authZ.workspace.hasPermission({
      subjectId: user.id,
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_RFQS,
      resourceId: input.buyersWorkspaceId,
    });

    if (!hasPermission) {
      throw new Error(
        `User ${user.id} does not have permission to create RFQs in workspace ${input.buyersWorkspaceId}`,
      );
    }

    return this.rfqsModel.withTransaction(async (session) => {
      const rfq = await this.rfqsModel.createRFQ(
        {
          ...input,
          createdBy: user.id,
          updatedBy: user.id,
        },
        session,
      );

      await this.authZ.rfq.writeRelations([
        {
          subjectId: rfq.buyersWorkspaceId,
          relation: ERP_RFQ_SUBJECT_RELATIONS.WORKSPACE_BUYERS_WORKSPACE,
          resourceId: rfq.id,
        },
        ...rfq.invitedSellerUserIds.map((sellerUserId) => ({
          subjectId: sellerUserId,
          relation: ERP_RFQ_SUBJECT_RELATIONS.USER_INVITED_SELLER,
          resourceId: rfq.id,
        })),
      ]);

      return rfq;
    });
  }

  async updateRFQ(id: string, input: UpdateRFQInput, user: UserAuthPayload) {
    const hasPermission = await this.authZ.rfq.hasPermission({
      permission: ERP_RFQ_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error(
        `User ${user.id} does not have permission to update RFQ ${id}`,
      );
    }

    // Check if invitedSellerUserIds are being updated (sellers have changed)
    if (input.invitedSellerUserIds !== undefined) {
      // Fetch the existing RFQ to get current seller user IDs
      const existingRFQ = await this.rfqsModel.getRFQById(id);
      if (!existingRFQ) {
        throw new Error('RFQ not found');
      }

      // Reset SpiceDB relations: remove all existing seller relations
      for (const sellerUserId of existingRFQ.invitedSellerUserIds) {
        await this.authZ.rfq.deleteRelationships({
          subjectId: sellerUserId,
          relation: ERP_RFQ_SUBJECT_RELATIONS.USER_INVITED_SELLER,
          resourceId: id,
        });
      }

      // Add new seller relations
      const newSellerRelations = input.invitedSellerUserIds.map(
        (sellerUserId) => ({
          subjectId: sellerUserId,
          relation: ERP_RFQ_SUBJECT_RELATIONS.USER_INVITED_SELLER,
          resourceId: id,
        }),
      );

      if (newSellerRelations.length > 0) {
        await this.authZ.rfq.writeRelations(newSellerRelations);
      }
    }

    return this.rfqsModel.updateRFQ(id, input, user.id);
  }

  async getRFQById(id: string, user: UserAuthPayload) {
    const hasPermission = await this.authZ.rfq.hasPermission({
      permission: ERP_RFQ_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: id,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error(
        `User ${user.id} does not have permission to read RFQ ${id}`,
      );
    }

    return this.rfqsModel.getRFQById(id);
  }

  async listRFQs(
    query: {
      filter: ListRFQsQuery['filter'];
      page: ListRFQsQuery['page'];
    },
    user: UserAuthPayload,
  ) {
    if (!query.filter.buyersWorkspaceId) {
      throw new Error('buyersWorkspaceId is required');
    }

    await this.authZ.workspace.hasPermissionOrThrow({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_READ_RFQS,
      resourceId: query.filter.buyersWorkspaceId,
      subjectId: user.id,
    });

    const page = {
      size: query?.page?.size ?? 10,
      number: query?.page?.number ?? 1,
    };

    const [items, count] = await Promise.all([
      this.rfqsModel.listRFQs({
        filter: query.filter,
        page,
      }),
      this.rfqsModel.countRFQs(query.filter),
    ]);

    return {
      items,
      page: {
        number: page.number,
        size: items.length,
        totalItems: count,
        totalPages: Math.ceil(count / page.size) || 0,
      },
    };
  }
  /**************************
   * HELPER METHODS
   ************************/
  /**
   * Calculate subtotal for a line item by fetching price from catalog.
   * Returns 0 if no priceId is provided (unpriced line item).
   */
  private async calculateLineItemSubtotal(
    lineItem: any, // QuoteRevisionLineItem with optional sellersPriceId
    user: UserAuthPayload,
  ): Promise<number> {
    // If no priceId provided, return 0 (unpriced line item)
    if (!lineItem.sellersPriceId) {
      return 0;
    }

    // Fetch the price from the catalog
    const price = await this.pricesService.getPriceById(
      lineItem.sellersPriceId,
      user,
    );

    if (!price) {
      throw new Error(`Price not found: ${lineItem.sellersPriceId}`);
    }

    switch (lineItem.type) {
      case 'RENTAL':
        if (price.priceType !== 'RENTAL') {
          throw new Error(
            `Expected RENTAL price for RENTAL line item, got ${price.priceType}`,
          );
        }
        return this.calculateRentalSubtotal(lineItem, price);
      case 'SERVICE':
        // Service prices don't exist in the price catalog currently
        // For now, we'll throw an error - this should be handled differently
        throw new Error(
          'SERVICE line items are not yet supported with price references',
        );
      case 'SALE':
        if (price.priceType !== 'SALE') {
          throw new Error(
            `Expected SALE price for SALE line item, got ${price.priceType}`,
          );
        }
        return this.calculateSaleSubtotal(lineItem, price);
      default:
        throw new Error(`Unknown line item type: ${(lineItem as any).type}`);
    }
  }

  /**
   * Calculate subtotal for rental line items using price engine
   */
  private calculateRentalSubtotal(
    rental: {
      rentalStartDate: Date;
      rentalEndDate: Date;
      quantity: number;
    },
    price: any, // RentalPrice from catalog
  ): number {
    const result = this.priceEngineService.calculateOptimalCost({
      startDate: rental.rentalStartDate,
      endDate: rental.rentalEndDate,
      pricePer1DayInCents: price.pricePerDayInCents,
      pricePer7DaysInCents: price.pricePerWeekInCents,
      pricePer28DaysInCents: price.pricePerMonthInCents,
    });
    return Math.round(result.costInCents * rental.quantity);
  }

  /**
   * Calculate subtotal for service line items
   */
  private calculateServiceSubtotal(
    service: {
      quantity: number;
    },
    price: any, // ServicePrice from catalog (not implemented yet)
  ): number {
    // Service prices don't exist in the system yet
    throw new Error('SERVICE pricing not implemented');
  }

  /**
   * Calculate subtotal for sale line items
   */
  private calculateSaleSubtotal(
    sale: {
      quantity: number;
    },
    price: any, // SalePrice from catalog
  ): number {
    // SalePrice has unitCostInCents field
    return Math.round(price.unitCostInCents * sale.quantity);
  }

  /**
   * Process line items array and inject calculated subtotals by fetching prices.
   * Line items without sellersPriceId will have subtotalInCents = 0.
   */
  private async processLineItemsWithSubtotals<
    T extends { type: string; sellersPriceId?: string },
  >(
    lineItems: T[],
    user: UserAuthPayload,
  ): Promise<(T & { subtotalInCents: number })[]> {
    return Promise.all(
      lineItems.map(async (item) => ({
        ...item,
        subtotalInCents: await this.calculateLineItemSubtotal(item, user),
      })),
    );
  }
}

export const createQuotingService = (config: {
  envConfig: EnvConfig;
  mongoClient: MongoClient;
  priceEngineService: PriceEngineService;
  pricesService: PricesService;
  authZ: AuthZ;
}) => {
  const quotesModel = createQuotesModel(config);
  const quoteRevisionsModel = createQuoteRevisionsModel(config);
  const rfqsModel = createRFQsModel(config);
  const quotingService = new QuotingService({
    quotesModel,
    quoteRevisionsModel,
    rfqsModel,
    envConfig: config.envConfig,
    priceEngineService: config.priceEngineService,
    pricesService: config.pricesService,
    authZ: config.authZ,
  });

  return quotingService;
};
