"use client";

import { useCallback } from "react";
import { GitBranch, Plus } from "lucide-react";
import { useWorkflowsDStore } from "../../store";
import { StepCard } from "./StepCard";

export function ListView() {
  const { steps, reorderSteps, setActivePanel } = useWorkflowsDStore();

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (sourceIndex !== targetIndex) {
      reorderSteps(sourceIndex, targetIndex);
    }
  }, [reorderSteps]);

  const handleAddStep = () => {
    setActivePanel("tools");
  };

  if (steps.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-4">
          <GitBranch className="h-8 w-8 text-violet-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No steps yet</h3>
        <p className="text-sm text-slate-400 mb-6 max-w-sm text-center">
          Add your first step from the Tools panel on the right, or describe what you want to build in the chat.
        </p>
        <button 
          onClick={handleAddStep}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
        >
          <Plus className="h-4 w-4" />
          Add First Step
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <h3 className="text-sm font-medium text-slate-400">
          {steps.length} {steps.length === 1 ? "Step" : "Steps"}
        </h3>
        <button
          onClick={handleAddStep}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-400 hover:text-white hover:bg-violet-500/10 rounded-lg transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Step
        </button>
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            <StepCard step={step} index={index} />
          </div>
        ))}
        
        {/* Add step button at bottom */}
        <button
          onClick={handleAddStep}
          className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-white/10 hover:border-violet-500/30 rounded-xl text-slate-500 hover:text-violet-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Step
        </button>
      </div>
    </div>
  );
}




