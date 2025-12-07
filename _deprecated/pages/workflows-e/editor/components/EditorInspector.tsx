"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useWorkflowEditorStore } from "../store";
import type { ActiveSettingsTab } from "../store/types";
import { ToolPalette } from "./panels/ToolPalette";
import { InputsPanel } from "./panels/InputsPanel";
import { ConfigPanel } from "./panels/ConfigPanel";
import { ConnectionsPanel } from "./panels/ConnectionsPanel";
import { TestPanel } from "./panels/TestPanel";

interface EditorInspectorProps {
  className?: string;
}

const SETTINGS_TABS: { id: ActiveSettingsTab; label: string }[] = [
  { id: "tools", label: "Tools" },
  { id: "inputs", label: "Inputs" },
  { id: "config", label: "Config" },
  { id: "connect", label: "Connect" },
  { id: "test", label: "Test" },
];

export function EditorInspector({ className }: EditorInspectorProps) {
  const { 
    selectedStepId, 
    isInspectorCollapsed, 
    toggleInspector,
    activeSettingsTab,
    setActiveSettingsTab
  } = useWorkflowEditorStore();

  if (isInspectorCollapsed) {
    return (
      <div className={cn("w-16 bg-[#0f0f1a] border-l border-[#1a1a2e] flex flex-col items-center py-4", className)}>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-gray-400 hover:text-white" 
          onClick={toggleInspector}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside className={cn("w-80 bg-[#0f0f1a] border-l border-[#1a1a2e] flex flex-col", className)}>
      {/* Tab bar */}
      <div className="flex border-b border-[#1a1a2e]">
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSettingsTab(tab.id)}
            className={cn(
              "flex-1 px-3 py-2 text-xs font-medium transition-colors border-b-2",
              activeSettingsTab === tab.id
                ? "text-white border-indigo-500"
                : "text-gray-400 border-transparent hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeSettingsTab === "tools" && <ToolPalette />}
        {activeSettingsTab === "inputs" && <InputsPanel />}
        {activeSettingsTab === "config" && <ConfigPanel />}
        {activeSettingsTab === "connect" && <ConnectionsPanel />}
        {activeSettingsTab === "test" && <TestPanel />}
      </div>
    </aside>
  );
}

