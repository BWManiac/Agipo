"use client";

import { LexicalEditor } from "./LexicalEditor";
import { Toolbar } from "./Toolbar";
import { EmptyState } from "./EmptyState";
import { useDocsStore } from "../../store";

interface DocumentEditorProps {
  initialMarkdown?: string;
}

export function DocumentEditor({ initialMarkdown }: DocumentEditorProps) {
  const store = useDocsStore();
  const { content } = store;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto border rounded-lg relative">
        {content || initialMarkdown ? (
          <LexicalEditor initialMarkdown={content || initialMarkdown} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
