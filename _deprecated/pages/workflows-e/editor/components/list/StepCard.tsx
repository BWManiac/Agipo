"use client";

import { useWorkflowEditorStore } from "../../store";
import type { WorkflowStep } from "@/app/api/workflows-e/services/types";
import { StepCardExpanded } from "./StepCardExpanded";

interface StepCardProps {
  step: WorkflowStep;
}

export function StepCard({ step }: StepCardProps) {
  const { selectedStepId, setSelectedStep } = useWorkflowEditorStore();
  const isExpanded = selectedStepId === step.id;
  const isSelected = selectedStepId === step.id;

  function handleClick() {
    if (isSelected) {
      setSelectedStep(null);
    } else {
      setSelectedStep(step.id);
    }
  }

  // Get input/output count
  const inputCount = step.inputSchema.properties 
    ? Object.keys(step.inputSchema.properties).length 
    : 0;
  const outputCount = step.outputSchema.properties 
    ? Object.keys(step.outputSchema.properties).length 
    : 0;

  // Get step type icon
  const getStepIcon = () => {
    if (step.type === "composio") return "🔥";
    if (step.type === "custom") return "💻";
    return "⚙️";
  };

  if (isExpanded) {
    return <StepCardExpanded step={step} />;
  }

  return (
    <div
      onClick={handleClick}
      className={`
        bg-[#12121f] rounded-lg border transition-all cursor-pointer
        ${isSelected 
          ? "border-indigo-500 shadow-lg shadow-indigo-500/20" 
          : "border-[#1a1a2e] hover:border-indigo-500/50"
        }
      `}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getStepIcon()}</span>
            <h3 className="font-semibold text-white text-sm">{step.name}</h3>
          </div>
          {step.toolkitSlug && (
            <span className="px-2 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded">
              {step.toolkitName || step.toolkitSlug}
            </span>
          )}
        </div>
        
        {step.description && (
          <p className="text-sm text-gray-400 mb-3">{step.description}</p>
        )}
        
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>
            Input: <code className="text-indigo-400">{inputCount} fields</code>
          </span>
          <span>
            Output: <code className="text-emerald-400">{outputCount} fields</code>
          </span>
        </div>
      </div>
    </div>
  );
}


