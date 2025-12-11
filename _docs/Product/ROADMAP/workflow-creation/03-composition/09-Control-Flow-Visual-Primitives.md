# Control Flow Visual Primitives

**Status:** Draft
**Priority:** P0
**North Star:** User builds job application workflow with visual branching: if already applied → skip, if CAPTCHA detected → retry with delay, loop through all listings until done.

---

## Problem Statement

Real workflows aren't just linear sequences. They require:
- **Conditionals** — Do X if condition, else do Y
- **Loops** — Repeat until done
- **Parallel execution** — Do A and B at the same time
- **Error handling** — If X fails, do Y

Currently, the workflow editor only supports sequential steps. Users can't express complex logic visually.

**The Gap:** No visual primitives for control flow (branching, looping, parallelism).

---

## User Value

- **Express real-world logic** — Workflows match actual decision processes
- **Visual clarity** — See the flow at a glance
- **Error resilience** — Build retry and fallback logic
- **Efficiency** — Parallel execution speeds up workflows
- **Completeness** — Handle edge cases without custom code

---

## Control Flow Primitives

### 1. Branch (If/Else)

**Mastra primitive:** `.branch()`

```
         ┌─── condition true ───→ [Step A]
[Input] ─┤
         └─── condition false ──→ [Step B]
                                      ↓
                              [Continue...]
```

**Use cases:**
- If user already applied → skip
- If validation passes → proceed, else → error
- If data exists → update, else → create

### 2. Loop (DoUntil / DoWhile / ForEach)

**Mastra primitives:** `.dountil()`, `.dowhile()`, `.foreach()`

```
         ┌──────────────────────────┐
         ↓                          │
      [Step] ─── condition false ───┘
         │
         └─── condition true ───→ [Continue...]
```

**Use cases:**
- Process each item in a list
- Retry until success
- Paginate through results
- Wait until condition met

### 3. Parallel (And-Split / And-Join)

**Mastra primitive:** `.parallel()`

```
                ┌──→ [Step A] ──┐
[Input] ───────┤                ├───→ [Merge] → [Continue...]
                └──→ [Step B] ──┘
```

**Use cases:**
- Fetch from multiple APIs simultaneously
- Process independent tasks concurrently
- Reduce total execution time

### 4. Error Handler (Try/Catch)

**Mastra primitive:** Step-level error handling

```
[Try Step] ─── success ───→ [Continue...]
     │
     └─── error ───→ [Error Handler] ─→ [Recovery...]
```

**Use cases:**
- Retry on transient failures
- Fallback to alternative approach
- Log and notify on errors

---

## User Flows

### Flow 1: Add Branch to Workflow

```
1. User has linear workflow
2. User drags "Branch" from control flow toolkit
3. Branch node appears with two outputs: "If" and "Else"
4. User configures condition:
   - Source: Previous step output
   - Operator: equals, contains, greater than, etc.
   - Value: Expected value or expression
5. User connects "If" output to one step
6. User connects "Else" output to another step
7. Both paths eventually merge or end
8. Transpiled code uses `.branch()` with conditions
```

### Flow 2: Add Loop to Workflow

```
1. User has array output from previous step
2. User drags "For Each" from toolkit
3. Loop node appears with:
   - Input: Array to iterate
   - Body: Steps to run for each item
   - Output: Collected results
4. User configures:
   - Array source: previousStep.items
   - Item variable name: "item"
5. User adds steps inside loop body
6. Each step receives current item
7. Transpiled code uses `.foreach()` with step chain
```

### Flow 3: Add Parallel Execution

```
1. User has steps that can run concurrently
2. User drags "Parallel" from toolkit
3. Parallel node appears with multiple branch slots
4. User connects independent steps to each slot
5. User adds "Join" node to collect results
6. Transpiled code uses `.parallel([stepA, stepB])`
7. Execution runs both steps simultaneously
```

### Flow 4: Add Error Handling

```
1. User has step that might fail (API call)
2. User right-clicks step → "Add Error Handler"
3. Error handler node appears connected to step
4. User configures:
   - Error types to catch: timeout, auth, all
   - Retry count: 3
   - Retry delay: exponential backoff
5. User adds fallback steps in error branch
6. Transpiled code wraps step in try/catch
```

---

## Code Areas

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/api/workflows/types/workflow.ts` | Control flow types | `controlFlow` field |
| `app/api/workflows/services/step-generator.ts` | Code generation | Mastra primitives |
| `app/(pages)/workflows/editor/` | Canvas UI | Node types |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primitive set | Branch, Loop, Parallel, Error | Core patterns, Mastra-supported |
| Visual style | Distinct shapes per type | Instant recognition |
| Condition editor | Expression builder | No code for simple cases |
| Loop types | ForEach, DoUntil, DoWhile | Cover iteration patterns |

---

## Architecture

### Control Flow Node Types

```typescript
interface BranchNode {
  type: 'branch';
  condition: BranchCondition;
  trueBranch: string[];     // Step IDs for true path
  falseBranch: string[];    // Step IDs for false path
}

interface BranchCondition {
  type: 'expression' | 'code';
  // For expression
  source?: string;          // Path to value: "stepId.field"
  operator?: ComparisonOperator;
  value?: any;
  // For code
  code?: string;            // Custom condition code
}

type ComparisonOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'contains'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'matches';              // Regex

interface LoopNode {
  type: 'foreach' | 'dountil' | 'dowhile';
  source: string;           // Array or condition source
  itemVariable: string;     // Variable name for current item
  body: string[];           // Step IDs in loop body
  maxIterations?: number;   // Safety limit
}

interface ParallelNode {
  type: 'parallel';
  branches: string[][];     // Array of step ID arrays
  joinStrategy: 'all' | 'any' | 'first';
}

interface ErrorHandlerNode {
  type: 'errorHandler';
  trySteps: string[];
  catchSteps: string[];
  errorTypes?: string[];    // Specific error types to catch
  retryConfig?: {
    count: number;
    delay: number;
    backoff: 'fixed' | 'exponential';
  };
}
```

### Transpilation to Mastra

```typescript
// Branch
.branch({
  if: async ({ inputData }) => inputData.condition === true,
  then: trueSteps,
  else: falseSteps
})

// ForEach
.foreach({
  source: async ({ inputData }) => inputData.items,
  step: itemSteps
})

// DoUntil
.dountil({
  condition: async ({ inputData }) => inputData.done === true,
  step: bodySteps
})

// Parallel
.parallel([stepA, stepB, stepC])

// Error handling (per step)
const stepWithRetry = createStep({
  id: 'step-id',
  execute: async (context) => {
    try {
      return await actualLogic(context);
    } catch (error) {
      if (context.retryCount < 3) {
        await delay(1000 * Math.pow(2, context.retryCount));
        return stepWithRetry.execute({ ...context, retryCount: context.retryCount + 1 });
      }
      throw error;
    }
  }
});
```

---

## Visual Design

### Node Shapes

| Type | Shape | Color | Icon |
|------|-------|-------|------|
| Branch | Diamond | Yellow | Split arrows |
| ForEach | Rounded rect with loop | Blue | Loop arrow |
| DoUntil/While | Hexagon | Purple | Cycle |
| Parallel | Wide rect with lanes | Green | Parallel lines |
| Error | Rect with shield | Red | Shield/X |

### Connection Styles

| Connection | Style |
|------------|-------|
| Normal | Solid line |
| True branch | Green with checkmark |
| False branch | Red with X |
| Loop back | Dashed curved |
| Parallel | Multiple lines |
| Error | Dotted red |

---

## Constraints

- **Mastra compatibility** — Must transpile to valid Mastra primitives
- **Visual clarity** — Complex flows must remain readable
- **Nesting limits** — Max 3 levels of control flow nesting
- **Performance** — Parallel execution must handle backpressure

---

## Success Criteria

- [ ] Branch node with condition editor
- [ ] ForEach loop node with array binding
- [ ] DoUntil/DoWhile nodes with condition
- [ ] Parallel node with multiple branches
- [ ] Error handler with retry config
- [ ] Visual distinction for each control type
- [ ] Transpilation generates valid Mastra code
- [ ] Execution follows control flow correctly

---

## Out of Scope

- Switch/case (multiple branches)
- Goto/labels
- State machines
- Cancellation tokens
- Nested parallel within parallel

---

## Open Questions

- How do we visualize deeply nested control flow?
- Should we support break/continue in loops?
- How do we handle infinite loop detection?
- Should parallel branches share data?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Control Flow Toolkit | Palette of primitives | Branch, loop, parallel icons |
| Branch Node | Branch on canvas | Diamond, two outputs, condition preview |
| Loop Node | Loop on canvas | Loop indicator, body area |
| Parallel Node | Parallel on canvas | Lane view, join point |
| Condition Editor | Condition configuration | Expression builder, preview |

### Mockup Location

```
_docs/UXD/Pages/workflows/
├── control-flow/
│   ├── toolkit.html
│   ├── branch-node.html
│   ├── loop-node.html
│   ├── parallel-node.html
│   └── condition-editor.html
```

---

## References

- Mastra Control Flow: https://mastra.ai/docs/workflows/control-flow
- BPMN gateways: https://www.bpmn.org/
- XYFlow custom nodes: https://reactflow.dev/docs/guides/custom-nodes/
