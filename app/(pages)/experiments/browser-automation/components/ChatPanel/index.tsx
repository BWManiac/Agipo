"use client";

import { useBrowserStore } from "../../store";
import { ChatArea } from "./ChatArea";
import { ChatEmpty } from "./ChatEmpty";
import { ChatInput } from "./ChatInput";
import { ActionLog } from "../ActionLog";
import { MessageSquare, List } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatPanel() {
  const chatPanelTab = useBrowserStore((state) => state.chatPanelTab);
  const setChatPanelTab = useBrowserStore((state) => state.setChatPanelTab);
  const activeSessionId = useBrowserStore((state) => state.activeSessionId);
  const messages = useBrowserStore((state) => state.messages);
  const actions = useBrowserStore((state) => state.actions);

  // Count actions for current session
  const sessionActionCount = actions.filter(
    (a) => a.sessionId === activeSessionId
  ).length;

  return (
    <div className="w-[400px] border-r bg-white flex flex-col">
      {/* Tabs */}
      <div className="h-12 border-b flex items-center px-2 shrink-0">
        <button
          onClick={() => setChatPanelTab("chat")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            chatPanelTab === "chat"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-gray-100"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Chat
          {messages.length > 0 && (
            <span className="ml-1 text-xs opacity-70">({messages.length})</span>
          )}
        </button>
        <button
          onClick={() => setChatPanelTab("actions")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            chatPanelTab === "actions"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-gray-100"
          )}
        >
          <List className="h-4 w-4" />
          Actions
          {sessionActionCount > 0 && (
            <span className="ml-1 text-xs opacity-70">
              ({sessionActionCount})
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!activeSessionId ? (
          <NoSessionState />
        ) : chatPanelTab === "chat" ? (
          <ChatContent />
        ) : (
          <ActionLog />
        )}
      </div>
    </div>
  );
}

function NoSessionState() {
  return (
    <div className="flex-1 flex items-center justify-center text-center p-6">
      <div>
        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">
          Select or create a session to start chatting
        </p>
      </div>
    </div>
  );
}

function ChatContent() {
  const messages = useBrowserStore((state) => state.messages);

  return (
    <>
      {/* Messages area or empty state */}
      {messages.length === 0 ? <ChatEmpty /> : <ChatArea />}

      {/* Input */}
      <ChatInput />
    </>
  );
}
