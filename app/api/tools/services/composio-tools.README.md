# Composio Tools Service (Runtime)

> Converts Composio tool schemas to Zod and wraps execution for agent use.

**Service:** `composio-tools.ts`  
**Domain:** Tools

---

## Purpose

This service handles the conversion and execution wrapping of Composio integration tools for agent use. It converts Composio's JSON Schema format to Zod schemas compatible with Vercel AI SDK, filters out Mastra-injected runtime context, and wraps tool execution in the standard tool() format. Without this service, Composio tools couldn't be used by agents due to schema format mismatches and context leakage issues.

**Product Value:** Enables the hybrid capability system - agents can use Gmail, Slack, GitHub, and other Composio integrations seamlessly. This service is the bridge between Composio's tool format and Mastra Agent's expected format, making external integrations feel native to agents.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `isComposioToolId()` | Checks if a tool ID is a Composio tool (prefixed with "composio-"). | When determining tool type before loading |
| `extractComposioActionName()` | Extracts the Composio action name from a prefixed tool ID. | When converting tool IDs to Composio action names |
| `convertComposioSchemaToZod()` | Converts Composio's JSON Schema parameter definitions to Zod schemas. | When wrapping Composio tools for agent use |
| `convertComposioToolToDefinition()` | Converts a Composio tool object to a ToolDefinition with wrapped execution. | When loading Composio tools (legacy, uses prefixed IDs) |
| `getConnectionToolExecutable()` | Gets an executable tool for a connection tool binding, handling schema conversion and execution wrapping. | When building agent tool maps with connection tools |

---

## Approach

The service performs manual schema conversion from JSON Schema to Zod because the official Composio Mastra provider is blocked by version incompatibility. It filters out Mastra-injected runtime context (threadId, resourceId, memory) before passing arguments to Composio, preventing execution failures. Tool results are truncated to prevent context overflow. The service is a workaround until Composio updates their Mastra provider compatibility.

---

## Public API

### `isComposioToolId(id: string): boolean`

**What it does:** Checks if a tool ID follows the Composio tool naming convention (prefixed with "composio-").

**Product Impact:** Routes need to know tool types to determine which loading function to use. This helper enables type detection.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Tool ID to check |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | boolean | True if tool ID is a Composio tool, false otherwise |

---

### `extractComposioActionName(id: string): string`

**What it does:** Extracts the Composio action name from a prefixed tool ID, converting formats like "composio-gmail_send_email" to "GMAIL_SEND_EMAIL".

**Product Impact:** Composio SDK expects action names in uppercase with underscores. This function converts our tool ID format to their expected format.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Prefixed Composio tool ID (e.g., "composio-gmail_send_email") |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | string | Composio action name in uppercase format (e.g., "GMAIL_SEND_EMAIL") |

---

### `convertComposioSchemaToZod(parameters: Record<string, unknown>): z.ZodObject`

**What it does:** Converts Composio's JSON Schema parameter definitions to Zod schema objects compatible with Vercel AI SDK tools.

**Product Impact:** Agents need Zod schemas for tool input validation. Composio provides JSON Schema, so this conversion enables Composio tools to work with our agent framework.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `parameters` | Record<string, unknown> | Yes | Composio parameter schema in JSON Schema format |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | z.ZodObject | Zod schema object with properties matching the JSON Schema |

**Process:**

```
convertComposioSchemaToZod(parameters): z.ZodObject
├── Extract properties and required fields from JSON Schema
├── **For each property:**
│   ├── Map JSON Schema type to Zod type (string → z.string(), number → z.number(), etc.)
│   ├── Add description if present
│   ├── Mark as optional if not in required array
│   └── Add to Zod shape object
├── If no properties: Return passthrough object
└── Return z.object() with constructed shape
```

---

### `getConnectionToolExecutable(userId: string, binding: ConnectionToolBinding): Promise<ToolDefinition | undefined>`

**What it does:** Loads a Composio tool by binding (toolId + connectionId), converts its schema to Zod, filters runtime context, wraps execution, and returns a ToolDefinition ready for agent use.

**Product Impact:** This is the primary function for loading connection tools into agent tool maps. When an agent has Gmail tools assigned, this function makes them executable by the agent.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | Authenticated user's ID (for Composio execution) |
| `binding` | ConnectionToolBinding | Yes | Tool binding with toolId, connectionId, and toolkitSlug |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<ToolDefinition \| undefined> | ToolDefinition with wrapped execution, or undefined if tool not found |

**Process:**

```
getConnectionToolExecutable(userId, binding): Promise<ToolDefinition | undefined>
├── Determine if tool is NO_AUTH (no connectionId)
├── **Call `getToolAction(userId, binding.toolId)`** to fetch Composio tool
├── If tool not found: Return undefined
├── Extract parameters from tool object
├── **Call `convertComposioSchemaToZod()`** to convert schema
├── Create Vercel AI SDK tool with:
│   ├── description from Composio tool
│   ├── inputSchema: converted Zod schema
│   └── execute: async function that:
│       ├── **Call `extractToolArguments()`** to filter runtime context
│       ├── **Call `client.tools.execute()`** with filtered args
│       ├── Use connectionId if not NO_AUTH
│       ├── **Call `truncateToolResult()`** to prevent context overflow
│       └── Return processed result
└── Return ToolDefinition with wrapped tool
```

**Error Handling:** Returns undefined if tool not found. Execution errors are thrown and handled by the agent framework.

---

### `getComposioToolById(id: string, userId: string): Promise<ToolDefinition | undefined>`

**What it does:** Gets a Composio tool by its prefixed ID (legacy format: "composio-{action}"). This is used for backward compatibility with old tool ID formats.

**Product Impact:** Maintains compatibility with tools that use the old "composio-" prefixed ID format, allowing migration to new connection-based bindings gradually.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Prefixed Composio tool ID (e.g., "composio-gmail_send_email") |
| `userId` | string | Yes | Authenticated user's ID |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<ToolDefinition \| undefined> | ToolDefinition with wrapped execution, or undefined if tool not found |

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `ai` (Vercel AI SDK) | Tool wrapping with tool() function |
| `zod` | Schema validation |
| `@/_tables/types` | ToolDefinition, ConnectionToolBinding types |
| `@/app/api/connections/services/composio` | Composio client and tool fetching |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Runtime Service | `app/api/tools/services/runtime.ts` | Unified tool loading (re-exports this) |
| Chat Service | `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Builds agent tool maps with connection tools |

---

## Design Decisions

### Why manual schema conversion?

**Decision:** Manual JSON Schema to Zod conversion instead of using Composio's Mastra provider.

**Rationale:** The official `@composio/mastra` provider is blocked by version incompatibility (requires @mastra/core@^0.21.x, we have 0.24.6). Manual conversion is a workaround that works reliably until Composio updates compatibility.

### Why filter runtime context?

**Decision:** The `extractToolArguments()` function filters out Mastra-injected keys (threadId, resourceId, memory, etc.).

**Rationale:** Mastra injects runtime context into tool execution, but Composio doesn't expect these keys. Passing them through causes execution failures. Filtering ensures only actual tool parameters reach Composio.

### Why truncate tool results?

**Decision:** Tool results are truncated to 10,000 characters before returning.

**Rationale:** Large tool results can overflow LLM context windows. Truncation prevents context bloat while preserving result structure. The limit is configurable via `TOOL_RESULT_MAX_CHARS`.

---

## Error Handling

- Missing tools: Returns undefined, logged as warnings
- Schema conversion failures: Logged, returns passthrough schema as fallback
- Execution failures: Thrown as errors, handled by agent framework
- Context filtering: Gracefully handles missing or malformed input

---

## Related Docs

- [Runtime Service README](./runtime.README.md) - Unified tool loading interface
- [Client Service README](../../connections/services/client.README.md) - Composio client providers
- [RUNTIME.md](./RUNTIME.md) - Detailed architecture documentation and known issues

---

## Future Improvements

- [ ] Remove manual conversion once Composio Mastra provider is compatible
- [ ] Add caching for tool schemas (they change infrequently)
- [ ] Support more JSON Schema types (oneOf, anyOf, etc.)
- [ ] Add tool result compression for very large results
- [ ] Add retry logic for transient Composio API failures

