# Phase 3: Sort & Filter

**Status:** 📋 Planned
**Depends On:** Phase 2
**Started:** TBD
**Completed:** TBD

---

## Overview

### Goal

Add column sorting and filtering to the data grid. Users can click column headers to sort, and use a dropdown menu to filter by value or text. The grid should show visual indicators for active sort direction and filters.

After this phase, users can sort any column ascending/descending, filter rows by specific values or text search, see filter badges in the header, and clear filters easily.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Sort persistence | gridSlice state | Survives navigation within session |
| Filter UI | Column header dropdown | Matches mockup, keeps filters contextual |
| Filter indicators | Badge in header + column highlight | Clear visual feedback |

### Pertinent Research

- **Mockup 04**: `04-column-filter.html` - Shows column menu with sort options, filter by value checkboxes, text search, and active filter badge

*Source: `_docs/UXD/Pages/records/2025-12-09-sheets-v2/`*

### Overall File Impact

#### Frontend / State

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/store/index.ts` | Create | Store composition |
| `app/(pages)/records/store/types.ts` | Create | RecordsStore type |
| `app/(pages)/records/store/slices/gridSlice.ts` | Create | Sort, filter, selection state |

#### Frontend / Components

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/components/ColumnMenu/index.tsx` | Create | Column header dropdown wrapper |
| `app/(pages)/records/components/ColumnMenu/SortOptions.tsx` | Create | Sort A→Z, Z→A buttons |
| `app/(pages)/records/components/ColumnMenu/FilterOptions.tsx` | Create | Filter by value checkboxes, text search |
| `app/(pages)/records/components/RecordsGrid.tsx` | Modify | Wire to gridSlice, add column menu trigger |
| `app/(pages)/records/components/TableHeader.tsx` | Modify | Add filter badge count, clear filters button |

#### Backend / API

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/[tableId]/rows/query/route.ts` | Modify | Accept sort/filter params |

#### Backend / Services

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/services/query.ts` | Modify | Apply Polars sort/filter operations |

### Overall Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-3.1 | Clicking column header shows menu | Click header, menu appears |
| AC-3.2 | "Sort A→Z" sorts column ascending | Click sort, verify order |
| AC-3.3 | "Sort Z→A" sorts column descending | Click sort, verify order |
| AC-3.4 | Sort indicator (↑/↓) shows on sorted column | Sort column, check indicator |
| AC-3.5 | Filter by value shows unique values with counts | Open filter, verify values |
| AC-3.6 | Checking values filters rows | Select values, verify rows |
| AC-3.7 | Text contains filters by substring | Type text, verify filtering |
| AC-3.8 | Filter badge shows count in header | Apply filter, see "1 filter" badge |
| AC-3.9 | Clicking X on badge clears all filters | Click X, verify cleared |
| AC-3.10 | Filtered column header highlighted | Apply filter, column header blue |
| AC-3.11 | Footer shows "Showing X of Y rows" when filtered | Filter, check footer text |

### User Flows

#### Flow 1: Sort Column

```
1. User clicks column header "Status"
2. Column menu dropdown appears
3. User clicks "Sort A → Z"
4. Menu closes
5. Grid re-renders with rows sorted
6. Column header shows ↑ indicator
7. Clicking again shows menu
8. User clicks "Sort Z → A"
9. Grid re-renders, indicator changes to ↓
```

#### Flow 2: Filter by Value

```
1. User clicks column header "Status"
2. Column menu shows unique values:
   - new (8)
   - contacted (10)
   - qualified (4)
   - converted (2)
3. User unchecks "qualified" and "converted"
4. User clicks "Apply"
5. Grid shows only rows with "new" or "contacted"
6. Header shows "1 filter" badge
7. Column header has blue background
8. Footer shows "Showing 18 of 24 rows"
```

---

## Out of Scope

- Saved filter presets → Future
- Complex filter logic (AND/OR) → Future
- Filter by date range → Future
- Multiple column sort → Future

---

## References

- **Mockup**: `04-column-filter.html`
- **Store Pattern**: `_docs/Engineering/Architecture/Store-Slice-Architecture.md`
- **API**: `POST /api/records/[tableId]/rows/query`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-09 | Initial creation | Claude |

---

**Last Updated:** 2025-12-09
