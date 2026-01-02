import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';
import {
  GlobalTagAuditStatus,
  GlobalTagPartOfSpeech,
  GlobalTagStatus,
} from '../generated/graphql';

gql`
  mutation McpResolveGlobalOrWorkspaceTag(
    $input: ResolveGlobalOrWorkspaceTagInput!
  ) {
    resolveGlobalOrWorkspaceTag(input: $input) {
      scope
      created
      globalTag {
        id
        label
        displayName
        pos
        synonyms
        status
        auditStatus
      }
      workspaceTag {
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
  }
`;

export const resolveGlobalOrWorkspaceTagTool = createMcpTool({
  name: 'resolve_global_or_workspace_tag',
  description:
    'Resolves a tag using reuse-first semantics: returns an existing global tag if found; otherwise upserts a workspace-scoped draft tag.',
  inputSchema: {
    workspaceId: z.string().describe('The workspace ID'),
    label: z.string().describe('Tag label (snake_case recommended)'),
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
      .describe('Optional status'),
    auditStatus: z
      .nativeEnum(GlobalTagAuditStatus)
      .optional()
      .describe('Optional audit status'),
    notes: z.string().optional().describe('Optional notes'),
    source: z.string().optional().describe('Optional provenance source'),
    preferGlobal: z
      .boolean()
      .optional()
      .describe('If false, always upsert workspace tag'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpResolveGlobalOrWorkspaceTag({
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
          preferGlobal: args.preferGlobal,
        },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result.resolveGlobalOrWorkspaceTag, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error resolving tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
