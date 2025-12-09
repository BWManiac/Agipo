# Workflow Builder Service

> Constructs Mastra workflows from JSON definitions at runtime.

**Service:** `workflow-builder.ts`  
**Domain:** Workflows

---

## Purpose

This service builds executable Mastra workflows from workflow definitions (workflow.json) at runtime. It converts JSON Schema to Zod schemas, builds execute functions for different step types (Composio, custom code), creates step input mapping transforms, and assembles workflows using Mastra's workflow API. Without this service, workflows would be static files - they couldn't be dynamically constructed or customized at runtime.

**Product Value:** Enables the "workflow-as-code" runtime execution model. When workflows are executed, this service constructs them from definitions, allowing workflows to be modified without re-transpilation and enabling dynamic workflow creation. This solves the Turbopack dynamic import issue by building workflows as JavaScript objects instead of loading transpiled files.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `buildWorkflowFromDefinition()` | Main builder function that constructs a complete Mastra workflow from a workflow definition and step bindings. | When executing workflows at runtime - builds workflow object from JSON definition |

---

## Approach

The service converts runtime inputs to Zod input schemas, creates workflow base with Mastra's createWorkflow, builds execute functions for each step type (Composio tools use Composio client, custom code steps are placeholders for future implementation), creates mapping transforms for step input bindings (workflow inputs → step inputs, step outputs → step inputs), assembles steps in order using Mastra's .then() and .map() APIs, and commits the workflow. All conversions happen at runtime without transpilation.

---

## Public API

### `buildWorkflowFromDefinition(definition: WorkflowDefinition, bindings: Record<string, StepBindings>): ReturnType<typeof createWorkflow>`

**What it does:** Constructs a complete Mastra workflow from a workflow definition and step bindings, ready for execution.

**Product Impact:** This is how workflows become executable. When workflows run, this function builds the workflow object from the JSON definition, enabling runtime workflow construction without transpilation.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `definition` | WorkflowDefinition | Yes | Workflow definition from workflow.json with steps, runtimeInputs, etc. |
| `bindings` | Record<string, StepBindings> | Yes | Step input bindings keyed by step ID, mapping workflow inputs and step outputs to step inputs |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | ReturnType<typeof createWorkflow> | Executable Mastra workflow object |

**Process:**

```
buildWorkflowFromDefinition(definition, bindings): Workflow
├── **Call `generateInputSchemaFromRuntimeInputs()`** to convert runtimeInputs to JSON Schema
├── **Call `jsonSchemaToZod()`** to convert JSON Schema to Zod
├── **Call `createWorkflow()`** with id, inputSchema (Zod), outputSchema (z.any())
├── Filter and sort steps:
│   ├── Filter out control flow steps (Phase 13)
│   └── Sort by listIndex (sequential order)
├── **For each step:**
│   ├── Convert step.inputSchema and step.outputSchema to Zod
│   ├── Build execute function based on step.type:
│   │   ├── **If composio:**
│   │   │   └── **Call `buildComposioExecuteFunction()`** - returns async function that:
│   │   │       ├── Gets Composio client
│   │   │       ├── Extracts connectionId from runtimeContext
│   │   │       ├── Calls client.tools.execute() with connectionId
│   │   │       └── Returns result.data
│   │   ├── **If custom:**
│   │   │   └── **Call `buildCustomExecuteFunction()`** - placeholder (Phase 14+)
│   │   └── **Else:**
│   │       └── **Call `buildDefaultExecuteFunction()`** - pass-through
│   ├── **Call `createStep()`** with id, inputSchema, outputSchema, execute
│   ├── **Call `buildMappingTransform()`** to create input mapping function
│   ├── **If mapping exists:**
│   │   └── **Call `workflow.map(mappingTransform)`**
│   └── **Call `workflow.then(stepObj)`** to add step
├── **Call `workflow.commit()`** and return
```

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `@mastra/core/workflows` | createWorkflow, createStep APIs |
| `zod` | Schema validation |
| `@/app/api/workflows/types/*` | Workflow type definitions |
| `@/app/api/connections/services/composio` | Composio client for tool execution |
| `@/app/api/workflows/[workflowId]/services/input-schema-generator` | Runtime input to schema conversion |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Workflow Execution Route | `app/api/workflows/[workflowId]/execute/route.ts` | Builds workflows for execution |
| Workflow Builder Route | `app/api/workflows/[workflowId]/build/route.ts` | Builds workflows for testing/validation |

---

## Design Decisions

### Why runtime construction instead of transpilation?

**Decision:** Workflows are built from JSON definitions at runtime rather than loading transpiled files.

**Rationale:** Solves Turbopack dynamic import issues in Next.js. Building workflows as JavaScript objects avoids file loading problems while maintaining the same execution model. Also enables dynamic workflow creation and modification without re-transpilation.

### Why JSON Schema to Zod conversion?

**Decision:** Converts JSON Schema (from workflow definitions) to Zod schemas (required by Mastra).

**Rationale:** Mastra workflows require Zod schemas for validation. Workflow definitions use JSON Schema for portability. Runtime conversion bridges the formats.

### Why mapping transforms?

**Decision:** Step input bindings are implemented as mapping transforms using Mastra's .map().

**Rationale:** Allows steps to receive data from workflow inputs or previous step outputs. The mapping transform function extracts values from bindings and passes them to step inputs, enabling data flow between steps.

---

## Related Docs

- [Workflow Loader Service README](./workflow-loader.README.md) - Loads workflow definitions used here
- [Input Schema Generator README](../[workflowId]/services/input-schema-generator.README.md) - Converts runtime inputs to schemas
- [Workflows Route README](../[workflowId]/execute/README.md) - API route that uses this service

---

## Future Improvements

- [ ] Implement custom code step execution (Phase 14+)
- [ ] Add control flow step support (if/else, loops)
- [ ] Add workflow validation/type checking
- [ ] Add workflow optimization (parallel execution where possible)
- [ ] Add workflow debugging/tracing capabilities

