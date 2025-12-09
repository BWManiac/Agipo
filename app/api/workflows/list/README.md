# List Workflows

> Retrieves a complete list of all saved workflow definitions with full summary information.

**Endpoint:** `GET /api/workflows/list`  
**Auth:** None

---

## Purpose

Enables users to see all workflows they've created with complete summary information. This powers the main workflows list page where users can browse, select, and manage their workflows. Returns full workflow summaries including step counts, modification dates, and publication status.

---

## Approach

Calls the storage service to scan the workflows directory and read all workflow.json files. Each workflow is validated and transformed into a WorkflowSummary object with all metadata fields populated. This provides a complete view of all workflows for management purposes.

---

## Pseudocode

```
GET(): NextResponse
├── **Call `listWorkflows()`** from storage service
├── Returns WorkflowSummary[] with:
│   ├── id, name, description
│   ├── stepCount (calculated from steps array)
│   ├── lastModified
│   └── published status
├── Return workflows array directly
└── On error: Return 500 with error message
```

---

## Input

None

---

## Output

| Field | Type | Description |
|-------|------|-------------|
| `workflows` | array | Array of workflow summaries (returned directly, not wrapped) |

**Example Response:**
```json
[
  {
    "id": "wf-abc123",
    "name": "Email Digest",
    "description": "Sends daily email digest",
    "stepCount": 3,
    "lastModified": "2025-12-07T00:00:00.000Z",
    "published": true
  }
]
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Workflows List Page | `app/(pages)/workflows/page.tsx` | Display workflows in grid with full details |

---

## Related Docs

- Workflow Storage Service - `app/api/workflows/services/storage/crud.ts`
- `/api/workflows/available` - Returns simplified format for selection UIs

---

## Notes

This endpoint returns workflows as a direct array, not wrapped in an object. This matches the expected format for the workflows list page component.

---

## Future Improvements

- [ ] Add filtering and sorting query parameters
- [ ] Add pagination for large workflow collections
- [ ] Add search functionality

