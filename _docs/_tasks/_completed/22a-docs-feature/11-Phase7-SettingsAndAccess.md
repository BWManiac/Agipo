# Phase 7: Settings & Access

**Status:** 📋 Planned  
**Depends On:** Phase 5 (Chat & Agent Integration)  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Add settings panel with access management and activity log. After this phase, users can:
- Manage agent access to documents
- View document activity log
- Configure document settings

This phase enables collaboration and access control.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Settings UI | Modal panel | Non-intrusive, matches Records pattern |
| Access Model | Agent-based | Simple, aligns with agent tools |
| Activity Log | Server-side | Reliable, can't be tampered with |

### Pertinent Research

- **Records Pattern**: Settings panel with access management
- **Activity Tracking**: Document changes, agent actions

*Source: `app/(pages)/records/components/SettingsPanel/`*

### Overall File Impact

#### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/dox/[docId]/access/route.ts` | Create | GET access info | A |
| `app/api/dox/[docId]/access/agents/route.ts` | Create | POST grant access | A |
| `app/api/dox/[docId]/access/agents/[agentId]/route.ts` | Create | PATCH update, DELETE revoke | A |
| `app/api/dox/[docId]/activity/route.ts` | Create | GET activity log | A |

#### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/dox/[docId]/components/SettingsPanel/index.tsx` | Create | Settings container | B |
| `app/(pages)/dox/[docId]/components/SettingsPanel/AccessTab.tsx` | Create | Agent access management | B |
| `app/(pages)/dox/[docId]/components/SettingsPanel/ActivityTab.tsx` | Create | Activity log | B |

#### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/dox/[docId]/store/slices/settingsSlice.ts` | Create | Settings state | B |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-7.1 | Settings panel opens | Click settings, verify panel opens | B |
| AC-7.2 | Access tab shows agents | Open access tab, verify agent list | B |
| AC-7.3 | Can grant agent access | Add agent, verify access granted | A |
| AC-7.4 | Can revoke agent access | Remove agent, verify access revoked | A |
| AC-7.5 | Activity log shows events | Open activity tab, verify log | B |
| AC-7.6 | Activity log filters work | Filter by user/agent, verify filtered | B |

### User Flows (Phase Level)

#### Flow 1: Grant Agent Access

```
1. User opens settings panel
2. User navigates to "Access" tab
3. User clicks "Add Agent"
4. User selects agent from list
5. User clicks "Grant Access"
6. Agent added to access list
```

#### Flow 2: View Activity Log

```
1. User opens settings panel
2. User navigates to "Activity" tab
3. System fetches activity log
4. User sees list of events
5. Each event shows: timestamp, actor, action
```

---

## Part A: Backend Access Management

### Goal

Build access control API for agent permissions.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/dox/[docId]/access/route.ts` | Create | GET access info | ~80 |
| `app/api/dox/[docId]/access/agents/route.ts` | Create | POST grant access | ~100 |
| `app/api/dox/[docId]/access/agents/[agentId]/route.ts` | Create | PATCH update, DELETE revoke | ~100 |
| `app/api/dox/[docId]/activity/route.ts` | Create | GET activity log | ~100 |

### Pseudocode

#### `app/api/dox/[docId]/access/route.ts`

```
GET /api/dox/[docId]/access
├── Authenticate user (Clerk)
├── Read _tables/dox/[docId]/access.json
│   └── { agents: [{ agentId, permissions, grantedAt, grantedBy }] }
└── Return: { agents: [...] }
```

#### `app/api/dox/[docId]/access/agents/route.ts`

```
POST /api/dox/[docId]/access/agents
├── Authenticate user (Clerk)
├── Parse body: { agentId, permissions? }
├── Read existing access.json
├── Add agent to access list
├── Write access.json
├── Log activity: "Agent access granted"
└── Return: { success: true }
```

#### `app/api/dox/[docId]/activity/route.ts`

```
GET /api/dox/[docId]/activity
├── Authenticate user (Clerk)
├── Read _tables/dox/[docId]/activity.json
│   └── { events: [{ timestamp, actor, action, details }] }
├── Filter by query params (actor, action, date)
└── Return: { events: [...] }
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-7.3 | Can grant agent access | Add agent, verify access granted |
| AC-7.4 | Can revoke agent access | Remove agent, verify access revoked |

### User Flows

#### Flow A.1: Grant Access

```
1. POST /api/dox/[docId]/access/agents
2. Body: { agentId: "agent-123" }
3. System reads access.json
4. System adds agent to list
5. System writes access.json
6. System logs activity
7. Response: { success: true }
```

---

## Part B: Frontend Settings UI

### Goal

Build settings panel with access management and activity log.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/dox/[docId]/components/SettingsPanel/index.tsx` | Create | Settings container | ~100 |
| `app/(pages)/dox/[docId]/components/SettingsPanel/AccessTab.tsx` | Create | Access management | ~150 |
| `app/(pages)/dox/[docId]/components/SettingsPanel/ActivityTab.tsx` | Create | Activity log | ~120 |
| `app/(pages)/dox/[docId]/store/slices/settingsSlice.ts` | Create | Settings state | ~120 |

### Pseudocode

#### `app/(pages)/dox/[docId]/components/SettingsPanel/index.tsx`

```
SettingsPanel
├── Render: Modal (Radix Dialog)
│   ├── Header: "Settings" + close button
│   ├── Tabs: Access, Activity
│   ├── Content: Tab content
│   │   ├── AccessTab
│   │   └── ActivityTab
│   └── Footer: Close button
├── Store: useDocsStore()
│   ├── settingsSlice.isOpen
│   └── settingsSlice.activeTab
└── Events:
    ├── Open panel → set isOpen = true
    └── Close panel → set isOpen = false
```

#### `app/(pages)/dox/[docId]/store/slices/settingsSlice.ts`

```
settingsSlice
├── State:
│   ├── isOpen: boolean
│   ├── activeTab: "access" | "activity"
│   ├── agents: AgentAccess[]
│   ├── activity: ActivityEntry[]
│   └── isLoading: boolean
├── Actions:
│   ├── openSettings()
│   ├── closeSettings()
│   ├── setActiveTab(tab)
│   ├── loadAccess(docId)
│   ├── grantAccess(docId, agentId)
│   ├── revokeAccess(docId, agentId)
│   └── loadActivity(docId)
└── Implementation:
    ├── grantAccess: POST /api/dox/[docId]/access/agents
    └── revokeAccess: DELETE /api/dox/[docId]/access/agents/[agentId]
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-7.1 | Settings panel opens | Click settings, verify panel opens |
| AC-7.2 | Access tab shows agents | Open access tab, verify agent list |
| AC-7.5 | Activity log shows events | Open activity tab, verify log |
| AC-7.6 | Activity log filters work | Filter by user/agent, verify filtered |

### User Flows

#### Flow B.1: Manage Access

```
1. User clicks "Settings" button
2. Settings panel opens
3. User navigates to "Access" tab
4. System loads agent list
5. User clicks "Add Agent"
6. User selects agent
7. settingsSlice.grantAccess() called
8. Agent added to list
```

---

## Out of Scope

What is explicitly NOT included in this phase:

- **User access management** → Future consideration (v1 is user-owned)
- **Permission levels** → Future consideration (v1 is read/write)
- **Access expiration** → Future consideration

---

## References

- **Pattern Source**: `app/(pages)/records/components/SettingsPanel/` - Settings UI pattern
- **Architecture**: `03-Technical-Architecture.md` - Access management

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | AI Assistant |

---

**Last Updated:** 2025-12-10
