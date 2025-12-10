/**
 * Browser Store Types
 * Combined type definition for all slices.
 */

import type { SessionsSlice } from "./slices/sessionsSlice";
import type { BrowserSlice } from "./slices/browserSlice";
import type { UiSlice } from "./slices/uiSlice";
import type { ChatSlice } from "./slices/chatSlice";
import type { ActionsSlice } from "./slices/actionsSlice";
import type { ProfilesSlice } from "./slices/profilesSlice";

export type BrowserStore = SessionsSlice &
  BrowserSlice &
  UiSlice &
  ChatSlice &
  ActionsSlice &
  ProfilesSlice;
