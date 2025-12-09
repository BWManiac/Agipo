# Workflow Instance Operations

> Handles GET, PUT, and DELETE operations for a specific workflow instance.

**Endpoints:**
- `GET /api/workflows/[workflowId]` - Retrieve workflow
- `PUT /api/workflows/[workflowId]` - Update workflow
- `DELETE /api/workflows/[workflowId]` - Delete workflow

**Auth:** None

---

## Purpose

Provides standard CRUD operations for individual workflow instances. Enables the editor to load workflows, save changes, and delete unwanted workflows. All operations work on a specific workflow identified by its ID.

---

## GET /api/workflows/[workflowId]

Retrieves a specific workflow definition. Enables the editor to load a workflow when users navigate to it.

### Approach

Calls the storage service to read the workflow JSON file from disk. Returns 404 if the workflow doesn't exist.

### Pseudocode

```
GET(request, context): NextResponse
├── Extract workflowId from params
├── **Call `readWorkflow(workflowId)`** from storage service
├── If not found: Return 404
├── Return workflow JSON (200)
└── On error: Return 500
```

### Input

Path parameter: `workflowId` (string) - The workflow ID

### Output

Returns the complete workflow definition including all steps, mappings, and configuration.

**Example Response:**
```json
{
  "id": "wf-abc123xyz",
  "name": "Email Digest Workflow",
  "description": "Sends daily email digest",
  "steps": [...],
  "mappings": {...},
  "bindings": {...},
  "createdAt": "2025-12-07T00:00:00.000Z",
  "lastModified": "2025-12-07T00:00:00.000Z"
}
```

### Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Workflow Editor | `app/(pages)/workflows/editor/store/slices/persistenceSlice.ts` | Load workflow when opening editor |

---

## PUT /api/workflows/[workflowId]

Updates a workflow definition and transpiles to executable code.

### Approach

Validates the workflow definition, merges with existing workflow, saves to disk, and attempts transpilation. Accepts two formats: direct workflow object or wrapped format with separate bindings.

### Pseudocode

```
PUT(request, context): NextResponse
├── Extract workflowId from params
├── **Call `readWorkflow(workflowId)`** to get existing
├── If not found: Return 404
├── Parse request body (supports two formats)
│   ├── Format 1: Direct workflow object
│   └── Format 2: { definition: {...}, bindings: {...} }
├── Merge updates with existing workflow
├── Validate merged result with Zod
├── **Call `writeWorkflow()`** to save JSON (always succeeds)
├── Attempt transpilation:
│   ├── **Call `transpileWorkflow()`**
│   ├── If successful: **Call `writeWorkflowCode()`** to save .ts file
│   └── If errors: Include warnings in response
└── Return result with success status and file write status
```

### Input

Path parameter: `workflowId` (string) - The workflow ID

Body supports two formats:

**Format 1: Direct workflow object**
```json
{
  "id": "wf-abc123xyz",
  "name": "Updated Name",
  "steps": [...],
  "bindings": {...}
}
```

**Format 2: Wrapped format**
```json
{
  "definition": {
    "id": "wf-abc123xyz",
    "name": "Updated Name",
    "steps": [...]
  },
  "bindings": {...}
}
```

### Output

Returns the saved workflow and file write status.

**Example Response:**
```json
{
  "success": true,
  "workflow": {
    "id": "wf-abc123xyz",
    "name": "Updated Name",
    ...
  },
  "files": {
    "json": true,
    "ts": true
  },
  "warnings": []
}
```

### Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Workflow Editor | `app/(pages)/workflows/editor/store/slices/persistenceSlice.ts` | Save workflow changes |

---

## DELETE /api/workflows/[workflowId]

Deletes a workflow definition and all associated files.

### Approach

Calls the storage service to delete the workflow directory and all files (workflow.json, workflow.ts).

### Pseudocode

```
DELETE(request, context): NextResponse
├── Extract workflowId from params
├── **Call `readWorkflow(workflowId)`** to verify exists
├── If not found: Return 404
├── **Call `deleteWorkflow(workflowId)`** from storage service
│   ├── Deletes workflow directory
│   ├── Removes workflow.json
│   └── Removes workflow.ts (if exists)
├── If deletion failed: Return 500
└── Return success message (200)
```

### Input

Path parameter: `workflowId` (string) - The workflow ID

### Output

Returns a success message.

**Example Response:**
```json
{
  "message": "Workflow deleted"
}
```

### Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Workflows List Page | `app/(pages)/workflows/page.tsx` | Delete workflow from list |

---

## Related Docs

- Workflow Storage Service - `app/api/workflows/services/storage/crud.ts`
- Workflow Transpiler - `app/api/workflows/services/transpiler/index.ts`
- Workflow Types - `app/api/workflows/types/workflow.ts`
- `/api/workflows/create` - Create new workflow
- `/api/workflows/list` - List all workflows

---

## Notes

- The PUT endpoint always saves the JSON file, even if transpilation fails. This ensures editor state is never lost.
- Transpilation warnings are included in the response but don't fail the request.
- The workflow ID cannot be changed via PUT - it's always preserved from the URL parameter.

