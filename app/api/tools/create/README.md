# Create Tool

> Enables users to save a new custom workflow tool that agents can use.

**Endpoint:** `POST /api/tools/create`  
**Auth:** None

---

## Purpose

Creates a new tool definition (workflow) that can be assigned to agents. Users design workflows in the visual editor, and this endpoint persists them. The workflow is also transpiled into executable code that agents can run.

---

## Approach

We validate the request body using Zod, generate a unique slug-based ID, save the tool definition to storage, then transpile the workflow into executable JavaScript code. Transpilation failures are logged but don't fail the request - the workflow is still saved.

---

## Pseudocode

```
POST(request): NextResponse
├── Parse and validate body with Zod
├── Generate unique ID from name slug
│   ├── Slugify the name
│   └── **Call `ensureUniqueId()`** to avoid collisions
├── **Call `saveToolDefinition(id, data)`**
├── **Call `transpileWorkflowToTool()`** to generate code
├── **Call `saveToolExecutable()`** to save .js file
└── Return saved workflow with 201 status
```

---

## Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | No | Custom ID (auto-generated if omitted) |
| `name` | string | Yes | Tool display name |
| `description` | string | No | What the tool does |
| `nodes` | Node[] | Yes | Workflow nodes |
| `edges` | Edge[] | Yes | Workflow connections |
| `apiKeys` | Record | No | API keys for nodes |

**Example Request:**
```json
{
  "name": "Email Summary",
  "description": "Summarizes email threads",
  "nodes": [
    { "id": "1", "type": "input", "data": { ... } }
  ],
  "edges": [
    { "source": "1", "target": "2" }
  ]
}
```

---

## Output

Returns the saved tool definition with generated ID.

```json
{
  "id": "email-summary",
  "name": "Email Summary",
  "description": "Summarizes email threads",
  "nodes": [...],
  "edges": [...]
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| WorkflowEditor | `app/(pages)/tools/editor/` | Save workflow button |

---

## Notes

- Transpilation failures are logged but don't fail the save
- IDs are slugified from names (e.g., "My Tool" → "my-tool")

---

## Future Improvements

- [ ] Add version history
- [ ] Validate workflow structure before saving
