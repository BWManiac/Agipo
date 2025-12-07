"use client";

import { useWorkflowEditorStore } from "../../store";
import { StepCard } from "./StepCard";
import { DataFlowIndicator } from "./DataFlowIndicator";
import { AddStepButton } from "./AddStepButton";

export function StepTimeline() {
  const { steps } = useWorkflowEditorStore();
  const sortedSteps = [...steps].sort((a, b) => a.listIndex - b.listIndex);
  
  if (steps.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm mb-2">No steps yet</p>
          <p className="text-gray-500 text-xs mb-4">Add your first step to get started</p>
          <AddStepButton />
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      {sortedSteps.map((step, index) => (
        <div key={step.id} className="mb-4">
          <StepCard step={step} />
          {index < sortedSteps.length - 1 && (
            <DataFlowIndicator 
              sourceStepId={step.id}
              targetStepId={sortedSteps[index + 1].id}
            />
          )}
        </div>
      ))}
      <AddStepButton />
    </div>
  );
}


