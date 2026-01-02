import { type MongoClient } from 'mongodb';
import {
  GlobalTagsModel,
  GlobalTagRelationsModel,
  type GlobalTag,
  type GlobalTagRelation,
  type ListGlobalTagsQuery,
  type ListGlobalTagRelationsQuery,
  type GlobalTagRelationDoc,
} from './model';
import {
  GLOBAL_TAG_STATUS,
  GLOBAL_TAG_AUDIT_STATUS,
  GLOBAL_TAG_POS,
} from './constants';
import { type UserAuthPayload } from '../../authentication';
import { type EnvConfig } from '../../config';
import type {
  GlobalTagStatus,
  GlobalTagAuditStatus,
  GlobalTagPos,
  GlobalTagRelationType,
} from './constants';

export type {
  GlobalTag,
  GlobalTagRelation,
  ListGlobalTagsQuery,
  ListGlobalTagRelationsQuery,
} from './model';
export * from './constants';

export type CreateGlobalTagInput = {
  label?: string;
  displayName?: string;
  pos?: GlobalTagPos;
  synonyms?: string[];
  status?: GlobalTagStatus;
  auditStatus?: GlobalTagAuditStatus;
  notes?: string;
  source?: string;
};

export type UpdateGlobalTagInput = Partial<
  Omit<CreateGlobalTagInput, 'status' | 'auditStatus'> & {
    status?: GlobalTagStatus;
    auditStatus?: GlobalTagAuditStatus;
  }
>;

export type CreateGlobalTagRelationInput = Omit<
  GlobalTagRelationDoc,
  '_id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
> & {
  relationType: GlobalTagRelationType;
};

export type IngestGlobalTagInput = {
  raw: string;
  posHint?: GlobalTagPos;
  source?: string;
};

export type IngestGlobalTagResult = {
  tag: GlobalTag;
  parsed: {
    raw: string;
    label: string;
    displayName?: string;
    pos: GlobalTagPos;
    warnings: string[];
  };
};

export type MergeGlobalTagInput = {
  sourceTagId: string;
  targetTagId: string;
  reason?: string;
};

const DISCOURAGED_TAG_LABELS = new Map<string, string>([
  [
    'capacity',
    'Discouraged tag: "capacity" is usually implied by the measurable attribute type + context (tank/payload/battery/etc). Prefer using the measurable attribute type (volume/weight/energy/...) plus context tags that name the "what".',
  ],
]);

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

type PageInfo = {
  number: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

const buildPageInfo = (opts: {
  page: number;
  size: number;
  total: number;
}): PageInfo => {
  const totalPages = Math.max(1, Math.ceil(opts.total / opts.size));
  return {
    number: opts.page,
    size: opts.size,
    totalItems: opts.total,
    totalPages,
  };
};

const normalizeDisplayName = (value?: string) => {
  const normalized = value?.trim().replace(/\s+/g, ' ') || '';
  return normalized || undefined;
};

const normalizeLabel = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const normalizeSynonyms = (label: string, values?: string[]) => {
  if (!values) return undefined;
  const normalized = new Map<string, string>();
  values.forEach((value) => {
    const trimmed = value?.trim();
    if (!trimmed) return;
    const synonym = normalizeLabel(trimmed);
    if (!synonym || synonym === label) return;
    const key = synonym.toLowerCase();
    if (!normalized.has(key)) normalized.set(key, trimmed);
  });
  return normalized.size
    ? Array.from(normalized.values()).map(normalizeLabel)
    : undefined;
};

export class GlobalTagsService {
  private mongoClient: MongoClient;
  private dbName: string;
  private tags: GlobalTagsModel;
  private relations: GlobalTagRelationsModel;

  constructor(config: {
    mongoClient: MongoClient;
    dbName: string;
    tags: GlobalTagsModel;
    relations: GlobalTagRelationsModel;
  }) {
    this.mongoClient = config.mongoClient;
    this.dbName = config.dbName;
    this.tags = config.tags;
    this.relations = config.relations;
  }

  private async lintTagCandidate(input: {
    label: string;
    synonyms?: string[] | null;
  }) {
    const warnings: string[] = [];
    const errors: string[] = [];

    const warning = DISCOURAGED_TAG_LABELS.get(input.label);
    if (warning) warnings.push(warning);

    const db = this.mongoClient.db(this.dbName);

    const units = db.collection<{ code: string }>('global_units');
    const unitCode = input.label.toUpperCase();
    const unitMatch = await units.findOne({ code: unitCode });
    if (unitMatch) {
      errors.push(
        `Invalid tag label "${input.label}": looks like a unit code. Units belong in GlobalUnitDefinition, not GlobalTag.`,
      );
    }

    const attributeTypes = db.collection<{
      name: string;
      synonyms?: string[] | null;
      status?: string;
    }>('global_attribute_types');

    const candidates = new Set<string>([
      input.label,
      input.label.replace(/_/g, ' '),
    ]);
    const synonymCandidates = (input.synonyms ?? []).flatMap((synonym) => [
      synonym,
      synonym.replace(/_/g, ' '),
    ]);
    synonymCandidates.forEach((candidate) => candidates.add(candidate));

    for (const candidate of candidates) {
      if (!candidate) continue;
      const regex = { $regex: `^${escapeRegex(candidate)}$`, $options: 'i' };
      const match = await attributeTypes.findOne({
        status: { $ne: 'DEPRECATED' },
        $or: [{ name: regex }, { synonyms: regex }],
      });
      if (!match) continue;
      errors.push(
        `Invalid tag label "${input.label}": "${candidate}" matches an attribute type. Measurable/identity concepts belong in GlobalAttributeType, not GlobalTag.`,
      );
      break;
    }

    return { warnings, errors };
  }

  private async resolveCanonicalTagId(tagId: string) {
    const visited = new Set<string>();
    let currentId = tagId;

    while (true) {
      if (!currentId) throw new Error('Tag id is required');
      if (visited.has(currentId)) return currentId;
      visited.add(currentId);

      const tag = await this.tags.getById(currentId);
      if (!tag) throw new Error(`Global tag not found: ${currentId}`);
      if (!tag.mergedIntoId) return tag.id;
      currentId = tag.mergedIntoId;
    }
  }

  private mergeSynonyms(target: GlobalTag, source: GlobalTag) {
    const next = new Set<string>();
    const targetLabel = normalizeLabel(target.label);

    const add = (value: string | undefined | null) => {
      if (!value) return;
      const normalized = normalizeLabel(value);
      if (!normalized || normalized === targetLabel) return;
      next.add(normalized);
    };

    (target.synonyms ?? []).forEach(add);
    add(source.label);
    (source.synonyms ?? []).forEach(add);

    return next.size ? Array.from(next).sort() : null;
  }

  private async repointReferences(opts: {
    sourceTagId: string;
    targetTagId: string;
    userId?: string;
    now: Date;
  }) {
    const db = this.mongoClient.db(this.dbName);

    const globalTagRelations = db.collection<{
      _id: string;
      fromTagId: string;
      toTagId: string;
      relationType: string;
    }>('global_tag_relations');

    await globalTagRelations.updateMany(
      { fromTagId: opts.sourceTagId },
      {
        $set: {
          fromTagId: opts.targetTagId,
          updatedAt: opts.now,
          updatedBy: opts.userId,
        },
      },
    );

    await globalTagRelations.updateMany(
      { toTagId: opts.sourceTagId },
      {
        $set: {
          toTagId: opts.targetTagId,
          updatedAt: opts.now,
          updatedBy: opts.userId,
        },
      },
    );

    await globalTagRelations.deleteMany({
      fromTagId: opts.targetTagId,
      toTagId: opts.targetTagId,
    });

    const duplicates = await globalTagRelations
      .aggregate<{
        _id: { fromTagId: string; toTagId: string; relationType: string };
        ids: string[];
        count: number;
      }>([
        {
          $match: {
            $or: [
              { fromTagId: opts.targetTagId },
              { toTagId: opts.targetTagId },
            ],
          },
        },
        {
          $group: {
            _id: {
              fromTagId: '$fromTagId',
              toTagId: '$toTagId',
              relationType: '$relationType',
            },
            ids: { $push: '$_id' },
            count: { $sum: 1 },
          },
        },
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray();

    for (const dup of duplicates) {
      const [, ...extraIds] = dup.ids;
      if (!extraIds.length) continue;
      await globalTagRelations.deleteMany({ _id: { $in: extraIds } });
    }

    const parseRules = db.collection<{
      _id: string;
      contextTagIds?: string[] | null;
    }>('global_attribute_parse_rules');

    const cursor = parseRules.find({ contextTagIds: opts.sourceTagId });
    for await (const rule of cursor) {
      const current = rule.contextTagIds ?? [];
      const next = Array.from(
        new Set(
          current.map((tagId) =>
            tagId === opts.sourceTagId ? opts.targetTagId : tagId,
          ),
        ),
      );
      await parseRules.updateOne(
        { _id: rule._id },
        {
          $set: {
            contextTagIds: next,
            updatedAt: opts.now,
            updatedBy: opts.userId,
          },
        },
      );
    }
  }

  async createTag(
    input: CreateGlobalTagInput,
    user?: UserAuthPayload,
  ): Promise<GlobalTag> {
    const displayName = normalizeDisplayName(input.displayName);
    const rawLabel = input.label ?? displayName;
    if (!rawLabel) {
      throw new Error('Tag label or displayName is required');
    }
    const label = normalizeLabel(rawLabel);
    if (!label) {
      throw new Error('Tag label is required');
    }

    const existing = await this.tags.findByLabelOrSynonym(label);
    if (existing) {
      return existing;
    }

    const now = new Date();
    const synonyms = normalizeSynonyms(label, input.synonyms);
    const lint = await this.lintTagCandidate({ label, synonyms });
    if (lint.errors.length) {
      throw new Error(lint.errors.join(' '));
    }

    const lintNotes = lint.warnings.length
      ? `Lint warnings:\n- ${lint.warnings.join('\n- ')}`
      : undefined;
    const notes = input.notes?.trim()
      ? lintNotes
        ? `${input.notes.trim()}\n\n${lintNotes}`
        : input.notes.trim()
      : lintNotes;

    return this.tags.create({
      label,
      ...(displayName ? { displayName } : {}),
      pos: input.pos ?? GLOBAL_TAG_POS.NOUN,
      ...(synonyms ? { synonyms } : {}),
      status: input.status ?? GLOBAL_TAG_STATUS.PROPOSED,
      auditStatus:
        input.auditStatus ??
        (lint.warnings.length
          ? GLOBAL_TAG_AUDIT_STATUS.FLAGGED
          : GLOBAL_TAG_AUDIT_STATUS.PENDING_REVIEW),
      ...(notes ? { notes } : {}),
      ...(input.source ? { source: input.source } : {}),
      createdAt: now,
      updatedAt: now,
      createdBy: user?.id,
      updatedBy: user?.id,
    });
  }

  async findTagByLabelOrSynonym(rawLabel: string) {
    const label = normalizeLabel(rawLabel);
    if (!label) return null;
    return this.tags.findByLabelOrSynonym(label);
  }

  async updateTag(
    id: string,
    updates: UpdateGlobalTagInput,
    user?: UserAuthPayload,
  ): Promise<GlobalTag | null> {
    const existing = await this.tags.getById(id);
    if (!existing) return null;

    const next: Record<string, unknown> = { ...updates };
    if (updates.label !== undefined) {
      const normalized = normalizeLabel(updates.label);
      if (!normalized) throw new Error('Tag label is required');
      const conflict = await this.tags.findByLabelOrSynonym(normalized);
      if (conflict && conflict.id !== id) {
        throw new Error(`Tag label already exists: ${normalized}`);
      }
      next.label = normalized;
    }
    if (updates.displayName !== undefined) {
      next.displayName = normalizeDisplayName(updates.displayName);
    }
    if (updates.synonyms !== undefined) {
      const label = (next.label as string) || existing.label;
      next.synonyms = normalizeSynonyms(label, updates.synonyms);
    }

    if (updates.label !== undefined || updates.synonyms !== undefined) {
      const lint = await this.lintTagCandidate({
        label: (next.label as string) || existing.label,
        synonyms:
          updates.synonyms !== undefined
            ? ((next.synonyms as string[] | null | undefined) ?? null)
            : null,
      });
      if (lint.errors.length) {
        throw new Error(lint.errors.join(' '));
      }
    }

    const sanitized = Object.fromEntries(
      Object.entries(next).filter(([, value]) => value !== undefined),
    );
    return this.tags.update(id, {
      ...(sanitized as any),
      updatedAt: new Date(),
      updatedBy: user?.id,
    });
  }

  async getTagById(id: string) {
    return this.tags.getById(id);
  }

  async listTags(query: ListGlobalTagsQuery) {
    const result = await this.tags.list(query);
    return {
      items: result.items,
      page: buildPageInfo({
        page: result.page,
        size: result.limit,
        total: result.total,
      }),
    };
  }

  async createTagRelation(
    input: CreateGlobalTagRelationInput,
    user?: UserAuthPayload,
  ): Promise<GlobalTagRelation> {
    if (input.fromTagId === input.toTagId) {
      throw new Error('fromTagId and toTagId must differ');
    }
    const now = new Date();
    return this.relations.create({
      ...input,
      createdAt: now,
      updatedAt: now,
      createdBy: user?.id,
      updatedBy: user?.id,
    });
  }

  async listTagRelations(query: ListGlobalTagRelationsQuery) {
    const result = await this.relations.list(query);
    return {
      items: result.items,
      page: buildPageInfo({
        page: result.page,
        size: result.limit,
        total: result.total,
      }),
    };
  }

  async mergeTag(input: MergeGlobalTagInput, user?: UserAuthPayload) {
    const sourceTagId = input.sourceTagId?.trim();
    const targetTagId = input.targetTagId?.trim();
    if (!sourceTagId || !targetTagId) {
      throw new Error('sourceTagId and targetTagId are required');
    }
    if (sourceTagId === targetTagId) {
      throw new Error('sourceTagId and targetTagId must differ');
    }

    const source = await this.tags.getById(sourceTagId);
    if (!source) {
      throw new Error(`Global tag not found: ${sourceTagId}`);
    }

    const canonicalTargetId = await this.resolveCanonicalTagId(targetTagId);
    if (canonicalTargetId === source.id) {
      throw new Error('Cannot merge a tag into itself');
    }
    const target = await this.tags.getById(canonicalTargetId);
    if (!target) throw new Error(`Global tag not found: ${canonicalTargetId}`);

    if (source.mergedIntoId) {
      const existingTargetId = await this.resolveCanonicalTagId(
        source.mergedIntoId,
      );
      if (existingTargetId === target.id) return target;
      throw new Error(
        `Source tag is already merged into ${source.mergedIntoId}`,
      );
    }

    const now = new Date();
    const nextSynonyms = this.mergeSynonyms(target, source);
    await this.tags.update(target.id, {
      ...(nextSynonyms ? { synonyms: nextSynonyms } : { synonyms: null }),
      updatedAt: now,
      updatedBy: user?.id,
    });

    const mergeNote = input.reason?.trim();
    await this.tags.update(source.id, {
      status: GLOBAL_TAG_STATUS.DEPRECATED,
      mergedIntoId: target.id,
      ...(mergeNote
        ? {
            notes: source.notes
              ? `${source.notes}\nMerged into ${target.label}: ${mergeNote}`
              : `Merged into ${target.label}: ${mergeNote}`,
          }
        : {}),
      updatedAt: now,
      updatedBy: user?.id,
    });

    await this.repointReferences({
      sourceTagId: source.id,
      targetTagId: target.id,
      now,
      userId: user?.id,
    });

    const updatedTarget = await this.tags.getById(target.id);
    if (!updatedTarget) {
      throw new Error(`Global tag not found after merge: ${target.id}`);
    }
    return updatedTarget;
  }

  async ingestGlobalTagString(
    input: IngestGlobalTagInput,
    user?: UserAuthPayload,
  ): Promise<IngestGlobalTagResult> {
    const raw = input.raw?.trim();
    if (!raw) {
      throw new Error('Tag string is required');
    }
    const warnings: string[] = [];
    const label = normalizeLabel(raw);
    if (!label) throw new Error('Tag label is required');

    const lint = await this.lintTagCandidate({ label });
    warnings.push(...lint.warnings);
    if (lint.errors.length) {
      throw new Error(lint.errors.join(' '));
    }

    const existing = await this.tags.findByLabelOrSynonym(label);
    const tag =
      existing ||
      (await this.createTag(
        {
          label,
          displayName: raw,
          pos: input.posHint ?? GLOBAL_TAG_POS.NOUN,
          status: GLOBAL_TAG_STATUS.PROPOSED,
          source: input.source || 'freeform',
        },
        user,
      ));

    return {
      tag,
      parsed: {
        raw,
        label,
        displayName: tag.displayName ?? undefined,
        pos: tag.pos,
        warnings,
      },
    };
  }
}

export const createGlobalTagsService = (config: {
  envConfig: EnvConfig;
  mongoClient: MongoClient;
}) => {
  const dbName = config.envConfig.GLOBAL_LIBRARY_DB_NAME || 'es-erp-global';
  const tags = new GlobalTagsModel({ mongoClient: config.mongoClient, dbName });
  const relations = new GlobalTagRelationsModel({
    mongoClient: config.mongoClient,
    dbName,
  });

  return new GlobalTagsService({
    mongoClient: config.mongoClient,
    dbName,
    tags,
    relations,
  });
};
