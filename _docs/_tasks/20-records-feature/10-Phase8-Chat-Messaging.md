# Phase 8: Chat Messaging

**Status:** 📋 Planned
**Depends On:** Phase 7
**Started:** TBD
**Completed:** TBD

---

## Overview

### Goal

Implement the actual chat messaging functionality. Users can send messages to the selected agent, see streaming responses, and view tool execution indicators. Messages persist within threads.

After this phase, users can have full conversations with agents about their table data, see agent responses stream in real-time, and observe when agents use tools to read/write data.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Streaming | AI SDK streaming | Consistent with workforce chat |
| Message format | UIMessage from AI SDK | Standard format for rendering |
| Tool display | Inline execution indicators | Matches mockup states |
| Input position | Bottom of sidebar | Standard chat UX |

### Pertinent Research

- **Mockup 01**: `01-table-with-chat.html` - Shows user/agent messages, tool execution
- **Mockup 05**: `05-chat-states.html` - Shows all chat states (typing, tool executing, success, error)

*Source: `_docs/UXD/Pages/records/2025-12-09-sheets-v2/`*

### Overall File Impact

#### Frontend / State

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/store/slices/chatSlice.ts` | Create | messages, isStreaming, send actions |
| `app/(pages)/records/store/index.ts` | Modify | Add chatSlice to composition |
| `app/(pages)/records/store/types.ts` | Modify | Add ChatSlice to RecordsStore |

#### Frontend / Components

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/records/components/ChatSidebar/ChatArea.tsx` | Create | Message list, input, streaming display |
| `app/(pages)/records/components/ChatSidebar/index.tsx` | Modify | Add ChatArea section |

#### Backend / API

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/[tableId]/chat/route.ts` | Create | POST streaming chat endpoint |

#### Backend / Services

| File | Action | Purpose |
|------|--------|---------|
| `app/api/records/[tableId]/chat/services/chat-service.ts` | Create | Agent builder with table tools |
| `app/api/records/[tableId]/chat/services/table-context.ts` | Create | Inject table schema + sample rows |

### Overall Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-8.1 | Chat input visible at bottom of sidebar | Open sidebar, input present |
| AC-8.2 | Typing message and pressing Enter sends | Type, enter, message appears |
| AC-8.3 | User messages align right, dark background | Verify styling |
| AC-8.4 | Agent messages align left, light background | Verify styling |
| AC-8.5 | Typing indicator shows while agent thinks | Send message, see dots |
| AC-8.6 | Agent response streams in progressively | Observe text appearing |
| AC-8.7 | Tool execution shows indicator | Agent uses tool, indicator appears |
| AC-8.8 | Tool success shows green check | Tool succeeds, verify icon |
| AC-8.9 | Tool failure shows red X | Tool fails, verify error |
| AC-8.10 | Messages persist in thread | Send, refresh, messages still there |
| AC-8.11 | "No agent selected" state when no agent | Clear agent, see empty state |
| AC-8.12 | Input placeholder shows context | "Ask about this table..." |

### User Flows

#### Flow 1: Send Message

```
1. User has agent selected and thread active
2. User types "Show me all leads from this week"
3. User presses Enter
4. Message appears right-aligned (user bubble)
5. Typing indicator appears (three dots)
6. Agent response streams in left-aligned
7. Response includes summary of query results
8. Typing indicator disappears when complete
```

#### Flow 2: Tool Execution

```
1. User sends "Add a new lead: John Smith, john@acme.com"
2. User message appears
3. Tool execution indicator shows:
   - Spinner + "Executing: sys_table_write"
4. Tool completes successfully
5. Indicator updates to:
   - Green check + "Executed: sys_table_write"
6. Agent response appears:
   - "Done! I've added John Smith to the table with..."
7. (In Phase 11, actual row would appear in grid)
```

#### Flow 3: Error Handling

```
1. User sends "Update row xyz123 to status approved"
2. Tool execution indicator shows
3. Tool fails (row not found)
4. Indicator shows:
   - Red X + "Failed: sys_table_update"
5. Error message appears:
   - "Could not update row"
   - "Row with ID 'xyz123' not found"
```

---

## Out of Scope

- Actual tool implementations → Phase 11
- Confirmation for destructive actions → Phase 11
- Settings panel → Phase 9
- Activity logging → Phase 10

---

## References

- **Mockup**: `01-table-with-chat.html`, `05-chat-states.html`
- **Pattern**: `workforce/.../ChatTab/hooks/useChatMemory.tsx`
- **API Pattern**: `workforce/[agentId]/chat/`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-09 | Initial creation | Claude |

---

**Last Updated:** 2025-12-09
