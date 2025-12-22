import { z } from 'zod';
import { gql } from 'graphql-request';
import { ResourceMapTagType } from '../generated/graphql';
import { createMcpTool } from './types';

/**
 * GraphQL operation for list_resource_map_entries_by_tag_type tool.
 * This is picked up by codegen to generate typed SDK methods.
 */
gql`
  query McpListResourceMapEntriesByTagType($types: [ResourceMapTagType!]!) {
    listResourceMapEntriesByTagType(types: $types) {
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
 * list_resource_map_entries_by_tag_type MCP tool definition
 */
export const listResourceMapEntriesByTagTypeTool = createMcpTool({
  name: 'list_resource_map_entries_by_tag_type',
  description: 'Lists resource map entries by tag types.',
  inputSchema: {
    types: z
      .array(z.nativeEnum(ResourceMapTagType))
      .min(1)
      .describe('Tag types to include (LOCATION, BUSINESS_UNIT, ROLE)'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpListResourceMapEntriesByTagType({
        types: args.types,
      });
      const entries = result.listResourceMapEntriesByTagType || [];

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                types: args.types,
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
            text: `Error listing resource map entries by tag type: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
