import { createTestEnvironment } from './test-environment';

const { createClient } = createTestEnvironment();

const createLineItemMutation = /* GraphQL */ `
  mutation LogisticsAddOnsSyncCreateLineItem($input: LineItemInput!) {
    createLineItem(input: $input) {
      id
    }
  }
`;

const syncMutation = /* GraphQL */ `
  mutation LogisticsAddOnsSyncMaterialLogistics($input: SyncMaterialLogisticsAddOnsInput!) {
    syncMaterialLogisticsAddOns(input: $input) {
      materialLineItemId
      deliveryLineItem {
        id
        type
        productRef {
          kind
          productId
        }
        sourceLineItemId
        targetSelectors {
          kind
          targetLineItemIds
        }
        scopeTasks {
          id
          title
          activityTagIds
        }
      }
      pickupLineItem {
        id
        type
        productRef {
          kind
          productId
        }
        sourceLineItemId
        targetSelectors {
          kind
          targetLineItemIds
        }
        scopeTasks {
          id
          title
          activityTagIds
        }
      }
      serviceAddOns {
        id
        productRef {
          productId
        }
      }
      warnings
    }
  }
`;

const listGroupsQuery = /* GraphQL */ `
  query LogisticsGroupsListLogisticsServiceGroups($filter: ListLogisticsServiceGroupsFilter!) {
    listLogisticsServiceGroups(filter: $filter) {
      id
      description
      productRef {
        kind
        productId
      }
      timeWindow {
        startAt
        endAt
      }
      placeRef {
        kind
        id
      }
      pricingRef {
        priceId
      }
      targetSelectors {
        kind
        targetLineItemIds
      }
    }
  }
`;

describe('Logistics add-on syncing', () => {
  it('creates and removes delivery/pickup service add-ons idempotently', async () => {
    const { client, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    const rentalLineItem = await client.request<{
      createLineItem: { id: string };
    }>(createLineItemMutation, {
      input: {
        workspaceId: workspace.id,
        documentRef: { type: 'WORK_ORDER', id: 'wo_test' },
        type: 'RENTAL',
        description: 'Telehandler rental',
        quantity: '1',
      },
    });

    const first = await client.request<{
      syncMaterialLogisticsAddOns: {
        materialLineItemId: string;
        deliveryLineItem: {
          id: string;
          type: string;
          productRef: { kind: string; productId: string } | null;
          sourceLineItemId: string | null;
          targetSelectors: Array<{ kind: string; targetLineItemIds: string[] | null }> | null;
          scopeTasks: Array<{ id: string; title: string; activityTagIds: string[] }> | null;
        } | null;
        pickupLineItem: {
          id: string;
          type: string;
          productRef: { kind: string; productId: string } | null;
          sourceLineItemId: string | null;
          targetSelectors: Array<{ kind: string; targetLineItemIds: string[] | null }> | null;
          scopeTasks: Array<{ id: string; title: string; activityTagIds: string[] }> | null;
        } | null;
        serviceAddOns: Array<{ id: string; productRef: { productId: string } | null }>;
        warnings: string[];
      };
    }>(syncMutation, {
      input: {
        materialLineItemId: rentalLineItem.createLineItem.id,
        delivery: { enabled: true },
        pickup: { enabled: true },
      },
    });

    expect(first.syncMaterialLogisticsAddOns.materialLineItemId).toBe(
      rentalLineItem.createLineItem.id,
    );
    expect(first.syncMaterialLogisticsAddOns.deliveryLineItem?.type).toBe('SERVICE');
    expect(first.syncMaterialLogisticsAddOns.deliveryLineItem?.productRef?.productId).toBe(
      'svc_delivery',
    );
    expect(first.syncMaterialLogisticsAddOns.deliveryLineItem?.sourceLineItemId).toBe(
      rentalLineItem.createLineItem.id,
    );
    expect(
      first.syncMaterialLogisticsAddOns.deliveryLineItem?.targetSelectors?.some(
        (selector) =>
          selector.kind === 'line_item' &&
          selector.targetLineItemIds?.includes(rentalLineItem.createLineItem.id),
      ),
    ).toBe(true);
    expect(first.syncMaterialLogisticsAddOns.deliveryLineItem?.scopeTasks?.length).toBeGreaterThan(
      0,
    );

    expect(first.syncMaterialLogisticsAddOns.pickupLineItem?.type).toBe('SERVICE');
    expect(first.syncMaterialLogisticsAddOns.pickupLineItem?.productRef?.productId).toBe(
      'svc_pickup',
    );
    expect(first.syncMaterialLogisticsAddOns.pickupLineItem?.scopeTasks?.length).toBeGreaterThan(0);

    const firstDeliveryId = first.syncMaterialLogisticsAddOns.deliveryLineItem?.id;
    const firstPickupId = first.syncMaterialLogisticsAddOns.pickupLineItem?.id;
    expect(firstDeliveryId).toBeTruthy();
    expect(firstPickupId).toBeTruthy();

    const second = await client.request<{
      syncMaterialLogisticsAddOns: {
        deliveryLineItem: { id: string } | null;
        pickupLineItem: { id: string } | null;
      };
    }>(syncMutation, {
      input: {
        materialLineItemId: rentalLineItem.createLineItem.id,
        delivery: { enabled: true },
        pickup: { enabled: true },
      },
    });

    expect(second.syncMaterialLogisticsAddOns.deliveryLineItem?.id).toBe(firstDeliveryId);
    expect(second.syncMaterialLogisticsAddOns.pickupLineItem?.id).toBe(firstPickupId);

    const removed = await client.request<{
      syncMaterialLogisticsAddOns: {
        serviceAddOns: Array<{ id: string }>;
      };
    }>(syncMutation, {
      input: {
        materialLineItemId: rentalLineItem.createLineItem.id,
        delivery: { enabled: false },
        pickup: { enabled: false },
      },
    });

    expect(removed.syncMaterialLogisticsAddOns.serviceAddOns).toEqual([]);
  });

  it('supports shared delivery add-ons via serviceLineItemId without deleting the shared service line', async () => {
    const { client, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    const line1 = await client.request<{ createLineItem: { id: string } }>(
      createLineItemMutation,
      {
        input: {
          workspaceId: workspace.id,
          documentRef: { type: 'WORK_ORDER', id: 'wo_shared_delivery' },
          type: 'RENTAL',
          description: 'Telehandler rental',
          quantity: '1',
        },
      },
    );

    const line2 = await client.request<{ createLineItem: { id: string } }>(
      createLineItemMutation,
      {
        input: {
          workspaceId: workspace.id,
          documentRef: { type: 'WORK_ORDER', id: 'wo_shared_delivery' },
          type: 'RENTAL',
          description: 'Dozer rental',
          quantity: '1',
        },
      },
    );

    const first = await client.request<{
      syncMaterialLogisticsAddOns: {
        deliveryLineItem: {
          id: string;
          productRef: { productId: string } | null;
          targetSelectors: Array<{ kind: string; targetLineItemIds: string[] | null }> | null;
        } | null;
      };
    }>(syncMutation, {
      input: {
        materialLineItemId: line1.createLineItem.id,
        delivery: { enabled: true },
        pickup: { enabled: false },
      },
    });

    const sharedDeliveryId = first.syncMaterialLogisticsAddOns.deliveryLineItem?.id;
    expect(sharedDeliveryId).toBeTruthy();
    expect(first.syncMaterialLogisticsAddOns.deliveryLineItem?.productRef?.productId).toBe(
      'svc_delivery',
    );

    const attached = await client.request<{
      syncMaterialLogisticsAddOns: {
        deliveryLineItem: {
          id: string;
          targetSelectors: Array<{ kind: string; targetLineItemIds: string[] | null }> | null;
        } | null;
      };
    }>(syncMutation, {
      input: {
        materialLineItemId: line2.createLineItem.id,
        delivery: { enabled: true, serviceLineItemId: sharedDeliveryId },
        pickup: { enabled: false },
      },
    });

    expect(attached.syncMaterialLogisticsAddOns.deliveryLineItem?.id).toBe(sharedDeliveryId);

    const sharedTargets =
      attached.syncMaterialLogisticsAddOns.deliveryLineItem?.targetSelectors?.find(
        (selector) => selector.kind === 'line_item',
      )?.targetLineItemIds ?? [];

    expect(sharedTargets).toEqual(
      expect.arrayContaining([line1.createLineItem.id, line2.createLineItem.id]),
    );

    // Detaching line2 must not delete the shared delivery line item (it should still target line1).
    const detached = await client.request<{
      syncMaterialLogisticsAddOns: {
        serviceAddOns: Array<{ id: string }>;
      };
    }>(syncMutation, {
      input: {
        materialLineItemId: line2.createLineItem.id,
        delivery: { enabled: false },
        pickup: { enabled: false },
      },
    });

    expect(detached.syncMaterialLogisticsAddOns.serviceAddOns).toEqual([]);

    const line1AfterDetach = await client.request<{
      syncMaterialLogisticsAddOns: {
        deliveryLineItem: {
          id: string;
          targetSelectors: Array<{ kind: string; targetLineItemIds: string[] | null }> | null;
        } | null;
      };
    }>(syncMutation, {
      input: {
        materialLineItemId: line1.createLineItem.id,
        delivery: { enabled: true },
        pickup: { enabled: false },
      },
    });

    expect(line1AfterDetach.syncMaterialLogisticsAddOns.deliveryLineItem?.id).toBe(sharedDeliveryId);
    const remainingTargets =
      line1AfterDetach.syncMaterialLogisticsAddOns.deliveryLineItem?.targetSelectors?.find(
        (selector) => selector.kind === 'line_item',
      )?.targetLineItemIds ?? [];
    expect(remainingTargets).toEqual([line1.createLineItem.id]);

    // Switching line2 back to dedicated (no serviceLineItemId) should create a separate delivery line.
    const dedicated = await client.request<{
      syncMaterialLogisticsAddOns: { deliveryLineItem: { id: string } | null };
    }>(syncMutation, {
      input: {
        materialLineItemId: line2.createLineItem.id,
        delivery: { enabled: true },
        pickup: { enabled: false },
      },
    });

    expect(dedicated.syncMaterialLogisticsAddOns.deliveryLineItem?.id).toBeTruthy();
    expect(dedicated.syncMaterialLogisticsAddOns.deliveryLineItem?.id).not.toBe(sharedDeliveryId);
  });

  it('lists logistics service groups for a document', async () => {
    const { client, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    const docId = 'wo_list_groups';

    const line1 = await client.request<{ createLineItem: { id: string } }>(
      createLineItemMutation,
      {
        input: {
          workspaceId: workspace.id,
          documentRef: { type: 'WORK_ORDER', id: docId },
          type: 'RENTAL',
          description: 'Telehandler rental',
          quantity: '1',
        },
      },
    );

    const created = await client.request<{
      syncMaterialLogisticsAddOns: { deliveryLineItem: { id: string } | null };
    }>(syncMutation, {
      input: {
        materialLineItemId: line1.createLineItem.id,
        delivery: { enabled: true },
        pickup: { enabled: false },
      },
    });

    const deliveryLineItemId = created.syncMaterialLogisticsAddOns.deliveryLineItem?.id;
    expect(deliveryLineItemId).toBeTruthy();

    const result = await client.request<{
      listLogisticsServiceGroups: Array<{ id: string; productRef: { productId: string } | null }>;
    }>(listGroupsQuery, {
      filter: {
        workspaceId: workspace.id,
        documentRef: { type: 'WORK_ORDER', id: docId },
        productId: 'svc_delivery',
      },
    });

    expect(result.listLogisticsServiceGroups.map((item) => item.id)).toContain(
      deliveryLineItemId as string,
    );
    result.listLogisticsServiceGroups.forEach((item) => {
      expect(item.productRef?.productId).toBe('svc_delivery');
    });
  });
});
