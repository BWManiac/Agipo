"use client";

import { useState } from "react";
import { Play, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { useWorkflowEditorStore } from "../store";

interface StepResult {
  stepId: string;
  status: "pending" | "running" | "success" | "error";
  output?: unknown;
  error?: string;
  duration?: number;
}

export function TestPanel() {
  const { workflow, steps, runtimeInputs, connections } = useWorkflowEditorStore();
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [stepResults, setStepResults] = useState<StepResult[]>([]);

  // Check if all connections are set
  const requiredToolkits = [...new Set(
    steps
      .filter((s) => s.type === "composio" && s.toolkitSlug)
      .map((s) => s.toolkitSlug!)
  )];
  const missingConnections = requiredToolkits.filter(
    (t) => connections[t] === null || connections[t] === undefined
  );

  async function handleRunTest() {
    if (!workflow || steps.length === 0) return;

    setIsRunning(true);
    setStepResults(steps.map((s) => ({ stepId: s.id, status: "pending" })));

    // Simulate test execution (would be real API call in production)
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      setStepResults((prev) =>
        prev.map((r) =>
          r.stepId === step.id ? { ...r, status: "running" } : r
        )
      );

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 500));

      // Simulate result (90% success rate for demo)
      const success = Math.random() > 0.1;
      setStepResults((prev) =>
        prev.map((r) =>
          r.stepId === step.id
            ? {
                ...r,
                status: success ? "success" : "error",
                duration: 1000 + Math.random() * 500,
                output: success ? { data: { result: "Sample output" } } : undefined,
                error: success ? undefined : "Simulated error for testing",
              }
            : r
        )
      );

      if (!success) break;
    }

    setIsRunning(false);
  }

  const sortedSteps = [...steps].sort((a, b) => a.listIndex - b.listIndex);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-sm font-medium text-white mb-1">Test Workflow</h3>
        <p className="text-xs text-slate-500">
          Run a test with sample inputs
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Warnings */}
        {missingConnections.length > 0 && (
          <div className="m-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Missing Connections</span>
            </div>
            <p className="text-xs text-amber-300/70">
              Connect: {missingConnections.join(", ")}
            </p>
          </div>
        )}

        {/* Runtime Inputs */}
        {runtimeInputs.length > 0 && (
          <div className="p-4 border-b border-slate-700">
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
              Test Inputs
            </h4>
            <div className="space-y-3">
              {runtimeInputs.map((input) => (
                <div key={input.key}>
                  <label className="block text-sm text-slate-300 mb-1">
                    {input.key}
                    {input.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    value={inputValues[input.key] || ""}
                    onChange={(e) =>
                      setInputValues({ ...inputValues, [input.key]: e.target.value })
                    }
                    placeholder={input.description || `Enter ${input.key}`}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step Results */}
        {stepResults.length > 0 && (
          <div className="p-4 border-b border-slate-700">
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
              Execution Progress
            </h4>
            <div className="space-y-2">
              {sortedSteps.map((step, index) => {
                const result = stepResults.find((r) => r.stepId === step.id);
                return (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg"
                  >
                    <div className="w-6 h-6 flex items-center justify-center">
                      {result?.status === "pending" && (
                        <div className="w-3 h-3 bg-slate-600 rounded-full" />
                      )}
                      {result?.status === "running" && (
                        <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                      )}
                      {result?.status === "success" && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                      {result?.status === "error" && (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white">{step.name}</div>
                      {result?.duration && (
                        <div className="text-xs text-slate-500">
                          {result.duration.toFixed(0)}ms
                        </div>
                      )}
                      {result?.error && (
                        <div className="text-xs text-red-400 mt-1">{result.error}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Run Button */}
        <div className="p-4">
          <button
            onClick={handleRunTest}
            disabled={isRunning || steps.length === 0 || missingConnections.length > 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          {steps.length === 0 && (
            <p className="text-xs text-slate-500 text-center mt-2">
              Add steps to test the workflow
            </p>
          )}
        </div>
      </div>
    </div>
  );
}




