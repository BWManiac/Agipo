# Task: Node Decomposition

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/workflow-creation/02-node-system/08-Node-Decomposition.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Overview

### Goal

Build a feature that allows users to decompose high-level workflow nodes into granular sub-steps. Users right-click a node, select "Decompose", review AI-proposed sub-steps, and apply the decomposition to replace the original node with a detailed sub-workflow.

### Relevant Research

The workflow system supports sequential steps and can theoretically support grouped nodes. Decomposition builds on the natural language generation system to produce sub-steps, but focuses on breaking down existing nodes rather than generating from scratch.

Key patterns:
- Workflow generation uses LLM to create step sequences
- Canvas supports node grouping via XYFlow
- Schema propagation through `.map()` blocks

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/types/decomposition.ts` | Create | Decomposition types | A |
| `app/api/workflows/types/workflow.ts` | Modify | Add group node type | A |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/decompose/route.ts` | Create | Decompose endpoint | A |
| `app/api/workflows/decompose/apply/route.ts` | Create | Apply decomposition | A |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/services/decomposer.ts` | Create | Decomposition logic | A |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/store/slices/canvas-slice.ts` | Modify | Handle group nodes | B |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/components/DecompositionPreview.tsx` | Create | Preview dialog | B |
| `app/(pages)/workflows/editor/components/NodeGroup.tsx` | Create | Group node component | B |
| `app/(pages)/workflows/editor/components/NodeContextMenu.tsx` | Modify | Add decompose option | B |

---

## Part A: Backend Decomposition System

### Goal

Build the service that analyzes a node and proposes decomposition into sub-steps.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/types/decomposition.ts` | Create | Types | ~80 |
| `app/api/workflows/decompose/route.ts` | Create | Endpoint | ~80 |
| `app/api/workflows/decompose/apply/route.ts` | Create | Apply endpoint | ~100 |
| `app/api/workflows/services/decomposer.ts` | Create | Core logic | ~300 |

### Pseudocode

#### `app/api/workflows/types/decomposition.ts`

```typescript
interface DecompositionRequest {
  nodeId: string;
  workflowId: string;
  depth?: 'shallow' | 'medium' | 'deep';
  hints?: string[];  // User guidance
}

interface DecompositionResult {
  originalNode: StepDefinition;
  proposedSteps: ProposedStep[];
  confidence: number;
  warnings?: string[];
  alternativeApproaches?: string[];
}

interface ProposedStep {
  id: string;
  name: string;
  description: string;
  type: NodeType;
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  estimatedComplexity: 'simple' | 'medium' | 'complex';
  canDecomposeForther: boolean;
  toolId?: string;          // For composio steps
  code?: string;            // For custom steps
}

interface ApplyDecompositionRequest {
  workflowId: string;
  originalNodeId: string;
  proposedSteps: ProposedStep[];
  groupName?: string;
  keepOriginalAsComment?: boolean;
}

interface ApplyDecompositionResult {
  success: boolean;
  newNodes: string[];       // IDs of created nodes
  groupId: string;          // ID of group node
  updatedWorkflow: WorkflowDefinition;
}
```

#### `app/api/workflows/services/decomposer.ts`

```
class Decomposer {
  async decompose(request: DecompositionRequest): Promise<DecompositionResult>
  ├── Load workflow and target node
  ├── Build context
  │   ├── Node name, description
  │   ├── Input/output schemas
  │   ├── Previous/next node context
  │   ├── Available integrations
  │   └── Depth preference
  ├── Call LLM with decomposition prompt
  │   ├── System: decomposition instructions
  │   ├── Context: node and workflow info
  │   └── Output: structured steps
  ├── Post-process proposed steps
  │   ├── Generate IDs for each step
  │   ├── Infer schemas from descriptions
  │   ├── Validate schema flow (in → out)
  │   └── Check against available tools
  ├── Calculate confidence
  │   ├── Based on clarity of descriptions
  │   └── Based on schema compatibility
  └── Return DecompositionResult

  async apply(request: ApplyDecompositionRequest): Promise<ApplyDecompositionResult>
  ├── Load workflow
  ├── Find original node position
  ├── Create group node
  │   ├── Position at original node location
  │   ├── Size based on number of steps
  │   └── Label with groupName or original name
  ├── Create child nodes from proposedSteps
  │   ├── Position within group
  │   ├── Connect sequentially
  │   └── Bind schemas
  ├── Update workflow connections
  │   ├── Redirect incoming edges to first child
  │   ├── Redirect outgoing edges from last child
  │   └── Remove original node
  ├── If keepOriginalAsComment
  │   └── Add comment node with original definition
  ├── Save updated workflow
  └── Return result

  private buildDecompositionPrompt(node: StepDefinition, context: Context): string
  ├── Include original node details
  ├── Include schema constraints
  ├── Include depth guidance
  │   ├── shallow: 2-4 steps
  │   ├── medium: 4-6 steps
  │   └── deep: 6-10 steps
  ├── Include available tools
  └── Include formatting instructions

  private inferStepSchemas(steps: ProposedStep[]): ProposedStep[]
  ├── First step input = original node input
  ├── Last step output = original node output
  ├── Intermediate schemas inferred from descriptions
  └── Return steps with schemas

  private validateSchemaFlow(steps: ProposedStep[]): ValidationResult
  ├── For each adjacent pair of steps
  │   └── Check output compatibility with next input
  ├── Check first step accepts original input
  ├── Check last step produces original output
  └── Return validation result
}
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Decomposition proposes steps | Decompose "Apply to job", verify 4+ steps |
| AC-A.2 | Schemas flow correctly | Verify first step input = original input |
| AC-A.3 | Steps have valid types | Verify each step has recognized type |
| AC-A.4 | Apply creates group | Apply decomposition, verify group created |
| AC-A.5 | Connections preserved | Verify incoming/outgoing edges maintained |
| AC-A.6 | Depth preference respected | Request shallow, verify 2-4 steps |

---

## Part B: Frontend Decomposition UI

### Goal

Create UI for triggering decomposition, previewing results, and displaying group nodes.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows/editor/components/DecompositionPreview.tsx` | Create | Preview dialog | ~200 |
| `app/(pages)/workflows/editor/components/NodeGroup.tsx` | Create | Group component | ~150 |
| `app/(pages)/workflows/editor/components/NodeContextMenu.tsx` | Modify | Add option | ~30 |
| `app/(pages)/workflows/editor/store/slices/canvas-slice.ts` | Modify | Group handling | ~50 |

### Pseudocode

#### `app/(pages)/workflows/editor/components/DecompositionPreview.tsx`

```
DecompositionPreview({ nodeId, onApply, onClose })
├── State: result, isLoading, editedSteps
├── On mount
│   └── Call POST /api/workflows/decompose
├── Layout
│   ├── Header
│   │   ├── "Decompose: {nodeName}"
│   │   └── Close button
│   ├── Original node summary
│   │   ├── Name and description
│   │   ├── Input/output schemas (collapsed)
│   │   └── "This will be replaced with:"
│   ├── Proposed steps list
│   │   ├── For each step
│   │   │   ├── Step number
│   │   │   ├── Name (editable)
│   │   │   ├── Type badge
│   │   │   ├── Description (editable)
│   │   │   ├── Complexity indicator
│   │   │   ├── "Decompose further" link (if applicable)
│   │   │   └── Remove button
│   │   └── "Add step" button
│   ├── Confidence indicator
│   │   └── "High/Medium/Low confidence in this decomposition"
│   ├── Warnings (if any)
│   └── Actions
│       ├── "Apply Decomposition" (primary)
│       ├── "Regenerate" (secondary)
│       └── "Cancel"
├── On step edit
│   └── Update editedSteps
├── On apply
│   ├── Call POST /api/workflows/decompose/apply
│   ├── Update canvas
│   └── Close dialog
```

#### `app/(pages)/workflows/editor/components/NodeGroup.tsx`

```
NodeGroup({ data, selected })
├── State: expanded
├── Collapsed view
│   ├── Group name
│   ├── Step count badge: "5 steps"
│   ├── Expand icon
│   ├── Input/output handles
│   └── Gradient background indicating group
├── Expanded view
│   ├── Group header with name
│   ├── Child nodes rendered inside
│   │   ├── Positioned relative to group
│   │   ├── Connected within group
│   │   └── Scaled to fit
│   ├── Collapse icon
│   └── Resize handles
├── Visual styling
│   ├── Rounded container
│   ├── Subtle background
│   ├── Border indicating depth level
│   └── Shadow for depth
├── Interactions
│   ├── Double-click → toggle expand/collapse
│   ├── Context menu → decompose, ungroup
│   └── Drag → move entire group
└── On expand/collapse
    └── Animate children appearance
```

### Integration with Context Menu

```typescript
// In NodeContextMenu.tsx
const menuItems = [
  // ... existing items
  {
    label: 'Decompose into steps',
    icon: 'decompose',
    onClick: () => openDecompositionPreview(nodeId),
    enabled: node.canDecompose !== false
  },
  // If node is a group:
  {
    label: 'Ungroup',
    icon: 'ungroup',
    onClick: () => ungroupNode(nodeId),
    enabled: node.type === 'group'
  }
];
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Context menu shows option | Right-click node, verify "Decompose" |
| AC-B.2 | Preview dialog opens | Click decompose, verify dialog |
| AC-B.3 | Steps are editable | Edit step name, verify change |
| AC-B.4 | Apply updates canvas | Click apply, verify group node appears |
| AC-B.5 | Group collapses/expands | Double-click group, verify toggle |
| AC-B.6 | Group moves as unit | Drag group, verify children move |

---

## User Flows

### Flow 1: Basic Decomposition

```
1. User right-clicks "Process Order" node
2. Context menu appears with "Decompose into steps"
3. User clicks option
4. DecompositionPreview dialog opens
5. System shows loading, then proposed steps:
   - Validate order
   - Check inventory
   - Process payment
   - Create shipment
   - Send confirmation
6. User reviews steps
7. User removes "Create shipment" (not needed)
8. User clicks "Apply Decomposition"
9. Original node replaced with NodeGroup
10. Group contains 4 connected steps
11. Canvas edges redirect to group
```

---

## Out of Scope

- Automatic decomposition suggestions
- Cross-workflow decomposition
- Decomposition templates
- Visual decomposition (drag to decompose)

---

## Open Questions

- [ ] How do we handle groups within groups visually?
- [ ] Should users be able to partially apply decomposition?
- [ ] How do we handle undo for decomposition?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-11 | Initial creation | Claude |
