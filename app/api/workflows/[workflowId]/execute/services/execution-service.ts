/**
 * Workflow Execution Service
 *
 * Handles workflow execution with real-time streaming progress events.
 * Uses Mastra's run.stream() API to emit step-by-step progress.
 */

import { getWorkflowExecutable, getWorkflowMetadata } from "@/app/api/workflows/services/workflow-loader";
import type { ConnectionBindings } from "./connection-resolver";
import { loadStepNames, getStepName } from "./step-name-resolver";
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
 * Executes a workflow with real-time streaming progress.
 * Uses run.stream() to yield events as each step executes.
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

  // 1. Load step names for human-readable display
  const stepNameMap = await loadStepNames(workflowId);

  // 2. Prepare workflow
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

  // 3. Verify workflow has required methods
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
    // 4. Build runtime context (must be Map, not plain object)
    const runtimeContext = new Map<string, unknown>();
    runtimeContext.set("connections", connectionBindings);
    runtimeContext.set("userId", userId);

    // 5. Create run instance
    const run = await workflowObj.createRunAsync({
      resourceId: userId,
    });

    // 6. Check if run.stream() is available, fall back to run.start() if not
    if (typeof run.stream === "function") {
      // Use streaming API for real-time events
      console.log(`[execution-service] Using run.stream() for real-time events`);

      try {
        for await (const event of run.stream({ inputData, runtimeContext })) {
          console.log(`[execution-service] Stream event:`, JSON.stringify(event, null, 2));

          const timestamp = new Date().toISOString();

          // Handle different event types from Mastra
          // Event structure may vary - handle common patterns
          const eventType = event.type || event.eventType;
          const stepId = event.stepId || event.payload?.stepId;

          if (eventType === "step-start" || eventType === "workflow-step-start") {
            if (stepId) {
              stepStartTimes.set(stepId, Date.now());
              yield {
                type: "step-start",
                stepId,
                stepName: getStepName(stepNameMap, stepId),
                timestamp,
              };
            }
          } else if (eventType === "step-complete" || eventType === "workflow-step-complete") {
            if (stepId) {
              const stepStartTime = stepStartTimes.get(stepId) || startTime;
              const durationMs = Date.now() - stepStartTime;
              yield {
                type: "step-complete",
                stepId,
                stepName: getStepName(stepNameMap, stepId),
                output: event.data || event.payload?.data || event.output,
                durationMs,
                timestamp,
              };
            }
          } else if (eventType === "step-error" || eventType === "workflow-step-error") {
            if (stepId) {
              const stepStartTime = stepStartTimes.get(stepId) || startTime;
              const durationMs = Date.now() - stepStartTime;
              const errorMsg = event.error instanceof Error
                ? event.error.message
                : String(event.error || event.payload?.error || "Unknown error");
              yield {
                type: "step-error",
                stepId,
                stepName: getStepName(stepNameMap, stepId),
                error: errorMsg,
                durationMs,
                timestamp,
              };
            }
          } else if (eventType === "workflow-complete" || eventType === "complete") {
            yield {
              type: "workflow-complete",
              output: event.result || event.data || event.payload?.result,
              totalDurationMs: Date.now() - startTime,
              timestamp,
            };
            return; // Exit after workflow complete
          } else if (eventType === "workflow-error" || eventType === "error") {
            const errorMsg = event.error instanceof Error
              ? event.error.message
              : String(event.error || "Workflow failed");
            yield {
              type: "workflow-error",
              error: errorMsg,
              failedStepId: stepId,
              totalDurationMs: Date.now() - startTime,
              timestamp,
            };
            return; // Exit after error
          } else {
            // Log unknown event types for debugging
            console.log(`[execution-service] Unknown event type: ${eventType}`, event);
          }
        }

        // If stream completes without explicit workflow-complete, send one
        yield {
          type: "workflow-complete",
          output: null,
          totalDurationMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        };
      } catch (streamError) {
        console.error(`[execution-service] Stream error:`, streamError);
        yield {
          type: "workflow-error",
          error: streamError instanceof Error ? streamError.message : String(streamError),
          totalDurationMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        };
      }
    } else {
      // Fallback to run.start() if stream not available
      console.log(`[execution-service] run.stream() not available, falling back to run.start()`);

      const result = await run.start({
        inputData,
        runtimeContext,
      });

      // Process final result and emit events
      if (result.steps) {
        for (const [stepId, stepData] of Object.entries(result.steps)) {
          const step = stepData as { status: string; output?: unknown; error?: unknown };
          const stepName = getStepName(stepNameMap, stepId);

          if (step.status === "success") {
            yield {
              type: "step-complete",
              stepId,
              stepName,
              output: step.output,
              durationMs: 0, // Unknown without streaming
              timestamp: new Date().toISOString(),
            };
          } else if (step.status === "failed") {
            yield {
              type: "step-error",
              stepId,
              stepName,
              error: step.error instanceof Error ? step.error.message : String(step.error || "Unknown error"),
              durationMs: 0,
              timestamp: new Date().toISOString(),
            };
          }
        }
      }

      if (result.status === "success") {
        yield {
          type: "workflow-complete",
          output: result.result,
          totalDurationMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        };
      } else {
        yield {
          type: "workflow-error",
          error: `Workflow ended with status: ${result.status}`,
          totalDurationMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        };
      }
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
