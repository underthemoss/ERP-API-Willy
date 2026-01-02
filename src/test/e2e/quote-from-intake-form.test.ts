import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';
import {
  QuoteLineItemType,
  RequestType,
  DeliveryMethod,
  QuoteLineItemDeliveryMethod,
} from './generated/graphql';

// Define GraphQL operations for codegen
gql`
  mutation CreateQuoteFromIntakeFormSubmissionForTests(
    $input: CreateQuoteFromIntakeFormSubmissionInput!
  ) {
    createQuoteFromIntakeFormSubmission(input: $input) {
      id
      sellerWorkspaceId
      sellersBuyerContactId
      sellersProjectId
      status
      intakeFormSubmissionId
      currentRevisionId
      currentRevision {
        id
        revisionNumber
        status
        hasUnpricedLineItems
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
            intakeFormSubmissionLineItemId
            deliveryMethod
            deliveryLocation
            deliveryNotes
            placeRef {
              kind
              id
            }
          }
          ... on QuoteRevisionSaleLineItem {
            id
            description
            quantity
            subtotalInCents
            type
            pimCategoryId
            sellersPriceId
            intakeFormSubmissionLineItemId
            deliveryMethod
            deliveryLocation
            deliveryNotes
            placeRef {
              kind
              id
            }
          }
          ... on QuoteRevisionServiceLineItem {
            id
            description
            quantity
            subtotalInCents
            type
            sellersPriceId
            intakeFormSubmissionLineItemId
            deliveryMethod
            deliveryLocation
            deliveryNotes
            placeRef {
              kind
              id
            }
          }
        }
      }
    }
  }
`;

gql`
  mutation CreateIntakeFormForQuoteTests($input: IntakeFormInput!) {
    createIntakeForm(input: $input) {
      id
      workspaceId
      projectId
      pricebookId
      isPublic
      isActive
    }
  }
`;

gql`
  mutation CreateIntakeFormSubmissionForQuoteTests(
    $input: IntakeFormSubmissionInput!
  ) {
    createIntakeFormSubmission(input: $input) {
      id
      formId
      workspaceId
      name
      email
      status
      lineItems {
        id
        description
        quantity
        type
        pimCategoryId
        priceId
        deliveryMethod
        deliveryLocation
        deliveryNotes
        rentalStartDate
        rentalEndDate
      }
    }
  }
`;

gql`
  mutation CreateIntakeFormSubmissionLineItemForQuoteTests(
    $submissionId: String!
    $input: IntakeFormLineItemInput!
  ) {
    createIntakeFormSubmissionLineItem(
      submissionId: $submissionId
      input: $input
    ) {
      id
      description
      quantity
      type
      pimCategoryId
      priceId
      deliveryMethod
      deliveryLocation
      deliveryNotes
      rentalStartDate
      rentalEndDate
    }
  }
`;

gql`
  mutation SubmitIntakeFormSubmissionForQuoteTests($id: String!) {
    submitIntakeFormSubmission(id: $id) {
      id
      status
      submittedAt
    }
  }
`;

gql`
  mutation CreateQuoteRevisionWithOptionalPrice(
    $input: CreateQuoteRevisionInput!
  ) {
    createQuoteRevision(input: $input) {
      id
      quoteId
      revisionNumber
      status
      hasUnpricedLineItems
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
          intakeFormSubmissionLineItemId
          deliveryMethod
          deliveryLocation
          deliveryNotes
          placeRef {
            kind
            id
          }
        }
        ... on QuoteRevisionSaleLineItem {
          id
          description
          quantity
          subtotalInCents
          type
          pimCategoryId
          sellersPriceId
          intakeFormSubmissionLineItemId
          deliveryMethod
          deliveryLocation
          deliveryNotes
          placeRef {
            kind
            id
          }
        }
      }
    }
  }
`;

gql`
  mutation CreateQuoteForIntakeTests($input: CreateQuoteInput!) {
    createQuote(input: $input) {
      id
      sellerWorkspaceId
      sellersBuyerContactId
      sellersProjectId
      status
      intakeFormSubmissionId
    }
  }
`;

gql`
  mutation UpdateQuoteRevisionForIntakeTests(
    $input: UpdateQuoteRevisionInput!
  ) {
    updateQuoteRevision(input: $input) {
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
          subtotalInCents
          type
          pimCategoryId
          rentalStartDate
          rentalEndDate
          sellersPriceId
          intakeFormSubmissionLineItemId
          deliveryMethod
          deliveryLocation
          deliveryNotes
          placeRef {
            kind
            id
          }
        }
        ... on QuoteRevisionSaleLineItem {
          id
          description
          quantity
          subtotalInCents
          type
          pimCategoryId
          sellersPriceId
          intakeFormSubmissionLineItemId
          deliveryMethod
          deliveryLocation
          deliveryNotes
          placeRef {
            kind
            id
          }
        }
        ... on QuoteRevisionServiceLineItem {
          id
          description
          quantity
          subtotalInCents
          type
          sellersPriceId
          intakeFormSubmissionLineItemId
          deliveryMethod
          deliveryLocation
          deliveryNotes
          placeRef {
            kind
            id
          }
        }
      }
    }
  }
`;

gql`
  mutation SendQuoteForIntakeTests($input: SendQuoteInput!) {
    sendQuote(input: $input) {
      id
      status
      currentRevisionId
    }
  }
`;

gql`
  mutation CreateRentalPriceForQuoteTests($input: CreateRentalPriceInput!) {
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
  mutation CreateSalePriceForQuoteTests($input: CreateSalePriceInput!) {
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
  mutation CreatePriceBookForQuoteTests($input: CreatePriceBookInput!) {
    createPriceBook(input: $input) {
      id
      workspaceId
      name
    }
  }
`;

gql`
  mutation CreatePimCategoryForQuoteTests($input: UpsertPimCategoryInput!) {
    upsertPimCategory(input: $input) {
      id
      name
      path
    }
  }
`;

gql`
  mutation CreateBusinessContactForQuoteTests($input: BusinessContactInput!) {
    createBusinessContact(input: $input) {
      id
      workspaceId
      name
    }
  }
`;

gql`
  mutation CreatePersonContactForQuoteTests($input: PersonContactInput!) {
    createPersonContact(input: $input) {
      id
      workspaceId
      name
      email
    }
  }
`;

gql`
  mutation CreateProjectForQuoteTests($input: ProjectInput!) {
    createProject(input: $input) {
      id
      workspaceId
      name
    }
  }
`;

const { createClient } = createTestEnvironment();

/**
 * Helper function to set up test data for intake-to-quote conversion tests
 */
async function setupTestData(sdk: any, utils: any) {
  // Create workspace
  const workspace = await utils.createWorkspace();
  const workspaceId = workspace.id;

  // Create PIM category
  const { upsertPimCategory } = await sdk.CreatePimCategoryForQuoteTests({
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
  const { createPriceBook } = await sdk.CreatePriceBookForQuoteTests({
    input: { name: 'Test Price Book', workspaceId },
  });
  const priceBookId = createPriceBook.id;

  // Create rental price
  const { createRentalPrice } = await sdk.CreateRentalPriceForQuoteTests({
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
  const { createSalePrice } = await sdk.CreateSalePriceForQuoteTests({
    input: {
      workspaceId,
      pimCategoryId,
      priceBookId,
      unitCostInCents: 50000, // $500 per unit
    },
  });
  const salePriceId = createSalePrice.id;

  // Create business contact
  const { createBusinessContact } =
    await sdk.CreateBusinessContactForQuoteTests({
      input: { workspaceId, name: 'Test Buyer Contact' },
    });
  const businessContactId = createBusinessContact.id;

  // Create person contact associated with the business
  const { createPersonContact } = await sdk.CreatePersonContactForQuoteTests({
    input: {
      workspaceId,
      name: 'Test Buyer Contact Rep',
      email: `buyer-${Date.now()}@example.com`,
      businessId: businessContactId,
    },
  });
  const buyerContactId = createPersonContact.id;

  // Create project
  const { createProject } = await sdk.CreateProjectForQuoteTests({
    input: {
      workspaceId,
      name: 'Test Project',
      project_code: `TEST-${Date.now()}`,
      deleted: false,
    },
  });
  const projectId = createProject.id;

  // Create intake form
  const { createIntakeForm } = await sdk.CreateIntakeFormForQuoteTests({
    input: {
      workspaceId,
      pricebookId: priceBookId,
      isPublic: true,
      isActive: true,
    },
  });
  const intakeFormId = createIntakeForm!.id;

  return {
    workspaceId,
    pimCategoryId,
    priceBookId,
    rentalPriceId,
    salePriceId,
    buyerContactId,
    businessContactId,
    projectId,
    intakeFormId,
  };
}

describe('createQuoteFromIntakeFormSubmission e2e', () => {
  it('creates a quote from an intake form submission with priced line items', async () => {
    const { sdk, utils } = await createClient();
    const testData = await setupTestData(sdk, utils);

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later

    // Create intake form submission
    const { createIntakeFormSubmission } =
      await sdk.CreateIntakeFormSubmissionForQuoteTests({
        input: {
          formId: testData.intakeFormId,
          workspaceId: testData.workspaceId,
          name: 'Test Buyer',
          email: `test-buyer-${Date.now()}@example.com`,
          companyName: 'Test Company',
        },
      });

    const submissionId = createIntakeFormSubmission!.id;

    // Add rental line item with price
    await sdk.CreateIntakeFormSubmissionLineItemForQuoteTests({
      submissionId,
      input: {
        type: RequestType.Rental,
        description: 'Rental equipment with price',
        quantity: 2,
        pimCategoryId: testData.pimCategoryId,
        priceId: testData.rentalPriceId,
        startDate: startDate.toISOString(),
        durationInDays: 7,
        rentalStartDate: startDate.toISOString(),
        rentalEndDate: endDate.toISOString(),
        deliveryMethod: DeliveryMethod.Delivery,
        deliveryLocation: '123 Main St',
        deliveryNotes: 'Leave at front door',
      },
    });

    // Add purchase line item with price
    await sdk.CreateIntakeFormSubmissionLineItemForQuoteTests({
      submissionId,
      input: {
        type: RequestType.Purchase,
        description: 'Purchase item with price',
        quantity: 3,
        pimCategoryId: testData.pimCategoryId,
        priceId: testData.salePriceId,
        startDate: startDate.toISOString(),
        durationInDays: 1,
        deliveryMethod: DeliveryMethod.Pickup,
      },
    });

    // Submit the intake form
    await sdk.SubmitIntakeFormSubmissionForQuoteTests({
      id: submissionId,
    });

    // Create quote from intake form submission
    const { createQuoteFromIntakeFormSubmission } =
      await sdk.CreateQuoteFromIntakeFormSubmissionForTests({
        input: {
          intakeFormSubmissionId: submissionId,
          sellersBuyerContactId: testData.buyerContactId,
          sellersProjectId: testData.projectId,
        },
      });

    // Verify quote was created with correct tracking
    expect(createQuoteFromIntakeFormSubmission.id).toBeDefined();
    expect(createQuoteFromIntakeFormSubmission.intakeFormSubmissionId).toBe(
      submissionId,
    );
    expect(createQuoteFromIntakeFormSubmission.sellerWorkspaceId).toBe(
      testData.workspaceId,
    );
    expect(createQuoteFromIntakeFormSubmission.sellersBuyerContactId).toBe(
      testData.buyerContactId,
    );
    expect(createQuoteFromIntakeFormSubmission.sellersProjectId).toBe(
      testData.projectId,
    );
    expect(createQuoteFromIntakeFormSubmission.status).toBe('ACTIVE');

    // Verify revision was created
    const revision = createQuoteFromIntakeFormSubmission.currentRevision;
    expect(revision).toBeDefined();
    expect(revision!.revisionNumber).toBe(1);
    expect(revision!.status).toBe('DRAFT');
    expect(revision!.hasUnpricedLineItems).toBe(false); // All items have prices

    // Verify line items were mapped correctly
    const lineItems = revision!.lineItems;
    expect(lineItems).toHaveLength(2);

    // Find rental line item
    const rentalLineItem = lineItems.find(
      (item: any) => item.type === 'RENTAL',
    ) as any;
    expect(rentalLineItem).toBeDefined();
    expect(rentalLineItem.description).toBe('Rental equipment with price');
    expect(rentalLineItem.quantity).toBe(2);
    expect(rentalLineItem.sellersPriceId).toBe(testData.rentalPriceId);
    expect(rentalLineItem.intakeFormSubmissionLineItemId).toBeDefined();
    expect(rentalLineItem.deliveryMethod).toBe(
      QuoteLineItemDeliveryMethod.Delivery,
    );
    expect(rentalLineItem.deliveryLocation).toBe('123 Main St');
    expect(rentalLineItem.deliveryNotes).toBe('Leave at front door');
    expect(rentalLineItem.subtotalInCents).toBeGreaterThan(0); // Should have calculated subtotal

    // Find sale line item (PURCHASE -> SALE)
    const saleLineItem = lineItems.find(
      (item: any) => item.type === 'SALE',
    ) as any;
    expect(saleLineItem).toBeDefined();
    expect(saleLineItem.description).toBe('Purchase item with price');
    expect(saleLineItem.quantity).toBe(3);
    expect(saleLineItem.sellersPriceId).toBe(testData.salePriceId);
    expect(saleLineItem.intakeFormSubmissionLineItemId).toBeDefined();
    expect(saleLineItem.deliveryMethod).toBe(
      QuoteLineItemDeliveryMethod.Pickup,
    );
    expect(saleLineItem.subtotalInCents).toBe(150000); // 3 * $500 = $1500
  });

  it('creates a quote from an intake form submission with unpriced line items', async () => {
    const { sdk, utils } = await createClient();
    const testData = await setupTestData(sdk, utils);

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Create intake form submission
    const { createIntakeFormSubmission } =
      await sdk.CreateIntakeFormSubmissionForQuoteTests({
        input: {
          formId: testData.intakeFormId,
          workspaceId: testData.workspaceId,
          name: 'Test Buyer',
          email: `test-buyer-${Date.now()}@example.com`,
          companyName: 'Test Company',
        },
      });

    const submissionId = createIntakeFormSubmission!.id;

    // Add rental line item WITHOUT price (custom request)
    await sdk.CreateIntakeFormSubmissionLineItemForQuoteTests({
      submissionId,
      input: {
        type: RequestType.Rental,
        description: 'Custom rental equipment (no price)',
        quantity: 1,
        pimCategoryId: testData.pimCategoryId,
        // No priceId - this is a custom request
        startDate: startDate.toISOString(),
        durationInDays: 14,
        rentalStartDate: startDate.toISOString(),
        rentalEndDate: endDate.toISOString(),
        deliveryMethod: DeliveryMethod.Delivery,
        deliveryLocation: '456 Oak Ave',
      },
    });

    // Add purchase line item with price
    await sdk.CreateIntakeFormSubmissionLineItemForQuoteTests({
      submissionId,
      input: {
        type: RequestType.Purchase,
        description: 'Standard purchase item',
        quantity: 2,
        pimCategoryId: testData.pimCategoryId,
        priceId: testData.salePriceId,
        startDate: startDate.toISOString(),
        durationInDays: 1,
        deliveryMethod: DeliveryMethod.Pickup,
      },
    });

    // Submit the intake form
    await sdk.SubmitIntakeFormSubmissionForQuoteTests({
      id: submissionId,
    });

    // Create quote from intake form submission
    const { createQuoteFromIntakeFormSubmission } =
      await sdk.CreateQuoteFromIntakeFormSubmissionForTests({
        input: {
          intakeFormSubmissionId: submissionId,
          sellersBuyerContactId: testData.buyerContactId,
          sellersProjectId: testData.projectId,
        },
      });

    // Verify revision shows unpriced items
    const revision = createQuoteFromIntakeFormSubmission.currentRevision;
    expect(revision!.hasUnpricedLineItems).toBe(true);

    const lineItems = revision!.lineItems;
    expect(lineItems).toHaveLength(2);

    // Find unpriced rental line item
    const unpricedRentalItem = lineItems.find(
      (item: any) => item.type === 'RENTAL' && item.sellersPriceId === null,
    ) as any;
    expect(unpricedRentalItem).toBeDefined();
    expect(unpricedRentalItem.description).toBe(
      'Custom rental equipment (no price)',
    );
    expect(unpricedRentalItem.subtotalInCents).toBe(0); // No price = 0 subtotal
    expect(unpricedRentalItem.intakeFormSubmissionLineItemId).toBeDefined();

    // Find priced sale line item
    const pricedSaleItem = lineItems.find(
      (item: any) => item.type === 'SALE',
    ) as any;
    expect(pricedSaleItem).toBeDefined();
    expect(pricedSaleItem.subtotalInCents).toBe(100000); // 2 * $500 = $1000
  });

  it('fails to create quote from non-submitted intake form', async () => {
    const { sdk, utils } = await createClient();
    const testData = await setupTestData(sdk, utils);

    // Create intake form submission but don't submit it
    const { createIntakeFormSubmission } =
      await sdk.CreateIntakeFormSubmissionForQuoteTests({
        input: {
          formId: testData.intakeFormId,
          workspaceId: testData.workspaceId,
          name: 'Test Buyer',
          email: `test-buyer-${Date.now()}@example.com`,
        },
      });

    const submissionId = createIntakeFormSubmission!.id;

    // Try to create quote from DRAFT submission
    await expect(
      sdk.CreateQuoteFromIntakeFormSubmissionForTests({
        input: {
          intakeFormSubmissionId: submissionId,
          sellersBuyerContactId: testData.buyerContactId,
          sellersProjectId: testData.projectId,
        },
      }),
    ).rejects.toThrow('submitted');
  });

  it('fails to send quote with unpriced line items', async () => {
    const { sdk, utils } = await createClient();
    const testData = await setupTestData(sdk, utils);

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Create intake form submission with unpriced item
    const { createIntakeFormSubmission } =
      await sdk.CreateIntakeFormSubmissionForQuoteTests({
        input: {
          formId: testData.intakeFormId,
          workspaceId: testData.workspaceId,
          name: 'Test Buyer',
          email: `test-buyer-${Date.now()}@example.com`,
        },
      });

    const submissionId = createIntakeFormSubmission!.id;

    await sdk.CreateIntakeFormSubmissionLineItemForQuoteTests({
      submissionId,
      input: {
        type: RequestType.Rental,
        description: 'Unpriced item',
        quantity: 1,
        pimCategoryId: testData.pimCategoryId,
        startDate: startDate.toISOString(),
        durationInDays: 7,
        rentalStartDate: startDate.toISOString(),
        rentalEndDate: endDate.toISOString(),
        deliveryMethod: DeliveryMethod.Delivery,
      },
    });

    await sdk.SubmitIntakeFormSubmissionForQuoteTests({
      id: submissionId,
    });

    // Create quote from intake
    const { createQuoteFromIntakeFormSubmission } =
      await sdk.CreateQuoteFromIntakeFormSubmissionForTests({
        input: {
          intakeFormSubmissionId: submissionId,
          sellersBuyerContactId: testData.buyerContactId,
          sellersProjectId: testData.projectId,
        },
      });

    const quoteId = createQuoteFromIntakeFormSubmission.id;
    const revisionId = createQuoteFromIntakeFormSubmission.currentRevision!.id;

    // Try to send the quote - should fail because it has unpriced items
    await expect(
      sdk.SendQuoteForIntakeTests({
        input: {
          quoteId,
          revisionId,
        },
      }),
    ).rejects.toThrow('prices');
  });
});

describe('quote revision with optional priceId e2e', () => {
  it('creates quote revision with line items without priceId', async () => {
    const { sdk, utils } = await createClient();
    const testData = await setupTestData(sdk, utils);

    // Create a quote directly
    const { createQuote } = await sdk.CreateQuoteForIntakeTests({
      input: {
        sellerWorkspaceId: testData.workspaceId,
        sellersBuyerContactId: testData.buyerContactId,
        sellersProjectId: testData.projectId,
      },
    });

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Create revision with unpriced line item
    const { createQuoteRevision } =
      await sdk.CreateQuoteRevisionWithOptionalPrice({
        input: {
          quoteId: createQuote.id,
          revisionNumber: 1,
          lineItems: [
            {
              type: QuoteLineItemType.Rental,
              description: 'Unpriced rental item',
              quantity: 2,
              pimCategoryId: testData.pimCategoryId,
              // No sellersPriceId
              rentalStartDate: startDate.toISOString(),
              rentalEndDate: endDate.toISOString(),
              deliveryMethod: QuoteLineItemDeliveryMethod.Delivery,
              deliveryLocation: '789 Pine St',
            },
            {
              type: QuoteLineItemType.Sale,
              description: 'Priced sale item',
              quantity: 1,
              pimCategoryId: testData.pimCategoryId,
              sellersPriceId: testData.salePriceId,
            },
          ],
        },
      });

    expect(createQuoteRevision.hasUnpricedLineItems).toBe(true);
    expect(createQuoteRevision.lineItems).toHaveLength(2);

    // Verify unpriced item
    const unpricedItem = createQuoteRevision.lineItems.find(
      (item: any) => item.sellersPriceId === null,
    ) as any;
    expect(unpricedItem).toBeDefined();
    expect(unpricedItem.subtotalInCents).toBe(0);
    expect(unpricedItem.deliveryMethod).toBe(
      QuoteLineItemDeliveryMethod.Delivery,
    );
    expect(unpricedItem.deliveryLocation).toBe('789 Pine St');

    // Verify priced item
    const pricedItem = createQuoteRevision.lineItems.find(
      (item: any) => item.sellersPriceId !== null,
    ) as any;
    expect(pricedItem).toBeDefined();
    expect(pricedItem.subtotalInCents).toBe(50000); // 1 * $500
  });

  it('tracks intake form submission line item id in quote line items', async () => {
    const { sdk, utils } = await createClient();
    const testData = await setupTestData(sdk, utils);

    // Create a quote directly with tracking field
    const { createQuote } = await sdk.CreateQuoteForIntakeTests({
      input: {
        sellerWorkspaceId: testData.workspaceId,
        sellersBuyerContactId: testData.buyerContactId,
        sellersProjectId: testData.projectId,
      },
    });

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fakeIntakeLineItemId = 'intake-line-item-123';

    // Create revision with tracking field
    const { createQuoteRevision } =
      await sdk.CreateQuoteRevisionWithOptionalPrice({
        input: {
          quoteId: createQuote.id,
          revisionNumber: 1,
          lineItems: [
            {
              type: QuoteLineItemType.Rental,
              description: 'Tracked item',
              quantity: 1,
              pimCategoryId: testData.pimCategoryId,
              sellersPriceId: testData.rentalPriceId,
              rentalStartDate: startDate.toISOString(),
              rentalEndDate: endDate.toISOString(),
              intakeFormSubmissionLineItemId: fakeIntakeLineItemId,
            },
          ],
        },
      });

    const lineItem = createQuoteRevision.lineItems[0] as any;
    expect(lineItem.intakeFormSubmissionLineItemId).toBe(fakeIntakeLineItemId);
  });

  it('preserves intakeFormSubmissionLineItemId when updating quote revision line items', async () => {
    const { sdk, utils } = await createClient();
    const testData = await setupTestData(sdk, utils);

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Create intake form submission
    const { createIntakeFormSubmission } =
      await sdk.CreateIntakeFormSubmissionForQuoteTests({
        input: {
          formId: testData.intakeFormId,
          workspaceId: testData.workspaceId,
          name: 'Test Buyer',
          email: `test-buyer-${Date.now()}@example.com`,
          companyName: 'Test Company',
        },
      });

    const submissionId = createIntakeFormSubmission!.id;

    // Add rental line item with price
    const { createIntakeFormSubmissionLineItem: rentalLineItem } =
      await sdk.CreateIntakeFormSubmissionLineItemForQuoteTests({
        submissionId,
        input: {
          type: RequestType.Rental,
          description: 'Rental equipment',
          quantity: 2,
          pimCategoryId: testData.pimCategoryId,
          priceId: testData.rentalPriceId,
          startDate: startDate.toISOString(),
          durationInDays: 7,
          rentalStartDate: startDate.toISOString(),
          rentalEndDate: endDate.toISOString(),
          deliveryMethod: DeliveryMethod.Delivery,
          deliveryLocation: '123 Main St',
        },
      });

    // Add sale line item with price
    const { createIntakeFormSubmissionLineItem: saleLineItem } =
      await sdk.CreateIntakeFormSubmissionLineItemForQuoteTests({
        submissionId,
        input: {
          type: RequestType.Purchase,
          description: 'Purchase item',
          quantity: 3,
          pimCategoryId: testData.pimCategoryId,
          priceId: testData.salePriceId,
          startDate: startDate.toISOString(),
          durationInDays: 1,
          deliveryMethod: DeliveryMethod.Pickup,
        },
      });

    // Submit the intake form
    await sdk.SubmitIntakeFormSubmissionForQuoteTests({
      id: submissionId,
    });

    // Create quote from intake form submission
    const { createQuoteFromIntakeFormSubmission } =
      await sdk.CreateQuoteFromIntakeFormSubmissionForTests({
        input: {
          intakeFormSubmissionId: submissionId,
          sellersBuyerContactId: testData.buyerContactId,
          sellersProjectId: testData.projectId,
        },
      });

    const revision = createQuoteFromIntakeFormSubmission.currentRevision!;
    const originalLineItems = revision.lineItems;

    // Verify both line items have intakeFormSubmissionLineItemId set
    const originalRentalItem = originalLineItems.find(
      (item: any) => item.type === 'RENTAL',
    ) as any;
    const originalSaleItem = originalLineItems.find(
      (item: any) => item.type === 'SALE',
    ) as any;

    expect(originalRentalItem.intakeFormSubmissionLineItemId).toBe(
      rentalLineItem!.id,
    );
    expect(originalSaleItem.intakeFormSubmissionLineItemId).toBe(
      saleLineItem!.id,
    );

    // Now update the revision - modify descriptions but keep the tracking IDs
    const { updateQuoteRevision } = await sdk.UpdateQuoteRevisionForIntakeTests(
      {
        input: {
          id: revision.id,
          lineItems: [
            {
              type: QuoteLineItemType.Rental,
              description: 'Updated rental equipment description',
              quantity: 5, // Changed quantity
              pimCategoryId: testData.pimCategoryId,
              sellersPriceId: testData.rentalPriceId,
              rentalStartDate: startDate.toISOString(),
              rentalEndDate: endDate.toISOString(),
              deliveryMethod: QuoteLineItemDeliveryMethod.Delivery,
              deliveryLocation: '456 New Address',
              intakeFormSubmissionLineItemId:
                originalRentalItem.intakeFormSubmissionLineItemId,
            },
            {
              type: QuoteLineItemType.Sale,
              description: 'Updated purchase item description',
              quantity: 10, // Changed quantity
              pimCategoryId: testData.pimCategoryId,
              sellersPriceId: testData.salePriceId,
              deliveryMethod: QuoteLineItemDeliveryMethod.Pickup,
              intakeFormSubmissionLineItemId:
                originalSaleItem.intakeFormSubmissionLineItemId,
            },
          ],
        },
      },
    );

    // Verify the tracking IDs are preserved after update
    const updatedRentalItem = updateQuoteRevision.lineItems.find(
      (item: any) => item.type === 'RENTAL',
    ) as any;
    const updatedSaleItem = updateQuoteRevision.lineItems.find(
      (item: any) => item.type === 'SALE',
    ) as any;

    // The intakeFormSubmissionLineItemId should be preserved
    expect(updatedRentalItem.intakeFormSubmissionLineItemId).toBe(
      rentalLineItem!.id,
    );
    expect(updatedSaleItem.intakeFormSubmissionLineItemId).toBe(
      saleLineItem!.id,
    );

    // Verify other fields were updated correctly
    expect(updatedRentalItem.description).toBe(
      'Updated rental equipment description',
    );
    expect(updatedRentalItem.quantity).toBe(5);
    expect(updatedRentalItem.deliveryLocation).toBe('456 New Address');

    expect(updatedSaleItem.description).toBe(
      'Updated purchase item description',
    );
    expect(updatedSaleItem.quantity).toBe(10);
  });

  it('handles null intakeFormSubmissionLineItemId in update mutation', async () => {
    const { sdk, utils, client } = await createClient();
    const testData = await setupTestData(sdk, utils);

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Create a quote directly (not from intake form, so no intakeFormSubmissionLineItemId)
    const { createQuote } = await sdk.CreateQuoteForIntakeTests({
      input: {
        sellerWorkspaceId: testData.workspaceId,
        sellersBuyerContactId: testData.buyerContactId,
        sellersProjectId: testData.projectId,
      },
    });

    // Create revision with line items
    const { createQuoteRevision } =
      await sdk.CreateQuoteRevisionWithOptionalPrice({
        input: {
          quoteId: createQuote.id,
          revisionNumber: 1,
          lineItems: [
            {
              type: QuoteLineItemType.Rental,
              description: 'First rental item',
              quantity: 1,
              pimCategoryId: testData.pimCategoryId,
              sellersPriceId: testData.rentalPriceId,
              rentalStartDate: startDate.toISOString(),
              rentalEndDate: endDate.toISOString(),
            },
            {
              type: QuoteLineItemType.Rental,
              description: 'Second rental item',
              quantity: 2,
              pimCategoryId: testData.pimCategoryId,
              sellersPriceId: testData.rentalPriceId,
              rentalStartDate: startDate.toISOString(),
              rentalEndDate: endDate.toISOString(),
            },
          ],
        },
      });

    const existingLineItem = createQuoteRevision.lineItems[0] as any;

    // Now update using raw GraphQL to explicitly send null values (like the frontend does)
    const updateMutation = `
      mutation UpdateQuoteRevision($input: UpdateQuoteRevisionInput!) {
        updateQuoteRevision(input: $input) {
          id
          lineItems {
            __typename
            ... on QuoteRevisionRentalLineItem {
              id
              description
              intakeFormSubmissionLineItemId
            }
          }
        }
      }
    `;

    // This simulates exactly what the frontend sends - explicit null values
    const result = await client.request(updateMutation, {
      input: {
        id: createQuoteRevision.id,
        lineItems: [
          {
            id: existingLineItem.id,
            type: 'RENTAL',
            description: 'Updated first item',
            quantity: 1,
            pimCategoryId: testData.pimCategoryId,
            sellersPriceId: testData.rentalPriceId,
            rentalStartDate: startDate.toISOString(),
            rentalEndDate: endDate.toISOString(),
            deliveryLocation: null, // Explicit null like frontend sends
            deliveryMethod: null, // Explicit null like frontend sends
            deliveryNotes: null, // Explicit null like frontend sends
            intakeFormSubmissionLineItemId: null, // Explicit null - THIS IS THE PROBLEM
          },
          {
            id: 'new-item-123', // New item with non-UUID id
            type: 'RENTAL',
            description: 'Brand new item',
            quantity: 3,
            pimCategoryId: testData.pimCategoryId,
            sellersPriceId: testData.rentalPriceId,
            rentalStartDate: startDate.toISOString(),
            rentalEndDate: endDate.toISOString(),
            deliveryLocation: null,
            deliveryMethod: null,
            deliveryNotes: null,
            intakeFormSubmissionLineItemId: null,
          },
        ],
      },
    });

    // Should succeed without Zod validation errors
    expect((result as any).updateQuoteRevision.lineItems).toHaveLength(2);
  });

  it('auto-preserves intakeFormSubmissionLineItemId when updating with matching line item id', async () => {
    const { sdk, utils } = await createClient();
    const testData = await setupTestData(sdk, utils);

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Create intake form submission
    const { createIntakeFormSubmission } =
      await sdk.CreateIntakeFormSubmissionForQuoteTests({
        input: {
          formId: testData.intakeFormId,
          workspaceId: testData.workspaceId,
          name: 'Test Buyer',
          email: `test-buyer-${Date.now()}@example.com`,
          companyName: 'Test Company',
        },
      });

    const submissionId = createIntakeFormSubmission!.id;

    // Add rental line item
    const { createIntakeFormSubmissionLineItem: rentalLineItem } =
      await sdk.CreateIntakeFormSubmissionLineItemForQuoteTests({
        submissionId,
        input: {
          type: RequestType.Rental,
          description: 'Rental equipment',
          quantity: 2,
          pimCategoryId: testData.pimCategoryId,
          priceId: testData.rentalPriceId,
          startDate: startDate.toISOString(),
          durationInDays: 7,
          rentalStartDate: startDate.toISOString(),
          rentalEndDate: endDate.toISOString(),
          deliveryMethod: DeliveryMethod.Delivery,
        },
      });

    // Submit the intake form
    await sdk.SubmitIntakeFormSubmissionForQuoteTests({
      id: submissionId,
    });

    // Create quote from intake form submission
    const { createQuoteFromIntakeFormSubmission } =
      await sdk.CreateQuoteFromIntakeFormSubmissionForTests({
        input: {
          intakeFormSubmissionId: submissionId,
          sellersBuyerContactId: testData.buyerContactId,
          sellersProjectId: testData.projectId,
        },
      });

    const revision = createQuoteFromIntakeFormSubmission.currentRevision!;
    const originalRentalItem = revision.lineItems.find(
      (item: any) => item.type === 'RENTAL',
    ) as any;

    // Verify tracking ID is set initially
    expect(originalRentalItem.intakeFormSubmissionLineItemId).toBe(
      rentalLineItem!.id,
    );

    // Update the revision WITH the line item id but WITHOUT providing intakeFormSubmissionLineItemId
    // The tracking field should be automatically preserved when the line item id matches
    const { updateQuoteRevision } = await sdk.UpdateQuoteRevisionForIntakeTests(
      {
        input: {
          id: revision.id,
          lineItems: [
            {
              id: originalRentalItem.id, // Include the line item id for matching
              type: QuoteLineItemType.Rental,
              description: 'Updated description',
              quantity: 5,
              pimCategoryId: testData.pimCategoryId,
              sellersPriceId: testData.rentalPriceId,
              rentalStartDate: startDate.toISOString(),
              rentalEndDate: endDate.toISOString(),
              // NOTE: intakeFormSubmissionLineItemId is NOT provided but should be preserved
            },
          ],
        },
      },
    );

    const updatedRentalItem = updateQuoteRevision.lineItems.find(
      (item: any) => item.type === 'RENTAL',
    ) as any;

    // The intakeFormSubmissionLineItemId should be preserved automatically
    // when the line item id matches an existing line item
    expect(updatedRentalItem.intakeFormSubmissionLineItemId).toBe(
      rentalLineItem!.id,
    );
  });
});
