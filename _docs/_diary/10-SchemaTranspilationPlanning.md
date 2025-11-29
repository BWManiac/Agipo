# Diary Entry 10: Workflow Schema Generation & Tool Transpilation Planning

## 1. Motivation & Context

Following the successful multi-agent registry implementation (Entry 9), we've been exploring how to bridge the gap between workflow authoring and agent tool capabilities. The core vision: **users should be able to design workflows in the canvas and promote them into agent tools without hand-writing glue code**.

This entry documents our deep dive into:
- Understanding the current workflow execution model
- Designing a schema-driven approach for type-safe data flow
- Validating compatibility with Vercel AI SDK's tool calling pattern
- Creating a concrete example of what transpiled workflow tools should look like

---

## 2. Current State Analysis

### 2.1 Execution Flow Discovery

**How workflows currently run:**
- Each node stores raw code as a string in `node.data.code` (no type information)
- On "Run", `workflowExecutionService.ts` creates a shell command that:
  1. Writes each node's code to `/tmp/node-{id}.js` using `echo`
  2. Executes them with pipes: `node /tmp/node-1.js | node /tmp/node-2.js`
  3. Data flows via stdout/stdin — no structure, no validation

**Key insight:** The execution is purely string-based. There's no awareness of:
- Node input/output schemas
- Edge mappings (which fields connect where)
- Type validation
- Partial execution capabilities

### 2.2 Edge Mappings (Existing but Unused)

We discovered that `ioMappingSlice.ts` already stores `EdgeMapping` records with:
- Field-level bindings between upstream outputs and downstream inputs
- Type compatibility checks (`typesCompatible` function)
- Support for static values and optional fields

**Problem:** These mappings are:
- Not automatically created when React Flow edges are drawn
- Not used by the execution engine (still uses stdout pipes)
- Only manually configured via the sidebar edge editor

### 2.3 Node Specs (Foundation Exists)

Each node already has `spec.inputs` and `spec.outputs` as `ContractField[]` with:
- `name`, `type`, `itemType`, `description`, `optional`
- Business-friendly types: `text`, `number`, `flag`, `list`, `record`, `file`

**Opportunity:** This metadata is perfect for generating Zod schemas and TypeScript types.

---

## 3. The Schema-Driven Vision

### 3.1 Core Idea

Instead of piping raw strings between nodes, we want:
1. **Zod schemas generated from node specs** — `spec.inputs` → `InputSchema`, `spec.outputs` → `OutputSchema`
2. **Typed function wrappers** — Each node's code wrapped in `async (input: InputType) => OutputType`
3. **Edge mapping-driven execution** — JSON payloads routed between nodes using `EdgeMapping` records
4. **Deterministic transpilation** — Workflows compile to single tool files with predictable signatures

### 3.2 Why Zod?

**Compatibility:** Vercel AI SDK already uses Zod for tool `inputSchema`. Our approach aligns perfectly.

**Benefits:**
- Runtime validation (catch type mismatches before execution)
- Type inference (`z.infer<typeof Schema>` gives us TypeScript types)
- Single source of truth (node specs → Zod → types → validation)
- Model understanding (`.describe()` fields help AI decide when to call tools)

### 3.3 The Transpilation Path

**Workflow → Tool Flow:**
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

---

## 4. Vercel AI SDK Compatibility Analysis

### 4.1 Pattern Discovery

After reviewing [Vercel's AI Agent guide](https://vercel.com/kb/guide/how-to-build-ai-agents-with-vercel-and-the-ai-sdk), we confirmed:

**Tool structure:**
```typescript
export const myTool = tool({
  description: "What the tool does and when to use it",
  inputSchema: z.object({ ... }),  // Zod schema
  execute: async (input) => { ... }, // Validated input
});
```

**Key characteristics:**
- `description` is critical — model uses it to decide when to call the tool
- `inputSchema` uses Zod — fields should have `.describe()` for better understanding
- `execute` receives validated input — AI SDK validates before calling
- Return must be JSON-serializable

### 4.2 Our Current Tool Pattern

**Existing tools** (`_tables/tools/requirements-digest.ts`):
```typescript
export const requirementsDigestTool: ToolDefinition = {
  id: "requirements_digest",
  name: "Requirements Digest",
  description: "...",
  runtime: "webcontainer",
  run: tool({  // The tool() instance
    description: "...",
    inputSchema: z.object({ ... }),
    execute: async (input) => { ... },
  }),
};
```

**Key insight:** The `ToolDefinition` wrapper adds metadata (`id`, `name`, `runtime`) but the Agent only sees the `run` field (the `tool()` instance). This separation is perfect for our transpiler.

### 4.3 Compatibility Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Zod schemas | ✅ Compatible | Both use Zod for `inputSchema` |
| `inputSchema` field | ✅ Compatible | Exact match with Vercel pattern |
| `execute` function | ✅ Compatible | Receives validated input, returns JSON |
| `description` field | ✅ Compatible | Critical for model decision-making |
| Return type | ✅ Compatible | JSON-serializable output |

**Conclusion:** Our I/O schema approach is highly compatible. The main work is generating the right structure.

---

## 5. Example Transpiled Output

### 5.1 Creating the Target

We created `_docs/_tasks/2-workflow-schema-and-transpiler-example.ts` as a concrete example of what the transpiler should generate. Based on the "yc-2" workflow (5 nodes: Get Applications → Filter → Score → Select Top → Assign Reviewers).

### 5.2 Key Components

**1. Schema Generation:**
```typescript
const ScoreApplications_InputSchema = z.object({
  applications: z.array(z.record(z.string(), z.unknown()))
    .describe("The list of applications to score."),
});
```

**2. Typed Node Functions:**
```typescript
async function scoreApplicationsNode(
  input: ScoreApplications_Input
): Promise<ScoreApplications_Output> {
  const validatedInput = ScoreApplications_InputSchema.parse(input);
  const { applications } = validatedInput;
  
  // User's TypeScript code injected here
  // ... scoring logic ...
  
  return ScoreApplications_OutputSchema.parse(result);
}
```

**3. Workflow Orchestrator:**
```typescript
async function executeWorkflowChain(input: {...}): Promise<Record<string, unknown>> {
  const step1Result = await getNewApplicationsNode();
  const step2Result = await filterByKeywordsNode({
    applications: step1Result.applications,
    keywords: input.keywords || ["AI", "SaaS"],
  });
  // ... continues through all nodes respecting edge mappings
}
```

**4. Tool Export:**
```typescript
export const ycApplicationScoringTool = tool({
  description: "Scores YC applications...",
  inputSchema: z.object({
    keywords: z.array(z.string()).optional(),
    reviewers: z.array(z.string()).optional(),
  }),
  execute: async (input) => {
    return await executeWorkflowChain(input);
  },
});

export const ycApplicationScoringToolDefinition: ToolDefinition = {
  id: "yc-application-scoring",
  name: "YC Application Scoring Workflow",
  description: "...",
  runtime: "internal",
  run: ycApplicationScoringTool,
};
```

### 5.3 Important Decisions

**Language:** Users write TypeScript/JavaScript directly — no translation needed. The transpiler injects their code as-is into typed wrappers.

**Edge Mappings:** Internal to the workflow — the agent never sees them. They only affect the `execute` function's internal routing logic.

**Workflow Inputs:** Only external inputs (what the agent can control) appear in `tool.inputSchema`. Internal node-to-node data flow is hidden.

---

## 6. Architectural Decisions & Open Questions

### 6.1 Decisions Made

1. **Zod for schemas** — Aligns with Vercel AI SDK, provides validation + type inference
2. **TypeScript/JavaScript only** — Simplifies transpilation, no language translation needed
3. **ToolDefinition wrapper** — Separates metadata (id, name, runtime) from tool() instance
4. **Edge mappings are internal** — Agent sees simple tool interface, not workflow complexity

### 6.2 Open Questions

**1. Workflow Input Schema Generation**
- How do we determine what goes in `tool.inputSchema`?
- Options: Entry node inputs only, all configurable parameters, or explicit workflow-level inputs
- **Recommendation:** Add explicit `externalInputs` field to workflow metadata

**2. Description Generation**
- How do we generate the tool `description`?
- Options: Concatenate node summaries, use workflow name + description, or AI-generated
- **Recommendation:** Use workflow-level description if available, otherwise synthesize from node summaries

**3. Edge Mapping Code Generation**
- How do edge mappings appear in transpiled code?
- **Approach:** Generate routing logic from `EdgeMapping` records that extracts fields from source outputs and maps to target inputs

**4. Record Typing Depth**
- How deep do we nest `record` schemas?
- **Current approach:** Start with `z.record(z.string(), z.unknown())` for flexibility

**5. Runtime Location**
- Should JSON-based orchestrator live in WebContainer only, or need server-friendly version?
- **Future consideration:** May need both for different execution contexts

---

## 7. Task Documentation Created

### 7.1 Main Task Document
`_docs/_tasks/2-workflow-schema-and-transpiler.md` — Comprehensive planning document covering:
- Objectives and success criteria
- Current state snapshot
- Phased work breakdown (A-E)
- Open questions and references

### 7.2 Compatibility Analysis
`_docs/_tasks/2-workflow-schema-vercel-ai-sdk-compatibility.md` — Deep dive into:
- Vercel AI SDK tool pattern
- Current implementation analysis
- Compatibility assessment
- Architectural decisions needed
- Recommended next steps

### 7.3 Example Output
`_docs/_tasks/2-workflow-schema-and-transpiler-example.ts` — Concrete example showing:
- Zod schema generation from node specs
- Typed node function wrappers
- Workflow composition with edge mappings
- Tool export matching Vercel AI SDK pattern
- ToolDefinition wrapper for registry integration

---

## 8. Key Learnings

### 8.1 Execution Model Insights

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

### 8.2 Transpilation Strategy

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

### 8.3 Compatibility Wins

**Why this approach works:**
- Vercel AI SDK already uses Zod — no translation needed
- Our node specs map naturally to Zod schemas
- Tool registration pattern matches existing codebase
- Edge mappings hide complexity from agents (they see simple tools)

---

## 9. Next Steps & Implementation Plan

### Phase A: Schema Foundations
1. Create `schemaGenerators.ts` — Convert `BusinessFieldType` → Zod builders
2. Extend `WorkflowNodeData` — Add cached `inputSchema`, `outputSchema`, `language` metadata
3. Update node editor UI — Surface schema previews, enforce language selection

### Phase B: Edge & Mapping Enhancements
1. Modify `canvasSlice.onConnect` — Initialize `EdgeMapping` when edges are drawn
2. Expand `IoMappingSlice` validation — Use generated Zod schemas
3. Update `EdgeEditorTable` — Schema-driven hints and validation
4. Ensure `applyToolResult` — Initialize mappings for agent-driven wiring

### Phase C: Runtime Refactor
1. Replace shell piping with JSON-based runner
2. Implement selective execution (single node, sub-chain)
3. Add Zod validation at node boundaries

### Phase D: Workflow → Tool Transpiler
1. Build generator that emits schemas, node functions, orchestrator, tool export
2. Provide export action (CLI or in-app)
3. Document integration steps for registry

### Phase E: Documentation & Testing
1. Update integration docs with schema/transpiler specifics
2. Add troubleshooting guide
3. Establish automated tests

---

## 10. Codebase Touchpoints

| Area | Files | Notes |
|------|-------|-------|
| **Node specs** | `app/experiments/workflow-generator/store/types.ts` | `WorkflowNodeData`, `ContractField` |
| **Business types** | `app/experiments/workflow-generator/types/domain.ts` | `BusinessFieldType`, `EdgeFieldRef` |
| **Edge mappings** | `app/experiments/workflow-generator/store/slices/ioMappingSlice.ts` | Current mapping logic |
| **Execution** | `app/experiments/workflow-generator/services/workflowExecutionService.ts` | Current stdout-pipe model |
| **Edge editor** | `app/experiments/workflow-generator/components/editor/data-mapping/EdgeEditorTable.tsx` | UI for field bindings |
| **Tool registry** | `_tables/tools/*.ts`, `_tables/types.ts` | ToolDefinition pattern |
| **Agent route** | `app/api/workforce/agent/route.ts` | How tools are loaded and used |
| **Example output** | `_docs/_tasks/2-workflow-schema-and-transpiler-example.ts` | Target for transpiler |

---

## 11. Summary

We've established a clear path from workflow authoring to agent tools:

1. **Current state:** Workflows execute via shell pipes, edge mappings exist but aren't used, node specs have metadata but no schemas
2. **Vision:** Generate Zod schemas from specs, wrap user code in typed functions, route data via edge mappings, transpile to Vercel AI SDK tools
3. **Compatibility:** Our approach aligns perfectly with Vercel AI SDK — both use Zod, same tool pattern, same validation model
4. **Example:** Created concrete example showing exactly what transpiled output should look like
5. **Planning:** Documented phases, decisions, and open questions in task docs

**Key insight:** The I/O schema approach we're designing isn't just compatible with Vercel AI SDK — it's the natural evolution. Node specs → Zod schemas → typed functions → tool exports creates a deterministic pipeline that bridges visual authoring and programmatic tool usage.

**Next milestone:** Implement Phase A (schema foundations) to prove the concept, then iterate through the remaining phases to deliver end-to-end transpilation.

---

## 12. References

- `_docs/_tasks/2-workflow-schema-and-transpiler.md` — Main planning document
- `_docs/_tasks/2-workflow-schema-vercel-ai-sdk-compatibility.md` — Compatibility analysis
- `_docs/_tasks/2-workflow-schema-and-transpiler-example.ts` — Example transpiled output
- `_docs/Engineering/Integrations/workflow-generator-agent-integration.md` — Original integration plan
- `_docs/UXD/Pages/workflow/io-visualizations/workflow-edge-mapping.md` — Edge mapping spec
- [Vercel AI Agent Guide](https://vercel.com/kb/guide/how-to-build-ai-agents-with-vercel-and-the-ai-sdk) — Tool calling pattern reference

