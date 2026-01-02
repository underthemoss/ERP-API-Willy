# Global Vocabulary Admin UI (Frontend One Pager)

This doc describes the frontend-facing GraphQL API surface for viewing and
administering the Global Vocabulary libraries:

- Global Tags (`GlobalTag`)
- Global Attribute Types (`GlobalAttributeType`)
- Global Units (`GlobalUnitDefinition`)

The UI should stay “dumb CRUD”: list/search/create/update + a few curation
actions (merge/deprecate). The backend enforces invariants and emits warnings.

---

## Endpoint and Auth

- GraphQL: POST `/graphql`
- Read-only list queries are available at the root query fields (`listGlobalTags`, `listGlobalAttributeTypes`, …).
- Admin namespace: `admin { ... }` (requires `PLATFORM_ADMIN` + valid JWT).

Recommended:
- Use root query fields for simple “view the seeded library” pages.
- Use `admin` namespace for admin-only mutations (merge, curation, etc).

---

## Seed the Library (Local)

Run:
```bash
npm run with:local -- ts-node scripts/reset-global-vocabulary.ts
npm run with:local -- ts-node scripts/seed-global-attributes.ts
npm run with:local -- ts-node scripts/check-global-attribute-seed.ts
```

UI default filters should use `status=ACTIVE` so deprecated legacy/blended
types do not show up by default.

---

## Schema Mismatch Troubleshooting

If you still see legacy fields like `GlobalTag.name` / `GlobalTag.facet` in your
checked-in `schema.graphql`, you’re almost certainly looking at a stale schema
artifact or a backend environment that hasn’t been deployed yet.

Quick verification (backend repo):
- The generated schema lives at `src/graphql/schema/generated/schema.graphql`.
- Run `npm run generate:schema` to regenerate it from the Nexus schema.

Quick verification (any environment):
- Introspect the GraphQL server and confirm `GlobalTag` includes
  `label`, `displayName`, `pos`, and `mergedIntoId`.

---

## Global Tag Library

### What the UI shows

For each tag:
- `label` (canonical snake_case)
- `displayName` (human label, optional)
- `pos` (NOUN/VERB hint)
- `status` / `auditStatus`
- `synonyms[]` (optional)
- `mergedIntoId` (optional; if present, treat as deprecated + resolve to target)

### List / Search (root query)
```graphql
query ListGlobalTags($filter: ListGlobalTagsFilter, $page: PageInfoInput) {
  listGlobalTags(filter: $filter, page: $page) {
    items { id label displayName pos synonyms status auditStatus mergedIntoId }
    page { number size totalItems totalPages }
  }
}
```

Example variables:
```json
{
  "filter": { "status": "ACTIVE", "searchTerm": "tank" },
  "page": { "number": 1, "size": 50 }
}
```

### Admin mutations (merge + CRUD)
```graphql
mutation MergeGlobalTag($input: MergeGlobalTagInput!) {
  admin {
    mergeGlobalTag(input: $input) { id label status auditStatus mergedIntoId }
  }
}
```

```graphql
mutation CreateGlobalTag($input: CreateGlobalTagInput!) {
  admin { createGlobalTag(input: $input) { id label status auditStatus } }
}
```

```graphql
mutation UpdateGlobalTag($id: ID!, $input: UpdateGlobalTagInput!) {
  admin { updateGlobalTag(id: $id, input: $input) { id label status auditStatus } }
}
```

Note:
- The server may set `auditStatus=FLAGGED` and/or add notes for discouraged tags
  (e.g., `capacity`), but does not hard-block them.

---

## Global Attribute Library

### What the UI shows

For each attribute type:
- `name` (canonical)
- `kind` (`PHYSICAL|BRAND`)
- `valueType`
- `dimension`, `canonicalUnit`, `allowedUnits[]` (PHYSICAL)
- `status` / `auditStatus`

### List / Search (root query)
```graphql
query ListGlobalAttributeTypes($filter: ListGlobalAttributeTypesFilter, $page: PageInfoInput) {
  listGlobalAttributeTypes(filter: $filter, page: $page) {
    items { id name kind valueType dimension canonicalUnit allowedUnits status auditStatus }
    page { number size totalItems totalPages }
  }
}
```

### Counts for summary cards

Use `page.totalItems` with filters:
- total types: no filter (or `status=ACTIVE` if that’s the UX)
- physical types: `filter: { kind: PHYSICAL, status: ACTIVE }`
- brand types: `filter: { kind: BRAND, status: ACTIVE }`
- pending review: `filter: { auditStatus: PENDING_REVIEW }`

### Admin CRUD
```graphql
mutation CreateGlobalAttributeType($input: CreateGlobalAttributeTypeInput!) {
  admin { createGlobalAttributeType(input: $input) { id name kind status auditStatus } }
}
```

```graphql
mutation UpdateGlobalAttributeType($id: ID!, $input: UpdateGlobalAttributeTypeInput!) {
  admin { updateGlobalAttributeType(id: $id, input: $input) { id name kind status auditStatus } }
}
```

---

## Units (GlobalUnitDefinition)

List units for admin/reference screens:
```graphql
query ListGlobalUnitDefinitions($filter: ListGlobalUnitsFilter, $page: PageInfoInput) {
  listGlobalUnitDefinitions(filter: $filter, page: $page) {
    items { id code name dimension canonicalUnitCode toCanonicalFactor offset status }
    page { number size totalItems totalPages }
  }
}
```
