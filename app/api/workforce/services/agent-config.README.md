# Agent Config Service

> Manages agent configuration persistence by reading from and writing to TypeScript agent files.

**Service:** `agent-config.ts`  
**Domain:** Workforce

---

## Purpose

This service handles agent capability assignment by reading and writing agent configuration data stored as TypeScript files in `_tables/agents/`. It enables users to assign custom tools, connection tools, and workflows to agents, and persists those assignments by modifying the source files. Without this service, agent configurations would be static and users couldn't customize which capabilities each agent has.

**Product Value:** Enables the core workflow where users customize their agents. When a user assigns Gmail tools to their PM agent or assigns a custom workflow to their support agent, this service persists those changes, making agents truly personalized to each user's needs.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `getAgentCustomTools()` | Retrieves the list of custom tool IDs assigned to an agent. | When checking what custom tools an agent can use |
| `getAgentConnectionToolBindings()` | Retrieves the connection tool bindings (toolId + connectionId pairs) assigned to an agent. | When checking what connection tools an agent can use |
| `getWorkflowBindings()` | Retrieves the workflow bindings (workflowId + connection mappings) assigned to an agent. | When checking what workflows an agent can execute |
| `updateAgentTools()` | Updates the custom tools assigned to an agent by modifying the source TypeScript file. | When user assigns or removes custom tools from an agent |
| `updateConnectionToolBindings()` | Updates the connection tool bindings assigned to an agent by modifying the source TypeScript file. | When user assigns or removes connection tools from an agent |
| `updateWorkflowBindings()` | Updates the workflow bindings assigned to an agent by modifying the source TypeScript file. | When user assigns or removes workflows from an agent |

---

## Approach

The service uses file system operations and regex-based string replacement to modify TypeScript source files. Each agent is mapped to a specific file (e.g., "pm" → "mira-patel.ts"), and the service locates specific patterns in the file (like `toolIds: [...]`) and replaces them with updated values. This approach maintains the human-readable TypeScript files as the source of truth while enabling programmatic updates.

---

## Public API

### `getAgentCustomTools(agentId: string): string[]`

**What it does:** Retrieves the array of custom tool IDs assigned to an agent from its configuration file.

**Product Impact:** Routes need to know what custom tools an agent has assigned to display them in the UI or validate assignments.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | string | Yes | Agent identifier (e.g., "pm", "marketing") |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | string[] | Array of custom tool IDs assigned to the agent, empty array if agent not found |

---

### `getAgentConnectionToolBindings(agentId: string): ConnectionToolBinding[]`

**What it does:** Retrieves the connection tool bindings assigned to an agent, each binding linking a tool ID to a connection ID and toolkit slug.

**Product Impact:** Routes need to know what connection tools an agent can use so they can build the agent's tool map during chat initialization.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | string | Yes | Agent identifier (e.g., "pm", "marketing") |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | ConnectionToolBinding[] | Array of bindings, each containing toolId, connectionId, and toolkitSlug, empty array if agent not found |

---

### `getWorkflowBindings(agentId: string): WorkflowBinding[]`

**What it does:** Retrieves the workflow bindings assigned to an agent, each binding linking a workflow ID to connection mappings for required toolkits.

**Product Impact:** Routes need to know what workflows an agent can execute so they can build the agent's tool map during chat initialization.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | string | Yes | Agent identifier (e.g., "pm", "marketing") |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | WorkflowBinding[] | Array of bindings, each containing workflowId and connectionBindings map, empty array if agent not found |

---

### `updateAgentTools(agentId: string, toolIds: string[]): Promise<void>`

**What it does:** Updates the custom tools assigned to an agent by modifying the agent's TypeScript configuration file using regex replacement.

**Product Impact:** When users assign or remove custom tools in the UI, this function persists those changes so they're reflected in future agent conversations.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | string | Yes | Agent identifier (e.g., "pm", "marketing") |
| `toolIds` | string[] | Yes | Complete array of custom tool IDs to assign to the agent |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<void> | Resolves when file is successfully updated, throws if agent not found or pattern not found |

**Process:**

```
updateAgentTools(agentId, toolIds): Promise<void>
├── Map agentId to filename (e.g., "pm" → "mira-patel.ts")
├── If mapping not found: Throw error
├── Read agent TypeScript file from _tables/agents/
├── Build toolIds array string: ["id1", "id2"]
├── Find pattern: toolIds: [...]
├── Replace pattern with new toolIds array
└── Write updated file back to disk
```

**Error Handling:** Throws errors if agent ID is not mapped to a file, file cannot be read, or the toolIds pattern is not found in the file.

---

### `updateConnectionToolBindings(agentId: string, bindings: ConnectionToolBinding[]): Promise<void>`

**What it does:** Updates the connection tool bindings assigned to an agent by modifying the agent's TypeScript configuration file using regex replacement.

**Product Impact:** When users assign Gmail, Slack, or other connection tools to an agent, this function persists those bindings so the agent can use those tools in conversations.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | string | Yes | Agent identifier (e.g., "pm", "marketing") |
| `bindings` | ConnectionToolBinding[] | Yes | Complete array of connection tool bindings to assign to the agent |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<void> | Resolves when file is successfully updated, throws if agent not found or insertion point not found |

**Process:**

```
updateConnectionToolBindings(agentId, bindings): Promise<void>
├── Map agentId to filename
├── If mapping not found: Throw error
├── Read agent TypeScript file
├── Build bindings array string with proper formatting
├── **If connectionToolBindings field exists:**
│   └── Replace existing field with new bindings
├── **If field doesn't exist:**
│   ├── Find toolIds pattern
│   └── Insert connectionToolBindings field after toolIds
└── Write updated file back to disk
```

---

### `updateWorkflowBindings(agentId: string, bindings: WorkflowBinding[]): Promise<void>`

**What it does:** Updates the workflow bindings assigned to an agent by modifying the agent's TypeScript configuration file using regex replacement.

**Product Impact:** When users assign workflows to an agent, this function persists those bindings along with connection mappings, enabling agents to execute multi-step workflows.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | string | Yes | Agent identifier (e.g., "pm", "marketing") |
| `bindings` | WorkflowBinding[] | Yes | Complete array of workflow bindings (workflowId + connectionBindings) to assign |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<void> | Resolves when file is successfully updated, throws if agent not found or insertion point not found |

**Process:**

```
updateWorkflowBindings(agentId, bindings): Promise<void>
├── Map agentId to filename
├── If mapping not found: Throw error
├── Read agent TypeScript file
├── Build bindings array string with proper formatting
├── **If workflowBindings field exists:**
│   └── Replace existing field with new bindings
├── **If field doesn't exist:**
│   ├── Try to find connectionToolBindings pattern
│   ├── If found: Insert after connectionToolBindings
│   ├── Else: Find toolIds pattern
│   └── Insert workflowBindings field after toolIds or connectionToolBindings
└── Write updated file back to disk
```

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `fs/promises` | File system operations for reading/writing agent files |
| `path` | Path resolution for agent file locations |
| `@/_tables/agents` | Agent registry for reading configurations |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Agent Tools Route | `app/api/workforce/[agentId]/tools/route.ts` | Updates tool assignments |
| Agent Workflows Route | `app/api/workforce/[agentId]/workflows/route.ts` | Updates workflow assignments |
| Agent Modal UI | `app/(pages)/workforce/components/agent-modal/` | Reads current assignments for display |

---

## Design Decisions

### Why file-based persistence instead of database?

**Decision:** Agent configurations are stored as TypeScript files and modified using regex replacement.

**Rationale:** This aligns with Agipo's "files as source of truth" philosophy. Agent configs are versionable, inspectable, and human-readable. For MVP scale, this works well and keeps the system simple. Future migration to database can happen if needed, but the file-based approach provides excellent developer experience.

### Why regex-based string replacement?

**Decision:** Files are modified using regex patterns rather than AST parsing.

**Rationale:** TypeScript files are treated as text files here. AST parsing would be more robust but significantly more complex. Regex replacement works for the current structure and is easier to understand and maintain. If the file structure becomes more complex, AST parsing could be considered.

---

## Error Handling

All update functions throw errors if:
- Agent ID is not mapped to a file
- Agent file cannot be read
- Required patterns cannot be found in the file

Read functions return empty arrays if agent is not found, providing graceful degradation.

---

## Related Docs

- [Agent Chat Service README](../[agentId]/chat/services/chat-service.README.md) - Uses agent config to build tool maps
- [Agent Types](../../../../_tables/types.ts) - Type definitions for AgentConfig, ConnectionToolBinding, WorkflowBinding

---

## Future Improvements

- [ ] Add validation before writing (ensure toolIds/workflows exist)
- [ ] Add backup/version history for agent files
- [ ] Consider AST-based file modification for more robust updates
- [ ] Add migration path to database storage if needed
- [ ] Add transaction-like rollback if file write fails

