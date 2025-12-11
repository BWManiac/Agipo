# Phase 23: Workflow Registry

**Status:** ✅ Complete (Part A), 📋 Planned (Parts B, C)
**Depends On:** Phase 16 (Workflows), Phase 10/11 (Agent Integration)
**Started:** 2025-12-10
**Completed:** Part A: 2025-12-10

---

## Overview

### Goal

Enable agents to execute assigned workflows by solving the Turbopack dynamic import limitation. Currently, workflow execution fails with `Cannot find module as expression is too dynamic` because Turbopack cannot analyze dynamic imports with variable paths.

This phase introduces a **Static Workflow Registry** that imports all transpiled workflows at build time, allowing the workflow loader to retrieve them via simple object lookup instead of dynamic import.

After this phase:
- Agents can invoke assigned workflows during chat conversations
- Workflows execute deterministically with bound connections
- The existing transpilation system is preserved and enhanced
- The solution aligns with Mastra's recommended pattern of static workflow registration

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Import strategy | Static registry with auto-update | Turbopack supports static imports; registry can be auto-maintained |
| Registry location | `_tables/workflows/registry.ts` | Colocated with workflow files for easy imports |
| Update mechanism | File modification on transpile | Registry stays in sync with available workflows |
| Export naming | Use workflow ID as key | Consistent, predictable lookup pattern |
| Mastra alignment | Mirrors `Mastra({ workflows: {...} })` pattern | Future-proofs for full Mastra instance adoption |

### Pertinent Research

- **Turbopack limitation**: Dynamic imports with variable paths fail with "Cannot find module as expression is too dynamic"
- **Mastra pattern**: Workflows should be static TypeScript files registered at startup, retrieved via `getWorkflow()`
- **Workaround**: Use static imports that Turbopack can analyze at build time

*Source: Turbopack GitHub issues, Mastra documentation, conversation research*

### Overall File Impact

#### Backend / Storage

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `_tables/workflows/registry.ts` | Create | Central registry that statically imports all transpiled workflows and exports a lookup function | A |

#### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/services/workflow-loader.ts` | Modify | Replace dynamic import with registry lookup in `getWorkflowExecutable()` | A |
| `app/api/workflows/services/registry-updater.ts` | Create | Helper service to add/remove workflow entries from registry file when workflows are transpiled | B |

#### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/[workflowId]/route.ts` | Modify | Call registry updater after successful transpilation in PUT handler | C |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-23.1 | Registry file exists with static imports | File exists at `_tables/workflows/registry.ts` | A |
| AC-23.2 | Registry exports lookup function | `getWorkflowFromRegistry(id)` returns workflow or null | A |
| AC-23.3 | Workflow loader uses registry | `getWorkflowExecutable()` calls registry instead of dynamic import | A |
| AC-23.4 | Registry updater can add entries | New workflow → import and entry added to registry | B |
| AC-23.5 | Registry updater can remove entries | Deleted workflow → import and entry removed from registry | B |
| AC-23.6 | Transpiler updates registry | PUT workflow → registry updated automatically | C |
| AC-23.7 | Agent can execute workflow | Chat with agent → workflow tool executes successfully | C |
| AC-23.8 | No Turbopack errors | Workflow loads without "module not found" error | A |

### User Flows (Phase Level)

#### Flow 1: Agent Executes Workflow

```
1. User opens chat with agent that has "Send Site Content to Email" workflow assigned
2. User: "Summarize example.com and send it to me@email.com"
3. Chat service loads tools:
   - Connection tools: BROWSER_TOOL_*, GMAIL_SEND_EMAIL
   - Workflow tools: workflow-wf-auUlyla9_YGv ← Now loads via registry!
4. Agent invokes workflow tool with inputs
5. Workflow executes: Navigate → Fetch → Send Email
6. Agent responds with success message
```

#### Flow 2: Developer Creates New Workflow

```
1. User creates workflow in editor
2. User configures steps and bindings
3. User saves workflow (PUT /api/workflows/{id})
4. Transpiler generates workflow.ts
5. Registry updater adds import and entry to registry.ts
6. Workflow immediately available for agent assignment
```

---

## Part A: Registry Infrastructure

### Goal

Create the static workflow registry and update the workflow loader to use it instead of dynamic imports.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `_tables/workflows/registry.ts` | Create | Static imports of all workflows, exports lookup function | ~30 |
| `app/api/workflows/services/workflow-loader.ts` | Modify | Replace dynamic import with registry lookup | -25, +10 |

### Pseudocode

#### `_tables/workflows/registry.ts`

```
// Static imports - Turbopack can analyze these at build time
import { sendSiteContentToEmailWorkflow } from "./wf-auUlyla9_YGv/workflow";
// {{WORKFLOW_IMPORTS}} - Marker for auto-generation

// Registry maps workflow ID → workflow object
const workflowRegistry: Record<string, unknown> = {
  "wf-auUlyla9_YGv": sendSiteContentToEmailWorkflow,
  // {{WORKFLOW_ENTRIES}} - Marker for auto-generation
};

// Lookup function
export function getWorkflowFromRegistry(workflowId: string): unknown | null
├── Return workflowRegistry[workflowId] ?? null
```

#### `app/api/workflows/services/workflow-loader.ts` (changes)

```
// Remove dynamic import logic
// Add import for registry
import { getWorkflowFromRegistry } from "@/_tables/workflows/registry";

getWorkflowExecutable(workflowId: string): Promise<unknown | null>
├── BEFORE: Build file path, dynamic import with pathToFileURL
├── AFTER: Return getWorkflowFromRegistry(workflowId)
│
├── If registry returns null:
│   └── Log warning: workflow not found in registry
└── Return workflow object or null
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-23.1 | Registry file exists | Check `_tables/workflows/registry.ts` exists |
| AC-23.2 | Registry exports lookup function | Import and call `getWorkflowFromRegistry("wf-auUlyla9_YGv")` returns workflow |
| AC-23.3 | Workflow loader uses registry | `getWorkflowExecutable()` no longer uses dynamic import |
| AC-23.8 | No Turbopack errors | Start dev server, load workflow → no "module not found" error |

### User Flows

#### Flow A.1: Workflow Loads Successfully

```
1. Agent chat initializes
2. Chat service calls buildToolMap()
3. buildToolMap() calls getWorkflowToolExecutable()
4. getWorkflowToolExecutable() calls getWorkflowExecutable()
5. getWorkflowExecutable() calls getWorkflowFromRegistry()
6. Registry returns workflow object (not null)
7. Workflow tool created successfully
8. Console shows: "[ChatService] Loaded workflow tool: workflow-wf-auUlyla9_YGv"
```

---

## Part B: Registry Updater Service

### Goal

Create a service that can programmatically add and remove workflow entries from the registry file, ensuring it stays in sync with available workflows.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/services/registry-updater.ts` | Create | Functions to add/remove workflow entries from registry | ~100 |

### Pseudocode

#### `app/api/workflows/services/registry-updater.ts`

```
import fs from "fs/promises";
import path from "path";

const REGISTRY_PATH = path.join(process.cwd(), "_tables", "workflows", "registry.ts");

addWorkflowToRegistry(workflowId: string, exportName: string): Promise<void>
├── Read registry file content
├── Check if workflow already registered (search for workflowId)
│   └── If found: Return early (already registered)
├── Generate import line:
│   └── `import { ${exportName} } from "./${workflowId}/workflow";`
├── Generate registry entry:
│   └── `  "${workflowId}": ${exportName},`
├── Insert import after last import line (before // {{WORKFLOW_IMPORTS}})
├── Insert entry in registry object (before // {{WORKFLOW_ENTRIES}})
└── Write updated content to registry file

removeWorkflowFromRegistry(workflowId: string): Promise<void>
├── Read registry file content
├── Find and remove import line containing workflowId
├── Find and remove registry entry containing workflowId
└── Write updated content to registry file

getExportNameFromWorkflowFile(workflowId: string): Promise<string | null>
├── Read workflow.ts file
├── Find export pattern: `export const (\w+) = createWorkflow`
├── Return captured export name
└── Return null if not found

syncRegistryWithWorkflows(): Promise<void>
├── List all workflow directories in _tables/workflows/
├── For each directory:
│   ├── Check if workflow.ts exists
│   ├── If exists and not in registry: Add to registry
│   └── If in registry but no workflow.ts: Remove from registry
└── Log sync results
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-23.4 | Registry updater can add entries | Call `addWorkflowToRegistry()` → import and entry appear in registry |
| AC-23.5 | Registry updater can remove entries | Call `removeWorkflowFromRegistry()` → import and entry removed |

### User Flows

#### Flow B.1: Add New Workflow to Registry

```
1. New workflow transpiled → workflow.ts created
2. Call addWorkflowToRegistry("wf-newId", "myNewWorkflow")
3. Registry file updated:
   - New import line added
   - New entry added to workflowRegistry object
4. Next request picks up new workflow
```

---

## Part C: Integration with Transpiler

### Goal

Automatically update the registry when workflows are transpiled, ensuring new workflows are immediately available.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/[workflowId]/route.ts` | Modify | Call registry updater after successful transpilation | +15 |

### Pseudocode

#### `app/api/workflows/[workflowId]/route.ts` (changes to PUT handler)

```
PUT /api/workflows/[workflowId]
├── ... existing validation and save logic ...
├── ... existing transpilation logic ...
├── If transpilation successful:
│   ├── Get export name from generated workflow.ts
│   ├── Call addWorkflowToRegistry(workflowId, exportName)
│   └── Log: "Workflow added to registry"
└── Return success response
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-23.6 | Transpiler updates registry | Save workflow in editor → registry.ts updated |
| AC-23.7 | Agent can execute workflow | Chat with agent → workflow executes without errors |

### User Flows

#### Flow C.1: End-to-End Workflow Creation and Execution

```
1. User creates/edits workflow in editor
2. User clicks Save
3. PUT /api/workflows/{id} called
4. Workflow definition saved to workflow.json
5. Transpiler generates workflow.ts
6. Registry updater adds workflow to registry.ts
7. User assigns workflow to agent
8. User chats with agent: "Run the workflow"
9. Workflow executes successfully
```

---

## Out of Scope

- **Full Mastra instance adoption** → Future consideration for centralized agent/workflow management
- **Workflow deletion from UI** → Would need corresponding registry removal
- **Hot reload of registry** → Server restart required for new workflows (acceptable for now)
- **Registry validation** → Trust that transpiled files are valid

---

## Critical Learnings: Undocumented Mastra API Behavior

> **⚠️ IMPORTANT FOR FUTURE DEVELOPERS**
>
> The following behaviors were discovered through debugging and are **NOT documented** in the official Mastra documentation. These are critical implementation details that can cause silent hangs or runtime errors if not handled correctly.

### 1. Workflow Objects are Thenables (Causes Infinite Hang)

**Problem**: Workflow objects created by `createWorkflow().commit()` have a `.then()` method, making them "thenables" in JavaScript. When you wrap a thenable in `Promise.resolve()`, JavaScript automatically tries to recursively unwrap it by calling `.then()`, causing an **infinite hang** with no error message.

**Symptom**: Code hangs indefinitely after `getWorkflowFromRegistry()` returns, with no errors or timeouts.

**Root Cause**:
```typescript
// This hangs forever:
const workflow = getWorkflowFromRegistry(workflowId);
return Promise.resolve(workflow); // JS tries to call workflow.then() → infinite loop
```

**Solution**: Wrap the workflow in a plain object before returning from any async function:

```typescript
// workflow-loader.ts - CORRECT APPROACH
export function getWorkflowExecutable(workflowId: string): Promise<unknown | null> {
  const workflow = getWorkflowFromRegistry(workflowId);
  if (workflow) {
    // Wrap in object to prevent Promise from unwrapping thenable
    return Promise.resolve({ __workflow: workflow });
  }
  return Promise.resolve(null);
}

// Caller must unwrap:
const result = await getWorkflowExecutable(binding.workflowId);
const workflow = result && typeof result === 'object' && '__workflow' in result
  ? (result as { __workflow: unknown }).__workflow
  : result;
```

**Detection**: Add logging to check if workflow has `.then`:
```typescript
console.log(`Workflow has .then?: ${typeof (workflow as any).then}`);
// Will log "function" for Mastra workflows
```

---

### 2. RuntimeContext Must Be a Map, Not a Plain Object

**Problem**: Mastra's workflow execution engine internally calls `runtimeContext.forEach()`, which requires `runtimeContext` to be a `Map`. Using a plain object causes a runtime error.

**Symptom**: `TypeError: runtimeContext.forEach is not a function`

**Root Cause**: The documentation shows examples with plain objects, but the actual implementation requires `Map`:

```typescript
// WRONG - will fail at runtime:
const runtimeContext = {
  connections: binding.connectionBindings
};

// CORRECT - use Map:
const runtimeContext = new Map<string, unknown>();
runtimeContext.set("connections", binding.connectionBindings);
```

**Full Execute Pattern**:
```typescript
const run = await workflowExec.createRunAsync({
  resourceId: userId,
});

const result = await run.start({
  inputData: workflowInput,
  runtimeContext, // Must be a Map!
});
```

**Accessing in Steps**: Inside workflow steps, access via `runtimeContext.get()`:
```typescript
execute: async ({ inputData, runtimeContext }) => {
  const connections = runtimeContext.get("connections") as Record<string, string>;
  const connectionId = connections?.["gmail"];
  // ...
}
```

---

### 3. Mastra Agent Injects Context into Tool Arguments

**Problem**: When Mastra Agent calls a tool's `execute` function, it injects additional context properties into the input object. If your tool passes `input` directly to a workflow, it will include these extraneous properties.

**Symptom**: Workflow receives unexpected input fields; validation may fail or workflow may behave unexpectedly.

**Injected Properties**:
```typescript
const mastraInjectedKeys = [
  'threadId',      // Current conversation thread
  'resourceId',    // User/entity ID
  'memory',        // Memory instance
  'runId',         // Execution run ID
  'runtimeContext', // Runtime context object
  'writer',        // Stream writer
  'tracingContext', // Tracing/telemetry
  'context',       // May contain actual tool input nested here
  'mastra',        // Mastra instance reference
];
```

**Solution**: Filter out Mastra-injected keys before passing to workflow:

```typescript
execute: async (input: Record<string, unknown>) => {
  // Log raw input to see what Mastra injected
  console.log(`Raw input:`, JSON.stringify(input, null, 2));

  // Filter approach: Remove known Mastra keys
  const mastraInjectedKeys = new Set([
    'threadId', 'resourceId', 'memory', 'runId', 'runtimeContext',
    'writer', 'tracingContext', 'context', 'mastra'
  ]);

  // Extract actual workflow input
  let workflowInput: Record<string, unknown>;

  // Check if input is nested in 'context' property
  if (input.context && typeof input.context === 'object') {
    workflowInput = input.context as Record<string, unknown>;
  } else {
    // Filter out Mastra-injected keys
    workflowInput = Object.fromEntries(
      Object.entries(input).filter(([key]) => !mastraInjectedKeys.has(key))
    );
  }

  console.log(`Filtered input:`, JSON.stringify(workflowInput, null, 2));

  // Now pass workflowInput to workflow.start()
}
```

**Note**: This is similar to how Composio tools also inject context. Always log raw input during debugging to see what's actually being passed.

---

### 4. createRunAsync vs createRun

**Behavior**: Use `createRunAsync()` for programmatic workflow execution. The workflow object exposes this method after `.commit()`.

```typescript
const workflowObj = workflow as any;

// Check required methods exist
if (!workflowObj.inputSchema) {
  console.warn(`Workflow missing inputSchema`);
  return undefined;
}
if (!workflowObj.createRunAsync) {
  console.warn(`Workflow missing createRunAsync`);
  return undefined;
}

// Create run instance
const run = await workflowObj.createRunAsync({
  resourceId: userId, // For tracking/scoping
});

// Execute
const result = await run.start({
  inputData: workflowInput,
  runtimeContext,
});
```

---

### 5. Composio SDK Requires entityId in tools.execute()

**Problem**: The Composio SDK's `tools.execute()` method requires `entityId` in the metadata. Without it, execution fails with:

```
Error: entity_id and composio_api_key required in metadata
```

**Solution**: Pass `entityId` via runtimeContext and include it in the execute call:

```typescript
// In workflow-tools.ts - pass entityId to runtimeContext
runtimeContext.set("entityId", userId);

// In generated workflow step code
const entityId = runtimeContext.get("entityId") as string | undefined;
const result = await client.tools.execute(
  "GMAIL_SEND_EMAIL",
  {
    arguments: inputData,
    connectedAccountId: connectionId,
    entityId,  // Required by Composio SDK
    dangerouslySkipVersionCheck: true
  }
);
```

**Note**: The `entityId` is typically the user's Clerk userId, which serves as their identity in Composio for connection scoping.

---

### 6. Workflow Result Status Handling

**Result Structure**: Workflow execution returns an object with `status`, `result`, and `steps`:

```typescript
interface WorkflowResult {
  status: "success" | "failed" | "suspended" | string;
  result: unknown;
  steps: Record<string, { status: string; error?: unknown; data?: unknown }>;
}
```

**Proper Handling**:
```typescript
if (result.status === "success") {
  return result.result; // Return workflow output
} else if (result.status === "failed") {
  // Extract error details from failed steps
  const failedSteps = Object.entries(result.steps || {})
    .filter(([_, step]) => step.status === "failed")
    .map(([id, step]) => ({ stepId: id, error: step.error }));

  const errorMessage = failedSteps.length > 0
    ? `Workflow failed at step(s): ${JSON.stringify(failedSteps)}`
    : "Workflow execution failed";

  throw new Error(errorMessage);
}

// For suspended or other statuses
return { status: result.status, result: result.result };
```

---

### Summary: Complete Workflow Tool Pattern

Here's the complete, working pattern for wrapping a Mastra workflow as a Vercel AI SDK tool:

```typescript
// workflow-tools.ts

export async function getWorkflowToolExecutable(
  userId: string,
  binding: WorkflowBinding
): Promise<ToolDefinition | undefined> {
  // 1. Load workflow (handle thenable wrapping)
  const result = await getWorkflowExecutable(binding.workflowId);
  const workflow = result && typeof result === 'object' && '__workflow' in result
    ? (result as { __workflow: unknown }).__workflow
    : result;

  if (!workflow) return undefined;

  // 2. Verify required properties
  const workflowObj = workflow as any;
  if (!workflowObj.inputSchema || !workflowObj.createRunAsync) {
    return undefined;
  }

  // 3. Create Vercel AI SDK tool
  const vercelTool = tool({
    description: metadata.description,
    inputSchema: workflowObj.inputSchema,
    execute: async (input: Record<string, unknown>) => {
      // 4. Filter Mastra-injected context
      const mastraKeys = new Set([
        'threadId', 'resourceId', 'memory', 'runId',
        'runtimeContext', 'writer', 'tracingContext', 'context', 'mastra'
      ]);

      const workflowInput = input.context && typeof input.context === 'object'
        ? input.context as Record<string, unknown>
        : Object.fromEntries(
            Object.entries(input).filter(([k]) => !mastraKeys.has(k))
          );

      // 5. Create Map-based runtimeContext with connections AND entityId
      const runtimeContext = new Map<string, unknown>();
      runtimeContext.set("connections", binding.connectionBindings);
      runtimeContext.set("entityId", userId); // Required by Composio SDK

      // 6. Execute workflow
      const run = await workflowObj.createRunAsync({ resourceId: userId });
      const result = await run.start({ inputData: workflowInput, runtimeContext });

      // 7. Handle result
      if (result.status === "success") return result.result;
      if (result.status === "failed") throw new Error("Workflow failed");
      return { status: result.status, result: result.result };
    },
  });

  return {
    id: `workflow-${binding.workflowId}`,
    name: metadata.name,
    description: metadata.description,
    runtime: "workflow",
    run: vercelTool,
  };
}
```

---

## References

- **Research**: Turbopack dynamic import limitations (GitHub issues)
- **Research**: Mastra workflow registration patterns (mastra.ai docs)
- **Related Phase**: `16-workflows-f/` - Workflow editor and transpiler
- **Related Phase**: `10-Phase10-Agent-Integration.md` - Agent workflow assignment
- **Related Phase**: `11-Phase11-Workflow-Runtime-Execution.md` - Workflow tool wrapping

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | Claude |
| 2025-12-10 | Implemented Part A: Static registry, updated workflow-loader | Claude |
| 2025-12-10 | Fixed thenable hang issue in workflow-loader.ts | Claude |
| 2025-12-10 | Fixed RuntimeContext Map requirement in workflow-tools.ts | Claude |
| 2025-12-10 | Fixed Mastra context injection filtering in workflow-tools.ts | Claude |
| 2025-12-10 | Added "Critical Learnings: Undocumented Mastra API Behavior" section | Claude |
| 2025-12-10 | Added Composio entityId requirement (learning #5) | Claude |

---

**Last Updated:** December 10, 2025
