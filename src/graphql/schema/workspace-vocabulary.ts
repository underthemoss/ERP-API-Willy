import {
  arg,
  enumType,
  extendType,
  idArg,
  inputObjectType,
  nonNull,
  objectType,
} from 'nexus';
import { PageInfoInput, PaginationInfo } from './common';
import {
  GlobalAttributeAppliesTo,
  GlobalAttributeAuditStatus,
  GlobalAttributeType,
  GlobalAttributeValue,
  GlobalAttributeDimension,
  GlobalAttributeKind,
  GlobalAttributeStatus,
  GlobalAttributeUsageHint,
  GlobalAttributeValueType,
  GlobalUnitDefinition,
  GlobalUnitStatus,
} from './global-attributes';
import {
  GlobalTagAuditStatus,
  GlobalTagPartOfSpeech,
  GlobalTagStatus,
  GlobalTag,
} from './global-tags';

const optional = <T>(value: T | null | undefined): T | undefined => {
  if (value === null || value === undefined) return undefined;
  return value;
};

const compactList = <T>(
  value: Array<T | null> | null | undefined,
): T[] | undefined => {
  if (value === null || value === undefined) return undefined;
  return value.filter((item): item is T => item !== null);
};

export const WorkspaceTag = objectType({
  name: 'WorkspaceTag',
  sourceType: {
    module: require.resolve('../../services/workspace_vocabulary'),
    export: 'WorkspaceTag',
  },
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.id('workspaceId');
    t.nonNull.string('label');
    t.string('displayName');
    t.nonNull.field('pos', { type: GlobalTagPartOfSpeech });
    t.list.string('synonyms');
    t.nonNull.field('status', { type: GlobalTagStatus });
    t.field('auditStatus', { type: GlobalTagAuditStatus });
    t.string('notes');
    t.string('source');
    t.id('globalTagId');
    t.field('createdAt', { type: 'DateTime' });
    t.field('updatedAt', { type: 'DateTime' });
    t.string('createdBy');
    t.string('updatedBy');
  },
});

export const WorkspaceAttributeType = objectType({
  name: 'WorkspaceAttributeType',
  sourceType: {
    module: require.resolve('../../services/workspace_vocabulary'),
    export: 'WorkspaceAttributeType',
  },
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.id('workspaceId');
    t.nonNull.string('name');
    t.nonNull.field('kind', { type: GlobalAttributeKind });
    t.nonNull.field('valueType', { type: GlobalAttributeValueType });
    t.field('dimension', { type: GlobalAttributeDimension });
    t.string('canonicalUnit');
    t.list.string('allowedUnits');
    t.string('canonicalValueSetId');
    t.list.string('synonyms');
    t.nonNull.field('status', { type: GlobalAttributeStatus });
    t.field('auditStatus', { type: GlobalAttributeAuditStatus });
    t.field('appliesTo', { type: GlobalAttributeAppliesTo });
    t.list.field('usageHints', { type: GlobalAttributeUsageHint });
    t.string('notes');
    t.field('validationRules', { type: 'JSONObject' });
    t.string('source');
    t.id('globalAttributeTypeId');
    t.field('createdAt', { type: 'DateTime' });
    t.field('updatedAt', { type: 'DateTime' });
    t.string('createdBy');
    t.string('updatedBy');
  },
});

export const WorkspaceUnitDefinition = objectType({
  name: 'WorkspaceUnitDefinition',
  sourceType: {
    module: require.resolve('../../services/workspace_vocabulary'),
    export: 'WorkspaceUnitDefinition',
  },
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.id('workspaceId');
    t.nonNull.string('code');
    t.string('name');
    t.field('dimension', { type: GlobalAttributeDimension });
    t.string('canonicalUnitCode');
    t.float('toCanonicalFactor');
    t.float('offset');
    t.nonNull.field('status', { type: GlobalUnitStatus });
    t.string('source');
    t.string('globalUnitCode');
    t.field('createdAt', { type: 'DateTime' });
    t.field('updatedAt', { type: 'DateTime' });
    t.string('createdBy');
    t.string('updatedBy');
  },
});

export const WorkspaceAttributeValue = objectType({
  name: 'WorkspaceAttributeValue',
  sourceType: {
    module: require.resolve('../../services/workspace_vocabulary'),
    export: 'WorkspaceAttributeValue',
  },
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.id('workspaceId');
    t.nonNull.id('attributeTypeId');
    t.nonNull.string('value');
    t.list.string('synonyms');
    t.field('codes', { type: 'JSONObject' });
    t.nonNull.field('status', { type: GlobalAttributeStatus });
    t.field('auditStatus', { type: GlobalAttributeAuditStatus });
    t.string('source');
    t.string('globalAttributeValueId');
    t.field('createdAt', { type: 'DateTime' });
    t.field('updatedAt', { type: 'DateTime' });
    t.string('createdBy');
    t.string('updatedBy');
  },
});

export const WorkspaceTagListResult = objectType({
  name: 'WorkspaceTagListResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: WorkspaceTag });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const WorkspaceAttributeTypeListResult = objectType({
  name: 'WorkspaceAttributeTypeListResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: WorkspaceAttributeType });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const WorkspaceUnitDefinitionListResult = objectType({
  name: 'WorkspaceUnitDefinitionListResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: WorkspaceUnitDefinition });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const WorkspaceAttributeValueListResult = objectType({
  name: 'WorkspaceAttributeValueListResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: WorkspaceAttributeValue });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const ListWorkspaceTagsFilter = inputObjectType({
  name: 'ListWorkspaceTagsFilter',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.field('pos', { type: GlobalTagPartOfSpeech });
    t.field('status', { type: GlobalTagStatus });
    t.string('searchTerm');
    t.boolean('promotedToGlobal');
  },
});

export const ListWorkspaceAttributeTypesFilter = inputObjectType({
  name: 'ListWorkspaceAttributeTypesFilter',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.field('kind', { type: GlobalAttributeKind });
    t.field('valueType', { type: GlobalAttributeValueType });
    t.field('dimension', { type: GlobalAttributeDimension });
    t.field('status', { type: GlobalAttributeStatus });
    t.field('appliesTo', { type: GlobalAttributeAppliesTo });
    t.field('usageHint', { type: GlobalAttributeUsageHint });
    t.string('searchTerm');
    t.boolean('promotedToGlobal');
  },
});

export const ListWorkspaceUnitDefinitionsFilter = inputObjectType({
  name: 'ListWorkspaceUnitDefinitionsFilter',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.field('dimension', { type: GlobalAttributeDimension });
    t.field('status', { type: GlobalUnitStatus });
    t.string('searchTerm');
    t.boolean('promotedToGlobal');
  },
});

export const ListWorkspaceAttributeValuesFilter = inputObjectType({
  name: 'ListWorkspaceAttributeValuesFilter',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.id('attributeTypeId');
    t.field('status', { type: GlobalAttributeStatus });
    t.field('auditStatus', { type: GlobalAttributeAuditStatus });
    t.string('searchTerm');
    t.boolean('promotedToGlobal');
  },
});

export const UpsertWorkspaceTagInput = inputObjectType({
  name: 'UpsertWorkspaceTagInput',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.nonNull.string('label');
    t.string('displayName');
    t.field('pos', { type: GlobalTagPartOfSpeech });
    t.list.string('synonyms');
    t.field('status', { type: GlobalTagStatus });
    t.field('auditStatus', { type: GlobalTagAuditStatus });
    t.string('notes');
    t.string('source');
  },
});

export const UpsertWorkspaceAttributeTypeInput = inputObjectType({
  name: 'UpsertWorkspaceAttributeTypeInput',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.nonNull.string('name');
    t.nonNull.field('kind', { type: GlobalAttributeKind });
    t.nonNull.field('valueType', { type: GlobalAttributeValueType });
    t.field('dimension', { type: GlobalAttributeDimension });
    t.string('canonicalUnit');
    t.list.string('allowedUnits');
    t.string('canonicalValueSetId');
    t.list.string('synonyms');
    t.field('status', { type: GlobalAttributeStatus });
    t.field('auditStatus', { type: GlobalAttributeAuditStatus });
    t.field('appliesTo', { type: GlobalAttributeAppliesTo });
    t.list.field('usageHints', { type: GlobalAttributeUsageHint });
    t.string('notes');
    t.field('validationRules', { type: 'JSONObject' });
    t.string('source');
  },
});

export const UpsertWorkspaceUnitDefinitionInput = inputObjectType({
  name: 'UpsertWorkspaceUnitDefinitionInput',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.nonNull.string('code');
    t.string('name');
    t.field('dimension', { type: GlobalAttributeDimension });
    t.string('canonicalUnitCode');
    t.float('toCanonicalFactor');
    t.float('offset');
    t.field('status', { type: GlobalUnitStatus });
    t.string('source');
  },
});

export const UpsertWorkspaceAttributeValueInput = inputObjectType({
  name: 'UpsertWorkspaceAttributeValueInput',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.nonNull.id('attributeTypeId');
    t.nonNull.string('value');
    t.list.string('synonyms');
    t.field('codes', { type: 'JSONObject' });
    t.field('status', { type: GlobalAttributeStatus });
    t.field('auditStatus', { type: GlobalAttributeAuditStatus });
    t.string('source');
  },
});

export const VocabularyScope = enumType({
  name: 'VocabularyScope',
  members: ['GLOBAL', 'WORKSPACE'],
});

export const ResolvedWorkspaceTagResult = objectType({
  name: 'ResolvedWorkspaceTagResult',
  sourceType: {
    module: require.resolve('../../services/workspace_vocabulary'),
    export: 'ResolvedWorkspaceTag',
  },
  definition(t) {
    t.nonNull.field('scope', { type: VocabularyScope });
    t.nonNull.boolean('created');
    t.field('globalTag', { type: GlobalTag });
    t.field('workspaceTag', { type: WorkspaceTag });
  },
});

export const ResolvedWorkspaceAttributeTypeResult = objectType({
  name: 'ResolvedWorkspaceAttributeTypeResult',
  sourceType: {
    module: require.resolve('../../services/workspace_vocabulary'),
    export: 'ResolvedWorkspaceAttributeType',
  },
  definition(t) {
    t.nonNull.field('scope', { type: VocabularyScope });
    t.nonNull.boolean('created');
    t.field('globalAttributeType', { type: GlobalAttributeType });
    t.field('workspaceAttributeType', { type: WorkspaceAttributeType });
  },
});

export const ResolvedWorkspaceUnitDefinitionResult = objectType({
  name: 'ResolvedWorkspaceUnitDefinitionResult',
  sourceType: {
    module: require.resolve('../../services/workspace_vocabulary'),
    export: 'ResolvedWorkspaceUnitDefinition',
  },
  definition(t) {
    t.nonNull.field('scope', { type: VocabularyScope });
    t.nonNull.boolean('created');
    t.field('globalUnitDefinition', { type: GlobalUnitDefinition });
    t.field('workspaceUnitDefinition', { type: WorkspaceUnitDefinition });
  },
});

export const ResolvedWorkspaceAttributeValueResult = objectType({
  name: 'ResolvedWorkspaceAttributeValueResult',
  sourceType: {
    module: require.resolve('../../services/workspace_vocabulary'),
    export: 'ResolvedWorkspaceAttributeValue',
  },
  definition(t) {
    t.nonNull.field('scope', { type: VocabularyScope });
    t.nonNull.boolean('created');
    t.field('globalAttributeValue', { type: GlobalAttributeValue });
    t.field('workspaceAttributeValue', { type: WorkspaceAttributeValue });
  },
});

export const ResolveGlobalOrWorkspaceTagInput = inputObjectType({
  name: 'ResolveGlobalOrWorkspaceTagInput',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.nonNull.string('label');
    t.string('displayName');
    t.field('pos', { type: GlobalTagPartOfSpeech });
    t.list.string('synonyms');
    t.field('status', { type: GlobalTagStatus });
    t.field('auditStatus', { type: GlobalTagAuditStatus });
    t.string('notes');
    t.string('source');
    t.boolean('preferGlobal');
  },
});

export const ResolveGlobalOrWorkspaceAttributeTypeInput = inputObjectType({
  name: 'ResolveGlobalOrWorkspaceAttributeTypeInput',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.nonNull.string('name');
    t.nonNull.field('kind', { type: GlobalAttributeKind });
    t.nonNull.field('valueType', { type: GlobalAttributeValueType });
    t.field('dimension', { type: GlobalAttributeDimension });
    t.string('canonicalUnit');
    t.list.string('allowedUnits');
    t.string('canonicalValueSetId');
    t.list.string('synonyms');
    t.field('status', { type: GlobalAttributeStatus });
    t.field('auditStatus', { type: GlobalAttributeAuditStatus });
    t.field('appliesTo', { type: GlobalAttributeAppliesTo });
    t.list.field('usageHints', { type: GlobalAttributeUsageHint });
    t.string('notes');
    t.field('validationRules', { type: 'JSONObject' });
    t.string('source');
    t.boolean('preferGlobal');
  },
});

export const ResolveGlobalOrWorkspaceUnitDefinitionInput = inputObjectType({
  name: 'ResolveGlobalOrWorkspaceUnitDefinitionInput',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.nonNull.string('code');
    t.string('name');
    t.field('dimension', { type: GlobalAttributeDimension });
    t.string('canonicalUnitCode');
    t.float('toCanonicalFactor');
    t.float('offset');
    t.field('status', { type: GlobalUnitStatus });
    t.string('source');
    t.boolean('preferGlobal');
  },
});

export const ResolveGlobalOrWorkspaceAttributeValueInput = inputObjectType({
  name: 'ResolveGlobalOrWorkspaceAttributeValueInput',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.nonNull.id('attributeTypeId');
    t.nonNull.string('value');
    t.list.string('synonyms');
    t.field('codes', { type: 'JSONObject' });
    t.field('status', { type: GlobalAttributeStatus });
    t.field('auditStatus', { type: GlobalAttributeAuditStatus });
    t.string('source');
    t.boolean('preferGlobal');
  },
});

export const PromoteWorkspaceTagToGlobalInput = inputObjectType({
  name: 'PromoteWorkspaceTagToGlobalInput',
  definition(t) {
    t.nonNull.id('workspaceTagId');
    t.id('targetGlobalTagId');
  },
});

export const PromoteWorkspaceAttributeTypeToGlobalInput = inputObjectType({
  name: 'PromoteWorkspaceAttributeTypeToGlobalInput',
  definition(t) {
    t.nonNull.id('workspaceAttributeTypeId');
    t.id('targetGlobalAttributeTypeId');
  },
});

export const PromoteWorkspaceUnitDefinitionToGlobalInput = inputObjectType({
  name: 'PromoteWorkspaceUnitDefinitionToGlobalInput',
  definition(t) {
    t.nonNull.id('workspaceUnitDefinitionId');
    t.string('targetGlobalUnitCode');
  },
});

export const PromoteWorkspaceAttributeValueToGlobalInput = inputObjectType({
  name: 'PromoteWorkspaceAttributeValueToGlobalInput',
  definition(t) {
    t.nonNull.id('workspaceAttributeValueId');
    t.id('targetGlobalAttributeValueId');
  },
});

export const PromoteWorkspaceAttributeTypesToGlobalInput = inputObjectType({
  name: 'PromoteWorkspaceAttributeTypesToGlobalInput',
  definition(t) {
    t.nonNull.list.nonNull.id('workspaceAttributeTypeIds');
  },
});

export const PromoteWorkspaceAttributeValuesToGlobalInput = inputObjectType({
  name: 'PromoteWorkspaceAttributeValuesToGlobalInput',
  definition(t) {
    t.nonNull.list.nonNull.id('workspaceAttributeValueIds');
  },
});

export const PromotedWorkspaceAttributeType = objectType({
  name: 'PromotedWorkspaceAttributeType',
  definition(t) {
    t.nonNull.id('workspaceAttributeTypeId');
    t.nonNull.field('globalAttributeType', { type: GlobalAttributeType });
  },
});

export const PromoteWorkspaceAttributeTypesToGlobalResult = objectType({
  name: 'PromoteWorkspaceAttributeTypesToGlobalResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', {
      type: PromotedWorkspaceAttributeType,
    });
  },
});

export const PromotedWorkspaceAttributeValue = objectType({
  name: 'PromotedWorkspaceAttributeValue',
  definition(t) {
    t.nonNull.id('workspaceAttributeValueId');
    t.nonNull.field('globalAttributeValue', { type: GlobalAttributeValue });
  },
});

export const PromoteWorkspaceAttributeValuesToGlobalResult = objectType({
  name: 'PromoteWorkspaceAttributeValuesToGlobalResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', {
      type: PromotedWorkspaceAttributeValue,
    });
  },
});

export const WorkspaceVocabularyQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('listWorkspaceTags', {
      type: WorkspaceTagListResult,
      args: {
        filter: nonNull(arg({ type: ListWorkspaceTagsFilter })),
        page: arg({ type: PageInfoInput }),
      },
      resolve: (_root, { filter, page }, ctx) =>
        ctx.services.workspaceVocabularyService.listWorkspaceTags(
          {
            filter: {
              workspaceId: filter.workspaceId,
              pos: optional(filter.pos),
              status: optional(filter.status),
              searchTerm: optional(filter.searchTerm),
              promotedToGlobal: optional(filter.promotedToGlobal),
            },
            page: page
              ? {
                  size: optional(page.size),
                  number: optional(page.number),
                }
              : undefined,
          },
          ctx.user,
        ),
    });

    t.field('getWorkspaceTagById', {
      type: WorkspaceTag,
      args: { id: nonNull(idArg()) },
      resolve: (_root, { id }, ctx) =>
        ctx.services.workspaceVocabularyService.getWorkspaceTagById(
          id,
          ctx.user,
        ),
    });

    t.field('listWorkspaceUnitDefinitions', {
      type: WorkspaceUnitDefinitionListResult,
      args: {
        filter: nonNull(arg({ type: ListWorkspaceUnitDefinitionsFilter })),
        page: arg({ type: PageInfoInput }),
      },
      resolve: (_root, { filter, page }, ctx) =>
        ctx.services.workspaceVocabularyService.listWorkspaceUnitDefinitions(
          {
            filter: {
              workspaceId: filter.workspaceId,
              dimension: optional(filter.dimension),
              status: optional(filter.status),
              searchTerm: optional(filter.searchTerm),
              promotedToGlobal: optional(filter.promotedToGlobal),
            },
            page: page
              ? {
                  size: optional(page.size),
                  number: optional(page.number),
                }
              : undefined,
          },
          ctx.user,
        ),
    });

    t.field('getWorkspaceUnitDefinitionById', {
      type: WorkspaceUnitDefinition,
      args: { id: nonNull(idArg()) },
      resolve: (_root, { id }, ctx) =>
        ctx.services.workspaceVocabularyService.getWorkspaceUnitDefinitionById(
          id,
          ctx.user,
        ),
    });

    t.field('listWorkspaceAttributeTypes', {
      type: WorkspaceAttributeTypeListResult,
      args: {
        filter: nonNull(arg({ type: ListWorkspaceAttributeTypesFilter })),
        page: arg({ type: PageInfoInput }),
      },
      resolve: (_root, { filter, page }, ctx) =>
        ctx.services.workspaceVocabularyService.listWorkspaceAttributeTypes(
          {
            filter: {
              workspaceId: filter.workspaceId,
              kind: optional(filter.kind),
              valueType: optional(filter.valueType),
              dimension: optional(filter.dimension),
              status: optional(filter.status),
              appliesTo: optional(filter.appliesTo),
              usageHint: optional(filter.usageHint),
              searchTerm: optional(filter.searchTerm),
              promotedToGlobal: optional(filter.promotedToGlobal),
            },
            page: page
              ? {
                  size: optional(page.size),
                  number: optional(page.number),
                }
              : undefined,
          },
          ctx.user,
        ),
    });

    t.field('getWorkspaceAttributeTypeById', {
      type: WorkspaceAttributeType,
      args: { id: nonNull(idArg()) },
      resolve: (_root, { id }, ctx) =>
        ctx.services.workspaceVocabularyService.getWorkspaceAttributeTypeById(
          id,
          ctx.user,
        ),
    });

    t.field('listWorkspaceAttributeValues', {
      type: WorkspaceAttributeValueListResult,
      args: {
        filter: nonNull(arg({ type: ListWorkspaceAttributeValuesFilter })),
        page: arg({ type: PageInfoInput }),
      },
      resolve: (_root, { filter, page }, ctx) =>
        ctx.services.workspaceVocabularyService.listWorkspaceAttributeValues(
          {
            filter: {
              workspaceId: filter.workspaceId,
              attributeTypeId: optional(filter.attributeTypeId),
              status: optional(filter.status),
              auditStatus: optional(filter.auditStatus),
              searchTerm: optional(filter.searchTerm),
              promotedToGlobal: optional(filter.promotedToGlobal),
            },
            page: page
              ? {
                  size: optional(page.size),
                  number: optional(page.number),
                }
              : undefined,
          },
          ctx.user,
        ),
    });

    t.field('getWorkspaceAttributeValueById', {
      type: WorkspaceAttributeValue,
      args: { id: nonNull(idArg()) },
      resolve: (_root, { id }, ctx) =>
        ctx.services.workspaceVocabularyService.getWorkspaceAttributeValueById(
          id,
          ctx.user,
        ),
    });
  },
});

export const WorkspaceVocabularyMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('upsertWorkspaceTag', {
      type: WorkspaceTag,
      args: { input: nonNull(arg({ type: UpsertWorkspaceTagInput })) },
      resolve: (_root, { input }, ctx) =>
        ctx.services.workspaceVocabularyService.upsertWorkspaceTag(
          {
            workspaceId: input.workspaceId,
            label: input.label,
            displayName: optional(input.displayName),
            pos: optional(input.pos),
            synonyms: compactList(input.synonyms),
            status: optional(input.status),
            auditStatus: optional(input.auditStatus),
            notes: optional(input.notes),
            source: optional(input.source),
          },
          ctx.user,
        ),
    });

    t.field('upsertWorkspaceAttributeType', {
      type: WorkspaceAttributeType,
      args: {
        input: nonNull(arg({ type: UpsertWorkspaceAttributeTypeInput })),
      },
      resolve: (_root, { input }, ctx) =>
        ctx.services.workspaceVocabularyService.upsertWorkspaceAttributeType(
          {
            workspaceId: input.workspaceId,
            name: input.name,
            kind: input.kind,
            valueType: input.valueType,
            dimension: optional(input.dimension),
            canonicalUnit: optional(input.canonicalUnit),
            allowedUnits: compactList(input.allowedUnits),
            canonicalValueSetId: optional(input.canonicalValueSetId),
            synonyms: compactList(input.synonyms),
            status: optional(input.status),
            auditStatus: optional(input.auditStatus),
            appliesTo: optional(input.appliesTo),
            usageHints: compactList(input.usageHints),
            notes: optional(input.notes),
            validationRules: optional(input.validationRules),
            source: optional(input.source),
          },
          ctx.user,
        ),
    });

    t.field('upsertWorkspaceUnitDefinition', {
      type: WorkspaceUnitDefinition,
      args: {
        input: nonNull(arg({ type: UpsertWorkspaceUnitDefinitionInput })),
      },
      resolve: (_root, { input }, ctx) =>
        ctx.services.workspaceVocabularyService.upsertWorkspaceUnitDefinition(
          {
            workspaceId: input.workspaceId,
            code: input.code,
            name: optional(input.name),
            dimension: optional(input.dimension),
            canonicalUnitCode: optional(input.canonicalUnitCode),
            toCanonicalFactor: optional(input.toCanonicalFactor),
            offset: optional(input.offset),
            status: optional(input.status),
            source: optional(input.source),
          },
          ctx.user,
        ),
    });

    t.field('upsertWorkspaceAttributeValue', {
      type: WorkspaceAttributeValue,
      args: {
        input: nonNull(arg({ type: UpsertWorkspaceAttributeValueInput })),
      },
      resolve: (_root, { input }, ctx) =>
        ctx.services.workspaceVocabularyService.upsertWorkspaceAttributeValue(
          {
            workspaceId: input.workspaceId,
            attributeTypeId: input.attributeTypeId,
            value: input.value,
            synonyms: compactList(input.synonyms),
            codes: optional(input.codes),
            status: optional(input.status),
            auditStatus: optional(input.auditStatus),
            source: optional(input.source),
          },
          ctx.user,
        ),
    });

    t.field('resolveGlobalOrWorkspaceTag', {
      type: ResolvedWorkspaceTagResult,
      args: {
        input: nonNull(arg({ type: ResolveGlobalOrWorkspaceTagInput })),
      },
      resolve: (_root, { input }, ctx) =>
        ctx.services.workspaceVocabularyService.resolveGlobalOrWorkspaceTag(
          {
            workspaceId: input.workspaceId,
            label: input.label,
            displayName: optional(input.displayName),
            pos: optional(input.pos),
            synonyms: compactList(input.synonyms),
            status: optional(input.status),
            auditStatus: optional(input.auditStatus),
            notes: optional(input.notes),
            source: optional(input.source),
            preferGlobal: optional(input.preferGlobal),
          },
          ctx.user,
        ),
    });

    t.field('resolveGlobalOrWorkspaceAttributeType', {
      type: ResolvedWorkspaceAttributeTypeResult,
      args: {
        input: nonNull(
          arg({ type: ResolveGlobalOrWorkspaceAttributeTypeInput }),
        ),
      },
      resolve: (_root, { input }, ctx) =>
        ctx.services.workspaceVocabularyService.resolveGlobalOrWorkspaceAttributeType(
          {
            workspaceId: input.workspaceId,
            name: input.name,
            kind: input.kind,
            valueType: input.valueType,
            dimension: optional(input.dimension),
            canonicalUnit: optional(input.canonicalUnit),
            allowedUnits: compactList(input.allowedUnits),
            canonicalValueSetId: optional(input.canonicalValueSetId),
            synonyms: compactList(input.synonyms),
            status: optional(input.status),
            auditStatus: optional(input.auditStatus),
            appliesTo: optional(input.appliesTo),
            usageHints: compactList(input.usageHints),
            notes: optional(input.notes),
            validationRules: optional(input.validationRules),
            source: optional(input.source),
            preferGlobal: optional(input.preferGlobal),
          },
          ctx.user,
        ),
    });

    t.field('resolveGlobalOrWorkspaceUnitDefinition', {
      type: ResolvedWorkspaceUnitDefinitionResult,
      args: {
        input: nonNull(
          arg({ type: ResolveGlobalOrWorkspaceUnitDefinitionInput }),
        ),
      },
      resolve: (_root, { input }, ctx) =>
        ctx.services.workspaceVocabularyService.resolveGlobalOrWorkspaceUnitDefinition(
          {
            workspaceId: input.workspaceId,
            code: input.code,
            name: optional(input.name),
            dimension: optional(input.dimension),
            canonicalUnitCode: optional(input.canonicalUnitCode),
            toCanonicalFactor: optional(input.toCanonicalFactor),
            offset: optional(input.offset),
            status: optional(input.status),
            source: optional(input.source),
            preferGlobal: optional(input.preferGlobal),
          },
          ctx.user,
        ),
    });

    t.field('resolveGlobalOrWorkspaceAttributeValue', {
      type: ResolvedWorkspaceAttributeValueResult,
      args: {
        input: nonNull(
          arg({ type: ResolveGlobalOrWorkspaceAttributeValueInput }),
        ),
      },
      resolve: (_root, { input }, ctx) =>
        ctx.services.workspaceVocabularyService.resolveGlobalOrWorkspaceAttributeValue(
          {
            workspaceId: input.workspaceId,
            attributeTypeId: input.attributeTypeId,
            value: input.value,
            synonyms: compactList(input.synonyms),
            codes: optional(input.codes),
            status: optional(input.status),
            auditStatus: optional(input.auditStatus),
            source: optional(input.source),
            preferGlobal: optional(input.preferGlobal),
          },
          ctx.user,
        ),
    });
  },
});

export const WorkspaceVocabularyAdminMutations = extendType({
  type: 'AdminMutationNamespace',
  definition(t) {
    t.field('promoteWorkspaceTagToGlobal', {
      type: GlobalTag,
      args: {
        input: nonNull(arg({ type: PromoteWorkspaceTagToGlobalInput })),
      },
      resolve: (_root, { input }, ctx) =>
        ctx.services.workspaceVocabularyService.promoteWorkspaceTagToGlobal(
          {
            workspaceTagId: input.workspaceTagId,
            targetGlobalTagId: input.targetGlobalTagId ?? undefined,
          },
          ctx.user,
        ),
    });

    t.field('promoteWorkspaceAttributeTypeToGlobal', {
      type: GlobalAttributeType,
      args: {
        input: nonNull(
          arg({ type: PromoteWorkspaceAttributeTypeToGlobalInput }),
        ),
      },
      resolve: (_root, { input }, ctx) =>
        ctx.services.workspaceVocabularyService.promoteWorkspaceAttributeTypeToGlobal(
          {
            workspaceAttributeTypeId: input.workspaceAttributeTypeId,
            targetGlobalAttributeTypeId:
              input.targetGlobalAttributeTypeId ?? undefined,
          },
          ctx.user,
        ),
    });

    t.field('promoteWorkspaceAttributeTypesToGlobal', {
      type: PromoteWorkspaceAttributeTypesToGlobalResult,
      args: {
        input: nonNull(arg({ type: PromoteWorkspaceAttributeTypesToGlobalInput })),
      },
      resolve: async (_root, { input }, ctx) => {
        const items = await Promise.all(
          input.workspaceAttributeTypeIds.map(async (workspaceAttributeTypeId: string) => {
            const globalAttributeType =
              await ctx.services.workspaceVocabularyService.promoteWorkspaceAttributeTypeToGlobal(
                {
                  workspaceAttributeTypeId,
                },
                ctx.user,
              );
            return {
              workspaceAttributeTypeId,
              globalAttributeType,
            };
          }),
        );
        return { items };
      },
    });

    t.field('promoteWorkspaceUnitDefinitionToGlobal', {
      type: GlobalUnitDefinition,
      args: {
        input: nonNull(
          arg({ type: PromoteWorkspaceUnitDefinitionToGlobalInput }),
        ),
      },
      resolve: (_root, { input }, ctx) =>
        ctx.services.workspaceVocabularyService.promoteWorkspaceUnitDefinitionToGlobal(
          {
            workspaceUnitDefinitionId: input.workspaceUnitDefinitionId,
            targetGlobalUnitCode: input.targetGlobalUnitCode ?? undefined,
          },
          ctx.user,
        ),
    });

    t.field('promoteWorkspaceAttributeValueToGlobal', {
      type: GlobalAttributeValue,
      args: {
        input: nonNull(
          arg({ type: PromoteWorkspaceAttributeValueToGlobalInput }),
        ),
      },
      resolve: (_root, { input }, ctx) =>
        ctx.services.workspaceVocabularyService.promoteWorkspaceAttributeValueToGlobal(
          {
            workspaceAttributeValueId: input.workspaceAttributeValueId,
            targetGlobalAttributeValueId:
              input.targetGlobalAttributeValueId ?? undefined,
          },
          ctx.user,
        ),
    });

    t.field('promoteWorkspaceAttributeValuesToGlobal', {
      type: PromoteWorkspaceAttributeValuesToGlobalResult,
      args: {
        input: nonNull(arg({ type: PromoteWorkspaceAttributeValuesToGlobalInput })),
      },
      resolve: async (_root, { input }, ctx) => {
        const items = await Promise.all(
          input.workspaceAttributeValueIds.map(async (workspaceAttributeValueId: string) => {
            const globalAttributeValue =
              await ctx.services.workspaceVocabularyService.promoteWorkspaceAttributeValueToGlobal(
                {
                  workspaceAttributeValueId,
                },
                ctx.user,
              );
            return {
              workspaceAttributeValueId,
              globalAttributeValue,
            };
          }),
        );
        return { items };
      },
    });
  },
});
