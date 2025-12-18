import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';
import { InventoryStatus, InventoryCondition } from './generated/graphql';
import { v4 as uuidv4 } from 'uuid';

// GraphQL operations for codegen (for reference, not used directly in tests)
gql`
  mutation CreateInventory($input: CreateInventoryInput!) {
    createInventory(input: $input) {
      id
      companyId
      workspaceId
      status
      fulfilmentId
      purchaseOrderId
      purchaseOrderLineItemId
      isThirdPartyRental
      assetId
      pimCategoryId
      pimCategoryPath
      pimCategoryName
      pimProductId
      createdAt
      updatedAt
      createdBy
      updatedBy
    }
  }
`;

gql`
  mutation BulkMarkInventoryReceived($input: BulkMarkInventoryReceivedInput!) {
    bulkMarkInventoryReceived(input: $input) {
      items {
        id
        companyId
        status
        fulfilmentId
        purchaseOrderId
        purchaseOrderLineItemId
        isThirdPartyRental
        assetId
        pimCategoryId
        pimCategoryPath
        pimCategoryName
        pimProductId
        receivedAt
        receiptNotes
        resourceMapId
        conditionOnReceipt
        conditionNotes
        updatedAt
        updatedBy
      }
      totalProcessed
    }
  }
`;

gql`
  mutation UpdateInventorySerialisedId(
    $id: String!
    $input: UpdateInventorySerialisedIdInput!
  ) {
    updateInventorySerialisedId(id: $id, input: $input) {
      id
      companyId
      status
      assetId
      updatedAt
      updatedBy
    }
  }
`;

gql`
  mutation DeleteInventory($id: String!, $input: DeleteInventoryInput!) {
    deleteInventory(id: $id, input: $input)
  }
`;

gql`
  query InventoryById($id: String!) {
    inventoryById(id: $id) {
      id
      companyId
      workspaceId
      status
      fulfilmentId
      purchaseOrderId
      purchaseOrderLineItemId
      isThirdPartyRental
      assetId
      pimCategoryId
      pimCategoryPath
      pimCategoryName
      pimProductId
      createdAt
      updatedAt
      createdBy
      updatedBy
      purchaseOrderLineItem {
        ... on SalePurchaseOrderLineItem {
          id
          purchase_order_id
          lineitem_type
          po_quantity
          po_pim_id
        }
        ... on RentalPurchaseOrderLineItem {
          id
          purchase_order_id
          lineitem_type
          po_quantity
          po_pim_id
        }
      }
    }
  }
`;

gql`
  query ListInventoryItems($query: ListInventoryQuery) {
    listInventory(query: $query) {
      items {
        id
        companyId
        workspaceId
        status
        fulfilmentId
        purchaseOrderId
        purchaseOrderLineItemId
        isThirdPartyRental
        assetId
        pimCategoryId
        pimCategoryPath
        pimCategoryName
        pimProductId
        createdAt
        updatedAt
        createdBy
        updatedBy
        purchaseOrderLineItem {
          ... on SalePurchaseOrderLineItem {
            id
            purchase_order_id
            lineitem_type
            po_quantity
            po_pim_id
          }
          ... on RentalPurchaseOrderLineItem {
            id
            purchase_order_id
            lineitem_type
            po_quantity
            po_pim_id
          }
        }
      }
    }
  }
`;

gql`
  query ListInventoryGroupedByPimCategoryId($query: ListInventoryQuery) {
    listInventoryGroupedByPimCategoryId(query: $query) {
      items {
        pimCategoryId
        pimCategoryName
        pimCategoryPath
        quantityOnOrder
        quantityReceived
        totalQuantity
        sampleInventoryIds
        sampleInventories {
          id
          status
          pimProductId
          pimCategoryId
          isThirdPartyRental
          assetId
          asset {
            id
            name
            pim_product_id
            pim_category_id
            pim_category_name
          }
        }
      }
    }
  }
`;

const { createClient } = createTestEnvironment();

describe('Inventory CRUD e2e', () => {
  it('creates an internal inventory item', async () => {
    const { sdk } = await createClient();

    const input = {
      status: InventoryStatus.OnOrder,
      isThirdPartyRental: false,
      purchaseOrderId: 'PO-123',
      purchaseOrderLineItemId: 'POLI-456',
      pimProductId: 'PROD-789',
    };

    const { createInventory } = await sdk.CreateInventory({ input });
    expect(createInventory).toBeDefined();
    expect(createInventory.status).toBe('ON_ORDER');
    expect(createInventory.isThirdPartyRental).toBe(false);
    expect(createInventory.purchaseOrderId).toBe('PO-123');
    expect(createInventory.purchaseOrderLineItemId).toBe('POLI-456');
    expect(createInventory.pimProductId).toBe('PROD-789');
    expect(createInventory.companyId).toBeDefined();
    expect(createInventory.id).toBeDefined();
    expect(createInventory.createdAt).toBeDefined();
    expect(createInventory.updatedAt).toBeDefined();
    expect(createInventory.createdBy).toBeDefined();
    expect(createInventory.updatedBy).toBeDefined();
  });

  it('creates a third party rental inventory item', async () => {
    const { sdk } = await createClient();

    const input = {
      status: InventoryStatus.OnOrder,
      isThirdPartyRental: true,
      fulfilmentId: 'FUL-12345',
      pimCategoryId: 'CAT-001',
      pimCategoryPath: '/equipment/heavy',
      pimCategoryName: 'Heavy Equipment',
    };

    const { createInventory } = await sdk.CreateInventory({ input });
    expect(createInventory).toBeDefined();
    expect(createInventory.status).toBe('ON_ORDER');
    expect(createInventory.isThirdPartyRental).toBe(true);
    expect(createInventory.fulfilmentId).toBe('FUL-12345');
    expect(createInventory.pimCategoryId).toBe('CAT-001');
    expect(createInventory.pimCategoryPath).toBe('/equipment/heavy');
    expect(createInventory.pimCategoryName).toBe('Heavy Equipment');
    expect(createInventory.companyId).toBeDefined();
  });

  it('creates inventory with workspaceId', async () => {
    const { sdk, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    const input = {
      workspaceId: workspace.id,
      status: InventoryStatus.OnOrder,
      isThirdPartyRental: false,
      purchaseOrderId: 'PO-WORKSPACE-001',
    };

    const { createInventory } = await sdk.CreateInventory({ input });
    expect(createInventory).toBeDefined();
    expect(createInventory.workspaceId).toBe(workspace.id);
    expect(createInventory.status).toBe('ON_ORDER');
    expect(createInventory.purchaseOrderId).toBe('PO-WORKSPACE-001');
  });

  it('creates inventory without workspaceId', async () => {
    const { sdk } = await createClient();

    const input = {
      status: InventoryStatus.OnOrder,
      isThirdPartyRental: false,
      purchaseOrderId: 'PO-NO-WORKSPACE',
    };

    const { createInventory } = await sdk.CreateInventory({ input });
    expect(createInventory).toBeDefined();
    expect(createInventory.workspaceId).toBeNull();
    expect(createInventory.status).toBe('ON_ORDER');
  });

  it('marks single inventory as received using bulk operation', async () => {
    const { sdk } = await createClient();

    // First create an internal inventory
    const createInput = {
      status: InventoryStatus.OnOrder,
      isThirdPartyRental: false,
      purchaseOrderId: 'PO-999',
    };

    const { createInventory } = await sdk.CreateInventory({
      input: createInput,
    });
    expect(createInventory).toBeDefined();
    const inventoryId = createInventory.id;

    // Then mark it as received using bulk operation
    const { bulkMarkInventoryReceived } = await sdk.BulkMarkInventoryReceived({
      input: {
        ids: [inventoryId],
      },
    });

    expect(bulkMarkInventoryReceived).toBeDefined();
    expect(bulkMarkInventoryReceived.totalProcessed).toBe(1);
    expect(bulkMarkInventoryReceived.items).toHaveLength(1);
    expect(bulkMarkInventoryReceived.items[0].id).toBe(inventoryId);
    expect(bulkMarkInventoryReceived.items[0].status).toBe('RECEIVED');
  });

  it('marks multiple inventories as received with metadata', async () => {
    const { sdk } = await createClient();

    // Create multiple inventories
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const { createInventory } = await sdk.CreateInventory({
        input: {
          status: InventoryStatus.OnOrder,
          isThirdPartyRental: false,
          purchaseOrderId: `PO-BULK-${i}`,
        },
      });
      ids.push(createInventory.id);
    }

    // Mark all as received with metadata
    const receivedAt = new Date().toISOString();
    const { bulkMarkInventoryReceived } = await sdk.BulkMarkInventoryReceived({
      input: {
        ids,
        receivedAt,
        receiptNotes: 'Bulk shipment received in good condition',
        resourceMapId: 'WAREHOUSE-A',
        conditionOnReceipt: InventoryCondition.New,
        conditionNotes: 'All items in original packaging',
      },
    });

    expect(bulkMarkInventoryReceived).toBeDefined();
    expect(bulkMarkInventoryReceived.totalProcessed).toBe(3);
    expect(bulkMarkInventoryReceived.items).toHaveLength(3);

    bulkMarkInventoryReceived.items.forEach((item) => {
      expect(item.status).toBe('RECEIVED');
      expect(item.receiptNotes).toBe(
        'Bulk shipment received in good condition',
      );
      expect(item.resourceMapId).toBe('WAREHOUSE-A');
      expect(item.conditionOnReceipt).toBe('NEW');
      expect(item.conditionNotes).toBe('All items in original packaging');
      expect(ids).toContain(item.id);
    });
  });

  it('fails transactionally when one item cannot be marked as received', async () => {
    const { sdk } = await createClient();

    // Create one valid inventory and use one invalid ID
    const { createInventory } = await sdk.CreateInventory({
      input: {
        status: InventoryStatus.OnOrder,
        isThirdPartyRental: false,
      },
    });
    const validId = createInventory.id;
    const invalidId = 'INVALID-ID-12345';

    // Try to mark both as received - should fail entirely
    await expect(
      sdk.BulkMarkInventoryReceived({
        input: {
          ids: [validId, invalidId],
        },
      }),
    ).rejects.toThrow();

    // Verify the valid inventory is still ON_ORDER (transaction rolled back)
    const { inventoryById } = await sdk.InventoryById({ id: validId });
    expect(inventoryById).toBeDefined();
    expect(inventoryById?.status).toBe('ON_ORDER');
  });

  it('sets assetId when marking single inventory as received via bulk operation', async () => {
    const { sdk } = await createClient();

    // Create an internal inventory without assetId
    const createInput = {
      status: InventoryStatus.OnOrder,
      isThirdPartyRental: false,
      purchaseOrderId: 'PO-ASSET-TEST',
    };

    const { createInventory } = await sdk.CreateInventory({
      input: createInput,
    });
    expect(createInventory).toBeDefined();
    expect(createInventory.assetId).toBeNull();
    const inventoryId = createInventory.id;

    // Mark it as received with assetId in a single operation
    const testAssetId = 'ASSET-BULK-123';
    const { bulkMarkInventoryReceived } = await sdk.BulkMarkInventoryReceived({
      input: {
        ids: [inventoryId],
        assetId: testAssetId,
        receivedAt: new Date().toISOString(),
        conditionOnReceipt: InventoryCondition.New,
      },
    });

    expect(bulkMarkInventoryReceived).toBeDefined();
    expect(bulkMarkInventoryReceived.totalProcessed).toBe(1);
    expect(bulkMarkInventoryReceived.items).toHaveLength(1);
    expect(bulkMarkInventoryReceived.items[0].id).toBe(inventoryId);
    expect(bulkMarkInventoryReceived.items[0].status).toBe('RECEIVED');
    expect(bulkMarkInventoryReceived.items[0].assetId).toBe(testAssetId);
    expect(bulkMarkInventoryReceived.items[0].conditionOnReceipt).toBe('NEW');
  });

  it('rejects bulk receive with assetId for multiple inventory items', async () => {
    const { sdk } = await createClient();

    // Create multiple inventories
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const { createInventory } = await sdk.CreateInventory({
        input: {
          status: InventoryStatus.OnOrder,
          isThirdPartyRental: false,
          purchaseOrderId: `PO-MULTI-ASSET-${i}`,
        },
      });
      ids.push(createInventory.id);
    }

    // Try to mark all as received with the same assetId - should fail
    await expect(
      sdk.BulkMarkInventoryReceived({
        input: {
          ids,
          assetId: 'SHARED-ASSET-ID',
        },
      }),
    ).rejects.toThrow(
      'Cannot set assetId for multiple inventory items. Asset IDs must be unique per inventory item.',
    );

    // Verify all inventories are still ON_ORDER (transaction rolled back)
    for (const id of ids) {
      const { inventoryById } = await sdk.InventoryById({ id });
      expect(inventoryById).toBeDefined();
      expect(inventoryById?.status).toBe('ON_ORDER');
      expect(inventoryById?.assetId).toBeNull();
    }
  });

  it('updates inventory serialised ID', async () => {
    const { sdk } = await createClient();

    // First create an internal inventory
    const createInput = {
      status: InventoryStatus.OnOrder,
      isThirdPartyRental: false,
    };

    const { createInventory } = await sdk.CreateInventory({
      input: createInput,
    });
    expect(createInventory).toBeDefined();
    const inventoryId = createInventory.id;

    // Then update its serialised ID
    const updateInput = {
      assetId: 'ASSET-NEW-123',
    };

    const { updateInventorySerialisedId } =
      await sdk.UpdateInventorySerialisedId({
        id: inventoryId,
        input: updateInput,
      });

    expect(updateInventorySerialisedId).toBeDefined();
    expect(updateInventorySerialisedId?.id).toBe(inventoryId);
    expect(updateInventorySerialisedId?.assetId).toBe('ASSET-NEW-123');
  });

  it('deletes an internal inventory item with reason', async () => {
    const { sdk } = await createClient();

    // First create an internal inventory
    const createInput = {
      status: InventoryStatus.Received,
      isThirdPartyRental: false,
    };

    const { createInventory } = await sdk.CreateInventory({
      input: createInput,
    });
    expect(createInventory).toBeDefined();
    const inventoryId = createInventory.id;

    // Delete it with a reason
    const deleteInput = {
      reason: 'Item was damaged beyond repair',
    };

    const { deleteInventory } = await sdk.DeleteInventory({
      id: inventoryId,
      input: deleteInput,
    });
    expect(deleteInventory).toBe(true);

    // Verify it's deleted
    const { inventoryById } = await sdk.InventoryById({ id: inventoryId });
    expect(inventoryById).toBeNull();
  });

  it('lists inventory items', async () => {
    const { sdk } = await createClient();

    // Create some inventory items with unique IDs
    const uniqueId = Date.now().toString();
    const created1 = await sdk.CreateInventory({
      input: {
        status: InventoryStatus.OnOrder,
        isThirdPartyRental: false,
        pimProductId: `LIST-PROD-1-${uniqueId}`,
      },
    });
    const created2 = await sdk.CreateInventory({
      input: {
        status: InventoryStatus.Received,
        isThirdPartyRental: true,
        pimProductId: `LIST-PROD-2-${uniqueId}`,
      },
    });

    // Verify they were created
    expect(created1.createInventory).toBeDefined();
    expect(created2.createInventory).toBeDefined();

    // Store the created IDs for verification
    const createdId1 = created1.createInventory.id;
    const createdId2 = created2.createInventory.id;

    // Get each item directly by ID to verify they exist
    const { inventoryById: directItem1 } = await sdk.InventoryById({
      id: createdId1,
    });
    const { inventoryById: directItem2 } = await sdk.InventoryById({
      id: createdId2,
    });

    expect(directItem1).toBeDefined();
    expect(directItem1?.pimProductId).toBe(`LIST-PROD-1-${uniqueId}`);
    expect(directItem1?.isThirdPartyRental).toBe(false);

    expect(directItem2).toBeDefined();
    expect(directItem2?.pimProductId).toBe(`LIST-PROD-2-${uniqueId}`);
    expect(directItem2?.isThirdPartyRental).toBe(true);

    // List all items and verify our items are included
    const { listInventory } = await sdk.ListInventoryItems({ query: {} });
    expect(listInventory).toBeDefined();
    expect(listInventory.items.length).toBeGreaterThanOrEqual(2);

    // Verify at least one of our items appears in the list
    const hasItem1 = listInventory.items.some((item) => item.id === createdId1);
    const hasItem2 = listInventory.items.some((item) => item.id === createdId2);

    expect(hasItem1 || hasItem2).toBe(true);
  });

  it('filters inventory by status', async () => {
    const { sdk } = await createClient();

    // Create inventory items with different statuses and unique IDs
    const uniqueId = Date.now().toString();
    const onOrderId = `FILTER-ON-ORDER-${uniqueId}`;
    const receivedId = `FILTER-RECEIVED-${uniqueId}`;

    const created1 = await sdk.CreateInventory({
      input: {
        status: InventoryStatus.OnOrder,
        isThirdPartyRental: false,
        pimProductId: onOrderId,
      },
    });
    const created2 = await sdk.CreateInventory({
      input: {
        status: InventoryStatus.Received,
        isThirdPartyRental: false,
        pimProductId: receivedId,
      },
    });

    // Verify they were created
    expect(created1.createInventory).toBeDefined();
    expect(created2.createInventory).toBeDefined();

    // Filter by ON_ORDER status
    const { listInventory: onOrderItems } = await sdk.ListInventoryItems({
      query: {
        filter: {
          status: InventoryStatus.OnOrder,
        },
      },
    });

    expect(onOrderItems).toBeDefined();
    const onOrderProductIds = onOrderItems.items.map(
      (item) => item.pimProductId,
    );
    expect(onOrderProductIds).toContain(onOrderId);
    expect(onOrderProductIds).not.toContain(receivedId);
    expect(onOrderItems.items.every((item) => item.status === 'ON_ORDER')).toBe(
      true,
    );

    // Filter by RECEIVED status
    const { listInventory: receivedItems } = await sdk.ListInventoryItems({
      query: {
        filter: {
          status: InventoryStatus.Received,
        },
      },
    });

    expect(receivedItems).toBeDefined();
    const receivedProductIds = receivedItems.items.map(
      (item) => item.pimProductId,
    );
    expect(receivedProductIds).toContain(receivedId);
    expect(receivedProductIds).not.toContain(onOrderId);
    expect(
      receivedItems.items.every((item) => item.status === 'RECEIVED'),
    ).toBe(true);
  });

  it('filters inventory by workspaceId', async () => {
    const { sdk, utils } = await createClient();
    const workspace1 = await utils.createWorkspace();
    const workspace2 = await utils.createWorkspace();
    const uniqueId = Date.now().toString();

    // Create inventory with workspace1
    const { createInventory: inv1 } = await sdk.CreateInventory({
      input: {
        workspaceId: workspace1.id,
        status: InventoryStatus.OnOrder,
        isThirdPartyRental: false,
        pimProductId: `WS1-PROD-${uniqueId}`,
      },
    });

    // Create inventory with workspace2
    const { createInventory: inv2 } = await sdk.CreateInventory({
      input: {
        workspaceId: workspace2.id,
        status: InventoryStatus.OnOrder,
        isThirdPartyRental: false,
        pimProductId: `WS2-PROD-${uniqueId}`,
      },
    });

    // Create inventory without workspace
    const { createInventory: inv3 } = await sdk.CreateInventory({
      input: {
        status: InventoryStatus.OnOrder,
        isThirdPartyRental: false,
        pimProductId: `NO-WS-PROD-${uniqueId}`,
      },
    });

    // Filter by workspace1
    const { listInventory: ws1Items } = await sdk.ListInventoryItems({
      query: {
        filter: {
          workspaceId: workspace1.id,
        },
      },
    });

    expect(ws1Items).toBeDefined();
    const ws1Ids = ws1Items.items.map((item) => item.id);
    expect(ws1Ids).toContain(inv1.id);
    expect(ws1Ids).not.toContain(inv2.id);
    expect(ws1Ids).not.toContain(inv3.id);
    expect(
      ws1Items.items.every((item) => item.workspaceId === workspace1.id),
    ).toBe(true);

    // Filter by workspace2
    const { listInventory: ws2Items } = await sdk.ListInventoryItems({
      query: {
        filter: {
          workspaceId: workspace2.id,
        },
      },
    });

    expect(ws2Items).toBeDefined();
    const ws2Ids = ws2Items.items.map((item) => item.id);
    expect(ws2Ids).toContain(inv2.id);
    expect(ws2Ids).not.toContain(inv1.id);
    expect(ws2Ids).not.toContain(inv3.id);
    expect(
      ws2Items.items.every((item) => item.workspaceId === workspace2.id),
    ).toBe(true);
  });

  it('filters inventory by isThirdPartyRental', async () => {
    const { sdk } = await createClient();

    // Create inventory items with unique IDs
    const uniqueId = Date.now().toString();
    const internalPimId = `INTERNAL-001-${uniqueId}`;
    const thirdPartyPimId = `THIRD-PARTY-001-${uniqueId}`;

    const created1 = await sdk.CreateInventory({
      input: {
        status: InventoryStatus.OnOrder,
        isThirdPartyRental: false,
        pimProductId: internalPimId,
      },
    });
    const created2 = await sdk.CreateInventory({
      input: {
        status: InventoryStatus.OnOrder,
        isThirdPartyRental: true,
        pimProductId: thirdPartyPimId,
      },
    });

    // Verify they were created and store IDs
    expect(created1.createInventory).toBeDefined();
    expect(created2.createInventory).toBeDefined();
    const internalInventoryId = created1.createInventory.id;
    const thirdPartyInventoryId = created2.createInventory.id;

    // Verify directly by ID that they exist and have correct properties
    const { inventoryById: directInternal } = await sdk.InventoryById({
      id: internalInventoryId,
    });
    const { inventoryById: directThirdParty } = await sdk.InventoryById({
      id: thirdPartyInventoryId,
    });

    expect(directInternal).toBeDefined();
    expect(directInternal?.isThirdPartyRental).toBe(false);
    expect(directInternal?.pimProductId).toBe(internalPimId);

    expect(directThirdParty).toBeDefined();
    expect(directThirdParty?.isThirdPartyRental).toBe(true);
    expect(directThirdParty?.pimProductId).toBe(thirdPartyPimId);

    // Filter by internal (not third party rental)
    const { listInventory: internalItems } = await sdk.ListInventoryItems({
      query: {
        filter: {
          isThirdPartyRental: false,
        },
      },
    });

    expect(internalItems).toBeDefined();
    // Verify all items in the list are internal
    expect(internalItems.items.every((item) => !item.isThirdPartyRental)).toBe(
      true,
    );
    // Check if our internal item is in the list
    const hasInternalItem = internalItems.items.some(
      (item) => item.id === internalInventoryId,
    );
    // Check that third party item is NOT in the list
    const hasThirdPartyInWrongList = internalItems.items.some(
      (item) => item.id === thirdPartyInventoryId,
    );
    expect(hasThirdPartyInWrongList).toBe(false);

    // Filter by third party rental
    const { listInventory: thirdPartyItems } = await sdk.ListInventoryItems({
      query: {
        filter: {
          isThirdPartyRental: true,
        },
      },
    });

    expect(thirdPartyItems).toBeDefined();
    // Verify all items in the list are third party
    expect(thirdPartyItems.items.every((item) => item.isThirdPartyRental)).toBe(
      true,
    );
    // Check if our third party item is in the list
    const hasThirdPartyItem = thirdPartyItems.items.some(
      (item) => item.id === thirdPartyInventoryId,
    );
    // Check that internal item is NOT in the list
    const hasInternalInWrongList = thirdPartyItems.items.some(
      (item) => item.id === internalInventoryId,
    );
    expect(hasInternalInWrongList).toBe(false);

    // At least one of our items should appear in their respective filtered lists
    expect(hasInternalItem || hasThirdPartyItem).toBe(true);
  });

  describe('filters inventory by PIM category', () => {
    it('filters inventory by exact pimCategoryId match', async () => {
      const { sdk } = await createClient();
      const uniqueId = Date.now().toString();
      const testUuid = uuidv4();

      // Create a PIM category first
      const categoryPath = `|${testUuid}|Electronics|Computers|Laptops|`;
      const { upsertPimCategory } = await sdk.UtilCreatePimCategory({
        input: {
          id: `CAT-LAPTOPS-${uniqueId}`,
          name: 'Laptops',
          description: 'Laptop computers',
          path: categoryPath,
          has_products: true,
          platform_id: 'test-platform',
        },
      });

      if (!upsertPimCategory) throw new Error('Failed to create PIM category');

      const categoryId = upsertPimCategory.id;

      // Create inventory items with the specific category
      const targetItems: any[] = [];
      for (let i = 0; i < 3; i++) {
        const { createInventory } = await sdk.CreateInventory({
          input: {
            status: InventoryStatus.OnOrder,
            isThirdPartyRental: false,
            pimCategoryId: categoryId,
            pimCategoryPath: categoryPath,
            pimCategoryName: 'Laptops',
            pimProductId: `LAPTOP-${i}-${uniqueId}`,
          },
        });
        targetItems.push(createInventory);
      }

      // Create inventory items with different categories
      await sdk.CreateInventory({
        input: {
          status: InventoryStatus.OnOrder,
          isThirdPartyRental: false,
          pimCategoryId: `CAT-OTHER-${uniqueId}`,
          pimCategoryPath: `|Electronics|Phones|`,
          pimCategoryName: 'Phones',
          pimProductId: `PHONE-${uniqueId}`,
        },
      });

      // Create inventory items with no category
      await sdk.CreateInventory({
        input: {
          status: InventoryStatus.OnOrder,
          isThirdPartyRental: false,
          pimProductId: `NO-CAT-${uniqueId}`,
        },
      });

      // Filter by the specific category ID
      const { listInventory } = await sdk.ListInventoryItems({
        query: {
          filter: {
            pimCategoryId: categoryId,
          },
        },
      });

      expect(listInventory).toBeDefined();
      expect(listInventory.items.length).toBe(3);

      // Verify all returned items have the correct category
      listInventory.items.forEach((item) => {
        expect(item.pimCategoryId).toBe(categoryId);
        expect(item.pimCategoryPath).toBe(categoryPath);
        expect(item.pimCategoryName).toBe('Laptops');
        expect(item.pimProductId).toContain('LAPTOP');
      });

      // Verify the specific items we created are returned
      const returnedIds = listInventory.items.map((item) => item.id);
      targetItems.forEach((targetItem) => {
        expect(returnedIds).toContain(targetItem.id);
      });
    });

    it('filters inventory by pimCategoryId with hierarchical matching', async () => {
      const { sdk } = await createClient();
      const uniqueId = Date.now().toString();
      const testUuid = uuidv4();

      // Create a hierarchy of categories with unique UUID prefix:
      // |{uuid}|Electronics| (parent)
      // |{uuid}|Electronics|Computers| (child)
      // |{uuid}|Electronics|Computers|Laptops| (grandchild)
      // |{uuid}|Electronics|Computers|Laptops|Gaming| (great-grandchild)

      const parentCategoryId = `CAT-PARENT-${uniqueId}`;
      const parentPath = `|${testUuid}|Electronics|`;

      const childCategoryId = `CAT-CHILD-${uniqueId}`;
      const childPath = `|${testUuid}|Electronics|Computers|`;

      const grandchildCategoryId = `CAT-GRANDCHILD-${uniqueId}`;
      const grandchildPath = `|${testUuid}|Electronics|Computers|Laptops|`;

      const greatGrandchildCategoryId = `CAT-GREAT-GRANDCHILD-${uniqueId}`;
      const greatGrandchildPath = `|${testUuid}|Electronics|Computers|Laptops|Gaming|`;

      // Create the PIM categories first
      await sdk.UtilCreatePimCategory({
        input: {
          id: parentCategoryId,
          name: 'Electronics',
          description: 'Electronics category',
          path: parentPath,
          has_products: true,
          platform_id: 'test-platform',
        },
      });

      await sdk.UtilCreatePimCategory({
        input: {
          id: childCategoryId,
          name: 'Computers',
          description: 'Computers category',
          path: childPath,
          has_products: true,
          platform_id: 'test-platform',
        },
      });

      await sdk.UtilCreatePimCategory({
        input: {
          id: grandchildCategoryId,
          name: 'Laptops',
          description: 'Laptops category',
          path: grandchildPath,
          has_products: true,
          platform_id: 'test-platform',
        },
      });

      await sdk.UtilCreatePimCategory({
        input: {
          id: greatGrandchildCategoryId,
          name: 'Gaming Laptops',
          description: 'Gaming Laptops category',
          path: greatGrandchildPath,
          has_products: true,
          platform_id: 'test-platform',
        },
      });

      // Create inventory for parent category (exact match)
      const { createInventory: parentItem } = await sdk.CreateInventory({
        input: {
          status: InventoryStatus.OnOrder,
          isThirdPartyRental: false,
          pimCategoryId: parentCategoryId,
          pimCategoryPath: parentPath,
          pimCategoryName: 'Electronics',
          pimProductId: `ELECTRONICS-${uniqueId}`,
        },
      });

      // Create inventory for child category (should match parent filter)
      const { createInventory: childItem } = await sdk.CreateInventory({
        input: {
          status: InventoryStatus.OnOrder,
          isThirdPartyRental: false,
          pimCategoryId: childCategoryId,
          pimCategoryPath: childPath,
          pimCategoryName: 'Computers',
          pimProductId: `COMPUTER-${uniqueId}`,
        },
      });

      // Create inventory for grandchild category (should match parent filter)
      const { createInventory: grandchildItem } = await sdk.CreateInventory({
        input: {
          status: InventoryStatus.OnOrder,
          isThirdPartyRental: false,
          pimCategoryId: grandchildCategoryId,
          pimCategoryPath: grandchildPath,
          pimCategoryName: 'Laptops',
          pimProductId: `LAPTOP-${uniqueId}`,
        },
      });

      // Create inventory for great-grandchild category (should match parent filter)
      const { createInventory: greatGrandchildItem } =
        await sdk.CreateInventory({
          input: {
            status: InventoryStatus.OnOrder,
            isThirdPartyRental: false,
            pimCategoryId: greatGrandchildCategoryId,
            pimCategoryPath: greatGrandchildPath,
            pimCategoryName: 'Gaming Laptops',
            pimProductId: `GAMING-LAPTOP-${uniqueId}`,
          },
        });

      // Create inventory for unrelated category (should NOT match)
      await sdk.CreateInventory({
        input: {
          status: InventoryStatus.OnOrder,
          isThirdPartyRental: false,
          pimCategoryId: `CAT-UNRELATED-${uniqueId}`,
          pimCategoryPath: `|Furniture|Chairs|`,
          pimCategoryName: 'Chairs',
          pimProductId: `CHAIR-${uniqueId}`,
        },
      });

      // Test 1: Filter by parent category - should return all items in the hierarchy
      const { listInventory: parentResults } = await sdk.ListInventoryItems({
        query: {
          filter: {
            pimCategoryId: parentCategoryId,
          },
        },
      });

      expect(parentResults.items.length).toBe(4);
      const parentResultIds = parentResults.items.map((item) => item.id);
      expect(parentResultIds).toContain(parentItem.id);
      expect(parentResultIds).toContain(childItem.id);
      expect(parentResultIds).toContain(grandchildItem.id);
      expect(parentResultIds).toContain(greatGrandchildItem.id);

      // Verify all items have paths that start with the parent path
      parentResults.items.forEach((item) => {
        expect(item.pimCategoryPath?.startsWith(parentPath)).toBe(true);
      });

      // Test 2: Filter by child category - should return child and its descendants
      const { listInventory: childResults } = await sdk.ListInventoryItems({
        query: {
          filter: {
            pimCategoryId: childCategoryId,
          },
        },
      });

      expect(childResults.items.length).toBe(3);
      const childResultIds = childResults.items.map((item) => item.id);
      expect(childResultIds).not.toContain(parentItem.id); // Parent should not be included
      expect(childResultIds).toContain(childItem.id);
      expect(childResultIds).toContain(grandchildItem.id);
      expect(childResultIds).toContain(greatGrandchildItem.id);

      // Test 3: Filter by grandchild category - should return grandchild and its descendants
      const { listInventory: grandchildResults } = await sdk.ListInventoryItems(
        {
          query: {
            filter: {
              pimCategoryId: grandchildCategoryId,
            },
          },
        },
      );

      expect(grandchildResults.items.length).toBe(2);
      const grandchildResultIds = grandchildResults.items.map(
        (item) => item.id,
      );
      expect(grandchildResultIds).not.toContain(parentItem.id);
      expect(grandchildResultIds).not.toContain(childItem.id);
      expect(grandchildResultIds).toContain(grandchildItem.id);
      expect(grandchildResultIds).toContain(greatGrandchildItem.id);

      // Test 4: Filter by great-grandchild category - should return only itself
      const { listInventory: greatGrandchildResults } =
        await sdk.ListInventoryItems({
          query: {
            filter: {
              pimCategoryId: greatGrandchildCategoryId,
            },
          },
        });

      expect(greatGrandchildResults.items.length).toBe(1);
      expect(greatGrandchildResults.items[0].id).toBe(greatGrandchildItem.id);
    });

    it('handles non-existent pimCategoryId gracefully', async () => {
      const { sdk } = await createClient();
      const uniqueId = Date.now().toString();

      // Create some inventory items
      await sdk.CreateInventory({
        input: {
          status: InventoryStatus.OnOrder,
          isThirdPartyRental: false,
          pimCategoryId: `CAT-EXISTS-${uniqueId}`,
          pimCategoryPath: `|ValidCategory|`,
          pimCategoryName: 'Valid Category',
          pimProductId: `VALID-PROD-${uniqueId}`,
        },
      });

      // Filter by non-existent category ID should throw an error
      await expect(
        sdk.ListInventoryItems({
          query: {
            filter: {
              pimCategoryId: `CAT-NON-EXISTENT-${uniqueId}`,
            },
          },
        }),
      ).rejects.toThrow();
    });
  });

  it('gets inventory by id', async () => {
    const { sdk } = await createClient();

    // Create an inventory item
    const createInput = {
      status: InventoryStatus.OnOrder,
      isThirdPartyRental: false,
      purchaseOrderId: 'PO-GET-BY-ID',
      assetId: 'ASSET-123',
      pimProductId: 'PROD-GET-BY-ID',
    };

    const { createInventory } = await sdk.CreateInventory({
      input: createInput,
    });
    expect(createInventory).toBeDefined();
    const inventoryId = createInventory.id;

    // Get it by ID
    const { inventoryById } = await sdk.InventoryById({ id: inventoryId });

    expect(inventoryById).toBeDefined();
    expect(inventoryById?.id).toBe(inventoryId);
    expect(inventoryById?.status).toBe('ON_ORDER');
    expect(inventoryById?.isThirdPartyRental).toBe(false);
    expect(inventoryById?.purchaseOrderId).toBe('PO-GET-BY-ID');
    expect(inventoryById?.assetId).toBe('ASSET-123');
    expect(inventoryById?.pimProductId).toBe('PROD-GET-BY-ID');
    expect(inventoryById?.companyId).toBeDefined();
    expect(inventoryById?.createdAt).toBeDefined();
    expect(inventoryById?.updatedAt).toBeDefined();
    expect(inventoryById?.createdBy).toBeDefined();
    expect(inventoryById?.updatedBy).toBeDefined();
  });

  it('returns null when getting non-existent inventory by id', async () => {
    const { sdk } = await createClient();

    const { inventoryById } = await sdk.InventoryById({
      id: 'non-existent-id',
    });
    expect(inventoryById).toBeNull();
  });

  it('handles pagination in inventory listing', async () => {
    const { sdk } = await createClient();

    // Create multiple inventory items
    for (let i = 0; i < 5; i++) {
      await sdk.CreateInventory({
        input: {
          status: InventoryStatus.OnOrder,
          isThirdPartyRental: false,
          pimProductId: `PAGINATED-ITEM-${i}`,
        },
      });
    }

    // Get first page
    const { listInventory: firstPage } = await sdk.ListInventoryItems({
      query: {
        page: {
          size: 2,
          number: 1,
        },
      },
    });

    expect(firstPage).toBeDefined();
    expect(firstPage.items.length).toBeLessThanOrEqual(2);

    // Get second page
    const { listInventory: secondPage } = await sdk.ListInventoryItems({
      query: {
        page: {
          size: 2,
          number: 2,
        },
      },
    });

    expect(secondPage).toBeDefined();
    expect(secondPage.items.length).toBeLessThanOrEqual(2);

    // Ensure different items on different pages
    const firstPageIds = firstPage.items.map((item) => item.id);
    const secondPageIds = secondPage.items.map((item) => item.id);
    const commonIds = firstPageIds.filter((id) => secondPageIds.includes(id));
    expect(commonIds.length).toBe(0);
  });

  it('prevents cross-tenant access to inventory', async () => {
    // Create inventory as company A
    const companyAClient = await createClient({
      userId: 'user-company-a',
      companyId: 'company-a-id',
      userName: 'Company A User',
    });
    const { sdk: companyASdk } = companyAClient;

    const uniqueId = Date.now().toString();
    const companyAInventoryInput = {
      status: InventoryStatus.OnOrder,
      isThirdPartyRental: false,
      pimProductId: `COMPANY-A-PRODUCT-${uniqueId}`,
      purchaseOrderId: `COMPANY-A-PO-${uniqueId}`,
    };

    const { createInventory: companyAInventory } =
      await companyASdk.CreateInventory({
        input: companyAInventoryInput,
      });
    expect(companyAInventory).toBeDefined();
    const companyAInventoryId = companyAInventory.id;
    const companyACompanyId = companyAInventory.companyId;

    // Create inventory as company B (different client/user)
    const companyBClient = await createClient({
      userId: 'user-company-b',
      companyId: 'company-b-id',
      userName: 'Company B User',
    });
    const { sdk: companyBSdk } = companyBClient;

    const companyBInventoryInput = {
      status: InventoryStatus.Received,
      isThirdPartyRental: true,
      pimProductId: `COMPANY-B-PRODUCT-${uniqueId}`,
      fulfilmentId: `COMPANY-B-FUL-${uniqueId}`,
    };

    const { createInventory: companyBInventory } =
      await companyBSdk.CreateInventory({
        input: companyBInventoryInput,
      });
    expect(companyBInventory).toBeDefined();
    const companyBInventoryId = companyBInventory.id;
    const companyBCompanyId = companyBInventory.companyId;

    // Verify companies are different
    expect(companyACompanyId).not.toBe(companyBCompanyId);

    // Company B should NOT be able to access Company A's inventory by ID
    const { inventoryById: companyBAccessingA } =
      await companyBSdk.InventoryById({
        id: companyAInventoryId,
      });
    expect(companyBAccessingA).toBeNull();

    // Company A should NOT be able to access Company B's inventory by ID
    const { inventoryById: companyAAccessingB } =
      await companyASdk.InventoryById({
        id: companyBInventoryId,
      });
    expect(companyAAccessingB).toBeNull();

    // Company A should only see their own inventory in listings
    const { listInventory: companyAList } =
      await companyASdk.ListInventoryItems({
        query: {},
      });
    expect(
      companyAList.items.every((item) => item.companyId === companyACompanyId),
    ).toBe(true);
    expect(
      companyAList.items.some((item) => item.id === companyAInventoryId),
    ).toBe(true);
    expect(
      companyAList.items.some((item) => item.id === companyBInventoryId),
    ).toBe(false);

    // Company B should only see their own inventory in listings
    const { listInventory: companyBList } =
      await companyBSdk.ListInventoryItems({
        query: {},
      });
    expect(
      companyBList.items.every((item) => item.companyId === companyBCompanyId),
    ).toBe(true);
    expect(
      companyBList.items.some((item) => item.id === companyBInventoryId),
    ).toBe(true);
    expect(
      companyBList.items.some((item) => item.id === companyAInventoryId),
    ).toBe(false);

    // Company B should NOT be able to update Company A's inventory
    await expect(
      companyBSdk.BulkMarkInventoryReceived({
        input: { ids: [companyAInventoryId] },
      }),
    ).rejects.toThrow('Inventory INV');

    // Company A should NOT be able to update Company B's inventory
    await expect(
      companyASdk.UpdateInventorySerialisedId({
        id: companyBInventoryId,
        input: { assetId: 'HACKED-ASSET' },
      }),
    ).rejects.toThrow('Inventory not found or not authorized');

    // Company B should NOT be able to delete Company A's inventory
    const { deleteInventory: companyBDeleteA } =
      await companyBSdk.DeleteInventory({
        id: companyAInventoryId,
        input: { reason: 'Trying to delete another company inventory' },
      });
    expect(companyBDeleteA).toBe(false);

    // Verify Company A's inventory still exists
    const { inventoryById: companyAStillExists } =
      await companyASdk.InventoryById({
        id: companyAInventoryId,
      });
    expect(companyAStillExists).toBeDefined();
    expect(companyAStillExists?.id).toBe(companyAInventoryId);
  });

  describe('listInventoryGroupedByPimCategoryId', () => {
    it('groups inventory by category with quantity breakdown', async () => {
      const { sdk } = await createClient();
      const uniqueId = Date.now().toString();

      // Create inventory items with different categories and statuses
      // Category 1: 3 ON_ORDER, 2 RECEIVED
      for (let i = 0; i < 3; i++) {
        await sdk.CreateInventory({
          input: {
            status: InventoryStatus.OnOrder,
            isThirdPartyRental: false,
            pimCategoryId: `CAT-GROUP-1-${uniqueId}`,
            pimCategoryName: 'Excavators',
            pimCategoryPath: '/equipment/excavators',
            pimProductId: `PROD-CAT1-ON-${i}-${uniqueId}`,
          },
        });
      }
      for (let i = 0; i < 2; i++) {
        await sdk.CreateInventory({
          input: {
            status: InventoryStatus.Received,
            isThirdPartyRental: false,
            pimCategoryId: `CAT-GROUP-1-${uniqueId}`,
            pimCategoryName: 'Excavators',
            pimCategoryPath: '/equipment/excavators',
            pimProductId: `PROD-CAT1-REC-${i}-${uniqueId}`,
          },
        });
      }

      // Category 2: 1 ON_ORDER, 4 RECEIVED
      await sdk.CreateInventory({
        input: {
          status: InventoryStatus.OnOrder,
          isThirdPartyRental: false,
          pimCategoryId: `CAT-GROUP-2-${uniqueId}`,
          pimCategoryName: 'Bulldozers',
          pimCategoryPath: '/equipment/bulldozers',
          pimProductId: `PROD-CAT2-ON-${uniqueId}`,
        },
      });
      for (let i = 0; i < 4; i++) {
        await sdk.CreateInventory({
          input: {
            status: InventoryStatus.Received,
            isThirdPartyRental: false,
            pimCategoryId: `CAT-GROUP-2-${uniqueId}`,
            pimCategoryName: 'Bulldozers',
            pimCategoryPath: '/equipment/bulldozers',
            pimProductId: `PROD-CAT2-REC-${i}-${uniqueId}`,
          },
        });
      }

      // Items without category: 2 ON_ORDER, 1 RECEIVED
      for (let i = 0; i < 2; i++) {
        await sdk.CreateInventory({
          input: {
            status: InventoryStatus.OnOrder,
            isThirdPartyRental: false,
            pimProductId: `PROD-NO-CAT-ON-${i}-${uniqueId}`,
          },
        });
      }
      await sdk.CreateInventory({
        input: {
          status: InventoryStatus.Received,
          isThirdPartyRental: false,
          pimProductId: `PROD-NO-CAT-REC-${uniqueId}`,
        },
      });

      // Query grouped inventory
      const { listInventoryGroupedByPimCategoryId } =
        await sdk.ListInventoryGroupedByPimCategoryId({
          query: {},
        });

      expect(listInventoryGroupedByPimCategoryId).toBeDefined();
      const items = listInventoryGroupedByPimCategoryId.items;

      // Find our test categories
      const cat1 = items.find(
        (item) => item.pimCategoryId === `CAT-GROUP-1-${uniqueId}`,
      );
      const cat2 = items.find(
        (item) => item.pimCategoryId === `CAT-GROUP-2-${uniqueId}`,
      );
      const noCategory = items.find((item) => item.pimCategoryId === null);

      // Verify Category 1
      expect(cat1).toBeDefined();
      expect(cat1?.pimCategoryName).toBe('Excavators');
      expect(cat1?.pimCategoryPath).toBe('/equipment/excavators');
      expect(cat1?.quantityOnOrder).toBe(3);
      expect(cat1?.quantityReceived).toBe(2);
      expect(cat1?.totalQuantity).toBe(5);
      expect(cat1?.sampleInventoryIds).toHaveLength(5);

      // Verify Category 2
      expect(cat2).toBeDefined();
      expect(cat2?.pimCategoryName).toBe('Bulldozers');
      expect(cat2?.pimCategoryPath).toBe('/equipment/bulldozers');
      expect(cat2?.quantityOnOrder).toBe(1);
      expect(cat2?.quantityReceived).toBe(4);
      expect(cat2?.totalQuantity).toBe(5);
      expect(cat2?.sampleInventoryIds).toHaveLength(5);

      // Verify items without category are grouped
      if (noCategory) {
        expect(noCategory.pimCategoryId).toBeNull();
        expect(noCategory.pimCategoryName).toBeNull();
        expect(noCategory.pimCategoryPath).toBeNull();
        expect(noCategory.quantityOnOrder).toBeGreaterThanOrEqual(2);
        expect(noCategory.quantityReceived).toBeGreaterThanOrEqual(1);
        expect(noCategory.totalQuantity).toBeGreaterThanOrEqual(3);
      }
    });

    it('filters grouped inventory by status', async () => {
      const { sdk } = await createClient();
      const uniqueId = Date.now().toString();

      // Create inventory with specific category
      const categoryId = `CAT-FILTER-${uniqueId}`;

      // Create ON_ORDER items
      for (let i = 0; i < 3; i++) {
        await sdk.CreateInventory({
          input: {
            status: InventoryStatus.OnOrder,
            isThirdPartyRental: false,
            pimCategoryId: categoryId,
            pimCategoryName: 'Test Category',
            pimProductId: `PROD-ON-${i}-${uniqueId}`,
          },
        });
      }

      // Create RECEIVED items
      for (let i = 0; i < 2; i++) {
        await sdk.CreateInventory({
          input: {
            status: InventoryStatus.Received,
            isThirdPartyRental: false,
            pimCategoryId: categoryId,
            pimCategoryName: 'Test Category',
            pimProductId: `PROD-REC-${i}-${uniqueId}`,
          },
        });
      }

      // Query with ON_ORDER filter
      const { listInventoryGroupedByPimCategoryId: onOrderGroups } =
        await sdk.ListInventoryGroupedByPimCategoryId({
          query: {
            filter: {
              status: InventoryStatus.OnOrder,
            },
          },
        });

      const onOrderCategory = onOrderGroups.items.find(
        (item) => item.pimCategoryId === categoryId,
      );
      expect(onOrderCategory).toBeDefined();
      expect(onOrderCategory?.quantityOnOrder).toBe(3);
      expect(onOrderCategory?.quantityReceived).toBe(0);
      expect(onOrderCategory?.totalQuantity).toBe(3);

      // Query with RECEIVED filter
      const { listInventoryGroupedByPimCategoryId: receivedGroups } =
        await sdk.ListInventoryGroupedByPimCategoryId({
          query: {
            filter: {
              status: InventoryStatus.Received,
            },
          },
        });

      const receivedCategory = receivedGroups.items.find(
        (item) => item.pimCategoryId === categoryId,
      );
      expect(receivedCategory).toBeDefined();
      expect(receivedCategory?.quantityOnOrder).toBe(0);
      expect(receivedCategory?.quantityReceived).toBe(2);
      expect(receivedCategory?.totalQuantity).toBe(2);
    });

    it('filters grouped inventory by isThirdPartyRental', async () => {
      const { sdk } = await createClient();
      const uniqueId = Date.now().toString();

      const categoryId = `CAT-RENTAL-${uniqueId}`;

      // Create internal inventory
      for (let i = 0; i < 3; i++) {
        await sdk.CreateInventory({
          input: {
            status: InventoryStatus.OnOrder,
            isThirdPartyRental: false,
            pimCategoryId: categoryId,
            pimCategoryName: 'Mixed Category',
            pimProductId: `PROD-INTERNAL-${i}-${uniqueId}`,
          },
        });
      }

      // Create third party rental inventory
      for (let i = 0; i < 2; i++) {
        await sdk.CreateInventory({
          input: {
            status: InventoryStatus.OnOrder,
            isThirdPartyRental: true,
            pimCategoryId: categoryId,
            pimCategoryName: 'Mixed Category',
            pimProductId: `PROD-THIRD-PARTY-${i}-${uniqueId}`,
          },
        });
      }

      // Query internal only
      const { listInventoryGroupedByPimCategoryId: internalGroups } =
        await sdk.ListInventoryGroupedByPimCategoryId({
          query: {
            filter: {
              isThirdPartyRental: false,
            },
          },
        });

      const internalCategory = internalGroups.items.find(
        (item) => item.pimCategoryId === categoryId,
      );
      expect(internalCategory).toBeDefined();
      expect(internalCategory?.totalQuantity).toBe(3);

      // Query third party only
      const { listInventoryGroupedByPimCategoryId: thirdPartyGroups } =
        await sdk.ListInventoryGroupedByPimCategoryId({
          query: {
            filter: {
              isThirdPartyRental: true,
            },
          },
        });

      const thirdPartyCategory = thirdPartyGroups.items.find(
        (item) => item.pimCategoryId === categoryId,
      );
      expect(thirdPartyCategory).toBeDefined();
      expect(thirdPartyCategory?.totalQuantity).toBe(2);
    });

    it('handles pagination for grouped inventory', async () => {
      const { sdk } = await createClient();
      const uniqueId = Date.now().toString();

      // Create multiple categories to ensure we have enough for pagination
      for (let i = 0; i < 5; i++) {
        await sdk.CreateInventory({
          input: {
            status: InventoryStatus.OnOrder,
            isThirdPartyRental: false,
            pimCategoryId: `CAT-PAGE-${i}-${uniqueId}`,
            pimCategoryName: `Category ${i}`,
            pimProductId: `PROD-PAGE-${i}-${uniqueId}`,
          },
        });
      }

      // Query first page
      const { listInventoryGroupedByPimCategoryId: firstPage } =
        await sdk.ListInventoryGroupedByPimCategoryId({
          query: {
            page: {
              size: 2,
              number: 1,
            },
          },
        });

      expect(firstPage).toBeDefined();
      expect(firstPage.items.length).toBeLessThanOrEqual(2);

      // Query second page
      const { listInventoryGroupedByPimCategoryId: secondPage } =
        await sdk.ListInventoryGroupedByPimCategoryId({
          query: {
            page: {
              size: 2,
              number: 2,
            },
          },
        });

      expect(secondPage).toBeDefined();
      expect(secondPage.items.length).toBeLessThanOrEqual(2);

      // If both pages have items, ensure they're different
      if (firstPage.items.length > 0 && secondPage.items.length > 0) {
        const firstPageIds = firstPage.items.map((item) => item.pimCategoryId);
        const secondPageIds = secondPage.items.map(
          (item) => item.pimCategoryId,
        );
        const commonIds = firstPageIds.filter((id) =>
          secondPageIds.includes(id),
        );
        expect(commonIds.length).toBe(0);
      }
    });

    it('resolves sampleInventories using dataloader', async () => {
      const { sdk } = await createClient();
      const uniqueId = Date.now().toString();
      const categoryId = `CAT-DATALOADER-${uniqueId}`;

      // Create inventory items with specific product IDs
      for (let i = 0; i < 7; i++) {
        await sdk.CreateInventory({
          input: {
            status: i < 4 ? InventoryStatus.OnOrder : InventoryStatus.Received,
            isThirdPartyRental: false,
            pimCategoryId: categoryId,
            pimCategoryName: 'Dataloader Test Category',
            pimCategoryPath: '/test/dataloader',
            pimProductId: `PROD-DATALOADER-${i}-${uniqueId}`,
          },
        });
      }

      // Query grouped inventory with sampleInventories field
      const { listInventoryGroupedByPimCategoryId } =
        await sdk.ListInventoryGroupedByPimCategoryId({
          query: {},
        });

      const testCategory = listInventoryGroupedByPimCategoryId.items.find(
        (item) => item.pimCategoryId === categoryId,
      );

      expect(testCategory).toBeDefined();
      expect(testCategory?.totalQuantity).toBe(7);
      expect(testCategory?.quantityOnOrder).toBe(4);
      expect(testCategory?.quantityReceived).toBe(3);

      // Check sampleInventoryIds (should have max 5)
      expect(testCategory?.sampleInventoryIds).toBeDefined();
      expect(testCategory?.sampleInventoryIds.length).toBeLessThanOrEqual(5);

      // Check sampleInventories resolved via dataloader
      expect(testCategory?.sampleInventories).toBeDefined();
      expect(testCategory?.sampleInventories.length).toBe(
        testCategory?.sampleInventoryIds.length,
      );

      // Verify each sample inventory has the correct data
      testCategory?.sampleInventories.forEach((inventory) => {
        if (inventory) {
          expect(inventory.id).toBeDefined();
          expect(inventory.pimCategoryId).toBe(categoryId);
          expect(inventory.isThirdPartyRental).toBe(false);
          expect(['ON_ORDER', 'RECEIVED']).toContain(inventory.status);
          expect(inventory.pimProductId).toContain('PROD-DATALOADER');
        }
      });

      // Verify the IDs match between sampleInventoryIds and sampleInventories
      const resolvedIds =
        testCategory?.sampleInventories.map((inv) => inv?.id).filter(Boolean) ||
        [];
      const sampleIds = testCategory?.sampleInventoryIds || [];
      expect(resolvedIds.sort()).toEqual(sampleIds.sort());
    });

    it('respects company isolation for grouped inventory', async () => {
      const uniqueId = Date.now().toString();
      const sharedCategoryId = `SHARED-CAT-${uniqueId}`;

      // Company A creates inventory
      const companyAClient = await createClient({
        userId: 'user-company-a-grouped',
        companyId: 'company-a-grouped-id',
        userName: 'Company A Grouped User',
      });
      const { sdk: companyASdk } = companyAClient;

      for (let i = 0; i < 3; i++) {
        await companyASdk.CreateInventory({
          input: {
            status: InventoryStatus.OnOrder,
            isThirdPartyRental: false,
            pimCategoryId: sharedCategoryId,
            pimCategoryName: 'Shared Category',
            pimProductId: `COMPANY-A-PROD-${i}-${uniqueId}`,
          },
        });
      }

      // Company B creates inventory with same category ID
      const companyBClient = await createClient({
        userId: 'user-company-b-grouped',
        companyId: 'company-b-grouped-id',
        userName: 'Company B Grouped User',
      });
      const { sdk: companyBSdk } = companyBClient;

      for (let i = 0; i < 2; i++) {
        await companyBSdk.CreateInventory({
          input: {
            status: InventoryStatus.Received,
            isThirdPartyRental: false,
            pimCategoryId: sharedCategoryId,
            pimCategoryName: 'Shared Category',
            pimProductId: `COMPANY-B-PROD-${i}-${uniqueId}`,
          },
        });
      }

      // Company A should only see their 3 items
      const { listInventoryGroupedByPimCategoryId: companyAGroups } =
        await companyASdk.ListInventoryGroupedByPimCategoryId({
          query: {},
        });

      const companyACategory = companyAGroups.items.find(
        (item) => item.pimCategoryId === sharedCategoryId,
      );
      expect(companyACategory).toBeDefined();
      expect(companyACategory?.totalQuantity).toBe(3);
      expect(companyACategory?.quantityOnOrder).toBe(3);
      expect(companyACategory?.quantityReceived).toBe(0);

      // Company B should only see their 2 items
      const { listInventoryGroupedByPimCategoryId: companyBGroups } =
        await companyBSdk.ListInventoryGroupedByPimCategoryId({
          query: {},
        });

      const companyBCategory = companyBGroups.items.find(
        (item) => item.pimCategoryId === sharedCategoryId,
      );
      expect(companyBCategory).toBeDefined();
      expect(companyBCategory?.totalQuantity).toBe(2);
      expect(companyBCategory?.quantityOnOrder).toBe(0);
      expect(companyBCategory?.quantityReceived).toBe(2);
    });

    it('filters grouped inventory by workspaceId', async () => {
      const { sdk, utils } = await createClient();
      const uniqueId = Date.now().toString();

      // Create two workspaces
      const workspace1 = await utils.createWorkspace();
      const workspace2 = await utils.createWorkspace();

      const sharedCategoryId = `CAT-WS-FILTER-${uniqueId}`;

      // Create inventory in workspace1 with the same category
      for (let i = 0; i < 3; i++) {
        await sdk.CreateInventory({
          input: {
            workspaceId: workspace1.id,
            status: i < 2 ? InventoryStatus.OnOrder : InventoryStatus.Received,
            isThirdPartyRental: false,
            pimCategoryId: sharedCategoryId,
            pimCategoryName: 'Workspace Category',
            pimCategoryPath: '/workspace/test',
            pimProductId: `WS1-PROD-${i}-${uniqueId}`,
          },
        });
      }

      // Create inventory in workspace2 with the same category
      for (let i = 0; i < 2; i++) {
        await sdk.CreateInventory({
          input: {
            workspaceId: workspace2.id,
            status: InventoryStatus.Received,
            isThirdPartyRental: false,
            pimCategoryId: sharedCategoryId,
            pimCategoryName: 'Workspace Category',
            pimCategoryPath: '/workspace/test',
            pimProductId: `WS2-PROD-${i}-${uniqueId}`,
          },
        });
      }

      // Create inventory without workspace with the same category
      await sdk.CreateInventory({
        input: {
          status: InventoryStatus.OnOrder,
          isThirdPartyRental: false,
          pimCategoryId: sharedCategoryId,
          pimCategoryName: 'Workspace Category',
          pimCategoryPath: '/workspace/test',
          pimProductId: `NO-WS-PROD-${uniqueId}`,
        },
      });

      // Filter by workspace1
      const { listInventoryGroupedByPimCategoryId: ws1Groups } =
        await sdk.ListInventoryGroupedByPimCategoryId({
          query: {
            filter: {
              workspaceId: workspace1.id,
            },
          },
        });

      const ws1Category = ws1Groups.items.find(
        (item) => item.pimCategoryId === sharedCategoryId,
      );
      expect(ws1Category).toBeDefined();
      expect(ws1Category?.totalQuantity).toBe(3);
      expect(ws1Category?.quantityOnOrder).toBe(2);
      expect(ws1Category?.quantityReceived).toBe(1);
      expect(ws1Category?.sampleInventoryIds.length).toBe(3);

      // Verify all sample inventories belong to workspace1
      ws1Category?.sampleInventories.forEach((inv) => {
        if (inv) {
          expect(inv.pimProductId).toContain('WS1-PROD');
        }
      });

      // Filter by workspace2
      const { listInventoryGroupedByPimCategoryId: ws2Groups } =
        await sdk.ListInventoryGroupedByPimCategoryId({
          query: {
            filter: {
              workspaceId: workspace2.id,
            },
          },
        });

      const ws2Category = ws2Groups.items.find(
        (item) => item.pimCategoryId === sharedCategoryId,
      );
      expect(ws2Category).toBeDefined();
      expect(ws2Category?.totalQuantity).toBe(2);
      expect(ws2Category?.quantityOnOrder).toBe(0);
      expect(ws2Category?.quantityReceived).toBe(2);
      expect(ws2Category?.sampleInventoryIds.length).toBe(2);

      // Verify all sample inventories belong to workspace2
      ws2Category?.sampleInventories.forEach((inv) => {
        if (inv) {
          expect(inv.pimProductId).toContain('WS2-PROD');
        }
      });

      // Query without workspace filter should include all
      const { listInventoryGroupedByPimCategoryId: allGroups } =
        await sdk.ListInventoryGroupedByPimCategoryId({
          query: {},
        });

      const allCategory = allGroups.items.find(
        (item) => item.pimCategoryId === sharedCategoryId,
      );
      expect(allCategory).toBeDefined();
      expect(allCategory?.totalQuantity).toBeGreaterThanOrEqual(6);
    });
  });
});
