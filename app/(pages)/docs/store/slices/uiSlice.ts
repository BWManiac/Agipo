// UI Slice - Panel visibility state management

import type { StateCreator } from "zustand";
import type { UISlice, DocsStore } from "../types";

export const createUISlice: StateCreator<
  DocsStore,
  [],
  [],
  UISlice
> = (set) => ({
  // Initial state
  isOutlineOpen: false,
  isPropertiesOpen: false,
  isChatOpen: false,
  isHistoryOpen: false,
  isShortcutsOpen: false,

  // Toggle actions
  toggleOutline: () => set((state) => ({ isOutlineOpen: !state.isOutlineOpen })),
  toggleProperties: () => set((state) => ({ isPropertiesOpen: !state.isPropertiesOpen })),
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  toggleHistory: () => set((state) => ({ isHistoryOpen: !state.isHistoryOpen })),
  toggleShortcuts: () => set((state) => ({ isShortcutsOpen: !state.isShortcutsOpen })),

  // Set actions
  setOutlineOpen: (open) => set({ isOutlineOpen: open }),
  setPropertiesOpen: (open) => set({ isPropertiesOpen: open }),
  setChatOpen: (open) => set({ isChatOpen: open }),
  setHistoryOpen: (open) => set({ isHistoryOpen: open }),
  setShortcutsOpen: (open) => set({ isShortcutsOpen: open }),
});
