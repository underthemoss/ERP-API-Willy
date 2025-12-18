import { extendType, objectType, idArg, nonNull, enumType, arg } from 'nexus';
import { v1 } from '@authzed/authzed-node';
import { createClient } from '../../lib/authz/spiceDB-client';

// Load the SpiceDB schema JSON
const spicedbSchema = require('../../../spicedb/schema.generated.json');

// Helper function to extract resource types from the schema
function getResourceTypesFromSchema() {
  const resourceTypes: Record<string, string> = {};

  for (const definition of spicedbSchema.definitions) {
    // Convert the definition name to the enum format
    // e.g., "erp/domain" -> "ERP_DOMAIN"
    const key = definition.name.replace('/', '_').toUpperCase();
    // The value is the original definition name
    resourceTypes[key] = definition.name;
  }

  return resourceTypes;
}

// Create ResourceType enum from the schema JSON
export const ResourceType = enumType({
  name: 'ResourceType',
  members: getResourceTypesFromSchema(),
});

// Helper function to extract permissions from the schema
function getPermissionsFromSchema() {
  const permissions: Record<string, string> = {};

  for (const definition of spicedbSchema.definitions) {
    const resourceName = definition.name.replaceAll('/', '_').toUpperCase();

    if (resourceName && definition.permissions) {
      for (const permission of definition.permissions) {
        // Create a prefixed permission name (e.g., "WORKSPACE_READ")
        const key = `${resourceName}_${permission.name.toUpperCase()}`;
        permissions[key] = permission.name;
      }
    }
  }

  return permissions;
}

const gqlPermissionsToAuthzMap = Object.fromEntries(
  Object.entries(getPermissionsFromSchema()),
);
const authzPermissionToGqlMap = Object.fromEntries(
  Object.entries(getPermissionsFromSchema()).map((kv) => kv.reverse()),
);
// Create PermissionType enum dynamically from the schema
// Only includes actual permissions, not relations
export const PermissionType = enumType({
  name: 'PermissionType',
  members: gqlPermissionsToAuthzMap,
});

export const UserPermissionMap = objectType({
  name: 'UserPermissionMap',
  definition(t) {
    Object.keys(gqlPermissionsToAuthzMap).forEach((key) => t.boolean(key));
  },
});

export const UserPermission = objectType({
  name: 'UserPermission',
  definition(t) {
    t.nonNull.string('resourceId');
    t.nonNull.field('resourceType', { type: ResourceType });
    t.nonNull.list.nonNull.field('permissions', { type: PermissionType });
    t.nonNull.field('permissionMap', { type: UserPermissionMap });
  },
});

export const ListUserPermissionsResult = objectType({
  name: 'ListUserPermissionsResult',
  definition(t) {
    t.nonNull.field('permissions', { type: UserPermission });
  },
});

export const PermissionsQuery = extendType({
  type: 'Query',
  definition(t) {
    t.nonNull.field('listUserResourcePermissions', {
      type: ListUserPermissionsResult,
      args: {
        resourceType: nonNull(arg({ type: ResourceType })),
        resourceId: nonNull(idArg()),
      },
      resolve: async (root, args, ctx) => {
        // Check authentication
        if (!ctx.user) {
          throw new Error('Authentication required');
        }

        // Get the user ID from the authenticated context
        const userId = ctx.user.id;

        const spicedbEndpoint = ctx.envConfig.SPICEDB_ENDPOINT;
        const spicedbToken = ctx.envConfig.SPICEDB_TOKEN;

        const client = createClient({
          apiToken: spicedbToken,
          endpoint: spicedbEndpoint,
          security: spicedbEndpoint.includes('localhost')
            ? v1.ClientSecurity.INSECURE_LOCALHOST_ALLOWED
            : v1.ClientSecurity.SECURE,
        });

        try {
          // The resourceType arg will be the actual value from the enum (e.g., "erp/domain")
          const resourceType = args.resourceType;
          // Get the list of all possible permissions for this resource type from the schema
          const permissionsToCheck: string[] = [];

          // Find the definition for this resource type in the schema
          const resourceDefinition = spicedbSchema.definitions.find(
            (def: { name: string }) => def.name === resourceType,
          );

          if (resourceDefinition && resourceDefinition.permissions) {
            for (const permission of resourceDefinition.permissions) {
              permissionsToCheck.push(permission.name);
            }
          }
          // If no permissions found for this resource type
          if (permissionsToCheck.length === 0) {
            return {
              permissions: {
                resourceId: args.resourceId,
                resourceType,
                permissions: [],
                permissionMap: {},
              },
            };
          }

          // Check all permissions in parallel for better performance
          const permissionChecks = permissionsToCheck.map((permission) =>
            client
              .checkPermission(
                v1.CheckPermissionRequest.create({
                  resource: v1.ObjectReference.create({
                    objectType: resourceType,
                    objectId: args.resourceId,
                  }),
                  permission,
                  subject: v1.SubjectReference.create({
                    object: v1.ObjectReference.create({
                      objectType: 'erp/user',
                      objectId: userId,
                    }),
                  }),
                }),
              )
              .then((checkResult) => {
                if (
                  checkResult.permissionship ===
                  v1.CheckPermissionResponse_Permissionship.HAS_PERMISSION
                ) {
                  return permission;
                }
                return null;
              }),
          );

          // Wait for all permission checks to complete
          const results = await Promise.all(permissionChecks);
          const userPermissions: any[] = [];
          const permissionMap: Record<any, boolean> = {};
          for (const permission of results) {
            if (permission !== null) {
              userPermissions.push(permission);
              permissionMap[authzPermissionToGqlMap[permission]] = true;
            }
          }
          return {
            permissions: {
              resourceId: args.resourceId,
              resourceType,
              permissions: userPermissions,
              permissionMap,
            },
          };
        } finally {
          // Clean up the client connection
          client.close();
        }
      },
    });
  },
});
