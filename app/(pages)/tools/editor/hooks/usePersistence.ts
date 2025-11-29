import { useWorkflowGeneratorStore } from "../store";

/**
 * A hook for accessing all state and actions related to workflow persistence.
 * This includes saving, loading, and managing the workflow's name and ID.
 */
export function usePersistence() {
  const {
    currentWorkflowId,
    workflowName,
    isSaving,
    setWorkflowName,
    saveCurrentWorkflow,
    loadCompleteWorkflow,
    resetWorkflowState,
  } = useWorkflowGeneratorStore();

  return {
    currentWorkflowId,
    workflowName,
    isSaving,
    setWorkflowName,
    saveCurrentWorkflow,
    loadCompleteWorkflow,
    resetWorkflowState,
  };
}
