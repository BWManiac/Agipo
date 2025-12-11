# Task 22b: Docs Feature — Technical Architecture

**Status:** Planning
**Date:** December 2025
**Purpose:** Define the technologies, file structure, and implementation patterns for the Docs feature

---

## 1. Technology Stack

### Frontend

| Technology | Purpose | Current Usage |
|------------|---------|---------------|
| **Lexical** | Rich text editor core | New - document editing |
| **@lexical/react** | React bindings for Lexical | New |
| **@lexical/markdown** | Markdown import/export | New |
| **@lexical/rich-text** | Headings, quotes, formatting | New |
| **@lexical/list** | Bullet, numbered, checkbox lists | New |
| **@lexical/code** | Code blocks with highlighting | New |
| **@lexical/table** | Markdown tables | New |
| **@lexical/link** | Hyperlinks | New |
| **@lexical/history** | Undo/redo | New |
| **Zustand** | All state management (UI, data, editor) | Existing pattern |
| **@ai-sdk/react** | Chat streaming | Existing |
| **Radix UI** | Accessible primitives | Existing |
| **ShadCN** | UI components | Existing |

### Backend

| Technology | Purpose | Current Usage |
|------------|---------|---------------|
| **Next.js API Routes** | REST endpoints | Existing pattern |
| **gray-matter** | YAML frontmatter parsing | New |
| **File System** | Document storage (.md files) | Existing pattern |
| **Mastra (@mastra/core)** | Agent runtime, tool execution | Existing |
| **Mastra Memory (@mastra/memory)** | Thread persistence | Existing |
| **Zod** | Schema validation | Existing |

### Data Storage

| Storage | Purpose | Location |
|---------|---------|----------|
| **File System (Markdown)** | Document content + frontmatter | `_tables/documents/[docId]/` |
| **File System (Markdown)** | Version snapshots | `_tables/documents/[docId]/_versions/` |
| **LibSQL (SQLite)** | Chat thread history | `.mastra/memory.db` |

---

## 2. File Architecture

### Frontend Structure

```
app/(pages)/docs/
├── page.tsx                              # Catalog view (document list)
├── [docId]/
│   └── page.tsx                          # Document editor view
├── components/
│   ├── catalog/
│   │   ├── DocumentCatalog.tsx           # Grid of document cards
│   │   ├── DocumentCard.tsx              # Single document card
│   │   ├── CreateDocumentButton.tsx      # New document button
│   │   └── EmptyState.tsx                # No documents message
│   ├── editor/
│   │   ├── DocEditor.tsx                 # Main editor wrapper
│   │   ├── EditorContent.tsx             # Lexical editor component
│   │   ├── EditorToolbar.tsx             # Formatting toolbar
│   │   ├── EditorFooter.tsx              # Word count, save status
│   │   └── plugins/
│   │       ├── SlashCommandPlugin.tsx    # Slash command menu
│   │       ├── BlockHandlePlugin.tsx     # Block drag handles
│   │       ├── FloatingToolbarPlugin.tsx # Selection toolbar
│   │       ├── MarkdownPlugin.tsx        # Markdown sync
│   │       └── AutoSavePlugin.tsx        # Debounced saving
│   ├── outline/
│   │   ├── DocumentOutline.tsx           # Left sidebar
│   │   └── OutlineItem.tsx               # Single heading item
│   ├── properties/
│   │   ├── PropertiesPanel.tsx           # Frontmatter display
│   │   └── TagEditor.tsx                 # Tag chip editor
│   ├── chat/
│   │   ├── ChatSidebar.tsx               # Right sidebar (reuse pattern)
│   │   ├── ChatArea.tsx                  # Messages display
│   │   ├── ChatInput.tsx                 # Message input
│   │   └── AgentPicker.tsx               # Agent selection
│   ├── history/
│   │   ├── VersionHistoryPanel.tsx       # Version list
│   │   └── VersionPreview.tsx            # Version content preview
│   └── settings/
│       ├── SettingsPanel.tsx             # Settings modal
│       └── AccessControl.tsx             # Agent access management
└── store/
    ├── index.ts                          # Store composition
    ├── types.ts                          # Combined store types
    └── slices/
        ├── editorSlice.ts                # Editor state
        ├── chatSlice.ts                  # Chat state
        ├── uiSlice.ts                    # UI panels state
        └── historySlice.ts               # Version history state
```

### Backend Structure

```
app/api/docs/
├── route.ts                              # GET list, POST create
├── [docId]/
│   ├── route.ts                          # GET, PUT, DELETE document
│   ├── chat/
│   │   ├── route.ts                      # POST streaming chat
│   │   └── services/
│   │       ├── chat-service.ts           # Chat context builder
│   │       └── doc-tools.ts              # sys_doc_* tool definitions
│   ├── threads/
│   │   ├── route.ts                      # GET/POST threads
│   │   └── [threadId]/route.ts           # GET/DELETE thread
│   ├── versions/
│   │   ├── route.ts                      # GET versions list
│   │   └── [versionId]/route.ts          # GET version, POST restore
│   └── access/
│       ├── route.ts                      # GET access info
│       └── agents/
│           ├── route.ts                  # POST grant access
│           └── [agentId]/route.ts        # DELETE revoke access
└── services/
    ├── index.ts                          # Barrel export
    ├── document-io.ts                    # Read/write Markdown files
    ├── frontmatter.ts                    # YAML frontmatter handling
    ├── versions.ts                       # Version snapshot management
    └── access.ts                         # Access control logic
```

### Data Storage Structure

```
_tables/documents/
├── [docId]/
│   ├── content.md                        # Main document (Markdown + frontmatter)
│   └── _versions/
│       ├── v_1733842200000.md            # Version snapshot (timestamp)
│       ├── v_1733845800000.md
│       └── v_1733849400000.md
```

### Agent Tools Structure

```
app/api/docs/[docId]/chat/services/
├── doc-tools.ts                          # All document tools
    ├── sys_doc_read                      # Read document content
    ├── sys_doc_get_section               # Get specific section
    ├── sys_doc_search                    # Search within document
    ├── sys_doc_insert                    # Insert text
    ├── sys_doc_replace                   # Replace text
    ├── sys_doc_get_properties            # Get frontmatter
    └── sys_doc_set_property              # Update frontmatter
```

---

## 3. State Management Architecture

### Store Composition

Following the established slice pattern from Records and Workforce:

```typescript
// app/(pages)/docs/store/index.ts

import { create } from "zustand";
import { createEditorSlice } from "./slices/editorSlice";
import { createChatSlice } from "./slices/chatSlice";
import { createUiSlice } from "./slices/uiSlice";
import { createHistorySlice } from "./slices/historySlice";
import type { DocsStore } from "./types";

export const useDocsStore = create<DocsStore>()(
  (...args) => ({
    ...createEditorSlice(...args),
    ...createChatSlice(...args),
    ...createUiSlice(...args),
    ...createHistorySlice(...args),
  })
);
```

### Type Composition

```typescript
// app/(pages)/docs/store/types.ts

import type { EditorSlice } from "./slices/editorSlice";
import type { ChatSlice } from "./slices/chatSlice";
import type { UiSlice } from "./slices/uiSlice";
import type { HistorySlice } from "./slices/historySlice";

export type DocsStore = EditorSlice & ChatSlice & UiSlice & HistorySlice;
```

### Slice Specifications

#### editorSlice

```typescript
// app/(pages)/docs/store/slices/editorSlice.ts

export interface DocumentMeta {
  id: string;
  title: string;
  created: string;
  updated: string;
  author: string;
  tags: string[];
  wordCount: number;
}

export interface EditorSliceState {
  // Document
  documentId: string | null;
  documentMeta: DocumentMeta | null;
  isLoading: boolean;
  error: string | null;

  // Save state
  saveStatus: "idle" | "saving" | "saved" | "error";
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;

  // Editor
  isEditorReady: boolean;
}

export interface EditorSliceActions {
  // Document loading
  setDocumentId: (id: string | null) => void;
  setDocumentMeta: (meta: DocumentMeta | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Save state
  setSaveStatus: (status: EditorSliceState["saveStatus"]) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  markAsSaved: () => void;

  // Editor
  setEditorReady: (ready: boolean) => void;

  // Meta updates
  updateTitle: (title: string) => void;
  updateTags: (tags: string[]) => void;
}

export type EditorSlice = EditorSliceState & EditorSliceActions;

// Initial state
const initialEditorState: EditorSliceState = {
  documentId: null,
  documentMeta: null,
  isLoading: false,
  error: null,
  saveStatus: "idle",
  hasUnsavedChanges: false,
  lastSavedAt: null,
  isEditorReady: false,
};
```

#### chatSlice

```typescript
// app/(pages)/docs/store/slices/chatSlice.ts

import type { UIMessage } from "ai";

export interface ChatSliceState {
  // Agent selection
  selectedAgentId: string | null;

  // Thread
  activeThreadId: string | null;
  threads: Array<{ id: string; title: string; createdAt: string }>;

  // Messages
  messages: UIMessage[];
  isStreaming: boolean;
  isLoadingMessages: boolean;

  // Agent editing
  isAgentEditing: boolean;
  agentEditHighlight: { start: number; end: number } | null;

  // Error
  error: string | null;
}

export interface ChatSliceActions {
  // Agent
  setSelectedAgentId: (agentId: string | null) => void;

  // Threads
  setActiveThreadId: (threadId: string | null) => void;
  setThreads: (threads: ChatSliceState["threads"]) => void;
  addThread: (thread: ChatSliceState["threads"][0]) => void;

  // Messages
  setMessages: (messages: UIMessage[]) => void;
  addMessage: (message: UIMessage) => void;
  appendToLastMessage: (content: string) => void;
  clearMessages: () => void;

  // Streaming
  setIsStreaming: (streaming: boolean) => void;
  setIsLoadingMessages: (loading: boolean) => void;

  // Agent editing
  setIsAgentEditing: (editing: boolean) => void;
  setAgentEditHighlight: (highlight: ChatSliceState["agentEditHighlight"]) => void;
  clearAgentEditHighlight: () => void;

  // Error
  setError: (error: string | null) => void;
}

export type ChatSlice = ChatSliceState & ChatSliceActions;

// Initial state
const initialChatState: ChatSliceState = {
  selectedAgentId: null,
  activeThreadId: null,
  threads: [],
  messages: [],
  isStreaming: false,
  isLoadingMessages: false,
  isAgentEditing: false,
  agentEditHighlight: null,
  error: null,
};
```

#### uiSlice

```typescript
// app/(pages)/docs/store/slices/uiSlice.ts

export interface UiSliceState {
  // Layout
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  rightSidebarTab: "chat" | "history" | "settings";

  // Properties panel
  propertiesExpanded: boolean;

  // Dialogs
  deleteDialogOpen: boolean;
  linkDialogOpen: boolean;
}

export interface UiSliceActions {
  // Sidebar
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
  setRightSidebarTab: (tab: UiSliceState["rightSidebarTab"]) => void;

  // Properties
  toggleProperties: () => void;
  setPropertiesExpanded: (expanded: boolean) => void;

  // Dialogs
  setDeleteDialogOpen: (open: boolean) => void;
  setLinkDialogOpen: (open: boolean) => void;

  // Reset
  resetUiState: () => void;
}

export type UiSlice = UiSliceState & UiSliceActions;

// Initial state
const initialUiState: UiSliceState = {
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  rightSidebarTab: "chat",
  propertiesExpanded: true,
  deleteDialogOpen: false,
  linkDialogOpen: false,
};
```

#### historySlice

```typescript
// app/(pages)/docs/store/slices/historySlice.ts

export interface VersionEntry {
  id: string;
  timestamp: string;
  author: {
    type: "user" | "agent";
    id: string;
    name: string;
  };
  summary?: string;
  wordCount: number;
}

export interface HistorySliceState {
  versions: VersionEntry[];
  selectedVersionId: string | null;
  previewContent: string | null;
  isLoading: boolean;
  isRestoring: boolean;
}

export interface HistorySliceActions {
  // Versions
  setVersions: (versions: VersionEntry[]) => void;
  addVersion: (version: VersionEntry) => void;

  // Selection
  selectVersion: (versionId: string | null) => void;
  setPreviewContent: (content: string | null) => void;

  // Loading
  setIsLoading: (loading: boolean) => void;
  setIsRestoring: (restoring: boolean) => void;

  // Actions
  clearHistory: () => void;
}

export type HistorySlice = HistorySliceState & HistorySliceActions;

// Initial state
const initialHistoryState: HistorySliceState = {
  versions: [],
  selectedVersionId: null,
  previewContent: null,
  isLoading: false,
  isRestoring: false,
};
```

---

## 4. Data Models

### Document File Format

Documents are stored as Markdown with YAML frontmatter:

```markdown
---
id: "doc_abc123def456"
title: "Meeting Notes - Q4 Planning"
created: "2025-12-10T14:30:00.000Z"
updated: "2025-12-10T16:45:00.000Z"
author: "user_xyz789"
tags:
  - meetings
  - q4
  - planning
agents_with_access:
  - agent_id: "agent_zen"
    permission: "read_write"
    granted_at: "2025-12-10T14:30:00.000Z"
  - agent_id: "agent_mira"
    permission: "read"
    granted_at: "2025-12-10T15:00:00.000Z"
---

# Meeting Notes - Q4 Planning

## Attendees

- Alice (PM)
- Bob (Engineering)
- Carol (Design)

## Agenda

1. Review Q3 results
2. Discuss Q4 priorities
3. Assign owners

## Action Items

- [ ] Alice to draft roadmap by Friday
- [ ] Bob to estimate engineering capacity
- [ ] Carol to create design mockups

## Notes

Lorem ipsum dolor sit amet...
```

### TypeScript Types

```typescript
// app/api/docs/services/types.ts

export interface DocumentFrontmatter {
  id: string;
  title: string;
  created: string;
  updated: string;
  author: string;
  tags: string[];
  agents_with_access: AgentAccess[];
}

export interface AgentAccess {
  agent_id: string;
  permission: "read" | "read_write";
  granted_at: string;
}

export interface Document {
  frontmatter: DocumentFrontmatter;
  content: string; // Markdown content (without frontmatter)
}

export interface DocumentVersion {
  id: string; // timestamp-based: "v_1733842200000"
  timestamp: string;
  author: {
    type: "user" | "agent";
    id: string;
    name: string;
  };
  content: string; // Full Markdown including frontmatter
  wordCount: number;
}

export interface DocumentListItem {
  id: string;
  title: string;
  updated: string;
  wordCount: number;
  tags: string[];
}
```

### API Response Types

```typescript
// GET /api/docs
export interface ListDocumentsResponse {
  documents: DocumentListItem[];
  total: number;
}

// GET /api/docs/[docId]
export interface GetDocumentResponse {
  document: Document;
}

// POST /api/docs
export interface CreateDocumentRequest {
  title?: string;
}

export interface CreateDocumentResponse {
  document: Document;
}

// PUT /api/docs/[docId]
export interface UpdateDocumentRequest {
  content?: string; // Full Markdown with frontmatter
  title?: string;
  tags?: string[];
}

export interface UpdateDocumentResponse {
  document: Document;
  version?: DocumentVersion; // If version was created
}

// GET /api/docs/[docId]/versions
export interface ListVersionsResponse {
  versions: DocumentVersion[];
}

// POST /api/docs/[docId]/versions/[versionId]/restore
export interface RestoreVersionResponse {
  document: Document;
  newVersion: DocumentVersion;
}
```

---

## 5. Agent Tools Specification

### Tool: sys_doc_read

```typescript
const sysDocRead = tool({
  description: "Read the full content of the current document",
  inputSchema: z.object({}),
  execute: async () => {
    // Read document content
    // Return Markdown content
  },
});

// Response
{
  content: "# Title\n\nDocument content...",
  wordCount: 450,
  title: "Document Title"
}
```

### Tool: sys_doc_get_section

```typescript
const sysDocGetSection = tool({
  description: "Get content of a specific heading section",
  inputSchema: z.object({
    heading: z.string().describe("The heading text to find"),
  }),
  execute: async ({ heading }) => {
    // Find heading, return content until next heading
  },
});

// Response
{
  found: true,
  heading: "## Action Items",
  content: "- [ ] Task 1\n- [ ] Task 2",
  startLine: 45,
  endLine: 52
}
```

### Tool: sys_doc_insert

```typescript
const sysDocInsert = tool({
  description: "Insert text into the document",
  inputSchema: z.object({
    content: z.string().describe("The text/Markdown to insert"),
    position: z.enum(["cursor", "end", "after_heading"]).describe("Where to insert"),
    afterHeading: z.string().optional().describe("Heading to insert after (if position is after_heading)"),
  }),
  execute: async ({ content, position, afterHeading }) => {
    // Insert content at specified position
    // Return success + updated excerpt
  },
});

// Response
{
  success: true,
  insertedAt: "after_heading",
  excerpt: "...inserted content preview..."
}
```

### Tool: sys_doc_replace

```typescript
const sysDocReplace = tool({
  description: "Replace text in the document",
  inputSchema: z.object({
    search: z.string().describe("Text to find and replace"),
    replacement: z.string().describe("New text to insert"),
    replaceAll: z.boolean().optional().describe("Replace all occurrences"),
  }),
  execute: async ({ search, replacement, replaceAll }) => {
    // Find and replace text
  },
});

// Response
{
  success: true,
  replacements: 1,
  excerpt: "...replacement context..."
}
```

### Tool: sys_doc_get_properties

```typescript
const sysDocGetProperties = tool({
  description: "Get document properties (frontmatter)",
  inputSchema: z.object({}),
  execute: async () => {
    // Return frontmatter data
  },
});

// Response
{
  title: "Meeting Notes",
  tags: ["meetings", "q4"],
  created: "2025-12-10T14:30:00Z",
  updated: "2025-12-10T16:45:00Z"
}
```

### Tool: sys_doc_set_property

```typescript
const sysDocSetProperty = tool({
  description: "Update a document property",
  inputSchema: z.object({
    property: z.enum(["title", "tags"]).describe("Property to update"),
    value: z.union([z.string(), z.array(z.string())]).describe("New value"),
  }),
  execute: async ({ property, value }) => {
    // Update frontmatter property
  },
});

// Response
{
  success: true,
  property: "tags",
  oldValue: ["meetings"],
  newValue: ["meetings", "q4", "planning"]
}
```

---

## 6. Lexical Configuration

### Node Types

```typescript
// app/(pages)/docs/components/editor/config.ts

import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { TableNode, TableRowNode, TableCellNode } from "@lexical/table";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
// Custom nodes
import { CalloutNode } from "./nodes/CalloutNode";
import { CheckboxNode } from "./nodes/CheckboxNode";

export const EDITOR_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  HorizontalRuleNode,
  // Custom
  CalloutNode,
  CheckboxNode,
];
```

### Editor Theme

```typescript
// app/(pages)/docs/components/editor/theme.ts

export const editorTheme = {
  // Root
  root: "focus:outline-none",

  // Text
  text: {
    bold: "font-bold",
    italic: "italic",
    strikethrough: "line-through",
    underline: "underline",
    code: "bg-muted rounded px-1.5 py-0.5 font-mono text-sm",
  },

  // Paragraph
  paragraph: "mb-3 leading-relaxed",

  // Headings
  heading: {
    h1: "text-3xl font-bold mb-4 mt-6 first:mt-0",
    h2: "text-2xl font-bold mb-3 mt-5",
    h3: "text-xl font-semibold mb-2 mt-4",
    h4: "text-lg font-semibold mb-2 mt-3",
  },

  // Lists
  list: {
    ul: "list-disc list-outside ml-6 mb-3",
    ol: "list-decimal list-outside ml-6 mb-3",
    listitem: "mb-1",
    nested: {
      listitem: "list-none",
    },
    listitemChecked: "line-through text-muted-foreground",
    listitemUnchecked: "",
  },

  // Quote
  quote: "border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground mb-3",

  // Code
  code: "bg-muted rounded-lg p-4 font-mono text-sm mb-3 overflow-x-auto",
  codeHighlight: {
    // Syntax highlighting classes
    atrule: "text-purple-600",
    attr: "text-blue-600",
    boolean: "text-orange-600",
    builtin: "text-cyan-600",
    cdata: "text-gray-500",
    char: "text-green-600",
    class: "text-yellow-600",
    "class-name": "text-yellow-600",
    comment: "text-gray-500 italic",
    constant: "text-purple-600",
    deleted: "text-red-600",
    doctype: "text-gray-500",
    entity: "text-red-600",
    function: "text-blue-600",
    important: "text-red-600 font-bold",
    inserted: "text-green-600",
    keyword: "text-purple-600",
    namespace: "text-gray-600",
    number: "text-green-600",
    operator: "text-gray-600",
    prolog: "text-gray-500",
    property: "text-blue-600",
    punctuation: "text-gray-600",
    regex: "text-red-600",
    selector: "text-yellow-600",
    string: "text-green-600",
    symbol: "text-purple-600",
    tag: "text-red-600",
    url: "text-blue-600 underline",
    variable: "text-red-600",
  },

  // Link
  link: "text-blue-600 underline hover:text-blue-800",

  // Table
  table: "border-collapse w-full mb-3",
  tableCell: "border border-border p-2",
  tableCellHeader: "border border-border p-2 font-bold bg-muted",
  tableRow: "",

  // Horizontal rule
  hr: "border-t border-border my-4",

  // Custom: Callout
  callout: {
    note: "bg-blue-50 border-l-4 border-blue-500 p-4 mb-3 rounded-r",
    tip: "bg-green-50 border-l-4 border-green-500 p-4 mb-3 rounded-r",
    warning: "bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-3 rounded-r",
    caution: "bg-red-50 border-l-4 border-red-500 p-4 mb-3 rounded-r",
  },
};
```

### Plugin Configuration

```typescript
// app/(pages)/docs/components/editor/DocEditor.tsx

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";

// Custom plugins
import { SlashCommandPlugin } from "./plugins/SlashCommandPlugin";
import { BlockHandlePlugin } from "./plugins/BlockHandlePlugin";
import { FloatingToolbarPlugin } from "./plugins/FloatingToolbarPlugin";
import { AutoSavePlugin } from "./plugins/AutoSavePlugin";
import { CodeHighlightPlugin } from "./plugins/CodeHighlightPlugin";

export function DocEditor() {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      {/* Content */}
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={<Placeholder />}
        ErrorBoundary={LexicalErrorBoundary}
      />

      {/* Built-in plugins */}
      <HistoryPlugin />
      <ListPlugin />
      <LinkPlugin />
      <TablePlugin />
      <CheckListPlugin />
      <HorizontalRulePlugin />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />

      {/* Custom plugins */}
      <SlashCommandPlugin />
      <BlockHandlePlugin />
      <FloatingToolbarPlugin />
      <AutoSavePlugin debounceMs={2000} />
      <CodeHighlightPlugin />
    </LexicalComposer>
  );
}
```

---

## 7. API Endpoints

### Document CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/docs` | List all documents |
| POST | `/api/docs` | Create new document |
| GET | `/api/docs/[docId]` | Get document content |
| PUT | `/api/docs/[docId]` | Update document |
| DELETE | `/api/docs/[docId]` | Delete document |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/docs/[docId]/chat` | Stream chat response |
| GET | `/api/docs/[docId]/threads` | List chat threads |
| POST | `/api/docs/[docId]/threads` | Create new thread |
| GET | `/api/docs/[docId]/threads/[threadId]` | Get thread messages |
| DELETE | `/api/docs/[docId]/threads/[threadId]` | Delete thread |

### Versions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/docs/[docId]/versions` | List versions |
| GET | `/api/docs/[docId]/versions/[versionId]` | Get version content |
| POST | `/api/docs/[docId]/versions/[versionId]/restore` | Restore version |

### Access Control

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/docs/[docId]/access` | Get access info |
| POST | `/api/docs/[docId]/access/agents` | Grant agent access |
| DELETE | `/api/docs/[docId]/access/agents/[agentId]` | Revoke access |

---

## 8. Key Implementation Patterns

### Document Loading Flow

```
1. Page loads → store action fetches document via API
2. API returns { frontmatter, content }
3. gray-matter already parsed on server
4. Content loaded into Lexical: $convertFromMarkdownString()
5. Frontmatter stored in editorSlice
6. Editor ready, user can edit
```

### Auto-Save Flow

```
1. User types → Lexical fires update event
2. AutoSavePlugin detects changes
3. Store: setHasUnsavedChanges(true)
4. Debounce timer starts (2 seconds)
5. Timer fires → setSaveStatus("saving")
6. Export: $convertToMarkdownString()
7. Combine with frontmatter: matter.stringify()
8. PUT /api/docs/[docId]
9. Success → setSaveStatus("saved"), create version
10. Error → setSaveStatus("error")
```

### Agent Edit Flow

```
1. User sends chat message
2. Agent receives document context
3. Agent calls sys_doc_insert/replace
4. Server-side: Modify document file
5. Response via SSE: { type: "doc_edit", ... }
6. Client receives edit event
7. Store: setIsAgentEditing(true)
8. Editor: Apply changes programmatically
9. Highlight inserted content
10. Create version with agent attribution
11. Clear highlight after 2 seconds
```

### Version Creation Flow

```
1. Trigger: Save, Agent edit, Manual snapshot
2. Read current content.md
3. Generate version ID: `v_${Date.now()}`
4. Copy to _versions/v_[timestamp].md
5. Store metadata: author, timestamp, wordCount
6. Prune old versions if > limit (50)
```

---

## 9. File Count Summary

| Category | New Files | Modified Files |
|----------|-----------|----------------|
| Pages | 2 | 0 |
| Store | 5 | 0 |
| Editor Components | 8 | 0 |
| Editor Plugins | 5 | 0 |
| Outline Components | 2 | 0 |
| Properties Components | 2 | 0 |
| Chat Components | 4 | 0 |
| History Components | 2 | 0 |
| Settings Components | 2 | 0 |
| Catalog Components | 4 | 0 |
| API Routes | 12 | 0 |
| API Services | 5 | 0 |
| TopNav | 0 | 1 |
| Package.json | 0 | 1 |
| **Total** | **53** | **2** |

---

## 10. Related Documents

- **Product Spec:** `00-Product-Spec.md`
- **Research Log:** `01-Research-Log.md`
- **Phase 0 Spike:** `02-Phase0-Technical-Spike.md`
- **Implementation Plan:** `04-Implementation-Plan.md`
- **UXD Mockups:** `_docs/UXD/Pages/records/2025-12-10-docs-v1/`
- **Records Architecture (Pattern):** `_docs/_tasks/20-records-feature/01-Technical-Architecture.md`
- **Store Pattern:** `_docs/Engineering/Architecture/Store-Slice-Architecture.md`

---

**Last Updated:** December 2025
