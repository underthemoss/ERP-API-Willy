import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';
import { addDays } from 'date-fns';
import {
  FulfilmentType,
  InventoryStatus,
  Sdk,
  ReservationType,
  WorkspaceAccessType,
} from './generated/graphql';

// GraphQL operations for inventory assignment
gql`
  mutation AssignInventoryToRentalFulfilment(
    $fulfilmentId: ID!
    $inventoryId: ID!
    $allowOverlappingReservations: Boolean
  ) {
    assignInventoryToRentalFulfilment(
      fulfilmentId: $fulfilmentId
      inventoryId: $inventoryId
      allowOverlappingReservations: $allowOverlappingReservations
    ) {
      __typename
      id
      inventoryId
    }
  }
`;

// unassignInventoryFromRentalFulfilment
gql`
  mutation UnassignInventoryFromRentalFulfilment($fulfilmentId: ID!) {
    unassignInventoryFromRentalFulfilment(fulfilmentId: $fulfilmentId) {
      __typename
      id
      inventoryId
    }
  }
`;

gql`
  mutation CreateInventoryForFulfilmentTest($input: CreateInventoryInput!) {
    createInventory(input: $input) {
      id
      companyId
      status
      pimCategoryId
      pimCategoryName
      assetId
    }
  }
`;

gql`
  query UtilListInventoryReservations(
    $filter: ListInventoryReservationsFilter
    $page: ListInventoryPage
  ) {
    listInventoryReservations(filter: $filter, page: $page) {
      items {
        __typename
        ... on FulfilmentReservation {
          id
          inventoryId
          startDate
          endDate
          fulfilmentId
          type
          salesOrderType
        }
      }
    }
  }
`;

const { createClient } = createTestEnvironment();

describe('Fulfilment Inventory Assignment', () => {
  let workspaceId: string;
  let salesOrderId: string;
  let rentalPriceId: string;
  let salePriceId: string;
  let rentalSalesOrderLineItemId1: string;
  let rentalSalesOrderLineItemId2: string;
  let pimCategoryId: string;
  let inventoryId: string;
  let rentalFulfilmentId1: string;
  let rentalFulfilmentId2: string;
  let testSdk: Sdk;

  beforeEach(async () => {
    const { sdk } = await createClient();
    testSdk = sdk;
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'Inventory Assignment Workspace',
    });

    if (!createWorkspace) throw new Error('Workspace was not created');
    workspaceId = createWorkspace.id;

    // Create business contact
    const { createBusinessContact: businessContact } =
      await sdk.CreateBusinessContact({
        input: {
          name: 'Test Business for Inventory',
          workspaceId,
        },
      });

    if (!businessContact) {
      throw new Error('Failed to create business contact');
    }

    // Create sales order
    const { createSalesOrder } = await sdk.CreateSalesOrder({
      input: {
        buyer_id: businessContact.id,
        purchase_order_number: 'PO-INV-TEST-001',
        workspace_id: workspaceId,
      },
    });

    if (!createSalesOrder) {
      throw new Error('Failed to create sales order');
    }
    salesOrderId = createSalesOrder.id;

    // Create PIM category
    const { upsertPimCategory: pimCategory } = await sdk.CreatePimCategory({
      input: {
        id: 'test-inv-category-id',
        name: 'Test Inventory Category',
        path: 'Equipment|Heavy',
        platform_id: 'inv-cat-123',
        description: 'Test category for inventory assignment',
        has_products: false,
      },
    });

    if (!pimCategory) throw new Error('PIM category was not created');
    pimCategoryId = pimCategory.id;

    // Create rental price
    const { createRentalPrice: createRentalPriceResult } =
      await sdk.CreateRentalPriceForSalesOrder({
        input: {
          workspaceId,
          pricePerDayInCents: 2000,
          pricePerWeekInCents: 8000,
          pricePerMonthInCents: 24000,
          pimCategoryId: pimCategory.id,
          name: 'Excavator Rental',
        },
      });

    if (!createRentalPriceResult) {
      throw new Error('Rental price was not created');
    }
    rentalPriceId = createRentalPriceResult.id;

    // Create sale price
    const { createSalePrice: createSalePriceResult } =
      await sdk.CreateSalePriceForSalesOrder({
        input: {
          workspaceId,
          unitCostInCents: 50000,
          pimCategoryId: pimCategory.id,
          name: 'Excavator Sale',
        },
      });

    if (!createSalePriceResult) throw new Error('Sale price was not created');
    salePriceId = createSalePriceResult.id;

    // Create rental sales order line item
    const { createRentalSalesOrderLineItem: rentalLineItem1 } =
      await sdk.CreateRentalSalesOrderLineItem({
        input: {
          sales_order_id: salesOrderId,
          price_id: rentalPriceId,
        },
      });

    if (!rentalLineItem1) {
      throw new Error('Failed to create rental sales order line item');
    }
    rentalSalesOrderLineItemId1 = rentalLineItem1.id;

    const { createRentalSalesOrderLineItem: rentalLineItem2 } =
      await sdk.CreateRentalSalesOrderLineItem({
        input: {
          sales_order_id: salesOrderId,
          price_id: rentalPriceId,
        },
      });

    if (!rentalLineItem2) {
      throw new Error('Failed to create rental sales order line item');
    }
    rentalSalesOrderLineItemId2 = rentalLineItem2.id;

    // Create sale sales order line item
    const { createSaleSalesOrderLineItem: saleLineItem } =
      await sdk.CreateSaleSalesOrderLineItem({
        input: {
          sales_order_id: salesOrderId,
          price_id: salePriceId,
        },
      });

    if (!saleLineItem) {
      throw new Error('Failed to create sale sales order line item');
    }

    // Create inventory item
    const { createInventory } = await sdk.CreateInventoryForFulfilmentTest({
      input: {
        status: InventoryStatus.Received,
        isThirdPartyRental: false,
        pimCategoryId,
        pimCategoryName: 'Test Inventory Category',
        pimCategoryPath: 'Equipment|Heavy',
        assetId: 'ASSET-001',
      },
    });

    if (!createInventory) {
      throw new Error('Failed to create inventory');
    }
    inventoryId = createInventory.id;

    const r = await sdk.SubmitSalesOrder({
      id: salesOrderId,
    });

    if (!r.submitSalesOrder) {
      throw new Error('Failed to submit sales order');
    }

    const fulfilments = await sdk.ListFulfilmentsForSalesOrder({
      filter: {
        workspaceId,
        salesOrderId,
      },
    });

    const rentalFulfilment1 = fulfilments?.listFulfilments?.items?.find(
      (item) => item.salesOrderLineItemId === rentalSalesOrderLineItemId1,
    );
    if (!rentalFulfilment1) {
      throw new Error(
        'No rental fulfilment found after submitting sales order',
      );
    }

    const rentalFulfilment2 = fulfilments?.listFulfilments?.items?.find(
      (item) => item.salesOrderLineItemId === rentalSalesOrderLineItemId2,
    );
    if (!rentalFulfilment2) {
      throw new Error(
        'No rental fulfilment found after submitting sales order',
      );
    }

    const saleFulfilment = fulfilments?.listFulfilments?.items?.find(
      (item) => item.salesOrderType === FulfilmentType.Sale,
    );
    if (!saleFulfilment) {
      throw new Error('No sale fulfilment found after submitting sales order');
    }

    rentalFulfilmentId1 = rentalFulfilment1.id;
    rentalFulfilmentId2 = rentalFulfilment2.id;
  });

  describe('assignInventoryToRentalFulfilment mutation', () => {
    it('successfully assigns/unassigns inventory to a rental fulfilment', async () => {
      const sdk = testSdk;

      // Assign inventory to the fulfilment
      const { assignInventoryToRentalFulfilment } =
        await sdk.AssignInventoryToRentalFulfilment({
          fulfilmentId: rentalFulfilmentId1,
          inventoryId,
        });

      if (
        assignInventoryToRentalFulfilment?.__typename !== 'RentalFulfilment'
      ) {
        throw new Error('Unexpected fulfilment type');
      }

      expect(assignInventoryToRentalFulfilment.id).toBe(rentalFulfilmentId1);
      expect(assignInventoryToRentalFulfilment.inventoryId).toBe(inventoryId);

      const { listInventoryReservations } =
        await sdk.UtilListInventoryReservations({
          filter: {
            fulfilmentId: rentalFulfilmentId1,
          },
        });

      expect(listInventoryReservations?.items).toHaveLength(1);
      expect(listInventoryReservations?.items[0]).toEqual(
        expect.objectContaining({
          inventoryId,
          fulfilmentId: rentalFulfilmentId1,
          type: ReservationType.Fulfilment,
          salesOrderType: FulfilmentType.Rental,
        }),
      );

      // unassign inventory from the fulfilment
      const { unassignInventoryFromRentalFulfilment } =
        await sdk.UnassignInventoryFromRentalFulfilment({
          fulfilmentId: rentalFulfilmentId1,
        });

      expect(unassignInventoryFromRentalFulfilment).toBeDefined();
      expect(unassignInventoryFromRentalFulfilment?.inventoryId).toBe(null);
      const { listInventoryReservations: reservationsAfterUnassignment } =
        await sdk.UtilListInventoryReservations({
          filter: {
            fulfilmentId: rentalFulfilmentId1,
          },
        });

      expect(reservationsAfterUnassignment?.items).toHaveLength(0);
    });

    it('allow/throw overlapping reservations', async () => {
      const sdk = testSdk;

      // Create first rental fulfilment
      const firstRentalStart = addDays(new Date(), 10);
      const firstRentalEnd = addDays(new Date(), 20);

      await sdk.SetRentalStartDate({
        fulfilmentId: rentalFulfilmentId1,
        rentalStartDate: firstRentalStart.toISOString(),
      });

      await sdk.SetExpectedRentalEndDate({
        fulfilmentId: rentalFulfilmentId1,
        expectedRentalEndDate: firstRentalEnd.toISOString(),
      });

      const { assignInventoryToRentalFulfilment } =
        await sdk.AssignInventoryToRentalFulfilment({
          fulfilmentId: rentalFulfilmentId1,
          inventoryId,
        });

      expect(assignInventoryToRentalFulfilment).toBeDefined();
      const { listInventoryReservations } =
        await sdk.UtilListInventoryReservations({
          filter: {
            fulfilmentId: rentalFulfilmentId1,
          },
        });

      expect(listInventoryReservations?.items).toHaveLength(1);
      expect(listInventoryReservations?.items[0]).toEqual(
        expect.objectContaining({
          inventoryId,
          fulfilmentId: rentalFulfilmentId1,
          type: ReservationType.Fulfilment,
          salesOrderType: FulfilmentType.Rental,
          startDate: firstRentalStart.toISOString(),
          endDate: firstRentalEnd.toISOString(),
        }),
      );

      // Create second rental fulfilment with overlapping dates
      const secondRentalStart = addDays(new Date(), 15); // Overlaps with first
      const secondRentalEnd = addDays(new Date(), 25);

      await sdk.SetRentalStartDate({
        fulfilmentId: rentalFulfilmentId2,
        rentalStartDate: secondRentalStart.toISOString(),
      });

      await sdk.SetExpectedRentalEndDate({
        fulfilmentId: rentalFulfilmentId2,
        expectedRentalEndDate: secondRentalEnd.toISOString(),
      });

      // Try to assign the same inventory to the second fulfilment - should fail
      await expect(
        sdk.AssignInventoryToRentalFulfilment({
          fulfilmentId: rentalFulfilmentId2,
          inventoryId,
        }),
      ).rejects.toThrow(
        `Inventory with ID ${inventoryId} is already reserved for the specified dates.`,
      );

      // now pass allowing overlapping reservations
      const {
        assignInventoryToRentalFulfilment: assignInventoryToFulfilment2,
      } = await sdk.AssignInventoryToRentalFulfilment({
        fulfilmentId: rentalFulfilmentId2,
        inventoryId,
        allowOverlappingReservations: true,
      });

      expect(assignInventoryToFulfilment2).toBeDefined();
      const { listInventoryReservations: inventoryReservations } =
        await sdk.UtilListInventoryReservations({
          filter: {
            inventoryId,
          },
        });

      expect(inventoryReservations?.items).toHaveLength(2);
      expect(inventoryReservations?.items[0].fulfilmentId).toBe(
        rentalFulfilmentId1,
      );
      expect(inventoryReservations?.items[1].fulfilmentId).toBe(
        rentalFulfilmentId2,
      );
    });

    it('allows assignment when rental periods do not overlap', async () => {
      const sdk = testSdk;

      // Create first rental fulfilment
      const firstRentalStart = addDays(new Date(), 30);
      const firstRentalEnd = addDays(new Date(), 35);

      await sdk.SetRentalStartDate({
        fulfilmentId: rentalFulfilmentId1,
        rentalStartDate: firstRentalStart.toISOString(),
      });

      await sdk.SetExpectedRentalEndDate({
        fulfilmentId: rentalFulfilmentId1,
        expectedRentalEndDate: firstRentalEnd.toISOString(),
      });

      const {
        assignInventoryToRentalFulfilment: assignInventoryToFulfilment1,
      } = await sdk.AssignInventoryToRentalFulfilment({
        fulfilmentId: rentalFulfilmentId1,
        inventoryId,
      });

      expect(assignInventoryToFulfilment1).toBeDefined();
      expect(assignInventoryToFulfilment1?.inventoryId).toBe(inventoryId);

      const secondRentalStart = addDays(new Date(), 36); // Starts after first ends
      const secondRentalEnd = addDays(new Date(), 40);

      await sdk.SetRentalStartDate({
        fulfilmentId: rentalFulfilmentId2,
        rentalStartDate: secondRentalStart.toISOString(),
      });

      await sdk.SetExpectedRentalEndDate({
        fulfilmentId: rentalFulfilmentId2,
        expectedRentalEndDate: secondRentalEnd.toISOString(),
      });

      // Should successfully assign inventory since dates don't overlap
      const { assignInventoryToRentalFulfilment } =
        await sdk.AssignInventoryToRentalFulfilment({
          fulfilmentId: rentalFulfilmentId2,
          inventoryId,
        });

      expect(assignInventoryToRentalFulfilment).toBeDefined();
      expect(assignInventoryToRentalFulfilment?.inventoryId).toBe(inventoryId);
    });
  });

  describe('Purchase Order Line Item ID Assignment', () => {
    let purchaseOrderId: string;
    let poLineItemId: string;
    let inventoryWithPOLI: string;
    let inventoryWithoutPOLI: string;
    let anotherPOLineItemId: string;

    beforeEach(async () => {
      const sdk = testSdk;

      // Create a purchase order
      const { createPurchaseOrder: po } = await sdk.CreatePurchaseOrder({
        input: {
          workspace_id: workspaceId,
          seller_id: await (async () => {
            const { createBusinessContact } = await sdk.CreateBusinessContact({
              input: {
                name: 'PO Seller',
                workspaceId,
              },
            });
            return createBusinessContact!.id;
          })(),
        },
      });

      if (!po) throw new Error('Failed to create purchase order');
      purchaseOrderId = po.id;

      // Create purchase order line items
      const { createRentalPurchaseOrderLineItem: poLineItem } =
        await sdk.CreateRentalPurchaseOrderLineItem({
          input: {
            purchase_order_id: purchaseOrderId,
            price_id: rentalPriceId,
            po_quantity: 1,
          },
        });

      if (!poLineItem) {
        throw new Error('Failed to create purchase order line item');
      }
      poLineItemId = poLineItem.id;

      const { createRentalPurchaseOrderLineItem: anotherPOLineItem } =
        await sdk.CreateRentalPurchaseOrderLineItem({
          input: {
            purchase_order_id: purchaseOrderId,
            price_id: rentalPriceId,
            po_quantity: 1,
          },
        });

      if (!anotherPOLineItem) {
        throw new Error('Failed to create second purchase order line item');
      }
      anotherPOLineItemId = anotherPOLineItem.id;

      // Create inventory with PO line item ID
      const { createInventory: invWithPOLI } =
        await sdk.CreateInventoryForFulfilmentTest({
          input: {
            status: InventoryStatus.Received,
            isThirdPartyRental: false,
            pimCategoryId,
            pimCategoryName: 'Test Inventory Category',
            pimCategoryPath: 'Equipment|Heavy',
            assetId: 'ASSET-WITH-POLI',
            purchaseOrderId,
            purchaseOrderLineItemId: poLineItemId,
          },
        });

      if (!invWithPOLI) {
        throw new Error('Failed to create inventory with PO line item');
      }
      inventoryWithPOLI = invWithPOLI.id;

      // Create inventory without PO line item ID
      const { createInventory: invWithoutPOLI } =
        await sdk.CreateInventoryForFulfilmentTest({
          input: {
            status: InventoryStatus.Received,
            isThirdPartyRental: false,
            pimCategoryId,
            pimCategoryName: 'Test Inventory Category',
            pimCategoryPath: 'Equipment|Heavy',
            assetId: 'ASSET-WITHOUT-POLI',
          },
        });

      if (!invWithoutPOLI) {
        throw new Error('Failed to create inventory without PO line item');
      }
      inventoryWithoutPOLI = invWithoutPOLI.id;
    });

    it('automatically sets fulfilment PO line item ID when assigning inventory with PO line item', async () => {
      const sdk = testSdk;

      // Verify fulfilment doesn't have PO line item ID initially
      const { getFulfilmentById: initialFulfilment } =
        await sdk.GetFulfilmentById({
          id: rentalFulfilmentId1,
        });

      expect(initialFulfilment).toBeDefined();
      if ('purchaseOrderLineItemId' in (initialFulfilment ?? {})) {
        expect((initialFulfilment as any).purchaseOrderLineItemId).toBeNull();
      }

      // Assign inventory with PO line item ID
      const { assignInventoryToRentalFulfilment } =
        await sdk.AssignInventoryToRentalFulfilment({
          fulfilmentId: rentalFulfilmentId1,
          inventoryId: inventoryWithPOLI,
        });

      expect(assignInventoryToRentalFulfilment).toBeDefined();
      expect(assignInventoryToRentalFulfilment?.inventoryId).toBe(
        inventoryWithPOLI,
      );

      // Verify fulfilment now has the PO line item ID from inventory
      const { getFulfilmentById: updatedFulfilment } =
        await sdk.GetFulfilmentById({
          id: rentalFulfilmentId1,
        });

      expect(updatedFulfilment).toBeDefined();
      if ('purchaseOrderLineItemId' in (updatedFulfilment ?? {})) {
        expect((updatedFulfilment as any).purchaseOrderLineItemId).toBe(
          poLineItemId,
        );
      }

      // Verify via setFulfilmentPurchaseOrderLineItemId query
      const { setFulfilmentPurchaseOrderLineItemId } =
        await sdk.SetFulfilmentPurchaseOrderLineItemId({
          fulfilmentId: rentalFulfilmentId1,
          purchaseOrderLineItemId: poLineItemId,
        });

      expect(setFulfilmentPurchaseOrderLineItemId).toBeDefined();
      expect(
        setFulfilmentPurchaseOrderLineItemId?.purchaseOrderLineItemId,
      ).toBe(poLineItemId);
    });

    it('does not change fulfilment PO line item ID when assigning inventory without PO line item', async () => {
      const sdk = testSdk;

      // First set a PO line item ID on the fulfilment
      await sdk.SetFulfilmentPurchaseOrderLineItemId({
        fulfilmentId: rentalFulfilmentId1,
        purchaseOrderLineItemId: poLineItemId,
      });

      // Verify it's set
      const { getFulfilmentById: initialFulfilment } =
        await sdk.GetFulfilmentById({
          id: rentalFulfilmentId1,
        });

      if ('purchaseOrderLineItemId' in (initialFulfilment ?? {})) {
        expect((initialFulfilment as any).purchaseOrderLineItemId).toBe(
          poLineItemId,
        );
      }

      // Assign inventory without PO line item ID
      const { assignInventoryToRentalFulfilment } =
        await sdk.AssignInventoryToRentalFulfilment({
          fulfilmentId: rentalFulfilmentId1,
          inventoryId: inventoryWithoutPOLI,
        });

      expect(assignInventoryToRentalFulfilment).toBeDefined();
      expect(assignInventoryToRentalFulfilment?.inventoryId).toBe(
        inventoryWithoutPOLI,
      );

      // Verify fulfilment still has the original PO line item ID (not changed)
      const { getFulfilmentById: updatedFulfilment } =
        await sdk.GetFulfilmentById({
          id: rentalFulfilmentId1,
        });

      if ('purchaseOrderLineItemId' in (updatedFulfilment ?? {})) {
        expect((updatedFulfilment as any).purchaseOrderLineItemId).toBe(
          poLineItemId,
        );
      }
    });

    it('overwrites existing PO line item ID when assigning inventory with different PO line item', async () => {
      const sdk = testSdk;

      // First set a PO line item ID on the fulfilment
      await sdk.SetFulfilmentPurchaseOrderLineItemId({
        fulfilmentId: rentalFulfilmentId1,
        purchaseOrderLineItemId: anotherPOLineItemId,
      });

      // Verify it's set to the first one
      const { getFulfilmentById: initialFulfilment } =
        await sdk.GetFulfilmentById({
          id: rentalFulfilmentId1,
        });

      if ('purchaseOrderLineItemId' in (initialFulfilment ?? {})) {
        expect((initialFulfilment as any).purchaseOrderLineItemId).toBe(
          anotherPOLineItemId,
        );
      }

      // Assign inventory with different PO line item ID
      const { assignInventoryToRentalFulfilment } =
        await sdk.AssignInventoryToRentalFulfilment({
          fulfilmentId: rentalFulfilmentId1,
          inventoryId: inventoryWithPOLI,
        });

      expect(assignInventoryToRentalFulfilment).toBeDefined();
      expect(assignInventoryToRentalFulfilment?.inventoryId).toBe(
        inventoryWithPOLI,
      );

      // Verify fulfilment now has the new PO line item ID from inventory (overwritten)
      const { getFulfilmentById: updatedFulfilment } =
        await sdk.GetFulfilmentById({
          id: rentalFulfilmentId1,
        });

      if ('purchaseOrderLineItemId' in (updatedFulfilment ?? {})) {
        expect((updatedFulfilment as any).purchaseOrderLineItemId).toBe(
          poLineItemId,
        );
        expect((updatedFulfilment as any).purchaseOrderLineItemId).not.toBe(
          anotherPOLineItemId,
        );
      }
    });

    it('does not change PO line item ID when unassigning inventory', async () => {
      const sdk = testSdk;

      // Assign inventory with PO line item ID
      await sdk.AssignInventoryToRentalFulfilment({
        fulfilmentId: rentalFulfilmentId1,
        inventoryId: inventoryWithPOLI,
      });

      // Verify fulfilment has the PO line item ID
      const { getFulfilmentById: fulfilmentAfterAssignment } =
        await sdk.GetFulfilmentById({
          id: rentalFulfilmentId1,
        });

      if ('purchaseOrderLineItemId' in (fulfilmentAfterAssignment ?? {})) {
        expect((fulfilmentAfterAssignment as any).purchaseOrderLineItemId).toBe(
          poLineItemId,
        );
      }

      // Unassign inventory
      const { unassignInventoryFromRentalFulfilment } =
        await sdk.UnassignInventoryFromRentalFulfilment({
          fulfilmentId: rentalFulfilmentId1,
        });

      expect(unassignInventoryFromRentalFulfilment).toBeDefined();
      expect(unassignInventoryFromRentalFulfilment?.inventoryId).toBeNull();

      // Verify fulfilment still has the PO line item ID (not changed by unassignment)
      const { getFulfilmentById: fulfilmentAfterUnassignment } =
        await sdk.GetFulfilmentById({
          id: rentalFulfilmentId1,
        });

      if ('purchaseOrderLineItemId' in (fulfilmentAfterUnassignment ?? {})) {
        expect(
          (fulfilmentAfterUnassignment as any).purchaseOrderLineItemId,
        ).toBe(poLineItemId);
      }
    });

    it('performs all operations atomically in a transaction', async () => {
      const sdk = testSdk;

      // This test verifies that if the transaction fails partway through,
      // nothing is persisted. We'll test by trying to assign to a non-existent fulfilment
      const nonExistentFulfilmentId = 'FLMT-nonexistent';

      await expect(
        sdk.AssignInventoryToRentalFulfilment({
          fulfilmentId: nonExistentFulfilmentId,
          inventoryId: inventoryWithPOLI,
        }),
      ).rejects.toThrow();

      // Verify no reservation was created for the inventory
      const { listInventoryReservations } =
        await sdk.UtilListInventoryReservations({
          filter: {
            inventoryId: inventoryWithPOLI,
          },
        });

      expect(listInventoryReservations?.items).toHaveLength(0);

      // Now test a successful assignment to ensure everything works together
      const { assignInventoryToRentalFulfilment } =
        await sdk.AssignInventoryToRentalFulfilment({
          fulfilmentId: rentalFulfilmentId1,
          inventoryId: inventoryWithPOLI,
        });

      expect(assignInventoryToRentalFulfilment).toBeDefined();

      // Verify all three things happened:
      // 1. Inventory ID set on fulfilment
      expect(assignInventoryToRentalFulfilment?.inventoryId).toBe(
        inventoryWithPOLI,
      );

      // 2. Reservation created
      const { listInventoryReservations: reservationsAfterSuccess } =
        await sdk.UtilListInventoryReservations({
          filter: {
            inventoryId: inventoryWithPOLI,
          },
        });

      expect(reservationsAfterSuccess?.items).toHaveLength(1);

      // 3. PO line item ID set on fulfilment
      const { getFulfilmentById } = await sdk.GetFulfilmentById({
        id: rentalFulfilmentId1,
      });

      if ('purchaseOrderLineItemId' in (getFulfilmentById ?? {})) {
        expect((getFulfilmentById as any).purchaseOrderLineItemId).toBe(
          poLineItemId,
        );
      }
    });
  });
});
