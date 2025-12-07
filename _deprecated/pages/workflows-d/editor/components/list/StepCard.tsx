"use client";

import { useState } from "react";
import { 
  ChevronDown, 
  ChevronRight, 
  GripVertical, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  Code,
  Database,
  TableProperties,
  Workflow,
  Link2
} from "lucide-react";
import { useWorkflowsDStore } from "../../store";
import type { WorkflowStep } from "@/app/api/workflows-d/services/types";
import { StepCardExpanded } from "./StepCardExpanded";
import { DataFlowIndicator } from "./DataFlowIndicator";
import { MappingEditor } from "../mapping/MappingEditor";

interface StepCardProps {
  step: WorkflowStep;
  index: number;
}

export function StepCard({ step, index }: StepCardProps) {
  const { 
    selectedStepId, 
    setSelectedStep, 
    removeStep, 
    reorderSteps, 
    steps,
    getMappingsForStep
  } = useWorkflowsDStore();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMappingEditor, setShowMappingEditor] = useState(false);
  const isSelected = selectedStepId === step.id;
  const mappings = getMappingsForStep(step.id);

  const handleSelect = () => {
    setSelectedStep(isSelected ? null : step.id);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this step?")) {
      removeStep(step.id);
    }
  };

  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (index > 0) {
      reorderSteps(index, index - 1);
    }
  };

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (index < steps.length - 1) {
      reorderSteps(index, index + 1);
    }
  };

  const handleConfigureMapping = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMappingEditor(true);
  };

  const getStepIcon = () => {
    switch (step.type) {
      case "custom":
        return <Code className="h-5 w-5 text-amber-400" />;
      case "query_table":
        return <Database className="h-5 w-5 text-emerald-400" />;
      case "write_table":
        return <TableProperties className="h-5 w-5 text-blue-400" />;
      case "control":
        return <Workflow className="h-5 w-5 text-purple-400" />;
      default:
        if (step.toolkitLogo) {
          return (
            <img 
              src={step.toolkitLogo} 
              alt={step.toolkitName || ""} 
              className="h-5 w-5 rounded"
            />
          );
        }
        return (
          <div className="h-5 w-5 rounded bg-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-400">
            {(step.toolkitName || step.name).charAt(0).toUpperCase()}
          </div>
        );
    }
  };

  const getStepTypeLabel = () => {
    switch (step.type) {
      case "custom":
        return "Custom Code";
      case "query_table":
        return "Query Table";
      case "write_table":
        return "Write Table";
      case "control":
        return step.controlType || "Control";
      default:
        return step.toolkitName || step.toolId || "Composio";
    }
  };

  return (
    <div
      onClick={handleSelect}
      className={`group relative bg-slate-800/30 border rounded-xl transition-all cursor-pointer ${
        isSelected
          ? "border-violet-500/50 bg-slate-800/50 ring-1 ring-violet-500/20"
          : "border-white/5 hover:border-violet-500/30 hover:bg-slate-800/50"
      }`}
    >
      {/* Main content */}
      <div className="flex items-center gap-3 p-4">
        {/* Drag handle */}
        <div className="flex-shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-slate-500" />
        </div>

        {/* Step number */}
        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/20 text-sm font-medium text-violet-400">
          {index + 1}
        </div>

        {/* Tool icon */}
        <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-slate-800/50 border border-white/5 flex items-center justify-center">
          {getStepIcon()}
        </div>

        {/* Step info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white truncate">
            {step.name}
          </h4>
          <p className="text-xs text-slate-400 truncate">
            {getStepTypeLabel()}
          </p>
        </div>

        {/* Data flow indicator */}
        {mappings.length > 0 && (
          <DataFlowIndicator mappings={mappings} />
        )}

        {/* Expand button */}
        <button
          onClick={handleToggleExpand}
          className="flex-shrink-0 p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {index > 0 && (
            <button
              onClick={handleConfigureMapping}
              className="p-1.5 text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
              title="Configure data mapping"
            >
              <Link2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleMoveUp}
            disabled={index === 0}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move up"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            onClick={handleMoveDown}
            disabled={index === steps.length - 1}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move down"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete step"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <StepCardExpanded step={step} />
      )}

      {/* Mapping Editor Modal */}
      {showMappingEditor && (
        <MappingEditor 
          targetStep={step} 
          onClose={() => setShowMappingEditor(false)} 
        />
      )}
    </div>
  );
}

