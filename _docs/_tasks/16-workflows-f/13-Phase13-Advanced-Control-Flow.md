# Phase 13: Advanced Control Flow Transpilation

**Status:** 📋 Planned  
**Depends On:** Phase 8 (Transpilation Engine), Phase 9 (Workflow Inputs Enhancement), Phase 10 (Agent Integration), Phase 11 (Workflow Runtime Execution), Phase 12 (Runtime Workflow Construction)  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Enable users to build **complex workflows with conditional routing, parallel execution, and iteration**. Currently, users can only create linear workflows (A → B → C). This phase extends the transpiler to support:

- **Branch** (`.branch()`) - Conditional routing based on step outputs or workflow inputs (e.g., "if order total > $100, send premium email, else send standard email")
- **Parallel** (`.parallel()`) - Execute multiple steps concurrently for improved performance (e.g., "fetch user profile, orders, and preferences in parallel, then combine results")
- **Loop** (`.dountil()` / `.dowhile()`) - Repeat steps until condition met (e.g., "retry API call until success or max 5 attempts")
- **ForEach** (`.foreach()`) - Process each item in an array (e.g., "process each item in the shopping cart")

After this phase:
- Users can create workflows with if/then logic based on step outputs
- Users can execute multiple workflow paths simultaneously for faster completion
- Users can build retry and polling patterns with loops
- Users can process arrays of data with iterative workflows
- Complex nested control flow works correctly (e.g., parallel branches containing foreach loops)

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Branch structure | Router + merge pattern | Mastra uses explicit branch points and joins |
| Parallel execution | `.parallel([step1, step2])` | Mastra's parallel primitive handles concurrency |
| Loop condition | User-defined expression | Flexible termination logic |
| ForEach iteration | `.foreach(items, step)` | Mastra's native iteration support |
| Nesting | Recursive generation | Control flow can contain other control flow (e.g., parallel branches with foreach inside, loops with branches inside) |

### Pertinent Research

- **Mastra `.branch()`**: Takes condition function and routes to different step chains
- **Mastra `.parallel()`**: Accepts array of steps, executes concurrently, waits for all
- **Mastra `.dountil()`**: Repeats step(s) until condition returns true
- **Mastra `.foreach()`**: Iterates array, executing step for each item

*Source: `Workflow-Primitives.md`*

### Overall File Impact

#### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/[workflowId]/update/services/transpiler/branch-generator.ts` | Create | Enables users to create conditional workflows where different steps execute based on step output values. Powers if/then logic like "if order total > $100, send premium email, else send standard email". Generates Mastra .branch() code that routes workflow execution to different paths based on user-defined conditions. Handles nested control flow within branch paths (e.g., foreach loops inside branches). | A |
| `app/api/workflows/[workflowId]/update/services/transpiler/parallel-generator.ts` | Create | Enables users to execute multiple workflow steps simultaneously for improved performance. Powers concurrent operations like "fetch user profile, orders, and preferences in parallel, then combine results". Generates Mastra .parallel() code that executes multiple step chains concurrently and waits for all to complete. Handles nested control flow within parallel lanes (e.g., loops or branches inside parallel lanes). | A |
| `app/api/workflows/[workflowId]/update/services/transpiler/loop-generator.ts` | Create | Enables users to create workflows that repeat steps until a condition is met. Powers retry logic like "retry API call until success or max 5 attempts" and polling patterns. Generates Mastra .dountil() or .dowhile() code with user-defined termination conditions. Handles nested control flow within loop bodies (e.g., branches or parallel execution inside loops). | B |
| `app/api/workflows/[workflowId]/update/services/transpiler/foreach-generator.ts` | Create | Enables users to process each item in an array with the same workflow steps. Powers batch operations like "process each item in the shopping cart" or "send email to each recipient". Generates Mastra .foreach() code that iterates over arrays with configurable concurrency. Handles nested control flow within foreach bodies (e.g., branches or loops inside foreach iterations). | B |
| `app/api/workflows/[workflowId]/update/services/transpiler/index.ts` | Modify | Removes the skip logic for control flow steps and routes them to appropriate generators. Enables the transpiler to handle complex workflows with branches, parallel execution, and loops instead of showing errors. Detects control flow step types and delegates to branch/parallel/loop/foreach generators. | A, B |
| `app/api/workflows/[workflowId]/update/services/transpiler/workflow-generator.ts` | Modify | Integrates control flow generators into the workflow composition chain. Enables workflows to include conditional routing, parallel execution, and loops in the generated Mastra code instead of skipping these steps. Handles nested control flow by recursively generating code for child steps within containers. Preserves data mappings for steps inside control flow containers. | A, B |

**Note:** Types for control flow already exist in `app/api/workflows/types/execution-flow.ts` (BranchConfig, ParallelConfig, LoopConfig, ForEachConfig). No new types file needed.

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-13.1 | Branch steps produce `.branch()` code | Branch node → conditional routing code | A |
| AC-13.2 | Branch conditions reference step outputs and inputs | Uses `getStepResult()` for step outputs and `inputData` for workflow inputs | A |
| AC-13.3 | Parallel groups produce `.parallel()` code | Parallel container → `[step1, step2]` array | A |
| AC-13.4 | Loop steps produce `.dountil()` code | Loop container → repeat with condition | B |
| AC-13.5 | ForEach steps produce `.foreach()` code | ForEach container → iteration code | B |
| AC-13.6 | Nested control flow generates correctly | Loop inside branch, foreach inside parallel lane, branch inside loop → all generate valid nested code | B |
| AC-13.7 | Control flow preserves data mappings | Mappings work inside containers | A, B |

### User Flows (Phase Level)

#### Flow 1: Transpile Branching Workflow

```
1. User has workflow:
   - Step 1: Fetch Data
   - Branch: If data.count > 10
     - True path: Step 2a (Process Large)
     - False path: Step 2b (Process Small)
   - Step 3: Send Result (merge point)
2. User clicks "Save"
3. System transpiles to:
   .then(fetchDataStep)
   .branch(({ getStepResult }) => {
     const data = getStepResult("fetch-data");
     return data?.count > 10 ? "large" : "small";
   }, {
     large: [processLargeStep],
     small: [processSmallStep]
   })
   .then(sendResultStep)
4. Generated code handles both paths correctly
```

#### Flow 2: Transpile Parallel Workflow

```
1. User has workflow:
   - Step 1: Get User
   - Parallel:
     - Lane A: Fetch Orders
     - Lane B: Fetch Preferences
   - Step 2: Combine Results
2. User clicks "Save"
3. System transpiles to:
   .then(getUserStep)
   .parallel([fetchOrdersStep, fetchPreferencesStep])
   .then(combineResultsStep)
4. Parallel execution handled by Mastra runtime
```

#### Flow 3: Transpile Nested Control Flow

```
1. User has workflow:
   - Step 1: Fetch Data
   - Parallel:
     - Lane A: 
       - Step 2a: Process Items
       - ForEach (nested): Process each item
     - Lane B:
       - Step 2b: Validate
       - Branch (nested): If valid → Step 3a, else → Step 3b
   - Step 4: Combine Results
2. User clicks "Save"
3. System transpiles nested structures correctly:
   .then(fetchDataStep)
   .parallel([
     processItemsStep.then(foreachStep),
     validateStep.then(branchStep)
   ])
   .then(combineResultsStep)
4. Nested control flow generates valid Mastra code
```

---

## Part A: Branch and Parallel

### Goal

Add transpilation support for branching (conditional routing) and parallel (concurrent execution) control flow. These are the most common control flow patterns.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/[workflowId]/update/services/transpiler/branch-generator.ts` | Create | Generates Mastra .branch() code with condition routing. Handles multiple branch paths, extracts conditions from BranchConfig, generates step chains for each path, and supports nested control flow within branches. | ~200 |
| `app/api/workflows/[workflowId]/update/services/transpiler/parallel-generator.ts` | Create | Generates Mastra .parallel() code for concurrent execution. Extracts parallel lanes from ParallelConfig, generates step chains for each lane, handles nested control flow within lanes, and supports failFast option. | ~150 |
| `app/api/workflows/[workflowId]/update/services/transpiler/index.ts` | Modify | Removes control flow skip logic (line 30-32), detects control flow step types, routes to appropriate generators, and handles errors gracefully. | +80 |
| `app/api/workflows/[workflowId]/update/services/transpiler/workflow-generator.ts` | Modify | Integrates control flow generators into composition chain. Detects control flow steps, calls appropriate generators, handles nested control flow recursively, and preserves data mappings. | +120 |

### Pseudocode

#### `app/api/workflows/[workflowId]/update/services/transpiler/branch-generator.ts`

```
generateBranchCode(step: WorkflowStep, context: TranspilerContext): string
├── Extract BranchConfig from step.controlConfig
├── Get child steps for each branch condition (via step.childStepIds and branchConditionIndex)
│
├── For each condition in BranchConfig.conditions:
│   ├── Find steps with matching branchConditionIndex
│   ├── Generate step chain for this path:
│   │   ├── For each child step:
│   │   │   ├── If child is control flow: Recursively call appropriate generator
│   │   │   ├── Else: Get step variable from context.stepVarMap
│   │   │   ├── Add data mappings if bindings exist
│   │   │   └── Chain with .then()
│   │   └── Collect in paths array
│   └── Generate condition expression from condition.expression
│
├── If hasElse: Add catch-all path with steps where branchConditionIndex is undefined
│
├── Generate .branch() call:
│   .branch([
│     { condition: ({ getStepResult, inputData }) => ${condition1}, step: ${path1Steps} },
│     { condition: ({ getStepResult, inputData }) => ${condition2}, step: ${path2Steps} },
│     { condition: () => true, step: ${elsePathSteps} }  // if hasElse
│   ])
│
└── Return branch code string

generateConditionExpression(condition: BranchCondition, context: TranspilerContext): string
├── Parse condition.expression (user-provided JS expression)
├── Replace step output references:
│   └── "step-1.data.status" → `getStepResult("step-1")?.data.status`
├── Replace workflow input references:
│   └── "orderTotal" → `inputData["orderTotal"]` (bracket notation for spaces)
└── Return transformed expression
```

#### `app/api/workflows/[workflowId]/update/services/transpiler/parallel-generator.ts`

```
generateParallelCode(step: WorkflowStep, definition: WorkflowDefinition, context: TranspilerContext): string
├── Extract ParallelConfig from step.controlConfig
├── Get child steps grouped by parallelLaneIndex
│
├── For each lane in ParallelConfig.lanes:
│   ├── Find steps with matching parallelLaneIndex
│   ├── Generate step chain for this lane:
│   │   ├── For each child step:
│   │   │   ├── If child is control flow: Recursively call appropriate generator
│   │   │   ├── Else: Get step variable from context.stepVarMap
│   │   │   ├── Add data mappings if bindings exist
│   │   │   └── Chain with .then() if multiple steps
│   │   └── If single step: use step variable directly
│   │   └── If multiple steps: create inline workflow chain
│   └── Collect in lanes array
│
├── Generate .parallel() call:
│   .parallel([
│     ${lane1StepChain},
│     ${lane2StepChain},
│     ...
│   ])
│
└── Return parallel code string
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-13.1 | Branch steps produce `.branch()` code | Branch node generates conditional |
| AC-13.2 | Branch conditions reference step outputs | Uses getStepResult |
| AC-13.3 | Parallel groups produce `.parallel()` code | Parallel container works |
| AC-13.7 | Control flow preserves data mappings | Mappings in branches work |

### User Flows

#### Flow A.1: Branch with Step Output Condition

```
1. Input: Workflow with Branch node, condition based on step output
2. Branch generator extracts condition: step-1.data.status === "approved"
3. Generates: getStepResult("step-1")?.data.status === "approved"
4. Each path's steps become array in branch options
5. Output: Complete .branch() call with condition and paths
```

---

## Part B: Loop and ForEach

### Goal

Add transpilation support for iterative control flow—loops that repeat until a condition and forEach that processes arrays.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/[workflowId]/update/services/transpiler/loop-generator.ts` | Create | Generates Mastra .dountil() or .dowhile() code for iterative workflows. Extracts LoopConfig, generates step chain for loop body, handles nested control flow within loops, and generates termination condition with maxIterations safety. | ~180 |
| `app/api/workflows/[workflowId]/update/services/transpiler/foreach-generator.ts` | Create | Generates Mastra .foreach() code for array iteration. Extracts ForEachConfig, resolves array source expression, generates step chain for iteration body, handles nested control flow within foreach, and supports concurrency option. | ~150 |

### Pseudocode

#### `app/api/workflows/[workflowId]/update/services/transpiler/loop-generator.ts`

```
generateLoopCode(step: WorkflowStep, definition: WorkflowDefinition, context: TranspilerContext): string
├── Extract LoopConfig from step.controlConfig
├── Get child steps (steps where parentId === step.id)
│
├── Generate step chain for loop body:
│   ├── For each child step:
│   │   ├── If child is control flow: Recursively call appropriate generator
│   │   ├── Else: Get step variable from context.stepVarMap
│   │   ├── Add data mappings if bindings exist
│   │   └── Chain with .then()
│   └── If single step: use step variable directly
│   └── If multiple steps: create inline workflow chain
│
├── Generate termination condition:
│   ├── Parse LoopConfig.condition expression
│   ├── Replace step output references with getStepResult()
│   ├── Add maxIterations safety check:
│   │   └── `iterationCount >= ${maxIterations} || (${parsedCondition})`
│   └── Return condition function
│
├── Generate .dountil() or .dowhile() call:
│   If LoopConfig.type === "until":
│     .dountil(${bodyStepChain}, async ({ getStepResult, inputData, iterationCount }) => {
│       if (iterationCount >= ${maxIterations}) {
│         throw new Error("Maximum iterations reached");
│       }
│       return ${terminationCondition};
│     })
│   Else (type === "while"):
│     .dowhile(${bodyStepChain}, async ({ getStepResult, inputData, iterationCount }) => {
│       if (iterationCount >= ${maxIterations}) {
│         throw new Error("Maximum iterations reached");
│       }
│       return ${terminationCondition};
│     })
│
└── Return loop code string
```

#### `app/api/workflows/[workflowId]/update/services/transpiler/foreach-generator.ts`

```
generateForEachCode(step: WorkflowStep, definition: WorkflowDefinition, context: TranspilerContext): string
├── Extract ForEachConfig from step.controlConfig
├── Get child steps (steps where parentId === step.id)
│
├── Generate step chain for foreach body:
│   ├── For each child step:
│   │   ├── If child is control flow: Recursively call appropriate generator
│   │   ├── Else: Get step variable from context.stepVarMap
│   │   ├── Add data mappings if bindings exist
│   │   └── Chain with .then()
│   └── If single step: use step variable directly
│   └── If multiple steps: create inline workflow chain
│
├── Resolve array source expression:
│   ├── Parse ForEachConfig.arraySource (e.g., "step-1.data.items" or "items")
│   ├── If starts with "step-": Extract stepId and path
│   │   └── Generate: `getStepResult("${stepId}")?.${path}`
│   └── Else (workflow input): Generate: `inputData["${arraySource}"]`
│
├── Generate .foreach() call:
│   .foreach(
│     async ({ getStepResult, inputData }) => {
│       const ${itemVariable} = ${arrayExpression};
│       return Array.isArray(${itemVariable}) ? ${itemVariable} : [];
│     },
│     ${bodyStepChain},
│     { concurrency: ${ForEachConfig.concurrency} }
│   )
│
└── Return foreach code string
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-13.4 | Loop steps produce `.dountil()` code | Loop container generates |
| AC-13.5 | ForEach steps produce `.foreach()` code | ForEach container generates |
| AC-13.6 | Nested control flow generates correctly | Nested structures work |

### User Flows

#### Flow B.1: ForEach Over API Results

```
1. Input: Workflow with ForEach iterating over fetched items
2. ForEach node has: source = step-1.data.items, body = processItemStep
3. Generates array source: getStepResult("step-1")?.data.items
4. Body step variable retrieved from context
5. Output: .foreach((...) => items, processItemStep)
```

---

## Out of Scope

- **Runtime optimization** → Trust Mastra's execution
- **Loop debugging UI** → Future enhancement
- **Infinite loop detection** → Rely on max iterations
- **Parallel lane balancing** → Not needed for MVP
- **Custom control flow types** → Future consideration

---

## References

- **Phase 8**: Base transpiler that this phase extends
- **Phase 5**: Visual representations of control flow in Rail View
- **Mastra Primitives**: `_docs/Engineering/Integrations/API Docs/Mastra/Workflow-Primitives.md`
- **Research**: `15.5-workflows-f-transpilation-research.md`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-07 | Initial creation, extracted from Phase 8 scope | Assistant |
| 2025-12-08 | Updated file paths to match actual structure, added product-focused descriptions, enhanced pseudocode for nested control flow, referenced existing types file | Assistant |
| 2025-12-08 | Renamed from Phase 11 to Phase 12, updated acceptance criteria numbering, added Phase 11 as dependency | Assistant |
| 2025-12-08 | Renamed from Phase 12 to Phase 13, updated dependencies to include Phase 12 (Runtime Workflow Construction) | Assistant |

---

**Last Updated:** December 8, 2025

