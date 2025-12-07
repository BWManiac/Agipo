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
7. **Table integration** - workflows can read from and write to Records (structured data tables)

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

### 2.12 Table Integration (Records)

**Definition:** Workflows can read from and write to structured data tables (Records feature).

**Why it matters:** Tables become a "referenceable brain" for workflows. Workflows can query existing data for context (RAG), store results for future use, or maintain state across executions.

**Two Flavors of Table Access:**

| Purpose | Description | Example |
|---------|-------------|---------|
| **Read** | Query table data as input or RAG context | "Find similar jobs" queries saved job listings |
| **Write** | Insert/update rows in a table | "Job Scraper" adds new job postings daily |

**Requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| PR-12.1 | Workflow can declare table requirements (read/write/readwrite purpose) | P0 |
| PR-12.2 | Table requirements specify required columns with types | P0 |
| PR-12.3 | Multiple table requirements per workflow supported | P0 |
| PR-12.4 | When assigning workflow to agent, user selects table for each requirement | P0 |
| PR-12.5 | User can auto-create new table with required schema during assignment | P0 |
| PR-12.6 | Table reference accessible to nodes via `{{configs.tableKey}}` | P0 |
| PR-12.7 | Column mapping at assignment time (if workflow columns ≠ table columns) | P1 |
| PR-12.8 | Dedicated "Query Table" node type | P1 |
| PR-12.9 | Dedicated "Write to Table" node type | P1 |
| PR-12.10 | Table can be RAG source for AI decision steps | P2 |

**Table Requirement Structure:**

```typescript
interface TableRequirement {
  key: string;                    // Internal reference: "output_table"
  purpose: "read" | "write" | "readwrite";
  description: string;            // "Table to store scraped job listings"
  
  requiredColumns: Array<{
    key: string;                  // How workflow references it: "job_title"
    suggestedName: string;        // Suggested column name: "Job Title"
    type: "text" | "number" | "date" | "boolean" | "select";
    required: boolean;
  }>;
  
  canAutoCreate: boolean;         // Show "Create new table" option
  autoCreateName?: string;        // Suggested name for new table
}
```

**Assignment Flow:**

When assigning a workflow with table requirements:

1. UI shows each table requirement with its purpose and required columns
2. For each requirement, user can:
   - Select an existing compatible table (has required columns or superset)
   - Create a new table with the required schema (if `canAutoCreate: true`)
3. If column names differ, user maps workflow columns → table columns
4. Table binding stored as config (like connection bindings)

**Example - Job Scraper Workflow:**

```
Workflow: "Daily Job Scraper"

Table Requirements:
  output_table (write):
    - job_title: text (required)
    - company: text (required)
    - url: text (required)
    - scraped_at: date (required)
    Can auto-create: Yes
    Suggested name: "Job Listings"

When assigning to agent:
  User selects existing "My Job Tracker" table
  Maps: job_title → Title, company → Company Name, url → Link, scraped_at → Date Added
```

**Table Node Types (MVP):**

| Node Type | Purpose | Inputs | Outputs |
|-----------|---------|--------|---------|
| **Query Table** | Read rows from table | tableRef, filter?, sort?, limit? | rows[] |
| **Write to Table** | Insert row(s) to table | tableRef, data | insertedRow |

**Schema Evolution:**

- **Superset OK**: Table can have more columns than workflow requires (extras ignored)
- **Missing optional columns**: Get null/default values
- **Missing required columns**: Block assignment, prompt to add columns or select different table

**Out of Scope for Table Integration MVP:**

- Update existing row (use Code node + Records API)
- Delete row (use Code node + Records API)
- Upsert mode (insert-only for MVP)
- Batch insert (single row per Write node; use loop for batches)
- Runtime table selection (tables bound at assignment time only)
- RAG/semantic search (requires vector infrastructure)

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

| # | Question | Options | Decision | Decision Made? |
|---|----------|---------|----------|----------------|
| OQ-1 | Do we generate code or interpret at runtime? | Code-gen vs Runtime | **Hybrid** | ✅ See Decision Log |
| OQ-2 | How do we validate types between JSON Schemas? | Library (ajv) vs Custom logic | **Use Composio outputParameters** | ✅ See Decision Log |
| OQ-3 | Do we need data transforms in mappings? | Yes (inline) vs No (use Code nodes) | **No (MVP), Yes (v2)** | ✅ See Decision Log |
| OQ-4 | How do we store workflow state during editing? | Zustand only vs Zustand + auto-save | **Zustand + auto-save** | ✅ See Decision Log |
| OQ-5 | If Composio doesn't expose output schemas, what do we do? | Infer vs Manual vs Skip | **Use outputParameters + fallback** | ✅ See Decision Log |
| OQ-6 | How do we handle step-level errors in UI? | Inline error vs Modal vs Panel | **Panel (Test tab)** | ✅ See Decision Log |

### 5.2 Product Decisions

| # | Question | Options | Decision | Decision Made? |
|---|----------|---------|----------|----------------|
| OQ-7 | Can workflows call other workflows? | Yes vs No | No (P2 backlog) | ❌ Deferred |
| OQ-8 | Can workflows be forked/copied? | Fork (link) vs Copy (independent) | Copy (independent) | ❌ Deferred |
| OQ-9 | Can configs be changed after assignment? | Yes vs No | **Yes** | ✅ |
| OQ-10 | What happens if user disconnects a required connection? | Block vs Warn vs Disable | Disable + prompt to reconnect | ❌ Deferred |
| OQ-11 | Can test cases be shared between workflows? | Yes vs No | No (per-workflow) | ❌ Deferred |
| OQ-12 | Can agents pass partial runtime inputs? | Yes (use defaults) vs No (require all) | No (require all required) | ❌ Deferred |
| OQ-13 | Where do test results get logged? | Test panel only vs Also agent activity | Test panel only (start simple) | ❌ Deferred |
| OQ-14 | Should auto-map matching field names by default? | Yes (opt-out) vs No (explicit) | **Yes (opt-out)** | ✅ See Decision Log |

### 5.3 Decision Log

Decisions made based on research findings (see `15.2-workflow-research.md` for full context).

| Date | Question | Decision | Rationale |
|------|----------|----------|-----------|
| 2025-12-06 | OQ-1: Code-gen vs Runtime? | **Hybrid** - Runtime for testing, code-gen for production | Mastra requires execute functions (can't serialize); hybrid gives fast iteration + reliable prod |
| 2025-12-06 | OQ-2: Type validation approach? | **Use Composio's outputParameters + z.record() fallback** | Composio DOES expose output schemas; verified via live query |
| 2025-12-06 | OQ-3: Data transforms in mappings? | **Direct mapping MVP, transforms v2** | Keep MVP simple; Code nodes handle complex transforms |
| 2025-12-06 | OQ-4: Zustand + auto-save? | **Yes** | Consistent with existing patterns |
| 2025-12-06 | OQ-5: Missing output schemas? | **Use outputParameters when available; z.record() fallback for terminals** | Terminal nodes don't need output validation |
| 2025-12-06 | OQ-6: Step error display? | **Panel (Test tab)** | Keeps canvas clean; errors visible with context |
| 2025-12-06 | OQ-9: Configs changeable after assignment? | **Yes** | Flexibility for users |
| 2025-12-06 | OQ-14: Auto-map matching names? | **Yes (opt-out)** | Reduces manual work; user can override |
| 2025-12-06 | Visual editor views | **Both list AND canvas from start** | Core requirement from product owner |
| 2025-12-06 | Step composability | **Support importing steps from other tools/workflows** | Enables marketplace model |

---

## 6. Implementation Phases (Overview)

> **Note:** Detailed implementation plan is in `15.3-workflow-implementation.md`. This section provides a high-level overview.

### Phase Status

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 0 | Research | ✅ Complete | All RQ questions answered in 15.1/15.2 |
| 1 | UXD Mockups | ✅ Complete | Flight A/B variations created |
| 2 | Foundation | Pending | File structure, types, basic CRUD |
| 3 | List View | Pending | Sequential step editor |
| 4 | Tool Palette | Pending | Composio tool discovery |
| 5 | Data Mapping | Pending | Edge creation, field mapping |
| 6 | Testing Suite | Pending | Test execution, saved tests |
| 7 | Code Generation | Pending | workflow.json → workflow.ts |
| 8 | Agent Integration | Pending | Workflow assignment + execution |

### Research Completion Summary

All research questions answered (see `15.2-workflow-research.md`):

| Category | Questions | Status |
|----------|-----------|--------|
| Mastra Workflows | RQ-1 through RQ-9 | ✅ All verified |
| Composio Schemas | RQ-10 through RQ-12 | ✅ All verified |
| Architecture Decisions | OQ-1 through OQ-6 | ✅ All decided |

**Key Findings:**
- Composio DOES expose `outputParameters` (verified via live query)
- Mastra supports in-memory workflow construction (hybrid approach viable)
- `.map()` is the primitive for data mapping between steps
- Official `@composio/mastra` package incompatible with current Mastra version (manual wrapping required)

### UXD Mockup Completion Summary

| Flight | Variation | Purpose | Location |
|--------|-----------|---------|----------|
| A | 1 | Canvas-first, prescribed layout | `Flight A/variation-1/` |
| A | 2 | Alternative panel arrangement | `Flight A/variation-2/` |
| A | 3 | **List view emphasis (STARTING POINT)** | `Flight A/variation-3/` |
| B | 1 | Timeline approach | `Flight B/variation-1/` |
| B | 2 | Minimal UI | `Flight B/variation-2/` |
| B | 3 | Progressive disclosure | `Flight B/variation-3/` |

### Implementation Plan Reference

For detailed phase breakdowns, file impact analysis, and per-phase acceptance criteria, see:

- **`15.3-workflow-implementation.md`** - Full implementation plan
- **`15.3a-workflow-json-schema.md`** - Dedicated workflow.json schema design

---

## 7. Acceptance Criteria (MECE)

Comprehensive, testable criteria organized by category. Each criterion is mutually exclusive but collectively exhaustive of all product requirements.

### 7.1 Node Discovery & Palette (7 criteria)

| # | Criterion | Maps To | Testable By |
|---|-----------|---------|-------------|
| AC-1.1 | Palette displays all Composio tools from user's connected integrations | PR-1.1 | Open editor → see tools grouped by toolkit |
| AC-1.2 | Palette displays NO_AUTH tools available to all users | PR-1.2 | Open editor without connections → browser_tool visible |
| AC-1.3 | Each tool shows its input schema (parameter names, types, required) | PR-1.3 | Click tool → see input fields |
| AC-1.4 | Each tool shows its output schema (field names, types) | PR-1.4 | Click tool → see output fields |
| AC-1.5 | Tools are grouped by toolkit (Gmail, GitHub, etc.) | PR-1.5 | Visual grouping in palette |
| AC-1.6 | Tools can be searched/filtered by name | PR-1.6 | Type "send" → filter results |
| AC-1.7 | Drag tool from palette to canvas creates node | PR-2.3 | Drag and drop interaction |

### 7.2 IPO Model & Nodes (6 criteria)

| # | Criterion | Maps To | Testable By |
|---|-----------|---------|-------------|
| AC-2.1 | Each node displays its input schema | PR-2.1 | Node shows input fields in UI |
| AC-2.2 | Each node displays its output schema (or "unknown" indicator) | PR-2.2 | Node shows output fields or fallback |
| AC-2.3 | Nodes connect via edges | PR-2.3 | Draw line between nodes |
| AC-2.4 | Clicking edge opens data mapping UI | PR-2.4 | Click edge → mapping modal opens |
| AC-2.5 | Terminal nodes (no downstream) display correctly without output handles | PR-2.5 | Add terminal node → no output port |
| AC-2.6 | Node inspector shows full I/O details for selected node | PR-2.1, PR-2.2 | Click node → see details in panel |

### 7.3 Connection Validation (4 criteria)

| # | Criterion | Maps To | Testable By |
|---|-----------|---------|-------------|
| AC-3.1 | Type validation runs when creating edge | PR-3.1 | Connect mismatched types → warning |
| AC-3.2 | Invalid connections show visual indicator (red edge) | PR-3.2 | Mismatched types → edge turns red |
| AC-3.3 | Coercible types show warning but allow connection | PR-3.3 | number→string → yellow warning |
| AC-3.4 | Incompatible types block connection or show error | PR-3.4 | object→boolean → error shown |

### 7.4 Connection Requirements (4 criteria)

| # | Criterion | Maps To | Testable By |
|---|-----------|---------|-------------|
| AC-4.1 | Adding tool node auto-detects required connection | PR-4.1 | Add Gmail tool → "Requires: Gmail" |
| AC-4.2 | Required connections displayed in Connections panel | PR-4.2 | Panel shows toolkit list with icons |
| AC-4.3 | When assigning to agent, validate required connections exist | PR-4.3 | Assign workflow → check user has Gmail connected |
| AC-4.4 | Block execution if connections missing | PR-4.4 | Execute without Gmail → error message |

### 7.5 Configs (5 criteria)

| # | Criterion | Maps To | Testable By |
|---|-----------|---------|-------------|
| AC-5.1 | Author can define configs (name, type, required, default) | PR-5.1 | Config panel → add config |
| AC-5.2 | Node parameters can reference configs via `{{configs.x}}` | PR-5.2 | Set node param → reference config |
| AC-5.3 | Config values requested when assigning workflow to agent | PR-5.3 | Assign workflow → config form shown |
| AC-5.4 | Config values stored per agent-workflow binding | PR-5.4 | Same workflow, different agents, different configs |
| AC-5.5 | Supported config types: text, number, boolean, select | PR-5.5 | Create each type → works correctly |

### 7.6 Runtime Inputs (5 criteria)

| # | Criterion | Maps To | Testable By |
|---|-----------|---------|-------------|
| AC-6.1 | Author can define runtime inputs (name, type, required, description) | PR-8.1 | Inputs panel → add input |
| AC-6.2 | Runtime inputs have schema (type validation) | PR-8.2 | Define input as number → validation enforced |
| AC-6.3 | Agent passes runtime input values when calling workflow | PR-8.3 | Agent chat → calls workflow with args |
| AC-6.4 | Node parameters can reference inputs via `{{inputs.x}}` | PR-8.4 | Set node param → reference input |
| AC-6.5 | Runtime inputs validated before execution | PR-8.5 | Missing required input → error before run |

### 7.7 Data Mapping (6 criteria)

| # | Criterion | Maps To | Testable By |
|---|-----------|---------|-------------|
| AC-7.1 | Data mapping UI shows source output fields | PR-9.2 | Click edge → see source fields |
| AC-7.2 | Data mapping UI shows target input fields | PR-9.3 | Click edge → see target fields |
| AC-7.3 | User can map output field → input field | PR-9.4 | Drag or select mapping |
| AC-7.4 | Nested field access supported (e.g., `user.email`) | PR-9.5 | Map nested field → works |
| AC-7.5 | Auto-map matching field names (optional) | PR-9.6 | Enable auto-map → matching names connected |
| AC-7.6 | Type mismatches shown as warnings | PR-9.7 | Map string→number → warning shown |

### 7.8 Testing Suite (7 criteria)

| # | Criterion | Maps To | Testable By |
|---|-----------|---------|-------------|
| AC-8.1 | Test button runs workflow with user-provided inputs | PR-10.1 | Click Test → fill form → run |
| AC-8.2 | User can create and save named test cases | PR-10.2 | Create "Basic test" → saved |
| AC-8.3 | Test cases store runtime inputs + config values | PR-10.3 | Save test → reopen → values restored |
| AC-8.4 | Test execution shows step-by-step progress | PR-10.4 | Run test → see each step execute |
| AC-8.5 | Test execution shows errors clearly (which node, why) | PR-10.5 | Step fails → error message + node highlighted |
| AC-8.6 | Saved test case can be re-run with one click | PR-10.6 | Select test → click Run → executes |
| AC-8.7 | Test history available (past runs + results) | PR-10.7 | View test history list |

### 7.9 Error Handling (6 criteria)

| # | Criterion | Maps To | Testable By |
|---|-----------|---------|-------------|
| AC-9.1 | Tool execution errors caught and surfaced | PR-11.1 | API timeout → error shown |
| AC-9.2 | Error display shows which node failed + message | PR-11.2 | Failed node highlighted + message |
| AC-9.3 | Error types distinguished (auth/API/validation) | PR-11.3 | Auth error → specific message |
| AC-9.4 | Auth errors prompt reconnection | PR-11.4 | Expired token → "Reconnect Gmail" |
| AC-9.5 | Failed node retry possible (P2) | PR-11.5 | Retry button on failed step |
| AC-9.6 | Errors logged for debugging | PR-11.6 | Errors visible in test panel |

### 7.10 Control Flow (4 criteria - P1/P2)

| # | Criterion | Maps To | Testable By |
|---|-----------|---------|-------------|
| AC-10.1 | Branch node: if/else based on condition | PR-6.1 | Add branch → define condition → works |
| AC-10.2 | Parallel node: run multiple paths simultaneously | PR-6.2 | Add parallel → both branches execute |
| AC-10.3 | Loop node: repeat until condition (P2) | PR-6.3 | Add loop → repeats correctly |
| AC-10.4 | Wait node: pause for human approval (P2) | PR-6.4 | Add wait → execution suspends |

### 7.11 Custom Code Nodes (4 criteria - P1)

| # | Criterion | Maps To | Testable By |
|---|-----------|---------|-------------|
| AC-11.1 | User can add Code node with custom JS/TS | PR-7.1 | Add Code node → write code |
| AC-11.2 | User defines input schema for code node | PR-7.2 | Define input fields in UI |
| AC-11.3 | User defines output schema for code node | PR-7.3 | Define output fields in UI |
| AC-11.4 | Code editor with syntax highlighting | PR-7.4 | Editor has highlighting |

### 7.12 Visual Editor Views (4 criteria)

| # | Criterion | Maps To | Testable By |
|---|-----------|---------|-------------|
| AC-12.1 | Canvas view (ReactFlow) displays workflow as graph | Architecture | Open editor → see nodes/edges |
| AC-12.2 | List view displays workflow as sequential steps | Architecture | Switch to list → see ordered steps |
| AC-12.3 | Both views read/write same underlying state | Architecture | Edit in canvas → list updates |
| AC-12.4 | View toggle persists user preference | UX | Refresh → same view selected |

### 7.13 Persistence & Storage (3 criteria)

| # | Criterion | Maps To | Testable By |
|---|-----------|---------|-------------|
| AC-13.1 | Workflow saved to `_tables/workflows/[id]/workflow.json` | Architecture | Save → file exists |
| AC-13.2 | Generated code saved to `workflow.ts` | Architecture | Save → TypeScript file generated |
| AC-13.3 | Auto-save during editing | OQ-4 | Edit → state persisted |

### 7.14 Agent Integration (4 criteria)

| # | Criterion | Maps To | Testable By |
|---|-----------|---------|-------------|
| AC-14.1 | Workflow can be assigned to agent | Success | Assignment UI works |
| AC-14.2 | Agent can call workflow with runtime inputs | Success | Agent chat → workflow executes |
| AC-14.3 | Workflow results returned to agent | Success | Agent receives output |
| AC-14.4 | No WebContainers required | Architecture | Runs server-side only |

### 7.15 Table Integration (12 criteria)

| # | Criterion | Maps To | Testable By |
|---|-----------|---------|-------------|
| AC-15.1 | Workflow author can add table requirement in editor | PR-12.1 | Add table req in Tables panel |
| AC-15.2 | Table requirement specifies purpose (read/write/readwrite) | PR-12.1 | Select purpose dropdown |
| AC-15.3 | Table requirement specifies required columns with types | PR-12.2 | Add column requirements |
| AC-15.4 | Multiple table requirements per workflow | PR-12.3 | Add 2+ table requirements |
| AC-15.5 | Assignment UI shows table requirements section | PR-12.4 | See table section in modal |
| AC-15.6 | User can select compatible existing table | PR-12.4 | Dropdown shows compatible tables |
| AC-15.7 | User can create new table with required schema | PR-12.5 | Click create → table created |
| AC-15.8 | Table reference accessible via `{{configs.tableKey}}` | PR-12.6 | Reference in node → resolves |
| AC-15.9 | Column mapping available when names differ | PR-12.7 | Map workflow→table columns |
| AC-15.10 | Query Table node returns filtered rows | PR-12.8 | Configure query → results |
| AC-15.11 | Write to Table node inserts row | PR-12.9 | Run workflow → row in table |
| AC-15.12 | Incompatible table blocked at assignment | PR-12.2 | Missing required column → error |

**Total: 81 acceptance criteria** covering all product requirements.

---

## 8. User Flows

Explicit user journeys that exercise the acceptance criteria.

### Flow 1: Create New Workflow (Happy Path)

```
1. User navigates to Workflows page from header
2. User clicks "New Workflow" button
3. Editor opens with empty canvas + default name "Untitled Workflow"
4. User renames workflow to "Job Application Helper"
5. System auto-saves name
```

### Flow 2: Add First Node from Palette

```
1. User sees Palette panel on right (default tab)
2. Palette shows tools grouped by toolkit (Gmail, GitHub, Firecrawl, etc.)
3. User searches "scrape" in palette search
4. User drags "FIRECRAWL_SCRAPE" tool to canvas
5. Node appears with input/output schemas visible
6. Connections panel updates: "Requires: Firecrawl"
```

### Flow 3: Add Second Node and Connect

```
1. User drags "Custom Code" node to canvas (right of first)
2. User drags edge from first node output → second node input
3. Data mapping modal opens automatically
4. User sees source fields: data, error, successful
5. User maps data.title → jobTitle
6. User maps data.company → companyName
7. User clicks "Save Mapping"
8. Edge appears with mapping indicator
```

### Flow 4: Define Runtime Inputs

```
1. User clicks "Inputs" tab in right panel
2. User clicks "+ Add Input"
3. User fills: name="jobUrl", type="string", required=true
4. User adds description: "URL of job listing to scrape"
5. User references input in first node: url = {{inputs.jobUrl}}
6. System validates reference exists
```

### Flow 5: Define Configs

```
1. User clicks "Config" tab in right panel
2. User clicks "+ Add Config"
3. User fills: name="resumeTemplate", type="select", options=["modern", "classic"]
4. User sets default="modern"
5. Config appears in list
```

### Flow 6: Test Workflow - New Test Case

```
1. User clicks "Test" tab in right panel
2. No saved tests exist → form shows
3. User fills runtime inputs: jobUrl = "https://example.com/job/123"
4. User clicks "Run Test"
5. Execution panel shows: Step 1 running...
6. Step 1 completes ✓ → shows output preview
7. Step 2 running... → completes ✓
8. Status: PASSED (2.3s)
9. User clicks "Save as Test Case" → names it "Basic flow"
```

### Flow 7: Test Workflow - Saved Test Case

```
1. User opens Test tab
2. Saved tests shown: "Basic flow"
3. User clicks "Run" on "Basic flow"
4. Test executes with saved inputs
5. Results displayed
```

### Flow 8: Handle Test Failure

```
1. User runs test with invalid jobUrl
2. Step 1 fails ✗ with red highlight
3. Error panel shows: "Invalid URL format"
4. User can edit test inputs and retry
```

### Flow 9: Switch Between Canvas and List Views

```
1. User is in canvas view (default)
2. User clicks "List" toggle in toolbar
3. View switches to sequential list of steps
4. Same steps shown in execution order
5. User can reorder steps by drag-drop in list
6. Changes reflected when switching back to canvas
```

### Flow 10: Connection Missing Error

```
1. User tries to test workflow with Gmail node
2. User doesn't have Gmail connected
3. Error: "Missing required connection: Gmail"
4. "Connect Gmail" button shown
5. User connects Gmail in modal
6. Returns to editor → can now test
```

### Flow 11: Save and Close Workflow

```
1. User clicks "Save" button
2. workflow.json saved to _tables/workflows/[id]/
3. workflow.ts generated from JSON
4. User navigates away
5. Returning later → workflow loads with all state
```

### Flow 12: Assign Workflow to Agent

```
1. User goes to Agent detail page
2. User clicks "Add Workflow"
3. Selects "Job Application Helper"
4. System checks: User has Firecrawl connected? ✓
5. Config form shown: Select resumeTemplate
6. User sets config values
7. Workflow assigned to agent
```

### Flow 13: Agent Executes Workflow

```
1. User chats with agent
2. User: "Tailor my resume for this job: [url]"
3. Agent recognizes workflow trigger
4. Agent calls workflow with runtime input: jobUrl = [url]
5. Workflow executes server-side
6. Result returned to agent
7. Agent responds with tailored resume
```

### Flow 14: Data Mapping with Nested Fields

```
1. User connects two nodes
2. Source output has nested structure: { user: { contact: { email: "..." } } }
3. Target input expects: recipientEmail (string)
4. User types in source path: user.contact.email
5. Maps to recipientEmail
6. Type validation: string → string ✓
```

### Flow 15: Add Branch Control Flow (P1)

```
1. User drags "Branch" control node to canvas
2. User connects input edge
3. User defines condition: if inputData.priority === "high"
4. User connects "true" branch to urgent step
5. User connects "false" branch to normal step
6. Test shows only one branch executed
```

### Flow 16: Add Table Requirement

```
1. User opens "Tables" panel in editor
2. User clicks "+ Add Table Requirement"
3. User fills:
   - Key: "output_table"
   - Purpose: "write"
   - Description: "Table to store scraped jobs"
4. User adds required columns:
   - job_title (text, required)
   - company (text, required)
   - url (text, required)
5. User enables "Allow auto-create"
6. User sets suggested name: "Job Listings"
7. Table requirement appears in Tables panel
```

### Flow 17: Assign Workflow with Table (Select Existing)

```
1. User clicks "Assign to Agent" on workflow
2. Modal shows: Connections, Tables, Configs sections
3. Tables section shows: "output_table (write)"
   - Required columns: job_title, company, url
4. Dropdown shows compatible tables:
   - "My Job Tracker" (compatible ✓)
   - "Leads" (missing: url ⚠️)
5. User selects "My Job Tracker"
6. Column mapping UI appears:
   - job_title → "Title" column
   - company → "Company Name" column
   - url → "Link" column
7. User saves mapping
8. User completes assignment
```

### Flow 18: Assign Workflow with Table (Auto-Create)

```
1. User clicks "Assign to Agent" on workflow
2. Tables section shows requirement
3. User clicks "+ Create 'Job Listings' table"
4. Table created with exact required schema
5. No column mapping needed (names match)
6. User completes assignment
```

### Flow 19: Use Query Table Node

```
1. User drags "Query Table" node to canvas
2. User configures:
   - Table: {{configs.reference_table}}
   - Filter: company contains "Acme"
   - Limit: 10
3. User connects output to next node
4. At runtime, node queries table and returns matching rows
```

### Flow 20: Use Write to Table Node

```
1. User drags "Write to Table" node to canvas
2. User configures:
   - Table: {{configs.output_table}}
   - Data: {{previous.scrapedJob}}
3. At runtime, node inserts row to table
4. Inserted row ID returned as output
```

---

## 9. UXD Requirements

### 9.1 Mockup Location

All UXD mockups for the Workflow Editor are located at:

```
_docs/UXD/Pages/workflow/
├── index.html              # Overview linking all variations
├── Flight A/               # Canvas-centric designs
│   ├── index.html
│   ├── variation-1/        # Prescribed layout
│   ├── variation-2/        # Alternative panels
│   └── variation-3/        # List view emphasis ← STARTING POINT
└── Flight B/               # List-centric designs  
    ├── index.html
    ├── variation-1/        # Timeline approach
    ├── variation-2/        # Minimal UI
    └── variation-3/        # Progressive disclosure
```

### 9.2 Starting Direction

**Flight A, Variation 3 (List View Emphasis)** is the recommended starting point.

**Rationale:**
- List view is more approachable for non-technical users
- Canvas view adds complexity that can be surfaced progressively
- Both views share the same underlying `workflow.json` state
- Can evolve to full dual-view support

### 9.3 Key UX Principles

| Principle | Implementation |
|-----------|----------------|
| **Progressive disclosure** | Start with list view, unlock canvas for power users |
| **Same state, different views** | workflow.json supports both `listIndex` and `position` |
| **Clear data flow** | List view uses inline badges for data source references |
| **Terminal node distinction** | Visual difference for nodes without outputs |
| **Connection awareness** | Always visible which integrations are required |

### 9.4 Mockup Requirements

Each mockup must demonstrate:

- [ ] Tool Palette (grouped by toolkit)
- [ ] Node with I/O schema visible
- [ ] Edge between nodes (or sequential indicator in list view)
- [ ] Data mapping UI
- [ ] Inputs Panel
- [ ] Config Panel
- [ ] Connections Panel
- [ ] Test Panel with execution results
- [ ] Error state (failed node)
- [ ] Both list and canvas views

---

## 10. Files Changed

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

