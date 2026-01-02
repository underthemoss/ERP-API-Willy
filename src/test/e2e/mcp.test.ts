import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';
import { ResourceMapTagType } from './generated/graphql';

const { createClient, getApiUrl, mintTestJwtToken } = createTestEnvironment();

// GraphQL mutations for MCP tests
gql`
  mutation CreateProjectForMCP($input: ProjectInput!) {
    createProject(input: $input) {
      id
      name
      workspaceId
    }
  }

  mutation CreateBusinessContactForMCP($input: BusinessContactInput!) {
    createBusinessContact(input: $input) {
      id
      name
      workspaceId
    }
  }

  mutation CreatePersonContactForMCP($input: PersonContactInput!) {
    createPersonContact(input: $input) {
      id
      name
      email
      businessId
      workspaceId
    }
  }

  mutation CreatePimCategoryForMCP($input: UpsertPimCategoryInput!) {
    upsertPimCategory(input: $input) {
      id
      name
    }
  }

  mutation CreatePriceBookForMCP($input: CreatePriceBookInput!) {
    createPriceBook(input: $input) {
      id
      name
      workspaceId
    }
  }

  mutation CreateRentalPriceForMCP($input: CreateRentalPriceInput!) {
    createRentalPrice(input: $input) {
      id
      name
      priceType
      priceBookId
    }
  }

  mutation CreateResourceMapTagForMCP($input: CreateResourceMapTagInput!) {
    createResourceMapTag(input: $input) {
      id
      value
      tagType
    }
  }
`;

/**
 * Helper to parse SSE (Server-Sent Events) response from MCP
 * The MCP Streamable HTTP transport returns responses in SSE format
 */
function parseSSEResponse(sseText: string): unknown[] {
  const results: unknown[] = [];
  const lines = sseText.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const jsonStr = line.slice(6); // Remove 'data: ' prefix
      if (jsonStr.trim()) {
        try {
          results.push(JSON.parse(jsonStr));
        } catch {
          // Ignore parse errors for incomplete data
        }
      }
    }
  }

  return results;
}

/**
 * Helper to make authenticated MCP requests
 */
async function makeMCPRequest(
  apiUrl: string,
  token: string,
  method: string,
  params: Record<string, unknown> = {},
) {
  const response = await fetch(`${apiUrl}/api/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream, application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });

  return response;
}

/**
 * MCP Server E2E Tests
 */
describe('MCP Server', () => {
  describe('Authentication', () => {
    it('should return 401 when no Authorization header is provided', async () => {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {},
        }),
      });

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe(-32000);
      expect(body.error.message).toBe('Authentication required');
    });

    it('should return 401 when Authorization header is not Bearer format', async () => {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic sometoken',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {},
        }),
      });

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe(-32000);
      // The authenticate hook rejects non-Bearer auth before our custom check
      expect(body.error.message).toBe('Authentication required');
    });
  });

  describe('HTTP Methods', () => {
    it('should return 405 for GET requests', async () => {
      const { httpClient } = await createClient();
      const response = await httpClient.fetch('/api/mcp', {
        method: 'GET',
      });

      expect(response.status).toBe(405);
      const body = await response.json();
      expect(body.error.code).toBe(-32000);
      expect(body.error.message).toContain('Method not allowed');
    });
  });

  describe('MCP Tool Calls', () => {
    it('should call list_workspaces tool and return workspace data', async () => {
      // Create a client with a user
      const { utils, user } = await createClient();

      // Create a workspace for the user
      const workspace = await utils.createWorkspace();

      // Mint a JWT token for this specific user
      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      // Call list_workspaces tool
      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'list_workspaces',
        arguments: {},
      });

      expect(response.status).toBe(200);

      // Parse SSE response
      const responseText = await response.text();
      const sseEvents = parseSSEResponse(responseText);

      // Find the result event (should contain tool result)
      expect(sseEvents.length).toBeGreaterThan(0);

      // The response should contain our workspace name
      expect(responseText).toContain(workspace.name);
    });

    it('should call list_projects tool with workspaceId and return project data', async () => {
      // Create a client with a user
      const { sdk, utils, user } = await createClient();

      // Create a workspace
      const workspace = await utils.createWorkspace();

      // Create a project in the workspace
      const projectName = `Test Project ${Date.now()}`;
      const { createProject } = await sdk.CreateProjectForMCP({
        input: {
          workspaceId: workspace.id,
          name: projectName,
          project_code: 'MCP-TEST-001',
          deleted: false,
        },
      });

      expect(createProject).toBeDefined();

      // Mint a JWT token for this specific user
      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      // Call list_projects tool with workspaceId
      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'list_projects',
        arguments: {
          workspaceId: workspace.id,
        },
      });

      expect(response.status).toBe(200);

      // Parse SSE response
      const responseText = await response.text();
      const sseEvents = parseSSEResponse(responseText);

      // Verify response contains SSE events
      expect(sseEvents.length).toBeGreaterThan(0);

      // The response should contain our project name
      expect(responseText).toContain(projectName);
    });

    it('should call list_contacts tool with workspaceId and return contact data', async () => {
      // Create a client with a user
      const { sdk, utils, user } = await createClient();

      // Create a workspace
      const workspace = await utils.createWorkspace();

      // Create a business contact first (required for person contacts)
      const businessName = `Test Business ${Date.now()}`;
      const { createBusinessContact } = await sdk.CreateBusinessContactForMCP({
        input: {
          workspaceId: workspace.id,
          name: businessName,
        },
      });

      expect(createBusinessContact).toBeDefined();

      // Create a person contact associated with the business
      const personName = `Test Person ${Date.now()}`;
      const { createPersonContact } = await sdk.CreatePersonContactForMCP({
        input: {
          workspaceId: workspace.id,
          name: personName,
          email: `test-${Date.now()}@example.com`,
          businessId: createBusinessContact!.id,
        },
      });

      expect(createPersonContact).toBeDefined();

      // Mint a JWT token for this specific user
      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      // Call list_contacts tool with workspaceId
      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'list_contacts',
        arguments: {
          workspaceId: workspace.id,
        },
      });

      expect(response.status).toBe(200);

      // Parse SSE response
      const responseText = await response.text();
      const sseEvents = parseSSEResponse(responseText);

      // Verify response contains SSE events
      expect(sseEvents.length).toBeGreaterThan(0);

      // The response should contain our contact names
      expect(responseText).toContain(businessName);
      expect(responseText).toContain(personName);
    });

    it('should return error for list_projects without workspaceId', async () => {
      const { user } = await createClient();

      // Mint a JWT token
      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      // Call list_projects without workspaceId
      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'list_projects',
        arguments: {},
      });

      expect(response.status).toBe(200);

      // Response should contain an error about missing workspaceId
      const responseText = await response.text();
      expect(responseText).toContain('workspaceId');
    });

    it('should return error for list_contacts without workspaceId', async () => {
      const { user } = await createClient();

      // Mint a JWT token
      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      // Call list_contacts without workspaceId
      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'list_contacts',
        arguments: {},
      });

      expect(response.status).toBe(200);

      // Response should contain an error about missing workspaceId
      const responseText = await response.text();
      expect(responseText).toContain('workspaceId');
    });

    it('should call create_business_contact tool and return created contact', async () => {
      const { utils, user } = await createClient();
      const workspace = await utils.createWorkspace();

      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      const businessName = `MCP Test Business ${Date.now()}`;

      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'create_business_contact',
        arguments: {
          workspaceId: workspace.id,
          name: businessName,
          email: 'business@example.com',
          phone: '555-1234',
          website: 'https://example.com',
        },
      });

      expect(response.status).toBe(200);

      const responseText = await response.text();
      const sseEvents = parseSSEResponse(responseText);
      expect(sseEvents.length).toBeGreaterThan(0);

      // The response should contain the business name and other details
      expect(responseText).toContain(businessName);
      expect(responseText).toContain('555-1234'); // phone
      expect(responseText).toContain('https://example.com'); // website
    });

    it('should call create_person_contact tool and return created contact', async () => {
      const { sdk, utils, user } = await createClient();
      const workspace = await utils.createWorkspace();

      // First create a business contact to link the person to
      const { createBusinessContact } = await sdk.CreateBusinessContactForMCP({
        input: {
          workspaceId: workspace.id,
          name: `Business for Person ${Date.now()}`,
        },
      });

      const { createResourceMapTag } = await sdk.CreateResourceMapTagForMCP({
        input: {
          value: `MCP Location ${Date.now()}`,
          type: ResourceMapTagType.Location,
        },
      });

      if (!createResourceMapTag?.id) {
        throw new Error('Failed to create resource map tag for MCP test');
      }

      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      const personName = `MCP Test Person ${Date.now()}`;
      const personEmail = `person-${Date.now()}@example.com`;

      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'create_person_contact',
        arguments: {
          workspaceId: workspace.id,
          businessId: createBusinessContact!.id,
          name: personName,
          email: personEmail,
          phone: '555-5678',
          resourceMapIds: [createResourceMapTag.id],
        },
      });

      expect(response.status).toBe(200);

      const responseText = await response.text();
      const sseEvents = parseSSEResponse(responseText);
      expect(sseEvents.length).toBeGreaterThan(0);

      // The response should contain the person details
      expect(responseText).toContain(personName);
      expect(responseText).toContain(personEmail);
    });

    it('should call update_business_contact tool and return updated contact', async () => {
      const { sdk, utils, user } = await createClient();
      const workspace = await utils.createWorkspace();

      // Create a business contact first
      const originalName = `Original Business ${Date.now()}`;
      const { createBusinessContact } = await sdk.CreateBusinessContactForMCP({
        input: {
          workspaceId: workspace.id,
          name: originalName,
        },
      });

      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      const updatedName = `Updated Business ${Date.now()}`;

      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'update_business_contact',
        arguments: {
          id: createBusinessContact!.id,
          name: updatedName,
          email: 'updated@example.com',
        },
      });

      expect(response.status).toBe(200);

      const responseText = await response.text();
      const sseEvents = parseSSEResponse(responseText);
      expect(sseEvents.length).toBeGreaterThan(0);

      // The response should contain the updated name
      expect(responseText).toContain(updatedName);
    });

    it('should call update_person_contact tool and return updated contact', async () => {
      const { sdk, utils, user } = await createClient();
      const workspace = await utils.createWorkspace();

      // Create a business contact first
      const { createBusinessContact } = await sdk.CreateBusinessContactForMCP({
        input: {
          workspaceId: workspace.id,
          name: `Business for Update Person Test ${Date.now()}`,
        },
      });

      // Create a person contact
      const originalName = `Original Person ${Date.now()}`;
      const { createPersonContact } = await sdk.CreatePersonContactForMCP({
        input: {
          workspaceId: workspace.id,
          businessId: createBusinessContact!.id,
          name: originalName,
          email: `original-${Date.now()}@example.com`,
        },
      });

      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      const updatedName = `Updated Person ${Date.now()}`;
      const updatedEmail = `updated-${Date.now()}@example.com`;

      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'update_person_contact',
        arguments: {
          id: createPersonContact!.id,
          name: updatedName,
          email: updatedEmail,
        },
      });

      expect(response.status).toBe(200);

      const responseText = await response.text();
      const sseEvents = parseSSEResponse(responseText);
      expect(sseEvents.length).toBeGreaterThan(0);

      // The response should contain the updated details
      expect(responseText).toContain(updatedName);
      expect(responseText).toContain(updatedEmail);
    });

    // Priority 2 - Price Tool Tests

    it('should call create_pricebook tool and return created pricebook', async () => {
      const { utils, user } = await createClient();
      const workspace = await utils.createWorkspace();

      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      const pricebookName = `MCP Test Pricebook ${Date.now()}`;

      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'create_pricebook',
        arguments: {
          workspaceId: workspace.id,
          name: pricebookName,
          notes: 'Test pricebook notes',
          location: 'Test Location',
        },
      });

      expect(response.status).toBe(200);

      const responseText = await response.text();
      const sseEvents = parseSSEResponse(responseText);
      expect(sseEvents.length).toBeGreaterThan(0);

      expect(responseText).toContain(pricebookName);
      expect(responseText).toContain('success');
    });

    it('should call list_pricebooks tool and return pricebook data', async () => {
      const { sdk, utils, user } = await createClient();
      const workspace = await utils.createWorkspace();

      // Create a pricebook via GraphQL first
      const pricebookName = `Test Pricebook ${Date.now()}`;
      const { createPriceBook } = await sdk.CreatePriceBookForMCP({
        input: {
          workspaceId: workspace.id,
          name: pricebookName,
        },
      });
      expect(createPriceBook).toBeDefined();

      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'list_pricebooks',
        arguments: {
          workspaceId: workspace.id,
        },
      });

      expect(response.status).toBe(200);

      const responseText = await response.text();
      const sseEvents = parseSSEResponse(responseText);
      expect(sseEvents.length).toBeGreaterThan(0);

      expect(responseText).toContain(pricebookName);
    });

    it('should call create_rental_price tool and return created price', async () => {
      const { sdk, utils, user } = await createClient();
      const workspace = await utils.createWorkspace();

      // Create a PIM category first
      const categoryId = `mcp-cat-${Date.now()}`;
      const { upsertPimCategory } = await sdk.CreatePimCategoryForMCP({
        input: {
          id: categoryId,
          name: 'MCP Test Category',
          path: '|MCP|',
          platform_id: 'mcp-platform',
          description: 'MCP test category',
          has_products: false,
        },
      });
      expect(upsertPimCategory).toBeDefined();

      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'create_rental_price',
        arguments: {
          workspaceId: workspace.id,
          pimCategoryId: categoryId,
          pricePerDayInCents: 1000,
          pricePerWeekInCents: 5000,
          pricePerMonthInCents: 15000,
          name: 'MCP Rental Price Test',
        },
      });

      expect(response.status).toBe(200);

      const responseText = await response.text();
      const sseEvents = parseSSEResponse(responseText);
      expect(sseEvents.length).toBeGreaterThan(0);

      expect(responseText).toContain('success');
      expect(responseText).toContain('MCP Rental Price Test');
    });

    it('should call create_sale_price tool and return created price', async () => {
      const { sdk, utils, user } = await createClient();
      const workspace = await utils.createWorkspace();

      // Create a PIM category first
      const categoryId = `mcp-sale-cat-${Date.now()}`;
      await sdk.CreatePimCategoryForMCP({
        input: {
          id: categoryId,
          name: 'MCP Sale Test Category',
          path: '|MCP|',
          platform_id: 'mcp-platform',
          description: 'MCP sale test category',
          has_products: false,
        },
      });

      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'create_sale_price',
        arguments: {
          workspaceId: workspace.id,
          pimCategoryId: categoryId,
          unitCostInCents: 25000,
          name: 'MCP Sale Price Test',
        },
      });

      expect(response.status).toBe(200);

      const responseText = await response.text();
      const sseEvents = parseSSEResponse(responseText);
      expect(sseEvents.length).toBeGreaterThan(0);

      expect(responseText).toContain('success');
      expect(responseText).toContain('MCP Sale Price Test');
    });

    it('should call list_prices tool and return prices data', async () => {
      const { sdk, utils, user } = await createClient();
      const workspace = await utils.createWorkspace();

      // Create a PIM category
      const categoryId = `mcp-list-cat-${Date.now()}`;
      await sdk.CreatePimCategoryForMCP({
        input: {
          id: categoryId,
          name: 'MCP List Test Category',
          path: '|MCP|',
          platform_id: 'mcp-platform',
          description: 'MCP list test category',
          has_products: false,
        },
      });

      // Create a rental price via GraphQL
      const { createRentalPrice } = await sdk.CreateRentalPriceForMCP({
        input: {
          workspaceId: workspace.id,
          pimCategoryId: categoryId,
          pricePerDayInCents: 2000,
          pricePerWeekInCents: 10000,
          pricePerMonthInCents: 30000,
          name: 'List Test Rental Price',
        },
      });
      expect(createRentalPrice).toBeDefined();

      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'list_prices',
        arguments: {
          workspaceId: workspace.id,
        },
      });

      expect(response.status).toBe(200);

      const responseText = await response.text();
      const sseEvents = parseSSEResponse(responseText);
      expect(sseEvents.length).toBeGreaterThan(0);

      expect(responseText).toContain('List Test Rental Price');
    });

    it('should call search_prices tool and find prices by name', async () => {
      const { sdk, utils, user } = await createClient();
      const workspace = await utils.createWorkspace();

      // Create a PIM category
      const categoryId = `mcp-search-cat-${Date.now()}`;
      await sdk.CreatePimCategoryForMCP({
        input: {
          id: categoryId,
          name: 'MCP Search Test Category',
          path: '|MCP|',
          platform_id: 'mcp-platform',
          description: 'MCP search test category',
          has_products: false,
        },
      });

      // Create a rental price with unique name
      const uniqueName = `UniqueSearchablePrice_${Date.now()}`;
      await sdk.CreateRentalPriceForMCP({
        input: {
          workspaceId: workspace.id,
          pimCategoryId: categoryId,
          pricePerDayInCents: 3000,
          pricePerWeekInCents: 15000,
          pricePerMonthInCents: 45000,
          name: uniqueName,
        },
      });

      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'search_prices',
        arguments: {
          workspaceId: workspace.id,
          name: 'UniqueSearchable',
        },
      });

      expect(response.status).toBe(200);

      const responseText = await response.text();
      const sseEvents = parseSSEResponse(responseText);
      expect(sseEvents.length).toBeGreaterThan(0);

      expect(responseText).toContain(uniqueName);
    });

    it('should call update_price tool and return updated price', async () => {
      const { sdk, utils, user } = await createClient();
      const workspace = await utils.createWorkspace();

      // Create a PIM category
      const categoryId = `mcp-update-cat-${Date.now()}`;
      await sdk.CreatePimCategoryForMCP({
        input: {
          id: categoryId,
          name: 'MCP Update Test Category',
          path: '|MCP|',
          platform_id: 'mcp-platform',
          description: 'MCP update test category',
          has_products: false,
        },
      });

      // Create a rental price
      const { createRentalPrice } = await sdk.CreateRentalPriceForMCP({
        input: {
          workspaceId: workspace.id,
          pimCategoryId: categoryId,
          pricePerDayInCents: 1000,
          pricePerWeekInCents: 5000,
          pricePerMonthInCents: 15000,
          name: 'Original Price Name',
        },
      });
      expect(createRentalPrice).toBeDefined();

      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      const updatedName = `Updated Price Name ${Date.now()}`;

      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'update_price',
        arguments: {
          id: createRentalPrice!.id,
          name: updatedName,
          pricePerDayInCents: 1500,
        },
      });

      expect(response.status).toBe(200);

      const responseText = await response.text();
      const sseEvents = parseSSEResponse(responseText);
      expect(sseEvents.length).toBeGreaterThan(0);

      expect(responseText).toContain(updatedName);
    });

    it('should call delete_price tool and delete price', async () => {
      const { sdk, utils, user } = await createClient();
      const workspace = await utils.createWorkspace();

      // Create a PIM category
      const categoryId = `mcp-delete-cat-${Date.now()}`;
      await sdk.CreatePimCategoryForMCP({
        input: {
          id: categoryId,
          name: 'MCP Delete Test Category',
          path: '|MCP|',
          platform_id: 'mcp-platform',
          description: 'MCP delete test category',
          has_products: false,
        },
      });

      // Create a rental price to delete
      const { createRentalPrice } = await sdk.CreateRentalPriceForMCP({
        input: {
          workspaceId: workspace.id,
          pimCategoryId: categoryId,
          pricePerDayInCents: 500,
          pricePerWeekInCents: 2500,
          pricePerMonthInCents: 7500,
          name: 'Price To Delete',
        },
      });
      expect(createRentalPrice).toBeDefined();

      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'delete_price',
        arguments: {
          id: createRentalPrice!.id,
        },
      });

      expect(response.status).toBe(200);

      const responseText = await response.text();
      const sseEvents = parseSSEResponse(responseText);
      expect(sseEvents.length).toBeGreaterThan(0);

      expect(responseText).toContain('success');
    });

    // Priority 3 - PIM and Search Tools

    it('should call search_pim tool and return search results', async () => {
      const { sdk, user } = await createClient();

      // Create a PIM category to search for
      const categoryName = `SearchablePIMCategory_${Date.now()}`;
      const categoryId = `search-pim-cat-${Date.now()}`;
      await sdk.CreatePimCategoryForMCP({
        input: {
          id: categoryId,
          name: categoryName,
          path: '|SearchTest|',
          platform_id: 'search-platform',
          description: 'Category for search test',
          has_products: false,
        },
      });

      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'search_pim',
        arguments: {
          searchTerm: 'SearchablePIMCategory',
        },
      });

      expect(response.status).toBe(200);

      const responseText = await response.text();
      const sseEvents = parseSSEResponse(responseText);
      expect(sseEvents.length).toBeGreaterThan(0);

      // Response should include products and categories sections
      expect(responseText).toContain('products');
      expect(responseText).toContain('categories');
      expect(responseText).toContain(categoryName);
    });

    it('should call traverse_pim tool at root level and return root categories', async () => {
      const { sdk, user } = await createClient();

      // Create a root-level PIM category
      const categoryName = `RootTraverseCategory_${Date.now()}`;
      const categoryId = `traverse-root-${Date.now()}`;
      await sdk.CreatePimCategoryForMCP({
        input: {
          id: categoryId,
          name: categoryName,
          path: '', // Root level
          platform_id: categoryId,
          description: 'Root category for traverse test',
          has_products: false,
        },
      });

      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      // Call traverse_pim without categoryId to get root categories
      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'traverse_pim',
        arguments: {},
      });

      expect(response.status).toBe(200);

      const responseText = await response.text();
      const sseEvents = parseSSEResponse(responseText);
      expect(sseEvents.length).toBeGreaterThan(0);

      // Response should indicate root level
      expect(responseText).toContain('isRoot');
      expect(responseText).toContain('childCategories');
    });

    it('should call traverse_pim tool with categoryId and return children', async () => {
      const { sdk, user } = await createClient();

      // Create a parent category
      const parentCategoryId = `traverse-parent-${Date.now()}`;
      await sdk.CreatePimCategoryForMCP({
        input: {
          id: parentCategoryId,
          name: 'Parent Traverse Category',
          path: '',
          platform_id: parentCategoryId,
          description: 'Parent category',
          has_products: false,
        },
      });

      // Create a child category under parent
      const childCategoryName = `ChildTraverseCategory_${Date.now()}`;
      const childCategoryId = `traverse-child-${Date.now()}`;
      await sdk.CreatePimCategoryForMCP({
        input: {
          id: childCategoryId,
          name: childCategoryName,
          path: `|${parentCategoryId}|`,
          platform_id: childCategoryId,
          description: 'Child category for traverse test',
          has_products: false,
        },
      });

      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      // Call traverse_pim with parent categoryId
      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'traverse_pim',
        arguments: {
          categoryId: parentCategoryId,
        },
      });

      expect(response.status).toBe(200);

      const responseText = await response.text();
      const sseEvents = parseSSEResponse(responseText);
      expect(sseEvents.length).toBeGreaterThan(0);

      // Response should include current category and children
      expect(responseText).toContain('currentCategory');
      expect(responseText).toContain('childCategories');
    });

    it('should call brave_search tool and handle missing API key gracefully', async () => {
      const { user } = await createClient();

      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      // Call brave_search - should return error about missing API key
      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'brave_search',
        arguments: {
          query: 'test query',
        },
      });

      expect(response.status).toBe(200);

      const responseText = await response.text();
      const sseEvents = parseSSEResponse(responseText);
      expect(sseEvents.length).toBeGreaterThan(0);

      // Response should indicate API key not configured
      expect(responseText).toContain('BRAVE_SEARCH_API_KEY');
    });

    it('should expose web.fetch tool and block localhost SSRF', async () => {
      const { user } = await createClient();

      const token = await mintTestJwtToken({
        es_user_id: user.id,
        uid: user.id,
        email: user.email,
      });
      const apiUrl = getApiUrl();

      const response = await makeMCPRequest(apiUrl, token, 'tools/call', {
        name: 'web.fetch',
        arguments: {
          url: 'http://localhost:5001/health',
        },
      });

      expect(response.status).toBe(200);

      const responseText = await response.text();
      const sseEvents = parseSSEResponse(responseText);
      expect(sseEvents.length).toBeGreaterThan(0);

      expect(responseText).toContain('Access to private networks is not allowed');
    });
  });
});
