"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RotateCcw, X } from "lucide-react";
import { useWorkflowStore } from "../../store";

/**
 * Displays the final execution result.
 * Shows success with output JSON or failure with error details.
 */
export function ExecutionResult() {
  const executionStatus = useWorkflowStore((s) => s.executionStatus);
  const executionOutput = useWorkflowStore((s) => s.executionOutput);
  const executionError = useWorkflowStore((s) => s.executionError);
  const executionDurationMs = useWorkflowStore((s) => s.executionDurationMs);
  const failedStepId = useWorkflowStore((s) => s.failedStepId);
  const resetExecution = useWorkflowStore((s) => s.resetExecution);
  const closeModal = useWorkflowStore((s) => s.closeExecuteModal);

  const isSuccess = executionStatus === "completed";

  // Format output for display
  const outputJson = executionOutput
    ? JSON.stringify(executionOutput, null, 2)
    : null;

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div
        className={`flex items-center gap-3 rounded-lg p-4 ${
          isSuccess
            ? "bg-green-500/10 border border-green-500/30"
            : "bg-destructive/10 border border-destructive/30"
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
        ) : (
          <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />
        )}
        <div>
          <p className={`font-medium ${isSuccess ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
            {isSuccess ? "Workflow Completed" : "Workflow Failed"}
          </p>
          {executionDurationMs && (
            <p className="text-sm text-muted-foreground">
              Duration: {(executionDurationMs / 1000).toFixed(2)}s
            </p>
          )}
        </div>
      </div>

      {/* Success: Output */}
      {isSuccess && outputJson && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Output</h4>
          <pre className="rounded-lg border bg-muted/50 p-4 text-xs overflow-auto max-h-64">
            {outputJson}
          </pre>
        </div>
      )}

      {/* Failure: Error Details */}
      {!isSuccess && executionError && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-destructive">Error Details</h4>
          {failedStepId && (
            <p className="text-sm text-muted-foreground">
              Failed at step: <code className="bg-muted px-1 rounded">{failedStepId}</code>
            </p>
          )}
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-destructive whitespace-pre-wrap">{executionError}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={resetExecution}>
          <RotateCcw className="h-4 w-4" />
          Run Again
        </Button>
        <Button onClick={closeModal}>
          <X className="h-4 w-4" />
          Close
        </Button>
      </div>
    </div>
  );
}
