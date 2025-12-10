/**
 * Centralized type exports for the Agent Modal store.
 * 
 * This file should only contain types that are shared across multiple slices.
 * Slice-specific types should be co-located with their slice definitions.
 */

import type { AgentConfig, WorkflowSummary, ConnectionToolBinding, WorkflowBinding, WorkflowMetadata } from "@/_tables/types";
import type { TabId } from "../AgentModal";
import type { Task, ScheduledJob, EventTrigger, MockRecord } from "../data/mocks";

/**
 * Represents a connection with its available tools
 */
export type ConnectionWithTools = {
  connectionId: string;
  toolkitSlug: string;
  toolkitName: string;
  toolkitLogo?: string;
  accountLabel: string;
  status: string;
  tools: Array<{
    id: string;
    name: string;
    description: string;
  }>;
};

/**
 * Represents a NO_AUTH platform toolkit with its tools
 */
export type PlatformToolkit = {
  slug: string;
  name: string;
  logo?: string;
  mode: string;
  tools: Array<{
    id: string;
    name: string;
    description: string;
  }>;
};

export type Connection = {
  id: string;
  toolkitSlug: string;
  accountLabel?: string;
  status: string;
};

// Import slice types
import type { AgentDetailsSlice } from "./slices/agentDetailsSlice";
import type { CapabilitiesSlice } from "./slices/capabilitiesSlice";
import type { UiSlice } from "./slices/uiSlice";

// Re-export shared types for convenience
export type { TabId };
// ConnectionWithTools, PlatformToolkit, Connection are already exported above
export type { Task, ScheduledJob, EventTrigger, MockRecord };

// This is the final, combined store type that includes all slices.
// It's the single source of truth for the entire Agent Modal's state.
export type AgentModalStore = AgentDetailsSlice &
  CapabilitiesSlice &
  UiSlice;

