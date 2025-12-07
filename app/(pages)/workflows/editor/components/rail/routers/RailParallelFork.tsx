"use client";

import { Zap } from "lucide-react";
import type { WorkflowStep } from "@/app/api/workflows/types";
import type { ParallelConfig } from "@/app/api/workflows/types/execution-flow";
import { cn } from "@/lib/utils";

interface RailParallelForkProps {
  step: WorkflowStep;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Parallel fork node.
 * Splits workflow into concurrent lanes.
 */
export function RailParallelFork({ step, isSelected, onClick }: RailParallelForkProps) {
  const config = step.controlConfig as ParallelConfig | undefined;
  const lanes = config?.lanes || [];

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "min-w-[160px] rounded-lg border-2 bg-card transition-all",
        "flex items-center gap-2 px-4 py-2",
        isSelected
          ? "border-cyan-500 shadow-md ring-2 ring-cyan-500/20"
          : "border-cyan-300 hover:border-cyan-400 hover:shadow-sm"
      )}
    >
      <div className="h-7 w-7 rounded-md bg-cyan-100 flex items-center justify-center">
        <Zap className="h-4 w-4 text-cyan-600" />
      </div>
      <div>
        <div className="font-semibold text-sm text-foreground">Fork</div>
        <div className="text-xs text-cyan-600">
          {lanes.length} parallel branches
        </div>
      </div>
    </div>
  );
}

