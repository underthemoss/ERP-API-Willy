import { WorkspaceAccessType } from './generated/graphql';
import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';

/* GraphQL operations for codegen */
gql`
  mutation CreatePurchaseOrderForFulfilmentTest($input: PurchaseOrderInput) {
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
  mutation CreateRentalPOLineItemForFulfilmentTest(
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
  mutation CreateSalesOrderForFulfilmentTest($input: SalesOrderInput) {
    createSalesOrder(input: $input) {
      id
      purchase_order_number
      buyer_id
      company_id
      status
    }
  }
`;

gql`
  mutation CreateRentalSOLineItemForFulfilmentTest(
    $input: CreateRentalSalesOrderLineItemInput!
  ) {
    createRentalSalesOrderLineItem(input: $input) {
      id
      sales_order_id
      so_pim_id
      so_quantity
      lineitem_type
    }
  }
`;

gql`
  mutation CreateRentalPriceForFulfilmentTest($input: CreateRentalPriceInput!) {
    createRentalPrice(input: $input) {
      id
      name
      priceType
    }
  }
`;

gql`
  mutation CreatePimCategoryForTest($input: UpsertPimCategoryInput!) {
    upsertPimCategory(input: $input) {
      id
      name
      path
    }
  }
`;

gql`
  mutation CreateRentalFulfilmentForTest($input: CreateRentalFulfilmentInput!) {
    createRentalFulfilment(input: $input) {
      ... on RentalFulfilment {
        id
        salesOrderId
        salesOrderLineItemId
        inventoryId
        purchaseOrderLineItemId
      }
    }
  }
`;

gql`
  mutation SetFulfilmentPurchaseOrderLineItemForTest(
    $fulfilmentId: ID!
    $purchaseOrderLineItemId: ID
  ) {
    setFulfilmentPurchaseOrderLineItemId(
      fulfilmentId: $fulfilmentId
      purchaseOrderLineItemId: $purchaseOrderLineItemId
    ) {
      id
      purchaseOrderLineItemId
      ... on RentalFulfilment {
        inventoryId
      }
    }
  }
`;

gql`
  mutation SubmitPurchaseOrderForFulfilmentTest($id: ID!) {
    submitPurchaseOrder(id: $id) {
      id
      status
    }
  }
`;

gql`
  query ListRentalFulfilmentsForTest($filter: ListRentalFulfilmentsFilter!) {
    listRentalFulfilments(filter: $filter) {
      items {
        id
        salesOrderId
        salesOrderLineItemId
        inventoryId
        purchaseOrderLineItemId
      }
    }
  }
`;

gql`
  query ListInventoryForFulfilmentTest($query: ListInventoryQuery) {
    listInventory(query: $query) {
      items {
        id
        status
        purchaseOrderId
        purchaseOrderLineItemId
        isThirdPartyRental
      }
    }
  }
`;

const { createClient } = createTestEnvironment();

describe('Purchase Order Fulfilment Inventory Assignment', () => {
  it('automatically assigns inventory to unassigned fulfilments when PO is submitted', async () => {
    const { sdk, user } = await createClient();

    // 1. Create a workspace
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'PO Fulfilment Test Workspace',
    });
    if (!createWorkspace) throw new Error('Workspace was not created');

    // 2. Create a PIM category
    const { upsertPimCategory } = await sdk.CreatePimCategoryForTest({
      input: {
        id: 'test-category-1',
        name: 'Test Category 1',
        description: 'Test category for PO-fulfilment tests',
        path: 'Equipment|Test',
        platform_id: 'test-1',
        has_products: false,
      },
    });
    if (!upsertPimCategory) throw new Error('PIM category was not created');

    // 3. Create a price for the rental items
    const { createRentalPrice } = await sdk.CreateRentalPriceForFulfilmentTest({
      input: {
        name: 'Test Rental Price',
        workspaceId: createWorkspace.id,
        pimCategoryId: 'test-category-1',
        pricePerDayInCents: 1000,
        pricePerWeekInCents: 6000,
        pricePerMonthInCents: 20000,
      },
    });
    if (!createRentalPrice) throw new Error('Price was not created');

    // 4. Create a purchase order with 3 items
    const purchaseOrderInput = {
      workspace_id: createWorkspace.id,
      seller_id: user.id,
      purchase_order_number: 'PO-FULFIL-TEST-001',
    };

    const { createPurchaseOrder } =
      await sdk.CreatePurchaseOrderForFulfilmentTest({
        input: purchaseOrderInput,
      });

    if (!createPurchaseOrder) throw new Error('Purchase order was not created');
    expect(createPurchaseOrder.status).toBe('DRAFT');

    // 5. Add 3 rental line items (each with quantity 1)
    const lineItem1Input = {
      purchase_order_id: createPurchaseOrder.id,
      po_pim_id: 'test-category-1',
      po_quantity: 1,
    };

    const { createRentalPurchaseOrderLineItem: lineItem1 } =
      await sdk.CreateRentalPOLineItemForFulfilmentTest({
        input: lineItem1Input,
      });

    if (!lineItem1) throw new Error('Rental PO line item 1 was not created');
    expect(lineItem1.po_quantity).toBe(1);

    const lineItem2Input = {
      purchase_order_id: createPurchaseOrder.id,
      po_pim_id: 'test-category-1',
      po_quantity: 1,
    };

    const { createRentalPurchaseOrderLineItem: lineItem2 } =
      await sdk.CreateRentalPOLineItemForFulfilmentTest({
        input: lineItem2Input,
      });

    if (!lineItem2) throw new Error('Rental PO line item 2 was not created');
    expect(lineItem2.po_quantity).toBe(1);

    const lineItem3Input = {
      purchase_order_id: createPurchaseOrder.id,
      po_pim_id: 'test-category-1',
      po_quantity: 1,
    };

    const { createRentalPurchaseOrderLineItem: lineItem3 } =
      await sdk.CreateRentalPOLineItemForFulfilmentTest({
        input: lineItem3Input,
      });

    if (!lineItem3) throw new Error('Rental PO line item 3 was not created');
    expect(lineItem3.po_quantity).toBe(1);

    // 6. Create a sales order
    const salesOrderInput = {
      workspace_id: createWorkspace.id,
      buyer_id: user.id,
      purchase_order_number: 'SO-FULFIL-TEST-001',
    };

    const { createSalesOrder } = await sdk.CreateSalesOrderForFulfilmentTest({
      input: salesOrderInput,
    });

    if (!createSalesOrder) throw new Error('Sales order was not created');

    // 7. Create a sales order line item linked to the price
    const soLineItemInput = {
      sales_order_id: createSalesOrder.id,
      so_pim_id: 'test-category-1',
      so_quantity: 1,
      price_id: createRentalPrice.id,
    };

    const { createRentalSalesOrderLineItem } =
      await sdk.CreateRentalSOLineItemForFulfilmentTest({
        input: soLineItemInput,
      });

    if (!createRentalSalesOrderLineItem) {
      throw new Error('Sales order line item was not created');
    }

    // 8. Create 2 rental fulfilments from the sales order line item (less than PO quantity)
    const fulfilmentInput = {
      salesOrderId: createSalesOrder.id,
      salesOrderLineItemId: createRentalSalesOrderLineItem.id,
      pricePerDayInCents: 1000,
      pricePerWeekInCents: 6000,
      pricePerMonthInCents: 20000,
    };

    const { createRentalFulfilment: fulfilment1 } =
      await sdk.CreateRentalFulfilmentForTest({
        input: fulfilmentInput,
      });
    if (!fulfilment1) throw new Error('First fulfilment was not created');
    expect(fulfilment1.inventoryId).toBeNull();

    const { createRentalFulfilment: fulfilment2 } =
      await sdk.CreateRentalFulfilmentForTest({
        input: fulfilmentInput,
      });
    if (!fulfilment2) throw new Error('Second fulfilment was not created');
    expect(fulfilment2.inventoryId).toBeNull();

    // 9. Link fulfilments to PO line items (fulfilment1 to lineItem1, fulfilment2 to lineItem2)
    const { setFulfilmentPurchaseOrderLineItemId: linkedFulfilment1 } =
      await sdk.SetFulfilmentPurchaseOrderLineItemForTest({
        fulfilmentId: fulfilment1.id,
        purchaseOrderLineItemId: lineItem1.id,
      });
    if (!linkedFulfilment1) throw new Error('Fulfilment 1 was not linked');
    expect(linkedFulfilment1.purchaseOrderLineItemId).toBe(lineItem1.id);

    const { setFulfilmentPurchaseOrderLineItemId: linkedFulfilment2 } =
      await sdk.SetFulfilmentPurchaseOrderLineItemForTest({
        fulfilmentId: fulfilment2.id,
        purchaseOrderLineItemId: lineItem2.id,
      });
    if (!linkedFulfilment2) throw new Error('Fulfilment 2 was not linked');
    expect(linkedFulfilment2.purchaseOrderLineItemId).toBe(lineItem2.id);

    // 10. Submit the purchase order - should create 3 inventory items and assign 2 to fulfilments
    const { submitPurchaseOrder } =
      await sdk.SubmitPurchaseOrderForFulfilmentTest({
        id: createPurchaseOrder.id,
      });

    if (!submitPurchaseOrder) {
      throw new Error('Purchase order was not submitted');
    }
    expect(submitPurchaseOrder.status).toBe('SUBMITTED');

    // 11. Verify inventory was created
    const { listInventory } = await sdk.ListInventoryForFulfilmentTest({
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

    // All should be ON_ORDER status and linked to one of the PO line items
    listInventory.items.forEach((item) => {
      expect(item.status).toBe('ON_ORDER');
      expect(item.purchaseOrderId).toBe(createPurchaseOrder.id);
      expect([lineItem1.id, lineItem2.id, lineItem3.id]).toContain(
        item.purchaseOrderLineItemId,
      );
      expect(item.isThirdPartyRental).toBe(false);
    });

    // 12. Verify fulfilments now have inventory assigned
    const { listRentalFulfilments } = await sdk.ListRentalFulfilmentsForTest({
      filter: {
        workspaceId: createWorkspace.id,
      },
    });

    if (!listRentalFulfilments) throw new Error('Could not list fulfilments');

    // Should have 2 fulfilments
    expect(listRentalFulfilments.items.length).toBe(2);

    // Both fulfilments should now have inventory assigned
    const assignedFulfilments = listRentalFulfilments.items.filter(
      (f) => f.inventoryId !== null,
    );
    expect(assignedFulfilments.length).toBe(2);

    // Each should be assigned a unique inventory item
    const inventoryIds = assignedFulfilments.map((f) => f.inventoryId);
    expect(new Set(inventoryIds).size).toBe(2); // All unique

    // Verify the assigned inventory IDs are from the created inventory
    const createdInventoryIds = listInventory.items.map((i) => i.id);
    inventoryIds.forEach((id) => {
      expect(createdInventoryIds).toContain(id);
    });
  });

  it('does not assign inventory to fulfilments without purchaseOrderLineItemId link', async () => {
    const { sdk, user } = await createClient();

    // Create a workspace
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'PO Unlinked Fulfilment Test',
    });
    if (!createWorkspace) throw new Error('Workspace was not created');

    // Create a PIM category
    const { upsertPimCategory } = await sdk.CreatePimCategoryForTest({
      input: {
        id: 'test-category-2',
        name: 'Test Category 2',
        description: 'Test category for unlinked fulfilment tests',
        path: 'Equipment|Test',
        platform_id: 'test-2',
        has_products: false,
      },
    });
    if (!upsertPimCategory) throw new Error('PIM category was not created');

    // Create a price
    const { createRentalPrice } = await sdk.CreateRentalPriceForFulfilmentTest({
      input: {
        name: 'Test Rental Price',
        workspaceId: createWorkspace.id,
        pimCategoryId: 'test-category-2',
        pricePerDayInCents: 1000,
        pricePerWeekInCents: 6000,
        pricePerMonthInCents: 20000,
      },
    });
    if (!createRentalPrice) throw new Error('Price was not created');

    // Create a purchase order with 2 items
    const purchaseOrderInput = {
      workspace_id: createWorkspace.id,
      seller_id: user.id,
      purchase_order_number: 'PO-UNLINKED-TEST',
    };

    const { createPurchaseOrder } =
      await sdk.CreatePurchaseOrderForFulfilmentTest({
        input: purchaseOrderInput,
      });

    if (!createPurchaseOrder) throw new Error('Purchase order was not created');

    // Add 2 rental line items (each with quantity 1)
    const lineItem1Input = {
      purchase_order_id: createPurchaseOrder.id,
      po_pim_id: 'test-category-2',
      po_quantity: 1,
    };

    const { createRentalPurchaseOrderLineItem: lineItem1 } =
      await sdk.CreateRentalPOLineItemForFulfilmentTest({
        input: lineItem1Input,
      });

    if (!lineItem1) throw new Error('Rental PO line item 1 was not created');

    const lineItem2Input = {
      purchase_order_id: createPurchaseOrder.id,
      po_pim_id: 'test-category-2',
      po_quantity: 1,
    };

    const { createRentalPurchaseOrderLineItem: lineItem2 } =
      await sdk.CreateRentalPOLineItemForFulfilmentTest({
        input: lineItem2Input,
      });

    if (!lineItem2) throw new Error('Rental PO line item 2 was not created');

    // Create a sales order
    const salesOrderInput = {
      workspace_id: createWorkspace.id,
      buyer_id: user.id,
      purchase_order_number: 'SO-UNLINKED-TEST',
    };

    const { createSalesOrder } = await sdk.CreateSalesOrderForFulfilmentTest({
      input: salesOrderInput,
    });

    if (!createSalesOrder) throw new Error('Sales order was not created');

    // Create a sales order line item
    const soLineItemInput = {
      sales_order_id: createSalesOrder.id,
      so_pim_id: 'test-category-2',
      so_quantity: 1,
      price_id: createRentalPrice.id,
    };

    const { createRentalSalesOrderLineItem } =
      await sdk.CreateRentalSOLineItemForFulfilmentTest({
        input: soLineItemInput,
      });

    if (!createRentalSalesOrderLineItem) {
      throw new Error('Sales order line item was not created');
    }

    // Create a fulfilment but DON'T link it to the PO line item
    const fulfilmentInput = {
      salesOrderId: createSalesOrder.id,
      salesOrderLineItemId: createRentalSalesOrderLineItem.id,
      pricePerDayInCents: 1000,
      pricePerWeekInCents: 6000,
      pricePerMonthInCents: 20000,
    };

    const { createRentalFulfilment: unlinkedFulfilment } =
      await sdk.CreateRentalFulfilmentForTest({
        input: fulfilmentInput,
      });
    if (!unlinkedFulfilment) throw new Error('Fulfilment was not created');
    expect(unlinkedFulfilment.inventoryId).toBeNull();
    expect(unlinkedFulfilment.purchaseOrderLineItemId).toBeNull();

    // Submit the purchase order
    const { submitPurchaseOrder } =
      await sdk.SubmitPurchaseOrderForFulfilmentTest({
        id: createPurchaseOrder.id,
      });

    if (!submitPurchaseOrder) {
      throw new Error('Purchase order was not submitted');
    }

    // Verify inventory was created
    const { listInventory } = await sdk.ListInventoryForFulfilmentTest({
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
    expect(listInventory.items.length).toBe(2);

    // Verify the unlinked fulfilment still has no inventory assigned
    const { listRentalFulfilments } = await sdk.ListRentalFulfilmentsForTest({
      filter: {
        workspaceId: createWorkspace.id,
      },
    });

    if (!listRentalFulfilments) throw new Error('Could not list fulfilments');

    const unlinkedCheck = listRentalFulfilments.items.find(
      (f) => f.id === unlinkedFulfilment.id,
    );
    expect(unlinkedCheck).toBeDefined();
    expect(unlinkedCheck?.inventoryId).toBeNull();
    expect(unlinkedCheck?.purchaseOrderLineItemId).toBeNull();
  });

  it('assigns inventory in order of fulfilment creation when multiple fulfilments need assignment', async () => {
    const { sdk, user } = await createClient();

    // Create a workspace
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'PO Ordering Test',
    });
    if (!createWorkspace) throw new Error('Workspace was not created');

    // Create a PIM category
    const { upsertPimCategory } = await sdk.CreatePimCategoryForTest({
      input: {
        id: 'test-category-3',
        name: 'Test Category 3',
        description: 'Test category for ordering tests',
        path: 'Equipment|Test',
        platform_id: 'test-3',
        has_products: false,
      },
    });
    if (!upsertPimCategory) throw new Error('PIM category was not created');

    // Create a price
    const { createRentalPrice } = await sdk.CreateRentalPriceForFulfilmentTest({
      input: {
        name: 'Test Rental Price',
        workspaceId: createWorkspace.id,
        pimCategoryId: 'test-category-3',
        pricePerDayInCents: 1000,
        pricePerWeekInCents: 6000,
        pricePerMonthInCents: 20000,
      },
    });
    if (!createRentalPrice) throw new Error('Price was not created');

    // Create a purchase order with 2 items
    const purchaseOrderInput = {
      workspace_id: createWorkspace.id,
      seller_id: user.id,
      purchase_order_number: 'PO-ORDER-TEST',
    };

    const { createPurchaseOrder } =
      await sdk.CreatePurchaseOrderForFulfilmentTest({
        input: purchaseOrderInput,
      });

    if (!createPurchaseOrder) throw new Error('Purchase order was not created');

    // Add 2 rental line items (each with quantity 1)
    const lineItem1Input = {
      purchase_order_id: createPurchaseOrder.id,
      po_pim_id: 'test-category-3',
      po_quantity: 1,
    };

    const { createRentalPurchaseOrderLineItem: lineItem1 } =
      await sdk.CreateRentalPOLineItemForFulfilmentTest({
        input: lineItem1Input,
      });

    if (!lineItem1) throw new Error('Rental PO line item 1 was not created');

    const lineItem2Input = {
      purchase_order_id: createPurchaseOrder.id,
      po_pim_id: 'test-category-3',
      po_quantity: 1,
    };

    const { createRentalPurchaseOrderLineItem: lineItem2 } =
      await sdk.CreateRentalPOLineItemForFulfilmentTest({
        input: lineItem2Input,
      });

    if (!lineItem2) throw new Error('Rental PO line item 2 was not created');

    // Create a sales order
    const salesOrderInput = {
      workspace_id: createWorkspace.id,
      buyer_id: user.id,
      purchase_order_number: 'SO-ORDER-TEST',
    };

    const { createSalesOrder } = await sdk.CreateSalesOrderForFulfilmentTest({
      input: salesOrderInput,
    });

    if (!createSalesOrder) throw new Error('Sales order was not created');

    // Create a sales order line item
    const soLineItemInput = {
      sales_order_id: createSalesOrder.id,
      so_pim_id: 'test-category-3',
      so_quantity: 1,
      price_id: createRentalPrice.id,
    };

    const { createRentalSalesOrderLineItem } =
      await sdk.CreateRentalSOLineItemForFulfilmentTest({
        input: soLineItemInput,
      });

    if (!createRentalSalesOrderLineItem) {
      throw new Error('Sales order line item was not created');
    }

    // Create 3 fulfilments (more than PO quantity of 2)
    const fulfilmentInput = {
      salesOrderId: createSalesOrder.id,
      salesOrderLineItemId: createRentalSalesOrderLineItem.id,
      pricePerDayInCents: 1000,
      pricePerWeekInCents: 6000,
      pricePerMonthInCents: 20000,
    };

    const { createRentalFulfilment: fulfilment1 } =
      await sdk.CreateRentalFulfilmentForTest({
        input: fulfilmentInput,
      });
    if (!fulfilment1) throw new Error('First fulfilment was not created');

    // Small delay to ensure different creation times
    await new Promise((resolve) => setTimeout(resolve, 10));

    const { createRentalFulfilment: fulfilment2 } =
      await sdk.CreateRentalFulfilmentForTest({
        input: fulfilmentInput,
      });
    if (!fulfilment2) throw new Error('Second fulfilment was not created');

    await new Promise((resolve) => setTimeout(resolve, 10));

    const { createRentalFulfilment: fulfilment3 } =
      await sdk.CreateRentalFulfilmentForTest({
        input: fulfilmentInput,
      });
    if (!fulfilment3) throw new Error('Third fulfilment was not created');

    // Link fulfilments to PO line items (fulfilment1 to lineItem1, fulfilment2 to lineItem2, fulfilment3 to lineItem1)
    await sdk.SetFulfilmentPurchaseOrderLineItemForTest({
      fulfilmentId: fulfilment1.id,
      purchaseOrderLineItemId: lineItem1.id,
    });
    await sdk.SetFulfilmentPurchaseOrderLineItemForTest({
      fulfilmentId: fulfilment2.id,
      purchaseOrderLineItemId: lineItem2.id,
    });
    await sdk.SetFulfilmentPurchaseOrderLineItemForTest({
      fulfilmentId: fulfilment3.id,
      purchaseOrderLineItemId: lineItem1.id,
    });

    // Submit the purchase order - should create 2 inventory items and assign to first 2 fulfilments
    const { submitPurchaseOrder } =
      await sdk.SubmitPurchaseOrderForFulfilmentTest({
        id: createPurchaseOrder.id,
      });

    if (!submitPurchaseOrder) {
      throw new Error('Purchase order was not submitted');
    }

    // Verify fulfilment assignments
    const { listRentalFulfilments } = await sdk.ListRentalFulfilmentsForTest({
      filter: {
        workspaceId: createWorkspace.id,
      },
    });

    if (!listRentalFulfilments) throw new Error('Could not list fulfilments');

    expect(listRentalFulfilments.items.length).toBe(3);

    // First 2 fulfilments (by creation date) should have inventory assigned
    const fulfilmentsWithInventory = listRentalFulfilments.items.filter(
      (f) => f.inventoryId !== null,
    );
    expect(fulfilmentsWithInventory.length).toBe(2);

    // The third fulfilment should not have inventory assigned
    const fulfilmentWithoutInventory = listRentalFulfilments.items.find(
      (f) => f.inventoryId === null,
    );
    expect(fulfilmentWithoutInventory).toBeDefined();
  });
});
