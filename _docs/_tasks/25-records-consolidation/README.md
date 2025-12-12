# Task 25: Records Consolidation

**Status:** Planning
**Created:** December 12, 2025
**Branch:** `claude/rag-records-integration-0143brZmSonmErf4MouXnVzc`

---

## Overview

Consolidate the flat `/records` (tables) and `/docs` (documents) pages into a single, folder-based "Google Drive-like" interface. Users will manage all their structured data and documents in one place with familiar folder organization.

---

## Goals

1. **Unified `/records` Route** — Single page for both tables and documents
2. **Folder Organization** — Create, nest, and navigate folders
3. **Google Drive-like UI** — Card grid, folder tree sidebar, breadcrumbs
4. **API Consolidation** — Merge `/api/docs` into `/api/records/documents`
5. **Storage Migration** — Unified folder-based storage structure

---

## North Star

Users navigate to `/records` and see all their data in one place:
- Folders they've created ("Job Applications", "Research", "Projects")
- Tables and documents side-by-side, distinguished by icons
- Familiar navigation: click folders to enter, breadcrumbs to go back
- Create new folders, tables, or documents from the "New" button

---

## Current State

### Records (`/records`)
- Flat catalog of structured data tables with Polars DataFrames
- TanStack Table-based grid with inline editing
- Chat sidebar with AI agents
- Storage: `_tables/records/[tableId]/`

### Docs (`/docs`)
- Flat catalog of markdown documents with frontmatter
- Lexical-based rich text editor with versioning
- Chat sidebar with AI document assistant
- Storage: `_tables/documents/[docId]/`

### Problems
- Two separate pages for related content
- No folder organization in either
- Different navigation patterns
- Users have to context-switch between data and documents

---

## Key Documents

| Document | Purpose |
|----------|---------|
| [00-Product-Spec.md](./00-Product-Spec.md) | Requirements, acceptance criteria, user flows |
| [01-File-Impact-Analysis.md](./01-File-Impact-Analysis.md) | Files to create/modify/delete |
| [UXD/README.md](./UXD/README.md) | Mockup requirements and status |

---

## Phases

| Phase | Name | Description |
|-------|------|-------------|
| 1 | Folder Backend Infrastructure | API consolidation, folder CRUD, storage migration |
| 2 | Folder Frontend UI | FolderView, FolderTree, Breadcrumbs, ItemCard |

---

## Related Documentation

- **Records Consolidation Roadmap:** `_docs/Product/ROADMAP/records-consolidation/`
- **Records Feature:** `_docs/_tasks/_completed/20-records-feature/`
- **Docs Feature:** `_docs/_tasks/_completed/22b-docs-feature/`
- **Task 26 (RAG Integration):** `_docs/_tasks/26-rag-integration/` (builds on this)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-12 | Split RAG into Task 26 | Claude |
| 2025-12-12 | Initial task creation | Claude |
