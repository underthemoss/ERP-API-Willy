import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';
import { WorkspaceAccessType } from './generated/graphql';
import { v4 } from 'uuid';

// GraphQL operations for codegen (for reference, not used directly in tests)

gql`
  mutation CreateRFQ($input: CreateRFQInput!) {
    createRFQ(input: $input) {
      id
      buyersWorkspaceId
      responseDeadline
      invitedSellerContactIds
      status
      createdAt
      updatedAt
      createdBy
      createdByUser {
        id
        email
      }
      updatedByUser {
        id
        email
      }
      updatedBy
      lineItems {
        __typename
        ... on RFQServiceLineItem {
          id
          description
          quantity
          type
        }
        ... on RFQRentalLineItem {
          id
          description
          quantity
          type
          pimCategoryId
          rentalStartDate
          rentalEndDate
        }
        ... on RFQSaleLineItem {
          id
          description
          quantity
          type
          pimCategoryId
        }
      }
    }
  }
`;

gql`
  mutation UpdateRFQ($input: UpdateRFQInput!) {
    updateRFQ(input: $input) {
      id
      buyersWorkspaceId
      responseDeadline
      invitedSellerContactIds
      status
      updatedAt
      updatedBy
      lineItems {
        ... on RFQServiceLineItem {
          id
          description
          quantity
          type
        }
        ... on RFQRentalLineItem {
          id
          description
          quantity
          type
          pimCategoryId
          rentalStartDate
          rentalEndDate
        }
        ... on RFQSaleLineItem {
          id
          description
          quantity
          type
          pimCategoryId
        }
      }
    }
  }
`;

gql`
  query GetRFQWithRelationships($id: String!) {
    rfqById(id: $id) {
      id
      buyersWorkspaceId
      status
      invitedSellerContactIds
      createdBy
      updatedBy
      createdByUser {
        id
        email
      }
      updatedByUser {
        id
        email
      }
      invitedSellerContacts {
        ... on BusinessContact {
          id
          name
          contactType
        }
        ... on PersonContact {
          id
          name
          contactType
        }
      }
      lineItems {
        __typename
        ... on RFQRentalLineItem {
          id
          description
          pimCategoryId
          pimCategory {
            id
            name
          }
          rentalStartDate
          rentalEndDate
        }
      }
    }
  }
`;

gql`
  query ListRFQs($filter: ListRFQsFilter!, $page: ListRFQsPage!) {
    listRFQs(filter: $filter, page: $page) {
      items {
        id
        buyersWorkspaceId
        status
        invitedSellerContactIds
        createdAt
        updatedAt
        createdBy
        updatedBy
        lineItems {
          __typename
          ... on RFQServiceLineItem {
            id
            description
            quantity
            type
          }
          ... on RFQRentalLineItem {
            id
            description
            quantity
            type
            pimCategoryId
            rentalStartDate
            rentalEndDate
          }
          ... on RFQSaleLineItem {
            id
            description
            quantity
            type
            pimCategoryId
          }
        }
      }
      page {
        number
        size
        totalItems
        totalPages
      }
    }
  }
`;

gql`
  mutation CreateQuoteLinkedToRFQ($input: CreateQuoteInput!) {
    createQuote(input: $input) {
      id
      rfqId
      sellerWorkspaceId
      sellersBuyerContactId
      sellersProjectId
      status
      createdAt
      createdBy
    }
  }
`;

gql`
  query ListQuotesByRFQId($query: ListQuotesQuery) {
    listQuotes(query: $query) {
      items {
        id
        rfqId
        status
        sellerWorkspaceId
      }
    }
  }
`;

gql`
  mutation CreatePimCategoryForRFQ($input: UpsertPimCategoryInput!) {
    upsertPimCategory(input: $input) {
      id
      name
    }
  }
`;

gql`
  mutation CreatePersonContactForRFQ($input: PersonContactInput!) {
    createPersonContact(input: $input) {
      id
      name
      email
      businessId
      contactType
    }
  }
`;

gql`
  mutation CreateQuoteForRFQTest($input: CreateQuoteInput!) {
    createQuote(input: $input) {
      id
      rfqId
      sellerWorkspaceId
      sellersBuyerContactId
      buyerWorkspaceId
      sellersProjectId
      status
      createdAt
      createdBy
    }
  }
`;

gql`
  mutation CreateQuoteRevisionForRFQTest($input: CreateQuoteRevisionInput!) {
    createQuoteRevision(input: $input) {
      id
      quoteId
      revisionNumber
      status
      lineItems {
        __typename
        ... on QuoteRevisionRentalLineItem {
          id
          description
          quantity
          rentalStartDate
          rentalEndDate
        }
      }
    }
  }
`;

gql`
  mutation SendQuoteForRFQTest($input: SendQuoteInput!) {
    sendQuote(input: $input) {
      id
      status
      currentRevisionId
      currentRevision {
        id
        status
      }
    }
  }
`;

gql`
  mutation AcceptQuoteForRFQTest($input: AcceptQuoteInput!) {
    acceptQuote(input: $input) {
      quote {
        id
        status
        buyerAcceptedFullLegalName
      }
      salesOrder {
        id
        workspace_id
        project_id
        buyer_id
        line_items {
          __typename
          ... on RentalSalesOrderLineItem {
            id
            lineitem_type
            so_pim_id
            so_quantity
            price_id
            delivery_date
            off_rent_date
            delivery_method
            delivery_location
            deliveryNotes
            quote_revision_line_item_id
          }
          ... on SaleSalesOrderLineItem {
            id
            lineitem_type
            so_pim_id
            so_quantity
            price_id
            delivery_date
            delivery_method
            delivery_location
            deliveryNotes
            quote_revision_line_item_id
          }
        }
      }
      purchaseOrder {
        id
        workspace_id
        project_id
        seller_id
        line_items {
          __typename
          ... on RentalPurchaseOrderLineItem {
            id
            lineitem_type
            po_pim_id
            po_quantity
            price_id
            delivery_date
            off_rent_date
            delivery_method
            delivery_location
            deliveryNotes
            quote_revision_line_item_id
          }
          ... on SalePurchaseOrderLineItem {
            id
            lineitem_type
            po_pim_id
            po_quantity
            price_id
            delivery_date
            delivery_method
            delivery_location
            deliveryNotes
            quote_revision_line_item_id
          }
        }
      }
    }
  }
`;

gql`
  mutation RejectQuoteForRFQTest($quoteId: String!) {
    rejectQuote(quoteId: $quoteId) {
      id
      status
    }
  }
`;

gql`
  query GetQuoteForRFQTest($id: String!) {
    quoteById(id: $id) {
      id
      status
      rfqId
      buyerWorkspaceId
      sellerWorkspaceId
      currentRevisionId
      buyerAcceptedFullLegalName
      currentRevision {
        id
        status
        validUntil
      }
    }
  }
`;

gql`
  query GetRFQForQuoteAcceptance($id: String!) {
    rfqById(id: $id) {
      id
      status
    }
  }
`;

gql`
  query GetQuoteRevisionForAcceptanceTest($id: String!) {
    quoteRevisionById(id: $id) {
      id
      quoteId
      revisionNumber
      status
      lineItems {
        __typename
        ... on QuoteRevisionRentalLineItem {
          id
          description
          quantity
          pimCategoryId
          rentalStartDate
          rentalEndDate
          sellersPriceId
        }
      }
    }
  }
`;

const { createClient } = createTestEnvironment();

// Test data constants
const TEST_DATES = {
  RENTAL_START: '2025-06-01',
  RENTAL_END: '2025-06-30',
};

// Helper functions for test data creation
async function createTestPimCategory(
  sdk: any,
  namePrefix: string,
): Promise<string> {
  const id = `rfq-cat-${namePrefix.toLowerCase().replace(/\s+/g, '-')}`;
  const { upsertPimCategory } = await sdk.CreatePimCategoryForRFQ({
    input: {
      id,
      name: namePrefix,
      path: `|${namePrefix.toLowerCase().replace(/\s+/g, '-')}|`,
      description: `${namePrefix} category`,
      has_products: false,
      platform_id: 'test-platform',
    },
  });
  expect(upsertPimCategory).toBeDefined();
  return upsertPimCategory!.id;
}

async function createTestSellerContact(
  sdk: any,
  workspaceId: string,
  name: string,
): Promise<string> {
  // First create the business contact (the company)
  const { createBusinessContact } = await sdk.CreateBusinessContact({
    input: { workspaceId, name },
  });
  expect(createBusinessContact).toBeDefined();
  const businessId = createBusinessContact!.id;

  // Then create a person contact associated with that business
  const { createPersonContact } = await sdk.CreatePersonContactForRFQ({
    input: {
      workspaceId,
      name: `${name} Sales Rep`,
      email: `sales-${v4()}@example.com`,
      businessId,
    },
  });
  expect(createPersonContact).toBeDefined();

  // Return the person contact ID (not the business ID)
  return createPersonContact!.id;
}

async function createTestBuyerContact(
  sdk: any,
  workspaceId: string,
  name: string,
  email?: string,
): Promise<string> {
  const { createBusinessContact } = await sdk.CreateBusinessContact({
    input: { workspaceId, name },
  });
  expect(createBusinessContact).toBeDefined();
  const businessId = createBusinessContact!.id;

  // If userId is provided, create a person contact with that user ID
  // This allows the user to accept quotes directly
  const { createPersonContact } = await sdk.CreatePersonContactForRFQ({
    input: {
      workspaceId,
      name: `${name} Representative`,
      email: email || `buyer-${v4()}@example.com`,
      businessId,
    },
  });

  expect(createPersonContact).toBeDefined();
  return createPersonContact!.id;
}

async function createTestProject(
  sdk: any,
  workspaceId: string,
  name: string,
  code: string,
): Promise<string> {
  const { createProject } = await sdk.CreateProject({
    input: {
      workspaceId,
      name,
      deleted: false,
      project_code: code,
    },
  });
  expect(createProject).toBeDefined();
  return createProject!.id;
}

interface RentalLineItemParams {
  pimCategoryId: string;
  description?: string;
  quantity?: number;
  rentalStartDate?: string;
  rentalEndDate?: string;
}

function createRentalLineItem(params: RentalLineItemParams) {
  return {
    type: 'RENTAL' as any,
    description: params.description || 'Test rental item',
    quantity: params.quantity || 1,
    pimCategoryId: params.pimCategoryId,
    rentalStartDate: params.rentalStartDate
      ? new Date(params.rentalStartDate)
      : new Date(TEST_DATES.RENTAL_START),
    rentalEndDate: params.rentalEndDate
      ? new Date(params.rentalEndDate)
      : new Date(TEST_DATES.RENTAL_END),
  };
}

interface ServiceLineItemParams {
  description?: string;
  quantity?: number;
}

function createServiceLineItem(params: ServiceLineItemParams = {}) {
  return {
    type: 'SERVICE' as any,
    description: params.description || 'Test service item',
    quantity: params.quantity || 1,
  };
}

interface SaleLineItemParams {
  pimCategoryId: string;
  description?: string;
  quantity?: number;
}

function createSaleLineItem(params: SaleLineItemParams) {
  return {
    type: 'SALE' as any,
    description: params.description || 'Test sale item',
    quantity: params.quantity || 1,
    pimCategoryId: params.pimCategoryId,
  };
}

interface CreateTestQuoteParams {
  sdk: any;
  workspaceId: string;
  buyerContactId?: string;
  buyerEmail?: string; // If provided, creates a person contact with this email
  projectId: string;
  buyerWorkspaceId?: string;
  rfqId?: string;
  pimCategoryId: string;
  validUntil?: Date;
  deliveryMethod?: 'PICKUP' | 'DELIVERY';
  deliveryLocation?: string;
  deliveryNotes?: string;
}

async function createTestQuoteWithRevision(
  params: CreateTestQuoteParams,
): Promise<{
  quoteId: string;
  revisionId: string;
}> {
  const {
    sdk,
    workspaceId,
    projectId,
    buyerWorkspaceId,
    rfqId,
    pimCategoryId,
    validUntil,
    buyerEmail,
    deliveryMethod,
    deliveryLocation,
    deliveryNotes,
  } = params;

  // Create buyer contact if not provided
  const buyerContactId =
    params.buyerContactId ||
    (await createTestBuyerContact(
      sdk,
      workspaceId,
      'Buyer Contact',
      buyerEmail,
    ));

  // Create a price book and rental price for the line items
  const { createPriceBook } = await sdk.CreatePriceBookForPrices({
    input: { name: 'Test Price Book', workspaceId },
  });
  expect(createPriceBook).toBeDefined();
  const priceBookId = createPriceBook!.id;

  const { createRentalPrice } = await sdk.CreateRentalPriceForPrices({
    input: {
      workspaceId,
      name: 'Test Rental Price',
      pimCategoryId,
      priceBookId,
      pricePerDayInCents: 100,
      pricePerWeekInCents: 500,
      pricePerMonthInCents: 1500,
    },
  });
  expect(createRentalPrice).toBeDefined();
  const rentalPriceId = createRentalPrice!.id;

  // Create quote
  const quoteInput: any = {
    sellerWorkspaceId: workspaceId,
    sellersProjectId: projectId,
    sellersBuyerContactId: buyerContactId,
  };

  if (buyerWorkspaceId) {
    quoteInput.buyerWorkspaceId = buyerWorkspaceId;
  }
  if (rfqId) {
    quoteInput.rfqId = rfqId;
  }

  const { createQuote } = await sdk.CreateQuoteForRFQTest({
    input: quoteInput,
  });
  expect(createQuote).toBeDefined();
  const quoteId = createQuote!.id;

  // Create revision with rental line items
  const lineItem: Record<string, unknown> = {
    type: 'RENTAL',
    description: 'Test rental equipment',
    quantity: 2,
    pimCategoryId,
    rentalStartDate: new Date(TEST_DATES.RENTAL_START),
    rentalEndDate: new Date(TEST_DATES.RENTAL_END),
    sellersPriceId: rentalPriceId,
  };

  // Add delivery fields if provided
  if (deliveryMethod) {
    lineItem.deliveryMethod = deliveryMethod;
  }
  if (deliveryLocation) {
    lineItem.deliveryLocation = deliveryLocation;
  }
  if (deliveryNotes) {
    lineItem.deliveryNotes = deliveryNotes;
  }

  const revisionInput: any = {
    quoteId,
    revisionNumber: 1,
    lineItems: [lineItem],
  };

  if (validUntil) {
    revisionInput.validUntil = validUntil;
  }

  const { createQuoteRevision } = await sdk.CreateQuoteRevisionForRFQTest({
    input: revisionInput,
  });
  expect(createQuoteRevision).toBeDefined();
  const revisionId = createQuoteRevision!.id;

  // Send the quote to make it ACTIVE
  const { sendQuote } = await sdk.SendQuoteForRFQTest({
    input: {
      quoteId,
      revisionId,
    },
  });
  expect(sendQuote).toBeDefined();
  expect(sendQuote?.status).toBe('ACTIVE');

  return { quoteId, revisionId };
}

describe('RFQ CRUD e2e', () => {
  describe('Basic CRUD operations', () => {
    it('creates an RFQ with rental line items', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const pimCategoryId = await createTestPimCategory(sdk, 'Excavators');
      const sellerContactId = await createTestSellerContact(
        sdk,
        workspaceId,
        'Seller Company A',
      );

      const input = {
        buyersWorkspaceId: workspaceId,
        invitedSellerContactIds: [sellerContactId],
        lineItems: [
          createRentalLineItem({
            pimCategoryId,
            description: 'Excavator rental for construction project',
            quantity: 2,
            rentalStartDate: '2025-12-01',
            rentalEndDate: '2025-12-15',
          }),
        ],
      };

      const { createRFQ } = await sdk.CreateRFQ({ input });
      expect(createRFQ).toBeDefined();
      expect(createRFQ?.buyersWorkspaceId).toBe(workspaceId);
      expect(createRFQ?.status).toBe('DRAFT');
      expect(createRFQ?.invitedSellerContactIds).toContain(sellerContactId);
      expect(createRFQ?.lineItems).toHaveLength(1);

      const lineItem = createRFQ!.lineItems[0];
      expect(lineItem.type).toBe('RENTAL');
      expect(lineItem.description).toBe(
        'Excavator rental for construction project',
      );
      expect(lineItem.quantity).toBe(2);
    });

    it('creates an RFQ with mixed line item types', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const rentalCategoryId = await createTestPimCategory(sdk, 'Bulldozers');
      const saleCategoryId = await createTestPimCategory(
        sdk,
        'Safety Equipment',
      );
      const sellerContactId = await createTestSellerContact(
        sdk,
        workspaceId,
        'Seller Company B',
      );

      const input = {
        buyersWorkspaceId: workspaceId,
        invitedSellerContactIds: [sellerContactId],
        lineItems: [
          createRentalLineItem({
            pimCategoryId: rentalCategoryId,
            description: 'Bulldozer rental',
            quantity: 1,
            // subtotalInCents calculated server-side
            rentalStartDate: '2025-11-01',
            rentalEndDate: '2025-11-30',
          }),
          createServiceLineItem({
            description: 'Equipment delivery and setup',
            quantity: 1,
            // subtotalInCents calculated server-side: 500.0 * 1 = 500
          }),
          createSaleLineItem({
            pimCategoryId: saleCategoryId,
            description: 'Safety helmets',
            quantity: 10,
            // subtotalInCents calculated server-side: 15.0 * 10 = 150
          }),
        ],
      };

      const { createRFQ } = await sdk.CreateRFQ({ input });
      expect(createRFQ).toBeDefined();
      expect(createRFQ?.lineItems).toHaveLength(3);

      const lineItems = createRFQ!.lineItems;
      expect(lineItems[0].type).toBe('RENTAL');
      expect(lineItems[1].type).toBe('SERVICE');
      expect(lineItems[2].type).toBe('SALE');
    });

    it('updates an RFQ status and invited sellers', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const pimCategoryId = await createTestPimCategory(sdk, 'Forklifts');
      const seller1Id = await createTestSellerContact(
        sdk,
        workspaceId,
        'Initial Seller',
      );
      const seller2Id = await createTestSellerContact(
        sdk,
        workspaceId,
        'Additional Seller',
      );

      const createInput = {
        buyersWorkspaceId: workspaceId,
        invitedSellerContactIds: [seller1Id],
        lineItems: [
          createRentalLineItem({
            pimCategoryId,
            description: 'Forklift rental',
            quantity: 1,
            rentalStartDate: '2025-10-01',
            rentalEndDate: '2025-10-31',
          }),
        ],
      };

      const { createRFQ } = await sdk.CreateRFQ({ input: createInput });
      expect(createRFQ).toBeDefined();
      const rfqId = createRFQ!.id;

      const updateInput = {
        id: rfqId,
        status: 'SENT' as any,
        invitedSellerContactIds: [seller1Id, seller2Id],
      };

      const { updateRFQ } = await sdk.UpdateRFQ({ input: updateInput });
      expect(updateRFQ).toBeDefined();
      expect(updateRFQ?.status).toBe('SENT');
      expect(updateRFQ?.invitedSellerContactIds).toHaveLength(2);
      expect(updateRFQ?.invitedSellerContactIds).toContain(seller1Id);
      expect(updateRFQ?.invitedSellerContactIds).toContain(seller2Id);
    });

    it('updates RFQ line items', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const pimCategoryId = await createTestPimCategory(sdk, 'Cranes');
      const sellerContactId = await createTestSellerContact(
        sdk,
        workspaceId,
        'Crane Seller',
      );

      const createInput = {
        buyersWorkspaceId: workspaceId,
        invitedSellerContactIds: [sellerContactId],
        lineItems: [
          createRentalLineItem({
            pimCategoryId,
            description: 'Small crane rental',
            quantity: 1,
            rentalStartDate: '2025-09-01',
            rentalEndDate: '2025-09-30',
          }),
        ],
      };

      const { createRFQ } = await sdk.CreateRFQ({ input: createInput });
      expect(createRFQ).toBeDefined();
      const rfqId = createRFQ!.id;

      const updateInput = {
        id: rfqId,
        lineItems: [
          createRentalLineItem({
            pimCategoryId,
            description: 'Small crane rental - updated',
            quantity: 2,
            rentalStartDate: '2025-09-01',
            rentalEndDate: '2025-09-30',
          }),
          createServiceLineItem({
            description: 'Crane operator service',
            quantity: 1,
          }),
        ],
      };

      const { updateRFQ } = await sdk.UpdateRFQ({ input: updateInput });
      expect(updateRFQ).toBeDefined();
      expect(updateRFQ?.lineItems).toHaveLength(2);
      expect(updateRFQ?.lineItems[0].quantity).toBe(2);
      expect(updateRFQ?.lineItems[0].description).toBe(
        'Small crane rental - updated',
      );
      expect(updateRFQ?.lineItems[1].type).toBe('SERVICE');
    });
  });

  describe('Relationship resolution tests', () => {
    it('resolves invitedSellerContacts relationship', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const pimCategoryId = await createTestPimCategory(sdk, 'Dump Trucks');
      const seller1Id = await createTestSellerContact(
        sdk,
        workspaceId,
        'Seller Relationship Test 1',
      );
      const seller2Id = await createTestSellerContact(
        sdk,
        workspaceId,
        'Seller Relationship Test 2',
      );

      const createInput = {
        buyersWorkspaceId: workspaceId,
        invitedSellerContactIds: [seller1Id, seller2Id],
        lineItems: [
          createRentalLineItem({
            pimCategoryId,
            description: 'Dump truck rental',
            quantity: 1,
            rentalStartDate: '2025-08-01',
            rentalEndDate: '2025-08-31',
          }),
        ],
      };

      const { createRFQ } = await sdk.CreateRFQ({ input: createInput });
      expect(createRFQ).toBeDefined();
      const rfqId = createRFQ!.id;

      const { rfqById } = await sdk.GetRFQWithRelationships({ id: rfqId });
      expect(rfqById).toBeDefined();
      expect(rfqById?.invitedSellerContacts).toHaveLength(2);

      const contactIds = rfqById?.invitedSellerContacts?.map((c) => c.id);
      expect(contactIds).toContain(seller1Id);
      expect(contactIds).toContain(seller2Id);

      const contact1 = rfqById?.invitedSellerContacts?.find(
        (c) => c.id === seller1Id,
      );
      expect(contact1?.name).toBe('Seller Relationship Test 1 Sales Rep');
      expect(contact1?.contactType).toBe('PERSON');
    });

    it('resolves createdByUser and updatedByUser relationships', async () => {
      const { sdk, user, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const pimCategoryId = await createTestPimCategory(sdk, 'Generators');
      const sellerContactId = await createTestSellerContact(
        sdk,
        workspaceId,
        'Generator Seller',
      );

      const createInput = {
        buyersWorkspaceId: workspaceId,
        invitedSellerContactIds: [sellerContactId],
        lineItems: [
          createRentalLineItem({
            pimCategoryId,
            description: 'Generator rental',
            quantity: 1,
            rentalStartDate: '2025-07-01',
            rentalEndDate: '2025-07-31',
          }),
        ],
      };

      const { createRFQ } = await sdk.CreateRFQ({ input: createInput });
      expect(createRFQ).toBeDefined();
      const rfqId = createRFQ!.id;

      const { rfqById } = await sdk.GetRFQWithRelationships({ id: rfqId });
      expect(rfqById).toBeDefined();
      expect(rfqById?.createdByUser).toBeDefined();
      expect(rfqById?.createdByUser?.id).toBe(user.id);
      expect(rfqById?.updatedByUser).toBeDefined();
      expect(rfqById?.updatedByUser?.id).toBe(user.id);
    });

    it('resolves pimCategory on rental line items', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const pimCategoryId = await createTestPimCategory(sdk, 'Compressors');
      const sellerContactId = await createTestSellerContact(
        sdk,
        workspaceId,
        'Compressor Seller',
      );

      const createInput = {
        buyersWorkspaceId: workspaceId,
        invitedSellerContactIds: [sellerContactId],
        lineItems: [
          createRentalLineItem({
            pimCategoryId,
            description: 'Air compressor rental',
            quantity: 1,
          }),
        ],
      };

      const { createRFQ } = await sdk.CreateRFQ({ input: createInput });
      expect(createRFQ).toBeDefined();
      const rfqId = createRFQ!.id;

      const { rfqById } = await sdk.GetRFQWithRelationships({ id: rfqId });
      expect(rfqById).toBeDefined();
      expect(rfqById?.lineItems).toHaveLength(1);
      console.log('\n\n\n\n\n rfqById', JSON.stringify(rfqById, null, 2));

      const lineItem = rfqById!.lineItems[0];
      if (lineItem.__typename === 'RFQRentalLineItem') {
        expect(lineItem.pimCategory).toBeDefined();
        expect(lineItem.pimCategory?.id).toBe(pimCategoryId);
        expect(lineItem.pimCategory?.name).toBe('Compressors');
      } else {
        throw new Error('Expected RFQRentalLineItem');
      }
    });
  });

  describe('Status transition tests', () => {
    it('creates RFQ in DRAFT status and transitions to SENT', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const pimCategoryId = await createTestPimCategory(sdk, 'Loaders');
      const sellerContactId = await createTestSellerContact(
        sdk,
        workspaceId,
        'Loader Seller',
      );

      const createInput = {
        buyersWorkspaceId: workspaceId,
        invitedSellerContactIds: [sellerContactId],
        lineItems: [
          createRentalLineItem({
            pimCategoryId,
            description: 'Loader rental',
            quantity: 1,
            rentalStartDate: '2025-05-01',
            rentalEndDate: '2025-05-31',
          }),
        ],
      };

      const { createRFQ } = await sdk.CreateRFQ({ input: createInput });
      expect(createRFQ).toBeDefined();
      expect(createRFQ?.status).toBe('DRAFT');
      const rfqId = createRFQ!.id;

      const updateInput = {
        id: rfqId,
        status: 'SENT' as any,
      };

      const { updateRFQ } = await sdk.UpdateRFQ({ input: updateInput });
      expect(updateRFQ).toBeDefined();
      expect(updateRFQ?.status).toBe('SENT');
    });

    it('transitions RFQ through multiple statuses: DRAFT -> SENT -> ACCEPTED', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const pimCategoryId = await createTestPimCategory(sdk, 'Mixers');
      const sellerContactId = await createTestSellerContact(
        sdk,
        workspaceId,
        'Mixer Seller',
      );

      const createInput = {
        buyersWorkspaceId: workspaceId,
        invitedSellerContactIds: [sellerContactId],
        lineItems: [
          createRentalLineItem({
            pimCategoryId,
            description: 'Concrete mixer rental',
            quantity: 1,
            rentalStartDate: '2025-04-01',
            rentalEndDate: '2025-04-30',
          }),
        ],
      };

      const { createRFQ } = await sdk.CreateRFQ({ input: createInput });
      expect(createRFQ).toBeDefined();
      expect(createRFQ?.status).toBe('DRAFT');
      const rfqId = createRFQ!.id;

      const { updateRFQ: sentRFQ } = await sdk.UpdateRFQ({
        input: { id: rfqId, status: 'SENT' as any },
      });
      expect(sentRFQ?.status).toBe('SENT');

      const { updateRFQ: acceptedRFQ } = await sdk.UpdateRFQ({
        input: { id: rfqId, status: 'ACCEPTED' as any },
      });
      expect(acceptedRFQ?.status).toBe('ACCEPTED');
    });

    it('transitions RFQ to REJECTED status', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const pimCategoryId = await createTestPimCategory(sdk, 'Scaffolding');
      const sellerContactId = await createTestSellerContact(
        sdk,
        workspaceId,
        'Scaffolding Seller',
      );

      const createInput = {
        buyersWorkspaceId: workspaceId,
        invitedSellerContactIds: [sellerContactId],
        status: 'SENT' as any,
        lineItems: [
          createRentalLineItem({
            pimCategoryId,
            description: 'Scaffolding rental',
            quantity: 10,
            rentalStartDate: '2025-03-01',
            rentalEndDate: '2025-03-31',
          }),
        ],
      };

      const { createRFQ } = await sdk.CreateRFQ({ input: createInput });
      expect(createRFQ).toBeDefined();
      const rfqId = createRFQ!.id;

      const { updateRFQ } = await sdk.UpdateRFQ({
        input: { id: rfqId, status: 'REJECTED' as any },
      });
      expect(updateRFQ?.status).toBe('REJECTED');
    });

    it('transitions RFQ to CANCELLED status', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const pimCategoryId = await createTestPimCategory(sdk, 'Welders');
      const sellerContactId = await createTestSellerContact(
        sdk,
        workspaceId,
        'Welder Seller',
      );

      const createInput = {
        buyersWorkspaceId: workspaceId,
        invitedSellerContactIds: [sellerContactId],
        lineItems: [
          createRentalLineItem({
            pimCategoryId,
            description: 'Welder rental',
            quantity: 1,
            rentalStartDate: '2025-02-01',
            rentalEndDate: '2025-02-28',
          }),
        ],
      };

      const { createRFQ } = await sdk.CreateRFQ({ input: createInput });
      expect(createRFQ).toBeDefined();
      const rfqId = createRFQ!.id;

      const { updateRFQ } = await sdk.UpdateRFQ({
        input: { id: rfqId, status: 'CANCELLED' as any },
      });
      expect(updateRFQ?.status).toBe('CANCELLED');
    });

    it('transitions RFQ to EXPIRED status', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const pimCategoryId = await createTestPimCategory(sdk, 'Pumps');
      const sellerContactId = await createTestSellerContact(
        sdk,
        workspaceId,
        'Pump Seller',
      );

      const responseDeadline = new Date('2025-01-15');
      const createInput = {
        buyersWorkspaceId: workspaceId,
        responseDeadline: responseDeadline.toISOString(),
        invitedSellerContactIds: [sellerContactId],
        lineItems: [
          createRentalLineItem({
            pimCategoryId,
            description: 'Water pump rental',
            quantity: 2,
            rentalStartDate: '2025-01-20',
            rentalEndDate: '2025-02-20',
          }),
        ],
      };

      const { createRFQ } = await sdk.CreateRFQ({ input: createInput });
      expect(createRFQ).toBeDefined();
      expect(createRFQ?.responseDeadline).toBe(responseDeadline.toISOString());
      const rfqId = createRFQ!.id;

      const { updateRFQ } = await sdk.UpdateRFQ({
        input: { id: rfqId, status: 'EXPIRED' as any },
      });
      expect(updateRFQ?.status).toBe('EXPIRED');
    });
  });

  describe('Quote-to-RFQ integration tests', () => {
    it('creates a quote linked to an RFQ', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const pimCategoryId = await createTestPimCategory(sdk, 'Trailers');
      const sellerContactId = await createTestSellerContact(
        sdk,
        workspaceId,
        'Trailer Seller',
      );
      const buyerContactId = await createTestBuyerContact(
        sdk,
        workspaceId,
        'Buyer Company',
      );
      const projectId = await createTestProject(
        sdk,
        workspaceId,
        'Integration Test Project',
        'ITP-001',
      );

      const rfqInput = {
        buyersWorkspaceId: workspaceId,
        invitedSellerContactIds: [sellerContactId],
        lineItems: [
          createRentalLineItem({
            pimCategoryId,
            description: 'Trailer rental',
            quantity: 1,
          }),
        ],
      };

      const { createRFQ } = await sdk.CreateRFQ({ input: rfqInput });
      expect(createRFQ).toBeDefined();
      const rfqId = createRFQ!.id;

      const quoteInput = {
        sellerWorkspaceId: workspaceId,
        sellersBuyerContactId: buyerContactId,
        sellersProjectId: projectId,
        rfqId,
      };

      const { createQuote } = await sdk.CreateQuoteLinkedToRFQ({
        input: quoteInput,
      });
      expect(createQuote).toBeDefined();
      expect(createQuote?.rfqId).toBe(rfqId);
      expect(createQuote?.sellerWorkspaceId).toBe(workspaceId);
      expect(createQuote?.status).toBe('ACTIVE');
    });

    it('filters quotes by RFQ ID', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const pimCategoryId = await createTestPimCategory(sdk, 'Skid Steers');
      const seller1Id = await createTestSellerContact(
        sdk,
        workspaceId,
        'Seller Quote Filter 1',
      );
      const seller2Id = await createTestSellerContact(
        sdk,
        workspaceId,
        'Seller Quote Filter 2',
      );
      const buyerContactId = await createTestBuyerContact(
        sdk,
        workspaceId,
        'Buyer for Quote Filter',
      );
      const projectId = await createTestProject(
        sdk,
        workspaceId,
        'Quote Filter Project',
        'QFP-001',
      );

      const rfqInput = {
        buyersWorkspaceId: workspaceId,
        invitedSellerContactIds: [seller1Id, seller2Id],
        lineItems: [
          createRentalLineItem({
            pimCategoryId,
            description: 'Skid steer rental',
            quantity: 1,
            rentalStartDate: '2025-07-01',
            rentalEndDate: '2025-07-31',
          }),
        ],
      };

      const { createRFQ } = await sdk.CreateRFQ({ input: rfqInput });
      expect(createRFQ).toBeDefined();
      const rfqId = createRFQ!.id;

      const quote1Input = {
        sellerWorkspaceId: workspaceId,
        sellersBuyerContactId: buyerContactId,
        sellersProjectId: projectId,
        rfqId,
      };

      const { createQuote: quote1 } = await sdk.CreateQuoteLinkedToRFQ({
        input: quote1Input,
      });
      expect(quote1).toBeDefined();
      const quote1Id = quote1!.id;

      const quote2Input = {
        sellerWorkspaceId: workspaceId,
        sellersBuyerContactId: buyerContactId,
        sellersProjectId: projectId,
        rfqId,
      };

      const { createQuote: quote2 } = await sdk.CreateQuoteLinkedToRFQ({
        input: quote2Input,
      });
      expect(quote2).toBeDefined();
      const quote2Id = quote2!.id;

      // List quotes filtered by RFQ ID
      const { listQuotes } = await sdk.ListQuotesByRFQId({
        query: {
          filter: {
            rfqId,
            sellerWorkspaceId: workspaceId,
          },
        },
      });

      expect(listQuotes).toBeDefined();
      expect(listQuotes?.items.length).toBeGreaterThanOrEqual(2);

      const quoteIds = listQuotes?.items.map((q) => q.id);
      expect(quoteIds).toContain(quote1Id);
      expect(quoteIds).toContain(quote2Id);

      // Verify all quotes are linked to the RFQ
      listQuotes?.items.forEach((quote) => {
        expect(quote.rfqId).toBe(rfqId);
      });
    });
  });

  describe('Authorization tests (skipped - pending implementation)', () => {
    it.skip('prevents users from accessing RFQs from other workspaces', async () => {
      const client1 = await createClient();
      const client2 = await createClient();

      const { createWorkspace: workspace1 } =
        await client1.sdk.UtilCreateWorkspace({
          accessType: WorkspaceAccessType.SameDomain,
          name: 'Workspace 1 Auth Test',
        });
      const workspace1Id = workspace1!.id;

      const pimCategoryId = await createTestPimCategory(
        client1.sdk,
        'Auth Test Equipment',
      );
      const sellerContactId = await createTestSellerContact(
        client1.sdk,
        workspace1Id,
        'Auth Test Seller',
      );

      const rfqInput = {
        buyersWorkspaceId: workspace1Id,
        invitedSellerContactIds: [sellerContactId],
        lineItems: [createRentalLineItem({ pimCategoryId })],
      };

      const { createRFQ } = await client1.sdk.CreateRFQ({ input: rfqInput });
      const rfqId = createRFQ!.id;

      await expect(
        client2.sdk.GetRFQWithRelationships({ id: rfqId }),
      ).rejects.toThrow();
    });

    it.skip('prevents users from updating RFQs from other workspaces', async () => {
      const client1 = await createClient();
      const client2 = await createClient();

      const { createWorkspace: workspace1 } =
        await client1.sdk.UtilCreateWorkspace({
          accessType: WorkspaceAccessType.SameDomain,
          name: 'Workspace Update Auth Test',
        });
      const workspace1Id = workspace1!.id;

      const pimCategoryId = await createTestPimCategory(
        client1.sdk,
        'Update Auth Equipment',
      );
      const sellerContactId = await createTestSellerContact(
        client1.sdk,
        workspace1Id,
        'Update Auth Seller',
      );

      const rfqInput = {
        buyersWorkspaceId: workspace1Id,
        invitedSellerContactIds: [sellerContactId],
        lineItems: [createRentalLineItem({ pimCategoryId })],
      };

      const { createRFQ } = await client1.sdk.CreateRFQ({ input: rfqInput });
      const rfqId = createRFQ!.id;

      const updateInput = {
        id: rfqId,
        status: 'SENT' as any,
      };

      await expect(
        client2.sdk.UpdateRFQ({ input: updateInput }),
      ).rejects.toThrow();
    });
  });

  describe('List RFQs', () => {
    it('lists RFQs with basic pagination', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const pimCategoryId = await createTestPimCategory(sdk, 'Test Category');
      const sellerContactId = await createTestSellerContact(
        sdk,
        workspaceId,
        'Seller A',
      );

      // Create 3 RFQs
      const rfq1Input = {
        buyersWorkspaceId: workspaceId,
        invitedSellerContactIds: [sellerContactId],
        lineItems: [createRentalLineItem({ pimCategoryId })],
      };

      const rfq2Input = {
        buyersWorkspaceId: workspaceId,
        invitedSellerContactIds: [sellerContactId],
        lineItems: [createRentalLineItem({ pimCategoryId })],
      };

      const rfq3Input = {
        buyersWorkspaceId: workspaceId,
        invitedSellerContactIds: [sellerContactId],
        lineItems: [createRentalLineItem({ pimCategoryId })],
      };

      await sdk.CreateRFQ({ input: rfq1Input });
      await sdk.CreateRFQ({ input: rfq2Input });
      await sdk.CreateRFQ({ input: rfq3Input });

      // List RFQs with pagination
      const { listRFQs } = await sdk.ListRFQs({
        filter: { buyersWorkspaceId: workspaceId },
        page: { number: 1, size: 10 },
      });

      expect(listRFQs).toBeDefined();
      expect(listRFQs!.items).toHaveLength(3);
      expect(listRFQs!.page.totalItems).toBe(3);
      expect(listRFQs!.page.totalPages).toBe(1);
      expect(listRFQs!.page.number).toBe(1);
      expect(listRFQs!.items[0].buyersWorkspaceId).toBe(workspaceId);
    });

    it('filters RFQs by status', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const pimCategoryId = await createTestPimCategory(
        sdk,
        'Test Category Status',
      );
      const sellerContactId = await createTestSellerContact(
        sdk,
        workspaceId,
        'Seller B',
      );

      // Create RFQ in DRAFT status
      const draftInput = {
        buyersWorkspaceId: workspaceId,
        invitedSellerContactIds: [sellerContactId],
        lineItems: [createRentalLineItem({ pimCategoryId })],
      };
      const { createRFQ: draftRFQ } = await sdk.CreateRFQ({
        input: draftInput,
      });

      // Create RFQ in SENT status
      const sentInput = {
        buyersWorkspaceId: workspaceId,
        invitedSellerContactIds: [sellerContactId],
        lineItems: [createRentalLineItem({ pimCategoryId })],
      };
      const { createRFQ: sentRFQ } = await sdk.CreateRFQ({ input: sentInput });
      await sdk.UpdateRFQ({
        input: { id: sentRFQ!.id, status: 'SENT' as any },
      });

      // List only DRAFT RFQs
      const { listRFQs: draftList } = await sdk.ListRFQs({
        filter: { buyersWorkspaceId: workspaceId, status: 'DRAFT' as any },
        page: { number: 1, size: 10 },
      });

      expect(draftList!.items).toHaveLength(1);
      expect(draftList!.items[0].status).toBe('DRAFT');
      expect(draftList!.items[0].id).toBe(draftRFQ!.id);

      // List only SENT RFQs
      const { listRFQs: sentList } = await sdk.ListRFQs({
        filter: { buyersWorkspaceId: workspaceId, status: 'SENT' as any },
        page: { number: 1, size: 10 },
      });

      expect(sentList!.items).toHaveLength(1);
      expect(sentList!.items[0].status).toBe('SENT');
      expect(sentList!.items[0].id).toBe(sentRFQ!.id);
    });

    it('handles pagination correctly', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const pimCategoryId = await createTestPimCategory(
        sdk,
        'Test Category Pagination',
      );
      const sellerContactId = await createTestSellerContact(
        sdk,
        workspaceId,
        'Seller C',
      );

      // Create 5 RFQs
      for (let i = 0; i < 5; i++) {
        await sdk.CreateRFQ({
          input: {
            buyersWorkspaceId: workspaceId,
            invitedSellerContactIds: [sellerContactId],
            lineItems: [createRentalLineItem({ pimCategoryId })],
          },
        });
      }

      // Get page 1 with size 2
      const { listRFQs: page1 } = await sdk.ListRFQs({
        filter: { buyersWorkspaceId: workspaceId },
        page: { number: 1, size: 2 },
      });

      expect(page1!.items).toHaveLength(2);
      expect(page1!.page.totalItems).toBe(5);
      expect(page1!.page.totalPages).toBe(3);
      expect(page1!.page.number).toBe(1);

      // Get page 2 with size 2
      const { listRFQs: page2 } = await sdk.ListRFQs({
        filter: { buyersWorkspaceId: workspaceId },
        page: { number: 2, size: 2 },
      });

      expect(page2!.items).toHaveLength(2);
      expect(page2!.page.totalItems).toBe(5);
      expect(page2!.page.number).toBe(2);

      // Get page 3 with size 2 (should have 1 item)
      const { listRFQs: page3 } = await sdk.ListRFQs({
        filter: { buyersWorkspaceId: workspaceId },
        page: { number: 3, size: 2 },
      });

      expect(page3!.items).toHaveLength(1);
      expect(page3!.page.totalItems).toBe(5);
      expect(page3!.page.number).toBe(3);

      // Verify no duplicate IDs across pages
      const allIds = [
        ...page1!.items.map((r) => r.id),
        ...page2!.items.map((r) => r.id),
        ...page3!.items.map((r) => r.id),
      ];
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(5);
    });

    it('filters by invitedSellerContactIds', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const pimCategoryId = await createTestPimCategory(
        sdk,
        'Test Category Sellers',
      );
      const sellerContact1 = await createTestSellerContact(
        sdk,
        workspaceId,
        'Seller D1',
      );
      const sellerContact2 = await createTestSellerContact(
        sdk,
        workspaceId,
        'Seller D2',
      );

      // Create RFQ with seller1
      await sdk.CreateRFQ({
        input: {
          buyersWorkspaceId: workspaceId,
          invitedSellerContactIds: [sellerContact1],
          lineItems: [createRentalLineItem({ pimCategoryId })],
        },
      });

      // Create RFQ with seller2
      await sdk.CreateRFQ({
        input: {
          buyersWorkspaceId: workspaceId,
          invitedSellerContactIds: [sellerContact2],
          lineItems: [createRentalLineItem({ pimCategoryId })],
        },
      });

      // Create RFQ with both sellers
      await sdk.CreateRFQ({
        input: {
          buyersWorkspaceId: workspaceId,
          invitedSellerContactIds: [sellerContact1, sellerContact2],
          lineItems: [createRentalLineItem({ pimCategoryId })],
        },
      });

      // Filter by seller1
      const { listRFQs: seller1List } = await sdk.ListRFQs({
        filter: {
          buyersWorkspaceId: workspaceId,
          invitedSellerContactIds: [sellerContact1],
        },
        page: { number: 1, size: 10 },
      });

      expect(seller1List!.items).toHaveLength(2);
      expect(
        seller1List!.items.every((rfq) =>
          rfq.invitedSellerContactIds.includes(sellerContact1),
        ),
      ).toBe(true);
    });

    it('returns empty list for workspace with no RFQs', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const { listRFQs } = await sdk.ListRFQs({
        filter: { buyersWorkspaceId: workspaceId },
        page: { number: 1, size: 10 },
      });

      expect(listRFQs!.items).toHaveLength(0);
      expect(listRFQs!.page.totalItems).toBe(0);
      expect(listRFQs!.page.totalPages).toBe(0);
    });

    it('throws error when user lacks workspace permission', async () => {
      const client1 = await createClient();
      const client2 = await createClient();

      const workspace1 = await client1.utils.createWorkspace();
      const workspace1Id = workspace1.id;

      // Try to list RFQs from workspace1 using client2 (no permission)
      await expect(
        client2.sdk.ListRFQs({
          filter: { buyersWorkspaceId: workspace1Id },
          page: { number: 1, size: 10 },
        }),
      ).rejects.toThrow();
    });

    it('includes all RFQ fields in response', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const pimCategoryId = await createTestPimCategory(
        sdk,
        'Test Category Fields',
      );
      const sellerContactId = await createTestSellerContact(
        sdk,
        workspaceId,
        'Seller E',
      );

      const input = {
        buyersWorkspaceId: workspaceId,
        invitedSellerContactIds: [sellerContactId],
        lineItems: [
          createRentalLineItem({
            pimCategoryId,
            description: 'Test rental item',
          }),
        ],
      };

      await sdk.CreateRFQ({ input });

      const { listRFQs } = await sdk.ListRFQs({
        filter: { buyersWorkspaceId: workspaceId },
        page: { number: 1, size: 10 },
      });

      expect(listRFQs!.items[0]).toMatchObject({
        id: expect.any(String),
        buyersWorkspaceId: workspaceId,
        status: expect.any(String),
        invitedSellerContactIds: expect.arrayContaining([sellerContactId]),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        createdBy: expect.any(String),
        updatedBy: expect.any(String),
        lineItems: expect.arrayContaining([
          expect.objectContaining({
            description: 'Test rental item',
            type: 'RENTAL',
          }),
        ]),
      });
    });
  });

  describe('Quote Acceptance and Rejection', () => {
    describe('Accept Quote - Happy Paths', () => {
      it('buyer user accepts their own quote', async () => {
        const sellerClient = await createClient();
        const buyerEmail = `buyer_user_${Date.now()}@example.com`;
        const buyerClient = await createClient({
          userEmail: buyerEmail,
        });

        // Sync the buyer user to the database BEFORE creating the quote
        await buyerClient.utils.syncCurrentUser();

        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const pimCategoryId = await createTestPimCategory(
          sellerClient.sdk,
          'Accept Test Category',
        );
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Accept Test Project',
          'ATP-001',
        );

        // Create quote with buyer user - pass buyerUserId to create person contact
        const { quoteId } = await createTestQuoteWithRevision({
          sdk: sellerClient.sdk,
          workspaceId: sellerWorkspace.id,
          projectId,
          pimCategoryId,
          buyerEmail,
        });

        // Buyer accepts the quote
        const { acceptQuote } = await buyerClient.sdk.AcceptQuoteForRFQTest({
          input: { quoteId },
        });

        expect(acceptQuote).toBeDefined();
        expect(acceptQuote?.quote.id).toBe(quoteId);
        expect(acceptQuote?.quote.status).toBe('ACCEPTED');
        expect(acceptQuote?.salesOrder).toBeDefined();
        expect(acceptQuote?.salesOrder.id).toBeDefined();
      });

      it('buyer workspace manager accepts quote', async () => {
        const sellerClient = await createClient();
        const buyerClient = await createClient();

        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const buyerWorkspace = await buyerClient.utils.createWorkspace();

        const pimCategoryId = await createTestPimCategory(
          sellerClient.sdk,
          'Buyer WS Accept',
        );
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Buyer WS Project',
          'BWP-001',
        );

        // Create quote with buyerWorkspaceId and delivery fields
        const buyerContactId = await createTestBuyerContact(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Buyer Contact',
        );
        const { quoteId } = await createTestQuoteWithRevision({
          sdk: sellerClient.sdk,
          workspaceId: sellerWorkspace.id,
          projectId,
          buyerContactId,
          buyerWorkspaceId: buyerWorkspace.id,
          pimCategoryId,
          deliveryMethod: 'DELIVERY',
          deliveryLocation: '123 Main St, Test City',
          deliveryNotes: 'Leave at loading dock',
        });

        // Buyer workspace manager accepts the quote
        const { acceptQuote } = await buyerClient.sdk.AcceptQuoteForRFQTest({
          input: { quoteId },
        });

        expect(acceptQuote).toBeDefined();
        expect(acceptQuote?.quote.status).toBe('ACCEPTED');
        expect(acceptQuote?.salesOrder).toBeDefined();
        expect(acceptQuote?.purchaseOrder).toBeDefined();

        // Verify delivery fields are passed through to sales order line items
        const soLineItem = acceptQuote?.salesOrder?.line_items?.[0];
        expect(soLineItem).toBeDefined();
        if (soLineItem?.__typename === 'RentalSalesOrderLineItem') {
          expect(soLineItem.delivery_method).toBe('DELIVERY');
          expect(soLineItem.delivery_location).toBe('123 Main St, Test City');
          expect(soLineItem.deliveryNotes).toBe('Leave at loading dock');
        }

        // Verify delivery fields are passed through to purchase order line items
        const poLineItem = acceptQuote?.purchaseOrder?.line_items?.[0];
        expect(poLineItem).toBeDefined();
        if (poLineItem?.__typename === 'RentalPurchaseOrderLineItem') {
          expect(poLineItem.delivery_method).toBe('DELIVERY');
          expect(poLineItem.delivery_location).toBe('123 Main St, Test City');
          expect(poLineItem.deliveryNotes).toBe('Leave at loading dock');
        }
      });

      it('seller workspace manager accepts quote with approval confirmation', async () => {
        const sellerClient = await createClient();

        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const pimCategoryId = await createTestPimCategory(
          sellerClient.sdk,
          'Seller Accept',
        );
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Seller Accept Project',
          'SAP-001',
        );

        // Create quote with buyer user
        const { quoteId } = await createTestQuoteWithRevision({
          sdk: sellerClient.sdk,
          workspaceId: sellerWorkspace.id,
          projectId,
          buyerContactId: await createTestBuyerContact(
            sellerClient.sdk,
            sellerWorkspace.id,
            'Buyer Contact',
          ),
          pimCategoryId,
        });

        // Seller accepts on behalf of buyer with approval confirmation
        const { acceptQuote } = await sellerClient.sdk.AcceptQuoteForRFQTest({
          input: {
            quoteId,
            approvalConfirmation: 'Verbal approval received from buyer',
          },
        });

        expect(acceptQuote).toBeDefined();
        expect(acceptQuote?.quote.status).toBe('ACCEPTED');
        expect(acceptQuote?.salesOrder).toBeDefined();
      });

      it('captures buyer full legal name when accepting quote', async () => {
        const sellerClient = await createClient();
        const buyerEmail = `buyer_legal_name_${Date.now()}@example.com`;
        const buyerClient = await createClient({
          userEmail: buyerEmail,
        });

        await buyerClient.utils.syncCurrentUser();

        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const pimCategoryId = await createTestPimCategory(
          sellerClient.sdk,
          'Legal Name Test',
        );
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Legal Name Project',
          'LNP-001',
        );

        const { quoteId } = await createTestQuoteWithRevision({
          sdk: sellerClient.sdk,
          workspaceId: sellerWorkspace.id,
          projectId,
          buyerContactId: await createTestBuyerContact(
            sellerClient.sdk,
            sellerWorkspace.id,
            'Buyer Contact',
            buyerEmail,
          ),
          pimCategoryId,
        });

        // Buyer accepts quote with their full legal name
        const { acceptQuote } = await buyerClient.sdk.AcceptQuoteForRFQTest({
          input: {
            quoteId,
            buyerAcceptedFullLegalName: 'John Michael Doe',
          },
        });

        expect(acceptQuote).toBeDefined();
        expect(acceptQuote?.quote.status).toBe('ACCEPTED');
        expect(acceptQuote?.quote.buyerAcceptedFullLegalName).toBe(
          'John Michael Doe',
        );

        // Verify the field persists by querying the quote again
        const { quoteById } = await sellerClient.sdk.GetQuoteForRFQTest({
          id: quoteId,
        });
        expect(quoteById?.buyerAcceptedFullLegalName).toBe('John Michael Doe');
      });

      it('creates sales order on acceptance', async () => {
        const sellerClient = await createClient();
        const buyerEmail = `buyer_so_user_${Date.now()}@example.com`;
        const buyerClient = await createClient({
          userEmail: buyerEmail,
        });

        const { syncCurrentUser } = await buyerClient.sdk.SyncCurrentUser();

        console.log('\n\n\n\n Synced Buyer User:', syncCurrentUser);

        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const pimCategoryId = await createTestPimCategory(
          sellerClient.sdk,
          'SO Creation',
        );
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'SO Project',
          'SO-001',
        );

        const { quoteId } = await createTestQuoteWithRevision({
          sdk: sellerClient.sdk,
          workspaceId: sellerWorkspace.id,
          projectId,
          buyerContactId: await createTestBuyerContact(
            sellerClient.sdk,
            sellerWorkspace.id,
            'Buyer Contact',
            buyerEmail,
          ),
          pimCategoryId,
        });

        const { acceptQuote } = await buyerClient.sdk.AcceptQuoteForRFQTest({
          input: { quoteId },
        });

        expect(acceptQuote?.salesOrder).toBeDefined();
        expect(acceptQuote?.salesOrder.id).toBeDefined();
        expect(acceptQuote?.salesOrder.workspace_id).toBe(sellerWorkspace.id);
        expect(acceptQuote?.salesOrder.project_id).toBe(projectId);
      });

      it('creates sales order and purchase order line items via dedicated service calls', async () => {
        const sellerClient = await createClient();
        const buyerClient = await createClient();

        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const buyerWorkspace = await buyerClient.utils.createWorkspace();

        const pimCategoryId = await createTestPimCategory(
          sellerClient.sdk,
          'Line Item Creation',
        );
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Line Item Project',
          'LIP-001',
        );

        const buyerContactId = await createTestBuyerContact(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Buyer Contact',
        );

        // Create quote with 2 rental items (quantity = 2 in the quote revision helper)
        const { quoteId, revisionId } = await createTestQuoteWithRevision({
          sdk: sellerClient.sdk,
          workspaceId: sellerWorkspace.id,
          projectId,
          buyerContactId,
          buyerWorkspaceId: buyerWorkspace.id,
          pimCategoryId,
        });

        // Get the quote revision to check line items
        const { quoteRevisionById: revision } =
          await sellerClient.sdk.GetQuoteRevisionForAcceptanceTest({
            id: revisionId,
          });

        expect(revision).toBeDefined();
        expect(revision?.lineItems).toHaveLength(1);
        const quoteLineItem = revision!.lineItems[0];
        expect(quoteLineItem.__typename).toBe('QuoteRevisionRentalLineItem');

        // Accept the quote
        const { acceptQuote } = await buyerClient.sdk.AcceptQuoteForRFQTest({
          input: { quoteId },
        });

        // Verify Sales Order was created
        expect(acceptQuote?.salesOrder).toBeDefined();
        expect(acceptQuote?.salesOrder.id).toBeDefined();
        expect(acceptQuote?.salesOrder.workspace_id).toBe(sellerWorkspace.id);

        // Verify Sales Order line items were created via dedicated service calls
        expect(acceptQuote?.salesOrder.line_items).toBeDefined();
        expect(acceptQuote?.salesOrder.line_items).toHaveLength(1);

        const soLineItem = acceptQuote!.salesOrder.line_items![0];
        expect(soLineItem).toBeDefined();
        if (soLineItem) {
          expect(soLineItem.__typename).toBe('RentalSalesOrderLineItem');
          if (soLineItem.__typename === 'RentalSalesOrderLineItem') {
            expect(soLineItem.lineitem_type).toBe('RENTAL');
            expect(soLineItem.so_pim_id).toBe(pimCategoryId);
            expect(soLineItem.so_quantity).toBe(1); // Should always be 1 for rental items
            expect(soLineItem.price_id).toBeDefined();
            expect(soLineItem.delivery_date).toBeDefined();
            expect(soLineItem.off_rent_date).toBeDefined();
            expect(soLineItem.quote_revision_line_item_id).toBeDefined();
          }
        }

        // Verify Purchase Order was created
        expect(acceptQuote?.purchaseOrder).toBeDefined();
        expect(acceptQuote?.purchaseOrder?.id).toBeDefined();
        expect(acceptQuote?.purchaseOrder?.workspace_id).toBe(
          buyerWorkspace.id,
        );

        // Verify Purchase Order line items were created via dedicated service calls
        expect(acceptQuote?.purchaseOrder?.line_items).toBeDefined();
        expect(acceptQuote?.purchaseOrder?.line_items).toHaveLength(1);

        const poLineItem = acceptQuote!.purchaseOrder!.line_items![0];
        expect(poLineItem).toBeDefined();
        if (poLineItem) {
          expect(poLineItem.__typename).toBe('RentalPurchaseOrderLineItem');
          if (poLineItem.__typename === 'RentalPurchaseOrderLineItem') {
            expect(poLineItem.lineitem_type).toBe('RENTAL');
            expect(poLineItem.po_pim_id).toBe(pimCategoryId);
            expect(poLineItem.po_quantity).toBe(1); // Should always be 1 for rental items
            expect(poLineItem.price_id).toBeDefined();
            expect(poLineItem.delivery_date).toBeDefined();
            expect(poLineItem.off_rent_date).toBeDefined();
            expect(poLineItem.quote_revision_line_item_id).toBeDefined();
          }
        }
      });

      it('creates purchase order when buyerWorkspaceId exists', async () => {
        const sellerClient = await createClient();
        const buyerClient = await createClient();

        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const buyerWorkspace = await buyerClient.utils.createWorkspace();

        const pimCategoryId = await createTestPimCategory(
          sellerClient.sdk,
          'PO Creation',
        );
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'PO Project',
          'PO-001',
        );

        const buyerContactId = await createTestBuyerContact(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Buyer Contact',
        );
        const { quoteId } = await createTestQuoteWithRevision({
          sdk: sellerClient.sdk,
          workspaceId: sellerWorkspace.id,
          projectId,
          buyerContactId,
          buyerWorkspaceId: buyerWorkspace.id,
          pimCategoryId,
        });

        const { acceptQuote } = await buyerClient.sdk.AcceptQuoteForRFQTest({
          input: { quoteId },
        });

        expect(acceptQuote?.purchaseOrder).toBeDefined();
        expect(acceptQuote?.purchaseOrder?.id).toBeDefined();
        expect(acceptQuote?.purchaseOrder?.workspace_id).toBe(
          buyerWorkspace.id,
        );

        // Verify PO line items were created
        expect(acceptQuote?.purchaseOrder?.line_items).toBeDefined();
        expect(acceptQuote?.purchaseOrder?.line_items?.length).toBeGreaterThan(
          0,
        );
        const poLineItem = acceptQuote!.purchaseOrder!.line_items![0];
        expect(poLineItem).toBeDefined();
        if (poLineItem) {
          expect(poLineItem.__typename).toBe('RentalPurchaseOrderLineItem');
          if (poLineItem.__typename === 'RentalPurchaseOrderLineItem') {
            expect(poLineItem.lineitem_type).toBe('RENTAL');
            expect(poLineItem.po_quantity).toBe(1);
          }
        }
      });

      it('creates only sales order when no buyerWorkspaceId', async () => {
        const sellerClient = await createClient();
        const buyerEmail = `buyer_so_user_${Date.now()}@example.com`;
        const buyerClient = await createClient({
          userEmail: buyerEmail,
        });

        await buyerClient.utils.syncCurrentUser();

        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const pimCategoryId = await createTestPimCategory(
          sellerClient.sdk,
          'No PO Creation',
        );
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'No PO Project',
          'NPO-001',
        );

        // Create quote WITHOUT buyerWorkspaceId
        const { quoteId } = await createTestQuoteWithRevision({
          sdk: sellerClient.sdk,
          workspaceId: sellerWorkspace.id,
          projectId,
          buyerContactId: await createTestBuyerContact(
            sellerClient.sdk,
            sellerWorkspace.id,
            'Buyer Contact',
            buyerEmail,
          ),
          pimCategoryId,
        });

        const { acceptQuote } = await buyerClient.sdk.AcceptQuoteForRFQTest({
          input: { quoteId },
        });

        expect(acceptQuote?.salesOrder).toBeDefined();
        expect(acceptQuote?.purchaseOrder).toBeNull();
      });

      it('accepts quote linked to RFQ and updates RFQ status to ACCEPTED', async () => {
        const buyerClient = await createClient();
        const sellerClient = await createClient();

        const buyerWorkspace = await buyerClient.utils.createWorkspace();
        const pimCategoryId = await createTestPimCategory(
          buyerClient.sdk,
          'RFQ Accept',
        );
        const sellerContactId = await createTestSellerContact(
          buyerClient.sdk,
          buyerWorkspace.id,
          'RFQ Seller',
        );

        // Create RFQ
        const { createRFQ } = await buyerClient.sdk.CreateRFQ({
          input: {
            buyersWorkspaceId: buyerWorkspace.id,
            invitedSellerContactIds: [sellerContactId],
            lineItems: [createRentalLineItem({ pimCategoryId })],
          },
        });
        const rfqId = createRFQ!.id;

        // Seller creates quote linked to RFQ
        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'RFQ Quote Project',
          'RQP-001',
        );
        const buyerContactId = await createTestBuyerContact(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Buyer Contact',
        );

        const { quoteId } = await createTestQuoteWithRevision({
          sdk: sellerClient.sdk,
          workspaceId: sellerWorkspace.id,
          projectId,
          buyerContactId,
          buyerWorkspaceId: buyerWorkspace.id,
          rfqId,
          pimCategoryId,
        });

        // Buyer accepts quote
        const { acceptQuote } = await buyerClient.sdk.AcceptQuoteForRFQTest({
          input: { quoteId },
        });

        expect(acceptQuote?.quote.status).toBe('ACCEPTED');

        // Verify RFQ status updated
        const { rfqById } = await buyerClient.sdk.GetRFQForQuoteAcceptance({
          id: rfqId,
        });
        expect(rfqById?.status).toBe('ACCEPTED');
      });
    });

    describe('Accept Quote - Authorization', () => {
      it('unauthorized user cannot accept quote', async () => {
        const sellerClient = await createClient();
        const unauthorizedClient = await createClient();

        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const pimCategoryId = await createTestPimCategory(
          sellerClient.sdk,
          'Unauth Accept',
        );
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Unauth Project',
          'UP-001',
        );

        const { quoteId } = await createTestQuoteWithRevision({
          sdk: sellerClient.sdk,
          workspaceId: sellerWorkspace.id,
          projectId,
          buyerContactId: await createTestBuyerContact(
            sellerClient.sdk,
            sellerWorkspace.id,
            'Buyer Contact',
          ),
          pimCategoryId,
        });

        // Unauthorized user tries to accept
        await expect(
          unauthorizedClient.sdk.AcceptQuoteForRFQTest({ input: { quoteId } }),
        ).rejects.toThrow();
      });

      it('seller accepting on behalf of buyer fails without approval confirmation', async () => {
        const sellerClient = await createClient();

        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const pimCategoryId = await createTestPimCategory(
          sellerClient.sdk,
          'No Approval',
        );
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'No Approval Project',
          'NAP-001',
        );

        const { quoteId } = await createTestQuoteWithRevision({
          sdk: sellerClient.sdk,
          workspaceId: sellerWorkspace.id,
          projectId,
          buyerContactId: await createTestBuyerContact(
            sellerClient.sdk,
            sellerWorkspace.id,
            'Buyer Contact',
          ),
          pimCategoryId,
        });

        // Seller tries to accept without approval confirmation
        await expect(
          sellerClient.sdk.AcceptQuoteForRFQTest({ input: { quoteId } }),
        ).rejects.toThrow();
      });
    });

    describe('Accept Quote - Validations', () => {
      it('cannot accept quote with DRAFT status', async () => {
        const sellerClient = await createClient();
        const buyerClient = await createClient();

        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        await createTestPimCategory(sellerClient.sdk, 'Draft Accept');
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Draft Project',
          'DP-001',
        );
        const buyerContactId = await createTestBuyerContact(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Draft Buyer',
        );

        // Create quote but don't send it (stays DRAFT)
        const { createQuote } = await sellerClient.sdk.CreateQuoteForRFQTest({
          input: {
            sellerWorkspaceId: sellerWorkspace.id,
            sellersProjectId: projectId,
            sellersBuyerContactId: buyerContactId,
          },
        });
        const quoteId = createQuote!.id;

        // Try to accept DRAFT quote
        await expect(
          buyerClient.sdk.AcceptQuoteForRFQTest({ input: { quoteId } }),
        ).rejects.toThrow();
      });

      it('cannot accept quote with REJECTED status', async () => {
        const sellerClient = await createClient();
        const buyerEmail = `buyer_so_user_${Date.now()}@example.com`;
        const buyerClient = await createClient({
          userEmail: buyerEmail,
        });

        await buyerClient.utils.syncCurrentUser();

        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const pimCategoryId = await createTestPimCategory(
          sellerClient.sdk,
          'Rejected Accept',
        );
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Rejected Project',
          'RP-001',
        );

        const { quoteId } = await createTestQuoteWithRevision({
          sdk: sellerClient.sdk,
          workspaceId: sellerWorkspace.id,
          projectId,
          buyerContactId: await createTestBuyerContact(
            sellerClient.sdk,
            sellerWorkspace.id,
            'Buyer Contact',
            buyerEmail,
          ),
          pimCategoryId,
        });

        // Reject the quote first
        await buyerClient.sdk.RejectQuoteForRFQTest({ quoteId });

        // Try to accept rejected quote
        await expect(
          buyerClient.sdk.AcceptQuoteForRFQTest({ input: { quoteId } }),
        ).rejects.toThrow();
      });

      it('cannot accept quote without a current revision', async () => {
        const sellerClient = await createClient();
        const buyerClient = await createClient();

        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'No Revision Project',
          'NRP-001',
        );

        // Create quote without revision
        const buyerContactId = await createTestBuyerContact(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Buyer Contact',
        );
        const { createQuote } = await sellerClient.sdk.CreateQuoteForRFQTest({
          input: {
            sellerWorkspaceId: sellerWorkspace.id,
            sellersProjectId: projectId,
            sellersBuyerContactId: buyerContactId,
          },
        });
        const quoteId = createQuote!.id;

        // Try to accept quote without revision
        await expect(
          buyerClient.sdk.AcceptQuoteForRFQTest({ input: { quoteId } }),
        ).rejects.toThrow();
      });

      it('cannot accept expired quote', async () => {
        const sellerClient = await createClient();
        const buyerClient = await createClient();

        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const pimCategoryId = await createTestPimCategory(
          sellerClient.sdk,
          'Expired Quote',
        );
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Expired Project',
          'EP-001',
        );

        // Create quote with expired validUntil date
        const expiredDate = new Date('2020-01-01');
        const { quoteId } = await createTestQuoteWithRevision({
          sdk: sellerClient.sdk,
          workspaceId: sellerWorkspace.id,
          projectId,
          buyerContactId: await createTestBuyerContact(
            sellerClient.sdk,
            sellerWorkspace.id,
            'Buyer Contact',
          ),
          pimCategoryId,
          validUntil: expiredDate,
        });

        // Try to accept expired quote
        await expect(
          buyerClient.sdk.AcceptQuoteForRFQTest({ input: { quoteId } }),
        ).rejects.toThrow();
      });
    });

    describe('Reject Quote - Happy Paths', () => {
      it('buyer user rejects quote', async () => {
        const sellerClient = await createClient();
        const buyerEmail = `buyer_so_user_${Date.now()}@example.com`;
        const buyerClient = await createClient({
          userEmail: buyerEmail,
        });

        await buyerClient.utils.syncCurrentUser();

        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const pimCategoryId = await createTestPimCategory(
          sellerClient.sdk,
          'Buyer Reject',
        );
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Buyer Reject Project',
          'BRP-001',
        );

        const { quoteId } = await createTestQuoteWithRevision({
          sdk: sellerClient.sdk,
          workspaceId: sellerWorkspace.id,
          projectId,
          buyerContactId: await createTestBuyerContact(
            sellerClient.sdk,
            sellerWorkspace.id,
            'Buyer Contact',
            buyerEmail,
          ),
          pimCategoryId,
        });

        const { rejectQuote } = await buyerClient.sdk.RejectQuoteForRFQTest({
          quoteId,
        });

        expect(rejectQuote).toBeDefined();
        expect(rejectQuote?.id).toBe(quoteId);
        expect(rejectQuote?.status).toBe('REJECTED');
      });

      it('buyer workspace manager rejects quote', async () => {
        const sellerClient = await createClient();
        const buyerClient = await createClient();

        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const buyerWorkspace = await buyerClient.utils.createWorkspace();

        const pimCategoryId = await createTestPimCategory(
          sellerClient.sdk,
          'Buyer WS Reject',
        );
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Buyer WS Reject Project',
          'BWRP-001',
        );

        const buyerContactId = await createTestBuyerContact(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Buyer Contact',
        );
        const { quoteId } = await createTestQuoteWithRevision({
          sdk: sellerClient.sdk,
          workspaceId: sellerWorkspace.id,
          projectId,
          buyerContactId,
          buyerWorkspaceId: buyerWorkspace.id,
          pimCategoryId,
        });

        const { rejectQuote } = await buyerClient.sdk.RejectQuoteForRFQTest({
          quoteId,
        });

        expect(rejectQuote).toBeDefined();
        expect(rejectQuote?.status).toBe('REJECTED');
      });

      it('seller workspace manager rejects quote', async () => {
        const sellerClient = await createClient();

        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const pimCategoryId = await createTestPimCategory(
          sellerClient.sdk,
          'Seller Reject',
        );
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Seller Reject Project',
          'SRP-001',
        );

        const { quoteId } = await createTestQuoteWithRevision({
          sdk: sellerClient.sdk,
          workspaceId: sellerWorkspace.id,
          projectId,
          buyerContactId: await createTestBuyerContact(
            sellerClient.sdk,
            sellerWorkspace.id,
            'Buyer Contact',
          ),
          pimCategoryId,
        });

        // Seller rejects their own quote
        const { rejectQuote } = await sellerClient.sdk.RejectQuoteForRFQTest({
          quoteId,
        });

        expect(rejectQuote).toBeDefined();
        expect(rejectQuote?.status).toBe('REJECTED');
      });
    });

    describe('Reject Quote - Authorization', () => {
      it('unauthorized user cannot reject quote', async () => {
        const sellerClient = await createClient();
        const unauthorizedClient = await createClient();

        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const pimCategoryId = await createTestPimCategory(
          sellerClient.sdk,
          'Unauth Reject',
        );
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Unauth Reject Project',
          'URP-001',
        );

        const { quoteId } = await createTestQuoteWithRevision({
          sdk: sellerClient.sdk,
          workspaceId: sellerWorkspace.id,
          projectId,
          buyerContactId: await createTestBuyerContact(
            sellerClient.sdk,
            sellerWorkspace.id,
            'Buyer Contact',
          ),
          pimCategoryId,
        });

        await expect(
          unauthorizedClient.sdk.RejectQuoteForRFQTest({ quoteId }),
        ).rejects.toThrow();
      });
    });

    describe('Reject Quote - Validations', () => {
      it('cannot reject quote with ACCEPTED status', async () => {
        const sellerClient = await createClient();
        const buyerEmail = `buyer_so_user_${Date.now()}@example.com`;
        const buyerClient = await createClient({
          userEmail: buyerEmail,
        });

        await buyerClient.utils.syncCurrentUser();

        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const pimCategoryId = await createTestPimCategory(
          sellerClient.sdk,
          'Reject Accepted',
        );
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Reject Accepted Project',
          'RAP-001',
        );

        const { quoteId } = await createTestQuoteWithRevision({
          sdk: sellerClient.sdk,
          workspaceId: sellerWorkspace.id,
          projectId,
          buyerContactId: await createTestBuyerContact(
            sellerClient.sdk,
            sellerWorkspace.id,
            'Buyer Contact',
            buyerEmail,
          ),
          pimCategoryId,
        });

        // Accept the quote first
        await buyerClient.sdk.AcceptQuoteForRFQTest({ input: { quoteId } });

        // Try to reject accepted quote
        await expect(
          buyerClient.sdk.RejectQuoteForRFQTest({ quoteId }),
        ).rejects.toThrow();
      });

      it('cannot reject quote with DRAFT status', async () => {
        const sellerClient = await createClient();
        const buyerClient = await createClient();

        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Reject Draft Project',
          'RDP-001',
        );

        // Create quote but don't send it
        const buyerContactId = await createTestBuyerContact(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Buyer Contact',
        );
        const { createQuote } = await sellerClient.sdk.CreateQuoteForRFQTest({
          input: {
            sellerWorkspaceId: sellerWorkspace.id,
            sellersProjectId: projectId,
            sellersBuyerContactId: buyerContactId,
          },
        });
        const quoteId = createQuote!.id;

        // Try to reject DRAFT quote
        await expect(
          buyerClient.sdk.RejectQuoteForRFQTest({ quoteId }),
        ).rejects.toThrow();
      });
    });

    describe('RFQ Integration', () => {
      it('accepting one quote automatically rejects other ACTIVE quotes for same RFQ', async () => {
        const buyerClient = await createClient();
        const seller1Client = await createClient();
        const seller2Client = await createClient();

        const buyerWorkspace = await buyerClient.utils.createWorkspace();
        const pimCategoryId = await createTestPimCategory(
          buyerClient.sdk,
          'RFQ Multi Quote',
        );
        const seller1ContactId = await createTestSellerContact(
          buyerClient.sdk,
          buyerWorkspace.id,
          'Seller 1',
        );
        const seller2ContactId = await createTestSellerContact(
          buyerClient.sdk,
          buyerWorkspace.id,
          'Seller 2',
        );

        // Create RFQ with multiple sellers
        const { createRFQ } = await buyerClient.sdk.CreateRFQ({
          input: {
            buyersWorkspaceId: buyerWorkspace.id,
            invitedSellerContactIds: [seller1ContactId, seller2ContactId],
            lineItems: [createRentalLineItem({ pimCategoryId })],
          },
        });
        const rfqId = createRFQ!.id;

        // Seller 1 creates quote
        const seller1Workspace = await seller1Client.utils.createWorkspace();
        const project1Id = await createTestProject(
          seller1Client.sdk,
          seller1Workspace.id,
          'Seller 1 Project',
          'S1P-001',
        );

        const { quoteId: quote1Id } = await createTestQuoteWithRevision({
          sdk: seller1Client.sdk,
          workspaceId: seller1Workspace.id,
          projectId: project1Id,
          buyerWorkspaceId: buyerWorkspace.id,
          rfqId,
          pimCategoryId,
        });

        // Seller 2 creates quote
        const seller2Workspace = await seller2Client.utils.createWorkspace();
        const project2Id = await createTestProject(
          seller2Client.sdk,
          seller2Workspace.id,
          'Seller 2 Project',
          'S2P-001',
        );

        const { quoteId: quote2Id } = await createTestQuoteWithRevision({
          sdk: seller2Client.sdk,
          workspaceId: seller2Workspace.id,
          projectId: project2Id,
          buyerWorkspaceId: buyerWorkspace.id,
          rfqId,
          pimCategoryId,
        });

        // Buyer accepts quote 1
        await buyerClient.sdk.AcceptQuoteForRFQTest({
          input: { quoteId: quote1Id },
        });

        // Verify quote 1 is ACCEPTED
        const { quoteById: quote1 } = await buyerClient.sdk.GetQuoteForRFQTest({
          id: quote1Id,
        });
        expect(quote1?.status).toBe('ACCEPTED');

        // Verify quote 2 is REJECTED
        const { quoteById: quote2 } = await buyerClient.sdk.GetQuoteForRFQTest({
          id: quote2Id,
        });
        expect(quote2?.status).toBe('REJECTED');
      });

      it('RFQ status updates to ACCEPTED when quote is accepted', async () => {
        const buyerClient = await createClient();
        const sellerClient = await createClient();

        const buyerWorkspace = await buyerClient.utils.createWorkspace();
        const pimCategoryId = await createTestPimCategory(
          buyerClient.sdk,
          'RFQ Status Update',
        );
        const sellerContactId = await createTestSellerContact(
          buyerClient.sdk,
          buyerWorkspace.id,
          'Status Seller',
        );

        // Create RFQ
        const { createRFQ } = await buyerClient.sdk.CreateRFQ({
          input: {
            buyersWorkspaceId: buyerWorkspace.id,
            invitedSellerContactIds: [sellerContactId],
            lineItems: [createRentalLineItem({ pimCategoryId })],
          },
        });
        const rfqId = createRFQ!.id;
        expect(createRFQ?.status).toBe('DRAFT');

        // Seller creates quote
        const sellerWorkspace = await sellerClient.utils.createWorkspace();
        const projectId = await createTestProject(
          sellerClient.sdk,
          sellerWorkspace.id,
          'Status Project',
          'SP-001',
        );

        const { quoteId } = await createTestQuoteWithRevision({
          sdk: sellerClient.sdk,
          workspaceId: sellerWorkspace.id,
          projectId,
          buyerWorkspaceId: buyerWorkspace.id,
          rfqId,
          pimCategoryId,
        });

        // Buyer accepts quote
        await buyerClient.sdk.AcceptQuoteForRFQTest({ input: { quoteId } });

        // Verify RFQ status is ACCEPTED
        const { rfqById } = await buyerClient.sdk.GetRFQForQuoteAcceptance({
          id: rfqId,
        });
        expect(rfqById?.status).toBe('ACCEPTED');
      });

      it('multiple sellers submit quotes to RFQ, buyer accepts one, others are rejected', async () => {
        const buyerClient = await createClient();
        const seller1Client = await createClient();
        const seller2Client = await createClient();
        const seller3Client = await createClient();

        const buyerWorkspace = await buyerClient.utils.createWorkspace();
        const pimCategoryId = await createTestPimCategory(
          buyerClient.sdk,
          'Multi Seller RFQ',
        );

        const seller1ContactId = await createTestSellerContact(
          buyerClient.sdk,
          buyerWorkspace.id,
          'Multi Seller 1',
        );
        const seller2ContactId = await createTestSellerContact(
          buyerClient.sdk,
          buyerWorkspace.id,
          'Multi Seller 2',
        );
        const seller3ContactId = await createTestSellerContact(
          buyerClient.sdk,
          buyerWorkspace.id,
          'Multi Seller 3',
        );

        // Create RFQ with 3 sellers
        const { createRFQ } = await buyerClient.sdk.CreateRFQ({
          input: {
            buyersWorkspaceId: buyerWorkspace.id,
            invitedSellerContactIds: [
              seller1ContactId,
              seller2ContactId,
              seller3ContactId,
            ],
            lineItems: [createRentalLineItem({ pimCategoryId })],
          },
        });
        const rfqId = createRFQ!.id;

        // All 3 sellers create quotes
        const seller1Workspace = await seller1Client.utils.createWorkspace();
        const project1Id = await createTestProject(
          seller1Client.sdk,
          seller1Workspace.id,
          'Multi Seller 1 Project',
          'MS1-001',
        );
        const { quoteId: quote1Id } = await createTestQuoteWithRevision({
          sdk: seller1Client.sdk,
          workspaceId: seller1Workspace.id,
          projectId: project1Id,
          buyerWorkspaceId: buyerWorkspace.id,
          rfqId,
          pimCategoryId,
        });

        const seller2Workspace = await seller2Client.utils.createWorkspace();
        const project2Id = await createTestProject(
          seller2Client.sdk,
          seller2Workspace.id,
          'Multi Seller 2 Project',
          'MS2-001',
        );
        const { quoteId: quote2Id } = await createTestQuoteWithRevision({
          sdk: seller2Client.sdk,
          workspaceId: seller2Workspace.id,
          projectId: project2Id,
          buyerWorkspaceId: buyerWorkspace.id,
          rfqId,
          pimCategoryId,
        });

        const seller3Workspace = await seller3Client.utils.createWorkspace();
        const project3Id = await createTestProject(
          seller3Client.sdk,
          seller3Workspace.id,
          'Multi Seller 3 Project',
          'MS3-001',
        );
        const { quoteId: quote3Id } = await createTestQuoteWithRevision({
          sdk: seller3Client.sdk,
          workspaceId: seller3Workspace.id,
          projectId: project3Id,
          buyerWorkspaceId: buyerWorkspace.id,
          rfqId,
          pimCategoryId,
        });

        // Buyer accepts quote 2
        await buyerClient.sdk.AcceptQuoteForRFQTest({
          input: { quoteId: quote2Id },
        });

        // Verify quote 2 is ACCEPTED
        const { quoteById: quote2 } = await buyerClient.sdk.GetQuoteForRFQTest({
          id: quote2Id,
        });
        expect(quote2?.status).toBe('ACCEPTED');

        // Verify quotes 1 and 3 are REJECTED
        const { quoteById: quote1 } = await buyerClient.sdk.GetQuoteForRFQTest({
          id: quote1Id,
        });
        expect(quote1?.status).toBe('REJECTED');

        const { quoteById: quote3 } = await buyerClient.sdk.GetQuoteForRFQTest({
          id: quote3Id,
        });
        expect(quote3?.status).toBe('REJECTED');

        // Verify RFQ is ACCEPTED
        const { rfqById } = await buyerClient.sdk.GetRFQForQuoteAcceptance({
          id: rfqId,
        });
        expect(rfqById?.status).toBe('ACCEPTED');
      });
    });
  });
});
