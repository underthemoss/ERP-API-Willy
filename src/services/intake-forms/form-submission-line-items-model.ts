import { MongoClient, Db, Collection, ClientSession } from 'mongodb';
import { generateId } from '../../lib/id-generator';

type RequestType = 'RENTAL' | 'PURCHASE';
type DeliveryMethod = 'PICKUP' | 'DELIVERY';

export interface IntakeFormSubmissionLineItemDoc {
  _id: string;
  submissionId: string;
  workspaceId: string;

  // Core fields
  startDate: Date;
  description: string;
  quantity: number;
  durationInDays: number;
  type: RequestType;

  // New fields
  pimCategoryId: string;
  priceId?: string;
  customPriceName?: string;
  deliveryMethod: DeliveryMethod;
  deliveryLocation?: string;
  deliveryNotes?: string;

  // Rental fields
  rentalStartDate?: Date;
  rentalEndDate?: Date;

  // Tracking fields
  salesOrderId?: string;
  salesOrderLineItemId?: string;

  // Pricing
  subtotalInCents: number;

  // Metadata
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  deletedAt?: Date;
}

// DTO type for external use
export type IntakeFormSubmissionLineItemDTO = Omit<
  IntakeFormSubmissionLineItemDoc,
  '_id' | 'deletedAt'
> & {
  id: string;
};

// Input type for creating line items (excludes server-managed fields)
export type IntakeFormSubmissionLineItemInput = Omit<
  IntakeFormSubmissionLineItemDoc,
  | '_id'
  | 'submissionId'
  | 'workspaceId'
  | 'subtotalInCents'
  | 'createdAt'
  | 'createdBy'
  | 'updatedAt'
  | 'updatedBy'
  | 'deletedAt'
>;

export class IntakeFormSubmissionLineItemsModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'intake_form_submission_line_items';
  private db: Db;
  private collection: Collection<IntakeFormSubmissionLineItemDoc>;
  private ID_PREFIX: string = 'IN_FRM_LI';

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<IntakeFormSubmissionLineItemDoc>(
      this.collectionName,
    );
  }

  private generateLineItemId(workspaceId: string): string {
    return generateId(this.ID_PREFIX, workspaceId);
  }

  private mapLineItemToDTO(
    lineItem: IntakeFormSubmissionLineItemDoc,
  ): IntakeFormSubmissionLineItemDTO {
    const { _id, deletedAt, ...fields } = lineItem;
    return {
      ...fields,
      id: _id,
    };
  }

  async createLineItem(
    submissionId: string,
    workspaceId: string,
    input: IntakeFormSubmissionLineItemInput,
    subtotalInCents: number,
    userId: string,
    session?: ClientSession,
  ): Promise<IntakeFormSubmissionLineItemDTO> {
    const now = new Date();
    const lineItemDoc: IntakeFormSubmissionLineItemDoc = {
      _id: this.generateLineItemId(workspaceId),
      submissionId,
      workspaceId,
      ...input,
      subtotalInCents,
      createdAt: now,
      createdBy: userId,
      updatedAt: now,
      updatedBy: userId,
    };

    await this.collection.insertOne(lineItemDoc, { session });

    const inserted = await this.collection.findOne(
      { _id: lineItemDoc._id },
      { session },
    );

    if (!inserted) {
      throw new Error('Inserted line item not found');
    }

    return this.mapLineItemToDTO(inserted);
  }

  async updateLineItem(
    id: string,
    updates: Partial<IntakeFormSubmissionLineItemInput>,
    subtotalInCents: number | undefined,
    userId: string,
    session?: ClientSession,
  ): Promise<IntakeFormSubmissionLineItemDTO | null> {
    const now = new Date();

    const updateFields: Record<string, unknown> = {
      ...updates,
      updatedAt: now,
      updatedBy: userId,
    };

    if (subtotalInCents !== undefined) {
      updateFields.subtotalInCents = subtotalInCents;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: id, deletedAt: { $exists: false } },
      {
        $set: updateFields,
      },
      { returnDocument: 'after', session },
    );

    if (!result) {
      return null;
    }

    return this.mapLineItemToDTO(result);
  }

  async deleteLineItem(
    id: string,
    userId: string,
    session?: ClientSession,
  ): Promise<boolean> {
    const now = new Date();

    const result = await this.collection.findOneAndUpdate(
      { _id: id, deletedAt: { $exists: false } },
      {
        $set: {
          deletedAt: now,
          updatedAt: now,
          updatedBy: userId,
        },
      },
      { session },
    );

    return result !== null;
  }

  async getLineItemById(
    id: string,
    session?: ClientSession,
  ): Promise<IntakeFormSubmissionLineItemDTO | null> {
    const lineItem = await this.collection.findOne(
      { _id: id, deletedAt: { $exists: false } },
      { session },
    );

    if (!lineItem) {
      return null;
    }

    return this.mapLineItemToDTO(lineItem);
  }

  async getLineItemsBySubmissionId(
    submissionId: string,
    session?: ClientSession,
  ): Promise<IntakeFormSubmissionLineItemDTO[]> {
    const lineItems = await this.collection
      .find({ submissionId, deletedAt: { $exists: false } }, { session })
      .toArray();

    return lineItems.map(this.mapLineItemToDTO);
  }

  // Helper method to delete all line items for a submission (used when deleting a submission)
  async deleteLineItemsBySubmissionId(
    submissionId: string,
    userId: string,
    session?: ClientSession,
  ): Promise<number> {
    const now = new Date();

    const result = await this.collection.updateMany(
      { submissionId, deletedAt: { $exists: false } },
      {
        $set: {
          deletedAt: now,
          updatedAt: now,
          updatedBy: userId,
        },
      },
      { session },
    );

    return result.modifiedCount;
  }

  // Get sum of all line item subtotals for a submission
  async getLineItemsSubtotalBySubmissionId(
    submissionId: string,
    session?: ClientSession,
  ): Promise<number> {
    const result = await this.collection
      .aggregate<{
        total: number;
      }>(
        [
          { $match: { submissionId, deletedAt: { $exists: false } } },
          { $group: { _id: null, total: { $sum: '$subtotalInCents' } } },
        ],
        { session },
      )
      .toArray();

    return result[0]?.total ?? 0;
  }
}

export const createIntakeFormSubmissionLineItemsModel = (config: {
  mongoClient: MongoClient;
}) => {
  return new IntakeFormSubmissionLineItemsModel(config);
};
