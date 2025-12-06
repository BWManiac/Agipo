# Runtime Service - Tool Execution Layer

**Last Updated:** December 6, 2025  
**Related Task:** `_docs/_tasks/13-composio-mastra-refactor.md`

---

## Overview

The `runtime.ts` file handles tool loading and execution for Agipo agents. It provides a bridge between:
- **Custom tools** (loaded from filesystem)
- **Composio tools** (external integrations via Composio SDK)
- **Mastra agents** (the execution framework)

---

## ⚠️ Known Issues & Workarounds

### 1. Mastra Context Leak (Critical)

**Problem:** Mastra injects runtime context (`memory`, `threadId`, `resourceId`, `context`, `mastra`, etc.) into tool execution arguments. Composio tools don't expect these and fail with "missing required field" errors.

**Workaround:** Lines 345-372 filter out runtime context before passing arguments to Composio:

```typescript
const runtimeContextKeys = ['threadId', 'resourceId', 'memory', 'runId', 'runtimeContext', 'writer', 'tracingContext', 'mastra'];

// Mastra wraps actual args in a 'context' object
if (input.context && typeof input.context === 'object') {
  // Extract actual tool args from context wrapper
}
```

**Root Cause:** Mastra 0.24.x injects context differently than expected. The official `@composio/mastra` provider hasn't been updated to handle this (see below).

---

### 2. Composio Provider Incompatibility (Blocking)

**Problem:** The official `@composio/mastra` package requires `@mastra/core@^0.21.x`, but we use `@mastra/core@0.24.6`.

**Error:**
```
Error executing step prepare-tools-step: TypeError: Cannot read properties of undefined (reading 'def')
    at JSONSchemaGenerator.process (zod)
```

**What We Tried:**
1. `@composio/mastra` - ❌ Version incompatible
2. `@composio/vercel` - ❌ Same Zod schema error in Mastra
3. Manual schema conversion - ✅ Works

**Decision:** Keep manual `convertComposioSchemaToZod()` until Composio updates their provider.

**Tracking:** Monitor https://github.com/ComposioHQ/composio/releases for `@composio/mastra` updates.

---

### 3. Large Tool Results

**Problem:** Tools like `BROWSER_TOOL_FETCH_WEBPAGE` can return 50KB+ of HTML content, which:
- Exceeds reasonable context for the model
- Causes timeouts
- Results in poor quality responses

**Solution:** Tool results are truncated to 10,000 characters (lines 401-420):

```typescript
const TOOL_RESULT_MAX_CHARS = 10000;
if (data.content.length > TOOL_RESULT_MAX_CHARS) {
  // Truncate and append notice
}
```

---

### 4. Custom Tool Import Failures (Next.js Turbopack)

**Problem:** Dynamic imports fail in Next.js dev mode with Turbopack:
```
Error: Cannot find module as expression is too dynamic
```

**Status:** Known issue with Next.js Turbopack. Custom tools from `_tables/tools/` may not load in dev mode. This doesn't affect Composio tools.

**Workaround:** Use `next dev --turbo=false` or wait for Next.js fix.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Tool Loading Flow                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  chat/route.ts                                                   │
│       │                                                          │
│       ├── getExecutableToolById(id)                              │
│       │      └── Custom tools from _tables/tools/                │
│       │                                                          │
│       └── getConnectionToolExecutable(userId, binding)           │
│              │                                                   │
│              ├── Fetch schema from Composio                      │
│              ├── convertComposioSchemaToZod()                    │
│              ├── Wrap in Vercel AI SDK tool()                    │
│              └── Add context filtering in execute()              │
│                                                                  │
│  Result: Tool map for Mastra Agent                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Functions

| Function | Purpose | Lines |
|----------|---------|-------|
| `getExecutableTools()` | Load custom tools from filesystem | 17-74 |
| `getExecutableToolById()` | Get a tool by ID (custom or Composio) | 262-294 |
| `getConnectionToolExecutable()` | Build Composio tool with connection auth | 302-438 |
| `convertComposioSchemaToZod()` | Manual JSON Schema → Zod conversion | 192-260 |

---

## Environment Requirements

- `COMPOSIO_API_KEY` - Required for Composio tool execution
- Tool files in `_tables/tools/{name}/tool.js`

---

## Future Improvements

1. **Migrate to `@composio/mastra`** when Composio updates for Mastra 0.24.x+
2. **Remove manual schema conversion** - The provider should handle this
3. **Add tool result streaming** - For large content, stream chunks instead of truncating
4. **Fix custom tool imports** - May require Next.js config changes

---

## Testing

To verify tools are working:

```bash
# Check tool loading
curl -X POST http://localhost:3000/api/workforce/pm/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "List my recent emails"}]}'

# Logs to watch for:
# [Runtime] Loading connection tool: GMAIL_FETCH_EMAILS
# [Runtime] Extracted args from context wrapper: ...
# [Runtime] Tool result for GMAIL_FETCH_EMAILS: ...
```

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-06 | Added context filtering for Mastra runtime injection |
| 2025-12-06 | Added tool result truncation (10K chars) |
| 2025-12-06 | Documented Composio provider incompatibility |
| 2025-12-06 | Reverted from `@composio/mastra` to manual conversion |

