import { type MongoClient, type Db, type Collection } from 'mongodb';

export type ResourceMapResourceDoc = {
  _id: string;
  resource_id: string;
  parent_id: string;
  hierarchy_id: string;
  hierarchy_name: string;
  path: string[];
  tenant_id: string;
  type: string;
  value: string;
};

export type ResourceMapResourceInput = Omit<ResourceMapResourceDoc, '_id'>;

export class ResourceMapResourcesModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'resource_map_resources';
  private db: Db;
  private collection: Collection<ResourceMapResourceDoc>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<ResourceMapResourceDoc>(
      this.collectionName,
    );
  }

  async upsertResource(id: string, resource: ResourceMapResourceInput) {
    await this.collection.updateOne(
      { _id: id },
      { $set: { ...resource, _id: id } },
      { upsert: true },
    );
  }

  async findByTenantId(tenantId: string): Promise<ResourceMapResourceDoc[]> {
    return this.collection.find({ tenant_id: tenantId }).toArray();
  }

  async findById(id: string): Promise<ResourceMapResourceDoc | null> {
    return this.collection.findOne({ _id: id });
  }

  async findByParentIdAndTenantId(
    parentId: string,
    tenantId: string,
  ): Promise<ResourceMapResourceDoc[]> {
    return this.collection
      .find({ parent_id: parentId, tenant_id: tenantId })
      .toArray();
  }

  async deleteResourceById(id: string): Promise<void> {
    await this.collection.deleteOne({ _id: id });
  }
}

export const createResourceMapResourcesModel = (config: {
  mongoClient: MongoClient;
}) => {
  const rmResourcesModel = new ResourceMapResourcesModel(config);
  return rmResourcesModel;
};
