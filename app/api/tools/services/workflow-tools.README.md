# Workflow Tools Service

> Wraps assigned workflows as executable tools for agent chat.

**Service:** `workflow-tools.ts`  
**Domain:** Tools

---

## Purpose

This service wraps workflows (from the Workflows domain) as executable tools that agents can invoke during conversations. It loads transpiled workflow files, creates Vercel AI SDK tool wrappers, and handles workflow execution with connection bindings. Without this service, agents couldn't execute multi-step workflows - they would only have access to atomic tools.

**Product Value:** Enables agents to execute complex, multi-step workflows as single atomic operations. When a user assigns a "Summarize site email" workflow to an agent, this service makes it executable so the agent can invoke it naturally in conversation, orchestrating multiple steps transparently.

---

## Methods Overview

| Function | What It Does | When to Use |
|----------|--------------|-------------|
| `getWorkflowToolExecutable()` | Loads a workflow, wraps its execution in a Vercel AI SDK tool, and returns a ToolDefinition ready for agent use. | When building agent tool maps - wraps workflows assigned to agents as executable capabilities |

---

## Approach

The service loads transpiled workflow files using the workflow-loader service, extracts metadata for tool descriptions, validates that workflows have input schemas, and wraps execution in Vercel AI SDK's `tool()` function. It creates runtime context with connection bindings so workflow steps can access the correct connections (Gmail, Slack, etc.). Workflow execution is handled by Mastra's workflow runtime, and results are returned to agents as tool outputs.

---

## Public API

### `getWorkflowToolExecutable(userId: string, binding: WorkflowBinding): Promise<ToolDefinition | undefined>`

**What it does:** Loads a workflow by ID, wraps its execution in a Vercel AI SDK tool with proper schema and runtime context, and returns a ToolDefinition that agents can invoke.

**Product Impact:** This is how workflows become agent capabilities. When users assign workflows to agents, this function makes them executable, enabling agents to orchestrate complex multi-step processes as single tool calls.

**Input:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | Authenticated user's ID (used for workflow run resourceId) |
| `binding` | WorkflowBinding | Yes | Workflow binding with workflowId and connectionBindings (toolkit slug → connectionId map) |

**Output:**

| Field | Type | Description |
|-------|------|-------------|
| Return value | Promise<ToolDefinition \| undefined> | ToolDefinition with wrapped workflow execution, or undefined if workflow not found/invalid |

**Process:**

```
getWorkflowToolExecutable(userId, binding): Promise<ToolDefinition | undefined>
├── **Call `getWorkflowExecutable(binding.workflowId)`** to load transpiled workflow
├── If workflow not found: Return undefined
├── **Call `getWorkflowMetadata(binding.workflowId)`** to get name/description
├── If metadata not found: Return undefined
├── Verify workflow has inputSchema (required for tool)
├── Create Vercel AI SDK tool with:
│   ├── description: From workflow metadata
│   ├── inputSchema: From workflow (already Zod, no conversion needed)
│   └── execute: async function that:
│       ├── Create runtimeContext with binding.connectionBindings
│       ├── **Call `workflow.createRunAsync({ resourceId: userId })`**
│       ├── **Call `run.start({ inputData: input, runtimeContext })`**
│       ├── Handle execution result:
│       │   ├── If success: Return result.result
│       │   ├── If failed: Extract failed steps, throw error
│       │   └── If other status: Return result with status info
│       └── Return workflow output
└── Return ToolDefinition with id, name, description, runtime, and run property
```

**Error Handling:** Returns undefined if workflow not found or missing inputSchema. Execution errors are thrown and handled by the agent framework.

---

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `ai` (Vercel AI SDK) | Tool wrapping with tool() function |
| `@/_tables/types` | ToolDefinition, WorkflowBinding types |
| `@/app/api/workflows/services/workflow-loader` | Workflow file loading and metadata |

---

## Consumers

| Consumer | Location | Usage |
|----------|----------|-------|
| Chat Service | `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Wraps workflows as tools when building agent tool maps |
| Runtime Service | `app/api/tools/services/runtime.ts` | Re-exports this function |

---

## Design Decisions

### Why wrap workflows as tools?

**Decision:** Workflows are wrapped in Vercel AI SDK tool() function, same format as connection tools.

**Rationale:** This maintains the unified interface - to agents, workflows and connection tools are indistinguishable. Both are just "tools" with schemas and execute functions. This enables the hybrid capability system where agents can seamlessly use both atomic integrations and compound workflows.

### Why runtimeContext with connections?

**Decision:** Connection bindings are passed via runtimeContext to workflow steps.

**Rationale:** Workflow steps need to know which connections to use (which Gmail account, which Slack workspace, etc.). The runtimeContext.get("connections") pattern allows steps to access these bindings, maintaining separation between workflow logic and connection management.

---

## Related Docs

- [Workflow Loader Service README](../../workflows/services/workflow-loader.README.md) - Loads workflow files and metadata
- [Workflow Builder Service README](../../workflows/services/workflow-builder.README.md) - Constructs workflows from definitions
- [Chat Service README](../../workforce/[agentId]/chat/services/chat-service.README.md) - Uses this service to build agent tool maps

---

## Future Improvements

- [ ] Add workflow execution timeout handling
- [ ] Add workflow progress/resume support for long-running workflows
- [ ] Add workflow result caching for idempotent operations
- [ ] Add workflow execution metrics/logging
- [ ] Support workflow versioning (execute specific versions)

