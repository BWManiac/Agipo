# Toolkit Details

> Enables users to view details about a specific toolkit (Gmail, Slack, etc.) including its capabilities and auth requirements.

**Endpoint:** `GET /api/connections/toolkits/[slug]`  
**Auth:** None

---

## Purpose

Retrieves detailed information about a specific toolkit by its slug identifier. This is useful when displaying toolkit details in the UI, such as the available authentication modes, logo, description, and metadata. It helps users understand what a toolkit offers before connecting.

---

## Approach

We extract the toolkit slug from the URL path parameter and call Composio's `getToolkit()` to fetch the full toolkit details. The raw Composio response is returned directly.

---

## Pseudocode

```
GET(request, { params }): NextResponse
├── Extract slug from params
├── **Call `getToolkit(slug)`** from composio service
└── Return toolkit details
```

---

## Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string (path) | Yes | Toolkit identifier (e.g., "gmail", "slack") |

---

## Output

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name |
| `slug` | string | Identifier |
| `description` | string | What the toolkit does |
| `meta.logo` | string | Logo URL |
| `authConfigDetails` | array | Supported auth modes |

**Example Response:**
```json
{
  "name": "Gmail",
  "slug": "gmail",
  "description": "Send and receive emails",
  "meta": {
    "logo": "https://..."
  },
  "authConfigDetails": [
    { "mode": "OAUTH2" }
  ]
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| ConnectionsSection | `app/(pages)/profile/components/connections/` | Display toolkit details |

---

## Related Docs

- [Composio Toolkits](https://docs.composio.dev/api-reference/toolkits) - SDK reference

