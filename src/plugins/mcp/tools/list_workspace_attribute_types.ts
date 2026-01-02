import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';
import {
  GlobalAttributeDimension,
  GlobalAttributeKind,
  GlobalAttributeStatus,
  GlobalAttributeValueType,
} from '../generated/graphql';

gql`
  query McpListWorkspaceAttributeTypes(
    $filter: ListWorkspaceAttributeTypesFilter!
    $page: PageInfoInput
  ) {
    listWorkspaceAttributeTypes(filter: $filter, page: $page) {
      items {
        id
        workspaceId
        name
        kind
        valueType
        dimension
        canonicalUnit
        allowedUnits
        canonicalValueSetId
        synonyms
        status
        auditStatus
        appliesTo
        usageHints
        notes
        validationRules
        source
        globalAttributeTypeId
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

export const listWorkspaceAttributeTypesTool = createMcpTool({
  name: 'list_workspace_attribute_types',
  description:
    'Lists workspace-scoped (draft) attribute types. These can later be promoted to the global attribute type library.',
  inputSchema: {
    workspaceId: z.string().describe('The workspace ID'),
    searchTerm: z.string().optional().describe('Optional search term'),
    kind: z
      .nativeEnum(GlobalAttributeKind)
      .optional()
      .describe('Optional kind'),
    valueType: z
      .nativeEnum(GlobalAttributeValueType)
      .optional()
      .describe('Optional value type'),
    dimension: z
      .nativeEnum(GlobalAttributeDimension)
      .optional()
      .describe('Optional dimension (PHYSICAL only)'),
    status: z
      .nativeEnum(GlobalAttributeStatus)
      .optional()
      .describe('Optional status'),
    promotedToGlobal: z
      .boolean()
      .optional()
      .describe('Optional filter for types already promoted to global'),
    pageNumber: z.number().int().optional().describe('Page number (1-based)'),
    pageSize: z.number().int().optional().describe('Page size'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpListWorkspaceAttributeTypes({
        filter: {
          workspaceId: args.workspaceId,
          searchTerm: args.searchTerm,
          kind: args.kind,
          valueType: args.valueType,
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
            text: JSON.stringify(result.listWorkspaceAttributeTypes, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error listing workspace attribute types: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
