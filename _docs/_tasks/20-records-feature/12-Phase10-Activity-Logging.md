# Phase 10: Activity Logging

**Status:** 📋 Planned
**Depends On:** Phase 9
**Started:** TBD
**Completed:** TBD

---

## Overview

### Goal

Add activity logging to track who modified table data and when. The Activity tab in settings shows a timeline of changes. Mutations (insert/update/delete) automatically log the actor.

After this phase, users can see a history of all changes to the table, know which agent or user made each change, and track data provenance.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Activity storage | Per-table JSON file | Simple, fits existing data model |
| Actor types | User, Agent, Workflow | Cover all mutation sources |
| Log retention | Last 100 entries | Prevent unbounded growth |
| Display | Reverse chronological | Most recent first |

### Pertinent Research

- **Mockup 08**: `08-table-access-panel.html` - Shows Recent Activity section with actor avatars and timestamps

*Source: `_docs/UXD/Pages/records/2025-12-09-sheets-v2/`*

### Overall File Impact

#### Frontend / State

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/store/slices/accessSlice.ts` | Modify | Add activityLog, fetchActivity action |

#### Frontend / Components

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/components/SettingsPanel/ActivityTab.tsx` | Create | Activity timeline display |
| `app/(pages)/records/components/SettingsPanel/index.tsx` | Modify | Wire up Activity tab |

#### Backend / API

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/[tableId]/activity/route.ts` | Create | GET activity log |

#### Backend / Services

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/services/activity.ts` | Create | Activity logging and retrieval |
| `app/api/records/services/mutation/insert.ts` | Modify | Log activity with actor |
| `app/api/records/services/mutation/update.ts` | Modify | Log activity with actor |
| `app/api/records/services/mutation/delete.ts` | Modify | Log activity with actor |

### Overall Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-10.1 | Activity tab shows activity timeline | Click tab, see entries |
| AC-10.2 | Each entry shows actor avatar | Verify avatar display |
| AC-10.3 | Each entry shows actor name | Verify name display |
| AC-10.4 | Each entry shows action type | "added", "updated", "deleted" |
| AC-10.5 | Each entry shows row count affected | "added 3 rows" |
| AC-10.6 | Each entry shows relative timestamp | "2 hours ago" |
| AC-10.7 | User mutations logged with "You" | Insert as user, check log |
| AC-10.8 | Agent mutations logged with agent name | Agent inserts, check log |
| AC-10.9 | Workflow mutations logged with workflow name | Workflow updates, check log |
| AC-10.10 | "View all" link expands full history | Click link, see more |
| AC-10.11 | Recent Activity section in Access tab | Summary of last few entries |

### User Flows

#### Flow 1: View Activity

```
1. User opens Settings panel
2. User clicks "Activity" tab
3. System shows activity timeline:
   - "Mira Patel added 3 rows" - 2 hours ago
   - "You updated status on 2 rows" - 5 hours ago
   - "Noah Reyes deleted 1 row" - 1 day ago
   - "Lead Enrichment updated 12 rows" - 2 days ago
4. Each entry has actor avatar
5. Agent entries show agent emoji icon
6. Workflow entries show lightning bolt icon
```

#### Flow 2: Activity Auto-Logging

```
1. User inserts a new row manually
2. System logs: { actor: { type: "user", name: "You" }, action: "insert", rowCount: 1 }
3. Agent "Mira" adds 5 rows via chat
4. System logs: { actor: { type: "agent", id: "...", name: "Mira Patel" }, action: "insert", rowCount: 5 }
5. User opens Activity tab
6. Both entries visible with correct attribution
```

---

## Out of Scope

- Activity search/filter → Future
- Export activity log → Future
- Detailed change diffs → Future
- Real-time activity updates → Future

---

## References

- **Mockup**: `08-table-access-panel.html` (Recent Activity section)
- **Related**: Phase 9 (Settings panel structure)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-09 | Initial creation | Claude |

---

**Last Updated:** 2025-12-09
