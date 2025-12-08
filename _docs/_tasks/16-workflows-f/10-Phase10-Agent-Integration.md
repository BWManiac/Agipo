# Phase 10: Agent Integration

**Status:** 📋 Planned  
**Depends On:** Phase 9 (Workflow Inputs Enhancement), Phase 8 Transpiler Fixes (Prerequisites)  
**Started:** TBD  
**Completed:** TBD

---

## Prerequisites

**Critical:** Before implementing Phase 10, the following transpiler fixes must be completed:

| Issue | File | Fix Required | Why |
|-------|------|--------------|-----|
| **Input name sanitization** | `app/api/workflows/[workflowId]/update/services/transpiler/mapping-generator.ts` | Line 45: Use bracket notation for workflow input names with spaces/special chars | Prevents runtime errors when accessing `inputData["Email Address"]` instead of invalid `inputData.Email Address` |
| **Composio import path** | `app/api/workflows/[workflowId]/update/services/transpiler/index.ts` | Line 105: Change import from `@/lib/composio` to `@/app/api/connections/services/composio` | File `@/lib/composio` doesn't exist. Correct path is `@/app/api/connections/services/composio` |
| **Composio API call** | `app/api/workflows/[workflowId]/update/services/transpiler/step-generator.ts` | Lines 48-51: Generate `const client = getComposioClient(); await client.tools.execute(...)` instead of `composio.executeAction()` | Composio client uses `client.tools.execute()` API, not `composio.executeAction()` |

**Note:** These fixes ensure generated `workflow.ts` files are executable and won't cause runtime errors when agents invoke workflows.

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

#### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `_tables/types.ts` | Modify | Add `WorkflowBinding` type definition and update `AgentConfig` to include `workflowBindings` field, replacing deprecated `assignedWorkflows` | A |

#### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/services/workflow-loader.ts` | Create | Service for listing, loading, and validating workflows from `_tables/workflows/`. Enables dynamic loading of transpiled workflows and metadata extraction for the assignment UI | A |
| `app/api/workforce/services/agent-config.ts` | Modify | Add CRUD functions for workflow bindings (`getWorkflowBindings`, `updateWorkflowBindings`). Enables persistence of workflow assignments per agent | B |

#### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workforce/[agentId]/workflows/route.ts` | Create | GET/POST endpoint for managing an agent's workflow bindings. Returns current bindings and persists new assignments | B |
| `app/api/workforce/[agentId]/workflows/available/route.ts` | Create | GET endpoint returning all available (transpiled) workflows. Powers the workflow selection UI in WorkflowEditorPanel | B |
| `app/api/tools/services/workflow-tools.ts` | Create | Service wrapping workflows as executable tools for agent chat. Enables agents to invoke assigned workflows during conversations (stretch) | E |

#### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/components/agent-modal/hooks/useWorkflowAssignment.ts` | Create | Hook for fetching and managing workflow assignment data (available workflows, user connections, current bindings). Provides data layer for WorkflowEditorPanel | C |

#### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/components/WorkflowEditorPanel.tsx` | Create | Main full-screen panel for assigning workflows to agents. Follows ConnectionToolEditorPanel pattern: header with back button, scrollable content, footer actions. Allows checkbox selection and connection binding | C |
| `app/(pages)/workforce/components/agent-modal/components/shared/WorkflowCard.tsx` | Modify | Update existing WorkflowCard component to display workflow status (Ready/Needs Setup) based on connection bindings. Shows in Capabilities tab list view | C |
| `app/(pages)/workforce/components/WorkflowConnectionSelector.tsx` | Create | Dropdown component for selecting user connections per toolkit requirement. Displays toolkit name, connection options, and "Add connection" link if none available | C |
| `app/(pages)/workforce/components/agent-modal/components/tabs/CapabilitiesTab.tsx` | Modify | Add "workflow-editor" view state, integrate WorkflowEditorPanel, replace MOCK_WORKFLOWS with real data fetching. Add "Manage" button to Workflows section matching Connection Tools pattern | D |
| `app/(pages)/workforce/components/agent-modal/hooks/useAgentDetails.ts` | Modify | Add workflow bindings fetching to replace MOCK_WORKFLOWS. Integrate real API calls for workflow assignment data | D |

#### Backend / Services (Stretch)

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Modify | Add workflow tools to agent's tool map during chat initialization. Enables agents to see and invoke assigned workflows as tools | E |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-10.1 | `WorkflowBinding` type exists | Type can be imported from `_tables/types.ts` | A |
| AC-10.2 | `AgentConfig` has `workflowBindings` field | Field accessible on agent configs | A |
| AC-10.3 | GET `/workflows` returns agent's bindings | Call endpoint → array of bindings | B |
| AC-10.4 | POST `/workflows` saves bindings | Post → persisted in config | B |
| AC-10.5 | GET `/workflows/available` returns all workflows | Call → WorkflowMetadata[] | B |
| AC-10.6 | Only transpiled workflows in available list | Missing .ts → excluded | B |
| AC-10.7 | Workflows section shows in Capabilities tab | Open agent → see section | D |
| AC-10.8 | "Manage" opens WorkflowEditorPanel | Click → panel slides in | D |
| AC-10.9 | Checkbox assigns/unassigns workflow | Check → binding created | C |
| AC-10.10 | Connection dropdowns show user's connections | Click → see Gmail connections | C |
| AC-10.11 | "Ready" status when all connections bound | All selected → ✅ Ready | C |
| AC-10.12 | "Needs Setup" when connections missing | Some empty → ⚠️ Needs Setup | C |
| AC-10.13 | Agent can invoke workflow (stretch) | Chat → workflow executes | E |

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
| `_tables/types.ts` | Modify | Add `WorkflowBinding` type, add `WorkflowMetadata` type, update `AgentConfig` to replace `assignedWorkflows` with `workflowBindings` | +30 |
| `app/api/workflows/services/workflow-loader.ts` | Create | List/load/validate workflows from `_tables/workflows/` with dynamic import pattern | ~150 |

### Pseudocode

#### `_tables/types.ts` (additions)

```
// NEW: WorkflowBinding type
export type WorkflowBinding = {
  workflowId: string;
  connectionBindings: Record<string, string>;  // toolkitSlug → connectionId
};

// NEW: WorkflowMetadata type (returned by workflow-loader)
export type WorkflowMetadata = {
  id: string;
  name: string;
  description?: string;
  requiredConnections: string[];  // toolkit slugs like ["gmail", "slack"]
  stepCount: number;
  lastModified?: string;
};

// AgentConfig (update)
├── ... existing fields ...
├── connectionToolBindings?: ConnectionToolBinding[]
├── assignedWorkflows: string[]  // DEPRECATED - remove in favor of workflowBindings
└── workflowBindings?: WorkflowBinding[]  // NEW - replaces assignedWorkflows
```

#### `app/api/workflows/services/workflow-loader.ts`

```
import fs from "fs/promises";
import path from "path";
import type { WorkflowMetadata } from "@/_tables/types";

listAvailableWorkflows(): Promise<WorkflowMetadata[]>
├── Scan _tables/workflows/*/
├── For each folder:
│   ├── Check if workflow.ts exists
│   ├── If not: Skip (not transpiled)
│   ├── Build full path: _tables/workflows/{id}/workflow.ts
│   ├── Try dynamic import:
│   │   ├── const module = await import(fullPath)
│   │   ├── If module.workflowMetadata exists:
│   │   │   └── Extract metadata
│   │   └── Else: Fallback to workflow.json for basic info
│   └── Continue to next folder
├── Sort by lastModified (descending)
└── Return WorkflowMetadata[]

getWorkflowMetadata(workflowId: string): Promise<WorkflowMetadata | null>
├── Build path: _tables/workflows/{workflowId}/workflow.ts
├── If file doesn't exist: Return null
├── Try dynamic import:
│   ├── const module = await import(path)
│   └── If module.workflowMetadata exists:
│       └── Return module.workflowMetadata
├── Fallback: Read workflow.json and construct metadata
└── Return WorkflowMetadata or null

getWorkflowExecutable(workflowId: string): Promise<MastraWorkflow | null>
├── Build path: _tables/workflows/{workflowId}/workflow.ts
├── If file doesn't exist: Return null
├── Dynamic import: const module = await import(path)
├── Return module.default (the exported workflow)
└── Handle import errors gracefully

validateWorkflowBinding(binding: WorkflowBinding): Promise<ValidationResult>
├── Get workflow metadata via getWorkflowMetadata(binding.workflowId)
├── If metadata is null: Return { valid: false, errors: ["Workflow not found"] }
├── Get requiredConnections from metadata.requiredConnections
├── For each required connection:
│   ├── Check if binding.connectionBindings[toolkit] exists
│   └── If missing: Add to errors array
├── Return { valid: errors.length === 0, errors }
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-10.1 | `WorkflowBinding` type exists | Import works |
| AC-10.2 | `AgentConfig` has `workflowBindings` | Field accessible |

### User Flows

#### Flow A.1: Load Available Workflows

```
1. System calls listAvailableWorkflows()
2. Scans _tables/workflows/ directory
3. Finds: wf-abc123/, wf-xyz789/, wf-def456/
4. For wf-abc123: workflow.ts exists → dynamic import → extract workflowMetadata
5. For wf-xyz789: only workflow.json exists → skip (not transpiled)
6. For wf-def456: workflow.ts exists but no metadata export → fallback to workflow.json
7. Returns sorted array: [{ id: "wf-abc123", name: "Email Digest", requiredConnections: ["gmail"], ... }, ...]
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
├── Load agent config via getAgentById(agentId)
├── Return config.workflowBindings || []
└── Handle missing agent gracefully

updateWorkflowBindings(agentId: string, bindings: WorkflowBinding[]): Promise<void>
├── Get agent filename via getAgentFilename(agentId)
├── Read agent config file from _tables/agents/{filename}.ts
├── Validate each binding via validateWorkflowBinding()
├── Update config.workflowBindings field (remove deprecated assignedWorkflows if present)
├── Write updated config back to file
└── Handle file write errors
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-10.3 | GET `/workflows` returns bindings | Call → array |
| AC-10.4 | POST `/workflows` saves bindings | Post → persisted |
| AC-10.5 | GET `/workflows/available` returns all | Call → WorkflowMetadata[] |
| AC-10.6 | Only transpiled in available | Missing .ts excluded |

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

Build the UI for assigning workflows and binding connections, following the ConnectionToolEditorPanel pattern.

### UI Pattern Specification

**Based on ConnectionToolEditorPanel structure:**
- **Layout**: Full-screen panel (not modal), flex column with `overflow-hidden`
- **Header**: Fixed height, white background, border-bottom, contains back button (ChevronLeft icon) and title/description
- **Search** (optional): Fixed height, white background, border-bottom, only shown if workflows exist
- **Content**: `flex-1 overflow-y-auto` scrollable area with padding, contains workflow list
- **Footer**: Fixed height, white background, border-top, contains Cancel and Save buttons

**Workflow Expansion Behavior:**
- Workflows are **collapsed by default**
- Checkbox controls assignment (checked = assigned)
- **When checked**: Workflow row expands to show connection selectors for each `requiredConnection`
- **When unchecked**: Workflow row collapses, binding is removed
- Status badge (Ready/Needs Setup) shown next to workflow name

**Status Logic:**
- **✅ Ready**: All `requiredConnections` have a bound connectionId in `binding.connectionBindings`
- **⚠️ Needs Setup**: One or more `requiredConnections` are missing bindings
- Badge shown inline with workflow name in collapsed state

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workforce/components/WorkflowEditorPanel.tsx` | Create | Main assignment panel following ConnectionToolEditorPanel pattern | ~300 |
| `app/(pages)/workforce/components/agent-modal/components/shared/WorkflowCard.tsx` | Modify | Update existing WorkflowCard to show status badge based on binding completeness | +40 |
| `app/(pages)/workforce/components/WorkflowConnectionSelector.tsx` | Create | Dropdown component for selecting connections per toolkit requirement | ~120 |
| `app/(pages)/workforce/components/agent-modal/hooks/useWorkflowAssignment.ts` | Create | Hook for fetching available workflows, user connections, and current bindings | ~120 |

### Pseudocode

#### `useWorkflowAssignment.ts`

```
useWorkflowAssignment(agentId: string)
├── State:
│   ├── availableWorkflows: WorkflowMetadata[]
│   ├── userConnections: Connection[]  // From listConnections(userId)
│   ├── currentBindings: WorkflowBinding[]
│   └── isLoading: boolean
│
├── useEffect on mount:
│   ├── Fetch GET /api/workforce/{agentId}/workflows/available
│   ├── Fetch GET /api/workforce/{agentId}/workflows
│   ├── Fetch GET /api/connections/list (or use listConnections service)
│   └── Set state
│
└── Return: { availableWorkflows, userConnections, currentBindings, isLoading }

// Helper: Group connections by toolkit
groupConnectionsByToolkit(connections: Connection[]): Map<toolkitSlug, Connection[]>
```

#### `WorkflowEditorPanel.tsx`

```
WorkflowEditorPanel({ agent, onBack, onSave })
├── Use useWorkflowAssignment(agent.id) hook
├── State:
│   ├── selectedBindings: Map<workflowId, WorkflowBinding>  // Local edits
│   ├── expandedWorkflows: Set<workflowId>  // UI state for expansion
│   └── isSaving: boolean
│
├── Initialize selectedBindings from currentBindings on mount
│
├── Handlers:
│   ├── toggleWorkflow(workflowId):
│   │   ├── If binding exists: Remove from selectedBindings, remove from expandedWorkflows
│   │   └── Else: Create new binding with empty connectionBindings, add to expandedWorkflows
│   │
│   ├── changeConnection(workflowId, toolkitSlug, connectionId):
│   │   └── Update selectedBindings[workflowId].connectionBindings[toolkitSlug] = connectionId
│   │
│   ├── getWorkflowStatus(workflowId):
│   │   ├── Get binding from selectedBindings
│   │   ├── Get workflow metadata
│   │   ├── Check if all requiredConnections are bound
│   │   └── Return "ready" | "needs-setup"
│   │
│   └── handleSave():
│       ├── Convert selectedBindings Map to array
│       ├── POST to /api/workforce/{agent.id}/workflows
│       └── Call onSave callback
│
└── Render (following ConnectionToolEditorPanel structure):
    ├── Header (fixed):
    │   ├── <ChevronLeft onClick={onBack} />
    │   ├── <h2>Manage Workflows</h2>
    │   └── <p>Select which workflows {agent.name} can use</p>
    │
    ├── Search (conditional, fixed):
    │   └── <Input placeholder="Search workflows..." />
    │
    ├── Content (scrollable, flex-1):
    │   ├── If isLoading: Loading spinner
    │   ├── If no workflows: Empty state with message
    │   └── Else: Workflow list
    │       └── For each workflow:
    │           ├── Collapsed row (always visible):
    │           │   ├── <Checkbox checked={binding exists} onChange={toggleWorkflow} />
    │           │   ├── Workflow name + description
    │           │   ├── Status badge (Ready/Needs Setup)
    │           │   └── <ChevronRight/Down> for expansion indicator
    │           │
    │           └── Expanded section (if checked):
    │               └── For each requiredConnection:
    │                   └── <WorkflowConnectionSelector
    │                       toolkitSlug={...}
    │                       selectedId={binding.connectionBindings[toolkitSlug]}
    │                       connections={groupedConnections[toolkitSlug]}
    │                       onChange={(id) => changeConnection(workflowId, toolkitSlug, id)}
    │                   />
    │
    └── Footer (fixed):
        ├── <Button variant="outline" onClick={onBack}>Cancel</Button>
        └── <Button onClick={handleSave} disabled={isSaving}>Save Changes</Button>
```

#### `WorkflowConnectionSelector.tsx`

```
WorkflowConnectionSelector({ toolkitSlug, selectedId, connections, onChange })
├── Render:
│   ├── <div className="flex items-center gap-3">
│   │   ├── Toolkit logo (if available) or placeholder icon
│   │   ├── <span>{toolkitSlug} (e.g., "Gmail")</span>
│   │   ├── <span>→</span>
│   │   ├── If connections.length > 0:
│   │   │   └── <Select value={selectedId} onValueChange={onChange}>
│   │   │       ├── <SelectTrigger>Select connection...</SelectTrigger>
│   │   │       └── <SelectContent>
│   │   │           └── connections.map(conn =>
│   │   │               <SelectItem value={conn.id}>{conn.accountLabel}</SelectItem>
│   │   │           )
│   │   │       </SelectContent>
│   │   │   </Select>
│   │   │
│   │   └── Else:
│   │       ├── <span className="text-muted-foreground">No connections</span>
│   │       └── <Link href="/profile">Add connection</Link>
│   │   </div>
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-10.9 | Checkbox assigns/unassigns | Check → binding created |
| AC-10.10 | Dropdowns show user's connections | Click → see options |
| AC-10.11 | "Ready" when all bound | All selected → ✅ |
| AC-10.12 | "Needs Setup" when missing | Some empty → ⚠️ |

### User Flows

#### Flow C.1: Assign and Bind

```
1. User opens WorkflowEditorPanel
2. Sees collapsed workflow list: ☐ Email Digest ⚠️ Needs Setup
3. User checks the checkbox for "Email Digest"
4. Row expands automatically, showing:
   - Gmail → [Select Connection ▼]
5. User clicks dropdown, sees available Gmail connections:
   - jen@company.com
   - work@company.com
6. User selects "jen@company.com"
7. Status badge updates to: ✅ Ready (all required connections now bound)
8. User clicks "Save Changes"
9. Panel closes, returns to Capabilities tab
10. Workflow card appears in list with ✅ Ready status
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
// Update ViewState type
type ViewState = "list" | "connection-editor" | "workflow-editor"

// Add workflow-editor view (full panel replaces tab content)
if (view === "workflow-editor") {
  return (
    <WorkflowEditorPanel
      agent={agent}
      onBack={() => setView("list")}
      onSave={handleSaveWorkflows}
    />
  );
}

// Update list view Workflows section (matches Connection Tools pattern)
<div className="space-y-4">
  <div className="flex justify-between items-center">
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
      Workflows
    </h3>
    <button
      onClick={() => setView("workflow-editor")}
      className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
    >
      Manage
    </button>
  </div>
  
  {workflowBindings.length === 0 ? (
    <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
      <p className="text-sm text-gray-500">No workflows assigned.</p>
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-4">
      {workflowBindings.map(binding => {
        const workflow = availableWorkflows.find(w => w.id === binding.workflowId);
        return workflow ? (
          <WorkflowCard key={binding.workflowId} workflow={workflow} binding={binding} />
        ) : null;
      })}
    </div>
  )}
</div>

// Add handler
const handleSaveWorkflows = async (bindings: WorkflowBinding[]) => {
  const response = await fetch(`/api/workforce/${agent.id}/workflows`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bindings }),
  });
  if (!response.ok) throw new Error("Failed to save workflows");
  // Refresh data via useAgentDetails hook
  window.location.reload(); // Or use state update pattern
};
```

#### `useAgentDetails.ts` (changes)

```
// Replace MOCK_WORKFLOWS with real data
const [workflows, setWorkflows] = useState<WorkflowBinding[]>([]);

// In fetchData function:
if (agent) {
  // Add workflow bindings fetch
  const workflowsResponse = await fetch(`/api/workforce/${agent.id}/workflows`);
  if (workflowsResponse.ok) {
    const data = await workflowsResponse.json();
    setWorkflows(data.bindings || []);
  } else {
    setWorkflows([]);
  }
}

// Return workflows instead of MOCK_WORKFLOWS
return {
  // ... existing fields ...
  workflows,  // Changed from MOCK_WORKFLOWS
};
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-10.7 | Workflows section shows | Open agent → see it |
| AC-10.8 | "Manage" opens panel | Click → panel appears |

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

## Out of Scope

- **Runtime workflow execution** → Moved to Phase 11 (Workflow Runtime Execution)
  - Wrapping workflows as tools for agent chat
  - Integrating workflow tools into chat service
  - See Phase 11 for full implementation details

---

## Out of Scope

- **Runtime workflow execution** → Moved to Phase 11 (Workflow Runtime Execution)
  - Wrapping workflows as tools for agent chat
  - Integrating workflow tools into chat service
  - See Phase 11 for full implementation details
- Workflow editing from agent modal → Use workflow editor
- Workflow versioning → Always use latest
- Workflow sharing → Each agent has own bindings
- Real-time execution status → Future
- Parameter overrides → Use workflow inputSchema as-is

---

## References

- **Phase 11**: Workflow Runtime Execution - Runtime integration for agent workflow invocation
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
| 2025-12-07 | Major update: Added Prerequisites section, fixed storage paths (`workflows-f/` → `workflows/`), reorganized File Impact by category, added WorkflowMetadata type, updated component paths, enhanced pseudocode with specific implementation details, added UI pattern specifications from ConnectionToolEditorPanel, clarified AgentConfig changes | Assistant |

---

**Last Updated:** December 2025
