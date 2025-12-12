# Task 25: File Impact Analysis

**Status:** Planning
**Last Updated:** December 12, 2025

---

## Overview

Complete file impact analysis for the Records & RAG Integration task. This document catalogs all files that will be created, modified, or deleted across all phases.

---

## Summary Statistics

| Category | Create | Modify | Delete | Total |
|----------|--------|--------|--------|-------|
| Types | 2 | 1 | 0 | 3 |
| Backend / API | 10 | 4 | 0 | 14 |
| Backend / Services | 12 | 4 | 0 | 16 |
| Frontend / State | 2 | 1 | 0 | 3 |
| Frontend / Components | 12 | 3 | 0 | 15 |
| Frontend / Pages | 3 | 2 | 1 | 6 |
| **Total** | **41** | **15** | **1** | **57** |

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

#### Backend / Services

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/services/folders.ts` | Create | Folder CRUD operations |
| `app/api/records/services/folder-tree.ts` | Create | Build folder hierarchy tree |
| `app/api/records/services/migration.ts` | Create | Migrate existing items to folder structure |
| `app/api/records/services/catalog.ts` | Modify | Support folder-based catalog queries |
| `app/api/records/services/io.ts` | Modify | Support folder paths in file operations |

---

### Phase 2: Folder Frontend UI

#### Frontend / State

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/store/slices/folderSlice.ts` | Create | Folder state management (current folder, tree, navigation) |
| `app/(pages)/records/store/index.ts` | Modify | Add folder slice to store |

#### Frontend / Components

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/components/FolderView.tsx` | Create | Main folder contents view (grid + actions) |
| `app/(pages)/records/components/FolderTree.tsx` | Create | Sidebar folder tree component |
| `app/(pages)/records/components/Breadcrumbs.tsx` | Create | Breadcrumb navigation component |
| `app/(pages)/records/components/CreateFolderDialog.tsx` | Create | Create folder dialog |
| `app/(pages)/records/components/ItemCard.tsx` | Create | Unified item card (table or document) |
| `app/(pages)/records/components/MoveItemDialog.tsx` | Create | Move item to folder dialog |
| `app/(pages)/records/components/FolderCard.tsx` | Create | Folder card in grid view |

#### Frontend / Pages

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/page.tsx` | Modify | Use FolderView as main component |
| `app/(pages)/records/folder/[...path]/page.tsx` | Create | Dynamic folder contents page |
| `app/(pages)/docs/page.tsx` | Modify | Redirect to /records (consolidation) |

---

### Phase 3: RAG Indexing Infrastructure

#### Types

| File | Action | Purpose |
|------|--------|---------|
| `app/api/rag/types.ts` | Create | RAG types (Chunk, IndexMetadata, EmbeddingResult) |

#### Backend / API

| File | Action | Purpose |
|------|--------|---------|
| `app/api/rag/index/records/[tableId]/route.ts` | Create | POST trigger table indexing |
| `app/api/rag/index/docs/[docId]/route.ts` | Create | POST trigger document indexing |
| `app/api/rag/index/[indexName]/status/route.ts` | Create | GET index status |
| `app/api/records/[tableId]/access/agents/route.ts` | Modify | Add ragEnabled parameter |

#### Backend / Services

| File | Action | Purpose |
|------|--------|---------|
| `app/api/rag/services/vector-store.ts` | Create | LibSQL vector store wrapper |
| `app/api/rag/services/indexing-service.ts` | Create | Core indexing orchestration |
| `app/api/rag/services/record-indexer.ts` | Create | Index table rows as documents |
| `app/api/rag/services/doc-indexer.ts` | Create | Index markdown documents |

---

### Phase 4: RAG Retrieval & Chat Integration

#### Backend / API

| File | Action | Purpose |
|------|--------|---------|
| `app/api/rag/query/route.ts` | Create | POST query vector store |
| `app/api/workforce/[agentId]/rag/sources/route.ts` | Create | GET agent's RAG sources |

#### Backend / Services

| File | Action | Purpose |
|------|--------|---------|
| `app/api/rag/services/retrieval-service.ts` | Create | Query vector store, retrieve chunks |
| `app/api/workforce/[agentId]/chat/services/rag-context-service.ts` | Create | Load agent sources, retrieve context |
| `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Modify | Inject RAG context into chat |

---

### Phase 5: Agent Assignment UI

#### Frontend / State

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/workforce/components/agent-modal/store/slices/ragSlice.ts` | Create | RAG status state management |

#### Frontend / Components

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab.tsx` | Modify | Make functional with real data |
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab/AssignTableDialog.tsx` | Create | Table/doc selection with RAG toggle |
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab/RAGStatusBadge.tsx` | Create | RAG enabled/indexing/active badge |
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab/IndexingProgress.tsx` | Create | Indexing progress indicator |
| `app/(pages)/workforce/components/agent-modal/components/tabs/RecordsTab/AssignedItemCard.tsx` | Create | Card for assigned table/doc |

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
| POST | `/api/rag/index/records/[tableId]` | Trigger table indexing | 3 |
| POST | `/api/rag/index/docs/[docId]` | Trigger doc indexing | 3 |
| GET | `/api/rag/index/[indexName]/status` | Get index status | 3 |
| POST | `/api/rag/query` | Query vector store | 4 |
| GET | `/api/workforce/[agentId]/rag/sources` | Get agent's RAG sources | 4 |

### Modified Routes

| Method | Route | Change | Phase |
|--------|-------|--------|-------|
| GET | `/api/records/list` | Support folderId parameter | 1 |
| POST | `/api/records/create` | Support folderId parameter | 1 |
| POST | `/api/records/[tableId]/access/agents` | Add ragEnabled parameter | 3 |

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
| 2025-12-12 | Initial file impact analysis | Claude |
