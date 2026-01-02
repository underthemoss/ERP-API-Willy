import { z } from 'zod';
import { gql } from 'graphql-request';
import {
  ResourceMapGeofenceType,
  ResourceMapInteriorSpaceType,
  ResourceMapLocationType,
} from '../generated/graphql';
import { createMcpTool } from './types';

const latLngSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  accuracyMeters: z.number().optional(),
});

const addressSchema = z.object({
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  placeId: z.string().optional(),
});

const plusCodeSchema = z.object({
  code: z.string(),
  localArea: z.string().optional(),
});

const geofenceSchema = z.object({
  type: z.nativeEnum(ResourceMapGeofenceType),
  center: latLngSchema.optional(),
  radiusMeters: z.number().optional(),
  polygon: z.array(latLngSchema).optional(),
});

const interiorSchema = z.object({
  floor: z.string().optional(),
  spaceType: z.nativeEnum(ResourceMapInteriorSpaceType).optional(),
  code: z.string().optional(),
});

const locationSchema = z.object({
  kind: z.nativeEnum(ResourceMapLocationType),
  address: addressSchema.optional(),
  latLng: latLngSchema.optional(),
  plusCode: plusCodeSchema.optional(),
  geofence: geofenceSchema.optional(),
  interior: interiorSchema.optional(),
});

/**
 * GraphQL operation for update_resource_map_tag tool.
 * This is picked up by codegen to generate typed SDK methods.
 */
gql`
  mutation McpUpdateResourceMapTag(
    $id: ID!
    $input: UpdateResourceMapTagInput!
  ) {
    updateResourceMapTag(id: $id, input: $input) {
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
 * update_resource_map_tag MCP tool definition
 *
 * Updates a resource map tag. Only provided fields will be updated.
 * Use location: null to clear location metadata.
 */
export const updateResourceMapTagTool = createMcpTool({
  name: 'update_resource_map_tag',
  description:
    'Updates a resource map tag. Only provided fields will be updated. For LOCATION tags, include location metadata to enable map plotting (prefer location.kind=ADDRESS with location.address fields; backend geocodes via Mapbox when configured).',
  inputSchema: {
    id: z.string().describe('The resource map tag ID to update'),
    value: z.string().optional().describe('New tag value'),
    parentId: z
      .string()
      .optional()
      .describe('New parent tag ID (must be same tag type)'),
    hierarchyId: z.string().optional().describe('New hierarchy ID'),
    hierarchyName: z.string().optional().describe('New hierarchy name'),
    location: z
      .union([locationSchema, z.null()])
      .optional()
      .describe(
        'Location metadata (LOCATION tags only). Use null to clear location.',
      ),
  },
  handler: async (sdk, args) => {
    try {
      const { id, value, parentId, hierarchyId, hierarchyName, location } =
        args;

      const input: Record<string, unknown> = {};
      if (value !== undefined) input.value = value;
      if (parentId !== undefined) input.parentId = parentId;
      if (hierarchyId !== undefined) input.hierarchyId = hierarchyId;
      if (hierarchyName !== undefined) input.hierarchyName = hierarchyName;
      if (location !== undefined) input.location = location;

      if (!Object.keys(input).length) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Error: No fields provided to update. Please provide at least one field.',
            },
          ],
          isError: true,
        };
      }

      const result = await sdk.McpUpdateResourceMapTag({
        id,
        input,
      });

      const tag = result.updateResourceMapTag;

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                message: `Resource map tag "${tag?.value}" updated successfully`,
                tag,
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
            text: `Error updating resource map tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
