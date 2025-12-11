# Task 18: Agent Modal Store Refactor — Implementation Plan

**Status:** Planning  
**Date:** December 2025  
**Goal:** Refactor Agent Modal from scattered hooks to unified Zustand store following our established slice architecture pattern.

---

## How to Use This Document

This document defines **how to build** the Agent Modal store refactor. It's informed by the Product Spec and Research Log.

**Informed by:**
- **Product Spec:** [00-Product-Spec.md](./00-Product-Spec.md) — Requirements, acceptance criteria, state variables, actions
- **Research Log:** [01-Research-Log.md](./01-Research-Log.md) — Current hooks, API patterns, Mastra alignment

**This document covers:**
1. **Where are we?** (Current State) — Existing hooks and component patterns
2. **What do we touch?** (File Impact) — Files to create, modify, delete
3. **How do we build it?** (Phased Implementation) — Step-by-step milestones

Each phase has acceptance criteria for early verification.

---

## 1. Executive Summary

Agent Modal currently uses four scattered React hooks (`useAgentDetails`, `useConnectionTools`, `useCustomTools`, `useWorkflowAssignment`) that duplicate patterns and create inconsistent state management. The Workflow Editor demonstrates our established Zustand slice architecture pattern—a proven approach with clear separation of concerns and predictable data flow.

**Current State:** Hooks manage state independently, components call hooks directly, data fetching happens in multiple places, `window.location.reload()` used after saves.

**End State:** Unified `useAgentModalStore` with three focused slices (`agentDetailsSlice`, `capabilitiesSlice`, `uiSlice`), components call store actions, all state updates go through store, no page reloads.

---

## 2. Current State Analysis

### 2.1 How It Works Today

**Current Data Flow:**
```
Component → Hook → API Call → useState Update → Component Re-render
```

**Example (CapabilitiesTab):**
1. Component uses `useAgentDetails(agent)` hook
2. Hook's `useEffect` fetches data when `agent` changes
3. Component also has local `useState` for `workflowBindings` (duplicate!)
4. Save handlers call `fetch()` directly, then `window.location.reload()`
5. Page reloads, hooks re-fetch everything

**Problems:**
- Duplicate state (`workflowBindings` in both hook and component)
- Page reloads lose state and create poor UX
- No single source of truth
- Inconsistent patterns across hooks

### 2.2 Key Data Structures

**AgentConfig** (from `_tables/types.ts`):
```typescript
type AgentConfig = {
  id: string;
  name: string;
  systemPrompt: string;
  model: string;
  toolIds: string[];                    // Custom tool IDs
  connectionToolBindings?: ConnectionToolBinding[];  // Connection tools
  workflowBindings?: WorkflowBinding[];  // Workflows
  // ... other fields
};
```

**ConnectionToolBinding:**
```typescript
type ConnectionToolBinding = {
  toolId: string;        // e.g., "GMAIL_SEND_EMAIL"
  connectionId: string; // e.g., "ca_abc123"
  toolkitSlug: string;   // e.g., "gmail"
};
```

**WorkflowBinding:**
```typescript
type WorkflowBinding = {
  workflowId: string;
  connectionBindings: Record<string, string>; // toolkitSlug → connectionId
};
```

### 2.3 Relevant Primitives/APIs

| Method/Endpoint | Purpose | Notes |
|-----------------|---------|-------|
| `GET /api/tools/list` | Get all available custom tools | Returns `WorkflowSummary[]` |
| `GET /api/workforce/[agentId]/tools/custom` | Get assigned custom tool IDs | Returns `{ toolIds: string[] }` |
| `POST /api/workforce/[agentId]/tools/custom` | Save custom tool assignments | Body: `{ toolIds: string[] }` |
| `GET /api/workforce/[agentId]/tools/connection` | Get assigned connection bindings | Returns `{ bindings: ConnectionToolBinding[] }` |
| `POST /api/workforce/[agentId]/tools/connection` | Save connection bindings | Body: `{ bindings: ConnectionToolBinding[] }` |
| `GET /api/workforce/[agentId]/tools/connection/available` | Get available connections | Returns `{ connections, platformToolkits }` |
| `GET /api/workforce/[agentId]/workflows` | Get assigned workflow bindings | Returns `{ bindings: WorkflowBinding[] }` |
| `POST /api/workforce/[agentId]/workflows` | Save workflow bindings | Body: `{ bindings: WorkflowBinding[] }`, validates |
| `GET /api/workforce/[agentId]/workflows/available` | Get available workflows | Returns `{ workflows: WorkflowMetadata[] }` |
| `GET /api/connections/list` | Get user connections | Returns `Connection[]` |
| `getAgentById(id)` | Get agent config | From `@/_tables/agents` |

---

## 3. Acceptance Criteria

### Store Structure ([6] criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC1 | `useAgentModalStore` exists and exports unified store | Check `store/index.ts` exports `useAgentModalStore` |
| AC2 | Store composed of 3 slices (agentDetails, capabilities, ui) | Inspect `store/index.ts` composition |
| AC3 | Each slice follows 4-part structure (State, Actions, Initial State, Creator) | Review each slice file structure |
| AC4 | Store types exported from `store/types.ts` | Verify `types.ts` exports all slice types |
| AC5 | All slices have proper TypeScript types | `npx tsc --noEmit` passes |
| AC6 | Initial state defined for each slice | Check each slice has `initialState` |

### Slice Implementation ([8] criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC7 | `agentDetailsSlice` manages agent config, tools, bindings, workflows | Test loading agent and verify state |
| AC8 | `capabilitiesSlice` manages custom tools, connection tools, workflows | Test assigning/unassigning capabilities |
| AC9 | `uiSlice` manages activeTab, editor views, selections | Test tab switching and editor state |
| AC10 | Actions use `set()` for state updates | Review action implementations |
| AC11 | Actions call APIs directly (via `fetch()`) | Inspect action implementations |
| AC12 | Console logging follows `[SliceName]` pattern | Check console.log prefixes |
| AC13 | Error handling stores error messages in state | Test error scenarios |
| AC14 | Loading states are granular per capability type | Test loading states independently |

### Component Migration ([6] criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC15 | No remaining hook imports (`useAgentDetails`, `useConnectionTools`, etc.) | `grep -r "useAgentDetails\|useConnectionTools\|useCustomTools\|useWorkflowAssignment"` returns no results |
| AC16 | Components use `useAgentModalStore()` instead of hooks | Check component imports and usage |
| AC17 | Components call store actions (e.g., `store.fetchAgentDetails()`) | Inspect component code |
| AC18 | No direct service imports in components | `grep -r "from.*services"` in components returns no results |
| AC19 | No `window.location.reload()` calls | `grep -r "location.reload"` returns no results |
| AC20 | Duplicate state removed from `CapabilitiesTab` | Check component has no local `workflowBindings` or `workflowMetadata` |

### Backwards Compatibility ([6] criteria)

| # | Criterion | Testable By |
|---|-----------|-------------|
| AC21 | Overview tab displays agent info correctly | Manual test: open agent modal, view overview |
| AC22 | Capabilities tab shows all tools/workflows | Manual test: view capabilities, verify lists |
| AC23 | Assigning custom tools works | Manual test: assign tool, save, verify persistence |
| AC24 | Assigning connection tools works | Manual test: assign connection tool, save, verify |
| AC25 | Assigning workflows works | Manual test: assign workflow, save, verify |
| AC26 | All tabs render without errors | Manual test: navigate through all tabs |

---

## 4. User Flows

### Flow 1: View Agent Capabilities (Happy Path)

```
1. User opens Agent Modal for agent "PM"
2. Component calls `store.setAgent(agent)` 
3. Store auto-loads agent details via `loadAgentDetails(agentId)`
4. Store fetches tools, bindings, workflows in parallel
5. User navigates to Capabilities tab
6. Component reads from `store.assignedCustomTools`, `store.assignedConnectionBindings`, `store.assignedWorkflowBindings`
7. System displays all capabilities from unified store state
```

### Flow 2: Assign Custom Tool

```
1. User in Capabilities tab clicks "Assign Tool"
2. Component calls `store.openCustomEditor()`
3. User selects tools and clicks "Save"
4. Component calls `store.saveCustomTools(agentId, toolIds)`
5. Store action:
   a. Sets `isSavingCustomTools = true`
   b. Calls `POST /api/workforce/${agentId}/tools/custom`
   c. Updates `assignedCustomToolIds` in state
   d. Calls `refreshAllCapabilities(agentId)` to sync data
   e. Sets `isSavingCustomTools = false`
6. UI automatically re-renders showing updated tool list
7. User sees success feedback (no page reload)
```

### Flow 3: Assign Connection Tool

```
1. User in Capabilities tab views connection tools
2. User clicks "Manage" → `store.setView("connection-editor")`
3. User selects tools and clicks "Save"
4. Component calls `store.saveConnectionTools(agentId, bindings)`
5. Store action saves and refreshes data
6. UI re-renders showing new connection tools
```

### Flow 4: Error Handling

```
1. User attempts to assign tool
2. API call fails (network error, validation error)
3. Store action catches error
4. Store updates `errorCustomTools` (or appropriate error field) in state
5. Component displays error message from `store.errorCustomTools`
6. User can retry or cancel
```

---

## 5. File Impact Analysis

| File | Action | Description |
|------|--------|-------------|
| `app/(pages)/workforce/components/agent-modal/store/index.ts` | **Create** | Store composition (useAgentModalStore) |
| `app/(pages)/workforce/components/agent-modal/store/types.ts` | **Create** | Shared types and store interface |
| `app/(pages)/workforce/components/agent-modal/store/slices/agentDetailsSlice.ts` | **Create** | Agent details slice (4-part structure) |
| `app/(pages)/workforce/components/agent-modal/store/slices/capabilitiesSlice.ts` | **Create** | Capabilities slice (custom tools, connection tools, workflows) |
| `app/(pages)/workforce/components/agent-modal/store/slices/uiSlice.ts` | **Create** | UI slice (tabs, editors, selections) |
| `app/(pages)/workforce/components/agent-modal/AgentModal.tsx` | Modify | Use `useAgentModalStore` for `activeTab` |
| `app/(pages)/workforce/components/agent-modal/components/tabs/CapabilitiesTab.tsx` | Modify | Replace hooks with store, remove duplicate state |
| `app/(pages)/workforce/components/agent-modal/components/tabs/OverviewTab.tsx` | Modify | Use store for mock data |
| `app/(pages)/workforce/components/agent-modal/components/tabs/TasksTab.tsx` | Modify | Use store for tasks |
| `app/(pages)/workforce/components/agent-modal/components/tabs/PlannerTab.tsx` | Modify | Use store for jobs/triggers |
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab.tsx` | Modify | Use store for records |
| `app/(pages)/workforce/components/ConnectionToolEditorPanel.tsx` | Modify | Replace `useConnectionTools` with store |
| `app/(pages)/workforce/components/WorkflowEditorPanel.tsx` | Modify | Replace `useWorkflowAssignment` with store |
| `app/(pages)/workforce/components/agent-modal/hooks/useAgentDetails.ts` | Delete | Replaced by `agentDetailsSlice` |
| `app/(pages)/workforce/components/agent-modal/hooks/useConnectionTools.ts` | Delete | Replaced by `capabilitiesSlice` |
| `app/(pages)/workforce/components/agent-modal/hooks/useCustomTools.ts` | Delete | Replaced by `capabilitiesSlice` |
| `app/(pages)/workforce/components/agent-modal/hooks/useWorkflowAssignment.ts` | Delete | Replaced by `capabilitiesSlice` |

---

## 6. Implementation Phases

### Phase 1: Store Foundation

**Goal:** Create store structure with types and empty slices following 4-part pattern.

**Changes:**
1. Create `store/index.ts` with store composition
2. Create `store/types.ts` with shared types and store interface
3. Create `store/slices/agentDetailsSlice.ts` with 4-part structure (empty implementations)
4. Create `store/slices/capabilitiesSlice.ts` with 4-part structure (empty implementations)
5. Create `store/slices/uiSlice.ts` with 4-part structure (empty implementations)

**Phase 1 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P1.1 | Store files created in correct location | Check `store/` directory structure |
| P1.2 | `useAgentModalStore` exports and compiles | `npx tsc --noEmit` passes |
| P1.3 | All slices follow 4-part structure | Review each slice file |
| P1.4 | Types exported from `types.ts` | Check `types.ts` exports |
| P1.5 | Store can be imported without errors | Import in test component |

**Phase 1 Test Flow:**
```typescript
// Test in browser console or test file
import { useAgentModalStore } from './store';
const store = useAgentModalStore.getState();
console.log(store); // Should show empty state
```

---

### Phase 2: Implement agentDetailsSlice

**Goal:** Implement `agentDetailsSlice` with all state variables and actions.

**Changes:**
1. Define `AgentDetailsSliceState` interface with all state variables
2. Define `AgentDetailsSliceActions` interface with all actions
3. Create `initialState` with default values
4. Implement `createAgentDetailsSlice` with all actions:
   - `setAgent()` - Set agent, auto-load details
   - `loadAgentDetails()` - Fetch all agent data
   - `getAssignedCustomTools()` - Computed getter
   - `resetAgentDetails()` - Clear state

**Phase 2 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P2.1 | `agentDetailsSlice` has all state variables | Check State interface |
| P2.2 | `agentDetailsSlice` has all actions | Check Actions interface |
| P2.3 | `setAgent()` updates agent and triggers load | Test: `store.setAgent(agent)`, verify state |
| P2.4 | `loadAgentDetails()` fetches data correctly | Test: call action, verify API calls |
| P2.5 | `getAssignedCustomTools()` filters correctly | Test: verify computed value |
| P2.6 | Loading and error states work | Test: verify `isLoadingDetails` and `error` |

**Phase 2 Test Flow:**
```typescript
const store = useAgentModalStore();
await store.setAgent(mockAgent);
// Verify: store.agent === mockAgent
// Verify: store.isLoadingDetails === true (then false)
// Verify: store.allCustomTools, connectionBindings, workflowBindings populated
```

---

### Phase 3: Implement capabilitiesSlice

**Goal:** Implement `capabilitiesSlice` with all capability management (custom tools, connection tools, workflows).

**Changes:**
1. Define `CapabilitiesSliceState` interface with all state variables
2. Define `CapabilitiesSliceActions` interface with all actions
3. Create `initialState` with default values
4. Implement `createCapabilitiesSlice` with all actions:
   - Custom tools: `fetchCustomTools()`, `saveCustomTools()`
   - Connection tools: `fetchConnectionTools()`, `saveConnectionTools()`, `isConnectionToolAssigned()`
   - Workflows: `fetchWorkflows()`, `fetchUserConnections()`, `saveWorkflows()`, `groupConnectionsByToolkit()`
   - Bulk: `refreshAllCapabilities()`

**Phase 3 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P3.1 | `capabilitiesSlice` has all state variables | Check State interface |
| P3.2 | `capabilitiesSlice` has all actions | Check Actions interface |
| P3.3 | `fetchCustomTools()` works | Test: call action, verify API call and state update |
| P3.4 | `saveCustomTools()` saves and refreshes | Test: save, verify API call, verify refresh |
| P3.5 | `fetchConnectionTools()` handles 401 gracefully | Test: unauthenticated request, verify empty arrays |
| P3.6 | `saveConnectionTools()` works | Test: save bindings, verify state update |
| P3.7 | `fetchWorkflows()` works | Test: call action, verify API calls |
| P3.8 | `saveWorkflows()` validates and saves | Test: save with invalid binding, verify error |
| P3.9 | Granular loading states work | Test: verify `isLoadingCustomTools`, `isLoadingConnectionTools`, `isLoadingWorkflows` |
| P3.10 | Error states stored correctly | Test: trigger error, verify error message in state |

**Phase 3 Test Flow:**
```typescript
const store = useAgentModalStore();
await store.fetchCustomTools("pm");
// Verify: store.availableCustomTools populated
// Verify: store.assignedCustomToolIds populated
// Verify: store.isLoadingCustomTools === false

await store.saveCustomTools("pm", ["tool1", "tool2"]);
// Verify: API called
// Verify: store.assignedCustomToolIds === ["tool1", "tool2"]
// Verify: refreshAllCapabilities called
```

---

### Phase 4: Implement uiSlice

**Goal:** Implement `uiSlice` with all UI state and actions.

**Changes:**
1. Define `UiSliceState` interface with all state variables
2. Define `UiSliceActions` interface with all actions
3. Create `initialState` with default values
4. Implement `createUiSlice` with all actions:
   - Tab management: `setActiveTab()`
   - Editor views: `setView()`, `openCustomEditor()`, `closeCustomEditor()`
   - Connection editor: `toggleConnectionBinding()`, `toggleToolkit()`, `setConnectionSearchQuery()`
   - Workflow editor: `toggleWorkflow()`, `setWorkflowConnection()`, `setWorkflowSearchQuery()`
   - Reset: `resetEditorState()`

**Phase 4 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P4.1 | `uiSlice` has all state variables | Check State interface |
| P4.2 | `uiSlice` has all actions | Check Actions interface |
| P4.3 | `setActiveTab()` works | Test: switch tabs, verify state |
| P4.4 | Editor view actions work | Test: `setView()`, `openCustomEditor()`, `closeCustomEditor()` |
| P4.5 | Connection editor actions work | Test: toggle bindings, toolkits, search |
| P4.6 | Workflow editor actions work | Test: toggle workflows, set connections, search |
| P4.7 | `resetEditorState()` clears all editor UI | Test: call action, verify all editor state reset |

**Phase 4 Test Flow:**
```typescript
const store = useAgentModalStore();
store.setActiveTab("capabilities");
// Verify: store.activeTab === "capabilities"

store.setView("connection-editor");
// Verify: store.view === "connection-editor"

store.toggleConnectionBinding("conn1:tool1");
// Verify: store.selectedConnectionBindings has "conn1:tool1"
```

---

### Phase 5: Migrate Components

**Goal:** Replace all hook usage with store actions in components.

**Changes:**
1. Update `AgentModal.tsx` to use store for `activeTab`
2. Update `CapabilitiesTab.tsx`:
   - Remove `useAgentDetails` import
   - Remove local `workflowBindings` and `workflowMetadata` state
   - Use store actions and state
   - Replace save handlers to call store actions (no `window.location.reload()`)
3. Update `OverviewTab.tsx`, `TasksTab.tsx`, `PlannerTab.tsx`, `RecordsTab.tsx` to use store
4. Update `ConnectionToolEditorPanel.tsx` to use store instead of `useConnectionTools`
5. Update `WorkflowEditorPanel.tsx` to use store instead of `useWorkflowAssignment`

**Phase 5 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P5.1 | No hook imports in components | `grep -r "useAgentDetails\|useConnectionTools\|useCustomTools\|useWorkflowAssignment"` in components |
| P5.2 | All components use `useAgentModalStore()` | Check component imports |
| P5.3 | `CapabilitiesTab` has no duplicate state | Check component has no local `workflowBindings` |
| P5.4 | Save handlers call store actions | Check save handler implementations |
| P5.5 | No `window.location.reload()` calls | `grep -r "location.reload"` returns no results |
| P5.6 | All tabs work correctly | Manual test: navigate through all tabs |

**Phase 5 Test Flow:**
```
1. Open Agent Modal
2. Navigate to each tab
3. Verify data displays correctly
4. In Capabilities tab:
   a. Assign custom tool → verify save works, no reload
   b. Assign connection tool → verify save works, no reload
   c. Assign workflow → verify save works, no reload
5. Verify no console errors
```

---

### Phase 6: Cleanup and Verification

**Goal:** Remove old hooks and verify everything works.

**Changes:**
1. Delete `hooks/useAgentDetails.ts`
2. Delete `hooks/useConnectionTools.ts`
3. Delete `hooks/useCustomTools.ts`
4. Delete `hooks/useWorkflowAssignment.ts`
5. Verify TypeScript compilation passes
6. Verify all acceptance criteria pass
7. Manual testing of all flows

**Phase 6 Acceptance Criteria:**

| # | Criterion | Test Method |
|---|-----------|-------------|
| P6.1 | All hook files deleted | Check `hooks/` directory is empty or removed |
| P6.2 | TypeScript compilation passes | `npx tsc --noEmit` |
| P6.3 | No console errors in browser | Manual test: open modal, use all features |
| P6.4 | All acceptance criteria (Section 3) pass | Full test suite |
| P6.5 | Backwards compatibility maintained | Manual test: all existing functionality works |

**Phase 6 Test Flow (End-to-End):**
```
1. Open Agent Modal for agent "PM"
2. Verify Overview tab shows agent info
3. Navigate to Capabilities tab
4. Verify all tools/workflows display
5. Assign a custom tool → save → verify persists, no reload
6. Assign a connection tool → save → verify persists, no reload
7. Assign a workflow → save → verify persists, no reload
8. Navigate to other tabs → verify all work
9. Close and reopen modal → verify state resets correctly
10. Verify no console errors
```

---

## 7. Design Decisions

| Decision | Rationale |
|----------|-----------|
| 3 slices (agentDetails, capabilities, ui) | Clear separation: agent identity, capability management, UI state |
| One `capabilitiesSlice` with subsections | All capabilities become "tools" to Mastra agent, unified management |
| Granular loading states per capability type | Better UX, can show partial loading states |
| No persistence | Modal is ephemeral, state resets when closed |
| Cache agent in store | Prevents re-fetches when agent prop changes |
| Store error messages | Better debugging and user feedback |
| Auto-refresh after saves | Better UX, state stays in sync, no page reloads |
| Direct `fetch()` calls initially | Keep it simple, extract to services later if pattern emerges |

---

## 8. Out of Scope

- UI/UX changes (this is a refactor, not a redesign)
- New features (only state management refactor)
- Performance optimizations (can be separate task)
- Testing infrastructure (can be separate task)
- Service layer extraction (defer to later if pattern emerges)
- Optimistic updates (can be added later)

---

## 9. References

- **Product Spec:** [00-Product-Spec.md](./00-Product-Spec.md)
- **Research Log:** [01-Research-Log.md](./01-Research-Log.md)
- **Store-Slice Architecture:** `_docs/Engineering/Architecture/Store-Slice-Architecture.md`
- **Workflow Editor Store:** `app/(pages)/tools/editor/store/` (exemplar implementation)
- **Mastra Workflows:** [https://mastra.ai/docs/workflows/overview](https://mastra.ai/docs/workflows/overview)

---

## 10. Completed Work

[Track progress as work is done]

---

## Notes

[Optional section for ongoing notes, questions, or discussions during implementation]

