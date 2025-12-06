# Toolkit Tools

> Enables users to see what actions/tools are available within a specific toolkit.

**Endpoint:** `GET /api/connections/toolkits/[slug]/tools`  
**Auth:** None

---

## Purpose

Lists all available tools (actions) for a specific toolkit. For example, the Gmail toolkit has tools like "send_email", "fetch_emails", "search_emails". This is used when configuring which specific tools an agent should have access to from a connected service.

---

## Approach

We extract the toolkit slug from the URL and call Composio's `getToolsForToolkit()` to fetch the raw tool definitions. Each tool includes its name, description, and input schema.

---

## Pseudocode

```
GET(request, { params }): NextResponse
├── Extract slug from params
├── **Call `getToolsForToolkit(slug)`** from composio service
└── Return tools array
```

---

## Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string (path) | Yes | Toolkit identifier (e.g., "gmail") |

---

## Output

| Field | Type | Description |
|-------|------|-------------|
| `[]` | Tool[] | Array of available tools |
| `[].slug` | string | Tool identifier (e.g., "GMAIL_SEND_EMAIL") |
| `[].name` | string | Display name |
| `[].displayName` | string | Friendly name |
| `[].description` | string | What the tool does |

**Example Response:**
```json
[
  {
    "slug": "GMAIL_SEND_EMAIL",
    "name": "gmail_send_email",
    "displayName": "Send Email",
    "description": "Send an email via Gmail"
  },
  {
    "slug": "GMAIL_FETCH_EMAILS",
    "name": "gmail_fetch_emails", 
    "displayName": "Fetch Emails",
    "description": "Retrieve emails from inbox"
  }
]
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| ConnectionToolEditorPanel | `app/(pages)/workforce/components/agent-modal/` | Tool selection UI |

---

## Related Docs

- [Composio Tools](https://docs.composio.dev/api-reference/tools) - SDK reference

