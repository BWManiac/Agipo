import type { StateCreator } from "zustand";
import type { WorkflowStore } from "../../types";

/**
 * UI state for the Details tab in the right panel.
 * Tracks which field is being edited and schema loading state.
 * Separate from bindingsSlice to keep UI concerns isolated from data.
 */

// 1. State Interface
export interface DetailsSliceState {
  expandedField: string | null;
  // Name of the field currently expanded for editing. Used to show path picker or expanded source selector.
  isSchemaLoading: boolean;
  // Indicates if step schema is currently being fetched. Used to show loading spinner in Details tab.
  schemaError: string | null;
  // Error message if schema fetch failed. Used to show error state in Details tab.
}

// 2. Actions Interface
export interface DetailsSliceActions {
  setExpandedField: (field: string | null) => void;
  // Sets which field is expanded for editing. Called when user clicks on a field to configure its source.
  setSchemaLoading: (loading: boolean) => void;
  // Updates schema loading state. Called when fetching step schema from API.
  setSchemaError: (error: string | null) => void;
  // Sets schema fetch error. Called when schema API request fails.
}

// 3. Combined Slice Type
export type DetailsSlice = DetailsSliceState & DetailsSliceActions;

// 4. Initial State
const initialState: DetailsSliceState = {
  expandedField: null, // Start with no field expanded - user hasn't clicked on any field yet
  isSchemaLoading: false, // Start not loading - schema fetched on step selection
  schemaError: null, // Start with no error - schema hasn't been fetched yet
};

// 5. Slice Creator
export const createDetailsSlice: StateCreator<
  WorkflowStore,
  [],
  [],
  DetailsSlice
> = (set) => ({
  ...initialState,

  setExpandedField: (field) => set({ expandedField: field }),
  setSchemaLoading: (loading) => set({ isSchemaLoading: loading }),
  setSchemaError: (error) => set({ schemaError: error }),
});
