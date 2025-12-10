/**
 * Browser Automation Store
 * Zustand store composition for the Browser Automation feature.
 */

import { create } from "zustand";

import { createSessionsSlice } from "./slices/sessionsSlice";
import { createBrowserSlice } from "./slices/browserSlice";
import { createUiSlice } from "./slices/uiSlice";
import { createChatSlice } from "./slices/chatSlice";
import { createActionsSlice } from "./slices/actionsSlice";
import { createProfilesSlice } from "./slices/profilesSlice";
import type { BrowserStore } from "./types";

export const useBrowserStore = create<BrowserStore>()((...args) => ({
  ...createSessionsSlice(...args),
  ...createBrowserSlice(...args),
  ...createUiSlice(...args),
  ...createChatSlice(...args),
  ...createActionsSlice(...args),
  ...createProfilesSlice(...args),
}));

// Re-export types
export type { BrowserSession } from "./slices/sessionsSlice";
export type { ChatMessage, AgentStep } from "./slices/chatSlice";
export type { ActionLogEntry, ActionType } from "./slices/actionsSlice";
export type { ProfileSummary, ProfileCredential, ProfileFormData } from "./slices/profilesSlice";
export type { BrowserStore } from "./types";
