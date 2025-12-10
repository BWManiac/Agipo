# Task 22a: Docs Feature — Technical Architecture

**Status:** Planning
**Date:** December 10, 2025
**Purpose:** Define the technologies, file structure, and implementation patterns for the Docs feature.

---

## 1. Technology Stack

### Frontend

| Technology | Purpose | Current Usage |
|------------|---------|---------------|
| **React 19** | UI framework | Core app |
| **Lexical** | Block-based editor engine | New: `lexical`, `@lexical/react` |
| **Zustand** | Complex UI state (editor, chat, outline) | New: `useDocsStore` |
| **@ai-sdk/react** | Chat streaming, message handling | Reuse from Workforce ChatTab |
| **Radix UI** | Accessible primitives (Dialog, Popover, Tabs) | Already in use |
| **cmdk** | Slash command menu | Already installed |
| **@dnd-kit** | Drag & drop for blocks | Already installed |
| **Tailwind CSS** | Styling | Core app |

### Backend

| Technology | Purpose | Current Usage |
|------------|---------|---------------|
| **Next.js API Routes** | REST endpoints | Core app |
| **Lexical** | Editor state management | New: Server-side serialization |
| **remark** | Markdown AST processing | New: `remark`, `remark-parse`, `remark-stringify` |
| **gray-matter** | YAML frontmatter parsing | New: `gray-matter` |
| **js-yaml** | YAML parsing/serialization | New: `js-yaml` |
| **diff** / **diff-match-patch** | Version diffing | New: `diff`, `diff-match-patch` |
| **Mastra (@mastra/core)** | Agent runtime, tool execution | Reuse from Workforce |
| **Mastra Memory (@mastra/memory)** | Thread persistence, conversation history | Reuse from Workforce |
| **Mastra RAG** | Document indexing for agents | Reuse from Workforce |
| **Zod** | Schema validation | Already in use |

### External Services

| Service | Purpose | Integration |
|---------|---------|-------------|
| **Anthropic Claude** | LLM for document agent | Via Mastra gateway |

### Data Storage

| Storage | Purpose | Location |
|---------|---------|----------|
| **File System (Markdown)** | Document content | `_tables/dox/[docId]/content.md` |
| **File System (JSON)** | Document metadata | `_tables/dox/[docId]/meta.json` |
| **LibSQL (SQLite)** | Chat thread history (via Mastra Memory) | `.mastra/memory.db` |
| **Vector DB** | Document embeddings (via Mastra RAG) | Mastra-managed |

---

## 2. File Architecture

### Frontend Structure

```
app/(pages)/dox/
├── page.tsx                              # Document catalog
├── [docId]/
│   └── page.tsx                          # Main document editor page
├── components/
│   ├── DocumentEditor/                   # Main editor component
│   │   ├── index.tsx                     # Editor container
│   │   ├── LexicalEditor.tsx             # Lexical editor wrapper
│   │   ├── Toolbar.tsx                   # Formatting toolbar
│   │   ├── SlashCommandMenu.tsx          # Slash command menu
│   │   └── BlockHandle.tsx               # Block drag handle
│   ├── DocumentOutline/                  # Left sidebar - outline
│   │   ├── index.tsx                     # Outline container
│   │   ├── OutlineItem.tsx               # Heading item
│   │   └── OutlineEmpty.tsx             # Empty state
│   ├── PropertiesPanel/                  # Properties (frontmatter)
│   │   ├── index.tsx                     # Properties container
│   │   ├── PropertyField.tsx             # Individual property field
│   │   └── PropertyAdd.tsx               # Add custom property
│   ├── ChatSidebar/                      # Right sidebar - chat
│   │   ├── index.tsx                     # Chat container
│   │   ├── ChatArea.tsx                  # Messages + input
│   │   ├── ChatEmpty.tsx                 # Empty chat state
│   │   ├── ChatInput.tsx                 # Message input
│   │   └── AgentEditingIndicator.tsx     # Agent editing feedback
│   ├── VersionHistory/                   # Version history panel
│   │   ├── index.tsx                     # Version list
│   │   ├── VersionItem.tsx                # Version entry
│   │   ├── VersionPreview.tsx             # Version preview
│   │   └── VersionCompare.tsx             # Diff view
│   ├── SettingsPanel/                     # Settings modal
│   │   ├── index.tsx                     # Settings container
│   │   ├── AccessTab.tsx                  # Agent access management
│   │   └── ActivityTab.tsx                # Activity log
│   └── DocumentHeader/                   # Document header
│       ├── index.tsx                     # Header container
│       ├── TitleEditor.tsx               # Inline title editor
│       └── SaveStatus.tsx                # Save status indicator
├── hooks/
│   ├── useDocument.ts                    # Document CRUD hooks
│   ├── useDocumentChat.ts                 # Chat streaming hook
│   └── useDocumentVersions.ts            # Version history hook
└── store/
    ├── index.ts                          # Store composition
    ├── types.ts                          # Combined store type
    └── slices/
        ├── editorSlice.ts                # Editor state
        ├── documentSlice.ts              # Document data
        ├── outlineSlice.ts               # Outline state
        ├── propertiesSlice.ts            # Properties state
        ├── chatSlice.ts                  # Chat messages & streaming
        ├── versionSlice.ts               # Version history
        ├── settingsSlice.ts              # Settings & access
        └── uiSlice.ts                    # UI state (panels, modals)
```

### Backend Structure

```
app/api/dox/
├── README.md                             # Domain overview
├── list/
│   └── route.ts                          # GET list documents
├── create/
│   └── route.ts                          # POST create document
├── [docId]/
│   ├── route.ts                          # GET read, PATCH update, DELETE
│   ├── chat/
│   │   ├── route.ts                      # POST streaming chat
│   │   └── services/
│   │       ├── document-agent.ts        # Mastra agent with doc tools
│   │       └── document-tools.ts        # Document tool definitions
│   ├── versions/
│   │   ├── route.ts                      # GET list versions
│   │   ├── [versionId]/
│   │   │   ├── route.ts                  # GET version, POST restore
│   │   │   └── compare/
│   │   │       └── route.ts              # GET version diff
│   ├── access/
│   │   ├── route.ts                      # GET access info
│   │   └── agents/
│   │       ├── route.ts                  # POST grant access
│   │       └── [agentId]/
│   │           └── route.ts              # PATCH update, DELETE revoke
│   └── activity/
│       └── route.ts                      # GET activity log
└── services/
    ├── README.md
    ├── document-storage.ts                # File system operations
    ├── markdown-parser.ts                # Markdown ↔ Lexical conversion
    ├── frontmatter.ts                    # YAML frontmatter handling
    ├── outline-generator.ts              # Extract heading structure
    └── version-manager.ts                 # Version tracking
```

### Document Storage Structure

```
_tables/dox/
├── index.ts                              # Document registry
└── [docId]/
    ├── content.md                        # Markdown content with frontmatter
    └── meta.json                         # Additional metadata (optional)
```

**Storage Pattern:** Following Records pattern (`_tables/records/[tableId]/`)

---

## 3. State Management Architecture

### Zustand Store: `useDocsStore`

Following the established slice pattern from `Store-Slice-Architecture.md`:

```typescript
// store/index.ts

import { create } from "zustand";
import { createEditorSlice } from "./slices/editorSlice";
import { createDocumentSlice } from "./slices/documentSlice";
import { createOutlineSlice } from "./slices/outlineSlice";
import { createPropertiesSlice } from "./slices/propertiesSlice";
import { createChatSlice } from "./slices/chatSlice";
import { createVersionSlice } from "./slices/versionSlice";
import { createSettingsSlice } from "./slices/settingsSlice";
import { createUiSlice } from "./slices/uiSlice";
import type { DocsStore } from "./types";

export const useDocsStore = create<DocsStore>()(
  (...args) => ({
    ...createEditorSlice(...args),
    ...createDocumentSlice(...args),
    ...createOutlineSlice(...args),
    ...createPropertiesSlice(...args),
    ...createChatSlice(...args),
    ...createVersionSlice(...args),
    ...createSettingsSlice(...args),
    ...createUiSlice(...args),
  })
);
```

### Type Composition

```typescript
// store/types.ts

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
```

### Slice Responsibilities

| Slice | Responsibility | State Examples |
|-------|----------------|----------------|
| `editorSlice` | Lexical editor state | `editor`, `isDirty`, `saveStatus` |
| `documentSlice` | Document data | `docId`, `title`, `content`, `properties` |
| `outlineSlice` | Heading structure | `headings`, `activeHeadingId` |
| `propertiesSlice` | Frontmatter properties | `properties`, `isEditing` |
| `chatSlice` | Messages, streaming, thread | `messages`, `isStreaming`, `threadId` |
| `versionSlice` | Version history | `versions`, `selectedVersionId` |
| `settingsSlice` | Access & activity | `agentAccess`, `activityLog` |
| `uiSlice` | Layout, panels, modals | `outlineCollapsed`, `chatCollapsed`, `settingsOpen` |

---

## 4. Data Flow Architecture

### Document Load Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ User navigates to /docs/[docId]                                    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ documentSlice.loadDocument(docId)                                   │
│ → GET /api/dox/[docId]                                              │
│ → document-storage.ts reads content.md                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ markdown-parser.ts parses Markdown                                  │
│ → Extracts frontmatter (gray-matter)                                 │
│ → Converts Markdown to Lexical editor state                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ editorSlice.setEditorState(lexicalState)                            │
│ → Lexical editor renders blocks                                     │
│ → outlineSlice.generateOutline(headings)                            │
│ → propertiesSlice.setProperties(frontmatter)                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Auto-Save Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ User types in editor                                                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ editorSlice.onChange() triggered                                    │
│ → Debounce timer starts (2 seconds)                                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (after 2s idle)
┌─────────────────────────────────────────────────────────────────────┐
│ editorSlice.autoSave()                                              │
│ → Convert Lexical state to Markdown                                │
│ → Merge frontmatter with content                                    │
│ → PATCH /api/dox/[docId]                                            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ document-storage.ts writes content.md                               │
│ → editorSlice.setSaveStatus("saved")                                │
│ → Footer shows "Saved just now"                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Agent Edit Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ User sends message: "Add a summary section"                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ chatSlice.sendMessage(docId, message)                                │
│ → POST /api/dox/[docId]/chat                                        │
│ → Server-Sent Events stream begins                                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ document-agent.ts processes message                                 │
│ → Agent calls sys_doc_insert tool                                   │
│ → document-tools.ts inserts block                                   │
│ → Updates document content.md                                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ SSE events streamed to client:                                       │
│ → "tool_start": { tool: "sys_doc_insert", args: {...} }            │
│ → "doc_update": { changes: [...] }                                  │
│ → "tool_complete": { result: {...} }                               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Client receives events                                              │
│ → chatSlice.addToolCall()                                           │
│ → editorSlice.applyChanges()                                        │
│ → Document updates live with highlights                             │
│ → Chat shows "Agent is editing..." indicator                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. API Contracts

### Documents API

```typescript
// GET /api/docs
// Response
{
  documents: Array<{
    id: string;
    title: string;
    updatedAt: string;
    wordCount: number;
    tags: string[];
  }>;
  count: number;
}

// POST /api/docs
// Request
{
  title?: string;
  content?: string;
  properties?: Record<string, unknown>;
}

// Response
{
  id: string;
  title: string;
  createdAt: string;
}

// GET /api/dox/[docId]
// Response
{
  id: string;
  title: string;
  content: string;           // Full Markdown with frontmatter
  properties: Record<string, unknown>;
  outline: Array<{
    level: number;
    text: string;
    id: string;
    position: number;
  }>;
  wordCount: number;
  characterCount: number;
  lastSaved: string;
}

// PATCH /api/dox/[docId]
// Request
{
  title?: string;
  content?: string;
  properties?: Record<string, unknown>;
}

// Response
{
  id: string;
  updatedAt: string;
  wordCount: number;
  outline: Array<{ level: number; text: string; id: string; position: number }>;
}
```

### Chat API

```typescript
// POST /api/dox/[docId]/chat
// Request
{
  message: string;
  threadId?: string;
}

// Response (Server-Sent Events stream)
// Event types:
// - "message_start": { messageId: string }
// - "content_delta": { delta: string }
// - "tool_start": { toolId: string, tool: string, args: Record<string, unknown> }
// - "doc_update": { changes: Array<{ type: "insert" | "replace" | "delete", position: number, content?: string }> }
// - "tool_complete": { toolId: string, result: unknown }
// - "message_complete": { messageId: string }
// - "error": { error: string }
```

### Version History API

```typescript
// GET /api/dox/[docId]/versions
// Response
{
  versions: Array<{
    id: string;
    createdAt: string;
    createdBy: {
      type: "user" | "agent";
      id: string;
      name: string;
      avatar?: string;
    };
    summary: string;
    wordCount: number;
    wordsDelta: number;
  }>;
}

// GET /api/dox/[docId]/versions/[versionId]
// Response
{
  id: string;
  content: string;
  properties: Record<string, unknown>;
  createdAt: string;
  createdBy: { type: "user" | "agent"; id: string; name: string };
}

// GET /api/dox/[docId]/versions/[versionId]/compare
// Response
{
  from: { id: string; content: string };
  to: { id: string; content: string };
  diff: {
    unified: string;         // Unified diff format
    sideBySide: Array<{      // Side-by-side format
      left: { line: string; type: "added" | "removed" | "unchanged" };
      right: { line: string; type: "added" | "removed" | "unchanged" };
    }>;
  };
}
```

---

## 6. Document Agent Tools Specification

### Tool: `sys_doc_read`

```typescript
createTool({
  id: "sys_doc_read",
  description: "Read the full document content",
  inputSchema: z.object({
    docId: z.string().describe("Document ID"),
  }),
  execute: async ({ context }, { docId }) => {
    const document = await getDocument(docId);
    return {
      title: document.title,
      content: document.content,
      properties: document.properties,
      wordCount: document.wordCount,
    };
  },
});
```

### Tool: `sys_doc_get_section`

```typescript
createTool({
  id: "sys_doc_get_section",
  description: "Get content of a specific heading section",
  inputSchema: z.object({
    docId: z.string(),
    sectionId: z.string().describe("Heading ID from outline"),
  }),
  execute: async ({ context }, { docId, sectionId }) => {
    const document = await getDocument(docId);
    const section = extractSection(document.content, sectionId);
    return {
      sectionId,
      heading: section.heading,
      content: section.content,
    };
  },
});
```

### Tool: `sys_doc_insert`

```typescript
createTool({
  id: "sys_doc_insert",
  description: "Insert content at a specific position",
  inputSchema: z.object({
    docId: z.string(),
    position: z.number().describe("Block position (0-indexed)"),
    content: z.string().describe("Markdown content to insert"),
    blockType: z.enum(["paragraph", "heading", "list", "code"]).optional(),
  }),
  execute: async ({ context }, { docId, position, content, blockType }) => {
    const document = await getDocument(docId);
    const updated = insertBlock(document.content, position, content, blockType);
    await saveDocument(docId, updated);
    return {
      success: true,
      position,
      insertedContent: content,
    };
  },
});
```

### Tool: `sys_doc_replace`

```typescript
createTool({
  id: "sys_doc_replace",
  description: "Replace content in a range",
  inputSchema: z.object({
    docId: z.string(),
    start: z.number().describe("Start position"),
    end: z.number().describe("End position"),
    content: z.string().describe("New content"),
  }),
  execute: async ({ context }, { docId, start, end, content }) => {
    const document = await getDocument(docId);
    const updated = replaceRange(document.content, start, end, content);
    await saveDocument(docId, updated);
    return {
      success: true,
      replaced: { start, end },
      newContent: content,
    };
  },
});
```

### Tool: `sys_doc_delete`

```typescript
createTool({
  id: "sys_doc_delete",
  description: "Delete content in a range",
  inputSchema: z.object({
    docId: z.string(),
    start: z.number(),
    end: z.number(),
  }),
  execute: async ({ context }, { docId, start, end }) => {
    const document = await getDocument(docId);
    const updated = deleteRange(document.content, start, end);
    await saveDocument(docId, updated);
    return {
      success: true,
      deleted: { start, end },
    };
  },
});
```

### Tool: `sys_doc_get_selection`

```typescript
createTool({
  id: "sys_doc_get_selection",
  description: "Get user's current text selection",
  inputSchema: z.object({
    docId: z.string(),
  }),
  execute: async ({ context }, { docId }) => {
    // This requires WebSocket or polling to get client-side selection
    // For v1, return empty if no selection available
    return {
      selection: context.userSelection || null,
      position: context.selectionPosition || null,
    };
  },
});
```

### Tool: `sys_doc_get_properties`

```typescript
createTool({
  id: "sys_doc_get_properties",
  description: "Get document frontmatter properties",
  inputSchema: z.object({
    docId: z.string(),
  }),
  execute: async ({ context }, { docId }) => {
    const document = await getDocument(docId);
    return {
      properties: document.properties,
    };
  },
});
```

### Tool: `sys_doc_set_property`

```typescript
createTool({
  id: "sys_doc_set_property",
  description: "Update a frontmatter property",
  inputSchema: z.object({
    docId: z.string(),
    key: z.string(),
    value: z.unknown(),
  }),
  execute: async ({ context }, { docId, key, value }) => {
    const document = await getDocument(docId);
    const updated = {
      ...document.properties,
      [key]: value,
    };
    await saveDocument(docId, { ...document, properties: updated });
    return {
      success: true,
      key,
      value,
    };
  },
});
```

---

## 7. Data Models

### Document State

```typescript
interface Document {
  id: string;
  title: string;
  content: string;           // Full Markdown with frontmatter
  properties: Record<string, unknown>;  // Parsed frontmatter
  outline: Array<{
    level: number;           // 1-6
    text: string;
    id: string;              // Anchor ID
    position: number;        // Block position
  }>;
  wordCount: number;
  characterCount: number;
  createdAt: string;
  updatedAt: string;
  lastSaved: string;
  lastEditedBy: {
    type: "user" | "agent";
    id: string;
    name: string;
    avatar?: string;
  };
}
```

### Version State

```typescript
interface DocumentVersion {
  id: string;
  documentId: string;
  content: string;
  properties: Record<string, unknown>;
  createdAt: string;
  createdBy: {
    type: "user" | "agent";
    id: string;
    name: string;
    avatar?: string;
  };
  summary: string;           // Auto-generated or provided
  wordCount: number;
  wordsDelta: number;        // Change from previous version
}
```

### Agent Access State

```typescript
interface DocumentAgentAccess {
  id: string;
  documentId: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  permission: "read" | "read-write";
  grantedAt: string;
  grantedBy: string;
}
```

### Activity Log Entry

```typescript
interface DocumentActivity {
  id: string;
  documentId: string;
  type: "edit" | "create" | "view" | "access_granted" | "access_revoked";
  actor: {
    type: "user" | "agent";
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  summary: string;
  details?: {
    wordsDelta?: number;
    section?: string;
    versionId?: string;
  };
}
```

---

## 8. Package Dependencies

### Core Lexical Packages

```json
{
  "dependencies": {
    "lexical": "^0.36.1",
    "@lexical/react": "^0.36.1",
    "@lexical/rich-text": "^0.36.1",
    "@lexical/selection": "^0.36.1",
    "@lexical/utils": "^0.36.1",
    "@lexical/list": "^0.36.1",
    "@lexical/table": "^0.36.1",
    "@lexical/code": "^0.36.1",
    "@lexical/link": "^0.36.1",
    "@lexical/rich-text": "^0.36.1",  // Includes HeadingNode, QuoteNode
    "@lexical/history": "^0.36.1",
    "@lexical/plain-text": "^0.36.1",
    "@lexical/mark": "^0.36.1",
    "@lexical/overflow": "^0.36.1",
    "@lexical/dragon": "^0.36.1",
    "@lexical/markdown": "^0.36.1"
  }
}
```

### Markdown Processing Packages

```json
{
  "dependencies": {
    "remark": "^15.0.0",
    "remark-parse": "^11.0.0",
    "remark-stringify": "^11.0.0",
    "remark-gfm": "^4.0.0",
    "remark-heading-id": "^7.0.0",
    "unified": "^11.0.0",
    "mdast": "^4.0.0",
    "unist-util-visit": "^5.0.0"
  }
}
```

### Frontmatter & Version Packages

```json
{
  "dependencies": {
    "gray-matter": "^4.0.3",
    "js-yaml": "^4.1.0",
    "diff": "^5.1.0",
    "diff-match-patch": "^1.0.5"
  }
}
```

### UI Packages (Already Installed)

- `@radix-ui/react-*` - UI primitives
- `cmdk` - Command menu (slash commands)
- `@dnd-kit/*` - Drag & drop
- `lucide-react` - Icons
- `motion` - Animations
- `zod` - Validation
- `zustand` - State management

---

## 9. Implementation Phases

### Phase 0: Technical Spike

**Goal:** Validate core technical assumptions.

**Status:** See `00-Phase0-Technical-Spike.md` for complete details.

**⚠️ Important:** After Phase 0 completes, **revisit all later phases** before executing them. If Phase 0 reveals any issues, update this architecture document accordingly.

---

### Phase 1: Core Document CRUD

**Goal:** Create backend infrastructure for document storage and basic editor.

**Depends On:** Phase 0 (Technical Spike) - Assumes all core assumptions validated.

**Files to create:**
- `app/api/dox/list/route.ts`
- `app/api/dox/create/route.ts`
- `app/api/dox/[docId]/route.ts`
- `app/api/dox/services/document-storage.ts`
- `app/api/dox/services/markdown-parser.ts`
- `app/api/dox/services/frontmatter.ts`

**Acceptance criteria:**
- Can create document via API
- Can read document via API
- Can update document via API
- Can delete document via API
- Documents stored as Markdown files
- Frontmatter parsed correctly

### Phase 2: Basic Editor UI

**Goal:** Create Lexical editor with basic blocks.

**Files to create:**
- `app/(pages)/docs/[docId]/page.tsx`
- `app/(pages)/docs/[docId]/components/DocumentEditor/`
- `app/(pages)/docs/[docId]/store/` (all slices)
- `app/(pages)/docs/[docId]/components/DocumentHeader/`

**Acceptance criteria:**
- Editor loads and displays document
- Can type and edit content
- Basic blocks work (paragraph, heading, list)
- Auto-save works
- Save status shows correctly

### Phase 3: Block Features

**Goal:** Slash commands, drag-and-drop, advanced blocks.

**Files to create:**
- `app/(pages)/docs/[docId]/components/DocumentEditor/SlashCommandMenu.tsx`
- `app/(pages)/docs/[docId]/components/DocumentEditor/BlockHandle.tsx`
- Integration with `@dnd-kit` and `cmdk`

**Acceptance criteria:**
- Slash command menu works
- Can insert blocks via slash commands
- Drag-and-drop reorders blocks
- All block types supported

### Phase 4: Document Outline & Properties

**Goal:** Outline sidebar and properties panel.

**Files to create:**
- `app/(pages)/docs/[docId]/components/DocumentOutline/`
- `app/(pages)/docs/[docId]/components/PropertiesPanel/`
- `app/api/dox/services/outline-generator.ts`

**Acceptance criteria:**
- Outline shows heading hierarchy
- Clicking heading jumps to section
- Properties panel shows frontmatter
- Properties can be edited

### Phase 5: Chat & Agent Integration

**Goal:** Chat sidebar and agent document tools.

**Files to create:**
- `app/api/dox/[docId]/chat/route.ts`
- `app/api/dox/[docId]/chat/services/document-agent.ts`
- `app/api/dox/[docId]/chat/services/document-tools.ts`
- `app/(pages)/docs/[docId]/components/ChatSidebar/`

**Acceptance criteria:**
- Chat sidebar works
- Agent can read document
- Agent can insert content
- Agent can replace content
- Agent edits show live feedback

### Phase 6: Version History

**Goal:** Version tracking, comparison, restoration.

**Files to create:**
- `app/api/dox/[docId]/versions/route.ts`
- `app/api/dox/[docId]/versions/[versionId]/route.ts`
- `app/api/dox/services/version-manager.ts`
- `app/(pages)/docs/[docId]/components/VersionHistory/`

**Acceptance criteria:**
- Versions auto-created periodically
- Version list shows all versions
- Version preview works
- Version comparison shows diff
- Can restore versions

### Phase 7: Settings & Access

**Goal:** Access management and activity log.

**Files to create:**
- `app/api/dox/[docId]/access/route.ts`
- `app/api/dox/[docId]/access/agents/route.ts`
- `app/api/dox/[docId]/activity/route.ts`
- `app/(pages)/docs/[docId]/components/SettingsPanel/`

**Acceptance criteria:**
- Can grant agent access
- Can revoke agent access
- Activity log shows edits
- Activity log filterable

### Phase 8: Polish & Validation

**Goal:** Error handling, edge cases, UX polish.

**Acceptance criteria:**
- All acceptance criteria from previous phases
- Error states handled gracefully
- Large documents handled well
- Performance optimized
- All edge cases covered

---

## 10. Testing Strategy

### Unit Tests

- Service functions (document-storage, markdown-parser, frontmatter)
- Tool execution logic
- Store slice actions
- Markdown conversion functions

### Integration Tests

- API route handlers
- Chat streaming
- Version creation and restoration
- Agent tool → document update flow

### E2E Tests (Playwright)

- Create document flow
- Edit document flow
- Agent chat flow
- Version history flow
- Access management flow

---

## 11. Security Considerations

### Document Access

- Documents scoped to user (entity ID)
- Agent access requires explicit grant
- Access checks on all API endpoints

### Content Validation

- Markdown sanitization (prevent XSS)
- Frontmatter validation (Zod schemas)
- File size limits (prevent DoS)

### Version History

- Version IDs unpredictable (UUIDs)
- Version restoration requires user confirmation
- Version deletion restricted (admin only)

---

## 12. Performance Considerations

### Large Documents

- Lexical handles large documents well (virtualized rendering)
- Markdown parsing optimized (streaming if needed)
- Outline generation cached
- Version storage optimized (full copies for v1, diffs later)

### Auto-Save

- Debounced saves (2s idle)
- Batch multiple rapid changes
- Optimistic UI updates
- Background save queue

### RAG Indexing

- Documents indexed asynchronously
- Chunking strategy: by headings and paragraphs
- Incremental indexing (only changed chunks)

---

## 13. Open Questions

| # | Question | Impact | Status |
|---|----------|--------|--------|
| 1 | How to handle concurrent edits (user + agent)? | Editor state | TBD |
| 2 | Should we support real-time collaboration? | Architecture | Out of scope (v1) |
| 3 | How to handle very large documents (>100k words)? | Performance | TBD |
| 4 | Should versions use diffs or full copies? | Storage | Full copies (v1) |
| 5 | How to handle image uploads? | Storage | URL only (v1) |

---

## 14. Related Documents

- **Product Spec:** `00-Product-Spec.md` - Complete product requirements
- **Research Log:** `02-Research-Log.md` - Package research
- **Phase 0 Spike:** `00-Phase0-Technical-Spike.md` - Core assumptions validation
- **Implementation Plan:** `04-Implementation-Plan.md` - File impact analysis
- **UXD Mockups:** `_docs/UXD/Pages/records/2025-12-10-docs-v1/`
- **Frontend-Backend Mapping:** `_docs/UXD/Pages/records/2025-12-10-docs-v1/Frontend-Backend-Mapping.md`
- **Store Pattern:** `_docs/Engineering/Architecture/Store-Slice-Architecture.md`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | Claude |

---

## 8. Implementation Patterns & Helper Functions

### Block Manipulation Patterns

Based on Phase 0 spike findings, all block manipulation requires type casting and specific API usage:

**Pattern: Type Casting for Element Nodes**
```typescript
import type { ElementNode } from "lexical";
import { $getRoot } from "lexical";

// When accessing blocks from root
editor.update(() => {
  const root = $getRoot();
  const block = root.getChildAtIndex(0);
  if (block && block.getType() === "paragraph") {
    const elementNode = block as ElementNode; // Required cast
    elementNode.clear();
    elementNode.append($createTextNode("Content"));
  }
});
```

**Pattern: Splice Operations**
```typescript
// ✅ Correct: Insert block
root.splice(1, 0, [newBlock]);  // Array of nodes required

// ✅ Correct: Delete block
root.splice(0, 1, []);  // Empty array required for deletion

// ❌ Wrong: Missing third argument
root.splice(0, 1);  // TypeScript error
```

**Pattern: Markdown Serialization**
```typescript
// ✅ Correct: Parse Markdown
editor.update(() => {
  const root = $getRoot();
  root.clear();  // IMPORTANT: Clear first
  $convertFromMarkdownString(markdown, TRANSFORMERS);
});

// ✅ Correct: Serialize to Markdown
let markdown = "";
editor.update(() => {
  markdown = $convertToMarkdownString(TRANSFORMERS);
});

// ❌ Wrong: Using read() for serialization
editor.getEditorState().read(() => {
  markdown = $convertToMarkdownString(TRANSFORMERS);  // Returns empty
});
```

### Recommended Helper Functions

Create `app/api/dox/services/document-manipulation-helpers.ts`:

```typescript
import type { ElementNode, LexicalNode, RootNode } from "lexical";

/**
 * Type guard and cast for ElementNode operations
 * Use when manipulating block content (clear, append)
 */
export function assertElementNode(node: LexicalNode): ElementNode {
  const elementTypes = ["paragraph", "heading", "quote", "list"];
  if (elementTypes.includes(node.getType())) {
    return node as ElementNode;
  }
  throw new Error(`Node type ${node.getType()} is not an ElementNode`);
}

/**
 * Replace content of an element node
 */
export function replaceBlockContent(
  block: LexicalNode,
  content: string,
  createTextNode: () => LexicalNode
): void {
  const elementNode = assertElementNode(block);
  elementNode.clear();
  elementNode.append(createTextNode());
}

/**
 * Insert block at specific position
 */
export function insertBlockAtPosition(
  root: RootNode,
  position: number,
  block: ElementNode
): void {
  root.splice(position, 0, [block]);
}

/**
 * Delete block at position
 */
export function deleteBlockAtPosition(root: RootNode, position: number): void {
  root.splice(position, 1, []);
}
```

**Source:** `02-Research-Log-Phase0.md` - Part 4, 6, 7

---

**Last Updated:** 2025-12-10  
**Phase 0 Updates:** Package list corrected, patterns documented based on spike findings
