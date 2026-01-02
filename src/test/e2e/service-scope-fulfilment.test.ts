import { createTestEnvironment } from './test-environment';

const { createClient } = createTestEnvironment();

describe('Service scope tasks → fulfilment', () => {
  it('creates a SERVICE line item with scopeTasks and materializes a service fulfilment with task execution state', async () => {
    const { sdk, client, user, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    const { createProject } = await sdk.CreateProjectForSalesOrder({
      input: {
        name: 'Service Scope Project',
        project_code: 'SVC-001',
        description: 'Project for service scope fulfilment test',
        deleted: false,
        workspaceId: workspace.id,
      },
    });
    if (!createProject) throw new Error('Project was not created');

    const { createSalesOrder } = await sdk.CreateSalesOrder({
      input: {
        workspace_id: workspace.id,
        project_id: createProject.id,
        buyer_id: user.id,
        purchase_order_number: 'PO-SVC-001',
      },
    });
    if (!createSalesOrder) throw new Error('Sales order was not created');

    const createLineItemMutation = /* GraphQL */ `
      mutation CreateLineItemWithScope($input: LineItemInput!) {
        createLineItem(input: $input) {
          id
          type
          documentRef {
            type
            id
          }
          scopeTasks {
            id
            title
            activityTagIds
            contextTagIds
            notes
          }
          timeWindow {
            startAt
          }
          rateInCentsSnapshot
        }
      }
    `;

    const startAt = new Date().toISOString();

    const { createLineItem } = await client.request<{
      createLineItem: {
        id: string;
        type: string;
        rateInCentsSnapshot?: number | null;
        timeWindow?: { startAt?: string | null } | null;
        scopeTasks?: Array<{
          id: string;
          title: string;
          activityTagIds: string[];
          contextTagIds?: string[] | null;
          notes?: string | null;
        }> | null;
      };
    }>(createLineItemMutation, {
      input: {
        workspaceId: workspace.id,
        documentRef: { type: 'SALES_ORDER', id: createSalesOrder.id },
        type: 'SERVICE',
        description: 'House cleaning',
        quantity: '1',
        unitCode: 'EA',
        productRef: { kind: 'SERVICE_PRODUCT', productId: 'house_cleaning' },
        timeWindow: { startAt },
        rateInCentsSnapshot: 4500,
        scopeTasks: [
          {
            id: 'mop_floors',
            title: 'Mop floors',
            activityTagIds: ['mop'],
            contextTagIds: ['floors'],
          },
          {
            id: 'wash_windows',
            title: 'Wash windows',
            activityTagIds: ['wash'],
            contextTagIds: ['windows'],
            notes: 'Interior windows only',
          },
        ],
      },
    });

    expect(createLineItem.type).toBe('SERVICE');
    expect(createLineItem.rateInCentsSnapshot).toBe(4500);
    expect(createLineItem.timeWindow?.startAt).toBe(startAt);
    expect(createLineItem.scopeTasks).toHaveLength(2);

    const createFulfilmentMutation = /* GraphQL */ `
      mutation CreateServiceFulfilmentFromLineItem(
        $input: CreateServiceFulfilmentFromLineItemInput!
      ) {
        createServiceFulfilmentFromLineItem(input: $input) {
          id
          salesOrderType
          salesOrderLineItemId
          serviceDate
          tasks {
            id
            status
            completedAt
            completedBy
          }
        }
      }
    `;

    const fulfilmentResult = await client.request<{
      createServiceFulfilmentFromLineItem: {
        id: string;
        salesOrderType: string;
        salesOrderLineItemId: string;
        tasks: Array<{
          id: string;
          status: string;
          completedAt?: string | null;
          completedBy?: string | null;
        }> | null;
      };
    }>(createFulfilmentMutation, {
      input: { lineItemId: createLineItem.id },
    });

    expect(fulfilmentResult.createServiceFulfilmentFromLineItem.salesOrderType).toBe(
      'SERVICE',
    );
    expect(
      fulfilmentResult.createServiceFulfilmentFromLineItem.salesOrderLineItemId,
    ).toBe(createLineItem.id);
    expect(fulfilmentResult.createServiceFulfilmentFromLineItem.tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'mop_floors',
          status: 'OPEN',
          completedAt: null,
          completedBy: null,
        }),
      ]),
    );

    const updateTaskMutation = /* GraphQL */ `
      mutation UpdateServiceFulfilmentTaskStatus(
        $input: UpdateServiceFulfilmentTaskStatusInput!
      ) {
        updateServiceFulfilmentTaskStatus(input: $input) {
          id
          salesOrderType
          tasks {
            id
            status
            completedAt
            completedBy
          }
        }
      }
    `;

    const updated = await client.request<{
      updateServiceFulfilmentTaskStatus: {
        id: string;
        salesOrderType: string;
        tasks: Array<{
          id: string;
          status: string;
          completedAt?: string | null;
          completedBy?: string | null;
        }> | null;
      };
    }>(updateTaskMutation, {
      input: {
        fulfilmentId: fulfilmentResult.createServiceFulfilmentFromLineItem.id,
        taskId: 'mop_floors',
        status: 'DONE',
      },
    });

    const updatedTask = updated.updateServiceFulfilmentTaskStatus.tasks?.find(
      (task) => task.id === 'mop_floors',
    );
    expect(updated.updateServiceFulfilmentTaskStatus.salesOrderType).toBe('SERVICE');
    expect(updatedTask).toBeDefined();
    expect(updatedTask?.status).toBe('DONE');
    expect(updatedTask?.completedAt).toEqual(expect.any(String));
    expect(updatedTask?.completedBy).toBe(user.id);
  });

  it('rejects scopeTasks on non-service line items', async () => {
    const { sdk, client, user, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    const { createProject } = await sdk.CreateProjectForSalesOrder({
      input: {
        name: 'Service Scope Project',
        project_code: 'SVC-002',
        description: 'Project for service scope fulfilment test',
        deleted: false,
        workspaceId: workspace.id,
      },
    });
    if (!createProject) throw new Error('Project was not created');

    const { createSalesOrder } = await sdk.CreateSalesOrder({
      input: {
        workspace_id: workspace.id,
        project_id: createProject.id,
        buyer_id: user.id,
        purchase_order_number: 'PO-SVC-002',
      },
    });
    if (!createSalesOrder) throw new Error('Sales order was not created');

    const mutation = /* GraphQL */ `
      mutation CreateLineItemInvalidScope($input: LineItemInput!) {
        createLineItem(input: $input) {
          id
        }
      }
    `;

    await expect(
      client.request(mutation, {
        input: {
          workspaceId: workspace.id,
          documentRef: { type: 'SALES_ORDER', id: createSalesOrder.id },
          type: 'RENTAL',
          description: 'Invalid line item',
          quantity: '1',
          scopeTasks: [
            {
              id: 'mop_floors',
              title: 'Mop floors',
              activityTagIds: ['mop'],
            },
          ],
        },
      }),
    ).rejects.toThrow(/scopeTasks are only allowed on SERVICE line items/i);
  });
});

