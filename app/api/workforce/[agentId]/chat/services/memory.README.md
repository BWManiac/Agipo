# Agent Memory Service

> Creates and caches per-agent Memory instances for conversation persistence.

**Service:** `memory.ts`  
**Domain:** Workforce

---

## Purpose

This service provides per-agent Memory instances using Mastra Memory and LibSQL storage. Each agent has its own SQLite database file for storing conversation threads, messages, and working memory. Without this service, agents would be stateless - every conversation would start fresh with no memory of past interactions.

**Product Value:** Enables agents to remember past conversations and maintain knowledge about users over time. This transforms agents from stateless assistants into persistent collaborators who accumulate context, making them feel like true "digital employees" who know your preferences and history.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `getAgentMemory()` | Creates or returns a cached Memory instance for an agent, configured with conversation persistence and working memory. | When initializing agents for chat - provides memory instance for conversation threads |

---

## Approach

The service implements a singleton pattern per agent, caching Memory instances after first creation. Each agent gets its own SQLite database file at `_tables/agents/{agentId}/memory.db`. Memory is configured with lastMessages (keeps context), workingMemory (structured user knowledge), and automatic thread title generation. The service ensures agent directories exist before creating databases.

---

## Public API

### `getAgentMemory(agentId: string): Memory`

**What it does:** Creates or returns a cached Memory instance for an agent, configured with LibSQL storage, conversation persistence, and working memory capabilities.

**Product Impact:** Every agent conversation needs a Memory instance to persist threads and messages. This function provides that instance with proper configuration, enabling agents to remember past conversations and maintain knowledge about users.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentId` | string | Yes | Agent identifier (e.g., "pm", "marketing", "alex-kim") |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Memory | Mastra Memory instance configured for the agent, cached after first creation |

**Process:**

```
getAgentMemory(agentId): Memory
├── Check memoryCache for existing instance
├── If cached: Return cached instance
├── If not cached:
│   ├── Ensure agent directory exists: _tables/agents/{agentId}/
│   ├── Build SQLite database path: file:{agentDir}/memory.db
│   ├── Create Memory instance with:
│   │   ├── storage: LibSQLStore with file:// URL
│   │   └── options:
│   │       ├── lastMessages: 10 (keep last 10 messages in context)
│   │       ├── workingMemory: { enabled: true, scope: "resource", schema: workingMemorySchema }
│   │       └── threads: { generateTitle: true }
│   ├── Cache instance in memoryCache Map
│   └── Return new instance
```

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `@mastra/memory` | Memory framework |
| `@mastra/libsql` | SQLite storage backend |
| `fs` | Directory creation and existence checks |
| `path` | Path resolution for database files |
| `../types/working-memory` | Working memory schema definition |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Chat Service | `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Provides Memory instance when creating agents |
| Thread Service | `app/api/workforce/[agentId]/threads/services/thread-service.ts` | Uses Memory for thread operations |
| Knowledge Service | `app/api/workforce/[agentId]/knowledge/services/knowledge-service.ts` | Uses Memory for working memory operations |

---

## Design Decisions

### Why per-agent databases?

**Decision:** Each agent gets its own SQLite database file.

**Rationale:** This provides isolation between agents while maintaining simplicity. Each agent's conversations and knowledge are separate, making it clear what data belongs to which agent. SQLite files are easy to backup, inspect, and manage.

### Why caching Memory instances?

**Decision:** Memory instances are cached after first creation.

**Rationale:** Creating Memory instances involves file system operations and database initialization. Caching avoids repeated initialization overhead and ensures the same instance is reused across requests for the same agent.

### Why lastMessages: 10?

**Decision:** Keeps last 10 messages in context automatically.

**Rationale:** Provides conversation continuity without manual context management. 10 messages is a reasonable balance between context and token usage. This is configurable if needed.

---

## Error Handling

Directory creation failures would throw errors. Database initialization failures would be caught by Mastra and logged. Missing directories are automatically created with `recursive: true`.

---

## Related Docs

- [Chat Service README](./chat-service.README.md) - Uses this service to provide Memory to agents
- [Thread Service README](../../threads/services/thread-service.README.md) - Uses Memory for thread operations
- [Knowledge Service README](../../knowledge/services/knowledge-service.README.md) - Uses Memory for working memory
- [Mastra Memory Documentation](https://mastra.ai/docs/memory) - Memory framework details

---

## Future Improvements

- [ ] Add database migration utilities for schema changes
- [ ] Add memory cleanup/pruning for old threads
- [ ] Add memory backup/export capabilities
- [ ] Consider shared memory pools for team agents
- [ ] Add memory metrics/analytics

