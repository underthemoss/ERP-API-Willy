import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';
import {
  GlobalAttributeDimension,
  GlobalUnitStatus,
} from '../generated/graphql';

gql`
  query McpListWorkspaceUnitDefinitions(
    $filter: ListWorkspaceUnitDefinitionsFilter!
    $page: PageInfoInput
  ) {
    listWorkspaceUnitDefinitions(filter: $filter, page: $page) {
      items {
        id
        workspaceId
        code
        name
        dimension
        canonicalUnitCode
        toCanonicalFactor
        offset
        status
        globalUnitCode
        createdAt
        updatedAt
      }
      page {
        number
        size
        totalItems
        totalPages
      }
    }
  }
`;

export const listWorkspaceUnitDefinitionsTool = createMcpTool({
  name: 'list_workspace_unit_definitions',
  description:
    'Lists workspace-scoped (draft) unit definitions. These can later be promoted to the global unit library.',
  inputSchema: {
    workspaceId: z.string().describe('The workspace ID'),
    searchTerm: z.string().optional().describe('Optional search term'),
    dimension: z
      .nativeEnum(GlobalAttributeDimension)
      .optional()
      .describe('Optional dimension filter'),
    status: z
      .nativeEnum(GlobalUnitStatus)
      .optional()
      .describe('Optional status'),
    promotedToGlobal: z
      .boolean()
      .optional()
      .describe('Optional filter for units already promoted to global'),
    pageNumber: z.number().int().optional().describe('Page number (1-based)'),
    pageSize: z.number().int().optional().describe('Page size'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpListWorkspaceUnitDefinitions({
        filter: {
          workspaceId: args.workspaceId,
          searchTerm: args.searchTerm,
          dimension: args.dimension,
          status: args.status,
          promotedToGlobal: args.promotedToGlobal,
        },
        page:
          args.pageNumber || args.pageSize
            ? {
                number: args.pageNumber ?? 1,
                size: args.pageSize ?? 50,
              }
            : undefined,
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result.listWorkspaceUnitDefinitions, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error listing workspace unit definitions: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
