/**
 * Version Slice
 * 
 * Manages version history state and operations.
 */

import type { StateCreator } from "zustand";
import type { DocsStore } from "../types";

export interface DocumentVersion {
  id: string;
  docId: string;
  content: string;
  properties: Record<string, unknown>;
  wordCount: number;
  wordsDelta: number;
  summary: string;
  createdAt: string;
  createdBy: {
    type: "user" | "agent";
    id: string;
    name: string;
    avatar?: string;
  };
}

// 1. State Interface
export interface VersionSliceState {
  versions: DocumentVersion[];
  selectedVersionId: string | null;
  compareMode: boolean;
  compareFromVersionId: string | null;
  compareData: {
    from: DocumentVersion;
    to: DocumentVersion;
    diff: {
      unified: string;
      stats: { additions: number; deletions: number };
    };
  } | null;
  isLoading: boolean;
}

// 2. Actions Interface
export interface VersionSliceActions {
  setVersions: (versions: DocumentVersion[]) => void;
  selectVersion: (versionId: string | null) => void;
  setCompareMode: (enabled: boolean) => void;
  setCompareFrom: (versionId: string | null) => void;
  loadVersions: (docId: string) => Promise<void>;
  restoreVersion: (docId: string, versionId: string) => Promise<void>;
  compareVersions: (docId: string, fromVersionId: string, toVersionId: string) => Promise<void>;
}

// 3. Combined Slice Type
export type VersionSlice = VersionSliceState & VersionSliceActions;

// 4. Initial State
const initialState: VersionSliceState = {
  versions: [],
  selectedVersionId: null,
  compareMode: false,
  compareFromVersionId: null,
  compareData: null,
  isLoading: false,
};

// 5. Slice Creator
export const createVersionSlice: StateCreator<
  DocsStore,
  [],
  [],
  VersionSlice
> = (set, get) => ({
  ...initialState,

  setVersions: (versions) => set({ versions }),

  selectVersion: (versionId) => set({ selectedVersionId: versionId }),

  setCompareMode: (enabled) => set({ compareMode: enabled }),

  setCompareFrom: (versionId) => set({ compareFromVersionId: versionId }),

  loadVersions: async (docId: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/dox/${docId}/versions`);
      if (!res.ok) throw new Error("Failed to load versions");
      const data = await res.json();
      set({ versions: data.versions || [], isLoading: false });
    } catch (error) {
      console.error("[Version] Load error:", error);
      set({ isLoading: false });
    }
  },

  restoreVersion: async (docId: string, versionId: string) => {
    try {
      const res = await fetch(`/api/dox/${docId}/versions/${versionId}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to restore version");
      const data = await res.json();
      
      // Reload document
      const state = get();
      state.setDocument({
        id: docId,
        title: state.title,
        content: data.content,
        properties: state.properties,
      });
      
      // Reload versions
      await state.loadVersions(docId);
    } catch (error) {
      console.error("[Version] Restore error:", error);
      throw error;
    }
  },

  compareVersions: async (docId: string, fromVersionId: string, toVersionId: string) => {
    try {
      const res = await fetch(
        `/api/dox/${docId}/versions/${toVersionId}/compare?from=${fromVersionId}`
      );
      if (!res.ok) throw new Error("Failed to compare versions");
      const data = await res.json();
      set({ compareData: data, compareMode: true });
    } catch (error) {
      console.error("[Version] Compare error:", error);
      throw error;
    }
  },
});
