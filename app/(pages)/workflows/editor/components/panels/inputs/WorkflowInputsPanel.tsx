"use client";

import { Plus, FileInput } from "lucide-react";
import { useWorkflowStore } from "../../../store";
import { WorkflowInputRow } from "./WorkflowInputRow";
import { Button } from "@/components/ui/button";

export function WorkflowInputsPanel() {
  const { workflowInputs, addWorkflowInput } = useWorkflowStore();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold">Workflow Inputs</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Parameters this workflow accepts when invoked
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {workflowInputs.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-48 text-center p-6">
            <FileInput className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No inputs defined yet
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addWorkflowInput()}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Input
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {workflowInputs.map((input) => (
              <WorkflowInputRow key={input.name} input={input} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {workflowInputs.length > 0 && (
        <div className="p-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => addWorkflowInput()}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Input
          </Button>
        </div>
      )}
    </div>
  );
}

