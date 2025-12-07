"use client";

import { useWorkflowEditorStore } from "../store";

export function WorkflowOverview() {
  const { workflow, runtimeInputs, connections, steps } = useWorkflowEditorStore();

  // Get unique toolkits from steps
  const requiredToolkits = [...new Set(
    steps
      .filter((s) => s.type === "composio" && s.toolkitSlug)
      .map((s) => s.toolkitSlug!)
  )];

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Workflow Overview</h2>
          <p className="text-sm text-slate-400">
            {workflow?.description || "No description"}
          </p>
        </div>
      </div>

      {/* Requirements Bar */}
      <div className="mt-4 pt-4 border-t border-slate-700 flex flex-wrap items-center gap-4">
        {/* Inputs */}
        {runtimeInputs.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase font-medium">Inputs:</span>
            {runtimeInputs.map((input) => (
              <span
                key={input.key}
                className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-medium rounded font-mono"
              >
                ${input.key}
              </span>
            ))}
          </div>
        )}

        {/* Required Connections */}
        {requiredToolkits.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase font-medium">Requires:</span>
            {requiredToolkits.map((toolkit) => {
              const isConnected = connections[toolkit] !== null && connections[toolkit] !== undefined;
              return (
                <span
                  key={toolkit}
                  className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded capitalize ${
                    isConnected
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isConnected ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />
                  {toolkit}
                </span>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {runtimeInputs.length === 0 && requiredToolkits.length === 0 && (
          <span className="text-xs text-slate-500">
            Add steps to see requirements
          </span>
        )}
      </div>
    </div>
  );
}




