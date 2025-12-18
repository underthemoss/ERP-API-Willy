#!/usr/bin/env ts-node

/**
 * SpiceDB -> TypeScript types & maps codegen (single output file)
 *
 * Usage:
 *   npx ts-node generate-spicedb-types.ts <schema-json-file> <out-file>
 *
 * Output file includes:
 * - BaseResourceWithCaching + SubjectRelationsMapType / SubjectPermissionsMapType (imported from BaseResource)
 * - NAMESPACES (single namespace)
 * - RESOURCE_TYPES (NS_TYPE keys, values are `${NAMESPACES.NS}/type`)
 * - For each definition:
 *     <NS>_<DEF>_RELATIONS
 *     <NS>_<DEF>_PERMISSIONS
 *     <NS>_<DEF>_SUBJECT_RELATIONS
 *     <NS>_<DEF>_SUBJECT_RELATIONS_MAP
 *     <NS>_<DEF>_SUBJECT_PERMISSIONS        (USER-* only; empty if no user)
 *     <NS>_<DEF>_SUBJECT_PERMISSIONS_MAP    (USER-* only; empty if no user)
 *     create<PascalNS><PascalDef>Resource(...) factory  <-- only if the resource has relations OR permissions
 *
 * Notes:
 * - Subject-relations are resolved to terminal subject types (follows "#rel") and filtered to SAME namespace.
 * - Factory is emitted only when (relations.length > 0 || permissions.length > 0).
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/* =========================
   Types
   ========================= */

interface SchemaJson {
  definitions: Array<{
    name: string;
    comment: string;
    relations: Array<{
      name: string;
      comment: string;
      parentDefinitionName: string;
      subjectTypes: Array<{
        subjectDefinitionName: string;
        optionalCaveatName: string;
        typeref: {
          oneofKind: string;
          isTerminalSubject: boolean;
        };
      }>;
    }>;
    permissions: Array<{
      name: string;
      comment: string;
      parentDefinitionName: string;
    }>;
  }>;
  caveats: Array<any>;
}

interface Definition {
  fullName: string;
  ns: string;
  name: string;
  relations: Array<{ name: string; subjects: SubjectSpec[] }>;
  permissions: Array<{ name: string }>;
}

interface SubjectSpec {
  raw: string;
  baseType: string;
  ns: string;
  name: string;
  pathRel?: string;
}

interface TerminalType {
  ns: string;
  name: string;
}

interface SubjectRelationEntry {
  key: string;
  relation: string;
  subject: string;
}

type DefIndex = Map<
  string,
  { def: Definition; relations: Map<string, SubjectSpec[]> }
>;

/* =========================
   Main Entry Point
   ========================= */

async function main(): Promise<void> {
  const args = parseCliArgs();
  const schemaJson = await loadSchemaJson(args.inputPath);
  const definitions = parseDefinitions(schemaJson);

  validateSingleNamespace(definitions);

  const namespace = extractNamespace(definitions);
  const output = generateOutput(definitions, namespace, args.outputPath);

  await writeOutput(args.outputPath, output);
  console.log(`✓ Wrote ${path.relative(process.cwd(), args.outputPath)}`);
}

/* =========================
   CLI Argument Parsing
   ========================= */

interface CliArgs {
  inputPath: string;
  outputPath: string;
}

function parseCliArgs(): CliArgs {
  const [, , inputPathArg, outputPathArg] = process.argv;

  if (!inputPathArg || !outputPathArg) {
    console.error(
      'Usage: ts-node generate-spicedb-types.ts <schema-json-file> <out-file>',
    );
    process.exit(1);
  }

  return {
    inputPath: path.resolve(process.cwd(), inputPathArg),
    outputPath: path.resolve(process.cwd(), outputPathArg),
  };
}

/* =========================
   File I/O
   ========================= */

async function loadSchemaJson(inputPath: string): Promise<SchemaJson> {
  const content = await fs.readFile(inputPath, 'utf8');
  return JSON.parse(content);
}

async function writeOutput(outputPath: string, content: string): Promise<void> {
  await fs.writeFile(outputPath, content, 'utf8');
}

/* =========================
   Schema Parsing
   ========================= */

function parseDefinitions(schemaJson: SchemaJson): Definition[] {
  return schemaJson.definitions.map(parseDefinition);
}

function parseDefinition(jsonDef: SchemaJson['definitions'][0]): Definition {
  const [ns, name] = splitNamespaceName(jsonDef.name);

  return {
    fullName: jsonDef.name,
    ns,
    name,
    relations: jsonDef.relations.map(parseRelation),
    permissions: jsonDef.permissions.map(parsePermission),
  };
}

function parseRelation(rel: SchemaJson['definitions'][0]['relations'][0]) {
  return {
    name: rel.name,
    subjects: rel.subjectTypes
      .map((subj) => {
        // Check if this is an indirect relation (has optionalRelationName)
        const pathRel =
          subj.typeref.oneofKind === 'optionalRelationName'
            ? (subj.typeref as any).optionalRelationName
            : undefined;

        // Parse the subject definition name
        const spec = parseSubjectSpec(subj.subjectDefinitionName);

        // If we have a path relation, add it to the spec
        if (spec && pathRel) {
          spec.pathRel = pathRel;
        }

        return spec;
      })
      .filter((s): s is SubjectSpec => s !== null),
  };
}

function parsePermission(perm: SchemaJson['definitions'][0]['permissions'][0]) {
  return { name: perm.name };
}

function parseSubjectSpec(raw: string): SubjectSpec | null {
  const [base, pathRel] = splitAtHash(raw);
  const [ns, name] = splitNamespaceName(base);

  if (!ns || !name) return null;

  return {
    raw,
    baseType: `${ns}/${name}`,
    ns,
    name,
    pathRel,
  };
}

/* =========================
   Validation
   ========================= */

function validateSingleNamespace(definitions: Definition[]): void {
  const namespaces = getUniqueNamespaces(definitions);

  if (namespaces.length !== 1) {
    throw new Error(
      `This generator expects a single namespace, but found: ${namespaces.join(', ')}.\n` +
        `If you need multi-namespace support, we can switch keys to include namespace.`,
    );
  }

  if (definitions.length === 0) {
    throw new Error('No definitions found in schema JSON.');
  }
}

function getUniqueNamespaces(definitions: Definition[]): string[] {
  return [...new Set(definitions.map((d) => d.ns))];
}

function extractNamespace(definitions: Definition[]): string {
  return definitions[0].ns;
}

/* =========================
   Code Generation
   ========================= */

function generateOutput(
  definitions: Definition[],
  namespace: string,
  outputPath: string,
): string {
  const defIndex = buildDefinitionIndex(definitions);
  const typesInNamespace = collectResourceTypes(
    definitions,
    namespace,
    defIndex,
  );

  const sections = [
    generateHeader(),
    generateImports(outputPath),
    '',
    generateNamespaceEnum(namespace),
    generateResourceTypesEnum(namespace, typesInNamespace),
    '',
    ...generateDefinitionBlocks(
      definitions,
      namespace,
      typesInNamespace,
      defIndex,
    ),
  ];

  return sections.join('\n');
}

function generateHeader(): string {
  return `/* eslint-disable */\n// Auto-generated from SpiceDB schema. Do not edit by hand.`;
}

function generateImports(outputPath: string): string {
  const baseResourcePath = path.resolve(__dirname, './BaseResource');
  const relativePath = path.relative(
    path.dirname(outputPath),
    baseResourcePath,
  );

  return `
import { Redis } from 'ioredis';
import { v1 } from '@authzed/authzed-node';
import { BaseResourceWithCaching, SubjectRelationsMapType, SubjectPermissionsMapType } from '${relativePath}';
type AuthzedClient = v1.ZedClientInterface['promises'];`;
}

function generateNamespaceEnum(namespace: string): string {
  const nsConst = toConstCase(namespace);
  return `
export enum NAMESPACES {
  ${nsConst} = '${namespace}',
}`.trim();
}

function generateResourceTypesEnum(
  namespace: string,
  types: Set<string>,
): string {
  const nsConst = toConstCase(namespace);
  const entries = Array.from(types)
    .sort()
    .map(
      (type) =>
        `  ${nsConst}_${toConstCase(type)} = \`\${NAMESPACES.${nsConst}}/${type}\`,`,
    )
    .join('\n');

  return `
export enum RESOURCE_TYPES {
${entries}
}`.trim();
}

function generateDefinitionBlocks(
  definitions: Definition[],
  namespace: string,
  typesInNamespace: Set<string>,
  defIndex: DefIndex,
): string[] {
  const hasUser = typesInNamespace.has('user');
  const sortedDefs = [...definitions].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return sortedDefs.map((def) =>
    generateDefinitionBlock(def, namespace, hasUser, defIndex),
  );
}

function generateDefinitionBlock(
  definition: Definition,
  namespace: string,
  hasUser: boolean,
  defIndex: DefIndex,
): string {
  const nsConst = toConstCase(namespace);
  const defConst = toConstCase(definition.name);

  // Compute subject relation entries first
  const subjectRelEntries = computeSubjectRelationEntries(definition, defIndex);

  // Generate the actual subject relations enum with computed entries
  const subjectRelationsEnum = `
export enum ${nsConst}_${defConst}_SUBJECT_RELATIONS {
${subjectRelEntries.map((e) => `  ${e.key} = '${e.key}',`).join('\n')}
}`.trim();

  const enums = generateEnums(definition, nsConst, defConst, hasUser);
  const maps = generateMaps(definition, nsConst, defConst, hasUser, defIndex);
  const factory = generateFactory(definition, namespace, nsConst, defConst);

  return [
    enums.relations,
    '',
    enums.permissions,
    '',
    subjectRelationsEnum, // Use the actual computed enum
    '',
    maps.subjectRelations,
    '',
    enums.subjectPermissions,
    '',
    maps.subjectPermissions,
    '',
    factory,
    '',
  ].join('\n');
}

interface EnumSet {
  relations: string;
  permissions: string;
  subjectRelations: string;
  subjectPermissions: string;
}

function generateEnums(
  definition: Definition,
  nsConst: string,
  defConst: string,
  hasUser: boolean,
): EnumSet {
  return {
    relations: generateRelationsEnum(definition, nsConst, defConst),
    permissions: generatePermissionsEnum(definition, nsConst, defConst),
    subjectRelations: generateSubjectRelationsEnum(
      definition,
      nsConst,
      defConst,
    ),
    subjectPermissions: generateSubjectPermissionsEnum(
      definition,
      nsConst,
      defConst,
      hasUser,
    ),
  };
}

function generateRelationsEnum(
  definition: Definition,
  nsConst: string,
  defConst: string,
): string {
  const entries = definition.relations
    .map((r) => `  ${toConstCase(r.name)} = '${r.name}',`)
    .join('\n');

  return `
export enum ${nsConst}_${defConst}_RELATIONS {
${entries}
}`.trim();
}

function generatePermissionsEnum(
  definition: Definition,
  nsConst: string,
  defConst: string,
): string {
  const entries = definition.permissions
    .map((p) => `  ${toConstCase(p.name)} = '${p.name}',`)
    .join('\n');

  return `
export enum ${nsConst}_${defConst}_PERMISSIONS {
${entries}
}`.trim();
}

function generateSubjectRelationsEnum(
  definition: Definition,
  nsConst: string,
  defConst: string,
): string {
  // This enum will be properly generated in generateDefinitionBlock
  // after we compute the actual subject relation entries
  return ''; // Placeholder - actual enum generated later
}

function generateSubjectPermissionsEnum(
  definition: Definition,
  nsConst: string,
  defConst: string,
  hasUser: boolean,
): string {
  const enumName = `${nsConst}_${defConst}_SUBJECT_PERMISSIONS`;
  const entries = hasUser
    ? definition.permissions
        .map(
          (p) =>
            `  USER_${toConstCase(p.name)} = 'USER_${toConstCase(p.name)}',`,
        )
        .join('\n')
    : '';

  return `
export enum ${enumName} {
${entries}
}`.trim();
}

interface MapSet {
  subjectRelations: string;
  subjectPermissions: string;
}

function generateMaps(
  definition: Definition,
  nsConst: string,
  defConst: string,
  hasUser: boolean,
  defIndex: DefIndex,
): MapSet {
  const subjectRelEntries = computeSubjectRelationEntries(definition, defIndex);

  return {
    subjectRelations: generateSubjectRelationsMap(
      subjectRelEntries,
      nsConst,
      defConst,
    ),
    subjectPermissions: generateSubjectPermissionsMap(
      definition,
      nsConst,
      defConst,
      hasUser,
    ),
  };
}

function generateSubjectRelationsMap(
  entries: SubjectRelationEntry[],
  nsConst: string,
  defConst: string,
): string {
  if (entries.length === 0) return '';

  const mapName = `${nsConst}_${defConst}_SUBJECT_RELATIONS_MAP`;
  const relationsEnum = `${nsConst}_${defConst}_RELATIONS`;
  const subjectRelationsEnum = `${nsConst}_${defConst}_SUBJECT_RELATIONS`;

  const mapEntries = entries
    .map(
      (e) =>
        `  ${e.key}: { relation: ${relationsEnum}.${toConstCase(e.relation)}, ` +
        `subjectType: RESOURCE_TYPES.${nsConst}_${toConstCase(e.subject)} },`,
    )
    .join('\n');

  return `
export const ${mapName}: SubjectRelationsMapType<
  RESOURCE_TYPES,
  ${relationsEnum},
  ${subjectRelationsEnum}
> = {
${mapEntries}
} as const;`.trim();
}

function generateSubjectPermissionsMap(
  definition: Definition,
  nsConst: string,
  defConst: string,
  hasUser: boolean,
): string {
  if (definition.permissions.length === 0) return '';

  const mapName = `${nsConst}_${defConst}_SUBJECT_PERMISSIONS_MAP`;
  const permissionsEnum = `${nsConst}_${defConst}_PERMISSIONS`;
  const subjectPermissionsEnum = `${nsConst}_${defConst}_SUBJECT_PERMISSIONS`;

  const mapEntries = hasUser
    ? definition.permissions
        .map(
          (p) =>
            `  USER_${toConstCase(p.name)}: { permission: ${permissionsEnum}.${toConstCase(p.name)}, ` +
            `subjectType: RESOURCE_TYPES.${nsConst}_USER },`,
        )
        .join('\n')
    : '';

  return `
export const ${mapName}: SubjectPermissionsMapType<
  RESOURCE_TYPES,
  ${permissionsEnum},
  ${subjectPermissionsEnum}
> = {
${mapEntries}
};`.trim();
}

function generateFactory(
  definition: Definition,
  namespace: string,
  nsConst: string,
  defConst: string,
): string {
  const hasRelationsOrPermissions =
    definition.relations.length > 0 || definition.permissions.length > 0;

  if (!hasRelationsOrPermissions) {
    return `// No factory for ${nsConst}_${defConst} (no relations or permissions).`;
  }

  const factoryName = `create${toPascal(namespace)}${toPascal(definition.name)}Resource`;
  const relationsEnum = `${nsConst}_${defConst}_RELATIONS`;
  const permissionsEnum = `${nsConst}_${defConst}_PERMISSIONS`;
  const subjectRelationsEnum = `${nsConst}_${defConst}_SUBJECT_RELATIONS`;
  const subjectPermissionsEnum = `${nsConst}_${defConst}_SUBJECT_PERMISSIONS`;
  const subjectRelationsMap = `${nsConst}_${defConst}_SUBJECT_RELATIONS_MAP`;
  const subjectPermissionsMap = `${nsConst}_${defConst}_SUBJECT_PERMISSIONS_MAP`;

  return `
export const ${factoryName} = (client: AuthzedClient, redis: Redis) =>
  new BaseResourceWithCaching<
    ${relationsEnum},
    ${permissionsEnum},
    RESOURCE_TYPES,
    ${subjectRelationsEnum},
    ${subjectPermissionsEnum}
  >(
    client,
    redis,
    RESOURCE_TYPES.${nsConst}_${defConst},
    ${subjectRelationsMap},
    ${subjectPermissionsMap},
  );`.trim();
}

/* =========================
   Index Building & Resolution
   ========================= */

function buildDefinitionIndex(definitions: Definition[]): DefIndex {
  return new Map(
    definitions.map((def) => {
      const relationsMap = new Map(
        def.relations.map((r) => [r.name, r.subjects]),
      );
      return [`${def.ns}/${def.name}`, { def, relations: relationsMap }];
    }),
  );
}

function collectResourceTypes(
  definitions: Definition[],
  namespace: string,
  defIndex: DefIndex,
): Set<string> {
  const types = new Set<string>();

  // Add all definition names
  definitions.forEach((d) => types.add(d.name));

  // Add all resolved terminal types from relations
  definitions.forEach((def) => {
    def.relations.forEach((rel) => {
      rel.subjects.forEach((subject) => {
        const terminals = resolveTerminalTypes(subject, defIndex);
        terminals
          .filter((t) => t.ns === namespace)
          .forEach((t) => types.add(t.name));
      });
    });
  });

  return types;
}

function resolveTerminalTypes(
  spec: SubjectSpec,
  defIndex: DefIndex,
  visited: Set<string> = new Set(),
): TerminalType[] {
  const key = `${spec.ns}/${spec.name}#${spec.pathRel ?? ''}`;

  if (visited.has(key)) return [];
  visited.add(key);

  // Base case: no relation path
  if (!spec.pathRel) {
    return [{ ns: spec.ns, name: spec.name }];
  }

  // Follow the relation path
  const ownerKey = `${spec.ns}/${spec.name}`;
  const owner = defIndex.get(ownerKey);

  if (!owner) {
    return [{ ns: spec.ns, name: spec.name }];
  }

  const relSubjects = owner.relations.get(spec.pathRel);
  if (!relSubjects || relSubjects.length === 0) {
    return [{ ns: spec.ns, name: spec.name }];
  }

  // Recursively resolve all subjects
  const terminals = relSubjects.flatMap((sub) =>
    resolveTerminalTypes(sub, defIndex, visited),
  );

  // Deduplicate
  return deduplicateTerminals(terminals);
}

function deduplicateTerminals(terminals: TerminalType[]): TerminalType[] {
  const seen = new Set<string>();
  return terminals.filter((t) => {
    const key = `${t.ns}/${t.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function computeSubjectRelationEntries(
  definition: Definition,
  defIndex: DefIndex,
): SubjectRelationEntry[] {
  const entries: SubjectRelationEntry[] = [];
  const processedKeys = new Set<string>();

  definition.relations.forEach((rel) => {
    // Only process direct subjects (those without a relation path)
    const directSubjects = rel.subjects.filter((subj) => !subj.pathRel);

    directSubjects
      .filter((subj) => subj.ns === definition.ns)
      .forEach((subj) => {
        const key = `${toConstCase(subj.name)}_${toConstCase(rel.name)}`;
        if (!processedKeys.has(key)) {
          processedKeys.add(key);
          entries.push({
            key,
            relation: rel.name,
            subject: subj.name,
          });
        }
      });
  });

  return entries;
}

/* =========================
   String Utilities
   ========================= */

function splitNamespaceName(fullName: string): [string, string] {
  const idx = fullName.indexOf('/');
  return idx < 0
    ? ['', fullName]
    : [fullName.slice(0, idx), fullName.slice(idx + 1)];
}

function splitAtHash(raw: string): [string, string | undefined] {
  const hashIdx = raw.indexOf('#');
  return hashIdx < 0
    ? [raw, undefined]
    : [raw.slice(0, hashIdx), raw.slice(hashIdx + 1)];
}

function toConstCase(str: string): string {
  return str
    .replace(/[/\- ]/g, '_')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

function toPascal(str: string): string {
  return str
    .split(/[/_\- ]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

/* =========================
   Execute Main
   ========================= */

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
