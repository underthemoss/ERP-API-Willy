# Unified Line Item Model

This doc defines a single, extensible LineItem model intended to replace the
legacy Sales Order and Purchase Order line item collections. It provides:
- a canonical storage schema
- GraphQL types for a single LineItem entity
- a minimal migration path tied to existing services

The model is rooted in the thesis:
`LineItem = ProductRef × Quantity × Constraints × (Time, Place)`

See also:
- `docs/order-wrappers-line-items-and-parties.md` (how quote/SO/PO wrap line items today, and what needs to align)

## Goals

- One LineItem shape across quote/order/work-order flows.
- Pricing optional by type (WORK/TRANSFER can be unpriced).
- Service execution is handled by tasks/fulfilment, not by mutating line items.
- Backward compatibility can be provided via adapter resolvers.

## Contract Tightening (Recommended Now)

- Product identity converges on Catalog Product IDs.
  - Add `CATALOG_PRODUCT` to `LineItemProductKind`.
  - Emit it for new Studio-generated line items; keep `PIM_*` only for backfill/adapters.
- Replace `placeRef: string` with a typed reference to avoid a junk drawer.
- Keep constraints as an array, but make `data` a typed shape per kind.
- Decide on decimal safety for quantity; if you keep `Float`, treat it as display-only.
- Define when pricing totals are authoritative vs computed, and what invalidates them.
- Enforce consistent naming for target selectors (pick lowercase or uppercase once).
- Add the obvious indexes up front for list-by-document and incremental sync.

## Canonical Storage Schema (Mongo)

```
LineItemDoc {
  _id: string
  workspaceId: string
  documentRef: {
    type: QUOTE_REVISION | SALES_ORDER | PURCHASE_ORDER | WORK_ORDER | INTAKE_SUBMISSION
    id: string
    revisionId?: string | null
  }

  type: RENTAL | SALE | SERVICE | WORK | TRANSFER
  description: string
  quantity: string # decimal-encoded
  unitCode?: string | null

  productRef?: {
    kind: CATALOG_PRODUCT | MATERIAL_PRODUCT | SERVICE_PRODUCT | ASSEMBLY_PRODUCT | PIM_CATEGORY | PIM_PRODUCT
    productId: string
  } | null

  timeWindow?: { startAt?: Date | null; endAt?: Date | null } | null
  placeRef?: { kind: JOBSITE | BRANCH | YARD | ADDRESS | GEOFENCE | OTHER; id: string } | null

  constraints?: Array<{
    kind: TAG | ATTRIBUTE | BRAND | SCHEDULE | LOCATION | OTHER
    strength: REQUIRED | PREFERRED | EXCLUDED
    data: <typed per kind>
  }> | null

  pricingRef?: {
    priceId?: string | null
    priceBookId?: string | null
    priceType?: RENTAL | SALE | SERVICE | WORK | TRANSFER | null
  } | null

  subtotalInCents?: number | null
  delivery?: { method?: PICKUP | DELIVERY | null; location?: string | null; notes?: string | null } | null
  deliveryChargeInCents?: number | null

  notes?: string | null
  targetSelectors?: Array<
    | { kind: tags; tagIds: string[] }
    | { kind: product; targetProductId: string }
    | { kind: line_item; targetLineItemIds: string[] }
  > | null

  intakeFormSubmissionLineItemId?: string | null
  quoteRevisionLineItemId?: string | null

  status?: DRAFT | CONFIRMED | SUBMITTED | null
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
  deletedAt?: Date | null
}
```

Notes:
- `status` is legacy-friendly and optional; it is not part of the atom.
- `deliveryChargeInCents` is included to support existing pricing behavior.
- `productRef` is optional to allow legacy PIM IDs during migration.
- `placeRef` should be typed (see PlaceRef section) to avoid string parsing downstream.
- `constraints.data` remains JSON for storage, but should be a typed shape per `kind`.

## GraphQL Types (Draft)

```
enum LineItemType { RENTAL SALE SERVICE WORK TRANSFER }
enum LineItemDocumentType { QUOTE_REVISION SALES_ORDER PURCHASE_ORDER WORK_ORDER INTAKE_SUBMISSION }
enum LineItemProductKind { CATALOG_PRODUCT MATERIAL_PRODUCT SERVICE_PRODUCT ASSEMBLY_PRODUCT PIM_CATEGORY PIM_PRODUCT }
enum LineItemConstraintStrength { REQUIRED PREFERRED EXCLUDED }
enum LineItemConstraintKind { TAG ATTRIBUTE BRAND SCHEDULE LOCATION OTHER }
enum LineItemConstraintAttributeOp { EQ NEQ IN NOT_IN GT GTE LT LTE }
enum LineItemDeliveryMethod { PICKUP DELIVERY }
enum LineItemTargetSelectorKind { tags product line_item }
enum LineItemState { PROPOSED PLANNED IN_PROGRESS COMPLETED CANCELLED }
enum LineItemPlaceKind { JOBSITE BRANCH YARD ADDRESS GEOFENCE OTHER }

type LineItemDocumentRef { type: LineItemDocumentType!, id: ID!, revisionId: ID }
input LineItemDocumentRefInput { type: LineItemDocumentType!, id: ID!, revisionId: ID }

type LineItemProductRef { kind: LineItemProductKind!, productId: ID! }
input LineItemProductRefInput { kind: LineItemProductKind!, productId: ID! }

type LineItemTimeWindow { startAt: DateTime, endAt: DateTime }
input LineItemTimeWindowInput { startAt: DateTime, endAt: DateTime }

type LineItemPlaceRef { kind: LineItemPlaceKind!, id: ID! }
input LineItemPlaceRefInput { kind: LineItemPlaceKind!, id: ID! }

type LineItemConstraintTag { tagIds: [ID!]! }
input LineItemConstraintTagInput { tagIds: [ID!]! }

type LineItemConstraintAttribute {
  attributeTypeId: ID!
  op: LineItemConstraintAttributeOp!
  value: JSONObject!
  unitCode: String
}
input LineItemConstraintAttributeInput {
  attributeTypeId: ID!
  op: LineItemConstraintAttributeOp!
  value: JSONObject!
  unitCode: String
}

type LineItemConstraintBrand { brandId: ID, manufacturerId: ID }
input LineItemConstraintBrandInput { brandId: ID, manufacturerId: ID }

type LineItemConstraintSchedule { startAt: DateTime, endAt: DateTime }
input LineItemConstraintScheduleInput { startAt: DateTime, endAt: DateTime }

type LineItemConstraintLocation { placeRef: LineItemPlaceRef! }
input LineItemConstraintLocationInput { placeRef: LineItemPlaceRefInput! }

type LineItemConstraintOther { note: String! }
input LineItemConstraintOtherInput { note: String! }

type LineItemConstraintData {
  tag: LineItemConstraintTag
  attribute: LineItemConstraintAttribute
  brand: LineItemConstraintBrand
  schedule: LineItemConstraintSchedule
  location: LineItemConstraintLocation
  other: LineItemConstraintOther
}
input LineItemConstraintDataInput {
  tag: LineItemConstraintTagInput
  attribute: LineItemConstraintAttributeInput
  brand: LineItemConstraintBrandInput
  schedule: LineItemConstraintScheduleInput
  location: LineItemConstraintLocationInput
  other: LineItemConstraintOtherInput
}

type LineItemConstraint { kind: LineItemConstraintKind!, strength: LineItemConstraintStrength!, data: LineItemConstraintData }
input LineItemConstraintInput { kind: LineItemConstraintKind!, strength: LineItemConstraintStrength!, data: LineItemConstraintDataInput! }

type LineItemPricingRef { priceId: ID, priceBookId: ID, priceType: LineItemType }
input LineItemPricingRefInput { priceId: ID, priceBookId: ID, priceType: LineItemType }

type LineItemDelivery { method: LineItemDeliveryMethod, location: String, notes: String }
input LineItemDeliveryInput { method: LineItemDeliveryMethod, location: String, notes: String }

type LineItemTargetSelector {
  kind: LineItemTargetSelectorKind!
  tagIds: [ID!]
  targetProductId: ID
  targetLineItemIds: [ID!]
}
input LineItemTargetSelectorInput {
  kind: LineItemTargetSelectorKind!
  tagIds: [ID!]
  targetProductId: ID
  targetLineItemIds: [ID!]
}

input LineItemInput {
  workspaceId: ID!
  documentRef: LineItemDocumentRefInput!
  type: LineItemType!
  description: String!
  quantity: String!
  unitCode: String
  productRef: LineItemProductRefInput
  timeWindow: LineItemTimeWindowInput
  placeRef: LineItemPlaceRefInput
  constraints: [LineItemConstraintInput!]
  pricingRef: LineItemPricingRefInput
  subtotalInCents: Int
  delivery: LineItemDeliveryInput
  deliveryChargeInCents: Int
  notes: String
  targetSelectors: [LineItemTargetSelectorInput!]
}
type LineItem {
  id: ID!
  workspaceId: ID!
  documentRef: LineItemDocumentRef!
  type: LineItemType!
  description: String!
  quantity: String!
  unitCode: String
  productRef: LineItemProductRef
  timeWindow: LineItemTimeWindow
  placeRef: LineItemPlaceRef
  constraints: [LineItemConstraint!]
  pricingRef: LineItemPricingRef
  subtotalInCents: Int
  delivery: LineItemDelivery
  deliveryChargeInCents: Int
  notes: String
  targetSelectors: [LineItemTargetSelector!]
  state: LineItemState! # computed from document + fulfilment/tasks
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

## Constraint Data Shapes (Recommended)

Store `data` as JSON, but treat it as a discriminated union by `kind`:

- `TAG`: `{ tagIds: string[] }`
- `ATTRIBUTE`: `{ attributeTypeId: string; op: EQ|NEQ|IN|NOT_IN|GT|GTE|LT|LTE; value: string|number|boolean; unitCode?: string }`
- `BRAND`: `{ brandId?: string; manufacturerId?: string }`
- `SCHEDULE`: `{ startAt?: Date; endAt?: Date }`
- `LOCATION`: `{ placeRef: { kind: LineItemPlaceKind; id: string } }`
- `OTHER`: `{ note: string }`

GraphQL can enforce this with per-kind input types; storage can remain JSON.

## Quantity Semantics

If you expect fractional quantities or precision-sensitive totals, prefer:
- `quantity: String` (decimal encoded) + `unitCode`, or
- `quantity: { value: DecimalString, unitCode }`.

If you keep `Float`, treat it as a display value and compute totals elsewhere.

## Pricing Semantics

Define when `subtotalInCents` and `deliveryChargeInCents` are authoritative:
- Quote revisions: computed from pricing/quantity/time window.
- Accepted quotes / orders: snapshot totals at acceptance and do not mutate.
- Any change to `quantity`, `pricingRef`, or `timeWindow` invalidates computed totals.

### Pricing Snapshots (required for acceptance)

Goal: prevent retroactive drift when prices, price books, catalog products, or vocabulary change.

Recommended behavior:
- Draft documents (e.g., quote revisions in DRAFT) may recompute “live”.
- Accepted documents (accepted quote revision → SO/PO) must freeze a pricing snapshot.

Suggested snapshot payload (illustrative; keep it minimal but audit-safe):
- **Resolution snapshot** (what was used to compute totals)
  - `pricingRef`: `priceId`, `priceBookId`, `priceType`
  - `catalogRef`: `{ kind, id }` (when prices reference catalog products)
  - `pricingSpecSnapshot` / `rateInCentsSnapshot` (typed; esp. SERVICE UNIT/TIME)
  - rental optimizer inputs (e.g., start/end, selected bands) when relevant
- **Version markers** (what revision of upstream entities was referenced)
  - `priceUpdatedAt` or a monotonically increasing `priceVersion`
  - catalog product version stamp (e.g., StudioFS `etag`/`revision` for `/catalogs/<slug>/products/<id>.jsonc`)
- **Computed totals**
  - `subtotalInCents`, discounts, fees (and delivery totals if applicable)
  - `resolvedAt`, `resolvedBy`

Implementation note:
- Quote revision line items already store `pricingSpecSnapshot` and `rateInCentsSnapshot`
  (see `src/graphql/schema/quoting.ts` and `src/services/quoting/quote-revisions-model/events-store.ts`).

## Priced Product Binding (how a LineItem becomes “priced”)

In this thesis, a “priced product” is not a separate entity. It is a **LineItem**
that binds a **ProductRef** to either a **PriceRef** or an **ad-hoc pricing snapshot**.

### Minimal fields

Always:
- `productRef`: what the buyer/seller is talking about (prefer catalog products for new work).
- `quantity` + `unitCode?` + `timeWindow?`: the demand parameters.

Priced via a stored Price:
- `pricingRef.priceId` (and optionally `pricingRef.priceBookId`)
- `pricingSpecSnapshot` (esp. SERVICE)
- `rateInCentsSnapshot` (SERVICE + SALE)
- `subtotalInCents` (computed)

Priced ad-hoc (no saved Price record):
- `pricingRef = null`
- `pricingSpecSnapshot` + `rateInCentsSnapshot` (or RENTAL rate table snapshot)
- `subtotalInCents` (computed)
- `customPriceName` (optional label like “field quote” / “promo”)

### Type-specific invariants (non-negotiable)

- `SERVICE` line items:
  - require `unitCode`
  - require `pricingSpecSnapshot.kind in {UNIT,TIME}` and `unitCode` must match the snapshot
- `RENTAL` line items:
  - require `timeWindow.startAt` + `timeWindow.endAt`
  - require `pricingSpecSnapshot.kind = RENTAL_RATE_TABLE` when priced
- `SALE` line items:
  - `rateInCentsSnapshot` is the unit cost; `subtotalInCents = rate * quantity`

### Quote → Order projection (where snapshots must be frozen)

Negotiation and commitment have different rules:

- Quote revisions (`QUOTE_REVISION`) may re-price line items while in `DRAFT`.
- Once a quote revision is `SENT` (and/or accepted), pricing must be frozen:
  - Quote revision line items carry the snapshot fields.
  - When projected into orders, the order line items copy the snapshot fields.

Lineage is preserved with `sourceLineItemId`:
- demand line item (intake submission/RFQ) → offer line item (quote revision) → order line item (SO/PO)

## Naming Consistency

Pick one casing for `LineItemTargetSelectorKind` (lowercase or uppercase) and
enforce it in storage, GraphQL, and tool schemas to prevent drift.

## Indexing (Required)

- `(workspaceId, documentRef.type, documentRef.id, deletedAt)`
- `(workspaceId, updatedAt)`
- `_id` (default)

## Studio Integration Path

Studio agent writes curated `catalogs/<slug>/catalog.jsonc` and the backend
imports into Catalog Products. New line items reference `CATALOG_PRODUCT`
to keep the atom clean and avoid leaking PIM IDs into agent workflows.

## State Derivation (Simple)

State is derived, not stored:
- Proposed: quote revision is DRAFT or SENT.
- Planned: accepted/order exists, no execution yet.
- In Progress: fulfilment/workflow or tasks indicate active execution.
- Completed: fulfilment/workflow indicates done (or tasks completed).

This keeps the state model simple and avoids a bespoke line-item state machine.

## Minimal Migration Checklist

1) Storage + service:
   - Add `line_items` collection and LineItems service/model.
   - Provide `listByDocumentRef`, `batchGetById`, `create`, `update`, `softDelete`.

2) GraphQL:
   - Add LineItem types + queries/mutations.
   - Optional: add a `state` resolver using document/fulfilment lookups.

3) Sales orders:
   - Replace `sales_order_line_items` usage with LineItems.
   - Map old fields (`so_pim_id`, `so_quantity`, `delivery_date`) to canonical fields.
   - Keep legacy GraphQL type names via adapter resolvers if needed.

4) Purchase orders:
   - Replace `purchase_order_line_items` usage with LineItems.
   - Map old fields (`po_pim_id`, `po_quantity`, `delivery_date`) to canonical fields.

5) Fulfilment:
   - Use the unified line item id as the binding key.
   - Keep existing `salesOrderLineItemId` fields for now, but treat them as lineItemId.

6) Backfill:
   - Add a migration script to copy existing SO/PO line items into `line_items`.
   - Map `so_pim_id/po_pim_id` to `productRef` (PIM_*), `delivery_date/off_rent_date` to `timeWindow`.
   - Script: `scripts/backfill-line-items.ts`

7) Deprecate legacy:
   - Keep legacy GraphQL unions for compatibility, backed by the new line item store.
   - Mark old models/collections as deprecated in code comments and docs.
