"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  GripVertical,
  Code,
  Plug,
  Database,
  GitBranch,
  MoreHorizontal,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WorkflowStep } from "@/app/api/workflows/services/types";
import { DataFlowIndicator } from "./DataFlowIndicator";
import { StepCardExpanded } from "./StepCardExpanded";

interface StepCardProps {
  step: WorkflowStep;
  index: number;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function StepCard({
  step,
  index,
  isSelected,
  isFirst,
  isLast,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
}: StepCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    onSelect();
    setIsExpanded(!isExpanded);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete step "${step.name}"?`)) {
      onDelete();
    }
  };

  return (
    <div
      className={cn(
        "bg-white rounded-lg border shadow-sm transition-all",
        isSelected ? "ring-2 ring-primary border-primary" : "hover:shadow-md",
      )}
    >
      {/* Header (always visible) */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={handleClick}
      >
        {/* Drag handle / Step number */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-500">
            {index + 1}
          </div>
        </div>

        {/* Step icon */}
        <div className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center",
          getStepIconBg(step.type)
        )}>
          <StepIcon type={step.type} className="h-5 w-5" />
        </div>

        {/* Step info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{step.name}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 capitalize">{step.type}</span>
            {step.toolkitName && (
              <span className="text-xs text-slate-400">• {step.toolkitName}</span>
            )}
          </div>
        </div>

        {/* Data flow indicator */}
        <DataFlowIndicator stepId={step.id} />

        {/* Expand/collapse */}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              disabled={isFirst}
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              Move Up
            </DropdownMenuItem>
            <DropdownMenuItem 
              disabled={isLast}
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            >
              <ArrowDown className="h-4 w-4 mr-2" />
              Move Down
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expanded content */}
      {isExpanded && <StepCardExpanded step={step} />}
    </div>
  );
}

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




