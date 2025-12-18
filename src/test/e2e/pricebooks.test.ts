import { WorkspaceAccessType } from './generated/graphql';
import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';

// GraphQL operations for codegen (for reference, not used directly in tests)

gql`
  mutation CreatePimCategoryForPriceBooks($input: UpsertPimCategoryInput!) {
    upsertPimCategory(input: $input) {
      id
      name
    }
  }
`;

gql`
  mutation CreatePriceBook($input: CreatePriceBookInput!) {
    createPriceBook(input: $input) {
      id
      name
    }
  }
`;

gql`
  mutation UpdatePriceBook($input: UpdatePriceBookInput!) {
    updatePriceBook(input: $input) {
      id
      name
      notes
      location
      businessContactId
      projectId
      updatedAt
    }
  }
`;

gql`
  query ListPriceBooks(
    $filter: ListPriceBooksFilter!
    $page: ListPriceBooksPage!
  ) {
    listPriceBooks(filter: $filter, page: $page) {
      items {
        id
        name
      }
      page {
        number
        size
      }
    }
  }
`;

gql`
  query GetPriceBookById($id: ID!) {
    getPriceBookById(id: $id) {
      id
      name
      updatedAt
    }
  }
`;

gql`
  query ListPriceBookCategories($workspaceId: ID!, $priceBookId: String) {
    listPriceBookCategories(
      workspaceId: $workspaceId
      priceBookId: $priceBookId
    ) {
      id
      name
    }
  }
`;

gql`
  mutation DeletePriceBookById($id: ID!) {
    deletePriceBookById(id: $id)
  }
`;

gql`
  mutation CreateRentalPriceForPriceBooks($input: CreateRentalPriceInput!) {
    createRentalPrice(input: $input) {
      id
      priceBookId
      pimCategoryId
    }
  }
`;

const { createClient } = createTestEnvironment();

describe('PriceBooks GraphQL e2e', () => {
  it('creates, queries, lists, lists categories, and deletes a price book', async () => {
    const { sdk } = await createClient();

    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'PriceBooks Test Workspace',
    });
    if (!createWorkspace) {
      throw new Error('failed to create workspace for price books test');
    }
    const workspaceId = createWorkspace.id;

    const { upsertPimCategory } = await sdk.CreatePimCategoryForPriceBooks({
      input: {
        id: 'pb-cat-1',
        name: 'PB Category',
        path: '|PB|',
        platform_id: 'pb-platform',
        description: 'pb category',
        has_products: false,
      },
    });
    if (!upsertPimCategory) throw new Error('failed to create pim category');

    const { createPriceBook } = await sdk.CreatePriceBook({
      input: { name: 'Test Price Book', workspaceId },
    });
    if (!createPriceBook) throw new Error('failed to create price book');
    const priceBookId = createPriceBook.id;

    await sdk.CreateRentalPriceForPriceBooks({
      input: {
        workspaceId,
        pimCategoryId: upsertPimCategory.id,
        priceBookId,
        pricePerDayInCents: 100,
        pricePerWeekInCents: 500,
        pricePerMonthInCents: 1500,
      },
    });

    const { listPriceBookCategories } = await sdk.ListPriceBookCategories({
      workspaceId,
      priceBookId,
    });
    expect(listPriceBookCategories).toEqual([
      expect.objectContaining({ id: upsertPimCategory.id }),
    ]);

    const { listPriceBooks } = await sdk.ListPriceBooks({
      filter: {
        workspaceId,
      },
      page: { number: 1, size: 10 },
    });
    expect(listPriceBooks!.items.some((b) => b?.id === priceBookId)).toBe(true);

    const { getPriceBookById } = await sdk.GetPriceBookById({
      id: priceBookId,
    });
    expect(getPriceBookById?.id).toBe(priceBookId);

    const { deletePriceBookById } = await sdk.DeletePriceBookById({
      id: priceBookId,
    });
    expect(deletePriceBookById).toBe(true);

    const { listPriceBooks: afterList } = await sdk.ListPriceBooks({
      filter: {
        workspaceId,
      },
      page: { number: 1, size: 10 },
    });
    expect(afterList!.items.some((b) => b?.id === priceBookId)).toBe(false);

    await expect(sdk.GetPriceBookById({ id: priceBookId })).rejects.toThrow();
  });

  it('updates a price book with all fields', async () => {
    const { sdk, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    // Create a price book
    const { createPriceBook } = await sdk.CreatePriceBook({
      input: {
        name: 'Original Name',
        notes: 'Original notes',
        workspaceId: workspace.id,
      },
    });
    if (!createPriceBook) throw new Error('failed to create price book');
    const priceBookId = createPriceBook.id;

    // Update the price book
    const { updatePriceBook } = await sdk.UpdatePriceBook({
      input: {
        id: priceBookId,
        name: 'Updated Name',
        notes: 'Updated notes',
        location: 'New York, NY',
      },
    });

    expect(updatePriceBook).toBeDefined();
    expect(updatePriceBook?.id).toBe(priceBookId);
    expect(updatePriceBook?.name).toBe('Updated Name');
    expect(updatePriceBook?.notes).toBe('Updated notes');
    expect(updatePriceBook?.location).toBe('New York, NY');

    // Verify the changes persisted
    const { getPriceBookById } = await sdk.GetPriceBookById({
      id: priceBookId,
    });
    expect(getPriceBookById?.name).toBe('Updated Name');
  });

  it('clears optional fields when set to null', async () => {
    const { sdk, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    // Create a price book with optional fields
    const { createPriceBook } = await sdk.CreatePriceBook({
      input: {
        name: 'Test Price Book',
        notes: 'Some notes',
        location: 'Los Angeles, CA',
        workspaceId: workspace.id,
      },
    });
    if (!createPriceBook) throw new Error('failed to create price book');
    const priceBookId = createPriceBook.id;

    // Update to clear location
    const { updatePriceBook: step1 } = await sdk.UpdatePriceBook({
      input: {
        id: priceBookId,
        location: null,
      },
    });

    expect(step1).toBeDefined();
    expect(step1?.location).toBeNull();

    // Update to clear notes
    const { updatePriceBook: step2 } = await sdk.UpdatePriceBook({
      input: {
        id: priceBookId,
        notes: null,
      },
    });

    expect(step2).toBeDefined();
    expect(step2?.notes).toBeNull();
  });

  it('throws error when unauthorized user tries to update price book', async () => {
    const { sdk, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    // Create a price book
    const { createPriceBook } = await sdk.CreatePriceBook({
      input: {
        name: 'Test Price Book',
        workspaceId: workspace.id,
      },
    });
    if (!createPriceBook) throw new Error('failed to create price book');
    const priceBookId = createPriceBook.id;

    // Create another user in a different workspace
    const unauthorizedClient = await createClient();

    // Attempt to update the price book from unauthorized user should fail
    await expect(
      unauthorizedClient.sdk.UpdatePriceBook({
        input: {
          id: priceBookId,
          name: 'Unauthorized Update',
        },
      }),
    ).rejects.toThrow();
  });

  it('updates updatedAt timestamp', async () => {
    const { sdk, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    // Create a price book
    const { createPriceBook } = await sdk.CreatePriceBook({
      input: {
        name: 'Test Price Book',
        workspaceId: workspace.id,
      },
    });
    if (!createPriceBook) throw new Error('failed to create price book');
    const priceBookId = createPriceBook.id;

    // Get initial state
    const { getPriceBookById: initial } = await sdk.GetPriceBookById({
      id: priceBookId,
    });
    const initialUpdatedAt = initial?.updatedAt;

    // Wait a bit to ensure timestamp changes
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Update the price book
    const { updatePriceBook } = await sdk.UpdatePriceBook({
      input: {
        id: priceBookId,
        name: 'Updated Name',
      },
    });

    expect(updatePriceBook?.updatedAt).toBeDefined();
    expect(new Date(updatePriceBook!.updatedAt).getTime()).toBeGreaterThan(
      new Date(initialUpdatedAt!).getTime(),
    );
  });

  it('throws error when updating non-existent price book', async () => {
    const { sdk } = await createClient();

    // Attempt to update a non-existent price book
    await expect(
      sdk.UpdatePriceBook({
        input: {
          id: 'PB_nonexistent_123',
          name: 'Should Fail',
        },
      }),
    ).rejects.toThrow();
  });

  it('performs partial updates without affecting other fields', async () => {
    const { sdk, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    // Create a price book with multiple fields
    const { createPriceBook } = await sdk.CreatePriceBook({
      input: {
        name: 'Original Name',
        notes: 'Original notes',
        location: 'Original Location',
        workspaceId: workspace.id,
      },
    });
    if (!createPriceBook) throw new Error('failed to create price book');
    const priceBookId = createPriceBook.id;

    // Update only the name
    const { updatePriceBook: step1 } = await sdk.UpdatePriceBook({
      input: {
        id: priceBookId,
        name: 'Updated Name Only',
      },
    });

    expect(step1?.name).toBe('Updated Name Only');
    expect(step1?.notes).toBe('Original notes');
    expect(step1?.location).toBe('Original Location');

    // Update only the notes
    const { updatePriceBook: step2 } = await sdk.UpdatePriceBook({
      input: {
        id: priceBookId,
        notes: 'Updated notes only',
      },
    });

    expect(step2?.name).toBe('Updated Name Only');
    expect(step2?.notes).toBe('Updated notes only');
    expect(step2?.location).toBe('Original Location');
  });
});
