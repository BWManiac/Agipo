/**
 * DOX Store
 * 
 * Zustand store composition for the DOX feature.
 */

import { create } from "zustand";
import { createDocumentSlice } from "./slices/documentSlice";
import { createEditorSlice } from "./slices/editorSlice";
import { createOutlineSlice } from "./slices/outlineSlice";
import { createPropertiesSlice } from "./slices/propertiesSlice";
import { createChatSlice } from "./slices/chatSlice";
import { createVersionSlice } from "./slices/versionSlice";
import { createSettingsSlice } from "./slices/settingsSlice";
import { createUiSlice } from "./slices/uiSlice";
import type { DocsStore } from "./types";

export const useDocsStore = create<DocsStore>()(
  (...args) => ({
    ...createDocumentSlice(...args),
    ...createEditorSlice(...args),
    ...createOutlineSlice(...args),
    ...createPropertiesSlice(...args),
    ...createChatSlice(...args),
    ...createVersionSlice(...args),
    ...createSettingsSlice(...args),
    ...createUiSlice(...args),
  })
);
