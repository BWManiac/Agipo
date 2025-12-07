"use client";

import { Wrench, Settings, Link2, Play, Variable } from "lucide-react";
import { useWorkflowsDStore } from "../../store";
import type { ActivePanel } from "../../store/types";
import { ToolsTab } from "../inspector/ToolsTab";
import { InputsTab } from "../inspector/InputsTab";
import { ConfigTab } from "../inspector/ConfigTab";
import { ConnectTab } from "../inspector/ConnectTab";
import { TestTab } from "../inspector/TestTab";

const TABS: { id: ActivePanel; label: string; icon: React.ReactNode }[] = [
  { id: "tools", label: "Tools", icon: <Wrench className="h-4 w-4" /> },
  { id: "inputs", label: "Inputs", icon: <Variable className="h-4 w-4" /> },
  { id: "config", label: "Config", icon: <Settings className="h-4 w-4" /> },
  { id: "connect", label: "Connect", icon: <Link2 className="h-4 w-4" /> },
  { id: "test", label: "Test", icon: <Play className="h-4 w-4" /> },
];

export function InspectorPanel() {
  const { activePanel, setActivePanel } = useWorkflowsDStore();

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 px-2 py-3 text-xs font-medium transition-colors ${
              activePanel === tab.id
                ? "text-violet-400 border-b-2 border-violet-500 bg-violet-500/5"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activePanel === "tools" && <ToolsTab />}
        {activePanel === "inputs" && <InputsTab />}
        {activePanel === "config" && <ConfigTab />}
        {activePanel === "connect" && <ConnectTab />}
        {activePanel === "test" && <TestTab />}
      </div>
    </div>
  );
}


