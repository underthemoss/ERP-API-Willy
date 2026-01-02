import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';
import {
  GlobalAttributeDimension,
  GlobalUnitStatus,
} from '../generated/graphql';

gql`
  mutation McpResolveGlobalOrWorkspaceUnitDefinition(
    $input: ResolveGlobalOrWorkspaceUnitDefinitionInput!
  ) {
    resolveGlobalOrWorkspaceUnitDefinition(input: $input) {
      scope
      created
      globalUnitDefinition {
        id
        code
        name
        dimension
        canonicalUnitCode
        toCanonicalFactor
        offset
        status
      }
      workspaceUnitDefinition {
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
  }
`;

export const resolveGlobalOrWorkspaceUnitDefinitionTool = createMcpTool({
  name: 'resolve_global_or_workspace_unit_definition',
  description:
    'Resolves a unit definition using reuse-first semantics: returns an existing global unit if found; if preferGlobal=true (default) errors when unknown (preferred), and if preferGlobal=false it upserts a workspace-scoped draft unit.',
  inputSchema: {
    workspaceId: z.string().describe('The workspace ID'),
    code: z
      .string()
      .describe(
        'Unit code/alias (e.g., "lb", "lbs", "LB"); will be normalized',
      ),
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
    preferGlobal: z
      .boolean()
      .optional()
      .describe(
        'If false, upsert a workspace unit definition (discouraged; prefer seeding global units)',
      ),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpResolveGlobalOrWorkspaceUnitDefinition({
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
          preferGlobal: args.preferGlobal,
        },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              result.resolveGlobalOrWorkspaceUnitDefinition,
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
            text: `Error resolving unit definition: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
