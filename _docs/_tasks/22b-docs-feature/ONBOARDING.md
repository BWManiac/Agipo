# Docs Feature - Developer Onboarding Guide

> Complete implementation guide for the Agipo Docs feature. This document contains everything you need to build a Markdown-based document editor with AI chat integration.

**Estimated Total Effort:** ~7,400 lines of code across 8 phases
**Target Completion:** Self-contained feature, can be built incrementally

---

## Table of Contents

1. [What You're Building](#what-youre-building)
2. [Success Criteria](#success-criteria)
3. [Prerequisites](#prerequisites)
4. [Architecture Overview](#architecture-overview)
5. [Complete File Impact Analysis](#complete-file-impact-analysis)
6. [Implementation Phases](#implementation-phases)
7. [Key Patterns to Follow](#key-patterns-to-follow)
8. [Testing Checklist](#testing-checklist)
9. [Documentation Reference](#documentation-reference)

---

## What You're Building

The Docs feature is a rich text document editor that combines:

- **Google Docs familiarity** - Floating toolbar, familiar formatting shortcuts
- **Obsidian's Markdown storage** - Documents stored as plain `.md` files with YAML frontmatter
- **Notion's block editing** - Slash commands, block handles, drag-and-drop

### Core User Flows

1. **Document Catalog** (`/docs`) - Browse, create, delete documents
2. **Document Editor** (`/docs/[docId]`) - Rich text editing with auto-save
3. **AI Chat Sidebar** - Ask questions, get AI to edit document sections
4. **Version History** - Browse snapshots, preview, restore previous versions

---

## Success Criteria

Your implementation is complete when a user can:

### Must Have (MVP)

- [ ] Navigate to `/docs` and see a list of all documents
- [ ] Create a new document with a title
- [ ] Click a document to open it in the editor
- [ ] Edit document content with rich text formatting (bold, italic, headings, lists, code blocks)
- [ ] See content auto-save (indicator shows "Saving..." then "Saved")
- [ ] Use keyboard shortcuts (Cmd+B for bold, Cmd+I for italic, etc.)
- [ ] Use slash commands (type `/` to see block insertion menu)
- [ ] Delete a document from the catalog
- [ ] Open chat sidebar and ask AI about the document
- [ ] Have AI insert/replace content in the document

### Should Have

- [ ] View document outline (headings navigation)
- [ ] Edit document properties (title, tags, description)
- [ ] See document statistics (word count, reading time)
- [ ] Browse version history
- [ ] Preview a previous version
- [ ] Restore a previous version
- [ ] Use drag handles to reorder blocks
- [ ] Press `?` to see keyboard shortcuts dialog

### Data Integrity

- [ ] Documents persist after page refresh
- [ ] Auto-save doesn't lose content
- [ ] Version snapshots are created periodically
- [ ] Restore creates a backup before overwriting

---

## Prerequisites

### Install Dependencies

Run these commands before starting:

```bash
# Core Lexical packages (editor framework)
npm install lexical @lexical/react @lexical/markdown @lexical/rich-text \
  @lexical/list @lexical/link @lexical/code @lexical/selection @lexical/history

# Utilities
npm install gray-matter react-markdown date-fns
```

### Add ShadCN Components

```bash
npx shadcn@latest add dropdown-menu popover tooltip sheet separator badge \
  alert-dialog scroll-area skeleton
```

### Verify Existing Dependencies

These should already be in `package.json`:
- `zustand` (state management)
- `@mastra/core` (AI agent framework)
- `ai` / `@ai-sdk/react` (AI SDK)

---

## Architecture Overview

### Key Architectural Constraints

**IMPORTANT:** Follow these patterns exactly:

1. **No `/components/docs/` folder** - All components live in `app/(pages)/docs/components/`
2. **No `/hooks/` folder** - All state management via Zustand store slices
3. **No TanStack Query** - Use direct `fetch()` calls within store actions
4. **Single composed store** - One `useDocsStore` hook composing all slices

### Directory Structure

```
app/
├── (pages)/
│   └── docs/                              # FEATURE ROOT
│       ├── page.tsx                       # Catalog page (/docs)
│       ├── [docId]/
│       │   └── page.tsx                   # Editor page (/docs/[docId])
│       ├── components/                    # ALL UI COMPONENTS HERE
│       │   ├── catalog/
│       │   │   ├── index.ts
│       │   │   ├── DocumentCard.tsx
│       │   │   ├── DocumentGrid.tsx
│       │   │   └── CreateDocumentButton.tsx
│       │   ├── editor/
│       │   │   ├── index.ts
│       │   │   ├── DocumentEditor.tsx     # Main editor wrapper
│       │   │   ├── EditorContainer.tsx    # Lexical composer setup
│       │   │   ├── EditorContent.tsx      # ContentEditable wrapper
│       │   │   ├── DocumentHeader.tsx
│       │   │   ├── SaveIndicator.tsx
│       │   │   ├── ChatToggle.tsx
│       │   │   ├── HistoryToggle.tsx
│       │   │   ├── HelpButton.tsx
│       │   │   ├── themes/
│       │   │   │   └── editorTheme.ts
│       │   │   ├── nodes/
│       │   │   │   └── index.ts
│       │   │   ├── plugins/
│       │   │   │   ├── AutoSavePlugin.tsx
│       │   │   │   ├── MarkdownPlugin.tsx
│       │   │   │   ├── OnChangePlugin.tsx
│       │   │   │   ├── FloatingToolbarPlugin.tsx
│       │   │   │   ├── KeyboardShortcutsPlugin.tsx
│       │   │   │   ├── LinkPlugin.tsx
│       │   │   │   ├── SlashCommandPlugin.tsx
│       │   │   │   ├── BlockHandlePlugin.tsx
│       │   │   │   └── ShortcutsHelpPlugin.tsx
│       │   │   └── utils/
│       │   │       └── useDocumentOutline.ts
│       │   ├── toolbar/
│       │   │   ├── index.ts
│       │   │   ├── FloatingToolbar.tsx
│       │   │   ├── FormatButton.tsx
│       │   │   └── LinkEditor.tsx
│       │   ├── blocks/
│       │   │   ├── index.ts
│       │   │   ├── SlashCommandMenu.tsx
│       │   │   ├── BlockHandle.tsx
│       │   │   └── command-data.ts
│       │   ├── chat/
│       │   │   ├── index.ts
│       │   │   ├── ChatSidebar.tsx
│       │   │   ├── ChatMessages.tsx
│       │   │   ├── ChatInput.tsx
│       │   │   └── ChatMessage.tsx
│       │   ├── outline/
│       │   │   ├── index.ts
│       │   │   ├── OutlineSidebar.tsx
│       │   │   ├── OutlineItem.tsx
│       │   │   └── OutlineEmpty.tsx
│       │   ├── properties/
│       │   │   ├── index.ts
│       │   │   ├── PropertiesPanel.tsx
│       │   │   ├── TitleEditor.tsx
│       │   │   ├── TagEditor.tsx
│       │   │   ├── DescriptionEditor.tsx
│       │   │   └── DocumentStats.tsx
│       │   ├── history/
│       │   │   ├── index.ts
│       │   │   ├── HistoryPanel.tsx
│       │   │   ├── HistoryItem.tsx
│       │   │   ├── VersionPreview.tsx
│       │   │   └── RestoreDialog.tsx
│       │   ├── shortcuts/
│       │   │   ├── index.ts
│       │   │   ├── ShortcutsDialog.tsx
│       │   │   └── shortcuts-data.ts
│       │   └── common/
│       │       ├── index.ts
│       │       ├── ErrorBoundary.tsx
│       │       ├── ErrorFallback.tsx
│       │       ├── LoadingSkeleton.tsx
│       │       ├── EmptyState.tsx
│       │       └── MotionPreference.tsx
│       └── store/                         # ZUSTAND STORE
│           ├── index.ts                   # Composed store export
│           ├── types.ts                   # Type definitions
│           └── slices/
│               ├── catalogSlice.ts        # Document list state
│               ├── editorSlice.ts         # Editor content, save status
│               ├── chatSlice.ts           # Chat messages, history
│               ├── uiSlice.ts             # Panel visibility
│               └── historySlice.ts        # Version list, preview
├── api/
│   └── docs/
│       ├── README.md                      # API documentation
│       ├── route.ts                       # GET (list), POST (create)
│       ├── [docId]/
│       │   ├── route.ts                   # GET, PATCH, DELETE document
│       │   ├── chat/
│       │   │   └── route.ts               # POST chat messages
│       │   └── versions/
│       │       ├── route.ts               # GET list, POST create snapshot
│       │       ├── services.ts            # Version CRUD logic
│       │       └── [versionId]/
│       │           └── route.ts           # GET version, POST restore
│       └── services/
│           ├── index.ts
│           ├── types.ts                   # Document, Frontmatter types
│           ├── document-service.ts        # CRUD operations
│           ├── doc-agent.ts               # Mastra agent config
│           └── doc-tools.ts               # Agent tools definitions
└── _tables/
    └── documents/                         # FILE STORAGE
        └── [docId]/
            ├── content.md                 # Current document
            └── _versions/
                └── v_[timestamp].md       # Version snapshots
```

### Store Slice Pattern

All state management uses Zustand's slice composition pattern:

```typescript
// app/(pages)/docs/store/types.ts
export interface DocsStore extends
  CatalogSlice,
  EditorSlice,
  ChatSlice,
  UISlice,
  HistorySlice {}

// app/(pages)/docs/store/index.ts
import { create } from "zustand";
import { createCatalogSlice } from "./slices/catalogSlice";
import { createEditorSlice } from "./slices/editorSlice";
// ... other slices

export const useDocsStore = create<DocsStore>()((...args) => ({
  ...createCatalogSlice(...args),
  ...createEditorSlice(...args),
  ...createChatSlice(...args),
  ...createUISlice(...args),
  ...createHistorySlice(...args),
}));
```

**Usage in components:**
```typescript
// Always import from the composed store
import { useDocsStore } from "../../store";

function MyComponent() {
  const { documents, fetchDocuments, isLoading } = useDocsStore();
  // ...
}
```

---

## Complete File Impact Analysis

### New Files to Create

| File | Phase | LOC Est. | Purpose |
|------|-------|----------|---------|
| **Pages** |
| `app/(pages)/docs/page.tsx` | 1 | ~50 | Catalog page |
| `app/(pages)/docs/[docId]/page.tsx` | 2 | ~40 | Editor page |
| **Store** |
| `app/(pages)/docs/store/index.ts` | 1 | ~20 | Store composition |
| `app/(pages)/docs/store/types.ts` | 1 | ~80 | Type definitions |
| `app/(pages)/docs/store/slices/catalogSlice.ts` | 1 | ~60 | Catalog state |
| `app/(pages)/docs/store/slices/editorSlice.ts` | 2 | ~100 | Editor state |
| `app/(pages)/docs/store/slices/chatSlice.ts` | 5 | ~120 | Chat state |
| `app/(pages)/docs/store/slices/uiSlice.ts` | 6 | ~50 | UI panel state |
| `app/(pages)/docs/store/slices/historySlice.ts` | 7 | ~100 | History state |
| **Catalog Components** |
| `app/(pages)/docs/components/catalog/index.ts` | 1 | ~5 | Barrel export |
| `app/(pages)/docs/components/catalog/DocumentGrid.tsx` | 1 | ~60 | Grid layout |
| `app/(pages)/docs/components/catalog/DocumentCard.tsx` | 1 | ~80 | Card component |
| `app/(pages)/docs/components/catalog/CreateDocumentButton.tsx` | 1 | ~50 | Create button |
| **Editor Components** |
| `app/(pages)/docs/components/editor/index.ts` | 2 | ~10 | Barrel export |
| `app/(pages)/docs/components/editor/DocumentEditor.tsx` | 2 | ~100 | Main wrapper |
| `app/(pages)/docs/components/editor/EditorContainer.tsx` | 2 | ~120 | Lexical setup |
| `app/(pages)/docs/components/editor/EditorContent.tsx` | 2 | ~30 | ContentEditable |
| `app/(pages)/docs/components/editor/DocumentHeader.tsx` | 2 | ~80 | Header bar |
| `app/(pages)/docs/components/editor/SaveIndicator.tsx` | 2 | ~40 | Save status |
| `app/(pages)/docs/components/editor/ChatToggle.tsx` | 5 | ~40 | Chat button |
| `app/(pages)/docs/components/editor/HistoryToggle.tsx` | 7 | ~40 | History button |
| `app/(pages)/docs/components/editor/HelpButton.tsx` | 8 | ~40 | Help button |
| `app/(pages)/docs/components/editor/themes/editorTheme.ts` | 2 | ~80 | Lexical theme |
| `app/(pages)/docs/components/editor/nodes/index.ts` | 2 | ~30 | Node registry |
| **Editor Plugins** |
| `app/(pages)/docs/components/editor/plugins/AutoSavePlugin.tsx` | 2 | ~80 | Auto-save |
| `app/(pages)/docs/components/editor/plugins/MarkdownPlugin.tsx` | 2 | ~60 | MD import |
| `app/(pages)/docs/components/editor/plugins/OnChangePlugin.tsx` | 2 | ~40 | Change tracking |
| `app/(pages)/docs/components/editor/plugins/FloatingToolbarPlugin.tsx` | 3 | ~150 | Selection toolbar |
| `app/(pages)/docs/components/editor/plugins/KeyboardShortcutsPlugin.tsx` | 3 | ~100 | Shortcuts |
| `app/(pages)/docs/components/editor/plugins/LinkPlugin.tsx` | 3 | ~80 | Link handling |
| `app/(pages)/docs/components/editor/plugins/SlashCommandPlugin.tsx` | 4 | ~200 | Slash commands |
| `app/(pages)/docs/components/editor/plugins/BlockHandlePlugin.tsx` | 4 | ~150 | Block handles |
| `app/(pages)/docs/components/editor/plugins/ShortcutsHelpPlugin.tsx` | 8 | ~50 | Help trigger |
| `app/(pages)/docs/components/editor/utils/useDocumentOutline.ts` | 6 | ~100 | Outline extraction |
| **Toolbar Components** |
| `app/(pages)/docs/components/toolbar/index.ts` | 3 | ~5 | Barrel export |
| `app/(pages)/docs/components/toolbar/FloatingToolbar.tsx` | 3 | ~150 | Toolbar UI |
| `app/(pages)/docs/components/toolbar/FormatButton.tsx` | 3 | ~40 | Format buttons |
| `app/(pages)/docs/components/toolbar/LinkEditor.tsx` | 3 | ~100 | Link popover |
| **Block Components** |
| `app/(pages)/docs/components/blocks/index.ts` | 4 | ~5 | Barrel export |
| `app/(pages)/docs/components/blocks/SlashCommandMenu.tsx` | 4 | ~150 | Command menu |
| `app/(pages)/docs/components/blocks/BlockHandle.tsx` | 4 | ~100 | Drag handle |
| `app/(pages)/docs/components/blocks/command-data.ts` | 4 | ~80 | Command definitions |
| **Chat Components** |
| `app/(pages)/docs/components/chat/index.ts` | 5 | ~5 | Barrel export |
| `app/(pages)/docs/components/chat/ChatSidebar.tsx` | 5 | ~100 | Sidebar container |
| `app/(pages)/docs/components/chat/ChatMessages.tsx` | 5 | ~80 | Message list |
| `app/(pages)/docs/components/chat/ChatInput.tsx` | 5 | ~80 | Input field |
| `app/(pages)/docs/components/chat/ChatMessage.tsx` | 5 | ~100 | Message bubble |
| **Outline Components** |
| `app/(pages)/docs/components/outline/index.ts` | 6 | ~5 | Barrel export |
| `app/(pages)/docs/components/outline/OutlineSidebar.tsx` | 6 | ~80 | Outline panel |
| `app/(pages)/docs/components/outline/OutlineItem.tsx` | 6 | ~40 | Heading item |
| `app/(pages)/docs/components/outline/OutlineEmpty.tsx` | 6 | ~30 | Empty state |
| **Properties Components** |
| `app/(pages)/docs/components/properties/index.ts` | 6 | ~5 | Barrel export |
| `app/(pages)/docs/components/properties/PropertiesPanel.tsx` | 6 | ~120 | Properties sheet |
| `app/(pages)/docs/components/properties/TitleEditor.tsx` | 6 | ~80 | Title editing |
| `app/(pages)/docs/components/properties/TagEditor.tsx` | 6 | ~100 | Tag management |
| `app/(pages)/docs/components/properties/DescriptionEditor.tsx` | 6 | ~60 | Description |
| `app/(pages)/docs/components/properties/DocumentStats.tsx` | 6 | ~80 | Statistics |
| **History Components** |
| `app/(pages)/docs/components/history/index.ts` | 7 | ~5 | Barrel export |
| `app/(pages)/docs/components/history/HistoryPanel.tsx` | 7 | ~100 | History sheet |
| `app/(pages)/docs/components/history/HistoryItem.tsx` | 7 | ~100 | Version item |
| `app/(pages)/docs/components/history/VersionPreview.tsx` | 7 | ~120 | Preview modal |
| `app/(pages)/docs/components/history/RestoreDialog.tsx` | 7 | ~60 | Confirm dialog |
| **Shortcuts Components** |
| `app/(pages)/docs/components/shortcuts/index.ts` | 8 | ~5 | Barrel export |
| `app/(pages)/docs/components/shortcuts/ShortcutsDialog.tsx` | 8 | ~80 | Help dialog |
| `app/(pages)/docs/components/shortcuts/shortcuts-data.ts` | 8 | ~100 | Shortcut definitions |
| **Common Components** |
| `app/(pages)/docs/components/common/index.ts` | 8 | ~5 | Barrel export |
| `app/(pages)/docs/components/common/ErrorBoundary.tsx` | 8 | ~50 | Error boundary |
| `app/(pages)/docs/components/common/ErrorFallback.tsx` | 8 | ~50 | Error UI |
| `app/(pages)/docs/components/common/LoadingSkeleton.tsx` | 8 | ~80 | Loading states |
| `app/(pages)/docs/components/common/EmptyState.tsx` | 8 | ~50 | Empty states |
| `app/(pages)/docs/components/common/MotionPreference.tsx` | 8 | ~40 | Motion pref |
| **API Routes** |
| `app/api/docs/route.ts` | 1 | ~60 | List/create |
| `app/api/docs/README.md` | 1 | ~50 | Documentation |
| `app/api/docs/[docId]/route.ts` | 1 | ~100 | CRUD single doc |
| `app/api/docs/[docId]/chat/route.ts` | 5 | ~80 | Chat endpoint |
| `app/api/docs/[docId]/versions/route.ts` | 7 | ~60 | List versions |
| `app/api/docs/[docId]/versions/services.ts` | 7 | ~150 | Version logic |
| `app/api/docs/[docId]/versions/[versionId]/route.ts` | 7 | ~80 | Single version |
| **API Services** |
| `app/api/docs/services/index.ts` | 1 | ~10 | Barrel export |
| `app/api/docs/services/types.ts` | 1 | ~50 | Type definitions |
| `app/api/docs/services/document-service.ts` | 1 | ~200 | Document CRUD |
| `app/api/docs/services/doc-agent.ts` | 5 | ~80 | Mastra agent |
| `app/api/docs/services/doc-tools.ts` | 5 | ~200 | Agent tools |

### Files to Modify

| File | Change | Phase |
|------|--------|-------|
| `components/layout/TopNav.tsx` | Add "Docs" link to navigation | 1 |
| `package.json` | Already modified (Lexical deps) | 0 |

### Data Storage

Documents are stored as Markdown files:

```
_tables/documents/
├── doc_abc123/
│   ├── content.md              # Current document content
│   └── _versions/
│       ├── v_1733840400000.md  # Snapshot 1
│       ├── v_1733841200000.md  # Snapshot 2
│       └── v_1733842000000.md  # Snapshot 3
└── doc_def456/
    ├── content.md
    └── _versions/
        └── ...
```

**Document format (`content.md`):**
```markdown
---
title: My Document
description: Optional description
tags:
  - tag1
  - tag2
createdAt: 2025-12-10T10:00:00.000Z
updatedAt: 2025-12-10T15:30:00.000Z
---

# Document Content

Your Markdown content here...
```

---

## Implementation Phases

Work through these phases in order. Each phase builds on the previous.

### Phase 1: Foundation (~800 LOC)
**Document:** [05-Phase1-Foundation.md](./05-Phase1-Foundation.md)

**What you're building:**
- Document catalog page at `/docs`
- API routes for document CRUD
- File-based storage system
- Navigation link in TopNav

**Key files:**
- `app/(pages)/docs/page.tsx`
- `app/(pages)/docs/store/` (catalog slice)
- `app/(pages)/docs/components/catalog/`
- `app/api/docs/route.ts`
- `app/api/docs/[docId]/route.ts`
- `app/api/docs/services/`

**Done when:** User can see document list, create new documents, delete documents.

---

### Phase 2: Editor Core (~1,200 LOC)
**Document:** [06-Phase2-Editor-Core.md](./06-Phase2-Editor-Core.md)

**What you're building:**
- Lexical editor setup
- Markdown import/export
- Auto-save with debounce
- Editor page at `/docs/[docId]`

**Key files:**
- `app/(pages)/docs/[docId]/page.tsx`
- `app/(pages)/docs/store/slices/editorSlice.ts`
- `app/(pages)/docs/components/editor/`

**Done when:** User can open a document, edit content, and see it auto-save.

---

### Phase 3: Toolbar & Formatting (~800 LOC)
**Document:** [07-Phase3-Toolbar-Formatting.md](./07-Phase3-Toolbar-Formatting.md)

**What you're building:**
- Floating selection toolbar
- Text formatting (bold, italic, etc.)
- Link insertion/editing
- Keyboard shortcuts

**Key files:**
- `app/(pages)/docs/components/toolbar/`
- `app/(pages)/docs/components/editor/plugins/FloatingToolbarPlugin.tsx`
- `app/(pages)/docs/components/editor/plugins/KeyboardShortcutsPlugin.tsx`
- `app/(pages)/docs/components/editor/plugins/LinkPlugin.tsx`

**Done when:** User can select text and apply formatting via toolbar or keyboard shortcuts.

---

### Phase 4: Block System (~1,000 LOC)
**Document:** [08-Phase4-Block-System.md](./08-Phase4-Block-System.md)

**What you're building:**
- Slash command menu (type `/`)
- Block handles for drag-and-drop
- Block insertion (headings, lists, code, etc.)

**Key files:**
- `app/(pages)/docs/components/blocks/`
- `app/(pages)/docs/components/editor/plugins/SlashCommandPlugin.tsx`
- `app/(pages)/docs/components/editor/plugins/BlockHandlePlugin.tsx`

**Done when:** User can type `/` to see command menu, insert blocks, and drag to reorder.

---

### Phase 5: Chat Integration (~1,400 LOC)
**Document:** [09-Phase5-Chat-Integration.md](./09-Phase5-Chat-Integration.md)

**What you're building:**
- Chat sidebar with AI conversation
- Document editing tools for AI
- Mastra agent configuration

**Key files:**
- `app/(pages)/docs/components/chat/`
- `app/(pages)/docs/store/slices/chatSlice.ts`
- `app/api/docs/[docId]/chat/route.ts`
- `app/api/docs/services/doc-agent.ts`
- `app/api/docs/services/doc-tools.ts`

**Done when:** User can open chat, ask AI about document, and AI can insert/modify content.

---

### Phase 6: Outline & Properties (~700 LOC)
**Document:** [10-Phase6-Outline-Properties.md](./10-Phase6-Outline-Properties.md)

**What you're building:**
- Outline sidebar (heading navigation)
- Properties panel (title, tags, description)
- Document statistics

**Key files:**
- `app/(pages)/docs/components/outline/`
- `app/(pages)/docs/components/properties/`
- `app/(pages)/docs/store/slices/uiSlice.ts`

**Done when:** User can navigate via outline, edit document properties.

---

### Phase 7: Version History (~900 LOC)
**Document:** [11-Phase7-Version-History.md](./11-Phase7-Version-History.md)

**What you're building:**
- Automatic version snapshots
- History panel with version list
- Preview and restore functionality

**Key files:**
- `app/(pages)/docs/components/history/`
- `app/(pages)/docs/store/slices/historySlice.ts`
- `app/api/docs/[docId]/versions/`

**Done when:** User can browse history, preview old versions, restore.

---

### Phase 8: Polish & Optimization (~600 LOC)
**Document:** [12-Phase8-Polish.md](./12-Phase8-Polish.md)

**What you're building:**
- Keyboard shortcuts help dialog
- Error boundaries
- Loading skeletons
- Empty states
- Accessibility improvements

**Key files:**
- `app/(pages)/docs/components/shortcuts/`
- `app/(pages)/docs/components/common/`

**Done when:** All edge cases handled, polished user experience.

---

## Key Patterns to Follow

### 1. Store Slice Pattern

```typescript
// app/(pages)/docs/store/slices/catalogSlice.ts
import { StateCreator } from "zustand";
import type { DocsStore, CatalogSlice } from "../types";

export const createCatalogSlice: StateCreator<
  DocsStore,
  [],
  [],
  CatalogSlice
> = (set, get) => ({
  // State
  documents: [],
  isLoading: false,
  error: null,

  // Actions (use direct fetch, not TanStack Query)
  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/docs");
      const data = await response.json();
      set({ documents: data.documents, isLoading: false });
    } catch (error) {
      set({ error: "Failed to fetch", isLoading: false });
    }
  },
});
```

### 2. Component Import Pattern

```typescript
// Always use relative imports within the docs feature
import { useDocsStore } from "../../store";
import { DocumentCard } from "./DocumentCard";

// Use absolute imports for shared UI components
import { Button } from "@/components/ui/button";
```

### 3. Lexical Plugin Pattern

```typescript
// app/(pages)/docs/components/editor/plugins/MyPlugin.tsx
"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export function MyPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Register commands, listeners, etc.
    return editor.registerUpdateListener(({ editorState }) => {
      // Handle updates
    });
  }, [editor]);

  return null; // Plugins don't render UI (unless they need to)
}
```

### 4. API Route Pattern

```typescript
// app/api/docs/[docId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDocument, updateDocument } from "../services";

interface RouteContext {
  params: Promise<{ docId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { docId } = await context.params;
  // ... implementation
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { docId } = await context.params;
  const body = await request.json();
  // ... implementation
}
```

---

## Testing Checklist

Use this checklist to verify each phase:

### Phase 1 Tests
- [ ] `/docs` page loads and shows "No documents" or document list
- [ ] Click "Create Document" creates a new document
- [ ] New document appears in list
- [ ] Click delete removes document from list
- [ ] Refresh page, documents persist

### Phase 2 Tests
- [ ] Click document opens editor at `/docs/[docId]`
- [ ] Editor shows document content
- [ ] Type in editor, see "Saving..." indicator
- [ ] After delay, see "Saved" indicator
- [ ] Refresh page, edits persisted
- [ ] Markdown syntax renders (headings, bold, etc.)

### Phase 3 Tests
- [ ] Select text, floating toolbar appears
- [ ] Click Bold button, text becomes bold
- [ ] Cmd+B toggles bold
- [ ] Cmd+K opens link editor
- [ ] Add link, click link to see popover

### Phase 4 Tests
- [ ] Type `/` at start of line
- [ ] Slash menu appears
- [ ] Select "Heading 1", heading inserted
- [ ] Hover block, drag handle appears
- [ ] Drag block to reorder

### Phase 5 Tests
- [ ] Click chat toggle, sidebar opens
- [ ] Type message, send to AI
- [ ] AI responds
- [ ] Ask AI to "add a paragraph about X"
- [ ] AI inserts content in document

### Phase 6 Tests
- [ ] Click outline toggle, sidebar shows headings
- [ ] Click heading in outline, scrolls to it
- [ ] Click properties, sheet opens
- [ ] Edit title, save on blur
- [ ] Add tag, see tag badge

### Phase 7 Tests
- [ ] Click history button
- [ ] Version list shows
- [ ] Click preview on older version
- [ ] Modal shows old content
- [ ] Click restore, document updates

### Phase 8 Tests
- [ ] Press `?` key, shortcuts dialog opens
- [ ] Force error, error boundary catches it
- [ ] Refresh with slow network, skeleton shows
- [ ] Test with screen reader

---

## Documentation Reference

All detailed implementation specs are in this folder:

| Document | Content |
|----------|---------|
| [00-Product-Spec.md](./00-Product-Spec.md) | Product requirements, user stories |
| [01-Research-Log.md](./01-Research-Log.md) | Lexical research questions |
| [02-Phase0-Technical-Spike.md](./02-Phase0-Technical-Spike.md) | Lexical validation tests |
| [03-Technical-Architecture.md](./03-Technical-Architecture.md) | Architecture details |
| [04-Implementation-Plan.md](./04-Implementation-Plan.md) | Phase overview |
| [05-Phase1-Foundation.md](./05-Phase1-Foundation.md) | Phase 1 implementation |
| [06-Phase2-Editor-Core.md](./06-Phase2-Editor-Core.md) | Phase 2 implementation |
| [07-Phase3-Toolbar-Formatting.md](./07-Phase3-Toolbar-Formatting.md) | Phase 3 implementation |
| [08-Phase4-Block-System.md](./08-Phase4-Block-System.md) | Phase 4 implementation |
| [09-Phase5-Chat-Integration.md](./09-Phase5-Chat-Integration.md) | Phase 5 implementation |
| [10-Phase6-Outline-Properties.md](./10-Phase6-Outline-Properties.md) | Phase 6 implementation |
| [11-Phase7-Version-History.md](./11-Phase7-Version-History.md) | Phase 7 implementation |
| [12-Phase8-Polish.md](./12-Phase8-Polish.md) | Phase 8 implementation |

### UX Mockups

Reference mockups are at:
```
_docs/UXD/Pages/records/2025-12-10-docs-v1/
```

15 HTML files showing all major UI states.

---

## Questions?

If you have questions about:
- **Architecture decisions** → See [03-Technical-Architecture.md](./03-Technical-Architecture.md)
- **Lexical specifics** → See [01-Research-Log.md](./01-Research-Log.md)
- **UI patterns** → Reference the UX mockups
- **Existing codebase patterns** → Check `_docs/Engineering/` folder

---

**Good luck! Work through the phases in order, test as you go, and refer to the detailed phase documents for code samples.**
