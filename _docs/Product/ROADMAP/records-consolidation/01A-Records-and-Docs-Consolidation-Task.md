# Task: Records and Docs Consolidation

**Status:** Not Started  
**Roadmap:** `_docs/Product/ROADMAP/records-consolidation/01-Records-and-Docs-Consolidation.md`  
**Assigned:** TBD  
**Started:** YYYY-MM-DD  
**Completed:** YYYY-MM-DD

---

## Validation

### Approach Validation
✅ **Folder-based architecture aligns with file system** - Natural mapping to OS directories
✅ **Single /records route simplifies navigation** - Consolidates data management
✅ **Google Drive-like UX is familiar** - Proven pattern users understand
✅ **Git-friendly storage structure** - Version control compatible

### Current State Analysis
- Records exist at `_tables/records/[tableId]/` (flat)
- Documents exist at `_tables/documents/[docId]/` (flat)
- No folder structure or hierarchy
- Separate /records and /docs routes
- No unified data management interface

## Deterministic Decisions

### Storage Decisions
- **Folder Structure**: `_tables/records/[folderId]/[itemId]/`
- **Root Folder**: Special `_root/` folder for top-level
- **Folder Metadata**: `folder.json` in each folder directory
- **Item Types**: "table" and "document" (unified enum)

### Migration Decisions
- **Automatic Migration**: On first load after deployment
- **Migration Path**: Move all existing to `_root/`
- **Preserve IDs**: Keep existing table/doc IDs unchanged
- **No Breaking Changes**: Old API routes work temporarily

---

## Overview

### Goal

Consolidate Records (structured data tables) and Docs (rich text documents) into a unified, folder-based interface under `/records`. Transform the records page into a Google Drive-like experience where users can create folders, organize tables and documents hierarchically, and manage all their data and content in one place.

This is a significant refactoring that involves:
1. Adding folder structure to storage
2. Migrating existing items to folder system
3. Updating catalog API to support folders
4. Building folder management UI
5. Integrating docs feature into records
6. Updating routing and navigation

### Relevant Research

**Current Records Structure:**
- Storage: `_tables/records/[tableId]/` (flat structure)
- Each table: `schema.json` + `records.json`
- Catalog: `app/api/records/services/catalog.ts` scans directories
- Frontend: `app/(pages)/records/page.tsx` shows card grid

**Current Docs Structure:**
- Storage: `_tables/documents/[docId]/` (flat structure)
- Each doc: `content.md` (Markdown + YAML frontmatter)
- Catalog: `app/api/docs/services/document-io.ts` scans directories
- Frontend: `app/(pages)/docs/page.tsx` shows card grid

**Patterns to Reuse:**
- Records catalog scanning pattern (can extend for folders)
- Docs frontmatter pattern (can use for folder metadata)
- Card grid UI from both features
- File-based storage approach (Git-friendly)

**Key Technical Decisions:**
- Folders stored as directories: `_tables/records/[folderId]/`
- Folder metadata: `folder.json` in each folder
- Items stored in folders: `_tables/records/[folderId]/[itemId]/`
- Root folder: Special `_root/` folder for top-level items
- Item types: `table` and `document` (unified type system)

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/records/types.ts` | Create | Folder and item type definitions | A |
| `app/(pages)/records/types.ts` | Create | Frontend folder/item types | B |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/records/folders/route.ts` | Create | List/create folders | A |
| `app/api/records/folders/[folderId]/route.ts` | Create | Update/delete folder | A |
| `app/api/records/folders/[folderId]/items/route.ts` | Create | List items in folder | A |
| `app/api/records/items/[itemId]/move/route.ts` | Create | Move item to folder | A |
| `app/api/records/search/route.ts` | Create | Search across folders/items | A |
| `app/api/records/list/route.ts` | Modify | Support folder-based listing | A |
| `app/api/records/create/route.ts` | Modify | Create table in folder | A |
| `app/api/docs/route.ts` | Modify | Redirect or integrate with records | A |
| `app/api/docs/[docId]/route.ts` | Modify | Support folder-based docs | A |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/records/services/folders.ts` | Create | Folder CRUD operations | A |
| `app/api/records/services/folder-tree.ts` | Create | Build folder hierarchy tree | A |
| `app/api/records/services/migration.ts` | Create | Migrate existing items to folders | A |
| `app/api/records/services/catalog.ts` | Modify | Support folder-based catalog | A |
| `app/api/records/services/io.ts` | Modify | Support folder paths | A |
| `app/api/docs/services/document-io.ts` | Modify | Support folder-based docs | A |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/records/store/slices/folderSlice.ts` | Create | Folder state management | B |
| `app/(pages)/records/store/index.ts` | Modify | Add folder slice | B |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/records/components/FolderView.tsx` | Create | Main folder contents view | B |
| `app/(pages)/records/components/FolderTree.tsx` | Create | Sidebar folder tree | B |
| `app/(pages)/records/components/Breadcrumbs.tsx` | Create | Breadcrumb navigation | B |
| `app/(pages)/records/components/CreateFolderDialog.tsx` | Create | Create folder dialog | B |
| `app/(pages)/records/components/ItemCard.tsx` | Create | Unified item card (table/doc) | B |
| `app/(pages)/records/components/MoveItemDialog.tsx` | Create | Move item to folder dialog | B |
| `app/(pages)/records/page.tsx` | Modify | Use FolderView instead of catalog | B |
| `app/(pages)/records/[folderPath]/page.tsx` | Create | Folder contents page | B |
| `app/(pages)/records/[folderPath]/[itemId]/page.tsx` | Create | Item view (table or doc) | B |
| `app/(pages)/docs/page.tsx` | Modify | Redirect to /records or show filtered view | B |

---

## Part A: Folder System Backend

### Goal

Create backend infrastructure for folder management: folder CRUD operations, folder tree building, item storage in folders, and migration of existing items.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/records/types.ts` | Create | Folder and item types | ~100 |
| `app/api/records/services/folders.ts` | Create | Folder CRUD operations | ~200 |
| `app/api/records/services/folder-tree.ts` | Create | Build folder hierarchy | ~150 |
| `app/api/records/services/migration.ts` | Create | Migrate existing items | ~200 |
| `app/api/records/folders/route.ts` | Create | List/create folders API | ~100 |
| `app/api/records/folders/[folderId]/route.ts` | Create | Update/delete folder API | ~120 |
| `app/api/records/folders/[folderId]/items/route.ts` | Create | List items in folder | ~80 |
| `app/api/records/items/[itemId]/move/route.ts` | Create | Move item API | ~80 |
| `app/api/records/services/catalog.ts` | Modify | Support folders | ~100 |
| `app/api/records/services/io.ts` | Modify | Support folder paths | ~80 |

### Pseudocode

#### `app/api/records/types.ts`

```
export type FolderMetadata = {
  id: string;
  name: string;
  description?: string;
  parentFolderId?: string; // null for root
  createdAt: string;
  updatedAt: string;
};

export type ItemType = "table" | "document";

export type FolderItem = {
  id: string;
  type: ItemType;
  name: string;
  folderId: string;
  createdAt: string;
  updatedAt: string;
};

export type FolderContents = {
  folder: FolderMetadata;
  folders: FolderMetadata[]; // Subfolders
  items: FolderItem[]; // Tables and documents
};
```

#### `app/api/records/services/folders.ts`

```
FolderService
├── createFolder(name: string, parentFolderId?: string)
│   ├── Generate folderId: `folder_${nanoid(12)}`
│   ├── Build folder path: `_tables/records/${parentPath}/${folderId}/`
│   ├── Create folder.json:
│   │   └── { id, name, parentFolderId, createdAt, updatedAt }
│   ├── Write folder.json to folder directory
│   └── Return FolderMetadata
├── getFolder(folderId: string)
│   ├── Find folder directory (scan or use index)
│   ├── Read folder.json
│   └── Return FolderMetadata
├── updateFolder(folderId: string, updates: Partial<FolderMetadata>)
│   ├── Read existing folder.json
│   ├── Merge updates
│   ├── Write updated folder.json
│   └── Return updated FolderMetadata
├── deleteFolder(folderId: string)
│   ├── Check if folder is empty (no subfolders or items)
│   ├── If not empty: throw error
│   ├── Delete folder directory recursively
│   └── Return success
└── getFolderContents(folderId: string)
    ├── Read folder.json
    ├── Scan folder directory:
    │   ├── Find subfolders (directories with folder.json)
    │   └── Find items (directories with schema.json or content.md)
    ├── Build FolderContents object
    └── Return FolderContents
```

#### `app/api/records/services/folder-tree.ts`

```
FolderTreeService
├── buildFolderTree(rootFolderId?: string)
│   ├── Start from root folder (or specified folder)
│   ├── Recursively load subfolders:
│   │   ├── Get folder contents
│   │   ├── For each subfolder: recursively build tree
│   │   └── Build tree structure
│   └── Return folder tree
└── getFolderPath(folderId: string)
    ├── Traverse up parent chain
    ├── Build path array: [root, parent, ..., folder]
    └── Return path array
```

#### `app/api/records/services/migration.ts`

```
MigrationService
├── migrateExistingItems()
│   ├── Create root folder (_root/) if doesn't exist
│   ├── Scan _tables/records/ for existing tables:
│   │   ├── For each table directory:
│   │   │   ├── Move to _root/[tableId]/
│   │   │   └── Update any references
│   ├── Scan _tables/documents/ for existing docs:
│   │   ├── For each doc directory:
│   │   │   ├── Move to _root/[docId]/
│   │   │   └── Update any references
│   └── Return migration summary
└── isMigrationNeeded()
    ├── Check if _root/ folder exists
    ├── Check if old structure has items
    └── Return boolean
```

#### `app/api/records/folders/route.ts`

```
GET /api/records/folders?parentId=xxx
├── Authenticate user
├── Get parentFolderId from query (or null for root)
├── Call FolderService.getFolderContents(parentFolderId)
└── Return { folders, items }

POST /api/records/folders
├── Authenticate user
├── Parse body: { name, parentFolderId? }
├── Call FolderService.createFolder(name, parentFolderId)
└── Return { folder }
```

#### `app/api/records/folders/[folderId]/route.ts`

```
PATCH /api/records/folders/[folderId]
├── Authenticate user
├── Parse body: { name?, description? }
├── Call FolderService.updateFolder(folderId, updates)
└── Return { folder }

DELETE /api/records/folders/[folderId]
├── Authenticate user
├── Call FolderService.deleteFolder(folderId)
└── Return { success: true }
```

#### `app/api/records/items/[itemId]/move/route.ts`

```
PATCH /api/records/items/[itemId]/move
├── Authenticate user
├── Parse body: { targetFolderId }
├── Find item directory (scan folders)
├── Move directory to target folder
├── Update any metadata files
└── Return { success: true }
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Can create folder | POST /api/records/folders, verify folder.json created |
| AC-A.2 | Can list folders | GET /api/records/folders, verify folders returned |
| AC-A.3 | Can update folder | PATCH /api/records/folders/[id], verify folder.json updated |
| AC-A.4 | Can delete empty folder | DELETE /api/records/folders/[id], verify directory removed |
| AC-A.5 | Cannot delete non-empty folder | DELETE non-empty folder, verify error |
| AC-A.6 | Can get folder contents | GET /api/records/folders/[id], verify subfolders and items |
| AC-A.7 | Can move item to folder | PATCH /api/records/items/[id]/move, verify item moved |
| AC-A.8 | Migration preserves data | Run migration, verify all items in _root/ |
| AC-A.9 | Folder tree builds correctly | Build tree, verify hierarchy matches structure |

---

## Part B: Frontend Folder UI

### Goal

Build frontend UI for folder management: folder view, folder tree sidebar, breadcrumbs, create folder dialog, and item cards that work for both tables and documents.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/records/store/slices/folderSlice.ts` | Create | Folder state management | ~150 |
| `app/(pages)/records/components/FolderView.tsx` | Create | Main folder contents view | ~200 |
| `app/(pages)/records/components/FolderTree.tsx` | Create | Sidebar folder tree | ~150 |
| `app/(pages)/records/components/Breadcrumbs.tsx` | Create | Breadcrumb navigation | ~80 |
| `app/(pages)/records/components/CreateFolderDialog.tsx` | Create | Create folder dialog | ~100 |
| `app/(pages)/records/components/ItemCard.tsx` | Create | Unified item card | ~120 |
| `app/(pages)/records/components/MoveItemDialog.tsx` | Create | Move item dialog | ~120 |
| `app/(pages)/records/page.tsx` | Modify | Use FolderView | ~50 |
| `app/(pages)/records/[folderPath]/page.tsx` | Create | Folder page | ~100 |
| `app/(pages)/records/[folderPath]/[itemId]/page.tsx` | Create | Item view page | ~150 |

### Pseudocode

#### `app/(pages)/records/components/FolderView.tsx`

```
FolderView({ folderId })
├── Fetch folder contents: GET /api/records/folders?id={folderId}
├── Render:
│   ├── Breadcrumbs (folder path)
│   ├── Header:
│   │   ├── Folder name
│   │   └── "New" button (Folder, Table, Document)
│   ├── Grid view:
│   │   ├── Folder cards (click to navigate)
│   │   └── Item cards (tables + documents)
│   └── Empty state (if no folders/items)
└── Handle:
    ├── Folder click → navigate to /records/folder/[folderId]
    ├── Table click → navigate to /records/folder/[folderId]/[tableId]
    └── Document click → navigate to /records/folder/[folderId]/[docId]
```

#### `app/(pages)/records/components/FolderTree.tsx`

```
FolderTree({ currentFolderId, onFolderSelect })
├── Fetch folder tree: GET /api/records/folders/tree
├── Render tree:
│   ├── Root folder
│   ├── Recursively render subfolders:
│   │   ├── Folder name (clickable)
│   │   ├── Expand/collapse icon
│   │   └── Nested subfolders (if expanded)
│   └── Highlight current folder
└── Handle:
    ├── Folder click → call onFolderSelect(folderId)
    └── Expand/collapse → toggle state
```

#### `app/(pages)/records/components/Breadcrumbs.tsx`

```
Breadcrumbs({ folderPath })
├── Build breadcrumb items:
│   ├── "Records" (root)
│   ├── For each folder in path:
│   │   └── Folder name (link)
│   └── Current folder (not link)
├── Render:
│   └── Breadcrumb trail with separators
└── Handle:
    └── Click breadcrumb → navigate to that folder
```

#### `app/(pages)/records/components/ItemCard.tsx`

```
ItemCard({ item, onMove, onDelete })
├── Render card:
│   ├── Icon (table icon or document icon)
│   ├── Item name
│   ├── Item type badge
│   ├── Last modified date
│   └── Actions menu (Move, Rename, Delete)
├── Handle:
│   ├── Click card → navigate to item
│   ├── Move → open MoveItemDialog
│   └── Delete → confirm and delete
└── Style based on item type
```

#### `app/(pages)/records/[folderPath]/page.tsx`

```
FolderPage({ params })
├── Parse folderPath from params
├── Extract folder IDs from path
├── Load folder contents for current folder
├── Render:
│   ├── FolderTree (sidebar)
│   ├── FolderView (main content)
│   └── Breadcrumbs
└── Handle navigation
```

#### `app/(pages)/records/[folderPath]/[itemId]/page.tsx`

```
ItemPage({ params })
├── Parse folderPath and itemId
├── Determine item type (check for schema.json or content.md)
├── If table:
│   └── Render RecordsGrid (existing component)
├── If document:
│   └── Render DocumentEditor (from docs feature)
└── Show breadcrumbs and back button
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Folder view displays folders and items | Navigate to folder, verify grid shows content |
| AC-B.2 | Can create folder | Click "New" → "Folder", verify folder created |
| AC-B.3 | Can navigate into folder | Click folder card, verify navigates to folder |
| AC-B.4 | Breadcrumbs show path | Navigate deep, verify breadcrumbs show path |
| AC-B.5 | Can click breadcrumb to go back | Click breadcrumb, verify navigates to that folder |
| AC-B.6 | Folder tree shows hierarchy | Verify sidebar shows folder tree |
| AC-B.7 | Can expand/collapse folders in tree | Click expand icon, verify subfolders show |
| AC-B.8 | Item cards show correct type | Verify table icon for tables, doc icon for docs |
| AC-B.9 | Can move item to folder | Right-click item → Move, verify item moved |
| AC-B.10 | Can create table in folder | Click "New" → "Table", verify table in folder |
| AC-B.11 | Can create document in folder | Click "New" → "Document", verify doc in folder |
| AC-B.12 | Table opens correctly | Click table, verify grid view opens |
| AC-B.13 | Document opens correctly | Click document, verify editor opens |

---

## User Flows

### Flow 1: Create Folder Structure

```
1. User navigates to /records
2. Sees root folder with existing items
3. User clicks "New" → "Folder"
4. Enters name: "Job Applications"
5. Clicks "Create"
6. Folder appears in view
7. User clicks folder to open it
8. Sees empty folder
9. User clicks "New" → "Table"
10. Creates "Applications Tracker" table
11. Table appears in folder
```

### Flow 2: Organize Existing Items

```
1. User navigates to root folder
2. Sees many tables and documents
3. User creates "Research" folder
4. User right-clicks "Competitor Analysis" document
5. Selects "Move to..."
6. Picks "Research" folder
7. Document moves to folder
8. User navigates to "Research" folder
9. Sees document there
```

---

## Out of Scope

- **File Uploads**: Uploading external files (separate feature)
- **Sharing**: Folder-level permissions (future)
- **Versioning**: Folder history (future)
- **Tags**: Tag-based organization (folders are primary)
- **Advanced Search**: Full-text search (future)
- **Bulk Operations**: Multi-select (future)

---

## Open Questions

- [ ] Should `/docs` redirect to `/records` or show filtered view?
- [ ] What should root folder be called? "Root", "All Items", or nothing?
- [ ] Maximum folder depth? (Start with 10 levels)
- [ ] Can items have same name in different folders? (Yes)
- [ ] Migration timing: automatic or explicit? (Automatic on first load)
- [ ] Should there be a "Recent" or "Starred" view? (Future)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| YYYY-MM-DD | Initial creation | TBD |
