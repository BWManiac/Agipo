# Available Custom Tools

> Enables users to see all custom workflow tools available to assign to their agents.

**Endpoint:** `GET /api/workforce/[agentId]/tools/custom/available`  
**Auth:** None

---

## Purpose

Lists all custom tools available in the system. Custom tools are workflow tools defined in `_tables/tools/` that can be assigned to any agent. This powers the tool selection UI where users choose which custom capabilities to give their agents.

---

## Approach

We call the tools service to list all tool definitions from the `_tables/tools/` directory. Each tool is loaded and its metadata (id, name, description) is returned. The agentId parameter is not used - all custom tools are available to all agents.

---

## Pseudocode

```
GET(): NextResponse
├── **Call `listToolDefinitions()`** from tools service
└── Return { tools }
```

---

## Input

None (agentId in path is not used for filtering)

---

## Output

| Field | Type | Description |
|-------|------|-------------|
| `tools` | ToolDefinition[] | Array of available tools |
| `tools[].id` | string | Tool identifier |
| `tools[].name` | string | Display name |
| `tools[].description` | string | What the tool does |

**Example Response:**
```json
{
  "tools": [
    {
      "id": "workflow-data-analysis",
      "name": "Data Analysis",
      "description": "Analyze data and generate insights"
    }
  ]
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| CustomToolEditorPanel | `app/(pages)/workforce/components/agent-modal/` | Populates tool picker |

---

## Notes

- Custom tools are loaded from filesystem at `_tables/tools/`
- Tools must follow the naming convention to be discovered

---

## Future Improvements

- [ ] Add tool categories
- [ ] Cache tool definitions

