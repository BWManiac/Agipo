/**
 * Agent Details Slice
 * 
 * Manages core agent identity and assigned capabilities.
 * This slice handles the agent config, tools, bindings, and workflows.
 */

import type { StateCreator } from "zustand";
import type { AgentConfig, WorkflowSummary, ConnectionToolBinding, WorkflowBinding, WorkflowMetadata } from "@/_tables/types";
import type { Task, ScheduledJob, EventTrigger, MockRecord } from "../../data/mocks";
import { MOCK_TASKS, MOCK_JOBS, MOCK_TRIGGERS, MOCK_RECORDS } from "../../data/mocks";
import type { AgentModalStore } from "../types";

// 1. State Interface
export interface AgentDetailsSliceState {
  /** Current agent config (cached from prop) */
  agent: AgentConfig | null;
  
  /** All available custom tools (for filtering) */
  allCustomTools: WorkflowSummary[];
  
  /** Computed: filtered by agent.toolIds */
  assignedCustomTools: WorkflowSummary[];
  
  /** Connection tool bindings from agent.connectionToolBindings */
  connectionBindings: ConnectionToolBinding[];
  
  /** Workflow bindings from agent.workflowBindings */
  workflowBindings: WorkflowBinding[];
  
  /** Metadata for assigned workflows */
  workflowMetadata: WorkflowMetadata[];
  
  /** Mock data - tasks */
  tasks: Task[];
  
  /** Mock data - jobs */
  jobs: ScheduledJob[];
  
  /** Mock data - triggers */
  triggers: EventTrigger[];
  
  /** Mock data - records */
  records: MockRecord[];
  
  /** Loading state */
  isLoadingDetails: boolean;
  
  /** Error state */
  error: string | null;
}

// 2. Actions Interface
export interface AgentDetailsSliceActions {
  /** Set current agent, auto-load details */
  setAgent: (agent: AgentConfig | null) => void;
  
  /** Fetch all agent data (tools, bindings, workflows) */
  loadAgentDetails: (agentId: string) => Promise<void>;
  
  /** Computed getter (filters allCustomTools by agent.toolIds) */
  getAssignedCustomTools: () => WorkflowSummary[];
  
  /** Clear state when agent is null */
  resetAgentDetails: () => void;
}

// 3. Combined Slice Type
export type AgentDetailsSlice = AgentDetailsSliceState & AgentDetailsSliceActions;

// 4. Initial State
const initialState: AgentDetailsSliceState = {
  agent: null,
  allCustomTools: [],
  assignedCustomTools: [],
  connectionBindings: [],
  workflowBindings: [],
  workflowMetadata: [],
  tasks: MOCK_TASKS,
  jobs: MOCK_JOBS,
  triggers: MOCK_TRIGGERS,
  records: MOCK_RECORDS,
  isLoadingDetails: false,
  error: null,
};

// 5. Slice Creator
export const createAgentDetailsSlice: StateCreator<
  AgentModalStore,
  [],
  [],
  AgentDetailsSlice
> = (set, get) => ({
  ...initialState,

  setAgent: (agent) => {
    console.log("[AgentDetailsSlice] Setting agent:", agent?.id);
    set({ agent });
    
    if (agent) {
      // Auto-load details when agent is set
      get().loadAgentDetails(agent.id);
    } else {
      // Clear state when agent is null
      get().resetAgentDetails();
    }
  },

  loadAgentDetails: async (agentId) => {
    console.log("[AgentDetailsSlice] Loading agent details:", agentId);
    
    set({ isLoadingDetails: true, error: null });

    try {
      // Fetch all data in parallel
      const [toolsResponse, bindingsResponse, workflowsResponse] = await Promise.all([
        fetch("/api/tools/list"),
        fetch(`/api/workforce/${agentId}/tools/connection`),
        fetch(`/api/workforce/${agentId}/workflows`),
      ]);

      // Process custom tools
      let allCustomTools: WorkflowSummary[] = [];
      if (toolsResponse.ok) {
        allCustomTools = (await toolsResponse.json()) as WorkflowSummary[];
      } else {
        console.error("[AgentDetailsSlice] Failed to fetch tools");
      }

      // Process connection bindings
      let connectionBindings: ConnectionToolBinding[] = [];
      if (bindingsResponse.ok) {
        const bindingsData = await bindingsResponse.json();
        connectionBindings = bindingsData.bindings || [];
      }

      // Process workflow bindings
      let workflowBindings: WorkflowBinding[] = [];
      if (workflowsResponse.ok) {
        const workflowsData = await workflowsResponse.json();
        workflowBindings = workflowsData.bindings || [];
      }

      // Compute assigned custom tools
      const agent = get().agent;
      const assignedCustomTools = agent
        ? allCustomTools.filter((tool) => {
            // Normalize tool ID (remove "workflow-" prefix if present)
            const normalizedToolId = tool.id.startsWith("workflow-")
              ? tool.id.slice("workflow-".length)
              : tool.id;
            return agent.toolIds.includes(normalizedToolId);
          })
        : [];

      set({
        allCustomTools,
        assignedCustomTools,
        connectionBindings,
        workflowBindings,
        isLoadingDetails: false,
        error: null,
      });

      console.log("[AgentDetailsSlice] Agent details loaded successfully");
    } catch (error) {
      console.error("[AgentDetailsSlice] Error loading agent details:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      set({
        isLoadingDetails: false,
        error: errorMessage,
      });
    }
  },

  getAssignedCustomTools: () => {
    const state = get();
    return state.assignedCustomTools;
  },

  resetAgentDetails: () => {
    console.log("[AgentDetailsSlice] Resetting agent details");
    set({
      allCustomTools: [],
      assignedCustomTools: [],
      connectionBindings: [],
      workflowBindings: [],
      workflowMetadata: [],
      isLoadingDetails: false,
      error: null,
    });
  },
});

