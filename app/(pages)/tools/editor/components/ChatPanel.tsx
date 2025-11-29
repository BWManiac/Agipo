"use client";

/**
 * @file app/(pages)/workflow-generator/components/ChatPanel.tsx
 * @description The main component for the AI assistant chat panel. This component
 * has been refactored to be a "thin" orchestrator. Its primary
 * responsibilities are:
 *   1. Setting up the `useChat` hook with our custom transport.
 *   2. Managing the simple state of the text input.
 *   3. Calling the `useChatTools` hook to handle all complex tool-related logic.
 *   4. Rendering the overall layout and mapping over messages to render the
 *      `ChatMessage` component for each one.
 * This keeps the component lean and focused on presentation, while all the
 * heavy lifting is delegated to the custom hooks in the `chat-panel/` directory.
 */

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputTools,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { useChatTransport } from "./chat-panel/hooks/useChatTransport";
import { useChatTools } from "./chat-panel/hooks/useChatTools";
import { ChatMessage } from "./chat-panel/ChatMessage";

export function ChatPanel() {
  const transport = useChatTransport();
  const { messages, sendMessage, status, addToolResult } = useChat({
    transport,
  });
  const [input, setInput] = useState("");

  // This custom hook now contains all the complex logic for processing tool calls.
  useChatTools({ messages, addToolResult });

  const handlePromptSubmit = ({ text }: PromptInputMessage) => {
    const trimmed = (text ?? "").trim();
    if (!trimmed) {
      return;
    }
    setInput("");

    return sendMessage({
      text: trimmed,
    });
  };

  const isSending = status === "submitted" || status === "streaming";
  const isSubmitDisabled = isSending || input.trim() === "";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 360,
        borderRight: "1px solid var(--border)",
        height: "100vh",
      }}
    >
      <div style={{ padding: "12px 12px 8px 12px", fontWeight: 600 }}>
        Assistant
      </div>
      <Conversation>
        {messages.length === 0 ? (
          <ConversationEmptyState
            title="Start chatting"
            description="Ask to change Flow/Spec/Code or just say hello."
          />
        ) : (
          <ConversationContent>
            {messages
              .filter((message) => message.role !== "system")
              .map((message) => (
                <ChatMessage message={message} key={message.id} />
              ))}
          </ConversationContent>
        )}
        <ConversationScrollButton />
      </Conversation>
      <div
        style={{
          padding: 12,
          borderTop: "1px solid var(--border)",
        }}
      >
        <PromptInput onSubmit={handlePromptSubmit}>
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              onChange={(event) => setInput(event.currentTarget.value)}
              placeholder="Ask the assistant..."
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools />
            <PromptInputSubmit
              status={status}
              disabled={isSubmitDisabled}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

