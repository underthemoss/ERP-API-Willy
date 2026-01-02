import { type MongoClient } from 'mongodb';
import {
  createLineItemsModel,
  type LineItem,
  type LineItemDoc,
  type LineItemDocumentRef,
  type LineItemDocumentType,
  type ListLineItemsQuery,
  type CreateLineItemInput,
  type UpdateLineItemInput,
  type ServiceScopeTask,
} from './model';
import { type UserAuthPayload } from '../../authentication';
import { type AuthZ } from '../../lib/authz';
import {
  ERP_QUOTE_SUBJECT_PERMISSIONS,
  ERP_INTAKE_FORM_SUBMISSION_SUBJECT_PERMISSIONS,
  ERP_WORKSPACE_SUBJECT_PERMISSIONS,
} from '../../lib/authz/spicedb-generated-types';

const MANAGE_PERMISSION_BY_DOC: Record<
  LineItemDocumentType,
  ERP_WORKSPACE_SUBJECT_PERMISSIONS
> = {
  SALES_ORDER: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_SALES_ORDERS,
  PURCHASE_ORDER:
    ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_PURCHASE_ORDERS,
  QUOTE_REVISION: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_QUOTES,
  INTAKE_SUBMISSION:
    ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_INTAKE_FORM_SUBMISSIONS,
  WORK_ORDER: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_SALES_ORDERS,
};

const slugPattern = /^[a-z0-9][a-z0-9-_]*$/;
const ID_LIKE_TAG_PREFIXES = ['WTG-', 'GTG-'] as const;

const isIdLikeTag = (value: string) =>
  ID_LIKE_TAG_PREFIXES.some((prefix) => value.startsWith(prefix));

const normalizeTagLabels = (tags?: string[] | null) =>
  Array.isArray(tags)
    ? Array.from(
        new Set(tags.filter((tag) => typeof tag === 'string' && tag.trim())),
      )
    : [];

const normalizeServiceScopeTasks = (
  tasks: ServiceScopeTask[] | null | undefined,
): ServiceScopeTask[] | null | undefined => {
  if (tasks === undefined) return undefined;
  if (tasks === null) return null;
  if (!Array.isArray(tasks) || tasks.length === 0) return [];

  const normalized = tasks.map((task) => {
    const id = typeof task.id === 'string' ? task.id.trim() : '';
    const title = typeof task.title === 'string' ? task.title.trim() : '';
    if (!id || !slugPattern.test(id)) {
      throw new Error(
        'scopeTasks[].id is required and must be a stable slug (lowercase letters/numbers, "-" or "_")',
      );
    }
    if (!title) {
      throw new Error('scopeTasks[].title is required');
    }

    const activityTagIds = normalizeTagLabels(task.activityTagIds);
    if (activityTagIds.length === 0) {
      throw new Error('scopeTasks[].activityTagIds must include at least 1 tag');
    }
    activityTagIds.forEach((tag) => {
      if (isIdLikeTag(tag)) {
        throw new Error(
          `scopeTasks[].activityTagIds must store canonical tag labels, not tag IDs (got "${tag}")`,
        );
      }
    });

    const contextTagIds = normalizeTagLabels(task.contextTagIds ?? null);
    contextTagIds.forEach((tag) => {
      if (isIdLikeTag(tag)) {
        throw new Error(
          `scopeTasks[].contextTagIds must store canonical tag labels, not tag IDs (got "${tag}")`,
        );
      }
    });

    const sourceTemplateId =
      typeof task.sourceTemplateId === 'string'
        ? task.sourceTemplateId.trim()
        : task.sourceTemplateId ?? null;

    return {
      id,
      sourceTemplateId: sourceTemplateId || null,
      title,
      activityTagIds,
      contextTagIds: contextTagIds.length > 0 ? contextTagIds : null,
      notes: typeof task.notes === 'string' ? task.notes.trim() : task.notes ?? null,
    } satisfies ServiceScopeTask;
  });

  const ids = new Set<string>();
  for (const task of normalized) {
    if (ids.has(task.id)) {
      throw new Error(
        `scopeTasks[].id must be unique per line item (duplicate "${task.id}")`,
      );
    }
    ids.add(task.id);
  }

  return normalized;
};

export class LineItemsService {
  private model: ReturnType<typeof createLineItemsModel>;
  private mongoClient: MongoClient;
  private authZ: AuthZ;

  constructor(private config: { mongoClient: MongoClient; authZ: AuthZ }) {
    this.mongoClient = config.mongoClient;
    this.authZ = config.authZ;
    this.model = createLineItemsModel({ mongoClient: config.mongoClient });
  }

  private async assertWorkspaceReadAccess(
    workspaceId: string,
    user: UserAuthPayload,
  ) {
    const hasAccess = await this.authZ.workspace.hasPermission({
      resourceId: workspaceId,
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
      subjectId: user.id,
    });
    if (!hasAccess) {
      throw new Error('Unauthorized to access line items in this workspace');
    }
  }

  private async assertDocumentReadAccess(
    params: {
      workspaceId: string;
      documentRef?: Partial<LineItemDocumentRef>;
      user: UserAuthPayload;
    },
  ) {
    const { workspaceId, documentRef, user } = params;
    if (documentRef?.type === 'QUOTE_REVISION') {
      if (!documentRef.id) {
        throw new Error(
          'documentRef.id (quoteId) is required to read QUOTE_REVISION line items',
        );
      }
      const hasAccess = await this.authZ.quote.hasPermission({
        resourceId: documentRef.id,
        permission: ERP_QUOTE_SUBJECT_PERMISSIONS.USER_READ,
        subjectId: user.id,
      });
      if (!hasAccess) {
        throw new Error('Unauthorized to access line items for this quote');
      }
      return;
    }

    if (documentRef?.type === 'INTAKE_SUBMISSION') {
      if (!documentRef.id) {
        throw new Error(
          'documentRef.id (submissionId) is required to read INTAKE_SUBMISSION line items',
        );
      }
      const hasAccess = await this.authZ.intakeFormSubmission.hasPermission({
        resourceId: documentRef.id,
        permission: ERP_INTAKE_FORM_SUBMISSION_SUBJECT_PERMISSIONS.USER_READ,
        subjectId: user.id,
      });
      if (!hasAccess) {
        throw new Error(
          'Unauthorized to access line items for this intake form submission',
        );
      }
      return;
    }

    await this.assertWorkspaceReadAccess(workspaceId, user);
  }

  private async assertWorkspaceWriteAccess(
    workspaceId: string,
    documentType: LineItemDocumentType,
    user: UserAuthPayload,
  ) {
    const permission = MANAGE_PERMISSION_BY_DOC[documentType];
    const hasAccess = await this.authZ.workspace.hasPermission({
      resourceId: workspaceId,
      permission,
      subjectId: user.id,
    });
    if (!hasAccess) {
      throw new Error('Unauthorized to modify line items in this workspace');
    }
  }

  private async assertDocumentWriteAccess(
    params: {
      workspaceId: string;
      documentRef: LineItemDocumentRef;
      user: UserAuthPayload;
    },
  ) {
    const { workspaceId, documentRef, user } = params;
    if (documentRef.type === 'QUOTE_REVISION') {
      if (!documentRef.id) {
        throw new Error(
          'documentRef.id (quoteId) is required to modify QUOTE_REVISION line items',
        );
      }
      const hasAccess = await this.authZ.quote.hasPermission({
        resourceId: documentRef.id,
        permission: ERP_QUOTE_SUBJECT_PERMISSIONS.USER_UPDATE,
        subjectId: user.id,
      });
      if (!hasAccess) {
        throw new Error('Unauthorized to modify line items for this quote');
      }
      return;
    }

    if (documentRef.type === 'INTAKE_SUBMISSION') {
      if (!documentRef.id) {
        throw new Error(
          'documentRef.id (submissionId) is required to modify INTAKE_SUBMISSION line items',
        );
      }
      const hasAccess = await this.authZ.intakeFormSubmission.hasPermission({
        resourceId: documentRef.id,
        permission: ERP_INTAKE_FORM_SUBMISSION_SUBJECT_PERMISSIONS.USER_UPDATE,
        subjectId: user.id,
      });
      if (!hasAccess) {
        throw new Error(
          'Unauthorized to modify line items for this intake form submission',
        );
      }
      return;
    }

    await this.assertWorkspaceWriteAccess(workspaceId, documentRef.type, user);
  }

  private assertValidQuantity(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error('Line item quantity is required');
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      throw new Error('Line item quantity must be a valid number');
    }
    if (parsed < 0) {
      throw new Error('Line item quantity must be non-negative');
    }
  }

  async listLineItems(query: ListLineItemsQuery, user?: UserAuthPayload) {
    if (!user) {
      throw new Error('User not authenticated');
    }
    await this.assertDocumentReadAccess({
      workspaceId: query.filter.workspaceId,
      documentRef: query.filter.documentRef,
      user,
    });
    return this.model.listLineItems(query);
  }

  async getLineItemById(id: string, user?: UserAuthPayload) {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const item = await this.model.getLineItemByIdAnyStatus(id);
    if (!item) return null;
    await this.assertDocumentReadAccess({
      workspaceId: item.workspaceId,
      documentRef: item.documentRef,
      user,
    });
    return item;
  }

  async batchGetLineItemsByIds(
    ids: string[],
    user?: UserAuthPayload,
  ): Promise<(LineItem | null)[]> {
    if (!user) {
      return ids.map(() => null);
    }
    const items = await this.model.getLineItemsByIds(ids);
    const allowedWorkspaceIds = new Set<string>();
    const allowedQuoteIds = new Set<string>();
    const allowedIntakeSubmissionIds = new Set<string>();

    const workspaceIds = Array.from(new Set(items.map((item) => item.workspaceId)));
    await Promise.all(
      workspaceIds.map(async (workspaceId) => {
        const hasAccess = await this.authZ.workspace.hasPermission({
          resourceId: workspaceId,
          permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
          subjectId: user.id,
        });
        if (hasAccess) {
          allowedWorkspaceIds.add(workspaceId);
        }
      }),
    );

    const quoteIds = Array.from(
      new Set(
        items
          .filter((item) => item.documentRef.type === 'QUOTE_REVISION')
          .map((item) => item.documentRef.id)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    await Promise.all(
      quoteIds.map(async (quoteId) => {
        const hasAccess = await this.authZ.quote.hasPermission({
          resourceId: quoteId,
          permission: ERP_QUOTE_SUBJECT_PERMISSIONS.USER_READ,
          subjectId: user.id,
        });
        if (hasAccess) {
          allowedQuoteIds.add(quoteId);
        }
      }),
    );

    const intakeSubmissionIds = Array.from(
      new Set(
        items
          .filter((item) => item.documentRef.type === 'INTAKE_SUBMISSION')
          .map((item) => item.documentRef.id)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    await Promise.all(
      intakeSubmissionIds.map(async (submissionId) => {
        const hasAccess =
          await this.authZ.intakeFormSubmission.hasPermission({
            resourceId: submissionId,
            permission: ERP_INTAKE_FORM_SUBMISSION_SUBJECT_PERMISSIONS.USER_READ,
            subjectId: user.id,
          });
        if (hasAccess) {
          allowedIntakeSubmissionIds.add(submissionId);
        }
      }),
    );

    const filteredItems = items.filter((item) => {
      if (item.documentRef.type === 'QUOTE_REVISION') {
        return Boolean(item.documentRef.id && allowedQuoteIds.has(item.documentRef.id));
      }
      if (item.documentRef.type === 'INTAKE_SUBMISSION') {
        return Boolean(
          item.documentRef.id && allowedIntakeSubmissionIds.has(item.documentRef.id),
        );
      }
      return allowedWorkspaceIds.has(item.workspaceId);
    });

    const itemById = new Map(filteredItems.map((item) => [item.id, item]));
    return ids.map((id) => itemById.get(id) ?? null);
  }

  async listLineItemsByDocumentRef(
    workspaceId: string,
    documentRef: LineItemDocumentRef,
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }
    await this.assertDocumentReadAccess({ workspaceId, documentRef, user });
    return this.model.listLineItemsByDocumentRef({ workspaceId, documentRef });
  }

  async listLineItemsByIntakeFormSubmissionLineItemIds(
    lineItemIds: string[],
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return this.model.listLineItemsByIntakeFormSubmissionLineItemIds(
      lineItemIds,
    );
  }

  async createLineItem(input: CreateLineItemInput, user?: UserAuthPayload) {
    if (!user) {
      throw new Error('User not authenticated');
    }
    this.assertValidQuantity(input.quantity);
    await this.assertDocumentWriteAccess({
      workspaceId: input.workspaceId,
      documentRef: input.documentRef,
      user,
    });

    const scopeTasks = normalizeServiceScopeTasks(input.scopeTasks);
    if (
      input.type !== 'SERVICE' &&
      Array.isArray(scopeTasks) &&
      scopeTasks.length > 0
    ) {
      throw new Error('scopeTasks are only allowed on SERVICE line items');
    }

    const now = new Date();
    return this.model.createLineItem({
      ...input,
      scopeTasks,
      createdAt: now,
      updatedAt: now,
      createdBy: user.id,
      updatedBy: user.id,
    });
  }

  async updateLineItem(
    id: string,
    updates: Partial<Omit<LineItemDoc, '_id' | 'workspaceId' | 'documentRef'>>,
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const existing = await this.model.getLineItemByIdAnyStatus(id);
    if (!existing) {
      throw new Error('Line item not found');
    }
    await this.assertDocumentWriteAccess({
      workspaceId: existing.workspaceId,
      documentRef: existing.documentRef,
      user,
    });
    if (updates.quantity !== undefined) {
      this.assertValidQuantity(updates.quantity);
    }
    const next: UpdateLineItemInput = {
      ...updates,
      updatedAt: new Date(),
      updatedBy: user.id,
    };

    if (Object.prototype.hasOwnProperty.call(updates, 'scopeTasks')) {
      const normalizedScopeTasks = normalizeServiceScopeTasks(
        (updates as Partial<Pick<LineItemDoc, 'scopeTasks'>>).scopeTasks,
      );
      if (normalizedScopeTasks !== undefined) {
        next.scopeTasks = normalizedScopeTasks;
      }
    }

    if (
      existing.type !== 'SERVICE' &&
      Array.isArray(next.scopeTasks) &&
      next.scopeTasks.length > 0
    ) {
      throw new Error('scopeTasks are only allowed on SERVICE line items');
    }

    return this.model.updateLineItem(id, next);
  }

  async softDeleteLineItem(id: string, user?: UserAuthPayload) {
    if (!user) {
      throw new Error('User not authenticated');
    }
    const existing = await this.model.getLineItemByIdAnyStatus(id);
    if (!existing) {
      throw new Error('Line item not found');
    }
    await this.assertDocumentWriteAccess({
      workspaceId: existing.workspaceId,
      documentRef: existing.documentRef,
      user,
    });
    return this.model.softDeleteLineItem(id, user.id);
  }
}

export const createLineItemsService = (config: {
  mongoClient: MongoClient;
  authZ: AuthZ;
}) => new LineItemsService(config);

export type {
  LineItem,
  LineItemDoc,
  LineItemDocumentRef,
  LineItemDocumentType,
  ListLineItemsQuery,
  CreateLineItemInput,
};
