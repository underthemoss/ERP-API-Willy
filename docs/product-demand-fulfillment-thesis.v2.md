# Product–Resource–Demand–Fulfillment Thesis
*A thesis / antithesis / synthesis framework for an extensible data model.*

This document captures the “tight” conceptual foundation behind the system’s data model:

- **Products define a shared ontology of resources and requirements.**
- **Line items express demand as claims on resource types under constraints.**
- **Fulfillment is the binding of real resources (instances/capacities) to those claims.**
- **Orders are stable contracts; tasks and allocations are adaptive execution plans.**

The intent is to support everything from **home construction** to **PCB component sourcing** using the same primitives: global tags, global attributes, product archetypes, line-item claims, resources, and allocations.

---

## Definitions

### Product
A **product** is a **resource archetype**: a normalized definition of a class of resources and the vocabulary by which that class can be constrained and substituted.

A product definition typically references:

- **Global tags** (equivalence classes / substitutability classes)
- **Global attributes** (normalized physics concepts and non-physics identity metadata)
- Optional **composition** (assemblies / bundles / scopes)

Importantly, a product is valuable even with *zero pricing*: it still defines **what counts as an acceptable satisfier** of demand.

### Resource
A **resource** is an operational satisfier: an instance, capability, or capacity block described in the same ontology as products, plus state.

A resource may be:

- a **material instance** (inventory item, lot, batch, serialized unit)
- an **equipment asset** (rentable unit with availability windows)
- a **human/crew capacity** (skills + schedule + location)
- a **facility capacity** (bay time, yard space, machine time)

Formally:

> **Resource = Product-language (tags + attributes) + State (availability, location, condition, compliance, etc.)**

### Demand
**Demand** is demand for **resource commitments** (not merely “things”).

A **line item** is a demand vector:

> **LineItemDemand = ProductRef × Quantity × Constraints × (Time, Place)**

### Fulfillment
**Fulfillment** is the operational act of satisfying demand:

> **Fulfillment = (Match + Allocate + Execute + Evidence) under Conformance**

It is not a separate ontology; it is a *matching and binding* process between two entities described in the same language.

### Contract vs Plan
- A **quote** is a proposal of claims and constraints between parties.
- An **order** is an accepted contract: a stable envelope of scope and obligations.
- A **plan** (tasks + allocations) is the adaptive decomposition of how the seller will satisfy the contract.

---

## Thesis

### Core thesis statement
**Products define the ontology of resources and requirements; line items express demand as claims on those resource types; fulfillment binds real resource instances/capacities—modeled in the same ontology—to satisfy those claims under agreed constraint strength.**

### Why this is the “rooted” view
Saying “products define the ontology of demand” is correct but incomplete. Demand is always demand *for something that can satisfy it*—i.e., resources. Therefore:

- Products define **what can be asked for** (demand vocabulary),
- and simultaneously define **what can satisfy what is asked** (resource vocabulary).

This is why the model is naturally extensible: new domains add new tags/attributes/products/resources, but do not change the underlying grammar.

### Sale / rental / service are state machines over the same claim
The differentiator between “material” and “service” is not the ontology; it is the **state machine** of satisfaction.

- **Sale / Transfer**: satisfaction is achieved through allocation + transfer of ownership.
- **Rental / Right-of-use**: satisfaction is achieved through allocation + custody/return windows.
- **Service / Capacity-to-perform**: satisfaction is achieved through allocation + execution + evidence + acceptance.

In every case, the seller fulfills by binding resources to the line item and driving them through the satisfaction state machine.

---

## Antithesis

Reality resists a perfectly clean mapping.

### 1) Sellers need substitutability; buyers need assurance
The seller’s operational objective is to maximize the set of eligible resources that can satisfy a claim (substitutability), while the buyer wants assurance that what is delivered matches intent.

Example:

- Seller-friendly: **“Skid steer rental, operating weight 6–8k lbs.”**
- Seller-hostile: **“John Deere 300 skid steer, model year 2025.”**

The first expresses a broad satisfiable class with measurable constraints; the second collapses the satisfiable set to a single identity.

### 2) Services are adaptive and decomposable
Service scopes often start under-specified and become operationally real through decomposition into tasks, sequencing, and assignment. Different chunks may be executed by different people/crews at different times.

### 3) Contracts require stability; operations require change
Once a quote becomes an order, the contract should not be arbitrarily mutated. However, the seller must continually refine the execution plan based on reality (scheduling, resource availability, site conditions, sequencing).

If the only tool is “change the order,” the system becomes commercially ambiguous and audit-hostile.

---

## Synthesis

The synthesis is to preserve a unified ontology while introducing **constraint strength** and the **envelope vs plan** separation.

### 1) Tags and attributes create substitutable classes without losing fitness
- **Tags** define equivalence classes (“what kind of thing could satisfy this?”).
- **Normalized physics attributes** define measurable fitness constraints (“what properties must fall in bounds?”).
  - Units follow a normalization pattern (e.g., QUDT-style canonicalization), but the key is consistent dimensional normalization.
- **Identity / brand attributes** express non-physics identity metadata (manufacturer, SKU, family, make, model) and should usually be treated as *preferences* unless explicitly required.

This yields an important rule of thumb:

> Put **fitness** into normalized attributes and required tags; put **identity** into preferences unless the contract truly requires identity.

### 2) Constraint strength is the formal bridge between buyer intent and seller substitutability
Represent constraints as predicates with an explicit strength:

- **REQUIRED**: must be satisfied; changing after acceptance is a change order.
- **PREFERRED**: influences matching/scoring; not contract-binding.
- **EXCLUDED**: must not be used.

Constraint origin matters as well:

- **Buyer-originated** constraints capture requirements and preferences.
- **Seller-originated** constraints capture operational constraints and commitments.
- **System-originated** constraints capture policy/compliance constraints.

This resolves the core tension:
- Buyers can express wishes without unintentionally collapsing the feasible set.
- Sellers can commit to what they can fulfill while still optimizing satisfaction.

### 3) Orders remain stable; tasks evolve
The seller should be able to refine “the work” after acceptance without changing the order:

- The **order** is the stable envelope: line items + prices/terms + REQUIRED constraints.
- **Tasks** are the adaptive execution plan: decomposition, sequencing, assignment, internal detail.
- **Allocations** are the binding between demand (line items/tasks) and supply (resources).

A service line item is the contractual signal “a human (or crew) will be assigned.”  
A task is a service wrapped in an execution container so work can be chunked and assigned to different people.

### 4) Conformance becomes the governing invariant
Tasks and allocations are free to change **as long as conformance holds**:

> An allocation satisfies a line item if it meets all REQUIRED constraints (and does not violate EXCLUDED constraints). PREFERRED constraints improve score but do not block satisfaction.

This makes the change-order boundary unambiguous:

- Change order required when the **envelope** changes (quantity, REQUIRED constraints, committed terms).
- No change order required when the **plan** changes (task breakdown, assignments, chosen resource instance), as long as conformance holds.

### 5) Assemblies unify “what is bought” with “what must be procured/executed”
Assemblies allow demand to be expressed at a meaningful level (scope/package) and expanded into fulfillable sub-demands.

A BOM lifecycle (DRAFT/ACTIVE/ARCHIVED) is best understood as **definition statefulness** rather than “versioning” as a first-class concept. If the system later needs audit-grade historical traceability, BOM state transitions can be captured as an event stream; the conceptual foundation does not change.

---

## Worked examples

### Example A: Skid steer rental (substitutability with fitness)
**Line item envelope**
- ProductRef: “Skid Steer Rental”
- REQUIRED:
  - tags include: `skid_steer`, `rental_equipment`
  - attribute: `weight` between 6,000–8,000 lb (context tag: operating)
- PREFERRED:
  - brand.manufacturer in [“John Deere”]
  - attribute: `model_year` ≥ 2020

**Fulfillment**
- Select any eligible inventory unit satisfying REQUIRED.
- Score higher for John Deere if available.
- Allocate for the requested time window.
- No change order unless the buyer upgrades a preference into REQUIRED.

### Example B: Service line item → task plan evolution without change order
**Order envelope**
- “Cabinet installation service” (unit: JOB or HOUR)
- REQUIRED constraints define scope boundaries and acceptance criteria.

**Task plan (editable)**
- “Install base cabinets”
- “Install upper cabinets”
- “Punch list”
- “Cleanup”

Assignments, sequencing, and internal steps can change as long as the completion evidence rolls up to satisfy the original line item’s REQUIRED acceptance criteria.

---

## Data-model primitives implied by this thesis

### Global curation layer
- **Tag** (global): name, synonyms, optional relations (broader/narrower/related)
- **AttributeType** (global): name, dimension/type, canonical unit (for physics), validation rules
- **AttributeValue** (per entity): value + unit + canonical value + optional context tags
- **IdentityValue** (per entity): key/value for non-physics metadata (manufacturer/SKU/model/etc.)

### Catalog layer (resource archetypes)
- **ProductDefinition**
  - references tags and attribute expectations
  - supports material, service, and assembly archetypes
- **Assembly/BOM**
  - component references (products, PIM items/categories, services)
  - lifecycle state (draft/active/archived)

### Transaction layer (demand claims)
- **DocumentParty**
  - explicit buyer/seller (and optionally ship-to/bill-to) on *every* transactional document
- **LineItem**
  - product reference + quantity + unit
  - constraints[] (with strength + origin)
  - pricing reference (decoupled from product definition)

### Supply layer (resources)
- **Resource**
  - tag set + attribute values + identity values
  - state (availability, location, condition, compliance, etc.)

### Fulfillment layer (binding + execution)
- **Allocation**
  - binds line item (or task) to one or more resources
  - captures quantities, windows, and fulfillment state
- **Task**
  - decomposes service line items into assignable units of execution
  - supports adaptive refinement post-acceptance

---

## Summary: the “native matching” reality (tight form)

- **Products** define a shared language for both **demand** and **resources**.
- **Line items** are claims on resource types under **constraint strength**.
- **Resources** are satisfiers described in the same language plus state.
- **Fulfillment** is the constrained matching and allocation of resources to claims.
- **Orders** are stable contract envelopes; **tasks/allocations** are adaptive execution plans.
- **Assemblies** express composition and expand into matchable sub-demands.

This is the core synthesis that makes the model both theoretically coherent and operationally practical.
