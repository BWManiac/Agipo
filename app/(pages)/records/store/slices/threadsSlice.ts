/**
 * Threads Slice
 * Manages conversation threads for the chat sidebar.
 */

import type { StateCreator } from "zustand";
import type { RecordsStore } from "../types";

export interface Thread {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

// 1. State Interface
export interface ThreadsSliceState {
  threads: Thread[];
  activeThreadId: string | null;
  isLoadingThreads: boolean;
  threadsError: string | null;
}

// 2. Actions Interface
export interface ThreadsSliceActions {
  fetchThreads: (tableId: string) => Promise<void>;
  createThread: (tableId: string, title?: string) => Promise<Thread | null>;
  deleteThread: (tableId: string, threadId: string) => Promise<void>;
  renameThread: (tableId: string, threadId: string, newTitle: string) => Promise<void>;
  selectThread: (threadId: string | null) => void;
  getActiveThread: () => Thread | null;
  updateThreadTitle: (threadId: string, title: string) => void;
}

// 3. Combined Slice Type
export type ThreadsSlice = ThreadsSliceState & ThreadsSliceActions;

// 4. Initial State
const initialState: ThreadsSliceState = {
  threads: [],
  activeThreadId: null,
  isLoadingThreads: false,
  threadsError: null,
};

// 5. Slice Creator
export const createThreadsSlice: StateCreator<
  RecordsStore,
  [],
  [],
  ThreadsSlice
> = (set, get) => ({
  ...initialState,

  fetchThreads: async (tableId) => {
    const state = get();
    const agentId = state.selectedAgentId;
    if (!agentId) return;

    set({ isLoadingThreads: true, threadsError: null });
    try {
      const res = await fetch(`/api/records/${tableId}/threads?agentId=${agentId}`);
      if (!res.ok) throw new Error("Failed to fetch threads");
      const data = await res.json();

      const threads: Thread[] = (data.threads || []).map((t: Record<string, unknown>) => ({
        id: t.id as string,
        title: t.title as string || "New Conversation",
        createdAt: new Date(t.createdAt as string),
        updatedAt: new Date(t.updatedAt as string),
      }));

      set({ threads, isLoadingThreads: false });
    } catch (error) {
      set({
        threadsError: error instanceof Error ? error.message : "Unknown error",
        isLoadingThreads: false
      });
    }
  },

  createThread: async (tableId, title) => {
    const state = get();
    const agentId = state.selectedAgentId;
    if (!agentId) return null;

    try {
      const res = await fetch(`/api/records/${tableId}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || "New Conversation", agentId }),
      });

      if (!res.ok) throw new Error("Failed to create thread");
      const data = await res.json();

      const newThread: Thread = {
        id: data.thread.id,
        title: data.thread.title || "New Conversation",
        createdAt: new Date(data.thread.createdAt),
        updatedAt: new Date(data.thread.updatedAt),
      };

      set((s) => ({
        threads: [newThread, ...s.threads],
        activeThreadId: newThread.id,
      }));

      return newThread;
    } catch (error) {
      // Fallback: create local thread
      const fallbackThread: Thread = {
        id: `local-${Date.now()}`,
        title: title || "New Conversation",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      set((s) => ({
        threads: [fallbackThread, ...s.threads],
        activeThreadId: fallbackThread.id,
      }));
      return fallbackThread;
    }
  },

  deleteThread: async (tableId, threadId) => {
    const state = get();
    const agentId = state.selectedAgentId;

    // Optimistically remove
    set((s) => ({
      threads: s.threads.filter((t) => t.id !== threadId),
      activeThreadId: s.activeThreadId === threadId ? null : s.activeThreadId,
    }));

    if (!agentId || threadId.startsWith("local-")) return;

    try {
      await fetch(`/api/records/${tableId}/threads/${threadId}?agentId=${agentId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("[ThreadsSlice] Delete failed:", error);
    }
  },

  renameThread: async (tableId, threadId, newTitle) => {
    const state = get();
    const agentId = state.selectedAgentId;

    // Optimistically update
    set((s) => ({
      threads: s.threads.map((t) =>
        t.id === threadId ? { ...t, title: newTitle, updatedAt: new Date() } : t
      ),
    }));

    if (!agentId || threadId.startsWith("local-")) return;

    try {
      await fetch(`/api/records/${tableId}/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, agentId }),
      });
    } catch (error) {
      console.error("[ThreadsSlice] Rename failed:", error);
    }
  },

  selectThread: (threadId) => set({ activeThreadId: threadId }),

  getActiveThread: () => {
    const state = get();
    return state.threads.find((t) => t.id === state.activeThreadId) || null;
  },

  updateThreadTitle: (threadId, title) => {
    set((s) => ({
      threads: s.threads.map((t) =>
        t.id === threadId && t.title === "New Conversation"
          ? { ...t, title, updatedAt: new Date() }
          : t
      ),
    }));
  },
});
