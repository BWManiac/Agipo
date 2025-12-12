/**
 * Types for direct workflow execution from the editor.
 * Used by the POST /workflows/[workflowId]/execute endpoint.
 */

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Request body for workflow execution.
 * The inputData shape is dynamic based on the workflow's inputSchema.
 */
export interface ExecutionRequest {
  inputData: Record<string, unknown>;
}

/**
 * Validation result for execution prerequisites.
 */
export interface ExecutionValidation {
  valid: boolean;
  errors: string[];
  missingConnections: string[];
}

// ============================================================================
// SSE Stream Event Types
// ============================================================================

/**
 * Base event structure sent via SSE.
 */
interface BaseStreamEvent {
  timestamp: string;
}

/**
 * Emitted when a step begins executing.
 */
export interface StepStartEvent extends BaseStreamEvent {
  type: "step-start";
  stepId: string;
  stepName: string;
}

/**
 * Emitted when a step completes successfully.
 */
export interface StepCompleteEvent extends BaseStreamEvent {
  type: "step-complete";
  stepId: string;
  stepName: string;
  output: unknown;
  durationMs: number;
}

/**
 * Emitted when a step fails.
 */
export interface StepErrorEvent extends BaseStreamEvent {
  type: "step-error";
  stepId: string;
  stepName: string;
  error: string;
  durationMs: number;
}

/**
 * Emitted when the entire workflow completes successfully.
 */
export interface WorkflowCompleteEvent extends BaseStreamEvent {
  type: "workflow-complete";
  output: unknown;
  totalDurationMs: number;
}

/**
 * Emitted when the workflow fails.
 */
export interface WorkflowErrorEvent extends BaseStreamEvent {
  type: "workflow-error";
  error: string;
  failedStepId?: string;
  totalDurationMs: number;
}

/**
 * Union of all possible stream events.
 */
export type ExecutionStreamEvent =
  | StepStartEvent
  | StepCompleteEvent
  | StepErrorEvent
  | WorkflowCompleteEvent
  | WorkflowErrorEvent;

// ============================================================================
// Execution State Types (for frontend)
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
