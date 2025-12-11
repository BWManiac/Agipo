/**
 * UI Slice
 * Manages UI state: sidebar visibility, active tabs, dialogs.
 * Controls the layout and visibility of UI elements in the browser automation playground.
 * Powers sidebar toggles, tab switching, and dialog open/close states.
 */

import { StateCreator } from "zustand";
import type { BrowserStore } from "../index";

// 1. State Interface
export interface UiSliceState {
  sidebarCollapsed: boolean;
  // Whether the sidebar is collapsed. Controls sidebar visibility in the layout.
  chatPanelTab: "chat" | "actions";
  // Active tab in the chat panel. Switches between chat interface and action log.
  newSessionDialogOpen: boolean;
  // Whether the new session dialog is open. Controls dialog visibility.
}

// 2. Actions Interface
export interface UiSliceActions {
  toggleSidebar: () => void;
  // Toggles sidebar collapsed state. Called when user clicks sidebar toggle button.
  setSidebarCollapsed: (collapsed: boolean) => void;
  // Sets sidebar collapsed state. Called when sidebar state needs to be set programmatically.
  setChatPanelTab: (tab: "chat" | "actions") => void;
  // Sets the active tab in chat panel. Called when user clicks chat/actions tab.
  openNewSessionDialog: () => void;
  // Opens the new session dialog. Called when user clicks create session button.
  closeNewSessionDialog: () => void;
  // Closes the new session dialog. Called when user cancels or creates session.
}

// 3. Combined Slice Type
export type UiSlice = UiSliceState & UiSliceActions;

// 4. Initial State
const initialState: UiSliceState = {
  sidebarCollapsed: false, // Start with sidebar expanded - users need access to session list
  chatPanelTab: "chat", // Start with chat tab active - primary interaction mode
  newSessionDialogOpen: false, // Dialog closed initially - user hasn't clicked create yet
};

// 5. Slice Creator
export const createUiSlice: StateCreator<BrowserStore, [], [], UiSlice> = (
  set
) => ({
  ...initialState,

  toggleSidebar: () => {
    set((state) => {
      const newState = !state.sidebarCollapsed;
      console.log("🔄 UiSlice: Toggling sidebar:", newState ? "collapsed" : "expanded");
      return { sidebarCollapsed: newState };
    });
  },

  setSidebarCollapsed: (collapsed) => {
    console.log("🔄 UiSlice: Setting sidebar collapsed:", collapsed);
    set({ sidebarCollapsed: collapsed });
  },

  setChatPanelTab: (tab) => {
    console.log("🔄 UiSlice: Setting chat panel tab:", tab);
    set({ chatPanelTab: tab });
  },

  openNewSessionDialog: () => {
    console.log("📝 UiSlice: Opening new session dialog");
    set({ newSessionDialogOpen: true });
  },

  closeNewSessionDialog: () => {
    console.log("❌ UiSlice: Closing new session dialog");
    set({ newSessionDialogOpen: false });
  },
});
