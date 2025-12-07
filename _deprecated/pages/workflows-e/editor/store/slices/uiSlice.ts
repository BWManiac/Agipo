import type { StateCreator } from "zustand";
import type { UISlice, WorkflowEditorStore, ActivePanel, ViewMode, AbstractionLevel, ActiveSettingsTab } from "../types";

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
  
  // Variation E unique: Abstraction level (default to "flow")
  abstractionLevel: "flow",
  
  // Variation E unique: AI panel expanded by default
  aiPanelExpanded: true,
  
  // Variation E unique: Settings tab (default to "tools")
  activeSettingsTab: "tools",

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
  
  // Variation E unique actions
  setAbstractionLevel: (level: AbstractionLevel) => set({ abstractionLevel: level }),
  
  toggleAIPanel: () => set((state) => ({ 
    aiPanelExpanded: !state.aiPanelExpanded 
  })),
  
  setActiveSettingsTab: (tab: ActiveSettingsTab) => set({ activeSettingsTab: tab }),
});


