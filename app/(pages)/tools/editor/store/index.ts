/**
 * Workflow Generator store composition.
 *
 * Each slice stays in its own module. This file stitches them together so
 * `useWorkflowGeneratorStore` exposes a single hook to the rest of the app.
 *
 * We keep this layer intentionally slim: no business logic, just the wiring.
 */
import { create } from "zustand";

import { createCanvasSlice } from "./slices/canvasSlice";
import { createNodeSpecSlice } from "./slices/nodeSpecSlice";
import { createEditorSlice } from "./slices/editorSlice";
import { createExecutionSlice } from "./slices/executionSlice";
import { createIoMappingSlice } from "./slices/ioMappingSlice";
import { createWebcontainerSlice } from "./slices/webcontainerSlice";
import { createPersistenceSlice } from "./slices/persistenceSlice";
import { createSettingsSlice } from "./slices/settingsSlice";
import type { WorkflowGeneratorStore } from "./types";

export const useWorkflowGeneratorStore = create<WorkflowGeneratorStore>()(
  (...args) => ({
    ...createCanvasSlice(...args),
    ...createNodeSpecSlice(...args),
    ...createEditorSlice(...args),
    ...createExecutionSlice(...args),
    ...createIoMappingSlice(...args),
    ...createWebcontainerSlice(...args),
    ...createPersistenceSlice(...args),
    ...createSettingsSlice(...args),
  })
);

