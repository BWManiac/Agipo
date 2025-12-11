# Phase 12: Runtime Workflow Construction

**Status:** 📋 Planned  
**Depends On:** Phase 11 (Workflow Runtime Execution - blocked by dynamic import issue)  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Construct Mastra workflows at runtime from JSON definitions instead of loading transpiled TypeScript files. This solves the Next.js/Turbopack dynamic import restriction ("expression is too dynamic") while aligning with Mastra's native in-memory workflow model.

**After this phase:**
- Workflows are constructed from `workflow.json` definitions at runtime
- No dynamic imports needed (solves Turbopack issue)
- Agents can successfully execute workflows as tools
- `.ts` file generation remains optional for IDE support
- Workflow execution works in production without workarounds

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Construction approach** | Build workflows from JSON at runtime | Matches Mastra's design, avoids dynamic imports |
| **File generation** | Keep transpiler (optional `.ts` files) | IDE support, debugging, version control |
| **Caching strategy** | Cache constructed workflow objects | Avoid rebuilding on every request |
| **Schema conversion** | JSON Schema → Zod at runtime | Reuse existing `generateZodCodeString` logic |
| **Step execution** | Reconstruct execute functions from step config | Composio steps need runtime client calls |
| **Primary path** | Runtime construction | Solves the blocking issue |
| **Fallback path** | Keep `.ts` generation for IDE | Optional developer experience enhancement |

### Pertinent Research

- **Mastra workflow model**: Workflows are JavaScript objects created with `createWorkflow()` and `createStep()`, NOT file-based. Can be constructed at runtime. ([Mastra Workflows Overview](https://mastra.ai/docs/workflows/overview))
- **RuntimeContext pattern**: Transpiled workflows read `runtimeContext.get("connections")` as `Record<string, string>` to get connection IDs per toolkit
- **Dynamic import issue**: Next.js 16 with Turbopack blocks dynamic imports with computed paths from `_tables/` directory
- **Existing transpiler**: Already generates code that constructs workflows - we move this logic to runtime
- **Schema conversion**: `schema-generator.ts` has `generateZodCodeString()` - adapt for runtime Zod objects

*Source: `11.1-Phase11-Workflow-Runtime-Execution-Research.md`, `15.2-workflow-research.md` (RQ-9), Mastra docs, terminal error logs*

---

## Overall File Impact

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/services/workflow-builder.ts` | Create | Constructs Mastra workflows from JSON definitions at runtime. Enables workflows to be built in-memory without file loading, solving the Turbopack dynamic import issue. Reconstructs `createStep()` calls from step definitions, builds workflow composition chain with `.then()` and `.map()`, converts JSON schemas to Zod, and creates execute functions for Composio steps. Returns fully executable workflow objects that agents can invoke. | A |
| `app/api/workflows/services/workflow-loader.ts` | Modify | Switches from dynamic file import to runtime construction. Enables workflows to load without Turbopack restrictions. Uses `buildWorkflowFromDefinition()` instead of `import()`, reads workflow.json directly, and caches constructed workflow objects for performance. Maintains backward compatibility with existing API. | A |
| `app/api/tools/services/workflow-tools.ts` | Modify | Updates to use new runtime construction approach. Enables workflow tools to load successfully for agent chat. Uses `getWorkflowExecutable()` which now constructs workflows from JSON instead of importing files. No changes to tool wrapping logic - still wraps workflow execution in Vercel AI SDK `tool()`. | A |
| `app/api/workflows/[workflowId]/update/services/transpiler/index.ts` | Modify | Makes `.ts` file generation optional. Enables workflows to work without transpiled files (runtime construction is primary path). Adds flag to control whether to write `.ts` files (for IDE support). Keeps transpiler for optional code generation. | B |

---

## Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-12.1 | Workflow constructed from JSON | Call `buildWorkflowFromDefinition()` → returns workflow object | A |
| AC-12.2 | Workflow has `createRunAsync()` method | Check workflow object → has `createRunAsync` function | A |
| AC-12.3 | Composio steps execute correctly | Run workflow → Composio tools execute with connections | A |
| AC-12.4 | Data mappings work | Run workflow → step inputs mapped from previous steps | A |
| AC-12.5 | Agent can invoke workflow | Chat with agent → workflow tool appears and executes | A |
| AC-12.6 | Workflow caching works | Load same workflow twice → second load uses cache | A |
| AC-12.7 | No dynamic import errors | Load workflow → no "expression is too dynamic" error | A |
| AC-12.8 | RuntimeContext passed correctly | Execute workflow → steps receive connection bindings | A |
| AC-12.9 | Input schema conversion works | Workflow inputSchema is valid Zod schema | A |
| AC-12.10 | Workflow execution succeeds | Agent invokes workflow → completes successfully | A |

---

## User Flows (Phase Level)

### Flow 1: Agent Invokes Workflow (Runtime Construction)

```
1. User chats: "Summarize example.com and email it to me@email.com"

2. Chat service loads tools:
   - buildToolMap() calls getWorkflowToolExecutable()
   
3. Workflow loader constructs workflow:
   - Reads workflow.json for wf-MSKSYrCZ-Tfc
   - Calls buildWorkflowFromDefinition(definition, bindings)
   - Constructs steps with execute functions
   - Builds workflow chain: .then(navigate).then(fetch).then(sendEmail)
   - Returns workflow object (cached)
   
4. Workflow tool wraps execution:
   - Creates RuntimeContext with connection bindings
   - Calls workflow.createRunAsync({ runtimeContext })
   - Executes with user inputs
   
5. Workflow executes:
   - Navigate step: uses browser_tool (NO_AUTH)
   - Fetch step: uses browser_tool (NO_AUTH)
   - Send Email step: uses bound Gmail connection
   
6. Agent receives result and responds: "Done! I've sent the summary to your email."
```

### Flow 2: Workflow Caching

```
1. Agent chat loads workflow → constructs from JSON → caches
2. Same workflow requested again → returns cached object
3. Workflow definition updated → cache invalidated on next load
```

### Flow 3: Multiple Workflows

```
1. Agent has 3 workflows assigned
2. Chat service loads all 3 workflows
3. Each workflow constructed from JSON (cached)
4. All workflows available to agent as tools
5. Agent can invoke any workflow successfully
```

---

## Part A: Runtime Construction Core

### Goal

Create the workflow builder service that constructs Mastra workflows from JSON definitions and update the loader to use it instead of dynamic imports.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/services/workflow-builder.ts` | Create | Constructs Mastra workflows from JSON definitions at runtime. Enables workflows to be built in-memory without file loading, solving the Turbopack dynamic import issue. Reconstructs `createStep()` calls from step definitions, builds workflow composition chain with `.then()` and `.map()`, converts JSON schemas to Zod, and creates execute functions for Composio steps. Returns fully executable workflow objects that agents can invoke. | ~350 |
| `app/api/workflows/services/workflow-loader.ts` | Modify | Switches from dynamic file import to runtime construction. Enables workflows to load without Turbopack restrictions. Uses `buildWorkflowFromDefinition()` instead of `import()`, reads workflow.json directly, and caches constructed workflow objects for performance. Maintains backward compatibility with existing API. | ~180 → ~250 |
| `app/api/tools/services/workflow-tools.ts` | Modify | Updates to use new runtime construction approach. Enables workflow tools to load successfully for agent chat. Uses `getWorkflowExecutable()` which now constructs workflows from JSON instead of importing files. No changes to tool wrapping logic - still wraps workflow execution in Vercel AI SDK `tool()`. | ~135 (no change) |

### Pseudocode

#### `app/api/workflows/services/workflow-builder.ts`

```
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import type { WorkflowDefinition } from "@/app/api/workflows/types/workflow";
import type { StepBindings } from "@/app/api/workflows/types/bindings";
import type { WorkflowStep } from "@/app/api/workflows/types/workflow-step";
import type { JSONSchema } from "@/app/api/workflows/types/schemas";
import { getComposioClient } from "@/app/api/connections/services/composio";
import { generateInputSchemaFromRuntimeInputs } from "@/app/api/workflows/[workflowId]/update/services/input-schema-generator";

// Helper to get nested value from path like "data.navigatedUrl"
function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: any = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

buildWorkflowFromDefinition(definition: WorkflowDefinition, bindings: Record<string, StepBindings>): Workflow
├── Convert runtimeInputs to inputSchema (JSON Schema → Zod):
│   ├── Use generateInputSchemaFromRuntimeInputs(definition.runtimeInputs || [])
│   ├── const inputSchemaJson = generateInputSchemaFromRuntimeInputs(definition.runtimeInputs || [])
│   ├── const inputZod = jsonSchemaToZod(inputSchemaJson)
│   └── If conversion fails: throw error
│
├── Create workflow base:
│   └── let workflow = createWorkflow({
│       id: definition.id,
│       inputSchema: inputZod,
│       outputSchema: z.any()  // Workflows can return any output
│     })
│
├── Sort steps by listIndex (sequential order):
│   └── const sortedSteps = [...definition.steps]
│       .filter(step => step.type !== "control")  // Skip control flow for now (Phase 13)
│       .sort((a, b) => a.listIndex - b.listIndex)
│
├── For each step in sortedSteps:
│   ├── Build step object:
│   │   ├── Convert inputSchema: const inputZod = jsonSchemaToZod(step.inputSchema)
│   │   ├── Convert outputSchema: const outputZod = jsonSchemaToZod(step.outputSchema)
│   │   ├── Build execute function:
│   │   │   ├── If step.type === "composio":
│   │   │   │   └── execute = buildComposioExecuteFunction(step)
│   │   │   ├── Else if step.type === "custom":
│   │   │   │   └── execute = buildCustomExecuteFunction(step)
│   │   │   └── Else:
│   │   │       └── execute = buildDefaultExecuteFunction(step)
│   │   │
│   │   └── const stepObj = createStep({
│   │       id: step.id,
│   │       inputSchema: inputZod,
│   │       outputSchema: outputZod,
│   │       execute: execute
│   │     })
│   │
│   ├── Add mapping if step has bindings:
│   │   ├── const stepBindings = bindings[step.id]
│   │   ├── If stepBindings && stepBindings.inputBindings has entries:
│   │   │   └── workflow = workflow.map(async ({ inputData, getStepResult }) => {
│   │   │       // Build mapping object from bindings
│   │   │       // Example: bindings["11IU9f9Xc4knMtwwJrnHi"].inputBindings.url.sourceType === "workflow-input"
│   │   │       const mappedInput: Record<string, unknown> = {}
│   │   │       For each [fieldName, fieldBinding] in Object.entries(stepBindings.inputBindings):
│   │   │         ├── If fieldBinding.sourceType === "workflow-input":
│   │   │         │   └── mappedInput[fieldBinding.targetField] = inputData[fieldBinding.workflowInputName]
│   │   │         ├── If fieldBinding.sourceType === "step-output":
│   │   │         │   ├── Parse sourcePath (e.g., "data.navigatedUrl" → ["data", "navigatedUrl"])
│   │   │         │   ├── const stepResult = getStepResult(fieldBinding.sourceStepId)
│   │   │         │   └── mappedInput[fieldBinding.targetField] = getNestedValue(stepResult, fieldBinding.sourcePath)
│   │   │         └── If fieldBinding.sourceType === "literal":
│   │   │             └── mappedInput[fieldBinding.targetField] = fieldBinding.literalValue
│   │   │       return mappedInput
│   │   │     })
│   │   │
│   └── Add step to workflow:
│       └── workflow = workflow.then(stepObj)
│
└── Return workflow.commit()

buildComposioExecuteFunction(step: WorkflowStep): Function
├── Validate step has required fields:
│   ├── If !step.toolId: throw error
│   └── If !step.toolkitSlug: throw error
│
└── Return async function:
    └── async ({ inputData, runtimeContext }) => {
        ├── const client = getComposioClient()
        ├── const connections = runtimeContext.get("connections") as Record<string, string> | undefined
        ├── const connectionId = connections?.[step.toolkitSlug]
        ├── const result = await client.tools.execute(step.toolId, {
        │     userId: runtimeContext.get("userId") || "",  // May need userId from context
        │     arguments: inputData,
        │     connectedAccountId: connectionId,  // undefined for NO_AUTH toolkits
        │     dangerouslySkipVersionCheck: true
        │   })
        ├── If !result.successful:
        │   └── throw new Error(result.error || "Tool execution failed")
        └── Return result.data
      }

buildCustomExecuteFunction(step: WorkflowStep): Function
├── If !step.code: throw error
│
└── Return async function:
    └── async ({ inputData }) => {
        ├── // TODO: Execute custom code (Phase 14+)
        └── Return inputData  // Placeholder
      }

buildDefaultExecuteFunction(step: WorkflowStep): Function
└── Return async function:
    └── async ({ inputData }) => {
        └── Return inputData  // Pass-through
      }

jsonSchemaToZod(schema: JSONSchema | undefined): z.ZodTypeAny
├── If !schema or schema is empty:
│   └── Return z.any()
│
├── Handle enum:
│   ├── If schema.enum exists:
│   │   └── Return z.enum(schema.enum.map(v => String(v)))
│   │
├── Switch on schema.type:
│   ├── Case "string":
│   │   └── Return z.string()
│   │
│   ├── Case "number" or "integer":
│   │   └── Return schema.type === "integer" ? z.number().int() : z.number()
│   │
│   ├── Case "boolean":
│   │   └── Return z.boolean()
│   │
│   ├── Case "array":
│   │   ├── const itemsZod = jsonSchemaToZod(schema.items)
│   │   └── Return z.array(itemsZod)
│   │
│   ├── Case "object":
│   │   ├── If !schema.properties or empty:
│   │   │   └── Return z.object({})
│   │   ├── Build properties object:
│   │   │   └── const props: Record<string, z.ZodTypeAny> = {}
│   │   │       For each [key, propSchema] in schema.properties:
│   │   │         ├── const propZod = jsonSchemaToZod(propSchema)
│   │   │         ├── const isRequired = schema.required?.includes(key) ?? false
│   │   │         └── props[key] = isRequired ? propZod : propZod.optional()
│   │   └── Return z.object(props)
│   │
│   └── Default:
│       └── Return z.any()
```

#### `app/api/workflows/services/workflow-loader.ts` (modifications)

```
// ADD: Import builder
import { buildWorkflowFromDefinition } from "./workflow-builder";
import { readWorkflow } from "./storage/crud";

// ADD: Cache for constructed workflows
let workflowCache: Map<string, { workflow: unknown; lastModified: string }> = new Map();

// MODIFY: getWorkflowExecutable()
export async function getWorkflowExecutable(workflowId: string): Promise<unknown | null> {
  try {
    // Load workflow definition (JSON)
    const definition = await readWorkflow(workflowId);
    if (!definition) {
      console.warn(`[workflow-loader] Workflow definition not found: ${workflowId}`);
      return null;
    }

    // Check cache
    const cached = workflowCache.get(workflowId);
    if (cached && cached.lastModified === definition.lastModified) {
      console.log(`[workflow-loader] Using cached workflow: ${workflowId}`);
      return cached.workflow;
    }

    // Load bindings (from workflow.json)
    const bindings = definition.bindings || {};

    // Construct workflow from definition
    console.log(`[workflow-loader] Constructing workflow from definition: ${workflowId}`);
    const workflow = buildWorkflowFromDefinition(definition, bindings);

    // Cache workflow
    workflowCache.set(workflowId, {
      workflow,
      lastModified: definition.lastModified || "",
    });

    return workflow;
  } catch (error) {
    console.error(`[workflow-loader] Error constructing workflow ${workflowId}:`, error);
    return null;
  }
}

// ADD: Cache invalidation function
export function invalidateWorkflowCache(workflowId?: string): void {
  if (workflowId) {
    workflowCache.delete(workflowId);
  } else {
    workflowCache.clear();
  }
}

// KEEP: getWorkflowMetadata() unchanged (already reads JSON)
// KEEP: listAvailableWorkflows() unchanged (already reads JSON)
// KEEP: validateWorkflowBinding() unchanged
```

#### `app/api/tools/services/workflow-tools.ts` (no changes needed)

```
// No code changes required!
// getWorkflowExecutable() now returns constructed workflow instead of imported module
// Tool wrapping logic remains the same
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-12.1 | Workflow constructed from JSON | Call `buildWorkflowFromDefinition()` with valid definition → returns workflow object |
| AC-12.2 | Workflow has `createRunAsync()` method | Check returned workflow → has `createRunAsync` function |
| AC-12.3 | Composio steps execute correctly | Run workflow with Composio step → tool executes with connection |
| AC-12.4 | Data mappings work | Run workflow with bindings → step receives mapped inputs |
| AC-12.5 | Agent can invoke workflow | Chat with agent → workflow tool appears in toolset |
| AC-12.6 | Workflow caching works | Load workflow twice → second load returns cached object |
| AC-12.7 | No dynamic import errors | Load workflow → no "expression is too dynamic" error in logs |
| AC-12.8 | RuntimeContext passed correctly | Execute workflow → steps can access `runtimeContext.get("connections")` |
| AC-12.9 | Input schema conversion works | Workflow with complex inputSchema → converted to valid Zod schema |
| AC-12.10 | Workflow execution succeeds | Agent invokes workflow → completes with success status |

### User Flows

#### Flow A.1: Agent Invokes "Summarize site email" Workflow (wf-MSKSYrCZ-Tfc)

```
1. Agent "Mira" has workflow binding:
   {
     workflowId: "wf-MSKSYrCZ-Tfc",
     connectionBindings: { "gmail": "ca_xyz789" }
   }

2. User chats: "Summarize example.com and email it to me@email.com"

3. Chat service loads tools:
   - buildToolMap() calls getWorkflowToolExecutable("wf-MSKSYrCZ-Tfc")
   
4. Workflow loader:
   - Reads workflow.json from _tables/workflows/wf-MSKSYrCZ-Tfc/workflow.json
   - Extracts runtimeInputs: [{ key: "URL", type: "string" }, { key: "Email Address", type: "string" }]
   - Converts to inputSchema: { URL: z.string(), "Email Address": z.string() }
   - Loads bindings from definition.bindings (nested under stepId)
   - Calls buildWorkflowFromDefinition(definition, bindings)
   - Constructs 3 steps:
     * navigateToUrl (id: "11IU9f9Xc4knMtwwJrnHi", toolId: "BROWSER_TOOL_NAVIGATE")
     * fetchWebpageContent (id: "vEIob8NhK-Cvh9Hq5Im11", toolId: "BROWSER_TOOL_FETCH_WEBPAGE")
     * sendEmail (id: "3qHrkky6fkTFw1iLsHJLt", toolId: "GMAIL_SEND_EMAIL")
   - Builds workflow chain with mappings:
     * .map() to map URL from inputData to navigate step
     * .then(navigateToUrl)
     * .map() to map navigatedUrl from step output to fetch step
     * .then(fetchWebpageContent)
     * .map() to map Email Address, content, and url to sendEmail step
     * .then(sendEmail)
   - Caches workflow object
   - Returns workflow
   
5. Workflow tool wraps execution:
   - Creates RuntimeContext: { connections: { gmail: "ca_xyz789" } }
   - Calls workflow.createRunAsync({ resourceId: userId, runtimeContext })
   - Executes: run.start({ inputData: { URL: "example.com", "Email Address": "me@email.com" } })
   
6. Workflow executes:
   - Navigate step: browser_tool (NO_AUTH, connectionId is undefined, still works)
   - Fetch step: browser_tool (NO_AUTH, connectionId is undefined, still works)
   - Send Email step: uses bound Gmail connection (ca_xyz789) from runtimeContext
   
7. Workflow completes successfully
8. Agent receives result and responds: "Done! I've sent the summary to your email."
```

#### Flow A.2: Workflow Caching

```
1. First request: Agent chat loads workflow wf-MSKSYrCZ-Tfc
   - Constructs from JSON
   - Caches workflow object
   
2. Second request: Same workflow requested again
   - Checks cache
   - Returns cached workflow (no reconstruction)
   
3. Workflow updated: User saves changes to workflow.json
   - lastModified timestamp changes
   - Next load: Cache miss (different lastModified)
   - Reconstructs workflow
   - Updates cache
```

#### Flow A.3: Workflow Construction Failure

```
1. Agent has workflow binding for invalid workflow
2. Chat service tries to load workflow
3. buildWorkflowFromDefinition() throws error (invalid step config)
4. Service logs error: "Error constructing workflow: ..."
5. Service returns undefined
6. Service continues loading other tools
7. Agent chat works normally (just without that workflow)
```

---

## Part B: Optional Transpiler Updates

### Goal

Make `.ts` file generation optional while keeping it available for IDE support. Runtime construction is the primary path; transpiled files are optional.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/[workflowId]/update/services/transpiler/index.ts` | Modify | Makes `.ts` file generation optional. Enables workflows to work without transpiled files (runtime construction is primary path). Adds flag to control whether to write `.ts` files (for IDE support). Keeps transpiler for optional code generation. | ~135 → ~150 |

### Pseudocode

#### `app/api/workflows/[workflowId]/update/services/transpiler/index.ts` (modifications)

```
// MODIFY: transpileWorkflow() signature
export function transpileWorkflow(
  definition: WorkflowDefinition,
  bindings: Record<string, StepBindings>,
  options?: { writeFile?: boolean }  // NEW: Optional flag
): TranspilerResult {
  // ... existing transpilation logic (unchanged) ...
  
  // MODIFY: Only write file if requested
  // Default to true for backward compatibility, but can be disabled
  const shouldWriteFile = options?.writeFile !== false;
  
  return { code, metadata, errors, shouldWriteFile };  // NEW: Include flag in result
}

// MODIFY: Update route to use flag
// In app/api/workflows/[workflowId]/update/route.ts:
const transpileResult = transpileWorkflow(validated, bindings, { writeFile: true });  // Optional

if (transpileResult.errors.length === 0 && transpileResult.shouldWriteFile) {
  await writeWorkflowCode(workflowId, transpileResult.code);
}
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-12.11 | Transpiler can skip file writing | Call transpileWorkflow with `writeFile: false` → no file written |
| AC-12.12 | Workflow works without `.ts` file | Delete workflow.ts → workflow still loads and executes |
| AC-12.13 | `.ts` file generation still works | Call transpileWorkflow with `writeFile: true` → file written |

---

## Implementation Strategy

### Step 1: Create Workflow Builder (Part A)

1. Create `workflow-builder.ts` with core functions:
   - `jsonSchemaToZod()` - Convert JSON Schema to Zod
   - `buildComposioExecuteFunction()` - Reconstruct Composio execution
   - `buildStepFromDefinition()` - Create step from definition
   - `buildMappingTransform()` - Create `.map()` from bindings
   - `buildWorkflowFromDefinition()` - Main orchestrator

2. Test with existing workflow (`wf-MSKSYrCZ-Tfc`):
   - Load definition
   - Construct workflow
   - Verify `createRunAsync()` exists
   - Verify workflow structure

### Step 2: Update Workflow Loader (Part A)

1. Modify `getWorkflowExecutable()`:
   - Remove dynamic import code
   - Add JSON reading
   - Add builder call
   - Add caching

2. Test:
   - Load workflow → no import errors
   - Verify caching works
   - Verify workflow executes

### Step 3: Test Agent Integration (Part A)

1. Test workflow tool loading:
   - Agent chat loads workflow
   - Workflow tool appears in toolset
   - Agent can invoke workflow

2. Test execution:
   - Agent invokes workflow
   - Workflow executes successfully
   - Agent receives result

### Step 4: Optional Transpiler Updates (Part B)

1. Make file writing optional
2. Test workflows work without `.ts` files
3. Verify IDE support still works if files generated

---

## Reuse Existing Code

### From Transpiler

| Function | Source | Adaptation |
|----------|--------|------------|
| `generateZodCodeString()` | `schema-generator.ts` | Adapt to return Zod objects instead of code strings |
| `generateComposioExecuteBody()` | `step-generator.ts` | Adapt to return function instead of code string |
| `generateMappingCode()` | `mapping-generator.ts` | Adapt to return mapping function instead of code string |

### Key Differences

| Aspect | Transpiler (Code Generation) | Builder (Runtime Construction) |
|--------|------------------------------|--------------------------------|
| **Output** | TypeScript code string | Mastra Workflow object |
| **Schema** | Zod code string (`"z.string()"`) | Zod object (`z.string()`) |
| **Execute** | Code string (`"return inputData;"`) | Function (`async ({ inputData }) => ...`) |
| **Mapping** | Code string (`.map(...)`) | Function call (`.map(async (...) => ...)`) |

---

## Comparison: Before vs After

| Aspect | Before (File Import) | After (Runtime Construction) |
|--------|---------------------|----------------------------|
| **Loading** | `import(fileUrl)` → ❌ Turbopack error | `buildWorkflowFromDefinition()` → ✅ Works |
| **Source** | Transpiled `.ts` file | `workflow.json` definition |
| **Performance** | File I/O + import | JSON read + construction (cached) |
| **IDE Support** | ✅ Full TypeScript | ⚠️ Optional `.ts` generation |
| **Debugging** | ✅ Source maps | ⚠️ Runtime construction (harder) |
| **Type Safety** | ✅ TypeScript | ⚠️ Runtime validation only |
| **Turbopack** | ❌ Blocked | ✅ No restrictions |

---

## Out of Scope

- **Control flow steps** → Phase 13 (branch, parallel, loop)
- **Custom code steps** → Phase 14+ (code execution)
- **Workflow state** → Future enhancement
- **Workflow versioning** → Future enhancement
- **Performance optimization** → Caching is basic, can enhance later

---

## References

- **Phase 11**: Workflow Runtime Execution - Original plan (blocked by dynamic imports)
- **Research**: `11.1-Phase11-Workflow-Runtime-Execution-Research.md` - Tool wrapping patterns
- **Mastra Docs**: [Workflows Overview](https://mastra.ai/docs/workflows/overview) - Runtime construction model
- **Transpiler**: `app/api/workflows/[workflowId]/update/services/transpiler/` - Code generation logic to adapt
- **Workflow Loader**: `app/api/workflows/services/workflow-loader.ts` - Current implementation
- **Workflow Tools**: `app/api/tools/services/workflow-tools.ts` - Tool wrapping service

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-08 | Initial creation - Runtime construction approach to solve Turbopack dynamic import issue | Assistant |
| 2025-12-08 | Renamed from Phase 13 to Phase 12, updated to reference actual workflow structure (wf-MSKSYrCZ-Tfc), added runtimeInputs conversion, updated bindings structure, added sourcePath parsing | Assistant |

---

**Last Updated:** December 8, 2025

