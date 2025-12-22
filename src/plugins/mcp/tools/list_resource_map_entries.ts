import { gql } from 'graphql-request';
import { createMcpTool } from './types';

/**
 * GraphQL operation for list_resource_map_entries tool.
 * This is picked up by codegen to generate typed SDK methods.
 */
gql`
  query McpListResourceMapEntries {
    listResourceMapEntries {
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
 * list_resource_map_entries MCP tool definition
 */
export const listResourceMapEntriesTool = createMcpTool({
  name: 'list_resource_map_entries',
  description:
    'Lists all resource map entries for the authenticated user tenant.',
  inputSchema: {},
  handler: async (sdk) => {
    try {
      const result = await sdk.McpListResourceMapEntries();
      const entries = result.listResourceMapEntries || [];

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
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
            text: `Error listing resource map entries: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
