# Agent Tools API (`/api/workforce/[agentId]/tools`)

This module manages all tools assigned to an agent, organized into two categories: **Custom Tools** (local workflows) and **Connection Tools** (Composio integrations).

## Architecture Overview

```
Agent Tools
├── /custom              # Local workflow tools
│   ├── GET/POST         # Read/update assigned custom tools
│   └── /available       # List all available custom tools
│
└── /connection          # Composio integration tools
    ├── GET/POST         # Read/update connection tool bindings
    └── /available       # List tools from user's connections (auth required)
```

---

## Routes Summary

### Custom Tools

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tools/custom` | Get agent's assigned custom tools |
| POST | `/tools/custom` | Update agent's custom tools |
| GET | `/tools/custom/available` | List all available custom tools |

### Connection Tools

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/tools/connection` | Get agent's connection tool bindings | No |
| POST | `/tools/connection` | Update agent's connection bindings | No |
| GET | `/tools/connection/available` | List user's available connection tools | **Yes** |

---

## Tool Categories

### Custom Tools

Local workflow tools defined in `_tables/tools/`. These are:
- Platform-defined capabilities (research, analysis, etc.)
- Available to all agents
- No authentication required to assign

**Storage:** `toolIds: string[]` in agent config

### Connection Tools

Composio-based tools from connected services (Gmail, GitHub, etc.). These are:
- User-specific (based on OAuth connections)
- Bound to specific connected accounts
- Support multi-account scenarios

**Storage:** `connectionToolBindings: ConnectionToolBinding[]` in agent config

---

## Data Model

### Agent Config (in `_tables/agents/[agentId].ts`)

```typescript
export const agentConfig: AgentConfig = {
  id: "mira-patel",
  name: "Mira Patel",
  
  // Custom tools - array of tool IDs
  toolIds: ["workflow-research-v1"],
  
  // Connection tools - explicit bindings
  connectionToolBindings: [
    { toolId: "GMAIL_SEND_EMAIL", connectionId: "ca_abc123", toolkitSlug: "gmail" }
  ],
  
  // ...other config
};
```

### ConnectionToolBinding Type

```typescript
type ConnectionToolBinding = {
  toolId: string;       // Composio action name (e.g., "GMAIL_SEND_EMAIL")
  connectionId: string; // Connected account ID (e.g., "ca_abc123")
  toolkitSlug: string;  // Toolkit identifier (e.g., "gmail")
};
```

---

## Service Layer

**File:** `app/api/workforce/services/agent-config.ts`

| Function | Description |
|----------|-------------|
| `getAgentCustomTools(agentId)` | Returns agent's `toolIds` array |
| `updateAgentTools(agentId, toolIds)` | Updates `toolIds` in agent config file |
| `getAgentConnectionToolBindings(agentId)` | Returns agent's `connectionToolBindings` |
| `updateConnectionToolBindings(agentId, bindings)` | Updates `connectionToolBindings` in config |

---

## Chat Execution

The chat route (`/api/workforce/[agentId]/chat`) loads both tool types:

```typescript
// 1. Load custom tools
for (const toolId of agent.toolIds) {
  const tool = getExecutableToolById(toolId);
  toolMap[toolId] = tool;
}

// 2. Load connection tools with binding context
for (const binding of agent.connectionToolBindings) {
  const tool = getConnectionToolExecutable(binding.toolId, binding.connectionId);
  toolMap[binding.toolId] = tool;
}
```

---

## Frontend Components

| Component | Location | Description |
|-----------|----------|-------------|
| `CapabilitiesTab` | Agent modal | Displays both tool sections |
| `ToolEditor` | Agent modal | Manages custom tool assignments |
| `ConnectionToolEditor` | Agent modal | Manages connection tool bindings |
| `ToolCard` | Agent modal | Renders custom tool |
| `ConnectionToolCard` | Agent modal | Renders connection tool |

---

## Legacy Route

### POST `/api/workforce/[agentId]/tools`

The root tools endpoint still supports updating custom tools for backwards compatibility:

```json
{
  "toolIds": ["workflow-research-v1"]
}
```

New code should use `/tools/custom` instead.

---

## See Also

- [Custom Tools README](./custom/README.md)
- [Connection Tools README](./connection/README.md)
- [Tools Runtime Service](../../../tools/services/README.md)
- [Composio Service](../../../connections/services/README.md)
