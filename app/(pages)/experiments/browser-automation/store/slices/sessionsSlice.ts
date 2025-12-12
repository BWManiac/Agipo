/**
 * Sessions Slice
 * Manages browser session state: CRUD operations and session list.
 * Handles creating, listing, and terminating browser automation sessions.
 * Powers the session management UI where users create and manage browser sessions.
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
  createNewProfile?: boolean; // Whether this session is creating a new persistent profile
  createdAt: string;
  actionCount: number;
  error?: string;
}

// Options for creating a new session
export interface CreateSessionOptions {
  profileName?: string;
  profileDisplayName?: string;
  initialUrl?: string;
  createNewProfile?: boolean;
}

// 1. State Interface
export interface SessionsSliceState {
  sessions: BrowserSession[];
  // Array of all browser sessions. Powers the session list display.
  isLoading: boolean;
  // Indicates if sessions are being fetched from API. Used to show loading state.
  isCreating: boolean;
  // Indicates if a session creation is in progress. Used to disable create button and show loading.
  error: string | null;
  // Error message if session operation fails. Null when no error.
}

// 2. Actions Interface
export interface SessionsSliceActions {
  fetchSessions: () => Promise<void>;
  // Fetches all sessions from the API. Called when session list needs to be refreshed.
  createSession: (options?: CreateSessionOptions) => Promise<BrowserSession>;
  // Creates a new browser session. Called when user clicks create session button.
  terminateSession: (sessionId: string) => Promise<void>;
  // Terminates a browser session. Called when user clicks terminate/stop session button.
  updateSessionStatus: (
    sessionId: string,
    status: BrowserSession["status"]
  ) => void;
  // Updates a session's status. Called when session state changes (starting → running, etc.).
  incrementActionCount: (sessionId: string) => void;
  // Increments the action count for a session. Called when browser agent performs an action.
  setSessionsError: (error: string | null) => void;
  // Sets session error message. Called when session operation fails.
}

// 3. Combined Slice Type
export type SessionsSlice = SessionsSliceState & SessionsSliceActions;

// 4. Initial State
const initialState: SessionsSliceState = {
  sessions: [], // Start with empty sessions list - will be fetched from API
  isLoading: false, // Not loading initially - will start loading when component mounts
  isCreating: false, // Not creating initially - user hasn't started creating session yet
  error: null, // No error initially - clean state
};

// 5. Slice Creator
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

  createSession: async (options) => {
    const { profileName, profileDisplayName, initialUrl, createNewProfile } =
      options || {};
    set({ isCreating: true, error: null });
    try {
      const response = await fetch("/api/browser-automation/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileName,
          profileDisplayName,
          initialUrl,
          createNewProfile,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create session");
      }

      const newSession: BrowserSession = {
        ...data.session,
        actionCount: 0,
        status: "starting",
        createNewProfile,
      };

      set((state) => ({
        sessions: [...state.sessions, newSession],
        isCreating: false,
      }));

      // Auto-select new session
      get().selectSession(newSession.id);

      // Refresh profiles if we created a new one
      if (createNewProfile) {
        get().fetchProfiles();
      }

      return newSession;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create session";
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

  setSessionsError: (error) => {
    if (error) {
      console.error("Sessions error:", error);
    }
    set({ error });
  },
});
