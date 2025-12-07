"use client";

import { useCallback, useEffect, useRef } from "react";
import { useWorkflowEditorStore } from "../store";
import type { WorkflowDefinition } from "@/app/api/workflows/services/types";

const AUTOSAVE_DELAY = 2000; // 2 seconds

interface UsePersistenceReturn {
  save: () => Promise<void>;
  isSaving: boolean;
}

export function usePersistence(): UsePersistenceReturn {
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

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
    if (!workflow || isSavingRef.current) return;

    isSavingRef.current = true;

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

      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedWorkflow),
      });

      if (!response.ok) {
        throw new Error("Failed to save workflow");
      }

      // Trigger code generation
      await fetch(`/api/workflows/${workflow.id}/generate`, {
        method: "POST",
      }).catch(() => {
        // Code generation is optional, don't fail save if it fails
        console.warn("Code generation failed");
      });

      markClean();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed";
      setError(message);
      console.error("Error saving workflow:", error);
    } finally {
      isSavingRef.current = false;
    }
  }, [workflow, steps, mappings, runtimeInputs, configs, connections, tableRequirements, tables, markClean, setError]);

  // Auto-save when dirty
  useEffect(() => {
    if (!isDirty || !workflow) return;

    // Clear existing timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // Set new timer
    autosaveTimerRef.current = setTimeout(() => {
      save();
    }, AUTOSAVE_DELAY);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [isDirty, workflow, save]);

  return {
    save,
    isSaving: isSavingRef.current,
  };
}




