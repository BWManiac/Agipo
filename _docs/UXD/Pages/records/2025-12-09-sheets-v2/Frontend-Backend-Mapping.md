# Records Feature - Frontend-Backend Mapping

**Date:** December 9, 2025
**Status:** Implementation Planning
**Purpose:** Map frontend UI components to backend API requirements

---

## Overview

This document maps each mockup to the APIs needed to implement it.

---

## Mockup Index

| File | Purpose | APIs Needed |
|------|---------|-------------|
| `01-table-with-chat.html` | Primary table view with chat sidebar | Chat API, Table API, Agent Tools |
| `02-agent-picker.html` | Agent selection dropdown | GET /api/workforce |
| `03-empty-table.html` | Empty table state | - (UI only) |
| `04-column-filter.html` | Sort and filter controls | POST /api/records/[tableId]/rows/query |
| `05-chat-states.html` | Chat interaction states | Chat API |
| `06-catalog-view.html` | Table catalog/listing | GET /api/records/list |
| `07-create-table.html` | Create new table dialog | POST /api/records/create |
| `08-table-access-panel.html` | Table settings and access | NEW: Table access APIs |

---

## API Requirements by Component

### 1. Chat Sidebar

**Existing APIs (from Workforce):**
- `POST /api/workforce/[agentId]/chat` - Send message to agent

**New Requirements:**
- Agent must receive table context (schema + sample data)
- Agent must have `sys_table_*` tools available

**Data Flow:**
```
User types message
    → POST /api/workforce/[agentId]/chat
    → Body includes: { message, tableContext: { tableId, schema, sampleRows } }
    → Agent executes tools as needed
    → Response streams back
    → If tool modified data, invalidate table query
```

---

### 2. Agent Picker

**Existing APIs:**
- `GET /api/workforce` - List all agents (needs to be created per Task 19)

**Response Shape:**
```typescript
{
  agents: Array<{
    id: string;
    name: string;
    role: string;
    avatar: string;
    status: "active" | "idle" | "busy";
  }>
}
```

---

### 3. Data Grid

**Existing APIs:**
- `GET /api/records/[tableId]/schema` - Get table schema
- `POST /api/records/[tableId]/rows/query` - Query rows with filters/sort
- `POST /api/records/[tableId]/rows` - Insert row
- `PATCH /api/records/[tableId]/rows/[rowId]` - Update row
- `DELETE /api/records/[tableId]/rows/[rowId]` - Delete row

**Enhanced Query API:**
```typescript
// POST /api/records/[tableId]/rows/query
{
  filter?: {
    col: string;
    op: "eq" | "neq" | "gt" | "lt" | "contains";
    val: any;
  };
  sort?: {
    col: string;
    desc?: boolean;
  };
  limit?: number;
  offset?: number;
}
```

---

### 4. Agent Tools (NEW)

**New Tools to Create:**

#### `sys_table_schema`
```typescript
createTool({
  id: "sys_table_schema",
  description: "Get the schema and column definitions for a table",
  inputSchema: z.object({
    tableId: z.string()
  }),
  execute: async ({ context }) => {
    return await getTableSchema(context.tableId);
  }
})
```

#### `sys_table_read`
```typescript
createTool({
  id: "sys_table_read",
  description: "Query rows from a table with optional filters",
  inputSchema: z.object({
    tableId: z.string(),
    filter: z.object({
      col: z.string(),
      op: z.enum(["eq", "neq", "gt", "lt", "contains"]),
      val: z.any()
    }).optional(),
    limit: z.number().optional()
  }),
  execute: async ({ context }) => {
    return await queryTable(context.tableId, {
      filter: context.filter,
      limit: context.limit || 100
    });
  }
})
```

#### `sys_table_write`
```typescript
createTool({
  id: "sys_table_write",
  description: "Insert a new row into a table",
  inputSchema: z.object({
    tableId: z.string(),
    data: z.record(z.any())
  }),
  execute: async ({ context }) => {
    return await insertRow(context.tableId, context.data);
  }
})
```

#### `sys_table_update`
```typescript
createTool({
  id: "sys_table_update",
  description: "Update an existing row in a table",
  inputSchema: z.object({
    tableId: z.string(),
    rowId: z.string(),
    data: z.record(z.any())
  }),
  execute: async ({ context }) => {
    return await updateRow(context.tableId, context.rowId, context.data);
  }
})
```

#### `sys_table_delete`
```typescript
createTool({
  id: "sys_table_delete",
  description: "Delete a row from a table",
  inputSchema: z.object({
    tableId: z.string(),
    rowId: z.string()
  }),
  execute: async ({ context }) => {
    return await deleteRow(context.tableId, context.rowId);
  }
})
```

---

### 5. Table Access Management (NEW)

**New APIs Needed:**

#### `GET /api/records/[tableId]/access`
Get who has access to a table.

```typescript
// Response
{
  owner: {
    type: "user";
    id: string;
    name: string;
  };
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
    columns: string[]; // Which columns it writes to
  }>;
}
```

#### `POST /api/records/[tableId]/access/agents`
Grant agent access to table.

```typescript
// Request
{
  agentId: string;
  permission: "read" | "read_write";
}
```

#### `DELETE /api/records/[tableId]/access/agents/[agentId]`
Revoke agent access.

#### `GET /api/records/[tableId]/activity`
Get recent activity log.

```typescript
// Response
{
  activities: Array<{
    id: string;
    type: "insert" | "update" | "delete";
    actor: {
      type: "user" | "agent" | "workflow";
      id: string;
      name: string;
      avatar?: string;
    };
    rowCount: number;
    columns?: string[]; // For updates
    timestamp: string;
  }>;
}
```

---

### 6. Table Creation

**Existing API:**
- `POST /api/records/create`

**Enhanced Request:**
```typescript
{
  name: string;
  description?: string;
  icon?: string;
  columns?: Array<{
    name: string;
    type: "text" | "number" | "date" | "select" | "boolean";
    required?: boolean;
    options?: string[]; // For select type
  }>;
  agentAccess?: Array<{
    agentId: string;
    permission: "read" | "read_write";
  }>;
}
```

---

## Implementation Order

### Phase 1: Core Chat Integration
1. Create `sys_table_*` tools in `/app/api/tools/services/`
2. Modify chat route to inject tools when `tableId` is provided
3. Build chat sidebar component for Records page

### Phase 2: Grid Enhancements
1. Wire filter/sort UI to existing query API
2. Add column menu component (sort/filter dropdown)
3. Implement pagination UI

### Phase 3: Access Management
1. Create access APIs (`/api/records/[tableId]/access/*`)
2. Create activity logging
3. Build settings panel UI

### Phase 4: Polish
1. Real-time updates (React Query invalidation)
2. Modified-by column tracking
3. Bulk operations

---

## Data Model Changes

### Table Access Storage

Option A: Store in schema.json
```json
{
  "id": "customer-leads",
  "name": "Customer Leads",
  "columns": [...],
  "access": {
    "agents": [
      { "id": "mira-patel", "permission": "read_write" }
    ]
  }
}
```

Option B: Separate access.json file
```
_tables/records/customer-leads/
├── schema.json
├── records.json
└── access.json  # NEW
```

**Recommendation:** Option A (simpler, fewer files)

### Activity Log Storage

Store in separate file per table:
```
_tables/records/customer-leads/
├── schema.json
├── records.json
└── activity.json  # NEW - append-only log
```

Activity log format:
```json
[
  {
    "id": "act_001",
    "type": "insert",
    "actor": { "type": "agent", "id": "mira-patel" },
    "rowIds": ["clx9abc01"],
    "timestamp": "2025-12-09T14:30:00Z"
  }
]
```

---

## Notes

- Chat sidebar reuses existing agent chat infrastructure
- Tools are created using Mastra's `createTool` pattern
- React Query invalidation handles real-time updates (no WebSocket needed for MVP)
- Activity log is append-only, can be truncated periodically
