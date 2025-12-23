# Product Demand/Fulfillment Roadmap

This roadmap turns the thesis into a staged, pragmatic build plan.
Progress is tracked inline using checkboxes.

Legend:
- [ ] not started
- [~] in progress
- [x] done

---

## Phase 0: Documentation and Alignment

- [x] Draft thesis and core primitives (`docs/product-demand-fulfillment-thesis.md`)
- [x] Draft service/material/assembly composition doc (`docs/service-material-assemblies.md`)
- [x] Draft global attribute library doc (`docs/global-attribute-library.md`)
- [x] Draft model audit doc (`docs/product-demand-fulfillment-model-audit.md`)
- [ ] Align terminology with product, pricing, and fulfillment teams
- [ ] Define document party invariants (buyer/seller role symmetry across all documents)
- [ ] Define contract envelope vs execution plan invariants (what changes require change orders)

---

## Phase 1: Global Vocabulary (Tags and Attributes)

- [ ] Define GlobalTag model (types, synonyms, status)
- [ ] Define GlobalTag relations (ALIAS, RELATED, BROADER, NARROWER)
- [ ] Define tag facets (service taxonomy, activity, material taxonomy, context, capability)
- [x] Define GlobalAttributeType model (PHYSICAL vs BRAND, unit normalization)
- [x] Implement global attribute values/relations/units models (separate DB)
- [x] Add audit status for auto-activation + later curation
- [x] Seed minimal global unit definitions (LB, KG, IN, FT, M, MI, HR, MIN, SEC, DAY, L, GA)
- [x] Add free-form ingestion mutation (string -> canonical attribute type/value)
- [ ] Admin/global curation workflows (approve, merge, deprecate)
- [ ] Suggestion + review queue (LLM + fuzzy match + approval flow)
- [ ] Agent access rules for global tag/attribute library

---

## Phase 2: Product Catalog (No Pricing Coupling)

- [ ] ServiceProduct model (service taxonomy + activity tags + unit)
- [ ] MaterialProduct model (material taxonomy + physics attributes + brand attrs)
- [ ] AssemblyProduct model
- [ ] BOM and BOMLine models (DRAFT/ACTIVE/ARCHIVED)
- [ ] BOM snapshot/effective reference for use in contracts
- [ ] Validation rules (no forced taxonomy hierarchy, context-tagged attributes)

---

## Phase 3: Pricing Integration (Extensible, Separate)

- [ ] Add catalog_ref to Price (service/material/assembly/PIM)
- [ ] Support pricing kinds beyond current RENTAL/SALE if needed
- [ ] Keep price book resolution rules intact (workspace, project, contact)
- [ ] Store resolved price snapshot at acceptance (audit-safe pricing)

---

## Phase 4: Demand Model (Line Items + Constraints)

- [ ] LineItem schema with constraint envelope
- [ ] Constraint types: TAG, ATTRIBUTE, BRAND, SCHEDULE, LOCATION
- [ ] Strength levels: REQUIRED, PREFERRED, EXCLUDED
- [ ] Buyer vs seller origin tracking
- [ ] Contract envelope lock at acceptance (frozen scope)

---

## Phase 5: Fulfillment Model (Matching and Allocation)

- [ ] Resource models for material and service capacity
- [ ] Availability/state modeling
- [ ] FulfillmentAllocation records (line item -> resource)
- [ ] Conformance snapshot (required met, preferences met)
- [ ] Conformance evaluator (required met + preference scoring + explanations)

---

## Phase 6: Tasks (Service Execution)

- [ ] Task wrapper for service line items
- [ ] Task decomposition and assignment rules
- [ ] Post-acceptance refinement without change orders
- [ ] Enforcement of plan vs envelope boundary (allowed changes)

---

## Phase 7: Quote-to-Order Migration

- [ ] Support grouped line items (parent/child)
- [ ] Assembly expansion into component demands
- [ ] Interop: derive SO/PO from accepted quote revision (source of truth stays quote)
- [ ] Full SO migration to event-store pattern (after fulfillment is stable)
