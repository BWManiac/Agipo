import type { StateCreator } from "zustand";
import type { UISlice, WorkflowsDStore, ActivePanel, ViewMode, AbstractionLevel } from "../types";

export const createUISlice: StateCreator<
  WorkflowsDStore,
  [],
  [],
  UISlice
> = (set) => ({
  // Initial state
  selectedStepId: null,
  activePanel: "tools",
  viewMode: "list",
  abstractionLevel: "flow",
  isChatPanelCollapsed: false,
  isInspectorCollapsed: false,

  // Actions
  setSelectedStep: (id) => set({ selectedStepId: id }),

  setActivePanel: (panel: ActivePanel) => set({ activePanel: panel }),

  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),

  setAbstractionLevel: (level: AbstractionLevel) => set({ abstractionLevel: level }),

  toggleChatPanel: () => set((state) => ({ 
    isChatPanelCollapsed: !state.isChatPanelCollapsed 
  })),

  toggleInspector: () => set((state) => ({ 
    isInspectorCollapsed: !state.isInspectorCollapsed 
  })),
});




