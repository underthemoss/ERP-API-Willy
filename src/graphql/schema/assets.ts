import { extendType, objectType, inputObjectType, arg } from 'nexus';
import { AssetDoc } from '../../services/assets/model';
import { PaginationInfo } from './common';
import { Inventory } from '../../services/inventory/model';

const AssetCategory = objectType({
  name: 'AssetCategory',
  definition(t) {
    t.string('level_1');
    t.string('level_2');
    t.string('level_3');
    t.string('composite');
    t.string('category_id');
  },
});

const AssetInventoryBranch = objectType({
  name: 'AssetInventoryBranch',
  definition(t) {
    t.string('id');
    t.string('name');
    t.string('description');
    t.string('company_id');
    t.string('company_name');
  },
});

const AssetCompany = objectType({
  name: 'AssetCompany',
  definition(t) {
    t.string('id');
    t.string('name');
  },
});

const AssetGroup = objectType({
  name: 'AssetGroup',
  definition(t) {
    t.string('id');
    t.string('name');
    t.string('company_id');
    t.string('company_name');
  },
});

const AssetType = objectType({
  name: 'AssetType',
  definition(t) {
    t.string('id');
    t.string('name');
  },
});

const AssetTspCompany = objectType({
  name: 'AssetTspCompany',
  definition(t) {
    t.string('company_id');
    t.string('company_name');
  },
});

const AssetPhoto = objectType({
  name: 'AssetPhoto',
  definition(t) {
    t.string('photo_id');
    t.string('filename');
  },
});

const AssetTracker = objectType({
  name: 'AssetTracker',
  definition(t) {
    t.string('id');
    t.string('device_serial');
    t.string('company_id');
    t.string('vendor_id');
    t.string('created');
    t.string('updated');
    t.string('tracker_type_id');
  },
});

const AssetMspBranch = objectType({
  name: 'AssetMspBranch',
  definition(t) {
    t.string('id');
    t.string('name');
    t.string('description');
    t.string('company_id');
    t.string('company_name');
  },
});

const AssetRspBranch = objectType({
  name: 'AssetRspBranch',
  definition(t) {
    t.string('id');
    t.string('name');
    t.string('description');
    t.string('company_id');
    t.string('company_name');
  },
});

const AssetDetails = objectType({
  name: 'AssetDetails',
  definition(t) {
    t.string('asset_id');
    t.string('name');
    t.string('description');
    t.string('custom_name');
    t.string('model');
    t.string('year');
    t.string('tracker_id');
    t.string('vin');
    t.string('serial_number');
    t.string('driver_name');
    t.string('camera_id');
    t.string('photo_id');
  },
});

const AssetClass = objectType({
  name: 'AssetClass',
  definition(t) {
    t.string('id');
    t.string('name');
    t.string('description');
  },
});

// Helper function to transform AssetDoc to Asset GraphQL type
export function mapAssetDocToGraphQL(doc: AssetDoc) {
  return {
    id: doc._id.toString(),
    company_id: doc.company_id?.toString(),
    name: doc.name,
    custom_name: doc.custom_name,
    description: doc.description,
    photo_id: doc.photo_id?.toString(),
    pim_category_id: doc.pim_category?.category_id,
    pim_category_name: doc.pim_category?.category_name,
    pim_category_path: doc.pim_category?.category_path,
    pim_make: doc.pim_make?.make,
    pim_make_id: doc.pim_make?.make_id,
    pim_product_id: doc.pim_product_id,
    pim_product_model: doc.pim_product?.model,
    pim_product_name: doc.pim_product?.name,
    pim_product_platform_id: doc.pim_product?.platform_id,
    pim_product_variant: doc.pim_product?.variant,
    pim_product_year: doc.pim_product?.year,
    category: doc.category
      ? {
          level_1: doc.category.level_1?.category_id ?? null,
          level_2: doc.category.level_2?.category_id ?? null,
          level_3: doc.category.level_3?.category_id ?? null,
          composite: doc.category.composite ?? null,
          category_id: doc.category.category_id ?? null,
        }
      : null,
    inventory_branch: doc.inventory_branch
      ? {
          id: doc.inventory_branch.id ?? null,
          name: doc.inventory_branch.name ?? null,
          description: doc.inventory_branch.description ?? null,
          company_id: doc.inventory_branch.company_id ?? null,
          company_name: doc.inventory_branch.company_name ?? null,
        }
      : null,
    keypad: Array.isArray(doc.keypad)
      ? doc.keypad.filter((k): k is string => typeof k === 'string')
      : [],
    company: doc.company
      ? {
          id: doc.company.id ?? null,
          name: doc.company.name ?? null,
        }
      : null,
    groups: Array.isArray(doc.groups)
      ? doc.groups.map((g) =>
          g
            ? {
                id: g.id ?? null,
                name: g.name ?? null,
                company_id: g.company_id ?? null,
                company_name: g.company_name ?? null,
              }
            : null,
        )
      : [],
    type: doc.type
      ? {
          id: doc.type.id ?? null,
          name: doc.type.name ?? null,
        }
      : null,
    tsp_companies: Array.isArray(doc.tsp_companies)
      ? doc.tsp_companies.map((tc) =>
          tc
            ? {
                company_id: tc.company_id ?? null,
                company_name: tc.company_name ?? null,
              }
            : null,
        )
      : [],
    photo: doc.photo
      ? {
          photo_id: doc.photo.photo_id ?? null,
          filename: doc.photo.filename ?? null,
        }
      : null,
    tracker: doc.tracker
      ? {
          id: doc.tracker.id ?? null,
          device_serial: doc.tracker.device_serial ?? null,
          company_id: doc.tracker.company_id ?? null,
          vendor_id: doc.tracker.vendor_id ?? null,
          created: doc.tracker.created ?? null,
          updated: doc.tracker.updated ?? null,
          tracker_type_id: doc.tracker.tracker_type_id ?? null,
        }
      : null,
    msp_branch: doc.msp_branch
      ? {
          id: doc.msp_branch.id ?? null,
          name: doc.msp_branch.name ?? null,
          description: doc.msp_branch.description ?? null,
          company_id: doc.msp_branch.company_id ?? null,
          company_name: doc.msp_branch.company_name ?? null,
        }
      : null,
    rsp_branch: doc.rsp_branch
      ? {
          id: doc.rsp_branch.id ?? null,
          name: doc.rsp_branch.name ?? null,
          description: doc.rsp_branch.description ?? null,
          company_id: doc.rsp_branch.company_id ?? null,
          company_name: doc.rsp_branch.company_name ?? null,
        }
      : null,
    details: doc.details
      ? {
          asset_id: doc.details.asset_id ?? null,
          name: doc.details.name ?? null,
          description: doc.details.description ?? null,
          custom_name: doc.details.custom_name ?? null,
          model: doc.details.model ?? null,
          year: doc.details.year ?? null,
          tracker_id: doc.details.tracker_id ?? null,
          vin: doc.details.vin ?? null,
          serial_number: doc.details.serial_number ?? null,
          driver_name: doc.details.driver_name ?? null,
          camera_id: doc.details.camera_id ?? null,
          photo_id: doc.details.photo_id ?? null,
        }
      : null,
    class: doc.class
      ? {
          id: doc.class.id ?? null,
          name: doc.class.name ?? null,
          description: doc.class.description ?? null,
        }
      : null,
  };
}

export const Asset = objectType({
  name: 'Asset',
  definition(t) {
    t.string('id');
    t.string('company_id');
    t.string('name');
    t.string('custom_name');
    t.string('description');
    t.string('photo_id');
    t.string('pim_product_id');
    t.string('pim_product_platform_id');
    t.string('pim_product_name');
    t.string('pim_product_model');
    t.string('pim_product_year');
    t.string('pim_product_variant');
    t.string('pim_make');
    t.string('pim_make_id');
    t.string('pim_category_id');
    t.string('pim_category_path');
    t.string('pim_category_name');
    t.field('category', { type: AssetCategory });
    t.field('inventory_branch', { type: AssetInventoryBranch });
    t.list.string('keypad');
    t.field('company', { type: AssetCompany });
    t.list.field('groups', { type: AssetGroup });
    t.field('type', { type: AssetType });
    t.list.field('tsp_companies', { type: AssetTspCompany });
    t.field('photo', { type: AssetPhoto });
    t.field('tracker', { type: AssetTracker });
    t.field('msp_branch', { type: AssetMspBranch });
    t.field('rsp_branch', { type: AssetRspBranch });
    t.field('details', { type: AssetDetails });
    t.field('class', { type: AssetClass });
  },
});

export const ListAssetsResult = objectType({
  name: 'ListAssetsResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', {
      type: Asset,
    });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

export const AssetsQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('listAssets', {
      type: ListAssetsResult,
      args: {
        page: arg({
          type: inputObjectType({
            name: 'ListAssetsPage',
            definition(t) {
              t.int('number', { default: 1 });
              t.int('size', { default: 10 });
            },
          }),
        }),
      },
      async resolve(_, { page }, ctx) {
        const { items, page: pageInfo } =
          await ctx.services.assetsService.getAssets(
            { page: { number: page?.number ?? 1, size: page?.size ?? 10 } },
            ctx.user,
          );
        return {
          items: items.map((d: AssetDoc) => mapAssetDocToGraphQL(d)),
          page: pageInfo,
        };
      },
    });
  },
});

// Extend the Inventory type to add the asset field
export const InventoryAssetExtension = extendType({
  type: 'Inventory',
  definition(t) {
    t.field('asset', {
      type: 'Asset',
      async resolve(inventory: Inventory, _args, ctx) {
        if (!inventory.assetId) return null;
        const assetDoc = await ctx.dataloaders.assets.getAssetsById.load(
          inventory.assetId,
        );
        if (!assetDoc) return null;
        return mapAssetDocToGraphQL(assetDoc);
      },
    });
  },
});
