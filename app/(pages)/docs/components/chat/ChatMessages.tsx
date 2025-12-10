"use client";

import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { Bot, Loader2 } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "../../store/types";

interface ChatMessagesProps {
  messages: ChatMessageType[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="p-4 bg-muted rounded-full mb-4">
          <Bot className="h-8 w-8 text-muted-foreground" />
        </div>
        <h4 className="font-medium mb-2">Chat with AI</h4>
        <p className="text-sm text-muted-foreground">
          Ask questions about your document or request edits. The AI can read and modify your content.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">AI is thinking...</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
