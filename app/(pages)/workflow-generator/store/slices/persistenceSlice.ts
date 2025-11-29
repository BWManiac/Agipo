import { type StateCreator } from "zustand";

import type { WorkflowData } from "@/app/(pages)/workflows/repository/FileSystemWorkflowRepository";
import type { WorkflowGeneratorStore, WorkflowNode, ApiKeyMap } from "../types";
import type { Edge } from "@xyflow/react";

// 1. State Interface
export interface PersistenceSliceState {
  /** The unique identifier of the workflow currently being edited. Null if it's a new workflow. */
  currentWorkflowId: string | null;
  /** The name of the workflow, as entered by the user. */
  workflowName: string;
  /** A flag to indicate if a save operation is currently in progress. */
  isSaving: boolean;
}

// 2. Actions Interface
export interface PersistenceSliceActions {
  /** Sets the name of the workflow. */
  setWorkflowName: (name: string) => void;
  /** Saves the current state of the workflow (nodes, edges, name) to the backend. */
  saveCurrentWorkflow: () => Promise<void>;
  /** Loads a complete workflow state, replacing the current editor content. */
  loadCompleteWorkflow: (data: WorkflowData) => void;
  /** Resets the editor to a blank state for creating a new workflow. */
  resetWorkflowState: () => void;
}

// 3. Combined Slice Type
export type PersistenceSlice = PersistenceSliceState & PersistenceSliceActions;

// 4. Initial State
const initialState: PersistenceSliceState = {
  currentWorkflowId: null,
  workflowName: "",
  isSaving: false,
};

// 5. Slice Creator
export const createPersistenceSlice: StateCreator<
  WorkflowGeneratorStore,
  [],
  [],
  PersistenceSlice
> = (set, get) => ({
  ...initialState,

  setWorkflowName: (name: string) => {
    set({ workflowName: name });
  },

  resetWorkflowState: () => {
    set(initialState);
    get().resetCanvas();
    get().clearAllApiKeys();
  },

  loadCompleteWorkflow: (data: WorkflowData) => {
    set({
      workflowName: data.name || "",
      currentWorkflowId: data.id,
    });
    get().loadNodesAndEdges(
      data.nodes as WorkflowNode[],
      data.edges as Edge[]
    );
    const keys: ApiKeyMap = data.apiKeys ? { ...data.apiKeys } : {};
    get().replaceApiKeys(keys);
  },

  saveCurrentWorkflow: async () => {
    set({ isSaving: true });
    const { nodes, edges, workflowName, currentWorkflowId, apiKeys } = get();

    if (!workflowName) {
      alert("Please enter a name for the workflow before saving.");
      set({ isSaving: false });
      return;
    }

    const isNewWorkflow = !currentWorkflowId;

    const workflowData = {
      ...(isNewWorkflow ? {} : { id: currentWorkflowId }),
      name: workflowName,
      description: "Workflow saved from the editor.",
      nodes,
      edges,
      apiKeys,
    };

    try {
      const url = isNewWorkflow
        ? "/api/workflows"
        : `/api/workflows/${currentWorkflowId}`;
      const method = isNewWorkflow ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) {
        throw new Error(`Failed to save workflow. Status: ${response.status}`);
      }

      const savedWorkflow = await response.json();

      get().loadCompleteWorkflow(savedWorkflow);

      alert("Workflow saved!");
    } catch (error) {
      console.error(error);
      alert("Error saving workflow.");
    } finally {
      set({ isSaving: false });
    }
  },
});
