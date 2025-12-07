/**
 * Workflows B Store
 * 
 * Composes all slices into a single Zustand store.
 * This is the main export that components use to access workflow state.
 */

import { create } from "zustand";
import { createWorkflowSlice } from "./slices/workflowSlice";
import { createUISlice } from "./slices/uiSlice";
import { createExecutionSlice } from "./slices/executionSlice";
import type { WorkflowsBStore } from "./types";

/**
 * The main store hook for Workflows B.
 * 
 * Usage:
 * ```tsx
 * const workflow = useWorkflowsBStore(state => state.workflow);
 * const addStep = useWorkflowsBStore(state => state.addStep);
 * ```
 */
export const useWorkflowsBStore = create<WorkflowsBStore>()(
  (...args) => ({
    ...createWorkflowSlice(...args),
    ...createUISlice(...args),
    ...createExecutionSlice(...args),
  })
);

// Re-export types for convenience
export type { 
  WorkflowsBStore,
  WorkflowSlice,
  UISlice,
  ExecutionSlice,
  RightPanelTab,
  ExecutionStatus,
  StepExecutionState,
} from "./types";

export { 
  editorStateToStore, 
  storeToEditorState 
} from "./types";




