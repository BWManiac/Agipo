# Sync Composio Schemas

> Triggers a full synchronization of all Composio tool schemas to local cache, including both authenticated toolkits and NO_AUTH platform toolkits.

**Endpoint:** `POST /api/connections/schemas/composio/sync`  
**Auth:** None (admin/dev operation)

---

## Purpose

Enables administrators or developers to refresh the local cache of Composio tool schemas. This is a manual operation that fetches all toolkits and their tools from Composio and saves them to disk for fast access. This powers the cached schema endpoints - after syncing, `/api/connections/schemas/composio/toolkits` and related endpoints will return up-to-date data without making live Composio API calls. This improves performance and reduces API rate limiting.

---

## Approach

Fetches all auth configs from Composio to discover configured toolkits, then deduplicates by toolkit slug. For each unique toolkit, fetches toolkit details and all tools from Composio, then maps them to the cached format and writes to disk. Additionally syncs NO_AUTH platform toolkits (like browser_tool) that don't appear in auth configs. Updates cache metadata with sync timestamp, toolkit count, and total tool count. Returns summary statistics.

---

## Pseudocode

```
POST(): NextResponse
├── Start timer
├── **Call `getComposioClient()`** to get client
├── **Call `listAuthConfigs()`** to get configured toolkits
├── Deduplicate by toolkit slug
├── For each unique toolkit:
│   ├── **Call `client.toolkits.get(slug)`**
│   ├── **Call `client.tools.getRawComposioTools()`**
│   ├── Map tools to CachedToolSchema format
│   └── **Call `writeToolkitCache()`** to save
├── For each NO_AUTH toolkit:
│   ├── **Call `client.toolkits.get(slug)`**
│   ├── **Call `client.tools.getRawComposioTools()`**
│   └── **Call `writeToolkitCache()`** to save
├── **Call `writeCacheMeta()`** with sync stats
├── Return { success, toolkits, tools, durationMs }
└── On error: Return 500 with error message
```

---

## Input

None

---

## Output

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether sync completed successfully |
| `toolkits` | number | Number of toolkits synced |
| `tools` | number | Total number of tools synced |
| `durationMs` | number | Sync duration in milliseconds |

**Example Response:**
```json
{
  "success": true,
  "toolkits": 15,
  "tools": 234,
  "durationMs": 3456
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Admin/Dev Tools | Manual trigger | Refresh schema cache when Composio adds new tools |

---

## Related Docs

- Schema Cache Service - `app/api/connections/schemas/composio/services/composio-schema-cache.ts`
- Connections Service - `app/api/connections/services/composio.ts`
- `/api/connections/schemas/composio/toolkits` - Uses the cache populated by this endpoint

---

## Notes

This is a long-running operation that can take several seconds depending on the number of toolkits. It makes many API calls to Composio, so be mindful of rate limits. The sync includes NO_AUTH toolkits that don't require authentication, ensuring platform tools are always available.

---

## Future Improvements

- [ ] Add incremental sync (only sync changed toolkits)
- [ ] Add background job scheduling
- [ ] Add sync status endpoint
- [ ] Add error recovery (continue on individual toolkit failures)

