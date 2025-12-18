import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { randomUUID } from 'crypto';
import { createInvoiceEventStore } from '../invoiceEventStore';

describe('InvoiceEventStore', () => {
  let client: MongoClient;
  let replSet: MongoMemoryReplSet;

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    client = await MongoClient.connect(replSet.getUri(), {});
  });

  afterAll(async () => {
    if (client) await client.close();
    if (replSet) await replSet.stop();
  });

  it('applies MARK_AS_SENT event and updates status and sent date', async () => {
    const eventStore = createInvoiceEventStore({ mongoClient: client });
    const id = randomUUID();
    const now = new Date();

    // Create the invoice
    const { state: created } = await eventStore.applyEvent(
      id,
      {
        type: 'CREATE_INVOICE',
        workspaceId: 'ws-1',
        companyId: 'company1',
        sellerId: 'seller1',
        buyerId: 'buyer1',
        invoiceNumber: 'INV-0001',
      },
      { principalId: 'user1' },
    );
    expect(created).toBeTruthy();
    expect(created?.status).toBe('DRAFT');
    // subTotalInCents should be 0 on creation
    expect(created?.subTotalInCents).toBe(0);

    // Mark as sent
    const { state: sent } = await eventStore.applyEvent(
      id,
      {
        type: 'MARK_AS_SENT',
        date: now,
      },
      { principalId: 'user2' },
    );
    expect(sent).toBeTruthy();
    expect(sent?.status).toBe('SENT');
    expect(sent?.invoiceSentDate?.getTime()).toBe(now.getTime());
    expect(sent?.updatedBy).toBe('user2');
    expect(sent?.updatedAt).toBeInstanceOf(Date);
  });

  it('applies MARK_AS_PAID event and updates status and paid date', async () => {
    const eventStore = createInvoiceEventStore({ mongoClient: client });
    const id = randomUUID();
    const now = new Date();

    // Create the invoice
    const { state: created } = await eventStore.applyEvent(
      id,
      {
        type: 'CREATE_INVOICE',
        workspaceId: 'ws-1',
        companyId: 'company1',
        sellerId: 'seller1',
        buyerId: 'buyer1',
        invoiceNumber: 'INV-0002',
      },
      { principalId: 'user1' },
    );
    expect(created).toBeTruthy();
    expect(created?.status).toBe('DRAFT');

    // Mark as paid
    const { state: paid } = await eventStore.applyEvent(
      id,
      {
        type: 'MARK_AS_PAID',
        date: now,
      },
      { principalId: 'user2' },
    );
    expect(paid).toBeTruthy();
    expect(paid?.status).toBe('PAID');
    expect(paid?.invoicePaidDate?.getTime()).toBe(now.getTime());
    expect(paid?.updatedBy).toBe('user2');
    expect(paid?.updatedAt).toBeInstanceOf(Date);
  });

  it('deletes an invoice and state becomes null', async () => {
    const eventStore = createInvoiceEventStore({ mongoClient: client });
    const id = randomUUID();

    // Create the invoice
    const { state: created } = await eventStore.applyEvent(
      id,
      {
        type: 'CREATE_INVOICE',
        workspaceId: 'ws-1',
        companyId: 'company2',
        sellerId: 'seller2',
        buyerId: 'buyer2',
        invoiceNumber: 'INV-0003',
      },
      { principalId: 'user3' },
    );
    expect(created).toBeTruthy();
    expect(created?.status).toBe('DRAFT');

    // Delete the invoice
    const { state: deleted } = await eventStore.applyEvent(
      id,
      {
        type: 'DELETE_INVOICE',
      },
      { principalId: 'user4' },
    );
    expect(deleted).toBeNull();

    // State document should be null
    const stateDoc = await eventStore.getStateDocument(id);
    expect(stateDoc).toBeNull();

    // The delete event should be persisted
    const events = await eventStore.getEventDocuments(id);
    expect(events.some((e) => e.payload.type === 'DELETE_INVOICE')).toBe(true);

    // Further deletion should throw
    await expect(
      eventStore.applyEvent(
        id,
        { type: 'DELETE_INVOICE' },
        { principalId: 'user4' },
      ),
    ).rejects.toThrow();
  });

  it('applies CANCEL_INVOICE event and updates status to CANCELLED', async () => {
    const eventStore = createInvoiceEventStore({ mongoClient: client });
    const id = randomUUID();

    // Create the invoice
    const { state: created } = await eventStore.applyEvent(
      id,
      {
        type: 'CREATE_INVOICE',
        workspaceId: 'ws-1',
        companyId: 'company3',
        sellerId: 'seller3',
        buyerId: 'buyer3',
        invoiceNumber: 'INV-0004',
      },
      { principalId: 'user5' },
    );
    expect(created).toBeTruthy();
    expect(created?.status).toBe('DRAFT');

    // Cancel the invoice
    const { state: cancelled } = await eventStore.applyEvent(
      id,
      {
        type: 'CANCEL_INVOICE',
      },
      { principalId: 'user6' },
    );
    expect(cancelled).toBeTruthy();
    expect(cancelled?.status).toBe('CANCELLED');
    expect(cancelled?.updatedBy).toBe('user6');
    expect(cancelled?.updatedAt).toBeInstanceOf(Date);

    // State document should reflect cancellation
    const stateDoc = await eventStore.getStateDocument(id);
    expect(stateDoc).toBeTruthy();
    expect(stateDoc?.status).toBe('CANCELLED');

    // The cancel event should be persisted
    const events = await eventStore.getEventDocuments(id);
    expect(events.some((e) => e.payload.type === 'CANCEL_INVOICE')).toBe(true);
  });

  it('applies ADD_CHARGE event and updates lineItems', async () => {
    const eventStore = createInvoiceEventStore({ mongoClient: client });
    const id = randomUUID();

    // Create the invoice
    const { state: created } = await eventStore.applyEvent(
      id,
      {
        type: 'CREATE_INVOICE',
        workspaceId: 'ws-1',
        companyId: 'company4',
        sellerId: 'seller4',
        buyerId: 'buyer4',
        invoiceNumber: 'INV-0005',
      },
      { principalId: 'user7' },
    );
    expect(created).toBeTruthy();
    expect(created?.status).toBe('DRAFT');
    expect(created?.lineItems).toBeUndefined();
    // subTotalInCents should be 0 on creation
    expect(created?.subTotalInCents).toBe(0);

    // Add a charge
    const charge1 = {
      chargeId: 'charge123',
      description: 'Test charge 1',
      totalInCents: 2500,
    };
    const { state: withCharge1 } = await eventStore.applyEvent(
      id,
      {
        type: 'ADD_CHARGE',
        ...charge1,
      },
      { principalId: 'user8' },
    );
    expect(withCharge1).toBeTruthy();
    expect(withCharge1?.lineItems).toBeDefined();
    expect(Array.isArray(withCharge1?.lineItems)).toBe(true);
    expect(withCharge1?.lineItems?.length).toBe(1);
    expect(withCharge1?.lineItems?.[0]).toMatchObject(charge1);
    // subTotalInCents should be updated to 2500
    expect(withCharge1?.subTotalInCents).toBe(2500);

    // Add a second charge
    const charge2 = {
      chargeId: 'charge124',
      description: 'Test charge 2',
      totalInCents: 1500,
    };
    const { state: withCharge2 } = await eventStore.applyEvent(
      id,
      {
        type: 'ADD_CHARGE',
        ...charge2,
      },
      { principalId: 'user9' },
    );
    expect(withCharge2).toBeTruthy();
    expect(withCharge2?.lineItems?.length).toBe(2);
    expect(withCharge2?.lineItems?.[1]).toMatchObject(charge2);
    // subTotalInCents should be updated to 4000
    expect(withCharge2?.subTotalInCents).toBe(4000);

    // Add a third charge
    const charge3 = {
      chargeId: 'charge125',
      description: 'Test charge 3',
      totalInCents: 1000,
    };
    const { state: withCharge3 } = await eventStore.applyEvent(
      id,
      {
        type: 'ADD_CHARGE',
        ...charge3,
      },
      { principalId: 'user10' },
    );
    expect(withCharge3).toBeTruthy();
    expect(withCharge3?.lineItems?.length).toBe(3);
    expect(withCharge3?.lineItems?.[2]).toMatchObject(charge3);
    // subTotalInCents should be updated to 5000
    expect(withCharge3?.subTotalInCents).toBe(5000);

    expect(withCharge3?.updatedBy).toBe('user10');
    expect(withCharge3?.updatedAt).toBeInstanceOf(Date);
  });

  describe('Tax Calculations', () => {
    it('applies ADD_TAX_LINE_ITEM event with percentage tax', async () => {
      const eventStore = createInvoiceEventStore({ mongoClient: client });
      const id = randomUUID();

      // Create the invoice
      const { state: created } = await eventStore.applyEvent(
        id,
        {
          type: 'CREATE_INVOICE',
          workspaceId: 'ws-1',
          companyId: 'company5',
          sellerId: 'seller5',
          buyerId: 'buyer5',
          invoiceNumber: 'INV-0006',
        },
        { principalId: 'user11' },
      );
      expect(created).toBeTruthy();
      expect(created?.taxLineItems).toEqual([]);
      expect(created?.totalTaxesInCents).toBe(0);

      // Add a charge first
      const { state: withCharge } = await eventStore.applyEvent(
        id,
        {
          type: 'ADD_CHARGE',
          chargeId: 'charge200',
          description: 'Test product',
          totalInCents: 10000, // $100
        },
        { principalId: 'user11' },
      );
      expect(withCharge?.subTotalInCents).toBe(10000);

      // Add a percentage tax (8.5%)
      const { state: withTax } = await eventStore.applyEvent(
        id,
        {
          type: 'ADD_TAX_LINE_ITEM',
          taxLineItem: {
            id: 'tax1',
            description: 'Sales Tax',
            type: 'PERCENTAGE',
            value: 0.085, // 8.5%
            order: 1,
          },
        },
        { principalId: 'user12' },
      );
      expect(withTax).toBeTruthy();
      expect(withTax?.taxLineItems?.length).toBe(1);
      expect(withTax?.taxLineItems?.[0]).toMatchObject({
        id: 'tax1',
        description: 'Sales Tax',
        type: 'PERCENTAGE',
        value: 0.085,
        order: 1,
        calculatedAmountInCents: 850, // 8.5% of 10000
      });
      expect(withTax?.totalTaxesInCents).toBe(850);
      expect(withTax?.finalSumInCents).toBe(10850); // 10000 + 850
    });

    it('applies ADD_TAX_LINE_ITEM event with fixed amount tax', async () => {
      const eventStore = createInvoiceEventStore({ mongoClient: client });
      const id = randomUUID();

      // Create invoice with a charge
      await eventStore.applyEvent(
        id,
        {
          type: 'CREATE_INVOICE',
          workspaceId: 'ws-1',
          companyId: 'company6',
          sellerId: 'seller6',
          buyerId: 'buyer6',
          invoiceNumber: 'INV-0007',
        },
        { principalId: 'user13' },
      );

      await eventStore.applyEvent(
        id,
        {
          type: 'ADD_CHARGE',
          chargeId: 'charge201',
          description: 'Test service',
          totalInCents: 5000, // $50
        },
        { principalId: 'user13' },
      );

      // Add a fixed amount tax
      const { state: withTax } = await eventStore.applyEvent(
        id,
        {
          type: 'ADD_TAX_LINE_ITEM',
          taxLineItem: {
            id: 'tax2',
            description: 'Environmental Fee',
            type: 'FIXED_AMOUNT',
            value: 250, // $2.50
            order: 1,
          },
        },
        { principalId: 'user14' },
      );
      expect(withTax).toBeTruthy();
      expect(withTax?.taxLineItems?.[0]).toMatchObject({
        id: 'tax2',
        description: 'Environmental Fee',
        type: 'FIXED_AMOUNT',
        value: 250,
        order: 1,
        calculatedAmountInCents: 250,
      });
      expect(withTax?.totalTaxesInCents).toBe(250);
      expect(withTax?.finalSumInCents).toBe(5250); // 5000 + 250
    });

    it('handles multiple tax line items with different types', async () => {
      const eventStore = createInvoiceEventStore({ mongoClient: client });
      const id = randomUUID();

      // Create invoice with charges
      await eventStore.applyEvent(
        id,
        {
          type: 'CREATE_INVOICE',
          workspaceId: 'ws-1',
          companyId: 'company7',
          sellerId: 'seller7',
          buyerId: 'buyer7',
          invoiceNumber: 'INV-0008',
        },
        { principalId: 'user15' },
      );

      await eventStore.applyEvent(
        id,
        {
          type: 'ADD_CHARGE',
          chargeId: 'charge202',
          description: 'Product A',
          totalInCents: 20000, // $200
        },
        { principalId: 'user15' },
      );

      // Add first tax - percentage
      await eventStore.applyEvent(
        id,
        {
          type: 'ADD_TAX_LINE_ITEM',
          taxLineItem: {
            id: 'tax3',
            description: 'State Tax',
            type: 'PERCENTAGE',
            value: 0.06, // 6%
            order: 1,
          },
        },
        { principalId: 'user15' },
      );

      // Add second tax - fixed amount
      await eventStore.applyEvent(
        id,
        {
          type: 'ADD_TAX_LINE_ITEM',
          taxLineItem: {
            id: 'tax4',
            description: 'Processing Fee',
            type: 'FIXED_AMOUNT',
            value: 500, // $5
            order: 2,
          },
        },
        { principalId: 'user15' },
      );

      // Add third tax - percentage
      const { state: withAllTaxes } = await eventStore.applyEvent(
        id,
        {
          type: 'ADD_TAX_LINE_ITEM',
          taxLineItem: {
            id: 'tax5',
            description: 'City Tax',
            type: 'PERCENTAGE',
            value: 0.025, // 2.5%
            order: 3,
          },
        },
        { principalId: 'user15' },
      );

      expect(withAllTaxes?.taxLineItems?.length).toBe(3);
      expect(withAllTaxes?.taxLineItems?.[0].calculatedAmountInCents).toBe(
        1200,
      ); // 6% of 20000
      expect(withAllTaxes?.taxLineItems?.[1].calculatedAmountInCents).toBe(500); // Fixed $5
      expect(withAllTaxes?.taxLineItems?.[2].calculatedAmountInCents).toBe(500); // 2.5% of 20000
      expect(withAllTaxes?.totalTaxesInCents).toBe(2200); // 1200 + 500 + 500
      expect(withAllTaxes?.finalSumInCents).toBe(22200); // 20000 + 2200
    });

    it('applies UPDATE_TAX_LINE_ITEM event', async () => {
      const eventStore = createInvoiceEventStore({ mongoClient: client });
      const id = randomUUID();

      // Create invoice with charge and tax
      await eventStore.applyEvent(
        id,
        {
          type: 'CREATE_INVOICE',
          workspaceId: 'ws-1',
          companyId: 'company8',
          sellerId: 'seller8',
          buyerId: 'buyer8',
          invoiceNumber: 'INV-0009',
        },
        { principalId: 'user16' },
      );

      await eventStore.applyEvent(
        id,
        {
          type: 'ADD_CHARGE',
          chargeId: 'charge203',
          description: 'Service',
          totalInCents: 15000, // $150
        },
        { principalId: 'user16' },
      );

      await eventStore.applyEvent(
        id,
        {
          type: 'ADD_TAX_LINE_ITEM',
          taxLineItem: {
            id: 'tax6',
            description: 'VAT',
            type: 'PERCENTAGE',
            value: 0.2, // 20%
            order: 1,
          },
        },
        { principalId: 'user16' },
      );

      // Update the tax
      const { state: updated } = await eventStore.applyEvent(
        id,
        {
          type: 'UPDATE_TAX_LINE_ITEM',
          taxLineItemId: 'tax6',
          updates: {
            description: 'Updated VAT',
            value: 0.15, // Change to 15%
          },
        },
        { principalId: 'user17' },
      );

      expect(updated?.taxLineItems?.[0]).toMatchObject({
        id: 'tax6',
        description: 'Updated VAT',
        type: 'PERCENTAGE',
        value: 0.15,
        order: 1,
        calculatedAmountInCents: 2250, // 15% of 15000
      });
      expect(updated?.totalTaxesInCents).toBe(2250);
      expect(updated?.finalSumInCents).toBe(17250); // 15000 + 2250
    });

    it('applies REMOVE_TAX_LINE_ITEM event', async () => {
      const eventStore = createInvoiceEventStore({ mongoClient: client });
      const id = randomUUID();

      // Create invoice with charge and multiple taxes
      await eventStore.applyEvent(
        id,
        {
          type: 'CREATE_INVOICE',
          workspaceId: 'ws-1',
          companyId: 'company9',
          sellerId: 'seller9',
          buyerId: 'buyer9',
          invoiceNumber: 'INV-0010',
        },
        { principalId: 'user18' },
      );

      await eventStore.applyEvent(
        id,
        {
          type: 'ADD_CHARGE',
          chargeId: 'charge204',
          description: 'Item',
          totalInCents: 10000, // $100
        },
        { principalId: 'user18' },
      );

      await eventStore.applyEvent(
        id,
        {
          type: 'ADD_TAX_LINE_ITEM',
          taxLineItem: {
            id: 'tax7',
            description: 'Tax 1',
            type: 'PERCENTAGE',
            value: 0.05, // 5%
            order: 1,
          },
        },
        { principalId: 'user18' },
      );

      await eventStore.applyEvent(
        id,
        {
          type: 'ADD_TAX_LINE_ITEM',
          taxLineItem: {
            id: 'tax8',
            description: 'Tax 2',
            type: 'FIXED_AMOUNT',
            value: 300, // $3
            order: 2,
          },
        },
        { principalId: 'user18' },
      );

      // Remove the first tax
      const { state: afterRemoval } = await eventStore.applyEvent(
        id,
        {
          type: 'REMOVE_TAX_LINE_ITEM',
          taxLineItemId: 'tax7',
        },
        { principalId: 'user19' },
      );

      expect(afterRemoval?.taxLineItems?.length).toBe(1);
      expect(afterRemoval?.taxLineItems?.[0].id).toBe('tax8');
      expect(afterRemoval?.totalTaxesInCents).toBe(300);
      expect(afterRemoval?.finalSumInCents).toBe(10300); // 10000 + 300
    });

    it('applies CLEAR_TAXES event', async () => {
      const eventStore = createInvoiceEventStore({ mongoClient: client });
      const id = randomUUID();

      // Create invoice with charge and taxes
      await eventStore.applyEvent(
        id,
        {
          type: 'CREATE_INVOICE',
          workspaceId: 'ws-1',
          companyId: 'company10',
          sellerId: 'seller10',
          buyerId: 'buyer10',
          invoiceNumber: 'INV-0011',
        },
        { principalId: 'user20' },
      );

      await eventStore.applyEvent(
        id,
        {
          type: 'ADD_CHARGE',
          chargeId: 'charge205',
          description: 'Product',
          totalInCents: 25000, // $250
        },
        { principalId: 'user20' },
      );

      await eventStore.applyEvent(
        id,
        {
          type: 'ADD_TAX_LINE_ITEM',
          taxLineItem: {
            id: 'tax9',
            description: 'Tax A',
            type: 'PERCENTAGE',
            value: 0.1,
            order: 1,
          },
        },
        { principalId: 'user20' },
      );

      await eventStore.applyEvent(
        id,
        {
          type: 'ADD_TAX_LINE_ITEM',
          taxLineItem: {
            id: 'tax10',
            description: 'Tax B',
            type: 'FIXED_AMOUNT',
            value: 1000,
            order: 2,
          },
        },
        { principalId: 'user20' },
      );

      // Clear all taxes
      const { state: cleared } = await eventStore.applyEvent(
        id,
        {
          type: 'CLEAR_TAXES',
        },
        { principalId: 'user21' },
      );

      expect(cleared?.taxLineItems).toEqual([]);
      expect(cleared?.totalTaxesInCents).toBe(0);
      expect(cleared?.finalSumInCents).toBe(25000); // Just the subtotal
    });

    it('recalculates taxes when charges are added after taxes', async () => {
      const eventStore = createInvoiceEventStore({ mongoClient: client });
      const id = randomUUID();

      // Create invoice
      await eventStore.applyEvent(
        id,
        {
          type: 'CREATE_INVOICE',
          workspaceId: 'ws-1',
          companyId: 'company11',
          sellerId: 'seller11',
          buyerId: 'buyer11',
          invoiceNumber: 'INV-0012',
        },
        { principalId: 'user22' },
      );

      // Add tax first
      await eventStore.applyEvent(
        id,
        {
          type: 'ADD_TAX_LINE_ITEM',
          taxLineItem: {
            id: 'tax11',
            description: 'Sales Tax',
            type: 'PERCENTAGE',
            value: 0.08, // 8%
            order: 1,
          },
        },
        { principalId: 'user22' },
      );

      // Add first charge
      const { state: withFirstCharge } = await eventStore.applyEvent(
        id,
        {
          type: 'ADD_CHARGE',
          chargeId: 'charge206',
          description: 'Item 1',
          totalInCents: 5000, // $50
        },
        { principalId: 'user22' },
      );

      expect(withFirstCharge?.totalTaxesInCents).toBe(400); // 8% of 5000
      expect(withFirstCharge?.finalSumInCents).toBe(5400);

      // Add second charge
      const { state: withSecondCharge } = await eventStore.applyEvent(
        id,
        {
          type: 'ADD_CHARGE',
          chargeId: 'charge207',
          description: 'Item 2',
          totalInCents: 10000, // $100
        },
        { principalId: 'user22' },
      );

      expect(withSecondCharge?.subTotalInCents).toBe(15000); // 5000 + 10000
      expect(withSecondCharge?.totalTaxesInCents).toBe(1200); // 8% of 15000
      expect(withSecondCharge?.finalSumInCents).toBe(16200); // 15000 + 1200
    });

    it('handles tax order correctly', async () => {
      const eventStore = createInvoiceEventStore({ mongoClient: client });
      const id = randomUUID();

      // Create invoice with charge
      await eventStore.applyEvent(
        id,
        {
          type: 'CREATE_INVOICE',
          workspaceId: 'ws-1',
          companyId: 'company12',
          sellerId: 'seller12',
          buyerId: 'buyer12',
          invoiceNumber: 'INV-0013',
        },
        { principalId: 'user23' },
      );

      await eventStore.applyEvent(
        id,
        {
          type: 'ADD_CHARGE',
          chargeId: 'charge208',
          description: 'Product',
          totalInCents: 10000, // $100
        },
        { principalId: 'user23' },
      );

      // Add taxes in reverse order
      await eventStore.applyEvent(
        id,
        {
          type: 'ADD_TAX_LINE_ITEM',
          taxLineItem: {
            id: 'tax13',
            description: 'Third Tax',
            type: 'FIXED_AMOUNT',
            value: 200,
            order: 3,
          },
        },
        { principalId: 'user23' },
      );

      await eventStore.applyEvent(
        id,
        {
          type: 'ADD_TAX_LINE_ITEM',
          taxLineItem: {
            id: 'tax12',
            description: 'First Tax',
            type: 'PERCENTAGE',
            value: 0.05,
            order: 1,
          },
        },
        { principalId: 'user23' },
      );

      const { state: final } = await eventStore.applyEvent(
        id,
        {
          type: 'ADD_TAX_LINE_ITEM',
          taxLineItem: {
            id: 'tax14',
            description: 'Second Tax',
            type: 'PERCENTAGE',
            value: 0.03,
            order: 2,
          },
        },
        { principalId: 'user23' },
      );

      // Verify taxes are sorted by order
      expect(final?.taxLineItems?.map((t) => t.description)).toEqual([
        'First Tax',
        'Second Tax',
        'Third Tax',
      ]);
      expect(final?.taxLineItems?.[0].calculatedAmountInCents).toBe(500); // 5% of 10000
      expect(final?.taxLineItems?.[1].calculatedAmountInCents).toBe(300); // 3% of 10000
      expect(final?.taxLineItems?.[2].calculatedAmountInCents).toBe(200); // Fixed 200
      expect(final?.totalTaxesInCents).toBe(1000); // 500 + 300 + 200
    });

    it('handles edge case with no charges but taxes present', async () => {
      const eventStore = createInvoiceEventStore({ mongoClient: client });
      const id = randomUUID();

      // Create invoice
      await eventStore.applyEvent(
        id,
        {
          type: 'CREATE_INVOICE',
          workspaceId: 'ws-1',
          companyId: 'company13',
          sellerId: 'seller13',
          buyerId: 'buyer13',
          invoiceNumber: 'INV-0014',
        },
        { principalId: 'user24' },
      );

      // Add tax without any charges
      const { state: withTax } = await eventStore.applyEvent(
        id,
        {
          type: 'ADD_TAX_LINE_ITEM',
          taxLineItem: {
            id: 'tax15',
            description: 'Sales Tax',
            type: 'PERCENTAGE',
            value: 0.1,
            order: 1,
          },
        },
        { principalId: 'user24' },
      );

      expect(withTax?.subTotalInCents).toBe(0);
      expect(withTax?.totalTaxesInCents).toBe(0); // 10% of 0
      expect(withTax?.finalSumInCents).toBe(0);
    });
  });
});
