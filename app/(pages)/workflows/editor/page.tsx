"use client";

import { Suspense } from "react";
import { Play } from "lucide-react";
import { useWorkflowLoader } from "./hooks/useWorkflowLoader";
import { useWorkflowStore } from "./store";
import { usePersistence } from "./hooks/usePersistence";
import { RailView } from "./components/RailView";
import { EditorInspector } from "./components/EditorInspector";
import { DndProvider } from "./providers/DndProvider";
import { ExecuteWorkflowDialog } from "./components/execution";

/**
 * Main editor page for Workflows.
 * Provides a 3-panel layout: chat (left), workflow editor (center), settings (right).
 * Uses drag-and-drop for building workflows.
 */
function WorkflowEditorContent() {
  useWorkflowLoader();
  const workflowId = useWorkflowStore((state) => state.id);
  const workflowName = useWorkflowStore((state) => state.name);
  const lastSaved = useWorkflowStore((state) => state.lastSaved);
  const openExecuteModal = useWorkflowStore((state) => state.openExecuteModal);
  const { isSaving, isLoading, saveWorkflow } = usePersistence();

  const canSave = !!workflowId && !isSaving && !isLoading;
  // Can only run if workflow has been saved (transpiled)
  const canRun = !!workflowId && !!lastSaved && !isSaving && !isLoading;

  return (
    <DndProvider>
      <div className="flex h-screen flex-col">
        {/* Header */}
        <header className="border-b bg-background px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">
              {workflowName || "Untitled Workflow"}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={openExecuteModal}
                disabled={!canRun}
                className="px-4 py-2 rounded-md border bg-background hover:bg-accent disabled:opacity-50 flex items-center gap-2"
                title={!lastSaved ? "Save workflow first to enable running" : "Run workflow"}
              >
                <Play className="h-4 w-4" />
                Run
              </button>
              <button
                onClick={() => saveWorkflow()}
                disabled={!canSave}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : isLoading ? "Loading..." : "Save"}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content - 3 Panel Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Chat (placeholder) */}
          <aside className="w-80 border-r bg-muted/50">
            <div className="p-4">
              <h2 className="text-sm font-semibold mb-2">AI Assistant</h2>
              <p className="text-sm text-muted-foreground">
                Chat panel coming soon...
              </p>
            </div>
          </aside>

          {/* Center Panel - Rail View */}
          <main className="flex-1 flex flex-col overflow-hidden bg-muted/30">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading workflow...</p>
              </div>
            ) : (
              <RailView />
            )}
          </main>

          {/* Right Panel - Settings (Tools, Logic, etc.) */}
          <aside className="w-80">
            <EditorInspector />
          </aside>
        </div>

        {/* Execution Modal */}
        <ExecuteWorkflowDialog />
      </div>
    </DndProvider>
  );
}

function EditorLoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Loading editor...</p>
    </div>
  );
}

export default function WorkflowEditorPage() {
  return (
    <Suspense fallback={<EditorLoadingFallback />}>
      <WorkflowEditorContent />
    </Suspense>
  );
}
