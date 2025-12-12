/**
 * Records Store
 * Zustand store composition for the Records feature.
 */

import { create } from "zustand";

import { createUiSlice } from "./slices/uiSlice";
import { createGridSlice } from "./slices/gridSlice";
import { createAgentsSlice } from "./slices/agentsSlice";
import { createThreadsSlice } from "./slices/threadsSlice";
import { createChatSlice } from "./slices/chatSlice";
import { createAccessSlice } from "./slices/accessSlice";
import { createFolderSlice } from "./slices/folderSlice";
import type { RecordsStore } from "./types";

export const useRecordsStore = create<RecordsStore>()(
  (...args) => ({
    ...createUiSlice(...args),
    ...createGridSlice(...args),
    ...createAgentsSlice(...args),
    ...createThreadsSlice(...args),
    ...createChatSlice(...args),
    ...createAccessSlice(...args),
    ...createFolderSlice(...args),
  })
);

// Re-export types
export type { Agent } from "./slices/agentsSlice";
export type { Thread } from "./slices/threadsSlice";
export type { ChatMessage } from "./slices/chatSlice";
export type { AgentAccess, ActivityEntry } from "./slices/accessSlice";
export type { FilterOperator, FilterValue } from "./slices/gridSlice";
export type { FolderSliceState, FolderSliceActions } from "./slices/folderSlice";
