"use client";

import { cn } from "@/lib/utils";
import { useWorkflowEditorStore } from "../../store";

export function DirtyIndicator() {
  const { isDirty } = useWorkflowEditorStore();

  if (!isDirty) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs text-amber-600",
        "animate-in fade-in duration-200"
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Unsaved
    </span>
  );
}


