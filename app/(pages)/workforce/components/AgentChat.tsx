"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const SYSTEM_TEMPLATE =
  "You’re connected to {{name}}. Ask for updates, approve decisions, or assign tasks.";

export function AgentChat({
  agentId,
  agentName,
  defaultPrompt,
  queuedPrompt,
  onPromptConsumed,
  className,
}: {
  agentId: string;
  agentName: string;
  defaultPrompt: string;
  queuedPrompt?: string | null;
  onPromptConsumed?: () => void;
  className?: string;
}) {
  const [input, setInput] = useState("");
  
    console.log("[AgentChat] Mounting with:", { agentId, agentName, api: `/api/workforce/${agentId}/chat` });
  
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/workforce/${agentId}/chat`,
        prepareSendMessagesRequest: async ({ id, messages, body, trigger, messageId }) => ({
    body: {
            ...(body ?? {}),
            id,
            messages,
            trigger,
            messageId,
            // agentId is now in URL
      agentName,
      context: defaultPrompt,
    },
        }),
      }),
    [agentId, agentName, defaultPrompt]
  );
  
  const { messages, sendMessage, status } = useChat({
    transport,
    initialMessages:
      defaultPrompt.trim().length > 0
        ? [
            {
              id: "agent-greeting",
              role: "assistant",
              parts: [{ type: "text", text: defaultPrompt }],
            } satisfies UIMessage,
          ]
        : [],
  });

  const displayMessages = useMemo(() => {
    const intro: UIMessage = {
      id: "system-intro",
      role: "system",
      parts: [
        {
          type: "text",
          text: SYSTEM_TEMPLATE.replace("{{name}}", agentName),
        },
      ],
    };
    return [intro, ...messages];
  }, [agentName, messages]);

  const textFromMessage = useCallback((message: UIMessage) => {
    return message.parts
      .map((part) => (part.type === "text" ? part.text : ""))
      .filter(Boolean)
      .join("\n");
  }, []);

  const handleSubmit = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setInput("");
      await sendMessage({ text: trimmed });
    },
    [sendMessage]
  );

  useEffect(() => {
    if (!queuedPrompt) return;
    // Wrap in setTimeout to avoid setting state during render (useEffect)
    const timer = setTimeout(() => {
    void handleSubmit(queuedPrompt);
    onPromptConsumed?.();
    }, 0);
    return () => clearTimeout(timer);
  }, [queuedPrompt, handleSubmit, onPromptConsumed]);

  const isSending = status === "submitted" || status === "streaming";

  return (
    <div className={cn("flex h-full flex-col", className)}>
  <ScrollArea className="flex-1 min-h-0 px-6 py-4">
        <div className="space-y-3">
          {displayMessages.map((message) => {
            const text = textFromMessage(message);
            if (!text) {
              return null;
            }
            const isUser = message.role === "user";
            const isAgent = message.role === "assistant";
            const label =
              message.role === "assistant"
                ? agentName
                : message.role === "user"
                  ? "You"
                  : "system";
            return (
              <div key={message.id} className="flex flex-col gap-1">
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {label}
                </div>
                <div
                  className={cn(
                    "max-w-xl rounded-lg border border-border px-4 py-3 text-sm shadow-sm",
                    isUser
                      ? "self-end bg-primary text-primary-foreground"
                      : isAgent
                        ? "bg-background"
                        : "bg-muted"
                  )}
                >
                  {text}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <form
        className="border-t border-border bg-background px-6 py-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit(input);
        }}
      >
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={`Ask ${agentName} for an update or give feedback…`}
          className="min-h-[90px]"
        />
        <div className="mt-3 flex justify-end">
          <Button type="submit" disabled={isSending || !input.trim()}>
            {isSending ? "Sending…" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
