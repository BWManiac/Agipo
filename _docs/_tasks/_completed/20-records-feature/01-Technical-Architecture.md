# Task 20: Records Feature — Technical Architecture

**Status:** Planning
**Date:** December 9, 2025
**Purpose:** Define the technologies, file structure, and implementation patterns for the Records feature enhancement.

---

## 1. Technology Stack

### Frontend

| Technology | Purpose | Current Usage |
|------------|---------|---------------|
| **TanStack Table v8** | Data grid rendering, sorting, filtering | Already in use for RecordsGrid |
| **TanStack Query v5** | Server state, caching, mutations | Already in use via `useRecords.ts` hooks |
| **Zustand** | Complex UI state (modal, chat, sidebar) | New: `useRecordsStore` |
| **@ai-sdk/react** | Chat streaming, message handling | Reuse from Workforce ChatTab |
| **Radix UI** | Accessible primitives (Dialog, Popover, Tabs) | Already in use |

### Backend

| Technology | Purpose | Current Usage |
|------------|---------|---------------|
| **Next.js API Routes** | REST endpoints | Already in use under `/api/records/` |
| **Polars (nodejs-polars)** | DataFrame operations, filtering, sorting | Already in use in `io.ts` |
| **Zod** | Schema validation | Already in use in `schema.ts` |
| **Mastra (@mastra/core)** | Agent runtime, tool execution | Reuse from Workforce |
| **Mastra Memory (@mastra/memory)** | Thread persistence, conversation history | Reuse from Workforce |

### Data Storage

| Storage | Purpose | Location |
|---------|---------|----------|
| **File System (JSON)** | Table schemas and records | `_tables/records/[tableId]/` |
| **LibSQL (SQLite)** | Chat thread history (via Mastra Memory) | `.mastra/memory.db` |

---

## 2. File Architecture

### Frontend Structure

```
app/(pages)/records/
├── page.tsx                              # Catalog view (existing)
├── [tableId]/
│   └── page.tsx                          # Table view (enhanced)
├── components/
│   ├── RecordsGrid.tsx                   # Data grid (existing, enhanced)
│   ├── RecordsCatalog.tsx                # NEW: Catalog card grid
│   ├── TableHeader.tsx                   # NEW: Table title + controls
│   ├── ChatSidebar/                      # NEW: Chat panel
│   │   ├── index.tsx                     # Main sidebar component
│   │   ├── ChatArea.tsx                  # Messages + input
│   │   ├── AgentPicker.tsx               # Agent selection dropdown
│   │   └── types.ts                      # Chat-specific types
│   ├── ColumnMenu/                       # NEW: Sort/filter dropdown
│   │   ├── index.tsx
│   │   ├── SortOptions.tsx
│   │   └── FilterOptions.tsx
│   └── CreateTableDialog.tsx             # Existing, enhanced
├── hooks/
│   ├── useRecords.ts                     # Existing query hooks
│   ├── useTableChat.ts                   # NEW: Chat streaming
│   └── useTableAccess.ts                 # NEW: Access management
└── store/
    └── index.ts                          # NEW: Zustand store
```

### Backend Structure

```
app/api/records/
├── list/route.ts                         # GET - List tables (existing)
├── create/route.ts                       # POST - Create table (existing)
├── [tableId]/
│   ├── schema/route.ts                   # GET/PATCH schema (existing)
│   ├── rows/
│   │   ├── route.ts                      # POST - Insert row (existing)
│   │   ├── query/route.ts                # POST - Query rows (existing)
│   │   └── [rowId]/route.ts              # PATCH/DELETE row (existing)
│   ├── chat/                             # NEW: Chat endpoint
│   │   ├── route.ts                      # POST - Streaming chat
│   │   └── services/
│   │       └── chat-service.ts           # Chat context builder
│   ├── threads/                          # NEW: Thread management
│   │   ├── route.ts                      # GET/POST threads
│   │   └── [threadId]/route.ts           # GET/PATCH/DELETE thread
│   └── access/                           # NEW: Access management
│       ├── route.ts                      # GET access info
│       └── agents/
│           ├── route.ts                  # POST - Grant access
│           └── [agentId]/route.ts        # DELETE - Revoke access
└── services/
    ├── index.ts                          # Barrel export (existing)
    ├── io.ts                             # File I/O (existing)
    ├── schema.ts                         # Schema validation (existing)
    ├── catalog.ts                        # Table listing (existing)
    ├── query.ts                          # Query operations (existing)
    ├── mutation/                         # Row mutations (existing)
    │   ├── index.ts
    │   ├── insert.ts
    │   ├── update.ts
    │   └── delete.ts
    ├── access.ts                         # NEW: Access control
    └── activity.ts                       # NEW: Activity logging
```

### Agent Tools Structure

```
app/api/tools/services/
├── index.ts                              # Tool registry
├── sys-table-schema.ts                   # NEW: Get table schema
├── sys-table-read.ts                     # NEW: Query table rows
├── sys-table-write.ts                    # NEW: Insert row
├── sys-table-update.ts                   # NEW: Update row
└── sys-table-delete.ts                   # NEW: Delete row
```

---

## 3. State Management Architecture

### Zustand Store: `useRecordsStore`

Following the established slice pattern from `Store-Slice-Architecture.md`:

```typescript
// store/index.ts

// === SLICE 1: UI State ===
interface UiSliceState {
  sidebarOpen: boolean;
  sidebarWidth: number;
  activeView: "grid" | "settings";
}

interface UiSliceActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveView: (view: "grid" | "settings") => void;
}

// === SLICE 2: Chat State ===
interface ChatSliceState {
  selectedAgentId: string | null;
  activeThreadId: string | null;
  isStreaming: boolean;
}

interface ChatSliceActions {
  selectAgent: (agentId: string) => void;
  selectThread: (threadId: string | null) => void;
  setIsStreaming: (streaming: boolean) => void;
}

// === SLICE 3: Grid State ===
interface GridSliceState {
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  filters: Record<string, FilterValue>;
  selectedRowIds: Set<string>;
}

interface GridSliceActions {
  setSort: (column: string, direction: "asc" | "desc") => void;
  clearSort: () => void;
  setFilter: (column: string, value: FilterValue) => void;
  clearFilter: (column: string) => void;
  clearAllFilters: () => void;
  selectRow: (rowId: string) => void;
  deselectRow: (rowId: string) => void;
  selectAllRows: (rowIds: string[]) => void;
  clearSelection: () => void;
}

// === Combined Store ===
export type RecordsStore = UiSlice & ChatSlice & GridSlice;

export const useRecordsStore = create<RecordsStore>()(
  persist(
    (...a) => ({
      ...createUiSlice(...a),
      ...createChatSlice(...a),
      ...createGridSlice(...a),
    }),
    {
      name: "records-store",
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        sidebarWidth: state.sidebarWidth,
        selectedAgentId: state.selectedAgentId,
      }),
    }
  )
);
```

### React Query Keys

```typescript
// Consistent query key structure
const queryKeys = {
  tables: ["tables"] as const,
  table: (tableId: string) => ["table", tableId] as const,
  tableSchema: (tableId: string) => ["table", tableId, "schema"] as const,
  tableRows: (tableId: string) => ["table", tableId, "rows"] as const,
  tableAccess: (tableId: string) => ["table", tableId, "access"] as const,
  tableActivity: (tableId: string) => ["table", tableId, "activity"] as const,
  tableThreads: (tableId: string) => ["table", tableId, "threads"] as const,
};
```

---

## 4. Data Flow Architecture

### Chat Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ User types message in ChatSidebar                                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ useTableChat hook sends to POST /api/records/[tableId]/chat         │
│ Body: { message, agentId, threadId, tableContext }                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ chat-service.ts                                                     │
│ 1. Load agent config                                                │
│ 2. Build table context (schema + sample rows)                       │
│ 3. Inject sys_table_* tools                                         │
│ 4. Create Mastra agent with tools                                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Agent executes (may call tools)                                     │
│ - sys_table_read → query.ts → Polars DataFrame                      │
│ - sys_table_write → insert.ts → JSON commit                         │
│ - sys_table_update → update.ts → JSON commit                        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Response streams back to client                                     │
│ If tool modified data → invalidate tableRows query                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Grid re-renders with fresh data                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Grid Interaction Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ User clicks column header                                           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ useRecordsStore.setSort(column, direction)                          │
│ → Updates local state immediately (optimistic)                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ useTableRows hook re-fetches with sort params                       │
│ POST /api/records/[tableId]/rows/query { sort: { col, desc } }      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ query.ts applies sort via Polars DataFrame                          │
│ df.sort(col, { descending })                                        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Grid re-renders with sorted data                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. API Contracts

### Chat Endpoint

```typescript
// POST /api/records/[tableId]/chat
// Request
{
  message: string;
  agentId: string;
  threadId?: string;  // Optional, creates new if not provided
}

// Response: Streaming text/event-stream
// Uses Vercel AI SDK streaming format
```

### Thread Endpoints

```typescript
// GET /api/records/[tableId]/threads
// Response
{
  threads: Array<{
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

// POST /api/records/[tableId]/threads
// Request
{ title?: string }
// Response
{ id: string; title: string; createdAt: string; updatedAt: string; }

// GET /api/records/[tableId]/threads/[threadId]
// Response
{
  thread: { id, title, createdAt, updatedAt };
  messages: Array<{ id, role, content, createdAt }>;
}

// PATCH /api/records/[tableId]/threads/[threadId]
// Request
{ title: string }

// DELETE /api/records/[tableId]/threads/[threadId]
```

### Access Endpoints

```typescript
// GET /api/records/[tableId]/access
// Response
{
  owner: { type: "user"; id: string; name: string };
  agents: Array<{
    id: string;
    name: string;
    avatar: string;
    role: string;
    permission: "read" | "read_write";
  }>;
  workflows: Array<{
    id: string;
    name: string;
    columns: string[];
  }>;
}

// POST /api/records/[tableId]/access/agents
// Request
{ agentId: string; permission: "read" | "read_write" }

// DELETE /api/records/[tableId]/access/agents/[agentId]
```

---

## 6. Agent Tools Specification

### Tool: `sys_table_schema`

```typescript
createTool({
  id: "sys_table_schema",
  description: "Get the schema and column definitions for a table",
  inputSchema: z.object({
    tableId: z.string().describe("The ID of the table"),
  }),
  execute: async ({ context }) => {
    const schema = await readSchema(context.tableId);
    return {
      name: schema.name,
      columns: schema.columns.map((c) => ({
        name: c.name,
        type: c.type,
        required: c.required,
      })),
    };
  },
});
```

### Tool: `sys_table_read`

```typescript
createTool({
  id: "sys_table_read",
  description: "Query rows from a table with optional filters and sorting",
  inputSchema: z.object({
    tableId: z.string(),
    filter: z
      .object({
        column: z.string(),
        operator: z.enum(["eq", "neq", "gt", "lt", "gte", "lte", "contains"]),
        value: z.any(),
      })
      .optional(),
    sort: z
      .object({
        column: z.string(),
        descending: z.boolean().default(false),
      })
      .optional(),
    limit: z.number().default(100),
  }),
  execute: async ({ context }) => {
    const rows = await queryRows(context.tableId, {
      filter: context.filter,
      sort: context.sort,
      limit: context.limit,
    });
    return { rowCount: rows.length, rows };
  },
});
```

### Tool: `sys_table_write`

```typescript
createTool({
  id: "sys_table_write",
  description: "Insert a new row into a table",
  inputSchema: z.object({
    tableId: z.string(),
    data: z.record(z.any()).describe("Column name to value mapping"),
  }),
  execute: async ({ context }) => {
    const row = await insertRow(context.tableId, context.data);
    return { success: true, rowId: row._id };
  },
});
```

### Tool: `sys_table_update`

```typescript
createTool({
  id: "sys_table_update",
  description: "Update an existing row in a table",
  inputSchema: z.object({
    tableId: z.string(),
    rowId: z.string(),
    data: z.record(z.any()).describe("Column name to new value mapping"),
  }),
  execute: async ({ context }) => {
    await updateRow(context.tableId, context.rowId, context.data);
    return { success: true };
  },
});
```

### Tool: `sys_table_delete`

```typescript
createTool({
  id: "sys_table_delete",
  description: "Delete a row from a table",
  inputSchema: z.object({
    tableId: z.string(),
    rowId: z.string(),
  }),
  execute: async ({ context }) => {
    await deleteRow(context.tableId, context.rowId);
    return { success: true };
  },
});
```

---

## 7. Data Model Changes

### Schema Enhancement

```typescript
// Current schema.json structure
{
  "id": "customer-leads",
  "name": "Customer Leads",
  "description": "Sales pipeline tracking",
  "columns": [...],
  "lastModified": "2025-12-09T10:00:00Z"
}

// Enhanced schema.json structure
{
  "id": "customer-leads",
  "name": "Customer Leads",
  "description": "Sales pipeline tracking",
  "icon": "👥",
  "columns": [...],
  "access": {
    "agents": [
      { "id": "mira-patel", "permission": "read_write" },
      { "id": "alex-kim", "permission": "read" }
    ]
  },
  "lastModified": "2025-12-09T10:00:00Z"
}
```

### Activity Log (New File)

```
_tables/records/[tableId]/activity.json
```

```json
[
  {
    "id": "act_001",
    "type": "insert",
    "actor": { "type": "agent", "id": "mira-patel" },
    "rowIds": ["row_abc123"],
    "timestamp": "2025-12-09T14:30:00Z"
  },
  {
    "id": "act_002",
    "type": "update",
    "actor": { "type": "user", "id": "user_xyz" },
    "rowIds": ["row_abc123"],
    "columns": ["status"],
    "timestamp": "2025-12-09T14:35:00Z"
  }
]
```

---

## 8. Implementation Phases

### Phase 1: Chat Integration (P0)

**Goal:** Users can chat with agents about table data.

**Files to create/modify:**
- `app/(pages)/records/components/ChatSidebar/` (new)
- `app/(pages)/records/hooks/useTableChat.ts` (new)
- `app/(pages)/records/store/index.ts` (new)
- `app/api/records/[tableId]/chat/route.ts` (new)
- `app/api/records/[tableId]/threads/route.ts` (new)
- `app/api/tools/services/sys-table-*.ts` (new)

**Acceptance criteria:**
- Chat sidebar visible on table view
- Agent picker shows workforce agents
- Agent can read table data via tool
- Agent can insert/update rows via tools
- Grid refreshes when agent modifies data

### Phase 2: Grid Enhancements (P0/P1)

**Goal:** Sorting, filtering, pagination.

**Files to create/modify:**
- `app/(pages)/records/components/ColumnMenu/` (new)
- `app/(pages)/records/components/RecordsGrid.tsx` (modify)
- `app/api/records/services/query.ts` (modify)

**Acceptance criteria:**
- Click column header to sort
- Filter dropdown per column
- Pagination for >100 rows

### Phase 3: Access Management (P1)

**Goal:** Control which agents can access tables.

**Files to create/modify:**
- `app/api/records/[tableId]/access/` (new)
- `app/api/records/services/access.ts` (new)
- Settings panel component

**Acceptance criteria:**
- View who has access to table
- Grant/revoke agent access
- View activity log

### Phase 4: Polish (P2)

**Goal:** Attribution, bulk operations, templates.

**Files to modify:**
- RecordsGrid for attribution column
- Bulk action toolbar
- Create table dialog with templates

---

## 9. Testing Strategy

### Unit Tests

- Service functions (query, insert, update, delete)
- Schema validation
- Access control logic
- Tool execution

### Integration Tests

- API route handlers
- Chat streaming
- Tool → service → data flow

### E2E Tests (Playwright)

- Create table flow
- Chat with agent flow
- Sort/filter interactions
- Access management

---

## 10. Open Questions

| # | Question | Impact | Owner |
|---|----------|--------|-------|
| 1 | Should threads be scoped per-table or global? | Memory architecture | TBD |
| 2 | How to handle concurrent edits (user + agent)? | Data integrity | TBD |
| 3 | Should activity log be queryable or append-only? | Performance vs features | TBD |
| 4 | Max rows before requiring pagination? | UX | TBD |

---

## 11. Related Documents

- **Product Spec:** `_docs/_tasks/20-records-feature/00-Product-Spec.md`
- **Store Architecture:** `_docs/Engineering/Architecture/Store-Slice-Architecture.md`
- **UXD Mockups:** `_docs/UXD/Pages/records/2025-12-09-sheets-v2/`
- **Frontend-Backend Mapping:** `_docs/UXD/Pages/records/2025-12-09-sheets-v2/Frontend-Backend-Mapping.md`
- **Records Diary:** `_docs/_diary/13-RecordsDomainAndPolars.md`
