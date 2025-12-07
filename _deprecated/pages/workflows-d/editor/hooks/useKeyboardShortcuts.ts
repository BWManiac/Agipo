"use client";

import { useEffect, useCallback } from "react";
import { useWorkflowsDStore } from "../store";

interface KeyboardShortcutsOptions {
  onSave?: () => Promise<void>;
  enabled?: boolean;
}

/**
 * Hook for keyboard shortcuts in the workflow editor
 */
export function useKeyboardShortcuts({ onSave, enabled = true }: KeyboardShortcutsOptions) {
  const {
    selectedStepId,
    setSelectedStep,
    removeStep,
    steps,
    setViewMode,
    viewMode,
    setAbstractionLevel,
    abstractionLevel,
    toggleChatPanel,
    toggleInspector,
    setActivePanel,
  } = useWorkflowsDStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        // Allow Escape in inputs
        if (e.key !== "Escape") return;
      }

      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Save: Cmd/Ctrl + S
      if (cmdOrCtrl && e.key === "s") {
        e.preventDefault();
        onSave?.();
        return;
      }

      // Delete selected step: Backspace or Delete
      if ((e.key === "Backspace" || e.key === "Delete") && selectedStepId) {
        e.preventDefault();
        if (confirm("Delete this step?")) {
          removeStep(selectedStepId);
        }
        return;
      }

      // Escape: Deselect
      if (e.key === "Escape") {
        e.preventDefault();
        setSelectedStep(null);
        return;
      }

      // Navigate steps with arrow keys
      if ((e.key === "ArrowUp" || e.key === "ArrowDown") && steps.length > 0) {
        e.preventDefault();
        const currentIndex = selectedStepId
          ? steps.findIndex((s) => s.id === selectedStepId)
          : -1;

        if (e.key === "ArrowUp") {
          const newIndex = currentIndex <= 0 ? steps.length - 1 : currentIndex - 1;
          setSelectedStep(steps[newIndex].id);
        } else {
          const newIndex = currentIndex >= steps.length - 1 ? 0 : currentIndex + 1;
          setSelectedStep(steps[newIndex].id);
        }
        return;
      }

      // Toggle view mode: Cmd/Ctrl + 1/2
      if (cmdOrCtrl && e.key === "1") {
        e.preventDefault();
        setViewMode("list");
        return;
      }
      if (cmdOrCtrl && e.key === "2") {
        e.preventDefault();
        setViewMode("canvas");
        return;
      }

      // Toggle abstraction level: Cmd/Ctrl + Shift + 1/2/3
      if (cmdOrCtrl && e.shiftKey && e.key === "1") {
        e.preventDefault();
        setAbstractionLevel("flow");
        return;
      }
      if (cmdOrCtrl && e.shiftKey && e.key === "2") {
        e.preventDefault();
        setAbstractionLevel("spec");
        return;
      }
      if (cmdOrCtrl && e.shiftKey && e.key === "3") {
        e.preventDefault();
        setAbstractionLevel("code");
        return;
      }

      // Toggle panels: Cmd/Ctrl + B (chat), Cmd/Ctrl + I (inspector)
      if (cmdOrCtrl && e.key === "b") {
        e.preventDefault();
        toggleChatPanel();
        return;
      }
      if (cmdOrCtrl && e.key === "i") {
        e.preventDefault();
        toggleInspector();
        return;
      }

      // Quick panel switching: Cmd/Ctrl + Shift + T/I/C/O/R
      if (cmdOrCtrl && e.shiftKey) {
        if (e.key === "t" || e.key === "T") {
          e.preventDefault();
          setActivePanel("tools");
          return;
        }
        if (e.key === "i" || e.key === "I") {
          e.preventDefault();
          setActivePanel("inputs");
          return;
        }
        if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          setActivePanel("config");
          return;
        }
        if (e.key === "o" || e.key === "O") {
          e.preventDefault();
          setActivePanel("connect");
          return;
        }
        if (e.key === "r" || e.key === "R") {
          e.preventDefault();
          setActivePanel("test");
          return;
        }
      }
    },
    [
      enabled,
      onSave,
      selectedStepId,
      setSelectedStep,
      removeStep,
      steps,
      setViewMode,
      viewMode,
      setAbstractionLevel,
      abstractionLevel,
      toggleChatPanel,
      toggleInspector,
      setActivePanel,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}


