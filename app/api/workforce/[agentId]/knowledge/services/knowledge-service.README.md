# Knowledge Service

> Provides read and clear operations for agent working memory.

**Service:** `knowledge-service.ts`  
**Domain:** Workforce

---

## Purpose

This service exposes agent working memory to users through the Knowledge tab in the agent modal. Working memory is structured knowledge that agents accumulate about users (preferences, context, facts) and can autonomously update during conversations. This service allows users to view what agents "know" and clear that knowledge if needed.

**Product Value:** Enables transparency in AI - users can see what their agents remember about them. This builds trust and allows users to correct or clear knowledge if it becomes outdated or incorrect. It's the "Knowledge" tab that shows agents as persistent collaborators who accumulate context.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `getWorkingMemory()` | Retrieves the working memory for a user from an agent's memory database, parsed from JSON into the WorkingMemory type. | When displaying the Knowledge tab in the agent modal - shows what the agent knows |
| `clearWorkingMemory()` | Clears/resets the working memory for a user by updating it with an empty object. | When user wants to reset what an agent knows about them |

---

## Approach

The service uses the agent's Memory instance (from memory.ts) to access working memory. Working memory is scoped per-user (resourceId) across all threads, so the same memory is accessible from any conversation thread. The service handles JSON parsing/stringification since Mastra stores working memory as JSON strings, and provides user-friendly error handling.

---

## Public API

### `getWorkingMemory(agentId: string, resourceId: string): Promise<KnowledgeResponse>`

**What it does:** Retrieves the working memory for a specific user from an agent's memory database, showing what structured knowledge the agent has accumulated about that user.

**Product Impact:** Powers the Knowledge tab UI where users see what agents remember. This transparency builds trust and allows users to verify that agents have correct information about them.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | string | Yes | Agent identifier (e.g., "pm", "marketing") |
| `resourceId` | string | Yes | User ID (scopes working memory per-user) |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<KnowledgeResponse> | Object with knowledge (WorkingMemory or null) and updatedAt timestamp |

**Process:**

```
getWorkingMemory(agentId, resourceId): Promise<KnowledgeResponse>
├── **Call `getAgentMemory(agentId)`** to get Memory instance
├── **Call `memory.getWorkingMemory()`** with threadId placeholder and resourceId
├── If no working memory: Return { knowledge: null, updatedAt: null }
├── Parse JSON string to WorkingMemory type
└── Return { knowledge, updatedAt: timestamp }
```

**Error Handling:** Errors are caught and return { knowledge: null, updatedAt: null } gracefully.

**Note:** Uses threadId placeholder "__resource__" because working memory is scoped by resourceId (per-user), not threadId, but Mastra's API requires a threadId parameter.

---

### `clearWorkingMemory(agentId: string, resourceId: string): Promise<boolean>`

**What it does:** Clears/resets the working memory for a user by updating it with an empty JSON object, effectively erasing what the agent knows about them.

**Product Impact:** Allows users to reset agent knowledge if it becomes incorrect or outdated. This gives users control over their agent relationships and enables privacy/compliance requirements.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | string | Yes | Agent identifier (e.g., "pm", "marketing") |
| `resourceId` | string | Yes | User ID (scopes working memory per-user) |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<boolean> | True if clearing succeeded, false if failed |

**Process:**

```
clearWorkingMemory(agentId, resourceId): Promise<boolean>
├── **Call `getAgentMemory(agentId)`** to get Memory instance
├── **Call `memory.updateWorkingMemory()`** with empty JSON object
├── If successful: Return true
└── If error: Log and return false
```

**Error Handling:** Errors are caught and logged, returns false on failure.

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `../../chat/services/memory` | Agent Memory instance provider |
| `../../chat/types/working-memory` | WorkingMemory type definition |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Knowledge Route | `app/api/workforce/[agentId]/knowledge/route.ts` | Exposes working memory operations via API |

---

## Design Decisions

### Why threadId placeholder?

**Decision:** Uses "__resource__" as threadId when calling Mastra Memory APIs.

**Rationale:** Working memory is scoped by resourceId (per-user across all threads), but Mastra's API requires a threadId parameter. The placeholder makes it clear this is a resource-scoped operation, not thread-specific. The actual scope is controlled by the Memory configuration (scope: "resource").

### Why JSON parsing?

**Decision:** Working memory is parsed from JSON string to WorkingMemory type.

**Rationale:** Mastra stores working memory as JSON strings in the database. The service converts to typed objects for easier consumption by routes and UI.

---

## Error Handling

Both functions catch errors and return safe defaults (null or false) rather than throwing. This ensures the UI can gracefully handle memory access failures without breaking.

---

## Related Docs

- [Memory Service README](../../chat/services/memory.README.md) - Provides the Memory instances used here
- [Thread Service README](../../threads/services/thread-service.README.md) - Also uses Memory for thread operations
- [Knowledge Route README](../../knowledge/README.md) - API route that uses this service

---

## Future Improvements

- [ ] Add partial memory updates (update specific fields)
- [ ] Add memory export/import capabilities
- [ ] Add memory validation/health checks
- [ ] Add actual updatedAt timestamp from database
- [ ] Add memory search/filtering capabilities

