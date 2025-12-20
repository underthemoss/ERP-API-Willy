import { type MongoClient, type Db, type Collection } from 'mongodb';
import {
  type ResourceMapLocation,
  type ResourceMapLocationGeometry,
} from './location-types';

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
  location?: ResourceMapLocation | null;
  location_geo?: ResourceMapLocationGeometry | null;
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

  async createResource(resource: ResourceMapResourceDoc) {
    await this.collection.insertOne(resource);
    return resource;
  }

  async updateResource(
    id: string,
    updates: Partial<ResourceMapResourceDoc>,
  ): Promise<ResourceMapResourceDoc | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      { $set: updates },
      { returnDocument: 'after' },
    );
    return result ?? null;
  }

  async findByTenantId(tenantId: string): Promise<ResourceMapResourceDoc[]> {
    return this.collection.find({ tenant_id: tenantId }).toArray();
  }

  async findByTenantIdAndTypes(
    tenantId: string,
    types: string[],
  ): Promise<ResourceMapResourceDoc[]> {
    return this.collection
      .find({ tenant_id: tenantId, type: { $in: types } })
      .toArray();
  }

  async findByTenantIdAndFilter(
    tenantId: string,
    filter: Record<string, unknown>,
  ): Promise<ResourceMapResourceDoc[]> {
    return this.collection.find({ tenant_id: tenantId, ...filter }).toArray();
  }

  async findByTenantIdAndPathContains(
    tenantId: string,
    ancestorId: string,
  ): Promise<ResourceMapResourceDoc[]> {
    return this.collection
      .find({ tenant_id: tenantId, path: ancestorId })
      .toArray();
  }

  async findById(id: string): Promise<ResourceMapResourceDoc | null> {
    return this.collection.findOne({ _id: id });
  }

  async findByIds(ids: string[]): Promise<ResourceMapResourceDoc[]> {
    if (!ids.length) return [];
    return this.collection.find({ _id: { $in: ids } }).toArray();
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

  async deleteResourcesByIds(ids: string[]): Promise<void> {
    if (!ids.length) return;
    await this.collection.deleteMany({ _id: { $in: ids } });
  }

  async bulkUpdateResources(
    updates: Array<{ id: string; update: Partial<ResourceMapResourceDoc> }>,
  ): Promise<void> {
    if (!updates.length) return;
    await this.collection.bulkWrite(
      updates.map(({ id, update }) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: update },
        },
      })),
    );
  }
}

export const createResourceMapResourcesModel = (config: {
  mongoClient: MongoClient;
}) => {
  const rmResourcesModel = new ResourceMapResourcesModel(config);
  return rmResourcesModel;
};
