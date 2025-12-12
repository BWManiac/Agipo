/**
 * Workflow Execution Service
 *
 * Handles workflow execution with streaming progress events.
 * Uses Mastra's run.stream() API to emit step-by-step progress.
 */

import { getWorkflowExecutable, getWorkflowMetadata } from "@/app/api/workflows/services/workflow-loader";
import type { ConnectionBindings } from "./connection-resolver";
import type { ExecutionStreamEvent } from "../types";

/**
 * Result of workflow execution setup.
 */
interface ExecutionSetup {
  workflow: unknown;
  metadata: { name: string; stepCount: number };
}

/**
 * Prepares a workflow for execution.
 * Loads the workflow executable and metadata.
 */
async function prepareWorkflow(workflowId: string): Promise<ExecutionSetup | null> {
  console.log(`[execution-service] Preparing workflow: ${workflowId}`);

  // Load executable
  const result = await getWorkflowExecutable(workflowId);
  if (!result) {
    console.error(`[execution-service] Workflow not found: ${workflowId}`);
    return null;
  }

  // Unwrap the wrapper object
  const workflow = result && typeof result === "object" && "__workflow" in result
    ? (result as { __workflow: unknown }).__workflow
    : result;

  if (!workflow) {
    return null;
  }

  // Load metadata
  const metadata = await getWorkflowMetadata(workflowId);
  if (!metadata) {
    console.error(`[execution-service] Metadata not found: ${workflowId}`);
    return null;
  }

  return {
    workflow,
    metadata: {
      name: metadata.name,
      stepCount: metadata.stepCount,
    },
  };
}

/**
 * Executes a workflow with streaming progress.
 * Yields SSE events for each step start/complete/error.
 *
 * @param workflowId - The workflow to execute
 * @param userId - The authenticated user
 * @param inputData - The workflow input data
 * @param connectionBindings - Resolved connection bindings
 * @yields ExecutionStreamEvent for each progress update
 */
export async function* executeWorkflowStream(
  workflowId: string,
  userId: string,
  inputData: Record<string, unknown>,
  connectionBindings: ConnectionBindings
): AsyncGenerator<ExecutionStreamEvent> {
  const startTime = Date.now();
  const stepStartTimes = new Map<string, number>();

  console.log(`[execution-service] Starting execution: ${workflowId}`);
  console.log(`[execution-service] Input data:`, JSON.stringify(inputData, null, 2));

  // 1. Prepare workflow
  const setup = await prepareWorkflow(workflowId);
  if (!setup) {
    yield {
      type: "workflow-error",
      error: `Workflow "${workflowId}" not found or not transpiled`,
      totalDurationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
    return;
  }

  const { workflow } = setup;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workflowObj = workflow as any;

  // 2. Verify workflow has required methods
  if (!workflowObj.createRunAsync) {
    yield {
      type: "workflow-error",
      error: "Workflow is missing createRunAsync method",
      totalDurationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
    return;
  }

  try {
    // 3. Build runtime context (must be Map, not plain object)
    const runtimeContext = new Map<string, unknown>();
    runtimeContext.set("connections", connectionBindings);
    runtimeContext.set("userId", userId);

    // 4. Create run instance
    const run = await workflowObj.createRunAsync({
      resourceId: userId,
    });

    // 5. Stream execution with real-time events
    // Use watch pattern to get real-time events
    let lastError: string | undefined;
    let lastFailedStepId: string | undefined;
    let finalOutput: unknown;
    let workflowCompleted = false;

    // Set up event watcher
    run.watch((event: { type: string; stepId?: string; data?: unknown; error?: unknown; payload?: unknown }) => {
      const timestamp = new Date().toISOString();

      if (event.type === "step-start" && event.stepId) {
        stepStartTimes.set(event.stepId, Date.now());
      }

      if (event.type === "step-complete" && event.stepId) {
        const stepStartTime = stepStartTimes.get(event.stepId) || startTime;
        const durationMs = Date.now() - stepStartTime;
        console.log(`[execution-service] Step complete: ${event.stepId} (${durationMs}ms)`);
      }

      if (event.type === "step-error" && event.stepId) {
        const stepStartTime = stepStartTimes.get(event.stepId) || startTime;
        const durationMs = Date.now() - stepStartTime;
        lastError = event.error instanceof Error ? event.error.message : String(event.error);
        lastFailedStepId = event.stepId;
        console.error(`[execution-service] Step error: ${event.stepId} - ${lastError} (${durationMs}ms)`);
      }
    });

    // 6. Start execution
    const result = await run.start({
      inputData,
      runtimeContext,
    });

    // 7. Process final result
    if (result.status === "success") {
      workflowCompleted = true;
      finalOutput = result.result;

      // Emit step events from result.steps
      if (result.steps) {
        for (const [stepId, stepData] of Object.entries(result.steps)) {
          const step = stepData as { status: string; output?: unknown; error?: unknown; startedAt?: string; completedAt?: string };
          const stepStartTime = stepStartTimes.get(stepId) || startTime;
          const durationMs = step.completedAt && step.startedAt
            ? new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime()
            : Date.now() - stepStartTime;

          if (step.status === "success") {
            yield {
              type: "step-complete",
              stepId,
              stepName: stepId, // Use stepId as name for now
              output: step.output,
              durationMs,
              timestamp: step.completedAt || new Date().toISOString(),
            };
          } else if (step.status === "failed") {
            yield {
              type: "step-error",
              stepId,
              stepName: stepId,
              error: step.error instanceof Error ? step.error.message : String(step.error || "Unknown error"),
              durationMs,
              timestamp: step.completedAt || new Date().toISOString(),
            };
          }
        }
      }

      yield {
        type: "workflow-complete",
        output: finalOutput,
        totalDurationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    } else if (result.status === "failed") {
      // Extract error details
      const failedSteps = Object.entries(result.steps || {})
        .filter(([_, step]) => (step as { status: string }).status === "failed")
        .map(([id, step]) => ({
          stepId: id,
          error: (step as { error?: unknown }).error,
        }));

      const errorMessage = failedSteps.length > 0
        ? `Step "${failedSteps[0].stepId}" failed: ${failedSteps[0].error}`
        : lastError || "Workflow execution failed";

      yield {
        type: "workflow-error",
        error: errorMessage,
        failedStepId: failedSteps[0]?.stepId || lastFailedStepId,
        totalDurationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    } else {
      // Suspended or other status
      yield {
        type: "workflow-error",
        error: `Workflow ended with status: ${result.status}`,
        totalDurationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error(`[execution-service] Execution error:`, error);
    yield {
      type: "workflow-error",
      error: error instanceof Error ? error.message : String(error),
      totalDurationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Gets step names from workflow metadata for better UX.
 * Falls back to step IDs if names aren't available.
 */
export async function getStepNames(workflowId: string): Promise<Map<string, string>> {
  const stepNames = new Map<string, string>();

  try {
    // Try to load workflow.json for step names
    const metadata = await getWorkflowMetadata(workflowId);
    if (metadata) {
      // For now, we don't have step names in metadata
      // Future: Add step names to WorkflowMetadata
    }
  } catch (error) {
    console.warn(`[execution-service] Could not load step names:`, error);
  }

  return stepNames;
}
