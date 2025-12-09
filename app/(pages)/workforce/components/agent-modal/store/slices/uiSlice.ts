/**
 * UI Slice
 * 
 * Manages modal UI state and editor views.
 * Handles tabs, editor states, selections, and search filters.
 */

import type { StateCreator } from "zustand";
import type { TabId } from "../../AgentModal";
import type { WorkflowBinding } from "@/_tables/types";
import type { AgentModalStore } from "../types";

export type ViewState = "list" | "connection-editor" | "workflow-editor";

// 1. State Interface
export interface UiSliceState {
  // Modal state
  activeTab: TabId;
  
  // Editor views
  view: ViewState;
  isCustomEditorOpen: boolean;
  
  // Connection editor UI
  selectedConnectionBindings: Set<string>;
  expandedToolkits: Set<string>;
  connectionSearchQuery: string;
  
  // Workflow editor UI
  selectedWorkflowBindings: Map<string, WorkflowBinding>;
  expandedWorkflows: Set<string>;
  workflowSearchQuery: string;
  
  // Saving states
  isSavingCustomTools: boolean;
  isSavingConnectionTools: boolean;
  isSavingWorkflows: boolean;
}

// 2. Actions Interface
export interface UiSliceActions {
  // Tab management
  setActiveTab: (tab: TabId) => void;
  
  // Editor views
  setView: (view: ViewState) => void;
  openCustomEditor: () => void;
  closeCustomEditor: () => void;
  
  // Connection editor UI
  toggleConnectionBinding: (key: string) => void;
  toggleToolkit: (toolkitSlug: string) => void;
  setConnectionSearchQuery: (query: string) => void;
  
  // Workflow editor UI
  toggleWorkflow: (workflowId: string) => void;
  toggleExpandedWorkflow: (workflowId: string) => void;
  setWorkflowConnection: (workflowId: string, toolkitSlug: string, connectionId: string) => void;
  setWorkflowSearchQuery: (query: string) => void;
  
  // Reset
  resetEditorState: () => void;
}

// 3. Combined Slice Type
export type UiSlice = UiSliceState & UiSliceActions;

// 4. Initial State
const initialState: UiSliceState = {
  activeTab: "overview",
  view: "list",
  isCustomEditorOpen: false,
  selectedConnectionBindings: new Set(),
  expandedToolkits: new Set(),
  connectionSearchQuery: "",
  selectedWorkflowBindings: new Map(),
  expandedWorkflows: new Set(),
  workflowSearchQuery: "",
  isSavingCustomTools: false,
  isSavingConnectionTools: false,
  isSavingWorkflows: false,
};

// 5. Slice Creator
export const createUiSlice: StateCreator<
  AgentModalStore,
  [],
  [],
  UiSlice
> = (set, get) => ({
  ...initialState,

  setActiveTab: (tab) => {
    console.log("[UiSlice] Setting active tab:", tab);
    set({ activeTab: tab });
  },

  setView: (view) => {
    console.log("[UiSlice] Setting view:", view);
    set({ view });
  },

  openCustomEditor: () => {
    console.log("[UiSlice] Opening custom editor");
    set({ isCustomEditorOpen: true });
  },

  closeCustomEditor: () => {
    console.log("[UiSlice] Closing custom editor");
    set({ isCustomEditorOpen: false });
  },

  toggleConnectionBinding: (key) => {
    const state = get();
    const newSet = new Set(state.selectedConnectionBindings);
    
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    
    set({ selectedConnectionBindings: newSet });
  },

  toggleToolkit: (toolkitSlug) => {
    const state = get();
    const newSet = new Set(state.expandedToolkits);
    
    if (newSet.has(toolkitSlug)) {
      newSet.delete(toolkitSlug);
    } else {
      newSet.add(toolkitSlug);
    }
    
    set({ expandedToolkits: newSet });
  },

  setConnectionSearchQuery: (query) => {
    set({ connectionSearchQuery: query });
  },

  toggleWorkflow: (workflowId) => {
    const state = get();
    const newBindings = new Map(state.selectedWorkflowBindings);
    const newExpanded = new Set(state.expandedWorkflows);
    const capabilities = get();

    if (newBindings.has(workflowId)) {
      newBindings.delete(workflowId);
      newExpanded.delete(workflowId);
    } else {
      const workflow = capabilities.availableWorkflows.find((w) => w.id === workflowId);
      if (workflow) {
        newBindings.set(workflowId, {
          workflowId,
          connectionBindings: {},
        });
        newExpanded.add(workflowId);
      }
    }

    set({
      selectedWorkflowBindings: newBindings,
      expandedWorkflows: newExpanded,
    });
  },

  toggleExpandedWorkflow: (workflowId) => {
    const state = get();
    const newExpanded = new Set(state.expandedWorkflows);
    
    if (newExpanded.has(workflowId)) {
      newExpanded.delete(workflowId);
    } else {
      newExpanded.add(workflowId);
    }
    
    set({ expandedWorkflows: newExpanded });
  },

  setWorkflowConnection: (workflowId, toolkitSlug, connectionId) => {
    const state = get();
    const newBindings = new Map(state.selectedWorkflowBindings);
    const binding = newBindings.get(workflowId);
    
    if (binding) {
      newBindings.set(workflowId, {
        ...binding,
        connectionBindings: {
          ...binding.connectionBindings,
          [toolkitSlug]: connectionId,
        },
      });
      set({ selectedWorkflowBindings: newBindings });
    }
  },

  setWorkflowSearchQuery: (query) => {
    set({ workflowSearchQuery: query });
  },

  resetEditorState: () => {
    console.log("[UiSlice] Resetting editor state");
    set({
      view: "list",
      isCustomEditorOpen: false,
      selectedConnectionBindings: new Set(),
      expandedToolkits: new Set(),
      connectionSearchQuery: "",
      selectedWorkflowBindings: new Map(),
      expandedWorkflows: new Set(),
      workflowSearchQuery: "",
    });
  },
});

