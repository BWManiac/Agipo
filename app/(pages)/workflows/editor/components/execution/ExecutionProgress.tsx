"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Circle } from "lucide-react";
import { useWorkflowStore } from "../../store";
import { useExecution } from "../../hooks/useExecution";
import { StepOutputTerminal } from "./StepOutputTerminal";

/**
 * Displays real-time step-by-step execution progress.
 * Shows status icons, duration, and expandable output for each step.
 */
export function ExecutionProgress() {
  const stepProgress = useWorkflowStore((s) => s.stepProgress);
  const executionStartTime = useWorkflowStore((s) => s.executionStartTime);
  const { cancelExecution } = useExecution();

  // Live elapsed time counter
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!executionStartTime) return;

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - executionStartTime) / 1000));
    }, 100);

    return () => clearInterval(interval);
  }, [executionStartTime]);

  return (
    <div className="space-y-4">
      {/* Timer */}
      <div className="text-sm text-muted-foreground text-center">
        Elapsed: {elapsedSeconds}s
      </div>

      {/* Step List */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {stepProgress.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            Initializing workflow...
          </div>
        ) : (
          stepProgress.map((step) => (
            <div
              key={step.stepId}
              className={`rounded-lg border transition-colors ${
                step.status === "running"
                  ? "border-primary bg-primary/5"
                  : step.status === "completed"
                  ? "border-green-500/50 bg-green-500/5"
                  : step.status === "failed"
                  ? "border-destructive/50 bg-destructive/5"
                  : "border-muted"
              }`}
            >
              {/* Step Header */}
              <div className="flex items-center gap-3 p-3">
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
                  {step.status === "completed" && step.durationMs !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      Completed in {(step.durationMs / 1000).toFixed(2)}s
                    </p>
                  )}
                  {step.status === "failed" && step.error && (
                    <p className="text-xs text-destructive truncate">{step.error}</p>
                  )}
                </div>

                {/* Duration Badge */}
                {step.durationMs !== undefined && step.status !== "pending" && step.status !== "running" && (
                  <div className="flex-shrink-0 text-xs text-muted-foreground">
                    {(step.durationMs / 1000).toFixed(1)}s
                  </div>
                )}
              </div>

              {/* Step Output (expandable terminal) */}
              {step.output && step.status === "completed" && (
                <div className="px-3 pb-3">
                  <StepOutputTerminal output={step.output} />
                </div>
              )}

              {/* Error Details */}
              {step.error && step.status === "failed" && (
                <div className="px-3 pb-3">
                  <div className="rounded border border-destructive/30 bg-destructive/5 p-2">
                    <pre className="text-xs text-destructive whitespace-pre-wrap break-all">
                      {step.error}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
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
