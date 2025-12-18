import {
  type MongoClient,
  type Db,
  type Collection,
  WithTransactionCallback,
  ClientSession,
} from 'mongodb';
import { generateId } from '../../lib/id-generator';

type GeneratedFields = '_id';

interface IntakeForm {
  _id: string;
  workspaceId: string;
  projectId?: string;
  pricebookId?: string;
  isPublic: boolean;
  sharedWithUserIds: string[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// DTO's
export type IntakeFormDTO = Omit<IntakeForm, '_id'> & {
  id: string;
};

// input types
export type IntakeFormInput = Omit<
  IntakeForm,
  | GeneratedFields
  | 'isDeleted'
  | 'createdAt'
  | 'createdBy'
  | 'updatedAt'
  | 'updatedBy'
>;

export class IntakeFormModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'intake_forms';
  private db: Db;
  private collection: Collection<IntakeForm>;
  private ID_PREFIX: string = 'IN_FRM';

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<IntakeForm>(this.collectionName);
  }

  withTransaction<T = any>(
    cb: WithTransactionCallback<T>,
    options?: Parameters<ClientSession['withTransaction']>[1],
  ) {
    return this.client.withSession<T>((session) => {
      return session.withTransaction<T>(cb, options);
    });
  }

  generateFormId(tenantId: string): string {
    return generateId(this.ID_PREFIX, tenantId);
  }

  mapIntakeForm(intakeForm: IntakeForm): IntakeFormDTO {
    const { _id, ...fields } = intakeForm;
    return {
      ...fields,
      id: intakeForm._id,
    };
  }

  async createIntakeForm(
    input: IntakeFormInput,
    userId: string,
    session?: ClientSession,
  ): Promise<IntakeFormDTO> {
    const now = new Date().toISOString();
    const r = await this.collection.insertOne(
      {
        _id: this.generateFormId(input.workspaceId),
        ...input,
        isDeleted: false,
        createdAt: now,
        createdBy: userId,
        updatedAt: now,
        updatedBy: userId,
      },
      { session },
    );

    const intakeForm = await this.collection.findOne(
      {
        _id: r.insertedId,
      },
      { session },
    );

    if (!intakeForm) {
      throw new Error('intakeForm not found');
    }

    return this.mapIntakeForm(intakeForm);
  }

  async listIntakeForms(
    query: Pick<IntakeForm, 'workspaceId'>,
    limit?: number,
    page?: number,
  ): Promise<IntakeFormDTO[]> {
    const pageSize = limit || 100; // Default limit to 100
    const skip = page && page > 0 ? (page - 1) * pageSize : 0;

    return (
      await this.collection
        .find({
          workspaceId: query.workspaceId,
          isDeleted: { $ne: true },
        })
        .skip(skip)
        .limit(pageSize)
        .toArray()
    ).map(this.mapIntakeForm);
  }

  async countIntakeForms(query: Pick<IntakeForm, 'workspaceId'>) {
    return this.collection.countDocuments({
      ...query,
      isDeleted: { $ne: true },
    });
  }

  async listIntakeFormsByIds(
    query: { ids: string[] },
    limit?: number,
    page?: number,
  ): Promise<IntakeFormDTO[]> {
    const pageSize = limit || 100; // Default limit to 100
    const skip = page && page > 0 ? (page - 1) * pageSize : 0;

    return (
      await this.collection
        .find({
          _id: { $in: query.ids },
          isDeleted: { $ne: true },
        })
        .skip(skip)
        .limit(pageSize)
        .toArray()
    ).map(this.mapIntakeForm);
  }

  async countIntakeFormsByIds(query: { ids: string[] }) {
    return this.collection.countDocuments({
      _id: { $in: query.ids },
      isDeleted: { $ne: true },
    });
  }

  async getIntakeFormById(id: string): Promise<IntakeFormDTO | null> {
    const intakeForm = await this.collection.findOne({ _id: id });

    if (!intakeForm) {
      return null;
    }

    return this.mapIntakeForm(intakeForm);
  }

  async setIntakeFormActive(
    id: string,
    isActive: boolean,
    updatedBy: string,
  ): Promise<IntakeFormDTO | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          isActive,
          updatedAt: new Date().toISOString(),
          updatedBy,
        },
      },
      { returnDocument: 'after' },
    );

    if (!result) {
      return null;
    }

    return this.mapIntakeForm(result);
  }

  async updateIntakeForm(
    id: string,
    update: Partial<
      Pick<
        IntakeForm,
        | 'projectId'
        | 'pricebookId'
        | 'isPublic'
        | 'sharedWithUserIds'
        | 'isActive'
      >
    >,
    updatedBy: string,
    session?: ClientSession,
  ): Promise<IntakeFormDTO | null> {
    // First get the existing form to preserve all fields
    const existingForm = await this.collection.findOne(
      { _id: id },
      { session },
    );
    if (!existingForm) {
      return null;
    }

    const updateDoc: any = {
      $set: {
        updatedAt: new Date().toISOString(),
        updatedBy,
      },
    };

    // Handle each field update
    if ('projectId' in update) {
      if (update.projectId === null || update.projectId === undefined) {
        updateDoc.$unset = updateDoc.$unset || {};
        updateDoc.$unset.projectId = '';
      } else {
        updateDoc.$set.projectId = update.projectId;
      }
    }

    if ('pricebookId' in update) {
      if (update.pricebookId === null || update.pricebookId === undefined) {
        updateDoc.$unset = updateDoc.$unset || {};
        updateDoc.$unset.pricebookId = '';
      } else {
        updateDoc.$set.pricebookId = update.pricebookId;
      }
    }

    if ('isPublic' in update) {
      updateDoc.$set.isPublic = update.isPublic;
    }

    if ('sharedWithUserIds' in update) {
      updateDoc.$set.sharedWithUserIds = update.sharedWithUserIds;
    }

    if ('isActive' in update) {
      updateDoc.$set.isActive = update.isActive;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      updateDoc,
      { returnDocument: 'after', session },
    );

    if (!result) {
      return null;
    }

    // Ensure all required fields are present (they might be undefined if not updated)
    const finalForm: IntakeForm = {
      ...result,
      isPublic: result.isPublic ?? existingForm.isPublic ?? false,
      sharedWithUserIds:
        result.sharedWithUserIds ?? existingForm.sharedWithUserIds ?? [],
      isActive: result.isActive ?? existingForm.isActive ?? true,
    };

    return this.mapIntakeForm(finalForm);
  }

  async deleteIntakeForm(
    id: string,
    updatedBy: string,
    session?: ClientSession,
  ): Promise<IntakeFormDTO | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          isDeleted: true,
          updatedAt: new Date().toISOString(),
          updatedBy,
        },
      },
      { returnDocument: 'after', session },
    );

    if (!result) {
      return null;
    }

    return this.mapIntakeForm(result);
  }

  async getPublicFormIdsByIds(ids: string[]): Promise<string[]> {
    // Get only public, active, non-deleted forms from the provided IDs
    const publicForms = await this.collection
      .find({
        _id: { $in: ids },
        isPublic: true,
        isActive: true,
        isDeleted: { $ne: true },
      })
      .project({ _id: 1 })
      .toArray();

    return publicForms.map((form) => form._id);
  }

  async getAllPublicFormIds(): Promise<string[]> {
    // Get all public, active, non-deleted forms
    const publicForms = await this.collection
      .find({
        isPublic: true,
        isActive: true,
        isDeleted: { $ne: true },
      })
      .project({ _id: 1 })
      .toArray();

    return publicForms.map((form) => form._id);
  }
}

export const createIntakeFormModel = (config: { mongoClient: MongoClient }) => {
  const intakeFormModel = new IntakeFormModel(config);
  return intakeFormModel;
};
