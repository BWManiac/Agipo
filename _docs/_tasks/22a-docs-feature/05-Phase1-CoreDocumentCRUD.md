# Phase 1: Core Document CRUD

**Status:** 📋 Planned  
**Depends On:** Phase 0 (Technical Spike)  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Build the foundational backend and frontend infrastructure for document management. After this phase, users can:
- View a catalog of all documents
- Create new documents
- Open and view existing documents
- Update document content and properties
- Delete documents

This phase establishes the data layer (API routes, services, storage) and basic UI (catalog page, document page skeleton) that all subsequent phases build upon.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|------------|
| API Structure | Separate `/list` and `/create` routes | Matches Records pattern for clarity |
| Storage Format | Markdown with YAML frontmatter | Portable, Git-friendly, human-readable |
| Document Registry | `_tables/dox/index.ts` | Centralized document listing |
| Data Fetching | TanStack Query hooks | Consistent with Records pattern |
| State Management | Zustand `documentSlice` | UI state separate from data fetching |

### Pertinent Research

- **RQ-1**: Lexical blocks ↔ Markdown conversion works (validated in Phase 0)
- **RQ-4**: YAML frontmatter parsing works (validated in Phase 0)
- **Storage Pattern**: Following Records pattern (`_tables/records/[tableId]/`)

*Source: `00-Phase0-Technical-Spike.md`, `03-Technical-Architecture.md`*

### Overall File Impact

#### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/dox/README.md` | Create | Domain overview and API documentation | A |
| `app/api/dox/list/route.ts` | Create | GET list all documents | A |
| `app/api/dox/create/route.ts` | Create | POST create new document | A |
| `app/api/dox/[docId]/route.ts` | Create | GET read, PATCH update, DELETE document | A |

#### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/dox/services/README.md` | Create | Service documentation | A |
| `app/api/dox/services/document-storage.ts` | Create | File system operations (read/write Markdown) | A |
| `app/api/dox/services/markdown-parser.ts` | Create | Lexical ↔ Markdown conversion | A |
| `app/api/dox/services/frontmatter.ts` | Create | YAML frontmatter parsing/serialization | A |

#### Backend / Storage

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `_tables/dox/index.ts` | Create | Document registry (list all docIds) | A |
| `_tables/dox/[docId]/content.md` | Create | Sample document for testing | A |

#### Frontend / Page

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/dox/page.tsx` | Create | Document catalog page | B |
| `app/(pages)/dox/[docId]/page.tsx` | Create | Document editor page (skeleton) | B |

#### Frontend / Hooks

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/dox/hooks/useDocuments.ts` | Create | TanStack Query hooks for catalog | B |
| `app/(pages)/dox/[docId]/hooks/useDocument.ts` | Create | TanStack Query hooks for document CRUD | B |

#### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/dox/[docId]/store/index.ts` | Create | Store composition | B |
| `app/(pages)/dox/[docId]/store/types.ts` | Create | Combined store type | B |
| `app/(pages)/dox/[docId]/store/slices/documentSlice.ts` | Create | Document data state and actions | B |

#### Config

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `package.json` | Modify | Add Lexical, remark, gray-matter, js-yaml dependencies | A |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-1.1 | `GET /api/dox/list` returns document catalog | Call API, verify JSON response | A |
| AC-1.2 | `POST /api/dox/create` creates new document | Create document, verify file exists | A |
| AC-1.3 | `GET /api/dox/[docId]` returns document with content | Fetch document, verify Markdown content | A |
| AC-1.4 | `PATCH /api/dox/[docId]` updates document | Update content, verify file updated | A |
| AC-1.5 | `DELETE /api/dox/[docId]` deletes document | Delete document, verify file removed | A |
| AC-1.6 | Documents stored as Markdown with frontmatter | Check file contents, verify format | A |
| AC-1.7 | Catalog page displays all documents | Open `/dox`, verify document cards | B |
| AC-1.8 | Create document dialog works | Click "New Document", create, verify redirect | B |
| AC-1.9 | Document page loads document content | Open document, verify content displayed | B |
| AC-1.10 | Document registry tracks all documents | Check `_tables/dox/index.ts`, verify docIds | A |

### User Flows (Phase Level)

#### Flow 1: Create and View Document

```
1. User navigates to /dox (catalog page)
2. User clicks "New Document" button
3. User enters document title in dialog
4. User clicks "Create"
5. System creates document in _tables/dox/[docId]/
6. System redirects to /dox/[docId]
7. User sees document page with title and empty content
```

#### Flow 2: Browse Document Catalog

```
1. User navigates to /dox
2. System fetches document list from /api/dox/list
3. User sees grid of document cards
4. Each card shows: title, excerpt, last modified date
5. User clicks a document card
6. System navigates to /dox/[docId]
7. User sees document content
```

---

## Part A: Backend Infrastructure

### Goal

Build the complete backend API for document CRUD operations, including file storage, Markdown parsing, and frontmatter handling.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/dox/README.md` | Create | Domain overview | ~100 |
| `app/api/dox/list/route.ts` | Create | GET list documents | ~80 |
| `app/api/dox/create/route.ts` | Create | POST create document | ~100 |
| `app/api/dox/[docId]/route.ts` | Create | GET/PATCH/DELETE document | ~150 |
| `app/api/dox/services/document-storage.ts` | Create | File I/O operations | ~150 |
| `app/api/dox/services/markdown-parser.ts` | Create | Lexical ↔ Markdown | ~200 |
| `app/api/dox/services/frontmatter.ts` | Create | YAML frontmatter | ~100 |
| `_tables/dox/index.ts` | Create | Document registry | ~80 |
| `_tables/dox/[docId]/content.md` | Create | Sample document | ~20 |

### Pseudocode

#### `app/api/dox/list/route.ts`

```
GET /api/dox/list
├── Authenticate user (Clerk)
├── Read _tables/dox/index.ts
│   ├── Parse document registry
│   └── Get list of docIds
├── For each docId:
│   ├── Read _tables/dox/[docId]/content.md
│   ├── Parse frontmatter (gray-matter)
│   └── Extract: id, title, excerpt, updatedAt
└── Return JSON: { documents: [...] }
```

#### `app/api/dox/create/route.ts`

```
POST /api/dox/create
├── Authenticate user (Clerk)
├── Parse request body: { title?, content?, properties? }
├── Generate docId (nanoid)
├── Create document structure:
│   ├── Frontmatter: { title, created, updated, ...properties }
│   └── Content: content || ""
├── Write _tables/dox/[docId]/content.md
├── Update _tables/dox/index.ts (add docId)
└── Return JSON: { id, title, content, properties, createdAt, updatedAt }
```

#### `app/api/dox/[docId]/route.ts`

```
GET /api/dox/[docId]
├── Authenticate user (Clerk)
├── Read _tables/dox/[docId]/content.md
├── Parse frontmatter and content (gray-matter)
├── Convert Markdown to Lexical JSON (markdown-parser)
├── Extract outline (remark)
└── Return JSON: { id, title, content, properties, outline, ... }

PATCH /api/dox/[docId]
├── Authenticate user (Clerk)
├── Parse request body: { title?, content?, properties? }
├── Read existing document
├── Merge updates (preserve unchanged fields)
├── Update frontmatter
├── Write _tables/dox/[docId]/content.md
└── Return JSON: { id, updatedAt, ... }

DELETE /api/dox/[docId]
├── Authenticate user (Clerk)
├── Delete _tables/dox/[docId]/ directory
├── Update _tables/dox/index.ts (remove docId)
└── Return JSON: { success: true }
```

#### `app/api/dox/services/document-storage.ts`

```
readDocument(docId: string): Promise<Document>
├── Read _tables/dox/[docId]/content.md
├── Parse with gray-matter
│   ├── Extract frontmatter (YAML)
│   └── Extract content (Markdown)
└── Return: { id, title, content, properties, ... }

writeDocument(docId: string, data: DocumentData): Promise<void>
├── Serialize frontmatter (js-yaml)
├── Combine: frontmatter + content
├── Write _tables/dox/[docId]/content.md
└── Update _tables/dox/index.ts

deleteDocument(docId: string): Promise<void>
├── Delete _tables/dox/[docId]/ directory
└── Update _tables/dox/index.ts (remove docId)

listDocuments(): Promise<string[]>
├── Read _tables/dox/index.ts
└── Return array of docIds
```

#### `app/api/dox/services/markdown-parser.ts`

```
markdownToLexical(markdown: string): LexicalEditorState
├── Create Lexical editor instance
├── editor.update(() => {
│   ├── const root = $getRoot()
│   ├── root.clear()  // IMPORTANT: Clear before parsing
│   ├── $convertFromMarkdownString(markdown, TRANSFORMERS)
│   └── })
├── Get editor state: editor.getEditorState()
└── Return Lexical editor state JSON

lexicalToMarkdown(editorState: LexicalEditorState): string
├── Create Lexical editor instance with editorState
├── editor.update(() => {
│   ├── const markdown = $convertToMarkdownString(TRANSFORMERS)
│   └── return markdown
│   └── })  // Must use editor.update(), NOT editor.getEditorState().read()
└── Return Markdown string
```

**Note:** Based on Phase 0 findings:
- Must use `root.clear()` before `$convertFromMarkdownString()` or content appends
- Must use `editor.update()` for serialization, NOT `editor.getEditorState().read()`
- See `02-Research-Log-Phase0.md` for details

#### `app/api/dox/services/frontmatter.ts`

```
parseFrontmatter(markdown: string): { frontmatter: object, content: string }
├── Use gray-matter to parse
├── Parse YAML with js-yaml
└── Return: { frontmatter, content }

serializeFrontmatter(frontmatter: object, content: string): string
├── Serialize YAML with js-yaml
├── Combine: ---\n${yaml}\n---\n${content}
└── Return Markdown string with frontmatter
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-1.1 | `GET /api/dox/list` returns document catalog | Call API, verify JSON response with document array |
| AC-1.2 | `POST /api/dox/create` creates new document | Create document, verify file exists in `_tables/dox/[docId]/` |
| AC-1.3 | `GET /api/dox/[docId]` returns document with content | Fetch document, verify Markdown content in response |
| AC-1.4 | `PATCH /api/dox/[docId]` updates document | Update content, verify file updated |
| AC-1.5 | `DELETE /api/dox/[docId]` deletes document | Delete document, verify file removed |
| AC-1.6 | Documents stored as Markdown with frontmatter | Check file contents, verify YAML frontmatter format |
| AC-1.10 | Document registry tracks all documents | Check `_tables/dox/index.ts`, verify docIds listed |

### User Flows

#### Flow A.1: Create Document via API

```
1. POST /api/dox/create with { title: "Test Doc" }
2. System generates docId
3. System creates _tables/dox/[docId]/content.md
4. System updates _tables/dox/index.ts
5. Response: { id, title, createdAt, updatedAt }
```

#### Flow A.2: List Documents via API

```
1. GET /api/dox/list
2. System reads _tables/dox/index.ts
3. System reads each document's frontmatter
4. Response: { documents: [{ id, title, excerpt, updatedAt }, ...] }
```

---

## Part B: Frontend Catalog and Document Pages

### Goal

Build the catalog page (document list) and basic document page skeleton. Users can browse documents, create new ones, and view document content.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/dox/page.tsx` | Create | Document catalog page | ~150 |
| `app/(pages)/dox/[docId]/page.tsx` | Create | Document editor page (skeleton) | ~100 |
| `app/(pages)/dox/hooks/useDocuments.ts` | Create | TanStack Query hooks for catalog | ~80 |
| `app/(pages)/dox/[docId]/hooks/useDocument.ts` | Create | TanStack Query hooks for document | ~100 |
| `app/(pages)/dox/[docId]/store/index.ts` | Create | Store composition | ~40 |
| `app/(pages)/dox/[docId]/store/types.ts` | Create | Combined store type | ~60 |
| `app/(pages)/dox/[docId]/store/slices/documentSlice.ts` | Create | Document state slice | ~150 |

### Pseudocode

#### `app/(pages)/dox/page.tsx`

```
DoxCatalogPage
├── Render: Layout
│   ├── Header: "Documents" title + "New Document" button
│   ├── Content: Document grid
│   │   ├── Loading: Skeleton cards
│   │   └── Loaded: Document cards
│   └── Empty: "Create your first document" message
├── Data: useDocuments() hook
│   ├── Fetch: GET /api/dox/list
│   └── State: { documents, isLoading }
└── Events:
    ├── Click "New Document" → Open dialog
    └── Click document card → Navigate to /dox/[docId]
```

#### `app/(pages)/dox/[docId]/page.tsx`

```
DocumentPage
├── Render: Layout
│   ├── Header: Document title + actions
│   ├── Content: Document content area (skeleton)
│   └── Footer: Save status
├── Data: useDocument(docId) hook
│   ├── Fetch: GET /api/dox/[docId]
│   └── State: { document, isLoading }
├── Store: useDocsStore()
│   ├── documentSlice.docId
│   ├── documentSlice.title
│   └── documentSlice.content
└── Events:
    └── Load document → Update store
```

#### `app/(pages)/dox/hooks/useDocuments.ts`

```
useDocuments()
├── useQuery({
│     queryKey: ["documents"],
│     queryFn: () => fetch("/api/dox/list").then(r => r.json())
│   })
└── Return: { data, isLoading, error }

useCreateDocument()
├── useMutation({
│     mutationFn: (data) => 
│       fetch("/api/dox/create", { method: "POST", body: JSON.stringify(data) })
│         .then(r => r.json()),
│     onSuccess: () => queryClient.invalidateQueries(["documents"])
│   })
└── Return: { mutate, mutateAsync, isPending }
```

#### `app/(pages)/dox/[docId]/hooks/useDocument.ts`

```
useDocument(docId: string)
├── useQuery({
│     queryKey: ["document", docId],
│     queryFn: () => fetch(`/api/dox/${docId}`).then(r => r.json())
│   })
└── Return: { data, isLoading, error }

useUpdateDocument(docId: string)
├── useMutation({
│     mutationFn: (updates) =>
│       fetch(`/api/dox/${docId}`, { 
│         method: "PATCH", 
│         body: JSON.stringify(updates) 
│       }).then(r => r.json()),
│     onSuccess: () => queryClient.invalidateQueries(["document", docId])
│   })
└── Return: { mutate, mutateAsync, isPending }
```

#### `app/(pages)/dox/[docId]/store/slices/documentSlice.ts`

```
documentSlice
├── State:
│   ├── docId: string | null
│   ├── title: string
│   ├── content: string (Markdown)
│   ├── properties: Record<string, unknown>
│   └── isLoading: boolean
├── Actions:
│   ├── setDocument(docId, title, content, properties)
│   ├── updateTitle(title)
│   ├── updateContent(content)
│   ├── updateProperties(properties)
│   └── clearDocument()
└── Implementation:
    ├── setDocument: Update all state
    ├── updateTitle: Update title only
    ├── updateContent: Update content, mark dirty
    └── clearDocument: Reset to initial state
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-1.7 | Catalog page displays all documents | Open `/dox`, verify document cards render |
| AC-1.8 | Create document dialog works | Click "New Document", create, verify redirect |
| AC-1.9 | Document page loads document content | Open document, verify content displayed |

### User Flows

#### Flow B.1: Create Document from Catalog

```
1. User opens /dox
2. User clicks "New Document" button
3. Dialog opens with title input
4. User enters "My First Document"
5. User clicks "Create"
6. System calls POST /api/dox/create
7. System redirects to /dox/[docId]
8. User sees document page with title
```

#### Flow B.2: View Document from Catalog

```
1. User opens /dox
2. User sees list of document cards
3. User clicks a document card
4. System navigates to /dox/[docId]
5. System calls GET /api/dox/[docId]
6. Document content loads and displays
```

---

## Out of Scope

What is explicitly NOT included in this phase:

- **Editor UI** → Phase 2 (Basic Editor UI)
- **Block features** → Phase 3 (Block Features)
- **Outline sidebar** → Phase 4 (Outline & Properties)
- **Chat sidebar** → Phase 5 (Chat & Agent Integration)
- **Version history** → Phase 6 (Version History)
- **Settings panel** → Phase 7 (Settings & Access)

---

## References

- **Research**: `00-Phase0-Technical-Spike.md` - Validated Lexical/Markdown conversion
- **Architecture**: `03-Technical-Architecture.md` - File structure and patterns
- **Implementation**: `04-Implementation-Plan.md` - Detailed file impact
- **Pattern Source**: `app/(pages)/records/page.tsx` - Catalog page pattern
- **Pattern Source**: `app/api/records/list/route.ts` - List route pattern
- **Pattern Source**: `app/api/records/create/route.ts` - Create route pattern

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | AI Assistant |

---

**Last Updated:** 2025-12-10
