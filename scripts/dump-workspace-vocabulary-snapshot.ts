import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MongoClient } from 'mongodb';

type Args = {
  workspaceId?: string;
  out?: string;
};

const parseArgs = (argv: string[]): Args => {
  const args: Args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--workspaceId') {
      args.workspaceId = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === '--out') {
      args.out = argv[index + 1];
      index += 1;
      continue;
    }
  }
  return args;
};

const escapePipes = (value: string) => value.replace(/\|/g, '\\|');

const mdValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return escapePipes(value.map((item) => mdValue(item)).filter(Boolean).join(', '));
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return escapePipes(JSON.stringify(value));
  return escapePipes(String(value));
};

const mdTable = (headers: string[], rows: unknown[][]): string => {
  const headerLine = `| ${headers.join(' | ')} |`;
  const dividerLine = `| ${headers.map(() => '---').join(' | ')} |`;
  const rowLines = rows.map(
    (row) => `| ${row.map((cell) => mdValue(cell)).join(' | ')} |`,
  );
  return [headerLine, dividerLine, ...rowLines].join('\n');
};

const normalizeLabel = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const stripUnderscores = (value: string) => value.replace(/_/g, '');

const stripJsoncComments = (value: string) => {
  let output = '';
  let inString = false;
  let stringChar = '"';
  let escaping = false;

  for (let index = 0; index < value.length; index += 1) {
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
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
      output += char;
      continue;
    }

    if (char === '/' && next === '/') {
      index += 2;
      while (index < value.length && value[index] !== '\n') {
        index += 1;
      }
      output += '\n';
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

const CONTEXT_TOKENS = [
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
  'engine',
] as const;

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const uri = process.env.MONGO_CONNECTION_STRING;
  if (!uri) throw new Error('MONGO_CONNECTION_STRING is required');

  const globalDbName = process.env.GLOBAL_LIBRARY_DB_NAME || 'es-erp-global';
  const mainDbName = 'es-erp';
  const outPath = resolve(process.cwd(), args.out || 'docs/workspace-vocabulary-snapshot.md');

  const client = new MongoClient(uri);
  await client.connect();
  const mainDb = client.db(mainDbName);
  const globalDb = client.db(globalDbName);

  const workspacesCollection = mainDb.collection<any>('workspaces');
  const workspaceFilter: any = args.workspaceId ? { _id: args.workspaceId } : {};
  const workspaces = await workspacesCollection
    .find(workspaceFilter)
    .sort({ createdAt: 1 })
    .toArray();

  if (!workspaces.length) {
    throw new Error(args.workspaceId ? `Workspace not found: ${args.workspaceId}` : 'No workspaces found');
  }

  const workspaceIds = workspaces.map((ws) => String(ws._id));

  const [workspaceTags, workspaceAttributeTypes, workspaceUnits, workspaceAttributeValues] =
    await Promise.all([
      mainDb
        .collection<any>('workspace_tags')
        .find({ workspaceId: { $in: workspaceIds } })
        .sort({ workspaceId: 1, label: 1 })
        .toArray(),
      mainDb
        .collection<any>('workspace_attribute_types')
        .find({ workspaceId: { $in: workspaceIds } })
        .sort({ workspaceId: 1, name: 1 })
        .toArray(),
      mainDb
        .collection<any>('workspace_units')
        .find({ workspaceId: { $in: workspaceIds } })
        .sort({ workspaceId: 1, code: 1 })
        .toArray(),
      mainDb
        .collection<any>('workspace_attribute_values')
        .find({ workspaceId: { $in: workspaceIds } })
        .sort({ workspaceId: 1, attributeTypeId: 1, value: 1 })
        .toArray(),
    ]);

  const [globalTags, globalAttributeTypes, globalUnits] = await Promise.all([
    globalDb.collection<any>('global_tags').find({}).sort({ label: 1 }).toArray(),
    globalDb
      .collection<any>('global_attribute_types')
      .find({})
      .sort({ name: 1 })
      .toArray(),
    globalDb.collection<any>('global_units').find({}).sort({ code: 1 }).toArray(),
  ]);

  const studioProductNodes = await mainDb
    .collection<any>('studio_fs_nodes')
    .find({
      workspaceId: { $in: workspaceIds },
      type: 'FILE',
      path: { $regex: '^/catalogs/default/products/.*\\.jsonc?$' },
      deleted: { $ne: true },
    })
    .sort({ path: 1 })
    .toArray();

  const studioProducts = studioProductNodes.map((node) => {
    const raw = typeof node.content === 'string' ? node.content : '';
    try {
      const parsed = parseJsonc(raw);
      return {
        workspaceId: node.workspaceId,
        path: node.path,
        updatedAt: node.updatedAt,
        etag: node.etag,
        product: parsed,
      };
    } catch (error) {
      return {
        workspaceId: node.workspaceId,
        path: node.path,
        updatedAt: node.updatedAt,
        etag: node.etag,
        product: null,
        parseError: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  const knownAttributeTypeNames = new Set<string>([
    ...globalAttributeTypes.map((type) => String(type.name)),
    ...workspaceAttributeTypes.map((type) => String(type.name)),
  ]);

  const brandAttributeKeys = new Set<string>([
    ...globalAttributeTypes.filter((type) => type.kind === 'BRAND').map((type) => String(type.name)),
    ...workspaceAttributeTypes.filter((type) => type.kind === 'BRAND').map((type) => String(type.name)),
  ]);

  const globalTagsByLabel = new Map(
    globalTags.map((tag) => [String(tag.label), tag]),
  );
  const globalAttributeTypesByName = new Map(
    globalAttributeTypes.map((type) => [String(type.name), type]),
  );

  const unlinkedWorkspaceTagsThatExistGlobally = workspaceTags
    .filter((tag) => !tag.globalTagId && globalTagsByLabel.has(String(tag.label)))
    .map((tag) => String(tag.label));

  const unlinkedWorkspaceAttributeTypesThatExistGlobally = workspaceAttributeTypes
    .filter(
      (type) =>
        !type.globalAttributeTypeId &&
        globalAttributeTypesByName.has(String(type.name)),
    )
    .map((type) => String(type.name));

  const identityTagCandidates = new Set<string>();
  for (const tag of workspaceTags) {
    if (tag.pos !== 'NOUN') continue;
    const label = String(tag.label);
    if (!label) continue;
    if (/[0-9]/.test(label)) identityTagCandidates.add(label);
  }

  const productPolicyFindings: Array<{
    workspaceId: string;
    productId: string;
    productName?: string;
    path: string;
    issues: string[];
  }> = [];

  const brandValueTokens = new Set<string>();

  for (const entry of studioProducts) {
    const product = entry.product as any;
    if (!product || typeof product !== 'object') continue;

    const issues: string[] = [];

    const tags: string[] = Array.isArray(product.tags) ? product.tags.map(String) : [];
    const attributes: any[] = Array.isArray(product.attributes) ? product.attributes : [];

    const attributeKeys = attributes
      .map((attr) => (attr && typeof attr === 'object' ? String(attr.key || '') : ''))
      .filter(Boolean);

    const idLikeTags = tags.filter((tag) => /^(WTG|GTG)-/.test(tag));
    if (idLikeTags.length) {
      issues.push(
        `Tag IDs used in product.tags (should be tag labels): ${idLikeTags.join(', ')}`,
      );
    }

    const idLikeAttributeKeys = attributeKeys.filter((key) => /^(WAT|GAT)-/.test(key));
    if (idLikeAttributeKeys.length) {
      issues.push(
        `Attribute type IDs used in attributes[].key (should be attribute type name): ${idLikeAttributeKeys.join(
          ', ',
        )}`,
      );
    }

    const unknownAttributeKeys = attributeKeys.filter((key) => !knownAttributeTypeNames.has(key));
    if (unknownAttributeKeys.length) {
      issues.push(`Unknown attribute keys (not in vocab): ${unknownAttributeKeys.join(', ')}`);
    }

    const blendedAttributeKeys = attributeKeys.filter((key) => {
      const normalized = normalizeLabel(key);
      return CONTEXT_TOKENS.some((token) => normalized.includes(token));
    });
    if (blendedAttributeKeys.length) {
      issues.push(
        `Blended attribute keys (should be atomic + contextTags): ${blendedAttributeKeys.join(', ')}`,
      );
    }

    const normalizedBrandValues = new Set<string>();
    for (const attr of attributes) {
      if (!attr || typeof attr !== 'object') continue;
      const key = String(attr.key || '');
      if (!brandAttributeKeys.has(key)) continue;
      const rawValue = attr.value;
      if (rawValue === undefined || rawValue === null) continue;
      const normalizedValue = normalizeLabel(String(rawValue));
      normalizedBrandValues.add(normalizedValue);
      brandValueTokens.add(normalizedValue);
      brandValueTokens.add(stripUnderscores(normalizedValue));
    }

    const suspiciousIdentityTags = tags.filter((tag) => {
      const normalized = normalizeLabel(tag);
      return normalizedBrandValues.has(normalized) || identityTagCandidates.has(tag);
    });
    if (suspiciousIdentityTags.length) {
      issues.push(
        `Tags likely representing identity (should be BRAND attribute values): ${suspiciousIdentityTags.join(', ')}`,
      );
    }

    if (issues.length) {
      productPolicyFindings.push({
        workspaceId: entry.workspaceId,
        productId: String(product.id || entry.path.split('/').pop() || ''),
        productName: typeof product.name === 'string' ? product.name : undefined,
        path: entry.path,
        issues,
      });
    }
  }

  const workspaceTagsMatchingBrandValues = workspaceTags
    .filter((tag) => tag.pos === 'NOUN')
    .map((tag) => String(tag.label))
    .filter(Boolean)
    .filter((label) => {
      const normalized = normalizeLabel(label);
      return (
        brandValueTokens.has(normalized) || brandValueTokens.has(stripUnderscores(normalized))
      );
    });

  const generatedAt = new Date().toISOString();

  const lines: string[] = [];
  lines.push('# Workspace vocabulary snapshot (generated)');
  lines.push('');
  lines.push(`Generated: \`${generatedAt}\``);
  lines.push(`Main DB: \`${mainDbName}\``);
  lines.push(`Global vocab DB: \`${globalDbName}\``);
  lines.push('');
  lines.push('Regenerate:');
  lines.push('');
  lines.push('```bash');
  lines.push(
    './node_modules/.bin/dotenv -e ./env/.env.local -- ./node_modules/.bin/ts-node scripts/dump-workspace-vocabulary-snapshot.ts',
  );
  lines.push('```');
  lines.push('');
  lines.push('## Summary counts');
  lines.push('');
  lines.push(
    mdTable(
      ['collection', 'count'],
      [
        ['workspaces', workspaces.length],
        ['workspace_tags', workspaceTags.length],
        ['workspace_attribute_types', workspaceAttributeTypes.length],
        ['workspace_units', workspaceUnits.length],
        ['workspace_attribute_values', workspaceAttributeValues.length],
        ['global_tags', globalTags.length],
        ['global_attribute_types', globalAttributeTypes.length],
        ['global_units', globalUnits.length],
        ['studio catalog products', studioProducts.length],
      ],
    ),
  );
  lines.push('');

  lines.push('## Workspaces');
  lines.push('');
  lines.push(
    mdTable(
      ['id', 'name', 'companyId', 'domain', 'accessType', 'archived', 'createdAt', 'updatedAt'],
      workspaces.map((ws) => [
        ws._id,
        ws.name,
        ws.companyId,
        ws.domain,
        ws.accessType,
        ws.archived,
        ws.createdAt,
        ws.updatedAt,
      ]),
    ),
  );
  lines.push('');

  lines.push('## Workspace draft vocabulary (workspace_* collections)');
  lines.push('');

  const tagsByWorkspace = new Map<string, any[]>();
  for (const tag of workspaceTags) {
    const list = tagsByWorkspace.get(tag.workspaceId) || [];
    list.push(tag);
    tagsByWorkspace.set(tag.workspaceId, list);
  }

  const attrTypesByWorkspace = new Map<string, any[]>();
  for (const type of workspaceAttributeTypes) {
    const list = attrTypesByWorkspace.get(type.workspaceId) || [];
    list.push(type);
    attrTypesByWorkspace.set(type.workspaceId, list);
  }

  const unitsByWorkspace = new Map<string, any[]>();
  for (const unit of workspaceUnits) {
    const list = unitsByWorkspace.get(unit.workspaceId) || [];
    list.push(unit);
    unitsByWorkspace.set(unit.workspaceId, list);
  }

  const attrValuesByWorkspace = new Map<string, any[]>();
  for (const value of workspaceAttributeValues) {
    const list = attrValuesByWorkspace.get(value.workspaceId) || [];
    list.push(value);
    attrValuesByWorkspace.set(value.workspaceId, list);
  }

  for (const ws of workspaces) {
    lines.push(`### Workspace: \`${ws.name}\` (\`${ws._id}\`)`);
    lines.push('');

    const wsTags = tagsByWorkspace.get(ws._id) || [];
    lines.push(`#### Workspace tags (\`workspace_tags\`)`);
    lines.push('');
    if (!wsTags.length) {
      lines.push('_none_');
    } else {
      lines.push(
        mdTable(
          [
            'label',
            'id',
            'displayName',
            'pos',
            'status',
            'auditStatus',
            'synonyms',
            'globalTagId',
            'source',
            'notes',
            'updatedAt',
          ],
          wsTags.map((tag) => [
            tag.label,
            tag._id,
            tag.displayName,
            tag.pos,
            tag.status,
            tag.auditStatus,
            tag.synonyms,
            tag.globalTagId,
            tag.source,
            tag.notes,
            tag.updatedAt,
          ]),
        ),
      );
    }
    lines.push('');

    const wsAttrTypes = attrTypesByWorkspace.get(ws._id) || [];
    lines.push(`#### Workspace attribute types (\`workspace_attribute_types\`)`);
    lines.push('');
    if (!wsAttrTypes.length) {
      lines.push('_none_');
    } else {
      lines.push(
        mdTable(
          [
            'name',
            'id',
            'kind',
            'valueType',
            'dimension',
            'canonicalUnit',
            'allowedUnits',
            'status',
            'auditStatus',
            'synonyms',
            'globalAttributeTypeId',
            'appliesTo',
            'usageHints',
            'notes',
            'updatedAt',
          ],
          wsAttrTypes.map((type) => [
            type.name,
            type._id,
            type.kind,
            type.valueType,
            type.dimension,
            type.canonicalUnit,
            type.allowedUnits,
            type.status,
            type.auditStatus,
            type.synonyms,
            type.globalAttributeTypeId,
            type.appliesTo,
            type.usageHints,
            type.notes,
            type.updatedAt,
          ]),
        ),
      );
    }
    lines.push('');

    const wsUnits = unitsByWorkspace.get(ws._id) || [];
    lines.push(`#### Workspace units (\`workspace_units\`)`);
    lines.push('');
    if (!wsUnits.length) {
      lines.push('_none_');
    } else {
      lines.push(
        mdTable(
          [
            'code',
            'id',
            'name',
            'dimension',
            'canonicalUnitCode',
            'toCanonicalFactor',
            'offset',
            'status',
            'globalUnitCode',
            'updatedAt',
          ],
          wsUnits.map((unit) => [
            unit.code,
            unit._id,
            unit.name,
            unit.dimension,
            unit.canonicalUnitCode,
            unit.toCanonicalFactor,
            unit.offset,
            unit.status,
            unit.globalUnitCode,
            unit.updatedAt,
          ]),
        ),
      );
    }
    lines.push('');

    const wsAttrValues = attrValuesByWorkspace.get(ws._id) || [];
    lines.push(`#### Workspace attribute values (\`workspace_attribute_values\`)`);
    lines.push('');
    if (!wsAttrValues.length) {
      lines.push('_none_');
    } else {
      lines.push(
        mdTable(
          [
            'attributeTypeId',
            'id',
            'value',
            'synonyms',
            'status',
            'auditStatus',
            'globalAttributeValueId',
            'source',
            'notes',
            'updatedAt',
          ],
          wsAttrValues.map((value) => [
            value.attributeTypeId,
            value._id,
            value.value,
            value.synonyms,
            value.status,
            value.auditStatus,
            value.globalAttributeValueId,
            value.source,
            value.notes,
            value.updatedAt,
          ]),
        ),
      );
    }
    lines.push('');
  }

  lines.push('## Global vocabulary (global_* collections)');
  lines.push('');

  lines.push('### Global tags (`global_tags`)');
  lines.push('');
  lines.push(
    mdTable(
      ['label', 'id', 'displayName', 'pos', 'status', 'auditStatus', 'synonyms', 'mergedIntoId', 'notes', 'updatedAt'],
      globalTags.map((tag) => [
        tag.label,
        tag._id,
        tag.displayName,
        tag.pos,
        tag.status,
        tag.auditStatus,
        tag.synonyms,
        tag.mergedIntoId,
        tag.notes,
        tag.updatedAt,
      ]),
    ),
  );
  lines.push('');

  lines.push('### Global attribute types (`global_attribute_types`)');
  lines.push('');
  lines.push(
    mdTable(
      [
        'name',
        'id',
        'kind',
        'valueType',
        'dimension',
        'canonicalUnit',
        'allowedUnits',
        'status',
        'auditStatus',
        'synonyms',
        'appliesTo',
        'usageHints',
        'notes',
        'updatedAt',
      ],
      globalAttributeTypes.map((type) => [
        type.name,
        type._id,
        type.kind,
        type.valueType,
        type.dimension,
        type.canonicalUnit,
        type.allowedUnits,
        type.status,
        type.auditStatus,
        type.synonyms,
        type.appliesTo,
        type.usageHints,
        type.notes,
        type.updatedAt,
      ]),
    ),
  );
  lines.push('');

  lines.push('### Global units (`global_units`)');
  lines.push('');
  lines.push(
    mdTable(
      ['code', 'name', 'dimension', 'canonicalUnitCode', 'toCanonicalFactor', 'offset', 'status'],
      globalUnits.map((unit) => [
        unit.code,
        unit.name,
        unit.dimension,
        unit.canonicalUnitCode,
        unit.toCanonicalFactor,
        unit.offset,
        unit.status,
      ]),
    ),
  );
  lines.push('');

  lines.push('## Studio catalog products (StudioFS)');
  lines.push('');
  if (!studioProducts.length) {
    lines.push('_none_');
    lines.push('');
  } else {
    lines.push(
      mdTable(
        ['workspaceId', 'path', 'productId', 'name', 'kind', 'tags', 'activityTags', 'attributeKeys', 'updatedAt'],
        studioProducts.map((entry) => {
          const product = entry.product as any;
          const tags = product && Array.isArray(product.tags) ? product.tags : [];
          const activityTags =
            product && Array.isArray(product.activityTags) ? product.activityTags : [];
          const attributeKeys =
            product && Array.isArray(product.attributes)
              ? product.attributes
                  .map((attr: any) => (attr && typeof attr === 'object' ? attr.key : null))
                  .filter(Boolean)
              : [];
          return [
            entry.workspaceId,
            entry.path,
            product?.id,
            product?.name,
            product?.kind,
            tags,
            activityTags,
            attributeKeys,
            entry.updatedAt,
          ];
        }),
      ),
    );
    lines.push('');

    lines.push('### Raw product JSON (parsed)');
    lines.push('');
    for (const entry of studioProducts) {
      const product = entry.product as any;
      const label = product?.id ? String(product.id) : entry.path;
      lines.push(`#### ${label}`);
      lines.push('');
      lines.push('```json');
      lines.push(JSON.stringify(entry.product, null, 2));
      lines.push('```');
      lines.push('');
    }
  }

  lines.push('## Cleanup notes (candidate findings)');
  lines.push('');

  const misconfiguredBrandAttributeTypes = workspaceAttributeTypes
    .filter((type) => type.kind === 'BRAND')
    .filter(
      (type) =>
        type.dimension ||
        type.canonicalUnit ||
        (Array.isArray(type.allowedUnits) && type.allowedUnits.length),
    )
    .map((type) => ({
      name: String(type.name),
      dimension: type.dimension,
      canonicalUnit: type.canonicalUnit,
      allowedUnits: type.allowedUnits,
    }));

  lines.push('- Workspace BRAND attribute types should not have dimension/units:');
  if (!misconfiguredBrandAttributeTypes.length) {
    lines.push('  - none');
  } else {
    for (const entry of misconfiguredBrandAttributeTypes) {
      lines.push(
        `  - ${entry.name} (dimension=${mdValue(entry.dimension)} canonicalUnit=${mdValue(entry.canonicalUnit)} allowedUnits=${mdValue(entry.allowedUnits)})`,
      );
    }
  }

  const workspaceTagsWithDigits = workspaceTags
    .filter((tag) => tag.pos === 'NOUN')
    .map((tag) => String(tag.label))
    .filter(Boolean)
    .filter((label) => /[0-9]/.test(label));

  lines.push('- Workspace tags with digits (likely identity; consider deleting):');
  lines.push(
    workspaceTagsWithDigits.length
      ? `  - ${Array.from(new Set(workspaceTagsWithDigits)).sort().join(', ')}`
      : '  - none',
  );

  const workspaceTrimTags = workspaceTags
    .filter((tag) => tag.pos === 'NOUN')
    .map((tag) => String(tag.label))
    .filter((label) => label.endsWith('_trim'));

  lines.push('- Workspace tags ending in `_trim` (likely identity; consider deleting):');
  lines.push(
    workspaceTrimTags.length
      ? `  - ${Array.from(new Set(workspaceTrimTags)).sort().join(', ')}`
      : '  - none',
  );

  lines.push('- Workspace tags that match BRAND values in existing products (identity should be attributes, not tags):');
  lines.push(
    workspaceTagsMatchingBrandValues.length
      ? `  - ${Array.from(new Set(workspaceTagsMatchingBrandValues)).sort().join(', ')}`
      : '  - none',
  );

  lines.push('- Unlinked workspace tags that already exist globally:');
  lines.push(
    unlinkedWorkspaceTagsThatExistGlobally.length
      ? `  - ${unlinkedWorkspaceTagsThatExistGlobally.join(', ')}`
      : '  - none',
  );

  lines.push('- Unlinked workspace attribute types that already exist globally:');
  lines.push(
    unlinkedWorkspaceAttributeTypesThatExistGlobally.length
      ? `  - ${unlinkedWorkspaceAttributeTypesThatExistGlobally.join(', ')}`
      : '  - none',
  );

  lines.push(
    '- Products with policy issues (ID-like tags/keys, identity tags, blended keys, unknown keys):',
  );
  if (!productPolicyFindings.length) {
    lines.push('  - none');
  } else {
    for (const finding of productPolicyFindings) {
      lines.push(
        `  - ${finding.productId}${finding.productName ? ` (${finding.productName})` : ''} → ${finding.path}`,
      );
      for (const issue of finding.issues) {
        lines.push(`    - ${issue}`);
      }
    }
  }

  lines.push('');

  writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');

  console.log(JSON.stringify({ outPath }, null, 2));

  await client.close();
};

main().catch((error) => {
  console.error('Snapshot failed:', error);
  process.exit(1);
});
