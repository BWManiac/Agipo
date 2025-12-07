# Mastra Workflow Primitives

**Purpose:** Quick reference for mapping visual workflow editor concepts to Mastra code.

**Last Updated:** December 6, 2025
**Verified Against:** `@mastra/core@0.24.x`, `@composio/core@0.x`

---

## Visual Editor → Mastra Mapping

| Visual Editor Concept | Mastra Primitive | Generated Code |
|----------------------|------------------|----------------|
| A node on the canvas | **Step** | `createStep({ id, inputSchema, outputSchema, execute })` |
| A line between nodes | **Data mapping** | `.map()` with field mappings |
| The whole workflow | **Workflow** | `createWorkflow({ id, inputSchema, outputSchema })` |
| Sequential connection (A → B) | **Then** | `.then(stepA).then(stepB)` |
| Fork into parallel branches | **Parallel** | `.parallel([stepA, stepB, stepC])` |
| If/else branch | **Branch** | `.branch([[condition, step], ...])` |
| Loop until condition | **DoUntil** | `.dountil(step, condition)` |
| Loop while condition | **DoWhile** | `.dowhile(step, condition)` |
| Iterate over array | **ForEach** | `.foreach(step, { concurrency: N })` |
| Pause for duration | **Sleep** | `.sleep(milliseconds)` |
| Pause until date | **SleepUntil** | `.sleepUntil(date)` |
| Wait for external event | **WaitForEvent** | `.waitForEvent(eventName, step)` |
| Finalize for execution | **Commit** | `.commit()` |

---

## Core Primitives

### 1. Creating a Step (Node)

Every node in the visual editor becomes a `createStep()`:

```typescript
import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';

const fetchJobStep = createStep({
  // Unique identifier - becomes the node ID
  id: 'fetch-job',
  
  // Input schema - what this node accepts (Zod)
  inputSchema: z.object({
    jobUrl: z.string().url(),
    includeDetails: z.boolean().optional(),
  }),
  
  // Output schema - what this node returns (Zod)
  outputSchema: z.object({
    title: z.string(),
    company: z.string(),
    requirements: z.array(z.string()),
    salary: z.object({
      min: z.number(),
      max: z.number(),
    }).optional(),
  }),
  
  // Business logic - what actually runs
  execute: async ({ inputData, getStepResult, getInitData, runtimeContext }) => {
    // inputData = validated input matching inputSchema
    const jobData = await scrapeJobListing(inputData.jobUrl);
    
    // Must return object matching outputSchema
    return {
      title: jobData.title,
      company: jobData.company,
      requirements: jobData.requirements,
      salary: jobData.salary,
    };
  },
});
```

**Key `execute` parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `inputData` | `z.infer<inputSchema>` | Validated input data from previous step |
| `getStepResult(id)` | `(stepId: string) => any` | Access any previous step's output by ID |
| `getInitData()` | `() => any` | Access original workflow input |
| `runtimeContext` | `RuntimeContext` | Runtime values (use `.get(key)` to read) |
| `state` | `z.infer<stateSchema>` | Shared workflow state |
| `setState(state)` | `(state) => void` | Update shared workflow state |
| `runId` | `string` | Unique ID for this workflow run |
| `workflowId` | `string` | The workflow's ID |
| `resourceId` | `string?` | Optional resource ID (e.g., userId) |
| `mastra` | `Mastra` | Access to Mastra instance |
| `suspend` | `(payload, opts?) => never` | Pause workflow for human approval |
| `bail` | `(result) => never` | Exit workflow early with success |
| `abort` | `() => never` | Abort workflow execution |
| `abortSignal` | `AbortSignal` | Signal for abort handling |
| `resumeData` | `any?` | Data provided when resuming from suspend |
| `runCount` | `number` | How many times this step has executed |
| `tracingContext` | `TracingContext` | For observability/tracing |
| `writer` | `ToolStream` | For streaming output during execution |

---

### 2. Creating a Workflow

The workflow wraps all steps and defines the overall input/output:

```typescript
import { createWorkflow } from '@mastra/core/workflows';

const resumeGeneratorWorkflow = createWorkflow({
  id: 'resume-generator',
  
  // What the workflow accepts (must match first step's input)
  inputSchema: z.object({
    jobUrl: z.string().url(),
    userId: z.string(),
  }),
  
  // What the workflow returns (must match last step's output)
  outputSchema: z.object({
    resumeId: z.string(),
    downloadUrl: z.string(),
  }),
})
  .then(fetchJobStep)
  .then(analyzeRequirementsStep)
  .then(generateResumeStep)
  .commit();  // REQUIRED - finalizes the workflow
```

---

### 3. Chaining Steps (Sequential Flow)

The `.then()` method chains steps sequentially:

```typescript
workflow
  .then(stepA)   // Runs first, output → stepB input
  .then(stepB)   // Runs second, output → stepC input  
  .then(stepC)   // Runs third
  .commit();
```

**Rule:** Each step's `outputSchema` must match the next step's `inputSchema`.

---

### 4. Data Mapping Between Steps

When schemas don't match exactly, use `.map()`:

**Option A: Function-based mapping (full control)**
```typescript
workflow
  .then(stepA)  // Returns: { title: string, company: string }
  .map(({ inputData, getStepResult, getInitData }) => {
    // Rename fields for next step
    return {
      jobTitle: inputData.title,      // title → jobTitle
      companyName: inputData.company, // company → companyName
    };
  })
  .then(stepB)  // Expects: { jobTitle: string, companyName: string }
  .commit();
```

**Option B: Declarative mapping (config object)**
```typescript
workflow
  .then(stepA)
  .map({
    // Reference previous step output
    jobTitle: { step: stepA, path: 'title' },
    companyName: { step: stepA, path: 'company' },
    
    // Reference original workflow input
    userId: { initData: workflow, path: 'userId' },
    
    // Static value
    source: { value: 'automated', schema: z.string() },
    
    // Runtime context value
    connectionId: { runtimeContextPath: 'composio.connectionId', schema: z.string() },
  })
  .then(stepB)
  .commit();
```

**Declarative mapping options:**

| Config Type | Syntax | Use Case |
|-------------|--------|----------|
| Previous step | `{ step: stepA, path: 'field.nested' }` | Map from any completed step |
| Workflow input | `{ initData: workflow, path: 'field' }` | Map from original input |
| Static value | `{ value: 'constant', schema: z.string() }` | Hardcoded values |
| Runtime context | `{ runtimeContextPath: 'key', schema: z.string() }` | Dynamic runtime values |

**Access non-sequential step outputs:**

```typescript
workflow
  .then(stepA)  // id: 'step-a', returns { company: "Acme" }
  .then(stepB)  // id: 'step-b', returns { formatted: "..." }
  .map(({ getStepResult }) => {
    // Access ANY previous step's output
    const stepAOutput = getStepResult('step-a');
    const stepBOutput = getStepResult('step-b');
    
    return {
      company: stepAOutput.company,     // From step A
      formatted: stepBOutput.formatted, // From step B
    };
  })
  .then(stepC)
  .commit();
```

**Also available in function mappings:**
- `getInitData()` - original workflow input
- `runtimeContext` - runtime values
- `state` - workflow state

---

### 5. Parallel Execution

Run multiple steps simultaneously with `.parallel()`:

```typescript
workflow
  .parallel([
    fetchLinkedInStep,    // id: 'fetch-linkedin'
    fetchGithubStep,      // id: 'fetch-github'
    fetchPortfolioStep,   // id: 'fetch-portfolio'
  ])
  // Next step receives merged outputs keyed by step ID
  .then(mergeProfilesStep)
  .commit();

// mergeProfilesStep.inputSchema must handle:
z.object({
  'fetch-linkedin': z.object({ ... }),
  'fetch-github': z.object({ ... }),
  'fetch-portfolio': z.object({ ... }),
})
```

---

### 6. Conditional Branching

Use `.branch()` for if/else logic. **Note:** Uses tuple syntax `[condition, step]`:

```typescript
workflow
  .then(analyzeStep)
  .branch([
    // First true condition wins - tuple syntax: [conditionFn, step]
    [
      async ({ inputData }) => inputData.experienceYears > 5,
      seniorResumeStep,
    ],
    [
      async ({ inputData }) => inputData.experienceYears > 2,
      midLevelResumeStep,
    ],
    [
      // Default fallback - always true
      async () => true,
      juniorResumeStep,
    ],
  ])
  .then(finalizeStep)
  .commit();
```

**Condition function receives same params as `execute`:**
- `inputData` - output from previous step
- `getStepResult(id)` - access any previous step
- `getInitData()` - access original workflow input
- `runtimeContext` - runtime values
- etc.

**AI-driven branching example:**

```typescript
.branch([
  [
    async ({ inputData }) => {
      // Call LLM to decide which path
      const decision = await llm.generate({
        prompt: `Should this job posting be classified as technical? ${inputData.description}`,
      });
      return decision.includes('yes');
    },
    technicalResumeStep,
  ],
  [
    async () => true,
    generalResumeStep,
  ],
])
```

---

### 7. Loop Constructs

**DoUntil - Repeat until condition is true:**
```typescript
.dountil(
  retryStep,
  async ({ inputData }) => inputData.status === 'success'
)
```

**DoWhile - Repeat while condition is true:**
```typescript
.dowhile(
  pollStep,
  async ({ inputData }) => inputData.status === 'pending'
)
```

**Loop condition function also receives `iterationCount`:**
```typescript
.dowhile(
  retryStep,
  async ({ inputData, iterationCount }) => {
    // Stop after 5 attempts or on success
    return inputData.status === 'pending' && iterationCount < 5;
  }
)
```

**ForEach - Iterate over array:**
```typescript
// Previous step must return an array
.then(fetchItemsStep)  // Returns: z.array(z.object({ id: z.string() }))
.foreach(processItemStep, {
  concurrency: 3,  // Process 3 items at a time
})
// Output is array of processItemStep outputs
```

---

### 8. Sleep & Wait Primitives

**Sleep - Pause for duration:**
```typescript
workflow
  .then(sendEmailStep)
  .sleep(5000)  // Wait 5 seconds
  .then(checkDeliveryStep)
  .commit();

// Dynamic duration based on previous output:
workflow
  .then(analyzeStep)
  .sleep(async ({ inputData }) => inputData.retryDelay * 1000)
  .then(retryStep)
  .commit();
```

**SleepUntil - Pause until specific date:**
```typescript
workflow
  .then(scheduleStep)
  .sleepUntil(new Date('2025-01-01T00:00:00Z'))
  .then(newYearStep)
  .commit();

// Dynamic date based on previous output:
workflow
  .then(calculateStep)
  .sleepUntil(async ({ inputData }) => new Date(inputData.scheduledTime))
  .then(executeStep)
  .commit();
```

**WaitForEvent - Wait for external event:**
```typescript
workflow
  .then(requestApprovalStep)
  .waitForEvent('approval-received', handleApprovalStep, {
    timeout: 86400000,  // 24 hour timeout (optional)
  })
  .then(processApprovalStep)
  .commit();

// Later, trigger the event:
await run.sendEvent('approval-received', { approved: true, approver: 'user123' });
```

---

### 9. Error Handling & Retries

**Workflow-level retry config:**
```typescript
const workflow = createWorkflow({
  id: 'my-workflow',
  inputSchema,
  outputSchema,
  retryConfig: {
    attempts: 3,  // Number of retry attempts
    delay: 1000,  // Delay between retries in ms
  },
});
```

**Step-level retry (overrides workflow-level):**
```typescript
const riskyStep = createStep({
  id: 'risky-api-call',
  inputSchema,
  outputSchema,
  retries: 5,  // Simple number of retries
  execute: async ({ inputData }) => { ... },
});
```

**Early exit with success (bail):**
```typescript
execute: async ({ inputData, bail }) => {
  if (inputData.alreadyProcessed) {
    return bail({ status: 'skipped', reason: 'Already done' });
  }
  // Continue processing...
}
```

**Throwing errors:**
```typescript
execute: async ({ inputData }) => {
  if (!inputData.isValid) {
    throw new Error('Validation failed');
  }
}
```

---

### 10. Executing a Workflow

**Option A: Start (wait for completion)**
```typescript
const run = await workflow.createRunAsync();
const result = await run.start({
  inputData: {
    jobUrl: 'https://example.com/job/123',
    userId: 'user-456',
  },
});

// Result structure:
{
  status: 'success' | 'failed' | 'running' | 'suspended',
  result: { /* final output matching outputSchema */ },
  steps: {
    'step-a': { status: 'success', output: { ... } },
    'step-b': { status: 'success', output: { ... } },
  }
}
```

**Option B: Stream (real-time step events)**
```typescript
const run = await workflow.createRunAsync();

for await (const event of run.stream({
  inputData: { jobUrl: '...', userId: '...' },
})) {
  console.log(event);
  // event.type: 'step-start' | 'step-complete' | 'step-error' | ...
  // event.stepId: which step
  // event.data: step output or error
}
```

**Option C: Watch (event listener pattern)**
```typescript
const run = await workflow.createRunAsync();

run.watch((event) => {
  if (event.type === 'step-complete') {
    console.log(`Step ${event.stepId} completed:`, event.data);
  }
  if (event.type === 'error') {
    console.error(`Step ${event.stepId} failed:`, event.error);
  }
});

await run.start({ inputData: { ... } });
```

---

### 11. Suspend & Resume (Human-in-the-Loop)

```typescript
const approvalStep = createStep({
  id: 'approval',
  inputSchema: z.object({ amount: z.number() }),
  outputSchema: z.object({ approved: z.boolean() }),
  execute: async ({ inputData, suspend }) => {
    if (inputData.amount > 10000) {
      // Pause workflow, wait for human
      return suspend({ 
        reason: 'Amount exceeds threshold',
        amount: inputData.amount,
      });
    }
    return { approved: true };
  },
});

// Later, resume with human's decision:
await run.resume({
  resumeData: { approved: true },
});
```

---

## Complete Example: Resume Generator Workflow

```typescript
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

// Step 1: Fetch job details
const fetchJobStep = createStep({
  id: 'fetch-job',
  inputSchema: z.object({
    jobUrl: z.string().url(),
  }),
  outputSchema: z.object({
    title: z.string(),
    company: z.string(),
    requirements: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const job = await scrapeJob(inputData.jobUrl);
    return { title: job.title, company: job.company, requirements: job.requirements };
  },
});

// Step 2: Analyze requirements with AI
const analyzeStep = createStep({
  id: 'analyze',
  inputSchema: z.object({
    requirements: z.array(z.string()),
  }),
  outputSchema: z.object({
    skills: z.array(z.string()),
    yearsNeeded: z.number(),
  }),
  execute: async ({ inputData }) => {
    const analysis = await llm.analyze(inputData.requirements);
    return { skills: analysis.skills, yearsNeeded: analysis.yearsNeeded };
  },
});

// Step 3: Generate tailored resume
const generateResumeStep = createStep({
  id: 'generate-resume',
  inputSchema: z.object({
    skills: z.array(z.string()),
    jobTitle: z.string(),
    company: z.string(),
  }),
  outputSchema: z.object({
    resumeId: z.string(),
    downloadUrl: z.string(),
  }),
  execute: async ({ inputData }) => {
    const resume = await generateResume(inputData);
    return { resumeId: resume.id, downloadUrl: resume.url };
  },
});

// Compose the workflow
export const resumeWorkflow = createWorkflow({
  id: 'resume-generator',
  inputSchema: z.object({
    jobUrl: z.string().url(),
    userId: z.string(),
  }),
  outputSchema: z.object({
    resumeId: z.string(),
    downloadUrl: z.string(),
  }),
})
  .then(fetchJobStep)
  .map(({ inputData }) => ({
    requirements: inputData.requirements,
  }))
  .then(analyzeStep)
  .map(({ inputData, getStepResult }) => ({
    skills: inputData.skills,
    jobTitle: getStepResult('fetch-job').title,
    company: getStepResult('fetch-job').company,
  }))
  .then(generateResumeStep)
  .commit();
```

---

## Utility Functions

### cloneStep - Reuse a step with new ID
```typescript
import { cloneStep } from '@mastra/core/workflows';

const originalStep = createStep({ id: 'fetch-data', ... });

// Clone for reuse with different ID
const fetchStep1 = cloneStep(originalStep, { id: 'fetch-data-1' });
const fetchStep2 = cloneStep(originalStep, { id: 'fetch-data-2' });

workflow
  .parallel([fetchStep1, fetchStep2])
  .commit();
```

### cloneWorkflow - Reuse a workflow with new ID
```typescript
import { cloneWorkflow } from '@mastra/core/workflows';

const baseWorkflow = createWorkflow({ id: 'base', ... });

// Clone for different use case
const variantWorkflow = cloneWorkflow(baseWorkflow, { id: 'variant' });
```

### Run Management

**Cancel a running workflow:**
```typescript
const run = await workflow.createRunAsync();
const resultPromise = run.start({ inputData: { ... } });

// Later, cancel if needed
await run.cancel();
```

**Send event to waiting workflow:**
```typescript
// Workflow is waiting at .waitForEvent('user-action', ...)
await run.sendEvent('user-action', { action: 'approve', userId: '123' });
```

**Get workflow state:**
```typescript
const state = run.getState();
console.log('Current state:', state);
```

---

## Composio Tool Integration

Wrap Composio tools as Mastra steps:

```typescript
import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';

// Helper to create a Composio-backed step
function createComposioStep(
  toolSlug: string,
  inputSchema: z.ZodObject<any>,
  outputSchema: z.ZodObject<any>
) {
  return createStep({
    id: `composio-${toolSlug.toLowerCase()}`,
    inputSchema,
    outputSchema,
    execute: async ({ inputData, runtimeContext }) => {
      const client = getComposioClient();
      const connectionId = runtimeContext.get('connectionId');
      
      const result = await client.tools.execute(toolSlug, {
        arguments: inputData,
        connectedAccountId: connectionId,
      });
      
      return result.data;
    },
  });
}

// Usage
const sendEmailStep = createComposioStep(
  'GMAIL_SEND_EMAIL',
  z.object({
    recipient: z.string().email(),
    subject: z.string(),
    body: z.string(),
  }),
  z.object({
    messageId: z.string(),
    threadId: z.string(),
  })
);
```

**Getting schemas from Composio:**
```typescript
import { Composio } from "@composio/core";

const client = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

// Get raw tool details with schemas
const tools = await client.tools.getRawComposioTools({ 
  toolkits: ['gmail'], 
  limit: 100 
});

const gmailSend = tools.find(t => t.slug === 'GMAIL_SEND_EMAIL');

// Both available (camelCase from getRawComposioTools)!
const inputSchema = gmailSend.inputParameters;   // JSON Schema
const outputSchema = gmailSend.outputParameters; // JSON Schema

// Note: Most tools have generic output: { data: object, error: string, successful: boolean }
// Some tools (like Firecrawl) have richer typed outputs

// Convert to Zod using existing helper
import { convertComposioSchemaToZod } from "@/app/api/tools/services/composio-tools";
const zodInputSchema = convertComposioSchemaToZod(inputSchema);
const zodOutputSchema = convertComposioSchemaToZod(outputSchema);
```

---

## References

- [Mastra Workflows Overview](https://mastra.ai/docs/workflows/overview)
- [Mastra Control Flow](https://mastra.ai/docs/workflows/control-flow)
- [Mastra Error Handling](https://mastra.ai/docs/workflows/error-handling)
- [Composio Mastra Integration](https://docs.composio.dev/providers/mastra)

