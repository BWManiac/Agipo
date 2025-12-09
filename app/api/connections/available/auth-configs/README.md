# Auth Configs

> Enables users to see which external services (Gmail, Slack, GitHub, etc.) are available for connection.

**Endpoint:** `GET /api/connections/available/auth-configs`  
**Auth:** None

---

## Purpose

Lists all available authentication configurations from Composio. These represent the external services users can connect to, such as Gmail, Slack, GitHub, and others. This is typically the first API call when a user wants to add a new connection - it populates the list of available services they can choose from.

---

## Approach

We call the Composio SDK to fetch all auth configs registered in our Composio account. Each auth config represents a pre-configured OAuth or API key integration. The response includes metadata like the service name, logo, and supported authentication modes.

---

## Pseudocode

```
GET(): NextResponse
├── **Call `listAuthConfigs()`** from composio service
├── Return raw auth configs array
└── On error: Return 500 with error message
```

---

## Input

None

---

## Output

| Field | Type | Description |
|-------|------|-------------|
| `items` | AuthConfig[] | Array of available auth configurations |
| `items[].id` | string | Auth config ID (e.g., "ac_FpW8_GwXyMBz") |
| `items[].toolkit` | object | Toolkit info (name, slug, logo) |
| `items[].authScheme` | string | "OAUTH2", "API_KEY", etc. |

**Example Response:**
```json
{
  "items": [
    {
      "id": "ac_FpW8_GwXyMBz",
      "toolkit": {
        "name": "Gmail",
        "slug": "gmail",
        "logo": "https://..."
      },
      "authScheme": "OAUTH2"
    }
  ]
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| ConnectionsSection | `app/(pages)/profile/components/connections/` | Populates "Add Connection" dialog |

---

## Related Docs

- [Composio Auth Configs](https://docs.composio.dev/api-reference/auth-configs) - SDK reference

---

## Future Improvements

- [ ] Cache response with short TTL
- [ ] Filter by supported auth schemes
- [ ] Add search/filter capability
