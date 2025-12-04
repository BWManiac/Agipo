# Custom Tools API (`/api/workforce/[agentId]/tools/custom`)

This module manages custom (local workflow) tools assigned to an agent.

## Routes

### GET `/api/workforce/[agentId]/tools/custom`

Returns the custom tool IDs currently assigned to the specified agent.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `agentId` | string | Agent identifier (e.g., `mira-patel`) |

**Response:**
```json
{
  "toolIds": ["workflow-research-v1", "workflow-email-summary"]
}
```

**Service Function:** `getAgentCustomTools(agentId)` from `services/agent-config.ts`

---

### POST `/api/workforce/[agentId]/tools/custom`

Updates the custom tools assigned to the agent by modifying the agent's TypeScript configuration file.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `agentId` | string | Agent identifier |

**Request Body:**
```json
{
  "toolIds": ["workflow-research-v1", "workflow-email-summary"]
}
```

**Response:**
```json
{
  "success": true,
  "toolIds": ["workflow-research-v1", "workflow-email-summary"]
}
```

**Service Function:** `updateAgentTools(agentId, toolIds)` from `services/agent-config.ts`

---

### GET `/api/workforce/[agentId]/tools/custom/available`

Returns all available custom tools that can be assigned to any agent. These are loaded from `_tables/tools/` directory.

**Response:**
```json
{
  "tools": [
    {
      "id": "workflow-research-v1",
      "name": "Research Workflow",
      "description": "Performs web research on a topic"
    }
  ]
}
```

**Service Function:** `listToolDefinitions()` from `tools/services/index.ts`

---

## Data Model

Custom tools are stored in the agent's configuration file (`_tables/agents/[agentId].ts`) in the `toolIds` array:

```typescript
export const agentConfig: AgentConfig = {
  id: "mira-patel",
  name: "Mira Patel",
  toolIds: ["workflow-research-v1"],  // Custom tools
  // ...
};
```

---

## Custom Tool Definition

Custom tools are defined in `_tables/tools/` as TypeScript files:

```typescript
// _tables/tools/workflow-research-v1.ts
export const toolDefinition: ToolDefinition = {
  id: "workflow-research-v1",
  name: "Research Workflow",
  description: "Performs web research",
  // ...
};
```

---

## Frontend Consumers

| Component | Hook | Description |
|-----------|------|-------------|
| `ToolEditor` | `useCustomTools` | Dialog for assigning custom tools |
| `CapabilitiesTab` | `useAgentDetails` | Displays assigned custom tools |

---

## Notes

- Custom tools are "low-code" workflows defined locally in the codebase
- The POST endpoint directly modifies TypeScript source files on disk
- Changes take effect immediately for new chat sessions
- Tool IDs use the format `workflow-{name}-v{version}`

