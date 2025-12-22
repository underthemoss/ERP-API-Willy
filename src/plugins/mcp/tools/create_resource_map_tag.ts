import { z } from 'zod';
import { gql } from 'graphql-request';
import {
  ResourceMapGeofenceType,
  ResourceMapInteriorSpaceType,
  ResourceMapLocationType,
  ResourceMapTagType,
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
 * GraphQL operation for create_resource_map_tag tool.
 * This is picked up by codegen to generate typed SDK methods.
 */
gql`
  mutation McpCreateResourceMapTag($input: CreateResourceMapTagInput!) {
    createResourceMapTag(input: $input) {
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
 * create_resource_map_tag MCP tool definition
 *
 * Creates a new resource map tag (LOCATION, BUSINESS_UNIT, or ROLE).
 */
export const createResourceMapTagTool = createMcpTool({
  name: 'create_resource_map_tag',
  description:
    'Creates a resource map tag. LOCATION tags can include location metadata; BUSINESS_UNIT and ROLE tags do not.',
  inputSchema: {
    value: z.string().describe('The display name for the tag'),
    type: z.nativeEnum(ResourceMapTagType).describe('The tag type to create'),
    parentId: z
      .string()
      .optional()
      .describe('Parent tag ID (must be same tag type)'),
    hierarchyId: z
      .string()
      .optional()
      .describe('Optional hierarchy ID (defaults to root tag ID)'),
    hierarchyName: z
      .string()
      .optional()
      .describe('Optional hierarchy name (defaults to root tag value)'),
    location: locationSchema
      .optional()
      .describe('Location metadata (only allowed for LOCATION tags)'),
  },
  handler: async (sdk, args) => {
    try {
      const { value, type, parentId, hierarchyId, hierarchyName, location } =
        args;

      const result = await sdk.McpCreateResourceMapTag({
        input: {
          value,
          type,
          ...(parentId && { parentId }),
          ...(hierarchyId && { hierarchyId }),
          ...(hierarchyName && { hierarchyName }),
          ...(location && { location }),
        },
      });

      const tag = result.createResourceMapTag;

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                message: `Resource map tag "${tag?.value}" created successfully`,
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
            text: `Error creating resource map tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
