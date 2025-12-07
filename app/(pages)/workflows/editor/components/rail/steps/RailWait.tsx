"use client";

import { Clock } from "lucide-react";
import type { WorkflowStep } from "@/app/api/workflows/types";
import type { WaitConfig } from "@/app/api/workflows/types/execution-flow";
import { cn } from "@/lib/utils";

interface RailWaitProps {
  step: WorkflowStep;
  isSelected: boolean;
  onClick: () => void;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m`;
  return `${Math.floor(ms / 3600000)}h`;
}

/**
 * Wait step component.
 * Teal-themed timer step for pausing workflow.
 */
export function RailWait({ step, isSelected, onClick }: RailWaitProps) {
  const config = step.controlConfig as WaitConfig | undefined;
  const waitType = config?.type || "duration";
  const durationMs = config?.durationMs || 5000;
  const untilTime = config?.untilTime;

  const displayText = waitType === "duration"
    ? `Wait ${formatDuration(durationMs)}`
    : `Until ${untilTime ? new Date(untilTime).toLocaleTimeString() : "..."}`;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "min-w-[200px] max-w-[280px] rounded-lg border-2 bg-card text-left transition-all",
        isSelected
          ? "border-teal-500 shadow-md ring-2 ring-teal-500/20"
          : "border-teal-300 hover:border-teal-400 hover:shadow-sm"
      )}
    >
      <div className="p-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-teal-100 flex items-center justify-center">
            <Clock className="h-4 w-4 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-foreground">Wait</div>
            <div className="text-xs text-teal-600 truncate">{displayText}</div>
          </div>
        </div>
      </div>
    </button>
  );
}

