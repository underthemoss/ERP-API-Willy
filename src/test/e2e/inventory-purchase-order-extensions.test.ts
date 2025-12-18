import { createTestEnvironment } from './test-environment';
import { InventoryStatus, WorkspaceAccessType } from './generated/graphql';
import { gql } from 'graphql-request';
import invariant from 'tiny-invariant';

const { createClient } = createTestEnvironment();

describe('Inventory Purchase Order Extensions', () => {
  it('should resolve inventory items for purchase order line items', async () => {
    const { sdk } = await createClient();

    // Create a workspace
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'Inventory Extensions Test Workspace',
    });
    if (!createWorkspace) throw new Error('Workspace was not created');

    // Create a purchase order
    gql`
      mutation CreatePOForLineItemInventory($input: PurchaseOrderInput) {
        createPurchaseOrder(input: $input) {
          id
          purchase_order_number
        }
      }
    `;

    const poResponse = await sdk.CreatePurchaseOrder({
      input: {
        workspace_id: createWorkspace.id,
        seller_id: 'SELLER-003',
        purchase_order_number: `PO-INV-TEST-${Date.now()}`,
      },
    });

    const purchaseOrderId = poResponse?.createPurchaseOrder?.id;

    invariant(purchaseOrderId, 'Purchase order ID is required');

    // Create a sale line item
    gql`
      mutation CreateSaleLineItemForInventory(
        $input: CreateSalePurchaseOrderLineItemInput
      ) {
        createSalePurchaseOrderLineItem(input: $input) {
          id
          purchase_order_id
          lineitem_type
        }
      }
    `;

    const lineItemResponse = await sdk.CreateSaleLineItemForInventory({
      input: {
        purchase_order_id: purchaseOrderId,
        po_quantity: 3,
        po_pim_id: 'PIM-PROD-002',
      },
    });

    invariant(
      lineItemResponse.createSalePurchaseOrderLineItem,
      'Line item creation failed',
    );

    const lineItemId = lineItemResponse.createSalePurchaseOrderLineItem.id;

    // Create multiple inventory items for this line item
    const inventoryIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const { createInventory } = await sdk.CreateInventory({
        input: {
          status: i === 0 ? InventoryStatus.Received : InventoryStatus.OnOrder,
          isThirdPartyRental: false,
          purchaseOrderId,
          purchaseOrderLineItemId: lineItemId,
          pimProductId: 'PIM-PROD-002',
        },
      });
      invariant(createInventory, 'Inventory creation failed');
      inventoryIds.push(createInventory.id);
    }

    // Query the line item with its inventory
    gql`
      query GetLineItemWithInventory($id: String!) {
        getPurchaseOrderLineItemById(id: $id) {
          __typename
          ... on SalePurchaseOrderLineItem {
            id
            inventory {
              id
              status
              purchaseOrderLineItemId
            }
          }
        }
      }
    `;

    const response = await sdk.GetLineItemWithInventory({ id: lineItemId });

    invariant(
      response.getPurchaseOrderLineItemById?.__typename ===
        'SalePurchaseOrderLineItem',
      'Line item not found',
    );
    expect(response.getPurchaseOrderLineItemById?.inventory).toHaveLength(3);

    // Verify all inventory items are returned
    const returnedIds = response.getPurchaseOrderLineItemById.inventory.map(
      (inv: any) => inv.id,
    );
    expect(returnedIds.sort()).toEqual(inventoryIds.sort());

    // Verify inventory items have correct line item ID
    response.getPurchaseOrderLineItemById.inventory.forEach((inv: any) => {
      expect(inv.purchaseOrderLineItemId).toBe(lineItemId);
    });
  });

  it('should calculate fulfillment progress for purchase orders', async () => {
    const { sdk } = await createClient();

    // Create a workspace
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'Fulfillment Progress Test Workspace',
    });
    if (!createWorkspace) throw new Error('Workspace was not created');

    // Create a purchase order
    gql`
      mutation CreatePOForFulfillment($input: PurchaseOrderInput) {
        createPurchaseOrder(input: $input) {
          id
          purchase_order_number
        }
      }
    `;

    const poResponse = await sdk.CreatePOForFulfillment({
      input: {
        workspace_id: createWorkspace.id,
        seller_id: 'SELLER-004',
        purchase_order_number: `PO-FULFILL-TEST-${Date.now()}`,
      },
    });

    invariant(poResponse.createPurchaseOrder, 'Purchase order creation failed');

    const purchaseOrderId = poResponse.createPurchaseOrder.id;

    // Create inventory items with different statuses
    const inventoryItems = [
      { status: InventoryStatus.Received },
      { status: InventoryStatus.Received },
      { status: InventoryStatus.OnOrder },
      { status: InventoryStatus.OnOrder },
      { status: InventoryStatus.OnOrder },
    ];

    for (const item of inventoryItems) {
      await sdk.CreateInventory({
        input: {
          status: item.status,
          isThirdPartyRental: false,
          purchaseOrderId,
          pimCategoryId: 'CAT-TEST',
        },
      });
    }

    // Query the purchase order with fulfillment progress
    gql`
      query GetPOWithFulfillmentProgress($id: String!) {
        getPurchaseOrderById(id: $id) {
          id
          inventory {
            id
            status
          }
          fulfillmentProgress {
            totalItems
            receivedItems
            onOrderItems
            fulfillmentPercentage
            isFullyFulfilled
            isPartiallyFulfilled
            status
          }
        }
      }
    `;

    const response = await sdk.GetPOWithFulfillmentProgress({
      id: purchaseOrderId,
    });

    expect(response.getPurchaseOrderById).toBeDefined();
    invariant(response.getPurchaseOrderById, 'Purchase order not found');
    expect(response.getPurchaseOrderById.inventory).toHaveLength(5);

    const progress = response.getPurchaseOrderById.fulfillmentProgress;
    invariant(progress, 'Fulfillment progress not found');
    expect(progress.totalItems).toBe(5);
    expect(progress.receivedItems).toBe(2);
    expect(progress.onOrderItems).toBe(3);
    expect(progress.fulfillmentPercentage).toBe(40); // 2/5 * 100
    expect(progress.isFullyFulfilled).toBe(false);
    expect(progress.isPartiallyFulfilled).toBe(true);
    expect(progress.status).toBe('PARTIALLY_FULFILLED');
  });

  it('should show fully fulfilled status when all items are received', async () => {
    const { sdk } = await createClient();

    // Create a workspace
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'Fully Fulfilled Test Workspace',
    });
    if (!createWorkspace) throw new Error('Workspace was not created');

    // Create a purchase order
    gql`
      mutation CreatePOFullyFulfilled($input: PurchaseOrderInput) {
        createPurchaseOrder(input: $input) {
          id
        }
      }
    `;

    const poResponse = await sdk.CreatePOFullyFulfilled({
      input: {
        workspace_id: createWorkspace.id,
        seller_id: 'SELLER-005',
        purchase_order_number: `PO-FULL-TEST-${Date.now()}`,
      },
    });

    invariant(poResponse.createPurchaseOrder, 'Purchase order creation failed');
    const purchaseOrderId = poResponse.createPurchaseOrder.id;

    // Create all inventory items as received
    for (let i = 0; i < 3; i++) {
      await sdk.CreateInventory({
        input: {
          status: InventoryStatus.Received,
          isThirdPartyRental: false,
          purchaseOrderId,
        },
      });
    }

    // Query fulfillment progress
    gql`
      query GetFullyFulfilledPO($id: String!) {
        getPurchaseOrderById(id: $id) {
          id
          fulfillmentProgress {
            totalItems
            receivedItems
            onOrderItems
            fulfillmentPercentage
            isFullyFulfilled
            isPartiallyFulfilled
            status
          }
        }
      }
    `;

    const response = await sdk.GetFullyFulfilledPO({
      id: purchaseOrderId,
    });

    const progress = response?.getPurchaseOrderById?.fulfillmentProgress;
    invariant(progress, 'Fulfillment progress not found');
    expect(progress.totalItems).toBe(3);
    expect(progress.receivedItems).toBe(3);
    expect(progress.onOrderItems).toBe(0);
    expect(progress.fulfillmentPercentage).toBe(100);
    expect(progress.isFullyFulfilled).toBe(true);
    expect(progress.isPartiallyFulfilled).toBe(false);
    expect(progress.status).toBe('FULLY_FULFILLED');
  });

  it('should handle purchase orders with no inventory', async () => {
    const { sdk } = await createClient();

    // Create a workspace
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'No Inventory Test Workspace',
    });
    if (!createWorkspace) throw new Error('Workspace was not created');

    // Create a purchase order without any inventory
    gql`
      mutation CreatePONoInventory($input: PurchaseOrderInput) {
        createPurchaseOrder(input: $input) {
          id
        }
      }
    `;

    const poResponse = await sdk.CreatePONoInventory({
      input: {
        workspace_id: createWorkspace.id,
        seller_id: 'SELLER-006',
        purchase_order_number: `PO-EMPTY-TEST-${Date.now()}`,
      },
    });

    invariant(poResponse.createPurchaseOrder, 'Purchase order creation failed');
    const purchaseOrderId = poResponse.createPurchaseOrder.id;

    // Query fulfillment progress
    gql`
      query GetEmptyPO($id: String!) {
        getPurchaseOrderById(id: $id) {
          id
          inventory {
            id
          }
          fulfillmentProgress {
            totalItems
            receivedItems
            onOrderItems
            fulfillmentPercentage
            isFullyFulfilled
            isPartiallyFulfilled
            status
          }
        }
      }
    `;

    const response = await sdk.GetEmptyPO({
      id: purchaseOrderId,
    });

    invariant(response.getPurchaseOrderById, 'Purchase order not found');
    expect(response.getPurchaseOrderById.inventory).toHaveLength(0);

    const progress = response.getPurchaseOrderById.fulfillmentProgress;
    invariant(progress, 'Fulfillment progress not found');
    expect(progress.totalItems).toBe(0);
    expect(progress.receivedItems).toBe(0);
    expect(progress.onOrderItems).toBe(0);
    expect(progress.fulfillmentPercentage).toBe(0);
    expect(progress.isFullyFulfilled).toBe(false);
    expect(progress.isPartiallyFulfilled).toBe(false);
    expect(progress.status).toBe('NOT_STARTED');
  });
});
