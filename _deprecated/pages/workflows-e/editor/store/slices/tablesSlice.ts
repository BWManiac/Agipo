import type { StateCreator } from "zustand";
import type { TableRequirement } from "@/app/api/workflows-e/services/types";
import type { TablesSlice, WorkflowEditorStore } from "../types";

export const createTablesSlice: StateCreator<
  WorkflowEditorStore,
  [],
  [],
  TablesSlice
> = (set) => ({
  // Initial state
  tableRequirements: [],
  tables: {},

  // Actions
  setTableRequirements: (tableRequirements) => set({ tableRequirements, isDirty: true }),

  addTableRequirement: (requirement) => {
    set((state) => ({
      tableRequirements: [...state.tableRequirements, requirement],
      tables: { ...state.tables, [requirement.key]: null },
      isDirty: true,
    }));
  },

  updateTableRequirement: (key, updates) => {
    set((state) => ({
      tableRequirements: state.tableRequirements.map((req) =>
        req.key === key ? { ...req, ...updates } : req
      ),
      isDirty: true,
    }));
  },

  removeTableRequirement: (key) => {
    set((state) => {
      const { [key]: _, ...remainingTables } = state.tables;
      return {
        tableRequirements: state.tableRequirements.filter((req) => req.key !== key),
        tables: remainingTables,
        isDirty: true,
      };
    });
  },

  setTableBinding: (key, binding) => {
    set((state) => ({
      tables: { ...state.tables, [key]: binding },
      isDirty: true,
    }));
  },
});


