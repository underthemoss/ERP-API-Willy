import { type MongoClient, type Db, type Collection, Filter } from 'mongodb';
import { generateId } from '../../lib/id-generator';
import {
  type GlobalAttributeKind,
  type GlobalAttributeValueType,
  type GlobalAttributeDimension,
  type GlobalAttributeStatus,
  type GlobalAttributeAuditStatus,
  type GlobalAttributeAppliesTo,
  type GlobalAttributeUsageHint,
  type GlobalAttributeRelationType,
  type GlobalUnitStatus,
} from './constants';

type BaseGlobalDoc = {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  source?: string;
  auditStatus?: GlobalAttributeAuditStatus;
};

export type GlobalAttributeValidationRules = {
  min?: number;
  max?: number;
  precision?: number;
};

export type GlobalAttributeTypeDoc = BaseGlobalDoc & {
  name: string;
  kind: GlobalAttributeKind;
  valueType: GlobalAttributeValueType;
  dimension?: GlobalAttributeDimension;
  canonicalUnit?: string;
  allowedUnits?: string[];
  canonicalValueSetId?: string;
  synonyms?: string[];
  status: GlobalAttributeStatus;
  appliesTo?: GlobalAttributeAppliesTo;
  usageHints?: GlobalAttributeUsageHint[];
  notes?: string;
  validationRules?: GlobalAttributeValidationRules;
};

export type GlobalAttributeType = Omit<GlobalAttributeTypeDoc, '_id'> & {
  id: string;
};

export type ListGlobalAttributeTypesQuery = {
  filter?: {
    kind?: GlobalAttributeKind;
    valueType?: GlobalAttributeValueType;
    dimension?: GlobalAttributeDimension;
    status?: GlobalAttributeStatus;
    appliesTo?: GlobalAttributeAppliesTo;
    usageHint?: GlobalAttributeUsageHint;
    searchTerm?: string;
  };
  page?: {
    size?: number;
    number?: number;
  };
};

export type GlobalAttributeValueCodes = {
  hex?: string;
  ral?: string;
  pantone?: string;
  lab?: {
    l: number;
    a: number;
    b: number;
  };
};

export type GlobalAttributeValueDoc = BaseGlobalDoc & {
  attributeTypeId: string;
  value: string;
  synonyms?: string[];
  codes?: GlobalAttributeValueCodes;
  status: GlobalAttributeStatus;
};

export type GlobalAttributeValue = Omit<GlobalAttributeValueDoc, '_id'> & {
  id: string;
};

export type ListGlobalAttributeValuesQuery = {
  filter?: {
    attributeTypeId?: string;
    status?: GlobalAttributeStatus;
    searchTerm?: string;
  };
  page?: {
    size?: number;
    number?: number;
  };
};

export type GlobalAttributeRelationDoc = BaseGlobalDoc & {
  fromAttributeId: string;
  toAttributeId: string;
  relationType: GlobalAttributeRelationType;
  confidence?: number;
};

export type GlobalAttributeRelation = Omit<GlobalAttributeRelationDoc, '_id'> & {
  id: string;
};

export type ListGlobalAttributeRelationsQuery = {
  filter?: {
    fromAttributeId?: string;
    toAttributeId?: string;
    relationType?: GlobalAttributeRelationType;
  };
  page?: {
    size?: number;
    number?: number;
  };
};

export type GlobalUnitDefinitionDoc = BaseGlobalDoc & {
  code: string;
  name?: string;
  dimension?: GlobalAttributeDimension;
  canonicalUnitCode?: string;
  toCanonicalFactor?: number;
  offset?: number;
  status: GlobalUnitStatus;
};

export type GlobalUnitDefinition = Omit<GlobalUnitDefinitionDoc, '_id'> & {
  id: string;
};

export type ListGlobalUnitsQuery = {
  filter?: {
    dimension?: GlobalAttributeDimension;
    status?: GlobalUnitStatus;
    searchTerm?: string;
  };
  page?: {
    size?: number;
    number?: number;
  };
};

const buildSearchFilter = (searchTerm: string | undefined, fields: string[]) => {
  if (!searchTerm) return undefined;
  const query = searchTerm.trim();
  if (!query) return undefined;
  const regex = { $regex: query, $options: 'i' };
  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
};

export class GlobalAttributeTypesModel {
  private collection: Collection<GlobalAttributeTypeDoc>;

  constructor(config: { mongoClient: MongoClient; dbName: string }) {
    const db = config.mongoClient.db(config.dbName);
    this.collection = db.collection<GlobalAttributeTypeDoc>(
      'global_attribute_types',
    );
  }

  private map(doc: GlobalAttributeTypeDoc): GlobalAttributeType {
    const { _id, ...fields } = doc;
    return { ...fields, id: _id };
  }

  async create(input: Omit<GlobalAttributeTypeDoc, '_id'>) {
    const result = await this.collection.insertOne({
      ...input,
      _id: generateId('GAT', 'GLOBAL'),
    });
    const doc = await this.collection.findOne({ _id: result.insertedId });
    if (!doc) throw new Error('Global attribute type not found after insert');
    return this.map(doc);
  }

  async update(id: string, updates: Partial<GlobalAttributeTypeDoc>) {
    await this.collection.updateOne(
      { _id: id },
      { $set: { ...updates } },
    );
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.map(doc) : null;
  }

  async getById(id: string) {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.map(doc) : null;
  }

  async list(query: ListGlobalAttributeTypesQuery) {
    const { filter = {}, page } = query;
    const mongoFilter: Filter<GlobalAttributeTypeDoc> = {
      ...(filter.kind ? { kind: filter.kind } : {}),
      ...(filter.valueType ? { valueType: filter.valueType } : {}),
      ...(filter.dimension ? { dimension: filter.dimension } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.appliesTo ? { appliesTo: filter.appliesTo } : {}),
      ...(filter.usageHint
        ? { usageHints: { $in: [filter.usageHint] } }
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

export class GlobalAttributeValuesModel {
  private collection: Collection<GlobalAttributeValueDoc>;

  constructor(config: { mongoClient: MongoClient; dbName: string }) {
    const db = config.mongoClient.db(config.dbName);
    this.collection = db.collection<GlobalAttributeValueDoc>(
      'global_attribute_values',
    );
  }

  private map(doc: GlobalAttributeValueDoc): GlobalAttributeValue {
    const { _id, ...fields } = doc;
    return { ...fields, id: _id };
  }

  async create(input: Omit<GlobalAttributeValueDoc, '_id'>) {
    const result = await this.collection.insertOne({
      ...input,
      _id: generateId('GAV', 'GLOBAL'),
    });
    const doc = await this.collection.findOne({ _id: result.insertedId });
    if (!doc) throw new Error('Global attribute value not found after insert');
    return this.map(doc);
  }

  async update(id: string, updates: Partial<GlobalAttributeValueDoc>) {
    await this.collection.updateOne({ _id: id }, { $set: { ...updates } });
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.map(doc) : null;
  }

  async getById(id: string) {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.map(doc) : null;
  }

  async findByAttributeAndValue(attributeTypeId: string, value: string) {
    const doc = await this.collection.findOne({
      attributeTypeId,
      value: { $regex: `^${value}$`, $options: 'i' },
    });
    return doc ? this.map(doc) : null;
  }

  async list(query: ListGlobalAttributeValuesQuery) {
    const { filter = {}, page } = query;
    const mongoFilter: Filter<GlobalAttributeValueDoc> = {
      ...(filter.attributeTypeId
        ? { attributeTypeId: filter.attributeTypeId }
        : {}),
      ...(filter.status ? { status: filter.status } : {}),
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

export class GlobalAttributeRelationsModel {
  private collection: Collection<GlobalAttributeRelationDoc>;

  constructor(config: { mongoClient: MongoClient; dbName: string }) {
    const db = config.mongoClient.db(config.dbName);
    this.collection = db.collection<GlobalAttributeRelationDoc>(
      'global_attribute_relations',
    );
  }

  private map(doc: GlobalAttributeRelationDoc): GlobalAttributeRelation {
    const { _id, ...fields } = doc;
    return { ...fields, id: _id };
  }

  async create(input: Omit<GlobalAttributeRelationDoc, '_id'>) {
    const result = await this.collection.insertOne({
      ...input,
      _id: generateId('GAR', 'GLOBAL'),
    });
    const doc = await this.collection.findOne({ _id: result.insertedId });
    if (!doc) throw new Error('Global attribute relation not found after insert');
    return this.map(doc);
  }

  async list(query: ListGlobalAttributeRelationsQuery) {
    const { filter = {}, page } = query;
    const mongoFilter: Filter<GlobalAttributeRelationDoc> = {
      ...(filter.fromAttributeId
        ? { fromAttributeId: filter.fromAttributeId }
        : {}),
      ...(filter.toAttributeId ? { toAttributeId: filter.toAttributeId } : {}),
      ...(filter.relationType ? { relationType: filter.relationType } : {}),
    };
    const limit = page?.size || 20;
    const skip = page?.number ? (page.number - 1) * limit : 0;
    const items = await this.collection
      .find(mongoFilter, { limit, skip })
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

export class GlobalUnitsModel {
  private collection: Collection<GlobalUnitDefinitionDoc>;

  constructor(config: { mongoClient: MongoClient; dbName: string }) {
    const db = config.mongoClient.db(config.dbName);
    this.collection = db.collection<GlobalUnitDefinitionDoc>('global_units');
  }

  private map(doc: GlobalUnitDefinitionDoc): GlobalUnitDefinition {
    const { _id, ...fields } = doc;
    return { ...fields, id: _id };
  }

  async upsertByCode(input: Omit<GlobalUnitDefinitionDoc, '_id'>) {
    await this.collection.updateOne(
      { code: input.code },
      { $set: { ...input, _id: input.code } },
      { upsert: true },
    );
    const doc = await this.collection.findOne({ code: input.code });
    if (!doc) throw new Error('Global unit not found after upsert');
    return this.map(doc);
  }

  async getByCode(code: string) {
    const doc = await this.collection.findOne({ code });
    return doc ? this.map(doc) : null;
  }

  async list(query: ListGlobalUnitsQuery) {
    const { filter = {}, page } = query;
    const mongoFilter: Filter<GlobalUnitDefinitionDoc> = {
      ...(filter.dimension ? { dimension: filter.dimension } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(buildSearchFilter(filter.searchTerm, ['code', 'name']) || {}),
    };
    const limit = page?.size || 50;
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
