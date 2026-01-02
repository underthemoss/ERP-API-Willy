# Studio Agent Frontend Integration Guide

This guide is for the Studio frontend engineer. It explains how to wire the
agent chat, tool execution, StudioFS, and GraphQL together without mixing their
responsibilities.

Terminology note:
- “Studio agent” refers to the **agent + tool runtime + Studio catalog/FS backends**.
- The UI that hosts the agent can live **anywhere** in the ERP app (e.g., inside
  the Prices flow’s “Create Product” wizard), as long as it calls the same API
  surfaces below.

## 1) API surfaces (what lives where)

- `/api/agent/chat` (REST): The agent conversation loop. You send messages + tool
  definitions; it returns assistant messages and tool calls. It also persists
  Studio conversations when `workspaceId` is provided.
- `/api/mcp` (MCP over Streamable HTTP): Executes tool calls issued by the agent
  (e.g., `studio_fs_read`, `studio_catalog_validate`). This is the tool runtime.
- `/api/studio` (REST): Direct StudioFS CRUD for the UI (file explorer,
  uploads, validation). This is for UI interactions, not the agent.
- `/graphql` (GraphQL): Business data and vocabulary (workspaces, contacts,
  global tags/attributes/units, studio conversation list/history).

Keep these concepts separate: GraphQL = data model; StudioFS = files; MCP = tool
execution for the agent; Agent chat = orchestration.

## 2) Agent flow in the UI

### A. Intent discovery phase
1) Use the system prompt in `docs/studio-intent-discovery-system-prompt.txt`.
2) Do not expose tools in this phase.
3) The agent should ask which intent to proceed with and wait for confirmation.

### B. Catalog curation phase
1) Swap system prompt to `docs/studio-catalog-agent-system-prompt.txt`.
2) Provide only `studio_*` tools (see `docs/studio-mcp-tools.json`).
3) Include runtime context: `workspaceId`, active/pinned catalog, and the
   working set (active file, open files, selected folder).

### C. Product wizard (chat → draft → create) phase
1) Use a dedicated system prompt that emphasizes the vocabulary/ontology rules
   (Global vs Workspace draft) and requires explicit user confirmation before
   persistence.
   - Suggested prompt: `docs/studio-product-wizard-system-prompt.txt`
   - Canonical contract (single source of truth): `docs/canonical-vocabulary-product-composition-contract.md`
   - For material products, follow `docs/material-product-attributes-and-tags.md`
     (attributes define the product; tags are only taxonomy + attribute context).
   - Frontend implementation checklist (Prices domain): `docs/prices-agentic-product-wizard-frontend.md`
2) Provide a narrow tool surface:
   - Workspace draft vocab tools (fast path): `docs/workspace-vocabulary-mcp-tools.json`
   - Studio catalog create/validate tools as needed (product persistence)
    - Optional web lookup tools:
      - Prefer `brave_search` for finding sources (requires `BRAVE_SEARCH_API_KEY`)
     - Use `fetch_url` (alias `web.fetch`) only when you need to fetch/parse a specific URL (tool definitions: `docs/web-mcp-tools.json`)
3) Do **not** expose full StudioFS write tools unless you are explicitly in an
   advanced/manual editing mode.

## 3) /api/agent/chat request shape

The backend accepts OpenAI-style messages and tool definitions.

```json
{
  "messages": [
    { "role": "system", "content": "<system prompt + runtime context>" },
    { "role": "user", "content": "Start catalog curation..." }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "studio_fs_read",
        "description": "Reads a file from the workspace filesystem.",
        "parameters": { "type": "object", "properties": { "workspaceId": { "type": "string" }, "path": { "type": "string" } }, "required": ["workspaceId", "path"] }
      }
    }
  ],
  "model": "gpt-5.2-chat-latest",
  "stream": false,
  "workspaceId": "WS_123",
  "conversationId": "optional-existing-id",
  "title": "optional-title",
  "pinnedCatalogPath": "/catalogs/demo",
  "workingSet": { "activeFile": "/catalogs/demo/catalog.jsonc", "openFiles": [], "selectedFolder": "/catalogs/demo" }
}
```

Notes:
- If `workspaceId` is missing, the backend will **not** persist the chat.
- If `conversationId` is missing, the backend will create one and return it in
  the response **only for non-streaming** calls.
- The backend also tries to extract `workspaceId` from the system message if it
  finds `Current Workspace ID: <id>` (useful as a fallback).

## 4) Tool execution loop (agentic flow)

1) Call `/api/agent/chat` with messages + tools.
2) If the assistant returns `tool_calls`, execute each call via `/api/mcp`.
3) Append tool results as `role: "tool"` messages with matching `tool_call_id`.
4) Call `/api/agent/chat` again with the expanded message list.

Tool message shape:
```json
{
  "role": "tool",
  "tool_call_id": "call_abc123",
  "content": "{\"ok\":true,\"value\":{...}}"
}
```

## 5) /api/mcp usage (tool runtime)

- Use an MCP client over Streamable HTTP to call `/api/mcp`.
- Pass the user JWT as a Bearer token (required).
- Tool names/inputs are defined in `docs/studio-mcp-tools.json`.
- MCP internally calls GraphQL; you do not call GraphQL directly for tool
  execution.

## 6) StudioFS REST endpoints (UI file explorer)

Use `/api/studio` for UI-driven file actions:
- `GET /api/studio/fs/roots?workspaceId=...`
- `POST /api/studio/fs/list` `{ workspaceId, path }`
- `POST /api/studio/fs/read` `{ workspaceId, path }` -> `{ content, etag }`
- `POST /api/studio/fs/write` `{ workspaceId, path, content, expectedEtag }`
- `POST /api/studio/fs/upload` `{ workspaceId, path, bytes, expectedEtag }`
- `POST /api/studio/fs/mkdir` `{ workspaceId, path }`
- `POST /api/studio/fs/move` `{ workspaceId, from, to }`
- `POST /api/studio/fs/delete` `{ workspaceId, path }`
- `POST /api/studio/catalogs` `{ workspaceId, slug, name? }`
- `POST /api/studio/catalogs/validate` `{ workspaceId, catalogPath }`
- `POST /api/studio/catalog/products` `{ workspaceId, catalogPath?, query?, kind?, status?, page? }` -> `{ items[], page }`

### Concurrency requirement
Updates must include `expectedEtag`. Always read or list first and carry the
latest `etag`/`revision` to prevent accidental overwrites.

## 7) GraphQL usage (business data)

Use GraphQL for:
- Workspaces: `getWorkspaceById`, `listWorkspaces`
- Contacts: `listContacts`, `createPersonContact`, `createBusinessContact`, etc.
- Global vocabulary: `listGlobalTags`, `listGlobalAttributeTypes`, `listGlobalUnitDefinitions`
- Workspace draft vocabulary (wizard + curation UIs): `listWorkspaceTags`, `listWorkspaceAttributeTypes`, `listWorkspaceUnitDefinitions`, `listWorkspaceAttributeValues`, and `resolveGlobalOrWorkspace*` (spec: `docs/workspace-vocabulary.md`)
- Studio conversation history: `listStudioConversations`, `listStudioConversationMessages`

GraphQL is **not** for file operations.

Schema reference:
- Generated schema: `src/graphql/schema/generated/schema.graphql`
- Regenerate: `npm run generate:schema`

## 8) Explorer semantics (Curated / Compiled / ERP / Exports)

The file explorer can include virtual nodes. Only some entries map to real
StudioFS paths.

- Curated: real, editable StudioFS files under `/catalogs/<slug>/` (source of
  truth like `catalog.jsonc`, plus `products/`, `lists/`, `assemblies/`, `tasks/`,
  `drafts/`, and `sources/`).
- Compiled: real, derived StudioFS files under `/catalogs/<slug>/.catalog/`
  (generated by `compileCatalog`, read-only in the UI).
- ERP: virtual, read-only views backed by GraphQL list queries (no StudioFS
  path, no file operations, no tool execution).
- Exports: optional; if you generate files, store them under
  `/catalogs/<slug>/exports/` and render as read-only files, otherwise treat
  exports as a virtual list backed by GraphQL.

Agent behavior:
- The catalog agent only edits Curated files. It can read Compiled files for
  context, but must not treat them as source-of-truth.
- The agent cannot read the ERP virtual views unless you explicitly add a tool
  that exposes ERP data.

## 9) ERP folder read-only tabs (visibility UX)

The ERP folder should open a tab in the main editor area that looks like a file
tab but renders a read-only list view.

- Data source: GraphQL list queries scoped by `workspaceId` (e.g.,
  `listContacts`, `listInventory`, `listAssets`, `listProjects`, `listPriceBooks`).
- UX goal: visibility, not full CRUD. Provide search, filters, pagination, and
  a "View in ERP" link; disable create/edit/delete actions.
- Components: reuse the ERP list/table components when possible; otherwise wrap
  them in a read-only shell that matches ERP columns and styling.
- Treat ERP tabs as virtual: no file path, no StudioFS etag, no rename/move.

### Contacts (v1)

Scope: read-only visibility of workspace contacts via GraphQL.

Data source:
- `listContacts(filter, page)` for the table
- `getContactById(id)` for an optional side panel / details drawer

Query example:
```graphql
query ListContacts($filter: ListContactsFilter!, $page: ListContactsPage) {
  listContacts(filter: $filter, page: $page) {
    items {
      __typename
      id
      workspaceId
      contactType
      name
      phone
      notes
      resourceMapIds
      ... on PersonContact {
        email
        personType
        businessId
        business { id name }
      }
      ... on BusinessContact {
        address
        website
        taxId
        brandId
        placeId
      }
    }
    page { number size totalItems totalPages }
  }
}
```

UI defaults:
- Columns: Name, Type, Email (person only), Business (person only), Phone.
- Filters: contactType (BUSINESS/PERSON); optional businessId (person only).
- Sorting: server does not guarantee order; sort client-side by name.
- Actions: view-only; show “Open in ERP” link, no create/edit/delete.

Paging note:
- `page.size` is the number of returned items (not the requested size) and
  `totalPages` may be 0 when there are no contacts. Handle empty states.

## 10) Catalog scoping (active catalog rules)

Catalog resolution in the UI should follow:
1) If the active editor file is under `/catalogs/<slug>/`, that catalog is active.
2) Else if a selected folder contains `catalog.jsonc`, that folder is active.
3) Else if the conversation has `pinnedCatalogPath`, use it.
4) Else: prompt the user to choose a catalog.

Always pass the resolved path as `pinnedCatalogPath` (and in system message
context) so the agent stays scoped.

## 11) Streaming gotcha

`stream: true` returns raw SSE from OpenAI and **does not** include
`conversationId` in the response. If you need a new conversation ID, either:
- Create a conversation via GraphQL first, or
- Make one non-streaming `/api/agent/chat` call to get the ID, then stream.
