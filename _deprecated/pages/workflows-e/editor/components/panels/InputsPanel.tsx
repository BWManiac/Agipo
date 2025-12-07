"use client";

import { useWorkflowEditorStore } from "../../store";

export function InputsPanel() {
  const { runtimeInputs } = useWorkflowEditorStore();

  return (
    <div className="p-4">
      <p className="text-xs text-gray-500 mb-4">
        Define inputs users provide when running this workflow.
      </p>
      {runtimeInputs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400 mb-2">No runtime inputs defined</p>
          <p className="text-xs text-gray-500">Add inputs to configure workflow parameters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {runtimeInputs.map((input) => (
            <div key={input.key} className="p-3 bg-[#12121f] rounded border border-[#1a1a2e]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">{input.label}</p>
                  <p className="text-xs text-gray-400">{input.key} ({input.type})</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-4">Full inputs editor coming in Phase 6</p>
    </div>
  );
}


