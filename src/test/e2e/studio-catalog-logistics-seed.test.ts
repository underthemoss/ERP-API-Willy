import { createTestEnvironment } from './test-environment';

const { createClient } = createTestEnvironment();

describe('Studio catalog logistics seeding', () => {
  it('seeds canonical delivery/pickup service products idempotently', async () => {
    const { client, httpClient, utils } = await createClient();
    const workspace = await utils.createWorkspace();

    const mutation = /* GraphQL */ `
      mutation EnsureLogisticsProducts($input: StudioCatalogEnsureLogisticsServiceProductsInput!) {
        studioCatalogEnsureLogisticsServiceProducts(input: $input) {
          catalogPath
          products {
            status
            product {
              id
              name
              path
              kind
              origin
            }
          }
        }
      }
    `;

    const first = await client.request<{
      studioCatalogEnsureLogisticsServiceProducts: {
        catalogPath: string;
        products: Array<{
          status: 'CREATED' | 'EXISTING';
          product: {
            id: string;
            name: string;
            path: string;
            kind?: string | null;
            origin: 'SYSTEM' | 'WORKSPACE';
          };
        }>;
      };
    }>(mutation, { input: { workspaceId: workspace.id } });

    expect(first.studioCatalogEnsureLogisticsServiceProducts.catalogPath).toBe(
      '/catalogs/default',
    );

    const createdIds = first.studioCatalogEnsureLogisticsServiceProducts.products
      .map((entry) => entry.product.id)
      .sort();
    expect(createdIds).toEqual(['svc_delivery', 'svc_pickup']);
    first.studioCatalogEnsureLogisticsServiceProducts.products.forEach((entry) => {
      expect(entry.status).toBe('CREATED');
      expect(entry.product.kind).toBe('SERVICE');
      expect(entry.product.origin).toBe('SYSTEM');
    });

    for (const entry of first.studioCatalogEnsureLogisticsServiceProducts.products) {
      const readResponse = await httpClient.fetch('/api/studio/fs/read', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: workspace.id,
          path: entry.product.path,
        }),
      });
      expect(readResponse.status).toBe(200);
      const payload = await readResponse.json();
      const parsed = JSON.parse(payload.content);

      expect(parsed).toMatchObject({
        id: entry.product.id,
        kind: 'service',
        origin: 'system',
      });
      expect(Array.isArray(parsed.taskTemplates)).toBe(true);
      expect(parsed.taskTemplates.length).toBeGreaterThan(0);
    }

    const second = await client.request<{
      studioCatalogEnsureLogisticsServiceProducts: {
        products: Array<{ status: 'CREATED' | 'EXISTING'; product: { id: string } }>;
      };
    }>(mutation, { input: { workspaceId: workspace.id } });

    const statusesById = new Map(
      second.studioCatalogEnsureLogisticsServiceProducts.products.map((entry) => [
        entry.product.id,
        entry.status,
      ]),
    );

    expect(statusesById.get('svc_delivery')).toBe('EXISTING');
    expect(statusesById.get('svc_pickup')).toBe('EXISTING');
  });
});
