# Material Products: Transaction Composition + Operational Templates (Design)

This doc clarifies (1) what it means for **material** products to have `taskTemplates[]`, and (2) how delivery/pickup/receiving-inspection should be modeled using existing primitives without turning fulfillment into strings.

It is written for Backend + Frontend + the Studio Agent.

---

## 1) First principles (thesis alignment)

From `docs/product-demand-fulfillment-thesis.v2.md`:

- **Products** define the shared ontology (tags/attributes) for what resources *are*.
- **Line items** express **transactional demand**: `ProductRef × Quantity × Constraints × (Time, Place)`.
- **Fulfilment** is the execution plan + binding of resources to satisfy that demand.
- **Contract vs Plan** is a hard boundary:
  - Contract = what was agreed (stable after acceptance).
  - Plan = how it will be executed (mutable within policy).

Implication:
- A **material product** should not encode transaction-specific workflow.
- A **transaction** should not require creating a new product per option/configuration.
- “Delivery”, “pickup”, “inspect” should be modeled as **work**, not magic strings.

---

## 2) Delivery vs Pickup vs “Transport”

### 2.1 Keep two system SERVICE products (UX clarity)

Use the canonical, seeded SERVICE catalog products:

- `svc_delivery` — “transport leg from seller base → destination”
- `svc_pickup` — “transport leg from origin → seller base”

Why two?
- Users understand the mental model immediately.
- Scheduling is naturally different (rental start vs rental end).
- Task templates differ slightly (confirm delivery vs inspect on return, etc.).

### 2.2 Treat “transport” as the underlying activity (ontology)

Do not add a new persisted “transport primitive” yet.

Instead:
- Use `activityTags` / `taskTemplates` to express the transport nature (`transport`, `load`, `unload`, `dispatch`, …).
- Encode direction by where the service is scheduled and what it targets:
  - SERVICE line item `placeRef` = the non-base location (jobsite/yard/customer address)
  - The “base” is derived from workspace configuration (default yard/branch) rather than duplicated everywhere.

If we later need explicit origin+destination routing, add it on the **SERVICE line item** (plan), not on the product (identity).

---

## 3) Receiving inspection (“receipt gating”) for material transactions

### 3.1 The real-world invariant

When a material resource returns (rental check-in, sale receipt, internal transfer receipt), the seller needs:
- a repeatable **checklist** (inspect condition, verify accessories, meter reading, damage notes)
- a gating mechanism: “this item is not available until inspection is complete”

This is **plan/execution**, not contract math.

### 3.2 Where to store the checklist template

Store reusable checklists on the **material product** as `taskTemplates[]`.

- These are **operational templates**, not billable scope.
- They use the same primitives as service scope tasks:
  - `activityTagIds[]` (inspect, verify, photograph, clean)
  - `contextTagIds[]` (checkin, receiving, damage, accessories, meter_reading)

Backend support: `taskTemplates[]` are now allowed on `kind=material` catalog products.

### 3.3 Where to execute the checklist (two viable patterns)

**Option A (recommended end-state): Rental/Sale fulfilments gain tasks**
- Add `tasks[]` to `RentalFulfilment` / `SaleFulfilment` (same shape as ServiceFulfilment tasks).
- On “return received” / “delivered” events, instantiate tasks from the material product templates.
- Fulfilment completion gates “inventory available” state.

Pros: checklist lives exactly where the state machine lives (rental/sale fulfilment).
Cons: backend work (schema + persistence + UI).

**Option B (MVP using existing service work queue): generate an internal SERVICE work item**
- Create a SERVICE line item (internal) targeting the material line item, scheduled at the receipt event.
- Copy the material product’s operational `taskTemplates[]` into the SERVICE line item’s `scopeTasks[]`.
- Materialize a ServiceFulfilment from it so it appears in the existing work queue UI.

Pros: reuses the service work queue immediately.
Cons: requires an “internal-only” convention (don’t show buyer); requires a $0 pricing snapshot or a dedicated internal fulfilment pathway.

Recommendation:
- Implement Option B only if you need immediate UI for receiving checklists.
- Prefer Option A for the long-term “receipt gating” invariant.

---

## 4) “Product composed with transaction” (options without product explosion)

### 4.1 Do not create a new product for each option combination

Use the line item as the “configured instance”:
- `productRef` = base archetype
- `constraints[]` = REQUIRED/PREFERRED option selections and capability requirements
- `inputs[]` = additional typed values when needed (esp. SERVICE; can also capture chosen options)

This keeps product counts low while keeping matching deterministic.

### 4.2 Pricing is math; options choose a price variant

Price remains anchored to the product:
- Multiple `Price` rows per product is normal (variants).

MVP approach:
- User selects the price variant explicitly (e.g., “Standard Delivery”, “Heavy Haul Delivery”).
- The selected price’s `pricingSpecSnapshot` becomes part of the accepted contract.

Future (optional):
- Add rule-based price selection by constraints (price applies when option X is selected).
- Keep this as a separate layer; don’t mutate the product model to make pricing “smart”.

### 4.3 Fulfilment matching still uses the definition of the “thing”

Matching a resource to a material line item uses:
- productRef (broad identity)
- REQUIRED constraints (capability envelope)
- time/place window

That’s consistent with the thesis: “resources are defined by products” + constraints.

---

## 5) Worked example: Rental telehandler with delivery + pickup + receiving inspection

**Catalog product (material):** `telehandler_10k`
- attributes: weight/length/width/height, capacity, etc.
- taskTemplates (ops): receive/inspect checklist tagged with `checkin`

**Contract (quote/order) line items:**
1) RENTAL line item
   - productRef: `telehandler_10k`
   - timeWindow: start/end
   - constraints: (optional) forks required, indoor usage preferred, etc.
2) SERVICE add-on: delivery
   - productRef: `svc_delivery`
   - targetSelectors: `[{ kind: "line_item", targetLineItemIds: [<rentalLineItemId>] }]`
   - timeWindow.startAt = rental start
3) SERVICE add-on: pickup (seller return pickup)
   - productRef: `svc_pickup`
   - targetSelectors points to rental line item
   - timeWindow.startAt = rental end

Note: delivery/pickup can be **dedicated** (targets one material line item) or **shared** (targets multiple material line items) depending on the real-world trip.

Note: “customer pickup” is not `svc_pickup` — it means no seller logistics SERVICE line for that leg (it can still be captured as intent on the material line item if needed).

**Execution (seller):**
- Delivery fulfilment tasks execute at start.
- Pickup fulfilment tasks execute at end.
- Receiving inspection executes after pickup:
  - Option A: as tasks on the rental fulfilment return stage (preferred).
  - Option B: as a service work item generated from the material product’s ops templates.

---

## 6) Frontend guidance (what to build next)

### 6.1 Product editor
- Allow editing `taskTemplates[]` on MATERIAL products under an “Operational templates” section.
- Encourage stage context tags (`checkin`, `checkout`, `receiving`) so templates are usable programmatically.

### 6.2 Quote/Sales Order line item editor
- Keep material fulfilment choice as an explicit UX (“Delivery / Customer pickup / Decide later”).
- Implement it by calling the backend sync mutation `syncMaterialLogisticsAddOns`, which creates/removes SERVICE add-ons (`svc_delivery`/`svc_pickup`) that target the material line item (not by setting `delivery.method` strings).
- If a single delivery/pickup trip should cover multiple material line items, the UI can attach additional material line items to the existing SERVICE add-on by passing `serviceLineItemId` to `syncMaterialLogisticsAddOns` (shared add-on).

### 6.3 Receiving checklist UI (choose one)
- If we go with Option A: build it inside rental/sale fulfilment views once backend supports tasks.
- If we go with Option B (MVP): add a “Generate receiving inspection work item” action that:
  - reads material product `taskTemplates[]`
  - copies into a SERVICE line item `scopeTasks[]`
  - calls `createServiceFulfilmentFromLineItem`
