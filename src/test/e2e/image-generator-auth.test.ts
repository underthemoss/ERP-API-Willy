import { createTestEnvironment } from './test-environment';

const { createAnonTestClient } = createTestEnvironment();

describe('Image generator auth', () => {
  it('returns 401 (not 500) for invalid cookie tokens', async () => {
    const { httpClient } = createAnonTestClient();

    const response = await httpClient.fetch(
      '/api/images/prices/PR-DOES-NOT-MATTER',
      {
        headers: {
          Cookie: 'es-erp-jwt=bogus',
        },
      },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Not Authorized',
    });
  });
});

