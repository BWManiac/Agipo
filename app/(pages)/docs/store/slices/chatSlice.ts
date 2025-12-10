/**
 * Chat Slice
 * 
 * Manages AI chat state and message handling.
 * Handles sending messages, streaming responses, and tool calls.
 */

import type { StateCreator } from "zustand";
import { nanoid } from "nanoid";
import type { DocsStore } from "../types";

// Chat Message Type
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolCalls?: Array<{
    tool: string;
    args: Record<string, unknown>;
    result?: unknown;
  }>;
}

// 1. State Interface
export interface ChatSliceState {
  /** Chat message history */
  messages: ChatMessage[];
  
  /** Loading state for chat operations */
  isLoading: boolean;
  
  /** Selected agent ID for chat */
  selectedAgentId: string | null;
  
  /** Current thread ID for conversation continuity */
  threadId: string | null;
}

// 2. Actions Interface
export interface ChatSliceActions {
  /** Send a message to the AI and stream the response */
  sendMessage: (message: string, docId: string) => Promise<void>;
  
  /** Set the selected agent ID */
  setSelectedAgent: (agentId: string | null) => void;
  
  /** Clear all chat messages and reset thread */
  clearChat: () => void;
  
  /** Set the current thread ID */
  setThreadId: (threadId: string | null) => void;
}

// 3. Combined Slice Type
export type ChatSlice = ChatSliceState & ChatSliceActions;

// 4. Initial State
const initialState: ChatSliceState = {
  messages: [],
  isLoading: false,
  selectedAgentId: null,
  threadId: null,
};

// 5. Slice Creator
export const createChatSlice: StateCreator<
  DocsStore,
  [],
  [],
  ChatSlice
> = (set, get) => ({
  ...initialState,

  sendMessage: async (message, docId) => {
    console.log("[ChatSlice] Sending message:", message);
    
    const userMessage: ChatMessage = {
      id: nanoid(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
    }));

    try {
      const { selectedAgentId, threadId } = get();

      const response = await fetch(`/api/docs/${docId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          agentId: selectedAgentId,
          threadId,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      // Handle SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      let assistantContent = "";
      const toolCalls: ChatMessage["toolCalls"] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "text") {
                assistantContent += data.content;
              } else if (data.type === "tool_call") {
                toolCalls.push({
                  tool: data.tool,
                  args: data.args,
                  result: data.result,
                });
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      const assistantMessage: ChatMessage = {
        id: nanoid(),
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));

      // Refresh document if there were tool calls that modified it
      if (toolCalls.length > 0) {
        console.log("[ChatSlice] Tool calls detected, refreshing document");
        const refreshResponse = await fetch(`/api/docs/${docId}`);
        if (refreshResponse.ok) {
          const { document } = await refreshResponse.json();
          get().setDocument(document);
          get().setContent(document.content);
        }
      }

      console.log("[ChatSlice] Message sent and response received");
    } catch (error) {
      console.error("[ChatSlice] Error sending message:", error);

      const errorMessage: ChatMessage = {
        id: nanoid(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };

      set((state) => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
      }));
    }
  },

  setSelectedAgent: (agentId) => {
    console.log("[ChatSlice] Setting selected agent:", agentId);
    set({ selectedAgentId: agentId });
  },

  clearChat: () => {
    console.log("[ChatSlice] Clearing chat");
    set({ messages: [], threadId: null });
  },

  setThreadId: (threadId) => {
    console.log("[ChatSlice] Setting thread ID:", threadId);
    set({ threadId });
  },
});
