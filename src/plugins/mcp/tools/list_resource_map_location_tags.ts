import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

const boundsSchema = z.object({
  minLat: z.number(),
  minLng: z.number(),
  maxLat: z.number(),
  maxLng: z.number(),
});

const nearSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  radiusMeters: z.number(),
});

/**
 * GraphQL operation for list_resource_map_location_tags tool.
 * This is picked up by codegen to generate typed SDK methods.
 */
gql`
  query McpListResourceMapLocationTags($filter: ResourceMapLocationFilterInput) {
    listResourceMapLocationTags(filter: $filter) {
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
 * list_resource_map_location_tags MCP tool definition
 */
export const listResourceMapLocationTagsTool = createMcpTool({
  name: 'list_resource_map_location_tags',
  description:
    'Lists LOCATION tags, optionally filtered by bounds, near radius, or hierarchyId.',
  inputSchema: {
    bounds: boundsSchema
      .optional()
      .describe('Bounding box filter (min/max lat/lng)'),
    near: nearSchema
      .optional()
      .describe('Near filter (lat/lng + radiusMeters)'),
    hierarchyId: z
      .string()
      .optional()
      .describe('Optional hierarchy ID filter'),
  },
  handler: async (sdk, args) => {
    try {
      const { bounds, near, hierarchyId } = args;
      const filter: Record<string, unknown> = {};
      if (bounds) filter.bounds = bounds;
      if (near) filter.near = near;
      if (hierarchyId) filter.hierarchyId = hierarchyId;

      const result = Object.keys(filter).length
        ? await sdk.McpListResourceMapLocationTags({ filter })
        : await sdk.McpListResourceMapLocationTags();
      const entries = result.listResourceMapLocationTags || [];

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                filter: Object.keys(filter).length ? filter : null,
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
            text: `Error listing resource map location tags: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
