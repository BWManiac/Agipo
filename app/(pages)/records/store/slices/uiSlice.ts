/**
 * UI Slice
 * Manages sidebar state, view mode, and panel visibility.
 */

import type { StateCreator } from "zustand";
import type { RecordsStore } from "../types";

export type SettingsTab = "access" | "activity" | "schema";

// 1. State Interface
export interface UiSliceState {
  sidebarOpen: boolean;
  sidebarWidth: number;
  settingsPanelOpen: boolean;
  settingsPanelTab: SettingsTab;
}

// 2. Actions Interface
export interface UiSliceActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;
  openSettingsPanel: (tab?: SettingsTab) => void;
  closeSettingsPanel: () => void;
  setSettingsPanelTab: (tab: SettingsTab) => void;
  resetUiState: () => void;
}

// 3. Combined Slice Type
export type UiSlice = UiSliceState & UiSliceActions;

// 4. Initial State
const initialState: UiSliceState = {
  sidebarOpen: true,
  sidebarWidth: 320,
  settingsPanelOpen: false,
  settingsPanelTab: "access",
};

// 5. Slice Creator
export const createUiSlice: StateCreator<
  RecordsStore,
  [],
  [],
  UiSlice
> = (set) => ({
  ...initialState,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setSidebarWidth: (width) => set({ sidebarWidth: width }),

  openSettingsPanel: (tab) => set({
    settingsPanelOpen: true,
    settingsPanelTab: tab || "access"
  }),

  closeSettingsPanel: () => set({ settingsPanelOpen: false }),

  setSettingsPanelTab: (tab) => set({ settingsPanelTab: tab }),

  resetUiState: () => set(initialState),
});
