# Task: Workflows as Callable Nodes

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/workflow-creation/03-composition/10-Workflows-as-Callable-Nodes.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Overview

### Goal

Enable workflows to be used as steps within other workflows. Users can drag existing workflows from a toolkit panel onto the canvas, connect them like any other node, and have them execute inline at runtime.

### Relevant Research

The workflow system stores workflows in `_tables/workflows/` with a registry pattern. Each workflow has a defined inputSchema and outputSchema. To use workflows as nodes:
1. Extend the step type to include 'workflow'
2. Store workflow references with ID
3. Transpile to inline execution calls
4. Track dependencies for impact analysis

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/types/workflow.ts` | Modify | Add workflow step type | A |
| `_tables/workflows/types.ts` | Modify | Add usage tracking fields | A |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/callable/route.ts` | Create | List callable workflows | A |
| `app/api/workflows/[id]/usage/route.ts` | Create | Get workflow usage | A |
| `app/api/workflows/extract/route.ts` | Create | Extract selection to workflow | A |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/services/step-generator.ts` | Modify | Transpile workflow steps | A |
| `app/api/workflows/services/dependency-tracker.ts` | Create | Track workflow dependencies | A |
| `app/api/workflows/services/workflow-executor.ts` | Modify | Execute nested workflows | A |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/components/MyWorkflowsPanel.tsx` | Create | Toolkit panel | B |
| `app/(pages)/workflows/editor/components/nodes/WorkflowNode.tsx` | Create | Workflow node | B |
| `app/(pages)/workflows/editor/components/ExtractWorkflowDialog.tsx` | Create | Extract dialog | B |
| `app/(pages)/workflows/editor/components/UsageWarning.tsx` | Create | Usage warning | B |

---

## Part A: Backend Workflow Composition System

### Goal

Extend the workflow system to support workflow steps and track dependencies.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/types/workflow.ts` | Modify | Add types | ~50 |
| `app/api/workflows/callable/route.ts` | Create | List endpoint | ~60 |
| `app/api/workflows/extract/route.ts` | Create | Extract endpoint | ~120 |
| `app/api/workflows/services/dependency-tracker.ts` | Create | Dependency logic | ~150 |
| `app/api/workflows/services/step-generator.ts` | Modify | Transpile workflow steps | ~80 |

### Pseudocode

#### `app/api/workflows/types/workflow.ts` (additions)

```typescript
// Add to existing types

interface WorkflowStep extends BaseStep {
  type: 'workflow';
  workflowId: string;         // Reference to nested workflow
  workflowName: string;       // Display name
  inputSchema: JSONSchema;    // Copied from nested workflow
  outputSchema: JSONSchema;   // Copied from nested workflow
}

interface WorkflowMetadata {
  // Add to existing
  usedBy: string[];           // IDs of workflows using this
  dependsOn: string[];        // IDs of workflows this calls
  usageCount: number;         // Total usage count
  visibility: 'private' | 'shared';
}
```

#### `app/api/workflows/callable/route.ts`

```
GET /api/workflows/callable
├── Authenticate user
├── Get userId, orgId
├── Fetch user's workflows
│   ├── Filter: createdBy = userId OR visibility = 'shared'
│   └── Exclude: current workflow (prevent self-reference)
├── For each workflow
│   ├── Include: id, name, description
│   ├── Include: inputSchema, outputSchema
│   └── Include: usageCount
├── Sort by: recent usage, then alphabetical
└── Return list

Response: {
  workflows: CallableWorkflow[]
}

interface CallableWorkflow {
  id: string;
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  usageCount: number;
  createdBy: string;
  createdAt: string;
}
```

#### `app/api/workflows/extract/route.ts`

```
POST /api/workflows/extract
├── Parse request
│   ├── sourceWorkflowId: string
│   ├── stepIds: string[]        // Steps to extract
│   ├── name: string             // Name for new workflow
│   ├── description?: string
├── Load source workflow
├── Extract selected steps
│   ├── Get steps by ID
│   ├── Validate they form connected subgraph
│   └── Preserve internal connections
├── Derive schemas
│   ├── Input: first step's required inputs (not from source workflow)
│   ├── Output: last step's outputs
├── Create new workflow
│   ├── Steps: extracted steps
│   ├── Schemas: derived
│   └── Metadata: createdBy, createdAt
├── Update source workflow
│   ├── Replace extracted steps with workflow node
│   ├── Connect surrounding steps to new node
│   └── Update bindings
├── Save both workflows
└── Return new workflow ID

Response: {
  newWorkflowId: string;
  updatedSourceWorkflow: WorkflowDefinition;
}
```

#### `app/api/workflows/services/dependency-tracker.ts`

```
class DependencyTracker {
  async updateDependencies(workflow: WorkflowDefinition): Promise<void>
  ├── Find all workflow steps
  │   └── steps.filter(s => s.type === 'workflow')
  ├── Get current dependsOn list
  ├── Calculate new dependsOn
  │   └── workflowSteps.map(s => s.workflowId)
  ├── Find added/removed dependencies
  ├── For removed dependencies
  │   └── Remove this workflow from their usedBy
  ├── For added dependencies
  │   ├── Check for circular dependency
  │   │   └── If circular, throw error
  │   └── Add this workflow to their usedBy
  └── Save updated metadata

  detectCircularDependency(
    sourceId: string,
    targetId: string
  ): boolean
  ├── Build visited set
  ├── BFS from targetId
  │   ├── If reach sourceId → circular
  │   └── Continue through all dependsOn
  └── Return false if no cycle found

  async getUsage(workflowId: string): Promise<WorkflowUsage>
  ├── Get workflow metadata
  ├── Get usedBy list
  ├── For each usage
  │   └── Get workflow name and context
  └── Return usage info

  async getImpactedWorkflows(workflowId: string): Promise<string[]>
  ├── Get direct usedBy
  ├── Recursively get their usedBy
  └── Return all impacted workflow IDs
}
```

#### `app/api/workflows/services/step-generator.ts` (additions)

```
// Add to existing transpilation logic

transpileWorkflowStep(step: WorkflowStep): string
├── Generate step definition
│   ```typescript
│   const ${stepVarName} = createStep({
│     id: '${step.id}',
│     inputSchema: ${JSON.stringify(step.inputSchema)},
│     outputSchema: ${JSON.stringify(step.outputSchema)},
│     execute: async ({ inputData, runtimeContext }) => {
│       // Import and execute nested workflow
│       const { ${nestedWorkflowExport} } = await import(
│         '@/_tables/workflows/${step.workflowId}/workflow'
│       );
│
│       const run = ${nestedWorkflowExport}.createRun();
│       run.context = runtimeContext;
│       const result = await run.start({ inputData });
│
│       return result.results;
│     }
│   });
│   ```
└── Return code string
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Callable endpoint returns workflows | GET callable, verify list |
| AC-A.2 | Circular dependency detected | Try A→B→A, verify error |
| AC-A.3 | Workflow step transpiles | Create workflow step, verify code |
| AC-A.4 | Extract creates new workflow | Extract 3 steps, verify new workflow |
| AC-A.5 | Usage tracking updates | Add workflow step, verify usedBy updated |
| AC-A.6 | Nested workflow executes | Run parent, verify nested executes |

---

## Part B: Frontend Workflow Toolkit

### Goal

Create UI components for browsing, using, and extracting workflows.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows/editor/components/MyWorkflowsPanel.tsx` | Create | Toolkit panel | ~180 |
| `app/(pages)/workflows/editor/components/nodes/WorkflowNode.tsx` | Create | Node component | ~150 |
| `app/(pages)/workflows/editor/components/ExtractWorkflowDialog.tsx` | Create | Extract dialog | ~200 |
| `app/(pages)/workflows/editor/components/UsageWarning.tsx` | Create | Warning banner | ~80 |

### Pseudocode

#### `app/(pages)/workflows/editor/components/MyWorkflowsPanel.tsx`

```
MyWorkflowsPanel()
├── State: workflows, searchQuery, selectedWorkflow
├── Fetch callable workflows on mount
├── Layout
│   ├── Header
│   │   ├── "My Workflows" title
│   │   └── Search input
│   ├── Workflow list
│   │   ├── Filter by searchQuery
│   │   ├── For each workflow
│   │   │   ├── Draggable item
│   │   │   ├── Workflow icon
│   │   │   ├── Name
│   │   │   ├── Usage count badge
│   │   │   └── Expand for preview
│   │   └── Empty state if no workflows
│   └── Selected workflow preview
│       ├── Name and description
│       ├── Input schema preview
│       ├── Output schema preview
│       └── "Edit Workflow" link
├── On drag start
│   └── Set drag data: { type: 'workflow', workflowId }
└── On drop (handled by canvas)
    └── Create WorkflowNode at drop position
```

#### `app/(pages)/workflows/editor/components/nodes/WorkflowNode.tsx`

```
WorkflowNode({ id, data, selected })
├── Container with workflow styling
│   ├── Distinct background color (purple tint)
│   ├── Workflow icon in corner
│   └── Rounded borders
├── Content
│   ├── Workflow name
│   ├── Description preview (truncated)
│   ├── Schema indicators
│   │   ├── Input count: "3 inputs"
│   │   ├── Output count: "2 outputs"
│   │   └── Expand to see fields
│   └── "Open" link to edit nested workflow
├── Handles
│   ├── Input handle (left)
│   └── Output handle (right)
├── Expanded view (on click)
│   ├── Full input schema
│   ├── Full output schema
│   └── Usage info
└── Context menu
    ├── "Open workflow"
    ├── "Replace with steps" (inline)
    └── "Remove"
```

#### `app/(pages)/workflows/editor/components/ExtractWorkflowDialog.tsx`

```
ExtractWorkflowDialog({ selectedSteps, onConfirm, onCancel })
├── Dialog overlay
├── Header: "Create Reusable Workflow"
├── Form
│   ├── Name input (required)
│   ├── Description textarea (optional)
│   ├── Derived schemas display
│   │   ├── Input schema (from first step)
│   │   │   ├── Show fields
│   │   │   └── Allow renaming
│   │   └── Output schema (from last step)
│   │       ├── Show fields
│   │       └── Allow selecting outputs
│   └── Visibility selector
│       ├── Private (default)
│       └── Shared with organization
├── Preview
│   └── Show how new workflow node will look
├── Actions
│   ├── "Create Workflow" (primary)
│   └── "Cancel"
└── On confirm
    ├── Call POST /api/workflows/extract
    ├── Update canvas with workflow node
    └── Close dialog
```

#### `app/(pages)/workflows/editor/components/UsageWarning.tsx`

```
UsageWarning({ workflowId, usageCount, onDismiss })
├── Banner at top of editor
├── Content
│   ├── Warning icon
│   ├── Message: "This workflow is used in {count} other workflows"
│   ├── "View usages" link
│   └── Dismiss button
├── View usages expands to show
│   ├── List of parent workflows
│   │   ├── Workflow name
│   │   └── "Open" link
│   └── Impact warning if breaking changes
└── Styling
    ├── Yellow background
    └── Dismissible but reappears on save
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Panel shows workflows | Open panel, verify workflows listed |
| AC-B.2 | Drag creates node | Drag workflow, verify node on canvas |
| AC-B.3 | Node shows schemas | Click node, verify I/O displayed |
| AC-B.4 | Extract dialog works | Select steps, click extract, verify dialog |
| AC-B.5 | Usage warning appears | Edit used workflow, verify warning |
| AC-B.6 | Search filters list | Type query, verify filtered |

---

## User Flows

### Flow 1: Use Workflow as Node

```
1. User opens workflow editor
2. User opens "My Workflows" in toolkit sidebar
3. User sees "Process Invoice" workflow
4. User drags it onto canvas
5. WorkflowNode appears
6. User connects previous step output to workflow input
7. User connects workflow output to next step
8. Save → workflow.json includes workflow step
9. Run → nested workflow executes inline
```

### Flow 2: Extract to Workflow

```
1. User selects 3 connected steps on canvas
2. User right-clicks → "Extract as Workflow"
3. ExtractWorkflowDialog opens
4. User enters name: "Data Validation"
5. User reviews derived schemas
6. User clicks "Create Workflow"
7. System creates new workflow
8. Original steps replaced with WorkflowNode
9. New workflow available in toolkit
```

---

## Out of Scope

- Workflow marketplace
- Version selection
- Dynamic workflow resolution
- Cross-organization sharing

---

## Open Questions

- [ ] How handle nested workflow errors in parent context?
- [ ] Should we allow editing nested workflow inline?
- [ ] How deep can nesting go before performance issues?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-11 | Initial creation | Claude |
