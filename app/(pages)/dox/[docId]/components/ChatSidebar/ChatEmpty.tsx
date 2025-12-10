"use client";

import { useDocsStore } from "../../store";
import { MessageSquare } from "lucide-react";

export function ChatEmpty() {
  const store = useDocsStore();
  const agent = store.selectedAgentId ? { name: "Agent" } : null;

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="text-center text-muted-foreground">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Start a conversation with {agent?.name || "an agent"}</p>
        <p className="text-xs mt-1">Ask questions or request edits to this document</p>
      </div>
    </div>
  );
}
