# Mastra Workflow Execution & Streaming

**Purpose:** Learnings from implementing direct workflow execution with real-time streaming progress in the Agipo editor.

**Last Updated:** December 12, 2025
**Implementation Branch:** `claude/workflow-creation-overhaul-01YXdubHqFHAckKTUNYaBzBP`

---

## Overview

This document captures lessons learned from implementing the "Run" feature in the workflow editor, which executes workflows directly and streams step-by-step progress to the UI in real-time.

---

## Key Mastra Streaming Concepts

### 1. Execution Methods

Mastra provides three ways to execute workflows:

| Method | Use Case | Real-time Updates |
|--------|----------|-------------------|
| `run.start()` | Simple execution, wait for result | No |
| `run.stream()` | Real-time progress events | Yes |
| `run.watch()` | Event listener pattern | Yes |

For UI progress displays, **use `run.stream()`** as it yields events as they occur:

```typescript
const run = await workflow.createRunAsync({ resourceId: userId });

for await (const event of run.stream({ inputData, runtimeContext })) {
  // Handle each event as it arrives
  console.log(event.type, event.payload);
}
```

### 2. Actual Mastra Event Types (Critical!)

The official documentation mentions `step-start`, `step-complete`, etc., but **Mastra's actual event types are different**:

| Documented Event | Actual Mastra Event | Description |
|------------------|---------------------|-------------|
| `step-start` | `workflow-step-start` | Step began executing |
| `step-complete` | `workflow-step-result` | Step completed successfully |
| `workflow-complete` | `workflow-finish` | Workflow completed |
| `step-error` | `workflow-step-error` | Step failed (unverified) |
| `workflow-error` | `workflow-error` | Workflow failed (same) |

**Always check server logs** when debugging streaming issues. The actual event structure is:

```typescript
// workflow-step-start event
{
  type: "workflow-step-start",
  payload: {
    id: "step-id-here",    // NOT event.stepId
    // ... other fields
  }
}

// workflow-step-result event
{
  type: "workflow-step-result",
  payload: {
    id: "step-id-here",    // Step ID is in payload.id
    output: { ... },       // Step output is in payload.output
    // ... other fields
  }
}

// workflow-finish event
{
  type: "workflow-finish",
  payload: {
    result: { ... },       // Final workflow result
    // ... other fields
  }
}
```

### 3. Internal/Hidden Steps

Mastra generates internal steps that users shouldn't see:

| Step Pattern | Purpose | Action |
|--------------|---------|--------|
| `mapping_*` | Data transfer between steps | Hide from UI |
| `__trigger__` | Workflow trigger point | Hide from UI |

**Filter these out** before displaying to users:

```typescript
function isInternalStep(stepId: string, stepName: string): boolean {
  if (stepId.startsWith("mapping_")) return true;
  if (stepName.startsWith("mapping_")) return true;
  if (stepId === "__trigger__" || stepName === "__trigger__") return true;
  return false;
}

const visibleSteps = stepProgress.filter(
  (step) => !isInternalStep(step.stepId, step.stepName)
);
```

---

## RuntimeContext Requirements

### Must Be a Map, Not an Object

Mastra expects `runtimeContext` to be a `Map<string, unknown>`, not a plain object:

```typescript
// WRONG - Will cause issues
const runtimeContext = {
  connections: { gmail: "conn-id" },
  userId: "user-123",
};

// CORRECT - Use Map
const runtimeContext = new Map<string, unknown>();
runtimeContext.set("connections", connectionBindings);
runtimeContext.set("userId", userId);

await run.stream({ inputData, runtimeContext });
```

### Accessing RuntimeContext in Steps

Steps access runtime context via `.get()`:

```typescript
const sendEmailStep = createStep({
  // ...
  execute: async ({ inputData, runtimeContext }) => {
    const connections = runtimeContext.get("connections") as Record<string, string>;
    const gmailConnectionId = connections["gmail"];
    // Use connection...
  },
});
```

---

## Connection Resolution Pattern

When executing workflows, connections must be resolved from the user's connected accounts:

```typescript
// 1. Get workflow metadata to find required toolkits
const metadata = await getWorkflowMetadata(workflowId);
const requiredToolkits = metadata.requiredConnections; // ["gmail", "slack"]

// 2. Get user's connected accounts from Composio
const client = new Composio({ apiKey: COMPOSIO_API_KEY });
const connections = await client.connectedAccounts.list({ userId });

// 3. Build connection bindings map
const bindings: Record<string, string> = {};
for (const toolkit of requiredToolkits) {
  const connection = connections.find(c => c.appName === toolkit && c.status === "ACTIVE");
  if (connection) {
    bindings[toolkit] = connection.id;
  }
}

// 4. Pass to runtime context
runtimeContext.set("connections", bindings);
```

### NO_AUTH Toolkits

Some toolkits don't require user authentication:

```typescript
const NO_AUTH_TOOLKIT_SLUGS = ["browser_tool"];

// Exclude from connection requirements
for (const step of workflow.steps) {
  if (step.type === "composio" && step.toolkitSlug) {
    if (!NO_AUTH_TOOLKIT_SLUGS.includes(step.toolkitSlug)) {
      requiredConnections.add(step.toolkitSlug);
    }
  }
}
```

---

## Server-Sent Events (SSE) Implementation

### Backend Route Pattern

```typescript
export async function POST(request: NextRequest) {
  // 1. Authenticate user
  const { userId } = await getAuthUser();

  // 2. Resolve connections
  const { validation, bindings } = await resolveConnections(workflowId, userId);

  // 3. Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: ExecutionStreamEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      try {
        for await (const event of executeWorkflowStream(...)) {
          sendEvent(event);
          if (event.type === "workflow-complete" || event.type === "workflow-error") {
            break;
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  // 4. Return SSE response
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
```

### Frontend SSE Consumer

```typescript
const response = await fetch(`/api/workflows/${id}/execute`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ inputData }),
  signal: abortController.signal,
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });

  // Parse SSE events from buffer
  const lines = buffer.split("\n");
  buffer = lines.pop() || ""; // Keep incomplete line in buffer

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const event = JSON.parse(line.slice(6));
      handleEvent(event);
    }
  }
}
```

---

## Workflow Step Name Resolution

Mastra steps use internal IDs. Map them to human-readable names:

```typescript
// Load step names from workflow.json
export async function loadStepNames(workflowId: string): Promise<Map<string, StepInfo>> {
  const stepMap = new Map<string, StepInfo>();
  const workflowJsonPath = path.join(WORKFLOWS_DIR, workflowId, "workflow.json");

  const content = await fs.readFile(workflowJsonPath, "utf-8");
  const workflow = JSON.parse(content);

  for (const step of workflow.steps || []) {
    stepMap.set(step.id, {
      id: step.id,
      name: step.name || step.toolId || step.id,
      toolkitSlug: step.toolkitSlug,
    });
  }

  return stepMap;
}

// Get human-readable name
export function getStepName(stepMap: Map<string, StepInfo>, stepId: string): string {
  const info = stepMap.get(stepId);
  return info?.name || stepId;
}
```

---

## Transpilation Check

Workflows must be transpiled (have `workflow.ts` file) before execution:

```typescript
export async function checkWorkflowTranspiled(workflowId: string): Promise<boolean> {
  const workflowTsPath = path.join(WORKFLOWS_DIR, workflowId, "workflow.ts");
  try {
    await fs.access(workflowTsPath);
    return true;
  } catch {
    return false;
  }
}
```

Use this to enable/disable the Run button without requiring a save in the current session.

---

## Common Pitfalls

### 1. BYPASS_AUTH Breaking Connections

If `BYPASS_AUTH=true` in `.env.local`, `getAuthUser()` returns a fake `dev-user` ID, which won't match any real Composio connections.

**Fix:** Set `BYPASS_AUTH=false` when testing execution, or implement a `DEV_USER_ID` environment variable.

### 2. Event Type Mismatch

The most common issue is checking for documented event types instead of actual ones:

```typescript
// WRONG - These don't exist
if (eventType === "step-complete") { ... }
if (eventType === "workflow-complete") { ... }

// CORRECT - Actual Mastra events
if (eventType === "workflow-step-result") { ... }
if (eventType === "workflow-finish") { ... }
```

### 3. Step ID Location

Step ID is in `payload.id`, not `event.stepId`:

```typescript
// WRONG
const stepId = event.stepId;

// CORRECT
const stepId = event.payload?.id || event.stepId || event.payload?.stepId;
```

### 4. Thenable Workflow Objects

Workflow objects from the registry have a `.then()` method (they're thenable), which can cause issues with Promise resolution. Wrap them:

```typescript
// Wrap to prevent Promise from unwrapping thenable workflow object
return Promise.resolve({ __workflow: workflow });

// Unwrap when using
const workflow = result && typeof result === "object" && "__workflow" in result
  ? (result as { __workflow: unknown }).__workflow
  : result;
```

---

## UI State Management Pattern

Track execution state in a Zustand slice:

```typescript
interface ExecutionSliceState {
  executionStatus: "idle" | "running" | "completed" | "failed";
  stepProgress: StepProgress[];
  executionStartTime: number | null;
  executionOutput: unknown | null;
  executionError: string | null;
}

interface StepProgress {
  stepId: string;
  stepName: string;
  status: "pending" | "running" | "completed" | "failed";
  output?: unknown;
  error?: string;
  durationMs?: number;
}
```

### Dynamic Step Discovery

Steps may appear from streaming that weren't in the initial list:

```typescript
updateStepProgress: (stepId, update) => {
  set((state) => {
    const existingStep = state.stepProgress.find((s) => s.stepId === stepId);

    if (existingStep) {
      return {
        stepProgress: state.stepProgress.map((step) =>
          step.stepId === stepId ? { ...step, ...update } : step
        ),
      };
    } else {
      // Add new step dynamically
      const newStep: StepProgress = {
        stepId,
        stepName: update.stepName || stepId,
        status: update.status || "pending",
        ...update,
      };
      return {
        stepProgress: [...state.stepProgress, newStep],
      };
    }
  });
},
```

---

## Debugging Tips

1. **Always log stream events** on the server:
   ```typescript
   console.log(`[execution-service] Stream event:`, JSON.stringify(event, null, 2));
   ```

2. **Log unknown event types** to discover new ones:
   ```typescript
   console.log(`[execution-service] Unhandled event type: ${eventType}`, event);
   ```

3. **Check the browser console** for SSE parsing errors

4. **Use network tab** to inspect raw SSE stream in browser DevTools

---

## Files Reference

| File | Purpose |
|------|---------|
| `app/api/workflows/[workflowId]/execute/route.ts` | SSE endpoint for execution |
| `app/api/workflows/[workflowId]/execute/services/execution-service.ts` | Workflow execution and event handling |
| `app/api/workflows/[workflowId]/execute/services/connection-resolver.ts` | Connection binding resolution |
| `app/api/workflows/[workflowId]/execute/services/step-name-resolver.ts` | Step ID to name mapping |
| `app/(pages)/workflows/editor/store/slices/executionSlice.ts` | UI state management |
| `app/(pages)/workflows/editor/hooks/useExecution.ts` | React hook for execution |
| `app/(pages)/workflows/editor/components/execution/*.tsx` | Progress UI components |

---

## Related Documentation

- [Workflow Primitives](./Workflow-Primitives.md) - Core Mastra workflow concepts
- [Mastra Suspend & Resume](https://mastra.ai/docs/workflows/suspend-and-resume) - Human-in-the-loop patterns
