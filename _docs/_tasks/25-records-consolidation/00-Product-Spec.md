# Task 25: Records Consolidation — Product Spec

**Status:** Planning
**Date:** December 12, 2025
**Goal:** Consolidate Records and Docs into a unified folder-based interface.

---

## 1. Executive Summary

Today, Records and Docs are separate features with flat catalogs. Users navigate between `/records` (tables) and `/docs` (documents) to manage related content. There's no folder organization—everything sits in one flat list.

This task delivers a unified knowledge management interface:

1. **Unified `/records` Page** — One place to manage all structured data (tables) and unstructured content (documents)
2. **Folder Organization** — Google Drive-like folder structure with create, nest, and move operations
3. **API Consolidation** — Merge `/api/docs` into `/api/records/documents` for unified data access

**End state:** Users organize their data in folders under `/records`. Tables and documents appear side-by-side, distinguished by icons. The `/docs` route redirects to `/records`.

---

## 2. Product Requirements

### 2.1 Folder Organization

**Definition:** A hierarchical folder structure for organizing tables and documents.

**Why it matters:** As users accumulate tables and documents, flat lists become unmanageable. Folders provide the familiar mental model of Google Drive/Notion.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-1.1 | Users can create folders to organize content | P0 |
| PR-1.2 | Users can nest folders (subfolder support) | P0 |
| PR-1.3 | Users can move tables/documents between folders | P0 |
| PR-1.4 | Folders display in a tree structure sidebar | P0 |
| PR-1.5 | Breadcrumb navigation shows current folder path | P0 |
| PR-1.6 | Both tables and documents appear in same folder view | P0 |
| PR-1.7 | Search filters across all folders | P1 |
| PR-1.8 | Root folder shows all content for backward compatibility | P0 |

### 2.2 Unified Item Display

**Definition:** Tables and documents displayed together with type distinction.

**Why it matters:** Users shouldn't think about "records vs docs"—they think about "my data and documents."

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-2.1 | Items show type icon (table icon vs document icon) | P0 |
| PR-2.2 | Card layout displays item type, name, metadata | P0 |
| PR-2.3 | "New" button offers: Folder, Table, Document | P0 |
| PR-2.4 | Item cards show record count (tables) or word count (docs) | P1 |
| PR-2.5 | Right-click context menu: Move, Rename, Delete | P1 |
| PR-2.6 | Items can have same name in different folders | P1 |

### 2.3 API Consolidation

**Definition:** Merge `/api/docs` routes into `/api/records/documents`.

**Why it matters:** Unified API reflects unified user experience and simplifies frontend data access.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-3.1 | Move `/api/docs/[docId]` to `/api/records/documents/[docId]` | P0 |
| PR-3.2 | Document services co-located under records domain | P0 |
| PR-3.3 | Existing `/api/docs` routes redirect or deprecated | P1 |
| PR-3.4 | Unified types for items (tables + documents) | P0 |
| PR-3.5 | Folder-aware document creation | P0 |

### 2.4 Storage Consolidation

**Definition:** Unified storage structure with folder metadata.

**Why it matters:** Storage should mirror the mental model—items live in folders.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-4.1 | Both tables and documents under `_tables/records/_root/` | P0 |
| PR-4.2 | Folders have `folder.json` metadata file | P0 |
| PR-4.3 | Items track parent folder ID | P0 |
| PR-4.4 | Migration moves existing items to root folder | P0 |
| PR-4.5 | Backwards compatible—direct item access still works | P0 |

---

## 3. Acceptance Criteria

### Folder Organization (8 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-1 | Folder sidebar shows folder tree | Navigate to /records, verify tree visible |
| AC-2 | Can create folder in any location | Click "New" → "Folder", verify created |
| AC-3 | Can create nested subfolders | Create folder inside folder |
| AC-4 | Breadcrumbs show current path | Navigate into folder, verify breadcrumbs |
| AC-5 | Clicking breadcrumb navigates to folder | Click breadcrumb segment |
| AC-6 | Can move item to different folder | Right-click → Move, select target |
| AC-7 | Search filters items across all folders | Type in search, verify results |
| AC-8 | Existing tables appear in root folder | Open root, verify legacy data |

### Unified Display (5 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-9 | Tables show table icon (blue) | Check icon on table cards |
| AC-10 | Documents show document icon (amber) | Check icon on doc cards |
| AC-11 | "New" dropdown shows Folder, Table, Document | Click "New" button |
| AC-12 | Creating table in folder places it there | Create table in subfolder |
| AC-13 | Creating document in folder places it there | Create doc in subfolder |

### API Consolidation (4 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-14 | `/api/records/documents/[docId]` returns document | Fetch document via new route |
| AC-15 | `/api/docs/[docId]` still works (redirect/deprecated) | Fetch via old route |
| AC-16 | Document services under records domain | Check file locations |
| AC-17 | Unified item types work for both | Create table and doc, verify types |

### Backwards Compatibility (3 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-18 | Existing tables still accessible | Open old table, verify data |
| AC-19 | Existing documents still accessible | Open old doc, verify content |
| AC-20 | Existing agent tool access still works | Chat with agent, use sys_table_read |

---

## 4. User Flows

### Flow 1: Organize Content in Folders

```
1. User navigates to /records
2. Sees root folder with existing tables and documents
3. User clicks "New" → "Folder"
4. Creates "Job Applications" folder
5. User right-clicks "Resume.md" document
6. Selects "Move to..." → "Job Applications"
7. Document moves to folder
8. User navigates to "Job Applications" folder
9. Sees resume there
10. User clicks "New" → "Table"
11. Creates "Applications Tracker" table in folder
```

### Flow 2: Browse Folder Structure

```
1. User navigates to /records
2. Sees folder tree in sidebar:
   - All Records (root)
   - Job Applications
     - Cover Letters
   - Research
3. User clicks "Job Applications"
4. Main area shows folder contents
5. Breadcrumbs show: Records > Job Applications
6. User clicks "Cover Letters" subfolder
7. Breadcrumbs update: Records > Job Applications > Cover Letters
8. User clicks "Job Applications" in breadcrumbs
9. Navigates back to parent folder
```

### Flow 3: Create New Content

```
1. User navigates to "Research" folder
2. Clicks "New" dropdown button
3. Sees options: Folder, Table, Document
4. Selects "Document"
5. New document created in "Research" folder
6. Editor opens for the new document
7. Document appears in folder with amber icon
```

---

## 5. Design Decisions

### 5.1 Decisions Made

| ID | Question | Choice | Rationale |
|----|----------|--------|-----------|
| DD-1 | Where does folder tree go? | Left sidebar | Matches Google Drive mental model |
| DD-2 | Folder tree default state? | Expanded | Users can see full structure immediately |
| DD-3 | How to display item types? | Icon only | Cleaner UI, icons are distinctive enough |
| DD-4 | What happens to /docs route? | Redirect to /records | Full consolidation, single source of truth |
| DD-5 | Migration of existing items? | Automatic on first load | Seamless user experience |

### 5.2 Decision Log

| Date | Decision | Choice | Rationale |
|------|----------|--------|-----------|
| 2025-12-12 | Folder tree in left sidebar | A | Matches Google Drive mental model |
| 2025-12-12 | Icon-only type display | A | Cleaner UI, icons are distinctive enough |
| 2025-12-12 | /docs redirects to /records | A | Full consolidation, single source of truth |
| 2025-12-12 | Automatic migration | A | Seamless user experience |

---

## 6. UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show | Status |
|--------|---------|-----------|--------|
| 01-folder-view | Main folder contents view | Folder tree sidebar + card grid + breadcrumbs | Complete |
| 02-item-cards | Item card designs | Table card vs Document card with type icons | Complete |
| 03-create-dropdown | New button dropdown | Options: Folder, Table, Document | Complete |
| 04-move-dialog | Move item dialog | Folder tree picker for destination | Complete |

### Mockup Location

```
_docs/_tasks/25-records-consolidation/UXD/
├── 01-folder-view.html
├── 02-item-cards.html
├── 03-create-dropdown.html
├── 04-move-dialog.html
└── README.md
```

---

## 7. Success Criteria

| Criterion | How to Validate | Priority |
|-----------|-----------------|----------|
| Users can organize content in folders | Create folders, move items, navigate | P0 |
| Tables and docs appear in unified view | Both types visible in folder | P0 |
| API consolidation complete | Documents served from /api/records/documents | P0 |
| Existing data preserved after migration | All tables and docs accessible | P0 |
| /docs route redirects to /records | Navigate to /docs, lands on /records | P0 |

**North Star:** Users manage all their knowledge in one organized place—no more switching between /records and /docs.

---

## 8. Out of Scope

- **RAG Integration** — Moved to Task 26
- **Agent Assignment UI** — Moved to Task 26
- **Real-time collaborative editing** — Future enhancement
- **Bulk folder operations** — Multi-select move/delete
- **Folder sharing/permissions** — Future enhancement

---

## 9. Phased Approach

### Phase 1: Backend Infrastructure
- API consolidation (`/api/docs` → `/api/records/documents`)
- Folder CRUD services
- Storage structure (`_tables/records/_root/[folderId]/`)
- Migration of existing items
- Folder tree building

### Phase 2: Frontend UI
- FolderView component
- FolderTree sidebar
- Breadcrumbs navigation
- ItemCard for tables + docs
- CreateFolderDialog, MoveItemDialog
- /docs redirect to /records

---

## 10. Related Documents

### Architecture Principles

| Principle | Application |
|-----------|-------------|
| [API Domain Principles](../../../app/api/DOMAIN_PRINCIPLES.md) | Routes nested by ownership |
| [Store Slice Principles](../../../app/STORE_SLICE_PRINCIPLES.md) | Folder slice structure |
| [Component Principles](../../../app/COMPONENT_PRINCIPLES.md) | shadcn/ui first; state in stores |
| [Route README Template](../../../app/api/ROUTE_README_TEMPLATE.md) | Documentation for new routes |
| [Service README Template](../../../app/api/SERVICE_README_TEMPLATE.md) | Documentation for new services |

### Feature Documentation

- **Records Consolidation Roadmap:** `_docs/Product/ROADMAP/records-consolidation/01-Records-and-Docs-Consolidation.md`
- **Records Feature:** `_docs/_tasks/_completed/20-records-feature/`
- **Docs Feature:** `_docs/_tasks/_completed/22b-docs-feature/`
- **Task 26 (RAG):** `_docs/_tasks/26-rag-integration/` (builds on this)

---

**Last Updated:** 2025-12-12
