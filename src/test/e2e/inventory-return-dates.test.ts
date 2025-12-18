import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';
import { InventoryStatus } from './generated/graphql';

// GraphQL operations for codegen
gql`
  mutation CreateInventoryWithReturnDates($input: CreateInventoryInput!) {
    createInventory(input: $input) {
      id
      companyId
      status
      isThirdPartyRental
      expectedReturnDate
      actualReturnDate
      createdAt
      updatedAt
      createdBy
      updatedBy
    }
  }
`;

gql`
  mutation UpdateInventoryExpectedReturnDate(
    $id: String!
    $expectedReturnDate: DateTime!
  ) {
    updateInventoryExpectedReturnDate(
      id: $id
      expectedReturnDate: $expectedReturnDate
    ) {
      id
      companyId
      status
      isThirdPartyRental
      expectedReturnDate
      actualReturnDate
      updatedAt
      updatedBy
    }
  }
`;

gql`
  mutation UpdateInventoryActualReturnDate(
    $id: String!
    $actualReturnDate: DateTime!
  ) {
    updateInventoryActualReturnDate(
      id: $id
      actualReturnDate: $actualReturnDate
    ) {
      id
      companyId
      status
      isThirdPartyRental
      expectedReturnDate
      actualReturnDate
      updatedAt
      updatedBy
    }
  }
`;

gql`
  query GetInventoryWithReturnDates($id: String!) {
    inventoryById(id: $id) {
      id
      companyId
      status
      isThirdPartyRental
      expectedReturnDate
      actualReturnDate
      createdAt
      updatedAt
      createdBy
      updatedBy
    }
  }
`;

const { createClient } = createTestEnvironment();

describe('Inventory Return Dates e2e', () => {
  it('creates third-party rental inventory with return dates', async () => {
    const { sdk } = await createClient();

    const expectedReturnDate = new Date('2024-12-31T23:59:59.000Z');
    const input = {
      status: InventoryStatus.OnOrder,
      isThirdPartyRental: true,
      fulfilmentId: 'FUL-RENTAL-123',
      pimCategoryId: 'CAT-RENTAL-001',
      pimCategoryName: 'Rental Equipment',
      expectedReturnDate: expectedReturnDate.toISOString(),
    };

    const { createInventory } = await sdk.CreateInventoryWithReturnDates({
      input,
    });

    expect(createInventory).toBeDefined();
    expect(createInventory.status).toBe('ON_ORDER');
    expect(createInventory.isThirdPartyRental).toBe(true);
    expect(createInventory.expectedReturnDate).toBe(
      expectedReturnDate.toISOString(),
    );
    expect(createInventory.actualReturnDate).toBeNull();
    expect(createInventory.companyId).toBeDefined();
    expect(createInventory.id).toBeDefined();
    expect(createInventory.createdAt).toBeDefined();
    expect(createInventory.updatedAt).toBeDefined();
    expect(createInventory.createdBy).toBeDefined();
    expect(createInventory.updatedBy).toBeDefined();
  });

  it('updates return dates for third-party rental inventory', async () => {
    const { sdk } = await createClient();

    // First create a third-party rental inventory
    const createInput = {
      status: InventoryStatus.OnOrder,
      isThirdPartyRental: true,
      fulfilmentId: 'FUL-UPDATE-123',
      pimCategoryId: 'CAT-UPDATE-001',
      pimCategoryName: 'Update Test Equipment',
    };

    const { createInventory } = await sdk.CreateInventoryWithReturnDates({
      input: createInput,
    });
    expect(createInventory).toBeDefined();
    const inventoryId = createInventory.id;

    // Update expected return date
    const expectedReturnDate = new Date('2024-06-30T12:00:00.000Z');
    const { updateInventoryExpectedReturnDate } =
      await sdk.UpdateInventoryExpectedReturnDate({
        id: inventoryId,
        expectedReturnDate: expectedReturnDate.toISOString(),
      });

    expect(updateInventoryExpectedReturnDate).toBeDefined();
    expect(updateInventoryExpectedReturnDate!.id).toBe(inventoryId);
    expect(updateInventoryExpectedReturnDate!.expectedReturnDate).toBe(
      expectedReturnDate.toISOString(),
    );
    expect(updateInventoryExpectedReturnDate!.isThirdPartyRental).toBe(true);

    // Update actual return date
    const actualReturnDate = new Date('2024-07-01T14:30:00.000Z');
    const { updateInventoryActualReturnDate } =
      await sdk.UpdateInventoryActualReturnDate({
        id: inventoryId,
        actualReturnDate: actualReturnDate.toISOString(),
      });

    expect(updateInventoryActualReturnDate).toBeDefined();
    expect(updateInventoryActualReturnDate!.id).toBe(inventoryId);
    expect(updateInventoryActualReturnDate!.expectedReturnDate).toBe(
      expectedReturnDate.toISOString(),
    );
    expect(updateInventoryActualReturnDate!.actualReturnDate).toBe(
      actualReturnDate.toISOString(),
    );
    expect(updateInventoryActualReturnDate!.isThirdPartyRental).toBe(true);
  });

  it('allows updating return dates for non-third-party inventory', async () => {
    const { sdk } = await createClient();

    // Create internal (non-third-party) inventory
    const createInput = {
      status: InventoryStatus.OnOrder,
      isThirdPartyRental: false,
      purchaseOrderId: 'PO-INTERNAL-123',
    };

    const { createInventory } = await sdk.CreateInventoryWithReturnDates({
      input: createInput,
    });
    expect(createInventory).toBeDefined();
    const inventoryId = createInventory.id;

    // Update expected return date - should now succeed
    const expectedReturnDate = new Date('2024-06-30T12:00:00.000Z');
    const { updateInventoryExpectedReturnDate } =
      await sdk.UpdateInventoryExpectedReturnDate({
        id: inventoryId,
        expectedReturnDate: expectedReturnDate.toISOString(),
      });

    expect(updateInventoryExpectedReturnDate).toBeDefined();
    expect(updateInventoryExpectedReturnDate!.expectedReturnDate).toBe(
      expectedReturnDate.toISOString(),
    );

    // Update actual return date - should also succeed
    const actualReturnDate = new Date('2024-07-01T14:30:00.000Z');
    const { updateInventoryActualReturnDate } =
      await sdk.UpdateInventoryActualReturnDate({
        id: inventoryId,
        actualReturnDate: actualReturnDate.toISOString(),
      });

    expect(updateInventoryActualReturnDate).toBeDefined();
    expect(updateInventoryActualReturnDate!.actualReturnDate).toBe(
      actualReturnDate.toISOString(),
    );
  });

  it('retrieves inventory with return dates', async () => {
    const { sdk } = await createClient();

    const expectedReturnDate = new Date('2024-08-15T10:00:00.000Z');
    const actualReturnDate = new Date('2024-08-16T16:45:00.000Z');

    // Create inventory with return dates
    const createInput = {
      status: InventoryStatus.Received,
      isThirdPartyRental: true,
      fulfilmentId: 'FUL-RETRIEVE-123',
      expectedReturnDate: expectedReturnDate.toISOString(),
      actualReturnDate: actualReturnDate.toISOString(),
    };

    const { createInventory } = await sdk.CreateInventoryWithReturnDates({
      input: createInput,
    });
    expect(createInventory).toBeDefined();
    const inventoryId = createInventory.id;

    // Retrieve the inventory
    const { inventoryById } = await sdk.GetInventoryWithReturnDates({
      id: inventoryId,
    });

    expect(inventoryById).toBeDefined();
    expect(inventoryById?.id).toBe(inventoryId);
    expect(inventoryById?.status).toBe('RECEIVED');
    expect(inventoryById?.isThirdPartyRental).toBe(true);
    expect(inventoryById?.expectedReturnDate).toBe(
      expectedReturnDate.toISOString(),
    );
    expect(inventoryById?.actualReturnDate).toBe(
      actualReturnDate.toISOString(),
    );
  });

  it('handles partial return date updates', async () => {
    const { sdk } = await createClient();

    // Create inventory with only expected return date
    const expectedReturnDate = new Date('2024-09-30T23:59:59.000Z');
    const createInput = {
      status: InventoryStatus.OnOrder,
      isThirdPartyRental: true,
      expectedReturnDate: expectedReturnDate.toISOString(),
    };

    const { createInventory } = await sdk.CreateInventoryWithReturnDates({
      input: createInput,
    });
    const inventoryId = createInventory.id;

    // Update only the actual return date
    const actualReturnDate = new Date('2024-10-01T08:30:00.000Z');
    const { updateInventoryActualReturnDate } =
      await sdk.UpdateInventoryActualReturnDate({
        id: inventoryId,
        actualReturnDate: actualReturnDate.toISOString(),
      });

    expect(updateInventoryActualReturnDate).toBeDefined();
    expect(updateInventoryActualReturnDate!.expectedReturnDate).toBe(
      expectedReturnDate.toISOString(),
    );
    expect(updateInventoryActualReturnDate!.actualReturnDate).toBe(
      actualReturnDate.toISOString(),
    );
  });

  it('respects company isolation for return date operations', async () => {
    const uniqueId = Date.now().toString();

    // Company A creates inventory
    const companyAClient = await createClient({
      userId: 'user-company-a-return-dates',
      companyId: 'company-a-return-dates-id',
      userName: 'Company A Return Dates User',
    });
    const { sdk: companyASdk } = companyAClient;

    const { createInventory: companyAInventory } =
      await companyASdk.CreateInventoryWithReturnDates({
        input: {
          status: InventoryStatus.OnOrder,
          isThirdPartyRental: true,
          fulfilmentId: `FUL-COMPANY-A-${uniqueId}`,
          expectedReturnDate: new Date(
            '2024-12-01T12:00:00.000Z',
          ).toISOString(),
        },
      });

    // Company B tries to update Company A's inventory return dates
    const companyBClient = await createClient({
      userId: 'user-company-b-return-dates',
      companyId: 'company-b-return-dates-id',
      userName: 'Company B Return Dates User',
    });
    const { sdk: companyBSdk } = companyBClient;

    await expect(
      companyBSdk.UpdateInventoryActualReturnDate({
        id: companyAInventory.id,
        actualReturnDate: new Date('2024-12-02T10:00:00.000Z').toISOString(),
      }),
    ).rejects.toThrow('Inventory not found or not authorized');

    // Verify Company A's inventory is unchanged
    const { inventoryById } = await companyASdk.GetInventoryWithReturnDates({
      id: companyAInventory.id,
    });
    expect(inventoryById?.actualReturnDate).toBeNull();
  });
});
