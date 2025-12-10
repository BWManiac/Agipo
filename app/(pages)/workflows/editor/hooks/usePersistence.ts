import { useWorkflowStore } from "./useWorkflowStore";

/**
 * Convenience hook for persistence operations.
 * Encapsulates save/load logic and provides loading/saving state.
 * Enables components to easily save workflows and show loading indicators.
 */
export function usePersistence() {
  const saveWorkflow = useWorkflowStore((state) => state.saveWorkflow);
  const fetchWorkflowById = useWorkflowStore((state) => state.fetchWorkflowById);
  const resetWorkflow = useWorkflowStore((state) => state.resetWorkflow);
  const isSaving = useWorkflowStore((state) => state.isSaving);
  const isLoading = useWorkflowStore((state) => state.isLoading);
  const lastSaved = useWorkflowStore((state) => state.lastSaved);

  return {
    saveWorkflow,
    fetchWorkflowById,
    resetWorkflow,
    isSaving,
    isLoading,
    lastSaved,
  };
}




