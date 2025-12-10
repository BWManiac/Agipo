"use client";

import { useEffect } from "react";
import { EditorContainer } from "./EditorContainer";
import { DocumentHeader } from "./DocumentHeader";
import { SaveIndicator } from "./SaveIndicator";
import { useDocsStore } from "../../store";
import type { Document } from "@/app/api/docs/services/types";

interface DocumentEditorProps {
  document: Document;
}

export function DocumentEditor({ document }: DocumentEditorProps) {
  const setDocument = useDocsStore((state) => state.setDocument);
  const setContent = useDocsStore((state) => state.setContent);
  const resetEditor = useDocsStore((state) => state.resetEditor);
  const extractHeadings = useDocsStore((state) => state.extractHeadings);

  // Initialize store with document data
  useEffect(() => {
    setDocument(document);
    setContent(document.content);
    extractHeadings(document.content);

    // Cleanup on unmount
    return () => {
      resetEditor();
    };
  }, [document, setDocument, setContent, resetEditor, extractHeadings]);

  return (
    <div className="h-full flex flex-col">
      {/* Header with title and save indicator */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <DocumentHeader />
        <SaveIndicator />
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden">
        <EditorContainer initialContent={document.content} />
      </div>
    </div>
  );
}
