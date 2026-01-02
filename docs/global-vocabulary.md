# Global Vocabulary (Final Spec)

This document is the engineer-facing specification for the Global Vocabulary
model.

Canonical contract (how products are composed and persisted for pricing):
- `docs/canonical-vocabulary-product-composition-contract.md`
Seed list (global PHYSICAL attributes + units):
- `docs/seeded-physical-attributes-and-units.md`

Note on velocity:
- The Global Vocabulary is the **canonical, shared** library.
- For agentic “capture fast, curate later” workflows, use the workspace-scoped
  draft tier described in `docs/workspace-vocabulary.md` and promote/merge into
  Global only after review.
- Legacy iterations (including facet-based tag models) are kept under
  `docs/archive/` for historical context only. Do not implement new behavior from
  them; see `docs/archive/README.md`.

Core premise:
- **Attributes** are the system of record for measurable and identity facts.
- **Tags** are the system of record for semantic meaning, expressed as words.
- **Taxonomy** is a rendered view computed from tag usage patterns (plus optional
  curated relations). It is not stored as a rigid hierarchy.

## 1) Core Premise

Attributes (and attribute types) are the system of record for measurable and
identity facts.

- Measurable: `weight`, `length`, `power`, `pressure`, `volume`, `speed`,
  `angle`, `torque`, …
- Identity: `manufacturer`, `model`, `sku`, `family`, …

Tags are the system of record for meaning and semantic grouping, expressed as
words.

- Tags are a single global pool.
- Each tag has a lightweight linguistic hint: `NOUN` or `VERB`.
- Tags acquire “taxonomy-ness” or “activity-ness” only by how they are used, not
  by what they are.

Taxonomy is not stored as a rigid hierarchy.

- Taxonomy is a rendered view over tag usage (counts/co-occurrence) plus optional
  curated edges (`ALIAS`, `BROADER`, `NARROWER`, `RELATED`).

## 2) Data Types That Exist

### 2.1 GlobalTag

A single global tag object.

Fields:
- `id`
- `label` (canonical string; normalized form)
- `displayName` (optional; UI-friendly label)
- `pos` (part-of-speech hint): `NOUN | VERB`
- `synonyms[]` (optional)
- `status`: `PROPOSED | ACTIVE | DEPRECATED`
- `auditStatus` (governance): `PENDING_REVIEW | REVIEWED | FLAGGED`
- `mergedIntoId` (optional; set when merged/deprecated)
- provenance: `source`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`
- `notes` (optional)

Key invariant:
- Tags are not measurable concepts. Tags represent “things” or “actions,” not
  quantities.

### 2.2 GlobalAttributeType

Defines an attribute schema; globally curated.

Fields:
- `id`
- `name` (canonical string, e.g., `weight`, `length`, `manufacturer`)
- `kind`: `PHYSICAL | BRAND`
- `value_type`: `NUMBER | STRING | ENUM | BOOLEAN | REF`
- `synonyms[]` (optional)
- `status`: `PROPOSED | ACTIVE | DEPRECATED`
- audit/provenance fields

PHYSICAL-only fields:
- `dimension` (e.g., `MASS`, `LENGTH`, `VOLUME`, `PRESSURE`, `POWER`, `SPEED`,
  `ANGLE`, `TORQUE`, `FLOW_RATE`, `FREQUENCY`, `ACCELERATION`, `VOLTAGE`,
  `CURRENT`, `RESISTANCE`, …)
- `canonical_unit_code`
- `allowed_unit_codes[]`

BRAND-only fields:
- optional `enum_values[]` if `value_type=ENUM`

Key invariants:
- PHYSICAL types must have `dimension`, `canonical_unit_code`,
  `allowed_unit_codes[]`.
- BRAND types must not have units/dimensions.

### 2.3 PhysicalAttributeValue

Stores a concrete measured value on a product definition (and later may be used
on instances, constraints, etc., which are wrappers and out of scope here).

Fields:
- `attribute_type_id` (must reference PHYSICAL `GlobalAttributeType`)
- `value` (number)
- `unit_code`
- `value_canonical` (number, normalized to canonical unit)
- `context_tag_ids[]` (optional): list of `GlobalTag.id`
- `source` (optional): `measured | estimated | inferred`

Key invariants:
- `attribute_type_id.kind` must be `PHYSICAL`.
- `unit_code` must be in `allowed_unit_codes[]`.
- `value_canonical` must be computed deterministically.
- `context_tag_ids[]` may contain any tags (`NOUN` or `VERB`). Context is
  emergent by usage (placement), not by tag type.

### 2.4 BrandAttributeValue

Stores a concrete identity/descriptor value on a product definition.

Fields:
- `attribute_type_id` (must reference BRAND `GlobalAttributeType`)
- `value` (string/enum/ref/boolean depending on `value_type`)
- `context_tag_ids[]` (optional; rare but allowed)
- `source` (optional)

Key invariants:
- `attribute_type_id.kind` must be `BRAND`.
- No units; no canonicalization.

### 2.5 Product Definitions (Vocabulary Bindings)

MaterialProduct (tangible definition)

Conceptual fields:
- `id`, `name`
- `tag_ids[]` (`GlobalTag.id`; usually NOUN-dominant)
- `physical_attributes[]` (`PhysicalAttributeValue[]`)
- `brand_attributes[]` (`BrandAttributeValue[]`)

ServiceProduct (capacity definition)

Conceptual fields:
- `id`, `name`
- `tag_ids[]` (`GlobalTag.id`; mixed, NOUN tags often describe domain)
- `activity_tag_ids[]` (optional; `GlobalTag.id`; UI should prefer VERB tags but
  not required)
- `attribute_schema[]` (`ServiceAttributeSchemaEntry[]`)

ServiceAttributeSchemaEntry

Defines which measurable attributes are relevant inputs/constraints for the
service.

Fields:
- `attribute_type_id` (PHYSICAL, or BRAND only if intentionally allowed; typical
  is PHYSICAL)
- `requirement_level`: `REQUIRED | OPTIONAL`
- `default_unit_code`
- `default_range` (optional; min/max in canonical units)
- `context_tag_ids[]` (optional; same mechanism as `PhysicalAttributeValue`)

Key invariant:
- A service schema entry does not store a “measured fact,” it stores “what
  parameters matter.”

### 2.6 GlobalTagRelation (optional curated edges)

Curated relations are optional governance primitives used to merge/alias tags
and optionally project a navigable “taxonomy” view.

Fields:
- `id`
- `from_tag_id`
- `to_tag_id`
- `relation_type`: `ALIAS | BROADER | NARROWER | RELATED`
- `confidence?`
- audit/provenance fields

Key invariants:
- Relations are advisory; taxonomy is still a rendered view (relations may
  influence rendering).
- `mergedIntoId` is the operational source of truth for canonicalization (hard
  merge). If a tag has `mergedIntoId`, clients should treat it as deprecated and
  resolve to the merged target.
- `ALIAS` relations are optional, and should be treated as pre-merge signals
  (candidate equivalence) rather than canonicalization.

### 2.7 GlobalUnitDefinition (unit normalization registry)

Physical canonicalization requires a shared unit registry.

Fields (example):
- `code` (e.g., `KG`, `LB`, `M`, `IN`, `PA`, `BAR`)
- `dimension`
- `canonical_unit_code`
- `to_canonical_factor`
- `offset` (optional)
- governance fields (`status`, `audit_status`, provenance)

Implementation note:
- Choose a single source of truth for conversion factors. If units are stored in
  DB, treat edits to conversion factors as a governed change (avoid “silent”
  conversion behavior changes via casual admin edits).

## 3) How NOUN/VERB Tags Are Used (Exhaustive)

### 3.1 Tags on Products (`tag_ids[]`)

Purpose: “what this thing/work is” for discovery, substitution, clustering.

Typical:
- MaterialProduct: mostly NOUN tags (e.g., `skid_steer`, `loader`, `bucket`)
- ServiceProduct: NOUN tags describe domain (e.g., `earthwork`, `driveway`,
  `concrete_work`); VERB tags may appear but UI can suggest them elsewhere

Guardrail: tags should not be measurable concepts (`weight` should not be a
tag).

### 3.2 Tags in Attribute Context (`context_tag_ids[]`)

Context tags qualify an attribute value or parameter. This is where “context
emerges.”

Examples:
- `volume=96.5 L` with context `[fuel, tank]`
- `length=4010 mm` with context `[with_bucket]`
- `mass=4508 kg` with context `[operating]`

Important property:
- Any tag can be used as context, `NOUN` or `VERB`.
- Context is not a tag type; it is a usage location.

This prevents blended attribute types:
- You never create `tank_capacity`; you store `volume` + context `[tank]`.

Important clarification about `capacity`:
- Avoid using `capacity` as a durable semantic tag. It is a linguistic helper
  that usually implies a measurable dimension (volume/mass/energy/count) and a
  “what” (tank/payload/battery/etc.).
- Preferred modeling: choose the measurable `GlobalAttributeType`
  (`volume`/`weight`/`energy`/…) and use tags that identify the “what” in
  `context_tag_ids[]` (e.g., `[fuel, tank]`, `[payload, rated]`, `[battery]`).
- If source text contains “capacity”, treat it as a decomposition trigger (parsing
  glue), not an atom you need to preserve.

### 3.3 Tags as “Activity” on Services (`activity_tag_ids[]`)

Activity tags are simply tags that the UI/agent treats as action descriptors.

Recommended:
- prefer `VERB` tags (e.g., `install`, `excavate`, `pour`, `grade`)

Allowed:
- any tags (the system does not forbid)

Interpretation:
- service search (“show me services that include install”)
- default task decomposition templates (“install → steps …”)

## 4) Hard Guardrails (Must Be Enforced)

### Guardrail A — Measurable concepts must be attributes, not tags

When creating a `GlobalTag`, reject or auto-redirect if `label` matches:
- measurable concept list (`weight`, `length`, `pressure`, `power`, `volume`, …)
- unit-like terms (`kg`, `lb`, `in`, `ft`, `m`, `psi`, …)

### Guardrail B — Attribute types must be atomic (no blended names)

Reject any PHYSICAL `GlobalAttributeType` whose `name` includes
qualifiers/components such as:
- qualifiers: `overall`, `operating`, `rated`, `max`, `min`, `gross`, `net`,
  `peak`, `shipping`
- component nouns: `tank`, `bucket`, `cab`, `battery`, `pump`
- role nouns: `payload`, `breakout`, `tipping`

Those terms must become context tags used on values.

### Guardrail C — Physical attribute values must be unit-valid and canonicalized

Enforce:
- `unit_code` ∈ `allowed_unit_codes[]`
- deterministic computation of `value_canonical`

### Guardrail D — NOUN/VERB is a hint, not a constraint

Do not block use of a NOUN as an “activity” tag or a VERB as a classifier.
Instead:
- warnings / lint suggestions
- UI defaults
- agent guidance

## 5) How Taxonomy Is Rendered (Not Stored)

Taxonomy is a computed structure built from tag usage data and optional curated
relations.

### 5.1 Usage graph inputs

Record usage events (explicitly or derivable from documents):
- tags attached to products/services: `Product.tag_ids[]`
- tags used in contexts: `PhysicalAttributeValue.context_tag_ids[]`,
  `ServiceAttributeSchemaEntry.context_tag_ids[]`
- tags used as service activities: `ServiceProduct.activity_tag_ids[]`

From these, compute:
- frequency counts per tag (overall and by role)
- co-occurrence edges between tags (same product, same service, same context group)
- tag-to-attribute association edges (tag frequently qualifies a specific attribute type)

### 5.2 Rendering outputs (views)

From the graph you can render:
- clustered taxonomy (pragmatic MVP)
  - show top tags by frequency as entry points
  - show related tags by association strength
- emergent hierarchy (optional projection)
  - infer `BROADER/NARROWER` using heuristics (conditional probabilities), or
    propose edges via LLM and curate
  - keep as a DAG; project to a tree for UI if needed

Facet-like views (derived):
- “noun-like” vs “verb-like” using `pos`
- “commonly used as activity” vs “commonly used as qualifier” using role frequency

### 5.3 Curation layer (recommended but minimal)

You still need global admin functions to:
- merge tags / alias synonyms (`skid steer` vs `skid_steer`)
- deprecate noisy tags
- approve PROPOSED tags created by agents/imports

This is governance, not ontology.

## 6) Why This Model Prevents Inappropriate Usage Without Becoming Complex

Only two global vocabularies exist:
- `GlobalTag` (NOUN/VERB hint)
- `GlobalAttributeType` (PHYSICAL/BRAND)

Only two value carriers exist:
- `PhysicalAttributeValue` (numbers + units + canonical + context tags)
- `BrandAttributeValue` (identity values)

“Taxonomy,” “activity,” and “context” are not additional types:
- taxonomy is a view rendered from tag usage patterns
- activity is a usage pattern (tags commonly attached to services as actions)
- context is a usage location (tags used to qualify attribute values)

This yields LEGO behavior:
- pieces always connect
- guardrails are few and deterministic

## 7) Concrete Mental Model for Engineers

- If it has units → it is a PHYSICAL attribute type/value.
- If it identifies a thing (`manufacturer`, `model`) → it is a BRAND attribute.
- If it’s a word describing a thing/action/qualifier → it is a tag.
- If a word qualifies a measurement → it goes in `context_tag_ids[]`.
- “Taxonomy” is the UI/graph you render from repeated tag usage.
