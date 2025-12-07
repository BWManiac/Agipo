import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkflowDefinition } from "@/app/api/workflows-e/services/types";
import { useWorkflowEditorStore } from "../store";

interface UsePersistenceReturn {
  save: () => Promise<void>;
  isSaving: boolean;
}

export function usePersistence(): UsePersistenceReturn {
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    workflow,
    steps,
    mappings,
    runtimeInputs,
    configs,
    connections,
    tableRequirements,
    tables,
    isDirty,
    markClean,
    setError,
  } = useWorkflowEditorStore();

  const save = useCallback(async () => {
    if (!workflow || isSaving) return;

    setIsSaving(true);

    try {
      const updatedWorkflow: WorkflowDefinition = {
        ...workflow,
        steps,
        mappings,
        runtimeInputs,
        configs,
        connections,
        tableRequirements,
        tables,
        controlFlow: {
          type: "sequential",
          order: steps.map((s) => s.id),
        },
        lastModified: new Date().toISOString(),
      };

      const response = await fetch(`/api/workflows-e/${workflow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedWorkflow),
      });

      if (!response.ok) {
        throw new Error("Failed to save workflow");
      }

      // Code generation will be added in Phase 9
      // For now, just save the workflow definition

      markClean();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed";
      setError(message);
      console.error("Error saving workflow:", error);
    } finally {
      setIsSaving(false);
    }
  }, [workflow, steps, mappings, runtimeInputs, configs, connections, tableRequirements, tables, markClean, setError, isSaving]);

  // Auto-save when dirty (optional, can be disabled)
  useEffect(() => {
    if (!isDirty || !workflow) return;

    // Clear existing timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // Set new timer for auto-save (5 seconds delay)
    autosaveTimerRef.current = setTimeout(() => {
      save();
    }, 5000);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [isDirty, workflow, save]);

  return {
    save,
    isSaving,
  };
}


