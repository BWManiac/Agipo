import { useEffect, useState } from "react";
import { useWorkflowEditorStore } from "../store";

export function useWorkflowLoader(workflowId: string | null) {
  const { loadWorkflow, setLoading, setError } = useWorkflowEditorStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setLocalError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!workflowId) {
      setIsLoading(false);
      return;
    }
    
    async function load() {
      try {
        setLoading(true);
        setError(null);
        setLocalError(null);
        
        const response = await fetch(`/api/workflows-e/${workflowId}`);
        if (!response.ok) {
          throw new Error("Failed to load workflow");
        }
        const workflow = await response.json();
        loadWorkflow(workflow);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load workflow";
        setLocalError(errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    }
    
    load();
  }, [workflowId, loadWorkflow, setLoading, setError]);
  
  return { isLoading, error };
}

