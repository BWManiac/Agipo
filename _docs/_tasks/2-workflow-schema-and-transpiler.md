# Task 2 – Workflow Schema & Transpiler Initiative

## Objective
- [ ] Establish a deterministic workflow schema that bridges canvas authoring, runtime execution, and tool transpilation.
- [ ] Generate Zod-based validators and TypeScript types for every node’s inputs/outputs so that mappings and execution can enforce compatibility automatically.
- [ ] Define the compilation path that turns a workflow (or sub-flow) into a single executable tool module suitable for agent registries (e.g., `alexKimAgent`).

---

## Why This Matters
- **Typed data flow:** Today, edges are decorative. They rely on manual sidebar bindings and the execution engine still pipes stdout → stdin blindly (`workflowExecutionService.ts`). Generating schemas lets us validate bindings at creation time and enforce types during partial or full runs.
- **Tool promotion:** `_docs/Engineering/Integrations/workflow-generator-agent-integration.md` calls for transpiling workflows into `tool()` modules. Without deterministic schemas and signatures, generated files can’t safely plug into `_tables/tools`.
- **Agent parity:** `_docs/diary/entry9.md` highlights the push to treat workflows as first-class tools in the registry. Delivering typed contracts keeps runtime behavior aligned with what agents expect.
- **UX clarity:** Explicit schema knowledge unlocks richer UI (auto-suggested bindings, inline warnings) and improves assistant-driven edits because the model can reason about field types instead of raw strings.

---

## Current State (Snapshot)
- **Node specs** already capture `inputs`, `outputs`, `process` as `ContractField[]` (`store/types.ts`). Business-friendly types originate from `types/domain.ts`.
- **Edge mappings** (`ioMappingSlice.ts`) store `EdgeMapping` records and run lightweight compatibility checks, but they’re not automatically created when React Flow edges are drawn. Chat tools also skip mapping updates.
- **Execution** (`workflowExecutionService.ts`) shells each node and pipes stdout, ignoring `EdgeMapping`. There’s no JSON payload or schema validation between nodes.
- **UI** (Edge editor table) manually references spec fields but lacks awareness of generated schemas, so validation warnings are coarse (“type mismatch” only).
- **Code nodes** `CodeNode.tsx` store raw `code` strings with no language metadata or enforced signature, making transpilation ambiguous.

---

## Success Criteria
- **Schema Generation:** Utility converts `ContractField[]` → Zod object shape and exposes inferred TypeScript types for inputs and outputs. Supports lists (with `itemType`), optional fields, and future record/file extensions.
- **Runtime Adoption:** Execution path consumes schemas + mappings:
  - Bindings drive JSON payloads between nodes instead of pipe-only stdout.
  - Partial runs (single node or sub-chain) validate incoming data before executing.
  - Missing or incompatible data produces structured warnings/errors.
- **Deterministic Node Contracts:** Each node code block is wrapped in a function with signature `async (input: Input) => Output` where `Input`/`Output` are Zod-inferred types. Language/runtime metadata captured alongside `code`.
- **Transpiler Output:** Exporting a workflow produces:
  1. `InputSchema` / `OutputSchema` (Zod) + inferred types.
  2. Node execution functions that respect mappings.
  3. An orchestrator that sequences nodes per edge graph.
  4. A `tool({ inputSchema, execute })` export ready for `_tables/tools`.
- **Assistant Compatibility:** `applyToolResult` and related chat tools update mappings/schemas automatically when nodes or edges change.

---

## Proposed Work Breakdown
### Phase A – Schema Foundations
1. Create `schemaGenerators.ts` that maps `BusinessFieldType` → Zod builders (`text → z.string()`, `list → z.array(...)`, `record → z.record(z.string(), z.any())`, etc.).
2. Extend `WorkflowNodeData` with cached `inputSchema`, `outputSchema`, and `language` metadata. Provide selectors/hooks to access them.
3. Update node editor UI to surface schema previews and enforce language selection (initially default to JavaScript/TypeScript).

### Phase B – Edge & Mapping Enhancements
1. Modify `canvasSlice.onConnect` to initialize an empty `EdgeMapping` entry, wiring the visual edge to the mapping slice by default.
2. Expand `IoMappingSlice` validation to leverage generated Zod schemas (e.g., `InputSchema.shape[field]`).
3. Update `EdgeEditorTable` to surface schema-driven hints (e.g., `list<Record>` descriptor, static value defaults respecting types).
4. Ensure `applyToolResult` (especially `connectNodes` intent) initializes mappings so agent-driven wiring shares the same path.

### Phase C – Runtime Refactor
1. Replace shell piping with a JSON-based runner:
   - Each node writes its output JSON to temp storage.
   - Downstream node reads from temp using mapping definitions.
   - Enforce Zod validation on both sides.
2. Introduce selective execution helpers (single node, sub-chain) using the same runtime so debugging and testing flows are deterministic.

### Phase D – Workflow → Tool Transpiler
1. Build a generator that, given workflow state, emits:
   - Schema definitions (`InputSchema`, `OutputSchema`).
   - Node functions with strongly-typed signatures.
   - Mapping-aware orchestrator (likely an async generator or pipeline).
   - Metadata JSON aligning with `_tables/tools/*`.
2. Provide CLI or in-app export action (e.g., “Generate Tool”) that writes the module to a configurable folder.
3. Document integration steps for plugging the generated tool into an agent (update `_tables/tools/index.ts`, assign via `_tables/agents/*`).

### Phase E – Documentation & Guardrails
1. Update `_docs/Engineering/Integrations/workflow-generator-agent-integration.md` with schema/transpiler specifics.
2. Add troubleshooting guide (e.g., type mismatch debugging, partial run errors).
3. Establish automated tests for schema generation and transpiler output (Jest or Vitest).

---

## Open Questions
- **Language support:** Do we enforce JS/TS only or introduce multi-language support with transpilation (Python → JS)? Early focus should probably be JS/TS for deterministic tooling.
- **Record typing depth:** How deep do we nest `record` schemas? Do we allow author-defined sub-fields or keep it loose (`z.record(z.any())`) initially?
- **Runtime location:** Should the JSON-based orchestrator live in WebContainer only, or do we need a server-friendly counterpart once workflows run on the backend?
- **Versioning:** How do we version generated schemas and tools to support marketplace updates without breaking existing agents?
- **Security:** When executing user-authored code, what sandboxing is required beyond WebContainer? (Future concern but worth tracking.)

---

## References
- `app/experiments/workflow-generator/store/types.ts` – `WorkflowNodeData` and `ContractField`.
- `app/experiments/workflow-generator/types/domain.ts` – business-friendly type definitions (`BusinessFieldType`, `EdgeFieldRef`, etc.).
- `app/experiments/workflow-generator/store/slices/ioMappingSlice.ts` – current mapping and validation logic.
- `app/experiments/workflow-generator/services/workflowExecutionService.ts` – existing stdout-pipe execution model to replace.
- `_docs/UXD/Pages/workflow/io-visualizations/workflow-edge-mapping.md` – original mapping spec aligning UI/state/execution.
- `_docs/Engineering/Integrations/workflow-generator-agent-integration.md` – high-level plan for workflow-to-tool compilation.
- `_docs/diary/entry9.md` – registry/agent hydration goals, including transpiling workflows into `ToolDefinition`.

---

## Next Steps
- Kick off Phase A with a spike PR: implement `schemaGenerators.ts`, add language metadata to nodes, and expose schema selectors.
- Align with product/spec stakeholders to confirm JS/TS-only scope for initial implementation.
- Draft acceptance criteria for the runtime refactor (Phase C) before undertaking substantial changes, ensuring partial execution and validation behaviors are locked in.



