import type { StateCreator } from "zustand";
import type { WorkflowStore } from "../types";

/**
 * Manages the left-side AI chat panel state (messages, loading state).
 * Enables users to interact with AI assistant for help building workflows.
 * Powers the chat UI where users ask questions and get workflow-building guidance.
 * Separate from right-side UI for clear separation of concerns.
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// 1. State Interface
export interface ChatSliceState {
  messages: ChatMessage[];
  // Array of chat messages between user and AI assistant. Powers the chat history display in left panel.
  isTyping: boolean;
  // Indicates if AI assistant is currently generating a response. Used to show typing indicator.
}

// 2. Actions Interface
export interface ChatSliceActions {
  addMessage: (message: ChatMessage) => void;
  // Adds a new message to the chat history. Called when user sends message or AI responds.
  clearMessages: () => void;
  // Clears all chat messages. Called when user starts a new conversation or resets chat.
  setIsTyping: (isTyping: boolean) => void;
  // Updates typing indicator. Called when AI starts/stops generating response.
}

// 3. Combined Slice Type
export type ChatSlice = ChatSliceState & ChatSliceActions;

// 4. Initial State
const initialState: ChatSliceState = {
  messages: [], // Start with empty chat - no conversation history yet
  isTyping: false, // Start with no typing indicator - AI isn't generating response initially
};

// 5. Slice Creator
export const createChatSlice: StateCreator<
  WorkflowStore,
  [],
  [],
  ChatSlice
> = (set) => ({
  ...initialState,
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearMessages: () => set({ messages: [] }),
  setIsTyping: (isTyping) => set({ isTyping }),
});

