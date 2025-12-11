# Tasks API - Implementation Phases

**Feature:** Anchor Browser Tasks API Integration  
**Task Document:** `02A-Tasks-API-Task.md`  
**Research Log:** `02B-Tasks-API-Research.md`

**IMPORTANT**: Research revealed that Anchor uses natural language task descriptions via `agent.task()`, not code upload. This phases document reflects the actual API.

---

## Phase 1: Task Storage & Management

### Goal
Create application-level task storage and management since Anchor doesn't persist tasks. Store natural language descriptions and structured schemas.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/api/browser-automation/types.ts` | Modify | Add task types for natural language |
| `app/api/browser-automation/services/task-storage.ts` | Create | Local task persistence |
| `app/api/browser-automation/tasks/route.ts` | Create | List/create tasks |
| `app/api/browser-automation/tasks/[taskId]/route.ts` | Create | Get/update/delete task |

### Pseudocode

#### `app/api/browser-automation/types.ts`
```typescript
export interface BrowserTask {
  id: string;
  name: string;
  description: string;           // Natural language task description
  context?: Record<string, any>; // Default context values
  outputSchema?: {               // Optional structured output schema
    type: "object";
    properties: Record<string, any>;
  };
  options?: {
    maxSteps?: number;
    agent?: string;             // browser-use, openai-cua, etc.
    provider?: string;
    model?: string;
    profileName?: string;       // Use saved browser profile
  };
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
}

export interface TaskExecution {
  id: string;
  taskId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  context: Record<string, any>;  // Input context
  output?: any;                  // Result from agent.task()
  error?: string;
  startedAt: string;
  completedAt?: string;
}
```

#### `app/api/browser-automation/services/task-storage.ts`
```typescript
const TASKS_DIR = '_tables/browser-tasks';
const TASKS_INDEX = '_tables/browser-tasks/index.json';

export async function createTask(data: CreateTaskRequest): Promise<BrowserTask> {
  const taskId = `task-${nanoid(8)}`;
  
  const task: BrowserTask = {
    id: taskId,
    name: data.name,
    description: data.description,
    context: data.context,
    outputSchema: data.outputSchema,
    options: data.options,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Read existing index
  const tasks = await readTasksIndex();
  tasks.push(task);
  
  // Save updated index
  await fs.writeFile(TASKS_INDEX, JSON.stringify(tasks, null, 2));
  
  // Save task details
  const taskDir = path.join(TASKS_DIR, taskId);
  await fs.mkdir(taskDir, { recursive: true });
  await fs.writeFile(
    path.join(taskDir, 'task.json'),
    JSON.stringify(task, null, 2)
  );
  
  return task;
}

export async function listTasks(): Promise<BrowserTask[]> {
  try {
    const content = await fs.readFile(TASKS_INDEX, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}
```

### Acceptance Criteria

| Criterion | Test Method |
|-----------|-------------|
| Can create task with description | POST /tasks with natural language |
| Tasks stored locally | Verify index.json created |
| Can list all tasks | GET /tasks returns array |
| Can update task | PUT /tasks/[id] updates task.json |
| Can delete task | DELETE removes from index |

### Testing Strategy
```bash
# Create a task
curl -X POST http://localhost:3000/api/browser-automation/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Extract LinkedIn Jobs",
    "description": "Navigate to LinkedIn jobs page and extract job listings",
    "context": { "searchQuery": "Product Manager" },
    "outputSchema": {
      "type": "object",
      "properties": {
        "jobs": { "type": "array" }
      }
    }
  }'

# List tasks
curl http://localhost:3000/api/browser-automation/tasks
```

---

## Phase 2: Task Execution Service

### Goal
Implement task execution using Anchor's `agent.task()` API with session management for long-running tasks.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/api/browser-automation/services/anchor-tasks.ts` | Create | Anchor task execution wrapper |
| `app/api/browser-automation/tasks/[taskId]/run/route.ts` | Create | Execute task endpoint |
| `app/api/browser-automation/executions/route.ts` | Create | List executions |
| `app/api/browser-automation/executions/[executionId]/route.ts` | Create | Get execution status |

### Pseudocode

#### `app/api/browser-automation/services/anchor-tasks.ts`
```typescript
import AnchorBrowser from 'anchorbrowser';

export async function executeTask(
  task: BrowserTask,
  context: Record<string, any>
): Promise<TaskExecution> {
  const client = new AnchorBrowser({
    apiKey: process.env.ANCHOR_API_KEY
  });
  
  const executionId = `exec-${nanoid(8)}`;
  
  // Create execution record
  const execution: TaskExecution = {
    id: executionId,
    taskId: task.id,
    status: 'running',
    context,
    startedAt: new Date().toISOString()
  };
  
  try {
    // Merge context with task defaults
    const fullContext = { ...task.context, ...context };
    
    // Build options
    const options: any = {
      ...task.options,
      context: fullContext
    };
    
    // Add output schema if defined
    if (task.outputSchema) {
      options.outputSchema = task.outputSchema;
    }
    
    // Use profile if specified
    if (task.options?.profileName) {
      const session = await client.sessions.create({
        browser: {
          profile: { name: task.options.profileName }
        }
      });
      options.sessionId = session.id;
    }
    
    // Execute task
    const result = await client.agent.task(
      task.description,
      options
    );
    
    execution.status = 'success';
    execution.output = result;
    execution.completedAt = new Date().toISOString();
    
  } catch (error) {
    execution.status = 'failed';
    execution.error = error.message;
    execution.completedAt = new Date().toISOString();
  }
  
  // Save execution
  await saveExecution(task.id, execution);
  
  return execution;
}

export async function executeTaskAsync(
  task: BrowserTask,
  context: Record<string, any>
): Promise<string> {
  // Create session with extended timeout for long tasks
  const client = new AnchorBrowser({
    apiKey: process.env.ANCHOR_API_KEY
  });
  
  const session = await client.sessions.create({
    session: {
      timeout: {
        max_duration: 180,  // 3 hours
        idle_timeout: 30
      }
    },
    browser: task.options?.profileName ? {
      profile: { name: task.options.profileName }
    } : undefined
  });
  
  const executionId = `exec-${nanoid(8)}`;
  
  // Start task in background
  client.agent.task(task.description, {
    ...task.options,
    sessionId: session.id,
    context: { ...task.context, ...context }
  }).then(
    result => updateExecutionStatus(executionId, 'success', result),
    error => updateExecutionStatus(executionId, 'failed', error)
  );
  
  // Return execution ID immediately
  return executionId;
}
```

### Acceptance Criteria

| Criterion | Test Method |
|-----------|-------------|
| Can execute task | POST /tasks/[id]/run returns result |
| Context merged correctly | Pass partial context, verify merge |
| Schema enforced | Structured output matches schema |
| Profile used if specified | Session uses saved profile |
| Async execution returns ID | Returns immediately with execution ID |

### Testing Strategy
```bash
# Run task synchronously
curl -X POST http://localhost:3000/api/browser-automation/tasks/[taskId]/run \
  -H "Content-Type: application/json" \
  -d '{"context": {"searchQuery": "Engineering Manager"}}'

# Check execution status
curl http://localhost:3000/api/browser-automation/executions/[executionId]
```

---

## Phase 3: Frontend UI for Tasks

### Goal
Build UI for creating and managing natural language tasks with schema builder.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/experiments/browser-automation/store/slices/tasksSlice.ts` | Create | Task state management |
| `app/(pages)/experiments/browser-automation/components/Tasks/TasksPanel.tsx` | Create | Task list sidebar |
| `app/(pages)/experiments/browser-automation/components/Tasks/CreateTaskDialog.tsx` | Create | Task creation form |
| `app/(pages)/experiments/browser-automation/components/Tasks/TaskDetail.tsx` | Create | Task view/edit/run |
| `app/(pages)/experiments/browser-automation/components/Tasks/SchemaBuilder.tsx` | Create | Visual schema builder |

### Pseudocode

#### `components/Tasks/CreateTaskDialog.tsx`
```tsx
export function CreateTaskDialog({ open, onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [context, setContext] = useState<Record<string, string>>({});
  const [outputSchema, setOutputSchema] = useState(null);
  
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create Task</DialogTitle>
      
      <TextField
        label="Task Name"
        value={name}
        onChange={e => setName(e.target.value)}
        fullWidth
      />
      
      <TextField
        label="Task Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
        multiline
        rows={4}
        helperText="Describe what the task should do in natural language"
        fullWidth
      />
      
      <ContextEditor
        value={context}
        onChange={setContext}
        label="Default Context (optional)"
      />
      
      <SchemaBuilder
        value={outputSchema}
        onChange={setOutputSchema}
        label="Output Schema (optional)"
      />
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleCreate}>Create Task</Button>
      </DialogActions>
    </Dialog>
  );
}
```

#### `components/Tasks/SchemaBuilder.tsx`
```tsx
export function SchemaBuilder({ value, onChange }) {
  const [properties, setProperties] = useState([]);
  
  const addProperty = () => {
    setProperties([
      ...properties,
      { name: '', type: 'string', description: '' }
    ]);
  };
  
  const updateProperty = (index, field, value) => {
    const updated = [...properties];
    updated[index][field] = value;
    setProperties(updated);
    
    // Build JSON Schema
    const schema = {
      type: 'object',
      properties: properties.reduce((acc, prop) => {
        acc[prop.name] = {
          type: prop.type,
          description: prop.description
        };
        return acc;
      }, {})
    };
    
    onChange(schema);
  };
  
  return (
    <div>
      <Typography>Output Schema</Typography>
      {properties.map((prop, i) => (
        <div key={i}>
          <TextField
            placeholder="Property name"
            value={prop.name}
            onChange={e => updateProperty(i, 'name', e.target.value)}
          />
          <Select
            value={prop.type}
            onChange={e => updateProperty(i, 'type', e.target.value)}
          >
            <MenuItem value="string">String</MenuItem>
            <MenuItem value="number">Number</MenuItem>
            <MenuItem value="boolean">Boolean</MenuItem>
            <MenuItem value="array">Array</MenuItem>
            <MenuItem value="object">Object</MenuItem>
          </Select>
          <TextField
            placeholder="Description"
            value={prop.description}
            onChange={e => updateProperty(i, 'description', e.target.value)}
          />
        </div>
      ))}
      <Button onClick={addProperty}>Add Property</Button>
    </div>
  );
}
```

### Acceptance Criteria

| Criterion | Test Method |
|-----------|-------------|
| Can create task with UI | Fill form, submit, verify task created |
| Schema builder works | Add properties, verify JSON Schema |
| Can run task from UI | Click run, enter context, see result |
| Execution history shown | Run multiple times, see history |
| Natural language focus | No code editor, only description field |

### Testing Strategy
- Component tests for dialog and schema builder
- E2E test task creation and execution flow
- Manual test schema builder UX

---

## Implementation Order

1. **Phase 1** (Day 1): Task storage
   - Critical path: Enable task persistence
   - Enables: Task CRUD operations

2. **Phase 2** (Day 2): Execution service
   - Critical path: Execute with agent.task()
   - Enables: Task running

3. **Phase 3** (Day 3): Frontend UI
   - Critical path: User interaction
   - Enables: Complete experience

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Natural language ambiguity | Provide task templates and examples |
| No code versioning | Store description history locally |
| Execution monitoring | Implement app-level status tracking |
| Long task timeouts | Use session with 3-hour timeout |

---

## Success Metrics

- Task creation time < 30 seconds
- Task execution success rate > 80%
- Natural language descriptions clear and effective
- Schema builder intuitive for non-developers