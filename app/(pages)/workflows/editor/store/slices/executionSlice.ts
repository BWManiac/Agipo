import type { StateCreator } from "zustand";
import type { WorkflowStore } from "../types";

/**
 * Manages workflow execution state for the "Run" feature.
 * Tracks modal visibility, input values, execution progress, and results.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Status of an individual step during execution.
 */
export type StepStatus = "pending" | "running" | "completed" | "failed";

/**
 * Progress tracking for a single step.
 */
export interface StepProgress {
  stepId: string;
  stepName: string;
  status: StepStatus;
  output?: unknown;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

/**
 * Overall execution status.
 */
export type ExecutionStatus = "idle" | "running" | "completed" | "failed";

/**
 * Connection status for a required toolkit.
 */
export interface ConnectionStatus {
  toolkitSlug: string;
  connected: boolean;
}

// ============================================================================
// Slice State
// ============================================================================

export interface ExecutionSliceState {
  // Modal visibility
  isExecuteModalOpen: boolean;

  // Execution state
  executionStatus: ExecutionStatus;

  // Input values (filled by user in modal)
  inputValues: Record<string, unknown>;

  // Step-by-step progress
  stepProgress: StepProgress[];

  // Final output (on success)
  executionOutput: unknown | null;

  // Error details (on failure)
  executionError: string | null;
  failedStepId: string | null;

  // Execution timing
  executionStartTime: number | null;
  executionDurationMs: number | null;

  // Connection status (for UI display)
  connectionStatuses: ConnectionStatus[];
  missingConnections: string[];
}

// ============================================================================
// Slice Actions
// ============================================================================

export interface ExecutionSliceActions {
  // Modal control
  openExecuteModal: () => void;
  closeExecuteModal: () => void;

  // Input management
  setInputValue: (name: string, value: unknown) => void;
  setInputValues: (values: Record<string, unknown>) => void;
  resetInputValues: () => void;

  // Execution lifecycle
  startExecution: () => void;
  updateStepProgress: (stepId: string, update: Partial<StepProgress>) => void;
  completeExecution: (output: unknown, durationMs: number) => void;
  failExecution: (error: string, failedStepId?: string, durationMs?: number) => void;
  resetExecution: () => void;

  // Connection status
  setConnectionStatuses: (statuses: ConnectionStatus[]) => void;
  setMissingConnections: (connections: string[]) => void;
}

// ============================================================================
// Combined Type
// ============================================================================

export type ExecutionSlice = ExecutionSliceState & ExecutionSliceActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: ExecutionSliceState = {
  isExecuteModalOpen: false,
  executionStatus: "idle",
  inputValues: {},
  stepProgress: [],
  executionOutput: null,
  executionError: null,
  failedStepId: null,
  executionStartTime: null,
  executionDurationMs: null,
  connectionStatuses: [],
  missingConnections: [],
};

// ============================================================================
// Slice Creator
// ============================================================================

export const createExecutionSlice: StateCreator<
  WorkflowStore,
  [],
  [],
  ExecutionSlice
> = (set, get) => ({
  ...initialState,

  // Modal control
  openExecuteModal: () => {
    // Reset execution state when opening modal
    set({
      isExecuteModalOpen: true,
      executionStatus: "idle",
      stepProgress: [],
      executionOutput: null,
      executionError: null,
      failedStepId: null,
      executionDurationMs: null,
    });

    // Pre-populate input values with defaults
    const { workflowInputs } = get();
    const defaults: Record<string, unknown> = {};
    for (const input of workflowInputs) {
      if (input.defaultValue !== undefined) {
        defaults[input.name] = input.defaultValue;
      }
    }
    set({ inputValues: defaults });
  },

  closeExecuteModal: () => {
    set({ isExecuteModalOpen: false });
  },

  // Input management
  setInputValue: (name, value) => {
    set((state) => ({
      inputValues: { ...state.inputValues, [name]: value },
    }));
  },

  setInputValues: (values) => {
    set({ inputValues: values });
  },

  resetInputValues: () => {
    set({ inputValues: {} });
  },

  // Execution lifecycle
  startExecution: () => {
    // Build initial step progress from current steps
    const { steps } = get();
    const initialProgress: StepProgress[] = steps.map((step) => ({
      stepId: step.id,
      stepName: step.name || step.id,
      status: "pending",
    }));

    set({
      executionStatus: "running",
      executionStartTime: Date.now(),
      stepProgress: initialProgress,
      executionOutput: null,
      executionError: null,
      failedStepId: null,
    });
  },

  updateStepProgress: (stepId, update) => {
    set((state) => {
      const existingStep = state.stepProgress.find((s) => s.stepId === stepId);

      if (existingStep) {
        // Update existing step
        return {
          stepProgress: state.stepProgress.map((step) =>
            step.stepId === stepId ? { ...step, ...update } : step
          ),
        };
      } else {
        // Add new step (for dynamic step discovery from streaming)
        const newStep: StepProgress = {
          stepId,
          stepName: update.stepName || stepId,
          status: update.status || "pending",
          ...update,
        };
        return {
          stepProgress: [...state.stepProgress, newStep],
        };
      }
    });
  },

  completeExecution: (output, durationMs) => {
    set({
      executionStatus: "completed",
      executionOutput: output,
      executionDurationMs: durationMs,
    });
  },

  failExecution: (error, failedStepId, durationMs) => {
    set({
      executionStatus: "failed",
      executionError: error,
      failedStepId: failedStepId || null,
      executionDurationMs: durationMs || null,
    });
  },

  resetExecution: () => {
    set({
      executionStatus: "idle",
      stepProgress: [],
      executionOutput: null,
      executionError: null,
      failedStepId: null,
      executionStartTime: null,
      executionDurationMs: null,
    });
  },

  // Connection status
  setConnectionStatuses: (statuses) => {
    set({ connectionStatuses: statuses });
  },

  setMissingConnections: (connections) => {
    set({ missingConnections: connections });
  },
});
