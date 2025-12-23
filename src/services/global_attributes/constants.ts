export const GLOBAL_ATTRIBUTE_KIND = {
  PHYSICAL: 'PHYSICAL',
  BRAND: 'BRAND',
} as const;

export type GlobalAttributeKind =
  (typeof GLOBAL_ATTRIBUTE_KIND)[keyof typeof GLOBAL_ATTRIBUTE_KIND];

export const GLOBAL_ATTRIBUTE_VALUE_TYPE = {
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  ENUM: 'ENUM',
  BOOLEAN: 'BOOLEAN',
  REF: 'REF',
} as const;

export type GlobalAttributeValueType =
  (typeof GLOBAL_ATTRIBUTE_VALUE_TYPE)[keyof typeof GLOBAL_ATTRIBUTE_VALUE_TYPE];

export const GLOBAL_ATTRIBUTE_DIMENSION = {
  LENGTH: 'LENGTH',
  MASS: 'MASS',
  AREA: 'AREA',
  VOLUME: 'VOLUME',
  TIME: 'TIME',
  DENSITY: 'DENSITY',
  TEMPERATURE: 'TEMPERATURE',
  SPEED: 'SPEED',
  FORCE: 'FORCE',
  ENERGY: 'ENERGY',
  POWER: 'POWER',
  PRESSURE: 'PRESSURE',
} as const;

export type GlobalAttributeDimension =
  (typeof GLOBAL_ATTRIBUTE_DIMENSION)[keyof typeof GLOBAL_ATTRIBUTE_DIMENSION];

export const GLOBAL_ATTRIBUTE_STATUS = {
  ACTIVE: 'ACTIVE',
  PROPOSED: 'PROPOSED',
  DEPRECATED: 'DEPRECATED',
} as const;

export type GlobalAttributeStatus =
  (typeof GLOBAL_ATTRIBUTE_STATUS)[keyof typeof GLOBAL_ATTRIBUTE_STATUS];

export const GLOBAL_ATTRIBUTE_AUDIT_STATUS = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  REVIEWED: 'REVIEWED',
  FLAGGED: 'FLAGGED',
} as const;

export type GlobalAttributeAuditStatus =
  (typeof GLOBAL_ATTRIBUTE_AUDIT_STATUS)[keyof typeof GLOBAL_ATTRIBUTE_AUDIT_STATUS];

export const GLOBAL_ATTRIBUTE_APPLIES_TO = {
  MATERIAL: 'MATERIAL',
  SERVICE: 'SERVICE',
  RESOURCE: 'RESOURCE',
  BOTH: 'BOTH',
} as const;

export type GlobalAttributeAppliesTo =
  (typeof GLOBAL_ATTRIBUTE_APPLIES_TO)[keyof typeof GLOBAL_ATTRIBUTE_APPLIES_TO];

export const GLOBAL_ATTRIBUTE_USAGE_HINT = {
  JOB_PARAMETER: 'JOB_PARAMETER',
  RESOURCE_PROPERTY: 'RESOURCE_PROPERTY',
  BOTH: 'BOTH',
} as const;

export type GlobalAttributeUsageHint =
  (typeof GLOBAL_ATTRIBUTE_USAGE_HINT)[keyof typeof GLOBAL_ATTRIBUTE_USAGE_HINT];

export const GLOBAL_ATTRIBUTE_RELATION_TYPE = {
  ALIAS: 'ALIAS',
  REPLACES: 'REPLACES',
  RELATED: 'RELATED',
} as const;

export type GlobalAttributeRelationType =
  (typeof GLOBAL_ATTRIBUTE_RELATION_TYPE)[keyof typeof GLOBAL_ATTRIBUTE_RELATION_TYPE];

export const GLOBAL_UNIT_STATUS = {
  ACTIVE: 'ACTIVE',
  DEPRECATED: 'DEPRECATED',
} as const;

export type GlobalUnitStatus =
  (typeof GLOBAL_UNIT_STATUS)[keyof typeof GLOBAL_UNIT_STATUS];
