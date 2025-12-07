"use client";

import { useEffect, useRef, useCallback } from "react";
import { useWorkflowsDStore } from "../store";

const AUTOSAVE_DELAY = 2000; // 2 seconds

/**
 * Hook to handle auto-saving workflow changes
 */
export function useAutoSave() {
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
  } = useWorkflowsDStore();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  const save = useCallback(async () => {
    if (!workflow || isSavingRef.current) return;

    isSavingRef.current = true;

    try {
      const updatedWorkflow = {
        ...workflow,
        steps,
        mappings,
        runtimeInputs,
        configs,
        connections,
        tableRequirements,
        tables,
        controlFlow: {
          type: "sequential" as const,
          order: steps.map((s) => s.id),
        },
      };

      const response = await fetch(`/api/workflows-d/${workflow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedWorkflow),
      });

      if (!response.ok) {
        throw new Error("Failed to save workflow");
      }

      markClean();
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      isSavingRef.current = false;
    }
  }, [workflow, steps, mappings, runtimeInputs, configs, connections, tableRequirements, tables, markClean]);

  // Trigger auto-save when dirty
  useEffect(() => {
    if (!isDirty) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      save();
    }, AUTOSAVE_DELAY);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isDirty, save]);

  return { save, isSaving: isSavingRef.current };
}




