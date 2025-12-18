import { type MongoClient, type Db, type Collection, Filter } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

export type AssetScheduleDoc = {
  _id: string;
  asset_id: string;
  project_id: string;
  companyId: string;
  start_date: Date;
  end_date: Date;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
};

export class AssetSchedulesModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'asset_schedules';
  private db: Db;
  private collection: Collection<AssetScheduleDoc>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<AssetScheduleDoc>(this.collectionName);
  }

  async createAssetSchedule(doc: Omit<AssetScheduleDoc, '_id'>) {
    if (!doc.updated_by || !doc.created_by) {
      throw new Error('updated_by and created_by are required');
    }
    const assetScheduleWithId: AssetScheduleDoc = {
      _id: uuidv4(),
      ...doc,
    };
    const result = await this.collection.insertOne(assetScheduleWithId);
    if (!result.insertedId) {
      throw new Error('Failed to insert asset schedule');
    }
    const inserted = await this.collection.findOne({
      _id: assetScheduleWithId._id,
    });
    if (!inserted) {
      throw new Error('Inserted asset schedule not found');
    }
    return inserted;
  }

  async getAssetSchedules(
    options: {
      filter?: Filter<AssetScheduleDoc>;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{
    data: AssetScheduleDoc[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const { filter = {}, limit = 20, offset = 0 } = options;
    const cursor = this.collection.find(filter).skip(offset).limit(limit);
    const [data, total] = await Promise.all([
      cursor.toArray(),
      this.collection.countDocuments(filter),
    ]);
    return { data, total, limit, offset };
  }

  async batchGetAssetSchedulesById(
    ids: string[],
    companyId: string,
  ): Promise<(AssetScheduleDoc | null)[]> {
    const docs = await this.collection
      .find({ _id: { $in: ids }, companyId })
      .toArray();
    const docMap = new Map(docs.map((doc) => [doc._id, doc]));
    return ids.map((id) => docMap.get(id) || null);
  }
}

export const createAssetSchedulesModel = (config: {
  mongoClient: MongoClient;
}) => {
  const assetSchedulesModel = new AssetSchedulesModel(config);
  return assetSchedulesModel;
};
