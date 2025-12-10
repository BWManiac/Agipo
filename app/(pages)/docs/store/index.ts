// Composed Zustand Store for the Docs Feature

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createCatalogSlice } from "./slices/catalogSlice";
import { createEditorSlice } from "./slices/editorSlice";
import { createChatSlice } from "./slices/chatSlice";
import { createUISlice } from "./slices/uiSlice";
import { createHistorySlice } from "./slices/historySlice";
import { createOutlineSlice } from "./slices/outlineSlice";
import type { DocsStore } from "./types";

export const useDocsStore = create<DocsStore>()(
  devtools(
    (...args) => ({
      ...createCatalogSlice(...args),
      ...createEditorSlice(...args),
      ...createChatSlice(...args),
      ...createUISlice(...args),
      ...createHistorySlice(...args),
      ...createOutlineSlice(...args),
    }),
    { name: "docs-store" }
  )
);

// Re-export types
export type {
  DocsStore,
  CatalogSlice,
  EditorSlice,
  ChatSlice,
  UISlice,
  HistorySlice,
  OutlineSlice,
  SaveStatus,
  ChatMessage,
  OutlineHeading,
} from "./types";
