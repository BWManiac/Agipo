"use client";

import { cn } from "@/lib/utils";
import { useWorkflowEditorStore } from "../store";
import { StepTimeline, EmptyState } from "./list";
import { WorkflowCanvas } from "./canvas";

interface EditorMainProps {
  className?: string;
}

export function EditorMain({ className }: EditorMainProps) {
  const { steps, viewMode } = useWorkflowEditorStore();

  return (
    <main className={cn("flex-1 bg-slate-100 overflow-hidden", className)}>
      {steps.length === 0 ? (
        <EmptyState />
      ) : viewMode === "canvas" ? (
        <WorkflowCanvas />
      ) : (
        <div className="h-full overflow-auto">
          <StepTimeline />
        </div>
      )}
    </main>
  );
}

