// Store Types for the Docs Feature

import type { LexicalEditor } from "lexical";
import type { Document, DocumentListItem, DocumentVersion } from "@/app/api/docs/services/types";

// ============================================
// Catalog Slice
// ============================================

export interface CatalogSlice {
  // State
  documents: DocumentListItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDocuments: () => Promise<void>;
  createDocument: (title?: string) => Promise<string | null>;
  deleteDocument: (docId: string) => Promise<boolean>;
}

// ============================================
// Editor Slice
// ============================================

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface EditorSlice {
  // State
  document: Document | null;
  content: string;
  editor: LexicalEditor | null;
  isDirty: boolean;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;

  // Actions
  setDocument: (document: Document) => void;
  setContent: (content: string) => void;
  setEditor: (editor: LexicalEditor | null) => void;
  setIsDirty: (isDirty: boolean) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setLastSavedAt: (date: Date) => void;
  save: () => Promise<void>;
  resetEditor: () => void;
}

// ============================================
// Chat Slice
// ============================================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolCalls?: Array<{
    tool: string;
    args: Record<string, unknown>;
    result?: unknown;
  }>;
}

export interface ChatSlice {
  // State
  messages: ChatMessage[];
  isLoading: boolean;
  selectedAgentId: string | null;
  threadId: string | null;

  // Actions
  sendMessage: (message: string, docId: string) => Promise<void>;
  setSelectedAgent: (agentId: string | null) => void;
  clearChat: () => void;
  setThreadId: (threadId: string | null) => void;
}

// ============================================
// UI Slice
// ============================================

export interface UISlice {
  // State
  isOutlineOpen: boolean;
  isPropertiesOpen: boolean;
  isChatOpen: boolean;
  isHistoryOpen: boolean;
  isShortcutsOpen: boolean;

  // Actions
  toggleOutline: () => void;
  toggleProperties: () => void;
  toggleChat: () => void;
  toggleHistory: () => void;
  toggleShortcuts: () => void;
  setOutlineOpen: (open: boolean) => void;
  setPropertiesOpen: (open: boolean) => void;
  setChatOpen: (open: boolean) => void;
  setHistoryOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
}

// ============================================
// History Slice
// ============================================

export interface HistorySlice {
  // State
  versions: DocumentVersion[];
  isLoading: boolean;
  selectedVersionId: string | null;
  previewDocument: Document | null;

  // Actions
  fetchVersions: (docId: string) => Promise<void>;
  selectVersion: (versionId: string | null) => void;
  previewVersion: (docId: string, versionId: string) => Promise<void>;
  restoreVersion: (docId: string, versionId: string) => Promise<boolean>;
  clearPreview: () => void;
}

// ============================================
// Outline Slice
// ============================================

export interface OutlineHeading {
  id: string;
  text: string;
  level: number;
  position: number;
}

export interface OutlineSlice {
  // State
  headings: OutlineHeading[];
  activeHeadingId: string | null;

  // Actions
  setHeadings: (headings: OutlineHeading[]) => void;
  setActiveHeading: (id: string | null) => void;
  extractHeadings: (content: string) => void;
}

// ============================================
// Combined Store
// ============================================

export interface DocsStore extends
  CatalogSlice,
  EditorSlice,
  ChatSlice,
  UISlice,
  HistorySlice,
  OutlineSlice {}
