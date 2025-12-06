# Available Connection Tools

> Enables users to see all connection tools available to assign to their agents.

**Endpoint:** `GET /api/workforce/[agentId]/tools/connection/available`  
**Auth:** Clerk

---

## Purpose

Lists all connection tools available to the authenticated user based on their connected accounts. This powers the tool selection UI where users choose which tools to give their agents. It includes both authenticated connection tools (Gmail, Slack) and platform tools that don't require authentication (browser tools).

---

## Approach

We fetch the user's active connections from Composio, then for each connection we fetch the available tools for that toolkit. We also fetch NO_AUTH platform toolkits (like browser tools) that are available to everyone. The response groups tools by connection, including metadata like the toolkit name and logo.

---

## Pseudocode

```
GET(): NextResponse
├── Authenticate user via Clerk
├── **Call `listConnections(userId)`** to get user's connections
├── **Call `listAuthConfigs()`** for toolkit metadata
├── For each active connection:
│   ├── **Call `getToolsForConnection(toolkitSlug)`**
│   └── Build ConnectionToolInfo with tools array
├── **Call `getNoAuthToolkits()`** for platform tools
└── Return { connections, platformToolkits }
```

---

## Input

None (user ID from Clerk auth, agentId from path but not used)

---

## Output

| Field | Type | Description |
|-------|------|-------------|
| `connections` | ConnectionToolInfo[] | User's connected account tools |
| `connections[].connectionId` | string | Connection identifier |
| `connections[].toolkitSlug` | string | Toolkit identifier |
| `connections[].toolkitName` | string | Display name |
| `connections[].toolkitLogo` | string | Logo URL |
| `connections[].tools` | Tool[] | Available tools for this connection |
| `platformToolkits` | PlatformToolkit[] | NO_AUTH tools (browser, etc.) |

**Example Response:**
```json
{
  "connections": [
    {
      "connectionId": "conn_abc123",
      "toolkitSlug": "gmail",
      "toolkitName": "Gmail",
      "tools": [
        { "id": "GMAIL_SEND_EMAIL", "name": "Send Email" }
      ]
    }
  ],
  "platformToolkits": [
    {
      "slug": "browser_tool",
      "name": "Browser Tool",
      "tools": [{ "id": "BROWSER_TOOL_FETCH_WEBPAGE" }]
    }
  ]
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| ConnectionToolEditorPanel | `app/(pages)/workforce/components/agent-modal/` | Populates tool picker |

---

## Notes

- Only returns ACTIVE connections
- Platform toolkits (NO_AUTH) are available to all users

---

## Future Improvements

- [ ] Cache response with short TTL
- [ ] Add tool search/filter

