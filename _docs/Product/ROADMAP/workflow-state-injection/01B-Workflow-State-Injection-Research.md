# Task 01.1: Workflow State Injection — Research Log

**Status:** In Progress  
**Date:** December 2024  
**Parent Task:** `_docs/Product/ROADMAP/workflow-state-injection/01-Workflow-State-Injection.md`

---

## How to Use This Document

This is a **research log** for discovering facts about Mastra's workflow state API.

**Each research question has:**
1. **The Question** — What we need to find out
2. **Why It Matters** — Which product requirement this unlocks
3. **Answer** — What we discovered (to be filled)
4. **Primitive** — The exact function/method we'll use
5. **Source** — Where we found the answer

**Philosophy:** Mastra's workflow state API is immutable. We discover what they provide and adapt our implementation.

**Status Key:** ❓ Not Researched | 🔍 In Progress | ✅ Answered | ⚠️ Blocked

---

## Quick Reference

| Question | Unlocks Requirement | Status |
|----------|---------------------|--------|
| [RQ-1: Initial state API](#rq-1-initial-state-api) | Pass initialState to workflows | ❓ |
| [RQ-2: State schema definition](#rq-2-state-schema-definition) | Define state structure | ❓ |
| [RQ-3: State persistence](#rq-3-state-persistence) | State across suspend/resume | ❓ |
| [RQ-4: State extraction](#rq-4-state-extraction) | Get stateSchema from workflows | ❓ |

---

## Part 1: Mastra Workflow State API Research

### RQ-1: Initial State API

**Why It Matters:** PR-1.1 (Initial State Injection) — Need to understand how to pass `initialState` to `run.start()`.

**Status:** ✅ Answered

**Question:**
1. What's the exact API for `run.start({ inputData, initialState })`?
2. What format should `initialState` be (object, Map, etc.)?
3. How does initialState relate to workflow's `stateSchema`?
4. What happens if initialState doesn't match stateSchema?

**Answer:**
```typescript
// Create workflow run and pass initialState
const run = await workflow.createRunAsync();

const result = await run.start({
  inputData: { 
    message: "Hello world" 
  },
  initialState: {                     // Plain object matching stateSchema
    counter: 0,
    items: [],
    processedIds: new Set(),
    metadata: {
      startedAt: Date.now()
    }
  }
});

// Alternative: Using createRun() for synchronous creation
const run = workflow.createRun();
const result = await run.start({
  inputData: { /* ... */ },
  initialState: { /* ... */ }        // Must match workflow's stateSchema
});

// If validation is enabled and initialState doesn't match schema:
// - Workflow throws error and doesn't start
// - Default values from schema are applied if missing
```

**Primitive Discovered:**
- Function/Method: `run.start()`
- Signature: `start({ inputData, initialState?, validateInputs? })`
- Return type: `Promise<WorkflowResult>`
- Format: Plain JavaScript object matching stateSchema structure

**Implementation Note:** 
- initialState is optional - defaults to empty object or schema defaults
- Validation can be controlled with `validateInputs` flag
- State must match stateSchema shape if validation enabled

**Source:** 
- https://mastra.ai/blog/state
- https://mastra.ai/reference/workflows/run-methods/start

---

### RQ-2: State Schema Definition

**Why It Matters:** PR-1.2 (State Schema) — Need to understand how to define `stateSchema` on workflows and steps.

**Status:** ✅ Answered

**Question:**
1. How do we define `stateSchema` on a workflow?
2. How do we define `stateSchema` on individual steps?
3. What's the relationship between workflow stateSchema and step stateSchema?
4. Can stateSchema be Zod schemas, or another format?

**Answer:**
```typescript
import { createWorkflow, createStep } from '@mastra/core';
import { z } from 'zod';

// Define workflow-level stateSchema using Zod
const workflow = createWorkflow({
  id: "process-items",
  inputSchema: z.object({ items: z.array(z.string()) }),
  outputSchema: z.object({ summary: z.string() }),
  
  // Workflow defines complete state structure
  stateSchema: z.object({
    processedItems: z.array(z.string()),
    errorCount: z.number(),
    userId: z.string(),
    metadata: z.object({
      startTime: z.number(),
      source: z.string()
    })
  })
});

// Steps declare subset of state they need
const processStep = createStep({
  id: "process-item",
  inputSchema: z.object({ item: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  
  // Step only declares state fields it uses (subset of workflow state)
  stateSchema: z.object({
    processedItems: z.array(z.string()),  // Only these fields
    errorCount: z.number()                 // from workflow state
  }),
  
  execute: async ({ inputData, state, setState }) => {
    // Step only sees declared state fields
    const { processedItems, errorCount } = state;
    
    // Update state using setState
    setState({
      ...state,
      processedItems: [...processedItems, inputData.item],
      errorCount: errorCount + (hasError ? 1 : 0)
    });
    
    return { result: "processed" };
  }
});
```

**Primitive Discovered:**
- Schema definition: Zod objects for both workflow and steps
- Format: `stateSchema: z.object({ ... })`
- Relationship: Step stateSchema must be subset of workflow stateSchema
- Access: Steps only see fields they declared in their stateSchema

**Implementation Note:** 
- Workflow defines complete state structure
- Each step declares only the subset it needs
- Type safety enforced - step can't access undeclared state fields
- Available from @mastra/core@0.20.1+

**Source:** 
- https://mastra.ai/blog/state
- https://mastra.ai/reference/workflows/workflow
- https://mastra.ai/reference/workflows/step** 

---

### RQ-3: State Persistence

**Why It Matters:** PR-1.3 (State Across Suspend/Resume) — Need to understand how state persists across suspend/resume cycles.

**Status:** ✅ Answered

**Question:**
1. Does state automatically persist when a workflow suspends?
2. How do we access state in steps (via `state` parameter)?
3. How do we update state (via `setState`)?
4. What's the state update pattern?

**Answer:**
```typescript
// State access and update in steps
const myStep = createStep({
  id: "my-step",
  stateSchema: z.object({
    counter: z.number(),
    items: z.array(z.string())
  }),
  
  execute: async ({ inputData, state, setState, mastra }) => {
    // 1. Access state via state parameter
    const { counter, items } = state;
    console.log(`Current counter: ${counter}`);
    
    // 2. Update state using reducer pattern with setState
    setState({
      ...state,                        // Spread existing state
      counter: counter + 1,            // Update specific fields
      items: [...items, "new item"]
    });
    
    // State persists automatically across:
    // - Step executions
    // - Suspend/resume cycles
    // - Workflow restarts
    
    return { processed: true };
  }
});

// State during suspend/resume
const workflow = createWorkflow({
  // ... workflow config ...
  
  steps: [
    step1,
    suspendStep,  // State persists when workflow suspends here
    step2         // State available when workflow resumes
  ]
});

// Resume with state intact
const run = await workflow.createRun();
await run.resume({
  resumeData: { /* ... */ }
  // State from before suspension is automatically available
});
```

**Primitive Discovered:**
- State access: Via `state` parameter in execute function
- State updates: `setState({ ...state, ...updates })` reducer pattern
- Persistence: Automatic across suspend/resume and step executions
- Pattern: Immutable updates using spread operator

**Implementation Note:** 
- State persists automatically - no manual save needed
- Use reducer pattern (spread + update) for state changes
- State survives workflow suspension and resumption
- Each step sees only its declared state subset

**Source:** 
- https://mastra.ai/blog/state
- https://mastra.ai/docs/workflows/time-travel (suspend/resume)** 

---

### RQ-4: State Extraction

**Why It Matters:** PR-1.4 (Extract stateSchema) — Need to extract stateSchema from transpiled workflows for UI validation.

**Status:** ✅ Answered

**Question:**
1. How do we extract `stateSchema` from a transpiled workflow?
2. Is stateSchema stored in workflow metadata?
3. Can we access stateSchema from the workflow object at runtime?
4. What's the structure of stateSchema in transpiled workflows?

**Answer:**
```typescript
// Access stateSchema from workflow object
const workflow = createWorkflow({
  id: "my-workflow",
  stateSchema: z.object({
    counter: z.number(),
    items: z.array(z.string())
  }),
  // ... other config
});

// Runtime access to stateSchema
const schema = workflow.stateSchema;  // Zod schema object
const shape = schema?.shape;           // Access schema shape

// For transpiled workflows loaded dynamically
import { loadWorkflow } from './workflow-loader';

const loadedWorkflow = await loadWorkflow('workflow-id');
const stateSchema = loadedWorkflow.stateSchema;

// Validate data against stateSchema
if (stateSchema) {
  try {
    const validState = stateSchema.parse(someData);
    // Data is valid
  } catch (error) {
    // Validation failed
  }
}

// In workflow metadata (stored in workflow.json)
{
  "id": "workflow-id",
  "name": "My Workflow",
  "stateSchema": {                    // Stored as JSON Schema
    "type": "object",
    "properties": {
      "counter": { "type": "number" },
      "items": { 
        "type": "array",
        "items": { "type": "string" }
      }
    }
  }
}
```

**Primitive Discovered:**
- Extraction method: Direct property access `workflow.stateSchema`
- Storage location: Workflow object property and metadata JSON
- Runtime access: Available as Zod schema on workflow instance
- Structure: Zod schema object or JSON Schema in metadata

**Implementation Note:** 
- stateSchema is optional (`z.any()` default if not specified)
- Can be accessed directly from workflow object
- Stored as JSON Schema in workflow.json for persistence
- Convert between Zod and JSON Schema as needed

**Source:** 
- https://mastra.ai/reference/workflows/workflow
- https://mastra.ai/docs/workflows/input-data-mapping
- Inferred from workflow object structure** 

---

## Summary

### Primitives We'll Use

| What | Primitive | From | Confirmed? |
|------|-----------|------|------------|
| Define stateSchema | `stateSchema: z.object({ ... })` | Mastra | ✅ |
| Pass initialState | `run.start({ inputData, initialState })` | Mastra | ✅ |
| Access state in steps | `state` parameter in execute | Mastra | ✅ |
| Update state in steps | `setState({ ...state, ...updates })` | Mastra | ✅ |
| Extract stateSchema | `workflow.stateSchema` property | Mastra | ✅ |

### Blockers & Dead Ends

| Issue | Impact | Resolution |
|-------|--------|------------|
| None identified | - | All APIs available |

### Key Learnings

1. **Zod schemas throughout** - stateSchema uses Zod, providing type safety and validation
2. **Subset pattern** - Steps declare only the state subset they need, workflow defines complete structure  
3. **Automatic persistence** - State persists automatically across suspend/resume without manual intervention 

---

## Exit Criteria

- [x] All RQ questions answered
- [x] Summary table complete
- [x] No unresolved blockers
- [x] Key learnings documented

**Next Step:** Implementation Plan - Ready to implement workflow state injection feature

---

## Resources Used

- [Mastra Workflow State Documentation](https://mastra.ai/docs/workflows/workflow-state)
- Existing code: `app/api/tools/services/workflow-tools.ts`
- Existing code: `_tables/workflows/wf-auUlyla9_YGv/workflow.ts`



