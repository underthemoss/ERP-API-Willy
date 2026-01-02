# Canonical Vocabulary & Product Composition Contract (Normative)

This document is the **single source of truth** for how we:
- Represent products in Studio using global vocabulary “atoms”
- Resolve/create those atoms (global reuse-first, workspace draft fallback)
- Persist composed products so they can be referenced by Pricing and Quoting

Audience: Backend, Frontend, and the Studio Agent (product wizard).

Implementation references:
- Studio catalog product schema: `docs/studio-catalog-product.schema.json`
- Studio catalog create mutation: `src/graphql/schema/studio-fs.ts`
- Workspace draft vocabulary: `docs/workspace-vocabulary.md`
- Global vocabulary spec: `docs/global-vocabulary.md`
- Prices wizard frontend checklist: `docs/prices-agentic-product-wizard-frontend.md`

---

## 1) Core objects and invariants

### 1.1 Global vocabulary atoms (canonical, shared)

#### `GlobalTag`

Purpose: reusable semantic labels used across products and workflows.

Canonical fields:
- `label` (stable key; `snake_case`)
- `displayName` (UI)
- optional `pos` hint (`NOUN|VERB`)

Invariant:
- Tags are **one thing**. “taxonomy/activity/context” are **roles derived by usage location**, not separate stored tag types/facets.

#### `GlobalAttributeType`

Purpose: defines a reusable attribute “slot” (key) with typing and (if physical) unit semantics.

Canonical fields:
- `name` (stable key; **no underscores**)
- `kind`: `PHYSICAL | BRAND`
- `valueType`: `NUMBER | STRING | ENUM | BOOLEAN | REF`
- `dimension`, `canonicalUnit`, `allowedUnits[]` (PHYSICAL only)

Invariant:
- Attribute types are global and reusable; products reference attribute type **names** (keys), not ad-hoc schemas.

#### `GlobalUnitDefinition`

Purpose: canonical unit codes (e.g., `MM`, `KG`, `IN`, `LB`, `MI`, `HR`) with conversion metadata.

Invariant:
- All physical measurements must store **canonical** unit codes (or use a workspace draft unit with explicit review).

### 1.2 Workspace draft overlay (capture velocity)

A workspace may create draft tags/attribute types/units when global resolution fails, to avoid blocking product creation. Draft items can later be promoted/curated into the global library.

Invariant:
- Always **reuse global atoms when possible**; only create workspace drafts when resolution fails (or when the user explicitly chooses to draft).

---

## 2) Product kinds and composition schema

### 2.1 Product kinds (catalog-first)

All user-created products are **catalog products** with stable identity:

`catalogRef = { kind, id }`

Business-facing kinds (used by Pricing/Quoting):
- `MATERIAL_PRODUCT`
- `SERVICE_PRODUCT`
- `ASSEMBLY_PRODUCT`

Studio catalog file kinds (used in `/catalogs/<slug>/products/<id>.jsonc`):
- `material`
- `service`
- `assembly`

Mapping (deterministic):
- `material` ↔ `MATERIAL_PRODUCT`
- `service` ↔ `SERVICE_PRODUCT`
- `assembly` ↔ `ASSEMBLY_PRODUCT`

### 2.2 Catalog wrapper (workspace default)

Products live inside a **catalog** (a collection of products).

Invariant:
- Every workspace has a **default catalog** for products used in Pricing/Quoting.
- If a catalog path is not specified, the backend creates/uses `/catalogs/default` automatically (StudioFS).

### 2.3 Composition model (Studio catalog product schema)

A product is composed from:
- Tags (semantic descriptors)
- Attributes (typed fields with values; physical values include units)
- Activity tags (service products; tags attached in the activity role)
- Evidence metadata (sources; required for agent-derived facts)

Tag roles are defined by **where they are attached**:
- `product.tags[]` → taxonomy role (noun-ish descriptors; small durable set)
- `product.activityTags[]` → activity role (verb-ish descriptors for services)
- `attributes[].contextTags[]` → context role (qualifiers for an attribute value)

Persistence invariant (Studio):
- Product files persist **canonical strings** (tag labels, attribute type names, unit codes), not DB IDs.

---

## 3) Canonical mapping rules (deterministic)

### 3.1 BRAND vs PHYSICAL attributes

#### BRAND attributes (identity; no units)

BRAND attributes identify/classify an item:
- manufacturer, model, year, trim, sku, mpn, series, …

Rules:
- BRAND attributes **must not** store physical units.
- BRAND identity values **must not** be encoded as tags.

#### PHYSICAL attributes (measurable; units required when numeric)

PHYSICAL attributes describe measurable properties:
- length, weight, volume, power, pressure, voltage, …

Rules:
- Numeric PHYSICAL values **must** include a canonical `unit`.
- Do not create blended keys like `curb_weight` or `bed_length`.
  - Use atomic keys + `contextTags[]` (see below).

### 3.2 Tags: `pos` is a hint, not a type

`pos=NOUN|VERB` is a UI/agent hint. Tags do **not** change meaning or validity based on `pos`.

The same tag can appear in multiple roles depending on placement (e.g., a verb-like tag can appear in `activityTags[]`).

### 3.3 Context tags for measurements (no blended attribute keys)

If a physical attribute needs qualification (“bed length” vs “overall length”):
- Use `attributes[].contextTags[]` rather than creating a new attribute key.

Example:
- `length` with context `[overall]`
- `length` with context `[truck_bed]`

---

## 4) Resolution/creation protocol (required for FE + Agent)

### 4.1 Always “resolve-first” (reuse-first)

When composing a product, the FE/Agent MUST:
1) Resolve tags/attribute types/units against the global library
2) If not found, create a workspace draft atom
3) Continue composition using the **canonical** strings returned by resolution
4) Persist the product (catalog) referencing those canonical atom strings

### 4.2 Forbidden behaviors

The FE/Agent MUST NOT:
- Encode identity as tags (e.g., do not tag `ford`, `f150`, `2024`, `xlt`)
- Encode measurements or units as tags (e.g., do not tag `length`, `lb`, `psi`, `hp`)
- Create blended attribute keys (e.g., `bed_length`, `curb_weight`, `flow_rate`)
- Treat “taxonomy/activity/context” as separate persisted tag types

The FE/Agent SHOULD:
- Avoid creating near-duplicate tags/attributes without explicit user confirmation
  (e.g., `pickup` vs `pickup_truck`).

Unit guardrail (recommended):
- Do not invent unit codes. Use an existing global unit code, or create a **workspace unit** only with explicit user confirmation (conversion factors must be correct).

### 4.3 Promotion (explicit, reviewed)

Draft atoms can be promoted to global later, but promotion is explicit and reviewed:
- `admin.promoteWorkspace*ToGlobal(...)`

There is no automatic promotion in agentic product creation.

---

## 5) Pricing domain contract (how Pricing attaches to products)

Prices MUST reference catalog products (not PIM categories) for new records:
- `catalogRef: { kind, id }` is the product identity for pricing and quoting.

Price type determines pricing behavior:
- `RENTAL`: day/week/month tables (or rental spec)
- `SALE`: unit cost + optional discounts
- `SERVICE`: requires typed `pricingSpec` (`UNIT|TIME`) including `unitCode` and `rateInCents`

Invariant:
- New product pricing does not require PIM category selection.
- Legacy PIM-linked prices may exist during migration and should be treated as legacy in the UI.

---

## 6) Example compositions (normative)

### 6.1 MATERIAL: “Ford F‑150 Truck” (structure-focused)

Brand attributes (identity):
- `manufacturer = "Ford"`
- `model = "F-150"`

Product tags (taxonomy role; keep small):
- `vehicle`
- `pickup_truck`

Physical attributes (atomic keys + context tags):
- `length = 5885 MM` with context `[overall]`
- `length = 1676 MM` with context `[truck_bed]`
- `weight = 2100 KG` with context `[curb]`

### 6.2 SERVICE: “Landscaping – Hourly”

Product tags:
- `services`
- `landscaping`

Activity tags (activity role):
- `mow`
- `trim`
- `edge`

Optional quote inputs (if modeled as attributes/inputs):
- `distance` + unit (`MI`) with context `[travel]`
- `count` (crew size) with context `[crew]` (or a dedicated BRAND/ENUM if you later formalize it)

Pricing:
- `priceType = SERVICE`
- `pricingSpec = TIME { unitCode: "HR", rateInCents: 6500 }`

---

## 7) Agent system prompt insertion (operational constraints)

When acting as the Studio Agent (product wizard), the agent MUST:
1) Determine `product.kind` (material vs service) before composing
2) Decompose source data into:
   - taxonomy tags (product.tags[])
   - activity tags (service only; product.activityTags[])
   - brand attributes (identity; no units)
   - physical attributes (atomic key + numeric value + canonical unit + context tags)
3) Resolve-first:
   - reuse global atoms when possible
   - create workspace draft atoms only when missing (and require explicit user confirmation for new unit definitions)
4) Output a draft product JSON that conforms to `docs/studio-catalog-product.schema.json`
5) Ask for user confirmation before calling `studioCatalogCreateProduct`
6) Return `catalogRef { kind, id }` to the caller so pricing can attach prices
