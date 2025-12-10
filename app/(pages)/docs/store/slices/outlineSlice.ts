/**
 * Outline Slice
 * 
 * Manages document outline/headings state.
 * Handles extracting headings from content and tracking active heading.
 */

import type { StateCreator } from "zustand";
import { nanoid } from "nanoid";
import type { DocsStore } from "../types";

// Outline Heading Type
export interface OutlineHeading {
  id: string;
  text: string;
  level: number;
  position: number;
}

// 1. State Interface
export interface OutlineSliceState {
  /** List of document headings */
  headings: OutlineHeading[];
  
  /** Currently active heading ID */
  activeHeadingId: string | null;
}

// 2. Actions Interface
export interface OutlineSliceActions {
  /** Set headings directly */
  setHeadings: (headings: OutlineHeading[]) => void;
  
  /** Set the active heading ID */
  setActiveHeading: (id: string | null) => void;
  
  /** Extract headings from markdown content */
  extractHeadings: (content: string) => void;
}

// 3. Combined Slice Type
export type OutlineSlice = OutlineSliceState & OutlineSliceActions;

// 4. Initial State
const initialState: OutlineSliceState = {
  headings: [],
  activeHeadingId: null,
};

// 5. Slice Creator
export const createOutlineSlice: StateCreator<
  DocsStore,
  [],
  [],
  OutlineSlice
> = (set) => ({
  ...initialState,

  setHeadings: (headings) => {
    console.log("[OutlineSlice] Setting headings:", headings.length);
    set({ headings });
  },

  setActiveHeading: (id) => {
    set({ activeHeadingId: id });
  },

  extractHeadings: (content) => {
    console.log("[OutlineSlice] Extracting headings from content");
    
    const lines = content.split("\n");
    const headings: OutlineHeading[] = [];

    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headings.push({
          id: nanoid(),
          text: match[2].trim(),
          level: match[1].length,
          position: index,
        });
      }
    });

    set({ headings });
    console.log("[OutlineSlice] Extracted headings:", headings.length);
  },
});
