// History Slice - Version history state management

import type { StateCreator } from "zustand";
import type { HistorySlice, DocsStore } from "../types";
import type { Document } from "@/app/api/docs/services/types";

export const createHistorySlice: StateCreator<
  DocsStore,
  [],
  [],
  HistorySlice
> = (set, get) => ({
  // Initial state
  versions: [],
  isLoading: false,
  selectedVersionId: null,
  previewDocument: null,

  fetchVersions: async (docId: string) => {
    set({ isLoading: true });

    try {
      const response = await fetch(`/api/docs/${docId}/versions`);
      if (!response.ok) throw new Error("Failed to fetch versions");

      const data = await response.json();
      set({ versions: data.versions, isLoading: false });
    } catch (error) {
      console.error("Fetch versions error:", error);
      set({ isLoading: false });
    }
  },

  selectVersion: (versionId) => set({ selectedVersionId: versionId }),

  previewVersion: async (docId: string, versionId: string) => {
    try {
      const response = await fetch(`/api/docs/${docId}/versions/${versionId}`);
      if (!response.ok) throw new Error("Failed to fetch version");

      const data = await response.json();
      set({
        selectedVersionId: versionId,
        previewDocument: data.document as Document,
      });
    } catch (error) {
      console.error("Preview version error:", error);
    }
  },

  restoreVersion: async (docId: string, versionId: string) => {
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
      get().fetchVersions(docId);

      // Clear preview
      set({ previewDocument: null, selectedVersionId: null });

      return true;
    } catch (error) {
      console.error("Restore version error:", error);
      return false;
    }
  },

  clearPreview: () => set({ previewDocument: null, selectedVersionId: null }),
});
