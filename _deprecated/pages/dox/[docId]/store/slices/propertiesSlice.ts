/**
 * Properties Slice
 * 
 * Manages document frontmatter properties editing state.
 */

import type { StateCreator } from "zustand";
import type { DocsStore } from "../types";

// 1. State Interface
export interface PropertiesSliceState {
  properties: Record<string, unknown>;
  isEditing: boolean;
  editedProperties: Record<string, unknown>;
}

// 2. Actions Interface
export interface PropertiesSliceActions {
  setProperties: (properties: Record<string, unknown>) => void;
  updateProperty: (key: string, value: unknown) => void;
  setEditing: (editing: boolean) => void;
  saveProperties: () => Promise<void>;
  resetProperties: () => void;
}

// 3. Combined Slice Type
export type PropertiesSlice = PropertiesSliceState & PropertiesSliceActions;

// 4. Initial State
const initialState: PropertiesSliceState = {
  properties: {},
  isEditing: false,
  editedProperties: {},
};

// 5. Slice Creator
export const createPropertiesSlice: StateCreator<
  DocsStore,
  [],
  [],
  PropertiesSlice
> = (set, get) => ({
  ...initialState,

  setProperties: (properties) =>
    set({ properties, editedProperties: { ...properties } }),

  updateProperty: (key, value) =>
    set((state) => ({
      editedProperties: { ...state.editedProperties, [key]: value },
    })),

  setEditing: (editing) => set({ isEditing: editing }),

  saveProperties: async () => {
    const state = get();
    if (!state.docId) return;

    try {
      const response = await fetch(`/api/dox/${state.docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ properties: state.editedProperties }),
      });

      if (!response.ok) {
        throw new Error("Failed to save properties");
      }

      set({
        properties: { ...state.editedProperties },
        isEditing: false,
      });
    } catch (error) {
      console.error("[Properties] Save error:", error);
      throw error;
    }
  },

  resetProperties: () =>
    set((state) => ({
      editedProperties: { ...state.properties },
      isEditing: false,
    })),
});
