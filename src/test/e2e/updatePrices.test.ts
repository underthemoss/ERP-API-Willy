import { WorkspaceAccessType } from './generated/graphql';
import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';

// GraphQL operations for codegen (for reference, not used directly in tests)

gql`
  mutation UpdateRentalPrice($input: UpdateRentalPriceInput!) {
    updateRentalPrice(input: $input) {
      id
      name
      pricePerDayInCents
      pricePerWeekInCents
      pricePerMonthInCents
      pimProductId
      pimCategoryId
      pimCategoryName
      pimCategoryPath
      updatedAt
    }
  }
`;

gql`
  mutation UpdateSalePrice($input: UpdateSalePriceInput!) {
    updateSalePrice(input: $input) {
      id
      name
      unitCostInCents
      discounts
      pimProductId
      pimCategoryId
      pimCategoryName
      pimCategoryPath
      updatedAt
    }
  }
`;

const { createClient } = createTestEnvironment();

describe('Update Prices GraphQL e2e', () => {
  it('updates rental prices', async () => {
    const { sdk } = await createClient();
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.InviteOnly,
      name: 'Update Prices Workspace',
    });

    if (!createWorkspace) throw new Error('failed to create workspace');
    const workspaceId = createWorkspace.id;

    // First create a PIM category
    const { upsertPimCategory } = await sdk.CreatePimCategoryForPrices({
      input: {
        id: 'update-price-cat-1',
        name: 'Update Price Category',
        path: '|UP|',
        platform_id: 'update-price-platform',
        description: 'update price cat',
        has_products: false,
      },
    });
    if (!upsertPimCategory) throw new Error('failed to create pim category');

    // Create a price book
    const { createPriceBook } = await sdk.CreatePriceBookForPrices({
      input: { name: 'Update Price Book', workspaceId },
    });
    if (!createPriceBook) throw new Error('failed to create price book');
    const priceBookId = createPriceBook.id;

    // Create a rental price
    const { createRentalPrice } = await sdk.CreateRentalPriceForPrices({
      input: {
        workspaceId,
        name: 'Original Rental Price',
        pimCategoryId: upsertPimCategory.id,
        priceBookId,
        pricePerDayInCents: 100,
        pricePerWeekInCents: 500,
        pricePerMonthInCents: 1500,
      },
    });
    if (!createRentalPrice) throw new Error('failed to create rental price');

    // Update the rental price
    const { updateRentalPrice } = await sdk.UpdateRentalPrice({
      input: {
        id: createRentalPrice.id,
        name: 'Updated Rental Price',
        pricePerDayInCents: 150,
        pricePerWeekInCents: 700,
        pricePerMonthInCents: 2000,
      },
    });

    expect(updateRentalPrice).toBeDefined();
    expect(updateRentalPrice?.name).toBe('Updated Rental Price');
    expect(updateRentalPrice?.pricePerDayInCents).toBe(150);
    expect(updateRentalPrice?.pricePerWeekInCents).toBe(700);
    expect(updateRentalPrice?.pricePerMonthInCents).toBe(2000);
    expect(updateRentalPrice?.updatedAt).toBeDefined();

    // Verify the update persisted
    const { listPrices } = await sdk.ListPrices({
      filter: { priceBookId, workspaceId },
      page: { number: 1, size: 10 },
    });
    const updatedPrice = listPrices!.items.find(
      (p) => p?.id === createRentalPrice.id,
    );
    expect(updatedPrice).toBeDefined();
    expect((updatedPrice as any).pricePerDayInCents).toBe(150);
  });

  it('updates sale prices', async () => {
    const { sdk } = await createClient();

    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.InviteOnly,
      name: 'Update Sale Prices Workspace',
    });

    if (!createWorkspace) throw new Error('failed to create workspace');
    const workspaceId = createWorkspace.id;

    // First create a PIM category
    const { upsertPimCategory } = await sdk.CreatePimCategoryForPrices({
      input: {
        id: 'update-sale-cat-1',
        name: 'Update Sale Category',
        path: '|US|',
        platform_id: 'update-sale-platform',
        description: 'update sale cat',
        has_products: false,
      },
    });
    if (!upsertPimCategory) throw new Error('failed to create pim category');

    // Create a price book
    const { createPriceBook } = await sdk.CreatePriceBookForPrices({
      input: { workspaceId, name: 'Update Sale Price Book' },
    });
    if (!createPriceBook) throw new Error('failed to create price book');
    const priceBookId = createPriceBook.id;

    // Create a sale price
    const { createSalePrice } = await sdk.CreateSalePriceForPrices({
      input: {
        workspaceId,
        name: 'Original Sale Price',
        pimCategoryId: upsertPimCategory.id,
        priceBookId,
        unitCostInCents: 2000,
        discounts: { 10: 10, 20: 15 },
      },
    });
    if (!createSalePrice) throw new Error('failed to create sale price');

    // Update the sale price
    const { updateSalePrice } = await sdk.UpdateSalePrice({
      input: {
        id: createSalePrice.id,
        name: 'Updated Sale Price',
        unitCostInCents: 2500,
        discounts: { 5: 5, 10: 12, 25: 20 },
      },
    });

    expect(updateSalePrice).toBeDefined();
    expect(updateSalePrice?.name).toBe('Updated Sale Price');
    expect(updateSalePrice?.unitCostInCents).toBe(2500);
    expect(updateSalePrice?.discounts).toEqual({ 5: 5, 10: 12, 25: 20 });
    expect(updateSalePrice?.updatedAt).toBeDefined();

    // Verify the update persisted
    const { listPrices } = await sdk.ListPrices({
      filter: { workspaceId, priceBookId },
      page: { number: 1, size: 10 },
    });
    const updatedPrice = listPrices!.items.find(
      (p) => p?.id === createSalePrice.id,
    );
    expect(updatedPrice).toBeDefined();
    expect((updatedPrice as any).unitCostInCents).toBe(2500);
  });

  it('handles partial updates correctly', async () => {
    const { sdk } = await createClient();
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.InviteOnly,
      name: 'Update Sale Prices Workspace',
    });

    if (!createWorkspace) throw new Error('failed to create workspace');
    const workspaceId = createWorkspace.id;

    // First create a PIM category
    const { upsertPimCategory } = await sdk.CreatePimCategoryForPrices({
      input: {
        id: 'partial-update-cat-1',
        name: 'Partial Update Category',
        path: '|PU|',
        platform_id: 'partial-update-platform',
        description: 'partial update cat',
        has_products: false,
      },
    });
    if (!upsertPimCategory) throw new Error('failed to create pim category');

    // Create a rental price
    const { createRentalPrice } = await sdk.CreateRentalPriceForPrices({
      input: {
        workspaceId,
        name: 'Partial Update Test',
        pimCategoryId: upsertPimCategory.id,
        pricePerDayInCents: 100,
        pricePerWeekInCents: 500,
        pricePerMonthInCents: 1500,
      },
    });
    if (!createRentalPrice) throw new Error('failed to create rental price');

    // Update only the name
    const { updateRentalPrice } = await sdk.UpdateRentalPrice({
      input: {
        id: createRentalPrice.id,
        name: 'Only Name Updated',
      },
    });

    expect(updateRentalPrice).toBeDefined();
    expect(updateRentalPrice?.name).toBe('Only Name Updated');
    // Other fields should remain unchanged
    expect(updateRentalPrice?.pricePerDayInCents).toBe(100);
    expect(updateRentalPrice?.pricePerWeekInCents).toBe(500);
    expect(updateRentalPrice?.pricePerMonthInCents).toBe(1500);
  });

  it('validates pimProductId when updating', async () => {
    const { sdk } = await createClient();
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.InviteOnly,
      name: 'Workspace',
    });

    if (!createWorkspace) throw new Error('failed to create workspace');
    const workspaceId = createWorkspace.id;

    // First create a PIM category
    const { upsertPimCategory } = await sdk.CreatePimCategoryForPrices({
      input: {
        id: 'validate-product-cat-1',
        name: 'Validate Product Category',
        path: '|VP|',
        platform_id: 'validate-product-platform',
        description: 'validate product cat',
        has_products: false,
      },
    });
    if (!upsertPimCategory) throw new Error('failed to create pim category');

    // Create a rental price
    const { createRentalPrice } = await sdk.CreateRentalPriceForPrices({
      input: {
        workspaceId,
        name: 'Product Validation Test',
        pimCategoryId: upsertPimCategory.id,
        pricePerDayInCents: 100,
        pricePerWeekInCents: 500,
        pricePerMonthInCents: 1500,
      },
    });
    if (!createRentalPrice) throw new Error('failed to create rental price');

    // Try to update with invalid pimProductId
    await expect(
      sdk.UpdateRentalPrice({
        input: {
          id: createRentalPrice.id,
          pimProductId: 'non-existent-product-id',
        },
      }),
    ).rejects.toThrow('PIM Product with ID non-existent-product-id not found');
  });

  it('updates rental price with new pimCategoryId', async () => {
    const { sdk } = await createClient();
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.InviteOnly,
      name: 'Workspace',
    });

    if (!createWorkspace) throw new Error('failed to create workspace');
    const workspaceId = createWorkspace.id;

    // Create first PIM category
    const { upsertPimCategory: category1 } =
      await sdk.CreatePimCategoryForPrices({
        input: {
          id: 'update-cat-id-1',
          name: 'Original Category',
          path: '|OC|',
          platform_id: 'update-cat-platform',
          description: 'original category',
          has_products: false,
        },
      });
    if (!category1) throw new Error('failed to create pim category 1');

    // Create second PIM category
    const { upsertPimCategory: category2 } =
      await sdk.CreatePimCategoryForPrices({
        input: {
          id: 'update-cat-id-2',
          name: 'New Category',
          path: '|NC|',
          platform_id: 'update-cat-platform',
          description: 'new category',
          has_products: false,
        },
      });
    if (!category2) throw new Error('failed to create pim category 2');

    // Create a rental price with first category
    const { createRentalPrice } = await sdk.CreateRentalPriceForPrices({
      input: {
        workspaceId,
        name: 'Category Update Test',
        pimCategoryId: category1.id,
        pricePerDayInCents: 100,
        pricePerWeekInCents: 500,
        pricePerMonthInCents: 1500,
      },
    });
    if (!createRentalPrice) throw new Error('failed to create rental price');

    // Verify initial category
    expect(createRentalPrice.pimCategoryId).toBe(category1.id);
    expect(createRentalPrice.pimCategoryName).toBe('Original Category');
    expect(createRentalPrice.pimCategoryPath).toBe('|OC|');

    // Update the rental price with new category
    const { updateRentalPrice } = await sdk.UpdateRentalPrice({
      input: {
        id: createRentalPrice.id,
        pimCategoryId: category2.id,
      },
    });

    expect(updateRentalPrice).toBeDefined();
    expect(updateRentalPrice?.pimCategoryId).toBe(category2.id);
    expect(updateRentalPrice?.pimCategoryName).toBe('New Category');
    expect(updateRentalPrice?.pimCategoryPath).toBe('|NC|');
  });

  it('updates sale price with new pimCategoryId', async () => {
    const { sdk } = await createClient();

    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.InviteOnly,
      name: 'Workspace',
    });

    if (!createWorkspace) throw new Error('failed to create workspace');
    const workspaceId = createWorkspace.id;

    // Create first PIM category
    const { upsertPimCategory: category1 } =
      await sdk.CreatePimCategoryForPrices({
        input: {
          id: 'update-sale-cat-id-1',
          name: 'Original Sale Category',
          path: '|OSC|',
          platform_id: 'update-sale-cat-platform',
          description: 'original sale category',
          has_products: false,
        },
      });
    if (!category1) throw new Error('failed to create pim category 1');

    // Create second PIM category
    const { upsertPimCategory: category2 } =
      await sdk.CreatePimCategoryForPrices({
        input: {
          id: 'update-sale-cat-id-2',
          name: 'New Sale Category',
          path: '|NSC|',
          platform_id: 'update-sale-cat-platform',
          description: 'new sale category',
          has_products: false,
        },
      });
    if (!category2) throw new Error('failed to create pim category 2');

    // Create a sale price with first category
    const { createSalePrice } = await sdk.CreateSalePriceForPrices({
      input: {
        workspaceId,
        name: 'Sale Category Update Test',
        pimCategoryId: category1.id,
        unitCostInCents: 2000,
        discounts: { 10: 10 },
      },
    });
    if (!createSalePrice) throw new Error('failed to create sale price');

    // Verify initial category
    expect(createSalePrice.pimCategoryId).toBe(category1.id);
    expect(createSalePrice.pimCategoryName).toBe('Original Sale Category');
    expect(createSalePrice.pimCategoryPath).toBe('|OSC|');

    // Update the sale price with new category
    const { updateSalePrice } = await sdk.UpdateSalePrice({
      input: {
        id: createSalePrice.id,
        pimCategoryId: category2.id,
      },
    });

    expect(updateSalePrice).toBeDefined();
    expect(updateSalePrice?.pimCategoryId).toBe(category2.id);
    expect(updateSalePrice?.pimCategoryName).toBe('New Sale Category');
    expect(updateSalePrice?.pimCategoryPath).toBe('|NSC|');
  });

  it('validates pimCategoryId when updating rental price', async () => {
    const { sdk } = await createClient();

    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.InviteOnly,
      name: 'Workspace',
    });

    if (!createWorkspace) throw new Error('failed to create workspace');
    const workspaceId = createWorkspace.id;

    // Create a PIM category
    const { upsertPimCategory } = await sdk.CreatePimCategoryForPrices({
      input: {
        id: 'validate-cat-rental-1',
        name: 'Validate Category',
        path: '|VC|',
        platform_id: 'validate-cat-platform',
        description: 'validate category',
        has_products: false,
      },
    });
    if (!upsertPimCategory) throw new Error('failed to create pim category');

    // Create a rental price
    const { createRentalPrice } = await sdk.CreateRentalPriceForPrices({
      input: {
        workspaceId,
        name: 'Category Validation Test',
        pimCategoryId: upsertPimCategory.id,
        pricePerDayInCents: 100,
        pricePerWeekInCents: 500,
        pricePerMonthInCents: 1500,
      },
    });
    if (!createRentalPrice) throw new Error('failed to create rental price');

    // Try to update with invalid pimCategoryId
    await expect(
      sdk.UpdateRentalPrice({
        input: {
          id: createRentalPrice.id,
          pimCategoryId: 'non-existent-category-id',
        },
      }),
    ).rejects.toThrow(
      'PIM Category with ID non-existent-category-id not found',
    );
  });

  it('validates pimCategoryId when updating sale price', async () => {
    const { sdk } = await createClient();
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.InviteOnly,
      name: 'Workspace',
    });

    if (!createWorkspace) throw new Error('failed to create workspace');
    const workspaceId = createWorkspace.id;

    // Create a PIM category
    const { upsertPimCategory } = await sdk.CreatePimCategoryForPrices({
      input: {
        id: 'validate-cat-sale-1',
        name: 'Validate Sale Category',
        path: '|VSC|',
        platform_id: 'validate-sale-cat-platform',
        description: 'validate sale category',
        has_products: false,
      },
    });
    if (!upsertPimCategory) throw new Error('failed to create pim category');

    // Create a sale price
    const { createSalePrice } = await sdk.CreateSalePriceForPrices({
      input: {
        workspaceId,
        name: 'Sale Category Validation Test',
        pimCategoryId: upsertPimCategory.id,
        unitCostInCents: 2000,
        discounts: { 10: 10 },
      },
    });
    if (!createSalePrice) throw new Error('failed to create sale price');

    // Try to update with invalid pimCategoryId
    await expect(
      sdk.UpdateSalePrice({
        input: {
          id: createSalePrice.id,
          pimCategoryId: 'non-existent-sale-category-id',
        },
      }),
    ).rejects.toThrow(
      'PIM Category with ID non-existent-sale-category-id not found',
    );
  });

  it('updates rental price with both pimCategoryId and other fields', async () => {
    const { sdk } = await createClient();

    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.InviteOnly,
      name: 'Workspace',
    });

    if (!createWorkspace) throw new Error('failed to create workspace');
    const workspaceId = createWorkspace.id;

    // Create two PIM categories
    const { upsertPimCategory: category1 } =
      await sdk.CreatePimCategoryForPrices({
        input: {
          id: 'combined-update-cat-1',
          name: 'Combined Original Category',
          path: '|COC|',
          platform_id: 'combined-cat-platform',
          description: 'combined original category',
          has_products: false,
        },
      });
    if (!category1) throw new Error('failed to create pim category 1');

    const { upsertPimCategory: category2 } =
      await sdk.CreatePimCategoryForPrices({
        input: {
          id: 'combined-update-cat-2',
          name: 'Combined New Category',
          path: '|CNC|',
          platform_id: 'combined-cat-platform',
          description: 'combined new category',
          has_products: false,
        },
      });
    if (!category2) throw new Error('failed to create pim category 2');

    // Create a rental price
    const { createRentalPrice } = await sdk.CreateRentalPriceForPrices({
      input: {
        workspaceId,
        name: 'Combined Update Test',
        pimCategoryId: category1.id,
        pricePerDayInCents: 100,
        pricePerWeekInCents: 500,
        pricePerMonthInCents: 1500,
      },
    });
    if (!createRentalPrice) throw new Error('failed to create rental price');

    // Update multiple fields including pimCategoryId
    const { updateRentalPrice } = await sdk.UpdateRentalPrice({
      input: {
        id: createRentalPrice.id,
        name: 'Updated Combined Test',
        pimCategoryId: category2.id,
        pricePerDayInCents: 200,
        pricePerWeekInCents: 1000,
      },
    });

    expect(updateRentalPrice).toBeDefined();
    expect(updateRentalPrice?.name).toBe('Updated Combined Test');
    expect(updateRentalPrice?.pimCategoryId).toBe(category2.id);
    expect(updateRentalPrice?.pimCategoryName).toBe('Combined New Category');
    expect(updateRentalPrice?.pimCategoryPath).toBe('|CNC|');
    expect(updateRentalPrice?.pricePerDayInCents).toBe(200);
    expect(updateRentalPrice?.pricePerWeekInCents).toBe(1000);
    // Unchanged field
    expect(updateRentalPrice?.pricePerMonthInCents).toBe(1500);
  });
});
