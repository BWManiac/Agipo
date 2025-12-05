# Feature: Workflow as Code (The Transpilation Pipeline)

**Status:** Active (Migrating to Mastra)  
**Date:** December 5, 2025  
**Owner:** Engineering  
**Dependencies:** `06-Tools-vs-Workflows`, `04-Integrations-Platform`

---

## 1. Executive Summary

This document outlines the architecture for transforming user-created visual workflows into portable, executable code. The goal is to decouple workflow logic from the client-side application, enabling workflows to be saved, versioned, and executed by AI agents or server-side processes.

### Key Evolution: Mastra Integration

With our migration to **Mastra** (see Task 9), we are evolving from a custom transpilation pipeline to one that generates **Mastra-native workflows**. This provides:

- **Standard primitives**: `createWorkflow()`, `createStep()`, control flow methods
- **Built-in features**: Parallel execution, branching, human-in-the-loop
- **AI SDK compatibility**: Workflows can be called as tools by agents
- **Observability**: Built-in tracing and debugging

---

## 2. Architecture: The Transpilation Pipeline

### 2.1 Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        VISUAL WORKFLOW BUILDER                           │
│                                                                          │
│   ┌─────┐    ┌─────┐    ┌─────────┐    ┌─────┐                          │
│   │Node │ →  │Node │ →  │Parallel │ →  │Node │                          │
│   │  A  │    │  B  │    │ C + D   │    │  E  │                          │
│   └─────┘    └─────┘    └─────────┘    └─────┘                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Transpile
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          GENERATED CODE                                   │
│                                                                          │
│   const workflow = createWorkflow({ id: "my-workflow", ... })           │
│     .then(stepA)                                                        │
│     .then(stepB)                                                        │
│     .parallel([stepC, stepD])                                           │
│     .then(stepE)                                                        │
│     .commit();                                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Execute
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        EXECUTION RUNTIME                                  │
│                                                                          │
│   Agent calls workflow → Mastra orchestrates steps → Result returned    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Input: The Visual Graph

The transpiler consumes the workflow graph from the visual builder:

```typescript
interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata: {
    id: string;
    name: string;
    description: string;
    inputSchema: z.ZodSchema;
    outputSchema: z.ZodSchema;
  };
}

interface WorkflowNode {
  id: string;
  type: "tool" | "branch" | "parallel" | "loop" | "wait";
  data: {
    // For tool nodes
    toolId?: string;
    parameters?: Record<string, any>;
    
    // For branch nodes
    condition?: string;
    branches?: { condition: string; targetNodeId: string }[];
    
    // For parallel nodes
    parallelNodeIds?: string[];
    
    // For loop nodes
    loopCondition?: string;
    
    // For wait nodes
    waitType?: "sleep" | "event" | "approval";
    waitConfig?: any;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  data?: {
    dataMapping?: Record<string, string>; // Map output → input
  };
}
```

### 2.3 Transpilation Steps

#### Step 1: Graph Analysis (Topological Sort)

The transpiler performs a topological sort to determine execution order while respecting dependencies.

```typescript
function analyzeGraph(graph: WorkflowGraph): ExecutionPlan {
  // 1. Find entry nodes (no incoming edges)
  // 2. Topological sort
  // 3. Identify parallel groups (multiple outgoing from same node)
  // 4. Identify branches (conditional edges)
  return { steps: [...], controlFlow: [...] };
}
```

#### Step 2: Code Generation

Generate Mastra-compatible workflow code:

```typescript
function generateWorkflowCode(plan: ExecutionPlan): string {
  const imports = generateImports(plan);
  const steps = generateSteps(plan);
  const workflow = generateWorkflowChain(plan);
  
  return `
${imports}

${steps}

${workflow}
  `.trim();
}
```

**Example Generated Code:**

```typescript
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { scrapeJobTool, getResumeTool, generateTailoredTool } from "./tools";

// Step definitions
const scrapeStep = createStep({
  id: "scrape-job",
  inputSchema: z.object({ url: z.string() }),
  outputSchema: z.object({ 
    title: z.string(), 
    requirements: z.array(z.string()) 
  }),
  execute: async ({ inputData, mapiClient }) => {
    return await scrapeJobTool.execute(inputData);
  },
});

const getResumeStep = createStep({
  id: "get-resume",
  inputSchema: z.object({ userId: z.string() }),
  outputSchema: z.object({ resume: z.object({...}) }),
  execute: async ({ inputData, mapiClient }) => {
    return await getResumeTool.execute(inputData);
  },
});

const generateStep = createStep({
  id: "generate-tailored",
  inputSchema: z.object({
    resume: z.object({...}),
    requirements: z.array(z.string()),
  }),
  outputSchema: z.object({ tailoredResume: z.string() }),
  execute: async ({ inputData, mapiClient }) => {
    return await generateTailoredTool.execute(inputData);
  },
});

// Workflow definition
export const tailorResumeWorkflow = createWorkflow({
  id: "tailor-resume",
  inputSchema: z.object({
    jobUrl: z.string().url(),
    userId: z.string(),
  }),
  outputSchema: z.object({
    tailoredResume: z.string(),
  }),
})
  .then(scrapeStep)
  .then(getResumeStep)
  .then(generateStep)
  .commit();
```

#### Step 3: Bundle Creation

The transpiler produces a bundle:

```
_tables/workflows/[workflowId]/
├── workflow.json      # Metadata (id, name, description, schemas)
├── workflow.ts        # Generated Mastra workflow code
├── steps/             # Individual step definitions
│   ├── scrape.ts
│   ├── get-resume.ts
│   └── generate.ts
└── package.json       # Dependencies (mastra, zod, etc.)
```

---

## 3. Control Flow Mapping

### Visual to Code Mapping

| Visual Element | Mastra Method | Description |
|----------------|---------------|-------------|
| Linear edge | `.then(step)` | Sequential execution |
| Fork (multiple targets) | `.parallel([steps])` | Parallel execution |
| Diamond (condition) | `.branch({ ... })` | Conditional branching |
| Loop arrow | `.dowhile(step, cond)` | Loop while true |
| Clock icon | `.sleep(duration)` | Time delay |
| Hand icon | `.waitForEvent()` | Human-in-the-loop |

### Example: Branch Node

**Visual:**
```
       ┌─→ [Send Email] (score > 80)
[Match]│
       └─→ [Archive]    (score ≤ 80)
```

**Generated:**
```typescript
.branch({
  condition: (ctx) => ctx.score > 80,
  branches: [
    { condition: (ctx) => ctx.score > 80, workflow: sendEmailBranch },
    { condition: (ctx) => ctx.score <= 80, workflow: archiveBranch },
  ],
})
```

### Example: Parallel Node

**Visual:**
```
           ┌─→ [Calculate Match Score]
[Get Data]─┤
           └─→ [Generate Summary]
                      ↓
               [Combine Results]
```

**Generated:**
```typescript
.then(getDataStep)
.parallel([calculateMatchStep, generateSummaryStep])
.then(combineResultsStep)
```

---

## 4. Tool Integration

### 4.1 Tool Types in Workflows

Workflows can compose three types of tools:

| Tool Type | Source | Integration |
|-----------|--------|-------------|
| **Custom** | User-created in Tool Builder | Direct import |
| **Composio** | Connected integrations | Dynamic injection |
| **Browser** | Stagehand primitives | Browserbase client |

### 4.2 Tool Node Configuration

When a tool is dragged onto the canvas:

```typescript
interface ToolNodeData {
  toolId: string;
  toolType: "custom" | "composio" | "browser";
  
  // Parameter bindings
  parameters: {
    [paramName: string]: {
      source: "static" | "input" | "previous_step";
      value: any;                    // For static
      inputPath?: string;            // For input
      stepId?: string;               // For previous_step
      outputPath?: string;           // For previous_step
    };
  };
  
  // For Composio tools
  connectionRef?: "dynamic" | string;  // Dynamic = use agent's connection
}
```

---

## 5. Execution Runtime

### 5.1 Agent Execution

Agents can execute workflows as capabilities:

```typescript
// In agent definition
const agent = new Agent({
  name: "Resume Agent",
  tools: [
    // Direct tools
    scrapeJobTool,
    calculateMatchTool,
    
    // Workflows exposed as tools
    tailorResumeWorkflow.asTool(),
  ],
});

// Agent decides to use workflow
// "I need to tailor your resume for this job"
const result = await agent.stream([
  { role: "user", content: "Tailor my resume for https://linkedin.com/job/123" }
]);
```

### 5.2 Direct Execution

Workflows can also be executed directly:

```typescript
const run = await tailorResumeWorkflow.createRunAsync({
  input: {
    jobUrl: "https://linkedin.com/job/123",
    userId: "user_abc",
  },
});

// Poll for completion
const result = await run.waitForCompletion();
```

### 5.3 Human-in-the-Loop

For workflows requiring approval:

```typescript
const reviewWorkflow = createWorkflow({ ... })
  .then(generateDraftStep)
  .waitForEvent("approval", {
    timeout: "24h",
    payload: (ctx) => ({ draft: ctx.draft }),
  })
  .then(publishStep)
  .commit();

// Frontend listens for approval requests
// User approves/rejects
// Workflow resumes
```

---

## 6. Implementation Components

### 6.1 Services

| Service | Responsibility |
|---------|----------------|
| `WorkflowTranspilerService` | Convert graph → Mastra code |
| `StepGeneratorService` | Generate individual step code |
| `DependencyAnalyzer` | Detect required imports |
| `WorkflowRegistryService` | Store/retrieve workflows |
| `WorkflowExecutionService` | Run workflows |

### 6.2 API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/workflows` | GET | List user's workflows |
| `/api/workflows` | POST | Create new workflow |
| `/api/workflows/[id]` | GET | Get workflow definition |
| `/api/workflows/[id]` | PUT | Update workflow |
| `/api/workflows/[id]/transpile` | POST | Transpile to code |
| `/api/workflows/[id]/execute` | POST | Execute workflow |
| `/api/workflows/[id]/runs` | GET | List executions |
| `/api/workflows/[id]/runs/[runId]` | GET | Get execution details |

### 6.3 Storage Structure

```
_tables/
├── workflows/
│   ├── tailor-resume/
│   │   ├── workflow.json      # Visual definition
│   │   ├── workflow.ts        # Generated code
│   │   └── metadata.json      # Id, name, description
│   └── apply-to-job/
│       └── ...
└── tools/
    ├── scrape-job/
    │   ├── tool.json          # Definition
    │   └── tool.ts            # Code
    └── ...
```

---

## 7. Migration from Legacy Transpiler

### Current State (Pre-Mastra)
- Generates `run.js` with stdin/stdout piping
- Linear execution only
- No native parallelism or branching
- Manual state management

### Target State (Mastra)
- Generates `createWorkflow()` chain
- Full control flow support
- Built-in state management
- AI SDK compatibility

### Migration Path

1. **Phase 1**: Keep existing transpiler for legacy workflows
2. **Phase 2**: Add Mastra transpiler as alternative
3. **Phase 3**: Migrate existing workflows to Mastra format
4. **Phase 4**: Deprecate legacy transpiler

---

## 8. Risks & Considerations

### 8.1 Complexity
- **Risk**: Complex visual graphs may produce unreadable code
- **Mitigation**: Limit graph depth, provide "simplify" suggestions

### 8.2 Debugging
- **Risk**: Hard to debug transpiled code
- **Mitigation**: Source maps, step-through execution in UI

### 8.3 Version Drift
- **Risk**: Visual graph and code get out of sync
- **Mitigation**: Always re-transpile, code is never manually edited

---

## 9. Success Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Transpilation success rate | > 99% | Valid graphs produce valid code |
| Execution success rate | > 95% | Workflows complete without error |
| Time to first workflow | < 10 min | New users create working workflow |
| Workflow reuse | > 50% | Workflows are called by agents |

---

## 10. References

- [Mastra Workflows Overview](https://mastra.ai/docs/workflows/overview)
- [Mastra Workflow Methods](https://mastra.ai/reference/workflows/workflow-methods/parallel)
- Internal: `06-Tools-vs-Workflows.md`, `04-Integrations-Platform.md`
- Task: `_docs/_tasks/10-platform-evolution.md`
