/**
 * Agents Slice
 * Manages available agents and agent selection for chat.
 */

import type { StateCreator } from "zustand";
import type { RecordsStore } from "../types";

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: "active" | "idle" | "busy";
}

// 1. State Interface
export interface AgentsSliceState {
  agents: Agent[];
  selectedAgentId: string | null;
  isLoadingAgents: boolean;
  agentsError: string | null;
}

// 2. Actions Interface
export interface AgentsSliceActions {
  fetchAgents: () => Promise<void>;
  selectAgent: (agentId: string) => void;
  clearSelectedAgent: () => void;
  getSelectedAgent: () => Agent | null;
}

// 3. Combined Slice Type
export type AgentsSlice = AgentsSliceState & AgentsSliceActions;

// 4. Initial State
const initialState: AgentsSliceState = {
  agents: [],
  selectedAgentId: null,
  isLoadingAgents: false,
  agentsError: null,
};

// 5. Slice Creator
export const createAgentsSlice: StateCreator<
  RecordsStore,
  [],
  [],
  AgentsSlice
> = (set, get) => ({
  ...initialState,

  fetchAgents: async () => {
    set({ isLoadingAgents: true, agentsError: null });
    try {
      const res = await fetch("/api/workforce");
      if (!res.ok) throw new Error("Failed to fetch agents");
      const data = await res.json();

      // Map workforce agents to our Agent type
      const agents: Agent[] = (data.agents || []).map((a: Record<string, unknown>) => ({
        id: a.id as string,
        name: a.name as string,
        role: a.role as string || "Assistant",
        avatar: a.avatar as string || "🤖",
        status: "active" as const,
      }));

      set({ agents, isLoadingAgents: false });
    } catch (error) {
      set({
        agentsError: error instanceof Error ? error.message : "Unknown error",
        isLoadingAgents: false
      });
    }
  },

  selectAgent: (agentId) => {
    set({ selectedAgentId: agentId });
    // Persist to localStorage for this table
    if (typeof window !== "undefined") {
      const tableId = window.location.pathname.split("/").pop();
      if (tableId) {
        localStorage.setItem(`records-agent-${tableId}`, agentId);
      }
    }
  },

  clearSelectedAgent: () => set({ selectedAgentId: null }),

  getSelectedAgent: () => {
    const state = get();
    return state.agents.find((a) => a.id === state.selectedAgentId) || null;
  },
});
