"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Code, Plug, Database, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowStep } from "@/app/api/workflows/services/types";

type StepNodeData = WorkflowStep;

export const StepNode = memo(function StepNode({
  data,
  selected,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: NodeProps<any> & { data: StepNodeData }) {
  const step = data;

  return (
    <div
      className={cn(
        "bg-white rounded-lg border-2 shadow-sm min-w-[200px]",
        "transition-all duration-150",
        selected ? "border-primary shadow-md" : "border-slate-200 hover:border-slate-300"
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-slate-400 !border-2 !border-white !w-3 !h-3"
      />

      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b">
        <div className={cn("h-8 w-8 rounded flex items-center justify-center", getStepIconBg(step.type))}>
          <StepIcon type={step.type} className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{step.name}</div>
          <div className="text-xs text-slate-500 truncate">
            {step.toolkitName || step.type}
          </div>
        </div>
      </div>

      {/* I/O Summary */}
      <div className="p-2 text-xs">
        <div className="flex items-center justify-between text-slate-500">
          <span>
            {Object.keys(step.inputSchema.properties || {}).length} inputs
          </span>
          <span>
            {Object.keys(step.outputSchema.properties || {}).length} outputs
          </span>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !border-2 !border-white !w-3 !h-3"
      />
    </div>
  );
});

function getStepIconBg(type: WorkflowStep["type"]): string {
  switch (type) {
    case "composio":
      return "bg-blue-100 text-blue-600";
    case "custom":
      return "bg-purple-100 text-purple-600";
    case "control":
      return "bg-amber-100 text-amber-600";
    case "query_table":
    case "write_table":
      return "bg-green-100 text-green-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function StepIcon({ type, className }: { type: WorkflowStep["type"]; className?: string }) {
  switch (type) {
    case "composio":
      return <Plug className={className} />;
    case "custom":
      return <Code className={className} />;
    case "control":
      return <GitBranch className={className} />;
    case "query_table":
    case "write_table":
      return <Database className={className} />;
    default:
      return <GitBranch className={className} />;
  }
}




