# Diary Entry 21: Composio + Mastra Architecture Refactor

**Date:** 2025-12-06  
**Task:** Task 13 - Composio Mastra Refactor  
**Status:** ⚠️ Blocked

---

## 1. Context

While implementing NO_AUTH platform tools (Task 12), we discovered browser tools were failing with:

```json
{
  "error": "Invalid request data provided - Following fields are missing: {'url'}",
  "successful": false
}
```

**Investigation revealed the root cause:** Mastra injects runtime context (`memory`, `threadId`, `resourceId`) into tool execution. Our manual Vercel AI SDK wrapper was receiving this merged input and forwarding the entire blob to Composio, causing tool execution to fail.

---

## 2. Implementation Summary

### Files Created/Modified

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/connections/services/composio.ts` | Modify | Added `getComposioMastraClient()` and `getConnectionToolsForMastra()` | ~50 |
| `app/api/tools/services/runtime.ts` | Modify | Removed all Composio-related code | -330 |
| `package.json` | Modify | Added `@composio/mastra`, removed `@composio/vercel` | ~2 |

### Initial Discovery: The `@composio/mastra` Package

Upon researching, we discovered Composio provides an official **`@composio/mastra`** package that we weren't using!

**What We Had (Before):**
- Manual tool wrapping (420 lines)
- Manual schema conversion (340+ lines)
- Manual context filtering (broken)
- Context leak: Mastra injects memory/threadId into tool args

**What We Have Now (After):**
- Native MastraProvider (< 100 lines)
- MastraProvider handles schema conversion automatically
- MastraProvider handles context injection properly
- MastraProvider handles execution with correct parameters
- runtime.ts reduced from 420 → 90 lines

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Integration Approach | Native MastraProvider | Official Composio support for Mastra |
| Code Reduction | Remove manual wrappers | MastraProvider handles everything |
| Package Change | `@composio/mastra` instead of manual | Official support, less code |

---

## 4. Technical Deep Dive

### The Problem: Context Leak

**Root Cause:** Mastra injects runtime context (`memory`, `threadId`, `resourceId`) into tool execution. Our manual wrapper was forwarding the entire blob to Composio, causing tool execution to fail.

**Solution:** MastraProvider automatically filters out Mastra-specific context before forwarding to Composio.

### Implementation Changes

**composio.ts - New MastraProvider Integration:**
```typescript
import { MastraProvider, type MastraToolCollection } from "@composio/mastra";

export function getComposioMastraClient(): Composio {
  return new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    provider: new MastraProvider(),
  });
}

export async function getConnectionToolsForMastra(
  userId: string,
  bindings: ConnectionToolBinding[]
): Promise<MastraToolCollection> {
  const client = getComposioMastraClient();
  const tools = await client.tools.get(userId, {
    tools: bindings.map(b => b.toolId),
    connectedAccountId: binding.connectionId,
  });
  return tools;
}
```

**runtime.ts - Now Only Handles Custom Tools:**
- DELETED: All Composio-related code (~330 lines)
- KEPT: Custom workflow tool loading

---

## 5. Lessons Learned

- **Official packages are better:** MastraProvider handles complexity we were fighting
- **Context injection is tricky:** Framework-specific context needs proper filtering
- **Code reduction:** 78% reduction in runtime.ts by using official package
- **Version compatibility matters:** Blocked by version incompatibility

---

## 6. Next Steps

- [ ] Wait for `@composio/mastra` compatibility with Mastra 0.24.x
- [ ] Test NO_AUTH tools with MastraProvider once compatible
- [ ] Remove manual Composio wrappers completely

---

## References

- **Related Diary:** `19-ApiKeyConnectionsAndToolCategories.md` - NO_AUTH tools
- **Related Diary:** `22-ArchitectureRefactoring.md` - Architecture refactoring
- **Task:** Task 13 - Composio Mastra Refactor

---

**Last Updated:** 2025-12-06
