# Task: Control Flow Visual Primitives

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/workflow-creation/03-composition/09-Control-Flow-Visual-Primitives.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Validation

### Approach Validation

**✅ Technical Approach:**
- Mastra provides built-in control flow primitives (branch, foreach, parallel, etc.)
- XYFlow canvas supports custom node types with visual configuration
- Workflow transpiler can generate Mastra control flow code

**✅ Architecture Decisions:**
- Visual control flow as drag-and-drop canvas primitives
- Nested workflow representation maintains readability
- Transpilation maps visual structures to Mastra API calls

**✅ Integration Points:**
- Existing workflow.json schema ready for control flow extension
- Step generator can incorporate control flow transpilation
- Canvas editor supports custom node types and connections

### Current State Analysis

**Existing Infrastructure:**
- XYFlow-based workflow canvas with node/edge management
- Workflow transpilation system in step-generator.ts
- Basic workflow.json schema with controlFlow field

**Missing Components:**
- No visual control flow node types in editor
- No transpilation logic for Mastra control flow primitives
- No nested workflow visualization capabilities

### Deterministic Decisions

**Visual Design:**
- Diamond shapes for conditional branches
- Rounded rectangles for loops with iteration indicators
- Parallel connector for concurrent execution visualization

**Transpilation:**
- Map visual structures to Mastra control flow methods
- Preserve execution order and dependency resolution
- Generate type-safe condition and iteration logic

**User Experience:**
- Drag-and-drop from toolbar to canvas
- Visual connection of control flow to regular steps
- Inline configuration of conditions and parameters

---

## Overview

### Goal

Implement visual control flow primitives (branch, loop, parallel, error handling) in the workflow editor. Users can drag these nodes onto the canvas, configure them visually, and the system transpiles them to valid Mastra workflow code.

### Relevant Research

Mastra supports control flow through primitives:
- `.branch({ if, then, else })` for conditionals
- `.foreach({ source, step })` for iteration
- `.dountil()` and `.dowhile()` for loops
- `.parallel([])` for concurrent execution

Current workflow.json structure has a `controlFlow` field that needs expansion to support these primitives. The step-generator.ts needs updates to transpile control flow into Mastra code.

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/types/workflow.ts` | Modify | Add control flow types | A |
| `app/api/workflows/types/control-flow.ts` | Create | Detailed control flow types | A |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/services/step-generator.ts` | Modify | Transpile control flow | A |
| `app/api/workflows/services/control-flow-transpiler.ts` | Create | Control flow specific transpilation | A |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/components/nodes/BranchNode.tsx` | Create | Branch node component | B |
| `app/(pages)/workflows/editor/components/nodes/LoopNode.tsx` | Create | Loop node component | B |
| `app/(pages)/workflows/editor/components/nodes/ParallelNode.tsx` | Create | Parallel node component | B |
| `app/(pages)/workflows/editor/components/nodes/ErrorHandlerNode.tsx` | Create | Error handler component | B |
| `app/(pages)/workflows/editor/components/ConditionEditor.tsx` | Create | Condition configuration | B |
| `app/(pages)/workflows/editor/components/ControlFlowToolkit.tsx` | Create | Palette of primitives | B |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/store/slices/canvas-slice.ts` | Modify | Handle control flow nodes | B |

---

## Part A: Backend Control Flow Transpilation

### Goal

Extend the workflow type system and step generator to support control flow primitives.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/types/control-flow.ts` | Create | Control flow types | ~150 |
| `app/api/workflows/types/workflow.ts` | Modify | Integrate control flow | ~30 |
| `app/api/workflows/services/control-flow-transpiler.ts` | Create | Transpilation | ~350 |
| `app/api/workflows/services/step-generator.ts` | Modify | Use transpiler | ~50 |

### Pseudocode

#### `app/api/workflows/types/control-flow.ts`

```typescript
// Base control flow node
interface ControlFlowNode {
  id: string;
  type: ControlFlowType;
  position: { x: number; y: number };
}

type ControlFlowType = 'branch' | 'foreach' | 'dountil' | 'dowhile' | 'parallel' | 'errorHandler';

// Branch (If/Else)
interface BranchNode extends ControlFlowNode {
  type: 'branch';
  condition: BranchCondition;
  trueBranch: string[];      // Step IDs
  falseBranch: string[];     // Step IDs
  mergePoint?: string;       // Step ID where branches join
}

interface BranchCondition {
  mode: 'expression' | 'code';
  // Expression mode
  expression?: {
    source: string;          // "stepId.outputField"
    operator: ComparisonOperator;
    value: any;
  };
  // Code mode
  code?: string;             // Custom JS condition
}

type ComparisonOperator =
  | 'equals' | 'notEquals'
  | 'greaterThan' | 'lessThan' | 'greaterOrEqual' | 'lessOrEqual'
  | 'contains' | 'notContains'
  | 'isEmpty' | 'isNotEmpty'
  | 'matches' | 'exists';

// Loops
interface ForEachNode extends ControlFlowNode {
  type: 'foreach';
  source: string;            // Path to array: "stepId.items"
  itemVariable: string;      // Variable name: "item"
  indexVariable?: string;    // Index variable: "index"
  body: string[];            // Step IDs in loop body
  maxIterations?: number;    // Safety limit
}

interface DoUntilNode extends ControlFlowNode {
  type: 'dountil';
  condition: BranchCondition;
  body: string[];
  maxIterations?: number;
}

interface DoWhileNode extends ControlFlowNode {
  type: 'dowhile';
  condition: BranchCondition;
  body: string[];
  maxIterations?: number;
}

// Parallel
interface ParallelNode extends ControlFlowNode {
  type: 'parallel';
  branches: ParallelBranch[];
  joinStrategy: 'all' | 'any' | 'race';
}

interface ParallelBranch {
  id: string;
  steps: string[];           // Step IDs in this branch
  name?: string;
}

// Error Handler
interface ErrorHandlerNode extends ControlFlowNode {
  type: 'errorHandler';
  protectedSteps: string[];  // Steps in try block
  handlerSteps: string[];    // Steps in catch block
  errorFilter?: string[];    // Error types to catch
  retryConfig?: RetryConfig;
}

interface RetryConfig {
  maxRetries: number;
  delay: number;             // ms
  backoff: 'fixed' | 'linear' | 'exponential';
  maxDelay?: number;
}
```

#### `app/api/workflows/services/control-flow-transpiler.ts`

```
class ControlFlowTranspiler {
  transpile(controlNodes: ControlFlowNode[], steps: Step[]): string
  ├── Build dependency graph
  │   ├── Map steps to control flow containers
  │   └── Determine execution order
  ├── Generate code for each control node
  │   ├── branch → generateBranch()
  │   ├── foreach → generateForEach()
  │   ├── dountil → generateDoUntil()
  │   ├── dowhile → generateDoWhile()
  │   ├── parallel → generateParallel()
  │   └── errorHandler → generateErrorHandler()
  └── Return combined transpiled code

  generateBranch(node: BranchNode, steps: Step[]): string
  ├── Generate condition function
  │   ├── If expression mode
  │   │   └── Build comparison: `getStepResult('id').field ${op} value`
  │   └── If code mode
  │       └── Use user's code directly
  ├── Generate branch structure
  │   ```typescript
  │   .branch({
  │     if: async ({ inputData, getStepResult }) => {
  │       return ${conditionCode};
  │     },
  │     then: ${generateStepChain(trueBranch)},
  │     else: ${generateStepChain(falseBranch)}
  │   })
  │   ```
  └── Return code string

  generateForEach(node: ForEachNode, steps: Step[]): string
  ├── Generate source accessor
  ├── Generate body step chain
  │   ```typescript
  │   .foreach({
  │     source: async ({ inputData, getStepResult }) => {
  │       return ${sourceAccessor};
  │     },
  │     step: ${generateStepChain(node.body)},
  │     itemVariable: '${node.itemVariable}'
  │   })
  │   ```
  └── Return code string

  generateDoUntil(node: DoUntilNode, steps: Step[]): string
  ├── Generate condition function
  ├── Generate body step chain
  │   ```typescript
  │   .dountil({
  │     condition: async ({ inputData, getStepResult }) => {
  │       return ${conditionCode};
  │     },
  │     step: ${generateStepChain(node.body)}
  │   })
  │   ```
  └── Return code string

  generateParallel(node: ParallelNode, steps: Step[]): string
  ├── Generate step chains for each branch
  │   ```typescript
  │   .parallel([
  │     ${branches.map(b => generateStepChain(b.steps)).join(',\n')}
  │   ])
  │   ```
  └── Return code string

  generateErrorHandler(node: ErrorHandlerNode, steps: Step[]): string
  ├── Generate try steps
  ├── Generate catch handler
  ├── If retryConfig
  │   └── Wrap in retry logic
  │   ```typescript
  │   // Generate wrapper step with retry
  │   const protectedStep = createStep({
  │     id: '${node.id}',
  │     execute: async (ctx) => {
  │       let lastError;
  │       for (let i = 0; i < ${retryConfig.maxRetries}; i++) {
  │         try {
  │           return await executeProtectedSteps(ctx);
  │         } catch (e) {
  │           lastError = e;
  │           await delay(${calculateDelay(i)});
  │         }
  │       }
  │       return executeHandlerSteps(ctx, lastError);
  │     }
  │   });
  │   ```
  └── Return code string

  private generateStepChain(stepIds: string[]): string
  ├── Look up steps by ID
  ├── Chain with .then()
  └── Return chain code
}
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Branch transpiles correctly | Create branch, verify .branch() in output |
| AC-A.2 | ForEach transpiles correctly | Create foreach, verify .foreach() in output |
| AC-A.3 | Parallel transpiles correctly | Create parallel, verify .parallel() in output |
| AC-A.4 | Nested control flow works | Branch inside loop, verify nested code |
| AC-A.5 | Condition expression works | Set equals condition, verify correct code |
| AC-A.6 | Generated code executes | Run transpiled workflow, verify correct path |

---

## Part B: Frontend Control Flow Components

### Goal

Create visual components for each control flow type and integrate them into the canvas.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows/editor/components/nodes/BranchNode.tsx` | Create | Branch UI | ~180 |
| `app/(pages)/workflows/editor/components/nodes/LoopNode.tsx` | Create | Loop UI | ~200 |
| `app/(pages)/workflows/editor/components/nodes/ParallelNode.tsx` | Create | Parallel UI | ~180 |
| `app/(pages)/workflows/editor/components/ConditionEditor.tsx` | Create | Condition UI | ~200 |
| `app/(pages)/workflows/editor/components/ControlFlowToolkit.tsx` | Create | Palette | ~100 |

### Pseudocode

#### `app/(pages)/workflows/editor/components/nodes/BranchNode.tsx`

```
BranchNode({ id, data, selected })
├── Diamond shape container
│   ├── CSS: rotated square or SVG diamond
│   └── Border: yellow theme
├── Content
│   ├── Condition preview
│   │   ├── "If {source} {operator} {value}"
│   │   └── Click to edit
│   ├── Two output handles
│   │   ├── Top-right: "True" (green)
│   │   └── Bottom-right: "False" (red)
│   └── One input handle (left)
├── Selected state
│   └── Show ConditionEditor panel
├── Visual indicators
│   ├── Green checkmark on true handle
│   ├── Red X on false handle
│   └── Condition summary text
└── On handle connect
    ├── If true handle → add to trueBranch
    └── If false handle → add to falseBranch
```

#### `app/(pages)/workflows/editor/components/nodes/LoopNode.tsx`

```
LoopNode({ id, data, selected })
├── Container with loop indicator
│   ├── Rounded rectangle with cycle icon
│   └── Border: blue theme
├── Loop type selector
│   ├── ForEach: "For each item in..."
│   ├── DoUntil: "Do until..."
│   └── DoWhile: "While..."
├── Configuration (based on type)
│   ├── ForEach
│   │   ├── Source array selector
│   │   └── Item variable name
│   ├── DoUntil/DoWhile
│   │   └── Condition editor
├── Body area
│   ├── Drop zone for steps
│   ├── Visual container for child nodes
│   └── "Add step" button
├── Handles
│   ├── Input: top
│   ├── Loop back: internal dashed arrow
│   └── Output: bottom (after loop completes)
└── Safety indicator
    └── Max iterations warning if set
```

#### `app/(pages)/workflows/editor/components/nodes/ParallelNode.tsx`

```
ParallelNode({ id, data, selected })
├── Wide container with lanes
│   ├── Horizontal dividers for each branch
│   └── Border: green theme
├── Header
│   ├── "Parallel" label
│   └── Add branch button
├── Branches
│   ├── For each branch
│   │   ├── Lane container
│   │   ├── Branch name (editable)
│   │   ├── Drop zone for steps
│   │   └── Remove branch button
│   └── Visual separator between lanes
├── Join point
│   ├── Strategy selector: All / Any / Race
│   └── Output handle
├── Handles
│   ├── Input: left (splits to all branches)
│   └── Output: right (after join)
└── Visual flow
    └── Lines showing split and merge
```

#### `app/(pages)/workflows/editor/components/ConditionEditor.tsx`

```
ConditionEditor({ condition, onChange })
├── Mode toggle: Expression / Code
├── Expression mode
│   ├── Source selector
│   │   ├── Dropdown of available step outputs
│   │   ├── Nested field selector
│   │   └── Preview of selected value
│   ├── Operator selector
│   │   ├── Dropdown: equals, contains, etc.
│   │   └── Icon for each operator
│   ├── Value input
│   │   ├── Type-appropriate input
│   │   ├── String: text input
│   │   ├── Number: number input
│   │   ├── Boolean: checkbox
│   │   └── Regex: pattern input with test
│   └── Preview: "If step1.count > 5"
├── Code mode
│   ├── Monaco editor (small)
│   ├── Available variables hint
│   │   └── inputData, getStepResult, etc.
│   └── Syntax validation
└── Test button
    └── Evaluate condition with sample data
```

#### `app/(pages)/workflows/editor/components/ControlFlowToolkit.tsx`

```
ControlFlowToolkit()
├── Section header: "Control Flow"
├── Draggable items
│   ├── Branch
│   │   ├── Diamond icon
│   │   ├── "Branch" label
│   │   └── Tooltip: "Add conditional logic"
│   ├── ForEach Loop
│   │   ├── Loop icon
│   │   ├── "For Each" label
│   │   └── Tooltip: "Iterate over items"
│   ├── Do Until
│   │   ├── Cycle icon
│   │   ├── "Do Until" label
│   │   └── Tooltip: "Repeat until condition"
│   ├── Parallel
│   │   ├── Parallel lines icon
│   │   ├── "Parallel" label
│   │   └── Tooltip: "Execute simultaneously"
│   └── Error Handler
│       ├── Shield icon
│       ├── "Try/Catch" label
│       └── Tooltip: "Handle errors"
├── Each item is draggable
│   └── On drop → create node on canvas
└── Collapsed state for sidebar
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Branch node renders | Drag branch, verify diamond shape |
| AC-B.2 | Branch connects correctly | Connect to true/false outputs, verify stored |
| AC-B.3 | Loop node shows body | Add steps to loop, verify contained |
| AC-B.4 | Parallel lanes work | Add 3 branches, verify visual lanes |
| AC-B.5 | Condition editor works | Set expression condition, verify saved |
| AC-B.6 | Toolkit is draggable | Drag from toolkit, verify node created |

---

## User Flows

### Flow 1: Add Branch to Workflow

```
1. User drags "Branch" from ControlFlowToolkit
2. BranchNode appears on canvas (diamond shape)
3. User clicks node to select
4. ConditionEditor opens in side panel
5. User selects source: "extractStep.hasApplied"
6. User selects operator: "equals"
7. User enters value: true
8. Preview shows: "If extractStep.hasApplied equals true"
9. User connects true output to "Skip" step
10. User connects false output to "Apply" step
11. Save → workflow.json updated with branch
12. Transpile → .branch() code generated
```

---

## Out of Scope

- Switch/case (multiple conditions)
- Break/continue statements
- Recursive workflows
- Custom join strategies

---

## Open Questions

- [ ] How do we handle steps that exist in multiple branches?
- [ ] Should we support drag-to-nest for loop bodies?
- [ ] How do we validate control flow graph integrity?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-11 | Initial creation | Claude |
