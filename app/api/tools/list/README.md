# List Tools

> Enables users to see all custom workflow tools they've created.

**Endpoint:** `GET /api/tools/list`  
**Auth:** None

---

## Purpose

Retrieves all saved tool definitions (workflows) from the system. This powers the tools management page where users can view, edit, or delete their custom workflow tools. Each tool represents an automated workflow that agents can execute.

---

## Approach

We call the tools storage service to list all tool definitions from the `_tables/tools/` directory. Each tool's metadata (id, name, description, nodes, edges) is returned.

---

## Pseudocode

```
GET(): NextResponse
├── **Call `listToolDefinitions()`** from tools service
└── Return array of tool definitions
```

---

## Input

None

---

## Output

| Field | Type | Description |
|-------|------|-------------|
| `[]` | ToolDefinition[] | Array of tool definitions |
| `[].id` | string | Tool identifier |
| `[].name` | string | Display name |
| `[].description` | string | What the tool does |
| `[].nodes` | Node[] | Workflow nodes |
| `[].edges` | Edge[] | Workflow connections |

**Example Response:**
```json
[
  {
    "id": "workflow-data-analysis",
    "name": "Data Analysis",
    "description": "Analyze data and generate insights",
    "nodes": [...],
    "edges": [...]
  }
]
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| ToolsPage | `app/(pages)/tools/` | Tools list view |
| CustomToolEditorPanel | `app/(pages)/workforce/components/agent-modal/` | Available tools picker |
