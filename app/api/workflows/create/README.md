# Create Workflow

> Creates a new workflow definition with a generated ID, enabling users to start building workflows from scratch.

**Endpoint:** `POST /api/workflows/create`  
**Auth:** None

---

## Purpose

Enables users to create a new workflow by providing a name and optional description. This is the entry point for workflow creation - users start here before opening the workflow editor. The system generates a unique workflow ID automatically, so the workflowId parameter in the URL is ignored. Once created, users can open the workflow in the editor to add steps and configure it.

---

## Approach

Validates the request body using Zod schema to ensure name is provided and non-empty. Calls the storage service to create a new workflow with a generated ID using nanoid. If a description is provided, it's saved immediately. The workflow is created with default empty structure (no steps, empty schemas) ready for editing.

---

## Pseudocode

```
POST(request): NextResponse
├── Parse and validate request body with Zod schema
├── Extract name (required) and description (optional)
├── **Call `createWorkflow(name)`** from storage service
│   ├── Generates unique ID (wf-{nanoid})
│   ├── Creates empty workflow structure
│   └── Writes workflow.json to disk
├── If description provided:
│   ├── Update workflow.description
│   └── **Call `writeWorkflow()`** to save
├── Return created workflow (201 status)
└── On validation error: Return 400 with Zod issues
└── On server error: Return 500 with error message
```

---

## Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Workflow name (min 1 character) |
| `description` | string | No | Optional workflow description |

**Example Request:**
```json
{
  "name": "Email Digest Workflow",
  "description": "Sends daily email digest to team"
}
```

**Note:** This endpoint is at the collection level (no workflowId in path) - a new ID is always generated.

---

## Output

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Generated workflow ID (wf-{nanoid}) |
| `name` | string | Workflow name |
| `description` | string | Workflow description |
| `steps` | array | Empty array (no steps yet) |
| `createdAt` | string | ISO timestamp |
| `lastModified` | string | ISO timestamp |

**Example Response:**
```json
{
  "id": "wf-abc123xyz",
  "name": "Email Digest Workflow",
  "description": "Sends daily email digest to team",
  "steps": [],
  "inputSchema": { "type": "object", "properties": {}, "required": [] },
  "outputSchema": { "type": "object", "properties": {}, "required": [] },
  "createdAt": "2025-12-07T00:00:00.000Z",
  "lastModified": "2025-12-07T00:00:00.000Z",
  "createdBy": "user",
  "published": false
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Create Workflow Modal | `app/(pages)/workflows/components/CreateWorkflowModal.tsx` | Create new workflow from modal form |

---

## Related Docs

- Workflow Storage Service - `app/api/workflows/services/storage/crud.ts`
- Workflow Types - `app/api/workflows/types/workflow.ts`

---

## Notes

This endpoint is at the collection level, following RESTful conventions. The backend always generates a fresh ID to prevent ID conflicts and ensure uniqueness.

---

## Future Improvements

- [ ] Add template support (create from template)
- [ ] Add duplicate workflow functionality
- [ ] Add initial step creation option

