import { createTestEnvironment } from './test-environment';
import { TaxType, WorkspaceAccessType } from './generated/graphql';

// GraphQL operations for codegen
import { gql } from 'graphql-request';

gql`
  mutation CreateWorkspaceForInvoice(
    $name: String!
    $accessType: WorkspaceAccessType!
  ) {
    createWorkspace(name: $name, accessType: $accessType) {
      id
      name
    }
  }
`;

gql`
  mutation AddTaxLineItem($input: AddTaxLineItemInput!) {
    addTaxLineItem(input: $input) {
      id
      taxLineItems {
        id
        description
        type
        value
        calculatedAmountInCents
        order
      }
      totalTaxesInCents
      finalSumInCents
    }
  }
`;

gql`
  mutation UpdateTaxLineItem($input: UpdateTaxLineItemInput!) {
    updateTaxLineItem(input: $input) {
      id
      taxLineItems {
        id
        description
        type
        value
        calculatedAmountInCents
        order
      }
      totalTaxesInCents
      finalSumInCents
    }
  }
`;

gql`
  mutation RemoveTaxLineItem($input: RemoveTaxLineItemInput!) {
    removeTaxLineItem(input: $input) {
      id
      taxLineItems {
        id
        description
        type
        value
        calculatedAmountInCents
        order
      }
      totalTaxesInCents
      finalSumInCents
    }
  }
`;

gql`
  mutation ClearInvoiceTaxes($invoiceId: ID!) {
    clearInvoiceTaxes(invoiceId: $invoiceId) {
      id
      taxLineItems {
        id
      }
      totalTaxesInCents
      finalSumInCents
    }
  }
`;

gql`
  query InvoiceByIdWithTaxes($id: String!) {
    invoiceById(id: $id) {
      id
      status
      invoicePaidDate
      updatedBy
      subTotalInCents
      taxesInCents
      finalSumInCents
      taxPercent
      totalTaxesInCents
      taxLineItems {
        id
        description
        type
        value
        calculatedAmountInCents
        order
      }
      lineItems {
        chargeId
        description
        totalInCents
      }
    }
  }
`;

const { createClient } = createTestEnvironment();

// Helper function to create workspace and invoice
async function createWorkspaceAndInvoice(
  sdk: any,
  buyerId: string,
  sellerId: string,
) {
  // Create a workspace
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: `Invoice Tax Test Workspace ${Date.now()}`,
  });
  if (!createWorkspace) throw new Error('Workspace was not created');

  // Create invoice
  const createInput = {
    workspaceId: createWorkspace.id,
    buyerId,
    sellerId,
  };
  const { createInvoice } = await sdk.CreateInvoice({ input: createInput });
  return { createWorkspace, createInvoice };
}

describe('Invoice Tax Line Items e2e', () => {
  it('adds percentage and fixed amount tax line items to an invoice', async () => {
    const { sdk } = await createClient();

    // Create workspace and invoice
    const { createWorkspace, createInvoice } = await createWorkspaceAndInvoice(
      sdk,
      'buyer1',
      'seller1',
    );
    expect(createInvoice).toBeDefined();
    const invoiceId = createInvoice!.id;

    // Create charges
    const chargesToCreate = [
      {
        description: 'Excavator Rental - 5 days',
        amountInCents: 50000, // $500
        contactId: 'contact1',
        chargeType: 'RENTAL' as any,
      },
    ];
    const chargeIds: string[] = [];
    for (const charge of chargesToCreate) {
      const { createCharge } = await sdk.CreateCharge({
        input: {
          workspaceId: createWorkspace.id,
          description: charge.description,
          amountInCents: charge.amountInCents,
          contactId: charge.contactId,
          chargeType: charge.chargeType,
        },
      });
      expect(createCharge).toBeDefined();
      if (createCharge) {
        chargeIds.push(createCharge.id);
      }
    }

    // Add charges to invoice
    await sdk.AddInvoiceCharges({
      input: { invoiceId, chargeIds },
    });

    // Add percentage tax (8.5% state tax)
    const { addTaxLineItem: stateTax } = await sdk.AddTaxLineItem({
      input: {
        invoiceId,
        description: 'State Tax',
        type: TaxType.Percentage,
        value: 0.085, // 8.5%
        order: 1,
      },
    });
    expect(stateTax).toBeDefined();
    expect(stateTax.taxLineItems).toHaveLength(1);
    expect(stateTax.taxLineItems[0].type).toBe('PERCENTAGE');
    expect(stateTax.taxLineItems[0].value).toBe(0.085);
    // The calculated amount might be null initially, but should be calculated after adding charges
    expect(stateTax.taxLineItems[0].calculatedAmountInCents).toBeDefined();

    // Add fixed amount tax ($12)
    const { addTaxLineItem: fixedTax } = await sdk.AddTaxLineItem({
      input: {
        invoiceId,
        description: 'Environmental Fee',
        type: TaxType.FixedAmount,
        value: 1200, // $12 in cents
        order: 2,
      },
    });
    expect(fixedTax).toBeDefined();
    expect(fixedTax.taxLineItems).toHaveLength(2);
    expect(fixedTax.taxLineItems[1].type).toBe('FIXED_AMOUNT');
    expect(fixedTax.taxLineItems[1].value).toBe(1200);
    expect(fixedTax.taxLineItems[1].calculatedAmountInCents).toBeDefined();

    // Verify total taxes and final sum
    expect(fixedTax.totalTaxesInCents).toBe(5450); // $42.50 + $12 = $54.50
    expect(fixedTax.finalSumInCents).toBe(55450); // $500 + $54.50 = $554.50

    // Fetch invoice to verify
    const { invoiceById } = await sdk.InvoiceByIdWithTaxes({ id: invoiceId });
    expect(invoiceById).toBeDefined();
    expect(invoiceById?.taxLineItems).toHaveLength(2);
    expect(invoiceById?.totalTaxesInCents).toBe(5450);
    expect(invoiceById?.finalSumInCents).toBe(55450);
  });

  it('updates a tax line item', async () => {
    const { sdk } = await createClient();

    // Create workspace and invoice with charges
    const { createWorkspace, createInvoice } = await createWorkspaceAndInvoice(
      sdk,
      'buyer2',
      'seller2',
    );
    const invoiceId = createInvoice!.id;

    // Add a charge
    const { createCharge } = await sdk.CreateCharge({
      input: {
        workspaceId: createWorkspace.id,
        description: 'Service',
        amountInCents: 10000, // $100
        contactId: 'contact1',
        chargeType: 'SERVICE' as any,
      },
    });
    await sdk.AddInvoiceCharges({
      input: { invoiceId, chargeIds: [createCharge!.id] },
    });

    // Add a tax
    const { addTaxLineItem } = await sdk.AddTaxLineItem({
      input: {
        invoiceId,
        description: 'Sales Tax',
        type: TaxType.Percentage,
        value: 0.1, // 10%
        order: 1,
      },
    });
    const taxLineItemId = addTaxLineItem.taxLineItems[0].id;

    // Update the tax
    const { updateTaxLineItem } = await sdk.UpdateTaxLineItem({
      input: {
        invoiceId,
        taxLineItemId,
        description: 'Updated Sales Tax',
        value: 0.15, // 15%
      },
    });
    expect(updateTaxLineItem).toBeDefined();
    expect(updateTaxLineItem.taxLineItems[0].description).toBe(
      'Updated Sales Tax',
    );
    expect(updateTaxLineItem.taxLineItems[0].value).toBe(0.15);
    expect(
      updateTaxLineItem.taxLineItems[0].calculatedAmountInCents,
    ).toBeDefined();
    expect(updateTaxLineItem.totalTaxesInCents).toBe(1500);
    expect(updateTaxLineItem.finalSumInCents).toBe(11500); // $100 + $15 = $115
  });

  it('removes a tax line item', async () => {
    const { sdk } = await createClient();

    // Create workspace and invoice with charges
    const { createWorkspace, createInvoice } = await createWorkspaceAndInvoice(
      sdk,
      'buyer3',
      'seller3',
    );
    const invoiceId = createInvoice!.id;

    // Add a charge
    const { createCharge } = await sdk.CreateCharge({
      input: {
        workspaceId: createWorkspace.id,
        description: 'Service',
        amountInCents: 10000, // $100
        contactId: 'contact1',
        chargeType: 'SERVICE' as any,
      },
    });
    await sdk.AddInvoiceCharges({
      input: { invoiceId, chargeIds: [createCharge!.id] },
    });

    // Add two taxes
    const { addTaxLineItem: tax1 } = await sdk.AddTaxLineItem({
      input: {
        invoiceId,
        description: 'State Tax',
        type: TaxType.Percentage,
        value: 0.08,
        order: 1,
      },
    });
    const { addTaxLineItem: tax2 } = await sdk.AddTaxLineItem({
      input: {
        invoiceId,
        description: 'City Tax',
        type: TaxType.Percentage,
        value: 0.02,
        order: 2,
      },
    });
    expect(tax2.taxLineItems).toHaveLength(2);
    expect(tax2.totalTaxesInCents).toBe(1000); // $100 * 10% = $10

    // Remove the first tax
    const taxLineItemId = tax1.taxLineItems[0].id;
    const { removeTaxLineItem } = await sdk.RemoveTaxLineItem({
      input: {
        invoiceId,
        taxLineItemId,
      },
    });
    expect(removeTaxLineItem).toBeDefined();
    expect(removeTaxLineItem.taxLineItems).toHaveLength(1);
    expect(removeTaxLineItem.taxLineItems[0].description).toBe('City Tax');
    expect(removeTaxLineItem.totalTaxesInCents).toBe(200); // $100 * 2% = $2
    expect(removeTaxLineItem.finalSumInCents).toBe(10200); // $100 + $2 = $102
  });

  it('clears all taxes from an invoice', async () => {
    const { sdk } = await createClient();

    // Create workspace and invoice with charges
    const { createWorkspace, createInvoice } = await createWorkspaceAndInvoice(
      sdk,
      'buyer4',
      'seller4',
    );
    const invoiceId = createInvoice!.id;

    // Add a charge
    const { createCharge } = await sdk.CreateCharge({
      input: {
        workspaceId: createWorkspace.id,
        description: 'Service',
        amountInCents: 10000, // $100
        contactId: 'contact1',
        chargeType: 'SERVICE' as any,
      },
    });
    await sdk.AddInvoiceCharges({
      input: { invoiceId, chargeIds: [createCharge!.id] },
    });

    // Add multiple taxes
    await sdk.AddTaxLineItem({
      input: {
        invoiceId,
        description: 'State Tax',
        type: TaxType.Percentage,
        value: 0.08,
        order: 1,
      },
    });
    await sdk.AddTaxLineItem({
      input: {
        invoiceId,
        description: 'Environmental Fee',
        type: TaxType.FixedAmount,
        value: 500,
        order: 2,
      },
    });

    // Clear all taxes
    const { clearInvoiceTaxes } = await sdk.ClearInvoiceTaxes({ invoiceId });
    expect(clearInvoiceTaxes).toBeDefined();
    expect(clearInvoiceTaxes.taxLineItems).toHaveLength(0);
    expect(clearInvoiceTaxes.totalTaxesInCents).toBe(0);
    expect(clearInvoiceTaxes.finalSumInCents).toBe(10000); // Just the subtotal
  });

  describe('Tax percentage validation', () => {
    it('should reject tax percentage greater than 1', async () => {
      const { sdk } = await createClient();

      // Create workspace and invoice
      const { createInvoice } = await createWorkspaceAndInvoice(
        sdk,
        'buyer5',
        'seller5',
      );
      const invoiceId = createInvoice!.id;

      // Try to add tax with percentage > 1
      await expect(
        sdk.AddTaxLineItem({
          input: {
            invoiceId,
            description: 'Invalid Tax',
            type: TaxType.Percentage,
            value: 1.5, // 150% - should be rejected
            order: 1,
          },
        }),
      ).rejects.toThrow(/Tax percentage must be between 0 and 1/);
    });

    it('should reject negative tax percentage', async () => {
      const { sdk } = await createClient();

      // Create workspace and invoice
      const { createInvoice } = await createWorkspaceAndInvoice(
        sdk,
        'buyer6',
        'seller6',
      );
      const invoiceId = createInvoice!.id;

      // Try to add tax with negative percentage
      await expect(
        sdk.AddTaxLineItem({
          input: {
            invoiceId,
            description: 'Negative Tax',
            type: TaxType.Percentage,
            value: -0.05, // -5% - should be rejected
            order: 1,
          },
        }),
      ).rejects.toThrow(/Tax percentage must be between 0 and 1/);
    });

    it('should accept tax percentage of exactly 0', async () => {
      const { sdk } = await createClient();

      // Create workspace and invoice
      const { createInvoice } = await createWorkspaceAndInvoice(
        sdk,
        'buyer7',
        'seller7',
      );
      const invoiceId = createInvoice!.id;

      // Add tax with 0%
      const { addTaxLineItem } = await sdk.AddTaxLineItem({
        input: {
          invoiceId,
          description: 'Zero Tax',
          type: TaxType.Percentage,
          value: 0, // 0% - should be accepted
          order: 1,
        },
      });

      expect(addTaxLineItem).toBeDefined();
      expect(addTaxLineItem.taxLineItems[0].value).toBe(0);
    });

    it('should accept tax percentage of exactly 1', async () => {
      const { sdk } = await createClient();

      // Create workspace and invoice
      const { createInvoice } = await createWorkspaceAndInvoice(
        sdk,
        'buyer8',
        'seller8',
      );
      const invoiceId = createInvoice!.id;

      // Add tax with 100%
      const { addTaxLineItem } = await sdk.AddTaxLineItem({
        input: {
          invoiceId,
          description: 'Full Tax',
          type: TaxType.Percentage,
          value: 1, // 100% - should be accepted
          order: 1,
        },
      });

      expect(addTaxLineItem).toBeDefined();
      expect(addTaxLineItem.taxLineItems[0].value).toBe(1);
    });

    it('should reject tax percentage update to value greater than 1', async () => {
      const { sdk } = await createClient();

      // Create workspace and invoice
      const { createInvoice } = await createWorkspaceAndInvoice(
        sdk,
        'buyer9',
        'seller9',
      );
      const invoiceId = createInvoice!.id;

      // Add valid tax first
      const { addTaxLineItem } = await sdk.AddTaxLineItem({
        input: {
          invoiceId,
          description: 'Valid Tax',
          type: TaxType.Percentage,
          value: 0.1, // 10%
          order: 1,
        },
      });
      const taxLineItemId = addTaxLineItem.taxLineItems[0].id;

      // Try to update to invalid percentage
      await expect(
        sdk.UpdateTaxLineItem({
          input: {
            invoiceId,
            taxLineItemId,
            value: 2, // 200% - should be rejected
          },
        }),
      ).rejects.toThrow(/Tax percentage must be between 0 and 1/);
    });

    it('should reject tax percentage update to negative value', async () => {
      const { sdk } = await createClient();

      // Create workspace and invoice
      const { createInvoice } = await createWorkspaceAndInvoice(
        sdk,
        'buyer10',
        'seller10',
      );
      const invoiceId = createInvoice!.id;

      // Add valid tax first
      const { addTaxLineItem } = await sdk.AddTaxLineItem({
        input: {
          invoiceId,
          description: 'Valid Tax',
          type: TaxType.Percentage,
          value: 0.1, // 10%
          order: 1,
        },
      });
      const taxLineItemId = addTaxLineItem.taxLineItems[0].id;

      // Try to update to negative percentage
      await expect(
        sdk.UpdateTaxLineItem({
          input: {
            invoiceId,
            taxLineItemId,
            value: -0.1, // -10% - should be rejected
          },
        }),
      ).rejects.toThrow(/Tax percentage must be between 0 and 1/);
    });
  });
});
