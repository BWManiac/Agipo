# Phase 5: Chat & Agent Integration

**Status:** 📋 Planned  
**Depends On:** Phase 2 (Basic Editor UI)  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Add chat sidebar and agent document tools. After this phase, users can:
- Chat with agents about documents
- Agents can read document content
- Agents can insert, replace, and delete content
- See live feedback when agents edit documents

This phase enables agentic document editing, the core differentiator of the DOX feature.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Chat Position | Right sidebar | Balance with outline (left) |
| Agent Tools | 9 document tools | Comprehensive editing capabilities |
| Streaming | SSE (Server-Sent Events) | Real-time feedback, matches Records pattern |
| Live Updates | Store actions | Immediate UI updates when agent edits |

### Pertinent Research

- **RQ-8**: Agent tool patterns with block manipulation (validated in Phase 0)
- **Records Pattern**: Chat streaming with SSE
- **Workforce Pattern**: Mastra agent configuration
- **Type Casting**: Agent tools must cast to `ElementNode` for block content replacement
- **Markdown Parsing**: Must call `root.clear()` before parsing in document tools
- **State Management**: Use `editor.update()` for serialization, read state separately

*Source: `00-Phase0-Technical-Spike.md`, `02-Research-Log-Phase0.md`, `app/api/records/[tableId]/chat/route.ts`*

### Overall File Impact

#### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/dox/[docId]/chat/route.ts` | Create | POST streaming chat | A |
| `app/api/dox/[docId]/chat/services/document-agent.ts` | Create | Mastra agent with doc tools | A |
| `app/api/dox/[docId]/chat/services/document-tools.ts` | Create | 9 document tool definitions | A |

#### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/dox/[docId]/components/ChatSidebar/index.tsx` | Create | Chat container | B |
| `app/(pages)/dox/[docId]/components/ChatSidebar/ChatArea.tsx` | Create | Messages display | B |
| `app/(pages)/dox/[docId]/components/ChatSidebar/ChatEmpty.tsx` | Create | Empty chat state | B |
| `app/(pages)/dox/[docId]/components/ChatSidebar/ChatInput.tsx` | Create | Message input | B |
| `app/(pages)/dox/[docId]/components/ChatSidebar/AgentEditingIndicator.tsx` | Create | Agent editing feedback | B |

#### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/dox/[docId]/store/slices/chatSlice.ts` | Create | Chat messages and streaming | B |

#### Frontend / Hooks

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/dox/[docId]/hooks/useDocumentChat.ts` | Create | Chat streaming hook | B |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-5.1 | Chat sidebar works | Open chat, verify UI | B |
| AC-5.2 | Agent can read document | Ask "What's in this doc?", verify response | A |
| AC-5.3 | Agent can insert content | Ask "Add summary section", verify inserted | A |
| AC-5.4 | Agent can replace content | Ask "Replace intro", verify replaced | A |
| AC-5.5 | Agent edits show live feedback | Agent edits, verify document updates | B |
| AC-5.6 | "Agent editing" indicator shows | Agent editing, verify indicator visible | B |
| AC-5.7 | Chat streams responses correctly | Send message, verify streaming | B |
| AC-5.8 | All 9 document tools work | Test each tool, verify functionality | A |

### User Flows (Phase Level)

#### Flow 1: Agent Reads Document

```
1. User opens chat sidebar
2. User types "What's in this document?"
3. Agent calls sys_doc_read tool
4. Agent responds with document summary
5. User sees response in chat
```

#### Flow 2: Agent Edits Document

```
1. User types "Add a summary section at the top"
2. Agent calls sys_doc_insert tool
3. Agent inserts heading + paragraph
4. Document updates live
5. "Agent editing" indicator shows
6. Indicator disappears when done
```

---

## Part A: Backend Agent Integration

### Goal

Build Mastra agent with 9 document tools for reading and editing documents.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/dox/[docId]/chat/route.ts` | Create | Streaming chat endpoint | ~150 |
| `app/api/dox/[docId]/chat/services/document-agent.ts` | Create | Mastra agent configuration | ~120 |
| `app/api/dox/[docId]/chat/services/document-tools.ts` | Create | 9 document tools | ~250 |

### Pseudocode

#### `app/api/dox/[docId]/chat/route.ts`

```
POST /api/dox/[docId]/chat
├── Authenticate user (Clerk)
├── Parse request: { messages, agentId, threadId? }
├── Load agent config
├── Build document tools (9 tools)
├── Create Mastra agent with tools
├── Stream response (SSE)
│   ├── Format: 'aisdk'
│   ├── threadId: resourceId
│   └── resourceId: userId:doc:docId
└── Return: StreamResponse
```

#### `app/api/dox/[docId]/chat/services/document-tools.ts`

```
buildDocumentTools(docId: string, userId: string): ToolMap
├── sys_doc_read: Read entire document
│   └── Returns: { content, properties, outline }
├── sys_doc_get_section: Get specific section
│   └── Returns: { section, content }
├── sys_doc_search: Search document
│   └── Returns: { matches: [...] }
├── sys_doc_insert: Insert content at position
│   └── Updates: document content
├── sys_doc_replace: Replace content range
│   └── Updates: document content
├── sys_doc_delete: Delete content range
│   └── Updates: document content
├── sys_doc_get_selection: Get selected text
│   └── Returns: { selection }
├── sys_doc_get_properties: Get frontmatter
│   └── Returns: { properties }
└── sys_doc_set_property: Set property
    └── Updates: frontmatter
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-5.2 | Agent can read document | Ask "What's in this doc?", verify response |
| AC-5.3 | Agent can insert content | Ask "Add summary section", verify inserted |
| AC-5.4 | Agent can replace content | Ask "Replace intro", verify replaced |
| AC-5.8 | All 9 document tools work | Test each tool, verify functionality |

### User Flows

#### Flow A.1: Agent Insert Tool

```
1. Agent receives: "Add summary at top"
2. Agent calls sys_doc_insert({ position: 0, content: "# Summary\n..." })
3. Tool reads document Markdown
4. Tool creates Lexical editor instance
5. Tool parses Markdown:
   - editor.update(() => {
   -   const root = $getRoot()
   -   root.clear()  // IMPORTANT: Clear first
   -   $convertFromMarkdownString(markdown, TRANSFORMERS)
   - })
6. Tool inserts content at position:
   - editor.update(() => {
   -   const root = $getRoot()
   -   const newBlock = createBlockFromMarkdown(content)
   -   root.splice(0, 0, [newBlock])  // Array required
   - })
7. Tool serializes back to Markdown:
   - editor.update(() => {
   -   markdown = $convertToMarkdownString(TRANSFORMERS)
   - })
8. Tool saves document
9. Tool returns success
10. Agent responds: "Added summary section"
```

**Implementation Notes:**
- Must use `root.clear()` before parsing Markdown
- Must use `editor.update()` for serialization (not `read()`)
- Must use array syntax for `splice()`: `splice(pos, 0, [block])`
- For replace operations, cast to `ElementNode` before `clear()`/`append()`
- See `03-Technical-Architecture.md` Section 8 for helper functions

---

## Part B: Frontend Chat UI

### Goal

Build chat sidebar with streaming support and live document updates.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/dox/[docId]/components/ChatSidebar/index.tsx` | Create | Chat container | ~120 |
| `app/(pages)/dox/[docId]/components/ChatSidebar/ChatArea.tsx` | Create | Messages display | ~150 |
| `app/(pages)/dox/[docId]/components/ChatSidebar/ChatEmpty.tsx` | Create | Empty state | ~60 |
| `app/(pages)/dox/[docId]/components/ChatSidebar/ChatInput.tsx` | Create | Message input | ~100 |
| `app/(pages)/dox/[docId]/components/ChatSidebar/AgentEditingIndicator.tsx` | Create | Editing feedback | ~80 |
| `app/(pages)/dox/[docId]/store/slices/chatSlice.ts` | Create | Chat state | ~200 |
| `app/(pages)/dox/[docId]/hooks/useDocumentChat.ts` | Create | Chat streaming hook | ~200 |

### Pseudocode

#### `app/(pages)/dox/[docId]/components/ChatSidebar/index.tsx`

```
ChatSidebar
├── Render: Sidebar
│   ├── Header: "Chat" + agent picker
│   ├── Content: ChatArea
│   │   ├── Messages list
│   │   └── ChatEmpty (if no messages)
│   ├── Footer: ChatInput
│   └── AgentEditingIndicator (overlay)
├── Store: useDocsStore()
│   ├── chatSlice.messages
│   ├── chatSlice.isStreaming
│   └── chatSlice.selectedAgentId
└── Events:
    ├── Send message → Call sendMessage()
    └── Select agent → Update selectedAgentId
```

#### `app/(pages)/dox/[docId]/store/slices/chatSlice.ts`

```
chatSlice
├── State:
│   ├── messages: ChatMessage[]
│   ├── isStreaming: boolean
│   ├── selectedAgentId: string | null
│   └── threadId: string | null
├── Actions:
│   ├── setMessages(messages)
│   ├── addMessage(message)
│   ├── updateMessage(id, updates)
│   ├── setIsStreaming(streaming)
│   ├── sendMessage(text)
│   └── loadThread(threadId)
└── Implementation:
    ├── sendMessage: POST /api/dox/[docId]/chat
    │   ├── Stream SSE events
    │   ├── Parse text-delta events
    │   ├── Update messages
    │   └── On tool call → Update document
    └── loadThread: GET /api/dox/[docId]/threads/[threadId]
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-5.1 | Chat sidebar works | Open chat, verify UI |
| AC-5.5 | Agent edits show live feedback | Agent edits, verify document updates |
| AC-5.6 | "Agent editing" indicator shows | Agent editing, verify indicator visible |
| AC-5.7 | Chat streams responses correctly | Send message, verify streaming |

### User Flows

#### Flow B.1: Send Chat Message

```
1. User types message in ChatInput
2. User clicks send
3. chatSlice.sendMessage() called
4. POST /api/dox/[docId]/chat
5. SSE stream starts
6. Messages update as stream arrives
7. On tool call, document updates
8. Stream completes
9. isStreaming → false
```

---

## Out of Scope

What is explicitly NOT included in this phase:

- **Thread management** → Future consideration
- **Agent selection UI** → Future consideration (use existing agent picker)
- **Chat history persistence** → Handled by Mastra Memory

---

## References

- **Research**: `00-Phase0-Technical-Spike.md` - Agent tool patterns validation
- **Pattern Source**: `app/api/records/[tableId]/chat/route.ts` - Chat streaming pattern
- **Pattern Source**: `app/(pages)/records/components/ChatSidebar/` - Chat UI pattern
- **Architecture**: `03-Technical-Architecture.md` - Agent tools specification

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | AI Assistant |

---

**Last Updated:** 2025-12-10
