/**
 * Workflows D Editor store composition.
 * 
 * Each slice stays in its own module. This file stitches them together so
 * `useWorkflowsDStore` exposes a single hook to the rest of the app.
 */
import { create } from "zustand";

import { createWorkflowSlice } from "./slices/workflowSlice";
import { createStepsSlice } from "./slices/stepsSlice";
import { createMappingsSlice } from "./slices/mappingsSlice";
import { createUISlice } from "./slices/uiSlice";
import { createInputsSlice } from "./slices/inputsSlice";
import { createConnectionsSlice } from "./slices/connectionsSlice";
import { createTablesSlice } from "./slices/tablesSlice";
import { createTestingSlice } from "./slices/testingSlice";
import { createChatSlice } from "./slices/chatSlice";
import type { WorkflowsDStore } from "./types";

export const useWorkflowsDStore = create<WorkflowsDStore>()(
  (...args) => ({
    ...createWorkflowSlice(...args),
    ...createStepsSlice(...args),
    ...createMappingsSlice(...args),
    ...createUISlice(...args),
    ...createInputsSlice(...args),
    ...createConnectionsSlice(...args),
    ...createTablesSlice(...args),
    ...createTestingSlice(...args),
    ...createChatSlice(...args),
  })
);

// Re-export types for convenience
export type { WorkflowsDStore } from "./types";




