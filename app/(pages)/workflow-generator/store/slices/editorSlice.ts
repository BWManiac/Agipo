import type { StateCreator } from "zustand";

import type { WorkflowGeneratorStore } from "../types";

// 1. State Interface
export type WorkflowLayer = "flow" | "spec" | "code";
export type SidebarTab = "console" | "state" | "context" | "editor";

export interface EditorSliceState {
  /** The currently active tab in the right-hand sidebar. */
  activeSidebarTab: SidebarTab;
  /** The ID of the node currently being edited in the sidebar. */
  editingNodeId: string | null;
  /** The active layer ('flow', 'spec', or 'code') selected in the control panel. */
  activeLayer: WorkflowLayer;
}

// 2. Actions Interface
export interface EditorSliceActions {
  /** Sets the active tab in the sidebar. */
  setSidebarTab: (tab: SidebarTab) => void;
  /** Opens the editor sidebar for a specific node. */
  openEditor: (nodeId: string) => void;
  /** Closes the node editor and returns to the default sidebar view. */
  clearEditor: () => void;
  /** Sets the active layer for all nodes. */
  setActiveLayer: (layer: WorkflowLayer) => void;
}

// 3. Combined Slice Type
export type EditorSlice = EditorSliceState & EditorSliceActions;

// 4. Initial State
const initialState: EditorSliceState = {
  activeSidebarTab: "console",
  editingNodeId: null,
  activeLayer: "flow",
};

// 5. Slice Creator
export const createEditorSlice: StateCreator<
  WorkflowGeneratorStore,
  [],
  [],
  EditorSlice
> = (set) => ({
  ...initialState,

  setSidebarTab: (tab) =>
    set(() => ({
      activeSidebarTab: tab,
    })),

  openEditor: (nodeId) =>
    set(() => ({
      activeSidebarTab: "editor",
      editingNodeId: nodeId,
    })),

  clearEditor: () =>
    set(() => ({
      activeSidebarTab: initialState.activeSidebarTab,
      editingNodeId: null,
    })),

  setActiveLayer: (layer: WorkflowLayer) =>
    set(() => ({
      activeLayer: layer,
    })),
});

