import type { StateCreator } from "zustand";
import type { WorkflowDefinition } from "@/app/api/workflows/types";
import type { WorkflowStore } from "../types";

/**
 * Handles saving and loading workflows to/from `workflow.json`.
 * Enables users to save their work (syncs store state to file) and load existing workflows
 * (syncs file to store state). Powers the "Save" button and workflow loading on editor open.
 * Manages save state (isSaving, lastSaved) for user feedback.
 */

// 1. State Interface
export interface PersistenceSliceState {
  isSaving: boolean;
  // Indicates if a save operation is currently in progress. Used to disable save button and show loading state.
  isLoading: boolean;
  // Indicates if a workflow is currently being loaded from the API. Used to show loading spinner in editor.
  lastSaved: string | null;
  // ISO timestamp of when the workflow was last successfully saved. Used to show "Saved X seconds ago" feedback.
}

// 2. Actions Interface
export interface PersistenceSliceActions {
  saveWorkflow: () => Promise<void>;
  // Saves the current workflow state to workflow.json. Syncs all store slices (workflow, steps, mappings) to file.
  fetchWorkflowById: (workflowId: string) => Promise<void>;
  // Loads a workflow from the API and populates all store slices. Called when user opens an existing workflow.
  resetWorkflow: () => void;
  // Clears all workflow state and resets to empty workflow. Used when creating a new workflow or closing editor.
}

// 3. Combined Slice Type
export type PersistenceSlice = PersistenceSliceState & PersistenceSliceActions;

// 4. Initial State
const initialState: PersistenceSliceState = {
  isSaving: false, // Start with no save in progress - user hasn't saved yet
  isLoading: false, // Start with no load in progress - editor starts empty until workflow is loaded
  lastSaved: null, // No save timestamp initially - workflow hasn't been saved yet
};

// 5. Slice Creator
export const createPersistenceSlice: StateCreator<
  WorkflowStore,
  [],
  [],
  PersistenceSlice
> = (set, get) => ({
  ...initialState,
  saveWorkflow: async () => {
    set({ isSaving: true });
    try {
      const { id, name, description, steps, mappings } = get();
      if (!id) {
        throw new Error("Cannot save workflow without ID");
      }

      const workflow: WorkflowDefinition = {
        id,
        name,
        description,
        inputSchema: { type: "object", properties: {}, required: [] },
        outputSchema: { type: "object", properties: {}, required: [] },
        steps,
        mappings,
        controlFlow: { type: "sequential", order: steps.map((s) => s.id) },
        connections: {},
        tableRequirements: [],
        tables: {},
        runtimeInputs: [],
        configs: [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        createdBy: "user",
        published: false,
      };

      const response = await fetch(`/api/workflows/${id}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflow),
      });
      if (!response.ok) {
        throw new Error("Failed to save workflow");
      }
      set({ lastSaved: new Date().toISOString(), isSaving: false });
    } catch (error) {
      console.error("Failed to save workflow:", error);
      set({ isSaving: false });
      throw error;
    }
  },
  fetchWorkflowById: async (workflowId: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/workflows/${workflowId}/retrieve`);
      if (!response.ok) {
        throw new Error("Failed to load workflow");
      }
      const workflow = await response.json();

      get().loadWorkflow(workflow);
      get().loadSteps(workflow.steps || []);
      get().loadMappings(workflow.mappings || []);
      set({ isLoading: false });
    } catch (error) {
      console.error("Failed to load workflow:", error);
      set({ isLoading: false });
      throw error;
    }
  },
  resetWorkflow: () => {
    set(initialState);
    get().setWorkflowId(null);
    get().setWorkflowName("");
    get().setWorkflowDescription("");
    get().loadSteps([]);
    get().loadMappings([]);
  },
});

