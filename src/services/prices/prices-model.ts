import {
  type MongoClient,
  type Db,
  type Collection,
  ClientSession,
  WithTransactionCallback,
  Filter,
} from 'mongodb';
import { generateId } from '../../lib/id-generator';

export type PriceType = 'RENTAL' | 'SALE' | 'SERVICE';

export type CatalogProductKind =
  | 'MATERIAL_PRODUCT'
  | 'SERVICE_PRODUCT'
  | 'ASSEMBLY_PRODUCT';

export type PriceCatalogRef = {
  kind: CatalogProductKind;
  id: string;
};

export type PricingSpecUnit = {
  kind: 'UNIT';
  unitCode: string;
  rateInCents: number;
};

export type PricingSpecTime = {
  kind: 'TIME';
  unitCode: string;
  rateInCents: number;
};

export type PricingSpecRentalRateTable = {
  kind: 'RENTAL_RATE_TABLE';
  pricePerDayInCents: number;
  pricePerWeekInCents: number;
  pricePerMonthInCents: number;
};

export type PricingSpec =
  | PricingSpecUnit
  | PricingSpecTime
  | PricingSpecRentalRateTable;

type BaseGeneratedFields = '_id' | 'createdAt' | 'updatedAt';

interface BasePriceDoc<T = PriceType> {
  _id: string;
  workspaceId: string;
  parentPriceId?: string; // if cloned from another price
  parentPriceIdPercentageFactor?: number; // percentage factor for parent price
  name?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
  catalogRef?: PriceCatalogRef;
  pricingSpec?: PricingSpec;
  pimCategoryId?: string;
  pimCategoryPath?: string;
  pimCategoryName?: string;
  pimProductId?: string; // if this price is for a specific product
  priceType: T;
  priceBookId?: string;
  // denormalized fields from pricebook
  businessContactId?: string; // TODO plumb this through
  projectId?: string;
  location?: string;
  deleted: boolean;
}

interface RentalPriceDoc extends BasePriceDoc<'RENTAL'> {
  pricePerDayInCents: number;
  pricePerWeekInCents: number;
  pricePerMonthInCents: number;
}

interface SalePriceDoc extends BasePriceDoc<'SALE'> {
  unitCostInCents: number;
  discounts: Record<number, number>;
}

interface ServicePriceDoc extends BasePriceDoc<'SERVICE'> {
  pricingSpec: PricingSpecUnit | PricingSpecTime;
}

type PriceDoc = RentalPriceDoc | SalePriceDoc | ServicePriceDoc;

// DTOs
export type RentalPrice = Omit<RentalPriceDoc, '_id'> & { id: string };
export type SalePrice = Omit<SalePriceDoc, '_id'> & { id: string };
export type ServicePrice = Omit<ServicePriceDoc, '_id'> & { id: string };
export type Price = RentalPrice | SalePrice | ServicePrice;

// input types
export type CreateRentalPriceInput = Omit<
  RentalPriceDoc,
  BaseGeneratedFields | 'priceType' | 'deleted' | 'updatedBy'
>;
export type CreateSalePriceInput = Omit<
  SalePriceDoc,
  BaseGeneratedFields | 'priceType' | 'deleted' | 'updatedBy'
>;
export type CreateServicePriceInput = Omit<
  ServicePriceDoc,
  BaseGeneratedFields | 'priceType' | 'deleted' | 'updatedBy'
>;

export type BatchInsertPriceInput =
  | Omit<RentalPriceDoc, BaseGeneratedFields | 'deleted'>
  | Omit<SalePriceDoc, BaseGeneratedFields | 'deleted'>
  | Omit<ServicePriceDoc, BaseGeneratedFields | 'deleted'>;

export type UpdateRentalPriceInput = {
  name?: string;
  pricePerDayInCents?: number;
  pricePerWeekInCents?: number;
  pricePerMonthInCents?: number;
  pricingSpec?: PricingSpec;
  catalogRef?: PriceCatalogRef;
  pimProductId?: string;
  pimCategoryId?: string;
  pimCategoryName?: string;
  pimCategoryPath?: string;
  updatedBy?: string;
};

export type UpdateSalePriceInput = {
  name?: string;
  unitCostInCents?: number;
  discounts?: Record<number, number>;
  pricingSpec?: PricingSpec;
  catalogRef?: PriceCatalogRef;
  pimProductId?: string;
  pimCategoryId?: string;
  pimCategoryName?: string;
  pimCategoryPath?: string;
  updatedBy?: string;
};

export type UpdateServicePriceInput = {
  name?: string;
  pricingSpec?: PricingSpecUnit | PricingSpecTime;
  catalogRef?: PriceCatalogRef;
  pimProductId?: string;
  pimCategoryId?: string;
  pimCategoryName?: string;
  pimCategoryPath?: string;
  updatedBy?: string;
};

export type ListPricesQuery = {
  filter: {
    workspaceId?: string;
    pimCategoryId?: string;
    catalogRefId?: string;
    catalogRefKind?: CatalogProductKind;
    priceBookId?: string;
    priceType?: PriceType;
    businessContactId?: string;
    projectId?: string;
    name?: string; // Partial match search on price name
  };
  page?: {
    size?: number;
    number?: number;
  };
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class PricesModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'prices';
  private db: Db;
  private collection: Collection<PriceDoc>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<PriceDoc>(this.collectionName);
  }

  withTransaction<T = any>(
    cb: WithTransactionCallback<T>,
    options?: Parameters<ClientSession['withTransaction']>[1],
  ) {
    return this.client.withSession<T>((session) => {
      return session.withTransaction<T>(cb, options);
    });
  }

  async hasPriceForCategory(opts: {
    categoryName: string;
    categoryPath: string;
    priceBookId: string;
    type?: PriceType;
  }) {
    const path = opts.categoryPath
      ? `${opts.categoryPath}${opts.categoryName}|`
      : `|${opts.categoryName}|`;

    const filter: Filter<PriceDoc> = {
      $and: [
        {
          priceBookId: opts.priceBookId,
          deleted: { $ne: true },
          ...(opts.type ? { priceType: opts.type } : {}),
        },
        {
          $or: [
            { pimCategoryName: opts.categoryName },
            { pimCategoryPath: { $regex: `^${escapeRegex(path)}` } },
          ],
        },
      ],
    };

    const match = await this.collection.findOne(filter);

    return !!match;
  }

  /**
   * Returns unique price names filtered by priceBookId and pimCategoryId.
   */
  async listUniquePriceNames(params: {
    priceBookId?: string;
    pimCategoryId?: string;
    workspaceId: string;
  }): Promise<string[]> {
    const match: Record<string, any> = {};
    if (params.priceBookId) match.priceBookId = params.priceBookId;
    if (params.pimCategoryId) match.pimCategoryId = params.pimCategoryId;
    if (params.workspaceId) match.workspaceId = params.workspaceId;
    match.deleted = { $ne: true };

    const pipeline = [
      { $match: match },
      { $group: { _id: '$name' } },
      { $project: { _id: 0, name: '$_id' } },
    ];

    const results = await this.collection.aggregate(pipeline).toArray();
    return results.map((r: any) => r.name);
  }

  private mapRentalPrice(doc: RentalPriceDoc): RentalPrice {
    const { _id, ...fields } = doc;
    return { ...fields, id: doc._id };
  }

  private mapSalePrice(doc: SalePriceDoc): SalePrice {
    const { _id, ...fields } = doc;
    return { ...fields, id: doc._id };
  }

  private mapServicePrice(doc: ServicePriceDoc): ServicePrice {
    const { _id, ...fields } = doc;
    return { ...fields, id: doc._id };
  }

  private mapPrice(doc: PriceDoc): Price {
    if (doc.priceType === 'RENTAL') {
      return this.mapRentalPrice(doc);
    }
    if (doc.priceType === 'SERVICE') {
      return this.mapServicePrice(doc);
    }
    return this.mapSalePrice(doc);
  }

  async createRentalPrice(
    input: CreateRentalPriceInput,
    session?: ClientSession,
  ): Promise<RentalPrice> {
    const now = new Date();
    const result = await this.collection.insertOne(
      {
        ...input,
        _id: generateId('PR', input.workspaceId),
        name: input.name ?? '',
        createdAt: now,
        updatedAt: now,
        updatedBy: input.createdBy,
        deleted: false,
        priceType: 'RENTAL',
      },
      { session },
    );

    const doc = await this.collection.findOne<RentalPriceDoc>(
      {
        _id: result.insertedId,
      },
      { session },
    );
    if (!doc) {
      throw new Error('Rental price not found');
    }
    return this.mapRentalPrice(doc);
  }

  async createSalePrice(
    input: CreateSalePriceInput,
    session?: ClientSession,
  ): Promise<SalePrice> {
    const now = new Date();
    const result = await this.collection.insertOne(
      {
        ...input,
        _id: generateId('PR', input.workspaceId),
        name: input.name ?? '',
        createdAt: now,
        updatedAt: now,
        updatedBy: input.createdBy,
        deleted: false,
        priceType: 'SALE',
      },
      { session },
    );

    const doc = await this.collection.findOne<SalePriceDoc>(
      {
        _id: result.insertedId,
      },
      { session },
    );
    if (!doc) {
      throw new Error('Sale price not found');
    }
    return this.mapSalePrice(doc);
  }

  async createServicePrice(
    input: CreateServicePriceInput,
    session?: ClientSession,
  ): Promise<ServicePrice> {
    const now = new Date();
    const result = await this.collection.insertOne(
      {
        ...input,
        _id: generateId('PR', input.workspaceId),
        name: input.name ?? '',
        createdAt: now,
        updatedAt: now,
        updatedBy: input.createdBy,
        deleted: false,
        priceType: 'SERVICE',
      },
      { session },
    );

    const doc = await this.collection.findOne<ServicePriceDoc>(
      {
        _id: result.insertedId,
      },
      { session },
    );
    if (!doc) {
      throw new Error('Service price not found');
    }
    return this.mapServicePrice(doc);
  }

  async batchCreatePrices(
    prices: BatchInsertPriceInput[],
    session?: ClientSession,
  ): Promise<Price[]> {
    const now = new Date();
    const result = await this.collection.insertMany(
      prices.map((price) => ({
        ...price,
        _id: generateId('PR', price.workspaceId),
        name: price.name ?? '',
        createdAt: now,
        updatedAt: now,
        updatedBy: price.updatedBy,
        deleted: false,
      })),
      { session },
    );

    const docs = await this.collection
      .find({ _id: { $in: Object.values(result.insertedIds) } }, { session })
      .toArray();

    return docs.map((doc) => this.mapPrice(doc));
  }

  async listPrices(
    query: ListPricesQuery,
    session?: ClientSession,
  ): Promise<Price[]> {
    const { filter = {}, page } = query;
    const limit = page?.size ?? 10;
    const skip = page?.number ? (page.number - 1) * limit : 0;

    // Build MongoDB filter, handling name as a case-insensitive partial match
    const { name, catalogRefId, catalogRefKind, ...restFilter } = filter;
    const mongoFilter: Filter<PriceDoc> = {
      ...restFilter,
      deleted: { $ne: true },
    };

    if (catalogRefId) {
      mongoFilter['catalogRef.id'] = catalogRefId;
    }
    if (catalogRefKind) {
      mongoFilter['catalogRef.kind'] = catalogRefKind;
    }

    // If name is provided, use regex for partial matching (case-insensitive)
    if (name) {
      mongoFilter.name = { $regex: escapeRegex(name), $options: 'i' };
    }

    const docs = await this.collection
      .find(mongoFilter, { limit, skip, session })
      .toArray();
    return docs.map((doc) => this.mapPrice(doc));
  }

  async countPrices(filter: ListPricesQuery['filter']): Promise<number> {
    // Build MongoDB filter, handling name as a case-insensitive partial match
    const { name, catalogRefId, catalogRefKind, ...restFilter } = filter;
    const mongoFilter: Filter<PriceDoc> = {
      ...restFilter,
      deleted: { $ne: true },
    };

    if (catalogRefId) {
      mongoFilter['catalogRef.id'] = catalogRefId;
    }
    if (catalogRefKind) {
      mongoFilter['catalogRef.kind'] = catalogRefKind;
    }

    // If name is provided, use regex for partial matching (case-insensitive)
    if (name) {
      mongoFilter.name = { $regex: escapeRegex(name), $options: 'i' };
    }

    return this.collection.countDocuments(mongoFilter);
  }

  /**
   * Fetches all prices matching the filter, in batches of batchSize.
   */
  async listAllPrices(
    filter: ListPricesQuery['filter'],
    batchSize: number = 500,
  ): Promise<Price[]> {
    let allPrices: Price[] = [];
    let pageNumber = 1;
    while (true) {
      const batch = await this.listPrices({
        filter,
        page: { size: batchSize, number: pageNumber },
      });
      allPrices = allPrices.concat(batch);
      if (batch.length < batchSize) {
        break;
      }
      pageNumber += 1;
    }
    return allPrices;
  }

  async deletePriceById(id: string): Promise<void> {
    const result = await this.collection.updateOne(
      { _id: id },
      { $set: { deleted: true } },
    );
    if (result.matchedCount === 0) {
      throw new Error('Price not found');
    }
  }

  async softDeletePricesByPriceBookId(priceBookId: string): Promise<void> {
    await this.collection.updateMany(
      { priceBookId },
      { $set: { deleted: true } },
    );
  }

  async batchGetPriceByIds(
    ids: readonly string[],
  ): Promise<Array<Price | null>> {
    const prices = await this.collection
      .find({ _id: { $in: ids }, deleted: { $ne: true } })
      .toArray();

    const mappedPrices = new Map(
      prices.map((price) => [String(price._id), this.mapPrice(price)]),
    );

    return ids.map((id) => mappedPrices.get(id) ?? null);
  }

  async updateRentalPrice(
    id: string,
    input: UpdateRentalPriceInput,
  ): Promise<RentalPrice> {
    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      updateFields.name = input.name;
    }
    if (input.pricePerDayInCents !== undefined) {
      updateFields.pricePerDayInCents = input.pricePerDayInCents;
    }
    if (input.pricePerWeekInCents !== undefined) {
      updateFields.pricePerWeekInCents = input.pricePerWeekInCents;
    }
    if (input.pricePerMonthInCents !== undefined) {
      updateFields.pricePerMonthInCents = input.pricePerMonthInCents;
    }
    if (input.pricingSpec !== undefined) {
      updateFields.pricingSpec = input.pricingSpec;
    }
    if (input.catalogRef !== undefined) {
      updateFields.catalogRef = input.catalogRef;
    }
    if (input.pimProductId !== undefined) {
      updateFields.pimProductId = input.pimProductId;
    }
    if (input.pimCategoryId !== undefined) {
      updateFields.pimCategoryId = input.pimCategoryId;
    }
    if (input.pimCategoryName !== undefined) {
      updateFields.pimCategoryName = input.pimCategoryName;
    }
    if (input.pimCategoryPath !== undefined) {
      updateFields.pimCategoryPath = input.pimCategoryPath;
    }
    if (input.updatedBy !== undefined) {
      updateFields.updatedBy = input.updatedBy;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: id, priceType: 'RENTAL', deleted: { $ne: true } },
      { $set: updateFields },
      { returnDocument: 'after' },
    );

    if (!result) {
      throw new Error('Rental price not found');
    }

    return this.mapRentalPrice(result as RentalPriceDoc);
  }

  async updateSalePrice(
    id: string,
    input: UpdateSalePriceInput,
  ): Promise<SalePrice> {
    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      updateFields.name = input.name;
    }
    if (input.unitCostInCents !== undefined) {
      updateFields.unitCostInCents = input.unitCostInCents;
    }
    if (input.discounts !== undefined) {
      updateFields.discounts = input.discounts;
    }
    if (input.pricingSpec !== undefined) {
      updateFields.pricingSpec = input.pricingSpec;
    }
    if (input.catalogRef !== undefined) {
      updateFields.catalogRef = input.catalogRef;
    }
    if (input.pimProductId !== undefined) {
      updateFields.pimProductId = input.pimProductId;
    }
    if (input.pimCategoryId !== undefined) {
      updateFields.pimCategoryId = input.pimCategoryId;
    }
    if (input.pimCategoryName !== undefined) {
      updateFields.pimCategoryName = input.pimCategoryName;
    }
    if (input.pimCategoryPath !== undefined) {
      updateFields.pimCategoryPath = input.pimCategoryPath;
    }
    if (input.updatedBy !== undefined) {
      updateFields.updatedBy = input.updatedBy;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: id, priceType: 'SALE', deleted: { $ne: true } },
      { $set: updateFields },
      { returnDocument: 'after' },
    );

    if (!result) {
      throw new Error('Sale price not found');
    }

    return this.mapSalePrice(result as SalePriceDoc);
  }

  async updateServicePrice(
    id: string,
    input: UpdateServicePriceInput,
  ): Promise<ServicePrice> {
    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      updateFields.name = input.name;
    }
    if (input.pricingSpec !== undefined) {
      updateFields.pricingSpec = input.pricingSpec;
    }
    if (input.catalogRef !== undefined) {
      updateFields.catalogRef = input.catalogRef;
    }
    if (input.pimProductId !== undefined) {
      updateFields.pimProductId = input.pimProductId;
    }
    if (input.pimCategoryId !== undefined) {
      updateFields.pimCategoryId = input.pimCategoryId;
    }
    if (input.pimCategoryName !== undefined) {
      updateFields.pimCategoryName = input.pimCategoryName;
    }
    if (input.pimCategoryPath !== undefined) {
      updateFields.pimCategoryPath = input.pimCategoryPath;
    }
    if (input.updatedBy !== undefined) {
      updateFields.updatedBy = input.updatedBy;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: id, priceType: 'SERVICE', deleted: { $ne: true } },
      { $set: updateFields },
      { returnDocument: 'after' },
    );

    if (!result) {
      throw new Error('Service price not found');
    }

    return this.mapServicePrice(result as ServicePriceDoc);
  }
}

export const createPricesModel = (config: { mongoClient: MongoClient }) => {
  const pricesModel = new PricesModel(config);
  return pricesModel;
};
