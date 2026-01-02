# Quote Line Item Model (Service-Target Power)

## Quote
A Quote is a document that aggregates line items (demand claims) plus
pricing/terms. Each line item is an agreement-grade unit that both buyer and
seller can understand and accept.

## QuoteLineItem (core shape)
QuoteLineItem
- id
- product_ref
  - kind: MATERIAL_PRODUCT | SERVICE_PRODUCT | ASSEMBLY_PRODUCT (discriminator)
  - product_id
- quantity
- unit_code
- time_window (optional on the line; can inherit from quote header defaults)
- place_ref (optional on the line; can inherit from quote header defaults)
- constraints[] (optional; REQUIRED/PREFERRED/EXCLUDED)
- pricing_ref (how it is priced)
- notes (buyer-visible assumptions/instructions)

Key principle: the discriminator drives which attachments apply; the line item
remains one unified object.

## Pricing snapshots (draft vs accepted)

Snapshot concept: when a quote/line item is created, revised, or accepted, store the
“freeze-dried” pricing inputs/rates used to compute totals so later edits to
prices/price books/products do not retroactively change history.

Recommended behavior:
- Draft quote revisions may recompute totals “live”.
- Accepted quote revisions (and derived orders) must freeze pricing snapshots and totals.

Implementation note:
- Quote revision line items already include `subtotalInCents`, `pricingSpecSnapshot`,
  and `rateInCentsSnapshot` (see `src/graphql/schema/quoting.ts` and
  `src/services/quoting/quote-revisions-model/events-store.ts`).

## Service target extension (only for service line items)
ServiceLineItemExtension
- target_selector (0..N)
  - kind: tags | product | line_item
  - tag_ids[] (if kind = tags)
  - target_product_id (if kind = product)
  - target_line_item_ids[] (if kind = line_item)

This is what enables orchestration without breaking pricing clarity:
- The service line can point to the material line(s) it is acting on.
- The buyer still sees clean priced lines; the seller gains structured
  relationships for planning and automation.

## Location nuance rule (demand vs supply)
- Delivery drop-off is part of demand: the buyer's intended place of use
  (jobsite/project/site). It belongs on the target material line item's
  place_ref.
- Pickup is part of supply: where the chosen satisfier (inventory unit) is
  sourced from. It is not stored on the quote; it is derived at fulfillment
  time from the assigned inventory's best-known location.

## Example: Skid Steer Rental + Delivery
Line Item A - Material (Rental)

QuoteLineItem A
- product_ref.kind = MATERIAL_PRODUCT
- product_id = SkidSteer_Rental_Product
- quantity = 1
- time_window = Jan 10 8:00-Jan 12 17:00 (rental period or start window)
- place_ref = Project_X_Jobsite (drop-off / place of use)
- pricing_ref = daily_rate * days
- notes = "Must arrive ready to work; full tank."

Interpretation in plain English:
"Provide one skid steer at Project X during this time window."

Line Item B - Service (Delivery)

QuoteLineItem B
- product_ref.kind = SERVICE_PRODUCT
- product_id = Delivery_Service_Product
- quantity = 1
- time_window = inherit from target (or explicitly Jan 10 6:00-10:00)
- pricing_ref = flat_fee (or zone-based pricing)

ServiceLineItemExtension
- target_selector.kind = line_item
- target_line_item_ids = [A]

Interpretation in plain English:
"Deliver the thing described by line item A."

## Inheritance and resolution behavior (what the model enables)
1) Drop-off is inherited from the target line item

Because B targets A:
dropoff_place(B) := place_ref(A)
So the delivery service automatically knows the destination jobsite.

2) Pickup is resolved only after inventory is assigned to the target material
line

At fulfillment time, the system assigns a specific inventory unit to line
item A:

InventoryAssignment
- line_item_id = A
- inventory_resource_id = Unit_#SS-2049

Now pickup can be derived:
pickup_place(B) is computed from Unit_#SS-2049 location signals in this
precedence order:
- current GPS/telematics (if available and fresh)
- last known telematics location (bounded freshness)
- resource-map / home-base location
- dispatcher override (exception path)

Result:
delivery task/work order for B is created/updated with:
- pickup = resolved from assigned unit
- drop-off = jobsite from A
- payload = "Unit #SS-2049"

3) Automatic propagation when fulfillment choices change

If dispatch later swaps the assigned unit for A (e.g., SS-2049 to SS-1180):
- pickup automatically re-resolves based on SS-1180
- the delivery work order updates without changing the quote terms
- any assigned internal driver or external hauler stays connected to the
  latest truth because they are attached to the delivery service execution
  artifact derived from line item B

## Why this is powerful (one sentence)
A service line item can be priced and agreed independently, while still being
structurally bound to the material demand it supports, enabling late-binding
optimization of pickup via inventory assignment and real-time location without
polluting the contractual quote with operational details.
