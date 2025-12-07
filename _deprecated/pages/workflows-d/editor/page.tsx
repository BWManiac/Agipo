"use client";

import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";

import { EditorHeader } from "./components/EditorHeader";
import { EditorLayout } from "./components/EditorLayout";
import { ChatPanel } from "./components/panels/ChatPanel";
import { InspectorPanel } from "./components/panels/InspectorPanel";
import { MainContent } from "./components/MainContent";
import { KeyboardShortcutsHelp } from "./components/KeyboardShortcutsHelp";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useWorkflowLoader } from "./hooks/useWorkflowLoader";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useUndoRedo } from "./hooks/useUndoRedo";
import { useWorkflowsDStore } from "./store";

function WorkflowsDEditorContent() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id");
  
  const [isSaving, setIsSaving] = useState(false);
  
  const { isLoading, error } = useWorkflowLoader(workflowId);
  const { 
    workflow,
    steps,
    mappings,
    runtimeInputs,
    configs,
    connections,
    tableRequirements,
    tables,
    markClean
  } = useWorkflowsDStore();

  const handleSave = useCallback(async () => {
    if (!workflow) return;

    setIsSaving(true);
    try {
      // Build the complete workflow object from store state
      const updatedWorkflow = {
        ...workflow,
        steps,
        mappings,
        runtimeInputs,
        configs,
        connections,
        tableRequirements,
        tables,
        controlFlow: {
          type: "sequential" as const,
          order: steps.map(s => s.id),
        },
      };

      const response = await fetch(`/api/workflows-d/${workflow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedWorkflow),
      });

      if (!response.ok) {
        throw new Error("Failed to save workflow");
      }

      markClean();
    } catch (error) {
      console.error("Error saving workflow:", error);
    } finally {
      setIsSaving(false);
    }
  }, [workflow, steps, mappings, runtimeInputs, configs, connections, tableRequirements, tables, markClean]);

  // Enable keyboard shortcuts
  useKeyboardShortcuts({ onSave: handleSave, enabled: !isLoading && !error });

  // Enable undo/redo
  useUndoRedo();

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 border-2 border-violet-500/30 rounded-full" />
            <div className="absolute inset-0 h-12 w-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slate-400">Loading workflow...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <span className="text-red-400 text-2xl font-bold">!</span>
          </div>
          <p className="text-white font-medium">Error loading workflow</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // No workflow ID
  if (!workflowId) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-slate-400">No workflow ID provided</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950">
        {/* Ambient background effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fuchsia-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          <EditorHeader onSave={handleSave} isSaving={isSaving} />
          
          <EditorLayout
            chatPanel={<ChatPanel />}
            mainContent={<MainContent />}
            inspectorPanel={<InspectorPanel />}
          />
        </div>

        {/* Keyboard shortcuts help */}
        <KeyboardShortcutsHelp />
      </div>
    </ErrorBoundary>
  );
}

export default function WorkflowsDEditorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="h-12 w-12 border-2 border-violet-500/30 rounded-full" />
          <div className="absolute inset-0 h-12 w-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    }>
      <WorkflowsDEditorContent />
    </Suspense>
  );
}



