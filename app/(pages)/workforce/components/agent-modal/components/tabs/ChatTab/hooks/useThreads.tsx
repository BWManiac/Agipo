"use client";

import { useState, useCallback, useEffect } from "react";
import type { Thread } from "../types";

interface ThreadResponse {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ThreadsResponse {
  threads: ThreadResponse[];
}

interface CreateThreadResponse {
  thread: ThreadResponse;
}

function parseThread(t: ThreadResponse): Thread {
  return {
    id: t.id,
    title: t.title,
    createdAt: new Date(t.createdAt),
    updatedAt: new Date(t.updatedAt),
  };
}

export function useThreads(agentId: string) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch threads on mount
  useEffect(() => {
    async function fetchThreads() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/workforce/${agentId}/threads`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch threads");
        }
        
        const data: ThreadsResponse = await response.json();
        setThreads(data.threads.map(parseThread));
      } catch (err) {
        console.error("[useThreads] fetch error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        // Keep empty array on error
        setThreads([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchThreads();
  }, [agentId]);

  // Create a new thread
  const createThread = useCallback(async () => {
    try {
      const response = await fetch(`/api/workforce/${agentId}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      });

      if (!response.ok) {
        throw new Error("Failed to create thread");
      }

      const data: CreateThreadResponse = await response.json();
      const newThread = parseThread(data.thread);
      
      setThreads((prev) => [newThread, ...prev]);
      setActiveThreadId(newThread.id);
      
      return newThread;
    } catch (err) {
      console.error("[useThreads] create error:", err);
      // Fallback: create local thread
      const fallbackThread: Thread = {
        id: `local-${Date.now()}`,
        title: "New Conversation",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setThreads((prev) => [fallbackThread, ...prev]);
      setActiveThreadId(fallbackThread.id);
      return fallbackThread;
    }
  }, [agentId]);

  // Select a thread
  const selectThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
  }, []);

  // Delete a thread
  const deleteThread = useCallback(
    async (threadId: string) => {
      // Optimistically remove from UI
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      setActiveThreadId((current) => (current === threadId ? null : current));

      try {
        const response = await fetch(
          `/api/workforce/${agentId}/threads/${threadId}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error("Failed to delete thread");
        }
      } catch (err) {
        console.error("[useThreads] delete error:", err);
        // Could restore the thread here, but for now just log
      }
    },
    [agentId]
  );

  // Rename a thread
  const renameThread = useCallback(
    async (threadId: string, newTitle: string) => {
      // Optimistically update UI
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, title: newTitle, updatedAt: new Date() } : t
        )
      );

      try {
        const response = await fetch(
          `/api/workforce/${agentId}/threads/${threadId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to rename thread");
        }
      } catch (err) {
        console.error("[useThreads] rename error:", err);
        // Could revert the optimistic update here
      }
    },
    [agentId]
  );

  // Update thread title (for auto-title from first message)
  const updateThreadTitle = useCallback(
    (threadId: string, title: string) => {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId && t.title === "New Conversation"
            ? { ...t, title, updatedAt: new Date() }
            : t
        )
      );
      
      // Also update on server (fire and forget)
      fetch(`/api/workforce/${agentId}/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      }).catch((err) => console.error("[useThreads] auto-title error:", err));
    },
    [agentId]
  );

  // Refresh threads from server
  const refreshThreads = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/workforce/${agentId}/threads`);
      
      if (response.ok) {
        const data: ThreadsResponse = await response.json();
        setThreads(data.threads.map(parseThread));
      }
    } catch (err) {
      console.error("[useThreads] refresh error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;

  return {
    threads,
    activeThread,
    activeThreadId,
    isLoading,
    error,
    createThread,
    selectThread,
    deleteThread,
    renameThread,
    updateThreadTitle,
    refreshThreads,
  };
}
