# Retrieve Workflow

> Loads a complete workflow definition by ID, enabling the editor to display and edit existing workflows.

**Endpoint:** `GET /api/workflows/[workflowId]/retrieve`  
**Auth:** None

---

## Purpose

Enables users to open an existing workflow in the editor. When users navigate to a workflow editor page, this endpoint loads the complete workflow definition including all steps, mappings, schemas, and configuration. This is the primary way workflows are loaded for editing - the editor needs the full definition to render the canvas, nodes, and connections.

---

## Approach

Extracts the workflowId from the route parameters and calls the storage service to read the workflow.json file from disk. The workflow is validated against the WorkflowDefinition schema to ensure it's properly formatted. If the workflow doesn't exist, returns 404. The full workflow definition is returned, ready for the editor to parse and display.

---

## Pseudocode

```
GET(request, context): NextResponse
├── Extract workflowId from route params
├── **Call `readWorkflow(workflowId)`** from storage service
│   ├── Reads workflow.json from disk
│   ├── Validates against WorkflowDefinition schema
│   └── Returns WorkflowDefinition or null
├── If workflow not found:
│   └── Return 404 with error message
├── Return full workflow definition (200)
└── On server error: Return 500 with error message
```

---

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workflowId` | string | Yes | Workflow ID from URL path |

---

## Output

| Field | Type | Description |
|-------|------|-------------|
| Full workflow definition | object | Complete WorkflowDefinition with all fields |

**Example Response:**
```json
{
  "id": "wf-abc123",
  "name": "Email Digest",
  "description": "Sends daily email digest",
  "inputSchema": { "type": "object", "properties": {...} },
  "outputSchema": { "type": "object", "properties": {...} },
  "steps": [
    {
      "id": "step-1",
      "name": "Fetch Emails",
      "type": "composio",
      "toolId": "GMAIL_FETCH_EMAILS",
      ...
    }
  ],
  "mappings": [...],
  "controlFlow": {...},
  "createdAt": "2025-12-01T00:00:00.000Z",
  "lastModified": "2025-12-07T00:00:00.000Z",
  "published": true
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Workflow Editor | `app/(pages)/workflows/editor/page.tsx` | Load workflow when editor opens |
| Workflow Loader Hook | `app/(pages)/workflows/editor/hooks/useWorkflowLoader.ts` | Fetch workflow data |

---

## Related Docs

- Workflow Storage Service - `app/api/workflows/services/storage/crud.ts`
- Workflow Types - `app/api/workflows/types/workflow.ts`

---

## Notes

This endpoint returns the complete workflow definition including all steps, mappings, and configuration. For list views that only need summaries, use `/api/workflows/list` instead.

---

## Future Improvements

- [ ] Add versioning support (retrieve specific version)
- [ ] Add caching headers for performance
- [ ] Add field selection (return only requested fields)

