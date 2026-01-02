import { createTestEnvironment } from './test-environment';
import { v4 } from 'uuid';
import { WorkspaceAccessType } from './generated/graphql';

const { createClient, createAnonTestClient } = createTestEnvironment();

describe('Searchkit Prices Authorization e2e', () => {
  describe('CORS preflight', () => {
    it('allows x-workspace-id header', async () => {
      const { httpClient } = createAnonTestClient();

      const response = await httpClient.fetch('/api/search/_msearch', {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'x-workspace-id,content-type',
        },
      });

      expect([200, 204]).toContain(response.status);

      const allowHeaders = response.headers.get('access-control-allow-headers');
      expect(allowHeaders?.toLowerCase()).toContain('x-workspace-id');
    });
  });

  /**
   * Helper to build InstantSearch request body with facetFilters
   */
  function buildSearchBody(
    indexName: string,
    facetFilters: string[] = [],
  ): unknown[] {
    return [
      {
        indexName,
        params: {
          query: '',
          facetFilters,
          hitsPerPage: 10,
          page: 0,
        },
      },
    ];
  }

  describe('priceBookId filter authorization', () => {
    it('returns 200 when user has USER_READ permission on priceBook', async () => {
      // Create user and set up workspace and price book
      const { sdk, httpClient } = await createClient();

      // Create workspace (user automatically has access as creator)
      const { createWorkspace } = await sdk.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.InviteOnly,
        name: 'SearchKit AuthZ Test Workspace',
      });
      const workspaceId = createWorkspace!.id;

      // Create price book (user automatically has access via workspace)
      const { createPriceBook } = await sdk.CreatePriceBook({
        input: { name: 'AuthZ Test Price Book', workspaceId },
      });
      const priceBookId = createPriceBook!.id;

      // Make searchkit request with priceBookId filter
      const body = buildSearchBody('es_erp_prices', [
        `priceBookId:${priceBookId}`,
      ]);
      const response = await httpClient.fetch('/api/search/_msearch', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      expect(response.status).toBe(200);
    });

    it('returns 403 when user lacks permission on priceBookId', async () => {
      // Create admin user to set up workspace and price book
      const adminClient = await createClient();
      const { sdk: adminSdk } = adminClient;

      // Create workspace
      const { createWorkspace } = await adminSdk.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.InviteOnly,
        name: 'SearchKit AuthZ Test Workspace - No Access',
      });
      const workspaceId = createWorkspace!.id;

      // Create price book
      const { createPriceBook } = await adminSdk.CreatePriceBook({
        input: { name: 'AuthZ Test Price Book - No Access', workspaceId },
      });
      const priceBookId = createPriceBook!.id;

      // Create a separate user who will make the HTTP request (without granting access)
      const testUserId = v4();
      const testClient = await createClient({ userId: testUserId });

      // Make searchkit request with priceBookId filter (user has no access)
      const body = buildSearchBody('es_erp_prices', [
        `priceBookId:${priceBookId}`,
      ]);
      const response = await testClient.httpClient.fetch(
        '/api/search/_msearch',
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      );

      expect(response.status).toBe(403);
    });
  });

  describe('search without filters', () => {
    it('returns 400 when no priceBookId or workspaceId filter is provided', async () => {
      // Create user
      const { httpClient } = await createClient();

      // Make searchkit request without any filters
      const body = buildSearchBody('es_erp_prices', []);
      const response = await httpClient.fetch('/api/search/_msearch', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      // Should get 400 because priceBookId or workspaceId filter is required
      expect(response.status).toBe(400);
    });
  });

  describe('workspaceId filter authorization', () => {
    it('returns 200 when user has read_prices permission on workspace', async () => {
      // Create user and set up workspace
      const { sdk, httpClient } = await createClient();

      // Create workspace (user automatically has access as creator)
      const { createWorkspace } = await sdk.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.InviteOnly,
        name: 'SearchKit WorkspaceId AuthZ Test',
      });
      const workspaceId = createWorkspace!.id;

      // Make searchkit request with workspaceId filter
      const body = buildSearchBody('es_erp_prices', [
        `workspaceId:${workspaceId}`,
      ]);
      const response = await httpClient.fetch('/api/search/_msearch', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      expect(response.status).toBe(200);
    });

    it('returns 403 when user lacks permission on workspaceId', async () => {
      // Create admin user to set up workspace
      const adminClient = await createClient();
      const { sdk: adminSdk } = adminClient;

      // Create workspace
      const { createWorkspace } = await adminSdk.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.InviteOnly,
        name: 'SearchKit WorkspaceId AuthZ Test - No Access',
      });
      const workspaceId = createWorkspace!.id;

      // Create a separate user who will make the HTTP request (without granting access)
      const testUserId = v4();
      const testClient = await createClient({ userId: testUserId });

      // Make searchkit request with workspaceId filter (user has no access)
      const body = buildSearchBody('es_erp_prices', [
        `workspaceId:${workspaceId}`,
      ]);
      const response = await testClient.httpClient.fetch(
        '/api/search/_msearch',
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      );

      expect(response.status).toBe(403);
    });
  });

  describe('multiple priceBookId filters', () => {
    it('returns 403 when user lacks permission on any priceBookId', async () => {
      // Create admin user to set up workspace and price books
      const adminClient = await createClient();
      const { sdk: adminSdk, httpClient: adminHttpClient } = adminClient;

      // Create workspace for authorized priceBook
      const { createWorkspace } = await adminSdk.UtilCreateWorkspace({
        accessType: WorkspaceAccessType.InviteOnly,
        name: 'SearchKit Multiple PriceBooks Test',
      });
      const workspaceId = createWorkspace!.id;

      // Create authorized price book
      const { createPriceBook: priceBook1 } = await adminSdk.CreatePriceBook({
        input: { name: 'AuthZ Test Price Book 1 - Authorized', workspaceId },
      });
      const priceBookId1 = priceBook1!.id;

      {
        // verify admin has access to priceBookId1
        const body = buildSearchBody('es_erp_prices', [
          `priceBookId:${priceBookId1}`,
        ]);
        const response = await adminHttpClient.fetch('/api/search/_msearch', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        expect(response.status).toBe(200);
      }

      // Create a fake priceBookId that doesn't exist (and user has no access to)
      const unauthorizedPriceBookId = v4();

      // Make searchkit request with one authorized and one unauthorized priceBookId
      const body = buildSearchBody('es_erp_prices', [
        `priceBookId:${priceBookId1}`,
        `priceBookId:${unauthorizedPriceBookId}`,
      ]);
      const response = await adminHttpClient.fetch('/api/search/_msearch', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      // Should get 403 because user lacks permission on unauthorizedPriceBookId
      expect(response.status).toBe(403);
    });
  });
});
