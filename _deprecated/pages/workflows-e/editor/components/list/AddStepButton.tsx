"use client";

import { Plus } from "lucide-react";
import { useWorkflowEditorStore } from "../../store";

export function AddStepButton() {
  const { setActiveSettingsTab } = useWorkflowEditorStore();

  function handleClick() {
    // Switch to Tools tab to add a step
    setActiveSettingsTab("tools");
  }

  return (
    <button
      onClick={handleClick}
      className="w-full border-2 border-dashed border-[#1a1a2e] rounded-lg p-6 text-center hover:border-indigo-500/50 hover:bg-[#12121f] transition-colors"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="p-2 rounded-lg bg-[#1a1a2e]">
          <Plus className="h-5 w-5 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-400">Add Step</p>
        <p className="text-xs text-gray-500">Click to browse tools</p>
      </div>
    </button>
  );
}


