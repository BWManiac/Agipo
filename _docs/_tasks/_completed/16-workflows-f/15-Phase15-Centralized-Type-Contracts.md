# Phase 15: Centralized Type Contracts

## Goal

Refactor the workflow editor store to define all slice type contracts in a central `types.ts` file, forcing developers to understand the full store shape when modifying any slice.

## Problem Statement

Currently, each slice defines its own types internally:

```typescript
// workflowSlice.ts - types defined HERE
interface WorkflowSliceState { ... }
interface WorkflowSliceActions { ... }
export type WorkflowSlice = WorkflowSliceState & WorkflowSliceActions;
```

This means developers can edit a slice without ever looking at the bigger picture. They might:
- Create duplicate functionality across slices
- Miss that another slice already handles similar concerns
- Not understand how their changes affect the overall store

## Proposed Solution

Move all slice type definitions to a central `types.ts`:

```typescript
// types.ts - THE source of truth for all slice contracts

// ═══════════════════════════════════════════════════════════════════
// WORKFLOW SLICE
// ═══════════════════════════════════════════════════════════════════

export interface WorkflowSliceState {
  id: string | null;
  name: string;
  description: string;
}

export interface WorkflowSliceActions {
  setWorkflowId: (id: string | null) => void;
  setWorkflowName: (name: string) => void;
  setWorkflowDescription: (description: string) => void;
  resetWorkflow: () => void;
}

export type WorkflowSlice = WorkflowSliceState & WorkflowSliceActions;

// ═══════════════════════════════════════════════════════════════════
// STEPS SLICE
// ═══════════════════════════════════════════════════════════════════

export interface StepsSliceState {
  steps: WorkflowStep[];
  selectedStepId: string | null;
}

export interface StepsSliceActions {
  addStep: (step: WorkflowStep) => void;
  // ... etc
}

export type StepsSlice = StepsSliceState & StepsSliceActions;

// ... same pattern for all slices ...

// ═══════════════════════════════════════════════════════════════════
// COMBINED STORE
// ═══════════════════════════════════════════════════════════════════

export type WorkflowStore = WorkflowSlice &
  StepsSlice &
  MappingsSlice &
  // ... etc
```

Each slice then imports its contract:

```typescript
// workflowSlice.ts - IMPORTS the contract, doesn't define it
import type { WorkflowSlice, WorkflowSliceState } from "../types";

const initialState: WorkflowSliceState = { ... }; // Must match contract!

export const createWorkflowSlice: StateCreator<WorkflowSlice> = (set, get) => ({
  ...initialState,
  // TypeScript enforces all actions from WorkflowSliceActions are implemented
});
```

## Benefits

| Without Central Types | With Central Types |
|----------------------|-------------------|
| Can edit slice in isolation | Must review full store contract |
| Types scattered across 10+ files | All types in one ~200 line file |
| Easy to create duplicate actions | Obvious when overlap exists |
| No enforcement | TypeScript enforces contracts |

## Estimated Effort

- **types.ts refactor**: ~200 lines (consolidate all State/Actions interfaces)
- **Per-slice update**: ~10 min each (remove local types, add import)
- **Total slices**: 10 (workflow, steps, mappings, persistence, chat, ui, tools, bindings, workflowInputs, details)
- **Estimated time**: 2-3 hours

## File Impact

### Modified Files
- `app/(pages)/workflows/editor/store/types.ts` - Major expansion
- `app/(pages)/workflows/editor/store/slices/workflowSlice.ts`
- `app/(pages)/workflows/editor/store/slices/stepsSlice.ts`
- `app/(pages)/workflows/editor/store/slices/mappingsSlice.ts`
- `app/(pages)/workflows/editor/store/slices/persistenceSlice.ts`
- `app/(pages)/workflows/editor/store/slices/chatSlice.ts`
- `app/(pages)/workflows/editor/store/slices/uiSlice.ts`
- `app/(pages)/workflows/editor/store/slices/bindingsSlice.ts`
- `app/(pages)/workflows/editor/store/slices/workflowInputsSlice.ts`
- `app/(pages)/workflows/editor/store/slices/tabs/toolsSlice.ts`
- `app/(pages)/workflows/editor/store/slices/tabs/detailsSlice.ts`

## Related Considerations

This phase could also be combined with the "unified workflow state" architecture exploration (see git history for `workflowSliceV2.ts`), which proposed making `state.workflow` directly mirror `workflow.json` for trivial save/load.

## Status

**Deferred** - Low priority architectural improvement. Current slice architecture works; this is about developer experience and preventing future confusion.

