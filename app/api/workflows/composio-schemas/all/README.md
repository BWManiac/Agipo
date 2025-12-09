# All Composio Schemas

> Returns all cached toolkits with their complete tool lists (names and descriptions only, no full schemas), optimized for loading all tools in a single request.

**Endpoint:** `GET /api/workflows/composio-schemas/all`  
**Auth:** None

---

## Purpose

Enables the workflow editor's tools panel to load all available tools from all toolkits in one request. This provides a complete catalog of tools with names and descriptions, but without the full input/output parameter schemas (which are large). This powers the tools panel where users browse and search for tools to add to their workflows. The lightweight format makes it fast to load even with many toolkits.

---

## Approach

Reads cache metadata and lists all cached toolkit files. For each toolkit, loads the cached JSON and extracts tool summaries (slug, name, description) without the full parameter schemas. Returns all toolkits with their tool lists in a single response, optimized for the tools panel UI.

---

## Pseudocode

```
GET(): NextResponse
├── **Call `readCacheMeta()`** to get sync metadata
├── **Call `listCachedToolkits()`** to get toolkit slugs
├── For each toolkit slug:
│   ├── **Call `readToolkitCache(slug)`**
│   └── Map tools to lightweight format:
│       ├── slug, name, description only
│       └── Exclude inputParameters/outputParameters
├── Filter out null results
├── Return { lastSyncedAt, toolkits: [...] }
└── On error: Return 500 with empty arrays
```

---

## Input

None

---

## Output

| Field | Type | Description |
|-------|------|-------------|
| `lastSyncedAt` | string \| null | ISO timestamp of last cache sync |
| `toolkits` | array | List of toolkits with tool summaries |

**Example Response:**
```json
{
  "lastSyncedAt": "2025-12-07T00:00:00.000Z",
  "toolkits": [
    {
      "slug": "gmail",
      "name": "Gmail",
      "logo": "https://...",
      "tools": [
        {
          "slug": "GMAIL_SEND_EMAIL",
          "name": "Send Email",
          "description": "Sends an email via Gmail"
        },
        {
          "slug": "GMAIL_FETCH_EMAILS",
          "name": "Fetch Emails",
          "description": "Retrieves emails from Gmail"
        }
      ]
    }
  ]
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Workflow Editor Tools Panel | `app/(pages)/workflows/editor/components/panels/tools/` | Load all tools for browsing and search |
| Tools Slice | `app/(pages)/workflows/editor/store/slices/tabs/toolsSlice.ts` | Populate tools store |

---

## Related Docs

- Schema Cache Service - `app/api/workflows/composio-schemas/services/composio-schema-cache.ts`
- `/api/workflows/composio-schemas` - Returns toolkit summaries only (no tools)
- `/api/workflows/composio-schemas/[toolkit]/[tool]` - Returns full schema for a specific tool

---

## Notes

This endpoint returns tool names and descriptions but not full parameter schemas. To get the complete schema for configuring a tool, use `/api/workflows/composio-schemas/[toolkit]/[tool]` after the user selects a specific tool.

---

## Future Improvements

- [ ] Add pagination for very large tool catalogs
- [ ] Add filtering by toolkit
- [ ] Add search query parameter

