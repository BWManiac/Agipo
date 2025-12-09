# Tools Runtime Service

> Unified interface for loading all tool types (custom, Composio, workflows).

**Service:** `runtime.ts`  
**Domain:** Tools

---

## Purpose

This service provides a unified interface for loading tools regardless of their type. It re-exports functions from custom-tools, composio-tools, and workflow-tools, and provides a single `getExecutableToolById()` function that automatically routes to the correct loader based on tool ID format. Without this service, routes would need to know tool types and call different loaders, creating coupling and complexity.

**Product Value:** Enables "just load any tool" simplicity. Routes can call `getExecutableToolById()` without worrying about whether it's a custom workflow, Composio integration, or workflow tool. This abstraction makes the hybrid capability system feel seamless.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `getExecutableToolById()` | Gets any tool by ID, automatically detecting type and routing to appropriate loader. | Primary interface for loading tools - use this in routes and services |
| `getExecutableTools()` | Gets all custom tools (re-exported from custom-tools.ts). | When you need to list all custom tools |
| `getCustomToolById()` | Gets a specific custom tool by ID (re-exported). | When you specifically need a custom tool |
| `getConnectionToolExecutable()` | Gets a connection tool by binding (re-exported from composio-tools.ts). | When building connection tools for agents |
| `getComposioToolById()` | Gets Composio tool by prefixed ID (re-exported, legacy). | For backward compatibility with old tool ID formats |
| `getWorkflowToolExecutable()` | Gets workflow tool by binding (re-exported from workflow-tools.ts). | When building workflow tools for agents |
| `clearToolCache()` | Clears custom tool cache (re-exported). | After creating/updating custom tools |
| Helper functions | isComposioToolId, extractComposioActionName, convertComposioSchemaToZod (re-exported). | Utility functions for tool type detection and conversion |

---

## Approach

This is primarily a barrel file that re-exports functions from specialized services. The key addition is `getExecutableToolById()` which acts as a router, checking tool ID format and delegating to the appropriate specialized loader. This provides a single entry point while maintaining separation of concerns in the underlying services.

---

## Public API

### `getExecutableToolById(id: string, userId?: string): Promise<ToolDefinition | undefined>`

**What it does:** Gets any tool by its ID, automatically detecting whether it's a Composio tool (prefixed with "composio-") or a custom tool, and routing to the appropriate loader.

**Product Impact:** This is the primary interface for tool loading in routes and services. It eliminates the need to know tool types upfront, making code simpler and more maintainable.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Tool ID (e.g., "workflow-my-tool", "composio-gmail_send_email") |
| `userId` | string | No | Authenticated user's ID (required for Composio tools, optional for custom tools) |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<ToolDefinition \| undefined> | ToolDefinition if found, undefined if not found |

**Process:**

```
getExecutableToolById(id, userId?): Promise<ToolDefinition | undefined>
├── **Check `isComposioToolId(id)`**
├── **If Composio tool:**
│   ├── Use userId or default to "agipo_test_user"
│   └── **Call `getComposioToolById(id, userId)`**
└── **If not Composio:**
    └── **Call `getCustomToolById(id)`**
```

**Error Handling:** Returns undefined if tool not found. Errors from underlying services bubble up.

---

## Re-Exported Functions

This service re-exports the following functions from specialized services:

**From custom-tools.ts:**
- `getExecutableTools()` - List all custom tools
- `getCustomToolById()` - Get specific custom tool
- `clearToolCache()` - Clear custom tool cache

**From composio-tools.ts:**
- `getConnectionToolExecutable()` - Load connection tool by binding
- `getComposioToolById()` - Load Composio tool by prefixed ID (legacy)
- `isComposioToolId()` - Check if tool ID is Composio format
- `extractComposioActionName()` - Extract action name from tool ID
- `convertComposioSchemaToZod()` - Convert JSON Schema to Zod

**From workflow-tools.ts:**
- `getWorkflowToolExecutable()` - Load workflow tool by binding

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `./custom-tools` | Custom tool loading |
| `./composio-tools` | Composio tool loading and conversion |
| `./workflow-tools` | Workflow tool loading |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Chat Service | `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Primary consumer - uses getExecutableToolById for custom tools |
| Tools Routes | `app/api/tools/*/route.ts` | Various routes use specific functions for their needs |

---

## Design Decisions

### Why a barrel file with routing?

**Decision:** Re-exports specialized services plus adds a unified routing function.

**Rationale:** Provides convenience without duplicating code. Routes can import from one place (`runtime.ts`) but still access specialized functions when needed. The routing function (`getExecutableToolById`) eliminates the need for type detection in consuming code.

### Why default userId for Composio tools?

**Decision:** `getExecutableToolById()` defaults to "agipo_test_user" if userId not provided for Composio tools.

**Rationale:** Allows flexibility for routes that might not have userId context. However, this is mainly for development/testing - production routes should always provide userId.

---

## Related Docs

- [Custom Tools Service README](./custom-tools.README.md) - Custom tool loading details
- [Composio Tools Service README](./composio-tools.README.md) - Composio tool conversion details
- [Workflow Tools Service README](./workflow-tools.README.md) - Workflow tool wrapping details
- [RUNTIME.md](./RUNTIME.md) - Architecture documentation and known issues

---

## Future Improvements

- [ ] Add tool type detection utilities
- [ ] Add batch loading for multiple tools
- [ ] Add tool validation/health checks
- [ ] Consider tool registry for faster lookups

