# API Specification: Browser Automation Tasks

## Overview
This document specifies the API endpoints for Anchor Browser Tasks functionality.

---

## 1. List Tasks

### Endpoint
```
GET /api/browser-automation/tasks
```

### Description
Returns all browser automation tasks for the authenticated user.

### Response
```json
{
  "tasks": [
    {
      "id": "task-abc12345",
      "anchorTaskId": "anchor-xyz789",
      "name": "extract-linkedin-jobs",
      "description": "Extract job postings from LinkedIn",
      "status": "deployed",
      "version": "1.0.0",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T14:20:00Z",
      "lastRunAt": "2024-01-15T16:00:00Z",
      "inputs": [
        {
          "name": "ANCHOR_SEARCH_QUERY",
          "description": "Job search query",
          "type": "string",
          "required": true
        }
      ]
    }
  ]
}
```

---

## 2. Create Task

### Endpoint
```
POST /api/browser-automation/tasks
```

### Description
Creates a new browser automation task.

### Request Body
```json
{
  "name": "extract-linkedin-jobs",
  "description": "Extract job postings from LinkedIn search results",
  "code": "import AnchorClient from 'anchorbrowser';\n\nexport default async function() { ... }",
  "inputs": [
    {
      "name": "ANCHOR_SEARCH_QUERY",
      "description": "Job search query",
      "type": "string",
      "required": true,
      "defaultValue": ""
    },
    {
      "name": "ANCHOR_MAX_RESULTS",
      "description": "Maximum number of results",
      "type": "number",
      "required": false,
      "defaultValue": "20"
    }
  ]
}
```

### Validation Rules
- `name`: Required, 1-100 characters, alphanumeric with dashes
- `description`: Optional, max 500 characters
- `code`: Required, max 100KB, valid TypeScript
- `inputs`: Array of input definitions
  - `name`: Must start with "ANCHOR_"
  - `type`: Must be "string", "number", or "boolean"

### Response
```json
{
  "task": {
    "id": "task-abc12345",
    "anchorTaskId": "anchor-xyz789",
    "name": "extract-linkedin-jobs",
    "status": "draft",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 3. Get Task

### Endpoint
```
GET /api/browser-automation/tasks/[taskId]
```

### Description
Returns detailed information about a specific task including execution history.

### Response
```json
{
  "task": {
    "id": "task-abc12345",
    "anchorTaskId": "anchor-xyz789",
    "name": "extract-linkedin-jobs",
    "description": "Extract job postings from LinkedIn",
    "code": "import AnchorClient from 'anchorbrowser';\n\nexport default async function() { ... }",
    "status": "deployed",
    "version": "1.0.0",
    "inputs": [...],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T14:20:00Z"
  },
  "executions": [
    {
      "id": "exec-123",
      "status": "success",
      "startedAt": "2024-01-15T16:00:00Z",
      "completedAt": "2024-01-15T16:02:30Z",
      "duration": 150000
    }
  ]
}
```

---

## 4. Update Task

### Endpoint
```
PUT /api/browser-automation/tasks/[taskId]
```

### Description
Updates a task's code or metadata. Updating code resets status to "draft".

### Request Body
```json
{
  "name": "Updated Task Name",
  "description": "Updated description",
  "code": "// Updated code",
  "inputs": [...]
}
```

### Response
```json
{
  "task": {
    "id": "task-abc12345",
    "status": "draft",
    "updatedAt": "2024-01-15T17:00:00Z"
  }
}
```

---

## 5. Delete Task

### Endpoint
```
DELETE /api/browser-automation/tasks/[taskId]
```

### Description
Deletes a task and its associated data.

### Response
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

## 6. Deploy Task

### Endpoint
```
POST /api/browser-automation/tasks/[taskId]/deploy
```

### Description
Deploys a task to production, creating a versioned release.

### Response
```json
{
  "task": {
    "id": "task-abc12345",
    "status": "deployed",
    "version": "1.0.1"
  },
  "message": "Task deployed successfully"
}
```

---

## 7. Run Task (Synchronous)

### Endpoint
```
POST /api/browser-automation/tasks/[taskId]/run
```

### Description
Executes a task synchronously and waits for completion.

### Request Body
```json
{
  "inputs": {
    "ANCHOR_SEARCH_QUERY": "Product Manager",
    "ANCHOR_MAX_RESULTS": "10"
  }
}
```

### Response
```json
{
  "execution": {
    "id": "exec-123",
    "taskId": "task-abc12345",
    "status": "success",
    "startedAt": "2024-01-15T16:00:00Z",
    "completedAt": "2024-01-15T16:02:30Z",
    "duration": 150000
  },
  "output": {
    "success": true,
    "jobs": [
      {
        "title": "Senior Product Manager",
        "company": "Tech Corp",
        "location": "San Francisco, CA"
      }
    ]
  }
}
```

---

## 8. Run Task (Asynchronous)

### Endpoint
```
POST /api/browser-automation/tasks/[taskId]/run-async
```

### Description
Starts a task execution in the background (up to 3 hours).

### Request Body
```json
{
  "inputs": {
    "ANCHOR_SEARCH_QUERY": "Engineering Manager",
    "ANCHOR_MAX_RESULTS": "50"
  }
}
```

### Response
```json
{
  "executionId": "exec-456",
  "message": "Task started in background"
}
```

---

## 9. Get Execution Status

### Endpoint
```
GET /api/browser-automation/executions/[executionId]
```

### Description
Returns the current status and result of a task execution.

### Response
```json
{
  "execution": {
    "id": "exec-456",
    "taskId": "task-abc12345",
    "taskVersion": "1.0.0",
    "status": "running",
    "inputs": {
      "ANCHOR_SEARCH_QUERY": "Engineering Manager"
    },
    "startedAt": "2024-01-15T16:00:00Z",
    "output": null,
    "error": null
  }
}
```

### Status Values
- `pending`: Execution queued
- `running`: Currently executing
- `success`: Completed successfully
- `failed`: Execution failed with error
- `cancelled`: Execution cancelled by user

---

## 10. List Executions

### Endpoint
```
GET /api/browser-automation/executions?taskId=[taskId]
```

### Description
Returns execution history for a specific task or all tasks.

### Query Parameters
- `taskId`: Optional, filter by task ID
- `limit`: Optional, max results (default 50)
- `offset`: Optional, pagination offset

### Response
```json
{
  "executions": [
    {
      "id": "exec-123",
      "taskId": "task-abc12345",
      "taskName": "extract-linkedin-jobs",
      "status": "success",
      "startedAt": "2024-01-15T16:00:00Z",
      "completedAt": "2024-01-15T16:02:30Z",
      "duration": 150000
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "inputs.0.name": "Input name must start with ANCHOR_",
    "code": "Code exceeds 100KB limit"
  }
}
```

### 404 Not Found
```json
{
  "error": "Task not found",
  "taskId": "task-abc12345"
}
```

### 500 Internal Server Error
```json
{
  "error": "Task execution failed",
  "message": "Browser automation error: Page timeout",
  "executionId": "exec-789"
}
```

---

## Implementation Notes

1. **Authentication**: All endpoints require authenticated user via Clerk
2. **Storage**: Tasks stored in `_tables/browser-tasks/`
3. **Code Transport**: TypeScript code base64 encoded for Anchor API
4. **Input Validation**: All inputs must have ANCHOR_ prefix
5. **Execution Limit**: Keep last 50 executions per task
6. **Polling**: Frontend polls every 2 seconds for async execution status
7. **Timeout**: Async executions timeout after 3 hours (Anchor limit)
8. **Rate Limiting**: 1 second delay between task operations to avoid Anchor limits