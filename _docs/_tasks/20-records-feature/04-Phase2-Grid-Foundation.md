# Phase 2: Grid Foundation

**Status:** 📋 Planned
**Depends On:** Phase 1
**Started:** TBD
**Completed:** TBD

---

## Overview

### Goal

Build the core table view page with the data grid. This phase establishes the table header (breadcrumb, title, row count, action buttons) and the basic RecordsGrid component that displays rows and columns. The grid should support inline editing of cells.

After this phase, users can navigate to a specific table, see the header with table name and row count, view all rows in a spreadsheet-like grid, and edit cell values inline.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Grid library | TanStack Table v8 | Already used in project, headless for custom styling |
| Cell editing | Inline inputs | Matches mockup, feels like spreadsheet |
| Row selection | Checkbox column | Standard pattern for bulk actions |

### Pertinent Research

- **Mockup 01**: `01-table-with-chat.html` - Shows full grid layout with header, columns, and editable cells
- **Mockup 03**: `03-empty-table.html` - Shows empty state for new tables

*Source: `_docs/UXD/Pages/records/2025-12-09-sheets-v2/`*

### Overall File Impact

#### Frontend / Pages

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/[tableId]/page.tsx` | Modify | Add TableHeader, restructure layout for future sidebar |

#### Frontend / Components

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/components/TableHeader.tsx` | Create | Breadcrumb, title, row count badge, action buttons |
| `app/(pages)/records/components/RecordsGrid.tsx` | Modify | Wire to TanStack Table, add row selection, inline editing |

### Overall Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-2.1 | Table header shows breadcrumb "Records / [Table Name]" | Navigate to table, verify breadcrumb |
| AC-2.2 | Table header shows row count badge | Verify badge updates with row count |
| AC-2.3 | "Add Column" and "Add Row" buttons visible in header | Check buttons present |
| AC-2.4 | Grid displays all columns from schema | Create table with columns, verify all show |
| AC-2.5 | Grid displays all rows from table | Add rows, verify all display |
| AC-2.6 | Clicking cell makes it editable | Click cell, verify input appears |
| AC-2.7 | Editing cell and blurring saves value | Edit, blur, refresh, verify persisted |
| AC-2.8 | Row selection checkbox in first column | Verify checkbox column exists |
| AC-2.9 | Selecting rows updates footer count | Select rows, check "X selected" |

### User Flows

#### Flow 1: View Table

```
1. User clicks table card on catalog (from Phase 1)
2. System navigates to /records/[tableId]
3. System shows:
   - TableHeader with breadcrumb, title, row count
   - RecordsGrid with all columns and rows
   - Footer with row count and save status
4. User sees their data in spreadsheet format
```

#### Flow 2: Edit Cell

```
1. User clicks on a cell value
2. Cell becomes an input field
3. User types new value
4. User clicks outside (blur) or presses Enter
5. System saves the update
6. Cell returns to display mode with new value
```

---

## Out of Scope

- Sorting columns → Phase 3
- Filtering columns → Phase 3
- Pagination → Phase 4
- Chat sidebar → Phase 5+
- Column menu dropdown → Phase 3
- Add Column/Add Row functionality → Future (buttons present but not wired)

---

## References

- **Mockup**: `01-table-with-chat.html` (grid portion only)
- **Existing Code**: `app/(pages)/records/components/RecordsGrid.tsx`
- **API**: `GET /api/records/[tableId]/rows/query`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-09 | Initial creation | Claude |

---

**Last Updated:** 2025-12-09
