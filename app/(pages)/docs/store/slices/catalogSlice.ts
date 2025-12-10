// Catalog Slice - Document list state management

import type { StateCreator } from "zustand";
import type { CatalogSlice, DocsStore } from "../types";

export const createCatalogSlice: StateCreator<
  DocsStore,
  [],
  [],
  CatalogSlice
> = (set, get) => ({
  // Initial state
  documents: [],
  isLoading: false,
  error: null,

  // Fetch all documents
  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/docs");
      if (!response.ok) throw new Error("Failed to fetch documents");
      const data = await response.json();
      set({ documents: data.documents, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch documents",
        isLoading: false,
      });
    }
  },

  // Create new document
  createDocument: async (title?: string) => {
    try {
      const response = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error("Failed to create document");
      const data = await response.json();
      const docId = data.document.frontmatter.id;

      // Refresh the document list
      get().fetchDocuments();

      return docId;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to create document",
      });
      return null;
    }
  },

  // Delete document
  deleteDocument: async (docId: string) => {
    try {
      const response = await fetch(`/api/docs/${docId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete document");

      // Remove from local state immediately
      set((state) => ({
        documents: state.documents.filter((doc) => doc.id !== docId),
      }));

      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to delete document",
      });
      return false;
    }
  },
});
