import { type MongoClient, type Db, type Collection } from 'mongodb';
import { DataCatalogAssetPimProductSchema } from '../../generated/DataCatalogAssetPimProductSchema.generated';
import { DataCatalogAssetResourceMapSchema } from '../../generated/DataCatalogAssetResourceMapSchema.generated';
import { DataCatalogAssetSchema } from '../../generated/DataCatalogAssetSchema.generated';
import { AssetMaterializedViewV1 } from '../../generated/AssetMaterializedViewV1.generated';

export type AssetDoc = {
  _id: number;
} & DataCatalogAssetPimProductSchema &
  DataCatalogAssetResourceMapSchema &
  DataCatalogAssetSchema &
  Pick<
    AssetMaterializedViewV1,
    | 'category'
    | 'inventory_branch'
    | 'keypad'
    | 'company'
    | 'groups'
    | 'type'
    | 'tsp_companies'
    | 'photo'
    | 'tracker'
    | 'msp_branch'
    | 'rsp_branch'
    | 'details'
    | 'class'
  >;

export type AssetUpsertInput = Omit<AssetDoc, '_id'>;

export type ListAssetsQuery = {
  filter: { company_id: number };
  page?: { size?: number; number?: number };
};

export class AssetsModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'assets';
  private db: Db;
  private collection: Collection<AssetDoc>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<AssetDoc>(this.collectionName);
  }

  async upsertAsset(id: number, asset: Partial<AssetUpsertInput>) {
    await this.collection.updateOne(
      { _id: id },
      { $set: { ...asset, _id: id } },
      { upsert: true },
    );
  }

  async fetchAssets(args: { company_id: number }): Promise<AssetDoc[]> {
    return this.collection
      .find({ company_id: args.company_id, deleted: false })
      .toArray();
  }

  async listAssets(query: ListAssetsQuery): Promise<AssetDoc[]> {
    const { filter, page } = query;
    const limit = page?.size ?? 10;
    const skip = page?.number ? (page.number - 1) * limit : 0;
    return this.collection
      .find({ company_id: filter.company_id, deleted: false }, { limit, skip })
      .toArray();
  }

  async countAssets(filter: ListAssetsQuery['filter']): Promise<number> {
    return this.collection.countDocuments({
      company_id: filter.company_id,
      deleted: false,
    });
  }

  async batchGetAssetsById(
    ids: readonly string[],
    companyId: string,
  ): Promise<(AssetDoc | null)[]> {
    const numericIds = ids
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id));
    const uniqueIds = Array.from(new Set(numericIds));

    const docs = await this.collection
      .find({
        _id: { $in: uniqueIds },
        company_id: parseInt(companyId, 10),
        deleted: false,
      })
      .toArray();

    const docMap = new Map(docs.map((doc) => [doc._id.toString(), doc]));

    // Return in the same order as requested, with nulls for not found
    return ids.map((id) => docMap.get(id) || null);
  }
}

export const createAssetsModel = (config: { mongoClient: MongoClient }) => {
  const contactModel = new AssetsModel(config);
  return contactModel;
};
