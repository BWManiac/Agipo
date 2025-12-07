"use client";

import { Combine } from "lucide-react";
import type { ParallelConfig } from "@/app/api/workflows/types/execution-flow";
import { cn } from "@/lib/utils";

interface RailParallelJoinProps {
  config?: ParallelConfig;
  isSelected?: boolean;
}

/**
 * Parallel join node.
 * Waits for all parallel lanes to complete.
 */
export function RailParallelJoin({ config, isSelected }: RailParallelJoinProps) {
  const waitForAll = config?.waitForAll ?? true;

  return (
    <div
      className={cn(
        "min-w-[140px] rounded-lg border-2 bg-card transition-all",
        "flex items-center gap-2 px-4 py-2",
        isSelected
          ? "border-cyan-500 shadow-md"
          : "border-cyan-300 hover:border-cyan-400"
      )}
    >
      <div className="h-6 w-6 rounded-md bg-cyan-100 flex items-center justify-center">
        <Combine className="h-3 w-3 text-cyan-600" />
      </div>
      <div>
        <span className="text-xs font-medium text-cyan-600">Join</span>
        <div className="text-[10px] text-cyan-500">
          {waitForAll ? "wait for all" : "first wins"}
        </div>
      </div>
    </div>
  );
}

