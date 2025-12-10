# Agent Creation API (`/api/workforce/create`)

**Method:** `POST`

## Purpose
Creates a new AI agent with folder-based storage structure.

## Authentication
Requires Clerk authentication. Returns 401 if user is not authenticated.

## Request Body

`CreateAgentBodySchema` (JSON):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Agent display name (min 2 characters) |
| `role` | string | Yes | Agent role (min 2 characters) |
| `systemPrompt` | string | Yes | System prompt/instructions (min 10 characters) |
| `model` | string | Yes | LLM model identifier |
| `avatar` | string | No | Avatar URL or identifier (default: "") |
| `description` | string | No | Agent description (default: "") |
| `objectives` | string[] | No | Array of objectives (default: []) |
| `guardrails` | string[] | No | Array of guardrails (default: []) |
| `isManager` | boolean | No | Whether agent is a manager (default: false) |
| `subAgentIds` | string[] | No | Array of sub-agent IDs (default: []) |

## Response

### Success (201)
```json
{
  "success": true,
  "agentId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "folderName": "test-agent-a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "Agent created successfully"
}
```

### Validation Error (400)
```json
{
  "message": "Invalid request body",
  "issues": [
    {
      "path": ["name"],
      "message": "Name must be at least 2 characters"
    }
  ]
}
```

### Server Error (500)
```json
{
  "message": "Failed to create agent"
}
```

## Process

1. Authenticates user via Clerk
2. Validates request body with Zod schema
3. Calls `createAgent()` service which:
   - Generates UUID agent ID
   - Creates folder: `{name-slug}-{uuid}/`
   - Creates config file: `{folder}/config.ts`
   - Updates `_tables/agents/index.ts`
4. Returns agent ID and folder name

## Error Handling

- **Authentication failure:** Returns 401
- **Validation failure:** Returns 400 with Zod issues
- **Service failure:** Returns 500 with error message
- **Rollback:** Service automatically rolls back on failure (deletes created files/folders)

## Frontend Consumers

| Component | Description |
|-----------|-------------|
| `CreateFromScratchWizard` | Submits agent creation form |

## Notes

- Agent IDs are UUIDs for global uniqueness
- Folder names combine slugified name with UUID
- All operations are atomic with rollback support
- Changes take effect immediately (agent appears in roster)
