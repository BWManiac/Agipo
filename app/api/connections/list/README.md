# List Connections

> Enables users to see all their connected external accounts and their status.

**Endpoint:** `GET /api/connections/list`  
**Auth:** Clerk

---

## Purpose

Lists all connected accounts for the authenticated user. This powers the connections management UI where users can see which services they've linked (Gmail, GitHub, etc.), their connection status, and when they were connected. It's essential for users to understand what integrations are active and available for their agents to use.

---

## Approach

We authenticate the user via Clerk, then call Composio's `listConnections()` with the user ID. The raw Composio response is transformed into a cleaner format that includes the essential fields: connection ID, auth config ID, toolkit slug, status, and timestamps.

---

## Pseudocode

```
GET(): NextResponse
├── Authenticate user via Clerk
├── If not authenticated: Return 401
├── **Call `listConnections(userId)`** from composio service
├── Transform response to simpler format:
│   ├── Extract id, authConfigId, toolkitSlug
│   ├── Extract status, createdAt, updatedAt
│   └── Map each connection item
└── Return formatted connections array
```

---

## Input

None (user ID from Clerk auth)

---

## Output

| Field | Type | Description |
|-------|------|-------------|
| `[]` | Connection[] | Array of user's connections |
| `[].id` | string | Connection ID |
| `[].authConfigId` | string | Associated auth config |
| `[].toolkitSlug` | string | Service identifier (gmail, slack) |
| `[].status` | string | ACTIVE, PENDING, EXPIRED |
| `[].createdAt` | string | ISO timestamp |
| `[].updatedAt` | string | ISO timestamp |

**Example Response:**
```json
[
  {
    "id": "conn_abc123",
    "authConfigId": "ac_FpW8_GwXyMBz",
    "toolkitSlug": "gmail",
    "status": "ACTIVE",
    "createdAt": "2025-12-01T00:00:00.000Z",
    "updatedAt": "2025-12-03T12:34:56.789Z"
  }
]
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| ConnectionsSection | `app/(pages)/profile/components/connections/` | Displays connections list |
| Agent tools APIs | `app/api/workforce/[agentId]/tools/` | Validates user has connection |

---

## Related Docs

- [Composio Connected Accounts](https://docs.composio.dev/api-reference/connected-accounts) - SDK reference

---

## Future Improvements

- [ ] Add pagination for users with many connections
- [ ] Include connection health/last-used info
- [ ] Cache with short TTL
