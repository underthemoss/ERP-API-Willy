# Workspace Vocabulary (Draft Tier)

Goal: preserve **agent speed** without polluting the **canonical Global Vocabulary**.

Canonical contract (how products are composed and persisted for pricing):
- `docs/canonical-vocabulary-product-composition-contract.md`
- Frontend wizard (Prices domain): `docs/prices-agentic-product-wizard-frontend.md`

This adds a workspace-scoped “draft” vocabulary layer for:
- Tags (words / semantic meaning)
- Attribute types (measurable + identity facts)
- Attribute values (ENUM-ish value sets)
- Unit definitions (unit codes + optional conversion)

Draft atoms are immediately usable for composing catalog products and attaching prices, and can later be **promoted** to the global libraries.

---

## Data model

Stored in the main ERP DB (`es-erp`):
- `workspace_tags`
- `workspace_attribute_types`
- `workspace_attribute_values`
- `workspace_units`

Each record carries:
- `workspaceId`
- standard audit fields: `createdAt/createdBy`, `updatedAt/updatedBy`, `source`
- an optional global pointer after promotion:
  - `WorkspaceTag.globalTagId`
  - `WorkspaceAttributeType.globalAttributeTypeId`
  - `WorkspaceAttributeValue.globalAttributeValueId`
  - `WorkspaceUnitDefinition.globalUnitCode`

Uniqueness indexes are created via:
- `src/mongo/migrations/20251228043120-add_workspace_vocabulary_indexes.js`
- `src/mongo/migrations/20251228153832-add_workspace_vocabulary_units_values_indexes.js`

---

## GraphQL API

### Queries
- `listWorkspaceTags(filter, page)`
- `listWorkspaceAttributeTypes(filter, page)`
- `listWorkspaceAttributeValues(filter, page)`
- `listWorkspaceUnitDefinitions(filter, page)`
- `getWorkspaceTagById(id)`
- `getWorkspaceAttributeTypeById(id)`
- `getWorkspaceAttributeValueById(id)`
- `getWorkspaceUnitDefinitionById(id)`

Filters include:
- `workspaceId` (required)
- `searchTerm` (optional)
- `promotedToGlobal` (optional)

### Mutations (fast path)
- `upsertWorkspaceTag(input)`
- `upsertWorkspaceAttributeType(input)`
- `upsertWorkspaceAttributeValue(input)`
- `upsertWorkspaceUnitDefinition(input)`

### Mutations (reuse-first resolution)
- `resolveGlobalOrWorkspaceTag(input)`
- `resolveGlobalOrWorkspaceAttributeType(input)`
- `resolveGlobalOrWorkspaceAttributeValue(input)`
- `resolveGlobalOrWorkspaceUnitDefinition(input)`

These are **idempotent** upserts:
- tags match by `label` or `synonyms`
- attribute types match by `name` or `synonyms`
- attribute values match by `value` or `synonyms` (per `attributeTypeId`)
- unit definitions match by `code`

### Admin mutations (promotion)
- `admin.promoteWorkspaceTagToGlobal(input)`
- `admin.promoteWorkspaceAttributeTypeToGlobal(input)`
- `admin.promoteWorkspaceAttributeTypesToGlobal(input)` (bulk)
- `admin.promoteWorkspaceAttributeValueToGlobal(input)`
- `admin.promoteWorkspaceAttributeValuesToGlobal(input)` (bulk)
- `admin.promoteWorkspaceUnitDefinitionToGlobal(input)`

Promotion behavior:
- If a target global ID is provided, it links the workspace atom to it.
- Otherwise it links to an existing global match (attributes) or creates/returns a global tag (tags), and then stores the resulting global ID on the workspace record.

### GraphQL examples (frontend)

The agent should prefer MCP tools (see below), but the **frontend UI** can call GraphQL directly.

List workspace tags:
```graphql
query ListWorkspaceTags($filter: ListWorkspaceTagsFilter!, $page: PageInfoInput) {
  listWorkspaceTags(filter: $filter, page: $page) {
    items { id workspaceId label displayName pos status auditStatus globalTagId }
    page { number size totalItems totalPages }
  }
}
```

Resolve-or-create a tag (reuse-first):
```graphql
mutation ResolveGlobalOrWorkspaceTag($input: ResolveGlobalOrWorkspaceTagInput!) {
  resolveGlobalOrWorkspaceTag(input: $input) {
    scope
    created
    globalTag { id label pos mergedIntoId }
    workspaceTag { id label pos globalTagId }
  }
}
```

Resolve-or-create an attribute type (reuse-first):
```graphql
mutation ResolveGlobalOrWorkspaceAttributeType(
  $input: ResolveGlobalOrWorkspaceAttributeTypeInput!
) {
  resolveGlobalOrWorkspaceAttributeType(input: $input) {
    scope
    created
    globalAttributeType { id name kind valueType dimension canonicalUnit allowedUnits }
    workspaceAttributeType { id name kind valueType dimension canonicalUnit allowedUnits globalAttributeTypeId }
  }
}
```

Promote a draft atom to global (admin-only):
```graphql
mutation PromoteWorkspaceTagToGlobal($input: PromoteWorkspaceTagToGlobalInput!) {
  admin { promoteWorkspaceTagToGlobal(input: $input) { id label status auditStatus } }
}
```

Promote many draft attribute values to global (admin-only):
```graphql
mutation PromoteWorkspaceAttributeValuesToGlobal(
  $input: PromoteWorkspaceAttributeValuesToGlobalInput!
) {
  admin {
    promoteWorkspaceAttributeValuesToGlobal(input: $input) {
      items {
        workspaceAttributeValueId
        globalAttributeValue { id attributeTypeId value status auditStatus }
      }
    }
  }
}
```

Notes:
- The `admin { ... }` namespace requires `PLATFORM_ADMIN` (and a valid JWT).
- Schema reference: `src/graphql/schema/generated/schema.graphql` (`npm run generate:schema`).

---

## Guardrails (keep draft useful, not chaotic)

Implemented server-side:
- Tag `label` is normalized to canonical snake_case.
- Attribute type names reject underscores (blended names). Use atomic attribute types + context tags.
- PHYSICAL attribute types also reject contextual tokens (e.g., “operating weight”, “tank capacity”) via the same blended-token guardrails as the global library.

## Deterministic resolution policy (contract)

Purpose: make “global vs workspace” behavior predictable for the agent and the UI.

**Rule 1 — Reuse-first always**
- Default to `preferGlobal=true` for all `resolveGlobalOrWorkspace*` calls.
- The resolver returns either:
  - `scope=GLOBAL` with the matched global atom, or
  - `scope=WORKSPACE` with a workspace draft atom (created or updated).

**Rule 2 — Persist canonical strings, not raw source text**
- The product file (Studio catalog JSON) must store the canonical atom values:
  - Tag label → `product.tags[]` / `attributes[].contextTags[]` / `activityTags[]`
  - Attribute type name → `attributes[].key`
  - Unit code → `attributes[].unit`
- Keep raw source text only as evidence (`sourceRefs[]`, `sourceRef`, notes).

**Rule 3 — No automatic promotion**
- Draft atoms are the fast path.
- Promotion to global is an explicit, reviewed action (`admin.promoteWorkspace*ToGlobal`).

**Rule 4 — Tag “roles” are derived, not stored**
- We do not store a tag facet/type. “taxonomy tag” vs “context tag” vs “activity tag” is determined by **where the tag is attached**.
- The UI can still present separate pickers by attachment location (see `docs/global-vocabulary.md` and `docs/material-product-attributes-and-tags.md`).

**UI pattern (recommended)**
- While composing a product draft, collect a summary:
  - “Reused 12 global atoms”
  - “Created 3 workspace draft atoms”
- Show this summary before persistence so users can spot obvious mistakes early.

---

## MCP tools (for agent workflows)

Added tools:
- `list_workspace_tags`
- `upsert_workspace_tag`
- `list_workspace_attribute_types`
- `upsert_workspace_attribute_type`
- `list_workspace_attribute_values`
- `upsert_workspace_attribute_value`
- `list_workspace_unit_definitions`
- `upsert_workspace_unit_definition`
- `resolve_global_or_workspace_tag`
- `resolve_global_or_workspace_attribute_type`
- `resolve_global_or_workspace_attribute_value`
- `resolve_global_or_workspace_unit_definition`

These let the agent “resolve or create” draft atoms during prompt parsing, while deferring global promotion to an explicit curation step.

---

## Material product composition guide

For the “attributes define the product; tags are context + taxonomy” rules and a full example product draft, see:
- `docs/material-product-attributes-and-tags.md`
