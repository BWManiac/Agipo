# Task: Runtime Compilation & Execution

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/workflow-creation/04-runtime/13-Runtime-Compilation-Execution.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Overview

### Goal

Build a complete workflow lifecycle system covering compilation (JSON to TypeScript), execution (Mastra runtime), progress tracking (SSE), and history (database records). Users experience seamless save-compile-run with real-time feedback.

### Relevant Research

The current system has:
- `step-generator.ts` for transpiling workflow.json to workflow.ts
- `registry.ts` for static workflow imports (Turbopack compatible)
- Mastra integration for execution

Gaps to address:
- No compilation status feedback
- No progress events during execution
- No execution history storage
- Limited error handling visibility

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/types/execution.ts` | Create | Execution types | A |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/compile/route.ts` | Create | Compile endpoint | A |
| `app/api/workflows/execute/route.ts` | Create | Execute endpoint | A |
| `app/api/workflows/execute/[id]/route.ts` | Create | Execution status | A |
| `app/api/workflows/execute/[id]/events/route.ts` | Create | SSE endpoint | A |
| `app/api/workflows/history/route.ts` | Create | History endpoint | A |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/services/compiler.ts` | Create | Compilation orchestration | A |
| `app/api/workflows/services/executor.ts` | Create | Execution orchestration | A |
| `app/api/workflows/services/execution-store.ts` | Create | History storage | A |
| `app/api/workflows/services/step-generator.ts` | Modify | Improve error handling | A |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/store/slices/execution-slice.ts` | Create | Execution state | B |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/components/CompilationStatus.tsx` | Create | Compile feedback | B |
| `app/(pages)/workflows/editor/components/RunInputModal.tsx` | Create | Input collection | B |
| `app/(pages)/workflows/editor/components/ExecutionMonitor.tsx` | Create | Progress display | B |
| `app/(pages)/workflows/editor/components/ExecutionHistory.tsx` | Create | History list | B |

---

## Part A: Backend Runtime System

### Goal

Build compilation and execution services with SSE progress and history storage.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/types/execution.ts` | Create | Types | ~120 |
| `app/api/workflows/compile/route.ts` | Create | Compile API | ~80 |
| `app/api/workflows/execute/route.ts` | Create | Execute API | ~120 |
| `app/api/workflows/execute/[id]/events/route.ts` | Create | SSE API | ~100 |
| `app/api/workflows/services/compiler.ts` | Create | Compiler | ~200 |
| `app/api/workflows/services/executor.ts` | Create | Executor | ~300 |
| `app/api/workflows/services/execution-store.ts` | Create | Storage | ~150 |

### Pseudocode

#### `app/api/workflows/types/execution.ts`

```typescript
interface CompilationRequest {
  workflowId: string;
}

interface CompilationResult {
  success: boolean;
  workflowId: string;
  errors?: CompilationError[];
  warnings?: CompilationWarning[];
  generatedCode?: string;
  timestamp: Date;
}

interface CompilationError {
  type: 'validation' | 'transpilation' | 'registry';
  message: string;
  location?: { stepId?: string; field?: string };
}

interface ExecutionRequest {
  workflowId: string;
  inputs: Record<string, any>;
  userId: string;
}

interface ExecutionRecord {
  id: string;
  workflowId: string;
  workflowVersion: string;
  userId: string;
  status: ExecutionStatus;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  error?: ExecutionError;
  stepResults: StepResult[];
}

type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

interface StepResult {
  stepId: string;
  stepName: string;
  stepType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  input?: any;
  output?: any;
  error?: string;
}

interface ExecutionError {
  message: string;
  stepId?: string;
  stack?: string;
  recoverable: boolean;
}

// SSE Event Types
type ExecutionEvent =
  | { type: 'started'; executionId: string; timestamp: Date }
  | { type: 'step_started'; stepId: string; stepName: string; timestamp: Date }
  | { type: 'step_progress'; stepId: string; progress: number; message?: string }
  | { type: 'step_completed'; stepId: string; output: any; duration: number }
  | { type: 'step_failed'; stepId: string; error: string }
  | { type: 'completed'; outputs: any; duration: number }
  | { type: 'failed'; error: ExecutionError }
  | { type: 'cancelled' }
  | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string };
```

#### `app/api/workflows/services/compiler.ts`

```
class WorkflowCompiler {
  async compile(workflowId: string): Promise<CompilationResult>
  ├── Load workflow.json from _tables/workflows/{id}/
  ├── Validate workflow
  │   ├── Schema validation
  │   ├── Check all steps have valid types
  │   ├── Check all bindings are resolvable
  │   └── Collect validation errors
  ├── If validation errors
  │   └── Return failure with errors
  ├── Transpile to TypeScript
  │   ├── Generate step definitions
  │   ├── Generate workflow composition
  │   ├── Generate bindings/mappings
  │   └── Generate metadata exports
  ├── Write workflow.ts
  ├── Update registry
  │   ├── Add to static import map
  │   └── Regenerate registry index
  ├── Return success with generated code
  └── On error at any step
      └── Return failure with error details

  private validateWorkflow(workflow: WorkflowDefinition): ValidationResult
  ├── Use schema-validator service
  └── Return errors and warnings

  private transpile(workflow: WorkflowDefinition): string
  ├── Use step-generator service
  ├── Generate complete workflow.ts content
  └── Return TypeScript code

  private updateRegistry(workflowId: string): void
  ├── Read current registry
  ├── Add/update workflow entry
  ├── Write registry files
  │   ├── registry.ts (static imports)
  │   └── index.ts (re-exports)
  └── Log registry update
}
```

#### `app/api/workflows/services/executor.ts`

```
class WorkflowExecutor {
  private eventEmitter: EventEmitter;

  async execute(request: ExecutionRequest): Promise<ExecutionRecord>
  ├── Create execution record
  │   ├── Generate execution ID
  │   ├── Set status: 'pending'
  │   └── Store in database
  ├── Validate inputs against schema
  │   └── If invalid, fail early
  ├── Load workflow from registry
  ├── Set up runtime context
  │   ├── Resolve user's Composio connections
  │   ├── Create Mastra runtime context
  │   └── Inject connections
  ├── Update status: 'running'
  ├── Emit: { type: 'started', executionId }
  ├── Execute workflow
  │   ├── Create workflow run
  │   ├── Attach progress listeners
  │   └── Start execution
  ├── For each step (via listeners)
  │   ├── On step start
  │   │   ├── Emit: { type: 'step_started', stepId }
  │   │   └── Update stepResults
  │   ├── On step complete
  │   │   ├── Emit: { type: 'step_completed', stepId, output }
  │   │   └── Update stepResults
  │   └── On step fail
  │       ├── Emit: { type: 'step_failed', stepId, error }
  │       └── Handle error (retry/skip/fail)
  ├── On workflow complete
  │   ├── Update status: 'completed'
  │   ├── Store outputs
  │   ├── Emit: { type: 'completed', outputs }
  │   └── Update execution record
  ├── On workflow fail
  │   ├── Update status: 'failed'
  │   ├── Store error
  │   ├── Emit: { type: 'failed', error }
  │   └── Update execution record
  └── Return execution record

  async cancel(executionId: string): Promise<void>
  ├── Find running execution
  ├── Signal cancellation
  ├── Update status: 'cancelled'
  └── Emit: { type: 'cancelled' }

  getEventStream(executionId: string): ReadableStream
  └── Return SSE stream from eventEmitter
}
```

#### `app/api/workflows/execute/[id]/events/route.ts`

```
GET /api/workflows/execute/[id]/events
├── Parse execution ID from params
├── Authenticate user
├── Get executor instance
├── Set up SSE response
│   ├── Headers: 'Content-Type': 'text/event-stream'
│   └── Keep-alive configuration
├── Subscribe to execution events
│   ├── On event → format as SSE and write
│   └── On complete/fail → close stream
├── Handle client disconnect
│   └── Unsubscribe from events
└── Return streaming response
```

#### `app/api/workflows/services/execution-store.ts`

```
class ExecutionStore {
  async create(record: Partial<ExecutionRecord>): Promise<ExecutionRecord>
  ├── Generate ID
  ├── Set defaults
  ├── Insert into database
  └── Return created record

  async update(id: string, updates: Partial<ExecutionRecord>): Promise<void>
  └── Update database record

  async get(id: string): Promise<ExecutionRecord | null>
  └── Query database

  async list(filters: ExecutionFilters): Promise<ExecutionRecord[]>
  ├── Apply filters (workflowId, userId, status, date range)
  ├── Order by startedAt desc
  ├── Apply pagination
  └── Return records

  async getByWorkflow(workflowId: string, limit = 10): Promise<ExecutionRecord[]>
  └── Query with workflowId filter

  async cleanup(olderThan: Date): Promise<number>
  └── Delete old records, return count
}
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Compile validates workflow | Compile invalid workflow, verify error |
| AC-A.2 | Compile generates TypeScript | Compile valid workflow, verify .ts created |
| AC-A.3 | Execute runs workflow | Execute workflow, verify completion |
| AC-A.4 | SSE streams events | Connect to events, verify step events |
| AC-A.5 | Execution stored | Complete execution, verify in database |
| AC-A.6 | Cancel stops execution | Cancel mid-run, verify cancelled status |
| AC-A.7 | History queryable | List executions, verify filtered results |

---

## Part B: Frontend Runtime UI

### Goal

Create UI for compilation feedback, input collection, execution monitoring, and history.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows/editor/store/slices/execution-slice.ts` | Create | State | ~120 |
| `app/(pages)/workflows/editor/components/CompilationStatus.tsx` | Create | Status UI | ~100 |
| `app/(pages)/workflows/editor/components/RunInputModal.tsx` | Create | Input modal | ~150 |
| `app/(pages)/workflows/editor/components/ExecutionMonitor.tsx` | Create | Monitor UI | ~250 |
| `app/(pages)/workflows/editor/components/ExecutionHistory.tsx` | Create | History UI | ~180 |

### Pseudocode

#### `app/(pages)/workflows/editor/store/slices/execution-slice.ts`

```typescript
interface ExecutionState {
  // Compilation
  compilationStatus: 'idle' | 'compiling' | 'success' | 'failed';
  compilationResult: CompilationResult | null;

  // Execution
  currentExecution: ExecutionRecord | null;
  isRunning: boolean;
  events: ExecutionEvent[];

  // History
  history: ExecutionRecord[];
  historyLoading: boolean;
}

actions:
  compile(workflowId: string)
  ├── Set compilationStatus: 'compiling'
  ├── Call POST /api/workflows/compile
  ├── Set compilationResult
  └── Set compilationStatus: success/failed

  startExecution(workflowId: string, inputs: Record<string, any>)
  ├── Call POST /api/workflows/execute
  ├── Set currentExecution
  ├── Set isRunning: true
  ├── Subscribe to SSE events
  └── Update events array on each event

  cancelExecution(executionId: string)
  ├── Call DELETE /api/workflows/execute/{id}
  └── Update currentExecution status

  loadHistory(workflowId: string)
  ├── Set historyLoading: true
  ├── Call GET /api/workflows/history?workflowId={id}
  ├── Set history
  └── Set historyLoading: false

  clearExecution()
  └── Reset currentExecution, events
```

#### `app/(pages)/workflows/editor/components/ExecutionMonitor.tsx`

```
ExecutionMonitor({ executionId })
├── Subscribe to execution-slice state
├── Layout
│   ├── Header
│   │   ├── Status badge (running/completed/failed)
│   │   ├── Duration timer (live if running)
│   │   └── Cancel button (if running)
│   ├── Progress section
│   │   ├── Step progress bar (n of m)
│   │   └── Current step name
│   ├── Step timeline
│   │   ├── For each step
│   │   │   ├── Status icon (pending/running/done/error)
│   │   │   ├── Step name
│   │   │   ├── Duration (if complete)
│   │   │   └── Expand for output/error
│   │   └── Current step highlighted
│   ├── Logs panel (collapsible)
│   │   └── Live log stream
│   └── Results section (when complete)
│       ├── Output data preview
│       └── Re-run button
├── Connect to SSE
│   ├── On step_started → update timeline
│   ├── On step_completed → update timeline, add output
│   ├── On step_failed → show error
│   ├── On completed → show results
│   └── On failed → show error state
└── Cleanup on unmount
    └── Close SSE connection
```

#### `app/(pages)/workflows/editor/components/RunInputModal.tsx`

```
RunInputModal({ workflow, onRun, onCancel })
├── Get runtime input schema from workflow
├── State: inputValues (form state)
├── Layout
│   ├── Modal container
│   ├── Header: "Run {workflowName}"
│   ├── Form
│   │   └── SchemaRenderer for inputSchema
│   │       ├── Dynamic form fields
│   │       └── Validation
│   ├── Recent inputs (if available)
│   │   └── "Use inputs from last run" option
│   └── Actions
│       ├── "Run" button (primary)
│       └── "Cancel" button
├── On run click
│   ├── Validate inputs
│   ├── If valid, call onRun(inputValues)
│   └── If invalid, show errors
└── Keyboard shortcuts
    ├── Enter → submit
    └── Escape → cancel
```

### Canvas Integration

```typescript
// Highlight steps during execution
function useExecutionHighlight(execution: ExecutionRecord | null) {
  const highlightedSteps = useMemo(() => {
    if (!execution) return {};

    return execution.stepResults.reduce((acc, step) => {
      acc[step.stepId] = step.status;
      return acc;
    }, {} as Record<string, StepStatus>);
  }, [execution]);

  return highlightedSteps;
}

// In canvas node rendering
const NodeWithHighlight = ({ node }) => {
  const highlights = useExecutionHighlight(currentExecution);
  const status = highlights[node.id];

  return (
    <Node
      className={cn(
        status === 'running' && 'animate-pulse border-blue-500',
        status === 'completed' && 'border-green-500',
        status === 'failed' && 'border-red-500'
      )}
    />
  );
};
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Compilation status shows | Save workflow, verify status displayed |
| AC-B.2 | Input modal collects inputs | Click run, verify form appears |
| AC-B.3 | Monitor shows progress | Run workflow, verify steps update |
| AC-B.4 | Canvas highlights current | Run workflow, verify step highlight |
| AC-B.5 | History lists executions | Open history, verify list populated |
| AC-B.6 | Cancel works from UI | Click cancel, verify execution stops |

---

## User Flows

### Flow 1: Save and Run

```
1. User edits workflow and saves
2. CompilationStatus shows "Compiling..."
3. CompilationStatus shows "Ready"
4. User clicks "Run"
5. RunInputModal appears (if inputs needed)
6. User fills inputs, clicks "Run"
7. ExecutionMonitor appears
8. Steps highlight as they execute
9. "Completed" status shown
10. User views results
```

---

## Out of Scope

- Scheduled execution
- Parallel execution queue
- Distributed execution

---

## Open Questions

- [ ] How to handle browser refresh during execution?
- [ ] Should we support re-running from failed step?
- [ ] How long to retain execution history?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-11 | Initial creation | Claude |
