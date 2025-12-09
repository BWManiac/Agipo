# Task 18.1: Agent Modal Store Refactor — Research Log

**Status:** ✅ Complete  
**Date:** December 2025  
**Parent Task:** [00-Product-Spec.md](./00-Product-Spec.md)

---

## How to Use This Document

This is a **research log** for discovering facts about internal state management patterns and external dependencies (APIs, Mastra framework). 

**Each research question has:**
1. **The Question** — What we need to find out
2. **Why It Matters** — Which product requirement this unlocks (PR-X.X)
3. **Answer** — What we discovered
4. **Primitive** — The exact function/method we'll use
5. **Source** — Where we found the answer

**Philosophy:** External APIs are immutable. We can't change their shape—we discover what they provide and adapt our implementation.

**Status Key:** ❓ Not Researched | 🔍 In Progress | ✅ Answered | ⚠️ Blocked

---

## Quick Reference

| Question | Unlocks Requirement | Status |
|----------|---------------------|--------|
| [RQ-1: Current hook state management](#rq-1-what-state-do-the-current-hooks-manage) | PR-1.2, PR-1.3, PR-1.4, PR-1.5 | ✅ |
| [RQ-2: UI state in components](#rq-2-what-ui-state-is-managed-in-components) | PR-1.6 | ✅ |
| [RQ-3: External API dependencies](#rq-3-what-are-the-external-api-dependencies) | PR-3.2 | ✅ |
| [RQ-4: Error handling patterns](#rq-4-what-error-handling-patterns-exist) | PR-3.3 | ✅ |
| [RQ-5: Loading state patterns](#rq-5-what-loading-state-patterns-exist) | PR-2.3 | ✅ |
| [RQ-6: Mastra agent model](#rq-6-how-does-mastra-think-about-agents) | PR-1.1, PR-2.5 | ✅ |
| [RQ-7: Workflow tool integration](#rq-7-how-do-workflows-become-agent-tools) | PR-1.5 | ✅ |

---

## Part 1: Current State Management Research

### RQ-1: What state do the current hooks manage?

**Why It Matters:** PR-1.2, PR-1.3, PR-1.4, PR-1.5 — We need to map all existing state to store slices.

**Status:** ✅ Answered

**Question:** What state variables and actions do `useAgentDetails`, `useConnectionTools`, `useCustomTools`, and `useWorkflowAssignment` manage?

**Answer:**

#### `useAgentDetails` Hook
**State Variables:**
- `tools: WorkflowSummary[]` - Assigned custom tools (filtered from all tools)
- `connectionBindings: ConnectionToolBinding[]` - Assigned connection tool bindings
- `workflows: WorkflowBinding[]` - Assigned workflow bindings
- `isLoading: boolean` - Loading state for initial fetch
- `tasks: MOCK_TASKS` - Static mock data
- `jobs: MOCK_JOBS` - Static mock data
- `triggers: MOCK_TRIGGERS` - Static mock data
- `records: MOCK_RECORDS` - Static mock data

**Actions:**
- `fetchData()` - Fetches tools, bindings, workflows in parallel (implicit via useEffect)
- `normalizeToolId()` - Utility function (not state-related)

**API Calls:**
- `GET /api/tools/list` - All available custom tools
- `GET /api/workforce/${agentId}/tools/connection` - Assigned connection bindings
- `GET /api/workforce/${agentId}/workflows` - Assigned workflow bindings

**Primitive Discovered:**
- Hook: `useAgentDetails(agent: AgentConfig | null)`
- Returns: `{ tools, connectionBindings, workflows, tasks, jobs, triggers, records, isLoading }`
- Auto-fetches when `agent` prop changes

**Implementation Note:** This hook fetches data automatically when `agent` prop changes. Filters `agent.toolIds` against all tools to get assigned tools. Returns mock data for tasks/jobs/triggers/records (not from API).

**Source:** `app/(pages)/workforce/components/agent-modal/hooks/useAgentDetails.ts`

---

#### `useConnectionTools` Hook
**State Variables:**
- `availableConnections: ConnectionWithTools[]` - All available connections with their tools
- `platformToolkits: PlatformToolkit[]` - NO_AUTH platform toolkits (browser, etc.)
- `assignedBindings: ConnectionToolBinding[]` - Currently assigned bindings
- `isLoading: boolean` - Loading state
- `error: string | null` - Error message

**Actions:**
- `fetchData()` - Fetches available connections and assigned bindings
- `saveBindings(bindings: ConnectionToolBinding[]): Promise<boolean>` - Saves new bindings
- `isToolAssigned(connectionId: string, toolId: string): boolean` - Helper to check assignment

**API Calls:**
- `GET /api/workforce/${agentId}/tools/connection/available` - Available connections + platform toolkits
- `GET /api/workforce/${agentId}/tools/connection` - Assigned bindings
- `POST /api/workforce/${agentId}/tools/connection` - Save bindings

**Primitive Discovered:**
- Hook: `useConnectionTools(agentId: string)`
- Returns: `{ availableConnections, platformToolkits, assignedBindings, isLoading, error, fetchData, saveBindings, isToolAssigned }`
- Manual fetch pattern (doesn't auto-fetch)

**Implementation Note:** Handles 401 (unauthorized) gracefully (not an error). `isToolAssigned` is a computed value (derived from state).

**Source:** `app/(pages)/workforce/components/agent-modal/hooks/useConnectionTools.ts`

---

#### `useCustomTools` Hook
**State Variables:**
- `availableTools: WorkflowSummary[]` - All available custom tools
- `assignedToolIds: string[]` - IDs of assigned tools
- `isLoading: boolean` - Loading state
- `error: string | null` - Error message

**Actions:**
- `fetchData()` - Fetches available tools and assigned tool IDs
- `saveTools(toolIds: string[]): Promise<boolean>` - Saves new tool assignments

**API Calls:**
- `GET /api/workforce/${agentId}/tools/custom/available` - All available tools
- `GET /api/workforce/${agentId}/tools/custom` - Assigned tool IDs
- `POST /api/workforce/${agentId}/tools/custom` - Save tool IDs

**Primitive Discovered:**
- Hook: `useCustomTools(agentId: string)`
- Returns: `{ availableTools, assignedToolIds, isLoading, error, fetchData, saveTools }`
- Simple fetch/save pattern

**Implementation Note:** Returns boolean for success/failure. Manual fetch pattern.

**Source:** `app/(pages)/workforce/components/agent-modal/hooks/useCustomTools.ts`

---

#### `useWorkflowAssignment` Hook
**State Variables:**
- `availableWorkflows: WorkflowMetadata[]` - All available workflows
- `userConnections: Connection[]` - User's connections (for binding selection)
- `currentBindings: WorkflowBinding[]` - Currently assigned workflow bindings
- `isLoading: boolean` - Loading state
- `error: string | null` - Error message

**Actions:**
- `fetchData()` - Fetches workflows, bindings, and user connections
- `groupConnectionsByToolkit(): Map<string, Connection[]>` - Helper to group connections

**API Calls:**
- `GET /api/workforce/${agentId}/workflows/available` - Available workflows
- `GET /api/workforce/${agentId}/workflows` - Current bindings
- `GET /api/connections/list` - User connections

**Primitive Discovered:**
- Hook: `useWorkflowAssignment(agentId: string)`
- Returns: `{ availableWorkflows, userConnections, currentBindings, isLoading, error, fetchData, groupConnectionsByToolkit }`
- Manual fetch pattern

**Implementation Note:** `groupConnectionsByToolkit` is a computed value (derived from state). Handles 401 gracefully.

**Source:** `app/(pages)/workforce/components/agent-modal/hooks/useWorkflowAssignment.ts`

---

### RQ-2: What UI state is managed in components?

**Why It Matters:** PR-1.6 — We need to identify UI state that should go in `uiSlice`.

**Status:** ✅ Answered

**Question:** What UI state (tabs, editors, selections) is currently managed in components?

**Answer:**

#### `AgentModal` Component
**UI State:**
- `activeTab: TabId` - Currently active tab ("overview" | "chat" | "tasks" | etc.)
- `agent: AgentConfig | null` - Agent prop (passed from parent, not state)

**Primitive Discovered:**
- Component: `AgentModal({ agent, open, onOpenChange })`
- Local state: `useState<TabId>("overview")`

**Implementation Note:** `activeTab` is local state but could be in store for persistence. `agent` is a prop, not state (but we might want to cache it).

**Source:** `app/(pages)/workforce/components/agent-modal/AgentModal.tsx`

---

#### `CapabilitiesTab` Component
**UI State:**
- `isCustomEditorOpen: boolean` - Custom tool editor modal open/closed
- `view: ViewState` - Current view ("list" | "connection-editor" | "workflow-editor")
- `workflowBindings: WorkflowBinding[]` - Local state (duplicates `useAgentDetails`)
- `workflowMetadata: WorkflowMetadata[]` - Local state (fetched separately)

**Actions:**
- `handleSaveCustomTools(toolIds: string[])` - Saves and reloads page
- `handleSaveConnectionTools(bindings: ConnectionToolBinding[])` - Saves and reloads page
- `handleSaveWorkflows(bindings: WorkflowBinding[])` - Saves and reloads page

**Primitive Discovered:**
- Component: `CapabilitiesTab({ agent })`
- Local state: Multiple `useState` hooks
- Problem: `workflowBindings` and `workflowMetadata` duplicate state from hooks
- Problem: All save handlers call `window.location.reload()` (bad pattern)

**Implementation Note:** `view` state controls which editor panel is shown. Duplicate state should be removed, use store instead.

**Source:** `app/(pages)/workforce/components/agent-modal/components/tabs/CapabilitiesTab.tsx`

---

#### `ConnectionToolEditorPanel` Component
**UI State:**
- `selectedBindings: Set<string>` - Selected tool bindings (for multi-select)
- `expandedToolkits: Set<string>` - Which toolkits are expanded
- `searchQuery: string` - Search filter
- `isSaving: boolean` - Saving state

**Primitive Discovered:**
- Component: `ConnectionToolEditorPanel({ agent, onBack, onSave })`
- Local state: Multiple `useState` hooks
- `selectedBindings` uses `bindingKey(connectionId, toolId)` format

**Implementation Note:** `expandedToolkits` is UI-only state (could stay local or go in uiSlice).

**Source:** `app/(pages)/workforce/components/ConnectionToolEditorPanel.tsx`

---

#### `WorkflowEditorPanel` Component
**UI State:**
- `selectedBindings: Map<string, WorkflowBinding>` - Selected workflows with connection bindings
- `expandedWorkflows: Set<string>` - Which workflows are expanded
- `searchQuery: string` - Search filter
- `isSaving: boolean` - Saving state

**Primitive Discovered:**
- Component: `WorkflowEditorPanel({ agent, onBack, onSave })`
- Local state: Multiple `useState` hooks
- `selectedBindings` is a Map keyed by workflowId

**Implementation Note:** `expandedWorkflows` is UI-only state.

**Source:** `app/(pages)/workforce/components/WorkflowEditorPanel.tsx`

---

### RQ-3: What are the external API dependencies?

**Why It Matters:** PR-3.2 — Store actions will call these APIs, so we need to understand their contracts.

**Status:** ✅ Answered

**Question:** What API endpoints do the hooks call, and what are their request/response formats?

**Answer:**

#### Custom Tools APIs
| Endpoint | Method | Request | Response | Notes |
|----------|--------|---------|----------|-------|
| `/api/tools/list` | GET | None | `WorkflowSummary[]` | All available tools |
| `/api/workforce/[agentId]/tools/custom` | GET | None | `{ toolIds: string[] }` | Assigned tool IDs |
| `/api/workforce/[agentId]/tools/custom` | POST | `{ toolIds: string[] }` | `{ success: true, toolIds }` | Updates assignments |
| `/api/workforce/[agentId]/tools/custom/available` | GET | None | `{ tools: WorkflowSummary[] }` | All available tools |

**Primitive Discovered:**
- GET endpoints return JSON directly
- POST endpoints accept JSON body, return success response
- No authentication required (agent-scoped)

**Implementation Note:** `/api/tools/list` and `/available` return same data (redundant?). POST updates agent config file directly (no validation).

**Source:** `app/api/workforce/[agentId]/tools/custom/route.ts`, `app/api/workforce/[agentId]/tools/custom/available/route.ts`

---

#### Connection Tools APIs
| Endpoint | Method | Request | Response | Notes |
|----------|--------|---------|----------|-------|
| `/api/workforce/[agentId]/tools/connection` | GET | None | `{ bindings: ConnectionToolBinding[] }` | Assigned bindings |
| `/api/workforce/[agentId]/tools/connection` | POST | `{ bindings: ConnectionToolBinding[] }` | `{ success: true, bindings }` | Updates bindings |
| `/api/workforce/[agentId]/tools/connection/available` | GET | None | `{ connections: ConnectionWithTools[], platformToolkits: PlatformToolkit[] }` | Available tools |

**Primitive Discovered:**
- GET endpoints return JSON with nested structure
- POST endpoints accept array of bindings
- Requires authentication (returns 401 if not authenticated)

**Implementation Note:** Platform toolkits are NO_AUTH tools (browser, etc.). 401 is expected if not authenticated (not an error).

**Source:** `app/api/workforce/[agentId]/tools/connection/route.ts`, `app/api/workforce/[agentId]/tools/connection/available/route.ts`

---

#### Workflow APIs
| Endpoint | Method | Request | Response | Notes |
|----------|--------|---------|----------|-------|
| `/api/workforce/[agentId]/workflows` | GET | None | `{ bindings: WorkflowBinding[] }` | Assigned bindings |
| `/api/workforce/[agentId]/workflows` | POST | `{ bindings: WorkflowBinding[] }` | `{ success: true }` | Updates bindings (validates) |
| `/api/workforce/[agentId]/workflows/available` | GET | None | `{ workflows: WorkflowMetadata[] }` | Available workflows |

**Primitive Discovered:**
- GET endpoints return JSON with nested structure
- POST validates bindings before saving
- Returns error with `details` array if validation fails

**Implementation Note:** POST validates bindings (checks connection requirements). Returns error with `details` array if validation fails.

**Source:** `app/api/workforce/[agentId]/workflows/route.ts`, `app/api/workforce/[agentId]/workflows/available/route.ts`

---

#### Connections API
| Endpoint | Method | Request | Response | Notes |
|----------|--------|---------|----------|-------|
| `/api/connections/list` | GET | None | `Connection[]` | User's connections |

**Primitive Discovered:**
- Returns array of connection objects
- Used by workflow editor to show available connections for binding

**Implementation Note:** Used by workflow editor to show available connections for binding.

**Source:** `app/api/connections/list/route.ts`

---

### RQ-4: What error handling patterns exist?

**Why It Matters:** PR-3.3 — We need consistent error handling in store actions.

**Status:** ✅ Answered

**Question:** How do current hooks handle errors, and what patterns should we follow?

**Answer:**

**Current Patterns:**
1. **401 Handling** - Treated as "not authenticated" not an error (returns empty arrays)
2. **Error State** - Each hook has `error: string | null`
3. **Console Logging** - All hooks log errors with `[HookName]` prefix
4. **Try/Catch** - All async operations wrapped in try/catch
5. **Boolean Returns** - Save functions return `boolean` for success/failure

**Primitive Discovered:**
- Error handling: `try/catch` blocks with `setError()` state updates
- Console logging: `console.error("[HookName] Error:", err)`
- 401 handling: Check `response.status === 401`, return empty arrays

**Implementation Note:** Issues: `CapabilitiesTab` save handlers throw errors (not caught). `window.location.reload()` used after saves (should update state instead). No retry logic. No optimistic updates.

**Source:** All hook files in `app/(pages)/workforce/components/agent-modal/hooks/`

---

### RQ-5: What loading state patterns exist?

**Why It Matters:** PR-2.3 — We need to track loading states in slices.

**Status:** ✅ Answered

**Question:** How do current hooks manage loading states?

**Answer:**

**Current Patterns:**
1. **Single Loading Flag** - `isLoading: boolean` per hook
2. **Initial Load** - `useAgentDetails` sets loading on mount
3. **Manual Fetch** - Other hooks have `fetchData()` that sets loading
4. **No Granular Loading** - Can't tell if tools vs bindings vs workflows are loading

**Primitive Discovered:**
- Loading state: `useState<boolean>(false)` with `setIsLoading(true/false)`
- Pattern: Set loading before async, clear in finally block

**Implementation Note:** Issues: Can't show partial loading states. No distinction between initial load vs refresh. Components show generic "Loading..." message.

**Source:** All hook files in `app/(pages)/workforce/components/agent-modal/hooks/`

---

## Part 2: Mastra Framework Research

### RQ-6: How does Mastra think about agents?

**Why It Matters:** PR-1.1, PR-2.5 — We need to align our store design with Mastra's agent model.

**Status:** ✅ Answered

**Question:** What is Mastra's mental model for agents, and how do they relate to tools and workflows?

**Answer:**

**Mastra's Agent Model:**
- **Agents** = Reasoning/LLM tasks (dynamic, decision-making)
- **Workflows** = Structured multi-step tasks (deterministic execution)
- **Tools** = Capabilities agents can invoke (custom, connection, or workflow-wrapped)
- Agents receive tools as `Record<string, Tool>` map in constructor
- Workflows are wrapped as tools so agents can invoke them
- Agent runtime is ephemeral (created per chat request)

**Primitive Discovered:**
- Agent creation: `new Agent({ name, instructions, model, tools, memory })`
- Tools format: `Record<string, Tool<unknown, unknown>>` (Vercel AI SDK Tool type)
- Tool building: `buildToolMap(userId, agentConfig)` combines custom + connection + workflow tools

**Implementation Note:** Our Agent Modal manages **agent configuration** (not runtime instances). Configuration includes: identity, system prompt, model, capability assignments. Capabilities = Custom Tools + Connection Tools + Workflows (all become tools at runtime). Runtime agent creation happens in `chat-service.ts` via `buildToolMap()`.

**Source:** [Mastra Workflows Overview](https://mastra.ai/docs/workflows/overview), `app/api/workforce/[agentId]/chat/services/chat-service.ts`

---

### RQ-7: How do workflows become agent tools?

**Why It Matters:** PR-1.5 — We need to understand how workflow bindings translate to agent capabilities.

**Status:** ✅ Answered

**Question:** How are workflows wrapped as tools for agents to invoke?

**Answer:**

**Workflow Tool Wrapping:**
1. Workflow bindings stored in `agent.workflowBindings`
2. Each binding has `workflowId` and `connectionBindings` (toolkit → connectionId map)
3. `getWorkflowToolExecutable()` loads workflow executable and metadata
4. Wraps workflow execution in Vercel AI SDK `tool()` function
5. Creates `runtimeContext` with connection bindings
6. Workflow run created with `createRunAsync({ resourceId: userId })`
7. Workflow executed with `run.start({ inputData, runtimeContext })`
8. Result returned to agent as tool output

**Primitive Discovered:**
- Function: `getWorkflowToolExecutable(userId, binding)`
- Returns: `ToolDefinition` with wrapped workflow tool
- Workflow execution: `workflow.createRunAsync().start({ inputData, runtimeContext })`

**Implementation Note:** Workflows are treated as tools to Mastra agents. Connection bindings are passed via `runtimeContext` to workflow steps. Workflow validation happens before saving bindings.

**Source:** `app/api/tools/services/workflow-tools.ts`, `app/api/workforce/[agentId]/workflows/route.ts`

---

## Part 3: Integration Patterns

### RQ-8: How do hooks, components, and APIs work together?

**Why It Matters:** PR-3.1, PR-3.2 — We need to understand the data flow to design store actions.

**Status:** ✅ Answered

**Question:** What is the current data flow from components → hooks → APIs → state updates?

**Answer:**

**Current Data Flow:**
```
Component → Hook Action → API Call → useState Update → Component Re-render
```

**Example Flow (Assign Custom Tool):**
1. User clicks "Save" in `CapabilitiesTab`
2. Component calls `handleSaveCustomTools(toolIds)`
3. Component makes `fetch()` call to `/api/workforce/${agentId}/tools/custom`
4. Component calls `window.location.reload()` (bad pattern)
5. Page reloads, hooks re-fetch data

**Proposed Store Data Flow:**
```
Component → Store Action → API Call → set() Update → Component Re-render
```

**Example Flow (Assign Custom Tool - Proposed):**
1. User clicks "Save" in `CapabilitiesTab`
2. Component calls `store.saveCustomTools(agentId, toolIds)`
3. Store action makes `fetch()` call to API
4. Store action calls `set()` to update state
5. Component automatically re-renders with new state
6. Store action calls `refreshAllCapabilities()` to sync data

**Primitive Discovered:**
- Current pattern: Direct `fetch()` calls in components/hooks
- Proposed pattern: Store actions call `fetch()`, update state via `set()`

**Implementation Note:** No service layer currently - hooks call `fetch()` directly. Could extract to services later if pattern emerges. Store actions should follow same pattern initially.

**Source:** All component and hook files

---

## Summary

### Primitives We'll Use

| What | Primitive | From | Confirmed? |
|------|-----------|------|------------|
| Agent config loading | `getAgentById(agentId)` | `@/_tables/agents` | ✅ |
| Custom tools fetch | `GET /api/workforce/[agentId]/tools/custom` | API route | ✅ |
| Connection tools fetch | `GET /api/workforce/[agentId]/tools/connection` | API route | ✅ |
| Workflow bindings fetch | `GET /api/workforce/[agentId]/workflows` | API route | ✅ |
| Save custom tools | `POST /api/workforce/[agentId]/tools/custom` | API route | ✅ |
| Save connection tools | `POST /api/workforce/[agentId]/tools/connection` | API route | ✅ |
| Save workflows | `POST /api/workforce/[agentId]/workflows` | API route | ✅ |
| User connections | `GET /api/connections/list` | API route | ✅ |
| Store pattern | Zustand slice architecture | `_docs/Engineering/Architecture/Store-Slice-Architecture.md` | ✅ |

### Blockers & Dead Ends

| Issue | Impact | Resolution |
|-------|--------|------------|
| `window.location.reload()` after saves | Bad UX, loses state | Use `refreshAllCapabilities()` instead |
| Duplicate state in `CapabilitiesTab` | Data inconsistency | Remove local state, use store |
| No granular loading states | Poor UX feedback | Add per-capability loading flags |
| 401 handling inconsistency | Confusing error states | Document pattern: 401 = empty arrays, not error |

### Key Learnings

1. **Mastra Alignment:** Agents receive tools as unified map. Our store should manage capability assignments (custom tools, connection tools, workflows) which all become tools at runtime.

2. **State Duplication:** `CapabilitiesTab` has duplicate state that should be removed. Store will be single source of truth.

3. **Loading States:** Current single `isLoading` flag is insufficient. Need granular loading states per capability type.

4. **Error Handling:** Current pattern (error state + boolean returns) works but needs consistency. 401 should not be treated as error.

5. **Data Refresh:** `window.location.reload()` is anti-pattern. Store actions should refresh data after saves.

6. **UI State:** Editor UI state (expanded, search) can stay local or go in `uiSlice`. Decision: Keep truly local UI state in components, move shared state to store.

7. **Service Layer:** No service layer currently. Start with direct `fetch()` calls in store actions, extract to services later if pattern emerges.

---

## Exit Criteria

- [x] All RQ questions answered
- [x] Summary table complete
- [x] No unresolved blockers
- [x] Key learnings documented
- [x] Mastra framework patterns understood
- [x] Current state management patterns documented
- [x] API dependencies documented

**Next Step:** Update Product Spec with refined state variables and actions, then create Implementation Plan

---

## Resources Used

- [Mastra Workflows Overview](https://mastra.ai/docs/workflows/overview)
- `app/(pages)/workforce/components/agent-modal/hooks/` - Current hook implementations
- `app/(pages)/workforce/components/agent-modal/components/tabs/` - Component usage patterns
- `app/api/workforce/[agentId]/tools/` - API route implementations
- `app/api/workforce/[agentId]/workflows/` - Workflow API routes
- `app/api/workforce/[agentId]/chat/services/chat-service.ts` - Agent creation logic
- `app/api/tools/services/workflow-tools.ts` - Workflow tool wrapping
- `_docs/Engineering/Architecture/Store-Slice-Architecture.md` - Architecture pattern
- `_docs/Product/Features/03-Agents-Architecture.md` - Agent philosophy

