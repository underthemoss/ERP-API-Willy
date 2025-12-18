import { type MongoClient, type Db, type Collection } from 'mongodb';
import { generateId } from '../../lib/id-generator';
import { logger } from '../../lib/logger';

type BaseGeneratedFields = '_id' | 'createdAt' | 'updatedAt';

type SequenceNumberDoc = {
  _id: string;
  workspaceId: string;
  type: 'PO' | 'SO' | 'INVOICE';
  templateId: string; // specific for this template, otherwise its considered 'global' for this company+type
  value: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
  deleted: boolean;
};

// DTOs
export type SequenceNumber = Omit<SequenceNumberDoc, '_id'> & {
  id: string;
};

// input types
export type CreateSequenceNumberInput = Omit<
  SequenceNumberDoc,
  BaseGeneratedFields
>;

// update input type
export type UpdateSequenceNumberInput = Omit<
  SequenceNumberDoc,
  BaseGeneratedFields
>;

export type ListSequenceNumbersQuery = {
  filter: {
    workspaceId: string;
    type?: SequenceNumberDoc['type'];
    templateId?: string;
  };
  page?: {
    size?: number;
    number?: number;
  };
};

export class SequenceNumberModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'sequence_numbers';
  private db: Db;
  private collection: Collection<SequenceNumberDoc>;
  private ID_PREFIX: string;

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<SequenceNumberDoc>(
      this.collectionName,
    );
    this.ID_PREFIX = 'SN';
  }

  generateSequenceNumberId(tenantId: string): string {
    return generateId(this.ID_PREFIX, tenantId);
  }

  private mapSequenceNumber(doc: SequenceNumberDoc): SequenceNumber {
    const { _id, ...fields } = doc;
    return { ...fields, id: doc._id };
  }

  async createSequenceNumber(
    input: CreateSequenceNumberInput,
  ): Promise<SequenceNumber> {
    const now = new Date();
    const result = await this.collection.insertOne({
      ...input,
      _id: this.generateSequenceNumberId(input.workspaceId),
      createdAt: now,
      updatedAt: now,
      updatedBy: input.createdBy,
      deleted: false,
    });

    const doc = await this.collection.findOne({
      _id: result.insertedId,
    });
    if (!doc) {
      throw new Error('Sequence number not found');
    }
    return this.mapSequenceNumber(doc);
  }

  async listSequenceNumbers(
    query: ListSequenceNumbersQuery,
  ): Promise<SequenceNumber[]> {
    const { filter = {}, page } = query;
    const limit = page?.size ?? 10;
    const skip = page?.number ? (page.number - 1) * limit : 0;

    const docs = await this.collection
      .find({ ...filter, deleted: { $ne: true } }, { limit, skip })
      .toArray();
    return docs.map((doc) => this.mapSequenceNumber(doc));
  }

  async countSequenceNumbers(
    filter: ListSequenceNumbersQuery['filter'],
  ): Promise<number> {
    return this.collection.countDocuments({
      ...filter,
      deleted: { $ne: true },
    });
  }

  async deleteSequenceNumberById(id: string): Promise<void> {
    const result = await this.collection.updateOne(
      { _id: id },
      { $set: { deleted: true } },
    );
    if (result.matchedCount === 0) {
      throw new Error('Sequence number not found');
    }
  }

  async batchGetSequenceNumbersByIds(
    ids: readonly string[],
  ): Promise<Array<SequenceNumber | null>> {
    const sequenceNumbers = await this.collection
      .find({ _id: { $in: ids }, deleted: { $ne: true } })
      .toArray();

    const mappedSequenceNumbers = new Map(
      sequenceNumbers.map((sequenceNumber) => [
        String(sequenceNumber._id),
        this.mapSequenceNumber(sequenceNumber),
      ]),
    );

    return ids.map((id) => mappedSequenceNumbers.get(id) ?? null);
  }

  async getSequenceNumberById(id: string): Promise<SequenceNumber | null> {
    const doc = await this.collection.findOne({
      _id: id,
      deleted: { $ne: true },
    });
    return doc ? this.mapSequenceNumber(doc) : null;
  }

  // update sequence number by ID
  async updateSequenceNumberById(
    id: string,
    input: UpdateSequenceNumberInput,
  ): Promise<SequenceNumber> {
    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (input.value !== undefined) updateFields.value = input.value;
    if (input.templateId !== undefined) {
      updateFields.templateId = input.templateId;
    }
    if (input.updatedBy) updateFields.updatedBy = input.updatedBy;

    const result = await this.collection.findOneAndUpdate(
      { _id: id, deleted: { $ne: true } },
      { $set: updateFields },
      { returnDocument: 'after' },
    );

    if (!result) {
      throw new Error('Sequence number not found');
    }

    return this.mapSequenceNumber(result as SequenceNumberDoc);
  }

  // Get the next sequence number for a given workspace, type, and optional templateId
  async getNextSequenceNumber(opts: {
    workspaceId: string;
    type: SequenceNumberDoc['type'];
    startAt?: number;
    templateId: string;
    createdBy: string;
  }): Promise<number> {
    const { workspaceId, type, templateId, createdBy, startAt } = opts;
    const filter = {
      workspaceId,
      type,
      templateId,
      deleted: { $ne: true },
    };

    // Find the current highest sequence number
    const currentSequence = await this.collection.findOne(filter, {
      sort: { value: -1 },
    });

    logger.info({ currentSequence, filter }, 'currentSequence');

    const nextValue = currentSequence
      ? currentSequence.value + 1
      : startAt || 1;

    // Create or update the sequence number
    if (currentSequence) {
      await this.updateSequenceNumberById(currentSequence._id, {
        workspaceId,
        type,
        templateId,
        value: nextValue,
        createdBy: createdBy || currentSequence.createdBy,
        updatedBy: createdBy || currentSequence.updatedBy,
        deleted: false,
      });
    } else {
      await this.createSequenceNumber({
        workspaceId,
        type,
        templateId,
        value: nextValue,
        createdBy,
        updatedBy: createdBy,
        deleted: false,
      });
    }

    logger.info(
      { nextValue, workspaceId, type, templateId },
      'Generated next sequence number',
    );

    return nextValue;
  }

  // Get current sequence number without incrementing
  async getCurrentSequenceNumber(
    workspaceId: string,
    type: SequenceNumberDoc['type'],
    templateId: string,
  ): Promise<number> {
    const filter = {
      workspaceId,
      type,
      templateId,
      deleted: { $ne: true },
    };

    const currentSequence = await this.collection.findOne(filter, {
      sort: { value: -1 },
    });

    return currentSequence ? currentSequence.value : 0;
  }
}

export const createSequenceNumberModel = (config: {
  mongoClient: MongoClient;
}) => {
  const sequenceNumberModel = new SequenceNumberModel(config);
  return sequenceNumberModel;
};
