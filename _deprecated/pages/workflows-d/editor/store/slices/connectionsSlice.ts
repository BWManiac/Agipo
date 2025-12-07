import type { StateCreator } from "zustand";
import type { ConnectionsSlice, WorkflowsDStore } from "../types";

export const createConnectionsSlice: StateCreator<
  WorkflowsDStore,
  [],
  [],
  ConnectionsSlice
> = (set, get) => ({
  // Initial state
  connections: {},

  // Actions
  setConnections: (connections) => set({ connections, isDirty: true }),

  setConnection: (toolkitSlug, connectionId) => {
    set((state) => ({
      connections: {
        ...state.connections,
        [toolkitSlug]: connectionId,
      },
      isDirty: true,
    }));
  },

  getRequiredToolkits: () => {
    const { steps } = get();
    const toolkits = new Set<string>();

    for (const step of steps) {
      if (step.type === "composio" && step.toolkitSlug) {
        toolkits.add(step.toolkitSlug);
      }
    }

    return Array.from(toolkits);
  },
});




