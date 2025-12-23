# Service, Material, and Assembly Composition

This doc captures the current thinking for:
- service product composition
- material product composition
- assemblies (composite products)

The goal is to support:
- flexible tagging without forced hierarchy
- normalized physical attributes (QUDT or equivalent)
- brand metadata that is not physical
- composable assemblies that can include services and materials

---

## Core Concepts

### Service Products
Service products represent work performed. They are classified by:
- service taxonomy tags (flat at creation)
- activity tags (flat)

Service products are priced by unit (QUDT), flat, time, or tiered models.

### Material Products
Material products represent physical goods. They are classified by:
- material taxonomy tags (flat at creation)
- physics attributes (normalized units)
- brand attributes (non-physical key/value metadata)

### Assemblies
Assemblies are composite products. They can include:
- material products
- service products
- other assemblies

Assemblies can be priced by roll-up (sum of components) or override.

---

## Global Tags and Attributes

Tags and attribute definitions are global. This enables:
- consistent decomposition across workspaces
- centralized curation in an admin/global environment
- agent access to a shared library of tags and attributes

Users can either:
- type a string that is decomposed into global tags, or
- pick from the global library directly.

## Tagging Model (Flat, Emergent Structure)

Taxonomy is not forced into a hierarchy at creation. It stays flat and can be
curated later by an LLM or admin.

Optional later:
- taxonomy relations can express broader/narrower/related links
- hierarchy can emerge from relationships, not from creation rules

Suggested relation shape:
- `ServiceTaxonomyRelation` / `MaterialTaxonomyRelation`
  - `from_tag_id`
  - `to_tag_id`
  - `relation_type` (BROADER, NARROWER, RELATED, ALIAS)
  - `confidence`
  - `source` (llm, human, import)

---

## Service Product Composition

### Data Shape (Conceptual)

`ServiceProduct`
- `id`
- `workspace_id`
- `name`
- `description`
- `service_taxonomy_tag_ids[]` (flat)
- `activity_tag_ids[]` (flat)
- `default_unit_code` (QUDT, e.g. `unit:H`, `unit:MI`, `unit:EA`)
- `pricing_model` (UNIT, FLAT, TIME, TIERED)
- `status`

### Example
Service: "Rock Delivery"
- service taxonomy tags: `logistics`, `materials`
- activity tags: `delivery`, `hauling`
- default unit: `unit:MI`
- pricing: $4 / mile

---

## Material Product Composition

Material products are built from:
- material taxonomy tags
- physics attributes (QUDT)
- brand attributes (non-physics)

### Brand Attributes (Non-Physics)
Examples:
- manufacturer
- sku
- product_family
- make
- model
- brand

Brand attributes are key/value pairs. They are not physical properties.

### Physical Attributes (Normalized Units)
Examples:
- length, width, height
- weight, density, volume
- color (optical property)

Physical attributes are numeric, normalized to canonical units, and filterable by range.

### Context Tags for Physical Attributes
Physical attributes can be scoped by taxonomy tags to express context:
- "weight + bucket" == weight attribute with context tag `bucket`
- "thickness + door panel" == thickness attribute with context tag `door_panel`

### Data Shape (Conceptual)

`MaterialProduct`
- `id`
- `workspace_id`
- `name`
- `description`
- `brand_id`
- `material_taxonomy_tag_ids[]` (flat)
- `physical_attributes[]`
- `brand_attributes[]`
- `pim_product_id?`

`PhysicalAttributeType`
- `id`
- `name` (weight, length, thickness)
- `dimension` (MASS, LENGTH, AREA, VOLUME, DENSITY)
- `allowed_unit_codes[]`
- `canonical_unit_code`

`PhysicalAttributeValue`
- `attribute_type_id`
- `value`
- `unit_code` (QUDT or equivalent)
- `value_canonical` (normalized to canonical unit)
- `context_tag_ids[]` (optional)

`BrandAttributeValue`
- `key`
- `value`
- `value_type` (optional)

### Example
Material: "White Oak Door Panel"
- material taxonomy tags: `wood`, `white_oak`, `panel`
- brand attributes: `manufacturer=Acme`, `sku=WO-24x30`
- physical attributes:
  - width: `24` `unit:IN` (context `door_panel`)
  - height: `30` `unit:IN` (context `door_panel`)
  - thickness: `0.75` `unit:IN` (context `door_panel`)
  - weight: `12` `unit:LB` (context `door_panel`)

---

## Assemblies (Composite Products)

Assemblies allow reuse of multi-part offerings like cabinetry runs or
predefined kits. They can include services and materials.

### Data Shape (Conceptual)

`Assembly`
- `id`
- `workspace_id`
- `name`
- `description`
- `status`
- `pricing_mode` (ROLLUP, OVERRIDE)

`AssemblyLine`
- `assembly_id`
- `component_type` (MATERIAL, SERVICE, ASSEMBLY)
- `component_id`
- `quantity`
- `unit_code`
- `optional` (boolean)

Assemblies can nest. Cycles should be prevented.

### BOM State (No Formal Versioning Required)
We can support draft-to-active workflows without introducing formal versioning:
- `BOM` can have `status` (DRAFT, ACTIVE, ARCHIVED)
- editing a DRAFT does not affect the ACTIVE BOM
- switching ACTIVE can be treated as a state change rather than versioning

If later needed, we can add explicit version fields without changing the core model.

---

## Quote Composition (Service + Material + Assembly)

Quotes should support grouped line items:
- top-level service scope (group)
- child items: service products, material products, assemblies

This allows:
- readable proposals ("Kitchen Cabinetry - Base Cabinets")
- structured pricing and fulfillment
- breakdown into services + materials

### Example Pattern
Top-level group: "Kitchen Cabinetry - Base Cabinets"
- child service: "Fabrication - Base Cabinets"
- child service: "Installation - Base Cabinets"
- child material: "Soft Close Drawer Set"
- child material: "Spice Rack Pull-Out"
- child material: "Toe Kick"

Allowances:
- separate line items with type ALLOWANCE (price-only)

Delivery:
- service product with `unit:MI` or `unit:JOB`

---

## Buyer vs Seller Precision in Demand and Fulfillment

The buyer expresses *demand*, the seller executes *fulfillment*. These views
should be compatible but not identical.

- Sellers want specifications that are *precise enough* to fulfill the work
  but *not so narrow* that they restrict inventory or labor options.
- Buyers can influence desired attributes, but sellers retain flexibility in
  how to satisfy the demand as long as constraints are met.

### Example: Equipment Rentals
A buyer might request a skid steer with a weight range of 6-8k lbs.
This is a taxonomy + attribute constraint that broadens eligibility.

The seller does not want "John Deere 300 skid steer 2025" as a default
because it unnecessarily narrows the fulfillment pool. Specific models
can be captured as preferences or optional constraints.

### Role of Taxonomy and Attributes
Taxonomy tags + normalized attributes provide the precision-flexibility balance:
- tags describe the category and capability
- attributes constrain ranges (weight, size, capacity)
- optional preferences can refine without restricting eligibility

### Services, Tasks, and Post-Approval Refinement
A service line item signals that a *human resource* will be assigned.
Tasks are *service wrappers* that let the seller decompose work into
assignable units (people, time blocks, locations).

Key constraint:
- Orders should not be changed after approval without a change order.
- Refinement of “how the work is done” happens in tasks, not by mutating
  the order line items.

This preserves contractual integrity while allowing operational precision.

---

## LLM Decomposition (Service Creation)

Goal: user types a string, LLM proposes service + tags.
No hierarchy is required at creation.

Example input:
"Heavy hauling $4/mile"

LLM output (conceptual):
```
{
  "service_name": "Heavy Hauling",
  "service_taxonomy_tags": ["logistics", "materials"],
  "activity_tags": ["hauling"],
  "unit_code": "unit:MI",
  "price_hint": { "rate_cents": 400, "unit_code": "unit:MI" }
}
```

New tags can be suggested but should be confirmed by the user before creation.

---

## Pricing Notes

- Pricing remains separate from product creation.
- Multi-currency is not required right now.
- Existing price book model is acceptable; extensibility comes from
  supporting more pricing kinds (UNIT, TIME, TIERED, FORMULA, BUNDLE).

## Open Questions / Follow-ups

- Which unit list do we want to allow by default for services vs materials?
- Do we need explicit pricing kinds beyond UNIT/RENTAL in the near term?
- When should we introduce explicit BOM versioning (if ever)?
- Should tag relations be curated per workspace or global?
