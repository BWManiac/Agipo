"use client";

import { useState } from "react";
import { Play, Loader2, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { useWorkflowsDStore } from "../../store";

export function TestTab() {
  const { 
    runtimeInputs, 
    testInputValues, 
    setTestInputValue, 
    steps,
    executionStatus,
    stepResults,
    setExecutionStatus,
    setStepResult,
    clearResults,
    getRequiredToolkits,
    connections
  } = useWorkflowsDStore();

  const [isRunning, setIsRunning] = useState(false);
  const requiredToolkits = getRequiredToolkits();
  const hasAllConnections = requiredToolkits.every((slug) => connections[slug]);

  const handleRunTest = async () => {
    if (steps.length === 0) return;

    setIsRunning(true);
    clearResults();
    setExecutionStatus("running");

    // Simulate step-by-step execution
    for (const step of steps) {
      setStepResult({
        stepId: step.id,
        status: "running",
      });

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Simulate success/failure (90% success rate for demo)
      const success = Math.random() > 0.1;
      
      setStepResult({
        stepId: step.id,
        status: success ? "success" : "error",
        output: success ? { result: "Sample output data" } : undefined,
        error: success ? undefined : "Simulated error for testing",
        duration: Math.floor(1000 + Math.random() * 2000),
      });

      if (!success) {
        setExecutionStatus("error");
        setIsRunning(false);
        return;
      }
    }

    setExecutionStatus("success");
    setIsRunning(false);
  };

  return (
    <div className="space-y-4">
      {/* Test inputs */}
      {runtimeInputs.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white">Test Inputs</h4>
          {runtimeInputs.map((input) => (
            <div key={input.key}>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                {input.label}
                {input.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              <input
                type={input.type === "number" ? "number" : "text"}
                value={(testInputValues[input.key] as string) || ""}
                onChange={(e) => setTestInputValue(input.key, e.target.value)}
                placeholder={input.description || `Enter ${input.label}`}
                className="w-full h-9 px-3 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
          ))}
        </div>
      )}

      {/* Connection warning */}
      {!hasAllConnections && requiredToolkits.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200">
            Connect all required integrations before testing.
          </p>
        </div>
      )}

      {/* Run button */}
      <button
        onClick={handleRunTest}
        disabled={isRunning || steps.length === 0}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Running...
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Run Test
          </>
        )}
      </button>

      {/* Execution results */}
      {stepResults.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-white/5">
          <h4 className="text-sm font-medium text-white">Execution Results</h4>
          {steps.map((step) => {
            const result = stepResults.find((r) => r.stepId === step.id);
            return (
              <StepResultCard key={step.id} step={step} result={result} />
            );
          })}
        </div>
      )}

      {/* Overall status */}
      {executionStatus !== "idle" && (
        <div className={`flex items-center gap-2 p-3 rounded-xl ${
          executionStatus === "success" 
            ? "bg-emerald-500/10 border border-emerald-500/20"
            : executionStatus === "error"
            ? "bg-red-500/10 border border-red-500/20"
            : "bg-violet-500/10 border border-violet-500/20"
        }`}>
          {executionStatus === "success" && <CheckCircle className="h-4 w-4 text-emerald-400" />}
          {executionStatus === "error" && <XCircle className="h-4 w-4 text-red-400" />}
          {executionStatus === "running" && <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />}
          <span className={`text-sm font-medium ${
            executionStatus === "success" ? "text-emerald-400" :
            executionStatus === "error" ? "text-red-400" : "text-violet-400"
          }`}>
            {executionStatus === "success" && "Workflow completed successfully"}
            {executionStatus === "error" && "Workflow failed"}
            {executionStatus === "running" && "Running workflow..."}
          </span>
        </div>
      )}
    </div>
  );
}

function StepResultCard({ step, result }: { 
  step: { id: string; name: string; listIndex: number }; 
  result?: { status: string; duration?: number; error?: string } 
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${
      !result ? "bg-slate-800/30 border-white/5" :
      result.status === "success" ? "bg-emerald-500/5 border-emerald-500/20" :
      result.status === "error" ? "bg-red-500/5 border-red-500/20" :
      "bg-violet-500/5 border-violet-500/20"
    }`}>
      <div className="h-7 w-7 rounded-lg bg-slate-700/50 flex items-center justify-center text-xs font-medium text-slate-300">
        {step.listIndex + 1}
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-medium text-white truncate">{step.name}</h5>
        {result?.duration && (
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {result.duration}ms
          </p>
        )}
        {result?.error && (
          <p className="text-xs text-red-400 truncate">{result.error}</p>
        )}
      </div>
      {result && (
        <div>
          {result.status === "success" && <CheckCircle className="h-4 w-4 text-emerald-400" />}
          {result.status === "error" && <XCircle className="h-4 w-4 text-red-400" />}
          {result.status === "running" && <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />}
        </div>
      )}
    </div>
  );
}


