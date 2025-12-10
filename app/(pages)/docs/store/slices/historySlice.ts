/**
 * History Slice
 * 
 * Manages document version history state.
 * Handles fetching versions, previewing, and restoring previous versions.
 */

import type { StateCreator } from "zustand";
import type { Document, DocumentVersion } from "@/app/api/docs/services/types";
import type { DocsStore } from "../types";

// 1. State Interface
export interface HistorySliceState {
  /** List of document versions */
  versions: DocumentVersion[];
  
  /** Loading state for version operations */
  isLoading: boolean;
  
  /** Currently selected version ID */
  selectedVersionId: string | null;
  
  /** Document preview for selected version */
  previewDocument: Document | null;
}

// 2. Actions Interface
export interface HistorySliceActions {
  /** Fetch all versions for a document */
  fetchVersions: (docId: string) => Promise<void>;
  
  /** Select a version by ID */
  selectVersion: (versionId: string | null) => void;
  
  /** Preview a specific version */
  previewVersion: (docId: string, versionId: string) => Promise<void>;
  
  /** Restore a version (replaces current document) */
  restoreVersion: (docId: string, versionId: string) => Promise<boolean>;
  
  /** Clear the preview state */
  clearPreview: () => void;
}

// 3. Combined Slice Type
export type HistorySlice = HistorySliceState & HistorySliceActions;

// 4. Initial State
const initialState: HistorySliceState = {
  versions: [],
  isLoading: false,
  selectedVersionId: null,
  previewDocument: null,
};

// 5. Slice Creator
export const createHistorySlice: StateCreator<
  DocsStore,
  [],
  [],
  HistorySlice
> = (set, get) => ({
  ...initialState,

  fetchVersions: async (docId) => {
    console.log("[HistorySlice] Fetching versions:", docId);
    
    set({ isLoading: true });

    try {
      const response = await fetch(`/api/docs/${docId}/versions`);
      if (!response.ok) throw new Error("Failed to fetch versions");

      const data = await response.json();
      set({ versions: data.versions, isLoading: false });
      
      console.log("[HistorySlice] Versions fetched successfully");
    } catch (error) {
      console.error("[HistorySlice] Error fetching versions:", error);
      set({ isLoading: false });
    }
  },

  selectVersion: (versionId) => {
    console.log("[HistorySlice] Selecting version:", versionId);
    set({ selectedVersionId: versionId });
  },

  previewVersion: async (docId, versionId) => {
    console.log("[HistorySlice] Previewing version:", docId, versionId);
    
    try {
      const response = await fetch(`/api/docs/${docId}/versions/${versionId}`);
      if (!response.ok) throw new Error("Failed to fetch version");

      const data = await response.json();
      set({
        selectedVersionId: versionId,
        previewDocument: data.document as Document,
      });
      
      console.log("[HistorySlice] Version preview loaded");
    } catch (error) {
      console.error("[HistorySlice] Error previewing version:", error);
    }
  },

  restoreVersion: async (docId, versionId) => {
    console.log("[HistorySlice] Restoring version:", docId, versionId);
    
    try {
      const response = await fetch(`/api/docs/${docId}/versions/${versionId}`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to restore version");

      const data = await response.json();

      // Update the current document
      get().setDocument(data.document);
      get().setContent(data.document.content);

      // Refresh version history
      await get().fetchVersions(docId);

      // Clear preview
      set({ previewDocument: null, selectedVersionId: null });

      console.log("[HistorySlice] Version restored successfully");
      return true;
    } catch (error) {
      console.error("[HistorySlice] Error restoring version:", error);
      return false;
    }
  },

  clearPreview: () => {
    console.log("[HistorySlice] Clearing preview");
    set({ previewDocument: null, selectedVersionId: null });
  },
});
