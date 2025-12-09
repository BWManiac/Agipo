# Tools Transpiler Service

> Converts workflow data (nodes, edges) into executable JavaScript tool files.

**Service:** `transpiler.ts`  
**Domain:** Tools

---

## Purpose

This service transpiles visual workflow definitions (nodes with code and specs) into executable JavaScript tool files. It generates Zod schemas from node input/output specifications, wraps user code in validation functions, and creates Vercel AI SDK tool exports. Without this service, workflows created in the Tools editor would remain as visual graphs and couldn't be executed by agents.

**Product Value:** Enables the "workflow-as-code" philosophy - visual workflows become executable code. When users create workflows in the editor, this service transforms them into portable, executable JavaScript files that agents can use, making user-created capabilities durable and versionable.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `transpileWorkflowToTool()` | Converts a complete workflow definition (nodes, edges, metadata) into a JavaScript file with Zod schemas, user code wrapper, and tool exports. | After user saves a workflow in the Tools editor - generates the executable code |

---

## Approach

The transpiler generates JavaScript (not TypeScript) to ensure compatibility with dynamic imports without requiring ts-node/tsx at runtime. It maps business-friendly field types (text, number, flag, list) to Zod schema builders, generates input/output schemas from node specs, wraps user code in validation functions, and exports both a Vercel AI SDK tool and a ToolDefinition object. The generated code follows a predictable structure and naming convention.

---

## Public API

### `transpileWorkflowToTool(workflow: WorkflowData): Promise<string>`

**What it does:** Transpiles a workflow definition into a complete JavaScript tool file with schemas, user code wrapper, and tool exports, ready to be saved as tool.js.

**Product Impact:** This is how visual workflows become executable. Every time a user saves their workflow, this function generates the JavaScript code that agents will use to execute it, transforming the visual representation into actual runnable code.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `workflow` | WorkflowData | Yes | Complete workflow definition with id, name, description, nodes (with code and specs), edges |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<string> | Complete JavaScript file content ready to be written to tool.js |

**Process:**

```
transpileWorkflowToTool(workflow): Promise<string>
├── Extract workflow metadata (id, name, description)
├── Validate workflow has at least one code node
├── Get first code node (MVP: single-node workflows)
├── Extract inputs/outputs from node spec or create defaults
├── Generate schema names (PascalCase)
├── Build JavaScript file:
│   ├── Header comment (generated warning)
│   ├── Imports (zod, ai/tool)
│   ├── **Call `generateSchema()`** for inputs → InputSchema
│   ├── **Call `generateSchema()`** for outputs → OutputSchema
│   ├── Node function wrapper:
│   │   ├── Validate input against InputSchema
│   │   ├── Extract input variables
│   │   ├── Inject user code (from node.data.code)
│   │   ├── Map outputs with defaults
│   │   └── Validate output against OutputSchema
│   ├── Vercel AI SDK tool export (tool())
│   └── ToolDefinition export (registry format)
└── Return complete JavaScript file as string
```

**Error Handling:** Throws errors if workflow has no nodes or no code nodes. Schema generation errors would be thrown and caught by caller.

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `@/_tables/types` | WorkflowData type |
| `@xyflow/react` | Node type definitions |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Tools Create Route | `app/api/tools/create/route.ts` | Transpiles new workflows to tool.js |
| Tools Update Route | `app/api/tools/[toolId]/route.ts` | Retranspiles updated workflows |

---

## Design Decisions

### Why JavaScript instead of TypeScript?

**Decision:** Generated code is JavaScript (ESM) rather than TypeScript.

**Rationale:** JavaScript ensures compatibility with dynamic imports in standard Node.js environments without requiring ts-node or tsx at runtime. This simplifies deployment and reduces dependencies.

### Why single-node workflows for MVP?

**Decision:** Currently handles only the first code node (single-node workflows).

**Rationale:** Multi-node workflows require more complex data flow handling. Starting with single nodes validates the transpilation approach, and multi-node support can be added incrementally.

### Why schema generation from node specs?

**Decision:** Input/output schemas are generated from node.data.spec definitions rather than inferred from code.

**Rationale:** Explicit specs give users control over tool interfaces. The editor allows users to define inputs/outputs, and the transpiler respects those definitions, ensuring tools match user intent.

---

## Related Docs

- [Storage Service README](./storage.README.md) - Saves the transpiled code generated here
- [Custom Tools Service README](./custom-tools.README.md) - Loads the transpiled files generated here

---

## Future Improvements

- [ ] Support multi-node workflows with data flow between nodes
- [ ] Add TypeScript generation option for better developer experience
- [ ] Add code validation/linting in generated code
- [ ] Support custom imports in user code
- [ ] Add source maps for debugging generated code

