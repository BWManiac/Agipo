# Available Workflows

> Returns a simplified list of all workflows available for assignment to agents.

**Endpoint:** `GET /api/workflows/available`  
**Auth:** None

---

## Purpose

Enables users to see all workflows they've created in a simplified format suitable for agent assignment. This powers workflow selection UIs where users need to quickly browse and assign workflows to agents. Returns only essential metadata (name, description, step count) without the full workflow definition, making it faster to load and easier to scan.

---

## Approach

Calls the storage service to list all workflows, then transforms the full workflow summaries into a simplified format optimized for selection UIs. This endpoint includes all workflows regardless of transpilation status, making it suitable for general workflow browsing.

---

## Pseudocode

```
GET(request): NextResponse
├── **Call `listWorkflows()`** from storage service
├── Transform each workflow to simplified format:
│   ├── id, name, description
│   ├── stepCount (from steps array length)
│   ├── lastModified
│   └── published status
├── Return { workflows: WorkflowSummary[] }
└── On error: Return 500 with error message
```

---

## Input

None

---

## Output

| Field | Type | Description |
|-------|------|-------------|
| `workflows` | array | List of simplified workflow summaries |

**Example Response:**
```json
{
  "workflows": [
    {
      "id": "wf-abc123",
      "name": "Email Digest",
      "description": "Sends daily email digest",
      "stepCount": 3,
      "lastModified": "2025-12-07T00:00:00.000Z",
      "published": true
    }
  ]
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Agent Workflow Assignment | `app/(pages)/workforce/components/WorkflowEditorPanel.tsx` | Select workflows for agent assignment |

---

## Related Docs

- Workflow Storage Service - `app/api/workflows/services/storage/crud.ts`
- `/api/workflows/list` - Returns full workflow summaries (similar but different format)
- `/api/workforce/[agentId]/workflows/available` - Returns only transpiled workflows for agent assignment

---

## Notes

This endpoint returns all workflows regardless of whether they've been transpiled. For agent assignment scenarios where only executable workflows are needed, use `/api/workforce/[agentId]/workflows/available` instead.

---

## Future Improvements

- [ ] Add filtering by published status
- [ ] Add pagination for large workflow lists
- [ ] Add sorting options (name, lastModified, stepCount)

