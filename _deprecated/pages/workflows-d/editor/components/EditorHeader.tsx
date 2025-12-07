"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Play, 
  List, 
  Network,
  Loader2,
  Check,
  Pencil,
  Code,
  FileText,
  Workflow
} from "lucide-react";
import { useWorkflowsDStore } from "../store";
import type { ViewMode, AbstractionLevel } from "../store/types";

interface EditorHeaderProps {
  onSave?: () => Promise<void>;
  isSaving?: boolean;
}

export function EditorHeader({ onSave, isSaving }: EditorHeaderProps) {
  const { 
    workflow,
    isDirty,
    viewMode,
    abstractionLevel,
    setViewMode,
    setAbstractionLevel,
    updateWorkflowMetadata
  } = useWorkflowsDStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(workflow?.name || "");

  const handleNameEdit = () => {
    setEditedName(workflow?.name || "");
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    if (editedName.trim()) {
      updateWorkflowMetadata({ name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
    }
  };

  return (
    <header className="h-16 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl flex items-center px-4 gap-4">
      {/* Back button */}
      <Link 
        href="/workflows-d"
        className="flex items-center justify-center h-9 w-9 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      {/* Workflow name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {isEditingName ? (
          <input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleNameKeyDown}
            className="h-9 w-72 px-3 text-lg font-semibold bg-white/5 border border-violet-500/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            autoFocus
          />
        ) : (
          <button
            onClick={handleNameEdit}
            className="flex items-center gap-2 group hover:bg-white/5 rounded-lg px-3 py-1.5 transition-colors"
          >
            <h1 className="text-lg font-semibold text-white truncate">
              {workflow?.name || "Untitled Workflow"}
            </h1>
            <Pencil className="h-3.5 w-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
        
        {isDirty && (
          <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
            Unsaved
          </span>
        )}
      </div>

      {/* Abstraction level toggle */}
      <div className="flex items-center rounded-xl bg-slate-800/50 border border-white/5 p-1">
        <AbstractionButton
          level="flow"
          currentLevel={abstractionLevel}
          onClick={() => setAbstractionLevel("flow")}
          icon={<Workflow className="h-4 w-4" />}
          label="Flow"
        />
        <AbstractionButton
          level="spec"
          currentLevel={abstractionLevel}
          onClick={() => setAbstractionLevel("spec")}
          icon={<FileText className="h-4 w-4" />}
          label="Spec"
        />
        <AbstractionButton
          level="code"
          currentLevel={abstractionLevel}
          onClick={() => setAbstractionLevel("code")}
          icon={<Code className="h-4 w-4" />}
          label="Code"
        />
      </div>

      {/* View mode toggle */}
      <div className="flex items-center rounded-xl bg-slate-800/50 border border-white/5 p-1">
        <ViewModeButton
          mode="list"
          currentMode={viewMode}
          onClick={() => setViewMode("list")}
          icon={<List className="h-4 w-4" />}
          label="List"
        />
        <ViewModeButton
          mode="canvas"
          currentMode={viewMode}
          onClick={() => setViewMode("canvas")}
          icon={<Network className="h-4 w-4" />}
          label="Canvas"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 font-medium rounded-xl transition-colors"
          disabled
        >
          <Play className="h-4 w-4" />
          Test
        </button>
        
        <button 
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isDirty ? (
            <Save className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {isSaving ? "Saving..." : isDirty ? "Save" : "Saved"}
        </button>
      </div>
    </header>
  );
}

interface ViewModeButtonProps {
  mode: ViewMode;
  currentMode: ViewMode;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function ViewModeButton({ mode, currentMode, onClick, icon, label }: ViewModeButtonProps) {
  const isActive = mode === currentMode;
  
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        isActive 
          ? "bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 text-white shadow-sm" 
          : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

interface AbstractionButtonProps {
  level: AbstractionLevel;
  currentLevel: AbstractionLevel;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function AbstractionButton({ level, currentLevel, onClick, icon, label }: AbstractionButtonProps) {
  const isActive = level === currentLevel;
  
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        isActive 
          ? "bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 text-white shadow-sm" 
          : "text-slate-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}




