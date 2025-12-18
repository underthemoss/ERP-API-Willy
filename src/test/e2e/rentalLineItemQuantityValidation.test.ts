import { WorkspaceAccessType } from './generated/graphql';
import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';

/* GraphQL operations for codegen */
gql`
  mutation CreatePurchaseOrderForQuantityValidation(
    $input: PurchaseOrderInput
  ) {
    createPurchaseOrder(input: $input) {
      id
      purchase_order_number
      status
    }
  }
`;

gql`
  mutation CreateRentalPOLineItemForQuantityValidation(
    $input: CreateRentalPurchaseOrderLineItemInput
  ) {
    createRentalPurchaseOrderLineItem(input: $input) {
      id
      purchase_order_id
      po_quantity
      lineitem_type
    }
  }
`;

gql`
  mutation UpdateRentalPOLineItemForQuantityValidation(
    $input: UpdateRentalPurchaseOrderLineItemInput
  ) {
    updateRentalPurchaseOrderLineItem(input: $input) {
      id
      po_quantity
    }
  }
`;

gql`
  mutation CreateSalesOrderForQuantityValidation($input: SalesOrderInput) {
    createSalesOrder(input: $input) {
      id
      sales_order_number
      status
    }
  }
`;

gql`
  mutation CreateRentalSOLineItemForQuantityValidation(
    $input: CreateRentalSalesOrderLineItemInput
  ) {
    createRentalSalesOrderLineItem(input: $input) {
      id
      sales_order_id
      so_quantity
      lineitem_type
    }
  }
`;

gql`
  mutation UpdateRentalSOLineItemForQuantityValidation(
    $input: UpdateRentalSalesOrderLineItemInput
  ) {
    updateRentalSalesOrderLineItem(input: $input) {
      id
      so_quantity
    }
  }
`;

const { createClient } = createTestEnvironment();

describe('Rental Line Item Quantity Validation', () => {
  describe('Purchase Order Rental Line Items', () => {
    it('accepts rental line items with quantity 1', async () => {
      const { sdk, user } = await createClient();

      const { createWorkspace } = await sdk.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.SameDomain,
        name: 'PO Valid Quantity Test',
      });
      if (!createWorkspace) throw new Error('Workspace was not created');

      const { createPurchaseOrder } =
        await sdk.CreatePurchaseOrderForQuantityValidation({
          input: {
            workspace_id: createWorkspace.id,
            seller_id: user.id,
            purchase_order_number: 'PO-VALID-001',
          },
        });
      if (!createPurchaseOrder) throw new Error('PO was not created');

      // Create rental line item with quantity 1 - should succeed
      const { createRentalPurchaseOrderLineItem } =
        await sdk.CreateRentalPOLineItemForQuantityValidation({
          input: {
            purchase_order_id: createPurchaseOrder.id,
            po_pim_id: 'test-pim-1',
            po_quantity: 1,
          },
        });

      expect(createRentalPurchaseOrderLineItem).toBeDefined();
      expect(createRentalPurchaseOrderLineItem?.po_quantity).toBe(1);
    });

    it('accepts rental line items with no explicit quantity (defaults to 1)', async () => {
      const { sdk, user } = await createClient();

      const { createWorkspace } = await sdk.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.SameDomain,
        name: 'PO Default Quantity Test',
      });
      if (!createWorkspace) throw new Error('Workspace was not created');

      const { createPurchaseOrder } =
        await sdk.CreatePurchaseOrderForQuantityValidation({
          input: {
            workspace_id: createWorkspace.id,
            seller_id: user.id,
            purchase_order_number: 'PO-DEFAULT-001',
          },
        });
      if (!createPurchaseOrder) throw new Error('PO was not created');

      // Create rental line item without explicit quantity - should default to 1
      const { createRentalPurchaseOrderLineItem } =
        await sdk.CreateRentalPOLineItemForQuantityValidation({
          input: {
            purchase_order_id: createPurchaseOrder.id,
            po_pim_id: 'test-pim-2',
          },
        });

      expect(createRentalPurchaseOrderLineItem).toBeDefined();
    });

    it('rejects rental line items with quantity > 1', async () => {
      const { sdk, user } = await createClient();

      const { createWorkspace } = await sdk.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.SameDomain,
        name: 'PO Invalid Quantity Test',
      });
      if (!createWorkspace) throw new Error('Workspace was not created');

      const { createPurchaseOrder } =
        await sdk.CreatePurchaseOrderForQuantityValidation({
          input: {
            workspace_id: createWorkspace.id,
            seller_id: user.id,
            purchase_order_number: 'PO-INVALID-001',
          },
        });
      if (!createPurchaseOrder) throw new Error('PO was not created');

      // Attempt to create rental line item with quantity 2 - should fail
      await expect(
        sdk.CreateRentalPOLineItemForQuantityValidation({
          input: {
            purchase_order_id: createPurchaseOrder.id,
            po_pim_id: 'test-pim-3',
            po_quantity: 2,
          },
        }),
      ).rejects.toThrow(/quantity of exactly 1/i);
    });

    it('rejects rental line items with quantity 0', async () => {
      const { sdk, user } = await createClient();

      const { createWorkspace } = await sdk.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.SameDomain,
        name: 'PO Zero Quantity Test',
      });
      if (!createWorkspace) throw new Error('Workspace was not created');

      const { createPurchaseOrder } =
        await sdk.CreatePurchaseOrderForQuantityValidation({
          input: {
            workspace_id: createWorkspace.id,
            seller_id: user.id,
            purchase_order_number: 'PO-ZERO-001',
          },
        });
      if (!createPurchaseOrder) throw new Error('PO was not created');

      // Attempt to create rental line item with quantity 0 - should fail
      await expect(
        sdk.CreateRentalPOLineItemForQuantityValidation({
          input: {
            purchase_order_id: createPurchaseOrder.id,
            po_pim_id: 'test-pim-4',
            po_quantity: 0,
          },
        }),
      ).rejects.toThrow(/quantity of exactly 1/i);
    });

    it('rejects updating rental line item quantity to non-1 value', async () => {
      const { sdk, user } = await createClient();

      const { createWorkspace } = await sdk.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.SameDomain,
        name: 'PO Update Quantity Test',
      });
      if (!createWorkspace) throw new Error('Workspace was not created');

      const { createPurchaseOrder } =
        await sdk.CreatePurchaseOrderForQuantityValidation({
          input: {
            workspace_id: createWorkspace.id,
            seller_id: user.id,
            purchase_order_number: 'PO-UPDATE-001',
          },
        });
      if (!createPurchaseOrder) throw new Error('PO was not created');

      // Create valid rental line item with quantity 1
      const { createRentalPurchaseOrderLineItem } =
        await sdk.CreateRentalPOLineItemForQuantityValidation({
          input: {
            purchase_order_id: createPurchaseOrder.id,
            po_pim_id: 'test-pim-5',
            po_quantity: 1,
          },
        });
      if (!createRentalPurchaseOrderLineItem) {
        throw new Error('Line item was not created');
      }

      // Attempt to update quantity to 3 - should fail
      await expect(
        sdk.UpdateRentalPOLineItemForQuantityValidation({
          input: {
            id: createRentalPurchaseOrderLineItem.id,
            po_quantity: 3,
          },
        }),
      ).rejects.toThrow(/quantity of exactly 1/i);
    });

    it('allows updating rental line item quantity to 1', async () => {
      const { sdk, user } = await createClient();

      const { createWorkspace } = await sdk.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.SameDomain,
        name: 'PO Update Valid Quantity Test',
      });
      if (!createWorkspace) throw new Error('Workspace was not created');

      const { createPurchaseOrder } =
        await sdk.CreatePurchaseOrderForQuantityValidation({
          input: {
            workspace_id: createWorkspace.id,
            seller_id: user.id,
            purchase_order_number: 'PO-UPDATE-VALID-001',
          },
        });
      if (!createPurchaseOrder) throw new Error('PO was not created');

      // Create rental line item
      const { createRentalPurchaseOrderLineItem } =
        await sdk.CreateRentalPOLineItemForQuantityValidation({
          input: {
            purchase_order_id: createPurchaseOrder.id,
            po_pim_id: 'test-pim-6',
            po_quantity: 1,
          },
        });
      if (!createRentalPurchaseOrderLineItem) {
        throw new Error('Line item was not created');
      }

      // Update quantity to 1 - should succeed
      const { updateRentalPurchaseOrderLineItem } =
        await sdk.UpdateRentalPOLineItemForQuantityValidation({
          input: {
            id: createRentalPurchaseOrderLineItem.id,
            po_quantity: 1,
          },
        });

      expect(updateRentalPurchaseOrderLineItem).toBeDefined();
      expect(updateRentalPurchaseOrderLineItem?.po_quantity).toBe(1);
    });
  });

  describe('Sales Order Rental Line Items', () => {
    it('accepts rental line items with quantity 1', async () => {
      const { sdk, user } = await createClient();

      const { createWorkspace } = await sdk.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.SameDomain,
        name: 'SO Valid Quantity Test',
      });
      if (!createWorkspace) throw new Error('Workspace was not created');

      const { createSalesOrder } =
        await sdk.CreateSalesOrderForQuantityValidation({
          input: {
            workspace_id: createWorkspace.id,
            buyer_id: user.id,
            purchase_order_number: 'CUST-PO-001',
            sales_order_number: 'SO-VALID-001',
          },
        });
      if (!createSalesOrder) throw new Error('SO was not created');

      // Create rental line item with quantity 1 - should succeed
      const { createRentalSalesOrderLineItem } =
        await sdk.CreateRentalSOLineItemForQuantityValidation({
          input: {
            sales_order_id: createSalesOrder.id,
            so_pim_id: 'test-pim-7',
            so_quantity: 1,
          },
        });

      expect(createRentalSalesOrderLineItem).toBeDefined();
      expect(createRentalSalesOrderLineItem?.so_quantity).toBe(1);
    });

    it('accepts rental line items with no explicit quantity (defaults to 1)', async () => {
      const { sdk, user } = await createClient();

      const { createWorkspace } = await sdk.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.SameDomain,
        name: 'SO Default Quantity Test',
      });
      if (!createWorkspace) throw new Error('Workspace was not created');

      const { createSalesOrder } =
        await sdk.CreateSalesOrderForQuantityValidation({
          input: {
            workspace_id: createWorkspace.id,
            buyer_id: user.id,
            purchase_order_number: 'CUST-PO-002',
            sales_order_number: 'SO-DEFAULT-001',
          },
        });
      if (!createSalesOrder) throw new Error('SO was not created');

      // Create rental line item without explicit quantity - should default to 1
      const { createRentalSalesOrderLineItem } =
        await sdk.CreateRentalSOLineItemForQuantityValidation({
          input: {
            sales_order_id: createSalesOrder.id,
            so_pim_id: 'test-pim-8',
          },
        });

      expect(createRentalSalesOrderLineItem).toBeDefined();
    });

    it('rejects rental line items with quantity > 1', async () => {
      const { sdk, user } = await createClient();

      const { createWorkspace } = await sdk.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.SameDomain,
        name: 'SO Invalid Quantity Test',
      });
      if (!createWorkspace) throw new Error('Workspace was not created');

      const { createSalesOrder } =
        await sdk.CreateSalesOrderForQuantityValidation({
          input: {
            workspace_id: createWorkspace.id,
            buyer_id: user.id,
            purchase_order_number: 'CUST-PO-003',
            sales_order_number: 'SO-INVALID-001',
          },
        });
      if (!createSalesOrder) throw new Error('SO was not created');

      // Attempt to create rental line item with quantity 5 - should fail
      await expect(
        sdk.CreateRentalSOLineItemForQuantityValidation({
          input: {
            sales_order_id: createSalesOrder.id,
            so_pim_id: 'test-pim-9',
            so_quantity: 5,
          },
        }),
      ).rejects.toThrow(/quantity of exactly 1/i);
    });

    it('rejects rental line items with quantity 0', async () => {
      const { sdk, user } = await createClient();

      const { createWorkspace } = await sdk.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.SameDomain,
        name: 'SO Zero Quantity Test',
      });
      if (!createWorkspace) throw new Error('Workspace was not created');

      const { createSalesOrder } =
        await sdk.CreateSalesOrderForQuantityValidation({
          input: {
            workspace_id: createWorkspace.id,
            buyer_id: user.id,
            purchase_order_number: 'CUST-PO-004',
            sales_order_number: 'SO-ZERO-001',
          },
        });
      if (!createSalesOrder) throw new Error('SO was not created');

      // Attempt to create rental line item with quantity 0 - should fail
      await expect(
        sdk.CreateRentalSOLineItemForQuantityValidation({
          input: {
            sales_order_id: createSalesOrder.id,
            so_pim_id: 'test-pim-10',
            so_quantity: 0,
          },
        }),
      ).rejects.toThrow(/quantity of exactly 1/i);
    });

    it('rejects updating rental line item quantity to non-1 value', async () => {
      const { sdk, user } = await createClient();

      const { createWorkspace } = await sdk.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.SameDomain,
        name: 'SO Update Quantity Test',
      });
      if (!createWorkspace) throw new Error('Workspace was not created');

      const { createSalesOrder } =
        await sdk.CreateSalesOrderForQuantityValidation({
          input: {
            workspace_id: createWorkspace.id,
            buyer_id: user.id,
            purchase_order_number: 'CUST-PO-005',
            sales_order_number: 'SO-UPDATE-001',
          },
        });
      if (!createSalesOrder) throw new Error('SO was not created');

      // Create valid rental line item with quantity 1
      const { createRentalSalesOrderLineItem } =
        await sdk.CreateRentalSOLineItemForQuantityValidation({
          input: {
            sales_order_id: createSalesOrder.id,
            so_pim_id: 'test-pim-11',
            so_quantity: 1,
          },
        });
      if (!createRentalSalesOrderLineItem) {
        throw new Error('Line item was not created');
      }

      // Attempt to update quantity to 10 - should fail
      await expect(
        sdk.UpdateRentalSOLineItemForQuantityValidation({
          input: {
            id: createRentalSalesOrderLineItem.id,
            so_quantity: 10,
          },
        }),
      ).rejects.toThrow(/quantity of exactly 1/i);
    });

    it('allows updating rental line item quantity to 1', async () => {
      const { sdk, user } = await createClient();

      const { createWorkspace } = await sdk.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.SameDomain,
        name: 'SO Update Valid Quantity Test',
      });
      if (!createWorkspace) throw new Error('Workspace was not created');

      const { createSalesOrder } =
        await sdk.CreateSalesOrderForQuantityValidation({
          input: {
            workspace_id: createWorkspace.id,
            buyer_id: user.id,
            purchase_order_number: 'CUST-PO-006',
            sales_order_number: 'SO-UPDATE-VALID-001',
          },
        });
      if (!createSalesOrder) throw new Error('SO was not created');

      // Create rental line item
      const { createRentalSalesOrderLineItem } =
        await sdk.CreateRentalSOLineItemForQuantityValidation({
          input: {
            sales_order_id: createSalesOrder.id,
            so_pim_id: 'test-pim-12',
            so_quantity: 1,
          },
        });
      if (!createRentalSalesOrderLineItem) {
        throw new Error('Line item was not created');
      }

      // Update quantity to 1 - should succeed
      const { updateRentalSalesOrderLineItem } =
        await sdk.UpdateRentalSOLineItemForQuantityValidation({
          input: {
            id: createRentalSalesOrderLineItem.id,
            so_quantity: 1,
          },
        });

      expect(updateRentalSalesOrderLineItem).toBeDefined();
      expect(updateRentalSalesOrderLineItem?.so_quantity).toBe(1);
    });
  });
});
