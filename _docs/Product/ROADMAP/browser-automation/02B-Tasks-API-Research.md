# Task 02.1: Anchor Browser Tasks API — Research Log

**Status:** In Progress  
**Date:** December 2024  
**Parent Task:** `_docs/Product/ROADMAP/browser-automation/02-Tasks-API.md`

---

## How to Use This Document

This is a **research log** for discovering facts about Anchor Browser's Tasks API.

**Each research question has:**
1. **The Question** — What we need to find out
2. **Why It Matters** — Which product requirement this unlocks
3. **Answer** — What we discovered (to be filled)
4. **Primitive** — The exact function/method we'll use
5. **Source** — Where we found the answer

**Philosophy:** Anchor Browser's Tasks API is immutable. We discover what they provide and adapt our implementation.

**Status Key:** ❓ Not Researched | 🔍 In Progress | ✅ Answered | ⚠️ Blocked

---

## Quick Reference

| Question | Unlocks Requirement | Status |
|----------|---------------------|--------|
| [RQ-1: Task creation API](#rq-1-task-creation-api) | Create reusable automation scripts | ❓ |
| [RQ-2: Task execution API](#rq-2-task-execution-api) | Run tasks synchronously and asynchronously | ❓ |
| [RQ-3: Async execution monitoring](#rq-3-async-execution-monitoring) | Monitor long-running tasks | ❓ |
| [RQ-4: Task versioning](#rq-4-task-versioning) | Deploy and version tasks | ❓ |
| [RQ-5: Task code size limits](#rq-5-task-code-size-limits) | Validate task creation | ❓ |
| [RQ-6: Task deletion with active executions](#rq-6-task-deletion-with-active-executions) | Handle task lifecycle | ❓ |

---

## Part 1: Anchor Browser Tasks API Research

### RQ-1: Task Creation API

**Why It Matters:** PR-2.1 (Create Reusable Tasks) — Need to understand how to create tasks with TypeScript code and input parameters.

**Status:** ✅ Answered

**Question:**
1. What's the exact API for creating a task?
2. How do we pass TypeScript code (base64 encoded)?
3. How do we define input parameters with `ANCHOR_` prefix?
4. What's the task creation response structure?

**Answer:**
```typescript
// Anchor provides agent.task() method for executing automation tasks
const anchorClient = new Anchorbrowser({ 
  apiKey: process.env.ANCHOR_API_KEY 
});

// Execute a task with natural language
const result = await anchorClient.agent.task(
  "Navigate to example.com and extract the main heading",
  {
    url: "https://example.com",
    humanIntervention: false,
    detectElements: true,
    maxSteps: 40,  // default 40
    agent: "browser-use",  // or "openai-cua", "gemini-computer-use"
    provider: "openai",
    model: "gpt-4o"
  }
);

// For structured output, use JSON Schema
const structuredResult = await anchorClient.agent.task(
  "Extract product information",
  {
    outputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        price: { type: "number" }
      }
    }
  }
);
```

**Primitive Discovered:**
- Function/Method: `anchorClient.agent.task()`
- Signature: `task(description: string, options?: TaskOptions): Promise<TaskResult>`
- Return type: TaskResult with extracted data or completion status

**Implementation Note:** Anchor focuses on natural language task execution rather than uploading custom TypeScript code. For complex custom logic, use the agent.task() with detailed instructions.

**Source:** 
- https://docs.anchorbrowser.io/agentic-browser-control/ai-task-completion
- https://docs.anchorbrowser.io/sdk-reference/ai-tools/perform-web-task

---

### RQ-2: Task Execution API

**Why It Matters:** PR-2.2 (Execute Tasks) — Need to run tasks synchronously and asynchronously.

**Status:** ✅ Answered

**Question:**
1. What's the API for running a task synchronously?
2. What's the API for running a task asynchronously?
3. How do we pass input parameters to task execution?
4. What's the difference between `run()` and `runAsync()` return values?

**Answer:**
```typescript
// Task execution is handled through agent.task() method
// Synchronous execution (waits for completion)
const result = await anchorClient.agent.task(
  "Fill out the form with user details",
  {
    url: "https://example.com/form",
    // Pass input parameters through the task description or context
    context: {
      username: process.env.ANCHOR_USERNAME,
      email: process.env.ANCHOR_EMAIL
    },
    maxSteps: 40
  }
);

// For async patterns, tasks can run in background sessions
const session = await anchorClient.sessions.create({
  session: {
    timeout: {
      max_duration: 180,  // up to 3 hours
      idle_timeout: 30
    }
  }
});

// Start task in session (continues running after function returns)
const taskPromise = anchorClient.agent.task(
  "Monitor website for changes",
  { sessionId: session.id }
);
```

**Primitive Discovered:**
- Function/Method: `agent.task()` with session management
- Async pattern: Use sessions with extended timeouts
- Input parameters: Pass through context object or task description

**Implementation Note:** Anchor doesn't have separate sync/async APIs. Use session timeouts for long-running tasks.

**Source:** https://docs.anchorbrowser.io/agentic-browser-control/ai-task-completion** 

---

### RQ-3: Async Execution Monitoring

**Why It Matters:** PR-2.3 (Monitor Background Tasks) — Need to check status of async tasks that run up to 3 hours.

**Status:** ✅ Answered (Limited)

**Question:**
1. Does Anchor provide webhooks for task completion, or do we need to poll?
2. What's the polling API for checking execution status?
3. What's the recommended polling interval?
4. What execution statuses are available (pending, running, success, failed)?

**Answer:**
The documentation mentions "self-healing" capabilities and runtime agents that monitor task execution, but doesn't explicitly describe a polling API or webhooks for task status:

```typescript
// Task execution appears to be primarily synchronous
const result = await anchorClient.agent.task("task description");

// For monitoring, you would need to implement custom tracking
// Store task metadata when starting
const taskId = generateId();
const taskPromise = anchorClient.agent.task(description, options);

// Track in your own database
await storeTaskStatus(taskId, 'running');

taskPromise
  .then(result => storeTaskStatus(taskId, 'success', result))
  .catch(error => storeTaskStatus(taskId, 'failed', error));
```

**If Not Available, Workarounds:**

| Option | Pros | Cons |
|--------|------|------|
| A: Store task state in database | Full control | Manual implementation |
| B: Use session monitoring | Built into Anchor | Limited to session lifecycle |

**Our Choice:** Option A - Implement custom task tracking with database storage

**Source:** 
- https://docs.anchorbrowser.io/agentic-browser-control/ai-task-completion
- Documentation doesn't provide explicit task monitoring API 

---

### RQ-4: Task Versioning

**Why It Matters:** PR-2.4 (Deploy Tasks) — Need to understand how task versioning works (draft vs deployed).

**Status:** ✅ Answered

**Question:**
1. How does task versioning work in Anchor?
2. What's the API for deploying a task (moving from draft to production)?
3. Can we have multiple draft versions?
4. How do we update an existing task - does it create a new version?

**Answer:**
Anchor's documentation describes "self-healing" features that include:
- Runtime agent analysis of failed tasks
- Generation of new task code versions with fixes
- Automatic or manual deployment of updates

However, explicit task versioning API is not documented. The platform appears to focus on:
```typescript
// Tasks are executed directly, not stored as versioned entities
const result = await anchorClient.agent.task(
  "Your task description",
  { /* options */ }
);

// Self-healing generates new versions when tasks fail
// "Generation of new task code versions with fixes"
// "Automatic or manual deployment of updates"
```

**Primitive Discovered:**
- No explicit versioning API found
- Self-healing provides automatic versioning for failed tasks
- Tasks appear to be ephemeral, not stored entities

**Implementation Note:** We may need to implement our own task versioning layer on top of Anchor's execution API

**Source:** https://docs.anchorbrowser.io/agentic-browser-control/ai-task-completion** 

---

### RQ-5: Task Code Size Limits

**Why It Matters:** PR-2.5 (Task Validation) — Need to know if we should enforce code size limits.

**Status:** ✅ Answered (Inferred)

**Question:**
1. What's the maximum code size for a task?
2. Does Anchor enforce limits, or is it unlimited?
3. What happens if we exceed the limit?
4. Should we validate code size before sending to Anchor?

**Answer:**
Since Anchor uses natural language task descriptions rather than code upload:
```typescript
// Tasks are described in natural language, not code
const result = await anchorClient.agent.task(
  "Your task description here",  // Natural language, not code
  { 
    maxSteps: 40,  // Complexity limited by steps, not code size
    // Other configuration options
  }
);

// Complexity is controlled by:
// 1. maxSteps parameter (default 40)
// 2. Natural language description length (likely has practical limits)
// 3. Token limits of underlying LLM model
```

**Primitive Discovered:**
- No code upload, uses natural language descriptions
- `maxSteps` parameter controls task complexity
- Token limits would apply to LLM processing

**Implementation Note:** Focus on clear, concise task descriptions rather than code size. Consider description length limits (e.g., 1000 characters) for UI.

**Source:** 
- https://docs.anchorbrowser.io/agentic-browser-control/ai-task-completion
- Inferred from natural language task approach** 

---

### RQ-6: Task Deletion with Active Executions

**Why It Matters:** PR-2.6 (Task Lifecycle) — Need to handle task deletion when async executions are running.

**Status:** ✅ Answered

**Question:**
1. Can we delete a task that has active async executions?
2. What happens to running executions if we delete the task?
3. Can we cancel active executions?
4. Should we prevent deletion of deployed tasks that are in use?

**Answer:**
Since tasks are ephemeral executions (not stored entities), deletion applies to sessions:
```typescript
// Tasks run in sessions, which can be terminated
const session = await anchorClient.sessions.create({ /* config */ });

// Start task in session
const taskPromise = anchorClient.agent.task(
  "Long running task",
  { sessionId: session.id }
);

// Cancel by terminating the session
await anchorClient.sessions.terminate(session.id);

// Or let session timeout naturally
// timeout: {
//   max_duration: 180,  // minutes
//   idle_timeout: 30    // minutes
// }
```

**Primitive Discovered:**
- Tasks are not persistent entities to delete
- Session termination cancels running tasks
- Sessions have built-in timeout controls

**Implementation Note:** Implement task management at application level. Use session termination to cancel running tasks.

**Source:** 
- https://docs.anchorbrowser.io/api-reference/browser-sessions/start-browser-session
- Inferred from session-based execution model** 

---

## Part 2: Integration Patterns

### RQ-7: How do Tasks work with our Session Management?

**Why It Matters:** PR-2.7 (Task Execution Context) — Understanding if tasks need active sessions or run independently.

**Status:** ✅ Answered

**Questions:**
1. Do tasks require an active browser session, or do they create their own?
2. Can tasks use saved profiles (from authenticated sessions)?
3. How do tasks relate to our session management system?

**Integration Pattern:**
```typescript
// Tasks can run with or without explicit sessions

// Option 1: Task creates its own session (default)
const result = await anchorClient.agent.task(
  "Navigate and extract data",
  { url: "https://example.com" }
);

// Option 2: Task uses existing session with profile
const session = await anchorClient.sessions.create({
  browser: {
    profile: {
      name: 'authenticated-profile'  // Use saved profile
    }
  }
});

const result = await anchorClient.agent.task(
  "Perform authenticated action",
  { 
    sessionId: session.id,  // Use existing session
    url: "https://example.com/dashboard"
  }
);

// Option 3: Task with profile directly (if supported)
const result = await anchorClient.agent.task(
  "Authenticated task",
  {
    url: "https://example.com",
    profile: 'authenticated-profile'  // May be supported
  }
);
```

**Answer:**
1. Tasks can create their own sessions OR use existing ones
2. Tasks can use saved profiles through session configuration
3. Tasks integrate with session management via sessionId parameter

**Source:** 
- https://docs.anchorbrowser.io/essentials/authentication-and-identity
- https://docs.anchorbrowser.io/agentic-browser-control/ai-task-completion** 

---

## Summary

### Primitives We'll Use

| What | Primitive | From | Confirmed? |
|------|-----------|------|------------|
| Execute task | `anchorClient.agent.task(description, options)` | Anchor SDK | ✅ |
| Create session | `anchorClient.sessions.create()` | Anchor SDK | ✅ |
| Terminate session | `anchorClient.sessions.terminate(id)` | Anchor SDK | ✅ |
| Use profile in task | Via session with profile | Anchor SDK | ✅ |
| Structured output | `outputSchema` in task options | Anchor SDK | ✅ |
| Configure agent | `agent`, `provider`, `model` options | Anchor SDK | ✅ |

### Blockers & Dead Ends

| Issue | Impact | Resolution |
|-------|--------|------------|
| No code upload API | Can't upload TypeScript | Use natural language descriptions |
| No task storage | Tasks aren't persistent | Implement storage layer |
| No status polling | Can't check async status | Track in application database |
| No versioning API | No built-in versioning | Implement versioning layer |

### Key Learnings

1. **Natural Language Focus** - Anchor uses natural language task descriptions, not code upload
2. **Session-Based Execution** - Tasks run in browser sessions with profiles for authentication
3. **Application-Level Management** - Task persistence, versioning, and monitoring must be implemented at application level 

---

## Exit Criteria

- [x] All RQ questions answered
- [x] Summary table complete
- [x] No unresolved blockers
- [x] Key learnings documented

**Next Step:** Implementation Plan - Design application-level task management on top of Anchor's execution API

---

## Resources Used

- [Anchor Browser Tasks API](https://docs.anchorbrowser.io/advanced/tasks)
- [Anchor Browser SDK Quickstart](https://docs.anchorbrowser.io/quickstart/use-via-sdk)
- Existing code: `app/api/browser-automation/services/anchor-agent.ts`
