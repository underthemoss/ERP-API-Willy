import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';
import { QuoteLineItemType, QuoteStatus } from './generated/graphql';

// Define GraphQL operations for codegen
gql`
  mutation CreateQuoteForTests($input: CreateQuoteInput!) {
    createQuote(input: $input) {
      id
      sellerWorkspaceId
      sellersBuyerContactId
      sellersProjectId
      status
      updatedAt
    }
  }
`;

gql`
  mutation UpdateQuoteForTests($input: UpdateQuoteInput!) {
    updateQuote(input: $input) {
      id
      sellerWorkspaceId
      sellersBuyerContactId
      sellersProjectId
      buyerWorkspaceId
      buyersSellerContactId
      buyersProjectId
      status
      currentRevisionId
      validUntil
      updatedAt
      updatedBy
    }
  }
`;

gql`
  mutation CreateQuoteRevision($input: CreateQuoteRevisionInput!) {
    createQuoteRevision(input: $input) {
      id
      quoteId
      revisionNumber
      status
      validUntil
      createdAt
      createdBy
      updatedAt
      updatedBy
      lineItems {
        __typename
        ... on QuoteRevisionServiceLineItem {
          id
          description
          quantity
          subtotalInCents
          type
          sellersPriceId
        }
        ... on QuoteRevisionRentalLineItem {
          id
          description
          quantity
          subtotalInCents
          type
          pimCategoryId
          rentalStartDate
          rentalEndDate
          sellersPriceId
        }
        ... on QuoteRevisionSaleLineItem {
          id
          description
          quantity
          subtotalInCents
          type
          pimCategoryId
          sellersPriceId
        }
      }
    }
  }
`;

gql`
  query GetQuoteRevisionById($id: String!) {
    quoteRevisionById(id: $id) {
      id
      quoteId
      revisionNumber
      status
      validUntil
      updatedAt
      updatedBy
      lineItems {
        __typename
        ... on QuoteRevisionServiceLineItem {
          id
          description
          quantity
          subtotalInCents
          type
          sellersPriceId
        }
        ... on QuoteRevisionRentalLineItem {
          id
          description
          quantity
          subtotalInCents
          type
          pimCategoryId
          rentalStartDate
          rentalEndDate
          sellersPriceId
        }
        ... on QuoteRevisionSaleLineItem {
          id
          description
          quantity
          subtotalInCents
          type
          pimCategoryId
          sellersPriceId
        }
      }
    }
  }
`;

gql`
  mutation CreateRentalPriceForTests($input: CreateRentalPriceInput!) {
    createRentalPrice(input: $input) {
      id
      workspaceId
      priceBookId
      pimCategoryId
      pricePerDayInCents
      pricePerWeekInCents
      pricePerMonthInCents
    }
  }
`;

gql`
  mutation CreateSalePriceForTests($input: CreateSalePriceInput!) {
    createSalePrice(input: $input) {
      id
      workspaceId
      priceBookId
      pimCategoryId
      unitCostInCents
    }
  }
`;

gql`
  mutation CreatePimCategoryForTests($input: UpsertPimCategoryInput!) {
    upsertPimCategory(input: $input) {
      id
      name
      path
    }
  }
`;

gql`
  mutation CreatePriceBookForTests($input: CreatePriceBookInput!) {
    createPriceBook(input: $input) {
      id
      name
      workspaceId
    }
  }
`;

gql`
  mutation CreateBusinessContactForTests($input: BusinessContactInput!) {
    createBusinessContact(input: $input) {
      id
      workspaceId
      name
    }
  }
`;

gql`
  mutation CreatePersonContactForTests($input: PersonContactInput!) {
    createPersonContact(input: $input) {
      id
      name
      email
      role
      businessId
      contactType
    }
  }
`;

gql`
  mutation CreateProjectForTests($input: ProjectInput!) {
    createProject(input: $input) {
      id
      workspaceId
      name
      project_code
    }
  }
`;

gql`
  mutation UpdateQuoteRevisionForTests($input: UpdateQuoteRevisionInput!) {
    updateQuoteRevision(input: $input) {
      id
      quoteId
      revisionNumber
      status
      validUntil
      updatedAt
      updatedBy
      lineItems {
        __typename
        ... on QuoteRevisionRentalLineItem {
          id
          description
          quantity
          subtotalInCents
          type
          pimCategoryId
          rentalStartDate
          rentalEndDate
          sellersPriceId
        }
        ... on QuoteRevisionSaleLineItem {
          id
          description
          quantity
          subtotalInCents
          type
          pimCategoryId
          sellersPriceId
        }
        ... on QuoteRevisionServiceLineItem {
          id
          description
          quantity
          subtotalInCents
          type
          sellersPriceId
        }
      }
    }
  }
`;

gql`
  mutation SendQuoteForTests($input: SendQuoteInput!) {
    sendQuote(input: $input) {
      id
      status
      currentRevisionId
      validUntil
      updatedAt
      updatedBy
    }
  }
`;

const { createClient } = createTestEnvironment();

/**
 * Helper function to set up test data for quoting tests
 */
async function setupQuotingTestData(sdk: any, utils: any) {
  // Create workspace
  const workspace = await utils.createWorkspace();
  const workspaceId = workspace.id;

  // Create PIM category
  const { upsertPimCategory } = await sdk.CreatePimCategoryForTests({
    input: {
      id: `test-cat-${Date.now()}`,
      name: 'Test Equipment Category',
      path: '|test-equipment|',
      platform_id: 'test-platform',
      description: 'Test category for equipment',
      has_products: false,
    },
  });
  const pimCategoryId = upsertPimCategory.id;

  // Create price book
  const { createPriceBook } = await sdk.CreatePriceBookForTests({
    input: { name: 'Test Price Book', workspaceId },
  });
  const priceBookId = createPriceBook.id;

  // Create rental price
  const { createRentalPrice } = await sdk.CreateRentalPriceForTests({
    input: {
      workspaceId,
      pimCategoryId,
      priceBookId,
      pricePerDayInCents: 10000, // $100/day
      pricePerWeekInCents: 60000, // $600/week
      pricePerMonthInCents: 200000, // $2000/month
    },
  });
  const rentalPriceId = createRentalPrice.id;

  // Create sale price
  const { createSalePrice } = await sdk.CreateSalePriceForTests({
    input: {
      workspaceId,
      pimCategoryId,
      priceBookId,
      unitCostInCents: 50000, // $500 per unit
    },
  });
  const salePriceId = createSalePrice.id;

  // Create business contact
  const { createBusinessContact } = await sdk.CreateBusinessContactForTests({
    input: { workspaceId, name: 'Test Buyer Contact' },
  });
  const businessContactId = createBusinessContact.id;

  // Create person contact associated with the business
  const { createPersonContact } = await sdk.CreatePersonContactForTests({
    input: {
      workspaceId,
      name: 'Test Buyer Contact Rep',
      email: `buyer-${Date.now()}@example.com`,
      role: 'Buyer',
      businessId: businessContactId,
    },
  });
  const buyerContactId = createPersonContact.id;

  // Create project
  const { createProject } = await sdk.CreateProjectForTests({
    input: {
      workspaceId,
      name: 'Test Project',
      project_code: `TEST-${Date.now()}`,
      deleted: false,
    },
  });
  const projectId = createProject.id;

  // Create quote
  const { createQuote } = await sdk.CreateQuoteForTests({
    input: {
      sellerWorkspaceId: workspaceId,
      sellersBuyerContactId: buyerContactId,
      sellersProjectId: projectId,
    },
  });

  return {
    workspaceId,
    pimCategoryId,
    priceBookId,
    rentalPriceId,
    priceId: salePriceId, // alias for backward compatibility
    salePriceId,
    buyerContactId,
    projectId,
    quote: createQuote,
    quoteId: createQuote.id,
  };
}

describe('createQuoteRevision e2e', () => {
  /**
   * Helper to calculate expected rental subtotal based on price engine logic
   * This replicates the logic from PriceEngineService.calculateOptimalCost
   */
  function calculateExpectedRentalSubtotal(
    startDate: Date,
    endDate: Date,
    quantity: number,
    pricePerDayInCents: number,
    pricePerWeekInCents: number,
    pricePerMonthInCents: number,
  ): number {
    // Calculate days inclusively (start and end date both count)
    const msPerDay = 24 * 60 * 60 * 1000;
    const durationMs = endDate.getTime() - startDate.getTime();
    const totalDays = Math.floor(durationMs / msPerDay) + 1;

    // Calculate period breakdown (same as PriceEngineService.calculateRentalPeriod)
    const days28 = Math.floor(totalDays / 28);
    const days7 = Math.floor((totalDays % 28) / 7);
    const days1 = totalDays % 7;

    // Generate three distribution options
    const distributions = [
      { days28, days7, days1 }, // exactSplit
      { days28, days7: days7 + 1, days1: 0 }, // roundUpTo7Days
      { days28: days28 + 1, days7: 0, days1: 0 }, // roundUpTo28Days
    ];

    // Calculate cost for each distribution and find the minimum
    const costs = distributions.map(
      (dist) =>
        dist.days28 * pricePerMonthInCents +
        dist.days7 * pricePerWeekInCents +
        dist.days1 * pricePerDayInCents,
    );

    const optimalCost = Math.min(...costs);
    return Math.round(optimalCost * quantity);
  }

  it('creates a quote revision with rental line items and calculates subtotals', async () => {
    const { sdk, utils, user } = await createClient();

    // Setup test data
    const { quoteId, rentalPriceId, pimCategoryId } =
      await setupQuotingTestData(sdk, utils);

    // Define rental dates
    const rentalStartDate = new Date('2025-06-01T00:00:00Z');
    const rentalEndDate = new Date('2025-06-15T00:00:00Z'); // 15 days

    // Create quote revision with rental line item
    const { createQuoteRevision } = await sdk.CreateQuoteRevision({
      input: {
        quoteId,
        revisionNumber: 1,
        validUntil: new Date('2025-12-31T00:00:00Z').toISOString(),
        lineItems: [
          {
            type: QuoteLineItemType.Rental,
            description: 'Excavator rental',
            quantity: 2,
            sellersPriceId: rentalPriceId,
            pimCategoryId,
            rentalStartDate: rentalStartDate.toISOString(),
            rentalEndDate: rentalEndDate.toISOString(),
          },
        ],
      },
    });

    // Assertions
    expect(createQuoteRevision).toBeDefined();
    expect(createQuoteRevision.quoteId).toBe(quoteId);
    expect(createQuoteRevision.revisionNumber).toBe(1);
    expect(createQuoteRevision.lineItems).toHaveLength(1);
    expect(createQuoteRevision.createdBy).toBe(user.id);
    expect(createQuoteRevision.updatedBy).toBe(user.id);

    // Check rental line item
    const rentalItem = createQuoteRevision.lineItems[0];
    expect(rentalItem.__typename).toBe('QuoteRevisionRentalLineItem');

    if (rentalItem.__typename === 'QuoteRevisionRentalLineItem') {
      expect(rentalItem.description).toBe('Excavator rental');
      expect(rentalItem.quantity).toBe(2);
      expect(rentalItem.sellersPriceId).toBe(rentalPriceId);
      expect(rentalItem.pimCategoryId).toBe(pimCategoryId);

      // Verify subtotal was calculated server-side (not zero, and greater than 0)
      expect(rentalItem.subtotalInCents).toBeGreaterThan(0);

      // Calculate expected subtotal and verify it matches
      const expectedSubtotal = calculateExpectedRentalSubtotal(
        rentalStartDate,
        rentalEndDate,
        2, // quantity
        10000, // pricePerDayInCents
        60000, // pricePerWeekInCents
        200000, // pricePerMonthInCents
      );

      expect(rentalItem.subtotalInCents).toBe(expectedSubtotal);
    }
  });

  it('creates a quote revision with sale line items and calculates subtotals', async () => {
    const { sdk, utils } = await createClient();

    // Setup test data
    const { quoteId, salePriceId, pimCategoryId } = await setupQuotingTestData(
      sdk,
      utils,
    );

    // Create quote revision with sale line item
    const { createQuoteRevision } = await sdk.CreateQuoteRevision({
      input: {
        quoteId,
        revisionNumber: 1,
        validUntil: new Date('2025-12-31T00:00:00Z').toISOString(),
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Generator purchase',
            quantity: 3,
            sellersPriceId: salePriceId,
            pimCategoryId,
          },
        ],
      },
    });

    // Assertions
    expect(createQuoteRevision).toBeDefined();
    expect(createQuoteRevision.lineItems).toHaveLength(1);

    // Check sale line item
    const saleItem = createQuoteRevision.lineItems[0];
    expect(saleItem.__typename).toBe('QuoteRevisionSaleLineItem');

    if (saleItem.__typename === 'QuoteRevisionSaleLineItem') {
      expect(saleItem.description).toBe('Generator purchase');
      expect(saleItem.quantity).toBe(3);
      expect(saleItem.sellersPriceId).toBe(salePriceId);

      // Verify subtotal: unitCostInCents (50000) * quantity (3) = 150000
      expect(saleItem.subtotalInCents).toBe(150000);
    }
  });

  it('creates a quote revision with mixed line item types', async () => {
    const { sdk, utils } = await createClient();

    // Setup test data
    const { quoteId, rentalPriceId, salePriceId, pimCategoryId } =
      await setupQuotingTestData(sdk, utils);

    // Define rental dates
    const rentalStartDate = new Date('2025-06-01T00:00:00Z');
    const rentalEndDate = new Date('2025-06-08T00:00:00Z'); // 8 days (1 week + 1 day)

    // Create quote revision with both rental and sale line items
    const { createQuoteRevision } = await sdk.CreateQuoteRevision({
      input: {
        quoteId,
        revisionNumber: 1,
        lineItems: [
          {
            type: QuoteLineItemType.Rental,
            description: 'Equipment rental',
            quantity: 1,
            sellersPriceId: rentalPriceId,
            pimCategoryId,
            rentalStartDate: rentalStartDate.toISOString(),
            rentalEndDate: rentalEndDate.toISOString(),
          },
          {
            type: QuoteLineItemType.Sale,
            description: 'Equipment purchase',
            quantity: 2,
            sellersPriceId: salePriceId,
            pimCategoryId,
          },
        ],
      },
    });

    // Assertions
    expect(createQuoteRevision).toBeDefined();
    expect(createQuoteRevision.lineItems).toHaveLength(2);

    // Find and verify rental item
    const rentalItem = createQuoteRevision.lineItems.find(
      (item) => item.__typename === 'QuoteRevisionRentalLineItem',
    );
    expect(rentalItem).toBeDefined();
    if (rentalItem && rentalItem.__typename === 'QuoteRevisionRentalLineItem') {
      expect(rentalItem.description).toBe('Equipment rental');
      expect(rentalItem.subtotalInCents).toBeGreaterThan(0);

      // Calculate expected rental subtotal
      const expectedRentalSubtotal = calculateExpectedRentalSubtotal(
        rentalStartDate,
        rentalEndDate,
        1,
        10000,
        60000,
        200000,
      );
      expect(rentalItem.subtotalInCents).toBe(expectedRentalSubtotal);
    }

    // Find and verify sale item
    const saleItem = createQuoteRevision.lineItems.find(
      (item) => item.__typename === 'QuoteRevisionSaleLineItem',
    );
    expect(saleItem).toBeDefined();
    if (saleItem && saleItem.__typename === 'QuoteRevisionSaleLineItem') {
      expect(saleItem.description).toBe('Equipment purchase');
      expect(saleItem.subtotalInCents).toBe(100000); // 50000 * 2
    }
  });

  it('resolves quote revision by ID with all line item details', async () => {
    const { sdk, utils } = await createClient();

    // Setup and create revision
    const { quoteId, salePriceId, pimCategoryId } = await setupQuotingTestData(
      sdk,
      utils,
    );

    const { createQuoteRevision } = await sdk.CreateQuoteRevision({
      input: {
        quoteId,
        revisionNumber: 1,
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Test item',
            quantity: 1,
            sellersPriceId: salePriceId,
            pimCategoryId,
          },
        ],
      },
    });

    // Query the revision by ID
    const { quoteRevisionById } = await sdk.GetQuoteRevisionById({
      id: createQuoteRevision.id,
    });

    // Verify the query returns the same data
    expect(quoteRevisionById).toBeDefined();
    expect(quoteRevisionById?.id).toBe(createQuoteRevision.id);
    expect(quoteRevisionById?.quoteId).toBe(quoteId);
    expect(quoteRevisionById?.lineItems).toHaveLength(1);
    expect(quoteRevisionById?.lineItems[0].subtotalInCents).toBe(50000);
  });

  it('enforces cross-tenant isolation for quote revisions', async () => {
    // Create two separate clients with different workspaces
    const { sdk: sdkA, utils: utilsA } = await createClient({
      userId: 'userA',
      companyId: 'companyA',
    });
    const { sdk: sdkB } = await createClient({
      userId: 'userB',
      companyId: 'companyB',
    });

    // Setup test data in workspace A
    const { quoteId, salePriceId, pimCategoryId } = await setupQuotingTestData(
      sdkA,
      utilsA,
    );

    // Attempt to create revision from user B (different workspace)
    await expect(
      sdkB.CreateQuoteRevision({
        input: {
          quoteId, // Quote from workspace A
          revisionNumber: 1,
          lineItems: [
            {
              type: QuoteLineItemType.Sale,
              description: 'Unauthorized attempt',
              quantity: 1,
              sellersPriceId: salePriceId,
              pimCategoryId,
            },
          ],
        },
      }),
    ).rejects.toThrow();
  });

  it('validates that sellersPriceId exists and is accessible', async () => {
    const { sdk, utils } = await createClient();

    // Setup test data
    const { quoteId, pimCategoryId } = await setupQuotingTestData(sdk, utils);

    // Attempt to create revision with non-existent price ID
    // This will fail with authorization error since the price doesn't exist
    await expect(
      sdk.CreateQuoteRevision({
        input: {
          quoteId,
          revisionNumber: 1,
          lineItems: [
            {
              type: QuoteLineItemType.Sale,
              description: 'Invalid price reference',
              quantity: 1,
              sellersPriceId: 'non-existent-price-id',
              pimCategoryId,
            },
          ],
        },
      }),
    ).rejects.toThrow(/Unauthorized to view price|Price not found/);
  });
});

describe('updateQuote e2e', () => {
  /**
   * Helper function to set up test data for update quote tests
   */
  async function setupUpdateQuoteTestData(sdk: any, utils: any) {
    // Create two workspaces and contacts for testing
    const workspace1 = await utils.createWorkspace();
    const workspace2 = await utils.createWorkspace();

    // Create business contacts in workspace1
    const { createBusinessContact: businessContact1 } =
      await sdk.CreateBusinessContactForTests({
        input: { workspaceId: workspace1.id, name: 'Buyer Contact 1' },
      });

    const { createBusinessContact: businessContact2 } =
      await sdk.CreateBusinessContactForTests({
        input: { workspaceId: workspace1.id, name: 'Buyer Contact 2' },
      });

    // Create person contacts associated with the business contacts
    const { createPersonContact: personContact1 } =
      await sdk.CreatePersonContactForTests({
        input: {
          workspaceId: workspace1.id,
          name: 'Buyer Contact 1 Rep',
          email: `buyer1-${Date.now()}@example.com`,
          role: 'Buyer',
          businessId: businessContact1.id,
        },
      });

    const { createPersonContact: personContact2 } =
      await sdk.CreatePersonContactForTests({
        input: {
          workspaceId: workspace1.id,
          name: 'Buyer Contact 2 Rep',
          email: `buyer2-${Date.now()}@example.com`,
          role: 'Buyer',
          businessId: businessContact2.id,
        },
      });

    const contact1 = personContact1;
    const contact2 = personContact2;

    // Create projects in workspace1
    const { createProject: project1 } = await sdk.CreateProjectForTests({
      input: {
        workspaceId: workspace1.id,
        name: 'Project 1',
        project_code: `PROJ1-${Date.now()}`,
        deleted: false,
      },
    });

    const { createProject: project2 } = await sdk.CreateProjectForTests({
      input: {
        workspaceId: workspace1.id,
        name: 'Project 2',
        project_code: `PROJ2-${Date.now()}`,
        deleted: false,
      },
    });

    // Create quote
    const { createQuote } = await sdk.CreateQuoteForTests({
      input: {
        sellerWorkspaceId: workspace1.id,
        sellersBuyerContactId: contact1.id,
        sellersProjectId: project1.id,
      },
    });

    return {
      workspace1,
      workspace2,
      contact1,
      contact2,
      project1,
      project2,
      quote: createQuote,
    };
  }

  it('updates sellersBuyerContactId successfully', async () => {
    const { sdk, utils } = await createClient();
    const { quote, contact2 } = await setupUpdateQuoteTestData(sdk, utils);

    const { updateQuote } = await sdk.UpdateQuoteForTests({
      input: {
        id: quote.id,
        sellersBuyerContactId: contact2.id,
      },
    });

    expect(updateQuote).toBeDefined();
    expect(updateQuote.id).toBe(quote.id);
    expect(updateQuote.sellersBuyerContactId).toBe(contact2.id);
    expect(updateQuote.sellersProjectId).toBe(quote.sellersProjectId);
    expect(updateQuote.updatedBy).toBeDefined();
  });

  it('updates sellersProjectId successfully', async () => {
    const { sdk, utils } = await createClient();
    const { quote, project2 } = await setupUpdateQuoteTestData(sdk, utils);

    const { updateQuote } = await sdk.UpdateQuoteForTests({
      input: {
        id: quote.id,
        sellersProjectId: project2.id,
      },
    });

    expect(updateQuote).toBeDefined();
    expect(updateQuote.id).toBe(quote.id);
    expect(updateQuote.sellersProjectId).toBe(project2.id);
    expect(updateQuote.sellersBuyerContactId).toBe(quote.sellersBuyerContactId);
    expect(updateQuote.updatedBy).toBeDefined();
  });

  it('updates status successfully', async () => {
    const { sdk, utils } = await createClient();
    const { quote } = await setupUpdateQuoteTestData(sdk, utils);

    const { updateQuote } = await sdk.UpdateQuoteForTests({
      input: {
        id: quote.id,
        status: QuoteStatus.Active,
      },
    });

    expect(updateQuote).toBeDefined();
    expect(updateQuote.id).toBe(quote.id);
    expect(updateQuote.status).toBe(QuoteStatus.Active);
    expect(updateQuote.updatedBy).toBeDefined();
  });

  it('updates validUntil successfully', async () => {
    const { sdk, utils } = await createClient();
    const { quote } = await setupUpdateQuoteTestData(sdk, utils);

    const validUntilDate = new Date('2025-12-31T23:59:59Z');
    const { updateQuote } = await sdk.UpdateQuoteForTests({
      input: {
        id: quote.id,
        validUntil: validUntilDate.toISOString(),
      },
    });

    expect(updateQuote).toBeDefined();
    expect(updateQuote.id).toBe(quote.id);
    expect(updateQuote.validUntil).toBe(validUntilDate.toISOString());
    expect(updateQuote.updatedBy).toBeDefined();
  });

  it('updates multiple fields at once (partial update)', async () => {
    const { sdk, utils } = await createClient();
    const { quote, contact2, project2 } = await setupUpdateQuoteTestData(
      sdk,
      utils,
    );

    const validUntilDate = new Date('2026-06-30T23:59:59Z');
    const { updateQuote } = await sdk.UpdateQuoteForTests({
      input: {
        id: quote.id,
        sellersBuyerContactId: contact2.id,
        sellersProjectId: project2.id,
        status: QuoteStatus.Active,
        validUntil: validUntilDate.toISOString(),
      },
    });

    expect(updateQuote).toBeDefined();
    expect(updateQuote.id).toBe(quote.id);
    expect(updateQuote.sellersBuyerContactId).toBe(contact2.id);
    expect(updateQuote.sellersProjectId).toBe(project2.id);
    expect(updateQuote.status).toBe(QuoteStatus.Active);
    expect(updateQuote.validUntil).toBe(validUntilDate.toISOString());
    expect(updateQuote.updatedBy).toBeDefined();
    expect(updateQuote.updatedAt).toBeDefined();
  });

  it('updates currentRevisionId successfully', async () => {
    const { sdk, utils } = await createClient();
    const { quote } = await setupUpdateQuoteTestData(sdk, utils);

    const mockRevisionId = 'test-revision-id-123';
    const { updateQuote } = await sdk.UpdateQuoteForTests({
      input: {
        id: quote.id,
        currentRevisionId: mockRevisionId,
      },
    });

    expect(updateQuote).toBeDefined();
    expect(updateQuote.id).toBe(quote.id);
    expect(updateQuote.currentRevisionId).toBe(mockRevisionId);
  });

  it('fails to update quote with invalid id', async () => {
    const { sdk, utils } = await createClient();
    await setupUpdateQuoteTestData(sdk, utils);

    await expect(
      sdk.UpdateQuoteForTests({
        input: {
          id: 'non-existent-quote-id',
          status: QuoteStatus.Active,
        },
      }),
    ).rejects.toThrow();
  });

  it('fails when user is not authorized to update quote', async () => {
    const { sdk: sdk1, utils: utils1 } = await createClient();
    const { quote } = await setupUpdateQuoteTestData(sdk1, utils1);

    // Create a different user/client who doesn't have access
    const { sdk: sdk2 } = await createClient();

    await expect(
      sdk2.UpdateQuoteForTests({
        input: {
          id: quote.id,
          status: QuoteStatus.Active,
        },
      }),
    ).rejects.toThrow();
  });

  it('updates updatedAt timestamp', async () => {
    const { sdk, utils } = await createClient();
    const { quote } = await setupUpdateQuoteTestData(sdk, utils);

    // Get the original updatedAt timestamp
    const originalUpdatedAt = new Date(quote.updatedAt);

    // Wait a moment to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    const { updateQuote } = await sdk.UpdateQuoteForTests({
      input: {
        id: quote.id,
        status: QuoteStatus.Active,
      },
    });

    const newUpdatedAt = new Date(updateQuote.updatedAt);
    expect(newUpdatedAt.getTime()).toBeGreaterThanOrEqual(
      originalUpdatedAt.getTime(),
    );
  });
});

describe('updateQuoteRevision e2e', () => {
  it('should update validUntil on DRAFT revision', async () => {
    const { sdk, utils } = await createClient();
    const { quote, priceId } = await setupQuotingTestData(sdk, utils);

    // Create a DRAFT revision
    const { createQuoteRevision } = await sdk.CreateQuoteRevision({
      input: {
        quoteId: quote.id,
        revisionNumber: 1,
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Test item',
            quantity: 1,
            sellersPriceId: priceId,
            pimCategoryId: 'test-category',
          },
        ],
      },
    });

    expect(createQuoteRevision.status).toBe('DRAFT');

    // Update validUntil
    const newValidUntil = new Date('2025-12-31');
    const { updateQuoteRevision } = await sdk.UpdateQuoteRevisionForTests({
      input: {
        id: createQuoteRevision.id,
        validUntil: newValidUntil.toISOString(),
      },
    });

    expect(updateQuoteRevision.validUntil).toBe(newValidUntil.toISOString());
    expect(updateQuoteRevision.updatedBy).toBeDefined();
  });

  it('should fail to update validUntil on SENT revision', async () => {
    const { sdk, utils } = await createClient();
    const { quote, priceId } = await setupQuotingTestData(sdk, utils);

    // Create and send a revision
    const { createQuoteRevision } = await sdk.CreateQuoteRevision({
      input: {
        quoteId: quote.id,
        revisionNumber: 1,
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Test item',
            quantity: 1,
            sellersPriceId: priceId,
            pimCategoryId: 'test-category',
          },
        ],
      },
    });

    await sdk.SendQuoteForTests({
      input: {
        quoteId: quote.id,
        revisionId: createQuoteRevision.id,
      },
    });

    // Verify it's SENT
    const sentRevision = await sdk.GetQuoteRevisionById({
      id: createQuoteRevision.id,
    });
    expect(sentRevision.quoteRevisionById?.status).toBe('SENT');

    // Attempt to update validUntil
    await expect(
      sdk.UpdateQuoteRevisionForTests({
        input: {
          id: createQuoteRevision.id,
          validUntil: new Date('2025-12-31').toISOString(),
        },
      }),
    ).rejects.toThrow(/cannot update.*sent/i);
  });

  it('should update lineItems on DRAFT revision with recalculated subtotals', async () => {
    const { sdk, utils } = await createClient();
    const { quote, priceId } = await setupQuotingTestData(sdk, utils);

    // Create a DRAFT revision
    const { createQuoteRevision } = await sdk.CreateQuoteRevision({
      input: {
        quoteId: quote.id,
        revisionNumber: 1,
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Original item',
            quantity: 1,
            sellersPriceId: priceId,
            pimCategoryId: 'test-category',
          },
        ],
      },
    });

    const originalSubtotal = createQuoteRevision.lineItems[0].subtotalInCents;

    // Update lineItems with different quantity
    const { updateQuoteRevision } = await sdk.UpdateQuoteRevisionForTests({
      input: {
        id: createQuoteRevision.id,
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Updated item',
            quantity: 3,
            sellersPriceId: priceId,
            pimCategoryId: 'test-category',
          },
        ],
      },
    });

    expect(updateQuoteRevision.lineItems).toHaveLength(1);
    expect(updateQuoteRevision.lineItems[0].description).toBe('Updated item');
    expect(updateQuoteRevision.lineItems[0].quantity).toBe(3);
    // Subtotal should be recalculated (3x the original)
    expect(updateQuoteRevision.lineItems[0].subtotalInCents).toBeGreaterThan(
      originalSubtotal,
    );
  });

  it('should fail to update lineItems on SENT revision', async () => {
    const { sdk, utils } = await createClient();
    const { quote, priceId } = await setupQuotingTestData(sdk, utils);

    // Create and send a revision
    const { createQuoteRevision } = await sdk.CreateQuoteRevision({
      input: {
        quoteId: quote.id,
        revisionNumber: 1,
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Test item',
            quantity: 1,
            sellersPriceId: priceId,
            pimCategoryId: 'test-category',
          },
        ],
      },
    });

    await sdk.SendQuoteForTests({
      input: {
        quoteId: quote.id,
        revisionId: createQuoteRevision.id,
      },
    });

    // Attempt to update lineItems
    await expect(
      sdk.UpdateQuoteRevisionForTests({
        input: {
          id: createQuoteRevision.id,
          lineItems: [
            {
              type: QuoteLineItemType.Sale,
              description: 'Updated item',
              quantity: 2,
              sellersPriceId: priceId,
              pimCategoryId: 'test-category',
            },
          ],
        },
      }),
    ).rejects.toThrow(/cannot update.*sent/i);
  });

  it('should fail when unauthorized user attempts update', async () => {
    const { sdk: sdkA, utils: utilsA } = await createClient();
    const { quote, priceId } = await setupQuotingTestData(sdkA, utilsA);

    // Create revision in workspace A
    const { createQuoteRevision } = await sdkA.CreateQuoteRevision({
      input: {
        quoteId: quote.id,
        revisionNumber: 1,
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Test item',
            quantity: 1,
            sellersPriceId: priceId,
            pimCategoryId: 'test-category',
          },
        ],
      },
    });

    // Try to update with client from workspace B
    const { sdk: sdkB } = await createClient();
    await expect(
      sdkB.UpdateQuoteRevisionForTests({
        input: {
          id: createQuoteRevision.id,
          validUntil: new Date('2025-12-31').toISOString(),
        },
      }),
    ).rejects.toThrow();
  });

  it('should fail to update non-existent revision', async () => {
    const { sdk } = await createClient();

    await expect(
      sdk.UpdateQuoteRevisionForTests({
        input: {
          id: 'non-existent-id',
          validUntil: new Date('2025-12-31').toISOString(),
        },
      }),
    ).rejects.toThrow();
  });
});

describe('sendQuote e2e', () => {
  it('should update revision status to SENT', async () => {
    const { sdk, utils } = await createClient();
    const { quote, priceId } = await setupQuotingTestData(sdk, utils);

    // Create a DRAFT revision
    const { createQuoteRevision } = await sdk.CreateQuoteRevision({
      input: {
        quoteId: quote.id,
        revisionNumber: 1,
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Test item',
            quantity: 1,
            sellersPriceId: priceId,
            pimCategoryId: 'test-category',
          },
        ],
      },
    });

    expect(createQuoteRevision.status).toBe('DRAFT');

    // Send the quote
    await sdk.SendQuoteForTests({
      input: {
        quoteId: quote.id,
        revisionId: createQuoteRevision.id,
      },
    });

    // Verify status changed to SENT
    const sentRevision = await sdk.GetQuoteRevisionById({
      id: createQuoteRevision.id,
    });
    expect(sentRevision.quoteRevisionById?.status).toBe('SENT');
  });

  it('should update quote.currentRevisionId', async () => {
    const { sdk, utils } = await createClient();
    const { quote, priceId } = await setupQuotingTestData(sdk, utils);

    // Create a revision
    const { createQuoteRevision } = await sdk.CreateQuoteRevision({
      input: {
        quoteId: quote.id,
        revisionNumber: 1,
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Test item',
            quantity: 1,
            sellersPriceId: priceId,
            pimCategoryId: 'test-category',
          },
        ],
      },
    });

    // Send the quote
    const { sendQuote } = await sdk.SendQuoteForTests({
      input: {
        quoteId: quote.id,
        revisionId: createQuoteRevision.id,
      },
    });

    expect(sendQuote.currentRevisionId).toBe(createQuoteRevision.id);
  });

  it('should set quote status to ACTIVE on first send', async () => {
    const { sdk, utils } = await createClient();
    const { quote, priceId } = await setupQuotingTestData(sdk, utils);

    // Create and send first revision
    const { createQuoteRevision } = await sdk.CreateQuoteRevision({
      input: {
        quoteId: quote.id,
        revisionNumber: 1,
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Test item',
            quantity: 1,
            sellersPriceId: priceId,
            pimCategoryId: 'test-category',
          },
        ],
      },
    });

    const { sendQuote } = await sdk.SendQuoteForTests({
      input: {
        quoteId: quote.id,
        revisionId: createQuoteRevision.id,
      },
    });

    expect(sendQuote.status).toBe(QuoteStatus.Active);
  });

  it('should maintain quote status on subsequent sends', async () => {
    const { sdk, utils } = await createClient();
    const { quote, priceId } = await setupQuotingTestData(sdk, utils);

    // Create and send first revision
    const { createQuoteRevision: revision1 } = await sdk.CreateQuoteRevision({
      input: {
        quoteId: quote.id,
        revisionNumber: 1,
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Test item',
            quantity: 1,
            sellersPriceId: priceId,
            pimCategoryId: 'test-category',
          },
        ],
      },
    });

    await sdk.SendQuoteForTests({
      input: {
        quoteId: quote.id,
        revisionId: revision1.id,
      },
    });

    // Create and send second revision
    const { createQuoteRevision: revision2 } = await sdk.CreateQuoteRevision({
      input: {
        quoteId: quote.id,
        revisionNumber: 2,
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Test item v2',
            quantity: 2,
            sellersPriceId: priceId,
            pimCategoryId: 'test-category',
          },
        ],
      },
    });

    const { sendQuote } = await sdk.SendQuoteForTests({
      input: {
        quoteId: quote.id,
        revisionId: revision2.id,
      },
    });

    // Status should still be ACTIVE
    expect(sendQuote.status).toBe(QuoteStatus.Active);
  });

  it('should fail when revision belongs to different quote', async () => {
    const { sdk, utils } = await createClient();
    const data1 = await setupQuotingTestData(sdk, utils);
    const data2 = await setupQuotingTestData(sdk, utils);

    // Create revision for quote 1
    const { createQuoteRevision } = await sdk.CreateQuoteRevision({
      input: {
        quoteId: data1.quote.id,
        revisionNumber: 1,
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Test item',
            quantity: 1,
            sellersPriceId: data1.priceId,
            pimCategoryId: 'test-category',
          },
        ],
      },
    });

    // Try to send with quote 2
    await expect(
      sdk.SendQuoteForTests({
        input: {
          quoteId: data2.quote.id,
          revisionId: createQuoteRevision.id,
        },
      }),
    ).rejects.toThrow(/does not belong/i);
  });

  it('should allow resending same revision (idempotent)', async () => {
    const { sdk, utils } = await createClient();
    const { quote, priceId } = await setupQuotingTestData(sdk, utils);

    // Create revision
    const { createQuoteRevision } = await sdk.CreateQuoteRevision({
      input: {
        quoteId: quote.id,
        revisionNumber: 1,
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Test item',
            quantity: 1,
            sellersPriceId: priceId,
            pimCategoryId: 'test-category',
          },
        ],
      },
    });

    // Send first time
    const { sendQuote: firstSend } = await sdk.SendQuoteForTests({
      input: {
        quoteId: quote.id,
        revisionId: createQuoteRevision.id,
      },
    });

    // Send second time (resend)
    const { sendQuote: secondSend } = await sdk.SendQuoteForTests({
      input: {
        quoteId: quote.id,
        revisionId: createQuoteRevision.id,
      },
    });

    // Both should succeed and have same currentRevisionId
    expect(firstSend.currentRevisionId).toBe(createQuoteRevision.id);
    expect(secondSend.currentRevisionId).toBe(createQuoteRevision.id);

    // Revision should still be SENT
    const revision = await sdk.GetQuoteRevisionById({
      id: createQuoteRevision.id,
    });
    expect(revision.quoteRevisionById?.status).toBe('SENT');
  });

  it('should fail when unauthorized user attempts send', async () => {
    const { sdk: sdkA, utils: utilsA } = await createClient();
    const { quote, priceId } = await setupQuotingTestData(sdkA, utilsA);

    // Create revision in workspace A
    const { createQuoteRevision } = await sdkA.CreateQuoteRevision({
      input: {
        quoteId: quote.id,
        revisionNumber: 1,
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Test item',
            quantity: 1,
            sellersPriceId: priceId,
            pimCategoryId: 'test-category',
          },
        ],
      },
    });

    // Try to send with client from workspace B
    const { sdk: sdkB } = await createClient();
    await expect(
      sdkB.SendQuoteForTests({
        input: {
          quoteId: quote.id,
          revisionId: createQuoteRevision.id,
        },
      }),
    ).rejects.toThrow();
  });
});

describe('revision status lifecycle', () => {
  it('should default new revision to DRAFT status', async () => {
    const { sdk, utils } = await createClient();
    const { quote, priceId } = await setupQuotingTestData(sdk, utils);

    const { createQuoteRevision } = await sdk.CreateQuoteRevision({
      input: {
        quoteId: quote.id,
        revisionNumber: 1,
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Test item',
            quantity: 1,
            sellersPriceId: priceId,
            pimCategoryId: 'test-category',
          },
        ],
      },
    });

    expect(createQuoteRevision.status).toBe('DRAFT');

    // Verify via query as well
    const revision = await sdk.GetQuoteRevisionById({
      id: createQuoteRevision.id,
    });
    expect(revision.quoteRevisionById?.status).toBe('DRAFT');
  });

  it('should allow updating DRAFT revision multiple times', async () => {
    const { sdk, utils } = await createClient();
    const { quote, priceId } = await setupQuotingTestData(sdk, utils);

    const { createQuoteRevision } = await sdk.CreateQuoteRevision({
      input: {
        quoteId: quote.id,
        revisionNumber: 1,
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Test item',
            quantity: 1,
            sellersPriceId: priceId,
            pimCategoryId: 'test-category',
          },
        ],
      },
    });

    // First update
    await sdk.UpdateQuoteRevisionForTests({
      input: {
        id: createQuoteRevision.id,
        validUntil: new Date('2025-12-31').toISOString(),
      },
    });

    // Second update
    await sdk.UpdateQuoteRevisionForTests({
      input: {
        id: createQuoteRevision.id,
        validUntil: new Date('2026-01-31').toISOString(),
      },
    });

    // Third update with lineItems
    const { updateQuoteRevision } = await sdk.UpdateQuoteRevisionForTests({
      input: {
        id: createQuoteRevision.id,
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Updated item',
            quantity: 2,
            sellersPriceId: priceId,
            pimCategoryId: 'test-category',
          },
        ],
      },
    });

    // All updates should succeed
    expect(updateQuoteRevision.status).toBe('DRAFT');
  });

  it('should make SENT revision immutable', async () => {
    const { sdk, utils } = await createClient();
    const { quote, priceId } = await setupQuotingTestData(sdk, utils);

    // Create and send revision
    const { createQuoteRevision } = await sdk.CreateQuoteRevision({
      input: {
        quoteId: quote.id,
        revisionNumber: 1,
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Test item',
            quantity: 1,
            sellersPriceId: priceId,
            pimCategoryId: 'test-category',
          },
        ],
      },
    });

    await sdk.SendQuoteForTests({
      input: {
        quoteId: quote.id,
        revisionId: createQuoteRevision.id,
      },
    });

    const originalLineItems = createQuoteRevision.lineItems;

    // Attempt to update - should fail
    await expect(
      sdk.UpdateQuoteRevisionForTests({
        input: {
          id: createQuoteRevision.id,
          validUntil: new Date('2025-12-31').toISOString(),
        },
      }),
    ).rejects.toThrow();

    // Verify data unchanged
    const revision = await sdk.GetQuoteRevisionById({
      id: createQuoteRevision.id,
    });
    expect(revision.quoteRevisionById?.lineItems).toHaveLength(
      originalLineItems.length,
    );
  });

  it('should only allow sendQuote to transition DRAFT to SENT', async () => {
    const { sdk, utils } = await createClient();
    const { quote, priceId } = await setupQuotingTestData(sdk, utils);

    const { createQuoteRevision } = await sdk.CreateQuoteRevision({
      input: {
        quoteId: quote.id,
        revisionNumber: 1,
        lineItems: [
          {
            type: QuoteLineItemType.Sale,
            description: 'Test item',
            quantity: 1,
            sellersPriceId: priceId,
            pimCategoryId: 'test-category',
          },
        ],
      },
    });

    expect(createQuoteRevision.status).toBe('DRAFT');

    // Use sendQuote to transition
    await sdk.SendQuoteForTests({
      input: {
        quoteId: quote.id,
        revisionId: createQuoteRevision.id,
      },
    });

    // Verify status is now SENT
    const revision = await sdk.GetQuoteRevisionById({
      id: createQuoteRevision.id,
    });
    expect(revision.quoteRevisionById?.status).toBe('SENT');
  });
});
