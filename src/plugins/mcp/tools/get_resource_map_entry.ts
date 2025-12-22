import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

/**
 * GraphQL operation for get_resource_map_entry tool.
 * This is picked up by codegen to generate typed SDK methods.
 */
gql`
  query McpGetResourceMapEntry($id: String!) {
    getResourceMapEntry(id: $id) {
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
 * get_resource_map_entry MCP tool definition
 */
export const getResourceMapEntryTool = createMcpTool({
  name: 'get_resource_map_entry',
  description: 'Fetch a single resource map entry by ID.',
  inputSchema: {
    id: z.string().describe('The resource map entry ID to fetch'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpGetResourceMapEntry({ id: args.id });
      const entry = result.getResourceMapEntry || null;

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                entry,
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
            text: `Error fetching resource map entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
