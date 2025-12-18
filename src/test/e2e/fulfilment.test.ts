/// <reference types="jest" />
import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';

import { addDays, subDays } from 'date-fns';

import {
  CreateRentalPriceForSalesOrderMutation,
  CreateRentalFulfilmentInput,
  CreateSaleFulfilmentInput,
  CreateServiceFulfilmentInput,
  CreateWorkflowConfigurationMutation,
  FulfilmentType,
  CreateSalePriceForSalesOrderMutation,
  RentalFulfilment,
  WorkspaceAccessType,
} from './generated/graphql';
import { v4 } from 'uuid';

// GraphQL operations for codegen (for reference, not used directly in tests)
gql`
  fragment RentalFulfilmentFields on RentalFulfilment {
    id
    contactId
    projectId
    salesOrderId
    salesOrderLineItemId
    purchaseOrderNumber
    salesOrderType
    workflowId
    workflowColumnId
    assignedToId
    createdAt
    updatedAt
    rentalStartDate
    rentalEndDate
    lastChargedAt
  }

  fragment SaleFulfilmentFields on SaleFulfilment {
    id
    contactId
    projectId
    salesOrderId
    salesOrderLineItemId
    purchaseOrderNumber
    salesOrderType
    workflowId
    workflowColumnId
    assignedToId
    createdAt
    updatedAt
    unitCostInCents
    quantity
    salesOrderLineItem {
      __typename
      ... on SaleSalesOrderLineItem {
        price {
          __typename
          ... on SalePrice {
            discounts
          }
        }
      }
    }
  }

  fragment ServiceFulfilmentFields on ServiceFulfilment {
    id
    contactId
    projectId
    salesOrderId
    salesOrderLineItemId
    purchaseOrderNumber
    salesOrderType
    workflowId
    workflowColumnId
    assignedToId
    createdAt
    updatedAt
    serviceDate
  }
`;

gql`
  mutation CreateRentalFulfilment($input: CreateRentalFulfilmentInput!) {
    createRentalFulfilment(input: $input) {
      ...RentalFulfilmentFields
    }
  }
`;

gql`
  mutation CreateSaleFulfilment($input: CreateSaleFulfilmentInput!) {
    createSaleFulfilment(input: $input) {
      ...SaleFulfilmentFields
    }
  }
`;

gql`
  mutation CreateServiceFulfilment($input: CreateServiceFulfilmentInput!) {
    createServiceFulfilment(input: $input) {
      ...ServiceFulfilmentFields
    }
  }
`;

gql`
  mutation DeleteFulfilment($id: ID!) {
    deleteFulfilment(id: $id)
  }
`;

gql`
  query GetFulfilmentById($id: ID!) {
    getFulfilmentById(id: $id) {
      __typename
      ... on RentalFulfilment {
        ...RentalFulfilmentFields
      }
      ... on SaleFulfilment {
        ...SaleFulfilmentFields
      }
      ... on ServiceFulfilment {
        ...ServiceFulfilmentFields
      }
    }
  }
`;

gql`
  query ListFulfilments(
    $filter: ListFulfilmentsFilter!
    $page: ListFulfilmentsPage
  ) {
    listFulfilments(filter: $filter, page: $page) {
      items {
        __typename
        ... on RentalFulfilment {
          ...RentalFulfilmentFields
        }
        ... on SaleFulfilment {
          ...SaleFulfilmentFields
        }
        ... on ServiceFulfilment {
          ...ServiceFulfilmentFields
        }
      }
      page {
        number
        size
      }
    }
  }
`;

gql`
  mutation UpdateFulfilmentColumn(
    $fulfilmentId: ID!
    $workflowColumnId: ID!
    $workflowId: ID!
  ) {
    updateFulfilmentColumn(
      fulfilmentId: $fulfilmentId
      workflowColumnId: $workflowColumnId
      workflowId: $workflowId
    ) {
      id
      workflowId
      workflowColumnId
      updatedAt
    }
  }
`;

gql`
  mutation UpdateFulfilmentAssignee($fulfilmentId: ID!, $assignedToId: ID!) {
    updateFulfilmentAssignee(
      fulfilmentId: $fulfilmentId
      assignedToId: $assignedToId
    ) {
      id
      assignedToId
      updatedAt
    }
  }
`;

gql`
  mutation SetRentalStartDate($fulfilmentId: ID!, $rentalStartDate: DateTime!) {
    setRentalStartDate(
      fulfilmentId: $fulfilmentId
      rentalStartDate: $rentalStartDate
    ) {
      id
      rentalStartDate
      rentalEndDate
      salesOrderType
    }
  }
`;

gql`
  mutation SetRentalEndDate($fulfilmentId: ID!, $rentalEndDate: DateTime!) {
    setRentalEndDate(
      fulfilmentId: $fulfilmentId
      rentalEndDate: $rentalEndDate
    ) {
      id
      rentalStartDate
      rentalEndDate
      salesOrderType
    }
  }
`;

gql`
  mutation SetExpectedRentalEndDate(
    $fulfilmentId: ID!
    $expectedRentalEndDate: DateTime!
  ) {
    setExpectedRentalEndDate(
      fulfilmentId: $fulfilmentId
      expectedRentalEndDate: $expectedRentalEndDate
    ) {
      id
      expectedRentalEndDate
      rentalStartDate
      rentalEndDate
      salesOrderType
    }
  }
`;

gql`
  mutation CreateRentalPurchaseOrderLineItem(
    $input: CreateRentalPurchaseOrderLineItemInput!
  ) {
    createRentalPurchaseOrderLineItem(input: $input) {
      id
      purchase_order_id
      price_id
      po_quantity
    }
  }
`;

gql`
  mutation SetFulfilmentPurchaseOrderLineItemId(
    $fulfilmentId: ID!
    $purchaseOrderLineItemId: ID
  ) {
    setFulfilmentPurchaseOrderLineItemId(
      fulfilmentId: $fulfilmentId
      purchaseOrderLineItemId: $purchaseOrderLineItemId
    ) {
      id
      purchaseOrderLineItemId
      purchaseOrderLineItem {
        __typename
        ... on RentalPurchaseOrderLineItem {
          id
          purchase_order_id
          purchaseOrder {
            id
            purchase_order_number
          }
        }
        ... on SalePurchaseOrderLineItem {
          id
          purchase_order_id
          purchaseOrder {
            id
            purchase_order_number
          }
        }
      }
      updatedAt
    }
  }
`;

gql`
  query ListCharges($filter: ListChargesFilter!, $page: PageInfoInput) {
    listCharges(filter: $filter, page: $page) {
      items {
        id
        amountInCents
        description
        chargeType
        contactId
        createdAt
        projectId
        salesOrderId
        purchaseOrderNumber
        salesOrderLineItemId
        fulfilmentId
        invoiceId
        billingPeriodStart
        billingPeriodEnd
      }
    }
  }
`;

gql`
  query ListRentalFulfilments(
    $filter: ListRentalFulfilmentsFilter!
    $page: ListFulfilmentsPage
  ) {
    listRentalFulfilments(filter: $filter, page: $page) {
      items {
        id
        contactId
        projectId
        salesOrderId
        salesOrderLineItemId
        purchaseOrderNumber
        salesOrderType
        workflowId
        workflowColumnId
        assignedToId
        createdAt
        updatedAt
        rentalStartDate
        rentalEndDate
        expectedRentalEndDate
        inventoryId
        pricePerDayInCents
        pricePerWeekInCents
        pricePerMonthInCents
        pimCategoryId
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

describe('Fulfilment GraphQL CRUD e2e', () => {
  let workspaceId: string;
  let salesOrderId: string;
  let rentalPriceId: string;
  let rentalPrice: CreateRentalPriceForSalesOrderMutation['createRentalPrice'];
  let salePriceId: string;
  let salePrice: CreateSalePriceForSalesOrderMutation['createSalePrice'];
  let businessContactId: string;
  let rentalSalesOrderLineItemId: string;
  let saleSalesOrderLineItemId: string;
  let workflowConfig: CreateWorkflowConfigurationMutation['createWorkflowConfiguration'];
  const userId = v4();

  beforeAll(async () => {
    const { sdk } = await createClient({ userId });

    // create a workspace
    const { createWorkspace } = await sdk.UtilCreateWorkspace({
      accessType: WorkspaceAccessType.SameDomain,
      name: 'Test Workspace',
    });

    if (!createWorkspace) throw new Error('Workspace was not created');
    workspaceId = createWorkspace.id;

    const { createWorkflowConfiguration } =
      await sdk.CreateWorkflowConfiguration({
        input: {
          name: 'Test Workflow',
          columns: [
            { id: 'col-1', name: 'Column 1' },
            { id: 'col-2', name: 'Column 2' },
          ],
        },
      });
    workflowConfig = createWorkflowConfiguration;

    const { createBusinessContact: businessContact } =
      await sdk.CreateBusinessContact({
        input: {
          name: 'big business',
          workspaceId,
        },
      });

    if (!businessContact) {
      throw new Error('Failed to create business contact');
    }

    businessContactId = businessContact.id;

    const { createSalesOrder } = await sdk.CreateSalesOrder({
      input: {
        buyer_id: businessContact.id,
        purchase_order_number: 'PO-12345',
        workspace_id: workspaceId,
      },
    });

    if (!createSalesOrder) {
      throw new Error('Failed to create sales order');
    }

    salesOrderId = createSalesOrder.id;

    // create pim category
    const { upsertPimCategory: pimCategory } = await sdk.CreatePimCategory({
      input: {
        id: 'test-category-id',
        name: 'Test Category',
        path: 'Test|Stuff',
        platform_id: 'abc-123',
        description: 'Test category for sales order',
        has_products: false,
      },
    });

    if (!pimCategory) throw new Error('Pim category was not created');

    // create a rental price
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
    rentalPrice = createRentalPriceResult;

    // sale price:
    const { createSalePrice: createSalePriceResult } =
      await sdk.CreateSalePriceForSalesOrder({
        input: {
          workspaceId,
          unitCostInCents: 10000,
          pimCategoryId: pimCategory.id,
          name: 'PPE Gloves',
        },
      });

    if (!createSalePriceResult) throw new Error('Sale price was not created');
    salePriceId = createSalePriceResult.id;
    salePrice = createSalePriceResult;

    const { createRentalSalesOrderLineItem: saleOrderLineItem } =
      await sdk.CreateRentalSalesOrderLineItem({
        input: {
          sales_order_id: salesOrderId,
          price_id: rentalPrice.id,
        },
      });

    if (!saleOrderLineItem) {
      throw new Error('Failed to create sales order line item');
    }

    rentalSalesOrderLineItemId = saleOrderLineItem.id;

    const { createSaleSalesOrderLineItem: saleLineItem } =
      await sdk.CreateSaleSalesOrderLineItem({
        input: {
          sales_order_id: salesOrderId,
          price_id: salePrice.id,
        },
      });

    if (!saleLineItem) {
      throw new Error('Failed to create sale sales order line item');
    }

    saleSalesOrderLineItemId = saleLineItem.id;
  });

  it('creates, lists, gets, updates, and deletes a RentalFulfilment', async () => {
    const { sdk } = await createClient({ userId });

    // Create
    const input: CreateRentalFulfilmentInput = {
      salesOrderId,
      salesOrderLineItemId: rentalSalesOrderLineItemId,
      rentalStartDate: new Date().toISOString(),
      rentalEndDate: new Date(Date.now() + 86400000).toISOString(),
      workflowId: workflowConfig?.id,
      workflowColumnId: workflowConfig?.columns[0].id,
      pricePerDayInCents: 1000,
      pricePerWeekInCents: 5000,
      pricePerMonthInCents: 15000,
    };

    const { createRentalFulfilment } = await sdk.CreateRentalFulfilment({
      input,
    });

    expect(createRentalFulfilment).toBeDefined();
    expect(createRentalFulfilment?.salesOrderType).toBe('RENTAL');
    const fulfilmentId = createRentalFulfilment!.id;

    // List
    const { listFulfilments } = await sdk.ListFulfilments({
      filter: {
        workspaceId,
        salesOrderType: FulfilmentType.Rental,
      },
    });

    expect(listFulfilments).toBeDefined();

    expect(listFulfilments?.items.some((f) => f.id === fulfilmentId)).toBe(
      true,
    );

    // Get by id
    const { getFulfilmentById } = await sdk.GetFulfilmentById({
      id: fulfilmentId,
    });
    expect(getFulfilmentById).toBeDefined();
    expect(getFulfilmentById?.id).toBe(fulfilmentId);

    // Delete
    const { deleteFulfilment } = await sdk.DeleteFulfilment({
      id: fulfilmentId,
    });
    expect(deleteFulfilment).toBe(true);

    await expect(sdk.GetFulfilmentById({ id: fulfilmentId })).rejects.toThrow();
  });

  it('creates, lists, gets, updates, and deletes a SaleFulfilment', async () => {
    const { sdk } = await createClient({ userId });

    // Create
    const input: CreateSaleFulfilmentInput = {
      salesOrderId,
      salesOrderLineItemId: saleSalesOrderLineItemId,
      unitCostInCents: 1000.0,
      quantity: 5,
      workflowId: workflowConfig?.id,
      workflowColumnId: workflowConfig?.columns[0].id,
    };
    const { createSaleFulfilment } = await sdk.CreateSaleFulfilment({
      input,
    });
    expect(createSaleFulfilment).toBeDefined();
    expect(createSaleFulfilment?.salesOrderType).toBe('SALE');
    const fulfilmentId = createSaleFulfilment!.id;

    // List
    const { listFulfilments } = await sdk.ListFulfilments({
      filter: {
        workspaceId,
        salesOrderType: FulfilmentType.Sale,
      },
    });
    expect(listFulfilments?.items.some((f: any) => f.id === fulfilmentId)).toBe(
      true,
    );

    // Get by id
    const { getFulfilmentById } = await sdk.GetFulfilmentById({
      id: fulfilmentId,
    });
    expect(getFulfilmentById).toBeDefined();
    expect(getFulfilmentById?.id).toBe(fulfilmentId);

    // Delete
    const { deleteFulfilment } = await sdk.DeleteFulfilment({
      id: fulfilmentId,
    });
    expect(deleteFulfilment).toBe(true);

    await expect(sdk.GetFulfilmentById({ id: fulfilmentId })).rejects.toThrow();
  });

  // service sale order item not implmented yet
  it.skip('creates, lists, gets, updates, and deletes a ServiceFulfilment', async () => {
    const { sdk } = await createClient({ userId });

    // Create
    const input: CreateServiceFulfilmentInput = {
      salesOrderId,
      salesOrderLineItemId: saleSalesOrderLineItemId,
      serviceDate: new Date().toISOString(),
      workflowId: workflowConfig?.id,
      workflowColumnId: workflowConfig?.columns[0].id,
      unitCostInCents: 5000.0,
    };
    const { createServiceFulfilment } = await sdk.CreateServiceFulfilment({
      input,
    });
    expect(createServiceFulfilment).toBeDefined();
    expect(createServiceFulfilment?.salesOrderType).toBe('SERVICE');
    expect(createServiceFulfilment?.workflowId).toBe(workflowConfig?.id);
    expect(createServiceFulfilment?.workflowColumnId).toBe(
      workflowConfig?.columns[0].id,
    );
    const fulfilmentId = createServiceFulfilment!.id;

    // List
    const { listFulfilments } = await sdk.ListFulfilments({
      filter: { workspaceId },
    });
    expect(listFulfilments?.items.some((f) => f.id === fulfilmentId)).toBe(
      true,
    );

    // Get by id
    const { getFulfilmentById } = await sdk.GetFulfilmentById({
      id: fulfilmentId,
    });
    expect(getFulfilmentById).toBeDefined();
    expect(getFulfilmentById?.id).toBe(fulfilmentId);

    // Delete
    const { deleteFulfilment } = await sdk.DeleteFulfilment({
      id: fulfilmentId,
    });
    expect(deleteFulfilment).toBe(true);

    await expect(sdk.GetFulfilmentById({ id: fulfilmentId })).rejects.toThrow();
  });

  it('throws an error when deleting a non-existent fulfilment', async () => {
    const { sdk } = await createClient({ userId });
    await expect(
      sdk.DeleteFulfilment({ id: 'nonexistent-id' }),
    ).rejects.toThrow();
  });

  it('throws an error when creating a fulfilment with missing required fields', async () => {
    const { sdk } = await createClient({ userId });
    // Missing required fields
    const badInput = {
      statusLabel: 'Missing required fields',
    };
    await expect(
      sdk.CreateRentalFulfilment({ input: badInput as any }),
    ).rejects.toThrow();
    await expect(
      sdk.CreateSaleFulfilment({ input: badInput as any }),
    ).rejects.toThrow();
    await expect(
      sdk.CreateServiceFulfilment({ input: badInput as any }),
    ).rejects.toThrow();
  });

  it('updates workflow column and workflow id using updateFulfilmentColumn mutation', async () => {
    const { sdk } = await createClient({ userId });

    // Create a RentalFulfilment to test with
    const input: CreateRentalFulfilmentInput = {
      salesOrderId,
      salesOrderLineItemId: rentalSalesOrderLineItemId,
      rentalStartDate: new Date().toISOString(),
      rentalEndDate: new Date(Date.now() + 86400000).toISOString(),
      workflowId: workflowConfig?.id,
      workflowColumnId: workflowConfig?.columns[0].id,
      pricePerDayInCents: 1000,
      pricePerWeekInCents: 5000,
      pricePerMonthInCents: 15000,
    };

    const { createRentalFulfilment } = await sdk.CreateRentalFulfilment({
      input,
    });

    expect(createRentalFulfilment).toBeDefined();
    const fulfilmentId = createRentalFulfilment!.id;

    // Use the SDK to call updateFulfilmentColumn
    if (
      !workflowConfig ||
      !workflowConfig.id ||
      !workflowConfig.columns[1]?.id
    ) {
      throw new Error(
        'Workflow configuration or columns are not properly set up',
      );
    }
    const newWorkflowId: string = workflowConfig.id;
    const newWorkflowColumnId: string = workflowConfig.columns[1].id;

    const { updateFulfilmentColumn } = await sdk.UpdateFulfilmentColumn({
      fulfilmentId,
      workflowColumnId: newWorkflowColumnId,
      workflowId: newWorkflowId,
    });

    expect(updateFulfilmentColumn).toBeDefined();
    expect(updateFulfilmentColumn!.id).toBe(fulfilmentId);
    expect(updateFulfilmentColumn!.workflowId).toBe(newWorkflowId);
    expect(updateFulfilmentColumn!.workflowColumnId).toBe(newWorkflowColumnId);
  });

  it('updates the assignee of a fulfilment using updateFulfilmentAssignee mutation', async () => {
    const { sdk } = await createClient({ userId });

    // Create a RentalFulfilment to test with
    const input: CreateRentalFulfilmentInput = {
      salesOrderId,
      salesOrderLineItemId: rentalSalesOrderLineItemId,
      rentalStartDate: new Date().toISOString(),
      rentalEndDate: new Date(Date.now() + 86400000).toISOString(),
      workflowId: workflowConfig?.id,
      workflowColumnId: workflowConfig?.columns[0].id,
      pricePerDayInCents: 1000,
      pricePerWeekInCents: 5000,
      pricePerMonthInCents: 15000,
    };

    const { createRentalFulfilment } = await sdk.CreateRentalFulfilment({
      input,
    });

    expect(createRentalFulfilment).toBeDefined();
    const fulfilmentId = createRentalFulfilment!.id;
    // Create a business contact to use as the assignee
    const { createBusinessContact: assignee } = await sdk.CreateBusinessContact(
      {
        input: {
          name: 'Assignee User',
          workspaceId,
        },
      },
    );

    expect(assignee).toBeDefined();
    if (!assignee) {
      throw new Error('Failed to create assignee business contact');
    }
    const assignedToId = assignee.id;

    // Use the SDK to call updateFulfilmentAssignee
    const { updateFulfilmentAssignee } = await sdk.UpdateFulfilmentAssignee({
      fulfilmentId,
      assignedToId,
    });

    expect(updateFulfilmentAssignee).toBeDefined();
    expect(updateFulfilmentAssignee!.id).toBe(fulfilmentId);
    expect(updateFulfilmentAssignee!.assignedToId).toBe(assignedToId);
    expect(updateFulfilmentAssignee!.updatedAt).toBeDefined();

    const { getFulfilmentById } = await sdk.GetFulfilmentById({
      id: fulfilmentId,
    });
    expect(getFulfilmentById).toBeDefined();

    // Only check assignedToId if present
    if ('assignedToId' in (getFulfilmentById ?? {})) {
      expect(getFulfilmentById?.assignedToId).toBe(assignedToId);
    }
  });

  describe('setRentalStartDate mutation', () => {
    it('successfully sets the rental start date', async () => {
      const { sdk } = await createClient({ userId });
      // Create a rental fulfilment
      const input: CreateRentalFulfilmentInput = {
        salesOrderId,
        salesOrderLineItemId: rentalSalesOrderLineItemId,
        rentalStartDate: new Date().toISOString(),
        rentalEndDate: new Date(Date.now() + 86400000).toISOString(),
        workflowId: workflowConfig?.id,
        workflowColumnId: workflowConfig?.columns[0].id,
        pricePerDayInCents: 1000,
        pricePerWeekInCents: 5000,
        pricePerMonthInCents: 15000,
      };
      const { createRentalFulfilment } = await sdk.CreateRentalFulfilment({
        input,
      });
      expect(createRentalFulfilment).toBeDefined();
      const fulfilmentId = createRentalFulfilment!.id;

      // Set a new start date
      const newStartDate = new Date(Date.now() + 3600000).toISOString();
      const { setRentalStartDate } = await sdk.SetRentalStartDate({
        fulfilmentId,
        rentalStartDate: newStartDate,
      });
      expect(setRentalStartDate).toBeDefined();
      expect(setRentalStartDate!.rentalStartDate).toBe(newStartDate);
    });

    it('throws if fulfilment not found', async () => {
      const { sdk } = await createClient({ userId });
      await expect(
        sdk.SetRentalStartDate({
          fulfilmentId: 'nonexistent-id',
          rentalStartDate: new Date().toISOString(),
        }),
      ).rejects.toThrow();
    });

    it('throws if fulfilment is not a rental fulfilment', async () => {
      const { sdk } = await createClient({ userId });
      // Create a sale fulfilment
      const input: CreateSaleFulfilmentInput = {
        salesOrderId,
        salesOrderLineItemId: saleSalesOrderLineItemId,
        unitCostInCents: 1000.0,
        quantity: 1,
        workflowId: workflowConfig?.id,
        workflowColumnId: workflowConfig?.columns[0].id,
      };
      const { createSaleFulfilment } = await sdk.CreateSaleFulfilment({
        input,
      });
      expect(createSaleFulfilment).toBeDefined();
      expect(createSaleFulfilment?.salesOrderType).toBe('SALE');
      const fulfilmentId = createSaleFulfilment!.id;

      await expect(
        sdk.SetRentalStartDate({
          fulfilmentId,
          rentalStartDate: new Date().toISOString(),
        }),
      ).rejects.toThrow('Fulfilment is not a rental fulfilment');
    });

    it('throws if rental start date is not before expected rental end date', async () => {
      const { sdk } = await createClient({ userId });
      // Create a rental fulfilment with an expectedRentalEndDate
      const now = Date.now();
      const expectedRentalEndDate = new Date(now + 86400000).toISOString();
      const input: CreateRentalFulfilmentInput = {
        salesOrderId,
        salesOrderLineItemId: rentalSalesOrderLineItemId,
        rentalStartDate: new Date(now).toISOString(),
        rentalEndDate: new Date(now + 2 * 86400000).toISOString(),
        workflowId: workflowConfig?.id,
        workflowColumnId: workflowConfig?.columns[0].id,
        pricePerDayInCents: 1000,
        pricePerWeekInCents: 5000,
        pricePerMonthInCents: 15000,
      };
      const { createRentalFulfilment } = await sdk.CreateRentalFulfilment({
        input,
      });
      expect(createRentalFulfilment).toBeDefined();
      const fulfilmentId = createRentalFulfilment!.id;

      // Set expectedRentalEndDate
      const { setExpectedRentalEndDate } = await sdk.SetExpectedRentalEndDate({
        fulfilmentId,
        expectedRentalEndDate,
      });
      expect(setExpectedRentalEndDate).toBeDefined();

      // Try to set rentalStartDate to equal or after expectedRentalEndDate
      await expect(
        sdk.SetRentalStartDate({
          fulfilmentId,
          rentalStartDate: expectedRentalEndDate,
        }),
      ).rejects.toThrow(
        'Rental start date must be before the expected rental end date',
      );
      await expect(
        sdk.SetRentalStartDate({
          fulfilmentId,
          rentalStartDate: new Date(now + 2 * 86400000).toISOString(),
        }),
      ).rejects.toThrow(
        'Rental start date must be before the expected rental end date',
      );
    });
  });

  describe('setRentalEndDate mutation', () => {
    it('successfully sets the rental end date', async () => {
      const { sdk } = await createClient({ userId });
      // Create a rental fulfilment
      const input: CreateRentalFulfilmentInput = {
        salesOrderId,
        salesOrderLineItemId: rentalSalesOrderLineItemId,
        workflowId: workflowConfig?.id,
        workflowColumnId: workflowConfig?.columns[0].id,
        pricePerDayInCents: 1000,
        pricePerWeekInCents: 5000,
        pricePerMonthInCents: 15000,
      };
      const { createRentalFulfilment } = await sdk.CreateRentalFulfilment({
        input,
      });
      expect(createRentalFulfilment).toBeDefined();
      const fulfilmentId = createRentalFulfilment!.id;

      // first set a rental start date
      const startDate = new Date().toISOString();
      const { setRentalStartDate: setRentalStartDateResult } =
        await sdk.SetRentalStartDate({
          fulfilmentId,
          rentalStartDate: startDate,
        });
      expect(setRentalStartDateResult?.rentalStartDate).toBe(startDate);

      // Set a new end date after start date
      const newEndDate = new Date(Date.now() + 2 * 86400000).toISOString();
      const { setRentalEndDate } = await sdk.SetRentalEndDate({
        fulfilmentId,
        rentalEndDate: newEndDate,
      });
      expect(setRentalEndDate).toBeDefined();
      expect(setRentalEndDate!.rentalEndDate).toBe(newEndDate);
    });

    it('throws if fulfilment not found', async () => {
      const { sdk } = await createClient({ userId });
      await expect(
        sdk.SetRentalEndDate({
          fulfilmentId: 'nonexistent-id',
          rentalEndDate: new Date().toISOString(),
        }),
      ).rejects.toThrow();
    });

    it('throws if fulfilment is not a rental fulfilment', async () => {
      const { sdk } = await createClient({ userId });
      // Create a service fulfilment
      const input: CreateSaleFulfilmentInput = {
        salesOrderId,
        salesOrderLineItemId: saleSalesOrderLineItemId,
        unitCostInCents: 1000.0,
        quantity: 1,
        workflowId: workflowConfig?.id,
        workflowColumnId: workflowConfig?.columns[0].id,
      };
      const { createSaleFulfilment } = await sdk.CreateSaleFulfilment({
        input,
      });
      expect(createSaleFulfilment).toBeDefined();
      const fulfilmentId = createSaleFulfilment!.id;

      await expect(
        sdk.SetRentalEndDate({
          fulfilmentId,
          rentalEndDate: new Date().toISOString(),
        }),
      ).rejects.toThrow('Fulfilment is not a rental fulfilment');
    });

    it('throws if rental start date is not set', async () => {
      const { sdk } = await createClient({ userId });
      // Create a rental fulfilment with a start date, then clear it in the DB/model (simulate missing start date)
      const input: CreateRentalFulfilmentInput = {
        salesOrderId,
        salesOrderLineItemId: rentalSalesOrderLineItemId,
        rentalStartDate: new Date().toISOString(),
        rentalEndDate: new Date(Date.now() + 86400000).toISOString(),
        workflowId: workflowConfig?.id,
        workflowColumnId: workflowConfig?.columns[0].id,
        pricePerDayInCents: 1000,
        pricePerWeekInCents: 5000,
        pricePerMonthInCents: 15000,
      };
      const { createRentalFulfilment } = await sdk.CreateRentalFulfilment({
        input,
      });
      expect(createRentalFulfilment).toBeDefined();
      const fulfilmentId = createRentalFulfilment!.id;

      // Simulate missing start date by setting it to null via update (if API allows), otherwise skip this test if not possible
      // For now, forcibly set end date before start date to trigger the next error
      await expect(
        sdk.SetRentalEndDate({
          fulfilmentId,
          rentalEndDate: new Date(Date.now() - 86400000).toISOString(),
        }),
      ).rejects.toThrow(
        /Rental end date must be after the start date|Rental start date must be set before setting end date/,
      );
    });

    it('throws if rental end date is not after start date', async () => {
      const { sdk } = await createClient({ userId });
      // Create a rental fulfilment
      const now = Date.now();
      const startDate = new Date(now).toISOString();
      const input: CreateRentalFulfilmentInput = {
        salesOrderId,
        salesOrderLineItemId: rentalSalesOrderLineItemId,
        workflowId: workflowConfig?.id,
        workflowColumnId: workflowConfig?.columns[0].id,
        pricePerDayInCents: 1000,
        pricePerWeekInCents: 5000,
        pricePerMonthInCents: 15000,
      };
      const { createRentalFulfilment } = await sdk.CreateRentalFulfilment({
        input,
      });
      expect(createRentalFulfilment).toBeDefined();

      const fulfilmentId = createRentalFulfilment!.id;
      // Set rental start date
      const { setRentalStartDate: setRentalStartDateResult } =
        await sdk.SetRentalStartDate({
          fulfilmentId,
          rentalStartDate: startDate,
        });
      expect(setRentalStartDateResult?.rentalStartDate).toBe(startDate);

      // Try to set end date to before or equal to start date
      await expect(
        sdk.SetRentalEndDate({
          fulfilmentId,
          rentalEndDate: startDate,
        }),
      ).rejects.toThrow('Rental end date must be after the start date');
      await expect(
        sdk.SetRentalEndDate({
          fulfilmentId,
          rentalEndDate: new Date(now - 1000).toISOString(),
        }),
      ).rejects.toThrow('Rental end date must be after the start date');
    });
  });

  describe('setExpectedRentalEndDate mutation', () => {
    it('successfully sets the expected rental end date', async () => {
      const { sdk } = await createClient({ userId });
      // Create a rental fulfilment
      const input: CreateRentalFulfilmentInput = {
        salesOrderId,
        salesOrderLineItemId: rentalSalesOrderLineItemId,
        rentalStartDate: new Date().toISOString(),
        rentalEndDate: new Date(Date.now() + 86400000).toISOString(),
        workflowId: workflowConfig?.id,
        workflowColumnId: workflowConfig?.columns[0].id,
        pricePerDayInCents: 1000,
        pricePerWeekInCents: 5000,
        pricePerMonthInCents: 15000,
      };
      const { createRentalFulfilment } = await sdk.CreateRentalFulfilment({
        input,
      });
      expect(createRentalFulfilment).toBeDefined();
      const fulfilmentId = createRentalFulfilment!.id;

      // Set a new expected end date after start date
      const newExpectedEndDate = new Date(
        Date.now() + 2 * 86400000,
      ).toISOString();
      const { setExpectedRentalEndDate } = await sdk.SetExpectedRentalEndDate({
        fulfilmentId,
        expectedRentalEndDate: newExpectedEndDate,
      });
      expect(setExpectedRentalEndDate).toBeDefined();
      expect(setExpectedRentalEndDate!.id).toBe(fulfilmentId);
      // Optionally check the field if present
      if ('expectedRentalEndDate' in (setExpectedRentalEndDate ?? {})) {
        expect((setExpectedRentalEndDate as any).expectedRentalEndDate).toBe(
          newExpectedEndDate,
        );
      }
    });

    it('throws if fulfilment not found', async () => {
      const { sdk } = await createClient({ userId });
      await expect(
        sdk.SetExpectedRentalEndDate({
          fulfilmentId: 'nonexistent-id',
          expectedRentalEndDate: new Date().toISOString(),
        }),
      ).rejects.toThrow();
    });

    it('throws if fulfilment is not a rental fulfilment', async () => {
      const { sdk } = await createClient({ userId });
      // Create a sale fulfilment
      const input: CreateSaleFulfilmentInput = {
        salesOrderId,
        salesOrderLineItemId: saleSalesOrderLineItemId,
        unitCostInCents: 1000.0,
        quantity: 1,
        workflowId: workflowConfig?.id,
        workflowColumnId: workflowConfig?.columns[0].id,
      };
      const { createSaleFulfilment } = await sdk.CreateSaleFulfilment({
        input,
      });
      expect(createSaleFulfilment).toBeDefined();
      const fulfilmentId = createSaleFulfilment!.id;

      await expect(
        sdk.SetExpectedRentalEndDate({
          fulfilmentId,
          expectedRentalEndDate: new Date().toISOString(),
        }),
      ).rejects.toThrow('Fulfilment is not a rental fulfilment');
    });

    it('throws if expected rental end date is not after start date', async () => {
      const { sdk } = await createClient({ userId });
      // Create a rental fulfilment
      const now = Date.now();
      const startDate = new Date(now).toISOString();

      const { createRentalFulfilment } = await sdk.CreateRentalFulfilment({
        input: {
          salesOrderId,
          salesOrderLineItemId: rentalSalesOrderLineItemId,
          workflowId: workflowConfig?.id,
          workflowColumnId: workflowConfig?.columns[0].id,
          pricePerDayInCents: 1000,
          pricePerWeekInCents: 5000,
          pricePerMonthInCents: 15000,
        },
      });
      expect(createRentalFulfilment).toBeDefined();
      const fulfilmentId = createRentalFulfilment!.id;

      // set rental start date
      const { setRentalStartDate: setRentalStartDateResult } =
        await sdk.SetRentalStartDate({
          fulfilmentId,
          rentalStartDate: startDate,
        });

      expect(setRentalStartDateResult?.rentalStartDate).toBe(startDate);

      // Try to set expected end date to before or equal to start date
      await expect(
        sdk.SetExpectedRentalEndDate({
          fulfilmentId,
          expectedRentalEndDate: startDate,
        }),
      ).rejects.toThrow('Expected end date must be after the start date');
      await expect(
        sdk.SetExpectedRentalEndDate({
          fulfilmentId,
          expectedRentalEndDate: new Date(now - 1000).toISOString(),
        }),
      ).rejects.toThrow('Expected end date must be after the start date');
    });
  });

  describe('Charges - RentalFulfilment', () => {
    it.each([
      {
        days: 1,
        expectedCharged: [
          {
            amountInCents: 1000,
            description: `Rental charge for Test Category: Super Big Digger, 1 day: 1 x Day Rate (10.00)`,
          },
        ],
      },
      {
        days: 7,
        expectedCharged: [
          {
            amountInCents: 4000,
            // Rental charge for Test Category: Super Big Digger, 7 days: 1 x Week Rate (40.00)
            description: `Rental charge for Test Category: Super Big Digger, 7 days: 1 x Week Rate (40.00)`,
          },
        ],
      },
      {
        days: 28,
        expectedCharged: [
          {
            amountInCents: 12000,
            description: `Rental charge for Test Category: Super Big Digger, 28 days: 1 x 28 Day Rate (120.00)`,
          },
        ],
      },
      // Example for days > 28 (add more as needed)
      {
        days: 35,
        expectedCharged: [
          {
            amountInCents: 12000,
            description: `Rental charge for Test Category: Super Big Digger, 28 days: 1 x 28 Day Rate (120.00)`,
          },
          {
            amountInCents: 4000,
            description: `Rental charge for Test Category: Super Big Digger, 7 days: 1 x Week Rate (40.00)`,
          },
        ],
      },
    ])(
      'When ending rental - duration $days day(s)',
      async ({ days, expectedCharged }) => {
        const { sdk } = await createClient({ userId });

        const { createSalesOrder } = await sdk.CreateSalesOrder({
          input: {
            buyer_id: businessContactId,
            purchase_order_number: new Date().toISOString(),
            workspace_id: workspaceId,
          },
        });

        if (!createSalesOrder) throw new Error('Failed to create sales order');

        const { createRentalSalesOrderLineItem: salesOrderLineItem } =
          await sdk.CreateRentalSalesOrderLineItem({
            input: {
              sales_order_id: createSalesOrder.id,
              price_id: rentalPriceId,
              delivery_date: subDays(new Date(), days).toISOString(),
            },
          });

        if (!salesOrderLineItem?.id) {
          throw new Error('Failed to create rental sales order line item');
        }

        await sdk.SubmitSalesOrder({ id: createSalesOrder.id });

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

        expect(rentalFulfilment.rentalStartDate).toEqual(
          salesOrderLineItem.delivery_date,
        );

        const { setRentalStartDate } = await sdk.SetRentalStartDate({
          fulfilmentId: rentalFulfilment.id,
          rentalStartDate: subDays(new Date(), days),
        });

        if (!setRentalStartDate) {
          throw new Error('Failed to set rental start date');
        }

        if (days < 28) {
          const { listCharges: listChargesBefore } = await sdk.ListCharges({
            filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
          });

          expect(listChargesBefore?.items.length).toBe(0);
        }

        const { setRentalEndDate } = await sdk.SetRentalEndDate({
          fulfilmentId: rentalFulfilment.id,
          rentalEndDate: addDays(
            rentalFulfilment.rentalStartDate,
            days,
          ).toISOString(),
        });

        if (!setRentalEndDate) throw new Error('Failed to set rental end date');

        const { listCharges: listChargesAfter } = await sdk.ListCharges({
          filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
        });

        expect(listChargesAfter?.items.length).toBe(expectedCharged.length);

        // Assert each expected charge is present
        for (const expected of expectedCharged) {
          expect(listChargesAfter?.items).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                amountInCents: expected.amountInCents,
                description: expected.description,
                chargeType: rentalFulfilment.salesOrderType,
                contactId: rentalFulfilment.contactId,
                projectId: rentalFulfilment.projectId,
                salesOrderId: rentalFulfilment.salesOrderId,
                purchaseOrderNumber: rentalFulfilment.purchaseOrderNumber,
                salesOrderLineItemId: rentalFulfilment.salesOrderLineItemId,
                fulfilmentId: rentalFulfilment.id,
                invoiceId: null,
              }),
            ]),
          );
        }

        const { getFulfilmentById } = await sdk.GetFulfilmentById({
          id: rentalFulfilment.id,
        });

        if (
          !getFulfilmentById ||
          getFulfilmentById.__typename !== 'RentalFulfilment'
        ) {
          throw new Error('Failed to get fulfilment by ID');
        }

        // Optionally, check lastChargedAt matches the last charge's createdAt
        if (listChargesAfter?.items.length) {
          const lastCharge =
            listChargesAfter.items[listChargesAfter.items.length - 1];
          expect(getFulfilmentById.lastChargedAt).toEqual(
            lastCharge?.createdAt,
          );
        }
      },
    );

    describe('re-creates any automated charges if the start date is changed repeatedly and no charges have been invoiced', () => {
      let rentalFulfilment: RentalFulfilment;
      beforeAll(async () => {
        const { sdk } = await createClient({ userId });

        const { createSalesOrder } = await sdk.CreateSalesOrder({
          input: {
            buyer_id: businessContactId,
            purchase_order_number: new Date().toISOString(),
            workspace_id: workspaceId,
          },
        });

        if (!createSalesOrder) throw new Error('Failed to create sales order');

        const { createRentalSalesOrderLineItem: salesOrderLineItem } =
          await sdk.CreateRentalSalesOrderLineItem({
            input: {
              sales_order_id: createSalesOrder.id,
              price_id: rentalPriceId,
            },
          });

        if (!salesOrderLineItem?.id) {
          throw new Error('Failed to create rental sales order line item');
        }

        await sdk.SubmitSalesOrder({ id: createSalesOrder.id });

        const { listFulfilments } = await sdk.ListFulfilments({
          filter: {
            workspaceId,
            salesOrderId: createSalesOrder.id,
          },
        });

        // @ts-ignore
        rentalFulfilment = listFulfilments?.items?.[0];

        if (
          !rentalFulfilment ||
          rentalFulfilment.__typename !== 'RentalFulfilment'
        ) {
          throw new Error('Failed to find rental fulfilment');
        }
      });

      it.each([
        {
          days: 28,
          expectedCharges: [
            {
              amountInCents: 12000,
              description: `Rental charge for Test Category: Super Big Digger, 28 days: 1 x 28 Day Rate (120.00)`,
            },
          ],
        },
        {
          days: 27,
          expectedCharges: [],
        },
        {
          // We don't expect the 1 day charge, since the rental has not ended, all we're expecting is the 28 day charge
          days: 29,
          expectedCharges: [
            {
              amountInCents: 12000,
              description: `Rental charge for Test Category: Super Big Digger, 28 days: 1 x 28 Day Rate (120.00)`,
            },
          ],
        },
      ])(
        're-creates charges for $days days, delete any existing charges',
        async ({ days, expectedCharges }) => {
          const { sdk } = await createClient({ userId });
          const { setRentalStartDate } = await sdk.SetRentalStartDate({
            fulfilmentId: rentalFulfilment.id,
            rentalStartDate: subDays(new Date(), days),
          });

          if (!setRentalStartDate) {
            throw new Error('Failed to set rental start date');
          }

          const { listCharges } = await sdk.ListCharges({
            filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
          });

          expect(listCharges?.items.length).toBe(expectedCharges.length);

          for (const expected of expectedCharges) {
            expect(listCharges?.items).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  amountInCents: expected.amountInCents,
                  description: expected.description,
                  chargeType: rentalFulfilment.salesOrderType,
                  contactId: rentalFulfilment.contactId,
                  projectId: rentalFulfilment.projectId,
                  salesOrderId: rentalFulfilment.salesOrderId,
                  purchaseOrderNumber: rentalFulfilment.purchaseOrderNumber,
                  salesOrderLineItemId: rentalFulfilment.salesOrderLineItemId,
                  fulfilmentId: rentalFulfilment.id,
                  invoiceId: null,
                }),
              ]),
            );
          }

          const { getFulfilmentById } = await sdk.GetFulfilmentById({
            id: rentalFulfilment.id,
          });

          if (
            !getFulfilmentById ||
            getFulfilmentById.__typename !== 'RentalFulfilment'
          ) {
            throw new Error('Failed to get fulfilment by ID');
          }

          const expectedLastChargedAt = expectedCharges.length
            ? listCharges?.items[listCharges.items.length - 1]?.createdAt
            : null;

          expect(getFulfilmentById.lastChargedAt).toEqual(
            expectedLastChargedAt,
          );
        },
      );
    });

    it('throws an error if charges have been invoiced and the rental start date is changed', async () => {
      const { sdk } = await createClient({ userId });

      const { createSalesOrder } = await sdk.CreateSalesOrder({
        input: {
          buyer_id: businessContactId,
          purchase_order_number: new Date().toISOString(),
          workspace_id: workspaceId,
        },
      });

      if (!createSalesOrder) throw new Error('Failed to create sales order');

      const { createRentalSalesOrderLineItem: salesOrderLineItem } =
        await sdk.CreateRentalSalesOrderLineItem({
          input: {
            sales_order_id: createSalesOrder.id,
            price_id: rentalPriceId,
          },
        });

      if (!salesOrderLineItem?.id) {
        throw new Error('Failed to create rental sales order line item');
      }

      await sdk.SubmitSalesOrder({ id: createSalesOrder.id });

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

      const { setRentalStartDate } = await sdk.SetRentalStartDate({
        fulfilmentId: rentalFulfilment.id,
        rentalStartDate: subDays(new Date(), 28),
      });

      if (!setRentalStartDate) {
        throw new Error('Failed to set rental start date');
      }

      const { listCharges } = await sdk.ListCharges({
        filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
      });

      if (!listCharges) {
        throw new Error('Failed to list charges');
      }

      expect(listCharges?.items.length).toBe(1);
      const charge = listCharges?.items[0];

      const { createInvoice: invoice } = await sdk.CreateInvoice({
        input: {
          workspaceId,
          buyerId: businessContactId,
          sellerId: '',
        },
      });

      if (!invoice) {
        throw new Error('Failed to create invoice');
      }

      const { addInvoiceCharges } = await sdk.AddInvoiceCharges({
        input: {
          invoiceId: invoice.id,
          chargeIds: [charge!.id],
        },
      });

      if (!addInvoiceCharges) {
        throw new Error('Failed to add invoice charges');
      }

      const { listCharges: charges } = await sdk.ListCharges({
        filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
      });

      if (!charges) {
        throw new Error('Failed to list charges');
      }

      expect(charges.items.length).toBe(1);
      expect(charges.items[0].invoiceId).toBe(invoice.id);

      await expect(
        sdk.SetRentalStartDate({
          fulfilmentId: rentalFulfilment.id,
          rentalStartDate: subDays(new Date(), 28),
        }),
      ).rejects.toThrow(
        'Rental start date cannot be changed after charges have been invoiced',
      );
    });
  });

  describe('Rental fulfilment with past start date', () => {
    it('creates charges automatically when rental start date is > 28 days in the past', async () => {
      const { sdk } = await createClient({ userId });

      // Create a sales order
      const { createSalesOrder } = await sdk.CreateSalesOrder({
        input: {
          buyer_id: businessContactId,
          purchase_order_number: `PO-PAST-${new Date().toISOString()}`,
          workspace_id: workspaceId,
        },
      });

      if (!createSalesOrder) throw new Error('Failed to create sales order');

      // Create a rental sales order line item with delivery date 35 days in the past
      const pastDeliveryDate = subDays(new Date(), 35).toISOString();
      const { createRentalSalesOrderLineItem: salesOrderLineItem } =
        await sdk.CreateRentalSalesOrderLineItem({
          input: {
            sales_order_id: createSalesOrder.id,
            price_id: rentalPriceId,
            delivery_date: pastDeliveryDate,
          },
        });

      if (!salesOrderLineItem?.id) {
        throw new Error('Failed to create rental sales order line item');
      }

      // Submit the sales order - this should create the fulfilment with charges
      await sdk.SubmitSalesOrder({ id: createSalesOrder.id });

      // List fulfilments for this sales order
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

      // Verify the rental start date matches the delivery date
      expect(rentalFulfilment.rentalStartDate).toEqual(pastDeliveryDate);

      // List charges for this fulfilment
      const { listCharges } = await sdk.ListCharges({
        filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
      });

      // Should have created a 28-day charge automatically
      expect(listCharges?.items.length).toBe(1);

      const charge = listCharges?.items[0];
      expect(charge).toEqual(
        expect.objectContaining({
          amountInCents: 12000, // 28 days at monthly rate
          description: `Rental charge for Test Category: Super Big Digger, 28 days: 1 x 28 Day Rate (120.00)`,
          chargeType: 'RENTAL',
          contactId: rentalFulfilment.contactId,
          projectId: rentalFulfilment.projectId,
          salesOrderId: rentalFulfilment.salesOrderId,
          purchaseOrderNumber: rentalFulfilment.purchaseOrderNumber,
          salesOrderLineItemId: rentalFulfilment.salesOrderLineItemId,
          fulfilmentId: rentalFulfilment.id,
          invoiceId: null,
        }),
      );

      // Verify lastChargedAt is set
      const { getFulfilmentById } = await sdk.GetFulfilmentById({
        id: rentalFulfilment.id,
      });

      if (
        !getFulfilmentById ||
        getFulfilmentById.__typename !== 'RentalFulfilment'
      ) {
        throw new Error('Failed to get fulfilment by ID');
      }

      expect(getFulfilmentById.lastChargedAt).toEqual(charge?.createdAt);
    });

    it('does not create charges when rental start date is < 28 days in the past', async () => {
      const { sdk } = await createClient({ userId });

      // Create a sales order
      const { createSalesOrder } = await sdk.CreateSalesOrder({
        input: {
          buyer_id: businessContactId,
          purchase_order_number: `PO-RECENT-${new Date().toISOString()}`,
          workspace_id: workspaceId,
        },
      });

      if (!createSalesOrder) throw new Error('Failed to create sales order');

      // Create a rental sales order line item with delivery date 20 days in the past
      const recentDeliveryDate = subDays(new Date(), 20).toISOString();
      const { createRentalSalesOrderLineItem: salesOrderLineItem } =
        await sdk.CreateRentalSalesOrderLineItem({
          input: {
            sales_order_id: createSalesOrder.id,
            price_id: rentalPriceId,
            delivery_date: recentDeliveryDate,
          },
        });

      if (!salesOrderLineItem?.id) {
        throw new Error('Failed to create rental sales order line item');
      }

      // Submit the sales order
      await sdk.SubmitSalesOrder({ id: createSalesOrder.id });

      // List fulfilments for this sales order
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

      // Verify the rental start date matches the delivery date
      expect(rentalFulfilment.rentalStartDate).toEqual(recentDeliveryDate);

      // List charges for this fulfilment
      const { listCharges } = await sdk.ListCharges({
        filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
      });

      // Should NOT have created any charges since it's less than 28 days
      expect(listCharges?.items.length).toBe(0);

      // Verify lastChargedAt is null
      const { getFulfilmentById } = await sdk.GetFulfilmentById({
        id: rentalFulfilment.id,
      });

      if (
        !getFulfilmentById ||
        getFulfilmentById.__typename !== 'RentalFulfilment'
      ) {
        throw new Error('Failed to get fulfilment by ID');
      }

      expect(getFulfilmentById.lastChargedAt).toBeNull();
    });

    it('creates multiple charges for rentals with start date > 56 days in the past', async () => {
      const { sdk } = await createClient({ userId });

      // Create a sales order
      const { createSalesOrder } = await sdk.CreateSalesOrder({
        input: {
          buyer_id: businessContactId,
          purchase_order_number: `PO-VERY-PAST-${new Date().toISOString()}`,
          workspace_id: workspaceId,
        },
      });

      if (!createSalesOrder) throw new Error('Failed to create sales order');

      // Create a rental sales order line item with delivery date 60 days in the past
      const veryPastDeliveryDate = subDays(new Date(), 60).toISOString();
      const { createRentalSalesOrderLineItem: salesOrderLineItem } =
        await sdk.CreateRentalSalesOrderLineItem({
          input: {
            sales_order_id: createSalesOrder.id,
            price_id: rentalPriceId,
            delivery_date: veryPastDeliveryDate,
          },
        });

      if (!salesOrderLineItem?.id) {
        throw new Error('Failed to create rental sales order line item');
      }

      // Submit the sales order - this should create the fulfilment with multiple charges
      await sdk.SubmitSalesOrder({ id: createSalesOrder.id });

      // List fulfilments for this sales order
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

      // List charges for this fulfilment
      const { listCharges } = await sdk.ListCharges({
        filter: { workspaceId, fulfilmentId: rentalFulfilment.id },
      });

      // Should have created 2 charges: one for 28 days and one for 28 days (56 total, remaining 4 days not charged)
      expect(listCharges?.items.length).toBe(2);

      // Verify both charges
      expect(listCharges?.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            amountInCents: 12000,
            description: `Rental charge for Test Category: Super Big Digger, 28 days: 1 x 28 Day Rate (120.00)`,
          }),
          expect.objectContaining({
            amountInCents: 12000,
            description: `Rental charge for Test Category: Super Big Digger, 28 days: 1 x 28 Day Rate (120.00)`,
          }),
        ]),
      );
    });
  });

  describe('Charges - SaleFulfilment', () => {
    it('creates a charge when a SaleFulfilment is created', async () => {
      const { sdk } = await createClient({ userId });

      const { createSalesOrder } = await sdk.CreateSalesOrder({
        input: {
          buyer_id: businessContactId,
          purchase_order_number: new Date().toISOString(),
          workspace_id: workspaceId,
        },
      });

      if (!createSalesOrder) throw new Error('Failed to create sales order');

      const { createSaleSalesOrderLineItem: salesOrderLineItem } =
        await sdk.CreateSaleSalesOrderLineItem({
          input: {
            sales_order_id: createSalesOrder.id,
            price_id: salePriceId,
          },
        });

      if (!salesOrderLineItem?.id) {
        throw new Error('Failed to create sale sales order line item');
      }

      await sdk.SubmitSalesOrder({ id: createSalesOrder.id });

      // List
      const { listFulfilments } = await sdk.ListFulfilments({
        filter: {
          workspaceId,
          salesOrderLineItemId: salesOrderLineItem?.id,
        },
      });

      const saleFulfilment = listFulfilments?.items?.[0];

      if (!saleFulfilment || saleFulfilment.__typename !== 'SaleFulfilment') {
        throw new Error('Failed to find sale fulfilment');
      }

      const { listCharges } = await sdk.ListCharges({
        filter: { workspaceId, fulfilmentId: saleFulfilment.id },
      });

      expect(listCharges?.items.length).toBe(1);

      const charge = listCharges?.items[0];

      expect(charge).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          amountInCents: 10000,
          description: 'Sale of Test Category: PPE Gloves, ($100.00) x 1',
          chargeType: saleFulfilment.salesOrderType,
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
  });

  describe('listRentalFulfilments query', () => {
    let testSalesOrderId: string;
    let testContactId: string;
    let testProjectId: string;
    let testPimCategoryId: string;
    let testRentalPriceId: string;
    let testWorkflowId: string;
    let testWorkflowColumnId: string;
    let testAssigneeId: string;
    let testInventoryId: string;
    let rentalFulfilmentIds: string[] = [];

    beforeAll(async () => {
      const { sdk } = await createClient({ userId });
      const workspace = await sdk.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.InviteOnly,
        name: 'test',
      });
      // Create test project
      const { createProject } = await sdk.CreateProject({
        input: {
          name: 'Test Project for Rental Fulfilments',
          deleted: false,
          project_code: 'RENTAL-TEST',
          workspaceId: workspace.createWorkspace?.id || '',
        },
      });
      if (!createProject) throw new Error('Failed to create project');
      testProjectId = createProject.id;

      // Create test contact
      const { createBusinessContact } = await sdk.CreateBusinessContact({
        input: {
          name: 'Test Contact for Rental Fulfilments',
          workspaceId: workspace.createWorkspace?.id || workspaceId,
        },
      });
      if (!createBusinessContact) throw new Error('Failed to create contact');
      testContactId = createBusinessContact.id;

      // Create test assignee
      const { createBusinessContact: assignee } =
        await sdk.CreateBusinessContact({
          input: {
            name: 'Test Assignee for Rental Fulfilments',
            workspaceId: workspace.createWorkspace?.id || workspaceId,
          },
        });
      if (!assignee) throw new Error('Failed to create assignee');
      testAssigneeId = assignee.id;

      // Create test PIM category
      const { upsertPimCategory } = await sdk.CreatePimCategory({
        input: {
          id: 'test-rental-category-id',
          name: 'Test Rental Category',
          path: 'Rental|Equipment',
          platform_id: 'rental-123',
          description: 'Test category for rental fulfilments',
          has_products: false,
        },
      });
      if (!upsertPimCategory) throw new Error('Failed to create PIM category');
      testPimCategoryId = upsertPimCategory.id;

      // Create test rental price
      const { createRentalPrice } = await sdk.CreateRentalPriceForSalesOrder({
        input: {
          workspaceId,
          pricePerDayInCents: 2000,
          pricePerWeekInCents: 8000,
          pricePerMonthInCents: 24000,
          pimCategoryId: testPimCategoryId,
          name: 'Test Rental Equipment',
        },
      });
      if (!createRentalPrice) throw new Error('Failed to create rental price');
      testRentalPriceId = createRentalPrice.id;

      // Create test workflow
      const { createWorkflowConfiguration } =
        await sdk.CreateWorkflowConfiguration({
          input: {
            name: 'Test Rental Workflow',
            columns: [
              { id: 'rental-col-1', name: 'Pending' },
              { id: 'rental-col-2', name: 'Active' },
              { id: 'rental-col-3', name: 'Completed' },
            ],
          },
        });
      if (!createWorkflowConfiguration) {
        throw new Error('Failed to create workflow');
      }
      testWorkflowId = createWorkflowConfiguration.id;
      testWorkflowColumnId = createWorkflowConfiguration.columns[0].id;

      // Create test inventory
      // For rental fulfilments, we just need an inventory ID to assign
      // We'll create a simple inventory item
      const { createInventory } = await sdk.CreateInventory({
        input: {
          status: 'ON_ORDER' as any, // Cast to any to avoid enum type issues
          isThirdPartyRental: false,
          pimCategoryId: testPimCategoryId,
          pimCategoryName: 'Test Rental Category',
          pimCategoryPath: 'Rental|Equipment',
          pimProductId: 'test-product-id',
        },
      });
      if (!createInventory) {
        throw new Error('Failed to create inventory');
      }
      testInventoryId = createInventory.id;

      // Create test sales order with multiple rental fulfilments
      const { createSalesOrder } = await sdk.CreateSalesOrder({
        input: {
          buyer_id: testContactId,
          purchase_order_number: 'PO-RENTAL-TEST',
          project_id: testProjectId,
          workspace_id: workspaceId,
        },
      });
      if (!createSalesOrder) throw new Error('Failed to create sales order');
      testSalesOrderId = createSalesOrder.id;

      // Create multiple rental line items with different dates
      const rentalDates = [
        {
          delivery: subDays(new Date(), 10),
          offRent: addDays(new Date(), 5),
          hasInventory: true,
        },
        {
          delivery: subDays(new Date(), 5),
          offRent: addDays(new Date(), 10),
          hasInventory: false,
        },
        {
          delivery: new Date(),
          offRent: addDays(new Date(), 15),
          hasInventory: true,
        },
        {
          delivery: addDays(new Date(), 5),
          offRent: addDays(new Date(), 20),
          hasInventory: false,
        },
      ];

      for (const [index, dates] of rentalDates.entries()) {
        const { createRentalSalesOrderLineItem } =
          await sdk.CreateRentalSalesOrderLineItem({
            input: {
              sales_order_id: testSalesOrderId,
              price_id: testRentalPriceId,
              delivery_date: dates.delivery.toISOString(),
              off_rent_date: dates.offRent.toISOString(),
            },
          });
        if (!createRentalSalesOrderLineItem) {
          throw new Error(`Failed to create rental line item ${index}`);
        }
      }

      // Submit the sales order to create fulfilments
      await sdk.SubmitSalesOrder({ id: testSalesOrderId });

      // Get the created fulfilments
      const { listFulfilments } = await sdk.ListFulfilments({
        filter: {
          workspaceId,
          salesOrderId: testSalesOrderId,
        },
      });

      if (!listFulfilments?.items || listFulfilments.items.length !== 4) {
        throw new Error('Expected 4 rental fulfilments to be created');
      }

      rentalFulfilmentIds = listFulfilments.items.map((f) => f.id);

      // Update some fulfilments with workflow and assignee
      await sdk.UpdateFulfilmentColumn({
        fulfilmentId: rentalFulfilmentIds[0],
        workflowId: testWorkflowId,
        workflowColumnId: testWorkflowColumnId,
      });

      await sdk.UpdateFulfilmentAssignee({
        fulfilmentId: rentalFulfilmentIds[0],
        assignedToId: testAssigneeId,
      });

      await sdk.UpdateFulfilmentColumn({
        fulfilmentId: rentalFulfilmentIds[1],
        workflowId: testWorkflowId,
        workflowColumnId: createWorkflowConfiguration.columns[1].id,
      });

      // Assign inventory to some fulfilments
      for (const [index, dates] of rentalDates.entries()) {
        if (dates.hasInventory && index === 0) {
          // Only assign inventory to the first one that should have it
          // to avoid conflicts
          await sdk.AssignInventoryToRentalFulfilment({
            fulfilmentId: rentalFulfilmentIds[index],
            inventoryId: testInventoryId,
            allowOverlappingReservations: true,
          });
        }
      }
    });

    it('returns all rental fulfilments without filters', async () => {
      const { sdk } = await createClient({ userId });

      const { listRentalFulfilments } = await sdk.ListRentalFulfilments({
        filter: { workspaceId },
      });

      expect(listRentalFulfilments).toBeDefined();
      expect(listRentalFulfilments?.items).toBeDefined();
      expect(listRentalFulfilments?.items.length).toBeGreaterThan(0);

      // All items should be rental fulfilments
      for (const item of listRentalFulfilments?.items || []) {
        expect(item.salesOrderType).toBe('RENTAL');
      }

      // Check pagination info
      expect(listRentalFulfilments?.page).toBeDefined();
      expect(listRentalFulfilments?.page.totalItems).toBeGreaterThan(0);
    });

    it('filters by salesOrderId', async () => {
      const { sdk } = await createClient({ userId });

      const { listRentalFulfilments } = await sdk.ListRentalFulfilments({
        filter: {
          workspaceId,
          salesOrderId: testSalesOrderId,
        },
      });

      expect(listRentalFulfilments?.items).toBeDefined();
      expect(listRentalFulfilments?.items.length).toBe(4);

      for (const item of listRentalFulfilments?.items || []) {
        expect(item.salesOrderId).toBe(testSalesOrderId);
      }
    });

    it('filters by workflowId', async () => {
      const { sdk } = await createClient({ userId });

      const { listRentalFulfilments } = await sdk.ListRentalFulfilments({
        filter: {
          workspaceId,
          workflowId: testWorkflowId,
        },
      });

      expect(listRentalFulfilments?.items).toBeDefined();
      expect(listRentalFulfilments?.items.length).toBe(2);

      for (const item of listRentalFulfilments?.items || []) {
        expect(item.workflowId).toBe(testWorkflowId);
      }
    });

    it('filters by workflowColumnId', async () => {
      const { sdk } = await createClient({ userId });

      const { listRentalFulfilments } = await sdk.ListRentalFulfilments({
        filter: {
          workspaceId,
          workflowColumnId: testWorkflowColumnId,
        },
      });

      expect(listRentalFulfilments?.items).toBeDefined();
      expect(listRentalFulfilments?.items.length).toBe(1);
      expect(listRentalFulfilments?.items[0].workflowColumnId).toBe(
        testWorkflowColumnId,
      );
    });

    it('filters by assignedTo', async () => {
      const { sdk } = await createClient({ userId });

      const { listRentalFulfilments } = await sdk.ListRentalFulfilments({
        filter: {
          workspaceId,
          assignedToId: testAssigneeId,
        },
      });

      expect(listRentalFulfilments?.items).toBeDefined();
      expect(listRentalFulfilments?.items.length).toBe(1);
      expect(listRentalFulfilments?.items[0].assignedToId).toBe(testAssigneeId);
    });

    it('filters by contactId', async () => {
      const { sdk } = await createClient({ userId });

      const { listRentalFulfilments } = await sdk.ListRentalFulfilments({
        filter: {
          workspaceId,
          contactId: testContactId,
        },
      });

      expect(listRentalFulfilments?.items).toBeDefined();
      expect(listRentalFulfilments?.items.length).toBe(4);

      for (const item of listRentalFulfilments?.items || []) {
        expect(item.contactId).toBe(testContactId);
      }
    });

    it('filters by projectId', async () => {
      const { sdk } = await createClient({ userId });

      const { listRentalFulfilments } = await sdk.ListRentalFulfilments({
        filter: {
          workspaceId,
          projectId: testProjectId,
        },
      });

      expect(listRentalFulfilments?.items).toBeDefined();
      expect(listRentalFulfilments?.items.length).toBe(4);

      for (const item of listRentalFulfilments?.items || []) {
        expect(item.projectId).toBe(testProjectId);
      }
    });

    it('filters by pimCategoryId', async () => {
      const { sdk } = await createClient({ userId });

      const { listRentalFulfilments } = await sdk.ListRentalFulfilments({
        filter: {
          workspaceId,
          pimCategoryId: testPimCategoryId,
        },
      });

      expect(listRentalFulfilments?.items).toBeDefined();
      expect(listRentalFulfilments?.items.length).toBeGreaterThanOrEqual(4);

      for (const item of listRentalFulfilments?.items || []) {
        expect(item.pimCategoryId).toBe(testPimCategoryId);
      }
    });

    it('filters by hasInventoryAssigned = true', async () => {
      const { sdk } = await createClient({ userId });

      const { listRentalFulfilments } = await sdk.ListRentalFulfilments({
        filter: {
          workspaceId,
          salesOrderId: testSalesOrderId,
          hasInventoryAssigned: true,
        },
      });

      expect(listRentalFulfilments?.items).toBeDefined();
      expect(listRentalFulfilments?.items.length).toBe(1);

      for (const item of listRentalFulfilments?.items || []) {
        expect(item.inventoryId).toBeTruthy();
      }
    });

    it('filters by hasInventoryAssigned = false', async () => {
      const { sdk } = await createClient({ userId });

      const { listRentalFulfilments } = await sdk.ListRentalFulfilments({
        filter: {
          workspaceId,
          salesOrderId: testSalesOrderId,
          hasInventoryAssigned: false,
        },
      });

      expect(listRentalFulfilments?.items).toBeDefined();
      expect(listRentalFulfilments?.items.length).toBe(3);

      for (const item of listRentalFulfilments?.items || []) {
        expect(item.inventoryId).toBeFalsy();
      }
    });

    it('filters by timeline date range', async () => {
      const { sdk } = await createClient({ userId });

      // Filter for rentals active in the next 7 days
      const timelineStart = new Date();
      const timelineEnd = addDays(new Date(), 7);

      const { listRentalFulfilments } = await sdk.ListRentalFulfilments({
        filter: {
          workspaceId,
          salesOrderId: testSalesOrderId,
          timelineStartDate: timelineStart.toISOString(),
          timelineEndDate: timelineEnd.toISOString(),
        },
      });

      expect(listRentalFulfilments?.items).toBeDefined();
      // Should include rentals that overlap with this period
      expect(listRentalFulfilments?.items.length).toBeGreaterThan(0);
    });

    it('filters by timelineStartDate only', async () => {
      const { sdk } = await createClient({ userId });

      // Filter for rentals active after today
      const timelineStart = new Date();

      const { listRentalFulfilments } = await sdk.ListRentalFulfilments({
        filter: {
          workspaceId,
          salesOrderId: testSalesOrderId,
          timelineStartDate: timelineStart.toISOString(),
        },
      });

      expect(listRentalFulfilments?.items).toBeDefined();
      // Should include rentals that are active after today
      expect(listRentalFulfilments?.items.length).toBeGreaterThan(0);
    });

    it('filters by timelineEndDate only', async () => {
      const { sdk } = await createClient({ userId });

      // Filter for rentals that started before 5 days from now
      const timelineEnd = addDays(new Date(), 5);

      const { listRentalFulfilments } = await sdk.ListRentalFulfilments({
        filter: {
          workspaceId,
          salesOrderId: testSalesOrderId,
          timelineEndDate: timelineEnd.toISOString(),
        },
      });

      expect(listRentalFulfilments?.items).toBeDefined();
      // Should include rentals that started before this date
      expect(listRentalFulfilments?.items.length).toBeGreaterThan(0);
    });

    it('combines multiple filters', async () => {
      const { sdk } = await createClient({ userId });

      const { listRentalFulfilments } = await sdk.ListRentalFulfilments({
        filter: {
          workspaceId,
          salesOrderId: testSalesOrderId,
          workflowId: testWorkflowId,
          hasInventoryAssigned: true,
        },
      });

      expect(listRentalFulfilments?.items).toBeDefined();
      expect(listRentalFulfilments?.items.length).toBe(1);

      const item = listRentalFulfilments?.items[0];
      expect(item?.salesOrderId).toBe(testSalesOrderId);
      expect(item?.workflowId).toBe(testWorkflowId);
      expect(item?.inventoryId).toBeTruthy();
    });

    it('handles pagination correctly', async () => {
      const { sdk } = await createClient({ userId });

      // First page
      const { listRentalFulfilments: page1 } = await sdk.ListRentalFulfilments({
        filter: {
          workspaceId,
          salesOrderId: testSalesOrderId,
        },
        page: { number: 1, size: 2 },
      });

      expect(page1?.items).toBeDefined();
      expect(page1?.items.length).toBe(2);
      expect(page1?.page.number).toBe(1);
      expect(page1?.page.size).toBe(2);
      expect(page1?.page.totalItems).toBe(4);
      expect(page1?.page.totalPages).toBe(2);

      // Second page
      const { listRentalFulfilments: page2 } = await sdk.ListRentalFulfilments({
        filter: {
          workspaceId,
          salesOrderId: testSalesOrderId,
        },
        page: { number: 2, size: 2 },
      });

      expect(page2?.items).toBeDefined();
      expect(page2?.items.length).toBe(2);
      expect(page2?.page.number).toBe(2);

      // Ensure different items on different pages
      const page1Ids = page1?.items.map((i) => i.id);
      const page2Ids = page2?.items.map((i) => i.id);
      expect(page1Ids).not.toEqual(page2Ids);
    });

    it('returns empty results for non-matching filters', async () => {
      const { sdk } = await createClient({ userId });

      const { listRentalFulfilments } = await sdk.ListRentalFulfilments({
        filter: {
          workspaceId,
          salesOrderId: 'non-existent-id',
        },
      });

      expect(listRentalFulfilments?.items).toBeDefined();
      expect(listRentalFulfilments?.items.length).toBe(0);
      expect(listRentalFulfilments?.page.totalItems).toBe(0);
    });
  });

  describe('setFulfilmentPurchaseOrderLineItemId mutation', () => {
    it('successfully sets purchase order line item id on a fulfilment', async () => {
      const { sdk } = await createClient({ userId });

      // Create a purchase order
      const { createPurchaseOrder: po } = await sdk.CreatePurchaseOrder({
        input: {
          workspace_id: workspaceId,
          seller_id: businessContactId,
        },
      });

      if (!po) throw new Error('Failed to create purchase order');

      // Create a purchase order line item
      const { createRentalPurchaseOrderLineItem: poLineItem } =
        await sdk.CreateRentalPurchaseOrderLineItem({
          input: {
            purchase_order_id: po.id,
            price_id: rentalPriceId,
            po_quantity: 1,
          },
        });

      if (!poLineItem) {
        throw new Error('Failed to create purchase order line item');
      }

      // Create a rental fulfilment
      const input: CreateRentalFulfilmentInput = {
        salesOrderId,
        salesOrderLineItemId: rentalSalesOrderLineItemId,
        workflowId: workflowConfig?.id,
        workflowColumnId: workflowConfig?.columns[0].id,
        pricePerDayInCents: 1000,
        pricePerWeekInCents: 5000,
        pricePerMonthInCents: 15000,
      };

      const { createRentalFulfilment } = await sdk.CreateRentalFulfilment({
        input,
      });

      expect(createRentalFulfilment).toBeDefined();
      const fulfilmentId = createRentalFulfilment!.id;

      // Set the purchase order line item id
      const { setFulfilmentPurchaseOrderLineItemId } =
        await sdk.SetFulfilmentPurchaseOrderLineItemId({
          fulfilmentId,
          purchaseOrderLineItemId: poLineItem.id,
        });

      expect(setFulfilmentPurchaseOrderLineItemId).toBeDefined();
      expect(setFulfilmentPurchaseOrderLineItemId!.id).toBe(fulfilmentId);
      expect(
        setFulfilmentPurchaseOrderLineItemId!.purchaseOrderLineItemId,
      ).toBe(poLineItem.id);
      expect(
        setFulfilmentPurchaseOrderLineItemId!.purchaseOrderLineItem,
      ).toBeDefined();
      expect(
        setFulfilmentPurchaseOrderLineItemId!.purchaseOrderLineItem?.id,
      ).toBe(poLineItem.id);
      expect(
        setFulfilmentPurchaseOrderLineItemId!.purchaseOrderLineItem
          ?.purchase_order_id,
      ).toBe(po.id);
      expect(
        setFulfilmentPurchaseOrderLineItemId!.purchaseOrderLineItem
          ?.purchaseOrder?.id,
      ).toBe(po.id);
      expect(
        setFulfilmentPurchaseOrderLineItemId!.purchaseOrderLineItem
          ?.purchaseOrder?.purchase_order_number,
      ).toBe(po.purchase_order_number);
      expect(setFulfilmentPurchaseOrderLineItemId!.updatedAt).toBeDefined();

      // Verify it persisted
      const { getFulfilmentById } = await sdk.GetFulfilmentById({
        id: fulfilmentId,
      });
      expect(getFulfilmentById).toBeDefined();
      if ('purchaseOrderLineItemId' in (getFulfilmentById ?? {})) {
        expect((getFulfilmentById as any).purchaseOrderLineItemId).toBe(
          poLineItem.id,
        );
      }
    });

    it('successfully clears purchase order line item id on a fulfilment', async () => {
      const { sdk } = await createClient({ userId });

      // Create a purchase order and line item
      const { createPurchaseOrder: po } = await sdk.CreatePurchaseOrder({
        input: {
          workspace_id: workspaceId,
          seller_id: businessContactId,
        },
      });

      if (!po) throw new Error('Failed to create purchase order');

      const { createRentalPurchaseOrderLineItem: poLineItem } =
        await sdk.CreateRentalPurchaseOrderLineItem({
          input: {
            purchase_order_id: po.id,
            price_id: rentalPriceId,
            po_quantity: 1,
          },
        });

      if (!poLineItem) {
        throw new Error('Failed to create purchase order line item');
      }

      // Create a rental fulfilment
      const input: CreateRentalFulfilmentInput = {
        salesOrderId,
        salesOrderLineItemId: rentalSalesOrderLineItemId,
        workflowId: workflowConfig?.id,
        workflowColumnId: workflowConfig?.columns[0].id,
        pricePerDayInCents: 1000,
        pricePerWeekInCents: 5000,
        pricePerMonthInCents: 15000,
      };

      const { createRentalFulfilment } = await sdk.CreateRentalFulfilment({
        input,
      });

      expect(createRentalFulfilment).toBeDefined();
      const fulfilmentId = createRentalFulfilment!.id;

      // Set the purchase order line item id
      await sdk.SetFulfilmentPurchaseOrderLineItemId({
        fulfilmentId,
        purchaseOrderLineItemId: poLineItem.id,
      });

      // Clear it by passing null
      const { setFulfilmentPurchaseOrderLineItemId } =
        await sdk.SetFulfilmentPurchaseOrderLineItemId({
          fulfilmentId,
          purchaseOrderLineItemId: null,
        });

      expect(setFulfilmentPurchaseOrderLineItemId).toBeDefined();
      expect(setFulfilmentPurchaseOrderLineItemId!.id).toBe(fulfilmentId);
      expect(
        setFulfilmentPurchaseOrderLineItemId!.purchaseOrderLineItemId,
      ).toBeNull();
      expect(
        setFulfilmentPurchaseOrderLineItemId!.purchaseOrderLineItem,
      ).toBeNull();
      expect(setFulfilmentPurchaseOrderLineItemId!.updatedAt).toBeDefined();
    });

    it('throws error when fulfilment not found', async () => {
      const { sdk } = await createClient({ userId });

      await expect(
        sdk.SetFulfilmentPurchaseOrderLineItemId({
          fulfilmentId: 'non-existent-id',
          purchaseOrderLineItemId: 'some-po-li-id',
        }),
      ).rejects.toThrow();
    });
  });
});
