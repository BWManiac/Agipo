/**
 * Agent Modal store composition.
 *
 * Each slice stays in its own module. This file stitches them together so
 * `useAgentModalStore` exposes a single hook to the rest of the app.
 *
 * We keep this layer intentionally slim: no business logic, just the wiring.
 */

import { create } from "zustand";

import { createAgentDetailsSlice } from "./slices/agentDetailsSlice";
import { createCapabilitiesSlice } from "./slices/capabilitiesSlice";
import { createUiSlice } from "./slices/uiSlice";
import type { AgentModalStore } from "./types";

// Re-export types for convenience
export type { Connection, ConnectionWithTools, PlatformToolkit } from "./types";

export const useAgentModalStore = create<AgentModalStore>()(
  (...args) => ({
    ...createAgentDetailsSlice(...args),
    ...createCapabilitiesSlice(...args),
    ...createUiSlice(...args),
  })
);

