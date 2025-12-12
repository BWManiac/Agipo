# File Impact Analysis: Direct Workflow Execution

## Overview

This document outlines all files that need to be created or modified to implement direct workflow execution from the editor.

**Domain:** Workflows
**Route Pattern:** `/workflows/[workflowId]/execute` (action on instance - per Domain Principles §4)

**Parts:**
- **Part A:** Backend (API + Services) — Execution endpoint with streaming
- **Part B:** Frontend (State + UI) — Execution modal and progress display

---

## Domain Principles Applied

| Principle | Application |
|-----------|-------------|
| **§4 HTTP Methods** | `POST /workflows/[id]/execute` — non-CRUD action, use path verb |
| **§5 Nested Resources** | Execute is an action on a workflow instance, nested under `[workflowId]` |
| **§9 Builder vs Runtime** | This is runtime execution, but uses same resource path (workflow) |
| **§10 Service Co-location** | Services co-located under `[workflowId]/services/` (single consumer) |

---

## Part A: Backend

### Types

| File | Action | Purpose |
|------|--------|---------|
| `app/api/workflows/[workflowId]/execute/types.ts` | **Create** | Define `ExecutionRequest`, `ExecutionStreamEvent`, `ExecutionStatus` types |

### API Routes

| File | Action | Purpose |
|------|--------|---------|
| `app/api/workflows/[workflowId]/execute/route.ts` | **Create** | `POST` endpoint: accepts inputData, resolves connections, executes workflow with SSE streaming |
| `app/api/workflows/[workflowId]/execute/README.md` | **Create** | Route documentation per `ROUTE_README_TEMPLATE.md` |

### Services (Co-located with Route)

| File | Action | Purpose |
|------|--------|---------|
| `app/api/workflows/[workflowId]/execute/services/execution-service.ts` | **Create** | Core execution: load workflow, build runtimeContext, call `streamVNext()`, format events |
| `app/api/workflows/[workflowId]/execute/services/execution-service.README.md` | **Create** | Service documentation per `SERVICE_README_TEMPLATE.md` |
| `app/api/workflows/[workflowId]/execute/services/connection-resolver.ts` | **Create** | Resolve required toolkit connections from workflow metadata + user's connected accounts |
| `app/api/workflows/[workflowId]/execute/services/connection-resolver.README.md` | **Create** | Service documentation per `SERVICE_README_TEMPLATE.md` |

### Existing Files (Reference Only - No Modifications)

| File | Purpose | Reuse Pattern |
|------|---------|---------------|
| `app/api/tools/services/workflow-tools.ts` | Existing execution wrapper | Reuse `createRunAsync()` + runtime context pattern |
| `app/api/workflows/services/workflow-loader.ts` | Load from registry | Use `getWorkflowExecutable()`, `getWorkflowMetadata()` |
| `app/api/connections/services/connections.ts` | List user connections | Use `listConnections(userId)` |

---

## Part B: Frontend

### State (Zustand)

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/workflows/editor/store/slices/executionSlice.ts` | **Create** | Execution state: `isModalOpen`, `isExecuting`, `inputValues`, `stepProgress[]`, `output`, `error` |
| `app/(pages)/workflows/editor/store/index.ts` | **Modify** | Add `executionSlice` to store composition |

### Hooks

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/workflows/editor/hooks/useExecution.ts` | **Create** | Wraps store actions, handles SSE stream subscription via `EventSource`, parses events |

### Components

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/workflows/editor/components/execution/ExecuteWorkflowDialog.tsx` | **Create** | Main dialog: orchestrates InputForm → Progress → Complete/Failed views |
| `app/(pages)/workflows/editor/components/execution/ExecutionInputForm.tsx` | **Create** | Schema-driven form from `workflowInputs`, connection status display |
| `app/(pages)/workflows/editor/components/execution/ExecutionProgress.tsx` | **Create** | Step list with live status (pending/running/complete/failed) |
| `app/(pages)/workflows/editor/components/execution/StepProgressItem.tsx` | **Create** | Individual step: icon, name, status, duration, expandable output |
| `app/(pages)/workflows/editor/components/execution/ExecutionResult.tsx` | **Create** | Final state: success banner + output JSON, or error details |
| `app/(pages)/workflows/editor/components/execution/index.ts` | **Create** | Barrel export for execution components |

### Header Modification

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/workflows/editor/components/EditorHeader.tsx` | **Modify** | Add "Run" button next to Save, wire to `executionSlice.openModal()` |

---

## API Route Structure (After Implementation)

```
app/api/workflows/
├── [workflowId]/
│   ├── route.ts                    # GET, PUT, DELETE (existing)
│   ├── execute/                    # NEW: Execute action
│   │   ├── route.ts                # POST with SSE streaming
│   │   ├── README.md               # Route documentation
│   │   ├── types.ts                # Execution types
│   │   └── services/
│   │       ├── execution-service.ts
│   │       ├── execution-service.README.md
│   │       ├── connection-resolver.ts
│   │       └── connection-resolver.README.md
│   └── services/                   # Existing services
│       ├── transpiler/
│       └── input-schema-generator.ts
└── services/                       # Domain-level shared services
    ├── workflow-loader.ts          # Used by execute
    └── storage/
```

---

## Implementation Order

### Phase A: Backend (Estimated: 4-6 files)
1. `execute/types.ts` — Define streaming event types
2. `execute/services/connection-resolver.ts` — Resolve user connections
3. `execute/services/execution-service.ts` — Core execution logic
4. `execute/route.ts` — POST endpoint with SSE
5. `execute/README.md` — Route documentation
6. Service READMEs

### Phase B: Frontend (Estimated: 8-10 files)
1. `executionSlice.ts` — State management
2. Update `store/index.ts`
3. `useExecution.ts` — SSE handling hook
4. `StepProgressItem.tsx` — Atomic component
5. `ExecutionInputForm.tsx` — Input collection
6. `ExecutionProgress.tsx` — Live progress
7. `ExecutionResult.tsx` — Final state
8. `ExecuteWorkflowDialog.tsx` — Orchestrator
9. Update `EditorHeader.tsx` — Add Run button

---

## File Count Summary

| Category | Create | Modify | Total |
|----------|--------|--------|-------|
| Types | 1 | 0 | 1 |
| API Routes | 1 | 0 | 1 |
| Route READMEs | 1 | 0 | 1 |
| Services | 2 | 0 | 2 |
| Service READMEs | 2 | 0 | 2 |
| State | 1 | 1 | 2 |
| Hooks | 1 | 0 | 1 |
| Components | 6 | 1 | 7 |
| **Total** | **15** | **2** | **17** |

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Streaming transport | SSE (Server-Sent Events) | Simpler than WebSocket, sufficient for unidirectional flow |
| Route placement | `/workflows/[id]/execute` | Action on instance (Domain Principles §4) |
| Service location | Co-located under `execute/services/` | Single consumer (Domain Principles §10) |
| Connection resolution | On-demand at execution | Don't require pre-binding; resolve from user's connections |
| State management | Zustand slice | Consistent with existing editor patterns |
| Execution API | `run.stream()` | Mastra API with `step-start`, `step-complete`, `step-error` events |

---

## Mastra Streaming API (Verified)

The Mastra workflow API supports real-time step-by-step progress:

```typescript
// Option A: Async iteration (recommended for SSE)
const run = await workflow.createRunAsync();
for await (const event of run.stream({ inputData, runtimeContext })) {
  // event.type: 'step-start' | 'step-complete' | 'step-error' | 'workflow-complete'
  // event.stepId: which step
  // event.data: step output or error
}

// Option B: Watch pattern (callback-based)
run.watch((event) => {
  if (event.type === 'step-complete') {
    console.log(`Step ${event.stepId} completed:`, event.data);
  }
});
await run.start({ inputData, runtimeContext });
```

**Event Types:**
- `step-start` — Step began executing
- `step-complete` — Step finished successfully (includes output)
- `step-error` — Step failed (includes error details)
- `workflow-complete` — All steps done

This validates our UXD mockups showing step-by-step progress.

---

## Connection Resolution (Important Notes)

**NO_AUTH Toolkits:**
Some toolkits don't require user authentication. Currently hardcoded in 3 places:
- `app/api/workflows/services/workflow-loader.ts:13` — `["browser_tool"]`
- `app/api/connections/available/toolkits/services/tools.ts:110`
- `app/api/connections/available/integrations/route.ts:8`

**Resolution Logic:**
```typescript
// From workflow-loader.ts
const NO_AUTH_TOOLKIT_SLUGS = ["browser_tool"];

for (const step of workflow.steps) {
  if (step.type === "composio" && step.toolkitSlug) {
    // Only include toolkits that require authentication
    if (!NO_AUTH_TOOLKIT_SLUGS.includes(step.toolkitSlug)) {
      requiredConnections.add(step.toolkitSlug);
    }
  }
}
```

**Impact on UX:**
- Browser Tool steps should NOT show connection status (no auth needed)
- Only toolkits NOT in `NO_AUTH_TOOLKIT_SLUGS` need connection binding
- Update mockup: Don't show "Browser Tool - Connected" if it's NO_AUTH

---

## Risk Areas

| Risk | Mitigation |
|------|------------|
| Long-running workflows | Add timeout handling (30s default), show elapsed time, Cancel button |
| Connection not found | Clear error message, link to connections page |
| Stream interruption | Graceful error handling, show partial progress, Retry button |
| Large output data | Truncate preview (1KB), offer "View Full Output" modal |

---

## UXD Mockups

Located in `./UXD/`:

| File | Description |
|------|-------------|
| `01-execute-modal-input-form.html` | Input collection with connection status |
| `02-execute-modal-progress.html` | Running state with step progress |
| `02b-execute-modal-complete.html` | Success state with output |
| `02c-execute-modal-failed.html` | Error state with details |
| `03-editor-header-run-button.html` | Run button states (enabled, disabled, running) |
