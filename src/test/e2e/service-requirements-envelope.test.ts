import { createTestEnvironment } from './test-environment';

const { createClient } = createTestEnvironment();

describe('Service requirement envelopes', () => {
  it('computes delivery envelope from targeted material line items', async () => {
    const { client, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    const createProductMutation = /* GraphQL */ `
      mutation CreateCatalogProduct($input: StudioCatalogCreateProductInput!) {
        studioCatalogCreateProduct(input: $input) {
          product {
            id
            path
          }
        }
      }
    `;

    await client.request(createProductMutation, {
      input: {
        workspaceId: workspace.id,
        product: {
          id: 'telehandler_10k',
          name: '10k Telehandler',
          kind: 'MATERIAL',
          tags: ['construction_equipment'],
          activityTags: [],
          targetSpecs: [],
          taskTemplates: [],
          attributes: [
            { key: 'weight', value: 10000, unit: 'LB', contextTags: ['shipping'] },
            { key: 'length', value: 240, unit: 'IN', contextTags: ['overall'] },
            { key: 'width', value: 96, unit: 'IN', contextTags: ['overall'] },
            { key: 'height', value: 102, unit: 'IN', contextTags: ['overall'] },
          ],
          sourceRefs: [],
          sourcePaths: [],
          images: [],
        },
      },
    });

    const createLineItemMutation = /* GraphQL */ `
      mutation CreateLineItem($input: LineItemInput!) {
        createLineItem(input: $input) {
          id
        }
      }
    `;

    const rentalLineItem = await client.request<{
      createLineItem: { id: string };
    }>(createLineItemMutation, {
      input: {
        workspaceId: workspace.id,
        documentRef: { type: 'WORK_ORDER', id: 'wo_test' },
        type: 'RENTAL',
        description: 'Telehandler rental',
        quantity: '2',
        productRef: { kind: 'MATERIAL_PRODUCT', productId: 'telehandler_10k' },
      },
    });

    const serviceLineItem = await client.request<{
      createLineItem: { id: string };
    }>(createLineItemMutation, {
      input: {
        workspaceId: workspace.id,
        documentRef: { type: 'WORK_ORDER', id: 'wo_test' },
        type: 'SERVICE',
        description: 'Delivery service',
        quantity: '1',
        productRef: { kind: 'SERVICE_PRODUCT', productId: 'svc_delivery' },
        targetSelectors: [
          {
            kind: 'line_item',
            targetLineItemIds: [rentalLineItem.createLineItem.id],
          },
        ],
      },
    });

    const query = /* GraphQL */ `
      query ComputeEnvelope($serviceLineItemId: String!) {
        computeServiceRequirementEnvelope(serviceLineItemId: $serviceLineItemId) {
          targetLineItemIds
          targetLineItemCount
          targetQuantity
          totalWeight {
            value
            unitCode
          }
          maxItemWeight {
            value
            unitCode
          }
          maxLength {
            value
            unitCode
          }
          maxWidth {
            value
            unitCode
          }
          maxHeight {
            value
            unitCode
          }
          missingTargets {
            targetLineItemId
            reason
            missingAttributeKeys
          }
          warnings
        }
      }
    `;

    const envelope = await client.request<{
      computeServiceRequirementEnvelope: {
        targetLineItemIds: string[];
        targetLineItemCount: number;
        targetQuantity: number;
        totalWeight: { value: number; unitCode: string } | null;
        maxItemWeight: { value: number; unitCode: string } | null;
        maxLength: { value: number; unitCode: string } | null;
        maxWidth: { value: number; unitCode: string } | null;
        maxHeight: { value: number; unitCode: string } | null;
        missingTargets: Array<{ targetLineItemId: string; reason: string }>;
        warnings: string[];
      };
    }>(query, { serviceLineItemId: serviceLineItem.createLineItem.id });

    expect(envelope.computeServiceRequirementEnvelope.targetLineItemIds).toEqual([
      rentalLineItem.createLineItem.id,
    ]);
    expect(envelope.computeServiceRequirementEnvelope.targetLineItemCount).toBe(1);
    expect(envelope.computeServiceRequirementEnvelope.targetQuantity).toBe(2);
    expect(envelope.computeServiceRequirementEnvelope.missingTargets).toEqual([]);

    expect(envelope.computeServiceRequirementEnvelope.totalWeight).toEqual({
      value: 20000,
      unitCode: 'LB',
    });
    expect(envelope.computeServiceRequirementEnvelope.maxItemWeight).toEqual({
      value: 10000,
      unitCode: 'LB',
    });
    expect(envelope.computeServiceRequirementEnvelope.maxLength).toEqual({
      value: 240,
      unitCode: 'IN',
    });
    expect(envelope.computeServiceRequirementEnvelope.maxWidth).toEqual({
      value: 96,
      unitCode: 'IN',
    });
    expect(envelope.computeServiceRequirementEnvelope.maxHeight).toEqual({
      value: 102,
      unitCode: 'IN',
    });
  });
});
