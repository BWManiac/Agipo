"use client";

import { GitMerge } from "lucide-react";
import { cn } from "@/lib/utils";

interface RailBranchMergeProps {
  isSelected?: boolean;
}

/**
 * Branch merge node.
 * Converges multiple branch lanes back to a single flow.
 * Optional - some workflows don't need explicit merge.
 */
export function RailBranchMerge({ isSelected }: RailBranchMergeProps) {
  return (
    <div
      className={cn(
        "min-w-[120px] rounded-lg border-2 bg-card px-4 py-2 transition-all",
        "flex items-center gap-2",
        isSelected
          ? "border-amber-500 shadow-md"
          : "border-amber-300 hover:border-amber-400"
      )}
    >
      <div className="h-6 w-6 rounded-md bg-amber-100 flex items-center justify-center">
        <GitMerge className="h-3 w-3 text-amber-600" />
      </div>
      <span className="text-xs font-medium text-amber-600">Merge</span>
    </div>
  );
}

