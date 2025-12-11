# Task 18: Agent Modal Store Refactor — Product Spec

**Status:** Planning  
**Date:** December 2025  
**Goal:** Refactor Agent Modal from scattered hooks to unified Zustand store following our established slice architecture pattern, improving state management consistency and maintainability.

---

## How to Use This Document

This document defines **what to build**. It will inform the Research Log (if needed) and Implementation Plan.

**Sections:**
1. Executive Summary — The "elevator pitch"
2. Product Requirements — What the feature must do
3. Acceptance Criteria — How we know it's done
4. User Flows — Step-by-step user journeys
5. Design Decisions — Choices we control
6. UXD Requirements — Mockups needed before implementation
7. Success Criteria — The finish line

**When complete:** This document informs the Research Log (if external APIs are involved) and the Implementation Plan.

---

## 1. Executive Summary

The Agent Modal currently uses scattered React hooks (`useAgentDetails`, `useConnectionTools`, `useCustomTools`, `useWorkflowAssignment`) that duplicate patterns and create inconsistent state management. The Workflow Editor demonstrates our established Zustand slice architecture pattern—a proven approach that provides clear separation of concerns, predictable data flow, and maintainable code structure.

**Problem:** Agent Modal state management is inconsistent with our architectural patterns, making it harder to understand, maintain, and extend.

**Solution:** Refactor Agent Modal to use a unified Zustand store with focused slices, following the same 4-part structure (State Interface, Actions Interface, Initial State, Slice Creator) used in the Workflow Editor.

**Who benefits:** Developers (easier to maintain and extend), future AI assistants (clearer patterns to follow), and ultimately users (more reliable and consistent behavior).

**End state:** Agent Modal uses a unified `useAgentModalStore` with clear slices, eliminating scattered hooks and aligning with our Store-Slice Architecture pattern.

---

## 2. Product Requirements

### 2.1 State Management Unification

**Definition:** Consolidate all Agent Modal state into a single Zustand store with focused slices.

**Why it matters:** 
- Consistency with Workflow Editor pattern (our exemplar)
- Easier to understand data flow
- Better debugging (single source of truth)
- Clearer patterns for future development

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-1.1 | Create `useAgentModalStore` following Zustand slice pattern | P0 |
| PR-1.2 | Replace `useAgentDetails` hook with `agentDetailsSlice` | P0 |
| PR-1.3 | Replace `useConnectionTools` hook with `capabilitiesSlice` (connection tools) | P0 |
| PR-1.4 | Replace `useCustomTools` hook with `capabilitiesSlice` (custom tools) | P0 |
| PR-1.5 | Replace `useWorkflowAssignment` hook with `capabilitiesSlice` (workflows) | P0 |
| PR-1.6 | Create `uiSlice` for modal state (activeTab, editor views, selections) | P1 |

### 2.2 Slice Architecture Compliance

**Definition:** Each slice must follow the established 4-part structure from `Store-Slice-Architecture.md`.

**Why it matters:**
- Consistency across codebase
- Easier for developers to understand
- Clear patterns for AI assistants
- Maintainable and extensible

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-2.1 | Each slice has State Interface (what data we store) | P0 |
| PR-2.2 | Each slice has Actions Interface (what we can do) | P0 |
| PR-2.3 | Each slice has Initial State (starting values) | P0 |
| PR-2.4 | Each slice has Slice Creator (implementation) | P0 |
| PR-2.5 | Store composition follows workflow editor pattern | P0 |
| PR-2.6 | Types exported from `types.ts` (shared types) | P0 |

### 2.3 Data Flow Consistency

**Definition:** All state updates go through store actions, not direct service calls from components.

**Why it matters:**
- Predictable data flow (UI → Store Action → Service → State Update → UI)
- Easier debugging
- Consistent with Workflow Editor pattern
- Clear separation of concerns

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-3.1 | Components call store actions, not services directly | P0 |
| PR-3.2 | Store actions call services for business logic | P0 |
| PR-3.3 | State updates happen through `set()` in actions | P0 |
| PR-3.4 | No direct `useState` for shared state (only local UI state) | P0 |

### 2.4 Backward Compatibility

**Definition:** Existing Agent Modal functionality must work identically after refactor.

**Why it matters:**
- No user-facing changes
- No breaking changes for consumers
- Smooth migration path

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-4.1 | All existing Agent Modal tabs work as before | P0 |
| PR-4.2 | Capabilities tab functionality unchanged | P0 |
| PR-4.3 | Tool assignment/saving works identically | P0 |
| PR-4.4 | Connection tool management unchanged | P0 |
| PR-4.5 | Workflow assignment unchanged | P0 |
| PR-4.6 | No visual or behavioral changes | P0 |

---

## 3. Acceptance Criteria

### State Management ([6] criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-1 | `useAgentModalStore` exists and exports unified store | Check `store/index.ts` exports `useAgentModalStore` |
| AC-2 | Store composed of at least 3 slices (agentDetails, capabilities, ui) | Inspect `store/index.ts` composition |
| AC-3 | Each slice follows 4-part structure (State, Actions, Initial State, Creator) | Review each slice file structure |
| AC-4 | No remaining `useAgentDetails`, `useConnectionTools`, `useCustomTools`, `useWorkflowAssignment` imports | `grep -r "useAgentDetails\|useConnectionTools\|useCustomTools\|useWorkflowAssignment"` returns no results |
| AC-5 | Components use `useAgentModalStore()` instead of hooks | Check component imports and usage |
| AC-6 | Store types exported from `store/types.ts` | Verify `types.ts` exports all slice types |

### Slice Implementation ([8] criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-7 | `agentDetailsSlice` manages agent config, tools, bindings, workflows | Test loading agent and verify state |
| AC-8 | `capabilitiesSlice` manages custom tools, connection tools, workflows | Test assigning/unassigning capabilities |
| AC-9 | `uiSlice` manages activeTab, editor views, selections | Test tab switching and editor state |
| AC-10 | All slices have proper TypeScript types | `npx tsc --noEmit` passes |
| AC-11 | Initial state defined for each slice | Check each slice has `initialState` |
| AC-12 | Actions use `set()` for state updates | Review action implementations |
| AC-13 | Actions call services (not components) | Verify no service calls in components |
| AC-14 | Console logging follows `[SliceName]` pattern | Check console.log prefixes |

### Data Flow ([4] criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-15 | Components call store actions (e.g., `store.fetchAgentDetails()`) | Inspect component code |
| AC-16 | Store actions call services (e.g., `agentConfigService.getAgentById()`) | Inspect action implementations |
| AC-17 | State updates trigger UI re-renders | Test assigning tool and verify UI updates |
| AC-18 | No direct service imports in components | `grep -r "from.*services"` in components returns no results |

### Backwards Compatibility ([6] criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-19 | Overview tab displays agent info correctly | Manual test: open agent modal, view overview |
| AC-20 | Capabilities tab shows all tools/workflows | Manual test: view capabilities, verify lists |
| AC-21 | Assigning custom tools works | Manual test: assign tool, save, verify persistence |
| AC-22 | Assigning connection tools works | Manual test: assign connection tool, save, verify |
| AC-23 | Assigning workflows works | Manual test: assign workflow, save, verify |
| AC-24 | All tabs render without errors | Manual test: navigate through all tabs |

---

## 4. User Flows

### Flow 1: View Agent Capabilities (Happy Path)

```
1. User opens Agent Modal for agent "PM"
2. System loads agent config via store action
3. Store fetches agent details (tools, bindings, workflows)
4. User navigates to Capabilities tab
5. System displays:
   - Custom tools (assigned and available)
   - Connection tools (assigned and available)
   - Workflows (assigned and available)
6. All data loaded from unified store state
```

### Flow 2: Assign Custom Tool

```
1. User in Capabilities tab clicks "Assign Tool"
2. System opens tool selector (from store state)
3. User selects tool and clicks "Save"
4. Component calls `store.saveCustomTools(toolIds)`
5. Store action calls service API
6. Store updates state with new assignments
7. UI re-renders showing updated tool list
8. User sees success feedback
```

### Flow 3: Assign Connection Tool

```
1. User in Capabilities tab views connection tools
2. User clicks "Connect" on a tool
3. Component calls `store.assignConnectionTool(binding)`
4. Store action calls service API
5. Store updates `capabilitiesSlice` state
6. UI re-renders showing new connection tool
7. User sees tool is now assigned
```

### Flow 4: Error Handling

```
1. User attempts to assign tool
2. API call fails (network error, validation error)
3. Store action catches error
4. Store updates error state in slice
5. Component displays error message from store
6. User can retry or cancel
```

---

## 5. Design Decisions

### 5.1 Decisions to Make

| ID | Question | Options | Current Lean | Decided? |
|----|----------|---------|--------------|----------|
| DD-1 | How many slices? | A: 3 slices (agentDetails, capabilities, ui) | A | ✅ |
| | | B: 4 slices (agentDetails, customTools, connectionTools, workflows) | | |
| | | C: 2 slices (agent, ui) | | |
| DD-2 | Should capabilities be one slice or separate? | A: One `capabilitiesSlice` with subsections | A | ✅ |
| | | B: Separate slices (customTools, connectionTools, workflows) | | |
| DD-3 | Where should loading/error state live? | A: In each slice that needs it | A | ✅ |
| | | B: In a shared `statusSlice` | | |
| DD-4 | Should we use persistence? | A: No persistence (modal is ephemeral) | A | ✅ |
| | | B: Persist tab selection, editor state | | |
| DD-5 | How to handle editor views (connection-editor, workflow-editor)? | A: In `uiSlice` as view state | A | ✅ |
| | | B: Separate `editorSlice` | | |
| DD-6 | Should we cache agent in store? | A: Cache agent in store | A | ✅ |
| | | B: Keep agent as prop only | | |
| DD-7 | Where should mock data live? | A: Store in state | A | ✅ |
| | | B: Return from actions | | |
| DD-8 | Service layer approach? | A: Start with direct `fetch()`, extract later | A | ✅ |
| | | B: Create service wrappers now | | |
| DD-9 | Error handling format? | A: Store error messages | A | ✅ |
| | | B: Just boolean success/failure | | |
| DD-10 | Data refresh after saves? | A: Auto-refresh (no page reload) | A | ✅ |
| | | B: Manual refresh or page reload | | |

### 5.2 Decision Log

| Date | Decision | Choice | Rationale |
|------|----------|--------|------------|
| 2025-12 | DD-1: Slice Granularity | 3 slices (agentDetails, capabilities, ui) | Clear separation of concerns, matches mental model |
| 2025-12 | DD-2: Capabilities Structure | One `capabilitiesSlice` with subsections | All capabilities are "tools" to Mastra agent, unified management |
| 2025-12 | DD-3: Loading States | In each slice that needs it | Better UX, can show partial loading states |
| 2025-12 | DD-4: Persistence | No persistence (modal is ephemeral) | Modal state resets when closed, agent config persists in files |
| 2025-12 | DD-5: Editor UI State | In `uiSlice` as view state | Editor views are UI concerns, not business logic |
| 2025-12 | DD-6: Agent Caching | Cache in store | Agent prop changes trigger data fetches, caching prevents re-fetches |
| 2025-12 | DD-7: Mock Data | Store in state | Used by multiple tabs, easier access |
| 2025-12 | DD-8: Service Layer | Start with direct `fetch()`, extract later | Keep it simple, refactor to services if pattern emerges |
| 2025-12 | DD-9: Error Handling | Store error messages | Better debugging and user feedback |
| 2025-12 | DD-10: Data Refresh | Auto-refresh after saves (no page reload) | Better UX, state stays in sync |

---

## 6. UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| None | This is a refactor, not a redesign | N/A |

**Note:** This task is a backend/state management refactor. No UI changes are expected. Existing mockups in `_docs/UXD/Pages/workforce/` remain valid.

### Exit Criteria for UXD Phase

- [x] No new mockups required (refactor only)
- [x] Existing UI remains unchanged

---

## 7. Success Criteria

| Criterion | How to Validate | Priority |
|-----------|-----------------|----------|
| Agent Modal uses unified Zustand store | Code review: verify `useAgentModalStore` usage | P0 |
| All hooks replaced with store slices | Code review: verify no hook imports | P0 |
| Store follows slice architecture pattern | Code review: verify 4-part structure | P0 |
| All existing functionality works | Manual testing: test all tabs and actions | P0 |
| TypeScript compilation passes | `npx tsc --noEmit` | P0 |
| No console errors in browser | Manual testing: open modal, use all features | P0 |
| Code is maintainable and extensible | Code review: clear patterns, good structure | P1 |

**North Star:** Agent Modal state management is as clear, maintainable, and consistent as the Workflow Editor, following our established architectural patterns.

---

## 8. Out of Scope

- UI/UX changes (this is a refactor, not a redesign)
- New features (only state management refactor)
- Performance optimizations (can be separate task)
- Testing infrastructure (can be separate task)
- Documentation updates beyond code comments (can be separate task)

---

## 9. Related Documents

- **Store-Slice Architecture:** `_docs/Engineering/Architecture/Store-Slice-Architecture.md`
- **Workflow Editor Store:** `app/(pages)/tools/editor/store/` (exemplar implementation)
- **Current Hooks:** `app/(pages)/workforce/components/agent-modal/hooks/` (to be replaced)
- **Agent Modal Component:** `app/(pages)/workforce/components/agent-modal/AgentModal.tsx`
- **Architecture Audit:** `_docs/Architecture/ARCHITECTURE_AUDIT_2025-12-06.md` (identified this opportunity)

---

## 10. Current State Analysis

### Existing Hooks

| Hook | Location | Manages | Lines |
|------|----------|---------|-------|
| `useAgentDetails` | `hooks/useAgentDetails.ts` | Agent config, tools, bindings, workflows | 89 |
| `useConnectionTools` | `hooks/useConnectionTools.ts` | Connection tools, platform toolkits | 133 |
| `useCustomTools` | `hooks/useCustomTools.ts` | Custom tools assignment | 79 |
| `useWorkflowAssignment` | `hooks/useWorkflowAssignment.ts` | Workflow bindings | 95 |

### Common Patterns (Duplication)

All hooks share:
- `useState` for loading/error states
- `useCallback` for fetch/save functions
- Similar error handling
- Similar API call patterns

### Workflow Editor Pattern (Exemplar)

```
store/
├── index.ts              # Composition
├── types.ts              # Shared types
└── slices/
    ├── canvasSlice.ts    # 4-part structure
    ├── editorSlice.ts
    └── ...8 slices total
```

### Proposed Structure

```
app/(pages)/workforce/components/agent-modal/
├── store/
│   ├── index.ts          # useAgentModalStore composition
│   ├── types.ts          # Shared types
│   └── slices/
│       ├── agentDetailsSlice.ts
│       ├── capabilitiesSlice.ts
│       └── uiSlice.ts
└── hooks/                # DELETE (replaced by store)
```

---

## 11. Refined State Variables (From Research)

### `agentDetailsSlice` State Variables

**Purpose:** Core agent identity and assigned capabilities

| Variable | Type | Description |
|----------|------|-------------|
| `agent` | `AgentConfig \| null` | Current agent config (cached from prop) |
| `allCustomTools` | `WorkflowSummary[]` | All available custom tools (for filtering) |
| `assignedCustomTools` | `WorkflowSummary[]` | Computed: filtered by `agent.toolIds` |
| `connectionBindings` | `ConnectionToolBinding[]` | From `agent.connectionToolBindings` |
| `workflowBindings` | `WorkflowBinding[]` | From `agent.workflowBindings` |
| `workflowMetadata` | `WorkflowMetadata[]` | Metadata for assigned workflows |
| `tasks` | `typeof MOCK_TASKS` | Static mock data (used by multiple tabs) |
| `jobs` | `typeof MOCK_JOBS` | Static mock data |
| `triggers` | `typeof MOCK_TRIGGERS` | Static mock data |
| `records` | `typeof MOCK_RECORDS` | Static mock data |
| `isLoadingDetails` | `boolean` | Loading state |
| `error` | `string \| null` | Error state |

### `capabilitiesSlice` State Variables

**Purpose:** Available capabilities and assignment management

| Category | Variable | Type | Description |
|----------|----------|------|-------------|
| **Custom Tools** | `availableCustomTools` | `WorkflowSummary[]` | All available custom tools |
| | `assignedCustomToolIds` | `string[]` | IDs of assigned tools |
| | `isLoadingCustomTools` | `boolean` | Loading state |
| | `errorCustomTools` | `string \| null` | Error state |
| **Connection Tools** | `availableConnections` | `ConnectionWithTools[]` | All available connections with tools |
| | `platformToolkits` | `PlatformToolkit[]` | NO_AUTH platform toolkits |
| | `assignedConnectionBindings` | `ConnectionToolBinding[]` | Currently assigned bindings |
| | `isLoadingConnectionTools` | `boolean` | Loading state |
| | `errorConnectionTools` | `string \| null` | Error state |
| **Workflows** | `availableWorkflows` | `WorkflowMetadata[]` | All available workflows |
| | `userConnections` | `Connection[]` | User's connections (for binding UI) |
| | `assignedWorkflowBindings` | `WorkflowBinding[]` | Currently assigned bindings |
| | `isLoadingWorkflows` | `boolean` | Loading state |
| | `errorWorkflows` | `string \| null` | Error state |

### `uiSlice` State Variables

**Purpose:** Modal UI state and editor views

| Category | Variable | Type | Description |
|----------|----------|------|-------------|
| **Modal** | `activeTab` | `TabId` | Current tab |
| | `view` | `ViewState` | Editor view ("list" \| "connection-editor" \| "workflow-editor") |
| | `isCustomEditorOpen` | `boolean` | Custom tool editor modal |
| **Connection Editor** | `selectedConnectionBindings` | `Set<string>` | Multi-select state |
| | `expandedToolkits` | `Set<string>` | Accordion state |
| | `connectionSearchQuery` | `string` | Search filter |
| **Workflow Editor** | `selectedWorkflowBindings` | `Map<string, WorkflowBinding>` | Selected workflows |
| | `expandedWorkflows` | `Set<string>` | Accordion state |
| | `workflowSearchQuery` | `string` | Search filter |
| **Saving States** | `isSavingCustomTools` | `boolean` | Saving state |
| | `isSavingConnectionTools` | `boolean` | Saving state |
| | `isSavingWorkflows` | `boolean` | Saving state |

---

## 12. Refined Actions (From Research)

### `agentDetailsSlice` Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `setAgent` | `(agent: AgentConfig \| null) => void` | Set current agent, auto-load details |
| `loadAgentDetails` | `(agentId: string) => Promise<void>` | Fetch all agent data (tools, bindings, workflows) |
| `getAssignedCustomTools` | `() => WorkflowSummary[]` | Computed getter (filters allCustomTools by agent.toolIds) |
| `resetAgentDetails` | `() => void` | Clear state when agent is null |

### `capabilitiesSlice` Actions

| Category | Action | Signature | Description |
|----------|--------|-----------|-------------|
| **Custom Tools** | `fetchCustomTools` | `(agentId: string) => Promise<void>` | Fetch available + assigned |
| | `saveCustomTools` | `(agentId: string, toolIds: string[]) => Promise<boolean>` | Save assignments, auto-refresh |
| **Connection Tools** | `fetchConnectionTools` | `(agentId: string) => Promise<void>` | Fetch available + assigned |
| | `saveConnectionTools` | `(agentId: string, bindings: ConnectionToolBinding[]) => Promise<boolean>` | Save bindings, auto-refresh |
| | `isConnectionToolAssigned` | `(connectionId: string, toolId: string) => boolean` | Computed helper |
| **Workflows** | `fetchWorkflows` | `(agentId: string) => Promise<void>` | Fetch available + assigned |
| | `fetchUserConnections` | `() => Promise<void>` | Fetch user connections (for binding UI) |
| | `saveWorkflows` | `(agentId: string, bindings: WorkflowBinding[]) => Promise<boolean>` | Save bindings with validation, auto-refresh |
| | `groupConnectionsByToolkit` | `() => Map<string, Connection[]>` | Computed helper |
| **Bulk** | `refreshAllCapabilities` | `(agentId: string) => Promise<void>` | Refresh all capability data |

### `uiSlice` Actions

| Action | Signature | Description |
|--------|-----------|-------------|
| `setActiveTab` | `(tab: TabId) => void` | Switch tabs |
| `setView` | `(view: ViewState) => void` | Switch editor view |
| `openCustomEditor` | `() => void` | Open custom tool editor modal |
| `closeCustomEditor` | `() => void` | Close custom tool editor modal |
| `toggleConnectionBinding` | `(key: string) => void` | Multi-select toggle |
| `toggleToolkit` | `(slug: string) => void` | Accordion toggle |
| `setConnectionSearchQuery` | `(query: string) => void` | Search filter |
| `toggleWorkflow` | `(workflowId: string) => void` | Workflow selection |
| `setWorkflowConnection` | `(workflowId: string, toolkitSlug: string, connectionId: string) => void` | Connection binding |
| `setWorkflowSearchQuery` | `(query: string) => void` | Search filter |
| `resetEditorState` | `() => void` | Reset all editor UI |

---

## Notes

[Space for ongoing discussion, questions, or clarifications during planning]

**Key Questions:**
1. Should we keep any hooks for truly local UI state (e.g., dropdown open/closed)?
2. How should we handle the transition? Gradual migration or all-at-once?
3. Should we add tests as part of this refactor, or defer to separate task?

