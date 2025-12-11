# Phase 8: Transpilation Engine (Sequential)

**Status:** 📋 Planned  
**Depends On:** Phase 7 (Data Mapping)  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Build the **Transpilation Engine** that converts visual workflow definitions into executable Mastra TypeScript code. When users click "Save", the system generates two files:

- `workflow.json` - Editor state (can be re-loaded for editing)
- `workflow.ts` - Executable Mastra workflow code (can be invoked by agents)

**Scope:** This phase handles **sequential workflows only**—steps connected with `.then()` and data mappings with `.map()`. Control flow primitives (branch, parallel, loop) are deferred to Phase 10.

After this phase:
- Saving the 3-step Browser→Browser→Gmail workflow generates valid TypeScript
- Generated code follows [Mastra's workflow patterns](https://mastra.ai/docs/workflows/overview)
- Generated code includes connection placeholders for runtime binding
- Users can close and reopen workflows without losing their work
- The workflow is ready for agent integration (Phase 9)

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Approach | Transpilation (not runtime interpretation) | Type-safe, debuggable, uses Mastra directly |
| Trigger | On save | Always have latest executable; no manual build step |
| Failure handling | Save JSON even if transpile fails | Don't lose user's work |
| Variable naming | From step names | Generated code is human-readable |
| Code format | Template literals | Clearer than string concatenation |
| Scope | Sequential only | Get end-to-end working first; add complexity later |
| Service location | Co-located with update route | Services live next to the route that uses them |

### Pertinent Research

From [Mastra Workflows Overview](https://mastra.ai/docs/workflows/overview):

- **`createStep()`**: Requires `id`, `inputSchema`, `outputSchema`, `execute` function
- **`createWorkflow()`**: Requires `id`, `inputSchema`, `outputSchema`
- **Chaining**: Use `.then(step)` for sequential execution
- **Finalization**: End with `.commit()` to complete the workflow
- **Execute signature**: `async ({ inputData, runtimeContext }) => {...}`
- **RuntimeContext**: Use `runtimeContext.get("connections")` for connection IDs

*Source: `15.5-workflows-f-transpilation-research.md`, Mastra docs*

### Overall File Impact

#### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/[workflowId]/update/services/transpiler/types.ts` | Create | Defines the context, options, and result types for transpilation. Enables type-safe code generation with configurable options. | A |

#### Backend / Services (Transpiler)

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/[workflowId]/update/services/transpiler/index.ts` | Create | Main orchestrator that coordinates all generators. Takes a WorkflowDefinition and produces complete TypeScript code following Mastra patterns. | A |
| `app/api/workflows/[workflowId]/update/services/transpiler/schema-generator.ts` | Create | Converts JSON Schema to Zod code strings. Enables type-safe input/output validation in generated code. | A |
| `app/api/workflows/[workflowId]/update/services/transpiler/step-generator.ts` | Create | Generates `createStep()` declarations for each workflow step. Handles Composio tool execution with connection binding. | A |
| `app/api/workflows/[workflowId]/update/services/transpiler/mapping-generator.ts` | Create | Generates `.map()` calls from data bindings. Transforms step outputs and workflow inputs into step inputs. | A |
| `app/api/workflows/[workflowId]/update/services/transpiler/workflow-generator.ts` | Create | Generates the workflow composition chain (`.then()` calls). Produces the final executable workflow export. | A |
| `app/api/workflows/[workflowId]/update/services/transpiler/README.md` | Create | Documents transpiler architecture and extension points for future control flow support. | A |

#### Backend / Services (Storage)

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/[workflowId]/update/services/storage/code-writer.ts` | Create | Writes generated TypeScript to `_tables/workflows/{id}/workflow.ts`. Provides code persistence separate from JSON state. | B |

#### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/[workflowId]/update/route.ts` | Modify | Save both `workflow.json` (editor state) and trigger transpilation to `workflow.ts`. Returns status for both operations. | B |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-8.1 | Save generates `workflow.json` with editor state | PUT → JSON file exists with steps, bindings, metadata | B |
| AC-8.2 | Save generates `workflow.ts` with executable code | PUT → TS file exists in `_tables/workflows/{id}/` | B |
| AC-8.3 | Generated code follows Mastra workflow patterns | Contains `createWorkflow`, `createStep`, `.then()`, `.commit()` | A |
| AC-8.4 | Each step becomes `createStep()` declaration | Count declarations = step count | A |
| AC-8.5 | Step execute signature matches Mastra | Has `async ({ inputData, runtimeContext }) => {...}` | A |
| AC-8.6 | Composio steps include connection handling | Has `runtimeContext.get("connections")` | A |
| AC-8.7 | Data bindings become `.map()` calls | Step with bindings → `.map(...)` before `.then()` | A |
| AC-8.8 | Sequential steps produce `.then()` chain | 3 steps → `.then(step1).then(step2).then(step3)` | A |
| AC-8.9 | Workflow can be reopened after save | Load JSON → editor restores previous state | B |
| AC-8.10 | Transpile failure doesn't lose `workflow.json` | Bad config → JSON saved, warning returned | B |
| AC-8.11 | JSON Schema string → `z.string()` | Input with `type: "string"` → Zod string | A |
| AC-8.12 | JSON Schema object → `z.object()` | Input with properties → Zod object | A |

### User Flows (Phase Level)

#### Flow 1: Save Browser→Gmail Workflow

```
1. User has built the workflow:
   - Step 1: Navigate to URL (Browser tool)
   - Step 2: Fetch Webpage Content (Browser tool)
   - Step 3: Send Email (Gmail) - receives data from Step 2
2. User clicks "Save"
3. System saves workflow.json with steps, bindings, UI state
4. System transpiles to workflow.ts:
   
   import { createWorkflow, createStep } from "@mastra/core/workflows";
   import { z } from "zod";
   
   const navigateStep = createStep({
     id: "navigate-to-url",
     inputSchema: z.object({ url: z.string() }),
     outputSchema: z.any(),
     execute: async ({ inputData, runtimeContext }) => {
       // Composio execution...
     }
   });
   
   // ... more steps ...
   
   export const workflow = createWorkflow({
     id: "wf-xxx",
     inputSchema: z.object({...}),
     outputSchema: z.any()
   })
     .then(navigateStep)
     .then(fetchStep)
     .map(async ({ getStepResult }) => ({
       body: getStepResult("fetch-webpage")?.data.content
     }))
     .then(sendEmailStep)
     .commit();

5. System writes both files to _tables/workflows/{id}/
6. User sees "Saved successfully"
```

#### Flow 2: Reopen Saved Workflow

```
1. User navigates to /workflows
2. User clicks on previously saved workflow
3. System loads workflow.json from _tables/workflows/{id}/
4. Editor restores:
   - All 3 steps in Rail View
   - Data bindings in Details tab
   - Workflow metadata
5. User can continue editing
```

---

## Part A: Transpiler Core

### Goal

Build the code generators that convert workflow definitions into TypeScript code following [Mastra's workflow patterns](https://mastra.ai/docs/workflows/overview). Each generator handles a specific concern (schemas, steps, mappings, composition). This creates a modular system that can be extended for control flow in Phase 10.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/[workflowId]/update/services/transpiler/types.ts` | Create | Types for transpiler context, options, and result | ~60 |
| `app/api/workflows/[workflowId]/update/services/transpiler/index.ts` | Create | Main entry point, orchestrates generators | ~150 |
| `app/api/workflows/[workflowId]/update/services/transpiler/schema-generator.ts` | Create | JSON Schema → Zod code strings | ~120 |
| `app/api/workflows/[workflowId]/update/services/transpiler/step-generator.ts` | Create | Generate createStep() declarations | ~180 |
| `app/api/workflows/[workflowId]/update/services/transpiler/mapping-generator.ts` | Create | Generate .map() data transformations | ~100 |
| `app/api/workflows/[workflowId]/update/services/transpiler/workflow-generator.ts` | Create | Generate workflow composition chain | ~150 |
| `app/api/workflows/[workflowId]/update/services/transpiler/README.md` | Create | Architecture documentation | ~80 |

### Pseudocode

#### `services/transpiler/types.ts`

```
TranspilerContext
├── stepVarMap: Map<stepId, variableName>
├── usedImports: Set<string>
├── workflowInputs: WorkflowInputDefinition[]
└── bindings: Record<stepId, StepBindings>

TranspilerOptions
├── includeComments: boolean
├── prettyPrint: boolean
└── strictMode: boolean

TranspilerResult
├── code: string
├── metadata: WorkflowMetadata
└── errors: string[]
```

#### `services/transpiler/index.ts`

```
transpileWorkflow(definition: WorkflowDefinition, bindings: Record<string, StepBindings>): TranspilerResult
├── Initialize context
│   ├── stepVarMap: new Map()
│   ├── usedImports: new Set()
│   └── bindings: from parameter
│
├── Generate imports section
│   ├── Always: import { createWorkflow, createStep } from "@mastra/core/workflows"
│   ├── Always: import { z } from "zod"
│   └── If Composio steps: import composio client
│
├── Generate step definitions
│   └── For each step:
│       ├── Generate variable name (sanitize step.name → camelCase)
│       ├── Call stepGenerator.generateStep()
│       └── Add to output
│
├── Generate workflow composition
│   ├── createWorkflow({ id, inputSchema, outputSchema })
│   ├── For each step in order:
│   │   ├── If step has bindings: add .map(...)
│   │   └── Add .then(stepVar)
│   └── Add .commit()
│
├── Generate metadata export
│   └── Export workflowMetadata with requiredConnections
│
└── Return { code, metadata, errors: [] }
```

#### `services/transpiler/schema-generator.ts`

```
generateZodCodeString(schema: JSONSchema): string
├── If empty/undefined: Return "z.any()"
│
├── type === "string":
│   ├── Base: "z.string()"
│   ├── If enum: "z.enum([...])"
│   └── If description: ".describe(...)"
│
├── type === "number" | "integer":
│   ├── Base: "z.number()"
│   └── If integer: ".int()"
│
├── type === "boolean": "z.boolean()"
│
├── type === "array":
│   ├── Recursive: generateZodCodeString(items)
│   └── Return "z.array(itemsZod)"
│
├── type === "object":
│   ├── For each property: recursive
│   ├── Handle required vs optional
│   └── Return "z.object({...})"
│
└── Unknown: "z.any()"
```

#### `services/transpiler/step-generator.ts`

```
generateStepCode(step: WorkflowStep, context: TranspilerContext): string
├── Generate variable name (sanitize step.name → camelCase)
├── Register in context.stepVarMap
│
├── Get input/output schemas from step.toolSchema
│
├── Generate execute body (Composio step):
│   const connections = runtimeContext.get("connections");
│   const connectionId = connections?.["${step.toolkitSlug}"];
│   const result = await composio.executeAction(
│     "${step.toolId}",
│     inputData,
│     { connectedAccountId: connectionId }
│   );
│   if (!result.successful) throw new Error(result.error);
│   return result.data;
│
└── Return createStep code:
    const ${varName} = createStep({
      id: "${step.id}",
      inputSchema: ${inputZod},
      outputSchema: ${outputZod},
      execute: async ({ inputData, runtimeContext }) => {
        ${executeBody}
      }
    });
```

#### `services/transpiler/mapping-generator.ts`

```
generateMappingCode(stepId: string, bindings: StepBindings, context: TranspilerContext): string
├── If no bindings for step: Return empty string
│
├── Generate .map() call:
│   .map(async ({ inputData, getStepResult }) => {
│     return {
│       ${for each fieldBinding}:
│         ${fieldName}: ${generateSourceExpression(fieldBinding)}
│     };
│   })
└── Return map code

generateSourceExpression(binding: FieldBinding): string
├── If sourceType === "step-output":
│   └── Return `getStepResult("${sourceStepId}")?.${sourcePath}`
├── If sourceType === "workflow-input":
│   └── Return `inputData.${workflowInputName}`
└── If sourceType === "literal":
    └── Return JSON.stringify(literalValue)
```

#### `services/transpiler/workflow-generator.ts`

```
generateWorkflowComposition(
  definition: WorkflowDefinition,
  bindings: Record<string, StepBindings>,
  context: TranspilerContext
): string
├── Generate workflow declaration:
│   export const workflow = createWorkflow({
│     id: "${definition.id}",
│     inputSchema: ${generateZodCodeString(definition.inputSchema)},
│     outputSchema: z.any()
│   })
│
├── For each step in definition.steps (in order):
│   ├── If bindings[step.id] has entries:
│   │   └── Add .map(...) from mappingGenerator
│   └── Add .then(${stepVar})
│
├── Add .commit();
│
└── Return complete chain
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-8.3 | Generated code follows Mastra workflow patterns | Has createWorkflow, createStep, .then(), .commit() |
| AC-8.4 | Each step becomes `createStep()` | Count matches |
| AC-8.5 | Step execute signature matches Mastra | Has async ({ inputData, runtimeContext }) |
| AC-8.6 | Composio steps include connection handling | Has runtimeContext.get("connections") |
| AC-8.7 | Data bindings become `.map()` calls | Binding → map code |
| AC-8.8 | Sequential steps produce `.then()` chain | Chain structure correct |
| AC-8.11 | JSON Schema string → `z.string()` | Type conversion works |
| AC-8.12 | JSON Schema object → `z.object()` | Object conversion works |

### User Flows

#### Flow A.1: Transpile Simple Workflow

```
1. Input: WorkflowDefinition with 3 steps, bindings for step 3
2. transpileWorkflow() called
3. Schema generator converts input/output schemas to Zod
4. Step generator creates 3 createStep declarations
5. Mapping generator creates 1 .map() call (before step 3)
6. Workflow generator chains: .then(step1).then(step2).map(...).then(step3).commit()
7. Output: Complete TypeScript file as string
```

---

## Part B: Save Integration

### Goal

Wire up the transpiler to the save endpoint. When users save a workflow, both `workflow.json` (editor state) and `workflow.ts` (executable code) are written. If transpilation fails, the JSON is still saved (don't lose user's work).

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/[workflowId]/update/services/storage/code-writer.ts` | Create | Write/read generated TypeScript files | ~50 |
| `app/api/workflows/[workflowId]/update/route.ts` | Modify | Save JSON first, then call transpiler | +50 |

### Pseudocode

#### `services/storage/code-writer.ts`

```
writeWorkflowCode(workflowId: string, code: string): Promise<void>
├── Build path: _tables/workflows/{workflowId}/workflow.ts
├── Ensure directory exists
├── Write code to file
└── Log: "Generated workflow.ts for {workflowId}"

readWorkflowCode(workflowId: string): Promise<string | null>
├── Build path
├── If file exists: Read and return
└── If not: Return null
```

#### `route.ts` (PUT modification)

```
PUT /api/workflows/[workflowId]/update
├── Parse request body (definition + bindings)
├── Validate with WorkflowDefinitionValidator
│
├── ALWAYS save workflow.json first
│   ├── Write to _tables/workflows/{id}/workflow.json
│   └── This preserves editor state even if transpile fails
│
├── TRY transpilation:
│   ├── Call transpileWorkflow(definition, bindings)
│   ├── If result.errors is empty:
│   │   ├── Call writeWorkflowCode(id, result.code)
│   │   └── Return { success: true, files: { json: true, ts: true } }
│   └── If result.errors:
│       └── Return { success: true, files: { json: true, ts: false }, warnings: result.errors }
│
├── CATCH transpile error:
│   ├── Log error: "Transpilation failed unexpectedly"
│   └── Return {
│         success: true,
│         files: { json: true, ts: false },
│         warning: "Workflow saved but code generation failed"
│       }
│
└── Always return success if JSON was saved
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-8.1 | Save generates `workflow.json` | PUT → JSON file exists |
| AC-8.2 | Save generates `workflow.ts` | PUT → TS file exists |
| AC-8.9 | Workflow can be reopened after save | Load JSON → editor restores state |
| AC-8.10 | Transpile failure doesn't lose JSON | Bad config → JSON saved |

### User Flows

#### Flow B.1: Save Triggers Both Outputs

```
1. User clicks "Save" in workflow editor
2. Frontend calls PUT /api/workflows/{id}/update with definition + bindings
3. Backend validates request
4. Backend writes workflow.json (editor state)
5. Backend calls transpileWorkflow(definition, bindings)
6. Backend writes workflow.ts (executable code)
7. Backend returns { success: true, files: { json: true, ts: true } }
8. Frontend shows "Saved successfully"
```

#### Flow B.2: Transpilation Fails Gracefully

```
1. User has workflow with unsupported feature (e.g., loop)
2. User clicks "Save"
3. Backend writes workflow.json ✓ (editor state preserved)
4. Backend calls transpileWorkflow(definition, bindings)
5. Transpiler returns errors: ["Loop steps not supported in Phase 8"]
6. Backend returns {
     success: true,
     files: { json: true, ts: false },
     warnings: ["Loop steps not supported"]
   }
7. Frontend shows "Saved with warning: workflow not yet executable"
8. User can reopen workflow later (JSON preserved)
```

#### Flow B.3: Reopen Workflow

```
1. User navigates to /workflows
2. User clicks on saved workflow card
3. Frontend calls GET /api/workflows/{id}/retrieve
4. Backend reads workflow.json
5. Frontend loads state into Zustand store
6. Editor renders:
   - Steps in Rail View
   - Bindings in Details tab
   - Workflow name and metadata
7. User continues editing where they left off
```

---

## Out of Scope

- **Control flow generation** (branch, parallel, loop, foreach) → Phase 10
- **Workflow execution** → Phase 9
- **Code preview in editor** → Future enhancement
- **Syntax validation** → Trust generators
- **Hot reloading** → Future enhancement
- **Versioning** → Future enhancement

---

## References

- **Mastra Docs**: [Workflows Overview](https://mastra.ai/docs/workflows/overview) - Canonical patterns for generated code
- **Schema Cache**: Phase 6 provides cached Composio schemas
- **Data Bindings**: Phase 7 provides binding configuration
- **Agent Integration**: Phase 9 uses the generated code
- **Control Flow**: Phase 10 extends transpiler for branching/loops
- **Research**: `15.5-workflows-f-transpilation-research.md`
- **Composio Client**: `app/api/connections/services/client.ts`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-07 | Rewritten using phase template, scoped to MVP | Assistant |
| 2025-12-07 | Simplified to sequential-only; added Phase 10 reference | Assistant |
| 2025-12-07 | Fixed service co-location; added workflow.json save; added Mastra compliance ACs | Assistant |

---

**Last Updated:** December 2025
