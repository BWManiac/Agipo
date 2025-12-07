import type { StateCreator } from "zustand";
import type { WorkflowDefinition } from "@/app/api/workflows/types";
import type { WorkflowStore } from "../types";

/**
 * Manages workflow identity and metadata (id, name, description).
 * Enables the editor header to display workflow name, track if workflow has unsaved changes (isDirty),
 * and handle loading/error states. Powers the "Save" button state and workflow title display.
 * Essential for workflow identity management.
 */

// 1. State Interface
export interface WorkflowSliceState {
  id: string | null;
  // Unique identifier for the workflow. Null when creating a new workflow, set when loading existing.
  name: string;
  // Display name shown in editor header and workflow list. User-editable, required for saving.
  description: string;
  // Optional description explaining what the workflow does. Shown in workflow list and tooltips.
}

// 2. Actions Interface
export interface WorkflowSliceActions {
  setWorkflowId: (id: string | null) => void;
  // Updates the workflow ID. Called when creating new workflow (null) or loading existing (string).
  setWorkflowName: (name: string) => void;
  // Updates the workflow name. Called when user edits the name in the header or settings.
  setWorkflowDescription: (description: string) => void;
  // Updates the workflow description. Called when user edits description in settings panel.
  loadWorkflow: (workflow: WorkflowDefinition) => void;
  // Loads workflow identity data from a WorkflowDefinition. Called when loading existing workflow from API.
}

// 3. Combined Slice Type
export type WorkflowSlice = WorkflowSliceState & WorkflowSliceActions;

// 4. Initial State
const initialState: WorkflowSliceState = {
  id: null, // Start with no ID - workflow hasn't been created or loaded yet
  name: "", // Start with empty name - user will provide name when creating workflow
  description: "", // Start with empty description - optional field, user can add later
};

// 5. Slice Creator
export const createWorkflowSlice: StateCreator<
  WorkflowStore,
  [],
  [],
  WorkflowSlice
> = (set) => ({
  ...initialState,
  setWorkflowId: (id) => set({ id }),
  setWorkflowName: (name) => set({ name }),
  setWorkflowDescription: (description) => set({ description }),
  loadWorkflow: (workflow) =>
    set({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
    }),
});

