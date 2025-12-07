"use client";

import { useEffect, useState } from "react";
import { useWorkflowEditorStore } from "../store";

export function useWorkflowLoader(workflowId: string | null) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setWorkflow, reset } = useWorkflowEditorStore();

  useEffect(() => {
    if (!workflowId) {
      setIsLoading(false);
      setError("No workflow ID provided");
      return;
    }

    async function loadWorkflow() {
      setIsLoading(true);
      setError(null);
      reset();

      try {
        const response = await fetch(`/api/workflows-c/${workflowId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Workflow not found");
          } else {
            setError("Failed to load workflow");
          }
          return;
        }

        const workflow = await response.json();
        setWorkflow(workflow);
      } catch (err) {
        console.error("Error loading workflow:", err);
        setError("Failed to load workflow");
      } finally {
        setIsLoading(false);
      }
    }

    loadWorkflow();
  }, [workflowId, setWorkflow, reset]);

  return { isLoading, error };
}




