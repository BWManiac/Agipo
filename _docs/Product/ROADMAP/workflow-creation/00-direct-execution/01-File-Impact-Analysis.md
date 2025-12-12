# File Impact Analysis: Direct Workflow Execution

## Overview

This document outlines all files that need to be created or modified to implement direct workflow execution from the editor.

**Parts:**
- **Part A:** Backend (API + Services) — Execution endpoint with streaming
- **Part B:** Frontend (State + UI) — Execution modal and progress display

---

## Part A: Backend

### Types

| File | Action | Purpose |
|------|--------|---------|
| `app/api/workflows/types/execution.ts` | **Create** | Define execution request/response types, streaming event types, execution status enum |

### API Routes

| File | Action | Purpose |
|------|--------|---------|
| `app/api/workflows/[workflowId]/execute/route.ts` | **Create** | POST endpoint that accepts inputData, resolves connections, executes workflow with streaming SSE response |

### Services

| File | Action | Purpose |
|------|--------|---------|
| `app/api/workflows/[workflowId]/services/execution-service.ts` | **Create** | Core execution logic: load workflow, build runtimeContext, call streamVNext, format stream events |
| `app/api/workflows/[workflowId]/services/connection-resolver.ts` | **Create** | Resolve required toolkit connections from workflow metadata + user's connected accounts |

### Existing Files (Reference Only)

| File | Purpose | Notes |
|------|---------|-------|
| `app/api/tools/services/workflow-tools.ts` | Existing execution pattern | Reuse `createRunAsync()` + `start()` pattern, adapt for `streamVNext()` |
| `app/api/workflows/services/workflow-loader.ts` | Load workflow from registry | Already has `getWorkflowExecutable()` and `getWorkflowMetadata()` |
| `app/api/connections/services/connections.ts` | List user connections | Use `listConnections(userId)` for connection resolution |

---

## Part B: Frontend

### State (Zustand)

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/workflows/editor/store/slices/executionSlice.ts` | **Create** | Execution state: isOpen, isRunning, inputValues, stepProgress, output, error. Actions: openExecuteModal, closeExecuteModal, setInputValue, executeWorkflow, handleStreamEvent |
| `app/(pages)/workflows/editor/store/index.ts` | **Modify** | Add executionSlice to store composition |

### Hooks

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/workflows/editor/hooks/useExecution.ts` | **Create** | Hook that wraps store actions, handles SSE stream subscription, parses stream events, updates progress state |

### Components

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/workflows/editor/components/execution/ExecuteWorkflowDialog.tsx` | **Create** | Main dialog component with two views: InputForm and ExecutionProgress |
| `app/(pages)/workflows/editor/components/execution/ExecutionInputForm.tsx` | **Create** | Schema-driven form generated from workflow.inputSchema, uses existing WorkflowInputDefinition types |
| `app/(pages)/workflows/editor/components/execution/ExecutionProgress.tsx` | **Create** | Shows step list with status (pending/running/complete/failed), output previews, streaming log |
| `app/(pages)/workflows/editor/components/execution/StepProgressItem.tsx` | **Create** | Individual step row: icon, name, status badge, collapsible output |
| `app/(pages)/workflows/editor/components/execution/ExecutionOutput.tsx` | **Create** | Final output display with JSON viewer and copy button |
| `app/(pages)/workflows/editor/components/header/EditorHeader.tsx` | **Modify** | Add "Run" button next to Save button |

### Existing Files (Reference Only)

| File | Purpose | Notes |
|------|---------|-------|
| `app/(pages)/workflows/editor/components/panels/inputs/WorkflowInputRow.tsx` | Input field rendering | Reference for type-aware input rendering (string, number, boolean) |
| `app/(pages)/tools/editor/store/slices/executionSlice.ts` | Similar pattern | Reference for execution state management |
| `components/ui/dialog.tsx` | Dialog primitives | Use for modal structure |

---

## Implementation Order

### Phase A1: Backend Foundation
1. `execution.ts` (types)
2. `connection-resolver.ts` (service)
3. `execution-service.ts` (service)
4. `execute/route.ts` (API)

### Phase B1: Frontend Foundation
1. `executionSlice.ts` (state)
2. Update `store/index.ts`
3. `useExecution.ts` (hook)

### Phase B2: Frontend UI
1. `ExecutionInputForm.tsx`
2. `StepProgressItem.tsx`
3. `ExecutionProgress.tsx`
4. `ExecutionOutput.tsx`
5. `ExecuteWorkflowDialog.tsx`
6. Update `EditorHeader.tsx`

---

## File Count Summary

| Category | Create | Modify | Total |
|----------|--------|--------|-------|
| Types | 1 | 0 | 1 |
| API Routes | 1 | 0 | 1 |
| Services | 2 | 0 | 2 |
| State | 1 | 1 | 2 |
| Hooks | 1 | 0 | 1 |
| Components | 6 | 1 | 7 |
| **Total** | **12** | **2** | **14** |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Streaming transport | SSE (Server-Sent Events) | Simpler than WebSocket, sufficient for unidirectional flow, works with existing patterns |
| Connection resolution | On-demand at execution | Don't require pre-binding, resolve from user's available connections |
| State management | Zustand slice | Consistent with existing editor patterns |
| Execution approach | `streamVNext()` | Enables real-time progress, Mastra's recommended streaming API |
| UI pattern | Modal dialog | Don't leave editor context, focused execution experience |

---

## Risk Areas

| Risk | Mitigation |
|------|------------|
| Long-running workflows | Add timeout handling, show elapsed time, allow cancel |
| Connection not found | Clear error messaging, link to connections page |
| Stream interruption | Graceful error handling, retry option |
| Large output data | Truncate preview, offer "View Full Output" |
