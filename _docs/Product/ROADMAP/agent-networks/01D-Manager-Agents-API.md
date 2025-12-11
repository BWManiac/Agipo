# Manager Agents - API Specification

**Feature:** Manager Agents (Agent Networks)  
**Task Document:** `01A-Manager-Agents-Task.md`  
**Implementation Phases:** `01C-Manager-Agents-Phases.md`

---

## API Endpoints Overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/workforce/managers` | List all managers |
| POST | `/api/workforce/managers` | Create new manager |
| GET | `/api/workforce/managers/[managerId]` | Get manager config |
| PATCH | `/api/workforce/managers/[managerId]` | Update manager config |
| DELETE | `/api/workforce/managers/[managerId]` | Delete manager |
| GET | `/api/workforce/managers/[managerId]/team` | Get sub-agents list |
| POST | `/api/workforce/managers/[managerId]/network` | Execute network chat |

---

## 1. List Managers

### Request
```http
GET /api/workforce/managers
Authorization: Bearer <clerk-token>
```

### Response
```typescript
{
  success: true,
  managers: Array<{
    id: string;
    name: string;
    role: string;
    avatar: string;
    status: "active" | "paused" | "draft";
    description: string;
    subAgentCount: number;
    lastActivity: string;
    highlight: string;
  }>
}
```

### Error Response
```typescript
{
  success: false,
  error: string
}
```

---

## 2. Create Manager

### Request
```http
POST /api/workforce/managers
Authorization: Bearer <clerk-token>
Content-Type: application/json

{
  name: string;                    // Required
  role?: string;                   // Default: "Manager"
  avatar?: string;                 // URL or emoji
  description: string;             // Required
  instructions: string;            // Required - delegation instructions
  model?: string;                  // Default: "google/gemini-2.5-flash"
  subAgentIds: string[];          // Required - at least one
  toolIds?: string[];             // Optional manager tools
  workflowBindings?: Array<{     // Optional manager workflows
    workflowId: string;
  }>;
  objectives?: string[];          // Optional objectives
  guardrails?: string[];          // Optional guardrails
}
```

### Response
```typescript
{
  success: true,
  managerId: string,
  folderName: string,
  manager: ManagerConfig
}
```

### Validation Rules
- `name`: Required, 1-100 characters
- `instructions`: Required, 10-5000 characters  
- `subAgentIds`: Required, at least 1 valid agent ID
- `model`: Must be valid model from AVAILABLE_MODELS

---

## 3. Get Manager

### Request
```http
GET /api/workforce/managers/[managerId]
Authorization: Bearer <clerk-token>
```

### Response
```typescript
{
  success: true,
  manager: {
    id: string;
    name: string;
    role: string;
    avatar: string;
    status: "active" | "paused" | "draft";
    description: string;
    instructions: string;
    model: string;
    subAgentIds: string[];
    toolIds?: string[];
    workflowBindings?: WorkflowBinding[];
    connectionToolBindings?: ConnectionToolBinding[];
    objectives?: string[];
    guardrails?: string[];
    highlight: string;
    lastActivity: string;
    createdAt: string;
    updatedAt: string;
  }
}
```

---

## 4. Update Manager

### Request
```http
PATCH /api/workforce/managers/[managerId]
Authorization: Bearer <clerk-token>
Content-Type: application/json

{
  name?: string;
  role?: string;
  avatar?: string;
  description?: string;
  instructions?: string;
  model?: string;
  subAgentIds?: string[];
  toolIds?: string[];
  workflowBindings?: WorkflowBinding[];
  objectives?: string[];
  guardrails?: string[];
  status?: "active" | "paused" | "draft";
}
```

### Response
```typescript
{
  success: true,
  updated: string[],  // List of updated fields
  manager: ManagerConfig
}
```

### Update Logic
- Uses regex replacement in config.ts file
- Updates `updatedAt` timestamp
- Validates model if provided
- Validates subAgentIds if provided

---

## 5. Delete Manager

### Request
```http
DELETE /api/workforce/managers/[managerId]
Authorization: Bearer <clerk-token>
```

### Response
```typescript
{
  success: true,
  message: "Manager deleted successfully"
}
```

### Deletion Logic
- Removes entire manager folder from `_tables/managers/`
- Includes config.ts and memory.db

---

## 6. Get Manager Team

### Request
```http
GET /api/workforce/managers/[managerId]/team
Authorization: Bearer <clerk-token>
```

### Response
```typescript
{
  success: true,
  subAgents: Array<{
    id: string;
    name: string;
    role: string;
    avatar: string;
    description: string;
    status: "active" | "paused" | "draft";
    toolCount: number;
    workflowCount: number;
  }>
}
```

### Team Loading Logic
- Loads each agent config from subAgentIds
- Returns agent metadata for UI display
- Skips missing agents with warning

---

## 7. Manager Network Chat

### Request
```http
POST /api/workforce/managers/[managerId]/network
Authorization: Bearer <clerk-token>
Content-Type: application/json

{
  message: string;          // User message
  threadId?: string;        // Optional thread for context
}
```

### Response (Server-Sent Events)
```
Content-Type: text/event-stream

data: {"type":"delegation","agentId":"agent-123","agentName":"Resume Tailor","message":"Delegating to Resume Tailor Agent..."}

data: {"type":"agent-event","agentId":"agent-123","event":{"type":"tool-call","tool":"generateResume","args":{"jobDescription":"..."}}}

data: {"type":"delegation-complete","agentId":"agent-123","result":"Resume tailored successfully"}

data: {"type":"network-step","result":"I've delegated the task to Resume Tailor Agent. The resume has been customized for the position."}

data: {"type":"done"}
```

### Event Types

| Type | Description | Payload |
|------|-------------|---------|
| `delegation` | Starting delegation to sub-agent | `{agentId, agentName, message}` |
| `agent-event` | Sub-agent execution event | `{agentId, event}` |
| `delegation-complete` | Sub-agent finished | `{agentId, result}` |
| `network-step` | Network step complete | `{result}` |
| `error` | Error occurred | `{error, agentId?}` |
| `done` | Stream complete | `{}` |

### Network Execution Flow
1. Create manager agent with sub-agents
2. Call `manager.network(message)`
3. Stream events as SSE
4. Transform Mastra events to frontend format
5. Close stream on completion

---

## Common Headers

All endpoints require:
```
Authorization: Bearer <clerk-token>
```

All POST/PATCH endpoints require:
```
Content-Type: application/json
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing or invalid auth |
| 404 | Not Found - Manager not found |
| 409 | Conflict - Manager name already exists |
| 500 | Internal Server Error |

---

## Rate Limiting

- Standard API endpoints: 100 requests/minute
- Network chat endpoint: 10 concurrent connections
- SSE streams timeout after 2 minutes

---

## Implementation Notes

### File Storage Pattern
```
_tables/
├── managers/
│   ├── job-application-manager-uuid/
│   │   ├── config.ts
│   │   └── memory.db
│   └── sales-manager-uuid/
│       ├── config.ts
│       └── memory.db
```

### Config File Format
```typescript
import type { ManagerConfig } from "@/_tables/types";

export const config: ManagerConfig = {
  id: "uuid",
  name: "Job Application Manager",
  role: "Manager",
  // ... full config
};

export default config;
```

### Memory Integration
- Mastra automatically creates memory.db
- Use `getManagerMemory(managerId)` helper
- Memory persists delegation context

---

## Testing Endpoints

### Create Test Manager
```bash
curl -X POST http://localhost:3000/api/workforce/managers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Manager",
    "description": "Test manager for QA",
    "instructions": "Delegate all tasks to appropriate agents",
    "subAgentIds": ["agent-1", "agent-2"]
  }'
```

### Test Network Chat
```bash
curl -X POST http://localhost:3000/api/workforce/managers/[managerId]/network \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message": "Help me with a task"}'
```