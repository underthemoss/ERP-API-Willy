import { gql } from 'graphql-request';
import { createTestEnvironment } from './test-environment';
import { v4 as uuidv4 } from 'uuid';
import { RequestType, DeliveryMethod } from './generated/graphql';
import invariant from 'tiny-invariant';

// Define GraphQL operations for codegen
gql`
  mutation CreateIntakeForm($input: IntakeFormInput!) {
    createIntakeForm(input: $input) {
      id
      workspaceId
      projectId
      pricebookId
      isPublic
      isActive
      isDeleted
      createdAt
      updatedAt
      sharedWithUserIds
      sharedWithUsers {
        id
        email
        firstName
        lastName
      }
    }
  }
`;

gql`
  mutation SetIntakeFormActive($id: String!, $isActive: Boolean!) {
    setIntakeFormActive(id: $id, isActive: $isActive) {
      id
      isActive
      isDeleted
    }
  }
`;

gql`
  mutation DeleteIntakeForm($id: String!) {
    deleteIntakeForm(id: $id) {
      id
      isActive
      isDeleted
    }
  }
`;

gql`
  query GetIntakeFormById($id: String!) {
    getIntakeFormById(id: $id) {
      id
      workspaceId
      workspace {
        id
        name
      }
      projectId
      isActive
      isDeleted
      createdAt
      updatedAt
      pricebook {
        listPrices(page: { size: 10 }) {
          items {
            ... on RentalPrice {
              id
              pricePerDayInCents
              pricePerWeekInCents
              pricePerMonthInCents
            }
            ... on SalePrice {
              id
              unitCostInCents
            }
          }
        }
      }
    }
  }
`;

gql`
  query ListIntakeForms($workspaceId: String!) {
    listIntakeForms(workspaceId: $workspaceId) {
      items {
        id
        workspaceId
        projectId
        isActive
        isDeleted
        createdAt
        updatedAt
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

gql`
  query ListIntakeFormsWithWorkspace($workspaceId: String!) {
    listIntakeForms(workspaceId: $workspaceId) {
      items {
        id
        workspaceId
        workspace {
          id
          companyId
          name
          bannerImageUrl
          logoUrl
        }
        projectId
        isActive
        isDeleted
        createdAt
        updatedAt
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

gql`
  mutation CreateIntakeFormSubmission($input: IntakeFormSubmissionInput!) {
    createIntakeFormSubmission(input: $input) {
      id
      userId
      formId
      workspaceId
      name
      email
      createdAt
      phone
      companyName
      purchaseOrderNumber
      status
      submittedAt
      lineItems {
        id
        startDate
        description
        quantity
        durationInDays
        type
        pimCategoryId
        priceId
        customPriceName
        deliveryMethod
        deliveryLocation
        deliveryNotes
        rentalStartDate
        rentalEndDate
        salesOrderId
        salesOrderLineItem {
          ... on RentalSalesOrderLineItem {
            id
          }
          ... on SaleSalesOrderLineItem {
            id
          }
        }
      }
    }
  }
`;

gql`
  query ListIntakeFormSubmissions(
    $workspaceId: String!
    $intakeFormId: String
  ) {
    listIntakeFormSubmissions(
      workspaceId: $workspaceId
      intakeFormId: $intakeFormId
    ) {
      items {
        id
        userId
        formId
        workspaceId
        buyerWorkspaceId
        name
        email
        createdAt
        phone
        companyName
        purchaseOrderNumber
        lineItems {
          id
          startDate
          description
          quantity
          durationInDays
          type
          pimCategoryId
          deliveryMethod
        }
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

gql`
  query ListIntakeFormSubmissionsAsBuyer($buyerWorkspaceId: String!) {
    listIntakeFormSubmissionsAsBuyer(buyerWorkspaceId: $buyerWorkspaceId) {
      items {
        id
        userId
        formId
        workspaceId
        buyerWorkspaceId
        name
        email
        createdAt
        phone
        companyName
        purchaseOrderNumber
        lineItems {
          id
          startDate
          description
          quantity
          durationInDays
          type
          pimCategoryId
          deliveryMethod
        }
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

gql`
  mutation UpdateIntakeFormSubmission(
    $id: String!
    $input: UpdateIntakeFormSubmissionInput!
  ) {
    updateIntakeFormSubmission(id: $id, input: $input) {
      id
      userId
      formId
      workspaceId
      name
      email
      createdAt
      phone
      companyName
      purchaseOrderNumber
      lineItems {
        id
        startDate
        description
        quantity
        durationInDays
        type
        pimCategoryId
        deliveryMethod
      }
    }
  }
`;

// Line Item CRUD operations
gql`
  query GetIntakeFormSubmissionLineItem($id: String!) {
    getIntakeFormSubmissionLineItem(id: $id) {
      id
      startDate
      description
      quantity
      durationInDays
      type
      pimCategoryId
      priceId
      customPriceName
      deliveryMethod
      deliveryLocation
      deliveryNotes
      rentalStartDate
      rentalEndDate
      salesOrderId
      salesOrderLineItem {
        ... on RentalSalesOrderLineItem {
          id
        }
        ... on SaleSalesOrderLineItem {
          id
        }
      }
    }
  }
`;

gql`
  query ListIntakeFormSubmissionLineItems($submissionId: String!) {
    listIntakeFormSubmissionLineItems(submissionId: $submissionId) {
      id
      startDate
      description
      quantity
      durationInDays
      type
      pimCategoryId
      deliveryMethod
    }
  }
`;

gql`
  mutation CreateIntakeFormSubmissionLineItem(
    $submissionId: String!
    $input: IntakeFormLineItemInput!
  ) {
    createIntakeFormSubmissionLineItem(
      submissionId: $submissionId
      input: $input
    ) {
      id
      startDate
      description
      quantity
      durationInDays
      type
      pimCategoryId
      priceId
      customPriceName
      deliveryMethod
      deliveryLocation
      deliveryNotes
      rentalStartDate
      rentalEndDate
      salesOrderId
      salesOrderLineItem {
        ... on RentalSalesOrderLineItem {
          id
        }
        ... on SaleSalesOrderLineItem {
          id
        }
      }
    }
  }
`;

gql`
  mutation UpdateIntakeFormSubmissionLineItem(
    $id: String!
    $input: IntakeFormLineItemInput!
  ) {
    updateIntakeFormSubmissionLineItem(id: $id, input: $input) {
      id
      startDate
      description
      quantity
      durationInDays
      type
      pimCategoryId
      priceId
      customPriceName
      deliveryMethod
      deliveryLocation
      deliveryNotes
      rentalStartDate
      rentalEndDate
      salesOrderId
      salesOrderLineItem {
        ... on RentalSalesOrderLineItem {
          id
        }
        ... on SaleSalesOrderLineItem {
          id
        }
      }
    }
  }
`;

gql`
  mutation DeleteIntakeFormSubmissionLineItem($id: String!) {
    deleteIntakeFormSubmissionLineItem(id: $id)
  }
`;

gql`
  mutation SubmitIntakeFormSubmission($id: String!) {
    submitIntakeFormSubmission(id: $id) {
      id
      status
      submittedAt
      name
      email
    }
  }
`;

gql`
  query GetIntakeFormSubmissionById($id: String!) {
    getIntakeFormSubmissionById(id: $id) {
      id
      userId
      formId
      workspaceId
      name
      email
      createdAt
      phone
      companyName
      purchaseOrderNumber
      status
      submittedAt
      lineItems {
        id
        startDate
        description
        quantity
        durationInDays
        type
        pimCategoryId
        deliveryMethod
      }
    }
  }
`;

gql`
  mutation UpdateIntakeForm($id: String!, $input: UpdateIntakeFormInput!) {
    updateIntakeForm(id: $id, input: $input) {
      id
      workspaceId
      projectId
      pricebookId
      isPublic
      sharedWithUserIds
      sharedWithUsers {
        id
        email
      }
      isActive
      isDeleted
      createdAt
      updatedAt
    }
  }
`;

gql`
  query ListIntakeFormsForUser($page: Int, $limit: Int) {
    listIntakeFormsForUser(page: $page, limit: $limit) {
      items {
        id
        workspaceId
        projectId
        pricebookId
        isPublic
        sharedWithUserIds
        isActive
        isDeleted
        createdAt
        updatedAt
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

gql`
  mutation AdoptOrphanedSubmissions(
    $workspaceId: String!
    $submissionIds: [ID!]
  ) {
    adoptOrphanedSubmissions(
      workspaceId: $workspaceId
      submissionIds: $submissionIds
    ) {
      adoptedCount
      adoptedSubmissionIds
      adoptedSubmissions {
        id
        userId
        formId
        workspaceId
        buyerWorkspaceId
        name
        email
      }
    }
  }
`;

gql`
  query ListMyOrphanedSubmissions {
    listMyOrphanedSubmissions {
      id
      userId
      formId
      workspaceId
      buyerWorkspaceId
      name
      email
    }
  }
`;

const { createClient, createAnonTestClient } = createTestEnvironment();

describe('Intake Forms E2E Tests', () => {
  describe('IntakeForm Mutations', () => {
    it('should create an intake form', async () => {
      const { sdk, utils } = await createClient();

      const workspace = await utils.createWorkspace();

      const variables = {
        input: {
          workspaceId: workspace.id,
          projectId: null,
          isActive: true,
        },
      };

      const response = await sdk.CreateIntakeForm(variables);

      expect(response.createIntakeForm).toBeDefined();
      expect(response.createIntakeForm?.workspaceId).toBe(workspace.id);
      expect(response.createIntakeForm?.isActive).toBe(true);
      expect(response.createIntakeForm?.id).toMatch(/^IN_FRM/);
    });

    it('should create an intake form with a project ID', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();

      const projectId = `PROJ_${uuidv4()}`;
      const variables = {
        input: {
          workspaceId: workspace.id,
          projectId,
          isActive: true,
        },
      };

      const response = await sdk.CreateIntakeForm(variables);

      expect(response.createIntakeForm).toBeDefined();
      expect(response.createIntakeForm?.projectId).toBe(projectId);
    });
  });

  describe('Public Intake Forms', () => {
    it('should create a public intake form, and can be viewed by any anon user (no pricebook)', async () => {
      const { sdk, utils } = await createClient();
      const { sdk: anonSdk } = createAnonTestClient();

      const workspace = await utils.createWorkspace();

      const { createIntakeForm } = await sdk.CreateIntakeForm({
        input: {
          workspaceId: workspace.id,
          isPublic: true,
          isActive: true,
        },
      });

      invariant(createIntakeForm?.id);

      expect(createIntakeForm.workspaceId).toBe(workspace.id);
      expect(createIntakeForm.isActive).toBe(true);
      expect(createIntakeForm.id).toMatch(/^IN_FRM/);

      const { getIntakeFormById } = await anonSdk.GetIntakeFormById({
        id: createIntakeForm.id,
      });

      invariant(getIntakeFormById);

      expect(getIntakeFormById.id).toBe(createIntakeForm.id);
      expect(getIntakeFormById.pricebook).toBeNull();

      // deleting the form, should mean anon users can no longer see the form
      const { deleteIntakeForm } = await sdk.DeleteIntakeForm({
        id: createIntakeForm.id,
      });
      invariant(deleteIntakeForm?.id);
      expect(deleteIntakeForm.isDeleted).toBe(true);

      await expect(
        anonSdk.GetIntakeFormById({
          id: createIntakeForm.id,
        }),
      ).rejects.toThrow();
    });

    it('should create a public intake form, and can be viewed by any anon user (with pricebook)', async () => {
      const { sdk, utils } = await createClient();
      const { sdk: anonSdk } = createAnonTestClient();

      const workspace = await utils.createWorkspace();

      const { priceBook } = await utils.createPriceBookAndPrices(workspace.id);

      const { createIntakeForm } = await sdk.CreateIntakeForm({
        input: {
          workspaceId: workspace.id,
          isPublic: true,
          isActive: true,
          pricebookId: priceBook.id,
        },
      });

      invariant(createIntakeForm?.id);

      expect(createIntakeForm.workspaceId).toBe(workspace.id);
      expect(createIntakeForm.isActive).toBe(true);
      expect(createIntakeForm.id).toMatch(/^IN_FRM/);

      const { getIntakeFormById } = await anonSdk.GetIntakeFormById({
        id: createIntakeForm.id,
      });

      invariant(getIntakeFormById);

      expect(getIntakeFormById.id).toBe(createIntakeForm.id);
      expect(getIntakeFormById.pricebook).toBeDefined();
      expect(getIntakeFormById.pricebook?.listPrices?.items).toHaveLength(1);

      // deleting the form, should mean anon users can no longer see the pricebook
      const { deleteIntakeForm } = await sdk.DeleteIntakeForm({
        id: createIntakeForm.id,
      });
      invariant(deleteIntakeForm?.id);
      expect(deleteIntakeForm.isDeleted).toBe(true);

      await expect(
        anonSdk.GetPriceBookById({
          id: priceBook.id,
        }),
      ).rejects.toThrow();
    });
  });

  describe('Private Intake Forms', () => {
    it('should create a private intake form, not viewable to anon users', async () => {
      const { sdk, utils } = await createClient();
      const { sdk: anonSdk } = createAnonTestClient();

      const workspace = await utils.createWorkspace();

      const { createIntakeForm } = await sdk.CreateIntakeForm({
        input: {
          workspaceId: workspace.id,
          isPublic: false,
          isActive: true,
        },
      });

      invariant(createIntakeForm?.id);

      expect(createIntakeForm.workspaceId).toBe(workspace.id);
      expect(createIntakeForm.isActive).toBe(true);
      expect(createIntakeForm.id).toMatch(/^IN_FRM/);

      await expect(
        anonSdk.GetIntakeFormById({
          id: createIntakeForm.id,
        }),
      ).rejects.toThrow();
    });

    it('should create a private intake form, and can be viewed by those invited', async () => {
      const { sdk, utils } = await createClient();
      const { sdk: anonSdk } = createAnonTestClient();

      const workspace = await utils.createWorkspace();

      const { priceBook } = await utils.createPriceBookAndPrices(workspace.id);

      const { createIntakeForm } = await sdk.CreateIntakeForm({
        input: {
          workspaceId: workspace.id,
          isPublic: false,
          isActive: true,
          pricebookId: priceBook.id,
          sharedWithEmails: ['brian.mullan@equipmentshare.com'],
        },
      });

      invariant(createIntakeForm?.id);

      expect(createIntakeForm.workspaceId).toBe(workspace.id);
      expect(createIntakeForm.isActive).toBe(true);
      expect(createIntakeForm.id).toMatch(/^IN_FRM/);
      expect(createIntakeForm.sharedWithUserIds).toHaveLength(1);

      const brianUserId = createIntakeForm?.sharedWithUserIds?.[0];

      await expect(
        anonSdk.GetIntakeFormById({
          id: createIntakeForm.id,
        }),
      ).rejects.toThrow();

      const { sdk: brianSdk } = await createClient({
        userEmail: 'brian.mullan@equipmentshare.com',
        userId: brianUserId,
      });

      const { getIntakeFormById } = await brianSdk.GetIntakeFormById({
        id: createIntakeForm.id,
      });

      invariant(getIntakeFormById);

      expect(getIntakeFormById.id).toBe(createIntakeForm.id);
      expect(getIntakeFormById.pricebook).toBeDefined();
      expect(getIntakeFormById.pricebook?.listPrices?.items).toHaveLength(1);

      // brian user shouldn't be able to see any other pricebooks
      await expect(
        brianSdk.ListPriceBooks({
          filter: {
            workspaceId: workspace.id,
          },
          page: {
            size: 10,
          },
        }),
      ).rejects.toThrow();

      // deleting the form, should mean anon users can no longer see the pricebook
      const { deleteIntakeForm } = await sdk.DeleteIntakeForm({
        id: createIntakeForm.id,
      });
      invariant(deleteIntakeForm?.id);
      expect(deleteIntakeForm.isDeleted).toBe(true);

      await expect(
        brianSdk.GetPriceBookById({
          id: priceBook.id,
        }),
      ).rejects.toThrow();
    });
  });

  describe('IntakeForm Queries', () => {
    it('should get an intake form by ID', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();

      // First create a form
      const projectId = `PROJ_${uuidv4()}`;
      const createVariables = {
        input: {
          workspaceId: workspace.id,
          projectId,
          isActive: true,
        },
      };

      const createResponse = await sdk.CreateIntakeForm(createVariables);
      const createdFormId = createResponse.createIntakeForm?.id || '';

      // Now get the form by ID
      const response = await sdk.GetIntakeFormById({ id: createdFormId });

      expect(response.getIntakeFormById).toBeDefined();
      expect(response.getIntakeFormById?.id).toBe(createdFormId);
      expect(response.getIntakeFormById?.workspaceId).toBe(workspace.id);
      expect(response.getIntakeFormById?.projectId).toBe(projectId);
      expect(response.getIntakeFormById?.isActive).toBe(true);
    });

    it('should return null for non-existent intake form ID', async () => {
      const { sdk } = await createClient();

      await expect(
        sdk.GetIntakeFormById({
          id: 'IN_FRM-NONEXISTENT',
        }),
      ).rejects.toThrow();
    });

    it('should list intake forms for a workspace', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();

      // First create a form
      const createVariables = {
        input: {
          workspaceId: workspace.id,
          isActive: true,
        },
      };

      const createResponse = await sdk.CreateIntakeForm(createVariables);
      const formId = createResponse.createIntakeForm?.id as string;

      // Now list forms
      const response = await sdk.ListIntakeForms({ workspaceId: workspace.id });

      expect(response.listIntakeForms).toBeDefined();
      expect(response.listIntakeForms?.items).toBeInstanceOf(Array);
      expect(response.listIntakeForms?.items.length).toBeGreaterThan(0);
      expect(response.listIntakeForms?.page).toBeDefined();
      expect(response.listIntakeForms?.page.number).toBe(1);
      expect(response.listIntakeForms?.page.totalItems).toBeGreaterThan(0);

      // Verify the form we created is in the list
      const createdForm = response.listIntakeForms?.items.find(
        (form: any) => form.id === formId,
      );
      expect(createdForm).toBeDefined();
    });

    it('should throw when trying to list intake forms for a different workspace', async () => {
      const { sdk } = await createClient();

      await expect(
        sdk.ListIntakeForms({
          workspaceId: `WS_${uuidv4()}`,
        }),
      ).rejects.toThrow();
    });
  });

  describe('IntakeFormSubmission Mutations', () => {
    it('should create an intake form submission and add line items separately', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();

      // First create a form
      const formVariables = {
        input: {
          workspaceId: workspace.id,
          isActive: true,
        },
      };

      const formResponse = await sdk.CreateIntakeForm(formVariables);
      const formId = formResponse.createIntakeForm?.id as string;

      // Create a submission without line items
      const testEmail = `${uuidv4()}@example.com`;
      const variables = {
        input: {
          formId,
          workspaceId: workspace.id,
          name: 'John Doe',
          email: testEmail,
          phone: '+1234567890',
          companyName: 'Test Company',
          purchaseOrderNumber: 'PO-12345',
        },
      };

      const response = await sdk.CreateIntakeFormSubmission(variables);

      expect(response.createIntakeFormSubmission).toBeDefined();
      expect(response.createIntakeFormSubmission?.formId).toBe(formId);
      expect(response.createIntakeFormSubmission?.workspaceId).toBe(
        workspace.id,
      );
      expect(response.createIntakeFormSubmission?.name).toBe('John Doe');
      expect(response.createIntakeFormSubmission?.email).toBe(testEmail);
      expect(response.createIntakeFormSubmission?.phone).toBe('+1234567890');
      expect(response.createIntakeFormSubmission?.companyName).toBe(
        'Test Company',
      );
      expect(response.createIntakeFormSubmission?.purchaseOrderNumber).toBe(
        'PO-12345',
      );
      expect(response.createIntakeFormSubmission?.id).toMatch(/^IN_FRM_SUB/);

      // Status should be DRAFT initially
      expect(response.createIntakeFormSubmission?.status).toBe('DRAFT');
      expect(response.createIntakeFormSubmission?.submittedAt).toBeNull();

      // Line items should be empty initially
      expect(response.createIntakeFormSubmission?.lineItems).toEqual([]);

      // Now add line items separately
      const submissionId = response.createIntakeFormSubmission?.id as string;

      const lineItem1 = await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Equipment rental - Excavator',
          quantity: 2,
          durationInDays: 30,
          type: RequestType.Rental,
          pimCategoryId: 'PIM_CAT_123',
          deliveryMethod: DeliveryMethod.Delivery,
          deliveryLocation: '123 Main St',
          deliveryNotes: 'Please deliver to loading dock',
          rentalStartDate: new Date().toISOString(),
          rentalEndDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      });

      const lineItem2 = await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Equipment rental - Bulldozer',
          quantity: 1,
          durationInDays: 15,
          type: RequestType.Rental,
          pimCategoryId: 'PIM_CAT_456',
          deliveryMethod: DeliveryMethod.Pickup,
          customPriceName: 'Special Rate',
        },
      });

      expect(lineItem1.createIntakeFormSubmissionLineItem?.description).toBe(
        'Equipment rental - Excavator',
      );
      expect(lineItem2.createIntakeFormSubmissionLineItem?.description).toBe(
        'Equipment rental - Bulldozer',
      );

      // Verify line items are associated with the submission
      const lineItems = await sdk.ListIntakeFormSubmissionLineItems({
        submissionId,
      });
      expect(lineItems.listIntakeFormSubmissionLineItems).toHaveLength(2);
    });

    it('should create a minimal intake form submission without line items', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();

      // First create a form
      const formVariables = {
        input: {
          workspaceId: workspace.id,
          isActive: true,
        },
      };

      const formResponse = await sdk.CreateIntakeForm(formVariables);
      const formId = formResponse.createIntakeForm?.id as string;

      const testEmail = `${uuidv4()}@example.com`;
      const variables = {
        input: {
          formId,
          workspaceId: workspace.id,
          name: 'Jane Smith',
          email: testEmail,
        },
      };

      const response = await sdk.CreateIntakeFormSubmission(variables);

      expect(response.createIntakeFormSubmission).toBeDefined();
      expect(response.createIntakeFormSubmission?.name).toBe('Jane Smith');
      expect(response.createIntakeFormSubmission?.email).toBe(testEmail);
      expect(response.createIntakeFormSubmission?.phone).toBeNull();
      expect(response.createIntakeFormSubmission?.companyName).toBeNull();
      expect(
        response.createIntakeFormSubmission?.purchaseOrderNumber,
      ).toBeNull();
      // Line items should be an empty array when none are provided
      expect(response.createIntakeFormSubmission?.lineItems).toEqual([]);
    });
  });

  describe('IntakeFormSubmission Queries', () => {
    it('should list intake form submissions for a workspace', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();

      // First create a form and submission
      const formVariables = {
        input: {
          workspaceId: workspace.id,
          isActive: true,
        },
      };

      const formResponse = await sdk.CreateIntakeForm(formVariables);
      const formId = formResponse.createIntakeForm?.id as string;

      const testEmail = `${uuidv4()}@example.com`;
      const submissionVariables = {
        input: {
          formId,
          workspaceId: workspace.id,
          name: 'John Doe',
          email: testEmail,
        },
      };

      const submissionResponse =
        await sdk.CreateIntakeFormSubmission(submissionVariables);
      const submissionId = submissionResponse.createIntakeFormSubmission
        ?.id as string;

      // Add a line item separately
      await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Test equipment',
          quantity: 1,
          durationInDays: 7,
          type: RequestType.Rental,
          pimCategoryId: 'PIM_CAT_789',
          deliveryMethod: DeliveryMethod.Delivery,
        },
      });

      // Now list submissions
      const response = await sdk.ListIntakeFormSubmissions({
        workspaceId: workspace.id,
      });

      expect(response.listIntakeFormSubmissions).toBeDefined();
      expect(response.listIntakeFormSubmissions?.items).toBeInstanceOf(Array);
      expect(response.listIntakeFormSubmissions?.items.length).toBeGreaterThan(
        0,
      );
      expect(response.listIntakeFormSubmissions?.page).toBeDefined();
      expect(response.listIntakeFormSubmissions?.page.number).toBe(1);
      expect(
        response.listIntakeFormSubmissions?.page.totalItems,
      ).toBeGreaterThan(0);

      // Verify the submission we created is in the list
      const createdSubmission = response.listIntakeFormSubmissions?.items.find(
        (submission: any) => submission.id === submissionId,
      );
      expect(createdSubmission).toBeDefined();
      expect(createdSubmission!.name).toBe('John Doe');
      expect(createdSubmission!.lineItems).toHaveLength(1);
    });

    it('should return empty list for non-existent workspace', async () => {
      const { sdk } = await createClient();

      await expect(
        sdk.ListIntakeFormSubmissions({
          workspaceId: `WS_${uuidv4()}`,
        }),
      ).rejects.toThrow();
    });

    it('should filter intake form submissions by intakeFormId', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();

      // Create two forms
      const form1Response = await sdk.CreateIntakeForm({
        input: {
          workspaceId: workspace.id,
          isActive: true,
        },
      });
      const form1Id = form1Response.createIntakeForm?.id as string;

      const form2Response = await sdk.CreateIntakeForm({
        input: {
          workspaceId: workspace.id,
          isActive: true,
        },
      });
      const form2Id = form2Response.createIntakeForm?.id as string;

      // Create submissions for form1
      const submission1Response = await sdk.CreateIntakeFormSubmission({
        input: {
          formId: form1Id,
          workspaceId: workspace.id,
          name: 'Form1 Submission 1',
          email: `form1-sub1-${uuidv4()}@example.com`,
        },
      });
      const submission1Id = submission1Response.createIntakeFormSubmission
        ?.id as string;

      const submission2Response = await sdk.CreateIntakeFormSubmission({
        input: {
          formId: form1Id,
          workspaceId: workspace.id,
          name: 'Form1 Submission 2',
          email: `form1-sub2-${uuidv4()}@example.com`,
        },
      });
      const submission2Id = submission2Response.createIntakeFormSubmission
        ?.id as string;

      // Create submissions for form2
      const submission3Response = await sdk.CreateIntakeFormSubmission({
        input: {
          formId: form2Id,
          workspaceId: workspace.id,
          name: 'Form2 Submission 1',
          email: `form2-sub1-${uuidv4()}@example.com`,
        },
      });
      const submission3Id = submission3Response.createIntakeFormSubmission
        ?.id as string;

      // Add line items to distinguish submissions
      await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId: submission1Id,
        input: {
          startDate: new Date().toISOString(),
          description: 'Form1 Item',
          quantity: 1,
          durationInDays: 1,
          type: RequestType.Rental,
          pimCategoryId: 'PIM_CAT_F1',
          deliveryMethod: DeliveryMethod.Pickup,
        },
      });

      await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId: submission3Id,
        input: {
          startDate: new Date().toISOString(),
          description: 'Form2 Item',
          quantity: 1,
          durationInDays: 1,
          type: RequestType.Rental,
          pimCategoryId: 'PIM_CAT_F2',
          deliveryMethod: DeliveryMethod.Pickup,
        },
      });

      // Test 1: Filter by form1Id - should get 2 submissions
      const form1Submissions = await sdk.ListIntakeFormSubmissions({
        workspaceId: workspace.id,
        intakeFormId: form1Id,
      });

      expect(form1Submissions.listIntakeFormSubmissions?.items).toHaveLength(2);
      expect(form1Submissions.listIntakeFormSubmissions?.page.totalItems).toBe(
        2,
      );

      const form1SubmissionIds =
        form1Submissions.listIntakeFormSubmissions?.items.map((s) => s.id) ||
        [];
      expect(form1SubmissionIds).toContain(submission1Id);
      expect(form1SubmissionIds).toContain(submission2Id);
      expect(form1SubmissionIds).not.toContain(submission3Id);

      // All submissions should be for form1
      form1Submissions.listIntakeFormSubmissions?.items.forEach(
        (submission) => {
          expect(submission.formId).toBe(form1Id);
        },
      );

      // Test 2: Filter by form2Id - should get 1 submission
      const form2Submissions = await sdk.ListIntakeFormSubmissions({
        workspaceId: workspace.id,
        intakeFormId: form2Id,
      });

      expect(form2Submissions.listIntakeFormSubmissions?.items).toHaveLength(1);
      expect(form2Submissions.listIntakeFormSubmissions?.page.totalItems).toBe(
        1,
      );
      expect(form2Submissions.listIntakeFormSubmissions?.items[0].id).toBe(
        submission3Id,
      );
      expect(form2Submissions.listIntakeFormSubmissions?.items[0].formId).toBe(
        form2Id,
      );
      expect(form2Submissions.listIntakeFormSubmissions?.items[0].name).toBe(
        'Form2 Submission 1',
      );

      // Test 3: No filter - should get all 3 submissions
      const allSubmissions = await sdk.ListIntakeFormSubmissions({
        workspaceId: workspace.id,
      });

      expect(
        allSubmissions.listIntakeFormSubmissions?.items.length,
      ).toBeGreaterThanOrEqual(3);
      const allSubmissionIds =
        allSubmissions.listIntakeFormSubmissions?.items.map((s) => s.id) || [];
      expect(allSubmissionIds).toContain(submission1Id);
      expect(allSubmissionIds).toContain(submission2Id);
      expect(allSubmissionIds).toContain(submission3Id);

      // Test 4: Filter by non-existent formId - should get empty list
      const noSubmissions = await sdk.ListIntakeFormSubmissions({
        workspaceId: workspace.id,
        intakeFormId: `IN_FRM_${uuidv4()}`,
      });

      expect(noSubmissions.listIntakeFormSubmissions?.items).toHaveLength(0);
      expect(noSubmissions.listIntakeFormSubmissions?.page.totalItems).toBe(0);
    });
  });

  describe('IntakeForm Active Status', () => {
    it('should set intake form active status to false', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();

      // First create a form
      const createVariables = {
        input: {
          workspaceId: workspace.id,
          isActive: true,
        },
      };

      const createResponse = await sdk.CreateIntakeForm(createVariables);
      const createdFormId = createResponse.createIntakeForm?.id || '';
      expect(createResponse.createIntakeForm?.isActive).toBe(true);
      expect(createResponse.createIntakeForm?.isDeleted).toBe(false);

      // Now set active to false
      const setActiveResponse = await sdk.SetIntakeFormActive({
        id: createdFormId,
        isActive: false,
      });

      expect(setActiveResponse.setIntakeFormActive).toBeDefined();
      expect(setActiveResponse.setIntakeFormActive?.id).toBe(createdFormId);
      expect(setActiveResponse.setIntakeFormActive?.isActive).toBe(false);
      expect(setActiveResponse.setIntakeFormActive?.isDeleted).toBe(false);
    });

    it('should set intake form active status to true', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();

      // First create a form with isActive false
      const createVariables = {
        input: {
          workspaceId: workspace.id,
          isActive: false,
        },
      };

      const createResponse = await sdk.CreateIntakeForm(createVariables);
      const createdFormId = createResponse.createIntakeForm?.id || '';
      expect(createResponse.createIntakeForm?.isActive).toBe(false);

      // Now set active to true
      const setActiveResponse = await sdk.SetIntakeFormActive({
        id: createdFormId,
        isActive: true,
      });

      expect(setActiveResponse.setIntakeFormActive).toBeDefined();
      expect(setActiveResponse.setIntakeFormActive?.id).toBe(createdFormId);
      expect(setActiveResponse.setIntakeFormActive?.isActive).toBe(true);
    });

    it('should throw error when setting active status for non-existent form', async () => {
      const { sdk } = await createClient();

      await expect(
        sdk.SetIntakeFormActive({
          id: 'IN_FRM-NONEXISTENT',
          isActive: false,
        }),
      ).rejects.toThrow();
    });
  });

  describe('IntakeForm Soft Delete', () => {
    it('should soft delete an intake form', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();

      // First create a form
      const createVariables = {
        input: {
          workspaceId: workspace.id,
          isActive: true,
        },
      };

      const createResponse = await sdk.CreateIntakeForm(createVariables);
      const createdFormId = createResponse.createIntakeForm?.id || '';
      expect(createResponse.createIntakeForm?.isDeleted).toBe(false);

      // Now delete the form
      const deleteResponse = await sdk.DeleteIntakeForm({
        id: createdFormId,
      });

      expect(deleteResponse.deleteIntakeForm).toBeDefined();
      expect(deleteResponse.deleteIntakeForm?.id).toBe(createdFormId);
      expect(deleteResponse.deleteIntakeForm?.isDeleted).toBe(true);
    });

    it('should filter out deleted forms from list', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();

      // Create two forms
      const createVariables = {
        input: {
          workspaceId: workspace.id,
          isActive: true,
        },
      };

      const createResponse1 = await sdk.CreateIntakeForm(createVariables);
      const formId1 = createResponse1.createIntakeForm?.id || '';

      const createResponse2 = await sdk.CreateIntakeForm(createVariables);
      const formId2 = createResponse2.createIntakeForm?.id || '';

      // Delete the first form
      await sdk.DeleteIntakeForm({ id: formId1 });

      // List forms - should only see the non-deleted one
      const listResponse = await sdk.ListIntakeForms({
        workspaceId: workspace.id,
      });

      // Should not include the deleted form
      const formIds = listResponse.listIntakeForms?.items.map(
        (item: any) => item.id,
      );
      expect(formIds).toContain(formId2);
      expect(formIds).not.toContain(formId1);

      // All returned forms should have isDeleted: false
      listResponse.listIntakeForms?.items.forEach((item: any) => {
        expect(item.isDeleted).toBe(false);
      });
    });

    it('should still return deleted form when getting by ID', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();

      // First create and delete a form
      const createVariables = {
        input: {
          workspaceId: workspace.id,
          isActive: true,
        },
      };

      const createResponse = await sdk.CreateIntakeForm(createVariables);
      const createdFormId = createResponse.createIntakeForm?.id || '';

      // Delete the form
      await sdk.DeleteIntakeForm({ id: createdFormId });

      // Get the deleted form by ID - should still return it
      const getResponse = await sdk.GetIntakeFormById({
        id: createdFormId,
      });

      expect(getResponse.getIntakeFormById).toBeDefined();
      expect(getResponse.getIntakeFormById?.id).toBe(createdFormId);
      expect(getResponse.getIntakeFormById?.isDeleted).toBe(true);
    });

    it('should throw error when deleting non-existent form', async () => {
      const { sdk } = await createClient();

      await expect(
        sdk.DeleteIntakeForm({
          id: 'IN_FRM-NONEXISTENT',
        }),
      ).rejects.toThrow();
    });
  });

  describe('IntakeForm Workspace Resolver', () => {
    it('should resolve workspace field for intake form', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create an intake form
      const createVariables = {
        input: {
          workspaceId,
          isActive: true,
        },
      };

      const createResponse = await sdk.CreateIntakeForm(createVariables);
      const createdFormId = createResponse.createIntakeForm?.id || '';

      // Now get the form with workspace field
      const response = await sdk.GetIntakeFormById({
        id: createdFormId,
      });

      expect(response.getIntakeFormById).toBeDefined();
      expect(response.getIntakeFormById?.id).toBe(createdFormId);
      expect(response.getIntakeFormById?.workspaceId).toBe(workspaceId);

      // Verify workspace field is resolved correctly
      expect(response.getIntakeFormById?.workspace).toBeDefined();
      expect(response.getIntakeFormById?.workspace?.id).toBe(workspaceId);
      expect(response.getIntakeFormById?.workspace?.name).toEqual(
        expect.any(String),
      );
    });
  });

  describe('Update IntakeFormSubmission', () => {
    it('should update an intake form submission metadata', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // First create a form
      const createFormVariables = {
        input: {
          workspaceId: workspace.id,
          isActive: true,
        },
      };

      const formResponse = await sdk.CreateIntakeForm(createFormVariables);
      const formId = formResponse.createIntakeForm?.id || '';

      // Create a submission without line items
      const testEmail = `${uuidv4()}@example.com`;
      const createSubmissionResponse = await sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId,
          name: 'Test User',
          email: testEmail,
          phone: '+1234567890',
          companyName: 'Original Company',
          purchaseOrderNumber: 'PO-001',
        },
      });

      const submissionId =
        createSubmissionResponse.createIntakeFormSubmission?.id || '';

      // Add a line item separately
      await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Original equipment',
          quantity: 1,
          durationInDays: 10,
          type: RequestType.Rental,
          pimCategoryId: 'PIM_CAT_001',
          deliveryMethod: DeliveryMethod.Pickup,
        },
      });

      // Now update the submission (only metadata, not line items)
      const updateResponse = await sdk.UpdateIntakeFormSubmission({
        id: submissionId,
        input: {
          userId: 'USER_123',
          purchaseOrderNumber: 'PO-002',
        },
      });

      expect(updateResponse.updateIntakeFormSubmission).toBeDefined();
      expect(updateResponse.updateIntakeFormSubmission?.id).toBe(submissionId);
      expect(updateResponse.updateIntakeFormSubmission?.userId).toBe(
        'USER_123',
      );
      expect(
        updateResponse.updateIntakeFormSubmission?.purchaseOrderNumber,
      ).toBe('PO-002');
      // Line items should still be there (fetched from separate collection)
      expect(updateResponse.updateIntakeFormSubmission?.lineItems).toHaveLength(
        1,
      );
      expect(
        updateResponse.updateIntakeFormSubmission?.lineItems?.[0].description,
      ).toBe('Original equipment');
      // Unchanged fields should remain the same
      expect(updateResponse.updateIntakeFormSubmission?.name).toBe('Test User');
      expect(updateResponse.updateIntakeFormSubmission?.email).toBe(testEmail);
      expect(updateResponse.updateIntakeFormSubmission?.phone).toBe(
        '+1234567890',
      );
      expect(updateResponse.updateIntakeFormSubmission?.companyName).toBe(
        'Original Company',
      );
    });

    it('should update only specified fields', async () => {
      const { sdk, utils } = await createClient();

      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // First create a form
      const createFormVariables = {
        input: {
          workspaceId,
          isActive: true,
        },
      };

      const formResponse = await sdk.CreateIntakeForm(createFormVariables);
      const formId = formResponse.createIntakeForm?.id || '';

      // Create a submission
      const testEmail = `${uuidv4()}@example.com`;
      const createSubmissionResponse = await sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId,
          name: 'Test User',
          email: testEmail,
          purchaseOrderNumber: 'PO-100',
        },
      });

      const submissionId =
        createSubmissionResponse.createIntakeFormSubmission?.id || '';

      // Add a line item separately
      await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Original item',
          quantity: 1,
          durationInDays: 5,
          type: RequestType.Purchase,
          pimCategoryId: 'PIM_CAT_100',
          deliveryMethod: DeliveryMethod.Delivery,
        },
      });

      // Update only userId
      const updateResponse = await sdk.UpdateIntakeFormSubmission({
        id: submissionId,
        input: {
          userId: 'USER_67890',
        },
      });

      expect(updateResponse.updateIntakeFormSubmission).toBeDefined();
      expect(updateResponse.updateIntakeFormSubmission?.userId).toBe(
        'USER_67890',
      );
      // Other fields should remain unchanged
      expect(
        updateResponse.updateIntakeFormSubmission?.purchaseOrderNumber,
      ).toBe('PO-100');
      expect(updateResponse.updateIntakeFormSubmission?.lineItems).toHaveLength(
        1,
      );
      expect(
        updateResponse.updateIntakeFormSubmission?.lineItems?.[0].description,
      ).toBe('Original item');
    });

    it('should throw error when updating non-existent submission', async () => {
      const { sdk } = await createClient();

      await expect(
        sdk.UpdateIntakeFormSubmission({
          id: 'IN_FRM_SUB-NONEXISTENT',
          input: {
            userId: 'USER_12345',
          },
        }),
      ).rejects.toThrow();
    });

    it('should clear optional fields when set to null', async () => {
      const { sdk, utils } = await createClient();

      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // First create a form
      const createFormVariables = {
        input: {
          workspaceId,
          isActive: true,
        },
      };

      const formResponse = await sdk.CreateIntakeForm(createFormVariables);
      const formId = formResponse.createIntakeForm?.id || '';

      // Create a submission with optional fields
      const testEmail = `${uuidv4()}@example.com`;
      const createSubmissionResponse = await sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId,
          name: 'Test User',
          email: testEmail,
          userId: 'USER_INITIAL',
          purchaseOrderNumber: 'PO-999',
        },
      });

      const submissionId =
        createSubmissionResponse.createIntakeFormSubmission?.id || '';

      // Add a line item separately
      await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Test item',
          quantity: 1,
          durationInDays: 1,
          type: RequestType.Rental,
          pimCategoryId: 'PIM_CAT_999',
          deliveryMethod: DeliveryMethod.Pickup,
        },
      });

      // Clear optional fields by setting them to null
      const updateResponse = await sdk.UpdateIntakeFormSubmission({
        id: submissionId,
        input: {
          userId: null,
          purchaseOrderNumber: null,
        },
      });

      expect(updateResponse.updateIntakeFormSubmission).toBeDefined();
      expect(updateResponse.updateIntakeFormSubmission?.userId).toBeNull();
      expect(
        updateResponse.updateIntakeFormSubmission?.purchaseOrderNumber,
      ).toBeNull();
      // Line items should still exist (they're managed separately now)
      expect(updateResponse.updateIntakeFormSubmission?.lineItems).toHaveLength(
        1,
      );
    });
  });

  describe('IntakeFormSubmission Line Item CRUD', () => {
    it('should create a line item for an existing submission', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create form and submission first
      const formResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      const testEmail = `${uuidv4()}@example.com`;
      const submissionResponse = await sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId,
          name: 'Test User',
          email: testEmail,
        },
      });
      const submissionId =
        submissionResponse.createIntakeFormSubmission?.id || '';

      // Create a line item
      const lineItemResponse = await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'New line item',
          quantity: 3,
          durationInDays: 7,
          type: RequestType.Rental,
          pimCategoryId: 'PIM_CAT_NEW',
          deliveryMethod: DeliveryMethod.Delivery,
          deliveryLocation: '789 Pine St',
          customPriceName: 'Custom Price',
        },
      });

      expect(lineItemResponse.createIntakeFormSubmissionLineItem).toBeDefined();
      expect(lineItemResponse.createIntakeFormSubmissionLineItem?.id).toMatch(
        /^IN_FRM_LI/,
      );
      expect(
        lineItemResponse.createIntakeFormSubmissionLineItem?.description,
      ).toBe('New line item');
      expect(
        lineItemResponse.createIntakeFormSubmissionLineItem?.quantity,
      ).toBe(3);
      expect(
        lineItemResponse.createIntakeFormSubmissionLineItem?.deliveryLocation,
      ).toBe('789 Pine St');
      expect(
        lineItemResponse.createIntakeFormSubmissionLineItem?.customPriceName,
      ).toBe('Custom Price');
    });

    it('should get a line item by ID', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create form, submission, and line item
      const formResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      const testEmail = `${uuidv4()}@example.com`;
      const submissionResponse = await sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId,
          name: 'Test User',
          email: testEmail,
        },
      });

      const submissionId =
        submissionResponse.createIntakeFormSubmission?.id || '';

      // Create a line item separately
      const lineItemResponse = await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Test line item',
          quantity: 2,
          durationInDays: 5,
          type: RequestType.Purchase,
          pimCategoryId: 'PIM_CAT_TEST',
          deliveryMethod: DeliveryMethod.Pickup,
        },
      });

      const lineItemId =
        lineItemResponse.createIntakeFormSubmissionLineItem?.id || '';

      // Get the line item by ID
      const getResponse = await sdk.GetIntakeFormSubmissionLineItem({
        id: lineItemId,
      });

      expect(getResponse.getIntakeFormSubmissionLineItem).toBeDefined();
      expect(getResponse.getIntakeFormSubmissionLineItem?.id).toBe(lineItemId);
      expect(getResponse.getIntakeFormSubmissionLineItem?.description).toBe(
        'Test line item',
      );
      expect(getResponse.getIntakeFormSubmissionLineItem?.quantity).toBe(2);
    });

    it('should list all line items for a submission', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create form and submission with multiple line items
      const formResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      const submissionResponse = await sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId,
          name: 'Test User',
          email: 'test@example.com',
        },
      });

      const submissionId =
        submissionResponse.createIntakeFormSubmission?.id || '';

      // Create line items separately
      await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Line item 1',
          quantity: 1,
          durationInDays: 3,
          type: RequestType.Rental,
          pimCategoryId: 'PIM_CAT_1',
          deliveryMethod: DeliveryMethod.Delivery,
        },
      });

      await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Line item 2',
          quantity: 2,
          durationInDays: 4,
          type: RequestType.Purchase,
          pimCategoryId: 'PIM_CAT_2',
          deliveryMethod: DeliveryMethod.Pickup,
        },
      });

      // List line items
      const listResponse = await sdk.ListIntakeFormSubmissionLineItems({
        submissionId,
      });

      expect(listResponse.listIntakeFormSubmissionLineItems).toBeDefined();
      expect(listResponse.listIntakeFormSubmissionLineItems).toHaveLength(2);
      expect(
        listResponse.listIntakeFormSubmissionLineItems[0].description,
      ).toBe('Line item 1');
      expect(
        listResponse.listIntakeFormSubmissionLineItems[1].description,
      ).toBe('Line item 2');
    });

    it('should update a line item', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create form, submission, and line item
      const formResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      const submissionResponse = await sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId,
          name: 'Test User',
          email: 'test@example.com',
        },
      });

      const submissionId =
        submissionResponse.createIntakeFormSubmission?.id || '';

      // Create a line item separately
      const lineItemResponse = await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Original description',
          quantity: 1,
          durationInDays: 10,
          type: RequestType.Rental,
          pimCategoryId: 'PIM_CAT_ORIG',
          deliveryMethod: DeliveryMethod.Pickup,
        },
      });

      const lineItemId =
        lineItemResponse.createIntakeFormSubmissionLineItem?.id || '';

      // Update the line item
      const updateResponse = await sdk.UpdateIntakeFormSubmissionLineItem({
        id: lineItemId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Updated description',
          quantity: 5,
          durationInDays: 20,
          type: RequestType.Purchase,
          pimCategoryId: 'PIM_CAT_UPDATED',
          deliveryMethod: DeliveryMethod.Delivery,
          deliveryLocation: '456 Updated Ave',
          salesOrderId: 'SO_999',
        },
      });

      expect(updateResponse.updateIntakeFormSubmissionLineItem).toBeDefined();
      expect(updateResponse.updateIntakeFormSubmissionLineItem?.id).toBe(
        lineItemId,
      );
      expect(
        updateResponse.updateIntakeFormSubmissionLineItem?.description,
      ).toBe('Updated description');
      expect(updateResponse.updateIntakeFormSubmissionLineItem?.quantity).toBe(
        5,
      );
      expect(
        updateResponse.updateIntakeFormSubmissionLineItem?.durationInDays,
      ).toBe(20);
      expect(updateResponse.updateIntakeFormSubmissionLineItem?.type).toBe(
        RequestType.Purchase,
      );
      expect(
        updateResponse.updateIntakeFormSubmissionLineItem?.deliveryLocation,
      ).toBe('456 Updated Ave');
      expect(
        updateResponse.updateIntakeFormSubmissionLineItem?.salesOrderId,
      ).toBe('SO_999');
    });

    it('should delete a line item', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create form, submission, and line items
      const formResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      const submissionResponse = await sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId,
          name: 'Test User',
          email: 'test@example.com',
        },
      });

      const submissionId =
        submissionResponse.createIntakeFormSubmission?.id || '';

      // Create line items separately
      const lineItem1 = await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Line item to delete',
          quantity: 1,
          durationInDays: 1,
          type: RequestType.Rental,
          pimCategoryId: 'PIM_CAT_DEL',
          deliveryMethod: DeliveryMethod.Pickup,
        },
      });

      // line item 2 to keep
      await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Line item to keep',
          quantity: 1,
          durationInDays: 1,
          type: RequestType.Rental,
          pimCategoryId: 'PIM_CAT_DEL',
          deliveryMethod: DeliveryMethod.Pickup,
        },
      });

      const lineItemToDeleteId =
        lineItem1.createIntakeFormSubmissionLineItem?.id || '';

      // Delete the first line item
      const deleteResponse = await sdk.DeleteIntakeFormSubmissionLineItem({
        id: lineItemToDeleteId,
      });

      expect(deleteResponse.deleteIntakeFormSubmissionLineItem).toBe(true);

      // Verify the line item is deleted (soft delete, so it won't appear in list)
      const listResponse = await sdk.ListIntakeFormSubmissionLineItems({
        submissionId,
      });

      expect(listResponse.listIntakeFormSubmissionLineItems).toHaveLength(1);
      expect(
        listResponse.listIntakeFormSubmissionLineItems[0].description,
      ).toBe('Line item to keep');
    });

    it('should throw error when getting non-existent line item', async () => {
      const { sdk } = await createClient();

      await expect(
        sdk.GetIntakeFormSubmissionLineItem({
          id: 'IN_FRM_LI_NONEXISTENT',
        }),
      ).rejects.toThrow();
    });

    it('should throw error when updating non-existent line item', async () => {
      const { sdk } = await createClient();

      await expect(
        sdk.UpdateIntakeFormSubmissionLineItem({
          id: 'IN_FRM_LI_NONEXISTENT',
          input: {
            startDate: new Date().toISOString(),
            description: 'Test',
            quantity: 1,
            durationInDays: 1,
            type: RequestType.Rental,
            pimCategoryId: 'PIM_CAT_TEST',
            deliveryMethod: DeliveryMethod.Pickup,
          },
        }),
      ).rejects.toThrow();
    });

    it('should throw error when deleting non-existent line item', async () => {
      const { sdk } = await createClient();

      await expect(
        sdk.DeleteIntakeFormSubmissionLineItem({
          id: 'IN_FRM_LI_NONEXISTENT',
        }),
      ).rejects.toThrow();
    });
  });

  describe('IntakeFormSubmission Status Management', () => {
    it('should create a submission in DRAFT status', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create form
      const formResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      // Create submission
      const submissionResponse = await sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId,
          name: 'Test User',
          email: 'test@example.com',
        },
      });

      expect(submissionResponse.createIntakeFormSubmission?.status).toBe(
        'DRAFT',
      );
      expect(
        submissionResponse.createIntakeFormSubmission?.submittedAt,
      ).toBeNull();
    });

    it('should submit an intake form submission', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create form and submission
      const formResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      const submissionResponse = await sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId,
          name: 'Test User',
          email: 'test@example.com',
        },
      });

      const submissionId =
        submissionResponse.createIntakeFormSubmission?.id || '';

      // Submit the form
      const submitResponse = await sdk.SubmitIntakeFormSubmission({
        id: submissionId,
      });

      expect(submitResponse.submitIntakeFormSubmission).toBeDefined();
      expect(submitResponse.submitIntakeFormSubmission?.id).toBe(submissionId);
      expect(submitResponse.submitIntakeFormSubmission?.status).toBe(
        'SUBMITTED',
      );
      expect(
        submitResponse.submitIntakeFormSubmission?.submittedAt,
      ).toBeDefined();
      expect(
        submitResponse.submitIntakeFormSubmission?.submittedAt,
      ).not.toBeNull();
    });

    it('should not allow submitting an already submitted form', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create form and submission
      const formResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      const submissionResponse = await sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId,
          name: 'Test User',
          email: 'test@example.com',
        },
      });

      const submissionId =
        submissionResponse.createIntakeFormSubmission?.id || '';

      // Submit the form once
      await sdk.SubmitIntakeFormSubmission({
        id: submissionId,
      });

      // Try to submit again - should fail
      await expect(
        sdk.SubmitIntakeFormSubmission({
          id: submissionId,
        }),
      ).rejects.toThrow();
    });

    it('should throw error when submitting non-existent submission', async () => {
      const { sdk } = await createClient();

      await expect(
        sdk.SubmitIntakeFormSubmission({
          id: 'IN_FRM_SUB_NONEXISTENT',
        }),
      ).rejects.toThrow();
    });

    it('should submit successfully after updating user info via UpdateIntakeFormSubmission', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create form
      const formResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      // Create submission WITHOUT name and email (simulating a submission created before user info is collected)
      const submissionResponse = await sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId,
        },
      });

      const submissionId =
        submissionResponse.createIntakeFormSubmission?.id || '';

      // Verify the submission was created without name/email
      expect(submissionResponse.createIntakeFormSubmission?.name).toBeNull();
      expect(submissionResponse.createIntakeFormSubmission?.email).toBeNull();

      // Now update the submission with user info via UpdateIntakeFormSubmission
      const testEmail = `${uuidv4()}@example.com`;
      const updateResponse = await sdk.UpdateIntakeFormSubmission({
        id: submissionId,
        input: {
          name: 'Test User',
          email: testEmail,
          phone: '+1234567890',
          companyName: 'Test Company',
        },
      });

      // Verify the update returned the correct values
      expect(updateResponse.updateIntakeFormSubmission?.name).toBe('Test User');
      expect(updateResponse.updateIntakeFormSubmission?.email).toBe(testEmail);
      expect(updateResponse.updateIntakeFormSubmission?.phone).toBe(
        '+1234567890',
      );
      expect(updateResponse.updateIntakeFormSubmission?.companyName).toBe(
        'Test Company',
      );

      // Now submit the form - this should succeed because name and email are now set
      const submitResponse = await sdk.SubmitIntakeFormSubmission({
        id: submissionId,
      });

      expect(submitResponse.submitIntakeFormSubmission).toBeDefined();
      expect(submitResponse.submitIntakeFormSubmission?.id).toBe(submissionId);
      expect(submitResponse.submitIntakeFormSubmission?.status).toBe(
        'SUBMITTED',
      );
      expect(submitResponse.submitIntakeFormSubmission?.name).toBe('Test User');
      expect(submitResponse.submitIntakeFormSubmission?.email).toBe(testEmail);
    });
  });

  describe('GetIntakeFormSubmissionById Query', () => {
    it('should get an intake form submission by ID', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create form
      const formResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      // Create submission
      const submissionResponse = await sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId,
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890',
          companyName: 'Test Company',
          purchaseOrderNumber: 'PO-123',
        },
      });

      const submissionId =
        submissionResponse.createIntakeFormSubmission?.id || '';

      // Add a line item
      await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Test line item',
          quantity: 2,
          durationInDays: 5,
          type: RequestType.Rental,
          pimCategoryId: 'PIM_CAT_TEST',
          deliveryMethod: DeliveryMethod.Delivery,
        },
      });

      // Get the submission by ID
      const getResponse = await sdk.GetIntakeFormSubmissionById({
        id: submissionId,
      });

      expect(getResponse.getIntakeFormSubmissionById).toBeDefined();
      expect(getResponse.getIntakeFormSubmissionById?.id).toBe(submissionId);
      expect(getResponse.getIntakeFormSubmissionById?.formId).toBe(formId);
      expect(getResponse.getIntakeFormSubmissionById?.workspaceId).toBe(
        workspaceId,
      );
      expect(getResponse.getIntakeFormSubmissionById?.name).toBe('Test User');
      expect(getResponse.getIntakeFormSubmissionById?.email).toBe(
        'test@example.com',
      );
      expect(getResponse.getIntakeFormSubmissionById?.phone).toBe(
        '+1234567890',
      );
      expect(getResponse.getIntakeFormSubmissionById?.companyName).toBe(
        'Test Company',
      );
      expect(getResponse.getIntakeFormSubmissionById?.purchaseOrderNumber).toBe(
        'PO-123',
      );
      expect(getResponse.getIntakeFormSubmissionById?.status).toBe('DRAFT');
      expect(getResponse.getIntakeFormSubmissionById?.submittedAt).toBeNull();
      expect(getResponse.getIntakeFormSubmissionById?.lineItems).toHaveLength(
        1,
      );
      expect(
        getResponse.getIntakeFormSubmissionById?.lineItems?.[0].description,
      ).toBe('Test line item');
    });

    it('should get a submitted intake form submission', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create form and submission
      const formResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      const submissionResponse = await sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId,
          name: 'Test User',
          email: 'test@example.com',
        },
      });

      const submissionId =
        submissionResponse.createIntakeFormSubmission?.id || '';

      // Submit the form
      await sdk.SubmitIntakeFormSubmission({
        id: submissionId,
      });

      // Get the submission by ID
      const getResponse = await sdk.GetIntakeFormSubmissionById({
        id: submissionId,
      });

      expect(getResponse.getIntakeFormSubmissionById).toBeDefined();
      expect(getResponse.getIntakeFormSubmissionById?.id).toBe(submissionId);
      expect(getResponse.getIntakeFormSubmissionById?.status).toBe('SUBMITTED');
      expect(
        getResponse.getIntakeFormSubmissionById?.submittedAt,
      ).toBeDefined();
      expect(
        getResponse.getIntakeFormSubmissionById?.submittedAt,
      ).not.toBeNull();
    });

    it('should throw error when getting non-existent submission', async () => {
      const { sdk } = await createClient();

      await expect(
        sdk.GetIntakeFormSubmissionById({
          id: 'IN_FRM_SUB_NONEXISTENT',
        }),
      ).rejects.toThrow();
    });

    it('should include line items when getting submission by ID', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create form and submission
      const formResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      const submissionResponse = await sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId,
          name: 'Test User',
          email: 'test@example.com',
        },
      });

      const submissionId =
        submissionResponse.createIntakeFormSubmission?.id || '';

      // Add multiple line items
      await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Line item 1',
          quantity: 1,
          durationInDays: 3,
          type: RequestType.Rental,
          pimCategoryId: 'PIM_CAT_1',
          deliveryMethod: DeliveryMethod.Delivery,
        },
      });

      await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Line item 2',
          quantity: 2,
          durationInDays: 5,
          type: RequestType.Purchase,
          pimCategoryId: 'PIM_CAT_2',
          deliveryMethod: DeliveryMethod.Pickup,
        },
      });

      // Get the submission by ID
      const getResponse = await sdk.GetIntakeFormSubmissionById({
        id: submissionId,
      });

      expect(getResponse.getIntakeFormSubmissionById).toBeDefined();
      expect(getResponse.getIntakeFormSubmissionById?.lineItems).toHaveLength(
        2,
      );
      expect(
        getResponse.getIntakeFormSubmissionById?.lineItems?.[0].description,
      ).toBe('Line item 1');
      expect(
        getResponse.getIntakeFormSubmissionById?.lineItems?.[1].description,
      ).toBe('Line item 2');
      expect(
        getResponse.getIntakeFormSubmissionById?.lineItems?.[0].quantity,
      ).toBe(1);
      expect(
        getResponse.getIntakeFormSubmissionById?.lineItems?.[1].quantity,
      ).toBe(2);
    });
  });

  describe('Submitted Form Restrictions', () => {
    it('should not allow adding line items to a submitted form', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create form and submission
      const formResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      const submissionResponse = await sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId,
          name: 'Test User',
          email: 'test@example.com',
        },
      });

      const submissionId =
        submissionResponse.createIntakeFormSubmission?.id || '';

      // Submit the form
      await sdk.SubmitIntakeFormSubmission({
        id: submissionId,
      });

      // Try to add a line item to the submitted form - should fail
      await expect(
        sdk.CreateIntakeFormSubmissionLineItem({
          submissionId,
          input: {
            startDate: new Date().toISOString(),
            description: 'New line item',
            quantity: 1,
            durationInDays: 1,
            type: RequestType.Rental,
            pimCategoryId: 'PIM_CAT_NEW',
            deliveryMethod: DeliveryMethod.Pickup,
          },
        }),
      ).rejects.toThrow(
        'Cannot add line items to a submitted intake form submission',
      );
    });

    it('should not allow updating line items on a submitted form', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create form and submission
      const formResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      const submissionResponse = await sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId,
          name: 'Test User',
          email: 'test@example.com',
        },
      });

      const submissionId =
        submissionResponse.createIntakeFormSubmission?.id || '';

      // Add a line item before submitting
      const lineItemResponse = await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Original description',
          quantity: 1,
          durationInDays: 1,
          type: RequestType.Rental,
          pimCategoryId: 'PIM_CAT_ORIG',
          deliveryMethod: DeliveryMethod.Pickup,
        },
      });

      const lineItemId =
        lineItemResponse.createIntakeFormSubmissionLineItem?.id || '';

      // Submit the form
      await sdk.SubmitIntakeFormSubmission({
        id: submissionId,
      });

      // Try to update the line item on the submitted form - should fail
      await expect(
        sdk.UpdateIntakeFormSubmissionLineItem({
          id: lineItemId,
          input: {
            startDate: new Date().toISOString(),
            description: 'Updated description',
            quantity: 2,
            durationInDays: 2,
            type: RequestType.Purchase,
            pimCategoryId: 'PIM_CAT_UPDATED',
            deliveryMethod: DeliveryMethod.Delivery,
          },
        }),
      ).rejects.toThrow(
        'Cannot update line items on a submitted intake form submission',
      );
    });

    it('should not allow deleting line items from a submitted form', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create form and submission
      const formResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      const submissionResponse = await sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId,
          name: 'Test User',
          email: 'test@example.com',
        },
      });

      const submissionId =
        submissionResponse.createIntakeFormSubmission?.id || '';

      // Add a line item before submitting
      const lineItemResponse = await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Line item to delete',
          quantity: 1,
          durationInDays: 1,
          type: RequestType.Rental,
          pimCategoryId: 'PIM_CAT_DEL',
          deliveryMethod: DeliveryMethod.Pickup,
        },
      });

      const lineItemId =
        lineItemResponse.createIntakeFormSubmissionLineItem?.id || '';

      // Submit the form
      await sdk.SubmitIntakeFormSubmission({
        id: submissionId,
      });

      // Try to delete the line item from the submitted form - should fail
      await expect(
        sdk.DeleteIntakeFormSubmissionLineItem({
          id: lineItemId,
        }),
      ).rejects.toThrow(
        'Cannot delete line items from a submitted intake form submission',
      );
    });

    it('should allow reading submitted forms and their line items', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create form and submission with line items
      const formResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      const submissionResponse = await sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId,
          name: 'Test User',
          email: 'test@example.com',
        },
      });

      const submissionId =
        submissionResponse.createIntakeFormSubmission?.id || '';

      // Add line items
      await sdk.CreateIntakeFormSubmissionLineItem({
        submissionId,
        input: {
          startDate: new Date().toISOString(),
          description: 'Line item 1',
          quantity: 1,
          durationInDays: 1,
          type: RequestType.Rental,
          pimCategoryId: 'PIM_CAT_1',
          deliveryMethod: DeliveryMethod.Pickup,
        },
      });

      // Submit the form
      await sdk.SubmitIntakeFormSubmission({
        id: submissionId,
      });

      // Should still be able to read the submitted form
      const getResponse = await sdk.GetIntakeFormSubmissionById({
        id: submissionId,
      });

      expect(getResponse.getIntakeFormSubmissionById).toBeDefined();
      expect(getResponse.getIntakeFormSubmissionById?.status).toBe('SUBMITTED');
      expect(getResponse.getIntakeFormSubmissionById?.lineItems).toHaveLength(
        1,
      );

      // Should still be able to list line items
      const listResponse = await sdk.ListIntakeFormSubmissionLineItems({
        submissionId,
      });

      expect(listResponse.listIntakeFormSubmissionLineItems).toHaveLength(1);
    });
  });

  describe('UpdateIntakeForm Mutation', () => {
    it('should update intake form from public to private', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create a public form
      const createResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
          isPublic: true,
        },
      });

      const formId = createResponse.createIntakeForm?.id || '';
      expect(createResponse.createIntakeForm?.isPublic).toBe(true);

      // Update to private
      const updateResponse = await sdk.UpdateIntakeForm({
        id: formId,
        input: {
          isPublic: false,
        },
      });

      expect(updateResponse.updateIntakeForm).toBeDefined();
      expect(updateResponse.updateIntakeForm?.id).toBe(formId);
      expect(updateResponse.updateIntakeForm?.isPublic).toBe(false);
    });

    it('should update intake form from private to public', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create a private form
      const createResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
          isPublic: false,
        },
      });

      const formId = createResponse.createIntakeForm?.id || '';
      expect(createResponse.createIntakeForm?.isPublic).toBe(false);

      // Update to public
      const updateResponse = await sdk.UpdateIntakeForm({
        id: formId,
        input: {
          isPublic: true,
        },
      });

      expect(updateResponse.updateIntakeForm).toBeDefined();
      expect(updateResponse.updateIntakeForm?.id).toBe(formId);
      expect(updateResponse.updateIntakeForm?.isPublic).toBe(true);
    });

    it('should update shared users list', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create a form with initial shared users
      const createResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
          isPublic: false,
          sharedWithEmails: ['user1@example.com', 'user2@example.com'],
        },
      });

      const formId = createResponse.createIntakeForm?.id || '';
      expect(createResponse.createIntakeForm?.sharedWithUserIds).toHaveLength(
        2,
      );

      // Update shared users - remove user1, keep user2, add user3
      const updateResponse = await sdk.UpdateIntakeForm({
        id: formId,
        input: {
          sharedWithEmails: ['user2@example.com', 'user3@example.com'],
        },
      });

      expect(updateResponse.updateIntakeForm).toBeDefined();
      expect(updateResponse.updateIntakeForm?.sharedWithUserIds).toHaveLength(
        2,
      );
      expect(updateResponse.updateIntakeForm?.sharedWithUsers).toHaveLength(2);

      const emails =
        updateResponse.updateIntakeForm?.sharedWithUsers
          ?.map((u) => u?.email)
          .filter(Boolean) || [];
      expect(emails).toContain('user2@example.com');
      expect(emails).toContain('user3@example.com');
      expect(emails).not.toContain('user1@example.com');
    });

    it('should clear all shared users', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create a form with shared users
      const createResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
          isPublic: false,
          sharedWithEmails: ['user1@example.com', 'user2@example.com'],
        },
      });

      const formId = createResponse.createIntakeForm?.id || '';
      expect(createResponse.createIntakeForm?.sharedWithUserIds).toHaveLength(
        2,
      );

      // Clear all shared users
      const updateResponse = await sdk.UpdateIntakeForm({
        id: formId,
        input: {
          sharedWithEmails: [],
        },
      });

      expect(updateResponse.updateIntakeForm).toBeDefined();
      expect(updateResponse.updateIntakeForm?.sharedWithUserIds).toHaveLength(
        0,
      );
      expect(updateResponse.updateIntakeForm?.sharedWithUsers).toHaveLength(0);
    });

    it('should update pricebook', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create two pricebooks
      const { priceBook: priceBook1 } =
        await utils.createPriceBookAndPrices(workspaceId);
      const { priceBook: priceBook2 } =
        await utils.createPriceBookAndPrices(workspaceId);

      // Create a form with first pricebook
      const createResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
          pricebookId: priceBook1.id,
        },
      });

      const formId = createResponse.createIntakeForm?.id || '';
      expect(createResponse.createIntakeForm?.pricebookId).toBe(priceBook1.id);

      // Update to second pricebook
      const updateResponse = await sdk.UpdateIntakeForm({
        id: formId,
        input: {
          pricebookId: priceBook2.id,
        },
      });

      expect(updateResponse.updateIntakeForm).toBeDefined();
      expect(updateResponse.updateIntakeForm?.pricebookId).toBe(priceBook2.id);
    });

    it('should remove pricebook', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const { priceBook } = await utils.createPriceBookAndPrices(workspaceId);

      // Create a form with pricebook
      const createResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
          pricebookId: priceBook.id,
        },
      });

      const formId = createResponse.createIntakeForm?.id || '';
      expect(createResponse.createIntakeForm?.pricebookId).toBe(priceBook.id);

      // Remove pricebook
      const updateResponse = await sdk.UpdateIntakeForm({
        id: formId,
        input: {
          pricebookId: null,
        },
      });

      expect(updateResponse.updateIntakeForm).toBeDefined();
      expect(updateResponse.updateIntakeForm?.pricebookId).toBeNull();
    });

    it('should throw error when updating with pricebook user cannot read', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create a form
      const createResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
        },
      });

      const formId = createResponse.createIntakeForm?.id || '';

      // Create a different user and workspace to ensure no permission
      const { utils: otherUserUtils } = await createClient();
      const differentWorkspace = await otherUserUtils.createWorkspace();
      const { priceBook: inaccessiblePriceBook } =
        await otherUserUtils.createPriceBookAndPrices(differentWorkspace.id);

      // Try to update with a pricebook from a different workspace (no permission)
      await expect(
        sdk.UpdateIntakeForm({
          id: formId,
          input: {
            pricebookId: inaccessiblePriceBook.id,
          },
        }),
      ).rejects.toThrow('permission');
    });

    it('should update project ID', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const projectId1 = `PROJ_${uuidv4()}`;
      const projectId2 = `PROJ_${uuidv4()}`;

      // Create a form with first project
      const createResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
          projectId: projectId1,
        },
      });

      const formId = createResponse.createIntakeForm?.id || '';
      expect(createResponse.createIntakeForm?.projectId).toBe(projectId1);

      // Update to second project
      const updateResponse = await sdk.UpdateIntakeForm({
        id: formId,
        input: {
          projectId: projectId2,
        },
      });

      expect(updateResponse.updateIntakeForm).toBeDefined();
      expect(updateResponse.updateIntakeForm?.projectId).toBe(projectId2);
    });

    it('should update isActive status', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      // Create an active form
      const createResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
        },
      });

      const formId = createResponse.createIntakeForm?.id || '';
      expect(createResponse.createIntakeForm?.isActive).toBe(true);

      // Update to inactive
      const updateResponse = await sdk.UpdateIntakeForm({
        id: formId,
        input: {
          isActive: false,
        },
      });

      expect(updateResponse.updateIntakeForm).toBeDefined();
      expect(updateResponse.updateIntakeForm?.isActive).toBe(false);
    });

    it('should update multiple fields at once', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();
      const workspaceId = workspace.id;

      const { priceBook } = await utils.createPriceBookAndPrices(workspaceId);
      const projectId = `PROJ_${uuidv4()}`;

      // Create a form
      const createResponse = await sdk.CreateIntakeForm({
        input: {
          workspaceId,
          isActive: true,
          isPublic: false,
        },
      });

      const formId = createResponse.createIntakeForm?.id || '';

      // Update multiple fields
      const updateResponse = await sdk.UpdateIntakeForm({
        id: formId,
        input: {
          projectId,
          pricebookId: priceBook.id,
          isPublic: true,
          sharedWithEmails: ['user@example.com'],
          isActive: false,
        },
      });

      expect(updateResponse.updateIntakeForm).toBeDefined();
      expect(updateResponse.updateIntakeForm?.projectId).toBe(projectId);
      expect(updateResponse.updateIntakeForm?.pricebookId).toBe(priceBook.id);
      expect(updateResponse.updateIntakeForm?.isPublic).toBe(true);
      expect(updateResponse.updateIntakeForm?.sharedWithUserIds).toHaveLength(
        1,
      );
      expect(updateResponse.updateIntakeForm?.isActive).toBe(false);
    });

    it('should throw error when updating non-existent form', async () => {
      const { sdk } = await createClient();

      await expect(
        sdk.UpdateIntakeForm({
          id: 'IN_FRM_NONEXISTENT',
          input: {
            isActive: false,
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('listIntakeFormsForUser Query', () => {
    it('should NOT return private forms for anonymous users', async () => {
      const { sdk, utils } = await createClient();
      const { sdk: anonSdk } = createAnonTestClient();
      const workspace = await utils.createWorkspace();

      // Create a private form
      const privateForm = await sdk.CreateIntakeForm({
        input: {
          workspaceId: workspace.id,
          isActive: true,
          isPublic: false,
        },
      });

      invariant(privateForm.createIntakeForm?.id);

      // Anonymous user should NOT see private forms
      const { listIntakeFormsForUser } = await anonSdk.ListIntakeFormsForUser(
        {},
      );

      // Check that the private form is not in the list
      const formIds = listIntakeFormsForUser?.items.map((f) => f.id) || [];
      expect(formIds).not.toContain(privateForm.createIntakeForm.id);

      // All forms returned should be public
      listIntakeFormsForUser?.items.forEach((form) => {
        expect(form.isPublic).toBe(true);
      });
    });

    it('should show and hide private forms based on user access', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();

      // Create a private form with a specific user
      const testUserEmail = 'testuser@example.com';
      const { createIntakeForm } = await sdk.CreateIntakeForm({
        input: {
          workspaceId: workspace.id,
          isActive: true,
          isPublic: false,
          sharedWithEmails: [testUserEmail],
        },
      });

      invariant(createIntakeForm?.id);
      const formId = createIntakeForm.id;
      const testUserId = createIntakeForm?.sharedWithUserIds?.[0];

      // Create SDK for the test user
      const { sdk: testUserSdk } = await createClient({
        userEmail: testUserEmail,
        userId: testUserId,
      });

      // Test user should see the form in their list
      const { listIntakeFormsForUser } =
        await testUserSdk.ListIntakeFormsForUser({});

      expect(listIntakeFormsForUser?.items).toBeDefined();
      const foundForm = listIntakeFormsForUser?.items.find(
        (f) => f.id === formId,
      );
      expect(foundForm).toBeDefined();
      expect(foundForm?.id).toBe(formId);

      // Remove the user from the form
      await sdk.UpdateIntakeForm({
        id: formId,
        input: {
          sharedWithEmails: [],
        },
      });

      // Test user should no longer see the form
      const { listIntakeFormsForUser: afterRemoval } =
        await testUserSdk.ListIntakeFormsForUser({});

      const foundFormAfterRemoval = afterRemoval?.items.find(
        (f) => f.id === formId,
      );
      expect(foundFormAfterRemoval).toBeUndefined();
    });

    it('should handle pagination correctly', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();

      // Create multiple forms that only this user can see (private forms with specific user access)
      const testUserEmail = `pagination-test-${uuidv4()}@example.com`;
      const uniquePrefix = `PROJ_PAG_${uuidv4()}`;
      const formPromises = Array.from({ length: 5 }, (_, i) =>
        sdk.CreateIntakeForm({
          input: {
            workspaceId: workspace.id,
            isActive: true,
            isPublic: false,
            sharedWithEmails: [testUserEmail],
            projectId: `${uniquePrefix}_${i}`,
          },
        }),
      );

      const forms = await Promise.all(formPromises);
      const testUserId = forms[0].createIntakeForm?.sharedWithUserIds?.[0];
      const createdFormIds = forms
        .map((f) => f.createIntakeForm?.id)
        .filter(Boolean) as string[];

      // Create SDK for test user
      const { sdk: testUserSdk } = await createClient({
        userEmail: testUserEmail,
        userId: testUserId,
      });

      // Get all forms for this user to check total count
      const allForms = await testUserSdk.ListIntakeFormsForUser({});

      // Filter to just our test forms
      const ourForms =
        allForms.listIntakeFormsForUser?.items.filter((f) =>
          f.projectId?.startsWith(uniquePrefix),
        ) || [];

      expect(ourForms).toHaveLength(5);

      // Test pagination - page 1 with limit 2
      const page1 = await testUserSdk.ListIntakeFormsForUser({
        page: 1,
        limit: 2,
      });

      expect(page1.listIntakeFormsForUser?.items).toHaveLength(2);
      expect(page1.listIntakeFormsForUser?.page.number).toBe(1);
      expect(page1.listIntakeFormsForUser?.page.size).toBe(2);
      // Total items might include forms from other tests
      expect(
        page1.listIntakeFormsForUser?.page.totalItems,
      ).toBeGreaterThanOrEqual(5);

      // Test pagination - page 2 with limit 2
      const page2 = await testUserSdk.ListIntakeFormsForUser({
        page: 2,
        limit: 2,
      });

      expect(page2.listIntakeFormsForUser?.items).toHaveLength(2);
      expect(page2.listIntakeFormsForUser?.page.number).toBe(2);

      // Ensure different items on different pages
      const page1Ids =
        page1.listIntakeFormsForUser?.items.map((f) => f.id) || [];
      const page2Ids =
        page2.listIntakeFormsForUser?.items.map((f) => f.id) || [];

      page1Ids.forEach((id) => {
        expect(page2Ids).not.toContain(id);
      });

      // Verify our created forms appear somewhere in the paginated results
      const allPagedIds = [...page1Ids, ...page2Ids];
      const foundOurForms = createdFormIds.filter((id) =>
        allPagedIds.includes(id),
      );
      expect(foundOurForms.length).toBeGreaterThan(0);
    });

    it('should exclude deleted forms from the list', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();

      // Create private forms with specific user access to avoid interference
      const testUserEmail = `delete-test-${uuidv4()}@example.com`;

      const activeForm = await sdk.CreateIntakeForm({
        input: {
          workspaceId: workspace.id,
          isActive: true,
          isPublic: false,
          sharedWithEmails: [testUserEmail],
        },
      });

      const toDeleteForm = await sdk.CreateIntakeForm({
        input: {
          workspaceId: workspace.id,
          isActive: true,
          isPublic: false,
          sharedWithEmails: [testUserEmail],
        },
      });

      invariant(activeForm.createIntakeForm?.id);
      invariant(toDeleteForm.createIntakeForm?.id);

      const testUserId = activeForm.createIntakeForm?.sharedWithUserIds?.[0];

      // Create SDK for test user
      const { sdk: testUserSdk } = await createClient({
        userEmail: testUserEmail,
        userId: testUserId,
      });

      // List should include both forms initially
      const beforeDelete = await testUserSdk.ListIntakeFormsForUser({});
      const beforeDeleteIds =
        beforeDelete.listIntakeFormsForUser?.items.map((f) => f.id) || [];
      expect(beforeDeleteIds).toContain(activeForm.createIntakeForm.id);
      expect(beforeDeleteIds).toContain(toDeleteForm.createIntakeForm.id);

      // Delete one form
      await sdk.DeleteIntakeForm({
        id: toDeleteForm.createIntakeForm.id,
      });

      // List should only include the active form
      const afterDelete = await testUserSdk.ListIntakeFormsForUser({});
      const afterDeleteIds =
        afterDelete.listIntakeFormsForUser?.items.map((f) => f.id) || [];
      expect(afterDeleteIds).toContain(activeForm.createIntakeForm.id);
      expect(afterDeleteIds).not.toContain(toDeleteForm.createIntakeForm.id);

      // All returned forms should have isDeleted: false
      afterDelete.listIntakeFormsForUser?.items.forEach((form) => {
        expect(form.isDeleted).toBe(false);
      });
    });

    it('should return empty list for user with no access', async () => {
      // Create a unique user that has never been used before
      const uniqueUserId = `USER_${uuidv4()}`;
      const uniqueEmail = `noaccess-${uuidv4()}@example.com`;

      const { sdk: userSdk } = await createClient({
        userEmail: uniqueEmail,
        userId: uniqueUserId,
      });

      // User with no forms should get empty list (only sees public forms if any exist)
      const { listIntakeFormsForUser } = await userSdk.ListIntakeFormsForUser(
        {},
      );

      // Filter out any public forms that might exist from other tests
      const privateFormsForThisUser =
        listIntakeFormsForUser?.items.filter((form) => !form.isPublic) || [];

      expect(privateFormsForThisUser).toEqual([]);
    });

    it('should NOT show public forms to users who have not submitted to them', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();

      // Create a public form
      const publicForm = await sdk.CreateIntakeForm({
        input: {
          workspaceId: workspace.id,
          isActive: true,
          isPublic: true,
        },
      });

      invariant(publicForm.createIntakeForm?.id);
      const publicFormId = publicForm.createIntakeForm.id;

      // Create a unique user who has NOT submitted to the form
      const testUserId = `USER_${uuidv4()}`;
      const testUserEmail = `no-submission-${uuidv4()}@example.com`;

      const { sdk: userSdk } = await createClient({
        userEmail: testUserEmail,
        userId: testUserId,
      });

      // User should NOT see the public form (they haven't submitted to it)
      const userForms = await userSdk.ListIntakeFormsForUser({});
      const userFormIds =
        userForms.listIntakeFormsForUser?.items.map((f) => f.id) || [];
      expect(userFormIds).not.toContain(publicFormId);
    });

    it('should include forms where user has created submissions, even after made private', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();

      // Create a public form
      const publicForm = await sdk.CreateIntakeForm({
        input: {
          workspaceId: workspace.id,
          isActive: true,
          isPublic: true,
        },
      });

      invariant(publicForm.createIntakeForm?.id);
      const publicFormId = publicForm.createIntakeForm.id;

      // Create a unique user
      const testUserId = `USER_${uuidv4()}`;
      const testUserEmail = `submission-test-${uuidv4()}@example.com`;

      const { sdk: userSdk } = await createClient({
        userEmail: testUserEmail,
        userId: testUserId,
      });

      // Initially, user should NOT see the public form (no submission yet)
      const beforeSubmission = await userSdk.ListIntakeFormsForUser({});
      const beforeFormIds =
        beforeSubmission.listIntakeFormsForUser?.items.map((f) => f.id) || [];
      expect(beforeFormIds).not.toContain(publicFormId);

      // Create a submission on the public form as the user
      const submissionResponse = await userSdk.CreateIntakeFormSubmission({
        input: {
          formId: publicFormId,
          workspaceId: workspace.id,
          name: 'Test User',
          email: testUserEmail,
        },
      });

      invariant(submissionResponse.createIntakeFormSubmission?.id);

      // Now user should see the form because they have a submission
      const afterSubmission = await userSdk.ListIntakeFormsForUser({});
      const afterFormIds =
        afterSubmission.listIntakeFormsForUser?.items.map((f) => f.id) || [];
      expect(afterFormIds).toContain(publicFormId);

      // Now make the form private
      await sdk.UpdateIntakeForm({
        id: publicFormId,
        input: {
          isPublic: false,
        },
      });

      // After making it private, user should STILL see it because they have a submission
      const afterPrivate = await userSdk.ListIntakeFormsForUser({});
      const privateFormIds =
        afterPrivate.listIntakeFormsForUser?.items.map((f) => f.id) || [];
      expect(privateFormIds).toContain(publicFormId);

      // Create another user who hasn't created a submission
      const otherUserId = `USER_${uuidv4()}`;
      const otherUserEmail = `other-${uuidv4()}@example.com`;

      const { sdk: otherUserSdk } = await createClient({
        userEmail: otherUserEmail,
        userId: otherUserId,
      });

      // Other user should NOT see the now-private form
      const otherUserForms = await otherUserSdk.ListIntakeFormsForUser({});
      const otherUserFormIds =
        otherUserForms.listIntakeFormsForUser?.items.map((f) => f.id) || [];
      expect(otherUserFormIds).not.toContain(publicFormId);
    });

    it('should deduplicate forms when user has both direct access and submission on public form', async () => {
      const { sdk, utils } = await createClient();
      const workspace = await utils.createWorkspace();

      const testUserEmail = `dedup-test-${uuidv4()}@example.com`;

      // Create a public form and share it with the user (redundant but possible)
      const form = await sdk.CreateIntakeForm({
        input: {
          workspaceId: workspace.id,
          isActive: true,
          isPublic: true,
          sharedWithEmails: [testUserEmail],
        },
      });

      invariant(form.createIntakeForm?.id);
      const formId = form.createIntakeForm.id;
      const testUserId = form.createIntakeForm?.sharedWithUserIds?.[0];

      const { sdk: userSdk } = await createClient({
        userEmail: testUserEmail,
        userId: testUserId,
      });

      // Create a submission on the same form
      await userSdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId: workspace.id,
          name: 'Test User',
          email: testUserEmail,
        },
      });

      // User should see the form only once (deduplicated)
      const { listIntakeFormsForUser } = await userSdk.ListIntakeFormsForUser(
        {},
      );

      const formOccurrences =
        listIntakeFormsForUser?.items.filter((f) => f.id === formId) || [];
      expect(formOccurrences).toHaveLength(1);
    });
  });

  describe('Buyer Workspace Submissions', () => {
    it('should create submission with buyerWorkspaceId and list as buyer', async () => {
      const { sdk: sellerSdk, utils: sellerUtils } = await createClient();
      const { sdk: buyerSdk, utils: buyerUtils } = await createClient();

      // Create seller workspace and form
      const sellerWorkspace = await sellerUtils.createWorkspace();
      const formResponse = await sellerSdk.CreateIntakeForm({
        input: {
          workspaceId: sellerWorkspace.id,
          isActive: true,
          isPublic: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      // Create buyer workspace
      const buyerWorkspace = await buyerUtils.createWorkspace();

      // Create submission with buyerWorkspaceId
      const submissionResponse = await buyerSdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId: sellerWorkspace.id,
          buyerWorkspaceId: buyerWorkspace.id,
          name: 'Buyer User',
          email: 'buyer@example.com',
        },
      });

      const submissionId =
        submissionResponse.createIntakeFormSubmission?.id || '';
      expect(submissionId).toBeTruthy();

      // Buyer should be able to list submissions for their workspace
      const buyerListResponse = await buyerSdk.ListIntakeFormSubmissionsAsBuyer(
        {
          buyerWorkspaceId: buyerWorkspace.id,
        },
      );

      expect(
        buyerListResponse.listIntakeFormSubmissionsAsBuyer?.items,
      ).toHaveLength(1);
      expect(
        buyerListResponse.listIntakeFormSubmissionsAsBuyer?.items[0].id,
      ).toBe(submissionId);
      expect(
        buyerListResponse.listIntakeFormSubmissionsAsBuyer?.items[0]
          .buyerWorkspaceId,
      ).toBe(buyerWorkspace.id);

      // Seller should still be able to list submissions for their workspace
      const sellerListResponse = await sellerSdk.ListIntakeFormSubmissions({
        workspaceId: sellerWorkspace.id,
      });

      expect(sellerListResponse.listIntakeFormSubmissions?.items).toHaveLength(
        1,
      );
      expect(sellerListResponse.listIntakeFormSubmissions?.items[0].id).toBe(
        submissionId,
      );
    });

    it('should update submission with buyerWorkspaceId', async () => {
      const { sdk: sellerSdk, utils: sellerUtils } = await createClient();
      const { sdk: buyerSdk, utils: buyerUtils } = await createClient();

      // Create seller workspace and form
      const sellerWorkspace = await sellerUtils.createWorkspace();
      const formResponse = await sellerSdk.CreateIntakeForm({
        input: {
          workspaceId: sellerWorkspace.id,
          isActive: true,
          isPublic: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      // Create buyer workspace
      const buyerWorkspace = await buyerUtils.createWorkspace();

      // Create submission WITHOUT buyerWorkspaceId initially
      const submissionResponse = await buyerSdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId: sellerWorkspace.id,
          name: 'Buyer User',
          email: 'buyer@example.com',
        },
      });

      const submissionId =
        submissionResponse.createIntakeFormSubmission?.id || '';

      // Buyer should NOT see submission in their list yet
      const emptyListResponse = await buyerSdk.ListIntakeFormSubmissionsAsBuyer(
        {
          buyerWorkspaceId: buyerWorkspace.id,
        },
      );
      expect(
        emptyListResponse.listIntakeFormSubmissionsAsBuyer?.items,
      ).toHaveLength(0);

      // Update submission to add buyerWorkspaceId
      await buyerSdk.UpdateIntakeFormSubmission({
        id: submissionId,
        input: {
          buyerWorkspaceId: buyerWorkspace.id,
        },
      });

      // Now buyer should see submission in their list
      const listResponse = await buyerSdk.ListIntakeFormSubmissionsAsBuyer({
        buyerWorkspaceId: buyerWorkspace.id,
      });

      expect(listResponse.listIntakeFormSubmissionsAsBuyer?.items).toHaveLength(
        1,
      );
      expect(listResponse.listIntakeFormSubmissionsAsBuyer?.items[0].id).toBe(
        submissionId,
      );
    });

    it('should clear buyerWorkspaceId when set to null', async () => {
      const { sdk: sellerSdk, utils: sellerUtils } = await createClient();
      const { sdk: buyerSdk, utils: buyerUtils } = await createClient();

      // Create seller workspace and form
      const sellerWorkspace = await sellerUtils.createWorkspace();
      const formResponse = await sellerSdk.CreateIntakeForm({
        input: {
          workspaceId: sellerWorkspace.id,
          isActive: true,
          isPublic: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      // Create buyer workspace
      const buyerWorkspace = await buyerUtils.createWorkspace();

      // Create submission with buyerWorkspaceId
      const submissionResponse = await buyerSdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId: sellerWorkspace.id,
          buyerWorkspaceId: buyerWorkspace.id,
          name: 'Buyer User',
          email: 'buyer@example.com',
        },
      });

      const submissionId =
        submissionResponse.createIntakeFormSubmission?.id || '';

      // Verify buyer can see submission
      const listResponse = await buyerSdk.ListIntakeFormSubmissionsAsBuyer({
        buyerWorkspaceId: buyerWorkspace.id,
      });
      expect(listResponse.listIntakeFormSubmissionsAsBuyer?.items).toHaveLength(
        1,
      );

      // Clear buyerWorkspaceId
      await buyerSdk.UpdateIntakeFormSubmission({
        id: submissionId,
        input: {
          buyerWorkspaceId: null,
        },
      });

      // Buyer should no longer see submission in their list
      const emptyListResponse = await buyerSdk.ListIntakeFormSubmissionsAsBuyer(
        {
          buyerWorkspaceId: buyerWorkspace.id,
        },
      );
      expect(
        emptyListResponse.listIntakeFormSubmissionsAsBuyer?.items,
      ).toHaveLength(0);
    });

    it('should not allow listing submissions for workspace user does not have access to', async () => {
      const { utils: user1Utils } = await createClient();
      const { sdk: user2Sdk } = await createClient();

      // Create workspace owned by user1
      const workspace = await user1Utils.createWorkspace();

      // User2 should not be able to list submissions for user1's workspace
      await expect(
        user2Sdk.ListIntakeFormSubmissionsAsBuyer({
          buyerWorkspaceId: workspace.id,
        }),
      ).rejects.toThrow();
    });

    it('should adopt orphaned submissions when calling adoptOrphanedSubmissions', async () => {
      const { sdk: sellerSdk, utils: sellerUtils } = await createClient();
      const {
        sdk: buyerSdk,
        utils: buyerUtils,
        user: buyerUser,
      } = await createClient();

      // Create seller workspace and form
      const sellerWorkspace = await sellerUtils.createWorkspace();
      const formResponse = await sellerSdk.CreateIntakeForm({
        input: {
          workspaceId: sellerWorkspace.id,
          isActive: true,
          isPublic: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      // Create submissions WITHOUT buyerWorkspaceId (orphaned submissions)
      // userId is set so adoptOrphanedSubmissions can find them
      const submission1Response = await buyerSdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId: sellerWorkspace.id,
          userId: buyerUser.id,
          name: 'Buyer User',
          email: 'buyer@example.com',
        },
      });
      const submission1Id =
        submission1Response.createIntakeFormSubmission?.id || '';

      const submission2Response = await buyerSdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId: sellerWorkspace.id,
          userId: buyerUser.id,
          name: 'Buyer User',
          email: 'buyer@example.com',
        },
      });
      const submission2Id =
        submission2Response.createIntakeFormSubmission?.id || '';

      // Create buyer workspace AFTER submissions
      const buyerWorkspace = await buyerUtils.createWorkspace();

      // Verify buyer cannot see submissions yet
      const emptyListResponse = await buyerSdk.ListIntakeFormSubmissionsAsBuyer(
        {
          buyerWorkspaceId: buyerWorkspace.id,
        },
      );
      expect(
        emptyListResponse.listIntakeFormSubmissionsAsBuyer?.items,
      ).toHaveLength(0);

      // Adopt orphaned submissions
      const adoptResponse = await buyerSdk.AdoptOrphanedSubmissions({
        workspaceId: buyerWorkspace.id,
      });

      // Verify response
      expect(adoptResponse.adoptOrphanedSubmissions?.adoptedCount).toBe(2);
      expect(
        adoptResponse.adoptOrphanedSubmissions?.adoptedSubmissionIds,
      ).toHaveLength(2);
      expect(
        adoptResponse.adoptOrphanedSubmissions?.adoptedSubmissionIds,
      ).toContain(submission1Id);
      expect(
        adoptResponse.adoptOrphanedSubmissions?.adoptedSubmissionIds,
      ).toContain(submission2Id);
      expect(
        adoptResponse.adoptOrphanedSubmissions?.adoptedSubmissions,
      ).toHaveLength(2);
      expect(
        adoptResponse.adoptOrphanedSubmissions?.adoptedSubmissions?.every(
          (s) => s.buyerWorkspaceId === buyerWorkspace.id,
        ),
      ).toBe(true);

      // Buyer should now see submissions in their list
      const listResponse = await buyerSdk.ListIntakeFormSubmissionsAsBuyer({
        buyerWorkspaceId: buyerWorkspace.id,
      });
      expect(listResponse.listIntakeFormSubmissionsAsBuyer?.items).toHaveLength(
        2,
      );
    });

    it('should be idempotent - calling adoptOrphanedSubmissions twice returns 0 on second call', async () => {
      const { sdk: sellerSdk, utils: sellerUtils } = await createClient();
      const {
        sdk: buyerSdk,
        utils: buyerUtils,
        user: buyerUser,
      } = await createClient();

      // Create seller workspace and form
      const sellerWorkspace = await sellerUtils.createWorkspace();
      const formResponse = await sellerSdk.CreateIntakeForm({
        input: {
          workspaceId: sellerWorkspace.id,
          isActive: true,
          isPublic: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      // Create orphaned submission with userId
      await buyerSdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId: sellerWorkspace.id,
          userId: buyerUser.id,
          name: 'Buyer User',
          email: 'buyer@example.com',
        },
      });

      // Create buyer workspace
      const buyerWorkspace = await buyerUtils.createWorkspace();

      // First call should adopt the submission
      const firstAdoptResponse = await buyerSdk.AdoptOrphanedSubmissions({
        workspaceId: buyerWorkspace.id,
      });
      expect(firstAdoptResponse.adoptOrphanedSubmissions?.adoptedCount).toBe(1);

      // Second call should return 0 (idempotent)
      const secondAdoptResponse = await buyerSdk.AdoptOrphanedSubmissions({
        workspaceId: buyerWorkspace.id,
      });
      expect(secondAdoptResponse.adoptOrphanedSubmissions?.adoptedCount).toBe(
        0,
      );
      expect(
        secondAdoptResponse.adoptOrphanedSubmissions?.adoptedSubmissionIds,
      ).toHaveLength(0);
    });

    it('should not adopt submissions from other users', async () => {
      const { sdk: sellerSdk, utils: sellerUtils } = await createClient();
      const {
        sdk: buyer1Sdk,
        utils: buyer1Utils,
        user: buyer1User,
      } = await createClient();
      const {
        sdk: buyer2Sdk,
        utils: buyer2Utils,
        user: buyer2User,
      } = await createClient();

      // Create seller workspace and form
      const sellerWorkspace = await sellerUtils.createWorkspace();
      const formResponse = await sellerSdk.CreateIntakeForm({
        input: {
          workspaceId: sellerWorkspace.id,
          isActive: true,
          isPublic: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      // Buyer1 creates an orphaned submission with their userId
      await buyer1Sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId: sellerWorkspace.id,
          userId: buyer1User.id,
          name: 'Buyer 1',
          email: 'buyer1@example.com',
        },
      });

      // Buyer2 creates their own orphaned submission with their userId
      await buyer2Sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId: sellerWorkspace.id,
          userId: buyer2User.id,
          name: 'Buyer 2',
          email: 'buyer2@example.com',
        },
      });

      // Create workspaces for both buyers
      const buyer1Workspace = await buyer1Utils.createWorkspace();
      const buyer2Workspace = await buyer2Utils.createWorkspace();

      // Buyer1 adopts their submissions
      const buyer1AdoptResponse = await buyer1Sdk.AdoptOrphanedSubmissions({
        workspaceId: buyer1Workspace.id,
      });
      expect(buyer1AdoptResponse.adoptOrphanedSubmissions?.adoptedCount).toBe(
        1,
      );

      // Buyer2 adopts their submissions - should only get their own
      const buyer2AdoptResponse = await buyer2Sdk.AdoptOrphanedSubmissions({
        workspaceId: buyer2Workspace.id,
      });
      expect(buyer2AdoptResponse.adoptOrphanedSubmissions?.adoptedCount).toBe(
        1,
      );

      // Verify each buyer only sees their own submission
      const buyer1List = await buyer1Sdk.ListIntakeFormSubmissionsAsBuyer({
        buyerWorkspaceId: buyer1Workspace.id,
      });
      expect(buyer1List.listIntakeFormSubmissionsAsBuyer?.items).toHaveLength(
        1,
      );
      expect(buyer1List.listIntakeFormSubmissionsAsBuyer?.items[0].name).toBe(
        'Buyer 1',
      );

      const buyer2List = await buyer2Sdk.ListIntakeFormSubmissionsAsBuyer({
        buyerWorkspaceId: buyer2Workspace.id,
      });
      expect(buyer2List.listIntakeFormSubmissionsAsBuyer?.items).toHaveLength(
        1,
      );
      expect(buyer2List.listIntakeFormSubmissionsAsBuyer?.items[0].name).toBe(
        'Buyer 2',
      );
    });

    it('should not allow adopting submissions to workspace user does not have access to', async () => {
      const { utils: user1Utils } = await createClient();
      const { sdk: user2Sdk } = await createClient();

      // Create workspace owned by user1
      const workspace = await user1Utils.createWorkspace();

      // User2 should not be able to adopt submissions to user1's workspace
      await expect(
        user2Sdk.AdoptOrphanedSubmissions({
          workspaceId: workspace.id,
        }),
      ).rejects.toThrow();
    });

    it('should list orphaned submissions for the current user', async () => {
      const { sdk: sellerSdk, utils: sellerUtils } = await createClient();
      const { sdk: buyerSdk, user: buyerUser } = await createClient();

      // Create seller workspace and form
      const sellerWorkspace = await sellerUtils.createWorkspace();
      const formResponse = await sellerSdk.CreateIntakeForm({
        input: {
          workspaceId: sellerWorkspace.id,
          isActive: true,
          isPublic: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      // Create orphaned submissions (without buyerWorkspaceId) with userId
      const submission1Response = await buyerSdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId: sellerWorkspace.id,
          userId: buyerUser.id,
          name: 'Orphan 1',
          email: 'orphan1@example.com',
        },
      });
      const submission1Id =
        submission1Response.createIntakeFormSubmission?.id || '';

      const submission2Response = await buyerSdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId: sellerWorkspace.id,
          userId: buyerUser.id,
          name: 'Orphan 2',
          email: 'orphan2@example.com',
        },
      });
      const submission2Id =
        submission2Response.createIntakeFormSubmission?.id || '';

      // List orphaned submissions
      const listResponse = await buyerSdk.ListMyOrphanedSubmissions();

      // Verify response contains both orphaned submissions
      expect(listResponse.listMyOrphanedSubmissions).toHaveLength(2);
      const submissionIds = listResponse.listMyOrphanedSubmissions.map(
        (s) => s.id,
      );
      expect(submissionIds).toContain(submission1Id);
      expect(submissionIds).toContain(submission2Id);

      // All submissions should have null buyerWorkspaceId
      expect(
        listResponse.listMyOrphanedSubmissions.every(
          (s) => s.buyerWorkspaceId === null,
        ),
      ).toBe(true);
    });

    it('should not list orphaned submissions from other users', async () => {
      const { sdk: sellerSdk, utils: sellerUtils } = await createClient();
      const { sdk: buyer1Sdk, user: buyer1User } = await createClient();
      const { sdk: buyer2Sdk, user: buyer2User } = await createClient();

      // Create seller workspace and form
      const sellerWorkspace = await sellerUtils.createWorkspace();
      const formResponse = await sellerSdk.CreateIntakeForm({
        input: {
          workspaceId: sellerWorkspace.id,
          isActive: true,
          isPublic: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      // Buyer1 creates an orphaned submission
      await buyer1Sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId: sellerWorkspace.id,
          userId: buyer1User.id,
          name: 'Buyer 1 Orphan',
          email: 'buyer1@example.com',
        },
      });

      // Buyer2 creates their own orphaned submission
      await buyer2Sdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId: sellerWorkspace.id,
          userId: buyer2User.id,
          name: 'Buyer 2 Orphan',
          email: 'buyer2@example.com',
        },
      });

      // Buyer1 should only see their own orphaned submission
      const buyer1List = await buyer1Sdk.ListMyOrphanedSubmissions();
      expect(buyer1List.listMyOrphanedSubmissions).toHaveLength(1);
      expect(buyer1List.listMyOrphanedSubmissions[0].name).toBe(
        'Buyer 1 Orphan',
      );

      // Buyer2 should only see their own orphaned submission
      const buyer2List = await buyer2Sdk.ListMyOrphanedSubmissions();
      expect(buyer2List.listMyOrphanedSubmissions).toHaveLength(1);
      expect(buyer2List.listMyOrphanedSubmissions[0].name).toBe(
        'Buyer 2 Orphan',
      );
    });

    it('should adopt only specific submissions when submissionIds is provided', async () => {
      const { sdk: sellerSdk, utils: sellerUtils } = await createClient();
      const {
        sdk: buyerSdk,
        utils: buyerUtils,
        user: buyerUser,
      } = await createClient();

      // Create seller workspace and form
      const sellerWorkspace = await sellerUtils.createWorkspace();
      const formResponse = await sellerSdk.CreateIntakeForm({
        input: {
          workspaceId: sellerWorkspace.id,
          isActive: true,
          isPublic: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      // Create 3 orphaned submissions
      const submission1Response = await buyerSdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId: sellerWorkspace.id,
          userId: buyerUser.id,
          name: 'Submission 1',
          email: 'sub1@example.com',
        },
      });
      const submission1Id =
        submission1Response.createIntakeFormSubmission?.id || '';

      const submission2Response = await buyerSdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId: sellerWorkspace.id,
          userId: buyerUser.id,
          name: 'Submission 2',
          email: 'sub2@example.com',
        },
      });
      const submission2Id =
        submission2Response.createIntakeFormSubmission?.id || '';

      const submission3Response = await buyerSdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId: sellerWorkspace.id,
          userId: buyerUser.id,
          name: 'Submission 3',
          email: 'sub3@example.com',
        },
      });
      const submission3Id =
        submission3Response.createIntakeFormSubmission?.id || '';

      // Create buyer workspace
      const buyerWorkspace = await buyerUtils.createWorkspace();

      // Adopt only submission 1 and 2 (not 3)
      const adoptResponse = await buyerSdk.AdoptOrphanedSubmissions({
        workspaceId: buyerWorkspace.id,
        submissionIds: [submission1Id, submission2Id],
      });

      // Verify only 2 submissions were adopted
      expect(adoptResponse.adoptOrphanedSubmissions?.adoptedCount).toBe(2);
      expect(
        adoptResponse.adoptOrphanedSubmissions?.adoptedSubmissionIds,
      ).toHaveLength(2);
      expect(
        adoptResponse.adoptOrphanedSubmissions?.adoptedSubmissionIds,
      ).toContain(submission1Id);
      expect(
        adoptResponse.adoptOrphanedSubmissions?.adoptedSubmissionIds,
      ).toContain(submission2Id);
      expect(
        adoptResponse.adoptOrphanedSubmissions?.adoptedSubmissionIds,
      ).not.toContain(submission3Id);

      // Verify submission 3 is still orphaned
      const orphanedList = await buyerSdk.ListMyOrphanedSubmissions();
      expect(orphanedList.listMyOrphanedSubmissions).toHaveLength(1);
      expect(orphanedList.listMyOrphanedSubmissions[0].id).toBe(submission3Id);

      // Buyer workspace should only show adopted submissions
      const listResponse = await buyerSdk.ListIntakeFormSubmissionsAsBuyer({
        buyerWorkspaceId: buyerWorkspace.id,
      });
      expect(listResponse.listIntakeFormSubmissionsAsBuyer?.items).toHaveLength(
        2,
      );
    });

    it('should throw error when invalid submissionIds are provided', async () => {
      const { sdk: sellerSdk, utils: sellerUtils } = await createClient();
      const {
        sdk: buyerSdk,
        utils: buyerUtils,
        user: buyerUser,
      } = await createClient();

      // Create seller workspace and form
      const sellerWorkspace = await sellerUtils.createWorkspace();
      const formResponse = await sellerSdk.CreateIntakeForm({
        input: {
          workspaceId: sellerWorkspace.id,
          isActive: true,
          isPublic: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      // Create one orphaned submission
      await buyerSdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId: sellerWorkspace.id,
          userId: buyerUser.id,
          name: 'Valid Submission',
          email: 'valid@example.com',
        },
      });

      // Create buyer workspace
      const buyerWorkspace = await buyerUtils.createWorkspace();

      // Try to adopt with an invalid submission ID
      await expect(
        buyerSdk.AdoptOrphanedSubmissions({
          workspaceId: buyerWorkspace.id,
          submissionIds: ['invalid-submission-id'],
        }),
      ).rejects.toThrow('Invalid or non-orphaned submission IDs');
    });

    it('should throw error when trying to adopt already-adopted submission', async () => {
      const { sdk: sellerSdk, utils: sellerUtils } = await createClient();
      const {
        sdk: buyerSdk,
        utils: buyerUtils,
        user: buyerUser,
      } = await createClient();

      // Create seller workspace and form
      const sellerWorkspace = await sellerUtils.createWorkspace();
      const formResponse = await sellerSdk.CreateIntakeForm({
        input: {
          workspaceId: sellerWorkspace.id,
          isActive: true,
          isPublic: true,
        },
      });
      const formId = formResponse.createIntakeForm?.id || '';

      // Create orphaned submission
      const submissionResponse = await buyerSdk.CreateIntakeFormSubmission({
        input: {
          formId,
          workspaceId: sellerWorkspace.id,
          userId: buyerUser.id,
          name: 'Submission',
          email: 'sub@example.com',
        },
      });
      const submissionId =
        submissionResponse.createIntakeFormSubmission?.id || '';

      // Create buyer workspace and adopt all
      const buyerWorkspace = await buyerUtils.createWorkspace();
      await buyerSdk.AdoptOrphanedSubmissions({
        workspaceId: buyerWorkspace.id,
      });

      // Try to adopt the same submission again by ID - should fail since it's no longer orphaned
      await expect(
        buyerSdk.AdoptOrphanedSubmissions({
          workspaceId: buyerWorkspace.id,
          submissionIds: [submissionId],
        }),
      ).rejects.toThrow('Invalid or non-orphaned submission IDs');
    });
  });
});
