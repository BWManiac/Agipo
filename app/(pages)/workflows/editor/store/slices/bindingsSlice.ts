import type { StateCreator } from "zustand";
import type { FieldBinding, StepBindings } from "@/app/api/workflows/types/bindings";
import type { WorkflowStore } from "../types";

/**
 * Manages data bindings between workflow steps.
 * Tracks where each step input comes from: previous step output, workflow input, or literal.
 * Powers the Details tab where users configure data flow.
 */

// 1. State Interface
export interface BindingsSliceState {
  bindings: Record<string, StepBindings>;
  // Record of step bindings keyed by step ID. Each entry tracks all input bindings for that step.
}

// 2. Actions Interface
export interface BindingsSliceActions {
  setFieldBinding: (stepId: string, fieldName: string, binding: FieldBinding) => void;
  // Sets or updates a binding for a specific field on a step. Called when user configures input source in Details tab.
  removeFieldBinding: (stepId: string, fieldName: string) => void;
  // Removes a binding for a specific field. Called when user clears a field binding.
  getBindingsForStep: (stepId: string) => StepBindings | undefined;
  // Returns all bindings for a step. Used by Details tab to display current bindings.
  getOutputUsage: (stepId: string) => Array<{
    outputPath: string;
    usedByStepId: string;
    usedByStepName: string;
    usedByField: string;
  }>;
  // Returns where a step's outputs are being used. Powers the Output Bindings section in Details tab.
  clearBindingsForStep: (stepId: string) => void;
  // Removes all bindings for a step. Called when step is deleted.
  loadBindings: (bindings: Record<string, StepBindings>) => void;
  // Loads all bindings from a saved workflow. Called when loading existing workflow from API.
}

// 3. Combined Slice Type
export type BindingsSlice = BindingsSliceState & BindingsSliceActions;

// 4. Initial State
const initialState: BindingsSliceState = {
  bindings: {}, // Start with no bindings - user creates bindings as they configure data flow
};

// 5. Slice Creator
export const createBindingsSlice: StateCreator<
  WorkflowStore,
  [],
  [],
  BindingsSlice
> = (set, get) => ({
  ...initialState,

  setFieldBinding: (stepId, fieldName, binding) =>
    set((state) => {
      const existing = state.bindings[stepId] || { stepId, inputBindings: {} };
      return {
        bindings: {
          ...state.bindings,
          [stepId]: {
            ...existing,
            inputBindings: {
              ...existing.inputBindings,
              [fieldName]: binding,
            },
          },
        },
      };
    }),

  removeFieldBinding: (stepId, fieldName) =>
    set((state) => {
      const existing = state.bindings[stepId];
      if (!existing) return state;
      const { [fieldName]: _, ...rest } = existing.inputBindings;
      return {
        bindings: {
          ...state.bindings,
          [stepId]: { ...existing, inputBindings: rest },
        },
      };
    }),

  getBindingsForStep: (stepId) => get().bindings[stepId],

  getOutputUsage: (stepId) => {
    const { bindings, steps } = get();
    const usage: Array<{
      outputPath: string;
      usedByStepId: string;
      usedByStepName: string;
      usedByField: string;
    }> = [];

    // Find all bindings that reference this step as source
    Object.values(bindings).forEach((stepBindings) => {
      Object.entries(stepBindings.inputBindings).forEach(([field, binding]) => {
        if (binding.sourceType === "step-output" && binding.sourceStepId === stepId) {
          const targetStep = steps.find((s) => s.id === stepBindings.stepId);
          usage.push({
            outputPath: binding.sourcePath || "",
            usedByStepId: stepBindings.stepId,
            usedByStepName: targetStep?.name || "Unknown Step",
            usedByField: field,
          });
        }
      });
    });

    return usage;
  },

  clearBindingsForStep: (stepId) =>
    set((state) => {
      const { [stepId]: _, ...rest } = state.bindings;
      return { bindings: rest };
    }),

  loadBindings: (bindings) => set({ bindings }),
});
