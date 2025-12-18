import DataLoader from 'dataloader';
import { type UserAuthPayload } from '../authentication';
import { type ContactsService, Contact } from '../services/contacts';
import {
  type PriceBook,
  type PricesService,
  type Price,
} from '../services/prices';
import { type PriceEngineService } from '../services/price_engine';
import { type CompaniesService, CompanyDoc } from '../services/companies';
import { type UsersService, UserDoc } from '../services/users';
import {
  AssetSchedulesService,
  AssetScheduleDoc,
} from '../services/asset_schedules';
import { type ProjectsService, type ProjectDoc } from '../services/projects';
import {
  type SalesOrdersService,
  type SalesOrderDoc,
  type SalesOrderLineItemDoc,
} from '../services/sales_orders';
import { ResourceMapResourcesService } from '../services/resource_map';

import {
  type PimCategoriesService,
  type PimCategory,
} from '../services/pim_categories';

import {
  type PimProductsService,
  type PimProduct,
} from '../services/pim_products';

import { type NotesService, NoteDoc } from '../services/notes';
import { type ChargeService, type Charge } from '../services/charges';
import { type InventoryService, type Inventory } from '../services/inventory';
import { type AssetsService } from '../services/assets';
import { type AssetDoc } from '../services/assets/model';
import {
  type PurchaseOrdersService,
  type PurchaseOrderDoc,
  type PurchaseOrderLineItemDoc,
} from '../services/purchase_orders';
import { type BrandfetchService, type BrandDoc } from '../services/brandfetch';
import {
  type IntakeFormService,
  type IntakeFormSubmissionLineItemDTO,
} from '../services/intake-forms';
import { type SearchService } from '../services/search';
import { type SearchDocument } from '../services/search/types';
import { type QuotingService, type Quote } from '../services/quoting';

// Type for compound dataloader key for price forecasts
type PriceForecastKey = {
  priceId: string;
  durationInDays: number;
};

// Type for forecast result
type PriceForecastResult = ReturnType<PriceEngineService['forecastPricing']>;

type CreateDataLoadersConfig = {
  user?: UserAuthPayload;
  services: {
    contactsService: ContactsService;
    pricesService: PricesService;
    companiesService: CompaniesService;
    usersService: UsersService;
    assetSchedulesService: AssetSchedulesService;
    salesOrdersService: SalesOrdersService;
    projectsService: ProjectsService;
    resourceMapResourcesService: ResourceMapResourcesService;
    pimCategoriesService: PimCategoriesService;
    pimProductsService: PimProductsService;
    notesService: NotesService;
    chargeService: ChargeService;
    inventoryService: InventoryService;
    assetsService: AssetsService;
    purchaseOrdersService: PurchaseOrdersService;
    brandfetchService: BrandfetchService;
    intakeFormService: IntakeFormService;
    searchService: SearchService;
    quotingService: QuotingService;
  };
};

export function createDataLoaders(config: CreateDataLoadersConfig) {
  return {
    contacts: {
      getContactsById: new DataLoader<string, Contact | null>(async (ids) => {
        return config.services.contactsService.batchGetContactsById(
          ids,
          config.user,
        );
      }),
    },
    prices: {
      getPriceBookById: new DataLoader<string, PriceBook | null>(
        async (ids) => {
          return config.services.pricesService.batchGetPriceBooksById(
            ids,
            config.user,
          );
        },
      ),
      getPriceById: new DataLoader<string, Price | null>(async (ids) => {
        return config.services.pricesService.batchGetPricesByIds(
          ids,
          config.user,
        );
      }),
      getPriceForecast: new DataLoader<
        PriceForecastKey,
        PriceForecastResult | null,
        string
      >(
        async (keys) => {
          return config.services.pricesService.batchCalculateSubTotal(
            keys,
            config.user,
          );
        },
        {
          // Use custom cacheKeyFn for compound object keys
          cacheKeyFn: (key: PriceForecastKey) =>
            `${key.priceId}:${key.durationInDays}`,
        },
      ),
    },
    companies: {
      getCompaniesById: new DataLoader<string, CompanyDoc | null>(
        async (ids) => {
          return config.services.companiesService.batchGetCompaniesById(
            Array.from(ids),
            config.user,
          );
        },
      ),
    },
    users: {
      getUsersById: new DataLoader<string, UserDoc | null>(async (ids) => {
        return config.services.usersService.batchGetUsersById(
          Array.from(ids),
          config.user,
        );
      }),
    },
    assetSchedules: {
      getAssetSchedulesById: new DataLoader<string, AssetScheduleDoc | null>(
        async (ids) => {
          if (!config.user) return ids.map(() => null);
          return config.services.assetSchedulesService.batchGetAssetSchedulesById(
            Array.from(ids),
            config.user,
          );
        },
      ),
    },
    salesOrders: {
      getSalesOrdersById: new DataLoader<string, SalesOrderDoc | null>(
        async (ids) => {
          if (!config.user) return ids.map(() => null);
          return config.services.salesOrdersService.batchGetSalesOrdersById(
            Array.from(ids),
            config.user,
          );
        },
      ),
      getSalesOrderLineItemsById: new DataLoader<
        string,
        SalesOrderLineItemDoc | null
      >(async (ids) => {
        if (!config.user) return ids.map(() => null);
        return config.services.salesOrdersService.batchGetSalesOrderLineItemsById(
          Array.from(ids),
          config.user,
        );
      }),
      getSalesOrderByIntakeFormSubmissionId: new DataLoader<
        string,
        SalesOrderDoc | null
      >(async (submissionIds) => {
        if (!config.user) return submissionIds.map(() => null);
        return config.services.salesOrdersService.batchGetSalesOrdersByIntakeFormSubmissionIds(
          submissionIds,
          config.user,
        );
      }),
      getSalesOrderLineItemByIntakeFormSubmissionLineItemId: new DataLoader<
        string,
        SalesOrderLineItemDoc | null
      >(async (lineItemIds) => {
        if (!config.user) return lineItemIds.map(() => null);
        return config.services.salesOrdersService.batchGetSalesOrderLineItemsByIntakeFormSubmissionLineItemIds(
          lineItemIds,
          config.user,
        );
      }),
    },
    projects: {
      getProjectsById: new DataLoader<string, ProjectDoc | null>(
        async (ids) => {
          if (!config.user) return ids.map(() => null);
          return config.services.projectsService.batchGetProjectsById(
            Array.from(ids),
            config.user,
          );
        },
      ),
    },
    resourceMapResources: {
      getResourceMapEntriesById: new DataLoader<string, any | null>(
        async (ids) => {
          // @ts-ignore: type will be ResourceMapResourceDoc
          return config.services.resourceMapResourcesService.batchGetResourceMapEntriesById(
            Array.from(ids),
            config.user,
          );
        },
      ),
    },
    pimCategories: {
      getPimCategoriesById: new DataLoader<string, PimCategory | null>(
        async (ids) => {
          return config.services.pimCategoriesService.batchGetPimCategoriesById(
            ids,
          );
        },
      ),
    },
    pimProducts: {
      getPimProductsById: new DataLoader<string, PimProduct | null>(
        async (ids) => {
          return config.services.pimProductsService.batchGetPimProductsById(
            ids,
          );
        },
      ),
    },
    notes: {
      getNotesById: new DataLoader<string, NoteDoc | null>(async (ids) => {
        if (!config.user) return ids.map(() => null);
        return config.services.notesService.batchGetNotesById(
          Array.from(ids),
          config.user,
        );
      }),
      bulkListNotesByParentEntityId: new DataLoader<string, NoteDoc[]>(
        async (parentEntityIds) => {
          if (!config.user) return parentEntityIds.map(() => []);
          return config.services.notesService.bulkListNotesByParentEntityId(
            Array.from(parentEntityIds),
            config.user,
          );
        },
      ),
    },
    charges: {
      getChargesById: new DataLoader<string, Charge | null>(async (ids) => {
        return config.services.chargeService.getChargeByIds(ids, config.user);
      }),
    },
    inventory: {
      getInventoriesById: new DataLoader<string, Inventory | null>(
        async (ids) => {
          return config.services.inventoryService.batchGetInventoriesById(
            ids,
            config.user,
          );
        },
      ),
      getInventoriesByPurchaseOrderLineItemId: new DataLoader<
        string,
        Inventory[]
      >(async (lineItemIds) => {
        return config.services.inventoryService.batchGetInventoriesByPurchaseOrderLineItemId(
          lineItemIds,
          config.user,
        );
      }),
      getInventoriesByPurchaseOrderId: new DataLoader<string, Inventory[]>(
        async (purchaseOrderIds) => {
          return config.services.inventoryService.batchGetInventoriesByPurchaseOrderId(
            purchaseOrderIds,
            config.user,
          );
        },
      ),
    },
    assets: {
      getAssetsById: new DataLoader<string, AssetDoc | null>(async (ids) => {
        return config.services.assetsService.batchGetAssetsById(
          ids,
          config.user,
        );
      }),
    },
    purchaseOrders: {
      getPurchaseOrdersById: new DataLoader<string, PurchaseOrderDoc | null>(
        async (ids) => {
          if (!config.user) return ids.map(() => null);
          return config.services.purchaseOrdersService.batchGetPurchaseOrdersById(
            Array.from(ids),
            config.user,
          );
        },
      ),
      getPurchaseOrderLineItemsById: new DataLoader<
        string,
        PurchaseOrderLineItemDoc | null
      >(async (ids) => {
        if (!config.user) return ids.map(() => null);
        return config.services.purchaseOrdersService.batchGetPurchaseOrderLineItemsById(
          Array.from(ids),
          config.user,
        );
      }),
    },
    brands: {
      getBrandsById: new DataLoader<string, BrandDoc | null>(async (ids) => {
        return config.services.brandfetchService.batchGetBrandsByIds(
          Array.from(ids),
          config.user,
        );
      }),
    },
    intakeForms: {
      getLineItemsBySubmissionId: new DataLoader<
        string,
        IntakeFormSubmissionLineItemDTO[]
      >(async (submissionIds) => {
        // Batch fetch line items for multiple submissions
        const results = await Promise.all(
          submissionIds.map((submissionId) =>
            config.services.intakeFormService.getLineItemsBySubmissionId(
              submissionId,
              config.user,
            ),
          ),
        );
        return results;
      }),
      getLineItemById: new DataLoader<
        string,
        IntakeFormSubmissionLineItemDTO | null
      >(async (lineItemIds) => {
        const results = await Promise.all(
          lineItemIds.map(async (lineItemId) => {
            try {
              return await config.services.intakeFormService.getLineItemById(
                lineItemId,
                config.user,
              );
            } catch {
              return null;
            }
          }),
        );
        return results;
      }),
    },
    searchDocuments: {
      getSearchDocumentsById: new DataLoader<string, SearchDocument | null>(
        async (ids) => {
          if (!config.user) return ids.map(() => null);
          return config.services.searchService.getBulkByIds(
            Array.from(ids),
            config.user,
          );
        },
      ),
    },
    quotes: {
      getQuoteByIntakeFormSubmissionId: new DataLoader<string, Quote | null>(
        async (submissionIds) => {
          if (!config.user) return submissionIds.map(() => null);
          return config.services.quotingService.batchGetQuotesByIntakeFormSubmissionIds(
            submissionIds,
            config.user,
          );
        },
      ),
    },
  };
}
