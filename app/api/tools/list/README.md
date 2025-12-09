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
| `[]` | array | Array of tool definitions (returned directly, not wrapped) |

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
| Tools Page | `app/(pages)/tools/page.tsx` | Tools list view |
| Custom Tool Editor Panel | `app/(pages)/workforce/components/agent-modal/` | Available tools picker |

---

## Related Docs

- Tools Storage Service - `app/api/tools/services/storage.ts`
- `/api/tools/create` - Creates new tool definitions
- `/api/tools/[toolId]/read` - Retrieves a specific tool definition

---

## Notes

This endpoint returns tools as a direct array, not wrapped in an object. Tools are stored in `_tables/tools/` directory with both definition files (workflow.json) and executable code (tool.js).

---

## Future Improvements

- [ ] Add filtering and sorting query parameters
- [ ] Add pagination for large tool collections
- [ ] Add search functionality
