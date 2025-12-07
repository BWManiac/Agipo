import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { usePersistence } from "./usePersistence";

/**
 * Hook that automatically loads a workflow when the editor page opens.
 * Reads workflow ID from URL query params and loads the workflow into the store.
 * Handles loading and error states appropriately.
 * Enables the editor to automatically load workflows when users navigate to them.
 */
export function useWorkflowLoader() {
  const searchParams = useSearchParams();
  const { fetchWorkflowById, isLoading } = usePersistence();
  const workflowId = searchParams.get("id");
  const hasLoadedRef = useRef<string | null>(null);

  useEffect(() => {
    // Only load if we have a workflowId, we're not currently loading, and we haven't already loaded this ID
    if (workflowId && !isLoading && hasLoadedRef.current !== workflowId) {
      hasLoadedRef.current = workflowId;
      fetchWorkflowById(workflowId).catch((error) => {
        console.error("Failed to load workflow:", error);
        hasLoadedRef.current = null; // Reset on error so we can retry
      });
    }
  }, [workflowId]); // Only depend on workflowId - fetchWorkflowById is stable from Zustand
}

