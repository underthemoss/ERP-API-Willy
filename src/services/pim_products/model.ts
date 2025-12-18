import { type MongoClient, type Db, type Collection, Filter } from 'mongodb';

export type PimProductDoc = {
  _id: string;
  tenant_id: string;
  is_deleted: boolean;
  pim_product_id: string;
  pim_category_id: string;
  pim_category_platform_id: string;
  pim_category_path: string;
  make: string;
  model: string;
  name: string;
  year: string;
  manufacturer_part_number: string;
  sku: string;
  upc: string;
};

export type PimProductUpsertInput = Omit<PimProductDoc, '_id'>;

export type ListPimProductsQuery = {
  filter: {
    tenant_id: string;
    pim_category_platform_id?: string | string[];
    ids?: string[];
  };
  page?: {
    size?: number;
    number?: number;
  };
};

export class PimProductsModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'pim_products';
  private db: Db;
  private collection: Collection<PimProductDoc>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<PimProductDoc>(this.collectionName);
  }

  async upsertPimProduct(id: string, pimProduct: PimProductUpsertInput) {
    await this.collection.updateOne(
      { _id: id },
      { $set: { ...pimProduct, _id: id } },
      { upsert: true },
    );
  }

  private getFiltersForListing(
    filter: ListPimProductsQuery['filter'],
  ): Filter<PimProductDoc> {
    let filters = {
      is_deleted: false,
      tenant_id: filter.tenant_id,
      ...(filter.ids ? { _id: { $in: filter.ids } } : {}),
    };

    const pimCategoryFilter:
      | Filter<PimProductDoc>['pim_category_platform_id']
      | null = filter.pim_category_platform_id
      ? {
          pim_category_platform_id: Array.isArray(
            filter.pim_category_platform_id,
          )
            ? { $in: filter.pim_category_platform_id }
            : (filter.pim_category_platform_id as string),
        }
      : null;

    if (pimCategoryFilter) {
      filters = { ...filters, ...pimCategoryFilter };
    }

    return filters;
  }

  async listPimProducts(query: ListPimProductsQuery): Promise<PimProductDoc[]> {
    const filter = this.getFiltersForListing(query.filter);

    const limit = query.page?.size || 10;
    const skip = query.page?.number ? (query.page.number - 1) * limit : 0;

    return this.collection
      .find(filter, { limit, skip, sort: { name: 1 } })
      .toArray();
  }

  async countPimProducts(inputFilter: ListPimProductsQuery['filter']) {
    const filter = this.getFiltersForListing(inputFilter);
    return this.collection.countDocuments(filter);
  }

  async getPimProductById(id: string): Promise<PimProductDoc | null> {
    const query = {
      _id: id,
    };
    const result = await this.collection.findOne(query);
    return result;
  }

  async batchGetPimProductsById(
    ids: readonly string[],
  ): Promise<Array<PimProductDoc | null>> {
    const products = await this.collection
      .find({ _id: { $in: ids } })
      .toArray();

    const mapped = new Map(products.map((prod) => [prod._id, prod]));
    return ids.map((id) => mapped.get(id) ?? null);
  }
}

export const createPimProductsModel = (config: {
  mongoClient: MongoClient;
}) => {
  const pimProductsModel = new PimProductsModel(config);
  return pimProductsModel;
};
