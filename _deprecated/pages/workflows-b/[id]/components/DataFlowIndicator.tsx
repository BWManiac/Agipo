"use client";

import type { WorkflowStep } from "@/_tables/workflows-b/types";
import { ArrowDown } from "lucide-react";

interface DataFlowIndicatorProps {
  fromStep: WorkflowStep;
}

/**
 * DataFlowIndicator - Shows data being passed between steps
 * Based on Variation 3 (lines 165-173)
 */
export function DataFlowIndicator({ fromStep }: DataFlowIndicatorProps) {
  const outputs = fromStep.outputSchema.fields;
  
  if (outputs.length === 0) return null;
  
  // Get the field names being passed
  const fieldNames = outputs.map(f => f.name).slice(0, 3);
  const remaining = outputs.length - 3;
  
  return (
    <div className="relative flex gap-4 mb-4 ml-16 pl-4">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <ArrowDown className="w-4 h-4" />
        <span>
          {fieldNames.join(", ")}
          {remaining > 0 && ` +${remaining} more`}
        </span>
      </div>
    </div>
  );
}




