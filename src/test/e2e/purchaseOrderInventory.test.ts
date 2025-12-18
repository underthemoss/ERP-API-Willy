import { WorkspaceAccessType } from './generated/graphql';
import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';

/* GraphQL operations for codegen */
gql`
  mutation CreatePurchaseOrderForInventoryTest($input: PurchaseOrderInput) {
    createPurchaseOrder(input: $input) {
      id
      purchase_order_number
      seller_id
      project_id
      company_id
      status
    }
  }
`;

gql`
  mutation CreateRentalPOLineItemForInventoryTest(
    $input: CreateRentalPurchaseOrderLineItemInput
  ) {
    createRentalPurchaseOrderLineItem(input: $input) {
      id
      purchase_order_id
      po_pim_id
      po_quantity
      lineitem_type
    }
  }
`;

gql`
  mutation CreateSalePOLineItemForInventoryTest(
    $input: CreateSalePurchaseOrderLineItemInput
  ) {
    createSalePurchaseOrderLineItem(input: $input) {
      id
      purchase_order_id
      po_pim_id
      po_quantity
      lineitem_type
    }
  }
`;

gql`
  mutation SubmitPurchaseOrderForInventoryTest($id: ID!) {
    submitPurchaseOrder(id: $id) {
      id
      status
    }
  }
`;

gql`
  query ListInventoryForTest($query: ListInventoryQuery) {
    listInventory(query: $query) {
      items {
        id
        status
        purchaseOrderId
        purchaseOrderLineItemId
        isThirdPartyRental
        pimProductId
        pimCategoryId
        pimCategoryPath
        pimCategoryName
        workspaceId
      }
    }
  }
`;

const { createClient } = createTestEnvironment();

describe('Purchase Order Inventory Creation', () => {
  it('creates on_order inventory when a purchase order is submitted', async () => {
    const { sdk, user } = await createClient();

    // Create a workspace
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'Inventory Test Workspace',
    });
    if (!createWorkspace) throw new Error('Workspace was not created');

    // Create a purchase order
    const purchaseOrderInput = {
      workspace_id: createWorkspace.id,
      seller_id: user.id,
      purchase_order_number: 'PO-INV-TEST-001',
    };

    const { createPurchaseOrder } =
      await sdk.CreatePurchaseOrderForInventoryTest({
        input: purchaseOrderInput,
      });

    if (!createPurchaseOrder) throw new Error('Purchase order was not created');
    expect(createPurchaseOrder.status).toBe('DRAFT');

    // Add 3 rental line items (each with quantity 1)
    const rentalLineItems = [];
    for (let i = 0; i < 3; i++) {
      const rentalLineItemInput = {
        purchase_order_id: createPurchaseOrder.id,
        po_pim_id: 'test-pim-category-1',
        po_quantity: 1,
      };

      const { createRentalPurchaseOrderLineItem } =
        await sdk.CreateRentalPOLineItemForInventoryTest({
          input: rentalLineItemInput,
        });

      if (!createRentalPurchaseOrderLineItem) {
        throw new Error(`Rental line item ${i + 1} was not created`);
      }
      expect(createRentalPurchaseOrderLineItem.po_quantity).toBe(1);
      rentalLineItems.push(createRentalPurchaseOrderLineItem);
    }

    // Add a sale line item with quantity 2
    const saleLineItemInput = {
      purchase_order_id: createPurchaseOrder.id,
      po_pim_id: 'test-pim-product-1',
      po_quantity: 2,
    };

    const { createSalePurchaseOrderLineItem } =
      await sdk.CreateSalePOLineItemForInventoryTest({
        input: saleLineItemInput,
      });

    if (!createSalePurchaseOrderLineItem) {
      throw new Error('Sale line item was not created');
    }
    expect(createSalePurchaseOrderLineItem.po_quantity).toBe(2);

    // Submit the purchase order - this should create inventory
    const { submitPurchaseOrder } =
      await sdk.SubmitPurchaseOrderForInventoryTest({
        id: createPurchaseOrder.id,
      });

    if (!submitPurchaseOrder) {
      throw new Error('Purchase order was not submitted');
    }
    expect(submitPurchaseOrder.status).toBe('SUBMITTED');

    // Check that inventory was created
    const { listInventory } = await sdk.ListInventoryForTest({
      query: {
        filter: {
          purchaseOrderId: createPurchaseOrder.id,
        },
        page: {
          size: 10,
          number: 1,
        },
      },
    });

    if (!listInventory) throw new Error('Could not list inventory');

    // Should have 5 total inventory items (3 rental + 2 sale)
    expect(listInventory.items.length).toBe(5);

    // All inventory should be ON_ORDER status
    listInventory.items.forEach((item) => {
      expect(item.status).toBe('ON_ORDER');
      expect(item.purchaseOrderId).toBe(createPurchaseOrder.id);
      expect(item.isThirdPartyRental).toBe(false);
    });

    // Check that 3 are linked to the rental line items (1 inventory per line item)
    const rentalLineItemIds = rentalLineItems.map((item) => item.id);
    const rentalInventory = listInventory.items.filter(
      (item) =>
        item.purchaseOrderLineItemId &&
        rentalLineItemIds.includes(item.purchaseOrderLineItemId),
    );
    expect(rentalInventory.length).toBe(3);

    // Each rental line item should have exactly 1 inventory item
    rentalLineItemIds.forEach((lineItemId) => {
      const inventoryForLineItem = listInventory.items.filter(
        (item) =>
          item.purchaseOrderLineItemId &&
          item.purchaseOrderLineItemId === lineItemId,
      );
      expect(inventoryForLineItem.length).toBe(1);
    });

    // Check that 2 are linked to the sale line item
    const saleInventory = listInventory.items.filter(
      (item) =>
        item.purchaseOrderLineItemId === createSalePurchaseOrderLineItem.id,
    );
    expect(saleInventory.length).toBe(2);
  });

  it('does not create inventory for draft purchase orders', async () => {
    const { sdk, user } = await createClient();

    // Create a workspace
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'Draft PO Test Workspace',
    });
    if (!createWorkspace) throw new Error('Workspace was not created');

    // Create a purchase order
    const purchaseOrderInput = {
      workspace_id: createWorkspace.id,
      seller_id: user.id,
      purchase_order_number: 'PO-INV-TEST-002',
    };

    const { createPurchaseOrder } =
      await sdk.CreatePurchaseOrderForInventoryTest({
        input: purchaseOrderInput,
      });

    if (!createPurchaseOrder) throw new Error('Purchase order was not created');
    expect(createPurchaseOrder.status).toBe('DRAFT');

    // Add a line item
    const lineItemInput = {
      purchase_order_id: createPurchaseOrder.id,
      po_pim_id: 'test-pim-category-2',
      po_quantity: 1,
    };

    await sdk.CreateRentalPOLineItemForInventoryTest({
      input: lineItemInput,
    });

    // Check that no inventory exists for this draft PO
    const { listInventory } = await sdk.ListInventoryForTest({
      query: {
        filter: {
          purchaseOrderId: createPurchaseOrder.id,
        },
        page: {
          size: 10,
          number: 1,
        },
      },
    });

    if (!listInventory) throw new Error('Could not list inventory');

    // Should have no inventory items since PO is still in DRAFT
    expect(listInventory.items.length).toBe(0);
  });

  it('handles purchase orders with no line items', async () => {
    const { sdk, user } = await createClient();

    // Create a workspace
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'No Line Items Test Workspace',
    });
    if (!createWorkspace) throw new Error('Workspace was not created');

    // Create a purchase order without line items
    const purchaseOrderInput = {
      workspace_id: createWorkspace.id,
      seller_id: user.id,
      purchase_order_number: 'PO-INV-TEST-003',
    };

    const { createPurchaseOrder } =
      await sdk.CreatePurchaseOrderForInventoryTest({
        input: purchaseOrderInput,
      });

    if (!createPurchaseOrder) throw new Error('Purchase order was not created');

    // Submit the purchase order - should succeed but create no inventory
    const { submitPurchaseOrder } =
      await sdk.SubmitPurchaseOrderForInventoryTest({
        id: createPurchaseOrder.id,
      });

    if (!submitPurchaseOrder) {
      throw new Error('Purchase order was not submitted');
    }
    expect(submitPurchaseOrder.status).toBe('SUBMITTED');

    // Check that no inventory was created
    const { listInventory } = await sdk.ListInventoryForTest({
      query: {
        filter: {
          purchaseOrderId: createPurchaseOrder.id,
        },
        page: {
          size: 10,
          number: 1,
        },
      },
    });

    if (!listInventory) throw new Error('Could not list inventory');

    // Should have no inventory items since there were no line items
    expect(listInventory.items.length).toBe(0);
  });

  it('creates inventory with workspace ID from purchase order', async () => {
    const { sdk, user } = await createClient();

    // Create a workspace
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'Workspace ID Test',
    });
    if (!createWorkspace) throw new Error('Workspace was not created');

    // Create a purchase order with workspace ID
    const purchaseOrderInput = {
      workspace_id: createWorkspace.id,
      seller_id: user.id,
      purchase_order_number: 'PO-WORKSPACE-TEST-001',
    };

    const { createPurchaseOrder } =
      await sdk.CreatePurchaseOrderForInventoryTest({
        input: purchaseOrderInput,
      });

    if (!createPurchaseOrder) throw new Error('Purchase order was not created');

    // Add a line item
    const lineItemInput = {
      purchase_order_id: createPurchaseOrder.id,
      po_pim_id: 'test-pim-product-workspace',
      po_quantity: 3,
    };

    const { createSalePurchaseOrderLineItem } =
      await sdk.CreateSalePOLineItemForInventoryTest({
        input: lineItemInput,
      });

    if (!createSalePurchaseOrderLineItem) {
      throw new Error('Line item was not created');
    }

    // Submit the purchase order - this should create inventory with workspace ID
    const { submitPurchaseOrder } =
      await sdk.SubmitPurchaseOrderForInventoryTest({
        id: createPurchaseOrder.id,
      });

    if (!submitPurchaseOrder) {
      throw new Error('Purchase order was not submitted');
    }
    expect(submitPurchaseOrder.status).toBe('SUBMITTED');

    // Check that inventory was created with the workspace ID
    const { listInventory } = await sdk.ListInventoryForTest({
      query: {
        filter: {
          purchaseOrderId: createPurchaseOrder.id,
        },
        page: {
          size: 10,
          number: 1,
        },
      },
    });

    if (!listInventory) throw new Error('Could not list inventory');

    // Should have 3 inventory items
    expect(listInventory.items.length).toBe(3);

    // All inventory should have the workspace ID from the purchase order
    listInventory.items.forEach((item) => {
      expect(item.workspaceId).toBe(createWorkspace.id);
      expect(item.purchaseOrderId).toBe(createPurchaseOrder.id);
      expect(item.status).toBe('ON_ORDER');
    });

    // Also verify we can filter inventory by workspace ID
    const { listInventory: filteredByWorkspace } =
      await sdk.ListInventoryForTest({
        query: {
          filter: {
            workspaceId: createWorkspace.id,
            purchaseOrderId: createPurchaseOrder.id,
          },
          page: {
            size: 10,
            number: 1,
          },
        },
      });

    if (!filteredByWorkspace) {
      throw new Error('Could not list inventory by workspace');
    }
    expect(filteredByWorkspace.items.length).toBe(3);
  });

  it('creates correct quantity of inventory based on line item po_quantity', async () => {
    const { sdk, user } = await createClient();

    // Create a workspace
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'Quantity Test Workspace',
    });
    if (!createWorkspace) throw new Error('Workspace was not created');

    // Create a purchase order
    const purchaseOrderInput = {
      workspace_id: createWorkspace.id,
      seller_id: user.id,
      purchase_order_number: 'PO-INV-TEST-004',
    };

    const { createPurchaseOrder } =
      await sdk.CreatePurchaseOrderForInventoryTest({
        input: purchaseOrderInput,
      });

    if (!createPurchaseOrder) throw new Error('Purchase order was not created');

    // Add 10 rental line items (each with quantity 1)
    const lineItems = [];
    for (let i = 0; i < 10; i++) {
      const lineItemInput = {
        purchase_order_id: createPurchaseOrder.id,
        po_pim_id: 'test-pim-category-3',
        po_quantity: 1,
      };

      const { createRentalPurchaseOrderLineItem } =
        await sdk.CreateRentalPOLineItemForInventoryTest({
          input: lineItemInput,
        });

      if (!createRentalPurchaseOrderLineItem) {
        throw new Error(`Line item ${i + 1} was not created`);
      }
      lineItems.push(createRentalPurchaseOrderLineItem);
    }

    // Submit the purchase order
    await sdk.SubmitPurchaseOrderForInventoryTest({
      id: createPurchaseOrder.id,
    });

    // Check that exactly 10 inventory items were created
    const { listInventory } = await sdk.ListInventoryForTest({
      query: {
        filter: {
          purchaseOrderId: createPurchaseOrder.id,
        },
        page: {
          size: 20,
          number: 1,
        },
      },
    });

    if (!listInventory) throw new Error('Could not list inventory');

    expect(listInventory.items.length).toBe(10);

    // Each rental line item should have exactly 1 inventory item
    const lineItemIds = lineItems.map((item) => item.id);
    lineItemIds.forEach((lineItemId) => {
      const inventoryForLineItem = listInventory.items.filter(
        (item) =>
          item.purchaseOrderLineItemId &&
          item.purchaseOrderLineItemId === lineItemId,
      );
      expect(inventoryForLineItem.length).toBe(1);
    });
  });
});
