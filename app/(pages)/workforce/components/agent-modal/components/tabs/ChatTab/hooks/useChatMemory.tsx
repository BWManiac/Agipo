"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";

interface UseChatMemoryOptions {
  agentId: string;
  agentName: string;
  threadId: string | null;
  defaultPrompt?: string;
  onFirstMessage?: (messagePreview: string) => void;
}

export function useChatMemory({
  agentId,
  agentName,
  threadId,
  defaultPrompt = "",
  onFirstMessage,
}: UseChatMemoryOptions) {
  const hasCalledFirstMessage = useRef(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/workforce/${agentId}/chat`,
        prepareSendMessagesRequest: async ({
          id,
          messages,
          body,
          trigger,
          messageId,
        }) => ({
          body: {
            ...(body ?? {}),
            id,
            messages,
            trigger,
            messageId,
            agentName,
            context: defaultPrompt,
            threadId, // Pass threadId for memory persistence
          },
        }),
      }),
    [agentId, agentName, defaultPrompt, threadId]
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    id: threadId ?? undefined, // Use threadId as chat ID for isolation
  });

  // Load messages when thread changes
  useEffect(() => {
    async function loadThreadMessages() {
      // Clear messages first
      setMessages([]);
      hasCalledFirstMessage.current = false;

      // If no thread selected, nothing to load
      if (!threadId) return;

      // Don't load messages for new threads (they start with "local-")
      if (threadId.startsWith("local-")) return;

      try {
        setIsLoadingMessages(true);
        const response = await fetch(
          `/api/workforce/${agentId}/threads/${threadId}`
        );

        if (!response.ok) {
          console.warn("[useChatMemory] Failed to load thread messages");
          return;
        }

        const data = await response.json();
        const loadedMessages = data.messages || [];

        // Convert backend messages to UIMessage format
        const uiMessages: UIMessage[] = loadedMessages.map(
          (msg: { id: string; role: string; content: string; createdAt?: string }) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant" | "system",
            parts: [{ type: "text" as const, text: msg.content }],
            createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
          })
        );

        setMessages(uiMessages);
        
        // Mark as having messages if there are user messages
        if (uiMessages.some((m) => m.role === "user")) {
          hasCalledFirstMessage.current = true;
        }
      } catch (error) {
        console.error("[useChatMemory] Error loading messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    }

    loadThreadMessages();
  }, [threadId, agentId, setMessages]);

  // Notify on first user message for auto-title generation
  useEffect(() => {
    if (
      !hasCalledFirstMessage.current &&
      messages.length > 0 &&
      messages[0].role === "user"
    ) {
      hasCalledFirstMessage.current = true;
      const firstMessageText = messages[0].parts
        ?.filter((p) => p.type === "text")
        .map((p) => (p as { text: string }).text)
        .join(" ");
      if (firstMessageText && onFirstMessage) {
        // Generate title from first ~50 chars
        const preview =
          firstMessageText.length > 50
            ? firstMessageText.slice(0, 50) + "..."
            : firstMessageText;
        onFirstMessage(preview);
      }
    }
  }, [messages, onFirstMessage]);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      await sendMessage({ text: trimmed });
    },
    [sendMessage]
  );

  const isStreaming = status === "submitted" || status === "streaming";

  return {
    messages,
    sendMessage: handleSend,
    isStreaming,
    isLoadingMessages,
    status,
  };
}

