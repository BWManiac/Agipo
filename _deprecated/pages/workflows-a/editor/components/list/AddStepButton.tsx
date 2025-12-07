"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflowEditorStore } from "../../store";

interface AddStepButtonProps {
  insertAfter?: string;
  variant?: "inline" | "bottom";
}

export function AddStepButton({ variant = "bottom" }: AddStepButtonProps) {
  const { setActivePanel } = useWorkflowEditorStore();

  const handleClick = () => {
    // Open the tool palette to add a step
    setActivePanel("palette");
  };

  if (variant === "inline") {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "group flex items-center justify-center",
          "w-8 h-8 rounded-full border-2 border-dashed border-slate-300",
          "text-slate-400 hover:border-primary hover:text-primary",
          "transition-all hover:scale-110"
        )}
      >
        <Plus className="h-4 w-4" />
      </button>
    );
  }

  return (
    <Button variant="outline" onClick={handleClick}>
      <Plus className="h-4 w-4 mr-2" />
      Add Step
    </Button>
  );
}




