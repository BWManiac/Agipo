"use client";

import { useCallback, useState, useMemo } from "react";
import type { UIMessage } from "ai";
import { SendHorizontal, Loader2 } from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { cn } from "@/lib/utils";

interface ChatAreaProps {
  agentName: string;
  agentEmoji?: string;
  messages: UIMessage[];
  isStreaming: boolean;
  isLoadingMessages?: boolean;
  defaultPrompt?: string;
  onSendMessage: (text: string) => void;
}

export function ChatArea({
  agentName,
  agentEmoji = "🧭",
  messages,
  isStreaming,
  isLoadingMessages = false,
  defaultPrompt = "",
  onSendMessage,
}: ChatAreaProps) {
  const [input, setInput] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSendMessage(trimmed);
    setInput("");
  }, [input, isStreaming, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Build display messages with optional greeting
  const displayMessages = useMemo(() => {
    const initialGreeting: UIMessage[] =
      defaultPrompt.trim().length > 0 && messages.length === 0
        ? [
            {
              id: "agent-greeting",
              role: "assistant" as const,
              parts: [{ type: "text" as const, text: defaultPrompt }],
            },
          ]
        : [];
    return [...initialGreeting, ...messages];
  }, [messages, defaultPrompt]);

  const isEmpty = displayMessages.length === 0;

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
      {/* Messages Area */}
      <Conversation className="flex-1">
        {isLoadingMessages ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">Loading conversation...</span>
            </div>
          </div>
        ) : isEmpty ? (
          <ConversationEmptyState
            title={`Start a conversation with ${agentName}`}
            description="Ask questions, request updates, or assign tasks. The agent will remember context from previous conversations."
            icon={<span className="text-4xl">{agentEmoji}</span>}
          />
        ) : (
          <ConversationContent className="py-6 px-6">
            {displayMessages.map((message) => {
              const isUser = message.role === "user";
              const isAssistant = message.role === "assistant";

              // Extract text content from parts
              const textContent = message.parts
                ?.filter((p) => p.type === "text")
                .map((p) => (p as { type: "text"; text: string }).text)
                .join("\n");

              if (!textContent) return null;

              return (
                <Message key={message.id} from={message.role}>
                  {isAssistant && (
                    <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0 flex items-center justify-center text-sm mt-1">
                      {agentEmoji}
                    </div>
                  )}
                  <MessageContent
                    className={cn(
                      isUser && "bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-4 py-3"
                    )}
                  >
                    {isAssistant ? (
                      <MessageResponse>{textContent}</MessageResponse>
                    ) : (
                      <span className="text-sm">{textContent}</span>
                    )}
                  </MessageContent>
                  {isUser && (
                    <div className="w-8 h-8 bg-foreground text-background rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium mt-1">
                      ME
                    </div>
                  )}
                </Message>
              );
            })}

            {/* Streaming indicator */}
            {isStreaming && (
              <Message from="assistant">
                <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0 flex items-center justify-center text-sm mt-1">
                  {agentEmoji}
                </div>
                <MessageContent>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
        )}
        <ConversationScrollButton />
      </Conversation>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <PromptInput
          className="relative bg-background border border-border rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary transition-all"
          onSubmit={handleSubmit}
        >
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${agentName}...`}
            className="min-h-[56px] pr-14 resize-none border-0 focus:ring-0 bg-transparent"
            disabled={isStreaming}
          />
          <PromptInputSubmit
            disabled={!input.trim() || isStreaming}
            className="absolute bottom-2 right-2"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SendHorizontal className="w-4 h-4" />
            )}
          </PromptInputSubmit>
        </PromptInput>
      </div>
    </div>
  );
}

