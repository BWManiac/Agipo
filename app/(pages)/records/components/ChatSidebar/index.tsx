"use client";

import { useEffect } from "react";
import { useRecordsStore } from "../../store";
import { AgentPicker } from "./AgentPicker";
import { ThreadList } from "./ThreadList";
import { ChatArea } from "./ChatArea";
import { Button } from "@/components/ui/button";
import { MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  tableId: string;
}

export function ChatSidebar({ tableId }: ChatSidebarProps) {
  const {
    sidebarOpen,
    toggleSidebar,
    selectedAgentId,
    fetchAgents,
    fetchThreads,
    activeThreadId,
  } = useRecordsStore();

  // Load agents on mount
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Load saved agent preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAgent = localStorage.getItem(`records-agent-${tableId}`);
      if (savedAgent) {
        useRecordsStore.getState().selectAgent(savedAgent);
      }
    }
  }, [tableId]);

  // Fetch threads when agent changes
  useEffect(() => {
    if (selectedAgentId) {
      fetchThreads(tableId);
    }
  }, [selectedAgentId, tableId, fetchThreads]);

  // Collapsed state
  if (!sidebarOpen) {
    return (
      <div className="w-12 border-l bg-white flex flex-col items-center py-4 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="mb-2"
          title="Expand chat"
        >
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
        </Button>
        {selectedAgentId && (
          <div className="w-7 h-7 rounded-md bg-secondary border flex items-center justify-center text-sm">
            {useRecordsStore.getState().getSelectedAgent()?.avatar || "🤖"}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-l bg-white flex flex-col shrink-0 transition-all duration-200",
        sidebarOpen ? "w-80" : "w-12"
      )}
    >
      {/* Collapse button */}
      <div className="absolute top-1/2 -left-3 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="h-6 w-6 rounded-full bg-white shadow-sm"
        >
          {sidebarOpen ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Agent Picker */}
      <AgentPicker />

      {/* Thread List (compact) */}
      {selectedAgentId && <ThreadList tableId={tableId} />}

      {/* Chat Area */}
      {selectedAgentId && activeThreadId ? (
        <ChatArea tableId={tableId} />
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-muted-foreground">
            {!selectedAgentId ? (
              <>
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select an agent to start chatting</p>
              </>
            ) : (
              <>
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Start a new conversation</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
