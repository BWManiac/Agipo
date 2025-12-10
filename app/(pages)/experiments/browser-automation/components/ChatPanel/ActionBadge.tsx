"use client";

import type { AgentStep } from "../../store";
import { cn } from "@/lib/utils";
import { Loader2, Check, X } from "lucide-react";

interface ActionBadgeProps {
  step: AgentStep;
}

const STATUS_COLORS = {
  running: "bg-blue-100 text-blue-700 border-blue-200",
  success: "bg-green-100 text-green-700 border-green-200",
  error: "bg-red-100 text-red-700 border-red-200",
};

export function ActionBadge({ step }: ActionBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium",
        STATUS_COLORS[step.status]
      )}
    >
      {/* Status icon */}
      {step.status === "running" && (
        <Loader2 className="h-3 w-3 animate-spin" />
      )}
      {step.status === "success" && <Check className="h-3 w-3" />}
      {step.status === "error" && <X className="h-3 w-3" />}

      {/* Description */}
      <span className="truncate max-w-[150px]">{step.description}</span>

      {/* Duration */}
      {step.duration && step.status === "success" && (
        <span className="opacity-70">
          {step.duration < 1000
            ? `${step.duration}ms`
            : `${(step.duration / 1000).toFixed(1)}s`}
        </span>
      )}
    </div>
  );
}
