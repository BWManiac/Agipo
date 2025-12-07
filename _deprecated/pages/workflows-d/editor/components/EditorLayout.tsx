"use client";

import { ReactNode } from "react";
import { useWorkflowsDStore } from "../store";
import { PanelLeftClose, PanelRightClose, PanelLeft, PanelRight } from "lucide-react";

interface EditorLayoutProps {
  chatPanel: ReactNode;
  mainContent: ReactNode;
  inspectorPanel: ReactNode;
}

export function EditorLayout({ chatPanel, mainContent, inspectorPanel }: EditorLayoutProps) {
  const { 
    isChatPanelCollapsed, 
    isInspectorCollapsed,
    toggleChatPanel,
    toggleInspector 
  } = useWorkflowsDStore();

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Chat Panel (Left) */}
      <div 
        className={`relative border-r border-white/5 bg-slate-900/50 transition-all duration-300 ${
          isChatPanelCollapsed ? "w-0" : "w-80"
        }`}
      >
        {!isChatPanelCollapsed && (
          <div className="h-full overflow-hidden">
            {chatPanel}
          </div>
        )}
        
        {/* Toggle button */}
        <button
          onClick={toggleChatPanel}
          className="absolute -right-3 top-4 z-10 flex items-center justify-center h-6 w-6 rounded-full bg-slate-800 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          {isChatPanelCollapsed ? (
            <PanelLeft className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Main Content (Center) */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/50">
        {mainContent}
      </div>

      {/* Inspector Panel (Right) */}
      <div 
        className={`relative border-l border-white/5 bg-slate-900/50 transition-all duration-300 ${
          isInspectorCollapsed ? "w-0" : "w-80"
        }`}
      >
        {/* Toggle button */}
        <button
          onClick={toggleInspector}
          className="absolute -left-3 top-4 z-10 flex items-center justify-center h-6 w-6 rounded-full bg-slate-800 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          {isInspectorCollapsed ? (
            <PanelRight className="h-3.5 w-3.5" />
          ) : (
            <PanelRightClose className="h-3.5 w-3.5" />
          )}
        </button>

        {!isInspectorCollapsed && (
          <div className="h-full overflow-hidden">
            {inspectorPanel}
          </div>
        )}
      </div>
    </div>
  );
}




