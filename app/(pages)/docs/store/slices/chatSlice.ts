// Chat Slice - AI chat state management

import type { StateCreator } from "zustand";
import type { ChatSlice, DocsStore, ChatMessage } from "../types";
import { nanoid } from "nanoid";

export const createChatSlice: StateCreator<
  DocsStore,
  [],
  [],
  ChatSlice
> = (set, get) => ({
  // Initial state
  messages: [],
  isLoading: false,
  selectedAgentId: null,
  threadId: null,

  sendMessage: async (message: string, docId: string) => {
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
        // Trigger document refetch
        const refreshResponse = await fetch(`/api/docs/${docId}`);
        if (refreshResponse.ok) {
          const { document } = await refreshResponse.json();
          get().setDocument(document);
          get().setContent(document.content);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);

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

  setSelectedAgent: (agentId) => set({ selectedAgentId: agentId }),

  clearChat: () => set({ messages: [], threadId: null }),

  setThreadId: (threadId) => set({ threadId }),
});
