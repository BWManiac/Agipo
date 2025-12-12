# Task 25: Records Consolidation - UXD

**Status:** Complete
**Last Updated:** December 12, 2025

---

## Overview

Design mockups for the unified Records experience with folder organization.

**Design Goals:**
- Google Drive-like folder navigation (familiar, intuitive)
- Clear visual distinction between tables and documents
- Unified experience for all data types

**Design Language:** v2-minimal (clean, monochrome, professional)

---

## Mockups

### Folder Organization

| # | File | Description | Status |
|---|------|-------------|--------|
| 01 | `01-folder-view.html` | Main folder contents view with sidebar tree + card grid | Complete |
| 02 | `02-item-cards.html` | Table card vs Document card designs with type icons | Complete |
| 03 | `03-create-dropdown.html` | "New" button dropdown (Folder, Table, Document) | Complete |
| 04 | `04-move-dialog.html` | Move item and create folder dialogs | Complete |

---

## Key Design Elements

### Folder Tree Sidebar

```
┌─────────────────────────────────────┐
│ ▼ All Records                       │
│   ├── Job Applications              │
│   │   └── Cover Letters             │
│   ├── Research                      │
│   └── + New Folder                  │
└─────────────────────────────────────┘
```

**Requirements:**
- Collapsible/expandable folders
- Current folder highlighted
- Drag-and-drop support (future)
- Quick-create folder at bottom

### Item Cards

**Table Card:**
```
┌──────────────────────────┐
│ 📊  Stakeholder          │  ← Table icon (blue)
│      Interviews          │
│                          │
│ "Interview feedback..."  │  ← Description
│                          │
│ 124 records • 5 cols     │  ← Metadata
│ Updated 2 hours ago      │
└──────────────────────────┘
```

**Document Card:**
```
┌──────────────────────────┐
│ 📄  Resume               │  ← Document icon (amber)
│                          │
│ "Professional resume..." │  ← Description
│                          │
│ ~1,200 words             │  ← Metadata
│ Updated yesterday        │
└──────────────────────────┘
```

### Color Coding

| Element | Color | Meaning |
|---------|-------|---------|
| Tables | Blue (`text-blue-500`) | Structured data |
| Documents | Amber (`text-amber-500`) | Unstructured content |
| Folders | Amber (`text-amber-500`) | Organization |

---

## Design Decisions Made

| Question | Decision | Rationale |
|----------|----------|-----------|
| Folder tree position? | Left sidebar | Matches Google Drive mental model |
| Show folders and items mixed? | Folders first | Cleaner, more familiar |
| How to display item types? | Icon only | Clean UI, icons are distinctive |
| Empty folder state? | Message + "Create" button | Helpful for new users |

---

## Related Mockups

- **Existing Records:** `_docs/UXD/Pages/records/2025-12-09-sheets-v2/`
- **Docs Editor:** `_docs/UXD/Pages/records/2025-12-10-docs-v1/`
- **Records Consolidation UXD (Roadmap):** `_docs/Product/ROADMAP/records-consolidation/UXD/`

---

## RAG Mockups (Moved to Task 26)

The following mockups have been moved to Task 26 (RAG Integration):
- `05-assignment-dialog.html` → Task 26 `01-assignment-dialog.html`
- `06-rag-status-badges.html` → Task 26 `02-rag-status-badges.html`
- `07-agent-records-tab.html` → Task 26 `03-agent-records-tab.html`

See: `_docs/_tasks/26-rag-integration/UXD/`

---

## Related Documentation

- **Product Spec:** `../00-Product-Spec.md`
- **File Impact:** `../01-File-Impact-Analysis.md`
- **Google Drive Reference:** https://drive.google.com
- **Notion Reference:** https://notion.so

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-12 | Moved RAG mockups to Task 26 | Claude |
| 2025-12-12 | Initial UXD plan created | Claude |
