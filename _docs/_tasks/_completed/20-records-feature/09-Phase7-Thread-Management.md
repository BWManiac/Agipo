# Phase 7: Thread Management

**Status:** 📋 Planned
**Depends On:** Phase 6
**Started:** TBD
**Completed:** TBD

---

## Overview

### Goal

Add conversation thread management to the chat sidebar. Users can create new threads, switch between threads, rename threads, and delete threads. Threads are scoped per-table and persist across sessions.

After this phase, users can start new conversations, see their thread history, switch between past conversations, and manage thread lifecycle.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Thread scope | Per-table | Conversations are contextual to the data |
| Thread storage | Mastra memory | Consistent with workforce chat |
| Thread title | Auto-generated from first message | Matches workforce pattern |
| Thread list location | Below agent picker | Matches mockup flow |

### Pertinent Research

- **Mockup 01**: `01-table-with-chat.html` - Shows chat area with thread context
- **Pattern**: `workforce/.../ChatTab/hooks/useThreads.tsx` - Existing thread management

*Source: `_docs/UXD/Pages/records/2025-12-09-sheets-v2/`*

### Overall File Impact

#### Frontend / State

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/store/slices/threadsSlice.ts` | Create | threads list, activeThreadId, CRUD actions |
| `app/(pages)/records/store/index.ts` | Modify | Add threadsSlice to composition |
| `app/(pages)/records/store/types.ts` | Modify | Add ThreadsSlice to RecordsStore |

#### Frontend / Components

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/components/ChatSidebar/ThreadList.tsx` | Create | List of threads with selection |
| `app/(pages)/records/components/ChatSidebar/ChatHeader.tsx` | Create | Thread title, new thread button, options |
| `app/(pages)/records/components/ChatSidebar/index.tsx` | Modify | Add ThreadList and ChatHeader |

#### Backend / API

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/[tableId]/threads/route.ts` | Create | GET list, POST create thread |
| `app/api/records/[tableId]/threads/[threadId]/route.ts` | Create | GET/PATCH/DELETE single thread |

#### Backend / Services

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/[tableId]/threads/services/thread-service.ts` | Create | Thread CRUD using Mastra memory |

### Overall Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-7.1 | "New Conversation" button creates thread | Click button, new thread appears |
| AC-7.2 | Thread list shows all threads for table | Verify threads load |
| AC-7.3 | Each thread shows title and timestamp | Check thread item display |
| AC-7.4 | Clicking thread selects it | Click, verify active state |
| AC-7.5 | Selected thread highlighted in list | Visual distinction for active |
| AC-7.6 | Chat header shows thread title | Verify title displayed |
| AC-7.7 | Right-click thread shows context menu | Rename, delete options |
| AC-7.8 | Rename thread updates title | Rename, verify persists |
| AC-7.9 | Delete thread removes from list | Delete, verify gone |
| AC-7.10 | Auto-title from first message | Send message, title updates |
| AC-7.11 | Threads persist across page refresh | Refresh, threads still there |

### User Flows

#### Flow 1: New Conversation

```
1. User clicks "New Conversation" button
2. System creates thread with title "New Conversation"
3. Thread appears at top of thread list
4. Thread is automatically selected
5. Chat area shows empty state
6. User sends first message "Show me leads from today"
7. System auto-updates thread title to "Show me leads from today"
```

#### Flow 2: Switch Threads

```
1. User has multiple threads in list
2. User clicks on older thread "Analyze Q4 metrics"
3. System loads that thread's messages
4. Chat area shows previous conversation
5. Chat header shows "Analyze Q4 metrics"
```

#### Flow 3: Delete Thread

```
1. User right-clicks on thread
2. Context menu shows: Rename, Delete
3. User clicks "Delete"
4. Confirmation appears
5. User confirms
6. Thread removed from list
7. If was selected, system selects next thread or shows empty state
```

---

## Out of Scope

- Thread search → Future
- Thread archive → Future
- Thread sharing → Future
- Actual message display → Phase 8

---

## References

- **Mockup**: `01-table-with-chat.html` (chat area structure)
- **Pattern**: `workforce/.../ChatTab/hooks/useThreads.tsx`
- **API Pattern**: `workforce/[agentId]/threads/`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-09 | Initial creation | Claude |

---

**Last Updated:** 2025-12-09
