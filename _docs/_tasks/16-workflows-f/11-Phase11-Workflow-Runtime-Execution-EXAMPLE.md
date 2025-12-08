# Phase 11: Concrete Example - How Workflow Wrapping Works

This document shows the **actual code** for how workflows are wrapped as tools and how agents call them.

---

## The Complete Flow

### 1. What Gets Created: The Wrapped Tool

Here's what `workflow-tools.ts` will create (following the exact pattern of `composio-tools.ts`):

```typescript
// app/api/tools/services/workflow-tools.ts

import { getWorkflowExecutable, getWorkflowMetadata } from "@/app/api/workflows/services/workflow-loader";
import { RuntimeContext } from "@mastra/core/workflows";
import { tool } from "ai";
import type { Tool } from "ai";
import type { WorkflowBinding, ToolDefinition } from "@/_tables/types";

export async function getWorkflowToolExecutable(
  userId: string,
  binding: WorkflowBinding
): Promise<ToolDefinition | undefined> {
  // 1. Load the workflow (transpiled TypeScript file)
  const workflow = await getWorkflowExecutable(binding.workflowId);
  if (!workflow) {
    console.warn(`[WorkflowTools] Workflow not found: ${binding.workflowId}`);
    return undefined;
  }

  // 2. Load metadata (name, description, etc.)
  const metadata = await getWorkflowMetadata(binding.workflowId);
  if (!metadata) {
    console.warn(`[WorkflowTools] Metadata not found: ${binding.workflowId}`);
    return undefined;
  }

  // 3. Create the Vercel AI SDK tool that wraps workflow execution
  const vercelTool = tool({
    description: metadata.description || `Workflow: ${metadata.name}`,
    
    // Use workflow's inputSchema directly (already Zod, no conversion needed)
    // This is what the agent sees - e.g., { URL: z.string(), "Email Address": z.string() }
    inputSchema: workflow.inputSchema,
    
    // This is what gets called when agent invokes the tool
    execute: async (input: Record<string, unknown>) => {
      console.log(`[WorkflowTools] Executing workflow: ${binding.workflowId}`);
      console.log(`[WorkflowTools] Input:`, JSON.stringify(input, null, 2));
      
      // Create RuntimeContext with connection bindings
      // This is where bound connections (from Phase 10) get passed to workflow steps
      const runtimeContext = new RuntimeContext({
        connections: binding.connectionBindings
        // Example: { "gmail": "ca_abc123", "slack": "ca_xyz789" }
      });
      
      // Create workflow run instance
      const run = await workflow.createRunAsync({
        resourceId: userId,
        runtimeContext,  // Connections available to all steps
      });
      
      // Execute workflow with user-provided inputs
      // The 'input' parameter comes from the agent's tool call
      // It matches the workflow's inputSchema (e.g., { URL: "...", "Email Address": "..." })
      const result = await run.start({
        inputData: input  // Agent's tool call arguments
      });
      
      // Handle result
      if (result.status === "success") {
        // Return workflow output to agent
        return result.result;
      } else if (result.status === "failed") {
        // Extract error details
        const failedSteps = Object.entries(result.steps || {})
          .filter(([_, step]) => step.status === "failed")
          .map(([id, step]) => ({ stepId: id, error: step.error }));
        
        throw new Error(
          `Workflow execution failed: ${JSON.stringify(failedSteps)}`
        );
      }
      
      // For suspended or other statuses
      return { status: result.status, result: result.result };
    },
  });

  // 4. Return ToolDefinition (same structure as connection tools)
  return {
    id: `workflow-${binding.workflowId}`,
    name: metadata.name,
    description: metadata.description || `Workflow: ${metadata.name}`,
    runtime: "workflow",
    run: vercelTool as Tool<unknown, unknown>,  // This is what goes into toolMap
  };
}
```

---

## 2. How It Gets Integrated: Chat Service

Here's what gets added to `chat-service.ts`:

```typescript
// app/api/workforce/[agentId]/chat/services/chat-service.ts

import { getWorkflowToolExecutable } from "@/app/api/tools/services/workflow-tools";

export async function buildToolMap(
  userId: string,
  agentConfig: AgentConfig
): Promise<Record<string, Tool<unknown, unknown>>> {
  const toolMap: Record<string, Tool<unknown, unknown>> = {};
  
  // ... existing: load custom tools ...
  for (const toolId of agentConfig.toolIds) {
    const toolDef = await getExecutableToolById(toolId);
    if (toolDef) {
      toolMap[toolId] = toolDef.run;
    }
  }

  // ... existing: load connection tools ...
  const connectionBindings = agentConfig.connectionToolBindings || [];
  for (const binding of connectionBindings) {
    const toolDef = await getConnectionToolExecutable(userId, binding);
    if (toolDef) {
      toolMap[binding.toolId] = toolDef.run;
    }
  }
  
  // NEW: Load workflow tools
  const workflowBindings = agentConfig.workflowBindings || [];
  for (const binding of workflowBindings) {
    const toolDef = await getWorkflowToolExecutable(userId, binding);
    if (!toolDef) {
      console.warn(`[ChatService] Workflow tool not found: ${binding.workflowId}; skipping.`);
      continue;
    }
    // Extract .run property (same pattern as connection tools)
    toolMap[toolDef.id] = toolDef.run;
    console.log(`[ChatService] Loaded workflow tool: ${toolDef.id}`);
  }
  
  console.log(`[ChatService] Loaded ${Object.keys(toolMap).length} tools: ${Object.keys(toolMap).join(", ") || "none"}`);
  
  return toolMap;
}
```

---

## 3. What Mastra Agent Sees

When the agent is created, it receives a toolMap like this:

```typescript
const toolMap = {
  // Custom tools
  "workflow-requirements_digest": customTool1,
  "workflow-launch_tracker": customTool2,
  
  // Connection tools
  "GMAIL_SEND_EMAIL": connectionTool1,
  "BROWSER_TOOL_NAVIGATE": connectionTool2,
  
  // NEW: Workflow tools (wrapped)
  "workflow-wf-MSKSYrCZ-Tfc": workflowTool,  // ← This is the wrapped workflow
};

const agent = new Agent({
  name: "pm",
  instructions: "...",
  model: gateway("google/gemini-2.5-pro"),
  tools: toolMap,  // All tools look the same to the agent
  memory: getAgentMemory("pm"),
});
```

**From Mastra's perspective:** All tools are identical. They're all `Tool<unknown, unknown>` instances with:
- `description` (string) - shown to LLM
- `inputSchema` (Zod schema) - validates inputs
- `execute(input)` (function) - called when LLM decides to use tool

---

## 4. How Agent Calls It: The Actual Flow

### Step 1: User sends message
```
User: "Can you summarize example.com and email it to me@email.com?"
```

### Step 2: Agent's LLM sees available tools
The LLM sees tool descriptions:
- `"GMAIL_SEND_EMAIL"`: "Send an email via Gmail"
- `"BROWSER_TOOL_NAVIGATE"`: "Navigate to a URL"
- `"workflow-wf-MSKSYrCZ-Tfc"`: "Summarize site email" ← Workflow tool

### Step 3: LLM decides to use workflow tool
The LLM recognizes the user's request matches the workflow description and decides to call:
```typescript
// This happens inside Mastra Agent.stream()
toolMap["workflow-wf-MSKSYrCZ-Tfc"].execute({
  URL: "example.com",
  "Email Address": "me@email.com"
})
```

### Step 4: Tool's execute function runs
```typescript
// Inside workflow-tools.ts execute function
execute: async (input: Record<string, unknown>) => {
  // input = { URL: "example.com", "Email Address": "me@email.com" }
  
  // Create RuntimeContext with bound connections
  const runtimeContext = new RuntimeContext({
    connections: binding.connectionBindings
    // { "gmail": "ca_xyz789" } ← From Phase 10 assignment
  });
  
  // Create workflow run
  const run = await workflow.createRunAsync({
    resourceId: userId,
    runtimeContext,
  });
  
  // Execute workflow
  const result = await run.start({
    inputData: input  // { URL: "example.com", "Email Address": "me@email.com" }
  });
  
  // Workflow executes:
  // 1. Navigate step: uses browser_tool (NO_AUTH, no connection needed)
  // 2. Fetch step: uses browser_tool (NO_AUTH, no connection needed)
  // 3. Send Email step: uses runtimeContext.get("connections")["gmail"] = "ca_xyz789"
  
  return result.result;  // Workflow output returned to agent
}
```

### Step 5: Agent receives result
```typescript
// Agent's LLM receives the workflow result
{
  // Whatever the workflow's last step returned
  // e.g., { success: true, messageId: "..." }
}

// Agent's LLM generates response:
"Done! I've sent the summary to your email."
```

---

## 5. Runtime Inputs: How They Work

The workflow's `inputSchema` defines what inputs the agent can provide:

```typescript
// From workflow.ts (transpiled)
export const summarizeSiteEmailWorkflow = createWorkflow({
  id: "wf-MSKSYrCZ-Tfc",
  inputSchema: z.object({
    URL: z.string(),           // ← Agent can provide this
    "Email Address": z.string() // ← Agent can provide this
  }),
  outputSchema: z.any()
})
```

When the agent calls the tool, it provides values for these inputs:

```typescript
// Agent's tool call
tool.execute({
  URL: "example.com",           // ← Runtime input from user's message
  "Email Address": "me@email.com" // ← Runtime input from user's message
})
```

These inputs flow through the workflow:
1. First step receives: `{ URL: "example.com", "Email Address": "me@email.com" }`
2. Workflow's `.map()` extracts `URL` for navigate step
3. Workflow's `.map()` extracts `"Email Address"` for send email step
4. Each step uses the data it needs

**Connection bindings are separate** - they're set during workflow assignment (Phase 10) and passed via RuntimeContext, not as runtime inputs.

---

## 6. File Count Confirmation

**Yes, only 2 files need to be edited:**

1. **`app/api/tools/services/workflow-tools.ts`** (CREATE)
   - New file that wraps workflows as tools
   - ~150 lines
   - Follows exact pattern of `composio-tools.ts`

2. **`app/api/workforce/[agentId]/chat/services/chat-service.ts`** (MODIFY)
   - Add workflow tool loading to `buildToolMap()`
   - ~40 lines added
   - Same pattern as connection tools loading

That's it! The rest of the infrastructure already exists:
- Workflow loading (`workflow-loader.ts`) ✅
- Agent config with `workflowBindings` (Phase 10) ✅
- Tool map structure ✅
- Agent creation ✅

---

## Key Insight

**From Mastra's perspective:**
- All tools are `Tool<unknown, unknown>` instances
- Agent calls `tool.execute(input)` for all tools
- Agent receives `output` from all tools
- **No difference between connection tools and workflow tools once wrapped**

**The wrapping is just:**
- Converting `workflow.createRunAsync().start()` pattern → `tool.execute()` pattern
- Passing connection bindings via RuntimeContext
- Returning workflow result as tool output

The agent doesn't know or care that one tool is a workflow - it just sees tools with descriptions and executes them.

