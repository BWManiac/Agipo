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
  Pencil,
  Workflow,
  FileText,
  Code
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflowEditorStore } from "../store";
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
    setViewMode,
    abstractionLevel,
    setAbstractionLevel,
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
    <header className="h-14 bg-[#12121f] border-b border-[#1a1a2e] flex items-center justify-between px-4">
      {/* Left side: Back button and workflow name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Link href="/workflows-e">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        {/* Workflow name */}
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleNameKeyDown}
              className="h-8 w-64 text-sm font-semibold bg-[#0a0a14] border-[#1a1a2e] text-white"
              autoFocus
            />
          ) : (
            <button
              onClick={handleNameEdit}
              className="flex items-center gap-2 group hover:bg-[#1a1a2e] rounded px-2 py-1 transition-colors"
            >
              <h1 className="text-sm font-semibold text-white truncate">
                {workflow?.name || "Untitled Workflow"}
              </h1>
              <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          
          {isDirty && (
            <span className="text-xs text-gray-400 bg-[#1a1a2e] px-2 py-0.5 rounded">
              Unsaved
            </span>
          )}
        </div>
      </div>

      {/* Right side: Abstraction level, view mode, and actions */}
      <div className="flex items-center gap-3">
        {/* Abstraction Level Toggle (Variation E unique) */}
        <div className="flex items-center rounded-lg border border-[#1a1a2e] bg-[#0a0a14] p-1">
          <AbstractionLevelButton
            level="flow"
            currentLevel={abstractionLevel}
            onClick={() => setAbstractionLevel("flow")}
            icon={<Workflow className="h-3 w-3" />}
            label="Flow"
          />
          <AbstractionLevelButton
            level="spec"
            currentLevel={abstractionLevel}
            onClick={() => setAbstractionLevel("spec")}
            icon={<FileText className="h-3 w-3" />}
            label="Spec"
          />
          <AbstractionLevelButton
            level="code"
            currentLevel={abstractionLevel}
            onClick={() => setAbstractionLevel("code")}
            icon={<Code className="h-3 w-3" />}
            label="Code"
          />
        </div>

        {/* View mode toggle */}
        <div className="flex items-center rounded-lg border border-[#1a1a2e] bg-[#0a0a14] p-1">
          <ViewModeButton
            mode="list"
            currentMode={viewMode}
            onClick={() => setViewMode("list")}
            icon={<List className="h-3 w-3" />}
            label="List"
          />
          <ViewModeButton
            mode="canvas"
            currentMode={viewMode}
            onClick={() => setViewMode("canvas")}
            icon={<Network className="h-3 w-3" />}
            label="Canvas"
          />
        </div>

        {/* Actions */}
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-[#0a0a14] border-[#1a1a2e] text-white hover:bg-[#1a1a2e]"
          onClick={() => useWorkflowEditorStore.getState().setActiveSettingsTab("test")}
        >
          <Play className="h-3 w-3 mr-2" />
          Test
        </Button>
        
        <Button 
          size="sm" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={onSave}
          disabled={isSaving || !isDirty}
        >
          {isSaving ? (
            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
          ) : isDirty ? (
            <Save className="h-3 w-3 mr-2" />
          ) : (
            <Check className="h-3 w-3 mr-2" />
          )}
          {isSaving ? "Saving..." : isDirty ? "Save" : "Saved"}
        </Button>
      </div>
    </header>
  );
}

interface AbstractionLevelButtonProps {
  level: AbstractionLevel;
  currentLevel: AbstractionLevel;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function AbstractionLevelButton({ level, currentLevel, onClick, icon, label }: AbstractionLevelButtonProps) {
  const isActive = level === currentLevel;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
        isActive 
          ? "bg-indigo-600 text-white" 
          : "text-gray-400 hover:text-white"
      )}
    >
      {icon}
      {label}
    </button>
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
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
        isActive 
          ? "bg-indigo-600 text-white" 
          : "text-gray-400 hover:text-white"
      )}
    >
      {icon}
      {label}
    </button>
  );
}


