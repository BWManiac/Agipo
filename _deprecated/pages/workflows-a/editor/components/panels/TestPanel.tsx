"use client";

import { useState } from "react";
import { Play, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useWorkflowEditorStore } from "../../store";
import type { ExecutionStatus, StepExecutionResult } from "../../store/types";

export function TestPanel() {
  const {
    workflow,
    steps,
    runtimeInputs,
    testInputValues,
    setTestInputValue,
    executionStatus,
    stepResults,
    setExecutionStatus,
    setStepResult,
    clearResults,
  } = useWorkflowEditorStore();

  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    if (!workflow || isRunning) return;

    setIsRunning(true);
    clearResults();
    setExecutionStatus("running");

    try {
      // Simulate step-by-step execution
      for (const step of steps.sort((a, b) => a.listIndex - b.listIndex)) {
        setStepResult({
          stepId: step.id,
          status: "running",
        });

        // Simulate execution delay
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1500));

        // Simulate success/failure (90% success rate for demo)
        const success = Math.random() > 0.1;

        setStepResult({
          stepId: step.id,
          status: success ? "success" : "error",
          output: success ? { message: `Step ${step.name} completed` } : undefined,
          error: success ? undefined : "Simulated error for testing",
          duration: Math.floor(1000 + Math.random() * 1500),
        });

        if (!success) {
          setExecutionStatus("error");
          setIsRunning(false);
          return;
        }
      }

      setExecutionStatus("success");
    } catch (error) {
      setExecutionStatus("error");
    } finally {
      setIsRunning(false);
    }
  };

  const allInputsFilled = runtimeInputs
    .filter((i) => i.required)
    .every((i) => testInputValues[i.key] !== undefined && testInputValues[i.key] !== "");

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <h4 className="font-medium">Test Workflow</h4>
        <p className="text-xs text-slate-500 mt-1">
          Run your workflow with test inputs
        </p>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-4">
        {/* Input Form */}
        {runtimeInputs.length > 0 && (
          <div className="space-y-3">
            <h5 className="text-sm font-medium">Test Inputs</h5>
            {runtimeInputs.map((input) => (
              <div key={input.key}>
                <Label className="text-xs">
                  {input.label}
                  {input.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  className="h-8 mt-1"
                  placeholder={input.description || input.key}
                  value={String(testInputValues[input.key] || "")}
                  onChange={(e) => setTestInputValue(input.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Run Button */}
        <Button
          className="w-full"
          onClick={handleRun}
          disabled={isRunning || !allInputsFilled || steps.length === 0}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Test
            </>
          )}
        </Button>

        {/* Execution Results */}
        {stepResults.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium">Execution Progress</h5>
            {steps
              .sort((a, b) => a.listIndex - b.listIndex)
              .map((step) => {
                const result = stepResults.find((r) => r.stepId === step.id);
                return (
                  <StepResultCard key={step.id} stepName={step.name} result={result} />
                );
              })}
          </div>
        )}

        {/* Final Status */}
        {executionStatus !== "idle" && executionStatus !== "running" && (
          <div
            className={cn(
              "rounded-lg p-3 text-sm",
              executionStatus === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            )}
          >
            {executionStatus === "success" ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Workflow completed successfully!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                <span>Workflow failed. Check the step that errored.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StepResultCard({
  stepName,
  result,
}: {
  stepName: string;
  result?: StepExecutionResult;
}) {
  if (!result) {
    return (
      <div className="border rounded-lg p-3 bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
          <span className="text-sm text-slate-500">{stepName}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border rounded-lg p-3",
        result.status === "running" && "bg-blue-50 border-blue-200",
        result.status === "success" && "bg-green-50 border-green-200",
        result.status === "error" && "bg-red-50 border-red-200"
      )}
    >
      <div className="flex items-center gap-2">
        <StatusIcon status={result.status} />
        <span className="text-sm font-medium flex-1">{stepName}</span>
        {result.duration && (
          <span className="text-xs text-slate-500">
            <Clock className="h-3 w-3 inline mr-1" />
            {(result.duration / 1000).toFixed(1)}s
          </span>
        )}
      </div>
      {result.error && (
        <p className="mt-2 text-xs text-red-600">{result.error}</p>
      )}
      {result.output !== undefined && result.output !== null && (
        <pre className="mt-2 text-xs bg-white/50 rounded p-2 overflow-x-auto">
          {JSON.stringify(result.output, null, 2)}
        </pre>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: ExecutionStatus }) {
  switch (status) {
    case "running":
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    case "success":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "error":
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <div className="h-5 w-5 rounded-full border-2 border-slate-300" />;
  }
}




