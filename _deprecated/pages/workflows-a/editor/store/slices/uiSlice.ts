import type { StateCreator } from "zustand";
import type { UISlice, WorkflowEditorStore, ActivePanel, ViewMode } from "../types";

export const createUISlice: StateCreator<
  WorkflowEditorStore,
  [],
  [],
  UISlice
> = (set) => ({
  // Initial state
  selectedStepId: null,
  activePanel: "palette",
  viewMode: "list",
  isSidebarCollapsed: false,
  isInspectorCollapsed: false,

  // Actions
  setSelectedStep: (id) => set({ selectedStepId: id }),

  setActivePanel: (panel: ActivePanel) => set({ activePanel: panel }),

  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),

  toggleSidebar: () => set((state) => ({ 
    isSidebarCollapsed: !state.isSidebarCollapsed 
  })),

  toggleInspector: () => set((state) => ({ 
    isInspectorCollapsed: !state.isInspectorCollapsed 
  })),
});




