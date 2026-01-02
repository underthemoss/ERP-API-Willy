# Global Tag Library (Taxonomy, Activity, Qualifiers)

> ARCHIVED / DEPRECATED
>
> This document describes an older **facet-based tag** model (SERVICE_TAXONOMY / MATERIAL_TAXONOMY / ACTIVITY / CONTEXT).
> The current canonical model is:
> - `docs/global-vocabulary.md` (tags are one thing; roles are derived by usage/placement)
> - `docs/workspace-vocabulary.md` (workspace draft overlay + promotion)
>
> Keep this file for historical context only; do not implement new behavior from it.

This doc defines the global tag system for material and service taxonomy,
aligned with the thesis and the global attribute library.

---

## Purpose

Global tags establish the shared vocabulary for:
- product categorization (material and service taxonomy)
- service activity classification
- attribute value disambiguation (context by placement)

Tags are global and curated (no per-workspace tags).

---

## Guiding Principles (from the thesis)

- Tags define substitutable classes (what can satisfy a claim).
- Attributes define measurable fitness (how well it fits).
- Identity belongs in brand attributes, not tags.
- Tag creation is flat; structure emerges via relations.
- Curation is centralized and global.
- Products only bind global tags; they do not invent category semantics.

---

## Tag Facets

Each tag has a single facet for browsing and curation (one facet per tag).
Facet does not constrain usage: any `GlobalTag.id` may appear in
`context_tag_ids[]` on an attribute value.

- SERVICE_TAXONOMY: service category (e.g., logistics, demolition)
- MATERIAL_TAXONOMY: material category (e.g., aggregate, fastener)
- ACTIVITY: service verbs/actions (e.g., delivery, installation); part of the
  service tag domain but distinct to preserve verb context and enable
  activity-only service products
- CONTEXT: qualifier/component tags commonly used to disambiguate attribute
  values (e.g., bucket, door_panel). This is a convenience grouping, not a
  restriction.

Facet usage (typical):
- SERVICE_TAXONOMY: ServiceProduct, service line-item constraints
- MATERIAL_TAXONOMY: MaterialProduct, material line-item constraints
- ACTIVITY: ServiceProduct, service line-item constraints
- CONTEXT: commonly used in PhysicalAttributeValue.context_tag_ids[] (but any
  tag can be used as context by placement)

Capability is derived from taxonomy relations and/or attribute requirements
rather than a dedicated tag facet.

Resource map tags (LOCATION/BUSINESS_UNIT/ROLE) are separate and unrelated to
this global tag library.

### Qualifier/Context Guidance

CONTEXT-facet tags are typically qualifiers and component/role nouns. Examples:
- qualifiers: overall, operating, gross, net, max, min, rated, capacity
- component/role: payload, tank, battery, bucket, door_panel, lift, breakout

These tags are used to disambiguate attribute values via
`PhysicalAttributeValue.context_tag_ids[]` (e.g., `weight` + `[payload]`).
Nothing prevents a tag from being used in both taxonomy and context; context is
determined only by placement.

---

## Data Model (Global)

### GlobalTag
Suggested fields:
- id
- name
- facet (SERVICE_TAXONOMY | MATERIAL_TAXONOMY | ACTIVITY | CONTEXT; browsing only)
- synonyms[]
- status (ACTIVE | PROPOSED | DEPRECATED)
- audit_status (PENDING_REVIEW | REVIEWED | FLAGGED)
- created_by, created_at, updated_at
- source (human | llm | import)
- notes (optional)

### GlobalTagRelation
Suggested fields:
- from_tag_id
- to_tag_id
- relation_type (ALIAS | BROADER | NARROWER | RELATED)
- confidence
- source
- created_by, created_at, updated_at

Relation constraints:
- BROADER/NARROWER only within the same taxonomy facet.
- ALIAS should stay within the same facet.
- RELATED can cross facets, but should be used sparingly.

Storage:
- global_tags (collection)
- global_tag_relations (collection)
Both live in the global library DB (GLOBAL_LIBRARY_DB_NAME).

---

## Usage Mapping

### Service Products
- service_taxonomy_tag_ids[] (SERVICE_TAXONOMY)
- activity_tag_ids[] (ACTIVITY)
- attributes are schema/inputs, not fixed values

### Material Products
- material_taxonomy_tag_ids[] (MATERIAL_TAXONOMY)
- physical attributes use context_tag_ids[] (any tag, optional)
- brand attributes for identity metadata (not tags)

### Resources
- service/material taxonomy tags if resource is catalog-aligned

### Line Item Constraints
Tag predicates can target:
- SERVICE_TAXONOMY / ACTIVITY for service demand
- MATERIAL_TAXONOMY for material demand
Capability requirements should be expressed via taxonomy/activity tags and
attribute predicates.

---

## Examples

Service: "Rock Delivery"
- service taxonomy tags: logistics, materials
- activity tags: delivery, hauling

Material: "White Oak Door Panel"
- material taxonomy tags: wood, white_oak, panel
- physical attributes:
  - width 24 IN (context: door_panel)
  - height 30 IN (context: door_panel)
  - thickness 0.75 IN (context: door_panel)
- brand attributes: manufacturer, sku

---

## Curation and Ingestion

- Tags are global and curated; new tags default to PROPOSED + PENDING_REVIEW.
- Synonym matching should prevent duplicates.
- LLM-assisted suggestions are allowed but require human confirmation.

---

## Implementation Plan (High Level)

1) Schema and storage
- Add GlobalTag + GlobalTagRelation models in the global library DB.
- Indices on (facet, name) and synonyms for search.

2) GraphQL API
- List/search tags (filter by facet, status, searchTerm).
- Admin create/update tags and relations.

3) Ingestion
- Freeform string to tag suggestions.
- Auto-create with PROPOSED + PENDING_REVIEW.

4) Product bindings
- ServiceProduct: service_taxonomy_tag_ids + activity_tag_ids
- MaterialProduct: material_taxonomy_tag_ids
- PhysicalAttributeValue: context_tag_ids

5) Admin UI and curation workflows
- List/search/create/update tags
- Merge/alias/deprecate flows

---

## Open Questions

- What is the explicit derivation mechanism for capability from taxonomy
  (relation rules vs curated mappings)?
- How should we validate that ACTIVITY tags remain verb-context and do not
  duplicate SERVICE_TAXONOMY tags?
