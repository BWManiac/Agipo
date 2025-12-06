# Read Tool

> Enables users to load a specific tool definition for viewing or editing.

**Endpoint:** `GET /api/tools/[toolId]/read`  
**Auth:** None

---

## Purpose

Retrieves the full data for a single tool definition. This is used when opening a workflow in the editor to load all nodes, edges, and configuration. Returns 404 if the tool doesn't exist.

---

## Approach

We extract the tool ID from the URL path and call the storage service to fetch the tool definition. If found, we return the full definition including nodes and edges.

---

## Pseudocode

```
GET(request, { params }): NextResponse
├── Extract toolId from params
├── **Call `getToolDefinition(toolId)`** from storage
├── If not found: Return 404
└── Return tool definition
```

---

## Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `toolId` | string (path) | Yes | Tool identifier |

---

## Output

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Tool identifier |
| `name` | string | Display name |
| `description` | string | What the tool does |
| `nodes` | Node[] | Workflow nodes |
| `edges` | Edge[] | Workflow connections |

**Example Response:**
```json
{
  "id": "email-summary",
  "name": "Email Summary",
  "description": "Summarizes email threads",
  "nodes": [{ "id": "1", "type": "input" }],
  "edges": [{ "source": "1", "target": "2" }]
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| WorkflowEditor | `app/(pages)/tools/editor/` | Load workflow for editing |
