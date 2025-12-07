"use client";

import { useWorkflowsBStore } from "../../editor/store";
import { Plus } from "lucide-react";

/**
 * AddStepButton - Trigger to add a new step
 * Based on Variation 3 (lines 209-221)
 */
export function AddStepButton() {
  const openAddStepModal = useWorkflowsBStore(state => state.openAddStepModal);
  const setRightPanelTab = useWorkflowsBStore(state => state.setRightPanelTab);
  
  const handleClick = () => {
    // Open the tools tab in the right panel
    setRightPanelTab("tools");
    // Optionally open a modal
    openAddStepModal();
  };
  
  return (
    <div className="relative flex gap-4">
      <div className="w-16 flex-shrink-0 flex flex-col items-center">
        <button
          onClick={handleClick}
          className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 z-10 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 p-4">
        <p className="text-sm text-gray-400">
          Click to add another step, or select a tool from the right panel
        </p>
      </div>
    </div>
  );
}




