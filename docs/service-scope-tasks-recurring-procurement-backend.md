# Service Scope Tasks + Recurring Subscriptions + Procurement (Backend Plan)

This document describes the **backend work** required to support:

1) **Service products** that contain reusable **task templates** (scope building blocks)
2) Quotes and orders where **scope = tasks** (auditable and buyer-accepted)
3) **Recurring schedules** that materialize into a seller-visible “demand for human capacity” queue
4) A first-principled **procurement/subcontract chain**, where the “seller” on one wrapper can become the “buyer” on a downstream wrapper (role flips), while preserving strict tenancy boundaries.

This plan is intentionally “lego-like”: the goal is to **reuse existing primitives** wherever possible (catalog products, tags, line items, wrappers, fulfilment, charges, invoices) and introduce **only the minimum new concepts** needed to make recurring service execution and subcontract procurement deterministic and auditable.

---

## 0) Outcome (non‑negotiable user stories)

### 0.1 Recurring service sold to a buyer

- Seller creates a **SERVICE catalog product**: “House Cleaning”
- Seller defines task scope templates on that product:
  - `mop floors`, `wash windows`, `take out trash`, …
- Seller adds “House Cleaning” to a quote with:
  - price: “$X per visit” (pricingSpec UNIT + unitCode)
  - schedule: “every week”
  - scope: a selected/edited list of tasks
- Buyer accepts.
- Backend creates the contractual record and a plan:
  - a “contracted” representation (order/subscription)
  - upcoming scheduled occurrences well in advance
- Seller sees a queue of upcoming work (the demand for human capacity).
- Seller assigns the work to a person (internal user now; external contact later).
- Assignee marks tasks done → occurrence fulfilled → charge created → invoice engine can invoice.

### 0.2 Subcontract / procurement chain (role flip)

- Prime seller (Seller A) sells “House Cleaning” to the buyer.
- Seller A subcontracts some/all cleaning tasks to another business (Seller B on the downstream document).
- This creates a **new buyer/seller document** (RFQ/Quote/PO/SO) where:
  - **Seller A becomes the buyer**
  - Seller B becomes the seller (on that downstream document)
  - the work definition is still the same atoms: service product + activity tags + scoped tasks
- The downstream seller performs work and completes tasks.
- Status flows upstream (without leaking data across tenants beyond role‑based access).

---

## 1) First principles (constraints we must preserve)

### 1.0 Parties are document roles (no static party types)

This system must never treat a business/contact as a static category (e.g., “supplier” vs “customer”).

- A **business/contact** becomes “customer-like” or “seller-like” only by the **role it plays on a specific wrapper**.
- **Buyer/Seller** are *document roles* on a wrapper (RFQ/Quote/Order/Subscription/Procurement wrapper).
- The same counterparty can be a **seller** on one document and a **buyer** on another (role flip) — this is a core multi‑tenant requirement and the foundation for procurement chains.

When this document uses phrases like “upstream buyer”, “prime seller”, or “downstream seller”, it is always describing a **role on a specific document**, not an intrinsic property of an entity.

### 1.1 “Demand is never reinvented”

- **Demand** is always expressed as a canonical `LineItem` between exactly one buyer and one seller (roles are wrapper-level).
- “Plan” objects must **reference** demand; they cannot redefine what demand is.

### 1.2 Scope is tasks; tasks are composed from atoms

- Scope is represented as a list of **task scope items** (not free‑text).
- Each scope task is built from the same atomic vocabulary:
  - **activity tags** (verb-ish) for “what happens”
  - **context tags** for “where/what part” (optional)
  - optional typed inputs (attribute values) when needed later
- A task template on a service product is **reusable scope**.
- A task list on a line item is **contracted scope** (buyer accepted).
- A task instance on an occurrence/work item is **execution evidence**.

#### 1.2.1 “Work spec” is the shared unit (tasks and service products share atoms)

We want the **work definition** to be consistent everywhere; the *wrapper* (product vs scope vs contract vs execution) is what differentiates its meaning.

Define a single conceptual unit:

- **ServiceWorkSpec** (conceptual): `{ activityTagIds[], contextTagIds?, inputs?, notes? }`

Then use it in multiple wrappers:

- **Catalog SERVICE product**: identity + taxonomy tags + primary activity tags (what it does), plus:
  - `taskTemplates[]`: reusable scope decomposition (each template is a ServiceWorkSpec + `{id,title}`)
- **Contract line item (SERVICE)**: `scopeTasks[]` is the buyer-accepted ServiceWorkSpec list (frozen on acceptance).
- **Occurrence/work execution**: fulfilment tasks are ServiceWorkSpec instances plus execution state (OPEN/DONE/SKIPPED + evidence).

Important nuance:
- A “deliverable” is not *only* an activity tag — it is an identity wrapper around a work spec (catalogRef + name + taxonomy tags + optional constraints/inputs).
- If a scope task needs to become independently demandable/priceable/procurable, it can be **promoted** into its own SERVICE product (or later linked via a `linkedCatalogRef` field) without changing the underlying work spec atoms.

### 1.3 Wrappers determine roles and access; line items carry the atoms

- Wrappers (`RFQ`, `QuoteRevision`, `SalesOrder`, `PurchaseOrder`, subscription/plan wrappers) define:
  - buyer/seller roles
  - lifecycle (draft/sent/accepted/etc)
  - default terms/policies
  - access control
- Line items define:
  - what is being demanded (productRef + scope tasks + schedule constraints)
  - how it is priced (pricingRef + snapshots)

### 1.4 Recurrence is not a “Price” concern

- Price is reusable and product-anchored.
- Recurrence is **agreement/buyer-specific** and belongs on the contracted line item / subscription.

### 1.5 Multi‑tenant safety

- Every document has exactly one buyer workspace org and one seller workspace org.
- Access must remain role-based: you can see downstream documents only if you are a party to them.
- Upstream/downstream status rollups must not require cross-tenant reads outside those roles.

### 1.6 “Contract vs Plan” is a hard boundary (immutability vs operations)

If we blur this boundary, we will leak mutable state into reusable objects and lose the ability to automate reliably.

- **Contract (immutable after acceptance)**: what was agreed.
  - product identity refs
  - scope tasks snapshot
  - typed recurrence rule snapshot (if recurring)
  - pricing snapshots (pricingSpec/rate/version markers)
  - wrapper-level terms snapshot (payment, cancellation, change-order policy)
- **Plan (mutable within policy)**: how/when it will be executed.
  - generated occurrences (work schedule horizon)
  - assignment/rescheduling/skip operations
  - task completion/evidence
  - operational notes

Hard rule:
- Anything that can vary per customer/job/site/timezone lives on the **contract line item / agreement**, and the mutable “execution plan” lives on **occurrence/work** records.
- Product + Price remain reusable definitions and must not accumulate job/customer-specific state.

### 1.7 Recurrence must be typed and deterministic (no free‑text rules)

- Recurrence rules must be represented as a strict object (RRULE-like subset), not strings like “every other Wednesday”.
- The system should start narrow and expand carefully:
  - `frequency`: `WEEKLY | MONTHLY`
  - `interval`: integer >= 1
  - `timezone`: IANA string
  - `startAt`: timestamp
  - end condition: `endAt` OR `occurrenceCount` OR none (open-ended)
  - optional: `byWeekday[]` (weekly), `byMonthday[]` (monthly)
  - optional (later): `skipDates[]`, `overrides[]`

### 1.8 Occurrence ledger is required early (idempotency + audit)

Recurring services require a durable record per generated occurrence, otherwise we will:
- double-generate work
- double-bill
- lose trust during backfills/retries

Minimum requirements:
- A record per occurrence with a stable unique key (e.g. `{contractLineItemId, scheduledFor}` or `{contractLineItemId, occurrenceIndex}`).
- A lifecycle status for the occurrence (example set):
  - `PLANNED | GENERATED | SKIPPED | CANCELLED | COMPLETED | INVOICED`
- A clear link between:
  - contract line item (definition)
  - occurrence/work record (execution)
  - charges/invoices (billing)

### 1.9 Terms belong at the wrapper by default; line overrides are exceptions

- Wrapper terms (Quote/Order/Agreement): payment terms, cancellation/reschedule policy defaults, change-order policy, timezone defaults.
- Line scope: tasks, constraints/inputs, schedule rule, place/time window.
- Line “terms overrides”: only when genuinely different from wrapper defaults (min charge, special cancellation window, etc.).

This keeps documents clean without removing flexibility.

### 1.10 Subcontracting is procurement (new buyer/seller wrapper), not “assignment”

Assigning work to an external business contact is a role flip:
- upstream seller becomes the downstream buyer
- downstream business becomes the seller on the new document

To preserve multi-tenant correctness and extensibility:
- model subcontracting as creation of a downstream RFQ/Quote/PO/SO wrapper
- link upstream scope tasks/occurrences to downstream line items via a `procurementRef` pointer
- roll status up without requiring cross-tenant reads outside document party roles

---

## 2) Current system inventory (what exists now)

### 2.1 Catalog products (StudioFS)

- Catalog products are stored as files under `studio`/StudioFS (e.g. `/catalogs/default/products/**`).
- Creation is supported via GraphQL/MCP tooling (`studioCatalogCreateProduct`, `studio_catalog_create_product`), and validation exists (`studio_catalog_validate`).
- Service products currently include:
  - `tags[]` (taxonomy role)
  - `activityTags[]` (activity role)
  - `targetSpecs[]` (acts-on selectors)
  - `taskTemplates[]` (service scope templates; validated)
  - attributes (brand/physical via the global vocabulary thesis)

### 2.2 Canonical line item store exists

- Canonical store: Mongo `line_items` (`src/services/line_items/model.ts`).
- Supports `type=SERVICE`, `targetSelectors`, constraints/inputs/timeWindow/placeRef, pricing snapshots.
- Supports service `scopeTasks[]` (SERVICE-only).
- Already used by:
  - `SALES_ORDER`, `PURCHASE_ORDER`, `INTAKE_SUBMISSION`
  - Quote revisions via sync (`QuotingService.syncQuoteRevisionLineItemsToCanonicalStore`)
- **Missing today:** recurrence + procurement links + (later) occurrence linkage keys.

### 2.3 Quotes and RFQs

- Quotes are event-sourced; quote revisions embed line items (`src/services/quoting/quote-revisions-model/events-store.ts`).
- RFQs exist (buyer-authored demand wrapper) with invited sellers (`src/services/quoting/request-for-quotes-model/events-store.ts`).
- Quotes can be linked to RFQs via `rfqId`.
- **Gap today:** service scope tasks + recurrence not present on quote/RFQ line items.

### 2.4 Orders (SalesOrder / PurchaseOrder)

- Orders exist as wrappers with canonical line items under the hood.
- Current `acceptQuote` projects only RENTAL/SALE into SO/PO; service isn’t fully covered.
- GraphQL SO/PO line item unions currently list RENTAL/SALE only.

### 2.5 Fulfilment, charges, invoices

- Fulfilment exists (`fulfilments` collection) with workflow columns and assignment.
- Charges exist (`charges` collection).
- Invoices exist and allocate charges.
- Fulfilment now supports SERVICE task execution (tasks + OPEN/DONE/SKIPPED) and can be created from a canonical SERVICE line item.
- **Remaining gaps:**
  - recurring occurrence ledger + horizon materialization
  - charge creation derived from snapshots on completion (no live price lookup)
  - acceptance flow must create SERVICE contract line items (SO/PO projection) so fulfilments originate from accepted demand
  - procurement/subcontract linking for external execution

---

## 3) Concept minimization (what we add, and why)

We should introduce only the primitives that cannot be expressed with existing ones.

### 3.1 New *shapes* (not new vocabularies)

These do **not** introduce new global ontology objects; they are compositions of existing atoms (tags/attributes) and references to existing wrappers.

#### A) Service task template (on Service Product definition)

Purpose: reusable “default scope” for a service product.

Proposed shape:

```ts
type ServiceTaskTemplate = {
  id: string;                // stable within the product
  title: string;             // UI label (optional but strongly recommended)
  activityTagIds: string[];  // 1..N (verbs)
  contextTagIds?: string[];  // 0..N (noun-ish qualifiers)
  notes?: string | null;     // human clarifier
};
```

Validation guardrails:
- Must include at least 1 `activityTagId`.
- `activityTagIds` should be reuse-first resolved to global tags (workspace draft allowed only if explicitly approved).

#### B) Contract scope tasks (on SERVICE LineItem)

Purpose: the buyer-accepted scope for this line item.

```ts
type ServiceScopeTask = {
  id: string;                    // stable within the line item
  sourceTemplateId?: string | null;
  title: string;
  activityTagIds: string[];
  contextTagIds?: string[] | null;
  notes?: string | null;

  // Optional linking for subcontract/procurement (see 6.2)
  procurementRef?: ProcurementRef | null;
};
```

#### C) Recurrence (on SERVICE LineItem / Subscription)

Purpose: encode “weekly/monthly/etc” in a minimal, deterministic way.

Start minimal (avoid full RFC RRULE until needed):

```ts
type Recurrence = {
  kind: 'NONE' | 'WEEKLY' | 'MONTHLY';
  interval: number;         // every N weeks/months
  timezone: string;         // IANA tz (e.g. "America/Los_Angeles")
  startDate: string;        // ISO date (occurrence anchor)
  endDate?: string | null;  // OR occurrenceCount below
  occurrenceCount?: number | null;
  advanceDays?: number | null; // how far ahead to materialize occurrences
};
```

Guardrails:
- Only SERVICE line items can set recurrence (initially).
- Store on the contracted line item (quote revision pre-acceptance, then frozen snapshot at acceptance).

### 3.2 The only “new entities” we may need (evaluate)

We need a persistent representation of “upcoming work” and “work done” for recurring services.

Two options:

#### Option 1 (preferred long-term): evolve `fulfilments` into the generic “work item”

Pros:
- Reuses assignment + workflow columns already present (`assignedToId`, `workflowId`, `workflowColumnId`).
- Avoids creating a new “tasks/work” entity family.

Cons / required refactor:
- Fulfilment is currently PIM-centric; must be generalized to support `catalogRef` and make PIM fields optional.
- Rental charging jobs exist; we must preserve them while generalizing.

#### Option 2 (faster but adds an entity): introduce `service_occurrences`

Pros:
- Minimal impact on existing fulfilment/rental automation.
- Can be purpose-built for recurring service.

Cons:
- Adds a new “plan” primitive to maintain; later we likely merge it into fulfilment anyway.

**Recommendation:** implement Option 1 if we are willing to do the refactor now; otherwise do Option 2 as an MVP with a clear merge plan.

---

## 4) Backend work breakdown (phased, trackable)

Each phase has clear “definition of done” and tries to avoid unnecessary new primitives.

### Phase 1 — Service Product Task Templates (scope library)

Goal: the seller can define a canonical reusable task list on a service product.

Backend tasks:
- [x] Extend the Studio catalog product schema (SERVICE kind) to include `taskTemplates[]`.
- [x] Update catalog validation (`studio_catalog_validate`) to validate `taskTemplates`.
- [x] Update create/update APIs (GraphQL + MCP) to accept and persist `taskTemplates`.
- [x] Ensure the UI can read `taskTemplates` via StudioFS read (`/api/studio/fs/read` / `studioFsRead`).

Notes:
- This is a product definition concern, stored in the product file. No new DB collections.

### Phase 2 — Quote/RFQ line items: add `scopeTasks` + `recurrence`

Goal: seller can propose task scope + schedule on the quote; buyer accepts them.

Backend tasks (Finish Phase 2A — Quote scope tasks round-trip):

#### 2A.1 Persist `scopeTasks[]` on QuoteRevision SERVICE line items (event store)

- [ ] Add a `serviceScopeTaskSchema` (Zod) in `src/services/quoting/quote-revisions-model/events-store.ts`:
  - Fields (shape must match canonical `LineItem.scopeTasks`):
    - `id` (required stable slug)
    - `sourceTemplateId` (optional; used to trace back to product `taskTemplates[].id`)
    - `title` (required)
    - `activityTagIds` (required; >= 1; canonical tag labels only)
    - `contextTagIds` (optional; canonical tag labels only)
    - `notes` (optional)
  - Guardrails (must match canonical enforcement as closely as possible):
    - `scopeTasks[].id` must be unique per line item
    - Reject ID-like tag strings in `activityTagIds/contextTagIds` (e.g., `WTG-…`, `GTG-…`), because we store **canonical tag labels**, not tag IDs.
    - Require `activityTagIds.length >= 1` (scope tasks must be composed from activity atoms).
- [ ] Extend only the **SERVICE** quote revision line item schemas to include `scopeTasks`:
  - `serviceLineItemInputSchema` + `serviceLineItemSchema`
  - Do not add to RENTAL/SALE shapes.
- [ ] Call out the update semantics explicitly in code comments:
  - Quote revision updates replace the full `lineItems[]` list; the UI must send the full `scopeTasks[]` each save (no patch semantics).

#### 2A.2 Expose `scopeTasks[]` on QuoteRevision GraphQL (inputs + outputs)

- [ ] In `src/graphql/schema/quoting.ts`:
  - Output: add `scopeTasks` to `QuoteRevisionServiceLineItem`.
  - Input: add `scopeTasks` to `QuoteRevisionLineItemInput` (GraphQL lacks input unions).
  - Preferred: reuse the shared GraphQL types from `src/graphql/schema/line-items.ts`:
    - `ServiceScopeTask` + `ServiceScopeTaskInput`
- [ ] Update the resolver mapper `mapQuoteRevisionLineItem(...)`:
  - If `type === 'SERVICE'`, include `scopeTasks: input.scopeTasks` in the returned object.
  - If `type !== 'SERVICE'` and `input.scopeTasks` is present, throw a clear error (avoid silently ignoring).

#### 2A.3 Mirror QuoteRevision scope tasks into canonical `line_items` (for unified UI + downstream workflows)

- [ ] Update `QuotingService.syncQuoteRevisionLineItemsToCanonicalStore` in `src/services/quoting/index.ts`:
  - When `item.type === 'SERVICE'`, set `scopeTasks: item.scopeTasks ?? null` in `baseUpdates`.
  - Otherwise, set `scopeTasks: null`.
  - Keep canonical enforcement “tight”: let `LineItemsService` normalize/validate and throw if invalid (prevents silent garbage).

#### 2A.4 E2E coverage (prevents regression + FE confusion)

- [ ] Extend `src/test/e2e/quote-revisions.test.ts` (preferred) or add a new e2e file:
  - Create a quote revision with a SERVICE line item that includes `scopeTasks[]`.
  - Assert `quoteRevisionById.lineItems[..].scopeTasks` round-trips.
  - Assert `quoteRevisionById.canonicalLineItems[..].scopeTasks` includes the same tasks (sync works).
  - Update the quote revision and modify scope tasks; assert changes persist.
  - Negative: attempt `scopeTasks` on RENTAL/SALE and assert GraphQL/validation failure.
- [ ] Update the test GraphQL fragments/queries to request the new `scopeTasks` fields, then regenerate e2e codegen outputs as required by this repo.

Backend tasks (Phase 2B — add `recurrence` later, same pattern):

#### 2B.1 Add SERVICE-only `recurrence` to quote revision + canonical line items

- [ ] Define a minimal recurrence rule shape (service-only, pre-acceptance):
  - `kind`: `ONE_TIME | WEEKLY | MONTHLY`
  - `interval`: number (>= 1) for weekly/monthly
  - `startAt`: date
  - `timezone`: string (IANA TZ, e.g. `America/Los_Angeles`)
  - End condition (exactly one):
    - `endAt` (date) OR `occurrenceCount` (int) OR nothing (open-ended)
- [ ] Add to:
  - Quote revision SERVICE line item schemas (`events-store.ts`)
  - Canonical `LineItem` schema (`src/services/line_items/model.ts`) + validation (`src/services/line_items/index.ts`)
  - GraphQL quoting inputs/outputs (`src/graphql/schema/quoting.ts`)
  - Quote → canonical sync (`src/services/quoting/index.ts`)
- [ ] Add e2e coverage similar to scope tasks.

Guardrails:
- `scopeTasks.activityTagIds` must be non-empty.
- Scope tasks should be resolved-first to global tags (workspace draft only via explicit UX approval).

### Phase 3 — Acceptance creates contractual “recurring agreement” + work horizon

Goal: when buyer accepts, we freeze scope+pricing and create the durable recurring record and a work queue.

Backend tasks:
- [ ] Ensure `acceptQuote` can project SERVICE line items into the post-acceptance layer.
  - Minimum: create canonical `line_items` for SO/PO with service type (even if SO/PO GraphQL unions don’t yet render them).
  - Preferred: add Service order line item types to SO/PO GraphQL and service adapters.
- [ ] Snapshot rules:
  - Quote revision is mutable while DRAFT.
  - On accept: freeze `pricingSpecSnapshot`, `rateInCentsSnapshot`, and `scopeTasks` on the accepted line item (contract snapshot).
- [ ] Implement recurring “agreement” entity (if not reusing an existing wrapper):
  - `service_subscriptions` (or reuse an order wrapper if acceptable).
  - Contains: party refs, source quote refs, recurrence, pricing snapshot, scope snapshot.
- [ ] Materialize a horizon of occurrences (Option 1: fulfilments; Option 2: service_occurrences).
  - Create occurrences up to `advanceDays` (default 60).
  - Ensure idempotency (unique key: subscriptionId + occurrenceStartAt).

Definition of done:
- Accepting a quote with a recurring service line item results in:
  - a durable subscription/agreement record
  - a list of upcoming occurrences visible to the seller as “work to assign”

### Phase 4 — Execution: assign, complete, charge

Goal: seller assigns an occurrence (or tasks within it), worker completes, billing can proceed.

Backend tasks:
- [ ] Add mutations/endpoints:
  - list occurrences by workspace + date window + assignment status
  - assign occurrence to user/contact
- [x] Materialize a service fulfilment (“work order”) from a canonical SERVICE line item
  - GraphQL: `createServiceFulfilmentFromLineItem`
  - Backend: `FulfilmentService.createServiceFulfilmentFromLineItem`
- [x] Mark task complete / reopen / skip for a service fulfilment task (execution evidence)
  - GraphQL: `updateServiceFulfilmentTaskStatus`
  - Backend: `FulfilmentService.updateServiceTaskStatus` → event-sourced `UPDATE_SERVICE_TASK_STATUS`
- [ ] Persist execution evidence:
  - completedAt, completedBy
  - optional notes/evidence refs (future)
- [ ] On completion, create a SERVICE `Charge`:
  - amount derived from the accepted pricing snapshot (never live price lookup)
  - link charge to occurrence/work item id
- [ ] Invoice engine integration:
  - not necessarily auto-invoice at MVP, but charges should be listable and allocatable to invoices.

Guardrails:
- Only seller side can mark done (buyer can view status).
- Completion is idempotent (no duplicate charges).

### Phase 5 — Procurement/subcontract of scope tasks (role flip chain)

Goal: prime seller can subcontract scope tasks to a downstream seller; the downstream seller sees a clean buyer/seller document and can fulfill.

Backend tasks:
- [ ] Introduce a first-class “procure this scope” mutation, conceptually:
  - input: { upstreamSubscriptionId|occurrenceId|lineItemId, scopeTaskIds[], sellerContactId|sellerWorkspaceId, … }
  - output: created RFQ/Quote ids (downstream doc refs)
- [ ] Implement downstream document creation:
  - Preferred: create RFQ (buyer-authored) to one or multiple invited sellers.
  - Alternate: create direct Quote (seller-authored) if the downstream seller is already chosen.
- [ ] Preserve atomics:
  - downstream line item(s) carry the same `productRef` and `scopeTasks` atoms (or a subset).
  - recurrence on downstream is optional; often procurement is per-occurrence.
- [ ] Link upstream to downstream:
  - store `procurementRef` on scope tasks or occurrence that points to downstream document(s).
  - allow upstream UI to show state: “RFQ sent / Quote received / Accepted / Scheduled / Done”.
- [ ] Access control:
  - downstream docs visible only to parties (prime as buyer; downstream seller as seller).
  - the upstream buyer (end buyer on the original demand) never sees downstream docs by default.

Definition of done:
- Subcontracting creates a clean downstream buyer/seller doc and links it to the upstream work item.

### Phase 6 — Rollups + auditability + reporting (extensibility hardening)

Goal: make chains understandable and safe.

Backend tasks:
- [ ] Provide deterministic rollups:
  - subscription status derived from occurrences
  - occurrence status derived from task states or procurement state
- [ ] Add audit events:
  - scope changed (change order)
  - subcontract created / accepted / completed
  - completion + charge created
- [ ] Add indexes and paging:
  - list occurrences efficiently (by workspaceId, date range, assignedTo)
  - list subscriptions efficiently

---

## 5) Data model relationships (canonical graph)

### 5.1 Contract graph

```
ServiceProduct (catalog)
  └─ taskTemplates[]  (definition scope)

QuoteRevision (offer)
  └─ SERVICE LineItem (contract proposal)
       ├─ scopeTasks[]     (contracted scope)
       ├─ recurrence       (contract proposal)
       └─ pricingRef + snapshots (quote pricing)

Accept → Order/Agreement
  └─ ServiceSubscription (contract)
       ├─ scopeTasksSnapshot[]
       ├─ pricingSnapshot
       └─ recurrence
```

### 5.2 Plan graph (execution + billing)

```
ServiceSubscription
  └─ Occurrence/WorkItem (per scheduled visit)
       ├─ assignedTo (user/contact)
       ├─ taskInstances[] (optional)
       ├─ procurementRef? (optional)
       └─ status (planned→done)
            └─ Charge (SERVICE)
                 └─ Invoice (allocated)
```

### 5.3 Procurement chain

```
Upstream Occurrence Task
  └─ procurementRef → RFQ (buyer: prime seller’s workspace, seller: downstream seller’s workspace/contact)
        └─ Quote → Accept → PO/SO → downstream seller work items → charges → invoices

Upstream sees state via its buyer-side access to downstream docs.
```

---

## 6) Critical design decisions (decide once; enforce everywhere)

### 6.1 Where tasks live (definition vs contract vs plan)

- **Definition**: `ServiceProduct.taskTemplates[]` (reusable)
- **Contract**: `LineItem.scopeTasks[]` (snapshot at acceptance)
- **Plan**: `Occurrence.taskInstances[]` (execution evidence) referencing `scopeTasks`

This prevents drift: you can edit templates without changing already-accepted scopes.

### 6.2 Where procurement links live

We need one authoritative link so we can roll up status.

Recommendation:
- Put `procurementRef` on the **plan** (occurrence/task instance), not on the product definition.
- Optionally also store it on the contract scope task snapshot for audit visibility.

Proposed shape:

```ts
type ProcurementRef = {
  kind: 'RFQ' | 'QUOTE' | 'PURCHASE_ORDER' | 'SALES_ORDER';
  id: string;
  lineItemIds?: string[] | null; // when applicable
};
```

### 6.3 “Who can mark done?”

- Worker completion belongs to the **seller** side of the wrapper that owns the work item.
- Buyers may “approve” completion (optional future), but should not be able to silently mark seller work as done.

### 6.4 Change order boundary (scope/terms)

- Tasks on accepted scope are part of the contract envelope:
  - adding/removing tasks requires a change order (new revision / amendment), not a silent edit.
- Execution plan can change freely (assignment, timing adjustments within policy) without rewriting scope.

---

## 7) Integration implications (known gaps we must address)

### 7.1 Orders wrappers need service coverage (eventually)

Today:
- SO/PO wrappers and their GraphQL schemas are rental/sale-centric.

To meet the recurring-service outcome:
- We must either:
  - add service line items to SO/PO schemas, or
  - treat subscription/work items as the post-acceptance system-of-record for service until SO/PO are extended.

### 7.2 Fulfilment model is PIM-centric

If we reuse fulfilments as work items (recommended long-term):
- Make `pimCategoryId/path/name` optional and add `catalogRef` fields.
- Ensure rental automation jobs still function.

### 7.3 Pricing snapshots must be the billing source of truth

- Charges must be derived from accepted snapshots, not live price lookups.
- Store enough metadata to audit:
  - priceId / priceBookId used
  - pricingSpecSnapshot
  - unitCode + quantity

---

## 8) Suggested implementation order (lowest risk → highest impact)

1) **Service product taskTemplates** (Phase 1)
2) **scopeTasks + recurrence on quote line items + canonical sync** (Phase 2)
3) **acceptance snapshots + subscription + horizon generation** (Phase 3)
4) **assign/complete + charge creation** (Phase 4)
5) **subcontract procurement** (Phase 5)
6) **generalize fulfilment + unify work views** (Phase 6)

---

## 9) Appendix: “Lego” test cases (what we should be able to express)

- One-time house cleaning (no recurrence), scope tasks selected.
- Weekly recurring house cleaning, same scope each visit.
- Weekly recurring with per-visit variation (future): occurrence-level deltas without changing contracted scope.
- Subcontract “wash windows” only, internal staff does remaining tasks.
- Chain subcontract: downstream seller B subcontracts “carpet cleaning” to downstream seller C.

In every case, the demanded work is the same atoms:
`service product + activity tags + scope tasks + schedule constraints + pricing snapshot`.
