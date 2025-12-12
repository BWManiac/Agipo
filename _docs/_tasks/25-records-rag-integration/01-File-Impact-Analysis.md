# Task 25: File Impact Analysis

**Status:** Planning
**Last Updated:** December 12, 2025

---

## Guiding Principles

This analysis follows the established architecture principles:

| Principle Document | Key Application |
|--------------------|-----------------|
| [API Domain Principles](../../../app/api/DOMAIN_PRINCIPLES.md) | Routes nested by ownership; no separate RAG domain |
| [Store Slice Principles](../../../app/STORE_SLICE_PRINCIPLES.md) | Commented 4-part slice structure |
| [Component Principles](../../../app/COMPONENT_PRINCIPLES.md) | shadcn/ui first; state in stores |
| [Route README Template](../../../app/api/ROUTE_README_TEMPLATE.md) | Co-located README per route |
| [Service README Template](../../../app/api/SERVICE_README_TEMPLATE.md) | Co-located README per service |

### Key Architecture Decisions

1. **No separate `/api/rag/` domain** - RAG belongs to its owning resources (records for indexing, workforce for retrieval)
2. **Services co-located with consumers** - RAG indexing service under records, retrieval service under workforce
3. **Documentation co-located** - Every route and service gets a README file

---

## Overview

Complete file impact analysis for the Records & RAG Integration task. This document catalogs all files that will be created, modified, or deleted across all phases.

---

## Summary Statistics

| Category | Create | Modify | Delete | Total |
|----------|--------|--------|--------|-------|
| Types | 2 | 0 | 0 | 2 |
| Backend / API Routes | 9 | 3 | 0 | 12 |
| Backend / API READMEs | 9 | 0 | 0 | 9 |
| Backend / Services | 8 | 3 | 0 | 11 |
| Backend / Service READMEs | 8 | 0 | 0 | 8 |
| Frontend / State | 2 | 1 | 0 | 3 |
| Frontend / Components | 11 | 1 | 0 | 12 |
| Frontend / Pages | 1 | 2 | 0 | 3 |
| **Total** | **50** | **10** | **0** | **60** |

---

## File Impact by Phase

### Phase 1: Folder Backend Infrastructure

#### Types

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/types.ts` | Create | Folder and item type definitions (FolderMetadata, ItemType, FolderContents) |

#### Backend / API

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/folders/route.ts` | Create | GET list folders, POST create folder |
| `app/api/records/folders/[folderId]/route.ts` | Create | GET folder, PATCH update, DELETE folder |
| `app/api/records/folders/[folderId]/items/route.ts` | Create | GET items in folder |
| `app/api/records/items/[itemId]/move/route.ts` | Create | PATCH move item to folder |
| `app/api/records/search/route.ts` | Create | GET search across folders |
| `app/api/records/list/route.ts` | Modify | Support folder-based listing |
| `app/api/records/create/route.ts` | Modify | Create table in specific folder |

#### Backend / Services (Co-located under records)

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/services/folders.ts` | Create | Folder CRUD operations |
| `app/api/records/services/folder-tree.ts` | Create | Build folder hierarchy tree |
| `app/api/records/services/migration.ts` | Create | Migrate existing items to folder structure |
| `app/api/records/services/catalog.ts` | Modify | Support folder-based catalog queries |
| `app/api/records/services/io.ts` | Modify | Support folder paths in file operations |

#### Backend / Service READMEs

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/services/folders.README.md` | Create | Service documentation |
| `app/api/records/services/folder-tree.README.md` | Create | Service documentation |
| `app/api/records/services/migration.README.md` | Create | Service documentation |

#### Backend / API READMEs

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/folders/README.md` | Create | Route documentation |
| `app/api/records/folders/[folderId]/README.md` | Create | Route documentation |
| `app/api/records/folders/[folderId]/items/README.md` | Create | Route documentation |
| `app/api/records/items/[itemId]/move/README.md` | Create | Route documentation |
| `app/api/records/search/README.md` | Create | Route documentation |

---

### Phase 2: Folder Frontend UI

> **Architecture Note:** Store slices follow [Store Slice Principles](../../../app/STORE_SLICE_PRINCIPLES.md) with 4-part structure: State Interface (JSDoc), Actions Interface (JSDoc), Combined Type, Initial State (comments), Slice Creator.

#### Frontend / State

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/store/slices/folderSlice.ts` | Create | Folder state management (current folder, tree, navigation) |
| `app/(pages)/records/store/index.ts` | Modify | Add folder slice to store |

**folderSlice.ts Structure:**
```typescript
// 1. State Interface - JSDoc on each property
// 2. Actions Interface - JSDoc on each action
// 3. Combined Slice Type
// 4. Initial State - inline comments explaining defaults
// 5. Slice Creator - with console logging prefix [FolderSlice]
```

#### Frontend / Components

> **Architecture Note:** Components follow [Component Principles](../../../app/COMPONENT_PRINCIPLES.md): shadcn/ui first, state in stores not hooks, meaningful granularity.

| File | Action | Purpose | shadcn/ui components used |
|------|--------|---------|---------------------------|
| `app/(pages)/records/components/FolderView.tsx` | Create | Main folder contents view (grid + actions) | Card, Button, DropdownMenu |
| `app/(pages)/records/components/FolderTree.tsx` | Create | Sidebar folder tree component | Collapsible, ScrollArea |
| `app/(pages)/records/components/Breadcrumbs.tsx` | Create | Breadcrumb navigation component | Breadcrumb |
| `app/(pages)/records/components/CreateFolderDialog.tsx` | Create | Create folder dialog | Dialog, Input, Button |
| `app/(pages)/records/components/ItemCard.tsx` | Create | Unified item card (table or document) | Card, Badge, ContextMenu |
| `app/(pages)/records/components/MoveItemDialog.tsx` | Create | Move item to folder dialog | Dialog, Command |
| `app/(pages)/records/components/FolderCard.tsx` | Create | Folder card in grid view | Card, Badge |

#### Frontend / Pages

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/page.tsx` | Modify | Use FolderView as main component |
| `app/(pages)/records/folder/[...path]/page.tsx` | Create | Dynamic folder contents page |
| `app/(pages)/docs/page.tsx` | Modify | Redirect to /records (consolidation) |

---

### Phase 3: RAG Indexing Infrastructure

> **Architecture Note:** RAG indexing is nested under `/records/` following Domain Principle #5 (Nested Resources = Ownership). The index belongs to the record, not a separate RAG domain.

#### Types

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/rag/types.ts` | Create | RAG types (Chunk, IndexMetadata, EmbeddingResult) |

#### Backend / API Routes

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/[tableId]/rag/index/route.ts` | Create | POST trigger table indexing |
| `app/api/records/[tableId]/rag/status/route.ts` | Create | GET index status for table |
| `app/api/records/[tableId]/access/agents/route.ts` | Modify | Add ragEnabled parameter |

#### Backend / API READMEs

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/[tableId]/rag/index/README.md` | Create | Route documentation |
| `app/api/records/[tableId]/rag/status/README.md` | Create | Route documentation |

#### Backend / Services (Co-located under records)

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/services/rag/vector-store.ts` | Create | LibSQL vector store wrapper |
| `app/api/records/services/rag/indexing-service.ts` | Create | Core indexing orchestration |
| `app/api/records/services/rag/record-indexer.ts` | Create | Index table rows as documents |
| `app/api/records/services/rag/doc-indexer.ts` | Create | Index markdown documents |

#### Backend / Service READMEs

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/services/rag/vector-store.README.md` | Create | Service documentation |
| `app/api/records/services/rag/indexing-service.README.md` | Create | Service documentation |
| `app/api/records/services/rag/record-indexer.README.md` | Create | Service documentation |
| `app/api/records/services/rag/doc-indexer.README.md` | Create | Service documentation |

---

### Phase 4: RAG Retrieval & Chat Integration

> **Architecture Note:** RAG retrieval is an agent capability, so it belongs under `/workforce/[agentId]/` following Domain Principle #7 (Domain-Driven Design). RAG query serves the chat feature, so services are co-located there.

#### Backend / API Routes

| File | Action | Purpose |
|------|--------|---------|
| `app/api/workforce/[agentId]/rag/query/route.ts` | Create | POST query agent's RAG sources |
| `app/api/workforce/[agentId]/rag/sources/route.ts` | Create | GET agent's RAG sources |

#### Backend / API READMEs

| File | Action | Purpose |
|------|--------|---------|
| `app/api/workforce/[agentId]/rag/query/README.md` | Create | Route documentation |
| `app/api/workforce/[agentId]/rag/sources/README.md` | Create | Route documentation |

#### Backend / Services (Co-located under workforce/chat)

| File | Action | Purpose |
|------|--------|---------|
| `app/api/workforce/[agentId]/chat/services/rag-context-service.ts` | Create | Load agent sources, retrieve context |
| `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Modify | Inject RAG context into chat |

#### Backend / Service READMEs

| File | Action | Purpose |
|------|--------|---------|
| `app/api/workforce/[agentId]/chat/services/rag-context-service.README.md` | Create | Service documentation |

---

### Phase 5: Agent Assignment UI

> **Architecture Note:** Agent modal components follow [Component Principles](../../../app/COMPONENT_PRINCIPLES.md). RecordsTab is nested under `agent-modal/components/tabs/` following the co-location pattern.

#### Frontend / State

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/workforce/components/agent-modal/store/slices/ragSlice.ts` | Create | RAG status state management |

**ragSlice.ts Structure:**
```typescript
// 1. State Interface - sources, indexingStatus, error
// 2. Actions Interface - fetchSources, toggleRag, getIndexStatus
// 3. Combined Slice Type
// 4. Initial State
// 5. Slice Creator - with [RagSlice] logging prefix
```

#### Frontend / Components

| File | Action | Purpose | shadcn/ui components used |
|------|--------|---------|---------------------------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab.tsx` | Modify | Make functional with real data | Card, Button |
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab/AssignTableDialog.tsx` | Create | Table/doc selection with RAG toggle | Dialog, Switch, Command |
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab/RAGStatusBadge.tsx` | Create | RAG enabled/indexing/active badge | Badge |
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab/IndexingProgress.tsx` | Create | Indexing progress indicator | Progress |
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab/AssignedItemCard.tsx` | Create | Card for assigned table/doc | Card, Badge, Button |

---

## Storage Structure Changes

### Current Structure

```
_tables/
├── records/
│   └── [tableId]/
│       ├── schema.json
│       ├── records.json
│       └── access.json
└── documents/
    └── [docId]/
        ├── content.md
        └── _versions/
```

### New Structure (After Phase 1)

```
_tables/
├── records/
│   └── _root/                          # Root folder (special)
│       ├── folder.json                 # Root metadata
│       ├── [tableId]/                  # Legacy table (migrated)
│       │   ├── schema.json
│       │   ├── records.json
│       │   └── access.json
│       ├── [docId]/                    # Legacy doc (migrated)
│       │   ├── content.md
│       │   └── _versions/
│       └── [folderId]/                 # User-created folder
│           ├── folder.json
│           ├── [tableId]/              # Table in folder
│           └── [docId]/                # Doc in folder
└── vectors/                            # New: Vector stores (Phase 3)
    └── [indexName].db                  # LibSQL vector DB
```

---

## Access Control Extensions

### Current access.json

```json
{
  "agents": [
    {
      "agentId": "pm",
      "permission": "read_write",
      "grantedAt": "2024-12-10T..."
    }
  ]
}
```

### Extended access.json (Phase 3)

```json
{
  "agents": [
    {
      "agentId": "pm",
      "permission": "read_write",
      "grantedAt": "2024-12-10T...",
      "ragEnabled": true,
      "ragIndexedAt": "2024-12-11T...",
      "ragIndexName": "pm-tbl_abc123"
    }
  ]
}
```

---

## API Routes Summary

### New Routes

| Method | Route | Purpose | Phase |
|--------|-------|---------|-------|
| GET | `/api/records/folders` | List folders in parent | 1 |
| POST | `/api/records/folders` | Create folder | 1 |
| GET | `/api/records/folders/[folderId]` | Get folder details | 1 |
| PATCH | `/api/records/folders/[folderId]` | Update folder | 1 |
| DELETE | `/api/records/folders/[folderId]` | Delete folder | 1 |
| GET | `/api/records/folders/[folderId]/items` | List items in folder | 1 |
| PATCH | `/api/records/items/[itemId]/move` | Move item to folder | 1 |
| GET | `/api/records/search` | Search across folders | 1 |
| POST | `/api/records/[tableId]/rag/index` | Trigger table RAG indexing | 3 |
| GET | `/api/records/[tableId]/rag/status` | Get table RAG index status | 3 |
| POST | `/api/workforce/[agentId]/rag/query` | Query agent's RAG sources | 4 |
| GET | `/api/workforce/[agentId]/rag/sources` | Get agent's RAG sources | 4 |

### Modified Routes

| Method | Route | Change | Phase |
|--------|-------|--------|-------|
| GET | `/api/records/list` | Support folderId parameter | 1 |
| POST | `/api/records/create` | Support folderId parameter | 1 |
| POST | `/api/records/[tableId]/access/agents` | Add ragEnabled parameter | 3 |

### Route Nesting Rationale

Following [API Domain Principles](../../../app/api/DOMAIN_PRINCIPLES.md):

| Route Pattern | Rationale |
|---------------|-----------|
| `/records/[tableId]/rag/*` | RAG index belongs to the table (ownership) |
| `/workforce/[agentId]/rag/*` | RAG retrieval is an agent capability |
| `/records/folders/[folderId]/items` | Items belong to folders (containment) |

---

## Dependencies

### New npm Packages (Verify if already installed)

| Package | Purpose | Phase |
|---------|---------|-------|
| `@mastra/core` | RAG primitives (MDocument, chunking) | 3 |
| `@mastra/libsql` | LibSQL vector store | 3 |
| `ai` | Embedding generation (embedMany) | 3 |
| `@ai-sdk/openai` | OpenAI embedding model | 3 |

### Existing Packages to Leverage

| Package | Current Usage | New Usage |
|---------|--------------|-----------|
| `gray-matter` | Parse doc frontmatter | Parse doc for chunking |
| `@tanstack/react-query` | Data fetching | Folder/RAG queries |
| `zustand` | State management | Folder + RAG state |

---

## Migration Plan

### Automatic Migration Steps

1. **Detect migration needed:** Check if `_root/` folder exists
2. **Create root folder:** `mkdir _tables/records/_root`
3. **Move tables:** For each `_tables/records/[tableId]/`, move to `_root/[tableId]/`
4. **Move documents:** For each `_tables/documents/[docId]/`, move to `_root/[docId]/`
5. **Create root folder.json:** With root metadata

### Backwards Compatibility

- Old API routes continue working (internally resolve to root folder)
- Direct table access `/records/[tableId]` still works
- Existing agent access.json preserved

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration corrupts data | High | Backup before migration, incremental migration |
| Vector store grows large | Medium | Per-agent indexes, cleanup unused indexes |
| RAG retrieval slow | Medium | Limit topK, cache embeddings, async retrieval |
| Folder depth too deep | Low | Limit to 10 levels initially |
| Docs redirect breaks bookmarks | Low | Preserve `/docs/[docId]` redirects |

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-12 | Restructured API routes to follow Domain Principles (no separate RAG domain) | Claude |
| 2025-12-12 | Added documentation requirements (READMEs for routes/services) | Claude |
| 2025-12-12 | Added architecture notes linking to principle documents | Claude |
| 2025-12-12 | Initial file impact analysis | Claude |
