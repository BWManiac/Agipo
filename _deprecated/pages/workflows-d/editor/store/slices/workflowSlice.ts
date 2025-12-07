import type { StateCreator } from "zustand";
import type { WorkflowDefinition } from "@/app/api/workflows-d/services/types";
import type { WorkflowSlice, WorkflowsDStore } from "../types";

export const createWorkflowSlice: StateCreator<
  WorkflowsDStore,
  [],
  [],
  WorkflowSlice
> = (set) => ({
  // Initial state
  workflow: null,
  workflowId: null,
  isDirty: false,
  isLoading: false,
  error: null,

  // Actions
  loadWorkflow: (workflow: WorkflowDefinition) => {
    set({
      workflow,
      workflowId: workflow.id,
      isDirty: false,
      isLoading: false,
      error: null,
      // Also populate related slices
      steps: workflow.steps,
      mappings: workflow.mappings,
      runtimeInputs: workflow.runtimeInputs,
      configs: workflow.configs,
      connections: workflow.connections,
      tableRequirements: workflow.tableRequirements,
      tables: workflow.tables,
    });
  },

  setWorkflowId: (id) => set({ workflowId: id }),

  updateWorkflowMetadata: (updates) => {
    set((state) => {
      if (!state.workflow) return state;
      return {
        workflow: { ...state.workflow, ...updates },
        isDirty: true,
      };
    });
  },

  markDirty: () => set({ isDirty: true }),
  
  markClean: () => set({ isDirty: false }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),

  resetWorkflow: () => set({
    workflow: null,
    workflowId: null,
    isDirty: false,
    isLoading: false,
    error: null,
    steps: [],
    mappings: [],
    runtimeInputs: [],
    configs: [],
    connections: {},
    tableRequirements: [],
    tables: {},
    selectedStepId: null,
    stepResults: [],
    executionStatus: "idle",
    chatMessages: [],
  }),
});




