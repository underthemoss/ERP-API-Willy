# Global Vocabulary Admin UI (Frontend One Pager)

> ARCHIVED / DEPRECATED
>
> This document describes an older **facet-based tag** admin UI. The current
> implementation does not store a tag facet; tag “roles” are derived by usage.
>
> Use the current docs instead:
> - `docs/global-vocabulary.md`
> - `docs/global-vocabulary-frontend-onepager.md`
> - `docs/workspace-vocabulary.md`

This doc describes the frontend-facing GraphQL API surface for the Global Tag
Library and Global Attribute Library admin UX.

---

## Endpoint and Auth

- GraphQL: POST `/graphql`
- Admin namespace: `admin { ... }`
- Requires `PLATFORM_ADMIN`
- Header: `Authorization: Bearer <JWT>`

---

## Global Tag Library (Taxonomy)

### Facets (one facet per tag; browsing only)
- SERVICE_TAXONOMY
- MATERIAL_TAXONOMY
- ACTIVITY (distinct from SERVICE_TAXONOMY to capture verb context)
- CONTEXT

Capability is derived from taxonomy/activity + attributes. Do not create a
CAPABILITY facet in the UI.

Context is determined by placement: any tag may appear in
`context_tag_ids[]` / `parsed.contextTagIds` regardless of its facet.

### Core UI flows
- List/search tags by facet and status
- Create/update tags (facet immutable after create)
- Create relations (ALIAS/BROADER/NARROWER/RELATED)
- Freeform ingestion (raw string + facet)

### Queries and Mutations (admin)
```graphql
query ListGlobalTags($filter: ListGlobalTagsFilter, $page: PageInfoInput) {
  admin {
    listGlobalTags(filter: $filter, page: $page) {
      items { id name facet status auditStatus }
      page { number size totalItems totalPages }
    }
  }
}
```

```graphql
mutation CreateGlobalTag($input: CreateGlobalTagInput!) {
  admin {
    createGlobalTag(input: $input) {
      id
      name
      facet
      status
      auditStatus
    }
  }
}
```

```graphql
mutation CreateGlobalTagRelation($input: CreateGlobalTagRelationInput!) {
  admin {
    createGlobalTagRelation(input: $input) {
      id
      fromTagId
      toTagId
      relationType
      confidence
    }
  }
}
```

```graphql
mutation IngestGlobalTagString($input: IngestGlobalTagStringInput!) {
  ingestGlobalTagString(input: $input) {
    tag { id name facet status auditStatus }
    parsed
  }
}
```

---

## Global Attribute Library

### Core UI flows
- List/search attribute types, values, units, relations
- Create/update attribute types/values/units
- Create relations
- Freeform ingestion (raw string -> type/value) using deterministic decomposition
  into atomic types + context tags (optionally backed by curated mappings)
- Display `parsed.contextTagIds` when returned by ingestion

### UX Guardrails (Atomicity + Legacy Drift)
- Default list view hides `status=DEPRECATED` attribute types; add a toggle to show them for cleanup/migrations.
- When `status=DEPRECATED`, label the row as "Legacy (blended)" so it’s clear these should not be used for new modeling.
- Keep the frontend generic: do not implement "blend detection" heuristics; instead, display server-side validation errors/warnings and the returned `parsed.contextTagIds`.
- In "Ingest String" results, show `parsed.contextTagIds` prominently (and resolve them to tag names) so users learn the decomposition behavior.
- If the UI shows blended names as `ACTIVE`, the global seed/migration has not been applied; rerun `scripts/seed-global-attributes.ts` against the global library DB.

### Queries and Mutations (admin)
```graphql
query ListGlobalAttributeTypes($filter: ListGlobalAttributeTypesFilter, $page: PageInfoInput) {
  admin {
    listGlobalAttributeTypes(filter: $filter, page: $page) {
      items {
        id
        name
        kind
        valueType
        dimension
        canonicalUnit
        allowedUnits
        status
        auditStatus
      }
      page { number size totalItems totalPages }
    }
  }
}
```

```graphql
mutation CreateGlobalAttributeType($input: CreateGlobalAttributeTypeInput!) {
  admin {
    createGlobalAttributeType(input: $input) {
      id
      name
      kind
      valueType
      dimension
      status
      auditStatus
    }
  }
}
```

```graphql
mutation CreateGlobalAttributeValue($input: CreateGlobalAttributeValueInput!) {
  admin {
    createGlobalAttributeValue(input: $input) {
      id
      attributeTypeId
      value
      status
      auditStatus
    }
  }
}
```

```graphql
mutation IngestGlobalAttributeString($input: IngestGlobalAttributeStringInput!) {
  ingestGlobalAttributeString(input: $input) {
    attributeType { id name kind valueType dimension canonicalUnit }
    attributeValue { id value }
    parsed
  }
}
```

---

## Enums (for filters and forms)

- Tag status: ACTIVE | PROPOSED | DEPRECATED
- Tag audit: PENDING_REVIEW | REVIEWED | FLAGGED
- Tag relation: ALIAS | BROADER | NARROWER | RELATED

- Attribute kind: PHYSICAL | BRAND
- Attribute valueType: NUMBER | STRING | ENUM | BOOLEAN | REF
- Attribute dimension: LENGTH | MASS | AREA | VOLUME | TIME | DENSITY | TEMPERATURE | SPEED | FORCE | ENERGY | POWER | PRESSURE
- Attribute status: ACTIVE | PROPOSED | DEPRECATED
- Attribute audit: PENDING_REVIEW | REVIEWED | FLAGGED
- AppliesTo: MATERIAL | SERVICE | RESOURCE | BOTH
- UsageHints: JOB_PARAMETER | RESOURCE_PROPERTY | BOTH

---

## UI Constraints / Gaps

- No delete endpoints; use `status=DEPRECATED`.
- No explicit merge/approve workflows; use `auditStatus`.
- Tag relation rules (facet-to-facet constraints) are not enforced server-side.
- Product/resource bindings are not implemented yet; this is a library-only UI.
