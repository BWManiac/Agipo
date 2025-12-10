"use client";

import { useEffect, useRef } from "react";
import { useBrowserStore, type ChatMessage } from "../../store";
import { ActionBadge } from "./ActionBadge";
import { User, Bot, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatArea() {
  const messages = useBrowserStore((state) => state.messages);
  const chatError = useBrowserStore((state) => state.chatError);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {chatError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{chatError}</span>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] space-y-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2 text-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-gray-100 text-foreground rounded-bl-md"
          )}
        >
          {message.content || (
            <span className="text-muted-foreground italic">Working...</span>
          )}
        </div>

        {message.steps && message.steps.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {message.steps.map((step) => (
              <ActionBadge key={step.id} step={step} />
            ))}
          </div>
        ) : null}

        {message.result && typeof message.result === "object" ? (
          <div className="bg-gray-50 border rounded-lg p-3 text-xs font-mono overflow-auto max-h-48">
            <pre>{JSON.stringify(message.result, null, 2)}</pre>
          </div>
        ) : null}

        <div className="text-xs text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-gray-600" />
        </div>
      )}
    </div>
  );
}
