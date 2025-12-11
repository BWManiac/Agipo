# Task: Anchor Browser Tasks API Integration

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/browser-automation/02-Tasks-API.md`  
**Research Log:** `_docs/Product/ROADMAP/browser-automation/02B-Tasks-API-Research.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Validation

### Approach Validation
❌ **CRITICAL: Anchor uses natural language, NOT code upload** - Research confirms agent.task() accepts descriptions, not TypeScript
✅ **Local task storage for descriptions is necessary** - Anchor doesn't persist tasks
✅ **Application-level task management required** - Must implement versioning/storage layer
✅ **Session-based execution confirmed** - Tasks run in browser sessions with profiles

### Current State Analysis
- No existing task implementation in codebase
- `anchor-agent.ts` already uses agent.task() correctly (natural language)
- Browser automation playground exists for live sessions only
- No task persistence structure exists
- Research confirms Anchor focuses on natural language, not code execution

## File Impact Analysis

The following files will be impacted:

### CREATE (New Files)
- `app/api/browser-automation/services/anchor-tasks.ts` - Anchor Tasks API wrapper
- `app/api/browser-automation/services/task-storage.ts` - Local task metadata
- `app/api/browser-automation/tasks/route.ts` - List/create tasks
- `app/api/browser-automation/tasks/[taskId]/route.ts` - Task CRUD
- `app/api/browser-automation/tasks/[taskId]/deploy/route.ts` - Deploy task
- `app/api/browser-automation/tasks/[taskId]/run/route.ts` - Sync execution
- `app/api/browser-automation/tasks/[taskId]/run-async/route.ts` - Async execution
- `app/api/browser-automation/executions/route.ts` - List executions
- `app/api/browser-automation/executions/[executionId]/route.ts` - Get execution
- `app/(pages)/experiments/browser-automation/store/slices/tasksSlice.ts` - Task state
- `app/(pages)/experiments/browser-automation/store/slices/executionsSlice.ts` - Execution state
- All Task UI components (7 files)

### MODIFY (Existing Files)
- `app/api/browser-automation/types.ts` - Add task types
- `app/(pages)/experiments/browser-automation/store/index.ts` - Add new slices

## Deterministic Decisions

### Storage Decisions
- **Task Storage**: `_tables/browser-tasks/` directory
- **Task Index**: `_tables/browser-tasks/index.json` for task list
- **Task Description**: `_tables/browser-tasks/{taskId}/description.md` for task prompt
- **Execution History**: `_tables/browser-tasks/{taskId}/executions.json`
- **Max Executions**: Keep last 50 executions per task

### Implementation Decisions  
- **Task ID Format**: `task-{nanoid(8)}` for local IDs
- **Task Content**: Store natural language descriptions and output schemas
- **Input Handling**: Pass via context object in agent.task() options
- **Execution Model**: Use agent.task(description, options) API
- **Async Pattern**: Sessions with extended timeouts (up to 180 minutes)
- **Status Tracking**: Application-level tracking in database

### UI/UX Decisions
- **Task Location**: New "Tasks" tab in browser playground
- **Task Editor**: Rich text editor for natural language descriptions
- **Schema Builder**: Visual UI for Zod/JSON output schemas
- **Execution Display**: Show last 10 executions in history
- **Status Badges**: pending (gray), running (blue), success (green), failed (red)
- **Context Builder**: Form for context object with type validation

### Error Handling Decisions
- **Task Creation Failure**: Show error, don't save locally
- **Execution Failure**: Save with 'failed' status and error message
- **Session Timeout**: Handle max 180 minutes (3 hours) gracefully
- **Description Length**: Limit to 2000 characters (LLM token constraints)
- **Rate Limiting**: Queue operations with 1 second delay

---

## Overview

### Goal

Implement Anchor Browser's Tasks API to enable reusable, versioned browser automation scripts that can run synchronously or asynchronously (up to 3 hours). This lays the foundation for batch operations like "apply to 10 jobs."

### Relevant Research

**Anchor Tasks API** (from docs):
```typescript
// Create a task
const task = await anchorClient.task.create({
  name: 'extract-job-listings',
  language: 'typescript',
  code: base64EncodedCode,  // TypeScript file as base64
  inputs: {
    ANCHOR_SEARCH_QUERY: 'Product Manager',
    ANCHOR_MAX_RESULTS: '20'
  }
});

// Run task synchronously
const result = await anchorClient.task.run({
  taskId: task.id,
  version: 'draft',  // or specific version number
  inputs: { ANCHOR_SEARCH_QUERY: 'Engineering Manager' }
});

// Run task asynchronously
const execution = await anchorClient.task.runAsync({
  taskId: task.id,
  version: 'deployed',
  inputs: { ... }
});

// Check async execution status
const status = await anchorClient.task.getExecution(execution.id);
```

**Task Code Structure**:
```typescript
import AnchorClient from 'anchorbrowser';

const anchorClient = new AnchorClient({
  apiKey: process.env.ANCHOR_API_KEY,
});

export default async function run() {
  const browser = await anchorClient.browser.create();
  const page = browser.contexts()[0].pages()[0];

  const searchQuery = process.env.ANCHOR_SEARCH_QUERY;
  await page.goto(`https://linkedin.com/jobs?q=${searchQuery}`);

  // ... automation logic

  await browser.close();
  return { success: true, jobs: extractedJobs };
}
```

**Current Implementation**:
- No tasks API implementation exists
- `anchor-agent.ts` uses `agent.task()` which is different (natural language, single-use)

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/browser-automation/types.ts` | Modify | Add task-related types | A |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/browser-automation/tasks/route.ts` | Create | List and create tasks | A |
| `app/api/browser-automation/tasks/[taskId]/route.ts` | Create | Get, update, delete task | A |
| `app/api/browser-automation/tasks/[taskId]/run/route.ts` | Create | Execute task (sync) | B |
| `app/api/browser-automation/tasks/[taskId]/run-async/route.ts` | Create | Execute task (async) | B |
| `app/api/browser-automation/tasks/[taskId]/deploy/route.ts` | Create | Deploy task to production | A |
| `app/api/browser-automation/executions/route.ts` | Create | List executions | B |
| `app/api/browser-automation/executions/[executionId]/route.ts` | Create | Get execution status | B |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/browser-automation/services/anchor-tasks.ts` | Create | Anchor Tasks API wrapper | A |
| `app/api/browser-automation/services/task-storage.ts` | Create | Local task metadata storage | A |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/experiments/browser-automation/store/slices/tasksSlice.ts` | Create | Task list and CRUD state | C |
| `app/(pages)/experiments/browser-automation/store/slices/executionsSlice.ts` | Create | Execution monitoring state | C |
| `app/(pages)/experiments/browser-automation/store/index.ts` | Modify | Add new slices | C |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/experiments/browser-automation/components/Tasks/TasksPanel.tsx` | Create | Task list sidebar | D |
| `app/(pages)/experiments/browser-automation/components/Tasks/CreateTaskDialog.tsx` | Create | Task creation form | D |
| `app/(pages)/experiments/browser-automation/components/Tasks/TaskDetail.tsx` | Create | View task details | D |
| `app/(pages)/experiments/browser-automation/components/Tasks/TaskCodeEditor.tsx` | Create | Code editor for task | D |
| `app/(pages)/experiments/browser-automation/components/Tasks/TaskInputForm.tsx` | Create | Dynamic input form | D |
| `app/(pages)/experiments/browser-automation/components/Tasks/ExecutionStatus.tsx` | Create | Execution progress | D |
| `app/(pages)/experiments/browser-automation/components/Tasks/ExecutionHistory.tsx` | Create | Past executions list | D |

---

## Part A: Backend - Task Management

### Goal

Create API endpoints and services for task CRUD operations: create, list, get, update, delete, deploy.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/browser-automation/types.ts` | Modify | Add task types | +60 |
| `app/api/browser-automation/services/anchor-tasks.ts` | Create | Anchor API wrapper | ~150 |
| `app/api/browser-automation/services/task-storage.ts` | Create | Local metadata storage | ~120 |
| `app/api/browser-automation/tasks/route.ts` | Create | List/create tasks | ~80 |
| `app/api/browser-automation/tasks/[taskId]/route.ts` | Create | Task CRUD | ~100 |
| `app/api/browser-automation/tasks/[taskId]/deploy/route.ts` | Create | Deploy task | ~50 |

### Pseudocode

#### `app/api/browser-automation/types.ts` (additions)

```
export interface TaskInput {
  name: string           // e.g., "ANCHOR_SEARCH_QUERY"
  description: string
  type: 'string' | 'number' | 'boolean'
  required: boolean
  defaultValue?: string
}

export interface BrowserTask {
  id: string
  name: string
  description: string
  code: string           // TypeScript source (not base64)
  inputs: TaskInput[]
  status: 'draft' | 'deployed'
  version?: string       // e.g., "1.0.0" when deployed
  createdAt: string
  updatedAt: string
  lastRunAt?: string
}

export interface TaskExecution {
  id: string
  taskId: string
  taskVersion: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
  inputs: Record<string, string>
  output?: unknown
  error?: string
  startedAt: string
  completedAt?: string
  duration?: number
}

export interface CreateTaskRequest {
  name: string
  description: string
  code: string
  inputs: TaskInput[]
}

export interface RunTaskRequest {
  inputs: Record<string, string>
  async?: boolean
}
```

#### `app/api/browser-automation/services/anchor-tasks.ts`

```
import AnchorClient from 'anchorbrowser'

const getClient = () => new AnchorClient({ apiKey: process.env.ANCHOR_API_KEY })

encodeTaskCode(code: string): string
├── Convert TypeScript code to base64
└── Return base64 string

createTask(task: CreateTaskRequest): Promise<{ anchorTaskId: string }>
├── Encode code to base64
├── Build inputs object with ANCHOR_ prefix validation
├── Call client.task.create({
│     name: task.name,
│     language: 'typescript',
│     code: encodedCode,
│     inputs: task.inputs
│   })
└── Return Anchor's task ID

deployTask(anchorTaskId: string): Promise<{ version: string }>
├── Call client.task.deploy({ taskId: anchorTaskId })
└── Return deployed version number

runTaskSync(anchorTaskId: string, version: string, inputs: Record<string, string>): Promise<unknown>
├── Call client.task.run({
│     taskId: anchorTaskId,
│     version: version,
│     inputs: inputs
│   })
├── Wait for completion
└── Return result

runTaskAsync(anchorTaskId: string, version: string, inputs: Record<string, string>): Promise<{ executionId: string }>
├── Call client.task.runAsync({
│     taskId: anchorTaskId,
│     version: version,
│     inputs: inputs
│   })
└── Return execution ID

getExecution(executionId: string): Promise<TaskExecution>
├── Call client.task.getExecution(executionId)
├── Map to TaskExecution format
└── Return execution status
```

#### `app/api/browser-automation/services/task-storage.ts`

```
const TASKS_DIR = '_tables/browser-tasks'
const TASKS_INDEX = '_tables/browser-tasks/index.json'

interface StoredTask extends BrowserTask {
  anchorTaskId: string   // Anchor's internal ID
}

listTasks(): Promise<StoredTask[]>
├── Read index.json
├── Return array of tasks (or empty array if missing)

getTask(taskId: string): Promise<StoredTask | null>
├── Read index.json
├── Find task by ID
└── Return task or null

createTask(task: CreateTaskRequest, anchorTaskId: string): Promise<StoredTask>
├── Generate local ID: task-{nanoid(8)}
├── Create StoredTask object with metadata
├── Add to index.json
├── Save task code to {taskId}/code.ts for reference
└── Return created task

updateTask(taskId: string, updates: Partial<BrowserTask>): Promise<StoredTask>
├── Read index.json
├── Find and update task
├── Write back to index.json
├── If code changed, update {taskId}/code.ts
└── Return updated task

deleteTask(taskId: string): Promise<void>
├── Read index.json
├── Remove task entry
├── Write back to index.json
├── Delete {taskId}/ directory

recordExecution(taskId: string, execution: TaskExecution): Promise<void>
├── Read {taskId}/executions.json (or create)
├── Append execution to array
├── Keep last 50 executions
└── Write back

getExecutions(taskId: string): Promise<TaskExecution[]>
├── Read {taskId}/executions.json
└── Return array (or empty)
```

#### `app/api/browser-automation/tasks/route.ts`

```
GET /api/browser-automation/tasks
├── Call taskStorage.listTasks()
├── Return { tasks: StoredTask[] }

POST /api/browser-automation/tasks
├── Parse body: CreateTaskRequest
├── Validate:
│   ├── name required, non-empty
│   ├── code required, non-empty
│   └── inputs must have ANCHOR_ prefix
├── Call anchorTasks.createTask(body)
├── Call taskStorage.createTask(body, anchorTaskId)
├── Return { task: StoredTask }
```

#### `app/api/browser-automation/tasks/[taskId]/route.ts`

```
GET /api/browser-automation/tasks/[taskId]
├── Call taskStorage.getTask(taskId)
├── If not found: Return 404
├── Call taskStorage.getExecutions(taskId)
├── Return { task, executions }

PUT /api/browser-automation/tasks/[taskId]
├── Parse body: Partial<BrowserTask>
├── Get existing task
├── If code changed:
│   ├── Update on Anchor (may need to create new version)
│   └── Reset status to 'draft'
├── Call taskStorage.updateTask(taskId, updates)
├── Return { task: updated }

DELETE /api/browser-automation/tasks/[taskId]
├── Get task
├── Delete from Anchor (if supported)
├── Call taskStorage.deleteTask(taskId)
├── Return { success: true }
```

#### `app/api/browser-automation/tasks/[taskId]/deploy/route.ts`

```
POST /api/browser-automation/tasks/[taskId]/deploy
├── Get task from storage
├── If not found: Return 404
├── Call anchorTasks.deployTask(task.anchorTaskId)
├── Update task: { status: 'deployed', version: deployedVersion }
├── Return { task: updated, version }
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Can create task via API | POST /tasks with valid code → task created |
| AC-A.2 | Task code stored locally | Check _tables/browser-tasks/{id}/code.ts exists |
| AC-A.3 | Task list returns all tasks | GET /tasks → array with created tasks |
| AC-A.4 | Can deploy task | POST /tasks/{id}/deploy → status changes to 'deployed' |
| AC-A.5 | Input validation enforces ANCHOR_ prefix | POST with invalid input name → 400 error |

---

## Part B: Backend - Task Execution

### Goal

Create endpoints for running tasks synchronously and asynchronously, plus execution monitoring.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/browser-automation/tasks/[taskId]/run/route.ts` | Create | Sync execution | ~70 |
| `app/api/browser-automation/tasks/[taskId]/run-async/route.ts` | Create | Async execution | ~60 |
| `app/api/browser-automation/executions/route.ts` | Create | List all executions | ~50 |
| `app/api/browser-automation/executions/[executionId]/route.ts` | Create | Get execution status | ~60 |

### Pseudocode

#### `app/api/browser-automation/tasks/[taskId]/run/route.ts`

```
POST /api/browser-automation/tasks/[taskId]/run
├── Parse body: { inputs: Record<string, string> }
├── Get task from storage
├── If not found: Return 404
├── Determine version:
│   └── If task.status === 'deployed': Use task.version
│   └── Else: Use 'draft'
├── Create execution record: { status: 'running', startedAt: now }
├── Try:
│   ├── Call anchorTasks.runTaskSync(task.anchorTaskId, version, inputs)
│   ├── Update execution: { status: 'success', output: result, completedAt: now }
│   └── Return { execution, output: result }
├── Catch error:
│   ├── Update execution: { status: 'failed', error: message, completedAt: now }
│   └── Return 500 with error details
├── Finally:
│   ├── Update task.lastRunAt
│   └── Record execution in storage
```

#### `app/api/browser-automation/tasks/[taskId]/run-async/route.ts`

```
POST /api/browser-automation/tasks/[taskId]/run-async
├── Parse body: { inputs: Record<string, string> }
├── Get task from storage
├── If not found: Return 404
├── Determine version (same as sync)
├── Call anchorTasks.runTaskAsync(task.anchorTaskId, version, inputs)
├── Create execution record: {
│     id: executionId from Anchor,
│     status: 'pending',
│     taskId,
│     inputs,
│     startedAt: now
│   }
├── Save to storage
├── Update task.lastRunAt
├── Return { executionId, message: "Task started in background" }
```

#### `app/api/browser-automation/executions/[executionId]/route.ts`

```
GET /api/browser-automation/executions/[executionId]
├── Call anchorTasks.getExecution(executionId)
├── Get local execution record if exists
├── Merge Anchor status with local metadata
├── If status changed from pending/running to success/failed:
│   └── Update local record
├── Return { execution }

DELETE /api/browser-automation/executions/[executionId]
├── Call Anchor to cancel (if supported)
├── Update local record: status = 'cancelled'
├── Return { success: true }
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Can run task synchronously | POST /tasks/{id}/run → waits → returns result |
| AC-B.2 | Can run task asynchronously | POST /tasks/{id}/run-async → returns immediately with executionId |
| AC-B.3 | Can check execution status | GET /executions/{id} → returns current status |
| AC-B.4 | Execution history persisted | Run task, check /tasks/{id} → executions array updated |
| AC-B.5 | Failed execution shows error | Run with bad code → execution.status = 'failed', error message present |

---

## Part C: Frontend - State Management

### Goal

Add Zustand slices for task list, CRUD operations, and execution monitoring.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `store/slices/tasksSlice.ts` | Create | Task CRUD state | ~200 |
| `store/slices/executionsSlice.ts` | Create | Execution monitoring | ~150 |
| `store/index.ts` | Modify | Add slices to store | +10 |

### Pseudocode

#### `store/slices/tasksSlice.ts`

```
interface TasksSlice {
  // State
  tasks: BrowserTask[]
  selectedTaskId: string | null
  isLoading: boolean
  isCreating: boolean
  isRunning: boolean
  error: string | null

  // Task CRUD
  fetchTasks(): Promise<void>
  createTask(task: CreateTaskRequest): Promise<BrowserTask>
  updateTask(taskId: string, updates: Partial<BrowserTask>): Promise<void>
  deleteTask(taskId: string): Promise<void>
  deployTask(taskId: string): Promise<void>

  // Selection
  selectTask(taskId: string | null): void

  // Execution
  runTask(taskId: string, inputs: Record<string, string>): Promise<unknown>
  runTaskAsync(taskId: string, inputs: Record<string, string>): Promise<string>

  // Error handling
  clearError(): void
}

fetchTasks():
├── Set isLoading = true
├── GET /api/browser-automation/tasks
├── Set tasks = response.tasks
├── Set isLoading = false
├── On error: Set error = message

createTask(task):
├── Set isCreating = true
├── POST /api/browser-automation/tasks with task
├── Add response.task to tasks array
├── Set isCreating = false
├── Return created task

runTask(taskId, inputs):
├── Set isRunning = true
├── POST /api/browser-automation/tasks/{taskId}/run with { inputs }
├── Set isRunning = false
├── Return response.output

runTaskAsync(taskId, inputs):
├── POST /api/browser-automation/tasks/{taskId}/run-async with { inputs }
├── Add execution to executionsSlice
├── Return executionId
```

#### `store/slices/executionsSlice.ts`

```
interface ExecutionsSlice {
  // State
  executions: TaskExecution[]
  pollingIds: Set<string>   // Executions we're polling

  // Actions
  addExecution(execution: TaskExecution): void
  updateExecution(executionId: string, updates: Partial<TaskExecution>): void
  pollExecution(executionId: string): void
  stopPolling(executionId: string): void
  fetchExecution(executionId: string): Promise<TaskExecution>
  cancelExecution(executionId: string): Promise<void>
  clearCompleted(): void
}

pollExecution(executionId):
├── Add to pollingIds
├── Start interval (every 2 seconds):
│   ├── GET /api/browser-automation/executions/{executionId}
│   ├── Update execution in state
│   ├── If status is 'success' or 'failed' or 'cancelled':
│   │   ├── Stop polling
│   │   └── Remove from pollingIds
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-C.1 | Tasks load on mount | Open page → tasks fetched and displayed |
| AC-C.2 | Create task updates list | Create task → appears in list |
| AC-C.3 | Async execution tracked | Run async → execution appears in state |
| AC-C.4 | Polling updates status | Async task completes → status updates automatically |
| AC-C.5 | Error state handled | API error → error message in state |

---

## Part D: Frontend - Task UI Components

### Goal

Build the UI for task management: list, create, edit, run, and monitor executions.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `components/Tasks/TasksPanel.tsx` | Create | Task list sidebar | ~120 |
| `components/Tasks/CreateTaskDialog.tsx` | Create | Task creation modal | ~180 |
| `components/Tasks/TaskDetail.tsx` | Create | Task view/edit | ~200 |
| `components/Tasks/TaskCodeEditor.tsx` | Create | Code editor | ~100 |
| `components/Tasks/TaskInputForm.tsx` | Create | Dynamic inputs | ~120 |
| `components/Tasks/ExecutionStatus.tsx` | Create | Execution progress | ~80 |
| `components/Tasks/ExecutionHistory.tsx` | Create | Past runs list | ~100 |
| `components/Tasks/index.ts` | Create | Exports | ~10 |

### Pseudocode

#### `components/Tasks/TasksPanel.tsx`

```
TasksPanel:
├── Props: none (uses store)
├── State from store:
│   ├── tasks, selectedTaskId, isLoading
│   ├── selectTask, fetchTasks
├── useEffect: fetchTasks on mount
├── UI:
│   ├── Header: "Tasks" + "New Task" button
│   ├── If isLoading: Spinner
│   ├── If tasks.length === 0: Empty state
│   ├── Task list:
│   │   └── For each task:
│   │       ├── TaskCard: name, status badge, last run
│   │       ├── Click → selectTask(task.id)
│   │       └── Selected state styling
│   └── Footer: Task count
```

#### `components/Tasks/CreateTaskDialog.tsx`

```
CreateTaskDialog:
├── Props: open, onClose
├── State:
│   ├── name, description, code, inputs[]
│   ├── isSubmitting
├── UI:
│   ├── Dialog with title "Create Task"
│   ├── Form:
│   │   ├── Name input (required)
│   │   ├── Description textarea
│   │   ├── TaskCodeEditor for code
│   │   ├── Inputs section:
│   │   │   ├── List of TaskInput with remove buttons
│   │   │   └── "Add Input" button
│   │   └── Help text: "Input names must start with ANCHOR_"
│   ├── Cancel button
│   └── Create button
├── On submit:
│   ├── Validate all fields
│   ├── Call createTask({ name, description, code, inputs })
│   ├── Close dialog
│   └── Select new task
```

#### `components/Tasks/TaskDetail.tsx`

```
TaskDetail:
├── Props: taskId
├── State from store:
│   ├── task (find by id), executions
│   ├── runTask, runTaskAsync, deployTask
├── Local state:
│   ├── isEditing, editedCode
│   ├── inputValues: Record<string, string>
├── UI:
│   ├── Header: task.name, status badge, deploy button (if draft)
│   ├── Tabs: "Run" | "Code" | "History"
│   ├── Run tab:
│   │   ├── TaskInputForm for each input
│   │   ├── Run button (sync)
│   │   ├── Run in Background button (async)
│   │   └── ExecutionStatus (if running)
│   ├── Code tab:
│   │   ├── TaskCodeEditor (read-only or edit mode)
│   │   └── Edit/Save buttons
│   └── History tab:
│       └── ExecutionHistory
```

#### `components/Tasks/TaskCodeEditor.tsx`

```
TaskCodeEditor:
├── Props: code, onChange, readOnly
├── Use a code editor component (Monaco or CodeMirror or simple textarea)
├── Syntax highlighting for TypeScript
├── Line numbers
├── Provide template button for blank code:
│   └── Insert starter template with AnchorClient setup
```

#### `components/Tasks/TaskInputForm.tsx`

```
TaskInputForm:
├── Props: inputs: TaskInput[], values: Record<string, string>, onChange
├── UI:
│   ├── For each input:
│   │   ├── Label: input.name (without ANCHOR_ prefix for display)
│   │   ├── Description text
│   │   ├── Input field (type based on input.type)
│   │   ├── Required indicator
│   │   └── Default value hint
│   └── Validation messages
```

#### `components/Tasks/ExecutionStatus.tsx`

```
ExecutionStatus:
├── Props: execution: TaskExecution
├── UI:
│   ├── Status badge: pending/running/success/failed/cancelled
│   ├── If running:
│   │   ├── Spinner
│   │   ├── Duration counter
│   │   └── Cancel button
│   ├── If success:
│   │   ├── Check icon
│   │   ├── Duration
│   │   └── Output preview (collapsible JSON)
│   └── If failed:
│       ├── Error icon
│       ├── Error message
│       └── Retry button
```

#### `components/Tasks/ExecutionHistory.tsx`

```
ExecutionHistory:
├── Props: executions: TaskExecution[]
├── UI:
│   ├── If empty: "No executions yet"
│   ├── List sorted by startedAt descending:
│   │   └── For each execution:
│   │       ├── Status badge
│   │       ├── Started time (relative)
│   │       ├── Duration
│   │       ├── Input summary
│   │       └── Expand to see output/error
│   └── Pagination if > 10 items
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-D.1 | Tasks panel shows task list | Open page → tasks visible in sidebar |
| AC-D.2 | Can create task via dialog | Click "New Task" → fill form → task created |
| AC-D.3 | Task detail shows code and inputs | Select task → see code editor and input form |
| AC-D.4 | Can run task from UI | Fill inputs, click Run → execution completes |
| AC-D.5 | Async execution shows progress | Run in background → status updates in real-time |
| AC-D.6 | Execution history visible | Run task multiple times → history shows all runs |
| AC-D.7 | Can deploy task | Click Deploy → status changes, version shown |

---

## User Flows

### Flow 1: Create and Run First Task

```
1. User clicks "Tasks" tab in playground
2. TasksPanel shows empty state: "No tasks yet. Create your first task."
3. User clicks "New Task"
4. CreateTaskDialog opens
5. User enters:
   - Name: "extract-linkedin-jobs"
   - Description: "Extract job postings from LinkedIn search"
   - Code: (uses template, adds extraction logic)
   - Inputs: ANCHOR_SEARCH_QUERY (string, required), ANCHOR_MAX_RESULTS (number, default "20")
6. User clicks "Create"
7. Task appears in list, selected automatically
8. TaskDetail shows with Run tab active
9. User fills in: search_query = "Product Manager"
10. User clicks "Run"
11. ExecutionStatus shows "Running..." with spinner
12. After completion, shows "Success" with extracted jobs
```

### Flow 2: Background Execution for Batch Job

```
1. User has "extract-linkedin-jobs" task deployed
2. User clicks "Run in Background"
3. Dialog confirms: "Task will run in background for up to 3 hours"
4. User clicks "Start"
5. Execution appears in history with "Pending" status
6. User can close browser tab
7. Later, user returns to playground
8. Execution shows "Success" with results
```

---

## Out of Scope

- AI-powered code generation from natural language
- Task marketplace / sharing
- Scheduled task execution (cron)
- Task chaining / dependencies
- Real-time log streaming from task

---

## Open Questions

- [ ] Does Anchor SDK expose task.update() or do we need to create new task? **RESEARCH NEEDED**: Check 02B research log
- ✅ What's the max code size for tasks? **DECIDED**: Enforce 100KB limit locally
- [ ] Can we get real-time logs from running tasks? **RESEARCH NEEDED**: Check Anchor docs
- ✅ How do we handle Anchor rate limits on task creation? **DECIDED**: Queue with 1 second delay

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | Claude |
