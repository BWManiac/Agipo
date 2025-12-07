import type { StateCreator } from "zustand";
import type { WorkflowStep } from "@/app/api/workflows/types";
import type { WorkflowStore } from "../types";
import { nanoid } from "nanoid";
import { arrayMove } from "@dnd-kit/sortable";

/**
 * Manages the workflow steps that users add, configure, and arrange.
 * Enables users to add steps (Composio tools, custom code), update step configuration,
 * delete steps, and reorder steps. Powers the step timeline/list view and canvas view
 * where users build their workflow. Core functionality for workflow editing.
 */

// 1. State Interface
export interface StepsSliceState {
  steps: WorkflowStep[];
  // Array of all workflow steps in execution order. Powers the step timeline/list view and canvas view.
  selectedStepId: string | null;
  // ID of the currently selected step. Used to highlight step in UI and show step details in sidebar.
}

// 2. Actions Interface
export interface StepsSliceActions {
  addStep: (step: WorkflowStep) => void;
  // Adds a new step to the workflow at the end.
  addStepAtIndex: (data: Record<string, unknown>, index: number) => void;
  // Creates and adds a step from palette drag data at specific index.
  updateStep: (stepId: string, updates: Partial<WorkflowStep>) => void;
  // Updates step configuration (name, input/output schemas, tool settings).
  deleteStep: (stepId: string) => void;
  // Removes a step from the workflow. Also clears selection if deleted step was selected.
  reorderSteps: (activeId: string, overId: string) => void;
  // Swaps two steps by their IDs. Called when user drags steps in rail view.
  setSelectedStepId: (stepId: string | null) => void;
  // Sets which step is currently selected. Called when user clicks a step to view/edit it.
  loadSteps: (steps: WorkflowStep[]) => void;
  // Loads all steps from a workflow definition. Called when loading existing workflow from API.
  
  // Container/Lane selectors
  getChildSteps: (containerId: string) => WorkflowStep[];
  // Gets child steps for a container (Loop, ForEach). Returns steps where parentId === containerId.
  getChildStepsForLane: (parentId: string, laneIndex: number, laneType?: "branch" | "parallel") => WorkflowStep[];
  // Gets child steps for a specific lane in Branch or Parallel.
  
  // Container operations
  moveStepIntoContainer: (stepId: string, containerId: string, index?: number) => void;
  // Moves a step into a container.
  moveStepToLane: (stepId: string, parentId: string, laneIndex: number, laneType: "branch" | "parallel") => void;
  // Moves a step into a specific lane.
  moveStepOutOfContainer: (stepId: string) => void;
  // Moves a step out of its container back to main rail.
}

// 3. Combined Slice Type
export type StepsSlice = StepsSliceState & StepsSliceActions;

// 4. Initial State
const initialState: StepsSliceState = {
  steps: [], // Start with no steps - user builds workflow by adding steps one by one
  selectedStepId: null, // Start with no selection - user hasn't clicked on any step yet
};

// 5. Slice Creator
export const createStepsSlice: StateCreator<
  WorkflowStore,
  [],
  [],
  StepsSlice
> = (set, get) => ({
  ...initialState,
  addStep: (step) =>
    set((state) => ({
      steps: [...state.steps, step],
    })),

  addStepAtIndex: (data, index) =>
    set((state) => {
      // Create step from palette drag data
      const tool = data.tool as { id: string; name: string; description?: string } | undefined;
      const integration = data.integration as { slug: string; name: string; logo?: string } | undefined;

      const newStep: WorkflowStep = {
        id: nanoid(),
        type: data.type === "control" ? "control" : "composio",
        name: (data.name as string) || tool?.name || "New Step",
        description: tool?.description,
        toolId: tool?.id,
        toolkitSlug: integration?.slug,
        toolkitName: integration?.name,
        toolkitLogo: integration?.logo,
        controlType: data.controlType as WorkflowStep["controlType"],
        position: { x: 0, y: index * 150 },
        listIndex: index,
        inputSchema: { type: "object", properties: {} },
        outputSchema: { type: "object", properties: {} },
      };

      const newSteps = [...state.steps];
      newSteps.splice(index, 0, newStep);
      return { steps: newSteps, selectedStepId: newStep.id };
    }),

  updateStep: (stepId, updates) =>
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === stepId ? { ...s, ...updates } : s
      ),
    })),

  deleteStep: (stepId) =>
    set((state) => ({
      steps: state.steps.filter((s) => s.id !== stepId),
      selectedStepId:
        state.selectedStepId === stepId ? null : state.selectedStepId,
    })),

  reorderSteps: (activeId, overId) =>
    set((state) => {
      const oldIndex = state.steps.findIndex((s) => s.id === activeId);
      const newIndex = state.steps.findIndex((s) => s.id === overId);
      if (oldIndex === -1 || newIndex === -1) return state;
      return { steps: arrayMove(state.steps, oldIndex, newIndex) };
    }),

  setSelectedStepId: (stepId) => set({ selectedStepId: stepId }),
  loadSteps: (steps) => set({ steps }),

  // Container/Lane selectors
  getChildSteps: (containerId) => {
    const { steps } = get();
    return steps.filter((s) => s.parentId === containerId);
  },

  getChildStepsForLane: (parentId, laneIndex, laneType = "branch") => {
    const { steps } = get();
    return steps.filter((s) => {
      if (s.parentId !== parentId) return false;
      if (laneType === "branch") {
        return s.branchConditionIndex === laneIndex;
      }
      return s.parallelLaneIndex === laneIndex;
    });
  },

  // Container operations
  moveStepIntoContainer: (stepId, containerId, index) =>
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === stepId
          ? { ...s, parentId: containerId, listIndex: index ?? 0 }
          : s
      ),
    })),

  moveStepToLane: (stepId, parentId, laneIndex, laneType) =>
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === stepId
          ? {
              ...s,
              parentId,
              branchConditionIndex: laneType === "branch" ? laneIndex : undefined,
              parallelLaneIndex: laneType === "parallel" ? laneIndex : undefined,
            }
          : s
      ),
    })),

  moveStepOutOfContainer: (stepId) =>
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === stepId
          ? { ...s, parentId: null, branchConditionIndex: undefined, parallelLaneIndex: undefined }
          : s
      ),
    })),
});

