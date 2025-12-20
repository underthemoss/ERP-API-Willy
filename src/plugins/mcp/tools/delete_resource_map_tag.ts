import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';

/**
 * GraphQL operation for delete_resource_map_tag tool.
 * This is picked up by codegen to generate typed SDK methods.
 */
gql`
  mutation McpDeleteResourceMapTag($id: ID!, $cascade: Boolean) {
    deleteResourceMapTag(id: $id, cascade: $cascade) {
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
      }
    }
  }
`;

/**
 * delete_resource_map_tag MCP tool definition
 *
 * Deletes a resource map tag. Use cascade to delete children.
 */
export const deleteResourceMapTagTool = createMcpTool({
  name: 'delete_resource_map_tag',
  description:
    'Deletes a resource map tag. Set cascade=true to delete all child tags.',
  inputSchema: {
    id: z.string().describe('The resource map tag ID to delete'),
    cascade: z
      .boolean()
      .optional()
      .describe('Delete child tags as well'),
  },
  handler: async (sdk, args) => {
    try {
      const { id, cascade } = args;

      const result = await sdk.McpDeleteResourceMapTag({
        id,
        cascade,
      });

      const tag = result.deleteResourceMapTag;

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: true,
                message: `Resource map tag "${tag?.value}" deleted successfully`,
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
            text: `Error deleting resource map tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
