"use client";

import { ArrowLeft, Save, Play, Code, Command } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkflowEditorStore } from "../store";

interface EditorHeaderProps {
  onSave: () => void;
  isSaving: boolean;
}

export function EditorHeader({ onSave, isSaving }: EditorHeaderProps) {
  const router = useRouter();
  const { 
    workflow, 
    isDirty, 
    updateWorkflowMeta,
    isCodePreviewOpen,
    toggleCodePreview,
    toggleCommandPalette,
  } = useWorkflowEditorStore();

  return (
    <header className="h-14 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/workflows-c")}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={workflow?.name || ""}
            onChange={(e) => updateWorkflowMeta({ name: e.target.value })}
            placeholder="Workflow Name"
            className="text-lg font-semibold bg-transparent border-0 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded px-2 py-1 -mx-2"
          />
          {isDirty && (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded">
              Unsaved
            </span>
          )}
          {workflow?.published ? (
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded">
              Published
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-slate-600 text-slate-300 text-xs font-medium rounded">
              Draft
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Keyboard shortcut hint */}
        <button
          onClick={toggleCommandPalette}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Command className="h-3.5 w-3.5" />
          <span>K</span>
        </button>

        {/* Code Preview Toggle */}
        <button
          onClick={toggleCodePreview}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            isCodePreviewOpen
              ? "bg-cyan-600 text-white"
              : "text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700"
          }`}
        >
          <Code className="h-4 w-4" />
          Code
        </button>

        {/* Test Button */}
        <button
          onClick={() => useWorkflowEditorStore.getState().setActiveTab("test")}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Play className="h-4 w-4" />
          Test
        </button>

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </header>
  );
}




