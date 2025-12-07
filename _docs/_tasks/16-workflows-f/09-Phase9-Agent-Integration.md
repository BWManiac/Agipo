# Phase 9: Agent Integration

**Status:** 📋 Planned  
**Depends On:** Phase 8 (Transpilation Engine)  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Build the **Agent Integration** system that enables users to assign workflows to agents as capabilities. When a workflow is assigned, the user binds their specific connections (Gmail account, Slack workspace, etc.) so the agent can execute the workflow at runtime.

After this phase:
- Users can see assigned workflows in agent's Capabilities tab
- Users can assign/unassign workflows via "Manage" panel
- Users can bind their connections to workflow requirements
- Agents can invoke assigned workflows during chat (stretch goal)

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI pattern | Follow ConnectionToolEditorPanel | Consistent UX, proven pattern, code reuse |
| Connection binding | Per workflow-agent | Same workflow, different agents = different connections |
| Only show transpiled | Yes | Non-transpiled workflows aren't executable |
| Status indicators | Ready / Needs Setup | Clear visual feedback for user |
| Runtime (stretch) | Dynamic import | Load generated workflow.ts at runtime |

### Pertinent Research

- **WorkflowBinding model**: `{ workflowId, connectionBindings: Record<toolkitSlug, connectionId> }`
- **RuntimeContext for connections**: Mastra uses `runtimeContext.get("connections")` to pass connection IDs at runtime
- **Existing pattern**: `ConnectionToolBinding` in `_tables/types.ts` provides similar binding model
- **Chat service**: `buildToolMap()` already loads custom tools and connection tools; workflows extend this

*Source: `15.5-workflows-f-transpilation-research.md`, existing codebase patterns*

### Overall File Impact

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `_tables/types.ts` | Modify | Add `WorkflowBinding` type, update `AgentConfig` | A |
| `app/api/workflows-f/services/workflow-loader.ts` | Create | List/load workflows from `_tables/workflows-f/` | A |
| `app/api/workforce/[agentId]/workflows/route.ts` | Create | GET/POST workflow bindings for an agent | B |
| `app/api/workforce/[agentId]/workflows/available/route.ts` | Create | GET all available workflows | B |
| `app/api/workforce/services/agent-config.ts` | Modify | Add workflow binding CRUD functions | B |
| `app/(pages)/workforce/components/WorkflowEditorPanel.tsx` | Create | Main panel for assigning workflows | C |
| `app/(pages)/workforce/components/WorkflowCard.tsx` | Create | Workflow card with status indicator | C |
| `app/(pages)/workforce/components/WorkflowConnectionSelector.tsx` | Create | Dropdown for binding connections | C |
| `app/(pages)/workforce/components/agent-modal/hooks/useWorkflowAssignment.ts` | Create | Hook for workflow assignment data | C |
| `app/(pages)/workforce/components/agent-modal/components/tabs/CapabilitiesTab.tsx` | Modify | Add workflow-editor view, show real data | D |
| `app/api/tools/services/workflow-tools.ts` | Create | Wrap workflow as executable tool (stretch) | E |
| `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Modify | Add workflow tools to agent (stretch) | E |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-9.1 | `WorkflowBinding` type exists | Type can be imported from `_tables/types.ts` | A |
| AC-9.2 | `AgentConfig` has `workflowBindings` field | Field accessible on agent configs | A |
| AC-9.3 | GET `/workflows` returns agent's bindings | Call endpoint → array of bindings | B |
| AC-9.4 | POST `/workflows` saves bindings | Post → persisted in config | B |
| AC-9.5 | GET `/workflows/available` returns all workflows | Call → WorkflowMetadata[] | B |
| AC-9.6 | Only transpiled workflows in available list | Missing .ts → excluded | B |
| AC-9.7 | Workflows section shows in Capabilities tab | Open agent → see section | D |
| AC-9.8 | "Manage" opens WorkflowEditorPanel | Click → panel slides in | D |
| AC-9.9 | Checkbox assigns/unassigns workflow | Check → binding created | C |
| AC-9.10 | Connection dropdowns show user's connections | Click → see Gmail connections | C |
| AC-9.11 | "Ready" status when all connections bound | All selected → ✅ Ready | C |
| AC-9.12 | "Needs Setup" when connections missing | Some empty → ⚠️ Needs Setup | C |
| AC-9.13 | Agent can invoke workflow (stretch) | Chat → workflow executes | E |

### User Flows (Phase Level)

#### Flow 1: Assign Workflow to Agent

```
1. User opens Agent modal → Capabilities tab
2. Sees: Custom Tools, Connection Tools, Workflows [Manage]
3. Clicks "Manage" in Workflows section
4. WorkflowEditorPanel opens showing available workflows
5. User checks "Email Digest" workflow
6. Workflow expands showing required connections:
   - Gmail → [Select Connection ▼]
7. User selects their Gmail connection
8. Status shows ✅ Ready
9. User clicks "Save Changes"
10. Returns to Capabilities tab with workflow assigned
```

#### Flow 2: Agent Invokes Workflow (Stretch)

```
1. Agent has "Email Digest" workflow assigned
2. User chats: "Send me an email digest"
3. Agent sees "Email Digest" tool available
4. Agent invokes workflow with { recipient: "user@email.com" }
5. Workflow executes using bound Gmail connection
6. Agent responds with result
```

---

## Part A: Types & Services

### Goal

Add the data types for workflow bindings and create the service for loading workflows from disk.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `_tables/types.ts` | Modify | Add `WorkflowBinding`, update `AgentConfig` | +20 |
| `app/api/workflows-f/services/workflow-loader.ts` | Create | List/load/validate workflows | ~120 |

### Pseudocode

#### `_tables/types.ts` (additions)

```
WorkflowBinding
├── workflowId: string
└── connectionBindings: Record<string, string>  // toolkitSlug → connectionId

AgentConfig (update)
├── ... existing fields ...
├── connectionToolBindings?: ConnectionToolBinding[]
└── workflowBindings?: WorkflowBinding[]  // NEW
```

#### `app/api/workflows-f/services/workflow-loader.ts`

```
listAvailableWorkflows(): Promise<WorkflowMetadata[]>
├── Scan _tables/workflows-f/*/
├── For each folder:
│   ├── Check workflow.ts exists
│   ├── If not: Skip
│   ├── Dynamic import workflow.ts
│   └── Extract workflowMetadata export
└── Return sorted by lastModified

getWorkflowMetadata(workflowId: string): Promise<WorkflowMetadata | null>
├── Build path: _tables/workflows-f/{id}/workflow.ts
├── If not exists: Return null
├── Dynamic import
└── Return workflowMetadata export

getWorkflowExecutable(workflowId: string): Promise<MastraWorkflow | null>
├── Build path
├── If not exists: Return null
├── Dynamic import
└── Return default workflow export

validateWorkflowBinding(binding: WorkflowBinding): Promise<ValidationResult>
├── Check workflow exists
├── Get requiredConnections from metadata
├── Check all required connections are bound
└── Return { valid, errors }
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-9.1 | `WorkflowBinding` type exists | Import works |
| AC-9.2 | `AgentConfig` has `workflowBindings` | Field accessible |

### User Flows

#### Flow A.1: Load Available Workflows

```
1. System calls listAvailableWorkflows()
2. Scans _tables/workflows-f/
3. Finds: wf-abc123/, wf-xyz789/
4. For wf-abc123: workflow.ts exists → load metadata
5. For wf-xyz789: only workflow.json → skip
6. Returns [{ id: "wf-abc123", name: "Email Digest", ... }]
```

---

## Part B: API Routes

### Goal

Create the API endpoints for managing workflow bindings on agents.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workforce/[agentId]/workflows/route.ts` | Create | GET/POST bindings | ~80 |
| `app/api/workforce/[agentId]/workflows/available/route.ts` | Create | GET available workflows | ~60 |
| `app/api/workforce/services/agent-config.ts` | Modify | Add workflow binding functions | +60 |

### Pseudocode

#### `app/api/workforce/[agentId]/workflows/route.ts`

```
GET /api/workforce/[agentId]/workflows
├── Get agentId from params
├── Call getWorkflowBindings(agentId)
└── Return { bindings: WorkflowBinding[] }

POST /api/workforce/[agentId]/workflows
├── Get agentId from params
├── Parse body: { bindings: WorkflowBinding[] }
├── Validate each binding
├── Call updateWorkflowBindings(agentId, bindings)
└── Return { success: true }
```

#### `app/api/workforce/[agentId]/workflows/available/route.ts`

```
GET /api/workforce/[agentId]/workflows/available
├── Call listAvailableWorkflows()
└── Return { workflows: WorkflowMetadata[] }
```

#### `app/api/workforce/services/agent-config.ts` (additions)

```
getWorkflowBindings(agentId: string): WorkflowBinding[]
├── Load agent config
└── Return config.workflowBindings || []

updateWorkflowBindings(agentId: string, bindings: WorkflowBinding[]): void
├── Load agent config
├── config.workflowBindings = bindings
└── Write config
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-9.3 | GET `/workflows` returns bindings | Call → array |
| AC-9.4 | POST `/workflows` saves bindings | Post → persisted |
| AC-9.5 | GET `/workflows/available` returns all | Call → WorkflowMetadata[] |
| AC-9.6 | Only transpiled in available | Missing .ts excluded |

### User Flows

#### Flow B.1: Fetch Available Workflows

```
1. WorkflowEditorPanel mounts
2. Calls GET /api/workforce/{agentId}/workflows/available
3. API calls listAvailableWorkflows()
4. Returns all transpiled workflows with metadata
5. Panel renders workflow list
```

---

## Part C: Workflow Editor Panel

### Goal

Build the UI for assigning workflows and binding connections.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workforce/components/WorkflowEditorPanel.tsx` | Create | Main assignment panel | ~250 |
| `app/(pages)/workforce/components/WorkflowCard.tsx` | Create | Workflow card with status | ~80 |
| `app/(pages)/workforce/components/WorkflowConnectionSelector.tsx` | Create | Connection dropdown | ~100 |
| `app/(pages)/workforce/components/agent-modal/hooks/useWorkflowAssignment.ts` | Create | Data fetching hook | ~100 |

### Pseudocode

#### `WorkflowEditorPanel.tsx`

```
WorkflowEditorPanel({ agent, onBack, onSave })
├── State:
│   ├── availableWorkflows: WorkflowMetadata[]
│   ├── assignedBindings: Map<workflowId, WorkflowBinding>
│   └── userConnections: Map<toolkitSlug, Connection[]>
│
├── Load data on mount:
│   ├── GET /workflows/available
│   ├── GET /workflows (current bindings)
│   └── GET user's connections
│
├── Handlers:
│   ├── toggleWorkflow: Add/remove binding
│   ├── changeConnection: Update binding.connectionBindings
│   └── save: POST bindings
│
└── Render:
    ├── Header: "Manage Workflows" [Back]
    ├── For each workflow:
    │   ├── ☐/☑ Checkbox
    │   ├── Name + description
    │   ├── Status badge
    │   └── If expanded: connection selectors
    └── Footer: [Cancel] [Save]
```

#### `WorkflowConnectionSelector.tsx`

```
WorkflowConnectionSelector({ toolkitSlug, selectedId, connections, onChange })
├── Render:
│   ├── Toolkit logo + name
│   ├── →
│   ├── If connections exist:
│   │   └── <Select> with connection options
│   └── If no connections:
│       └── ⚠️ "No connections" + Add link
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-9.9 | Checkbox assigns/unassigns | Check → binding created |
| AC-9.10 | Dropdowns show user's connections | Click → see options |
| AC-9.11 | "Ready" when all bound | All selected → ✅ |
| AC-9.12 | "Needs Setup" when missing | Some empty → ⚠️ |

### User Flows

#### Flow C.1: Assign and Bind

```
1. User opens WorkflowEditorPanel
2. Sees: ☐ Email Digest (requires: Gmail)
3. Checks the checkbox
4. Row expands: Gmail → [Select Connection ▼]
5. User clicks dropdown, sees:
   - jen@company.com
   - work@company.com
6. Selects "jen@company.com"
7. Status: ✅ Ready
8. Clicks Save
```

---

## Part D: Capabilities Tab Integration

### Goal

Wire up the WorkflowEditorPanel to the existing Capabilities tab.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `CapabilitiesTab.tsx` | Modify | Add workflow-editor view, show real data | +80 |
| `useAgentDetails.ts` | Modify | Fetch real workflow bindings | +30 |

### Pseudocode

#### `CapabilitiesTab.tsx` (changes)

```
// Add view state
type ViewState = "list" | "connection-editor" | "workflow-editor"

// Add workflow-editor view
if (view === "workflow-editor") {
  return <WorkflowEditorPanel agent={agent} onBack={...} onSave={...} />
}

// Update list view Workflows section
<div>
  <h3>Workflows</h3>
  <Badge>{workflowBindings.length}</Badge>
  <Button onClick={() => setView("workflow-editor")}>Manage</Button>
  
  {workflowBindings.map(binding => (
    <WorkflowCard workflow={...} binding={binding} />
  ))}
</div>
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-9.7 | Workflows section shows | Open agent → see it |
| AC-9.8 | "Manage" opens panel | Click → panel appears |

### User Flows

#### Flow D.1: Full Assignment Flow

```
1. User opens agent modal
2. Clicks "Capabilities" tab
3. Sees Workflows section with [Manage] button
4. Clicks "Manage"
5. WorkflowEditorPanel slides in
6. User assigns workflow, binds connections
7. Clicks "Save"
8. Returns to Capabilities, sees workflow card
```

---

## Part E: Runtime Integration (Stretch)

### Goal

Enable agents to actually invoke assigned workflows during chat.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/tools/services/workflow-tools.ts` | Create | Wrap workflow as tool | ~120 |
| `chat-service.ts` | Modify | Add workflow tools to agent | +50 |

### Pseudocode

#### `workflow-tools.ts`

```
getWorkflowToolExecutable(userId, binding): ToolDefinition | undefined
├── Load workflow executable
├── Load workflow metadata
├── Create RuntimeContext with connections
├── Return tool({
│     description: metadata.description,
│     parameters: workflow.inputSchema,
│     execute: async (input) => {
│       const run = await workflow.createRunAsync({ runtimeContext })
│       return await run.start({ inputData: input })
│     }
│   })
```

#### `chat-service.ts` (changes)

```
buildToolMap(userId, agentConfig)
├── ... load custom tools ...
├── ... load connection tools ...
├── NEW: For each workflowBinding:
│   ├── getWorkflowToolExecutable(userId, binding)
│   └── Add to toolMap
└── Return toolMap
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-9.13 | Agent can invoke workflow | Chat → workflow executes |

### User Flows

#### Flow E.1: Agent Uses Workflow

```
1. Agent has "Email Digest" assigned with Gmail bound
2. User: "Send me an email digest"
3. Agent sees workflow tool, decides to use it
4. Calls workflow with { recipient: "user@email.com" }
5. Workflow executes:
   - Gmail step uses bound connection
6. Agent receives result, responds to user
```

---

## Out of Scope

- Workflow editing from agent modal → Use workflow editor
- Workflow versioning → Always use latest
- Workflow sharing → Each agent has own bindings
- Real-time execution status → Future
- Parameter overrides → Use workflow inputSchema as-is

---

## References

- **Connection Tools Pattern**: `app/(pages)/workforce/components/ConnectionToolEditorPanel.tsx`
- **Agent Config Service**: `app/api/workforce/services/agent-config.ts`
- **Chat Service**: `app/api/workforce/[agentId]/chat/services/chat-service.ts`
- **Research**: `15.5-workflows-f-transpilation-research.md`
- **Mastra RuntimeContext**: `Workflow-Primitives.md`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-07 | Rewritten using phase template | Assistant |

---

**Last Updated:** December 2025
