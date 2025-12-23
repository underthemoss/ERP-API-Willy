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
  GLOBAL_ATTRIBUTE_KIND,
  GLOBAL_ATTRIBUTE_VALUE_TYPE,
} from './constants';
import { type UserAuthPayload } from '../../authentication';
import { type EnvConfig } from '../../config';
import type {
  GlobalAttributeStatus,
  GlobalAttributeAuditStatus,
  GlobalUnitStatus,
  GlobalAttributeKind,
  GlobalAttributeValueType,
  GlobalAttributeDimension,
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

export type UpdateGlobalUnitDefinitionInput = Partial<
  Omit<GlobalUnitDefinitionDoc, '_id' | 'code' | 'createdAt' | 'createdBy'>
>;

export type IngestGlobalAttributeStringInput = {
  raw: string;
  attributeName?: string;
  value?: string;
  kind?: GlobalAttributeKind;
  valueType?: GlobalAttributeValueType;
  dimension?: GlobalAttributeDimension;
  unitCode?: string;
  source?: string;
};

export type IngestGlobalAttributeStringResult = {
  attributeType: GlobalAttributeType;
  attributeValue?: GlobalAttributeValue;
  parsed: {
    raw: string;
    attributeName: string;
    value?: string;
    kind: GlobalAttributeKind;
    valueType: GlobalAttributeValueType;
    dimension?: GlobalAttributeDimension;
    unitCode?: string;
    numericValue?: number;
    booleanValue?: boolean;
    canonicalValue?: number;
    canonicalUnitCode?: string;
    warnings: string[];
  };
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

const BRAND_HINTS = new Set([
  'brand',
  'manufacturer',
  'make',
  'model',
  'sku',
  'mpn',
  'part number',
  'part',
  'family',
  'series',
]);

const UNIT_ALIASES: Record<string, string> = {
  LB: 'LB',
  LBS: 'LB',
  POUND: 'LB',
  POUNDS: 'LB',
  KG: 'KG',
  KGS: 'KG',
  KILOGRAM: 'KG',
  KILOGRAMS: 'KG',
  M: 'M',
  METER: 'M',
  METERS: 'M',
  IN: 'IN',
  INCH: 'IN',
  INCHES: 'IN',
  FT: 'FT',
  FOOT: 'FT',
  FEET: 'FT',
  MI: 'MI',
  MILE: 'MI',
  MILES: 'MI',
  HR: 'HR',
  HOUR: 'HR',
  HOURS: 'HR',
  MIN: 'MIN',
  MINS: 'MIN',
  MINUTE: 'MIN',
  MINUTES: 'MIN',
  SEC: 'SEC',
  SECOND: 'SEC',
  SECONDS: 'SEC',
  S: 'SEC',
  DAY: 'DAY',
  DAYS: 'DAY',
  L: 'L',
  LITER: 'L',
  LITERS: 'L',
  LITRE: 'L',
  LITRES: 'L',
  GA: 'GA',
  GAL: 'GA',
  GALLON: 'GA',
  GALLONS: 'GA',
};

const normalizeName = (value?: string) =>
  value?.trim().replace(/\s+/g, ' ') || '';

const splitRawAttribute = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return { attributeName: '', value: undefined };
  const delimiterMatch = trimmed.match(/^(.+?)(?:\s*[:=]\s*)(.+)$/);
  if (delimiterMatch) {
    return {
      attributeName: normalizeName(delimiterMatch[1]),
      value: delimiterMatch[2].trim(),
    };
  }
  const numericMatch = trimmed.match(
    /^(.+?)\s+(-?\d+(?:\.\d+)?(?:\s*[a-zA-Z]+)?)$/,
  );
  if (numericMatch) {
    return {
      attributeName: normalizeName(numericMatch[1]),
      value: numericMatch[2].trim(),
    };
  }
  return { attributeName: normalizeName(trimmed), value: undefined };
};

const normalizeUnitCode = (unitCode?: string) => {
  if (!unitCode) return undefined;
  const normalized = unitCode.trim().toUpperCase();
  return UNIT_ALIASES[normalized] || normalized;
};

const parseBooleanValue = (value?: string) => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (['true', 'yes', 'y', '1'].includes(normalized)) return true;
  if (['false', 'no', 'n', '0'].includes(normalized)) return false;
  return undefined;
};

const parseNumericValue = (value?: string) => {
  if (!value) return undefined;
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)(?:\s*([a-zA-Z]+))?$/);
  if (!match) return undefined;
  return {
    numericValue: Number.parseFloat(match[1]),
    unitCode: match[2]?.trim(),
  };
};

const inferKind = (name: string, hasNumeric: boolean) => {
  if (hasNumeric) return GLOBAL_ATTRIBUTE_KIND.PHYSICAL;
  const normalized = name.toLowerCase();
  for (const hint of BRAND_HINTS) {
    if (normalized.includes(hint)) return GLOBAL_ATTRIBUTE_KIND.BRAND;
  }
  return GLOBAL_ATTRIBUTE_KIND.PHYSICAL;
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

  async getAttributeValueById(id: string) {
    return this.attributeValues.getById(id);
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

  async updateUnitDefinition(
    code: string,
    updates: UpdateGlobalUnitDefinitionInput,
    user?: UserAuthPayload,
  ): Promise<GlobalUnitDefinition | null> {
    const existing = await this.units.getByCode(code);
    if (!existing) return null;

    const { id, ...existingDoc } = existing;
    const now = new Date();
    const next = { ...existingDoc };

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        (next as Record<string, unknown>)[key] = value;
      }
    });

    return this.units.upsertByCode({
      ...next,
      code: existing.code,
      createdAt: existing.createdAt,
      createdBy: existing.createdBy,
      updatedAt: now,
      updatedBy: user?.id,
    });
  }

  async ingestGlobalAttributeString(
    input: IngestGlobalAttributeStringInput,
    user?: UserAuthPayload,
  ): Promise<IngestGlobalAttributeStringResult> {
    const raw = input.raw?.trim();
    if (!raw) {
      throw new Error('Attribute string is required');
    }

    const warnings: string[] = [];
    const parsedInput = splitRawAttribute(raw);
    const attributeName = normalizeName(
      input.attributeName || parsedInput.attributeName,
    );

    if (!attributeName) {
      throw new Error('Attribute name is required');
    }

    const rawValue = input.value?.trim() || parsedInput.value?.trim();
    const numericParse = parseNumericValue(rawValue);
    const booleanValue = parseBooleanValue(rawValue);
    const normalizedUnitCode = normalizeUnitCode(
      input.unitCode || numericParse?.unitCode,
    );
    const unitDefinition = normalizedUnitCode
      ? await this.units.getByCode(normalizedUnitCode)
      : null;

    const inferredKind =
      input.kind ||
      inferKind(attributeName, Boolean(numericParse?.numericValue !== undefined));
    const inferredValueType =
      input.valueType ||
      (numericParse?.numericValue !== undefined
        ? GLOBAL_ATTRIBUTE_VALUE_TYPE.NUMBER
        : booleanValue !== undefined
          ? GLOBAL_ATTRIBUTE_VALUE_TYPE.BOOLEAN
          : input.dimension || normalizedUnitCode
            ? GLOBAL_ATTRIBUTE_VALUE_TYPE.NUMBER
            : inferredKind === GLOBAL_ATTRIBUTE_KIND.BRAND
              ? GLOBAL_ATTRIBUTE_VALUE_TYPE.STRING
              : rawValue
                ? GLOBAL_ATTRIBUTE_VALUE_TYPE.ENUM
                : GLOBAL_ATTRIBUTE_VALUE_TYPE.STRING);

    const inferredDimension =
      input.dimension || unitDefinition?.dimension || undefined;

    let attributeType = await this.attributeTypes.findByNameOrSynonym(
      attributeName,
    );

    if (!attributeType) {
      attributeType = await this.createAttributeType(
        {
          name: attributeName,
          kind: inferredKind,
          valueType: inferredValueType,
          dimension: inferredDimension,
          canonicalUnit:
            inferredValueType === GLOBAL_ATTRIBUTE_VALUE_TYPE.NUMBER
              ? unitDefinition?.canonicalUnitCode || normalizedUnitCode
              : undefined,
          allowedUnits:
            inferredValueType === GLOBAL_ATTRIBUTE_VALUE_TYPE.NUMBER &&
            normalizedUnitCode
              ? [normalizedUnitCode]
              : undefined,
          source: input.source || 'freeform',
        },
        user,
      );
    }

    let attributeValue: GlobalAttributeValue | undefined;
    if (rawValue && attributeType.valueType === GLOBAL_ATTRIBUTE_VALUE_TYPE.ENUM) {
      const existingValue =
        await this.attributeValues.findByAttributeAndValueOrSynonym(
          attributeType.id,
          rawValue,
        );
      attributeValue =
        existingValue ||
        (await this.createAttributeValue(
          {
            attributeTypeId: attributeType.id,
            value: rawValue,
            source: input.source || 'freeform',
          },
          user,
        ));
    }

    let numericValue: number | undefined;
    let canonicalValue: number | undefined;
    let canonicalUnitCode: string | undefined;
    if (attributeType.valueType === GLOBAL_ATTRIBUTE_VALUE_TYPE.NUMBER && rawValue) {
      if (numericParse?.numericValue === undefined) {
        warnings.push('Value is not numeric');
      } else {
        numericValue = numericParse.numericValue;
        if (!normalizedUnitCode) {
          warnings.push('Unit code missing');
        } else {
          canonicalUnitCode =
            unitDefinition?.canonicalUnitCode ||
            attributeType.canonicalUnit ||
            normalizedUnitCode;
          const factor = unitDefinition?.toCanonicalFactor ?? 1;
          const offset = unitDefinition?.offset ?? 0;
          canonicalValue = (numericValue + offset) * factor;
        }
      }
    }

    if (
      attributeType.valueType === GLOBAL_ATTRIBUTE_VALUE_TYPE.BOOLEAN &&
      rawValue &&
      booleanValue === undefined
    ) {
      warnings.push('Value is not boolean');
    }

    return {
      attributeType,
      attributeValue,
      parsed: {
        raw,
        attributeName,
        value: rawValue,
        kind: attributeType.kind,
        valueType: attributeType.valueType,
        dimension: attributeType.dimension || inferredDimension,
        unitCode: normalizedUnitCode,
        numericValue,
        booleanValue,
        canonicalValue,
        canonicalUnitCode,
        warnings,
      },
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
