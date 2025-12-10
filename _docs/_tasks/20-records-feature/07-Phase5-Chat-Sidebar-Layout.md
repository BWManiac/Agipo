# Phase 5: Chat Sidebar Layout

**Status:** 📋 Planned
**Depends On:** Phase 4
**Started:** TBD
**Completed:** TBD

---

## Overview

### Goal

Add the chat sidebar shell to the table view. This phase establishes the sidebar container, collapse/expand functionality, and basic layout without the actual chat features. The sidebar should have a fixed width and be resizable.

After this phase, users see a sidebar on the right side of the table view, can collapse it to a thin strip, and can expand it back. The main grid area adjusts accordingly.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Sidebar position | Right side | Matches mockup, doesn't block table actions |
| Default width | 320px (w-80) | Matches mockup, comfortable for chat |
| Collapsed width | 48px (w-12) | Room for icon + agent avatar |
| Resize | CSS resize handle | Simple, native feel |

### Pertinent Research

- **Mockup 01**: `01-table-with-chat.html` - Shows expanded sidebar layout
- **Mockup 04**: `04-column-filter.html` - Shows collapsed sidebar (icon only)

*Source: `_docs/UXD/Pages/records/2025-12-09-sheets-v2/`*

### Overall File Impact

#### Frontend / State

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/store/slices/uiSlice.ts` | Create | sidebarOpen, sidebarWidth state |
| `app/(pages)/records/store/index.ts` | Modify | Add uiSlice to composition |
| `app/(pages)/records/store/types.ts` | Modify | Add UiSlice to RecordsStore |

#### Frontend / Components

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/components/ChatSidebar/index.tsx` | Create | Main sidebar container with collapse/expand |

#### Frontend / Pages

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/[tableId]/page.tsx` | Modify | Add ChatSidebar to layout, flex container |

### Overall Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-5.1 | Sidebar visible on table page | Navigate to table, sidebar appears |
| AC-5.2 | Sidebar has 320px width by default | Measure/inspect width |
| AC-5.3 | Collapse button shrinks sidebar to 48px | Click collapse, verify width |
| AC-5.4 | Expand button restores sidebar to full width | Click expand, verify width |
| AC-5.5 | Grid area expands when sidebar collapses | Verify grid takes more space |
| AC-5.6 | Collapsed sidebar shows expand icon + agent avatar | Inspect collapsed state |
| AC-5.7 | Sidebar state persists within session | Collapse, navigate away, return |

### User Flows

#### Flow 1: Toggle Sidebar

```
1. User on table view with sidebar expanded
2. User clicks collapse button (left arrow or X)
3. Sidebar animates to collapsed state (48px)
4. Collapsed state shows:
   - Chat icon button
   - Current agent avatar (if any)
5. User clicks expand button
6. Sidebar animates back to full width
```

---

## Out of Scope

- Agent picker → Phase 6
- Thread list → Phase 7
- Chat messages → Phase 8
- Actual chat functionality → Phase 8

---

## References

- **Mockup**: `01-table-with-chat.html` (sidebar structure)
- **Mockup**: `04-column-filter.html` (collapsed sidebar)
- **Store Pattern**: `_docs/Engineering/Architecture/Store-Slice-Architecture.md`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-09 | Initial creation | Claude |

---

**Last Updated:** 2025-12-09
