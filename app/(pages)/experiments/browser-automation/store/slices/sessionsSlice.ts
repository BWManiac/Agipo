/**
 * Sessions Slice
 * Manages browser session state: CRUD operations and session list.
 */

import { StateCreator } from "zustand";
import type { BrowserStore } from "../index";

export interface BrowserSession {
  id: string;
  cdpUrl: string;
  liveViewUrl: string;
  status: "starting" | "running" | "idle" | "stopped" | "error";
  currentUrl?: string;
  profileName?: string;
  createdAt: string;
  actionCount: number;
  error?: string;
}

export interface SessionsSliceState {
  sessions: BrowserSession[];
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
}

export interface SessionsSliceActions {
  fetchSessions: () => Promise<void>;
  createSession: (
    profileName?: string,
    initialUrl?: string
  ) => Promise<BrowserSession>;
  terminateSession: (sessionId: string) => Promise<void>;
  updateSessionStatus: (
    sessionId: string,
    status: BrowserSession["status"]
  ) => void;
  incrementActionCount: (sessionId: string) => void;
  setSessionsError: (error: string | null) => void;
}

export type SessionsSlice = SessionsSliceState & SessionsSliceActions;

const initialState: SessionsSliceState = {
  sessions: [],
  isLoading: false,
  isCreating: false,
  error: null,
};

export const createSessionsSlice: StateCreator<
  BrowserStore,
  [],
  [],
  SessionsSlice
> = (set, get) => ({
  ...initialState,

  fetchSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/browser-automation/sessions");
      const data = await response.json();
      set({ sessions: data.sessions || [], isLoading: false });
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      set({ error: "Failed to fetch sessions", isLoading: false });
    }
  },

  createSession: async (profileName, initialUrl) => {
    set({ isCreating: true, error: null });
    try {
      const response = await fetch("/api/browser-automation/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileName, initialUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create session");
      }
      console.log("[Sessions] Created session data:", data.session);

      const newSession: BrowserSession = {
        ...data.session,
        actionCount: 0,
        status: "starting",
      };

      console.log("[Sessions] New session object:", newSession);

      set((state) => ({
        sessions: [...state.sessions, newSession],
        isCreating: false,
      }));

      // Auto-select new session
      console.log("[Sessions] Selecting session:", newSession.id);
      get().selectSession(newSession.id);
      return newSession;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create session";
      console.error("Failed to create session:", errorMessage);
      set({ error: errorMessage, isCreating: false });
      throw error;
    }
  },

  terminateSession: async (sessionId) => {
    try {
      await fetch(`/api/browser-automation/sessions/${sessionId}`, {
        method: "DELETE",
      });

      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== sessionId),
      }));

      // Clear selection if terminated session was selected
      if (get().activeSessionId === sessionId) {
        get().selectSession(null);
      }
    } catch (error) {
      console.error("Failed to terminate session:", error);
      set({ error: "Failed to terminate session" });
    }
  },

  updateSessionStatus: (sessionId, status) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, status } : s
      ),
    }));
  },

  incrementActionCount: (sessionId) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, actionCount: s.actionCount + 1 } : s
      ),
    }));
  },

  setSessionsError: (error) => set({ error }),
});
