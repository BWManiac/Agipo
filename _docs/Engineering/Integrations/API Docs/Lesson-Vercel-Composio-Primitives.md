# Lesson: Vercel AI SDK & Composio Primitives

**Goal:** Understand how the Vercel AI SDK "sees" tools, and how we inject both Composio (Basic) and Agipo (Custom) tools into that view.

---

## 1. The Core Primitive: `tool()`

At its heart, the Vercel AI SDK is very simple. It doesn't care *where* a tool comes from (Composio, your hard drive, or a transpiled script). It only cares that the tool matches this shape:

```typescript
// The Vercel AI SDK Primitive
import { tool } from 'ai';
import { z } from 'zod';

const myTool = tool({
  description: 'A description for the LLM to understand when to use this',
  parameters: z.object({ ... }), // A Zod schema defining the inputs
  execute: async (args) => {
    // The actual code to run
    return "Result";
  },
});
```

When you call `streamText` or `streamUI`, you pass a dictionary of these objects:

```typescript
streamText({
  model: openai('gpt-4'),
  tools: {
    weatherTool: tool({ ... }),
    stockTool: tool({ ... }),
  }
})
```

---

## 2. How Composio Fits In

Composio is essentially a **Tool Factory**. Instead of you writing the `tool()` definition manually for "Gmail Send Email" (defining the schema, writing the API call, handling the OAuth token), Composio does it for you.

### The Transformation
When you run `await toolset.get_tools({ entityId: 'user_1' })`, Composio performs a transformation:

1.  **Input:** It looks at its internal catalog for `GMAIL_SEND_EMAIL`.
2.  **Hydration:** It looks up `user_1`'s OAuth token for Gmail.
3.  **Output:** It returns a fully formed Vercel `tool()` object that looks exactly like one you wrote yourself.

```typescript
// Conceptually, this is what Composio returns:
const composioTools = {
  gmail_send_email: tool({
    description: "Sends an email using Gmail...",
    parameters: z.object({ to: z.string(), subject: z.string(), ... }),
    execute: async (args) => {
      // Composio's internal SDK logic:
      // 1. Get token for user_1
      // 2. Call Google API
      // 3. Return result
    }
  })
}
```

---

## 3. The "Compilation" (Merging Layers)

You mentioned "compiling" the tools. In this context, compilation is just **Merging Objects**.

To an Agent, a "Custom Tool" (Workflow) and a "Basic Tool" (Integration) are indistinguishable. We simply merge them before handing them to the LLM.

```typescript
// app/api/chat/route.ts

// 1. Get Basic Tools (from Composio)
const basicTools = await composio.get_tools({ apps: ['gmail'] });

// 2. Get Custom Tools (from Agipo DB)
// We wrap your transpiled workflows in the standard tool() primitive
const customTools = {
  "onboard_employee": tool({
    description: "Runs the onboarding workflow...",
    parameters: z.object({ employeeEmail: z.string() }),
    execute: async (args) => {
      // Run the Workflow Engine
      return await workflowRunner.run('onboard_employee', args);
    }
  })
};

// 3. The Merge
const allCapabilities = {
  ...basicTools,
  ...customTools
};

// 4. Execution
// The LLM sees: ["gmail_send_email", "onboard_employee"]
streamText({
  tools: allCapabilities,
  // ...
})
```

---

## 4. The "Inception" Moment: Custom Tools calling Basic Tools

You asked: *Can custom tools invoke basic tools?*

**YES.** This is where the hierarchy matters.

*   **Layer 1 (The Agent):** The Agent calls `onboard_employee` (Custom Tool).
*   **Layer 2 (The Workflow Engine):** The logic inside `onboard_employee` runs.
*   **Layer 3 (The Basic Tool):** The logic inside the workflow calls `gmail_send_email` (Basic Tool).

**How does the Workflow know how to call Gmail?**
When we transpile the workflow, we inject the **same Composio Toolset** that the Agent uses, but we put it inside the script's execution environment.

```javascript
// run.js (The Transpiled Custom Tool)
async function run({ input, tools }) { 
  // 'tools' is the Composio SDK instance we injected
  
  // Step 1: Do some logic
  const welcomeMessage = `Welcome ${input.employeeEmail}!`;
  
  // Step 2: Call a Basic Tool
  await tools.executeAction('GMAIL_SEND_EMAIL', {
    to: input.employeeEmail,
    body: welcomeMessage
  });
}
```

---

## 5. Conclusion & Recommendation

**Is integrating Composio the right next step?**
**Absolutely.**

Why? Because you cannot build **Layer 3 (Basic Tools)** without it.
And without Layer 3, your **Custom Tools (Layer 2)** have nothing interesting to do (other than simple math or logic).

By integrating Composio now (Phase 1), you establish the **Foundation** (Auth & Basic Actions) that your future Custom Tools will rely on.

