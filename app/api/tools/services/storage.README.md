# Tools Storage Service

> Manages tool definition files (workflow.json) and executable code (tool.js) persistence.

**Service:** `storage.ts`  
**Domain:** Tools

---

## Purpose

This service handles the file system persistence of tool definitions and executable code. It manages the storage structure where each tool has a directory containing its source definition (`workflow.json`) and transpiled executable (`tool.js`). Without this service, tools couldn't be saved, loaded, or persisted across sessions.

**Product Value:** Enables users to save their workflows as tools. When a user creates a workflow in the Tools editor and saves it, this service persists both the visual definition (for editing) and the executable code (for agent use), making tools durable and reusable.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `listToolDefinitions()` | Scans the tools directory and returns summaries of all saved tool definitions. | When displaying the tool list in the UI or checking what tools exist |
| `getToolDefinition()` | Reads a specific tool's source definition (workflow.json) from disk. | When loading a tool for editing or viewing its structure |
| `saveToolDefinition()` | Saves a tool's source definition (nodes, edges, metadata) to workflow.json. | When creating or updating a tool from the editor |
| `saveToolExecutable()` | Saves the transpiled executable code (tool.js) for a tool. | After transpiling a tool, to persist the executable code |

---

## Approach

The service uses a simple directory structure: `_tables/tools/{id}/workflow.json` for definitions and `_tables/tools/{id}/tool.js` for executables. It validates tool data against Zod schemas before saving and automatically adds timestamps. File operations are asynchronous and handle missing files gracefully.

---

## Public API

### `listToolDefinitions(): Promise<WorkflowSummary[]>`

**What it does:** Scans the tools directory and returns summaries of all saved tool definitions, including id, name, description, and last modified timestamp.

**Product Impact:** Powers the tool list UI where users see all their saved tools. Also used by routes that need to enumerate available tools.

**Input:**

None

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<WorkflowSummary[]> | Array of tool summaries with id, name, description, lastModified |

**Process:**

```
listToolDefinitions(): Promise<WorkflowSummary[]>
├── Ensure tools directory exists
├── Scan _tables/tools/ directory for subdirectories
├── **For each subdirectory:**
│   ├── **Call `getToolDefinition()`** to load workflow.json
│   └── If found: Extract summary (id, name, description, lastModified)
├── Filter out null results (missing/invalid definitions)
└── Return summaries array
```

---

### `getToolDefinition(id: string): Promise<WorkflowData | null>`

**What it does:** Reads a specific tool's source definition from its workflow.json file, including nodes, edges, and metadata.

**Product Impact:** When users open a tool for editing, this function loads the complete workflow definition so the editor can display and modify it.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Tool ID (directory name) |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<WorkflowData \| null> | Complete tool definition with nodes, edges, metadata, or null if not found |

**Process:**

```
getToolDefinition(id): Promise<WorkflowData | null>
├── Build file path: _tables/tools/{id}/workflow.json
├── **Try to read file**
├── Parse JSON content
├── **Validate against ToolDataSchema** (Zod)
└── Return parsed and validated WorkflowData
```

**Error Handling:** Returns null if file doesn't exist or validation fails. Errors are silently caught to allow graceful degradation.

---

### `saveToolDefinition(id: string, data: Omit<WorkflowData, "id" \| "lastModified">): Promise<WorkflowData>`

**What it does:** Saves a tool's source definition to workflow.json, automatically adding the id and lastModified timestamp.

**Product Impact:** When users save their work in the Tools editor, this function persists it to disk, making the tool available for future editing and agent use.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Tool ID (used for directory name) |
| `data` | Omit<WorkflowData, "id" \| "lastModified"> | Yes | Tool definition data (nodes, edges, name, description, apiKeys) |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<WorkflowData> | Complete tool definition with id and lastModified added |

**Process:**

```
saveToolDefinition(id, data): Promise<WorkflowData>
├── Ensure tools directory exists
├── Create tool subdirectory: _tables/tools/{id}/
├── Build full WorkflowData object:
│   ├── Add id from parameter
│   ├── Add lastModified timestamp
│   └── Merge with provided data
├── Write workflow.json with pretty-printed JSON
└── Return full WorkflowData
```

---

### `saveToolExecutable(id: string, code: string): Promise<void>`

**What it does:** Saves the transpiled executable JavaScript code to tool.js for a tool.

**Product Impact:** After transpiling a tool from nodes/edges to executable code, this function saves that code so it can be loaded by agents at runtime. This separates the editing format (JSON) from the execution format (JavaScript).

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Tool ID (used for directory name) |
| `code` | string | Yes | Transpiled JavaScript code to save |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<void> | Resolves when file is successfully written |

**Process:**

```
saveToolExecutable(id, code): Promise<void>
├── Ensure tool directory exists: _tables/tools/{id}/
├── Write code to tool.js file
└── Return (void)
```

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `fs/promises` | File system operations |
| `path` | Path resolution |
| `zod` | Data validation |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Tools Create Route | `app/api/tools/create/route.ts` | Saves new tool definitions and executables |
| Tools Update Route | `app/api/tools/[toolId]/route.ts` | Updates existing tool definitions |
| Tools List Route | `app/api/tools/list/route.ts` | Lists all tool definitions |
| Tools Read Route | `app/api/tools/[toolId]/route.ts` | Loads tool definitions for editing |

---

## Design Decisions

### Why separate definition and executable files?

**Decision:** Tools are stored with two files: `workflow.json` (definition) and `tool.js` (executable).

**Rationale:** The definition is the source of truth for editing (visual nodes/edges), while the executable is what agents use. Separating them allows the editor to work with visual data while agents use optimized code. This follows the workflow-as-code philosophy where the same workflow has multiple representations.

### Why pretty-printed JSON?

**Decision:** workflow.json files are written with `JSON.stringify(data, null, 2)` for readability.

**Rationale:** Files are human-readable and versionable. Pretty-printing makes diffs meaningful and allows manual inspection/editing if needed. This aligns with Agipo's "files as source of truth" philosophy.

---

## Error Handling

- Missing directories: Automatically created with `recursive: true`
- Missing files: `getToolDefinition()` returns null gracefully
- Validation errors: Thrown as exceptions (caller should handle)
- File write errors: Thrown as exceptions (caller should handle)

---

## Related Docs

- [Transpiler Service README](./transpiler.README.md) - Generates the executable code saved by saveToolExecutable
- [Custom Tools Service README](./custom-tools.README.md) - Loads the executable files saved here

---

## Future Improvements

- [ ] Add file locking for concurrent writes
- [ ] Add backup/version history
- [ ] Add migration utilities for schema changes
- [ ] Consider compression for large workflow definitions
- [ ] Add validation on save (check node/edge consistency)

