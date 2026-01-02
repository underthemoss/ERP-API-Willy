import { createTestEnvironment } from './test-environment';

const { createClient } = createTestEnvironment();

describe('Studio catalog service taskTemplates', () => {
  it('creates a service product with taskTemplates and persists them in the product file', async () => {
    const { client, httpClient, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    const mutation = /* GraphQL */ `
      mutation CreateCatalogProductWithTasks($input: StudioCatalogCreateProductInput!) {
        studioCatalogCreateProduct(input: $input) {
          catalogPath
          product {
            id
            name
            path
            kind
          }
        }
      }
    `;

    const productId = `house_cleaning_${Date.now()}`;

    const result = await client.request<{
      studioCatalogCreateProduct: {
        catalogPath: string;
        product: { id: string; name: string; path: string; kind?: string | null };
      };
    }>(mutation, {
      input: {
        workspaceId: workspace.id,
        product: {
          id: productId,
          name: 'House Cleaning',
          kind: 'SERVICE',
          tags: ['cleaning'],
          activityTags: ['clean'],
          targetSpecs: [],
          taskTemplates: [
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
          attributes: [],
          sourceRefs: [],
          sourcePaths: [],
          images: [],
        },
      },
    });

    expect(result.studioCatalogCreateProduct.catalogPath).toBe(
      '/catalogs/default',
    );
	    expect(result.studioCatalogCreateProduct.product).toMatchObject({
	      id: productId,
	      name: 'House Cleaning',
	      kind: 'SERVICE',
	    });

    const readResponse = await httpClient.fetch('/api/studio/fs/read', {
      method: 'POST',
      body: JSON.stringify({
        workspaceId: workspace.id,
        path: result.studioCatalogCreateProduct.product.path,
      }),
    });

    expect(readResponse.status).toBe(200);
    const payload = await readResponse.json();
    const parsed = JSON.parse(payload.content);

    expect(parsed).toMatchObject({
      id: productId,
      kind: 'service',
      taskTemplates: [
        expect.objectContaining({
          id: 'mop_floors',
          title: 'Mop floors',
          activityTagIds: ['mop'],
          contextTagIds: ['floors'],
        }),
        expect.objectContaining({
          id: 'wash_windows',
          title: 'Wash windows',
          activityTagIds: ['wash'],
          contextTagIds: ['windows'],
          notes: 'Interior windows only',
        }),
      ],
    });
  });

  it('allows taskTemplates on material products (operational templates)', async () => {
    const { client, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    const mutation = /* GraphQL */ `
      mutation CreateCatalogProductInvalid($input: StudioCatalogCreateProductInput!) {
        studioCatalogCreateProduct(input: $input) {
          catalogPath
          product {
            id
            kind
          }
        }
      }
    `;

    const productId = `material_with_tasks_${Date.now()}`;
    const result = await client.request<{
      studioCatalogCreateProduct: {
        product: { id: string; kind?: string | null };
      };
    }>(mutation, {
      input: {
        workspaceId: workspace.id,
        product: {
          id: productId,
          name: 'Material With Ops Templates',
          kind: 'MATERIAL',
          tags: ['construction_equipment'],
          activityTags: [],
          targetSpecs: [],
          taskTemplates: [
            {
              id: 'receive_inspect',
              title: 'Receive + inspect on return',
              activityTagIds: ['inspect'],
              contextTagIds: ['checkin', 'receiving'],
            },
          ],
          attributes: [],
          sourceRefs: [],
          sourcePaths: [],
          images: [],
        },
      },
    });

    expect(result.studioCatalogCreateProduct.product).toMatchObject({
      id: productId,
      kind: 'MATERIAL',
    });
  });
});
