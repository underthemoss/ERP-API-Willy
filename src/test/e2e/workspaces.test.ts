import { v4 } from 'uuid';
import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';

const { createClient } = createTestEnvironment();

describe('Workspaces', () => {
  describe('createWorkspace', () => {
    it('should create a workspace with all required fields and auto-extract domain from email', async () => {
      const { client } = await createClient({
        userEmail: `${v4()}@example.com`,
        companyId: '123',
      });
      const mutation = gql`
        mutation CreateWorkspaceWithAllFields(
          $name: String!
          $description: String
          $brandId: String
          $bannerImageUrl: String
          $logoUrl: String
          $accessType: WorkspaceAccessType!
          $archived: Boolean
        ) {
          createWorkspace(
            name: $name
            description: $description
            brandId: $brandId
            bannerImageUrl: $bannerImageUrl
            logoUrl: $logoUrl
            accessType: $accessType
            archived: $archived
          ) {
            id
            companyId
            name
            description
            domain
            brandId
            createdBy
            bannerImageUrl
            logoUrl
            accessType
            archived
            archivedAt
            createdAt
            updatedAt
            updatedBy
            ownerId
          }
        }
      `;

      const variables = {
        name: 'Test Workspace',
        description: 'A test workspace for unit testing',
        brandId: 'brand-123',
        bannerImageUrl: 'https://example.com/banner.jpg',
        logoUrl: 'https://example.com/logo.jpg',
        accessType: 'INVITE_ONLY',
        archived: false,
      };

      const response = await client.request(mutation, variables);

      expect(response.createWorkspace).toBeDefined();
      expect(response.createWorkspace.name).toBe('Test Workspace');
      expect(response.createWorkspace.description).toBe(
        'A test workspace for unit testing',
      );
      expect(response.createWorkspace.domain).toBe('example.com'); // Domain should be auto-extracted from email
      expect(response.createWorkspace.brandId).toBe('brand-123');
      expect(response.createWorkspace.bannerImageUrl).toBe(
        'https://example.com/banner.jpg',
      );
      expect(response.createWorkspace.logoUrl).toBe(
        'https://example.com/logo.jpg',
      );
      expect(response.createWorkspace.accessType).toBe('INVITE_ONLY');
      expect(response.createWorkspace.archived).toBe(false);
      expect(response.createWorkspace.archivedAt).toBeNull();
      expect(response.createWorkspace.createdBy).toBeDefined();
      expect(response.createWorkspace.createdAt).toBeDefined();
      expect(response.createWorkspace.updatedAt).toBeDefined();
      expect(response.createWorkspace.updatedBy).toBeDefined();
      expect(response.createWorkspace.ownerId).toBeDefined();
      expect(response.createWorkspace.companyId).toBeDefined();
    });

    it('should create a workspace with SAME_DOMAIN access type', async () => {
      const { client } = await createClient({
        userEmail: 'user@company.com',
        companyId: '456',
      });
      const mutation = gql`
        mutation CreateWorkspaceWithSameDomain(
          $name: String!
          $accessType: WorkspaceAccessType!
        ) {
          createWorkspace(name: $name, accessType: $accessType) {
            id
            name
            accessType
          }
        }
      `;

      const variables = {
        name: 'Domain Restricted Workspace',
        accessType: 'SAME_DOMAIN',
      };

      const response = await client.request(mutation, variables);

      expect(response.createWorkspace).toBeDefined();
      expect(response.createWorkspace.name).toBe('Domain Restricted Workspace');
      expect(response.createWorkspace.accessType).toBe('SAME_DOMAIN');
    });

    it('should automatically set domain from user email domain', async () => {
      const { client } = await createClient({
        userEmail: 'user@mycompany.com',
        companyId: '789',
      });
      const mutation = gql`
        mutation CreateWorkspaceAutoDomain(
          $name: String!
          $accessType: WorkspaceAccessType!
        ) {
          createWorkspace(name: $name, accessType: $accessType) {
            id
            domain
          }
        }
      `;

      const variables = {
        name: 'Auto Domain Workspace',
        accessType: 'INVITE_ONLY',
      };

      const response = await client.request(mutation, variables);

      expect(response.createWorkspace).toBeDefined();
      expect(response.createWorkspace.domain).toBe('mycompany.com'); // Domain should match email domain
    });
  });

  describe('listWorkspaces', () => {
    it('should list workspaces for the current user company', async () => {
      const { client } = await createClient({ companyId: '999' });
      // First create a workspace
      const createMutation = gql`
        mutation CreateWorkspaceForList {
          createWorkspace(
            name: "List Test Workspace"
            accessType: INVITE_ONLY
          ) {
            id
          }
        }
      `;

      await client.request(createMutation);

      // Then list workspaces
      const query = gql`
        query ListWorkspaces {
          listWorkspaces {
            items {
              id
              name
              accessType
              archived
            }
            page {
              number
              size
              totalItems
              totalPages
            }
          }
        }
      `;

      const response = await client.request(query);

      expect(response.listWorkspaces).toBeDefined();
      expect(response.listWorkspaces.items).toBeDefined();
      expect(Array.isArray(response.listWorkspaces.items)).toBe(true);
      expect(response.listWorkspaces.page).toBeDefined();
      expect(response.listWorkspaces.page.number).toBe(1);

      // Check that our created workspace is in the list
      const createdWorkspace = response.listWorkspaces.items.find(
        (w: any) => w.name === 'List Test Workspace',
      );
      expect(createdWorkspace).toBeDefined();
      expect(createdWorkspace.accessType).toBe('INVITE_ONLY');
      expect(createdWorkspace.archived).toBe(false);
    });
  });

  describe('listJoinableWorkspaces', () => {
    it('should exclude workspaces where user is already a member', async () => {
      const { client } = await createClient({
        companyId: '888',
        userId: 'test-user-joinable',
      });

      // Create a workspace (user will be admin/member automatically)
      const createMutation = gql`
        mutation CreateWorkspaceForJoinableTest {
          createWorkspace(
            name: "Already Member Workspace"
            accessType: INVITE_ONLY
          ) {
            id
          }
        }
      `;

      const createResponse = await client.request(createMutation);
      const createdWorkspaceId = createResponse.createWorkspace.id;

      // List joinable workspaces - should NOT include the workspace we just created
      const listJoinableQuery = gql`
        query ListJoinableWorkspaces {
          listJoinableWorkspaces {
            items {
              id
              name
            }
            page {
              totalItems
            }
          }
        }
      `;

      const joinableResponse = await client.request(listJoinableQuery);

      // The workspace we created should NOT be in the joinable list
      const foundWorkspace = joinableResponse.listJoinableWorkspaces.items.find(
        (w: any) => w.id === createdWorkspaceId,
      );
      expect(foundWorkspace).toBeUndefined();

      // List regular workspaces - should include the workspace we created
      const listWorkspacesQuery = gql`
        query ListMyWorkspaces {
          listWorkspaces {
            items {
              id
              name
            }
          }
        }
      `;

      const workspacesResponse = await client.request(listWorkspacesQuery);

      // The workspace we created SHOULD be in the regular workspaces list
      const foundInRegularList = workspacesResponse.listWorkspaces.items.find(
        (w: any) => w.id === createdWorkspaceId,
      );
      expect(foundInRegularList).toBeDefined();
      expect(foundInRegularList.name).toBe('Already Member Workspace');
    });
  });

  describe('joinWorkspace', () => {
    it('should prevent joining INVITE_ONLY workspace without invitation', async () => {
      // Create workspace with one user
      const { client: adminClient } = await createClient({
        userEmail: 'admin@company1.com',
        companyId: '1003',
        userId: 'admin-user-2',
      });

      const createMutation = gql`
        mutation CreateInviteOnlyWorkspace {
          createWorkspace(
            name: "Invite Only Workspace"
            accessType: INVITE_ONLY
          ) {
            id
          }
        }
      `;

      const createResponse = await adminClient.request(createMutation);
      const workspaceId = createResponse.createWorkspace.id;

      // Try to join with a different user from different domain
      const { client: userClient } = await createClient({
        userEmail: 'user@company2.com',
        companyId: '1004',
        userId: 'regular-user-2',
      });

      const joinMutation = gql`
        mutation AttemptUnauthorizedJoin($workspaceId: String!) {
          joinWorkspace(workspaceId: $workspaceId) {
            id
          }
        }
      `;

      await expect(
        userClient.request(joinMutation, { workspaceId }),
      ).rejects.toThrow('You do not have permission to join this workspace');
    });

    it('should fail to join non-existent workspace', async () => {
      const { client } = await createClient({ companyId: '1005' });

      const joinMutation = gql`
        mutation JoinNonExistentWorkspace {
          joinWorkspace(workspaceId: "non-existent-id") {
            id
          }
        }
      `;

      await expect(client.request(joinMutation)).rejects.toThrow(
        'Workspace not found',
      );
    });
  });
});
