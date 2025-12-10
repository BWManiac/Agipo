/**
 * Capabilities Slice
 * 
 * Manages available capabilities and assignment management.
 * Handles custom tools, connection tools, and workflows.
 */

import type { StateCreator } from "zustand";
import type { WorkflowSummary, ConnectionToolBinding, WorkflowBinding, WorkflowMetadata } from "@/_tables/types";
import type { ConnectionWithTools, PlatformToolkit, Connection, AgentModalStore } from "../types";

// 1. State Interface
export interface CapabilitiesSliceState {
  // Custom Tools
  availableCustomTools: WorkflowSummary[];
  assignedCustomToolIds: string[];
  isLoadingCustomTools: boolean;
  errorCustomTools: string | null;

  // Connection Tools
  availableConnections: ConnectionWithTools[];
  platformToolkits: PlatformToolkit[];
  assignedConnectionBindings: ConnectionToolBinding[];
  isLoadingConnectionTools: boolean;
  errorConnectionTools: string | null;

  // Workflows
  availableWorkflows: WorkflowMetadata[];
  userConnections: Connection[];
  assignedWorkflowBindings: WorkflowBinding[];
  isLoadingWorkflows: boolean;
  errorWorkflows: string | null;
}

// 2. Actions Interface
export interface CapabilitiesSliceActions {
  // Custom Tools
  fetchCustomTools: (agentId: string) => Promise<void>;
  saveCustomTools: (agentId: string, toolIds: string[]) => Promise<boolean>;

  // Connection Tools
  fetchConnectionTools: (agentId: string) => Promise<void>;
  saveConnectionTools: (agentId: string, bindings: ConnectionToolBinding[]) => Promise<boolean>;
  isConnectionToolAssigned: (connectionId: string, toolId: string) => boolean;

  // Workflows
  fetchWorkflows: (agentId: string) => Promise<void>;
  fetchUserConnections: () => Promise<void>;
  saveWorkflows: (agentId: string, bindings: WorkflowBinding[]) => Promise<boolean>;
  groupConnectionsByToolkit: () => Map<string, Connection[]>;

  // Bulk
  refreshAllCapabilities: (agentId: string) => Promise<void>;
}

// 3. Combined Slice Type
export type CapabilitiesSlice = CapabilitiesSliceState & CapabilitiesSliceActions;

// 4. Initial State
const initialState: CapabilitiesSliceState = {
  // Custom Tools
  availableCustomTools: [],
  assignedCustomToolIds: [],
  isLoadingCustomTools: false,
  errorCustomTools: null,

  // Connection Tools
  availableConnections: [],
  platformToolkits: [],
  assignedConnectionBindings: [],
  isLoadingConnectionTools: false,
  errorConnectionTools: null,

  // Workflows
  availableWorkflows: [],
  userConnections: [],
  assignedWorkflowBindings: [],
  isLoadingWorkflows: false,
  errorWorkflows: null,
};

// 5. Slice Creator
export const createCapabilitiesSlice: StateCreator<
  AgentModalStore,
  [],
  [],
  CapabilitiesSlice
> = (set, get) => ({
  ...initialState,

  fetchCustomTools: async (agentId) => {
    console.log("[CapabilitiesSlice] Fetching custom tools:", agentId);
    
    set({ isLoadingCustomTools: true, errorCustomTools: null });

    try {
      const [availableRes, assignedRes] = await Promise.all([
        fetch(`/api/workforce/${agentId}/tools/custom/available`),
        fetch(`/api/workforce/${agentId}/tools/custom`),
      ]);

      if (!availableRes.ok) {
        throw new Error("Failed to fetch available tools");
      }

      const availableData = await availableRes.json();
      const assignedData = assignedRes.ok ? await assignedRes.json() : { toolIds: [] };

      set({
        availableCustomTools: availableData.tools || [],
        assignedCustomToolIds: assignedData.toolIds || [],
        isLoadingCustomTools: false,
        errorCustomTools: null,
      });

      console.log("[CapabilitiesSlice] Custom tools fetched successfully");
    } catch (error) {
      console.error("[CapabilitiesSlice] Error fetching custom tools:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load tools";
      set({
        isLoadingCustomTools: false,
        errorCustomTools: errorMessage,
      });
    }
  },

  saveCustomTools: async (agentId, toolIds) => {
    console.log("[CapabilitiesSlice] Saving custom tools:", agentId, toolIds);
    
    set({ 
      isLoadingCustomTools: true, 
      errorCustomTools: null,
      isSavingCustomTools: true, // Update uiSlice state
    });

    try {
      const response = await fetch(`/api/workforce/${agentId}/tools/custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to save tools");
      }

      // Update state
      set({
        assignedCustomToolIds: toolIds,
        isLoadingCustomTools: false,
        errorCustomTools: null,
        isSavingCustomTools: false, // Update uiSlice state
      });

      // Refresh all capabilities to sync data
      await get().refreshAllCapabilities(agentId);

      console.log("[CapabilitiesSlice] Custom tools saved successfully");
      return true;
    } catch (error) {
      console.error("[CapabilitiesSlice] Error saving custom tools:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save tools";
      set({
        isLoadingCustomTools: false,
        errorCustomTools: errorMessage,
        isSavingCustomTools: false, // Update uiSlice state
      });
      return false;
    }
  },

  fetchConnectionTools: async (agentId) => {
    console.log("[CapabilitiesSlice] Fetching connection tools:", agentId);
    
    set({ isLoadingConnectionTools: true, errorConnectionTools: null });

    try {
      const [availableRes, assignedRes] = await Promise.all([
        fetch(`/api/workforce/${agentId}/tools/connection/available`),
        fetch(`/api/workforce/${agentId}/tools/connection`),
      ]);

      if (!availableRes.ok) {
        // 401 is expected if user is not authenticated - not an error
        if (availableRes.status === 401) {
          set({
            availableConnections: [],
            assignedConnectionBindings: [],
            isLoadingConnectionTools: false,
            errorConnectionTools: null,
          });
          return;
        }
        throw new Error("Failed to fetch available connection tools");
      }

      const availableData = await availableRes.json();
      const assignedData = assignedRes.ok ? await assignedRes.json() : { bindings: [] };

      set({
        availableConnections: availableData.connections || [],
        platformToolkits: availableData.platformToolkits || [],
        assignedConnectionBindings: assignedData.bindings || [],
        isLoadingConnectionTools: false,
        errorConnectionTools: null,
      });

      console.log("[CapabilitiesSlice] Connection tools fetched successfully");
    } catch (error) {
      console.error("[CapabilitiesSlice] Error fetching connection tools:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load connection tools";
      set({
        isLoadingConnectionTools: false,
        errorConnectionTools: errorMessage,
      });
    }
  },

  saveConnectionTools: async (agentId, bindings) => {
    console.log("[CapabilitiesSlice] Saving connection tools:", agentId, bindings);
    
    set({ 
      isLoadingConnectionTools: true, 
      errorConnectionTools: null,
      isSavingConnectionTools: true, // Update uiSlice state
    });

    try {
      const response = await fetch(`/api/workforce/${agentId}/tools/connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bindings }),
      });

      if (!response.ok) {
        throw new Error("Failed to save connection tools");
      }

      // Update state
      set({
        assignedConnectionBindings: bindings,
        isLoadingConnectionTools: false,
        errorConnectionTools: null,
        isSavingConnectionTools: false, // Update uiSlice state
      });

      // Refresh all capabilities to sync data
      await get().refreshAllCapabilities(agentId);

      console.log("[CapabilitiesSlice] Connection tools saved successfully");
      return true;
    } catch (error) {
      console.error("[CapabilitiesSlice] Error saving connection tools:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save connection tools";
      set({
        isLoadingConnectionTools: false,
        errorConnectionTools: errorMessage,
        isSavingConnectionTools: false, // Update uiSlice state
      });
      return false;
    }
  },

  isConnectionToolAssigned: (connectionId, toolId) => {
    const state = get();
    return state.assignedConnectionBindings.some(
      (b) => b.connectionId === connectionId && b.toolId === toolId
    );
  },

  fetchWorkflows: async (agentId) => {
    console.log("[CapabilitiesSlice] Fetching workflows:", agentId);
    
    set({ isLoadingWorkflows: true, errorWorkflows: null });

    try {
      const [workflowsRes, bindingsRes] = await Promise.all([
        fetch(`/api/workforce/${agentId}/workflows/available`),
        fetch(`/api/workforce/${agentId}/workflows`),
      ]);

      if (!workflowsRes.ok && workflowsRes.status !== 401) {
        throw new Error("Failed to fetch available workflows");
      }

      const workflowsData = workflowsRes.ok ? await workflowsRes.json() : { workflows: [] };
      const bindingsData = bindingsRes.ok ? await bindingsRes.json() : { bindings: [] };

      set({
        availableWorkflows: workflowsData.workflows || [],
        assignedWorkflowBindings: bindingsData.bindings || [],
        isLoadingWorkflows: false,
        errorWorkflows: null,
      });

      console.log("[CapabilitiesSlice] Workflows fetched successfully");
    } catch (error) {
      console.error("[CapabilitiesSlice] Error fetching workflows:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load workflow data";
      set({
        isLoadingWorkflows: false,
        errorWorkflows: errorMessage,
      });
    }
  },

  fetchUserConnections: async () => {
    console.log("[CapabilitiesSlice] Fetching user connections");
    
    try {
      const response = await fetch(`/api/connections`);

      if (!response.ok) {
        throw new Error("Failed to fetch user connections");
      }

      const connectionsData = await response.json();
      
      // Format connections for our use
      const formattedConnections: Connection[] = Array.isArray(connectionsData)
        ? connectionsData.map((conn: any) => ({
            id: conn.id,
            toolkitSlug: conn.toolkitSlug || conn.toolkit?.slug || "",
            accountLabel: conn.accountLabel || conn.metadata?.email || conn.metadata?.username,
            status: conn.status,
          }))
        : [];

      set({ userConnections: formattedConnections });
      console.log("[CapabilitiesSlice] User connections fetched successfully");
    } catch (error) {
      console.error("[CapabilitiesSlice] Error fetching user connections:", error);
      // Don't set error state - this is optional data
    }
  },

  saveWorkflows: async (agentId, bindings) => {
    console.log("[CapabilitiesSlice] Saving workflows:", agentId, bindings);
    
    set({ 
      isLoadingWorkflows: true, 
      errorWorkflows: null,
      isSavingWorkflows: true, // Update uiSlice state
    });

    try {
      const response = await fetch(`/api/workforce/${agentId}/workflows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bindings }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details
          ? errorData.details.join("\n")
          : errorData.error || "Failed to save workflows";
        throw new Error(errorMessage);
      }

      // Update state
      set({
        assignedWorkflowBindings: bindings,
        isLoadingWorkflows: false,
        errorWorkflows: null,
        isSavingWorkflows: false, // Update uiSlice state
      });

      // Refresh all capabilities to sync data
      await get().refreshAllCapabilities(agentId);

      console.log("[CapabilitiesSlice] Workflows saved successfully");
      return true;
    } catch (error) {
      console.error("[CapabilitiesSlice] Error saving workflows:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save workflows";
      set({
        isLoadingWorkflows: false,
        errorWorkflows: errorMessage,
        isSavingWorkflows: false, // Update uiSlice state
      });
      return false;
    }
  },

  groupConnectionsByToolkit: () => {
    const state = get();
    const groups = new Map<string, Connection[]>();
    
    for (const conn of state.userConnections) {
      const key = conn.toolkitSlug;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(conn);
    }
    
    return groups;
  },

  refreshAllCapabilities: async (agentId) => {
    console.log("[CapabilitiesSlice] Refreshing all capabilities:", agentId);
    
    // Fetch all capability data in parallel
    await Promise.all([
      get().fetchCustomTools(agentId),
      get().fetchConnectionTools(agentId),
      get().fetchWorkflows(agentId),
    ]);

    console.log("[CapabilitiesSlice] All capabilities refreshed");
  },
});

