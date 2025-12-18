import { type MongoClient, type Db, type Collection, Filter } from 'mongodb';

export type PimCategoryDoc = {
  _id: string;
  name: string;
  path: string;
  description: string;
  has_products: boolean;
  platform_id: string;
  tenant_id: string;
  is_deleted: null | boolean;
};

export type PimCategoryUpsertInput = Omit<PimCategoryDoc, '_id'>;

export type ListPimCategoriesQuery = {
  filter: {
    tenant_id: string;
    parentId?: string;
    path?: string;
    search?: {
      query: string;
      fields: Array<'name' | 'path'>;
    };
  };
  page?: {
    size?: number;
    number?: number;
  };
};

export class PimCategoriesModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'pim_categories';
  private db: Db;
  private collection: Collection<PimCategoryDoc>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<PimCategoryDoc>(this.collectionName);
  }

  async upsertPimCategory(id: string, pimCategory: PimCategoryUpsertInput) {
    await this.collection.updateOne(
      { _id: id },
      { $set: { ...pimCategory, _id: id } },
      { upsert: true },
    );
  }

  private async getPathForParentId(parentId: string): Promise<string> {
    const parentCategory = await this.getPimCategoryById(parentId);

    if (!parentCategory) {
      throw new Error(`Parent category with ID ${parentId} not found.`);
    }

    return parentCategory.path
      ? `${parentCategory.path}${parentCategory.name}|`
      : `|${parentCategory.name}|`;
  }

  private async getFiltersForListing(
    inputFilter: ListPimCategoriesQuery['filter'],
  ): Promise<Filter<PimCategoryDoc>> {
    const { tenant_id, parentId, search } = inputFilter;
    let { path } = inputFilter;

    if (parentId) {
      path = await this.getPathForParentId(parentId);
    }

    const searchQuery = search?.query?.trim() || '';
    const searchFilters = (search?.fields || []).map((field) => {
      return { [field]: { $regex: searchQuery, $options: 'i' } };
    });

    return {
      is_deleted: false,

      tenant_id,
      // if we have a search term we don't want to filter by path
      // since we're going to search against it
      ...(typeof path === 'string' && !searchFilters.length ? { path } : {}),
      ...(searchFilters.length === 0
        ? {}
        : searchFilters.length === 1
          ? searchFilters[0]
          : { $or: searchFilters }),
    };
  }

  async listPimCategories(
    query: ListPimCategoriesQuery,
  ): Promise<PimCategoryDoc[]> {
    const filter = await this.getFiltersForListing(query.filter);

    const limit = query.page?.size || 10;
    const skip = query.page?.number ? (query.page.number - 1) * limit : 0;

    return this.collection
      .find(filter, { limit, skip, sort: { name: 1 } })
      .toArray();
  }

  async countPimCategories(query: ListPimCategoriesQuery['filter']) {
    const filter = await this.getFiltersForListing(query);
    return this.collection.countDocuments(filter);
  }

  async deletePimCategory(id: string) {
    await this.collection.deleteOne({ _id: id });
  }

  async getPimCategoryById(id: string): Promise<PimCategoryDoc | null> {
    const query = {
      _id: id,
    };
    const result = await this.collection.findOne(query);
    return result;
  }

  /**
   * Batch fetches PIM categories by their IDs, returning results in the same order as input.
   * If a category is not found, null is returned in its place.
   */
  async batchGetPimCategoriesById(
    ids: readonly string[],
  ): Promise<Array<PimCategoryDoc | null>> {
    const categories = await this.collection
      .find({ _id: { $in: ids } })
      .toArray();

    const mapped = new Map(categories.map((cat) => [cat._id, cat]));
    return ids.map((id) => mapped.get(id) ?? null);
  }
}

export const createPimCategoriesModel = (config: {
  mongoClient: MongoClient;
}) => {
  const pimCategoriesModel = new PimCategoriesModel(config);
  return pimCategoriesModel;
};
