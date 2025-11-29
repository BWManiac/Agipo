/**
 * Centralised type exports for the Workflow Generator store. This file should
 * only contain types that are shared across multiple slices. Slice-specific
 * types should be co-located with their slice definitions.
 */
import type { Node } from "@xyflow/react";

import type {
  BusinessFieldType,
  BusinessListItemType,
} from "../types/domain";
import type { CanvasSlice } from "./slices/canvasSlice";
import type { NodeSpecSlice } from "./slices/nodeSpecSlice";
import type { EditorSlice, WorkflowLayer } from "./slices/editorSlice";
import type { ExecutionSlice } from "./slices/executionSlice";
import type { IoMappingSlice } from "./slices/ioMappingSlice";
import type { WebcontainerSlice } from "./slices/webcontainerSlice";
import type { PersistenceSlice } from "./slices/persistenceSlice";
import type { SettingsSlice, ApiKeyMap } from "./slices/settingsSlice";

export type { WorkflowLayer, WebcontainerSlice };
export type { ApiKeyMap };

export type ContractField = {
  name: string;
  type: BusinessFieldType;
  itemType?: BusinessListItemType;
  description?: string;
  optional?: boolean;
};

export type WorkflowNodeData = {
  id: string;
  title: string;
  code: string;
  isRunning: boolean;
  flow: {
    summary: string;
  };
  spec: {
    inputs: ContractField[];
    process: string[];
    outputs: ContractField[];
  };
};

export type WorkflowNode = Node<WorkflowNodeData>;

// This is the final, combined store type that includes all slices.
// It's the single source of truth for the entire application's state.
export type WorkflowGeneratorStore = CanvasSlice &
  NodeSpecSlice &
  EditorSlice &
  ExecutionSlice &
  IoMappingSlice &
  WebcontainerSlice &
  PersistenceSlice &
  SettingsSlice;

