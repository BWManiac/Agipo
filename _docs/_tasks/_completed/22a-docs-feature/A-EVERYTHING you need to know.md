# DOX Feature — File Impact Analysis (Organized by Architecture Layers)

**Date:** December 10, 2025  
**Purpose:** File impact analysis organized by architecture layers.

---

## Organization

Files are grouped by architecture layers (bottom-up), showing how each contributes to a Notion-style document editor with agentic editing.

Organization principle: Each group is a cohesive architectural concern.

---

## Goal

Primary goal: Build a block-based document editor where users create, edit, and collaborate with AI agents on documents stored as Markdown with YAML frontmatter.

How each layer contributes:
- Storage: Files persist (Git-friendly, portable)
- Service: Business logic for parsing, manipulation, versioning
- API: HTTP endpoints (CRUD, chat, versions)
- Data Fetching: React hooks (TanStack Query)
- State Management: UI state coordination (Zustand slices)
- UI Components: Visual interface (React components)
- Pages: Route-level composition (Next.js pages)

---

## File Impact by Architecture Layer

### Layer 1: Storage (Persistence Foundation)

Purpose: Documents must persist as files. Defines storage structure and registry.

Why it matters: Enables save, load, and versioning.

Files:
```
_tables/dox/
├── index.ts                    # 🆕 Document registry (array of docIds)
└── [docId]/
    └── content.md              # 🆕 Markdown + YAML frontmatter
```

| File | Purpose | Why Critical | Pattern Source |
|------|---------|--------------|----------------|
| `index.ts` | Central registry of all document IDs | Fast catalog listing without scanning directories | Similar to Records catalog (we use index vs directory scan) |
| `content.md` | Single file stores document (frontmatter + content) | Portable, Git-friendly, human-readable | Follows Records pattern (`_tables/records/[tableId]/`) |

Implementation notes:
- `index.ts` exports array: `export const documentIds: string[] = [...]`
- `content.md` format: YAML frontmatter (`---\n...\n---`) + Markdown content
- Keep registry in sync (add on create, remove on delete)
- Alternative: directory scanning (like Records) — using index.ts for Phase 1 simplicity

Total: 2 files

---

### Layer 2: Service Layer (Business Logic)

Purpose: Encapsulate business logic. Routes call services, not the file system directly.

Why it matters: Centralizes manipulation, enables testing, reusable for API routes and agent tools.

Files:
```
app/api/dox/services/
├── README.md                           # 🆕 Service documentation
├── document-storage.ts                 # 🆕 File I/O operations
├── markdown-parser.ts                  # 🆕 Lexical ↔ Markdown conversion
├── frontmatter.ts                      # 🆕 YAML frontmatter parsing/serialization
├── outline-generator.ts                # 🆕 Extract heading structure from Markdown
├── version-manager.ts                  # 🆕 Version tracking and comparison
└── document-manipulation-helpers.ts    # 🆕 Block manipulation utilities (RECOMMENDED)
```

| File | Purpose | Dependencies | Complexity |
|------|---------|--------------|------------|
| `document-storage.ts` | Read/write `content.md`, manage registry | `fs/promises`, `gray-matter`, `path` | Medium |
| `markdown-parser.ts` | Convert between Lexical editor state and Markdown strings | `lexical`, `@lexical/markdown`, `TRANSFORMERS` | **High** |
| `frontmatter.ts` | Parse/serialize YAML frontmatter from Markdown | `gray-matter`, `js-yaml` | Medium |
| `outline-generator.ts` | Extract heading structure for outline sidebar | `remark`, `remark-parse` | Medium |
| `version-manager.ts` | Create versions, compare diffs, restore | `document-storage`, `diff-match-patch` | Medium |
| `document-manipulation-helpers.ts` | Helper functions for block manipulation (type casting, splice ops) | `lexical`, TypeScript types | Low |

Critical implementation details:

`document-storage.ts` — Following Records `io.ts` pattern:
- `readDocument(docId)`: Read `content.md`, parse with gray-matter, return `{ id, title, content, properties }`
- `writeDocument(docId, data)`: Serialize frontmatter + content, write `content.md`, update registry
- `deleteDocument(docId)`: Delete directory, update registry
- `listDocuments()`: Read registry, return docIds (or scan directories like Records)

`markdown-parser.ts` — Critical patterns from Phase 0:
- `markdownToLexical(markdown)`:
  ```typescript
  editor.update(() => {
    const root = $getRoot();
    root.clear();  // MUST clear first or content appends
    $convertFromMarkdownString(markdown, TRANSFORMERS);
  });
  ```
- `lexicalToMarkdown(editorState)`:
  ```typescript
  let markdown = "";
  editor.update(() => {
    markdown = $convertToMarkdownString(TRANSFORMERS);
    // Must use update(), NOT getEditorState().read()
  });
  ```

`document-manipulation-helpers.ts` — Recommended (reduces boilerplate):
- `assertElementNode(node)`: Type guard + cast for ElementNode operations
- `insertBlockAtPosition(root, pos, block)`: Correct splice: `root.splice(pos, 0, [block])`
- `deleteBlockAtPosition(root, pos)`: Correct splice: `root.splice(pos, 1, [])`
- `replaceBlockContent(block, content)`: Encapsulates clear/append pattern

Pattern source: `app/api/records/services/io.ts`, `app/api/records/services/catalog.ts`

Total: 6-7 files (document-manipulation-helpers recommended but optional)

---

### Layer 3: API Routes (HTTP Interface)

Purpose: Expose operations via REST endpoints. Handles authentication, validation, and responses.

Why it matters: Contract between frontend and backend. Enables data fetching, mutations, and streaming.

Files:
```
app/api/dox/
├── README.md                    # 🆕 Domain overview
├── list/
│   └── route.ts                 # 🆕 GET - List all documents
├── create/
│   └── route.ts                 # 🆕 POST - Create new document
└── [docId]/
    ├── route.ts                 # 🆕 GET/PATCH/DELETE - Document CRUD
    ├── chat/
    │   ├── route.ts             # 🆕 POST - Streaming chat (SSE)
    │   └── services/
    │       ├── document-agent.ts    # 🆕 Mastra agent configuration
    │       └── document-tools.ts    # 🆕 9 document tools for agents
    ├── versions/
    │   ├── route.ts             # 🆕 GET - List versions
    │   └── [versionId]/
    │       ├── route.ts         # 🆕 GET/POST - Version details/restore
    │       └── compare/
    │           └── route.ts     # 🆕 GET - Version diff
    ├── access/
    │   ├── route.ts             # 🆕 GET - Access information
    │   └── agents/
    │       ├── route.ts         # 🆕 POST - Grant agent access
    │       └── [agentId]/
    │           └── route.ts     # 🆕 PATCH/DELETE - Update/revoke access
    └── activity/
        └── route.ts             # 🆕 GET - Activity log
```

Route responsibilities:

| Route | Methods | Purpose | Calls Services |
|-------|---------|---------|----------------|
| `/list` | GET | Catalog of all documents | `document-storage.listDocuments()` |
| `/create` | POST | Create new document | `document-storage.writeDocument()` |
| `/[docId]` | GET | Read document with content | `document-storage.readDocument()`, `markdown-parser.markdownToLexical()` |
| `/[docId]` | PATCH | Update document content/properties | `document-storage.writeDocument()`, `version-manager.createVersion()` |
| `/[docId]` | DELETE | Delete document | `document-storage.deleteDocument()` |
| `/[docId]/chat` | POST | Stream agent chat (SSE) | `document-agent.execute()`, `document-tools.*` |
| `/[docId]/versions` | GET | List version history | `version-manager.listVersions()` |
| `/[docId]/versions/[versionId]` | GET | Get version content | `version-manager.getVersion()` |
| `/[docId]/versions/[versionId]` | POST | Restore version | `version-manager.restoreVersion()` |
| `/[docId]/versions/[versionId]/compare` | GET | Compare two versions | `version-manager.compareVersions()` |
| `/[docId]/access` | GET | Get access information | `document-storage.readDocument()` (access in frontmatter) |
| `/[docId]/access/agents` | POST | Grant agent access | `document-storage.writeDocument()` (update frontmatter) |
| `/[docId]/access/agents/[agentId]` | PATCH/DELETE | Update/revoke access | `document-storage.writeDocument()` |
| `/[docId]/activity` | GET | Activity log | `document-storage.readActivity()` (future: activity.json) |

Implementation pattern (following Records):
```typescript
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const documents = await listDocuments(userId);
    return NextResponse.json({ documents });
  } catch (error) {
    console.error("[DOX] List error:", error);
    return NextResponse.json({ error: "Failed to list documents" }, { status: 500 });
  }
}
```

Pattern source: `app/api/records/list/route.ts`, `app/api/records/[tableId]/route.ts`

Total: 12 route files + 2 service files (document-agent, document-tools)

---

### Layer 4: Data Fetching Layer (React Hooks)

Purpose: React hooks that fetch from API routes. Handles caching, loading, and mutations.

Why it matters: Decouples components from API calls. Provides caching, refetching, optimistic updates.

Files:
```
app/(pages)/dox/
├── hooks/
│   └── useDocuments.ts          # 🆕 Catalog listing hook
└── [docId]/
    └── hooks/
        ├── useDocument.ts       # 🆕 Document CRUD hook
        ├── useDocumentChat.ts   # 🆕 Chat streaming hook (SSE)
        └── useDocumentVersions.ts  # 🆕 Version history hook
```

| Hook | Purpose | Returns | TanStack Query Features |
|------|---------|---------|-------------------------|
| `useDocuments()` | List all documents | `{ documents, isLoading, error }` | `useQuery` - Cached catalog |
| `useDocument(docId)` | Get single document | `{ document, isLoading, error, updateDocument, deleteDocument }` | `useQuery` + `useMutation` |
| `useDocumentChat(docId)` | Stream chat messages | `{ messages, sendMessage, isStreaming }` | `useMutation` + SSE handling |
| `useDocumentVersions(docId)` | List versions | `{ versions, isLoading, restoreVersion }` | `useQuery` + `useMutation` |

Implementation pattern:
```typescript
export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await fetch("/api/dox/list");
      const data = await res.json();
      return data.documents;
    },
  });
}
```

Pattern source: `app/(pages)/records/hooks/useRecords.ts`

Total: 4 hook files

---

### Layer 5: State Management Layer (Zustand Slices)

Purpose: Manage UI state across components. Coordinates editor, document data, outline, properties, chat, versions, settings, and panels.

Why it matters: Documents have many interconnected concerns. Slices enable cross-component coordination without prop drilling.

Files:
```
app/(pages)/dox/[docId]/store/
├── index.ts                     # 🆕 Store composition
├── types.ts                     # 🆕 Combined store type
└── slices/
    ├── editorSlice.ts           # 🆕 Editor instance, auto-save, dirty state
    ├── documentSlice.ts         # 🆕 Document data, CRUD actions
    ├── outlineSlice.ts          # 🆕 Heading structure, active heading
    ├── propertiesSlice.ts       # 🆕 Frontmatter properties, editing state
    ├── chatSlice.ts             # 🆕 Messages, streaming, thread ID
    ├── versionSlice.ts          # 🆕 Version history, selected version
    ├── settingsSlice.ts         # 🆕 Access permissions, activity log
    └── uiSlice.ts               # 🆕 Panel visibility, modal states
```

Slice responsibilities:

| Slice | State Managed | Key Actions | Why Separate |
|-------|---------------|-------------|--------------|
| `editorSlice` | Lexical editor instance, `isDirty`, `saveStatus`, `autoSaveTimer` | `initializeEditor()`, `autoSave()`, `setDirty()` | Editor lifecycle independent of document data |
| `documentSlice` | `docId`, `title`, `content`, `properties`, `isLoading` | `loadDocument()`, `updateDocument()`, `setDocument()` | Document data separate from editor state |
| `outlineSlice` | `headings[]`, `activeHeadingId`, `expandedSections` | `generateOutline()`, `setActiveHeading()` | Outline logic independent, used by sidebar |
| `propertiesSlice` | `properties`, `isEditing`, `editedProperties` | `setProperties()`, `updateProperty()`, `saveProperties()` | Properties editing state separate from document |
| `chatSlice` | `messages[]`, `isStreaming`, `threadId`, `error` | `sendMessage()`, `addMessage()`, `setStreaming()` | Chat state independent, used by sidebar |
| `versionSlice` | `versions[]`, `selectedVersionId`, `compareMode` | `loadVersions()`, `selectVersion()`, `compareVersions()` | Version history state, used by panel |
| `settingsSlice` | `agentAccess[]`, `activityLog[]`, `ragIndexed` | `loadAccess()`, `grantAccess()`, `loadActivity()` | Settings state, used by modal |
| `uiSlice` | `outlineCollapsed`, `chatCollapsed`, `settingsOpen`, `versionPanelOpen` | `toggleOutline()`, `toggleChat()`, `openSettings()` | UI state coordination, panel visibility |

Store composition pattern:
```typescript
export const useDocsStore = create<DocsStore>()(
  (...args) => ({
    ...createEditorSlice(...args),
    ...createDocumentSlice(...args),
    ...createOutlineSlice(...args),
    // ... etc
  })
);
```

Pattern source: `app/(pages)/records/store/`, `app/(pages)/workflows/editor/store/`

Total: 10 files (8 slices + index + types)

---

### Layer 6: UI Component Layer (React Components)

Purpose: Visual interface components. Each handles one concern.

Why it matters: Provides the user interface. Components are composable, testable, and follow single responsibility.

#### 6.1 Document Editor Components

Purpose: Core editing experience. Users type, format, insert blocks, reorder.

```
app/(pages)/dox/[docId]/components/DocumentEditor/
├── index.tsx                    # 🆕 Editor container (layout, coordination)
├── LexicalEditor.tsx            # 🆕 Lexical editor wrapper (React integration)
├── Toolbar.tsx                  # 🆕 Formatting toolbar (bold, italic, headings)
├── SlashCommandMenu.tsx         # 🆕 Slash command menu (`/` menu)
├── BlockHandle.tsx              # 🆕 Drag handle for block reordering
└── EmptyState.tsx               # 🆕 Empty document placeholder
```

| Component | Purpose | Store Slices Used | User Interaction |
|-----------|---------|-------------------|------------------|
| `index.tsx` | Container: coordinates editor + toolbar + status | `editorSlice`, `documentSlice`, `uiSlice` | None (orchestrates) |
| `LexicalEditor.tsx` | Renders Lexical editor, handles onChange | `editorSlice` | User types, formats text |
| `Toolbar.tsx` | Formatting buttons (B, I, H1, H2, etc.) | `editorSlice` | User clicks format buttons |
| `SlashCommandMenu.tsx` | Command menu when user types `/` | `editorSlice`, `uiSlice` | User types `/`, selects block type |
| `BlockHandle.tsx` | Drag handle for block reordering | `editorSlice` | User drags block to reorder |
| `EmptyState.tsx` | Placeholder when document is empty | `documentSlice` | None (display only) |

#### 6.2 Document Outline Components

Purpose: Left sidebar showing document structure (headings). Enables navigation.

```
app/(pages)/dox/[docId]/components/DocumentOutline/
├── index.tsx                    # 🆕 Outline container
├── OutlineItem.tsx              # 🆕 Individual heading item
└── OutlineEmpty.tsx             # 🆕 Empty state (no headings)
```

| Component | Purpose | Store Slices Used | User Interaction |
|-----------|---------|-------------------|------------------|
| `index.tsx` | Renders outline list, handles scroll sync | `outlineSlice`, `uiSlice` | User scrolls, clicks heading |
| `OutlineItem.tsx` | Single heading with indentation | `outlineSlice` | User clicks to jump to section |
| `OutlineEmpty.tsx` | Empty state message | None | None (display only) |

#### 6.3 Properties Panel Components

Purpose: Right sidebar for editing frontmatter properties.

```
app/(pages)/dox/[docId]/components/PropertiesPanel/
├── index.tsx                    # 🆕 Properties container
├── PropertyField.tsx            # 🆕 Individual property editor
└── PropertyAdd.tsx              # 🆕 Add custom property button
```

#### 6.4 Chat Sidebar Components

Purpose: Right sidebar for chatting with agents. Enables agentic editing.

```
app/(pages)/dox/[docId]/components/ChatSidebar/
├── index.tsx                    # 🆕 Chat container
├── ChatArea.tsx                 # 🆕 Messages display
├── ChatEmpty.tsx                # 🆕 Empty state
├── ChatInput.tsx                # 🆕 Message input
└── AgentEditingIndicator.tsx    # 🆕 "Agent is editing..." feedback
```

Pattern source: `app/(pages)/records/components/ChatSidebar/`

#### 6.5 Version History Components

```
app/(pages)/dox/[docId]/components/VersionHistory/
├── index.tsx                    # 🆕 Version list container
├── VersionItem.tsx              # 🆕 Single version entry
├── VersionPreview.tsx           # 🆕 Version content preview
└── VersionCompare.tsx           # 🆕 Side-by-side diff view
```

#### 6.6 Settings Panel Components

```
app/(pages)/dox/[docId]/components/SettingsPanel/
├── index.tsx                    # 🆕 Settings modal container
├── AccessTab.tsx                # 🆕 Agent access management
└── ActivityTab.tsx              # 🆕 Activity log
```

#### 6.7 Document Header Components

```
app/(pages)/dox/[docId]/components/DocumentHeader/
├── index.tsx                    # 🆕 Header container
├── TitleEditor.tsx              # 🆕 Inline title editor
└── SaveStatus.tsx               # 🆕 Save status indicator
```

Total: 30 component files

---

### Layer 7: Page Layer (Route Pages)

Purpose: Top-level page components that compose all layers. Handles routing and layout.

Why it matters: Entry points for users. Coordinates hooks, store, and components.

Files:
```
app/(pages)/dox/
├── page.tsx                     # 🆕 Document catalog page
└── [docId]/
    └── page.tsx                 # 🆕 Document editor page
```

Total: 2 page files

---

## Cross-Layer Dependencies

### Data Flow Example: User Types in Editor

```
1. User types in LexicalEditor (UI Component)
   ↓
2. onChange fires → editorSlice.setDirty(true) (State Layer)
   ↓
3. Debounced autoSave() → editorSlice.autoSave() (State Layer)
   ↓
4. autoSave() calls fetch("/api/dox/[docId]") (API Layer)
   ↓
5. PATCH route → document-storage.writeDocument() (Service Layer)
   ↓
6. writeDocument() writes _tables/dox/[docId]/content.md (Storage Layer)
```

### Example: Agent Edits Document

```
1. User sends message in ChatSidebar (UI Component)
   ↓
2. chatSlice.sendMessage() (State Layer)
   ↓
3. useDocumentChat hook streams SSE (Data Fetching Layer)
   ↓
4. POST /api/dox/[docId]/chat (API Layer)
   ↓
5. document-agent.ts executes tool → document-tools.ts (Service Layer)
   ↓
6. document-tools calls document-storage.writeDocument() (Service Layer)
   ↓
7. SSE streams "doc_update" event to client (API Layer)
   ↓
8. chatSlice receives event, updates editor (State Layer)
   ↓
9. DocumentEditor re-renders with agent changes (UI Component)
```

---

## File Count Summary by Layer

| Layer | Files | Purpose | Dependencies |
|-------|-------|---------|--------------|
| **Storage** | 2 | File persistence | None (foundation) |
| **Service** | 6-7 | Business logic | Storage layer |
| **API Routes** | 12 | HTTP endpoints | Service layer |
| **Data Fetching** | 4 | React hooks | API routes |
| **State Management** | 10 | Zustand slices | Data fetching, services |
| **UI Components** | 30 | React components | State, hooks |
| **Pages** | 2 | Route pages | All layers |
| **Total** | **66-67** | Complete feature | - |

---

## Implementation Order (By Layer)

### Phase 1: Foundation Layers (Storage → Service → API)

1. Storage Layer — Create `_tables/dox/` structure, `index.ts` registry
2. Service Layer — `document-storage.ts`, `frontmatter.ts`, `markdown-parser.ts`
3. API Routes — `/list`, `/create`, `/[docId]` (GET, PATCH, DELETE)
4. Data Fetching — `useDocuments()`, `useDocument()` hooks
5. State Management — `documentSlice.ts` (basic CRUD)
6. Pages — Catalog page, document page skeleton

Why this order: Build bottom-up. Each layer depends on the one below. Can test each layer independently.

---

## Critical Patterns by Layer

### Service Layer Patterns

Markdown Parsing (CRITICAL):
- Must call `root.clear()` before `$convertFromMarkdownString()`
- Must use `editor.update()` for serialization, NOT `read()`

Block Manipulation (CRITICAL):
- Must cast to `ElementNode` for `clear()`/`append()`
- Must use array syntax: `splice(pos, 0, [block])` or `splice(pos, 1, [])`

File Operations:
- Return `null` for missing files (don't throw)
- Pretty-print Markdown/JSON for Git-friendly diffs
- Update registry on create/delete

### API Layer Patterns

Authentication:
- All routes require `await auth()` (Clerk)
- Return 401 if no userId

Error Handling:
- Try/catch in routes
- Log errors with `[DOX]` prefix
- Return 500 with error message

---

**Analysis Complete:** This demonstrates how each architectural layer contributes to building a complete document editor with agentic editing capabilities.

---

# Updated Onboarding Document

Here's the updated onboarding document incorporating all Phase 0 findings:

---

# Onboarding: DOX Feature Development

**Last Updated:** December 10, 2025  
**Status:** Phase 0 Complete, Ready for Phase 1  
**Purpose:** Guide for developers joining the DOX feature development

---

## Welcome

You're joining the DOX feature, a Notion-style block-based document editor with agentic editing. This guide covers goals, architecture, documentation structure, and how to contribute.

---

## Project Overview: What We're Building

### Vision

DOX is a block-based document editor that:
- Stores documents as Markdown with YAML frontmatter (portable, Git-friendly)
- Provides a WYSIWYG block-based editing experience (Notion-style)
- Enables agents to read, edit, and collaborate on documents
- Combines familiar UX patterns (Google Docs toolbar, Obsidian outline/properties, Notion blocks)

### Core Differentiator

The main differentiator is agentic editing: users can chat with agents to edit documents. Agents can:
- Read document content
- Insert new sections
- Replace existing content
- Delete content
- Search within documents
- Manage document properties

This enables natural language document editing.

---

## What Success Looks Like

### User Experience

After completion, users can:

1. **Create and edit documents**
   - Create documents from a catalog
   - Edit with a WYSIWYG block editor
   - Use slash commands (`/`) to insert blocks
   - Drag and drop to reorder blocks
   - Auto-save every 2 seconds

2. **Navigate and organize**
   - View document outline (left sidebar)
   - Click headings to jump to sections
   - Edit document properties (right sidebar)
   - Add custom properties to frontmatter

3. **Collaborate with agents**
   - Chat with agents about documents
   - Agents can read and edit documents
   - See live feedback when agents edit
   - View agent attribution in version history

4. **Track changes**
   - View version history
   - Compare versions side-by-side
   - Restore previous versions
   - See who made changes (user vs agent)

5. **Manage access**
   - Grant agents access to documents
   - View activity log
   - Configure document settings

### Technical Success

- All 8 phases complete and tested
- Store slice architecture followed consistently
- API routes follow domain-driven design principles
- TanStack Query hooks handle data fetching
- Zustand slices handle UI state
- Error handling and loading states throughout
- Performance acceptable for 10k+ word documents
- Accessibility compliant (WCAG 2.1 AA)

---

## Architecture Overview

### Technology Stack

**Frontend:**
- React 19 + Next.js 16 (App Router)
- Lexical (block-based editor engine)
- Zustand (state management with slices)
- TanStack Query (data fetching/caching)
- ShadCN/Radix UI (accessible components)
- `cmdk` (slash command menu)
- `@dnd-kit` (drag-and-drop)

**Backend:**
- Next.js API Routes
- Lexical (server-side serialization)
- `remark` (Markdown AST processing)
- `gray-matter` (YAML frontmatter parsing)
- `diff-match-patch` (version diffing)
- Mastra (agent runtime)
- Mastra Memory (thread persistence)
- Mastra RAG (document indexing)

**Storage:**
- File system: `_tables/dox/[docId]/content.md` (Markdown + frontmatter)
- Optional: `_tables/dox/[docId]/meta.json` (additional metadata)

### Key Architectural Patterns

#### 1. Store Slice Architecture

We use Zustand with a 4-part slice pattern:

```typescript
// 1. State Interface
interface EditorSliceState {
  editor: LexicalEditor | null;
  isDirty: boolean;
  saveStatus: "saved" | "saving" | "error";
}

// 2. Actions Interface
interface EditorSliceActions {
  initializeEditor: (editor: LexicalEditor) => void;
  autoSave: () => Promise<void>;
}

// 3. Combined Type
export type EditorSlice = EditorSliceState & EditorSliceActions;

// 4. Initial State
const initialState: EditorSliceState = { ... };

// 5. Slice Creator
export const createEditorSlice: StateCreator<DocsStore, [], [], EditorSlice> = (set, get) => ({
  ...initialState,
  // Actions implementation
});
```

**Key Rules:**
- Components call `store.action()`, NOT services directly
- Store actions call services/APIs
- Services handle I/O, API calls, business logic
- Use `get()` to access other slices
- Use `set()` for atomic updates

**Reference:** `_docs/Engineering/Architecture/Store-Slice-Architecture.md`

#### 2. API Domain Principles

Routes follow domain-driven design:

```
app/api/dox/
├── list/route.ts          GET - List documents
├── create/route.ts        POST - Create document
└── [docId]/
    ├── route.ts           GET/PATCH/DELETE - Document CRUD
    ├── chat/route.ts      POST - Streaming chat
    ├── versions/route.ts   GET - Version history
    └── access/route.ts    GET - Access management
```

**Key Rules:**
- Collection operations: `/list`, `/create` (separate folders)
- Instance operations: `/[docId]/route.ts`
- Nested resources: `/[docId]/chat/route.ts`
- Services co-located with routes when single consumer
- Domain-level services when shared

**Reference:** `app/api/DOMAIN_PRINCIPLES.md`

#### 3. Data Fetching Pattern

TanStack Query hooks handle data fetching, Zustand slices handle UI state:

```typescript
// Hook (data fetching)
const { data, isLoading } = useDocument(docId);

// Store (UI state)
const store = useDocsStore();
store.setDocument(data);
```

**Pattern Source:** `app/(pages)/records/hooks/useRecords.ts`

---

## File Structure

### Project Location

All DOX feature files are in:
- **Backend:** `app/api/dox/`
- **Frontend:** `app/(pages)/dox/`
- **Storage:** `_tables/dox/`
- **Documentation:** `_docs/_tasks/22a-docs-feature/`

### Key Directories

```
app/api/dox/
├── README.md                    # Domain overview
├── list/route.ts                # GET list documents
├── create/route.ts              # POST create document
├── [docId]/
│   ├── route.ts                 # GET/PATCH/DELETE document
│   ├── chat/
│   │   ├── route.ts             # POST streaming chat
│   │   └── services/
│   │       ├── document-agent.ts
│   │       └── document-tools.ts
│   ├── versions/
│   │   ├── route.ts
│   │   └── [versionId]/route.ts
│   ├── access/
│   │   └── agents/route.ts
│   └── activity/route.ts
└── services/
    ├── document-storage.ts
    ├── markdown-parser.ts
    ├── frontmatter.ts
    ├── outline-generator.ts
    └── version-manager.ts

app/(pages)/dox/
├── page.tsx                     # Document catalog
├── [docId]/
│   ├── page.tsx                 # Document editor page
│   ├── components/
│   │   ├── DocumentEditor/
│   │   ├── DocumentOutline/
│   │   ├── PropertiesPanel/
│   │   ├── ChatSidebar/
│   │   ├── VersionHistory/
│   │   ├── SettingsPanel/
│   │   └── DocumentHeader/
│   ├── hooks/
│   │   ├── useDocument.ts
│   │   ├── useDocumentChat.ts
│   │   └── useDocumentVersions.ts
│   └── store/
│       ├── index.ts
│       ├── types.ts
│       └── slices/
│           ├── editorSlice.ts
│           ├── documentSlice.ts
│           ├── outlineSlice.ts
│           ├── propertiesSlice.ts
│           ├── chatSlice.ts
│           ├── versionSlice.ts
│           ├── settingsSlice.ts
│           └── uiSlice.ts

_tables/dox/
├── index.ts                     # Document registry
└── [docId]/
    └── content.md                # Markdown + frontmatter
```

---

## Documentation Structure

### How to Work with Documentation

The documentation is in `_docs/_tasks/22a-docs-feature/`. You can:
- Read existing documents
- Create new documents (following templates)
- Modify existing documents (update as you learn)
- Save changes (they're tracked in Git)

### Documentation Files to Review

#### 1. Start Here: Core Planning Documents

**`00-Product-Spec.md`**
- Product requirements
- Acceptance criteria
- User flows
- Design decisions
- Storage format specification

**`03-Technical-Architecture.md`**
- Technology stack
- File architecture
- State management architecture
- Data flow diagrams
- API contracts
- Agent tools specification
- Data models
- **Section 8:** Implementation patterns & helper functions (from Phase 0)

**`04-Implementation-Plan.md`**
- File impact analysis
- Store slice specifications
- Phase breakdown
- Dependency graph
- Risk assessment

**`FILE-IMPACT-ANALYSIS.md`** (NEW)
- File impact organized by architecture layers
- Shows how each layer contributes to goals
- Implementation order recommendations

#### 2. Research and Validation

**`02-Research-Log-Phase0.md`** ⭐ **CRITICAL READING**
- Complete findings from Phase 0 technical spike
- All 17 acceptance criteria results
- Critical patterns discovered (Markdown parsing, block manipulation)
- Type casting requirements
- Splice operation syntax
- Serialization gotchas

**`00-Phase0-Technical-Spike.md`**
- Technical spike plan
- Assumptions validated
- Spike acceptance criteria
- Test endpoint structure
- Status: ✅ Complete

**`PRE-FLIGHT-CHECK.md`** (NEW)
- Comprehensive readiness assessment
- Phase 0 validation status
- Documentation completeness
- Technical readiness checklist
- Risk assessment
- Implementation strategy recommendations

#### 3. Phase Documents (Implementation Roadmap)

**`05-Phase1-CoreDocumentCRUD.md`**
- Backend CRUD API
- Document catalog page
- Document page skeleton
- TanStack Query hooks
- Basic document slice
- **Updated:** Includes Phase 0 validated patterns

**`06-Phase2-BasicEditorUI.md`**
- Lexical editor setup
- Formatting toolbar
- Auto-save functionality
- Editor slice
- **Updated:** Correct node imports from `@lexical/rich-text`

**`07-Phase3-BlockFeatures.md`**
- Slash commands (`/`)
- Drag-and-drop reordering
- All block types (tables, code, quotes, etc.)
- Block menu
- **Updated:** Type casting and splice patterns

**`08-Phase4-OutlineAndProperties.md`**
- Document outline sidebar
- Properties panel (frontmatter editing)
- Outline generation service
- Outline and properties slices

**`09-Phase5-ChatAndAgentIntegration.md`**
- Chat sidebar
- 9 agent document tools
- Streaming chat (SSE)
- Live document updates
- Chat slice
- **Updated:** Detailed server-side editor patterns for agent tools

**`10-Phase6-VersionHistory.md`**
- Version tracking
- Version comparison (diff)
- Version restoration
- Version slice

**`11-Phase7-SettingsAndAccess.md`**
- Access management (agent permissions)
- Activity log
- Settings panel
- Settings slice

**`12-Phase8-PolishAndValidation.md`**
- Error handling
- Loading states
- Performance optimizations
- Accessibility improvements

#### 4. Developer Guide

**`01-ONBOARDING.md`** (This document)
- Developer guide with all Phase 0 findings incorporated

#### 5. Reference Documents

**`README.md`**
- Task overview
- Quick links
- Status tracking

**`PHASE0-UPDATES-SUMMARY.md`** (NEW)
- Summary of all documentation updates after Phase 0

### UXD Mockups

**Location:** `_docs/UXD/Pages/records/2025-12-10-docs-v1/`

**Files to Review:**

1. **`README.md`**
   - Product vision
   - Feature list
   - UXD requirements
   - Agent integration notes
   - Technical notes

2. **`Frontend-Backend-Mapping.md`**
   - API contracts
   - Data models
   - 9 agent document tools specification
   - Request/response examples

3. **HTML Mockups:**
   - `01-doc-editor-main.html` - Main editor interface
   - `02-chat-sidebar/02-chat-active.html` - Chat sidebar with messages
   - `02-chat-sidebar/02-chat-agent-editing.html` - Agent editing feedback
   - `03-document-outline.html` - Outline sidebar
   - `04-formatting-toolbar.html` - Toolbar UI
   - `05-settings-panel/05-settings-access.html` - Access management
   - `05-settings-panel/05-settings-activity.html` - Activity log
   - `06-version-history/06-version-history-list.html` - Version list
   - `06-version-history/06-version-history-preview.html` - Version preview
   - `07-empty-document.html` - Empty state
   - `08-text-selection.html` - Text selection UI
   - `09-slash-command-menu.html` - Slash command menu
   - `10-block-interactions.html` - Block drag handles
   - `11-block-types.html` - All block types

**How to Use:**
- Open HTML files in a browser
- Use as visual reference for UI implementation
- Match component structure and styling

---

## Implementation Approach

### Phase Order

1. **Phase 0: Technical Spike** ✅ **COMPLETE**
   - ✅ Validated Lexical/Markdown conversion
   - ✅ Validated block manipulation
   - ✅ Validated frontmatter parsing
   - ✅ Validated agent tool patterns
   - **See:** `02-Research-Log-Phase0.md` for complete findings

2. **Phase 1: Core Document CRUD** 🎯 **CURRENT FOCUS**
   - Backend API (list, create, read, update, delete)
   - Catalog page
   - Document page skeleton
   - Basic hooks and store

3. **Phase 2: Basic Editor UI**
   - Lexical editor setup
   - Formatting toolbar
   - Auto-save

4. **Phase 3: Block Features**
   - Slash commands
   - Drag-and-drop
   - All block types

5. **Phase 4: Outline & Properties**
   - Outline sidebar
   - Properties panel

6. **Phase 5: Chat & Agent Integration**
   - Chat sidebar
   - Agent tools
   - Live updates

7. **Phase 6: Version History**
   - Version tracking
   - Comparison
   - Restoration

8. **Phase 7: Settings & Access**
   - Access management
   - Activity log

9. **Phase 8: Polish & Validation**
   - Error handling
   - Performance
   - Accessibility

### Working on a Phase

1. Read the phase document
2. Review acceptance criteria
3. Review file impact analysis
4. Review pseudocode
5. Review user flows
6. Check related phases for dependencies
7. Implement following patterns
8. Test against acceptance criteria
9. Update documentation if assumptions change

### Code Patterns to Follow

#### Backend Route Pattern

```typescript
// app/api/dox/list/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { listDocuments } from "../services/document-storage";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documents = await listDocuments(userId);
    return NextResponse.json({ documents });
  } catch (error) {
    console.error("[DOX] List error:", error);
    return NextResponse.json({ error: "Failed to list documents" }, { status: 500 });
  }
}
```

**Pattern Source:** `app/api/records/list/route.ts`

#### Frontend Component Pattern

```typescript
// app/(pages)/dox/[docId]/components/DocumentEditor/index.tsx
"use client";

import { useDocsStore } from "../../store";
import { LexicalEditor } from "./LexicalEditor";

export function DocumentEditor() {
  const store = useDocsStore();
  const { editor, isDirty, saveStatus } = store;

  return (
    <div className="editor-container">
      <LexicalEditor editor={editor} />
      {/* ... */}
    </div>
  );
}
```

**Pattern Source:** `app/(pages)/records/components/RecordsGrid.tsx`

#### Store Slice Pattern

```typescript
// app/(pages)/dox/[docId]/store/slices/editorSlice.ts
import type { StateCreator } from "zustand";
import type { DocsStore } from "../types";

export interface EditorSliceState {
  editor: LexicalEditor | null;
  isDirty: boolean;
  saveStatus: "saved" | "saving" | "error";
}

export interface EditorSliceActions {
  initializeEditor: (editor: LexicalEditor) => void;
  autoSave: () => Promise<void>;
}

export type EditorSlice = EditorSliceState & EditorSliceActions;

const initialState: EditorSliceState = {
  editor: null,
  isDirty: false,
  saveStatus: "saved",
};

export const createEditorSlice: StateCreator<
  DocsStore,
  [],
  [],
  EditorSlice
> = (set, get) => ({
  ...initialState,

  initializeEditor: (editor) => {
    set({ editor });
  },

  autoSave: async () => {
    const state = get();
    if (!state.editor || !state.isDirty) return;

    set({ saveStatus: "saving" });
    
    try {
      // Convert editor state to Markdown
      const content = state.editor.getEditorState().read(() => {
        return $convertToMarkdownString(TRANSFORMERS);
      });

      // Call API
      await fetch(`/api/dox/${state.docId}`, {
        method: "PATCH",
        body: JSON.stringify({ content }),
      });

      set({ saveStatus: "saved", isDirty: false });
    } catch (error) {
      set({ saveStatus: "error" });
    }
  },
});
```

**Pattern Source:** `app/(pages)/records/store/slices/chatSlice.ts`

---

## Critical Implementation Patterns (From Phase 0)

### ⚠️ CRITICAL: Markdown Parsing Pattern

**MUST DO:** Always clear root before parsing new Markdown:

```typescript
editor.update(() => {
  const root = $getRoot();
  root.clear();  // ⚠️ CRITICAL: Clear first or content appends!
  $convertFromMarkdownString(markdown, TRANSFORMERS);
});
```

**MUST DO:** Use `editor.update()` for serialization, NOT `read()`:

```typescript
// ✅ Correct
let markdown = "";
editor.update(() => {
  markdown = $convertToMarkdownString(TRANSFORMERS);
});

// ❌ Wrong - returns empty string
editor.getEditorState().read(() => {
  markdown = $convertToMarkdownString(TRANSFORMERS);
});
```

**Reference:** `02-Research-Log-Phase0.md` Part 3

### ⚠️ CRITICAL: Block Manipulation Pattern

**MUST DO:** Cast to `ElementNode` for block operations:

```typescript
import type { ElementNode } from "lexical";

editor.update(() => {
  const root = $getRoot();
  const block = root.getChildAtIndex(0);
  if (block && block.getType() === "paragraph") {
    const elementNode = block as ElementNode;  // ⚠️ Type cast required
    elementNode.clear();
    elementNode.append($createTextNode("Content"));
  }
});
```

**MUST DO:** Use correct `splice()` signature:

```typescript
// ✅ Correct: Insert block
root.splice(1, 0, [newBlock]);  // Array of nodes required

// ✅ Correct: Delete block
root.splice(0, 1, []);  // Empty array required for deletion

// ❌ Wrong: Missing third argument
root.splice(0, 1);  // TypeScript error
```

**Reference:** `02-Research-Log-Phase0.md` Part 4, `03-Technical-Architecture.md` Section 8

### Recommended: Helper Functions

Create `app/api/dox/services/document-manipulation-helpers.ts` early to reduce boilerplate:

```typescript
export function assertElementNode(node: LexicalNode): ElementNode {
  const elementTypes = ["paragraph", "heading", "quote", "list"];
  if (elementTypes.includes(node.getType())) {
    return node as ElementNode;
  }
  throw new Error(`Node type ${node.getType()} is not an ElementNode`);
}

export function insertBlockAtPosition(
  root: RootNode,
  position: number,
  block: ElementNode
): void {
  root.splice(position, 0, [block]);
}

export function deleteBlockAtPosition(root: RootNode, position: number): void {
  root.splice(position, 1, []);
}
```

**Reference:** `03-Technical-Architecture.md` Section 8

---

## Key Decisions Made

### 1. Editor Choice: Lexical

- MIT license
- Meta-backed
- Block-based architecture
- Markdown serialization support
- Programmatic block manipulation

**Alternative Considered:** Tiptap (rejected due to licensing)

**Phase 0 Validation:** ✅ All core Lexical operations validated

### 2. Storage Format: Markdown + YAML Frontmatter

- Portable (Git-friendly)
- Human-readable
- Compatible with Lexical
- Supports properties (frontmatter)

**Example:**
```markdown
---
title: My Document
author: John Doe
tags: [project, docs]
created: 2025-12-10
updated: 2025-12-10
---

# Introduction

This is the document content...
```

**Phase 0 Validation:** ✅ `gray-matter` works perfectly for parsing/serializing

### 3. Block Nesting: Flat Structure (v1)

- Simpler implementation
- Easier Markdown conversion
- Can add nesting later

**Phase 0 Validation:** ✅ Flat structure works well for v1

### 4. Image Storage: URL-Only (v1)

- No file upload in v1
- Images via URLs
- Can add upload later

### 5. Agent Tools: 9 Tools

1. `sys_doc_read` - Read entire document
2. `sys_doc_get_section` - Get specific section
3. `sys_doc_search` - Search document
4. `sys_doc_insert` - Insert content
5. `sys_doc_replace` - Replace content
6. `sys_doc_delete` - Delete content
7. `sys_doc_get_selection` - Get selected text
8. `sys_doc_get_properties` - Get frontmatter
9. `sys_doc_set_property` - Set property

**Reference:** `03-Technical-Architecture.md` - Agent Tools section

**Phase 0 Validation:** ✅ All 9 tool patterns validated conceptually

---

## Phase 0 Findings Summary

### ✅ All Core Assumptions Validated

| Assumption | Status | Evidence |
|------------|--------|----------|
| Lexical editor creation works | ✅ Pass | `test-lexical-markdown.ts` - All tests passing |
| Markdown serialization works | ✅ Pass | Round-trip preserves structure perfectly |
| Block manipulation works | ✅ Pass | Insert/delete/replace all functional |
| Frontmatter parsing works | ✅ Pass | Perfect round-trip with gray-matter |
| Agent tool patterns work | ✅ Pass | All 9 tools validated conceptually |

**Test Results:** All 17 acceptance criteria passing ✅

**Build Status:** ✅ Compiling successfully, no TypeScript errors

### 🔍 Critical Patterns Discovered

1. **Markdown Parsing:** Must call `root.clear()` before `$convertFromMarkdownString()`
2. **Serialization:** Must use `editor.update()`, NOT `read()`
3. **Block Manipulation:** Must cast to `ElementNode` for `clear()`/`append()`/`splice()`
4. **Splice API:** Must use array syntax: `splice(pos, 0, [block])` or `splice(pos, 1, [])`

### 📦 Correct Package List

**Lexical Packages (CORRECTED):**
- ✅ `lexical` - Core framework
- ✅ `@lexical/react` - React integration
- ✅ `@lexical/markdown` - Markdown serialization
- ✅ `@lexical/rich-text` - Text formatting, headings, quotes (HeadingNode, QuoteNode come from here)
- ✅ `@lexical/list` - Lists
- ✅ `@lexical/table` - Tables
- ✅ `@lexical/code` - Code blocks
- ✅ `@lexical/link` - Links
- ✅ `@lexical/history` - Undo/redo
- ✅ `@lexical/dragon` - Drag & drop
- ❌ `@lexical/heading` - Does NOT exist (use `@lexical/rich-text`)
- ❌ `@lexical/quote` - Does NOT exist (use `@lexical/rich-text`)

**Reference:** `02-Research-Log-Phase0.md` Part 1

### 📚 Documentation Updates

All phase documents updated to reflect Phase 0 findings:
- ✅ `03-Technical-Architecture.md` - Package list corrected, Section 8 added
- ✅ `05-Phase1-CoreDocumentCRUD.md` - Markdown parsing patterns updated
- ✅ `06-Phase2-BasicEditorUI.md` - Node imports corrected
- ✅ `07-Phase3-BlockFeatures.md` - Type casting patterns added
- ✅ `09-Phase5-ChatAndAgentIntegration.md` - Agent tool patterns detailed
- ✅ `01-ONBOARDING.md` - This document, updated with all findings

**Reference:** `PHASE0-UPDATES-SUMMARY.md`

---

## Getting Started Checklist

### 1. Read Core Documents (in order)

- [ ] `00-Product-Spec.md` - Understand what we're building
- [ ] `03-Technical-Architecture.md` - Understand how it's built
- [ ] `04-Implementation-Plan.md` - Understand the plan
- [ ] **`02-Research-Log-Phase0.md`** ⭐ **CRITICAL** - Read all Phase 0 findings
- [ ] **`PRE-FLIGHT-CHECK.md`** - Read readiness assessment
- [ ] `FILE-IMPACT-ANALYSIS.md` - Understand file organization

### 2. Review UXD Mockups

- [ ] Open `_docs/UXD/Pages/records/2025-12-10-docs-v1/` in browser
- [ ] Review all HTML mockups
- [ ] Read `README.md` and `Frontend-Backend-Mapping.md`

### 3. Review Phase Documents

- [ ] `00-Phase0-Technical-Spike.md` - ✅ Complete (read for context)
- [ ] `05-Phase1-CoreDocumentCRUD.md` - 🎯 **CURRENT FOCUS**
- [ ] Skim remaining phases (06-12) for context

### 4. Review Reference Patterns

- [ ] `_docs/Engineering/Architecture/Store-Slice-Architecture.md`
- [ ] `app/api/DOMAIN_PRINCIPLES.md`
- [ ] `app/(pages)/records/store/` - Store pattern
- [ ] `app/api/records/` - API pattern
- [ ] `app/(pages)/records/components/ChatSidebar/` - Chat pattern

### 5. Set Up Development Environment

- [ ] Clone repository
- [ ] Install dependencies (`npm install`)
- [ ] Review existing codebase structure
- [ ] Run development server (`npm run dev`)
- [ ] **Verify build passes:** `npm run build` (should compile successfully)

### 6. Start Contributing

- [ ] **Start with Phase 1** (Phase 0 is complete)
- [ ] Read `05-Phase1-CoreDocumentCRUD.md` thoroughly
- [ ] Review acceptance criteria
- [ ] **Follow critical patterns from Phase 0** (see above)
- [ ] Implement following patterns
- [ ] Test against acceptance criteria
- [ ] Update documentation if needed

---

## Questions & Support

### Common Questions

**Q: Should I create hooks or use store slices?**
A: Both. TanStack Query hooks for data fetching (`useDocument`, `useDocuments`), Zustand slices for UI state (`editorSlice`, `documentSlice`).

**Q: Where do I put business logic?**
A: Services (`app/api/dox/services/`). Routes call services, store actions call routes.

**Q: How do I add a new block type?**
A: See Phase 3 document. Add Lexical node, add to slash menu, add to Markdown parser.

**Q: How do I test agent tools?**
A: See Phase 0 spike document. Use test endpoint to validate patterns.

**Q: Can I modify existing documentation?**
A: Yes. Update as you learn. Document assumptions that change.

**Q: Why do I need to cast to ElementNode?**
A: Lexical's type system requires explicit casting for block manipulation operations. See `02-Research-Log-Phase0.md` Part 4.

**Q: Why does my Markdown serialization return empty?**
A: You must use `editor.update()` for serialization, NOT `editor.getEditorState().read()`. See Phase 0 findings.

**Q: Why does content append instead of replace when parsing Markdown?**
A: You must call `root.clear()` before `$convertFromMarkdownString()`. See Phase 0 findings.

### Getting Help

- Review phase documents for detailed pseudocode
- Check reference patterns in Records/Workforce features
- Review Research Log (`02-Research-Log-Phase0.md`) for implementation notes
- Check `03-Technical-Architecture.md` Section 8 for helper functions
- Ask questions in team chat

---

## Success Metrics

### Phase Completion

Each phase is complete when:
- All acceptance criteria pass
- All files created/modified as specified
- Code follows established patterns
- Documentation updated if assumptions changed

### Feature Completion

The feature is complete when:
- All 8 phases complete (Phase 0 is spike, not counted)
- All acceptance criteria from Product Spec pass
- Performance acceptable (10k+ word documents)
- Accessibility compliant (WCAG 2.1 AA)
- Error handling comprehensive
- User flows work end-to-end

---

## Final Notes

- Follow established patterns (Records, Workforce, Browser Automation)
- **Follow critical patterns from Phase 0** (Markdown parsing, block manipulation)
- **Create helper functions early** to reduce boilerplate
- Update documentation as you learn
- Test thoroughly before marking phases complete
- Ask questions early
- Focus on one phase at a time
- **Don't forget `root.clear()` before parsing Markdown!**
- **Use `editor.update()` for serialization!**

Welcome to the team. Let's build something great.

---

**Last Updated:** 2025-12-10  
**Documentation Location:** `_docs/_tasks/22a-docs-feature/`  
**UXD Location:** `_docs/UXD/Pages/records/2025-12-10-docs-v1/`  
**Phase 0 Status:** ✅ Complete  
**Current Phase:** Phase 1 - Core Document CRUD

---

Both documents are ready. The File Impact Analysis shows how each architectural layer contributes to the goal, and the Onboarding document incorporates all Phase 0 findings and critical patterns. Save them where needed.