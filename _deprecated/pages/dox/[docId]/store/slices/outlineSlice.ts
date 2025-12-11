/**
 * Outline Slice
 * 
 * Manages document outline (heading structure) for navigation.
 */

import type { StateCreator } from "zustand";
import type { DocsStore } from "../types";

export interface OutlineItem {
  level: number;
  text: string;
  id: string;
  position: number;
}

// 1. State Interface
export interface OutlineSliceState {
  headings: OutlineItem[];
  activeHeadingId: string | null;
  expandedSections: Set<string>;
}

// 2. Actions Interface
export interface OutlineSliceActions {
  setHeadings: (headings: OutlineItem[]) => void;
  setActiveHeading: (headingId: string | null) => void;
  toggleSection: (headingId: string) => void;
}

// 3. Combined Slice Type
export type OutlineSlice = OutlineSliceState & OutlineSliceActions;

// 4. Initial State
const initialState: OutlineSliceState = {
  headings: [],
  activeHeadingId: null,
  expandedSections: new Set(),
};

// 5. Slice Creator
export const createOutlineSlice: StateCreator<
  DocsStore,
  [],
  [],
  OutlineSlice
> = (set) => ({
  ...initialState,

  setHeadings: (headings) => set({ headings }),

  setActiveHeading: (headingId) => set({ activeHeadingId: headingId }),

  toggleSection: (headingId) =>
    set((state) => {
      const expanded = new Set(state.expandedSections);
      if (expanded.has(headingId)) {
        expanded.delete(headingId);
      } else {
        expanded.add(headingId);
      }
      return { expandedSections: expanded };
    }),
});
