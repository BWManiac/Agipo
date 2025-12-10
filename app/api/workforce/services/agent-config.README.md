# Agent Config Service

This service manages agent configuration files stored in a folder-based structure.

## Folder Structure

Agents are stored in folders with the format: `{name-slug}-{uuid}/`

Example:
- Folder: `test-agent-a1b2c3d4-e5f6-7890-abcd-ef1234567890/`
- Config file: `test-agent-a1b2c3d4-e5f6-7890-abcd-ef1234567890/config.ts`
- Agent ID (UUID): `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

## Functions

### `getAgentCustomTools(agentId: string): string[]`

Gets the custom tool IDs assigned to an agent.

**Parameters:**
- `agentId` - The agent's UUID identifier

**Returns:** Array of tool IDs

**Implementation:** Reads from the agent's config via `getAgentById()` from `@/_tables/agents`

---

### `getAgentConnectionToolBindings(agentId: string): ConnectionToolBinding[]`

Gets the connection tool bindings assigned to an agent.

**Parameters:**
- `agentId` - The agent's UUID identifier

**Returns:** Array of connection tool bindings

**Implementation:** Reads from the agent's config via `getAgentById()` from `@/_tables/agents`

---

### `updateAgentTools(agentId: string, toolIds: string[]): Promise<void>`

Updates the list of tools assigned to an agent by modifying the source file.

**Parameters:**
- `agentId` - The agent's UUID identifier
- `toolIds` - Array of tool IDs to assign

**Process:**
1. Maps UUID `agentId` to folder name using `getAgentFolderPath()`
2. Reads `{folder}/config.ts`
3. Updates `toolIds` array using regex replacement
4. Writes updated content back to file

**Throws:** Error if agent folder not found or file read/write fails

---

### `updateConnectionToolBindings(agentId: string, bindings: ConnectionToolBinding[]): Promise<void>`

Updates the connection tool bindings assigned to an agent by modifying the source file.

**Parameters:**
- `agentId` - The agent's UUID identifier
- `bindings` - Array of connection tool bindings

**Process:**
1. Maps UUID `agentId` to folder name using `getAgentFolderPath()`
2. Reads `{folder}/config.ts`
3. Updates or adds `connectionToolBindings` field using regex replacement
4. Writes updated content back to file

**Throws:** Error if agent folder not found or file read/write fails

---

## Helper Functions

### `getAgentFolderPath(agentId: string): Promise<string | null>`

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

## File Paths

All file operations use the folder-based structure:
- Config file: `_tables/agents/{folder-name}/config.ts`
- Memory DB: `_tables/agents/{folder-name}/memory.db` (managed by memory service)

---

## Frontend Consumers

| Component | Hook | Description |
|-----------|------|-------------|
| `ToolEditor` | `useCustomTools` | Dialog for assigning custom tools |
| `CapabilitiesTab` | `useAgentDetails` | Displays assigned tools |
| `ConnectionToolEditorPanel` | Various | Manages connection tool bindings |

---

## Notes

- The service uses regex-based file updates to preserve formatting
- Changes take effect immediately for new chat sessions
- Folder scanning is performed on-demand (not cached)
- UUID to folder mapping is done by matching folder names ending with `-{uuid}`
