import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';
import {
  GlobalAttributeAppliesTo,
  GlobalAttributeAuditStatus,
  GlobalAttributeDimension,
  GlobalAttributeKind,
  GlobalAttributeStatus,
  GlobalAttributeUsageHint,
  GlobalAttributeValueType,
} from '../generated/graphql';

gql`
  mutation McpResolveGlobalOrWorkspaceAttributeType(
    $input: ResolveGlobalOrWorkspaceAttributeTypeInput!
  ) {
    resolveGlobalOrWorkspaceAttributeType(input: $input) {
      scope
      created
      globalAttributeType {
        id
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
      }
      workspaceAttributeType {
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
    }
  }
`;

export const resolveGlobalOrWorkspaceAttributeTypeTool = createMcpTool({
  name: 'resolve_global_or_workspace_attribute_type',
  description:
    'Resolves an attribute type using reuse-first semantics: returns an existing global type if found; otherwise upserts a workspace-scoped draft type (BRAND only by default; PHYSICAL types must exist globally unless preferGlobal=false).',
  inputSchema: {
    workspaceId: z.string().describe('The workspace ID'),
    name: z.string().describe('Attribute type name (e.g., "power")'),
    kind: z.nativeEnum(GlobalAttributeKind).describe('Attribute kind'),
    valueType: z
      .nativeEnum(GlobalAttributeValueType)
      .describe('Attribute value type'),
    dimension: z
      .nativeEnum(GlobalAttributeDimension)
      .optional()
      .describe('Optional dimension (PHYSICAL only)'),
    canonicalUnit: z
      .string()
      .optional()
      .describe('Optional canonical unit code (PHYSICAL only)'),
    allowedUnits: z
      .array(z.string())
      .optional()
      .describe('Optional allowed units (PHYSICAL only)'),
    canonicalValueSetId: z
      .string()
      .optional()
      .describe('Optional value set ID'),
    synonyms: z.array(z.string()).optional().describe('Optional synonyms'),
    status: z
      .nativeEnum(GlobalAttributeStatus)
      .optional()
      .describe('Optional governance status'),
    auditStatus: z
      .nativeEnum(GlobalAttributeAuditStatus)
      .optional()
      .describe('Optional audit status'),
    appliesTo: z
      .nativeEnum(GlobalAttributeAppliesTo)
      .optional()
      .describe('Optional applicability'),
    usageHints: z
      .array(z.nativeEnum(GlobalAttributeUsageHint))
      .optional()
      .describe('Optional usage hints'),
    notes: z.string().optional().describe('Optional notes'),
    validationRules: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
        precision: z.number().optional(),
      })
      .partial()
      .optional()
      .describe('Optional validation rules for numeric attributes'),
    source: z.string().optional().describe('Optional provenance source'),
    preferGlobal: z
      .boolean()
      .optional()
      .describe(
        'If false, always upsert workspace type (discouraged for PHYSICAL)',
      ),
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpResolveGlobalOrWorkspaceAttributeType({
        input: {
          workspaceId: args.workspaceId,
          name: args.name,
          kind: args.kind,
          valueType: args.valueType,
          dimension: args.dimension,
          canonicalUnit: args.canonicalUnit,
          allowedUnits: args.allowedUnits,
          canonicalValueSetId: args.canonicalValueSetId,
          synonyms: args.synonyms,
          status: args.status,
          auditStatus: args.auditStatus,
          appliesTo: args.appliesTo,
          usageHints: args.usageHints,
          notes: args.notes,
          validationRules: args.validationRules,
          source: args.source,
          preferGlobal: args.preferGlobal,
        },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              result.resolveGlobalOrWorkspaceAttributeType,
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
            text: `Error resolving attribute type: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
