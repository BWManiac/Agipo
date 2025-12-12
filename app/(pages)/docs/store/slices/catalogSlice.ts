/**
 * Catalog Slice
 * 
 * Manages document list state and catalog operations.
 * Handles fetching, creating, and deleting documents.
 */

import type { StateCreator } from "zustand";
import type { DocumentListItem } from "@/app/api/docs/services/types";
import type { DocsStore } from "../types";

// 1. State Interface
export interface CatalogSliceState {
  /** List of all documents */
  documents: DocumentListItem[];
  
  /** Loading state for catalog operations */
  isLoading: boolean;
  
  /** Error state */
  error: string | null;
}

// 2. Actions Interface
export interface CatalogSliceActions {
  /** Fetch all documents from the API */
  fetchDocuments: () => Promise<void>;
  
  /** Create a new document */
  createDocument: (title?: string) => Promise<string | null>;

  /** Delete a document by ID */
  deleteDocument: (docId: string) => Promise<boolean>;
}

// 3. Combined Slice Type
export type CatalogSlice = CatalogSliceState & CatalogSliceActions;

// 4. Initial State
const initialState: CatalogSliceState = {
  documents: [],
  isLoading: false,
  error: null,
};

// 5. Slice Creator
export const createCatalogSlice: StateCreator<
  DocsStore,
  [],
  [],
  CatalogSlice
> = (set, get) => ({
  ...initialState,

  fetchDocuments: async () => {
    console.log("[CatalogSlice] Fetching documents");
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch("/api/docs");
      if (!response.ok) throw new Error("Failed to fetch documents");
      
      const data = await response.json();
      set({ documents: data.documents, isLoading: false });
      
      console.log("[CatalogSlice] Documents fetched successfully");
    } catch (error) {
      console.error("[CatalogSlice] Error fetching documents:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch documents";
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  createDocument: async (title) => {
    console.log("[CatalogSlice] Creating document:", title);
    
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
      await get().fetchDocuments();

      console.log("[CatalogSlice] Document created successfully:", docId);
      return docId;
    } catch (error) {
      console.error("[CatalogSlice] Error creating document:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create document";
      set({ error: errorMessage });
      return null;
    }
  },

  deleteDocument: async (docId) => {
    console.log("[CatalogSlice] Deleting document:", docId);
    
    try {
      const response = await fetch(`/api/docs/${docId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete document");

      // Remove from local state immediately
      set((state) => ({
        documents: state.documents.filter((doc) => doc.id !== docId),
      }));

      console.log("[CatalogSlice] Document deleted successfully");
      return true;
    } catch (error) {
      console.error("[CatalogSlice] Error deleting document:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete document";
      set({ error: errorMessage });
      return false;
    }
  },
});
