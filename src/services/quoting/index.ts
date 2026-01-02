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
import { LineItemsService } from '../line_items';
import { type LineItemConstraint } from '../line_items/model';
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
  private lineItemsService: LineItemsService;
  private authZ: AuthZ;

  constructor(config: {
    quotesModel: QuotesModel;
    quoteRevisionsModel: QuoteRevisionsModel;
    rfqsModel: RFQsModel;
    envConfig: EnvConfig;
    priceEngineService: PriceEngineService;
    pricesService: PricesService;
    lineItemsService: LineItemsService;
    authZ: AuthZ;
  }) {
    this.quotesModel = config.quotesModel;
    this.quoteRevisionsModel = config.quoteRevisionsModel;
    this.rfqsModel = config.rfqsModel;
    this.envConfig = config.envConfig;
    this.priceEngineService = config.priceEngineService;
    this.pricesService = config.pricesService;
    this.lineItemsService = config.lineItemsService;
    this.authZ = config.authZ;
  }

  private mapQuoteLineItemConstraintsToCanonical(
    constraints: Array<{ strength: string; payload?: unknown } | null> | null | undefined,
  ): LineItemConstraint[] | null {
    if (!constraints) return null;
    const mapped: LineItemConstraint[] = [];
    for (const constraint of constraints) {
      if (!constraint?.payload) continue;
      const strength = constraint.strength as
        | 'REQUIRED'
        | 'PREFERRED'
        | 'EXCLUDED';
      mapped.push({
        kind: 'OTHER',
        strength,
        data: { note: JSON.stringify(constraint.payload) },
      });
    }
    return mapped.length ? mapped : null;
  }

  private async syncQuoteRevisionLineItemsToCanonicalStore(
    params: {
      quoteId: string;
      revisionId: string;
      user: UserAuthPayload;
    },
  ) {
    const quote = await this.quotesModel.getQuoteById(params.quoteId);
    if (!quote) return;

    // Ensure caller can read the quote (buyers may read; writers should have update).
    await this.authZ.quote.hasPermissionOrThrow({
      permission: ERP_QUOTE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: params.quoteId,
      subjectId: params.user.id,
    });

    const revision = await this.quoteRevisionsModel.getQuoteRevisionById(
      params.revisionId,
    );
    if (!revision) return;

    if (revision.quoteId !== params.quoteId) {
      throw new Error('Quote revision does not belong to quote');
    }

    const workspaceId = quote.sellerWorkspaceId;

    const existing = await this.lineItemsService.listLineItemsByDocumentRef(
      workspaceId,
      {
        type: 'QUOTE_REVISION',
        id: params.quoteId,
        revisionId: params.revisionId,
      },
      params.user,
    );
    const existingByQuoteRevisionLineItemId = new Map(
      existing
        .filter((item) => item.quoteRevisionLineItemId)
        .map((item) => [item.quoteRevisionLineItemId as string, item]),
    );

    const seenQuoteRevisionLineItemIds = new Set<string>();

    for (const item of revision.lineItems) {
      seenQuoteRevisionLineItemIds.add(item.id);
      const mappedConstraints = this.mapQuoteLineItemConstraintsToCanonical(
        item.constraints as any,
      );

      const productRef = item.productRef
        ? {
            kind: item.productRef.kind as any,
            productId: item.productRef.productId,
          }
        : 'pimCategoryId' in item && item.pimCategoryId
          ? { kind: 'PIM_CATEGORY' as const, productId: item.pimCategoryId }
          : null;

      const timeWindow =
        item.type === 'RENTAL'
          ? { startAt: item.rentalStartDate, endAt: item.rentalEndDate }
          : item.timeWindow
            ? {
                startAt: item.timeWindow.startAt ?? null,
                endAt: item.timeWindow.endAt ?? null,
              }
            : null;

      const pricingRef =
        (item.pricingRef as any) ??
        (item.sellersPriceId ? { priceId: item.sellersPriceId } : null);

      const delivery =
        item.deliveryMethod || item.deliveryLocation || item.deliveryNotes
          ? {
              method: item.deliveryMethod ?? null,
              location: item.deliveryLocation ?? null,
              notes: item.deliveryNotes ?? null,
            }
          : null;

      const baseUpdates = {
        type: item.type as any,
        description: item.description,
        quantity: String(item.quantity),
        unitCode: item.unitCode ?? null,
        productRef,
        timeWindow,
        placeRef: item.placeRef ?? null,
        constraints: mappedConstraints,
        inputs: (item.inputs as any) ?? null,
        pricingRef,
        pricingSpecSnapshot: (item.pricingSpecSnapshot as any) ?? null,
        rateInCentsSnapshot: (item.rateInCentsSnapshot as any) ?? null,
        subtotalInCents: (item.subtotalInCents as any) ?? null,
        delivery,
        notes: item.notes ?? null,
        targetSelectors:
          item.type === 'SERVICE' ? item.targetSelectors ?? null : null,
        quoteRevisionLineItemId: item.id,
        intakeFormSubmissionLineItemId:
          item.intakeFormSubmissionLineItemId ?? null,
      };

      const existingItem = existingByQuoteRevisionLineItemId.get(item.id) ?? null;
      if (existingItem) {
        await this.lineItemsService.updateLineItem(
          existingItem.id,
          {
            ...baseUpdates,
          },
          params.user,
        );
      } else {
        await this.lineItemsService.createLineItem(
          {
            workspaceId,
            documentRef: {
              type: 'QUOTE_REVISION',
              id: params.quoteId,
              revisionId: params.revisionId,
            },
            ...baseUpdates,
          },
          params.user,
        );
      }
    }

    const toDelete = existing.filter(
      (item) =>
        item.quoteRevisionLineItemId &&
        !seenQuoteRevisionLineItemIds.has(item.quoteRevisionLineItemId),
    );
    for (const item of toDelete) {
      await this.lineItemsService.softDeleteLineItem(item.id, params.user);
    }
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

    const revision = await this.quoteRevisionsModel.withTransaction(
      async (session) => {
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
      },
    );

    await this.syncQuoteRevisionLineItemsToCanonicalStore({
      quoteId: input.quoteId,
      revisionId: revision.id,
      user,
    });

    return revision;
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

    const updatedRevision = await this.quoteRevisionsModel.withTransaction(
      async (session) => {
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
      },
    );

    if (updatedRevision) {
      await this.syncQuoteRevisionLineItemsToCanonicalStore({
        quoteId: updatedRevision.quoteId,
        revisionId: updatedRevision.id,
        user,
      });
    }

    return updatedRevision;
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
    const canonicalLineItems = await this.lineItemsService.listLineItemsByDocumentRef(
      quote.sellerWorkspaceId,
      { type: 'QUOTE_REVISION', id: quoteId, revisionId },
      user,
    );

    const isPriced = (item: {
      pricingRef?: { priceId?: string | null } | null;
      pricingSpecSnapshot?: unknown;
      subtotalInCents?: number | null;
    }) =>
      Boolean(item.pricingRef?.priceId) ||
      Boolean(item.pricingSpecSnapshot && item.subtotalInCents !== null && item.subtotalInCents !== undefined);

    const hasInvalidLineItems =
      canonicalLineItems.length > 0
        ? canonicalLineItems.some((item) => !isPriced(item))
        : revision.lineItems.some((item) => !item.sellersPriceId);

    if (hasInvalidLineItems) {
      throw new Error('All line items must have valid prices before sending the quote');
    }

    // Ensure any referenced prices are readable by the buyer via quote->price relations.
    const priceIdsToAuthorize = new Set(
      canonicalLineItems
        .map((item) => item.pricingRef?.priceId)
        .filter((priceId): priceId is string => Boolean(priceId)),
    );
    if (priceIdsToAuthorize.size > 0) {
      await this.authZ.priceBookPrice.writeRelations(
        Array.from(priceIdsToAuthorize).map((priceId) => ({
          subjectId: quoteId,
          relation: ERP_PRICEBOOK_PRICE_SUBJECT_RELATIONS.QUOTE_QUOTE,
          resourceId: priceId,
        })),
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

    const sellerAcceptingOnBehalfOfBuyer = !isBuyerUser && !hasBuyerWorkspacePermission;
    const canAcceptDraftRevision =
      revision.status === 'DRAFT' && sellerAcceptingOnBehalfOfBuyer && !!approvalConfirmation;

    // Validate revision status is SENT (or seller-confirmed DRAFT for off-platform approvals)
    if (revision.status !== 'SENT' && !canAcceptDraftRevision) {
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
      // If the seller is accepting a DRAFT revision on behalf of an off-platform buyer,
      // promote the revision to SENT so the accepted contract has a stable, non-draft marker.
      if (canAcceptDraftRevision) {
        await this.quoteRevisionsModel.updateQuoteRevision(
          revision.id,
          { status: 'SENT' },
          user.id,
          session,
        );
      }

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
   * Returns subtotal plus optional pricing snapshots; subtotal is 0 if no priceId
   * is provided (unpriced line item).
   */
  private async calculateLineItemSubtotal(
    lineItem: any, // QuoteRevisionLineItem with optional sellersPriceId
    user: UserAuthPayload,
  ): Promise<{
    subtotalInCents: number;
    unitCodeOverride?: string;
    pricingSpecSnapshot?:
      | {
          kind: 'UNIT' | 'TIME';
          unitCode: string;
          rateInCents: number;
        }
      | {
          kind: 'RENTAL_RATE_TABLE';
          pricePerDayInCents: number;
          pricePerWeekInCents: number;
          pricePerMonthInCents: number;
        };
    rateInCentsSnapshot?: number;
  }> {
    // If no priceId provided, return 0 (unpriced line item)
    if (!lineItem.sellersPriceId) {
      return { subtotalInCents: 0 };
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
        return {
          subtotalInCents: this.calculateRentalSubtotal(lineItem, price),
          pricingSpecSnapshot: {
            kind: 'RENTAL_RATE_TABLE',
            pricePerDayInCents: price.pricePerDayInCents,
            pricePerWeekInCents: price.pricePerWeekInCents,
            pricePerMonthInCents: price.pricePerMonthInCents,
          },
        };
      case 'SERVICE':
        if (price.priceType !== 'SERVICE') {
          throw new Error(
            `Expected SERVICE price for SERVICE line item, got ${price.priceType}`,
          );
        }
        if (
          price.pricingSpec?.kind === 'UNIT' ||
          price.pricingSpec?.kind === 'TIME'
        ) {
          // Service unitCode is derived from the selected price (not user-editable).
          // We return it so the stored quote revision line item stays consistent and
          // downstream consumers don't hit mismatches.
          if (!price.pricingSpec.unitCode) {
            throw new Error('Service price pricingSpec is missing unitCode');
          }
        }
        return {
          subtotalInCents: this.calculateServiceSubtotal(lineItem, price),
          unitCodeOverride:
            price.pricingSpec?.kind === 'UNIT' || price.pricingSpec?.kind === 'TIME'
              ? price.pricingSpec.unitCode
              : undefined,
          pricingSpecSnapshot: price.pricingSpec,
          rateInCentsSnapshot: price.pricingSpec?.rateInCents,
        };
      case 'SALE':
        if (price.priceType !== 'SALE') {
          throw new Error(
            `Expected SALE price for SALE line item, got ${price.priceType}`,
          );
        }
        return {
          subtotalInCents: this.calculateSaleSubtotal(lineItem, price),
          rateInCentsSnapshot: price.unitCostInCents,
        };
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
    if (!price.pricingSpec) {
      throw new Error('Service price is missing pricingSpec');
    }

    const pricingSpec = price.pricingSpec;

    if (pricingSpec.kind === 'UNIT' || pricingSpec.kind === 'TIME') {
      return Math.round(pricingSpec.rateInCents * service.quantity);
    }

    throw new Error(
      `Unsupported pricingSpec kind for service price: ${pricingSpec.kind}`,
    );
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
      lineItems.map(async (item) => {
        const result = await this.calculateLineItemSubtotal(item, user);
        return {
          ...item,
          ...(result.unitCodeOverride ? { unitCode: result.unitCodeOverride } : {}),
          subtotalInCents: result.subtotalInCents,
          ...(result.pricingSpecSnapshot
            ? { pricingSpecSnapshot: result.pricingSpecSnapshot }
            : {}),
          ...(result.rateInCentsSnapshot !== undefined
            ? { rateInCentsSnapshot: result.rateInCentsSnapshot }
            : {}),
        };
      }),
    );
  }
}

export const createQuotingService = (config: {
  envConfig: EnvConfig;
  mongoClient: MongoClient;
  priceEngineService: PriceEngineService;
  pricesService: PricesService;
  lineItemsService: LineItemsService;
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
    lineItemsService: config.lineItemsService,
    authZ: config.authZ,
  });

  return quotingService;
};
