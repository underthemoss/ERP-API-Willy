import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';
import {
  GlobalAttributeAuditStatus,
  GlobalAttributeStatus,
} from '../generated/graphql';

gql`
  mutation McpUpsertWorkspaceAttributeValue(
    $input: UpsertWorkspaceAttributeValueInput!
  ) {
    upsertWorkspaceAttributeValue(input: $input) {
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
`;

export const upsertWorkspaceAttributeValueTool = createMcpTool({
  name: 'upsert_workspace_attribute_value',
  description:
    'Creates or updates a workspace-scoped (draft) attribute value with idempotent semantics (workspaceId+attributeTypeId+value/synonym match).',
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
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpUpsertWorkspaceAttributeValue({
        input: {
          workspaceId: args.workspaceId,
          attributeTypeId: args.attributeTypeId,
          value: args.value,
          synonyms: args.synonyms,
          codes: args.codes,
          status: args.status,
          auditStatus: args.auditStatus,
          source: args.source,
        },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result.upsertWorkspaceAttributeValue, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error upserting workspace attribute value: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
