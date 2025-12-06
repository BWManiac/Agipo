# Update Tool

> Enables users to save changes to an existing workflow tool.

**Endpoint:** `PUT /api/tools/[toolId]/update`  
**Auth:** None

---

## Purpose

Updates an existing tool definition with new workflow data. When users modify a workflow in the editor and save, this endpoint persists those changes. The workflow is also re-transpiled to update the executable code.

---

## Approach

We validate the request body, save the updated definition to storage, then re-transpile the workflow into executable code. Like create, transpilation failures are logged but don't fail the request.

---

## Pseudocode

```
PUT(request, { params }): NextResponse
├── Extract toolId from params
├── Parse and validate body with Zod
├── **Call `saveToolDefinition(toolId, data)`**
├── **Call `transpileWorkflowToTool()`** to regenerate code
├── **Call `saveToolExecutable()`** to update .js file
└── Return updated workflow
```

---

## Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `toolId` | string (path) | Yes | Tool identifier |
| `name` | string | Yes | Tool display name |
| `description` | string | No | What the tool does |
| `nodes` | Node[] | Yes | Workflow nodes |
| `edges` | Edge[] | Yes | Workflow connections |
| `apiKeys` | Record | No | API keys for nodes |

**Example Request:**
```json
{
  "name": "Email Summary v2",
  "description": "Updated email summarizer",
  "nodes": [...],
  "edges": [...]
}
```

---

## Output

Returns the updated tool definition.

```json
{
  "id": "email-summary",
  "name": "Email Summary v2",
  "description": "Updated email summarizer",
  "nodes": [...],
  "edges": [...]
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| WorkflowEditor | `app/(pages)/tools/editor/` | Save workflow changes |

---

## Notes

- Re-transpiles workflow on every save
- Overwrites the existing definition entirely
