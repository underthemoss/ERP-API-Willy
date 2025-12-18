import {
  extendType,
  objectType,
  inputObjectType,
  arg,
  idArg,
  nonNull,
} from 'nexus';
import { PaginationInfo } from './common';

export const ListPimProductsFilter = inputObjectType({
  name: 'ListPimProductsFilter',
  definition(t) {
    t.id('pimCategoryPlatformId');
    t.string('searchTerm', {
      description: 'Search term to filter products by name ',
    });
  },
});

export const PimProduct = objectType({
  name: 'PimProduct',
  sourceType: {
    module: require.resolve('../../services/pim_products'),
    export: 'PimProduct',
  },
  definition(t) {
    t.string('id', { resolve: (parent) => parent._id.toString() });
    t.string('tenant_id');
    t.boolean('is_deleted');
    t.string('pim_product_id');
    t.string('pim_category_id');
    t.string('pim_category_platform_id');
    t.string('pim_category_path');
    t.string('make');
    t.string('model');
    t.string('name');
    t.string('year');
    t.string('manufacturer_part_number');
    t.string('sku');
    t.string('upc');
  },
});

export const ListPimProductsResult = objectType({
  name: 'ListPimProductsResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', {
      type: PimProduct,
    });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const CategoryExtenstions = extendType({
  type: 'PimCategory',
  definition(t) {
    t.int('productCount', {
      resolve: async (parent, _, ctx) => {
        const count = await ctx.services.pimProductsService.countPimProducts(
          {
            pim_category_platform_id: parent._id,
          },
          ctx.user,
        );
        return count;
      },
    });
  },
});

export const PIMQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('getPimProductById', {
      type: PimProduct,
      args: {
        id: nonNull(idArg()),
      },
      async resolve(_, { id }, ctx) {
        const result = await ctx.services.pimProductsService.getPimProductById(
          id,
          ctx.user,
        );
        return result;
      },
    });
    t.field('listPimProducts', {
      type: ListPimProductsResult,
      args: {
        filter: arg({ type: ListPimProductsFilter }),
        page: arg({
          type: inputObjectType({
            name: 'ListPimProductsPage',
            definition(t) {
              t.int('number', { default: 1 });
              t.int('size', { default: 10 });
            },
          }),
        }),
      },
      async resolve(_, { page, filter }, ctx) {
        let matchingDirectParentCategoryIds: string[] = [];
        if (filter?.searchTerm) {
          const { items } =
            await ctx.services.pimCategoriesService.listPimCategories(
              {
                filter: {
                  search: {
                    query: filter.searchTerm,
                    fields: ['name'],
                  },
                },
              },
              ctx.user,
            );
          matchingDirectParentCategoryIds = items.map(
            (category: { _id: string }) => category._id,
          );
        }

        const pimCategoryFilter = matchingDirectParentCategoryIds.length
          ? ([
              ...matchingDirectParentCategoryIds,
              filter?.pimCategoryPlatformId,
            ].filter(Boolean) as string[])
          : filter?.pimCategoryPlatformId;

        const result = await ctx.services.pimProductsService.listPimProducts(
          {
            filter: {
              pim_category_platform_id: pimCategoryFilter ?? undefined,
              searchTerm: filter?.searchTerm ?? undefined,
            },
            page: {
              number: page?.number || 1,
              size: page?.size || 10,
            },
          },
          ctx.user,
        );

        return result;
      },
    });
  },
});
