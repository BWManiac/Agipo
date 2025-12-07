"use client";

import { useMemo } from "react";
import { useWorkflowsDStore } from "../../store";
import type { WorkflowStep } from "@/app/api/workflows-d/services/types";

interface SourcePickerProps {
  targetStepId: string;
  selectedSourceId: string;
  onSelect: (sourceId: string) => void;
}

export function SourcePicker({ targetStepId, selectedSourceId, onSelect }: SourcePickerProps) {
  const { steps, workflow } = useWorkflowsDStore();

  // Get available source steps (all steps before target in execution order)
  const sourceSteps = useMemo(() => {
    const targetIndex = steps.findIndex((s) => s.id === targetStepId);
    return steps.slice(0, targetIndex);
  }, [steps, targetStepId]);

  return (
    <div className="space-y-2">
      {/* Workflow input option */}
      <button
        onClick={() => onSelect("__input__")}
        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
          selectedSourceId === "__input__"
            ? "bg-violet-500/10 border-violet-500/30"
            : "bg-slate-800/30 border-white/5 hover:border-violet-500/30"
        }`}
      >
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/20">
          <span className="text-xs font-medium text-violet-400">IN</span>
        </div>
        <div className="flex-1 text-left">
          <h4 className="text-sm font-medium text-white">Workflow Input</h4>
          <p className="text-xs text-slate-400">Data provided when workflow runs</p>
        </div>
      </button>

      {/* Previous steps */}
      {sourceSteps.map((step) => (
        <button
          key={step.id}
          onClick={() => onSelect(step.id)}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
            selectedSourceId === step.id
              ? "bg-violet-500/10 border-violet-500/30"
              : "bg-slate-800/30 border-white/5 hover:border-violet-500/30"
          }`}
        >
          <div className="h-8 w-8 rounded-lg bg-slate-700/50 flex items-center justify-center border border-white/5">
            <span className="text-xs font-medium text-slate-300">{step.listIndex + 1}</span>
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-sm font-medium text-white">{step.name}</h4>
            <p className="text-xs text-slate-400">{step.toolkitName || step.type}</p>
          </div>
        </button>
      ))}

      {sourceSteps.length === 0 && (
        <p className="text-xs text-slate-500 text-center py-2">
          This is the first step. Only workflow inputs are available.
        </p>
      )}
    </div>
  );
}




