"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Save, 
  Play, 
  List, 
  Network,
  Loader2,
  Check,
  Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflowEditorStore } from "../store";
import type { ViewMode } from "../store/types";

interface EditorHeaderProps {
  onSave?: () => Promise<void>;
  isSaving?: boolean;
}

export function EditorHeader({ onSave, isSaving }: EditorHeaderProps) {
  const { 
    workflow,
    isDirty,
    viewMode,
    setViewMode,
    updateWorkflowMetadata
  } = useWorkflowEditorStore();

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
    <header className="h-14 border-b bg-white flex items-center px-4 gap-4">
      {/* Back button */}
      <Link href="/workflows">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>

      {/* Workflow name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isEditingName ? (
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleNameKeyDown}
            className="h-8 w-64 text-lg font-semibold"
            autoFocus
          />
        ) : (
          <button
            onClick={handleNameEdit}
            className="flex items-center gap-2 group hover:bg-slate-100 rounded px-2 py-1 transition-colors"
          >
            <h1 className="text-lg font-semibold truncate">
              {workflow?.name || "Untitled Workflow"}
            </h1>
            <Pencil className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
        
        {isDirty && (
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
            Unsaved
          </span>
        )}
      </div>

      {/* View mode toggle */}
      <div className="flex items-center rounded-lg border bg-slate-100 p-1">
        <ViewModeButton
          mode="list"
          currentMode={viewMode}
          onClick={() => setViewMode("list")}
          icon={<List className="h-4 w-4" />}
          label="List"
          shortcut="⌘1"
        />
        <ViewModeButton
          mode="canvas"
          currentMode={viewMode}
          onClick={() => setViewMode("canvas")}
          icon={<Network className="h-4 w-4" />}
          label="Canvas"
          shortcut="⌘2"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => useWorkflowEditorStore.getState().setActivePanel("test")}
          title="Run test (switch to Test panel)"
        >
          <Play className="h-4 w-4 mr-2" />
          Test
        </Button>
        
        <Button 
          size="sm" 
          onClick={onSave}
          disabled={isSaving || !isDirty}
          title="Save workflow (Ctrl+S)"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : isDirty ? (
            <Save className="h-4 w-4 mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          {isSaving ? "Saving..." : isDirty ? "Save" : "Saved"}
        </Button>
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
  shortcut?: string;
}

function ViewModeButton({ mode, currentMode, onClick, icon, label, shortcut }: ViewModeButtonProps) {
  const isActive = mode === currentMode;
  
  return (
    <button
      onClick={onClick}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
        isActive 
          ? "bg-white text-slate-900 shadow-sm" 
          : "text-slate-500 hover:text-slate-700"
      )}
    >
      {icon}
      {label}
    </button>
  );
}



