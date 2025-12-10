// Editor Slice - Document editing state management

import type { StateCreator } from "zustand";
import type { EditorSlice, DocsStore, SaveStatus } from "../types";
import type { Document } from "@/app/api/docs/services/types";

const initialEditorState = {
  document: null as Document | null,
  content: "",
  editor: null,
  isDirty: false,
  saveStatus: "idle" as SaveStatus,
  lastSavedAt: null as Date | null,
};

export const createEditorSlice: StateCreator<
  DocsStore,
  [],
  [],
  EditorSlice
> = (set, get) => ({
  ...initialEditorState,

  setDocument: (document) => set({ document }),

  setContent: (content) => set({ content }),

  setEditor: (editor) => set({ editor }),

  setIsDirty: (isDirty) => set({ isDirty }),

  setSaveStatus: (saveStatus) => set({ saveStatus }),

  setLastSavedAt: (lastSavedAt) => set({ lastSavedAt }),

  save: async () => {
    const { document, content, isDirty } = get();

    if (!document || !isDirty) return;

    set({ saveStatus: "saving" });

    try {
      const response = await fetch(`/api/docs/${document.frontmatter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      set({
        saveStatus: "saved",
        lastSavedAt: new Date(),
        isDirty: false,
      });
    } catch (error) {
      console.error("Save failed:", error);
      set({ saveStatus: "error" });
    }
  },

  resetEditor: () => set(initialEditorState),
});
