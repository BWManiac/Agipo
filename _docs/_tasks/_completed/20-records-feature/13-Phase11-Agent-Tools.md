# Phase 11: Agent Tools

**Status:** 📋 Planned
**Depends On:** Phase 10
**Started:** TBD
**Completed:** TBD

---

## Overview

### Goal

Create the `sys_table_*` tools that allow agents to interact with table data. These tools enable agents to read rows, write new rows, update existing rows, and delete rows. The tools are automatically available to agents when chatting in the Records context.

After this phase, agents can execute real data operations on tables, users see their table data change in response to chat commands, and the grid reflects agent modifications.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tool prefix | `sys_table_` | System tools, distinct from user workflows |
| Permission check | Per-request | Verify agent has access to table |
| Error handling | Structured errors | Agent can explain failures to user |
| Row highlighting | Temporary blue highlight | Show which row agent modified |

### Pertinent Research

- **Mockup 01**: `01-table-with-chat.html` - Shows agent-modified row highlighted in blue
- **Mockup 05**: `05-chat-states.html` - Shows tool execution states

*Source: `_docs/UXD/Pages/records/2025-12-09-sheets-v2/`*

### Overall File Impact

#### Backend / Tools

| File | Action | Purpose |
|------|--------|---------|
| `app/api/tools/services/sys-table-schema.ts` | Create | Get table schema |
| `app/api/tools/services/sys-table-read.ts` | Create | Query rows with filter/sort |
| `app/api/tools/services/sys-table-write.ts` | Create | Insert new row |
| `app/api/tools/services/sys-table-update.ts` | Create | Update existing row |
| `app/api/tools/services/sys-table-delete.ts` | Create | Delete row |
| `app/api/tools/services/index.ts` | Modify | Register sys_table_* tools |

#### Backend / Services

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/[tableId]/chat/services/chat-service.ts` | Modify | Inject table tools into agent |

#### Frontend / Components

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/components/RecordsGrid.tsx` | Modify | Add row highlight for agent changes |

### Overall Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-11.1 | sys_table_schema returns column info | Call tool, verify schema |
| AC-11.2 | sys_table_read supports eq filter | Query with eq, verify results |
| AC-11.3 | sys_table_read supports contains filter | Query with contains, verify |
| AC-11.4 | sys_table_read supports sort | Query with sort, verify order |
| AC-11.5 | sys_table_read supports limit/offset | Query with pagination |
| AC-11.6 | sys_table_write inserts new row | Write, verify row in grid |
| AC-11.7 | sys_table_write validates schema | Write invalid type, get error |
| AC-11.8 | sys_table_write returns row ID | Verify ID in response |
| AC-11.9 | sys_table_update modifies row | Update, verify change |
| AC-11.10 | sys_table_update supports partial update | Update one column |
| AC-11.11 | sys_table_delete removes row | Delete, verify gone |
| AC-11.12 | sys_table_delete handles not found | Delete missing, graceful error |
| AC-11.13 | Permission denied if agent lacks access | No-access agent, tool fails |
| AC-11.14 | Read-only agent can't write | Read-only agent, write fails |
| AC-11.15 | Grid highlights agent-modified rows | Agent writes, row shows blue |
| AC-11.16 | Activity log shows agent mutations | Check Activity tab |

### User Flows

#### Flow 1: Agent Reads Data

```
1. User asks "Show me all leads from TechCo"
2. Agent executes sys_table_read with filter: { company: { eq: "TechCo" } }
3. Tool returns matching rows
4. Agent responds: "I found 3 leads from TechCo: Alice, Bob, Carol"
```

#### Flow 2: Agent Writes Data

```
1. User asks "Add a lead: John Smith, john@acme.com, Acme Corp"
2. Agent executes sys_table_write with data:
   { name: "John Smith", email: "john@acme.com", company: "Acme Corp" }
3. Tool returns: { success: true, rowId: "clx9abc01" }
4. Agent responds: "Done! I've added John Smith to the table"
5. Grid shows new row with blue highlight
6. Modified By column shows agent avatar
7. Activity log shows: "Mira Patel added 1 row"
```

#### Flow 3: Agent Updates Data

```
1. User asks "Mark all TechCo leads as contacted"
2. Agent executes:
   - sys_table_read to find TechCo rows (3 rows)
   - sys_table_update for each row with { status: "contacted" }
3. Agent responds: "Done! I updated 3 leads to 'contacted'"
4. Grid shows updated status values
5. Activity log shows: "Mira Patel updated 3 rows"
```

#### Flow 4: Permission Denied

```
1. Agent "Alex" has read-only access
2. User asks Alex to "Add a new lead..."
3. Alex executes sys_table_write
4. Tool returns: { success: false, error: "Permission denied: read-only access" }
5. Alex responds: "I don't have permission to add rows to this table. I can only read data."
```

---

## Out of Scope

- Bulk operations in single tool call → Future
- Undo/rollback → Future
- Confirmation prompts for destructive actions → Future (nice to have)
- Cross-table queries → Future

---

## References

- **Mockup**: `01-table-with-chat.html` (row highlighting), `05-chat-states.html` (tool states)
- **Existing Tools**: `app/api/tools/services/`
- **Records Services**: `app/api/records/services/`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-09 | Initial creation | Claude |

---

**Last Updated:** 2025-12-09
