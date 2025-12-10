/**
 * DOX Store Types
 * 
 * Combined store type for all DOX slices.
 */

import type { EditorSlice } from "./slices/editorSlice";
import type { DocumentSlice } from "./slices/documentSlice";
import type { OutlineSlice } from "./slices/outlineSlice";
import type { PropertiesSlice } from "./slices/propertiesSlice";
import type { ChatSlice } from "./slices/chatSlice";
import type { VersionSlice } from "./slices/versionSlice";
import type { SettingsSlice } from "./slices/settingsSlice";
import type { UiSlice } from "./slices/uiSlice";

export type DocsStore = EditorSlice &
  DocumentSlice &
  OutlineSlice &
  PropertiesSlice &
  ChatSlice &
  VersionSlice &
  SettingsSlice &
  UiSlice;
