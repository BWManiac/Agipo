"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Layers, 
  Settings, 
  Plug, 
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  Database
} from "lucide-react";
import { useWorkflowEditorStore } from "../store";
import type { ActivePanel } from "../store/types";
import { ToolPalette, InputsPanel, ConnectionsPanel, TestPanel, TablesPanel } from "./panels";

interface EditorSidebarProps {
  className?: string;
}

export function EditorSidebar({ className }: EditorSidebarProps) {
  const { 
    activePanel, 
    setActivePanel,
    isSidebarCollapsed,
    toggleSidebar
  } = useWorkflowEditorStore();

  if (isSidebarCollapsed) {
    return (
      <div className={cn("w-12 border-r bg-slate-50 flex flex-col", className)}>
        <Button
          variant="ghost"
          size="icon"
          className="m-2"
          onClick={toggleSidebar}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside className={cn("w-64 border-r bg-slate-50 flex flex-col", className)}>
      {/* Collapse button */}
      <div className="flex items-center justify-between p-2 border-b">
        <span className="text-sm font-medium text-slate-600">Panels</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={toggleSidebar}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
      </div>

      {/* Panel tabs */}
      <nav className="flex-1 p-2 space-y-1">
        <PanelButton
          panel="palette"
          currentPanel={activePanel}
          onClick={() => setActivePanel("palette")}
          icon={<Layers className="h-4 w-4" />}
          label="Tool Palette"
          description="Browse and add tools"
        />
        <PanelButton
          panel="inputs"
          currentPanel={activePanel}
          onClick={() => setActivePanel("inputs")}
          icon={<Settings className="h-4 w-4" />}
          label="Inputs & Config"
          description="Define runtime inputs"
        />
        <PanelButton
          panel="connections"
          currentPanel={activePanel}
          onClick={() => setActivePanel("connections")}
          icon={<Plug className="h-4 w-4" />}
          label="Connections"
          description="Required integrations"
        />
        <PanelButton
          panel="tables"
          currentPanel={activePanel}
          onClick={() => setActivePanel("tables")}
          icon={<Database className="h-4 w-4" />}
          label="Tables"
          description="Table requirements"
        />
        <PanelButton
          panel="test"
          currentPanel={activePanel}
          onClick={() => setActivePanel("test")}
          icon={<FlaskConical className="h-4 w-4" />}
          label="Test"
          description="Run and debug"
        />
      </nav>

      {/* Panel content */}
      <div className="flex-1 border-t overflow-hidden">
        <PanelContent panel={activePanel} />
      </div>
    </aside>
  );
}

interface PanelButtonProps {
  panel: ActivePanel;
  currentPanel: ActivePanel;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
}

function PanelButton({ 
  panel, 
  currentPanel, 
  onClick, 
  icon, 
  label, 
  description 
}: PanelButtonProps) {
  const isActive = panel === currentPanel;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-2 rounded-lg text-left transition-colors",
        isActive 
          ? "bg-white shadow-sm border" 
          : "hover:bg-white/50"
      )}
    >
      <div className={cn(
        "p-1.5 rounded-md",
        isActive ? "bg-primary text-primary-foreground" : "bg-slate-200 text-slate-600"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-slate-500 truncate">{description}</div>
      </div>
    </button>
  );
}

function PanelContent({ panel }: { panel: ActivePanel }) {
  switch (panel) {
    case "palette":
      return <ToolPalette />;
    case "inputs":
      return <InputsPanel />;
    case "connections":
      return <ConnectionsPanel />;
    case "tables":
      return <TablesPanel />;
    case "test":
      return <TestPanel />;
    default:
      return null;
  }
}

