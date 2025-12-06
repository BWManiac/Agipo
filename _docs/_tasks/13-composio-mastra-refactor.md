# Task 13: Composio + Mastra Architecture Refactor

**Created:** December 6, 2025  
**Status:** ❌ Blocked - Version Incompatibility  
**Priority:** High - Architectural Foundation  
**Diary:** 21-ComposioMastraArchitectureRefactor.md

> **⚠️ BLOCKED:** `@composio/mastra@0.2.6` requires `@mastra/core@^0.21.x` but we have `@0.24.6`. Composio has not updated their provider for 3+ Mastra minor versions. See "Research Findings" section below.

---

## 1. Executive Summary

Our current Composio integration is overcomplicated. We're manually converting tools between formats when an official `@composio/mastra` package exists that handles this natively. This refactor will:

1. Install `@composio/mastra` provider
2. Remove `@composio/vercel` (no longer needed)
3. Simplify `runtime.ts` to only handle custom tools
4. Fix the context leak bug that's breaking browser tools

**Expected Outcome:** Composio tools work out-of-the-box, ~200 lines of code deleted.

---

## 2. Current State Analysis

### 2.1 Package Dependencies

```json
// Current - package.json
"@composio/core": "^0.2.6",
"@composio/vercel": "^0.2.18",   // ← UNUSED, should remove

// Proposed
"@composio/core": "^0.2.6",
"@composio/mastra": "^x.x.x",    // ← ADD this
```

### 2.2 Current Architecture (Broken)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CURRENT FLOW (Complex)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. chat/route.ts calls getConnectionToolExecutable(userId, binding)     │
│                           ↓                                              │
│  2. runtime.ts fetches tool schema from Composio                         │
│                           ↓                                              │
│  3. convertComposioSchemaToZod() - Manual JSON Schema → Zod conversion   │
│                           ↓                                              │
│  4. Wrap in Vercel AI SDK tool() format                                  │
│                           ↓                                              │
│  5. Pass to Mastra Agent                                                 │
│                           ↓                                              │
│  6. Mastra calls tool.execute() with EXTRA CONTEXT (memory, threadId)   │
│                           ↓                                              │
│  7. ❌ Context leaks into Composio arguments → Tool execution fails      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Root Cause:** Mastra injects `{ context, memory, threadId, ... }` into tool execution. Our manual wrapper doesn't filter this correctly.

### 2.3 Version Incompatibility Discovery (Dec 6, 2025)

**Critical Finding:** `@composio/mastra` is incompatible with our Mastra version.

```
npm ls @mastra/core

├─┬ @composio/mastra@0.2.6
│ └── @mastra/core@0.24.6 invalid: "^0.21.1" from node_modules/@composio/mastra
├── @mastra/core@0.24.6 ❌ INCOMPATIBLE
```

| Timeline | Package | Version | Notes |
|----------|---------|---------|-------|
| Oct 15, 2025 | `@mastra/core` | 0.21.0 | Initial stable |
| Oct 24, 2025 | `@mastra/core` | 0.23.x | Schema changes |
| **Nov 5, 2025** | `@mastra/core` | **0.24.0** | Our version, breaking changes |
| Nov 25, 2025 | `@composio/mastra` | 0.2.6 | **Released requiring ^0.21.x** (3 weeks behind!) |
| Dec 5, 2025 | `@composio/mastra` | 0.2.7-alpha.3 | Still requires ^0.21.x |

**Error Observed:**
```
Error executing step prepare-tools-step: TypeError: Cannot read properties of undefined (reading 'def')
    at JSONSchemaGenerator.process
    at Module.toJSONSchema
    at zodToJsonSchema
```

The internal Zod schema format changed between Mastra 0.21.x and 0.24.x.

### 2.4 Composio Provider Support Analysis

| Provider | Peer Dependency | Status |
|----------|-----------------|--------|
| `@composio/openai` | `openai@^5.16.0` | ✅ Current |
| `@composio/langchain` | `@langchain/core@^0.3.63` | ✅ Current |
| `@composio/vercel` | `ai@^5.0.44` | ✅ Current (Vercel AI SDK) |
| `@composio/mastra` | `@mastra/core@^0.21.1` | ❌ **3 versions behind** |

**Conclusion:** Composio prioritizes OpenAI, LangChain, and Vercel AI SDK. Mastra is a secondary integration not receiving timely updates.

---

### 2.5 What `@composio/mastra` Provides (In Theory)

According to [Composio Mastra Docs](https://docs.composio.dev/providers/mastra):

```typescript
import { Composio } from "@composio/core";
import { MastraProvider } from "@composio/mastra";

const composio = new Composio({
  provider: new MastraProvider(),  // ← Handles all the conversion
});

const tools = await composio.tools.get(userId, {
  toolkits: ["GMAIL", "BROWSER_TOOL"],
});

// Tools are already in Mastra-native format!
const agent = new Agent({
  name: "Agent",
  tools: tools,  // ← Direct pass, no wrapping needed
});
```

The `MastraProvider`:
- Converts Composio tool schemas to Mastra format
- Handles context injection properly
- Manages authentication (OAuth, API Key, NO_AUTH)
- Executes tools with correct parameters

---

## 3. Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PROPOSED FLOW (Simple)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. chat/route.ts:                                                       │
│                                                                          │
│     // Initialize Composio with Mastra provider (once)                   │
│     const composio = new Composio({                                      │
│       provider: new MastraProvider(),                                    │
│     });                                                                   │
│                                                                          │
│     // Get connection tools directly                                     │
│     const connectionTools = await composio.tools.get(userId, {           │
│       tools: bindings.map(b => b.toolId),                                │
│       connectedAccountId: binding.connectionId,  // For auth             │
│     });                                                                   │
│                                                                          │
│     // Get custom tools (still from filesystem)                          │
│     const customTools = await getCustomTools(agentConfig.toolIds);       │
│                                                                          │
│     // Merge and create agent                                            │
│     const agent = new Agent({                                            │
│       tools: { ...customTools, ...connectionTools },                     │
│     });                                                                   │
│                                                                          │
│  ✅ No manual conversion, no context leak                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. What Happens to `runtime.ts`?

### 4.1 Current Functions

| Function | Lines | Purpose | After Refactor |
|----------|-------|---------|----------------|
| `getExecutableTools()` | 17-74 | Load custom tools from `_tables/tools/` | ✅ **KEEP** |
| `clearToolCache()` | 76-78 | Clear tool cache | ✅ KEEP |
| `isComposioToolId()` | 83-85 | Check if ID is `composio-*` | ❌ DELETE (unused) |
| `extractComposioActionName()` | 91-98 | Parse composio tool IDs | ❌ DELETE (unused) |
| `convertComposioToolToDefinition()` | 113-168 | Manual Composio → Vercel wrap | ❌ DELETE |
| `convertComposioSchemaToZod()` | 192-260 | JSON Schema → Zod | ❌ DELETE |
| `getExecutableToolById()` | 262-294 | Get any tool by ID | ⚠️ SIMPLIFY (custom only) |
| `getConnectionToolExecutable()` | 303-419 | Build connection tool wrapper | ❌ DELETE |

### 4.2 Simplified `runtime.ts` (~80 lines vs ~420 lines)

```typescript
// NEW runtime.ts - Only handles custom tools

import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";
import type { Tool } from "ai";

const TOOLS_DIR = path.join(process.cwd(), "_tables", "tools");
const TOOL_FILENAME = "tool.js";

let toolCache: Map<string, Tool> | null = null;

/**
 * Loads all custom workflow tools from the file system.
 */
export async function getCustomTools(): Promise<Record<string, Tool>> {
  if (toolCache) {
    return Object.fromEntries(toolCache);
  }

  const tools = new Map<string, Tool>();
  
  // ... existing filesystem loading logic (lines 22-67) ...
  
  toolCache = tools;
  return Object.fromEntries(tools);
}

export async function getCustomToolById(id: string): Promise<Tool | undefined> {
  const tools = await getCustomTools();
  return tools[id];
}

export function clearToolCache() {
  toolCache = null;
}
```

---

## 5. File Impact Analysis

| File | Change Type | Description |
|------|-------------|-------------|
| `package.json` | Modify | Add `@composio/mastra`, remove `@composio/vercel` |
| `app/api/tools/services/runtime.ts` | Major Refactor | Delete ~340 lines, keep custom tool loading |
| `app/api/tools/services/index.ts` | Modify | Update exports |
| `app/api/workforce/[agentId]/chat/route.ts` | Modify | Use `MastraProvider` for Composio tools |
| `app/api/connections/services/composio.ts` | Modify | Add `getComposioWithMastra()` helper |
| `_tables/types.ts` | Keep | `ConnectionToolBinding` type still needed |

---

## 6. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | `@composio/mastra` installed | `npm ls @composio/mastra` returns version |
| 2 | `@composio/vercel` removed | `npm ls @composio/vercel` returns "not found" |
| 3 | Gmail tools work | Agent can fetch emails |
| 4 | Browser tools work | Agent can fetch webpage content |
| 5 | NO_AUTH tools work | `browser_tool` executes without connection ID |
| 6 | Custom tools work | `workflow-*` tools still load and execute |
| 7 | No context leak | Tool args don't include `memory`, `threadId`, etc. |
| 8 | `runtime.ts` < 100 lines | Significantly simplified |

---

## 7. User Flows

### UF1: Connection Tool Execution (Gmail)
1. User has Gmail connected (OAuth)
2. User asks agent to "check my recent emails"
3. Agent calls `GMAIL_FETCH_EMAILS` tool
4. Tool executes via Composio with correct `connectedAccountId`
5. Results returned to agent

### UF2: Platform Tool Execution (Browser)
1. User has browser tools enabled (NO_AUTH)
2. User asks agent to "fetch content from example.com"
3. Agent calls `BROWSER_TOOL_FETCH_WEBPAGE` tool
4. Tool executes via Composio without `connectedAccountId`
5. HTML/markdown content returned

### UF3: Custom Tool Execution (Workflow)
1. User creates workflow in editor
2. Workflow saved to `_tables/tools/workflow-name/tool.js`
3. Agent loads tool from filesystem
4. Tool executes locally

---

## 8. Implementation Phases

### Phase 1: Install & Verify (Low Risk)
- [ ] `npm install @composio/mastra`
- [ ] Create test script to verify `MastraProvider` works
- [ ] Document any API differences

### Phase 2: Refactor Chat Route
- [ ] Create `getComposioTools()` helper using `MastraProvider`
- [ ] Update `chat/route.ts` to use new helper for connection tools
- [ ] Keep custom tool loading unchanged
- [ ] Test both tool types work

### Phase 3: Clean Up
- [ ] Remove `@composio/vercel`
- [ ] Delete unused functions from `runtime.ts`
- [ ] Update exports in `services/index.ts`
- [ ] Run full test suite

---

## 9. Open Questions

1. **Custom tool format:** Should we migrate custom tools to use `createTool` from `@mastra/core/tools` instead of Vercel AI SDK `tool()`? (Future task)

2. **Connection bindings:** How do we pass `connectedAccountId` for specific user connections with `MastraProvider`? Need to verify API.

3. **NO_AUTH handling:** Does `MastraProvider` automatically handle NO_AUTH toolkits, or do we need special handling?

---

## 10. References

- [Composio Mastra Provider Docs](https://docs.composio.dev/providers/mastra)
- Task 12: NO_AUTH Platform Tools (discovered context leak)
- Task 9: Mastra Migration (original integration)
- Diary 20: Composio Toolkit Auth Modes

---

## 11. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-12-06 | Use `@composio/mastra` | Official integration, handles context properly |
| 2025-12-06 | Keep custom tool loading | Separate concern, filesystem-based tools work |
| 2025-12-06 | Remove `@composio/vercel` | Unused, adds confusion |

---

## 12. Status: BLOCKED

**Attempted:** December 6, 2025  
**Blocked:** December 6, 2025

### What Was Attempted

| File | Attempted Change | Result |
|------|------------------|--------|
| `package.json` | Added `@composio/mastra`, removed `@composio/vercel` | ❌ Version conflict |
| `composio.ts` | Added `getComposioMastraClient()` | ❌ Tools failed at runtime |
| `runtime.ts` | Reduced to 90 lines | ❌ Must revert |
| `chat/route.ts` | Used `MastraProvider` | ❌ Zod schema error |

### Error

```
Error executing step prepare-tools-step: TypeError: Cannot read properties of undefined (reading 'def')
    at JSONSchemaGenerator.process (zod)
```

**Root Cause:** `@composio/mastra@0.2.6` creates tools using `@mastra/core@0.21.x` Zod schema format, which is incompatible with our `@mastra/core@0.24.6`.

### Required Actions

1. **Revert changes** to `runtime.ts`, `composio.ts`, `chat/route.ts`
2. **Re-install `@composio/vercel`** - We'll use this for now
3. **Keep old manual schema conversion** - It works
4. **Monitor Composio releases** - Wait for `@composio/mastra` to support `^0.24.x`

---

## 13. Testing Results (December 6, 2025)

### Option A: `@composio/vercel` - FAILED ❌

We tested using `VercelProvider` since it's up-to-date with `ai@^5.0.44`:

```
[Composio/Vercel] Successfully loaded: GMAIL_CREATE_EMAIL_DRAFT, ...
[Composio/Vercel] Successfully loaded: BROWSER_TOOL_COPY_SELECTED_TEXT, ...
...
Error executing step prepare-tools-step: TypeError: Cannot read properties of undefined (reading 'def')
    at JSONSchemaGenerator.process
    at zodToJsonSchema
```

**Same error as `@composio/mastra`!** Both providers create Zod schemas that Mastra 0.24.x can't process.

### Option B: Manual Conversion - WORKS ✅

The old `runtime.ts` with manual `convertComposioSchemaToZod()` successfully executed tools:

```
[Runtime] Loading connection tool: GMAIL_FETCH_EMAILS for connection: ca_wudNUwXqrbtx
[Runtime] Converting schema - properties: ids_only, include_payload...
[Runtime] Successfully loaded connection tool: GMAIL_FETCH_EMAILS
...
[Runtime] Tool result for GMAIL_SEND_EMAIL: {"successful": true}
```

### Why Manual Conversion Works

The issue is in **Mastra's internal tool processing**, not Composio's providers:
1. Both Composio providers (`mastra`, `vercel`) create tools with Zod schemas
2. Mastra 0.24.x's `zodToJsonSchema()` fails on these schemas
3. Our manual conversion creates schemas **our way**, bypassing the incompatibility

### Decision: Reverted to Manual Conversion

| Approach | Status | Lines | Notes |
|----------|--------|-------|-------|
| `@composio/mastra` | ❌ Blocked | N/A | Requires @mastra/core@^0.21.x |
| `@composio/vercel` | ❌ Failed | N/A | Same Zod schema error |
| Manual conversion | ✅ Working | 371 | Reverted from git |

Files reverted:
- `app/api/tools/services/runtime.ts`
- `app/api/workforce/[agentId]/chat/route.ts`
- `app/api/tools/chat/route.ts`

---

## 14. Lessons Learned

1. **Always check peer dependencies before major refactors.** The version incompatibility wasn't obvious until runtime.

2. **Composio's Mastra support is immature.** They released a provider 3 weeks behind the main framework and haven't updated in a month.

3. **The old code was working for a reason.** Manual schema conversion is verbose but reliable when official integrations lag behind.

---

## 15. Runtime Improvements (December 6, 2025)

After the blocked refactor, we made several improvements to the working manual conversion approach:

### 15.1 Context Leak Fix

**Problem:** Mastra wraps tool arguments in a `context` object and injects runtime keys (`memory`, `threadId`, `mastra`, etc.) directly into the input.

**Solution:** Updated `runtime.ts` to:
1. Check if args are nested in `context` wrapper first
2. Extract actual tool args from the wrapper
3. Filter out all runtime context keys

```typescript
// runtime.ts lines 345-372
const runtimeContextKeys = ['threadId', 'resourceId', 'memory', 'runId', 'runtimeContext', 'writer', 'tracingContext', 'mastra'];

if (input.context && typeof input.context === 'object') {
  // Extract args from context wrapper
}
```

### 15.2 Tool Result Truncation

**Problem:** Tools like `BROWSER_TOOL_FETCH_WEBPAGE` return 50KB+ of HTML, overwhelming the model context.

**Solution:** Truncate tool results to 10,000 characters before returning to model:

```typescript
// runtime.ts lines 401-420
const TOOL_RESULT_MAX_CHARS = 10000;
if (data.content.length > TOOL_RESULT_MAX_CHARS) {
  // Truncate and append notice
}
```

### 15.3 Timeout Handling

**Problem:** Requests were timing out silently, leaving users with no response.

**Solution:** 
1. Increased `maxDuration` from 30s to 60s
2. Added graceful error handling that always returns a message to the user

```typescript
// chat/route.ts
export const maxDuration = 60;

// Wrap streaming in try-catch to always respond
try {
  const result = await dynamicAgent.stream(...);
  return result.toUIMessageStreamResponse();
} catch (streamError) {
  // Return user-friendly error message instead of blank screen
  return NextResponse.json({ message: "I'm sorry, but..." }, { status: 200 });
}
```

### 15.4 Documentation

Created `app/api/tools/services/RUNTIME.md` documenting:
- Known issues and workarounds
- Architecture diagram
- Key functions
- Testing instructions
- Changelog

---

## 16. Current Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Manual schema conversion | ✅ Working | Verbose but reliable |
| Context leak fix | ✅ Fixed | Extracts args from Mastra wrapper |
| Tool result truncation | ✅ Added | 10K char limit |
| Timeout handling | ✅ Improved | 60s, graceful errors |
| `@composio/mastra` | ❌ Blocked | Waiting for Mastra 0.24.x support |
| Documentation | ✅ Added | RUNTIME.md created |

---

## 17. Next Steps

1. **Monitor Composio releases** for `@composio/mastra` updates supporting `@mastra/core@^0.24.x`
2. **Consider opening an issue** on Composio GitHub for version support
3. **Evaluate alternatives** if Composio doesn't update within 1-2 months

