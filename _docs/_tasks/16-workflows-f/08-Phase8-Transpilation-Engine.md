# Phase 8: Transpilation Engine

**Status:** 📋 Planned  
**Depends On:** Phase 7 (Data Mapping)  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Build the **Transpilation Engine** that converts visual workflow definitions into executable Mastra TypeScript code. When users click "Save", the system generates two files:

- `workflow.json` - Editor state (can be re-loaded)
- `workflow.ts` - Executable Mastra workflow code

After this phase:
- Saving a workflow generates valid TypeScript code
- Generated code uses Mastra's `createWorkflow`, `createStep` primitives
- Generated code includes connection placeholders for runtime binding
- The "Email Digest" workflow produces runnable code

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Approach | Transpilation (not runtime interpretation) | Type-safe, debuggable, uses Mastra directly |
| Trigger | On save | Always have latest executable; no manual build step |
| Failure handling | Save JSON even if transpile fails | Don't lose user's work |
| Variable naming | From step names | Generated code is human-readable |
| Code format | Template literals | Clearer than string concatenation |

### Pertinent Research

- **Mastra `createStep`**: Requires `id`, `inputSchema`, `outputSchema`, `execute` function
- **Mastra `createWorkflow`**: Chain with `.then()`, `.branch()`, `.parallel()`, etc.
- **Connection binding**: Use `runtimeContext.get("connections")` to get connection IDs at runtime
- **Composio execution**: `client.tools.execute(toolId, inputData, connectionId)`

*Source: `15.5-workflows-f-transpilation-research.md`, `Workflow-Primitives.md`*

### Overall File Impact

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows-f/transpiler/index.ts` | Create | Main transpile orchestrator | A |
| `app/api/workflows-f/transpiler/schema-generator.ts` | Create | JSON Schema → Zod code strings | A |
| `app/api/workflows-f/transpiler/step-generator.ts` | Create | Generate `createStep()` code | A |
| `app/api/workflows-f/transpiler/mapping-generator.ts` | Create | Generate `.map()` calls | A |
| `app/api/workflows-f/transpiler/workflow-generator.ts` | Create | Generate workflow composition chain | A |
| `app/api/workflows-f/transpiler/README.md` | Create | Documents transpiler architecture | A |
| `app/api/workflows-f/types/transpiler.ts` | Create | Types for transpiler context/options | A |
| `app/api/workflows-f/[id]/route.ts` | Modify | Trigger transpilation on PUT | B |
| `app/api/workflows-f/storage/generated-code.ts` | Modify | Add `writeWorkflowCode()` function | B |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-8.1 | Save generates `workflow.ts` | PUT → file exists in `_tables/workflows-f/{id}/` | B |
| AC-8.2 | Generated code imports Mastra primitives | Contains `import { createWorkflow, createStep }` | A |
| AC-8.3 | Each step becomes `createStep()` declaration | Count declarations = step count | A |
| AC-8.4 | Composio steps include connection handling | Has `runtimeContext.get("connections")` | A |
| AC-8.5 | Data mappings become `.map()` calls | Mapping → `.map(async ({ inputData }) => {...})` | A |
| AC-8.6 | Sequential steps produce `.then()` chain | Two steps → `.then(step1).then(step2)` | A |
| AC-8.7 | `workflowMetadata` export includes `requiredConnections` | Has array of toolkit slugs | A |
| AC-8.8 | Transpile failure doesn't lose `workflow.json` | Bad config → JSON saved, warning returned | B |
| AC-8.9 | JSON Schema string → `z.string()` | Input with `type: "string"` → Zod string | A |
| AC-8.10 | JSON Schema object → `z.object()` | Input with properties → Zod object | A |

### User Flows (Phase Level)

#### Flow 1: Save Email Digest Workflow

```
1. User has built Email Digest workflow:
   - Step 1: Gmail Fetch Emails
   - Step 2: Gmail Send Email
   - Mapping: body ← Step 1's data.messages[0].messageText
   - Workflow input: recipient (string, required)
2. User clicks "Save"
3. System saves workflow.json with steps, mappings, inputSchema
4. System transpiles to workflow.ts:
   - fetchEmailsStep = createStep({...})
   - sendEmailStep = createStep({...})
   - workflow = createWorkflow({...})
       .then(fetchEmailsStep)
       .map(async ({ inputData, getStepResult }) => ({
         to: inputData.recipient,
         subject: "Your Email Digest",
         body: getStepResult("fetch-emails")?.data.messages[0].messageText
       }))
       .then(sendEmailStep)
       .commit()
5. System writes workflow.ts to _tables/workflows-f/{id}/
6. User sees "Saved successfully"
```

---

## Part A: Transpiler Core

### Goal

Build the code generators that convert workflow definitions into TypeScript code. Each generator handles a specific concern (schemas, steps, mappings, composition).

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows-f/types/transpiler.ts` | Create | Types for transpiler context and options | ~60 |
| `app/api/workflows-f/transpiler/index.ts` | Create | Main entry point, orchestrates generators | ~150 |
| `app/api/workflows-f/transpiler/schema-generator.ts` | Create | JSON Schema → Zod code strings | ~120 |
| `app/api/workflows-f/transpiler/step-generator.ts` | Create | Generate createStep() declarations | ~180 |
| `app/api/workflows-f/transpiler/mapping-generator.ts` | Create | Generate .map() data transformations | ~100 |
| `app/api/workflows-f/transpiler/workflow-generator.ts` | Create | Generate workflow composition chain | ~150 |
| `app/api/workflows-f/transpiler/README.md` | Create | Architecture documentation | ~80 |

### Pseudocode

#### `app/api/workflows-f/types/transpiler.ts`

```
TranspilerContext
├── stepVarMap: Map<stepId, variableName>
├── usedImports: Set<string>
├── workflowInputs: WorkflowInputDefinition[]
└── mappings: DataMapping[]

TranspilerOptions
├── includeComments: boolean
├── prettyPrint: boolean
└── strictMode: boolean

TranspilerResult
├── code: string
├── metadata: WorkflowMetadata
└── errors: string[]
```

#### `app/api/workflows-f/transpiler/index.ts`

```
transpileWorkflow(definition: WorkflowDefinition): TranspilerResult
├── Initialize context
│   ├── stepVarMap: new Map()
│   ├── usedImports: new Set()
│   └── mappings: definition.mappings
│
├── Generate imports section
│   ├── Always: createWorkflow, createStep from @mastra/core/workflows
│   ├── Always: z from zod
│   └── If Composio steps: getComposioClient import
│
├── Generate step definitions
│   └── For each step:
│       ├── Generate variable name
│       ├── Call stepGenerator.generateStep()
│       └── Add to output
│
├── Generate workflow composition
│   ├── Create workflow with inputSchema
│   ├── For each step in order:
│   │   ├── If mapping exists before step:
│   │   │   └── Add mappingGenerator.generateMap()
│   │   └── Add .then(stepVar)
│   └── Add .commit()
│
├── Generate metadata export
│   ├── Extract requiredConnections
│   └── Export workflowMetadata object
│
└── Return { code, metadata, errors: [] }
```

#### `app/api/workflows-f/transpiler/schema-generator.ts`

```
generateZodCodeString(schema: JSONSchema): string
├── If empty/undefined: Return "z.any()"
│
├── type === "string":
│   ├── Base: "z.string()"
│   ├── If enum: "z.enum([...])"
│   ├── If format === "email": ".email()"
│   └── If description: ".describe(...)"
│
├── type === "number" | "integer":
│   ├── Base: "z.number()"
│   ├── If integer: ".int()"
│   └── If min/max: ".min().max()"
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

#### `app/api/workflows-f/transpiler/step-generator.ts`

```
generateStepCode(step: WorkflowStep, context: TranspilerContext): string
├── Generate variable name (sanitize step.name)
├── Register in context.stepVarMap
│
├── If step.type === "composio":
│   └── Return generateComposioStep(step, context)
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

generateComposioStep(step, context): string
├── Get input/output schemas from cached schemas
├── Generate execute body:
│   const connections = runtimeContext.get("connections");
│   const connectionId = connections?.["${step.toolkitSlug}"];
│   const client = getComposioClient();
│   const result = await client.tools.execute(
│     "${step.toolId}",
│     inputData,
│     connectionId
│   );
│   if (!result.successful) throw new Error(result.error);
│   return result.data;
└── Return full createStep code
```

#### `app/api/workflows-f/transpiler/mapping-generator.ts`

```
generateMappingCode(mapping: DataMapping, context: TranspilerContext): string
├── Collect field mappings
├── Generate .map() call:
│   .map(async ({ inputData, getStepResult }) => {
│     return {
│       ${for each fieldMapping}:
│         ${targetField}: ${generateSourceExpression(fieldMapping)}
│     };
│   })
└── Return map code

generateSourceExpression(fieldMapping: FieldMapping): string
├── If sourceType === "step-output":
│   └── Return `getStepResult("${sourceStepId}")?.${sourcePath}`
├── If sourceType === "workflow-input":
│   └── Return `inputData.${sourcePath}`
└── If sourceType === "literal":
    └── Return JSON.stringify(literalValue)
```

#### `app/api/workflows-f/transpiler/workflow-generator.ts`

```
generateWorkflowComposition(
  steps: WorkflowStep[],
  mappings: DataMapping[],
  inputSchema: JSONSchema,
  context: TranspilerContext
): string
├── Generate workflow declaration:
│   export const ${workflowVar} = createWorkflow({
│     id: "${definition.id}",
│     inputSchema: ${generateZodCodeString(inputSchema)},
│     outputSchema: z.any()
│   })
│
├── For each step in order:
│   ├── Find mapping where targetStepId === step.id
│   ├── If mapping exists:
│   │   └── Add .map(${mappingGenerator.generateMappingCode(mapping)})
│   ├── Get step variable from context.stepVarMap
│   └── Add .then(${stepVar})
│
├── Add .commit();
│
└── Return complete chain
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-8.2 | Generated code imports Mastra primitives | Check for import statement |
| AC-8.3 | Each step becomes `createStep()` | Count matches |
| AC-8.4 | Composio steps include connection handling | Has runtimeContext |
| AC-8.5 | Data mappings become `.map()` calls | Mapping → map code |
| AC-8.6 | Sequential steps produce `.then()` chain | Chain structure correct |
| AC-8.9 | JSON Schema string → `z.string()` | Type conversion works |
| AC-8.10 | JSON Schema object → `z.object()` | Object conversion works |

### User Flows

#### Flow A.1: Transpile Simple Workflow

```
1. Input: WorkflowDefinition with 2 steps, 1 mapping
2. transpileWorkflow() called
3. Schema generator converts input/output schemas to Zod
4. Step generator creates 2 createStep declarations
5. Mapping generator creates 1 .map() call
6. Workflow generator chains: .then(step1).map(...).then(step2)
7. Output: Complete TypeScript file as string
```

---

## Part B: Save Integration

### Goal

Wire up the transpiler to the save endpoint. When users save a workflow, both `workflow.json` and `workflow.ts` are written.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows-f/[id]/route.ts` | Modify | Call transpiler on PUT | +50 |
| `app/api/workflows-f/storage/generated-code.ts` | Modify | Add writeWorkflowCode() | +30 |

### Pseudocode

#### `app/api/workflows-f/[id]/route.ts` (PUT modification)

```
PUT /api/workflows-f/[id]
├── Parse request body
├── Validate with WorkflowDefinitionValidator
├── Write workflow.json
│
├── TRY transpilation:
│   ├── Call transpileWorkflow(definition)
│   ├── If successful:
│   │   ├── Call writeWorkflowCode(id, result.code)
│   │   └── Return { success: true, files: { json: true, ts: true } }
│   └── If errors:
│       └── Log errors, continue
│
├── CATCH transpile error:
│   ├── Log error: "Transpilation failed"
│   └── Return {
│         success: true,
│         files: { json: true, ts: false },
│         warning: "Workflow saved but not executable"
│       }
│
└── Always return success for JSON save
```

#### `app/api/workflows-f/storage/generated-code.ts`

```
writeWorkflowCode(workflowId: string, code: string): Promise<void>
├── Build path: _tables/workflows-f/{workflowId}/workflow.ts
├── Ensure directory exists
├── Write code to file
└── Log: "Generated workflow.ts for {workflowId}"

readWorkflowCode(workflowId: string): Promise<string | null>
├── Build path
├── If file exists: Read and return
└── If not: Return null
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-8.1 | Save generates `workflow.ts` | PUT → file exists |
| AC-8.7 | `workflowMetadata` export exists | Has requiredConnections |
| AC-8.8 | Transpile failure doesn't lose JSON | Bad config → JSON saved |

### User Flows

#### Flow B.1: Save Triggers Transpilation

```
1. User clicks "Save" in workflow editor
2. Frontend calls PUT /api/workflows-f/{id}
3. Backend validates and writes workflow.json
4. Backend calls transpileWorkflow(definition)
5. Backend writes workflow.ts
6. Backend returns { success: true, files: { json: true, ts: true } }
7. Frontend shows "Saved successfully"
```

#### Flow B.2: Transpilation Fails Gracefully

```
1. User has invalid workflow (missing mappings)
2. User clicks "Save"
3. Backend validates and writes workflow.json ✓
4. Backend calls transpileWorkflow(definition)
5. Transpiler returns errors
6. Backend returns {
     success: true,
     files: { json: true, ts: false },
     warning: "Workflow saved but transpilation failed"
   }
7. Frontend shows "Saved with warning" + details
8. User can fix issues and re-save
```

---

## Out of Scope

- **Control flow generation** (branch, parallel, loop) → Future phase
- **Workflow execution** → Phase 9
- **Code preview in editor** → Future enhancement
- **Syntax validation** → Trust generators
- **Hot reloading** → Future enhancement
- **Versioning** → Future enhancement

---

## References

- **Schema Cache**: Phase 6 provides cached Composio schemas
- **Data Mappings**: Phase 7 provides mapping configuration
- **Mastra Primitives**: `_docs/Engineering/Integrations/API Docs/Mastra/Workflow-Primitives.md`
- **Research**: `15.5-workflows-f-transpilation-research.md`
- **Composio Client**: `app/api/connections/services/client.ts`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-07 | Rewritten using phase template, scoped to MVP | Assistant |

---

**Last Updated:** December 2025
