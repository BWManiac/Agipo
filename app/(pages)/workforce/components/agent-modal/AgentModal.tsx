"use client";

import { useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { AgentConfig } from "@/_tables/types";
import { useAgentModalStore } from "./store";
import { AgentHeader } from "./components/AgentHeader";
import { OverviewTab } from "./components/tabs/OverviewTab";
import { ChatTab } from "./components/tabs/ChatTab";
import { CapabilitiesTab } from "./components/tabs/CapabilitiesTab";
import { TasksTab } from "./components/tabs/TasksTab";
import { PlannerTab } from "./components/tabs/PlannerTab";
import { RecordsTab } from "./components/tabs/RecordsTab";
import { ConfigTab } from "./components/tabs/ConfigTab";
import { KnowledgeTab } from "./components/tabs/KnowledgeTab";

export type AgentModalProps = {
  agent: AgentConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgentUpdated?: () => void;
};

export type TabId = "overview" | "chat" | "tasks" | "planner" | "records" | "knowledge" | "capabilities" | "config";

export function AgentModal({ agent, open, onOpenChange, onAgentUpdated }: AgentModalProps) {
  const activeTab = useAgentModalStore((state) => state.activeTab);
  const setActiveTab = useAgentModalStore((state) => state.setActiveTab);
  const setAgent = useAgentModalStore((state) => state.setAgent);
  const resetEditorState = useAgentModalStore((state) => state.resetEditorState);

  // Update agent in store when prop changes
  useEffect(() => {
    setAgent(agent);
    
    // Reset editor state when modal closes
    if (!open) {
      resetEditorState();
    }
  }, [agent, open, setAgent, resetEditorState]);

  if (!agent) return null;

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab agent={agent} onTabChange={setActiveTab} />;
      case "chat":
        return <ChatTab agent={agent} />;
      case "tasks":
        return <TasksTab agent={agent} />;
      case "planner":
        return <PlannerTab agent={agent} />;
      case "records":
        return <RecordsTab agent={agent} />;
      case "knowledge":
        return <KnowledgeTab agent={agent} />;
      case "capabilities":
        return <CapabilitiesTab agent={agent} />;
      case "config":
        return <ConfigTab agent={agent} onAgentUpdated={onAgentUpdated} />;
      default:
        return <div className="p-8 text-gray-500 text-sm text-center">Content for {activeTab} coming soon...</div>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] max-w-[1400px] h-[85vh] sm:max-w-[1400px] bg-white p-0 gap-0 overflow-hidden rounded-2xl flex flex-col border-none shadow-2xl"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Agent Dashboard: {agent.name}</DialogTitle>
        
        <AgentHeader
          agent={agent}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => onOpenChange(false)}
        />

        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
