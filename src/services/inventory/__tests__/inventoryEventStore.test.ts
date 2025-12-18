import { MongoClient } from 'mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { createInventoryEventStore } from '../inventoryEventStore';
import { randomUUID } from 'crypto';

describe('InventoryEventStore', () => {
  let replSet: MongoMemoryReplSet;
  let client: MongoClient;
  let eventStore: ReturnType<typeof createInventoryEventStore>;

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    client = await MongoClient.connect(replSet.getUri(), {});
    eventStore = createInventoryEventStore({ mongoClient: client });
  });

  afterAll(async () => {
    if (client) await client.close();
    if (replSet) await replSet.stop();
  });

  describe('CREATE_INVENTORY event', () => {
    it('should create inventory with all required fields', async () => {
      const aggregateId = randomUUID();
      const principalId = 'USER-001';

      const result = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'CREATE_INVENTORY',
          companyId: 'COMPANY-001',
          status: 'ON_ORDER',
          isThirdPartyRental: false,
          purchaseOrderId: 'PO-001',
          purchaseOrderLineItemId: 'POLI-001',
          pimProductId: 'PROD-001',
        },
        { principalId },
      );

      expect(result.state).toBeDefined();
      expect(result.state?._id).toBe(aggregateId);
      expect(result.state?.companyId).toBe('COMPANY-001');
      expect(result.state?.status).toBe('ON_ORDER');
      expect(result.state?.isThirdPartyRental).toBe(false);
      expect(result.state?.purchaseOrderId).toBe('PO-001');
      expect(result.state?.purchaseOrderLineItemId).toBe('POLI-001');
      expect(result.state?.pimProductId).toBe('PROD-001');
      expect(result.state?.createdBy).toBe(principalId);
      expect(result.state?.updatedBy).toBe(principalId);
    });

    it('should create inventory with workspaceId', async () => {
      const aggregateId = randomUUID();
      const principalId = 'USER-001';

      const result = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'CREATE_INVENTORY',
          companyId: 'COMPANY-001',
          workspaceId: 'WKSPC-001',
          status: 'ON_ORDER',
          isThirdPartyRental: false,
          purchaseOrderId: 'PO-001',
        },
        { principalId },
      );

      expect(result.state).toBeDefined();
      expect(result.state?.workspaceId).toBe('WKSPC-001');
      expect(result.state?.companyId).toBe('COMPANY-001');
      expect(result.state?.status).toBe('ON_ORDER');
    });

    it('should create inventory without workspaceId (optional field)', async () => {
      const aggregateId = randomUUID();
      const principalId = 'USER-001';

      const result = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'CREATE_INVENTORY',
          companyId: 'COMPANY-001',
          status: 'ON_ORDER',
          isThirdPartyRental: false,
        },
        { principalId },
      );

      expect(result.state).toBeDefined();
      expect(result.state?.workspaceId).toBeUndefined();
      expect(result.state?.companyId).toBe('COMPANY-001');
    });

    it('should create third party rental inventory', async () => {
      const aggregateId = randomUUID();
      const principalId = 'USER-001';

      const result = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'CREATE_INVENTORY',
          companyId: 'COMPANY-001',
          status: 'ON_ORDER',
          isThirdPartyRental: true,
          fulfilmentId: 'FUL-001',
          pimCategoryId: 'CAT-001',
          pimCategoryPath: '/equipment/heavy',
          pimCategoryName: 'Heavy Equipment',
        },
        { principalId },
      );

      expect(result.state).toBeDefined();
      expect(result.state?.isThirdPartyRental).toBe(true);
      expect(result.state?.fulfilmentId).toBe('FUL-001');
      expect(result.state?.pimCategoryId).toBe('CAT-001');
      expect(result.state?.pimCategoryPath).toBe('/equipment/heavy');
      expect(result.state?.pimCategoryName).toBe('Heavy Equipment');
    });

    it('should handle optional fields as undefined', async () => {
      const aggregateId = randomUUID();
      const principalId = 'USER-001';

      const result = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'CREATE_INVENTORY',
          companyId: 'COMPANY-001',
          status: 'RECEIVED',
          isThirdPartyRental: false,
        },
        { principalId },
      );

      expect(result.state).toBeDefined();
      expect(result.state?.fulfilmentId).toBeUndefined();
      expect(result.state?.purchaseOrderId).toBeUndefined();
      expect(result.state?.purchaseOrderLineItemId).toBeUndefined();
      expect(result.state?.assetId).toBeUndefined();
      expect(result.state?.pimProductId).toBeUndefined();
    });
  });

  describe('INVENTORY_RECEIVED event', () => {
    it('should update status to RECEIVED for internal inventory', async () => {
      const aggregateId = randomUUID();
      const principalId = 'USER-001';

      // First create inventory
      await eventStore.applyEvent(
        aggregateId,
        {
          type: 'CREATE_INVENTORY',
          companyId: 'COMPANY-001',
          status: 'ON_ORDER',
          isThirdPartyRental: false,
        },
        { principalId },
      );

      // Then mark as received
      const result = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'INVENTORY_RECEIVED',
        },
        { principalId: 'USER-002' },
      );

      expect(result.state).toBeDefined();
      expect(result.state?.status).toBe('RECEIVED');
      expect(result.state?.updatedBy).toBe('USER-002');
      expect(result.state?.updatedAt).toBeDefined();
    });

    it('should set expectedReturnDate when marking third-party rental as received', async () => {
      const aggregateId = randomUUID();
      const principalId = 'USER-001';

      // First create third-party rental inventory
      await eventStore.applyEvent(
        aggregateId,
        {
          type: 'CREATE_INVENTORY',
          companyId: 'COMPANY-001',
          status: 'ON_ORDER',
          isThirdPartyRental: true,
          fulfilmentId: 'FUL-001',
        },
        { principalId },
      );

      // Mark as received with expected return date
      const expectedReturnDate = '2024-12-31T23:59:59.000Z';
      const result = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'INVENTORY_RECEIVED',
          expectedReturnDate,
        },
        { principalId: 'USER-002' },
      );

      expect(result.state).toBeDefined();
      expect(result.state?.status).toBe('RECEIVED');
      expect(result.state?.expectedReturnDate).toEqual(
        new Date(expectedReturnDate),
      );
      expect(result.state?.isThirdPartyRental).toBe(true);
      expect(result.state?.updatedBy).toBe('USER-002');
    });

    it('should allow marking third party rental as received in event store', async () => {
      const aggregateId = randomUUID();
      const principalId = 'USER-001';

      // First create third party rental inventory
      await eventStore.applyEvent(
        aggregateId,
        {
          type: 'CREATE_INVENTORY',
          companyId: 'COMPANY-001',
          status: 'ON_ORDER',
          isThirdPartyRental: true,
        },
        { principalId },
      );

      // Mark as received - should work at event store level
      const result = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'INVENTORY_RECEIVED',
        },
        { principalId: 'USER-002' },
      );

      expect(result.state).toBeDefined();
      expect(result.state?.status).toBe('RECEIVED');
      expect(result.state?.isThirdPartyRental).toBe(true);
      expect(result.state?.updatedBy).toBe('USER-002');
    });

    it('should throw error if inventory not initialized', async () => {
      const aggregateId = randomUUID();

      await expect(
        eventStore.applyEvent(
          aggregateId,
          {
            type: 'INVENTORY_RECEIVED',
          },
          { principalId: 'USER-001' },
        ),
      ).rejects.toThrow('Not initialised correctly');
    });
  });

  describe('UPDATE_INVENTORY_SERIALISED_ID event', () => {
    it('should update assetId for internal inventory', async () => {
      const aggregateId = randomUUID();
      const principalId = 'USER-001';

      // First create inventory
      await eventStore.applyEvent(
        aggregateId,
        {
          type: 'CREATE_INVENTORY',
          companyId: 'COMPANY-001',
          status: 'ON_ORDER',
          isThirdPartyRental: false,
        },
        { principalId },
      );

      // Update serialised ID
      const result = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'UPDATE_INVENTORY_SERIALISED_ID',
          assetId: 'ASSET-NEW-123',
        },
        { principalId: 'USER-002' },
      );

      expect(result.state).toBeDefined();
      expect(result.state?.assetId).toBe('ASSET-NEW-123');
      expect(result.state?.updatedBy).toBe('USER-002');
    });

    it('should overwrite existing assetId', async () => {
      const aggregateId = randomUUID();
      const principalId = 'USER-001';

      // Create inventory with initial assetId
      await eventStore.applyEvent(
        aggregateId,
        {
          type: 'CREATE_INVENTORY',
          companyId: 'COMPANY-001',
          status: 'ON_ORDER',
          isThirdPartyRental: false,
          assetId: 'ASSET-OLD-123',
        },
        { principalId },
      );

      // Update to new assetId
      const result = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'UPDATE_INVENTORY_SERIALISED_ID',
          assetId: 'ASSET-NEW-456',
        },
        { principalId },
      );

      expect(result.state?.assetId).toBe('ASSET-NEW-456');
    });

    it('should allow updating assetId for third party rental in event store', async () => {
      const aggregateId = randomUUID();
      const principalId = 'USER-001';

      // Create third party rental
      await eventStore.applyEvent(
        aggregateId,
        {
          type: 'CREATE_INVENTORY',
          companyId: 'COMPANY-001',
          status: 'ON_ORDER',
          isThirdPartyRental: true,
        },
        { principalId },
      );

      // Update serialised ID - should work at event store level
      const result = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'UPDATE_INVENTORY_SERIALISED_ID',
          assetId: 'ASSET-123',
        },
        { principalId: 'USER-002' },
      );

      expect(result.state).toBeDefined();
      expect(result.state?.assetId).toBe('ASSET-123');
      expect(result.state?.isThirdPartyRental).toBe(true);
      expect(result.state?.updatedBy).toBe('USER-002');
    });
  });

  describe('DELETE_INVENTORY event', () => {
    it('should delete internal inventory with reason', async () => {
      const aggregateId = randomUUID();
      const principalId = 'USER-001';

      // First create inventory
      await eventStore.applyEvent(
        aggregateId,
        {
          type: 'CREATE_INVENTORY',
          companyId: 'COMPANY-001',
          status: 'RECEIVED',
          isThirdPartyRental: false,
        },
        { principalId },
      );

      // Delete with reason
      const result = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'DELETE_INVENTORY',
          reason: 'Item was damaged beyond repair',
        },
        { principalId },
      );

      expect(result.state).toBeNull();
    });

    it('should handle various delete reasons', async () => {
      const testCases = [
        { reason: 'Lost in transit' },
        { reason: 'Duplicate entry' },
        { reason: 'Data cleanup' },
      ];

      for (const testCase of testCases) {
        const aggregateId = randomUUID();
        // Create inventory
        await eventStore.applyEvent(
          aggregateId,
          {
            type: 'CREATE_INVENTORY',
            companyId: 'COMPANY-001',
            status: 'RECEIVED',
            isThirdPartyRental: false,
          },
          { principalId: 'USER-001' },
        );

        // Delete with specific reason
        const result = await eventStore.applyEvent(
          aggregateId,
          {
            type: 'DELETE_INVENTORY',
            reason: testCase.reason,
          },
          { principalId: 'USER-001' },
        );

        expect(result.state).toBeNull();
      }
    });
  });

  describe('Event replay', () => {
    it('should correctly replay multiple events', async () => {
      const aggregateId = randomUUID();
      const principalId = 'USER-001';

      // Create
      await eventStore.applyEvent(
        aggregateId,
        {
          type: 'CREATE_INVENTORY',
          companyId: 'COMPANY-001',
          status: 'ON_ORDER',
          isThirdPartyRental: false,
          purchaseOrderId: 'PO-001',
        },
        { principalId },
      );

      // Mark as received
      await eventStore.applyEvent(
        aggregateId,
        {
          type: 'INVENTORY_RECEIVED',
        },
        { principalId: 'USER-002' },
      );

      // Update serialised ID
      const finalResult = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'UPDATE_INVENTORY_SERIALISED_ID',
          assetId: 'ASSET-FINAL-123',
        },
        { principalId: 'USER-003' },
      );

      // Verify final state
      expect(finalResult.state).toBeDefined();
      expect(finalResult.state?.status).toBe('RECEIVED');
      expect(finalResult.state?.assetId).toBe('ASSET-FINAL-123');
      expect(finalResult.state?.purchaseOrderId).toBe('PO-001');
      expect(finalResult.state?.createdBy).toBe('USER-001');
      expect(finalResult.state?.updatedBy).toBe('USER-003');
    });

    it('should handle delete after multiple updates', async () => {
      const aggregateId = randomUUID();

      // Create
      await eventStore.applyEvent(
        aggregateId,
        {
          type: 'CREATE_INVENTORY',
          companyId: 'COMPANY-001',
          status: 'ON_ORDER',
          isThirdPartyRental: false,
        },
        { principalId: 'USER-001' },
      );

      // Update status
      await eventStore.applyEvent(
        aggregateId,
        {
          type: 'INVENTORY_RECEIVED',
        },
        { principalId: 'USER-002' },
      );

      // Delete
      const result = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'DELETE_INVENTORY',
          reason: 'No longer needed',
        },
        { principalId: 'USER-003' },
      );

      expect(result.state).toBeNull();
    });
  });

  describe('Timestamp handling', () => {
    it('should set correct timestamps on creation', async () => {
      const aggregateId = randomUUID();
      const beforeCreate = new Date();

      const result = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'CREATE_INVENTORY',
          companyId: 'COMPANY-001',
          status: 'ON_ORDER',
          isThirdPartyRental: false,
        },
        { principalId: 'USER-001' },
      );

      const afterCreate = new Date();

      expect(result.state?.createdAt).toBeDefined();
      expect(result.state?.updatedAt).toBeDefined();
      expect(result.state?.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime(),
      );
      expect(result.state?.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime(),
      );
      expect(result.state?.createdAt).toEqual(result.state?.updatedAt);
    });

    it('should update timestamps on modification', async () => {
      const aggregateId = randomUUID();

      // Create
      const createResult = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'CREATE_INVENTORY',
          companyId: 'COMPANY-001',
          status: 'ON_ORDER',
          isThirdPartyRental: false,
        },
        { principalId: 'USER-001' },
      );

      const createdAt = createResult.state?.createdAt;

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Update
      const updateResult = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'INVENTORY_RECEIVED',
        },
        { principalId: 'USER-002' },
      );

      // Use a tolerance for timestamp comparison (within 5ms)
      expect(
        Math.abs(
          updateResult.state?.createdAt.getTime()! - createdAt!.getTime(),
        ),
      ).toBeLessThanOrEqual(5);
      expect(updateResult.state?.updatedAt.getTime()).toBeGreaterThan(
        createdAt!.getTime(),
      );
    });
  });

  describe('UPDATE_INVENTORY_EXPECTED_RETURN_DATE event', () => {
    it('should update expected return date for third-party rental inventory', async () => {
      const aggregateId = randomUUID();
      const principalId = 'USER-001';

      // First create third-party rental inventory
      await eventStore.applyEvent(
        aggregateId,
        {
          type: 'CREATE_INVENTORY',
          companyId: 'COMPANY-001',
          status: 'ON_ORDER',
          isThirdPartyRental: true,
          fulfilmentId: 'FUL-001',
        },
        { principalId },
      );

      // Update expected return date
      const expectedReturnDate = '2024-12-31T23:59:59.000Z';
      const result = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'UPDATE_INVENTORY_EXPECTED_RETURN_DATE',
          expectedReturnDate,
        },
        { principalId: 'USER-002' },
      );

      expect(result.state).toBeDefined();
      expect(result.state?.expectedReturnDate).toEqual(
        new Date(expectedReturnDate),
      );
      expect(result.state?.updatedBy).toBe('USER-002');
    });

    it('should overwrite existing expected return date', async () => {
      const aggregateId = randomUUID();
      const principalId = 'USER-001';

      // Create with initial expected return date
      await eventStore.applyEvent(
        aggregateId,
        {
          type: 'CREATE_INVENTORY',
          companyId: 'COMPANY-001',
          status: 'ON_ORDER',
          isThirdPartyRental: true,
          expectedReturnDate: '2024-06-30T12:00:00.000Z',
        },
        { principalId },
      );

      // Update to new expected return date
      const newExpectedReturnDate = '2024-12-31T23:59:59.000Z';
      const result = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'UPDATE_INVENTORY_EXPECTED_RETURN_DATE',
          expectedReturnDate: newExpectedReturnDate,
        },
        { principalId: 'USER-002' },
      );

      expect(result.state?.expectedReturnDate).toEqual(
        new Date(newExpectedReturnDate),
      );
    });
  });

  describe('UPDATE_INVENTORY_ACTUAL_RETURN_DATE event', () => {
    it('should update actual return date for third-party rental inventory', async () => {
      const aggregateId = randomUUID();
      const principalId = 'USER-001';

      // First create third-party rental inventory
      await eventStore.applyEvent(
        aggregateId,
        {
          type: 'CREATE_INVENTORY',
          companyId: 'COMPANY-001',
          status: 'RECEIVED',
          isThirdPartyRental: true,
          fulfilmentId: 'FUL-001',
        },
        { principalId },
      );

      // Update actual return date
      const actualReturnDate = '2025-01-02T10:00:00.000Z';
      const result = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'UPDATE_INVENTORY_ACTUAL_RETURN_DATE',
          actualReturnDate,
        },
        { principalId: 'USER-002' },
      );

      expect(result.state).toBeDefined();
      expect(result.state?.actualReturnDate).toEqual(
        new Date(actualReturnDate),
      );
      expect(result.state?.updatedBy).toBe('USER-002');
    });

    it('should handle both expected and actual return dates separately', async () => {
      const aggregateId = randomUUID();
      const principalId = 'USER-001';

      // Create inventory
      await eventStore.applyEvent(
        aggregateId,
        {
          type: 'CREATE_INVENTORY',
          companyId: 'COMPANY-001',
          status: 'ON_ORDER',
          isThirdPartyRental: true,
        },
        { principalId },
      );

      // Set expected return date
      const expectedReturnDate = '2024-12-31T23:59:59.000Z';
      await eventStore.applyEvent(
        aggregateId,
        {
          type: 'UPDATE_INVENTORY_EXPECTED_RETURN_DATE',
          expectedReturnDate,
        },
        { principalId: 'USER-002' },
      );

      // Set actual return date
      const actualReturnDate = '2025-01-02T10:00:00.000Z';
      const result = await eventStore.applyEvent(
        aggregateId,
        {
          type: 'UPDATE_INVENTORY_ACTUAL_RETURN_DATE',
          actualReturnDate,
        },
        { principalId: 'USER-003' },
      );

      expect(result.state?.expectedReturnDate).toEqual(
        new Date(expectedReturnDate),
      );
      expect(result.state?.actualReturnDate).toEqual(
        new Date(actualReturnDate),
      );
      expect(result.state?.updatedBy).toBe('USER-003');
    });
  });
});
