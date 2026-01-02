import { createTestEnvironment } from './test-environment';

const { createClient } = createTestEnvironment();

describe('Studio catalog product listing', () => {
  it('lists products via /api/studio/catalog/products with search + kind filter', async () => {
    const { httpClient, utils } = await createClient();

    const workspace = await utils.createWorkspace();

    const productId = 'ford_f150_2024_xlt';
    const productPath = `/catalogs/default/products/${productId}.jsonc`;

    const productDoc = {
      schemaVersion: '1.0',
      id: productId,
      name: 'Ford F-150 2024 XLT',
      kind: 'material',
      tags: ['vehicle', 'truck', 'pickup_truck'],
    };

    const writeResponse = await httpClient.fetch('/api/studio/fs/write', {
      method: 'POST',
      body: JSON.stringify({
        workspaceId: workspace.id,
        path: productPath,
        content: JSON.stringify(productDoc, null, 2),
        mimeType: 'application/json',
      }),
    });

    expect(writeResponse.status).toBe(200);
    await expect(writeResponse.json()).resolves.toMatchObject({
      etag: expect.any(String),
    });

    const listResponse = await httpClient.fetch('/api/studio/catalog/products', {
      method: 'POST',
      body: JSON.stringify({
        workspaceId: workspace.id,
        query: 'f150',
        kind: 'material',
        page: { number: 1, size: 10 },
      }),
    });

    expect(listResponse.status).toBe(200);
    const payload = await listResponse.json();

    expect(payload).toMatchObject({
      catalogPath: '/catalogs/default',
      page: {
        number: 1,
        totalItems: 1,
      },
    });

    expect(payload.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: productId,
          name: productDoc.name,
          path: productPath,
          origin: 'workspace',
          kind: 'material',
          tagsCount: 3,
        }),
      ]),
    );
  });
});
