# Task 20: Records Feature — Product Spec

**Status:** Planning
**Date:** December 9, 2025
**Goal:** Transform Records from a basic data grid into a "Sheets-like" product with integrated chat, enabling humans and AI agents to collaborate on structured data.

---

## 1. Executive Summary

Records today is a functional but basic data grid. Users can create tables, add rows, and edit cells — but it's isolated from the AI workforce.

This task elevates Records into a **collaborative workspace** where users can chat with their agents about the data in front of them. The agent can query, analyze, add rows, update statuses, and answer questions — all while the user watches the table update in real-time.

**End state:** A split-pane interface with a chat sidebar (connected to the user's workforce agents) and a full-featured data grid, enabling natural language interaction with structured data.

---

## 2. Product Requirements

### 2.1 Chat Sidebar

**Definition:** A collapsible chat panel that allows users to converse with an agent about the current table.

**Why it matters:** This is the bridge between natural language intent and structured data operations. Users can say "add a row for John Smith" instead of manually clicking and typing.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-1.1 | Chat sidebar is visible when viewing a table | P0 |
| PR-1.2 | User can select which agent to chat with (from their workforce) | P0 |
| PR-1.3 | Agent receives table schema and current data as context | P0 |
| PR-1.4 | Agent can execute table operations (read, insert, update, delete) | P0 |
| PR-1.5 | Chat history persists per table (thread-scoped memory) | P1 |
| PR-1.6 | User can collapse/expand the chat sidebar | P1 |
| PR-1.7 | Agent responses stream in real-time | P1 |

### 2.2 Agent Tools (Backend)

**Definition:** The system tools that enable agents to interact with Records.

**Why it matters:** Without these tools, agents cannot actually modify the data — they can only talk about it.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-2.1 | `sys_table_read` tool: Query rows with optional filters | P0 |
| PR-2.2 | `sys_table_write` tool: Insert new rows | P0 |
| PR-2.3 | `sys_table_update` tool: Update existing rows by ID | P0 |
| PR-2.4 | `sys_table_delete` tool: Delete rows by ID | P1 |
| PR-2.5 | `sys_table_schema` tool: Get table schema and column info | P0 |
| PR-2.6 | Tools are injected into agent context when chatting in Records | P0 |

### 2.3 Data Grid Enhancements

**Definition:** Improvements to the existing TanStack Table-based grid.

**Why it matters:** The grid is the primary interface for viewing and editing data. It needs to support the workflows enabled by chat.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-3.1 | Real-time updates when agent modifies data | P0 |
| PR-3.2 | Column sorting (click header to sort ASC/DESC) | P0 |
| PR-3.3 | Column filtering (filter by value/contains) | P1 |
| PR-3.4 | Row selection (checkbox column) | P1 |
| PR-3.5 | Bulk actions on selected rows (delete, update status) | P2 |
| PR-3.6 | "Modified by" column showing User vs Agent attribution | P1 |
| PR-3.7 | Pagination for large tables (>100 rows) | P1 |

### 2.4 Table Management

**Definition:** CRUD operations on tables themselves (not just rows).

**Why it matters:** Users need to create, configure, and delete tables.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-4.1 | Create new table with name and description | P0 (exists) |
| PR-4.2 | Add columns to existing table | P0 (exists) |
| PR-4.3 | Delete columns from table | P1 |
| PR-4.4 | Delete entire table | P1 |
| PR-4.5 | Rename table | P2 |
| PR-4.6 | Table templates (pre-built schemas for common use cases) | P2 |

---

## 3. Acceptance Criteria

### Chat Integration (6 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-1 | Chat sidebar appears when viewing a table | Open any table, verify sidebar visible |
| AC-2 | Agent picker shows all user's workforce agents | Click picker, verify agent list matches workforce |
| AC-3 | Agent can read current table data | Ask "how many rows are there?" |
| AC-4 | Agent can insert a new row | Say "add a row for Bob Smith" |
| AC-5 | Agent can update a row | Say "change Bob's status to active" |
| AC-6 | Grid updates in real-time after agent action | Watch grid while agent executes |

### Data Grid (5 criteria)

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-7 | Clicking column header sorts the table | Click header, verify sort indicator and row order |
| AC-8 | Filter input filters visible rows | Enter filter value, verify row count changes |
| AC-9 | Inline editing still works | Click cell, edit, blur, verify persistence |
| AC-10 | Large tables paginate | Create >100 rows, verify pagination controls |
| AC-11 | Modified-by shows attribution | Have agent edit row, verify "Agent" attribution |

### Backwards Compatibility

| # | Criterion | How to Test |
|---|-----------|-------------|
| AC-12 | Existing tables still load and display | Open existing table, verify data intact |
| AC-13 | Existing CRUD operations still work | Add/edit/delete rows manually |

---

## 4. User Flows

### Flow 1: Chat with Agent About Data

```
1. User opens Records > "Customer Leads" table
2. Chat sidebar shows selected agent (or prompts to select)
3. User types: "Show me all leads from this week"
4. Agent calls sys_table_read with date filter
5. Agent responds with summary: "You have 12 leads from this week..."
6. User types: "Add a new lead: John Smith, john@acme.com, status pending"
7. Agent calls sys_table_write with row data
8. Grid updates to show new row
9. Agent confirms: "Added John Smith to the table"
```

### Flow 2: Agent-Assisted Data Cleanup

```
1. User opens Records > "Content Calendar" table
2. User types: "Find all posts with empty content fields"
3. Agent queries and returns: "Found 5 posts with empty content"
4. User types: "Delete them"
5. Agent calls sys_table_delete for each row
6. Grid updates, rows disappear
7. Agent confirms: "Deleted 5 empty posts"
```

### Flow 3: Sorting and Filtering

```
1. User opens Records > "Leads" table
2. User clicks "Status" column header
3. Table sorts by status (A-Z)
4. User clicks again
5. Table sorts by status (Z-A)
6. User opens filter for "Status" column
7. User selects "active" from dropdown
8. Table shows only active leads
```

### Flow 4: Error Handling

```
1. User types: "Add a row with invalid email: notanemail"
2. Agent attempts sys_table_write
3. Backend validation fails (email format)
4. Agent responds: "Could not add row: invalid email format"
5. Grid remains unchanged
```

---

## 5. Design Decisions

### 5.1 Decisions to Make

| ID | Question | Options | Current Lean | Decided? |
|----|----------|---------|--------------|----------|
| DD-1 | Where does chat sidebar go? | A: Left side, B: Right side | A: Left (matches workflow editor) | No |
| DD-2 | Default sidebar state? | A: Expanded, B: Collapsed | A: Expanded | No |
| DD-3 | How to handle agent selection? | A: Persist per table, B: Global default, C: Ask each time | A: Persist per table | No |
| DD-4 | Real-time update mechanism? | A: Polling, B: WebSocket, C: Invalidate on action | C: Invalidate (simplest) | No |
| DD-5 | Where do table tools live in agent config? | A: Auto-inject when in Records, B: Explicit capability | A: Auto-inject | No |

### 5.2 Decision Log

| Date | Decision | Choice | Rationale |
|------|----------|--------|-----------|
| - | - | - | - |

---

## 6. UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Table with Chat Sidebar | Primary view | Grid + chat panel + agent picker |
| Chat Interaction | Agent communication | Message bubbles, tool execution indicators |
| Column Sorting | Sort UI | Sort indicators on headers |
| Column Filtering | Filter UI | Filter input/dropdown per column |
| Empty State | No data | Empty table with helpful prompts |
| Agent Picker | Agent selection | Dropdown with workforce agents |
| Chat Collapsed | Sidebar toggle | Collapsed state with expand button |

### Mockup Location

```
_docs/UXD/Pages/records/
├── _old/                           # Previous designs (moved)
├── 2025-12-09-sheets-v2/          # New design system
│   ├── 01-table-with-chat.html    # Primary view
│   ├── 02-chat-interaction.html   # Chat states
│   ├── 03-column-controls.html    # Sort/filter UI
│   ├── 04-empty-state.html        # Empty table
│   ├── 05-agent-picker.html       # Agent selection
│   └── Frontend-Backend-Mapping.md # API requirements
└── README.md                       # UXD overview
```

### Exit Criteria for UXD Phase

- [ ] All required mockups complete
- [ ] Each mockup shows all P0 requirements
- [ ] Stakeholder review complete
- [ ] Preferred direction chosen

---

## 7. Success Criteria

| Criterion | How to Validate | Priority |
|-----------|-----------------|----------|
| User can chat with agent about table data | Manual test: ask questions, get answers | P0 |
| Agent can insert/update rows via chat | Manual test: execute commands | P0 |
| Grid updates when agent modifies data | Watch grid during agent action | P0 |
| Sorting works on all column types | Click headers, verify order | P0 |
| Filtering reduces visible rows | Apply filter, verify count | P1 |
| Existing tables still work | Load old tables, verify data | P0 |

**North Star:** Users can manage structured data through natural conversation with their AI agents, eliminating the friction between intent and action.

---

## 8. Out of Scope

- **RAG / semantic search**: This is for exact queries, not "find similar" (deferred to Task 21 - Docs)
- **Multi-table joins**: Complex queries across tables (future enhancement)
- **Formula columns**: Computed/derived values (future enhancement)
- **Import/Export**: CSV, Excel import/export (future enhancement)
- **Version history**: Row-level change tracking (future enhancement)
- **Collaborative editing**: Multi-user simultaneous editing (future enhancement)

---

## 9. Related Documents

- **Previous Feature Doc:** `_docs/Product/Features/02-Shared-Memory-Records.md`
- **Implementation Diary:** `_docs/_diary/13-RecordsDomainAndPolars.md`
- **UXD Designs:** `_docs/UXD/Pages/records/2025-12-09-sheets-v2/`
- **Follow-up Task:** Task 21 - Docs Feature (Google Docs-like product)

---

## Notes

### Vision Discussion (Dec 9, 2025)

The core insight is that Records isn't just a database UI — it's the **shared whiteboard** where human intent becomes visible to agents, and agent work becomes inspectable to humans.

**Key use cases identified:**
1. **Task Queue**: User creates table, agent fills rows, user approves by changing status
2. **Research Repository**: Agent populates research, user reviews and annotates
3. **Live Dashboard**: Agent monitors and updates, user views current state
4. **Approval Workflow**: Agent proposes actions as rows, user approves/rejects

**Differentiator from Google Sheets:**
- Schema-enforced (agents can't produce malformed data)
- Attribution tracking (who touched what)
- Tool-accessible (agents can query/write programmatically)
- Agent-native design patterns

### Technical Notes

- Chat will reuse existing agent chat infrastructure from workforce modal
- Table tools (`sys_table_*`) will use existing Records service layer
- Real-time updates likely via React Query invalidation (simplest approach)
- Agent context injection: schema + sample data in system prompt
