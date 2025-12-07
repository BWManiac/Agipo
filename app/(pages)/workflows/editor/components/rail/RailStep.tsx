"use client";

import type { WorkflowStep } from "@/app/api/workflows/types";

interface RailStepProps {
  step: WorkflowStep;
  isSelected: boolean;
  onClick: () => void;
}

export function RailStep({ step, isSelected, onClick }: RailStepProps) {
  return (
    <button
      onClick={onClick}
      className={`min-w-[200px] max-w-[280px] rounded-lg border-2 bg-card text-left transition-all ${
        isSelected
          ? "border-primary shadow-md ring-2 ring-primary/20"
          : "border-border hover:border-primary/50 hover:shadow-sm"
      }`}
    >
      <div className="p-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {step.toolkitSlug?.slice(0, 2).toUpperCase() || "ST"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-foreground truncate">
              {step.name || "Untitled Step"}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {step.toolkitName || step.type}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

