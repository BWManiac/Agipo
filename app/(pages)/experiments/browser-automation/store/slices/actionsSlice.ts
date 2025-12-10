/**
 * Actions Slice
 * Manages action log state for browser automation actions.
 */

import { StateCreator } from "zustand";
import type { BrowserStore } from "../index";

export type ActionType =
  | "navigate"
  | "click"
  | "type"
  | "extract"
  | "screenshot"
  | "download"
  | "wait"
  | "action";

export interface ActionLogEntry {
  id: string;
  sessionId: string;
  type: ActionType;
  target: string;
  status: "pending" | "running" | "success" | "error";
  timestamp: string;
  duration?: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface ActionsSliceState {
  actions: ActionLogEntry[];
  actionFilter: ActionType | "all";
  expandedActionId: string | null;
}

export interface ActionsSliceActions {
  addAction: (
    action: Omit<ActionLogEntry, "status"> & { status?: ActionLogEntry["status"] }
  ) => void;
  updateActionStatus: (
    actionId: string,
    status: ActionLogEntry["status"],
    duration?: number,
    error?: string
  ) => void;
  clearActions: () => void;
  clearSessionActions: (sessionId: string) => void;
  setActionFilter: (filter: ActionType | "all") => void;
  setExpandedActionId: (actionId: string | null) => void;
  toggleActionExpanded: (actionId: string) => void;
}

export type ActionsSlice = ActionsSliceState & ActionsSliceActions;

const initialState: ActionsSliceState = {
  actions: [],
  actionFilter: "all",
  expandedActionId: null,
};

export const createActionsSlice: StateCreator<
  BrowserStore,
  [],
  [],
  ActionsSlice
> = (set, get) => ({
  ...initialState,

  addAction: (action) => {
    const newAction: ActionLogEntry = {
      ...action,
      status: action.status || "running",
      type: parseActionType(action.type || action.target),
    };

    set((state) => ({
      actions: [newAction, ...state.actions],
    }));

    // Increment action count on session
    if (action.sessionId) {
      get().incrementActionCount(action.sessionId);
    }
  },

  updateActionStatus: (actionId, status, duration, error) => {
    set((state) => ({
      actions: state.actions.map((a) =>
        a.id === actionId ? { ...a, status, duration, error } : a
      ),
    }));
  },

  clearActions: () => set({ actions: [] }),

  clearSessionActions: (sessionId) =>
    set((state) => ({
      actions: state.actions.filter((a) => a.sessionId !== sessionId),
    })),

  setActionFilter: (filter) => set({ actionFilter: filter }),

  setExpandedActionId: (actionId) => set({ expandedActionId: actionId }),

  toggleActionExpanded: (actionId) =>
    set((state) => ({
      expandedActionId: state.expandedActionId === actionId ? null : actionId,
    })),
});

/**
 * Parse action type from description or type string
 */
function parseActionType(input: string): ActionType {
  const lower = input.toLowerCase();

  if (lower.includes("navigat") || lower.includes("go to") || lower.includes("visit")) {
    return "navigate";
  }
  if (lower.includes("click") || lower.includes("press") || lower.includes("tap")) {
    return "click";
  }
  if (lower.includes("type") || lower.includes("enter") || lower.includes("input") || lower.includes("fill")) {
    return "type";
  }
  if (lower.includes("extract") || lower.includes("get") || lower.includes("read") || lower.includes("scrape")) {
    return "extract";
  }
  if (lower.includes("screenshot") || lower.includes("capture")) {
    return "screenshot";
  }
  if (lower.includes("download")) {
    return "download";
  }
  if (lower.includes("wait") || lower.includes("pause")) {
    return "wait";
  }

  return "action";
}
