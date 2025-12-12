# API Specification: Agent Configuration Editing

**Feature:** Agent Configuration Editing  
**Phase Document:** `01C-Direct-Agent-Configuration-Editing-Phases.md`

---

## Endpoint: Update Agent Configuration

### PATCH `/api/workforce/[agentId]/config`

Updates configuration fields for an agent. Supports partial updates - only fields provided in the request body will be updated.

---

## Request

### Headers
```
Content-Type: application/json
Authorization: Bearer [clerk-token] (handled automatically by Clerk)
```

### URL Parameters
- `agentId` (string, required): The agent's UUID

### Body
```typescript
{
  systemPrompt?: string;      // Min 10 characters
  model?: string;             // Must be valid model ID from AVAILABLE_MODELS
  maxSteps?: number;          // Positive integer, no upper limit
  objectives?: string[];      // Array of objective strings
  guardrails?: string[];      // Array of guardrail strings
}
```

### Validation Rules
| Field | Rule | Error Message |
|-------|------|---------------|
| `systemPrompt` | Min 10 characters | "systemPrompt: Must be at least 10 characters" |
| `model` | Must exist in `AVAILABLE_MODELS` | "model: Invalid model ID" |
| `maxSteps` | Positive integer | "maxSteps: Must be positive integer" |
| `objectives` | Array of strings | No validation |
| `guardrails` | Array of strings | No validation |

---

## Response

### Success (200 OK)
```typescript
{
  success: boolean;           // true if at least one field updated
  updated: string[];          // Array of successfully updated field names
  errors?: string[];          // Array of validation errors (if any)
}
```

### Examples

#### All fields successful:
```json
{
  "success": true,
  "updated": ["systemPrompt", "model", "maxSteps"]
}
```

#### Partial success:
```json
{
  "success": true,
  "updated": ["systemPrompt"],
  "errors": ["model: Invalid model ID"]
}
```

#### All fields failed:
```json
{
  "success": false,
  "updated": [],
  "errors": [
    "systemPrompt: Must be at least 10 characters",
    "model: Invalid model ID"
  ]
}
```

### Error Responses

#### Unauthorized (401)
```json
{
  "error": "Unauthorized"
}
```

#### Agent Not Found (404)
```json
{
  "error": "Agent not found"
}
```

#### Server Error (500)
```json
{
  "error": "Failed to update configuration"
}
```

---

## Available Models

Valid model IDs that can be used in the `model` field:

```typescript
[
  "anthropic/claude-3-5-sonnet",
  "google/gemini-2.5-flash",
  "google/gemini-3-pro-preview",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "deepseek/deepseek-3.2"
]
```

---

## Usage Examples

### Update System Prompt Only
```bash
curl -X PATCH http://localhost:3000/api/workforce/abc-123/config \
  -H "Content-Type: application/json" \
  -d '{
    "systemPrompt": "You are a helpful AI assistant specialized in customer support."
  }'
```

### Update Multiple Fields
```bash
curl -X PATCH http://localhost:3000/api/workforce/abc-123/config \
  -H "Content-Type: application/json" \
  -d '{
    "systemPrompt": "You are an expert software developer.",
    "model": "google/gemini-2.5-flash",
    "maxSteps": 10,
    "objectives": ["Write clean code", "Follow best practices"],
    "guardrails": ["Never share sensitive data", "Be respectful"]
  }'
```

### Handle Validation Error
```bash
curl -X PATCH http://localhost:3000/api/workforce/abc-123/config \
  -H "Content-Type: application/json" \
  -d '{
    "systemPrompt": "Too short",
    "model": "invalid-model"
  }'

# Response:
# {
#   "success": false,
#   "updated": [],
#   "errors": [
#     "systemPrompt: Must be at least 10 characters",
#     "model: Invalid model ID"
#   ]
# }
```

---

## Implementation Notes

1. **Partial Updates**: The endpoint supports partial updates. Only fields present in the request body will be updated.

2. **Error Handling**: If some fields succeed and others fail, the successful updates are still applied. The response indicates which fields were updated and which had errors.

3. **File System Updates**: Changes are written directly to the agent's config.ts file in `_tables/agents/[folder]/config.ts`.

4. **No Backup**: Changes are immediate and permanent. Git version control is relied upon for history.

5. **Formatting**: The regex-based updates may affect file formatting, but TypeScript/Prettier will handle reformatting.

---

## Security Considerations

1. **Authentication**: Endpoint requires Clerk authentication via middleware
2. **Authorization**: Currently any authenticated user can update any agent (TODO: add ownership check)
3. **Input Sanitization**: Quotes in strings are escaped to prevent TypeScript syntax errors
4. **File System Access**: Only writes to designated agent config files

---

## Future Enhancements

1. **Agent Ownership**: Add check to ensure user owns the agent they're updating
2. **Audit Log**: Track who made changes and when
3. **WebSocket Updates**: Notify other users if agent config changes
4. **Batch Updates**: Support updating multiple agents at once
5. **Config Versioning**: Store previous versions for rollback