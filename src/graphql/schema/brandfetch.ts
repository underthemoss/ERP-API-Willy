import { objectType, extendType, stringArg, nonNull, list } from 'nexus';
import { BrandDoc } from '../../services/brandfetch';

export const BrandImageFormat = objectType({
  name: 'BrandImageFormat',
  definition(t) {
    t.nonNull.string('src');
    t.string('background');
    t.string('format');
    t.int('height');
    t.int('width');
    t.int('size');
  },
});

export const BrandLogo = objectType({
  name: 'BrandLogo',
  definition(t) {
    t.string('url');
    t.string('type'); // Can be 'logo', 'icon', 'symbol', etc.
    t.string('theme');
    t.list.field('formats', {
      type: 'BrandImageFormat',
    });
  },
});

export const BrandColor = objectType({
  name: 'BrandColor',
  definition(t) {
    t.nonNull.string('hex');
    t.nonNull.string('type');
    t.int('brightness');
  },
});

export const BrandFont = objectType({
  name: 'BrandFont',
  definition(t) {
    t.nonNull.string('name');
    t.nonNull.string('type');
    t.string('origin');
    t.string('originId');
    t.list.int('weights');
  },
});

export const BrandImage = objectType({
  name: 'BrandImage',
  definition(t) {
    t.string('url'); // Made nullable as it might not always be present
    t.string('type');
    t.list.field('formats', {
      type: 'BrandImageFormat',
    });
  },
});

export const BrandLink = objectType({
  name: 'BrandLink',
  definition(t) {
    t.nonNull.string('name');
    t.nonNull.string('url');
  },
});

export const Brand = objectType({
  name: 'Brand',
  definition(t) {
    t.nonNull.string('id');
    t.string('domain'); // Made optional since we're storing raw API response
    t.string('name');
    t.string('description');
    t.string('longDescription');
    t.list.field('logos', {
      type: 'BrandLogo', // Now returns all logo variations (logo, icon, symbol, etc.)
    });
    t.list.field('colors', {
      type: 'BrandColor',
    });
    t.list.field('fonts', {
      type: 'BrandFont',
    });
    t.list.field('images', {
      type: 'BrandImage',
    });
    t.list.field('links', {
      type: 'BrandLink',
    });
    t.nonNull.string('createdAt');
    t.nonNull.string('updatedAt');
    t.nonNull.string('createdBy');
    t.nonNull.string('updatedBy');
  },
});

export const BrandSearchResult = objectType({
  name: 'BrandSearchResult',
  definition(t) {
    t.nonNull.string('brandId');
    t.nonNull.string('name');
    t.nonNull.string('domain');
    t.string('icon');
  },
});

export const BrandfetchQueries = extendType({
  type: 'Query',
  definition(t) {
    t.field('getBrandById', {
      type: 'Brand',
      args: {
        brandId: nonNull(stringArg()),
      },
      async resolve(_parent, { brandId }, ctx) {
        const brand = await ctx.services.brandfetchService.getBrandById(
          brandId,
          ctx.user,
        );

        if (!brand) {
          return null;
        }

        return {
          id: brand._id,
          domain: brand.domain || '',
          name: brand.name,
          description: brand.description,
          longDescription: brand.longDescription,
          logos: brand.logos, // Return all logo variations
          colors: brand.colors,
          fonts: brand.fonts,
          images: brand.images,
          links: brand.links,
          createdAt: brand.createdAt.toISOString(),
          updatedAt: brand.updatedAt.toISOString(),
          createdBy: brand.createdBy,
          updatedBy: brand.updatedBy,
        };
      },
    });

    t.field('getBrandByDomain', {
      type: 'Brand',
      args: {
        domain: nonNull(stringArg()),
      },
      async resolve(_parent, { domain }, ctx) {
        const brand = await ctx.services.brandfetchService.getBrandByDomain(
          domain,
          ctx.user,
        );

        if (!brand) {
          return null;
        }

        return {
          id: brand._id,
          domain: brand.domain || '',
          name: brand.name,
          description: brand.description,
          longDescription: brand.longDescription,
          logos: brand.logos, // Return all logo variations
          colors: brand.colors,
          fonts: brand.fonts,
          images: brand.images,
          links: brand.links,
          createdAt: brand.createdAt.toISOString(),
          updatedAt: brand.updatedAt.toISOString(),
          createdBy: brand.createdBy,
          updatedBy: brand.updatedBy,
        };
      },
    });

    t.list.field('searchBrands', {
      type: 'BrandSearchResult',
      args: {
        query: nonNull(stringArg()),
      },
      async resolve(_parent, { query }, ctx) {
        return await ctx.services.brandfetchService.searchBrands(
          query,
          ctx.user,
        );
      },
    });

    t.list.field('getBrandsByIds', {
      type: 'Brand',
      args: {
        brandIds: nonNull(list(nonNull(stringArg()))),
      },
      async resolve(_parent, { brandIds }, ctx) {
        const brands = await ctx.services.brandfetchService.batchGetBrandsByIds(
          brandIds,
          ctx.user,
        );

        return brands
          .filter((brand: BrandDoc | null): brand is BrandDoc => brand !== null)
          .map((brand: BrandDoc) => ({
            id: brand._id,
            domain: brand.domain || '',
            name: brand.name,
            description: brand.description,
            longDescription: brand.longDescription,
            logos: brand.logos, // Return all logo variations
            colors: brand.colors,
            fonts: brand.fonts,
            images: brand.images,
            links: brand.links,
            createdAt: brand.createdAt.toISOString(),
            updatedAt: brand.updatedAt.toISOString(),
            createdBy: brand.createdBy,
            updatedBy: brand.updatedBy,
          }));
      },
    });
  },
});

export const BrandfetchMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('refreshBrand', {
      type: 'Brand',
      args: {
        brandId: nonNull(stringArg()),
      },
      async resolve(_parent, { brandId }, ctx) {
        const brand = await ctx.services.brandfetchService.refreshBrand(
          brandId,
          ctx.user,
        );

        if (!brand) {
          return null;
        }

        return {
          id: brand._id,
          domain: brand.domain || '',
          name: brand.name,
          description: brand.description,
          longDescription: brand.longDescription,
          logos: brand.logos, // Return all logo variations
          colors: brand.colors,
          fonts: brand.fonts,
          images: brand.images,
          links: brand.links,
          createdAt: brand.createdAt.toISOString(),
          updatedAt: brand.updatedAt.toISOString(),
          createdBy: brand.createdBy,
          updatedBy: brand.updatedBy,
        };
      },
    });
  },
});
