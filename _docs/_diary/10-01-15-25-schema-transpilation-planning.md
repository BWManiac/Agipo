# Diary Entry 10: Workflow Schema Generation & Tool Transpilation Planning

**Date:** 2025-01-15  
**Task:** N/A  
**Status:** ✅ Complete

---

## 1. Context

Following the successful multi-agent registry implementation (Entry 9), we explored how to bridge the gap between workflow authoring and agent tool capabilities. The core vision: **users should be able to design workflows in the canvas and promote them into agent tools without hand-writing glue code**.

This entry documents our deep dive into understanding the current workflow execution model, designing a schema-driven approach for type-safe data flow, validating compatibility with Vercel AI SDK's tool calling pattern, and creating a concrete example of what transpiled workflow tools should look like.

---

## 2. Implementation Summary

### Current State Analysis

**Execution Flow Discovery:**
- Each node stores raw code as string in `node.data.code` (no type information)
- On "Run", `workflowExecutionService.ts` creates shell command that writes each node's code to `/tmp/node-{id}.js` and executes with pipes
- Data flows via stdout/stdin — no structure, no validation

**Key Insight:** Execution is purely string-based. No awareness of node input/output schemas, edge mappings, type validation, or partial execution capabilities.

**Edge Mappings (Existing but Unused):**
- `ioMappingSlice.ts` already stores `EdgeMapping` records with field-level bindings
- Type compatibility checks exist (`typesCompatible` function)
- Support for static values and optional fields
- **Problem:** Mappings are not automatically created when edges are drawn, not used by execution engine, only manually configured

**Node Specs (Foundation Exists):**
- Each node has `spec.inputs` and `spec.outputs` as `ContractField[]` with `name`, `type`, `itemType`, `description`, `optional`
- Business-friendly types: `text`, `number`, `flag`, `list`, `record`, `file`
- **Opportunity:** This metadata is perfect for generating Zod schemas and TypeScript types

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Schema Format | Zod | Aligns with Vercel AI SDK, provides validation + type inference |
| Language | TypeScript/JavaScript only | Simplifies transpilation, no language translation needed |
| Tool Wrapper | ToolDefinition pattern | Separates metadata (id, name, runtime) from tool() instance |
| Edge Mappings | Internal to workflow | Agent sees simple tool interface, not workflow complexity |

---

## 4. Technical Deep Dive

### The Schema-Driven Vision

Instead of piping raw strings between nodes, we want:
1. **Zod schemas generated from node specs** — `spec.inputs` → `InputSchema`, `spec.outputs` → `OutputSchema`
2. **Typed function wrappers** — Each node's code wrapped in `async (input: InputType) => OutputType`
3. **Edge mapping-driven execution** — JSON payloads routed between nodes using `EdgeMapping` records
4. **Deterministic transpilation** — Workflows compile to single tool files with predictable signatures

### Why Zod?

**Compatibility:** Vercel AI SDK already uses Zod for tool `inputSchema`. Our approach aligns perfectly.

**Benefits:**
- Runtime validation (catch type mismatches before execution)
- Type inference (`z.infer<typeof Schema>` gives us TypeScript types)
- Single source of truth (node specs → Zod → types → validation)
- Model understanding (`.describe()` fields help AI decide when to call tools)

### The Transpilation Path

```
Canvas Authoring
  ↓
Node Specs (inputs/outputs/types)
  ↓
Zod Schema Generation
  ↓
Typed Node Functions
  ↓
Edge Mapping → Data Routing
  ↓
Workflow Orchestrator
  ↓
Vercel AI SDK tool() export
  ↓
ToolDefinition wrapper
  ↓
_tables/tools registry
  ↓
Agent assignment
```

### Vercel AI SDK Compatibility

**Tool structure:**
```typescript
export const myTool = tool({
  description: "What the tool does and when to use it",
  inputSchema: z.object({ ... }),  // Zod schema
  execute: async (input) => { ... }, // Validated input
});
```

**Compatibility Assessment:**
- ✅ Zod schemas: Compatible
- ✅ `inputSchema` field: Exact match
- ✅ `execute` function: Receives validated input, returns JSON
- ✅ `description` field: Critical for model decision-making
- ✅ Return type: JSON-serializable output

**Conclusion:** Our I/O schema approach is highly compatible. The main work is generating the right structure.

---

## 5. Lessons Learned

### Execution Model Insights

**Current limitations:**
- Shell piping (`node file1.js | node file2.js`) loses all structure
- No validation between nodes
- Can't run partial workflows (single node or sub-chain)
- Edge mappings exist but aren't used

**Future vision:**
- JSON payloads routed via edge mappings
- Zod validation at each node boundary
- Selective execution for debugging/testing
- Type-safe data flow end-to-end

### Transpilation Strategy

**What we learned:**
- Node specs already have all the metadata we need
- Zod schemas can be generated deterministically
- TypeScript inference gives us type-safe signatures
- Edge mappings can be compiled into routing logic
- The Vercel AI SDK pattern is a perfect fit

**What we need to build:**
1. Schema generator utility (`ContractField[]` → Zod)
2. Code wrapper generator (inject user code into typed functions)
3. Edge mapping compiler (generate routing logic)
4. Workflow orchestrator (sequence nodes respecting mappings)
5. Tool export generator (create `tool()` + `ToolDefinition`)

---

## 6. Next Steps

- [ ] Phase A: Schema Foundations - Create `schemaGenerators.ts`, extend `WorkflowNodeData`
- [ ] Phase B: Edge & Mapping Enhancements - Modify `canvasSlice.onConnect`, expand `IoMappingSlice` validation
- [ ] Phase C: Runtime Refactor - Replace shell piping with JSON-based runner
- [ ] Phase D: Workflow → Tool Transpiler - Build generator that emits schemas, node functions, orchestrator, tool export
- [ ] Phase E: Documentation & Testing - Update integration docs, add troubleshooting guide, establish automated tests

---

## References

- **Related Diary:** `09-AgentRegistry.md` - Multi-agent registry
- **Related Diary:** `11-AgentToolManagement.md` - Tool management UI
- **Task Docs:** `_docs/_tasks/2-workflow-schema-and-transpiler.md`
- **Example Output:** `_docs/_tasks/2-workflow-schema-and-transpiler-example.ts`
- **Vercel AI SDK Guide:** https://vercel.com/kb/guide/how-to-build-ai-agents-with-vercel-and-the-ai-sdk

---

**Last Updated:** 2025-01-15
