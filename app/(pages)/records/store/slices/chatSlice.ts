/**
 * Chat Slice
 * Manages chat messages, streaming state, and message sending.
 */

import type { StateCreator } from "zustand";
import type { RecordsStore } from "../types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
  toolCalls?: Array<{
    id: string;
    name: string;
    status: "pending" | "success" | "error";
    result?: string;
  }>;
}

// 1. State Interface
export interface ChatSliceState {
  messages: ChatMessage[];
  isStreaming: boolean;
  isLoadingMessages: boolean;
  chatError: string | null;
}

// 2. Actions Interface
export interface ChatSliceActions {
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  setIsStreaming: (streaming: boolean) => void;
  setIsLoadingMessages: (loading: boolean) => void;
  setChatError: (error: string | null) => void;
  loadThreadMessages: (tableId: string, threadId: string) => Promise<void>;
  sendMessage: (tableId: string, text: string) => Promise<void>;
}

// 3. Combined Slice Type
export type ChatSlice = ChatSliceState & ChatSliceActions;

// 4. Initial State
const initialState: ChatSliceState = {
  messages: [],
  isStreaming: false,
  isLoadingMessages: false,
  chatError: null,
};

// 5. Slice Creator
export const createChatSlice: StateCreator<
  RecordsStore,
  [],
  [],
  ChatSlice
> = (set, get) => ({
  ...initialState,

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),

  updateMessage: (id, updates) => set((s) => ({
    messages: s.messages.map((m) => m.id === id ? { ...m, ...updates } : m),
  })),

  clearMessages: () => set({ messages: [] }),

  setIsStreaming: (streaming) => set({ isStreaming: streaming }),

  setIsLoadingMessages: (loading) => set({ isLoadingMessages: loading }),

  setChatError: (error) => set({ chatError: error }),

  loadThreadMessages: async (tableId, threadId) => {
    const state = get();
    const agentId = state.selectedAgentId;

    set({ messages: [], isLoadingMessages: true, chatError: null });

    if (!agentId || threadId.startsWith("local-")) {
      set({ isLoadingMessages: false });
      return;
    }

    try {
      const res = await fetch(`/api/records/${tableId}/threads/${threadId}?agentId=${agentId}`);
      if (!res.ok) {
        set({ isLoadingMessages: false });
        return;
      }

      const data = await res.json();
      const messages: ChatMessage[] = (data.messages || []).map((m: Record<string, unknown>) => ({
        id: m.id as string,
        role: m.role as "user" | "assistant" | "system",
        content: m.content as string,
        createdAt: new Date(m.createdAt as string || Date.now()),
      }));

      set({ messages, isLoadingMessages: false });
    } catch (error) {
      console.error("[ChatSlice] Load messages failed:", error);
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (tableId, text) => {
    const state = get();
    const agentId = state.selectedAgentId;
    const threadId = state.activeThreadId;

    if (!agentId || !text.trim()) return;

    // Add user message optimistically
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      createdAt: new Date(),
    };
    set((s) => ({ messages: [...s.messages, userMessage] }));

    // Create placeholder for assistant response
    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date(),
    };
    set((s) => ({
      messages: [...s.messages, assistantMessage],
      isStreaming: true,
      chatError: null,
    }));

    try {
      const res = await fetch(`/api/records/${tableId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: state.messages.concat(userMessage).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          agentId,
          threadId,
          tableId,
        }),
      });

      if (!res.ok) {
        throw new Error("Chat request failed");
      }

      // Read streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;

          // Update the assistant message content
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === assistantId ? { ...m, content: fullContent } : m
            ),
          }));
        }
      }

      set({ isStreaming: false });

      // Auto-title thread on first message
      if (state.messages.length === 0 && threadId) {
        const preview = text.slice(0, 50) + (text.length > 50 ? "..." : "");
        get().updateThreadTitle(threadId, preview);
      }
    } catch (error) {
      console.error("[ChatSlice] Send failed:", error);
      set({
        isStreaming: false,
        chatError: error instanceof Error ? error.message : "Failed to send message",
      });
      // Remove failed assistant message
      set((s) => ({
        messages: s.messages.filter((m) => m.id !== assistantId),
      }));
    }
  },
});
