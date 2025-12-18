import {
  objectType,
  inputObjectType,
  enumType,
  nonNull,
  arg,
  stringArg,
  extendType,
  unionType,
} from 'nexus';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GraphQLContext } from '../context';
import { logger } from '../../lib/logger';
import type {
  QuoteRevisionLineItem as QuoteRevisionLineItemType,
  QuoteRevisionServiceLineItem as QuoteRevisionServiceLineItemType,
  QuoteRevisionRentalLineItem as QuoteRevisionRentalLineItemType,
  QuoteRevisionSaleLineItem as QuoteRevisionSaleLineItemType,
  RFQLineItemType as RFQLineItemUnion,
  RFQServiceLineItem as RFQServiceLineItemType,
  RFQRentalLineItem as RFQRentalLineItemType,
  RFQSaleLineItem as RFQSaleLineItemType,
} from '../../services/quoting';
import { dropNullishKeys } from '../utils';
import { RentalSalesOrderLineItemDoc } from '../../services/sales_orders';
import { RentalPurchaseOrderLineItemDoc } from '../../services/purchase_orders';

// Enums
export const QuoteStatus = enumType({
  name: 'QuoteStatus',
  members: ['ACTIVE', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
});

export const RevisionStatus = enumType({
  name: 'RevisionStatus',
  members: ['DRAFT', 'SENT'],
});

export const RFQStatus = enumType({
  name: 'RFQStatus',
  members: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
});

export const QuoteLineItemType = enumType({
  name: 'QuoteLineItemType',
  members: ['RENTAL', 'SALE', 'SERVICE'],
});

export const QuoteLineItemDeliveryMethod = enumType({
  name: 'QuoteLineItemDeliveryMethod',
  members: ['PICKUP', 'DELIVERY'],
});

// Quote Object Type
export const Quote = objectType({
  name: 'Quote',
  sourceType: {
    module: require.resolve('../../services/quoting'),
    export: 'Quote',
  },
  definition(t) {
    t.nonNull.string('id');

    // Seller info
    t.nonNull.string('sellerWorkspaceId');
    t.nonNull.string('sellersBuyerContactId');
    t.nonNull.string('sellersProjectId');

    // Buyer info
    t.string('buyerWorkspaceId');
    t.string('buyersSellerContactId');
    t.string('buyersProjectId');
    t.string('buyerUserId');
    t.string('rfqId');

    // Intake form tracking
    t.string('intakeFormSubmissionId');
    t.field('intakeFormSubmission', {
      type: 'IntakeFormSubmission',
      description: 'The intake form submission this quote was generated from',
      resolve: async (quote, _, ctx) => {
        if (!quote.intakeFormSubmissionId) return null;
        return ctx.services.intakeFormService.getIntakeFormSubmissionById(
          quote.intakeFormSubmissionId,
          ctx.user,
        );
      },
    });

    // Metadata
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.nonNull.field('updatedAt', { type: 'DateTime' });
    t.nonNull.string('createdBy');
    t.nonNull.string('updatedBy');

    // Status
    t.nonNull.field('status', { type: QuoteStatus });
    t.string('currentRevisionId');
    t.field('validUntil', { type: 'DateTime' });

    // Signature and acceptance data
    t.string('buyerAcceptedFullLegalName', {
      description:
        "Buyer's full legal name as provided when accepting the quote",
    });
    t.string('signatureUrl', {
      description:
        'Temporary signed URL to view the signature (valid for 15 minutes)',
      async resolve(quote, _args, ctx) {
        if (!quote.signatureS3Key) return null;

        try {
          const s3Client = new S3Client({
            region: ctx.envConfig.FILE_SERVICE_REGION || 'us-west-2',
            credentials: {
              accessKeyId: ctx.envConfig.FILE_SERVICE_KEY,
              secretAccessKey: ctx.envConfig.FILE_SERVICE_SECRET,
            },
            ...(ctx.envConfig.FILE_SERVICE_ENDPOINT && {
              endpoint: ctx.envConfig.FILE_SERVICE_ENDPOINT,
              forcePathStyle: true,
            }),
          });

          const command = new GetObjectCommand({
            Bucket: ctx.envConfig.FILE_SERVICE_BUCKET,
            Key: quote.signatureS3Key,
          });

          return await getSignedUrl(s3Client, command, { expiresIn: 900 });
        } catch (error) {
          logger.error(
            { error, quoteId: quote.id },
            'Failed to generate signature URL',
          );
          return null;
        }
      },
    });

    // Resolved fields
    t.field('sellersBuyerContact', {
      type: 'Contact',
      async resolve(quote, _args, ctx) {
        if (!quote.sellersBuyerContactId) return null;
        return ctx.dataloaders.contacts.getContactsById.load(
          quote.sellersBuyerContactId,
        );
      },
    });

    t.field('buyersSellerContact', {
      type: 'Contact',
      async resolve(quote, _args, ctx) {
        if (!quote.buyersSellerContactId) return null;
        return ctx.dataloaders.contacts.getContactsById.load(
          quote.buyersSellerContactId,
        );
      },
    });

    t.field('sellersProject', {
      type: 'Project',
      async resolve(quote, _args, ctx) {
        if (!quote.sellersProjectId) return null;
        return ctx.dataloaders.projects.getProjectsById.load(
          quote.sellersProjectId,
        );
      },
    });

    t.field('buyersProject', {
      type: 'Project',
      async resolve(quote, _args, ctx) {
        if (!quote.buyersProjectId) return null;
        return ctx.dataloaders.projects.getProjectsById.load(
          quote.buyersProjectId,
        );
      },
    });

    t.field('createdByUser', {
      type: 'User',
      async resolve(quote, _args, ctx) {
        if (!quote.createdBy) return null;
        return ctx.dataloaders.users.getUsersById.load(quote.createdBy);
      },
    });

    t.field('updatedByUser', {
      type: 'User',
      async resolve(quote, _args, ctx) {
        if (!quote.updatedBy) return null;
        return ctx.dataloaders.users.getUsersById.load(quote.updatedBy);
      },
    });

    t.field('currentRevision', {
      type: 'QuoteRevision',
      async resolve(quote, _args, ctx) {
        if (!quote.currentRevisionId || !ctx.user) return null;
        return ctx.services.quotingService.getQuoteRevisionById(
          quote.currentRevisionId,
          ctx.user,
        );
      },
    });
  },
});

// Quote Revision Line Item Types
export const QuoteRevisionServiceLineItem = objectType({
  name: 'QuoteRevisionServiceLineItem',
  sourceType: {
    module: require.resolve('../../services/quoting'),
    export: 'QuoteRevisionServiceLineItem',
  },
  definition(t) {
    t.string('id');
    t.nonNull.string('description');
    t.nonNull.int('quantity');
    t.nonNull.int('subtotalInCents');
    t.nonNull.field('type', { type: QuoteLineItemType });
    t.id('sellersPriceId');
    // Tracking field
    t.string('intakeFormSubmissionLineItemId');
    // Delivery fields
    t.field('deliveryMethod', { type: QuoteLineItemDeliveryMethod });
    t.string('deliveryLocation');
    t.string('deliveryNotes');
    t.field('price', {
      type: 'Price',
      async resolve(lineItem, _args, ctx) {
        if (!lineItem.sellersPriceId) return null;
        return ctx.services.pricesService.getPriceById(
          lineItem.sellersPriceId,
          ctx.user,
        );
      },
    });
    t.field('intakeFormSubmissionLineItem', {
      type: 'IntakeFormLineItem',
      async resolve(lineItem, _args, ctx) {
        if (!lineItem.intakeFormSubmissionLineItemId) return null;
        return ctx.dataloaders.intakeForms.getLineItemById.load(
          lineItem.intakeFormSubmissionLineItemId,
        );
      },
    });
  },
});

export const QuoteRevisionRentalLineItem = objectType({
  name: 'QuoteRevisionRentalLineItem',
  sourceType: {
    module: require.resolve('../../services/quoting'),
    export: 'QuoteRevisionRentalLineItem',
  },
  definition(t) {
    t.string('id');
    t.nonNull.string('description');
    t.nonNull.int('quantity');
    t.nonNull.int('subtotalInCents');
    t.nonNull.field('type', { type: QuoteLineItemType });
    t.nonNull.string('pimCategoryId');
    t.nonNull.field('rentalStartDate', { type: 'DateTime' });
    t.nonNull.field('rentalEndDate', { type: 'DateTime' });
    t.id('sellersPriceId');
    // Tracking field
    t.string('intakeFormSubmissionLineItemId');
    // Delivery fields
    t.field('deliveryMethod', { type: QuoteLineItemDeliveryMethod });
    t.string('deliveryLocation');
    t.string('deliveryNotes');

    t.field('price', {
      type: 'Price',
      async resolve(lineItem, _args, ctx) {
        if (!lineItem.sellersPriceId) return null;
        return ctx.services.pricesService.getPriceById(
          lineItem.sellersPriceId,
          ctx.user,
        );
      },
    });

    t.field('pimCategory', {
      type: 'PimCategory',
      async resolve(lineItem, _args, ctx) {
        if (!lineItem.pimCategoryId) return null;
        return ctx.dataloaders.pimCategories.getPimCategoriesById.load(
          lineItem.pimCategoryId,
        );
      },
    });
    t.field('intakeFormSubmissionLineItem', {
      type: 'IntakeFormLineItem',
      async resolve(lineItem, _args, ctx) {
        if (!lineItem.intakeFormSubmissionLineItemId) return null;
        return ctx.dataloaders.intakeForms.getLineItemById.load(
          lineItem.intakeFormSubmissionLineItemId,
        );
      },
    });
  },
});

export const QuoteRevisionSaleLineItem = objectType({
  name: 'QuoteRevisionSaleLineItem',
  sourceType: {
    module: require.resolve('../../services/quoting'),
    export: 'QuoteRevisionSaleLineItem',
  },
  definition(t) {
    t.string('id');
    t.nonNull.string('description');
    t.nonNull.int('quantity');
    t.nonNull.int('subtotalInCents');
    t.nonNull.field('type', { type: QuoteLineItemType });
    t.nonNull.string('pimCategoryId');
    t.id('sellersPriceId');
    // Tracking field
    t.string('intakeFormSubmissionLineItemId');
    // Delivery fields
    t.field('deliveryMethod', { type: QuoteLineItemDeliveryMethod });
    t.string('deliveryLocation');
    t.string('deliveryNotes');

    t.field('price', {
      type: 'Price',
      async resolve(lineItem, _args, ctx) {
        if (!lineItem.sellersPriceId) return null;
        return ctx.services.pricesService.getPriceById(
          lineItem.sellersPriceId,
          ctx.user,
        );
      },
    });

    t.field('pimCategory', {
      type: 'PimCategory',
      async resolve(lineItem, _args, ctx) {
        if (!lineItem.pimCategoryId) return null;
        return ctx.dataloaders.pimCategories.getPimCategoriesById.load(
          lineItem.pimCategoryId,
        );
      },
    });
    t.field('intakeFormSubmissionLineItem', {
      type: 'IntakeFormLineItem',
      async resolve(lineItem, _args, ctx) {
        if (!lineItem.intakeFormSubmissionLineItemId) return null;
        return ctx.dataloaders.intakeForms.getLineItemById.load(
          lineItem.intakeFormSubmissionLineItemId,
        );
      },
    });
  },
});

export const QuoteRevisionLineItem = unionType({
  name: 'QuoteRevisionLineItem',
  definition(t) {
    t.members(
      QuoteRevisionServiceLineItem,
      QuoteRevisionRentalLineItem,
      QuoteRevisionSaleLineItem,
    );
  },
  resolveType(item) {
    if (item.type === 'SERVICE') return 'QuoteRevisionServiceLineItem';
    if (item.type === 'RENTAL') return 'QuoteRevisionRentalLineItem';
    if (item.type === 'SALE') return 'QuoteRevisionSaleLineItem';
    return null;
  },
});

// RFQ Line Item Types
export const RFQServiceLineItem = objectType({
  name: 'RFQServiceLineItem',
  sourceType: {
    module: require.resolve('../../services/quoting'),
    export: 'RFQServiceLineItem',
  },
  definition(t) {
    t.string('id');
    t.nonNull.string('description');
    t.nonNull.int('quantity');
    t.nonNull.field('type', { type: QuoteLineItemType });
  },
});

export const RFQRentalLineItem = objectType({
  name: 'RFQRentalLineItem',
  sourceType: {
    module: require.resolve('../../services/quoting'),
    export: 'RFQRentalLineItem',
  },
  definition(t) {
    t.string('id');
    t.nonNull.string('description');
    t.nonNull.int('quantity');
    t.nonNull.field('type', { type: QuoteLineItemType });
    t.nonNull.string('pimCategoryId');
    t.nonNull.field('rentalStartDate', { type: 'DateTime' });
    t.nonNull.field('rentalEndDate', { type: 'DateTime' });

    t.field('pimCategory', {
      type: 'PimCategory',
      async resolve(lineItem, _args, ctx) {
        if (!lineItem.pimCategoryId) return null;
        return ctx.dataloaders.pimCategories.getPimCategoriesById.load(
          lineItem.pimCategoryId,
        );
      },
    });
  },
});

export const RFQSaleLineItem = objectType({
  name: 'RFQSaleLineItem',
  sourceType: {
    module: require.resolve('../../services/quoting'),
    export: 'RFQSaleLineItem',
  },
  definition(t) {
    t.string('id');
    t.nonNull.string('description');
    t.nonNull.int('quantity');
    t.nonNull.field('type', { type: QuoteLineItemType });
    t.nonNull.string('pimCategoryId');

    t.field('pimCategory', {
      type: 'PimCategory',
      async resolve(lineItem, _args, ctx) {
        if (!lineItem.pimCategoryId) return null;
        return ctx.dataloaders.pimCategories.getPimCategoriesById.load(
          lineItem.pimCategoryId,
        );
      },
    });
  },
});

export const RFQLineItem = unionType({
  name: 'RFQLineItem',
  definition(t) {
    t.members(RFQServiceLineItem, RFQRentalLineItem, RFQSaleLineItem);
  },
  resolveType(item) {
    if (item.type === 'SERVICE') return 'RFQServiceLineItem';
    if (item.type === 'RENTAL') return 'RFQRentalLineItem';
    if (item.type === 'SALE') return 'RFQSaleLineItem';
    return null;
  },
});

// Quote Revision Object Type
export const QuoteRevision = objectType({
  name: 'QuoteRevision',
  sourceType: {
    module: require.resolve('../../services/quoting'),
    export: 'QuoteRevision',
  },
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('quoteId');
    t.nonNull.int('revisionNumber');
    t.field('validUntil', { type: 'DateTime' });
    t.nonNull.field('status', { type: RevisionStatus });

    // Metadata
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.nonNull.field('updatedAt', { type: 'DateTime' });
    t.nonNull.string('createdBy');
    t.nonNull.string('updatedBy');

    // Line items
    t.nonNull.list.nonNull.field('lineItems', {
      type: QuoteRevisionLineItem,
      resolve(revision) {
        return revision.lineItems || [];
      },
    });

    t.field('createdByUser', {
      type: 'User',
      async resolve(revision, _args, ctx) {
        if (!revision.createdBy) return null;
        return ctx.dataloaders.users.getUsersById.load(revision.createdBy);
      },
    });

    t.field('updatedByUser', {
      type: 'User',
      async resolve(revision, _args, ctx) {
        if (!revision.updatedBy) return null;
        return ctx.dataloaders.users.getUsersById.load(revision.updatedBy);
      },
    });

    // Computed field to help UI identify quotes needing pricing
    t.nonNull.boolean('hasUnpricedLineItems', {
      resolve(revision) {
        return revision.lineItems.some(
          (item: QuoteRevisionLineItemType) => !item.sellersPriceId,
        );
      },
    });
  },
});

// RFQ Object Type
export const RFQ = objectType({
  name: 'RFQ',
  sourceType: {
    module: require.resolve('../../services/quoting'),
    export: 'RFQ',
  },
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('buyersWorkspaceId');
    t.field('responseDeadline', { type: 'DateTime' });
    t.nonNull.list.nonNull.string('invitedSellerContactIds');
    t.nonNull.field('status', { type: RFQStatus });
    t.string('description');

    // Metadata
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.nonNull.field('updatedAt', { type: 'DateTime' });
    t.nonNull.string('createdBy');
    t.nonNull.string('updatedBy');

    // Line items
    t.nonNull.list.nonNull.field('lineItems', {
      type: RFQLineItem,
      resolve(rfq) {
        return rfq.lineItems || [];
      },
    });

    t.field('createdByUser', {
      type: 'User',
      async resolve(rfq, _args, ctx) {
        if (!rfq.createdBy) return null;
        return ctx.dataloaders.users.getUsersById.load(rfq.createdBy);
      },
    });

    t.field('updatedByUser', {
      type: 'User',
      async resolve(rfq, _args, ctx) {
        if (!rfq.updatedBy) return null;
        return ctx.dataloaders.users.getUsersById.load(rfq.updatedBy);
      },
    });

    t.list.nonNull.field('invitedSellerContacts', {
      type: 'Contact',
      async resolve(rfq, _args, ctx) {
        if (
          !rfq.invitedSellerContactIds ||
          rfq.invitedSellerContactIds.length === 0
        ) {
          return [];
        }
        const contacts = await Promise.all(
          rfq.invitedSellerContactIds.map((id: string) =>
            ctx.dataloaders.contacts.getContactsById.load(id),
          ),
        );
        return contacts.filter((c) => c !== null);
      },
    });
  },
});

// Input Types for Quote Revision Line Items
// Note: GraphQL doesn't support input unions, so we create a single input type
// with all possible fields, where the 'type' field determines which fields are used
export const QuoteRevisionLineItemInput = inputObjectType({
  name: 'QuoteRevisionLineItemInput',
  definition(t) {
    t.string('id');
    t.nonNull.field('type', { type: QuoteLineItemType });
    t.nonNull.string('description');
    t.int('quantity');
    // NOTE: subtotalInCents is calculated server-side from the referenced price (0 if no price)
    t.id('sellersPriceId'); // Optional - required before sending quote

    // Rental-specific and Sale-specific fields
    t.string('pimCategoryId');
    t.field('rentalStartDate', { type: 'DateTime' });
    t.field('rentalEndDate', { type: 'DateTime' });

    // Tracking field for intake form conversion
    t.string('intakeFormSubmissionLineItemId');

    // Delivery fields
    t.field('deliveryMethod', { type: QuoteLineItemDeliveryMethod });
    t.string('deliveryLocation');
    t.string('deliveryNotes');
  },
});

// Input Types for RFQ Line Items
export const RFQLineItemInput = inputObjectType({
  name: 'RFQLineItemInput',
  definition(t) {
    t.string('id');
    t.nonNull.field('type', { type: QuoteLineItemType });
    t.nonNull.string('description');
    t.int('quantity');
    // NOTE: RFQ line items only contain requirements, no pricing

    // Rental-specific and Sale-specific fields
    t.string('pimCategoryId');
    t.field('rentalStartDate', { type: 'DateTime' });
    t.field('rentalEndDate', { type: 'DateTime' });
  },
});

// Input Types for Queries
export const ListQuotesFilter = inputObjectType({
  name: 'ListQuotesFilter',
  definition(t) {
    t.string('buyerWorkspaceId');
    t.string('sellerWorkspaceId');
    t.field('status', { type: QuoteStatus });
    t.string('rfqId');
  },
});

export const ListQuotesPage = inputObjectType({
  name: 'ListQuotesPage',
  definition(t) {
    t.int('size');
    t.int('number');
  },
});

export const ListQuotesQuery = inputObjectType({
  name: 'ListQuotesQuery',
  definition(t) {
    t.nonNull.field('filter', { type: ListQuotesFilter });
    t.field('page', { type: ListQuotesPage });
  },
});

export const QuotesResponse = objectType({
  name: 'QuotesResponse',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: Quote });
  },
});

// RFQ List Types
export const ListRFQsFilter = inputObjectType({
  name: 'ListRFQsFilter',
  definition(t) {
    t.nonNull.string('buyersWorkspaceId');
    t.field('status', { type: RFQStatus });
    t.list.nonNull.string('invitedSellerContactIds');
    t.field('createdAtStart', { type: 'DateTime' });
    t.field('createdAtEnd', { type: 'DateTime' });
    t.field('updatedAtStart', { type: 'DateTime' });
    t.field('updatedAtEnd', { type: 'DateTime' });
  },
});

export const ListRFQsPage = inputObjectType({
  name: 'ListRFQsPage',
  definition(t) {
    t.nonNull.int('number', { default: 1 });
    t.nonNull.int('size', { default: 10 });
  },
});

export const ListRFQsResult = objectType({
  name: 'ListRFQsResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: RFQ });
    t.nonNull.field('page', { type: 'PaginationInfo' });
  },
});

// Input Types for Mutations
export const CreateQuoteInput = inputObjectType({
  name: 'CreateQuoteInput',
  definition(t) {
    t.nonNull.string('sellerWorkspaceId');
    t.nonNull.string('sellersBuyerContactId');
    t.nonNull.string('sellersProjectId');
    t.string('buyerWorkspaceId');
    t.string('buyersSellerContactId');
    t.string('buyersProjectId');
    t.string('rfqId');
    t.field('status', { type: QuoteStatus });
    t.field('validUntil', { type: 'DateTime' });
  },
});

export const UpdateQuoteStatusInput = inputObjectType({
  name: 'UpdateQuoteStatusInput',
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.field('status', { type: QuoteStatus });
  },
});

export const UpdateQuoteInput = inputObjectType({
  name: 'UpdateQuoteInput',
  definition(t) {
    t.nonNull.string('id');
    t.string('sellersBuyerContactId');
    t.string('sellersProjectId');
    t.field('status', { type: QuoteStatus });
    t.string('currentRevisionId');
    t.field('validUntil', { type: 'DateTime' });
  },
});

export const CreateQuoteRevisionInput = inputObjectType({
  name: 'CreateQuoteRevisionInput',
  definition(t) {
    t.nonNull.string('quoteId');
    t.nonNull.int('revisionNumber');
    t.field('validUntil', { type: 'DateTime' });
    t.nonNull.list.nonNull.field('lineItems', {
      type: QuoteRevisionLineItemInput,
    });
  },
});

export const UpdateQuoteRevisionInput = inputObjectType({
  name: 'UpdateQuoteRevisionInput',
  definition(t) {
    t.nonNull.string('id');
    t.field('validUntil', { type: 'DateTime' });
    t.list.nonNull.field('lineItems', {
      type: QuoteRevisionLineItemInput,
    });
  },
});

export const SendQuoteInput = inputObjectType({
  name: 'SendQuoteInput',
  definition(t) {
    t.nonNull.string('quoteId');
    t.nonNull.string('revisionId');
  },
});

export const CreateRFQInput = inputObjectType({
  name: 'CreateRFQInput',
  definition(t) {
    t.nonNull.string('buyersWorkspaceId');
    t.field('responseDeadline', { type: 'DateTime' });
    t.nonNull.list.nonNull.string('invitedSellerContactIds');
    t.field('status', { type: RFQStatus });
    t.string('description');
    t.nonNull.list.nonNull.field('lineItems', { type: RFQLineItemInput });
  },
});

export const UpdateRFQInput = inputObjectType({
  name: 'UpdateRFQInput',
  definition(t) {
    t.nonNull.string('id');
    t.field('responseDeadline', { type: 'DateTime' });
    t.list.nonNull.string('invitedSellerContactIds');
    t.field('status', { type: RFQStatus });
    t.string('description');
    t.list.nonNull.field('lineItems', { type: RFQLineItemInput });
  },
});

export const AcceptQuoteInput = inputObjectType({
  name: 'AcceptQuoteInput',
  definition(t) {
    t.nonNull.string('quoteId');
    t.string('approvalConfirmation', {
      description:
        'If the seller accepts on behalf of the buyer, provide confirmation details here.',
    });
    t.string('signature', {
      description: 'Base64 encoded signature image (PNG or JPEG, optional)',
    });
    t.string('buyerAcceptedFullLegalName', {
      description:
        "Buyer's full legal name as provided in the agreement for compliance purposes",
    });
  },
});

export const AcceptQuoteResult = objectType({
  name: 'AcceptQuoteResult',
  definition(t) {
    t.nonNull.field('quote', { type: Quote });
    t.nonNull.field('salesOrder', { type: 'SalesOrder' });
    t.field('purchaseOrder', { type: 'PurchaseOrder' });
  },
});

export const CreateQuoteFromIntakeFormSubmissionInput = inputObjectType({
  name: 'CreateQuoteFromIntakeFormSubmissionInput',
  definition(t) {
    t.nonNull.id('intakeFormSubmissionId');
    t.nonNull.id('sellersBuyerContactId');
    t.nonNull.id('sellersProjectId');
    t.field('validUntil', { type: 'DateTime' });
  },
});

// Helper functions for type-safe line item mapping
function mapQuoteRevisionLineItem(input: any): QuoteRevisionLineItemType {
  const { type } = input;

  // Common optional fields for all line item types
  // Use dropNullishKeys to remove null/undefined values entirely (Zod .optional() doesn't accept null)
  const commonFields = dropNullishKeys({
    sellersPriceId: input.sellersPriceId,
    intakeFormSubmissionLineItemId: input.intakeFormSubmissionLineItemId,
    deliveryMethod: input.deliveryMethod,
    deliveryLocation: input.deliveryLocation,
    deliveryNotes: input.deliveryNotes,
  });

  if (type === 'SERVICE') {
    return dropNullishKeys({
      type: 'SERVICE',
      id: input.id,
      description: input.description,
      quantity: input.quantity ?? 1,
      ...commonFields,
      // subtotalInCents calculated in service layer (0 if no priceId)
    }) as QuoteRevisionServiceLineItemType;
  }

  if (type === 'RENTAL') {
    if (!input.pimCategoryId) {
      throw new Error('RENTAL line items require a pimCategoryId');
    }
    if (!input.rentalStartDate) {
      throw new Error('RENTAL line items require a rentalStartDate');
    }
    if (!input.rentalEndDate) {
      throw new Error('RENTAL line items require a rentalEndDate');
    }
    return dropNullishKeys({
      type: 'RENTAL',
      id: input.id,
      description: input.description,
      quantity: input.quantity ?? 1,
      pimCategoryId: input.pimCategoryId,
      rentalStartDate: new Date(input.rentalStartDate),
      rentalEndDate: new Date(input.rentalEndDate),
      ...commonFields,
      // subtotalInCents calculated in service layer (0 if no priceId)
    }) as QuoteRevisionRentalLineItemType;
  }

  if (type === 'SALE') {
    if (!input.pimCategoryId) {
      throw new Error('SALE line items require a pimCategoryId');
    }
    return dropNullishKeys({
      type: 'SALE',
      id: input.id,
      description: input.description,
      quantity: input.quantity ?? 1,
      pimCategoryId: input.pimCategoryId,
      ...commonFields,
      // subtotalInCents calculated in service layer (0 if no priceId)
    }) as QuoteRevisionSaleLineItemType;
  }

  throw new Error(`Invalid line item type: ${type}`);
}

function mapRFQLineItem(
  input: any, //NexusGenInputs['RFQLineItemInput'],
): RFQLineItemUnion {
  const { type } = input;

  if (type === 'SERVICE') {
    return {
      type: 'SERVICE',
      id: input.id ?? undefined,
      description: input.description,
      quantity: input.quantity ?? 1,
    } as RFQServiceLineItemType;
  }

  if (type === 'RENTAL') {
    if (!input.pimCategoryId) {
      throw new Error('RENTAL line items require a pimCategoryId');
    }
    if (!input.rentalStartDate) {
      throw new Error('RENTAL line items require a rentalStartDate');
    }
    if (!input.rentalEndDate) {
      throw new Error('RENTAL line items require a rentalEndDate');
    }
    return {
      type: 'RENTAL',
      id: input.id ?? undefined,
      description: input.description,
      quantity: input.quantity ?? 1,
      pimCategoryId: input.pimCategoryId,
      rentalStartDate: new Date(input.rentalStartDate),
      rentalEndDate: new Date(input.rentalEndDate),
    } as RFQRentalLineItemType;
  }

  if (type === 'SALE') {
    if (!input.pimCategoryId) {
      throw new Error('SALE line items require a pimCategoryId');
    }
    return {
      type: 'SALE',
      id: input.id ?? undefined,
      description: input.description,
      quantity: input.quantity ?? 1,
      pimCategoryId: input.pimCategoryId,
    } as RFQSaleLineItemType;
  }

  throw new Error(`Invalid line item type: ${type}`);
}

// Queries
export const QuotingQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('listQuotes', {
      type: nonNull(QuotesResponse),
      args: {
        query: arg({ type: ListQuotesQuery }),
      },
      async resolve(_root, { query }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        if (!query || !query.filter) {
          throw new Error('Query with filter is required');
        }

        const page = query.page ?? {};

        const items = await ctx.services.quotingService.listQuotes(
          {
            filter: dropNullishKeys(query.filter),
            page: {
              number: page.number ?? undefined,
              size: page.size ?? undefined,
            },
          },
          ctx.user,
        );

        return { items };
      },
    });

    t.field('quoteById', {
      type: Quote,
      args: {
        id: nonNull('String'),
      },
      async resolve(_root, { id }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        const quote = await ctx.services.quotingService.getQuoteById(
          id,
          ctx.user,
        );
        return quote;
      },
    });

    t.field('quoteRevisionById', {
      type: QuoteRevision,
      args: {
        id: nonNull('String'),
      },
      async resolve(_root, { id }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        return ctx.services.quotingService.getQuoteRevisionById(id, ctx.user);
      },
    });

    t.field('rfqById', {
      type: RFQ,
      args: {
        id: nonNull('String'),
      },
      async resolve(_root, { id }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        return ctx.services.quotingService.getRFQById(id, ctx.user);
      },
    });

    t.field('listRFQs', {
      type: nonNull(ListRFQsResult),
      args: {
        filter: nonNull(arg({ type: ListRFQsFilter })),
        page: nonNull(arg({ type: ListRFQsPage })),
      },
      async resolve(_root, { filter, page }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        return ctx.services.quotingService.listRFQs(
          {
            filter: {
              buyersWorkspaceId: filter.buyersWorkspaceId,
              ...dropNullishKeys({
                status: filter.status,
                invitedSellerContactIds: filter.invitedSellerContactIds,
                createdAtStart: filter.createdAtStart,
                createdAtEnd: filter.createdAtEnd,
                updatedAtStart: filter.updatedAtStart,
                updatedAtEnd: filter.updatedAtEnd,
              }),
            },
            page,
          },
          ctx.user,
        );
      },
    });
  },
});

// Helper functions for RFQ seller processing
async function processInvitedSellers(
  invitedSellerContactIds: string[],
  ctx: GraphQLContext,
): Promise<{ emails: string[]; userIds: string[] }> {
  if (!ctx.user) {
    throw new Error('Unauthorized');
  }

  // Get the contacts by their IDs
  const invitedSellers =
    await ctx.dataloaders.contacts.getContactsById.loadMany(
      invitedSellerContactIds,
    );

  const sellerEmails = invitedSellers.map((contact) => {
    if (contact instanceof Error) {
      throw contact;
    }

    if (contact?.contactType !== 'PERSON') {
      throw new Error('Invited seller contacts must be person contacts');
    }

    if (!contact.email) {
      throw new Error('Invited seller contacts must have an email address');
    }

    return contact.email;
  });

  const upsertedUsers = await ctx.services.usersService.upsertUsersByEmail(
    sellerEmails,
    ctx.user,
  );

  return {
    emails: sellerEmails,
    userIds: upsertedUsers.map((user) => user._id),
  };
}

function getRFQInviteUrl(rfqId: string, ctx: GraphQLContext): string {
  return `${ctx.envConfig.ERP_CLIENT_URL}/app/rfq-invite/${rfqId}`;
}

function getQuoteViewUrl(quoteId: string, ctx: GraphQLContext): string {
  return `${ctx.envConfig.ERP_CLIENT_URL}/quote/${quoteId}`;
}

async function sendQuoteEmail(
  buyerContact: any,
  buyerUser: any,
  quote: any,
  revision: any,
  sellersWorkspace: any,
  pdfAttachment: any,
  ctx: GraphQLContext,
): Promise<void> {
  if (!ctx.user) {
    throw new Error('Unauthorized');
  }

  // Generate JWT for the buyer user
  const buyerUserPayload = {
    id: buyerUser._id,
    companyId: buyerUser.es_company_id || '',
    auth0Sub: buyerUser.auth0_sub || '',
    email: buyerUser.email,
    es_erp_roles: buyerUser.es_erp_roles,
  };

  // Set JWT expiration to match quote's validUntil, or 30 days if not set
  const expiresIn = quote.validUntil
    ? Math.floor((new Date(quote.validUntil).getTime() - Date.now()) / 1000) +
      's'
    : '30d';

  const jwt = await ctx.services.jwtService.signToken(buyerUserPayload, {
    expiresIn,
  });

  const baseQuoteUrl = getQuoteViewUrl(quote.id, ctx);
  const quoteUrl = `${baseQuoteUrl}#jwt=${jwt}`;

  const validUntilText = quote.validUntil
    ? new Date(quote.validUntil).toLocaleDateString()
    : 'date TBD';

  await ctx.services.emailService.sendTemplatedEmail({
    to: buyerContact.email,
    from: 'noreply@equipmentshare.com',
    subject: `Your Quote ${quote.id} is Ready - Revision ${revision.revisionNumber}`,
    title: 'Review Your Quote',
    content: `Your quote has been updated. Please review the details and pricing. Valid until ${validUntilText}.`,
    primaryCTA: {
      text: 'View Quote',
      url: quoteUrl,
    },
    attachments: pdfAttachment ? [pdfAttachment] : undefined,
    bannerImgUrl: sellersWorkspace.bannerImageUrl,
    iconUrl: sellersWorkspace.logoUrl,
    workspaceId: sellersWorkspace.id,
    user: ctx.user,
  });
}

async function sendRFQInviteEmails(
  users: Array<{ _id: string; email: string }>,
  rfqId: string,
  buyersWorkspace: any,
  ctx: GraphQLContext,
): Promise<void> {
  if (!ctx.user) {
    throw new Error('Unauthorized');
  }

  const url = getRFQInviteUrl(rfqId, ctx);

  for (const user of users) {
    await ctx.services.emailService.sendTemplatedEmail({
      to: user.email,
      from: 'noreply@equipmentshare.com',
      subject: `You've been invited to an RFQ`,
      title: 'Submit Your Quote',
      content:
        'View the details of the RFQ and submit your quote through the platform.',
      primaryCTA: {
        text: 'Go to RFQ',
        url,
      },
      bannerImgUrl: buyersWorkspace.bannerImageUrl,
      iconUrl: buyersWorkspace.logoUrl,
      workspaceId: buyersWorkspace.id,
      user: ctx.user,
    });
  }
}

// Mutations
export const QuotingMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createQuote', {
      type: nonNull(Quote),
      args: {
        input: nonNull(arg({ type: CreateQuoteInput })),
      },
      async resolve(_root, { input }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        const created = await ctx.services.quotingService.createQuote(
          {
            sellerWorkspaceId: input.sellerWorkspaceId,
            sellersBuyerContactId: input.sellersBuyerContactId,
            sellersProjectId: input.sellersProjectId,
            buyerWorkspaceId: input.buyerWorkspaceId ?? undefined,
            buyersSellerContactId: input.buyersSellerContactId ?? undefined,
            buyersProjectId: input.buyersProjectId ?? undefined,
            rfqId: input.rfqId ?? undefined,
            status: input.status ?? 'ACTIVE',
            validUntil: input.validUntil ?? undefined,
          },
          ctx.user,
        );

        return created;
      },
    });

    t.field('updateQuoteStatus', {
      type: nonNull(Quote),
      args: {
        input: nonNull(arg({ type: UpdateQuoteStatusInput })),
      },
      async resolve(_root, { input }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        const updated = await ctx.services.quotingService.updateQuoteStatus(
          input.id,
          input.status,
          ctx.user,
        );

        if (!updated) {
          throw new Error('Quote not found or not authorized');
        }

        return updated;
      },
    });

    t.field('updateQuote', {
      type: nonNull(Quote),
      args: {
        input: nonNull(arg({ type: UpdateQuoteInput })),
      },
      async resolve(_root, { input }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        const { id, ...updates } = input;

        const updated = await ctx.services.quotingService.updateQuote(
          id,
          dropNullishKeys({
            sellersBuyerContactId: updates.sellersBuyerContactId,
            sellersProjectId: updates.sellersProjectId,
            status: updates.status,
            currentRevisionId: updates.currentRevisionId,
            validUntil: updates.validUntil,
          }),
          ctx.user,
        );

        if (!updated) {
          throw new Error('Quote not found or not authorized');
        }

        return updated;
      },
    });

    t.field('createQuoteRevision', {
      type: nonNull(QuoteRevision),
      args: {
        input: nonNull(arg({ type: CreateQuoteRevisionInput })),
      },
      async resolve(_root, { input }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        const created = await ctx.services.quotingService.createQuoteRevision(
          {
            quoteId: input.quoteId,
            revisionNumber: input.revisionNumber,
            validUntil: input.validUntil ?? undefined,
            lineItems: input.lineItems.map(mapQuoteRevisionLineItem),
          },
          ctx.user,
        );

        return created;
      },
    });

    t.field('updateQuoteRevision', {
      type: nonNull(QuoteRevision),
      args: {
        input: nonNull(arg({ type: UpdateQuoteRevisionInput })),
      },
      async resolve(_root, { input }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        const { id, ...updates } = input;

        const updated = await ctx.services.quotingService.updateQuoteRevision(
          id,
          dropNullishKeys({
            validUntil: updates.validUntil,
            lineItems: updates.lineItems?.map(mapQuoteRevisionLineItem),
          }),
          ctx.user,
        );

        if (!updated) {
          throw new Error('Quote revision not found or not authorized');
        }

        return updated;
      },
    });

    t.field('sendQuote', {
      type: nonNull(Quote),
      args: {
        input: nonNull(arg({ type: SendQuoteInput })),
      },
      async resolve(_root, { input }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        // Get the quote first to access buyer contact info
        const quoteBeforeSend = await ctx.services.quotingService.getQuoteById(
          input.quoteId,
          ctx.user,
        );

        if (!quoteBeforeSend) {
          throw new Error('Quote not found');
        }

        // Get the buyer contact
        const buyerContact =
          await ctx.dataloaders.contacts.getContactsById.load(
            quoteBeforeSend.sellersBuyerContactId,
          );

        if (!buyerContact) {
          throw new Error('Buyer contact not found');
        }

        if (buyerContact.contactType !== 'PERSON') {
          throw new Error('Buyer contact must be a person contact');
        }

        if (!buyerContact.email) {
          throw new Error('Buyer contact must have an email address');
        }

        // Upsert buyer as user BEFORE sending the quote
        const users = await ctx.services.usersService.upsertUsersByEmail(
          [buyerContact.email],
          ctx.user,
        );

        const buyerUserId = users[0]._id;

        // Send the quote with the buyer user ID
        const quote = await ctx.services.quotingService.sendQuote(
          input.quoteId,
          input.revisionId,
          buyerUserId,
          ctx.user,
        );

        // Generate PDF and send email notification to buyer
        try {
          // Get the current revision
          const revision =
            await ctx.services.quotingService.getQuoteRevisionById(
              quote.currentRevisionId!,
              ctx.user,
            );

          if (!revision) {
            throw new Error('Current revision not found');
          }

          // Get seller's workspace for branding
          const sellersWorkspace =
            await ctx.services.workspaceService.getWorkspaceById(
              quote.sellerWorkspaceId,
              ctx.user,
            );

          if (!sellersWorkspace) {
            throw new Error('Sellers workspace not found');
          }

          // Generate PDF for the quote
          const pdfFileName = `Quote-${quote.id}-Rev${revision.revisionNumber}.pdf`;
          let pdfAttachment: any;

          try {
            // Generate the PDF using PdfService (waits for completion)
            await ctx.services.pdfService.generatePdFAndLinkToEntity(
              quote.id,
              ctx.user,
              ctx.userToken || '',
              `print/sales-quote/${quote.sellerWorkspaceId}/${quote.id}`,
              quote.sellerWorkspaceId,
              pdfFileName,
            );

            // Get the most recent file for this quote
            const files = await ctx.services.fileService.getFilesByParentEntity(
              {
                workspace_id: quote.sellerWorkspaceId,
                parent_entity_id: quote.id,
              },
              ctx.user,
            );

            if (files.length > 0) {
              // Sort by created_at descending to get the most recent
              const sortedFiles = files.sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime(),
              );
              const pdfFile = sortedFiles[0];

              // Download PDF content from S3
              const pdfStream = await ctx.services.fileService.getFileContent(
                pdfFile._id,
                ctx.user,
              );

              // Convert stream to buffer
              const chunks: Buffer[] = [];
              for await (const chunk of pdfStream) {
                chunks.push(Buffer.from(chunk));
              }
              const pdfBuffer = Buffer.concat(chunks);

              // Create attachment
              pdfAttachment = {
                content: pdfBuffer.toString('base64'),
                filename: pdfFileName,
                type: 'application/pdf',
                disposition: 'attachment' as const,
              };
            }
          } catch (pdfError) {
            // Log PDF generation error but continue with email
            console.error('Failed to generate PDF for quote', {
              error: pdfError,
              quoteId: quote.id,
              revisionId: input.revisionId,
            });
          }

          // Send the email (with or without PDF attachment)
          await sendQuoteEmail(
            buyerContact,
            users[0],
            quote,
            revision,
            sellersWorkspace,
            pdfAttachment,
            ctx,
          );
        } catch (error) {
          // Log error but don't fail the mutation - quote is already sent
          console.error('Failed to send quote email', {
            error,
            quoteId: quote.id,
            revisionId: input.revisionId,
          });
        }

        return quote;
      },
    });

    t.field('acceptQuote', {
      type: nonNull(AcceptQuoteResult),
      args: {
        input: nonNull(arg({ type: AcceptQuoteInput })),
      },
      async resolve(_root, { input }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        // Get the quote to validate and extract data before accepting it
        const quote = await ctx.services.quotingService.getQuoteById(
          input.quoteId,
          ctx.user,
        );

        if (!quote) {
          throw new Error('Quote not found');
        }

        // Get the current revision to create orders
        const revision = await ctx.services.quotingService.getQuoteRevisionById(
          quote.currentRevisionId!,
          ctx.user,
        );

        if (!revision) {
          throw new Error('Current revision not found');
        }

        // Create Sales Order from quote line items (only rental items for now)
        // TODO support SALE and SERVICE line items in SO/PO creation
        const rentalLineItemsForSO = revision.lineItems.filter(
          (item) => item.type === 'RENTAL',
        );

        // Generate sales order number
        const salesOrderNumber =
          await ctx.services.referenceNumberService.generateReferenceNumberForEntity(
            {
              entityType: 'SO',
              workspaceId: quote.sellerWorkspaceId,
              projectId: quote.sellersProjectId || undefined,
              contactId: quote.sellersBuyerContactId,
            },
            ctx.systemUser,
          );

        // Create Sales Order without line items
        const salesOrder =
          await ctx.services.salesOrdersService.createSalesOrder(
            {
              workspace_id: quote.sellerWorkspaceId,
              project_id: quote.sellersProjectId,
              buyer_id: quote.sellersBuyerContactId,
              quote_id: quote.id,
              quote_revision_id: revision.id,
              intake_form_submission_id: quote.intakeFormSubmissionId,
              sales_order_number: salesOrderNumber,
            },
            ctx.systemUser,
          );

        // Create line items individually via dedicated service method
        for (const item of rentalLineItemsForSO) {
          await ctx.services.salesOrdersService.createSalesOrderLineItem(
            {
              sales_order_id: salesOrder._id,
              quote_revision_line_item_id: item.id,
              intake_form_submission_line_item_id:
                item.intakeFormSubmissionLineItemId,
              lineitem_type: 'RENTAL',
              so_pim_id: item.pimCategoryId,
              so_quantity: 1, // Always 1 for rental items
              price_id: item.sellersPriceId,
              delivery_date: item.rentalStartDate,
              off_rent_date: item.rentalEndDate,
              delivery_method: item.deliveryMethod,
              delivery_location: item.deliveryLocation,
              deliveryNotes: item.deliveryNotes,
            } as RentalSalesOrderLineItemDoc,
            ctx.systemUser,
          );
        }

        // Create Purchase Order if buyerWorkspaceId exists (only rental items for now)
        let purchaseOrder = null;
        if (quote.buyerWorkspaceId) {
          const rentalLineItemsForPO = revision.lineItems.filter(
            (item) => item.type === 'RENTAL',
          );

          // Generate purchase order number
          const purchaseOrderNumber =
            await ctx.services.referenceNumberService.generateReferenceNumberForEntity(
              {
                entityType: 'PO',
                workspaceId: quote.buyerWorkspaceId,
                projectId: quote.buyersProjectId || undefined,
                contactId: quote.buyersSellerContactId || undefined,
              },
              ctx.systemUser,
            );

          // Create Purchase Order without line items
          purchaseOrder =
            await ctx.services.purchaseOrdersService.createPurchaseOrder(
              {
                workspace_id: quote.buyerWorkspaceId,
                project_id: quote.buyersProjectId,
                seller_id:
                  quote.buyersSellerContactId || quote.sellerWorkspaceId,
                quote_id: quote.id,
                quote_revision_id: revision.id,
                intake_form_submission_id: quote.intakeFormSubmissionId,
                purchase_order_number: purchaseOrderNumber,
              },
              ctx.systemUser,
            );

          // Create line items individually via dedicated service method
          for (const item of rentalLineItemsForPO) {
            await ctx.services.purchaseOrdersService.createPurchaseOrderLineItem(
              {
                purchase_order_id: purchaseOrder._id,
                quote_revision_line_item_id: item.id,
                intake_form_submission_line_item_id:
                  item.intakeFormSubmissionLineItemId,
                lineitem_type: 'RENTAL',
                po_pim_id: item.pimCategoryId,
                po_quantity: 1, // Always 1 for rental items
                price_id: item.sellersPriceId,
                delivery_date: item.rentalStartDate,
                off_rent_date: item.rentalEndDate,
                delivery_method: item.deliveryMethod,
                delivery_location: item.deliveryLocation,
                deliveryNotes: item.deliveryNotes,
              } as RentalPurchaseOrderLineItemDoc,
              ctx.systemUser,
            );
          }
        }

        // Handle signature upload if provided
        let signatureS3Key: string | undefined;

        if (input.signature) {
          try {
            // Decode base64 to buffer
            const buffer = Buffer.from(input.signature, 'base64');

            // Determine content type from base64 header
            let contentType = 'image/png';
            let ext = '.png';
            if (input.signature.startsWith('/9j/')) {
              contentType = 'image/jpeg';
              ext = '.jpg';
            }

            // Generate S3 key
            const timestamp = Date.now();
            signatureS3Key = `signatures/${input.quoteId}-${timestamp}${ext}`;

            // Create S3 client
            const s3Client = new S3Client({
              region: ctx.envConfig.FILE_SERVICE_REGION || 'us-west-2',
              credentials: {
                accessKeyId: ctx.envConfig.FILE_SERVICE_KEY,
                secretAccessKey: ctx.envConfig.FILE_SERVICE_SECRET,
              },
              ...(ctx.envConfig.FILE_SERVICE_ENDPOINT && {
                endpoint: ctx.envConfig.FILE_SERVICE_ENDPOINT,
                forcePathStyle: true,
              }),
            });

            // Upload to S3
            await s3Client.send(
              new PutObjectCommand({
                Bucket: ctx.envConfig.FILE_SERVICE_BUCKET,
                Key: signatureS3Key,
                Body: buffer,
                ContentType: contentType,
              }),
            );

            logger.info(
              { quoteId: input.quoteId, s3Key: signatureS3Key },
              'Uploaded signature to S3',
            );
          } catch (error) {
            // Log error but don't fail the acceptance
            logger.error(
              { error, quoteId: input.quoteId },
              'Failed to upload signature - proceeding with acceptance',
            );
            signatureS3Key = undefined;
          }
        }

        // Only accept the quote after SO/PO have been successfully created
        const acceptedQuote = await ctx.services.quotingService.acceptQuote(
          input.quoteId,
          ctx.user,
          input.approvalConfirmation ?? undefined,
          signatureS3Key,
          input.buyerAcceptedFullLegalName ?? undefined,
        );

        // Generate PDF and send confirmation emails
        try {
          // Get seller's workspace for branding
          const sellersWorkspace =
            await ctx.services.workspaceService.getWorkspaceById(
              quote.sellerWorkspaceId,
              ctx.user,
            );

          if (!sellersWorkspace) {
            throw new Error('Sellers workspace not found');
          }

          // Get buyer contact information
          const buyerContact =
            await ctx.dataloaders.contacts.getContactsById.load(
              quote.sellersBuyerContactId,
            );

          if (!buyerContact) {
            throw new Error('Buyer contact not found');
          }

          if (buyerContact.contactType !== 'PERSON') {
            throw new Error('Buyer contact must be a person contact');
          }

          if (!buyerContact.email) {
            throw new Error('Buyer contact must have an email address');
          }

          // Get the quote creator (seller) for email notification
          const quoteCreator = await ctx.dataloaders.users.getUsersById.load(
            quote.createdBy,
          );

          if (!quoteCreator) {
            throw new Error('Quote creator not found');
          }

          // Generate PDF for the approved quote
          const pdfFileName = `Quote-${quote.id}-Approved.pdf`;
          let pdfAttachment: any;

          try {
            // Generate the PDF using PdfService (waits for completion)
            await ctx.services.pdfService.generatePdFAndLinkToEntity(
              quote.id,
              ctx.user,
              ctx.userToken || '',
              `print/sales-quote/${quote.sellerWorkspaceId}/${quote.id}`,
              quote.sellerWorkspaceId,
              pdfFileName,
            );

            // Get the most recent file for this quote
            const files = await ctx.services.fileService.getFilesByParentEntity(
              {
                workspace_id: quote.sellerWorkspaceId,
                parent_entity_id: quote.id,
              },
              ctx.user,
            );

            if (files.length > 0) {
              // Sort by created_at descending to get the most recent
              const sortedFiles = files.sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime(),
              );
              const pdfFile = sortedFiles[0];

              // Download PDF content from S3
              const pdfStream = await ctx.services.fileService.getFileContent(
                pdfFile._id,
                ctx.user,
              );

              // Convert stream to buffer
              const chunks: Buffer[] = [];
              for await (const chunk of pdfStream) {
                chunks.push(Buffer.from(chunk));
              }
              const pdfBuffer = Buffer.concat(chunks);

              // Create attachment
              pdfAttachment = {
                content: pdfBuffer.toString('base64'),
                filename: pdfFileName,
                type: 'application/pdf',
                disposition: 'attachment' as const,
              };
            }
          } catch (pdfError) {
            // Log PDF generation error but continue with email
            logger.error(
              {
                error: pdfError,
                quoteId: quote.id,
              },
              'Failed to generate PDF for approved quote',
            );
          }

          // Send confirmation email to buyer
          await ctx.services.emailService.sendTemplatedEmail({
            to: buyerContact.email,
            from: 'noreply@equipmentshare.com',
            subject: `Quote ${quote.id} has been approved`,
            title: 'Your Quote Has Been Approved',
            content: `Thank you! Your quote has been approved. The seller will now progress your order and keep you updated on the next steps.`,
            attachments: pdfAttachment ? [pdfAttachment] : undefined,
            bannerImgUrl: sellersWorkspace.bannerImageUrl,
            iconUrl: sellersWorkspace.logoUrl,
            workspaceId: sellersWorkspace.id,
            user: ctx.user,
          });

          // Send confirmation email to seller (quote creator)
          const quoteUrl = `${ctx.envConfig.ERP_CLIENT_URL}/app/${quote.sellerWorkspaceId}/sales-quotes/${quote.id}`;

          await ctx.services.emailService.sendTemplatedEmail({
            to: quoteCreator.email,
            from: 'noreply@equipmentshare.com',
            subject: `Quote ${quote.id} has been accepted`,
            title: 'Quote Accepted',
            content: `Great news! Your quote ${quote.id} has been accepted by the buyer. You can now proceed with fulfilling the order.`,
            primaryCTA: {
              text: 'View Quote',
              url: quoteUrl,
            },
            bannerImgUrl: sellersWorkspace.bannerImageUrl,
            iconUrl: sellersWorkspace.logoUrl,
            workspaceId: sellersWorkspace.id,
            user: ctx.user,
          });
        } catch (error) {
          // Log error but don't fail the mutation - quote is already accepted
          logger.error(
            {
              error,
              quoteId: quote.id,
            },
            'Failed to send quote acceptance notifications',
          );
        }

        return { quote: acceptedQuote, salesOrder, purchaseOrder };
      },
    });

    t.field('rejectQuote', {
      type: nonNull(Quote),
      args: {
        quoteId: nonNull(stringArg()),
      },
      async resolve(_root, { quoteId }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        const quote = await ctx.services.quotingService.rejectQuote(
          quoteId,
          ctx.user,
        );

        return quote;
      },
    });

    t.field('createRFQ', {
      type: nonNull(RFQ),
      args: {
        input: nonNull(arg({ type: CreateRFQInput })),
      },
      async resolve(_root, { input }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        // Process invited sellers
        const { userIds: invitedSellerUserIds } = await processInvitedSellers(
          input.invitedSellerContactIds,
          ctx,
        );

        const created = await ctx.services.quotingService.createRFQ(
          {
            buyersWorkspaceId: input.buyersWorkspaceId,
            responseDeadline: input.responseDeadline ?? undefined,
            invitedSellerContactIds: input.invitedSellerContactIds,
            invitedSellerUserIds,
            status: input.status ?? 'DRAFT',
            lineItems: input.lineItems.map(mapRFQLineItem),
          },
          ctx.user,
        );

        const buyersWorkspace =
          await ctx.services.workspaceService.getWorkspaceById(
            input.buyersWorkspaceId,
            ctx.user,
          );

        if (!buyersWorkspace) {
          throw new Error('Buyers workspace not found');
        }

        // Get the actual user objects with emails
        const users =
          await ctx.dataloaders.users.getUsersById.loadMany(
            invitedSellerUserIds,
          );
        const validUsers = users
          .filter((u): u is any => !(u instanceof Error) && u !== null)
          .filter((u) => u.email);

        await sendRFQInviteEmails(validUsers, created.id, buyersWorkspace, ctx);

        return created;
      },
    });

    t.field('updateRFQ', {
      type: nonNull(RFQ),
      args: {
        input: nonNull(arg({ type: UpdateRFQInput })),
      },
      async resolve(_root, { input }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        const { id, ...updates } = input;

        // TODO: Consider adding status-based restrictions for seller modifications
        // e.g., prevent adding/removing sellers after RFQ status is SENT or ACCEPTED

        // Check if sellers are being updated
        let invitedSellerUserIds: string[] | undefined;
        let newSellerUserIds: string[] = [];

        if (
          updates.invitedSellerContactIds !== undefined &&
          updates.invitedSellerContactIds !== null
        ) {
          // Fetch the existing RFQ to compare sellers
          const existingRFQ = await ctx.services.quotingService.getRFQById(
            id,
            ctx.user,
          );

          if (!existingRFQ) {
            throw new Error('RFQ not found');
          }

          // Find newly added seller contact IDs
          const existingSellerContactIds = new Set(
            existingRFQ.invitedSellerContactIds,
          );
          const newSellerContactIds = updates.invitedSellerContactIds.filter(
            (contactId: string) => !existingSellerContactIds.has(contactId),
          );

          // Process all invited sellers to get user IDs
          const { userIds: allUserIds } = await processInvitedSellers(
            updates.invitedSellerContactIds,
            ctx,
          );
          invitedSellerUserIds = allUserIds;

          // If there are new sellers, process them for emails
          if (newSellerContactIds.length > 0) {
            const { userIds: newUserIds } = await processInvitedSellers(
              newSellerContactIds,
              ctx,
            );
            newSellerUserIds = newUserIds;
          }
        }

        const updateData: any = {};
        if (updates.responseDeadline !== undefined) {
          updateData.responseDeadline = updates.responseDeadline;
        }
        if (updates.invitedSellerContactIds !== undefined) {
          updateData.invitedSellerContactIds = updates.invitedSellerContactIds;
        }
        if (invitedSellerUserIds !== undefined) {
          updateData.invitedSellerUserIds = invitedSellerUserIds;
        }
        if (updates.status !== undefined) {
          updateData.status = updates.status;
        }
        if (updates.lineItems !== undefined && updates.lineItems !== null) {
          updateData.lineItems = updates.lineItems.map(mapRFQLineItem);
        }
        updateData.updatedBy = ctx.user.id;

        const updated = await ctx.services.quotingService.updateRFQ(
          id,
          updateData,
          ctx.user,
        );

        if (!updated) {
          throw new Error('RFQ not found or not authorized');
        }

        // Send emails to newly added sellers only
        if (newSellerUserIds.length > 0) {
          const buyersWorkspace =
            await ctx.services.workspaceService.getWorkspaceById(
              updated.buyersWorkspaceId,
              ctx.user,
            );

          if (!buyersWorkspace) {
            throw new Error('Buyers workspace not found');
          }

          // Get the actual user objects with emails for new sellers
          const newUsers =
            await ctx.dataloaders.users.getUsersById.loadMany(newSellerUserIds);
          const validNewUsers = newUsers
            .filter((u): u is any => !(u instanceof Error) && u !== null)
            .filter((u) => u.email);

          await sendRFQInviteEmails(
            validNewUsers,
            updated.id,
            buyersWorkspace,
            ctx,
          );
        }

        return updated;
      },
    });

    t.field('createQuoteFromIntakeFormSubmission', {
      type: nonNull(Quote),
      args: {
        input: nonNull(arg({ type: CreateQuoteFromIntakeFormSubmissionInput })),
      },
      async resolve(_root, { input }, ctx: GraphQLContext) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        // 1. Fetch the intake form submission
        const submission =
          await ctx.services.intakeFormService.getIntakeFormSubmissionById(
            input.intakeFormSubmissionId,
            ctx.user,
          );

        if (!submission) {
          throw new Error('Intake form submission not found');
        }

        // 2. Validate submission is in SUBMITTED status
        if (submission.status !== 'SUBMITTED') {
          throw new Error(
            'Can only create quotes from submitted intake form submissions',
          );
        }

        // 3. Get line items for the submission
        const lineItems =
          await ctx.services.intakeFormService.getLineItemsBySubmissionId(
            input.intakeFormSubmissionId,
            ctx.user,
          );

        // 4. Create the quote with intake form reference
        const quote = await ctx.services.quotingService.createQuote(
          {
            sellerWorkspaceId: submission.workspaceId,
            sellersBuyerContactId: input.sellersBuyerContactId,
            sellersProjectId: input.sellersProjectId,
            buyerWorkspaceId: submission.buyerWorkspaceId ?? undefined,
            status: 'ACTIVE',
            validUntil: input.validUntil ?? undefined,
            intakeFormSubmissionId: input.intakeFormSubmissionId,
          },
          ctx.user,
        );

        // 5. Map intake form line items to quote revision line items
        // Filter out any line items that can't be converted (skip SERVICE types from intake)
        const quoteLineItems = lineItems
          .filter((item) => item.type === 'RENTAL' || item.type === 'PURCHASE')
          .map((item) => {
            // Map PURCHASE to SALE type
            const type = item.type === 'PURCHASE' ? 'SALE' : item.type;

            const baseFields = {
              type: type as 'RENTAL' | 'SALE',
              description: item.description,
              quantity: item.quantity,
              pimCategoryId: item.pimCategoryId,
              sellersPriceId: item.priceId ?? undefined, // May be undefined
              intakeFormSubmissionLineItemId: item.id,
              deliveryMethod: item.deliveryMethod ?? undefined,
              deliveryLocation: item.deliveryLocation ?? undefined,
              deliveryNotes: item.deliveryNotes ?? undefined,
            };

            if (type === 'RENTAL') {
              return {
                ...baseFields,
                rentalStartDate: item.rentalStartDate
                  ? new Date(item.rentalStartDate)
                  : new Date(item.startDate),
                rentalEndDate: item.rentalEndDate
                  ? new Date(item.rentalEndDate)
                  : new Date(
                      new Date(item.startDate).getTime() +
                        item.durationInDays * 24 * 60 * 60 * 1000,
                    ),
              } as QuoteRevisionRentalLineItemType;
            }

            return baseFields as QuoteRevisionSaleLineItemType;
          });

        // 6. Create the quote revision with line items
        const revision = await ctx.services.quotingService.createQuoteRevision(
          {
            quoteId: quote.id,
            revisionNumber: 1,
            validUntil: input.validUntil ?? undefined,
            lineItems: quoteLineItems,
          },
          ctx.user,
        );

        // 7. Update the quote with the current revision
        await ctx.services.quotingService.updateQuote(
          quote.id,
          { currentRevisionId: revision.id },
          ctx.user,
        );

        // 8. Return the updated quote
        const updatedQuote = await ctx.services.quotingService.getQuoteById(
          quote.id,
          ctx.user,
        );

        if (!updatedQuote) {
          throw new Error('Failed to retrieve created quote');
        }

        return updatedQuote;
      },
    });
  },
});
