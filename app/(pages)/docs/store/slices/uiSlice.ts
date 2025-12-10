/**
 * UI Slice
 * 
 * Manages panel visibility and UI state.
 * Handles toggling and setting panel open/closed states.
 */

import type { StateCreator } from "zustand";
import type { DocsStore } from "../types";

// 1. State Interface
export interface UISliceState {
  /** Whether outline sidebar is open */
  isOutlineOpen: boolean;
  
  /** Whether properties panel is open */
  isPropertiesOpen: boolean;
  
  /** Whether chat sidebar is open */
  isChatOpen: boolean;
  
  /** Whether history panel is open */
  isHistoryOpen: boolean;
  
  /** Whether shortcuts dialog is open */
  isShortcutsOpen: boolean;
}

// 2. Actions Interface
export interface UISliceActions {
  /** Toggle outline sidebar */
  toggleOutline: () => void;
  
  /** Toggle properties panel */
  toggleProperties: () => void;
  
  /** Toggle chat sidebar */
  toggleChat: () => void;
  
  /** Toggle history panel */
  toggleHistory: () => void;
  
  /** Toggle shortcuts dialog */
  toggleShortcuts: () => void;
  
  /** Set outline sidebar open state */
  setOutlineOpen: (open: boolean) => void;
  
  /** Set properties panel open state */
  setPropertiesOpen: (open: boolean) => void;
  
  /** Set chat sidebar open state */
  setChatOpen: (open: boolean) => void;
  
  /** Set history panel open state */
  setHistoryOpen: (open: boolean) => void;
  
  /** Set shortcuts dialog open state */
  setShortcutsOpen: (open: boolean) => void;
}

// 3. Combined Slice Type
export type UISlice = UISliceState & UISliceActions;

// 4. Initial State
const initialState: UISliceState = {
  isOutlineOpen: false,
  isPropertiesOpen: false,
  isChatOpen: true,
  isHistoryOpen: false,
  isShortcutsOpen: false,
};

// 5. Slice Creator
export const createUISlice: StateCreator<
  DocsStore,
  [],
  [],
  UISlice
> = (set) => ({
  ...initialState,

  toggleOutline: () => {
    set((state) => {
      const newValue = !state.isOutlineOpen;
      console.log("[UISlice] Toggling outline:", newValue);
      return { isOutlineOpen: newValue };
    });
  },

  toggleProperties: () => {
    set((state) => {
      const newValue = !state.isPropertiesOpen;
      console.log("[UISlice] Toggling properties:", newValue);
      return { isPropertiesOpen: newValue };
    });
  },

  toggleChat: () => {
    set((state) => {
      const newValue = !state.isChatOpen;
      console.log("[UISlice] Toggling chat:", newValue);
      return { isChatOpen: newValue };
    });
  },

  toggleHistory: () => {
    set((state) => {
      const newValue = !state.isHistoryOpen;
      console.log("[UISlice] Toggling history:", newValue);
      return { isHistoryOpen: newValue };
    });
  },

  toggleShortcuts: () => {
    set((state) => {
      const newValue = !state.isShortcutsOpen;
      console.log("[UISlice] Toggling shortcuts:", newValue);
      return { isShortcutsOpen: newValue };
    });
  },

  setOutlineOpen: (open) => {
    console.log("[UISlice] Setting outline open:", open);
    set({ isOutlineOpen: open });
  },

  setPropertiesOpen: (open) => {
    console.log("[UISlice] Setting properties open:", open);
    set({ isPropertiesOpen: open });
  },

  setChatOpen: (open) => {
    console.log("[UISlice] Setting chat open:", open);
    set({ isChatOpen: open });
  },

  setHistoryOpen: (open) => {
    console.log("[UISlice] Setting history open:", open);
    set({ isHistoryOpen: open });
  },

  setShortcutsOpen: (open) => {
    console.log("[UISlice] Setting shortcuts open:", open);
    set({ isShortcutsOpen: open });
  },
});
