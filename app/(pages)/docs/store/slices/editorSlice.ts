/**
 * Editor Slice
 * 
 * Manages document editing state and auto-save functionality.
 * Handles editor instance, content changes, and save operations.
 */

import type { StateCreator } from "zustand";
import type { LexicalEditor } from "lexical";
import type { Document } from "@/app/api/docs/services/types";
import type { DocsStore } from "../types";

// Save Status Type
export type SaveStatus = "idle" | "saving" | "saved" | "error";

// 1. State Interface
export interface EditorSliceState {
  /** Current document being edited */
  document: Document | null;
  
  /** Current editor content */
  content: string;
  
  /** Lexical editor instance */
  editor: LexicalEditor | null;
  
  /** Whether content has unsaved changes */
  isDirty: boolean;
  
  /** Current save status */
  saveStatus: SaveStatus;
  
  /** Timestamp of last successful save */
  lastSavedAt: Date | null;
}

// 2. Actions Interface
export interface EditorSliceActions {
  /** Set the current document */
  setDocument: (document: Document) => void;
  
  /** Set the editor content */
  setContent: (content: string) => void;
  
  /** Set the Lexical editor instance */
  setEditor: (editor: LexicalEditor | null) => void;
  
  /** Set the dirty state */
  setIsDirty: (isDirty: boolean) => void;
  
  /** Set the save status */
  setSaveStatus: (status: SaveStatus) => void;
  
  /** Set the last saved timestamp */
  setLastSavedAt: (date: Date) => void;
  
  /** Save the current document content */
  save: () => Promise<void>;
  
  /** Reset editor to initial state */
  resetEditor: () => void;
}

// 3. Combined Slice Type
export type EditorSlice = EditorSliceState & EditorSliceActions;

// 4. Initial State
const initialState: EditorSliceState = {
  document: null,
  content: "",
  editor: null,
  isDirty: false,
  saveStatus: "idle",
  lastSavedAt: null,
};

// 5. Slice Creator
export const createEditorSlice: StateCreator<
  DocsStore,
  [],
  [],
  EditorSlice
> = (set, get) => ({
  ...initialState,

  setDocument: (document) => {
    console.log("[EditorSlice] Setting document:", document?.frontmatter.id);
    set({ document });
  },

  setContent: (content) => {
    set({ content });
  },

  setEditor: (editor) => {
    console.log("[EditorSlice] Setting editor instance");
    set({ editor });
  },

  setIsDirty: (isDirty) => {
    set({ isDirty });
  },

  setSaveStatus: (saveStatus) => {
    set({ saveStatus });
  },

  setLastSavedAt: (lastSavedAt) => {
    set({ lastSavedAt });
  },

  save: async () => {
    const { document, content, isDirty } = get();

    if (!document) {
      console.error("[EditorSlice] Save failed: No document loaded");
      return;
    }

    if (!isDirty) {
      console.log("[EditorSlice] No changes to save");
      return;
    }

    console.log("[EditorSlice] Saving document:", document.frontmatter.id);
    set({ saveStatus: "saving" });

    try {
      const docId = document.frontmatter.id;
      const response = await fetch(`/api/docs/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      set({
        saveStatus: "saved",
        lastSavedAt: new Date(),
        isDirty: false,
      });

      console.log("[EditorSlice] Document saved successfully");
    } catch (error) {
      console.error("[EditorSlice] Save failed:", error);
      set({ saveStatus: "error" });
    }
  },

  resetEditor: () => {
    console.log("[EditorSlice] Resetting editor");
    set(initialState);
  },
});
