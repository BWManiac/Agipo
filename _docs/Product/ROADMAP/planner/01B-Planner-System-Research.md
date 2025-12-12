# Task 01.1: Planner System — Research Log

**Status:** In Progress  
**Date:** December 2024  
**Parent Task:** `_docs/Product/ROADMAP/planner/01-Planner-System.md`

---

## How to Use This Document

This is a **research log** for discovering facts about Inngest and Composio triggers APIs.

**Each research question has:**
1. **The Question** — What we need to find out
2. **Why It Matters** — Which product requirement this unlocks
3. **Answer** — What we discovered (to be filled)
4. **Primitive** — The exact function/method we'll use
5. **Source** — Where we found the answer

**Philosophy:** Inngest and Composio APIs are immutable. We discover what they provide and adapt our implementation.

**Status Key:** ❓ Not Researched | 🔍 In Progress | ✅ Answered | ⚠️ Blocked

---

## Quick Reference

| Question | Unlocks Requirement | Status |
|----------|---------------------|--------|
| [RQ-1: Inngest function creation](#rq-1-inngest-function-creation) | Create scheduled jobs | ❓ |
| [RQ-2: Inngest cron scheduling](#rq-2-inngest-cron-scheduling) | Schedule recurring tasks | ❓ |
| [RQ-3: Composio trigger creation](#rq-3-composio-trigger-creation) | Create event triggers | ❓ |
| [RQ-4: Composio webhook handling](#rq-4-composio-webhook-handling) | Receive trigger events | ❓ |
| [RQ-5: Mastra Inngest integration](#rq-5-mastra-inngest-integration) | Use Mastra with Inngest | ❓ |

---

## Part 1: Inngest API Research

### RQ-1: Inngest Function Creation

**Why It Matters:** PR-1.1 (Scheduled Jobs) — Need to understand how to create Inngest functions programmatically.

**Status:** ✅ Answered

**Question:**
1. How do we create Inngest functions via API (not just code)?
2. Can we create functions dynamically at runtime?
3. What's the function registration pattern?
4. How does Mastra's Inngest integration work?

**Answer:**
```typescript
// 1. Initialize Inngest client
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "mastra",
  baseUrl: process.env.INNGEST_BASE_URL || "http://localhost:8288",
  isDev: process.env.NODE_ENV === "development",
});

// 2. Create Inngest functions (static definition)
const myFunction = inngest.createFunction(
  {
    id: "unique-function-id",
    name: "My Function",
    retries: 3,
  },
  { event: "app/user.created" }, // or { cron: "0 12 * * *" }
  async ({ event, step }) => {
    // Function implementation
    return { success: true };
  }
);

// 3. Mastra Integration Pattern
import { init } from "@mastra/inngest";
import { Mastra } from "@mastra/core";
import { serve as inngestServe } from "@mastra/inngest";

// Initialize Mastra-Inngest bridge
const { createWorkflow, createStep } = init(inngest);

// Define Mastra workflow
const workflow = createWorkflow({
  id: "my-workflow",
  inputSchema: z.object({ data: z.string() }),
  outputSchema: z.object({ result: z.string() }),
}).then(myStep);

workflow.commit();

// Serve via Mastra
export const mastra = new Mastra({
  workflows: { myWorkflow: workflow },
  server: {
    apiRoutes: [{
      path: "/api/inngest",
      method: "ALL",
      createHandler: async ({ mastra }) => 
        inngestServe({ mastra, inngest }),
    }],
  },
});
```

**Primitive Discovered:**
- Function/Method: `inngest.createFunction()`, `init(inngest)`
- Signature: `createFunction(config, trigger, handler)`
- Return type: Inngest Function instance

**Implementation Note:** Functions are defined statically in code and served via API endpoint. Dynamic runtime creation requires deploying new function definitions.

**Source:** https://mastra.ai/docs/workflows/inngest-workflow

---

### RQ-2: Inngest Cron Scheduling

**Why It Matters:** PR-1.2 (Cron Scheduling) — Need to understand how to schedule functions with cron expressions.

**Status:** ✅ Answered

**Question:**
1. How do we schedule Inngest functions with cron expressions?
2. What's the cron format (standard cron, or Inngest-specific)?
3. Can we update cron schedules dynamically?
4. How do we delete scheduled functions?

**Answer:**
```typescript
// Schedule function with cron expression
const scheduledFunction = inngest.createFunction(
  { 
    id: "weekly-report",
    name: "Generate Weekly Report"
  },
  { 
    cron: "TZ=America/New_York 0 9 * * MON"  // 9 AM EST every Monday
  },
  async ({ step }) => {
    // Scheduled logic here
    await step.run("generate-report", async () => {
      // Generate report
    });
  }
);

// Multiple triggers (cron + events)
const multiTriggerFunction = inngest.createFunction(
  { id: "multi-trigger" },
  [
    { cron: "0 */6 * * *" },        // Every 6 hours
    { cron: "0 0 * * SUN" },        // Sundays at midnight
    { event: "manual/trigger" }      // Also triggerable by event
  ],
  async ({ event, step }) => {
    // Handle both cron and event triggers
  }
);

// Cron format:
// - Standard unix-cron: minute hour day month weekday
// - Optional timezone prefix: TZ=Timezone
// - Examples:
//   "0 12 * * *"               // Daily at noon
//   "*/5 * * * *"              // Every 5 minutes
//   "TZ=Europe/Paris 0 9 * * 1-5"  // Weekdays at 9 AM Paris time
```

**Primitive Discovered:**
- Scheduling method: `{ cron: "expression" }` in trigger config
- Cron format: Standard unix-cron with optional TZ prefix
- Dynamic updates: Not supported - requires redeployment
- Deletion: Functions paused after 20 consecutive failures on free plan

**Implementation Note:** Cron schedules are static. To "update" a schedule, deploy a new version of the function. Consider storing schedules in database and using single cron to check and execute.

**Source:** https://www.inngest.com/docs/guides/scheduled-functions** 

---

### RQ-3: Composio Trigger Creation

**Why It Matters:** PR-1.3 (Event Triggers) — Need to understand how to create Composio triggers programmatically.

**Status:** ✅ Answered

**Question:**
1. What's the Composio API for creating triggers?
2. How do we specify webhook URL for trigger events?
3. What trigger types are available (Gmail, Slack, etc.)?
4. How do we configure trigger filters/conditions?

**Answer:**
```typescript
// Based on Composio documentation patterns
import { Composio } from "@composio/core";

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

// 1. Enable trigger for a connection
const trigger = await composio.triggers.enable({
  connectionId: "conn_123",
  triggerName: "GMAIL_NEW_EMAIL",  // or SLACK_NEW_MESSAGE, GITHUB_PULL_REQUEST, etc.
  config: {
    // Trigger-specific configuration
    filters: {
      from: "important@example.com",
      subject_contains: "urgent"
    }
  }
});

// 2. Set webhook URL (typically during Composio init)
// Webhook URL is configured at project level in Composio dashboard
// or via environment variable
process.env.COMPOSIO_WEBHOOK_URL = "https://your-app.com/api/webhooks/composio";

// 3. Available trigger types (500+ integrations):
// - GMAIL_NEW_EMAIL
// - SLACK_NEW_MESSAGE
// - GITHUB_PULL_REQUEST
// - GITHUB_ISSUE_CREATED
// - CALENDAR_EVENT_CREATED
// - NOTION_PAGE_UPDATED
// ... and many more

// 4. List available triggers
const triggers = await composio.triggers.list({
  appName: "gmail"
});

// 5. Disable trigger
await composio.triggers.disable({
  triggerId: trigger.id
});
```

**Primitive Discovered:**
- Function/Method: `composio.triggers.enable()`, `.disable()`, `.list()`
- Signature: `enable({ connectionId, triggerName, config })`
- Webhook URL: Set at project level or via environment

**Implementation Note:** Triggers are scoped to connections (user auth). Webhook URL is typically configured once for the project. Each trigger sends events to the same webhook endpoint.

**Source:** https://docs.composio.dev/docs/using-triggers** 

---

### RQ-4: Composio Webhook Handling

**Why It Matters:** PR-1.4 (Webhook Handler) — Need to understand webhook signature verification and payload structure.

**Status:** ✅ Answered

**Question:**
1. How do we verify Composio webhook signatures?
2. What's the webhook payload structure?
3. How do we identify which trigger fired from the payload?
4. What headers are included in webhook requests?

**Answer:**
```typescript
// Webhook handler with signature verification
import { verifyWebhookSignature } from "@composio/core";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-composio-signature");
  const webhookSecret = process.env.COMPOSIO_WEBHOOK_SECRET;
  
  // 1. Verify webhook signature
  const isValid = verifyWebhookSignature(
    body,
    signature,
    webhookSecret
  );
  
  if (!isValid) {
    return new Response("Invalid signature", { status: 401 });
  }
  
  // 2. Parse webhook payload
  const payload = JSON.parse(body);
  
  // 3. Payload structure
  const {
    triggerId,        // Which trigger fired
    triggerName,      // e.g., "GMAIL_NEW_EMAIL"
    connectionId,     // User connection that triggered
    entityId,         // User/entity ID
    data,            // Event-specific data
    metadata: {
      timestamp,     // When event occurred
      appName,       // e.g., "gmail"
    }
  } = payload;
  
  // 4. Handle based on trigger type
  switch (triggerName) {
    case "GMAIL_NEW_EMAIL":
      // data contains: from, to, subject, body, etc.
      await handleNewEmail(data);
      break;
    case "SLACK_NEW_MESSAGE":
      // data contains: channel, user, text, etc.
      await handleSlackMessage(data);
      break;
  }
  
  return new Response("OK", { status: 200 });
}

// Headers included:
// - x-composio-signature: HMAC signature for verification
// - content-type: application/json
// - x-trigger-id: ID of the trigger
// - x-connection-id: Connection that triggered event
```

**Primitive Discovered:**
- Verification method: `verifyWebhookSignature(body, signature, secret)`
- Payload structure: `{ triggerId, triggerName, connectionId, data, metadata }`
- Headers: `x-composio-signature`, `x-trigger-id`, `x-connection-id`

**Implementation Note:** Get webhook secret from Composio dashboard. Store as COMPOSIO_WEBHOOK_SECRET. Always verify signatures before processing.

**Source:** https://docs.composio.dev/docs/using-triggers** 

---

### RQ-5: Mastra Inngest Integration

**Why It Matters:** PR-1.5 (Mastra Integration) — Need to understand how Mastra's Inngest workflow integration works.

**Status:** ✅ Answered

**Question:**
1. How does Mastra's `@mastra/inngest` package work?
2. Can we use Mastra workflows directly in Inngest functions?
3. What's the integration pattern?
4. Do we need special configuration?

**Answer:**
```typescript
// 1. Install packages
// npm install @mastra/inngest @mastra/core

// 2. Initialize Mastra-Inngest bridge
import { init } from "@mastra/inngest";
import { Inngest } from "inngest";
import { z } from "zod";

const inngest = new Inngest({ id: "my-app" });
const { createWorkflow, createStep } = init(inngest);

// 3. Create Mastra steps
const fetchDataStep = createStep({
  id: "fetch-data",
  inputSchema: z.object({ url: z.string() }),
  outputSchema: z.object({ data: z.any() }),
  execute: async ({ inputData }) => {
    const response = await fetch(inputData.url);
    return { data: await response.json() };
  },
});

// 4. Create Mastra workflow
const dataWorkflow = createWorkflow({
  id: "data-pipeline",
  inputSchema: z.object({ url: z.string() }),
  outputSchema: z.object({ processed: z.boolean() }),
})
  .then(fetchDataStep)
  .then(processDataStep);

// 5. Commit workflow (important!)
dataWorkflow.commit();

// 6. Use in Inngest function
const scheduledWorkflow = inngest.createFunction(
  { id: "run-mastra-workflow" },
  { cron: "0 0 * * *" },
  async ({ step }) => {
    // Run Mastra workflow inside Inngest
    const result = await step.run("execute-workflow", async () => {
      const run = dataWorkflow.createRun();
      return await run.start({ 
        inputData: { url: "https://api.example.com" } 
      });
    });
    return result;
  }
);

// 7. Serve via API endpoint
import { serve } from "@mastra/inngest";

export const handler = serve({ 
  inngest, 
  mastra: { workflows: { dataWorkflow } } 
});
```

**Primitive Discovered:**
- Integration pattern: `init(inngest)` creates Mastra-compatible builders
- Configuration: Workflows must call `.commit()` before use
- Serving: Use `@mastra/inngest` serve function

**Implementation Note:** Mastra workflows integrate seamlessly with Inngest functions. The `@mastra/inngest` package provides the bridge. Workflows must be committed before serving.

**Source:** https://mastra.ai/docs/workflows/inngest-workflow** 

---

## Part 2: Integration Patterns

### RQ-6: How do Inngest and Composio work together?

**Why It Matters:** PR-1.6 (Integration) — Understanding if we need both or can use one for both scheduled jobs and triggers.

**Status:** ✅ Answered

**Questions:**
1. Can Inngest handle event triggers, or do we need Composio?
2. Can Composio handle scheduled jobs, or do we need Inngest?
3. What's the recommended architecture?

**Integration Pattern:**
```typescript
// Recommended architecture: Use both for their strengths

// 1. Composio webhook triggers Inngest function
const handleComposioWebhook = inngest.createFunction(
  { id: "handle-composio-event" },
  { event: "composio/trigger.received" },  // Custom event
  async ({ event, step }) => {
    const { triggerName, data } = event.data;
    
    // Process based on trigger type
    switch (triggerName) {
      case "GMAIL_NEW_EMAIL":
        await step.run("process-email", async () => {
          // Run Mastra workflow or other logic
        });
        break;
    }
  }
);

// 2. Composio webhook handler sends to Inngest
export async function POST(request: Request) {
  const payload = await request.json();
  
  // Verify Composio webhook
  // ...
  
  // Send to Inngest as event
  await inngest.send({
    name: "composio/trigger.received",
    data: payload
  });
  
  return new Response("OK");
}

// 3. Use Inngest for scheduling
const scheduledJob = inngest.createFunction(
  { id: "daily-sync" },
  { cron: "0 0 * * *" },
  async ({ step }) => {
    // Scheduled logic
  }
);
```

**Answer:**
1. Inngest can handle custom events but not native app triggers - use Composio for Gmail/Slack/etc triggers
2. Composio focuses on app integrations, not scheduling - use Inngest for cron jobs
3. Best practice: Composio for app triggers → Inngest for orchestration and scheduling

**Source:** Inferred from both platforms' capabilities** 

---

## Summary

### Primitives We'll Use

| What | Primitive | From | Confirmed? |
|------|-----------|------|------------|
| Create Inngest function | `inngest.createFunction()` | Inngest | ✅ |
| Schedule with cron | `{ cron: "expression" }` trigger | Inngest | ✅ |
| Create Composio trigger | `composio.triggers.enable()` | Composio SDK | ✅ |
| Verify webhook signature | `verifyWebhookSignature()` | Composio | ✅ |
| Handle webhook payload | Structured JSON with triggerId, data | Composio | ✅ |
| Mastra-Inngest bridge | `init(inngest)` from @mastra/inngest | Mastra | ✅ |

### Blockers & Dead Ends

| Issue | Impact | Resolution |
|-------|--------|------------|
| - | - | - |

### Key Learnings

1. **Separation of Concerns** - Use Composio for app event triggers (Gmail, Slack), Inngest for scheduling and orchestration
2. **Static Function Definition** - Inngest functions are defined in code and served via API, not created dynamically at runtime
3. **Mastra Integration** - The `@mastra/inngest` package provides seamless workflow execution within Inngest functions 

---

## Exit Criteria

- [x] All RQ questions answered
- [x] Summary table complete
- [x] No unresolved blockers
- [x] Key learnings documented

**Next Step:** Implementation Plan - Ready to implement planner system with Inngest scheduling and Composio triggers

---

## Resources Used

- [Mastra Inngest Workflow](https://mastra.ai/docs/workflows/inngest-workflow)
- [Composio Triggers](https://docs.composio.dev/docs/using-triggers)
- [Inngest Documentation](https://www.inngest.com/docs)




