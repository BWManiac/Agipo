# Phase 9 UXD Mockups: Workflow Inputs Tab

## Overview

The **Inputs Tab** enables users to define workflow-level parameters that become available as binding sources in the Details tab. These inputs represent values that the workflow accepts when invoked. After this phase, users can add multiple inputs, set default values, and these inputs will be properly persisted, loaded, and transpiled into the generated workflow code.

## Design System

- **Theme:** Light mode (white bg, gray-50 accents)
- **Tab Position:** Fourth tab in the right panel (`Details | Tools | Logic | Inputs | Config`)
- **Colors:** Blue (#3B82F6) for primary actions, muted gray for optional fields
- **Typography:** System font stack, 12-14px for body, 11px for labels
- **Spacing:** 12-16px padding, 8-12px gaps between elements

## Files

| File | Description |
|------|-------------|
| `inputs-panel.html` | **Full panel mockup** with multiple states: empty state, populated list, interactive states |
| `input-card.html` | **Single input card component** showing all fields including new default value field |

## Complete Acceptance Criteria

### Panel Structure & Layout

| AC # | Criterion | Mockup Location |
|------|-----------|-----------------|
| AC-9.1 | "+ Add Input" button visible when inputs exist | `inputs-panel.html` - Footer section (State 2, 3, 4) |
| AC-9.2 | Clicking "+ Add Input" creates new input | `inputs-panel.html` - Button interaction state |
| AC-9.3 | Default value field visible in input row | `input-card.html` - Below description field |
| AC-9.4 | Default value persists in store | `input-card.html` - Input field with validation |

### Empty State

| AC # | Criterion | Mockup Location |
|------|-----------|-----------------|
| AC-E.1 | Empty state shows when no inputs defined | `inputs-panel.html` - State 1 (Empty) |
| AC-E.2 | Empty state has centered icon and message | `inputs-panel.html` - Empty state section |
| AC-E.3 | "+ Add Input" button visible in empty state | `inputs-panel.html` - Empty state button |

### Input Card Fields

| AC # | Criterion | Mockup Location |
|------|-----------|-----------------|
| AC-F.1 | Name field: text input, required, auto-focus on new | `input-card.html` - Name input |
| AC-F.2 | Type dropdown: string, number, boolean, array, object | `input-card.html` - Type selector |
| AC-F.3 | Required checkbox: toggles required status | `input-card.html` - Required checkbox |
| AC-F.4 | Description field: optional textarea | `input-card.html` - Description input |
| AC-F.5 | Default value field: type-aware input (NEW) | `input-card.html` - Default value section |
| AC-F.6 | Delete button: removes input from workflow | `input-card.html` - Delete action |

### Type-Specific Default Values

| AC # | Criterion | Mockup Location |
|------|-----------|-----------------|
| AC-T.1 | String type: text input for default | `input-card.html` - String default example |
| AC-T.2 | Number type: number input for default | `input-card.html` - Number default example |
| AC-T.3 | Boolean type: checkbox for default | `input-card.html` - Boolean default example |
| AC-T.4 | Array/Object: JSON input (future) | `input-card.html` - Placeholder note |

## Information Architecture

```
┌─ Inputs Tab ─────────────────────────────────────────────┐
│                                                          │
│  ┌─ Header ───────────────────────────────────────────┐ │
│  │  Workflow Inputs                                   │ │
│  │  Parameters this workflow accepts when invoked     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─ Content Area ─────────────────────────────────────┐ │
│  │                                                    │ │
│  │  ┌─ Input Card ─────────────────────────────────┐ │ │
│  │  │  Name: [Website___________] [string ▼]  [🗑] │ │ │
│  │  │  ☑ Required                                  │ │ │
│  │  │  Description: [________________]              │ │ │
│  │  │  Default value: [https://example.com]        │ │ │
│  │  └───────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  ┌─ Input Card ─────────────────────────────────┐ │ │
│  │  │  Name: [Recipient______] [string ▼]  [🗑]   │ │ │
│  │  │  ☑ Required                                  │ │ │
│  │  │  Description: [Email address...]             │ │ │
│  │  │  Default value: [________________]            │ │ │
│  │  └───────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─ Footer ───────────────────────────────────────────┐ │
│  │  [+ Add Input]                                    │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## User Flows

### Flow 1: Add Multiple Inputs

```
1. User opens Inputs tab (empty state)
2. Clicks "+ Add Input" button
3. New input card appears with focus on name field
4. User types "Website" in name field
5. User clicks "+ Add Input" again (button still visible in footer)
6. Second input card appears
7. User types "Recipient" in second input's name field
8. Both inputs visible in scrollable list
```

### Flow 2: Set Default Value

```
1. User has "Website" input defined
2. User scrolls to default value field (below description)
3. Clicks into "Default value" text input
4. Types "https://example.com"
5. Clicks away (blur event)
6. Value saved to store immediately
7. Re-render shows value persisted
8. Value appears in saved workflow.json
```

### Flow 3: Type-Specific Default Inputs

```
1. User creates input with type "number"
2. Default value field changes to number input type
3. User enters: 42
4. Validation ensures numeric value
5. User changes type to "boolean"
6. Default value field changes to checkbox
7. User checks checkbox → default becomes true
8. Unchecks → default becomes false
```

### Flow 4: Delete Input

```
1. User has multiple inputs defined
2. User clicks delete (trash) icon on "Website" input
3. Confirmation or immediate deletion (TBD)
4. Input removed from list
5. Store updated immediately
6. If input was used in bindings, show warning (future)
```

## Key UX Decisions

1. **Always-visible footer button** - "+ Add Input" remains accessible even with many inputs, allowing quick addition
2. **Type-aware default inputs** - Default value field changes UI based on type (text → number → checkbox) for better UX
3. **Progressive disclosure** - Default value field is optional and visually de-emphasized to not overwhelm new users
4. **Inline editing** - All fields editable in place, auto-save on blur (no explicit save button per field)
5. **Visual hierarchy** - Required checkbox prominent, default value field more subtle to indicate optionality
6. **Empty state clarity** - Clear call-to-action when no inputs exist, making first-time use obvious

## Interaction States

### Input Card States

- **Default:** All fields visible, no special styling
- **Focused:** Active field has blue border/ring
- **Editing:** Input value changes, no save needed (auto-saves on blur)
- **Error:** Invalid name (duplicate, empty after blur) shows red border
- **Hover:** Delete button becomes visible/emphasized

### Button States

- **"+ Add Input":** 
  - Default: Outline button with plus icon
  - Hover: Darker border, slight background
  - Active: Pressed state
  - Disabled: Not used in this phase

## Edge Cases

1. **Very long input name** - Text truncates with ellipsis, full name on hover/tooltip
2. **Many inputs (scroll)** - Footer button stays fixed, content area scrolls
3. **Duplicate names** - Show validation error (future), prevent save
4. **Default value type mismatch** - Validate against input type, show error
5. **Empty default for required input** - Allowed (default can be empty even if required)

## Accessibility

- All inputs have proper labels (or aria-labels)
- Keyboard navigation: Tab through fields, Enter to add new input
- Screen reader announces: "Input name, type string, required, description optional"
- Delete button has aria-label: "Delete input [name]"
- Color contrast meets WCAG AA standards

