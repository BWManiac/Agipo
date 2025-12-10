/**
 * Access Slice
 * Manages agent access permissions and activity logging.
 */

import type { StateCreator } from "zustand";
import type { RecordsStore } from "../types";

export interface AgentAccess {
  id: string;
  name: string;
  avatar: string;
  role: string;
  permission: "read" | "read_write";
}

export interface ActivityEntry {
  id: string;
  type: "insert" | "update" | "delete";
  actor: {
    type: "user" | "agent" | "workflow";
    id: string;
    name: string;
    avatar?: string;
  };
  rowCount: number;
  columns?: string[];
  timestamp: string;
}

// 1. State Interface
export interface AccessSliceState {
  accessList: AgentAccess[];
  activityLog: ActivityEntry[];
  isLoadingAccess: boolean;
  isLoadingActivity: boolean;
  accessError: string | null;
}

// 2. Actions Interface
export interface AccessSliceActions {
  fetchAccess: (tableId: string) => Promise<void>;
  grantAccess: (tableId: string, agentId: string, permission: "read" | "read_write") => Promise<void>;
  revokeAccess: (tableId: string, agentId: string) => Promise<void>;
  updatePermission: (tableId: string, agentId: string, permission: "read" | "read_write") => Promise<void>;
  fetchActivity: (tableId: string) => Promise<void>;
}

// 3. Combined Slice Type
export type AccessSlice = AccessSliceState & AccessSliceActions;

// 4. Initial State
const initialState: AccessSliceState = {
  accessList: [],
  activityLog: [],
  isLoadingAccess: false,
  isLoadingActivity: false,
  accessError: null,
};

// 5. Slice Creator
export const createAccessSlice: StateCreator<
  RecordsStore,
  [],
  [],
  AccessSlice
> = (set, get) => ({
  ...initialState,

  fetchAccess: async (tableId) => {
    set({ isLoadingAccess: true, accessError: null });
    try {
      const res = await fetch(`/api/records/${tableId}/access`);
      if (!res.ok) throw new Error("Failed to fetch access");
      const data = await res.json();
      set({ accessList: data.agents || [], isLoadingAccess: false });
    } catch (error) {
      set({
        accessError: error instanceof Error ? error.message : "Unknown error",
        isLoadingAccess: false,
      });
    }
  },

  grantAccess: async (tableId, agentId, permission) => {
    try {
      const res = await fetch(`/api/records/${tableId}/access/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, permission }),
      });
      if (!res.ok) throw new Error("Failed to grant access");

      // Refetch to get updated list with agent details
      await get().fetchAccess(tableId);
    } catch (error) {
      set({ accessError: error instanceof Error ? error.message : "Unknown error" });
    }
  },

  revokeAccess: async (tableId, agentId) => {
    // Optimistically remove
    set((s) => ({
      accessList: s.accessList.filter((a) => a.id !== agentId),
    }));

    try {
      await fetch(`/api/records/${tableId}/access/agents/${agentId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("[AccessSlice] Revoke failed:", error);
      // Refetch to restore correct state
      await get().fetchAccess(tableId);
    }
  },

  updatePermission: async (tableId, agentId, permission) => {
    // Optimistically update
    set((s) => ({
      accessList: s.accessList.map((a) =>
        a.id === agentId ? { ...a, permission } : a
      ),
    }));

    try {
      await fetch(`/api/records/${tableId}/access/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission }),
      });
    } catch (error) {
      console.error("[AccessSlice] Update permission failed:", error);
      await get().fetchAccess(tableId);
    }
  },

  fetchActivity: async (tableId) => {
    set({ isLoadingActivity: true });
    try {
      const res = await fetch(`/api/records/${tableId}/activity`);
      if (!res.ok) throw new Error("Failed to fetch activity");
      const data = await res.json();
      set({ activityLog: data.entries || [], isLoadingActivity: false });
    } catch (error) {
      console.error("[AccessSlice] Fetch activity failed:", error);
      set({ isLoadingActivity: false });
    }
  },
});
