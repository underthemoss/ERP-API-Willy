import { type MongoClient } from 'mongodb';
import { type UserAuthPayload } from '../../authentication';
import { type EnvConfig } from '../../config';
import { ERP_WORKSPACE_SUBJECT_PERMISSIONS, type AuthZ } from '../../lib/authz';
import {
  GLOBAL_TAG_AUDIT_STATUS,
  GLOBAL_TAG_POS,
  GLOBAL_TAG_STATUS,
  type GlobalTagAuditStatus,
  type GlobalTagPos,
  type GlobalTagStatus,
} from '../global_tags/constants';
import {
  GLOBAL_ATTRIBUTE_AUDIT_STATUS,
  GLOBAL_ATTRIBUTE_STATUS,
  GLOBAL_UNIT_STATUS,
  type GlobalAttributeAuditStatus,
  type GlobalAttributeStatus,
  type GlobalUnitStatus,
} from '../global_attributes/constants';
import type { GlobalTagsService, GlobalTag } from '../global_tags';
import type {
  GlobalAttributesService,
  GlobalAttributeType,
  GlobalAttributeValue,
  GlobalUnitDefinition,
} from '../global_attributes';
import {
  type ListWorkspaceAttributeTypesQuery,
  type ListWorkspaceAttributeValuesQuery,
  type ListWorkspaceTagsQuery,
  type ListWorkspaceUnitDefinitionsQuery,
  type WorkspaceAttributeType,
  type WorkspaceAttributeTypeDoc,
  type WorkspaceAttributeValue,
  type WorkspaceAttributeValueDoc,
  WorkspaceAttributeValuesModel,
  WorkspaceAttributeTypesModel,
  type WorkspaceTag,
  type WorkspaceUnitDefinition,
  type WorkspaceUnitDefinitionDoc,
  WorkspaceUnitDefinitionsModel,
  WorkspaceTagsModel,
} from './model';

export type {
  WorkspaceTag,
  WorkspaceAttributeType,
  WorkspaceAttributeValue,
  WorkspaceUnitDefinition,
  ListWorkspaceTagsQuery,
  ListWorkspaceAttributeTypesQuery,
  ListWorkspaceAttributeValuesQuery,
  ListWorkspaceUnitDefinitionsQuery,
} from './model';

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
  const normalized = new Set<string>();
  values.forEach((value) => {
    const trimmed = value?.trim();
    if (!trimmed) return;
    const synonym = normalizeLabel(trimmed);
    if (!synonym || synonym === label) return;
    normalized.add(synonym);
  });
  return normalized.size ? Array.from(normalized).sort() : undefined;
};

const normalizeName = (value?: string) =>
  value?.trim().replace(/\s+/g, ' ') || '';

const normalizeStringArray = (values?: string[]) => {
  if (!values) return undefined;
  const next = new Set<string>();
  values.forEach((value) => {
    const normalized = value?.trim().replace(/\s+/g, ' ');
    if (!normalized) return;
    next.add(normalized);
  });
  return next.size ? Array.from(next).sort() : undefined;
};

const CONTEXTUAL_NAME_TOKENS = new Set([
  'overall',
  'operating',
  'shipping',
  'gross',
  'net',
  'rated',
  'max',
  'min',
  'maximum',
  'minimum',
  'capacity',
  'payload',
  'tank',
  'battery',
  'surface',
  'footprint',
  'travel',
  'ground',
  'cycle',
  'runtime',
  'bulk',
  'displacement',
  'lift',
  'pull',
  'breakout',
]);

const BLENDED_PHYSICAL_ATTRIBUTE_NAME_TOKENS = new Set([
  ...CONTEXTUAL_NAME_TOKENS,
  'bucket',
  'door',
  'panel',
  'with',
  'without',
  'no',
  'option',
  'peak',
  'sae',
]);

const normalizeParseKey = (value?: string) => {
  if (!value) return '';
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const extractBlendedPhysicalNameTokens = (value: string) => {
  const tokens = normalizeParseKey(value).split('_').filter(Boolean);
  return tokens.filter((token) =>
    BLENDED_PHYSICAL_ATTRIBUTE_NAME_TOKENS.has(token),
  );
};

const assertAtomicPhysicalAttributeTypeName = (name: string) => {
  const blendedTokens = extractBlendedPhysicalNameTokens(name);
  if (!blendedTokens.length) return;
  throw new Error(
    `Invalid PHYSICAL attribute type name: "${name}" contains contextual tokens (${blendedTokens.join(
      ', ',
    )}). Use an atomic measurable quantity (e.g., weight, volume, force) and put qualifiers/components into context tags.`,
  );
};

const assertAuthenticated = (user?: UserAuthPayload): UserAuthPayload => {
  if (!user) throw new Error('Unauthorized');
  return user;
};

export type UpsertWorkspaceTagInput = {
  workspaceId: string;
  label: string;
  displayName?: string | null;
  pos?: GlobalTagPos | null;
  synonyms?: string[] | null;
  status?: GlobalTagStatus | null;
  auditStatus?: GlobalTagAuditStatus | null;
  notes?: string | null;
  source?: string | null;
};

export type UpsertWorkspaceAttributeTypeInput = Omit<
  WorkspaceAttributeTypeDoc,
  | '_id'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'updatedBy'
  | 'globalAttributeTypeId'
  | 'status'
> & {
  workspaceId: string;
  name: string;
  status?: GlobalAttributeStatus | null;
  auditStatus?: GlobalAttributeAuditStatus | null;
};

export type UpsertWorkspaceUnitDefinitionInput = Omit<
  WorkspaceUnitDefinitionDoc,
  | '_id'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'updatedBy'
  | 'globalUnitCode'
  | 'status'
> & {
  status?: GlobalUnitStatus | null;
};

export type UpsertWorkspaceAttributeValueInput = Omit<
  WorkspaceAttributeValueDoc,
  | '_id'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'updatedBy'
  | 'globalAttributeValueId'
  | 'status'
> & {
  status?: GlobalAttributeStatus | null;
  auditStatus?: GlobalAttributeAuditStatus | null;
};

export type VocabularyScope = 'GLOBAL' | 'WORKSPACE';

export type ResolvedWorkspaceTag = {
  scope: VocabularyScope;
  created: boolean;
  globalTag?: GlobalTag | null;
  workspaceTag?: WorkspaceTag | null;
};

export type ResolvedWorkspaceAttributeType = {
  scope: VocabularyScope;
  created: boolean;
  globalAttributeType?: GlobalAttributeType | null;
  workspaceAttributeType?: WorkspaceAttributeType | null;
};

export type ResolvedWorkspaceUnitDefinition = {
  scope: VocabularyScope;
  created: boolean;
  globalUnitDefinition?: GlobalUnitDefinition | null;
  workspaceUnitDefinition?: WorkspaceUnitDefinition | null;
};

export type ResolvedWorkspaceAttributeValue = {
  scope: VocabularyScope;
  created: boolean;
  globalAttributeValue?: GlobalAttributeValue | null;
  workspaceAttributeValue?: WorkspaceAttributeValue | null;
};

export class WorkspaceVocabularyService {
  private authZ: AuthZ;
  private tags: WorkspaceTagsModel;
  private attributeTypes: WorkspaceAttributeTypesModel;
  private units: WorkspaceUnitDefinitionsModel;
  private attributeValues: WorkspaceAttributeValuesModel;
  private globalTags: GlobalTagsService;
  private globalAttributes: GlobalAttributesService;

  constructor(config: {
    authZ: AuthZ;
    tags: WorkspaceTagsModel;
    attributeTypes: WorkspaceAttributeTypesModel;
    units: WorkspaceUnitDefinitionsModel;
    attributeValues: WorkspaceAttributeValuesModel;
    globalTags: GlobalTagsService;
    globalAttributes: GlobalAttributesService;
  }) {
    this.authZ = config.authZ;
    this.tags = config.tags;
    this.attributeTypes = config.attributeTypes;
    this.units = config.units;
    this.attributeValues = config.attributeValues;
    this.globalTags = config.globalTags;
    this.globalAttributes = config.globalAttributes;
  }

  private async assertCanReadWorkspace(opts: {
    workspaceId: string;
    user: UserAuthPayload;
  }) {
    const canRead = await this.authZ.workspace.hasPermission({
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_READ,
      resourceId: opts.workspaceId,
      subjectId: opts.user.id,
    });
    if (!canRead) throw new Error('Not authorized');
  }

  async listWorkspaceTags(
    query: ListWorkspaceTagsQuery,
    user?: UserAuthPayload,
  ) {
    const authenticated = assertAuthenticated(user);
    await this.assertCanReadWorkspace({
      workspaceId: query.filter.workspaceId,
      user: authenticated,
    });

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

  async getWorkspaceTagById(id: string, user?: UserAuthPayload) {
    const authenticated = assertAuthenticated(user);
    const tag = await this.tags.getById(id);
    if (!tag) return null;
    await this.assertCanReadWorkspace({
      workspaceId: tag.workspaceId,
      user: authenticated,
    });
    return tag;
  }

  async upsertWorkspaceTag(
    input: UpsertWorkspaceTagInput,
    user?: UserAuthPayload,
  ): Promise<WorkspaceTag> {
    const authenticated = assertAuthenticated(user);
    const workspaceId = input.workspaceId?.trim();
    if (!workspaceId) throw new Error('workspaceId is required');
    await this.assertCanReadWorkspace({ workspaceId, user: authenticated });

    const displayName = normalizeDisplayName(input.displayName ?? undefined);
    const rawLabel = input.label ?? displayName;
    if (!rawLabel) throw new Error('label is required');

    const label = normalizeLabel(rawLabel);
    if (!label) throw new Error('label is required');

    const now = new Date();
    const synonyms = normalizeSynonyms(label, input.synonyms ?? undefined);
    const existing = await this.tags.findByLabelOrSynonym(workspaceId, label);

    if (existing) {
      const nextSynonyms = new Set<string>(existing.synonyms ?? []);
      (synonyms ?? []).forEach((syn) => nextSynonyms.add(syn));

      const updated = await this.tags.update(existing.id, workspaceId, {
        ...(displayName !== undefined ? { displayName } : {}),
        ...(input.pos ? { pos: input.pos } : {}),
        ...(nextSynonyms.size
          ? { synonyms: Array.from(nextSynonyms).sort() }
          : { synonyms: null }),
        ...(input.status ? { status: input.status } : {}),
        ...(input.auditStatus ? { auditStatus: input.auditStatus } : {}),
        ...(input.notes !== undefined
          ? { notes: input.notes?.trim() || null }
          : {}),
        ...(input.source ? { source: input.source } : {}),
        updatedAt: now,
        updatedBy: authenticated.id,
      });

      if (!updated) throw new Error('Workspace tag not found after update');
      return updated;
    }

    return this.tags.create({
      workspaceId,
      label,
      ...(displayName ? { displayName } : {}),
      pos: input.pos ?? GLOBAL_TAG_POS.NOUN,
      ...(synonyms ? { synonyms } : {}),
      status: input.status ?? GLOBAL_TAG_STATUS.PROPOSED,
      auditStatus: input.auditStatus ?? GLOBAL_TAG_AUDIT_STATUS.PENDING_REVIEW,
      ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
      ...(input.source ? { source: input.source } : {}),
      globalTagId: null,
      createdAt: now,
      updatedAt: now,
      createdBy: authenticated.id,
      updatedBy: authenticated.id,
    });
  }

  async listWorkspaceAttributeTypes(
    query: ListWorkspaceAttributeTypesQuery,
    user?: UserAuthPayload,
  ) {
    const authenticated = assertAuthenticated(user);
    await this.assertCanReadWorkspace({
      workspaceId: query.filter.workspaceId,
      user: authenticated,
    });

    const result = await this.attributeTypes.list(query);
    return {
      items: result.items,
      page: buildPageInfo({
        page: result.page,
        size: result.limit,
        total: result.total,
      }),
    };
  }

  async getWorkspaceAttributeTypeById(id: string, user?: UserAuthPayload) {
    const authenticated = assertAuthenticated(user);
    const attributeType = await this.attributeTypes.getById(id);
    if (!attributeType) return null;
    await this.assertCanReadWorkspace({
      workspaceId: attributeType.workspaceId,
      user: authenticated,
    });
    return attributeType;
  }

  async upsertWorkspaceAttributeType(
    input: UpsertWorkspaceAttributeTypeInput,
    user?: UserAuthPayload,
  ): Promise<WorkspaceAttributeType> {
    const authenticated = assertAuthenticated(user);
    const workspaceId = input.workspaceId?.trim();
    if (!workspaceId) throw new Error('workspaceId is required');
    await this.assertCanReadWorkspace({ workspaceId, user: authenticated });

    const name = normalizeName(input.name);
    if (!name) throw new Error('name is required');
    if (name.includes('_')) {
      throw new Error(
        `Invalid attribute type name: "${name}". Use an atomic attribute type (e.g., "power") and put qualifiers into context tags.`,
      );
    }
    if (input.kind === 'PHYSICAL') {
      assertAtomicPhysicalAttributeTypeName(name);
    }

    const synonyms = normalizeStringArray(input.synonyms);
    if (input.kind === 'PHYSICAL') {
      (synonyms ?? []).forEach((syn) =>
        assertAtomicPhysicalAttributeTypeName(syn),
      );
    }
    if ((synonyms ?? []).some((syn) => syn.includes('_'))) {
      throw new Error(
        'Invalid attribute type synonyms: underscores indicate blended concepts; use atomic types + context tags.',
      );
    }

    const now = new Date();
    const existing = await this.attributeTypes.findByNameOrSynonym(
      workspaceId,
      name,
    );

    if (existing) {
      const nextSynonyms = new Set<string>(existing.synonyms ?? []);
      (synonyms ?? []).forEach((syn) => nextSynonyms.add(syn));

      const updated = await this.attributeTypes.update(
        existing.id,
        workspaceId,
        {
          name,
          kind: input.kind,
          valueType: input.valueType,
          ...(input.dimension !== undefined
            ? { dimension: input.dimension }
            : {}),
          ...(input.canonicalUnit !== undefined
            ? { canonicalUnit: input.canonicalUnit }
            : {}),
          ...(input.allowedUnits !== undefined
            ? { allowedUnits: input.allowedUnits }
            : {}),
          ...(input.canonicalValueSetId !== undefined
            ? { canonicalValueSetId: input.canonicalValueSetId }
            : {}),
          ...(nextSynonyms.size
            ? { synonyms: Array.from(nextSynonyms).sort() }
            : { synonyms: [] }),
          status: (input.status ?? existing.status) as GlobalAttributeStatus,
          auditStatus: (input.auditStatus ?? existing.auditStatus) as
            | GlobalAttributeAuditStatus
            | undefined,
          ...(input.appliesTo !== undefined
            ? { appliesTo: input.appliesTo }
            : {}),
          ...(input.usageHints !== undefined
            ? { usageHints: input.usageHints }
            : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          ...(input.validationRules !== undefined
            ? { validationRules: input.validationRules }
            : {}),
          ...(input.source !== undefined
            ? { source: input.source ?? undefined }
            : {}),
          updatedAt: now,
          updatedBy: authenticated.id,
        },
      );

      if (!updated) {
        throw new Error('Workspace attribute type not found after update');
      }
      return updated;
    }

    return this.attributeTypes.create({
      workspaceId,
      name,
      kind: input.kind,
      valueType: input.valueType,
      dimension: input.dimension ?? undefined,
      canonicalUnit: input.canonicalUnit ?? undefined,
      allowedUnits: input.allowedUnits ?? undefined,
      canonicalValueSetId: input.canonicalValueSetId ?? undefined,
      synonyms: synonyms ?? [],
      status: input.status ?? GLOBAL_ATTRIBUTE_STATUS.PROPOSED,
      auditStatus:
        input.auditStatus ?? GLOBAL_ATTRIBUTE_AUDIT_STATUS.PENDING_REVIEW,
      appliesTo: input.appliesTo ?? undefined,
      usageHints: input.usageHints ?? undefined,
      notes: input.notes ?? undefined,
      validationRules: input.validationRules ?? undefined,
      source: input.source ?? undefined,
      globalAttributeTypeId: null,
      createdAt: now,
      updatedAt: now,
      createdBy: authenticated.id,
      updatedBy: authenticated.id,
    });
  }

  async listWorkspaceUnitDefinitions(
    query: ListWorkspaceUnitDefinitionsQuery,
    user?: UserAuthPayload,
  ) {
    const authenticated = assertAuthenticated(user);
    await this.assertCanReadWorkspace({
      workspaceId: query.filter.workspaceId,
      user: authenticated,
    });

    const result = await this.units.list(query);
    return {
      items: result.items,
      page: buildPageInfo({
        page: result.page,
        size: result.limit,
        total: result.total,
      }),
    };
  }

  async getWorkspaceUnitDefinitionById(id: string, user?: UserAuthPayload) {
    const authenticated = assertAuthenticated(user);
    const unit = await this.units.getById(id);
    if (!unit) return null;
    await this.assertCanReadWorkspace({
      workspaceId: unit.workspaceId,
      user: authenticated,
    });
    return unit;
  }

  async upsertWorkspaceUnitDefinition(
    input: UpsertWorkspaceUnitDefinitionInput,
    user?: UserAuthPayload,
  ): Promise<WorkspaceUnitDefinition> {
    const authenticated = assertAuthenticated(user);
    const workspaceId = input.workspaceId?.trim();
    if (!workspaceId) throw new Error('workspaceId is required');
    await this.assertCanReadWorkspace({ workspaceId, user: authenticated });

    const normalizedCode =
      this.globalAttributes.normalizeUnitCode(input.code) ||
      input.code?.trim().toUpperCase();
    if (!normalizedCode) throw new Error('code is required');

    const name = normalizeName(input.name) || undefined;
    const canonicalUnitCode =
      input.canonicalUnitCode === undefined
        ? undefined
        : input.canonicalUnitCode
          ? this.globalAttributes.normalizeUnitCode(input.canonicalUnitCode) ||
            input.canonicalUnitCode.trim().toUpperCase()
          : undefined;

    const existing = await this.units.findByCode(workspaceId, normalizedCode);
    const now = new Date();

    if (existing) {
      const updated = await this.units.update(existing.id, workspaceId, {
        code: normalizedCode,
        ...(name !== undefined ? { name } : {}),
        ...(input.dimension !== undefined
          ? { dimension: input.dimension }
          : {}),
        ...(input.canonicalUnitCode !== undefined ? { canonicalUnitCode } : {}),
        ...(input.toCanonicalFactor !== undefined
          ? { toCanonicalFactor: input.toCanonicalFactor }
          : {}),
        ...(input.offset !== undefined ? { offset: input.offset } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.source !== undefined
          ? { source: input.source ?? undefined }
          : {}),
        updatedAt: now,
        updatedBy: authenticated.id,
      });
      if (!updated) {
        throw new Error('Workspace unit definition not found after update');
      }
      return updated;
    }

    return this.units.create({
      workspaceId,
      code: normalizedCode,
      ...(name ? { name } : {}),
      dimension: input.dimension ?? undefined,
      ...(canonicalUnitCode ? { canonicalUnitCode } : {}),
      ...(input.toCanonicalFactor !== undefined
        ? { toCanonicalFactor: input.toCanonicalFactor }
        : {}),
      ...(input.offset !== undefined ? { offset: input.offset } : {}),
      status: input.status ?? GLOBAL_UNIT_STATUS.ACTIVE,
      ...(input.source ? { source: input.source } : {}),
      globalUnitCode: null,
      createdAt: now,
      updatedAt: now,
      createdBy: authenticated.id,
      updatedBy: authenticated.id,
    });
  }

  async listWorkspaceAttributeValues(
    query: ListWorkspaceAttributeValuesQuery,
    user?: UserAuthPayload,
  ) {
    const authenticated = assertAuthenticated(user);
    await this.assertCanReadWorkspace({
      workspaceId: query.filter.workspaceId,
      user: authenticated,
    });

    const result = await this.attributeValues.list(query);
    return {
      items: result.items,
      page: buildPageInfo({
        page: result.page,
        size: result.limit,
        total: result.total,
      }),
    };
  }

  async getWorkspaceAttributeValueById(id: string, user?: UserAuthPayload) {
    const authenticated = assertAuthenticated(user);
    const attributeValue = await this.attributeValues.getById(id);
    if (!attributeValue) return null;
    await this.assertCanReadWorkspace({
      workspaceId: attributeValue.workspaceId,
      user: authenticated,
    });
    return attributeValue;
  }

  async upsertWorkspaceAttributeValue(
    input: UpsertWorkspaceAttributeValueInput,
    user?: UserAuthPayload,
  ): Promise<WorkspaceAttributeValue> {
    const authenticated = assertAuthenticated(user);
    const workspaceId = input.workspaceId?.trim();
    if (!workspaceId) throw new Error('workspaceId is required');
    await this.assertCanReadWorkspace({ workspaceId, user: authenticated });

    const attributeTypeId = input.attributeTypeId?.trim();
    if (!attributeTypeId) throw new Error('attributeTypeId is required');

    const value = normalizeName(input.value);
    if (!value) throw new Error('value is required');

    const synonyms = normalizeStringArray(input.synonyms);
    const existing =
      await this.attributeValues.findByAttributeAndValueOrSynonym(
        workspaceId,
        attributeTypeId,
        value,
      );
    const now = new Date();

    if (existing) {
      const nextSynonyms = new Set<string>(existing.synonyms ?? []);
      (synonyms ?? []).forEach((syn) => nextSynonyms.add(syn));

      const updated = await this.attributeValues.update(
        existing.id,
        workspaceId,
        {
          attributeTypeId,
          value,
          ...(nextSynonyms.size
            ? { synonyms: Array.from(nextSynonyms).sort() }
            : { synonyms: [] }),
          ...(input.codes !== undefined ? { codes: input.codes } : {}),
          status: (input.status ?? existing.status) as GlobalAttributeStatus,
          auditStatus: (input.auditStatus ?? existing.auditStatus) as
            | GlobalAttributeAuditStatus
            | undefined,
          ...(input.source !== undefined
            ? { source: input.source ?? undefined }
            : {}),
          updatedAt: now,
          updatedBy: authenticated.id,
        },
      );
      if (!updated) {
        throw new Error('Workspace attribute value not found after update');
      }
      return updated;
    }

    return this.attributeValues.create({
      workspaceId,
      attributeTypeId,
      value,
      synonyms: synonyms ?? [],
      ...(input.codes !== undefined ? { codes: input.codes } : {}),
      status: input.status ?? GLOBAL_ATTRIBUTE_STATUS.PROPOSED,
      auditStatus:
        input.auditStatus ?? GLOBAL_ATTRIBUTE_AUDIT_STATUS.PENDING_REVIEW,
      source: input.source ?? undefined,
      globalAttributeValueId: null,
      createdAt: now,
      updatedAt: now,
      createdBy: authenticated.id,
      updatedBy: authenticated.id,
    });
  }

  async resolveGlobalOrWorkspaceTag(
    input: UpsertWorkspaceTagInput & { preferGlobal?: boolean | null },
    user?: UserAuthPayload,
  ): Promise<ResolvedWorkspaceTag> {
    const authenticated = assertAuthenticated(user);
    const workspaceId = input.workspaceId?.trim();
    if (!workspaceId) throw new Error('workspaceId is required');
    await this.assertCanReadWorkspace({ workspaceId, user: authenticated });

    const displayName = normalizeDisplayName(input.displayName ?? undefined);
    const rawLabel = input.label ?? displayName;
    if (!rawLabel) throw new Error('label is required');
    const label = normalizeLabel(rawLabel);
    if (!label) throw new Error('label is required');

    const preferGlobal = input.preferGlobal !== false;
    if (preferGlobal) {
      const synonyms = normalizeSynonyms(label, input.synonyms ?? undefined);
      const candidates = [label, ...(synonyms ?? [])];
      for (const candidate of candidates) {
        const global = await this.globalTags.findTagByLabelOrSynonym(candidate);
        if (global) {
          return {
            scope: 'GLOBAL',
            created: false,
            globalTag: global,
            workspaceTag: null,
          };
        }
      }
    }

    const existing = await this.tags.findByLabelOrSynonym(workspaceId, label);
    const created = !existing;
    const { preferGlobal: _preferGlobal, ...upsertInput } = input;
    const workspaceTag = await this.upsertWorkspaceTag(
      upsertInput,
      authenticated,
    );
    return {
      scope: 'WORKSPACE',
      created,
      globalTag: null,
      workspaceTag,
    };
  }

  async resolveGlobalOrWorkspaceAttributeType(
    input: UpsertWorkspaceAttributeTypeInput & {
      preferGlobal?: boolean | null;
    },
    user?: UserAuthPayload,
  ): Promise<ResolvedWorkspaceAttributeType> {
    const authenticated = assertAuthenticated(user);
    const workspaceId = input.workspaceId?.trim();
    if (!workspaceId) throw new Error('workspaceId is required');
    await this.assertCanReadWorkspace({ workspaceId, user: authenticated });

    const name = normalizeName(input.name);
    if (!name) throw new Error('name is required');

    const preferGlobal = input.preferGlobal !== false;
    if (preferGlobal) {
      const synonyms = normalizeStringArray(input.synonyms);
      const candidates = [name, ...(synonyms ?? [])];
      for (const candidate of candidates) {
        const global =
          await this.globalAttributes.findAttributeTypeByNameOrSynonym(
            candidate,
          );
        if (global) {
          return {
            scope: 'GLOBAL',
            created: false,
            globalAttributeType: global,
            workspaceAttributeType: null,
          };
        }
      }
    }

    if (preferGlobal && input.kind === 'PHYSICAL') {
      throw new Error(
        `Unknown PHYSICAL attribute type "${name}". PHYSICAL attribute types must be seeded in the global library (do not create workspace-draft PHYSICAL types).`,
      );
    }

    const existing = await this.attributeTypes.findByNameOrSynonym(
      workspaceId,
      name,
    );
    const created = !existing;
    const { preferGlobal: _preferGlobal, ...upsertInput } = input;
    const workspaceAttributeType = await this.upsertWorkspaceAttributeType(
      upsertInput,
      authenticated,
    );
    return {
      scope: 'WORKSPACE',
      created,
      globalAttributeType: null,
      workspaceAttributeType,
    };
  }

  async resolveGlobalOrWorkspaceUnitDefinition(
    input: UpsertWorkspaceUnitDefinitionInput & {
      preferGlobal?: boolean | null;
    },
    user?: UserAuthPayload,
  ): Promise<ResolvedWorkspaceUnitDefinition> {
    const authenticated = assertAuthenticated(user);
    const workspaceId = input.workspaceId?.trim();
    if (!workspaceId) throw new Error('workspaceId is required');
    await this.assertCanReadWorkspace({ workspaceId, user: authenticated });

    const normalizedCode =
      this.globalAttributes.normalizeUnitCode(input.code) ||
      input.code?.trim().toUpperCase();
    if (!normalizedCode) throw new Error('code is required');

    const preferGlobal = input.preferGlobal !== false;
    if (preferGlobal) {
      const global =
        await this.globalAttributes.findUnitDefinitionByCodeOrAlias(
          normalizedCode,
        );
      if (global) {
        return {
          scope: 'GLOBAL',
          created: false,
          globalUnitDefinition: global,
          workspaceUnitDefinition: null,
        };
      }
    }

    if (preferGlobal) {
      throw new Error(
        `Unknown unit code "${normalizedCode}". Units must be seeded in the global unit registry (do not create workspace-draft units).`,
      );
    }

    const existing = await this.units.findByCode(workspaceId, normalizedCode);
    const created = !existing;
    const { preferGlobal: _preferGlobal, ...upsertInput } = input;
    const workspaceUnitDefinition = await this.upsertWorkspaceUnitDefinition(
      upsertInput,
      authenticated,
    );
    return {
      scope: 'WORKSPACE',
      created,
      globalUnitDefinition: null,
      workspaceUnitDefinition,
    };
  }

  async resolveGlobalOrWorkspaceAttributeValue(
    input: UpsertWorkspaceAttributeValueInput & {
      preferGlobal?: boolean | null;
    },
    user?: UserAuthPayload,
  ): Promise<ResolvedWorkspaceAttributeValue> {
    const authenticated = assertAuthenticated(user);
    const workspaceId = input.workspaceId?.trim();
    if (!workspaceId) throw new Error('workspaceId is required');
    await this.assertCanReadWorkspace({ workspaceId, user: authenticated });

    const attributeTypeId = input.attributeTypeId?.trim();
    if (!attributeTypeId) throw new Error('attributeTypeId is required');

    const value = normalizeName(input.value);
    if (!value) throw new Error('value is required');

    const preferGlobal = input.preferGlobal !== false;
    if (preferGlobal) {
      const synonyms = normalizeStringArray(input.synonyms);
      const candidates = [value, ...(synonyms ?? [])];
      for (const candidate of candidates) {
        const global =
          await this.globalAttributes.findAttributeValueByValueOrSynonym(
            attributeTypeId,
            candidate,
          );
        if (global) {
          return {
            scope: 'GLOBAL',
            created: false,
            globalAttributeValue: global,
            workspaceAttributeValue: null,
          };
        }
      }
    }

    const existing =
      await this.attributeValues.findByAttributeAndValueOrSynonym(
        workspaceId,
        attributeTypeId,
        value,
      );
    const created = !existing;
    const { preferGlobal: _preferGlobal, ...upsertInput } = input;
    const workspaceAttributeValue = await this.upsertWorkspaceAttributeValue(
      upsertInput,
      authenticated,
    );

    return {
      scope: 'WORKSPACE',
      created,
      globalAttributeValue: null,
      workspaceAttributeValue,
    };
  }

  async promoteWorkspaceTagToGlobal(
    opts: { workspaceTagId: string; targetGlobalTagId?: string | null },
    user?: UserAuthPayload,
  ): Promise<GlobalTag> {
    const authenticated = assertAuthenticated(user);
    const workspaceTag = await this.tags.getById(opts.workspaceTagId);
    if (!workspaceTag) {
      throw new Error(`Workspace tag not found: ${opts.workspaceTagId}`);
    }
    await this.assertCanReadWorkspace({
      workspaceId: workspaceTag.workspaceId,
      user: authenticated,
    });

    const now = new Date();

    if (opts.targetGlobalTagId) {
      const global = await this.globalTags.getTagById(opts.targetGlobalTagId);
      if (!global) {
        throw new Error(`Global tag not found: ${opts.targetGlobalTagId}`);
      }
      await this.tags.update(workspaceTag.id, workspaceTag.workspaceId, {
        globalTagId: global.id,
        updatedAt: now,
        updatedBy: authenticated.id,
      });
      return global;
    }

    if (workspaceTag.globalTagId) {
      const global = await this.globalTags.getTagById(workspaceTag.globalTagId);
      if (!global) {
        throw new Error(`Global tag not found: ${workspaceTag.globalTagId}`);
      }
      return global;
    }

    const createdOrExisting = await this.globalTags.createTag(
      {
        label: workspaceTag.label,
        displayName: workspaceTag.displayName ?? undefined,
        pos: workspaceTag.pos,
        synonyms: workspaceTag.synonyms ?? undefined,
        status: GLOBAL_TAG_STATUS.PROPOSED,
        auditStatus: GLOBAL_TAG_AUDIT_STATUS.PENDING_REVIEW,
        notes: workspaceTag.notes ?? undefined,
        source: workspaceTag.source ?? 'workspace_promotion',
      },
      authenticated,
    );

    await this.tags.update(workspaceTag.id, workspaceTag.workspaceId, {
      globalTagId: createdOrExisting.id,
      updatedAt: now,
      updatedBy: authenticated.id,
    });

    return createdOrExisting;
  }

  async promoteWorkspaceAttributeTypeToGlobal(
    opts: {
      workspaceAttributeTypeId: string;
      targetGlobalAttributeTypeId?: string | null;
    },
    user?: UserAuthPayload,
  ): Promise<GlobalAttributeType> {
    const authenticated = assertAuthenticated(user);
    const workspaceAttributeType = await this.attributeTypes.getById(
      opts.workspaceAttributeTypeId,
    );
    if (!workspaceAttributeType) {
      throw new Error(
        `Workspace attribute type not found: ${opts.workspaceAttributeTypeId}`,
      );
    }
    await this.assertCanReadWorkspace({
      workspaceId: workspaceAttributeType.workspaceId,
      user: authenticated,
    });

    const now = new Date();

    if (opts.targetGlobalAttributeTypeId) {
      const global = await this.globalAttributes.getAttributeTypeById(
        opts.targetGlobalAttributeTypeId,
      );
      if (!global) {
        throw new Error(
          `Global attribute type not found: ${opts.targetGlobalAttributeTypeId}`,
        );
      }
      await this.attributeTypes.update(
        workspaceAttributeType.id,
        workspaceAttributeType.workspaceId,
        {
          globalAttributeTypeId: global.id,
          updatedAt: now,
          updatedBy: authenticated.id,
        },
      );
      return global;
    }

    if (workspaceAttributeType.globalAttributeTypeId) {
      const global = await this.globalAttributes.getAttributeTypeById(
        workspaceAttributeType.globalAttributeTypeId,
      );
      if (!global) {
        throw new Error(
          `Global attribute type not found: ${workspaceAttributeType.globalAttributeTypeId}`,
        );
      }
      return global;
    }

    const existing =
      await this.globalAttributes.findAttributeTypeByNameOrSynonym(
        workspaceAttributeType.name,
      );
    if (existing) {
      await this.attributeTypes.update(
        workspaceAttributeType.id,
        workspaceAttributeType.workspaceId,
        {
          globalAttributeTypeId: existing.id,
          updatedAt: now,
          updatedBy: authenticated.id,
        },
      );
      return existing;
    }

    const created = await this.globalAttributes.createAttributeType(
      {
        name: workspaceAttributeType.name,
        kind: workspaceAttributeType.kind,
        valueType: workspaceAttributeType.valueType,
        dimension: workspaceAttributeType.dimension,
        canonicalUnit: workspaceAttributeType.canonicalUnit,
        allowedUnits: workspaceAttributeType.allowedUnits,
        canonicalValueSetId: workspaceAttributeType.canonicalValueSetId,
        synonyms: workspaceAttributeType.synonyms,
        status: GLOBAL_ATTRIBUTE_STATUS.PROPOSED,
        auditStatus: GLOBAL_ATTRIBUTE_AUDIT_STATUS.PENDING_REVIEW,
        appliesTo: workspaceAttributeType.appliesTo,
        usageHints: workspaceAttributeType.usageHints,
        notes: workspaceAttributeType.notes,
        validationRules: workspaceAttributeType.validationRules,
        source: workspaceAttributeType.source ?? 'workspace_promotion',
      },
      authenticated,
    );

    await this.attributeTypes.update(
      workspaceAttributeType.id,
      workspaceAttributeType.workspaceId,
      {
        globalAttributeTypeId: created.id,
        updatedAt: now,
        updatedBy: authenticated.id,
      },
    );

    return created;
  }

  async promoteWorkspaceUnitDefinitionToGlobal(
    opts: { workspaceUnitDefinitionId: string; targetGlobalUnitCode?: string },
    user?: UserAuthPayload,
  ): Promise<GlobalUnitDefinition> {
    const authenticated = assertAuthenticated(user);
    const workspaceUnit = await this.units.getById(
      opts.workspaceUnitDefinitionId,
    );
    if (!workspaceUnit) {
      throw new Error(
        `Workspace unit definition not found: ${opts.workspaceUnitDefinitionId}`,
      );
    }
    await this.assertCanReadWorkspace({
      workspaceId: workspaceUnit.workspaceId,
      user: authenticated,
    });

    const now = new Date();

    const targetGlobalUnitCode = opts.targetGlobalUnitCode?.trim()
      ? this.globalAttributes.normalizeUnitCode(opts.targetGlobalUnitCode) ||
        opts.targetGlobalUnitCode.trim().toUpperCase()
      : undefined;

    if (targetGlobalUnitCode) {
      const global =
        await this.globalAttributes.getUnitDefinitionByCode(
          targetGlobalUnitCode,
        );
      if (!global) {
        throw new Error(`Global unit not found: ${targetGlobalUnitCode}`);
      }
      await this.units.update(workspaceUnit.id, workspaceUnit.workspaceId, {
        globalUnitCode: global.code,
        updatedAt: now,
        updatedBy: authenticated.id,
      });
      return global;
    }

    if (workspaceUnit.globalUnitCode) {
      const global = await this.globalAttributes.getUnitDefinitionByCode(
        workspaceUnit.globalUnitCode,
      );
      if (!global) {
        throw new Error(
          `Global unit not found: ${workspaceUnit.globalUnitCode}`,
        );
      }
      return global;
    }

    const existing =
      await this.globalAttributes.findUnitDefinitionByCodeOrAlias(
        workspaceUnit.code,
      );
    if (existing) {
      await this.units.update(workspaceUnit.id, workspaceUnit.workspaceId, {
        globalUnitCode: existing.code,
        updatedAt: now,
        updatedBy: authenticated.id,
      });
      return existing;
    }

    const created = await this.globalAttributes.createUnitDefinition(
      {
        code: workspaceUnit.code,
        name: workspaceUnit.name,
        dimension: workspaceUnit.dimension,
        canonicalUnitCode: workspaceUnit.canonicalUnitCode,
        toCanonicalFactor: workspaceUnit.toCanonicalFactor,
        offset: workspaceUnit.offset,
        status: workspaceUnit.status,
        source: workspaceUnit.source ?? 'workspace_promotion',
      },
      authenticated,
    );

    await this.units.update(workspaceUnit.id, workspaceUnit.workspaceId, {
      globalUnitCode: created.code,
      updatedAt: now,
      updatedBy: authenticated.id,
    });

    return created;
  }

  async promoteWorkspaceAttributeValueToGlobal(
    opts: {
      workspaceAttributeValueId: string;
      targetGlobalAttributeValueId?: string;
    },
    user?: UserAuthPayload,
  ): Promise<GlobalAttributeValue> {
    const authenticated = assertAuthenticated(user);
    const workspaceAttributeValue = await this.attributeValues.getById(
      opts.workspaceAttributeValueId,
    );
    if (!workspaceAttributeValue) {
      throw new Error(
        `Workspace attribute value not found: ${opts.workspaceAttributeValueId}`,
      );
    }

    await this.assertCanReadWorkspace({
      workspaceId: workspaceAttributeValue.workspaceId,
      user: authenticated,
    });

    const now = new Date();

    if (opts.targetGlobalAttributeValueId) {
      const global = await this.globalAttributes.getAttributeValueById(
        opts.targetGlobalAttributeValueId,
      );
      if (!global) {
        throw new Error(
          `Global attribute value not found: ${opts.targetGlobalAttributeValueId}`,
        );
      }
      await this.attributeValues.update(
        workspaceAttributeValue.id,
        workspaceAttributeValue.workspaceId,
        {
          globalAttributeValueId: global.id,
          updatedAt: now,
          updatedBy: authenticated.id,
        },
      );
      return global;
    }

    if (workspaceAttributeValue.globalAttributeValueId) {
      const global = await this.globalAttributes.getAttributeValueById(
        workspaceAttributeValue.globalAttributeValueId,
      );
      if (!global) {
        throw new Error(
          `Global attribute value not found: ${workspaceAttributeValue.globalAttributeValueId}`,
        );
      }
      return global;
    }

    let globalAttributeTypeId = workspaceAttributeValue.attributeTypeId;
    if (globalAttributeTypeId.startsWith('WAT')) {
      const workspaceAttributeType = await this.attributeTypes.getById(
        globalAttributeTypeId,
      );
      if (!workspaceAttributeType) {
        throw new Error(
          `Workspace attribute type not found: ${globalAttributeTypeId}`,
        );
      }
      if (!workspaceAttributeType.globalAttributeTypeId) {
        throw new Error(
          'Workspace attribute value references a workspace attribute type that has not been promoted to global. Promote the attribute type first or provide a target global attribute value.',
        );
      }
      globalAttributeTypeId = workspaceAttributeType.globalAttributeTypeId;
    }

    const candidates = new Set<string>([
      workspaceAttributeValue.value,
      ...(workspaceAttributeValue.synonyms ?? []),
    ]);
    for (const candidate of candidates) {
      const existing =
        await this.globalAttributes.findAttributeValueByValueOrSynonym(
          globalAttributeTypeId,
          candidate,
        );
      if (!existing) continue;

      await this.attributeValues.update(
        workspaceAttributeValue.id,
        workspaceAttributeValue.workspaceId,
        {
          globalAttributeValueId: existing.id,
          updatedAt: now,
          updatedBy: authenticated.id,
        },
      );
      return existing;
    }

    const created = await this.globalAttributes.createAttributeValue(
      {
        attributeTypeId: globalAttributeTypeId,
        value: workspaceAttributeValue.value,
        synonyms: workspaceAttributeValue.synonyms,
        codes: workspaceAttributeValue.codes,
        status: GLOBAL_ATTRIBUTE_STATUS.PROPOSED,
        auditStatus: GLOBAL_ATTRIBUTE_AUDIT_STATUS.PENDING_REVIEW,
        source: workspaceAttributeValue.source ?? 'workspace_promotion',
      },
      authenticated,
    );

    await this.attributeValues.update(
      workspaceAttributeValue.id,
      workspaceAttributeValue.workspaceId,
      {
        globalAttributeValueId: created.id,
        updatedAt: now,
        updatedBy: authenticated.id,
      },
    );

    return created;
  }
}

export const createWorkspaceVocabularyService = (config: {
  envConfig: EnvConfig;
  mongoClient: MongoClient;
  authZ: AuthZ;
  globalTagsService: GlobalTagsService;
  globalAttributesService: GlobalAttributesService;
}) => {
  const dbName = 'es-erp';

  const tags = new WorkspaceTagsModel({
    mongoClient: config.mongoClient,
    dbName,
  });

  const attributeTypes = new WorkspaceAttributeTypesModel({
    mongoClient: config.mongoClient,
    dbName,
  });

  const units = new WorkspaceUnitDefinitionsModel({
    mongoClient: config.mongoClient,
    dbName,
  });

  const attributeValues = new WorkspaceAttributeValuesModel({
    mongoClient: config.mongoClient,
    dbName,
  });

  return new WorkspaceVocabularyService({
    authZ: config.authZ,
    tags,
    attributeTypes,
    units,
    attributeValues,
    globalTags: config.globalTagsService,
    globalAttributes: config.globalAttributesService,
  });
};
