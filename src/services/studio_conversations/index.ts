import { type MongoClient } from 'mongodb';
import { type UserAuthPayload } from '../../authentication';
import { AuthZ, ERP_WORKSPACE_SUBJECT_PERMISSIONS } from '../../lib/authz';
import { logger } from '../../lib/logger';
import { StudioFsError, type StudioFsService } from '../studio_fs';
import {
  createStudioConversationsModel,
  type StudioConversation,
  type StudioConversationMessage,
  type StudioConversationRole,
  type ListStudioConversationsQuery,
  type StudioConversationDoc,
  type StudioConversationsModel,
} from './model';

export type {
  StudioConversation,
  StudioConversationMessage,
  StudioConversationRole,
};

type StudioConversationWorkingSet = {
  activeFile?: string | null;
  openFiles?: string[];
  selectedFolder?: string | null;
};

type StudioConversationSnapshot = {
  schemaVersion: string;
  exportedAt: string;
  conversation: {
    id: string;
    workspaceId: string;
    title: string | null;
    pinnedCatalogPath: string | null;
    workingSet: Record<string, unknown> | null;
    messageCount: number;
    lastMessageAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    deleted: boolean;
    deletedAt: Date | null;
  };
  messages: Array<{
    id: string;
    role: StudioConversationRole;
    content: string;
    createdAt: Date;
    createdBy?: string;
    metadata?: Record<string, unknown> | null;
  }>;
};

const normalizeTitle = (title: string | null | undefined) => {
  const normalizedTitle = title ?? null;
  const trimmed = normalizedTitle?.trim();
  return {
    title: normalizedTitle,
    titleLower: trimmed ? trimmed.toLowerCase() : null,
  };
};

const sanitizeWorkingSet = (workingSet: Record<string, unknown>) => {
  if (typeof workingSet !== 'object' || Array.isArray(workingSet)) {
    throw new Error('workingSet must be an object');
  }

  const sanitized: StudioConversationWorkingSet = {};

  if ('activeFile' in workingSet) {
    const value = workingSet.activeFile;
    if (value !== null && typeof value !== 'string') {
      throw new Error('workingSet.activeFile must be a string or null');
    }
    sanitized.activeFile = value as string | null;
  }

  if ('openFiles' in workingSet) {
    const value = workingSet.openFiles;
    if (
      !Array.isArray(value) ||
      value.some((entry) => typeof entry !== 'string')
    ) {
      throw new Error('workingSet.openFiles must be an array of strings');
    }
    sanitized.openFiles = value as string[];
  }

  if ('selectedFolder' in workingSet) {
    const value = workingSet.selectedFolder;
    if (value !== null && typeof value !== 'string') {
      throw new Error('workingSet.selectedFolder must be a string or null');
    }
    sanitized.selectedFolder = value as string | null;
  }

  return sanitized;
};

const normalizeWorkingSetForCreate = (
  workingSet: Record<string, unknown> | null | undefined,
) => {
  if (workingSet == null) return null;
  const sanitized = sanitizeWorkingSet(workingSet);
  return Object.keys(sanitized).length === 0 ? null : sanitized;
};

const normalizeWorkingSetForUpdate = (
  workingSet: Record<string, unknown> | null | undefined,
  existing: Record<string, unknown> | null | undefined,
) => {
  if (workingSet == null) return existing ?? null;
  const sanitized = sanitizeWorkingSet(workingSet);
  return Object.keys(sanitized).length === 0 ? (existing ?? null) : sanitized;
};

export class StudioConversationsService {
  private model: StudioConversationsModel;
  private authz: AuthZ;
  private studioFsService: StudioFsService;

  constructor(config: {
    model: StudioConversationsModel;
    authz: AuthZ;
    studioFsService: StudioFsService;
  }) {
    this.model = config.model;
    this.authz = config.authz;
    this.studioFsService = config.studioFsService;
  }

  private async assertWorkspaceAccess(
    workspaceId: string,
    user: UserAuthPayload,
  ) {
    const hasAccess = await this.authz.workspace.hasPermission({
      resourceId: workspaceId,
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
      subjectId: user.id,
    });
    if (!hasAccess) {
      throw new Error('Unauthorized to access this workspace');
    }
  }

  private async canWriteConversationSnapshots(
    workspaceId: string,
    user: UserAuthPayload,
  ) {
    return this.authz.workspace.hasPermission({
      resourceId: workspaceId,
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_FILES,
      subjectId: user.id,
    });
  }

  private async listAllMessages(params: {
    companyId: string;
    conversationId: string;
  }) {
    const items: StudioConversationMessage[] = [];
    const pageSize = 250;
    let pageNumber = 1;

    while (true) {
      const page = await this.model.listMessages({
        companyId: params.companyId,
        conversationId: params.conversationId,
        page: { number: pageNumber, size: pageSize },
      });
      items.push(...page.items);
      if (page.page.number >= page.page.totalPages) break;
      pageNumber += 1;
    }

    return items;
  }

  private async syncConversationSnapshot(
    conversation: StudioConversation,
    user: UserAuthPayload,
  ) {
    const canWrite = await this.canWriteConversationSnapshots(
      conversation.workspaceId,
      user,
    );
    if (!canWrite) return;

    try {
      const messages = await this.listAllMessages({
        companyId: user.companyId,
        conversationId: conversation.id,
      });

      const snapshot: StudioConversationSnapshot = {
        schemaVersion: '1.0',
        exportedAt: new Date().toISOString(),
        conversation: {
          id: conversation.id,
          workspaceId: conversation.workspaceId,
          title: conversation.title ?? null,
          pinnedCatalogPath: conversation.pinnedCatalogPath ?? null,
          workingSet:
            (conversation.workingSet as Record<string, unknown>) ?? null,
          messageCount: conversation.messageCount,
          lastMessageAt: conversation.lastMessageAt ?? null,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          createdBy: conversation.createdBy,
          updatedBy: conversation.updatedBy,
          deleted: conversation.deleted ?? false,
          deletedAt: conversation.deletedAt ?? null,
        },
        messages: messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt,
          createdBy: message.createdBy,
          metadata: message.metadata ?? null,
        })),
      };

      const snapshotPath = `/conversations/${conversation.id}.json`;
      let expectedEtag: string | undefined;

      try {
        const existing = await this.studioFsService.read(
          { workspaceId: conversation.workspaceId, path: snapshotPath },
          user,
        );
        expectedEtag = existing.etag;
      } catch (error) {
        if (
          error instanceof StudioFsError &&
          error.code === 'STUDIO_FS_NOT_FOUND'
        ) {
          expectedEtag = undefined;
        } else {
          throw error;
        }
      }

      await this.studioFsService.write(
        {
          workspaceId: conversation.workspaceId,
          path: snapshotPath,
          content: JSON.stringify(snapshot, null, 2),
          mimeType: 'application/json',
          expectedEtag,
        },
        user,
      );
    } catch (error) {
      logger.warn(
        {
          err: error,
          conversationId: conversation.id,
        },
        'Failed to sync studio conversation snapshot',
      );
    }
  }

  async createConversation(
    input: {
      workspaceId: string;
      title?: string | null;
      pinnedCatalogPath?: string | null;
      workingSet?: Record<string, unknown> | null;
    },
    user?: UserAuthPayload,
  ): Promise<StudioConversation> {
    if (!user) {
      throw new Error('User not authenticated');
    }
    await this.assertWorkspaceAccess(input.workspaceId, user);

    const now = new Date();
    const titleFields = normalizeTitle(input.title);
    const doc: Omit<StudioConversationDoc, '_id'> = {
      companyId: user.companyId,
      workspaceId: input.workspaceId,
      title: titleFields.title,
      titleLower: titleFields.titleLower,
      pinnedCatalogPath: input.pinnedCatalogPath ?? null,
      workingSet: normalizeWorkingSetForCreate(input.workingSet),
      messageCount: 0,
      lastMessageAt: null,
      createdAt: now,
      updatedAt: now,
      createdBy: user.id,
      updatedBy: user.id,
      deleted: false,
      deletedAt: null,
    };

    const created = await this.model.createConversation(doc);
    await this.syncConversationSnapshot(created, user);
    return created;
  }

  async getConversationById(
    id: string,
    user?: UserAuthPayload,
    options?: { includeDeleted?: boolean },
  ): Promise<StudioConversation | null> {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const conversation = await this.model.getConversationById(
      user.companyId,
      id,
      options,
    );
    if (!conversation) return null;
    await this.assertWorkspaceAccess(conversation.workspaceId, user);
    return conversation;
  }

  async listConversations(
    query: ListStudioConversationsQuery,
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }
    await this.assertWorkspaceAccess(query.filter.workspaceId, user);
    return this.model.listConversations(user.companyId, query);
  }

  async updateConversation(
    id: string,
    input: {
      title?: string | null;
      pinnedCatalogPath?: string | null;
      workingSet?: Record<string, unknown> | null;
    },
    user?: UserAuthPayload,
  ): Promise<StudioConversation> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const existing = await this.model.getConversationById(user.companyId, id);
    if (!existing) {
      throw new Error('Conversation not found');
    }
    await this.assertWorkspaceAccess(existing.workspaceId, user);

    const titleFields = normalizeTitle(input.title ?? existing.title ?? null);
    const workingSet = normalizeWorkingSetForUpdate(
      input.workingSet,
      existing.workingSet ?? null,
    );

    const updated = await this.model.updateConversation(user.companyId, id, {
      title: titleFields.title,
      titleLower: titleFields.titleLower,
      pinnedCatalogPath:
        input.pinnedCatalogPath ?? existing.pinnedCatalogPath ?? null,
      workingSet,
      updatedAt: new Date(),
      updatedBy: user.id,
    });

    if (!updated) {
      throw new Error('Conversation not found');
    }
    await this.syncConversationSnapshot(updated, user);
    return updated;
  }

  async addMessage(
    params: {
      conversationId: string;
      role: StudioConversationRole;
      content: string;
      metadata?: Record<string, unknown> | null;
    },
    user?: UserAuthPayload,
  ): Promise<StudioConversationMessage> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const existing = await this.model.getConversationById(
      user.companyId,
      params.conversationId,
    );
    if (!existing) {
      throw new Error('Conversation not found');
    }
    await this.assertWorkspaceAccess(existing.workspaceId, user);

    const now = new Date();

    const message = await this.model.createMessage({
      companyId: user.companyId,
      conversationId: params.conversationId,
      role: params.role,
      content: params.content,
      createdAt: now,
      createdBy: user.id,
      metadata: params.metadata ?? null,
    });

    const updated = await this.model.incrementMessageStats({
      companyId: user.companyId,
      conversationId: params.conversationId,
      updatedBy: user.id,
      at: now,
    });
    if (!updated) {
      throw new Error('Conversation not found');
    }

    const conversation = await this.model.getConversationById(
      user.companyId,
      params.conversationId,
    );
    if (conversation) {
      await this.syncConversationSnapshot(conversation, user);
    }

    return message;
  }

  async deleteConversation(
    id: string,
    user?: UserAuthPayload,
  ): Promise<boolean> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const existing = await this.model.getConversationById(user.companyId, id);
    if (!existing) return false;
    await this.assertWorkspaceAccess(existing.workspaceId, user);

    const updated = await this.model.updateConversation(user.companyId, id, {
      deleted: true,
      deletedAt: new Date(),
      updatedAt: new Date(),
      updatedBy: user.id,
    });
    if (updated) {
      await this.syncConversationSnapshot(updated, user);
    }
    return true;
  }

  async listMessages(
    params: {
      conversationId: string;
      page?: { number?: number; size?: number };
    },
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const conversation = await this.model.getConversationById(
      user.companyId,
      params.conversationId,
    );
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    await this.assertWorkspaceAccess(conversation.workspaceId, user);

    return this.model.listMessages({
      companyId: user.companyId,
      conversationId: params.conversationId,
      page: params.page,
    });
  }
}

export const createStudioConversationsService = (config: {
  mongoClient: MongoClient;
  authz: AuthZ;
  studioFsService: StudioFsService;
}) => {
  const model = createStudioConversationsModel({
    mongoClient: config.mongoClient,
    dbName: 'es-erp',
  });
  return new StudioConversationsService({
    model,
    authz: config.authz,
    studioFsService: config.studioFsService,
  });
};
