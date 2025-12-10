/**
 * Records Store Types
 * Combined store type for the Records feature.
 */

import type { UiSlice } from "./slices/uiSlice";
import type { GridSlice } from "./slices/gridSlice";
import type { AgentsSlice } from "./slices/agentsSlice";
import type { ThreadsSlice } from "./slices/threadsSlice";
import type { ChatSlice } from "./slices/chatSlice";
import type { AccessSlice } from "./slices/accessSlice";

export type RecordsStore = UiSlice &
  GridSlice &
  AgentsSlice &
  ThreadsSlice &
  ChatSlice &
  AccessSlice;
