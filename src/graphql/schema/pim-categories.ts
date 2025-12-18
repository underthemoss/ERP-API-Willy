import {
  extendType,
  objectType,
  inputObjectType,
  arg,
  idArg,
  nonNull,
} from 'nexus';
import { PaginationInfo } from './common';
import { PimCategoryDoc } from '../../services/pim_categories/model';

export const PimCategory = objectType({
  name: 'PimCategory',
  sourceType: {
    module: require.resolve('../../services/pim_categories'),
    export: 'PimCategory',
  },
  definition(t) {
    t.nonNull.string('id', { resolve: (parent) => parent._id.toString() });
    t.nonNull.string('name');
    t.nonNull.string('path');
    t.string('description');
    t.boolean('has_products');
    t.nonNull.string('platform_id');
    t.nonNull.string('tenant_id');
    t.boolean('is_deleted');
    t.int('childrenCount', {
      resolve: async (parent, _, ctx) => {
        const count =
          await ctx.services.pimCategoriesService.countPimCategories(
            {
              filter: {
                parentId: parent._id,
              },
            },
            ctx.user,
          );

        return count;
      },
    });
  },
});

export const ListPimCategoriesResult = objectType({
  name: 'ListPimCategoriesResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', {
      type: PimCategory,
    });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const PimCategoryMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('upsertPimCategory', {
      type: PimCategory,
      args: {
        input: nonNull(
          inputObjectType({
            name: 'UpsertPimCategoryInput',
            definition(t) {
              t.nonNull.id('id');
              t.nonNull.string('name');
              t.nonNull.string('path');
              t.nonNull.string('description');
              t.nonNull.boolean('has_products');
              t.nonNull.string('platform_id');
            },
          }),
        ),
      },
      async resolve(_, { input }, ctx) {
        if (!ctx.envConfig.IN_TEST_MODE && ctx.envConfig.LEVEL !== 'dev') {
          throw new Error(
            'This mutation is only available in test mode or dev environment.',
          );
        }

        const result =
          await ctx.services.pimCategoriesService.upsertPimCategory(
            input.id,
            { ...input, is_deleted: false },
            ctx.user,
          );

        return result;
      },
    });
  },
});

export const PimCategoriesQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('getPimCategoryById', {
      type: PimCategory,
      args: {
        id: nonNull(idArg()),
      },
      async resolve(_, { id }, ctx) {
        const result =
          await ctx.services.pimCategoriesService.getPimCategoryById(
            id,
            ctx.user,
          );
        return result;
      },
    });
    t.field('listPimCategories', {
      type: ListPimCategoriesResult,
      args: {
        page: arg({
          type: inputObjectType({
            name: 'ListPimCategoriesPage',
            definition(t) {
              t.int('number', { default: 1 });
              t.int('size', { default: 10 });
            },
          }),
        }),
        filter: arg({
          type: inputObjectType({
            name: 'ListPimCategoriesFilter',
            definition(t) {
              t.id('priceBookId');
              t.string('path');
              t.string('searchTerm');
              t.id('parentId');
            },
          }),
        }),
      },
      async resolve(_, args, ctx) {
        const result =
          await ctx.services.pimCategoriesService.listPimCategories(
            {
              filter: {
                path: args?.filter?.path ?? undefined,
                parentId: args?.filter?.parentId ?? undefined,
                search: args.filter?.searchTerm
                  ? {
                      query: args.filter?.searchTerm,
                      fields: ['name', 'path'],
                    }
                  : undefined,
              },
              page: {
                number: args?.page?.number || 1,
                size: args?.page?.size || 10,
              },
            },
            ctx.user,
          );

        if (args.filter?.priceBookId) {
          const hasPricesPromises = result.items.map(
            async (category: PimCategoryDoc) => {
              return ctx.services.pricesService.hasPriceForCategory(
                {
                  categoryName: category.name,
                  categoryPath: category.path,
                  priceBookId: args.filter!.priceBookId!,
                },
                ctx.user,
              );
            },
          );

          const hasPricesResults = await Promise.all(hasPricesPromises);
          result.items = result.items.filter(
            (_: PimCategoryDoc, index: number) => {
              return hasPricesResults[index];
            },
          );
        }

        return result;
      },
    });
  },
});
