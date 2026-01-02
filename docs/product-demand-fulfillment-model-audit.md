# Product Demand/Fulfillment Model Audit

This document maps the current data model to the thesis primitives and
identifies what stays, what changes, and what is missing. It is intended to be
updated progressively as we execute the roadmap.

Last updated: 2025-12-26

---

## Scope (Current System Surface)

Key modules reviewed:
- Quotes + quote revisions: `src/services/quoting/*`
- Sales orders + line items: `src/services/sales_orders/*`
- Purchase orders + line items: `src/services/purchase_orders/*`
- Fulfilment (event store + service): `src/services/fulfilment/*`
- Inventory (event store + reservations): `src/services/inventory/*`
- Pricing (price books + prices): `src/services/prices/*`
- PIM catalog (products + categories): `src/services/pim_products/*`, `src/services/pim_categories/*`
- Resource map tags (location/business unit/role): `src/services/resource_map/*`
- Contacts (people + business): `src/services/contacts/*`
- Legacy transactions + tasks: `src/services/transactions/*`, `src/graphql/schema/erp-types.ts`

---

## Thesis Primitive Mapping (Current Model -> Gaps)

### 1) Product (Catalog Definition)

Current:
- PIM categories/products are the only formal catalog (`pim_products`, `pim_categories`).
- Prices are tied to PIM categories/products (`prices`).
- No native ServiceProduct/MaterialProduct/AssemblyProduct catalog layer.
- Studio catalog curation is file-based (StudioFS) with JSON schemas for products, lists, and compiled indexes plus compile/preview outputs.

Gaps:
- No service product model; service taxonomy/activity tags are global-only today.
- No material attributes model (physics + brand) beyond PIM data.
- No assemblies or BOM documents.
- Service product targets (object-of-action) are not yet mapped to fulfillment entities.

Keep / Modify / Replace:
- Keep PIM as a source of material product data.
- Add explicit ServiceProduct, MaterialProduct, AssemblyProduct models.
- Add catalog_ref in prices to decouple pricing from PIM-only.
- Brand attributes must be typed via GlobalAttributeType.kind=BRAND (no key/value).

---

### 2) Line Item (Demand / Contract Envelope)

Current:
- Quote revisions include line items of types SERVICE/RENTAL/SALE with
  `sellersPriceId`, quantity, delivery fields (`quote-revisions-model`).
- Quote line items now accept `productRef`, `unitCode`, `timeWindow`,
  `placeRef`, `constraints`, `pricingRef`, `notes`, and service
  `targetSelectors` (see `docs/quote.md`).
- Sales orders line items: RENTAL/SALE only (`sales-order-line-items-model.ts`).
- Purchase order line items: RENTAL/SALE only (`purchase-order-line-items-model.ts`).

Gaps:
- No shared line item shape across quote/SO/PO (SO/PO still PIM-centric).
- Service target selectors are not yet used in SO/PO/fulfillment.
- Pricing still uses `sellersPriceId`; `pricingRef` is not yet first-class.

Keep / Modify / Replace:
- Keep quote revisions as the main demand expression.
- Expand SO/PO line items to accept product_ref + constraints.
- Use service target selectors to drive fulfillment orchestration.
- Derive SO/PO from accepted quote revision for interoperability.
- See `docs/quote.md` for the target QuoteLineItem shape and service-target rules.

---

### 3) Resource (Supply)

Current:
- Inventory is the material resource pool (`inventory/model.ts`).
- Inventory uses PIM category/product and resource map tags.
- No explicit service resource model (people/crews/capabilities).

Gaps:
- No unified resource model using tags + normalized attributes.
- Service capacity is implicit (contacts), not modeled as a resource pool.

Keep / Modify / Replace:
- Keep inventory as material resource baseline.
- Introduce service resource concept (people + tags + availability).
- Map resource attributes to global tag/attribute system.

---

### 4) Fulfillment Allocation (Matching + Conformance)

Current:
- Fulfilment is an event-store entity linked to sales order line items.
- Rental fulfilments can reserve/assign inventory.
- Fulfilments store PIM category/product and price data for filtering.

Gaps:
- No conformance evaluator (REQUIRED vs PREFERRED matching).
- Fulfilment is tightly coupled to sales order line items (not general).

Keep / Modify / Replace:
- Keep fulfilment model as the operational allocation backbone.
- Add conformance evaluation and constraint matching logic.
- Expand allocation to target line items or tasks (not only SO line items).

---

### 5) Task / Execution Plan

Current:
- Fulfilment has workflow columns and assignee fields.
- A legacy transactions model includes tasks but is not central.

Gaps:
- No explicit task plan tied to a line item envelope.
- No enforcement of “plan can change, contract cannot”.

Keep / Modify / Replace:
- Keep fulfilment workflow fields if useful.
- Introduce task plan model for services.
- Enforce plan vs envelope boundary checks.

---

### 6) Pricing (Separate from Product)

Current:
- Price books and prices exist as separate entities.
- Prices are typed RENTAL or SALE and tied to PIM category/product.
- Quote line items reference sellersPriceId and derive price data.

Gaps:
- No catalog_ref for service/material/assembly pricing.
- No acceptance snapshot of resolved price.

Keep / Modify / Replace:
- Keep price books + resolution logic.
- Add catalog_ref and acceptance snapshots.
- Extend pricing kinds only when needed.

---

### 7) Parties / Roles (Buyer vs Seller)

Current:
- Quotes store explicit seller/buyer workspace and contact IDs.
- Sales order uses `buyer_id` only; purchase order uses `seller_id` only.
- Party semantics are inconsistent across documents.

Gaps:
- No shared DocumentParty model.
- Constraint origin (BUYER vs SELLER) is not enforced.

Keep / Modify / Replace:
- Add DocumentParty invariants early.
- Align buyer/seller roles across quote/SO/PO.

---

### 8) Tags and Attributes (Global Vocabulary)

Current:
- Resource Map tags: LOCATION, BUSINESS_UNIT, ROLE.
- PIM categories provide hierarchical product grouping.
- Global attribute library exists (types/values/units) in a global DB.
- Global tag library exists (single tag pool + governance) in a global DB.
- Taxonomy/activity/context are rendered views derived from tag usage patterns
  (plus optional curated relations).
- Attribute ingestion supports deterministic decomposition of blended names into atomic types + context tags.

Gaps:
- Curation workflows are not implemented (approve, merge, deprecate).
- Global tags/attributes are not yet bound to products/resources/line items.

Keep / Modify / Replace:
- Keep resource_map for location/BU/role tagging.
- Use global tag/attribute registries as the canonical vocabulary.

---

## Key Gaps vs Thesis Invariants

1) Contract envelope is not explicit (no constraint schema).
2) Party semantics are inconsistent across documents.
3) No snapshot semantics for BOM/prices at acceptance.
4) Global tags/attributes exist but are not yet wired into products/resources/line items.
5) Fulfillment matching lacks conformance scoring.

---

## Recommended Near-Term Changes (Minimal Deltas)

- Introduce DocumentParty model and align buyer/seller roles.
- Add catalog_ref + constraint envelope to quote line items.
- Bind global tags/attributes to products/resources/line items.
- Add price snapshot at acceptance.
- Add conformance evaluator in fulfilment flow.

---

## Progress Tracking

This audit links directly to `docs/product-demand-fulfillment-roadmap.md`.
As phases are implemented, update this document with:
- what changed
- what was deprecated
- data migrations needed
