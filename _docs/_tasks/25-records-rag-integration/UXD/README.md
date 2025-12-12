# Records & RAG Integration - UXD

**Status:** Complete
**Last Updated:** December 12, 2025

---

## Overview

Design mockups for the unified Records experience with folder organization and RAG-powered agent integration.

**Design Goals:**
- Google Drive-like folder navigation (familiar, intuitive)
- Clear visual distinction between tables and documents
- Seamless RAG configuration within agent assignment flow
- Progress indicators for async indexing operations

**Design Language:** v2-minimal (clean, monochrome, professional)

---

## Required Mockups

### Folder Organization

| # | File | Description | Priority |
|---|------|-------------|----------|
| 01 | `01-folder-view.html` | Main folder contents view with sidebar tree + card grid | P0 |
| 02 | `02-item-cards.html` | Table card vs Document card designs with type icons | P0 |
| 03 | `03-create-dropdown.html` | "New" button dropdown (Folder, Table, Document) | P0 |
| 04 | `04-move-dialog.html` | Move item dialog with folder tree picker | P1 |
| 05 | `05-breadcrumbs.html` | Breadcrumb navigation states | P1 |

### Agent Assignment & RAG

| # | File | Description | Priority |
|---|------|-------------|----------|
| 06 | `06-assignment-dialog.html` | Assign table/doc to agent with permission + RAG toggle | P0 |
| 07 | `07-rag-status-badges.html` | RAG status indicators (Disabled, Indexing, Active) | P0 |
| 08 | `08-agent-records-tab.html` | Agent modal Records tab with assigned items | P0 |
| 09 | `09-indexing-progress.html` | Indexing progress indicator states | P1 |

### Reference/Inspiration

| # | File | Description |
|---|------|-------------|
| -- | `_inspiration/` | Screenshots/references from Google Drive, Notion, etc. |

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
│ 📊  Stakeholder          │  ← Table icon
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
│ 📄  Resume               │  ← Document icon
│                          │
│ "Professional resume..." │  ← Description
│                          │
│ ~1,200 words             │  ← Metadata
│ Updated yesterday        │
└──────────────────────────┘
```

### RAG Status Badges

| State | Badge | Color |
|-------|-------|-------|
| Disabled | "No RAG" | Gray |
| Indexing | "Indexing..." | Yellow (animated) |
| Active | "RAG Active" | Green |
| Error | "Index Failed" | Red |

### Assignment Dialog

```
┌─────────────────────────────────────────────┐
│ Assign Data Source                     [X]  │
├─────────────────────────────────────────────┤
│                                             │
│ Select source:                              │
│ ┌─────────────────────────────────────────┐ │
│ │ 📊 Stakeholder Interviews (124 records) │ │
│ │ 📊 Product Roadmap (45 records)         │ │
│ │ 📄 Resume.md                            │ │
│ │ 📄 Company Research.md                  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Permission:                                 │
│ ○ Read-only  ● Read/Write                  │
│                                             │
│ ☑ Enable RAG indexing                      │
│   Agent can semantically search content     │
│                                             │
│              [Cancel]  [Assign]             │
└─────────────────────────────────────────────┘
```

---

## Design Questions to Resolve

| Question | Options | Notes |
|----------|---------|-------|
| Folder tree position? | Left sidebar vs inline tabs | Left sidebar matches Google Drive |
| Show folders and items mixed? | Mixed vs folders first | Folders first is cleaner |
| How to show RAG status in card? | Badge vs icon vs separate column | Badge on card footer |
| Search scope indicator? | Show "searching all folders" | Important for discoverability |
| Empty folder state? | Message + "Create" button | Helpful for new users |

---

## Related Mockups

- **Existing Records:** `_docs/UXD/Pages/records/2025-12-09-sheets-v2/`
- **Docs Editor:** `_docs/UXD/Pages/records/2025-12-10-docs-v1/`
- **RAG UXD (Roadmap):** `_docs/Product/ROADMAP/rag-integration/UXD/`
- **Records Consolidation UXD (Roadmap):** `_docs/Product/ROADMAP/records-consolidation/UXD/`

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
| 2025-12-12 | Initial UXD plan created | Claude |
