import {
  enumType,
  objectType,
  inputObjectType,
  extendType,
  arg,
  nonNull,
  idArg,
} from 'nexus';
import { PaginationInfo, PageInfoInput } from './common';
import {
  GLOBAL_TAG_POS,
  GLOBAL_TAG_STATUS,
  GLOBAL_TAG_AUDIT_STATUS,
  GLOBAL_TAG_RELATION_TYPE,
} from '../../services/global_tags';

export const GlobalTagPartOfSpeech = enumType({
  name: 'GlobalTagPartOfSpeech',
  members: Object.values(GLOBAL_TAG_POS),
});

export const GlobalTagStatus = enumType({
  name: 'GlobalTagStatus',
  members: Object.values(GLOBAL_TAG_STATUS),
});

export const GlobalTagAuditStatus = enumType({
  name: 'GlobalTagAuditStatus',
  members: Object.values(GLOBAL_TAG_AUDIT_STATUS),
});

export const GlobalTagRelationType = enumType({
  name: 'GlobalTagRelationType',
  members: Object.values(GLOBAL_TAG_RELATION_TYPE),
});

export const GlobalTag = objectType({
  name: 'GlobalTag',
  sourceType: {
    module: require.resolve('../../services/global_tags'),
    export: 'GlobalTag',
  },
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('label');
    t.string('displayName');
    t.nonNull.field('pos', { type: GlobalTagPartOfSpeech });
    t.list.string('synonyms');
    t.nonNull.field('status', { type: GlobalTagStatus });
    t.field('auditStatus', { type: GlobalTagAuditStatus });
    t.string('mergedIntoId');
    t.string('notes');
    t.string('source');
    t.field('createdAt', { type: 'DateTime' });
    t.field('updatedAt', { type: 'DateTime' });
    t.string('createdBy');
    t.string('updatedBy');
  },
});

export const GlobalTagRelation = objectType({
  name: 'GlobalTagRelation',
  sourceType: {
    module: require.resolve('../../services/global_tags'),
    export: 'GlobalTagRelation',
  },
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('fromTagId');
    t.nonNull.string('toTagId');
    t.nonNull.field('relationType', { type: GlobalTagRelationType });
    t.float('confidence');
    t.string('source');
    t.field('createdAt', { type: 'DateTime' });
    t.field('updatedAt', { type: 'DateTime' });
    t.string('createdBy');
    t.string('updatedBy');
  },
});

export const ListGlobalTagsFilter = inputObjectType({
  name: 'ListGlobalTagsFilter',
  definition(t) {
    t.field('pos', { type: GlobalTagPartOfSpeech });
    t.field('status', { type: GlobalTagStatus });
    t.string('searchTerm');
  },
});

export const ListGlobalTagRelationsFilter = inputObjectType({
  name: 'ListGlobalTagRelationsFilter',
  definition(t) {
    t.string('fromTagId');
    t.string('toTagId');
    t.field('relationType', { type: GlobalTagRelationType });
  },
});

export const CreateGlobalTagInput = inputObjectType({
  name: 'CreateGlobalTagInput',
  definition(t) {
    t.string('label');
    t.string('displayName');
    t.field('pos', { type: GlobalTagPartOfSpeech });
    t.list.string('synonyms');
    t.field('status', { type: GlobalTagStatus });
    t.field('auditStatus', { type: GlobalTagAuditStatus });
    t.string('notes');
    t.string('source');
  },
});

export const UpdateGlobalTagInput = inputObjectType({
  name: 'UpdateGlobalTagInput',
  definition(t) {
    t.string('label');
    t.string('displayName');
    t.field('pos', { type: GlobalTagPartOfSpeech });
    t.list.string('synonyms');
    t.field('status', { type: GlobalTagStatus });
    t.field('auditStatus', { type: GlobalTagAuditStatus });
    t.string('notes');
    t.string('source');
  },
});

export const MergeGlobalTagInput = inputObjectType({
  name: 'MergeGlobalTagInput',
  definition(t) {
    t.nonNull.string('sourceTagId');
    t.nonNull.string('targetTagId');
    t.string('reason');
  },
});

export const CreateGlobalTagRelationInput = inputObjectType({
  name: 'CreateGlobalTagRelationInput',
  definition(t) {
    t.nonNull.string('fromTagId');
    t.nonNull.string('toTagId');
    t.nonNull.field('relationType', { type: GlobalTagRelationType });
    t.float('confidence');
    t.string('source');
  },
});

export const IngestGlobalTagStringInput = inputObjectType({
  name: 'IngestGlobalTagStringInput',
  definition(t) {
    t.nonNull.string('raw');
    t.field('posHint', { type: GlobalTagPartOfSpeech });
    t.string('source');
  },
});

export const GlobalTagListResult = objectType({
  name: 'GlobalTagListResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: GlobalTag });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const GlobalTagRelationListResult = objectType({
  name: 'GlobalTagRelationListResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: GlobalTagRelation });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const GlobalTagIngestionResult = objectType({
  name: 'GlobalTagIngestionResult',
  definition(t) {
    t.nonNull.field('tag', { type: GlobalTag });
    t.nonNull.field('parsed', { type: 'JSONObject' });
  },
});

export const GlobalTagsQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('getGlobalTagById', {
      type: GlobalTag,
      args: {
        id: nonNull(idArg()),
      },
      resolve: (_root, { id }, ctx) =>
        ctx.services.globalTagsService.getTagById(id),
    });

    t.field('listGlobalTags', {
      type: GlobalTagListResult,
      args: {
        filter: arg({ type: ListGlobalTagsFilter }),
        page: arg({ type: PageInfoInput }),
      },
      resolve: (_root, { filter, page }, ctx) =>
        ctx.services.globalTagsService.listTags({
          filter: filter
            ? (Object.fromEntries(
                Object.entries(filter).map(([key, value]) => [
                  key,
                  value === null ? undefined : value,
                ]),
              ) as any)
            : undefined,
          page: page
            ? (Object.fromEntries(
                Object.entries(page).map(([key, value]) => [
                  key,
                  value === null ? undefined : value,
                ]),
              ) as any)
            : undefined,
        }),
    });

    t.field('listGlobalTagRelations', {
      type: GlobalTagRelationListResult,
      args: {
        filter: arg({ type: ListGlobalTagRelationsFilter }),
        page: arg({ type: PageInfoInput }),
      },
      resolve: (_root, { filter, page }, ctx) =>
        ctx.services.globalTagsService.listTagRelations({
          filter: filter
            ? (Object.fromEntries(
                Object.entries(filter).map(([key, value]) => [
                  key,
                  value === null ? undefined : value,
                ]),
              ) as any)
            : undefined,
          page: page
            ? (Object.fromEntries(
                Object.entries(page).map(([key, value]) => [
                  key,
                  value === null ? undefined : value,
                ]),
              ) as any)
            : undefined,
        }),
    });
  },
});

export const GlobalTagsMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createGlobalTag', {
      type: GlobalTag,
      args: {
        input: nonNull(arg({ type: CreateGlobalTagInput })),
      },
      resolve: async (_root, { input }, ctx) => {
        if (!ctx.user) throw new Error('Unauthorized');
        return ctx.services.globalTagsService.createTag(input as any, ctx.user);
      },
    });

    t.field('updateGlobalTag', {
      type: GlobalTag,
      args: {
        id: nonNull(idArg()),
        input: nonNull(arg({ type: UpdateGlobalTagInput })),
      },
      resolve: async (_root, { id, input }, ctx) => {
        if (!ctx.user) throw new Error('Unauthorized');
        return ctx.services.globalTagsService.updateTag(
          id,
          input as any,
          ctx.user,
        );
      },
    });

    t.field('createGlobalTagRelation', {
      type: GlobalTagRelation,
      args: {
        input: nonNull(arg({ type: CreateGlobalTagRelationInput })),
      },
      resolve: async (_root, { input }, ctx) => {
        if (!ctx.user) throw new Error('Unauthorized');
        return ctx.services.globalTagsService.createTagRelation(
          input as any,
          ctx.user,
        );
      },
    });

    t.field('ingestGlobalTagString', {
      type: GlobalTagIngestionResult,
      args: {
        input: nonNull(arg({ type: IngestGlobalTagStringInput })),
      },
      resolve: async (_root, { input }, ctx) => {
        if (!ctx.user) throw new Error('Unauthorized');
        return ctx.services.globalTagsService.ingestGlobalTagString(
          input as any,
          ctx.user,
        );
      },
    });
  },
});
