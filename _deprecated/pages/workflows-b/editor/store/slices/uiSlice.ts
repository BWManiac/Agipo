/**
 * UI Slice
 * 
 * Manages transient UI state for the workflow editor:
 * - Selected step
 * - Expanded steps
 * - Active panel tab
 * - Modal states
 */

import type { StateCreator } from "zustand";
import type { 
  WorkflowsBStore, 
  UISlice, 
  UISliceState,
  RightPanelTab,
} from "../types";

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: UISliceState = {
  selectedStepId: null,
  expandedStepIds: new Set<string>(),
  rightPanelTab: "tools",
  isAddStepModalOpen: false,
  isMappingModalOpen: false,
  mappingModalStepId: null,
  isLeftPanelCollapsed: false,
};

// =============================================================================
// SLICE CREATOR
// =============================================================================

export const createUISlice: StateCreator<
  WorkflowsBStore,
  [],
  [],
  UISlice
> = (set) => ({
  ...initialState,

  setSelectedStep: (stepId) => {
    set({ selectedStepId: stepId });
  },

  toggleStepExpanded: (stepId) => {
    set((state) => {
      const newExpanded = new Set(state.expandedStepIds);
      if (newExpanded.has(stepId)) {
        newExpanded.delete(stepId);
      } else {
        newExpanded.add(stepId);
      }
      return { expandedStepIds: newExpanded };
    });
  },

  expandStep: (stepId) => {
    set((state) => {
      const newExpanded = new Set(state.expandedStepIds);
      newExpanded.add(stepId);
      return { expandedStepIds: newExpanded };
    });
  },

  collapseStep: (stepId) => {
    set((state) => {
      const newExpanded = new Set(state.expandedStepIds);
      newExpanded.delete(stepId);
      return { expandedStepIds: newExpanded };
    });
  },

  collapseAllSteps: () => {
    set({ expandedStepIds: new Set() });
  },

  setRightPanelTab: (tab: RightPanelTab) => {
    set({ rightPanelTab: tab });
  },

  openAddStepModal: () => {
    set({ isAddStepModalOpen: true });
  },

  closeAddStepModal: () => {
    set({ isAddStepModalOpen: false });
  },

  openMappingModal: (stepId) => {
    set({ 
      isMappingModalOpen: true, 
      mappingModalStepId: stepId,
    });
  },

  closeMappingModal: () => {
    set({ 
      isMappingModalOpen: false, 
      mappingModalStepId: null,
    });
  },

  toggleLeftPanel: () => {
    set((state) => ({ 
      isLeftPanelCollapsed: !state.isLeftPanelCollapsed 
    }));
  },

  resetUI: () => {
    set(initialState);
  },
});




