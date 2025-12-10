"use client";

import { useDocsStore } from "../../store";
import { ChatArea } from "./ChatArea";
import { ChatEmpty } from "./ChatEmpty";
import { Button } from "@/components/ui/button";
import { MessageSquare, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentPicker } from "./AgentPicker";

interface ChatSidebarProps {
  docId: string;
}

export function ChatSidebar({ docId }: ChatSidebarProps) {
  const store = useDocsStore();
  const { chatCollapsed, toggleChat, selectedAgentId, messages } = store;

  if (chatCollapsed) {
    return (
      <div className="w-12 border-l flex items-center justify-center">
        <Button variant="ghost" size="icon" onClick={toggleChat}>
          <MessageSquare className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("w-80 border-l flex flex-col shrink-0")}>
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">Chat</h2>
        <Button variant="ghost" size="icon" onClick={toggleChat}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      <AgentPicker />

      {selectedAgentId ? (
        messages.length > 0 ? (
          <ChatArea docId={docId} />
        ) : (
          <ChatEmpty />
        )
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select an agent to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}
