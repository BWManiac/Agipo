// Store Types for the Docs Feature
// 
// This file re-exports slice types from their respective slice files.
// Each slice defines its own State, Actions, and combined Slice types.

// Re-export all slice types
export type {
  CatalogSlice,
  CatalogSliceState,
  CatalogSliceActions,
} from "./slices/catalogSlice";

export type {
  ChatSlice,
  ChatSliceState,
  ChatSliceActions,
  ChatMessage,
} from "./slices/chatSlice";

export type {
  EditorSlice,
  EditorSliceState,
  EditorSliceActions,
  SaveStatus,
} from "./slices/editorSlice";

export type {
  HistorySlice,
  HistorySliceState,
  HistorySliceActions,
} from "./slices/historySlice";

export type {
  OutlineSlice,
  OutlineSliceState,
  OutlineSliceActions,
  OutlineHeading,
} from "./slices/outlineSlice";

export type {
  UISlice,
  UISliceState,
  UISliceActions,
} from "./slices/uiSlice";

// ============================================
// Combined Store
// ============================================

import type { CatalogSlice } from "./slices/catalogSlice";
import type { ChatSlice } from "./slices/chatSlice";
import type { EditorSlice } from "./slices/editorSlice";
import type { HistorySlice } from "./slices/historySlice";
import type { OutlineSlice } from "./slices/outlineSlice";
import type { UISlice } from "./slices/uiSlice";

export interface DocsStore extends
  CatalogSlice,
  EditorSlice,
  ChatSlice,
  UISlice,
  HistorySlice,
  OutlineSlice {}
