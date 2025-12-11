# Workflow Execution Hang Analysis

**Date:** Current  
**Issue:** Workflow tool loads successfully but hangs when agent tries to execute it  
**Status:** Research Phase

---

## Symptoms

1. ✅ Workflow construction completes successfully
2. ✅ Workflow tool loads and is available to agent
3. ✅ Agent can see and list the workflow tool
4. ❌ When agent tries to execute workflow, it hangs (17-58 seconds, then timeout or no response)

---

## Potential Issues Identified

### Issue 1: RuntimeContext Structure Mismatch ⚠️ **CONFIRMED ISSUE**

**Current Implementation:**
```typescript
// workflow-tools.ts line 127-136
const runtimeContext = {
  get: (key: string) => {
    if (key === "connections") {
      return binding.connectionBindings;
    }
    return undefined;
  },
  connections: binding.connectionBindings
};
```

**Expected (from Mastra type definitions):**
```typescript
import { RuntimeContext } from "@mastra/core/runtime-context";

const runtimeContext = new RuntimeContext({
  connections: binding.connectionBindings
});
```

**Impact:** 
- ✅ Steps expect `runtimeContext.get("connections")` - RuntimeContext class provides this
- ❌ `start()` expects `runtimeContext?: RuntimeContext` (type definition line 343)
- ❌ Plain object does NOT satisfy Mastra's type requirements
- **This is likely the root cause of the hang** - Mastra might be rejecting or mishandling the plain object

**Evidence:**
- Mastra type definition: `start(args: { runtimeContext?: RuntimeContext })`
- RuntimeContext is a class with specific methods: `get()`, `set()`, `has()`, etc.
- Plain object with `get()` method might work for steps, but `start()` expects the actual class
- No `RuntimeContext` import found in codebase - we're not using it at all

---

### Issue 2: runtimeContext Passing Location ✅ **CORRECT AS-IS**

**Current Implementation:**
```typescript
// workflow-tools.ts line 140-150
const run = await runCreateFn({
  resourceId: userId,
  // runtimeContext NOT passed here - CORRECT
});

const result = await run.start({
  inputData: input,
  runtimeContext,  // ✅ Passed to start() - CORRECT
});
```

**Verified from Mastra Types:**
```typescript
// node_modules/@mastra/core/dist/workflows/workflow.d.ts
createRunAsync(options?: {
  runId?: string;
  resourceId?: string;
  disableScorers?: boolean;
  // ❌ NO runtimeContext parameter
}): Promise<Run>;

start(args: {
  inputData?: z.input<TInput>;
  runtimeContext?: RuntimeContext;  // ✅ runtimeContext goes here
  // ... other options
}): Promise<WorkflowResult>;
```

**Impact:**
- ✅ Current implementation is CORRECT - `runtimeContext` should be passed to `start()`
- ❌ But Issue 1 (plain object vs RuntimeContext class) is still the problem
- Research docs were misleading - they showed it in `createRunAsync()` but types show it in `start()`

**Evidence:**
- Mastra type definitions confirm `start()` accepts `runtimeContext?: RuntimeContext`
- `createRunAsync()` does NOT accept `runtimeContext` parameter
- Our code structure is correct, but the runtimeContext object type is wrong

---

### Issue 3: Safe Wrapper's createRunAsync Binding

**Current Implementation:**
```typescript
// workflow-loader.ts line 154-156
if ('createRunAsync' in workflowAny && typeof workflowAny.createRunAsync === 'function') {
  safeWrapper.createRunAsync = workflowAny.createRunAsync.bind(workflowAny);
}
```

**Potential Issue:**
- When binding `createRunAsync` to `workflowAny`, if accessing `workflowAny.createRunAsync` triggers thenable behavior, the binding might fail or hang
- The bound function might still reference the thenable workflow internally, causing issues during execution

**Impact:**
- `createRunAsync` call might hang if it internally tries to access workflow properties
- The bound function might not work correctly if Mastra expects `this` context

---

### Issue 4: Missing Execution Logging

**Current State:**
- Logs show workflow tool creation completes
- No logs between `createRunAsync()` and `run.start()` 
- No logs during step execution
- Can't tell if hang is at:
  - `createRunAsync()` call
  - `run.start()` call  
  - First step execution
  - Step trying to access runtimeContext

**Impact:**
- Can't diagnose where exactly the hang occurs
- Need granular logging to pinpoint the issue

---

### Issue 5: Thenable Workflow During Execution

**Current State:**
- Workflow is detected as thenable and wrapped
- Safe wrapper extracts `inputSchema` and `createRunAsync`
- But when `createRunAsync` is called, it might internally access the original workflow object
- If that access triggers thenable behavior, it could hang

**Impact:**
- Even with safe wrapper, execution might still trigger thenable issues
- The original workflow object is stored in `_workflow` but might be accessed internally

---

## Recommended Investigation Steps

### Step 1: Add Comprehensive Logging
Add logs at every critical point:
- Before/after `createRunAsync()` call
- Before/after `run.start()` call
- In step execute functions (if possible)
- When accessing runtimeContext in steps

### Step 2: Fix RuntimeContext Implementation
1. Import `RuntimeContext` from `@mastra/core/workflows`
2. Create proper instance: `new RuntimeContext({ connections })`
3. Test if this resolves the hang

### Step 3: Fix runtimeContext Passing
1. Pass `runtimeContext` to `createRunAsync()` instead of `start()`
2. Remove from `start()` call
3. Test if this resolves the hang

### Step 4: Verify Safe Wrapper
1. Add logging to verify `createRunAsync` is being called correctly
2. Check if bound function works or if we need to call original workflow's method differently
3. Consider storing original workflow reference and calling method directly

### Step 5: Test Step Execution Isolation
1. Create a minimal test workflow with one step
2. Test execution outside of agent context
3. Verify if issue is with workflow execution itself or agent integration

---

## Priority Order

1. **CRITICAL:** Fix RuntimeContext to use proper class instance (Issue 1) - **LIKELY ROOT CAUSE**
2. **HIGH:** Add comprehensive logging to verify fix and identify any remaining issues
3. **MEDIUM:** Verify safe wrapper's createRunAsync binding works correctly
4. **LOW:** Test isolated workflow execution to confirm fix

---

## Questions Answered ✅

1. ✅ **Does Mastra require `RuntimeContext` class instance?** YES - Type definition shows `runtimeContext?: RuntimeContext` (class type, not plain object)
2. ✅ **Can `runtimeContext` be passed to both `createRunAsync()` and `start()`?** NO - Only to `start()`. `createRunAsync()` doesn't accept it.
3. ❓ **Does the thenable workflow cause issues during execution?** UNKNOWN - Need to test after fixing RuntimeContext
4. ✅ **Are there any Mastra-specific requirements for how `createRunAsync` is called?** NO - Our usage is correct
5. ❓ **Could the hang be due to missing connection bindings?** POSSIBLE - But more likely due to RuntimeContext type mismatch

---

## Next Steps

1. ✅ **DONE:** Research Mastra's actual RuntimeContext requirements (verified from node_modules types)
2. **TODO:** Fix RuntimeContext implementation:
   - Import `RuntimeContext` from `@mastra/core/runtime-context`
   - Create instance: `new RuntimeContext({ connections: binding.connectionBindings })`
   - Pass to `start()` (already correct location)
3. **TODO:** Add detailed logging to execution path to verify fix
4. **TODO:** Test workflow execution with proper RuntimeContext
5. **TODO:** Verify safe wrapper still works correctly with RuntimeContext fix

## Root Cause Hypothesis

**Most Likely:** The plain object `{ get: ..., connections: ... }` is being passed to `start()` which expects a `RuntimeContext` class instance. Mastra might be:
- Rejecting the plain object silently
- Trying to convert it and failing
- Passing it to steps which then fail when accessing it
- Causing a type mismatch that leads to undefined behavior

**Fix:** Use `new RuntimeContext({ connections })` instead of plain object.

