import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

/**
 * GraphQL operation for list_resource_map_entries_by_parent_id tool.
 * This is picked up by codegen to generate typed SDK methods.
 */
gql`
  query McpListResourceMapEntriesByParentId($parentId: String!) {
    listResourceMapEntriesByParentId(parent_id: $parentId) {
      id
      value
      tagType
      parent_id
      hierarchy_id
      hierarchy_name
      path
      location {
        kind
        address {
          line1
          line2
          city
          state
          postalCode
          country
          placeId
        }
        latLng {
          lat
          lng
          accuracyMeters
        }
        plusCode {
          code
          localArea
        }
        geofence {
          type
          center {
            lat
            lng
            accuracyMeters
          }
          radiusMeters
          polygon {
            lat
            lng
            accuracyMeters
          }
        }
        interior {
          floor
          spaceType
          code
          qrPayload
        }
      }
    }
  }
`;

/**
 * list_resource_map_entries_by_parent_id MCP tool definition
 */
export const listResourceMapEntriesByParentIdTool = createMcpTool({
  name: 'list_resource_map_entries_by_parent_id',
  description: 'Lists resource map entries by parent ID.',
  inputSchema: {
    parentId: z.string().describe('Parent resource map entry ID'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpListResourceMapEntriesByParentId({
        parentId: args.parentId,
      });
      const entries = result.listResourceMapEntriesByParentId || [];

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                parentId: args.parentId,
                count: entries.length,
                entries,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error listing resource map entries by parent: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
