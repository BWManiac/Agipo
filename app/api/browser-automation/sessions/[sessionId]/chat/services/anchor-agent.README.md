# Anchor Agent Service

> Wrapper for Anchor Browser's AI agent task execution with step callbacks.

**Service:** `anchor-agent.ts`
**Domain:** Browser Automation (co-located with chat route)

---

## Purpose

This service provides an interface to Anchor Browser's built-in AI agent which can execute natural language browser tasks. It wraps the `agent.task()` API and provides step-by-step callbacks for real-time progress reporting.

**Product Value:** Enables users to control browser sessions using plain English commands, with visibility into each action the agent takes.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `executeAgentTask()` | Executes a natural language browser task with optional step callbacks and output schema. | When user sends a chat command to control the browser. |

---

## Approach

The service creates a task request to Anchor's agent API with:
- The natural language command
- Session ID to target
- Step callback for progress reporting
- Optional output schema for structured results

The agent autonomously breaks down the command into browser actions (navigate, click, type, etc.) and executes them sequentially, reporting progress via callbacks.

---

## Public API

### `executeAgentTask(sessionId: string, task: string, options?: TaskOptions): Promise<TaskResult>`

**What it does:** Executes a natural language task on a browser session. The agent interprets the command, breaks it into steps, and performs browser actions.

**Product Impact:** Enables non-technical users to automate complex browser workflows by describing what they want in plain English.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | Yes | Target browser session ID |
| `task` | string | Yes | Natural language command (e.g., "Search for Python tutorials") |
| `options.onStep` | function | No | Callback invoked for each agent step |
| `options.outputSchema` | ZodSchema | No | Schema for structured output extraction |
| `options.timeout` | number | No | Task timeout in ms (default: 60000) |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether task completed successfully |
| `result` | unknown | Task result data (or null on failure) |
| `error` | string | Error message if task failed |

**Process:**

```
executeAgentTask(sessionId, task, options): TaskResult
├── Build task options with timeout
├── **If onStep provided**: Configure step callback
│   └── Normalize step data to AgentStep format
├── **If outputSchema provided**: Convert Zod to JSON Schema
├── **Call `client.agent.task()`** with sessionId and options
├── Extract result data from response
└── Return { success, result } or { success: false, error }
```

---

## Types

### AgentStep

Represents a single step in the agent's execution:

```typescript
{
  id: string;           // Unique step identifier
  type: string;         // Action type (e.g., "navigate", "click", "type")
  description: string;  // Human-readable step description
  status: "running" | "success" | "error";
  timestamp: string;    // ISO timestamp
  duration?: number;    // Execution time in ms
  error?: string;       // Error message if step failed
}
```

### TaskOptions

```typescript
{
  onStep?: (step: AgentStep) => void | Promise<void>;
  outputSchema?: z.ZodSchema;
  timeout?: number;  // Default: 60000ms
}
```

### TaskResult

```typescript
{
  success: boolean;
  result: unknown;   // Extracted data or task output
  error?: string;    // Present if success is false
}
```

---

## Usage Example

```typescript
import { executeAgentTask } from "./services/anchor-agent";

const result = await executeAgentTask(
  "sess_abc123",
  "Navigate to linkedin.com and search for 'software engineer'",
  {
    onStep: (step) => {
      console.log(`${step.status}: ${step.description}`);
    },
    timeout: 90000,
  }
);

if (result.success) {
  console.log("Task completed:", result.result);
} else {
  console.error("Task failed:", result.error);
}
```

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `anchorbrowser` | Official Anchor Browser SDK |
| `zod` | Schema definition for structured output |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Chat Route | `../route.ts` | Executes user commands with SSE streaming |

---

## Design Decisions

### Why co-locate with chat route?

**Decision:** Place this service under `chat/services/` instead of domain-level `services/`.

**Rationale:** Per domain principles, services should be co-located with their single consumer. This service is only used by the chat route, so it lives alongside it for discoverability and maintainability.

### Why include Zod to JSON Schema converter?

**Decision:** Include a basic zodToJsonSchema function for structured output.

**Rationale:** Anchor's agent API accepts JSON Schema for structured output extraction. Since we use Zod throughout the app, a converter lets us define output schemas in Zod. Note: For production, consider using the `zod-to-json-schema` package for complete coverage.

---

## Configuration

| Environment Variable | Description |
|---------------------|-------------|
| `ANCHOR_API_KEY` | API key for Anchor Browser service (required) |

---

## Notes

- The agent runs with `maxSteps: 40` to handle complex multi-step tasks
- Step callbacks are async-safe (can return promises)
- Errors are caught and returned in result, not thrown
- The Zod to JSON Schema converter is basic - complex schemas may need the full library

---

## Related Docs

- [Chat Route](../README.md) - SSE endpoint that uses this service
- [Anchor Browser Agent API](https://docs.anchorbrowser.io)
