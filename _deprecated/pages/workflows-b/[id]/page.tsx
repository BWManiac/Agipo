"use client";

import { useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useWorkflow, useSaveWorkflow } from "../hooks/useWorkflows";
import { useWorkflowsBStore, storeToEditorState } from "../editor/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Play, 
  Save,
  Upload,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "use-debounce";

import { Timeline } from "./components/Timeline";
import { RightPanel } from "./components/RightPanel";
import { LeftPanel } from "./components/LeftPanel";
import { MappingModal } from "./components/MappingModal";


export default function WorkflowEditorPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params);
  const router = useRouter();
  
  // Fetch workflow data
  const { data: editorState, isLoading, error } = useWorkflow(id);
  const saveWorkflow = useSaveWorkflow(id);
  
  // Store state
  const workflow = useWorkflowsBStore(state => state.workflow);
  const setWorkflow = useWorkflowsBStore(state => state.setWorkflow);
  const updateWorkflowMeta = useWorkflowsBStore(state => state.updateWorkflowMeta);
  const isDirty = useWorkflowsBStore(state => state.isDirty);
  const markSaved = useWorkflowsBStore(state => state.markSaved);
  const selectedStepId = useWorkflowsBStore(state => state.selectedStepId);
  const expandedStepIds = useWorkflowsBStore(state => state.expandedStepIds);
  
  // Load workflow into store when fetched
  useEffect(() => {
    if (editorState?.workflow) {
      setWorkflow(editorState.workflow);
    }
  }, [editorState, setWorkflow]);
  
  // Auto-save with debounce
  const debouncedSave = useDebouncedCallback(
    useCallback(async () => {
      if (!workflow || !isDirty) return;
      
      const state = storeToEditorState(workflow, selectedStepId, expandedStepIds);
      try {
        await saveWorkflow.mutateAsync(state);
        markSaved();
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, [workflow, isDirty, selectedStepId, expandedStepIds, saveWorkflow, markSaved]),
    2000
  );
  
  // Trigger auto-save when dirty
  useEffect(() => {
    if (isDirty) {
      debouncedSave();
    }
  }, [isDirty, debouncedSave]);
  
  // Manual save
  const handleSave = async () => {
    if (!workflow) return;
    
    const state = storeToEditorState(workflow, selectedStepId, expandedStepIds);
    try {
      await saveWorkflow.mutateAsync(state);
      markSaved();
    } catch (error) {
      console.error("Save failed:", error);
    }
  };
  
  // Handle name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateWorkflowMeta({ name: e.target.value });
  };
  
  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-white">
        <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </header>
        <div className="flex-1 flex">
          <Skeleton className="w-60 h-full" />
          <Skeleton className="flex-1 h-full" />
          <Skeleton className="w-80 h-full" />
        </div>
      </div>
    );
  }
  
  if (error || !workflow) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 mb-2">
            Workflow not found
          </p>
          <p className="text-sm text-gray-500 mb-4">
            The workflow you&apos;re looking for doesn&apos;t exist or was deleted.
          </p>
          <Button onClick={() => router.push("/workflows-b")}>
            Back to Workflows
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-white">
      {/* Top Bar */}
      <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/workflows-b")}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={workflow.name}
              onChange={handleNameChange}
              className="text-base font-semibold text-gray-900 bg-transparent border-0 focus:ring-2 focus:ring-blue-500 rounded px-1 h-8 w-auto min-w-[200px]"
            />
            <StatusBadge status={workflow.status} />
            {isDirty && (
              <span className="text-xs text-gray-400">Unsaved</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Test Dropdown */}
          <Button variant="outline" size="sm" className="gap-2">
            <Play className="h-4 w-4" />
            Test
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || saveWorkflow.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveWorkflow.isPending ? "Saving..." : "Save"}
          </Button>
          
          <Button size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </header>
      
      {/* Main Content - Three Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        <LeftPanel />
        <Timeline />
        <RightPanel />
      </div>
      
      {/* Modals */}
      <MappingModal />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Draft" },
    ready: { bg: "bg-blue-100", text: "text-blue-700", label: "Ready" },
    published: { bg: "bg-green-100", text: "text-green-700", label: "Published" },
  };
  const { bg, text, label } = config[status] || config.draft;
  
  return (
    <Badge className={cn(bg, text, "text-xs font-medium")}>
      {label}
    </Badge>
  );
}

