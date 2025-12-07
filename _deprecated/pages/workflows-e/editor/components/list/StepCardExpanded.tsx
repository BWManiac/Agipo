"use client";

import { useWorkflowEditorStore } from "../../store";
import type { WorkflowStep } from "@/app/api/workflows-e/services/types";

interface StepCardExpandedProps {
  step: WorkflowStep;
}

export function StepCardExpanded({ step }: StepCardExpandedProps) {
  const { setSelectedStep } = useWorkflowEditorStore();

  const inputFields = step.inputSchema.properties 
    ? Object.entries(step.inputSchema.properties)
    : [];
  const outputFields = step.outputSchema.properties 
    ? Object.entries(step.outputSchema.properties)
    : [];

  return (
    <div className="bg-[#12121f] rounded-lg border border-indigo-500 shadow-lg shadow-indigo-500/20">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-sm">{step.name}</h3>
          <button
            onClick={() => setSelectedStep(null)}
            className="text-xs text-gray-400 hover:text-white"
          >
            Collapse
          </button>
        </div>

        {/* Input Schema */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-400 mb-2">Input Schema</h4>
          <div className="bg-[#0a0a14] rounded p-3 space-y-1">
            {inputFields.length === 0 ? (
              <p className="text-xs text-gray-500">No inputs</p>
            ) : (
              inputFields.map(([key, schema]: [string, any]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <code className="text-indigo-400">{key}</code>
                  <span className="text-gray-500">{schema.type || "any"}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Output Schema */}
        <div>
          <h4 className="text-xs font-medium text-gray-400 mb-2">Output Schema</h4>
          <div className="bg-[#0a0a14] rounded p-3 space-y-1">
            {outputFields.length === 0 ? (
              <p className="text-xs text-gray-500">No outputs</p>
            ) : (
              outputFields.map(([key, schema]: [string, any]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <code className="text-emerald-400">{key}</code>
                  <span className="text-gray-500">{schema.type || "any"}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


