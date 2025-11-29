import type { StateCreator } from "zustand";

import type { WorkflowGeneratorStore } from "../types";

export type ApiKeyMap = Record<string, string>;

export interface SettingsSliceState {
  /** Map of service name -> API key value stored for the current session/workflow. */
  apiKeys: ApiKeyMap;
}

export interface SettingsSliceActions {
  /** Set or replace an API key for the given service name. */
  setApiKey: (service: string, value: string) => void;
  /** Remove a stored API key by service name. */
  removeApiKey: (service: string) => void;
  /** Replace the entire key map (used when loading/saving workflows). */
  replaceApiKeys: (keys: ApiKeyMap) => void;
  /** Clear all stored keys. */
  clearAllApiKeys: () => void;
}

export type SettingsSlice = SettingsSliceState & SettingsSliceActions;

const initialState: SettingsSliceState = {
  apiKeys: {},
};

export const createSettingsSlice: StateCreator<
  WorkflowGeneratorStore,
  [],
  [],
  SettingsSlice
> = (set) => ({
  ...initialState,

  setApiKey: (service, value) =>
    set((state) => ({
      apiKeys: {
        ...state.apiKeys,
        [service.trim()]: value,
      },
    })),

  removeApiKey: (service) =>
    set((state) => {
      const next = { ...state.apiKeys };
      delete next[service];
      return { apiKeys: next };
    }),

  replaceApiKeys: (keys) =>
    set({
      apiKeys: { ...keys },
    }),

  clearAllApiKeys: () => set({ apiKeys: {} }),
});


