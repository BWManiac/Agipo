"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Circle } from "lucide-react";
import { useWorkflowStore } from "../../store";
import { useExecution } from "../../hooks/useExecution";
import { StepOutputTerminal } from "./StepOutputTerminal";

/**
 * Check if a step is an internal Mastra step that should be hidden.
 * Internal steps include mapping steps, trigger steps, etc.
 */
function isInternalStep(stepId: string, stepName: string): boolean {
  // Filter out mapping steps (data transfer between steps)
  if (stepId.startsWith("mapping_")) return true;
  if (stepName.startsWith("mapping_")) return true;
  // Filter out trigger steps
  if (stepId === "__trigger__" || stepName === "__trigger__") return true;
  return false;
}

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

  // Filter out internal steps
  const visibleSteps = useMemo(() => {
    return stepProgress.filter((step) => !isInternalStep(step.stepId, step.stepName));
  }, [stepProgress]);

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
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {visibleSteps.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            Initializing workflow...
          </div>
        ) : (
          visibleSteps.map((step) => (
            <div
              key={step.stepId}
              className={`rounded-lg border transition-all duration-200 ${
                step.status === "running"
                  ? "border-primary/60 bg-primary/5 shadow-sm"
                  : step.status === "completed"
                  ? "border-green-500/40 bg-green-500/5"
                  : step.status === "failed"
                  ? "border-destructive/40 bg-destructive/5"
                  : "border-muted bg-muted/20"
              }`}
            >
              {/* Step Header */}
              <div className="flex items-center gap-3 p-3">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {step.status === "pending" && (
                    <Circle className="h-5 w-5 text-muted-foreground/60" />
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
                  <p className="text-xs text-muted-foreground">
                    {step.status === "pending" && "Waiting..."}
                    {step.status === "running" && "Executing..."}
                    {step.status === "completed" && step.durationMs !== undefined && (
                      <>Completed in {(step.durationMs / 1000).toFixed(2)}s</>
                    )}
                    {step.status === "failed" && "Failed"}
                  </p>
                </div>

                {/* Duration Badge */}
                {step.durationMs !== undefined && step.status === "completed" && (
                  <div className="flex-shrink-0 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded">
                    {(step.durationMs / 1000).toFixed(2)}s
                  </div>
                )}
              </div>

              {/* Step Output (expandable terminal) */}
              {step.output && step.status === "completed" && (
                <div className="px-3 pb-3 pt-0">
                  <StepOutputTerminal output={step.output} />
                </div>
              )}

              {/* Error Details */}
              {step.error && step.status === "failed" && (
                <div className="px-3 pb-3">
                  <div className="rounded border border-destructive/30 bg-destructive/10 p-2">
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
      <div className="flex justify-center pt-2">
        <Button variant="outline" size="sm" onClick={cancelExecution}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
