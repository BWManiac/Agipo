/**
 * Workflows B API Types
 * 
 * Request and response types for the Workflows B API endpoints.
 * These types are used for communication between the frontend and backend.
 */

import type { EditorState, WorkflowDefinition, WorkflowStatus } from "@/_tables/workflows-b/types";

// =============================================================================
// REQUEST TYPES
// =============================================================================

/**
 * Request to create a new workflow.
 * POST /api/workflows-b
 */
export type CreateWorkflowRequest = {
  name: string;
  description?: string;
};

/**
 * Request to update an existing workflow.
 * PUT /api/workflows-b/[id]
 */
export type UpdateWorkflowRequest = {
  name?: string;
  description?: string;
  status?: WorkflowStatus;
  // The full editor state for saving
  editorState?: EditorState;
};

/**
 * Request to execute a workflow.
 * POST /api/workflows-b/[id]/execute
 */
export type ExecuteWorkflowRequest = {
  // Values for runtime inputs
  inputs: Record<string, unknown>;
  // Optional: specific step to start from (for debugging)
  startFromStep?: string;
};

/**
 * Request to generate workflow code.
 * POST /api/workflows-b/[id]/generate
 */
export type GenerateWorkflowRequest = {
  // Force regeneration even if workflow.ts exists
  force?: boolean;
};

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * Summary item for workflow list view.
 * GET /api/workflows-b
 */
export type WorkflowListItem = {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  stepCount: number;
  lastModified: string;
  // Platforms used (for showing connection badges)
  platforms: string[];
};

/**
 * Response for listing workflows.
 * GET /api/workflows-b
 */
export type ListWorkflowsResponse = {
  workflows: WorkflowListItem[];
};

/**
 * Response for getting a single workflow.
 * GET /api/workflows-b/[id]
 */
export type GetWorkflowResponse = {
  editorState: EditorState;
};

/**
 * Response for creating a workflow.
 * POST /api/workflows-b
 */
export type CreateWorkflowResponse = {
  id: string;
  editorState: EditorState;
};

/**
 * Response for updating a workflow.
 * PUT /api/workflows-b/[id]
 */
export type UpdateWorkflowResponse = {
  success: boolean;
  editorState: EditorState;
};

/**
 * Response for deleting a workflow.
 * DELETE /api/workflows-b/[id]
 */
export type DeleteWorkflowResponse = {
  success: boolean;
};

/**
 * Response for generating workflow code.
 * POST /api/workflows-b/[id]/generate
 */
export type GenerateWorkflowResponse = {
  success: boolean;
  path: string;
  // The generated TypeScript code (for preview)
  code?: string;
};

/**
 * Step execution status during workflow run.
 */
export type StepExecutionStatus = {
  stepId: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startTime?: string;
  endTime?: string;
  duration?: number;
  output?: unknown;
  error?: string;
};

/**
 * Response for workflow execution (streamed via SSE).
 * POST /api/workflows-b/[id]/execute
 */
export type ExecuteWorkflowResponse = {
  runId: string;
  status: "running" | "completed" | "failed";
  stepStatuses: StepExecutionStatus[];
  output?: unknown;
  error?: string;
  totalDuration?: number;
};

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Standard API error response.
 */
export type ApiErrorResponse = {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
};
