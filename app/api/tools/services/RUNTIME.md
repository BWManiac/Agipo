# Runtime Service - Tool Execution Layer

**Last Updated:** December 6, 2025  
**Related Task:** `_docs/_tasks/13-composio-mastra-refactor.md`

---

## Overview

The tools runtime handles tool loading and execution for Agipo agents. Following the December 2025 refactoring, this is now split into:

| File | Purpose |
|------|---------|
| `runtime.ts` | Barrel exports + unified `getExecutableToolById()` |
| `custom-tools.ts` | Filesystem-based custom tool loading |
| `composio-tools.ts` | Composio schema conversion and execution |

---

## ⚠️ Known Issues & Workarounds

### 1. Mastra Context Leak (Critical)

**Problem:** Mastra injects runtime context (`memory`, `threadId`, `resourceId`, `context`, `mastra`, etc.) into tool execution arguments. Composio tools don't expect these and fail.

**Workaround:** `composio-tools.ts` filters out runtime context before passing to Composio:

```typescript
const RUNTIME_CONTEXT_KEYS = ['threadId', 'resourceId', 'memory', 'runId', 'runtimeContext', 'writer', 'tracingContext', 'mastra'];

function extractToolArguments(input: Record<string, unknown>) {
  // Filter out Mastra keys
}
```

**Root Cause:** Mastra 0.24.x injects context differently than expected.

---

### 2. Composio Provider Incompatibility (Blocking)

**Problem:** The official `@composio/mastra` package requires `@mastra/core@^0.21.x`, but we use `@mastra/core@0.24.6`.

**Error:**
```
TypeError: Cannot read properties of undefined (reading 'def')
    at JSONSchemaGenerator.process (zod)
```

**What We Tried:**
1. `@composio/mastra` - ❌ Version incompatible
2. `@composio/vercel` - ❌ Same Zod schema error in Mastra
3. Manual schema conversion - ✅ Works

**Decision:** Keep manual `convertComposioSchemaToZod()` in `composio-tools.ts` until Composio updates.

**Tracking:** Monitor https://github.com/ComposioHQ/composio/releases

---

### 3. Large Tool Results

**Problem:** Tools like `BROWSER_TOOL_FETCH_WEBPAGE` can return 50KB+ content.

**Solution:** Results truncated to 10,000 characters in `composio-tools.ts`:

```typescript
const TOOL_RESULT_MAX_CHARS = 10000;
```

---

### 4. Custom Tool Import Failures (Next.js Turbopack)

**Problem:** Dynamic imports fail with Turbopack:
```
Error: Cannot find module as expression is too dynamic
```

**Workaround:** Use `next dev --turbo=false`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Tool Loading Flow                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  chat/route.ts                                                   │
│       │                                                          │
│       ├── getExecutableToolById(id)  [runtime.ts]                │
│       │      └── Delegates to custom-tools.ts or composio-tools  │
│       │                                                          │
│       └── getConnectionToolExecutable(userId, binding)           │
│              │  [composio-tools.ts]                              │
│              ├── Fetch schema from Composio                      │
│              ├── convertComposioSchemaToZod()                    │
│              ├── Wrap in Vercel AI SDK tool()                    │
│              └── Add context filtering + truncation              │
│                                                                  │
│  Result: Tool map for Mastra Agent                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Functions

### `runtime.ts` (barrel)

| Export | Delegates To |
|--------|--------------|
| `getExecutableTools()` | custom-tools.ts |
| `getExecutableToolById()` | custom-tools.ts or composio-tools.ts |
| `getConnectionToolExecutable()` | composio-tools.ts |
| `clearToolCache()` | custom-tools.ts |

### `custom-tools.ts`

| Function | Purpose |
|----------|---------|
| `getExecutableTools()` | Load all custom tools from filesystem |
| `getCustomToolById(id)` | Get single custom tool |
| `clearToolCache()` | Invalidate tool cache |

### `composio-tools.ts`

| Function | Purpose |
|----------|---------|
| `getConnectionToolExecutable()` | Build Composio tool with auth |
| `getComposioToolById()` | Legacy ID format support |
| `convertComposioSchemaToZod()` | JSON Schema → Zod |
| `extractToolArguments()` | Filter Mastra context |
| `truncateToolResult()` | Limit result size |

---

## Environment Requirements

- `COMPOSIO_API_KEY` - Required for Composio tool execution
- Tool files in `_tables/tools/{name}/tool.js`

---

## Future Improvements

1. **Migrate to `@composio/mastra`** when Composio updates for Mastra 0.24.x+
2. **Remove manual schema conversion** - Provider should handle this
3. **Add tool result streaming** - Stream chunks instead of truncating
4. **Fix custom tool imports** - May require Next.js config changes

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-06 | **REFACTOR:** Split into custom-tools.ts and composio-tools.ts |
| 2025-12-06 | Added context filtering for Mastra runtime injection |
| 2025-12-06 | Added tool result truncation (10K chars) |
| 2025-12-06 | Documented Composio provider incompatibility |
| 2025-12-06 | Reverted from `@composio/mastra` to manual conversion |
