/**
 * Chat Slice
 * Manages chat messages and streaming state for browser agent interaction.
 * Handles user messages, AI responses, and real-time streaming from the browser agent.
 * Powers the chat interface where users give instructions to the browser automation agent.
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

// 1. State Interface
export interface ChatSliceState {
  messages: ChatMessage[];
  // Array of chat messages between user and browser agent. Powers the chat history display.
  isStreaming: boolean;
  // Indicates if AI agent is currently streaming a response. Used to show typing indicator.
  chatError: string | null;
  // Error message if chat request fails. Null when no error.
  abortController: AbortController | null;
  // AbortController for canceling in-flight chat requests. Used when user clicks stop.
}

// 2. Actions Interface
export interface ChatSliceActions {
  sendMessage: (sessionId: string, text: string) => Promise<void>;
  // Sends a user message to the browser agent and handles streaming response. Called when user submits chat message.
  addMessage: (message: ChatMessage) => void;
  // Adds a message to the chat history. Called when user sends message or agent responds.
  addStep: (messageId: string, step: AgentStep) => void;
  // Adds a step to an agent message. Called when agent starts performing an action.
  updateStep: (
    messageId: string,
    stepId: string,
    updates: Partial<AgentStep>
  ) => void;
  // Updates a step's status or details. Called when step completes or fails.
  setResult: (messageId: string, result: unknown) => void;
  // Sets the final result for an agent message. Called when task completes.
  stopTask: () => void;
  // Stops the current streaming task. Called when user clicks stop button.
  clearMessages: () => void;
  // Clears all chat messages. Called when user starts a new conversation.
  setChatError: (error: string | null) => void;
  // Sets chat error message. Called when chat request fails.
}

// 3. Combined Slice Type
export type ChatSlice = ChatSliceState & ChatSliceActions;

// 4. Initial State
const initialState: ChatSliceState = {
  messages: [], // Start with empty chat - no conversation history yet
  isStreaming: false, // Start with no streaming - agent isn't generating response initially
  chatError: null, // No error initially - clean state
  abortController: null, // No abort controller initially - no request in flight
};

// 5. Slice Creator
export const createChatSlice: StateCreator<BrowserStore, [], [], ChatSlice> = (
  set,
  get
) => ({
  ...initialState,

  sendMessage: async (sessionId, text) => {
    console.log("💬 ChatSlice: Sending message:", text.substring(0, 50));
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
        console.error("❌ ChatSlice: Chat error:", (error as Error).message);
        set({ chatError: (error as Error).message });
      } else {
        console.log("⏹️ ChatSlice: Request aborted");
      }
    } finally {
      set({ isStreaming: false, abortController: null });
      console.log("✅ ChatSlice: Streaming complete");
    }
  },

  addMessage: (message) => {
    console.log("💬 ChatSlice: Adding message:", message.role);
    set((state) => ({ messages: [...state.messages, message] }));
  },

  addStep: (messageId, step) => {
    console.log("📝 ChatSlice: Adding step to message:", messageId);
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, steps: [...(m.steps || []), step] } : m
      ),
    }));
  },

  updateStep: (messageId, stepId, updates) => {
    console.log("🔄 ChatSlice: Updating step:", stepId, updates.status);
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
    }));
  },

  setResult: (messageId, result) => {
    console.log("✅ ChatSlice: Setting result for message:", messageId);
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, result, content: formatResult(result) }
          : m
      ),
    }));
  },

  stopTask: () => {
    console.log("⏹️ ChatSlice: Stopping task");
    const { abortController } = get();
    abortController?.abort();
    set({ isStreaming: false, abortController: null });
  },

  clearMessages: () => {
    console.log("🗑️ ChatSlice: Clearing messages");
    set({ messages: [] });
  },

  setChatError: (error) => {
    if (error) {
      console.error("❌ ChatSlice: Setting chat error:", error);
    }
    set({ chatError: error });
  },
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
