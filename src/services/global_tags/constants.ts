export const GLOBAL_TAG_POS = {
  NOUN: 'NOUN',
  VERB: 'VERB',
} as const;

export type GlobalTagPos = (typeof GLOBAL_TAG_POS)[keyof typeof GLOBAL_TAG_POS];

export const GLOBAL_TAG_STATUS = {
  ACTIVE: 'ACTIVE',
  PROPOSED: 'PROPOSED',
  DEPRECATED: 'DEPRECATED',
} as const;

export type GlobalTagStatus =
  (typeof GLOBAL_TAG_STATUS)[keyof typeof GLOBAL_TAG_STATUS];

export const GLOBAL_TAG_AUDIT_STATUS = {
  PENDING_REVIEW: 'PENDING_REVIEW',
  REVIEWED: 'REVIEWED',
  FLAGGED: 'FLAGGED',
} as const;

export type GlobalTagAuditStatus =
  (typeof GLOBAL_TAG_AUDIT_STATUS)[keyof typeof GLOBAL_TAG_AUDIT_STATUS];

export const GLOBAL_TAG_RELATION_TYPE = {
  ALIAS: 'ALIAS',
  BROADER: 'BROADER',
  NARROWER: 'NARROWER',
  RELATED: 'RELATED',
} as const;

export type GlobalTagRelationType =
  (typeof GLOBAL_TAG_RELATION_TYPE)[keyof typeof GLOBAL_TAG_RELATION_TYPE];
