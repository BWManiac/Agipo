"use client";

import { useWorkflowEditorStore } from "../../store";
import { ArrowDown } from "lucide-react";

interface DataFlowIndicatorProps {
  sourceStepId: string;
  targetStepId: string;
}

export function DataFlowIndicator({ sourceStepId, targetStepId }: DataFlowIndicatorProps) {
  const { mappings } = useWorkflowEditorStore();
  
  // Count mappings between these steps
  const mappingCount = mappings.filter(
    (m) => m.sourceStepId === sourceStepId && m.targetStepId === targetStepId
  ).reduce((acc, m) => acc + m.fieldMappings.length, 0);

  function handleClick() {
    // Data mapping modal will be opened in Phase 5
    // For now, just log - full implementation coming in Phase 5
    console.log("Open data mapping modal", { sourceStepId, targetStepId });
  }

  return (
    <div className="relative pl-8 pb-2">
      <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-[#2a2a4a]"></div>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a2e] rounded-full text-xs text-gray-400 hover:text-white hover:bg-[#2a2a4a] transition-colors"
      >
        <ArrowDown className="h-3 w-3" />
        {mappingCount > 0 ? `${mappingCount} fields mapped` : "Connect"}
      </button>
    </div>
  );
}

