import { type MongoClient } from 'mongodb';
import {
  GlobalAttributeTypesModel,
  GlobalAttributeValuesModel,
  GlobalAttributeRelationsModel,
  GlobalAttributeParseRulesModel,
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
  GlobalAttributeParseRule,
  GlobalUnitDefinition,
  ListGlobalAttributeTypesQuery,
  ListGlobalAttributeValuesQuery,
  ListGlobalAttributeRelationsQuery,
  ListGlobalAttributeParseRulesQuery,
  ListGlobalUnitsQuery,
} from './model';
export * from './constants';

export type CreateGlobalAttributeTypeInput = Omit<
  GlobalAttributeTypeDoc,
  | '_id'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'updatedBy'
  | 'status'
  | 'auditStatus'
> & {
  status?: GlobalAttributeStatus;
  auditStatus?: GlobalAttributeAuditStatus;
};

export type CreateGlobalAttributeValueInput = Omit<
  GlobalAttributeValueDoc,
  | '_id'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'updatedBy'
  | 'status'
  | 'auditStatus'
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
    contextTagIds?: string[];
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

const UNIT_ALIASES: Record<string, string> = {
  LB: 'LB',
  LBS: 'LB',
  POUND: 'LB',
  POUNDS: 'LB',
  KG: 'KG',
  KGS: 'KG',
  KILOGRAM: 'KG',
  KILOGRAMS: 'KG',
  G: 'G',
  GRAM: 'G',
  GRAMS: 'G',
  MG: 'MG',
  MILLIGRAM: 'MG',
  MILLIGRAMS: 'MG',
  OZ: 'OZ',
  OUNCE: 'OZ',
  OUNCES: 'OZ',
  TON: 'TON',
  TONS: 'TON',
  TONNE: 'TONNE',
  TONNES: 'TONNE',
  M: 'M',
  METER: 'M',
  METERS: 'M',
  CM: 'CM',
  CENTIMETER: 'CM',
  CENTIMETERS: 'CM',
  MM: 'MM',
  MILLIMETER: 'MM',
  MILLIMETERS: 'MM',
  KM: 'KM',
  KILOMETER: 'KM',
  KILOMETERS: 'KM',
  IN: 'IN',
  INCH: 'IN',
  INCHES: 'IN',
  FT: 'FT',
  FOOT: 'FT',
  FEET: 'FT',
  YD: 'YD',
  YARD: 'YD',
  YARDS: 'YD',
  MI: 'MI',
  MILE: 'MI',
  MILES: 'MI',
  M2: 'M2',
  SQM: 'M2',
  SQ_M: 'M2',
  CM2: 'CM2',
  SQCM: 'CM2',
  MM2: 'MM2',
  SQMM: 'MM2',
  FT2: 'FT2',
  SQFT: 'FT2',
  IN2: 'IN2',
  SQIN: 'IN2',
  YD2: 'YD2',
  SQYD: 'YD2',
  ACRE: 'ACRE',
  M3: 'M3',
  CUM: 'M3',
  CM3: 'CM3',
  CC: 'CM3',
  MM3: 'MM3',
  FT3: 'FT3',
  CUFT: 'FT3',
  IN3: 'IN3',
  CUIN: 'IN3',
  YD3: 'YD3',
  CUYD: 'YD3',
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
  ML: 'ML',
  MILLILITER: 'ML',
  MILLILITERS: 'ML',
  MILLILITRE: 'ML',
  MILLILITRES: 'ML',
  GA: 'GA',
  GAL: 'GA',
  GALLON: 'GA',
  GALLONS: 'GA',
  K: 'K',
  KELVIN: 'K',
  C: 'C',
  CELSIUS: 'C',
  F: 'F',
  FAHRENHEIT: 'F',
  MPS: 'MPS',
  'M/S': 'MPS',
  KPH: 'KPH',
  'KM/H': 'KPH',
  'KM/HR': 'KPH',
  MPH: 'MPH',
  'MI/H': 'MPH',
  'MILE/H': 'MPH',
  'MILES/H': 'MPH',
  'MILE/HR': 'MPH',
  'MILES/HR': 'MPH',
  FPS: 'FPS',
  'FT/S': 'FPS',
  'FT/MIN': 'FT_MIN',
  N: 'N',
  NEWTON: 'N',
  KN: 'KN',
  KILONEWTON: 'KN',
  LBF: 'LBF',
  POUND_FORCE: 'LBF',
  J: 'J',
  JOULE: 'J',
  KJ: 'KJ',
  MJ: 'MJ',
  KWH: 'KWH',
  BTU: 'BTU',
  W: 'W',
  WATT: 'W',
  KW: 'KW',
  KILOWATT: 'KW',
  HP: 'HP',
  HORSEPOWER: 'HP',
  PA: 'PA',
  PASCAL: 'PA',
  KPA: 'KPA',
  MPA: 'MPA',
  BAR: 'BAR',
  PSI: 'PSI',
  KG_M3: 'KG_M3',
  'KG/M3': 'KG_M3',
  G_CM3: 'G_CM3',
  'G/CM3': 'G_CM3',
  LB_FT3: 'LB_FT3',
  'LB/FT3': 'LB_FT3',
  // ANGLE
  DEG: 'DEG',
  DEGS: 'DEG',
  DEGREE: 'DEG',
  DEGREES: 'DEG',
  '°': 'DEG',
  RAD: 'RAD',
  RADIAN: 'RAD',
  RADIANS: 'RAD',
  // FREQUENCY
  HZ: 'HZ',
  HERTZ: 'HZ',
  RPM: 'RPM',
  // ACCELERATION
  MPS2: 'MPS2',
  'M/S2': 'MPS2',
  FT_S2: 'FT_S2',
  'FT/S2': 'FT_S2',
  // TORQUE
  N_M: 'N_M',
  'N-M': 'N_M',
  NM: 'N_M',
  FT_LB: 'FT_LB',
  'FT-LB': 'FT_LB',
  FTLB: 'FT_LB',
  'LB-FT': 'FT_LB',
  LBFT: 'FT_LB',
  IN_LB: 'IN_LB',
  'IN-LB': 'IN_LB',
  INLB: 'IN_LB',
  // FLOW RATE
  M3_S: 'M3_S',
  L_S: 'L_S',
  'L/S': 'L_S',
  L_MIN: 'L_MIN',
  'L/MIN': 'L_MIN',
  LPM: 'L_MIN',
  GPM: 'GPM',
  'GAL/MIN': 'GPM',
  'GA/MIN': 'GPM',
  CFM: 'CFM',
  // ELECTRICAL
  V: 'V',
  KV: 'KV',
  A: 'A',
  AMP: 'A',
  AMPS: 'A',
  OHM: 'OHM',
  KOHM: 'KOHM',
  MOHM: 'MOHM',
  // VOLUME + FLOW variants commonly found in spec sheets
  QT: 'QT',
  QTS: 'QT',
  QUART: 'QT',
  QUARTS: 'QT',
  CU_IN: 'IN3',
  CU_FT: 'FT3',
  'L/HR': 'L_HR',
  LHR: 'L_HR',
  LPH: 'L_HR',
  'GAL/HR': 'GA_HR',
  'GA/HR': 'GA_HR',
  GPH: 'GA_HR',
};

const normalizeName = (value?: string) =>
  value?.trim().replace(/\s+/g, ' ') || '';

const normalizeParseKey = (value?: string) => {
  if (!value) return '';
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
};

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
    /^(.+?)\s+(-?\d+(?:\.\d+)?(?:\s*[a-zA-Z][a-zA-Z0-9_/-]*)?)$/,
  );
  if (numericMatch) {
    return {
      attributeName: normalizeName(numericMatch[1]),
      value: numericMatch[2].trim(),
    };
  }
  return { attributeName: normalizeName(trimmed), value: undefined };
};

const extractContextTokens = (value: string) => {
  const tokens = normalizeParseKey(value).split('_').filter(Boolean);
  return tokens.filter((token) => CONTEXTUAL_NAME_TOKENS.has(token));
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
    )}). Use an atomic measurable quantity (e.g., weight, volume, force) and put qualifiers/components into context_tag_ids[].`,
  );
};

const normalizeUnitCode = (unitCode?: string) => {
  if (!unitCode) return undefined;
  const normalized = unitCode
    .trim()
    .replace(/²/g, '2')
    .replace(/³/g, '3')
    .toUpperCase();
  return UNIT_ALIASES[normalized] || normalized;
};

const normalizeNumericUnitString = (value: string) => {
  return (
    value
      .trim()
      // Remove thousands separators inside numbers: 8,807 -> 8807
      .replace(/(?<=\d),(?=\d)/g, '')
      // Normalize common symbols found in spec sheets
      .replace(/°/g, 'deg')
      .replace(/²/g, '2')
      .replace(/³/g, '3')
      // Normalize spaces around slashes: "L /hr" -> "L/hr"
      .replace(/\s*\/\s*/g, '/')
      // Common multi-token units found in spec sheets
      .replace(/\bcu\s+in\b/gi, 'cuin')
      .replace(/\bcu\s+ft\b/gi, 'cuft')
      .replace(/\bkm\/hr\b/gi, 'km/hr')
  );
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
  const normalized = normalizeNumericUnitString(value);
  const match = normalized.match(
    /^(-?(?:\d+(?:\.\d+)?|\.\d+))(?:\s*([a-zA-Z][a-zA-Z0-9_/-]*))?/,
  );
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
  private parseRules: GlobalAttributeParseRulesModel;
  private units: GlobalUnitsModel;

  constructor(config: {
    attributeTypes: GlobalAttributeTypesModel;
    attributeValues: GlobalAttributeValuesModel;
    attributeRelations: GlobalAttributeRelationsModel;
    parseRules: GlobalAttributeParseRulesModel;
    units: GlobalUnitsModel;
  }) {
    this.attributeTypes = config.attributeTypes;
    this.attributeValues = config.attributeValues;
    this.attributeRelations = config.attributeRelations;
    this.parseRules = config.parseRules;
    this.units = config.units;
  }

  async createAttributeType(
    input: CreateGlobalAttributeTypeInput,
    user?: UserAuthPayload,
  ): Promise<GlobalAttributeType> {
    const name = normalizeName(input.name);
    if (!name) {
      throw new Error('Attribute type name is required');
    }
    if (name.includes('_')) {
      throw new Error(
        `Invalid attribute type name: "${name}". Use an atomic attribute type (e.g., "power") and put qualifiers into context tags.`,
      );
    }
    if (input.synonyms?.some((synonym) => synonym.includes('_'))) {
      throw new Error(
        'Invalid attribute type synonyms: underscores indicate blended concepts; use atomic types + context tags.',
      );
    }
    if (input.kind === GLOBAL_ATTRIBUTE_KIND.PHYSICAL) {
      assertAtomicPhysicalAttributeTypeName(name);
      input.synonyms?.forEach((synonym) =>
        assertAtomicPhysicalAttributeTypeName(synonym),
      );
    }

    const now = new Date();
    return this.attributeTypes.create({
      ...input,
      name,
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
    const existing = await this.attributeTypes.getById(id);
    if (!existing) return null;

    const nextKind = updates.kind ?? existing.kind;
    const nextName =
      updates.name !== undefined ? normalizeName(updates.name) : existing.name;
    if (!nextName) {
      throw new Error('Attribute type name is required');
    }
    if (nextName.includes('_')) {
      throw new Error(
        `Invalid attribute type name: "${nextName}". Use an atomic attribute type (e.g., "power") and put qualifiers into context tags.`,
      );
    }
    if (updates.synonyms?.some((synonym) => synonym.includes('_'))) {
      throw new Error(
        'Invalid attribute type synonyms: underscores indicate blended concepts; use atomic types + context tags.',
      );
    }
    if (nextKind === GLOBAL_ATTRIBUTE_KIND.PHYSICAL) {
      assertAtomicPhysicalAttributeTypeName(nextName);
      updates.synonyms?.forEach((synonym) =>
        assertAtomicPhysicalAttributeTypeName(synonym),
      );
    }

    return this.attributeTypes.update(id, {
      ...updates,
      ...(updates.name !== undefined ? { name: nextName } : {}),
      updatedAt: new Date(),
      updatedBy: user?.id,
    });
  }

  async getAttributeTypeById(id: string) {
    return this.attributeTypes.getById(id);
  }

  async findAttributeTypeByNameOrSynonym(name: string) {
    const normalized = normalizeName(name);
    if (!normalized) return null;
    return this.attributeTypes.findByNameOrSynonym(normalized);
  }

  async findAttributeValueByValueOrSynonym(
    attributeTypeId: string,
    value: string,
  ) {
    const normalized = value.trim();
    if (!normalized) return null;
    return this.attributeValues.findByAttributeAndValueOrSynonym(
      attributeTypeId,
      normalized,
    );
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

  normalizeUnitCode(unitCode?: string) {
    return normalizeUnitCode(unitCode);
  }

  async findUnitDefinitionByCodeOrAlias(code: string) {
    const normalized = normalizeUnitCode(code);
    if (!normalized) return null;
    return this.units.getByCode(normalized);
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
    const attributeNameInput = normalizeName(
      input.attributeName || parsedInput.attributeName,
    );

    if (!attributeNameInput) {
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

    const parseKey = normalizeParseKey(attributeNameInput);
    const parseRule = parseKey
      ? await this.parseRules.findByRawKey(parseKey)
      : null;
    const contextTagIds = parseRule?.contextTagIds ?? [];
    let attributeType = parseRule
      ? await this.attributeTypes.getById(parseRule.attributeTypeId)
      : null;

    if (parseRule && !attributeType) {
      warnings.push('Parse rule target attribute type not found');
    }

    const attributeName = attributeType?.name || attributeNameInput;

    const inferredKind =
      input.kind ||
      attributeType?.kind ||
      inferKind(
        attributeName,
        Boolean(numericParse?.numericValue !== undefined),
      );
    const inferredValueType =
      input.valueType ||
      attributeType?.valueType ||
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
      input.dimension ||
      attributeType?.dimension ||
      unitDefinition?.dimension ||
      undefined;

    if (!parseRule) {
      const contextTokens = extractContextTokens(attributeNameInput);
      if (contextTokens.length) {
        warnings.push(
          `Attribute name includes contextual tokens (${contextTokens.join(
            ', ',
          )}); use context tags or parse rules.`,
        );
      }
    }

    if (!attributeType) {
      attributeType =
        await this.attributeTypes.findByNameOrSynonym(attributeName);
    }

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
    if (
      rawValue &&
      attributeType.valueType === GLOBAL_ATTRIBUTE_VALUE_TYPE.ENUM
    ) {
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
    if (
      attributeType.valueType === GLOBAL_ATTRIBUTE_VALUE_TYPE.NUMBER &&
      rawValue
    ) {
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
        contextTagIds,
        warnings,
      },
    };
  }
}

export const createGlobalAttributesService = (config: {
  envConfig: EnvConfig;
  mongoClient: MongoClient;
}) => {
  const dbName = config.envConfig.GLOBAL_LIBRARY_DB_NAME || 'es-erp-global';
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
  const parseRules = new GlobalAttributeParseRulesModel({
    mongoClient: config.mongoClient,
    dbName,
  });
  const units = new GlobalUnitsModel({
    mongoClient: config.mongoClient,
    dbName,
  });

  return new GlobalAttributesService({
    attributeTypes,
    attributeValues,
    attributeRelations,
    parseRules,
    units,
  });
};
