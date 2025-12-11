# Tasks API - API Specification

**Feature:** Anchor Browser Tasks API  
**Based On:** Research showing Anchor uses natural language tasks, not code upload

---

## API Endpoints Overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/browser-automation/tasks` | List all tasks |
| POST | `/api/browser-automation/tasks` | Create new task |
| GET | `/api/browser-automation/tasks/[taskId]` | Get task details |
| PUT | `/api/browser-automation/tasks/[taskId]` | Update task |
| DELETE | `/api/browser-automation/tasks/[taskId]` | Delete task |
| POST | `/api/browser-automation/tasks/[taskId]/run` | Execute task |
| GET | `/api/browser-automation/executions` | List executions |
| GET | `/api/browser-automation/executions/[executionId]` | Get execution status |

---

## 1. Create Task

### Request
```http
POST /api/browser-automation/tasks
Content-Type: application/json

{
  "name": "Extract LinkedIn Jobs",
  "description": "Navigate to LinkedIn jobs page and extract job listings for the given search query",
  "context": {
    "searchQuery": "Product Manager",
    "location": "San Francisco"
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "jobs": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "title": { "type": "string" },
            "company": { "type": "string" },
            "location": { "type": "string" }
          }
        }
      }
    }
  },
  "options": {
    "maxSteps": 40,
    "agent": "browser-use",
    "profileName": "linkedin-profile"
  }
}
```

### Response
```json
{
  "success": true,
  "task": {
    "id": "task-abc12345",
    "name": "Extract LinkedIn Jobs",
    "description": "Navigate to LinkedIn jobs page...",
    "status": "draft",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

## 2. Execute Task

### Request
```http
POST /api/browser-automation/tasks/[taskId]/run
Content-Type: application/json

{
  "context": {
    "searchQuery": "Engineering Manager",
    "maxResults": 10
  },
  "async": false
}
```

### Response (Synchronous)
```json
{
  "success": true,
  "execution": {
    "id": "exec-xyz78910",
    "taskId": "task-abc12345",
    "status": "success",
    "output": {
      "jobs": [
        {
          "title": "Senior Engineering Manager",
          "company": "Tech Corp",
          "location": "San Francisco, CA"
        }
      ]
    },
    "startedAt": "2024-01-15T10:05:00Z",
    "completedAt": "2024-01-15T10:05:45Z"
  }
}
```

### Response (Asynchronous)
```json
{
  "success": true,
  "executionId": "exec-xyz78910",
  "message": "Task started in background"
}
```

---

## 3. Get Execution Status

### Request
```http
GET /api/browser-automation/executions/[executionId]
```

### Response
```json
{
  "success": true,
  "execution": {
    "id": "exec-xyz78910",
    "taskId": "task-abc12345",
    "status": "running",
    "context": {
      "searchQuery": "Engineering Manager"
    },
    "startedAt": "2024-01-15T10:05:00Z",
    "progress": "Navigating to LinkedIn..."
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Task description is required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Task not found",
  "taskId": "task-invalid"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Anchor API error: Session timeout"
}
```

---

## Data Types

### BrowserTask
```typescript
{
  id: string;
  name: string;
  description: string;
  context?: Record<string, any>;
  outputSchema?: JSONSchema;
  options?: {
    maxSteps?: number;
    agent?: string;
    provider?: string;
    model?: string;
    profileName?: string;
  };
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
}
```

### TaskExecution
```typescript
{
  id: string;
  taskId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  context: Record<string, any>;
  output?: any;
  error?: string;
  startedAt: string;
  completedAt?: string;
}
```

---

## Implementation Notes

1. **Natural Language Focus**: Tasks use descriptions, not code
2. **Context Merging**: Execution context merges with task defaults
3. **Schema Validation**: Output schemas use JSON Schema format
4. **Profile Integration**: Tasks can use saved browser profiles
5. **Async Execution**: Long tasks use sessions with 3-hour timeout