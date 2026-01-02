import { type Collection, type Filter, type MongoClient } from 'mongodb';
import { generateId } from '../../lib/id-generator';
import type {
  GlobalAttributeAppliesTo,
  GlobalAttributeAuditStatus,
  GlobalAttributeDimension,
  GlobalAttributeKind,
  GlobalAttributeStatus,
  GlobalAttributeUsageHint,
  GlobalUnitStatus,
  GlobalAttributeValueType,
} from '../global_attributes/constants';
import type {
  GlobalAttributeValidationRules,
  GlobalAttributeValueCodes,
} from '../global_attributes/model';
import type {
  GlobalTagAuditStatus,
  GlobalTagPos,
  GlobalTagStatus,
} from '../global_tags/constants';

type BaseWorkspaceDoc = {
  _id: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  source?: string;
};

export type WorkspaceTagDoc = BaseWorkspaceDoc & {
  label: string;
  displayName?: string | null;
  pos: GlobalTagPos;
  synonyms?: string[] | null;
  status: GlobalTagStatus;
  auditStatus?: GlobalTagAuditStatus;
  notes?: string | null;
  globalTagId?: string | null;
};

export type WorkspaceTag = Omit<WorkspaceTagDoc, '_id'> & {
  id: string;
};

export type ListWorkspaceTagsQuery = {
  filter: {
    workspaceId: string;
    pos?: GlobalTagPos;
    status?: GlobalTagStatus;
    searchTerm?: string;
    promotedToGlobal?: boolean;
  };
  page?: {
    size?: number;
    number?: number;
  };
};

export type WorkspaceAttributeTypeDoc = BaseWorkspaceDoc & {
  name: string;
  kind: GlobalAttributeKind;
  valueType: GlobalAttributeValueType;
  dimension?: GlobalAttributeDimension;
  canonicalUnit?: string;
  allowedUnits?: string[];
  canonicalValueSetId?: string;
  synonyms?: string[];
  status: GlobalAttributeStatus;
  auditStatus?: GlobalAttributeAuditStatus;
  appliesTo?: GlobalAttributeAppliesTo;
  usageHints?: GlobalAttributeUsageHint[];
  notes?: string;
  validationRules?: GlobalAttributeValidationRules;
  globalAttributeTypeId?: string | null;
};

export type WorkspaceAttributeType = Omit<WorkspaceAttributeTypeDoc, '_id'> & {
  id: string;
};

export type ListWorkspaceAttributeTypesQuery = {
  filter: {
    workspaceId: string;
    kind?: GlobalAttributeKind;
    valueType?: GlobalAttributeValueType;
    dimension?: GlobalAttributeDimension;
    status?: GlobalAttributeStatus;
    appliesTo?: GlobalAttributeAppliesTo;
    usageHint?: GlobalAttributeUsageHint;
    searchTerm?: string;
    promotedToGlobal?: boolean;
  };
  page?: {
    size?: number;
    number?: number;
  };
};

export type WorkspaceAttributeValueDoc = BaseWorkspaceDoc & {
  attributeTypeId: string;
  value: string;
  synonyms?: string[];
  codes?: GlobalAttributeValueCodes;
  status: GlobalAttributeStatus;
  auditStatus?: GlobalAttributeAuditStatus;
  globalAttributeValueId?: string | null;
};

export type WorkspaceAttributeValue = Omit<
  WorkspaceAttributeValueDoc,
  '_id'
> & {
  id: string;
};

export type ListWorkspaceAttributeValuesQuery = {
  filter: {
    workspaceId: string;
    attributeTypeId?: string;
    status?: GlobalAttributeStatus;
    auditStatus?: GlobalAttributeAuditStatus;
    searchTerm?: string;
    promotedToGlobal?: boolean;
  };
  page?: {
    size?: number;
    number?: number;
  };
};

export type WorkspaceUnitDefinitionDoc = BaseWorkspaceDoc & {
  code: string;
  name?: string;
  dimension?: GlobalAttributeDimension;
  canonicalUnitCode?: string;
  toCanonicalFactor?: number;
  offset?: number;
  status: GlobalUnitStatus;
  globalUnitCode?: string | null;
};

export type WorkspaceUnitDefinition = Omit<
  WorkspaceUnitDefinitionDoc,
  '_id'
> & {
  id: string;
};

export type ListWorkspaceUnitDefinitionsQuery = {
  filter: {
    workspaceId: string;
    dimension?: GlobalAttributeDimension;
    status?: GlobalUnitStatus;
    searchTerm?: string;
    promotedToGlobal?: boolean;
  };
  page?: {
    size?: number;
    number?: number;
  };
};

const buildSearchFilter = (
  searchTerm: string | undefined,
  fields: string[],
) => {
  if (!searchTerm) return undefined;
  const query = searchTerm.trim();
  if (!query) return undefined;
  const regex = { $regex: query, $options: 'i' };
  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class WorkspaceTagsModel {
  private collection: Collection<WorkspaceTagDoc>;

  constructor(config: { mongoClient: MongoClient; dbName: string }) {
    const db = config.mongoClient.db(config.dbName);
    this.collection = db.collection<WorkspaceTagDoc>('workspace_tags');
  }

  private map(doc: WorkspaceTagDoc): WorkspaceTag {
    const { _id, ...fields } = doc;
    return { ...fields, id: _id };
  }

  async create(input: Omit<WorkspaceTagDoc, '_id'>): Promise<WorkspaceTag> {
    const id = generateId('WTG', input.workspaceId);
    await this.collection.insertOne({ ...input, _id: id });
    const doc = await this.collection.findOne({ _id: id });
    if (!doc) throw new Error('Workspace tag not found after insert');
    return this.map(doc);
  }

  async update(
    id: string,
    workspaceId: string,
    updates: Partial<WorkspaceTagDoc>,
  ): Promise<WorkspaceTag | null> {
    await this.collection.updateOne(
      { _id: id, workspaceId },
      { $set: { ...updates } },
    );
    const doc = await this.collection.findOne({ _id: id, workspaceId });
    return doc ? this.map(doc) : null;
  }

  async getById(id: string): Promise<WorkspaceTag | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.map(doc) : null;
  }

  async findByLabelOrSynonym(workspaceId: string, label: string) {
    const normalized = label.trim();
    if (!normalized) return null;
    const doc = await this.collection.findOne({
      workspaceId,
      $or: [{ label: normalized }, { synonyms: normalized }],
    });
    return doc ? this.map(doc) : null;
  }

  async list(query: ListWorkspaceTagsQuery) {
    const { filter, page } = query;
    const mongoFilter: Filter<WorkspaceTagDoc> = {
      workspaceId: filter.workspaceId,
      ...(filter.pos ? { pos: filter.pos } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.promotedToGlobal === true
        ? { globalTagId: { $ne: null } }
        : {}),
      ...(filter.promotedToGlobal === false ? { globalTagId: null } : {}),
      ...(buildSearchFilter(filter.searchTerm, [
        'label',
        'displayName',
        'synonyms',
      ]) || {}),
    };

    const limit = page?.size || 20;
    const skip = page?.number ? (page.number - 1) * limit : 0;
    const items = await this.collection
      .find(mongoFilter, { limit, skip, sort: { label: 1 } })
      .toArray();
    const total = await this.collection.countDocuments(mongoFilter);

    return {
      items: items.map((doc) => this.map(doc)),
      total,
      limit,
      page: page?.number || 1,
    };
  }
}

export class WorkspaceAttributeTypesModel {
  private collection: Collection<WorkspaceAttributeTypeDoc>;

  constructor(config: { mongoClient: MongoClient; dbName: string }) {
    const db = config.mongoClient.db(config.dbName);
    this.collection = db.collection<WorkspaceAttributeTypeDoc>(
      'workspace_attribute_types',
    );
  }

  private map(doc: WorkspaceAttributeTypeDoc): WorkspaceAttributeType {
    const { _id, ...fields } = doc;
    return { ...fields, id: _id };
  }

  async create(
    input: Omit<WorkspaceAttributeTypeDoc, '_id'>,
  ): Promise<WorkspaceAttributeType> {
    const id = generateId('WAT', input.workspaceId);
    await this.collection.insertOne({ ...input, _id: id });
    const doc = await this.collection.findOne({ _id: id });
    if (!doc) {
      throw new Error('Workspace attribute type not found after insert');
    }
    return this.map(doc);
  }

  async update(
    id: string,
    workspaceId: string,
    updates: Partial<WorkspaceAttributeTypeDoc>,
  ): Promise<WorkspaceAttributeType | null> {
    await this.collection.updateOne(
      { _id: id, workspaceId },
      { $set: { ...updates } },
    );
    const doc = await this.collection.findOne({ _id: id, workspaceId });
    return doc ? this.map(doc) : null;
  }

  async getById(id: string): Promise<WorkspaceAttributeType | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.map(doc) : null;
  }

  async findByNameOrSynonym(workspaceId: string, name: string) {
    const normalized = name.trim();
    if (!normalized) return null;
    const regex = { $regex: `^${escapeRegex(normalized)}$`, $options: 'i' };
    const doc = await this.collection.findOne({
      workspaceId,
      $or: [{ name: regex }, { synonyms: regex }],
    });
    return doc ? this.map(doc) : null;
  }

  async list(query: ListWorkspaceAttributeTypesQuery) {
    const { filter, page } = query;
    const mongoFilter: Filter<WorkspaceAttributeTypeDoc> = {
      workspaceId: filter.workspaceId,
      ...(filter.kind ? { kind: filter.kind } : {}),
      ...(filter.valueType ? { valueType: filter.valueType } : {}),
      ...(filter.dimension ? { dimension: filter.dimension } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.appliesTo ? { appliesTo: filter.appliesTo } : {}),
      ...(filter.usageHint ? { usageHints: { $in: [filter.usageHint] } } : {}),
      ...(filter.promotedToGlobal === true
        ? { globalAttributeTypeId: { $ne: null } }
        : {}),
      ...(filter.promotedToGlobal === false
        ? { globalAttributeTypeId: null }
        : {}),
      ...(buildSearchFilter(filter.searchTerm, ['name', 'synonyms']) || {}),
    };

    const limit = page?.size || 20;
    const skip = page?.number ? (page.number - 1) * limit : 0;
    const items = await this.collection
      .find(mongoFilter, { limit, skip, sort: { name: 1 } })
      .toArray();
    const total = await this.collection.countDocuments(mongoFilter);

    return {
      items: items.map((doc) => this.map(doc)),
      total,
      limit,
      page: page?.number || 1,
    };
  }
}

export class WorkspaceAttributeValuesModel {
  private collection: Collection<WorkspaceAttributeValueDoc>;

  constructor(config: { mongoClient: MongoClient; dbName: string }) {
    const db = config.mongoClient.db(config.dbName);
    this.collection = db.collection<WorkspaceAttributeValueDoc>(
      'workspace_attribute_values',
    );
  }

  private map(doc: WorkspaceAttributeValueDoc): WorkspaceAttributeValue {
    const { _id, ...fields } = doc;
    return { ...fields, id: _id };
  }

  async create(
    input: Omit<WorkspaceAttributeValueDoc, '_id'>,
  ): Promise<WorkspaceAttributeValue> {
    const id = generateId('WAV', input.workspaceId);
    await this.collection.insertOne({ ...input, _id: id });
    const doc = await this.collection.findOne({ _id: id });
    if (!doc) {
      throw new Error('Workspace attribute value not found after insert');
    }
    return this.map(doc);
  }

  async update(
    id: string,
    workspaceId: string,
    updates: Partial<WorkspaceAttributeValueDoc>,
  ): Promise<WorkspaceAttributeValue | null> {
    await this.collection.updateOne(
      { _id: id, workspaceId },
      { $set: { ...updates } },
    );
    const doc = await this.collection.findOne({ _id: id, workspaceId });
    return doc ? this.map(doc) : null;
  }

  async getById(id: string): Promise<WorkspaceAttributeValue | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.map(doc) : null;
  }

  async findByAttributeAndValueOrSynonym(
    workspaceId: string,
    attributeTypeId: string,
    value: string,
  ) {
    const normalized = value.trim();
    if (!normalized) return null;
    const regex = { $regex: `^${escapeRegex(normalized)}$`, $options: 'i' };
    const doc = await this.collection.findOne({
      workspaceId,
      attributeTypeId,
      $or: [{ value: regex }, { synonyms: regex }],
    });
    return doc ? this.map(doc) : null;
  }

  async list(query: ListWorkspaceAttributeValuesQuery) {
    const { filter, page } = query;
    const mongoFilter: Filter<WorkspaceAttributeValueDoc> = {
      workspaceId: filter.workspaceId,
      ...(filter.attributeTypeId
        ? { attributeTypeId: filter.attributeTypeId }
        : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.auditStatus ? { auditStatus: filter.auditStatus } : {}),
      ...(filter.promotedToGlobal === true
        ? { globalAttributeValueId: { $ne: null } }
        : {}),
      ...(filter.promotedToGlobal === false
        ? { globalAttributeValueId: null }
        : {}),
      ...(buildSearchFilter(filter.searchTerm, ['value', 'synonyms']) || {}),
    };

    const limit = page?.size || 20;
    const skip = page?.number ? (page.number - 1) * limit : 0;
    const items = await this.collection
      .find(mongoFilter, { limit, skip, sort: { value: 1 } })
      .toArray();
    const total = await this.collection.countDocuments(mongoFilter);

    return {
      items: items.map((doc) => this.map(doc)),
      total,
      limit,
      page: page?.number || 1,
    };
  }
}

export class WorkspaceUnitDefinitionsModel {
  private collection: Collection<WorkspaceUnitDefinitionDoc>;

  constructor(config: { mongoClient: MongoClient; dbName: string }) {
    const db = config.mongoClient.db(config.dbName);
    this.collection =
      db.collection<WorkspaceUnitDefinitionDoc>('workspace_units');
  }

  private map(doc: WorkspaceUnitDefinitionDoc): WorkspaceUnitDefinition {
    const { _id, ...fields } = doc;
    return { ...fields, id: _id };
  }

  async create(
    input: Omit<WorkspaceUnitDefinitionDoc, '_id'>,
  ): Promise<WorkspaceUnitDefinition> {
    const id = generateId('WUN', input.workspaceId);
    await this.collection.insertOne({ ...input, _id: id });
    const doc = await this.collection.findOne({ _id: id });
    if (!doc) {
      throw new Error('Workspace unit definition not found after insert');
    }
    return this.map(doc);
  }

  async update(
    id: string,
    workspaceId: string,
    updates: Partial<WorkspaceUnitDefinitionDoc>,
  ): Promise<WorkspaceUnitDefinition | null> {
    await this.collection.updateOne(
      { _id: id, workspaceId },
      { $set: { ...updates } },
    );
    const doc = await this.collection.findOne({ _id: id, workspaceId });
    return doc ? this.map(doc) : null;
  }

  async getById(id: string): Promise<WorkspaceUnitDefinition | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.map(doc) : null;
  }

  async findByCode(workspaceId: string, code: string) {
    const normalized = code.trim();
    if (!normalized) return null;
    const regex = { $regex: `^${escapeRegex(normalized)}$`, $options: 'i' };
    const doc = await this.collection.findOne({ workspaceId, code: regex });
    return doc ? this.map(doc) : null;
  }

  async list(query: ListWorkspaceUnitDefinitionsQuery) {
    const { filter, page } = query;
    const mongoFilter: Filter<WorkspaceUnitDefinitionDoc> = {
      workspaceId: filter.workspaceId,
      ...(filter.dimension ? { dimension: filter.dimension } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.promotedToGlobal === true
        ? { globalUnitCode: { $ne: null } }
        : {}),
      ...(filter.promotedToGlobal === false ? { globalUnitCode: null } : {}),
      ...(buildSearchFilter(filter.searchTerm, ['code', 'name']) || {}),
    };

    const limit = page?.size || 20;
    const skip = page?.number ? (page.number - 1) * limit : 0;
    const items = await this.collection
      .find(mongoFilter, { limit, skip, sort: { code: 1 } })
      .toArray();
    const total = await this.collection.countDocuments(mongoFilter);

    return {
      items: items.map((doc) => this.map(doc)),
      total,
      limit,
      page: page?.number || 1,
    };
  }
}
