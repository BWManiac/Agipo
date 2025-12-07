"use client";

import { useWorkflowEditorStore } from "../../store";
import { ArrowLeftRight } from "lucide-react";

interface DataFlowIndicatorProps {
  stepId: string;
}

export function DataFlowIndicator({ stepId }: DataFlowIndicatorProps) {
  const { mappings, steps } = useWorkflowEditorStore();

  // Find mappings that target this step
  const incomingMappings = mappings.filter((m) => m.targetStepId === stepId);

  if (incomingMappings.length === 0) {
    return null;
  }

  // Get source step names
  const sourceSteps = incomingMappings
    .map((m) => {
      if (m.sourceStepId === "__input__") {
        return "Workflow Input";
      }
      const sourceStep = steps.find((s) => s.id === m.sourceStepId);
      return sourceStep?.name || "Unknown";
    })
    .filter((name, index, arr) => arr.indexOf(name) === index); // Unique names

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <ArrowLeftRight className="h-3 w-3" />
      <span className="truncate max-w-[120px]">
        {sourceSteps.length === 1 
          ? `From: ${sourceSteps[0]}`
          : `From: ${sourceSteps.length} sources`
        }
      </span>
    </div>
  );
}




