"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useWorkflowEditorStore } from "../store";
import { StepInspector } from "./inspector";

interface EditorInspectorProps {
  className?: string;
}

export function EditorInspector({ className }: EditorInspectorProps) {
  const { selectedStepId, isInspectorCollapsed, toggleInspector } = useWorkflowEditorStore();

  if (isInspectorCollapsed) {
    return (
      <div className={cn("w-12 border-l bg-white flex flex-col", className)}>
        <Button variant="ghost" size="icon" className="m-2" onClick={toggleInspector}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside className={cn("w-80 border-l bg-white flex flex-col", className)}>
      <div className="flex items-center justify-between p-3 border-b">
        <span className="text-sm font-medium">{selectedStepId ? "Step Details" : "Inspector"}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleInspector}>
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <StepInspector />
      </div>
    </aside>
  );
}

