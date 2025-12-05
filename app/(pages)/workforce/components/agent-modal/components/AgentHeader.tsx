"use client";

import { X, Maximize2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgentConfig } from "@/_tables/types";
import { type TabId } from "../AgentModal";

interface AgentHeaderProps {
  agent: AgentConfig;
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
  onClose: () => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "chat", label: "Chat" },
  { id: "tasks", label: "Tasks" },
  { id: "planner", label: "Planner" },
  { id: "records", label: "Records" },
  { id: "knowledge", label: "Knowledge" },
  { id: "capabilities", label: "Capabilities" },
  { id: "config", label: "Config" },
];

export function AgentHeader({ agent, activeTab, onTabChange, onClose }: AgentHeaderProps) {
  return (
    <div className="h-16 border-b flex items-center px-6 justify-between bg-white shrink-0">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarImage src={agent.avatar} />
          <AvatarFallback className="rounded-lg text-xs">{agent.name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-sm font-bold text-gray-900">{agent.name}</h1>
          <p className="text-xs text-gray-500">
            {agent.role} • <span className="text-green-600 font-medium capitalize">{agent.status}</span>
          </p>
        </div>
      </div>

      <div className="flex gap-1 h-full items-end">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "px-3 pb-4 -mb-[1px] text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "text-black border-black"
                : "text-gray-500 border-transparent hover:text-black"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

