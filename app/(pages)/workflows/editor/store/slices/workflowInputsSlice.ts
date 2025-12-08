import type { StateCreator } from "zustand";
import type { WorkflowInputDefinition } from "@/app/api/workflows/types/bindings";
import type { RuntimeInputConfig } from "@/app/api/workflows/types/workflow-settings";
import type { WorkflowStore } from "../types";
import { nanoid } from "nanoid";

/**
 * Manages workflow-level input parameters.
 * These are values the workflow accepts when invoked (e.g., recipient_email).
 * Workflow inputs become available as binding sources in the Details tab.
 */

// 1. State Interface
export interface WorkflowInputsSliceState {
  workflowInputs: WorkflowInputDefinition[];
  // Array of workflow input definitions. Each input becomes an available source in the Details tab SourceSelector.
}

// 2. Actions Interface
export interface WorkflowInputsSliceActions {
  addWorkflowInput: (input?: Partial<WorkflowInputDefinition>) => void;
  // Adds a new workflow input with optional initial values. Called when user clicks "+ Add Input" in Inputs tab.
  updateWorkflowInput: (name: string, updates: Partial<WorkflowInputDefinition>) => void;
  // Updates an existing workflow input. Called when user edits input name, type, or required status.
  removeWorkflowInput: (name: string) => void;
  // Removes a workflow input. Called when user deletes an input from the Inputs tab.
  loadWorkflowInputs: (inputs: WorkflowInputDefinition[]) => void;
  // Loads all workflow inputs from a saved workflow. Called when loading existing workflow from API.
}

// 3. Combined Slice Type
export type WorkflowInputsSlice = WorkflowInputsSliceState & WorkflowInputsSliceActions;

// 4. Initial State
const initialState: WorkflowInputsSliceState = {
  workflowInputs: [], // Start with no inputs - user defines inputs as needed for their workflow
};

// 5. Slice Creator
export const createWorkflowInputsSlice: StateCreator<
  WorkflowStore,
  [],
  [],
  WorkflowInputsSlice
> = (set) => ({
  ...initialState,

  addWorkflowInput: (input) =>
    set((state) => ({
      workflowInputs: [
        ...state.workflowInputs,
        {
          name: input?.name || `input_${nanoid(4)}`,
          type: input?.type || "string",
          required: input?.required ?? true,
          description: input?.description,
          defaultValue: input?.defaultValue,
        },
      ],
    })),

  updateWorkflowInput: (name, updates) =>
    set((state) => ({
      workflowInputs: state.workflowInputs.map((input) =>
        input.name === name ? { ...input, ...updates } : input
      ),
    })),

  removeWorkflowInput: (name) =>
    set((state) => ({
      workflowInputs: state.workflowInputs.filter((input) => input.name !== name),
    })),

  loadWorkflowInputs: (inputs) => set({ workflowInputs: inputs }),
});

/**
 * Converts RuntimeInputConfig[] (from API) to WorkflowInputDefinition[] (for store).
 * Used when loading workflows from the API.
 * 
 * @param configs - Array of RuntimeInputConfig from workflow.json
 * @returns Array of WorkflowInputDefinition for the store
 */
export function convertFromRuntimeInputConfig(
  configs: RuntimeInputConfig[]
): WorkflowInputDefinition[] {
  return configs.map((config) => ({
    name: config.key,
    type: config.type,
    required: config.required,
    description: config.description,
    defaultValue: config.default,
  }));
}
