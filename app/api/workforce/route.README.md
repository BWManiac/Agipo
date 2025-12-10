# Workforce List API (`/api/workforce`)

**Method:** `GET`

## Purpose
Returns all agents in the system.

## Authentication
Requires Clerk authentication. Returns 401 if user is not authenticated.

## Response

### Success (200)
```json
{
  "agents": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Test Agent",
      "role": "Assistant",
      "avatar": "",
      "status": "active",
      "description": "A test agent",
      "systemPrompt": "You are a helpful assistant.",
      "model": "gpt-4",
      "toolIds": [],
      "connectionToolBindings": [],
      "quickPrompts": [],
      "objectives": [],
      "guardrails": [],
      "highlight": "",
      "lastActivity": "2024-01-01T00:00:00.000Z",
      "metrics": [],
      "assignedWorkflows": [],
      "capabilities": [],
      "insights": [],
      "activities": [],
      "feedback": []
    }
  ],
  "count": 1
}
```

### Authentication Error (401)
```json
{
  "message": "Unauthorized"
}
```

### Server Error (500)
```json
{
  "message": "Failed to fetch agents"
}
```

## Process

1. Authenticates user via Clerk
2. Reads agents from `_tables/agents/index.ts`
3. Returns array of `AgentConfig` objects

## Data Source

Agents are loaded from `@/_tables/agents` which exports the `agents` array.
This array is automatically maintained by the agent creation service.

## Frontend Consumers

| Component | Description |
|-----------|-------------|
| `WorkforceDashboard` | Fetches and displays agent roster |
| `CreateFromScratchWizard` | Refreshes agent list after creation |

## Notes

- Returns empty array if no agents exist
- Agents are loaded from TypeScript index file (not database)
- Changes take effect immediately after agent creation
