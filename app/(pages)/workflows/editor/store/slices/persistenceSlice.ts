import type { StateCreator } from "zustand";
import type { WorkflowDefinition } from "@/app/api/workflows/types";
import type { RuntimeInputConfig } from "@/app/api/workflows/types/workflow-settings";
import type { WorkflowStore } from "../types";
import { convertFromRuntimeInputConfig } from "./workflowInputsSlice";

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
      const { id, name, description, steps, mappings, workflowInputs } = get();
      if (!id) {
        throw new Error("Cannot save workflow without ID");
      }

      // Convert WorkflowInputDefinition[] to RuntimeInputConfig[] (AC-9.5)
      const runtimeInputs: RuntimeInputConfig[] = workflowInputs.map((input) => ({
        key: input.name,
        type: input.type,
        label: input.name, // Use name as label for now
        description: input.description,
        required: input.required,
        default: input.defaultValue,
      }));

      // Get bindings from store to persist
      const { bindings } = get();

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
        runtimeInputs, // Save converted inputs (AC-9.5)
        configs: [],
        bindings: bindings, // Persist bindings so they survive reloads
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        createdBy: "user",
        published: false,
      };

      // Send in wrapped format: { definition: {...}, bindings: {...} }
      // Bindings are included in workflow for persistence, but also sent separately for transpilation
      const response = await fetch(`/api/workflows/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          definition: workflow,
          bindings: bindings, // Send bindings separately for transpilation (redundant but API route expects it)
        }),
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
      const response = await fetch(`/api/workflows/${workflowId}`);
      if (!response.ok) {
        throw new Error("Failed to load workflow");
      }
      const workflow = await response.json();

      get().loadWorkflow(workflow);
      get().loadSteps(workflow.steps || []);
      get().loadMappings(workflow.mappings || []);
      
      // Load workflow inputs from runtimeInputs (AC-9.6, AC-9.7, AC-9.11)
      if (workflow.runtimeInputs && Array.isArray(workflow.runtimeInputs)) {
        const workflowInputs = convertFromRuntimeInputConfig(workflow.runtimeInputs);
        get().loadWorkflowInputs(workflowInputs);
      } else {
        get().loadWorkflowInputs([]);
      }
      
      // Load bindings from workflow.json
      if (workflow.bindings) {
        get().loadBindings(workflow.bindings);
      } else {
        get().loadBindings({});
      }
      
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
    get().loadWorkflowInputs([]);
    get().loadBindings({});
  },
});

