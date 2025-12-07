"use client";

import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";

import { EditorHeader } from "./components/EditorHeader";
import { EditorSidebar } from "./components/EditorSidebar";
import { EditorMain } from "./components/EditorMain";
import { EditorInspector } from "./components/EditorInspector";
import { LoadingState, ErrorBoundary, ErrorAlert } from "./components/common";
import { useWorkflowLoader } from "./hooks/useWorkflowLoader";
import { usePersistence } from "./hooks/usePersistence";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useWorkflowEditorStore } from "./store";

function WorkflowEditorContent() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id");

  const { isLoading, error } = useWorkflowLoader(workflowId);
  const { save, isSaving } = usePersistence();
  useKeyboardShortcuts();

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <LoadingState message="Loading workflow..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <p className="text-slate-900 font-medium">Error loading workflow</p>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  // No workflow ID
  if (!workflowId) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-slate-500">No workflow ID provided</p>
          <a href="/workflows" className="text-primary hover:underline">
            Back to Workflows
          </a>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col">
        <EditorHeader onSave={save} isSaving={isSaving} />

        <div className="flex-1 flex overflow-hidden">
          <EditorSidebar />
          <EditorMain />
          <EditorInspector />
        </div>

        <ErrorAlert />
      </div>
    </ErrorBoundary>
  );
}

export default function WorkflowEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-slate-50">
          <LoadingState message="Initializing editor..." />
        </div>
      }
    >
      <WorkflowEditorContent />
    </Suspense>
  );
}



