/**
 * Chat Slice
 * Manages chat messages and streaming state for browser agent interaction.
 */

import { StateCreator } from "zustand";
import type { BrowserStore } from "../index";
import type { ActionType } from "./actionsSlice";

export interface AgentStep {
  id: string;
  type: string;
  description: string;
  status: "running" | "success" | "error";
  timestamp: string;
  duration?: number;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  steps?: AgentStep[];
  result?: unknown;
}

export interface ChatSliceState {
  messages: ChatMessage[];
  isStreaming: boolean;
  chatError: string | null;
  abortController: AbortController | null;
}

export interface ChatSliceActions {
  sendMessage: (sessionId: string, text: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  addStep: (messageId: string, step: AgentStep) => void;
  updateStep: (
    messageId: string,
    stepId: string,
    updates: Partial<AgentStep>
  ) => void;
  setResult: (messageId: string, result: unknown) => void;
  stopTask: () => void;
  clearMessages: () => void;
  setChatError: (error: string | null) => void;
}

export type ChatSlice = ChatSliceState & ChatSliceActions;

const initialState: ChatSliceState = {
  messages: [],
  isStreaming: false,
  chatError: null,
  abortController: null,
};

export const createChatSlice: StateCreator<BrowserStore, [], [], ChatSlice> = (
  set,
  get
) => ({
  ...initialState,

  sendMessage: async (sessionId, text) => {
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const assistantMessageId = `msg_${Date.now() + 1}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      steps: [],
    };

    set((state) => ({
      messages: [...state.messages, userMessage, assistantMessage],
      isStreaming: true,
      chatError: null,
    }));

    const abortController = new AbortController();
    set({ abortController });

    try {
      const response = await fetch(
        `/api/browser-automation/sessions/${sessionId}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
          signal: abortController.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          if (!block.trim()) continue;

          const eventMatch = block.match(/event: (\w+)/);
          const dataMatch = block.match(/data: ([\s\S]+)/);

          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1];
            try {
              const data = JSON.parse(dataMatch[1]);
              handleSSEEvent(eventType, data, assistantMessageId, set, get);
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        set({ chatError: (error as Error).message });
      }
    } finally {
      set({ isStreaming: false, abortController: null });
    }
  },

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  addStep: (messageId, step) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, steps: [...(m.steps || []), step] } : m
      ),
    })),

  updateStep: (messageId, stepId, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              steps: m.steps?.map((s) =>
                s.id === stepId ? { ...s, ...updates } : s
              ),
            }
          : m
      ),
    })),

  setResult: (messageId, result) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, result, content: formatResult(result) }
          : m
      ),
    })),

  stopTask: () => {
    const { abortController } = get();
    abortController?.abort();
    set({ isStreaming: false, abortController: null });
  },

  clearMessages: () => set({ messages: [] }),

  setChatError: (error) => set({ chatError: error }),
});

function handleSSEEvent(
  type: string,
  data: Record<string, unknown>,
  messageId: string,
  set: (
    partial:
      | Partial<BrowserStore>
      | ((state: BrowserStore) => Partial<BrowserStore>)
  ) => void,
  get: () => BrowserStore
) {
  switch (type) {
    case "message":
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, content: data.content as string } : m
        ),
      }));
      break;

    case "step_start":
      get().addStep(messageId, data as unknown as AgentStep);
      // Also add to actions slice for action log
      get().addAction?.({
        id: data.id as string,
        type: ((data.type as string) || "action") as ActionType,
        timestamp: (data.timestamp as string) || new Date().toISOString(),
        sessionId: get().activeSessionId || "",
        target: (data.description as string) || "",
      });
      break;

    case "step_complete":
      get().updateStep(messageId, data.id as string, {
        status: "success",
        duration: data.duration as number,
      });
      get().updateActionStatus?.(
        data.id as string,
        "success",
        data.duration as number
      );
      break;

    case "step_error":
      get().updateStep(messageId, data.id as string, {
        status: "error",
        error: data.error as string,
      });
      get().updateActionStatus?.(
        data.id as string,
        "error",
        undefined,
        data.error as string
      );
      break;

    case "result":
      get().setResult(messageId, data.data);
      break;

    case "done":
      set({ isStreaming: false });
      break;

    case "error":
      set({ chatError: data.message as string, isStreaming: false });
      break;
  }
}

function formatResult(result: unknown): string {
  if (typeof result === "string") return result;
  if (typeof result === "object" && result !== null) {
    return `Task completed.\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
  }
  return String(result);
}
