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
      <div className="p-4 border-b border-border flex-shrink-0">
        <h3 className="text-sm font-semibold">Workflow Inputs</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Parameters this workflow accepts when invoked
        </p>
      </div>

      {/* Content - Scrollable area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {workflowInputs.length === 0 ? (
          // Empty state message
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <FileInput className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No inputs defined yet
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Use the button below to add your first input
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {workflowInputs.map((input) => (
              <WorkflowInputRow key={input.name} input={input} />
            ))}
          </div>
        )}
      </div>

      {/* Footer - Always visible with Add Input button */}
      <div className="p-3 border-t border-border flex-shrink-0 bg-background">
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
    </div>
  );
}

