import { type Collection, type Filter, type MongoClient } from 'mongodb';
import { generateId } from '../../lib/id-generator';

export type StudioFsNodeType = 'FILE' | 'FOLDER';

export type StudioFsNodeDoc = {
  _id: string;
  companyId: string;
  workspaceId: string;
  path: string;
  parentPath: string | null;
  name: string;
  type: StudioFsNodeType;
  content?: string | null;
  contentEncoding?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  etag: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  deleted?: boolean;
  deletedAt?: Date | null;
};

export type StudioFsNode = Omit<StudioFsNodeDoc, '_id'> & {
  id: string;
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class StudioFsModel {
  private nodes: Collection<StudioFsNodeDoc>;

  constructor(config: { mongoClient: MongoClient; dbName: string }) {
    const db = config.mongoClient.db(config.dbName);
    this.nodes = db.collection<StudioFsNodeDoc>('studio_fs_nodes');
  }

  private map(doc: StudioFsNodeDoc): StudioFsNode {
    const { _id, ...fields } = doc;
    return { ...fields, id: _id };
  }

  async findNode(params: {
    companyId: string;
    workspaceId: string;
    path: string;
    includeDeleted?: boolean;
  }) {
    const filter: Filter<StudioFsNodeDoc> = {
      companyId: params.companyId,
      workspaceId: params.workspaceId,
      path: params.path,
    };
    if (!params.includeDeleted) {
      filter.deleted = { $ne: true };
    }
    const doc = await this.nodes.findOne(filter);
    return doc ? this.map(doc) : null;
  }

  async listChildren(params: {
    companyId: string;
    workspaceId: string;
    parentPath: string | null;
  }) {
    const filter: Filter<StudioFsNodeDoc> = {
      companyId: params.companyId,
      workspaceId: params.workspaceId,
      parentPath: params.parentPath,
      deleted: { $ne: true },
    };

    const docs = await this.nodes.find(filter).sort({ name: 1 }).toArray();

    return docs.map((doc) => this.map(doc));
  }

  async listByPrefix(params: {
    companyId: string;
    workspaceId: string;
    pathPrefix: string;
  }) {
    const filter: Filter<StudioFsNodeDoc> = {
      companyId: params.companyId,
      workspaceId: params.workspaceId,
      path: { $regex: `^${escapeRegex(params.pathPrefix)}` },
      deleted: { $ne: true },
    };

    const docs = await this.nodes.find(filter).toArray();
    return docs.map((doc) => this.map(doc));
  }

  async insertNode(input: Omit<StudioFsNodeDoc, '_id'>) {
    const result = await this.nodes.insertOne({
      ...input,
      _id: generateId('SFSN', input.companyId),
    });
    const doc = await this.nodes.findOne({ _id: result.insertedId });
    if (!doc) throw new Error('Studio FS node not found after insert');
    return this.map(doc);
  }

  async updateNode(
    params: { companyId: string; workspaceId: string; path: string },
    updates: Partial<StudioFsNodeDoc>,
  ) {
    await this.nodes.updateOne(
      {
        companyId: params.companyId,
        workspaceId: params.workspaceId,
        path: params.path,
      },
      { $set: { ...updates } },
    );
    const doc = await this.nodes.findOne({
      companyId: params.companyId,
      workspaceId: params.workspaceId,
      path: params.path,
    });
    return doc ? this.map(doc) : null;
  }

  async bulkWrite(
    ops: Parameters<Collection<StudioFsNodeDoc>['bulkWrite']>[0],
  ) {
    return this.nodes.bulkWrite(ops);
  }
}

export const createStudioFsModel = (config: {
  mongoClient: MongoClient;
  dbName: string;
}) => new StudioFsModel(config);
