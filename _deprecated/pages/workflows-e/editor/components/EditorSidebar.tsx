"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from "lucide-react";
import { useWorkflowEditorStore } from "../store";

interface EditorSidebarProps {
  className?: string;
}

export function EditorSidebar({ className }: EditorSidebarProps) {
  const { 
    aiPanelExpanded,
    toggleAIPanel
  } = useWorkflowEditorStore();

  if (!aiPanelExpanded) {
    return (
      <div className={cn("w-16 bg-[#0f0f1a] border-r border-[#1a1a2e] flex flex-col items-center py-4", className)}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-white"
          onClick={toggleAIPanel}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="mt-4 p-2 rounded-lg bg-[#1a1a2e]">
          <MessageSquare className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <aside className={cn("w-80 bg-[#0f0f1a] border-r border-[#1a1a2e] flex flex-col transition-all duration-300", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#1a1a2e]">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-white">AI Assistant</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-400 hover:text-white"
          onClick={toggleAIPanel}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-sm text-gray-400 text-center py-8">
          AI chat will be available here
        </div>
      </div>

      {/* Chat input */}
      <div className="p-4 border-t border-[#1a1a2e]">
        <div className="text-xs text-gray-500 text-center">
          Chat input coming soon
        </div>
      </div>
    </aside>
  );
}


