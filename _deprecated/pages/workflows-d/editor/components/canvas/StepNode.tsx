"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Code, Database, TableProperties, Workflow } from "lucide-react";
import type { WorkflowStep } from "@/app/api/workflows-d/services/types";
import { useWorkflowsDStore } from "../../store";

interface StepNodeData {
  step: WorkflowStep;
}

function StepNodeComponent({ data, selected }: NodeProps<StepNodeData>) {
  const { step } = data;
  const { selectedStepId } = useWorkflowsDStore();
  const isSelected = selected || selectedStepId === step.id;

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
      className={`min-w-[200px] max-w-[280px] bg-slate-800/90 backdrop-blur-sm border rounded-xl transition-all ${
        isSelected
          ? "border-violet-500/50 ring-2 ring-violet-500/20 shadow-lg shadow-violet-500/10"
          : "border-white/10 hover:border-violet-500/30"
      }`}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-violet-500 !border-2 !border-slate-800"
      />

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Step number badge */}
          <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/20 text-sm font-medium text-violet-400">
            {step.listIndex + 1}
          </div>

          {/* Tool icon */}
          <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-slate-700/50 border border-white/5 flex items-center justify-center">
            {getStepIcon()}
          </div>

          {/* Step info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white text-sm truncate">
              {step.name}
            </h4>
            <p className="text-xs text-slate-400 truncate">
              {getStepTypeLabel()}
            </p>
          </div>
        </div>

        {/* Schema preview */}
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex gap-4 text-xs">
            <div className="flex-1">
              <span className="text-slate-500">In:</span>
              <span className="ml-1 text-slate-300">
                {Object.keys(step.inputSchema.properties || {}).length} fields
              </span>
            </div>
            <div className="flex-1">
              <span className="text-slate-500">Out:</span>
              <span className="ml-1 text-slate-300">
                {Object.keys(step.outputSchema.properties || {}).length} fields
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-violet-500 !border-2 !border-slate-800"
      />
    </div>
  );
}

export const StepNode = memo(StepNodeComponent);
