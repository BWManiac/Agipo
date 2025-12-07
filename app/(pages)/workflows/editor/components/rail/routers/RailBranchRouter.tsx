"use client";

import { GitBranch } from "lucide-react";
import type { WorkflowStep } from "@/app/api/workflows/types";
import type { BranchConfig } from "@/app/api/workflows/types/execution-flow";
import { cn } from "@/lib/utils";

interface RailBranchRouterProps {
  step: WorkflowStep;
  isSelected: boolean;
  onClick: () => void;
}

// Color mapping for conditions
const conditionColors = [
  { dot: "bg-green-500", text: "text-green-600", bg: "bg-green-50" },
  { dot: "bg-blue-500", text: "text-blue-600", bg: "bg-blue-50" },
  { dot: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50" },
  { dot: "bg-purple-500", text: "text-purple-600", bg: "bg-purple-50" },
  { dot: "bg-cyan-500", text: "text-cyan-600", bg: "bg-cyan-50" },
];

/**
 * Branch router node.
 * Shows conditions with colored dots.
 * Part of RailBranchGroup.
 */
export function RailBranchRouter({ step, isSelected, onClick }: RailBranchRouterProps) {
  const config = step.controlConfig as BranchConfig | undefined;
  const conditions = config?.conditions || [];
  const hasElse = config?.hasElse ?? true;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "min-w-[200px] max-w-[280px] rounded-lg border-2 bg-card transition-all",
        isSelected
          ? "border-amber-500 shadow-md ring-2 ring-amber-500/20"
          : "border-amber-300 hover:border-amber-400 hover:shadow-sm"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-amber-200">
        <div className="h-7 w-7 rounded-md bg-amber-100 flex items-center justify-center">
          <GitBranch className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <div className="font-semibold text-sm text-foreground">Branch</div>
          <div className="text-xs text-amber-600">
            {conditions.length + (hasElse ? 1 : 0)} paths
          </div>
        </div>
      </div>

      {/* Conditions */}
      <div className="p-2 space-y-1.5">
        {conditions.map((condition, index) => {
          const color = conditionColors[index % conditionColors.length];
          return (
            <div
              key={condition.id}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm",
                color.bg
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", color.dot)} />
              <code className={cn("text-xs truncate", color.text)}>
                {condition.expression || condition.label}
              </code>
            </div>
          );
        })}
        {hasElse && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-slate-100 text-sm">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-xs text-slate-600 italic">else</span>
          </div>
        )}
      </div>
    </div>
  );
}

