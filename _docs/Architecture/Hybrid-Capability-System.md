# Architecture: The Hybrid Capability System

**Status:** Planning
**Date:** December 1, 2025
**Context:** Defining how "Basic Tools" (Composio) and "Custom Tools" (Agipo Workflows) coexist.

---

## 1. Core Nomenclature

To avoid confusion between the different types of "Tools", we are adopting the following hierarchy:

### 1.1. Capabilities (The Superclass)
A **Capability** is any discrete action an Agent can perform. From the Agent's perspective (and the LLM's), all capabilities are identical: they are function signatures with a name, description, and schema.

### 1.2. Integrations (fka "Basic Tools")
**Source:** Composio
**Definition:** Atomic actions provided by third-party SaaS platforms.
**Managed By:** Composio Platform.
**Examples:** `gmail_send_email`, `github_star_repo`, `slack_post_message`.
**Execution:** Handled by the Composio SDK, which manages the HTTP request and OAuth tokens.

### 1.3. Workflows (fka "Custom Tools")
**Source:** Agipo (User Created)
**Definition:** Compound processes authored in the Workflow Editor and transpiled to code.
**Managed By:** Agipo `Workflow-as-Code` Engine.
**Examples:** `onboard_employee`, `generate_weekly_report`.
**Execution:** Handled by Agipo's `WorkflowExecutionService` (running `run.js`).

> **Key Insight:** A **Workflow** can (and often does) call **Integrations**.
> *Example:* The `onboard_employee` Workflow calls the `google_workspace_create_user` Integration.

---

## 2. Technical Strategy: The "Hybrid Toolset" Pattern

We will **not** register Agipo Workflows inside Composio. Instead, we will merge the two types of capabilities at the **Application Runtime Layer** (specifically, just before calling the LLM).

### 2.1. The Tool Loader Service

We will create a service `lib/agents/tools.ts` with a method `getAgentCapabilities(agentId)`.

```typescript
import { composioToolSet } from "@/lib/integrations/composio";
import { getAssignedWorkflows } from "@/lib/workflows/service";

export async function getAgentCapabilities(agentId: string) {
  // 1. Fetch Integrations from Composio (The "Basic" Tools)
  // Returns: { gmail_send: { ... }, github_star: { ... } }
  const integrationTools = await composioToolSet.getTools({ entityId: agentId });

  // 2. Fetch Workflows from Database (The "Custom" Tools)
  const workflowRecords = await getAssignedWorkflows(agentId);
  
  // 3. Wrap Workflows as Vercel AI SDK Tools
  const workflowTools = workflowRecords.reduce((acc, wf) => {
    acc[wf.slug] = tool({
      description: wf.description,
      parameters: wf.inputSchema, // Zod schema from transpiler
      execute: async (args) => {
        // Call our internal runner
        return await executeWorkflow(wf.id, args);
      }
    });
    return acc;
  }, {});

  // 4. Merge and Return
  return { ...integrationTools, ...workflowTools };
}
```

### 2.2. Consumption in `AgentChat`

When initializing the chat stream, we simply call this service. The Vercel AI SDK handles the rest.

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages, agentId } = await req.json();
  
  // The LLM sees one flat list of capabilities
  const tools = await getAgentCapabilities(agentId);

  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages,
    tools: tools, // Contains BOTH Gmail and Custom Workflows
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
```

---

## 3. Impact on `Workflow-as-Code`

Since Workflows (Custom Tools) need to call Integrations (Basic Tools), the **Runtime Injection** plan from `Integrations.md` remains critical.

When the `WorkflowExecutionService` runs a transpiled workflow:
1.  It identifies which Integrations are used in the script.
2.  It retrieves the necessary Connection IDs for the Agent Owner.
3.  It injects a configured `ComposioToolSet` into the execution environment (WebContainer or VM).

```javascript
// Transpiled `run.js`
async function run({ input, tools }) {
  // `tools` is the injected Composio instance
  // The user's logic calls the Basic Tool
  await tools.executeAction('GMAIL_SEND_EMAIL', { ... });
}
```

---

## 4. Comparison: Why not Custom Tools in Composio?

Composio *does* allow uploading "Custom Tools" (Python/JS code) to their platform.

**Why we rejected this:**
1.  **Latency:** Uploading code to their cloud introduces deployment lag.
2.  **Complexity:** We already have a sophisticated execution engine (WebContainers) for workflows. Duplicating this on Composio is redundant.
3.  **Vendor Lock-in:** We want our Workflow Engine to be independent. If we switch from Composio to Nango later, our core business logic (Workflows) shouldn't break.

**Conclusion:**
Agipo owns the **Logic** (Workflows). Composio owns the **Connectivity** (Integrations). We merge them at the edge.

