# Workflows Storage CRUD Service

> Core CRUD operations for workflow definitions (workflow.json files).

**Service:** `crud.ts`  
**Domain:** Workflows → Storage

---

## Purpose

This service provides create, read, update, and delete operations for workflow definitions stored as workflow.json files. It handles workflow persistence, validation, and lifecycle management. Without this service, workflows couldn't be saved, loaded, or managed - the workflow editor would have no way to persist user work.

**Product Value:** Enables the workflow editor to save and load workflows. When users create workflows, edit them, or delete them, this service handles the file system operations, making workflows durable and manageable.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `readWorkflow()` | Loads a workflow definition from workflow.json with validation. | When loading a workflow for editing or execution |
| `writeWorkflow()` | Saves a workflow definition to workflow.json with automatic timestamp updates. | When saving workflows from the editor |
| `listWorkflows()` | Scans the workflows directory and returns summaries of all workflows. | When displaying the workflow list in the UI |
| `createWorkflow()` | Creates a new workflow with a generated ID and empty structure. | When users start a new workflow |
| `deleteWorkflow()` | Deletes a workflow directory and all associated files. | When users delete workflows |
| `workflowExists()` | Checks if a workflow file exists. | When validating workflow IDs |

---

## Approach

The service uses a package-based structure: `_tables/workflows/{workflowId}/workflow.json`. It validates workflow definitions using Zod schemas before writing, automatically updates lastModified timestamps, and handles file system operations with proper error handling. Workflows are stored as pretty-printed JSON for readability and version control.

---

## Public API

### `readWorkflow(id: string): Promise<WorkflowDefinition | null>`

**What it does:** Loads a workflow definition from its workflow.json file, validates it, and returns the parsed definition.

**Product Impact:** When users open workflows in the editor or workflows are executed, this function loads the definition, making workflows accessible.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Workflow identifier |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<WorkflowDefinition \| null> | Workflow definition or null if not found/invalid |

**Process:**

```
readWorkflow(id): Promise<WorkflowDefinition | null>
├── Build file path: _tables/workflows/{id}/workflow.json
├── **Try to read file**
├── Parse JSON content
├── **Validate against WorkflowDefinitionValidator** (Zod)
└── Return validated definition or null if not found/invalid
```

---

### `writeWorkflow(workflow: WorkflowDefinition): Promise<WorkflowDefinition>`

**What it does:** Saves a workflow definition to workflow.json, automatically updating the lastModified timestamp.

**Product Impact:** When users save their work in the workflow editor, this function persists it, making workflows durable and versionable.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workflow` | WorkflowDefinition | Yes | Complete workflow definition to save |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<WorkflowDefinition> | Saved workflow definition with updated lastModified |

**Process:**

```
writeWorkflow(workflow): Promise<WorkflowDefinition>
├── **Call `ensureDir()`** to ensure workflows directory exists
├── **Create workflow directory** if it doesn't exist
├── Update workflow.lastModified to current timestamp
├── Build file path: workflow.json
├── Write workflow with JSON.stringify(workflow, null, 2) for pretty printing
└── Return updated workflow
```

---

### `listWorkflows(): Promise<WorkflowSummary[]>`

**What it does:** Scans the workflows directory and returns summaries of all workflows with metadata.

**Product Impact:** Powers the workflow list UI where users see all their workflows. Provides the catalog of available workflows.

**Input:**

None

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<WorkflowSummary[]> | Array of workflow summaries with id, name, description, stepCount, published, lastModified |

**Process:**

```
listWorkflows(): Promise<WorkflowSummary[]>
├── **Call `ensureDir()`** to ensure directory exists
├── Scan _tables/workflows/ directory for subdirectories
├── Filter out dot-directories (hidden files)
├── **For each subdirectory:**
│   ├── **Call `readWorkflow(workflowId)`**
│   └── If workflow found: Extract summary (id, name, description, stepCount, published, lastModified)
├── Filter out null results
└── Return summaries array
```

---

### `createWorkflow(name?: string): Promise<WorkflowDefinition>`

**What it does:** Creates a new workflow with a generated ID and empty structure, ready for editing.

**Product Impact:** When users click "New Workflow" in the editor, this function creates the initial workflow file, enabling users to start building workflows from scratch.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | No | Optional workflow name (defaults to "Untitled Workflow") |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<WorkflowDefinition> | New workflow definition with generated ID and empty structure |

**Process:**

```
createWorkflow(name?): Promise<WorkflowDefinition>
├── **Call `ensureDir()`** to ensure directory exists
├── Generate unique ID: `wf-${nanoid(12)}`
├── Use name parameter or default to "Untitled Workflow"
├── **Call `createEmptyWorkflow(id, name)`** to create empty structure
├── **Call `writeWorkflow(workflow)`** to persist
└── Return created workflow
```

---

### `deleteWorkflow(id: string): Promise<boolean>`

**What it does:** Deletes a workflow directory and all associated files (workflow.json, workflow.ts, etc.).

**Product Impact:** When users delete workflows, this function removes all associated files, cleaning up storage and ensuring deleted workflows are fully removed.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Workflow identifier |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<boolean> | True if deletion succeeded, false if failed |

**Process:**

```
deleteWorkflow(id): Promise<boolean>
├── Build directory path: _tables/workflows/{id}
├── **Call `fs.rm(dir, { recursive: true, force: true })`** to delete directory
├── If successful: Return true
└── If error: Log and return false
```

---

### `workflowExists(id: string): Promise<boolean>`

**What it does:** Checks if a workflow file exists, useful for validation before operations.

**Product Impact:** Routes can validate workflow IDs before performing operations, preventing errors from invalid IDs.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Workflow identifier |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<boolean> | True if workflow exists, false otherwise |

**Process:**

```
workflowExists(id): Promise<boolean>
├── Build file path: _tables/workflows/{id}/workflow.json
├── **Try to access file**
└── Return true if accessible, false if not found
```

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `fs/promises` | File system operations |
| `nanoid` | Generate unique workflow IDs |
| `./utils` | Directory and path utilities |
| `../../types` | WorkflowDefinition, WorkflowSummary types and validators |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Workflows List Route | `app/api/workflows/list/route.ts` | Lists workflows |
| Workflow Detail Route | `app/api/workflows/[workflowId]/route.ts` | Reads, updates workflows |
| Workflow Create Route | `app/api/workflows/create/route.ts` | Creates new workflows |
| Workflow Delete Route | `app/api/workflows/[workflowId]/route.ts` | Deletes workflows |

---

## Design Decisions

### Why validation on read?

**Decision:** Workflow definitions are validated using Zod schemas when read.

**Rationale:** Ensures data integrity. Invalid workflows are rejected early, preventing execution errors. Validation catches schema mismatches and corrupted files.

### Why auto-update lastModified?

**Decision:** lastModified timestamp is automatically updated on write.

**Rationale:** Users shouldn't have to manage timestamps manually. Auto-updating ensures accurate metadata for sorting and freshness checks.

---

## Error Handling

- Missing files: `readWorkflow()` returns null gracefully
- Invalid schemas: Validation errors thrown (handled by caller)
- Delete failures: Returns false, errors logged
- Missing directories: Automatically created

---

## Related Docs

- [Workflow Loader Service README](../workflow-loader.README.md) - Loads workflows for execution (reads workflow.json)
- [Generated Code Service README](./generated-code.README.md) - Manages workflow.ts files

---

## Future Improvements

- [ ] Add workflow versioning/history
- [ ] Add workflow backup before delete
- [ ] Add workflow export/import
- [ ] Add workflow search/filtering in list
- [ ] Add workflow validation on write (check step consistency)

