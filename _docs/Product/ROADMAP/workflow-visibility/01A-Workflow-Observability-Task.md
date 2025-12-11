# Task: Workflow Observability in Chat

**Status:** Not Started  
**Roadmap:** `_docs/Product/ROADMAP/workflow-visibility/01-Workflow-Observability.md`  
**Research Log:** `_docs/Product/ROADMAP/workflow-visibility/01B-Workflow-Observability-Research.md`  
**Assigned:** TBD  
**Started:** YYYY-MM-DD  
**Completed:** YYYY-MM-DD

---

## Validation

### Approach Validation

**✅ Technical Approach:**
- Mastra streaming API (`run.stream()`) confirmed available for real-time events
- SSE pattern established in existing chat streaming architecture
- Zustand state management pattern proven for complex UI state

**✅ Architecture Decisions:**
- Split view layout matches existing Records feature UI pattern
- Event-driven communication between backend streams and frontend state
- Separation of concerns: backend handles streaming, frontend handles visualization

**✅ Integration Points:**
- Existing workflow-tools service provides clear extension point
- ChatTab component already uses Zustand for state management
- SSE endpoint pattern follows existing API route structure

### Current State Analysis

**Existing Infrastructure:**
- Workflow execution currently uses `run.start()` in `app/api/tools/services/workflow-tools.ts`
- Chat interface in `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/`
- Zustand store structure established with thread and chat slices

**Missing Components:**
- No streaming infrastructure for workflow events
- No observability UI components exist
- No state management for workflow execution visibility

### Deterministic Decisions

**Storage:**
- Active workflow state: In-memory Zustand store (session-scoped)
- Stream connections: In-memory Map in stream service
- Workflow metadata: Existing Mastra Memory for persistence

**Architecture:**
- SSE for real-time events (proven pattern in codebase)
- React ResizablePanels for split view layout
- JSON viewer for step inputs/outputs (consider react-json-view)

---

## Overview

### Goal

Enable real-time visibility into workflow execution when agents invoke workflows during chat conversations. Users should see step-by-step progress, intermediate outputs, and error details in a resizable sidebar panel that automatically opens when workflows start.

This feature transforms workflows from "black box" executions into transparent, observable processes that users can monitor and debug in real-time.

### Relevant Research

**Current Workflow Execution Pattern:**
- Workflows are wrapped as tools in `app/api/tools/services/workflow-tools.ts`
- Execution uses `run.start()` which waits for completion before returning
- No streaming or real-time updates available to frontend
- Workflow results only visible after completion (or error)

**Mastra Streaming API:**
- `run.stream()` returns `{ result, fullStream }` where `fullStream` is an async iterable
- Events emitted: `step-start`, `step-complete`, `step-error`, `workflow-complete`
- Each event contains: `type`, `stepId`, `data` (step output), `status`
- Can iterate with `for await (const chunk of result.fullStream)`

**Chat Architecture:**
- ChatTab uses Zustand for state (`useChatMemory` hook)
- ChatArea component renders messages using AI Elements
- Thread-based conversation model (one thread = one conversation)
- Messages stored in Mastra Memory (persistent)

**Existing Patterns to Reuse:**
- Zustand slice pattern (see `chatSlice`, `threadSlice` in other features)
- SSE streaming pattern (used in chat streaming, could adapt)
- Resizable panels (consider `react-resizable-panels` used elsewhere)
- Split view layouts (Records feature has chat sidebar pattern)

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/types.ts` | Modify | Add `WorkflowRunState`, `WorkflowStepState` types | A, B |
| `_tables/types.ts` | Modify | Add workflow run tracking to message metadata | A |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/tools/services/workflow-tools.ts` | Modify | Refactor to use `run.stream()` instead of `run.start()` | A |
| `app/api/workforce/[agentId]/chat/workflows/[runId]/stream/route.ts` | Create | SSE endpoint for streaming workflow events | A |
| `app/api/workforce/[agentId]/chat/services/workflow-stream-service.ts` | Create | Service for managing workflow streams and SSE connections | A |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Modify | Track workflow runIds when workflows are invoked | A |
| `app/api/workflows/services/workflow-run-tracker.ts` | Create | Track active workflow runs per thread/user | A |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/store/slices/workflowObservabilitySlice.ts` | Create | Zustand slice for workflow observability state | B |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/store/index.ts` | Modify | Export workflow observability slice | B |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/WorkflowObservabilityPanel.tsx` | Create | Main observability panel component | B |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/WorkflowCard.tsx` | Create | Individual workflow card showing status and steps | B |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/WorkflowStep.tsx` | Create | Step component showing status, inputs, outputs | B |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/index.tsx` | Modify | Add split view layout with observability panel | B |

### Frontend / Hooks

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/hooks/useWorkflowStream.ts` | Create | Hook for connecting to SSE and updating store | B |

---

## Part A: Backend Streaming Infrastructure

### Goal

Refactor workflow execution to use Mastra's streaming API and create an SSE endpoint that emits real-time workflow events to the frontend.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/tools/services/workflow-tools.ts` | Modify | Change `run.start()` to `run.stream()`, emit events | ~100 |
| `app/api/workforce/[agentId]/chat/workflows/[runId]/stream/route.ts` | Create | SSE endpoint for workflow streaming | ~80 |
| `app/api/workforce/[agentId]/chat/services/workflow-stream-service.ts` | Create | Service managing active streams and event emission | ~150 |
| `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Modify | Track runId when workflow invoked, return runId to frontend | ~30 |
| `app/api/workflows/services/workflow-run-tracker.ts` | Create | Track active runs, store run metadata | ~100 |

### Pseudocode

#### `app/api/tools/services/workflow-tools.ts`

```
getWorkflowToolExecutable(userId, binding)
├── Load workflow executable
├── Wrap as Vercel AI SDK tool
│   └── execute(input)
│       ├── Filter Mastra-injected keys from input
│       ├── Create RuntimeContext (Map)
│       ├── Create workflow run: run = await workflow.createRunAsync({ resourceId: userId })
│       ├── Start streaming: result = await run.stream({ inputData, runtimeContext })
│       ├── Store runId in global tracker (for SSE access)
│       ├── Iterate stream events:
│       │   ├── Emit to SSE endpoint (if connection exists)
│       │   └── Accumulate final result
│       ├── Return final result to agent (same as before)
│       └── Clean up stream tracking when complete
└── Return tool definition
```

#### `app/api/workforce/[agentId]/chat/workflows/[runId]/stream/route.ts`

```
POST /api/workforce/[agentId]/chat/workflows/[runId]/stream
├── Authenticate user
├── Verify runId belongs to user/agent
├── Create SSE response stream
├── Register stream connection in WorkflowStreamService
├── Send initial connection event
├── Listen for workflow events from service
│   ├── On step-start: emit { type: 'step-start', stepId, timestamp }
│   ├── On step-complete: emit { type: 'step-complete', stepId, output, timestamp }
│   ├── On step-error: emit { type: 'step-error', stepId, error, timestamp }
│   └── On workflow-complete: emit { type: 'workflow-complete', result, timestamp }
├── Handle client disconnect (cleanup)
└── Return SSE stream
```

#### `app/api/workforce/[agentId]/chat/services/workflow-stream-service.ts`

```
WorkflowStreamService
├── activeStreams: Map<runId, SSEConnection[]>
├── registerStream(runId, connection)
│   └── Add connection to activeStreams[runId]
├── emitEvent(runId, event)
│   └── Send event to all connections for runId
├── unregisterStream(runId, connection)
│   └── Remove connection from activeStreams[runId]
└── getActiveRuns(userId, agentId)
    └── Return list of active runIds for user/agent
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Workflow execution uses `run.stream()` | Verify `workflow-tools.ts` calls `run.stream()` not `run.start()` |
| AC-A.2 | SSE endpoint accepts connections | Connect to `/api/workforce/[agentId]/chat/workflows/[runId]/stream` and receive connection event |
| AC-A.3 | Workflow events stream to SSE | Start workflow, verify events appear in SSE stream (step-start, step-complete, etc.) |
| AC-A.4 | Multiple clients can subscribe to same run | Open 2 browser tabs, both receive events for same workflow run |
| AC-A.5 | Stream cleanup on disconnect | Disconnect client, verify no memory leaks in stream service |
| AC-A.6 | Agent still receives final result | Verify agent gets workflow result (backward compatibility) |

---

## Part B: Frontend Observability UI

### Goal

Build the observability panel UI that displays active workflows, step-by-step progress, and allows users to expand/collapse step details. Integrate with chat interface using split view layout.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/store/slices/workflowObservabilitySlice.ts` | Create | Zustand slice for workflow state | ~200 |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/WorkflowObservabilityPanel.tsx` | Create | Main panel component with split view | ~150 |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/WorkflowCard.tsx` | Create | Individual workflow card | ~100 |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/WorkflowStep.tsx` | Create | Step component with expand/collapse | ~120 |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/hooks/useWorkflowStream.ts` | Create | Hook connecting to SSE and updating store | ~100 |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/index.tsx` | Modify | Add split view layout | ~50 |

### Pseudocode

#### `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/store/slices/workflowObservabilitySlice.ts`

```
workflowObservabilitySlice
├── State:
│   ├── activeWorkflows: Map<runId, WorkflowState>
│   ├── panelOpen: boolean
│   └── selectedRunId: string | null
├── Actions:
│   ├── addWorkflow(runId, workflowName, steps)
│   │   └── Add to activeWorkflows map
│   ├── updateWorkflowStep(runId, stepId, status, output)
│   │   └── Update step in workflow state
│   ├── setWorkflowStatus(runId, status, result)
│   │   └── Update workflow status and final result
│   ├── removeWorkflow(runId)
│   │   └── Remove from activeWorkflows
│   ├── togglePanel()
│   │   └── Toggle panelOpen
│   └── selectWorkflow(runId)
│       └── Set selectedRunId
└── Selectors:
    ├── getActiveWorkflows() → WorkflowState[]
    └── getWorkflow(runId) → WorkflowState | undefined
```

#### `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/hooks/useWorkflowStream.ts`

```
useWorkflowStream(runId, agentId)
├── useEffect:
│   ├── Create EventSource connection to SSE endpoint
│   ├── Listen for events:
│   │   ├── 'step-start' → dispatch updateWorkflowStep(runId, stepId, 'running')
│   │   ├── 'step-complete' → dispatch updateWorkflowStep(runId, stepId, 'success', output)
│   │   ├── 'step-error' → dispatch updateWorkflowStep(runId, stepId, 'failed', error)
│   │   └── 'workflow-complete' → dispatch setWorkflowStatus(runId, 'success', result)
│   ├── Handle connection errors (reconnect logic)
│   └── Cleanup on unmount (close EventSource)
└── Return { isConnected, error }
```

#### `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/WorkflowObservabilityPanel.tsx`

```
WorkflowObservabilityPanel
├── Get activeWorkflows from store
├── Render:
│   ├── Panel header ("Active Workflows" + close button)
│   ├── If no workflows: Empty state
│   ├── If workflows exist:
│   │   ├── For each workflow:
│   │   │   └── <WorkflowCard workflow={workflow} />
│   │   └── Scrollable list
│   └── Auto-scroll to latest workflow
└── Handle panel close (dispatch togglePanel)
```

#### `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/WorkflowCard.tsx`

```
WorkflowCard({ workflow })
├── Render:
│   ├── Card header:
│   │   ├── Workflow name
│   │   ├── Status badge (running/success/failed)
│   │   └── Collapse/expand button
│   ├── If expanded:
│   │   ├── Steps list:
│   │   │   └── For each step: <WorkflowStep step={step} />
│   │   └── Final result (if completed)
│   └── Progress indicator (X/Y steps completed)
└── Handle expand/collapse
```

#### `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/WorkflowStep.tsx`

```
WorkflowStep({ step })
├── Render:
│   ├── Step header:
│   │   ├── Step name/ID
│   │   ├── Status icon (pending/running/success/failed)
│   │   └── Expand button (if has output)
│   ├── If expanded:
│   │   ├── Input data (JSON viewer)
│   │   ├── Output data (JSON viewer)
│   │   └── Error details (if failed)
│   └── Timestamp (when completed)
└── Handle expand/collapse
```

#### `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/index.tsx`

```
ChatTab
├── Add ResizablePanelGroup (from react-resizable-panels)
├── Layout:
│   ├── ResizablePanel (defaultSize: 70%):
│   │   └── Existing chat area (ThreadSidebar + ChatArea)
│   └── ResizablePanel (defaultSize: 30%, minSize: 20%):
│       └── <WorkflowObservabilityPanel />
├── Panel visibility:
│   ├── Auto-open when workflow starts (useWorkflowStream detects new runId)
│   └── User can close (panel state in store)
└── Handle panel resize
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Panel opens when workflow starts | Invoke workflow, verify panel appears automatically |
| AC-B.2 | Workflow card shows correct status | Verify status badge updates: running → success/failed |
| AC-B.3 | Steps update in real-time | Verify step status changes as workflow executes (no refresh) |
| AC-B.4 | Step expansion shows inputs/outputs | Click step, verify JSON viewer shows data |
| AC-B.5 | Failed steps show error details | Trigger workflow failure, verify error message displayed |
| AC-B.6 | Multiple workflows visible | Invoke 2 workflows, verify both appear in panel |
| AC-B.7 | Panel can be closed/reopened | Close panel, verify chat expands; reopen, verify panel restores |
| AC-B.8 | Panel is resizable | Drag divider, verify panel width changes |
| AC-B.9 | Panel state persists | Refresh page while workflow running, verify panel shows current state |
| AC-B.10 | Empty state shown when no workflows | No active workflows, verify "No active workflows" message |

---

## User Flows

### Flow 1: Workflow Invocation and Observability

```
1. User sends message: "Apply for this job: https://linkedin.com/job/123"
2. Agent decides to use workflow, chat-service tracks runId
3. Frontend detects new runId in message metadata
4. useWorkflowStream hook connects to SSE endpoint
5. Observability panel auto-opens (if closed)
6. Workflow card appears with "Running" status
7. Steps list shows all steps as "Pending"
8. As workflow executes:
   - Step 1 updates to "Running" → "Success" (with output)
   - Step 2 updates to "Running" → "Success"
   - ... (real-time updates via SSE)
9. When complete, workflow card shows "Success" with final result
10. Agent responds with summary message
```

### Flow 2: Workflow Failure Debugging

```
1. Workflow fails at step 3
2. SSE emits 'step-error' event
3. Frontend updates step 3 to "Failed" status (red)
4. User expands step 3 to see:
   - Input data that was passed
   - Error message: "Form field 'phone' not found"
   - Stack trace (if available)
5. Previous steps (1, 2) show their outputs for context
6. User asks agent: "Why did it fail?"
7. Agent can reference observability data in response
```

---

## Out of Scope

- **Workflow pause/resume**: Cannot pause workflows from panel (future)
- **Historical workflow view**: Only active workflows shown (future: history tab)
- **Workflow editing**: Cannot modify workflow from panel
- **Step retry**: Cannot retry individual steps (must re-run workflow)
- **Workflow comparison**: Cannot compare multiple runs side-by-side
- **Export logs**: Cannot export execution logs (future)

---

## Open Questions

- [ ] How to handle workflows that outlive chat session? (store in DB vs session-only)
- [ ] Should panel auto-close when all workflows complete? (probably not, let user decide)
- [ ] What's the max number of concurrent workflows to show? (performance consideration)
- [ ] How to handle very long step outputs? (truncate? virtualize? paginate?)
- [ ] Should we show workflow execution time? (probably yes, useful metric)
- [ ] How to handle SSE reconnection failures? (show error? queue events?)
- [ ] Should panel remember user's expand/collapse preferences? (UX consideration)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| YYYY-MM-DD | Initial creation | TBD |
