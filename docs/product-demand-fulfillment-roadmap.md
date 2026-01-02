# Product Demand/Fulfillment Roadmap

This roadmap turns the thesis into a staged, pragmatic build plan.
Progress is tracked inline using checkboxes.

Legend:
- [ ] not started
- [~] in progress
- [x] done

---

## Recent Updates

- [x] Harden studio conversations (soft delete timestamp, atomic message counters, workingSet validation, lastMessageAt/titleLower indexes)
- [x] Add StudioFS service + REST/GraphQL endpoints, catalog init/validate, and MCP tools for catalog curation
- [x] Expand CORS config for local Studio dev (headers, methods, exposed ETag, localhost/127.0.0.1 origins)
- [x] Disable CORS credentials in dev to enforce Bearer-only local auth
- [x] Revert local API port to 5001 to avoid system listener conflicts on 5000
- [x] Register full StudioFS MCP toolset (roots/list/read/write/upload/mkdir/move/delete + catalog init/validate)
- [x] Draft Studio catalog JSON schemas (product, list, compiled index)
- [x] Wire Studio catalog compile/preview (file-based products/lists + .catalog outputs)
- [x] Add ServiceProduct target spec support in Studio catalog schemas and compilation
- [x] Refactor logistics product seeding into StudioFS service (`ensureLogisticsServiceProducts`)
- [x] Add backend sync for logistics add-ons (`syncMaterialLogisticsAddOns`) so Quote/SO/Storefront don't re-implement delivery/pickup line item creation
- [x] Add `listLogisticsServiceGroups` query (document logistics group picker)
- [x] Mirror Studio conversations to StudioFS (/conversations) on create/update/message
- [x] Persist /api/agent/chat messages into Studio conversations (auto-create + FS snapshots)
- [x] Document quote line item model with service-target selectors (docs/quote.md)
- [x] Add extensible quote/RFQ line item fields (product_ref, time/place, constraints, target selectors)
- [x] Document wrapper alignment for canonical LineItems (docs/order-wrappers-line-items-and-parties.md)
- [x] Quote revisions sync to canonical line_items (and send/accept read canonical line items first)
- [x] Expose canonical `lineItems` on SalesOrder and PurchaseOrder
- [x] Add `LineItem.sourceLineItemId` lineage field
- [x] Cut over intake submissions (storefront carts) to canonical `line_items` (`documentRef.type = INTAKE_SUBMISSION`)
- [x] Add bulk admin promotion for workspace draft attribute types/values (reduce curation friction)
- [x] Expand physics unit registry + parsing (qt, gal/hr, L/hr, km/hr, cu in; commas/leading decimals)
- [x] Derive SERVICE `unitCode` from selected ServicePrice to avoid unit mismatches during quote saves

## Global Vocabulary Refactor (What/Why/New Model)

What we are doing:
- Reduce the ontology to two global libraries: `GlobalTag` (words) and `GlobalAttributeType` (measurable/identity schemas).
- Enforce **atomic** PHYSICAL attribute types (no blended names like `battery_capacity`).
- Treat “taxonomy”, “activity”, and “context” as **rendered usage views**, not first-class stored types.

Why we are doing it:
- Prevent ontology drift by keeping semantics composable (LEGO-like): base attributes + tags as qualifiers.
- Keep the frontend “dumb”: CRUD + search + curation actions; backend enforces invariants and normalization.
- Support agentic ingestion without making “parsing” a schema dependency (validation + curation governs writes).

What the new model is:
- `GlobalTag`: single pool with `label` (canonical snake_case), optional `displayName`, `pos` (NOUN/VERB hint), `synonyms[]`, governance (`status`, `auditStatus`), and optional `mergedIntoId`.
- `GlobalAttributeType`: `PHYSICAL` (dimension + units) or `BRAND` (no units), always atomic.
- “Context” is emergent by placement: any `GlobalTag.id` may appear in `context_tag_ids[]` on values/parameters.

## Phase 0: Documentation and Alignment

- [x] Draft thesis and core primitives (`docs/product-demand-fulfillment-thesis.v2.md`)
- [x] Draft service/material/assembly composition doc (`docs/service-material-assemblies.md`)
- [x] Draft global vocabulary spec (`docs/global-vocabulary.md`)
- [x] Draft model audit doc (`docs/product-demand-fulfillment-model-audit.md`)
- [x] Archive prior global vocabulary docs (`docs/archive/`)
- [ ] Align terminology with product, pricing, and fulfillment teams
- [ ] Define document party invariants (buyer/seller role symmetry across all documents)
- [ ] Define contract envelope vs execution plan invariants (what changes require change orders)

---

## Phase 1: Global Vocabulary (Tags and Attributes)

- [x] Define GlobalTag model (single pool + governance) (`docs/global-vocabulary.md`)
- [x] Define GlobalTag relations (optional curated edges) (`docs/global-vocabulary.md`)
- [x] Implement GlobalTag `pos` hint (NOUN/VERB) and remove hard facets (render roles from usage)
- [x] Implement global tag models (global_tags, global_tag_relations) in global DB
- [x] Add global tag GraphQL API (list/search/create/update/relations + ingestion)
- [x] Add admin CRUD API for global tags/relations
- [x] Add admin merge API for GlobalTag (repoint references + deprecate source)
- [x] Define GlobalAttributeType model (PHYSICAL vs BRAND, unit normalization)
- [x] Implement global attribute values/relations/units models (separate DB)
- [x] Add audit status for auto-activation + later curation
- [x] Seed minimal global unit definitions (LB, KG, IN, FT, M, MI, HR, MIN, SEC, DAY, L, GA)
- [x] Seed QUDT-aligned core physics units + atomic attribute types (`docs/archive/global-attribute-seed-data.md`)
- [x] Seed common qualifier tags used in `context_tag_ids[]` (overall, operating, max, capacity, etc)
- [x] Add decomposition rules for attribute ingestion (blended strings -> atomic types + context tags)
- [x] Deprecate blended attribute types (use atomic types + context tags)
- [x] Add free-form ingestion mutation (string -> canonical attribute type/value)
- [x] Regenerate schema/codegen for global attribute changes
- [x] Validate ingestion with enum + numeric smoke cases
- [x] Add admin CRUD API for global attribute types/values/units
- [~] Wire admin UI to global attribute CRUD (list/search/create/update)
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

- [x] LineItem schema with constraint envelope (canonical `line_items` collection + service)
- [ ] Constraint types: TAG, ATTRIBUTE, BRAND, SCHEDULE, LOCATION
- [ ] Strength levels: REQUIRED, PREFERRED, EXCLUDED
- [ ] Buyer vs seller origin tracking
- [ ] Contract envelope lock at acceptance (frozen scope)
- [~] Unify wrapper line item storage on canonical LineItems (PO → QuoteRevision → SO)
- [x] Storefront demand line items stored in canonical `line_items` (INTAKE_SUBMISSION)

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
