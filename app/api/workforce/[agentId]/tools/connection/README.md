# Connection Tools

> Enables users to assign external service tools (Gmail, Slack) to their agents.

**Endpoint:** `GET/POST /api/workforce/[agentId]/tools/connection`  
**Auth:** None

---

## Purpose

Manages which connection tools are assigned to an agent. Connection tools are tools from external services like Gmail, Slack, or GitHub that require user authentication. When a user assigns a connection tool, they're giving the agent permission to use that tool with their connected account.

---

## Approach

We store connection tool "bindings" which link a tool ID to a specific connection ID and toolkit. This ensures the agent uses the correct authenticated account when executing tools. The bindings are validated with Zod and persisted to the agent config.

---

## Pseudocode

**GET:**
```
GET(request, { params }): NextResponse
├── Extract agentId from params
├── **Call `getAgentConnectionToolBindings(agentId)`**
└── Return { bindings }
```

**POST:**
```
POST(request, { params }): NextResponse
├── Extract agentId from params
├── Parse body with Zod (bindings array)
├── **Call `updateConnectionToolBindings(agentId, bindings)`**
└── Return { success, bindings }
```

---

## Input (POST)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bindings` | ConnectionToolBinding[] | Yes | Array of tool bindings |
| `bindings[].toolId` | string | Yes | Tool identifier (e.g., "GMAIL_SEND_EMAIL") |
| `bindings[].connectionId` | string | Yes | User's connection ID |
| `bindings[].toolkitSlug` | string | Yes | Toolkit identifier (e.g., "gmail") |

**Example Request:**
```json
{
  "bindings": [
    {
      "toolId": "GMAIL_SEND_EMAIL",
      "connectionId": "conn_abc123",
      "toolkitSlug": "gmail"
    }
  ]
}
```

---

## Output

**GET Response:**
```json
{
  "bindings": [
    {
      "toolId": "GMAIL_SEND_EMAIL",
      "connectionId": "conn_abc123",
      "toolkitSlug": "gmail"
    }
  ]
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| ConnectionToolEditorPanel | `app/(pages)/workforce/components/agent-modal/` | Tool assignment UI |

---

## Future Improvements

- [ ] Add auth to verify user owns the connection
- [ ] Validate connection is still active before saving
