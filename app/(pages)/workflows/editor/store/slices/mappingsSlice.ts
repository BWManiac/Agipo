import type { StateCreator } from "zustand";
import type { DataMapping } from "@/app/api/workflows/types";
import type { WorkflowStore } from "../types";

/**
 * Manages how data flows between workflow steps.
 * Enables users to configure field mappings (e.g., "map step 1's 'title' output to step 2's 'subject' input").
 * Powers the data mapping UI where users connect step outputs to step inputs.
 * Essential for building workflows that pass data between actions.
 */

// 1. State Interface
export interface MappingsSliceState {
  mappings: DataMapping[];
  // Array of all data mappings between steps. Defines how data flows from one step's output to another's input.
  activeMappingId: string | null;
  // ID of the mapping currently being edited. Used to highlight mapping in UI and show mapping details.
}

// 2. Actions Interface
export interface MappingsSliceActions {
  addMapping: (mapping: DataMapping) => void;
  // Creates a new data mapping between steps. Called when user connects step outputs to inputs in mapping UI.
  updateMapping: (mappingId: string, updates: Partial<DataMapping>) => void;
  // Updates field mappings within a data mapping. Called when user edits which fields map to which.
  deleteMapping: (mappingId: string) => void;
  // Removes a data mapping. Also clears active mapping if deleted mapping was active.
  setActiveMappingId: (mappingId: string | null) => void;
  // Sets which mapping is currently being edited. Called when user clicks a mapping to view/edit it.
  loadMappings: (mappings: DataMapping[]) => void;
  // Loads all mappings from a workflow definition. Called when loading existing workflow from API.
}

// 3. Combined Slice Type
export type MappingsSlice = MappingsSliceState & MappingsSliceActions;

// 4. Initial State
const initialState: MappingsSliceState = {
  mappings: [], // Start with no mappings - user creates mappings as they connect steps
  activeMappingId: null, // Start with no active mapping - user hasn't selected a mapping to edit yet
};

// 5. Slice Creator
export const createMappingsSlice: StateCreator<
  WorkflowStore,
  [],
  [],
  MappingsSlice
> = (set) => ({
  ...initialState,
  addMapping: (mapping) =>
    set((state) => ({
      mappings: [...state.mappings, mapping],
    })),
  updateMapping: (mappingId, updates) =>
    set((state) => ({
      mappings: state.mappings.map((m) =>
        m.id === mappingId ? { ...m, ...updates } : m
      ),
    })),
  deleteMapping: (mappingId) =>
    set((state) => ({
      mappings: state.mappings.filter((m) => m.id !== mappingId),
      activeMappingId:
        state.activeMappingId === mappingId ? null : state.activeMappingId,
    })),
  setActiveMappingId: (mappingId) => set({ activeMappingId: mappingId }),
  loadMappings: (mappings) => set({ mappings }),
});



