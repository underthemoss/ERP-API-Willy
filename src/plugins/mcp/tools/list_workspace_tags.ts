import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';
import { GlobalTagPartOfSpeech, GlobalTagStatus } from '../generated/graphql';

gql`
  query McpListWorkspaceTags(
    $filter: ListWorkspaceTagsFilter!
    $page: PageInfoInput
  ) {
    listWorkspaceTags(filter: $filter, page: $page) {
      items {
        id
        workspaceId
        label
        displayName
        pos
        synonyms
        status
        auditStatus
        globalTagId
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

export const listWorkspaceTagsTool = createMcpTool({
  name: 'list_workspace_tags',
  description:
    'Lists workspace-scoped (draft) tags. These can later be promoted to the global tag library.',
  inputSchema: {
    workspaceId: z.string().describe('The workspace ID'),
    searchTerm: z
      .string()
      .optional()
      .describe('Optional search term (matches label/displayName/synonyms)'),
    pos: z
      .nativeEnum(GlobalTagPartOfSpeech)
      .optional()
      .describe('Optional part-of-speech filter'),
    status: z
      .nativeEnum(GlobalTagStatus)
      .optional()
      .describe('Optional status filter'),
    promotedToGlobal: z
      .boolean()
      .optional()
      .describe('Optional filter for tags already promoted to global'),
    pageNumber: z.number().int().optional().describe('Page number (1-based)'),
    pageSize: z.number().int().optional().describe('Page size'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpListWorkspaceTags({
        filter: {
          workspaceId: args.workspaceId,
          searchTerm: args.searchTerm,
          pos: args.pos,
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
            text: JSON.stringify(result.listWorkspaceTags, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error listing workspace tags: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
