"use client";

import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Circle } from "lucide-react";
import { useWorkflowStore } from "../../store";
import { useExecution } from "../../hooks/useExecution";

/**
 * Displays real-time step-by-step execution progress.
 * Shows status icons and duration for each step.
 */
export function ExecutionProgress() {
  const stepProgress = useWorkflowStore((s) => s.stepProgress);
  const executionStartTime = useWorkflowStore((s) => s.executionStartTime);
  const { cancelExecution } = useExecution();

  // Calculate elapsed time
  const elapsedMs = executionStartTime ? Date.now() - executionStartTime : 0;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  return (
    <div className="space-y-4">
      {/* Timer */}
      <div className="text-sm text-muted-foreground text-center">
        Elapsed: {elapsedSeconds}s
      </div>

      {/* Step List */}
      <div className="space-y-2">
        {stepProgress.map((step) => (
          <div
            key={step.stepId}
            className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
              step.status === "running"
                ? "border-primary bg-primary/5"
                : step.status === "completed"
                ? "border-green-500/50 bg-green-500/5"
                : step.status === "failed"
                ? "border-destructive/50 bg-destructive/5"
                : "border-muted"
            }`}
          >
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {step.status === "pending" && (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              {step.status === "running" && (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              )}
              {step.status === "completed" && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              {step.status === "failed" && (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
            </div>

            {/* Step Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{step.stepName}</p>
              {step.status === "running" && (
                <p className="text-xs text-muted-foreground">Executing...</p>
              )}
              {step.status === "completed" && step.durationMs && (
                <p className="text-xs text-muted-foreground">
                  Completed in {step.durationMs}ms
                </p>
              )}
              {step.status === "failed" && step.error && (
                <p className="text-xs text-destructive truncate">{step.error}</p>
              )}
            </div>

            {/* Duration Badge */}
            {step.durationMs && step.status !== "pending" && (
              <div className="flex-shrink-0 text-xs text-muted-foreground">
                {step.durationMs}ms
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cancel Button */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={cancelExecution}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
