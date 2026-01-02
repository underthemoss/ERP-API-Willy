import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';
import {
  GlobalAttributeAuditStatus,
  GlobalAttributeStatus,
} from '../generated/graphql';

gql`
  query McpListWorkspaceAttributeValues(
    $filter: ListWorkspaceAttributeValuesFilter!
    $page: PageInfoInput
  ) {
    listWorkspaceAttributeValues(filter: $filter, page: $page) {
      items {
        id
        workspaceId
        attributeTypeId
        value
        synonyms
        codes
        status
        auditStatus
        globalAttributeValueId
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

export const listWorkspaceAttributeValuesTool = createMcpTool({
  name: 'list_workspace_attribute_values',
  description:
    'Lists workspace-scoped (draft) attribute values. These can later be promoted to the global attribute value library.',
  inputSchema: {
    workspaceId: z.string().describe('The workspace ID'),
    attributeTypeId: z
      .string()
      .optional()
      .describe('Optional attribute type ID'),
    searchTerm: z.string().optional().describe('Optional search term'),
    status: z
      .nativeEnum(GlobalAttributeStatus)
      .optional()
      .describe('Optional status filter'),
    auditStatus: z
      .nativeEnum(GlobalAttributeAuditStatus)
      .optional()
      .describe('Optional audit status filter'),
    promotedToGlobal: z
      .boolean()
      .optional()
      .describe('Optional filter for values already promoted to global'),
    pageNumber: z.number().int().optional().describe('Page number (1-based)'),
    pageSize: z.number().int().optional().describe('Page size'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpListWorkspaceAttributeValues({
        filter: {
          workspaceId: args.workspaceId,
          attributeTypeId: args.attributeTypeId,
          searchTerm: args.searchTerm,
          status: args.status,
          auditStatus: args.auditStatus,
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
            text: JSON.stringify(result.listWorkspaceAttributeValues, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error listing workspace attribute values: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
