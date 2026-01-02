import { type Collection, type MongoClient, type Filter } from 'mongodb';
import { generateId } from '../../lib/id-generator';

export type StudioConversationRole = 'system' | 'user' | 'assistant' | 'tool';

export type StudioConversationMessageDoc = {
  _id: string;
  companyId: string;
  conversationId: string;
  role: StudioConversationRole;
  content: string;
  createdAt: Date;
  createdBy?: string;
  metadata?: Record<string, unknown> | null;
};

export type StudioConversationMessage = Omit<
  StudioConversationMessageDoc,
  '_id'
> & {
  id: string;
};

export type StudioConversationDoc = {
  _id: string;
  companyId: string;
  workspaceId: string;
  title?: string | null;
  titleLower?: string | null;
  pinnedCatalogPath?: string | null;
  workingSet?: Record<string, unknown> | null;
  messageCount: number;
  lastMessageAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  deleted?: boolean;
  deletedAt?: Date | null;
};

export type StudioConversation = Omit<StudioConversationDoc, '_id'> & {
  id: string;
};

export type ListStudioConversationsQuery = {
  filter: {
    workspaceId: string;
    searchTerm?: string;
    includeDeleted?: boolean;
  };
  page?: {
    number?: number;
    size?: number;
  };
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSearchFilter = (searchTerm: string | undefined) => {
  if (!searchTerm) return undefined;
  const query = searchTerm.trim().toLowerCase();
  if (!query) return undefined;
  const regex = { $regex: `^${escapeRegex(query)}` };
  return { titleLower: regex };
};

export class StudioConversationsModel {
  private conversations: Collection<StudioConversationDoc>;
  private messages: Collection<StudioConversationMessageDoc>;

  constructor(config: { mongoClient: MongoClient; dbName: string }) {
    const db = config.mongoClient.db(config.dbName);
    this.conversations = db.collection<StudioConversationDoc>(
      'studio_conversations',
    );
    this.messages = db.collection<StudioConversationMessageDoc>(
      'studio_conversation_messages',
    );
  }

  private map(doc: StudioConversationDoc): StudioConversation {
    const { _id, ...fields } = doc;
    return { ...fields, id: _id };
  }

  private mapMessage(
    doc: StudioConversationMessageDoc,
  ): StudioConversationMessage {
    const { _id, ...fields } = doc;
    return { ...fields, id: _id };
  }

  async createConversation(input: Omit<StudioConversationDoc, '_id'>) {
    const result = await this.conversations.insertOne({
      ...input,
      _id: generateId('SCONV', input.companyId),
    });
    const doc = await this.conversations.findOne({ _id: result.insertedId });
    if (!doc) throw new Error('Studio conversation not found after insert');
    return this.map(doc);
  }

  async getConversationById(
    companyId: string,
    id: string,
    options?: { includeDeleted?: boolean },
  ) {
    const filter: Filter<StudioConversationDoc> = { _id: id, companyId };
    if (!options?.includeDeleted) {
      filter.deleted = { $ne: true };
    }
    const doc = await this.conversations.findOne(filter);
    return doc ? this.map(doc) : null;
  }

  async updateConversation(
    companyId: string,
    id: string,
    updates: Partial<StudioConversationDoc>,
  ) {
    await this.conversations.updateOne(
      { _id: id, companyId },
      { $set: { ...updates } },
    );
    const doc = await this.conversations.findOne({ _id: id, companyId });
    return doc ? this.map(doc) : null;
  }

  async createMessage(input: Omit<StudioConversationMessageDoc, '_id'>) {
    const result = await this.messages.insertOne({
      ...input,
      _id: generateId('SCMSG', input.companyId),
    });
    const doc = await this.messages.findOne({ _id: result.insertedId });
    if (!doc) {
      throw new Error('Studio conversation message not found after insert');
    }
    return this.mapMessage(doc);
  }

  async incrementMessageStats(params: {
    companyId: string;
    conversationId: string;
    updatedBy: string;
    at: Date;
  }) {
    const result = await this.conversations.updateOne(
      {
        _id: params.conversationId,
        companyId: params.companyId,
        deleted: { $ne: true },
      },
      {
        $inc: { messageCount: 1 },
        $set: {
          lastMessageAt: params.at,
          updatedAt: params.at,
          updatedBy: params.updatedBy,
        },
      },
    );
    return result.matchedCount > 0;
  }

  async listMessages(params: {
    companyId: string;
    conversationId: string;
    page?: {
      number?: number;
      size?: number;
    };
  }) {
    const pageNumber = params.page?.number ?? 1;
    const pageSize = params.page?.size ?? 50;
    const skip = (pageNumber - 1) * pageSize;

    const filter: Filter<StudioConversationMessageDoc> = {
      companyId: params.companyId,
      conversationId: params.conversationId,
    };

    const [items, totalItems] = await Promise.all([
      this.messages
        .find(filter)
        .sort({ createdAt: 1, _id: 1 })
        .skip(skip)
        .limit(pageSize)
        .toArray(),
      this.messages.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      items: items.map((doc) => this.mapMessage(doc)),
      page: {
        number: pageNumber,
        size: pageSize,
        totalItems,
        totalPages,
      },
    };
  }

  async listConversations(
    companyId: string,
    query: ListStudioConversationsQuery,
  ) {
    const pageNumber = query.page?.number ?? 1;
    const pageSize = query.page?.size ?? 50;
    const skip = (pageNumber - 1) * pageSize;

    const includeDeleted = query.filter.includeDeleted ?? false;
    const deletedFilter = includeDeleted ? {} : { deleted: { $ne: true } };

    const searchFilter = buildSearchFilter(query.filter.searchTerm);

    const filter: Filter<StudioConversationDoc> = {
      companyId,
      workspaceId: query.filter.workspaceId,
      ...deletedFilter,
      ...(searchFilter ?? {}),
    };

    const [items, totalItems] = await Promise.all([
      this.conversations
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .toArray(),
      this.conversations.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      items: items.map((doc) => this.map(doc)),
      page: {
        number: pageNumber,
        size: pageSize,
        totalItems,
        totalPages,
      },
    };
  }
}

export const createStudioConversationsModel = (config: {
  mongoClient: MongoClient;
  dbName: string;
}) => new StudioConversationsModel(config);
