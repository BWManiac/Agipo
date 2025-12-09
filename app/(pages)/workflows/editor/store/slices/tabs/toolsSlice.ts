import type { StateCreator } from "zustand";

// Types
export interface Tool {
  id: string;
  name: string;
  description: string;
}

export interface Integration {
  slug: string;
  name: string;
  logo?: string;
  authMode: string;
  tools: Tool[];
}

export interface ToolsSlice {
  // State
  integrations: Integration[];
  isLoadingTools: boolean;
  toolsError: string | null;
  toolsSearchQuery: string;

  // Actions
  fetchTools: () => Promise<void>;
  setToolsSearchQuery: (query: string) => void;
  getFilteredIntegrations: () => Integration[];
}

// Use any for the store type to avoid circular dependency with WorkflowStore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createToolsSlice: StateCreator<any, [], [], ToolsSlice> = (
  set,
  get
) => ({
  // Initial state
  integrations: [],
  isLoadingTools: false,
  toolsError: null,
  toolsSearchQuery: "",

  // Actions
  fetchTools: async () => {
    set({ isLoadingTools: true, toolsError: null });

    try {
      const response = await fetch("/api/connections/available/integrations");
      if (!response.ok) {
        throw new Error(`Failed to fetch tools: ${response.statusText}`);
      }
      const data = await response.json();
      set({ integrations: data.integrations || [], isLoadingTools: false });
    } catch (error) {
      set({
        toolsError: error instanceof Error ? error.message : "Failed to fetch tools",
        isLoadingTools: false,
      });
    }
  },

  setToolsSearchQuery: (query: string) => {
    set({ toolsSearchQuery: query });
  },

  getFilteredIntegrations: (): Integration[] => {
    const state = get() as ToolsSlice;
    const { integrations, toolsSearchQuery } = state;
    const query = toolsSearchQuery.toLowerCase().trim();

    if (!query) return integrations;

    return integrations
      .map((integration: Integration) => {
        const matchingTools = integration.tools.filter(
          (tool: Tool) =>
            tool.name.toLowerCase().includes(query) ||
            tool.description.toLowerCase().includes(query)
        );

        if (matchingTools.length > 0) {
          return { ...integration, tools: matchingTools };
        }

        // Also match integration name
        if (integration.name.toLowerCase().includes(query)) {
          return integration;
        }

        return null;
      })
      .filter((i): i is Integration => i !== null);
  },
});

