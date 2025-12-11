# Task: Plain English Canvas — Separate Mode

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/workflow-creation/05-canvas-ux/15-Plain-English-Canvas-Separate-Mode.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Overview

### Goal

Implement a "Simple View" mode that transforms the technical workflow canvas into a scannable, plain-English list of steps. Users can toggle between views, make limited edits in simple view, and export workflows as documentation.

### Relevant Research

The workflow editor uses XYFlow for the technical canvas. Simple view doesn't need XYFlow—it's a linear list representation of the same data. The key challenge is transforming complex workflow structures (branches, loops) into readable linear narrative.

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/types/simple-view.ts` | Create | Simple view types | A |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/store/slices/view-mode-slice.ts` | Create | View mode state | A |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/components/ViewModeToggle.tsx` | Create | Toggle button | A |
| `app/(pages)/workflows/editor/components/SimpleView.tsx` | Create | Simple view container | A |
| `app/(pages)/workflows/editor/components/SimpleStepCard.tsx` | Create | Step card | A |
| `app/(pages)/workflows/editor/components/SimpleDecisionPoint.tsx` | Create | Branch visualization | A |
| `app/(pages)/workflows/editor/components/SimpleLoopIndicator.tsx` | Create | Loop visualization | A |
| `app/(pages)/workflows/editor/components/SimpleExportMenu.tsx` | Create | Export options | B |

### Utilities

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `lib/workflow/simple-view-transform.ts` | Create | Transform workflow | A |
| `lib/workflow/description-generator.ts` | Create | Generate descriptions | A |
| `lib/workflow/export-formats.ts` | Create | Export formatters | B |

---

## Part A: Simple View Core

### Goal

Build the view mode toggle, transformation logic, and core simple view components.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows/editor/types/simple-view.ts` | Create | Types | ~60 |
| `app/(pages)/workflows/editor/store/slices/view-mode-slice.ts` | Create | State | ~40 |
| `lib/workflow/simple-view-transform.ts` | Create | Transform | ~200 |
| `lib/workflow/description-generator.ts` | Create | Descriptions | ~150 |
| `app/(pages)/workflows/editor/components/ViewModeToggle.tsx` | Create | Toggle | ~60 |
| `app/(pages)/workflows/editor/components/SimpleView.tsx` | Create | Container | ~150 |
| `app/(pages)/workflows/editor/components/SimpleStepCard.tsx` | Create | Step card | ~120 |
| `app/(pages)/workflows/editor/components/SimpleDecisionPoint.tsx` | Create | Decision | ~100 |

### Pseudocode

#### `app/(pages)/workflows/editor/types/simple-view.ts`

```typescript
interface SimpleStep {
  id: string;
  number: number;
  name: string;
  description: string;
  type: SimpleStepType;
  inputs: SimpleIO[];
  outputs: SimpleIO[];
  details?: string;         // Expanded description
}

type SimpleStepType =
  | 'action'     // Regular step
  | 'decision'   // Branch point
  | 'loop-start' // Loop beginning
  | 'loop-end'   // Loop end (implicit)
  | 'parallel';  // Parallel split

interface SimpleIO {
  name: string;
  type: string;
  description?: string;
}

interface SimpleDecision {
  id: string;
  number: number;
  condition: string;        // Human-readable condition
  truePath: SimpleStep[];   // Steps if true
  falsePath: SimpleStep[];  // Steps if false
}

interface SimpleLoop {
  id: string;
  number: number;
  type: 'foreach' | 'until' | 'while';
  description: string;      // "For each item in list..."
  body: SimpleStep[];
}

interface SimpleWorkflow {
  name: string;
  description: string;
  steps: (SimpleStep | SimpleDecision | SimpleLoop)[];
  inputs: SimpleIO[];
  outputs: SimpleIO[];
}
```

#### `lib/workflow/simple-view-transform.ts`

```
function transformToSimpleView(workflow: WorkflowDefinition): SimpleWorkflow
├── Initialize result
│   ├── name: workflow.name
│   ├── description: workflow.description
│   └── steps: []
├── Build execution order
│   └── Topological sort respecting control flow
├── Process steps in order
│   ├── For each step
│   │   ├── If branch node
│   │   │   └── Create SimpleDecision with nested steps
│   │   ├── If loop node
│   │   │   └── Create SimpleLoop with nested steps
│   │   ├── If parallel node
│   │   │   └── Create parallel indicator with branches
│   │   └── If regular step
│   │       └── Create SimpleStep
│   └── Number steps sequentially
├── Extract workflow inputs
│   └── From workflow.inputSchema
├── Extract workflow outputs
│   └── From final step outputs
└── Return SimpleWorkflow

function processRegularStep(step: Step, number: number): SimpleStep
├── Generate name (if not set)
│   └── Use descriptionGenerator
├── Generate description
│   └── Use descriptionGenerator
├── Summarize inputs
│   └── Extract from inputSchema
├── Summarize outputs
│   └── Extract from outputSchema
└── Return SimpleStep

function processBranch(
  branch: BranchNode,
  steps: Step[],
  startNumber: number
): { decision: SimpleDecision; endNumber: number }
├── Generate condition description
│   └── "If {condition} is true..."
├── Process true path
│   └── Transform nested steps
├── Process false path
│   └── Transform nested steps
├── Create SimpleDecision
└── Return with updated number

function processLoop(
  loop: LoopNode,
  steps: Step[],
  startNumber: number
): { loop: SimpleLoop; endNumber: number }
├── Generate loop description
│   ├── foreach: "For each {item} in {source}..."
│   ├── until: "Repeat until {condition}..."
│   └── while: "While {condition}..."
├── Process body steps
├── Create SimpleLoop
└── Return with updated number
```

#### `lib/workflow/description-generator.ts`

```
class DescriptionGenerator {
  generateStepName(step: Step): string
  ├── If step.name exists
  │   └── Return step.name
  ├── If Composio tool
  │   └── Return friendly name from TOOL_NAMES map
  ├── If browser step
  │   └── Return action description
  ├── If custom code
  │   └── Return "Process data" or infer from code
  └── Return "Step"

  generateStepDescription(step: Step): string
  ├── If step.description exists
  │   └── Return step.description
  ├── If Composio tool
  │   └── Return friendly description from TOOL_DESCRIPTIONS
  ├── If browser step
  │   └── Generate from action type and target
  ├── If custom code
  │   └── Summarize from code comments or logic
  └── Return generic description

  summarizeInputs(schema: JSONSchema): SimpleIO[]
  ├── If no schema
  │   └── Return []
  ├── Extract properties
  ├── For each property
  │   ├── name: property name (humanized)
  │   ├── type: friendly type name
  │   └── description: from schema.description
  └── Return array

  private readonly TOOL_NAMES: Record<string, string> = {
    'GMAIL_SEND_EMAIL': 'Send email',
    'GMAIL_LIST_EMAILS': 'Check inbox',
    'SLACK_POST_MESSAGE': 'Post to Slack',
    'BROWSER_TOOL_NAVIGATE': 'Open webpage',
    'BROWSER_TOOL_FETCH_WEBPAGE': 'Read page content',
    // ...
  };

  private readonly TOOL_DESCRIPTIONS: Record<string, string> = {
    'GMAIL_SEND_EMAIL': 'Sends an email through your Gmail account',
    'GMAIL_LIST_EMAILS': 'Retrieves emails from your inbox',
    // ...
  };
}
```

#### `app/(pages)/workflows/editor/components/SimpleView.tsx`

```
SimpleView({ workflow })
├── Transform workflow to simple view
│   └── const simpleWorkflow = transformToSimpleView(workflow)
├── State: expandedSteps (Set of expanded step IDs)
├── Layout
│   ├── Header
│   │   ├── Workflow name
│   │   ├── Workflow description
│   │   └── Export button
│   ├── Inputs section (if any)
│   │   ├── "This workflow needs:"
│   │   └── Input list
│   ├── Steps container
│   │   ├── For each step/decision/loop
│   │   │   ├── If SimpleStep
│   │   │   │   └── Render SimpleStepCard
│   │   │   ├── If SimpleDecision
│   │   │   │   └── Render SimpleDecisionPoint
│   │   │   └── If SimpleLoop
│   │   │       └── Render SimpleLoopIndicator
│   │   ├── Arrow between steps
│   │   └── Empty state if no steps
│   └── Outputs section
│       ├── "This workflow produces:"
│       └── Output list
├── On step click
│   └── Toggle expanded state
└── On step edit
    └── Update workflow definition (sync)
```

#### `app/(pages)/workflows/editor/components/SimpleStepCard.tsx`

```
SimpleStepCard({ step, expanded, onToggle, onEdit })
├── Card container
│   ├── Border color by type
│   └── Hover effect
├── Header row
│   ├── Step number (circle badge)
│   ├── Step name
│   ├── Type icon (small)
│   └── Expand/collapse chevron
├── Description row
│   └── Step description (gray text)
├── Collapsed view
│   └── Just header + description
├── Expanded view
│   ├── Inputs section
│   │   ├── "Needs:"
│   │   └── For each input
│   │       ├── Name
│   │       └── Type badge
│   ├── Outputs section
│   │   ├── "Produces:"
│   │   └── For each output
│   │       ├── Name
│   │       └── Type badge
│   └── Edit button
├── On click
│   └── Call onToggle
└── On edit
    └── Open inline edit mode
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Toggle switches views | Click toggle, verify view changes |
| AC-A.2 | Steps numbered correctly | 5-step workflow, verify 1-5 numbering |
| AC-A.3 | Descriptions generated | Step without description, verify generated |
| AC-A.4 | Branches show correctly | Workflow with branch, verify decision point |
| AC-A.5 | Loops show correctly | Workflow with loop, verify loop indicator |
| AC-A.6 | Expand shows details | Click step, verify inputs/outputs |
| AC-A.7 | Edit syncs to technical | Edit name, verify workflow updated |

---

## Part B: Export and Sharing

### Goal

Build export functionality and read-only sharing.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `lib/workflow/export-formats.ts` | Create | Exporters | ~150 |
| `app/(pages)/workflows/editor/components/SimpleExportMenu.tsx` | Create | Export UI | ~100 |
| `app/(pages)/workflows/[id]/share/page.tsx` | Create | Share page | ~100 |

### Pseudocode

#### `lib/workflow/export-formats.ts`

```
function exportAsText(workflow: SimpleWorkflow): string
├── Add title
├── Add description
├── Add inputs section
├── For each step
│   ├── Add number and name
│   ├── Add description (indented)
│   └── Handle branches/loops
└── Add outputs section

function exportAsMarkdown(workflow: SimpleWorkflow): string
├── Add title (# heading)
├── Add description
├── Add inputs section (## heading, list)
├── Add steps section (## heading)
│   ├── For each step
│   │   ├── "**{number}. {name}**"
│   │   ├── Description
│   │   └── Sub-list for branches
└── Add outputs section

function exportAsJSON(workflow: SimpleWorkflow): string
└── JSON.stringify(workflow, null, 2)

function generateShareableHTML(workflow: SimpleWorkflow): string
├── Create self-contained HTML
├── Include styles inline
├── Include workflow data
└── Add read-only UI
```

#### `app/(pages)/workflows/editor/components/SimpleExportMenu.tsx`

```
SimpleExportMenu({ workflow })
├── Dropdown menu
│   ├── Trigger: "Export" button
│   └── Menu items
│       ├── "Copy as text"
│       │   └── Copies plain text to clipboard
│       ├── "Copy as Markdown"
│       │   └── Copies markdown to clipboard
│       ├── "Download as PDF"
│       │   └── Opens print dialog / generates PDF
│       ├── "Get shareable link"
│       │   └── Creates share link, copies to clipboard
│       └── Divider
│           └── "Export as JSON"
├── On copy
│   ├── Generate format
│   ├── Copy to clipboard
│   └── Show toast: "Copied!"
├── On PDF
│   ├── Generate print-friendly view
│   └── Trigger print dialog
└── On share link
    ├── Create or get existing share token
    ├── Build URL
    └── Copy to clipboard
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Copy as text works | Click copy, verify clipboard |
| AC-B.2 | Markdown formatted | Copy markdown, verify headers/lists |
| AC-B.3 | PDF dialog opens | Click PDF, verify print dialog |
| AC-B.4 | Share link works | Generate link, open in incognito, verify view |
| AC-B.5 | Share is read-only | Open share link, verify no edit options |

---

## User Flows

### Flow 1: View and Export

```
1. User opens workflow in editor
2. User clicks "Simple View" toggle
3. View transforms to numbered list
4. User reviews steps
5. User clicks "Export"
6. User selects "Copy as Markdown"
7. User pastes into documentation
```

---

## Out of Scope

- Full editing in simple view
- Comments/annotations
- Collaborative editing
- Version comparison in simple view

---

## Open Questions

- [ ] Should we auto-generate descriptions with AI?
- [ ] How to represent parallel execution clearly?
- [ ] Should share links expire?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-11 | Initial creation | Claude |
