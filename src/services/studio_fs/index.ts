import path from 'path';
import crypto from 'crypto';
import { type AnyBulkWriteOperation, type MongoClient } from 'mongodb';
import { type UserAuthPayload } from '../../authentication';
import { AuthZ, ERP_WORKSPACE_SUBJECT_PERMISSIONS } from '../../lib/authz';
import {
  createStudioFsModel,
  type StudioFsModel,
  type StudioFsNode,
  type StudioFsNodeDoc,
  type StudioFsNodeType,
} from './model';
import {
  catalogListSchema,
  catalogProductSchema,
  type CatalogListFilters,
  type CatalogListItem,
  type CatalogProduct,
} from './catalogSchemas';

export type StudioFsNodeInfo = {
  path: string;
  name: string;
  type: StudioFsNodeType;
  mimeType?: string | null;
  sizeBytes?: number | null;
  etag: string;
  updatedAt: Date;
};

export type StudioFsReadResult = {
  content: string;
  mimeType?: string | null;
  etag: string;
};

export type StudioFsWriteResult = {
  etag: string;
};

export type StudioCatalogValidationIssue = {
  message: string;
  path?: string;
};

export type StudioCatalogValidateResult = {
  errors: StudioCatalogValidationIssue[];
  warnings: StudioCatalogValidationIssue[];
};

export type StudioCatalogProductSummary = {
  id: string;
  name: string;
  path: string;
  origin: 'system' | 'workspace';
  kind?: 'material' | 'service' | 'assembly';
  status?: 'draft' | 'active' | 'archived';
  categoryPath?: string;
  tags?: string[];
};

export type StudioCatalogListSummary = {
  id: string;
  name: string;
  path: string;
  listType?: 'products' | 'assemblies' | 'tasks' | 'mixed';
  itemCount: number;
  resolvedPath?: string;
};

export type StudioCatalogIndex = {
  schemaVersion: string;
  generatedAt: string;
  catalog: {
    id: string;
    slug: string;
    name: string;
    path: string;
  };
  counts: {
    products: number;
    assemblies: number;
    tasks: number;
    lists: number;
  };
  products: StudioCatalogProductSummary[];
  lists: StudioCatalogListSummary[];
  assemblies: StudioCatalogProductSummary[];
  tasks: StudioCatalogProductSummary[];
  warnings?: StudioCatalogValidationIssue[];
};

export type StudioCatalogListResult = {
  schemaVersion: string;
  generatedAt: string;
  catalogPath: string;
  list: {
    id: string;
    name: string;
    listType: 'products' | 'assemblies' | 'tasks' | 'mixed';
    sourcePath: string;
  };
  items: StudioCatalogProductSummary[];
  warnings: StudioCatalogValidationIssue[];
};

export type StudioCatalogCompileResult = {
  valid: boolean;
  errors: StudioCatalogValidationIssue[];
  warnings: StudioCatalogValidationIssue[];
  index: StudioCatalogIndex | null;
  lists: Record<string, StudioCatalogListResult> | null;
  wrote: boolean;
};

export type StudioCatalogProductListItem = StudioCatalogProductSummary & {
  etag: string;
  updatedAt: Date;
  tagsCount: number;
};

export type StudioCatalogListProductsResult = {
  catalogPath: string;
  items: StudioCatalogProductListItem[];
  page: {
    number: number;
    size: number;
    totalItems: number;
    totalPages: number;
  };
};

type WorkingCatalogManifest = Record<string, any>;

type CatalogProductRecord = {
  id: string;
  name: string;
  path: string;
  origin: 'system' | 'workspace';
  kind?: 'material' | 'service' | 'assembly';
  description?: string;
  status: 'draft' | 'active' | 'archived';
  categoryPath?: string;
  tags: string[];
  activityTags: string[];
  targetSpecs: Array<
    { kind: 'tags'; tagIds: string[] } | { kind: 'product'; productId: string }
  >;
  attributes: Array<{
    key: string;
    value: string | number | boolean;
    unit?: string;
    contextTags: string[];
  }>;
  updatedAt: Date;
};

type CatalogListRecord = {
  id: string;
  name: string;
  path: string;
  description?: string;
  listType: 'products' | 'assemblies' | 'tasks' | 'mixed';
  items: CatalogListItem[];
  filters?: CatalogListFilters;
  sort?: {
    by: 'name' | 'id' | 'updatedAt';
    direction: 'asc' | 'desc';
  };
  limit?: number;
};

type CatalogCompilation = {
  catalogRoot: string;
  index: StudioCatalogIndex;
  lists: Record<string, StudioCatalogListResult>;
  errors: StudioCatalogValidationIssue[];
  warnings: StudioCatalogValidationIssue[];
  valid: boolean;
};

type CatalogProductInput = Omit<
  CatalogProduct,
  | 'schemaVersion'
  | 'description'
  | 'status'
  | 'kind'
  | 'categoryPath'
  | 'tags'
  | 'activityTags'
  | 'targetSpecs'
  | 'taskTemplates'
  | 'attributes'
  | 'sourceRefs'
  | 'sourcePaths'
  | 'images'
  | 'notes'
> & {
  schemaVersion?: string | null;
  description?: string | null;
  status?: CatalogProduct['status'] | null;
  kind?: CatalogProduct['kind'] | null;
  categoryPath?: string | null;
  tags?: CatalogProduct['tags'] | null;
  activityTags?: CatalogProduct['activityTags'] | null;
  targetSpecs?: CatalogProduct['targetSpecs'] | null;
  taskTemplates?: CatalogProduct['taskTemplates'] | null;
  attributes?: CatalogProduct['attributes'] | null;
  sourceRefs?: CatalogProduct['sourceRefs'] | null;
  sourcePaths?: CatalogProduct['sourcePaths'] | null;
  images?: CatalogProduct['images'] | null;
  notes?: string | null;
};

const STUDIO_FS_ROOTS = ['/catalogs', '/conversations', '/guides'] as const;
const ROOT_SET = new Set<string>(STUDIO_FS_ROOTS);
const DEFAULT_CATALOG_SLUG = 'default';
const DEFAULT_CATALOG_NAME = 'Default Catalog';

const MEASURABLE_TAGS = new Set([
  'weight',
  'length',
  'height',
  'width',
  'depth',
  'size',
  'volume',
  'mass',
  'density',
  'force',
  'energy',
  'power',
  'pressure',
  'temperature',
  'speed',
  'velocity',
  'acceleration',
  'angle',
  'frequency',
  'flow',
  'flow_rate',
  'torque',
  'capacity',
  'load',
  'voltage',
  'current',
  'amperage',
  'resistance',
  'area',
  'distance',
  'duration',
]);

const UNIT_TAGS = new Set([
  'lb',
  'lbs',
  'kg',
  'g',
  'mg',
  'oz',
  'ton',
  'tonne',
  'in',
  'ft',
  'yd',
  'mi',
  'mm',
  'cm',
  'm',
  'km',
  'l',
  'ml',
  'qt',
  'gal',
  'gph',
  'lph',
  'gpm',
  'lpm',
  'psi',
  'bar',
  'kpa',
  'pa',
  'deg',
  'rad',
  'w',
  'kw',
  'hp',
  'hz',
  'rpm',
  'v',
  'kv',
  'amp',
  'amps',
  'ohm',
  'kohm',
  'mohm',
  's',
  'sec',
  'min',
  'hr',
  'day',
]);

const ID_LIKE_TAG_PREFIXES = ['WTG-', 'GTG-'] as const;
const ID_LIKE_ATTRIBUTE_TYPE_PREFIXES = ['WAT-', 'GAT-'] as const;

const isIdLikeTag = (value: string) =>
  ID_LIKE_TAG_PREFIXES.some((prefix) => value.startsWith(prefix));

const isIdLikeAttributeType = (value: string) =>
  ID_LIKE_ATTRIBUTE_TYPE_PREFIXES.some((prefix) => value.startsWith(prefix));

const UNIQUE_BRAND_ATTRIBUTE_KEYS = new Set([
  'manufacturer',
  'model',
  'year',
  'trim',
  'sku',
  'mpn',
  'series',
  'family',
]);

class StudioFsError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class StudioFsNotFoundError extends StudioFsError {
  constructor(message = 'Path not found') {
    super(message, 404, 'STUDIO_FS_NOT_FOUND');
  }
}

export class StudioFsConflictError extends StudioFsError {
  constructor(message = 'ETag mismatch') {
    super(message, 409, 'STUDIO_FS_CONFLICT');
  }
}

export class StudioFsValidationError extends StudioFsError {
  constructor(message: string) {
    super(message, 400, 'STUDIO_FS_VALIDATION');
  }
}

const normalizePath = (value: string) => {
  if (!value || typeof value !== 'string') {
    throw new StudioFsValidationError('Path must be a string');
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new StudioFsValidationError('Path cannot be empty');
  }
  if (trimmed.includes('\\') || trimmed.includes('\0')) {
    throw new StudioFsValidationError('Path contains invalid characters');
  }
  const segments = trimmed.split('/').filter(Boolean);
  if (segments.some((segment) => segment === '.' || segment === '..')) {
    throw new StudioFsValidationError('Path cannot contain dot segments');
  }
  const normalized = path.posix.normalize(
    trimmed.startsWith('/') ? trimmed : `/${trimmed}`,
  );
  if (!normalized.startsWith('/')) {
    throw new StudioFsValidationError('Path must be absolute');
  }
  if (normalized !== '/' && normalized.endsWith('/')) {
    return normalized.slice(0, -1);
  }
  return normalized;
};

const ensureAllowedRoot = (normalizedPath: string) => {
  if (normalizedPath === '/') return;
  const isAllowed = STUDIO_FS_ROOTS.some(
    (root) => normalizedPath === root || normalizedPath.startsWith(`${root}/`),
  );
  if (!isAllowed) {
    throw new StudioFsValidationError(
      `Path must be under ${STUDIO_FS_ROOTS.join(', ')}`,
    );
  }
};

const isJsonFile = (filePath: string) =>
  filePath.endsWith('.json') || filePath.endsWith('.jsonc');

const decodeNodeContent = (node: StudioFsNode) => {
  if (!node.content) return '';
  if (node.contentEncoding === 'base64') {
    return Buffer.from(node.content, 'base64').toString('utf8');
  }
  return node.content;
};

const formatIssuePath = (
  basePath: string,
  segments: Array<string | number>,
) => {
  if (segments.length === 0) return basePath;
  const rendered = segments
    .map((segment) =>
      typeof segment === 'number' ? `[${segment}]` : `.${segment}`,
    )
    .join('');
  return `${basePath}${rendered}`;
};

const resolveCatalogRoot = (catalogPath: string) => {
  const normalized = normalizePath(catalogPath);
  ensureAllowedRoot(normalized);
  const root = normalized.endsWith('/catalog.jsonc')
    ? path.posix.dirname(normalized)
    : normalized;
  if (root === '/catalogs' || !root.startsWith('/catalogs/')) {
    throw new StudioFsValidationError('catalogPath must be under /catalogs');
  }
  return root;
};

const buildNodeInfo = (node: StudioFsNode): StudioFsNodeInfo => ({
  path: node.path,
  name: node.name,
  type: node.type,
  mimeType: node.mimeType ?? null,
  sizeBytes: node.sizeBytes ?? null,
  etag: node.etag,
  updatedAt: node.updatedAt,
});

const generateEtag = () => crypto.randomUUID();

const stripJsoncComments = (value: string) => {
  let output = '';
  let inString = false;
  let stringChar = '"';
  let escaping = false;
  let index = 0;

  while (index < value.length) {
    const char = value[index];
    const next = value[index + 1];

    if (inString) {
      output += char;
      if (escaping) {
        escaping = false;
      } else if (char === '\\') {
        escaping = true;
      } else if (char === stringChar) {
        inString = false;
      }
      index += 1;
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
      output += char;
      index += 1;
      continue;
    }

    if (char === '/' && next === '/') {
      index += 2;
      while (index < value.length && value[index] !== '\n') {
        index += 1;
      }
      continue;
    }

    if (char === '/' && next === '*') {
      index += 2;
      while (index < value.length) {
        if (value[index] === '*' && value[index + 1] === '/') {
          index += 2;
          break;
        }
        index += 1;
      }
      continue;
    }

    output += char;
    index += 1;
  }

  return output;
};

const stripJsoncTrailingCommas = (value: string) => {
  let output = '';
  let inString = false;
  let stringChar = '"';
  let escaping = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (inString) {
      output += char;
      if (escaping) {
        escaping = false;
      } else if (char === '\\') {
        escaping = true;
      } else if (char === stringChar) {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
      output += char;
      continue;
    }

    if (char === ',') {
      let nextIndex = index + 1;
      while (nextIndex < value.length && /\s/.test(value[nextIndex])) {
        nextIndex += 1;
      }
      const nextChar = value[nextIndex];
      if (nextChar === '}' || nextChar === ']') {
        continue;
      }
    }

    output += char;
  }

  return output;
};

const parseJsonc = (value: string) => {
  const withoutComments = stripJsoncComments(value);
  const withoutTrailing = stripJsoncTrailingCommas(withoutComments);
  return JSON.parse(withoutTrailing);
};

const validateCatalogManifest = (manifest: WorkingCatalogManifest) => {
  const errors: StudioCatalogValidationIssue[] = [];
  const warnings: StudioCatalogValidationIssue[] = [];

  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    errors.push({ message: 'Manifest must be a JSON object' });
    return { errors, warnings };
  }

  if (typeof manifest.schemaVersion !== 'string') {
    errors.push({
      message: 'schemaVersion must be a string',
      path: 'schemaVersion',
    });
  }

  if (!manifest.catalog || typeof manifest.catalog !== 'object') {
    errors.push({ message: 'catalog must be an object', path: 'catalog' });
  } else {
    if (typeof manifest.catalog.id !== 'string') {
      errors.push({
        message: 'catalog.id must be a string',
        path: 'catalog.id',
      });
    }
    if (typeof manifest.catalog.name !== 'string') {
      errors.push({
        message: 'catalog.name must be a string',
        path: 'catalog.name',
      });
    }
  }

  if (!Array.isArray(manifest.sources)) {
    errors.push({ message: 'sources must be an array', path: 'sources' });
  } else {
    manifest.sources.forEach((source: any, sourceIndex: number) => {
      const sourcePath = `sources[${sourceIndex}]`;
      if (!source || typeof source !== 'object' || Array.isArray(source)) {
        errors.push({ message: 'Source must be an object', path: sourcePath });
        return;
      }
      if (typeof source.path !== 'string') {
        errors.push({
          message: 'source.path must be a string',
          path: `${sourcePath}.path`,
        });
      }
      if (typeof source.kind !== 'string') {
        errors.push({
          message: 'source.kind must be a string',
          path: `${sourcePath}.kind`,
        });
      }
      if (typeof source.discoveredAt !== 'string') {
        errors.push({
          message: 'source.discoveredAt must be a string',
          path: `${sourcePath}.discoveredAt`,
        });
      }
    });
  }

  if (manifest.products !== undefined && !Array.isArray(manifest.products)) {
    errors.push({ message: 'products must be an array', path: 'products' });
  }

  const products: any[] = Array.isArray(manifest.products)
    ? manifest.products
    : [];

  products.forEach((product, productIndex) => {
    const basePath = `products[${productIndex}]`;
    if (!product || typeof product !== 'object' || Array.isArray(product)) {
      errors.push({ message: 'Product must be an object', path: basePath });
      return;
    }

    if (typeof product.id !== 'string') {
      errors.push({
        message: 'Product id must be a string',
        path: `${basePath}.id`,
      });
    }
    if (typeof product.kind !== 'string') {
      errors.push({
        message: 'Product kind must be a string',
        path: `${basePath}.kind`,
      });
    }
    const normalizedKind =
      typeof product.kind === 'string' ? product.kind.toUpperCase() : '';
    if (
      normalizedKind &&
      !['MATERIAL', 'SERVICE', 'ASSEMBLY'].includes(normalizedKind)
    ) {
      errors.push({
        message: 'Product kind must be MATERIAL, SERVICE, or ASSEMBLY',
        path: `${basePath}.kind`,
      });
    }
    if (typeof product.name !== 'string') {
      errors.push({
        message: 'Product name must be a string',
        path: `${basePath}.name`,
      });
    }
    if (!Array.isArray(product.tags)) {
      errors.push({
        message: 'Product tags must be an array',
        path: `${basePath}.tags`,
      });
    } else {
      product.tags.forEach((tag: any, tagIndex: number) => {
        if (typeof tag !== 'string') {
          errors.push({
            message: 'Tag must be a string',
            path: `${basePath}.tags[${tagIndex}]`,
          });
          return;
        }
        const normalized = tag.toLowerCase();
        if (MEASURABLE_TAGS.has(normalized)) {
          errors.push({
            message: `Tag "${tag}" should be an attribute, not a tag`,
            path: `${basePath}.tags[${tagIndex}]`,
          });
        }
        if (UNIT_TAGS.has(normalized)) {
          errors.push({
            message: `Unit "${tag}" should not be stored as a tag`,
            path: `${basePath}.tags[${tagIndex}]`,
          });
        }
      });
    }

    const checkAttributeType = (value: any, attrPath: string) => {
      if (typeof value !== 'string') {
        errors.push({
          message: 'attributeType must be a string',
          path: attrPath,
        });
        return;
      }
      if (value.includes('_')) {
        errors.push({
          message: `Blended attribute type "${value}" must be decomposed`,
          path: attrPath,
        });
      }
    };

    if (normalizedKind === 'MATERIAL') {
      const physical = Array.isArray(product.physicalAttributes)
        ? product.physicalAttributes
        : [];
      physical.forEach((entry: any, entryIndex: number) => {
        const entryPath = `${basePath}.physicalAttributes[${entryIndex}]`;
        checkAttributeType(entry?.attributeType, `${entryPath}.attributeType`);
        if (typeof entry?.unit !== 'string') {
          errors.push({
            message: 'unit must be a string',
            path: `${entryPath}.unit`,
          });
        }
      });
    }

    if (normalizedKind === 'SERVICE') {
      const schemaEntries = Array.isArray(product.attributeSchema)
        ? product.attributeSchema
        : [];
      schemaEntries.forEach((entry: any, entryIndex: number) => {
        const entryPath = `${basePath}.attributeSchema[${entryIndex}]`;
        checkAttributeType(entry?.attributeType, `${entryPath}.attributeType`);
        if (typeof entry?.defaultUnit !== 'string') {
          errors.push({
            message: 'defaultUnit must be a string',
            path: `${entryPath}.defaultUnit`,
          });
        }
      });
    }
  });

  return { errors, warnings };
};

const normalizeListItem = (item: CatalogListItem) => {
  if (typeof item === 'string') {
    return { id: item, type: 'product' as const };
  }
  return { id: item.id, type: item.type ?? 'product' };
};

const normalizeTags = (tags?: string[]) =>
  Array.isArray(tags)
    ? Array.from(
        new Set(tags.filter((tag) => typeof tag === 'string' && tag.trim())),
      )
    : [];

const normalizeAttributeContextTags = (tags?: string[]) =>
  Array.isArray(tags)
    ? Array.from(
        new Set(tags.filter((tag) => typeof tag === 'string' && tag.trim())),
      )
    : [];

const buildProductSummary = (
  product: CatalogProductRecord,
): StudioCatalogProductSummary => ({
  id: product.id,
  name: product.name,
  path: product.path,
  origin: product.origin,
  kind: product.kind,
  status: product.status,
  categoryPath: product.categoryPath,
  tags: product.tags.length > 0 ? product.tags : undefined,
});

const matchAttribute = (
  product: CatalogProductRecord,
  matcher: {
    key: string;
    value: string | number | boolean;
    unit?: string;
    contextTags?: string[];
  },
) => {
  return product.attributes.some((attribute) => {
    if (attribute.key.toLowerCase() !== matcher.key.toLowerCase()) return false;
    if (attribute.value !== matcher.value) return false;
    if (matcher.unit && attribute.unit !== matcher.unit) return false;
    if (matcher.contextTags && matcher.contextTags.length > 0) {
      const target = new Set(
        normalizeAttributeContextTags(attribute.contextTags).map((tag) =>
          tag.toLowerCase(),
        ),
      );
      for (const tag of matcher.contextTags) {
        if (!target.has(tag.toLowerCase())) return false;
      }
    }
    return true;
  });
};

const matchesFilters = (
  product: CatalogProductRecord,
  filters: CatalogListFilters,
) => {
  if (filters.tagsAny && filters.tagsAny.length > 0) {
    const tagSet = new Set(product.tags.map((tag) => tag.toLowerCase()));
    const hasAny = filters.tagsAny.some((tag) => tagSet.has(tag.toLowerCase()));
    if (!hasAny) return false;
  }

  if (filters.tagsAll && filters.tagsAll.length > 0) {
    const tagSet = new Set(product.tags.map((tag) => tag.toLowerCase()));
    const hasAll = filters.tagsAll.every((tag) =>
      tagSet.has(tag.toLowerCase()),
    );
    if (!hasAll) return false;
  }

  if (filters.attributeAny && filters.attributeAny.length > 0) {
    const hasAny = filters.attributeAny.some((matcher) =>
      matchAttribute(product, matcher),
    );
    if (!hasAny) return false;
  }

  if (filters.attributeAll && filters.attributeAll.length > 0) {
    const hasAll = filters.attributeAll.every((matcher) =>
      matchAttribute(product, matcher),
    );
    if (!hasAll) return false;
  }

  if (filters.categoryPaths && filters.categoryPaths.length > 0) {
    if (!product.categoryPath) return false;
    const matchesCategory = filters.categoryPaths.some((pathValue) =>
      product.categoryPath?.startsWith(pathValue),
    );
    if (!matchesCategory) return false;
  }

  if (filters.statusIn && filters.statusIn.length > 0) {
    if (!filters.statusIn.includes(product.status)) return false;
  }

  if (filters.text && filters.text.trim()) {
    const needle = filters.text.trim().toLowerCase();
    const haystack = [product.id, product.name, product.description ?? '']
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(needle)) return false;
  }

  return true;
};

export class StudioFsService {
  private model: StudioFsModel;
  private authz: AuthZ;

  constructor(config: { model: StudioFsModel; authz: AuthZ }) {
    this.model = config.model;
    this.authz = config.authz;
  }

  private async assertReadAccess(workspaceId: string, user: UserAuthPayload) {
    const hasAccess = await this.authz.workspace.hasPermission({
      resourceId: workspaceId,
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_READ_FILES,
      subjectId: user.id,
    });
    if (!hasAccess) {
      throw new StudioFsValidationError(
        'Unauthorized to access this workspace',
      );
    }
  }

  private async assertWriteAccess(workspaceId: string, user: UserAuthPayload) {
    const hasAccess = await this.authz.workspace.hasPermission({
      resourceId: workspaceId,
      permission: ERP_WORKSPACE_SUBJECT_PERMISSIONS.USER_CAN_MANAGE_FILES,
      subjectId: user.id,
    });
    if (!hasAccess) {
      throw new StudioFsValidationError(
        'Unauthorized to modify this workspace',
      );
    }
  }

  private async ensureFolderPath(params: {
    companyId: string;
    workspaceId: string;
    path: string;
    userId: string;
  }) {
    const normalized = normalizePath(params.path);
    ensureAllowedRoot(normalized);
    if (ROOT_SET.has(normalized)) return;

    const root = STUDIO_FS_ROOTS.find(
      (candidate) =>
        normalized === candidate || normalized.startsWith(`${candidate}/`),
    );
    if (!root) {
      throw new StudioFsValidationError('Folder path is outside allowed roots');
    }

    const relative = normalized.slice(root.length).split('/').filter(Boolean);
    let currentPath: string = root;
    const now = new Date();

    for (const segment of relative) {
      const nextPath = `${currentPath}/${segment}`;
      const parentPath = currentPath;
      const existing = await this.model.findNode({
        companyId: params.companyId,
        workspaceId: params.workspaceId,
        path: nextPath,
        includeDeleted: true,
      });

      if (existing) {
        if (existing.type !== 'FOLDER') {
          throw new StudioFsValidationError(
            `Path ${nextPath} already exists as a file`,
          );
        }
        if (existing.deleted) {
          await this.model.updateNode(
            {
              companyId: params.companyId,
              workspaceId: params.workspaceId,
              path: nextPath,
            },
            {
              deleted: false,
              deletedAt: null,
              updatedAt: now,
              updatedBy: params.userId,
            },
          );
        }
      } else {
        await this.model.insertNode({
          companyId: params.companyId,
          workspaceId: params.workspaceId,
          path: nextPath,
          parentPath,
          name: segment,
          type: 'FOLDER',
          etag: generateEtag(),
          createdAt: now,
          updatedAt: now,
          createdBy: params.userId,
          updatedBy: params.userId,
          deleted: false,
          deletedAt: null,
        });
      }

      currentPath = nextPath;
    }
  }

  async roots(workspaceId: string, user?: UserAuthPayload) {
    if (!user) {
      throw new StudioFsValidationError('User not authenticated');
    }
    if (!workspaceId) {
      throw new StudioFsValidationError('workspaceId is required');
    }
    await this.assertReadAccess(workspaceId, user);
    return [...STUDIO_FS_ROOTS];
  }

  async list(
    params: { workspaceId: string; path: string },
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new StudioFsValidationError('User not authenticated');
    }
    if (!params.workspaceId) {
      throw new StudioFsValidationError('workspaceId is required');
    }
    await this.assertReadAccess(params.workspaceId, user);
    const normalized = normalizePath(params.path);
    if (normalized === '/') {
      return STUDIO_FS_ROOTS.map((root) => ({
        path: root,
        name: root.slice(1),
        type: 'FOLDER' as const,
        mimeType: null,
        sizeBytes: null,
        etag: root,
        updatedAt: new Date(0),
      }));
    }
    ensureAllowedRoot(normalized);

    const nodes = await this.model.listChildren({
      companyId: user.companyId,
      workspaceId: params.workspaceId,
      parentPath: normalized,
    });

    return nodes.map((node) => buildNodeInfo(node));
  }

  async read(
    params: { workspaceId: string; path: string },
    user?: UserAuthPayload,
  ): Promise<StudioFsReadResult> {
    if (!user) {
      throw new StudioFsValidationError('User not authenticated');
    }
    if (!params.workspaceId) {
      throw new StudioFsValidationError('workspaceId is required');
    }
    await this.assertReadAccess(params.workspaceId, user);
    const normalized = normalizePath(params.path);
    ensureAllowedRoot(normalized);

    const node = await this.model.findNode({
      companyId: user.companyId,
      workspaceId: params.workspaceId,
      path: normalized,
    });
    if (!node) {
      throw new StudioFsNotFoundError();
    }
    if (node.type !== 'FILE') {
      throw new StudioFsValidationError('Path is not a file');
    }
    return {
      content: node.content ?? '',
      mimeType: node.mimeType ?? null,
      etag: node.etag,
    };
  }

  async write(
    params: {
      workspaceId: string;
      path: string;
      content: string;
      mimeType?: string | null;
      expectedEtag?: string | null;
      contentEncoding?: string | null;
    },
    user?: UserAuthPayload,
  ): Promise<StudioFsWriteResult> {
    if (!user) {
      throw new StudioFsValidationError('User not authenticated');
    }
    if (!params.workspaceId) {
      throw new StudioFsValidationError('workspaceId is required');
    }
    await this.assertWriteAccess(params.workspaceId, user);
    const normalized = normalizePath(params.path);
    ensureAllowedRoot(normalized);
    if (ROOT_SET.has(normalized)) {
      throw new StudioFsValidationError('Cannot write to root path');
    }

    const existing = await this.model.findNode({
      companyId: user.companyId,
      workspaceId: params.workspaceId,
      path: normalized,
      includeDeleted: true,
    });

    if (existing && !existing.deleted) {
      if (!params.expectedEtag) {
        throw new StudioFsConflictError('expectedEtag is required for updates');
      }
      if (existing.etag !== params.expectedEtag) {
        throw new StudioFsConflictError();
      }
      if (existing.type !== 'FILE') {
        throw new StudioFsValidationError('Path is not a file');
      }
    }

    const parentPath = path.posix.dirname(normalized);
    const resolvedParent = parentPath === '/' ? null : parentPath;
    if (resolvedParent) {
      await this.ensureFolderPath({
        companyId: user.companyId,
        workspaceId: params.workspaceId,
        path: resolvedParent,
        userId: user.id,
      });
    }

    const now = new Date();
    const etag = generateEtag();
    const encoding = params.contentEncoding ?? 'utf8';
    const sizeBytes = Buffer.byteLength(
      params.content ?? '',
      encoding as BufferEncoding,
    );
    const name = path.posix.basename(normalized);

    if (existing) {
      await this.model.updateNode(
        {
          companyId: user.companyId,
          workspaceId: params.workspaceId,
          path: normalized,
        },
        {
          path: normalized,
          parentPath: resolvedParent,
          name,
          type: 'FILE',
          content: params.content,
          contentEncoding: params.contentEncoding ?? null,
          mimeType: params.mimeType ?? null,
          sizeBytes,
          etag,
          updatedAt: now,
          updatedBy: user.id,
          deleted: false,
          deletedAt: null,
        },
      );
    } else {
      await this.model.insertNode({
        companyId: user.companyId,
        workspaceId: params.workspaceId,
        path: normalized,
        parentPath: resolvedParent,
        name,
        type: 'FILE',
        content: params.content,
        contentEncoding: params.contentEncoding ?? null,
        mimeType: params.mimeType ?? null,
        sizeBytes,
        etag,
        createdAt: now,
        updatedAt: now,
        createdBy: user.id,
        updatedBy: user.id,
        deleted: false,
        deletedAt: null,
      });
    }

    return { etag };
  }

  async upload(
    params: {
      workspaceId: string;
      path: string;
      bytes: string;
      mimeType?: string | null;
      expectedEtag?: string | null;
    },
    user?: UserAuthPayload,
  ): Promise<StudioFsWriteResult> {
    if (!params.workspaceId) {
      throw new StudioFsValidationError('workspaceId is required');
    }
    return this.write(
      {
        workspaceId: params.workspaceId,
        path: params.path,
        content: params.bytes,
        mimeType: params.mimeType ?? null,
        expectedEtag: params.expectedEtag ?? null,
        contentEncoding: 'base64',
      },
      user,
    );
  }

  async mkdir(
    params: { workspaceId: string; path: string },
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new StudioFsValidationError('User not authenticated');
    }
    if (!params.workspaceId) {
      throw new StudioFsValidationError('workspaceId is required');
    }
    await this.assertWriteAccess(params.workspaceId, user);
    const normalized = normalizePath(params.path);
    ensureAllowedRoot(normalized);
    if (ROOT_SET.has(normalized)) {
      return { path: normalized };
    }

    await this.ensureFolderPath({
      companyId: user.companyId,
      workspaceId: params.workspaceId,
      path: normalized,
      userId: user.id,
    });

    return { path: normalized };
  }

  async move(
    params: { workspaceId: string; from: string; to: string },
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new StudioFsValidationError('User not authenticated');
    }
    if (!params.workspaceId) {
      throw new StudioFsValidationError('workspaceId is required');
    }
    await this.assertWriteAccess(params.workspaceId, user);
    const fromPath = normalizePath(params.from);
    const toPath = normalizePath(params.to);
    ensureAllowedRoot(fromPath);
    ensureAllowedRoot(toPath);
    if (ROOT_SET.has(fromPath) || ROOT_SET.has(toPath)) {
      throw new StudioFsValidationError('Cannot move root paths');
    }
    if (toPath.startsWith(`${fromPath}/`)) {
      throw new StudioFsValidationError('Cannot move a folder into itself');
    }

    const existing = await this.model.findNode({
      companyId: user.companyId,
      workspaceId: params.workspaceId,
      path: fromPath,
    });
    if (!existing) {
      throw new StudioFsNotFoundError();
    }

    const target = await this.model.findNode({
      companyId: user.companyId,
      workspaceId: params.workspaceId,
      path: toPath,
      includeDeleted: true,
    });
    if (target && !target.deleted) {
      throw new StudioFsConflictError('Target path already exists');
    }

    const now = new Date();
    const updates: AnyBulkWriteOperation<StudioFsNodeDoc>[] = [];
    const prefix = `${fromPath}/`;

    const nodes = await this.model.listByPrefix({
      companyId: user.companyId,
      workspaceId: params.workspaceId,
      pathPrefix: existing.type === 'FOLDER' ? prefix : fromPath,
    });

    if (existing.type === 'FILE') {
      const parentPath = path.posix.dirname(toPath);
      const resolvedParent = parentPath === '/' ? null : parentPath;
      await this.ensureFolderPath({
        companyId: user.companyId,
        workspaceId: params.workspaceId,
        path: resolvedParent ?? toPath,
        userId: user.id,
      });
      const name = path.posix.basename(toPath);
      updates.push({
        updateOne: {
          filter: {
            companyId: user.companyId,
            workspaceId: params.workspaceId,
            path: fromPath,
          },
          update: {
            $set: {
              path: toPath,
              parentPath: resolvedParent,
              name,
              etag: generateEtag(),
              updatedAt: now,
              updatedBy: user.id,
            },
          },
        },
      });
    } else {
      await this.ensureFolderPath({
        companyId: user.companyId,
        workspaceId: params.workspaceId,
        path: path.posix.dirname(toPath),
        userId: user.id,
      });

      const allNodes = [existing, ...nodes];

      allNodes.forEach((node) => {
        const suffix =
          node.path === fromPath ? '' : node.path.slice(prefix.length);
        const nextPath = suffix ? `${toPath}/${suffix}` : toPath;
        const parentPath = path.posix.dirname(nextPath);
        const resolvedParent = parentPath === '/' ? null : parentPath;
        const name = path.posix.basename(nextPath);
        updates.push({
          updateOne: {
            filter: {
              companyId: user.companyId,
              workspaceId: params.workspaceId,
              path: node.path,
            },
            update: {
              $set: {
                path: nextPath,
                parentPath: resolvedParent,
                name,
                etag: generateEtag(),
                updatedAt: now,
                updatedBy: user.id,
              },
            },
          },
        });
      });
    }

    if (updates.length > 0) {
      await this.model.bulkWrite(updates);
    }

    return { path: toPath };
  }

  async delete(
    params: { workspaceId: string; path: string },
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new StudioFsValidationError('User not authenticated');
    }
    if (!params.workspaceId) {
      throw new StudioFsValidationError('workspaceId is required');
    }
    await this.assertWriteAccess(params.workspaceId, user);
    const normalized = normalizePath(params.path);
    ensureAllowedRoot(normalized);
    if (ROOT_SET.has(normalized)) {
      throw new StudioFsValidationError('Cannot delete root paths');
    }

    const existing = await this.model.findNode({
      companyId: user.companyId,
      workspaceId: params.workspaceId,
      path: normalized,
      includeDeleted: true,
    });
    if (!existing || existing.deleted) {
      return false;
    }

    const now = new Date();
    const prefix = `${normalized}/`;
    const nodes = await this.model.listByPrefix({
      companyId: user.companyId,
      workspaceId: params.workspaceId,
      pathPrefix: existing.type === 'FOLDER' ? prefix : normalized,
    });

    const updates: AnyBulkWriteOperation<StudioFsNodeDoc>[] = [];

    if (existing.type === 'FILE') {
      updates.push({
        updateOne: {
          filter: {
            companyId: user.companyId,
            workspaceId: params.workspaceId,
            path: normalized,
          },
          update: {
            $set: {
              deleted: true,
              deletedAt: now,
              updatedAt: now,
              updatedBy: user.id,
            },
          },
        },
      });
    } else {
      const allNodes = [existing, ...nodes];
      allNodes.forEach((node) => {
        updates.push({
          updateOne: {
            filter: {
              companyId: user.companyId,
              workspaceId: params.workspaceId,
              path: node.path,
            },
            update: {
              $set: {
                deleted: true,
                deletedAt: now,
                updatedAt: now,
                updatedBy: user.id,
              },
            },
          },
        });
      });
    }

    if (updates.length > 0) {
      await this.model.bulkWrite(updates);
    }

    return true;
  }

  private recordZodIssues(
    issues: Array<{ message: string; path: Array<string | number> }>,
    filePath: string,
    errors: StudioCatalogValidationIssue[],
  ) {
    issues.forEach((issue) => {
      errors.push({
        message: issue.message,
        path: formatIssuePath(filePath, issue.path),
      });
    });
  }

  private parseCatalogProductNode(
    node: StudioFsNode,
    errors: StudioCatalogValidationIssue[],
    warnings: StudioCatalogValidationIssue[],
  ): CatalogProductRecord | null {
    const content = decodeNodeContent(node);
    let parsed: unknown;
    try {
      parsed = parseJsonc(content);
    } catch (error) {
      errors.push({
        message: `Failed to parse product file: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        path: node.path,
      });
      return null;
    }

    const result = catalogProductSchema.safeParse(parsed);
    if (!result.success) {
      this.recordZodIssues(result.error.issues, node.path, errors);
      return null;
    }

    const data = result.data;
    const tags = normalizeTags(data.tags);
    tags.forEach((tag, index) => {
      if (isIdLikeTag(tag)) {
        errors.push({
          message: `Tag "${tag}" looks like a tag ID; product.tags must store canonical tag labels`,
          path: `${node.path}.tags[${index}]`,
        });
      }
      const normalized = tag.toLowerCase();
      if (MEASURABLE_TAGS.has(normalized)) {
        errors.push({
          message: `Tag "${tag}" should be an attribute, not a tag`,
          path: `${node.path}.tags[${index}]`,
        });
      }
      if (UNIT_TAGS.has(normalized)) {
        errors.push({
          message: `Unit "${tag}" should not be stored as a tag`,
          path: `${node.path}.tags[${index}]`,
        });
      }
    });

    const activityTags = normalizeTags(data.activityTags);
    activityTags.forEach((tag, index) => {
      if (isIdLikeTag(tag)) {
        errors.push({
          message: `Activity tag "${tag}" looks like a tag ID; product.activityTags must store canonical tag labels`,
          path: `${node.path}.activityTags[${index}]`,
        });
      }
      const normalized = tag.toLowerCase();
      if (UNIT_TAGS.has(normalized)) {
        errors.push({
          message: `Unit "${tag}" should not be stored as a tag`,
          path: `${node.path}.activityTags[${index}]`,
        });
      }
    });

    const targetSpecs = (data.targetSpecs ?? []).map((spec, specIndex) => {
      if (spec.kind === 'tags') {
        spec.tagIds.forEach((tagId, tagIndex) => {
          if (isIdLikeTag(tagId)) {
            errors.push({
              message: `Target tag "${tagId}" looks like a tag ID; targetSpecs.tagIds must store canonical tag labels`,
              path: `${node.path}.targetSpecs[${specIndex}].tagIds[${tagIndex}]`,
            });
          }
          const normalized = tagId.toLowerCase();
          if (MEASURABLE_TAGS.has(normalized)) {
            errors.push({
              message: `Target tag "${tagId}" should be an attribute, not a tag`,
              path: `${node.path}.targetSpecs[${specIndex}].tagIds[${tagIndex}]`,
            });
          }
          if (UNIT_TAGS.has(normalized)) {
            errors.push({
              message: `Unit "${tagId}" should not be stored as a tag`,
              path: `${node.path}.targetSpecs[${specIndex}].tagIds[${tagIndex}]`,
            });
          }
        });
      }
      return spec;
    });

    const taskTemplates = Array.isArray(data.taskTemplates)
      ? data.taskTemplates
      : [];
    const taskTemplateIds = new Set<string>();
    taskTemplates.forEach((template, templateIndex) => {
      if (taskTemplateIds.has(template.id)) {
        errors.push({
          message: `Duplicate task template id "${template.id}" detected; taskTemplates[].id must be unique per product`,
          path: `${node.path}.taskTemplates`,
        });
      }
      taskTemplateIds.add(template.id);

      normalizeTags(template.activityTagIds).forEach((tagId, tagIndex) => {
        if (isIdLikeTag(tagId)) {
          errors.push({
            message: `Activity tag "${tagId}" looks like a tag ID; task templates must store canonical tag labels`,
            path: `${node.path}.taskTemplates[${templateIndex}].activityTagIds[${tagIndex}]`,
          });
        }
        const normalized = tagId.toLowerCase();
        if (UNIT_TAGS.has(normalized)) {
          errors.push({
            message: `Unit "${tagId}" should not be stored as a tag`,
            path: `${node.path}.taskTemplates[${templateIndex}].activityTagIds[${tagIndex}]`,
          });
        }
      });

      normalizeTags(template.contextTagIds).forEach((tagId, tagIndex) => {
        if (isIdLikeTag(tagId)) {
          errors.push({
            message: `Context tag "${tagId}" looks like a tag ID; task templates must store canonical tag labels`,
            path: `${node.path}.taskTemplates[${templateIndex}].contextTagIds[${tagIndex}]`,
          });
        }
        const normalized = tagId.toLowerCase();
        if (MEASURABLE_TAGS.has(normalized)) {
          errors.push({
            message: `Context tag "${tagId}" should be an attribute, not a tag`,
            path: `${node.path}.taskTemplates[${templateIndex}].contextTagIds[${tagIndex}]`,
          });
        }
        if (UNIT_TAGS.has(normalized)) {
          errors.push({
            message: `Unit "${tagId}" should not be stored as a tag`,
            path: `${node.path}.taskTemplates[${templateIndex}].contextTagIds[${tagIndex}]`,
          });
        }
      });
    });

    const hasServiceFields = activityTags.length > 0 || targetSpecs.length > 0;
    const normalizedKind = data.kind ?? (hasServiceFields ? 'service' : undefined);
    if (!data.kind && hasServiceFields) {
      warnings.push({
        message:
          'Service fields detected; consider setting kind="service" explicitly',
        path: node.path,
      });
    }
    if (data.kind && data.kind !== 'service' && hasServiceFields) {
      errors.push({
        message: 'Service fields require kind="service"',
        path: node.path,
      });
    }
    if (data.kind === 'service' && activityTags.length === 0) {
      warnings.push({
        message: 'Service product should include activityTags',
        path: node.path,
      });
    }

    const attributes = (data.attributes ?? []).map((attribute, index) => {
      if (isIdLikeAttributeType(attribute.key)) {
        errors.push({
          message: `Attribute key "${attribute.key}" looks like an attribute type ID; attributes[].key must store canonical attribute type names`,
          path: `${node.path}.attributes[${index}].key`,
        });
      }
      if (attribute.key.includes('_')) {
        errors.push({
          message: `Blended attribute type "${attribute.key}" must be decomposed`,
          path: `${node.path}.attributes[${index}].key`,
        });
      }

      const normalizedKey = attribute.key.trim().toLowerCase();
      if (UNIQUE_BRAND_ATTRIBUTE_KEYS.has(normalizedKey) && attribute.unit) {
        errors.push({
          message: `BRAND attribute "${attribute.key}" must not include a unit`,
          path: `${node.path}.attributes[${index}].unit`,
        });
      }
      if (
        UNIQUE_BRAND_ATTRIBUTE_KEYS.has(normalizedKey) &&
        normalizedKey === 'year' &&
        typeof attribute.value !== 'number'
      ) {
        errors.push({
          message: `BRAND attribute "year" must be a number`,
          path: `${node.path}.attributes[${index}].value`,
        });
      }

      return {
        key: attribute.key,
        value: attribute.value,
        unit: attribute.unit,
        contextTags: normalizeAttributeContextTags(attribute.contextTags),
      };
    });

    const brandKeyCounts = new Map<string, number>();
    attributes.forEach((attribute) => {
      const normalized = attribute.key.trim().toLowerCase();
      if (!UNIQUE_BRAND_ATTRIBUTE_KEYS.has(normalized)) return;
      brandKeyCounts.set(normalized, (brandKeyCounts.get(normalized) ?? 0) + 1);
    });

    for (const [key, count] of brandKeyCounts) {
      if (count <= 1) continue;
      errors.push({
        message: `Duplicate BRAND attribute "${key}" detected; BRAND attributes must be unique per product`,
        path: `${node.path}.attributes`,
      });
    }

    const fileBase = path.posix.basename(
      node.path,
      path.posix.extname(node.path),
    );
    if (fileBase && fileBase !== data.id) {
      warnings.push({
        message: `Product id "${data.id}" does not match filename "${fileBase}"`,
        path: node.path,
      });
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      origin: data.origin ?? 'workspace',
      kind: normalizedKind,
      status: data.status ?? 'active',
      categoryPath: data.categoryPath,
      tags,
      activityTags,
      targetSpecs,
      attributes,
      path: node.path,
      updatedAt: node.updatedAt ?? new Date(0),
    };
  }

  private parseCatalogListNode(
    node: StudioFsNode,
    errors: StudioCatalogValidationIssue[],
    warnings: StudioCatalogValidationIssue[],
  ): CatalogListRecord | null {
    const content = decodeNodeContent(node);
    let parsed: unknown;
    try {
      parsed = parseJsonc(content);
    } catch (error) {
      errors.push({
        message: `Failed to parse list file: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        path: node.path,
      });
      return null;
    }

    const result = catalogListSchema.safeParse(parsed);
    if (!result.success) {
      this.recordZodIssues(result.error.issues, node.path, errors);
      return null;
    }

    const data = result.data;
    const listType = data.listType ?? 'products';
    if (data.filters && listType !== 'products' && listType !== 'mixed') {
      warnings.push({
        message: 'Filters are only applied to product lists',
        path: node.path,
      });
    }

    const fileBase = path.posix.basename(
      node.path,
      path.posix.extname(node.path),
    );
    if (fileBase && fileBase !== data.id) {
      warnings.push({
        message: `List id "${data.id}" does not match filename "${fileBase}"`,
        path: node.path,
      });
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      listType,
      items: data.items ?? [],
      filters: data.filters,
      sort: data.sort
        ? {
            by: data.sort.by,
            direction: data.sort.direction ?? 'asc',
          }
        : undefined,
      limit: data.limit,
      path: node.path,
    };
  }

  private parseManifestProducts(
    manifest: WorkingCatalogManifest | null,
    manifestPath: string,
    errors: StudioCatalogValidationIssue[],
    warnings: StudioCatalogValidationIssue[],
  ): CatalogProductRecord[] {
    const products: CatalogProductRecord[] = [];
    const manifestProducts: any[] = Array.isArray(manifest?.products)
      ? manifest?.products
      : [];

    if (manifestProducts.length > 0) {
      warnings.push({
        message:
          'Inline products in catalog.jsonc are deprecated; use /products instead',
        path: manifestPath,
      });
    }

    manifestProducts.forEach((product, index) => {
      const basePath = `${manifestPath}.products[${index}]`;
      if (!product || typeof product !== 'object' || Array.isArray(product)) {
        errors.push({ message: 'Product must be an object', path: basePath });
        return;
      }
      if (typeof product.id !== 'string' || typeof product.name !== 'string') {
        errors.push({
          message: 'Product id and name must be strings',
          path: basePath,
        });
        return;
      }

      let normalizedKind: CatalogProductRecord['kind'] | undefined;
      if (typeof product.kind === 'string') {
        const upper = product.kind.toUpperCase();
        if (upper === 'SERVICE') normalizedKind = 'service';
        if (upper === 'MATERIAL') normalizedKind = 'material';
        if (upper === 'ASSEMBLY') normalizedKind = 'assembly';
      }

      const tags = normalizeTags(product.tags);
      tags.forEach((tag, tagIndex) => {
        const normalized = tag.toLowerCase();
        if (MEASURABLE_TAGS.has(normalized)) {
          errors.push({
            message: `Tag "${tag}" should be an attribute, not a tag`,
            path: `${basePath}.tags[${tagIndex}]`,
          });
        }
        if (UNIT_TAGS.has(normalized)) {
          errors.push({
            message: `Unit "${tag}" should not be stored as a tag`,
            path: `${basePath}.tags[${tagIndex}]`,
          });
        }
      });

      products.push({
        id: product.id,
        name: product.name,
        origin: 'workspace',
        description:
          typeof product.description === 'string'
            ? product.description
            : undefined,
        kind: normalizedKind,
        status: 'active',
        tags,
        activityTags: normalizeTags(product.activityTags),
        targetSpecs: [],
        attributes: [],
        path: manifestPath,
        updatedAt: new Date(0),
      });
    });

    return products;
  }

  private async buildCatalogCompilation(
    params: { workspaceId: string; catalogPath: string },
    user: UserAuthPayload,
  ): Promise<CatalogCompilation> {
    if (!params.workspaceId) {
      throw new StudioFsValidationError('workspaceId is required');
    }

    const errors: StudioCatalogValidationIssue[] = [];
    const warnings: StudioCatalogValidationIssue[] = [];
    const catalogRoot = resolveCatalogRoot(params.catalogPath);
    await this.assertReadAccess(params.workspaceId, user);

    const manifestPath = `${catalogRoot}/catalog.jsonc`;
    const manifestNode = await this.model.findNode({
      companyId: user.companyId,
      workspaceId: params.workspaceId,
      path: manifestPath,
    });

    let manifest: WorkingCatalogManifest | null = null;
    if (!manifestNode || manifestNode.type !== 'FILE') {
      errors.push({
        message: 'catalog.jsonc not found',
        path: manifestPath,
      });
    } else {
      try {
        manifest = parseJsonc(decodeNodeContent(manifestNode));
      } catch (error) {
        errors.push({
          message: `Failed to parse catalog.jsonc: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          path: manifestPath,
        });
      }
    }

    if (manifest) {
      const manifestValidation = validateCatalogManifest(manifest);
      errors.push(...manifestValidation.errors);
      warnings.push(...manifestValidation.warnings);
    }

    const nodes = await this.model.listByPrefix({
      companyId: user.companyId,
      workspaceId: params.workspaceId,
      pathPrefix: `${catalogRoot}/`,
    });

    const productNodes = nodes.filter(
      (node) =>
        node.type === 'FILE' &&
        node.path.startsWith(`${catalogRoot}/products/`) &&
        isJsonFile(node.path),
    );
    const listNodes = nodes.filter(
      (node) =>
        node.type === 'FILE' &&
        node.path.startsWith(`${catalogRoot}/lists/`) &&
        isJsonFile(node.path),
    );

    const products: CatalogProductRecord[] = [];
    const productById = new Map<string, CatalogProductRecord>();

    const addProduct = (product: CatalogProductRecord) => {
      const key = product.id.toLowerCase();
      if (productById.has(key)) {
        errors.push({
          message: `Duplicate product id "${product.id}"`,
          path: product.path,
        });
        return;
      }
      productById.set(key, product);
      products.push(product);
    };

    productNodes.forEach((node) => {
      const product = this.parseCatalogProductNode(node, errors, warnings);
      if (product) addProduct(product);
    });

    this.parseManifestProducts(
      manifest,
      manifestPath,
      errors,
      warnings,
    ).forEach((product) => addProduct(product));

    products.forEach((product) => {
      if (product.targetSpecs.length === 0) return;
      product.targetSpecs.forEach((spec, specIndex) => {
        if (spec.kind === 'product') {
          if (!productById.has(spec.productId.toLowerCase())) {
            errors.push({
              message: `Target product "${spec.productId}" not found`,
              path: `${product.path}.targetSpecs[${specIndex}].productId`,
            });
          }
          return;
        }
        if (!spec.tagIds || spec.tagIds.length === 0) {
          errors.push({
            message: 'Target tagIds must not be empty',
            path: `${product.path}.targetSpecs[${specIndex}].tagIds`,
          });
        }
      });
    });

    const lists: CatalogListRecord[] = [];
    const listById = new Map<string, CatalogListRecord>();

    const addList = (list: CatalogListRecord) => {
      const key = list.id.toLowerCase();
      if (listById.has(key)) {
        errors.push({
          message: `Duplicate list id "${list.id}"`,
          path: list.path,
        });
        return;
      }
      listById.set(key, list);
      lists.push(list);
    };

    listNodes.forEach((node) => {
      const list = this.parseCatalogListNode(node, errors, warnings);
      if (list) addList(list);
    });

    lists.forEach((list) => {
      list.items.forEach((item, index) => {
        const normalized = normalizeListItem(item);
        if (normalized.type !== 'product' && list.listType === 'products') {
          warnings.push({
            message: `List "${list.id}" expects product items`,
            path: `${list.path}.items[${index}]`,
          });
        }
        if (normalized.type === 'product') {
          if (!productById.has(normalized.id.toLowerCase())) {
            errors.push({
              message: `Product "${normalized.id}" not found`,
              path: `${list.path}.items[${index}]`,
            });
          }
        }
      });
    });

    const generatedAt = new Date().toISOString();
    const catalogSlug = path.posix.basename(catalogRoot);
    const catalogId =
      manifest?.catalog && typeof manifest.catalog.id === 'string'
        ? manifest.catalog.id
        : catalogSlug;
    const catalogName =
      manifest?.catalog && typeof manifest.catalog.name === 'string'
        ? manifest.catalog.name
        : catalogSlug;

    const listResults: Record<string, StudioCatalogListResult> = {};
    const listSummaries: StudioCatalogListSummary[] = [];

    lists.forEach((list) => {
      const listWarnings: StudioCatalogValidationIssue[] = [];
      const resolved: CatalogProductRecord[] = [];
      const seen = new Set<string>();

      list.items.forEach((item) => {
        const normalized = normalizeListItem(item);
        if (normalized.type !== 'product') {
          listWarnings.push({
            message: `List item "${normalized.id}" is not a product`,
            path: list.path,
          });
          return;
        }
        const product = productById.get(normalized.id.toLowerCase());
        if (!product) {
          listWarnings.push({
            message: `Product "${normalized.id}" not found`,
            path: list.path,
          });
          return;
        }
        const key = product.id.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          resolved.push(product);
        }
      });

      if (
        list.filters &&
        (list.listType === 'products' || list.listType === 'mixed')
      ) {
        const filters = list.filters;
        products.forEach((product) => {
          if (!matchesFilters(product, filters)) {
            return;
          }
          const key = product.id.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            resolved.push(product);
          }
        });
      }

      if (list.sort) {
        const direction = list.sort.direction === 'desc' ? -1 : 1;
        resolved.sort((left, right) => {
          let compareValue = 0;
          if (list.sort?.by === 'name') {
            compareValue = left.name.localeCompare(right.name);
          } else if (list.sort?.by === 'updatedAt') {
            compareValue = left.updatedAt.getTime() - right.updatedAt.getTime();
          } else {
            compareValue = left.id.localeCompare(right.id);
          }
          return compareValue * direction;
        });
      }

      const limited = list.limit ? resolved.slice(0, list.limit) : resolved;
      const listResult: StudioCatalogListResult = {
        schemaVersion: '1.0',
        generatedAt,
        catalogPath: catalogRoot,
        list: {
          id: list.id,
          name: list.name,
          listType: list.listType,
          sourcePath: list.path,
        },
        items: limited.map((product) => buildProductSummary(product)),
        warnings: listWarnings,
      };

      listResults[list.id] = listResult;
      listSummaries.push({
        id: list.id,
        name: list.name,
        path: list.path,
        listType: list.listType,
        itemCount: listResult.items.length,
        resolvedPath: `${catalogRoot}/.catalog/lists/${list.id}.json`,
      });
    });

    const index: StudioCatalogIndex = {
      schemaVersion: '1.0',
      generatedAt,
      catalog: {
        id: catalogId,
        slug: catalogSlug,
        name: catalogName,
        path: catalogRoot,
      },
      counts: {
        products: products.length,
        assemblies: 0,
        tasks: 0,
        lists: listSummaries.length,
      },
      products: products
        .map((product) => buildProductSummary(product))
        .sort((a, b) => a.id.localeCompare(b.id)),
      lists: listSummaries.sort((a, b) => a.id.localeCompare(b.id)),
      assemblies: [],
      tasks: [],
      warnings: warnings.length > 0 ? warnings : undefined,
    };

    return {
      catalogRoot,
      index,
      lists: listResults,
      errors,
      warnings,
      valid: errors.length === 0,
    };
  }

  async previewCatalog(
    params: { workspaceId: string; catalogPath: string },
    user?: UserAuthPayload,
  ): Promise<StudioCatalogCompileResult> {
    if (!user) {
      throw new StudioFsValidationError('User not authenticated');
    }
    const compilation = await this.buildCatalogCompilation(params, user);
    return {
      valid: compilation.valid,
      errors: compilation.errors,
      warnings: compilation.warnings,
      index: compilation.index,
      lists: compilation.lists,
      wrote: false,
    };
  }

  async compileCatalog(
    params: { workspaceId: string; catalogPath: string },
    user?: UserAuthPayload,
  ): Promise<StudioCatalogCompileResult> {
    if (!user) {
      throw new StudioFsValidationError('User not authenticated');
    }
    if (!params.workspaceId) {
      throw new StudioFsValidationError('workspaceId is required');
    }
    await this.assertWriteAccess(params.workspaceId, user);

    const compilation = await this.buildCatalogCompilation(params, user);
    let wrote = false;

    if (compilation.valid) {
      const indexPath = `${compilation.catalogRoot}/.catalog/index.json`;
      await this.writeJsonFile(
        {
          workspaceId: params.workspaceId,
          path: indexPath,
          content: JSON.stringify(compilation.index, null, 2),
        },
        user,
      );

      for (const listResult of Object.values(compilation.lists)) {
        const listPath = `${compilation.catalogRoot}/.catalog/lists/${listResult.list.id}.json`;
        await this.writeJsonFile(
          {
            workspaceId: params.workspaceId,
            path: listPath,
            content: JSON.stringify(listResult, null, 2),
          },
          user,
        );
      }

      wrote = true;
    }

    return {
      valid: compilation.valid,
      errors: compilation.errors,
      warnings: compilation.warnings,
      index: compilation.index,
      lists: compilation.lists,
      wrote,
    };
  }

  private async writeJsonFile(
    params: { workspaceId: string; path: string; content: string },
    user: UserAuthPayload,
  ) {
    const existing = await this.model.findNode({
      companyId: user.companyId,
      workspaceId: params.workspaceId,
      path: params.path,
      includeDeleted: true,
    });
    const expectedEtag =
      existing && !existing.deleted ? existing.etag : undefined;

    await this.write(
      {
        workspaceId: params.workspaceId,
        path: params.path,
        content: params.content,
        mimeType: 'application/json',
        expectedEtag,
      },
      user,
    );
  }

  async createCatalog(
    params: { workspaceId: string; slug: string; name?: string | null },
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new StudioFsValidationError('User not authenticated');
    }
    if (!params.workspaceId) {
      throw new StudioFsValidationError('workspaceId is required');
    }
    await this.assertWriteAccess(params.workspaceId, user);

    const slug = params.slug.trim().toLowerCase();
    if (!slug || !/^[a-z0-9][a-z0-9-_]*$/.test(slug)) {
      throw new StudioFsValidationError('slug must be kebab or snake case');
    }

    const catalogPath = `/catalogs/${slug}`;
    await this.mkdir(
      { workspaceId: params.workspaceId, path: catalogPath },
      user,
    );
    await this.mkdir(
      { workspaceId: params.workspaceId, path: `${catalogPath}/sources` },
      user,
    );
    await this.mkdir(
      { workspaceId: params.workspaceId, path: `${catalogPath}/products` },
      user,
    );
    await this.mkdir(
      { workspaceId: params.workspaceId, path: `${catalogPath}/assemblies` },
      user,
    );
    await this.mkdir(
      { workspaceId: params.workspaceId, path: `${catalogPath}/tasks` },
      user,
    );
    await this.mkdir(
      { workspaceId: params.workspaceId, path: `${catalogPath}/lists` },
      user,
    );
    await this.mkdir(
      { workspaceId: params.workspaceId, path: `${catalogPath}/drafts` },
      user,
    );
    await this.mkdir(
      { workspaceId: params.workspaceId, path: `${catalogPath}/.catalog` },
      user,
    );
    await this.mkdir(
      {
        workspaceId: params.workspaceId,
        path: `${catalogPath}/.catalog/lists`,
      },
      user,
    );

    const manifestPath = `${catalogPath}/catalog.jsonc`;
    const existing = await this.model.findNode({
      companyId: user.companyId,
      workspaceId: params.workspaceId,
      path: manifestPath,
      includeDeleted: true,
    });
    if (existing && !existing.deleted) {
      throw new StudioFsConflictError('Catalog already exists');
    }

    const manifest = {
      $schema: '../../catalog.schema.json',
      schemaVersion: '0.1.0',
      catalog: {
        id: slug,
        name: params.name ?? slug,
      },
      sources: [],
      products: [],
    };

    await this.write(
      {
        workspaceId: params.workspaceId,
        path: manifestPath,
        content: JSON.stringify(manifest, null, 2),
        mimeType: 'application/json',
      },
      user,
    );

    return { catalogPath };
  }

  async ensureDefaultCatalog(
    params: { workspaceId: string; name?: string | null },
    user?: UserAuthPayload,
  ) {
    if (!user) {
      throw new StudioFsValidationError('User not authenticated');
    }
    if (!params.workspaceId) {
      throw new StudioFsValidationError('workspaceId is required');
    }

    try {
      return await this.createCatalog(
        {
          workspaceId: params.workspaceId,
          slug: DEFAULT_CATALOG_SLUG,
          name: params.name ?? DEFAULT_CATALOG_NAME,
        },
        user,
      );
    } catch (error) {
      if (error instanceof StudioFsConflictError) {
        return { catalogPath: `/catalogs/${DEFAULT_CATALOG_SLUG}` };
      }
      throw error;
    }
  }

  async ensureLogisticsServiceProducts(
    params: { workspaceId: string; catalogPath?: string | null },
    user?: UserAuthPayload,
  ): Promise<{
    catalogPath: string;
    products: Array<{ status: 'created' | 'existing'; product: StudioCatalogProductSummary }>;
  }> {
    if (!user) {
      throw new StudioFsValidationError('User not authenticated');
    }
    if (!params.workspaceId) {
      throw new StudioFsValidationError('workspaceId is required');
    }

    await this.assertWriteAccess(params.workspaceId, user);

    const catalogRoot = params.catalogPath?.trim()
      ? resolveCatalogRoot(params.catalogPath.trim())
      : (
          await this.ensureDefaultCatalog({ workspaceId: params.workspaceId }, user)
        ).catalogPath;

    const existing = await this.listCatalogProducts(
      {
        workspaceId: params.workspaceId,
        catalogPath: catalogRoot,
        filter: { kind: 'service' },
        page: { number: 1, size: 1000 },
      },
      user,
    );

    const existingById = new Map(
      (existing.items ?? []).map((item) => [item.id.toLowerCase(), item]),
    );

    const seeds: CatalogProductInput[] = [
      {
        id: 'svc_delivery',
        origin: 'system',
        name: 'Delivery',
        kind: 'service',
        status: 'active',
        tags: ['service', 'logistics', 'delivery', 'transport'],
        activityTags: ['deliver'],
        targetSpecs: [],
        taskTemplates: [
          {
            id: 'dispatch',
            title: 'Dispatch',
            activityTagIds: ['dispatch'],
          },
          {
            id: 'load',
            title: 'Load equipment',
            activityTagIds: ['load'],
          },
          {
            id: 'transport',
            title: 'Transport to destination',
            activityTagIds: ['transport'],
            contextTagIds: ['destination'],
          },
          {
            id: 'unload',
            title: 'Unload equipment',
            activityTagIds: ['unload'],
          },
          {
            id: 'confirm_delivery',
            title: 'Confirm delivery',
            activityTagIds: ['confirm'],
            contextTagIds: ['delivery'],
          },
        ],
        attributes: [],
        sourceRefs: [],
        sourcePaths: [],
        images: [],
      },
      {
        id: 'svc_pickup',
        origin: 'system',
        name: 'Pickup',
        kind: 'service',
        status: 'active',
        tags: ['service', 'logistics', 'pickup', 'transport'],
        activityTags: ['pickup'],
        targetSpecs: [],
        taskTemplates: [
          {
            id: 'dispatch',
            title: 'Dispatch',
            activityTagIds: ['dispatch'],
          },
          {
            id: 'load',
            title: 'Load equipment',
            activityTagIds: ['load'],
            contextTagIds: ['pickup'],
          },
          {
            id: 'transport',
            title: 'Transport to yard',
            activityTagIds: ['transport'],
            contextTagIds: ['return'],
          },
          {
            id: 'unload',
            title: 'Unload equipment',
            activityTagIds: ['unload'],
          },
          {
            id: 'inspect',
            title: 'Inspect equipment',
            activityTagIds: ['inspect'],
          },
        ],
        attributes: [],
        sourceRefs: [],
        sourcePaths: [],
        images: [],
      },
    ];

    const results: Array<{ status: 'created' | 'existing'; product: StudioCatalogProductSummary }> =
      [];

    for (const seed of seeds) {
      const found = existingById.get(seed.id.toLowerCase());
      if (found) {
        results.push({ status: 'existing', product: found });
        continue;
      }

      const created = await this.createCatalogProduct(
        {
          workspaceId: params.workspaceId,
          catalogPath: catalogRoot,
          product: seed,
        },
        user,
      );

      results.push({ status: 'created', product: created.product });
    }

    return { catalogPath: catalogRoot, products: results };
  }

  async createCatalogProduct(
    params: {
      workspaceId: string;
      catalogPath?: string | null;
      product: CatalogProductInput;
    },
    user?: UserAuthPayload,
  ): Promise<{ catalogPath: string; product: StudioCatalogProductSummary }> {
    if (!user) {
      throw new StudioFsValidationError('User not authenticated');
    }
    if (!params.workspaceId) {
      throw new StudioFsValidationError('workspaceId is required');
    }

    const trimmedCatalogPath = params.catalogPath?.trim();
    const catalogRoot = trimmedCatalogPath
      ? resolveCatalogRoot(trimmedCatalogPath)
      : (
          await this.ensureDefaultCatalog(
            { workspaceId: params.workspaceId },
            user,
          )
        ).catalogPath;

    const manifestPath = `${catalogRoot}/catalog.jsonc`;
    const manifest = await this.model.findNode({
      companyId: user.companyId,
      workspaceId: params.workspaceId,
      path: manifestPath,
    });
    if (!manifest || manifest.type !== 'FILE') {
      throw new StudioFsNotFoundError('catalog.jsonc not found');
    }

    const targetSpecs =
      params.product.targetSpecs && params.product.targetSpecs.length > 0
        ? params.product.targetSpecs.map((spec) => {
            if (spec.kind === 'tags') {
              return {
                kind: 'tags' as const,
                tagIds: Array.isArray(spec.tagIds)
                  ? Array.from(new Set(spec.tagIds))
                  : [],
              };
            }
            return {
              kind: 'product' as const,
              productId: spec.productId ?? '',
            };
          })
        : undefined;

    const taskTemplates =
      Array.isArray(params.product.taskTemplates) &&
      params.product.taskTemplates.length > 0
        ? params.product.taskTemplates.map((template) => ({
            id: template.id,
            title: template.title.trim(),
            activityTagIds: normalizeTags(template.activityTagIds),
            contextTagIds: template.contextTagIds
              ? normalizeTags(template.contextTagIds)
              : undefined,
            notes: template.notes ?? undefined,
          }))
        : undefined;

    const attributes =
      params.product.attributes?.map((attribute) => ({
        key: attribute.key,
        value: attribute.value,
        unit: attribute.unit ?? undefined,
        contextTags: attribute.contextTags
          ? normalizeAttributeContextTags(attribute.contextTags)
          : undefined,
        sourceRef: attribute.sourceRef ?? undefined,
      })) ?? undefined;

    const images =
      params.product.images?.map((image) => ({
        uri: image.uri,
        alt: image.alt ?? undefined,
      })) ?? undefined;

    const tags = params.product.tags ? normalizeTags(params.product.tags) : undefined;
    const activityTags = params.product.activityTags
      ? normalizeTags(params.product.activityTags)
      : undefined;
    const inferredService =
      (activityTags && activityTags.length > 0) ||
      (targetSpecs && targetSpecs.length > 0);

    const candidate: CatalogProduct = {
      schemaVersion: params.product.schemaVersion ?? '1.0',
      id: params.product.id,
      origin: params.product.origin ?? 'workspace',
      name: params.product.name,
      description: params.product.description ?? undefined,
      kind: params.product.kind ?? (inferredService ? 'service' : undefined),
      status: params.product.status ?? undefined,
      categoryPath: params.product.categoryPath ?? undefined,
      tags,
      activityTags,
      targetSpecs,
      taskTemplates,
      attributes,
      sourceRefs: params.product.sourceRefs ?? undefined,
      sourcePaths: params.product.sourcePaths ?? undefined,
      images,
      notes: params.product.notes ?? undefined,
    };

    const validation = catalogProductSchema.safeParse(candidate);
    if (!validation.success) {
      const message = validation.error.issues
        .map(
          (issue) =>
            `${formatIssuePath('product', issue.path)}: ${issue.message}`,
        )
        .join('; ');
      throw new StudioFsValidationError(`Invalid catalog product: ${message}`);
    }

    const product = validation.data;
    const lintErrors: string[] = [];

    normalizeTags(product.tags).forEach((tag, index) => {
      if (isIdLikeTag(tag)) {
        lintErrors.push(
          `product.tags[${index}]: Tag "${tag}" looks like a tag ID; product.tags must store canonical tag labels`,
        );
      }
      const normalized = tag.toLowerCase();
      if (MEASURABLE_TAGS.has(normalized)) {
        lintErrors.push(`product.tags[${index}]: Tag "${tag}" should be an attribute, not a tag`);
      }
      if (UNIT_TAGS.has(normalized)) {
        lintErrors.push(`product.tags[${index}]: Unit "${tag}" should not be stored as a tag`);
      }
    });

    normalizeTags(product.activityTags).forEach((tag, index) => {
      if (isIdLikeTag(tag)) {
        lintErrors.push(
          `product.activityTags[${index}]: Activity tag "${tag}" looks like a tag ID; product.activityTags must store canonical tag labels`,
        );
      }
      const normalized = tag.toLowerCase();
      if (UNIT_TAGS.has(normalized)) {
        lintErrors.push(
          `product.activityTags[${index}]: Unit "${tag}" should not be stored as a tag`,
        );
      }
    });

    (product.targetSpecs ?? []).forEach((spec, specIndex) => {
      if (spec.kind !== 'tags') return;
      (spec.tagIds ?? []).forEach((tagId, tagIndex) => {
        if (isIdLikeTag(tagId)) {
          lintErrors.push(
            `product.targetSpecs[${specIndex}].tagIds[${tagIndex}]: Target tag "${tagId}" looks like a tag ID; targetSpecs.tagIds must store canonical tag labels`,
          );
        }
        const normalized = tagId.toLowerCase();
        if (MEASURABLE_TAGS.has(normalized)) {
          lintErrors.push(
            `product.targetSpecs[${specIndex}].tagIds[${tagIndex}]: Target tag "${tagId}" should be an attribute, not a tag`,
          );
        }
        if (UNIT_TAGS.has(normalized)) {
          lintErrors.push(
            `product.targetSpecs[${specIndex}].tagIds[${tagIndex}]: Unit "${tagId}" should not be stored as a tag`,
          );
        }
      });
    });

    const taskTemplateIdCounts = new Map<string, number>();
    (product.taskTemplates ?? []).forEach((template, templateIndex) => {
      const templateId = template.id.trim();
      taskTemplateIdCounts.set(
        templateId,
        (taskTemplateIdCounts.get(templateId) ?? 0) + 1,
      );
      if ((taskTemplateIdCounts.get(templateId) ?? 0) > 1) {
        lintErrors.push(
          `product.taskTemplates: Duplicate task template id "${templateId}" detected; taskTemplates[].id must be unique per product`,
        );
      }

      normalizeTags(template.activityTagIds).forEach((tagId, tagIndex) => {
        if (isIdLikeTag(tagId)) {
          lintErrors.push(
            `product.taskTemplates[${templateIndex}].activityTagIds[${tagIndex}]: Activity tag "${tagId}" looks like a tag ID; task templates must store canonical tag labels`,
          );
        }
        const normalized = tagId.toLowerCase();
        if (UNIT_TAGS.has(normalized)) {
          lintErrors.push(
            `product.taskTemplates[${templateIndex}].activityTagIds[${tagIndex}]: Unit "${tagId}" should not be stored as a tag`,
          );
        }
      });

      normalizeTags(template.contextTagIds).forEach((tagId, tagIndex) => {
        if (isIdLikeTag(tagId)) {
          lintErrors.push(
            `product.taskTemplates[${templateIndex}].contextTagIds[${tagIndex}]: Context tag "${tagId}" looks like a tag ID; task templates must store canonical tag labels`,
          );
        }
        const normalized = tagId.toLowerCase();
        if (MEASURABLE_TAGS.has(normalized)) {
          lintErrors.push(
            `product.taskTemplates[${templateIndex}].contextTagIds[${tagIndex}]: Context tag "${tagId}" should be an attribute, not a tag`,
          );
        }
        if (UNIT_TAGS.has(normalized)) {
          lintErrors.push(
            `product.taskTemplates[${templateIndex}].contextTagIds[${tagIndex}]: Unit "${tagId}" should not be stored as a tag`,
          );
        }
      });
    });

    (product.attributes ?? []).forEach((attribute, index) => {
      if (isIdLikeAttributeType(attribute.key)) {
        lintErrors.push(
          `product.attributes[${index}].key: Attribute key "${attribute.key}" looks like an attribute type ID; attributes[].key must store canonical attribute type names`,
        );
      }
      if (attribute.key.includes('_')) {
        lintErrors.push(
          `product.attributes[${index}].key: Blended attribute type "${attribute.key}" must be decomposed`,
        );
      }

      const normalizedKey = attribute.key.trim().toLowerCase();
      if (UNIQUE_BRAND_ATTRIBUTE_KEYS.has(normalizedKey) && attribute.unit) {
        lintErrors.push(
          `product.attributes[${index}].unit: BRAND attribute "${attribute.key}" must not include a unit`,
        );
      }
      if (
        UNIQUE_BRAND_ATTRIBUTE_KEYS.has(normalizedKey) &&
        normalizedKey === 'year' &&
        typeof attribute.value !== 'number'
      ) {
        lintErrors.push(
          `product.attributes[${index}].value: BRAND attribute "year" must be a number`,
        );
      }
    });

    const brandKeyCounts = new Map<string, number>();
    (product.attributes ?? []).forEach((attribute) => {
      const normalized = attribute.key.trim().toLowerCase();
      if (!UNIQUE_BRAND_ATTRIBUTE_KEYS.has(normalized)) return;
      brandKeyCounts.set(normalized, (brandKeyCounts.get(normalized) ?? 0) + 1);
    });

    for (const [key, count] of brandKeyCounts) {
      if (count <= 1) continue;
      lintErrors.push(
        `product.attributes: Duplicate BRAND attribute "${key}" detected; BRAND attributes must be unique per product`,
      );
    }

    if (lintErrors.length > 0) {
      throw new StudioFsValidationError(lintErrors.join('; '));
    }

    const productPath = `${catalogRoot}/products/${product.id}.jsonc`;
    const existing = await this.model.findNode({
      companyId: user.companyId,
      workspaceId: params.workspaceId,
      path: productPath,
      includeDeleted: true,
    });
    if (existing && !existing.deleted) {
      throw new StudioFsConflictError('Catalog product already exists');
    }

    await this.write(
      {
        workspaceId: params.workspaceId,
        path: productPath,
        content: JSON.stringify(product, null, 2),
        mimeType: 'application/json',
      },
      user,
    );

    return {
      catalogPath: catalogRoot,
      product: {
        id: product.id,
        name: product.name,
        path: productPath,
        origin: product.origin ?? 'workspace',
        kind: product.kind,
        status: product.status ?? 'active',
        categoryPath: product.categoryPath,
        tags:
          product.tags && product.tags.length > 0 ? product.tags : undefined,
      },
    };
  }

  async listCatalogProducts(
    params: {
      workspaceId: string;
      catalogPath?: string | null;
      filter?: {
        text?: string | null;
        kind?: 'material' | 'service' | 'assembly' | null;
        status?: 'draft' | 'active' | 'archived' | null;
      } | null;
      page?: {
        number?: number | null;
        size?: number | null;
      } | null;
    },
    user?: UserAuthPayload,
  ): Promise<StudioCatalogListProductsResult> {
    if (!user) {
      throw new StudioFsValidationError('User not authenticated');
    }
    if (!params.workspaceId) {
      throw new StudioFsValidationError('workspaceId is required');
    }
    await this.assertReadAccess(params.workspaceId, user);

    const catalogRoot = params.catalogPath?.trim()
      ? resolveCatalogRoot(params.catalogPath.trim())
      : `/catalogs/${DEFAULT_CATALOG_SLUG}`;

    const productsRoot = `${catalogRoot}/products`;

    const nodes = await this.model.listChildren({
      companyId: user.companyId,
      workspaceId: params.workspaceId,
      parentPath: productsRoot,
    });

    const errors: StudioCatalogValidationIssue[] = [];
    const warnings: StudioCatalogValidationIssue[] = [];

    const parsed = nodes
      .filter((node) => node.type === 'FILE' && isJsonFile(node.path))
      .map((node) => {
        const record = this.parseCatalogProductNode(node, errors, warnings);
        if (!record) {
          return null;
        }

        const summary = buildProductSummary(record);

        return {
          ...summary,
          etag: node.etag,
          updatedAt: record.updatedAt,
          tagsCount: record.tags.length,
        } satisfies StudioCatalogProductListItem;
      })
      .filter(
        (value): value is StudioCatalogProductListItem => value !== null,
      );

    const filterText = params.filter?.text?.trim().toLowerCase();
    const normalizeKind = (value: unknown) => {
      if (value === null || value === undefined) return null;
      if (typeof value !== 'string') {
        throw new StudioFsValidationError('filter.kind must be a string');
      }
      const normalized = value.trim().toLowerCase();
      if (normalized === 'material' || normalized === 'material_product') {
        return 'material' as const;
      }
      if (normalized === 'service' || normalized === 'service_product') {
        return 'service' as const;
      }
      if (normalized === 'assembly' || normalized === 'assembly_product') {
        return 'assembly' as const;
      }
      throw new StudioFsValidationError(
        'filter.kind must be material, service, or assembly',
      );
    };

    const normalizeStatus = (value: unknown) => {
      if (value === null || value === undefined) return null;
      if (typeof value !== 'string') {
        throw new StudioFsValidationError('filter.status must be a string');
      }
      const normalized = value.trim().toLowerCase();
      if (
        normalized === 'draft' ||
        normalized === 'active' ||
        normalized === 'archived'
      ) {
        return normalized as 'draft' | 'active' | 'archived';
      }
      throw new StudioFsValidationError(
        'filter.status must be draft, active, or archived',
      );
    };

    const filterKind = normalizeKind(params.filter?.kind ?? null);
    const filterStatus = normalizeStatus(params.filter?.status ?? null);

    const filtered = parsed.filter((product) => {
      if (filterKind && product.kind !== filterKind) {
        return false;
      }
      if (filterStatus && product.status !== filterStatus) {
        return false;
      }
      if (filterText) {
        const haystack = [
          product.id,
          product.name,
          product.categoryPath ?? '',
          ...(product.tags ?? []),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(filterText)) {
          return false;
        }
      }
      return true;
    });

    filtered.sort((a, b) => {
      const delta = b.updatedAt.getTime() - a.updatedAt.getTime();
      if (delta !== 0) return delta;
      return a.id.localeCompare(b.id);
    });

    const pageNumber = Math.max(1, Math.floor(params.page?.number ?? 1));
    const pageSize = Math.max(1, Math.floor(params.page?.size ?? 50));
    const totalItems = filtered.length;
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
    const startIndex = (pageNumber - 1) * pageSize;
    const items =
      startIndex >= totalItems
        ? []
        : filtered.slice(startIndex, startIndex + pageSize);

    return {
      catalogPath: catalogRoot,
      items,
      page: {
        number: pageNumber,
        size: items.length,
        totalItems,
        totalPages,
      },
    };
  }

  async validateCatalog(
    params: { workspaceId: string; catalogPath: string },
    user?: UserAuthPayload,
  ): Promise<StudioCatalogValidateResult> {
    if (!user) {
      throw new StudioFsValidationError('User not authenticated');
    }
    if (!params.workspaceId) {
      throw new StudioFsValidationError('workspaceId is required');
    }
    const compilation = await this.buildCatalogCompilation(params, user);
    return { errors: compilation.errors, warnings: compilation.warnings };
  }
}

export const createStudioFsService = (config: {
  mongoClient: MongoClient;
  authz: AuthZ;
}) => {
  const model = createStudioFsModel({
    mongoClient: config.mongoClient,
    dbName: 'es-erp',
  });
  return new StudioFsService({ model, authz: config.authz });
};

export { StudioFsError };
