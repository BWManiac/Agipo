# Toolkit Schemas

> Returns all tools for a specific toolkit with full input/output parameter schemas, enabling users to see complete tool definitions for workflow configuration.

**Endpoint:** `GET /api/workflows/composio-schemas/[toolkit]`  
**Auth:** None

---

## Purpose

Enables users to load all tools from a specific toolkit with their complete schemas. When users select a toolkit in the workflow editor, this endpoint provides all available tools with full parameter definitions needed for configuring workflow steps. This powers the toolkit detail view where users can see all tools and their schemas before adding them to workflows.

---

## Approach

Reads the cached toolkit file from disk using the toolkit slug from the URL path. Returns the complete cached toolkit object including all tools with their full input and output parameter schemas. If the toolkit isn't cached, returns 404. This relies on the cache being populated by the sync endpoint.

---

## Pseudocode

```
GET(request, { params }): NextResponse
├── Extract toolkit slug from route params
├── **Call `readToolkitCache(toolkitSlug)`** from cache service
├── If toolkit not found:
│   └── Return 404 with error message
├── Return complete toolkit object with all tools and schemas
└── On error: Return 500 with error message
```

---

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `toolkit` | string | Yes | Toolkit slug (e.g., "gmail", "slack") |

---

## Output

| Field | Type | Description |
|-------|------|-------------|
| Full toolkit object | object | Complete CachedToolkit with tools and schemas |

**Example Response:**
```json
{
  "slug": "gmail",
  "name": "Gmail",
  "logo": "https://...",
  "tools": [
    {
      "slug": "GMAIL_SEND_EMAIL",
      "name": "Send Email",
      "description": "Sends an email via Gmail",
      "inputParameters": {
        "to": { "type": "string", "required": true },
        "subject": { "type": "string", "required": true },
        "body": { "type": "string", "required": true }
      },
      "outputParameters": {
        "messageId": { "type": "string" }
      },
      "toolkitSlug": "gmail"
    }
  ],
  "toolCount": 15
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Workflow Editor Tools Panel | `app/(pages)/workflows/editor/components/panels/tools/` | Load toolkit details when expanded |

---

## Related Docs

- Schema Cache Service - `app/api/workflows/composio-schemas/services/composio-schema-cache.ts`
- `/api/workflows/composio-schemas/[toolkit]/[tool]` - Returns single tool schema
- `/api/workflows/composio-schemas/sync` - Populates the cache

---

## Notes

This endpoint reads from cache, so the toolkit must have been synced first. If you get a 404, run `/api/workflows/composio-schemas/sync` to populate the cache.

---

## Future Improvements

- [ ] Add cache refresh on 404 (auto-sync missing toolkits)
- [ ] Add field selection (return only requested fields)

