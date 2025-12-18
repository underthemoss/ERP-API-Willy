import {
  type MongoClient,
  type Db,
  type Collection,
  ClientSession,
} from 'mongodb';
import { generateId } from '../../lib/id-generator';

type GeneratedFields = '_id' | 'createdAt';

interface EmailDoc {
  _id: string;
  workspaceId: string;
  companyId: string;
  msgId?: string; // SendGrid message ID (optional as it's set after sending)
  to: string;
  from: string;
  subject: string;
  htmlContent?: string;
  plainContent?: string;
  replyTo?: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt?: Date;
  error?: string; // Store error message if sending failed
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

// DTO's
export type Email = Omit<EmailDoc, '_id'> & {
  id: string;
};

// Input types
export type EmailInput = Omit<EmailDoc, GeneratedFields> & {
  updatedAt?: Date;
};

// Query types
export type EmailFilters = Partial<
  Pick<
    EmailDoc,
    'workspaceId' | 'companyId' | 'msgId' | 'to' | 'from' | 'status'
  >
> & {
  sentAtFrom?: Date;
  sentAtTo?: Date;
};

export type ListEmailsQuery = {
  filter: EmailFilters;
  page?: {
    size?: number;
    number?: number;
  };
  sort?: {
    field: 'sentAt' | 'createdAt';
    order: 'asc' | 'desc';
  };
};

export class EmailModel {
  private client: MongoClient;
  private dbName: string = 'es-erp';
  private collectionName: string = 'emails';
  private db: Db;
  private collection: Collection<EmailDoc>;
  public readonly ID_PREFIX = 'EMAIL';

  constructor(config: { mongoClient: MongoClient }) {
    this.client = config.mongoClient;
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection<EmailDoc>(this.collectionName);
  }

  generateEmailId(tenantId: string): string {
    return generateId(this.ID_PREFIX, tenantId);
  }

  mapEmail(email: EmailDoc): Email {
    const { _id, ...fields } = email;
    return {
      ...fields,
      id: email._id,
    };
  }

  async createEmail(
    input: EmailInput,
    session?: ClientSession,
  ): Promise<Email> {
    const now = new Date();
    const emailDoc: EmailDoc = {
      _id: this.generateEmailId(input.companyId),
      ...input,
      createdAt: now,
      updatedAt: input.updatedAt || now,
    };

    await this.collection.insertOne(emailDoc, { session });

    return this.mapEmail(emailDoc);
  }

  async updateEmailWithSendGridResponse(
    emailId: string,
    msgId: string,
    status: 'sent' | 'failed',
    error?: string,
    session?: ClientSession,
  ): Promise<Email | null> {
    const now = new Date();
    const updateDoc: any = {
      $set: {
        msgId,
        status,
        updatedAt: now,
      },
    };

    if (status === 'sent') {
      updateDoc.$set.sentAt = now;
    }

    if (error) {
      updateDoc.$set.error = error;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: emailId },
      updateDoc,
      {
        session,
        returnDocument: 'after',
      },
    );

    return result ? this.mapEmail(result) : null;
  }

  async getEmailById(
    emailId: string,
    session?: ClientSession,
  ): Promise<Email | null> {
    const email = await this.collection.findOne({ _id: emailId }, { session });
    return email ? this.mapEmail(email) : null;
  }

  async getEmailByMsgId(
    msgId: string,
    session?: ClientSession,
  ): Promise<Email | null> {
    const email = await this.collection.findOne({ msgId }, { session });
    return email ? this.mapEmail(email) : null;
  }

  async listEmails(
    query: ListEmailsQuery,
    session?: ClientSession,
  ): Promise<Email[]> {
    const limit = query.page?.size || 50;
    const skip = query.page?.number ? (query.page.number - 1) * limit : 0;

    // Build filter
    const filter: any = { ...query.filter };

    // Handle date range filters
    if (query.filter.sentAtFrom || query.filter.sentAtTo) {
      filter.sentAt = {};
      if (query.filter.sentAtFrom) {
        filter.sentAt.$gte = query.filter.sentAtFrom;
      }
      if (query.filter.sentAtTo) {
        filter.sentAt.$lte = query.filter.sentAtTo;
      }
      delete filter.sentAtFrom;
      delete filter.sentAtTo;
    }

    // Build sort
    const sort: any = {};
    if (query.sort) {
      sort[query.sort.field] = query.sort.order === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1; // Default sort by createdAt descending
    }

    const emails = await this.collection
      .find(filter, { session })
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .toArray();

    return emails.map(this.mapEmail);
  }

  async countEmails(
    filter: EmailFilters,
    session?: ClientSession,
  ): Promise<number> {
    // Build filter
    const mongoFilter: any = { ...filter };

    // Handle date range filters
    if (filter.sentAtFrom || filter.sentAtTo) {
      mongoFilter.sentAt = {};
      if (filter.sentAtFrom) {
        mongoFilter.sentAt.$gte = filter.sentAtFrom;
      }
      if (filter.sentAtTo) {
        mongoFilter.sentAt.$lte = filter.sentAtTo;
      }
      delete mongoFilter.sentAtFrom;
      delete mongoFilter.sentAtTo;
    }

    return this.collection.countDocuments(mongoFilter, { session });
  }

  async getEmailsByIds(
    emailIds: string[],
    session?: ClientSession,
  ): Promise<Email[]> {
    const emails = await this.collection
      .find({ _id: { $in: emailIds } }, { session })
      .toArray();
    return emails.map(this.mapEmail);
  }
}

export const createEmailModel = (config: { mongoClient: MongoClient }) => {
  const emailModel = new EmailModel(config);
  return emailModel;
};
