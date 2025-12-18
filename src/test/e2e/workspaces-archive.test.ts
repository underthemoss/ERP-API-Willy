import { createTestEnvironment } from './test-environment';
import { gql } from 'graphql-request';

const { createClient } = createTestEnvironment();

describe('Workspace Archiving', () => {
  describe('archiveWorkspace', () => {
    it('should allow admin to archive a workspace', async () => {
      const { client, utils } = await createClient();

      // Create a workspace (user will be admin automatically)
      const workspace = await utils.createWorkspace();

      // Archive the workspace
      const archiveMutation = gql`
        mutation ArchiveWorkspaceTest($workspaceId: String!) {
          archiveWorkspace(workspaceId: $workspaceId) {
            id
            archived
            archivedAt
            updatedAt
            updatedBy
          }
        }
      `;

      const response = await client.request(archiveMutation, {
        workspaceId: workspace.id,
      });

      expect(response.archiveWorkspace).toBeDefined();
      expect(response.archiveWorkspace.id).toBe(workspace.id);
      expect(response.archiveWorkspace.archived).toBe(true);
      expect(response.archiveWorkspace.archivedAt).toBeDefined();
      expect(response.archiveWorkspace.archivedAt).not.toBeNull();
      expect(response.archiveWorkspace.updatedAt).toBeDefined();
      expect(response.archiveWorkspace.updatedBy).toBeDefined();
    });

    it('should prevent non-admin from archiving a workspace', async () => {
      // Create workspace with admin user
      const { utils: adminUtils } = await createClient({
        userId: 'admin-user-archive',
        userEmail: 'admin@archive-test.com',
      });
      const workspace = await adminUtils.createWorkspace();

      // Create a different user (not admin)
      const { client: nonAdminClient } = await createClient({
        userId: 'non-admin-user-archive',
        userEmail: 'user@archive-test.com',
      });

      // Non-admin cannot archive
      const archiveMutation = gql`
        mutation ArchiveWorkspaceNonAdmin($workspaceId: String!) {
          archiveWorkspace(workspaceId: $workspaceId) {
            id
            archived
          }
        }
      `;

      await expect(
        nonAdminClient.request(archiveMutation, { workspaceId: workspace.id }),
      ).rejects.toThrow('You must be an admin to archive a workspace');
    });

    it('should fail when archiving non-existent workspace', async () => {
      const { client } = await createClient();

      const archiveMutation = gql`
        mutation ArchiveWorkspaceNonExistent($workspaceId: String!) {
          archiveWorkspace(workspaceId: $workspaceId) {
            id
          }
        }
      `;

      await expect(
        client.request(archiveMutation, {
          workspaceId: 'non-existent-workspace-id',
        }),
      ).rejects.toThrow('Workspace not found');
    });

    it('should fail when archiving already archived workspace', async () => {
      const { client, utils } = await createClient();

      // Create and archive a workspace
      const workspace = await utils.createWorkspace();

      const archiveMutation = gql`
        mutation ArchiveWorkspaceAlreadyArchived($workspaceId: String!) {
          archiveWorkspace(workspaceId: $workspaceId) {
            id
            archived
          }
        }
      `;

      await client.request(archiveMutation, { workspaceId: workspace.id });

      // Try to archive again
      await expect(
        client.request(archiveMutation, { workspaceId: workspace.id }),
      ).rejects.toThrow('Workspace is already archived');
    });
  });

  describe('unarchiveWorkspace', () => {
    it('should allow admin to unarchive a workspace', async () => {
      const { client, utils } = await createClient();

      // Create and archive a workspace
      const workspace = await utils.createWorkspace();

      const archiveMutation = gql`
        mutation ArchiveWorkspaceForUnarchiveTest($workspaceId: String!) {
          archiveWorkspace(workspaceId: $workspaceId) {
            id
          }
        }
      `;

      await client.request(archiveMutation, { workspaceId: workspace.id });

      // Unarchive the workspace
      const unarchiveMutation = gql`
        mutation UnarchiveWorkspaceTest($workspaceId: String!) {
          unarchiveWorkspace(workspaceId: $workspaceId) {
            id
            archived
            archivedAt
            updatedAt
            updatedBy
          }
        }
      `;

      const response = await client.request(unarchiveMutation, {
        workspaceId: workspace.id,
      });

      expect(response.unarchiveWorkspace).toBeDefined();
      expect(response.unarchiveWorkspace.id).toBe(workspace.id);
      expect(response.unarchiveWorkspace.archived).toBe(false);
      expect(response.unarchiveWorkspace.archivedAt).toBeNull();
      expect(response.unarchiveWorkspace.updatedAt).toBeDefined();
      expect(response.unarchiveWorkspace.updatedBy).toBeDefined();
    });

    it('should prevent non-admin from unarchiving a workspace', async () => {
      // Create and archive workspace with admin user
      const { client: adminClient, utils: adminUtils } = await createClient({
        userId: 'admin-user-unarchive',
        userEmail: 'admin@unarchive-test.com',
      });
      const workspace = await adminUtils.createWorkspace();

      const archiveMutation = gql`
        mutation ArchiveWorkspaceForNonAdminUnarchiveTest(
          $workspaceId: String!
        ) {
          archiveWorkspace(workspaceId: $workspaceId) {
            id
          }
        }
      `;

      await adminClient.request(archiveMutation, {
        workspaceId: workspace.id,
      });

      // Create a different user (not admin)
      const { client: nonAdminClient } = await createClient({
        userId: 'non-admin-user-unarchive',
        userEmail: 'user@unarchive-test.com',
      });

      // Non-admin cannot unarchive
      const unarchiveMutation = gql`
        mutation UnarchiveWorkspaceNonAdmin($workspaceId: String!) {
          unarchiveWorkspace(workspaceId: $workspaceId) {
            id
          }
        }
      `;

      await expect(
        nonAdminClient.request(unarchiveMutation, {
          workspaceId: workspace.id,
        }),
      ).rejects.toThrow('You must be an admin to unarchive a workspace');
    });

    it('should fail when unarchiving non-existent workspace', async () => {
      const { client } = await createClient();

      const unarchiveMutation = gql`
        mutation UnarchiveWorkspaceNonExistent($workspaceId: String!) {
          unarchiveWorkspace(workspaceId: $workspaceId) {
            id
          }
        }
      `;

      await expect(
        client.request(unarchiveMutation, {
          workspaceId: 'non-existent-workspace-id',
        }),
      ).rejects.toThrow('Workspace not found');
    });

    it('should fail when unarchiving non-archived workspace', async () => {
      const { client, utils } = await createClient();

      // Create a workspace (not archived)
      const workspace = await utils.createWorkspace();

      const unarchiveMutation = gql`
        mutation UnarchiveWorkspaceNotArchived($workspaceId: String!) {
          unarchiveWorkspace(workspaceId: $workspaceId) {
            id
          }
        }
      `;

      await expect(
        client.request(unarchiveMutation, { workspaceId: workspace.id }),
      ).rejects.toThrow('Workspace is not archived');
    });
  });

  describe('listWorkspaces with archived workspaces', () => {
    it('should exclude archived workspaces from listWorkspaces by default', async () => {
      const { client, utils } = await createClient();

      // Create two workspaces
      const workspace1 = await utils.createWorkspace();
      const workspace2 = await utils.createWorkspace();

      // Archive the first workspace
      const archiveMutation = gql`
        mutation ArchiveWorkspaceForListTest($workspaceId: String!) {
          archiveWorkspace(workspaceId: $workspaceId) {
            id
          }
        }
      `;

      await client.request(archiveMutation, { workspaceId: workspace1.id });

      // List workspaces - should only show workspace2
      const listQuery = gql`
        query ListWorkspacesAfterArchive {
          listWorkspaces {
            items {
              id
              name
              archived
            }
            page {
              totalItems
            }
          }
        }
      `;

      const response = await client.request(listQuery);

      expect(response.listWorkspaces).toBeDefined();
      expect(response.listWorkspaces.items).toBeDefined();

      // Archived workspace should not be in the list
      const archivedWorkspace = response.listWorkspaces.items.find(
        (w: any) => w.id === workspace1.id,
      );
      expect(archivedWorkspace).toBeUndefined();

      // Non-archived workspace should be in the list
      const activeWorkspace = response.listWorkspaces.items.find(
        (w: any) => w.id === workspace2.id,
      );
      expect(activeWorkspace).toBeDefined();
      expect(activeWorkspace.archived).toBe(false);
    });

    it('should include workspace after unarchiving', async () => {
      const { client, utils } = await createClient();

      // Create and archive a workspace
      const workspace = await utils.createWorkspace();

      const archiveMutation = gql`
        mutation ArchiveWorkspaceForUnarchiveListTest($workspaceId: String!) {
          archiveWorkspace(workspaceId: $workspaceId) {
            id
          }
        }
      `;

      await client.request(archiveMutation, { workspaceId: workspace.id });

      // List workspaces - should not include archived workspace
      const listQuery = gql`
        query ListWorkspacesBeforeUnarchive {
          listWorkspaces {
            items {
              id
            }
          }
        }
      `;

      let response = await client.request(listQuery);
      let foundWorkspace = response.listWorkspaces.items.find(
        (w: any) => w.id === workspace.id,
      );
      expect(foundWorkspace).toBeUndefined();

      // Unarchive the workspace
      const unarchiveMutation = gql`
        mutation UnarchiveWorkspaceForListTest($workspaceId: String!) {
          unarchiveWorkspace(workspaceId: $workspaceId) {
            id
          }
        }
      `;

      await client.request(unarchiveMutation, { workspaceId: workspace.id });

      // List workspaces - should now include the workspace
      response = await client.request(listQuery);
      foundWorkspace = response.listWorkspaces.items.find(
        (w: any) => w.id === workspace.id,
      );
      expect(foundWorkspace).toBeDefined();
      expect(foundWorkspace.id).toBe(workspace.id);
    });
  });
});
