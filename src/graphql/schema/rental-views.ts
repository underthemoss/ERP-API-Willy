import { extendType, objectType, inputObjectType, arg } from 'nexus';
import { type WithId } from 'mongodb';
import { type KsqlEsdbRentalMaterializedView } from '../../generated/ksql/KsqlEsdbRentalMaterializedView.generated';
import { PaginationInfo } from './common';

// Nested object types for rental view

const RentalViewDetails = objectType({
  name: 'RentalViewDetails',
  definition(t) {
    t.string('rentalId');
    t.string('borrowerUserId');
    t.string('rentalStatusId');
    t.string('dateCreated');
    t.string('startDate');
    t.string('endDate');
    t.string('amountReceived');
    t.string('price');
    t.string('deliveryCharge');
    t.string('returnCharge');
    t.string('deliveryRequired');
    t.string('deliveryInstructions');
    t.string('orderId');
    t.string('dropOffDeliveryId');
    t.string('returnDeliveryId');
    t.string('pricePerDay');
    t.string('pricePerWeek');
    t.string('pricePerMonth');
    t.string('startDateEstimated');
    t.string('endDateEstimated');
    t.string('jobDescription');
    t.string('equipmentClassId');
    t.string('pricePerHour');
    t.string('deleted');
    t.string('rentalProtectionPlanId');
    t.string('taxable');
    t.string('assetId');
    t.string('dropOffDeliveryRequired');
    t.string('returnDeliveryRequired');
    t.string('lienNoticeSent');
    t.string('offRentDateRequested');
    t.string('externalId');
    t.string('rentalTypeId');
    t.string('partTypeId');
    t.string('quantity');
    t.string('purchasePrice');
    t.string('rentalPurchaseOptionId');
    t.string('rateTypeId');
    t.string('hasReRent');
    t.string('isBelowFloorRate');
    t.string('isFlatMonthlyRate');
    t.string('isFlexibleRate');
    t.string('inventoryProductId');
    t.string('inventoryProductName');
    t.string('inventoryProductNameHistorical');
    t.string('oneTimeCharge');
    t.string('rentalPricingStructureId');
  },
});

const RentalViewAssetDetails = objectType({
  name: 'RentalViewAssetDetails',
  definition(t) {
    t.string('assetId');
    t.string('name');
    t.string('description');
    t.string('customName');
    t.string('model');
    t.string('year');
    t.string('trackerId');
    t.string('vin');
    t.string('serialNumber');
    t.string('driverName');
    t.string('cameraId');
    t.string('photoId');
  },
});

const RentalViewAssetPhoto = objectType({
  name: 'RentalViewAssetPhoto',
  definition(t) {
    t.string('photoId');
    t.string('filename');
  },
});

const RentalViewAssetCompany = objectType({
  name: 'RentalViewAssetCompany',
  definition(t) {
    t.string('id');
    t.string('name');
  },
});

const RentalViewAssetType = objectType({
  name: 'RentalViewAssetType',
  definition(t) {
    t.string('id');
    t.string('name');
  },
});

const RentalViewAssetMake = objectType({
  name: 'RentalViewAssetMake',
  definition(t) {
    t.string('id');
    t.string('name');
  },
});

const RentalViewAssetModel = objectType({
  name: 'RentalViewAssetModel',
  definition(t) {
    t.string('id');
    t.string('name');
  },
});

const RentalViewAssetClass = objectType({
  name: 'RentalViewAssetClass',
  definition(t) {
    t.string('id');
    t.string('name');
    t.string('description');
  },
});

const RentalViewAssetBranch = objectType({
  name: 'RentalViewAssetBranch',
  definition(t) {
    t.string('id');
    t.string('name');
    t.string('description');
    t.string('companyId');
    t.string('companyName');
  },
});

const RentalViewAssetGroup = objectType({
  name: 'RentalViewAssetGroup',
  definition(t) {
    t.string('id');
    t.string('name');
    t.string('companyId');
    t.string('companyName');
  },
});

const RentalViewAssetTspCompany = objectType({
  name: 'RentalViewAssetTspCompany',
  definition(t) {
    t.string('companyId');
    t.string('companyName');
  },
});

const RentalViewAssetTracker = objectType({
  name: 'RentalViewAssetTracker',
  definition(t) {
    t.string('id');
    t.string('deviceSerial');
    t.string('companyId');
    t.string('vendorId');
    t.string('created');
    t.string('updated');
    t.string('trackerTypeId');
  },
});

const RentalViewAsset = objectType({
  name: 'RentalViewAsset',
  definition(t) {
    t.string('assetId');
    t.field('details', { type: RentalViewAssetDetails });
    t.field('photo', { type: RentalViewAssetPhoto });
    t.field('company', { type: RentalViewAssetCompany });
    t.field('type', { type: RentalViewAssetType });
    t.field('make', { type: RentalViewAssetMake });
    t.field('model', { type: RentalViewAssetModel });
    t.field('class', { type: RentalViewAssetClass });
    t.field('inventoryBranch', { type: RentalViewAssetBranch });
    t.field('mspBranch', { type: RentalViewAssetBranch });
    t.field('rspBranch', { type: RentalViewAssetBranch });
    t.list.field('groups', { type: RentalViewAssetGroup });
    t.list.field('tspCompanies', { type: RentalViewAssetTspCompany });
    t.field('tracker', { type: RentalViewAssetTracker });
    t.list.string('keypad');
  },
});

const RentalViewStatus = objectType({
  name: 'RentalViewStatus',
  definition(t) {
    t.string('id');
    t.string('name');
  },
});

const RentalViewOrder = objectType({
  name: 'RentalViewOrder',
  definition(t) {
    t.string('orderId');
    t.string('orderStatusId');
    t.string('orderStatusName');
    t.string('companyId');
    t.string('companyName');
    t.string('orderedByUserId');
    t.string('orderedByFirstName');
    t.string('orderedByLastName');
    t.string('orderedByEmail');
    t.string('dateCreated');
    t.string('dateUpdated');
  },
});

// Main rental view type
export const RentalMaterializedView = objectType({
  name: 'RentalMaterializedView',
  definition(t) {
    t.nonNull.string('rentalId');
    t.field('details', { type: RentalViewDetails });
    t.field('asset', { type: RentalViewAsset });
    t.field('status', { type: RentalViewStatus });
    t.field('order', { type: RentalViewOrder });
  },
});

// Filter input type
const RentalViewFilterInput = inputObjectType({
  name: 'RentalViewFilterInput',
  definition(t) {
    t.string('rentalStatusId');
    t.string('orderId');
    t.string('assetId');
    t.string('startDateFrom');
    t.string('startDateTo');
    t.string('borrowerUserId');
  },
});

// Page input type
const ListRentalViewsPageInput = inputObjectType({
  name: 'ListRentalViewsPageInput',
  definition(t) {
    t.int('number', { default: 1 });
    t.int('size', { default: 10 });
  },
});

// Result type with pagination
export const ListRentalViewsResult = objectType({
  name: 'ListRentalViewsResult',
  definition(t) {
    t.nonNull.list.nonNull.field('items', {
      type: RentalMaterializedView,
    });
    t.nonNull.field('page', { type: PaginationInfo });
  },
});

// Mapper function to convert MongoDB document to GraphQL type
function mapRentalViewToGraphQL(doc: WithId<KsqlEsdbRentalMaterializedView>) {
  return {
    rentalId: doc._id.toString(),
    details: doc.details
      ? {
          rentalId: doc.details.rental_id ?? null,
          borrowerUserId: doc.details.borrower_user_id ?? null,
          rentalStatusId: doc.details.rental_status_id ?? null,
          dateCreated: doc.details.date_created ?? null,
          startDate: doc.details.start_date ?? null,
          endDate: doc.details.end_date ?? null,
          amountReceived: doc.details.amount_received ?? null,
          price: doc.details.price ?? null,
          deliveryCharge: doc.details.delivery_charge ?? null,
          returnCharge: doc.details.return_charge ?? null,
          deliveryRequired: doc.details.delivery_required ?? null,
          deliveryInstructions: doc.details.delivery_instructions ?? null,
          orderId: doc.details.order_id ?? null,
          dropOffDeliveryId: doc.details.drop_off_delivery_id ?? null,
          returnDeliveryId: doc.details.return_delivery_id ?? null,
          pricePerDay: doc.details.price_per_day ?? null,
          pricePerWeek: doc.details.price_per_week ?? null,
          pricePerMonth: doc.details.price_per_month ?? null,
          startDateEstimated: doc.details.start_date_estimated ?? null,
          endDateEstimated: doc.details.end_date_estimated ?? null,
          jobDescription: doc.details.job_description ?? null,
          equipmentClassId: doc.details.equipment_class_id ?? null,
          pricePerHour: doc.details.price_per_hour ?? null,
          deleted: doc.details.deleted ?? null,
          rentalProtectionPlanId: doc.details.rental_protection_plan_id ?? null,
          taxable: doc.details.taxable ?? null,
          assetId: doc.details.asset_id ?? null,
          dropOffDeliveryRequired:
            doc.details.drop_off_delivery_required ?? null,
          returnDeliveryRequired: doc.details.return_delivery_required ?? null,
          lienNoticeSent: doc.details.lien_notice_sent ?? null,
          offRentDateRequested: doc.details.off_rent_date_requested ?? null,
          externalId: doc.details.external_id ?? null,
          rentalTypeId: doc.details.rental_type_id ?? null,
          partTypeId: doc.details.part_type_id ?? null,
          quantity: doc.details.quantity ?? null,
          purchasePrice: doc.details.purchase_price ?? null,
          rentalPurchaseOptionId: doc.details.rental_purchase_option_id ?? null,
          rateTypeId: doc.details.rate_type_id ?? null,
          hasReRent: doc.details.has_re_rent ?? null,
          isBelowFloorRate: doc.details.is_below_floor_rate ?? null,
          isFlatMonthlyRate: doc.details.is_flat_monthly_rate ?? null,
          isFlexibleRate: doc.details.is_flexible_rate ?? null,
          inventoryProductId: doc.details.inventory_product_id ?? null,
          inventoryProductName: doc.details.inventory_product_name ?? null,
          inventoryProductNameHistorical:
            doc.details.inventory_product_name_historical ?? null,
          oneTimeCharge: doc.details.one_time_charge ?? null,
          rentalPricingStructureId:
            doc.details.rental_pricing_structure_id ?? null,
        }
      : null,
    asset: doc.asset
      ? {
          assetId: doc.asset.asset_id ?? null,
          details: doc.asset.details
            ? {
                assetId: doc.asset.details.asset_id ?? null,
                name: doc.asset.details.name ?? null,
                description: doc.asset.details.description ?? null,
                customName: doc.asset.details.custom_name ?? null,
                model: doc.asset.details.model ?? null,
                year: doc.asset.details.year ?? null,
                trackerId: doc.asset.details.tracker_id ?? null,
                vin: doc.asset.details.vin ?? null,
                serialNumber: doc.asset.details.serial_number ?? null,
                driverName: doc.asset.details.driver_name ?? null,
                cameraId: doc.asset.details.camera_id ?? null,
                photoId: doc.asset.details.photo_id ?? null,
              }
            : null,
          photo: doc.asset.photo
            ? {
                photoId: doc.asset.photo.photo_id ?? null,
                filename: doc.asset.photo.filename ?? null,
              }
            : null,
          company: doc.asset.company
            ? {
                id: doc.asset.company.id ?? null,
                name: doc.asset.company.name ?? null,
              }
            : null,
          type: doc.asset.type
            ? {
                id: doc.asset.type.id ?? null,
                name: doc.asset.type.name ?? null,
              }
            : null,
          make: doc.asset.make
            ? {
                id: doc.asset.make.id ?? null,
                name: doc.asset.make.name ?? null,
              }
            : null,
          model: doc.asset.model
            ? {
                id: doc.asset.model.id ?? null,
                name: doc.asset.model.name ?? null,
              }
            : null,
          class: doc.asset.class
            ? {
                id: doc.asset.class.id ?? null,
                name: doc.asset.class.name ?? null,
                description: doc.asset.class.description ?? null,
              }
            : null,
          inventoryBranch: doc.asset.inventory_branch
            ? {
                id: doc.asset.inventory_branch.id ?? null,
                name: doc.asset.inventory_branch.name ?? null,
                description: doc.asset.inventory_branch.description ?? null,
                companyId: doc.asset.inventory_branch.company_id ?? null,
                companyName: doc.asset.inventory_branch.company_name ?? null,
              }
            : null,
          mspBranch: doc.asset.msp_branch
            ? {
                id: doc.asset.msp_branch.id ?? null,
                name: doc.asset.msp_branch.name ?? null,
                description: doc.asset.msp_branch.description ?? null,
                companyId: doc.asset.msp_branch.company_id ?? null,
                companyName: doc.asset.msp_branch.company_name ?? null,
              }
            : null,
          rspBranch: doc.asset.rsp_branch
            ? {
                id: doc.asset.rsp_branch.id ?? null,
                name: doc.asset.rsp_branch.name ?? null,
                description: doc.asset.rsp_branch.description ?? null,
                companyId: doc.asset.rsp_branch.company_id ?? null,
                companyName: doc.asset.rsp_branch.company_name ?? null,
              }
            : null,
          groups: Array.isArray(doc.asset.groups)
            ? doc.asset.groups.map((g) =>
                g
                  ? {
                      id: g.id ?? null,
                      name: g.name ?? null,
                      companyId: g.company_id ?? null,
                      companyName: g.company_name ?? null,
                    }
                  : null,
              )
            : [],
          tspCompanies: Array.isArray(doc.asset.tsp_companies)
            ? doc.asset.tsp_companies.map((tc) =>
                tc
                  ? {
                      companyId: tc.company_id ?? null,
                      companyName: tc.company_name ?? null,
                    }
                  : null,
              )
            : [],
          tracker: doc.asset.tracker
            ? {
                id: doc.asset.tracker.id ?? null,
                deviceSerial: doc.asset.tracker.device_serial ?? null,
                companyId: doc.asset.tracker.company_id ?? null,
                vendorId: doc.asset.tracker.vendor_id ?? null,
                created: doc.asset.tracker.created ?? null,
                updated: doc.asset.tracker.updated ?? null,
                trackerTypeId: doc.asset.tracker.tracker_type_id ?? null,
              }
            : null,
          keypad: Array.isArray(doc.asset.keypad)
            ? doc.asset.keypad.filter((k): k is string => typeof k === 'string')
            : [],
        }
      : null,
    status: doc.status
      ? {
          id: doc.status.id ?? null,
          name: doc.status.name ?? null,
        }
      : null,
    order: doc.order
      ? {
          orderId: doc.order.order_id ?? null,
          orderStatusId: doc.order.order_status_id ?? null,
          orderStatusName: doc.order.order_status_name ?? null,
          companyId: doc.order.company_id ?? null,
          companyName: doc.order.company_name ?? null,
          orderedByUserId: doc.order.ordered_by_user_id ?? null,
          orderedByFirstName: doc.order.ordered_by_first_name ?? null,
          orderedByLastName: doc.order.ordered_by_last_name ?? null,
          orderedByEmail: doc.order.ordered_by_email ?? null,
          dateCreated: doc.order.date_created ?? null,
          dateUpdated: doc.order.date_updated ?? null,
        }
      : null,
  };
}

// Query implementation
export const RentalViewsQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('listRentalViews', {
      type: ListRentalViewsResult,
      args: {
        filter: arg({ type: RentalViewFilterInput }),
        page: arg({ type: ListRentalViewsPageInput }),
      },
      async resolve(_, { filter, page }, ctx) {
        // Ensure user is authenticated
        if (!ctx.user) {
          throw new Error('User not authenticated');
        }

        // Build MongoDB filter with company authorization
        const mongoFilter: Record<string, any> = {
          'order.company_id': ctx.user.companyId.toString(),
        };

        // Add optional filters
        if (filter) {
          if (filter.rentalStatusId) {
            mongoFilter['status.id'] = filter.rentalStatusId;
          }
          if (filter.orderId) {
            mongoFilter['order.order_id'] = filter.orderId;
          }
          if (filter.assetId) {
            mongoFilter['asset.asset_id'] = filter.assetId;
          }
          if (filter.borrowerUserId) {
            mongoFilter['details.borrower_user_id'] = filter.borrowerUserId;
          }
          if (filter.startDateFrom || filter.startDateTo) {
            mongoFilter['details.start_date'] = {};
            if (filter.startDateFrom) {
              mongoFilter['details.start_date'].$gte = filter.startDateFrom;
            }
            if (filter.startDateTo) {
              mongoFilter['details.start_date'].$lte = filter.startDateTo;
            }
          }
        }

        // Get paginated results
        const pageNumber = page?.number ?? 1;
        const pageSize = page?.size ?? 10;

        const [items, totalItems] = await Promise.all([
          ctx.services.viewService.rentalView.find(mongoFilter, {
            page: { number: pageNumber, size: pageSize },
          }),
          ctx.services.viewService.rentalView.count(mongoFilter),
        ]);

        return {
          items: items.map(mapRentalViewToGraphQL),
          page: {
            number: pageNumber,
            size: items.length,
            totalItems,
            totalPages: Math.ceil(totalItems / pageSize),
          },
        };
      },
    });
  },
});
