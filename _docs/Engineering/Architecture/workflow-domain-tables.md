# Workflow Domain Tables

Structured reference for the core domain entities we discussed: agents, workflows, nodes, tool assignments, and conversational sessions. Each table lists the canonical fields, types, and intent so implementation across store slices, services, and persistence stays aligned.

---

## Agents

| Field | Type | Description | Notes |
| --- | --- | --- | --- |
| `id` | UUID / string | Unique identifier for the agent | Stable across sessions; used as foreign key |
| `name` | string | Display name of the agent | Shown in UI selectors |
| `description` | string | Human-readable summary of responsibilities | Helps users choose the right agent |
| `capabilities` | string[] | Tags describing skills or domains | Drives filtering, discovery |
| `defaultWorkflowId` | string \| null | Preferred workflow/tool when none specified | Optional shortcut |
| `avatarUrl` | string \| null | Image shown in UI | Optional presentation detail |
| `metadata` | Record<string, unknown> | Arbitrary key/value pairs (team, permissions, etc.) | Reserved for future extensions |
| `createdAt` | ISO timestamp | Creation time | Useful for audits |
| `updatedAt` | ISO timestamp | Last modification | Enables change tracking |

---

## Workflows (Tools)

| Field | Type | Description | Notes |
| --- | --- | --- | --- |
| `id` | UUID / string | Unique workflow identifier | References assignments, marketplace entries |
| `title` | string | Workflow name | Used in UI listings |
| `summary` | string | Short description / intent | Surfaces in context tab |
| `version` | string | Semantic version or revision hash | Enables rollback/versioning |
| `nodes` | WorkflowNode[] | Ordered list of node definitions | Hydrates canvas state |
| `edges` | Edge[] | Connections between nodes | React Flow edge payloads |
| `ownerAgentId` | string \| null | Agent who authored/owns workflow | Optional provenance |
| `tags` | string[] | Keywords for search/filter | e.g. `["support", "triage"]` |
| `isPublic` | boolean | Indicates global availability | False for private/internal |
| `createdAt` | ISO timestamp | Creation time | |
| `updatedAt` | ISO timestamp | Last modification | |

---

## Workflow Nodes

| Field | Type | Description | Notes |
| --- | --- | --- | --- |
| `id` | string | Node identifier within workflow | Must be unique per workflow |
| `type` | `"code"` \| string | Node type (code, prompt, API, etc.) | Currently `"code"` only |
| `position` | { x: number; y: number } | Canvas coordinates | React Flow format |
| `data.id` | string | Mirror of node id for convenience | Matches current UI shape |
| `data.title` | string | Node title | Displayed in card header |
| `data.code` | string | Executable Node.js code | Written to WebContainer |
| `data.isRunning` | boolean | UI running indicator | Updated during execution |
| `data.flow.summary` | string | Human-readable flow description | Shown in Flow layer |
| `data.spec.inputs` | ContractField[] | Input schema for downstream context | Informational today |
| `data.spec.process` | string[] | Step-by-step transformation list | Supports spec layer |
| `data.spec.outputs` | ContractField[] | Output schema | |
| `metadata` | Record<string, unknown> | Additional node attributes | Placeholder for future |

---

## Tool Assignments (Agent ↔ Workflow)

| Field | Type | Description | Notes |
| --- | --- | --- | --- |
| `agentId` | string | Reference to agent `id` | Part of composite primary key |
| `workflowId` | string | Reference to workflow `id` | Part of composite primary key |
| `activationContext` | string | When/why to invoke this workflow | e.g. “Use for high-priority inbox triage” |
| `priority` | number | Ordering among an agent’s tools | Lower number = higher priority |
| `enabled` | boolean | Flag to disable without deleting | |
| `lastUsedAt` | ISO timestamp \| null | Last execution time | Helps ranking |
| `metadata` | Record<string, unknown> | Custom fields (permissions, triggers) | Optional |

---

## Sessions / Conversations

| Field | Type | Description | Notes |
| --- | --- | --- | --- |
| `id` | UUID / string | Conversation/session identifier | Links chat to execution history |
| `agentId` | string | Active agent in conversation | |
| `userId` | string | Initiating user | Could be email or account id |
| `messages` | Message[] | Chronological chat transcript | Includes agent and user turns |
| `invokedWorkflows` | InvokedWorkflow[] | Workflows executed during session | Stores results, timings |
| `status` | `"active"` \| `"completed"` \| `"archived"` | Lifecycle state | |
| `createdAt` | ISO timestamp | Session start | |
| `updatedAt` | ISO timestamp | Last interaction | |

### Message

| Field | Type | Description | Notes |
| --- | --- | --- | --- |
| `id` | string | Unique message identifier | |
| `role` | `"user"` \| `"agent"` \| `"system"` | Speaker role | |
| `content` | string | Message text | Markdown/plaintext |
| `timestamp` | ISO timestamp | Time sent | |
| `metadata` | Record<string, unknown> | Attachments, tool refs, etc. | Optional |

### InvokedWorkflow

| Field | Type | Description | Notes |
| --- | --- | --- | --- |
| `workflowId` | string | Executed workflow identifier | |
| `runId` | string | Unique execution ID | Links to logs |
| `startedAt` | ISO timestamp | Execution start | |
| `completedAt` | ISO timestamp \| null | Execution finish | Null if failed |
| `status` | `"success"` \| `"error"` \| `"running"` | Outcome | |
| `outputSummary` | string | Human-readable result | Cached for quick display |
| `error` | string \| null | Error message if failed | |

---

These tables should stay in sync with future API contracts, store slices, and mock data so the domain remains consistent as Workflow Generator evolves.*** End Patch

