# Toolkits API (`/api/connections/toolkits`)

This module provides API routes for querying Composio toolkit metadata, available tools, and triggers.

## Architecture Overview

```
Frontend                           Backend                              Composio
────────                           ───────                              ────────
Connection Tools UI  ──────►  /api/connections/toolkits/[slug]      ──►  toolkits.get(slug)
                     ──────►  /api/connections/toolkits/[slug]/tools ──►  tools.list(toolkit)
                     ──────►  /api/connections/toolkits/[slug]/triggers ──► triggers.list(toolkit)
```

---

## Routes

### GET `/api/connections/toolkits/[slug]`

Fetches metadata for a specific toolkit by its slug.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | string | Toolkit identifier (e.g., `gmail`, `github`, `slack`) |

**Response:**
```json
{
  "slug": "gmail",
  "name": "Gmail",
  "description": "Google's email service",
  "logo": "https://...",
  "categories": ["communication", "email"],
  "authSchemes": ["OAUTH2"]
}
```

**Service Function:** `getToolkit(slug)` from `services/composio.ts`

**SDK Method:** `client.toolkits.get(slug)`

---

### GET `/api/connections/toolkits/[slug]/tools`

Lists all available tools (actions) for a specific toolkit.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | string | Toolkit identifier |

**Response:**
```json
[
  {
    "id": "GMAIL_SEND_EMAIL",
    "name": "Send Email",
    "description": "Send an email via Gmail"
  },
  {
    "id": "GMAIL_FETCH_EMAILS",
    "name": "Fetch Emails",
    "description": "Retrieve emails from inbox"
  }
]
```

**Service Function:** `getToolsForToolkit(slug)` from `services/composio.ts`

**SDK Method:** `client.tools.list({ toolkits: [slug] })`

---

### GET `/api/connections/toolkits/[slug]/triggers`

Lists available webhook triggers for a specific toolkit.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | string | Toolkit identifier |

**Response:**
```json
[
  {
    "name": "new_email_received",
    "displayName": "New Email Received",
    "description": "Triggered when a new email arrives"
  }
]
```

**Service Function:** `getTriggersForToolkit(slug)` from `services/composio.ts`

**SDK Method:** `client.triggers.list({ toolkitSlug: slug })`

---

## Service Layer Functions

These routes use functions from `../services/composio.ts`:

| Function | Description |
|----------|-------------|
| `getToolkit(slug)` | Fetches toolkit metadata |
| `getToolsForToolkit(slug)` | Lists tools with `limit: 100` to get all |
| `getTriggersForToolkit(slug)` | Lists available triggers |

---

## Common Toolkit Slugs

| Slug | Name | Common Tools |
|------|------|--------------|
| `gmail` | Gmail | Send Email, Fetch Emails, Create Draft |
| `github` | GitHub | Create Issue, Search Repos, Get PR |
| `slack` | Slack | Send Message, List Channels |
| `notion` | Notion | Create Page, Query Database |
| `linear` | Linear | Create Issue, Update Issue |

---

## Frontend Consumers

- `ConnectionToolEditor` - displays available tools when assigning to agents
- `useConnectionTools` hook - fetches tools for user's connections

---

## Notes

- These routes don't require authentication since toolkit info is public
- Tools require a connected account to execute, but metadata is freely queryable
- The `tools` endpoint returns tools by their action name (slug like `GMAIL_SEND_EMAIL`), which is what the runtime uses for execution

