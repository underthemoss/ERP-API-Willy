# Order Wrappers, Parties, and the Unified LineItem (Current vs Target)

This document explains how **Purchase Orders**, **Sales Orders**, and **Quotes/Quote Revisions** currently wrap line items, where the system is already aligned with the “LineItem is the canonical object” thesis, and what must change to reach a clean, extensible model across **sales / purchase / work** flows.

If you only remember one idea:

> **LineItem is the durable cross-document “demand claim”.**  
> Quote / Order / Work are wrappers that add *roles, lifecycle, and terms* around the same LineItem shape.

---

## 1) Thesis (first principles)

### 1.1 Canonical object: LineItem

LineItem is the system’s continuity primitive:

`LineItem = ProductRef × Quantity × Constraints × (Time, Place) × Optional(PricingSnapshot)`

- It is the **unit of demand** that survives transitions:
  - intake → RFQ/Quote → accepted quote → order(s) → fulfillment/work
- It is the stable place to attach:
  - required/preferred/excluded constraints
  - typed inputs (attributes + units)
  - target selectors (service acts-on links)
  - pricing references and acceptance snapshots

### 1.2 Wrappers are workflow stages + multi-party roles

Wrappers are not “where line items live”; wrappers define:

- **stage**: negotiate vs commit vs execute
- **parties**: buyer/seller roles (and who can see/modify)
- **terms**: validity window, approvals, signatures, status, numbering

---

## 2) Current backend reality (what exists today)

### 2.1 A unified LineItem storage schema exists

The backend already has a canonical store and service:

- `src/services/line_items/model.ts` defines `LineItemDoc` in Mongo collection `line_items`.
- `src/services/line_items/index.ts` enforces workspace permissions by `documentRef.type`.

Notably, `LineItemDocumentType` already includes `QUOTE_REVISION`, even though quoting does not fully use it yet.

### 2.2 Purchase Orders and Sales Orders are already “wrappers over LineItems”

**Purchase Order wrapper**

- Header document: `purchase_orders` (`src/services/purchase_orders/purchase-order-model.ts`)
- Line items: stored in `line_items` with `documentRef.type = 'PURCHASE_ORDER'`
  - Adapter mapping lives in `src/services/purchase_orders/index.ts`
  - Legacy “purchase_order_line_items” model file exists but is effectively legacy (`src/services/purchase_orders/purchase-order-line-items-model.ts`)

**Sales Order wrapper**

- Header document: `sales_orders` (`src/services/sales_orders/sales-order-model.ts`)
- Line items: stored in `line_items` with `documentRef.type = 'SALES_ORDER'`
  - Adapter mapping lives in `src/services/sales_orders/index.ts`

So on the “LineItem is canonical across document types” axis: **SO/PO are already aligned**.

### 2.3 Quotes are event-sourced and keep line items embedded (parallel universe)

Quotes and quote revisions are currently implemented as an event store:

- Quote header: `src/services/quoting/quotes-model/events-store.ts`
- Quote revision (includes embedded `lineItems[]`): `src/services/quoting/quote-revisions-model/events-store.ts`

Important detail: quote revision line items use UUIDs and are **regenerated on UPDATE**:

- Every time a revision updates its `lineItems`, the reducer generates **new UUIDs for all items**.
- That means quote revision line item identity is *not stable* across revisions/edits.

### 2.4 Accepting a quote “copies” quote revision line items into SO/PO line items

`src/graphql/schema/quoting.ts` (`acceptQuote`) currently:

1. Reads the current quote revision’s embedded `lineItems[]`
2. Creates a `SalesOrder` header in the seller workspace
3. Creates SO line items via `salesOrdersService.createSalesOrderLineItem(...)`
4. Optionally creates a `PurchaseOrder` header in the buyer workspace
5. Creates PO line items via `purchaseOrdersService.createPurchaseOrderLineItem(...)`

Those SO/PO line items are persisted as canonical `LineItemDoc` rows, and they store a trace field:

- `quote_revision_line_item_id` (mapped to `LineItem.quoteRevisionLineItemId`)

So the quote is a **precursor wrapper**, but it is not yet using the unified LineItem store itself.

### 2.5 Storefront “cart” (IntakeFormSubmission) is a buyer-authored demand wrapper

Storefront demand today is represented by intake forms:

- `IntakeForm` = seller-owned storefront configuration (optional pricebook, public sharing)
- `IntakeFormSubmission` = a buyer-authored “cart/checkout” wrapper (`DRAFT` → `SUBMITTED`)
- Submission line items now live in the canonical `line_items` store:
  - `documentRef.type = INTAKE_SUBMISSION`
  - `documentRef.id = <submissionId>`

First-principles authority rule:

- **Demand wrapper (buyer-authored)**: buyer edits line items while `DRAFT`; once `SUBMITTED`, the demand is immutable.
- **Offer wrapper (seller-authored)**: seller edits quote revisions while `DRAFT`; once `SENT`, the offer is immutable.

This keeps collaboration clean: the buyer expresses demand; the seller expresses the offered terms/prices; neither side silently edits the other’s authored document.

---

## 3) Is the PO wrapper “in line” with the quote wrapper pattern?

Depends which layer you mean:

### 3.1 LineItem canonicality: YES (PO aligns; Quote does not)

- PO/SO already treat `line_items` as source of truth.
- Quote revisions do not; they have an embedded line item schema.

### 3.2 Revision semantics: NO (Quote has revisioning; PO/SO do not)

- Quote revisioning is explicit (revision event store).
- PO/SO are simple headers with `status` and do not have a general revision model yet.

This is fine conceptually (negotiation needs revisioning more than commitment), but it becomes a problem when the quote line items cannot act as the shared continuity object.

### 3.3 Parties/roles: partially, but inconsistent

- Quotes explicitly model buyer/seller workspaces + contacts.
- SO/PO headers are asymmetric (`buyer_id` on SO, `seller_id` on PO) and do not carry a consistent “parties” object.

This matters because the user’s thesis is that:

> Buyers and sellers are **roles on a document**, not separate document types.

Today, that role model is not shared across quote/SO/PO.

---

## 4) The real mismatches vs the extensible model you want

### 4.1 Two line item systems exist (embedded QuoteRevision line items vs unified LineItemDoc)

This is the biggest divergence.

It forces:

- mapping/translation code (quote → SO/PO)
- different validation/typing rules (quote line item schema vs line_items schema)
- different identity semantics (UUIDs regenerated vs generated IDs in `line_items`)

If LineItem is the continuity object across the lifecycle, there should be **one** canonical place where a line item lives.

### 4.2 Quote revision line item identity is not stable across edits

Regenerating IDs on every update breaks:

- diffing a revision (“what changed?”)
- referencing a line item across time (“the thing we negotiated about”)
- a clean lineage graph (RFQ line → quote line → order line)

For long-term integrity, “line item identity” needs a stable root.

### 4.3 Parties are not modeled consistently across wrappers

Examples of the inconsistency surface:

- Quote: explicit `sellerWorkspaceId`, `buyerWorkspaceId?`, and both-side contacts.
- SalesOrder header: `workspace_id` + `buyer_id` only.
- PurchaseOrder header: `workspace_id` + `seller_id` only.
- In `acceptQuote`, `PurchaseOrder.seller_id` is sometimes populated with a **workspace id** fallback when a seller contact is missing, making the field semantically ambiguous.

This makes it harder to:

- reason about who is responsible for what (buyer vs seller obligations)
- implement multi-tenant visibility cleanly
- generalize to other wrappers (work orders, internal transfers, etc.)

### 4.4 Downstream wrappers are missing service line item coverage

Quote revisions support `SERVICE` line items with target selectors; SO/PO creation currently only supports RENTAL (TODO in `acceptQuote`).

Even if you keep SO/PO as projections, the model wants a single line item shape across all types.

---

## 5) Target model (minimal, first-principled, extensible)

### 5.1 One LineItem store across *all* wrappers (including QuoteRevision)

Use the existing `line_items` collection for quote revisions too.

Canonical grouping mechanism:

- `LineItem.documentRef = { type, id, revisionId? }`

Recommended mapping:

- Quote revision line items:
  - `documentRef.type = 'QUOTE_REVISION'`
  - `documentRef.id = <quoteId>`
  - `documentRef.revisionId = <quoteRevisionId>`

Now a “quote revision” is just:

- a wrapper row + metadata + revision history
- plus a *set* of `LineItemDoc` rows that can be queried uniformly

### 5.2 Define party roles once and reuse everywhere

Introduce a single reusable concept: `DocumentParties`.

Minimal shape:

```
DocumentParty {
  role: BUYER | SELLER
  workspaceId?: string   # present when counterparty is on-platform
  contactId?: string     # always present when you can email/call someone
}
```

Apply it consistently to Quote, SalesOrder, PurchaseOrder (and later WorkOrder):

- Quotes already contain most of this data (just normalize shape).
- SO/PO should carry the same parties object even if you keep separate headers.

### 5.3 Treat PO/SO as role-based projections, but keep the LineItem lineage explicit

You can keep the current “two wrapper docs” approach (SO in seller workspace, PO in buyer workspace) to avoid multi-tenant complexity.

To preserve integrity, add a deterministic lineage rule:

- Order line items must reference their source negotiated line item:
  - keep `quoteRevisionLineItemId` (or rename later to a generic `sourceLineItemId`)
- Order headers must reference the accepted revision:
  - `quote_id`, `quote_revision_id` already exist on SO/PO headers

This yields a clean graph:

`QuoteRevision(LineItems) --accept--> SalesOrder(LineItems) + PurchaseOrder(LineItems)`

### 5.4 Snapshot semantics (where to freeze)

To keep historic documents stable:

- Quote revisions can recompute pricing live while in DRAFT.
- Once SENT/ACCEPTED, freeze snapshots on line items:
  - `pricingSpecSnapshot`, `rateInCentsSnapshot`, `subtotalInCents`
  - plus a version marker (price.updatedAt, product ETag) if available

The line item is the right home for these snapshots because it survives across wrappers.

### 5.5 “Priced product” on a LineItem (binding + snapshot)

A line item becomes “priced” when it binds a product identity to either:

- a persisted `Price` (`pricingRef.priceId`), or
- an explicit pricing snapshot (ad-hoc price) stored directly on the line item.

Normative rule:
- **Commitment wrappers must carry snapshots.** If a quote revision is accepted into an order, the SO/PO line items must copy the quote revision line item’s `pricingRef` + snapshot fields so totals cannot drift later.

This keeps pricing semantics consistent across wrappers:
- the wrapper decides *when you can change things*
- the line item decides *what the thing is* and *what price was agreed*

### 5.6 Line item state vs wrapper state (who can edit, when)

The wrapper owns lifecycle/mutability; line items are the continuity objects.

| Wrapper (intent) | `documentRef.type` | Authority | When line items are editable | When pricing is required | Output |
|---|---|---|---|---|---|
| Buyer-authored demand (“cart” / submission) | `INTAKE_SUBMISSION` | Buyer | `DRAFT` only | Optional (storefront may pre-price) | Demand line items |
| Seller-authored offer (negotiation) | `QUOTE_REVISION` | Seller | `DRAFT` only (new revision after `SENT`) | Required before `SENT` | Offer line items + snapshots |
| Commitment (execution planning) | `SALES_ORDER` / `PURCHASE_ORDER` | Seller / Buyer | Prefer “change order” workflow (don’t silently edit accepted terms) | Always (copied from accepted quote) | Order line items with frozen snapshots |

Lineage is preserved via `sourceLineItemId`:
`demand line item → offer line item → order line item`

---

## 6) Practical “diff” (current vs target)

### Current

- QuoteRevision line items live **inside** `quote_revisions` docs (event store).
- SO/PO line items live in `line_items` and are adapted to legacy shapes.
- Party modeling is wrapper-specific and asymmetric.
- Quote line item IDs are regenerated on update.

### Target

- QuoteRevision line items live in `line_items` (same as SO/PO).
- QuoteRevision wrapper references a set of line item IDs (or is derived by `documentRef` query).
- Party modeling is consistent (`DocumentParties`) across quote/SO/PO/work.
- Line item identity has a stable root; revisions preserve continuity and lineage.

---

## 7) Implementation plan (extensibility-first; no backfills required)

We are not optimizing for data migration; we are optimizing for a clean, extensible model for **all new work**.
Old documents can be supported via read-fallbacks, but we do not need to backfill.

### Phase 0 — Establish the canonical LineItem API (shared by all wrappers)

Definition of done:
- One GraphQL/REST surface that creates/updates/reads canonical `LineItemDoc` rows.
- Wrapper-specific “line item” schemas become adapters/legacy-only.

Work:
- Add a first-class GraphQL `LineItem` type + `listLineItems(documentRef...)` query + CRUD mutations.
- Standardize lineage fields:
  - Add `sourceLineItemId?: string` (generic) on `LineItemDoc` (keep `quoteRevisionLineItemId`/`intakeFormSubmissionLineItemId` for compatibility).
- Standardize snapshot semantics (see Phase 4).

### Phase 1 — Purchase Order wrapper uses canonical LineItems end-to-end

Note: PO already stores its line items in `line_items` today; this phase makes it *the* reference implementation for wrapper integration.

Definition of done:
- GraphQL exposes `PurchaseOrder.lineItems: [LineItem!]!` sourced from `line_items` by `documentRef`.
- FE can create/update PO line items using canonical LineItem inputs (not `POLineItem*` legacy shapes).

Work:
- Add `purchaseOrder.lineItems` resolver that calls `lineItemsService.listLineItemsByDocumentRef(...)`.
- Add PO line item mutations that accept canonical inputs:
  - create: requires `{ workspaceId, documentRef{type:PURCHASE_ORDER,id:<poId>}, type, quantity, productRef?, ... }`
  - update: patches canonical fields directly (constraints, inputs, timeWindow, placeRef, pricingRef, snapshots)
- Keep existing PO legacy line item fields as deprecated adapters until the UI migrates.

### Phase 2 — Quote revisions move line items to canonical LineItems

This is the biggest conceptual unlock: QuoteRevision becomes a negotiation wrapper; LineItem becomes the continuity object.

Definition of done:
- `QuoteRevision.lineItems` is sourced from `line_items` (`documentRef.type='QUOTE_REVISION'`, `revisionId=<revisionId>`).
- Creating/updating a quote revision creates/updates canonical line items (and stops regenerating IDs).
- `acceptQuote` reads canonical quote revision line items and writes SO/PO projections from them.

Work:
- Stop embedding revision line items as the source of truth; for new revisions:
  - create quote revision wrapper doc/event
  - create canonical `LineItemDoc` rows keyed by `documentRef { type:'QUOTE_REVISION', id:<quoteId>, revisionId:<revisionId> }`
- Fix quote line item identity:
  - preserve IDs for items that persist across draft edits
  - mint new IDs only for newly-added items
- Optional (recommended) read compatibility:
  - if a revision has no canonical line items, fall back to embedded `revision.lineItems` for display-only.

### Phase 3 — Sales Order wrapper uses canonical LineItems end-to-end

Note: SO already stores its line items in `line_items` today; this phase aligns the API shape and completes the quote→SO projection story.

Definition of done:
- GraphQL exposes `SalesOrder.lineItems: [LineItem!]!` sourced from `line_items`.
- FE can create/update SO line items using canonical inputs (not legacy `SalesOrderLineItemDoc` shapes).
- `acceptQuote` creates SO line items with `sourceLineItemId` pointing at the accepted quote revision line items.

Work:
- Add `salesOrder.lineItems` resolver to list canonical line items.
- Add SO line item CRUD mutations on canonical line items.
- Expand quote acceptance projection to include SALE + SERVICE line items (not just RENTAL).

### Phase 4 — Snapshots + lineage rules (applies to all wrappers)

Definition of done:
- “Negotiation can change; commitment is frozen” is enforced consistently.

Rules:
- Draft wrappers (e.g., draft quote revision) may recompute totals.
- Committed wrappers (e.g., accepted quote revision, submitted PO/SO) must freeze pricing snapshots on each line item:
  - `pricingSpecSnapshot`, `rateInCentsSnapshot`, `subtotalInCents`
  - plus an optional version marker (price.updatedAt, product ETag) when available
- Any projection (quote → SO/PO) must preserve lineage:
  - `LineItem.sourceLineItemId` points to the upstream negotiated line item

This gets you to the first-principled model without introducing a new “mega-order” abstraction prematurely.
