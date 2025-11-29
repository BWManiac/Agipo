import type { StateCreator } from "zustand";

import {
  ensureRuntimeReady,
  teardownRuntime as teardownRuntimeService,
} from "../../services/webcontainerService";
import type { WorkflowGeneratorStore } from "../types";

// 1. State Interface
export interface WebcontainerSliceState {
  /** A flag to indicate if the WebContainer is currently booting up. */
  isBooting: boolean;
  /** A flag to indicate if the WebContainer is ready to execute code. */
  isReady: boolean;
}

// 2. Actions Interface
export interface WebcontainerSliceActions {
  /** Boots the WebContainer runtime if it is not already ready. */
  bootRuntime: () => Promise<void>;
  /** Tears down the WebContainer runtime. */
  teardownRuntime: () => Promise<void>;
}

// 3. Combined Slice Type
export type WebcontainerSlice = WebcontainerSliceState & WebcontainerSliceActions;

// 4. Initial State
const initialState: WebcontainerSliceState = {
  isBooting: true,
  isReady: false,
};

// 5. Slice Creator
export const createWebcontainerSlice: StateCreator<
  WorkflowGeneratorStore,
  [],
  [],
  WebcontainerSlice
> = (set, get) => ({
  ...initialState,

  bootRuntime: async () => {
    if (get().isReady) {
      return;
    }

    set(() => ({
      isBooting: true,
    }));

    try {
      await ensureRuntimeReady();
      set(() => ({
        isReady: true,
      }));
    } finally {
      set(() => ({
        isBooting: false,
      }));
    }
  },

  teardownRuntime: async () => {
    await teardownRuntimeService();
    set(() => ({
      isReady: false,
      isBooting: false,
    }));
  },
});

