"use client";

import { useState, useEffect } from "react";
import { Wrench, GitBranch, FileInput, Settings, Link, Play, Info } from "lucide-react";
import { ToolPalette } from "./panels/tools/ToolPalette";
import { LogicPalette } from "./panels/logic/LogicPalette";
import { DetailsPanel } from "./panels/details/DetailsPanel";
import { WorkflowInputsPanel } from "./panels/inputs/WorkflowInputsPanel";
import { useWorkflowStore } from "../store";

type TabId = "details" | "tools" | "logic" | "inputs" | "config" | "connect" | "test";

const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "details", label: "Details", icon: Info },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "logic", label: "Logic", icon: GitBranch },
  { id: "inputs", label: "Inputs", icon: FileInput },
  { id: "config", label: "Config", icon: Settings },
  { id: "connect", label: "Connect", icon: Link },
  { id: "test", label: "Test", icon: Play },
];

export function EditorInspector() {
  const [activeTab, setActiveTab] = useState<TabId>("tools");
  const selectedStepId = useWorkflowStore((state) => state.selectedStepId);

  // Auto-switch to Details tab when a step is selected
  useEffect(() => {
    if (selectedStepId) {
      setActiveTab("details");
    }
  }, [selectedStepId]);

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      {/* Tab bar */}
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "details" && <DetailsPanel />}
        {activeTab === "tools" && <ToolPalette />}
        {activeTab === "logic" && <LogicPalette />}
        {activeTab === "inputs" && <WorkflowInputsPanel />}
        {activeTab !== "details" && activeTab !== "tools" && activeTab !== "logic" && activeTab !== "inputs" && (
          <div className="p-4 text-sm text-muted-foreground">
            {tabs.find((t) => t.id === activeTab)?.label} panel coming soon
          </div>
        )}
      </div>
    </div>
  );
}

