/**
 * Actions Slice
 * Manages action log state for browser automation actions.
 * Tracks all browser actions (navigate, click, type, etc.) with their status and details.
 * Powers the action log UI where users can see what the browser agent is doing.
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

// 1. State Interface
export interface ActionsSliceState {
  actions: ActionLogEntry[];
  // Array of all action log entries. Powers the action log display showing browser automation history.
  actionFilter: ActionType | "all";
  // Current filter for action log display. Used to show only specific action types or all actions.
  expandedActionId: string | null;
  // ID of currently expanded action in the log. Used to show/hide action details.
}

// 2. Actions Interface
export interface ActionsSliceActions {
  addAction: (
    action: Omit<ActionLogEntry, "status"> & { status?: ActionLogEntry["status"] }
  ) => void;
  // Adds a new action to the log. Called when browser agent performs an action (navigate, click, etc.).
  updateActionStatus: (
    actionId: string,
    status: ActionLogEntry["status"],
    duration?: number,
    error?: string
  ) => void;
  // Updates the status of an action (running → success/error). Called when action completes or fails.
  clearActions: () => void;
  // Clears all actions from the log. Called when user wants to reset the action history.
  clearSessionActions: (sessionId: string) => void;
  // Removes all actions for a specific session. Called when session is terminated.
  setActionFilter: (filter: ActionType | "all") => void;
  // Sets the filter for action log display. Called when user filters actions by type.
  setExpandedActionId: (actionId: string | null) => void;
  // Sets which action is expanded to show details. Called when user clicks to expand/collapse action.
  toggleActionExpanded: (actionId: string) => void;
  // Toggles the expanded state of an action. Called when user clicks expand/collapse button.
}

// 3. Combined Slice Type
export type ActionsSlice = ActionsSliceState & ActionsSliceActions;

// 4. Initial State
const initialState: ActionsSliceState = {
  actions: [], // Start with empty action log - no actions performed yet
  actionFilter: "all", // Start showing all actions - no filter applied initially
  expandedActionId: null, // Start with no action expanded - user hasn't clicked to view details yet
};

// 5. Slice Creator
export const createActionsSlice: StateCreator<
  BrowserStore,
  [],
  [],
  ActionsSlice
> = (set, get) => ({
  ...initialState,

  addAction: (action) => {
    console.log("📝 ActionsSlice: Adding action:", action.type || action.target);
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
    console.log("✅ ActionsSlice: Action added successfully");
  },

  updateActionStatus: (actionId, status, duration, error) => {
    console.log("🔄 ActionsSlice: Updating action status:", actionId, status);
    set((state) => ({
      actions: state.actions.map((a) =>
        a.id === actionId ? { ...a, status, duration, error } : a
      ),
    }));
  },

  clearActions: () => {
    console.log("🗑️ ActionsSlice: Clearing all actions");
    set({ actions: [] });
  },

  clearSessionActions: (sessionId) => {
    console.log("🗑️ ActionsSlice: Clearing actions for session:", sessionId);
    set((state) => ({
      actions: state.actions.filter((a) => a.sessionId !== sessionId),
    }));
  },

  setActionFilter: (filter) => {
    console.log("🔍 ActionsSlice: Setting filter:", filter);
    set({ actionFilter: filter });
  },

  setExpandedActionId: (actionId) => {
    set({ expandedActionId: actionId });
  },

  toggleActionExpanded: (actionId) => {
    set((state) => ({
      expandedActionId: state.expandedActionId === actionId ? null : actionId,
    }));
  },
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
