# Thread Service

> Provides CRUD operations for conversation threads using Mastra Memory.

**Service:** `thread-service.ts`  
**Domain:** Workforce

---

## Purpose

This service manages conversation threads - the persistent conversation history between users and agents. It enables listing threads, retrieving messages, creating new threads, updating thread titles, and deleting threads. Without this service, users couldn't see their conversation history or manage multiple conversation threads with agents.

**Product Value:** Enables the conversation history UI where users see past conversations with agents. This makes agents feel persistent and reliable - users can continue past conversations, reference previous discussions, and manage their interaction history. This is essential for the "digital employee" experience.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `getThreadsForUser()` | Retrieves all conversation threads for a user with an agent, sorted by most recently updated. | When displaying the thread list sidebar in the agent chat UI |
| `getThreadWithMessages()` | Retrieves a specific thread with all its messages, formatted for UI display. | When user opens a thread to view or continue a conversation |
| `createThread()` | Creates a new conversation thread for a user with an agent. | When starting a new conversation |
| `updateThreadTitle()` | Updates the title of a thread, allowing users to rename conversations. | When user renames a thread in the UI |
| `deleteThread()` | Deletes a thread and all its messages. | When user wants to remove a conversation from history |

---

## Approach

The service uses Mastra Memory's thread APIs which handle persistence automatically. It extracts and normalizes message content from various formats (string, parts arrays, nested objects) that Mastra may store. Thread operations are scoped by resourceId (user ID) and agentId, ensuring users only see their own threads and threads are isolated per agent.

---

## Public API

### `getThreadsForUser(agentId: string, resourceId: string): Promise<ThreadSummary[]>`

**What it does:** Retrieves all conversation threads for a user with an agent, returning summaries with id, title, and timestamps, sorted by most recently updated.

**Product Impact:** Powers the thread list sidebar in the agent chat UI. Users can see all their past conversations with an agent and quickly navigate to continue previous discussions.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | string | Yes | Agent identifier (e.g., "pm", "marketing") |
| `resourceId` | string | Yes | User ID (scopes threads per-user) |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<ThreadSummary[]> | Array of thread summaries with id, title, createdAt, updatedAt, sorted by updatedAt descending |

**Process:**

```
getThreadsForUser(agentId, resourceId): Promise<ThreadSummary[]>
├── **Call `getAgentMemory(agentId)`** to get Memory instance
├── **Call `memory.getThreadsByResourceId()`** with resourceId, orderBy: "updatedAt", sortDirection: "DESC"
├── Map Mastra threads to ThreadSummary format
└── Return summaries array
```

---

### `getThreadWithMessages(agentId: string, threadId: string, resourceId: string): Promise<ThreadWithMessages | null>`

**What it does:** Retrieves a specific thread with all its messages, formatted for UI display. Includes thread metadata and an array of messages with role, content, and timestamps.

**Product Impact:** When users open a thread from the sidebar, this function loads the complete conversation history so they can see past messages and continue the conversation with full context.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | string | Yes | Agent identifier (e.g., "pm", "marketing") |
| `threadId` | string | Yes | Thread ID to retrieve |
| `resourceId` | string | Yes | User ID (for authorization - verifies thread belongs to user) |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<ThreadWithMessages \| null> | Thread object with metadata and messages array, or null if thread not found or doesn't belong to user |

**Process:**

```
getThreadWithMessages(agentId, threadId, resourceId): Promise<ThreadWithMessages | null>
├── **Call `getAgentMemory(agentId)`** to get Memory instance
├── **Call `memory.getThreadById()`** with threadId
├── If thread not found: Return null
├── **Verify thread.resourceId matches resourceId** (authorization)
├── If doesn't match: Return null
├── **Call `memory.query()`** with threadId and resourceId to get messages
├── Map messages to UI format:
│   ├── Extract content using `extractMessageContent()` (handles various formats)
│   ├── Format role, id, createdAt
│   └── Build messages array
└── Return { thread: metadata, messages: array }
```

---

### `createThread(agentId: string, resourceId: string, title?: string): Promise<ThreadSummary>`

**What it does:** Creates a new conversation thread for a user with an agent, optionally with a custom title.

**Product Impact:** When users start a new conversation, this function creates the thread container. If no title is provided, Mastra will auto-generate one from the first message.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | string | Yes | Agent identifier (e.g., "pm", "marketing") |
| `resourceId` | string | Yes | User ID (scopes thread to user) |
| `title` | string | No | Optional thread title (defaults to "New Conversation" if not provided) |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<ThreadSummary> | Thread summary with id, title, createdAt, updatedAt |

**Process:**

```
createThread(agentId, resourceId, title?): Promise<ThreadSummary>
├── **Call `getAgentMemory(agentId)`** to get Memory instance
├── **Call `memory.createThread()`** with resourceId, title, saveThread: true
├── Map Mastra thread to ThreadSummary format
└── Return summary
```

---

### `updateThreadTitle(agentId: string, threadId: string, resourceId: string, title: string): Promise<ThreadSummary | null>`

**What it does:** Updates the title of an existing thread, allowing users to rename conversations for better organization.

**Product Impact:** Users can organize their conversation history by giving threads meaningful names. This improves usability when users have many conversations with an agent.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | string | Yes | Agent identifier (e.g., "pm", "marketing") |
| `threadId` | string | Yes | Thread ID to update |
| `resourceId` | string | Yes | User ID (for authorization) |
| `title` | string | Yes | New title for the thread |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<ThreadSummary \| null> | Updated thread summary, or null if thread not found or doesn't belong to user |

**Process:**

```
updateThreadTitle(agentId, threadId, resourceId, title): Promise<ThreadSummary | null>
├── **Call `getAgentMemory(agentId)`** to get Memory instance
├── **Call `memory.getThreadById()`** to verify thread exists
├── If thread not found: Return null
├── **Verify thread.resourceId matches resourceId** (authorization)
├── If doesn't match: Return null
├── **Call `memory.saveThread()`** with updated thread object (new title, updatedAt)
├── Map updated thread to ThreadSummary format
└── Return summary
```

---

### `deleteThread(agentId: string, threadId: string, resourceId: string): Promise<boolean>`

**What it does:** Deletes a thread and all its messages, removing it from conversation history.

**Product Impact:** Allows users to clean up their conversation history, removing threads they no longer need. Important for privacy and organization.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | string | Yes | Agent identifier (e.g., "pm", "marketing") |
| `threadId` | string | Yes | Thread ID to delete |
| `resourceId` | string | Yes | User ID (for authorization) |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<boolean> | True if deletion succeeded, false if thread not found or doesn't belong to user |

**Process:**

```
deleteThread(agentId, threadId, resourceId): Promise<boolean>
├── **Call `getAgentMemory(agentId)`** to get Memory instance
├── **Call `memory.getThreadById()`** to verify thread exists
├── If thread not found: Return false
├── **Verify thread.resourceId matches resourceId** (authorization)
├── If doesn't match: Return false
├── **Call `memory.deleteThread()`** with threadId
└── Return true
```

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `../../chat/services/memory` | Agent Memory instance provider |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Threads List Route | `app/api/workforce/[agentId]/threads/route.ts` | Lists user's threads |
| Thread Detail Route | `app/api/workforce/[agentId]/threads/[threadId]/route.ts` | Gets thread with messages, updates title, deletes thread |
| Agent Chat UI | `app/(pages)/workforce/components/agent-modal/` | Displays thread list and manages threads |

---

## Design Decisions

### Why extractMessageContent helper?

**Decision:** Messages are extracted from various formats (string, parts arrays, nested objects) into simple text content.

**Rationale:** Mastra stores messages in different formats depending on how they were created (streaming, tool calls, etc.). The helper normalizes these formats so the UI always receives consistent, readable content.

### Why authorization checks?

**Decision:** All operations verify that threads belong to the requesting user via resourceId.

**Rationale:** Security - users should only be able to access their own threads. This prevents unauthorized access to other users' conversations.

---

## Error Handling

- Thread not found: Returns null or false (depending on operation)
- Authorization failures: Returns null or false
- Memory errors: Would be thrown and handled by route layer

---

## Related Docs

- [Memory Service README](../../chat/services/memory.README.md) - Provides the Memory instances used here
- [Threads Route README](../../threads/README.md) - API routes that use this service

---

## Future Improvements

- [ ] Add thread search/filtering
- [ ] Add thread archiving (soft delete)
- [ ] Add bulk thread operations
- [ ] Add thread export capabilities
- [ ] Add thread sharing/collaboration features

