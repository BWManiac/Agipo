/**
 * Editor Slice
 * 
 * Manages Lexical editor instance, auto-save, and dirty state.
 */

import type { StateCreator } from "zustand";
import type { LexicalEditor } from "lexical";
import type { DocsStore } from "../types";
import { lexicalToMarkdown } from "../../../../../../api/dox/services/markdown-parser";

// 1. State Interface
export interface EditorSliceState {
  editor: LexicalEditor | null;
  isDirty: boolean;
  saveStatus: "saved" | "saving" | "error";
  lastSaved: string | null;
  autoSaveTimer: ReturnType<typeof setTimeout> | null;
}

// 2. Actions Interface
export interface EditorSliceActions {
  initializeEditor: (editor: LexicalEditor) => void;
  setDirty: (dirty: boolean) => void;
  setSaveStatus: (status: "saved" | "saving" | "error") => void;
  autoSave: () => Promise<void>;
  cleanup: () => void;
}

// 3. Combined Slice Type
export type EditorSlice = EditorSliceState & EditorSliceActions;

// 4. Initial State
const initialState: EditorSliceState = {
  editor: null,
  isDirty: false,
  saveStatus: "saved",
  lastSaved: null,
  autoSaveTimer: null,
};

// 5. Slice Creator
export const createEditorSlice: StateCreator<
  DocsStore,
  [],
  [],
  EditorSlice
> = (set, get) => ({
  ...initialState,

  initializeEditor: (editor) => {
    set({ editor });
  },

  setDirty: (dirty) => {
    const state = get();
    set({ isDirty: dirty });

    // Clear existing timer
    if (state.autoSaveTimer) {
      clearTimeout(state.autoSaveTimer);
    }

    // Set new timer for auto-save (2 seconds)
    if (dirty) {
      const timer = setTimeout(() => {
        get().autoSave();
      }, 2000);
      set({ autoSaveTimer: timer });
    }
  },

  setSaveStatus: (status) => {
    set({ saveStatus: status });
    if (status === "saved") {
      set({ lastSaved: new Date().toISOString(), isDirty: false });
    }
  },

  autoSave: async () => {
    const state = get();
    const docId = state.docId;
    if (!state.editor || !state.isDirty || !docId) {
      return;
    }

    set({ saveStatus: "saving" });

    try {
      // Get editor state
      const editorState = state.editor.getEditorState();
      const editorStateJson = JSON.stringify(editorState.toJSON());

      // Convert to Markdown
      const markdown = lexicalToMarkdown(editorStateJson);

      // Update document via API
      const response = await fetch(`/api/dox/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: markdown }),
      });

      if (!response.ok) {
        throw new Error("Failed to save document");
      }

      // Update document slice
      state.updateContent(markdown);
      set({ saveStatus: "saved", lastSaved: new Date().toISOString(), isDirty: false });
    } catch (error) {
      console.error("[Editor] Auto-save error:", error);
      set({ saveStatus: "error" });
    }
  },

  cleanup: () => {
    const state = get();
    if (state.autoSaveTimer) {
      clearTimeout(state.autoSaveTimer);
    }
    // Use functional update to avoid triggering re-renders
    set((prev) => ({ ...prev, autoSaveTimer: null }));
  },
});
