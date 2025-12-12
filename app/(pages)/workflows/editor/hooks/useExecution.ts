import { useCallback, useRef } from "react";
import { useWorkflowStore } from "../store";
import type { StepProgress } from "../store/slices/executionSlice";

/**
 * SSE event types from the execution API.
 */
interface StepStartEvent {
  type: "step-start";
  stepId: string;
  stepName: string;
  timestamp: string;
}

interface StepCompleteEvent {
  type: "step-complete";
  stepId: string;
  stepName: string;
  output: unknown;
  durationMs: number;
  timestamp: string;
}

interface StepErrorEvent {
  type: "step-error";
  stepId: string;
  stepName: string;
  error: string;
  durationMs: number;
  timestamp: string;
}

interface WorkflowCompleteEvent {
  type: "workflow-complete";
  output: unknown;
  totalDurationMs: number;
  timestamp: string;
}

interface WorkflowErrorEvent {
  type: "workflow-error";
  error: string;
  failedStepId?: string;
  totalDurationMs: number;
  timestamp: string;
}

type ExecutionEvent =
  | StepStartEvent
  | StepCompleteEvent
  | StepErrorEvent
  | WorkflowCompleteEvent
  | WorkflowErrorEvent;

/**
 * Execution info from GET /api/workflows/[id]/execute
 */
interface ExecutionInfo {
  workflowId: string;
  isTranspiled: boolean;
  canExecute: boolean;
  errors: string[];
  missingConnections: string[];
  resolvedConnections: string[];
}

/**
 * Hook for executing workflows with SSE streaming.
 * Handles the execution API calls and updates store state.
 */
export function useExecution() {
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get store state and actions
  const id = useWorkflowStore((s) => s.id);
  const inputValues = useWorkflowStore((s) => s.inputValues);
  const executionStatus = useWorkflowStore((s) => s.executionStatus);

  const startExecution = useWorkflowStore((s) => s.startExecution);
  const updateStepProgress = useWorkflowStore((s) => s.updateStepProgress);
  const completeExecution = useWorkflowStore((s) => s.completeExecution);
  const failExecution = useWorkflowStore((s) => s.failExecution);
  const setMissingConnections = useWorkflowStore((s) => s.setMissingConnections);

  /**
   * Check if workflow can be executed (connections available, etc.)
   */
  const checkExecution = useCallback(async (): Promise<ExecutionInfo | null> => {
    if (!id) return null;

    try {
      const response = await fetch(`/api/workflows/${id}/execute`);
      if (!response.ok) {
        console.error("[useExecution] Failed to check execution:", response.statusText);
        return null;
      }
      const info: ExecutionInfo = await response.json();
      setMissingConnections(info.missingConnections);
      return info;
    } catch (error) {
      console.error("[useExecution] Error checking execution:", error);
      return null;
    }
  }, [id, setMissingConnections]);

  /**
   * Execute the workflow with current input values.
   * Streams progress via SSE and updates store state.
   */
  const execute = useCallback(async () => {
    if (!id) {
      failExecution("No workflow ID");
      return;
    }

    // Cancel any existing execution
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Start execution in store
    startExecution();

    try {
      const response = await fetch(`/api/workflows/${id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputData: inputValues }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        failExecution(error.message || "Execution failed", undefined, 0);
        return;
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        failExecution("No response body");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event: ExecutionEvent = JSON.parse(line.slice(6));
              handleEvent(event);
            } catch (e) {
              console.error("[useExecution] Failed to parse event:", line, e);
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.log("[useExecution] Execution aborted");
        return;
      }
      console.error("[useExecution] Execution error:", error);
      failExecution(error instanceof Error ? error.message : "Execution failed");
    }
  }, [id, inputValues, startExecution, failExecution]);

  /**
   * Handle an SSE event and update store state.
   */
  const handleEvent = useCallback(
    (event: ExecutionEvent) => {
      console.log("[useExecution] Event:", event.type, event);

      switch (event.type) {
        case "step-start":
          updateStepProgress(event.stepId, {
            status: "running",
            stepName: event.stepName,
            startedAt: event.timestamp,
          });
          break;

        case "step-complete":
          updateStepProgress(event.stepId, {
            status: "completed",
            stepName: event.stepName,
            output: event.output,
            completedAt: event.timestamp,
            durationMs: event.durationMs,
          });
          break;

        case "step-error":
          updateStepProgress(event.stepId, {
            status: "failed",
            stepName: event.stepName,
            error: event.error,
            completedAt: event.timestamp,
            durationMs: event.durationMs,
          });
          break;

        case "workflow-complete":
          completeExecution(event.output, event.totalDurationMs);
          break;

        case "workflow-error":
          failExecution(event.error, event.failedStepId, event.totalDurationMs);
          break;
      }
    },
    [updateStepProgress, completeExecution, failExecution]
  );

  /**
   * Cancel the current execution.
   */
  const cancelExecution = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    failExecution("Execution cancelled");
  }, [failExecution]);

  return {
    execute,
    checkExecution,
    cancelExecution,
    isExecuting: executionStatus === "running",
  };
}
