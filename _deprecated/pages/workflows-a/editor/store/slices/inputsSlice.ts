import type { StateCreator } from "zustand";
import type { RuntimeInputConfig, WorkflowConfig } from "@/app/api/workflows/services/types";
import type { InputsSlice, WorkflowEditorStore } from "../types";

export const createInputsSlice: StateCreator<
  WorkflowEditorStore,
  [],
  [],
  InputsSlice
> = (set) => ({
  // Initial state
  runtimeInputs: [],
  configs: [],

  // Runtime Inputs Actions
  setRuntimeInputs: (runtimeInputs) => set({ runtimeInputs, isDirty: true }),

  addRuntimeInput: (input) => {
    set((state) => ({
      runtimeInputs: [...state.runtimeInputs, input],
      isDirty: true,
    }));
  },

  updateRuntimeInput: (key, updates) => {
    set((state) => ({
      runtimeInputs: state.runtimeInputs.map((input) =>
        input.key === key ? { ...input, ...updates } : input
      ),
      isDirty: true,
    }));
  },

  removeRuntimeInput: (key) => {
    set((state) => ({
      runtimeInputs: state.runtimeInputs.filter((input) => input.key !== key),
      isDirty: true,
    }));
  },

  // Config Actions
  setConfigs: (configs) => set({ configs, isDirty: true }),

  addConfig: (config) => {
    set((state) => ({
      configs: [...state.configs, config],
      isDirty: true,
    }));
  },

  updateConfig: (key, updates) => {
    set((state) => ({
      configs: state.configs.map((config) =>
        config.key === key ? { ...config, ...updates } : config
      ),
      isDirty: true,
    }));
  },

  removeConfig: (key) => {
    set((state) => ({
      configs: state.configs.filter((config) => config.key !== key),
      isDirty: true,
    }));
  },
});




