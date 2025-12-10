/**
 * Browser Slice
 * Manages active browser state: selected session, connection status, current URL.
 */

import { StateCreator } from "zustand";
import type { BrowserStore } from "../index";

export interface BrowserSliceState {
  activeSessionId: string | null;
  liveViewUrl: string | null;
  status: "disconnected" | "connecting" | "connected" | "error";
  currentUrl: string | null;
  browserError: {
    type: "timeout" | "disconnected" | "service_error" | "unknown";
    message: string;
    code?: string;
  } | null;
}

export interface BrowserSliceActions {
  selectSession: (sessionId: string | null) => void;
  setStatus: (status: BrowserSliceState["status"]) => void;
  setCurrentUrl: (url: string | null) => void;
  setBrowserError: (error: BrowserSliceState["browserError"]) => void;
  clearBrowserState: () => void;
}

export type BrowserSlice = BrowserSliceState & BrowserSliceActions;

const initialState: BrowserSliceState = {
  activeSessionId: null,
  liveViewUrl: null,
  status: "disconnected",
  currentUrl: null,
  browserError: null,
};

export const createBrowserSlice: StateCreator<
  BrowserStore,
  [],
  [],
  BrowserSlice
> = (set, get) => ({
  ...initialState,

  selectSession: (sessionId) => {
    if (!sessionId) {
      set({ ...initialState });
      return;
    }

    const sessions = get().sessions;
    console.log("[Browser] Looking for session:", sessionId, "in", sessions.length, "sessions");
    const session = sessions.find((s) => s.id === sessionId);

    if (session) {
      console.log("[Browser] Found session:", session);
      console.log("[Browser] liveViewUrl:", session.liveViewUrl);
      set({
        activeSessionId: sessionId,
        liveViewUrl: session.liveViewUrl,
        status: session.status === "running" ? "connected" : "connecting",
        currentUrl: session.currentUrl || null,
        browserError: null,
      });
    } else {
      console.log("[Browser] Session not found!");
    }
  },

  setStatus: (status) => set({ status }),

  setCurrentUrl: (url) => set({ currentUrl: url }),

  setBrowserError: (error) =>
    set({
      browserError: error,
      status: error ? "error" : get().status,
    }),

  clearBrowserState: () => set(initialState),
});
