/**
 * Browser Slice
 * Manages active browser state: selected session, connection status, current URL.
 * Tracks which browser session is currently active and its connection state.
 * Powers the live browser view and connection status indicators.
 */

import { StateCreator } from "zustand";
import type { BrowserStore } from "../index";

// 1. State Interface
export interface BrowserSliceState {
  activeSessionId: string | null;
  // ID of the currently active browser session. Null when no session is selected.
  liveViewUrl: string | null;
  // URL for the live browser view iframe. Used to display real-time browser content.
  status: "disconnected" | "connecting" | "connected" | "error";
  // Current connection status of the active browser session. Powers connection status indicators.
  currentUrl: string | null;
  // Current URL the browser is viewing. Updated as browser navigates.
  browserError: {
    type: "timeout" | "disconnected" | "service_error" | "unknown";
    message: string;
    code?: string;
  } | null;
  // Error information if browser connection fails. Null when no error.
}

// 2. Actions Interface
export interface BrowserSliceActions {
  selectSession: (sessionId: string | null) => void;
  // Selects a browser session to be active. Called when user clicks on a session in the list.
  setStatus: (status: BrowserSliceState["status"]) => void;
  // Updates the connection status. Called when browser connects/disconnects.
  setCurrentUrl: (url: string | null) => void;
  // Updates the current browser URL. Called when browser navigates to a new page.
  setBrowserError: (error: BrowserSliceState["browserError"]) => void;
  // Sets browser error information. Called when connection fails or browser encounters an error.
  clearBrowserState: () => void;
  // Clears all browser state. Called when user deselects session or closes browser.
}

// 3. Combined Slice Type
export type BrowserSlice = BrowserSliceState & BrowserSliceActions;

// 4. Initial State
const initialState: BrowserSliceState = {
  activeSessionId: null, // Start with no active session - user hasn't selected one yet
  liveViewUrl: null, // No live view URL initially - no session selected
  status: "disconnected", // Start disconnected - no browser session active
  currentUrl: null, // No current URL - no browser session active
  browserError: null, // No error initially - clean state
};

// 5. Slice Creator
export const createBrowserSlice: StateCreator<
  BrowserStore,
  [],
  [],
  BrowserSlice
> = (set, get) => ({
  ...initialState,

  selectSession: (sessionId) => {
    console.log("🌐 BrowserSlice: Selecting session:", sessionId);
    if (!sessionId) {
      set({ ...initialState });
      return;
    }

    const sessions = get().sessions;
    const session = sessions.find((s) => s.id === sessionId);

    if (session) {
      console.log("✅ BrowserSlice: Session found, setting active state");
      set({
        activeSessionId: sessionId,
        liveViewUrl: session.liveViewUrl,
        status: session.status === "running" ? "connected" : "connecting",
        currentUrl: session.currentUrl || null,
        browserError: null,
      });
    } else {
      console.log("⚠️ BrowserSlice: Session not found!");
    }
  },

  setStatus: (status) => {
    console.log("🔄 BrowserSlice: Setting status:", status);
    set({ status });
  },

  setCurrentUrl: (url) => {
    set({ currentUrl: url });
  },

  setBrowserError: (error) => {
    console.log("❌ BrowserSlice: Setting browser error:", error?.message);
    set({
      browserError: error,
      status: error ? "error" : get().status,
    });
  },

  clearBrowserState: () => {
    console.log("🗑️ BrowserSlice: Clearing browser state");
    set(initialState);
  },
});
