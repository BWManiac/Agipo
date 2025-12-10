"use client";

import { useState, useRef, useEffect } from "react";
import { useRecordsStore } from "../../store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Check, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatAreaProps {
  tableId: string;
}

export function ChatArea({ tableId }: ChatAreaProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isStreaming,
    isLoadingMessages,
    chatError,
    sendMessage,
    getSelectedAgent,
  } = useRecordsStore();

  const agent = getSelectedAgent();

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const text = input;
    setInput("");
    await sendMessage(tableId, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">Send a message to start chatting with {agent?.name}</p>
            <p className="text-xs mt-1">Ask questions about this table or request data changes</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                )}
              >
                {/* Tool calls */}
                {message.toolCalls?.map((tool) => (
                  <div
                    key={tool.id}
                    className={cn(
                      "flex items-center gap-2 text-xs mb-2 p-2 rounded",
                      tool.status === "pending" && "bg-amber-50 border border-amber-200",
                      tool.status === "success" && "bg-green-50 border border-green-200",
                      tool.status === "error" && "bg-red-50 border border-red-200"
                    )}
                  >
                    {tool.status === "pending" && (
                      <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />
                    )}
                    {tool.status === "success" && (
                      <Check className="h-3 w-3 text-green-600" />
                    )}
                    {tool.status === "error" && (
                      <X className="h-3 w-3 text-red-600" />
                    )}
                    <span
                      className={cn(
                        tool.status === "pending" && "text-amber-700",
                        tool.status === "success" && "text-green-700",
                        tool.status === "error" && "text-red-700"
                      )}
                    >
                      {tool.status === "pending" ? "Executing" : tool.status === "success" ? "Executed" : "Failed"}:{" "}
                      {tool.name}
                    </span>
                  </div>
                ))}

                {/* Message content */}
                <div className="whitespace-pre-wrap">{message.content}</div>

                {/* Streaming indicator */}
                {message.role === "assistant" && isStreaming && message.content === "" && (
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {chatError && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">{chatError}</p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this table..."
            className="min-h-[40px] max-h-[120px] resize-none"
            disabled={isStreaming}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isStreaming}
            className="shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Agent can read, add, and update rows in this table.
        </p>
      </form>
    </div>
  );
}
