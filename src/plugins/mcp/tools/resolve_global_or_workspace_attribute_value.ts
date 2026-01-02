import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';
import {
  GlobalAttributeAuditStatus,
  GlobalAttributeStatus,
} from '../generated/graphql';

gql`
  mutation McpResolveGlobalOrWorkspaceAttributeValue(
    $input: ResolveGlobalOrWorkspaceAttributeValueInput!
  ) {
    resolveGlobalOrWorkspaceAttributeValue(input: $input) {
      scope
      created
      globalAttributeValue {
        id
        attributeTypeId
        value
        synonyms
        codes
        status
        auditStatus
      }
      workspaceAttributeValue {
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
    }
  }
`;

export const resolveGlobalOrWorkspaceAttributeValueTool = createMcpTool({
  name: 'resolve_global_or_workspace_attribute_value',
  description:
    'Resolves an attribute value using reuse-first semantics: returns an existing global value if found; otherwise upserts a workspace-scoped draft value.',
  inputSchema: {
    workspaceId: z.string().describe('The workspace ID'),
    attributeTypeId: z.string().describe('The attribute type ID'),
    value: z.string().describe('The attribute value'),
    synonyms: z.array(z.string()).optional().describe('Optional synonyms'),
    codes: z.unknown().optional().describe('Optional codes payload (JSON)'),
    status: z
      .nativeEnum(GlobalAttributeStatus)
      .optional()
      .describe('Optional governance status'),
    auditStatus: z
      .nativeEnum(GlobalAttributeAuditStatus)
      .optional()
      .describe('Optional audit status'),
    source: z.string().optional().describe('Optional provenance source'),
    preferGlobal: z
      .boolean()
      .optional()
      .describe('If false, always upsert workspace value'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpResolveGlobalOrWorkspaceAttributeValue({
        input: {
          workspaceId: args.workspaceId,
          attributeTypeId: args.attributeTypeId,
          value: args.value,
          synonyms: args.synonyms,
          codes: args.codes,
          status: args.status,
          auditStatus: args.auditStatus,
          source: args.source,
          preferGlobal: args.preferGlobal,
        },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              result.resolveGlobalOrWorkspaceAttributeValue,
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
            text: `Error resolving attribute value: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
