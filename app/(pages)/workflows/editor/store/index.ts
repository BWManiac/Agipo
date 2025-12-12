/**
 * Workflows F editor store composition.
 *
 * Each slice stays in its own module. This file stitches them together so
 * `useWorkflowStore` exposes a single hook to the rest of the app.
 *
 * We keep this layer intentionally slim: no business logic, just the wiring.
 */
import { create } from "zustand";

import { createWorkflowSlice } from "./slices/workflowSlice";
import { createStepsSlice } from "./slices/stepsSlice";
import { createMappingsSlice } from "./slices/mappingsSlice";
import { createPersistenceSlice } from "./slices/persistenceSlice";
import { createChatSlice } from "./slices/chatSlice";
import { createUiSlice } from "./slices/uiSlice";
import { createToolsSlice } from "./slices/tabs/toolsSlice";
import { createBindingsSlice } from "./slices/bindingsSlice";
import { createWorkflowInputsSlice } from "./slices/workflowInputsSlice";
import { createDetailsSlice } from "./slices/tabs/detailsSlice";
import { createExecutionSlice } from "./slices/executionSlice";
import type { WorkflowStore } from "./types";

export const useWorkflowStore = create<WorkflowStore>()(
  (...args) => ({
    ...createWorkflowSlice(...args),
    ...createStepsSlice(...args),
    ...createMappingsSlice(...args),
    ...createPersistenceSlice(...args),
    ...createChatSlice(...args),
    ...createUiSlice(...args),
    ...createToolsSlice(...args),
    ...createBindingsSlice(...args),
    ...createWorkflowInputsSlice(...args),
    ...createDetailsSlice(...args),
    ...createExecutionSlice(...args),
  })
);




