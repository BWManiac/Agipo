# Phase 11: Workflow Runtime Execution

**Status:** 📋 Planned  
**Depends On:** Phase 10 (Agent Integration - Parts A-D)  
**Started:** TBD  
**Completed:** TBD

---

## Overview

### Goal

Enable agents to **invoke assigned workflows as tools** during chat conversations. Currently, workflows can be assigned to agents and connections can be bound, but agents cannot actually execute them. This phase implements the runtime integration that wraps workflows as executable tools, allowing agents to recognize when a user's request matches a workflow capability and invoke it directly.

After this phase:
- Agents can see assigned workflows in their available toolset during chat
- Agents can invoke workflows with user-provided inputs (e.g., URL, email address)
- Workflows execute using the bound connections configured during assignment
- Agents receive workflow results and can respond to users with the outcome
- Users can ask agents to "run the email digest workflow" instead of explaining each step

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tool wrapping pattern | Follow ConnectionToolExecutable pattern exactly | Consistent with existing tool loading architecture - return `ToolDefinition` with `.run` property |
| Workflow execution | Use `workflow.createRunAsync()` then `.start()` | Standard Mastra execution pattern, supports runtime context injection |
| Connection injection | Via `RuntimeContext` with `connections` key | Matches transpiled workflow code that reads `runtimeContext.get("connections")` as `Record<string, string>` |
| Input schema conversion | Use workflow's `inputSchema` directly | Workflows already have Zod schemas from transpiler - no conversion needed |
| Error handling | Graceful degradation (skip failed workflows) | Agent can still function with other tools if one workflow fails to load - same pattern as connection tools |
| Tool naming | Use `workflow-${workflowId}` format | Consistent with custom tools pattern (`workflow-*`), clear identification |
| Return structure | Return `ToolDefinition` with `.run` property | Matches connection tools pattern - extract `.run` for toolMap |

### Pertinent Research

- **Mastra workflow execution**: `workflow.createRunAsync()` creates a run instance, `.start({ inputData })` executes with inputs (runtimeContext passed to createRunAsync)
- **RuntimeContext pattern**: Transpiled workflows read `runtimeContext.get("connections")` as `Record<string, string>` to get connection IDs per toolkit
- **Tool wrapping**: Connection tools use `tool()` from Vercel AI SDK with `execute` function, return `ToolDefinition` with `.run` property
- **Dynamic import**: Workflows stored as transpiled TypeScript files require dynamic import (same pattern as custom tools)
- **Agent tool interface**: Mastra Agent accepts `tools: Record<string, Tool>` - all tools (connection, custom, workflow) use same interface

*Source: `11.1-Phase11-Workflow-Runtime-Execution-Research.md` (comprehensive research), `15.5-workflows-f-transpilation-research.md`, `Workflow-Primitives.md`, existing `composio-tools.ts` pattern*

### Overall File Impact

#### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/tools/services/workflow-tools.ts` | Create | Wraps assigned workflows as executable tools for agent chat. Enables agents to see and invoke workflows like "Summarize site email" as single tools instead of chaining individual browser and Gmail tools. Loads transpiled workflow files dynamically, creates RuntimeContext with bound connections, and executes workflows with user-provided inputs. Returns workflow results to agents for natural language responses. | A |
| `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Modify | Integrates workflow tools into agent's toolset during chat initialization. Enables agents to access assigned workflows alongside connection tools and custom tools. Loads workflow tools from agent's workflowBindings, wraps them as executable tools, and adds them to the tool map that the agent uses during conversations. | A |

### Overall Acceptance Criteria

| # | Criterion | Test | Part |
|---|-----------|------|------|
| AC-11.1 | Workflow tools appear in agent's toolset | Chat with agent → see workflow tools available | A |
| AC-11.2 | Agent can invoke workflow with inputs | Chat: "summarize example.com and email it" → workflow executes | A |
| AC-11.3 | Workflow uses bound connections | Workflow execution → Gmail step uses bound connection ID | A |
| AC-11.4 | Workflow receives correct inputs | Agent passes { URL, Email Address } → workflow receives them | A |
| AC-11.5 | Agent receives workflow result | Workflow completes → agent sees result and responds | A |
| AC-11.6 | Failed workflow loading doesn't break chat | One workflow fails to load → other tools still work | A |
| AC-11.7 | Workflow tool description matches metadata | Tool description shows workflow name and description | A |

### User Flows (Phase Level)

#### Flow 1: Agent Invokes Workflow

```
1. User opens chat with agent that has "Summarize site email" workflow assigned
2. User: "Can you summarize example.com and send it to me@email.com?"
3. Agent recognizes this matches the workflow capability
4. Agent invokes "Summarize site email" workflow tool with:
   { URL: "example.com", Email Address: "me@email.com" }
5. Workflow executes:
   - Navigate step uses browser_tool (NO_AUTH, no connection needed)
   - Fetch step uses browser_tool (NO_AUTH, no connection needed)
   - Send Email step uses bound Gmail connection
6. Workflow completes successfully
7. Agent receives result and responds: "Done! I've sent the summary to your email."
```

#### Flow 2: Multiple Workflows Available

```
1. Agent has 3 workflows assigned:
   - "Summarize site email"
   - "Daily digest"
   - "Competitor analysis"
2. User: "What workflows can you run?"
3. Agent lists all 3 workflows with descriptions
4. User: "Run the daily digest"
5. Agent invokes "Daily digest" workflow
6. Workflow executes with bound connections
7. Agent reports completion
```

---

## Part A: Workflow Tool Wrapping and Chat Integration

### Goal

Create the service that wraps workflows as executable tools and integrate it into the chat service so agents can invoke workflows during conversations.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/tools/services/workflow-tools.ts` | Create | Wraps assigned workflows as executable tools for agent chat, following the exact same pattern as connection tools. Enables agents to invoke complex multi-step workflows (like "Summarize site email") as single atomic operations. Loads transpiled workflow files dynamically, wraps workflow execution in Vercel AI SDK's `tool()` function, creates RuntimeContext with connection bindings inside execute function, uses workflow's inputSchema directly (already Zod), and returns ToolDefinition with `.run` property. Handles errors gracefully to prevent workflow loading failures from breaking agent chat. | ~150 |
| `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Modify | Adds workflow tools to agent's toolset during chat initialization. Enables agents to see and use assigned workflows alongside connection tools and custom tools. Loads workflow bindings from agent config, wraps each workflow as a tool via workflow-tools service, and adds them to the tool map that the Mastra agent uses. Ensures workflows are treated as first-class capabilities that agents can invoke naturally in conversation. | +40 |

### Pseudocode

#### `app/api/tools/services/workflow-tools.ts`

```
import { getWorkflowExecutable, getWorkflowMetadata } from "@/app/api/workflows/services/workflow-loader";
import { RuntimeContext } from "@mastra/core/workflows";
import { tool } from "ai";
import type { Tool } from "ai";
import type { WorkflowBinding, ToolDefinition } from "@/_tables/types";

getWorkflowToolExecutable(userId: string, binding: WorkflowBinding): Promise<ToolDefinition | undefined>
├── Load workflow executable:
│   ├── const workflow = await getWorkflowExecutable(binding.workflowId)
│   └── If workflow is null: Return undefined (log warning)
│
├── Load workflow metadata:
│   ├── const metadata = await getWorkflowMetadata(binding.workflowId)
│   └── If metadata is null: Return undefined (log warning)
│
├── Extract input schema from workflow:
│   ├── Workflow has inputSchema property (Zod schema)
│   └── Use directly as tool inputSchema (no conversion needed)
│
├── Create tool using Vercel AI SDK tool():
│   └── const vercelTool = tool({
│       description: metadata.description || `Workflow: ${metadata.name}`,
│       inputSchema: workflow.inputSchema,  // Zod schema (already correct format)
│       execute: async (input: Record<string, unknown>) => {
│         ├── Create RuntimeContext with connection bindings:
│         │   └── const runtimeContext = new RuntimeContext({
│         │       connections: binding.connectionBindings
│         │         // { "gmail": "ca_abc123", "slack": "ca_xyz789" }
│         │     })
│         │
│         ├── Create workflow run:
│         │   └── const run = await workflow.createRunAsync({
│         │       resourceId: userId,
│         │       runtimeContext: runtimeContext  // Pass here, available to all steps
│         │     })
│         │
│         ├── Execute workflow with input:
│         │   └── const result = await run.start({
│         │       inputData: input  // User-provided inputs matching inputSchema
│         │     })
│         │
│         ├── Handle execution result:
│         │   ├── If result.status === "success":
│         │   │   └── Return result.result (workflow output)
│         │   ├── If result.status === "failed":
│         │   │   └── Extract error from result.steps, throw with details
│         │   └── Else (suspended, etc.):
│         │       └── Return result with status info
│         │
│         └── Handle errors gracefully:
│             └── Catch and throw with workflow context
│       }
│     })
│
├── Return ToolDefinition (matching connection tools pattern):
│   └── return {
│       id: `workflow-${binding.workflowId}`,
│       name: metadata.name,
│       description: metadata.description || `Workflow: ${metadata.name}`,
│       runtime: "workflow",
│       run: vercelTool as Tool<unknown, unknown>  // Extract .run for toolMap
│     }
│
└── Handle errors gracefully, return undefined on failure
```

#### `app/api/workforce/[agentId]/chat/services/chat-service.ts` (additions)

```
buildToolMap(userId, agentConfig)
├── ... existing: load custom tools ...
├── ... existing: load connection tools ...
│
├── NEW: Load workflow tools:
│   ├── const workflowBindings = agentConfig.workflowBindings || []
│   ├── For each binding in workflowBindings:
│   │   ├── const toolDef = await getWorkflowToolExecutable(userId, binding)
│   │   ├── If toolDef is undefined: Log warning, continue
│   │   ├── Extract .run property (same pattern as connection tools):
│   │   │   └── toolMap[toolDef.id] = toolDef.run
│   │   │
│   │   └── Log: `[ChatService] Loaded workflow tool: ${toolDef.id}`
│   │
│   └── Log: `[ChatService] Loaded ${workflowBindings.length} workflow tools`
│
└── Return toolMap (now includes workflow tools)
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-11.1 | Workflow tools appear in agent's toolset | Check toolMap keys, see workflow tools |
| AC-11.2 | Agent can invoke workflow with inputs | Chat → agent uses workflow tool → executes |
| AC-11.3 | Workflow uses bound connections | Check logs → connection IDs passed via runtimeContext |
| AC-11.4 | Workflow receives correct inputs | Check workflow execution → inputs match schema |
| AC-11.5 | Agent receives workflow result | Check agent response → includes workflow output |
| AC-11.6 | Failed workflow loading doesn't break chat | Remove workflow.ts → chat still works |
| AC-11.7 | Workflow tool description matches metadata | Check tool description → shows workflow name |

### User Flows

#### Flow A.1: Agent Invokes "Summarize site email" Workflow

```
1. Agent "Mira" has workflow binding:
   {
     workflowId: "wf-MSKSYrCZ-Tfc",
     connectionBindings: { "gmail": "ca_xyz789" }
   }

2. User chats: "Summarize example.com and email it to me@email.com"

3. Chat service loads tools:
   - Custom tools: [workflow-requirements_digest, ...]
   - Connection tools: [GMAIL_SEND_EMAIL, BROWSER_TOOL_NAVIGATE, ...]
   - Workflow tools: [workflow-wf-MSKSYrCZ-Tfc] ← NEW

4. Agent sees workflow tool with description: "Summarize site email"

5. Agent decides to use workflow tool:
   - Calls tool with: { URL: "example.com", Email Address: "me@email.com" }

6. Workflow tool executes:
   - Creates RuntimeContext: { connections: { gmail: "ca_xyz789" } }
   - Creates workflow run
   - Executes: Navigate → Fetch → Send Email
   - Send Email step uses bound Gmail connection

7. Workflow completes successfully

8. Agent receives result and responds: "Done! I've sent the summary to your email."
```

#### Flow A.2: Workflow Loading Failure

```
1. Agent has workflow binding for workflow that doesn't exist
2. Chat service tries to load workflow tool
3. getWorkflowExecutable returns null
4. Service logs warning: "Workflow tool not found: wf-invalid"
5. Service continues loading other tools
6. Agent chat works normally (just without that workflow)
```

---

## Out of Scope

- **Workflow execution UI** → Workflows execute in background, agent reports results
- **Real-time workflow status** → Agent reports completion, not step-by-step progress
- **Workflow result formatting** → Agent handles result interpretation
- **Workflow versioning** → Always use latest transpiled version
- **Workflow input validation UI** → Agent handles input collection via conversation
- **Workflow error recovery** → Agent reports errors to user, doesn't retry automatically

---

## References

- **Phase 10**: Agent Integration - Workflow assignment and binding (Parts A-D)
- **Research Log**: `11.1-Phase11-Workflow-Runtime-Execution-Research.md` - Comprehensive research on tool wrapping patterns, Mastra agent interface, and RuntimeContext usage
- **Workflow Loader**: `app/api/workflows/services/workflow-loader.ts` - Loading workflows from disk
- **Chat Service**: `app/api/workforce/[agentId]/chat/services/chat-service.ts` - Tool loading pattern
- **Connection Tools Pattern**: `app/api/tools/services/composio-tools.ts` - Tool wrapping example (follow this pattern exactly)
- **Mastra Execution**: `Workflow-Primitives.md` - `createRunAsync()` and `.start()` patterns
- **Research**: `15.5-workflows-f-transpilation-research.md` - RuntimeContext and execution patterns

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-08 | Initial creation, extracted from Phase 10 Part E | Assistant |
| 2025-12-08 | Updated based on research findings: fixed return type to ToolDefinition, clarified RuntimeContext creation timing, corrected inputSchema usage, added ToolDefinition structure matching connection tools pattern | Assistant |

---

**Last Updated:** December 8, 2025

