"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  FORMAT_TEXT_COMMAND,
  COMMAND_PRIORITY_HIGH,
  KEY_MODIFIER_COMMAND,
} from "lexical";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useDocsStore } from "../../../store";

export function KeyboardShortcutsPlugin() {
  const [editor] = useLexicalComposerContext();
  const toggleShortcuts = useDocsStore((state) => state.toggleShortcuts);
  const save = useDocsStore((state) => state.save);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMod = event.metaKey || event.ctrlKey;

      // Cmd/Ctrl + B = Bold
      if (isMod && event.key === "b") {
        event.preventDefault();
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        return;
      }

      // Cmd/Ctrl + I = Italic
      if (isMod && event.key === "i") {
        event.preventDefault();
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        return;
      }

      // Cmd/Ctrl + U = Underline
      if (isMod && event.key === "u") {
        event.preventDefault();
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        return;
      }

      // Cmd/Ctrl + Shift + S = Strikethrough
      if (isMod && event.shiftKey && event.key === "s") {
        event.preventDefault();
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
        return;
      }

      // Cmd/Ctrl + E = Inline Code
      if (isMod && event.key === "e") {
        event.preventDefault();
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
        return;
      }

      // Cmd/Ctrl + K = Link
      if (isMod && event.key === "k") {
        event.preventDefault();
        // Link is handled by FloatingToolbarPlugin
        return;
      }

      // Cmd/Ctrl + S = Save
      if (isMod && event.key === "s") {
        event.preventDefault();
        save();
        return;
      }

      // ? = Show shortcuts help
      if (event.key === "?" && !isMod && !event.shiftKey) {
        // Only trigger if not in an input
        const target = event.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          event.preventDefault();
          toggleShortcuts();
        }
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor, toggleShortcuts, save]);

  return null;
}
