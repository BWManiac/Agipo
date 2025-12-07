/**
 * Centralized type exports for the Workflows F editor store.
 * This file should only contain types that are shared across multiple slices.
 * Slice-specific types should be co-located with their slice definitions.
 */
import type { WorkflowDefinition } from "@/app/api/workflows/types";
import type { WorkflowSlice } from "./slices/workflowSlice";
import type { StepsSlice } from "./slices/stepsSlice";
import type { MappingsSlice } from "./slices/mappingsSlice";
import type { PersistenceSlice } from "./slices/persistenceSlice";
import type { ChatSlice } from "./slices/chatSlice";
import type { UiSlice } from "./slices/uiSlice";
import type { ToolsSlice } from "./slices/tabs/toolsSlice";
import type { BindingsSlice } from "./slices/bindingsSlice";
import type { WorkflowInputsSlice } from "./slices/workflowInputsSlice";
import type { DetailsSlice } from "./slices/tabs/detailsSlice";

// This is the final, combined store type that includes all slices.
// It's the single source of truth for the entire editor's state.
export type WorkflowStore = WorkflowSlice &
  StepsSlice &
  MappingsSlice &
  PersistenceSlice &
  ChatSlice &
  UiSlice &
  ToolsSlice &
  BindingsSlice &
  WorkflowInputsSlice &
  DetailsSlice;


