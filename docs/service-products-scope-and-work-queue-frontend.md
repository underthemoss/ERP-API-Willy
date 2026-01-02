# Frontend Guide: Service Products → Scope Tasks → Work Queue (Beta)

This guide explains how the frontend should use the current backend data model to:

1) Create/edit **SERVICE catalog products** with **taskTemplates** (reusable scope decomposition).
2) Copy those templates into **contract scope** on SERVICE **line items** (`scopeTasks[]`).
3) Surface a **beta “Service Work Queue”** powered by **service fulfilments**, where a worker can be assigned and tasks can be marked done.

Key thesis: the atomic “work spec” is always composed from the same primitives (activity/context tags + optional typed inputs). Different wrappers (product vs contract line item vs fulfilment) determine meaning and lifecycle.

Note: Catalog products of any kind can store `taskTemplates[]`. For `kind=service`, they represent reusable *scope decomposition*. For `kind=material` they can represent reusable *operational checklists* (e.g., receiving inspection). Only `activityTags[]` and `targetSpecs[]` are restricted to `kind=service`.

---

## 1) Data model: where each concept lives

### 1.1 Service product (catalog identity + reusable templates)

- Stored in StudioFS as a file: `/catalogs/default/products/<productId>.jsonc`
- Created via GraphQL: `studioCatalogCreateProduct`
- Updated via GraphQL: `studioFsRead` + `studioFsWrite` (ETag required) or a dedicated product update flow if added later.

Relevant fields (SERVICE kind):
- `kind: "service"`
- `tags[]` — taxonomy nouns (“what it is”)
- `activityTags[]` — primary activities (“what it does”)
- `taskTemplates[]` — reusable scope decomposition

`taskTemplates[]` shape:
```json
{
  "id": "mop_floors",
  "title": "Mop floors",
  "activityTagIds": ["mop"],
  "contextTagIds": ["floors"],
  "notes": "Use neutral cleaner"
}
```

Important constraints:
- `activityTags[]` and `targetSpecs[]` require `kind=service` (backend rejects otherwise).
- `taskTemplates[]` are allowed on any catalog product kind:
  - `kind=service`: reusable scope templates to copy onto SERVICE line items as `scopeTasks[]`.
  - `kind=material`: reusable operational templates (e.g., receiving/inspection checklists). These are not automatically executed today; the UI/workflows decide when to instantiate them.
- `activityTagIds/contextTagIds` must store canonical **tag labels**, not tag IDs (do not store `WTG-*` / `GTG-*` values).
- `id` should be a stable slug (`[a-z0-9][a-z0-9-_]*`) and must be unique per product.

### 1.2 Contract scope on line items (`scopeTasks[]`)

Canonical line items live in Mongo (`line_items`) and are exposed via GraphQL:
- `createLineItem`, `updateLineItem`, `getLineItemById`, `listLineItems`

SERVICE line items support:
- `scopeTasks[]` (SERVICE-only) — the buyer-accepted scope list once the line item is under a contractual wrapper.

`scopeTasks[]` shape matches the product template shape (plus optional lineage):
```json
{
  "id": "mop_floors",
  "sourceTemplateId": "mop_floors",
  "title": "Mop floors",
  "activityTagIds": ["mop"],
  "contextTagIds": ["floors"],
  "notes": "Kitchen + hallway"
}
```

Current backend guardrails:
- `scopeTasks` is rejected on non-`SERVICE` line items.
- `scopeTasks[].activityTagIds` must be non-empty.
- Tag values must be canonical labels (rejects ID-like prefixes).
- `scopeTasks[].id` must be unique per line item.

### 1.3 Work execution (service fulfilments)

Work execution is represented by **service fulfilments**:
- GraphQL: `listFulfilments`, `getFulfilmentById`
- Creation (beta): `createServiceFulfilmentFromLineItem`
- Assignment (group-of-tasks): `updateFulfilmentAssignee`
- Task status updates: `updateServiceFulfilmentTaskStatus`

Service fulfilment tasks are created by copying `lineItem.scopeTasks[]` into fulfilment `tasks[]` and adding execution state:
```json
{
  "id": "mop_floors",
  "title": "Mop floors",
  "activityTagIds": ["mop"],
  "contextTagIds": ["floors"],
  "status": "OPEN"
}
```

Current execution semantics:
- Assignment is **per fulfilment** (one assignee for the whole work item).
- Per-task assignees are not implemented yet.

---

## 2) Frontend: augment SERVICE products with task templates

### 2.1 UI requirements

Add a “Scope templates” section to SERVICE product edit/create UI:
- List existing templates (id + title + tags).
- Add/edit/remove templates.
- Enforce stable IDs:
  - Create: derive id from title (`"Mop floors"` → `mop_floors`)
  - Edit: do not silently change IDs; treat as breaking change.

### 2.2 Tag resolution rules (do not create string mess)

For each `activityTagIds`/`contextTagIds` tag label:
- Resolve-first to global vocabulary (prefer reuse).
- Only create workspace-draft tags when missing and explicitly approved (fast path).
- Store the **canonical label** returned by the resolver/upsert, not the display label.

Do not:
- Store identity facts as tags (brand/manufacturer/etc).
- Store units as tags.
- Store tag IDs like `WTG-*`/`GTG-*`.

### 2.3 Persistence patterns

**Create new product**
- Use GraphQL `studioCatalogCreateProduct` with `product.taskTemplates`.
- Optionally run `studioCatalogValidate` before enabling “Save”.

**Update existing product**
- Read the product file via `studioFsRead` and keep the returned `ETag`.
- Write the updated JSONC via `studioFsWrite` using `expectedEtag` (optimistic concurrency).

---

## 3) Frontend: using task templates to build contracted scope

### 3.1 When a user selects a SERVICE product for a line item

When the user picks a SERVICE product (catalogRef):
- Copy `product.taskTemplates[]` → `lineItem.scopeTasks[]`:
  - `scopeTasks[].id = taskTemplates[].id`
  - `scopeTasks[].sourceTemplateId = taskTemplates[].id`
  - `title/activityTagIds/contextTagIds/notes` copied over
- Allow edits in the line item editor:
  - remove tasks
  - reorder tasks
  - add ad-hoc tasks (still must be atomic + tags resolved-first)
  - edit notes

### 3.2 Saving line items

Use canonical line items as the persistence target:
- `createLineItem(input: LineItemInput!)`
- `updateLineItem(input: UpdateLineItemInput!)`

Important:
- `scopeTasks[]` is SERVICE-only; do not send it on RENTAL/SALE.
- Store tag labels, not tag IDs.

---

## 4) Beta Service Work Queue UI (seller-side execution view)

### 4.1 Data sources

**Primary list:** service fulfilments
- Query: `listFulfilments(filter: { workspaceId, salesOrderType: SERVICE }, page: …)`

**“What + where” details:** canonical line item referenced by the fulfilment
- Use `getLineItemById(id: fulfilment.salesOrderLineItemId)` to retrieve:
  - `description`, `productRef`
  - `scopeTasks[]` (contract scope, if still needed)
  - `timeWindow` (start/end)
  - `placeRef` (jobsite/branch/etc)
  - `notes`, `constraints`, `inputs`

Do not rely on `salesOrderLineItem` on fulfilments for SERVICE yet; SO/PO service unions are not fully wired.

### 4.2 What to display

For each service fulfilment row/card:
- **What**:
  - line item `description` and `productRef`
  - fulfilment task list (OPEN/DONE/SKIPPED)
- **Where** (best-effort):
  - `lineItem.placeRef` if present
  - else `fulfilment.project` + `fulfilment.contact` context
- **When**:
  - `fulfilment.serviceDate`
  - optionally `lineItem.timeWindow.startAt/endAt`
- **Who**:
  - `fulfilment.assignedTo` (internal user)
  - `fulfilment.contact` (the buyer contact for the sales order)

### 4.3 Assignment (group-of-tasks)

Assign a worker to the entire work item:
- Mutation: `updateFulfilmentAssignee(fulfilmentId, assignedToId)`
- `assignedToId` currently points to a **User** (internal employee), not a business contact.

If you need to assign an external business, do not overload fulfilment assignment:
- Model it as downstream procurement (Phase 5); the “assignee” becomes a new seller on a downstream wrapper.

### 4.4 Task completion

For each task in `fulfilment.tasks[]`:
- Mutation: `updateServiceFulfilmentTaskStatus({ fulfilmentId, taskId, status })`
- Status options: `OPEN | DONE | SKIPPED`

UI notes:
- Use checkbox for DONE, dropdown for DONE/SKIPPED/OPEN.
- Show `completedAt/completedBy` when present (audit trail).

---

## 5) Quote → Order → Fulfilment (SERVICE) integration

If you want: “add a SERVICE product to a sales quote → accept quote → seller sees it as work in fulfilment”, there are a few required integration points.

### 5.1 Quote line item (SERVICE) must carry enough contract data

When the user adds a SERVICE product to a quote revision, ensure the quote line item includes:
- `type: SERVICE`
- `productRef` (the service product identity)
  - `kind: SERVICE_PRODUCT` (current quoting schema) and `productId: <catalogProductId>`
- Pricing selection (required if you want fulfilment later):
  - `sellersPriceId` (or `pricingRef.priceId`) referencing the SERVICE price
  - `unitCode` consistent with `pricingSpecSnapshot.unitCode` (e.g. `HOUR`, `EA`)
  - Backend will compute:
    - `subtotalInCents`
    - `pricingSpecSnapshot` + `rateInCentsSnapshot`
- “When”:
  - for one-time work: set `timeWindow.startAt` (used as default `serviceDate`)
- “Where”:
  - set `placeRef` when available (jobsite/branch/etc)
- Scope:
  - once Phase 2A is complete, include `scopeTasks[]` (copied from product `taskTemplates[]` and edited by the user)

Important:
- If the line item is unpriced, it may still be draftable, but **creating fulfilment** currently requires a pricing snapshot (`rateInCentsSnapshot`).

### 5.2 Save quote revisions via quoting APIs (not canonical line_items)

Quote revisions are event-sourced; the source of truth is quoting GraphQL:
- `createQuoteRevision`
- `updateQuoteRevision` (replaces the full `lineItems[]` list)

Do not attempt to persist quote state by calling `createLineItem` with `documentRef.type=QUOTE_REVISION`. Canonical quote line items are a mirror used for cross-domain workflows and downstream projection, not the quote-authoring write path.

### 5.3 Seller-side “convert to order” (off-platform buyer acceptance)

If the buyer is off-platform (no buyer user session) but the seller needs to convert a quote into an order after receiving offline approval (phone/email/text), the frontend can convert directly without sending anything to the buyer.

1) **Accept on behalf of buyer** (convert to Sales Order)
   - Mutation: `acceptQuote({ quoteId, approvalConfirmation, buyerAcceptedFullLegalName?, signature? })`
   - For seller-side acceptance, `approvalConfirmation` is required (backend-enforced), e.g.:
     - `"Approved by phone call with Jane Doe on 2025-01-03"`
     - `"Approved via email thread on 2025-01-03 (see notes)"`
   - On success: use `result.salesOrder.id` to navigate to the Sales Order experience. SERVICE line items will already be projected into canonical `line_items` and (best-effort) fulfilments may be materialized for scheduled services.
   - This offline-approval path skips buyer email notifications from the platform (seller is responsible for any out-of-band communication).

Optional (only if you actually want to email/share the quote from the platform):
- Mutation: `sendQuote({ quoteId, revisionId })`
- Notes:
  - `sendQuote` requires the buyer contact to have an email address (it upserts a buyer user and sends an email best-effort).
  - You do not need to call `sendQuote` to convert a quote into an order when you have offline approval.

Recommended UX:
- On the quote page (seller view), show:
  - **Send quote** (if current revision is not `SENT`)
  - **Convert to order** / **Mark accepted** (seller-side, with offline approval note)
- “Convert to order” opens a small dialog:
  - required `approvalConfirmation` textarea
  - optional `buyerAcceptedFullLegalName`
  - optional signature capture/upload if you want it

Notes:
- The backend supports seller-side conversion from either `SENT` or `DRAFT` revisions.
  - If the current revision is `DRAFT`, submitting `acceptQuote({ approvalConfirmation })` will promote the revision to `SENT` as part of acceptance (so the accepted contract is never left as “draft”).
  - This path does **not** require `sendQuote`, and it will **not** send platform emails to the buyer (seller is responsible for any out-of-band communication).

### 5.4 Accepting the quote must project SERVICE line items into the Sales Order

Fulfilment is seller-side execution of **accepted demand**, so the acceptance flow must:
- Create a **SERVICE** canonical line item under `documentRef.type=SALES_ORDER`
- Copy contract data from the accepted quote revision line item:
  - `productRef`
  - `scopeTasks[]`
  - `pricingSpecSnapshot` + `rateInCentsSnapshot`
  - `timeWindow` / `placeRef` / `notes` / `constraints` / `inputs`

Implemented: `acceptQuote` projects SERVICE line items into the Sales Order as canonical `line_items`, and (best-effort) materializes a service fulfilment when `timeWindow.startAt` (or an explicit `serviceDate`) exists.

Important: `SalesOrderLineItem` GraphQL is still RENTAL/SALE only. For SERVICE, use canonical line items (`listLineItems` / `getLineItemById`) + fulfilments (`listFulfilments`).

### 5.5 Creating fulfilment from the Sales Order line item

Once a SERVICE Sales Order canonical line item exists, the seller can materialize a work item:
- Mutation: `createServiceFulfilmentFromLineItem({ lineItemId, serviceDate? })`
  - `serviceDate` is optional if `lineItem.timeWindow.startAt` is set.

Two UX modes:
- **Auto** (recommended): acceptance creates fulfilments immediately for one-time scheduled services (serviceDate from lineItem.timeWindow.startAt).
- **Manual**: show “Generate work” on the Sales Order page to call `createServiceFulfilmentFromLineItem`.

### 5.6 Seller “sees it in fulfilment”

The work queue is fulfilment-driven:
- Query: `listFulfilments(filter: { workspaceId, salesOrderType: SERVICE })`
- Render tasks from `fulfilment.tasks[]`
- Render “what/where” by fetching the canonical line item:
  - `getLineItemById(id: fulfilment.salesOrderLineItemId)`

### 5.7 Cross-line targeting (delivery/pickup services “for” a material line)

We support “this SERVICE line item is an add-on for that material line item” using **canonical line item targeting**:

- Canonical `LineItem.targetSelectors[]` supports `kind: line_item` with `targetLineItemIds[]`.
- This is how you model a delivery service that points at a rental/sale material line item (or any other line item).

**Terminology (avoid ambiguity)**

- `svc_delivery` = **Seller delivery** (seller-side work to move items to the buyer/jobsite).
- `svc_pickup` = **Seller pickup / return pickup** (seller-side work to retrieve items back to the seller’s custody).
- “Customer pickup” is *not* `svc_pickup` — it means **no seller logistics SERVICE line** for that leg (you can still capture customer instructions/intent on the material line item, but it is not seller work).

**Critical rule (scope-local IDs)**

The IDs inside `targetLineItemIds[]` are always scoped to the *current document*:

- In a **QUOTE_REVISION**, `targetLineItemIds[]` must reference **quote revision line item IDs** (`QuoteRevision.lineItems[].id`).
- In a **SALES_ORDER**, `targetLineItemIds[]` must reference **sales order canonical line item IDs** (`LineItem.id` where `documentRef.type=SALES_ORDER`).

Because Sales Order line item IDs are generated at acceptance time, the backend must translate these references.

**What’s implemented now**

During `acceptQuote`, the backend:

1) Creates Sales Order canonical line items from the accepted quote revision.
2) Builds a mapping:
   - `quoteRevisionLineItemId → salesOrderLineItemId`
3) Rewrites every SERVICE Sales Order line item’s `targetSelectors.kind=line_item` by remapping `targetLineItemIds[]` to Sales Order line item IDs.

This means the relationship survives acceptance and is usable for fulfilment/work views.

**Frontend contract**

To make this robust, the quote UI must treat quote revision line item IDs as stable:

- When you **update** a draft quote revision, always send each line item’s `id` back to the backend.
- When you create “derived add-ons” (e.g., Delivery), prefer explicitly setting IDs in the quote revision input so they do not churn between edits.

If you don’t preserve IDs, any `targetLineItemIds[]` links will break (because you’ll be pointing at line items that no longer exist after an edit).

**Recommended UX pattern (material fulfilment method + service add-ons)**

1) Ensure canonical logistics SERVICE products exist (once per workspace)
   - Call mutation `studioCatalogEnsureLogisticsServiceProducts({ workspaceId })`.
   - This creates (idempotently) two **catalog service products** in `/catalogs/default/products`:
     - `svc_delivery`
     - `svc_pickup`
   - These products are **system-provisioned** and are marked `origin: "system"` in their product files (do not infer system-ness from tags).
   - UX recommendation: show them in Products/Pricing pickers under a filterable “System / Logistics” section (default-collapsed), but still editable for `taskTemplates[]`.
   - Tenants then create their own **ServicePrice** records for these products (multiple prices per product is expected: “Standard Delivery”, “Heavy Haul Delivery”, etc).
   - Note: these are not “global shared products” yet — they are workspace-local copies provisioned from a shared template in the API. A true cross-workspace global catalog would require a separate backend feature (namespace + permissions + copy-on-write/override semantics).

2) Material line item (RENTAL/SALE): fulfilment choice as UI intent
   - Keep using `deliveryMethod/deliveryLocation/deliveryNotes` on the *material* line item for now as the UX selector:
     - `DELIVERY` → seller delivers
     - `PICKUP` → customer pickup (no seller logistics SERVICE line)
     - unset/null → “select later”
   - Treat this as *intent*; the real “work that must happen” is expressed via SERVICE add-on line items.

3) Derived service line items (SERVICE): the fulfilment work
   - Do **not** re-implement add-on creation logic in each surface (Quote, Sales Order, Storefront/Intake).
   - Instead, call the backend mutation `syncMaterialLogisticsAddOns` and let the API create/update/delete the add-on SERVICE line items for you.
   - What the backend does (idempotent):
     - Ensures `svc_delivery` / `svc_pickup` system products exist (`studioCatalogEnsureLogisticsServiceProducts`).
     - Creates/updates SERVICE line items that target the material line item:
       - `svc_delivery` (default `timeWindow.startAt = material.timeWindow.startAt`)
       - `svc_pickup` (default `timeWindow.startAt = material.timeWindow.endAt`)
     - Copies product `taskTemplates[]` → SERVICE line item `scopeTasks[]` (only when the line has no existing `scopeTasks[]`).
      - If a `priceId` is provided, derives `unitCode` from the selected ServicePrice (unitCode is not user-editable).
      - Supports **shared vs dedicated** logistics add-ons (“logistics groups”):
        - Dedicated: create/update a SERVICE add-on that targets exactly this material line item (`targetLineItemIds=[materialLineItemId]`).
        - Shared: provide `serviceLineItemId` (an existing `svc_delivery`/`svc_pickup` SERVICE line item in the same document) and the API will attach this material line item by adding its id to `targetLineItemIds[]`.
        - Disabling an add-on detaches this material from any matching logistics SERVICE line items; a shared SERVICE line item is only deleted when it has **zero** remaining targets.
        - Safety: when attaching to an existing shared SERVICE line item, the API will not override its existing `priceId` (it returns a warning if you attempt to).
        - Group semantics: a shared logistics SERVICE line item implies **one schedule + one placeRef** for the trip. If you attach an item whose time/place differs, the API returns a warning; the UI should either confirm explicitly or create a new group instead.
   - These are real contract lines (priced independently, accepted independently) and they materialize into fulfilments/work items.

Backend mutation:

```graphql
mutation SyncMaterialLogisticsAddOns($input: SyncMaterialLogisticsAddOnsInput!) {
  syncMaterialLogisticsAddOns(input: $input) {
    materialLineItemId
    deliveryLineItem { id }
    pickupLineItem { id }
    serviceAddOns { id }
    warnings
  }
}
```

Example inputs:

```json
{
  "materialLineItemId": "<material_line_item_id>",
  "delivery": { "enabled": true, "priceId": "<optional_service_price_id>" }
}
```

Attach to an existing (shared) delivery SERVICE line item:

```json
{
  "materialLineItemId": "<material_line_item_id>",
  "delivery": { "enabled": true, "serviceLineItemId": "<existing_delivery_service_line_item_id>" }
}
```

Recommended quote UX (minimal but explicit):
- On each material row:
  - `Delivery` selector: `None` | `New delivery group` | `Use existing delivery group…`
  - `Pickup (return)` selector: `None` | `New pickup group` | `Use existing pickup group…`
- When “Use existing … group” is selected, the picker lists existing `svc_delivery`/`svc_pickup` SERVICE line items in the same document (show: description, price name, target count, startAt/placeRef).
- If the API returns warnings (time/place mismatch, price mismatch, missing dates), show them inline and prompt for the correct action (create a new group vs proceed).

Implementation plan (MVP → robust):

Backend (MVP)
- Keep canonical logistics products seeded per workspace (`studioCatalogEnsureLogisticsServiceProducts`).
- Use `syncMaterialLogisticsAddOns` as the single backend primitive across Quote / Sales Order / Storefront (do not re-implement add-on creation in each UI surface).
- Support both modes using the same primitive:
  - Dedicated: `enabled=true` and omit `serviceLineItemId`.
  - Shared: `enabled=true` with `serviceLineItemId` pointing at an existing logistics SERVICE line item in the same document.
- Enforce/guard invariants with warnings (server does not guess):
  - Don’t override an existing shared service line’s `priceId` when attaching (warn instead).
  - Warn when attaching an item whose `placeRef` or expected `timeWindow.startAt` differs from the shared group.

Backend (implemented)
- Use `listLogisticsServiceGroups(filter)` to list “logistics groups” (logistics SERVICE line items) for a document:
  - Inputs: `workspaceId`, `documentRef`, optional `productId` (`svc_delivery` | `svc_pickup`)
  - Returns: a list of canonical `LineItem` records (SERVICE lines with `productRef.productId` in `svc_delivery`/`svc_pickup`)
  - Purpose: power the “Use existing delivery/pickup group…” picker without scanning all line items client-side.

```graphql
query ListLogisticsServiceGroups($filter: ListLogisticsServiceGroupsFilter!) {
  listLogisticsServiceGroups(filter: $filter) {
    id
    description
    productRef { productId }
    timeWindow { startAt }
    placeRef { kind id }
    pricingRef { priceId }
    targetSelectors { kind targetLineItemIds }
  }
}
```

- Add a “rename group” affordance (edit the SERVICE line item description) and, later, a real multi-stop route/stop model if you need multiple places per group.

Frontend (MVP)
- Material row UX:
  - `Delivery` and `Pickup (return)` selectors implement: none/new/existing group.
  - “New group” calls `syncMaterialLogisticsAddOns` with `enabled=true` (no `serviceLineItemId`).
  - “Use existing group” calls `syncMaterialLogisticsAddOns` with `enabled=true` + `serviceLineItemId=<chosen_group_id>`.
- Group UX:
  - Render logistics SERVICE lines as grouped rows (Delivery group / Pickup group) with target count + summary (price, startAt/placeRef).
  - Allow editing the SERVICE line (scope tasks, notes, schedule, placeRef) as the group-level truth.
- Warnings UX:
  - Surface backend warnings inline and require an explicit choice when grouping across time/place mismatches (“Proceed anyway” vs “Create new group”).
- Unit correctness:
  - For SERVICE line items, treat `unitCode` as derived from the selected ServicePrice (`pricingSpec.unitCode`) and do not let users pick arbitrary units.
- ID stability:
  - Preserve quote revision line item IDs across edits so `targetLineItemIds[]` remain valid until acceptance remaps them.

Frontend (next)
- Add “computed requirement envelope” panels for delivery/pickup SERVICE lines:
  - Call `computeServiceRequirementEnvelope(serviceLineItemId)` to show total/max weight and dimensional envelope derived from targets.
  - If missing attributes, provide a direct “open product editor to fill missing weight/length/width/height” path.

4) Execution steps (scope = tasks)
   - Store the operational checklist on the service **product** as `taskTemplates[]`.
   - Copy `taskTemplates[]` → SERVICE line item `scopeTasks[]` so the accepted contract scope is explicit and auditable.

**Important: do not put sequences on Price**

Rental/Sale prices remain “unit economics.” The fulfilment sequence is contract + execution:
- Contract: line items (+ targeting) + delivery method choice
- Execution: fulfilments + tasks

**Augmenting “delivery” without proliferating new products**

Keep `svc_delivery` / `svc_pickup` as the stable “what”. Variants like “heavy haul”, “flatbed”, “liftgate”, “oversize” should be expressed as:
- Price choice (different ServicePrice records for the same productRef)
- Line item tags/inputs/constraints (the “how / requirements”)

Today, the cleanest place for numeric capability requirements is SERVICE line item `inputs[]`, because it supports `contextTags[]`:
- payload requirement: `weight` input with `contextTags=["payload","rated"]` and `unitCode="LB"`
- deck length requirement: `length` input with `contextTags=["deck"]` and `unitCode="FT"`
- deck width requirement: `width` input with `contextTags=["deck"]` and `unitCode="IN"`

Use SERVICE line item `constraints[]` for boolean/typed requirements with strength:
- REQUIRED `TAG` constraints like `flatbed`, `lowboy`, `tilt_deck`

ATTRIBUTE constraints now support `contextTags[]`, so you can express “weight >= 40,000 LB with context [payload]” without creating blended keys like `payload_capacity`.

Example (SERVICE line item constraint):
```json
{
  "kind": "ATTRIBUTE",
  "strength": "REQUIRED",
  "data": {
    "attribute": {
      "attributeTypeId": "<global_weight_attribute_type_id>",
      "op": "GTE",
      "value": 40000,
      "unitCode": "LB",
      "contextTags": ["payload"]
    }
  }
}
```

**Computed requirement envelope (recommended)**

Delivery/pickup “requirements” should be computed from what the SERVICE line item targets (physics-first), not hand-authored into products/prices.

Backend query:
- `computeServiceRequirementEnvelope(serviceLineItemId: String!): ServiceRequirementEnvelope!`

What it does:
1) Reads the SERVICE canonical line item’s `targetSelectors[]` (`kind=line_item`)
2) Loads each target line item’s `productRef` from StudioFS (`/catalogs/default/products/<productId>.jsonc`)
3) Extracts transport-relevant physical attributes:
   - `weight` (prefers contexts like `shipping`, `gross`, `operating`)
   - `length/width/height` (prefers context `overall`)
4) Returns an aggregate envelope + `missingTargets[]` + `warnings[]`:
   - `totalWeight` (sum * quantity)
   - `maxItemWeight` (max)
   - `maxLength/maxWidth/maxHeight` (max)

Frontend usage:
- Render an “Auto-derived requirements” panel on delivery/pickup SERVICE lines.
- If `missingTargets[]` is non-empty, surface a precise fix path:
  - “Missing weight/length/width/height on product X” → open product editor to add the missing physical attributes (do not guess).
- Treat explicit overrides as higher precedence:
  - explicit SERVICE line item `constraints[]` / `inputs[]` win
  - computed envelope from targets next
  - product defaults last (if any)

**Quote revision example (SERVICE add-on targets RENTAL line item)**

```json
{
  "type": "RENTAL",
  "id": "rental_line_1",
  "description": "Dozer rental",
  "quantity": 1,
  "sellersPriceId": "<rental_price_id>",
  "pimCategoryId": "<optional>",
  "rentalStartDate": "2025-06-01T00:00:00Z",
  "rentalEndDate": "2025-06-05T00:00:00Z",
  "deliveryMethod": "DELIVERY",
  "deliveryLocation": "Jobsite A"
}
```

```json
{
  "type": "SERVICE",
  "id": "delivery_service_1",
  "description": "Delivery service",
  "quantity": 1,
  "unitCode": "unit:EA",
  "productRef": { "kind": "SERVICE_PRODUCT", "productId": "svc_delivery" },
  "sellersPriceId": "<service_price_id>",
  "timeWindow": { "startAt": "2025-06-01T08:00:00Z" },
  "targetSelectors": [
    { "kind": "LINE_ITEM", "targetLineItemIds": ["rental_line_1"] }
  ]
}
```

After acceptance, the backend remaps the SERVICE line item’s `targetLineItemIds[]` to Sales Order line item IDs (so the Sales Order delivery line now points at the Sales Order rental line).

---

## 6) Beta limitations + recommended follow-ups

### 6.1 Not yet supported (by backend)

- Per-task assignment (different assignees per task).
- Assigning a fulfilment to a business contact (Contact) in a first-class way.
- Efficient server-side filtering for service fulfilments (date windows, projectId/contactId) in the generic `listFulfilments` filter.
- SERVICE line items as first-class `SalesOrderLineItem` / `PurchaseOrderLineItem` GraphQL unions (use canonical `line_items` + fulfilments for now).
- Recurrence on contracted line items + occurrence ledger/horizon materialization.

### 6.2 Small backend improvements that would simplify the beta UI

- Add a `lineItem` field on `ServiceFulfilment` (or `FulfilmentBase`) that resolves the canonical `LineItem` by `salesOrderLineItemId`.
  - This removes N+1 `getLineItemById` calls and makes “what/where” trivial to render.
