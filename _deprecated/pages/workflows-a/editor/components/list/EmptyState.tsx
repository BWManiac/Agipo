"use client";

import { Button } from "@/components/ui/button";
import { GitBranch, Plus } from "lucide-react";
import { useWorkflowEditorStore } from "../../store";

export function EmptyState() {
  const { setActivePanel } = useWorkflowEditorStore();

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <GitBranch className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No steps yet</h3>
      <p className="text-slate-500 text-center mb-6 max-w-sm">
        Add your first step from the Tool Palette to start building your workflow.
      </p>
      <Button onClick={() => setActivePanel("palette")}>
        <Plus className="h-4 w-4 mr-2" />
        Add First Step
      </Button>
    </div>
  );
}




