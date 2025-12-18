import { gql } from 'graphql-request';
import { createTestEnvironment } from './test-environment';
import {
  RequestType,
  DeliveryMethod,
  WorkspaceAccessType,
} from './generated/graphql';
import invariant from 'tiny-invariant';
import { v4 } from 'uuid';

// GraphQL operations for the tests
gql`
  mutation CreateSalesOrderWithIntakeForm($input: SalesOrderInput) {
    createSalesOrder(input: $input) {
      id
      status
      project_id
      buyer_id
      purchase_order_number
      sales_order_number
      company_id
      created_at
      updated_at
      updated_by
      intake_form_submission_id
    }
  }
`;

gql`
  mutation CreateRentalSalesOrderLineItemWithIntakeForm(
    $input: CreateRentalSalesOrderLineItemInput!
  ) {
    createRentalSalesOrderLineItem(input: $input) {
      id
      sales_order_id
      so_pim_id
      so_quantity
      company_id
      created_at
      created_by
      updated_at
      updated_by
      lineitem_type
      price_id
      lineitem_status
      delivery_date
      off_rent_date
      deliveryNotes
      totalDaysOnRent
      intake_form_submission_line_item_id
    }
  }
`;

gql`
  mutation CreateSaleSalesOrderLineItemWithIntakeForm(
    $input: CreateSaleSalesOrderLineItemInput!
  ) {
    createSaleSalesOrderLineItem(input: $input) {
      id
      sales_order_id
      so_pim_id
      so_quantity
      company_id
      created_at
      created_by
      updated_at
      updated_by
      lineitem_type
      price_id
      lineitem_status
      deliveryNotes
      intake_form_submission_line_item_id
    }
  }
`;

gql`
  query GetSalesOrderWithIntakeForm($id: String) {
    getSalesOrderById(id: $id) {
      id
      intake_form_submission_id
      intakeFormSubmission {
        id
        formId
        workspaceId
        name
        email
      }
    }
  }
`;

gql`
  query GetSalesOrderLineItemWithIntakeForm($id: String) {
    getSalesOrderLineItemById(id: $id) {
      ... on RentalSalesOrderLineItem {
        id
        intake_form_submission_line_item_id
        intakeFormSubmissionLineItem {
          id
          description
          quantity
        }
      }
      ... on SaleSalesOrderLineItem {
        id
        intake_form_submission_line_item_id
        intakeFormSubmissionLineItem {
          id
          description
          quantity
        }
      }
    }
  }
`;

gql`
  query GetIntakeFormSubmissionWithSalesOrder($id: String!) {
    getIntakeFormSubmissionById(id: $id) {
      id
      formId
      workspaceId
      name
      email
      salesOrder {
        id
        status
        sales_order_number
      }
    }
  }
`;

gql`
  query GetIntakeFormLineItemWithSalesOrderLineItem($id: String!) {
    getIntakeFormSubmissionLineItem(id: $id) {
      id
      description
      quantity
      salesOrderLineItem {
        ... on RentalSalesOrderLineItem {
          id
          intake_form_submission_line_item_id
        }
        ... on SaleSalesOrderLineItem {
          id
          intake_form_submission_line_item_id
        }
      }
    }
  }
`;

const { createClient } = createTestEnvironment();

describe('Sales Orders with Intake Form Integration', () => {
  describe('Successful Integration', () => {
    it('should create a sales order with a valid intake form submission ID and verify the relationship', async () => {
      const { sdk, utils, user } = await createClient();
      const workspace = await utils.createWorkspace();

      // Create an intake form
      const { createIntakeForm } = await sdk.CreateIntakeForm({
        input: {
          workspaceId: workspace.id,
          isActive: true,
        },
      });
      invariant(createIntakeForm?.id);

      // Create an intake form submission
      const { createIntakeFormSubmission } =
        await sdk.CreateIntakeFormSubmission({
          input: {
            formId: createIntakeForm.id,
            workspaceId: workspace.id,
            name: 'Test Submitter',
            email: 'test@example.com',
            phone: '+1234567890',
            companyName: 'Test Company',
            purchaseOrderNumber: 'PO-INTAKE-001',
          },
        });
      invariant(createIntakeFormSubmission?.id);

      // Create a project for the sales order
      const { createProject } = await sdk.CreateProjectForSalesOrder({
        input: {
          name: 'Intake Integration Project',
          project_code: 'INTAKE-001',
          description: 'Project for intake form integration test',
          deleted: false,
          workspaceId: workspace.id,
        },
      });
      invariant(createProject?.id);

      // Create a sales order with the intake form submission ID
      const { createSalesOrder } = await sdk.CreateSalesOrderWithIntakeForm({
        input: {
          workspace_id: workspace.id,
          project_id: createProject.id,
          buyer_id: user.id,
          purchase_order_number: 'PO-SO-INTAKE-001',
          intake_form_submission_id: createIntakeFormSubmission.id,
        },
      });
      invariant(createSalesOrder?.id);

      // Verify the sales order was created with the intake form submission ID
      expect(createSalesOrder.intake_form_submission_id).toBe(
        createIntakeFormSubmission.id,
      );

      // Query the sales order to verify the relationship is accessible
      const { getSalesOrderById } = await sdk.GetSalesOrderWithIntakeForm({
        id: createSalesOrder.id,
      });
      invariant(getSalesOrderById);

      expect(getSalesOrderById.intake_form_submission_id).toBe(
        createIntakeFormSubmission.id,
      );
      expect(getSalesOrderById.intakeFormSubmission).toBeDefined();
      expect(getSalesOrderById.intakeFormSubmission?.id).toBe(
        createIntakeFormSubmission.id,
      );
      expect(getSalesOrderById.intakeFormSubmission?.name).toBe(
        'Test Submitter',
      );
      expect(getSalesOrderById.intakeFormSubmission?.email).toBe(
        'test@example.com',
      );
    });

    it('should fetch salesOrder from intake form submission as portal user', async () => {
      // Admin user creates workspace, form, project and sales order
      const { sdk: adminSdk, utils, user: adminUser } = await createClient();
      const workspace = await utils.createWorkspace();

      const portalUserEmail = `portal-user-${v4()}@example.com`;

      // Admin creates intake form with portal user invited
      const { createIntakeForm } = await adminSdk.CreateIntakeForm({
        input: {
          workspaceId: workspace.id,
          isActive: true,
          isPublic: false,
          sharedWithEmails: [portalUserEmail],
        },
      });
      invariant(createIntakeForm?.id);

      const portalUserId = createIntakeForm.sharedWithUserIds?.[0];
      invariant(portalUserId);

      // Create portal user SDK
      const { sdk: portalUserSdk } = await createClient({
        userEmail: portalUserEmail,
        userId: portalUserId,
      });

      // Portal user creates intake form submission
      const { createIntakeFormSubmission } =
        await portalUserSdk.CreateIntakeFormSubmission({
          input: {
            formId: createIntakeForm.id,
            workspaceId: workspace.id,
            name: 'Portal User',
            email: portalUserEmail,
          },
        });
      invariant(createIntakeFormSubmission?.id);

      // Portal user submits the form
      await portalUserSdk.SubmitIntakeFormSubmission({
        id: createIntakeFormSubmission.id,
      });

      // Admin creates project for sales order
      const { createProject } = await adminSdk.CreateProjectForSalesOrder({
        input: {
          name: 'Test Project',
          project_code: 'TEST-001',
          deleted: false,
          workspaceId: workspace.id,
        },
      });
      invariant(createProject?.id);

      // Admin creates sales order linked to the submission
      const { createSalesOrder } =
        await adminSdk.CreateSalesOrderWithIntakeForm({
          input: {
            workspace_id: workspace.id,
            project_id: createProject.id,
            buyer_id: adminUser.id,
            purchase_order_number: 'PO-TEST-001',
            intake_form_submission_id: createIntakeFormSubmission.id,
          },
        });
      invariant(createSalesOrder?.id);

      // Portal user queries the intake form submission and should see the salesOrder
      const { getIntakeFormSubmissionById } =
        await portalUserSdk.GetIntakeFormSubmissionWithSalesOrder({
          id: createIntakeFormSubmission.id,
        });
      invariant(getIntakeFormSubmissionById);

      expect(getIntakeFormSubmissionById.salesOrder).toBeDefined();
      expect(getIntakeFormSubmissionById.salesOrder?.id).toBe(
        createSalesOrder.id,
      );
      expect(getIntakeFormSubmissionById.salesOrder?.sales_order_number).toBe(
        createSalesOrder.sales_order_number,
      );
    });

    it('should fetch salesOrderLineItem from intake form line item as portal user', async () => {
      // Admin user creates workspace, form, project and sales order
      const { sdk: adminSdk, utils, user: adminUser } = await createClient();
      const workspace = await utils.createWorkspace();
      const { priceBook, rentalPrice } = await utils.createPriceBookAndPrices(
        workspace.id,
      );

      const portalUserEmail = `portal-user-${v4()}@example.com`;

      // Admin creates intake form with portal user invited
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

      const portalUserId = createIntakeForm.sharedWithUserIds?.[0];
      invariant(portalUserId);

      // Create portal user SDK
      const { sdk: portalUserSdk } = await createClient({
        userEmail: portalUserEmail,
        userId: portalUserId,
      });

      // Portal user creates intake form submission
      const { createIntakeFormSubmission } =
        await portalUserSdk.CreateIntakeFormSubmission({
          input: {
            formId: createIntakeForm.id,
            workspaceId: workspace.id,
            name: 'Portal User',
            email: portalUserEmail,
          },
        });
      invariant(createIntakeFormSubmission?.id);

      // Portal user creates line item
      const { createIntakeFormSubmissionLineItem } =
        await portalUserSdk.CreateIntakeFormSubmissionLineItem({
          submissionId: createIntakeFormSubmission.id,
          input: {
            startDate: new Date().toISOString(),
            description: 'Test Equipment',
            quantity: 2,
            durationInDays: 7,
            type: RequestType.Rental,
            pimCategoryId: 'PIM_CAT_TEST',
            priceId: rentalPrice.id,
            deliveryMethod: DeliveryMethod.Delivery,
            deliveryLocation: '123 Test St',
          },
        });
      invariant(createIntakeFormSubmissionLineItem?.id);

      // Portal user submits the form
      await portalUserSdk.SubmitIntakeFormSubmission({
        id: createIntakeFormSubmission.id,
      });

      // Admin creates project for sales order
      const { createProject } = await adminSdk.CreateProjectForSalesOrder({
        input: {
          name: 'Test Project',
          project_code: 'TEST-002',
          deleted: false,
          workspaceId: workspace.id,
        },
      });
      invariant(createProject?.id);

      // Admin creates sales order linked to the submission
      const { createSalesOrder } =
        await adminSdk.CreateSalesOrderWithIntakeForm({
          input: {
            workspace_id: workspace.id,
            project_id: createProject.id,
            buyer_id: adminUser.id,
            purchase_order_number: 'PO-TEST-002',
            intake_form_submission_id: createIntakeFormSubmission.id,
          },
        });
      invariant(createSalesOrder?.id);

      // Admin creates sales order line item linked to the intake form line item
      const { createRentalSalesOrderLineItem } =
        await adminSdk.CreateRentalSalesOrderLineItemWithIntakeForm({
          input: {
            sales_order_id: createSalesOrder.id,
            intake_form_submission_line_item_id:
              createIntakeFormSubmissionLineItem.id,
            so_quantity: 1, // Rental line items must have quantity of 1
            delivery_date: new Date().toISOString(),
            off_rent_date: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        });
      invariant(createRentalSalesOrderLineItem?.id);

      // Portal user queries the intake form line item and should see the salesOrderLineItem
      const { getIntakeFormSubmissionLineItem } =
        await portalUserSdk.GetIntakeFormLineItemWithSalesOrderLineItem({
          id: createIntakeFormSubmissionLineItem.id,
        });
      invariant(getIntakeFormSubmissionLineItem);

      expect(getIntakeFormSubmissionLineItem.salesOrderLineItem).toBeDefined();
      expect(getIntakeFormSubmissionLineItem.salesOrderLineItem?.id).toBe(
        createRentalSalesOrderLineItem.id,
      );
      expect(
        getIntakeFormSubmissionLineItem.salesOrderLineItem
          ?.intake_form_submission_line_item_id,
      ).toBe(createIntakeFormSubmissionLineItem.id);
    });

    it('should create rental line items with valid intake form submission line item IDs', async () => {
      const { sdk, utils, user } = await createClient();
      const workspace = await utils.createWorkspace();

      // Create intake form and submission
      const { createIntakeForm } = await sdk.CreateIntakeForm({
        input: {
          workspaceId: workspace.id,
          isActive: true,
        },
      });
      invariant(createIntakeForm?.id);

      const { createIntakeFormSubmission } =
        await sdk.CreateIntakeFormSubmission({
          input: {
            formId: createIntakeForm.id,
            workspaceId: workspace.id,
            name: 'Test Submitter',
            email: 'test@example.com',
          },
        });
      invariant(createIntakeFormSubmission?.id);

      // Create intake form line items
      const { createIntakeFormSubmissionLineItem: lineItem1 } =
        await sdk.CreateIntakeFormSubmissionLineItem({
          submissionId: createIntakeFormSubmission.id,
          input: {
            startDate: new Date().toISOString(),
            description: 'Rental Equipment 1',
            quantity: 2,
            durationInDays: 7,
            type: RequestType.Rental,
            pimCategoryId: 'PIM_CAT_001',
            deliveryMethod: DeliveryMethod.Delivery,
          },
        });
      invariant(lineItem1?.id);

      // Create a sales order
      const { createProject } = await sdk.CreateProjectForSalesOrder({
        input: {
          name: 'Line Item Integration Project',
          project_code: 'LI-001',
          deleted: false,
          workspaceId: workspace.id,
        },
      });
      invariant(createProject?.id);

      const { createSalesOrder } = await sdk.CreateSalesOrderWithIntakeForm({
        input: {
          workspace_id: workspace.id,
          project_id: createProject.id,
          buyer_id: user.id,
          purchase_order_number: 'PO-LI-001',
          intake_form_submission_id: createIntakeFormSubmission.id,
        },
      });
      invariant(createSalesOrder?.id);

      // Create a rental sales order line item with intake form line item ID
      const { createRentalSalesOrderLineItem } =
        await sdk.CreateRentalSalesOrderLineItemWithIntakeForm({
          input: {
            sales_order_id: createSalesOrder.id,
            intake_form_submission_line_item_id: lineItem1.id,
            so_quantity: 1, // Rental line items must have quantity of 1
            delivery_date: new Date().toISOString(),
            off_rent_date: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        });
      invariant(createRentalSalesOrderLineItem?.id);

      // Verify the line item was created with the intake form line item ID
      expect(
        createRentalSalesOrderLineItem.intake_form_submission_line_item_id,
      ).toBe(lineItem1.id);

      // Query the line item to verify the relationship
      const { getSalesOrderLineItemById } =
        await sdk.GetSalesOrderLineItemWithIntakeForm({
          id: createRentalSalesOrderLineItem.id,
        });
      invariant(getSalesOrderLineItemById);

      expect(
        getSalesOrderLineItemById.intake_form_submission_line_item_id,
      ).toBe(lineItem1.id);
      expect(
        getSalesOrderLineItemById.intakeFormSubmissionLineItem,
      ).toBeDefined();
      expect(getSalesOrderLineItemById.intakeFormSubmissionLineItem?.id).toBe(
        lineItem1.id,
      );
      expect(
        getSalesOrderLineItemById.intakeFormSubmissionLineItem?.description,
      ).toBe('Rental Equipment 1');
      expect(
        getSalesOrderLineItemById.intakeFormSubmissionLineItem?.quantity,
      ).toBe(2);
    });

    it('should create sale line items with valid intake form submission line item IDs', async () => {
      const { sdk, utils, user } = await createClient();
      const workspace = await utils.createWorkspace();

      // Create intake form and submission
      const { createIntakeForm } = await sdk.CreateIntakeForm({
        input: {
          workspaceId: workspace.id,
          isActive: true,
        },
      });
      invariant(createIntakeForm?.id);

      const { createIntakeFormSubmission } =
        await sdk.CreateIntakeFormSubmission({
          input: {
            formId: createIntakeForm.id,
            workspaceId: workspace.id,
            name: 'Test Submitter',
            email: `${v4()}@example.com`,
          },
        });
      invariant(createIntakeFormSubmission?.id);

      // Create a sale intake form line item
      const { createIntakeFormSubmissionLineItem: saleLineItem } =
        await sdk.CreateIntakeFormSubmissionLineItem({
          submissionId: createIntakeFormSubmission.id,
          input: {
            startDate: new Date().toISOString(),
            description: 'Sale Equipment 1',
            quantity: 5,
            durationInDays: 0,
            type: RequestType.Purchase,
            pimCategoryId: 'PIM_CAT_SALE_001',
            deliveryMethod: DeliveryMethod.Pickup,
          },
        });
      invariant(saleLineItem?.id);

      // Create a sales order
      const { createProject } = await sdk.CreateProjectForSalesOrder({
        input: {
          name: 'Sale Line Item Project',
          project_code: 'SALE-LI-001',
          deleted: false,
          workspaceId: workspace.id,
        },
      });
      invariant(createProject?.id);

      const { createSalesOrder } = await sdk.CreateSalesOrderWithIntakeForm({
        input: {
          workspace_id: workspace.id,
          project_id: createProject.id,
          buyer_id: user.id,
          purchase_order_number: 'PO-SALE-001',
          intake_form_submission_id: createIntakeFormSubmission.id,
        },
      });
      invariant(createSalesOrder?.id);

      // Create a sale sales order line item with intake form line item ID
      const { createSaleSalesOrderLineItem } =
        await sdk.CreateSaleSalesOrderLineItemWithIntakeForm({
          input: {
            sales_order_id: createSalesOrder.id,
            intake_form_submission_line_item_id: saleLineItem.id,
            so_quantity: 5,
          },
        });
      invariant(createSaleSalesOrderLineItem?.id);

      // Verify the line item was created with the intake form line item ID
      expect(
        createSaleSalesOrderLineItem.intake_form_submission_line_item_id,
      ).toBe(saleLineItem.id);

      // Query the line item to verify the relationship
      const { getSalesOrderLineItemById } =
        await sdk.GetSalesOrderLineItemWithIntakeForm({
          id: createSaleSalesOrderLineItem.id,
        });
      invariant(getSalesOrderLineItemById);

      expect(
        getSalesOrderLineItemById.intake_form_submission_line_item_id,
      ).toBe(saleLineItem.id);
      expect(
        getSalesOrderLineItemById.intakeFormSubmissionLineItem,
      ).toBeDefined();
      expect(getSalesOrderLineItemById.intakeFormSubmissionLineItem?.id).toBe(
        saleLineItem.id,
      );
      expect(
        getSalesOrderLineItemById.intakeFormSubmissionLineItem?.description,
      ).toBe('Sale Equipment 1');
      expect(
        getSalesOrderLineItemById.intakeFormSubmissionLineItem?.quantity,
      ).toBe(5);
    });
  });

  describe('Authorization Failures', () => {
    it('should reject creating a sales order with intake form submission from a different workspace', async () => {
      // Create two separate workspaces with different users
      const { sdk: sdkA, utils: utilsA } = await createClient({
        userId: 'userA',
        companyId: 'companyA',
      });
      const { sdk: sdkB, user: userB } = await createClient({
        userId: 'userB',
        companyId: 'companyB',
      });

      // Workspace A: Create intake form and submission
      const workspaceA = await utilsA.createWorkspace();

      const { createIntakeForm } = await sdkA.CreateIntakeForm({
        input: {
          workspaceId: workspaceA.id,
          isActive: true,
        },
      });
      invariant(createIntakeForm?.id);

      const { createIntakeFormSubmission } =
        await sdkA.CreateIntakeFormSubmission({
          input: {
            formId: createIntakeForm.id,
            workspaceId: workspaceA.id,
            name: 'Workspace A Submitter',
            email: 'workspaceA@example.com',
          },
        });
      invariant(createIntakeFormSubmission?.id);

      // Workspace B: Try to create a sales order using Workspace A's submission
      const { createWorkspace: workspaceB } = await sdkB.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.SameDomain,
        name: 'Workspace B',
      });
      invariant(workspaceB?.id);

      const { createProject } = await sdkB.CreateProjectForSalesOrder({
        input: {
          name: 'Workspace B Project',
          project_code: 'WSB-001',
          deleted: false,
          workspaceId: workspaceB.id,
        },
      });
      invariant(createProject?.id);

      // This should fail due to authorization
      await expect(
        sdkB.CreateSalesOrderWithIntakeForm({
          input: {
            workspace_id: workspaceB.id,
            project_id: createProject.id,
            buyer_id: userB.id,
            purchase_order_number: 'PO-UNAUTHORIZED',
            intake_form_submission_id: createIntakeFormSubmission.id, // From workspace A
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('Non-existent ID Failures', () => {
    it('should reject creating a sales order with a non-existent intake form submission ID', async () => {
      const { sdk, utils, user } = await createClient();
      const workspace = await utils.createWorkspace();

      const { createProject } = await sdk.CreateProjectForSalesOrder({
        input: {
          name: 'Non-existent ID Project',
          project_code: 'NEI-001',
          deleted: false,
          workspaceId: workspace.id,
        },
      });
      invariant(createProject?.id);

      // Try to create a sales order with a non-existent intake form submission ID
      await expect(
        sdk.CreateSalesOrderWithIntakeForm({
          input: {
            workspace_id: workspace.id,
            project_id: createProject.id,
            buyer_id: user.id,
            purchase_order_number: 'PO-NONEXISTENT',
            intake_form_submission_id: 'IN_FRM_SUB_NONEXISTENT',
          },
        }),
      ).rejects.toThrow();
    });
  });
});
