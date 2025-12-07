"use client";

import { Blocks, Variable, Settings, Link, Play } from "lucide-react";
import { useWorkflowEditorStore } from "../store";
import { ToolPalette } from "./ToolPalette";
import { InputsPanel } from "./InputsPanel";
import { ConfigPanel } from "./ConfigPanel";
import { ConnectionsPanel } from "./ConnectionsPanel";
import { TestPanel } from "./TestPanel";

const TABS = [
  { id: "palette" as const, label: "Tools", icon: Blocks },
  { id: "inputs" as const, label: "Inputs", icon: Variable },
  { id: "config" as const, label: "Config", icon: Settings },
  { id: "connections" as const, label: "Connect", icon: Link },
  { id: "test" as const, label: "Test", icon: Play },
];

export function EditorInspector() {
  const { activeTab, setActiveTab } = useWorkflowEditorStore();

  return (
    <aside className="w-80 border-l border-slate-700 bg-slate-800/30 flex flex-col shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                isActive
                  ? "text-cyan-400 border-b-2 border-cyan-400 bg-slate-700/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/20"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "palette" && <ToolPalette />}
        {activeTab === "inputs" && <InputsPanel />}
        {activeTab === "config" && <ConfigPanel />}
        {activeTab === "connections" && <ConnectionsPanel />}
        {activeTab === "test" && <TestPanel />}
      </div>
    </aside>
  );
}




