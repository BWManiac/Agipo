# Feature: Tools vs Workflows (The Capability Hierarchy)

**Status:** Planning  
**Date:** December 5, 2025  
**Owner:** Engineering  
**Dependencies:** `01-Workflow-as-Code`, `03-Agents-Architecture`, `04-Integrations-Platform`

---

## 1. Executive Summary

This document establishes the **architectural distinction** between Tools and Workflows in Agipo. While both represent "capabilities" that agents can execute, they differ fundamentally in scope, execution model, and composition.

Understanding this distinction is critical for:
- **Users**: Knowing when to create a Tool vs a Workflow
- **Builders**: Designing the right interfaces for each
- **Agents**: Selecting the appropriate capability for a task

### The Core Insight

> A **Tool** is an atomic unit of capability. A **Workflow** is a composition of tools with control flow.

The difference is primarily about **scope**—but workflows gain additional capabilities (parallelism, branching, human-in-the-loop) that tools cannot have.

---

## 2. Tool: The Atomic Capability

A Tool is the smallest unit of executable logic in Agipo. It represents a single, focused action.

### 2.1 Characteristics

| Property | Description |
|----------|-------------|
| **Scope** | Single-purpose, focused action |
| **Input** | One Zod schema defining expected parameters |
| **Output** | One Zod schema defining return value |
| **Execution** | Immediate (call → return) |
| **State** | Stateless (no memory between calls) |
| **Composition** | Cannot contain other tools |

### 2.2 Tool Types

| Type | Description | Example |
|------|-------------|---------|
| **Custom Code** | User-written JavaScript/TypeScript | `calculate_match_score` |
| **Composio Action** | Wrapper around connected service | `GMAIL_SEND_EMAIL` |
| **Browser Primitive** | Stagehand-powered web action | `scrape_page` |
| **HTTP Call** | External API integration | `fetch_weather_data` |
| **Internal** | Platform-provided utilities | `search_records` |

### 2.3 Tool Definition Example

```typescript
// Tool: Atomic unit of capability
const calculateMatchScoreTool = tool({
  description: "Calculate how well a resume matches job requirements",
  parameters: z.object({
    resume: z.object({
      skills: z.array(z.string()),
      experience: z.array(z.object({
        title: z.string(),
        years: z.number(),
      })),
    }),
    requirements: z.array(z.string()),
  }),
  execute: async ({ resume, requirements }) => {
    // Single, focused calculation
    const matchedSkills = resume.skills.filter(s => 
      requirements.some(r => r.toLowerCase().includes(s.toLowerCase()))
    );
    return {
      score: matchedSkills.length / requirements.length,
      matchedSkills,
      missingSkills: requirements.filter(r => !matchedSkills.includes(r)),
    };
  },
});
```

---

## 3. Workflow: The Composed Capability

A Workflow is a composition of tools (and other workflows) with explicit control flow. It represents a multi-step process.

### 3.1 Characteristics

| Property | Description |
|----------|-------------|
| **Scope** | Multi-step, orchestrated process |
| **Input** | Initial input schema (fed to first step) |
| **Output** | Final output schema (from last step) |
| **Execution** | Controlled (sequential, parallel, branching) |
| **State** | Stateful (shared across steps) |
| **Composition** | Can contain tools, other workflows |

### 3.2 Workflow Control Flow Methods

Based on [Mastra's workflow reference](https://mastra.ai/reference/workflows/workflow-methods/parallel):

| Method | Purpose | Example |
|--------|---------|---------|
| `.then(step)` | Sequential execution | `step1` → `step2` → `step3` |
| `.parallel([steps])` | Parallel execution | `step1` & `step2` run simultaneously |
| `.branch({ condition, branches })` | Conditional branching | If X then `stepA` else `stepB` |
| `.dowhile(step, condition)` | Loop while condition true | Retry until success |
| `.dountil(step, condition)` | Loop until condition true | Keep trying |
| `.foreach(step)` | Iterate over array | Process each item |
| `.map(step)` | Transform array items | Map input to output |
| `.sleep(duration)` | Time delay | Wait 5 seconds |
| `.sleepUntil(timestamp)` | Wait until time | Wait until 9 AM |
| `.waitForEvent(event)` | Human-in-the-loop | Pause for approval |
| `.sendEvent(event)` | Emit event | Notify external system |

### 3.3 Workflow Definition Example

```typescript
// Workflow: Composition of tools with control flow
const tailorResumeWorkflow = createWorkflow({
  id: "tailor-resume",
  inputSchema: z.object({
    jobUrl: z.string().url(),
    userId: z.string(),
  }),
  outputSchema: z.object({
    tailoredResume: z.string(),
    matchScore: z.number(),
  }),
})
  // Step 1: Scrape job listing (browser tool)
  .then(createStep({
    id: "scrape-job",
    inputSchema: z.object({ jobUrl: z.string() }),
    outputSchema: z.object({
      title: z.string(),
      company: z.string(),
      requirements: z.array(z.string()),
    }),
    execute: async ({ inputData }) => {
      // Use browser tool to scrape
    },
  }))
  // Step 2: Get user's resume (records tool)
  .then(createStep({
    id: "get-resume",
    inputSchema: z.object({ userId: z.string() }),
    outputSchema: z.object({ resume: z.object({...}) }),
    execute: async ({ inputData }) => {
      // Query records domain
    },
  }))
  // Step 3: Calculate match + Generate tailored version (parallel)
  .parallel([
    createStep({ id: "calculate-match", ... }),
    createStep({ id: "generate-tailored", ... }),
  ])
  .commit();
```

---

## 4. The Hierarchy Visualized

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              AGENT                                       │
│                                                                         │
│   "I need to tailor a resume for this job posting"                      │
│                              │                                          │
│                              ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                      WORKFLOW                                    │   │
│   │   tailor_resume_workflow                                        │   │
│   │                                                                 │   │
│   │   ┌─────────┐   ┌─────────────┐   ┌─────────────────────────┐   │   │
│   │   │  TOOL   │ → │    TOOL     │ → │       PARALLEL          │   │   │
│   │   │ scrape  │   │ get_resume  │   │  ┌─────┐    ┌─────┐    │   │   │
│   │   │  _job   │   │             │   │  │match│    │ gen │    │   │   │
│   │   └─────────┘   └─────────────┘   │  │score│    │resume│   │   │   │
│   │                                    │  └─────┘    └─────┘    │   │   │
│   │                                    └─────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Recursive Composition

Workflows can contain other workflows, creating a hierarchy:

```
Workflow: complete_job_application
├── Workflow: tailor_resume
│   ├── Tool: scrape_job
│   ├── Tool: get_resume
│   └── Tool: generate_tailored_resume
├── Tool: upload_resume (Composio)
├── Workflow: fill_application_form
│   ├── Tool: navigate_to_form
│   ├── Tool: fill_fields
│   └── Tool: submit_form
└── Tool: send_confirmation_email (Composio)
```

---

## 5. When to Use What

### Use a Tool When:
- ✅ Single, focused action
- ✅ No dependencies on other actions
- ✅ Immediate execution needed
- ✅ Wrapping an external API
- ✅ Simple input → output transformation

### Use a Workflow When:
- ✅ Multiple steps with dependencies
- ✅ Need parallel execution
- ✅ Need conditional branching
- ✅ Need human-in-the-loop approval
- ✅ Need state shared across steps
- ✅ Need retry/loop logic
- ✅ Orchestrating multiple tools

### Decision Flow

```
Is it a single action?
  ├── Yes → Create a TOOL
  └── No → Does it need control flow?
              ├── Yes → Create a WORKFLOW
              └── No → Could chain tools manually?
                          ├── Yes → Create a TOOL (let agent chain)
                          └── No → Create a WORKFLOW
```

---

## 6. Two Builders Philosophy

Agipo provides two distinct builders, each optimized for its domain:

### 6.1 Tool Builder

**Purpose:** Create atomic capabilities

**User Experience:**
1. Define name and description
2. Define input schema (Zod)
3. Write execute logic (code)
4. Define output schema (Zod)
5. Test with sample inputs
6. Save to tool registry

**Features:**
- Code editor with TypeScript support
- Schema builder (visual or code)
- Test runner with sample data
- Composio tool browser (select existing)
- Browser primitive templates

### 6.2 Workflow Builder

**Purpose:** Compose tools into processes

**User Experience:**
1. Drag tools from palette onto canvas
2. Connect tools with edges (data flow)
3. Configure control flow (parallel, branch, loop)
4. Add human-in-the-loop checkpoints
5. Test with sample inputs
6. Save to workflow registry

**Features:**
- Visual canvas (React Flow)
- Tool palette (custom + Composio)
- Control flow nodes (branch, parallel, loop)
- Data mapping editor
- Workflow testing/debugging
- Workflow-as-tool export

---

## 7. Agent Integration

From an agent's perspective, both tools and workflows are "callable capabilities":

```typescript
// Agent can call tools directly
const result = await agent.callTool("scrape_job", { url: "..." });

// Agent can call workflows (which internally orchestrate tools)
const result = await agent.callWorkflow("tailor_resume", { jobUrl: "...", userId: "..." });
```

### Capability Assignment

```typescript
const resumeAgent: AgentConfig = {
  // ...
  capabilities: {
    // Atomic tools
    toolIds: [
      "scrape_job",           // Browser tool
      "calculate_match",       // Custom tool
      "GMAIL_SEND_EMAIL",     // Composio tool
    ],
    // Composed workflows
    workflowIds: [
      "tailor_resume",        // Multi-step workflow
      "apply_to_job",         // Complex orchestration
    ],
  },
};
```

---

## 8. Implementation Considerations

### 8.1 Mastra Alignment

Our architecture aligns with [Mastra's workflow system](https://mastra.ai/docs/workflows/overview):

| Mastra Concept | Agipo Equivalent |
|----------------|------------------|
| `createStep()` | Tool definition |
| `createWorkflow()` | Workflow definition |
| `.then()`, `.parallel()`, etc. | Visual workflow builder |
| `workflow.createRunAsync()` | Workflow execution |

### 8.2 Transpilation Strategy

**For Tools:**
- Generate standalone `tool()` definition
- AI SDK compatible
- Can be imported directly by agents

**For Workflows:**
- Generate `createWorkflow()` chain
- Steps reference tool IDs
- Can be called as a tool OR run standalone

### 8.3 Storage

```
_tables/
  tools/
    [toolId]/
      tool.json       # Tool definition (schema, description)
      run.js          # Generated executable
  workflows/
    [workflowId]/
      workflow.json   # Workflow definition (steps, edges)
      run.js          # Generated orchestrator
```

---

## 9. Success Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| Tool creation time | < 5 min | Simple tools should be fast to create |
| Workflow creation time | < 15 min | Complex orchestrations take time |
| Tool reuse rate | > 60% | Tools should be composable |
| Workflow reliability | > 95% | Orchestrations should be stable |

---

## 10. Future Considerations

1. **Tool Versioning**: Allow multiple versions of a tool, workflows pin to specific versions
2. **Workflow Templates**: Pre-built workflows for common patterns (e.g., "Web Scrape → Process → Store")
3. **Tool Marketplace**: Share tools across users/organizations
4. **Visual Debugging**: Step-through workflow execution with state inspection
5. **AI-Assisted Building**: "Describe what you want" → generates tool/workflow

---

## 11. References

- [Mastra Workflows Overview](https://mastra.ai/docs/workflows/overview)
- [Mastra Workflow Methods](https://mastra.ai/reference/workflows/workflow-methods/parallel)
- [Vercel AI SDK Tools](https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling)
- Internal: `01-Workflow-as-Code.md`, `03-Agents-Architecture.md`

