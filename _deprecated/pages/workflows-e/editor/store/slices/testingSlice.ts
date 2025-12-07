import type { StateCreator } from "zustand";
import type { TestingSlice, WorkflowEditorStore, StepExecutionResult, ExecutionStatus } from "../types";

export const createTestingSlice: StateCreator<
  WorkflowEditorStore,
  [],
  [],
  TestingSlice
> = (set) => ({
  // Initial state
  executionStatus: "idle",
  stepResults: [],
  testInputValues: {},

  // Actions
  setExecutionStatus: (status: ExecutionStatus) => set({ executionStatus: status }),

  setStepResult: (result: StepExecutionResult) => {
    set((state) => {
      // Update or add the result for this step
      const existingIndex = state.stepResults.findIndex(
        (r) => r.stepId === result.stepId
      );

      if (existingIndex >= 0) {
        const newResults = [...state.stepResults];
        newResults[existingIndex] = result;
        return { stepResults: newResults };
      }

      return { stepResults: [...state.stepResults, result] };
    });
  },

  clearResults: () => set({ 
    stepResults: [], 
    executionStatus: "idle" 
  }),

  setTestInputValue: (key, value) => {
    set((state) => ({
      testInputValues: { ...state.testInputValues, [key]: value },
    }));
  },

  resetTestInputs: () => set({ testInputValues: {} }),
});


