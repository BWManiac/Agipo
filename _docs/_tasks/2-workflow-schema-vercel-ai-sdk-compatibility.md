# Workflow Schema & Vercel AI SDK Compatibility Analysis

## Executive Summary

**Good news:** Our I/O schema approach is highly compatible with Vercel AI SDK's tool calling pattern. Both use Zod for validation, and the workflow-to-tool transpilation path aligns naturally. However, there are some architectural decisions to reconcile around tool registration and how workflow internal state maps to agent-facing interfaces.

---

## Vercel AI SDK Tool Pattern (Reference)

Based on [Vercel's AI Agent guide](https://vercel.com/kb/guide/how-to-build-ai-agents-with-vercel-and-the-ai-sdk):

### Tool Definition Structure
```typescript
import { tool } from "ai";
import { z } from "zod";

export const myTool = tool({
  description: "Clear description of what the tool does and when to use it",
  inputSchema: z.object({
    field: z.string().describe("Field description for model understanding"),
  }),
  execute: async (input) => {
    // Input is already validated by AI SDK
    // Return must be JSON-serializable
    return { result: "..." };
  },
});
```

### Key Characteristics
1. **`description` is critical** - Model uses this to decide when/why to call the tool
2. **`inputSchema` uses Zod** - Fields should have `.describe()` for better model understanding
3. **`execute` receives validated input** - AI SDK validates before calling
4. **Return must be JSON-serializable** - No functions, classes, etc.
5. **Tools passed to Agent** - `new Agent({ tools: { toolName: myTool } })`

---

## Current Implementation Analysis

### How Tools Are Currently Registered

**File:** `_tables/types.ts`
```typescript
export type ToolDefinition = {
  id: string;
  name: string;
  description: string;
  runtime?: "webcontainer" | "internal" | "http" | string;
  run: Tool<unknown, unknown>;  // This is the tool() instance
};
```

**File:** `app/api/workforce/agent/route.ts`
```typescript
// Tools are loaded from registry
const toolMap: Record<string, Tool<unknown, unknown>> = {};
for (const toolId of agent.toolIds) {
  const toolDef = getToolById(toolId);
  toolMap[toolId] = toolDef.run;  // Extract the tool() instance
}

// Passed to Agent
const dynamicAgent = new Agent({
  tools: toolMap,  // Direct tool instances
  // ...
});
```

**Key Insight:** The `ToolDefinition` wrapper adds metadata (`id`, `name`, `runtime`) but the Agent only sees the `run` field (the `tool()` instance). This is a clean separation.

---

## Transpiled Example Compatibility

### What We're Generating

**File:** `2-workflow-schema-and-transpiler-example.ts`
```typescript
export const ycApplicationScoringTool = tool({
  id: "yc-application-scoring",        // ⚠️ Not in Vercel docs
  name: "YC Application Scoring",       // ⚠️ Not in Vercel docs
  description: "Scores YC applications...",
  inputSchema: z.object({ ... }),     // ✅ Matches Vercel pattern
  execute: async (input) => { ... },    // ✅ Matches Vercel pattern
});
```

### Compatibility Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| **Zod schemas** | ✅ Compatible | Both use Zod for `inputSchema` |
| **`inputSchema` field** | ✅ Compatible | Exact match with Vercel pattern |
| **`execute` function** | ✅ Compatible | Receives validated input, returns JSON |
| **`description` field** | ✅ Compatible | Critical for model decision-making |
| **`id`/`name` in tool()** | ⚠️ Unclear | Vercel docs don't show these - may need to be in wrapper |
| **Return type** | ✅ Compatible | JSON-serializable output |

### Potential Issue: `id` and `name` in `tool()`

The Vercel documentation doesn't show `id` or `name` as parameters to `tool()`. These might need to live in the `ToolDefinition` wrapper instead:

```typescript
// Generated tool (no id/name)
export const ycApplicationScoringTool = tool({
  description: "...",
  inputSchema: z.object({ ... }),
  execute: async (input) => { ... },
});

// ToolDefinition wrapper (has id/name)
export const ycApplicationScoringToolDefinition: ToolDefinition = {
  id: "yc-application-scoring",
  name: "YC Application Scoring Workflow",
  description: "...",
  runtime: "internal",
  run: ycApplicationScoringTool,  // The tool() instance
};
```

**Action:** Verify if `tool()` accepts `id`/`name` or if they must be in the wrapper.

---

## I/O Schema Approach → Vercel AI SDK Mapping

### The Translation Path

Our workflow authoring model (I/O schemas) maps naturally to Vercel's tool pattern:

```
Workflow Node Spec          →  Vercel Tool
─────────────────────────────────────────────
node.data.spec.inputs       →  tool.inputSchema
node.data.spec.outputs      →  tool.execute return type (validated)
node.data.code              →  tool.execute implementation
Edge mappings               →  Internal workflow routing (hidden from agent)
```

### Workflow-Level Tool Generation

For a complete workflow, we need to decide:

1. **What becomes the tool's `inputSchema`?**
   - Option A: External inputs only (workflow entry points)
   - Option B: All configurable parameters (keywords, reviewers, thresholds)
   - Option C: Empty schema if workflow has no external inputs

2. **What becomes the tool's `description`?**
   - Should be generated from workflow metadata (title, flow summaries)
   - Must clearly explain when/why an agent should use this tool
   - Should mention key capabilities (scoring, filtering, assignment)

3. **How do edge mappings affect the tool?**
   - Edge mappings are **internal** - they route data between nodes
   - The agent never sees edge mappings
   - They only affect the `execute` function's internal logic

### Example: Multi-Node Workflow → Single Tool

**Workflow Structure:**
```
Get Applications → Filter by Keywords → Score → Select Top → Assign Reviewers
```

**Generated Tool:**
```typescript
export const workflowTool = tool({
  description: "Processes YC applications: fetches, filters by keywords, scores, selects top candidates, and assigns to reviewers.",
  
  // Only external inputs (what agent can control)
  inputSchema: z.object({
    keywords: z.array(z.string()).optional().describe("Keywords to filter applications"),
    reviewers: z.array(z.string()).optional().describe("Reviewer names for assignment"),
  }),
  
  execute: async (input) => {
    // Internal execution uses edge mappings to route data
    // Agent never sees the internal node structure
    const result = await executeWorkflowChain(input);
    return result;  // Final output (assignments)
  },
});
```

**Key Insight:** The workflow's internal complexity (5 nodes, edge mappings) is hidden. The agent sees a simple tool with clear inputs/outputs.

---

## Architectural Decisions Needed

### 1. Tool Registration Pattern

**Question:** Should transpiled workflows export:
- A) Just the `tool()` instance (let `ToolDefinition` wrapper be added manually)
- B) Both the `tool()` instance AND a `ToolDefinition` object
- C) A factory function that generates the `ToolDefinition`

**Recommendation:** Option B - Export both for flexibility:
```typescript
// Generated file exports both
export const ycApplicationScoringTool = tool({ ... });
export const ycApplicationScoringToolDefinition: ToolDefinition = {
  id: "yc-application-scoring",
  name: "YC Application Scoring",
  description: "...",
  runtime: "internal",
  run: ycApplicationScoringTool,
};
```

### 2. Workflow Input Schema Generation

**Question:** How do we determine what goes in `tool.inputSchema`?

**Options:**
- **A) Entry node inputs only** - If first node has inputs, those become tool inputs
- **B) All configurable parameters** - Scan workflow for nodes that accept external config
- **C) Explicit workflow-level inputs** - Add a new field to workflow metadata for "external inputs"

**Recommendation:** Option C - Add explicit workflow inputs to workflow metadata:
```typescript
// Workflow metadata (new field)
{
  id: "yc-2",
  name: "YC Application Scoring",
  externalInputs: [
    { name: "keywords", type: "list", itemType: "text" },
    { name: "reviewers", type: "list", itemType: "text" },
  ],
  // ...
}
```

### 3. Description Generation Strategy

**Question:** How do we generate the tool `description`?

**Options:**
- **A) Concatenate node flow summaries** - "Get applications. Filter by keywords. Score applications..."
- **B) Use workflow name + high-level description** - "Scores YC applications and assigns to reviewers"
- **C) AI-generated description** - Use LLM to summarize workflow purpose

**Recommendation:** Option B with fallback to A - Use workflow-level description if available, otherwise synthesize from node summaries.

### 4. Edge Mappings in Transpiled Code

**Question:** How do edge mappings appear in the transpiled file?

**Current Example:** Hard-coded in `executeWorkflowChain`:
```typescript
const step2Result = await filterByKeywordsNode({
  applications: step1Result.applications,  // Manual mapping
  keywords: ["AI", "SaaS"],                 // Static value
});
```

**Better Approach:** Generate mapping logic from `EdgeMapping` records:
```typescript
// Generated from edge mappings
function routeData(sourceOutput: unknown, edgeMapping: EdgeMapping): unknown {
  const targetInput: Record<string, unknown> = {};
  for (const link of edgeMapping.links) {
    if (link.from) {
      // Extract from source output
      targetInput[link.to.fieldName] = extractField(sourceOutput, link.from.fieldName);
    } else if (link.staticValue) {
      // Use static value
      targetInput[link.to.fieldName] = parseStaticValue(link.staticValue, link.to.type);
    }
  }
  return targetInput;
}
```

---

## Compatibility Checklist

### ✅ Already Compatible
- [x] Zod schema generation from node specs
- [x] `inputSchema` structure matches Vercel pattern
- [x] `execute` function signature matches Vercel pattern
- [x] JSON-serializable return types
- [x] Tool registration via `ToolDefinition.run`

### ⚠️ Needs Verification
- [ ] Does `tool()` accept `id`/`name` parameters? (Check AI SDK source)
- [ ] Can we use `z.record(z.unknown())` for record types? (Works but loses type safety)
- [ ] How do nested record types work? (e.g., `list<record<{name: string}>>`)

### 🔨 Needs Implementation
- [ ] Workflow-level input schema generation
- [ ] Description generation from workflow metadata
- [ ] Edge mapping → code generation
- [ ] ToolDefinition wrapper generation
- [ ] Integration with `_tables/tools` registry

---

## Recommended Next Steps

### Phase 1: Verification
1. Check AI SDK source/docs to confirm `tool()` parameter signature
2. Test if `z.record(z.unknown())` works for our use case
3. Verify tool registration pattern with a simple test

### Phase 2: Schema Generation Refinement
1. Implement workflow-level `externalInputs` metadata
2. Build description generator (workflow name + summary)
3. Enhance Zod generator to handle nested records (if needed)

### Phase 3: Transpiler Implementation
1. Generate `tool()` instance with proper `inputSchema` and `execute`
2. Generate `ToolDefinition` wrapper with metadata
3. Generate edge mapping routing logic
4. Export both for registry integration

### Phase 4: Integration Testing
1. Transpile a simple workflow (2-3 nodes)
2. Register in `_tables/tools`
3. Assign to an agent
4. Test tool calling via agent chat

---

## Key Insights

1. **I/O Schema Approach is Compatible** - Our node input/output specs translate directly to Zod schemas, which Vercel AI SDK expects.

2. **Edge Mappings are Internal** - They don't appear in the tool's `inputSchema` or `description`. They only affect the `execute` function's implementation.

3. **Workflow Complexity is Hidden** - A 5-node workflow with complex edge mappings becomes a simple tool with clear inputs/outputs from the agent's perspective.

4. **Description is Critical** - The tool's `description` field is what the model uses to decide when to call it. We must generate high-quality descriptions.

5. **ToolDefinition Wrapper is Necessary** - The `tool()` instance alone isn't enough for our registry. We need the wrapper for `id`, `name`, `runtime`, etc.

---

## References

- [Vercel AI Agent Guide](https://vercel.com/kb/guide/how-to-build-ai-agents-with-vercel-and-the-ai-sdk)
- `_docs/_tasks/2-workflow-schema-and-transpiler-example.ts` - Example transpiled output
- `app/api/workforce/agent/route.ts` - Current tool registration pattern
- `_tables/types.ts` - ToolDefinition interface
- `_docs/Engineering/Integrations/workflow-generator-agent-integration.md` - Original integration plan

