import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';
import {
  GlobalAttributeDimension,
  GlobalUnitStatus,
} from '../generated/graphql';

gql`
  mutation McpUpsertWorkspaceUnitDefinition(
    $input: UpsertWorkspaceUnitDefinitionInput!
  ) {
    upsertWorkspaceUnitDefinition(input: $input) {
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
  }
`;

export const upsertWorkspaceUnitDefinitionTool = createMcpTool({
  name: 'upsert_workspace_unit_definition',
  description:
    'Creates or updates a workspace-scoped (draft) unit definition with idempotent semantics (workspaceId+code match).',
  inputSchema: {
    workspaceId: z.string().describe('The workspace ID'),
    code: z
      .string()
      .describe('Unit code (e.g., "LB", "KW"); aliases will be normalized'),
    name: z.string().optional().describe('Optional unit name'),
    dimension: z
      .nativeEnum(GlobalAttributeDimension)
      .optional()
      .describe('Optional dimension'),
    canonicalUnitCode: z
      .string()
      .optional()
      .describe('Optional canonical unit code (for conversion)'),
    toCanonicalFactor: z
      .number()
      .optional()
      .describe('Optional multiplier to canonical unit'),
    offset: z.number().optional().describe('Optional offset to canonical unit'),
    status: z
      .nativeEnum(GlobalUnitStatus)
      .optional()
      .describe('Optional status'),
    source: z.string().optional().describe('Optional provenance source'),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpUpsertWorkspaceUnitDefinition({
        input: {
          workspaceId: args.workspaceId,
          code: args.code,
          name: args.name,
          dimension: args.dimension,
          canonicalUnitCode: args.canonicalUnitCode,
          toCanonicalFactor: args.toCanonicalFactor,
          offset: args.offset,
          status: args.status,
          source: args.source,
        },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result.upsertWorkspaceUnitDefinition, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error upserting workspace unit definition: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
