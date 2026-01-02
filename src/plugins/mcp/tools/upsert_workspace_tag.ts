import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';
import {
  GlobalTagAuditStatus,
  GlobalTagPartOfSpeech,
  GlobalTagStatus,
} from '../generated/graphql';

gql`
  mutation McpUpsertWorkspaceTag($input: UpsertWorkspaceTagInput!) {
    upsertWorkspaceTag(input: $input) {
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
  }
`;

export const upsertWorkspaceTagTool = createMcpTool({
  name: 'upsert_workspace_tag',
  description:
    'Creates or updates a workspace-scoped (draft) tag with idempotent semantics (label/synonym match).',
  inputSchema: {
    workspaceId: z.string().describe('The workspace ID'),
    label: z.string().describe('Canonical tag label (snake_case recommended)'),
    displayName: z.string().optional().describe('Optional UI-friendly label'),
    pos: z
      .nativeEnum(GlobalTagPartOfSpeech)
      .optional()
      .describe('Optional part-of-speech hint'),
    synonyms: z
      .array(z.string())
      .optional()
      .describe('Optional synonyms (will be normalized)'),
    status: z
      .nativeEnum(GlobalTagStatus)
      .optional()
      .describe('Optional governance status'),
    auditStatus: z
      .nativeEnum(GlobalTagAuditStatus)
      .optional()
      .describe('Optional audit status'),
    notes: z.string().optional().describe('Optional notes'),
    source: z.string().optional().describe('Optional provenance source'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpUpsertWorkspaceTag({
        input: {
          workspaceId: args.workspaceId,
          label: args.label,
          displayName: args.displayName,
          pos: args.pos,
          synonyms: args.synonyms,
          status: args.status,
          auditStatus: args.auditStatus,
          notes: args.notes,
          source: args.source,
        },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result.upsertWorkspaceTag, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error upserting workspace tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
