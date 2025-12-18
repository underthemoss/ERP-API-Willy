import { MongoClient } from 'mongodb';

import { MongoMemoryReplSet } from 'mongodb-memory-server';
import {
  createFulfilmentEventStore,
  FulfilmentEventStore,
} from '../fulfilmentEventStore';
import { randomUUID } from 'crypto';

describe('event store', () => {
  let client: MongoClient;
  let replSet: MongoMemoryReplSet;
  let eventStore: FulfilmentEventStore;
  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    client = await MongoClient.connect(replSet.getUri(), {});
    eventStore = createFulfilmentEventStore({ mongoClient: client });
  });
  afterAll(async () => {
    if (client) await client.close();
    if (replSet) await replSet.stop();
  });

  it('Meta data is accurately set', async () => {
    const id = randomUUID();
    const { state: initialState } = await eventStore.applyEvent(
      id,
      {
        type: 'CREATE_RENTAL_FULFILMENT',
        salesOrderType: 'RENTAL',
        workspace_id: 'mockWorkspaceId',
        salesOrderId: 'mockSalesOrderId',
        contactId: 'mockContactId',
        purchaseOrderNumber: 'PO-12345',
        priceId: 'mockPriceId',
        priceName: 'Mock Price',
        pimCategoryId: 'mockPimCategoryId',
        pimCategoryPath: 'mock/category/path',
        pimCategoryName: 'Mock Category',
        pricePerDayInCents: 1,
        pricePerWeekInCents: 4,
        pricePerMonthInCents: 12,
        projectId: 'mockProjectId',
      },
      { principalId: 'alice' },
    );

    expect(initialState).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        salesOrderType: 'RENTAL',
        salesOrderId: 'mockSalesOrderId',
        contactId: 'mockContactId',
        purchaseOrderNumber: 'PO-12345',
        priceId: 'mockPriceId',
        priceName: 'Mock Price',
        pimCategoryId: 'mockPimCategoryId',
        pimCategoryPath: 'mock/category/path',
        pimCategoryName: 'Mock Category',
        pricePerDayInCents: 1,
        pricePerWeekInCents: 4,
        pricePerMonthInCents: 12,
        projectId: 'mockProjectId',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        createdBy: 'alice',
      }),
    );

    await eventStore.applyEvent(
      id,
      {
        type: 'UPDATE_ASSIGNEE',
        assignToId: 'bob',
      },
      { principalId: 'bob' },
    );
    const { state } = await eventStore.applyEvent(
      id,
      {
        type: 'UPDATE_COLUMN',
        workflowColumnId: 'TODO',
        workflowId: 'BOARD1',
      },
      { principalId: 'charlie' },
    );

    expect(state?.assignedToId).toBe('bob');
    expect(state?.updatedAt).toBeTruthy();
    expect(state?.createdAt).toBeTruthy();
    expect(state?.updatedBy).toBe('charlie');
    expect(state?.createdBy).toBe('alice');
  });

  it('updates workflow column', async () => {
    const id = randomUUID();
    await eventStore.applyEvent(
      id,
      {
        type: 'CREATE_RENTAL_FULFILMENT',
        salesOrderType: 'RENTAL',
        workspace_id: 'mockWorkspaceId',
        salesOrderId: 'mockSalesOrderId',
        contactId: 'mockContactId',
        purchaseOrderNumber: 'PO-12345',
        priceId: 'mockPriceId',
        priceName: 'Mock Price',
        pimCategoryId: 'mockPimCategoryId',
        pimCategoryPath: 'mock/category/path',
        pimCategoryName: 'Mock Category',
        pricePerDayInCents: 1,
        pricePerWeekInCents: 4,
        pricePerMonthInCents: 12,
      },
      { principalId: 'alice' },
    );
    const { state } = await eventStore.applyEvent(
      id,
      {
        type: 'UPDATE_COLUMN',
        workflowColumnId: 'IN_PROGRESS',
        workflowId: 'BOARD1',
      },
      { principalId: 'bob' },
    );
    expect(state?.workflowColumnId).toBe('IN_PROGRESS');
    expect(state?.workflowId).toBe('BOARD1');
    expect(state?.updatedBy).toBe('bob');
    expect(state?.updatedAt).toBeTruthy();
  });

  it('unassigns someone from a fulfilment', async () => {
    const id = randomUUID();
    // Create fulfilment
    await eventStore.applyEvent(
      id,
      {
        type: 'CREATE_RENTAL_FULFILMENT',
        salesOrderType: 'RENTAL',
        workspace_id: 'mockWorkspaceId',
        salesOrderId: 'mockSalesOrderId',
        contactId: 'mockContactId',
        purchaseOrderNumber: 'PO-12345',
        priceId: 'mockPriceId',
        priceName: 'Mock Price',
        pimCategoryId: 'mockPimCategoryId',
        pimCategoryPath: 'mock/category/path',
        pimCategoryName: 'Mock Category',
        pricePerDayInCents: 1,
        pricePerWeekInCents: 4,
        pricePerMonthInCents: 12,
      },
      { principalId: 'alice' },
    );
    // Assign someone
    await eventStore.applyEvent(
      id,
      {
        type: 'UPDATE_ASSIGNEE',
        assignToId: 'bob',
      },
      { principalId: 'bob' },
    );
    // Unassign
    const { state } = await eventStore.applyEvent(
      id,
      {
        type: 'UPDATE_ASSIGNEE',
        assignToId: null,
      },
      { principalId: 'charlie' },
    );
    expect(state?.assignedToId).toBeNull();
    expect(state?.updatedBy).toBe('charlie');
    expect(state?.updatedAt).toBeTruthy();
  });

  it('sets purchase order line item id', async () => {
    const id = randomUUID();
    // Create fulfilment
    await eventStore.applyEvent(
      id,
      {
        type: 'CREATE_RENTAL_FULFILMENT',
        salesOrderType: 'RENTAL',
        workspace_id: 'mockWorkspaceId',
        salesOrderId: 'mockSalesOrderId',
        contactId: 'mockContactId',
        purchaseOrderNumber: 'PO-12345',
        priceId: 'mockPriceId',
        priceName: 'Mock Price',
        pimCategoryId: 'mockPimCategoryId',
        pimCategoryPath: 'mock/category/path',
        pimCategoryName: 'Mock Category',
        pricePerDayInCents: 1,
        pricePerWeekInCents: 4,
        pricePerMonthInCents: 12,
      },
      { principalId: 'alice' },
    );
    // Set purchase order line item ID
    const { state } = await eventStore.applyEvent(
      id,
      {
        type: 'SET_PURCHASE_ORDER_LINE_ITEM_ID',
        purchaseOrderLineItemId: 'PO-LI-123',
      },
      { principalId: 'bob' },
    );
    expect(state?.purchaseOrderLineItemId).toBe('PO-LI-123');
    expect(state?.updatedBy).toBe('bob');
    expect(state?.updatedAt).toBeTruthy();
  });

  it('clears purchase order line item id', async () => {
    const id = randomUUID();
    // Create fulfilment
    await eventStore.applyEvent(
      id,
      {
        type: 'CREATE_RENTAL_FULFILMENT',
        salesOrderType: 'RENTAL',
        workspace_id: 'mockWorkspaceId',
        salesOrderId: 'mockSalesOrderId',
        contactId: 'mockContactId',
        purchaseOrderNumber: 'PO-12345',
        priceId: 'mockPriceId',
        priceName: 'Mock Price',
        pimCategoryId: 'mockPimCategoryId',
        pimCategoryPath: 'mock/category/path',
        pimCategoryName: 'Mock Category',
        pricePerDayInCents: 1,
        pricePerWeekInCents: 4,
        pricePerMonthInCents: 12,
      },
      { principalId: 'alice' },
    );
    // Set purchase order line item ID
    await eventStore.applyEvent(
      id,
      {
        type: 'SET_PURCHASE_ORDER_LINE_ITEM_ID',
        purchaseOrderLineItemId: 'PO-LI-123',
      },
      { principalId: 'bob' },
    );
    // Clear purchase order line item ID
    const { state } = await eventStore.applyEvent(
      id,
      {
        type: 'SET_PURCHASE_ORDER_LINE_ITEM_ID',
        purchaseOrderLineItemId: null,
      },
      { principalId: 'charlie' },
    );
    expect(state?.purchaseOrderLineItemId).toBeUndefined();
    expect(state?.updatedBy).toBe('charlie');
    expect(state?.updatedAt).toBeTruthy();
  });
});
