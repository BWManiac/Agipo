"use client";

import { useEffect, useCallback } from "react";
import { useBrowserStore } from "../store";

/**
 * Global keyboard shortcuts for browser automation
 *
 * Shortcuts:
 * - Cmd/Ctrl + N: New session
 * - Cmd/Ctrl + L: Focus URL bar (via store action)
 * - Cmd/Ctrl + K: Focus chat input
 * - Escape: Cancel current task / close dialogs
 */
export function useKeyboardShortcuts() {
  const openNewSessionDialog = useBrowserStore(
    (state) => state.openNewSessionDialog
  );
  const closeNewSessionDialog = useBrowserStore(
    (state) => state.closeNewSessionDialog
  );
  const closeProfileDialog = useBrowserStore(
    (state) => state.closeProfileDialog
  );
  const newSessionDialogOpen = useBrowserStore(
    (state) => state.newSessionDialogOpen
  );
  const profileDialogOpen = useBrowserStore(
    (state) => state.profileDialogOpen
  );
  const stopTask = useBrowserStore((state) => state.stopTask);
  const isStreaming = useBrowserStore((state) => state.isStreaming);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      // Escape - close dialogs or stop task
      if (e.key === "Escape") {
        if (newSessionDialogOpen) {
          closeNewSessionDialog();
          e.preventDefault();
          return;
        }
        if (profileDialogOpen) {
          closeProfileDialog();
          e.preventDefault();
          return;
        }
        if (isStreaming) {
          stopTask();
          e.preventDefault();
          return;
        }
      }

      // Don't handle shortcuts if typing in an input
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInputFocused) return;

      // Cmd/Ctrl + N - New session
      if (isMeta && e.key === "n") {
        e.preventDefault();
        openNewSessionDialog();
        return;
      }

      // Cmd/Ctrl + K - Focus chat input
      if (isMeta && e.key === "k") {
        e.preventDefault();
        const chatInput = document.querySelector(
          'textarea[placeholder*="command"]'
        ) as HTMLTextAreaElement;
        if (chatInput) {
          chatInput.focus();
        }
        return;
      }
    },
    [
      openNewSessionDialog,
      closeNewSessionDialog,
      closeProfileDialog,
      newSessionDialogOpen,
      profileDialogOpen,
      stopTask,
      isStreaming,
    ]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
