# Memory Service

This service manages per-agent Memory instances for conversation persistence using Mastra's Memory system.

## Folder Structure

Memory databases are stored in agent folders with the format: `{name-slug}-{uuid}/`

Example:
- Folder: `test-agent-a1b2c3d4-e5f6-7890-abcd-ef1234567890/`
- Memory DB: `test-agent-a1b2c3d4-e5f6-7890-abcd-ef1234567890/memory.db`
- Agent ID (UUID): `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

## Functions

### `getAgentMemory(agentId: string): Memory`

Creates or retrieves a cached Memory instance for an agent.

**Parameters:**
- `agentId` - The agent's UUID identifier

**Returns:** Mastra Memory instance configured for the agent

**Process:**
1. Checks cache for existing Memory instance
2. Maps UUID `agentId` to folder name using `getAgentFolderName()`
3. Ensures agent directory exists (creates if needed)
4. Initializes Memory with LibSQLStore pointing to `{folder}/memory.db`
5. Caches and returns the instance

**Throws:** Error if agent folder not found

---

## Helper Functions

### `getAgentFolderName(agentId: string): string | null`

Scans the `_tables/agents/` directory for folders matching the agentId (UUID).

**Process:**
1. Reads all entries in `_tables/agents/`
2. Finds directories that end with `-{agentId}`
3. Returns folder name if found, null otherwise

**Example:**
- `agentId`: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- Matches folder: `test-agent-a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- Returns: `test-agent-a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

## Memory Configuration

Each Memory instance is configured with:

- **Storage:** LibSQLStore with SQLite database at `file:{folder}/memory.db`
- **lastMessages:** Keeps last 10 messages in context for continuity
- **workingMemory:** 
  - Enabled: true
  - Scope: "resource" (per-user, across all threads)
  - Schema: `workingMemorySchema` from `../types/working-memory`
- **threads.generateTitle:** Auto-generates thread titles from first message

---

## Caching

Memory instances are cached in memory to avoid recreating on every request:
- Cache key: `agentId` (UUID)
- Cache lifetime: For the duration of the Node.js process
- Cache invalidation: Manual restart required (or process restart)

---

## File Paths

Memory databases are stored at:
- `_tables/agents/{folder-name}/memory.db`

The folder name is derived from scanning directories that end with `-{agentId}`.

---

## Frontend Consumers

| Component | Hook | Description |
|-----------|------|-------------|
| Chat components | Various | Uses Memory for conversation persistence |
| Thread management | Various | Uses Memory for thread operations |

---

## Notes

- Memory instances are created lazily (on first access)
- Agent directories are created automatically if they don't exist
- UUID to folder mapping is done by matching folder names ending with `-{uuid}`
- The service uses synchronous file operations for folder scanning (blocking, but fast for small directories)
