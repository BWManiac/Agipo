import type { StateCreator } from "zustand";
import type { ChatSlice, WorkflowsDStore, ChatMessage } from "../types";

export const createChatSlice: StateCreator<
  WorkflowsDStore,
  [],
  [],
  ChatSlice
> = (set) => ({
  // Initial state
  chatMessages: [],
  isChatLoading: false,

  // Actions
  addChatMessage: (message: ChatMessage) => {
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    }));
  },

  setChatMessages: (messages: ChatMessage[]) => set({ chatMessages: messages }),

  setChatLoading: (loading: boolean) => set({ isChatLoading: loading }),

  clearChat: () => set({ chatMessages: [], isChatLoading: false }),
});




