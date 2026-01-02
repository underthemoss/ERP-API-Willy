import {
  enumType,
  extendType,
  inputObjectType,
  nonNull,
  objectType,
  unionType,
  arg,
  list,
} from 'nexus';
import { PaginationInfo } from './common';
import { dropNullKeys } from '../utils';
import { PimCategory } from '../../services/pim_categories';

type PricingSpecInputShape = {
  kind?: 'UNIT' | 'TIME' | 'RENTAL_RATE_TABLE';
  unitCode?: string | null;
  rateInCents?: number | null;
  pricePerDayInCents?: number | null;
  pricePerWeekInCents?: number | null;
  pricePerMonthInCents?: number | null;
};

const normalizePricingSpecInput = (input?: PricingSpecInputShape | null) => {
  if (!input) return undefined;
  if (!input.kind) {
    throw new Error('pricingSpec.kind is required');
  }
  if (input.kind === 'UNIT' || input.kind === 'TIME') {
    if (!input.unitCode) {
      throw new Error(`pricingSpec.unitCode is required for ${input.kind}`);
    }
    if (input.rateInCents === null || input.rateInCents === undefined) {
      throw new Error(`pricingSpec.rateInCents is required for ${input.kind}`);
    }
    return {
      kind: input.kind,
      unitCode: input.unitCode,
      rateInCents: input.rateInCents,
    };
  }
  if (input.kind === 'RENTAL_RATE_TABLE') {
    if (
      input.pricePerDayInCents === null ||
      input.pricePerDayInCents === undefined ||
      input.pricePerWeekInCents === null ||
      input.pricePerWeekInCents === undefined ||
      input.pricePerMonthInCents === null ||
      input.pricePerMonthInCents === undefined
    ) {
      throw new Error(
        'pricingSpec pricePerDayInCents/pricePerWeekInCents/pricePerMonthInCents are required for RENTAL_RATE_TABLE',
      );
    }
    return {
      kind: input.kind,
      pricePerDayInCents: input.pricePerDayInCents,
      pricePerWeekInCents: input.pricePerWeekInCents,
      pricePerMonthInCents: input.pricePerMonthInCents,
    };
  }
  throw new Error(`Unsupported pricingSpec.kind: ${input.kind}`);
};

// === Price Books ===
export const PriceBook = objectType({
  name: 'PriceBook',
  sourceType: {
    module: require.resolve('../../services/prices'),
    export: 'PriceBook',
  },
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.id('workspaceId');
    t.id('parentPriceBookId');
    t.field('parentPriceBook', {
      type: PriceBook,
      resolve: (root, args, ctx) => {
        if (!root.parentPriceBookId) {
          return null;
        }
        return ctx.dataloaders.prices.getPriceBookById.load(
          root.parentPriceBookId,
        );
      },
    });
    t.float('parentPriceBookPercentageFactor');
    t.nonNull.string('name');
    t.nonNull.boolean('isDefault', {
      deprecation: 'soon to be removed',
      resolve: () => false,
    });
    t.string('notes');
    t.nonNull.string('createdBy');
    t.field('createdByUser', {
      type: 'User',
      resolve: (parent, _, ctx) => {
        return ctx.dataloaders.users.getUsersById.load(parent.createdBy);
      },
    });
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.nonNull.field('updatedAt', { type: 'DateTime' });
    t.nonNull.string('updatedBy');
    t.field('updatedByUser', {
      type: 'User',
      resolve: (parent, _, ctx) => {
        return ctx.dataloaders.users.getUsersById.load(parent.updatedBy);
      },
    });
    t.string('location');
    t.id('businessContactId');
    t.field('businessContact', {
      type: 'BusinessContact',
      resolve: (parent, _, ctx) => {
        if (!parent.businessContactId) {
          return null;
        }
        return ctx.dataloaders.contacts.getContactsById.load(
          parent.businessContactId,
        );
      },
    });
    t.id('projectId');
    t.field('project', {
      type: 'Project',
      resolve(parent, _, ctx) {
        if (!parent.projectId) {
          return null;
        }
        return ctx.dataloaders.projects.getProjectsById.load(parent.projectId);
      },
    });
    t.field('listPrices', {
      type: ListPricesResult,
      args: {
        filter: arg({ type: ListPricesFilter }),
        page: nonNull(arg({ type: ListPricesPage })),
      },
      resolve(parent, args, ctx) {
        const { filter, page } = args;

        return ctx.services.pricesService.listPrices(
          {
            filter: dropNullKeys({ ...filter, priceBookId: parent.id }),
            page,
          },
          ctx.user,
        );
      },
    });
  },
});

export const ListPriceBooksResult = objectType({
  name: 'ListPriceBooksResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: PriceBook });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const CreatePriceBookInput = inputObjectType({
  name: 'CreatePriceBookInput',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.nonNull.string('name');
    t.string('notes');
    t.boolean('isDefault', { deprecation: 'soon to be removed' });
    t.id('parentPriceBookId');
    t.float('parentPriceBookPercentageFactor', {
      default: 1.0,
      description: 'Percentage factor for the parent price book',
    });
    t.string('location');
    t.id('businessContactId');
    t.id('projectId');
  },
});

export const UpdatePriceBookInput = inputObjectType({
  name: 'UpdatePriceBookInput',
  definition(t) {
    t.nonNull.id('id');
    t.string('name'); // Optional but cannot be null (required field)
    t.string('notes'); // Optional and can be null to clear
    t.string('location'); // Optional and can be null to clear
    t.id('businessContactId'); // Optional and can be null to clear
    t.id('projectId'); // Optional and can be null to clear
  },
});

export const ListPriceBooksPage = inputObjectType({
  name: 'ListPriceBooksPage',
  definition(t) {
    t.nonNull.int('number', { default: 1 });
    t.nonNull.int('size', { default: 10 });
  },
});

// === Enums ===

export const CatalogProductKind = enumType({
  name: 'CatalogProductKind',
  members: ['MATERIAL_PRODUCT', 'SERVICE_PRODUCT', 'ASSEMBLY_PRODUCT'],
});

export const PricingSpecKind = enumType({
  name: 'PricingSpecKind',
  members: ['UNIT', 'TIME', 'RENTAL_RATE_TABLE'],
});

export const PriceTypeEnum = enumType({
  name: 'PriceType',
  members: ['RENTAL', 'SALE', 'SERVICE'],
});

// === Object Types ===

export const PriceCatalogRef = objectType({
  name: 'PriceCatalogRef',
  definition(t) {
    t.nonNull.field('kind', { type: CatalogProductKind });
    t.nonNull.id('id');
  },
});

export const PriceCatalogRefInput = inputObjectType({
  name: 'PriceCatalogRefInput',
  definition(t) {
    t.nonNull.field('kind', { type: CatalogProductKind });
    t.nonNull.id('id');
  },
});

export const PricingSpec = objectType({
  name: 'PricingSpec',
  definition(t) {
    t.nonNull.field('kind', { type: PricingSpecKind });
    t.string('unitCode');
    t.int('rateInCents');
    t.int('pricePerDayInCents');
    t.int('pricePerWeekInCents');
    t.int('pricePerMonthInCents');
  },
});

export const PricingSpecInput = inputObjectType({
  name: 'PricingSpecInput',
  definition(t) {
    t.nonNull.field('kind', { type: PricingSpecKind });
    t.string('unitCode');
    t.int('rateInCents');
    t.int('pricePerDayInCents');
    t.int('pricePerWeekInCents');
    t.int('pricePerMonthInCents');
  },
});

export const RentalPrice = objectType({
  name: 'RentalPrice',
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.id('workspaceId');
    t.field('catalogRef', { type: PriceCatalogRef });
    t.field('pricingSpec', { type: PricingSpec });
    t.string('pimProductId');
    t.id('parentPriceId');
    t.field('parentPrice', {
      type: Price,
      resolve: (parent, _, ctx) => {
        if (!parent.parentPriceId) {
          return null;
        }
        return ctx.dataloaders.prices.getPriceById.load(parent.parentPriceId);
      },
    });
    t.float('parentPriceIdPercentageFactor');
    t.string('name');
    t.nonNull.string('createdBy');
    t.string('pimCategoryId');
    t.field('pimCategory', {
      type: 'PimCategory',
      resolve: (parent, _, ctx) => {
        if (!parent.pimCategoryId) {
          return null;
        }
        return ctx.dataloaders.pimCategories.getPimCategoriesById.load(
          parent.pimCategoryId,
        );
      },
    });
    t.string('pimCategoryPath');
    t.string('pimCategoryName');
    t.id('pimProductId');
    t.field('pimProduct', {
      type: 'PimProduct',
      resolve: (parent, _, ctx) => {
        if (!parent.pimProductId) {
          return null;
        }
        return ctx.dataloaders.pimProducts.getPimProductsById.load(
          parent.pimProductId,
        );
      },
    });
    t.id('priceBookId');
    t.field('priceBook', {
      type: PriceBook,
      resolve: (parent, _, ctx) => {
        if (!parent.priceBookId) {
          return null;
        }
        return ctx.dataloaders.prices.getPriceBookById.load(parent.priceBookId);
      },
    });
    t.nonNull.field('priceType', { type: PriceTypeEnum });
    t.nonNull.int('pricePerDayInCents');
    t.nonNull.int('pricePerWeekInCents');
    t.nonNull.int('pricePerMonthInCents');
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.nonNull.field('updatedAt', { type: 'DateTime' });
    t.nonNull.field('calculateSubTotal', {
      type: 'LineItemPriceForecast',
      args: {
        durationInDays: nonNull(arg({ type: 'Int' })),
      },
      async resolve(parent, { durationInDays }, ctx) {
        return ctx.services.pricesService.calculateSubTotal(
          parent.id,
          durationInDays,
          ctx.user,
        );
      },
    });
  },
});

export const SalePrice = objectType({
  name: 'SalePrice',
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.id('workspaceId');
    t.field('catalogRef', { type: PriceCatalogRef });
    t.field('pricingSpec', { type: PricingSpec });
    t.id('parentPriceId');
    t.field('parentPrice', {
      type: Price,
      resolve: (parent, _, ctx) => {
        if (!parent.parentPriceId) {
          return null;
        }
        return ctx.dataloaders.prices.getPriceById.load(parent.parentPriceId);
      },
    });
    t.float('parentPriceIdPercentageFactor');
    t.string('name');
    t.nonNull.string('createdBy');
    t.string('pimCategoryId');
    t.field('pimCategory', {
      type: 'PimCategory',
      resolve: (parent, _, ctx) => {
        if (!parent.pimCategoryId) {
          return null;
        }
        return ctx.dataloaders.pimCategories.getPimCategoriesById.load(
          parent.pimCategoryId,
        );
      },
    });
    t.string('pimCategoryPath');
    t.string('pimCategoryName');
    // --- Feature parity with RentalPrice: add pimProductId and pimProduct
    t.id('pimProductId');
    t.field('pimProduct', {
      type: 'PimProduct',
      resolve: (parent, _, ctx) => {
        if (!parent.pimProductId) {
          return null;
        }
        return ctx.dataloaders.pimProducts.getPimProductsById.load(
          parent.pimProductId,
        );
      },
    });
    t.id('priceBookId');
    t.field('priceBook', {
      type: PriceBook,
      resolve: (parent, _, ctx) => {
        if (!parent.priceBookId) {
          return null;
        }
        return ctx.dataloaders.prices.getPriceBookById.load(parent.priceBookId);
      },
    });
    t.nonNull.field('priceType', { type: PriceTypeEnum });
    t.nonNull.int('unitCostInCents');
    t.field('discounts', { type: 'JSON' });
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.nonNull.field('updatedAt', { type: 'DateTime' });
  },
});

export const ServicePrice = objectType({
  name: 'ServicePrice',
  definition(t) {
    t.nonNull.id('id');
    t.nonNull.id('workspaceId');
    t.field('catalogRef', { type: PriceCatalogRef });
    t.field('pricingSpec', { type: PricingSpec });
    t.id('parentPriceId');
    t.field('parentPrice', {
      type: Price,
      resolve: (parent, _, ctx) => {
        if (!parent.parentPriceId) {
          return null;
        }
        return ctx.dataloaders.prices.getPriceById.load(parent.parentPriceId);
      },
    });
    t.float('parentPriceIdPercentageFactor');
    t.string('name');
    t.nonNull.string('createdBy');
    t.string('pimCategoryId');
    t.field('pimCategory', {
      type: 'PimCategory',
      resolve: (parent, _, ctx) => {
        if (!parent.pimCategoryId) {
          return null;
        }
        return ctx.dataloaders.pimCategories.getPimCategoriesById.load(
          parent.pimCategoryId,
        );
      },
    });
    t.string('pimCategoryPath');
    t.string('pimCategoryName');
    t.id('pimProductId');
    t.field('pimProduct', {
      type: 'PimProduct',
      resolve: (parent, _, ctx) => {
        if (!parent.pimProductId) {
          return null;
        }
        return ctx.dataloaders.pimProducts.getPimProductsById.load(
          parent.pimProductId,
        );
      },
    });
    t.id('priceBookId');
    t.field('priceBook', {
      type: PriceBook,
      resolve: (parent, _, ctx) => {
        if (!parent.priceBookId) {
          return null;
        }
        return ctx.dataloaders.prices.getPriceBookById.load(parent.priceBookId);
      },
    });
    t.nonNull.field('priceType', { type: PriceTypeEnum });
    t.nonNull.field('createdAt', { type: 'DateTime' });
    t.nonNull.field('updatedAt', { type: 'DateTime' });
  },
});

export const Price = unionType({
  name: 'Price',
  resolveType: (item) => {
    if (item.priceType === 'RENTAL') {
      return 'RentalPrice';
    }
    if (item.priceType === 'SERVICE') {
      return 'ServicePrice';
    }
    return 'SalePrice';
  },
  definition(t) {
    t.members(RentalPrice, SalePrice, ServicePrice);
  },
});

export const ListPricesResult = objectType({
  name: 'ListPricesResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', { type: Price });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

// === Inputs ===

export const CreateRentalPriceInput = inputObjectType({
  name: 'CreateRentalPriceInput',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.string('name');
    t.string('pimCategoryId');
    t.field('catalogRef', { type: PriceCatalogRefInput });
    t.field('pricingSpec', { type: PricingSpecInput });
    t.nonNull.int('pricePerDayInCents');
    t.nonNull.int('pricePerWeekInCents');
    t.nonNull.int('pricePerMonthInCents');
    t.id('pimProductId');
    t.id('priceBookId');
  },
});

export const CreateSalePriceInput = inputObjectType({
  name: 'CreateSalePriceInput',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.string('name');
    t.string('pimCategoryId');
    t.field('catalogRef', { type: PriceCatalogRefInput });
    t.field('pricingSpec', { type: PricingSpecInput });
    t.nonNull.int('unitCostInCents');
    t.field('discounts', { type: 'JSON' });
    t.id('pimProductId');
    t.id('priceBookId');
  },
});

export const CreateServicePriceInput = inputObjectType({
  name: 'CreateServicePriceInput',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.string('name');
    t.nonNull.field('catalogRef', { type: PriceCatalogRefInput });
    t.nonNull.field('pricingSpec', { type: PricingSpecInput });
    t.string('pimCategoryId');
    t.id('pimProductId');
    t.id('priceBookId');
  },
});

export const UpdateRentalPriceInput = inputObjectType({
  name: 'UpdateRentalPriceInput',
  definition(t) {
    t.nonNull.id('id');
    t.string('name');
    t.string('pimCategoryId');
    t.field('catalogRef', { type: PriceCatalogRefInput });
    t.field('pricingSpec', { type: PricingSpecInput });
    t.int('pricePerDayInCents');
    t.int('pricePerWeekInCents');
    t.int('pricePerMonthInCents');
    t.id('pimProductId');
  },
});

export const UpdateSalePriceInput = inputObjectType({
  name: 'UpdateSalePriceInput',
  definition(t) {
    t.nonNull.id('id');
    t.string('name');
    t.string('pimCategoryId');
    t.field('catalogRef', { type: PriceCatalogRefInput });
    t.field('pricingSpec', { type: PricingSpecInput });
    t.int('unitCostInCents');
    t.field('discounts', { type: 'JSON' });
    t.id('pimProductId');
  },
});

export const UpdateServicePriceInput = inputObjectType({
  name: 'UpdateServicePriceInput',
  definition(t) {
    t.nonNull.id('id');
    t.string('name');
    t.field('pricingSpec', { type: PricingSpecInput });
    t.field('catalogRef', { type: PriceCatalogRefInput });
    t.string('pimCategoryId');
    t.id('pimProductId');
  },
});

export const ListPriceBooksFilter = inputObjectType({
  name: 'ListPriceBooksFilter',
  definition(t) {
    t.nonNull.id('workspaceId');
  },
});

export const ListPricesFilter = inputObjectType({
  name: 'ListPricesFilter',
  definition(t) {
    t.nonNull.id('workspaceId');
    t.string('pimCategoryId');
    t.string('catalogRefId');
    t.field('catalogRefKind', { type: CatalogProductKind });
    t.string('priceBookId');
    t.field('priceType', { type: PriceTypeEnum });
    t.string('name');
    t.string('businessContactId');
    t.string('projectId');
  },
});

export const ListPricesPage = inputObjectType({
  name: 'ListPricesPage',
  definition(t) {
    t.nonNull.int('number', { default: 1 });
    t.nonNull.int('size', { default: 10 });
  },
});

export const BulkCalculateSubTotalInput = inputObjectType({
  name: 'BulkCalculateSubTotalInput',
  definition(t) {
    t.nonNull.id('priceId');
    t.nonNull.int('durationInDays');
  },
});

// === Query and Mutation ===

export const PriceQuery = extendType({
  type: 'Query',
  definition(t) {
    // price books
    t.field('listPriceBooks', {
      type: ListPriceBooksResult,
      args: {
        filter: nonNull(arg({ type: ListPriceBooksFilter })),
        page: nonNull(arg({ type: ListPriceBooksPage })),
      },
      async resolve(_, args, ctx) {
        const { page } = args;
        return ctx.services.pricesService.listPriceBooks(
          {
            page,
            filter: args.filter,
          },
          ctx.user,
        );
      },
    });
    t.field('getPriceBookById', {
      type: PriceBook,
      args: {
        id: nonNull(arg({ type: 'ID' })),
      },
      async resolve(_, { id }, ctx) {
        return ctx.dataloaders.prices.getPriceBookById.load(id);
      },
    });

    t.field('listPriceBookCategories', {
      type: nonNull(list(nonNull('PimCategory'))),
      args: {
        workspaceId: nonNull(arg({ type: 'ID' })),
        priceBookId: arg({ type: 'String' }),
      },
      async resolve(_, { workspaceId, priceBookId }, ctx) {
        const ids = await ctx.services.pricesService.listCategoriesForPriceBook(
          workspaceId,
          priceBookId ?? undefined,
          ctx.user,
        );
        const categories =
          await ctx.dataloaders.pimCategories.getPimCategoriesById.loadMany(
            ids,
          );

        return categories.filter(
          (cat: unknown) => cat && cat instanceof Error === false,
        ) as PimCategory[];
      },
    });

    t.field('listPrices', {
      type: ListPricesResult,
      args: {
        filter: nonNull(arg({ type: ListPricesFilter })),
        page: nonNull(arg({ type: ListPricesPage })),
      },
      async resolve(_, args, ctx) {
        const { filter, page } = args;
        return ctx.services.pricesService.listPrices(
          {
            filter: dropNullKeys(filter),
            page,
          },
          ctx.user,
        );
      },
    });

    t.nonNull.field('calculateSubTotal', {
      type: 'LineItemPriceForecast',
      args: {
        priceId: nonNull(arg({ type: 'ID' })),
        durationInDays: nonNull(arg({ type: 'Int' })),
      },
      async resolve(_, { priceId, durationInDays }, ctx) {
        return ctx.services.pricesService.calculateSubTotal(
          priceId,
          durationInDays,
          ctx.user,
        );
      },
    });

    t.nonNull.list.nonNull.field('bulkCalculateSubTotal', {
      type: 'LineItemPriceForecast',
      args: {
        inputs: nonNull(
          arg({ type: nonNull(list(nonNull(BulkCalculateSubTotalInput))) }),
        ),
      },
      async resolve(_, { inputs }, ctx) {
        return Promise.all(
          inputs.map((input: { priceId: string; durationInDays: number }) =>
            ctx.services.pricesService.calculateSubTotal(
              input.priceId,
              input.durationInDays,
              ctx.user,
            ),
          ),
        );
      },
    });

    t.field('getPriceById', {
      type: Price,
      args: {
        id: nonNull(arg({ type: 'ID' })),
      },
      async resolve(_, { id }, ctx) {
        return ctx.dataloaders.prices.getPriceById.load(id);
      },
    });
  },
});

export const ImportPricesResult = objectType({
  name: 'ImportPricesResult',
  definition(t) {
    t.nonNull.int('imported');
    t.nonNull.int('failed');
    t.nonNull.list.nonNull.string('errors');
  },
});

export const PriceMutation = extendType({
  type: 'Mutation',
  definition(t) {
    // price books
    t.field('createPriceBook', {
      type: PriceBook,
      args: {
        input: nonNull(arg({ type: CreatePriceBookInput })),
      },
      async resolve(_, { input }, ctx) {
        return ctx.services.pricesService.createPriceBook(
          {
            ...dropNullKeys(input),
            name: input.name,
            notes: input.notes ?? '',
          },
          ctx.user,
        );
      },
    });

    t.field('updatePriceBook', {
      type: PriceBook,
      args: {
        input: nonNull(arg({ type: UpdatePriceBookInput })),
      },
      async resolve(_, { input }, ctx) {
        const { id, name, ...updates } = input;
        // Don't use dropNullKeys here - we want to pass null values to clear fields
        // But name cannot be null (it's a required field), so filter it out if undefined
        return ctx.services.pricesService.updatePriceBook(
          id,
          {
            ...updates,
            ...(name !== undefined && name !== null ? { name } : {}),
          },
          ctx.user,
        );
      },
    });

    t.field('deletePriceBookById', {
      type: 'Boolean',
      args: {
        id: nonNull(arg({ type: 'ID' })),
      },
      async resolve(_, { id }, ctx) {
        await ctx.services.pricesService.deletePriceBookById(id, ctx.user);
        return true;
      },
    });

    t.field('exportPrices', {
      type: 'File',
      args: {
        priceBookId: nonNull(arg({ type: 'ID' })),
      },
      async resolve(_, { priceBookId }, ctx) {
        return ctx.services.pricesService.exportPrices(priceBookId, ctx.user);
      },
    });

    t.field('importPrices', {
      type: ImportPricesResult,
      args: {
        priceBookId: nonNull(arg({ type: 'ID' })),
        fileId: nonNull(arg({ type: 'ID' })),
      },
      async resolve(_, { priceBookId, fileId }, ctx) {
        return ctx.services.pricesService.importPrices(
          priceBookId,
          fileId,
          ctx.user,
        );
      },
    });

    t.field('createRentalPrice', {
      type: RentalPrice,
      args: {
        input: nonNull(arg({ type: CreateRentalPriceInput })),
      },
      async resolve(_, { input }, ctx) {
        if (!input.pimCategoryId && !input.catalogRef) {
          throw new Error('pimCategoryId or catalogRef is required');
        }

        const pricingSpec = normalizePricingSpecInput(
          input.pricingSpec as PricingSpecInputShape,
        );

        if (pricingSpec && pricingSpec.kind !== 'RENTAL_RATE_TABLE') {
          throw new Error(
            'Rental prices only support RENTAL_RATE_TABLE pricingSpec',
          );
        }

        let pimCategoryName: string | undefined;
        let pimCategoryPath: string | undefined;
        if (input.pimCategoryId) {
          const pimCategory =
            await ctx.services.pimCategoriesService.getPimCategoryById(
              input.pimCategoryId,
              ctx.user,
            );

          if (!pimCategory) {
            throw new Error(
              `PIM Category with ID ${input.pimCategoryId} not found`,
            );
          }
          pimCategoryName = pimCategory.name;
          pimCategoryPath = pimCategory.path;
        }

        if (input.pimProductId) {
          const pimProduct =
            await ctx.dataloaders.pimProducts.getPimProductsById.load(
              input.pimProductId,
            );
          if (!pimProduct) {
            throw new Error(
              `PIM Product with ID ${input.pimProductId} not found`,
            );
          }
        }

        return ctx.services.pricesService.createRentalPrice(
          {
            workspaceId: input.workspaceId,
            name: input.name ?? undefined,
            pimCategoryId: input.pimCategoryId ?? undefined,
            pimCategoryName,
            pimCategoryPath,
            pricePerDayInCents: input.pricePerDayInCents,
            pricePerWeekInCents: input.pricePerWeekInCents,
            pricePerMonthInCents: input.pricePerMonthInCents,
            priceBookId: input.priceBookId ?? undefined,
            pimProductId: input.pimProductId ?? undefined,
            catalogRef: input.catalogRef ?? undefined,
            pricingSpec,
          },
          ctx.user,
        );
      },
    });

    t.field('createSalePrice', {
      type: SalePrice,
      args: {
        input: nonNull(arg({ type: CreateSalePriceInput })),
      },
      async resolve(_, { input }, ctx) {
        if (!input.pimCategoryId && !input.catalogRef) {
          throw new Error('pimCategoryId or catalogRef is required');
        }

        const pricingSpec = normalizePricingSpecInput(
          input.pricingSpec as PricingSpecInputShape,
        );

        if (pricingSpec && pricingSpec.kind !== 'UNIT') {
          throw new Error('Sale prices only support UNIT pricingSpec');
        }

        let pimCategoryName: string | undefined;
        let pimCategoryPath: string | undefined;
        if (input.pimCategoryId) {
          const pimCategory =
            await ctx.services.pimCategoriesService.getPimCategoryById(
              input.pimCategoryId,
              ctx.user,
            );

          if (!pimCategory) {
            throw new Error(
              `PIM Category with ID ${input.pimCategoryId} not found`,
            );
          }
          pimCategoryName = pimCategory.name;
          pimCategoryPath = pimCategory.path;
        }

        if (input.pimProductId) {
          const pimProduct =
            await ctx.dataloaders.pimProducts.getPimProductsById.load(
              input.pimProductId,
            );
          if (!pimProduct) {
            throw new Error(
              `PIM Product with ID ${input.pimProductId} not found`,
            );
          }
        }

        return ctx.services.pricesService.createSalePrice(
          {
            workspaceId: input.workspaceId,
            name: input.name ?? undefined,
            pimCategoryId: input.pimCategoryId ?? undefined,
            pimCategoryName,
            pimCategoryPath,
            unitCostInCents: input.unitCostInCents,
            discounts: input.discounts,
            priceBookId: input.priceBookId ?? undefined,
            pimProductId: input.pimProductId ?? undefined,
            catalogRef: input.catalogRef ?? undefined,
            pricingSpec,
          },
          ctx.user,
        );
      },
    });

    t.field('createServicePrice', {
      type: ServicePrice,
      args: {
        input: nonNull(arg({ type: CreateServicePriceInput })),
      },
      async resolve(_, { input }, ctx) {
        const pricingSpec = normalizePricingSpecInput(
          input.pricingSpec as PricingSpecInputShape,
        );

        if (!pricingSpec || pricingSpec.kind === 'RENTAL_RATE_TABLE') {
          throw new Error('Service prices require UNIT or TIME pricingSpec');
        }

        return ctx.services.pricesService.createServicePrice(
          {
            workspaceId: input.workspaceId,
            name: input.name ?? undefined,
            pimCategoryId: input.pimCategoryId ?? undefined,
            pimCategoryName: undefined,
            pimCategoryPath: undefined,
            pimProductId: input.pimProductId ?? undefined,
            priceBookId: input.priceBookId ?? undefined,
            catalogRef: input.catalogRef ?? undefined,
            pricingSpec,
          },
          ctx.user,
        );
      },
    });

    t.field('deletePriceById', {
      type: 'Boolean',
      args: {
        id: nonNull(arg({ type: 'ID' })),
      },
      async resolve(_, { id }, ctx) {
        await ctx.services.pricesService.deletePriceById(id, ctx.user);
        return true;
      },
    });

    t.field('updateRentalPrice', {
      type: RentalPrice,
      args: {
        input: nonNull(arg({ type: UpdateRentalPriceInput })),
      },
      async resolve(_, { input }, ctx) {
        const pricingSpec = input.pricingSpec
          ? normalizePricingSpecInput(
              input.pricingSpec as PricingSpecInputShape,
            )
          : undefined;

        if (pricingSpec && pricingSpec.kind !== 'RENTAL_RATE_TABLE') {
          throw new Error(
            'Rental prices only support RENTAL_RATE_TABLE pricingSpec',
          );
        }

        if (input.pimProductId) {
          const pimProduct =
            await ctx.dataloaders.pimProducts.getPimProductsById.load(
              input.pimProductId,
            );
          if (!pimProduct) {
            throw new Error(
              `PIM Product with ID ${input.pimProductId} not found`,
            );
          }
        }

        let pimCategoryName: string | undefined;
        let pimCategoryPath: string | undefined;

        if (input.pimCategoryId) {
          const pimCategory =
            await ctx.services.pimCategoriesService.getPimCategoryById(
              input.pimCategoryId,
              ctx.user,
            );

          if (!pimCategory) {
            throw new Error(
              `PIM Category with ID ${input.pimCategoryId} not found`,
            );
          }

          pimCategoryName = pimCategory.name;
          pimCategoryPath = pimCategory.path;
        }

        return ctx.services.pricesService.updateRentalPrice(
          {
            id: input.id,
            name: input.name ?? undefined,
            pricePerDayInCents: input.pricePerDayInCents ?? undefined,
            pricePerWeekInCents: input.pricePerWeekInCents ?? undefined,
            pricePerMonthInCents: input.pricePerMonthInCents ?? undefined,
            pricingSpec,
            catalogRef: input.catalogRef ?? undefined,
            pimProductId: input.pimProductId ?? undefined,
            pimCategoryId: input.pimCategoryId ?? undefined,
            pimCategoryName,
            pimCategoryPath,
          },
          ctx.user,
        );
      },
    });

    t.field('updateSalePrice', {
      type: SalePrice,
      args: {
        input: nonNull(arg({ type: UpdateSalePriceInput })),
      },
      async resolve(_, { input }, ctx) {
        const pricingSpec = input.pricingSpec
          ? normalizePricingSpecInput(
              input.pricingSpec as PricingSpecInputShape,
            )
          : undefined;

        if (pricingSpec && pricingSpec.kind !== 'UNIT') {
          throw new Error('Sale prices only support UNIT pricingSpec');
        }

        if (input.pimProductId) {
          const pimProduct =
            await ctx.dataloaders.pimProducts.getPimProductsById.load(
              input.pimProductId,
            );
          if (!pimProduct) {
            throw new Error(
              `PIM Product with ID ${input.pimProductId} not found`,
            );
          }
        }

        let pimCategoryName: string | undefined;
        let pimCategoryPath: string | undefined;

        if (input.pimCategoryId) {
          const pimCategory =
            await ctx.services.pimCategoriesService.getPimCategoryById(
              input.pimCategoryId,
              ctx.user,
            );

          if (!pimCategory) {
            throw new Error(
              `PIM Category with ID ${input.pimCategoryId} not found`,
            );
          }

          pimCategoryName = pimCategory.name;
          pimCategoryPath = pimCategory.path;
        }

        return ctx.services.pricesService.updateSalePrice(
          {
            id: input.id,
            name: input.name ?? undefined,
            unitCostInCents: input.unitCostInCents ?? undefined,
            discounts: input.discounts ?? undefined,
            pricingSpec,
            catalogRef: input.catalogRef ?? undefined,
            pimProductId: input.pimProductId ?? undefined,
            pimCategoryId: input.pimCategoryId ?? undefined,
            pimCategoryName,
            pimCategoryPath,
          },
          ctx.user,
        );
      },
    });

    t.field('updateServicePrice', {
      type: ServicePrice,
      args: {
        input: nonNull(arg({ type: UpdateServicePriceInput })),
      },
      async resolve(_, { input }, ctx) {
        const pricingSpec = input.pricingSpec
          ? normalizePricingSpecInput(
              input.pricingSpec as PricingSpecInputShape,
            )
          : undefined;

        if (pricingSpec && pricingSpec.kind === 'RENTAL_RATE_TABLE') {
          throw new Error(
            'Service prices only support UNIT or TIME pricingSpec',
          );
        }

        if (input.pimProductId) {
          const pimProduct =
            await ctx.dataloaders.pimProducts.getPimProductsById.load(
              input.pimProductId,
            );
          if (!pimProduct) {
            throw new Error(
              `PIM Product with ID ${input.pimProductId} not found`,
            );
          }
        }

        let pimCategoryName: string | undefined;
        let pimCategoryPath: string | undefined;

        if (input.pimCategoryId) {
          const pimCategory =
            await ctx.services.pimCategoriesService.getPimCategoryById(
              input.pimCategoryId,
              ctx.user,
            );

          if (!pimCategory) {
            throw new Error(
              `PIM Category with ID ${input.pimCategoryId} not found`,
            );
          }

          pimCategoryName = pimCategory.name;
          pimCategoryPath = pimCategory.path;
        }

        return ctx.services.pricesService.updateServicePrice(
          {
            id: input.id,
            name: input.name ?? undefined,
            pricingSpec: pricingSpec ?? undefined,
            catalogRef: input.catalogRef ?? undefined,
            pimProductId: input.pimProductId ?? undefined,
            pimCategoryId: input.pimCategoryId ?? undefined,
            pimCategoryName,
            pimCategoryPath,
          },
          ctx.user,
        );
      },
    });
  },
});
