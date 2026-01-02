import { type MongoClient, type Collection, Filter } from 'mongodb';
import { generateId } from '../../lib/id-generator';
import {
  type GlobalTagPos,
  type GlobalTagStatus,
  type GlobalTagAuditStatus,
  type GlobalTagRelationType,
} from './constants';

type BaseGlobalDoc = {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  source?: string;
  auditStatus?: GlobalTagAuditStatus;
};

export type GlobalTagDoc = BaseGlobalDoc & {
  label: string;
  displayName?: string | null;
  pos: GlobalTagPos;
  synonyms?: string[] | null;
  status: GlobalTagStatus;
  mergedIntoId?: string | null;
  notes?: string | null;
};

export type GlobalTag = Omit<GlobalTagDoc, '_id'> & {
  id: string;
};

export type ListGlobalTagsQuery = {
  filter?: {
    pos?: GlobalTagPos;
    status?: GlobalTagStatus;
    searchTerm?: string;
  };
  page?: {
    size?: number;
    number?: number;
  };
};

export type GlobalTagRelationDoc = BaseGlobalDoc & {
  fromTagId: string;
  toTagId: string;
  relationType: GlobalTagRelationType;
  confidence?: number;
};

export type GlobalTagRelation = Omit<GlobalTagRelationDoc, '_id'> & {
  id: string;
};

export type ListGlobalTagRelationsQuery = {
  filter?: {
    fromTagId?: string;
    toTagId?: string;
    relationType?: GlobalTagRelationType;
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

export class GlobalTagsModel {
  private collection: Collection<GlobalTagDoc>;

  constructor(config: { mongoClient: MongoClient; dbName: string }) {
    const db = config.mongoClient.db(config.dbName);
    this.collection = db.collection<GlobalTagDoc>('global_tags');
  }

  private map(doc: GlobalTagDoc): GlobalTag {
    const { _id, ...fields } = doc;
    return { ...fields, id: _id };
  }

  async create(input: Omit<GlobalTagDoc, '_id'>) {
    const result = await this.collection.insertOne({
      ...input,
      _id: generateId('GTG', 'GLOBAL'),
    });
    const doc = await this.collection.findOne({ _id: result.insertedId });
    if (!doc) throw new Error('Global tag not found after insert');
    return this.map(doc);
  }

  async update(id: string, updates: Partial<GlobalTagDoc>) {
    await this.collection.updateOne({ _id: id }, { $set: { ...updates } });
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.map(doc) : null;
  }

  async getById(id: string) {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.map(doc) : null;
  }

  async findByLabelOrSynonym(label: string) {
    const normalized = label.trim();
    if (!normalized) return null;
    const initial = await this.collection.findOne({
      $or: [{ label: normalized }, { synonyms: normalized }],
    });
    if (!initial) return null;

    let doc = initial;
    const visited = new Set<string>();
    while (doc.mergedIntoId) {
      if (visited.has(doc._id)) break;
      visited.add(doc._id);
      const nextDoc = await this.collection.findOne({ _id: doc.mergedIntoId });
      if (!nextDoc) break;
      doc = nextDoc;
    }

    return this.map(doc);
  }

  async list(query: ListGlobalTagsQuery) {
    const { filter = {}, page } = query;
    const mongoFilter: Filter<GlobalTagDoc> = {
      ...(filter.pos ? { pos: filter.pos } : {}),
      ...(filter.status ? { status: filter.status } : {}),
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

export class GlobalTagRelationsModel {
  private collection: Collection<GlobalTagRelationDoc>;

  constructor(config: { mongoClient: MongoClient; dbName: string }) {
    const db = config.mongoClient.db(config.dbName);
    this.collection = db.collection<GlobalTagRelationDoc>(
      'global_tag_relations',
    );
  }

  private map(doc: GlobalTagRelationDoc): GlobalTagRelation {
    const { _id, ...fields } = doc;
    return { ...fields, id: _id };
  }

  async create(input: Omit<GlobalTagRelationDoc, '_id'>) {
    const result = await this.collection.insertOne({
      ...input,
      _id: generateId('GTR', 'GLOBAL'),
    });
    const doc = await this.collection.findOne({ _id: result.insertedId });
    if (!doc) throw new Error('Global tag relation not found after insert');
    return this.map(doc);
  }

  async list(query: ListGlobalTagRelationsQuery) {
    const { filter = {}, page } = query;
    const mongoFilter: Filter<GlobalTagRelationDoc> = {
      ...(filter.fromTagId ? { fromTagId: filter.fromTagId } : {}),
      ...(filter.toTagId ? { toTagId: filter.toTagId } : {}),
      ...(filter.relationType ? { relationType: filter.relationType } : {}),
    };

    const limit = page?.size || 50;
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
