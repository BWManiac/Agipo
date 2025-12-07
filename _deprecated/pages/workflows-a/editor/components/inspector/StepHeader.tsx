"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Code, Plug, Database, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflowEditorStore } from "../../store";
import type { WorkflowStep } from "@/app/api/workflows/services/types";

interface StepHeaderProps {
  step: WorkflowStep;
}

export function StepHeader({ step }: StepHeaderProps) {
  const { updateStep, removeStep, setSelectedStep } = useWorkflowEditorStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(step.name);

  const handleSave = () => {
    if (editedName.trim()) {
      updateStep(step.id, { name: editedName.trim() });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm(`Delete step "${step.name}"?`)) {
      removeStep(step.id);
      setSelectedStep(null);
    }
  };

  return (
    <div className="p-4 border-b">
      <div className="flex items-start gap-3">
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", getStepIconBg(step.type))}>
          <StepIcon type={step.type} className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="h-8 font-semibold"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2 group">
              <h3 className="font-semibold text-lg truncate">{step.name}</h3>
              <button
                onClick={() => { setEditedName(step.name); setIsEditing(true); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="h-3 w-3 text-slate-400" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500 capitalize">{step.type}</span>
            {step.toolkitName && <span className="text-xs text-slate-400">• {step.toolkitName}</span>}
            {step.toolId && <span className="text-xs text-slate-400">• {step.toolId}</span>}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {step.description && <p className="mt-3 text-sm text-slate-600">{step.description}</p>}
    </div>
  );
}

function getStepIconBg(type: WorkflowStep["type"]): string {
  switch (type) {
    case "composio": return "bg-blue-100 text-blue-600";
    case "custom": return "bg-purple-100 text-purple-600";
    case "control": return "bg-amber-100 text-amber-600";
    case "query_table":
    case "write_table": return "bg-green-100 text-green-600";
    default: return "bg-slate-100 text-slate-600";
  }
}

function StepIcon({ type, className }: { type: WorkflowStep["type"]; className?: string }) {
  switch (type) {
    case "composio": return <Plug className={className} />;
    case "custom": return <Code className={className} />;
    case "control": return <GitBranch className={className} />;
    case "query_table":
    case "write_table": return <Database className={className} />;
    default: return <GitBranch className={className} />;
  }
}




