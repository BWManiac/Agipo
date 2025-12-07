"use client";

import { useEffect, useCallback } from "react";
import { useWorkflowsDStore } from "../store";
import type { WorkflowDefinition } from "@/app/api/workflows-d/services/types";

/**
 * Hook to handle loading and managing workflow state
 */
export function useWorkflowLoader(workflowId: string | null) {
  const { 
    loadWorkflow, 
    resetWorkflow, 
    setLoading, 
    setError,
    workflow,
    isDirty,
    isLoading,
    error
  } = useWorkflowsDStore();

  const fetchWorkflow = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workflows-d/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Workflow not found");
        }
        throw new Error("Failed to load workflow");
      }

      const data: WorkflowDefinition = await response.json();
      loadWorkflow(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Error loading workflow:", err);
    } finally {
      setLoading(false);
    }
  }, [loadWorkflow, setLoading, setError]);

  // Load workflow when ID changes
  useEffect(() => {
    if (!workflowId) {
      resetWorkflow();
      return;
    }

    fetchWorkflow(workflowId);
  }, [workflowId, fetchWorkflow, resetWorkflow]);

  // Reload function for manual refresh
  const reload = useCallback(() => {
    if (workflowId) {
      fetchWorkflow(workflowId);
    }
  }, [workflowId, fetchWorkflow]);

  return {
    workflow,
    isDirty,
    isLoading,
    error,
    reload,
  };
}




