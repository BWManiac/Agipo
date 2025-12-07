"use client";

import { Pause } from "lucide-react";
import type { WorkflowStep } from "@/app/api/workflows/types";
import type { SuspendConfig } from "@/app/api/workflows/types/execution-flow";
import { cn } from "@/lib/utils";

interface RailSuspendProps {
  step: WorkflowStep;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Suspend step component.
 * Rose-themed human-in-the-loop step.
 */
export function RailSuspend({ step, isSelected, onClick }: RailSuspendProps) {
  const config = step.controlConfig as SuspendConfig | undefined;
  const message = config?.message || "Awaiting human approval";

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={cn(
          "min-w-[200px] max-w-[280px] rounded-lg border-2 bg-card text-left transition-all",
          isSelected
            ? "border-rose-500 shadow-md ring-2 ring-rose-500/20"
            : "border-rose-300 hover:border-rose-400 hover:shadow-sm"
        )}
      >
        <div className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-rose-100 flex items-center justify-center">
              <Pause className="h-4 w-4 text-rose-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-foreground">Suspend</div>
              <div className="text-xs text-rose-600 truncate">{message}</div>
            </div>
          </div>
        </div>
      </button>

      {/* Pause indicator */}
      <div className="mt-2 px-4 py-1.5 border-2 border-dashed border-rose-400 rounded-lg">
        <div className="flex items-center gap-1.5">
          <Pause className="h-3 w-3 text-rose-500" />
          <span className="text-xs text-rose-500">Workflow paused</span>
        </div>
      </div>
    </div>
  );
}

