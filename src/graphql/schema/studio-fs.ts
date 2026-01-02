import {
  arg,
  enumType,
  extendType,
  inputObjectType,
  nonNull,
  objectType,
  stringArg,
} from 'nexus';

export const StudioFsNodeTypeEnum = enumType({
  name: 'StudioFsNodeType',
  members: [
    { name: 'FILE', value: 'FILE' },
    { name: 'FOLDER', value: 'FOLDER' },
  ],
});

export const StudioFsNode = objectType({
  name: 'StudioFsNode',
  definition(t) {
    t.nonNull.string('path');
    t.nonNull.string('name');
    t.nonNull.field('type', { type: StudioFsNodeTypeEnum });
    t.string('mimeType');
    t.int('sizeBytes');
    t.nonNull.string('etag');
    t.nonNull.field('updatedAt', { type: 'DateTime' });
  },
});

export const StudioFsReadResult = objectType({
  name: 'StudioFsReadResult',
  definition(t) {
    t.nonNull.string('content');
    t.string('mimeType');
    t.nonNull.string('etag');
  },
});

export const StudioFsWriteResult = objectType({
  name: 'StudioFsWriteResult',
  definition(t) {
    t.nonNull.string('etag');
  },
});

export const StudioCatalogValidationIssue = objectType({
  name: 'StudioCatalogValidationIssue',
  definition(t) {
    t.nonNull.string('message');
    t.string('path');
  },
});

export const StudioCatalogValidateResult = objectType({
  name: 'StudioCatalogValidateResult',
  definition(t) {
    t.nonNull.list.nonNull.field('errors', {
      type: StudioCatalogValidationIssue,
    });
    t.nonNull.list.nonNull.field('warnings', {
      type: StudioCatalogValidationIssue,
    });
  },
});

export const StudioCatalogInitResult = objectType({
  name: 'StudioCatalogInitResult',
  definition(t) {
    t.nonNull.string('catalogPath');
  },
});

export const StudioCatalogProductKindEnum = enumType({
  name: 'StudioCatalogProductKind',
  members: [
    { name: 'MATERIAL', value: 'material' },
    { name: 'SERVICE', value: 'service' },
    { name: 'ASSEMBLY', value: 'assembly' },
  ],
});

export const StudioCatalogProductStatusEnum = enumType({
  name: 'StudioCatalogProductStatus',
  members: [
    { name: 'DRAFT', value: 'draft' },
    { name: 'ACTIVE', value: 'active' },
    { name: 'ARCHIVED', value: 'archived' },
  ],
});

export const StudioCatalogProductOriginEnum = enumType({
  name: 'StudioCatalogProductOrigin',
  members: [
    { name: 'SYSTEM', value: 'system' },
    { name: 'WORKSPACE', value: 'workspace' },
  ],
});

export const StudioCatalogProductTargetKindEnum = enumType({
  name: 'StudioCatalogProductTargetKind',
  members: [
    { name: 'TAGS', value: 'tags' },
    { name: 'PRODUCT', value: 'product' },
  ],
});

export const StudioCatalogProductSummary = objectType({
  name: 'StudioCatalogProductSummary',
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('name');
    t.nonNull.string('path');
    t.nonNull.field('origin', { type: StudioCatalogProductOriginEnum });
    t.field('kind', { type: StudioCatalogProductKindEnum });
    t.field('status', { type: StudioCatalogProductStatusEnum });
    t.string('categoryPath');
    t.list.nonNull.string('tags');
  },
});

export const StudioFsListInput = inputObjectType({
  name: 'StudioFsListInput',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.nonNull.string('path');
  },
});

export const StudioFsReadInput = inputObjectType({
  name: 'StudioFsReadInput',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.nonNull.string('path');
  },
});

export const StudioFsWriteInput = inputObjectType({
  name: 'StudioFsWriteInput',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.nonNull.string('path');
    t.nonNull.string('content');
    t.string('mimeType');
    t.string('expectedEtag');
  },
});

export const StudioFsUploadInput = inputObjectType({
  name: 'StudioFsUploadInput',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.nonNull.string('path');
    t.nonNull.string('bytes');
    t.string('mimeType');
    t.string('expectedEtag');
  },
});

export const StudioFsMkdirInput = inputObjectType({
  name: 'StudioFsMkdirInput',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.nonNull.string('path');
  },
});

export const StudioFsMoveInput = inputObjectType({
  name: 'StudioFsMoveInput',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.nonNull.string('from');
    t.nonNull.string('to');
  },
});

export const StudioFsDeleteInput = inputObjectType({
  name: 'StudioFsDeleteInput',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.nonNull.string('path');
  },
});

export const StudioCatalogInitInput = inputObjectType({
  name: 'StudioCatalogInitInput',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.nonNull.string('slug');
    t.string('name');
  },
});

export const StudioCatalogProductTargetSpecInput = inputObjectType({
  name: 'StudioCatalogProductTargetSpecInput',
  definition(t) {
    t.nonNull.field('kind', { type: StudioCatalogProductTargetKindEnum });
    t.list.nonNull.string('tagIds');
    t.string('productId');
  },
});

export const StudioCatalogProductAttributeInput = inputObjectType({
  name: 'StudioCatalogProductAttributeInput',
  definition(t) {
    t.nonNull.string('key');
    t.nonNull.field('value', { type: 'JSON' });
    t.string('unit');
    t.list.nonNull.string('contextTags');
    t.string('sourceRef');
  },
});

export const StudioCatalogProductImageInput = inputObjectType({
  name: 'StudioCatalogProductImageInput',
  definition(t) {
    t.nonNull.string('uri');
    t.string('alt');
  },
});

export const StudioCatalogProductTaskTemplateInput = inputObjectType({
  name: 'StudioCatalogProductTaskTemplateInput',
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('title');
    t.nonNull.list.nonNull.string('activityTagIds');
    t.list.nonNull.string('contextTagIds');
    t.string('notes');
  },
});

export const StudioCatalogProductInput = inputObjectType({
  name: 'StudioCatalogProductInput',
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('name');
    t.string('description');
    t.field('kind', { type: StudioCatalogProductKindEnum });
    t.field('status', { type: StudioCatalogProductStatusEnum });
    t.string('categoryPath');
    t.list.nonNull.string('tags');
    t.list.nonNull.string('activityTags');
    t.list.nonNull.field('targetSpecs', {
      type: StudioCatalogProductTargetSpecInput,
    });
    t.list.nonNull.field('attributes', {
      type: StudioCatalogProductAttributeInput,
    });
    t.list.nonNull.field('taskTemplates', {
      type: StudioCatalogProductTaskTemplateInput,
    });
    t.list.nonNull.string('sourceRefs');
    t.list.nonNull.string('sourcePaths');
    t.list.nonNull.field('images', { type: StudioCatalogProductImageInput });
    t.string('notes');
  },
});

export const StudioCatalogCreateProductInput = inputObjectType({
  name: 'StudioCatalogCreateProductInput',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.string('catalogPath');
    t.nonNull.field('product', { type: StudioCatalogProductInput });
  },
});

export const StudioCatalogSeedStatusEnum = enumType({
  name: 'StudioCatalogSeedStatus',
  members: [
    { name: 'CREATED', value: 'created' },
    { name: 'EXISTING', value: 'existing' },
  ],
});

export const StudioCatalogSeededProduct = objectType({
  name: 'StudioCatalogSeededProduct',
  definition(t) {
    t.nonNull.field('status', { type: StudioCatalogSeedStatusEnum });
    t.nonNull.field('product', { type: StudioCatalogProductSummary });
  },
});

export const StudioCatalogEnsureLogisticsServiceProductsInput =
  inputObjectType({
    name: 'StudioCatalogEnsureLogisticsServiceProductsInput',
    definition(t) {
      t.nonNull.string('workspaceId');
    },
  });

export const StudioCatalogEnsureLogisticsServiceProductsResult = objectType({
  name: 'StudioCatalogEnsureLogisticsServiceProductsResult',
  definition(t) {
    t.nonNull.string('catalogPath');
    t.nonNull.list.nonNull.field('products', { type: StudioCatalogSeededProduct });
  },
});

export const StudioCatalogCreateProductResult = objectType({
  name: 'StudioCatalogCreateProductResult',
  definition(t) {
    t.nonNull.string('catalogPath');
    t.nonNull.field('product', { type: StudioCatalogProductSummary });
  },
});

export const StudioCatalogValidateInput = inputObjectType({
  name: 'StudioCatalogValidateInput',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.nonNull.string('catalogPath');
  },
});

export const StudioCatalogCompileInput = inputObjectType({
  name: 'StudioCatalogCompileInput',
  definition(t) {
    t.nonNull.string('workspaceId');
    t.nonNull.string('catalogPath');
  },
});

export const StudioFsQuery = extendType({
  type: 'Query',
  definition(t) {
    t.nonNull.list.nonNull.string('studioFsRoots', {
      args: { workspaceId: nonNull(stringArg()) },
      resolve: (_root, { workspaceId }, ctx) =>
        ctx.services.studioFsService.roots(workspaceId, ctx.user),
    });

    t.nonNull.list.nonNull.field('studioFsList', {
      type: StudioFsNode,
      args: { input: nonNull(arg({ type: StudioFsListInput })) },
      resolve: (_root, { input }, ctx) =>
        ctx.services.studioFsService.list(
          { workspaceId: input.workspaceId, path: input.path },
          ctx.user,
        ),
    });

    t.nonNull.field('studioFsRead', {
      type: StudioFsReadResult,
      args: { input: nonNull(arg({ type: StudioFsReadInput })) },
      resolve: (_root, { input }, ctx) =>
        ctx.services.studioFsService.read(
          { workspaceId: input.workspaceId, path: input.path },
          ctx.user,
        ),
    });
  },
});

export const StudioFsMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.nonNull.field('studioFsWrite', {
      type: StudioFsWriteResult,
      args: { input: nonNull(arg({ type: StudioFsWriteInput })) },
      resolve: (_root, { input }, ctx) =>
        ctx.services.studioFsService.write(
          {
            workspaceId: input.workspaceId,
            path: input.path,
            content: input.content,
            mimeType: input.mimeType ?? null,
            expectedEtag: input.expectedEtag ?? null,
          },
          ctx.user,
        ),
    });

    t.nonNull.field('studioFsUpload', {
      type: StudioFsWriteResult,
      args: { input: nonNull(arg({ type: StudioFsUploadInput })) },
      resolve: (_root, { input }, ctx) =>
        ctx.services.studioFsService.upload(
          {
            workspaceId: input.workspaceId,
            path: input.path,
            bytes: input.bytes,
            mimeType: input.mimeType ?? null,
            expectedEtag: input.expectedEtag ?? null,
          },
          ctx.user,
        ),
    });

    t.nonNull.field('studioFsMkdir', {
      type: 'JSONObject',
      args: { input: nonNull(arg({ type: StudioFsMkdirInput })) },
      resolve: (_root, { input }, ctx) =>
        ctx.services.studioFsService.mkdir(
          { workspaceId: input.workspaceId, path: input.path },
          ctx.user,
        ),
    });

    t.nonNull.field('studioFsMove', {
      type: 'JSONObject',
      args: { input: nonNull(arg({ type: StudioFsMoveInput })) },
      resolve: (_root, { input }, ctx) =>
        ctx.services.studioFsService.move(
          { workspaceId: input.workspaceId, from: input.from, to: input.to },
          ctx.user,
        ),
    });

    t.nonNull.boolean('studioFsDelete', {
      args: { input: nonNull(arg({ type: StudioFsDeleteInput })) },
      resolve: (_root, { input }, ctx) =>
        ctx.services.studioFsService.delete(
          { workspaceId: input.workspaceId, path: input.path },
          ctx.user,
        ),
    });

    t.nonNull.field('studioCatalogInit', {
      type: StudioCatalogInitResult,
      args: { input: nonNull(arg({ type: StudioCatalogInitInput })) },
      resolve: (_root, { input }, ctx) =>
        ctx.services.studioFsService.createCatalog(
          {
            workspaceId: input.workspaceId,
            slug: input.slug,
            name: input.name,
          },
          ctx.user,
        ),
    });

    t.nonNull.field('studioCatalogCreateProduct', {
      type: StudioCatalogCreateProductResult,
      args: { input: nonNull(arg({ type: StudioCatalogCreateProductInput })) },
      resolve: (_root, { input }, ctx) => {
        const targetSpecs =
          input.product.targetSpecs?.map(
            (spec: {
              kind: 'tags' | 'product';
              tagIds?: string[] | null;
              productId?: string | null;
            }) => {
            if (spec.kind === 'tags') {
              return {
                kind: 'tags' as const,
                tagIds: Array.isArray(spec.tagIds) ? spec.tagIds : [],
              };
            }
            return {
              kind: 'product' as const,
              productId: spec.productId ?? '',
            };
          },
          ) ?? undefined;

        const attributes =
          input.product.attributes?.map(
            (attribute: {
              key: string;
              value: unknown;
              unit?: string | null;
              contextTags?: string[] | null;
              sourceRef?: string | null;
            }) => ({
            key: attribute.key,
            value: attribute.value as any,
            unit: attribute.unit ?? undefined,
            contextTags: attribute.contextTags ?? undefined,
            sourceRef: attribute.sourceRef ?? undefined,
          }),
          ) ?? undefined;

	        const images =
	          input.product.images?.map(
	            (image: { uri: string; alt?: string | null }) => ({
	            uri: image.uri,
	            alt: image.alt ?? undefined,
	          }),
	          ) ?? undefined;

	        const taskTemplates =
	          input.product.taskTemplates?.map(
	            (taskTemplate: {
	              id: string;
	              title: string;
	              activityTagIds: string[];
	              contextTagIds?: string[] | null;
	              notes?: string | null;
	            }) => ({
	              id: taskTemplate.id,
	              title: taskTemplate.title,
	              activityTagIds: taskTemplate.activityTagIds,
	              contextTagIds: taskTemplate.contextTagIds ?? undefined,
	              notes: taskTemplate.notes ?? undefined,
	            }),
	          ) ?? undefined;

	        return ctx.services.studioFsService.createCatalogProduct(
	          {
	            workspaceId: input.workspaceId,
	            catalogPath: input.catalogPath ?? null,
	            product: {
	              ...input.product,
	              targetSpecs,
	              taskTemplates,
	              attributes,
	              images,
	            },
	          },
	          ctx.user,
        );
      },
    });

    t.nonNull.field('studioCatalogEnsureLogisticsServiceProducts', {
      type: StudioCatalogEnsureLogisticsServiceProductsResult,
      args: {
        input: nonNull(arg({ type: StudioCatalogEnsureLogisticsServiceProductsInput })),
      },
      async resolve(_root, { input }, ctx) {
        if (!ctx.user) {
          throw new Error('Unauthorized');
        }

        return ctx.services.studioFsService.ensureLogisticsServiceProducts(
          { workspaceId: input.workspaceId },
          ctx.user,
        );
      },
    });

    t.nonNull.field('studioCatalogValidate', {
      type: StudioCatalogValidateResult,
      args: { input: nonNull(arg({ type: StudioCatalogValidateInput })) },
      resolve: (_root, { input }, ctx) =>
        ctx.services.studioFsService.validateCatalog(
          { workspaceId: input.workspaceId, catalogPath: input.catalogPath },
          ctx.user,
        ),
    });

    t.nonNull.field('studioCatalogPreview', {
      type: 'JSONObject',
      args: { input: nonNull(arg({ type: StudioCatalogCompileInput })) },
      resolve: (_root, { input }, ctx) =>
        ctx.services.studioFsService.previewCatalog(
          { workspaceId: input.workspaceId, catalogPath: input.catalogPath },
          ctx.user,
        ),
    });

    t.nonNull.field('studioCatalogCompile', {
      type: 'JSONObject',
      args: { input: nonNull(arg({ type: StudioCatalogCompileInput })) },
      resolve: (_root, { input }, ctx) =>
        ctx.services.studioFsService.compileCatalog(
          { workspaceId: input.workspaceId, catalogPath: input.catalogPath },
          ctx.user,
        ),
    });
  },
});
