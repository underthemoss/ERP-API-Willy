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

Location Metadata (LOCATION tags)
---------------------------------
- Optional, map-friendly metadata attached to LOCATION tags only.
- Supported location kinds:
  - ADDRESS (structured address with optional lat/lng)
  - LAT_LNG (point)
  - PLUS_CODE (Google Plus Codes with optional lat/lng)
  - GEOFENCE (CIRCLE or POLYGON)
- BUSINESS_UNIT and ROLE tags must not include location metadata.

Interior Metadata (LOCATION tags)
---------------------------------
- Optional metadata for indoor/warehouse organization.
- Fields include:
  - floor
  - spaceType (e.g., RACK, BIN, AISLE)
  - code (freeform identifier)
  - qrPayload (auto-generated; currently uses the tag ID)

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
- PLUS_CODE locations can inherit a plus code from the nearest ancestor when
  one is not provided.

CRUD and Map Queries
--------------------
Mutations:
- createResourceMapTag
- updateResourceMapTag
- deleteResourceMapTag (supports `cascade` to delete descendants)

Queries:
- listResourceMapEntries
- listResourceMapEntriesByParentId
- listResourceMapEntriesByTagType
- listResourceMapLocationTags (optional bounds/near filters for map views)
