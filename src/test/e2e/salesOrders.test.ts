import {
  CreateRentalSalesOrderLineItemInput,
  WorkspaceAccessType,
} from './generated/graphql';
import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';

/* GraphQL operations for codegen */
gql`
  mutation CreateProjectForSalesOrder($input: ProjectInput) {
    createProject(input: $input) {
      id
      name
      project_code
      description
      deleted
    }
  }
`;

gql`
  mutation CreateSalesOrder($input: SalesOrderInput) {
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
    }
  }
`;

gql`
  query ListSalesOrders($workspaceId: String!, $limit: Int, $offset: Int) {
    listSalesOrders(workspaceId: $workspaceId, limit: $limit, offset: $offset) {
      items {
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
      }
      total
      limit
      offset
    }
  }
`;

gql`
  mutation CreateRentalSalesOrderLineItem(
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
    }
  }
`;

gql`
  mutation CreateSaleSalesOrderLineItem(
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
    }
  }
`;

gql`
  mutation SoftDeleteSalesOrderLineItem($id: String) {
    softDeleteSalesOrderLineItem(id: $id) {
      ... on RentalSalesOrderLineItem {
        id
        deleted_at
        sales_order_id
      }
      ... on SaleSalesOrderLineItem {
        id
        deleted_at
        sales_order_id
      }
    }
  }
`;

gql`
  query GetSalesOrderLineItemById($id: String) {
    getSalesOrderLineItemById(id: $id) {
      ... on RentalSalesOrderLineItem {
        id
        deleted_at
        sales_order_id
        deliveryNotes
      }
      ... on SaleSalesOrderLineItem {
        id
        deleted_at
        sales_order_id
        deliveryNotes
      }
    }
  }
`;

gql`
  query GetSalesOrderById($id: String) {
    getSalesOrderById(id: $id) {
      id
      line_items {
        ... on RentalSalesOrderLineItem {
          id
          deleted_at
          deliveryNotes
        }
        ... on SaleSalesOrderLineItem {
          id
          deleted_at
          deliveryNotes
        }
      }
    }
  }
`;

gql`
  query GetSalesOrderByIdWithAllFields($id: String) {
    getSalesOrderById(id: $id) {
      id
      status
      project_id
      buyer_id
      purchase_order_number
      company_id
      created_at
      updated_at
      updated_by
      line_items {
        ... on RentalSalesOrderLineItem {
          id
          deleted_at
          deliveryNotes
        }
        ... on SaleSalesOrderLineItem {
          id
          deleted_at
          deliveryNotes
        }
      }
    }
  }
`;

gql`
  query GetSalesOrderByIdWithPricing($id: String) {
    getSalesOrderById(id: $id) {
      id
      pricing {
        sub_total_in_cents
        total_in_cents
      }
    }
  }
`;

gql`
  mutation SubmitSalesOrder($id: ID!) {
    submitSalesOrder(id: $id) {
      id
      status
    }
  }
`;

gql`
  mutation UpdateSalesOrder($input: UpdateSalesOrderInput!) {
    updateSalesOrder(input: $input) {
      id
      project_id
      buyer_id
      purchase_order_number
      updated_at
      updated_by
    }
  }
`;

gql`
  query ListFulfilmentsForSalesOrder(
    $filter: ListFulfilmentsFilter!
    $page: ListFulfilmentsPage
  ) {
    listFulfilments(filter: $filter, page: $page) {
      items {
        ... on FulfilmentBase {
          id
          salesOrderId
          salesOrderLineItemId
          salesOrderType
          workflowId
          workflowColumnId
          assignedToId
          createdAt
          contactId
          projectId
          purchaseOrderNumber
        }
        ... on RentalFulfilment {
          rentalStartDate
          rentalEndDate
          expectedRentalEndDate
        }
      }
    }
  }
`;

gql`
  mutation CreateRentalPriceForSalesOrder($input: CreateRentalPriceInput!) {
    createRentalPrice(input: $input) {
      id
      name
      pimCategoryName
      pricePerDayInCents
      pricePerWeekInCents
      pricePerMonthInCents
    }
  }
`;

gql`
  mutation CreateSalePriceForSalesOrder($input: CreateSalePriceInput!) {
    createSalePrice(input: $input) {
      id
      name
      pimCategoryName
      unitCostInCents
    }
  }
`;

gql`
  mutation CreatePimCategory($input: UpsertPimCategoryInput!) {
    upsertPimCategory(input: $input) {
      id
    }
  }
`;

const { createClient } = createTestEnvironment();

it('creates a sales order and lists it', async () => {
  const { sdk, user } = await createClient();

  // Create a workspace
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'Test Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');

  // Create a project to use as project_id
  const projectInput = {
    name: 'SalesOrder Project',
    project_code: 'SO-001',
    description: 'Project for sales order test',
    deleted: false,
    workspaceId: createWorkspace.id,
  };
  const { createProject } = await sdk.CreateProjectForSalesOrder({
    input: projectInput,
  });
  if (!createProject) throw new Error('Project was not created');

  // Use the test user as buyer_id
  const buyerId = user.id || 'test-user-id';

  // Create a sales order
  const salesOrderInput = {
    workspace_id: createWorkspace.id,
    project_id: createProject.id,
    buyer_id: buyerId,
    purchase_order_number: 'PO-12345',
  };
  const { createSalesOrder } = await sdk.CreateSalesOrder({
    input: salesOrderInput,
  });
  if (!createSalesOrder) throw new Error('Sales order was not created');
  expect(createSalesOrder).toMatchObject({
    project_id: createProject.id,
    buyer_id: buyerId,
    purchase_order_number: 'PO-12345',
    sales_order_number: expect.any(String),
    id: expect.any(String),
    company_id: expect.any(String),
    created_at: expect.any(String),
    updated_at: expect.any(String),
    updated_by: user.id,
    status: 'DRAFT', // Default status
  });

  // List sales orders and verify the new order is present
  const { listSalesOrders } = await sdk.ListSalesOrders({
    workspaceId: createWorkspace.id,
    limit: 10,
    offset: 0,
  });
  if (!listSalesOrders) throw new Error('Could not list sales orders');
  if (listSalesOrders.items.length === 0) {
    // Print debug info if the test fails
    console.error(
      'No sales orders returned:',
      JSON.stringify(listSalesOrders, null, 2),
    );
  }
  expect(listSalesOrders.items.length).toBeGreaterThan(0);
  const found = listSalesOrders.items.find((o) => o.id === createSalesOrder.id);
  expect(found).toBeDefined();
  expect(found).toMatchObject({
    project_id: createProject.id,
    buyer_id: buyerId,
    purchase_order_number: 'PO-12345',
    updated_by: user.id,
  });
});

it('soft deletes a sales order and verifies it is hidden from queries', async () => {
  const { sdk, user } = await createClient();

  // Create a workspace
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'SoftDelete SO Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');

  // Create a project
  const projectInput = {
    name: 'SoftDelete SO Project',
    project_code: 'SOFTDEL-SO-001',
    description: 'Project for soft delete sales order test',
    deleted: false,
    workspaceId: createWorkspace.id,
  };
  const { createProject } = await sdk.CreateProjectForSalesOrder({
    input: projectInput,
  });
  if (!createProject) throw new Error('Project was not created');

  // Create a sales order
  const buyerId = user.id || 'test-user-id';
  const salesOrderInput = {
    workspace_id: createWorkspace.id,
    project_id: createProject.id,
    buyer_id: buyerId,
    purchase_order_number: 'PO-SOFTDEL-SO',
  };
  const { createSalesOrder } = await sdk.CreateSalesOrder({
    input: salesOrderInput,
  });
  if (!createSalesOrder) throw new Error('Sales order was not created');
  const salesOrderId = createSalesOrder.id;

  // Create a line item to verify it's also hidden when the order is deleted
  const lineItemInput = {
    sales_order_id: salesOrderId,
    so_quantity: 1,
  };
  const { createRentalSalesOrderLineItem } =
    await sdk.CreateRentalSalesOrderLineItem({
      input: lineItemInput,
    });
  if (!createRentalSalesOrderLineItem) {
    throw new Error('Line item was not created');
  }

  // Verify the sales order exists before deletion
  const { getSalesOrderById: beforeDelete } = await sdk.GetSalesOrderById({
    id: salesOrderId,
  });
  expect(beforeDelete).toBeDefined();
  expect(beforeDelete?.id).toBe(salesOrderId);
  gql`
    mutation SoftDeleteSalesOrder($id: String) {
      softDeleteSalesOrder(id: $id) {
        id
        deleted_at
        status
      }
    }
  `;

  // Soft delete the sales order
  const { softDeleteSalesOrder } = await sdk.SoftDeleteSalesOrder({
    id: salesOrderId,
  });

  expect(softDeleteSalesOrder).toBeDefined();
  expect(softDeleteSalesOrder?.id).toBe(salesOrderId);
  expect(softDeleteSalesOrder?.deleted_at).toBeDefined();

  // The sales order should not appear in list queries
  const { listSalesOrders } = await sdk.ListSalesOrders({
    workspaceId: createWorkspace.id,
    limit: 10,
    offset: 0,
  });
  if (!listSalesOrders) throw new Error('Could not list sales orders');
  const found = listSalesOrders.items.find((o) => o.id === salesOrderId);
  expect(found).toBeUndefined();

  // getSalesOrderById should return null for the soft-deleted order
  const { getSalesOrderById: afterDelete } = await sdk.GetSalesOrderById({
    id: salesOrderId,
  });
  expect(afterDelete).toBeNull();
});

it('soft deletes a sales order line item and verifies it is hidden from queries', async () => {
  const { sdk, user } = await createClient();

  // Create a workspace
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'SoftDelete LineItem Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');

  // Create a project
  const projectInput = {
    name: 'SoftDelete Project',
    project_code: 'SOFTDEL-001',
    description: 'Project for soft delete test',
    deleted: false,
    workspaceId: createWorkspace.id,
  };
  const { createProject } = await sdk.CreateProjectForSalesOrder({
    input: projectInput,
  });
  if (!createProject) throw new Error('Project was not created');

  // Create a sales order
  const buyerId = user.id || 'test-user-id';
  const salesOrderInput = {
    workspace_id: createWorkspace.id,
    project_id: createProject.id,
    buyer_id: buyerId,
    purchase_order_number: 'PO-SOFTDEL',
  };
  const { createSalesOrder } = await sdk.CreateSalesOrder({
    input: salesOrderInput,
  });
  if (!createSalesOrder) throw new Error('Sales order was not created');

  // Create a rental sales order line item
  const lineItemInput = {
    sales_order_id: createSalesOrder.id,
    so_quantity: 1,
    // lineitem_type is set by the backend, do not include here
  };
  const { createRentalSalesOrderLineItem } =
    await sdk.CreateRentalSalesOrderLineItem({
      input: lineItemInput,
    });
  if (!createRentalSalesOrderLineItem) {
    throw new Error('Line item was not created');
  }
  const lineItemId = createRentalSalesOrderLineItem.id;

  // Soft delete the line item
  const { softDeleteSalesOrderLineItem } =
    await sdk.SoftDeleteSalesOrderLineItem({
      id: lineItemId,
    });
  expect(softDeleteSalesOrderLineItem).toBeDefined();
  if (!softDeleteSalesOrderLineItem) {
    throw new Error('Soft delete mutation returned null');
  }
  expect(softDeleteSalesOrderLineItem.id).toBe(lineItemId);
  expect(softDeleteSalesOrderLineItem.deleted_at).toBeDefined();

  // The line item should not appear in the parent sales order's line_items
  const { getSalesOrderById } = await sdk.GetSalesOrderById({
    id: createSalesOrder.id,
  });
  expect(getSalesOrderById).toBeDefined();
  if (!getSalesOrderById) throw new Error('getSalesOrderById returned null');
  const found = (getSalesOrderById.line_items ?? []).find(
    (li: any) => li.id === lineItemId,
  );
  expect(found).toBeUndefined();

  // getSalesOrderLineItemById should return null for the soft-deleted item
  const { getSalesOrderLineItemById } = await sdk.GetSalesOrderLineItemById({
    id: lineItemId,
  });
  expect(getSalesOrderLineItemById).toBeNull();
});

it('returns correct pricing for a sales order with a rental line item', async () => {
  const { sdk, user } = await createClient();

  // Create a workspace
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'Pricing Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');

  // Create a project to use as project_id
  const projectInput = {
    name: 'Pricing Project',
    project_code: 'PRICING-001',
    description: 'Project for pricing test',
    deleted: false,
    workspaceId: createWorkspace.id,
  };
  const { createProject } = await sdk.CreateProjectForSalesOrder({
    input: projectInput,
  });
  if (!createProject) throw new Error('Project was not created');

  // Use the test user as buyer_id
  const buyerId = user.id || 'test-user-id';

  // Create a sales order
  const salesOrderInput = {
    workspace_id: createWorkspace.id,
    project_id: createProject.id,
    buyer_id: buyerId,
    purchase_order_number: 'PO-PRICING',
  };
  const { createSalesOrder } = await sdk.CreateSalesOrder({
    input: salesOrderInput,
  });
  if (!createSalesOrder) throw new Error('Sales order was not created');

  // Create a rental sales order line item
  const lineItemInput = {
    sales_order_id: createSalesOrder.id,
    so_quantity: 1,
  };
  const { createRentalSalesOrderLineItem } =
    await sdk.CreateRentalSalesOrderLineItem({
      input: lineItemInput,
    });
  if (!createRentalSalesOrderLineItem) {
    throw new Error('Line item was not created');
  }

  // Query the sales order by ID, including the pricing field
  const { getSalesOrderById } = await sdk.GetSalesOrderByIdWithPricing({
    id: createSalesOrder.id,
  });
  expect(getSalesOrderById).toBeDefined();
  if (!getSalesOrderById) throw new Error('getSalesOrderById returned null');
  expect(getSalesOrderById.pricing).toBeDefined();
  expect(typeof getSalesOrderById.pricing?.sub_total_in_cents).toBe('number');
  expect(typeof getSalesOrderById.pricing?.total_in_cents).toBe('number');
});

it('isolates sales orders between tenants', async () => {
  // Create two clients with different users/tenants
  const { sdk: sdkA, user: userA } = await createClient({
    userId: 'userA',
    companyId: 'companyA',
  });
  const { sdk: sdkB } = await createClient({
    userId: 'userB',
    companyId: 'companyB',
  });

  // Create workspace for tenant A
  const { createWorkspace: workspaceA } = await sdkA.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'TenantA Workspace',
  });
  if (!workspaceA) throw new Error('Workspace A was not created');

  // Create a project for tenant A
  const projectInputA = {
    name: 'TenantA Project',
    project_code: 'TA-001',
    description: 'Project for tenant A',
    deleted: false,
    workspaceId: workspaceA.id,
  };
  const { createProject: projectA } = await sdkA.CreateProjectForSalesOrder({
    input: projectInputA,
  });
  if (!projectA) throw new Error('Project A was not created');

  // Tenant A creates a sales order
  const salesOrderInputA = {
    workspace_id: workspaceA.id,
    project_id: projectA.id,
    buyer_id: userA.id,
    purchase_order_number: 'PO-A',
  };
  const { createSalesOrder: salesOrderA } = await sdkA.CreateSalesOrder({
    input: salesOrderInputA,
  });
  if (!salesOrderA) throw new Error('Sales order A was not created');

  // Create workspace for tenant B (needed for listing)
  const { createWorkspace: workspaceB } = await sdkB.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'TenantB Workspace',
  });
  if (!workspaceB) throw new Error('Workspace B was not created');

  // Tenant B lists sales orders and should NOT see tenant A's sales order
  const { listSalesOrders: listB } = await sdkB.ListSalesOrders({
    workspaceId: workspaceB.id,
    limit: 10,
    offset: 0,
  });
  if (!listB) throw new Error('Tenant B could not list sales orders');
  const foundInB = listB.items.find((o: any) => o.id === salesOrderA.id);
  expect(foundInB).toBeUndefined();

  // Tenant A lists sales orders and SHOULD see their own sales order
  const { listSalesOrders: listA } = await sdkA.ListSalesOrders({
    workspaceId: workspaceA.id,
    limit: 10,
    offset: 0,
  });
  if (!listA) throw new Error('Tenant A could not list sales orders');
  const foundInA = listA.items.find((o: any) => o.id === salesOrderA.id);
  expect(foundInA).toBeDefined();
  expect(foundInA).toMatchObject({
    project_id: projectA.id,
    buyer_id: userA.id,
    purchase_order_number: 'PO-A',
    updated_by: userA.id,
  });
});

it('creates and updates sales order line items with deliveryNotes', async () => {
  const { sdk, user } = await createClient();

  // Create a workspace
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'DeliveryNotes Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');

  // Create a project
  const projectInput = {
    name: 'DeliveryNotes Project',
    project_code: 'DN-001',
    description: 'Project for delivery notes test',
    deleted: false,
    workspaceId: createWorkspace.id,
  };
  const { createProject } = await sdk.CreateProjectForSalesOrder({
    input: projectInput,
  });
  if (!createProject) throw new Error('Project was not created');

  // Create a sales order
  const buyerId = user.id || 'test-user-id';
  const salesOrderInput = {
    workspace_id: createWorkspace.id,
    project_id: createProject.id,
    buyer_id: buyerId,
    purchase_order_number: 'PO-DELIVERY-NOTES',
  };
  const { createSalesOrder } = await sdk.CreateSalesOrder({
    input: salesOrderInput,
  });
  if (!createSalesOrder) throw new Error('Sales order was not created');

  // Create a rental sales order line item with deliveryNotes
  const rentalLineItemInput = {
    sales_order_id: createSalesOrder.id,
    so_quantity: 1,
    deliveryNotes:
      'Please deliver to the back entrance. Contact John at 555-1234.',
  };
  const { createRentalSalesOrderLineItem } =
    await sdk.CreateRentalSalesOrderLineItem({
      input: rentalLineItemInput,
    });
  if (!createRentalSalesOrderLineItem) {
    throw new Error('Rental line item was not created');
  }
  expect(createRentalSalesOrderLineItem.deliveryNotes).toBe(
    'Please deliver to the back entrance. Contact John at 555-1234.',
  );

  // Create a sale sales order line item with deliveryNotes
  const saleLineItemInput = {
    sales_order_id: createSalesOrder.id,
    so_quantity: 5,
    deliveryNotes: 'Fragile items. Handle with care.',
  };
  const { createSaleSalesOrderLineItem } =
    await sdk.CreateSaleSalesOrderLineItem({
      input: saleLineItemInput,
    });
  if (!createSaleSalesOrderLineItem) {
    throw new Error('Sale line item was not created');
  }
  expect(createSaleSalesOrderLineItem.deliveryNotes).toBe(
    'Fragile items. Handle with care.',
  );

  // Query the sales order and verify deliveryNotes are returned
  const { getSalesOrderById } = await sdk.GetSalesOrderById({
    id: createSalesOrder.id,
  });
  expect(getSalesOrderById).toBeDefined();
  if (!getSalesOrderById) throw new Error('getSalesOrderById returned null');

  const lineItems = getSalesOrderById.line_items ?? [];
  expect(lineItems.length).toBe(2);

  const rentalItem = lineItems.find(
    (item: any) => item.id === createRentalSalesOrderLineItem.id,
  );
  expect(rentalItem).toBeDefined();
  expect(rentalItem?.deliveryNotes).toBe(
    'Please deliver to the back entrance. Contact John at 555-1234.',
  );

  const saleItem = lineItems.find(
    (item: any) => item.id === createSaleSalesOrderLineItem.id,
  );
  expect(saleItem).toBeDefined();
  expect(saleItem?.deliveryNotes).toBe('Fragile items. Handle with care.');

  // Query individual line items and verify deliveryNotes
  const { getSalesOrderLineItemById: getRentalItem } =
    await sdk.GetSalesOrderLineItemById({
      id: createRentalSalesOrderLineItem.id,
    });
  expect(getRentalItem).toBeDefined();
  expect(getRentalItem?.deliveryNotes).toBe(
    'Please deliver to the back entrance. Contact John at 555-1234.',
  );

  const { getSalesOrderLineItemById: getSaleItem } =
    await sdk.GetSalesOrderLineItemById({
      id: createSaleSalesOrderLineItem.id,
    });
  expect(getSaleItem).toBeDefined();
  expect(getSaleItem?.deliveryNotes).toBe('Fragile items. Handle with care.');
});

/**
 * Test: creates a sales order, adds items, submits it, and verifies fulfilments match line items
 */
it('creates and submits a sales order, fulfilments match line items', async () => {
  const { sdk, user } = await createClient();

  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'SO Fulfilment Workspace',
  });

  if (!createWorkspace) throw new Error('Workspace was not created');

  const workspaceId = createWorkspace.id;

  // 1. Create a project
  const projectInput = {
    name: 'SubmitSO Project',
    project_code: 'SUBMITSO-001',
    description: 'Project for submit sales order test',
    deleted: false,
    workspaceId,
  };
  const { createProject } = await sdk.CreateProjectForSalesOrder({
    input: projectInput,
  });
  if (!createProject) throw new Error('Project was not created');

  // 2. Create a sales order
  const buyerId = user.id || 'test-user-id';
  const salesOrderInput = {
    workspace_id: workspaceId,
    project_id: createProject.id,
    buyer_id: buyerId,
    purchase_order_number: 'PO-SUBMITSO',
  };
  const { createSalesOrder } = await sdk.CreateSalesOrder({
    input: salesOrderInput,
  });
  if (!createSalesOrder) throw new Error('Sales order was not created');

  expect(createSalesOrder).toMatchObject({
    project_id: createProject.id,
    buyer_id: buyerId,
    purchase_order_number: 'PO-SUBMITSO',
    id: expect.any(String),
    company_id: expect.any(String),
    created_at: expect.any(String),
    updated_at: expect.any(String),
    updated_by: user.id,
    status: 'DRAFT', // Default status
  });

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

  // create a price
  const { createRentalPrice: rentalPrice } =
    await sdk.CreateRentalPriceForSalesOrder({
      input: {
        workspaceId,
        pricePerDayInCents: 1000,
        pricePerWeekInCents: 5000,
        pricePerMonthInCents: 15000,
        pimCategoryId: pimCategory.id,
      },
    });

  if (!rentalPrice) throw new Error('Rental price was not created');

  // 3. Add two rental line items
  const lineItemInputs: CreateRentalSalesOrderLineItemInput[] = [
    {
      sales_order_id: createSalesOrder.id,
      so_quantity: 1,
      price_id: rentalPrice.id,
      delivery_date: new Date().toISOString(),
      off_rent_date: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
    {
      sales_order_id: createSalesOrder.id,
      so_quantity: 1,
      price_id: rentalPrice.id,
      delivery_date: new Date().toISOString(),
      off_rent_date: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
  ];
  const lineItemIds: string[] = [];
  for (const input of lineItemInputs) {
    const { createRentalSalesOrderLineItem } =
      await sdk.CreateRentalSalesOrderLineItem({ input: { ...input } });
    if (!createRentalSalesOrderLineItem) {
      throw new Error('Line item was not created');
    }
    lineItemIds.push(createRentalSalesOrderLineItem.id);
  }

  const { submitSalesOrder } = await sdk.SubmitSalesOrder({
    id: createSalesOrder.id,
  });

  if (!submitSalesOrder) throw new Error('Sales order was not submitted');

  expect(submitSalesOrder).toBeDefined();
  expect(submitSalesOrder.status).toBe('SUBMITTED');

  // 5. List fulfilments for this sales order (use correct paging fields)
  const { listFulfilments } = await sdk.ListFulfilmentsForSalesOrder({
    filter: {
      workspaceId,
      salesOrderId: createSalesOrder.id,
    },
    page: { number: 1, size: 10 },
  });
  if (!listFulfilments) throw new Error('Could not list fulfilments');

  for (const fulfilment of listFulfilments.items) {
    expect(fulfilment).toBeDefined();
    expect(fulfilment.id).toBeDefined();
    expect(fulfilment.projectId).toBe(createSalesOrder.project_id);
    expect(fulfilment.salesOrderId).toBe(createSalesOrder.id);
    expect(fulfilment.salesOrderType).toBe('RENTAL');

    if (fulfilment.__typename === 'RentalFulfilment') {
      // these should match the corresponding sales order line item delivery_date and off_rent_date
      const idx = lineItemIds.findIndex(
        (id) => id === fulfilment.salesOrderLineItemId,
      );
      expect(idx).not.toBe(-1);
      const lineItem = lineItemInputs[idx];
      expect(fulfilment.rentalStartDate).toBe(lineItem.delivery_date);
      expect(fulfilment.rentalEndDate).toBeDefined();
      expect(fulfilment.expectedRentalEndDate).toBe(lineItem.off_rent_date);
    }
  }

  // 6. Assert number of fulfilments matches number of line items
  const fulfilmentLineItemIds = listFulfilments.items.map(
    (f) => f.salesOrderLineItemId,
  );
  expect(fulfilmentLineItemIds.length).toBe(lineItemIds.length);
  // Each line item should have a fulfilment
  for (const id of lineItemIds) {
    expect(fulfilmentLineItemIds).toContain(id);
  }
});

it('updates a sales order with new buyer, PO number, and project', async () => {
  const { sdk, user } = await createClient();

  // Create a workspace
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'Update SO Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');

  // Create two projects - one for initial creation, one for update
  const projectInput1 = {
    name: 'Initial Project',
    project_code: 'INIT-001',
    description: 'Initial project for sales order',
    deleted: false,
    workspaceId: createWorkspace.id,
  };
  const { createProject: project1 } = await sdk.CreateProjectForSalesOrder({
    input: projectInput1,
  });
  if (!project1) throw new Error('Project 1 was not created');

  const projectInput2 = {
    name: 'Updated Project',
    project_code: 'UPDATE-001',
    description: 'Updated project for sales order',
    deleted: false,
    workspaceId: createWorkspace.id,
  };
  const { createProject: project2 } = await sdk.CreateProjectForSalesOrder({
    input: projectInput2,
  });
  if (!project2) throw new Error('Project 2 was not created');

  // Create initial sales order
  const initialBuyerId = user.id || 'test-user-id';
  const salesOrderInput = {
    workspace_id: createWorkspace.id,
    project_id: project1.id,
    buyer_id: initialBuyerId,
    purchase_order_number: 'PO-INITIAL',
  };
  const { createSalesOrder } = await sdk.CreateSalesOrder({
    input: salesOrderInput,
  });
  if (!createSalesOrder) throw new Error('Sales order was not created');

  const salesOrderId = createSalesOrder.id;
  const initialUpdatedAt = createSalesOrder.updated_at;

  // Update the sales order with new values
  const updateInput = {
    id: salesOrderId,
    project_id: project2.id,
    buyer_id: 'new-buyer-id',
    purchase_order_number: 'PO-UPDATED',
  };
  const { updateSalesOrder } = await sdk.UpdateSalesOrder({
    input: updateInput,
  });

  if (!updateSalesOrder) throw new Error('Sales order was not updated');

  // Verify the update
  expect(updateSalesOrder).toMatchObject({
    id: salesOrderId,
    project_id: project2.id,
    buyer_id: 'new-buyer-id',
    purchase_order_number: 'PO-UPDATED',
    updated_by: user.id,
  });

  // Verify updated_at has changed
  expect(updateSalesOrder.updated_at).not.toBe(initialUpdatedAt);

  // Query the sales order to verify persistence
  const { getSalesOrderById } = await sdk.GetSalesOrderByIdWithAllFields({
    id: salesOrderId,
  });
  expect(getSalesOrderById).toBeDefined();
  if (!getSalesOrderById) throw new Error('getSalesOrderById returned null');

  expect(getSalesOrderById).toMatchObject({
    id: salesOrderId,
    project_id: project2.id,
    buyer_id: 'new-buyer-id',
    purchase_order_number: 'PO-UPDATED',
  });
});

it('updates a sales order with partial fields', async () => {
  const { sdk, user } = await createClient();

  // Create a workspace
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'Partial Update Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');

  // Create a project
  const projectInput = {
    name: 'Partial Update Project',
    project_code: 'PARTIAL-001',
    description: 'Project for partial update test',
    deleted: false,
    workspaceId: createWorkspace.id,
  };
  const { createProject } = await sdk.CreateProjectForSalesOrder({
    input: projectInput,
  });
  if (!createProject) throw new Error('Project was not created');

  // Create initial sales order
  const buyerId = user.id || 'test-user-id';
  const salesOrderInput = {
    workspace_id: createWorkspace.id,
    project_id: createProject.id,
    buyer_id: buyerId,
    purchase_order_number: 'PO-PARTIAL-INITIAL',
  };
  const { createSalesOrder } = await sdk.CreateSalesOrder({
    input: salesOrderInput,
  });
  if (!createSalesOrder) throw new Error('Sales order was not created');

  const salesOrderId = createSalesOrder.id;

  // Update only the PO number
  const updateInput = {
    id: salesOrderId,
    purchase_order_number: 'PO-PARTIAL-UPDATED',
  };
  const { updateSalesOrder } = await sdk.UpdateSalesOrder({
    input: updateInput,
  });

  if (!updateSalesOrder) throw new Error('Sales order was not updated');

  // Verify only PO number changed, other fields remain the same
  expect(updateSalesOrder).toMatchObject({
    id: salesOrderId,
    project_id: createProject.id, // Should remain unchanged
    buyer_id: buyerId, // Should remain unchanged
    purchase_order_number: 'PO-PARTIAL-UPDATED', // Should be updated
    updated_by: user.id,
  });
});

it('prevents updating sales order from different tenant', async () => {
  // Create two clients with different users/tenants
  const { sdk: sdkA, user: userA } = await createClient({
    userId: 'userA',
    companyId: 'companyA',
  });
  const { sdk: sdkB } = await createClient({
    userId: 'userB',
    companyId: 'companyB',
  });

  // Create workspace for tenant A
  const { createWorkspace: workspaceA } = await sdkA.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'TenantA Update Workspace',
  });
  if (!workspaceA) throw new Error('Workspace A was not created');

  // Create a project for tenant A
  const projectInputA = {
    name: 'TenantA Update Project',
    project_code: 'TA-UPDATE-001',
    description: 'Project for tenant A update test',
    deleted: false,
    workspaceId: workspaceA.id,
  };
  const { createProject: projectA } = await sdkA.CreateProjectForSalesOrder({
    input: projectInputA,
  });
  if (!projectA) throw new Error('Project A was not created');

  // Tenant A creates a sales order
  const salesOrderInputA = {
    workspace_id: workspaceA.id,
    project_id: projectA.id,
    buyer_id: userA.id,
    purchase_order_number: 'PO-A-UPDATE',
  };
  const { createSalesOrder: salesOrderA } = await sdkA.CreateSalesOrder({
    input: salesOrderInputA,
  });
  if (!salesOrderA) throw new Error('Sales order A was not created');

  // Tenant B tries to update tenant A's sales order
  const updateInput = {
    id: salesOrderA.id,
    purchase_order_number: 'PO-HACKED',
  };

  // This should fail with an error
  await expect(sdkB.UpdateSalesOrder({ input: updateInput })).rejects.toThrow();
});

it('calculates totalDaysOnRent correctly for rental line items', async () => {
  const { sdk, user } = await createClient();

  // Create a workspace
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'TotalDaysOnRent Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');

  // Create a project
  const projectInput = {
    name: 'TotalDaysOnRent Project',
    project_code: 'TDOR-001',
    description: 'Project for totalDaysOnRent test',
    deleted: false,
    workspaceId: createWorkspace.id,
  };
  const { createProject } = await sdk.CreateProjectForSalesOrder({
    input: projectInput,
  });
  if (!createProject) throw new Error('Project was not created');

  // Create a sales order
  const buyerId = user.id || 'test-user-id';
  const salesOrderInput = {
    workspace_id: createWorkspace.id,
    project_id: createProject.id,
    buyer_id: buyerId,
    purchase_order_number: 'PO-TDOR',
  };
  const { createSalesOrder } = await sdk.CreateSalesOrder({
    input: salesOrderInput,
  });
  if (!createSalesOrder) throw new Error('Sales order was not created');

  // Test case 1: Normal rental period (7 days)
  const deliveryDate = new Date('2025-01-15T10:00:00Z');
  const offRentDate = new Date('2025-01-22T10:00:00Z');

  const rentalLineItem1 = {
    sales_order_id: createSalesOrder.id,
    so_quantity: 1,
    delivery_date: deliveryDate.toISOString(),
    off_rent_date: offRentDate.toISOString(),
  };
  const { createRentalSalesOrderLineItem: lineItem1 } =
    await sdk.CreateRentalSalesOrderLineItem({
      input: rentalLineItem1,
    });
  if (!lineItem1) throw new Error('Line item 1 was not created');

  // Should be 7 days (inclusive of start, exclusive of end)
  expect(lineItem1.totalDaysOnRent).toBe(7);

  // Test case 2: Same day rental (0 days)
  const sameDayLineItem = {
    sales_order_id: createSalesOrder.id,
    so_quantity: 1,
    delivery_date: '2025-01-15T10:00:00Z',
    off_rent_date: '2025-01-15T18:00:00Z',
  };
  const { createRentalSalesOrderLineItem: lineItem2 } =
    await sdk.CreateRentalSalesOrderLineItem({
      input: sameDayLineItem,
    });
  if (!lineItem2) throw new Error('Line item 2 was not created');

  // Should be 0 days for same day rental
  expect(lineItem2.totalDaysOnRent).toBe(0);

  // Test case 3: Longer rental period (30 days)
  const longRentalLineItem = {
    sales_order_id: createSalesOrder.id,
    so_quantity: 1,
    delivery_date: '2025-01-01T00:00:00Z',
    off_rent_date: '2025-01-31T00:00:00Z',
  };
  const { createRentalSalesOrderLineItem: lineItem3 } =
    await sdk.CreateRentalSalesOrderLineItem({
      input: longRentalLineItem,
    });
  if (!lineItem3) throw new Error('Line item 3 was not created');

  // Should be 30 days
  expect(lineItem3.totalDaysOnRent).toBe(30);

  // Test case 4: Missing dates (should return null)
  const noDatesLineItem = {
    sales_order_id: createSalesOrder.id,
    so_quantity: 1,
    // No delivery_date or off_rent_date provided
  };
  const { createRentalSalesOrderLineItem: lineItem4 } =
    await sdk.CreateRentalSalesOrderLineItem({
      input: noDatesLineItem,
    });
  if (!lineItem4) throw new Error('Line item 4 was not created');

  // Should be null when dates are missing
  expect(lineItem4.totalDaysOnRent).toBeNull();

  // Test case 5: Only delivery date provided (should return null)
  const onlyDeliveryDateLineItem = {
    sales_order_id: createSalesOrder.id,
    so_quantity: 1,
    delivery_date: '2025-01-15T10:00:00Z',
    // No off_rent_date provided
  };
  const { createRentalSalesOrderLineItem: lineItem5 } =
    await sdk.CreateRentalSalesOrderLineItem({
      input: onlyDeliveryDateLineItem,
    });
  if (!lineItem5) throw new Error('Line item 5 was not created');

  // Should be null when off_rent_date is missing
  expect(lineItem5.totalDaysOnRent).toBeNull();
});
