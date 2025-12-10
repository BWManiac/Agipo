"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { useDocsStore } from "../../../store";

export function OnChangePlugin() {
  const [editor] = useLexicalComposerContext();
  const setContent = useDocsStore((state) => state.setContent);
  const setIsDirty = useDocsStore((state) => state.setIsDirty);
  const setEditor = useDocsStore((state) => state.setEditor);
  const extractHeadings = useDocsStore((state) => state.extractHeadings);

  // Store editor reference
  useEffect(() => {
    setEditor(editor);

    return () => {
      setEditor(null);
    };
  }, [editor, setEditor]);

  // Listen for content changes
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
      // Skip if no actual changes
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
        return;
      }

      // CRITICAL: Must use editor.update() wrapper for serialization
      // NOT editor.getEditorState().read() - this is a validated pattern from Phase 0
      editor.update(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        setContent(markdown);
        setIsDirty(true);
        extractHeadings(markdown);
      });
    });
  }, [editor, setContent, setIsDirty, extractHeadings]);

  return null;
}
