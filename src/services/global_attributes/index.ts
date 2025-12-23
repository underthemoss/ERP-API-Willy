import { type MongoClient } from 'mongodb';
import {
  GlobalAttributeTypesModel,
  GlobalAttributeValuesModel,
  GlobalAttributeRelationsModel,
  GlobalUnitsModel,
  type GlobalAttributeType,
  type GlobalAttributeValue,
  type GlobalAttributeRelation,
  type GlobalUnitDefinition,
  type ListGlobalAttributeTypesQuery,
  type ListGlobalAttributeValuesQuery,
  type ListGlobalAttributeRelationsQuery,
  type ListGlobalUnitsQuery,
  type GlobalAttributeTypeDoc,
  type GlobalAttributeValueDoc,
  type GlobalAttributeRelationDoc,
  type GlobalUnitDefinitionDoc,
} from './model';
import {
  GLOBAL_ATTRIBUTE_STATUS,
  GLOBAL_ATTRIBUTE_AUDIT_STATUS,
  GLOBAL_UNIT_STATUS,
} from './constants';
import { type UserAuthPayload } from '../../authentication';
import { type EnvConfig } from '../../config';
import type {
  GlobalAttributeStatus,
  GlobalAttributeAuditStatus,
  GlobalUnitStatus,
} from './constants';

export type {
  GlobalAttributeType,
  GlobalAttributeValue,
  GlobalAttributeRelation,
  GlobalUnitDefinition,
  ListGlobalAttributeTypesQuery,
  ListGlobalAttributeValuesQuery,
  ListGlobalAttributeRelationsQuery,
  ListGlobalUnitsQuery,
} from './model';
export * from './constants';

export type CreateGlobalAttributeTypeInput = Omit<
  GlobalAttributeTypeDoc,
  '_id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status' | 'auditStatus'
> & {
  status?: GlobalAttributeStatus;
  auditStatus?: GlobalAttributeAuditStatus;
};

export type CreateGlobalAttributeValueInput = Omit<
  GlobalAttributeValueDoc,
  '_id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status' | 'auditStatus'
> & {
  status?: GlobalAttributeStatus;
  auditStatus?: GlobalAttributeAuditStatus;
};

export type CreateGlobalAttributeRelationInput = Omit<
  GlobalAttributeRelationDoc,
  '_id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
>;

export type CreateGlobalUnitDefinitionInput = Omit<
  GlobalUnitDefinitionDoc,
  '_id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'
> & {
  status?: GlobalUnitStatus;
};

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

export class GlobalAttributesService {
  private attributeTypes: GlobalAttributeTypesModel;
  private attributeValues: GlobalAttributeValuesModel;
  private attributeRelations: GlobalAttributeRelationsModel;
  private units: GlobalUnitsModel;

  constructor(config: {
    attributeTypes: GlobalAttributeTypesModel;
    attributeValues: GlobalAttributeValuesModel;
    attributeRelations: GlobalAttributeRelationsModel;
    units: GlobalUnitsModel;
  }) {
    this.attributeTypes = config.attributeTypes;
    this.attributeValues = config.attributeValues;
    this.attributeRelations = config.attributeRelations;
    this.units = config.units;
  }

  async createAttributeType(
    input: CreateGlobalAttributeTypeInput,
    user?: UserAuthPayload,
  ): Promise<GlobalAttributeType> {
    const now = new Date();
    return this.attributeTypes.create({
      ...input,
      status: input.status ?? GLOBAL_ATTRIBUTE_STATUS.ACTIVE,
      auditStatus:
        input.auditStatus ?? GLOBAL_ATTRIBUTE_AUDIT_STATUS.PENDING_REVIEW,
      createdAt: now,
      updatedAt: now,
      createdBy: user?.id,
      updatedBy: user?.id,
    });
  }

  async updateAttributeType(
    id: string,
    updates: Partial<GlobalAttributeTypeDoc>,
    user?: UserAuthPayload,
  ): Promise<GlobalAttributeType | null> {
    return this.attributeTypes.update(id, {
      ...updates,
      updatedAt: new Date(),
      updatedBy: user?.id,
    });
  }

  async getAttributeTypeById(id: string) {
    return this.attributeTypes.getById(id);
  }

  async listAttributeTypes(query: ListGlobalAttributeTypesQuery) {
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

  async createAttributeValue(
    input: CreateGlobalAttributeValueInput,
    user?: UserAuthPayload,
  ): Promise<GlobalAttributeValue> {
    const existing = await this.attributeValues.findByAttributeAndValue(
      input.attributeTypeId,
      input.value,
    );
    if (existing) {
      return existing;
    }
    const now = new Date();
    return this.attributeValues.create({
      ...input,
      status: input.status ?? GLOBAL_ATTRIBUTE_STATUS.ACTIVE,
      auditStatus:
        input.auditStatus ?? GLOBAL_ATTRIBUTE_AUDIT_STATUS.PENDING_REVIEW,
      createdAt: now,
      updatedAt: now,
      createdBy: user?.id,
      updatedBy: user?.id,
    });
  }

  async updateAttributeValue(
    id: string,
    updates: Partial<GlobalAttributeValueDoc>,
    user?: UserAuthPayload,
  ): Promise<GlobalAttributeValue | null> {
    return this.attributeValues.update(id, {
      ...updates,
      updatedAt: new Date(),
      updatedBy: user?.id,
    });
  }

  async listAttributeValues(query: ListGlobalAttributeValuesQuery) {
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

  async createAttributeRelation(
    input: CreateGlobalAttributeRelationInput,
    user?: UserAuthPayload,
  ): Promise<GlobalAttributeRelation> {
    const now = new Date();
    return this.attributeRelations.create({
      ...input,
      createdAt: now,
      updatedAt: now,
      createdBy: user?.id,
      updatedBy: user?.id,
    });
  }

  async listAttributeRelations(query: ListGlobalAttributeRelationsQuery) {
    const result = await this.attributeRelations.list(query);
    return {
      items: result.items,
      page: buildPageInfo({
        page: result.page,
        size: result.limit,
        total: result.total,
      }),
    };
  }

  async createUnitDefinition(
    input: CreateGlobalUnitDefinitionInput,
    user?: UserAuthPayload,
  ): Promise<GlobalUnitDefinition> {
    const now = new Date();
    return this.units.upsertByCode({
      ...input,
      status: input.status ?? GLOBAL_UNIT_STATUS.ACTIVE,
      createdAt: now,
      updatedAt: now,
      createdBy: user?.id,
      updatedBy: user?.id,
    });
  }

  async getUnitDefinitionByCode(code: string) {
    return this.units.getByCode(code);
  }

  async listUnitDefinitions(query: ListGlobalUnitsQuery) {
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
}

export const createGlobalAttributesService = (config: {
  envConfig: EnvConfig;
  mongoClient: MongoClient;
}) => {
  const dbName =
    config.envConfig.GLOBAL_LIBRARY_DB_NAME || 'es-erp-global';
  const attributeTypes = new GlobalAttributeTypesModel({
    mongoClient: config.mongoClient,
    dbName,
  });
  const attributeValues = new GlobalAttributeValuesModel({
    mongoClient: config.mongoClient,
    dbName,
  });
  const attributeRelations = new GlobalAttributeRelationsModel({
    mongoClient: config.mongoClient,
    dbName,
  });
  const units = new GlobalUnitsModel({ mongoClient: config.mongoClient, dbName });

  return new GlobalAttributesService({
    attributeTypes,
    attributeValues,
    attributeRelations,
    units,
  });
};
