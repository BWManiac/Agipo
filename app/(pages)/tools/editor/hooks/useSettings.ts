import { useWorkflowGeneratorStore } from "../store";

/**
 * Lightweight selector hook for accessing workflow settings (API keys).
 */
export function useSettings() {
  const apiKeys = useWorkflowGeneratorStore((state) => state.apiKeys);
  const setApiKey = useWorkflowGeneratorStore((state) => state.setApiKey);
  const removeApiKey = useWorkflowGeneratorStore(
    (state) => state.removeApiKey
  );
  const clearAllApiKeys = useWorkflowGeneratorStore(
    (state) => state.clearAllApiKeys
  );

  return {
    apiKeys,
    setApiKey,
    removeApiKey,
    clearAllApiKeys,
  };
}


