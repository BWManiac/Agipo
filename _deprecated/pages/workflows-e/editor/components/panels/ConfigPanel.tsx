"use client";

import { useWorkflowEditorStore } from "../../store";

export function ConfigPanel() {
  const { configs } = useWorkflowEditorStore();

  return (
    <div className="p-4">
      <p className="text-xs text-gray-500 mb-4">
        Define workflow-level configuration values.
      </p>
      {configs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400 mb-2">No configs defined</p>
          <p className="text-xs text-gray-500">Add configs to set workflow parameters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => (
            <div key={config.key} className="p-3 bg-[#12121f] rounded border border-[#1a1a2e]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">{config.label}</p>
                  <p className="text-xs text-gray-400">{config.key} ({config.type})</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-4">Full configs editor coming in Phase 6</p>
    </div>
  );
}


