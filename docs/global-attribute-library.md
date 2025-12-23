# Global Attribute Library Model

This document defines the global attribute library that underpins product
catalogs, line-item constraints, resources, and fulfillment matching. It
focuses on what we know, what is still uncertain, and how data should be
stored to support both material and service products.

---

## Purpose

We need a global, curated attribute system so:
- demand (line items) and supply (resources) speak the same language
- matching can evaluate REQUIRED vs PREFERRED constraints deterministically
- products can be created without hardcoding ad-hoc fields

Normalization of physical attributes is required (QUDT or equivalent).

---

## Knowns (Requirements)

- Tags and attributes are global (curated in an admin/global environment).
- Attributes are global-only; no workspace overrides.
- The agent can read the global library and propose new entries.
- Physical attributes must be normalized with a unit system pattern.
- Brand attributes are non-physical metadata (manufacturer, sku, model, family).
- Physical attributes can be contextualized with tags (e.g., bucket weight).
- Material products and service products use the same attribute library, but
  their attribute *content* differs.

---

## Non-Negotiables (Avoid Legacy Drift)

- No per-workspace attribute types.
- No ad-hoc string attributes stored directly on products/resources.
- No duplicated attribute types for context (e.g., "bucket_weight" is not allowed).
- No implicit constraints stored as freeform JSON; use typed predicates.
- No unitless numeric values for physical attributes (unit + canonical required).
- No brand identity stored as tags if a brand attribute exists.
- No attribute versioning via v1/v2; use deprecation + relations.

---

## Unknowns / Decisions to Make

- Unit system: QUDT vs a lighter compatible scheme (still normalized).
- Which dimensions we support initially (LENGTH, MASS, AREA, VOLUME, TIME, etc).
- Value types for non-physical attributes (string/enum/boolean/ref).
- How to represent multi-valued attributes (multiple entries vs arrays).
- Enforcement strategy: warnings first vs strict validation.
- Tag vs attribute guidance for appearance/finish concepts.

---

## Storage Model (Global Types)

### GlobalAttributeType
Defines the attribute *schema*. Global and curated.

Suggested fields:
- `id`
- `name` (e.g., weight, length, manufacturer)
- `kind` (PHYSICAL | BRAND)
- `value_type` (NUMBER | STRING | ENUM | BOOLEAN | REF)
- `dimension` (PHYSICAL only: MASS, LENGTH, AREA, VOLUME, TIME, DENSITY, etc)
- `canonical_unit` (PHYSICAL only)
- `allowed_units[]` (PHYSICAL only)
- `canonical_value_set_id` (if value_type=ENUM)
- `synonyms[]`
- `status` (ACTIVE | PROPOSED | DEPRECATED)
- `audit_status` (PENDING_REVIEW | REVIEWED | FLAGGED)
- `created_by`, `created_at`, `updated_at`
- `source` (human | llm | import)
- `applies_to` (MATERIAL | SERVICE | RESOURCE | BOTH)
- `usage_hints[]` (JOB_PARAMETER | RESOURCE_PROPERTY | BOTH)

Optional:
- `notes`
- `validation_rules` (range limits, precision)

### GlobalTag (Related)
Attributes can be contextualized by tags. Tags are global and curated.

### GlobalAttributeValue
Canonical values for ENUM attributes (e.g., color names, finish types).

Suggested fields:
- `id`
- `attribute_type_id`
- `value` (canonical name, e.g., "red")
- `synonyms[]` (e.g., "crimson", "scarlet")
- `codes` (optional: hex, RAL, Pantone, Lab)
- `status`
- `audit_status` (PENDING_REVIEW | REVIEWED | FLAGGED)
- `created_by`, `created_at`, `updated_at`

### GlobalAttributeRelation
Attribute evolution without versioning.

Suggested fields:
- `from_attribute_id`
- `to_attribute_id`
- `relation_type` (ALIAS | REPLACES | RELATED)
- `confidence`
- `source`

---

## Storage Model (Attribute Values)

### PhysicalAttributeValue
Stored on products, resources, and constraints.

Fields:
- `attribute_type_id`
- `value`
- `unit_code`
- `value_canonical` (normalized to canonical unit)
- `context_tag_ids[]` (optional)
- `source` (measured | estimated | inferred)

### BrandAttributeValue
Stored on material products (and optionally resources).

Fields:
- `attribute_type_id` (kind=BRAND)
- `value`
- `value_ref_id` (optional, when value_type=REF)
- `context_tag_ids[]` (optional, rare)

---

## Subject and Usage Hints (Job vs Resource)

Attributes can apply to different subjects:
- JOB PARAMETERS: properties of the scope (distance, duration, load weight)
- RESOURCE PROPERTIES: properties of the fulfiller (max payload, certification)

Both can use the same global attribute types, but we should guide usage:
- `usage_hints[]` on GlobalAttributeType
- `subject` on service attribute schemas or constraint predicates

This prevents misapplication (e.g., "distance" on a person resource).

---

## Product Usage: Material vs Service

### Material Products
Material products represent tangible goods. They should carry:
- material taxonomy tags
- physical attributes with actual measurements
- brand attributes as identity metadata

Material product content:
- "what it is" (tags)
- "what it measures" (physical attributes)
- "who/what it is from" (brand attributes)

### Service Products
Service products represent work/capacity. They should carry:
- service taxonomy tags
- activity tags
- attribute *schemas* that define required inputs or constraints

Service product content:
- "what kind of work" (tags)
- "what inputs matter" (attribute schema, not fixed values)

Service attributes are not usually measured constants. They are:
- expected inputs (distance, duration, load, crew size)
- default unit codes for pricing
- optional default ranges (if the service has a typical envelope)

### Similarities
- Both reference the same global attribute types.
- Both can be constrained by the same attribute predicates in line items.
- Both can be matched to resources using the same evaluator.

### Differences
- Material products store concrete physical values.
- Service products store *expected attribute schema* and defaults, not fixed values.
- Brand attributes are typically material-only.

---

## Attribute Schema for Services (Optional but Recommended)

Define which attributes are relevant to a service product:

`ServiceAttributeSchema`
- `attribute_type_id`
- `requirement_level` (REQUIRED | OPTIONAL)
- `default_unit_code`
- `default_range` (optional)

This allows the UI/agent to prompt for the right inputs when creating a quote.

---

## Attribute Predicates (Constraints)

Constraints must be executable, not implied. Use a typed predicate schema so
matching can be deterministic.

`AttributePredicate`
- `attribute_type_id`
- `subject` (JOB_PARAMETER | RESOURCE_PROPERTY | BOTH)
- `op` (EQ | IN | BETWEEN | GTE | LTE | NEQ)
- `value` or `values[]`
- `unit_code` (when numeric)
- `context_tag_ids[]` (optional)
- `strength` (REQUIRED | PREFERRED | EXCLUDED)
- `origin` (BUYER | SELLER | SYSTEM)

---

## Multi-Valued Attributes

For set-like attributes (finishes available, certifications held), prefer
multiple AttributeValue entries (one per value) instead of arrays. This keeps
matching and indexing straightforward.

---

## Example: Material Product

Material: "Skid Steer - Generic"
- material tags: `equipment`, `skid_steer`
- physical attributes:
  - weight: 7000 `unit:LB` (context: `equipment`)
  - width: 66 `unit:IN`
- brand attributes:
  - manufacturer: "John Deere" (optional preference, not required)

---

## Example: Service Product

Service: "Heavy Hauling"
- service taxonomy tags: `logistics`, `hauling`
- activity tags: `delivery`
- attribute schema:
  - distance (REQUIRED, unit:MI)
  - load_weight (OPTIONAL, unit:LB)

---

## Tag vs Attribute Guidance (Appearance/Finish)

Use attributes when:
- the value is enumerated and curated (e.g., color list)
- you need deterministic filtering or matching

Use tags when:
- the values are highly descriptive and not curated
- the goal is search or browsing rather than constraint matching

Color can be handled as:
- ENUM attribute with canonical values and optional codes (preferred), or
- tags if the catalog is not curated enough for canonicalization

---

## Normalization & Matching

- All physical values are stored with:
  - original unit and value
  - canonical normalized value
- Constraints operate on canonical values.
- Context tags narrow meaning (e.g., bucket weight vs door weight).
- Predicates are evaluated against the same canonicalized values.

---

## Enforcement Strategy

Pragmatic approach:
- Phase 1-2: warnings + agent suggestions
- New attributes/values auto-activate with `audit_status=PENDING_REVIEW`
- Phase 3+: strict validation for
  - numeric normalization (unit + canonical value required)
  - constraint predicate schema
  - REQUIRED constraint evaluation at allocation time

---

## Open Questions for Implementation

- Do we allow workspace overrides for global attributes?
- Do we need explicit attribute groups for UI ordering?
- What is the minimal set of dimensions for v1?
- Which ENUM value sets should be curated first (color, finish, grade)?
