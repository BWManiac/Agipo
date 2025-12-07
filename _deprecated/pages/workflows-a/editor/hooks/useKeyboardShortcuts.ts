"use client";

import { useEffect, useCallback } from "react";
import { useWorkflowEditorStore } from "../store";

export function useKeyboardShortcuts() {
  const {
    selectedStepId,
    steps,
    setSelectedStep,
    removeStep,
    setViewMode,
    viewMode,
  } = useWorkflowEditorStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Ctrl/Cmd shortcuts
      const isModKey = e.ctrlKey || e.metaKey;

      // Ctrl+S - Save (handled by auto-save, but prevent default)
      if (isModKey && e.key === "s") {
        e.preventDefault();
        // Save is handled automatically
      }

      // Ctrl+1 - Switch to List view
      if (isModKey && e.key === "1") {
        e.preventDefault();
        setViewMode("list");
      }

      // Ctrl+2 - Switch to Canvas view
      if (isModKey && e.key === "2") {
        e.preventDefault();
        setViewMode("canvas");
      }

      // Delete/Backspace - Delete selected step
      if ((e.key === "Delete" || e.key === "Backspace") && selectedStepId) {
        e.preventDefault();
        const step = steps.find((s) => s.id === selectedStepId);
        if (step && confirm(`Delete step "${step.name}"?`)) {
          removeStep(selectedStepId);
          setSelectedStep(null);
        }
      }

      // Escape - Deselect
      if (e.key === "Escape") {
        setSelectedStep(null);
      }

      // Arrow keys - Navigate steps
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const sortedSteps = [...steps].sort((a, b) => a.listIndex - b.listIndex);
        
        if (!selectedStepId) {
          // Select first or last step
          const targetStep = e.key === "ArrowUp" 
            ? sortedSteps[sortedSteps.length - 1] 
            : sortedSteps[0];
          if (targetStep) setSelectedStep(targetStep.id);
        } else {
          // Navigate to adjacent step
          const currentIndex = sortedSteps.findIndex((s) => s.id === selectedStepId);
          const nextIndex = e.key === "ArrowUp" 
            ? Math.max(0, currentIndex - 1)
            : Math.min(sortedSteps.length - 1, currentIndex + 1);
          setSelectedStep(sortedSteps[nextIndex]?.id || null);
        }
      }
    },
    [selectedStepId, steps, setSelectedStep, removeStep, setViewMode]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}


