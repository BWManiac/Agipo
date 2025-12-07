"use client";

import { useWorkflowEditorStore } from "../../store";

export function TestPanel() {
  const { executionStatus, stepResults } = useWorkflowEditorStore();

  return (
    <div className="p-4">
      <p className="text-xs text-gray-500 mb-4">
        Test your workflow with sample inputs.
      </p>
      <div className="text-center py-8">
        <p className="text-sm text-gray-400 mb-2">Test execution coming in Phase 8</p>
        <p className="text-xs text-gray-500">Run workflows and see step-by-step results</p>
      </div>
      {stepResults.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-gray-400">Execution Status: {executionStatus}</p>
          {stepResults.map((result) => (
            <div key={result.stepId} className="p-2 bg-[#12121f] rounded text-xs">
              <p className="text-white">Step: {result.stepId}</p>
              <p className={`text-${result.status === "success" ? "green" : result.status === "error" ? "red" : "gray"}-400`}>
                {result.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


