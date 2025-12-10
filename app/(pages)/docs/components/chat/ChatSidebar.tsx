"use client";

import { X, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocsStore } from "../../store";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

interface ChatSidebarProps {
  docId: string;
}

export function ChatSidebar({ docId }: ChatSidebarProps) {
  const isChatOpen = useDocsStore((state) => state.isChatOpen);
  const setChatOpen = useDocsStore((state) => state.setChatOpen);
  const messages = useDocsStore((state) => state.messages);
  const isLoading = useDocsStore((state) => state.isLoading);

  if (!isChatOpen) return null;

  return (
    <div className="w-80 border-l bg-background flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">AI Assistant</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setChatOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <ChatMessages messages={messages} isLoading={isLoading} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <ChatInput docId={docId} />
      </div>
    </div>
  );
}
