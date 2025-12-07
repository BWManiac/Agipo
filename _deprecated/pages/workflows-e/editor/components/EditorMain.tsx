"use client";

import { cn } from "@/lib/utils";
import { useWorkflowEditorStore } from "../store";
import { StepTimeline } from "./list/StepTimeline";

interface EditorMainProps {
  className?: string;
}

export function EditorMain({ className }: EditorMainProps) {
  const { abstractionLevel } = useWorkflowEditorStore();

  return (
    <main className={cn("flex-1 bg-[#0a0a14] overflow-hidden", className)}>
      {abstractionLevel === "code" ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Code view coming in Phase 11</p>
          </div>
        </div>
      ) : abstractionLevel === "spec" ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Spec view coming in Phase 11</p>
          </div>
        </div>
      ) : (
        <div className="h-full overflow-auto">
          <StepTimeline />
        </div>
      )}
    </main>
  );
}

