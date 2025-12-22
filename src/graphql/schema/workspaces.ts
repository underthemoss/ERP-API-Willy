import {
  objectType,
  extendType,
  stringArg,
  nonNull,
  booleanArg,
  enumType,
  arg,
  list,
} from 'nexus';
import { PaginationInfo, PageInfoInput } from './common';
import { dropNullKeys } from '../utils';
import {
  ERP_WORKSPACE_SUBJECT_RELATIONS,
  ERP_WORKSPACE_SUBJECT_RELATIONS_MAP,
  RESOURCE_TYPES,
} from '../../lib/authz';

const userRoles = Object.entries(ERP_WORKSPACE_SUBJECT_RELATIONS_MAP)
  .filter(([key, value]) => value.subjectType === RESOURCE_TYPES.ERP_USER)
  .map(([key, value]) => ({
    ...value,
    subjectRelationKey: key as ERP_WORKSPACE_SUBJECT_RELATIONS,
  }));

export const WorkspaceAccessType = enumType({
  name: 'WorkspaceAccessType',
  members: ['INVITE_ONLY', 'SAME_DOMAIN'],
});

export const WorkspaceUserRole = enumType({
  sourceType: {
    export: 'ERP_WORKSPACE_RELATIONS',
    module: require.resolve('../../lib/authz/spicedb-generated-types'),
  },
  name: 'WorkspaceUserRole',
  members: userRoles.map((role) => ({
    name: role.relation,
    value: role.relation,
  })),
  description:
    'Roles a user can have in a workspace (auto-generated from SpiceDB schema)',
});

export const WorkspaceRoleInfo = objectType({
  name: 'WorkspaceRoleInfo',
  definition(t) {
    t.nonNull.field('role', { type: WorkspaceUserRole });
    t.string('label');
    t.string('description');
  },
});

export const Workspace = objectType({
  name: 'Workspace',
  definition(t) {
    t.nonNull.id('id');
    t.int('companyId', {
      resolve: (ws) =>
        Number.isInteger((ws as any).companyId) ? (ws as any).companyId : null,
    });
    t.nonNull.string('name');
    t.string('description');
    t.string('domain');
    t.string('brandId');
    t.id('orgBusinessContactId');
    t.string('createdBy');
    t.string('bannerImageUrl');
    t.string('logoUrl');
    t.field('accessType', { type: WorkspaceAccessType });
    t.boolean('archived');
    t.string('archivedAt');
    t.string('createdAt');
    t.string('updatedAt');
    t.string('updatedBy');
    t.string('ownerId');
    t.field('orgBusinessContact', {
      type: 'BusinessContact',
      resolve: async (parent, _args, ctx) => {
        const orgBusinessContactId = (parent as any).orgBusinessContactId;
        if (!orgBusinessContactId) return null;
        const contact =
          await ctx.dataloaders.contacts.getContactsById.load(
            orgBusinessContactId,
          );
        if (!contact || contact.contactType !== 'BUSINESS') return null;
        return contact;
      },
    });
  },
});

export const ListWorkspacesResult = objectType({
  name: 'ListWorkspacesResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: Workspace });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const WorkspaceMember = objectType({
  name: 'WorkspaceMember',
  definition(t) {
    t.nonNull.string('userId');
    t.nonNull.list.nonNull.field('roles', { type: WorkspaceUserRole });
    t.field('user', {
      type: 'User',
      resolve: async (parent, _, ctx) => {
        if (!parent.userId) return null;
        return ctx.dataloaders.users.getUsersById.load(parent.userId);
      },
    });
  },
});

export const ListWorkspaceMembersResult = objectType({
  name: 'ListWorkspaceMembersResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: WorkspaceMember });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const Query = extendType({
  type: 'Query',
  definition(t) {
    t.field('getWorkspaceById', {
      type: 'Workspace',
      args: {
        id: nonNull(stringArg()),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        return ctx.services.workspaceService.getWorkspaceById(
          args.id,
          ctx.user,
        );
      },
    });

    t.nonNull.field('listWorkspaces', {
      type: ListWorkspacesResult,
      args: {
        page: arg({ type: PageInfoInput }),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        const { items, page } =
          await ctx.services.workspaceService.listWorkspaces(
            ctx.user,
            args.page ?? undefined,
          );
        return {
          items,
          page,
        };
      },
    });

    t.nonNull.field('listJoinableWorkspaces', {
      type: ListWorkspacesResult,
      args: {
        page: arg({ type: PageInfoInput }),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        const { items, page } =
          await ctx.services.workspaceService.listJoinableWorkspaces(
            ctx.user,
            args.page ?? undefined,
          );
        return {
          items,
          page,
        };
      },
    });

    t.nonNull.field('listWorkspaceMembers', {
      type: ListWorkspaceMembersResult,
      args: {
        workspaceId: nonNull(stringArg()),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }
        const { items, page } =
          await ctx.services.workspaceService.listWorkspaceMembers(
            args.workspaceId,
            ctx.user,
          );

        return {
          items,
          page,
        };
      },
    });
  },
});

export const Mutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createWorkspace', {
      type: 'Workspace',
      args: {
        name: nonNull(stringArg()),
        description: stringArg(),
        brandId: stringArg(),
        bannerImageUrl: stringArg(),
        logoUrl: stringArg(),
        accessType: nonNull(arg({ type: WorkspaceAccessType })),
        archived: booleanArg(),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        // Extract domain from user's email
        const userEmail = ctx.user.email;
        if (!userEmail) {
          throw new Error('User email is required to create a workspace');
        }

        const userEmailDomain = userEmail.split('@')[1]?.toLowerCase();
        if (!userEmailDomain) {
          throw new Error('Invalid user email format');
        }

        const workspace = await ctx.services.workspaceService.createWorkspace(
          {
            ownerId: ctx.user.id,
            companyId: parseInt(ctx.user.companyId, 10),
            createdBy: ctx.user.id,
            name: args.name,
            description: args.description || undefined,
            domain: userEmailDomain,
            brandId: args.brandId || undefined,
            bannerImageUrl: args.bannerImageUrl || undefined,
            logoUrl: args.logoUrl || undefined,
            accessType: args.accessType,
            archived: args.archived || false,
          },
          ctx.user,
        );

        return workspace;
      },
    });

    t.field('joinWorkspace', {
      type: 'Workspace',
      args: {
        workspaceId: nonNull(stringArg()),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        const workspace = await ctx.services.workspaceService.joinWorkspace(
          args.workspaceId,
          ctx.user,
        );

        return workspace;
      },
    });

    t.field('updateWorkspaceSettings', {
      type: 'Workspace',
      args: {
        workspaceId: nonNull(stringArg()),
        name: stringArg(),
        description: stringArg(),
        brandId: stringArg(),
        orgBusinessContactId: stringArg(),
        logoUrl: stringArg(),
        bannerImageUrl: stringArg(),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        const { workspaceId, orgBusinessContactId, ...rawUpdates } = args;

        // Use dropNullKeys utility to filter out null values
        const updates = dropNullKeys(rawUpdates) as {
          name?: string;
          description?: string;
          brandId?: string;
          logoUrl?: string;
          bannerImageUrl?: string;
          orgBusinessContactId?: string | null;
        };

        if (orgBusinessContactId !== undefined) {
          if (orgBusinessContactId && orgBusinessContactId.trim().length > 0) {
            const contact =
              await ctx.services.contactsService.getContactById(
                orgBusinessContactId,
                ctx.user,
              );
            if (!contact || contact.contactType !== 'BUSINESS') {
              throw new Error(
                'orgBusinessContactId must reference a BusinessContact',
              );
            }
            if (contact.workspaceId !== workspaceId) {
              throw new Error(
                'orgBusinessContactId must belong to this workspace',
              );
            }
            updates.orgBusinessContactId = orgBusinessContactId;
          } else {
            updates.orgBusinessContactId = null;
          }
        }

        const workspace =
          await ctx.services.workspaceService.updateWorkspaceSettings(
            workspaceId,
            updates,
            ctx.user,
          );

        return workspace;
      },
    });

    t.field('updateWorkspaceAccessType', {
      type: 'Workspace',
      args: {
        workspaceId: nonNull(stringArg()),
        accessType: nonNull(arg({ type: WorkspaceAccessType })),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        const workspace =
          await ctx.services.workspaceService.updateWorkspaceAccessType(
            args.workspaceId,
            args.accessType,
            ctx.user,
          );

        return workspace;
      },
    });

    t.field('inviteUserToWorkspace', {
      type: 'WorkspaceMember',
      args: {
        email: nonNull(stringArg()),
        workspaceId: nonNull(stringArg()),
        roles: nonNull(list(nonNull(arg({ type: WorkspaceUserRole })))),
      },
      resolve: async (root, args, ctx) => {
        // Convert email to user ID using the users service
        const users = await ctx.services.usersService.upsertUsersByEmail(
          [args.email],
          ctx.user,
        );

        if (!users || users.length === 0) {
          throw new Error('Failed to create or find user');
        }

        const userId = users[0]._id;

        // Invite the user to the workspace with the specified roles
        const user = await ctx.services.workspaceService.inviteUserToWorkspace(
          args.workspaceId,
          userId,
          args.roles,
          ctx.user,
        );

        return user;
      },
    });

    t.field('updateWorkspaceUserRoles', {
      type: WorkspaceMember,
      args: {
        workspaceId: nonNull(stringArg()),
        userId: nonNull(stringArg()),
        roles: nonNull(list(nonNull(arg({ type: WorkspaceUserRole })))),
      },
      resolve: async (root, args, ctx) => {
        const user =
          await ctx.services.workspaceService.updateWorkspaceUserRoles(
            args.workspaceId,
            args.userId,
            args.roles,
            ctx.user,
          );

        return user;
      },
    });

    t.field('removeUserFromWorkspace', {
      type: 'Boolean',
      args: {
        workspaceId: nonNull(stringArg()),
        userId: nonNull(stringArg()),
      },
      resolve: async (root, args, ctx) => {
        const result =
          await ctx.services.workspaceService.removeUserFromWorkspace(
            args.workspaceId,
            args.userId,
            ctx.user,
          );

        return result;
      },
    });

    t.field('archiveWorkspace', {
      type: 'Workspace',
      args: {
        workspaceId: nonNull(stringArg()),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        const workspace = await ctx.services.workspaceService.archiveWorkspace(
          args.workspaceId,
          ctx.user,
        );

        return workspace;
      },
    });

    t.field('unarchiveWorkspace', {
      type: 'Workspace',
      args: {
        workspaceId: nonNull(stringArg()),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        const workspace =
          await ctx.services.workspaceService.unarchiveWorkspace(
            args.workspaceId,
            ctx.user,
          );

        return workspace;
      },
    });
  },
});
