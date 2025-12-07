"use client";

import { Suspense, useCallback, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { EditorHeader } from "./components/EditorHeader";
import { EditorSidebar } from "./components/EditorSidebar";
import { EditorMain } from "./components/EditorMain";
import { EditorInspector } from "./components/EditorInspector";
import { CommandPalette } from "./components/CommandPalette";
import { useWorkflowLoader } from "./hooks/useWorkflowLoader";
import { useWorkflowEditorStore } from "./store";

function WorkflowEditorContent() {
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
    isCommandPaletteOpen,
    toggleCommandPalette,
    markClean,
  } = useWorkflowEditorStore();

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleCommandPalette();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCommandPalette]);

  const handleSave = useCallback(async () => {
    if (!workflow) return;

    setIsSaving(true);
    try {
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
          order: steps.map((s) => s.id),
        },
      };

      const response = await fetch(`/api/workflows-c/${workflow.id}`, {
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

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-red-400 text-xl">!</span>
          </div>
          <p className="text-white font-medium">Error loading workflow</p>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!workflowId) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-400">No workflow ID provided</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <EditorHeader onSave={handleSave} isSaving={isSaving} />

      <div className="flex-1 flex overflow-hidden">
        <EditorSidebar />
        <EditorMain />
        <EditorInspector />
      </div>

      {isCommandPaletteOpen && <CommandPalette />}
    </div>
  );
}

export default function WorkflowEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-slate-900">
          <div className="h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <WorkflowEditorContent />
    </Suspense>
  );
}




