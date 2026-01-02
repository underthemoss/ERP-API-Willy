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
  mutation McpUpsertWorkspaceAttributeType(
    $input: UpsertWorkspaceAttributeTypeInput!
  ) {
    upsertWorkspaceAttributeType(input: $input) {
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
`;

export const upsertWorkspaceAttributeTypeTool = createMcpTool({
  name: 'upsert_workspace_attribute_type',
  description:
    'Creates or updates a workspace-scoped (draft) attribute type with idempotent semantics (name/synonym match).',
  inputSchema: {
    workspaceId: z.string().describe('The workspace ID'),
    name: z.string().describe('Canonical attribute type name (e.g., "power")'),
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
  },
  handler: async (sdk, args) => {
    try {
      const result = await sdk.McpUpsertWorkspaceAttributeType({
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
        },
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result.upsertWorkspaceAttributeType, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error upserting workspace attribute type: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  },
});
