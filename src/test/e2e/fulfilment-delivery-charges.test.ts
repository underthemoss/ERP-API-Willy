/// <reference types="jest" />
import { v4 } from 'uuid';
import { WorkspaceAccessType } from './generated/graphql';
import { createTestEnvironment } from './test-environment';
import { addDays, subDays } from 'date-fns';

const { createClient } = createTestEnvironment();

describe('Delivery Charges - RentalFulfilment', () => {
  const userId = v4();
  let businessContactId: string;
  let rentalPriceId: string;
  let salePriceId: string;
  let workspaceId: string;

  beforeAll(async () => {
    const { sdk } = await createClient({
      userId,
    });

    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'SO Fulfilment Workspace',
    });

    if (!createWorkspace) throw new Error('Workspace was not created');
    workspaceId = createWorkspace.id;

    // Create business contact
    const { createBusinessContact: businessContact } =
      await sdk.CreateBusinessContact({
        input: {
          name: 'delivery test business',
          workspaceId,
        },
      });

    if (!businessContact) {
      throw new Error('Failed to create business contact');
    }
    businessContactId = businessContact.id;

    // Create pim category
    const { upsertPimCategory: pimCategory } = await sdk.CreatePimCategory({
      input: {
        id: 'delivery-test-category-id',
        name: 'Test Category',
        path: 'Test|Stuff',
        platform_id: 'abc-123',
        description: 'Test category for delivery charges',
        has_products: false,
      },
    });

    if (!pimCategory) throw new Error('Pim category was not created');

    // Create a rental price
    const { createRentalPrice: createRentalPriceResult } =
      await sdk.CreateRentalPriceForSalesOrder({
        input: {
          workspaceId,
          pricePerDayInCents: 1000,
          pricePerWeekInCents: 4000,
          pricePerMonthInCents: 12000,
          pimCategoryId: pimCategory.id,
          name: 'Super Big Digger',
        },
      });

    if (!createRentalPriceResult) {
      throw new Error('Rental price was not created');
    }
    rentalPriceId = createRentalPriceResult.id;

    // Create a sale price
    const { createSalePrice: createSalePriceResult } =
      await sdk.CreateSalePriceForSalesOrder({
        input: {
          workspaceId,
          unitCostInCents: 50000, // $500
          pimCategoryId: pimCategory.id,
          name: 'Test Sale Item',
        },
      });

    if (!createSalePriceResult) {
      throw new Error('Sale price was not created');
    }
    salePriceId = createSalePriceResult.id;
  });

  it('creates delivery charge immediately when rental start date is in the past', async () => {
    const { sdk } = await createClient({
      userId,
    });

    const { createSalesOrder } = await sdk.CreateSalesOrder({
      input: {
        buyer_id: businessContactId,
        purchase_order_number: `PO-DELIVERY-${new Date().toISOString()}`,
        workspace_id: workspaceId,
      },
    });

    if (!createSalesOrder) throw new Error('Failed to create sales order');

    // Create rental line item with delivery charge and past delivery date
    const pastDeliveryDate = subDays(new Date(), 5).toISOString();
    const deliveryChargeInCents = 5000; // $50 delivery charge

    const { createRentalSalesOrderLineItem: salesOrderLineItem } =
      await sdk.CreateRentalSalesOrderLineItem({
        input: {
          sales_order_id: createSalesOrder.id,
          price_id: rentalPriceId,
          delivery_date: pastDeliveryDate,
          delivery_charge_in_cents: deliveryChargeInCents,
        },
      });

    if (!salesOrderLineItem?.id) {
      throw new Error('Failed to create rental sales order line item');
    }

    // Submit the sales order
    await sdk.SubmitSalesOrder({ id: createSalesOrder.id });

    // Get the fulfilment
    const { listFulfilments } = await sdk.ListFulfilments({
      filter: {
        workspaceId,
        salesOrderId: createSalesOrder.id,
      },
    });

    const rentalFulfilment = listFulfilments?.items?.[0];
    if (
      !rentalFulfilment ||
      rentalFulfilment.__typename !== 'RentalFulfilment'
    ) {
      throw new Error('Failed to find rental fulfilment');
    }

    // List charges - should include delivery charge
    const { listCharges } = await sdk.ListCharges({
      filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
    });

    // Should have 1 charge (delivery charge only, no rental charges yet as < 28 days)
    expect(listCharges?.items.length).toBe(1);

    const deliveryCharge = listCharges?.items.find((charge) =>
      charge.description.startsWith('Delivery charge for'),
    );

    expect(deliveryCharge).toEqual(
      expect.objectContaining({
        amountInCents: deliveryChargeInCents,
        description: `Delivery charge for Test Category: Super Big Digger`,
        chargeType: 'SERVICE',
        contactId: rentalFulfilment.contactId,
        projectId: rentalFulfilment.projectId,
        salesOrderId: rentalFulfilment.salesOrderId,
        purchaseOrderNumber: rentalFulfilment.purchaseOrderNumber,
        salesOrderLineItemId: rentalFulfilment.salesOrderLineItemId,
        fulfilmentId: rentalFulfilment.id,
        invoiceId: null,
      }),
    );
  });

  it('does not create delivery charge when rental start date is in the future', async () => {
    const { sdk } = await createClient({
      userId,
    });

    const { createSalesOrder } = await sdk.CreateSalesOrder({
      input: {
        buyer_id: businessContactId,
        purchase_order_number: `PO-FUTURE-DELIVERY-${new Date().toISOString()}`,
        workspace_id: workspaceId,
      },
    });

    if (!createSalesOrder) throw new Error('Failed to create sales order');

    // Create rental line item with delivery charge and future delivery date
    const futureDeliveryDate = addDays(new Date(), 5).toISOString();
    const deliveryChargeInCents = 5000;

    const { createRentalSalesOrderLineItem: salesOrderLineItem } =
      await sdk.CreateRentalSalesOrderLineItem({
        input: {
          sales_order_id: createSalesOrder.id,
          price_id: rentalPriceId,
          delivery_date: futureDeliveryDate,
          delivery_charge_in_cents: deliveryChargeInCents,
        },
      });

    if (!salesOrderLineItem?.id) {
      throw new Error('Failed to create rental sales order line item');
    }

    // Submit the sales order
    await sdk.SubmitSalesOrder({ id: createSalesOrder.id });

    // Get the fulfilment
    const { listFulfilments } = await sdk.ListFulfilments({
      filter: {
        workspaceId,
        salesOrderId: createSalesOrder.id,
      },
    });

    const rentalFulfilment = listFulfilments?.items?.[0];
    if (
      !rentalFulfilment ||
      rentalFulfilment.__typename !== 'RentalFulfilment'
    ) {
      throw new Error('Failed to find rental fulfilment');
    }

    // List charges - should be empty as delivery is scheduled for future
    const { listCharges } = await sdk.ListCharges({
      filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
    });

    expect(listCharges?.items.length).toBe(0);
  });

  it('creates delivery charge when setting rental start date to past', async () => {
    const { sdk } = await createClient({
      userId,
    });

    const { createSalesOrder } = await sdk.CreateSalesOrder({
      input: {
        buyer_id: businessContactId,
        purchase_order_number: `PO-SET-PAST-${new Date().toISOString()}`,
        workspace_id: workspaceId,
      },
    });

    if (!createSalesOrder) throw new Error('Failed to create sales order');

    // Create rental line item with delivery charge but no delivery date
    const deliveryChargeInCents = 7500; // $75 delivery charge

    const { createRentalSalesOrderLineItem: salesOrderLineItem } =
      await sdk.CreateRentalSalesOrderLineItem({
        input: {
          sales_order_id: createSalesOrder.id,
          price_id: rentalPriceId,
          delivery_charge_in_cents: deliveryChargeInCents,
        },
      });

    if (!salesOrderLineItem?.id) {
      throw new Error('Failed to create rental sales order line item');
    }

    // Submit the sales order
    await sdk.SubmitSalesOrder({ id: createSalesOrder.id });

    // Get the fulfilment
    const { listFulfilments } = await sdk.ListFulfilments({
      filter: {
        workspaceId,
        salesOrderId: createSalesOrder.id,
      },
    });

    const rentalFulfilment = listFulfilments?.items?.[0];
    if (
      !rentalFulfilment ||
      rentalFulfilment.__typename !== 'RentalFulfilment'
    ) {
      throw new Error('Failed to find rental fulfilment');
    }

    // Initially no charges
    const { listCharges: initialCharges } = await sdk.ListCharges({
      filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
    });
    expect(initialCharges?.items.length).toBe(0);

    // Set rental start date to past
    const pastStartDate = subDays(new Date(), 3).toISOString();
    await sdk.SetRentalStartDate({
      fulfilmentId: rentalFulfilment.id,
      rentalStartDate: pastStartDate,
    });

    // Now should have delivery charge
    const { listCharges } = await sdk.ListCharges({
      filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
    });

    expect(listCharges?.items.length).toBe(1);

    const deliveryCharge = listCharges?.items[0];
    expect(deliveryCharge).toEqual(
      expect.objectContaining({
        amountInCents: deliveryChargeInCents,
        description: `Delivery charge for Test Category: Super Big Digger`,
        chargeType: 'SERVICE',
      }),
    );
  });

  it('does not create delivery charge when setting rental start date to future', async () => {
    const { sdk } = await createClient({
      userId,
    });

    const { createSalesOrder } = await sdk.CreateSalesOrder({
      input: {
        buyer_id: businessContactId,
        purchase_order_number: `PO-SET-FUTURE-${new Date().toISOString()}`,
        workspace_id: workspaceId,
      },
    });

    if (!createSalesOrder) throw new Error('Failed to create sales order');

    // Create rental line item with delivery charge
    const deliveryChargeInCents = 3000;

    const { createRentalSalesOrderLineItem: salesOrderLineItem } =
      await sdk.CreateRentalSalesOrderLineItem({
        input: {
          sales_order_id: createSalesOrder.id,
          price_id: rentalPriceId,
          delivery_charge_in_cents: deliveryChargeInCents,
        },
      });

    if (!salesOrderLineItem?.id) {
      throw new Error('Failed to create rental sales order line item');
    }

    // Submit the sales order
    await sdk.SubmitSalesOrder({ id: createSalesOrder.id });

    // Get the fulfilment
    const { listFulfilments } = await sdk.ListFulfilments({
      filter: {
        workspaceId,
        salesOrderId: createSalesOrder.id,
      },
    });

    const rentalFulfilment = listFulfilments?.items?.[0];
    if (
      !rentalFulfilment ||
      rentalFulfilment.__typename !== 'RentalFulfilment'
    ) {
      throw new Error('Failed to find rental fulfilment');
    }

    // Set rental start date to future
    const futureStartDate = addDays(new Date(), 7).toISOString();
    await sdk.SetRentalStartDate({
      fulfilmentId: rentalFulfilment.id,
      rentalStartDate: futureStartDate,
    });

    // Should have no charges (delivery is scheduled for future)
    const { listCharges } = await sdk.ListCharges({
      filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
    });

    expect(listCharges?.items.length).toBe(0);
  });

  it('handles multiple rental start date changes correctly', async () => {
    const { sdk } = await createClient({
      userId,
    });

    const { createSalesOrder } = await sdk.CreateSalesOrder({
      input: {
        buyer_id: businessContactId,
        purchase_order_number: `PO-MULTI-CHANGE-${new Date().toISOString()}`,
        workspace_id: workspaceId,
      },
    });

    if (!createSalesOrder) throw new Error('Failed to create sales order');

    // Create rental line item with delivery charge
    const deliveryChargeInCents = 10000; // $100 delivery charge

    const { createRentalSalesOrderLineItem: salesOrderLineItem } =
      await sdk.CreateRentalSalesOrderLineItem({
        input: {
          sales_order_id: createSalesOrder.id,
          price_id: rentalPriceId,
          delivery_charge_in_cents: deliveryChargeInCents,
        },
      });

    if (!salesOrderLineItem?.id) {
      throw new Error('Failed to create rental sales order line item');
    }

    // Submit the sales order
    await sdk.SubmitSalesOrder({ id: createSalesOrder.id });

    // Get the fulfilment
    const { listFulfilments } = await sdk.ListFulfilments({
      filter: {
        workspaceId,
        salesOrderId: createSalesOrder.id,
      },
    });

    const rentalFulfilment = listFulfilments?.items?.[0];
    if (
      !rentalFulfilment ||
      rentalFulfilment.__typename !== 'RentalFulfilment'
    ) {
      throw new Error('Failed to find rental fulfilment');
    }

    // First: Set to future date (no charge should be created)
    const futureDate = addDays(new Date(), 10).toISOString();
    await sdk.SetRentalStartDate({
      fulfilmentId: rentalFulfilment.id,
      rentalStartDate: futureDate,
    });

    let charges = await sdk.ListCharges({
      filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
    });
    expect(charges.listCharges?.items.length).toBe(0);

    // Second: Change to past date (charge should be created)
    const pastDate = subDays(new Date(), 2).toISOString();
    await sdk.SetRentalStartDate({
      fulfilmentId: rentalFulfilment.id,
      rentalStartDate: pastDate,
    });

    charges = await sdk.ListCharges({
      filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
    });
    expect(charges.listCharges?.items.length).toBe(1);

    const firstCharge = charges.listCharges?.items[0];
    expect(firstCharge?.chargeType).toBe('SERVICE');
    expect(firstCharge?.amountInCents).toBe(deliveryChargeInCents);

    // Third: Change to different past date (should not create duplicate)
    const differentPastDate = subDays(new Date(), 5).toISOString();
    await sdk.SetRentalStartDate({
      fulfilmentId: rentalFulfilment.id,
      rentalStartDate: differentPastDate,
    });

    charges = await sdk.ListCharges({
      filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
    });
    // Still only 1 delivery charge (no duplicates)
    const deliveryCharges = charges.listCharges?.items.filter((c) =>
      c.description.startsWith('Delivery charge for'),
    );

    expect(deliveryCharges?.length).toBe(1);

    // Fourth: Change to future date again
    const newFutureDate = addDays(new Date(), 20).toISOString();
    await sdk.SetRentalStartDate({
      fulfilmentId: rentalFulfilment.id,
      rentalStartDate: newFutureDate,
    });

    charges = await sdk.ListCharges({
      filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
    });
    const finalDeliveryCharges = charges.listCharges?.items.filter((c) =>
      c.description.startsWith('Delivery charge for'),
    );
    expect(finalDeliveryCharges?.length).toBe(0);
  });

  it('does not create delivery charge when delivery_charge_in_cents is 0', async () => {
    const { sdk } = await createClient({
      userId,
    });

    const { createSalesOrder } = await sdk.CreateSalesOrder({
      input: {
        buyer_id: businessContactId,
        purchase_order_number: `PO-ZERO-CHARGE-${new Date().toISOString()}`,
        workspace_id: workspaceId,
      },
    });

    if (!createSalesOrder) throw new Error('Failed to create sales order');

    // Create rental line item with zero delivery charge
    const { createRentalSalesOrderLineItem: salesOrderLineItem } =
      await sdk.CreateRentalSalesOrderLineItem({
        input: {
          sales_order_id: createSalesOrder.id,
          price_id: rentalPriceId,
          delivery_date: subDays(new Date(), 1).toISOString(),
          delivery_charge_in_cents: 0,
        },
      });

    if (!salesOrderLineItem?.id) {
      throw new Error('Failed to create rental sales order line item');
    }

    // Submit the sales order
    await sdk.SubmitSalesOrder({ id: createSalesOrder.id });

    // Get the fulfilment
    const { listFulfilments } = await sdk.ListFulfilments({
      filter: {
        workspaceId,
        salesOrderId: createSalesOrder.id,
      },
    });

    const rentalFulfilment = listFulfilments?.items?.[0];
    if (
      !rentalFulfilment ||
      rentalFulfilment.__typename !== 'RentalFulfilment'
    ) {
      throw new Error('Failed to find rental fulfilment');
    }

    // Should have no charges
    const { listCharges } = await sdk.ListCharges({
      filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
    });

    expect(listCharges?.items.length).toBe(0);
  });

  it('does not create delivery charge when delivery_charge_in_cents is not set', async () => {
    const { sdk } = await createClient({
      userId,
    });

    const { createSalesOrder } = await sdk.CreateSalesOrder({
      input: {
        buyer_id: businessContactId,
        purchase_order_number: `PO-NO-CHARGE-${new Date().toISOString()}`,
        workspace_id: workspaceId,
      },
    });

    if (!createSalesOrder) throw new Error('Failed to create sales order');

    // Create rental line item without delivery charge
    const { createRentalSalesOrderLineItem: salesOrderLineItem } =
      await sdk.CreateRentalSalesOrderLineItem({
        input: {
          sales_order_id: createSalesOrder.id,
          price_id: rentalPriceId,
          delivery_date: subDays(new Date(), 1).toISOString(),
          // delivery_charge_in_cents not set
        },
      });

    if (!salesOrderLineItem?.id) {
      throw new Error('Failed to create rental sales order line item');
    }

    // Submit the sales order
    await sdk.SubmitSalesOrder({ id: createSalesOrder.id });

    // Get the fulfilment
    const { listFulfilments } = await sdk.ListFulfilments({
      filter: {
        workspaceId,
        salesOrderId: createSalesOrder.id,
      },
    });

    const rentalFulfilment = listFulfilments?.items?.[0];
    if (
      !rentalFulfilment ||
      rentalFulfilment.__typename !== 'RentalFulfilment'
    ) {
      throw new Error('Failed to find rental fulfilment');
    }

    // Should have no charges
    const { listCharges } = await sdk.ListCharges({
      filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
    });

    expect(listCharges?.items.length).toBe(0);
  });

  it('creates delivery charge after scheduled time when rental start date is in near future', async () => {
    const { sdk } = await createClient({
      userId,
    });

    const { createSalesOrder } = await sdk.CreateSalesOrder({
      input: {
        buyer_id: businessContactId,
        purchase_order_number: `PO-SCHEDULED-${new Date().toISOString()}`,
        workspace_id: workspaceId,
      },
    });

    if (!createSalesOrder) throw new Error('Failed to create sales order');

    // Create rental line item with delivery charge but no delivery date
    const deliveryChargeInCents = 2500; // $25 delivery charge

    const { createRentalSalesOrderLineItem: salesOrderLineItem } =
      await sdk.CreateRentalSalesOrderLineItem({
        input: {
          sales_order_id: createSalesOrder.id,
          price_id: rentalPriceId,
          delivery_charge_in_cents: deliveryChargeInCents,
        },
      });

    if (!salesOrderLineItem?.id) {
      throw new Error('Failed to create rental sales order line item');
    }

    // Submit the sales order
    await sdk.SubmitSalesOrder({ id: createSalesOrder.id });

    // Get the fulfilment
    const { listFulfilments } = await sdk.ListFulfilments({
      filter: {
        workspaceId,
        salesOrderId: createSalesOrder.id,
      },
    });

    const rentalFulfilment = listFulfilments?.items?.[0];
    if (
      !rentalFulfilment ||
      rentalFulfilment.__typename !== 'RentalFulfilment'
    ) {
      throw new Error('Failed to find rental fulfilment');
    }

    // Set rental start date to 5 seconds in the future
    const futureStartDate = new Date(Date.now() + 5000).toISOString();
    await sdk.SetRentalStartDate({
      fulfilmentId: rentalFulfilment.id,
      rentalStartDate: futureStartDate,
    });

    // Initially no charges
    const { listCharges: initialCharges } = await sdk.ListCharges({
      filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
    });
    expect(initialCharges?.items.length).toBe(0);

    // Wait for 6 seconds to allow the scheduled job to run
    await new Promise((resolve) => setTimeout(resolve, 6000));

    // Now should have delivery charge
    const { listCharges } = await sdk.ListCharges({
      filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
    });

    expect(listCharges?.items.length).toBe(1);

    const deliveryCharge = listCharges?.items[0];
    expect(deliveryCharge).toEqual(
      expect.objectContaining({
        amountInCents: deliveryChargeInCents,
        description: `Delivery charge for Test Category: Super Big Digger`,
        chargeType: 'SERVICE',
      }),
    );
  }, 10000); // Increase timeout for this test to 10 seconds

  it('cancels previously scheduled delivery charge job when rental start date changes', async () => {
    const { sdk } = await createClient({
      userId,
    });

    const { createSalesOrder } = await sdk.CreateSalesOrder({
      input: {
        buyer_id: businessContactId,
        purchase_order_number: `PO-CANCEL-JOB-${new Date().toISOString()}`,
        workspace_id: workspaceId,
      },
    });

    if (!createSalesOrder) throw new Error('Failed to create sales order');

    // Create rental line item with delivery charge
    const deliveryChargeInCents = 3500; // $35 delivery charge

    const { createRentalSalesOrderLineItem: salesOrderLineItem } =
      await sdk.CreateRentalSalesOrderLineItem({
        input: {
          sales_order_id: createSalesOrder.id,
          price_id: rentalPriceId,
          delivery_charge_in_cents: deliveryChargeInCents,
        },
      });

    if (!salesOrderLineItem?.id) {
      throw new Error('Failed to create rental sales order line item');
    }

    // Submit the sales order
    await sdk.SubmitSalesOrder({ id: createSalesOrder.id });

    // Get the fulfilment
    const { listFulfilments } = await sdk.ListFulfilments({
      filter: {
        workspaceId,
        salesOrderId: createSalesOrder.id,
      },
    });

    const rentalFulfilment = listFulfilments?.items?.[0];
    if (
      !rentalFulfilment ||
      rentalFulfilment.__typename !== 'RentalFulfilment'
    ) {
      throw new Error('Failed to find rental fulfilment');
    }

    // First: Set rental start date to 5 seconds in the future
    const futureStartDate = new Date(Date.now() + 5000).toISOString();
    await sdk.SetRentalStartDate({
      fulfilmentId: rentalFulfilment.id,
      rentalStartDate: futureStartDate,
    });

    // Verify no charges initially
    let charges = await sdk.ListCharges({
      filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
    });
    expect(charges.listCharges?.items.length).toBe(0);

    // Second: Change to past date (should cancel the scheduled job and create charge immediately)
    const pastStartDate = subDays(new Date(), 2).toISOString();
    await sdk.SetRentalStartDate({
      fulfilmentId: rentalFulfilment.id,
      rentalStartDate: pastStartDate,
    });

    // Should have one charge immediately
    charges = await sdk.ListCharges({
      filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
    });
    expect(charges.listCharges?.items.length).toBe(1);

    // Wait 6 seconds to ensure the originally scheduled job would have run
    await new Promise((resolve) => setTimeout(resolve, 6000));

    // Verify still only one charge (the scheduled job was cancelled)
    const { listCharges: finalCharges } = await sdk.ListCharges({
      filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
    });

    expect(finalCharges?.items.length).toBe(1);

    const deliveryCharge = finalCharges?.items[0];
    expect(deliveryCharge).toEqual(
      expect.objectContaining({
        amountInCents: deliveryChargeInCents,
        description: `Delivery charge for Test Category: Super Big Digger`,
        chargeType: 'SERVICE',
      }),
    );
  }, 12000); // Increase timeout for this test to 12 seconds

  it('creates both rental and delivery charges for long-term rental with delivery', async () => {
    const { sdk } = await createClient({
      userId,
    });

    const { createSalesOrder } = await sdk.CreateSalesOrder({
      input: {
        buyer_id: businessContactId,
        purchase_order_number: `PO-BOTH-CHARGES-${new Date().toISOString()}`,
        workspace_id: workspaceId,
      },
    });

    if (!createSalesOrder) throw new Error('Failed to create sales order');

    // Create rental line item with delivery charge and past date > 28 days
    const pastDeliveryDate = subDays(new Date(), 30).toISOString();
    const deliveryChargeInCents = 15000; // $150 delivery charge

    const { createRentalSalesOrderLineItem: salesOrderLineItem } =
      await sdk.CreateRentalSalesOrderLineItem({
        input: {
          sales_order_id: createSalesOrder.id,
          price_id: rentalPriceId,
          delivery_date: pastDeliveryDate,
          delivery_charge_in_cents: deliveryChargeInCents,
        },
      });

    if (!salesOrderLineItem?.id) {
      throw new Error('Failed to create rental sales order line item');
    }

    // Submit the sales order
    await sdk.SubmitSalesOrder({ id: createSalesOrder.id });

    // Get the fulfilment
    const { listFulfilments } = await sdk.ListFulfilments({
      filter: {
        workspaceId,
        salesOrderId: createSalesOrder.id,
      },
    });

    const rentalFulfilment = listFulfilments?.items?.[0];
    if (
      !rentalFulfilment ||
      rentalFulfilment.__typename !== 'RentalFulfilment'
    ) {
      throw new Error('Failed to find rental fulfilment');
    }

    // List charges - should have both rental and delivery charges
    const { listCharges } = await sdk.ListCharges({
      filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
    });

    // Should have 2 charges: 1 rental (28 days) + 1 delivery
    expect(listCharges?.items.length).toBe(2);

    const rentalCharge = listCharges?.items.find(
      (c) => c.chargeType === 'RENTAL',
    );
    const deliveryCharge = listCharges?.items.find(
      (c) => c.chargeType === 'SERVICE',
    );

    expect(rentalCharge).toEqual(
      expect.objectContaining({
        amountInCents: 12000, // 28 days at monthly rate
        description: `Rental charge for Test Category: Super Big Digger, 28 days: 1 x 28 Day Rate (120.00)`,
        chargeType: 'RENTAL',
      }),
    );

    expect(deliveryCharge).toEqual(
      expect.objectContaining({
        amountInCents: deliveryChargeInCents,
        description: `Delivery charge for Test Category: Super Big Digger`,
        chargeType: 'SERVICE',
      }),
    );
  });

  it('creates delivery charge for SALE sales order with delivery charge', async () => {
    const { sdk } = await createClient({
      userId,
    });

    const { createSalesOrder } = await sdk.CreateSalesOrder({
      input: {
        buyer_id: businessContactId,
        purchase_order_number: `PO-SALE-DELIVERY-${new Date().toISOString()}`,
        workspace_id: workspaceId,
      },
    });

    if (!createSalesOrder) throw new Error('Failed to create sales order');

    // Create sale line item with delivery charge
    const deliveryChargeInCents = 8000; // $80 delivery charge

    const { createSaleSalesOrderLineItem: salesOrderLineItem } =
      await sdk.CreateSaleSalesOrderLineItem({
        input: {
          sales_order_id: createSalesOrder.id,
          price_id: salePriceId,
          so_quantity: 2,
          delivery_charge_in_cents: deliveryChargeInCents,
        },
      });

    if (!salesOrderLineItem?.id) {
      throw new Error('Failed to create sale sales order line item');
    }

    // Submit the sales order
    await sdk.SubmitSalesOrder({ id: createSalesOrder.id });

    // Get the fulfilment
    const { listFulfilments } = await sdk.ListFulfilments({
      filter: {
        workspaceId,
        salesOrderId: createSalesOrder.id,
      },
    });

    const saleFulfilment = listFulfilments?.items?.[0];
    if (!saleFulfilment || saleFulfilment.__typename !== 'SaleFulfilment') {
      throw new Error('Failed to find sale fulfilment');
    }

    // List charges - should include both sale charge and delivery charge
    const { listCharges } = await sdk.ListCharges({
      filter: { workspaceId, fulfilmentId: saleFulfilment.id },
    });

    // Should have 2 charges: 1 sale + 1 delivery
    expect(listCharges?.items.length).toBe(2);

    const saleCharge = listCharges?.items.find((c) => c.chargeType === 'SALE');
    const deliveryCharge = listCharges?.items.find(
      (c) => c.chargeType === 'SERVICE',
    );

    expect(saleCharge).toEqual(
      expect.objectContaining({
        amountInCents: 100000, // $500 x 2 = $1000
        description: `Sale of Test Category: Test Sale Item, ($500.00) x 2`,
        chargeType: 'SALE',
        contactId: saleFulfilment.contactId,
        projectId: saleFulfilment.projectId,
        salesOrderId: saleFulfilment.salesOrderId,
        purchaseOrderNumber: saleFulfilment.purchaseOrderNumber,
        salesOrderLineItemId: saleFulfilment.salesOrderLineItemId,
        fulfilmentId: saleFulfilment.id,
        invoiceId: null,
      }),
    );

    expect(deliveryCharge).toEqual(
      expect.objectContaining({
        amountInCents: deliveryChargeInCents,
        description: `Delivery charge for Test Category: Test Sale Item`,
        chargeType: 'SERVICE',
        contactId: saleFulfilment.contactId,
        projectId: saleFulfilment.projectId,
        salesOrderId: saleFulfilment.salesOrderId,
        purchaseOrderNumber: saleFulfilment.purchaseOrderNumber,
        salesOrderLineItemId: saleFulfilment.salesOrderLineItemId,
        fulfilmentId: saleFulfilment.id,
        invoiceId: null,
      }),
    );
  });

  it('does not create delivery charge for SALE sales order when delivery_charge_in_cents is 0', async () => {
    const { sdk } = await createClient({
      userId,
    });

    const { createSalesOrder } = await sdk.CreateSalesOrder({
      input: {
        buyer_id: businessContactId,
        purchase_order_number: `PO-SALE-ZERO-CHARGE-${new Date().toISOString()}`,
        workspace_id: workspaceId,
      },
    });

    if (!createSalesOrder) throw new Error('Failed to create sales order');

    // Create sale line item with zero delivery charge
    const { createSaleSalesOrderLineItem: salesOrderLineItem } =
      await sdk.CreateSaleSalesOrderLineItem({
        input: {
          sales_order_id: createSalesOrder.id,
          price_id: salePriceId,
          so_quantity: 1,
          delivery_charge_in_cents: 0,
        },
      });

    if (!salesOrderLineItem?.id) {
      throw new Error('Failed to create sale sales order line item');
    }

    // Submit the sales order
    await sdk.SubmitSalesOrder({ id: createSalesOrder.id });

    // Get the fulfilment
    const { listFulfilments } = await sdk.ListFulfilments({
      filter: {
        workspaceId,
        salesOrderId: createSalesOrder.id,
      },
    });

    const saleFulfilment = listFulfilments?.items?.[0];
    if (!saleFulfilment || saleFulfilment.__typename !== 'SaleFulfilment') {
      throw new Error('Failed to find sale fulfilment');
    }

    // List charges - should only have sale charge, no delivery charge
    const { listCharges } = await sdk.ListCharges({
      filter: { workspaceId, fulfilmentId: saleFulfilment.id },
    });

    // Should have 1 charge (sale charge only)
    expect(listCharges?.items.length).toBe(1);
    expect(listCharges?.items[0].chargeType).toBe('SALE');
  });

  it('does not create delivery charge for SALE sales order when delivery_charge_in_cents is not set', async () => {
    const { sdk } = await createClient({
      userId,
    });

    const { createSalesOrder } = await sdk.CreateSalesOrder({
      input: {
        buyer_id: businessContactId,
        purchase_order_number: `PO-SALE-NO-CHARGE-${new Date().toISOString()}`,
        workspace_id: workspaceId,
      },
    });

    if (!createSalesOrder) throw new Error('Failed to create sales order');

    // Create sale line item without delivery charge
    const { createSaleSalesOrderLineItem: salesOrderLineItem } =
      await sdk.CreateSaleSalesOrderLineItem({
        input: {
          sales_order_id: createSalesOrder.id,
          price_id: salePriceId,
          so_quantity: 1,
          // delivery_charge_in_cents not set
        },
      });

    if (!salesOrderLineItem?.id) {
      throw new Error('Failed to create sale sales order line item');
    }

    // Submit the sales order
    await sdk.SubmitSalesOrder({ id: createSalesOrder.id });

    // Get the fulfilment
    const { listFulfilments } = await sdk.ListFulfilments({
      filter: {
        workspaceId,
        salesOrderId: createSalesOrder.id,
      },
    });

    const saleFulfilment = listFulfilments?.items?.[0];
    if (!saleFulfilment || saleFulfilment.__typename !== 'SaleFulfilment') {
      throw new Error('Failed to find sale fulfilment');
    }

    // List charges - should only have sale charge, no delivery charge
    const { listCharges } = await sdk.ListCharges({
      filter: { workspaceId, fulfilmentId: saleFulfilment.id },
    });

    // Should have 1 charge (sale charge only)
    expect(listCharges?.items.length).toBe(1);
    expect(listCharges?.items[0].chargeType).toBe('SALE');
  });
});
