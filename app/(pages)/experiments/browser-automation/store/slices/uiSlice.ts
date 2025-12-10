/**
 * UI Slice
 * Manages UI state: sidebar visibility, active tabs, dialogs.
 */

import { StateCreator } from "zustand";
import type { BrowserStore } from "../index";

export interface UiSliceState {
  sidebarCollapsed: boolean;
  chatPanelTab: "chat" | "actions";
  newSessionDialogOpen: boolean;
}

export interface UiSliceActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setChatPanelTab: (tab: "chat" | "actions") => void;
  openNewSessionDialog: () => void;
  closeNewSessionDialog: () => void;
}

export type UiSlice = UiSliceState & UiSliceActions;

const initialState: UiSliceState = {
  sidebarCollapsed: false,
  chatPanelTab: "chat",
  newSessionDialogOpen: false,
};

export const createUiSlice: StateCreator<BrowserStore, [], [], UiSlice> = (
  set
) => ({
  ...initialState,

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  setChatPanelTab: (tab) => set({ chatPanelTab: tab }),

  openNewSessionDialog: () => set({ newSessionDialogOpen: true }),

  closeNewSessionDialog: () => set({ newSessionDialogOpen: false }),
});
