"use client";

import { ContentEditable } from "@lexical/react/LexicalContentEditable";

export function EditorContent() {
  return (
    <ContentEditable
      className="outline-none min-h-full px-16 py-12 prose prose-slate dark:prose-invert max-w-none focus:outline-none"
      aria-label="Document editor"
    />
  );
}
