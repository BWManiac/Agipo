# Agent Tools (Legacy)

> Legacy endpoint for managing agent custom tools. Use the specific endpoints instead.

**Endpoint:** `GET/POST /api/workforce/[agentId]/tools`  
**Auth:** None

---

## Purpose

This is a legacy route maintained for backwards compatibility. It manages custom tool IDs assigned to an agent. New code should use the more specific endpoints:
- `/tools/custom` for custom workflow tools
- `/tools/connection` for connection-based tools

---

## Approach

Simply delegates to the agent config service to get or update the custom tool IDs array.

---

## Pseudocode

**GET:**
```
GET(request, { params }): NextResponse
├── Extract agentId from params
├── **Call `getAgentCustomTools(agentId)`**
└── Return { toolIds }
```

**POST:**
```
POST(request, { params }): NextResponse
├── Extract agentId from params
├── Parse and validate body with Zod
├── **Call `updateAgentTools(agentId, toolIds)`**
└── Return { success, toolIds }
```

---

## Input (POST)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `toolIds` | string[] | Yes | Array of custom tool IDs |

---

## Output

**GET Response:**
```json
{ "toolIds": ["workflow-my-tool"] }
```

**POST Response:**
```json
{ "success": true, "toolIds": ["workflow-my-tool"] }
```

---

## Notes

- **Deprecated** - Use `/tools/custom` instead
- Does not handle connection tools

---

## Future Improvements

- [ ] Remove after migration to specific endpoints
