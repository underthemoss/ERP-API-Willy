# Product Model Canon

> ARCHIVED / DEPRECATED
>
> This document references an older facet-based tag model. The current spec is:
> - `docs/global-vocabulary.md`
> - `docs/workspace-vocabulary.md`
> - `docs/material-product-attributes-and-tags.md`

This document defines the smallest complete product-layer model for the
platform. It is product-only: it excludes inventory instances, people,
projects, orders, and fulfillment.

References:
- `docs/global-tag-library.md`
- `docs/global-attribute-library.md`
- `docs/service-material-assemblies.md`

---

## Atomic Elements (smallest complete set)

### Atom A: GlobalTag
Purpose: define substitutable classes and context qualifiers.

- Facets: SERVICE_TAXONOMY, MATERIAL_TAXONOMY, ACTIVITY, CONTEXT (browsing only)
- Single facet per tag.
- Relations: ALIAS, BROADER, NARROWER, RELATED (facet-constrained).
- Products never invent their own category semantics; they only bind tags.

### Atom B: GlobalAttributeType
Purpose: define canonical attribute concepts used by products.

- kind: PHYSICAL | BRAND
- valueType: NUMBER | STRING | ENUM | BOOLEAN | REF
- For PHYSICAL: dimension, canonical_unit, allowed_units[]
- Governance: global-only, deprecate + relations, no ad-hoc attributes

### Atom C: PhysicalAttributeValue (product-level)
Purpose: store nominal/spec measurements for material products.

- attribute_type_id (GlobalAttributeType.kind=PHYSICAL)
- value, unit_code, value_canonical
- context_tag_ids[] (optional; any GlobalTag id)
- source (measured | estimated | inferred)

### Atom D: BrandAttributeValue (product-level)
Purpose: store identity metadata for material products.

- attribute_type_id (GlobalAttributeType.kind=BRAND)
- value
- value_ref_id (optional for REF types)

No key/value brand attributes are allowed.

### Atom E: ServiceAttributeSchema (product-level)
Purpose: declare the parameter vocabulary for a service product.

- attribute_type_id (GlobalAttributeType)
- requirement_level (REQUIRED | OPTIONAL)
- default_unit_code
- default_range (optional)
- context_tag_ids[] (optional; any GlobalTag id)

This is not a task or execution plan. It is the parameter schema only.

### Atom F: BOM and BOMLine
Purpose: define compositional products (assemblies).

- BOM: { id, assembly_product_id, status: DRAFT | ACTIVE | ARCHIVED }
- BOMLine: { bom_id, component_ref, quantity, unit_code, optional, notes? }

---

## CatalogRef (component_ref)

Assemblies should refer to components via a single union reference:

```
CatalogRef = { kind, id }
```

Allowed kinds:
- MATERIAL_PRODUCT
- SERVICE_PRODUCT
- ASSEMBLY_PRODUCT
- PIM_PRODUCT
- PIM_CATEGORY

This keeps the assembly ontology closed while remaining compatible with PIM.

---

## Canonical Product Definitions

### MaterialProduct
Definition of a tangible thing.

```
MaterialProduct
- id
- name, description
- material_taxonomy_tag_ids[]
- physical_attributes[]: PhysicalAttributeValue[]
- brand_attributes[]: BrandAttributeValue[]
- pim_product_id? (optional bridge)
```

Boundary: serial numbers, lots, condition, and location are inventory-only.

### ServiceProduct
Definition of a service/capacity offering.

```
ServiceProduct
- id
- name, description
- service_taxonomy_tag_ids[]
- activity_tag_ids[]
- service_attribute_schema[]: ServiceAttributeSchema[]
- default_unit_code? (optional)
```

Boundary: tasks, assignments, schedules are not part of the product.

### AssemblyProduct
Definition of a compositional product.

```
AssemblyProduct
- id
- name, description
- tags? (optional, for search)
- active_bom_id?
```

---

## Composition Mechanics

1) Products = bindings of global tags + global attributes.
2) Assemblies = compositions of product references (BOM lines).
3) Tags define class membership; attributes define fitness/identity.

---

## Product Model Refinements (invariants)

- Use GlobalAttributeType everywhere. Do not create a separate
  PhysicalAttributeType system.
- Brand attributes are typed (attribute_type_id), never key/value.
- Context is determined by placement: any GlobalTag.id may appear in
  context_tag_ids[] when used to qualify a value.
- Service products store parameter schemas, not measured constants.
- BOM lines use CatalogRef rather than component_type + component_id.

---

## Out of Scope

Inventory instances, people/crew, projects/jobs, orders/quotes, fulfillment.
These should reference product IDs and global vocabulary, but are not part of
the product model itself.
