import {
  objectType,
  extendType,
  stringArg,
  intArg,
  booleanArg,
  nonNull,
} from 'nexus';

export const Auth0Identity = objectType({
  name: 'Auth0Identity',
  definition(t) {
    t.nonNull.string('connection');
    t.nonNull.string('userId');
    t.nonNull.string('provider');
    t.nonNull.boolean('isSocial');
    t.string('accessToken');
  },
});

export const Auth0User = objectType({
  name: 'Auth0User',
  definition(t) {
    t.nonNull.string('userId');
    t.string('email');
    t.boolean('emailVerified');
    t.string('username');
    t.string('phoneNumber');
    t.boolean('phoneVerified');
    t.string('createdAt');
    t.string('updatedAt');
    t.list.field('identities', { type: Auth0Identity });
    t.field('appMetadata', { type: 'JSON' });
    t.field('userMetadata', { type: 'JSON' });
    t.string('picture');
    t.string('name');
    t.string('nickname');
    t.list.string('multifactor');
    t.string('lastIp');
    t.string('lastLogin');
    t.int('loginsCount');
    t.boolean('blocked');
    t.string('givenName');
    t.string('familyName');
  },
});

export const Auth0Role = objectType({
  name: 'Auth0Role',
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('name');
    t.string('description');
  },
});

export const Auth0UsersSearchResult = objectType({
  name: 'Auth0UsersSearchResult',
  definition(t) {
    t.nonNull.list.nonNull.field('users', { type: Auth0User });
    t.nonNull.int('total');
    t.nonNull.int('start');
    t.nonNull.int('limit');
    t.nonNull.int('length');
  },
});

// Admin Query namespace object
export const AdminQueryNamespace = objectType({
  name: 'AdminQueryNamespace',
  definition(t) {
    t.field('searchUsers', {
      type: Auth0UsersSearchResult,
      description: 'Search for users in Auth0 (Admin only)',
      args: {
        query: stringArg({ description: 'Auth0 search query' }),
        page: intArg({ default: 0, description: 'Page number (0-based)' }),
        perPage: intArg({ default: 50, description: 'Results per page' }),
        sort: stringArg({ description: 'Sort field and order' }),
        fields: stringArg({ description: 'Fields to include' }),
        includeFields: booleanArg({
          default: true,
          description: 'Include or exclude fields',
        }),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.services.auth0ManagementService) {
          throw new Error('Auth0 Management Service not available');
        }

        return ctx.services.auth0ManagementService.searchUsers(
          {
            query: args.query || undefined,
            page: args.page || 0,
            perPage: args.perPage || 50,
            sort: args.sort || undefined,
            fields: args.fields || undefined,
            includeFields: args.includeFields !== false,
          },
          ctx.user,
        );
      },
    });

    t.field('getUserById', {
      type: Auth0User,
      description: 'Get a single Auth0 user by ID (Admin only)',
      args: {
        userId: nonNull(stringArg({ description: 'Auth0 user ID' })),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.services.auth0ManagementService) {
          throw new Error('Auth0 Management Service not available');
        }

        const user = await ctx.services.auth0ManagementService.getUserById(
          args.userId,
          ctx.user,
        );

        if (!user) {
          throw new Error('User not found');
        }

        return user;
      },
    });

    t.list.field('listRoles', {
      type: Auth0Role,
      description: 'List all available Auth0 roles (Admin only)',
      resolve: async (root, args, ctx) => {
        if (!ctx.services.auth0ManagementService) {
          throw new Error('Auth0 Management Service not available');
        }

        return ctx.services.auth0ManagementService.listRoles(ctx.user);
      },
    });

    t.list.field('getUserRoles', {
      type: Auth0Role,
      description: 'Get roles assigned to a user (Admin only)',
      args: {
        userId: nonNull(stringArg({ description: 'Auth0 user ID' })),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.services.auth0ManagementService) {
          throw new Error('Auth0 Management Service not available');
        }

        return ctx.services.auth0ManagementService.getUserRoles(
          args.userId,
          ctx.user,
        );
      },
    });
  },
});

// Admin Mutation namespace object
export const AdminMutationNamespace = objectType({
  name: 'AdminMutationNamespace',
  definition(t) {
    t.field('assignRolesToUser', {
      type: 'Boolean',
      description: 'Assign roles to a user (Admin only)',
      args: {
        userId: nonNull(stringArg({ description: 'Auth0 user ID' })),
        roleIds: nonNull(
          stringArg({ description: 'Comma-separated role IDs' }),
        ),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.services.auth0ManagementService) {
          throw new Error('Auth0 Management Service not available');
        }

        const roleIds = args.roleIds.split(',').map((id: string) => id.trim());

        await ctx.services.auth0ManagementService.assignRolesToUser(
          {
            userId: args.userId,
            roleIds,
          },
          ctx.user,
        );

        return true;
      },
    });

    t.field('removeRolesFromUser', {
      type: 'Boolean',
      description: 'Remove roles from a user (Admin only)',
      args: {
        userId: nonNull(stringArg({ description: 'Auth0 user ID' })),
        roleIds: nonNull(
          stringArg({ description: 'Comma-separated role IDs' }),
        ),
      },
      resolve: async (root, args, ctx) => {
        if (!ctx.services.auth0ManagementService) {
          throw new Error('Auth0 Management Service not available');
        }

        const roleIds = args.roleIds.split(',').map((id: string) => id.trim());

        await ctx.services.auth0ManagementService.removeRolesFromUser(
          {
            userId: args.userId,
            roleIds,
          },
          ctx.user,
        );

        return true;
      },
    });
  },
});

// Extend Query type with admin namespace
export const Auth0ManagementQueries = extendType({
  type: 'Query',
  definition(t) {
    t.field('admin', {
      type: AdminQueryNamespace,
      description: 'Admin operations (Admin only)',
      resolve: async (root, args, ctx) => {
        // Check if service is available
        if (!ctx.services.auth0ManagementService) {
          throw new Error('Auth0 Management Service not available');
        }

        // Check if user is authenticated
        if (!ctx.user) {
          throw new Error('Authentication required to access Auth0 operations');
        }

        // Check if user has PLATFORM_ADMIN role
        if (!ctx.user.es_erp_roles?.includes('PLATFORM_ADMIN')) {
          throw new Error('Not authorized');
        }

        // Return empty object as the namespace resolver
        return {};
      },
    });
  },
});

// Extend Mutation type with admin namespace
export const Auth0ManagementMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('admin', {
      type: AdminMutationNamespace,
      description: 'Admin mutations (Admin only)',
      resolve: async (root, args, ctx) => {
        // Check if service is available
        if (!ctx.services.auth0ManagementService) {
          throw new Error('Auth0 Management Service not available');
        }

        // Check if user is authenticated
        if (!ctx.user) {
          throw new Error('Authentication required to access Auth0 operations');
        }

        // Check if user has PLATFORM_ADMIN role
        if (!ctx.user.es_erp_roles?.includes('PLATFORM_ADMIN')) {
          throw new Error('Not authorized');
        }

        // Return empty object as the namespace resolver
        return {};
      },
    });
  },
});
