# Chat / Agent Task Endpoint

> Execute natural language browser tasks with real-time progress streaming.

**Endpoint:** `POST /api/browser-automation/sessions/[sessionId]/chat`
**Auth:** None (internal API)

---

## Purpose

This endpoint enables users to control a browser session using natural language commands. The AI agent interprets the command, breaks it into steps, and executes browser actions (navigate, click, type, extract data). Progress is streamed in real-time via Server-Sent Events (SSE).

**Product Value:** Enables non-technical users to automate browser tasks by describing what they want in plain English.

---

## Approach

The route creates an SSE stream and delegates to the `anchor-agent` service which wraps Anchor's `agent.task()` API. As the agent executes steps, callbacks emit events to the stream. The client receives real-time updates about what the agent is doing.

---

## POST - Execute Task

Executes a natural language task and streams progress via SSE.

### Pseudocode

```
POST(request, { params }): Response (SSE stream)
├── Extract sessionId from params
├── Parse and validate request body
├── Create SSE TransformStream
├── Send "working" message acknowledgment
├── **Call `executeAgentTask()`** with step callback
│   ├── On step start: Emit "step_start" event
│   ├── On step complete: Emit "step_complete" event
│   └── On step error: Emit "step_error" event
├── On success: Emit "result" event with data
├── On failure: Emit "error" event
├── Emit "done" event
└── Return SSE Response
```

### Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | Natural language command to execute |

**Example Request:**
```json
{
  "message": "Navigate to linkedin.com and search for 'software engineer'"
}
```

### Output (SSE Events)

Events are streamed as Server-Sent Events with the format:
```
event: <event_type>
data: <json_payload>
```

| Event | Payload | Description |
|-------|---------|-------------|
| `message` | `{ type: "working", content: string }` | Initial acknowledgment |
| `step_start` | `AgentStep` | Agent started a new action |
| `step_complete` | `AgentStep` | Agent completed an action |
| `step_error` | `AgentStep` | Agent encountered an error on a step |
| `result` | `{ success: true, data: any }` | Task completed successfully |
| `error` | `{ message: string }` | Task failed with error |
| `done` | `{}` | Stream complete, connection will close |

**AgentStep Structure:**
```typescript
{
  id: string;          // Unique step ID
  type: string;        // Action type (e.g., "navigate", "click")
  description: string; // Human-readable description
  status: "running" | "success" | "error";
  timestamp: string;   // ISO timestamp
  duration?: number;   // Execution time in ms
  error?: string;      // Error message if failed
}
```

**Example SSE Stream:**
```
event: message
data: {"type":"working","content":"Working on: \"Navigate to linkedin.com\""}

event: step_start
data: {"id":"step_1","type":"navigate","description":"Navigating to linkedin.com","status":"running","timestamp":"..."}

event: step_complete
data: {"id":"step_1","type":"navigate","description":"Navigated to linkedin.com","status":"success","timestamp":"...","duration":1250}

event: result
data: {"success":true,"data":null}

event: done
data: {}
```

---

## Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| `runtime` | `"nodejs"` | Required for SSE streaming |
| `maxDuration` | `120` | Max execution time in seconds |
| Task timeout | `90000` | Agent task timeout in ms |

---

## Error Responses

| Status | Condition |
|--------|-----------|
| 400 | Invalid JSON or missing message |

Note: Session validation is skipped because Anchor's status API can return errors for valid sessions. Invalid sessions will fail gracefully during task execution.

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| ChatPanel | `components/ChatPanel` | Sends commands, displays progress |
| chatSlice | `store/slices/chatSlice.ts` | Manages chat state |

---

## Notes

- SSE connection remains open until task completes or times out
- Multiple steps may execute for complex commands
- The agent uses Anchor's built-in browser control capabilities
- Structured output can be requested via `outputSchema` (not exposed in route currently)

---

## Related Docs

- [anchor-agent Service](./services/anchor-agent.README.md) - Agent task execution
- [Session Instance](../README.md) - Session operations
- [Anchor Browser Agent API](https://docs.anchorbrowser.io)
