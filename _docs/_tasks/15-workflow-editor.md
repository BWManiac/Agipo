# Task 15: Workflow Editor (Mastra-Aligned)

**Status:** Planning  
**Date:** December 6, 2025  
**Priority:** High  
**Dependencies:** Task 9 (Mastra Migration), Task 10 (Platform Evolution)

---

## 1. Executive Summary

Create a workflow editor from scratch that aligns with Mastra and Composio.

### Goals

1. **Visual editor** that generates Mastra-native workflow code
2. **Agents use workflows** as callable capabilities
3. **Workflows are shareable** between agents (and eventually via marketplace)
4. **Connection requirements** are first-class (workflow declares what Composio integrations it needs)
5. **Configs** are first-class (user-settable values that persist across executions)
6. **Composio is central** - tools from Composio are the primary building blocks

### Approach

**Clean slate.** New `workflows/` folders in both frontend and backend, alongside existing `tools/` folders. Take inspiration from existing code, but don't inherit its complexity.

### Technology Decisions (Already Made)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Canvas library | **ReactFlow** | Already proven in current tool editor, works well |
| UI layout | **Chat left, Panels right (tabbed), Top bar** | Current layout works, don't reinvent |
| State management | **Zustand** | Consistent with existing patterns |

---

## 2. Product Requirements

### 2.1 Composio Node Discovery

**Definition:** The editor must show all available Composio tools as draggable nodes, each with its input/output schema.

**Why it matters:** Users need to see what's available and understand what each tool expects/returns.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-1.1 | List all tools from user's connected Composio integrations | P0 |
| PR-1.2 | List NO_AUTH tools (browser_tool) available to everyone | P0 |
| PR-1.3 | For each tool, display its **input schema** (what parameters it needs) | P0 |
| PR-1.4 | For each tool, display its **output schema** (what it returns) | P0 |
| PR-1.5 | Group tools by toolkit (Gmail, GitHub, etc.) | P1 |
| PR-1.6 | Search/filter tools by name | P1 |

**Technical Notes:**
- Composio exposes tool schemas via `getRawComposioTools()`
- Input schema comes from `tool.function.parameters` (JSON Schema format)
- Output schema may need investigation - Composio may not expose this explicitly

**Open Question:** Does Composio expose output schemas? If not, how do we handle this?

### 2.2 Input-Process-Output (IPO) Model

**Definition:** Every node in the workflow has three parts:
1. **Input**: What data it receives (schema)
2. **Process**: What it does (the tool execution or custom code)
3. **Output**: What data it produces (schema)

**Why it matters:** This is the mental model for the entire editor. Data flows from one node's output to another node's input.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-2.1 | Each node displays its input schema | P0 |
| PR-2.2 | Each node displays its output schema | P0 |
| PR-2.3 | Nodes connect via edges (output → input) | P0 |
| PR-2.4 | User can configure how output maps to input (data mapping) | P0 |
| PR-2.5 | Some nodes may have no output (terminal nodes like "Send Email") | P0 |

**Example:**
```
┌─────────────────┐         ┌─────────────────┐
│  Scrape Page    │         │  Send Email     │
│  ─────────────  │         │  ─────────────  │
│  IN:  url       │         │  IN:  to        │
│  OUT: content,  │ ──────▶ │       subject   │
│       title     │         │       body      │
│                 │         │  OUT: (none)    │
└─────────────────┘         └─────────────────┘
```

### 2.3 Connection Validation (Type Checking)

**Definition:** When connecting two nodes, validate that the output type matches the input type.

**Why it matters:** Prevents runtime errors. If Node A outputs an `int` and Node B expects `text`, that connection is invalid.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-3.1 | Validate type compatibility when user creates an edge | P0 |
| PR-3.2 | Show visual indicator for invalid connections (red edge, warning) | P0 |
| PR-3.3 | Allow connection but warn if types are coercible (number → string) | P1 |
| PR-3.4 | Block connection entirely if types are incompatible (object → boolean) | P1 |

**Type Compatibility Matrix (Draft):**

| Output Type | Can Connect To |
|-------------|---------------|
| string | string, any |
| number | number, string (coerce), any |
| boolean | boolean, string (coerce), any |
| array | array, any |
| object | object, any |
| any | any |

### 2.4 Connection Requirements (Composio Auth)

**Definition:** Workflows declare what Composio integrations they need to function.

**Why it matters:** When assigning workflow to agent, user must know what to connect. Workflow won't run without required connections.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-4.1 | Auto-detect required connections from tool nodes used | P0 |
| PR-4.2 | Display required connections in editor panel | P0 |
| PR-4.3 | When assigning to agent, validate user has required connections | P0 |
| PR-4.4 | Block execution if connections missing | P0 |

**How auto-detection works:**
1. User adds a Gmail tool node → workflow now requires Gmail
2. User adds a GitHub tool node → workflow now requires GitHub
3. Editor shows: "This workflow requires: Gmail, GitHub"

**Technical Notes:**
- Composio tools are associated with toolkits (e.g., `GMAIL_SEND_EMAIL` → `gmail`)
- We can extract toolkit from tool metadata
- NO_AUTH tools (browser_tool) don't require connections

### 2.5 Configs (User-Settable Values)

**Definition:** Values that the workflow author defines, and the workflow user sets when assigning to an agent.

**Why it matters:** Same workflow, different contexts. A GitHub workflow needs to know *which repo* to work with.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-5.1 | Workflow author can define configs (name, type, required, default) | P0 |
| PR-5.2 | Node parameters can reference configs: `{{configs.targetRepo}}` | P0 |
| PR-5.3 | When assigning workflow to agent, user provides config values | P0 |
| PR-5.4 | Config values stored per agent-workflow binding | P0 |
| PR-5.5 | Config types supported: text, number, boolean, select (dropdown) | P1 |

**Example:**
```
Workflow: "Update README on PR"
Configs:
  - targetRepo: string (required)
  - targetPath: string (default: "/README.md")
  - tone: select ["technical", "casual"] (default: "technical")

When assigning to Mira Patel agent:
  - targetRepo = "agipo/frontend"
  - targetPath = "/docs/API.md"
  - tone = "technical"
```

### 2.6 Control Flow Nodes

**Definition:** Nodes that control execution flow (not data transformation).

**Why it matters:** Real workflows need branching, looping, parallel execution.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-6.1 | Branch node: if/else based on condition | P1 |
| PR-6.2 | Parallel node: run multiple paths simultaneously | P1 |
| PR-6.3 | Loop node: repeat until condition met | P2 |
| PR-6.4 | Wait node: pause for human approval | P2 |

**Note:** Start simple. Phase 1 can be linear workflows only. Add control flow in later phases.

### 2.7 Custom Code Nodes

**Definition:** Nodes where user writes custom JavaScript/TypeScript code.

**Why it matters:** Not everything is a Composio tool. Users need flexibility.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-7.1 | User can add a "Code" node with custom JS/TS | P1 |
| PR-7.2 | User defines input schema for code node | P1 |
| PR-7.3 | User defines output schema for code node | P1 |
| PR-7.4 | Code editor with syntax highlighting | P1 |

### 2.8 Runtime Inputs (Agent-Provided Values)

**Definition:** Values that the agent provides when calling a workflow at execution time.

**Why it matters:** Runtime inputs are different from Configs. Configs are set once when assigning a workflow to an agent. Runtime inputs change with each execution.

| Concept | When Set | Who Sets | Persisted? | Example |
|---------|----------|----------|------------|---------|
| **Configs** | At workflow assignment | User | Yes | `targetRepo = "agipo/frontend"` |
| **Runtime Inputs** | Each execution | Agent/Caller | No | `jobUrl = "https://..."`, `prNumber = 123` |

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-8.1 | Workflow author can define runtime inputs (name, type, required, description) | P0 |
| PR-8.2 | Runtime inputs have a schema (like tool parameters) | P0 |
| PR-8.3 | Agent passes runtime input values when calling workflow | P0 |
| PR-8.4 | Node parameters can reference runtime inputs: `{{inputs.jobUrl}}` | P0 |
| PR-8.5 | Runtime inputs are validated before execution | P0 |

**Example:**
```
Workflow: "Tailor Resume for Job"
Runtime Inputs:
  - jobUrl: string (required) - "URL of the job listing to scrape"
  - emphasisKeywords: string[] (optional) - "Skills to emphasize"

Configs:
  - resumeTemplate: string (required) - "Which resume style to use"
  - targetLength: select ["1-page", "2-page"] (default: "1-page")

When agent calls this workflow:
  agent.call("Tailor Resume for Job", {
    jobUrl: "https://company.com/jobs/12345",   // Runtime input
    emphasisKeywords: ["TypeScript", "AI"]       // Runtime input
  })
  // Config values (resumeTemplate, targetLength) are already set at assignment
```

**Technical Notes:**
- Runtime inputs are the "function arguments" of a workflow
- Configs are the "environment variables" of a workflow
- Both can be referenced in node parameters, but with different syntax:
  - `{{inputs.jobUrl}}` for runtime inputs
  - `{{configs.targetRepo}}` for configs

### 2.9 Data Mapping (Output → Input Binding)

**Definition:** How the output of one node becomes the input of another.

**Why it matters:** This is the core UX challenge of visual workflow editors. Users need to specify: "take field X from Node A's output and put it into field Y of Node B's input."

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-9.1 | When creating an edge, show data mapping UI | P0 |
| PR-9.2 | Display source node's output fields (available data) | P0 |
| PR-9.3 | Display target node's input fields (required data) | P0 |
| PR-9.4 | User can map: output field → input field | P0 |
| PR-9.5 | Support nested field access: `user.contact.email` → `recipientEmail` | P1 |
| PR-9.6 | Auto-map fields with matching names (optional, can disable) | P1 |
| PR-9.7 | Show type mismatches as warnings | P0 |

**Example Scenario:**

Node A ("Scrape Job Listing") outputs:
```json
{
  "title": "Senior Engineer",
  "company": "Acme Inc",
  "requirements": ["TypeScript", "React"],
  "salary": { "min": 150000, "max": 200000 }
}
```

Node B ("Generate Resume") expects:
```json
{
  "jobTitle": "string (required)",
  "companyName": "string (required)",
  "targetSkills": "string[] (required)",
  "salaryRange": "string (optional)"
}
```

**Data Mapping UI shows:**
```
┌─────────────────────────────────────────────────────────────┐
│  Map outputs from "Scrape Job Listing" to "Generate Resume" │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  OUTPUT (available)          INPUT (required)               │
│  ─────────────────           ──────────────────             │
│  title (string)      ──────▶ jobTitle (string) ✓            │
│  company (string)    ──────▶ companyName (string) ✓         │
│  requirements (str[])──────▶ targetSkills (string[]) ✓      │
│  salary.min (number)         salaryRange (string)           │
│  salary.max (number)           └─ [Not mapped - optional]   │
│                                                             │
│  [+ Add transform: salary.min + "-" + salary.max]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Open Question:** Do we need transformations (e.g., concatenate two fields, format a date)? Or is that handled by inserting a Code node?

### 2.10 Testing Suite

**Definition:** Tools for testing workflows before publishing or assigning to agents.

**Why it matters:** Users need confidence their workflows work. A testing suite lets them validate behavior without risking production data or confusing agents.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-10.1 | "Test" button in editor runs workflow with test data | P0 |
| PR-10.2 | User can create and save named test cases | P1 |
| PR-10.3 | Each test case stores: runtime input values + config values | P1 |
| PR-10.4 | Test execution shows step-by-step results (which nodes ran, what they returned) | P0 |
| PR-10.5 | Test execution shows errors clearly (which node failed, why) | P0 |
| PR-10.6 | User can re-run a saved test case with one click | P1 |
| PR-10.7 | Test history: see past test runs and their results | P2 |

**Test Case Structure:**
```typescript
interface TestCase {
  id: string;
  name: string;                    // "Basic flow", "Edge case: empty job listing"
  description?: string;
  
  // Pre-filled values for this test
  runtimeInputs: Record<string, unknown>;  // e.g., { jobUrl: "https://..." }
  configOverrides?: Record<string, unknown>; // Optional: override configs for testing
  
  // Metadata
  createdAt: string;
  lastRunAt?: string;
  lastRunStatus?: "passed" | "failed" | "error";
}
```

**UX Flow:**

1. User clicks "Test" button
2. If no saved test cases: show form to fill in runtime inputs + configs
3. If saved test cases exist: show dropdown to select one, or "New Test"
4. User clicks "Run"
5. Editor shows execution panel:
   - Step-by-step progress (Node A ✓, Node B running..., Node C pending)
   - Intermediate outputs (what each node returned)
   - Final result or error
6. Option to "Save as Test Case" for re-use

**Example:**
```
┌─────────────────────────────────────────────────────────────┐
│  Test: "Basic flow"                              [Run] [Edit]│
├─────────────────────────────────────────────────────────────┤
│  Runtime Inputs:                                            │
│    jobUrl: "https://example.com/job/123"                    │
│    emphasisKeywords: ["TypeScript"]                         │
│                                                             │
│  Config Values:                                             │
│    targetRepo: "test-org/test-repo"                         │
│    tone: "technical"                                        │
├─────────────────────────────────────────────────────────────┤
│  Execution:                                                 │
│    ✓ Scrape Job Listing (0.8s) → returned { title: "..." }  │
│    ✓ Generate Resume (2.1s) → returned { content: "..." }   │
│    ✓ Save to Records (0.3s) → returned { recordId: "abc" }  │
│                                                             │
│  Status: PASSED (3.2s total)                                │
└─────────────────────────────────────────────────────────────┘
```

### 2.11 Error Handling

**Definition:** How the system handles and surfaces errors during workflow execution.

**Why it matters:** Workflows call external APIs (Composio tools). Things fail. Users need to understand what went wrong and how to fix it.

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-11.1 | Catch and surface tool execution errors (API failures, timeouts) | P0 |
| PR-11.2 | Show which node failed and the error message | P0 |
| PR-11.3 | Distinguish error types: auth error vs API error vs validation error | P1 |
| PR-11.4 | For auth errors: prompt user to reconnect the required integration | P1 |
| PR-11.5 | Allow retry of failed node (without re-running entire workflow) | P2 |
| PR-11.6 | Log errors for debugging (visible in test panel, agent activity) | P1 |

**Error Categories:**

| Category | Example | User Action |
|----------|---------|-------------|
| **Validation Error** | Required runtime input missing | Fix input values, re-run |
| **Auth Error** | Gmail token expired | Reconnect Gmail, re-run |
| **API Error** | Rate limit exceeded | Wait and retry |
| **Data Error** | Node output doesn't match expected schema | Fix workflow design |
| **Timeout** | External API too slow | Increase timeout or handle gracefully |

**Open Question:** How does Mastra handle step errors? Can we retry individual steps? Research needed.

---

## 3. Research Topics

**Where Learnings Go:** All research findings, code examples, and discovered primitives are documented in **`_docs/_tasks/15.1-workflow-research.md`** (created during Phase 0).

**Research Question Philosophy:**
- Research questions are **fact-based** - we're discovering what external APIs (Mastra, Composio) provide
- Each question maps to a **specific acceptance criteria** or product requirement
- The answer should include the **exact primitive/function** we need to call
- By the time we implement, we know exactly what code to write

### 3.1 Mastra Workflows

**Goal:** Understand Mastra's workflow primitives so we know what to generate.

**Research Questions:**

| # | Question | Maps To | Primitive We Need | Status |
|---|----------|---------|-------------------|--------|
| RQ-1.1 | How does `createWorkflow()` define input schema? | PR-8.x (Runtime Inputs) | `inputSchema` or similar | ❓ |
| RQ-1.2 | How does `createWorkflow()` define output schema? | PR-2.2 (IPO Model) | `outputSchema` or similar | ❓ |
| RQ-1.3 | How does `createStep()` define a single step? | PR-2.3 (Nodes) | `createStep({ ... })` signature | ❓ |
| RQ-1.4 | How does data pass from step to step? | PR-9.x (Data Mapping) | Context object or return values | ❓ |
| RQ-1.5 | What is `.then()` signature? | PR-2.3 (Sequential) | `workflow.then(step)` | ❓ |
| RQ-1.6 | What is `.parallel()` signature? | PR-6.2 (Parallel) | `workflow.parallel([steps])` | ❓ |
| RQ-1.7 | What is `.branch()` signature? | PR-6.1 (Branch) | `workflow.branch(condition, ifStep, elseStep)` | ❓ |
| RQ-1.8 | How are step errors caught and handled? | PR-11.x (Errors) | `try/catch` or `onError` handler | ❓ |
| RQ-1.9 | Can individual steps be retried? | PR-11.5 (Retry) | `step.retry()` or config option | ❓ |
| RQ-1.10 | Can step timeouts be configured? | PR-11.x (Timeout) | `timeout` option | ❓ |
| RQ-1.11 | How do we execute a workflow? | PR-10.1 (Test execution) | `workflow.execute(inputs)` | ❓ |
| RQ-1.12 | Does Mastra require code files or accept runtime definitions? | Architecture | Affects code-gen vs interpret | ❓ |

**Resources:**
- [Mastra Workflows Overview](https://mastra.ai/docs/workflows/overview)
- [Mastra Workflow Methods](https://mastra.ai/reference/workflows/workflow-methods/parallel)
- [Mastra Step Class](https://mastra.ai/reference/workflows/step-class)

**Deliverable in 15.1:**
- Code example: Creating a workflow with input schema
- Code example: Creating a step
- Code example: Chaining steps with `.then()`
- Code example: Error handling
- Summary table of all primitives with signatures

### 3.2 Composio Tool Schemas

**Goal:** Understand how to get tool input/output schemas from Composio.

**Research Questions:**

| # | Question | Maps To | Primitive We Need | Status |
|---|----------|---------|-------------------|--------|
| RQ-2.1 | How do we list all tools for a connected user? | PR-1.1 | `getTools()` or similar | ✅ `getRawComposioTools()` |
| RQ-2.2 | How do we get a tool's input schema? | PR-1.3 | `tool.function.parameters` | ✅ JSON Schema |
| RQ-2.3 | How do we get a tool's output schema? | PR-1.4 | Unknown - need to investigate | ❓ |
| RQ-2.4 | How do we get the toolkit slug (gmail, github) for a tool? | PR-4.1 | `tool.toolkit` or parse from ID | ❓ |
| RQ-2.5 | How do NO_AUTH tools work? | PR-1.2 | Same API, no connectionId | ✅ Have code |
| RQ-2.6 | How do we execute a Composio tool with a connectionId? | PR-4.4 | `executeTool(toolId, params, connectionId)` | ❓ |

**Resources:**
- Existing code: `app/api/tools/services/composio-tools.ts`
- Existing code: `app/api/connections/services/tools.ts`
- [Composio Tools Catalog](https://composio.dev/tools) (Marketing site - for browsing available tools)
- [Composio API Reference](https://docs.composio.dev/api-reference) (via docs "API Reference" tab)

**Deliverable in 15.1:**
- Code example: Fetching all tools with schemas
- Code example: Extracting toolkit from tool
- Answer: Does Composio expose output schemas? If not, workaround
- Code example: Executing a tool with connectionId

### 3.3 Composio + Mastra Integration

**Goal:** Understand how to use Composio tools inside Mastra workflows.

**Research Questions:**

| # | Question | Maps To | Primitive We Need | Status |
|---|----------|---------|-------------------|--------|
| RQ-3.1 | Can Composio tools be wrapped as Mastra steps directly? | PR-2.3 | Wrapper pattern | ❓ |
| RQ-3.2 | How do we inject connectionId into a workflow step? | PR-4.4 | Context or config injection | ❓ |
| RQ-3.3 | Does Composio have official Mastra integration? | Architecture | May simplify implementation | ❓ |
| RQ-3.4 | How does tool execution within a step return data to next step? | PR-9.x | Return value handling | ❓ |

**Resources:**
- [Composio Mastra Provider](https://docs.composio.dev/providers/mastra) ✅ (Updated Dec 2025)

**Deliverable in 15.1:**
- Code example: Wrapping Composio tool as Mastra step
- Code example: Passing connectionId through workflow
- Integration pattern diagram

### 3.4 Code Generation vs Runtime Interpretation

**Goal:** Decide if we generate Mastra code files or interpret workflow definitions at runtime.

**Options:**

| Option | Pros | Cons |
|--------|------|------|
| **Generate Code** | Inspectable, versionable, portable, works with Mastra as designed | Need to regenerate on changes |
| **Runtime Interpret** | Dynamic, no files to manage, faster iteration | Harder to debug, may not work with Mastra |

**Research Questions:**

| # | Question | Maps To | Status |
|---|----------|---------|--------|
| RQ-4.1 | Does Mastra require `.ts` files or can workflows be defined in memory? | Architecture | ❓ |
| RQ-4.2 | If code-gen, what's the minimal code structure Mastra needs? | Architecture | ❓ |
| RQ-4.3 | Can we avoid WebContainers entirely? | Architecture | ❓ |

**Deliverable in 15.1:**
- Recommendation: Code-gen or Runtime?
- Rationale based on Mastra's requirements
- If code-gen: Template for generated workflow file

---

## 4. Architecture

### 4.1 Clean Slate Approach

**Existing code (KEEP AS-IS):**
```
app/(pages)/tools/          # Frontend - existing tool editor
app/api/tools/              # Backend - existing tool APIs
```

**New code (CREATE):**
```
app/(pages)/workflows/      # NEW frontend folder
app/api/workflows/          # NEW backend folder
```

### 4.2 Planned File Structure

**Backend (app/api/workflows/):**
```
app/api/workflows/
├── create/
│   └── route.ts              # POST - create new workflow
├── list/
│   └── route.ts              # GET - list user's workflows
├── [workflowId]/
│   ├── route.ts              # GET, PATCH, DELETE
│   ├── execute/
│   │   └── route.ts          # POST - run workflow (with runtime inputs)
│   ├── test/
│   │   └── route.ts          # POST - run test execution
│   ├── tests/
│   │   └── route.ts          # GET, POST - list/create test cases
│   ├── tests/[testId]/
│   │   └── route.ts          # GET, PATCH, DELETE - manage test case
│   └── publish/
│       └── route.ts          # POST - make workflow shareable
└── services/
    ├── types.ts              # WorkflowDefinition, WorkflowTestCase types
    ├── generator.ts          # Generate Mastra code (TBD based on research)
    ├── executor.ts           # Run workflow with inputs
    ├── validator.ts          # Validate workflow structure + type compatibility
    ├── mapper.ts             # Validate data mappings between nodes
    └── requirements.ts       # Detect connection requirements
```

**Frontend (app/(pages)/workflows/):**
```
app/(pages)/workflows/
├── page.tsx                  # List view
└── editor/
    ├── page.tsx              # Main editor page
    ├── components/
    │   ├── Canvas.tsx        # ReactFlow canvas
    │   ├── ToolPalette.tsx   # Drag tools from here (grouped by toolkit)
    │   ├── InputsPanel.tsx   # Define runtime inputs
    │   ├── ConfigPanel.tsx   # Define configs
    │   ├── ConnectionsPanel.tsx  # Show required connections
    │   ├── NodeInspector.tsx # Show selected node's I/O
    │   ├── DataMappingModal.tsx  # Map output→input when creating edge
    │   ├── TestPanel.tsx     # Run tests, view results
    │   ├── TestCaseForm.tsx  # Create/edit test case
    │   ├── ExecutionResults.tsx  # Step-by-step results display
    │   └── nodes/
    │       ├── ToolNode.tsx      # Composio tool node
    │       ├── CodeNode.tsx      # Custom code node
    │       └── ControlNode.tsx   # Branch, loop, parallel
    ├── hooks/
    │   ├── useCanvas.ts
    │   ├── useInputs.ts          # Manage runtime inputs
    │   ├── useConfigs.ts
    │   ├── useComposioTools.ts   # Fetch available tools with schemas
    │   ├── useTestCases.ts       # CRUD for test cases
    │   ├── useTestExecution.ts   # Run tests, track status
    │   └── usePersistence.ts
    └── store/
        └── index.ts          # Zustand store (nodes, edges, inputs, configs)
```

**Status:** NOT CREATED. Refine based on research.

### 4.3 UI Layout (Preserved from Current Editor)

**Top Bar:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  [← Back]  Workflow: [Name]           [Test ▼] [Save] [Publish]         │
└─────────────────────────────────────────────────────────────────────────┘
```
- **Test ▼**: Dropdown with saved test cases, or "New Test"

**Main Layout:**
```
┌─────────────────┬───────────────────────────────────┬───────────────────┐
│                 │                                   │                   │
│    CHAT         │            CANVAS                 │    PANELS (Tabs)  │
│    PANEL        │         (ReactFlow)               │                   │
│                 │                                   │  [Palette][Inputs]│
│  AI Assistant   │   ┌─────┐     ┌─────┐     ┌─────┐│  [Config][Connect]│
│  to help build  │   │ A   │ ──▶ │ B   │ ──▶ │ C   ││  [Test]           │
│  workflows      │   └─────┘     └─────┘     └─────┘│                   │
│                 │                                   │  Currently:       │
│                 │                                   │  Palette Tab      │
│                 │                                   │                   │
│                 │                                   │  TOOLS            │
│                 │                                   │  ├─ Gmail (3)     │
│                 │                                   │  ├─ GitHub (5)    │
│                 │                                   │  └─ Browser (2)   │
│                 │                                   │                   │
│                 │                                   │  CONTROL          │
│                 │                                   │  ├─ Branch        │
│                 │                                   │  └─ Parallel      │
│                 │                                   │                   │
│                 │                                   │  CODE             │
│                 │                                   │  └─ Custom        │
│                 │                                   │                   │
└─────────────────┴───────────────────────────────────┴───────────────────┘
```

**Tabs in Right Panel:**
| Tab | Purpose |
|-----|---------|
| Palette | Drag tools onto canvas |
| Inputs | Define runtime inputs (PR-8) |
| Config | Define configs (PR-5) |
| Connect | View required connections (PR-4) |
| Test | Run tests, manage test cases (PR-10) |

**Test Tab View:**
```
┌───────────────────────────────────────┐
│  TEST                                 │
├───────────────────────────────────────┤
│  Saved Tests:                         │
│  ┌─────────────────────────────────┐  │
│  │ ● Basic flow           [Run][✎] │  │
│  │ ○ Edge case: empty     [Run][✎] │  │
│  │ ○ Large input          [Run][✎] │  │
│  └─────────────────────────────────┘  │
│  [+ New Test Case]                    │
├───────────────────────────────────────┤
│  Last Run: Basic flow                 │
│  ─────────────────────────────────────│
│  ✓ Scrape Page (0.8s)                 │
│    → { title: "Engineer", ... }       │
│  ✓ Generate Resume (2.1s)             │
│    → { content: "..." }               │
│  ✓ Save to Records (0.3s)             │
│    → { recordId: "abc123" }           │
│                                       │
│  Status: PASSED (3.2s)                │
└───────────────────────────────────────┘
```

### 4.4 Workflow Definition Schema (Draft)

```typescript
interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  
  // Auto-detected from tool nodes (PR-4.1)
  requiredConnections: Array<{
    toolkit: string;        // "gmail", "github"
    toolIds: string[];      // Which tools use this connection
  }>;
  
  // Runtime inputs: what agent passes each execution (PR-8.x)
  inputs: Array<{
    key: string;            // "jobUrl"
    type: "text" | "number" | "boolean" | "array" | "object";
    label: string;          // "Job Listing URL"
    description?: string;   // "The URL of the job to tailor resume for"
    required: boolean;
    default?: unknown;
  }>;
  
  // Configs: user sets once at assignment time (PR-5.x)
  configs: Array<{
    key: string;            // "targetRepo"
    type: "text" | "number" | "select" | "boolean";
    label: string;          // "Target Repository"
    description?: string;
    required: boolean;
    options?: string[];     // For select type
    default?: unknown;
  }>;
  
  // Workflow graph
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  published: boolean;
}

// Test cases stored separately in tests.json (PR-10.x)
interface WorkflowTestCase {
  id: string;
  name: string;                    // "Basic flow", "Edge case: empty listing"
  description?: string;
  
  // Pre-filled values for this test
  runtimeInputs: Record<string, unknown>;
  configOverrides?: Record<string, unknown>;
  
  // Metadata
  createdAt: string;
  lastRunAt?: string;
  lastRunStatus?: "passed" | "failed" | "error";
  lastRunDuration?: number;        // milliseconds
}

interface WorkflowNode {
  id: string;
  type: "tool" | "code" | "control";
  position: { x: number; y: number };
  data: ToolNodeData | CodeNodeData | ControlNodeData;
}

interface ToolNodeData {
  toolId: string;           // e.g., "GMAIL_SEND_EMAIL"
  toolkit: string;          // e.g., "gmail"
  name: string;             // Display name
  description?: string;
  
  // Schema from Composio (PR-1.3, PR-1.4)
  inputSchema: JSONSchema;  // What the tool expects
  outputSchema?: JSONSchema; // What the tool returns (may be undefined)
  
  // Parameter bindings - can be static, config ref, or previous output ref
  parameters: Record<string, ParameterBinding>;
}

type ParameterBinding =
  | { type: "static"; value: unknown }
  | { type: "config"; key: string }
  | { type: "previous"; nodeId: string; outputPath: string };

interface CodeNodeData {
  name: string;
  code: string;
  inputSchema: JSONSchema;   // User-defined
  outputSchema: JSONSchema;  // User-defined
}

interface ControlNodeData {
  controlType: "branch" | "parallel" | "loop" | "wait";
  // TBD based on Mastra research
}

interface WorkflowEdge {
  id: string;
  source: string;           // Source node ID
  sourceHandle?: string;    // For nodes with multiple outputs
  target: string;           // Target node ID
  targetHandle?: string;    // For nodes with multiple inputs
  
  // Data mapping: how source output maps to target input (PR-9.x)
  mappings: Array<{
    sourcePath: string;     // "user.contact.email" or "title"
    targetPath: string;     // "recipientEmail" or "jobTitle"
  }>;
  
  // Type validation result (PR-3.x)
  valid: boolean;
  validationMessage?: string;
}
```

**Status:** DRAFT. Refine based on research.

### 4.5 Persistence & Storage

**Definition:** Where and how workflow data is stored.

**Pattern:** Follow the existing `_tables/` pattern used for tools and agents.

**Current Tools Pattern (Reference):**
```
_tables/tools/
├── hohoho/
│   ├── workflow.json    # Editor state (nodes, edges, canvas position)
│   └── tool.js          # Generated executable code
└── wazzup/
    ├── workflow.json
    └── tool.js
```

**Proposed Workflows Pattern:**
```
_tables/workflows/
├── [workflowId]/
│   ├── definition.json  # WorkflowDefinition (nodes, edges, configs, etc.)
│   ├── tests.json       # Saved test cases
│   └── workflow.ts      # Generated Mastra code (if we go code-gen route)
```

**What Gets Stored:**

| File | Purpose | When Updated |
|------|---------|--------------|
| `definition.json` | Full workflow state for editor | Every save |
| `tests.json` | Saved test cases | When user creates/edits tests |
| `workflow.ts` | Executable Mastra code | On save (if code-gen) or N/A (if runtime) |

**Alternative: SQLite Storage**

We have `@mastra/libsql` installed (used for agent Memory at `_tables/agents/[agentId]/memory.db`). 

Could store workflows in SQLite instead of JSON files:
- **Pros:** Better for querying, relationships, concurrent access
- **Cons:** Less inspectable, more complex

**Recommendation:** Start with JSON files (consistent with existing pattern), migrate to SQLite if needed.

**Note on WebContainers:**

The current tool editor uses WebContainers for isolated code execution. 

**Goal:** Avoid WebContainers for workflows if possible. Mastra may provide native execution that doesn't require browser-side sandboxing.

**Research Question:** Can Mastra workflows run directly on the server without WebContainers?

---

## 5. Open Questions (Architectural Decisions)

**Open Question Philosophy:**
- Open questions are **decisions we control** - unlike research questions, these aren't facts to discover
- Each question affects our implementation architecture
- We need to decide the answer based on tradeoffs, user needs, and complexity
- Answers should be recorded in this document once decided

### 5.1 Technical Architecture Decisions

| # | Question | Options | Current Lean | Decision Made? |
|---|----------|---------|--------------|----------------|
| OQ-1 | Do we generate code or interpret at runtime? | Code-gen vs Runtime | TBD after research | ❌ |
| OQ-2 | How do we validate types between JSON Schemas? | Library (ajv) vs Custom logic | Library | ❌ |
| OQ-3 | Do we need data transforms in mappings? | Yes (inline) vs No (use Code nodes) | No (simpler) | ❌ |
| OQ-4 | How do we store workflow state during editing? | Zustand only vs Zustand + auto-save | Zustand + auto-save | ❌ |
| OQ-5 | If Composio doesn't expose output schemas, what do we do? | Infer from execution vs Manual definition vs Skip validation | TBD after research | ❌ |
| OQ-6 | How do we handle step-level errors in UI? | Inline error vs Modal vs Panel | Panel (Test tab) | ❌ |

### 5.2 Product Decisions

| # | Question | Options | Current Lean | Decision Made? |
|---|----------|---------|--------------|----------------|
| OQ-7 | Can workflows call other workflows? | Yes vs No | No (start simple, add P2) | ❌ |
| OQ-8 | Can workflows be forked/copied? | Fork (link) vs Copy (independent) | Copy (independent) | ❌ |
| OQ-9 | Can configs be changed after assignment? | Yes vs No | Yes | ✅ |
| OQ-10 | What happens if user disconnects a required connection? | Block execution vs Warn vs Disable workflow | Disable + prompt to reconnect | ❌ |
| OQ-11 | Can test cases be shared between workflows? | Yes vs No | No (per-workflow) | ❌ |
| OQ-12 | Can agents pass partial runtime inputs? | Yes (use defaults) vs No (require all) | No (require all required) | ❌ |
| OQ-13 | Where do test results get logged? | Test panel only vs Also agent activity | Test panel only (start simple) | ❌ |
| OQ-14 | Should auto-map matching field names by default? | Yes (opt-out) vs No (explicit) | Yes (opt-out) | ❌ |

### 5.3 Decision Log

*Record decisions here as they're made during implementation.*

| Date | Question | Decision | Rationale |
|------|----------|----------|-----------|
| - | - | - | - |

---

## 6. Implementation Phases

### Phase 0: Research (Current)

**Goal:** Answer all research questions, document primitives, make architectural decisions.

**Deliverables:**
- [x] **Create `_docs/_tasks/15.1-workflow-research.md`** - Central place for all research findings ✅
- [x] **URL Validation** - All documentation URLs validated (Dec 6, 2025) ✅
  - Mastra URLs: All validated and working
  - Composio URLs: Updated to reflect new documentation structure (old URLs redirect)
- [ ] Document all discovered primitives with code examples

---

#### Mastra Documentation to Read

> ✅ **URL Validation (Dec 6, 2025):** All Mastra URLs below have been validated and are working.

**Core Concepts (Start Here):**
- [ ] [Getting Started](https://mastra.ai/docs/getting-started) ✓ - Installation, basic concepts
- [ ] [Workflows Overview](https://mastra.ai/docs/workflows/overview) ✓ - Core workflow concepts

**Workflow Building:**
- [ ] [Creating Workflows](https://mastra.ai/docs/workflows/creating-workflows) ✓ - How to define workflows
- [ ] [Steps](https://mastra.ai/docs/workflows/steps) ✓ - Defining individual steps
- [ ] [Input/Output Schemas](https://mastra.ai/docs/workflows/input-output) ✓ - Schema definitions (RQ-1, RQ-2)
- [ ] [Variables & Context](https://mastra.ai/docs/workflows/variables) ✓ - Data passing between steps (RQ-3)

**Control Flow:**
- [ ] [Sequential Execution](https://mastra.ai/docs/workflows/sequential) ✓ - `.then()` chaining (RQ-4)
- [ ] [Parallel Execution](https://mastra.ai/docs/workflows/parallel) ✓ - Running steps in parallel (RQ-5)
- [ ] [Branching & Conditions](https://mastra.ai/docs/workflows/branching) ✓ - If/else logic (RQ-6)
- [ ] [Loops](https://mastra.ai/docs/workflows/loops) ✓ - Iterating over data
- [ ] [Suspend & Resume](https://mastra.ai/docs/workflows/suspend-and-resume) - Human-in-the-loop

**Execution & Errors:**
- [ ] [Running Workflows](https://mastra.ai/docs/workflows/running) - Execution methods (RQ-8)
- [ ] [Error Handling](https://mastra.ai/docs/workflows/error-handling) - Catching and handling errors (RQ-7)
- [ ] [Retries](https://mastra.ai/docs/workflows/retries) - Retry configuration
- [ ] [Timeouts](https://mastra.ai/docs/workflows/timeouts) - Timeout settings

**API Reference:**
- [ ] [Workflow Class](https://mastra.ai/reference/workflows/workflow-class) ✓ - Full API
- [ ] [Step Class](https://mastra.ai/reference/workflows/step-class) - Step API
- [ ] [createWorkflow()](https://mastra.ai/reference/workflows/create-workflow) - Factory function
- [ ] [createStep()](https://mastra.ai/reference/workflows/create-step) - Step factory
- [ ] [Workflow Methods: .then()](https://mastra.ai/reference/workflows/workflow-methods/then)
- [ ] [Workflow Methods: .parallel()](https://mastra.ai/reference/workflows/workflow-methods/parallel)
- [ ] [Workflow Methods: .branch()](https://mastra.ai/reference/workflows/workflow-methods/branch)

**Examples:**
- [ ] [Workflow Examples](https://mastra.ai/examples/workflows) - Real-world examples
- [ ] [Mastra GitHub Examples](https://github.com/mastra-ai/mastra/tree/main/examples) - Code samples

**Critical Questions from Mastra Docs:**
- [ ] RQ-1: How does workflow define input schema?
- [ ] RQ-2: How does step define input/output?
- [ ] RQ-3: How does data pass between steps?
- [ ] RQ-4: `.then()` signature and usage
- [ ] RQ-5: `.parallel()` signature and output merging
- [ ] RQ-6: `.branch()` or conditional syntax
- [ ] RQ-7: Error handling patterns
- [ ] RQ-8: Workflow execution method
- [ ] RQ-9: Code files vs runtime definition

---

#### Composio Documentation to Read

> ⚠️ **URL Validation Note (Dec 6, 2025):** Composio's documentation structure has changed. Many old `/framework/*`, `/tools`, and `/introduction/*` URLs now redirect to `/docs/welcome`. The URLs below have been updated to reflect the new structure.

**Getting Started (New Structure):**
- [ ] [Welcome / Docs](https://docs.composio.dev/docs/welcome) - Main entry point
- [ ] [Quickstart](https://docs.composio.dev/docs/quickstart) - First agent setup

**Provider Integrations (Critical):**
- [ ] [Mastra Provider](https://docs.composio.dev/providers/mastra) - **Critical** (RQ-12) ✅ VALIDATED
- [ ] [Vercel AI SDK Provider](https://docs.composio.dev/providers/vercel-ai) - Reference for patterns

**Toolkits & Actions:**
- [ ] [Composio Tools Catalog](https://composio.dev/tools) - Available tools (Marketing site)
- [ ] Browse via docs sidebar → "Toolkit" tab for individual toolkit docs

**API Reference:**
- [ ] [API Reference](https://docs.composio.dev/api-reference) - Full API docs (via "API Reference" tab)

**Auth & Connections:**
- [ ] Explore via docs sidebar → Authentication section

**Note:** For detailed SDK methods like `getTools()`, `executeAction()`, and connection management, explore the docs interactively as the URL structure has changed. Use the search function at docs.composio.dev.

**Critical Questions from Composio Docs:**
- [ ] RQ-10: Does Composio expose output schemas? Where?
- [ ] RQ-11: How to get toolkit slug from tool ID?
- [ ] RQ-12: Official Mastra integration pattern

---

#### Existing Codebase Review

**Our Composio Integration:**
- [ ] `app/api/tools/services/composio-tools.ts` - Current tool fetching
- [ ] `app/api/connections/services/tools.ts` - Connection tool handling
- [ ] `app/api/tools/services/runtime.ts` - Tool execution wrapper
- [ ] `_tables/types.ts` - ConnectionToolBinding type

**Our Mastra Integration:**
- [ ] `app/api/workforce/[agentId]/chat/route.ts` - Agent using Mastra
- [ ] `app/api/workforce/[agentId]/chat/services/memory.ts` - Mastra Memory usage

---

#### Architectural Decisions to Make

After research, decide:
- [ ] OQ-1: Code-gen vs Runtime interpretation
- [ ] OQ-2: Type validation approach (ajv vs custom)
- [ ] OQ-3: Data transforms (inline vs Code nodes)
- [ ] OQ-5: Output schema handling if Composio doesn't expose
- [ ] WebContainers: Needed or not?

Update Section 5.3 Decision Log with all decisions.

---

#### Exit Criteria

- [ ] All RQ questions answered in 15.1
- [ ] All critical OQ decisions made
- [ ] Primitives table in 15.1 complete
- [ ] No unresolved blockers

---

### Phase 1: UXD Mockups

**Goal:** Create high-fidelity HTML mockups before writing any code.

**Location:** `_docs/UXD/Pages/workflow/`

**Deliverables:**

1. **`index.html`** - Parent file that links to all variations, easy to open in browser
   - Links to each variation with brief description
   - Summary of which requirements each variation addresses

2. **`variation-1/index.html`** - Close to Prescribed Design
   - Follows the layout from Section 4.3 exactly (Chat left, Canvas center, Panels right)
   - All tabs: Palette, Inputs, Config, Connect, Test
   - Shows: Node with I/O schema, Data mapping modal, Test results panel
   - **Closest to what we've documented**

3. **`variation-2/index.html`** - Alternative Layout
   - Different panel arrangement (e.g., panels at bottom, or floating)
   - Still meets all PR requirements
   - May emphasize canvas more

4. **`variation-3/index.html`** - Simplified Version
   - Minimal UI, progressive disclosure
   - Hides complexity until needed
   - Still meets all PR requirements

**Each variation must show:**
- [ ] Tool Palette (grouped by toolkit)
- [ ] Node on canvas with I/O schema visible
- [ ] Edge between nodes
- [ ] Data mapping UI (output → input)
- [ ] Inputs Panel (define runtime inputs)
- [ ] Config Panel (define configs)
- [ ] Connections Panel (required integrations)
- [ ] Test Panel (saved tests, execution results)
- [ ] Error state (failed node)

**Exit Criteria:**
- All three variations complete
- Each variation meets all P0 requirements visually
- Parent index.html links to all variations
- Review with stakeholder to pick preferred direction

---

### Phase 2: Foundation

- [ ] Create `app/api/workflows/` folder structure
- [ ] Create `app/(pages)/workflows/` folder structure  
- [ ] Create `_tables/workflows/` storage pattern
- [ ] Define `WorkflowDefinition` TypeScript type (including inputs, configs)
- [ ] Define `WorkflowTestCase` TypeScript type
- [ ] Basic CRUD endpoints (create, list, read, update, delete)
- [ ] Stub out editor page with ReactFlow canvas
- [ ] Implement chosen UXD variation as base layout

---

### Phase 3: Tool Palette & Nodes

- [ ] Fetch available Composio tools with schemas
- [ ] Implement Tool Palette component (grouped by toolkit)
- [ ] Implement ToolNode component (displays I/O schemas)
- [ ] Drag from palette to canvas
- [ ] Node inspector panel (view selected node's details)

---

### Phase 4: Connections & Data Mapping

- [ ] Implement edge creation between nodes
- [ ] Implement type validation on edge creation
- [ ] Show validation errors visually (red edges, warnings)
- [ ] Implement data mapping UI (output field → input field)
- [ ] Auto-detect required connections

---

### Phase 5: Inputs & Configs

- [ ] Implement Inputs Panel (define runtime inputs)
- [ ] Implement Config Panel (define configs)
- [ ] Allow referencing inputs in node parameters: `{{inputs.x}}`
- [ ] Allow referencing configs in node parameters: `{{configs.y}}`
- [ ] Implement Connections Panel (show required integrations)

---

### Phase 6: Testing Suite

- [ ] Implement "Test" button with input form
- [ ] Implement test execution with step-by-step results
- [ ] Implement error display (which node failed, why)
- [ ] Implement saved test cases (create, edit, delete)
- [ ] Implement test case selector dropdown
- [ ] Store test cases in `_tables/workflows/[id]/tests.json`

---

### Phase 7: Code Generation / Execution

- [ ] Based on research, implement code generator OR runtime interpreter
- [ ] Handle tool nodes → Composio execution
- [ ] Handle control nodes → Mastra control flow (if implementing)
- [ ] Error handling: catch, categorize, surface

---

### Phase 8: Agent Integration

- [ ] Workflow assignment UI in agent modal
- [ ] Config value storage per agent-workflow binding
- [ ] Runtime input passing from agent to workflow
- [ ] Workflow execution from agent chat
- [ ] Error handling and surfacing in agent chat

---

## 7. Success Criteria

| Criteria | Validation | Priority |
|----------|------------|----------|
| **Composio tools visible** | Palette shows all available tools with I/O schemas | P0 |
| **Nodes have I/O** | Each node displays its input and output schema | P0 |
| **Connections validated** | Invalid type connections show error | P0 |
| **Data mapping works** | User can map output fields to input fields via UI | P0 |
| **Connection requirements work** | Add Gmail node → "Requires Gmail" shown | P0 |
| **Runtime inputs work** | Define inputs → agent passes values → workflow receives them | P0 |
| **Configs work** | Define config → reference in node → set at assignment | P0 |
| **Testing works** | Hit Test → fill inputs → see step-by-step results | P0 |
| **Saved test cases** | Create test case → run it again later with one click | P1 |
| **Errors surface clearly** | Node fails → user sees which node + error message | P0 |
| **Agent can use workflow** | Assign to agent → agent calls it with inputs | P0 |
| **No WebContainers** | Workflows run server-side without browser sandbox | Goal |
| **Resume Agent buildable** | End-to-end: scrape job → tailor resume | North Star |

---

## 8. Files Changed

### Completed

```
_docs/UXD/Pages/workflow/_deprecated/   # Old designs moved here
```

### Phase 0 (Research) - To Create

```
_docs/_tasks/15.1-workflow-research.md  # Research findings, primitives, code examples
```

### Phase 1 (UXD Mockups) - To Create

```
_docs/UXD/Pages/workflow/
├── index.html                          # Parent file linking all variations
├── variation-1/
│   └── index.html                      # Close to prescribed design
├── variation-2/
│   └── index.html                      # Alternative layout
└── variation-3/
    └── index.html                      # Simplified version
```

### Phase 2+ (Implementation) - To Create

```
app/api/workflows/                      # New backend domain
app/(pages)/workflows/                  # New frontend domain
_tables/workflows/                      # Workflow storage
```

---

## 9. Related Documents

### Task Documents
- `_docs/_tasks/15.1-workflow-research.md` - Research findings (created in Phase 0)
- `_docs/_tasks/10-platform-evolution.md` - Platform direction

### Feature Documents
- `_docs/Product/Features/06-Tools-vs-Workflows.md` - Conceptual distinction
- `_docs/Product/Features/07-Recording-as-Teaching.md` - Future: recording actions

### Existing Code (Reference)
- `app/api/tools/services/composio-tools.ts` - How we currently fetch Composio tools
- `app/api/connections/services/tools.ts` - How we handle connection tools
- `app/(pages)/tools/` - Existing tool editor (inspiration for workflow editor)

