# Phase 4: Pagination

**Status:** 📋 Planned
**Depends On:** Phase 3
**Started:** TBD
**Completed:** TBD

---

## Overview

### Goal

Add pagination support to handle large tables efficiently. The grid should limit rows per page, show page navigation controls, and update the footer with current page info.

After this phase, users can navigate through large datasets page by page, see which page they're on, and the system only loads the current page's data for better performance.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Page size | 100 rows default | Balance between UX and performance |
| Pagination location | Footer | Standard placement, consistent with mockups |
| Data loading | Server-side | Essential for large tables |

### Pertinent Research

- **Mockup 01**: `01-table-with-chat.html` - Footer area shows row counts and status

*Source: `_docs/UXD/Pages/records/2025-12-09-sheets-v2/`*

### Overall File Impact

#### Frontend / State

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/store/slices/gridSlice.ts` | Modify | Add page, pageSize, totalRows state |

#### Frontend / Components

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/components/Pagination.tsx` | Create | Page navigation (prev/next, page numbers) |
| `app/(pages)/records/components/RecordsGrid.tsx` | Modify | Wire pagination to query params |

#### Frontend / Pages

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/[tableId]/page.tsx` | Modify | Add Pagination to footer area |

#### Backend / API

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/[tableId]/rows/query/route.ts` | Modify | Accept limit/offset params, return total count |

### Overall Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-4.1 | Tables with >100 rows show pagination controls | Add 150 rows, verify pagination appears |
| AC-4.2 | Page 1 shows first 100 rows | Verify rows 1-100 displayed |
| AC-4.3 | Clicking "Next" shows next page | Click next, verify rows 101-150 |
| AC-4.4 | Clicking "Previous" shows previous page | Click prev, verify return to page 1 |
| AC-4.5 | Current page number highlighted | Verify active page styling |
| AC-4.6 | Footer shows "Page X of Y" | Verify text updates |
| AC-4.7 | Pagination respects active filters | Filter + paginate, verify consistency |
| AC-4.8 | Tables with ≤100 rows hide pagination | Small table, no pagination controls |

### User Flows

#### Flow 1: Navigate Pages

```
1. User has table with 250 rows
2. System shows rows 1-100
3. Footer shows "Page 1 of 3" and pagination controls
4. User clicks "Next" button
5. Grid updates to show rows 101-200
6. Footer shows "Page 2 of 3"
7. User clicks page "3" directly
8. Grid shows rows 201-250
9. "Next" button disabled (on last page)
```

#### Flow 2: Filter with Pagination

```
1. User on page 2 of large table
2. User applies filter that reduces rows to 50
3. System resets to page 1
4. Pagination controls hidden (≤100 results)
5. User clears filter
6. All rows return, pagination controls reappear
```

---

## Out of Scope

- Custom page size selector → Future
- Infinite scroll alternative → Future
- Jump to page input → Future

---

## References

- **Mockup**: `01-table-with-chat.html` (footer area)
- **Related**: Phase 3 (gridSlice already created)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-09 | Initial creation | Claude |

---

**Last Updated:** 2025-12-09
