import { type MongoClient, type Db, type Collection } from 'mongodb';
import { generateId } from '../../lib/id-generator';

// --- Type Definitions ---

export type WorkflowConfigurationDoc = {
  _id: string;
  companyId: string;
  name: string;
  columns: WorkflowColumn[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  deletedAt?: Date;
  deletedBy?: string;
};

export type WorkflowColumn = {
  id: string;
  name: string;
  /**
   * Optional colour for the column in #RRGGBB format.
   */
  colour?: string | null;
};

// DTOs
export type WorkflowConfiguration = Omit<WorkflowConfigurationDoc, '_id'> & {
  id: string;
};
export type CreateWorkflowConfigurationInput = Omit<
  WorkflowConfigurationDoc,
  '_id' | 'createdAt' | 'updatedAt'
>;
export type UpdateWorkflowConfigurationInput = Partial<
  Omit<WorkflowConfigurationDoc, '_id' | 'createdAt' | 'createdBy'>
>;

export type ListWorkflowConfigurationsQuery = {
  filter?: Partial<
    Pick<WorkflowConfigurationDoc, 'companyId' | 'name' | 'createdBy'>
  >;
  page?: {
    size?: number;
    number?: number;
  };
};

// --- Model Class ---

export class WorkflowConfigurationModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'workflow_configuration';
  private db: Db;
  private collection: Collection<WorkflowConfigurationDoc>;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<WorkflowConfigurationDoc>(
      this.collectionName,
    );
  }

  private map(doc: WorkflowConfigurationDoc): WorkflowConfiguration {
    const { _id, ...fields } = doc;
    return {
      ...fields,
      id: _id,
    };
  }

  async createWorkflowConfiguration(
    input: CreateWorkflowConfigurationInput,
  ): Promise<WorkflowConfiguration> {
    const now = new Date();
    const _id = generateId('WFC', input.companyId);
    const doc: WorkflowConfigurationDoc = {
      ...input,
      _id,
      createdAt: now,
      updatedAt: now,
    };
    await this.collection.insertOne(doc);
    return this.map(doc);
  }

  async updateWorkflowConfiguration(
    id: string,
    input: UpdateWorkflowConfigurationInput,
    updatedBy: string,
  ): Promise<WorkflowConfiguration> {
    const now = new Date();
    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          ...input,
          updatedAt: now,
          updatedBy,
        },
      },
      { returnDocument: 'after' },
    );
    if (!result) {
      throw new Error('WorkflowConfiguration not found');
    }
    return this.map(result as WorkflowConfigurationDoc);
  }

  async getWorkflowConfigurationById(
    id: string,
  ): Promise<WorkflowConfiguration | null> {
    const doc = await this.collection.findOne({
      _id: id,
      deletedAt: { $exists: false },
    });
    return doc ? this.map(doc) : null;
  }

  async deleteWorkflowConfigurationById(id: string, deletedBy: string) {
    const now = new Date();
    const result = await this.collection.updateOne(
      { _id: id, deletedAt: { $exists: false } },
      { $set: { deletedAt: now, deletedBy } },
    );
    if (result.matchedCount === 0) {
      return null;
    }
  }

  async listWorkflowConfigurations(
    query: ListWorkflowConfigurationsQuery = {},
  ) {
    const { filter = {}, page } = query;
    const limit = page?.size || 10;
    const skip = page?.number ? (page.number - 1) * limit : 0;
    const mongoFilter = { ...filter, deletedAt: { $exists: false } };
    const docs = await this.collection
      .find(mongoFilter, { limit, skip })
      .toArray();
    return docs.map((doc) => this.map(doc));
  }
}

export const createWorkflowConfigurationModel = (config: {
  mongoClient: MongoClient;
}) => {
  return new WorkflowConfigurationModel(config);
};
