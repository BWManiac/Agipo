# Diary Entry 11: Agent Tool Management & UI-Driven Assignment

**Date:** 2025-11-29  
**Task:** N/A  
**Status:** ✅ Complete

---

## 1. Context

Following the dynamic agent registry implementation (Entry 9) and workflow transpilation planning (Entry 10), we needed to bridge the gap between **tool creation** and **agent assignment**. The core problem: agents had hardcoded `toolIds` arrays in their config files, requiring code changes to modify tool assignments.

**User need:** Product managers and non-technical users should be able to assign tools to agents through the UI, without editing TypeScript files.

**Technical goal:** Enable UI-driven tool assignment while maintaining compatibility with the existing Vercel AI SDK agent framework.

---

## 2. Implementation Summary

### Files Created/Modified

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `_tables/tools/quick-summary.ts` | Create | Text summarization tool | ~40 |
| `_tables/tools/priority-checker.ts` | Create | Priority evaluation tool | ~50 |
| `_tables/tools/status-reporter.ts` | Create | Status update formatter | ~45 |
| `app/api/agents/[agentId]/tools/route.ts` | Create | POST endpoint for updating tool assignments | ~80 |
| `app/(pages)/workforce/components/ToolEditor.tsx` | Create | Tool selection modal component | ~200 |
| `app/(pages)/workforce/components/AgentModal.tsx` | Modify | Added "Edit tools" button and ToolEditor integration | ~30 |

### Three New Tools

We created three simple, testable tools to demonstrate the pattern:

1. **Quick Summary (`quick_summary`):** General-purpose text summarization
2. **Priority Checker (`priority_checker`):** Evaluate priority using impact/urgency/effort matrix
3. **Status Reporter (`status_reporter`):** Generate formatted status updates

All three tools follow the Vercel AI SDK pattern with `ToolDefinition` wrapper and `tool()` instance.

### Tool Editor Component

A modal dialog that allows users to:
- View all available tools (built-in + workflow-derived)
- Search/filter tools by name or description
- Group tools by source (Built-in vs Workflow)
- Select/deselect tools via checkboxes
- Save changes or cancel

### API Route for Tool Assignment

POST endpoint that:
- Accepts `{ toolIds: string[] }` in request body
- Maps agent ID to filename (critical discovery - see Key Decisions)
- Reads agent config file from `_tables/agents/`
- Updates `toolIds` array using regex replacement
- Writes file back to disk
- Returns success/error response

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Persistence | File-based updates | Matches existing architecture, simple, version-control friendly |
| Agent ID Mapping | Explicit mapping function | Agent IDs don't match filenames, need explicit mapping |
| State Management | Local component state | Modal-specific, doesn't need global state |
| Layout | Flexbox with ScrollArea | Prevents overflow, handles long lists gracefully |
| Save Behavior | Page reload | Simplest way to refresh data |

---

## 4. Technical Deep Dive

### Agent ID to Filename Mapping

**Problem discovered:** Agent IDs (`pm`, `marketing`, `support`, `engineering`) don't match filenames (`mira-patel.ts`, `noah-reyes.ts`, `elena-park.ts`, `alex-kim.ts`).

**Solution:** Created mapping function in API route:
```typescript
const idToFile: Record<string, string> = {
  pm: "mira-patel",
  marketing: "noah-reyes",
  support: "elena-park",
  engineering: "alex-kim",
};
```

### Regex Replacement Edge Cases

**Challenge:** Updating `toolIds` array in TypeScript file while preserving formatting.

**Solution:** Used regex with capture groups:
```typescript
const toolIdsPattern = /(toolIds:\s*)\[[^\]]*\](\s*,?)/;
const updatedContent = fileContent.replace(
  toolIdsPattern,
  `$1[${toolIdsString}]$2`
);
```

**Risks:** Could break with unusual formatting. Future improvement: Use AST manipulation.

### Integration with Vercel AI SDK

**Tool Definition Pattern:**
- Tools follow exact pattern from Vercel AI SDK guide
- `ToolDefinition` wrapper adds metadata (`id`, `name`, `runtime`)
- `tool()` instance is what the Agent receives
- Clean separation of concerns

**Agent Hydration Flow:**
1. Client requests with `{ agentId, messages }`
2. Load agent → returns `AgentConfig` with `toolIds`
3. Resolve tools → `getToolById(toolId)` for each
4. Build tool map → `toolMap[toolId] = toolDef.run`
5. Instantiate agent → `new Agent({ tools: toolMap, ... })`

---

## 5. Lessons Learned

- **Agent ID mapping is critical:** Don't assume IDs match filenames
- **Regex replacement works but is fragile:** AST manipulation would be safer
- **Modal state management:** Need careful reset on open, explicit cancel handling
- **File-based persistence:** Simple for MVP, easy to migrate to DB later
- **Tool modularity:** Easy to add new tools by creating files

---

## 6. Next Steps

- [ ] AST Manipulation: Use TypeScript compiler API for safer file updates
- [ ] Optimistic Updates: Update UI immediately, refetch in background
- [ ] Tool Validation: Check tool compatibility with agent's runtime
- [ ] Workflow Tool Integration: When transpiler generates tools, they'll appear automatically
- [ ] Tool Marketplace: Enable tool sharing across organizations

---

## References

- **Related Diary:** `09-AgentRegistry.md` - Dynamic agent registry
- **Related Diary:** `10-SchemaTranspilationPlanning.md` - Workflow transpilation planning
- **Vercel AI SDK Guide:** https://vercel.com/kb/guide/how-to-build-ai-agents-with-vercel-and-the-ai-sdk

---

**Last Updated:** 2025-11-29
