/**
 * Settings Slice
 * 
 * Manages document settings, access permissions, and activity log.
 */

import type { StateCreator } from "zustand";
import type { DocsStore } from "../types";

export interface AgentAccess {
  agentId: string;
  agentName: string;
  agentAvatar?: string;
  permission: "read" | "read-write";
  grantedAt: string;
  grantedBy: string;
}

export interface ActivityEntry {
  id: string;
  type: "edit" | "create" | "view" | "access_granted" | "access_revoked";
  actor: {
    type: "user" | "agent";
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  summary: string;
  details?: {
    wordsDelta?: number;
    section?: string;
    versionId?: string;
  };
}

// 1. State Interface
export interface SettingsSliceState {
  agentAccess: AgentAccess[];
  activityLog: ActivityEntry[];
  ragIndexed: boolean;
  ragLastIndexed: string | null;
  isLoading: boolean;
}

// 2. Actions Interface
export interface SettingsSliceActions {
  setAgentAccess: (access: AgentAccess[]) => void;
  setActivityLog: (activities: ActivityEntry[]) => void;
  setRagIndexed: (indexed: boolean, lastIndexed?: string) => void;
  loadAccess: (docId: string) => Promise<void>;
  loadActivity: (docId: string) => Promise<void>;
  grantAccess: (docId: string, agentId: string, permission: "read" | "read-write") => Promise<void>;
  revokeAccess: (docId: string, agentId: string) => Promise<void>;
}

// 3. Combined Slice Type
export type SettingsSlice = SettingsSliceState & SettingsSliceActions;

// 4. Initial State
const initialState: SettingsSliceState = {
  agentAccess: [],
  activityLog: [],
  ragIndexed: false,
  ragLastIndexed: null,
  isLoading: false,
};

// 5. Slice Creator
export const createSettingsSlice: StateCreator<
  DocsStore,
  [],
  [],
  SettingsSlice
> = (set, get) => ({
  ...initialState,

  setAgentAccess: (access) => set({ agentAccess: access }),

  setActivityLog: (activities) => set({ activityLog: activities }),

  setRagIndexed: (indexed, lastIndexed) =>
    set({ ragIndexed: indexed, ragLastIndexed: lastIndexed || null }),

  loadAccess: async (docId: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/dox/${docId}/access`);
      if (!res.ok) throw new Error("Failed to load access");
      const data = await res.json();
      set({ agentAccess: data.agents || [], isLoading: false });
    } catch (error) {
      console.error("[Settings] Load access error:", error);
      set({ isLoading: false });
    }
  },

  loadActivity: async (docId: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/dox/${docId}/activity`);
      if (!res.ok) throw new Error("Failed to load activity");
      const data = await res.json();
      set({ activityLog: data.activities || [], isLoading: false });
    } catch (error) {
      console.error("[Settings] Load activity error:", error);
      set({ isLoading: false });
    }
  },

  grantAccess: async (
    docId: string,
    agentId: string,
    permission: "read" | "read-write"
  ) => {
    try {
      const res = await fetch(`/api/dox/${docId}/access/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, permission }),
      });
      if (!res.ok) throw new Error("Failed to grant access");
      await get().loadAccess(docId);
    } catch (error) {
      console.error("[Settings] Grant access error:", error);
      throw error;
    }
  },

  revokeAccess: async (docId: string, agentId: string) => {
    try {
      const res = await fetch(`/api/dox/${docId}/access/agents/${agentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to revoke access");
      await get().loadAccess(docId);
    } catch (error) {
      console.error("[Settings] Revoke access error:", error);
      throw error;
    }
  },
});
