# Phase 7 UXD Mockups: Details Tab & Data Mapping

## Overview

The **Details Tab** is a bidirectional data configuration panel that appears when a workflow step is selected. It allows users to:

1. **Configure Input Bindings** - Where this step gets its data FROM
2. **Configure Output Bindings** - Where this step sends its data TO

This makes the Details Tab the central hub for understanding and editing data flow in a workflow.

## Design System

- **Theme:** Light mode (white bg, gray-50 accents)
- **Tab Order:** `Details | Tools | Logic | Inputs | Config` (Details is **first/leftmost**)
- **Colors:** Blue (#3B82F6) for primary actions, emerald for outputs, amber for warnings

## Files

| File | Description |
|------|-------------|
| `details-tab-selected.html` | **Middle step:** Full bidirectional binding UI with inputs AND outputs |
| `details-tab-empty.html` | **Three edge states:** No selection, First step, Last step |
| `source-selector-dropdown.html` | Source type dropdown with First Step variant |
| `source-step-picker.html` | Schema tree browser for nested path selection |

## Complete Acceptance Criteria

### Input Bindings Section

| AC # | Criterion | Mockup Location |
|------|-----------|-----------------|
| AC-D.1 | Details tab appears when step is selected | Tab bar in all files |
| AC-D.2 | Shows step name, type, toolkit, description | Step header section |
| AC-D.3 | Lists ALL input fields with data types | Input Bindings → field rows |
| AC-D.4 | Required fields show "required" badge | Amber badge on required fields |
| AC-D.5 | Can select Step Output as source | Binding button + source-selector |
| AC-D.6 | Can select Workflow Input as source | Binding button + source-selector |
| AC-D.7 | Can enter Literal value as source | Binding button + source-selector |
| AC-D.8 | Mapped fields show full binding (source + path) | Colored dot + "Step 2: data.title" |
| AC-D.9 | Unmapped fields show "Select source..." | Dashed border + placeholder text |
| AC-D.10 | Mapping count displayed ("2 of 6 mapped") | Badge in section header |
| AC-D.11 | Bindings persist in workflow state | (Implementation concern) |
| AC-D.12 | Empty state when no step selected | `details-tab-empty.html` State 1 |

### Output Bindings Section (NEW)

| AC # | Criterion | Mockup Location |
|------|-----------|-----------------|
| AC-D.13 | Shows where outputs are sent to | "Sending data to Step 3" banner |
| AC-D.14 | Lists output fields with their destinations | Output field rows with connections |
| AC-D.15 | Outputs can be edited from this tab | "Change" button on connections |
| AC-D.16 | Unconnected outputs show "+ Connect" | "Not connected" state |
| AC-D.17 | Output count displayed ("3 connected") | Badge in section header |

### Navigation & Interaction

| AC # | Criterion | Mockup Location |
|------|-----------|-----------------|
| AC-D.22 | Step links are clickable | Underlined step names in banners |
| AC-D.23 | Clicking step link navigates to that step | Jump icon on hover |
| AC-D.24 | Canvas selection syncs with Details tab | (Implementation concern) |

### Field Badges

| AC # | Criterion | Mockup Location |
|------|-----------|-----------------|
| AC-D.25 | Required fields show amber "required" badge | All required field rows |
| AC-D.26 | Optional fields show gray "optional" badge | All optional field rows |

### Edge Cases

| AC # | Criterion | Mockup Location |
|------|-----------|-----------------|
| AC-D.18 | First step: Step Output disabled | `details-tab-empty.html` State 2 |
| AC-D.19 | First step: Shows info banner | Amber warning banner |
| AC-D.20 | Last step: Outputs → Workflow Output | `details-tab-empty.html` State 3 |
| AC-D.21 | Last step: Shows success banner | Emerald info banner |

## Information Architecture

```
┌─ Details Tab ─────────────────────────────────────────────┐
│                                                           │
│  ┌─ Step Header ───────────────────────────────────────┐ │
│  │  [Icon] Step Name                    [Step X of Y]  │ │
│  │         toolkit • TOOL_SLUG                         │ │
│  │  Description text...                                │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─ Input Bindings ────────────────────────────────────┐ │
│  │  ← Receiving from [Step N: Name]     [2/6 mapped]   │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │  field_name [required] [type]                       │ │
│  │  └─ [●] Step 1: data.path           [Change ▼]     │ │
│  │                                                     │ │
│  │  field_name [type]                                  │ │
│  │  └─ [●] Literal: "value"            [Change ▼]     │ │
│  │                                                     │ │
│  │  field_name [type]                                  │ │
│  │  └─ [Select source...]                    [▼]      │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─ Output Bindings ───────────────────────────────────┐ │
│  │  → Sending to [Step N: Name]         [3 connected]  │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │  data.title [type]                    ───→          │ │
│  │  └─ Connected to: [●] Step 3: subject  [Change ▼]  │ │
│  │                                                     │ │
│  │  data.content [type]                  ───→          │ │
│  │  └─ Connected to: [●] Step 3: body     [Change ▼]  │ │
│  │                                                     │ │
│  │  data.url [type]                      ─ ─ →         │ │
│  │  └─ Not connected                      [+ Connect] │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## Source Type Legend

| Color | Type | Description |
|-------|------|-------------|
| 🔵 Blue | Step Output | Data from a previous step's output |
| 🟢 Emerald | Workflow Input | Parameter passed when workflow is invoked |
| 🟣 Purple | Literal Value | Hardcoded/static value |
| ⚪ Gray | Not Mapped | No binding configured yet |

## User Flow: Configure Middle Step

1. User clicks "Fetch Webpage Content" (Step 2) in Rail View
2. Details tab activates (shows Step 2 of 3)
3. **Input Bindings** shows:
   - Banner: "Receiving data from Step 1: Navigate to URL"
   - `url` ← Step 1: `data.url` (mapped)
   - `format` ← Literal: "markdown" (mapped)
   - `wait` ← "Select source..." (unmapped)
4. **Output Bindings** shows:
   - Banner: "Sending data to Step 3: Send Email"
   - `data.title` → Step 3: `subject` (connected)
   - `data.content` → Step 3: `body` (connected)
   - `data.url` → Not connected [+ Connect]
5. User can edit ANY binding by clicking the dropdown
6. Changes reflect immediately in the workflow state

## Key UX Decisions

1. **Bidirectional visibility** - See both inputs AND outputs in one place
2. **Contextual banners** - Show source/destination steps prominently
3. **Progressive disclosure** - "Show N more fields" for optional/unused items
4. **Clear visual hierarchy** - Mapped vs unmapped states are visually distinct
5. **Inline editing** - Change bindings without opening modals
