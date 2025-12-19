Resource Map Overview
=====================

Purpose
-------
Resource Map is a tag-based system for establishing the "home base" of resources
within a tenant/workspace. Tags are defined in the resource map catalog and then
assigned to resources that matter for operations.

Resources in scope:
- Inventory
- Person contacts

Out of scope (for now):
- Projects
- External/business contacts

Tag Types
---------
- LOCATION
- BUSINESS_UNIT
- ROLE (person contacts only)

Rules and Validation
--------------------
- Inventory:
  - Allowed tag types: LOCATION, BUSINESS_UNIT
  - Receiving inventory requires at least one LOCATION tag
- Person contacts:
  - Allowed tag types: LOCATION, BUSINESS_UNIT, ROLE
  - Must include at least one LOCATION or BUSINESS_UNIT tag
- Business contacts:
  - Allowed tag types: LOCATION, BUSINESS_UNIT (optional)

Notes
-----
- Tag hierarchy (corporate > region > branch > bin) is supported by the
  catalog's parent/path fields, but compliance rules are not enforced yet.
- Inventory supports a primary `resourceMapId` and an optional `resourceMapIds`
  list for additional tags.
