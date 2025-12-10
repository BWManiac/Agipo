/**
 * Document Slice
 * 
 * Manages document data state and CRUD actions.
 */

import type { StateCreator } from "zustand";
import type { DocsStore } from "../types";

// 1. State Interface
export interface DocumentSliceState {
  docId: string | null;
  title: string;
  content: string; // Markdown content
  properties: Record<string, unknown>;
  isLoading: boolean;
  error: string | null;
}

// 2. Actions Interface
export interface DocumentSliceActions {
  setDocument: (doc: {
    id: string;
    title: string;
    content: string;
    properties: Record<string, unknown>;
  }) => void;
  updateTitle: (title: string) => void;
  updateContent: (content: string) => void;
  updateProperties: (properties: Record<string, unknown>) => void;
  clearDocument: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// 3. Combined Slice Type
export type DocumentSlice = DocumentSliceState & DocumentSliceActions;

// 4. Initial State
const initialState: DocumentSliceState = {
  docId: null,
  title: "",
  content: "",
  properties: {},
  isLoading: false,
  error: null,
};

// 5. Slice Creator
export const createDocumentSlice: StateCreator<
  DocsStore,
  [],
  [],
  DocumentSlice
> = (set) => ({
  ...initialState,

  setDocument: (doc) =>
    set({
      docId: doc.id,
      title: doc.title,
      content: doc.content,
      properties: doc.properties,
      isLoading: false,
      error: null,
    }),

  updateTitle: (title) => set({ title }),

  updateContent: (content) => set({ content }),

  updateProperties: (properties) =>
    set((state) => ({
      properties: { ...state.properties, ...properties },
    })),

  clearDocument: () => set(initialState),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
});
