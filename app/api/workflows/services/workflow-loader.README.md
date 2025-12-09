# Workflow Loader Service

> Loads workflow definitions, metadata, and executables from the filesystem.

**Service:** `workflow-loader.ts`  
**Domain:** Workflows

---

## Purpose

This service provides operations for loading workflows from the filesystem, including metadata (from workflow.json) and executable code (from workflow.ts). It handles listing available workflows, retrieving metadata, loading executables for runtime execution, and validating workflow bindings. Without this service, workflows couldn't be loaded for execution or discovery.

**Product Value:** Enables workflows to be stored, discovered, and executed. When users create workflows in the editor or assign workflows to agents, this service loads the workflow files, making them available for execution. This is the bridge between workflow storage and runtime execution.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `listAvailableWorkflows()` | Scans the workflows directory and returns metadata for all transpiled workflows. | When displaying the workflow list in the UI or checking what workflows exist |
| `getWorkflowMetadata()` | Retrieves metadata for a specific workflow from workflow.json, including required connections. | When displaying workflow details or validating bindings |
| `getWorkflowExecutable()` | Loads the transpiled workflow.ts file and returns the executable workflow object. | When executing workflows at runtime (agents, API routes) |
| `validateWorkflowBinding()` | Validates that a workflow binding has all required connections provided. | When users assign workflows to agents - ensures bindings are complete |

---

## Approach

The service uses a package-based structure: `_tables/workflows/{workflowId}/workflow.json` (definition) and `_tables/workflows/{workflowId}/workflow.ts` (executable). It loads metadata from JSON to avoid dynamic import issues in Next.js, extracts required connections from workflow steps (excluding NO_AUTH toolkits), and uses dynamic imports with file:// URLs for executable loading. Only workflows with both files are considered "available."

---

## Public API

### `listAvailableWorkflows(): Promise<WorkflowMetadata[]>`

**What it does:** Scans the workflows directory and returns metadata for all workflows that have both workflow.json and workflow.ts files, sorted by most recently modified.

**Product Impact:** Powers the workflow list UI where users see all their available workflows. Also used by routes that need to enumerate workflows for assignment or execution.

**Input:**

None

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<WorkflowMetadata[]> | Array of workflow metadata with id, name, description, requiredConnections, stepCount, lastModified |

**Process:**

```
listAvailableWorkflows(): Promise<WorkflowMetadata[]>
├── Scan _tables/workflows/ directory for subdirectories
├── **For each subdirectory:**
│   ├── Check if workflow.ts exists (transpiled)
│   ├── **If exists:**
│   │   ├── **Call `getWorkflowMetadata(workflowId)`** to load metadata
│   │   └── If metadata found: Add to results
│   └── **If missing:** Skip workflow (not transpiled yet)
├── Sort results by lastModified descending
└── Return metadata array
```

---

### `getWorkflowMetadata(workflowId: string): Promise<WorkflowMetadata | null>`

**What it does:** Retrieves metadata for a specific workflow by reading workflow.json and checking for workflow.ts, extracting required connections from workflow steps.

**Product Impact:** Routes and UI need workflow metadata for display and validation. This function provides that information without loading the full executable, avoiding dynamic import issues in Next.js.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workflowId` | string | Yes | Workflow identifier |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<WorkflowMetadata \| null> | Workflow metadata with required connections and step count, or null if not found |

**Process:**

```
getWorkflowMetadata(workflowId): Promise<WorkflowMetadata | null>
├── Build file paths: workflow.json and workflow.ts
├── **Try to read workflow.json**
├── Parse JSON to WorkflowDefinition
├── **Verify workflow.ts exists** (transpiled)
├── Extract requiredConnections:
│   ├── Initialize empty Set
│   ├── **For each step in workflow.steps:**
│   │   ├── **If step.type === "composio" and step.toolkitSlug:**
│   │   │   └── **If toolkit not in NO_AUTH_TOOLKIT_SLUGS:**
│   │   │       └── Add toolkitSlug to requiredConnections Set
│   │   └── Skip non-composio steps and NO_AUTH toolkits
│   └── Convert Set to array
├── Build WorkflowMetadata object:
│   ├── id, name, description from workflow
│   ├── requiredConnections: array from Set
│   ├── stepCount: workflow.steps.length
│   └── lastModified: workflow.lastModified
└── Return metadata or null if not found
```

---

### `getWorkflowExecutable(workflowId: string): Promise<unknown | null>`

**What it does:** Loads the transpiled workflow.ts file and returns the executable workflow object for runtime execution.

**Product Impact:** When workflows are executed (by agents or API routes), this function loads the executable code, making workflows runnable. This is the bridge between workflow storage and execution.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workflowId` | string | Yes | Workflow identifier |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<unknown \| null> | Executable workflow object (Mastra workflow), or null if not found |

**Process:**

```
getWorkflowExecutable(workflowId): Promise<unknown | null>
├── Build file path: _tables/workflows/{workflowId}/workflow.ts
├── **Try to access file**
├── **Convert path to file:// URL** (required for ESM imports)
├── **Dynamic import** workflow.ts file
├── **Check for default export first**
├── **If no default export:**
│   ├── Search module exports for object with createRunAsync method
│   └── Return first matching export (Mastra workflow signature)
├── **If found:** Return workflow object
└── **If not found:** Log warning, return null
```

**Error Handling:** Returns null if file not found or no valid export found. Errors are logged.

---

### `validateWorkflowBinding(binding: { workflowId: string; connectionBindings: Record<string, string> }): Promise<{ valid: boolean; errors: string[] }>`

**What it does:** Validates that a workflow binding has all required connections provided, returning validation result with error messages.

**Product Impact:** When users assign workflows to agents, this function ensures all required connections are bound. This prevents runtime errors and provides clear feedback about missing bindings.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `binding` | Object | Yes | Binding with workflowId and connectionBindings (toolkit slug → connectionId map) |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<{ valid: boolean; errors: string[] }> | Validation result with boolean and array of error messages |

**Process:**

```
validateWorkflowBinding(binding): Promise<{valid, errors}>
├── **Call `getWorkflowMetadata(binding.workflowId)`**
├── If metadata not found:
│   └── Return { valid: false, errors: ["Workflow not found"] }
├── Initialize empty errors array
├── **For each required connection in metadata.requiredConnections:**
│   ├── **If connectionBindings[toolkitSlug] is missing:**
│   │   └── Add error message to errors array
│   └── Skip NO_AUTH toolkits (already excluded from requiredConnections)
├── Build error messages (singular vs plural)
└── Return { valid: errors.length === 0, errors }
```

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `fs/promises` | File system operations |
| `path` | Path resolution |
| `url` | File URL conversion for dynamic imports |
| `@/_tables/types` | WorkflowMetadata type |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Workflows List Route | `app/api/workflows/list/route.ts` | Lists available workflows |
| Workflow Detail Route | `app/api/workflows/[workflowId]/route.ts` | Gets workflow metadata |
| Workflow Tools Service | `app/api/tools/services/workflow-tools.ts` | Loads executables for agent tools |
| Workflow Builder Service | `app/api/workflows/services/workflow-builder.ts` | Uses metadata for workflow construction |

---

## Design Decisions

### Why metadata from JSON instead of importing TS?

**Decision:** Metadata is loaded from workflow.json instead of importing workflow.ts.

**Rationale:** Avoids dynamic import issues in Next.js. Reading JSON is reliable in all contexts (API routes, server components, etc.), while dynamic imports can fail in certain Next.js configurations. Metadata doesn't need the executable code.

### Why NO_AUTH toolkit exclusion?

**Decision:** NO_AUTH toolkits (like browser_tool) are excluded from requiredConnections.

**Rationale:** These toolkits don't require user connections - they're platform-provided. Including them in requiredConnections would cause false validation failures.

### Why search for createRunAsync export?

**Decision:** Executable loading searches for exports with createRunAsync method instead of expecting a specific export name.

**Rationale:** Transpiled workflows may have different export names. Searching for the Mastra workflow signature (createRunAsync method) is more robust than hardcoding export names.

---

## Error Handling

- Missing files: Returns null gracefully
- Invalid exports: Logs warnings, returns null
- Validation errors: Returns error array with descriptive messages

---

## Related Docs

- [Workflow Builder Service README](./workflow-builder.README.md) - Constructs workflows from definitions
- [Workflow Tools Service README](../../tools/services/workflow-tools.README.md) - Uses this service to load executables
- [Workflows Route README](../../workflows/list/README.md) - API routes that use this service

---

## Future Improvements

- [ ] Add workflow caching for metadata
- [ ] Add workflow versioning support
- [ ] Add workflow search/filtering
- [ ] Add workflow dependency resolution
- [ ] Add workflow health checks

