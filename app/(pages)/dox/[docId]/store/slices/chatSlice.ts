/**
 * Chat Slice
 * 
 * Manages chat messages, streaming, and thread state.
 */

import type { StateCreator } from "zustand";
import type { DocsStore } from "../types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
  toolCalls?: Array<{
    id: string;
    name: string;
    status: "pending" | "running" | "completed" | "failed";
    args?: Record<string, unknown>;
    result?: unknown;
  }>;
}

// 1. State Interface
export interface ChatSliceState {
  messages: ChatMessage[];
  isStreaming: boolean;
  selectedAgentId: string | null;
  threadId: string | null;
  error: string | null;
}

// 2. Actions Interface
export interface ChatSliceActions {
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  setIsStreaming: (streaming: boolean) => void;
  setSelectedAgent: (agentId: string | null) => void;
  setThreadId: (threadId: string | null) => void;
  setError: (error: string | null) => void;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
}

// 3. Combined Slice Type
export type ChatSlice = ChatSliceState & ChatSliceActions;

// 4. Initial State
const initialState: ChatSliceState = {
  messages: [],
  isStreaming: false,
  selectedAgentId: null,
  threadId: null,
  error: null,
};

// 5. Slice Creator
export const createChatSlice: StateCreator<
  DocsStore,
  [],
  [],
  ChatSlice
> = (set, get) => ({
  ...initialState,

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  setIsStreaming: (streaming) => set({ isStreaming: streaming }),

  setSelectedAgent: (agentId) => set({ selectedAgentId: agentId }),

  setThreadId: (threadId) => set({ threadId }),

  setError: (error) => set({ error }),

  sendMessage: async (text: string) => {
    const state = get();
    const docId = state.docId;
    const { selectedAgentId, threadId } = state;

    if (!docId || !selectedAgentId || !text.trim()) {
      console.warn("[Chat] Missing docId or agentId");
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      createdAt: new Date(),
    };
    set((s) => ({ messages: [...s.messages, userMessage] }));

    // Create assistant message placeholder
    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date(),
    };
    set((s) => ({ messages: [...s.messages, assistantMessage], isStreaming: true, error: null }));

    try {
      const res = await fetch(`/api/dox/${docId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...state.messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          agentId: selectedAgentId,
          threadId: threadId || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Chat request failed");
      }

      // Read streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);
            if (jsonStr === "[DONE]") continue;

            try {
              const data = JSON.parse(jsonStr);
              if (data.type === "text-delta" && data.delta) {
                fullContent += data.delta;
                set((s) => ({
                  messages: s.messages.map((m) =>
                    m.id === assistantId ? { ...m, content: fullContent } : m
                  ),
                }));
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      set({ isStreaming: false });

      // Update thread ID from header
      const threadIdHeader = res.headers.get("X-Thread-Id");
      if (threadIdHeader) {
        set({ threadId: threadIdHeader });
      }
    } catch (error) {
      console.error("[Chat] Send error:", error);
      set({
        isStreaming: false,
        error: error instanceof Error ? error.message : "Failed to send message",
      });
    }
  },

  clearMessages: () => set({ messages: [] }),
});
