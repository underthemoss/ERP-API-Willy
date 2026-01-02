# Prices: Agentic Product Wizard (Frontend Integration)

Goal: let a user type “create a f150 product”, have the agent **derive sources**, **decompose facts into attributes + context tags**, and persist a **Studio catalog product** that Pricing can reference via `catalogRef { kind, id }`.

Canonical modeling rules (required reading):
- `docs/canonical-vocabulary-product-composition-contract.md`
- For material products: `docs/material-product-attributes-and-tags.md`

## Where this lives (important)

The “Studio Agent” is a **backend capability** (agent + tool runtime + Studio catalog/FS). The UI that hosts the wizard can live **inside the ERP Prices domain** (e.g., the “Create Product” flow in Pricing), not only in a `/studio` section.

## Backend surfaces the frontend calls

- Agent orchestration (chat): `POST /api/agent/chat`
- Tool execution runtime: `/api/mcp` (Streamable HTTP)
- Business APIs: `POST /graphql`
- Auth cookie exchange (needed for `<img src>` calls): `POST /api/auth/set-cookie` (send `Authorization: Bearer ...` once after login, with `credentials: "include"` so the browser stores the cookie)
- Auth debug (cookie sanity check): `GET /api/auth/me` (should return 200 once cookie is set; returns 401 if cookie not sent/invalid)
- Optional UI-only StudioFS CRUD (file explorer): `POST /api/studio/fs/*` (not required for the wizard MVP)

## Image endpoints: why you’re seeing `401 Unauthorized`

Price images are fetched via `<img src="http://localhost:5001/api/images/prices/PR-...">`.

Because `<img>` cannot send `Authorization` headers, `/api/images/*` requires an **HttpOnly auth cookie**. You must set it once after login:

```ts
await fetch(`${API_URL}/api/auth/set-cookie`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
  credentials: 'include',
});

// Debug: confirms cookie is stored + sent
await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
```

Troubleshooting checklist:
- If you still get `401`: open DevTools → Network → the image request → Request Headers and confirm it includes `Cookie: es-erp-jwt=...`.
- If the cookie never appears: confirm the `set-cookie` call is client-side (not SSR), uses `credentials: "include"`, and you’re not mixing `localhost` with `127.0.0.1`.
- If you get `403`: you’re authenticated but missing permission to read that price; ensure you set the cookie using the same token you use for GraphQL.

## Tool surfaces to provide to the agent (wizard phase)

In the Product Wizard phase, send a narrow tool set:

- **Workspace draft vocab (resolve-first)**: `docs/workspace-vocabulary-mcp-tools.json`
  - `resolve_global_or_workspace_tag`
  - `resolve_global_or_workspace_attribute_type`
  - `resolve_global_or_workspace_unit_definition`
  - `resolve_global_or_workspace_attribute_value` (optional; use for ENUM-ish values)
- **Catalog persistence + validation**
  - `studio_catalog_create_product` (MCP): writes `/catalogs/<slug>/products/<id>.jsonc`
  - `studio_catalog_validate` (MCP): lints the catalog (tags-as-measurements, blended attribute keys, etc.)
  - Tool definitions: `docs/studio-mcp-tools.json`
- **Internet sources**
  - `brave_search` (MCP): uses `BRAVE_SEARCH_API_KEY` (see `.env.example`)
  - `fetch_url` (MCP; alias `web.fetch`): fetches + extracts the selected URL (tables + text) so the agent can quote exact spec rows (tool definitions: `docs/web-mcp-tools.json`)
  - Prefer Brave search results as the source of truth; only fetch URLs when needed.
  - Prefer `fetch_url` in OpenAI tool definitions (function names are safest with `[a-zA-Z0-9_-]`).
  - If `fetch_url` is not provided, the agent cannot meet “no guessing + per-attribute quote” requirements for spec harvest mode.

## The wizard loop (FE orchestration)

1) **Start chat**
   - Call `POST /api/agent/chat` with:
     - `workspaceId`
     - a system prompt (recommended: `docs/studio-product-wizard-system-prompt.txt`)
     - tool definitions (from the JSON tool lists above)

2) **Execute tool calls**
   - If the assistant returns `tool_calls`, execute each by calling `/api/mcp`.
   - Append each tool result back into the message list as a `role: "tool"` message (matching `tool_call_id`).
   - Call `/api/agent/chat` again.

3) **Draft review step (required)**
   - When the agent produces a draft product object, render it in a review UI:
     - `id`, `name`, `kind`, `tags[]`, `attributes[]`, `sourceRefs[]`
     - show a summary like “Reused N global atoms / Created M workspace draft atoms” (from the resolver tool results)
   - Provide an “Edit in manual composer” escape hatch (don’t block on perfection).
   - `targetSpecs` is **service-only**: omit it entirely for material/assembly products; for service products only send it when non-empty (no placeholders).
   - De-duplicate tags/context tags before rendering and persistence (`Array.from(new Set(tags))`) to avoid duplicate React keys and duplicated atoms.

4) **Persist**
   - On explicit user confirmation, execute the agent tool call `studio_catalog_create_product`.
   - The tool returns a `catalogRef { kind, id }` for Pricing.

5) **Validate**
   - Immediately execute `studio_catalog_validate` for the catalog (default: `/catalogs/default`).
   - If validation errors exist, show them and block “continue to pricing” until resolved.

6) **Continue to price creation**
   - Use the returned `catalogRef` as the product identity when creating the price.

Important UX rule:
- A product **can exist without a price**. If the user cancels price creation after product creation, keep the product and allow returning later to price it (by selecting the same `catalogRef`).

## Pricing: how to attach prices to products (GraphQL)

New prices should reference the catalog product:

`catalogRef: { kind: MATERIAL_PRODUCT|SERVICE_PRODUCT|ASSEMBLY_PRODUCT, id: "<productId>" }`

The wizard tool `studio_catalog_create_product` returns exactly this `catalogRef`.

Examples:

### Rental/Sale price (either `pimCategoryId` OR `catalogRef`)
```graphql
mutation CreateRentalPrice($input: CreateRentalPriceInput!) {
  createRentalPrice(input: $input) { id priceType catalogRef { kind id } }
}
```

```json
{
  "input": {
    "workspaceId": "WS_123",
    "catalogRef": { "kind": "MATERIAL_PRODUCT", "id": "ford_f150_2024_xlt" },
    "priceBookId": "PB_123",
    "pricePerDayInCents": 10000,
    "pricePerWeekInCents": 50000,
    "pricePerMonthInCents": 150000
  }
}
```

### Service price (requires `catalogRef` + `pricingSpec`)
```graphql
mutation CreateServicePrice($input: CreateServicePriceInput!) {
  createServicePrice(input: $input) { id priceType catalogRef { kind id } pricingSpec { kind unitCode rateInCents } }
}
```

```json
{
  "input": {
    "workspaceId": "WS_123",
    "catalogRef": { "kind": "SERVICE_PRODUCT", "id": "landscaping_hourly" },
    "priceBookId": "PB_123",
    "pricingSpec": { "kind": "TIME", "unitCode": "HR", "rateInCents": 6500 }
  }
}
```

## “Resolve-first” atom usage (what FE should enforce)

Even when the agent is drafting, the FE should ensure the workflow stays deterministic:
- Prefer **reuse-first resolution** (`resolve_global_or_workspace_*`) over raw “create” calls.
- Persist only canonical strings returned by resolution:
  - Tag labels → `product.tags[]` and `attributes[].contextTags[]`
  - Attribute type names → `attributes[].key` (atomic, no underscores)
  - Unit codes → `attributes[].unit`
- Require at least one source:
  - `product.sourceRefs[]` must include the Brave-selected URL(s)

## Spec Harvest Loop (deterministic, attributes-first)

When the user asks “harvest specs” / “look up specs”:

### A) Draft shape: match the product schema

The backend product schema is:
- `product.tags[]` (taxonomy/discovery nouns)
- `product.activityTags[]` (service-only; verbs/actions)
- `product.attributes[]` where each entry is `{ key, value, unit?, contextTags?, sourceRef? }`

Avoid introducing a separate top-level `contextTags[]` or splitting into `brandAttributes[]/physicalAttributes[]` unless you have a reliable transformation step before calling `studioCatalogCreateProduct` / `studio_catalog_create_product`. The simplest (and least bug-prone) approach is to keep a single `attributes[]` array and treat “brand vs physical” as a UI grouping only.

### B) Loop steps (recommended)

1) **Find sources** (Brave) and pick 1–3 authoritative URLs (OEM PDF/spec page preferred).
2) **Fetch and extract** rows (via `fetch_url`) into a neutral intermediate structure:
   - `{ label, rawValue, sourceUrl, quote }`
3) **Decompose each row into atoms**:
   - Choose an atomic PHYSICAL attribute `key` from the global seed (never invent PHYSICAL types).
   - Parse `rawValue` into `{ numericValue, unitCode }` and normalize unit codes.
   - Attach qualifiers/components as `contextTags[]` (resolved tags, snake_case).
4) **Resolve-first (reuse global)**:
   - `resolve_global_or_workspace_attribute_type` for the chosen attribute key (should return GLOBAL for PHYSICAL).
   - `resolve_global_or_workspace_unit_definition` for the unit code (normalize aliases like `cu in`, `km/hr`, `gal/hr`).
   - `resolve_global_or_workspace_tag` for each context tag and taxonomy tag.
5) **Write into the draft product**:
   - Add/update `attributes[]` entries (same `key` allowed multiple times when context differs).
   - Always include `sourceRef` for spec-derived facts (URL + a short quote).
6) **Human review** (required) → then persist → then validate.

### C) Deterministic mapping rules (avoid vocabulary drift)

**Rule 1 — never create PHYSICAL attribute types**
- If a spec row doesn’t map cleanly, don’t invent a new PHYSICAL key; instead:
  - map to an existing measurable base key (using units to decide), and
  - put the “what/qualifier” into `contextTags[]`.
- If you truly cannot map (rare), add it to `questions[]` so the global seed can be expanded.

**Rule 2 — use units + label semantics to select the base attribute**
- `lb/kg/oz/ton` with “weight/capacity/load” language → `weight` (MASS) with unit `LB/KG/...`
- “force” rows (bucket breakout, traction, drawbar pull, lift force) → `force` (FORCE) with unit `LBF` (even if the table writes “lb”)
- `psi/kPa/MPa/bar` → `pressure`
- `mph/kph/mps` (including `mile/h`, `ft/min`) → `speed` (normalize `ft/min` to unit `FT_MIN`)
- `gpm/lpm/gal/hr/l/hr` → `flow`
- `hp/kW/W` → `power`
- `ft-lb/Nm` → `torque`
- `rpm/Hz` → `frequency`
- `gal/L/qt/cu in/in³/yd³` → `volume` (and add context tags like `fuel`, `tank`, `engine`, `displacement`)
- Unitless numeric rows (counts like “Drive Pumps: 1”, “Track Motors: 2”, “Number of Shoes: 40”) → `count` with context tags (don’t invent `number_of_shoes` keys)

**Rule 3 — contextual tokens are tags, not attribute keys**
- Avoid keys like `wheelbase`, `tipping_load`, `bucket_breakout_force`, `fuel_tank_capacity`.
- Preferred:
  - `length` + context `["wheelbase"]`
  - `weight` + context `["tipping"]`
  - `force` + context `["bucket","breakout"]`
  - `volume` + context `["fuel","tank"]`

**Rule 4 — services use BOTH tags and activityTags**
- `tags[]`: domain nouns (“landscaping”, “concrete_work”, “hvac”)
- `activityTags[]`: verbs/actions (“install”, “repair”, “inspect”)
- Don’t drop tags for services; they are the discovery layer.

**Rule 5 — don’t mint numeric/percent tags**
- Conditions like “65% of full load” should be stored in `sourceRef`/notes/quote, not as a tag like `sixty_five_percent`.

If you need an “operator” UI (non-agent), the same APIs apply:
- Use GraphQL for lists/search/admin
- Use Studio catalog GraphQL (`studioCatalogCreateProduct`, `studioCatalogValidate`) for product persistence
- Use Prices GraphQL mutations for price creation
