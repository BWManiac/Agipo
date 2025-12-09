# Custom Tools Service

> Loads and caches user-created workflow tools from the filesystem.

**Service:** `custom-tools.ts`  
**Domain:** Tools

---

## Purpose

This service loads executable custom tools that users have created in the Tools domain. These tools are stored as JavaScript files (`tool.js`) in `_tables/tools/{id}/` and are dynamically imported at runtime. Without this service, agents couldn't use user-created workflows as capabilities.

**Product Value:** Enables users' custom workflows to become agent capabilities. When a user creates a "Summarize site email" workflow in the Tools editor, this service makes it available for agents to invoke, completing the workflow-to-capability pipeline.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `getExecutableTools()` | Scans the tools directory and loads all executable tool files into memory, caching the results. | When building agent tool maps - loads all available custom tools |
| `getCustomToolById()` | Gets a specific custom tool by its ID from the cached or loaded tool set. | When you need a specific tool (e.g., for validation or detailed inspection) |
| `clearToolCache()` | Clears the in-memory tool cache, forcing reload on next access. | After creating or updating tools, to ensure fresh data is loaded |

---

## Approach

The service scans the `_tables/tools/` directory for subdirectories, then dynamically imports the `tool.js` file from each. It uses ESM dynamic imports with file:// URLs to load the JavaScript files. Tools are cached in memory after first load to avoid repeated file system operations. The service follows a naming convention where tool IDs are prefixed with "workflow-" and export names follow a camelCase pattern.

---

## Public API

### `getExecutableTools(): Promise<ToolDefinition[]>`

**What it does:** Scans the filesystem for custom tool directories and loads all executable tool files, returning an array of tool definitions ready for agent use.

**Product Impact:** This is called during agent initialization to build the tool map. All user-created workflows become available to agents through this function.

**Input:**

None

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<ToolDefinition[]> | Array of all custom tool definitions loaded from the filesystem |

**Process:**

```
getExecutableTools(): Promise<ToolDefinition[]>
├── Check if toolCache exists
├── If cached: Return cached tools
├── If not cached:
│   ├── Initialize empty tools array
│   ├── Scan _tables/tools/ directory
│   ├── **For each subdirectory:**
│   │   ├── Check if tool.js exists
│   │   ├── **If exists:**
│   │   │   ├── **Dynamic import** tool.js file using file:// URL
│   │   │   ├── Extract export (follows naming convention: workflow{Id}ToolDefinition)
│   │   │   ├── Validate export has id and run properties
│   │   │   └── Add to tools array
│   │   └── **If missing/invalid:** Log warning, skip
│   ├── Cache tools array
│   └── Return tools array
```

**Error Handling:** Import errors are logged but don't stop loading other tools. Invalid exports are logged as warnings and skipped.

---

### `getCustomToolById(id: string): Promise<ToolDefinition | undefined>`

**What it does:** Gets a specific custom tool by its ID from the loaded tool set.

**Product Impact:** Routes need to fetch specific tools for validation, inspection, or individual tool operations.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The tool ID (e.g., "workflow-my-tool") |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<ToolDefinition \| undefined> | The tool definition if found, undefined if not found |

**Process:**

```
getCustomToolById(id): Promise<ToolDefinition | undefined>
├── **Call `getExecutableTools()`** to load all tools
├── Find tool with matching id
└── Return tool or undefined
```

---

### `clearToolCache(): void`

**What it does:** Clears the in-memory tool cache, forcing tools to be reloaded from the filesystem on the next `getExecutableTools()` call.

**Product Impact:** After creating or updating tools, the cache must be cleared so the new tool versions are loaded. Otherwise, agents would continue using cached/stale tool definitions.

**Input:**

None

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | void | No return value - clears module-level cache |

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `fs/promises` | File system operations for scanning directories |
| `path` | Path resolution for tool file locations |
| `url` | File URL conversion for dynamic imports |
| `@/_tables/types` | ToolDefinition type |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Runtime Service | `app/api/tools/services/runtime.ts` | Unified tool loading (re-exports this) |
| Chat Service | `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Builds agent tool maps |
| Tools List Route | `app/api/tools/list/route.ts` | Lists available custom tools |
| Tools Create Route | `app/api/tools/create/route.ts` | Clears cache after creating new tools |

---

## Design Decisions

### Why caching?

**Decision:** Tools are cached in memory after first load.

**Rationale:** Scanning the filesystem and dynamically importing JavaScript files on every request is expensive. Since tools don't change during runtime (they're created/updated via API routes that clear cache), caching significantly improves performance.

### Why file:// URLs for imports?

**Decision:** Dynamic imports use `pathToFileURL()` to convert paths to file:// URLs.

**Rationale:** Node.js ESM dynamic imports require file:// URLs, not regular file paths. This is a requirement of the module system.

### Why naming convention for exports?

**Decision:** Tool exports must follow the pattern `{camelCaseId}ToolDefinition`.

**Rationale:** The transpiler generates tools with predictable export names. This convention allows the loader to reliably find the export without hardcoding or guessing.

---

## Error Handling

- Missing tool.js files: Logged as warnings, tool is skipped
- Import errors: Logged with full stack traces, tool is skipped
- Invalid exports: Logged as warnings, tool is skipped
- Directory access errors: Logged, returns empty array

All errors are graceful - one bad tool doesn't prevent others from loading.

---

## Related Docs

- [Runtime Service README](./runtime.README.md) - Unified tool loading interface
- [Storage Service README](./storage.README.md) - Tool file persistence
- [Transpiler Service README](./transpiler.README.md) - Tool code generation

---

## Future Improvements

- [ ] Add tool versioning support
- [ ] Add hot-reload capability for development
- [ ] Add tool validation on load (schema checks)
- [ ] Add metrics for tool load times
- [ ] Consider lazy loading (only load tools when requested)

