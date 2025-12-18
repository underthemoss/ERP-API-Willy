import {
  type MongoClient,
  type Db,
  type Collection,
  WithTransactionCallback,
  ClientSession,
} from 'mongodb';
import { generateId } from '../../lib/id-generator';

type GeneratedFields = '_id';

export type IntakeFormSubmissionStatus = 'DRAFT' | 'SUBMITTED';

interface IntakeFormSubmission {
  _id: string;
  userId?: string;
  formId: string;
  workspaceId: string;

  // Buyer workspace (for on-platform buyers)
  buyerWorkspaceId?: string;

  name?: string;
  email?: string;
  createdAt: string;
  phone?: string;
  companyName?: string;
  purchaseOrderNumber?: string;

  // Order references
  salesOrderId?: string;
  purchaseOrderId?: string;

  // Status field - defaults to DRAFT
  status: IntakeFormSubmissionStatus;
  submittedAt?: string; // Timestamp when status changed to SUBMITTED

  // Pricing
  totalInCents: number; // Sum of all line item subtotals

  // Line items are now stored in a separate collection
  // and referenced via submission_id foreign key
}

// DTO's
export type IntakeFormSubmissionDTO = Omit<IntakeFormSubmission, '_id'> & {
  id: string;
};

// input types (excludes server-managed fields)
export type IntakeFormSubmissionInput = Omit<
  IntakeFormSubmission,
  GeneratedFields | 'status' | 'submittedAt' | 'totalInCents'
>;

export class IntakeFormSubmissionModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'intake_form_submissions';
  private db: Db;
  private collection: Collection<IntakeFormSubmission>;
  private ID_PREFIX: string = 'IN_FRM_SUB';

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<IntakeFormSubmission>(
      this.collectionName,
    );
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

  mapIntakeFormSubmission(
    intakeFormSubmission: IntakeFormSubmission,
  ): IntakeFormSubmissionDTO {
    const { _id, ...fields } = intakeFormSubmission;
    return {
      ...fields,
      id: intakeFormSubmission._id,
    };
  }

  async createIntakeFormSubmission(
    input: IntakeFormSubmissionInput,
    session?: ClientSession,
  ): Promise<IntakeFormSubmissionDTO> {
    const r = await this.collection.insertOne(
      {
        _id: this.generateFormId(input.workspaceId),
        ...input,
        status: 'DRAFT' as IntakeFormSubmissionStatus, // Default to DRAFT
        totalInCents: 0, // Initialize with 0, will be updated when line items are added
      },
      { session },
    );

    const submission = await this.collection.findOne(
      {
        _id: r.insertedId,
      },
      { session },
    );

    if (!submission) {
      throw new Error('submission not found');
    }

    return this.mapIntakeFormSubmission(submission);
  }

  async submitIntakeFormSubmission(
    id: string,
    session?: ClientSession,
  ): Promise<IntakeFormSubmissionDTO | null> {
    const submission = await this.collection.findOneAndUpdate(
      {
        _id: id,
        status: 'DRAFT', // Can only submit if currently in DRAFT status
      },
      {
        $set: {
          status: 'SUBMITTED' as IntakeFormSubmissionStatus,
          submittedAt: new Date().toISOString(),
        },
      },
      { returnDocument: 'after', session },
    );

    if (!submission) {
      return null;
    }

    return this.mapIntakeFormSubmission(submission);
  }

  async updateIntakeFormSubmission(
    id: string,
    update: {
      userId?: string | null;
      purchaseOrderNumber?: string | null;
      salesOrderId?: string | null;
      purchaseOrderId?: string | null;
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      companyName?: string | null;
      buyerWorkspaceId?: string | null;
    },
    session?: ClientSession,
  ): Promise<IntakeFormSubmissionDTO | null> {
    // Separate fields to set and unset
    const $set: any = {};
    const $unset: any = {};

    // Check each field and decide whether to set or unset
    if ('userId' in update) {
      if (update.userId === undefined || update.userId === null) {
        $unset.userId = '';
      } else {
        $set.userId = update.userId;
      }
    }

    if ('purchaseOrderNumber' in update) {
      if (
        update.purchaseOrderNumber === undefined ||
        update.purchaseOrderNumber === null
      ) {
        $unset.purchaseOrderNumber = '';
      } else {
        $set.purchaseOrderNumber = update.purchaseOrderNumber;
      }
    }

    if ('salesOrderId' in update) {
      if (update.salesOrderId === undefined || update.salesOrderId === null) {
        $unset.salesOrderId = '';
      } else {
        $set.salesOrderId = update.salesOrderId;
      }
    }

    if ('purchaseOrderId' in update) {
      if (
        update.purchaseOrderId === undefined ||
        update.purchaseOrderId === null
      ) {
        $unset.purchaseOrderId = '';
      } else {
        $set.purchaseOrderId = update.purchaseOrderId;
      }
    }

    if ('name' in update) {
      if (update.name === undefined || update.name === null) {
        $unset.name = '';
      } else {
        $set.name = update.name;
      }
    }

    if ('email' in update) {
      if (update.email === undefined || update.email === null) {
        $unset.email = '';
      } else {
        $set.email = update.email;
      }
    }

    if ('phone' in update) {
      if (update.phone === undefined || update.phone === null) {
        $unset.phone = '';
      } else {
        $set.phone = update.phone;
      }
    }

    if ('companyName' in update) {
      if (update.companyName === undefined || update.companyName === null) {
        $unset.companyName = '';
      } else {
        $set.companyName = update.companyName;
      }
    }

    if ('buyerWorkspaceId' in update) {
      if (
        update.buyerWorkspaceId === undefined ||
        update.buyerWorkspaceId === null
      ) {
        $unset.buyerWorkspaceId = '';
      } else {
        $set.buyerWorkspaceId = update.buyerWorkspaceId;
      }
    }

    // Build the update operation
    const updateOp: any = {};
    if (Object.keys($set).length > 0) {
      updateOp.$set = $set;
    }
    if (Object.keys($unset).length > 0) {
      updateOp.$unset = $unset;
    }

    // If no updates, return early
    if (Object.keys(updateOp).length === 0) {
      const existing = await this.collection.findOne({ _id: id }, { session });
      return existing ? this.mapIntakeFormSubmission(existing) : null;
    }

    const submission = await this.collection.findOneAndUpdate(
      { _id: id },
      updateOp,
      { returnDocument: 'after', session },
    );

    if (!submission) {
      return null;
    }

    return this.mapIntakeFormSubmission(submission);
  }

  async updateSubmissionTotal(
    id: string,
    totalInCents: number,
    session?: ClientSession,
  ): Promise<IntakeFormSubmissionDTO | null> {
    const submission = await this.collection.findOneAndUpdate(
      { _id: id },
      { $set: { totalInCents } },
      { returnDocument: 'after', session },
    );

    if (!submission) {
      return null;
    }

    return this.mapIntakeFormSubmission(submission);
  }

  async listIntakeFormSubmissions(
    query: Pick<IntakeFormSubmission, 'workspaceId'> & {
      intakeFormId?: string;
      excludeWithSalesOrder?: boolean;
    },
    limit?: number,
    page?: number,
  ): Promise<IntakeFormSubmissionDTO[]> {
    const pageSize = limit || 100; // Default limit to 100
    const skip = page && page > 0 ? (page - 1) * pageSize : 0;

    const filter: any = {
      workspaceId: query.workspaceId,
    };

    // Add filter for specific intake form if provided
    if (query.intakeFormId) {
      filter.formId = query.intakeFormId;
    }

    // Add filter to exclude submissions with salesOrderId if requested
    if (query.excludeWithSalesOrder) {
      filter.$or = [
        { salesOrderId: { $exists: false } },
        { salesOrderId: null },
      ];
    }

    return (
      await this.collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .toArray()
    ).map(this.mapIntakeFormSubmission);
  }

  async countIntakeFormSubmissions(
    query: Pick<IntakeFormSubmission, 'workspaceId'> & {
      intakeFormId?: string;
      excludeWithSalesOrder?: boolean;
    },
  ) {
    const filter: any = {
      workspaceId: query.workspaceId,
    };

    // Add filter for specific intake form if provided
    if (query.intakeFormId) {
      filter.formId = query.intakeFormId;
    }

    // Add filter to exclude submissions with salesOrderId if requested
    if (query.excludeWithSalesOrder) {
      filter.$or = [
        { salesOrderId: { $exists: false } },
        { salesOrderId: null },
      ];
    }

    return this.collection.countDocuments(filter);
  }

  async getIntakeFormSubmissionById(
    id: string,
    session?: ClientSession,
  ): Promise<IntakeFormSubmissionDTO | null> {
    const submission = await this.collection.findOne({ _id: id }, { session });
    if (!submission) {
      return null;
    }
    return this.mapIntakeFormSubmission(submission);
  }

  async getIntakeFormSubmissionBySalesOrderId(
    salesOrderId: string,
  ): Promise<IntakeFormSubmissionDTO | null> {
    const submission = await this.collection.findOne({ salesOrderId });
    if (!submission) {
      return null;
    }
    return this.mapIntakeFormSubmission(submission);
  }

  async getIntakeFormSubmissionByPurchaseOrderId(
    purchaseOrderId: string,
  ): Promise<IntakeFormSubmissionDTO | null> {
    const submission = await this.collection.findOne({ purchaseOrderId });
    if (!submission) {
      return null;
    }
    return this.mapIntakeFormSubmission(submission);
  }

  async getDistinctFormIdsByUserId(userId: string): Promise<string[]> {
    // Get distinct formIds where the user has created submissions
    // Using distinct is efficient with the existing formId index
    const formIds = await this.collection.distinct('formId', {
      userId,
    });
    return formIds;
  }

  async listIntakeFormSubmissionsByBuyerWorkspace(
    buyerWorkspaceId: string,
    limit?: number,
    page?: number,
    intakeFormId?: string,
  ): Promise<IntakeFormSubmissionDTO[]> {
    const pageSize = limit || 100;
    const skip = page && page > 0 ? (page - 1) * pageSize : 0;

    const filter: Record<string, unknown> = { buyerWorkspaceId };
    if (intakeFormId) {
      filter.formId = intakeFormId;
    }

    return (
      await this.collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .toArray()
    ).map(this.mapIntakeFormSubmission);
  }

  async countIntakeFormSubmissionsByBuyerWorkspace(
    buyerWorkspaceId: string,
    intakeFormId?: string,
  ): Promise<number> {
    const filter: Record<string, unknown> = { buyerWorkspaceId };
    if (intakeFormId) {
      filter.formId = intakeFormId;
    }
    return this.collection.countDocuments(filter);
  }

  async findOrphanedSubmissionsByUserId(
    userId: string,
    session?: ClientSession,
  ): Promise<IntakeFormSubmissionDTO[]> {
    const filter: Record<string, unknown> = {
      userId,
      $or: [
        { buyerWorkspaceId: { $exists: false } },
        { buyerWorkspaceId: null },
      ],
    };

    const submissions = await this.collection
      .find(filter, { session })
      .toArray();

    return submissions.map(this.mapIntakeFormSubmission);
  }

  async bulkSetBuyerWorkspaceId(
    submissionIds: string[],
    buyerWorkspaceId: string,
    session?: ClientSession,
  ): Promise<number> {
    if (submissionIds.length === 0) return 0;

    const result = await this.collection.updateMany(
      { _id: { $in: submissionIds } },
      { $set: { buyerWorkspaceId } },
      { session },
    );

    return result.modifiedCount;
  }
}

export const createIntakeFormSubmissionModel = (config: {
  mongoClient: MongoClient;
}) => {
  const intakeFormSubmissionModel = new IntakeFormSubmissionModel(config);
  return intakeFormSubmissionModel;
};
