# Available Workflows for Agent Assignment

> Returns all transpiled workflows available for assignment to agents.

**Endpoint:** `GET /api/workforce/[agentId]/workflows/available`  
**Auth:** Not required (agent scoped, but doesn't use agentId)

---

## Purpose

Lists all workflows that have been transpiled (have a `workflow.ts` file) and are available for assignment to agents. This powers the workflow selection UI in WorkflowEditorPanel. Only transpiled workflows are included because non-transpiled workflows cannot be executed.

---

## Approach

Scans `_tables/workflows/` directory, checks each workflow folder for `workflow.ts`, dynamically imports the file to extract `workflowMetadata` export, and constructs `WorkflowMetadata` objects with id, name, description, requiredConnections, and stepCount.

---

## Pseudocode

```
GET(request, { params }): NextResponse
├── Call listAvailableWorkflows() from workflow-loader service
├── Returns WorkflowMetadata[] with:
│   ├── id, name, description
│   ├── requiredConnections: string[] (toolkit slugs)
│   ├── stepCount: number
│   └── lastModified: string
├── Return { workflows: WorkflowMetadata[] }
└── Handle errors gracefully
```

---

## Input

None (agentId from path is accepted but not used)

---

## Output

**Response:**
```json
{
  "workflows": [
    {
      "id": "wf-abc123",
      "name": "Email Digest",
      "description": "Sends daily email digest",
      "requiredConnections": ["gmail", "slack"],
      "stepCount": 3,
      "lastModified": "2025-12-07T00:00:00.000Z"
    }
  ]
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| WorkflowEditorPanel | `app/(pages)/workforce/components/WorkflowEditorPanel.tsx` | Populate workflow selection list |
| useWorkflowAssignment | `app/(pages)/workforce/components/agent-modal/hooks/useWorkflowAssignment.ts` | Fetch available workflows for assignment UI |

---

## Related Docs

- Phase 10: Agent Integration - `_docs/_tasks/16-workflows-f/10-Phase10-Agent-Integration.md`
- Workflow Loader Service - `app/api/workflows/services/workflow-loader.ts`
- `/api/workflows/available` - Similar route but includes non-transpiled workflows (different purpose)

---

## Differences from `/api/workflows/available`

| Route | Purpose | Includes Non-Transpiled? |
|-------|---------|-------------------------|
| `/api/workforce/[agentId]/workflows/available` | Agent assignment UI | No (only transpiled) |
| `/api/workflows/available` | General workflow listing | Yes (all workflows) |

This route is specifically for agent assignment, so it filters to only executable (transpiled) workflows.



