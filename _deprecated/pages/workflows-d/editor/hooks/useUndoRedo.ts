"use client";

import { useEffect, useCallback, useRef } from "react";
import { useWorkflowsDStore } from "../store";
import type { WorkflowStep, DataMapping } from "@/app/api/workflows-d/services/types";

interface HistoryState {
  steps: WorkflowStep[];
  mappings: DataMapping[];
}

const MAX_HISTORY = 50;

/**
 * Hook for undo/redo functionality in the workflow editor
 */
export function useUndoRedo() {
  const { steps, mappings, setSteps, setMappings } = useWorkflowsDStore();
  
  const historyRef = useRef<HistoryState[]>([]);
  const currentIndexRef = useRef(-1);
  const isUndoRedoRef = useRef(false);

  // Push current state to history
  const pushHistory = useCallback(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    const newState: HistoryState = {
      steps: JSON.parse(JSON.stringify(steps)),
      mappings: JSON.parse(JSON.stringify(mappings)),
    };

    // Remove any future states if we're not at the end
    if (currentIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);
    }

    // Add new state
    historyRef.current.push(newState);
    currentIndexRef.current = historyRef.current.length - 1;

    // Limit history size
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
      currentIndexRef.current--;
    }
  }, [steps, mappings]);

  // Track changes
  useEffect(() => {
    pushHistory();
  }, [steps, mappings, pushHistory]);

  const undo = useCallback(() => {
    if (currentIndexRef.current <= 0) return;

    currentIndexRef.current--;
    const state = historyRef.current[currentIndexRef.current];
    
    isUndoRedoRef.current = true;
    setSteps(state.steps);
    setMappings(state.mappings);
  }, [setSteps, setMappings]);

  const redo = useCallback(() => {
    if (currentIndexRef.current >= historyRef.current.length - 1) return;

    currentIndexRef.current++;
    const state = historyRef.current[currentIndexRef.current];
    
    isUndoRedoRef.current = true;
    setSteps(state.steps);
    setMappings(state.mappings);
  }, [setSteps, setMappings]);

  const canUndo = currentIndexRef.current > 0;
  const canRedo = currentIndexRef.current < historyRef.current.length - 1;

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      if (cmdOrCtrl && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return { undo, redo, canUndo, canRedo };
}


