import type { StateCreator } from "zustand";
import type { WorkflowStore } from "../types";

/**
 * Manages right-side UI state (panels, sidebar, view mode, selection).
 * Enables users to switch between list/canvas views, open different panels
 * (palette, inputs, config, connections, test), and select steps for editing.
 * Powers the settings sidebar and view toggles. Uses ShadCN components for consistent styling.
 */

export type ViewMode = "list" | "canvas";
export type ActivePanel = "palette" | "inputs" | "config" | "connections" | "test" | null;

// 1. State Interface
export interface UiSliceState {
  viewMode: ViewMode;
  // Current view mode: "list" shows step timeline, "canvas" shows node-based graph view.
  activePanel: ActivePanel;
  // Currently active right-side panel. Null when sidebar is closed, otherwise shows specific panel (tools, inputs, etc.).
  sidebarExpanded: boolean;
  // Whether the right sidebar is expanded or collapsed. Controls visibility of settings/inspector panel.
}

// 2. Actions Interface
export interface UiSliceActions {
  setViewMode: (mode: ViewMode) => void;
  // Switches between list and canvas views. Called when user clicks view toggle in header.
  setActivePanel: (panel: ActivePanel) => void;
  // Opens a specific panel in the right sidebar (tools palette, inputs, config, etc.). Null closes sidebar.
  setSidebarExpanded: (expanded: boolean) => void;
  // Expands or collapses the right sidebar. Called when user clicks sidebar toggle button.
}

// 3. Combined Slice Type
export type UiSlice = UiSliceState & UiSliceActions;

// 4. Initial State
const initialState: UiSliceState = {
  viewMode: "list", // Start with list view - more intuitive for beginners, shows step timeline clearly
  activePanel: null, // Start with no panel open - sidebar closed until user needs to access tools/settings
  sidebarExpanded: true, // Start with sidebar expanded - users typically need access to tools when building workflows
};

// 5. Slice Creator
export const createUiSlice: StateCreator<
  WorkflowStore,
  [],
  [],
  UiSlice
> = (set) => ({
  ...initialState,
  setViewMode: (mode) => set({ viewMode: mode }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
});



