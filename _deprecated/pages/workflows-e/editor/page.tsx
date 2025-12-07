"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useWorkflowLoader } from "./hooks/useWorkflowLoader";
import { usePersistence } from "./hooks/usePersistence";
import { EditorHeader } from "./components/EditorHeader";
import { EditorSidebar } from "./components/EditorSidebar";
import { EditorMain } from "./components/EditorMain";
import { EditorInspector } from "./components/EditorInspector";

function EditorContent() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id");
  const { isLoading, error } = useWorkflowLoader(workflowId);
  const { save, isSaving } = usePersistence();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a14]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a14]">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-2">Error loading workflow</p>
          <p className="text-gray-500 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a14]">
      <EditorHeader onSave={save} isSaving={isSaving} />
      <div className="flex-1 flex overflow-hidden">
        <EditorSidebar />
        <EditorMain />
        <EditorInspector />
      </div>
    </div>
  );
}

export default function WorkflowEditorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-[#0a0a14]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}

