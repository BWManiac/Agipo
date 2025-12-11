# Phase 9: Settings Panel

**Status:** 📋 Planned
**Depends On:** Phase 8
**Started:** TBD
**Completed:** TBD

---

## Overview

### Goal

Add the table settings panel for managing agent access and table configuration. The panel slides in from the right, overlaying the chat sidebar, and contains tabs for Access, Activity, and Schema.

After this phase, users can open settings, see which agents have access to the table, grant/revoke access, and configure access permissions (read-only vs read-write).

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Panel position | Right overlay | Matches mockup, doesn't disrupt grid |
| Access model | Agent-based permissions | Agents need explicit table access |
| Permission levels | Read, Read & Write | Simple, covers main use cases |

### Pertinent Research

- **Mockup 08**: `08-table-access-panel.html` - Shows settings panel with Access tab, agent list, permissions

*Source: `_docs/UXD/Pages/records/2025-12-09-sheets-v2/`*

### Overall File Impact

#### Frontend / State

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/store/slices/accessSlice.ts` | Create | accessList, loading states |
| `app/(pages)/records/store/slices/uiSlice.ts` | Modify | Add settingsPanelOpen, settingsPanelTab |
| `app/(pages)/records/store/index.ts` | Modify | Add accessSlice to composition |
| `app/(pages)/records/store/types.ts` | Modify | Add AccessSlice to RecordsStore |

#### Frontend / Components

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/components/SettingsPanel/index.tsx` | Create | Panel container with tabs |
| `app/(pages)/records/components/SettingsPanel/AccessTab.tsx` | Create | Agent access list and controls |
| `app/(pages)/records/components/TableHeader.tsx` | Modify | Add Settings button |

#### Frontend / Pages

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/[tableId]/page.tsx` | Modify | Add SettingsPanel to layout |

#### Backend / API

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/[tableId]/access/route.ts` | Create | GET access info |
| `app/api/records/[tableId]/access/agents/route.ts` | Create | POST grant access |
| `app/api/records/[tableId]/access/agents/[agentId]/route.ts` | Create | DELETE revoke, PATCH update |

#### Backend / Services

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/services/access.ts` | Create | Access CRUD operations |

### Overall Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-9.1 | Settings button visible in table header | Check header actions |
| AC-9.2 | Clicking Settings opens panel | Click, panel slides in |
| AC-9.3 | Panel has Access, Activity, Schema tabs | Verify tabs present |
| AC-9.4 | Access tab shows owner section | See "You - Full access" |
| AC-9.5 | Access tab shows agents with access | See agent list |
| AC-9.6 | Each agent shows avatar, name, role | Check agent display |
| AC-9.7 | Permission dropdown shows Read/Read & Write | Click dropdown |
| AC-9.8 | Changing permission updates immediately | Select option, verify |
| AC-9.9 | "Add agent access" button opens picker | Click button |
| AC-9.10 | Selecting agent grants access | Pick agent, verify added |
| AC-9.11 | Remove option revokes access | Select Remove, agent gone |
| AC-9.12 | Close button dismisses panel | Click X, panel closes |
| AC-9.13 | Grid dimmed when panel open | Verify visual overlay |

### User Flows

#### Flow 1: Grant Agent Access

```
1. User clicks Settings button in header
2. Settings panel slides in from right
3. Access tab shows:
   - Owner section (You - Full access)
   - Agents section (existing agents)
4. User clicks "Add agent access"
5. Agent picker dropdown appears
6. User selects "Elena Park"
7. Elena added to agents list with "Read & Write" default
8. Access persisted to backend
```

#### Flow 2: Change Permission

```
1. User sees agent "Alex Kim" with "Read & Write"
2. User clicks permission dropdown
3. Options: Read & Write, Read only, Remove
4. User selects "Read only"
5. Dropdown closes
6. Permission updated immediately
7. Alex can now only read, not modify
```

#### Flow 3: Revoke Access

```
1. User sees agent "Noah Reyes" in list
2. User clicks permission dropdown
3. User selects "Remove"
4. Confirmation dialog appears
5. User confirms
6. Noah removed from list
7. Noah can no longer access this table
```

---

## Out of Scope

- Workflow access (shown in mockup) → Future
- Schema tab content → Future
- Danger zone (delete table) → Future
- Activity tab → Phase 10

---

## References

- **Mockup**: `08-table-access-panel.html`
- **Store Pattern**: `_docs/Engineering/Architecture/Store-Slice-Architecture.md`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-09 | Initial creation | Claude |

---

**Last Updated:** 2025-12-09
