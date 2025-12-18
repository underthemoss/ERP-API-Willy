import { gql } from 'graphql-request';
import { createTestEnvironment } from './test-environment';
import { v4 as uuidv4 } from 'uuid';
import {
  RequestType,
  DeliveryMethod,
  InventoryStatus,
} from './generated/graphql';
import invariant from 'tiny-invariant';
import { addDays, subDays } from 'date-fns';

// Query to get intake form line item with inventory reservations
gql`
  query GetIntakeFormLineItemWithInventoryReservations($id: String!) {
    getIntakeFormSubmissionLineItem(id: $id) {
      id
      salesOrderLineItem {
        ... on RentalSalesOrderLineItem {
          id
        }
        ... on SaleSalesOrderLineItem {
          id
        }
      }
      fulfilmentId
      inventoryReservations {
        ... on FulfilmentReservation {
          id
          inventoryId
          startDate
          endDate
        }
      }
    }
  }
`;

// Mutations needed for the test
gql`
  mutation SubmitSalesOrderForPortalTest($id: ID!) {
    submitSalesOrder(id: $id) {
      id
      status
    }
  }
`;

gql`
  query ListFulfilmentsForPortalTest($filter: ListFulfilmentsFilter!) {
    listFulfilments(filter: $filter) {
      items {
        __typename
        ... on RentalFulfilment {
          id
          salesOrderLineItemId
          salesOrderType
          rentalStartDate
          rentalEndDate
          inventoryId
        }
        ... on SaleFulfilment {
          id
          salesOrderLineItemId
          salesOrderType
        }
        ... on ServiceFulfilment {
          id
          salesOrderLineItemId
          salesOrderType
        }
      }
    }
  }
`;

gql`
  mutation SetRentalStartDateForPortalTest(
    $fulfilmentId: ID!
    $rentalStartDate: DateTime!
  ) {
    setRentalStartDate(
      fulfilmentId: $fulfilmentId
      rentalStartDate: $rentalStartDate
    ) {
      id
      rentalStartDate
    }
  }
`;

gql`
  mutation SetRentalEndDateForPortalTest(
    $fulfilmentId: ID!
    $rentalEndDate: DateTime!
  ) {
    setRentalEndDate(
      fulfilmentId: $fulfilmentId
      rentalEndDate: $rentalEndDate
    ) {
      id
      rentalEndDate
    }
  }
`;

gql`
  mutation AssignInventoryForPortalTest($fulfilmentId: ID!, $inventoryId: ID!) {
    assignInventoryToRentalFulfilment(
      fulfilmentId: $fulfilmentId
      inventoryId: $inventoryId
    ) {
      __typename
      id
      ... on RentalFulfilment {
        inventoryId
      }
    }
  }
`;

gql`
  mutation CreateInventoryForPortalTest($input: CreateInventoryInput!) {
    createInventory(input: $input) {
      id
      status
    }
  }
`;

// Query to get submission by ID with sales order and line items
gql`
  query GetIntakeFormSubmissionByIdForPortalTest($id: String!) {
    getIntakeFormSubmissionById(id: $id) {
      id
      formId
      workspaceId
      name
      email
      status
      salesOrder {
        id
        status
        sales_order_number
        purchase_order_number
        project {
          id
          name
        }
      }
      lineItems {
        id
        description
        quantity
        type
        salesOrderLineItem {
          ... on RentalSalesOrderLineItem {
            id
            so_quantity
          }
          ... on SaleSalesOrderLineItem {
            id
            so_quantity
          }
        }
        fulfilmentId
        inventoryReservations {
          ... on FulfilmentReservation {
            id
            inventoryId
            startDate
            endDate
          }
        }
      }
    }
  }
`;

// Query to list line items for a submission
gql`
  query ListIntakeFormSubmissionLineItemsForPortalTest($submissionId: String!) {
    listIntakeFormSubmissionLineItems(submissionId: $submissionId) {
      id
      description
      quantity
      type
      salesOrderLineItem {
        ... on RentalSalesOrderLineItem {
          id
          so_quantity
        }
        ... on SaleSalesOrderLineItem {
          id
          so_quantity
        }
      }
      fulfilmentId
      inventoryReservations {
        ... on FulfilmentReservation {
          id
          inventoryId
          startDate
          endDate
        }
      }
    }
  }
`;

const { createClient } = createTestEnvironment();

describe('Portal User Fulfilment Rental Period Management', () => {
  it('portal user can set rental end date and see inventory reservations', async () => {
    // 1. Admin creates workspace with assets, prices, inventory
    const { sdk: adminSdk, utils, user: adminUser } = await createClient();
    const workspace = await utils.createWorkspace();
    const { priceBook, rentalPrice } = await utils.createPriceBookAndPrices(
      workspace.id,
    );

    const portalUserEmail = `portal-user-${uuidv4()}@example.com`;

    // 2. Admin creates intake form with portal user invited
    const { createIntakeForm } = await adminSdk.CreateIntakeForm({
      input: {
        workspaceId: workspace.id,
        isActive: true,
        isPublic: false,
        pricebookId: priceBook.id,
        sharedWithEmails: [portalUserEmail],
      },
    });

    invariant(createIntakeForm?.id);
    const formId = createIntakeForm.id;
    const portalUserId = createIntakeForm.sharedWithUserIds?.[0];
    invariant(portalUserId);

    // Create portal user SDK
    const { sdk: portalUserSdk } = await createClient({
      userEmail: portalUserEmail,
      userId: portalUserId,
    });

    // 3. Portal user creates submission with rental line item
    const { createIntakeFormSubmission } =
      await portalUserSdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId: workspace.id,
          name: 'Portal User',
          email: portalUserEmail,
          companyName: 'Portal Company',
        },
      });

    invariant(createIntakeFormSubmission?.id);
    const submissionId = createIntakeFormSubmission.id;

    // Add a rental line item
    const { createIntakeFormSubmissionLineItem } =
      await portalUserSdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Rental Equipment',
          quantity: 1,
          durationInDays: 30,
          type: RequestType.Rental,
          pimCategoryId: 'PIM_CAT_PORTAL_TEST',
          priceId: rentalPrice.id,
          deliveryMethod: DeliveryMethod.Delivery,
          deliveryLocation: '123 Test St',
        },
      });

    invariant(createIntakeFormSubmissionLineItem?.id);
    const intakeFormLineItemId = createIntakeFormSubmissionLineItem.id;

    // 4. Portal user submits the form
    await portalUserSdk.SubmitIntakeFormSubmission({ id: submissionId });

    // 5. Admin creates sales order linked to submission
    const { createProject } = await adminSdk.CreateProjectForSalesOrder({
      input: {
        name: 'Portal Fulfilment Test Project',
        project_code: 'PORTAL-FUL-001',
        deleted: false,
        workspaceId: workspace.id,
      },
    });
    invariant(createProject?.id);

    const { createSalesOrder } = await adminSdk.CreateSalesOrderWithIntakeForm({
      input: {
        workspace_id: workspace.id,
        project_id: createProject.id,
        buyer_id: adminUser.id,
        purchase_order_number: 'PO-PORTAL-FUL-001',
        intake_form_submission_id: submissionId,
      },
    });
    invariant(createSalesOrder?.id);

    // 6. Admin creates rental sales order line item linked to intake form line item
    const rentalStartDate = subDays(new Date(), 7);
    const { createRentalSalesOrderLineItem } =
      await adminSdk.CreateRentalSalesOrderLineItemWithIntakeForm({
        input: {
          sales_order_id: createSalesOrder.id,
          intake_form_submission_line_item_id: intakeFormLineItemId,
          so_quantity: 1,
          price_id: rentalPrice.id,
          delivery_date: rentalStartDate.toISOString(),
          off_rent_date: addDays(rentalStartDate, 30).toISOString(),
        },
      });
    invariant(createRentalSalesOrderLineItem?.id);

    // 7. Admin calls SubmitSalesOrder → automatically creates fulfilments
    const submitResult = await adminSdk.SubmitSalesOrderForPortalTest({
      id: createSalesOrder.id,
    });
    invariant(submitResult.submitSalesOrder);

    // 8. Admin lists fulfilments to get the created fulfilment
    const { listFulfilments } = await adminSdk.ListFulfilmentsForPortalTest({
      filter: {
        workspaceId: workspace.id,
        salesOrderId: createSalesOrder.id,
      },
    });

    const rentalFulfilment = listFulfilments?.items?.find(
      (item) => item.salesOrderLineItemId === createRentalSalesOrderLineItem.id,
    );
    invariant(rentalFulfilment);
    const fulfilmentId = rentalFulfilment.id;

    // 9. Admin sets rental start date (required before setting end date)
    const { setRentalStartDate } =
      await adminSdk.SetRentalStartDateForPortalTest({
        fulfilmentId,
        rentalStartDate: rentalStartDate.toISOString(),
      });
    invariant(setRentalStartDate);

    // 10. Admin creates and assigns inventory to the fulfilment
    const { createInventory } = await adminSdk.CreateInventoryForPortalTest({
      input: {
        status: InventoryStatus.Received,
        isThirdPartyRental: false,
        pimCategoryId: 'PIM_CAT_PORTAL_TEST',
        pimCategoryName: 'Portal Test Category',
        pimCategoryPath: 'Equipment|Test',
        assetId: `ASSET-PORTAL-${uuidv4()}`,
      },
    });
    invariant(createInventory?.id);

    const { assignInventoryToRentalFulfilment } =
      await adminSdk.AssignInventoryForPortalTest({
        fulfilmentId,
        inventoryId: createInventory.id,
      });
    invariant(assignInventoryToRentalFulfilment);

    // 11. Portal user queries intake form line item - verify inventoryReservations populated
    const { getIntakeFormSubmissionLineItem } =
      await portalUserSdk.GetIntakeFormLineItemWithInventoryReservations({
        id: intakeFormLineItemId,
      });

    invariant(getIntakeFormSubmissionLineItem);
    expect(getIntakeFormSubmissionLineItem.fulfilmentId).toBe(fulfilmentId);
    expect(getIntakeFormSubmissionLineItem.inventoryReservations).toBeDefined();
    expect(
      getIntakeFormSubmissionLineItem.inventoryReservations?.length,
    ).toBeGreaterThan(0);
    expect(
      getIntakeFormSubmissionLineItem.inventoryReservations?.[0]?.inventoryId,
    ).toBe(createInventory.id);

    // 12. Portal user queries submission by ID - verify salesOrder and lineItems with linked resolvers
    const { getIntakeFormSubmissionById } =
      await portalUserSdk.GetIntakeFormSubmissionByIdForPortalTest({
        id: submissionId,
      });

    invariant(getIntakeFormSubmissionById);
    expect(getIntakeFormSubmissionById.id).toBe(submissionId);
    expect(getIntakeFormSubmissionById.formId).toBe(formId);
    expect(getIntakeFormSubmissionById.status).toBe('SUBMITTED');

    // Verify salesOrder is accessible and has correct data
    expect(getIntakeFormSubmissionById.salesOrder).toBeDefined();
    expect(getIntakeFormSubmissionById.salesOrder?.id).toBe(
      createSalesOrder.id,
    );
    expect(getIntakeFormSubmissionById.salesOrder?.status).toBe('SUBMITTED');
    expect(getIntakeFormSubmissionById.salesOrder?.purchase_order_number).toBe(
      'PO-PORTAL-FUL-001',
    );

    // Verify lineItems with linked resolvers
    expect(getIntakeFormSubmissionById.lineItems).toBeDefined();
    expect(getIntakeFormSubmissionById.lineItems?.length).toBe(1);

    const lineItem = getIntakeFormSubmissionById.lineItems?.[0];
    invariant(lineItem);
    expect(lineItem.id).toBe(intakeFormLineItemId);
    expect(lineItem.description).toBe('Rental Equipment');
    expect(lineItem.salesOrderLineItem).toBeDefined();
    expect(lineItem.salesOrderLineItem?.id).toBe(
      createRentalSalesOrderLineItem.id,
    );
    expect(lineItem.fulfilmentId).toBe(fulfilmentId);
    expect(lineItem.inventoryReservations?.length).toBeGreaterThan(0);
    expect(lineItem.inventoryReservations?.[0]?.inventoryId).toBe(
      createInventory.id,
    );

    // 13. Portal user uses listIntakeFormSubmissionLineItems - verify linked resolvers work
    const { listIntakeFormSubmissionLineItems } =
      await portalUserSdk.ListIntakeFormSubmissionLineItemsForPortalTest({
        submissionId,
      });

    expect(listIntakeFormSubmissionLineItems).toBeDefined();
    expect(listIntakeFormSubmissionLineItems?.length).toBe(1);

    const listedLineItem = listIntakeFormSubmissionLineItems?.[0];
    invariant(listedLineItem);
    expect(listedLineItem.id).toBe(intakeFormLineItemId);
    expect(listedLineItem.salesOrderLineItem).toBeDefined();
    expect(listedLineItem.salesOrderLineItem?.id).toBe(
      createRentalSalesOrderLineItem.id,
    );
    expect(listedLineItem.fulfilmentId).toBe(fulfilmentId);
    expect(listedLineItem.inventoryReservations?.length).toBeGreaterThan(0);
    expect(listedLineItem.inventoryReservations?.[0]?.inventoryId).toBe(
      createInventory.id,
    );

    // 14. Portal user calls setRentalEndDate - verify success
    const rentalEndDate = addDays(rentalStartDate, 14);
    const { setRentalEndDate } =
      await portalUserSdk.SetRentalEndDateForPortalTest({
        fulfilmentId,
        rentalEndDate: rentalEndDate.toISOString(),
      });

    expect(setRentalEndDate).toBeDefined();
    expect(setRentalEndDate?.id).toBe(fulfilmentId);
    expect(setRentalEndDate?.rentalEndDate).toBe(rentalEndDate.toISOString());
  });

  it('should NOT allow non-submitter portal user to set rental end date', async () => {
    // Setup: Create admin, submitter, and non-submitter users
    const { sdk: adminSdk, utils, user: adminUser } = await createClient();
    const workspace = await utils.createWorkspace();
    const { priceBook, rentalPrice } = await utils.createPriceBookAndPrices(
      workspace.id,
    );

    const submitterEmail = `submitter-${uuidv4()}@example.com`;
    const nonSubmitterEmail = `non-submitter-${uuidv4()}@example.com`;

    // Create form with both users invited
    const { createIntakeForm } = await adminSdk.CreateIntakeForm({
      input: {
        workspaceId: workspace.id,
        isActive: true,
        isPublic: false,
        pricebookId: priceBook.id,
        sharedWithEmails: [submitterEmail, nonSubmitterEmail],
      },
    });

    invariant(createIntakeForm?.id);
    const formId = createIntakeForm.id;
    const submitterId = createIntakeForm.sharedWithUserIds?.[0];
    const nonSubmitterId = createIntakeForm.sharedWithUserIds?.[1];
    invariant(submitterId);
    invariant(nonSubmitterId);

    // Create SDKs for both users
    const { sdk: submitterSdk } = await createClient({
      userEmail: submitterEmail,
      userId: submitterId,
    });

    const { sdk: nonSubmitterSdk } = await createClient({
      userEmail: nonSubmitterEmail,
      userId: nonSubmitterId,
    });

    // Submitter creates and submits the form
    const { createIntakeFormSubmission } =
      await submitterSdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId: workspace.id,
          name: 'Submitter User',
          email: submitterEmail,
        },
      });

    invariant(createIntakeFormSubmission?.id);
    const submissionId = createIntakeFormSubmission.id;

    const { createIntakeFormSubmissionLineItem } =
      await submitterSdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Rental Equipment',
          quantity: 1,
          durationInDays: 30,
          type: RequestType.Rental,
          pimCategoryId: 'PIM_CAT_NON_SUBMITTER_TEST',
          priceId: rentalPrice.id,
          deliveryMethod: DeliveryMethod.Delivery,
        },
      });

    invariant(createIntakeFormSubmissionLineItem?.id);

    await submitterSdk.SubmitIntakeFormSubmission({ id: submissionId });

    // Admin creates sales order and fulfilment
    const { createProject } = await adminSdk.CreateProjectForSalesOrder({
      input: {
        name: 'Non-Submitter Test Project',
        project_code: 'NON-SUB-001',
        deleted: false,
        workspaceId: workspace.id,
      },
    });
    invariant(createProject?.id);

    const { createSalesOrder } = await adminSdk.CreateSalesOrderWithIntakeForm({
      input: {
        workspace_id: workspace.id,
        project_id: createProject.id,
        buyer_id: adminUser.id,
        purchase_order_number: 'PO-NON-SUB-001',
        intake_form_submission_id: submissionId,
      },
    });
    invariant(createSalesOrder?.id);

    const rentalStartDate = subDays(new Date(), 7);
    const { createRentalSalesOrderLineItem } =
      await adminSdk.CreateRentalSalesOrderLineItemWithIntakeForm({
        input: {
          sales_order_id: createSalesOrder.id,
          intake_form_submission_line_item_id:
            createIntakeFormSubmissionLineItem.id,
          so_quantity: 1,
          price_id: rentalPrice.id,
          delivery_date: rentalStartDate.toISOString(),
          off_rent_date: addDays(rentalStartDate, 30).toISOString(),
        },
      });
    invariant(createRentalSalesOrderLineItem?.id);

    await adminSdk.SubmitSalesOrderForPortalTest({ id: createSalesOrder.id });

    const { listFulfilments } = await adminSdk.ListFulfilmentsForPortalTest({
      filter: {
        workspaceId: workspace.id,
        salesOrderId: createSalesOrder.id,
      },
    });

    const rentalFulfilment = listFulfilments?.items?.find(
      (item) => item.salesOrderLineItemId === createRentalSalesOrderLineItem.id,
    );
    invariant(rentalFulfilment);
    const fulfilmentId = rentalFulfilment.id;

    // Admin sets rental start date
    await adminSdk.SetRentalStartDateForPortalTest({
      fulfilmentId,
      rentalStartDate: rentalStartDate.toISOString(),
    });

    // Non-submitter should NOT be able to set rental end date
    const rentalEndDate = addDays(rentalStartDate, 14);
    await expect(
      nonSubmitterSdk.SetRentalEndDateForPortalTest({
        fulfilmentId,
        rentalEndDate: rentalEndDate.toISOString(),
      }),
    ).rejects.toThrow();
  });
});
