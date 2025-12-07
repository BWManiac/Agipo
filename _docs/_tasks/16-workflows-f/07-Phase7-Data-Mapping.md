# Phase 7: Data Mapping

**Status:** 📋 Planned  
**Depends On:** Phase 6 (Schema Discovery)  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Build the **Details Tab** that lets users configure how data flows between workflow steps. When a user clicks on a step, the Details tab shows where that step gets its inputs and where its outputs go.

After this phase:
- Users can select a step and see its input fields (from cached Composio schemas)
- Users can bind each input to: a previous step's output, a workflow parameter, or a literal value
- Users can see where their step's outputs are being used downstream
- Users can click step links to navigate between connected steps
- The 3-step browser workflow is fully configurable end-to-end

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary UI | Details tab (leftmost in right panel) | Step-centric configuration is more intuitive than edge-centric |
| Trigger | Select step in Rail View | Natural—click thing, configure thing |
| Bidirectional view | Show inputs AND outputs | Users need to understand data flow in both directions |
| Step navigation | Clickable step links | Quick navigation without hunting in canvas |
| Field metadata | Required/optional badges | Clear visual hierarchy for what must be configured |
| Source types | Step Output, Workflow Input, Literal | Covers all practical mapping scenarios |

### Pertinent Research

- **Composio schemas**: Phase 6 caches `inputParameters` and `outputParameters` for each tool
- **Browser tool schemas**: `BROWSER_TOOL_NAVIGATE` outputs `url`, `BROWSER_TOOL_FETCH_WEBPAGE` needs `url` input
- **Gmail schemas**: Rich typed schemas with nested objects (confirmed via live query)

*Source: Phase 6 implementation, `15.5-workflows-f-transpilation-research.md`*

### Overall File Impact

#### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows-f/types/bindings.ts` | Create | Types for FieldBinding, BindingSource | A |

#### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows-f/editor/store/slices/bindingsSlice.ts` | Create | State for all data bindings | A |
| `app/(pages)/workflows-f/editor/store/slices/tabs/detailsSlice.ts` | Create | State for Details tab UI | A |
| `app/(pages)/workflows-f/editor/store/slices/workflowInputsSlice.ts` | Create | State for workflow input definitions | C |

#### Frontend / Components (Details Tab)

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows-f/editor/components/panels/details/DetailsPanel.tsx` | Create | Main container for Details tab content | A |
| `app/(pages)/workflows-f/editor/components/panels/details/InputBindingsSection.tsx` | Create | Renders input fields with their bindings | A |
| `app/(pages)/workflows-f/editor/components/panels/details/FieldBindingRow.tsx` | Create | Single input field with source selector | A |
| `app/(pages)/workflows-f/editor/components/panels/details/SourceSelector.tsx` | Create | Dropdown: Step Output / Workflow Input / Literal | A |
| `app/(pages)/workflows-f/editor/components/panels/details/StepPathPicker.tsx` | Create | Schema tree browser for picking output paths | A |
| `app/(pages)/workflows-f/editor/components/panels/details/OutputBindingsSection.tsx` | Create | Shows where step outputs are used | B |
| `app/(pages)/workflows-f/editor/components/panels/details/OutputUsageRow.tsx` | Create | Single output field with destination info | B |

#### Frontend / Components (Workflow Inputs)

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows-f/editor/components/panels/inputs/WorkflowInputsPanel.tsx` | Create | Panel for defining workflow-level inputs | C |
| `app/(pages)/workflows-f/editor/components/panels/inputs/WorkflowInputRow.tsx` | Create | Row for a single workflow input definition | C |

#### Frontend / Components (Shared)

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows-f/editor/components/panels/PanelTabs.tsx` | Modify | Add Details tab as leftmost | A |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-7.1 | Selecting step shows Details tab | Click step → Details tab auto-focuses | A |
| AC-7.2 | Input fields displayed from schema | See url, format, etc. with types | A |
| AC-7.3 | Required fields have amber badge | "required" badge visible | A |
| AC-7.4 | Optional fields have gray badge | "optional" badge visible | A |
| AC-7.5 | Can bind from Step Output | Select source → pick path → saved | A |
| AC-7.6 | Can bind from Workflow Input | Select source → pick input → saved | A |
| AC-7.7 | Can bind from Literal value | Select source → enter value → saved | A |
| AC-7.8 | Output bindings section visible | Shows "Sending to Step X" | B |
| AC-7.9 | Output usage displayed | Shows which outputs used where | B |
| AC-7.10 | Step links are clickable | Click "Step 1" → navigates to it | A+B |
| AC-7.11 | Canvas syncs with Details | Clicking link selects step in Rail View | A+B |
| AC-7.12 | First step: no input source | "Workflow Start" or disabled Step Output | A |
| AC-7.13 | Last step: outputs not used | "Not connected" state shown | B |
| AC-7.14 | Empty state when nothing selected | "Select a step to configure" message | A |
| AC-7.15 | Workflow Inputs panel exists | Can define workflow parameters | C |
| AC-7.16 | Workflow inputs available as sources | Defined inputs appear in SourceSelector | C |
| AC-7.17 | 3-step workflow fully configurable | Navigate → Fetch → Email all connected | All |

### User Flows (Phase Level)

#### Flow 1: Configure the 3-Step Browser Workflow

```
1. User has workflow with 3 steps:
   - Step 1: Navigate to URL
   - Step 2: Fetch Webpage Content  
   - Step 3: Send Email

2. User clicks Step 2 in Rail View
3. Details tab opens (auto-focused) showing:
   - Header: "Step 2: Fetch Webpage Content"
   - Input Bindings section:
     - "← Receiving from Step 1: Navigate to URL" (clickable)
     - url [required] [string] - "URL to fetch"
     - format [optional] [string] - "Output format"
   - Output Bindings section:
     - "→ Sending to Step 3: Send Email" (clickable)
     - data.content → Step 3: body

4. User configures "url" input:
   - Clicks source selector
   - Selects "Step Output"
   - Picks Step 1
   - Browses schema tree: data → url
   - Path shows: "Step 1 → data.url"

5. User clicks "Step 3: Send Email" link
6. Canvas scrolls to Step 3, selects it
7. Details tab updates to show Step 3 configuration
8. User configures Step 3 inputs similarly

9. Result: All data connections are explicitly configured
```

---

## Part A: Details Tab + Input Bindings

### Goal

Build the Details tab that appears when a step is selected. Users see all input fields from the step's Composio schema and configure where each input's data comes from.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows-f/types/bindings.ts` | Create | Types for bindings | ~60 |
| `app/(pages)/workflows-f/editor/store/slices/bindingsSlice.ts` | Create | State for all bindings | ~100 |
| `app/(pages)/workflows-f/editor/store/slices/tabs/detailsSlice.ts` | Create | UI state for Details tab | ~40 |
| `app/(pages)/workflows-f/editor/components/panels/details/DetailsPanel.tsx` | Create | Main container | ~150 |
| `app/(pages)/workflows-f/editor/components/panels/details/InputBindingsSection.tsx` | Create | Input fields list | ~120 |
| `app/(pages)/workflows-f/editor/components/panels/details/FieldBindingRow.tsx` | Create | Single field row | ~100 |
| `app/(pages)/workflows-f/editor/components/panels/details/SourceSelector.tsx` | Create | Source type dropdown | ~150 |
| `app/(pages)/workflows-f/editor/components/panels/details/StepPathPicker.tsx` | Create | Schema tree browser | ~180 |
| `app/(pages)/workflows-f/editor/components/panels/PanelTabs.tsx` | Modify | Add Details tab leftmost | +20 |

### Pseudocode

#### `app/api/workflows-f/types/bindings.ts`

```
BindingSourceType = "step-output" | "workflow-input" | "literal"

FieldBinding
├── targetStepId: string
├── targetField: string (e.g., "url")
├── sourceType: BindingSourceType
├── sourceStepId?: string (for step-output)
├── sourcePath?: string (e.g., "data.url")
├── workflowInputName?: string (for workflow-input)
└── literalValue?: unknown (for literal)

StepBindings
├── stepId: string
└── inputBindings: Record<fieldName, FieldBinding>
```

#### `app/(pages)/workflows-f/editor/store/slices/bindingsSlice.ts`

```
BindingsState
├── bindings: Record<stepId, StepBindings>
└── actions:
    ├── setFieldBinding(stepId, fieldName, binding)
    ├── removeFieldBinding(stepId, fieldName)
    ├── getBindingsForStep(stepId): StepBindings
    ├── getOutputUsage(stepId): { field, usedBy: stepId, usedByField }[]
    └── clearBindingsForStep(stepId)
```

#### `app/(pages)/workflows-f/editor/components/panels/details/DetailsPanel.tsx`

```
DetailsPanel
├── Get selectedStepId from stepsSlice
├── If no selection:
│   └── Render empty state: "Select a step to configure"
│
├── Fetch step's schema from cache:
│   └── GET /api/workflows-f/composio-schemas/{toolkit}/{tool}
│
├── Render:
│   ├── Header: Step name + tool name
│   ├── InputBindingsSection
│   │   ├── Source step banner (clickable)
│   │   └── List of FieldBindingRow for each inputParameter
│   └── OutputBindingsSection (Part B)
│
└── Events:
    └── onStepLinkClick: Select that step in canvas
```

#### `app/(pages)/workflows-f/editor/components/panels/details/SourceSelector.tsx`

```
SourceSelector
├── Props:
│   ├── currentBinding: FieldBinding | undefined
│   ├── availableSteps: Step[] (previous steps only)
│   ├── workflowInputs: WorkflowInput[]
│   └── onChange: (binding: FieldBinding) => void
│
├── Render dropdown with 3 options:
│   ├── "Step Output" → Shows StepPathPicker
│   ├── "Workflow Input" → Shows input selector
│   └── "Literal Value" → Shows text input
│
├── If first step:
│   └── "Step Output" option is disabled
│
└── Events:
    └── onChange: Build FieldBinding and call prop
```

#### `app/(pages)/workflows-f/editor/components/panels/details/StepPathPicker.tsx`

```
StepPathPicker
├── Props:
│   ├── sourceStepId: string
│   ├── selectedPath: string | undefined
│   └── onSelect: (path: string) => void
│
├── Fetch source step's output schema
│
├── Render tree view:
│   ├── data (object)
│   │   ├── url (string) ← clickable leaf
│   │   ├── title (string) ← clickable leaf
│   │   └── content (string) ← clickable leaf
│
└── Events:
    └── onSelect: Return dot-notation path (e.g., "data.url")
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-7.1 | Selecting step shows Details tab | Click step → tab visible |
| AC-7.2 | Input fields displayed from schema | Fields match cached schema |
| AC-7.3 | Required fields have amber badge | Visual check |
| AC-7.4 | Optional fields have gray badge | Visual check |
| AC-7.5 | Can bind from Step Output | Select + pick path |
| AC-7.6 | Can bind from Workflow Input | Select + pick input |
| AC-7.7 | Can bind from Literal value | Enter text |
| AC-7.10 | Step links are clickable | Click → navigation |
| AC-7.12 | First step: no input source | Step Output disabled |
| AC-7.14 | Empty state when nothing selected | Message shown |

### User Flows

#### Flow A.1: Bind Input from Previous Step

```
1. User selects "Fetch Webpage" (Step 2)
2. Details tab shows input fields:
   - url [required] [string]
   - format [optional] [string]
3. User clicks "url" field's source selector
4. Dropdown shows:
   - Step Output ← User selects
   - Workflow Input
   - Literal Value
5. Step picker appears showing: "Step 1: Navigate to URL"
6. User clicks Step 1
7. Path picker shows Step 1's output schema:
   - data
     - url ← User clicks
     - title
     - statusCode
8. Field now shows: "Step 1 → data.url"
9. Binding saved to store
```

---

## Part B: Output Bindings

### Goal

Show users where their step's outputs are being used by downstream steps. This completes the bidirectional view—users understand both where data comes from and where it goes.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows-f/editor/components/panels/details/OutputBindingsSection.tsx` | Create | Container for output usage display | ~100 |
| `app/(pages)/workflows-f/editor/components/panels/details/OutputUsageRow.tsx` | Create | Single output → destination row | ~80 |
| `app/(pages)/workflows-f/editor/store/slices/bindingsSlice.ts` | Modify | Add getOutputUsage selector | +30 |

### Pseudocode

#### `app/(pages)/workflows-f/editor/components/panels/details/OutputBindingsSection.tsx`

```
OutputBindingsSection
├── Props:
│   └── stepId: string
│
├── Get output usage from bindingsSlice:
│   └── getOutputUsage(stepId) → [{ outputPath, usedByStepId, usedByField }]
│
├── Get next step in sequence (if any)
│
├── Render:
│   ├── If has next step:
│   │   └── Banner: "→ Sending to Step 3: Send Email" (clickable)
│   ├── Else (last step):
│   │   └── Banner: "→ Workflow End (outputs not connected)"
│   │
│   ├── If outputs are used:
│   │   └── For each usage:
│   │       └── OutputUsageRow
│   │           ├── "data.content → Step 3: body"
│   │           └── Click to navigate
│   ├── Else:
│   │   └── Empty state: "No outputs mapped yet"
│
└── Events:
    └── onStepLinkClick: Select destination step
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-7.8 | Output bindings section visible | Section renders below inputs |
| AC-7.9 | Output usage displayed | Shows field → destination |
| AC-7.10 | Step links are clickable | Click → navigation |
| AC-7.11 | Canvas syncs with Details | Step selected in Rail View |
| AC-7.13 | Last step: outputs not used | "Workflow End" message |

### User Flows

#### Flow B.1: View Output Usage

```
1. User selects "Fetch Webpage" (Step 2)
2. Details tab shows Output Bindings section:
   - "→ Sending to Step 3: Send Email"
   - data.content → Step 3: body
   - data.title → Step 3: subject
3. User clicks "Step 3: Send Email" link
4. Rail View scrolls to Step 3
5. Step 3 becomes selected
6. Details tab updates to show Step 3's configuration
```

---

## Part C: Workflow Inputs

### Goal

Build the UI for defining workflow-level input parameters. These are values the workflow accepts when invoked (e.g., `recipient_email`). Once defined, they become available as binding sources.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows-f/editor/store/slices/workflowInputsSlice.ts` | Create | State for workflow inputs | ~70 |
| `app/(pages)/workflows-f/editor/components/panels/inputs/WorkflowInputsPanel.tsx` | Create | Panel in right sidebar | ~140 |
| `app/(pages)/workflows-f/editor/components/panels/inputs/WorkflowInputRow.tsx` | Create | Single input definition row | ~100 |
| `app/(pages)/workflows-f/editor/components/panels/PanelTabs.tsx` | Modify | Add "Inputs" tab | +10 |

### Pseudocode

#### `app/(pages)/workflows-f/editor/store/slices/workflowInputsSlice.ts`

```
WorkflowInputDefinition
├── name: string (e.g., "recipient_email")
├── type: "string" | "number" | "boolean" | "object" | "array"
├── required: boolean
├── description?: string
└── defaultValue?: unknown

WorkflowInputsState
├── inputs: WorkflowInputDefinition[]
└── actions:
    ├── addInput(input)
    ├── updateInput(name, updates)
    ├── removeInput(name)
    └── getInputsForSourceSelector(): { name, type }[]
```

#### `app/(pages)/workflows-f/editor/components/panels/inputs/WorkflowInputsPanel.tsx`

```
WorkflowInputsPanel
├── State from store: inputs[]
│
├── Render:
│   ├── Header: "Workflow Inputs"
│   ├── Description: "Parameters this workflow accepts when called"
│   │
│   ├── If no inputs:
│   │   └── Empty state + "+ Add Input" button
│   │
│   ├── Input list:
│   │   └── For each input:
│   │       └── WorkflowInputRow
│   │
│   └── Footer: "+ Add Input" button
│
└── Events:
    ├── onAddInput: Add with defaults
    └── onDelete: Remove from store
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-7.15 | Workflow Inputs panel exists | "Inputs" tab visible |
| AC-7.16 | Workflow inputs available as sources | Show in SourceSelector dropdown |
| AC-7.17 | 3-step workflow fully configurable | Can use workflow input for recipient |

### User Flows

#### Flow C.1: Define Workflow Input

```
1. User clicks "Inputs" tab in right panel
2. Empty state: "No inputs defined"
3. User clicks "+ Add Input"
4. New row appears:
   - Name: [empty]
   - Type: [string ▼]
   - Required: [✓]
5. User enters: "recipient_email"
6. Input auto-saves to store
7. User goes to Step 3 (Send Email)
8. User configures "to" field:
   - Clicks source selector
   - Selects "Workflow Input"
   - Sees "recipient_email" in dropdown
   - Selects it
9. Field shows: "Workflow Input: recipient_email"
```

---

## Out of Scope

- Array iteration mappings (map over all items) → Phase 8+
- Transform expressions (`${value.toUpperCase()}`) → Future
- Complex object construction → Future
- Mapping validation (type checking source vs target) → Future
- Drag-and-drop binding (drag output to input) → Nice-to-have

---

## References

- **UXD Mockups**: `app/(pages)/workflows-f/UXD/phase-7/`
  - `details-tab-selected.html` - Middle step with bindings
  - `details-tab-empty.html` - Edge cases (first, last, empty)
  - `source-selector-dropdown.html` - Source type picker
  - `source-step-picker.html` - Schema tree browser
  - `README.md` - Acceptance criteria mapping
- **Schema API**: Phase 6 provides `/api/workflows-f/composio-schemas/` endpoints
- **Existing types**: `app/api/workflows-f/types/step-connections.ts`
- **Browser tool schemas**: `_tables/composio-schemas/browser_tool.json`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-07 | Initial creation using template | Assistant |
| 2025-12-07 | Rewritten based on Details tab UXD designs | Assistant |

---

**Last Updated:** December 2025
