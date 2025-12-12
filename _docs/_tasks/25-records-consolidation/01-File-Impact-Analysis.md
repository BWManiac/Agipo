# Task 25: File Impact Analysis

**Status:** Planning
**Last Updated:** December 12, 2025

---

## Guiding Principles

This analysis follows the established architecture principles:

| Principle Document | Key Application |
|--------------------|-----------------|
| [API Domain Principles](../../../app/api/DOMAIN_PRINCIPLES.md) | Routes nested by ownership |
| [Store Slice Principles](../../../app/STORE_SLICE_PRINCIPLES.md) | Commented 4-part slice structure |
| [Component Principles](../../../app/COMPONENT_PRINCIPLES.md) | shadcn/ui first; state in stores |
| [Route README Template](../../../app/api/ROUTE_README_TEMPLATE.md) | Co-located README per route |
| [Service README Template](../../../app/api/SERVICE_README_TEMPLATE.md) | Co-located README per service |

### Key Architecture Decisions

1. **API Consolidation** — `/api/docs` moves to `/api/records/documents`
2. **Storage Consolidation** — Both tables and docs under `_tables/records/_root/`
3. **Services co-located with consumers** — Document services move under records domain
4. **Documentation co-located** — Every route and service gets a README file

---

## Overview

Complete file impact analysis for the Records Consolidation task. This document catalogs all files that will be created, modified, or deleted across both phases.

---

## Summary Statistics

| Category | Create | Modify | Delete | Total |
|----------|--------|--------|--------|-------|
| Types | 1 | 1 | 0 | 2 |
| Backend / API Routes | 8 | 2 | 0 | 10 |
| Backend / API READMEs | 8 | 0 | 0 | 8 |
| Backend / Services | 3 | 2 | 0 | 5 |
| Backend / Service READMEs | 3 | 0 | 0 | 3 |
| Backend / API (Move) | 4 | 0 | 0 | 4 |
| Frontend / State | 1 | 1 | 0 | 2 |
| Frontend / Components | 7 | 0 | 0 | 7 |
| Frontend / Pages | 1 | 2 | 0 | 3 |
| **Total** | **36** | **8** | **0** | **44** |

---

## File Impact by Phase

### Phase 1: Backend Infrastructure

#### Types

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/types.ts` | Create | Folder and item type definitions (FolderMetadata, ItemType, FolderContents) |
| `app/api/records/types.ts` | Modify | Add document types (unified with docs) |

#### API Consolidation (Move /api/docs → /api/records/documents)

| From | To | Action |
|------|-----|--------|
| `app/api/docs/route.ts` | `app/api/records/documents/route.ts` | Move + adapt |
| `app/api/docs/[docId]/route.ts` | `app/api/records/documents/[docId]/route.ts` | Move + adapt |
| `app/api/docs/services/document-io.ts` | `app/api/records/services/document-io.ts` | Move |
| `app/api/docs/services/versions.ts` | `app/api/records/services/versions.ts` | Move |
| `app/api/docs/services/frontmatter.ts` | `app/api/records/services/frontmatter.ts` | Move |
| `app/api/docs/services/types.ts` | Merge into `app/api/records/types.ts` | Merge |

#### Backend / API Routes (New)

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/folders/route.ts` | Create | GET list folders, POST create folder |
| `app/api/records/folders/[folderId]/route.ts` | Create | GET folder, PATCH update, DELETE folder |
| `app/api/records/folders/[folderId]/items/route.ts` | Create | GET items in folder |
| `app/api/records/items/[itemId]/move/route.ts` | Create | PATCH move item to folder |
| `app/api/records/search/route.ts` | Create | GET search across folders |
| `app/api/records/documents/route.ts` | Create | GET list documents, POST create document (moved from /api/docs) |
| `app/api/records/documents/[docId]/route.ts` | Create | GET/PUT/DELETE document (moved from /api/docs) |

#### Backend / API Routes (Modified)

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/list/route.ts` | Modify | Support folderId parameter, include documents |
| `app/api/records/create/route.ts` | Modify | Create table in specific folder |

#### Backend / API READMEs

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/folders/README.md` | Create | Route documentation |
| `app/api/records/folders/[folderId]/README.md` | Create | Route documentation |
| `app/api/records/folders/[folderId]/items/README.md` | Create | Route documentation |
| `app/api/records/items/[itemId]/move/README.md` | Create | Route documentation |
| `app/api/records/search/README.md` | Create | Route documentation |
| `app/api/records/documents/README.md` | Create | Route documentation |
| `app/api/records/documents/[docId]/README.md` | Create | Route documentation |

#### Backend / Services (New)

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/services/folders.ts` | Create | Folder CRUD operations |
| `app/api/records/services/folder-tree.ts` | Create | Build folder hierarchy tree |
| `app/api/records/services/migration.ts` | Create | Migrate existing items to folder structure |

#### Backend / Services (Modified)

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/services/catalog.ts` | Modify | Support folder-based catalog queries, include documents |
| `app/api/records/services/io.ts` | Modify | Support folder paths in file operations |

#### Backend / Service READMEs

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/services/folders.README.md` | Create | Service documentation |
| `app/api/records/services/folder-tree.README.md` | Create | Service documentation |
| `app/api/records/services/migration.README.md` | Create | Service documentation |

---

### Phase 2: Frontend UI

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
└── records/
    └── _root/                          # Root folder (special)
        ├── folder.json                 # Root metadata
        ├── tables/
        │   └── [tableId]/              # Legacy table (migrated)
        │       ├── schema.json
        │       ├── records.json
        │       └── access.json
        ├── documents/
        │   └── [docId]/                # Legacy doc (migrated)
        │       ├── content.md
        │       └── _versions/
        └── [folderId]/                 # User-created folder
            ├── folder.json
            ├── tables/
            │   └── [tableId]/          # Table in folder
            └── documents/
                └── [docId]/            # Doc in folder
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
| GET/POST | `/api/records/documents` | List/create documents | 1 |
| GET/PUT/DELETE | `/api/records/documents/[docId]` | Document CRUD | 1 |

### Modified Routes

| Method | Route | Change | Phase |
|--------|-------|--------|-------|
| GET | `/api/records/list` | Support folderId parameter, include docs | 1 |
| POST | `/api/records/create` | Support folderId parameter | 1 |

### Deprecated Routes (Redirect)

| Old Route | New Route | Phase |
|-----------|-----------|-------|
| `/api/docs` | `/api/records/documents` | 1 |
| `/api/docs/[docId]` | `/api/records/documents/[docId]` | 1 |

---

## Migration Plan

### Automatic Migration Steps

1. **Detect migration needed:** Check if `_root/` folder exists
2. **Create root folder:** `mkdir _tables/records/_root`
3. **Move tables:** For each `_tables/records/[tableId]/`, move to `_root/tables/[tableId]/`
4. **Move documents:** For each `_tables/documents/[docId]/`, move to `_root/documents/[docId]/`
5. **Create root folder.json:** With root metadata

### Backwards Compatibility

- Old API routes `/api/docs/*` redirect to `/api/records/documents/*`
- Direct table access `/records/[tableId]` still works
- Frontend `/docs` page redirects to `/records`
- Existing agent access.json preserved

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration corrupts data | High | Backup before migration, incremental migration |
| Folder depth too deep | Low | Limit to 10 levels initially |
| Docs redirect breaks bookmarks | Low | Preserve `/docs/[docId]` redirects |
| API migration breaks consumers | Medium | Maintain redirects during transition |

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-12 | Split RAG phases into Task 26 | Claude |
| 2025-12-12 | Added API consolidation (/api/docs → /api/records/documents) | Claude |
| 2025-12-12 | Added storage consolidation plan | Claude |
| 2025-12-12 | Initial file impact analysis | Claude |
