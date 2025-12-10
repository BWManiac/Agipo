# Agent Creator Service

This service handles the creation of new AI agents with folder-based storage structure.

## Folder Structure

Agents are created in folders with the format: `{name-slug}-{uuid}/`

Example:
- Name: "Test Agent"
- Agent ID (UUID): `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- Folder: `test-agent-a1b2c3d4-e5f6-7890-abcd-ef1234567890/`
- Config file: `test-agent-a1b2c3d4-e5f6-7890-abcd-ef1234567890/config.ts`

## Functions

### `generateAgentId(): string`

Generates a UUID v4 for use as an agent ID.

**Returns:** UUID string (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

**Implementation:** Uses Node.js `crypto.randomUUID()`

---

### `slugify(name: string): string`

Converts a name to a URL-friendly slug.

**Parameters:**
- `name` - The agent name (e.g., "Test Agent")

**Returns:** Slug string (e.g., "test-agent")

**Process:**
1. Converts to lowercase
2. Trims whitespace
3. Replaces non-alphanumeric characters with hyphens
4. Removes leading/trailing hyphens

---

### `generateFolderName(name: string, agentId: string): string`

Generates a folder name from agent name and UUID.

**Parameters:**
- `name` - The agent name
- `agentId` - The agent UUID

**Returns:** Folder name (e.g., `test-agent-a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

**Format:** `{name-slug}-{uuid}`

---

### `generateAgentFileContent(...): string`

Generates the TypeScript file content for an agent config.

**Parameters:**
- `agentId` - UUID identifier
- `name` - Display name
- `role` - Agent role
- `systemPrompt` - System prompt/instructions
- `model` - LLM model identifier
- `avatar` - Avatar URL or identifier
- `description` - Agent description
- `objectives` - Array of objectives
- `guardrails` - Array of guardrails
- `isManager` - Optional: whether agent is a manager
- `subAgentIds` - Optional: array of sub-agent IDs

**Returns:** TypeScript file content as string

**Format:** Exports a const with camelCase ID (e.g., `a1b2c3d4Agent`) of type `AgentConfig`

---

### `createAgentFolder(folderPath: string): Promise<void>`

Creates the agent folder directory.

**Parameters:**
- `folderPath` - Full path to the folder to create

**Throws:** Error if folder creation fails

---

### `createAgentConfigFile(folderPath: string, content: string): Promise<void>`

Creates the agent config file in the folder.

**Parameters:**
- `folderPath` - Path to the agent folder
- `content` - TypeScript file content

**File:** Creates `{folderPath}/config.ts`

**Throws:** Error if file write fails

---

### `updateAgentsIndex(folderName: string, agentId: string): Promise<void>`

Updates the agents index.ts file to include the new agent.

**Parameters:**
- `folderName` - The folder name (e.g., `test-agent-{uuid}`)
- `agentId` - The agent UUID

**Process:**
1. Reads `_tables/agents/index.ts`
2. Adds import statement: `import { {camelCaseId}Agent } from "./{folderName}/config";`
3. Adds agent to `agents` array: `{camelCaseId}Agent`
4. Writes updated content back

**Regex Strategy:**
- Finds `export const agents = [...];` pattern
- Inserts import after existing imports (or at top if none)
- Adds agent to array

**Throws:** Error if index file not found or pattern not matched

---

### `createAgent(...): Promise<{ agentId: string; folderName: string }>`

Main orchestrator function to create an agent.

**Parameters:**
- `name` - Agent name (required)
- `role` - Agent role (required)
- `systemPrompt` - System prompt/instructions (required)
- `model` - LLM model identifier (required)
- `avatar` - Avatar URL or identifier (required)
- `description` - Agent description (required)
- `objectives` - Array of objectives (default: `[]`)
- `guardrails` - Array of guardrails (default: `[]`)
- `isManager` - Whether agent is a manager (default: `false`)
- `subAgentIds` - Array of sub-agent IDs (default: `[]`)

**Returns:** Object with `agentId` and `folderName`

**Process:**
1. Generates UUID agent ID
2. Creates folder name from name + UUID
3. Creates folder directory
4. Generates and writes config.ts file
5. Updates index.ts to include new agent

**Rollback:**
- If index update fails: Deletes config file and folder
- If config file creation fails: Deletes folder
- Ensures no partial state remains

**Throws:** Error if any step fails (with automatic rollback)

---

## Error Handling

All operations include rollback logic:
- **Folder creation fails:** No rollback needed
- **Config file creation fails:** Folder is deleted
- **Index update fails:** Config file and folder are deleted

This ensures the system never enters a partial state.

---

## Frontend Consumers

| Component | Description |
|-----------|-------------|
| `CreateFromScratchWizard` | Uses `createAgent()` via POST `/api/workforce/create` |

---

## Notes

- Agent IDs are UUIDs to ensure global uniqueness
- Folder names combine slugified name with UUID for readability
- Index.ts updates use regex to preserve formatting
- All file operations are atomic with rollback support
- Manager agents can have `subAgentIds` array populated
