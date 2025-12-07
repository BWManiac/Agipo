"use client";

import { useWorkflowEditorStore } from "../../store";
import { StepCard } from "./StepCard";
import { AddStepButton } from "./AddStepButton";
import { EmptyState } from "./EmptyState";

export function StepTimeline() {
  const { steps, selectedStepId, setSelectedStep, removeStep, reorderSteps } = 
    useWorkflowEditorStore();

  // Sort steps by listIndex
  const sortedSteps = [...steps].sort((a, b) => a.listIndex - b.listIndex);

  if (sortedSteps.length === 0) {
    return <EmptyState />;
  }

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderSteps(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < sortedSteps.length - 1) {
      reorderSteps(index, index + 1);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="relative">
        {/* Vertical connector line */}
        {sortedSteps.length > 1 && (
          <div 
            className="absolute left-6 top-14 bottom-14 w-0.5 bg-slate-200"
            style={{ transform: "translateX(-50%)" }}
          />
        )}

        <div className="space-y-4 relative">
          {sortedSteps.map((step, index) => (
            <div key={step.id} className="relative">
              <StepCard
                step={step}
                index={index}
                isSelected={selectedStepId === step.id}
                isFirst={index === 0}
                isLast={index === sortedSteps.length - 1}
                onSelect={() => setSelectedStep(step.id)}
                onDelete={() => removeStep(step.id)}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
              />
              
              {/* Add step button between cards */}
              {index < sortedSteps.length - 1 && (
                <div className="flex justify-center py-2">
                  <AddStepButton insertAfter={step.id} variant="inline" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add step button at the end */}
        <div className="flex justify-center pt-6">
          <AddStepButton variant="bottom" />
        </div>
      </div>
    </div>
  );
}




