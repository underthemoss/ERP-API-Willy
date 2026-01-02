import { type MongoClient } from 'mongodb';
import {
  createPricesModel,
  type PricesModel,
  type CreateRentalPriceInput,
  type CreateSalePriceInput,
  type CreateServicePriceInput,
  type UpdateRentalPriceInput,
  type UpdateSalePriceInput,
  type UpdateServicePriceInput,
  type ListPricesQuery,
  type Price,
  type PricingSpec,
  type CatalogProductKind,
  type PriceCatalogRef,
  PriceType,
} from './prices-model';

import {
  createPriceBookModel,
  type PriceBookModel,
  type PriceBook,
  type CreatePriceBookInput,
  type ListPriceBooksQuery,
} from './price-book-model';

import { UserAuthPayload, ANON_USER_AUTH_PAYLOAD } from '../../authentication';
import { FileService } from '../file_service';
import { FileDoc } from '../file_service/model';
import {
  type AuthZ,
  ERP_PRICEBOOK_SUBJECT_PERMISSIONS,
  ERP_PRICEBOOK_SUBJECT_RELATIONS,
  ERP_WORKSPACE_SUBJECT_PERMISSIONS,
  ERP_PRICEBOOK_PRICE_SUBJECT_PERMISSIONS,
  RESOURCE_TYPES,
} from '../../lib/authz';
import { PimCategoriesService } from '../pim_categories';
import { PriceEngineService } from '../price_engine';

// re-export DTOs
export type {
  RentalPrice,
  SalePrice,
  ServicePrice,
  Price,
  PriceType,
} from './prices-model';
export type { PriceBook } from './price-book-model';

const scalePricingSpec = (
  pricingSpec: PricingSpec | undefined,
  factor: number,
): PricingSpec | undefined => {
  if (!pricingSpec) {
    return undefined;
  }

  if (pricingSpec.kind === 'UNIT' || pricingSpec.kind === 'TIME') {
    return {
      ...pricingSpec,
      rateInCents: Math.round(pricingSpec.rateInCents * factor),
    };
  }

  if (pricingSpec.kind === 'RENTAL_RATE_TABLE') {
    return {
      ...pricingSpec,
      pricePerDayInCents: Math.round(pricingSpec.pricePerDayInCents * factor),
      pricePerWeekInCents: Math.round(pricingSpec.pricePerWeekInCents * factor),
      pricePerMonthInCents: Math.round(
        pricingSpec.pricePerMonthInCents * factor,
      ),
    };
  }

  return pricingSpec;
};

const isCatalogProductKind = (value: string): value is CatalogProductKind =>
  value === 'MATERIAL_PRODUCT' ||
  value === 'SERVICE_PRODUCT' ||
  value === 'ASSEMBLY_PRODUCT';

const normalizeCatalogRef = (
  kind: string | undefined,
  id: string | undefined,
): PriceCatalogRef | undefined => {
  if (!kind || !id) {
    return undefined;
  }
  const normalizedKind = kind.trim().toUpperCase();
  if (!isCatalogProductKind(normalizedKind)) {
    throw new Error(`Invalid catalogRefKind: ${kind}`);
  }
  return { kind: normalizedKind, id };
};

export class PricesService {
  private pricesModel: PricesModel;
  private priceBookModel: PriceBookModel;
  private fileService: FileService;
  private authZ: AuthZ;
  private pimCategoriesService: PimCategoriesService;
  private priceEngineService: PriceEngineService;
  constructor(config: {
    pricesModel: PricesModel;
    priceBookModel: PriceBookModel;
    fileService: FileService;
    authZ: AuthZ;
    pimCategoriesService: PimCategoriesService;
    priceEngineService: PriceEngineService;
  }) {
    this.pricesModel = config.pricesModel;
    this.priceBookModel = config.priceBookModel;
    this.fileService = config.fileService;
    this.authZ = config.authZ;
    this.pimCategoriesService = config.pimCategoriesService;
    this.priceEngineService = config.priceEngineService;
  }
  // ************* price book use-cases
  async createPriceBook(
    input: Omit<CreatePriceBookInput, 'createdBy' | 'updatedBy'>,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) {
    const hasPermission = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CREATE_PRICE_BOOK,
      resourceId: input.workspaceId,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('Unauthorized to create price book in this workspace');
    }

    if (input.parentPriceBookId) {
      const canViewParentPriceBook = await this.authZ.priceBook.hasPermission({
        permission: ERP_PRICEBOOK_SUBJECT_PERMISSIONS.USER_READ,
        resourceId: input.parentPriceBookId,
        subjectId: user.id,
      });

      if (!canViewParentPriceBook) {
        throw new Error('Unauthorized to view parent price book');
      }
    }

    return this.priceBookModel.withTransaction(async (session) => {
      const newPriceBook = await this.priceBookModel.createPriceBook(
        {
          ...input,
          createdBy: user.id,
          updatedBy: user.id,
        },
        session,
      );

      await this.authZ.priceBook.writeRelation({
        relation: ERP_PRICEBOOK_SUBJECT_RELATIONS.WORKSPACE_WORKSPACE,
        resourceId: newPriceBook.id,
        subjectId: input.workspaceId,
      });

      if (newPriceBook.parentPriceBookId) {
        // clone all the prices from the parent price book
        // apply the parentPriceBookPercentageFactor to all prices
        const prices = await this.pricesModel.listPrices(
          {
            filter: {
              priceBookId: newPriceBook.parentPriceBookId,
            },
            page: { size: 1000, number: 1 },
          },
          session,
        );

        const parentPriceBookPercentageFactor =
          newPriceBook.parentPriceBookPercentageFactor ?? 1;

        // Fetch fresh category data for all unique category IDs BEFORE the transaction
        // This avoids external service calls within the transaction which could cause timeouts
        const uniqueCategoryIds = [
          ...new Set(
            prices
              .map((p) => p.pimCategoryId)
              .filter((id): id is string => Boolean(id)),
          ),
        ];

        // Use batch method for better performance - fetches all categories in parallel
        const categoryMap = await this.fetchCategoryDataBatch(
          uniqueCategoryIds,
          user,
        );

        // create the cloned prices with fresh category data
        const clonedPrices = prices.map((parentPrice) => {
          const {
            pricingSpec: parentPricingSpec,
            priceType: parentPriceType,
            ...parentBase
          } = parentPrice;
          // Get fresh category data if available
          const categoryData = parentPrice.pimCategoryId
            ? categoryMap.get(parentPrice.pimCategoryId)
            : null;

          // Log warning if category not found but continue with stale data
          if (parentPrice.pimCategoryId && !categoryData) {
            console.warn(
              `PIM category not found during price book clone: ${parentPrice.pimCategoryId}, using stale data`,
            );
          }

          //common fields
          const scaledPricingSpec = scalePricingSpec(
            parentPricingSpec,
            parentPriceBookPercentageFactor,
          );

          const newPrice = {
            ...parentBase,
            priceBookId: newPriceBook.id,
            parentPriceId: parentPrice.id,
            parentPriceIdPercentageFactor: parentPriceBookPercentageFactor,
            businessContactId: newPriceBook.businessContactId,
            projectId: newPriceBook.projectId,
            location: newPriceBook.location,
            // Use fresh category data if available, fallback to parent data
            pimCategoryName: categoryData?.name || parentPrice.pimCategoryName,
            pimCategoryPath: categoryData?.path || parentPrice.pimCategoryPath,
          };

          if (parentPriceType === 'RENTAL') {
            return {
              ...newPrice,
              priceType: 'RENTAL' as const,
              pricingSpec: scaledPricingSpec,
              pricePerDayInCents: Math.round(
                parentPrice.pricePerDayInCents *
                  parentPriceBookPercentageFactor,
              ),
              pricePerWeekInCents: Math.round(
                parentPrice.pricePerWeekInCents *
                  parentPriceBookPercentageFactor,
              ),
              pricePerMonthInCents: Math.round(
                parentPrice.pricePerMonthInCents *
                  parentPriceBookPercentageFactor,
              ),
            };
          }
          if (parentPriceType === 'SERVICE') {
            if (
              !scaledPricingSpec ||
              scaledPricingSpec.kind === 'RENTAL_RATE_TABLE'
            ) {
              throw new Error(
                'Service prices require UNIT or TIME pricingSpec',
              );
            }
            return {
              ...newPrice,
              priceType: 'SERVICE' as const,
              pricingSpec: scaledPricingSpec,
            };
          }
          if (parentPriceType === 'SALE') {
            return {
              ...newPrice,
              priceType: 'SALE' as const,
              pricingSpec: scaledPricingSpec,
              unitCostInCents: Math.round(
                parentPrice.unitCostInCents * parentPriceBookPercentageFactor,
              ),
              discounts: parentPrice.discounts,
            };
          }
          throw new Error(`Unsupported price type: ${parentPriceType}`);
        });

        const newPrices = await this.pricesModel.batchCreatePrices(
          clonedPrices,
          session,
        );
        await this.authZ.priceBookPrice.writePriceBookPricesRelations(
          newPrices,
        );
      }

      return newPriceBook;
    });
  }

  async listPriceBooks(
    query: {
      filter: ListPriceBooksQuery['filter'];
      page: ListPriceBooksQuery['page'];
    },
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) {
    const hasPermission = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ_PRICE_BOOKS,
      resourceId: query.filter.workspaceId,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('Unauthorized to list price books in this workspace');
    }

    const filter = {
      ...query?.filter,
      deleted: { $ne: true },
    };
    const page = {
      ...query?.page,
      size: query?.page?.size ?? 10,
      number: query?.page?.number ?? 1,
    };

    const [items, count] = await Promise.all([
      this.priceBookModel.listPriceBooks({
        filter,
        page,
      }),
      this.priceBookModel.countPriceBooks(filter),
    ]);
    return {
      items,
      page: {
        number: query?.page?.number ?? 1,
        size: items.length,
        totalItems: count,
        totalPages: Math.ceil(count / items.length) || 0,
      },
    };
  }

  async updatePriceBook(
    id: string,
    input: Omit<import('./price-book-model').UpdatePriceBookInput, 'updatedBy'>,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) {
    const hasPermission = await this.authZ.priceBook.hasPermission({
      permission: ERP_PRICEBOOK_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('Unauthorized to update this price book');
    }

    return this.priceBookModel.updatePriceBook(id, {
      ...input,
      updatedBy: user.id,
    });
  }

  async deletePriceBookById(
    id: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) {
    const hasPermission = await this.authZ.priceBook.hasPermission({
      permission: ERP_PRICEBOOK_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('Unauthorized to delete this price book');
    }

    await this.priceBookModel.deletePriceBookById(id);
    await this.pricesModel.softDeletePricesByPriceBookId(id);
  }

  async getPriceBookById(
    id: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) {
    const hasPermission = await this.authZ.priceBook.hasPermission({
      permission: ERP_PRICEBOOK_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: id,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('Unauthorized to view this price book');
    }

    return this.priceBookModel.getPriceBookById(id);
  }

  async batchGetPriceBooksById(
    ids: readonly string[],
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<(PriceBook | Error)[]> {
    // Check permissions for all IDs
    const permissionResults = await this.authZ.priceBook.bulkHasPermissions(
      ids.map((id) => ({
        permission: ERP_PRICEBOOK_SUBJECT_PERMISSIONS.USER_READ,
        resourceId: id,
        subjectId: user.id,
      })),
    );

    // Create a map of ID to permission result
    const permissionMap = new Map<string, boolean>();
    permissionResults.forEach((result) => {
      if (result.resourceId) {
        permissionMap.set(result.resourceId, result.hasPermission);
      }
    });

    // Filter IDs that have permission
    const authorizedIds = ids.filter((id) => permissionMap.get(id) === true);

    // Fetch price books for authorized IDs only
    let priceBookResults: (PriceBook | null)[] = [];
    if (authorizedIds.length > 0) {
      priceBookResults =
        await this.priceBookModel.batchGetPriceBooksById(authorizedIds);
    }

    // Create a map of fetched price books
    const priceBookMap = new Map<string, PriceBook>();
    priceBookResults.forEach((priceBook) => {
      if (priceBook) {
        priceBookMap.set(priceBook.id, priceBook);
      }
    });

    // Build result array matching input order and size
    return ids.map((id) => {
      const hasPermission = permissionMap.get(id);

      if (!hasPermission) {
        return new Error(`Unauthorized to view price book ${id}`);
      }

      const priceBook = priceBookMap.get(id);
      if (!priceBook) {
        return new Error(`Price book ${id} not found`);
      }

      return priceBook;
    });
  }

  // ************* prices use-cases
  async createRentalPrice(
    input: Omit<CreateRentalPriceInput, 'createdBy'>,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) {
    if (!input.pimCategoryId && !input.catalogRef) {
      throw new Error('pimCategoryId or catalogRef is required');
    }
    if (input.pricingSpec && input.pricingSpec.kind !== 'RENTAL_RATE_TABLE') {
      throw new Error(
        'Rental prices only support RENTAL_RATE_TABLE pricingSpec',
      );
    }

    let priceBook: PriceBook | null = null;
    if (input.priceBookId) {
      const hasPermission = await this.authZ.priceBook.hasPermission({
        permission: ERP_PRICEBOOK_SUBJECT_PERMISSIONS.USER_UPDATE,
        resourceId: input.priceBookId,
        subjectId: user.id,
      });
      if (!hasPermission) {
        throw new Error('Unauthorized to add price to this price book');
      }
      priceBook = await this.priceBookModel.getPriceBookById(input.priceBookId);
      if (!priceBook) {
        throw new Error('Price book not found');
      }
    } else {
      const hasPermission = await this.authZ.workspace.hasPermission({
        permission:
          ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_PRICE_BOOKS,
        resourceId: input.workspaceId,
        subjectId: user.id,
      });
      if (!hasPermission) {
        throw new Error('Unauthorized to create price in this workspace');
      }
    }

    return this.pricesModel.withTransaction(async (session) => {
      const newPrice = await this.pricesModel.createRentalPrice(
        {
          ...input,
          createdBy: user.id,
          businessContactId:
            priceBook?.businessContactId || input.businessContactId,
          projectId: priceBook?.projectId || input.projectId,
          location: priceBook?.location || input.location,
        },
        session,
      );

      await this.authZ.priceBookPrice.writePriceBookPriceRelations(newPrice);

      return newPrice;
    });
  }

  async createSalePrice(
    input: Omit<CreateSalePriceInput, 'createdBy'>,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) {
    if (!input.pimCategoryId && !input.catalogRef) {
      throw new Error('pimCategoryId or catalogRef is required');
    }
    if (input.pricingSpec && input.pricingSpec.kind !== 'UNIT') {
      throw new Error('Sale prices only support UNIT pricingSpec');
    }

    let priceBook: PriceBook | null = null;
    if (input.priceBookId) {
      const hasPermission = await this.authZ.priceBook.hasPermission({
        permission: ERP_PRICEBOOK_SUBJECT_PERMISSIONS.USER_UPDATE,
        resourceId: input.priceBookId,
        subjectId: user.id,
      });
      if (!hasPermission) {
        throw new Error('Unauthorized to add price to this price book');
      }

      priceBook = await this.priceBookModel.getPriceBookById(input.priceBookId);
      if (!priceBook) {
        throw new Error('Price book not found');
      }
    } else {
      const hasPermission = await this.authZ.workspace.hasPermission({
        permission:
          ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_PRICE_BOOKS,
        resourceId: input.workspaceId,
        subjectId: user.id,
      });
      if (!hasPermission) {
        throw new Error('Unauthorized to create price in this workspace');
      }
    }

    return this.pricesModel.withTransaction(async (session) => {
      const newPrice = await this.pricesModel.createSalePrice(
        {
          ...input,
          createdBy: user.id,
          businessContactId:
            priceBook?.businessContactId || input.businessContactId,
          projectId: priceBook?.projectId || input.projectId,
          location: priceBook?.location || input.location,
        },
        session,
      );

      await this.authZ.priceBookPrice.writePriceBookPriceRelations(newPrice);
      return newPrice;
    });
  }

  async createServicePrice(
    input: Omit<CreateServicePriceInput, 'createdBy'>,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) {
    if (!input.catalogRef) {
      throw new Error('catalogRef is required for service prices');
    }
    if (!input.pricingSpec) {
      throw new Error('pricingSpec is required for service prices');
    }

    let priceBook: PriceBook | null = null;
    if (input.priceBookId) {
      const hasPermission = await this.authZ.priceBook.hasPermission({
        permission: ERP_PRICEBOOK_SUBJECT_PERMISSIONS.USER_UPDATE,
        resourceId: input.priceBookId,
        subjectId: user.id,
      });
      if (!hasPermission) {
        throw new Error('Unauthorized to add price to this price book');
      }

      priceBook = await this.priceBookModel.getPriceBookById(input.priceBookId);
      if (!priceBook) {
        throw new Error('Price book not found');
      }
    } else {
      const hasPermission = await this.authZ.workspace.hasPermission({
        permission:
          ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_PRICE_BOOKS,
        resourceId: input.workspaceId,
        subjectId: user.id,
      });
      if (!hasPermission) {
        throw new Error('Unauthorized to create price in this workspace');
      }
    }

    return this.pricesModel.withTransaction(async (session) => {
      const newPrice = await this.pricesModel.createServicePrice(
        {
          ...input,
          createdBy: user.id,
          businessContactId:
            priceBook?.businessContactId || input.businessContactId,
          projectId: priceBook?.projectId || input.projectId,
          location: priceBook?.location || input.location,
        },
        session,
      );

      await this.authZ.priceBookPrice.writePriceBookPriceRelations(newPrice);
      return newPrice;
    });
  }

  async deletePriceById(
    id: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) {
    const [price] = await this.pricesModel.batchGetPriceByIds([id]);

    if (!price) {
      throw new Error('Price not found');
    }

    const hasPermission = await this.authZ.priceBookPrice.hasPermission({
      permission: ERP_PRICEBOOK_PRICE_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: id,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('Unauthorized to delete this price');
    }

    return this.pricesModel.deletePriceById(id);
  }

  async hasPriceForCategory(
    opts: {
      categoryName: string;
      categoryPath: string;
      priceBookId: string;
      type?: PriceType;
    },
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) {
    return this.pricesModel.hasPriceForCategory({
      categoryName: opts.categoryName,
      categoryPath: opts.categoryPath,
      priceBookId: opts.priceBookId,
      type: opts.type,
    });
  }

  async listPrices(
    query: {
      filter: ListPricesQuery['filter'];
      page: ListPricesQuery['page'];
    },
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) {
    if (query.filter.priceBookId) {
      const hasPermission = await this.authZ.priceBook.hasPermission({
        permission: ERP_PRICEBOOK_SUBJECT_PERMISSIONS.USER_READ,
        resourceId: query.filter.priceBookId,
        subjectId: user.id,
      });
      if (!hasPermission) {
        throw new Error('Unauthorized to list prices from this price book');
      }
    } else {
      if (!query.filter.workspaceId) {
        throw new Error('workspaceId is required when priceBookId is not set');
      }

      const hasPermission = await this.authZ.workspace.hasPermission({
        permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_PRICES,
        resourceId: query.filter.workspaceId,
        subjectId: user.id,
      });
      if (!hasPermission) {
        throw new Error('Unauthorized to list prices in this workspace');
      }
    }

    const filter = {
      ...query?.filter,
    };
    const page = {
      ...query?.page,
      size: query?.page?.size ?? 10,
      number: query?.page?.number ?? 1,
    };

    const [items, count] = await Promise.all([
      this.pricesModel.listPrices({
        filter,
        page,
      }),
      this.pricesModel.countPrices(filter),
    ]);
    return {
      items,
      page: {
        number: page.number ?? 1,
        size: items.length,
        totalItems: count,
        totalPages: Math.ceil(count / items.length) || 0,
      },
    };
  }

  async batchGetPricesByIds(
    ids: readonly string[],
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<(Price | Error)[]> {
    try {
      // Check permissions for all IDs
      const permissionResults =
        await this.authZ.priceBookPrice.bulkHasPermissions(
          ids.map((id) => ({
            permission: ERP_PRICEBOOK_PRICE_SUBJECT_PERMISSIONS.USER_READ,
            resourceId: id,
            subjectId: user.id,
          })),
        );

      // Create a map of ID to permission result
      const permissionMap = new Map<string, boolean>();
      permissionResults.forEach((result) => {
        if (result.resourceId) {
          permissionMap.set(result.resourceId, result.hasPermission);
        }
      });

      // Filter IDs that have permission
      const authorizedIds = ids.filter((id) => permissionMap.get(id) === true);

      // Fetch prices for authorized IDs only
      let priceResults: (Price | null)[] = [];
      if (authorizedIds.length > 0) {
        priceResults = await this.pricesModel.batchGetPriceByIds(authorizedIds);
      }

      // Create a map of fetched prices
      const priceMap = new Map<string, Price>();
      priceResults.forEach((price) => {
        if (price) {
          priceMap.set(price.id, price);
        }
      });

      // Build result array matching input order and size
      return ids.map((id) => {
        const hasPermission = permissionMap.get(id);

        if (!hasPermission) {
          return new Error(`Unauthorized to view price ${id}`);
        }

        const price = priceMap.get(id);
        if (!price) {
          return new Error(`Price ${id} not found`);
        }

        return price;
      });
    } catch (e) {
      console.error('error in batchGetPricesByIds', e);
      // Return errors for all IDs if there's a system error
      return ids.map((id) => new Error(`Failed to fetch price ${id}`));
    }
  }

  /**
   * Get a single price by ID
   */
  async getPriceById(
    id: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<Price | null> {
    const results = await this.batchGetPricesByIds([id], user);
    const result = results[0];

    if (result instanceof Error) {
      throw result;
    }

    return result || null;
  }

  /**
   * Returns a unique list of all pimCategoryIds from all prices associated with the given priceBookId.
   */
  async listCategoriesForPriceBook(
    workspaceId: string,
    priceBookId?: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<string[]> {
    if (priceBookId) {
      const hasPermission = await this.authZ.priceBook.hasPermission({
        permission: ERP_PRICEBOOK_SUBJECT_PERMISSIONS.USER_READ,
        resourceId: priceBookId,
        subjectId: user.id,
      });
      if (!hasPermission) {
        throw new Error('Unauthorized to list categories from this price book');
      }
    } else {
      const hasPermission = await this.authZ.workspace.hasPermission({
        permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ_PRICES,
        resourceId: workspaceId,
        subjectId: user.id,
      });
      if (!hasPermission) {
        throw new Error('Unauthorized to list prices for this workspace');
      }
    }

    // Fetch all prices for the given priceBookId and workspaceId, in batches
    const prices = await this.pricesModel.listAllPrices({
      ...(priceBookId ? { priceBookId } : {}),
    });

    // Extract pimCategoryIds, filter out undefined/null, and deduplicate
    const categorySet = new Set<string>();
    for (const price of prices) {
      if (price.pimCategoryId) {
        categorySet.add(price.pimCategoryId);
      }
    }
    return Array.from(categorySet);
  }

  /**
   * Returns unique price names filtered by priceBookId and pimCategoryId.
   */
  async listUniquePriceNames(
    params: {
      workspaceId: string;
      priceBookId?: string;
      pimCategoryId?: string;
    },
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<string[]> {
    if (params.priceBookId) {
      const hasPermission = await this.authZ.priceBook.hasPermission({
        permission: ERP_PRICEBOOK_SUBJECT_PERMISSIONS.USER_READ,
        resourceId: params.priceBookId,
        subjectId: user.id,
      });
      if (!hasPermission) {
        throw new Error('Unauthorized to list prices for this price book');
      }
    } else {
      const hasPermission = await this.authZ.workspace.hasPermission({
        permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ_PRICES,
        resourceId: params.workspaceId,
        subjectId: user.id,
      });
      if (!hasPermission) {
        throw new Error('Unauthorized to list prices for this workspace');
      }
    }

    return this.pricesModel.listUniquePriceNames({
      ...params,
    });
  }

  async updateRentalPrice(
    input: UpdateRentalPriceInput & { id: string },
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) {
    if (input.pricingSpec && input.pricingSpec.kind !== 'RENTAL_RATE_TABLE') {
      throw new Error(
        'Rental prices only support RENTAL_RATE_TABLE pricingSpec',
      );
    }

    // First, get the existing price to verify ownership
    const existingPrices = await this.pricesModel.batchGetPriceByIds([
      input.id,
    ]);
    const existingPrice = existingPrices[0];

    if (!existingPrice) {
      throw new Error('Price not found');
    }

    const hasPermission = await this.authZ.priceBookPrice.hasPermission({
      permission: ERP_PRICEBOOK_PRICE_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: input.id,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('Unauthorized to update this price');
    }

    if (existingPrice.priceType !== 'RENTAL') {
      throw new Error('Price is not a rental price');
    }

    // Update the price
    return this.pricesModel.updateRentalPrice(input.id, {
      name: input.name,
      pricePerDayInCents: input.pricePerDayInCents,
      pricePerWeekInCents: input.pricePerWeekInCents,
      pricePerMonthInCents: input.pricePerMonthInCents,
      pricingSpec: input.pricingSpec,
      catalogRef: input.catalogRef,
      pimProductId: input.pimProductId,
      pimCategoryId: input.pimCategoryId,
      pimCategoryName: input.pimCategoryName,
      pimCategoryPath: input.pimCategoryPath,
      updatedBy: user.id,
    });
  }

  async updateSalePrice(
    input: UpdateSalePriceInput & { id: string },
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) {
    if (input.pricingSpec && input.pricingSpec.kind !== 'UNIT') {
      throw new Error('Sale prices only support UNIT pricingSpec');
    }

    // First, get the existing price to verify ownership
    const existingPrices = await this.pricesModel.batchGetPriceByIds([
      input.id,
    ]);
    const existingPrice = existingPrices[0];

    if (!existingPrice) {
      throw new Error('Price not found');
    }

    const hasPermission = await this.authZ.priceBookPrice.hasPermission({
      permission: ERP_PRICEBOOK_PRICE_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: input.id,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('Unauthorized to update this price');
    }

    if (existingPrice.priceType !== 'SALE') {
      throw new Error('Price is not a sale price');
    }

    // Update the price
    return this.pricesModel.updateSalePrice(input.id, {
      name: input.name,
      unitCostInCents: input.unitCostInCents,
      discounts: input.discounts,
      pricingSpec: input.pricingSpec,
      catalogRef: input.catalogRef,
      pimProductId: input.pimProductId,
      pimCategoryId: input.pimCategoryId,
      pimCategoryName: input.pimCategoryName,
      pimCategoryPath: input.pimCategoryPath,
      updatedBy: user.id,
    });
  }

  async updateServicePrice(
    input: UpdateServicePriceInput & { id: string },
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) {
    // First, get the existing price to verify ownership
    const existingPrices = await this.pricesModel.batchGetPriceByIds([
      input.id,
    ]);
    const existingPrice = existingPrices[0];

    if (!existingPrice) {
      throw new Error('Price not found');
    }

    const hasPermission = await this.authZ.priceBookPrice.hasPermission({
      permission: ERP_PRICEBOOK_PRICE_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: input.id,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('Unauthorized to update this price');
    }

    if (existingPrice.priceType !== 'SERVICE') {
      throw new Error('Price is not a service price');
    }

    return this.pricesModel.updateServicePrice(input.id, {
      name: input.name,
      pricingSpec: input.pricingSpec,
      catalogRef: input.catalogRef,
      pimProductId: input.pimProductId,
      pimCategoryId: input.pimCategoryId,
      pimCategoryName: input.pimCategoryName,
      pimCategoryPath: input.pimCategoryPath,
      updatedBy: user.id,
    });
  }

  /**
   * Export prices to CSV format and store as a file
   * @param priceBookId Optional price book ID to filter prices
   * @param user User authentication payload
   * @returns FileDoc representing the exported CSV file
   */
  async exportPrices(
    priceBookId: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<FileDoc> {
    const hasPermission = await this.authZ.priceBook.hasPermission({
      permission: ERP_PRICEBOOK_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: priceBookId,
      subjectId: user.id,
    });
    if (!hasPermission) {
      throw new Error('Unauthorized to export prices from this price book');
    }

    // Fetch all prices for the given priceBookId (or all if not specified)
    const prices = await this.pricesModel.listAllPrices({
      ...(priceBookId ? { priceBookId } : {}),
    });

    const priceBook = await this.priceBookModel.getPriceBookById(priceBookId);

    if (!priceBook) {
      throw new Error('Price book not found');
    }

    // Create CSV header (removed businessContactId, projectId, location, pimCategoryName, pimCategoryPath)
    const csvHeaders = [
      'id',
      'name',
      'priceType',
      'pimCategoryId',
      'pimProductId',
      'priceBookId',
      'pricePerDayInCents',
      'pricePerWeekInCents',
      'pricePerMonthInCents',
      'unitCostInCents',
      'discounts',
      'catalogRefKind',
      'catalogRefId',
      'pricingSpecKind',
      'pricingSpecUnitCode',
      'pricingSpecRateInCents',
      'pricingSpecPricePerDayInCents',
      'pricingSpecPricePerWeekInCents',
      'pricingSpecPricePerMonthInCents',
    ];

    // Convert prices to CSV rows
    const csvRows = prices.map((price) => {
      const row = [
        price.id,
        price.name || '',
        price.priceType,
        price.pimCategoryId,
        price.pimProductId || '',
        price.priceBookId || '',
      ];

      if (price.priceType === 'RENTAL') {
        row.push(
          price.pricePerDayInCents.toString(),
          price.pricePerWeekInCents.toString(),
          price.pricePerMonthInCents.toString(),
          '', // unitCostInCents (empty for rental)
          '', // discounts (empty for rental)
        );
      } else if (price.priceType === 'SALE') {
        row.push(
          '', // pricePerDayInCents (empty for sale)
          '', // pricePerWeekInCents (empty for sale)
          '', // pricePerMonthInCents (empty for sale)
          price.unitCostInCents.toString(),
          JSON.stringify(price.discounts || {}),
        );
      } else {
        row.push(
          '', // pricePerDayInCents (empty for service)
          '', // pricePerWeekInCents (empty for service)
          '', // pricePerMonthInCents (empty for service)
          '', // unitCostInCents (empty for service)
          '', // discounts (empty for service)
        );
      }

      row.push(
        price.catalogRef?.kind || '',
        price.catalogRef?.id || '',
        price.pricingSpec?.kind || '',
        price.pricingSpec && 'unitCode' in price.pricingSpec
          ? price.pricingSpec.unitCode
          : '',
        price.pricingSpec && 'rateInCents' in price.pricingSpec
          ? price.pricingSpec.rateInCents.toString()
          : '',
        price.pricingSpec && 'pricePerDayInCents' in price.pricingSpec
          ? price.pricingSpec.pricePerDayInCents.toString()
          : '',
        price.pricingSpec && 'pricePerWeekInCents' in price.pricingSpec
          ? price.pricingSpec.pricePerWeekInCents.toString()
          : '',
        price.pricingSpec && 'pricePerMonthInCents' in price.pricingSpec
          ? price.pricingSpec.pricePerMonthInCents.toString()
          : '',
      );

      // Escape and quote fields that might contain commas or quotes
      return row
        .map((field) => {
          const str = String(field);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',');
    });

    // Combine header and rows
    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

    // Convert to buffer
    const buffer = Buffer.from(csvContent, 'utf-8');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const priceBookName = priceBook.name || 'price-book';
    const fileName = `prices-export-${priceBookName}-${timestamp}.csv`;

    const workspaceId = priceBook.workspaceId;

    // Upload to S3 and create file record
    const fileDoc = await this.fileService.uploadBufferAndAddFile(
      {
        buffer,
        fileName,
        parent_entity_id: priceBookId || 'prices-export',
        parent_entity_type: RESOURCE_TYPES.ERP_PRICEBOOK,
        workspace_id: workspaceId,
        created_by: user.id,
        metadata: {
          type: 'prices-export',
          priceBookId: priceBookId || null,
          exportedAt: new Date().toISOString(),
          recordCount: prices.length,
        },
        contentType: 'text/csv',
      },
      user,
    );

    return fileDoc;
  }

  /**
   * Import prices from a CSV file
   * @param priceBookId Destination price book ID
   * @param fileId File ID containing the CSV data
   * @param user User authentication payload
   * @returns Object with import statistics
   */
  async importPrices(
    priceBookId: string,
    fileId: string,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<{ imported: number; failed: number; errors: string[] }> {
    const hasPermission = await this.authZ.priceBook.hasPermission({
      permission: ERP_PRICEBOOK_SUBJECT_PERMISSIONS.USER_UPDATE,
      resourceId: priceBookId,
      subjectId: user.id,
    });
    if (!hasPermission) {
      throw new Error('Unauthorized to import prices into this price book');
    }

    const priceBook = await this.priceBookModel.getPriceBookById(priceBookId);
    if (!priceBook) {
      throw new Error('Price book not found');
    }
    const workspaceId = priceBook.workspaceId;

    // Get the file content from the file service
    const fileStream = await this.fileService.getFileContent(fileId, user);
    if (!fileStream) {
      throw new Error('File not found or could not be read');
    }

    // Convert the stream to string for CSV parsing
    // Since we know this is a CSV file, we can safely transform to string
    const csvContent = await fileStream.transformToString('utf-8');

    if (!csvContent) {
      throw new Error('Failed to read file content');
    }

    // Parse CSV
    const lines = csvContent.split('\n').filter((line: string) => line.trim());
    const headers = lines[0].split(',').map((h: string) => h.trim());

    const results = {
      imported: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);
        const priceData: Record<string, string> = {};

        // Map CSV columns to price fields
        headers.forEach((header: string, index: number) => {
          if (values[index] !== undefined && values[index] !== '') {
            priceData[header] = values[index];
          }
        });

        // Skip if no data
        if (Object.keys(priceData).length === 0) {
          continue;
        }

        // Fetch category details from PIM if pimCategoryId is provided
        // Note: Since we're processing row by row, we still fetch individually here
        // For bulk imports, consider collecting all category IDs first and batch fetching
        let pimCategoryName: string | undefined =
          priceData.pimCategoryName || undefined;
        let pimCategoryPath: string | undefined =
          priceData.pimCategoryPath || undefined;
        if (priceData.pimCategoryId) {
          const category = await this.pimCategoriesService.getPimCategoryById(
            priceData.pimCategoryId,
            user,
          );
          if (category) {
            pimCategoryName = category.name;
            pimCategoryPath = category.path;
          } else {
            console.warn(
              `PIM category not found during import: ${priceData.pimCategoryId}, using fallback values`,
            );
          }
        }

        const catalogRef = normalizeCatalogRef(
          priceData.catalogRefKind,
          priceData.catalogRefId,
        );

        let pricingSpec: PricingSpec | undefined;
        if (
          priceData.pricingSpecKind === 'UNIT' ||
          priceData.pricingSpecKind === 'TIME'
        ) {
          if (
            priceData.pricingSpecUnitCode &&
            priceData.pricingSpecRateInCents !== undefined &&
            priceData.pricingSpecRateInCents !== ''
          ) {
            pricingSpec = {
              kind: priceData.pricingSpecKind,
              unitCode: priceData.pricingSpecUnitCode,
              rateInCents: parseInt(priceData.pricingSpecRateInCents, 10),
            };
          }
        } else if (priceData.pricingSpecKind === 'RENTAL_RATE_TABLE') {
          if (
            priceData.pricingSpecPricePerDayInCents !== undefined &&
            priceData.pricingSpecPricePerDayInCents !== '' &&
            priceData.pricingSpecPricePerWeekInCents !== undefined &&
            priceData.pricingSpecPricePerWeekInCents !== '' &&
            priceData.pricingSpecPricePerMonthInCents !== undefined &&
            priceData.pricingSpecPricePerMonthInCents !== ''
          ) {
            pricingSpec = {
              kind: priceData.pricingSpecKind,
              pricePerDayInCents: parseInt(
                priceData.pricingSpecPricePerDayInCents,
                10,
              ),
              pricePerWeekInCents: parseInt(
                priceData.pricingSpecPricePerWeekInCents,
                10,
              ),
              pricePerMonthInCents: parseInt(
                priceData.pricingSpecPricePerMonthInCents,
                10,
              ),
            };
          }
        }

        // Determine price type and create appropriate price
        if (priceData.priceType === 'RENTAL') {
          await this.createRentalPrice(
            {
              workspaceId,
              name: priceData.name,
              pimCategoryId: priceData.pimCategoryId,
              pimCategoryName,
              pimCategoryPath,
              pricePerDayInCents: parseInt(priceData.pricePerDayInCents, 10),
              pricePerWeekInCents: parseInt(priceData.pricePerWeekInCents, 10),
              pricePerMonthInCents: parseInt(
                priceData.pricePerMonthInCents,
                10,
              ),
              pimProductId: priceData.pimProductId || undefined,
              priceBookId,
              catalogRef,
              pricingSpec,
              // Use price book's location data instead of CSV data
              businessContactId: priceBook.businessContactId || undefined,
              projectId: priceBook.projectId || undefined,
              location: priceBook.location || undefined,
            },
            user,
          );
        } else if (priceData.priceType === 'SALE') {
          await this.createSalePrice(
            {
              workspaceId,
              name: priceData.name,
              pimCategoryId: priceData.pimCategoryId,
              pimCategoryName,
              pimCategoryPath,
              unitCostInCents: parseInt(priceData.unitCostInCents, 10),
              discounts: priceData.discounts
                ? JSON.parse(priceData.discounts)
                : {},
              pimProductId: priceData.pimProductId || undefined,
              priceBookId,
              catalogRef,
              pricingSpec,
              // Use price book's location data instead of CSV data
              businessContactId: priceBook.businessContactId || undefined,
              projectId: priceBook.projectId || undefined,
              location: priceBook.location || undefined,
            },
            user,
          );
        } else if (priceData.priceType === 'SERVICE') {
          if (!catalogRef) {
            throw new Error('catalogRefKind and catalogRefId are required');
          }
          if (!pricingSpec || pricingSpec.kind === 'RENTAL_RATE_TABLE') {
            throw new Error('Service prices require UNIT or TIME pricingSpec');
          }
          await this.createServicePrice(
            {
              workspaceId,
              name: priceData.name,
              pimCategoryId: priceData.pimCategoryId,
              pimCategoryName,
              pimCategoryPath,
              pimProductId: priceData.pimProductId || undefined,
              priceBookId,
              catalogRef,
              pricingSpec,
              // Use price book's location data instead of CSV data
              businessContactId: priceBook.businessContactId || undefined,
              projectId: priceBook.projectId || undefined,
              location: priceBook.location || undefined,
            },
            user,
          );
        } else {
          throw new Error(`Invalid price type: ${priceData.priceType}`);
        }

        results.imported++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return results;
  }

  /**
   * Parse a CSV line handling quoted fields
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(current);

    return result;
  }

  /**
   * Calculate subtotal forecast for a given price and duration
   * @param priceId The ID of the price to calculate the forecast for
   * @param durationInDays The duration in days for the rental period
   * @param user User authentication payload
   * @returns LineItemPriceForecast object with day-by-day pricing forecast
   */
  async calculateSubTotal(
    priceId: string,
    durationInDays: number,
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ) {
    // Check SpiceDB authorization: verify user has read permission on the price
    const hasPermission = await this.authZ.priceBookPrice.hasPermission({
      permission: ERP_PRICEBOOK_PRICE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: priceId,
      subjectId: user.id,
    });

    if (!hasPermission) {
      throw new Error('Unauthorized to view this price');
    }

    // Fetch the price by ID
    const [price] = await this.pricesModel.batchGetPriceByIds([priceId]);

    if (!price) {
      throw new Error('Price not found');
    }

    // Validate price is a RentalPrice (not SalePrice)
    if (price.priceType !== 'RENTAL') {
      throw new Error(
        'Cannot calculate subtotal for sale prices. Only rental prices support forecast calculations.',
      );
    }

    // Extract rental rates
    const pricePer1DayInCents = price.pricePerDayInCents;
    const pricePer7DaysInCents = price.pricePerWeekInCents;
    const pricePer28DaysInCents = price.pricePerMonthInCents;

    // Calculate the forecast using price engine
    const startDate = new Date();
    const rentalEndDate = new Date(startDate);
    rentalEndDate.setDate(startDate.getDate() + durationInDays);

    const forecast = this.priceEngineService.forecastPricing({
      startDate,
      numberOfDaysToForcast: durationInDays,
      rentalEndDate,
      pricePer1DayInCents,
      pricePer7DaysInCents,
      pricePer28DaysInCents,
    });

    return forecast;
  }

  /**
   * Batch calculate subtotal forecasts for multiple price/duration combinations.
   * Returns null for items that cannot be calculated (not found, non-RENTAL, etc.).
   * This is optimized for DataLoader usage to avoid N+1 queries.
   */
  async batchCalculateSubTotal(
    inputs: readonly { priceId: string; durationInDays: number }[],
    user: UserAuthPayload = ANON_USER_AUTH_PAYLOAD,
  ): Promise<(ReturnType<PriceEngineService['forecastPricing']> | null)[]> {
    if (inputs.length === 0) {
      return [];
    }

    // Extract unique priceIds
    const uniquePriceIds = [...new Set(inputs.map((i) => i.priceId))];

    // Batch fetch all prices (this method handles authorization internally)
    const priceResults = await this.batchGetPricesByIds(uniquePriceIds, user);

    // Create a map of priceId -> price (only RENTAL prices, excluding Errors)
    const priceMap = new Map<string, Price>();
    priceResults.forEach((result) => {
      // Skip Error results
      if (result instanceof Error) {
        return;
      }
      // Only include RENTAL prices
      if (result.priceType === 'RENTAL') {
        priceMap.set(result.id, result);
      }
    });

    // Calculate forecasts for each input
    return inputs.map((input) => {
      const { priceId, durationInDays } = input;

      // Get price (must be RENTAL type and authorized)
      const price = priceMap.get(priceId);
      if (!price || price.priceType !== 'RENTAL') {
        return null;
      }

      // Calculate forecast
      const startDate = new Date();
      const rentalEndDate = new Date(startDate);
      rentalEndDate.setDate(startDate.getDate() + durationInDays);

      return this.priceEngineService.forecastPricing({
        startDate,
        numberOfDaysToForcast: durationInDays,
        rentalEndDate,
        pricePer1DayInCents: price.pricePerDayInCents,
        pricePer7DaysInCents: price.pricePerWeekInCents,
        pricePer28DaysInCents: price.pricePerMonthInCents,
      });
    });
  }

  /**
   * Helper method to fetch category data in batch for better performance.
   * Uses the batch method from PimCategoriesService to fetch all categories in parallel.
   * This avoids N+1 query problems when fetching many categories.
   */
  private async fetchCategoryDataBatch(
    categoryIds: string[],
    user: UserAuthPayload,
  ): Promise<Map<string, { name: string; path: string }>> {
    if (categoryIds.length === 0) {
      return new Map();
    }

    try {
      // Use the batch method that fetches all categories in parallel
      return await this.pimCategoriesService.batchGetPimCategoriesByIdsAsMap(
        categoryIds,
        user,
      );
    } catch (error) {
      console.error('Error fetching category data in batch:', error);
      // Return empty map on error, allowing the process to continue with stale data
      return new Map();
    }
  }
}

export const createPricesService = (config: {
  mongoClient: MongoClient;
  fileService: FileService;
  authZ: AuthZ;
  pimCategoriesService: PimCategoriesService;
  priceEngineService: PriceEngineService;
}) => {
  const pricesModel = createPricesModel(config);
  const priceBookModel = createPriceBookModel(config);
  const pricesService = new PricesService({
    pricesModel,
    priceBookModel,
    fileService: config.fileService,
    authZ: config.authZ,
    pimCategoriesService: config.pimCategoriesService,
    priceEngineService: config.priceEngineService,
  });
  return pricesService;
};
