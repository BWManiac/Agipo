/**
 * Execution Slice
 * 
 * Manages workflow execution state:
 * - Execution status
 * - Step-by-step progress
 * - Test inputs
 * - Results and errors
 */

import type { StateCreator } from "zustand";
import type { 
  WorkflowsBStore, 
  ExecutionSlice, 
  ExecutionSliceState,
  StepExecutionState,
} from "../types";

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: ExecutionSliceState = {
  executionStatus: "idle",
  runId: null,
  stepStatuses: {},
  currentStepId: null,
  workflowOutput: null,
  workflowError: null,
  totalDuration: null,
  testInputs: {},
};

// =============================================================================
// SLICE CREATOR
// =============================================================================

export const createExecutionSlice: StateCreator<
  WorkflowsBStore,
  [],
  [],
  ExecutionSlice
> = (set, get) => ({
  ...initialState,

  startExecution: (runId) => {
    // Initialize step statuses based on current workflow
    const workflow = get().workflow;
    const stepStatuses: Record<string, StepExecutionState> = {};
    
    if (workflow) {
      for (const step of workflow.steps) {
        stepStatuses[step.id] = { status: "pending" };
      }
      
      // Mark the first step as running
      if (workflow.steps.length > 0) {
        const firstStepId = workflow.steps[0].id;
        stepStatuses[firstStepId] = { 
          status: "running",
          startTime: Date.now(),
        };
        
        set({
          executionStatus: "running",
          runId,
          stepStatuses,
          currentStepId: firstStepId,
          workflowOutput: null,
          workflowError: null,
          totalDuration: null,
        });
      }
    }
  },

  updateStepStatus: (stepId, status) => {
    set((state) => {
      const newStatuses = {
        ...state.stepStatuses,
        [stepId]: status,
      };
      
      // Update current step ID based on which step is running
      let currentStepId = state.currentStepId;
      if (status.status === "running") {
        currentStepId = stepId;
      } else if (status.status === "completed" || status.status === "failed") {
        // Find the next pending step
        const workflow = get().workflow;
        if (workflow) {
          const stepIndex = workflow.steps.findIndex(s => s.id === stepId);
          const nextStep = workflow.steps.slice(stepIndex + 1).find(
            s => newStatuses[s.id]?.status === "pending" || newStatuses[s.id]?.status === "running"
          );
          currentStepId = nextStep?.id ?? null;
        }
      }
      
      return {
        stepStatuses: newStatuses,
        currentStepId,
      };
    });
  },

  completeExecution: (output, duration) => {
    set({
      executionStatus: "completed",
      workflowOutput: output,
      totalDuration: duration,
      currentStepId: null,
    });
  },

  failExecution: (error) => {
    set({
      executionStatus: "failed",
      workflowError: error,
      currentStepId: null,
    });
  },

  cancelExecution: () => {
    set((state) => {
      // Mark any running steps as skipped
      const newStatuses = { ...state.stepStatuses };
      for (const [stepId, status] of Object.entries(newStatuses)) {
        if (status.status === "running" || status.status === "pending") {
          newStatuses[stepId] = { status: "skipped" };
        }
      }
      
      return {
        executionStatus: "cancelled",
        stepStatuses: newStatuses,
        currentStepId: null,
      };
    });
  },

  resetExecution: () => {
    set({
      executionStatus: "idle",
      runId: null,
      stepStatuses: {},
      currentStepId: null,
      workflowOutput: null,
      workflowError: null,
      totalDuration: null,
    });
  },

  setTestInputs: (inputs) => {
    set({ testInputs: inputs });
  },

  updateTestInput: (name, value) => {
    set((state) => ({
      testInputs: {
        ...state.testInputs,
        [name]: value,
      },
    }));
  },
});




