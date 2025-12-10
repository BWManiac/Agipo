/**
 * UI Slice
 * 
 * Manages UI state (panel visibility, modals, etc.).
 */

import type { StateCreator } from "zustand";
import type { DocsStore } from "../types";

// 1. State Interface
export interface UiSliceState {
  outlineCollapsed: boolean;
  chatCollapsed: boolean;
  propertiesCollapsed: boolean;
  settingsOpen: boolean;
  versionPanelOpen: boolean;
  versionCompareOpen: boolean;
  error: string | null;
}

// 2. Actions Interface
export interface UiSliceActions {
  toggleOutline: () => void;
  toggleChat: () => void;
  toggleProperties: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  toggleVersionPanel: () => void;
  openVersionCompare: () => void;
  closeVersionCompare: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// 3. Combined Slice Type
export type UiSlice = UiSliceState & UiSliceActions;

// 4. Initial State
const initialState: UiSliceState = {
  outlineCollapsed: false,
  chatCollapsed: false,
  propertiesCollapsed: false,
  settingsOpen: false,
  versionPanelOpen: false,
  versionCompareOpen: false,
  error: null,
};

// 5. Slice Creator
export const createUiSlice: StateCreator<
  DocsStore,
  [],
  [],
  UiSlice
> = (set) => ({
  ...initialState,

  toggleOutline: () =>
    set((state) => ({ outlineCollapsed: !state.outlineCollapsed })),

  toggleChat: () =>
    set((state) => ({ chatCollapsed: !state.chatCollapsed })),

  toggleProperties: () =>
    set((state) => ({ propertiesCollapsed: !state.propertiesCollapsed })),

  openSettings: () => set({ settingsOpen: true }),

  closeSettings: () => set({ settingsOpen: false }),

  toggleVersionPanel: () =>
    set((state) => ({ versionPanelOpen: !state.versionPanelOpen })),

  openVersionCompare: () => set({ versionCompareOpen: true }),

  closeVersionCompare: () => set({ versionCompareOpen: false }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),
});
