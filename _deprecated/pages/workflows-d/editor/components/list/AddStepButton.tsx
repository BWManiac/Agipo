"use client";

import { Plus } from "lucide-react";
import { useWorkflowsDStore } from "../../store";

interface AddStepButtonProps {
  variant?: "primary" | "dashed";
}

export function AddStepButton({ variant = "primary" }: AddStepButtonProps) {
  const { setActivePanel } = useWorkflowsDStore();

  const handleClick = () => {
    setActivePanel("tools");
  };

  if (variant === "dashed") {
    return (
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-white/10 hover:border-violet-500/30 rounded-xl text-slate-500 hover:text-violet-400 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Step
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
    >
      <Plus className="h-4 w-4" />
      Add Step
    </button>
  );
}




