# Phase 11: Advanced Control Flow Transpilation

**Status:** 📋 Planned  
**Depends On:** Phase 8 (Transpilation Engine), Phase 9 (Workflow Inputs Enhancement), Phase 10 (Agent Integration)  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Extend the **Transpilation Engine** to support control flow primitives. After Phase 8 handles sequential workflows, this phase adds:

- **Branch** (`.branch()`) - Conditional routing based on data
- **Parallel** (`.parallel()`) - Execute multiple steps concurrently
- **Loop** (`.dountil()`) - Repeat until condition met
- **ForEach** (`.foreach()`) - Iterate over arrays

After this phase:
- Complex workflows with conditional logic can be transpiled
- Parallel execution paths generate correct Mastra code
- Loops and iterations work with proper termination conditions
- All visual control flow containers produce executable code

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Branch structure | Router + merge pattern | Mastra uses explicit branch points and joins |
| Parallel execution | `.parallel([step1, step2])` | Mastra's parallel primitive handles concurrency |
| Loop condition | User-defined expression | Flexible termination logic |
| ForEach iteration | `.foreach(items, step)` | Mastra's native iteration support |
| Nesting | Recursive generation | Control flow can contain other control flow |

### Pertinent Research

- **Mastra `.branch()`**: Takes condition function and routes to different step chains
- **Mastra `.parallel()`**: Accepts array of steps, executes concurrently, waits for all
- **Mastra `.dountil()`**: Repeats step(s) until condition returns true
- **Mastra `.foreach()`**: Iterates array, executing step for each item

*Source: `Workflow-Primitives.md`*

### Overall File Impact

#### Backend / Services (Transpiler Extensions)

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/transpiler/branch-generator.ts` | Create | Generates `.branch()` code with condition routing and merge points | A |
| `app/api/workflows/transpiler/parallel-generator.ts` | Create | Generates `.parallel()` code for concurrent step execution | A |
| `app/api/workflows/transpiler/loop-generator.ts` | Create | Generates `.dountil()` code with termination conditions | B |
| `app/api/workflows/transpiler/foreach-generator.ts` | Create | Generates `.foreach()` code for array iteration | B |
| `app/api/workflows/transpiler/index.ts` | Modify | Integrate control flow generators into main orchestrator | A, B |
| `app/api/workflows/transpiler/workflow-generator.ts` | Modify | Handle nested control flow in composition chain | A, B |

#### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/types/control-flow.ts` | Create | Types for branch conditions, loop configs, parallel groups | A |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-11.1 | Branch steps produce `.branch()` code | Branch node → conditional routing code | A |
| AC-11.2 | Branch conditions reference step outputs | `({ getStepResult }) => getStepResult(...)` | A |
| AC-11.3 | Parallel groups produce `.parallel()` code | Parallel container → `[step1, step2]` array | A |
| AC-11.4 | Loop steps produce `.dountil()` code | Loop container → repeat with condition | B |
| AC-11.5 | ForEach steps produce `.foreach()` code | ForEach container → iteration code | B |
| AC-11.6 | Nested control flow generates correctly | Loop inside branch → valid nested code | B |
| AC-11.7 | Control flow preserves data mappings | Mappings work inside containers | A, B |

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

---

## Part A: Branch and Parallel

### Goal

Add transpilation support for branching (conditional routing) and parallel (concurrent execution) control flow. These are the most common control flow patterns.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/types/control-flow.ts` | Create | Types for branch/parallel configs | ~80 |
| `app/api/workflows/transpiler/branch-generator.ts` | Create | Generate .branch() with conditions | ~150 |
| `app/api/workflows/transpiler/parallel-generator.ts` | Create | Generate .parallel() for lanes | ~100 |
| `app/api/workflows/transpiler/index.ts` | Modify | Detect and route to control flow generators | +50 |
| `app/api/workflows/transpiler/workflow-generator.ts` | Modify | Handle branch/parallel nodes in chain | +80 |

### Pseudocode

#### `app/api/workflows/transpiler/branch-generator.ts`

```
generateBranchCode(branchNode: BranchNode, context: TranspilerContext): string
├── Extract condition expression from branchNode.config
├── Get branch paths (true/false or named paths)
│
├── For each path:
│   ├── Generate steps for path
│   └── Collect in paths object
│
├── Generate .branch() call:
│   .branch(
│     ({ getStepResult, inputData }) => {
│       ${conditionExpression}
│     },
│     {
│       ${for each path}: [${stepsInPath}],
│     }
│   )
│
└── Return branch code

generateConditionExpression(condition: BranchCondition): string
├── If condition.type === "step-output":
│   └── Return `getStepResult("${stepId}")?.${path} ${operator} ${value}`
├── If condition.type === "workflow-input":
│   └── Return `inputData.${inputName} ${operator} ${value}`
└── If condition.type === "expression":
    └── Return condition.expression (user-provided)
```

#### `app/api/workflows/transpiler/parallel-generator.ts`

```
generateParallelCode(parallelNode: ParallelNode, context: TranspilerContext): string
├── Get lanes from parallelNode.children
│
├── For each lane:
│   ├── Generate step variable references
│   └── If lane has multiple steps: chain with .then()
│
├── Generate .parallel() call:
│   .parallel([
│     ${lane1Steps},
│     ${lane2Steps},
│     ...
│   ])
│
└── Return parallel code
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-11.1 | Branch steps produce `.branch()` code | Branch node generates conditional |
| AC-11.2 | Branch conditions reference step outputs | Uses getStepResult |
| AC-11.3 | Parallel groups produce `.parallel()` code | Parallel container works |
| AC-11.7 | Control flow preserves data mappings | Mappings in branches work |

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
| `app/api/workflows/transpiler/loop-generator.ts` | Create | Generate .dountil() with condition | ~120 |
| `app/api/workflows/transpiler/foreach-generator.ts` | Create | Generate .foreach() for arrays | ~100 |
| `app/api/workflows/transpiler/index.ts` | Modify | Add loop/foreach detection | +30 |
| `app/api/workflows/transpiler/workflow-generator.ts` | Modify | Handle loop/foreach in chain | +50 |

### Pseudocode

#### `app/api/workflows/transpiler/loop-generator.ts`

```
generateLoopCode(loopNode: LoopNode, context: TranspilerContext): string
├── Extract loop body (steps inside container)
├── Extract termination condition
│
├── Generate step references for body
│
├── Generate .dountil() call:
│   .dountil(
│     ({ getStepResult, inputData }) => {
│       ${terminationCondition}
│     },
│     ${bodySteps}
│   )
│
└── Return loop code

generateTerminationCondition(condition: LoopCondition): string
├── condition.type === "max-iterations":
│   └── Track iteration count, return count >= max
├── condition.type === "step-output":
│   └── Return `getStepResult("${stepId}")?.${path} ${operator} ${value}`
└── condition.type === "expression":
    └── Return condition.expression
```

#### `app/api/workflows/transpiler/foreach-generator.ts`

```
generateForEachCode(forEachNode: ForEachNode, context: TranspilerContext): string
├── Extract array source (step output or workflow input)
├── Extract body steps
│
├── Generate array expression:
│   └── getStepResult("${stepId}")?.${arrayPath}
│
├── Generate .foreach() call:
│   .foreach(
│     ({ getStepResult }) => ${arrayExpression},
│     ${bodySteps}
│   )
│
└── Return foreach code
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-11.4 | Loop steps produce `.dountil()` code | Loop container generates |
| AC-11.5 | ForEach steps produce `.foreach()` code | ForEach container generates |
| AC-11.6 | Nested control flow generates correctly | Nested structures work |

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

---

**Last Updated:** December 2025

