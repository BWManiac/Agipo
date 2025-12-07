import type { StateCreator } from "zustand";
import type { DataMapping } from "@/app/api/workflows/services/types";
import type { MappingsSlice, WorkflowEditorStore } from "../types";

export const createMappingsSlice: StateCreator<
  WorkflowEditorStore,
  [],
  [],
  MappingsSlice
> = (set, get) => ({
  // Initial state
  mappings: [],

  // Actions
  setMappings: (mappings) => set({ mappings, isDirty: true }),

  addMapping: (mapping) => {
    set((state) => ({
      mappings: [...state.mappings, mapping],
      isDirty: true,
    }));
  },

  updateMapping: (id, updates) => {
    set((state) => ({
      mappings: state.mappings.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
      isDirty: true,
    }));
  },

  removeMapping: (id) => {
    set((state) => ({
      mappings: state.mappings.filter((m) => m.id !== id),
      isDirty: true,
    }));
  },

  getMappingsForStep: (stepId) => {
    return get().mappings.filter((m) => m.targetStepId === stepId);
  },
});




