# Phase 9: Workflow Inputs Enhancement

**Status:** 📋 Planned  
**Depends On:** Phase 8 (Transpilation Engine)  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Enhance the **Workflow Inputs** tab to be fully functional and integrated with the workflow system. Users define workflow-level parameters (e.g., `website`, `recipient_email`) that become available as binding sources in the Details tab, and these inputs are properly persisted, loaded, and transpiled into the generated workflow code.

After this phase:
- Users can add multiple workflow inputs via a "+ Add Input" button
- Users can set default values for workflow inputs
- Workflow inputs persist correctly when saving workflows
- Workflow inputs load correctly when reopening workflows
- Transpiled `workflow.ts` includes proper `inputSchema` generated from workflow inputs
- Workflow inputs are available as binding sources in the Details tab (already working)

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Input classification | Single "inputs" type (no runtime vs config distinction) | Workflow author defines inputs; agent builder (Phase 10) decides which to bind as configs vs runtime |
| Default values | Optional field in input definition | Supports workflows with sensible defaults while allowing override at runtime |
| Type conversion | `WorkflowInputDefinition` (store) ↔ `RuntimeInputConfig` (API) | Bridge between frontend-friendly types and API types |
| InputSchema generation | Build from `runtimeInputs` array during transpilation | Ensures generated code matches what workflow author defined |
| Persistence | Save to `workflow.json` as `runtimeInputs` array | Aligns with existing WorkflowDefinition schema |

### Pertinent Research

- **Phase 7**: WorkflowInputsPanel and WorkflowInputRow components already exist
- **Type mismatch**: Store uses `WorkflowInputDefinition` (has `name`, `defaultValue`), API uses `RuntimeInputConfig` (has `key`, `label`, `default`)
- **Transpiler gap**: Currently uses `definition.inputSchema` directly (hardcoded empty), should build from `runtimeInputs`
- **Persistence gap**: `persistenceSlice` hardcodes `runtimeInputs: []` and doesn't load inputs back

*Source: Phase 7 implementation, transpiler analysis, persistenceSlice code review*

### Overall File Impact

#### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/[workflowId]/update/services/input-schema-generator.ts` | Create | Convert runtimeInputs array to JSONSchema | B |
| `app/api/workflows/[workflowId]/update/services/transpiler/index.ts` | Modify | Use generated inputSchema instead of definition.inputSchema | B |

#### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/store/slices/persistenceSlice.ts` | Modify | Save/load workflowInputs from store to workflow.json | B |
| `app/(pages)/workflows/editor/store/slices/workflowInputsSlice.ts` | Modify | Add helper for converting to RuntimeInputConfig | B |

#### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/components/panels/inputs/WorkflowInputsPanel.tsx` | Modify | Add "+ Add Input" button | A |
| `app/(pages)/workflows/editor/components/panels/inputs/WorkflowInputRow.tsx` | Modify | Add default value input field | A |

#### UXD

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/UXD/right-panel/inputs/README.md` | Create | Acceptance criteria and design notes | A |
| `app/(pages)/workflows/UXD/right-panel/inputs/inputs-panel.html` | Create | Enhanced Inputs tab mockup | A |
| `app/(pages)/workflows/UXD/right-panel/inputs/input-card.html` | Create | Input card with default value | A |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-9.1 | "+ Add Input" button visible when inputs exist | Open Inputs tab → button at bottom | A |
| AC-9.2 | Clicking "+ Add Input" creates new input | Click → new row appears | A |
| AC-9.3 | Default value field visible in input row | Input row shows "Default value" field | A |
| AC-9.4 | Default value persists in store | Enter value → blur → value saved | A |
| AC-9.5 | Workflow inputs save to workflow.json | Save workflow → check file → runtimeInputs populated | B |
| AC-9.6 | Workflow inputs load from workflow.json | Load workflow → inputs appear in store | B |
| AC-9.7 | Type conversion works correctly | Save → load → inputs match | B |
| AC-9.8 | Transpiler generates inputSchema from inputs | Transpile → check workflow.ts → inputSchema has inputs | B |
| AC-9.9 | Generated inputSchema matches input types | String input → z.string() in code | B |
| AC-9.10 | Required inputs marked in generated schema | Required input → appears in required array | B |
| AC-9.11 | End-to-end: Create input → Save → Reopen → Input persists | Full flow works | B |
| AC-9.12 | End-to-end: Create input → Transpile → Generated code includes it | Full flow works | B |

### User Flows (Phase Level)

#### Flow 1: Create and Save Workflow Inputs

```
1. User opens workflow editor
2. User clicks "Inputs" tab in right panel
3. Sees empty state: "No inputs defined" + "+ Add Input" button
4. Clicks "+ Add Input"
5. New input row appears:
   - Name: "Website"
   - Type: "string"
   - Required: ☑
   - Default value: [empty]
   - Description: [empty]
6. User enters "https://example.com" in Default value
7. User clicks Save workflow
8. Workflow saves successfully
9. User closes and reopens workflow
10. Opens Inputs tab → "Website" input still there with default value
```

#### Flow 2: Use Input in Step Binding

```
1. User has workflow with "Website" input defined
2. User selects Step 1 in canvas
3. Details tab shows input fields
4. User clicks source selector for "url" field
5. Selects "Workflow Input"
6. Sees "Website" in dropdown
7. Selects "Website"
8. Field shows: "Workflow Input: Website"
9. User saves workflow
10. User transpiles workflow
11. Generated workflow.ts has inputSchema with "website: z.string()"
12. Generated mapping code references "inputData.website"
```

---

## Part A: UXD & Frontend Enhancements

### Goal

Create UXD mockups and implement frontend enhancements for the Inputs tab: add the "+ Add Input" button and default value field.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows/UXD/right-panel/inputs/README.md` | Create | Acceptance criteria and design notes | ~50 |
| `app/(pages)/workflows/UXD/right-panel/inputs/inputs-panel.html` | Create | Enhanced Inputs tab mockup | ~150 |
| `app/(pages)/workflows/UXD/right-panel/inputs/input-card.html` | Create | Input card with default value | ~80 |
| `app/(pages)/workflows/editor/components/panels/inputs/WorkflowInputsPanel.tsx` | Modify | Add "+ Add Input" button | +20 |
| `app/(pages)/workflows/editor/components/panels/inputs/WorkflowInputRow.tsx` | Modify | Add default value input field | +30 |

### Pseudocode

#### `app/(pages)/workflows/editor/components/panels/inputs/WorkflowInputsPanel.tsx` (changes)

```
WorkflowInputsPanel
├── Existing code...
│
├── Render:
│   ├── Header: "Workflow Inputs"
│   ├── Description: "Parameters this workflow accepts when invoked"
│   │
│   ├── If no inputs:
│   │   └── Empty state + "+ Add Input" button (centered)
│   │
│   ├── Input list:
│   │   └── For each input:
│   │       └── WorkflowInputRow
│   │
│   └── Footer: "+ Add Input" button (always visible when inputs exist)
│
└── Events:
    └── onAddInput: Call addWorkflowInput() from store
```

#### `app/(pages)/workflows/editor/components/panels/inputs/WorkflowInputRow.tsx` (changes)

```
WorkflowInputRow
├── Existing fields:
│   ├── Name input
│   ├── Type dropdown
│   ├── Required checkbox
│   └── Description input
│
├── NEW: Default value field (below description):
│   ├── Label: "Default value (optional)"
│   ├── Input type matches input.type (string/number/boolean)
│   └── onBlur: Save defaultValue to store
│
└── Delete button (existing)
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-9.1 | "+ Add Input" button visible when inputs exist | Open Inputs tab → button at bottom |
| AC-9.2 | Clicking "+ Add Input" creates new input | Click → new row appears |
| AC-9.3 | Default value field visible in input row | Input row shows "Default value" field |
| AC-9.4 | Default value persists in store | Enter value → blur → value saved |

### User Flows

#### Flow A.1: Add Multiple Inputs

```
1. User opens Inputs tab
2. Clicks "+ Add Input"
3. New input appears, user names it "Website"
4. Clicks "+ Add Input" again (button still visible)
5. Second input appears, user names it "Recipient"
6. Both inputs visible in list
```

#### Flow A.2: Set Default Value

```
1. User has "Website" input defined
2. Clicks into "Default value" field
3. Types "https://example.com"
4. Clicks away (blur)
5. Value saved to store
6. Re-render shows value still there
```

---

## Part B: Backend Integration & Transpilation

### Goal

Fix persistence (save/load workflow inputs), add type conversion between store and API types, and update the transpiler to generate `inputSchema` from workflow inputs.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workflows/editor/store/slices/persistenceSlice.ts` | Modify | Save/load workflowInputs | +30 |
| `app/(pages)/workflows/editor/store/slices/workflowInputsSlice.ts` | Modify | Add conversion helper | +25 |
| `app/api/workflows/[workflowId]/update/services/input-schema-generator.ts` | Create | Convert runtimeInputs to JSONSchema | ~80 |
| `app/api/workflows/[workflowId]/update/services/transpiler/index.ts` | Modify | Use generated inputSchema | +10 |

### Pseudocode

#### `app/(pages)/workflows/editor/store/slices/persistenceSlice.ts` (changes)

```
saveWorkflow: async () => {
  ├── Get workflowInputs from store: get().workflowInputs
  ├── Convert to RuntimeInputConfig[]:
  │   └── workflowInputs.map(input => ({
  │       key: input.name,
  │       type: input.type,
  │       label: input.name, // Use name as label for now
  │       description: input.description,
  │       required: input.required,
  │       default: input.defaultValue,
  │     }))
  │
  └── Include in workflow object:
      └── runtimeInputs: convertedInputs  // Instead of []

fetchWorkflowById: async (workflowId) => {
  ├── ... existing code ...
  └── Load workflow inputs:
      └── if (workflow.runtimeInputs) {
            get().loadWorkflowInputs(
              convertFromRuntimeInputConfig(workflow.runtimeInputs)
            )
          }
```

#### `app/(pages)/workflows/editor/store/slices/workflowInputsSlice.ts` (additions)

```
// Add helper function
convertFromRuntimeInputConfig(configs: RuntimeInputConfig[]): WorkflowInputDefinition[] {
  return configs.map(config => ({
    name: config.key,
    type: config.type,
    required: config.required,
    description: config.description,
    defaultValue: config.default,
  }))
}
```

#### `app/api/workflows/[workflowId]/update/services/input-schema-generator.ts`

```
generateInputSchemaFromRuntimeInputs(
  runtimeInputs: RuntimeInputConfig[]
): JSONSchema {
  ├── If empty: Return { type: "object", properties: {}, required: [] }
  │
  ├── Build properties object:
  │   └── For each input:
  │       ├── properties[input.key] = {
  │       │     type: input.type,
  │       │     description: input.description,
  │       │     default: input.default,
  │       │   }
  │       └── If input.required:
  │           └── Add to required array
  │
  └── Return {
        type: "object",
        properties,
        required,
      }
}
```

#### `app/api/workflows/[workflowId]/update/services/transpiler/index.ts` (changes)

```
transpileWorkflow(definition, bindings) {
  ├── ... existing code ...
  │
  ├── NEW: Generate inputSchema from runtimeInputs:
  │   └── const inputSchema = generateInputSchemaFromRuntimeInputs(
  │         definition.runtimeInputs || []
  │       )
  │
  ├── Create updated definition:
  │   └── const definitionWithSchema = {
  │         ...definition,
  │         inputSchema,
  │       }
  │
  └── Use definitionWithSchema for workflow generation:
      └── workflowCode = generateWorkflowComposition(
            definitionWithSchema,
            bindings,
            context
          )
}
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-9.5 | Workflow inputs save to workflow.json | Save workflow → check file → runtimeInputs populated |
| AC-9.6 | Workflow inputs load from workflow.json | Load workflow → inputs appear in store |
| AC-9.7 | Type conversion works correctly | Save → load → inputs match |
| AC-9.8 | Transpiler generates inputSchema from inputs | Transpile → check workflow.ts → inputSchema has inputs |
| AC-9.9 | Generated inputSchema matches input types | String input → z.string() in code |
| AC-9.10 | Required inputs marked in generated schema | Required input → appears in required array |
| AC-9.11 | End-to-end: Create input → Save → Reopen → Input persists | Full flow works |
| AC-9.12 | End-to-end: Create input → Transpile → Generated code includes it | Full flow works |

### User Flows

#### Flow B.1: Persistence Flow

```
1. User creates "Website" input with default "https://example.com"
2. User saves workflow
3. System converts WorkflowInputDefinition → RuntimeInputConfig
4. Saves to workflow.json: runtimeInputs: [{ key: "Website", default: "https://example.com", ... }]
5. User closes workflow
6. User reopens workflow
7. System loads workflow.json
8. Converts RuntimeInputConfig[] → WorkflowInputDefinition[]
9. Loads into store
10. User opens Inputs tab → sees "Website" with default value
```

#### Flow B.2: Transpilation Flow

```
1. User has workflow with inputs:
   - Website (string, required)
   - Recipient (string, optional, default: "user@example.com")
2. User saves workflow
3. Transpiler runs:
   ├── Reads runtimeInputs from definition
   ├── Generates JSONSchema:
   │   {
   │     type: "object",
   │     properties: {
   │       Website: { type: "string" },
   │       Recipient: { type: "string", default: "user@example.com" }
   │     },
   │     required: ["Website"]
   │   }
   ├── Converts to Zod:
   │   z.object({
   │     Website: z.string(),
   │     Recipient: z.string().optional()
   │   })
   └── Generates workflow.ts with this inputSchema
4. Generated code has proper type validation
```

---

## Out of Scope

- Config tab (separate concept, deferred)
- Input validation UI (error states, duplicate name checks) → Future polish
- Input reordering (drag-and-drop) → Nice-to-have
- Advanced validation (format, min/max patterns) → Future
- Input binding UI in agent assignment → Phase 10 (Agent Integration)

---

## References

- **Phase 7**: `07-Phase7-Data-Mapping.md` - Original WorkflowInputsPanel implementation
- **Store Slice Pattern**: `_docs/Engineering/Architecture/Store-Slice-Architecture.md`
- **Transpiler**: `app/api/workflows/[workflowId]/update/services/transpiler/` - Existing transpilation logic
- **Type Definitions**: `app/api/workflows/types/workflow-settings.ts` - RuntimeInputConfig type
- **Type Definitions**: `app/api/workflows/types/bindings.ts` - WorkflowInputDefinition type

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-07 | Initial creation using phase template | Assistant |

---

**Last Updated:** December 2025

