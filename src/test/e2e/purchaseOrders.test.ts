import { WorkspaceAccessType } from './generated/graphql';
import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';

/* GraphQL operations for codegen */
gql`
  mutation CreateProjectForPurchaseOrder($input: ProjectInput) {
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
  mutation CreatePersonContact_PurchaseOrder($input: PersonContactInput!) {
    createPersonContact(input: $input) {
      ... on PersonContact {
        id
        name
        email
        workspaceId
        businessId
        contactType
      }
    }
  }
`;

gql`
  mutation CreatePurchaseOrder($input: PurchaseOrderInput) {
    createPurchaseOrder(input: $input) {
      id
      purchase_order_number
      seller_id
      project_id
      company_id
      created_at
      created_by
      updated_at
      updated_by
      status
      line_items {
        ... on RentalPurchaseOrderLineItem {
          id
          po_pim_id
          po_quantity
        }
        ... on SalePurchaseOrderLineItem {
          id
          po_pim_id
          po_quantity
        }
      }
    }
  }
`;

gql`
  query GetPurchaseOrderById($id: String) {
    getPurchaseOrderById(id: $id) {
      id
      purchase_order_number
      seller_id
      project_id
      company_id
      created_at
      created_by
      updated_at
      updated_by
      status
      line_items {
        ... on RentalPurchaseOrderLineItem {
          id
          po_pim_id
          po_quantity
        }
        ... on SalePurchaseOrderLineItem {
          id
          po_pim_id
          po_quantity
        }
      }
    }
  }
`;

gql`
  query ListPurchaseOrders($workspaceId: String!, $limit: Int, $offset: Int) {
    listPurchaseOrders(
      workspaceId: $workspaceId
      limit: $limit
      offset: $offset
    ) {
      items {
        id
        purchase_order_number
        seller_id
        project_id
        company_id
        created_at
        created_by
        updated_at
        updated_by
        status
        line_items {
          ... on RentalPurchaseOrderLineItem {
            id
            po_pim_id
            po_quantity
          }
          ... on SalePurchaseOrderLineItem {
            id
            po_pim_id
            po_quantity
          }
        }
      }
      total
      limit
      offset
    }
  }
`;

const { createClient } = createTestEnvironment();

it('creates a purchase order and lists it', async () => {
  const { sdk, user } = await createClient();

  // Create a workspace
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'Test Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');

  // Create a project to use as project_id
  const projectInput = {
    name: 'PurchaseOrder Project',
    project_code: 'PO-001',
    description: 'Project for purchase order test',
    deleted: false,
    workspaceId: createWorkspace.id,
  };
  const { createProject } = await sdk.CreateProjectForPurchaseOrder({
    input: projectInput,
  });
  if (!createProject) throw new Error('Project was not created');

  // Use the test user as seller_id
  const sellerId = user.id || 'test-user-id';

  // Create a purchase order
  const purchaseOrderInput = {
    workspace_id: createWorkspace.id,
    project_id: createProject.id,
    seller_id: sellerId,
    purchase_order_number: 'PO-12345',
  };
  const { createPurchaseOrder } = await sdk.CreatePurchaseOrder({
    input: purchaseOrderInput,
  });
  if (!createPurchaseOrder) throw new Error('Purchase order was not created');
  expect(createPurchaseOrder).toMatchObject({
    project_id: createProject.id,
    seller_id: sellerId,
    purchase_order_number: 'PO-12345',
    id: expect.any(String),
    company_id: expect.any(String),
    created_at: expect.any(String),
    created_by: user.id,
    updated_at: expect.any(String),
    updated_by: user.id,
    status: 'DRAFT', // Default status
    line_items: [],
  });

  // List purchase orders and verify the new order is present
  const { listPurchaseOrders } = await sdk.ListPurchaseOrders({
    workspaceId: createWorkspace.id,
    limit: 10,
    offset: 0,
  });
  if (!listPurchaseOrders) throw new Error('Could not list purchase orders');
  if (listPurchaseOrders.items.length === 0) {
    // Print debug info if the test fails
    console.error(
      'No purchase orders returned:',
      JSON.stringify(listPurchaseOrders, null, 2),
    );
  }
  expect(listPurchaseOrders.items.length).toBeGreaterThan(0);
  const found = listPurchaseOrders.items.find(
    (o) => o.id === createPurchaseOrder.id,
  );
  expect(found).toBeDefined();
  expect(found).toMatchObject({
    project_id: createProject.id,
    seller_id: sellerId,
    purchase_order_number: 'PO-12345',
    updated_by: user.id,
  });
});

it('isolates purchase orders between tenants', async () => {
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
  const { createProject: projectA } = await sdkA.CreateProjectForPurchaseOrder({
    input: projectInputA,
  });
  if (!projectA) throw new Error('Project A was not created');

  // Tenant A creates a purchase order
  const purchaseOrderInputA = {
    workspace_id: workspaceA.id,
    project_id: projectA.id,
    seller_id: userA.id,
    purchase_order_number: 'PO-A',
  };
  const { createPurchaseOrder: purchaseOrderA } =
    await sdkA.CreatePurchaseOrder({
      input: purchaseOrderInputA,
    });
  if (!purchaseOrderA) throw new Error('Purchase order A was not created');

  // Create workspace for tenant B (needed for listing)
  const { createWorkspace: workspaceB } = await sdkB.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'TenantB Workspace',
  });
  if (!workspaceB) throw new Error('Workspace B was not created');

  // Tenant B lists purchase orders and should NOT see tenant A's purchase order
  const { listPurchaseOrders: listB } = await sdkB.ListPurchaseOrders({
    workspaceId: workspaceB.id,
    limit: 10,
    offset: 0,
  });
  if (!listB) throw new Error('Tenant B could not list purchase orders');
  const foundInB = listB.items.find((o: any) => o.id === purchaseOrderA.id);
  expect(foundInB).toBeUndefined();

  // Tenant A lists purchase orders and SHOULD see their own purchase order
  const { listPurchaseOrders: listA } = await sdkA.ListPurchaseOrders({
    workspaceId: workspaceA.id,
    limit: 10,
    offset: 0,
  });
  if (!listA) throw new Error('Tenant A could not list purchase orders');
  const foundInA = listA.items.find((o: any) => o.id === purchaseOrderA.id);
  expect(foundInA).toBeDefined();
  expect(foundInA).toMatchObject({
    project_id: projectA.id,
    seller_id: userA.id,
    purchase_order_number: 'PO-A',
    updated_by: userA.id,
  });
});

it('creates a purchase order and verifies it can be queried by ID', async () => {
  const { sdk, user } = await createClient();

  // Create a workspace
  const { createWorkspace } = await sdk.UtilCreateWorkspace({
    accessType: WorkspaceAccessType.SameDomain,
    name: 'Query Test Workspace',
  });
  if (!createWorkspace) throw new Error('Workspace was not created');

  // Create a project to use as project_id
  const projectInput = {
    name: 'PurchaseOrder Project',
    project_code: 'PO-001',
    description: 'Project for purchase order test',
    deleted: false,
    workspaceId: createWorkspace.id,
  };
  const { createProject } = await sdk.CreateProjectForPurchaseOrder({
    input: projectInput,
  });
  if (!createProject) throw new Error('Project was not created');

  // Use the test user as seller_id
  const sellerId = user.id || 'test-user-id';

  // Create a purchase order
  const purchaseOrderInput = {
    workspace_id: createWorkspace.id,
    project_id: createProject.id,
    seller_id: sellerId,
    purchase_order_number: 'PO-12345',
  };
  const { createPurchaseOrder } = await sdk.CreatePurchaseOrder({
    input: purchaseOrderInput,
  });
  if (!createPurchaseOrder) throw new Error('Purchase order was not created');
  expect(createPurchaseOrder).toMatchObject({
    project_id: createProject.id,
    seller_id: sellerId,
    purchase_order_number: 'PO-12345',
    id: expect.any(String),
    company_id: expect.any(String),
    created_at: expect.any(String),
    created_by: user.id,
    updated_at: expect.any(String),
    updated_by: user.id,
    status: 'DRAFT',
    line_items: [],
  });

  // Query by ID and verify purchase order details
  const { getPurchaseOrderById } = await sdk.GetPurchaseOrderById({
    id: createPurchaseOrder.id,
  });
  expect(getPurchaseOrderById).toBeDefined();
  expect(getPurchaseOrderById).toMatchObject({
    id: createPurchaseOrder.id,
    project_id: createProject.id,
    seller_id: sellerId,
    purchase_order_number: 'PO-12345',
    company_id: expect.any(String),
    created_at: expect.any(String),
    created_by: user.id,
    updated_at: expect.any(String),
    updated_by: user.id,
    status: 'DRAFT',
    line_items: [],
  });

  // List all purchase orders and verify the new order is present
  const { listPurchaseOrders } = await sdk.ListPurchaseOrders({
    workspaceId: createWorkspace.id,
    limit: 10,
    offset: 0,
  });
  if (!listPurchaseOrders) throw new Error('Could not list purchase orders');
  expect(listPurchaseOrders.items.length).toBeGreaterThan(0);
  const found = listPurchaseOrders.items.find(
    (o) => o.id === createPurchaseOrder.id,
  );
  expect(found).toBeDefined();
  expect(found).toMatchObject({
    project_id: createProject.id,
    seller_id: sellerId,
    purchase_order_number: 'PO-12345',
    updated_by: user.id,
  });
});
