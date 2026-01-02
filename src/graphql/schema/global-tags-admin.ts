import { extendType, arg, nonNull, idArg } from 'nexus';
import {
  GlobalTagListResult,
  GlobalTagRelationListResult,
  ListGlobalTagsFilter,
  ListGlobalTagRelationsFilter,
  CreateGlobalTagInput,
  UpdateGlobalTagInput,
  MergeGlobalTagInput,
  CreateGlobalTagRelationInput,
  GlobalTag,
  GlobalTagRelation,
} from './global-tags';
import { PageInfoInput } from './common';

export const GlobalTagsAdminQueries = extendType({
  type: 'AdminQueryNamespace',
  definition(t) {
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

    t.field('getGlobalTagById', {
      type: GlobalTag,
      args: { id: nonNull(idArg()) },
      resolve: (_root, { id }, ctx) =>
        ctx.services.globalTagsService.getTagById(id),
    });
  },
});

export const GlobalTagsAdminMutations = extendType({
  type: 'AdminMutationNamespace',
  definition(t) {
    t.field('createGlobalTag', {
      type: GlobalTag,
      args: {
        input: nonNull(arg({ type: CreateGlobalTagInput })),
      },
      resolve: (_root, { input }, ctx) =>
        ctx.services.globalTagsService.createTag(input as any, ctx.user),
    });

    t.field('updateGlobalTag', {
      type: GlobalTag,
      args: {
        id: nonNull(idArg()),
        input: nonNull(arg({ type: UpdateGlobalTagInput })),
      },
      resolve: (_root, { id, input }, ctx) =>
        ctx.services.globalTagsService.updateTag(id, input as any, ctx.user),
    });

    t.field('mergeGlobalTag', {
      type: GlobalTag,
      args: {
        input: nonNull(arg({ type: MergeGlobalTagInput })),
      },
      resolve: (_root, { input }, ctx) =>
        ctx.services.globalTagsService.mergeTag(input as any, ctx.user),
    });

    t.field('createGlobalTagRelation', {
      type: GlobalTagRelation,
      args: {
        input: nonNull(arg({ type: CreateGlobalTagRelationInput })),
      },
      resolve: (_root, { input }, ctx) =>
        ctx.services.globalTagsService.createTagRelation(
          input as any,
          ctx.user,
        ),
    });
  },
});
