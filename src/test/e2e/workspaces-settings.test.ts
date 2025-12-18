import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';

const { createClient, getSpiceClient } = createTestEnvironment();

describe('Workspace Settings Mutations', () => {
  describe('updateWorkspaceSettings', () => {
    it('should update workspace settings as admin', async () => {
      const { client } = await createClient({
        userEmail: 'admin@company.com',
        companyId: '2001',
        userId: 'admin-settings-1',
      });

      // First create a workspace
      const createMutation = gql`
        mutation CreateWorkspaceForSettings {
          createWorkspace(
            name: "Original Workspace"
            description: "Original description"
            accessType: INVITE_ONLY
          ) {
            id
            name
            description
          }
        }
      `;

      const createResponse = await client.request(createMutation);
      const workspaceId = createResponse.createWorkspace.id;

      // Update workspace settings
      const updateMutation = gql`
        mutation UpdateWorkspaceSettings(
          $workspaceId: String!
          $name: String
          $description: String
          $brandId: String
          $logoUrl: String
          $bannerImageUrl: String
        ) {
          updateWorkspaceSettings(
            workspaceId: $workspaceId
            name: $name
            description: $description
            brandId: $brandId
            logoUrl: $logoUrl
            bannerImageUrl: $bannerImageUrl
          ) {
            id
            name
            description
            brandId
            logoUrl
            bannerImageUrl
            updatedBy
          }
        }
      `;

      const updateVariables = {
        workspaceId,
        name: 'Updated Workspace Name',
        description: 'Updated description',
        brandId: 'brand-456',
        logoUrl: 'https://example.com/new-logo.png',
        bannerImageUrl: 'https://example.com/new-banner.png',
      };

      const updateResponse = await client.request(
        updateMutation,
        updateVariables,
      );

      expect(updateResponse.updateWorkspaceSettings).toBeDefined();
      expect(updateResponse.updateWorkspaceSettings.id).toBe(workspaceId);
      expect(updateResponse.updateWorkspaceSettings.name).toBe(
        'Updated Workspace Name',
      );
      expect(updateResponse.updateWorkspaceSettings.description).toBe(
        'Updated description',
      );
      expect(updateResponse.updateWorkspaceSettings.brandId).toBe('brand-456');
      expect(updateResponse.updateWorkspaceSettings.logoUrl).toBe(
        'https://example.com/new-logo.png',
      );
      expect(updateResponse.updateWorkspaceSettings.bannerImageUrl).toBe(
        'https://example.com/new-banner.png',
      );
      expect(updateResponse.updateWorkspaceSettings.updatedBy).toBe(
        'admin-settings-1',
      );
    });

    it('should update only provided fields (PATCH behavior)', async () => {
      const { client } = await createClient({
        userEmail: 'admin@company.com',
        companyId: '2002',
        userId: 'admin-settings-2',
      });

      // Create a workspace with all fields
      const createMutation = gql`
        mutation CreateWorkspaceWithAllFieldsForPatch {
          createWorkspace(
            name: "Full Workspace"
            description: "Full description"
            brandId: "brand-original"
            logoUrl: "https://example.com/original-logo.png"
            bannerImageUrl: "https://example.com/original-banner.png"
            accessType: INVITE_ONLY
          ) {
            id
            name
            description
            brandId
            logoUrl
            bannerImageUrl
          }
        }
      `;

      const createResponse = await client.request(createMutation);
      const workspaceId = createResponse.createWorkspace.id;

      // Update only the name, other fields should remain unchanged
      const updateMutation = gql`
        mutation UpdateOnlyName($workspaceId: String!, $name: String) {
          updateWorkspaceSettings(workspaceId: $workspaceId, name: $name) {
            id
            name
            description
            brandId
            logoUrl
            bannerImageUrl
          }
        }
      `;

      const updateResponse = await client.request(updateMutation, {
        workspaceId,
        name: 'Only Name Updated',
      });

      expect(updateResponse.updateWorkspaceSettings.name).toBe(
        'Only Name Updated',
      );
      expect(updateResponse.updateWorkspaceSettings.description).toBe(
        'Full description',
      );
      expect(updateResponse.updateWorkspaceSettings.brandId).toBe(
        'brand-original',
      );
      expect(updateResponse.updateWorkspaceSettings.logoUrl).toBe(
        'https://example.com/original-logo.png',
      );
      expect(updateResponse.updateWorkspaceSettings.bannerImageUrl).toBe(
        'https://example.com/original-banner.png',
      );
    });

    it('should fail if user is not admin', async () => {
      // Create workspace with admin user
      const { client: adminClient } = await createClient({
        userEmail: 'admin@company.com',
        companyId: '2003',
        userId: 'admin-settings-3',
      });

      const createMutation = gql`
        mutation CreateWorkspaceForNonAdminTest {
          createWorkspace(
            name: "Admin Only Workspace"
            accessType: INVITE_ONLY
          ) {
            id
          }
        }
      `;

      const createResponse = await adminClient.request(createMutation);
      const workspaceId = createResponse.createWorkspace.id;

      // Try to update with non-admin user
      const { client: userClient } = await createClient({
        userEmail: 'user@company.com',
        companyId: '2003',
        userId: 'regular-user-settings',
      });

      const updateMutation = gql`
        mutation AttemptUnauthorizedUpdate($workspaceId: String!) {
          updateWorkspaceSettings(
            workspaceId: $workspaceId
            name: "Unauthorized Update"
          ) {
            id
          }
        }
      `;

      await expect(
        userClient.request(updateMutation, { workspaceId }),
      ).rejects.toThrow('You must be an admin to update workspace settings');
    });

    it('should fail with empty workspace name', async () => {
      const { client } = await createClient({
        userEmail: 'admin@company.com',
        companyId: '2004',
        userId: 'admin-settings-4',
      });

      const createMutation = gql`
        mutation CreateWorkspaceForEmptyNameTest {
          createWorkspace(name: "Valid Name", accessType: INVITE_ONLY) {
            id
          }
        }
      `;

      const createResponse = await client.request(createMutation);
      const workspaceId = createResponse.createWorkspace.id;

      const updateMutation = gql`
        mutation UpdateWithEmptyName($workspaceId: String!) {
          updateWorkspaceSettings(workspaceId: $workspaceId, name: "") {
            id
          }
        }
      `;

      await expect(
        client.request(updateMutation, { workspaceId }),
      ).rejects.toThrow('Workspace name cannot be empty');
    });

    it('should fail for non-existent workspace', async () => {
      const { client } = await createClient({
        userEmail: 'admin@company.com',
        companyId: '2005',
      });

      const updateMutation = gql`
        mutation UpdateNonExistentWorkspace {
          updateWorkspaceSettings(
            workspaceId: "non-existent-id"
            name: "New Name"
          ) {
            id
          }
        }
      `;

      await expect(client.request(updateMutation)).rejects.toThrow(
        'Workspace not found',
      );
    });
  });

  describe('updateWorkspaceAccessType', () => {
    it('should update access type from INVITE_ONLY to SAME_DOMAIN', async () => {
      const { client } = await createClient({
        userEmail: 'admin@company.com',
        companyId: '2006',
        userId: 'admin-access-1',
      });

      // Create workspace with INVITE_ONLY
      const createMutation = gql`
        mutation CreateInviteOnlyWorkspaceForAccessType {
          createWorkspace(
            name: "Invite Only Workspace"
            accessType: INVITE_ONLY
          ) {
            id
            accessType
            domain
          }
        }
      `;

      const createResponse = await client.request(createMutation);
      const workspaceId = createResponse.createWorkspace.id;
      expect(createResponse.createWorkspace.accessType).toBe('INVITE_ONLY');

      // Update to SAME_DOMAIN
      const updateMutation = gql`
        mutation UpdateToSameDomain($workspaceId: String!) {
          updateWorkspaceAccessType(
            workspaceId: $workspaceId
            accessType: SAME_DOMAIN
          ) {
            id
            accessType
            updatedBy
          }
        }
      `;

      const updateResponse = await client.request(updateMutation, {
        workspaceId,
      });

      expect(updateResponse.updateWorkspaceAccessType.accessType).toBe(
        'SAME_DOMAIN',
      );
      expect(updateResponse.updateWorkspaceAccessType.updatedBy).toBe(
        'admin-access-1',
      );
    });

    it('should update access type from SAME_DOMAIN to INVITE_ONLY', async () => {
      const { client } = await createClient({
        userEmail: 'admin@company.com',
        companyId: '2007',
        userId: 'admin-access-2',
      });

      // Create workspace with SAME_DOMAIN
      const createMutation = gql`
        mutation CreateSameDomainWorkspace {
          createWorkspace(
            name: "Same Domain Workspace"
            accessType: SAME_DOMAIN
          ) {
            id
            accessType
            domain
          }
        }
      `;

      const createResponse = await client.request(createMutation);
      const workspaceId = createResponse.createWorkspace.id;
      expect(createResponse.createWorkspace.accessType).toBe('SAME_DOMAIN');

      // Update to INVITE_ONLY
      const updateMutation = gql`
        mutation UpdateToInviteOnly($workspaceId: String!) {
          updateWorkspaceAccessType(
            workspaceId: $workspaceId
            accessType: INVITE_ONLY
          ) {
            id
            accessType
            updatedBy
          }
        }
      `;

      const updateResponse = await client.request(updateMutation, {
        workspaceId,
      });

      expect(updateResponse.updateWorkspaceAccessType.accessType).toBe(
        'INVITE_ONLY',
      );
      expect(updateResponse.updateWorkspaceAccessType.updatedBy).toBe(
        'admin-access-2',
      );
    });

    it('should fail if user is not admin', async () => {
      // Create workspace with admin user
      const { client: adminClient } = await createClient({
        userEmail: 'admin@company.com',
        companyId: '2008',
        userId: 'admin-access-3',
      });

      const createMutation = gql`
        mutation CreateWorkspaceForAccessTypeTest {
          createWorkspace(
            name: "Admin Only Access Type"
            accessType: INVITE_ONLY
          ) {
            id
          }
        }
      `;

      const createResponse = await adminClient.request(createMutation);
      const workspaceId = createResponse.createWorkspace.id;

      // Try to update with non-admin user
      const { client: userClient } = await createClient({
        userEmail: 'user@company.com',
        companyId: '2008',
        userId: 'regular-user-access',
      });

      const updateMutation = gql`
        mutation AttemptUnauthorizedAccessTypeUpdate($workspaceId: String!) {
          updateWorkspaceAccessType(
            workspaceId: $workspaceId
            accessType: SAME_DOMAIN
          ) {
            id
          }
        }
      `;

      await expect(
        userClient.request(updateMutation, { workspaceId }),
      ).rejects.toThrow('You must be an admin to update workspace access type');
    });

    it('should fail for non-existent workspace', async () => {
      const { client } = await createClient({
        userEmail: 'admin@company.com',
        companyId: '2009',
      });

      const updateMutation = gql`
        mutation UpdateAccessTypeNonExistent {
          updateWorkspaceAccessType(
            workspaceId: "non-existent-id"
            accessType: SAME_DOMAIN
          ) {
            id
          }
        }
      `;

      await expect(client.request(updateMutation)).rejects.toThrow(
        'Workspace not found',
      );
    });

    it('should verify SpiceDB relationships are updated correctly', async () => {
      const { client } = await createClient({
        userEmail: 'admin@testdomain.com',
        companyId: '2010',
        userId: 'admin-spicedb-test',
      });

      // Create workspace with INVITE_ONLY
      const createMutation = gql`
        mutation CreateWorkspaceForSpiceDBTest {
          createWorkspace(
            name: "SpiceDB Test Workspace"
            accessType: INVITE_ONLY
          ) {
            id
            accessType
            domain
          }
        }
      `;

      const createResponse = await client.request(createMutation);
      const workspaceId = createResponse.createWorkspace.id;
      const domain = createResponse.createWorkspace.domain;
      expect(domain).toBe('testdomain.com');

      // Update to SAME_DOMAIN - should create domain relationship
      const updateToSameDomain = gql`
        mutation UpdateToSameDomainSpiceDB($workspaceId: String!) {
          updateWorkspaceAccessType(
            workspaceId: $workspaceId
            accessType: SAME_DOMAIN
          ) {
            id
            accessType
          }
        }
      `;

      await client.request(updateToSameDomain, { workspaceId });

      // Now a user from the same domain should be able to see it in joinable workspaces
      const { client: sameDomainclient } = await createClient({
        userEmail: 'newuser@testdomain.com',
        companyId: '2010',
        userId: 'same-domain-user',
      });

      // Use SpiceDB client directly to set up the new user with a connection to the domain testdomain_com
      const spiceClient = getSpiceClient();
      const { v1 } = await import('@authzed/authzed-node');

      // Create the relationship directly using the raw SpiceDB client
      await spiceClient.writeRelationships(
        v1.WriteRelationshipsRequest.create({
          updates: [
            v1.RelationshipUpdate.create({
              operation: v1.RelationshipUpdate_Operation.CREATE,
              relationship: v1.Relationship.create({
                resource: v1.ObjectReference.create({
                  objectType: 'erp/domain',
                  objectId: 'testdomain_com',
                }),
                relation: 'member',
                subject: v1.SubjectReference.create({
                  object: v1.ObjectReference.create({
                    objectType: 'erp/user',
                    objectId: 'same-domain-user',
                  }),
                }),
              }),
            }),
          ],
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const listJoinableQuery = gql`
        query ListJoinableAfterSameDomain {
          listJoinableWorkspaces {
            items {
              id
              name
            }
          }
        }
      `;

      const joinableResponse =
        await sameDomainclient.request(listJoinableQuery);

      // Debug: Log the response to understand what's being returned
      console.log(
        'Joinable workspaces response:',
        JSON.stringify(joinableResponse, null, 2),
      );
      console.log('Looking for workspace ID:', workspaceId);

      const foundWorkspace = joinableResponse.listJoinableWorkspaces.items.find(
        (w: any) => w.id === workspaceId,
      );
      expect(foundWorkspace).toBeDefined();
      expect(foundWorkspace.name).toBe('SpiceDB Test Workspace');

      // Update back to INVITE_ONLY - should remove domain relationship
      const updateToInviteOnly = gql`
        mutation UpdateToInviteOnlySpiceDB($workspaceId: String!) {
          updateWorkspaceAccessType(
            workspaceId: $workspaceId
            accessType: INVITE_ONLY
          ) {
            id
            accessType
          }
        }
      `;

      await client.request(updateToInviteOnly, { workspaceId });
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Now the same domain user should NOT see it in joinable workspaces
      const joinableResponse2 =
        await sameDomainclient.request(listJoinableQuery);
      const notFoundWorkspace =
        joinableResponse2.listJoinableWorkspaces.items.find(
          (w: any) => w.id === workspaceId,
        );
      expect(notFoundWorkspace).toBeUndefined();
    });
  });
});
