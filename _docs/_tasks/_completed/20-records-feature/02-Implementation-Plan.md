# Task 20: Records Feature — Implementation Plan

**Status:** Planning
**Date:** December 9, 2025
**Purpose:** Detailed implementation plan with file impact analysis, using the established store slice pattern.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Decision: Store Slices over Hooks](#2-architecture-decision-store-slices-over-hooks)
3. [Store Architecture](#3-store-architecture)
4. [File Impact Analysis](#4-file-impact-analysis)
5. [Phase Breakdown](#5-phase-breakdown)
6. [Detailed Slice Specifications](#6-detailed-slice-specifications)
7. [Dependency Graph](#7-dependency-graph)
8. [Risk Assessment](#8-risk-assessment)

---

## 1. Executive Summary

### Scope

Transform Records from a basic data grid into a "Sheets-like" product with:
- Chat sidebar integrated with workforce agents
- Agent tools for table operations (`sys_table_*`)
- Enhanced grid with sorting, filtering, pagination
- Access management and activity logging

### Effort Estimate

| Phase | Focus | New Files | Modified Files | Complexity |
|-------|-------|-----------|----------------|------------|
| Phase 1 | Agent Tools | 6 | 2 | Medium |
| Phase 2 | Store Foundation + Chat | 15 | 3 | High |
| Phase 3 | Grid Enhancements | 6 | 2 | Medium |
| Phase 4 | Access & Activity | 10 | 3 | Medium |
| **Total** | | **37** | **10** | |

---

## 2. Architecture Decision: Store Slices over Hooks

### Decision

**Use Zustand store slices instead of custom hooks for all state management.**

### Rationale

Following established patterns in:
- `app/(pages)/workflows/editor/store/` (10 slices)
- `app/(pages)/workforce/components/agent-modal/store/` (3 slices)

### Why Not Hooks?

The current Records implementation uses `useRecords.ts` with React Query hooks. While this works for simple CRUD, it doesn't scale for complex state like:

| Concern | Hooks Approach | Store Slice Approach |
|---------|----------------|---------------------|
| Chat messages | Local state in component | `chatSlice.messages` |
| Thread selection | useState + prop drilling | `chatSlice.activeThreadId` |
| Grid sort/filter | URL params or local state | `gridSlice.sortColumn`, `gridSlice.filters` |
| Sidebar open state | useState per component | `uiSlice.sidebarOpen` |
| Cross-component coordination | Context or prop drilling | Direct store access via `get()` |

### Migration Strategy

1. **Keep existing `useRecords.ts`** — React Query hooks for server state (tables, rows)
2. **Add `useRecordsStore`** — Zustand for UI/client state (chat, grid, sidebar)
3. **Slices call services** — Store actions make API calls, update state

This hybrid approach matches how `useAgentModalStore` works alongside React Query in the Workforce feature.

---

## 3. Store Architecture

### Store Composition

```typescript
// app/(pages)/records/store/index.ts

import { create } from "zustand";
import { createUiSlice } from "./slices/uiSlice";
import { createChatSlice } from "./slices/chatSlice";
import { createThreadsSlice } from "./slices/threadsSlice";
import { createGridSlice } from "./slices/gridSlice";
import { createAgentsSlice } from "./slices/agentsSlice";
import { createAccessSlice } from "./slices/accessSlice";
import type { RecordsStore } from "./types";

export const useRecordsStore = create<RecordsStore>()(
  (...args) => ({
    ...createUiSlice(...args),
    ...createChatSlice(...args),
    ...createThreadsSlice(...args),
    ...createGridSlice(...args),
    ...createAgentsSlice(...args),
    ...createAccessSlice(...args),
  })
);
```

### Type Composition

```typescript
// app/(pages)/records/store/types.ts

import type { UiSlice } from "./slices/uiSlice";
import type { ChatSlice } from "./slices/chatSlice";
import type { ThreadsSlice } from "./slices/threadsSlice";
import type { GridSlice } from "./slices/gridSlice";
import type { AgentsSlice } from "./slices/agentsSlice";
import type { AccessSlice } from "./slices/accessSlice";

export type RecordsStore = UiSlice &
  ChatSlice &
  ThreadsSlice &
  GridSlice &
  AgentsSlice &
  AccessSlice;
```

### Slice Responsibilities

| Slice | Responsibility | State Examples |
|-------|----------------|----------------|
| `uiSlice` | Layout, views, modals | `sidebarOpen`, `sidebarWidth`, `activeView`, `settingsPanelOpen` |
| `chatSlice` | Messages, streaming, sending | `messages`, `isStreaming`, `isLoadingMessages` |
| `threadsSlice` | Thread CRUD, selection | `threads`, `activeThreadId`, `isLoadingThreads` |
| `gridSlice` | Sort, filter, selection, pagination | `sortColumn`, `sortDirection`, `filters`, `selectedRowIds`, `page` |
| `agentsSlice` | Available agents, selection | `agents`, `selectedAgentId`, `isLoadingAgents` |
| `accessSlice` | Access control, activity log | `accessList`, `activityLog`, `isLoadingAccess` |

---

## 4. File Impact Analysis

### Legend

| Symbol | Meaning |
|--------|---------|
| 🆕 | New file to create |
| ✏️ | Existing file to modify |
| 📋 | Pattern to follow from existing code |

---

### 4.1 Store Files (NEW)

```
app/(pages)/records/store/
├── index.ts                           # 🆕 Store composition
├── types.ts                           # 🆕 Combined store type
└── slices/
    ├── uiSlice.ts                     # 🆕 UI state
    ├── chatSlice.ts                   # 🆕 Chat messages & streaming
    ├── threadsSlice.ts                # 🆕 Thread management
    ├── gridSlice.ts                   # 🆕 Sort/filter/selection
    ├── agentsSlice.ts                 # 🆕 Agent fetching & selection
    └── accessSlice.ts                 # 🆕 Access & activity
```

**Pattern Source:** `workforce/components/agent-modal/store/`

| File | LOC Est. | Complexity | Dependencies |
|------|----------|------------|--------------|
| `index.ts` | 30 | Low | All slices |
| `types.ts` | 20 | Low | All slice types |
| `uiSlice.ts` | 80 | Low | None |
| `chatSlice.ts` | 150 | High | `@ai-sdk/react`, threads API |
| `threadsSlice.ts` | 180 | High | Threads API |
| `gridSlice.ts` | 120 | Medium | None (pure state) |
| `agentsSlice.ts` | 80 | Medium | Workforce API |
| `accessSlice.ts` | 120 | Medium | Access API |

---

### 4.2 Frontend Components

#### Pages

| File | Status | Impact | Changes |
|------|--------|--------|---------|
| `app/(pages)/records/page.tsx` | ✏️ | Low | Wrap with store provider if needed |
| `app/(pages)/records/[tableId]/page.tsx` | ✏️ | **High** | Add ChatSidebar, use store, layout restructure |

#### Components — Existing

| File | Status | Impact | Changes |
|------|--------|--------|---------|
| `app/(pages)/records/components/RecordsGrid.tsx` | ✏️ | **High** | Wire to gridSlice, add column menu, sort indicators, pagination |

#### Components — New: Chat Sidebar

```
app/(pages)/records/components/ChatSidebar/
├── index.tsx                          # 🆕 Main sidebar wrapper
├── ChatArea.tsx                       # 🆕 Messages + input
├── AgentPicker.tsx                    # 🆕 Agent dropdown
├── ThreadList.tsx                     # 🆕 Thread sidebar
└── ChatHeader.tsx                     # 🆕 Thread title + controls
```

**Pattern Source:** `workforce/.../ChatTab/components/`

| File | LOC Est. | Complexity | Store Slices Used |
|------|----------|------------|-------------------|
| `index.tsx` | 100 | Medium | `uiSlice`, `chatSlice`, `threadsSlice`, `agentsSlice` |
| `ChatArea.tsx` | 150 | High | `chatSlice` |
| `AgentPicker.tsx` | 80 | Medium | `agentsSlice` |
| `ThreadList.tsx` | 100 | Medium | `threadsSlice` |
| `ChatHeader.tsx` | 60 | Low | `threadsSlice` |

#### Components — New: Grid Enhancements

```
app/(pages)/records/components/
├── ColumnMenu/
│   ├── index.tsx                      # 🆕 Dropdown wrapper
│   ├── SortOptions.tsx                # 🆕 Sort buttons
│   └── FilterOptions.tsx              # 🆕 Filter input
├── TableHeader.tsx                    # 🆕 Title + controls
├── Pagination.tsx                     # 🆕 Page navigation
└── SettingsPanel/
    ├── index.tsx                      # 🆕 Settings sidebar
    ├── AccessTab.tsx                  # 🆕 Access management
    └── ActivityTab.tsx                # 🆕 Activity log
```

| File | LOC Est. | Complexity | Store Slices Used |
|------|----------|------------|-------------------|
| `ColumnMenu/index.tsx` | 80 | Medium | `gridSlice` |
| `ColumnMenu/SortOptions.tsx` | 50 | Low | `gridSlice` |
| `ColumnMenu/FilterOptions.tsx` | 100 | Medium | `gridSlice` |
| `TableHeader.tsx` | 60 | Low | `uiSlice` |
| `Pagination.tsx` | 80 | Low | `gridSlice` |
| `SettingsPanel/index.tsx` | 80 | Medium | `uiSlice`, `accessSlice` |
| `SettingsPanel/AccessTab.tsx` | 120 | Medium | `accessSlice` |
| `SettingsPanel/ActivityTab.tsx` | 100 | Medium | `accessSlice` |

---

### 4.3 Backend API Routes

#### Existing Routes (Modify)

| File | Status | Impact | Changes |
|------|--------|--------|---------|
| `app/api/records/[tableId]/rows/query/route.ts` | ✏️ | Medium | Add sort/filter params |
| `app/api/records/[tableId]/schema/route.ts` | ✏️ | Low | Return access field |

#### New Routes: Chat

```
app/api/records/[tableId]/
├── chat/
│   ├── route.ts                       # 🆕 POST - Streaming chat
│   └── services/
│       ├── chat-service.ts            # 🆕 Agent + tools builder
│       └── table-context.ts           # 🆕 Schema + sample rows
└── threads/
    ├── route.ts                       # 🆕 GET/POST threads
    ├── [threadId]/route.ts            # 🆕 GET/PATCH/DELETE thread
    └── services/
        └── thread-service.ts          # 🆕 Thread CRUD logic
```

**Pattern Source:** `workforce/[agentId]/chat/` and `workforce/[agentId]/threads/`

| File | LOC Est. | Complexity | Dependencies |
|------|----------|------------|--------------|
| `chat/route.ts` | 120 | High | Mastra, AI SDK, tools |
| `chat/services/chat-service.ts` | 150 | High | Agent config, tool injection |
| `chat/services/table-context.ts` | 60 | Low | Records services |
| `threads/route.ts` | 80 | Medium | Mastra memory |
| `threads/[threadId]/route.ts` | 100 | Medium | Mastra memory |
| `threads/services/thread-service.ts` | 150 | Medium | Mastra memory |

#### New Routes: Access & Activity

```
app/api/records/[tableId]/
├── access/
│   ├── route.ts                       # 🆕 GET access info
│   └── agents/
│       ├── route.ts                   # 🆕 POST grant access
│       └── [agentId]/route.ts         # 🆕 DELETE revoke access
└── activity/
    └── route.ts                       # 🆕 GET activity log
```

| File | LOC Est. | Complexity | Dependencies |
|------|----------|------------|--------------|
| `access/route.ts` | 60 | Low | Access service |
| `access/agents/route.ts` | 50 | Low | Access service |
| `access/agents/[agentId]/route.ts` | 40 | Low | Access service |
| `activity/route.ts` | 50 | Low | Activity service |

---

### 4.4 Backend Services

#### Existing Services (Modify)

| File | Status | Impact | Changes |
|------|--------|--------|---------|
| `app/api/records/services/query.ts` | ✏️ | Medium | Enhanced Polars sort/filter |
| `app/api/records/services/mutation/insert.ts` | ✏️ | Low | Actor attribution |
| `app/api/records/services/mutation/update.ts` | ✏️ | Low | Actor attribution |
| `app/api/records/services/mutation/delete.ts` | ✏️ | Low | Actor attribution |
| `app/api/records/services/index.ts` | ✏️ | Low | Export new services |

#### New Services

```
app/api/records/services/
├── access.ts                          # 🆕 Read/write access config
└── activity.ts                        # 🆕 Activity log management
```

| File | LOC Est. | Complexity | Dependencies |
|------|----------|------------|--------------|
| `access.ts` | 100 | Medium | File I/O |
| `activity.ts` | 80 | Low | File I/O |

---

### 4.5 Agent Tools

```
app/api/tools/services/
├── sys-table-schema.ts                # 🆕 Get table schema
├── sys-table-read.ts                  # 🆕 Query rows
├── sys-table-write.ts                 # 🆕 Insert row
├── sys-table-update.ts                # 🆕 Update row
├── sys-table-delete.ts                # 🆕 Delete row
└── index.ts                           # ✏️ Register new tools
```

| File | LOC Est. | Complexity | Dependencies |
|------|----------|------------|--------------|
| `sys-table-schema.ts` | 40 | Low | Records schema service |
| `sys-table-read.ts` | 60 | Medium | Records query service |
| `sys-table-write.ts` | 50 | Medium | Records insert service |
| `sys-table-update.ts` | 50 | Medium | Records update service |
| `sys-table-delete.ts` | 40 | Low | Records delete service |

---

### 4.6 File Count Summary

| Category | New | Modified | Total |
|----------|-----|----------|-------|
| Store | 8 | 0 | 8 |
| Frontend Pages | 0 | 2 | 2 |
| Frontend Components | 13 | 1 | 14 |
| Backend Routes | 9 | 2 | 11 |
| Backend Services | 2 | 5 | 7 |
| Agent Tools | 5 | 1 | 6 |
| **Total** | **37** | **11** | **48** |

---

## 5. Phase Breakdown

### Phase 1: Agent Tools (Foundation)

**Goal:** Create the tools that allow agents to interact with tables.

**Why first:** This is the foundation. Without tools, chat integration is meaningless.

#### Files to Create

| File | Description |
|------|-------------|
| `app/api/tools/services/sys-table-schema.ts` | Returns table schema and columns |
| `app/api/tools/services/sys-table-read.ts` | Queries rows with filter/sort |
| `app/api/tools/services/sys-table-write.ts` | Inserts new row |
| `app/api/tools/services/sys-table-update.ts` | Updates existing row |
| `app/api/tools/services/sys-table-delete.ts` | Deletes row |

#### Files to Modify

| File | Changes |
|------|---------|
| `app/api/tools/services/index.ts` | Register `sys_table_*` tools |
| `app/api/records/services/query.ts` | Add filter operators for tool use |

#### Acceptance Criteria

- [ ] `sys_table_schema` returns column names, types, and constraints
- [ ] `sys_table_read` supports: `eq`, `neq`, `gt`, `lt`, `gte`, `lte`, `contains`
- [ ] `sys_table_read` supports: `sort`, `limit`, `offset`
- [ ] `sys_table_write` validates against schema, returns row ID
- [ ] `sys_table_update` validates against schema, handles partial updates
- [ ] `sys_table_delete` handles non-existent row gracefully
- [ ] All tools return structured errors for agent feedback

#### Test Plan

1. Create test table via API
2. Call each tool via REST endpoint
3. Verify tool via workforce agent chat (manual)

---

### Phase 2: Store Foundation + Chat Integration

**Goal:** Create store architecture and chat sidebar.

**Why second:** Core feature that enables agent-table interaction.

#### Files to Create — Store

| File | Description |
|------|-------------|
| `store/index.ts` | Store composition with `create()` |
| `store/types.ts` | `RecordsStore` type combining all slices |
| `store/slices/uiSlice.ts` | Sidebar state, view state |
| `store/slices/chatSlice.ts` | Messages, streaming, sending |
| `store/slices/threadsSlice.ts` | Thread CRUD, selection |
| `store/slices/agentsSlice.ts` | Agent fetching, selection |

#### Files to Create — Backend

| File | Description |
|------|-------------|
| `api/records/[tableId]/chat/route.ts` | Streaming chat endpoint |
| `api/records/[tableId]/chat/services/chat-service.ts` | Agent builder with tools |
| `api/records/[tableId]/chat/services/table-context.ts` | Schema + sample data |
| `api/records/[tableId]/threads/route.ts` | Thread list/create |
| `api/records/[tableId]/threads/[threadId]/route.ts` | Thread detail/update/delete |
| `api/records/[tableId]/threads/services/thread-service.ts` | Thread CRUD |

#### Files to Create — Components

| File | Description |
|------|-------------|
| `components/ChatSidebar/index.tsx` | Main sidebar container |
| `components/ChatSidebar/ChatArea.tsx` | Messages + input |
| `components/ChatSidebar/AgentPicker.tsx` | Agent dropdown |
| `components/ChatSidebar/ThreadList.tsx` | Thread list |
| `components/ChatSidebar/ChatHeader.tsx` | Thread title |

#### Files to Modify

| File | Changes |
|------|---------|
| `[tableId]/page.tsx` | Add ChatSidebar, wire to store |

#### Acceptance Criteria

- [ ] Chat sidebar appears on table view
- [ ] Agent picker shows workforce agents (from store)
- [ ] Selecting agent updates `agentsSlice.selectedAgentId`
- [ ] Sending message updates `chatSlice.messages`
- [ ] Agent response streams in via `chatSlice.isStreaming`
- [ ] Agent can call `sys_table_*` tools
- [ ] Tool execution shown in chat UI
- [ ] Threads persist via Mastra memory
- [ ] Thread selection updates `threadsSlice.activeThreadId`
- [ ] Messages load when thread selected
- [ ] Sidebar collapse updates `uiSlice.sidebarOpen`

---

### Phase 3: Grid Enhancements

**Goal:** Add sorting, filtering, pagination, attribution.

**Why third:** Improves core data experience. Independent of chat.

#### Files to Create — Store

| File | Description |
|------|-------------|
| `store/slices/gridSlice.ts` | Sort, filter, selection, pagination state |

#### Files to Create — Components

| File | Description |
|------|-------------|
| `components/ColumnMenu/index.tsx` | Column header dropdown |
| `components/ColumnMenu/SortOptions.tsx` | Sort ASC/DESC |
| `components/ColumnMenu/FilterOptions.tsx` | Filter by value |
| `components/Pagination.tsx` | Page navigation |
| `components/TableHeader.tsx` | Table title + row count |

#### Files to Modify

| File | Changes |
|------|---------|
| `components/RecordsGrid.tsx` | Wire to gridSlice, add column menu |
| `api/records/[tableId]/rows/query/route.ts` | Accept sort/filter params |

#### Acceptance Criteria

- [ ] Click column header → toggle sort (via `gridSlice.setSort`)
- [ ] Sort indicator shows current sort state
- [ ] Column menu shows filter input
- [ ] Filter updates `gridSlice.filters`
- [ ] Query API receives sort/filter params
- [ ] Polars service applies sort/filter
- [ ] Pagination shows for >100 rows
- [ ] Page change updates `gridSlice.page`
- [ ] "Clear filters" resets `gridSlice.clearAllFilters()`

---

### Phase 4: Access & Activity

**Goal:** Control agent access, track activity.

**Why last:** Governance features building on previous phases.

#### Files to Create — Store

| File | Description |
|------|-------------|
| `store/slices/accessSlice.ts` | Access list, activity log |

#### Files to Create — Backend

| File | Description |
|------|-------------|
| `api/records/[tableId]/access/route.ts` | GET access info |
| `api/records/[tableId]/access/agents/route.ts` | POST grant access |
| `api/records/[tableId]/access/agents/[agentId]/route.ts` | DELETE revoke |
| `api/records/[tableId]/activity/route.ts` | GET activity log |
| `services/access.ts` | Access CRUD |
| `services/activity.ts` | Activity logging |

#### Files to Create — Components

| File | Description |
|------|-------------|
| `components/SettingsPanel/index.tsx` | Settings sidebar |
| `components/SettingsPanel/AccessTab.tsx` | Agent access list |
| `components/SettingsPanel/ActivityTab.tsx` | Activity log |

#### Files to Modify

| File | Changes |
|------|---------|
| `services/mutation/insert.ts` | Log activity with actor |
| `services/mutation/update.ts` | Log activity with actor |
| `services/mutation/delete.ts` | Log activity with actor |

#### Acceptance Criteria

- [ ] Settings panel opens via `uiSlice.settingsPanelOpen`
- [ ] Access tab shows agents with access
- [ ] Grant access calls API, updates `accessSlice.accessList`
- [ ] Revoke access calls API, updates store
- [ ] Activity tab shows recent actions
- [ ] Activity includes actor (user/agent), action type, timestamp
- [ ] Insert/update/delete mutations log activity

---

## 6. Detailed Slice Specifications

### 6.1 uiSlice

```typescript
// store/slices/uiSlice.ts

// 1. State Interface
export interface UiSliceState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarWidth: number;

  // Views
  activeView: "grid" | "settings";
  settingsPanelTab: "access" | "activity" | "schema";

  // Loading states
  isInitializing: boolean;
}

// 2. Actions Interface
export interface UiSliceActions {
  // Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;

  // Views
  setActiveView: (view: "grid" | "settings") => void;
  setSettingsPanelTab: (tab: "access" | "activity" | "schema") => void;

  // Reset
  resetUiState: () => void;
}

// 3. Combined Slice Type
export type UiSlice = UiSliceState & UiSliceActions;

// 4. Initial State
const initialState: UiSliceState = {
  sidebarOpen: true,
  sidebarWidth: 380,
  activeView: "grid",
  settingsPanelTab: "access",
  isInitializing: false,
};
```

---

### 6.2 chatSlice

```typescript
// store/slices/chatSlice.ts

import type { UIMessage } from "ai";

// 1. State Interface
export interface ChatSliceState {
  messages: UIMessage[];
  isStreaming: boolean;
  isLoadingMessages: boolean;
  error: string | null;
}

// 2. Actions Interface
export interface ChatSliceActions {
  // Messages
  setMessages: (messages: UIMessage[]) => void;
  addMessage: (message: UIMessage) => void;
  clearMessages: () => void;

  // Streaming
  setIsStreaming: (streaming: boolean) => void;

  // Loading
  setIsLoadingMessages: (loading: boolean) => void;

  // Error
  setError: (error: string | null) => void;

  // High-level actions
  loadThreadMessages: (tableId: string, threadId: string) => Promise<void>;
  sendMessage: (tableId: string, agentId: string, threadId: string, text: string) => Promise<void>;
}

// 3. Combined Slice Type
export type ChatSlice = ChatSliceState & ChatSliceActions;

// 4. Initial State
const initialState: ChatSliceState = {
  messages: [],
  isStreaming: false,
  isLoadingMessages: false,
  error: null,
};
```

**Implementation Notes:**
- `sendMessage` uses `fetch` with streaming, updates `isStreaming`
- `loadThreadMessages` fetches from `/api/records/[tableId]/threads/[threadId]`
- Messages are converted to `UIMessage` format for AI SDK compatibility

---

### 6.3 threadsSlice

```typescript
// store/slices/threadsSlice.ts

export interface Thread {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

// 1. State Interface
export interface ThreadsSliceState {
  threads: Thread[];
  activeThreadId: string | null;
  isLoadingThreads: boolean;
  error: string | null;
}

// 2. Actions Interface
export interface ThreadsSliceActions {
  // CRUD
  fetchThreads: (tableId: string) => Promise<void>;
  createThread: (tableId: string, title?: string) => Promise<Thread>;
  deleteThread: (tableId: string, threadId: string) => Promise<void>;
  renameThread: (tableId: string, threadId: string, newTitle: string) => Promise<void>;

  // Selection
  selectThread: (threadId: string | null) => void;

  // Helpers
  getActiveThread: () => Thread | null;
  updateThreadTitle: (threadId: string, title: string) => void;
}

// 3. Combined Slice Type
export type ThreadsSlice = ThreadsSliceState & ThreadsSliceActions;

// 4. Initial State
const initialState: ThreadsSliceState = {
  threads: [],
  activeThreadId: null,
  isLoadingThreads: false,
  error: null,
};
```

**Implementation Notes:**
- `fetchThreads` calls `/api/records/[tableId]/threads`
- `createThread` creates via API, adds to state, selects new thread
- `selectThread` triggers `chatSlice.loadThreadMessages` via cross-slice call

---

### 6.4 gridSlice

```typescript
// store/slices/gridSlice.ts

export type FilterOperator = "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains";

export interface FilterValue {
  operator: FilterOperator;
  value: string | number | boolean;
}

// 1. State Interface
export interface GridSliceState {
  // Sorting
  sortColumn: string | null;
  sortDirection: "asc" | "desc";

  // Filtering
  filters: Record<string, FilterValue>;

  // Selection
  selectedRowIds: Set<string>;

  // Pagination
  page: number;
  pageSize: number;
  totalRows: number;
}

// 2. Actions Interface
export interface GridSliceActions {
  // Sorting
  setSort: (column: string | null, direction?: "asc" | "desc") => void;
  toggleSort: (column: string) => void;
  clearSort: () => void;

  // Filtering
  setFilter: (column: string, value: FilterValue) => void;
  removeFilter: (column: string) => void;
  clearAllFilters: () => void;

  // Selection
  selectRow: (rowId: string) => void;
  deselectRow: (rowId: string) => void;
  toggleRowSelection: (rowId: string) => void;
  selectAllRows: (rowIds: string[]) => void;
  clearSelection: () => void;

  // Pagination
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotalRows: (total: number) => void;

  // Helpers
  getQueryParams: () => { sort?: object; filter?: object; limit: number; offset: number };
}

// 3. Combined Slice Type
export type GridSlice = GridSliceState & GridSliceActions;

// 4. Initial State
const initialState: GridSliceState = {
  sortColumn: null,
  sortDirection: "asc",
  filters: {},
  selectedRowIds: new Set(),
  page: 1,
  pageSize: 100,
  totalRows: 0,
};
```

**Implementation Notes:**
- `toggleSort` cycles: null → asc → desc → null
- `getQueryParams` builds query body for `/api/records/[tableId]/rows/query`
- RecordsGrid component uses this to build TanStack Query params

---

### 6.5 agentsSlice

```typescript
// store/slices/agentsSlice.ts

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: "active" | "idle" | "busy";
}

// 1. State Interface
export interface AgentsSliceState {
  agents: Agent[];
  selectedAgentId: string | null;
  isLoadingAgents: boolean;
  error: string | null;
}

// 2. Actions Interface
export interface AgentsSliceActions {
  fetchAgents: () => Promise<void>;
  selectAgent: (agentId: string) => void;
  clearSelectedAgent: () => void;
  getSelectedAgent: () => Agent | null;
}

// 3. Combined Slice Type
export type AgentsSlice = AgentsSliceState & AgentsSliceActions;

// 4. Initial State
const initialState: AgentsSliceState = {
  agents: [],
  selectedAgentId: null,
  isLoadingAgents: false,
  error: null,
};
```

**Implementation Notes:**
- `fetchAgents` calls `/api/workforce` (existing endpoint)
- `selectAgent` persists to localStorage for table-specific default

---

### 6.6 accessSlice

```typescript
// store/slices/accessSlice.ts

export interface AgentAccess {
  id: string;
  name: string;
  avatar: string;
  role: string;
  permission: "read" | "read_write";
}

export interface ActivityEntry {
  id: string;
  type: "insert" | "update" | "delete";
  actor: {
    type: "user" | "agent" | "workflow";
    id: string;
    name: string;
    avatar?: string;
  };
  rowCount: number;
  columns?: string[];
  timestamp: string;
}

// 1. State Interface
export interface AccessSliceState {
  accessList: AgentAccess[];
  activityLog: ActivityEntry[];
  isLoadingAccess: boolean;
  isLoadingActivity: boolean;
  error: string | null;
}

// 2. Actions Interface
export interface AccessSliceActions {
  // Access
  fetchAccess: (tableId: string) => Promise<void>;
  grantAccess: (tableId: string, agentId: string, permission: "read" | "read_write") => Promise<void>;
  revokeAccess: (tableId: string, agentId: string) => Promise<void>;
  updatePermission: (tableId: string, agentId: string, permission: "read" | "read_write") => Promise<void>;

  // Activity
  fetchActivity: (tableId: string) => Promise<void>;
}

// 3. Combined Slice Type
export type AccessSlice = AccessSliceState & AccessSliceActions;

// 4. Initial State
const initialState: AccessSliceState = {
  accessList: [],
  activityLog: [],
  isLoadingAccess: false,
  isLoadingActivity: false,
  error: null,
};
```

---

## 7. Dependency Graph

```
                    ┌─────────────────┐
                    │   Phase 1       │
                    │  Agent Tools    │
                    │  (Foundation)   │
                    └────────┬────────┘
                             │
                             │ depends on
                             ▼
                    ┌─────────────────┐
                    │   Phase 2       │
                    │  Store + Chat   │
                    │  (Core Feature) │
                    └────────┬────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                 │
            ▼                                 ▼
   ┌─────────────────┐               ┌─────────────────┐
   │   Phase 3       │               │   Phase 4       │
   │ Grid Enhance    │               │ Access/Activity │
   │  (gridSlice)    │               │ (accessSlice)   │
   └─────────────────┘               └─────────────────┘
```

### Cross-Slice Dependencies

```
agentsSlice ──────────────────┐
                              ▼
threadsSlice ──► chatSlice ──► (uses agentId for API calls)
                              ▲
uiSlice ──────────────────────┘

gridSlice ──► (standalone, used by RecordsGrid)

accessSlice ──► (standalone, used by SettingsPanel)
```

---

## 8. Risk Assessment

### High Risk

| Risk | Mitigation |
|------|------------|
| Chat streaming complexity | Copy pattern exactly from `useChatMemory.tsx`, convert to slice actions |
| Cross-slice coordination | Use `get()` to access other slices, document dependencies |
| Store hydration on page load | Initialize store in `[tableId]/page.tsx` useEffect |

### Medium Risk

| Risk | Mitigation |
|------|------------|
| Thread scoping (per-table vs per-agent) | Decision: scope per-table with `tableId` in thread metadata |
| Agent selection persistence | Store `selectedAgentId` per-table in localStorage |
| Grid performance with large data | Implement server-side pagination from day 1 |

### Low Risk

| Risk | Mitigation |
|------|------------|
| Existing `useRecords.ts` hooks | Keep as-is for server state, store handles UI state |
| Activity log growth | Truncate to last 100 entries, implement rotation |

---

## Related Documents

- **Product Spec:** `00-Product-Spec.md`
- **Technical Architecture:** `01-Technical-Architecture.md`
- **Store Pattern:** `_docs/Engineering/Architecture/Store-Slice-Architecture.md`
- **UXD Mockups:** `_docs/UXD/Pages/records/2025-12-09-sheets-v2/`
- **Pattern Sources:**
  - `app/(pages)/workflows/editor/store/` (10 slices)
  - `app/(pages)/workforce/components/agent-modal/store/` (3 slices)
