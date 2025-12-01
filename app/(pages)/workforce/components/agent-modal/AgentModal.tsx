"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { AgentConfig } from "@/_tables/types";
import { AgentHeader } from "./components/AgentHeader";
import { OverviewTab } from "./components/tabs/OverviewTab";
import { ChatTab } from "./components/tabs/ChatTab";
import { CapabilitiesTab } from "./components/tabs/CapabilitiesTab";
import { TasksTab } from "./components/tabs/TasksTab";
import { PlannerTab } from "./components/tabs/PlannerTab";
import { RecordsTab } from "./components/tabs/RecordsTab";
import { ConfigTab } from "./components/tabs/ConfigTab";

export type AgentModalProps = {
  agent: AgentConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type TabId = "overview" | "chat" | "tasks" | "planner" | "records" | "capabilities" | "config";

export function AgentModal({ agent, open, onOpenChange }: AgentModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

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
      case "capabilities":
        return <CapabilitiesTab agent={agent} />;
      case "config":
        return <ConfigTab agent={agent} />;
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
