# Material Products: Attributes First, Tags as Context + Taxonomy

Goal: enable “Create a `<product>`” chat flows (e.g., “create a f150 product”) that produce **high‑integrity, extensible** material products.

**Non‑negotiable thesis**
- **Attributes define the product** (identity + measurable facts).
- **Tags are not a string bucket**. Tags are used only for:
  1) **Taxonomy/discovery** on the product (`product.tags[]`), and
  2) **Context qualifiers on attributes** (`attributes[].contextTags[]`).

**Tag roles are derived (no stored “tag facet”)**
- There is a single global tag concept (`GlobalTag`) with `label`, optional `displayName`, and a `pos` hint (`NOUN|VERB`).
- “taxonomy tag” vs “context tag” vs “activity tag” is determined by **where the tag is attached**, not by a stored tag type/facet.

If the agent writes identity or measurements into tags (e.g., `ford`, `f150`, `lbs`, `overall_length`), the system degenerates into an unmergeable mess of strings. This document describes how to avoid that.

Related docs:
- Global thesis/spec: `docs/global-vocabulary.md`
- Seeded PHYSICAL types + units: `docs/seeded-physical-attributes-and-units.md`
- Draft vocabulary tier + promotion: `docs/workspace-vocabulary.md`
- Canonical contract (normative): `docs/canonical-vocabulary-product-composition-contract.md`
- Studio catalog product schema: `docs/studio-catalog-product.schema.json`

---

## 1) Vocabulary layers (speed + integrity)

We maintain **two layers** of vocabulary:

### A) Canonical Global Vocabulary (slow/curated)
- Global tags (canonical label + synonyms)
- Global attribute types (PHYSICAL + BRAND/identity)
- Global unit definitions (canonicalization + conversion)

### B) Workspace Draft Vocabulary (fast/agentic capture)
- Workspace tags (draft)
- Workspace attribute types (draft)
- Workspace attribute values (draft)
- Workspace unit definitions (draft)

**Rule:** the agent can create new atoms in the **workspace tier** immediately, but “promote to global” is explicit and reviewed.

---

## 2) How a Studio Catalog material product encodes the thesis

Material products are persisted as Studio catalog product JSON (`/catalogs/<slug>/products/<id>.jsonc`) via:
- GraphQL: `studioCatalogCreateProduct`
- MCP tool (agent): `studio_catalog_create_product`

The relevant fields are:

### Product taxonomy tags
- `product.tags[]: string[]`
- Use a **small, durable** set of noun-ish tags for search/discovery.
- Examples: `vehicle`, `pickup_truck`, `forklift`, `skid_steer`, `generator`.
- **Never** put identity or measurements here.
- Prefer canonical `snake_case` labels (aligns with global/workspace tag labels).

### Attributes (the system of record)
- `product.attributes[]: { key, value, unit?, contextTags?, sourceRef? }`
- `attributes[].key` is the **attribute type name** (atomic, no underscores).
- `attributes[].value` is the **fact** (string | number | boolean).
- `attributes[].unit` is required for **numeric physical** values.
- `attributes[].contextTags[]` are **qualifiers** on the fact (e.g., `overall`, `truck_bed`, `payload`, `max`).

Important schema constraints enforced server-side:
- Attribute `key` must be **atomic** (no underscores; no “blended” keys like `truck_bed_length`).
- Tags are linted: **measurable/unit-like** tags are rejected as tags.

---

## 3) Agent workflow (Material Product Wizard)

### Step 0 — Clarify what “product” means
For “create a f150 product”, the agent must ask:
- Is this a **generic model** (“Ford F‑150”) or a **specific configuration** (year/trim/engine)?
- What is the minimum identity scope required for pricing (year/trim often matters)?

### Step 1 — Find a source (Brave Search)
The agent should always attach at least one source:
- Use the MCP tool `brave_search` (requires `BRAVE_SEARCH_API_KEY`; see `.env.example`).
- Prefer authoritative sources (manufacturer spec pages, official brochures, reputable spec tables).

Store sources in the product:
- `product.sourceRefs[]` includes URLs used for extraction.
- `attributes[].sourceRef` optionally points to the URL + a short locator (section/table name).

If `BRAVE_SEARCH_API_KEY` is not configured, the tool will error; the agent should ask the user to configure it (or provide a source URL manually).

### Step 2 — Extract candidate facts
From the source, extract:
- **Identity facts** (BRAND attributes): manufacturer, model, year, trim, etc.
- **Physical facts** (PHYSICAL attributes): length/width/height/weight/power/etc.

Always keep the raw evidence around in your draft (even if you don’t persist it):
- `rawText` snippet
- `url`
- `attributeCandidate` → `evidence`

### Step 2.1 — Classify each candidate (attribute vs tag)
Use this rubric (deterministic; ask if unclear):
- **BRAND attribute**: identity keys/values (manufacturer, model, year, trim, sku, mpn, …). Values are strings/numbers; **no units**.
- **PHYSICAL attribute**: numeric measurements (length/weight/power/pressure/…). Must carry a **unit** when numeric.
- **Context tag**: qualifiers that disambiguate an attribute value (overall, curb, towing, max, min, rated, engine, …). Stored in `attributes[].contextTags[]`.
  - If a context word is ambiguous on its own, prefer a specific label (e.g., `truck_bed` instead of `bed`).
- **Taxonomy tag**: durable discovery/substitution categories for the product (vehicle, pickup_truck, …). Stored in `product.tags[]` and should stay small.

### Step 3 — Decompose facts into atomic attributes + context tags
Do not invent blended attribute keys.

Examples of correct decomposition:
- “Overall length” → `key: "length"` + `contextTags: ["overall"]`
- “Bed length” → `key: "length"` + `contextTags: ["truck_bed"]`
- “Payload capacity” → `key: "weight"` + `contextTags: ["payload", "max"]`
- “Ground clearance” → `key: "clearance"` + `contextTags: ["ground"]`

Prefer reusing seeded/global qualifier tags when possible:
- `overall`, `operating`, `shipping`, `gross`, `net`, `rated`, `max`, `min`, `payload`, `tank`, `battery`, …

Ranges and variants:
- If a source gives a **range** (e.g., curb weight “4,021–5,123 lb”), represent it as **two attributes** with context tags (e.g., `["curb","min"]` and `["curb","max"]`) or ask the user which configuration to model.
- If a source lists multiple variants (multiple bed lengths, engines, cab styles), do not cram them into one product. Prefer **separate products** (separate IDs) unless the user explicitly wants a generic “family” product.
- Avoid string ranges like `"4021-5123"` in `value`.

Examples of forbidden modeling:
- `key: "overall_length"` (blended key)
- tags like `overall_length`, `lbs`, `ford`, `f150`

### Step 4 — Resolve-or-create atoms (reuse-first)
For each atom candidate, call the reuse-first resolvers:
- `resolve_global_or_workspace_attribute_type` (for `manufacturer`, `model`, `year`, `trim`, `length`, `weight`, …)
- `resolve_global_or_workspace_unit_definition` (for unit codes/aliases like `lb`, `in`, `hp`)
- `resolve_global_or_workspace_tag` (only for taxonomy tags + attribute context tags)
- `resolve_global_or_workspace_attribute_value` (optional: for ENUM-ish values you want to canonicalize)

Guidelines:
- Prefer global atoms when they exist (`preferGlobal=true` default).
- Create workspace atoms only when needed (fast path).
- Treat creating new **attribute types** as a higher bar than creating tags:
  - if a new physical measurement appears, it is almost always representable with an existing atomic type + context tags.
  - if a new identity attribute appears, prefer the canonical set (manufacturer, model, year, trim, sku, mpn, …).

Persist rule (important):
- Store the **canonical** strings returned by resolution into the product JSON:
  - tag label → `product.tags[]` / `attributes[].contextTags[]`
  - attribute type name → `attributes[].key`
  - unit code → `attributes[].unit`
- Keep the original source text only as evidence (`sourceRef` and optional draft-only `rawText`), not as the persisted atom.

Unit normalization note:
- Normalize unit codes to canonical short codes (typically upper-case): `lb` → `LB`, `in` → `IN`.
- If the source uses a unit that is not in the global registry (e.g., `hp`), create it in the workspace tier:
  - `code: "HP"`, `dimension: POWER`, `canonicalUnitCode: "W"`, `toCanonicalFactor: 745.699872`, `offset: 0`.
  - Then store `unit: "HP"` on the attribute so downstream systems can canonicalize consistently.

### Step 5 — Produce a draft product JSON for human review
The agent outputs a draft Studio catalog product object (not persisted yet).
The UI must require explicit confirmation before creation.

### Step 6 — Persist + validate
- UI calls `studioCatalogCreateProduct` (or the agent calls `studio_catalog_create_product`).
- Run `studioCatalogValidate` on the catalog after writing.

---

## 4) Guardrails that prevent “tag soup”

### A) Identity must be attributes (not tags)
Do not create tags like:
- `ford`, `f150`, `xlt`, `2024`

Those are identity facts and belong under brand attributes.

### B) Measurements must be attributes (not tags)
Do not create tags like:
- `weight`, `length`, `lbs`, `in`, `psi`, `hp`

Measurements belong under physical attributes + units.

### C) Context belongs in `contextTags[]`
If a phrase has qualifiers, prefer context tags instead of new attribute types.

### D) Keep taxonomy tags small
Taxonomy tags are for discovery/substitution, not for encoding the full spec sheet.
Prefer:
- `pickup_truck`, `vehicle`
Avoid:
- `crew_cab_6.5ft_bed_4x4_3.5l_ecoboost_2024_xlt`

### E) Always attach sources
At minimum, the product draft should contain:
- `sourceRefs: ["<url>"]`
and key attributes should include `sourceRef`.

---

## 5) Example: “Ford F‑150 2024 XLT” (material product)

This example is about **structure**. Replace numeric values with numbers extracted from your selected source(s).

### A) Example source selection (Brave)
Example query:
- `2024 Ford F-150 XLT specs overall length bed length curb weight payload`

The agent should pick one or more results and store the selected URL(s) in `sourceRefs[]`.

### B) Product JSON (Studio catalog product)
`/catalogs/default/products/ford_f150_2024_xlt.jsonc`

```json
{
  "schemaVersion": "1.0",
  "id": "ford_f150_2024_xlt",
  "name": "Ford F-150 2024 XLT",
  "kind": "material",
  "status": "draft",
  "tags": ["vehicle", "pickup_truck"],
  "sourceRefs": [
    "https://<chosen-spec-source>/ford-f-150/2024/specifications"
  ],
  "attributes": [
    {
      "key": "manufacturer",
      "value": "Ford",
      "sourceRef": "https://<chosen-spec-source>/...#identity"
    },
    {
      "key": "model",
      "value": "F-150",
      "sourceRef": "https://<chosen-spec-source>/...#identity"
    },
    {
      "key": "year",
      "value": 2024,
      "sourceRef": "https://<chosen-spec-source>/...#identity"
    },
    {
      "key": "trim",
      "value": "XLT",
      "sourceRef": "https://<chosen-spec-source>/...#identity"
    },

    {
      "key": "length",
      "value": 0,
      "unit": "IN",
      "contextTags": ["overall"],
      "sourceRef": "https://<chosen-spec-source>/...#dimensions"
    },
	    {
	      "key": "length",
	      "value": 0,
	      "unit": "IN",
	      "contextTags": ["truck_bed"],
	      "sourceRef": "https://<chosen-spec-source>/...#dimensions"
	    },
    {
      "key": "width",
      "value": 0,
      "unit": "IN",
      "contextTags": ["overall"],
      "sourceRef": "https://<chosen-spec-source>/...#dimensions"
    },
    {
      "key": "height",
      "value": 0,
      "unit": "IN",
      "contextTags": ["overall"],
      "sourceRef": "https://<chosen-spec-source>/...#dimensions"
    },
    {
      "key": "clearance",
      "value": 0,
      "unit": "IN",
      "contextTags": ["ground"],
      "sourceRef": "https://<chosen-spec-source>/...#dimensions"
    },

    {
      "key": "weight",
      "value": 0,
      "unit": "LB",
      "contextTags": ["curb"],
      "sourceRef": "https://<chosen-spec-source>/...#weights"
    },
    {
      "key": "weight",
      "value": 0,
      "unit": "LB",
      "contextTags": ["payload", "max"],
      "sourceRef": "https://<chosen-spec-source>/...#weights"
    },
    {
      "key": "weight",
      "value": 0,
      "unit": "LB",
      "contextTags": ["towing", "max"],
      "sourceRef": "https://<chosen-spec-source>/...#weights"
    },

    {
      "key": "power",
      "value": 0,
      "unit": "HP",
      "contextTags": ["engine", "max"],
      "sourceRef": "https://<chosen-spec-source>/...#engine"
    }
  ]
}
```

### C) Why this stays clean over time
- Identity is **attributes**, so “Ford vs Ford Motor Company” can be canonicalized via attribute values/synonyms without rewriting tag strings.
- Physical specs are **atomic** (`length`, `weight`, `power`) and qualified by context tags, so new spec lines don’t create new schema keys.
- Taxonomy tags remain few and reusable for search.

---

## 6) Implementation note (agent + UI)

The UI should reflect the thesis directly:
- A dedicated “Identity attributes” section (manufacturer/model/year/trim/etc)
- A dedicated “Physical attributes” section (measurements)
- A dedicated “Taxonomy tags” section (few, reusable)

And the agent tool surface should support it:
- Use `brave_search` for sources.
- Use `resolve_global_or_workspace_*` for reuse-first atom creation.
- Require user approval before calling `studio_catalog_create_product` (or `studioCatalogCreateProduct`).
