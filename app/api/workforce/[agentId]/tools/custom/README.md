# Custom Tools

> Enables users to assign custom workflow tools to their agents.

**Endpoint:** `GET/POST /api/workforce/[agentId]/tools/custom`  
**Auth:** None

---

## Purpose

Manages which custom tools are assigned to an agent. Custom tools are user-defined workflow tools stored in `_tables/tools/`. Unlike connection tools, custom tools don't require external authentication - they're internal capabilities built within the platform.

---

## Approach

We store an array of tool IDs in the agent configuration. The IDs reference tools in the `_tables/tools/` directory. When the agent runs, it loads these tools dynamically from the filesystem.

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
├── Parse body with Zod (toolIds array)
├── **Call `updateAgentTools(agentId, toolIds)`**
└── Return { success, toolIds }
```

---

## Input (POST)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `toolIds` | string[] | Yes | Array of custom tool IDs |

**Example Request:**
```json
{
  "toolIds": ["workflow-data-analysis", "workflow-report-generator"]
}
```

---

## Output

**GET Response:**
```json
{
  "toolIds": ["workflow-data-analysis"]
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| CustomToolEditorPanel | `app/(pages)/workforce/components/agent-modal/` | Tool assignment UI |

---

## Future Improvements

- [ ] Validate tool IDs exist before saving
- [ ] Add tool categories/tags
