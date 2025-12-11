# Records and Docs Consolidation

**Status:** Draft  
**Priority:** P1  
**North Star:** Enables organized knowledge management for the Job Application Agent. Users can organize resumes, job postings, research documents, and application tracking tables in a unified, folder-based structure - just like Google Drive. This makes it easier to manage all the data and documents agents need to operate effectively.

---

## Problem Statement

Currently, Records (structured data tables) and Docs (rich text documents) are separate features with separate pages (`/records` and `/docs`). This creates several problems:

- **Fragmented experience**: Users must navigate between two different pages to manage related content
- **No organization**: Both catalogs are flat lists with no folder structure
- **Confusing mental model**: Users don't understand when to use Records vs Docs
- **Poor scalability**: As content grows, flat lists become unmanageable
- **Inconsistent navigation**: Two separate entry points in the app

The user mentioned that "docs will likely be consolidated into a type of record" in the future, so this consolidation aligns with that vision. By treating docs as a special type of record (unstructured text vs structured data), we can unify the experience under a single, folder-based interface similar to Google Drive.

---

## User Value

- **Unified interface**: One place to manage all data and documents
- **Folder organization**: Create folders to organize content by project, topic, or workflow
- **Better mental model**: Records = structured data (tables), Docs = unstructured text (documents), both are "items" in folders
- **Improved navigation**: Breadcrumb navigation, folder hierarchy, search across all content
- **Scalability**: Organize hundreds of tables and documents in a clear hierarchy
- **Familiar UX**: Google Drive-like interface that users already understand
- **Context grouping**: Group related tables and documents together (e.g., "Job Applications" folder with resume doc + applications table)

---

## User Flows

### Flow 1: Browse Folder Structure

```
1. User navigates to /records
2. Sees root folder with folders and items (tables + docs)
3. Items show type icon (table icon or doc icon)
4. User clicks "Job Applications" folder
5. Sees folder contents: "Resume.md", "Applications Table", "Cover Letters" subfolder
6. User clicks "Cover Letters" subfolder
7. Sees nested folder contents
8. User clicks breadcrumb "Job Applications" to go back
```

### Flow 2: Create Folder

```
1. User clicks "New" button in /records
2. Dropdown shows: "Folder", "Table", "Document"
3. User selects "Folder"
4. Dialog opens: "Create Folder"
5. User enters name: "Competitor Research"
6. User clicks "Create"
7. New folder appears in current view
8. User can drag items into folder
```

### Flow 3: Move Item to Folder

```
1. User right-clicks on "Resume.md" document
2. Context menu shows: "Move to...", "Rename", "Delete"
3. User clicks "Move to..."
4. Folder picker dialog opens
5. User selects "Job Applications" folder
6. User clicks "Move"
7. Document disappears from current view
8. User navigates to "Job Applications" folder
9. Document appears in that folder
```

### Flow 4: Create Table in Folder

```
1. User navigates to "Job Applications" folder
2. User clicks "New" → "Table"
3. Create table dialog opens
4. User enters name: "Applications Tracker"
5. Table is created in current folder
6. User sees table in folder view
7. User clicks table to open it
8. URL is /records/folder/job-applications/applications-tracker
```

### Flow 5: Create Document in Folder

```
1. User navigates to "Research" folder
2. User clicks "New" → "Document"
3. Create document dialog opens
4. User enters title: "Market Analysis"
5. Document is created in current folder
6. User sees document in folder view
7. User clicks document to open it
8. URL is /records/folder/research/market-analysis
```

### Flow 6: Search Across All Content

```
1. User types in search bar: "resume"
2. Search results show:
   - Documents matching "resume" (from any folder)
   - Tables with "resume" in name (from any folder)
   - Folders containing "resume" items
3. Results show folder path: "Job Applications > Resume.md"
4. User clicks result
5. Navigates to item in its folder
```

---

## Code Areas

Domains/directories to research before implementation:

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/(pages)/records/` | Current records catalog and table views | `page.tsx`, `[tableId]/page.tsx`, `components/` |
| `app/(pages)/docs/` | Current docs catalog and editor | `page.tsx`, `[docId]/page.tsx`, `components/` |
| `app/api/records/` | Records API endpoints | `list/route.ts`, `create/route.ts`, `services/catalog.ts` |
| `app/api/docs/` | Docs API endpoints | `route.ts`, `[docId]/route.ts`, `services/document-io.ts` |
| `_tables/records/` | Records storage structure | `[tableId]/schema.json`, `[tableId]/records.json` |
| `_tables/documents/` | Docs storage structure | `[docId]/content.md` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Storage Structure** | Folders as directories, items stored in folders | Matches file system, simple to implement, Git-friendly |
| **Folder Metadata** | `folder.json` in each folder directory | Stores folder name, description, created date |
| **Item Location** | Items stored in folder directories | `_tables/records/[folderId]/[itemId]/` for nested structure |
| **URL Structure** | `/records/folder/[folderPath]/[itemId]` | Supports nested folders, clear hierarchy |
| **Migration Strategy** | Move existing items to root folder | Preserve all existing data, no breaking changes |
| **Item Types** | `table` and `document` (docs become document type) | Unified type system, extensible for future types |
| **Catalog API** | Single endpoint returns folder tree | Efficient, supports recursive folder structure |
| **UI Pattern** | Google Drive-style grid/list view | Familiar, proven UX pattern |
| **Navigation** | Breadcrumbs + folder tree sidebar | Clear hierarchy, easy navigation |

---

## Constraints

- **Existing Data**: Must preserve all existing tables and documents during migration
- **URL Compatibility**: Existing `/records/[tableId]` URLs should redirect or work
- **API Compatibility**: Existing API endpoints should continue working (or be deprecated gracefully)
- **Storage Format**: Keep existing file formats (schema.json, records.json, content.md)
- **Git-Friendly**: Folder structure must remain Git-friendly (no binary blobs, readable structure)
- **Performance**: Folder tree loading should be efficient (lazy load nested folders)

---

## Success Criteria

- [ ] Users can navigate to `/records` and see unified catalog
- [ ] Users can create folders
- [ ] Users can create tables in folders
- [ ] Users can create documents in folders (docs feature integrated)
- [ ] Users can move items between folders
- [ ] Users can navigate folder hierarchy (breadcrumbs work)
- [ ] Users can search across all folders, tables, and documents
- [ ] Existing tables and documents are preserved (migration successful)
- [ ] Existing URLs redirect or work correctly
- [ ] Folder structure is visible in file system (`_tables/records/`)
- [ ] Docs page redirects to `/records` (or shows unified view)

---

## Out of Scope

- **File Uploads**: Uploading external files (images, PDFs) - separate feature
- **Sharing**: Folder-level sharing or permissions - future enhancement
- **Versioning**: Folder versioning or history - future enhancement
- **Tags**: Tag-based organization (folders are primary organization)
- **Advanced Search**: Full-text search within documents - future enhancement
- **Bulk Operations**: Select multiple items for bulk move/delete - future enhancement
- **Folder Templates**: Pre-configured folder structures - future enhancement

---

## Open Questions

- **Root Folder Name**: What should the root folder be called? "Root", "All Items", or just show items directly?
- **Default View**: Should root show folders + items, or just folders? (Google Drive shows both)
- **Folder Limits**: Maximum folder depth? (Start with reasonable limit like 10 levels)
- **Item Naming**: Can items have same name in different folders? (Yes, folders provide namespace)
- **Migration Timing**: Should migration happen automatically on first load, or require explicit migration step?
- **Docs Route**: Should `/docs` redirect to `/records`, or show filtered view (only documents)?
- **Type Filtering**: Should users be able to filter by type (show only tables, or only documents)?
- **Folder Icons**: Should folders have custom icons, or use default folder icon?

---

## Technical Architecture (High-Level)

### Storage Structure

```
_tables/records/
├── _root/                          # Root folder (special)
│   ├── folder.json                 # Root folder metadata
│   ├── competitor-research/        # Folder
│   │   ├── folder.json
│   │   ├── table_abc123/           # Table item
│   │   │   ├── schema.json
│   │   │   └── records.json
│   │   └── doc_xyz789/             # Document item
│   │       └── content.md
│   └── job-applications/           # Another folder
│       ├── folder.json
│       └── ...
└── [legacy items moved here during migration]
```

### API Structure

- `GET /api/records/folders` - List folders and items in a folder
- `POST /api/records/folders` - Create folder
- `PATCH /api/records/folders/[folderId]` - Update folder (rename, move)
- `DELETE /api/records/folders/[folderId]` - Delete folder
- `POST /api/records/folders/[folderId]/items` - Create item (table or document) in folder
- `PATCH /api/records/items/[itemId]` - Move item to different folder
- `GET /api/records/search?q=query` - Search across all folders and items

### Frontend Structure

- `/records` - Main catalog page (folder view)
- `/records/folder/[folderPath]` - Folder contents view
- `/records/folder/[folderPath]/[itemId]` - Item view (table or document)
- Breadcrumb navigation component
- Folder tree sidebar component
- Item grid/list view component
- Create folder/item dialogs

---

## References

- **Current Records**: `_docs/Product/Features/02-Shared-Memory-Records.md`
- **Current Docs**: `_docs/_tasks/_completed/22b-docs-feature/00-Product-Spec.md`
- **Storage Patterns**: `_docs/_diary/13-113025-records-domain-and-polars.md`
- **Google Drive UX**: Reference for folder-based file management patterns

---

## Related Roadmap Items

- **RAG Integration**: Folders could be used to organize RAG-indexed content
- **File Uploads**: Uploaded files could be stored in folders
- **Agent Access**: Agents could be assigned access to specific folders
