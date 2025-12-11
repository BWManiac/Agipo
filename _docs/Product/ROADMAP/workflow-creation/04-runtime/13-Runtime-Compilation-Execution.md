# Runtime Compilation & Execution

**Status:** Draft
**Priority:** P0
**North Star:** User saves workflow, system compiles to executable code, user clicks "Run", workflow executes reliably with real-time progress updates.

---

## Problem Statement

Workflows exist as JSON definitions in the editor, but need to execute as code. The current transpilation and execution system:
1. Generates Mastra workflow code
2. Uses static registry for imports
3. Executes via Mastra runtime

However, gaps exist:
- No real-time execution feedback
- Limited error visibility
- No execution history
- Unclear compilation status

**The Gap:** Seamless workflow lifecycle from save → compile → execute → monitor.

---

## User Value

- **Reliable execution** — Workflows run consistently every time
- **Clear feedback** — See compilation status and errors immediately
- **Progress visibility** — Watch workflow progress in real-time
- **Error recovery** — Understand and fix failures quickly
- **Execution history** — Review past runs and their results

---

## User Flows

### Flow 1: Save and Compile

```
1. User finishes editing workflow
2. User clicks "Save"
3. System saves workflow.json
4. System triggers compilation:
   - Validates workflow structure
   - Generates workflow.ts from JSON
   - Updates registry
5. Compilation status shown:
   - Success: "Workflow compiled and ready"
   - Warning: "Compiled with warnings" + details
   - Error: "Compilation failed" + errors
6. If successful, "Run" button becomes active
```

### Flow 2: Execute Workflow

```
1. User opens saved workflow
2. User clicks "Run"
3. If workflow has runtime inputs:
   - Modal shows input form (schema-driven)
   - User fills inputs
   - User clicks "Start"
4. Execution begins:
   - Execution ID assigned
   - Status: "Running"
   - Progress indicator starts
5. For each step:
   - Step highlighted on canvas
   - Status: "In Progress" → "Complete" or "Failed"
   - Output preview available
6. Workflow completes:
   - Final status: "Completed" or "Failed"
   - Duration shown
   - Full results available
```

### Flow 3: Monitor Execution

```
1. Workflow is running
2. Execution panel shows:
   - Current step name
   - Step progress (n of m)
   - Elapsed time
   - Live logs
3. Canvas view updates:
   - Completed steps: green border
   - Current step: animated border
   - Pending steps: gray
4. User can:
   - View step outputs as they complete
   - Cancel execution
   - Detach and return later
5. If step fails:
   - Error shown inline
   - Retry/skip options
```

### Flow 4: Review History

```
1. User opens workflow
2. User clicks "History" tab
3. List shows past executions:
   - Date/time
   - Status (completed/failed)
   - Duration
   - Trigger (manual/scheduled)
4. User clicks on execution
5. Details show:
   - Full execution timeline
   - Input values used
   - Output for each step
   - Any errors encountered
6. User can re-run with same inputs
```

---

## Code Areas

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/api/workflows/services/step-generator.ts` | Code generation | Transpilation logic |
| `_tables/workflows/registry.ts` | Workflow registry | Static imports |
| `lib/mastra/` | Mastra integration | Agent/workflow execution |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Compilation trigger | On save | Immediate feedback |
| Execution environment | Server-side via Mastra | Full capability access |
| Progress updates | Server-sent events | Real-time, low overhead |
| State persistence | Database with run ID | Query history, resume |

---

## Architecture

### Compilation Pipeline

```
workflow.json (User Definition)
         ↓
┌─────────────────────────────────────────┐
│         Validation                      │
│  - Schema validation                    │
│  - Connection integrity                 │
│  - Control flow completeness            │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│         Transpilation                   │
│  - Generate step definitions            │
│  - Generate workflow composition        │
│  - Generate bindings/mappings           │
│  - Add metadata exports                 │
└─────────────────────────────────────────┘
         ↓
workflow.ts (Executable Code)
         ↓
┌─────────────────────────────────────────┐
│         Registry Update                 │
│  - Add to static import map             │
│  - Update index file                    │
│  - Invalidate caches                    │
└─────────────────────────────────────────┘
         ↓
Ready for Execution
```

### Execution Pipeline

```
Run Request (workflowId, inputs, userId)
         ↓
┌─────────────────────────────────────────┐
│         Initialization                  │
│  - Create execution record              │
│  - Validate runtime inputs              │
│  - Resolve connections                  │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│         Context Setup                   │
│  - Create RuntimeContext                │
│  - Inject connections (Composio)        │
│  - Set user context                     │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│         Step Execution Loop             │
│  - For each step (respecting control)   │
│  - Execute step.execute()               │
│  - Capture output                       │
│  - Emit progress event                  │
│  - Handle errors                        │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│         Completion                      │
│  - Store final results                  │
│  - Update execution record              │
│  - Emit completion event                │
└─────────────────────────────────────────┘
         ↓
Execution Record (results, status, duration)
```

### Execution States

```typescript
type ExecutionStatus =
  | 'pending'      // Queued but not started
  | 'running'      // Currently executing
  | 'paused'       // User paused or awaiting input
  | 'completed'    // Successfully finished
  | 'failed'       // Error occurred
  | 'cancelled';   // User cancelled

interface ExecutionRecord {
  id: string;
  workflowId: string;
  userId: string;
  status: ExecutionStatus;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
  error?: {
    stepId: string;
    message: string;
    stack?: string;
  };
  stepResults: StepResult[];
}

interface StepResult {
  stepId: string;
  stepName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  output?: any;
  error?: string;
  duration?: number;
}
```

### Progress Events (SSE)

```typescript
type ProgressEvent =
  | { type: 'execution_started'; executionId: string }
  | { type: 'step_started'; stepId: string; stepName: string }
  | { type: 'step_completed'; stepId: string; output: any; duration: number }
  | { type: 'step_failed'; stepId: string; error: string }
  | { type: 'execution_completed'; outputs: any; duration: number }
  | { type: 'execution_failed'; error: string; stepId?: string }
  | { type: 'log'; level: string; message: string };
```

---

## Constraints

- **Turbopack compatibility** — Static registry required for imports
- **Mastra patterns** — Must use Mastra workflow/step APIs
- **Connection scoping** — Composio connections per user
- **Timeout limits** — Long-running workflows need checkpointing
- **Error boundaries** — Step failures shouldn't crash entire system

---

## Success Criteria

- [ ] Save triggers automatic compilation
- [ ] Compilation errors shown clearly
- [ ] Run executes workflow with inputs
- [ ] Progress updates in real-time via SSE
- [ ] Canvas highlights current step
- [ ] Execution history stored and queryable
- [ ] Failed executions show error details
- [ ] Cancel execution works mid-run
- [ ] Retry failed step works

---

## Out of Scope

- Scheduled execution (triggers)
- Distributed execution
- Workflow versioning at runtime
- Checkpointing for resume
- Multi-tenant execution isolation

---

## Open Questions

- How long should execution history be retained?
- Should we support execution queuing?
- How do we handle very long-running workflows?
- Should step outputs be streamed or sent at completion?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Compilation Status | Save feedback | Success/error states |
| Run Input Modal | Collect inputs | Schema-driven form |
| Execution Monitor | Progress view | Steps, status, logs |
| History List | Past executions | List with filters |
| Execution Detail | Single run view | Timeline, outputs |

### Mockup Location

```
_docs/UXD/Pages/workflows/
├── runtime/
│   ├── compilation-status.html
│   ├── run-input-modal.html
│   ├── execution-monitor.html
│   ├── history-list.html
│   └── execution-detail.html
```

---

## References

- Mastra workflows: https://mastra.ai/docs/workflows
- Server-sent events: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- Step generator: `app/api/workflows/services/step-generator.ts`
