"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useWorkflowStore } from "../../store";
import { ExecutionInputForm } from "./ExecutionInputForm";
import { ExecutionProgress } from "./ExecutionProgress";
import { ExecutionResult } from "./ExecutionResult";

/**
 * Main dialog for executing workflows from the editor.
 * Orchestrates the execution flow: Input Form -> Progress -> Result
 */
export function ExecuteWorkflowDialog() {
  const isOpen = useWorkflowStore((s) => s.isExecuteModalOpen);
  const closeModal = useWorkflowStore((s) => s.closeExecuteModal);
  const executionStatus = useWorkflowStore((s) => s.executionStatus);
  const workflowName = useWorkflowStore((s) => s.name);

  // Determine which view to show based on execution status
  const showInputForm = executionStatus === "idle";
  const showProgress = executionStatus === "running";
  const showResult = executionStatus === "completed" || executionStatus === "failed";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {showInputForm && "Run Workflow"}
            {showProgress && "Running..."}
            {showResult && (executionStatus === "completed" ? "Complete" : "Failed")}
          </DialogTitle>
          <DialogDescription>
            {showInputForm && `Execute "${workflowName || "Workflow"}"`}
            {showProgress && "Workflow is executing..."}
            {showResult && (
              executionStatus === "completed"
                ? "Workflow completed successfully"
                : "Workflow execution failed"
            )}
          </DialogDescription>
        </DialogHeader>

        {showInputForm && <ExecutionInputForm />}
        {showProgress && <ExecutionProgress />}
        {showResult && <ExecutionResult />}
      </DialogContent>
    </Dialog>
  );
}
