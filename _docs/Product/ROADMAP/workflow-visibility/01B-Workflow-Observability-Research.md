# Task 01.1: Workflow Observability — Research Log

**Status:** In Progress  
**Date:** December 2024  
**Parent Task:** `_docs/Product/ROADMAP/workflow-visibility/01-Workflow-Observability.md`

---

## How to Use This Document

This is a **research log** for discovering facts about Mastra's workflow streaming API.

**Each research question has:**
1. **The Question** — What we need to find out
2. **Why It Matters** — Which product requirement this unlocks
3. **Answer** — What we discovered (to be filled)
4. **Primitive** — The exact function/method we'll use
5. **Source** — Where we found the answer

**Philosophy:** Mastra's workflow streaming API is immutable. We discover what they provide and adapt our implementation.

**Status Key:** ❓ Not Researched | 🔍 In Progress | ✅ Answered | ⚠️ Blocked

---

## Quick Reference

| Question | Unlocks Requirement | Status |
|----------|---------------------|--------|
| [RQ-1: Streaming API usage](#rq-1-streaming-api-usage) | Use run.stream() instead of run.start() | ❓ |
| [RQ-2: Stream event types](#rq-2-stream-event-types) | Real-time workflow observability | ❓ |
| [RQ-3: Tool compatibility](#rq-3-tool-compatibility) | Maintain tool wrapper compatibility | ❓ |
| [RQ-4: Stream error handling](#rq-4-stream-error-handling) | Handle streaming failures | ❓ |

---

## Part 1: Mastra Workflow Streaming API Research

### RQ-1: Streaming API Usage

**Why It Matters:** PR-1.1 (Refactor to Streaming) — Need to understand how to use `run.stream()` instead of `run.start()`.

**Status:** ✅ Answered

**Question:**
1. What's the exact API for `run.stream()`?
2. What does it return (result object, stream, both)?
3. How do we access the event stream (`result.fullStream`)?
4. How do we get the final result while also streaming events?

**Answer:**
```typescript
// Create workflow run and stream execution
const run = await workflow.createRunAsync();
// or synchronous: const run = workflow.createRun();

const result = await run.stream({ 
  inputData: { message: "Hello world" } 
});

// Result object contains multiple properties:
{
  stream: ReadableStream<WorkflowEvent>,  // Event stream
  text: Promise<string>,                  // Final text output
  result: Promise<WorkflowResult>,        // Final result
  status: Promise<RunStatus>,             // Execution status
  usage: Promise<TokenUsage>              // Token usage stats
}

// Iterate over stream events
for await (const event of result.stream) {
  console.log(event);
  // Handle each event type
}

// Get final result while streaming
const finalResult = await result.result;
const finalText = await result.text;
const status = await result.status;

// Alternative: pipe text stream to writer
export const testStep = createStep({
  execute: async ({ inputData, mastra, writer }) => {
    const agent = mastra?.getAgent("testAgent");
    const stream = await agent?.stream(`Process ${inputData}`);
    await stream!.textStream.pipeTo(writer);
    return { value: await stream!.text };
  }
});
```

**Primitive Discovered:**
- Function/Method: `run.stream()`
- Signature: `stream({ inputData, initialState?, validateInputs? })`
- Return type: Object with `stream`, `text`, `result`, `status`, `usage` properties

**Implementation Note:** 
- Returns multiple async properties for different use cases
- Can iterate stream while also awaiting final result
- Compatible with both streaming and non-streaming consumers

**Source:** 
- https://mastra.ai/docs/streaming/workflow-streaming
- https://mastra.ai/reference/streaming/workflows/stream

---

### RQ-2: Stream Event Types

**Why It Matters:** PR-1.2 (Real-Time Updates) — Need to understand what events are emitted for step-by-step progress.

**Status:** ✅ Answered

**Question:**
1. What event types are emitted by `run.stream()`?
2. What's the structure of `step-start`, `step-complete`, `step-error` events?
3. What information is available in each event (stepId, output, error)?
4. How do we iterate over the stream (`for await`)?

**Answer:**
```typescript
// Event types from workflow streaming
type WorkflowEventType = 
  | 'start'           // Workflow run starts
  | 'step-start'      // Step begins execution
  | 'text-delta'      // Incremental text from LLM steps
  | 'tool-call'       // Tool invocation
  | 'tool-result'     // Tool execution result
  | 'step-finish'     // Step completes
  | 'finish';         // Workflow completes

// Event structure examples
{
  type: 'workflow-start',
  runId: '221333ed-d9ee-4737-922b-4ab4d9de73e6',
  from: 'WORKFLOW',
  payload: {
    workflowId: 'my-workflow',
    startedAt: 1755269732792
  }
}

{
  type: 'workflow-step-start',
  runId: '221333ed-d9ee-4737-922b-4ab4d9de73e6',
  from: 'WORKFLOW',
  payload: {
    stepName: 'step-1',
    args: { value: 'initial data' },
    stepCallId: '9e8c5217-490b-4fe7-8c31-6e2353a3fc98',
    startedAt: 1755269732792,
    status: 'running'
  }
}

{
  type: 'workflow-step-finish',
  runId: '221333ed-d9ee-4737-922b-4ab4d9de73e6',
  from: 'WORKFLOW',
  payload: {
    stepName: 'step-1',
    output: { result: 'processed' },
    stepCallId: '9e8c5217-490b-4fe7-8c31-6e2353a3fc98',
    finishedAt: 1755269735123,
    status: 'completed'
  }
}

// Iteration pattern
for await (const event of result.stream) {
  switch(event.type) {
    case 'workflow-step-start':
      console.log(`Starting ${event.payload.stepName}`);
      break;
    case 'workflow-step-finish':
      console.log(`Completed ${event.payload.stepName}`);
      break;
    case 'text-delta':
      process.stdout.write(event.payload.textDelta);
      break;
  }
}
```

**Primitive Discovered:**
- Event types: 7+ event types for workflow lifecycle
- Event structure: `{ type, runId, from, payload }` format
- Iteration pattern: `for await (const event of stream)`
- Information: stepName, stepCallId, args, output, status, timing

**Implementation Note:** 
- Events have runId at top level for tracking
- Each event has rich payload with step details
- Text-delta events enable real-time streaming output

**Source:** 
- https://mastra.ai/docs/streaming/events
- https://mastra.ai/docs/streaming/workflow-streaming** 

---

### RQ-3: Tool Compatibility

**Why It Matters:** PR-1.3 (Backward Compatibility) — Need to maintain compatibility with tool wrapper that expects final result.

**Status:** ✅ Answered

**Question:**
1. Can we use `run.stream()` and still return a final result to the agent?
2. How do we get the final result from the stream?
3. Does the tool wrapper need to become async, or can we wait for completion?
4. What's the pattern for streaming while maintaining tool compatibility?

**Answer:**
```typescript
// Pattern for backward compatibility with tools
export async function executeWorkflowTool(
  workflowId: string,
  inputData: any
) {
  const workflow = await loadWorkflow(workflowId);
  const run = workflow.createRun();
  
  // Use stream() but maintain compatibility
  const streamResult = await run.stream({ inputData });
  
  // Option 1: Stream to SSE while returning final result
  // Send events to SSE connection if available
  if (sseConnection) {
    (async () => {
      for await (const event of streamResult.stream) {
        sseConnection.send(event);
      }
    })();  // Don't await - let it stream in background
  }
  
  // Return final result for tool compatibility
  const finalResult = await streamResult.result;
  return finalResult;  // Tool gets final result as before
}

// Option 2: Collect events and return both
export async function executeWithObservability(
  workflowId: string,
  inputData: any
) {
  const workflow = await loadWorkflow(workflowId);
  const run = workflow.createRun();
  const streamResult = await run.stream({ inputData });
  
  // Collect events for debugging/observability
  const events = [];
  for await (const event of streamResult.stream) {
    events.push(event);
    // Could also emit to SSE here
  }
  
  // Return both events and result
  return {
    result: await streamResult.result,
    events,  // For observability
    status: await streamResult.status
  };
}
```

**Primitive Discovered:**
- Pattern: Stream in background, await final result
- Compatibility: `await streamResult.result` provides backward compatibility
- Tool wrapper: Remains async, waits for final result
- Dual mode: Can stream events while returning result

**Implementation Note:** 
- Tool wrapper doesn't need changes - still returns final result
- Streaming happens in parallel without blocking result
- SSE connection optional - degrades gracefully

**Source:** 
- https://mastra.ai/docs/streaming/workflow-streaming
- https://mastra.ai/reference/streaming/workflows/stream** 

---

### RQ-4: Stream Error Handling

**Why It Matters:** PR-1.4 (Error Handling) — Need to understand how errors are emitted in the stream.

**Status:** ✅ Answered

**Question:**
1. How are workflow errors emitted in the stream?
2. What's the structure of error events?
3. Does the stream close on error, or continue?
4. How do we handle network issues during streaming?

**Answer:**
```typescript
// Error handling in workflow streaming
try {
  const result = await run.stream({ inputData });
  
  for await (const event of result.stream) {
    // Error events in the stream
    if (event.type === 'step-error' || event.type === 'error') {
      console.error('Step failed:', event.payload);
      // Structure:
      // {
      //   type: 'step-error',
      //   runId: '...',
      //   from: 'WORKFLOW',
      //   payload: {
      //     stepName: 'failing-step',
      //     error: {
      //       message: 'Error message',
      //       stack: 'Error stack trace'
      //     },
      //     stepCallId: '...'
      //   }
      // }
    }
  }
  
  // Check final status
  const status = await result.status;
  if (status === 'failed') {
    // Workflow failed
    const finalResult = await result.result;
    console.error('Workflow failed:', finalResult.error);
  }
  
} catch (streamError) {
  // Network or stream initialization errors
  console.error('Stream failed:', streamError);
}

// Resume interrupted streams
if (streamInterrupted) {
  // Mastra supports stream resumption
  const newStream = await run.resumeStreamVNext();
  for await (const chunk of newStream) {
    console.log(chunk);
  }
}

// Validation errors prevent streaming
if (validateInputs && !inputSchema.safeParse(inputData).success) {
  // Workflow won't start - throws immediately
  // No stream created
}
```

**Primitive Discovered:**
- Error events: `step-error` events with error details in payload
- Error handling: Stream continues after step errors, check final status
- Stream resumption: `resumeStreamVNext()` for interrupted streams
- Validation errors: Prevent stream creation if inputs invalid

**Implementation Note:** 
- Step errors don't close stream - workflow may recover
- Network issues can be recovered via stream resumption
- Always check final status for overall success/failure

**Source:** 
- https://mastra.ai/docs/streaming/events
- https://mastra.ai/docs/streaming/workflow-streaming (resumable streams)** 

---

## Summary

### Primitives We'll Use

| What | Primitive | From | Confirmed? |
|------|-----------|------|------------|
| Stream workflow | `run.stream({ inputData })` | Mastra | ✅ |
| Iterate events | `for await (const event of result.stream)` | Mastra | ✅ |
| Get final result | `await result.result` | Mastra | ✅ |
| Handle errors | Check event.type and result.status | Mastra | ✅ |
| Resume stream | `run.resumeStreamVNext()` | Mastra | ✅ |

### Blockers & Dead Ends

| Issue | Impact | Resolution |
|-------|--------|------------|
| None identified | - | All APIs available |

### Key Learnings

1. **Dual-mode compatibility** - Can stream events while still returning final result for tool compatibility
2. **Rich event structure** - Events include runId, stepName, timing, and detailed payloads
3. **Resilient streaming** - Supports stream resumption and graceful error handling 

---

## Exit Criteria

- [x] All RQ questions answered
- [x] Summary table complete
- [x] No unresolved blockers
- [x] Key learnings documented

**Next Step:** Implementation Plan - Ready to implement workflow observability with streaming

---

## Resources Used

- [Mastra Workflows Overview](https://mastra.ai/docs/workflows/overview)
- [Mastra Workflow Streaming](https://mastra.ai/docs/workflows/overview#streaming)
- Existing code: `app/api/tools/services/workflow-tools.ts`




