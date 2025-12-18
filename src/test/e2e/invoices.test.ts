import { createTestEnvironment } from './test-environment';
import { TaxType, ChargeType, WorkspaceAccessType } from './generated/graphql';

// GraphQL operations for codegen (for reference, not used directly in tests)
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
  mutation CreateInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
      id
      status
      buyerId
      sellerId
      companyId
      invoiceSentDate
      updatedBy
    }
  }
`;

gql`
  mutation MarkInvoiceAsSent($input: MarkInvoiceAsSentInput!) {
    markInvoiceAsSent(input: $input) {
      id
      status
      invoiceSentDate
      updatedBy
    }
  }
`;

gql`
  mutation DeleteInvoice($id: String!) {
    deleteInvoice(id: $id)
  }
`;

gql`
  mutation MarkInvoiceAsPaid($input: MarkInvoiceAsPaidInput!) {
    markInvoiceAsPaid(input: $input) {
      id
      status
      invoicePaidDate
      updatedBy
    }
  }
`;

gql`
  mutation CancelInvoice($input: CancelInvoiceInput!) {
    cancelInvoice(input: $input) {
      id
      status
      updatedBy
    }
  }
`;

gql`
  query InvoiceById($id: String!) {
    invoiceById(id: $id) {
      id
      status
      invoicePaidDate
      updatedBy
      subTotalInCents
      taxesInCents
      finalSumInCents
      taxPercent
      lineItems {
        chargeId
        description
        totalInCents
        charge {
          id
          amountInCents
          description
          chargeType
          contactId
          invoiceId
        }
      }
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
  mutation AddInvoiceCharges($input: AddInvoiceChargesInput!) {
    addInvoiceCharges(input: $input) {
      id
      lineItems {
        chargeId
        description
        totalInCents
      }
    }
  }
`;

gql`
  mutation CreateChargeForInvoice($input: CreateChargeInput!) {
    createCharge(input: $input) {
      id
      amountInCents
      description
      chargeType
      contactId
      invoiceId
    }
  }
`;

gql`
  query ListChargesForInvoice(
    $filter: ListChargesFilter!
    $page: PageInfoInput
  ) {
    listCharges(filter: $filter, page: $page) {
      items {
        id
        amountInCents
        description
        chargeType
        contactId
        invoiceId
      }
      page {
        number
        size
        totalItems
        totalPages
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
    name: `Invoice Test Workspace ${Date.now()}`,
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

describe('Invoice CRUD e2e', () => {
  it('creates and deletes a draft invoice', async () => {
    const { sdk } = await createClient();

    // Create a workspace
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'Invoice Test Workspace',
    });
    if (!createWorkspace) throw new Error('Workspace was not created');

    // Create
    const createInput = {
      workspaceId: createWorkspace.id,
      buyerId: 'buyer1',
      sellerId: 'seller1',
    };
    const { createInvoice } = await sdk.CreateInvoice({ input: createInput });
    expect(createInvoice).toBeDefined();
    expect(createInvoice?.status).toBe('DRAFT');
    const invoiceId = createInvoice!.id;

    // Delete (should succeed for DRAFT invoice)
    const { deleteInvoice } = await sdk.DeleteInvoice({ id: invoiceId });
    expect(deleteInvoice).toBe(true);
  });

  it('creates, marks as sent, and cannot delete', async () => {
    const { sdk } = await createClient();

    // Create workspace and invoice
    const { createInvoice } = await createWorkspaceAndInvoice(
      sdk,
      'buyer1b',
      'seller1b',
    );
    expect(createInvoice).toBeDefined();
    expect(createInvoice?.status).toBe('DRAFT');
    const invoiceId = createInvoice!.id;

    // Mark as sent
    const now = new Date().toISOString();
    const { markInvoiceAsSent } = await sdk.MarkInvoiceAsSent({
      input: { invoiceId, date: now },
    });
    expect(markInvoiceAsSent).toBeDefined();
    expect(markInvoiceAsSent?.status).toBe('SENT');
    expect(new Date(markInvoiceAsSent!.invoiceSentDate).toISOString()).toBe(
      now,
    );

    // Try to delete (should fail for SENT invoice)
    const { deleteInvoice } = await sdk.DeleteInvoice({ id: invoiceId });
    expect(deleteInvoice).toBe(false);
  });

  it('throws when marking a non-existent invoice as sent', async () => {
    const { sdk } = await createClient();
    const now = new Date().toISOString();
    await expect(
      sdk.MarkInvoiceAsSent({
        input: { invoiceId: 'nonexistent-id', date: now },
      }),
    ).rejects.toThrow();
  });

  it('throws when deleting a non-existent invoice', async () => {
    const { sdk } = await createClient();
    await expect(
      (await sdk.DeleteInvoice({ id: 'nonexistent-id' })).deleteInvoice,
    ).toBe(false);
  });

  it('marks an invoice as paid via GraphQL', async () => {
    const { sdk } = await createClient();

    // Create workspace and invoice
    const { createInvoice } = await createWorkspaceAndInvoice(
      sdk,
      'buyer1',
      'seller1',
    );
    expect(createInvoice).toBeDefined();
    expect(createInvoice?.status).toBe('DRAFT');
    const invoiceId = createInvoice!.id;

    // Mark as paid
    const now = new Date().toISOString();
    const { markInvoiceAsPaid } = await sdk.MarkInvoiceAsPaid({
      input: { invoiceId, date: now },
    });
    expect(markInvoiceAsPaid).toBeDefined();
    expect(markInvoiceAsPaid?.status).toBe('PAID');
    expect(new Date(markInvoiceAsPaid!.invoicePaidDate).toISOString()).toBe(
      now,
    );

    // Fetch invoice and check status/paid date
    const { invoiceById } = await sdk.InvoiceById({ id: invoiceId });
    expect(invoiceById).toBeDefined();
    expect(invoiceById?.status).toBe('PAID');
    expect(new Date(invoiceById!.invoicePaidDate).toISOString()).toBe(now);
  });

  it('cancels an invoice via GraphQL', async () => {
    const { sdk } = await createClient();

    // Create workspace and invoice
    const { createInvoice } = await createWorkspaceAndInvoice(
      sdk,
      'buyer2',
      'seller2',
    );
    expect(createInvoice).toBeDefined();
    expect(createInvoice?.status).toBe('DRAFT');
    const invoiceId = createInvoice!.id;

    // Cancel invoice
    const { cancelInvoice } = await sdk.CancelInvoice({
      input: { invoiceId },
    });
    expect(cancelInvoice).toBeDefined();
    expect(cancelInvoice?.status).toBe('CANCELLED');
    expect(cancelInvoice?.updatedBy).toBeDefined();

    // Fetch invoice and check status
    const { invoiceById } = await sdk.InvoiceById({ id: invoiceId });
    expect(invoiceById).toBeDefined();
    expect(invoiceById?.status).toBe('CANCELLED');
  });

  it('adds charges to an invoice via addInvoiceCharges mutation', async () => {
    const { sdk } = await createClient();

    // Create workspace and invoice
    const { createWorkspace, createInvoice } = await createWorkspaceAndInvoice(
      sdk,
      'buyer3',
      'seller3',
    );
    expect(createInvoice).toBeDefined();
    expect(createInvoice?.status).toBe('DRAFT');
    const invoiceId = createInvoice!.id;

    // Create charges
    const chargesToCreate = [
      {
        description: 'Excavator Rental - 5 days',
        amountInCents: 14500,
        contactId: 'contact1',
        chargeType: 'RENTAL' as any,
      },
      {
        description: 'Excavator Rental - 3 days',
        amountInCents: 14500,
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

    // Add charges
    const { addInvoiceCharges } = await sdk.AddInvoiceCharges({
      input: { invoiceId, chargeIds },
    });
    expect(addInvoiceCharges).toBeDefined();
    expect(Array.isArray(addInvoiceCharges.lineItems)).toBe(true);
    expect(addInvoiceCharges.lineItems?.length).toBe(2);
    expect(addInvoiceCharges.lineItems?.[0]?.chargeId).toBe(chargeIds[0]);
    expect(addInvoiceCharges.lineItems?.[1]?.chargeId).toBe(chargeIds[1]);

    // Fetch invoice and check lineItems
    const { invoiceById } = await sdk.InvoiceById({ id: invoiceId });
    expect(invoiceById).toBeDefined();
    expect(Array.isArray(invoiceById?.lineItems)).toBe(true);
    expect(invoiceById?.lineItems?.length).toBe(2);
    expect(invoiceById?.lineItems?.[0]?.chargeId).toBe(chargeIds[0]);
    expect(invoiceById?.lineItems?.[1]?.chargeId).toBe(chargeIds[1]);

    expect(invoiceById?.lineItems?.[0]?.description).toContain(
      'Excavator Rental - 5 days',
    );
    expect(invoiceById?.lineItems?.[1]?.description).toContain(
      'Excavator Rental - 3 days',
    );
    expect(invoiceById?.lineItems?.[0]?.totalInCents).toBe(14500);

    // Verify charge field is resolved correctly through dataloader
    expect(invoiceById?.lineItems?.[0]?.charge).toBeDefined();
    expect(invoiceById?.lineItems?.[0]?.charge?.id).toBe(chargeIds[0]);
    expect(invoiceById?.lineItems?.[0]?.charge?.amountInCents).toBe(14500);
    expect(invoiceById?.lineItems?.[0]?.charge?.description).toBe(
      'Excavator Rental - 5 days',
    );
    expect(invoiceById?.lineItems?.[0]?.charge?.chargeType).toBe('RENTAL');
    expect(invoiceById?.lineItems?.[0]?.charge?.contactId).toBe('contact1');
    expect(invoiceById?.lineItems?.[0]?.charge?.invoiceId).toBe(invoiceId);

    expect(invoiceById?.lineItems?.[1]?.charge).toBeDefined();
    expect(invoiceById?.lineItems?.[1]?.charge?.id).toBe(chargeIds[1]);
    expect(invoiceById?.lineItems?.[1]?.charge?.amountInCents).toBe(14500);
    expect(invoiceById?.lineItems?.[1]?.charge?.description).toBe(
      'Excavator Rental - 3 days',
    );
    expect(invoiceById?.lineItems?.[1]?.charge?.chargeType).toBe('RENTAL');
    expect(invoiceById?.lineItems?.[1]?.charge?.contactId).toBe('contact1');
    expect(invoiceById?.lineItems?.[1]?.charge?.invoiceId).toBe(invoiceId);
  });

  it('creates an invoice, sets tax to 25%, adds line items, and validates totals and taxes', async () => {
    const { sdk } = await createClient();

    // Create workspace and invoice
    const { createWorkspace, createInvoice } = await createWorkspaceAndInvoice(
      sdk,
      'buyer4',
      'seller4',
    );
    expect(createInvoice).toBeDefined();
    expect(createInvoice?.status).toBe('DRAFT');
    const invoiceId = createInvoice!.id;

    // Create charges
    const chargesToCreate = [
      {
        description: 'Excavator Rental - 5 days',
        amountInCents: 14500,
        contactId: 'contact1',
        chargeType: 'RENTAL' as any,
      },
      {
        description: 'Excavator Rental - 5 days',
        amountInCents: 14500,
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

    // Add charges first (needed for tax calculation)
    const { addInvoiceCharges } = await sdk.AddInvoiceCharges({
      input: { invoiceId, chargeIds },
    });
    expect(addInvoiceCharges).toBeDefined();
    expect(addInvoiceCharges.lineItems?.length).toBe(2);

    // Add tax line item for 25%
    const { addTaxLineItem } = await sdk.AddTaxLineItem({
      input: {
        invoiceId,
        description: 'Sales Tax',
        type: TaxType.Percentage,
        value: 0.25, // 25%
        order: 1,
      },
    });
    expect(addTaxLineItem).toBeDefined();
    expect(addTaxLineItem.taxLineItems).toHaveLength(1);
    expect(addTaxLineItem.taxLineItems[0].type).toBe('PERCENTAGE');
    expect(addTaxLineItem.taxLineItems[0].value).toBe(0.25);

    // Fetch invoice and validate totals
    const { invoiceById } = await sdk.InvoiceById({ id: invoiceId });
    expect(invoiceById).toBeDefined();
    expect(invoiceById?.subTotalInCents).toBe(14500 * 2);
    expect(invoiceById?.taxesInCents).toBe(Math.round(14500 * 2 * 0.25));
    expect(invoiceById?.finalSumInCents).toBe(Math.round(14500 * 2 * 1.25));
  });

  describe('Invoice deletion with status validation and charge unallocation', () => {
    it('should delete a DRAFT invoice and unallocate its charges', async () => {
      const { sdk } = await createClient();

      // Create workspace and invoice
      const { createWorkspace, createInvoice } =
        await createWorkspaceAndInvoice(sdk, 'buyer5', 'seller5');
      expect(createInvoice).toBeDefined();
      expect(createInvoice?.status).toBe('DRAFT');
      const invoiceId = createInvoice!.id;

      // Create charges
      const chargeIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const { createCharge } = await sdk.CreateChargeForInvoice({
          input: {
            workspaceId: createWorkspace.id,
            description: `Test Charge ${i + 1}`,
            amountInCents: 10000,
            contactId: 'contact1',
            chargeType: ChargeType.Service,
          },
        });
        expect(createCharge).toBeDefined();
        if (createCharge) {
          chargeIds.push(createCharge.id);
        }
      }

      // Add charges to invoice
      const { addInvoiceCharges } = await sdk.AddInvoiceCharges({
        input: { invoiceId, chargeIds },
      });
      expect(addInvoiceCharges).toBeDefined();
      expect(addInvoiceCharges.lineItems?.length).toBe(3);

      // Verify charges are allocated to the invoice
      const { listCharges: chargesBeforeDeletion } =
        await sdk.ListChargesForInvoice({
          filter: { workspaceId: createWorkspace.id, invoiceId },
        });
      expect(chargesBeforeDeletion).toBeDefined();
      expect(chargesBeforeDeletion!.items.length).toBe(3);
      chargesBeforeDeletion!.items.forEach((charge) => {
        expect(charge.invoiceId).toBe(invoiceId);
      });

      // Delete the invoice
      const { deleteInvoice } = await sdk.DeleteInvoice({ id: invoiceId });
      expect(deleteInvoice).toBe(true);

      // Verify invoice is deleted
      const { invoiceById } = await sdk.InvoiceById({ id: invoiceId });
      expect(invoiceById).toBeNull();

      // Verify charges are unallocated (invoiceId should be null)
      for (const chargeId of chargeIds) {
        const { listCharges } = await sdk.ListChargesForInvoice({
          filter: { workspaceId: createWorkspace.id, contactId: 'contact1' },
          page: { size: 100 },
        });
        expect(listCharges).toBeDefined();
        const charge = listCharges!.items.find((c) => c.id === chargeId);
        expect(charge).toBeDefined();
        expect(charge?.invoiceId).toBeNull();
      }
    });

    it('should not delete a SENT invoice', async () => {
      const { sdk } = await createClient();

      // Create workspace and invoice
      const { createInvoice } = await createWorkspaceAndInvoice(
        sdk,
        'buyer6',
        'seller6',
      );
      expect(createInvoice).toBeDefined();
      const invoiceId = createInvoice!.id;

      // Mark as sent
      const now = new Date().toISOString();
      const { markInvoiceAsSent } = await sdk.MarkInvoiceAsSent({
        input: { invoiceId, date: now },
      });
      expect(markInvoiceAsSent?.status).toBe('SENT');

      // Try to delete the sent invoice
      const { deleteInvoice } = await sdk.DeleteInvoice({ id: invoiceId });
      expect(deleteInvoice).toBe(false);

      // Verify invoice still exists
      const { invoiceById } = await sdk.InvoiceById({ id: invoiceId });
      expect(invoiceById).toBeDefined();
      expect(invoiceById?.status).toBe('SENT');
    });

    it('should not delete a PAID invoice', async () => {
      const { sdk } = await createClient();

      // Create workspace and invoice
      const { createInvoice } = await createWorkspaceAndInvoice(
        sdk,
        'buyer7',
        'seller7',
      );
      expect(createInvoice).toBeDefined();
      const invoiceId = createInvoice!.id;

      // Mark as paid
      const now = new Date().toISOString();
      const { markInvoiceAsPaid } = await sdk.MarkInvoiceAsPaid({
        input: { invoiceId, date: now },
      });
      expect(markInvoiceAsPaid?.status).toBe('PAID');

      // Try to delete the paid invoice
      const { deleteInvoice } = await sdk.DeleteInvoice({ id: invoiceId });
      expect(deleteInvoice).toBe(false);

      // Verify invoice still exists
      const { invoiceById } = await sdk.InvoiceById({ id: invoiceId });
      expect(invoiceById).toBeDefined();
      expect(invoiceById?.status).toBe('PAID');
    });

    it('should not delete a CANCELLED invoice', async () => {
      const { sdk } = await createClient();

      // Create workspace and invoice
      const { createInvoice } = await createWorkspaceAndInvoice(
        sdk,
        'buyer8',
        'seller8',
      );
      expect(createInvoice).toBeDefined();
      const invoiceId = createInvoice!.id;

      // Cancel the invoice
      const { cancelInvoice } = await sdk.CancelInvoice({
        input: { invoiceId },
      });
      expect(cancelInvoice?.status).toBe('CANCELLED');

      // Try to delete the cancelled invoice
      const { deleteInvoice } = await sdk.DeleteInvoice({ id: invoiceId });
      expect(deleteInvoice).toBe(false);

      // Verify invoice still exists
      const { invoiceById } = await sdk.InvoiceById({ id: invoiceId });
      expect(invoiceById).toBeDefined();
      expect(invoiceById?.status).toBe('CANCELLED');
    });

    it('should handle deletion of invoice with no charges', async () => {
      const { sdk } = await createClient();

      // Create workspace and invoice without charges
      const { createInvoice } = await createWorkspaceAndInvoice(
        sdk,
        'buyer9',
        'seller9',
      );
      expect(createInvoice).toBeDefined();
      expect(createInvoice?.status).toBe('DRAFT');
      const invoiceId = createInvoice!.id;

      // Delete the invoice
      const { deleteInvoice } = await sdk.DeleteInvoice({ id: invoiceId });
      expect(deleteInvoice).toBe(true);

      // Verify invoice is deleted
      const { invoiceById } = await sdk.InvoiceById({ id: invoiceId });
      expect(invoiceById).toBeNull();
    });

    it('should maintain transactional integrity when deleting invoice with charges', async () => {
      const { sdk } = await createClient();

      // Create workspace and invoice
      const { createWorkspace, createInvoice } =
        await createWorkspaceAndInvoice(sdk, 'buyer10', 'seller10');
      expect(createInvoice).toBeDefined();
      const invoiceId = createInvoice!.id;

      // Create and add multiple charges
      const chargeIds: string[] = [];
      for (let i = 0; i < 5; i++) {
        const { createCharge } = await sdk.CreateChargeForInvoice({
          input: {
            workspaceId: createWorkspace.id,
            description: `Transactional Test Charge ${i + 1}`,
            amountInCents: 5000 * (i + 1),
            contactId: 'contact2',
            chargeType: ChargeType.Rental,
          },
        });
        if (createCharge) {
          chargeIds.push(createCharge.id);
        }
      }

      // Add all charges to invoice
      await sdk.AddInvoiceCharges({
        input: { invoiceId, chargeIds },
      });

      // Delete the invoice (this should unallocate all charges atomically)
      const { deleteInvoice } = await sdk.DeleteInvoice({ id: invoiceId });
      expect(deleteInvoice).toBe(true);

      // Verify all charges are unallocated
      const { listCharges } = await sdk.ListChargesForInvoice({
        filter: { workspaceId: createWorkspace.id, contactId: 'contact2' },
        page: { size: 100 },
      });

      expect(listCharges).toBeDefined();
      const unallocatedCharges = listCharges!.items.filter((charge) =>
        chargeIds.includes(charge.id),
      );
      expect(unallocatedCharges.length).toBe(5);
      unallocatedCharges.forEach((charge) => {
        expect(charge.invoiceId).toBeNull();
      });
    });
  });
});
