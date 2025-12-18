import { type MongoClient, type Db, type Collection } from 'mongodb';
import { generateId } from '../../lib/id-generator';
import { logger } from '../../lib/logger';

type BaseGeneratedFields = '_id' | 'createdAt' | 'updatedAt';

type ReferenceNumberTemplateDoc = {
  _id: string;
  workspaceId: string;
  type: 'PO' | 'SO' | 'INVOICE';
  template: string; // e.g. 'PO-{YY}-{seq}', supports: YY, YYYY, MM, DD, seq, projectCode, parentProjectCode
  seqPadding?: number; // e.g. 4 → "0001"
  startAt?: number; // default: 1
  resetFrequency: 'never' | 'yearly' | 'monthly' | 'daily';
  useGlobalSequence: boolean; // whether to share counter across all templates of same documentType
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
  // if these are set then it's specific to a business, and/or project
  businessContactId?: string;
  projectId?: string;
  deleted: boolean;
};

// DTOs
export type ReferenceNumberTemplate = Omit<
  ReferenceNumberTemplateDoc,
  '_id'
> & {
  id: string;
};

// input types
export type CreateReferenceNumberTemplateInput = Omit<
  ReferenceNumberTemplateDoc,
  BaseGeneratedFields
>;

// update input type
export type UpdateReferenceNumberTemplateInput = Omit<
  ReferenceNumberTemplateDoc,
  BaseGeneratedFields
>;

export type ListTemplatesQuery = {
  filter: {
    workspaceId: string;
    type?: ReferenceNumberTemplateDoc['type'];
    projectId?: string;
    businessContactId?: string;
  };
  page?: {
    size?: number;
    number?: number;
  };
};

export class ReferenceNumberTemplateModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'reference_number_templates';
  private db: Db;
  private collection: Collection<ReferenceNumberTemplateDoc>;
  private ID_PREFIX: string;
  private ALLOWED_INTERPOLATIONS = [
    'YY',
    'YYYY',
    'MM',
    'DD',
    'seq',
    'projectCode',
    'parentProjectCode',
  ];

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<ReferenceNumberTemplateDoc>(
      this.collectionName,
    );
    this.ID_PREFIX = 'RNT';
  }

  private validateTemplate(template: string): void {
    // Extract all interpolation variables from the template
    const interpolationRegex = /\{([^}]+)\}/g;
    const matches = template.match(interpolationRegex);

    if (matches) {
      for (const match of matches) {
        const variable = match.slice(1, -1); // Remove { and }
        if (!this.ALLOWED_INTERPOLATIONS.includes(variable)) {
          throw new Error(
            `Invalid interpolation variable '${variable}' in template. Allowed variables: ${this.ALLOWED_INTERPOLATIONS.join(', ')}`,
          );
        }
      }
    }
  }

  generateTemplateId(tenantId: string): string {
    return generateId(this.ID_PREFIX, tenantId);
  }

  private mapReferenceNumberTemplate(
    doc: ReferenceNumberTemplateDoc,
  ): ReferenceNumberTemplate {
    const { _id, ...fields } = doc;
    return { ...fields, id: doc._id };
  }

  async createReferenceNumberTemplate(
    input: CreateReferenceNumberTemplateInput,
  ): Promise<ReferenceNumberTemplate> {
    // Validate template before creating
    this.validateTemplate(input.template);

    // Validate that INVOICE templates must use global sequencing
    if (input.type === 'INVOICE' && !input.useGlobalSequence) {
      throw new Error(
        'INVOICE templates must use global sequencing (useGlobalSequence must be true)',
      );
    }

    const now = new Date();
    const result = await this.collection.insertOne({
      ...input,
      _id: this.generateTemplateId(input.workspaceId),
      createdAt: now,
      updatedAt: now,
      updatedBy: input.createdBy,
      deleted: false,
    });

    const doc = await this.collection.findOne({
      _id: result.insertedId,
    });

    logger.info(doc, 'Created reference number template');

    if (!doc) {
      throw new Error('Reference number template not found');
    }
    return this.mapReferenceNumberTemplate(doc);
  }

  async listReferenceNumberTemplates(
    query: ListTemplatesQuery,
  ): Promise<ReferenceNumberTemplate[]> {
    const { filter = {}, page } = query;
    const limit = page?.size ?? 10;
    const skip = page?.number ? (page.number - 1) * limit : 0;

    const docs = await this.collection
      .find({ ...filter, deleted: { $ne: true } }, { limit, skip })
      .toArray();
    return docs.map((doc) => this.mapReferenceNumberTemplate(doc));
  }

  async countReferenceNumberTemplates(
    filter: ListTemplatesQuery['filter'],
  ): Promise<number> {
    return this.collection.countDocuments({
      ...filter,
      deleted: { $ne: true },
    });
  }

  async deleteReferenceNumberTemplateById(id: string): Promise<void> {
    const result = await this.collection.updateOne(
      { _id: id },
      { $set: { deleted: true } },
    );
    if (result.matchedCount === 0) {
      throw new Error('Reference number template not found');
    }
  }

  async batchGetReferenceNumberTemplatesByIds(
    ids: readonly string[],
  ): Promise<Array<ReferenceNumberTemplate | null>> {
    const templates = await this.collection
      .find({ _id: { $in: ids }, deleted: { $ne: true } })
      .toArray();

    const mappedTemplates = new Map(
      templates.map((template) => [
        String(template._id),
        this.mapReferenceNumberTemplate(template),
      ]),
    );

    return ids.map((id) => mappedTemplates.get(id) ?? null);
  }

  async getReferenceNumberTemplateById(
    id: string,
  ): Promise<ReferenceNumberTemplate | null> {
    const doc = await this.collection.findOne({
      _id: id,
      deleted: { $ne: true },
    });
    return doc ? this.mapReferenceNumberTemplate(doc) : null;
  }

  // update template by ID
  async updateReferenceNumberTemplateById(
    id: string,
    input: UpdateReferenceNumberTemplateInput,
  ): Promise<ReferenceNumberTemplate> {
    // Validate template if it's being updated
    if (input.template) {
      this.validateTemplate(input.template);
    }

    // Get the existing template to check its type
    const existingTemplate = await this.getReferenceNumberTemplateById(id);
    if (!existingTemplate) {
      throw new Error('Reference number template not found');
    }

    // Validate that INVOICE templates must use global sequencing
    if (
      existingTemplate.type === 'INVOICE' &&
      input.useGlobalSequence === false
    ) {
      throw new Error(
        'INVOICE templates must use global sequencing (useGlobalSequence cannot be set to false)',
      );
    }

    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (input.template) updateFields.template = input.template;
    if (input.seqPadding) updateFields.seqPadding = input.seqPadding;
    if (input.startAt) updateFields.startAt = input.startAt;
    if (input.resetFrequency) {
      updateFields.resetFrequency = input.resetFrequency;
    }
    if (input.useGlobalSequence !== undefined) {
      updateFields.useGlobalSequence = input.useGlobalSequence;
    }
    if (input.businessContactId) {
      updateFields.businessContactId = input.businessContactId;
    }
    if (input.projectId) updateFields.projectId = input.projectId;
    if (input.updatedBy) updateFields.updatedBy = input.updatedBy;

    const result = await this.collection.findOneAndUpdate(
      { _id: id, deleted: { $ne: true } },
      { $set: updateFields },
      { returnDocument: 'after' },
    );

    if (!result) {
      throw new Error('Reference number template not found');
    }

    return this.mapReferenceNumberTemplate(
      result as ReferenceNumberTemplateDoc,
    );
  }
}

export const createReferenceNumberTemplateModel = (config: {
  mongoClient: MongoClient;
}) => {
  const referenceNumberTemplateModel = new ReferenceNumberTemplateModel(config);
  return referenceNumberTemplateModel;
};
