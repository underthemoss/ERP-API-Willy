import { z } from 'zod';
import { gql } from 'graphql-request';
import { createMcpTool } from './types';
import {
  StudioCatalogProductKind,
  StudioCatalogProductInput,
  StudioCatalogProductStatus,
  StudioCatalogProductTargetKind,
  StudioCatalogProductTargetSpecInput,
} from '../generated/graphql';

gql`
  mutation McpStudioCatalogCreateProduct($input: StudioCatalogCreateProductInput!) {
    studioCatalogCreateProduct(input: $input) {
      catalogPath
      product { id name path kind status categoryPath tags }
    }
  }
`;

const StudioProductKind = z.nativeEnum(StudioCatalogProductKind) as z.ZodType<
  StudioCatalogProductKind
>;

const StudioProductStatus = z.nativeEnum(
  StudioCatalogProductStatus,
) as z.ZodType<StudioCatalogProductStatus>;

const kindToCatalogRefKind = (
  kind: StudioCatalogProductKind,
):
  | 'MATERIAL_PRODUCT'
  | 'SERVICE_PRODUCT'
  | 'ASSEMBLY_PRODUCT' => {
  if (kind === StudioCatalogProductKind.Material) return 'MATERIAL_PRODUCT';
  if (kind === StudioCatalogProductKind.Service) return 'SERVICE_PRODUCT';
  return 'ASSEMBLY_PRODUCT';
};

const normalizeTargetSpecs = (
  targetSpecs:
    | Array<
        | { kind: StudioCatalogProductTargetKind.Tags; tagIds?: string[] }
        | { kind: StudioCatalogProductTargetKind.Product; productId?: string }
      >
    | undefined,
): StudioCatalogProductTargetSpecInput[] => {
  if (!Array.isArray(targetSpecs) || targetSpecs.length === 0) return [];

  const output: StudioCatalogProductTargetSpecInput[] = [];

  for (const spec of targetSpecs) {
    if (spec.kind === StudioCatalogProductTargetKind.Tags) {
      const tagIds = Array.isArray(spec.tagIds)
        ? Array.from(
            new Set(
              spec.tagIds
                .filter(
                  (tagId): tagId is string =>
                    typeof tagId === 'string' && tagId.trim().length > 0,
                )
                .map((tagId) => tagId.trim()),
            ),
          )
        : [];

      if (tagIds.length === 0) continue;
      output.push({ kind: spec.kind, tagIds });
      continue;
    }

    const productId =
      typeof spec.productId === 'string' ? spec.productId.trim() : '';
    if (!productId) continue;
    output.push({ kind: spec.kind, productId });
  }

  return output;
};

export const studioCatalogCreateProductTool = createMcpTool({
  name: 'studio_catalog_create_product',
  description:
    'Creates a catalog product file under /catalogs/<slug>/products and returns its catalogRef for pricing.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    catalogPath: z
      .string()
      .optional()
      .describe(
        'Optional catalog folder path (e.g., /catalogs/default). If omitted, uses the default catalog.',
      ),
    product: z
      .object({
        id: z.string().describe('Product ID (snake_case recommended)'),
        name: z.string().describe('Product display name'),
        description: z.string().optional(),
        kind: StudioProductKind.describe('Product kind'),
        status: StudioProductStatus.optional(),
        categoryPath: z.string().optional(),
        tags: z.array(z.string()).optional().default([]),
        activityTags: z.array(z.string()).optional().default([]),
        targetSpecs: z
          .array(
            z.discriminatedUnion('kind', [
              z.object({
                kind: z.literal(StudioCatalogProductTargetKind.Tags),
                tagIds: z.array(z.string()).optional(),
              }),
              z.object({
                kind: z.literal(StudioCatalogProductTargetKind.Product),
                productId: z.string().optional(),
              }),
            ]),
          )
          .optional(),
        taskTemplates: z
          .array(
            z.object({
              id: z.string(),
              title: z.string(),
              activityTagIds: z.array(z.string()).min(1),
              contextTagIds: z.array(z.string()).optional(),
              notes: z.string().optional(),
            }),
          )
          .optional(),
        attributes: z
          .array(
            z.object({
              key: z.string(),
              value: z.union([z.string(), z.number(), z.boolean()]),
              unit: z.string().optional(),
              contextTags: z.array(z.string()).optional(),
              sourceRef: z.string().optional(),
            }),
          )
          .optional()
          .default([]),
        sourceRefs: z.array(z.string()).optional().default([]),
        sourcePaths: z.array(z.string()).optional().default([]),
        images: z
          .array(
            z.object({
              uri: z.string(),
              alt: z.string().optional(),
            }),
          )
          .optional()
          .default([]),
        notes: z.string().optional(),
      })
      .strict(),
  },
  handler: async (sdk, args) => {
    try {
      const normalizedTargetSpecs =
        args.product.kind === StudioCatalogProductKind.Service
          ? normalizeTargetSpecs(args.product.targetSpecs)
          : [];

      const taskTemplates =
        args.product.kind === StudioCatalogProductKind.Service &&
        Array.isArray(args.product.taskTemplates) &&
        args.product.taskTemplates.length > 0
          ? args.product.taskTemplates
          : undefined;

      const product: StudioCatalogProductInput = {
        ...(args.product as StudioCatalogProductInput),
        ...(args.product.kind === StudioCatalogProductKind.Service &&
        normalizedTargetSpecs.length > 0
          ? { targetSpecs: normalizedTargetSpecs }
          : { targetSpecs: undefined }),
        ...(taskTemplates ? { taskTemplates } : { taskTemplates: undefined }),
      };

      const result = await sdk.McpStudioCatalogCreateProduct({
        input: {
          workspaceId: args.workspaceId,
          catalogPath: args.catalogPath,
          product,
        },
      });

      const created = result.studioCatalogCreateProduct;
      const kind = args.product.kind;

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                ...created,
                catalogRef: {
                  kind: kindToCatalogRefKind(kind),
                  id: created.product.id,
                },
              },
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
            text: `Error creating catalog product: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          },
        ],
        isError: true,
      };
    }
  },
});
