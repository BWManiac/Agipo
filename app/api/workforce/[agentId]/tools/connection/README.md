# Connection Tools API (`/api/workforce/[agentId]/tools/connection`)

This module manages Composio-based connection tools assigned to an agent. Connection tools are actions from external services (Gmail, GitHub, etc.) that require OAuth authentication.

## Routes

### GET `/api/workforce/[agentId]/tools/connection`

Returns the connection tool bindings currently assigned to the specified agent.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `agentId` | string | Agent identifier (e.g., `mira-patel`) |

**Response:**
```json
{
  "bindings": [
    {
      "toolId": "GMAIL_SEND_EMAIL",
      "connectionId": "ca_abc123xyz",
      "toolkitSlug": "gmail"
    }
  ]
}
```

**Service Function:** `getAgentConnectionToolBindings(agentId)` from `services/agent-config.ts`

---

### POST `/api/workforce/[agentId]/tools/connection`

Updates the connection tool bindings assigned to the agent.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `agentId` | string | Agent identifier |

**Request Body:**
```json
{
  "bindings": [
    {
      "toolId": "GMAIL_SEND_EMAIL",
      "connectionId": "ca_abc123xyz",
      "toolkitSlug": "gmail"
    },
    {
      "toolId": "GMAIL_FETCH_EMAILS",
      "connectionId": "ca_abc123xyz",
      "toolkitSlug": "gmail"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "bindings": [...]
}
```

**Service Function:** `updateConnectionToolBindings(agentId, bindings)` from `services/agent-config.ts`

---

### GET `/api/workforce/[agentId]/tools/connection/available`

Returns all connection tools available to the authenticated user, grouped by connection. This endpoint is user-specific - it only returns tools from the user's connected accounts.

**Authentication:** Requires Clerk auth

**Response:**
```json
{
  "connections": [
    {
      "connectionId": "ca_abc123xyz",
      "toolkitSlug": "gmail",
      "toolkitName": "Gmail",
      "toolkitLogo": "https://...",
      "accountLabel": "user@gmail.com",
      "status": "ACTIVE",
      "tools": [
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
    }
  ]
}
```

**Service Functions:**
- `listConnections(userId)` - Gets user's connected accounts
- `getToolsForConnection(toolkitSlug)` - Gets tools for each toolkit

---

## Data Model

### ConnectionToolBinding

Connection tools are stored in the agent's configuration file using explicit bindings:

```typescript
type ConnectionToolBinding = {
  toolId: string;       // Composio action name, e.g., "GMAIL_SEND_EMAIL"
  connectionId: string; // Composio connected account ID, e.g., "ca_abc123"
  toolkitSlug: string;  // Toolkit identifier, e.g., "gmail"
};
```

### Agent Config

```typescript
// _tables/agents/mira-patel.ts
export const agentConfig: AgentConfig = {
  id: "mira-patel",
  name: "Mira Patel",
  connectionToolBindings: [
    { toolId: "GMAIL_SEND_EMAIL", connectionId: "ca_abc123", toolkitSlug: "gmail" },
    { toolId: "GMAIL_FETCH_EMAILS", connectionId: "ca_abc123", toolkitSlug: "gmail" }
  ],
  // ...
};
```

---

## Multi-Account Support

The binding model supports multiple accounts for the same service:

```typescript
// Two Gmail accounts - each tool bound to a specific account
connectionToolBindings: [
  { toolId: "GMAIL_SEND_EMAIL", connectionId: "ca_personal", toolkitSlug: "gmail" },
  { toolId: "GMAIL_FETCH_EMAILS", connectionId: "ca_work", toolkitSlug: "gmail" }
]
```

---

## Execution Flow

When an agent uses a connection tool:

1. Chat route loads agent's `connectionToolBindings`
2. Runtime calls `getConnectionToolExecutable(toolId, connectionId)`
3. Composio SDK executes tool with the bound `connectedAccountId`
4. Tool uses the OAuth credentials from that specific connection

---

## Frontend Consumers

| Component | Hook | Description |
|-----------|------|-------------|
| `ConnectionToolEditor` | `useConnectionTools` | Dialog for assigning connection tools |
| `CapabilitiesTab` | `useAgentDetails` | Displays assigned connection tools |
| `ConnectionToolCard` | - | Renders individual connection tool |

---

## Validation Schema

```typescript
const ConnectionToolBindingSchema = z.object({
  toolId: z.string(),      // Required: Composio action name
  connectionId: z.string(), // Required: Connected account ID
  toolkitSlug: z.string(),  // Required: Toolkit identifier
});
```

---

## Notes

- Connection tools require the user to have an active OAuth connection
- The `connectionId` must match an active connection owned by the user
- Tool IDs are Composio action names (e.g., `GMAIL_SEND_EMAIL`, not display names)
- The `/available` endpoint respects user authentication to show only their connections

