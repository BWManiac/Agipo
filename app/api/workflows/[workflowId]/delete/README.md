# Delete Workflow

> Permanently removes a workflow and all associated files, enabling users to clean up workflows they no longer need.

**Endpoint:** `DELETE /api/workflows/[workflowId]/delete`  
**Auth:** None

---

## Purpose

Enables users to delete workflows they've created but no longer need. This removes the workflow definition (workflow.json), any transpiled code (workflow.ts), and the entire workflow directory. This is a destructive operation that cannot be undone, so users should be certain before deleting. Useful for cleaning up test workflows, outdated versions, or workflows that are no longer relevant.

---

## Approach

Extracts the workflowId from route parameters and first checks if the workflow exists by attempting to read it. If the workflow doesn't exist, returns 404. If it exists, calls the storage service to delete the entire workflow directory recursively, removing all associated files. Returns success confirmation once deletion is complete.

---

## Pseudocode

```
DELETE(request, context): NextResponse
├── Extract workflowId from route params
├── **Call `readWorkflow(workflowId)`** to verify existence
├── If workflow not found:
│   └── Return 404 with error message
├── **Call `deleteWorkflow(workflowId)`** from storage service
│   ├── Removes workflow directory recursively
│   ├── Deletes workflow.json
│   └── Deletes workflow.ts (if exists)
├── Return success message (200)
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
| `message` | string | Success confirmation message |

**Example Response:**
```json
{
  "message": "Workflow deleted"
}
```

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Workflows List Page | `app/(pages)/workflows/page.tsx` | Delete workflow from dropdown menu |

---

## Related Docs

- Workflow Storage Service - `app/api/workflows/services/storage/crud.ts`

---

## Notes

This is a permanent deletion - there is no undo or recovery. The workflow directory and all files are removed from disk. Consider adding a confirmation dialog in the UI before calling this endpoint.

---

## Future Improvements

- [ ] Add soft delete (mark as deleted, recoverable)
- [ ] Add deletion confirmation token
- [ ] Add audit logging for deletions

