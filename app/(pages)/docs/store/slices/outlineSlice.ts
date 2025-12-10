// Outline Slice - Document outline/headings state management

import type { StateCreator } from "zustand";
import type { OutlineSlice, DocsStore, OutlineHeading } from "../types";
import { nanoid } from "nanoid";

export const createOutlineSlice: StateCreator<
  DocsStore,
  [],
  [],
  OutlineSlice
> = (set) => ({
  // Initial state
  headings: [],
  activeHeadingId: null,

  setHeadings: (headings) => set({ headings }),

  setActiveHeading: (id) => set({ activeHeadingId: id }),

  extractHeadings: (content: string) => {
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
  },
});
