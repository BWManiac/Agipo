"use client";

import { useWorkflowsBStore, type RightPanelTab } from "../../editor/store";
import { cn } from "@/lib/utils";
import { ToolsPanel } from "./panels/ToolsPanel";
import { InputsPanel } from "./panels/InputsPanel";
import { ConfigPanel } from "./panels/ConfigPanel";
import { ConnectPanel } from "./panels/ConnectPanel";
import { TestPanel } from "./panels/TestPanel";

/**
 * RightPanel - Tabbed panel container
 * Based on Variation 1 (lines 326-479)
 */
export function RightPanel() {
  const rightPanelTab = useWorkflowsBStore(state => state.rightPanelTab);
  const setRightPanelTab = useWorkflowsBStore(state => state.setRightPanelTab);
  
  const tabs: { id: RightPanelTab; label: string }[] = [
    { id: "tools", label: "Tools" },
    { id: "inputs", label: "Inputs" },
    { id: "config", label: "Config" },
    { id: "connect", label: "Connect" },
    { id: "test", label: "Test" },
  ];
  
  return (
    <aside className="w-80 border-l border-gray-200 bg-white flex flex-col shrink-0">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-gray-50 px-1 pt-1 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setRightPanelTab(tab.id)}
            className={cn(
              "px-3 py-2 text-xs font-medium rounded-t-lg border border-transparent -mb-px transition-colors",
              rightPanelTab === tab.id
                ? "bg-white border-gray-200 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            )}
            style={rightPanelTab === tab.id ? { borderBottomColor: "white" } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Panel content */}
      <div className="flex-1 overflow-hidden p-4">
        {rightPanelTab === "tools" && <ToolsPanel />}
        {rightPanelTab === "inputs" && <InputsPanel />}
        {rightPanelTab === "config" && <ConfigPanel />}
        {rightPanelTab === "connect" && <ConnectPanel />}
        {rightPanelTab === "test" && <TestPanel />}
      </div>
    </aside>
  );
}

