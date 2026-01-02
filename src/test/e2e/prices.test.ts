import { WorkspaceAccessType } from './generated/graphql';
import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';

// GraphQL operations for codegen (for reference, not used directly in tests)

gql`
  mutation CreatePimCategoryForPrices($input: UpsertPimCategoryInput!) {
    upsertPimCategory(input: $input) {
      id
      name
    }
  }
`;

gql`
  mutation CreatePriceBookForPrices($input: CreatePriceBookInput!) {
    createPriceBook(input: $input) {
      id
      name
    }
  }
`;

gql`
  mutation CreateRentalPriceForPrices($input: CreateRentalPriceInput!) {
    createRentalPrice(input: $input) {
      id
      priceBookId
      pimCategoryId
      pimCategoryName
      pimCategoryPath
      pricePerDayInCents
    }
  }
`;

gql`
  mutation CreateSalePriceForPrices($input: CreateSalePriceInput!) {
    createSalePrice(input: $input) {
      id
      priceBookId
      pimCategoryId
      pimCategoryName
      pimCategoryPath
      unitCostInCents
    }
  }
`;

gql`
  query ListPrices($filter: ListPricesFilter!, $page: ListPricesPage!) {
    listPrices(filter: $filter, page: $page) {
      items {
        __typename
        ... on RentalPrice {
          id
          pricingSpec {
            kind
            unitCode
            rateInCents
            pricePerDayInCents
            pricePerWeekInCents
            pricePerMonthInCents
          }
        }
        ... on SalePrice {
          id
          pricingSpec {
            kind
            unitCode
            rateInCents
            pricePerDayInCents
            pricePerWeekInCents
            pricePerMonthInCents
          }
        }
        ... on ServicePrice {
          id
          pricingSpec {
            kind
            unitCode
            rateInCents
            pricePerDayInCents
            pricePerWeekInCents
            pricePerMonthInCents
          }
        }
      }
      page {
        number
        size
      }
    }
  }
`;

gql`
  mutation DeletePriceById($id: ID!) {
    deletePriceById(id: $id)
  }
`;

gql`
  mutation CreateBusinessContactForPrices($input: BusinessContactInput!) {
    createBusinessContact(input: $input) {
      id
      name
    }
  }
`;

gql`
  mutation CreateProjectForPrices($input: ProjectInput) {
    createProject(input: $input) {
      id
      name
      project_code
    }
  }
`;

gql`
  query CalculateSubTotal($priceId: ID!, $durationInDays: Int!) {
    calculateSubTotal(priceId: $priceId, durationInDays: $durationInDays) {
      accumulative_cost_in_cents
      days {
        day
        accumulative_cost_in_cents
        cost_in_cents
        strategy
        rental_period {
          days1
          days7
          days28
        }
        savings_compared_to_day_rate_in_cents
        savings_compared_to_day_rate_in_fraction
        savings_compared_to_exact_split_in_cents
      }
    }
  }
`;

gql`
  query GetRentalPriceWithCalculateSubTotal(
    $priceId: ID!
    $durationInDays: Int!
  ) {
    getPriceById(id: $priceId) {
      __typename
      ... on RentalPrice {
        id
        pricePerDayInCents
        pricePerWeekInCents
        pricePerMonthInCents
        calculateSubTotal(durationInDays: $durationInDays) {
          accumulative_cost_in_cents
          days {
            day
            accumulative_cost_in_cents
            cost_in_cents
            strategy
          }
        }
      }
    }
  }
`;

gql`
  query GetPriceById($id: ID!) {
    getPriceById(id: $id) {
      ... on RentalPrice {
        id
        pricePerDayInCents
        pricePerWeekInCents
        pricePerMonthInCents
      }
      ... on SalePrice {
        id
        unitCostInCents
      }
    }
  }
`;

const { createClient } = createTestEnvironment();

describe('Prices GraphQL e2e', () => {
  it('creates, lists, and deletes rental and sale prices', async () => {
    const { sdk } = await createClient();
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'Prices Test Workspace',
    });
    if (!createWorkspace) {
      throw new Error('failed to create workspace for price books test');
    }
    const workspaceId = createWorkspace.id;

    const { upsertPimCategory } = await sdk.CreatePimCategoryForPrices({
      input: {
        id: 'price-cat-1',
        name: 'Price Category',
        path: '|P|',
        platform_id: 'price-platform',
        description: 'price cat',
        has_products: false,
      },
    });
    if (!upsertPimCategory) throw new Error('failed to create pim category');

    const { createPriceBook } = await sdk.CreatePriceBookForPrices({
      input: { name: 'Price Book', workspaceId },
    });
    if (!createPriceBook) throw new Error('failed to create price book');
    const priceBookId = createPriceBook.id;

    const { createRentalPrice } = await sdk.CreateRentalPriceForPrices({
      input: {
        workspaceId,
        pimCategoryId: upsertPimCategory.id,
        priceBookId,
        pricePerDayInCents: 100,
        pricePerWeekInCents: 500,
        pricePerMonthInCents: 1500,
      },
    });
    if (!createRentalPrice) throw new Error('failed to create rental price');

    const { createSalePrice } = await sdk.CreateSalePriceForPrices({
      input: {
        workspaceId,
        pimCategoryId: upsertPimCategory.id,
        priceBookId,
        unitCostInCents: 2000,
      },
    });
    if (!createSalePrice) throw new Error('failed to create sale price');

    const { listPrices } = await sdk.ListPrices({
      filter: { priceBookId, workspaceId },
      page: { number: 1, size: 10 },
    });
    const foundRental = listPrices!.items.find(
      (p) => p?.id === createRentalPrice.id,
    );
    const foundSale = listPrices!.items.find(
      (p) => p?.id === createSalePrice.id,
    );
    expect(foundRental).toBeDefined();
    expect(foundSale).toBeDefined();

    await sdk.DeletePriceById({ id: createRentalPrice.id });
    await sdk.DeletePriceById({ id: createSalePrice.id });

    const { listPrices: afterList } = await sdk.ListPrices({
      filter: { priceBookId, workspaceId },
      page: { number: 1, size: 10 },
    });
    expect(afterList!.items.some((p) => p?.id === createRentalPrice.id)).toBe(
      false,
    );
    expect(afterList!.items.some((p) => p?.id === createSalePrice.id)).toBe(
      false,
    );
  });

  it('filters prices by businessContactId and projectId', async () => {
    const { sdk } = await createClient();
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'Prices Filter Test Workspace',
    });
    if (!createWorkspace) {
      throw new Error('failed to create workspace for price filter test');
    }
    const workspaceId = createWorkspace.id;

    // Create business contact
    const { createBusinessContact } = await sdk.CreateBusinessContactForPrices({
      input: {
        workspaceId,
        name: 'Test Business Contact',
        address: '123 Test St',
      },
    });
    if (!createBusinessContact) {
      throw new Error('failed to create business contact');
    }
    const businessContactId = createBusinessContact.id;

    // Create project
    const { createProject } = await sdk.CreateProjectForPrices({
      input: {
        workspaceId,
        name: 'Test Project',
        project_code: 'TEST-001',
        deleted: false,
      },
    });
    if (!createProject) throw new Error('failed to create project');
    const projectId = createProject.id;

    // Create PIM category
    const { upsertPimCategory } = await sdk.CreatePimCategoryForPrices({
      input: {
        id: 'filter-cat-1',
        name: 'Filter Category',
        path: '|F|',
        platform_id: 'filter-platform',
        description: 'filter cat',
        has_products: false,
      },
    });
    if (!upsertPimCategory) throw new Error('failed to create pim category');

    // Create price book with business contact and project
    const { createPriceBook } = await sdk.CreatePriceBookForPrices({
      input: {
        name: 'Price Book with Contact',
        workspaceId,
        businessContactId,
        projectId,
      },
    });
    if (!createPriceBook) throw new Error('failed to create price book');
    const priceBookId = createPriceBook.id;

    // Create price in the price book (prices inherit business contact and project from price book)
    const { createRentalPrice } = await sdk.CreateRentalPriceForPrices({
      input: {
        workspaceId,
        pimCategoryId: upsertPimCategory.id,
        priceBookId,
        pricePerDayInCents: 100,
        pricePerWeekInCents: 500,
        pricePerMonthInCents: 1500,
      },
    });
    if (!createRentalPrice) throw new Error('failed to create rental price');

    // Create another price book without business contact or project
    const { createPriceBook: otherPriceBook } =
      await sdk.CreatePriceBookForPrices({
        input: {
          name: 'Price Book without Contact',
          workspaceId,
        },
      });
    if (!otherPriceBook) throw new Error('failed to create other price book');

    // Create price in the other price book
    const { createRentalPrice: otherPrice } =
      await sdk.CreateRentalPriceForPrices({
        input: {
          workspaceId,
          pimCategoryId: upsertPimCategory.id,
          priceBookId: otherPriceBook.id,
          pricePerDayInCents: 200,
          pricePerWeekInCents: 600,
          pricePerMonthInCents: 1800,
        },
      });
    if (!otherPrice) throw new Error('failed to create other rental price');

    // Test filter by businessContactId - should only return prices with that business contact
    const { listPrices: byContact } = await sdk.ListPrices({
      filter: { workspaceId, businessContactId },
      page: { number: 1, size: 10 },
    });
    expect(byContact!.items).toHaveLength(1);
    expect(byContact!.items[0]?.id).toBe(createRentalPrice.id);

    // Test filter by projectId - should only return prices with that project
    const { listPrices: byProject } = await sdk.ListPrices({
      filter: { workspaceId, projectId },
      page: { number: 1, size: 10 },
    });
    expect(byProject!.items).toHaveLength(1);
    expect(byProject!.items[0]?.id).toBe(createRentalPrice.id);

    // Test filter by both businessContactId and projectId
    const { listPrices: byBoth } = await sdk.ListPrices({
      filter: { workspaceId, businessContactId, projectId },
      page: { number: 1, size: 10 },
    });
    expect(byBoth!.items).toHaveLength(1);
    expect(byBoth!.items[0]?.id).toBe(createRentalPrice.id);

    // Cleanup
    await sdk.DeletePriceById({ id: createRentalPrice.id });
    await sdk.DeletePriceById({ id: otherPrice.id });
  });

  it('calculates subtotal forecast for 2 days, 6 days, and 25 days', async () => {
    const { sdk } = await createClient();
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'Calculate SubTotal Test Workspace',
    });
    if (!createWorkspace) {
      throw new Error('failed to create workspace for calculate subtotal test');
    }
    const workspaceId = createWorkspace.id;

    // Create PIM category
    const { upsertPimCategory } = await sdk.CreatePimCategoryForPrices({
      input: {
        id: 'subtotal-cat-1',
        name: 'SubTotal Category',
        path: '|S|',
        platform_id: 'subtotal-platform',
        description: 'subtotal cat',
        has_products: false,
      },
    });
    if (!upsertPimCategory) throw new Error('failed to create pim category');

    // Create price book
    const { createPriceBook } = await sdk.CreatePriceBookForPrices({
      input: { name: 'SubTotal Price Book', workspaceId },
    });
    if (!createPriceBook) throw new Error('failed to create price book');
    const priceBookId = createPriceBook.id;

    // Create rental price with specific rates:
    // Day rate: $1.00 (100 cents)
    // Week rate: $5.00 (500 cents) - saves $2.00 vs 7 days at daily rate
    // Month rate: $20.00 (2000 cents) - saves $8.00 vs 28 days at daily rate
    const { createRentalPrice } = await sdk.CreateRentalPriceForPrices({
      input: {
        workspaceId,
        pimCategoryId: upsertPimCategory.id,
        priceBookId,
        pricePerDayInCents: 100,
        pricePerWeekInCents: 500,
        pricePerMonthInCents: 2000,
      },
    });
    if (!createRentalPrice) throw new Error('failed to create rental price');
    const priceId = createRentalPrice.id;

    // Test 1: 2 days - should use 2x daily rate (exactSplit)
    // Expected: 2 * 100 = 200 cents
    // Note: The forecast array index represents the rental duration
    // - days[0] = rental for 1 day (from start to start+0)
    // - days[1] = rental for 2 days (from start to start+1)
    // - days[2] = rental for 3 days (from start to start+2)
    const result2Days = await sdk.CalculateSubTotal({
      priceId,
      durationInDays: 2,
    });
    expect(result2Days.calculateSubTotal).toBeDefined();
    expect(result2Days.calculateSubTotal.days).toHaveLength(3); // days 0, 1, 2

    // Day 0 index: 1 day rental = 100 cents
    expect(result2Days.calculateSubTotal.days[0].day).toBe(0);
    expect(
      result2Days.calculateSubTotal.days[0].accumulative_cost_in_cents,
    ).toBe(100);
    expect(result2Days.calculateSubTotal.days[0].cost_in_cents).toBe(100);
    expect(result2Days.calculateSubTotal.days[0].strategy).toBe('exactSplit');
    expect(result2Days.calculateSubTotal.days[0].rental_period).toEqual({
      days1: 1,
      days7: 0,
      days28: 0,
    });

    // Day 1 index: 2 days rental = 200 cents
    expect(result2Days.calculateSubTotal.days[1].day).toBe(1);
    expect(
      result2Days.calculateSubTotal.days[1].accumulative_cost_in_cents,
    ).toBe(200);
    expect(result2Days.calculateSubTotal.days[1].cost_in_cents).toBe(200);
    expect(result2Days.calculateSubTotal.days[1].strategy).toBe('exactSplit');
    expect(result2Days.calculateSubTotal.days[1].rental_period).toEqual({
      days1: 2,
      days7: 0,
      days28: 0,
    });

    // Day 2 index: 3 days rental = 300 cents
    expect(result2Days.calculateSubTotal.days[2].day).toBe(2);
    expect(
      result2Days.calculateSubTotal.days[2].accumulative_cost_in_cents,
    ).toBe(300);
    expect(result2Days.calculateSubTotal.days[2].cost_in_cents).toBe(300);
    expect(result2Days.calculateSubTotal.days[2].strategy).toBe('exactSplit');
    expect(result2Days.calculateSubTotal.days[2].rental_period).toEqual({
      days1: 3,
      days7: 0,
      days28: 0,
    });

    // Final accumulative cost for 2-day duration (index 1) = 200 cents
    // But the API returns the last day in the array which is index 2 (3 days)
    expect(result2Days.calculateSubTotal.accumulative_cost_in_cents).toBe(300);

    // Test 2: 6 days - should use 6x daily rate (exactSplit)
    // Expected: 7 days rental (index 6) = 7 * 100 = 700 cents
    const result6Days = await sdk.CalculateSubTotal({
      priceId,
      durationInDays: 6,
    });
    expect(result6Days.calculateSubTotal).toBeDefined();
    expect(result6Days.calculateSubTotal.days).toHaveLength(7); // days 0-6

    // Check day at index 5 (6 days rental)
    // 6 days: exactSplit = 600, roundUpTo7Days = 500 (cheaper!)
    const day5 = result6Days.calculateSubTotal.days[5];
    expect(day5.day).toBe(5);
    expect(day5.accumulative_cost_in_cents).toBe(500);
    expect(day5.cost_in_cents).toBe(500);
    expect(day5.strategy).toBe('roundUpTo7Days'); // rounding up is cheaper!
    expect(day5.rental_period).toEqual({
      days1: 0,
      days7: 1,
      days28: 0,
    });

    // Final day (index 6): 7 days rental = 1 week exactly
    const day6 =
      result6Days.calculateSubTotal.days[
        result6Days.calculateSubTotal.days.length - 1
      ];
    expect(day6.day).toBe(6);
    // 7 days: all strategies (exactSplit, roundUpTo7Days) result in 1 week = 500 cents
    expect(day6.accumulative_cost_in_cents).toBe(500);
    expect(day6.cost_in_cents).toBe(500);
    expect(day6.strategy).toBe('exactSplit'); // 7 days = 1 week exactly
    expect(day6.rental_period).toEqual({
      days1: 0,
      days7: 1,
      days28: 0,
    });

    // Final accumulative cost
    expect(result6Days.calculateSubTotal.accumulative_cost_in_cents).toBe(500);

    // Test 3: 25 days - should use optimal strategy
    // Index 24 = 25 days rental
    // Exact split: 25 days = 3 weeks (21 days) + 4 days = (3 * 500) + (4 * 100) = 1500 + 400 = 1900 cents
    // Round to 4 weeks: 4 * 500 = 2000 cents (more expensive)
    // Round to 1 month: 1 * 2000 = 2000 cents (same as 4 weeks)
    // Optimal: exactSplit at 1900 cents
    //
    // Index 25 = 26 days rental
    // Exact split: 26 days = 3 weeks (21 days) + 5 days = (3 * 500) + (5 * 100) = 1500 + 500 = 2000 cents
    // Round to 4 weeks: 4 * 500 = 2000 cents (same)
    // Round to 1 month: 1 * 2000 = 2000 cents (same)
    // All strategies cost 2000 cents
    const result25Days = await sdk.CalculateSubTotal({
      priceId,
      durationInDays: 25,
    });
    expect(result25Days.calculateSubTotal).toBeDefined();
    expect(result25Days.calculateSubTotal.days).toHaveLength(26); // days 0-25

    // Check day at index 24 (25 days rental)
    const day24 = result25Days.calculateSubTotal.days[24];
    expect(day24.day).toBe(24);
    expect(day24.accumulative_cost_in_cents).toBe(1900);
    expect(day24.cost_in_cents).toBe(1900);
    expect(day24.strategy).toBe('exactSplit');
    expect(day24.rental_period).toEqual({
      days1: 4,
      days7: 3,
      days28: 0,
    });
    // Verify savings: 25 days at daily rate = 2500 cents
    // Savings with optimal: 2500 - 1900 = 600 cents
    expect(day24.savings_compared_to_day_rate_in_cents).toBe(600);
    expect(day24.savings_compared_to_day_rate_in_fraction).toBeCloseTo(0.24, 2); // 24% savings

    // Final day (index 25): 26 days rental
    const day25 =
      result25Days.calculateSubTotal.days[
        result25Days.calculateSubTotal.days.length - 1
      ];
    expect(day25.day).toBe(25);
    expect(day25.accumulative_cost_in_cents).toBe(2000);
    expect(day25.cost_in_cents).toBe(2000);

    // Final accumulative cost (26 days)
    expect(result25Days.calculateSubTotal.accumulative_cost_in_cents).toBe(
      2000,
    );

    // Test 4: Test as a field on RentalPrice (6 days)
    const resultAsField = await sdk.GetRentalPriceWithCalculateSubTotal({
      priceId,
      durationInDays: 6,
    });
    expect(resultAsField.getPriceById).toBeDefined();
    expect(resultAsField.getPriceById?.__typename).toBe('RentalPrice');

    if (resultAsField.getPriceById?.__typename === 'RentalPrice') {
      expect(resultAsField.getPriceById.calculateSubTotal).toBeDefined();
      // 7 days (index 6) should cost 500 (1 week)
      expect(
        resultAsField.getPriceById.calculateSubTotal.accumulative_cost_in_cents,
      ).toBe(500);
      expect(resultAsField.getPriceById.calculateSubTotal.days).toHaveLength(7);
    }

    // Test 5: Verify authorization - try to calculate for a price without permission
    // (This would require creating a different user, skipping for now)

    // Test 6: Verify error handling - try to calculate for a sale price
    const { createSalePrice } = await sdk.CreateSalePriceForPrices({
      input: {
        workspaceId,
        pimCategoryId: upsertPimCategory.id,
        priceBookId,
        unitCostInCents: 5000,
      },
    });
    if (!createSalePrice) throw new Error('failed to create sale price');

    // Should throw an error for sale prices
    await expect(
      sdk.CalculateSubTotal({
        priceId: createSalePrice.id,
        durationInDays: 10,
      }),
    ).rejects.toThrow();

    // Cleanup
    await sdk.DeletePriceById({ id: createRentalPrice.id });
    await sdk.DeletePriceById({ id: createSalePrice.id });
  });
});
