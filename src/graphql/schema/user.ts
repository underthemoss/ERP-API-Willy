import {
  objectType,
  extendType,
  nonNull,
  list,
  inputObjectType,
  arg,
} from 'nexus';
import { DomainResource } from '../../lib/authz/resources/DomainResource';
import { logger } from '../../lib/logger';

export const UserLocationInfo = objectType({
  name: 'UserLocationInfo',
  sourceType: {
    module: require.resolve('../../services/users/model'),
    export: 'UserLocationInfo',
  },
  definition(t) {
    t.string('city');
    t.string('countryCode', {
      resolve: (location) => location.country_code || null,
    });
    t.string('countryName', {
      resolve: (location) => location.country_name || null,
    });
    t.float('latitude');
    t.float('longitude');
    t.string('timezone');
  },
});

export const User = objectType({
  name: 'User',
  sourceType: {
    module: require.resolve('../../services/users'),
    export: 'User',
  },
  definition(t) {
    t.nonNull.string('id', { resolve: (user) => user._id.toString() });
    t.nonNull.string('email', {
      resolve: (user) => user?.email || user?.username || '',
    });
    t.nonNull.string('firstName', { resolve: (user) => user.first_name });
    t.nonNull.string('lastName', { resolve: (user) => user.last_name });
    t.nonNull.string('companyId', { resolve: (user) => user.company_id || '' });
    t.string('picture');
    t.field('lastLoginLocation', {
      type: 'UserLocationInfo',
      resolve: (user) => user.last_login_location || null,
    });
  },
});

export const WorkflowConfigurationUserFields = extendType({
  type: 'WorkflowConfiguration',
  definition(t) {
    t.field('createdByUser', {
      type: 'User',
      resolve: async (parent, _, ctx) =>
        parent.createdBy
          ? ctx.dataloaders.users.getUsersById.load(parent.createdBy)
          : null,
    });
    t.field('updatedByUser', {
      type: 'User',
      resolve: async (parent, _, ctx) =>
        parent.updatedBy
          ? ctx.dataloaders.users.getUsersById.load(parent.updatedBy)
          : null,
    });
  },
});

export const UserUpsertInput = inputObjectType({
  name: 'UserUpsertInput',
  definition(t) {
    t.nonNull.string('email');
    t.nonNull.string('firstName');
    t.nonNull.string('lastName');
    t.string('username');
    t.string('companyId');
    t.string('picture');
    t.string('auth0UserId');
    t.string('esUserId');
    t.boolean('emailVerified');
    t.boolean('deleted');
  },
});

export const Query = extendType({
  type: 'Query',
  definition(t) {
    t.field('getCurrentUser', {
      type: User,
      resolve: (_root, _args, ctx) => {
        if (!ctx.user) {
          return null;
        }
        return ctx.dataloaders.users.getUsersById.load(ctx.user.id);
      },
    });

    t.list.field('usersSearch', {
      type: 'User',
      args: {
        searchTerm: 'String',
      },
      resolve: async (_root, args, ctx) => {
        return ctx.services.usersService.searchUsers(
          args.searchTerm || '',
          ctx.user,
        );
      },
    });

    t.list.field('getUsersById', {
      type: 'User',
      args: {
        userIds: nonNull(list(nonNull('String'))),
      },
      resolve: async (_root, args, ctx) => {
        if (!ctx.user || !ctx.user.companyId) {
          throw new Error('Not authenticated or missing company');
        }
        const users = await Promise.all(
          args.userIds.map((id: string) =>
            ctx.dataloaders.users.getUsersById.load(id),
          ),
        );

        // Filter out nulls and users not in the same company
        return users.filter(
          (u) =>
            u && u?.company_id?.toString() === ctx.user?.companyId?.toString(),
        );
      },
    });
  },
});

export const Mutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('upsertUser', {
      type: 'User',
      args: {
        id: nonNull('String'),
        input: arg({ type: nonNull(UserUpsertInput) }),
      },
      resolve: async (_root, args, ctx) => {
        // Map GraphQL input to service input format
        const serviceInput = {
          email: args.input.email,
          first_name: args.input.firstName,
          last_name: args.input.lastName,
          username: args.input.username || undefined,
          company_id: args.input.companyId || undefined,
          picture: args.input.picture || undefined,
          auth0_user_id: args.input.auth0UserId || undefined,
          es_user_id: args.input.esUserId || undefined,
          email_verified: args.input.emailVerified || undefined,
          deleted: args.input.deleted || undefined,
          updated_at: new Date(),
          updated_by: ctx.user?.id,
        };

        await ctx.services.usersService.upsertUser(
          args.id,
          serviceInput,
          ctx.user,
        );

        // Return the updated user
        return ctx.dataloaders.users.getUsersById.load(args.id);
      },
    });

    t.field('syncCurrentUser', {
      type: 'User',
      description:
        'Sync the current authenticated user to the database and assign domain permissions. ' +
        'This replicates the Auth0 post-login webhook logic for local development. ' +
        'Safe to call in any environment - idempotent operation.',
      resolve: async (_root, _args, ctx) => {
        if (!ctx.user) {
          throw new Error('Not authenticated');
        }

        const auth0UserId = ctx.user.auth0Sub;
        const email = ctx.user.email;

        if (!auth0UserId || !email) {
          throw new Error('Missing required user information');
        }

        logger.info({
          msg: 'Processing syncCurrentUser mutation',
          auth0UserId,
          email,
        });

        // Step 1: Find existing user by auth0_user_id or email
        let existingUser = await ctx.services.usersService.findByAuth0UserId(
          auth0UserId,
          ctx.systemUser,
        );

        if (!existingUser) {
          existingUser = await ctx.services.usersService.findByEmail(
            email,
            ctx.systemUser,
          );
        }

        // Determine user ID (use existing or the authenticated user's ID from JWT)
        const userId = existingUser?._id || ctx.user.id;

        // Step 2: Use existing user's name if available, otherwise use email prefix
        const firstName = existingUser?.first_name || email.split('@')[0];
        const lastName = existingUser?.last_name || '';

        // Step 3: Upsert user record
        const serviceInput = {
          email,
          first_name: firstName,
          last_name: lastName,
          username: email,
          company_id: ctx.user.companyId || undefined,
          auth0_user_id: auth0UserId,
          es_user_id: ctx.user.id || undefined,
          updated_at: new Date(),
          updated_by: 'syncCurrentUser',
        };

        await ctx.services.usersService.upsertUser(
          userId,
          serviceInput,
          ctx.systemUser,
        );

        logger.info({
          msg: 'User synced successfully',
          userId,
          auth0UserId,
          email,
          isNewUser: !existingUser,
        });

        // Step 4: Assign user to email domain in SpiceDB (if valid enterprise domain)
        const emailDomain = DomainResource.extractDomainFromEmail(email);

        if (emailDomain) {
          const validationResult =
            ctx.services.domainsService.isValidEnterpriseDomain(emailDomain);

          if (validationResult.isValid) {
            const escapedDomain = emailDomain.replace('.', '_');

            try {
              const isMember = await ctx.authZ.domain.isUserMemberOfDomain(
                userId,
                escapedDomain,
              );

              if (!isMember) {
                await ctx.authZ.domain.addUserToDomain(userId, escapedDomain);
                logger.info({
                  msg: 'User added to domain in SpiceDB',
                  userId,
                  escapedDomain,
                  email,
                });
              } else {
                logger.debug({
                  msg: 'User already member of domain',
                  userId,
                  escapedDomain,
                });
              }
            } catch (error) {
              // Don't fail the mutation if SpiceDB operation fails
              logger.error({
                msg: 'Failed to assign user to domain in SpiceDB',
                userId,
                escapedDomain,
                error: error instanceof Error ? error.message : error,
              });
            }
          } else {
            logger.debug({
              msg: 'Skipping domain assignment - not a valid enterprise domain',
              emailDomain,
              reason: validationResult.reason,
            });
          }
        }

        // Return the synced user
        return ctx.dataloaders.users.getUsersById.load(userId);
      },
    });
  },
});
