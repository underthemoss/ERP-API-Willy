# Catalog Product Integration Audit (Price Books, Quotes, Storefront)

This document captures where the ERP currently encodes “product” using PIM
concepts (category/product IDs) and what must change to reference composed
product definitions built from Global Vocabulary atoms (GlobalTags +
GlobalAttributeTypes/Values).

The goal is to keep the **Global Vocabulary** as the source of atomic meaning
(tags + attribute types/values) and introduce a separate **Catalog Product**
library that composes those atoms into products and services, without coupling
core workflows to PIM.

---

## 1) Current State: “Product” == PIM Category (+ optional PIM Product)

Today, “product” is effectively:

- `pimCategoryId` (+ denormalized `pimCategoryName`, `pimCategoryPath`)
- optional `pimProductId`
- plus `priceId` when pricing is involved

This coupling exists in pricing, quoting, storefront intake, order docs,
fulfilment, inventory, search, and a few plugins.

### 1.1 Pricing / Price Books

Price books are containers and do not define product identity themselves:
- `price_books` in `src/services/prices/price-book-model.ts`

Prices encode product identity via PIM:
- `prices` in `src/services/prices/prices-model.ts`:
  - required: `pimCategoryId`, `pimCategoryName`, `pimCategoryPath`
  - optional: `pimProductId`

GraphQL exposes these fields and validates via PIM services:
- `src/graphql/schema/prices.ts` (create/update)

OpenSearch index depends on `pimCategory*` fields and category “level” breakdown:
- `src/services/opensearch/indexes/pricesIndex.ts`

### 1.2 Quotes / Quote Revisions

Quote revisions store product requirements on line items:
- `src/services/quoting/quote-revisions-model/events-store.ts`
  - RENTAL/SALE line items require `pimCategoryId`
  - SERVICE line items currently carry no product identity

GraphQL input mapping enforces `pimCategoryId` for RENTAL/SALE:
- `src/graphql/schema/quoting.ts` (`QuoteRevisionLineItemInput` + `mapQuoteRevisionLineItem`)

Accept quote flow currently writes `so_pim_id`/`po_pim_id` from `pimCategoryId`:
- `src/graphql/schema/quoting.ts` (`acceptQuote`)

### 1.3 RFQs

RFQ line items mirror quote revision line items (RENTAL/SALE require `pimCategoryId`):
- `src/services/quoting/request-for-quotes-model/events-store.ts`
- GraphQL mapping in `src/graphql/schema/quoting.ts` (`RFQLineItemInput` + `mapRFQLineItem`)

### 1.4 Storefront / Intake Forms

Storefront “cart/checkout” is implemented via intake forms:
- `IntakeForm` → `IntakeFormSubmission` (buyer-authored demand wrapper)
- Line items are now stored in the canonical `line_items` collection with:
  - `documentRef.type = INTAKE_SUBMISSION`
  - `documentRef.id = <submissionId>`
  - `workspaceId = <sellerWorkspaceId>` (the workspace that owns the storefront)

Product identity is still PIM-coupled today:
- `LineItem.productRef.kind = PIM_CATEGORY`
- `LineItem.productRef.productId = pimCategoryId`

Pricing is attached via optional `pricingRef.priceId` (points to `prices`).
Custom/unknown pricing may be represented by a line item with no `priceId` yet.

GraphQL exposes `pimCategoryId` and resolves `pimCategory` via dataloader:
- `src/graphql/schema/intake-forms.ts`

Quote-from-intake copies `pimCategoryId` into quote line items:
- `src/graphql/schema/quoting.ts` (`createQuoteFromIntakeFormSubmission`)

### 1.5 Orders, Fulfilment, Inventory (downstream coupling)

Sales/purchase order line items use overloaded PIM fields:
- `sales_order_line_items.so_pim_id` in `src/services/sales_orders/sales-order-line-items-model.ts`
- `purchase_order_line_items.po_pim_id` in `src/services/purchase_orders/purchase-order-line-items-model.ts`

Purchase order submission currently tries to interpret `po_pim_id` as a product
first, then as a category:
- `src/services/purchase_orders/index.ts`

Fulfilment denormalizes `pimCategory*` and optional `pimProductId` from price for
filtering and description:
- `src/services/fulfilment/model.ts`
- `src/services/fulfilment/index.ts`
- GraphQL exposes these: `src/graphql/schema/fulfilment.ts`

Inventory carries PIM fields to group and filter:
- `src/services/inventory/model.ts`
- GraphQL exposes these: `src/graphql/schema/inventory.ts`

### 1.6 Secondary dependencies

Image generation prompt construction uses `pimCategoryName/pimCategoryPath`:
- `src/services/image_generator/prompt-builder.ts`
- `src/plugins/image-generator/handlers/prices.ts`

MCP tools are currently keyed on PIM category/product:
- `src/plugins/mcp/tools/create_rental_price.ts`
- `src/plugins/mcp/tools/search_prices.ts`

---

## 2) Target State: “Product” == Catalog Product Definition (composed from atoms)

Introduce a catalog-level product definition that is built from Global Vocabulary atoms:

- Material products:
  - `tag_ids[]` (classification)
  - `physical_attributes[]` (atomic attribute type + value + unit + context_tag_ids[])
  - `brand_attributes[]`
- Service products:
  - `tag_ids[]` + optional `activity_tag_ids[]`
  - `attribute_schema[]` (input vocabulary for quoting/constraints)
- Assemblies (optional):
  - references other products (service/material) + quantities (BOM)

### 2.1 The minimal integration contract

Replace PIM identifiers in business workflows with a stable catalog reference:

`catalogProductId` (preferred simple form)

or, if needed later:

`catalogRef = { kind, id }` where `kind ∈ { MATERIAL, SERVICE, ASSEMBLY }`

Key principle:
- Pricing, quoting, and storefront flows reference **catalog product IDs**, not
  PIM categories/products.
- Quote line items move to `product_ref` (kind + product_id) and service line
  items can include target selectors that bind services to material/product
  demand. See `docs/quote.md`.

---

## 3) What will need to change (implementation impact list)

When adopting catalog product IDs, these will change:

1) Prices
- Replace `pimCategoryId/pimCategoryName/pimCategoryPath/pimProductId` with `catalogProductId`.
- Update CSV import/export headers accordingly.
- Update price search index to facet/filter on catalog product (and/or derived tag usage), not PIM category levels.

2) Quote revisions / RFQs
- Replace `pimCategoryId` on RENTAL/SALE line items with `catalogProductId`.
- Keep `sellersPriceId` as-is for price lookup; price already points to catalog product.

3) Intake form submission line items
- Replace `pimCategoryId` with `catalogProductId`.
- Continue to allow `priceId` to be optional (custom price items).

4) Orders + fulfilment + inventory
- Replace `so_pim_id/po_pim_id` with a single stable `catalogProductId` on line items.
- Update fulfilment and inventory denormalization/filters to use catalog product IDs (and/or tags) instead of PIM fields.

5) Plugins
- Update image prompt building and MCP tools to use catalog product display fields
  (e.g., `product.name` + rendered tag breadcrumbs) rather than PIM category breadcrumbs.

---

## 4) Migration approach (fast, destructive allowed)

Because data preservation is not required:

- Remove PIM category/product requirements from pricing/quoting/intake schemas.
- Remove PIM-derived denormalized fields from fulfilment/inventory where feasible.
- Add catalog product collections and reseed a minimal catalog for local/dev.
- Rebuild OpenSearch indexing around catalog products/tags.

This yields a clean separation:
- Global Vocabulary = atoms (tags + attribute schemas)
- Catalog Products = compositions of atoms
- Business workflows = references to catalog products + pricing, not PIM

---

## 5) Studio Catalog Workspace (Filesystem-First “Catalog View”)

Before we touch any of the existing PIM-based flows, we can start with a
filesystem-based catalog workspace that the studio agent (and humans) can edit.

The goal of this workspace is simple:
- Provide a **single “catalog view” file** that shows the composed products in a catalog.
- Keep everything editable in the IDE (diffable, reviewable, versionable).
- Use canonical vocabulary strings (`GlobalTag.label`, `GlobalAttributeType.name`, unit codes)
  so the file can be deterministically imported later.

### 5.1 Recommended folder layout

Create one folder per catalog:

```
catalogs/
  <catalog_slug>/
    catalog.jsonc
    sources/
      ...
```

Notes:
- `catalog.jsonc` is the **view + source of truth** (JSON with comments allowed by editors).
- `sources/` holds any supporting material the agent used (URLs, pasted tables, extracted text, etc.).
- The JSON Schema for `catalog.jsonc` should ship with Studio for validation
  (repo reference: `studio/catalog.schema.json`).

### 5.2 File type choice

Recommendation:
- **Canonical**: `catalog.jsonc` (easy to parse later; still readable in the IDE)
- **Optional**: `notes.md` if you want narrative context, decisions, and TODOs

We avoid spreadsheets as the source of truth because they drift and are hard to diff.

### 5.3 Canonical JSON shape (composed products)

At this stage, we do **not** store DB IDs. We reference atoms by canonical strings:
- tags by `label` (snake_case)
- attribute types by `name`
- units by unit code (`KG`, `MM`, `KW`, etc.)

Core top-level object:
- `schemaVersion`: for future migrations of this file format
- `catalog`: metadata (id/name)
- `products[]`: composed product definitions

Product shapes:
- `kind`: `MATERIAL | SERVICE | ASSEMBLY`
- `tags[]`: list of tag labels (any tag can exist; missing tags are proposed later)

For MATERIAL:
- `physicalAttributes[]`: `{ attributeType, value, unit, contextTags[] }`
- `brandAttributes[]`: `{ attributeType, value, contextTags[]? }`

For SERVICE:
- `activityTags[]` (optional): list of tag labels (verbs preferred, not required)
- `attributeSchema[]`: `{ attributeType, requirement, defaultUnit, contextTags[]? }`

For ASSEMBLY:
- `components[]`: references other product ids in the same file (or later, other catalogs)

### 5.4 Minimal path forward (reviewable plan)

Phase A — Define the workspace contract (no backend changes)
- Add `studio/catalog.schema.json` (JSON Schema) for editor validation/autocomplete.
- Add `catalogs/<catalog_slug>/catalog.jsonc` with a few example products.

Phase B — Iterate with the studio agent (still no backend changes)
- Agent proposes new tags/attributes as needed (by label/name) directly in `catalog.jsonc`.
- Agent keeps sources in `sources/` and attaches evidence references in product entries when helpful.

Phase C — Import (later, optional)
- Add a backend import command that:
  - upserts missing tags/attribute types as `PROPOSED`
  - creates catalog product definitions referencing the canonical atom IDs
  - emits a curation report (what was created vs reused)

Phase D — Integrate into pricing/quoting (future; covered by sections 2–4)
- Replace PIM identifiers with catalog product references across the affected flows.

### 5.5 Studio filesystem contract (deterministic, tenant-scoped)

To make “catalog curation” a first-class workflow (without forcing the ERP app
to become a CMS), Studio needs a deterministic filesystem contract that both:

- Humans can edit (IDE-like)
- The agent can reliably interpret (no implicit magic or environment drift)

**Assumptions / invariants**

- Studio has a **per-tenant workspace filesystem** (the URL already encodes the
  workspace; the explorer shows a workspace-scoped tree).
- Files are **durable across sessions** (so catalogs are real artifacts, not chat state).
- The agent has read/write access to this filesystem, and Studio can support
  user uploads into it.
- “Global vocabulary” is not stored in this filesystem; it is read/curated via
  the ERP API (GraphQL).

**Root folders (recommended)**

```
/
  conversations/     # existing; chat transcripts + workflows
  guides/            # existing; static docs
  catalogs/          # new; deterministic catalog workspaces
```

### 5.6 Catalog folder type (how Studio knows “this is a catalog”)

Studio needs a deterministic way to recognize that a folder is “a catalog” so it
can:

- treat it as a curated artifact (not random files)
- scope the agent’s actions and “publish” flows
- provide predictable places for uploads and derived outputs

**Folder type rule (minimal, deterministic)**

A folder is a catalog folder iff:
- it lives under `/catalogs/<catalog_slug>/`
- and it contains a top-level `catalog.jsonc`

This is intentionally similar to “a Node project has a `package.json`”.

**Required files**

```
catalogs/<catalog_slug>/
  catalog.jsonc      # source-of-truth composed products (validated by schema)
  sources/           # raw evidence uploaded by user/agent (pdf/csv/txt/images)
```

**Recommended (optional) files / subfolders**

```
catalogs/<catalog_slug>/
  sources/index.jsonc      # source registry (where files came from + hashes)
  notes.md                 # human narrative + decisions
  .catalog/                # derived artifacts (never hand-edited)
    resolved.lock.json     # canonical strings -> DB ids (generated on publish)
    publish-report.md      # what changed/created + lint warnings
    snapshots/             # optional point-in-time exports
```

Key invariant: there is exactly one editable source-of-truth for product
composition (`catalog.jsonc`). Everything else is evidence or derived output.

### 5.7 Agent context: “catalog conversation” and active folder selection

Because Studio is IDE-like, many files can be open. The agent cannot guess which
catalog you mean. Studio must provide a deterministic “active catalog” context.

**Goal**

When a user is in a catalog curation session, every agent action should be
scoped to exactly one catalog folder unless the user explicitly says otherwise.

**Active catalog resolution (in order)**

1) If the currently active editor file is within `catalogs/<slug>/…`, that
   catalog is active.
2) Else if the user has selected a folder in the explorer that contains
   `catalog.jsonc`, that catalog is active.
3) Else if the conversation has pinned a catalog (metadata), use that.
4) Else: no active catalog → the agent must ask “which catalog folder?”

**Persisting catalog scope**

Studio should store the active catalog path as conversation metadata so reopening
the conversation restores scope without relying on which tabs happen to be open.

Minimal implementation options:

- Conversation frontmatter in the conversation file:
  - `catalogPath: catalogs/<slug>`
- Or conversation metadata in Studio’s DB keyed by conversation id.

Either way, the agent should receive in its runtime context:
- `workspaceId` (tenant/workspace)
- `activeCatalogPath` (or null)
- `openFiles[]` and `activeFile` (already present in your IDE harness model)

**API access (global + tenant)**

Catalog curation is file-first, but the agent still needs read/write access to:
- **Global** vocabulary (tags, attribute types, units) for lookup + proposing atoms
- **Tenant** catalogs/products for publish/import (future)

Do not solve this with committed `.env` keys. Studio should pass the agent a
secure, runtime auth context (or proxy) derived from the user’s session so the
agent can call the local ERP API for that workspace.

### 5.8 Upload-first evidence ingestion (no external keys required)

The core ingestion capability should not depend on external “API keys” (search,
S3, etc.). The deterministic primitive is:

**User uploads evidence → Studio writes it into the active catalog’s `sources/`**

Then the agent can:
- read the file
- extract candidate facts
- update `catalog.jsonc` with composed products + provenance references

**Recommended upload behaviors**

- Default upload destination: `catalogs/<active>/sources/`
- Preserve original filename but add a stable suffix to avoid collisions:
  - `deere_330p_specs__2025-12-25.pdf`
- Optionally compute a hash and write to `sources/index.jsonc`:
  - `{ path, originalName, mimeType, sha256, addedAt, addedBy }`

This makes evidence durable, reviewable, and “shareable with the agent” without
any staging dependencies.

### 5.9 Studio ↔ ERP boundary (why the filesystem matters)

Studio catalogs are the **draft/source** representation of tenant products.
ERP app views are the **operational** representation (price books, quotes, etc.).

To keep the system extensible without coupling everything to curation:

- **Draft (Studio)**: `catalog.jsonc` + sources, edited by humans + agent.
- **Publish (ERP)** (future): a backend import that converts canonical strings
  to DB ids and writes tenant catalog products.

Publishing should be explicit and deterministic:

- Validate `catalog.jsonc` against `studio/catalog.schema.json`
- Lint for obvious ontology drift (e.g., blended attribute type names)
- Upsert missing GlobalTags / GlobalAttributeTypes as `PROPOSED` (curation queue)
- Upsert tenant CatalogProducts as `ACTIVE` (or `PROPOSED` if you want review)
- Emit `.catalog/publish-report.md` + `.catalog/resolved.lock.json`

This preserves the thesis:
- Global Vocabulary = shared atoms (governed)
- Tenant Catalog = compositions (fast iteration)
- Studio FS = deterministic collaboration surface for humans + agent

### 5.10 Studio MVP enhancement (the first thing to build)

If Studio only implements one thing to unlock catalog curation, it should be:

1) Add a first-class `/catalogs/` root folder in the explorer (create/rename/delete).
2) Add “Upload to Catalog…”:
   - if an active catalog exists → upload into `catalogs/<active>/sources/`
   - else → prompt user to pick/create a catalog first
3) Add “Set Active Catalog” (or pin catalog to conversation metadata).
4) Validate `catalogs/<slug>/catalog.jsonc` against `studio/catalog.schema.json`
   and surface errors inline (red squiggles or a Problems panel).

With those four primitives, the agent can do the rest (decompose sources, propose
atoms, and maintain the composed product list) without Studio learning the
ontology “thesis”.

### 5.11 Studio ↔ Backend migration plan (hybrid, IDE-first)

The frontend team’s instincts are correct (durability, reliability, long-running
work), but Studio is an IDE-like product: moving **all** orchestration to the
backend too early can make interactive approvals and “active file/folder”
context brittle.

The correct target is a **hybrid** model:
- **Frontend** orchestrates interactive turns (approvals, short tool sequences,
  file edits, `present_options`).
- **Backend** owns durable state (conversations + filesystem) and runs
  background jobs when work must continue beyond a browser session.

#### What stays in Studio (frontend)

- Agent UI: streaming token rendering, message UX, tool approval UI.
- Thin clients: MCP client, filesystem client, conversation client.
- Interactive orchestration for short turns (the “IDE copilot” feel).

#### What must migrate to ERP-api (backend)

- **Conversation persistence**: stored in DB, workspace-scoped, permissioned
  (includes `pinned_catalog_path` and other conversation metadata).
- **Workspace filesystem persistence** (if catalogs/sources are shared/durable):
  server-backed `catalogs/<slug>/…` becomes the source of truth.
- **Privileged tools + reliability**:
  - keep `/api/agent/chat` and `/api/mcp` as backend services
  - add background “jobs” for long-running ingestion/publish pipelines
- **Global vocabulary governance** already lives here (merge tags, etc.).

#### Critical correction: do not remove file paths

`catalogs/<slug>/catalog.jsonc` and `sources/…` are the deterministic workflow
contract. The frontend should not treat a browser-local FS as durable truth, but
it **must** continue to manipulate **paths** as canonical identifiers.

Reframe the rule as:
- frontend does not persist files locally as the source of truth
- frontend still edits files *by path*
- backend stores, versions, and authorizes those paths

#### Phase sequence (pragmatic)

Phase 1 — Conversations (fast, high ROI)
- Add DB-backed conversation CRUD (create/list/get/update/delete).
- Persist conversation metadata:
  - `pinned_catalog_path` (required for deterministic catalog curation)
  - optional `working_set` (active file, open files, selected folder)
- Keep the agentic loop in the frontend for now; frontend saves user+assistant
  messages to the conversation record.

Phase 2 — Server-backed StudioFS (the real unlock)
- Implement a workspace-scoped filesystem service with operations:
  - `fs.list`, `fs.read`, `fs.write`, `fs.mkdir`, `fs.move`, `fs.delete`,
    `fs.upload`, `fs.stat`
- Make `/catalogs/` a first-class root and enforce the `catalog.jsonc` sentinel.
- Update Studio to read/write via this service; keep any in-browser FS only as a
  cache/offline layer (optional).

**Phase 2 requirements (do these on day one, not later)**

- **Optimistic concurrency**: every file write must include `expectedRevision`
  (monotonic int) or `expectedEtag` (hash). Reject mismatches to prevent silent
  overwrites (multi-tab + agent edits).
- **Workspace root is server-owned**: all paths are relative to a workspace FS
  root (`/`). Backend enforces canonical roots:
  - `/catalogs/`, `/conversations/`, `/guides/` (and any future roots)
  - Frontend never invents roots; it consumes what the backend exposes.
- **Separate “tree” from “content”** (even if both live in Mongo initially):
  - Tree metadata: nodes, parent relations, path/name, mime, revision pointers
  - Content blobs: immutable payloads referenced by hash (dedupe + audit)
  This keeps publishing/snapshots cheap and prevents content drift.
- **Catalog semantics are validation, not storage**:
  the filesystem stays generic; a “catalog” is detected via sentinel
  `catalog.jsonc` + schema validity (as defined in 5.6).

Phase 3 — Jobs (reliability for long work)
- Add backend jobs for:
  - batch ingest (PDF/URL sets → extracted evidence files + proposed atoms)
  - publish/import (`catalog.jsonc` → tenant catalog products + reports)
- Frontend triggers jobs and renders progress; interactive approvals remain in
  the frontend.

**Add early (guardrail): catalog validate/lint**

Before “publish/import”, add a validation endpoint/mutation the agent can call
continuously:
- validate JSONC against `studio/catalog.schema.json`
- lint for forbidden blended attribute type names
- lint for obviously wrong “measurable tags” (e.g., `weight` as a tag)

Phase 4 — Optional: server-orchestrated loop
- Only move more orchestration server-side if you explicitly want:
  - “continue running after tab closes”
  - resumable pipelines
  - retry semantics across large tool chains
