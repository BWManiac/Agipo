"use client";

import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { $getRoot } from "lexical";

interface MarkdownPluginProps {
  initialContent: string;
}

export function MarkdownPlugin({ initialContent }: MarkdownPluginProps) {
  const [editor] = useLexicalComposerContext();
  const hasInitialized = useRef(false);

  // Import initial Markdown content
  useEffect(() => {
    // Only initialize once
    if (hasInitialized.current) return;
    if (!initialContent) return;

    hasInitialized.current = true;

    editor.update(() => {
      // CRITICAL: Must clear root before converting from Markdown
      // This is a validated pattern from Phase 0 technical spike
      const root = $getRoot();
      root.clear();
      $convertFromMarkdownString(initialContent, TRANSFORMERS);
    });
  }, [editor, initialContent]);

  return null;
}
