import { z } from 'zod';

const slugPattern = /^[a-z0-9][a-z0-9-_]*$/;

const attributeValueSchema = z
  .object({
    key: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()]),
    unit: z.string().optional(),
    contextTags: z.array(z.string()).optional(),
    sourceRef: z.string().optional(),
  })
  .strict();

const imageRefSchema = z
  .object({
    uri: z.string(),
    alt: z.string().optional(),
  })
  .strict();

const targetTagsSchema = z
  .object({
    kind: z.literal('tags'),
    tagIds: z.array(z.string()).min(1),
  })
  .strict();

const targetProductSchema = z
  .object({
    kind: z.literal('product'),
    productId: z.string(),
  })
  .strict();

export const catalogTargetSpecSchema = z.union([
  targetTagsSchema,
  targetProductSchema,
]);

const taskTemplateSchema = z
  .object({
    id: z.string().regex(slugPattern),
    title: z.string().trim().min(1),
    activityTagIds: z.array(z.string().trim().min(1)).min(1),
    contextTagIds: z.array(z.string().trim().min(1)).optional(),
    notes: z.string().optional(),
  })
  .strict();

export const catalogProductSchema = z
  .object({
    schemaVersion: z.string(),
    id: z.string().regex(slugPattern),
    origin: z.enum(['system', 'workspace']).optional(),
    name: z.string(),
    description: z.string().optional(),
    kind: z.enum(['material', 'service', 'assembly']).optional(),
    status: z.enum(['draft', 'active', 'archived']).optional(),
    categoryPath: z.string().optional(),
    tags: z.array(z.string()).optional(),
    activityTags: z.array(z.string()).optional(),
    targetSpecs: z.array(catalogTargetSpecSchema).optional(),
    taskTemplates: z.array(taskTemplateSchema).optional(),
    attributes: z.array(attributeValueSchema).optional(),
    sourceRefs: z.array(z.string()).optional(),
    sourcePaths: z.array(z.string()).optional(),
    images: z.array(imageRefSchema).optional(),
    notes: z.string().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasServiceFields =
      (value.activityTags && value.activityTags.length > 0) ||
      (value.targetSpecs && value.targetSpecs.length > 0);
    if (value.kind && value.kind !== 'service' && hasServiceFields) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'activityTags/targetSpecs require kind=service',
        path: ['kind'],
      });
    }
  });

export type CatalogProduct = z.infer<typeof catalogProductSchema>;
export type CatalogTargetSpec = z.infer<typeof catalogTargetSpecSchema>;

const listItemObjectSchema = z
  .object({
    id: z.string(),
    type: z.enum(['product', 'assembly', 'task']).optional(),
  })
  .strict();

export const catalogListItemSchema = z.union([
  z.string(),
  listItemObjectSchema,
]);

const attributeMatchSchema = z
  .object({
    key: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()]),
    unit: z.string().optional(),
    contextTags: z.array(z.string()).optional(),
  })
  .strict();

const listFiltersSchema = z
  .object({
    tagsAny: z.array(z.string()).optional(),
    tagsAll: z.array(z.string()).optional(),
    attributeAny: z.array(attributeMatchSchema).optional(),
    attributeAll: z.array(attributeMatchSchema).optional(),
    categoryPaths: z.array(z.string()).optional(),
    statusIn: z.array(z.enum(['draft', 'active', 'archived'])).optional(),
    text: z.string().optional(),
  })
  .strict();

const listSortSchema = z
  .object({
    by: z.enum(['name', 'id', 'updatedAt']),
    direction: z.enum(['asc', 'desc']).optional(),
  })
  .strict();

export const catalogListSchema = z
  .object({
    schemaVersion: z.string(),
    id: z.string().regex(slugPattern),
    name: z.string(),
    description: z.string().optional(),
    listType: z.enum(['products', 'assemblies', 'tasks', 'mixed']).optional(),
    items: z.array(catalogListItemSchema).optional(),
    filters: listFiltersSchema.optional(),
    sort: listSortSchema.optional(),
    limit: z.number().int().min(1).optional(),
    notes: z.string().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.items && !value.filters) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'List requires either items or filters',
        path: ['items'],
      });
    }
  });

export type CatalogList = z.infer<typeof catalogListSchema>;
export type CatalogListItem = z.infer<typeof catalogListItemSchema>;
export type CatalogListFilters = z.infer<typeof listFiltersSchema>;
export type CatalogListSort = z.infer<typeof listSortSchema>;
