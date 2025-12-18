import { gql } from 'graphql-request';
import { createTestEnvironment } from './test-environment';
import { WorkspaceUserRole } from './generated/graphql';
import invariant from 'tiny-invariant';

gql`
  query ListWorkspaceMembersTest($workspaceId: String!) {
    listWorkspaceMembers(workspaceId: $workspaceId) {
      items {
        userId
        roles
        user {
          id
          email
          firstName
          lastName
        }
      }
      page {
        totalItems
      }
    }
  }
`;

gql`
  mutation InviteUserToWorkspace(
    $workspaceId: String!
    $email: String!
    $roles: [WorkspaceUserRole!]!
  ) {
    inviteUserToWorkspace(
      workspaceId: $workspaceId
      email: $email
      roles: $roles
    ) {
      userId
      roles
    }
  }
`;

gql`
  mutation updateWorkspaceUserRoles(
    $workspaceId: String!
    $userId: String!
    $roles: [WorkspaceUserRole!]!
  ) {
    updateWorkspaceUserRoles(
      workspaceId: $workspaceId
      userId: $userId
      roles: $roles
    ) {
      userId
      roles
    }
  }
`;

gql`
  mutation removeUserFromWorkspace($workspaceId: String!, $userId: String!) {
    removeUserFromWorkspace(workspaceId: $workspaceId, userId: $userId)
  }
`;

const { createClient } = createTestEnvironment();

describe('Workspace Member Management', () => {
  describe('inviteUserToWorkspace', () => {
    it('should invite a user to a workspace with specified roles', async () => {
      const { sdk, user, utils } = await createClient();

      const workspace = await utils.createWorkspace();

      const { inviteUserToWorkspace } = await sdk.InviteUserToWorkspace({
        workspaceId: workspace.id,
        email: 'hello@world.com',
        roles: [WorkspaceUserRole.AllResourcesReader],
      });

      invariant(inviteUserToWorkspace);
      expect(inviteUserToWorkspace).toMatchObject({
        userId: expect.any(String),
        roles: [WorkspaceUserRole.AllResourcesReader],
      });

      const memebers = await sdk.ListWorkspaceMembersTest({
        workspaceId: workspace.id,
      });

      expect(memebers.listWorkspaceMembers.items).toHaveLength(2);
      expect(memebers.listWorkspaceMembers.items[0]).toMatchObject({
        userId: user.id,
        roles: [WorkspaceUserRole.Admin],
      });
      expect(memebers.listWorkspaceMembers.items[1]).toMatchObject({
        userId: inviteUserToWorkspace.userId,
        roles: [WorkspaceUserRole.AllResourcesReader],
      });
    });

    it('should invite an existing user to a different workspace', async () => {
      const { sdk, user, utils } = await createClient();

      const workspace1 = await utils.createWorkspace();

      const { inviteUserToWorkspace: inviteUserToWorkspace1 } =
        await sdk.InviteUserToWorkspace({
          workspaceId: workspace1.id,
          email: 'hello@world.com',
          roles: [WorkspaceUserRole.AllResourcesReader],
        });

      invariant(inviteUserToWorkspace1);
      expect(inviteUserToWorkspace1).toMatchObject({
        userId: expect.any(String),
        roles: [WorkspaceUserRole.AllResourcesReader],
      });

      const members = await sdk.ListWorkspaceMembersTest({
        workspaceId: workspace1.id,
      });

      expect(members.listWorkspaceMembers.items).toHaveLength(2);
      expect(members.listWorkspaceMembers.items[0]).toMatchObject({
        userId: user.id,
        roles: [WorkspaceUserRole.Admin],
      });
      expect(members.listWorkspaceMembers.items[1]).toMatchObject({
        userId: inviteUserToWorkspace1.userId,
        roles: [WorkspaceUserRole.AllResourcesReader],
      });

      // invite the same email to a different workspace with different roles
      const workspace2 = await utils.createWorkspace();
      const expectedUser2Roles = [
        WorkspaceUserRole.InvoiceManager,
        WorkspaceUserRole.ContactManager,
      ];
      const { inviteUserToWorkspace: inviteUserToWorkspace2 } =
        await sdk.InviteUserToWorkspace({
          workspaceId: workspace2.id,
          email: 'hello@world.com',
          roles: expectedUser2Roles,
        });

      invariant(inviteUserToWorkspace2);
      expect(inviteUserToWorkspace2).toMatchObject({
        userId: expect.any(String),
        roles: expectedUser2Roles,
      });

      const workspace2Members = await sdk.ListWorkspaceMembersTest({
        workspaceId: workspace2.id,
      });

      expect(workspace2Members.listWorkspaceMembers.items).toHaveLength(2);
      expect(workspace2Members.listWorkspaceMembers.items[0]).toMatchObject({
        userId: user.id,
        roles: [WorkspaceUserRole.Admin],
      });
      expect(workspace2Members.listWorkspaceMembers.items[1]).toMatchObject({
        userId: inviteUserToWorkspace2.userId,
        roles: expect.arrayContaining(expectedUser2Roles),
      });
    });

    it('should only allow admins to invite users', async () => {
      const { sdk, utils } = await createClient();

      const workspace = await utils.createWorkspace();

      const { inviteUserToWorkspace } = await sdk.InviteUserToWorkspace({
        workspaceId: workspace.id,
        email: 'hello@world.com',
        roles: [WorkspaceUserRole.AllResourcesReader],
      });

      invariant(inviteUserToWorkspace);
      expect(inviteUserToWorkspace).toMatchObject({
        userId: expect.any(String),
        roles: [WorkspaceUserRole.AllResourcesReader],
      });

      const { sdk: nonAdminSdk } = await createClient({
        userId: inviteUserToWorkspace.userId,
      });

      await expect(
        nonAdminSdk.InviteUserToWorkspace({
          workspaceId: workspace.id,
          email: 'other@world.com',
          roles: [WorkspaceUserRole.AllResourcesReader],
        }),
      ).rejects.toThrow();
    });
  });

  describe('updateWorkspaceUserRoles', () => {
    it('should only allow admins to update user roles', async () => {
      const { sdk, utils } = await createClient();

      const workspace = await utils.createWorkspace();

      const { inviteUserToWorkspace } = await sdk.InviteUserToWorkspace({
        workspaceId: workspace.id,
        email: 'hello@world.com',
        roles: [WorkspaceUserRole.AllResourcesReader],
      });

      invariant(inviteUserToWorkspace);
      expect(inviteUserToWorkspace).toMatchObject({
        userId: expect.any(String),
        roles: [WorkspaceUserRole.AllResourcesReader],
      });

      const { sdk: nonAdminSdk } = await createClient({
        userId: inviteUserToWorkspace.userId,
      });

      await expect(
        nonAdminSdk.updateWorkspaceUserRoles({
          workspaceId: workspace.id,
          userId: inviteUserToWorkspace.userId,
          roles: [WorkspaceUserRole.ProjectManager],
        }),
      ).rejects.toThrow();
    });

    it('should update a workspace member roles', async () => {
      const { sdk, user, utils } = await createClient();

      const workspace = await utils.createWorkspace();

      const { inviteUserToWorkspace } = await sdk.InviteUserToWorkspace({
        workspaceId: workspace.id,
        email: 'hello@world.com',
        roles: [WorkspaceUserRole.AllResourcesReader],
      });

      invariant(inviteUserToWorkspace);
      expect(inviteUserToWorkspace).toMatchObject({
        userId: expect.any(String),
        roles: [WorkspaceUserRole.AllResourcesReader],
      });

      const expectedUpdatedRoles = [
        WorkspaceUserRole.ProjectManager,
        WorkspaceUserRole.ContactManager,
      ];

      const { updateWorkspaceUserRoles } = await sdk.updateWorkspaceUserRoles({
        workspaceId: workspace.id,
        userId: inviteUserToWorkspace.userId,
        roles: expectedUpdatedRoles,
      });

      invariant(updateWorkspaceUserRoles);
      expect(updateWorkspaceUserRoles).toMatchObject({
        userId: inviteUserToWorkspace.userId,
        roles: expect.arrayContaining(expectedUpdatedRoles),
      });
      const members = await sdk.ListWorkspaceMembersTest({
        workspaceId: workspace.id,
      });

      expect(members.listWorkspaceMembers.items).toHaveLength(2);
      expect(members.listWorkspaceMembers.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId: user.id,
            roles: [WorkspaceUserRole.Admin],
          }),
          expect.objectContaining({
            userId: inviteUserToWorkspace.userId,
            roles: expect.arrayContaining(expectedUpdatedRoles),
          }),
        ]),
      );
    });
  });

  describe('listWorkspaceMembers', () => {
    it('should list workspace members with their roles', async () => {
      const { sdk, user, utils } = await createClient();

      const workspace = await utils.createWorkspace();

      const initialMembers = await sdk.ListWorkspaceMembersTest({
        workspaceId: workspace.id,
      });

      // Should have 1 member (the admin who created it)
      expect(initialMembers.listWorkspaceMembers.items).toHaveLength(1);
      expect(initialMembers.listWorkspaceMembers.items[0]).toMatchObject({
        userId: user.id,
        roles: [WorkspaceUserRole.Admin],
      });
    });
  });

  describe('removeUserFromWorkspace', () => {
    it('should remove a user from a workspace', async () => {
      const { sdk, user, utils } = await createClient();

      const workspace = await utils.createWorkspace();

      const { inviteUserToWorkspace } = await sdk.InviteUserToWorkspace({
        workspaceId: workspace.id,
        email: 'hello@world.com',
        roles: [WorkspaceUserRole.AllResourcesReader],
      });
      invariant(inviteUserToWorkspace);

      const membersBefore = await sdk.ListWorkspaceMembersTest({
        workspaceId: workspace.id,
      });
      expect(membersBefore.listWorkspaceMembers.items).toHaveLength(2);

      await sdk.removeUserFromWorkspace({
        workspaceId: workspace.id,
        userId: inviteUserToWorkspace.userId,
      });
      const membersAfter = await sdk.ListWorkspaceMembersTest({
        workspaceId: workspace.id,
      });
      expect(membersAfter.listWorkspaceMembers.items).toHaveLength(1);
      expect(membersAfter.listWorkspaceMembers.items[0]).toMatchObject({
        userId: user.id,
        roles: [WorkspaceUserRole.Admin],
      });

      // list workspace as the removed user should not contain the workspace
      const { sdk: removedUserSdk } = await createClient({
        userId: inviteUserToWorkspace.userId,
      });
      const { listWorkspaces } = await removedUserSdk.ListWorkspaces();
      expect(listWorkspaces.items).not.toContainEqual(
        expect.objectContaining({ id: workspace.id }),
      );
    });

    it('should only allow removing the admin if there is multiple admins', async () => {
      const { sdk, user, utils } = await createClient();

      const workspace = await utils.createWorkspace();

      const { inviteUserToWorkspace } = await sdk.InviteUserToWorkspace({
        workspaceId: workspace.id,
        email: 'hello@world.com',
        roles: [WorkspaceUserRole.AllResourcesReader],
      });
      invariant(inviteUserToWorkspace);

      const membersBefore = await sdk.ListWorkspaceMembersTest({
        workspaceId: workspace.id,
      });
      expect(membersBefore.listWorkspaceMembers.items).toHaveLength(2);

      // should not be able to remove the only admin
      await expect(
        sdk.removeUserFromWorkspace({
          workspaceId: workspace.id,
          userId: user.id,
        }),
      ).rejects.toThrow();

      // elevate the other user to admin
      await sdk.updateWorkspaceUserRoles({
        workspaceId: workspace.id,
        userId: inviteUserToWorkspace.userId,
        roles: [WorkspaceUserRole.Admin],
      });

      const { sdk: newAdminUserSdk } = await createClient({
        userId: inviteUserToWorkspace.userId,
      });

      // now should be able to remove the original admin
      await expect(
        newAdminUserSdk.removeUserFromWorkspace({
          workspaceId: workspace.id,
          userId: user.id,
        }),
      ).resolves.not.toThrow();

      // list members should only contain the other user
      const membersAfter = await newAdminUserSdk.ListWorkspaceMembersTest({
        workspaceId: workspace.id,
      });
      expect(membersAfter.listWorkspaceMembers.items).toHaveLength(1);
      expect(membersAfter.listWorkspaceMembers.items[0]).toMatchObject({
        userId: inviteUserToWorkspace.userId,
        roles: [WorkspaceUserRole.Admin],
      });
    });
  });
});
