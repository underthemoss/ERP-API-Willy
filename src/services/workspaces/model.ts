import { type MongoClient, type Db, type Collection } from 'mongodb';
import { v4 } from 'uuid';

type GeneratedFields = '_id' | 'documentType' | 'createdAt' | 'updatedAt';

export type WorkspaceAccessType = 'INVITE_ONLY' | 'SAME_DOMAIN';

interface WorkspaceDoc {
  _id: string;
  ownerId: string;
  companyId: number;
  name: string;
  description?: string;
  domain?: string;
  brandId?: string;
  createdBy: string;
  bannerImageUrl?: string;
  logoUrl?: string;
  accessType: WorkspaceAccessType;
  archived: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
  documentType: 'WORKSPACE';
}

// DTO's
export type Workspace = Omit<
  WorkspaceDoc,
  '_id' | 'archivedAt' | 'createdAt' | 'updatedAt'
> & {
  id: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

// input types
export type CreateWorkspaceInput = Omit<
  WorkspaceDoc,
  GeneratedFields | 'updatedAt' | 'updatedBy'
> & { _id?: string };

export type UpdateWorkspaceInput = Partial<
  Omit<WorkspaceDoc, GeneratedFields | 'createdAt' | 'createdBy'>
> & {
  updatedBy: string;
};

export class WorkspaceModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'workspaces';
  private db: Db;
  private collection: Collection<WorkspaceDoc>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<WorkspaceDoc>(this.collectionName);
  }

  mapWorkspace(workspace: WorkspaceDoc): Workspace {
    const { _id, ...fields } = workspace;
    return {
      ...fields,
      id: workspace._id,
      archivedAt: workspace.archivedAt?.toISOString(),
      createdAt: workspace.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: workspace.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  async createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
    const now = new Date();
    const _id = input._id || v4();
    const r = await this.collection.insertOne({
      ...input,
      _id,
      documentType: 'WORKSPACE',
      createdAt: now,
      updatedAt: now,
      updatedBy: input.createdBy,
    });

    const workspace = await this.collection.findOne({
      _id: r.insertedId,
    });

    if (!workspace) {
      throw new Error('workspace not found');
    }

    return this.mapWorkspace(workspace);
  }

  async getWorkspaceById(id: string): Promise<Workspace | null> {
    const workspace = await this.collection.findOne({ _id: id });
    if (!workspace) {
      return null;
    }
    return this.mapWorkspace(workspace);
  }

  async batchUpsertWorkspaces(input: CreateWorkspaceInput[]) {
    await this.collection.bulkWrite(
      input.map((item) => ({
        updateOne: {
          filter: { companyId: item.companyId },
          update: {
            $set: {
              ...item,
              documentType: 'WORKSPACE',
            },
          },
          upsert: true,
        },
      })),
    );
  }

  async listWorkspaces(
    query: Pick<WorkspaceDoc, 'companyId'>,
  ): Promise<Workspace[]> {
    return (
      await this.collection
        .find({
          companyId: query.companyId,
        })
        .toArray()
    ).map(this.mapWorkspace);
  }

  async countWorkspaces(query: Pick<WorkspaceDoc, 'companyId'>) {
    return this.collection.countDocuments(query);
  }

  async getWorkspacesByIds(
    ids: string[],
    includeArchived: boolean = false,
  ): Promise<Workspace[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    const filter: any = {
      _id: { $in: ids },
    };

    if (!includeArchived) {
      filter.archived = { $ne: true };
    }

    return (await this.collection.find(filter).toArray()).map(
      this.mapWorkspace,
    );
  }

  async countWorkspacesByIds(
    ids: string[],
    includeArchived: boolean = false,
  ): Promise<number> {
    if (!ids || ids.length === 0) {
      return 0;
    }

    const filter: any = {
      _id: { $in: ids },
    };

    if (!includeArchived) {
      filter.archived = { $ne: true };
    }

    return this.collection.countDocuments(filter);
  }

  async updateWorkspace(
    id: string,
    updates: UpdateWorkspaceInput,
  ): Promise<Workspace | null> {
    const now = new Date();

    // Separate null values (to unset) from defined values (to set)
    const setUpdates: any = { updatedAt: now };
    const unsetFields: any = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        unsetFields[key] = '';
      } else if (value !== undefined) {
        setUpdates[key] = value;
      }
    });

    const updateOperation: any = {
      $set: setUpdates,
    };

    if (Object.keys(unsetFields).length > 0) {
      updateOperation.$unset = unsetFields;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      updateOperation,
      { returnDocument: 'after' },
    );

    return result ? this.mapWorkspace(result) : null;
  }
}

export const createWorkspaceModel = (config: { mongoClient: MongoClient }) => {
  const workspaceModel = new WorkspaceModel(config);
  return workspaceModel;
};
