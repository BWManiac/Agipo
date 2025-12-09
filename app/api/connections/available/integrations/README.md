# Available Integrations (Live)

> Fetches all available integrations and their tools directly from Composio (not cached), providing real-time data about what integrations are configured and available.

**Endpoint:** `GET /api/connections/available/integrations`  
**Auth:** None

---

## Purpose

Enables users to see all integrations that are currently configured in Composio, including both OAuth integrations and NO_AUTH platform toolkits (like browser_tool). This provides live, up-to-date information about what's available, unlike the cached endpoints. This is useful for discovering new integrations or verifying what's configured in Composio. The endpoint deduplicates by toolkit slug since multiple auth configs can exist for the same integration.

---

## Approach

Fetches all auth configs from Composio to discover configured integrations, then deduplicates by toolkit slug. For each unique integration, fetches the tools list from Composio. Additionally, includes NO_AUTH platform toolkits (like browser_tool) that don't appear in auth configs but are available to all users. Returns a complete list of integrations with their tools, sorted by name.

---

## Pseudocode

```
GET(): NextResponse
├── **Call `listAuthConfigs()`** from connections service
├── Deduplicate configs by toolkit slug
├── For each unique integration:
│   ├── **Call `getToolsForToolkit(slug)`**
│   └── Map tools to lightweight format
├── Add NO_AUTH toolkits (browser_tool, etc.):
│   ├── **Call `client.toolkits.get(slug)`**
│   └── **Call `client.tools.getRawComposioTools()`**
├── Sort integrations by name
├── Return { integrations: [...] }
└── On error: Return 500 with error message
```

---

## Input

None

---

## Output

| Field | Type | Description |
|-------|------|-------------|
| `integrations` | array | List of integrations with tools |

**Example Response:**
```json
{
  "integrations": [
    {
      "slug": "gmail",
      "name": "Gmail",
      "logo": "https://...",
      "authMode": "OAUTH2",
      "tools": [
        {
          "id": "GMAIL_SEND_EMAIL",
          "name": "Send Email",
          "description": "Sends an email via Gmail"
        }
      ]
    },
    {
      "slug": "browser_tool",
      "name": "Browser Tool",
      "logo": null,
      "authMode": "NO_AUTH",
      "tools": [...]
    }
  ]
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Workflow Editor Tools Panel | `app/(pages)/workflows/editor/components/panels/tools/` | Discover available integrations |

---

## Related Docs

- Connections Service - `app/api/connections/services/composio.ts`
- `/api/connections/schemas/composio/toolkits` - Returns cached data (faster but may be stale)
- `/api/connections/schemas/composio/sync` - Updates the cache with this data

---

## Notes

This endpoint makes live API calls to Composio, so it's slower than cached endpoints but always up-to-date. For better performance in the tools panel, consider using `/api/connections/schemas/composio/toolkits` after syncing. This endpoint includes NO_AUTH toolkits that don't require user authentication.

---

## Future Improvements

- [ ] Add caching layer with TTL
- [ ] Add filtering by auth mode
- [ ] Add error handling for individual toolkit failures

