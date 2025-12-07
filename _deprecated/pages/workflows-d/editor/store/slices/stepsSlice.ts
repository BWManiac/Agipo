import type { StateCreator } from "zustand";
import type { WorkflowStep } from "@/app/api/workflows-d/services/types";
import type { StepsSlice, WorkflowsDStore } from "../types";

export const createStepsSlice: StateCreator<
  WorkflowsDStore,
  [],
  [],
  StepsSlice
> = (set, get) => ({
  // Initial state
  steps: [],

  // Actions
  setSteps: (steps) => set({ steps, isDirty: true }),

  addStep: (step) => {
    set((state) => ({
      steps: [...state.steps, step],
      isDirty: true,
    }));
  },

  updateStep: (id, updates) => {
    set((state) => ({
      steps: state.steps.map((step) =>
        step.id === id ? { ...step, ...updates } : step
      ),
      isDirty: true,
    }));
  },

  removeStep: (id) => {
    set((state) => {
      // Remove the step
      const filteredSteps = state.steps.filter((step) => step.id !== id);
      
      // Update listIndex for remaining steps
      const reindexedSteps = filteredSteps.map((step, index) => ({
        ...step,
        listIndex: index,
      }));

      // Also remove any mappings that reference this step
      const filteredMappings = state.mappings.filter(
        (m) => m.sourceStepId !== id && m.targetStepId !== id
      );

      return {
        steps: reindexedSteps,
        mappings: filteredMappings,
        isDirty: true,
        // Clear selection if the deleted step was selected
        selectedStepId: state.selectedStepId === id ? null : state.selectedStepId,
      };
    });
  },

  reorderSteps: (fromIndex, toIndex) => {
    set((state) => {
      const newSteps = [...state.steps];
      const [movedStep] = newSteps.splice(fromIndex, 1);
      newSteps.splice(toIndex, 0, movedStep);

      // Update listIndex for all steps
      const reindexedSteps = newSteps.map((step, index) => ({
        ...step,
        listIndex: index,
      }));

      return {
        steps: reindexedSteps,
        isDirty: true,
      };
    });
  },

  getStepById: (id) => {
    return get().steps.find((step) => step.id === id);
  },
});




