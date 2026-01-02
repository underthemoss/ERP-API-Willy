# Studio Catalogs

This folder is a filesystem-first workspace for composing a product catalog from
Global Vocabulary atoms (tags + attribute types/values) before any DB-backed
catalog model exists.

Each catalog lives in its own folder under `studio/catalogs/<catalog_slug>/` and
exposes a single “catalog view” file: `catalog.jsonc`.

In the Studio app’s workspace filesystem, the intended root is `/catalogs/`
(this repo’s `studio/catalogs/` folder is a template/reference implementation).

Recommended:
- Keep tag references as canonical `GlobalTag.label` strings (snake_case).
- Keep attribute type references as canonical `GlobalAttributeType.name` strings.
- Keep unit references as canonical unit codes (e.g., `KG`, `MM`, `KW`).

Schema:
- `studio/catalog.schema.json`
