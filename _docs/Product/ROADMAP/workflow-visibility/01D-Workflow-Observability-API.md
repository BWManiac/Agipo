# API Specification: Workflow Observability

**Task:** `01A-Workflow-Observability-Task.md`  
**Phases:** `01C-Workflow-Observability-Phases.md`  
**Status:** Not Started  
**Last Updated:** 2025-12-11

---

## Overview

This document specifies the API endpoints and services required for real-time workflow observability. The API provides Server-Sent Events (SSE) streaming for workflow execution events and management endpoints for workflow run tracking.

### Base URLs

```
Production: https://app.agipo.com/api
Development: http://localhost:3000/api
```

### Authentication

All endpoints require authentication via Clerk session:
- Frontend: Automatic via `@clerk/nextjs`
- Direct API: Include session token in `Authorization: Bearer <token>` header

---

## Endpoints

### 1. Workflow Stream (SSE)

Establishes a Server-Sent Events connection for real-time workflow execution events.

#### Endpoint
```
GET /api/workforce/{agentId}/chat/workflows/{runId}/stream
```

#### Parameters

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `agentId` | string | path | Yes | Agent ID that owns the workflow run |
| `runId` | string | path | Yes | Unique identifier for the workflow run |

#### Headers

```http
Accept: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

#### Response

**Status:** `200 OK` (SSE Stream)

**Headers:**
```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
Access-Control-Allow-Origin: *
```

**Event Stream Format:**
```
data: {"type": "connection", "runId": "run_123", "timestamp": "2025-12-11T10:30:00Z"}

data: {"type": "workflow-start", "runId": "run_123", "workflowName": "Job Application Workflow", "stepIds": ["step_1", "step_2", "step_3"], "timestamp": "2025-12-11T10:30:01Z"}

data: {"type": "step-start", "runId": "run_123", "stepId": "step_1", "stepName": "Extract job details", "timestamp": "2025-12-11T10:30:02Z"}

data: {"type": "step-complete", "runId": "run_123", "stepId": "step_1", "data": {"jobTitle": "Software Engineer", "company": "Acme Corp"}, "timestamp": "2025-12-11T10:30:05Z"}

data: {"type": "step-start", "runId": "run_123", "stepId": "step_2", "stepName": "Generate cover letter", "timestamp": "2025-12-11T10:30:06Z"}

data: {"type": "step-error", "runId": "run_123", "stepId": "step_2", "error": "API rate limit exceeded", "timestamp": "2025-12-11T10:30:10Z"}

data: {"type": "workflow-error", "runId": "run_123", "error": "Workflow failed at step: Generate cover letter", "timestamp": "2025-12-11T10:30:11Z"}
```

#### Event Types

| Event Type | Description | Data Fields |
|------------|-------------|-------------|
| `connection` | Connection established | `runId`, `timestamp` |
| `workflow-start` | Workflow execution began | `runId`, `workflowName`, `stepIds`, `timestamp` |
| `step-start` | Step execution began | `runId`, `stepId`, `stepName`, `timestamp` |
| `step-complete` | Step completed successfully | `runId`, `stepId`, `data` (output), `timestamp` |
| `step-error` | Step failed with error | `runId`, `stepId`, `error`, `timestamp` |
| `workflow-complete` | Workflow completed successfully | `runId`, `result`, `timestamp` |
| `workflow-error` | Workflow failed | `runId`, `error`, `timestamp` |

#### Error Responses

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Valid session required"
}
```

**403 Forbidden:**
```json
{
  "error": "Forbidden", 
  "message": "Cannot access workflow run for this agent"
}
```

**404 Not Found:**
```json
{
  "error": "Not Found",
  "message": "Workflow run not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal Server Error",
  "message": "Failed to establish stream connection"
}
```

#### Example Usage

**JavaScript (EventSource):**
```javascript
const eventSource = new EventSource('/api/workforce/agent_123/chat/workflows/run_456/stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Workflow event:', data);
  
  switch (data.type) {
    case 'step-complete':
      updateStepStatus(data.stepId, 'success', data.data);
      break;
    case 'step-error':
      updateStepStatus(data.stepId, 'failed', data.error);
      break;
    // Handle other events...
  }
};

eventSource.onerror = (error) => {
  console.error('Stream error:', error);
};
```

**Curl:**
```bash
curl -N -H "Accept: text/event-stream" \
  -H "Authorization: Bearer <session_token>" \
  "http://localhost:3000/api/workforce/agent_123/chat/workflows/run_456/stream"
```

---

### 2. Active Workflows List

Retrieves a list of currently active workflow runs for an agent.

#### Endpoint
```
GET /api/workforce/{agentId}/chat/workflows/active
```

#### Parameters

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `agentId` | string | path | Yes | Agent ID to get active workflows for |

#### Response

**Status:** `200 OK`

```json
{
  "activeRuns": [
    {
      "runId": "run_123",
      "workflowName": "Job Application Workflow",
      "status": "running",
      "startTime": "2025-12-11T10:30:00Z",
      "currentStep": "step_2",
      "totalSteps": 3
    },
    {
      "runId": "run_456", 
      "workflowName": "Email Campaign",
      "status": "running",
      "startTime": "2025-12-11T10:25:00Z",
      "currentStep": "step_1",
      "totalSteps": 5
    }
  ]
}
```

#### Error Responses

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Valid session required"
}
```

**404 Not Found:**
```json
{
  "error": "Not Found",
  "message": "Agent not found"
}
```

---

### 3. Workflow Run Details

Retrieves detailed information about a specific workflow run.

#### Endpoint
```
GET /api/workforce/{agentId}/chat/workflows/{runId}
```

#### Parameters

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `agentId` | string | path | Yes | Agent ID that owns the workflow run |
| `runId` | string | path | Yes | Unique identifier for the workflow run |

#### Response

**Status:** `200 OK`

```json
{
  "runId": "run_123",
  "workflowId": "workflow_789",
  "workflowName": "Job Application Workflow",
  "status": "running",
  "startTime": "2025-12-11T10:30:00Z",
  "endTime": null,
  "result": null,
  "error": null,
  "steps": [
    {
      "stepId": "step_1",
      "stepName": "Extract job details",
      "status": "success",
      "startTime": "2025-12-11T10:30:02Z",
      "endTime": "2025-12-11T10:30:05Z",
      "input": {
        "url": "https://linkedin.com/job/123"
      },
      "output": {
        "jobTitle": "Software Engineer",
        "company": "Acme Corp",
        "location": "San Francisco, CA"
      },
      "error": null
    },
    {
      "stepId": "step_2",
      "stepName": "Generate cover letter", 
      "status": "running",
      "startTime": "2025-12-11T10:30:06Z",
      "endTime": null,
      "input": {
        "jobDetails": {
          "jobTitle": "Software Engineer",
          "company": "Acme Corp"
        }
      },
      "output": null,
      "error": null
    },
    {
      "stepId": "step_3",
      "stepName": "Submit application",
      "status": "pending",
      "startTime": null,
      "endTime": null,
      "input": null,
      "output": null,
      "error": null
    }
  ]
}
```

#### Error Responses

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Valid session required"
}
```

**403 Forbidden:**
```json
{
  "error": "Forbidden",
  "message": "Cannot access workflow run for this agent"
}
```

**404 Not Found:**
```json
{
  "error": "Not Found", 
  "message": "Workflow run not found"
}
```

---

### 4. Stop Workflow Run

Attempts to stop a currently running workflow.

#### Endpoint
```
POST /api/workforce/{agentId}/chat/workflows/{runId}/stop
```

#### Parameters

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| `agentId` | string | path | Yes | Agent ID that owns the workflow run |
| `runId` | string | path | Yes | Unique identifier for the workflow run |

#### Request Body

```json
{
  "reason": "User requested stop"
}
```

#### Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Workflow run stopped successfully",
  "runId": "run_123",
  "stoppedAt": "2025-12-11T10:35:00Z"
}
```

#### Error Responses

**400 Bad Request:**
```json
{
  "error": "Bad Request",
  "message": "Cannot stop workflow: already completed"
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized", 
  "message": "Valid session required"
}
```

**403 Forbidden:**
```json
{
  "error": "Forbidden",
  "message": "Cannot stop workflow run for this agent"
}
```

**404 Not Found:**
```json
{
  "error": "Not Found",
  "message": "Workflow run not found"
}
```

---

## Data Models

### WorkflowRun

```typescript
interface WorkflowRun {
  runId: string;
  workflowId: string;
  workflowName: string;
  agentId: string;
  userId: string;
  status: 'running' | 'success' | 'failed' | 'stopped';
  startTime: string; // ISO 8601 timestamp
  endTime?: string; // ISO 8601 timestamp
  result?: any; // Final workflow output
  error?: string; // Error message if failed
  steps: WorkflowStep[];
}
```

### WorkflowStep

```typescript
interface WorkflowStep {
  stepId: string;
  stepName: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  startTime?: string; // ISO 8601 timestamp
  endTime?: string; // ISO 8601 timestamp
  input?: any; // Step input data
  output?: any; // Step output data
  error?: string; // Error message if step failed
}
```

### SSEEvent

```typescript
interface SSEEvent {
  type: 'connection' | 'workflow-start' | 'step-start' | 'step-complete' | 'step-error' | 'workflow-complete' | 'workflow-error';
  runId: string;
  timestamp: string; // ISO 8601 timestamp
  stepId?: string; // For step-specific events
  stepName?: string; // Human-readable step name
  workflowName?: string; // For workflow-start events
  stepIds?: string[]; // For workflow-start events
  data?: any; // Event payload (step output, workflow result, etc.)
  error?: string; // Error message for error events
}
```

---

## Implementation Notes

### Security

- All endpoints require valid Clerk session authentication
- Users can only access workflow runs for agents they own
- SSE connections are automatically closed if session expires
- No sensitive data should be included in workflow outputs visible to frontend

### Rate Limiting

- SSE connections: Max 10 concurrent connections per user
- API endpoints: Standard rate limiting (100 req/min per user)
- Workflow execution: Limited by Mastra's internal rate limiting

### Error Handling

- SSE connections should implement automatic reconnection with exponential backoff
- Failed SSE events should not crash the stream - log error and continue
- API errors should include correlation IDs for debugging
- Partial workflow failures should still provide step-level details

### Performance

- SSE events should be throttled to prevent UI flooding (max 10 events/second)
- Large step outputs (>1MB) should be truncated with "view full" option
- Inactive SSE connections should timeout after 30 minutes
- Workflow run data should be cleaned up after 24 hours

### Browser Compatibility

- SSE supported in all modern browsers (IE10+)
- Fallback polling mechanism not required (acceptable limitation)
- CORS headers configured for cross-origin requests if needed

---

## Testing

### Unit Tests

```typescript
describe('Workflow Observability API', () => {
  describe('GET /api/workforce/{agentId}/chat/workflows/{runId}/stream', () => {
    it('should establish SSE connection with valid session', async () => {
      // Test SSE connection establishment
    });
    
    it('should emit workflow events in real-time', async () => {
      // Test event streaming
    });
    
    it('should reject unauthorized requests', async () => {
      // Test authentication
    });
  });
  
  describe('GET /api/workforce/{agentId}/chat/workflows/active', () => {
    it('should return list of active workflows', async () => {
      // Test active workflows endpoint
    });
  });
  
  describe('GET /api/workforce/{agentId}/chat/workflows/{runId}', () => {
    it('should return workflow run details', async () => {
      // Test workflow details endpoint
    });
  });
});
```

### Integration Tests

```typescript
describe('End-to-end Workflow Observability', () => {
  it('should stream complete workflow execution', async () => {
    // 1. Start workflow
    // 2. Connect to SSE stream
    // 3. Verify all events received in order
    // 4. Verify final state matches API query
  });
  
  it('should handle workflow failures gracefully', async () => {
    // 1. Start failing workflow
    // 2. Verify error events in stream
    // 3. Verify error state in API
  });
});
```

### Manual Testing

#### SSE Connection Test
```bash
# Test SSE connection
curl -N -H "Accept: text/event-stream" \
  -H "Authorization: Bearer <session_token>" \
  "http://localhost:3000/api/workforce/agent_123/chat/workflows/run_456/stream"
```

#### API Endpoints Test
```bash
# Get active workflows
curl -H "Authorization: Bearer <session_token>" \
  "http://localhost:3000/api/workforce/agent_123/chat/workflows/active"

# Get workflow details  
curl -H "Authorization: Bearer <session_token>" \
  "http://localhost:3000/api/workforce/agent_123/chat/workflows/run_456"

# Stop workflow
curl -X POST \
  -H "Authorization: Bearer <session_token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "User requested stop"}' \
  "http://localhost:3000/api/workforce/agent_123/chat/workflows/run_456/stop"
```

---

## Future API Enhancements

1. **Workflow History API**: Endpoint to retrieve completed workflow runs
2. **Workflow Metrics API**: Performance analytics and timing data
3. **Workflow Templates API**: Save and reuse workflow execution patterns
4. **Bulk Operations API**: Start/stop multiple workflows simultaneously
5. **Webhook Notifications**: Alternative to SSE for external integrations
6. **GraphQL Subscriptions**: Alternative real-time API using GraphQL subscriptions