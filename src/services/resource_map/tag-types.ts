export const RESOURCE_MAP_TAG_TYPE = {
  LOCATION: 'LOCATION',
  BUSINESS_UNIT: 'BUSINESS_UNIT',
  ROLE: 'ROLE',
} as const;

export const RESOURCE_MAP_TAG_TYPES = Object.values(RESOURCE_MAP_TAG_TYPE);

export type ResourceMapTagType =
  (typeof RESOURCE_MAP_TAG_TYPE)[keyof typeof RESOURCE_MAP_TAG_TYPE];

const TAG_TYPE_ALIASES: Record<string, ResourceMapTagType> = {
  LOCATION: RESOURCE_MAP_TAG_TYPE.LOCATION,
  LOC: RESOURCE_MAP_TAG_TYPE.LOCATION,
  BUSINESS_UNIT: RESOURCE_MAP_TAG_TYPE.BUSINESS_UNIT,
  BUSINESSUNIT: RESOURCE_MAP_TAG_TYPE.BUSINESS_UNIT,
  BUSINESS: RESOURCE_MAP_TAG_TYPE.BUSINESS_UNIT,
  ROLE: RESOURCE_MAP_TAG_TYPE.ROLE,
};

export const normalizeResourceMapTagType = (
  rawType?: string | null,
): ResourceMapTagType | null => {
  if (!rawType) return null;
  const normalized = rawType.trim().toUpperCase().replace(/[\s-]+/g, '_');
  return TAG_TYPE_ALIASES[normalized] || null;
};
