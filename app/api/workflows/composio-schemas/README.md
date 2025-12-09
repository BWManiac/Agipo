# Composio Schemas Summary

> Returns a summary list of all cached Composio toolkits with metadata, enabling users to browse available integrations without loading full tool schemas.

**Endpoint:** `GET /api/workflows/composio-schemas`  
**Auth:** None

---

## Purpose

Enables users to see all available Composio integrations (toolkits) that have been cached locally. This provides a lightweight overview showing toolkit names, logos, and tool counts without loading the full tool schemas. This powers integration browsing UIs where users need to see what's available before diving into specific tools. The cache is populated by the sync endpoint, making this much faster than querying Composio directly.

---

## Approach

Reads the cache metadata to get the last sync timestamp, then lists all cached toolkit files from disk. For each toolkit, reads the cached JSON file to extract summary information (slug, name, logo, tool count) without loading the full tool list. Returns a summary view optimized for browsing.

---

## Pseudocode

```
GET(): NextResponse
├── **Call `readCacheMeta()`** to get sync metadata
├── **Call `listCachedToolkits()`** to get toolkit slugs
├── For each toolkit slug:
│   ├── **Call `readToolkitCache(slug)`**
│   └── Extract summary: slug, name, logo, toolCount
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
| `toolkits` | array | List of toolkit summaries |

**Example Response:**
```json
{
  "lastSyncedAt": "2025-12-07T00:00:00.000Z",
  "toolkits": [
    {
      "slug": "gmail",
      "name": "Gmail",
      "logo": "https://...",
      "toolCount": 15
    },
    {
      "slug": "slack",
      "name": "Slack",
      "logo": "https://...",
      "toolCount": 23
    }
  ]
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Workflow Editor Tools Panel | `app/(pages)/workflows/editor/components/panels/tools/` | Display available integrations |

---

## Related Docs

- Schema Cache Service - `app/api/workflows/composio-schemas/services/composio-schema-cache.ts`
- `/api/workflows/composio-schemas/sync` - Populates the cache
- `/api/workflows/composio-schemas/all` - Returns all toolkits with tool names (more detailed)

---

## Notes

This endpoint reads from local cache files, not from Composio directly. If the cache is empty or stale, use `/api/workflows/composio-schemas/sync` to refresh it first.

---

## Future Improvements

- [ ] Add cache invalidation based on age
- [ ] Add filtering by toolkit slug
- [ ] Add search functionality

