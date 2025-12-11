# Natural Language Workflow Creation

**Status:** Draft
**Priority:** P0
**North Star:** Enable users to describe "Apply to this job posting" in plain English and instantly see a visual workflow that can scrape, analyze, tailor resume, and submit application.

---

## Problem Statement

Users have domain expertise but not programming knowledge. They understand their workflows intuitively—they could describe them to a colleague—but can't translate that understanding into visual node structures or code.

The current workflow editor requires users to:
1. Manually drag nodes from a toolkit
2. Configure each node's parameters
3. Understand data flow and schema compatibility
4. Write or modify code for custom logic

This creates a cold-start problem: users face a blank canvas with no clear path from intent to implementation.

**The Gap:** No bridge between natural language description and visual workflow structure.

---

## User Value

- **Zero-to-workflow in seconds** — Describe a task, see it visualized immediately
- **Learn by seeing** — The generated workflow teaches users how to think about decomposition
- **Iterate conversationally** — Refine the workflow through dialogue rather than configuration
- **Expert-friendly** — Power users can start from generated structure and customize
- **Accessible automation** — Non-technical users can build sophisticated workflows

---

## User Flows

### Flow 1: Initial Workflow Generation

```
1. User opens workflow editor (new workflow)
2. User sees prompt: "Describe what you want to automate..."
3. User types: "When I receive a job posting URL, scrape the requirements,
   compare them to my resume, generate a tailored cover letter, and
   save everything to my applications tracker"
4. System shows thinking indicator with stages:
   - "Understanding your task..."
   - "Identifying steps..."
   - "Designing data flow..."
5. Canvas populates with nodes:
   - Input: Job Posting URL
   - Step 1: Navigate to URL (Browser)
   - Step 2: Extract Requirements (Browser)
   - Step 3: Retrieve Resume (Records)
   - Step 4: Analyze Match (LLM)
   - Step 5: Generate Cover Letter (LLM)
   - Step 6: Save to Applications (Records)
6. User sees workflow with all connections, schemas defined
7. User can run immediately or refine
```

### Flow 2: Conversational Refinement

```
1. User has generated workflow on canvas
2. User types: "Add a step to check if I've already applied to this company"
3. System inserts new node after URL extraction:
   - Step 1.5: Check Existing Applications (Records)
   - Adds conditional branch: if exists → notify user, else → continue
4. User types: "Actually, make the cover letter more casual"
5. System updates the LLM node's prompt/instructions
6. Changes highlighted briefly, then integrated
```

### Flow 3: Partial Generation (Extend Existing)

```
1. User has partially built workflow manually
2. User selects a node
3. User types: "After this step, I need to validate the data
   and retry if there are errors"
4. System generates continuation nodes:
   - Validation step with schema check
   - Conditional branch for success/failure
   - Retry loop with backoff
5. New nodes connected to selected node
```

### Flow 4: Template-Based Quick Start

```
1. User opens workflow editor
2. Instead of blank prompt, user selects "Start from example"
3. User sees categories: Job Application, Social Media, Data Processing, etc.
4. User selects "Job Application Pipeline"
5. Template workflow loads with placeholder descriptions
6. User clicks node: "Describe what should happen here"
7. User types specific instructions, node updates
```

---

## Code Areas

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/(pages)/workflows/editor/` | Workflow editor UI | `page.tsx`, `components/` |
| `app/api/workflows/` | Workflow API routes | `types/workflow.ts`, `services/` |
| `app/api/workflows/services/step-generator.ts` | Existing transpilation | Step code generation |
| `lib/mastra/` | Mastra integration | Agent definitions |
| `components/ai-elements/` | AI interaction patterns | Chat UI components |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Generation model | Opus/Sonnet with structured output | Need reliable JSON schema generation |
| Generation scope | Full workflow vs incremental | Start with full workflow, add incremental later |
| Node types generated | All supported types | LLM should use complete vocabulary |
| Schema inference | AI proposes, user confirms | Balance automation with control |
| Conversation memory | Per-workflow session | Context needed for refinement |

---

## Architecture

### Generation Pipeline

```
User Input (Natural Language)
         ↓
┌─────────────────────────────────────────┐
│         Intent Understanding            │
│  - Extract goal, inputs, outputs        │
│  - Identify domain (browser, data, LLM) │
│  - Detect complexity signals            │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│         Step Decomposition              │
│  - Break into IPO units                 │
│  - Order by dependency                  │
│  - Identify control flow needs          │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│         Schema Generation               │
│  - Define input/output for each step    │
│  - Ensure schema compatibility          │
│  - Generate mapping code if needed      │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│         Workflow JSON Assembly          │
│  - Create nodes with positions          │
│  - Define bindings between steps        │
│  - Add control flow primitives          │
└─────────────────────────────────────────┘
         ↓
Workflow Definition (workflow.json)
         ↓
Transpilation → Executable (workflow.ts)
```

### LLM Prompt Structure

The generation prompt should include:

1. **System Context**
   - Available node types (composio tools, browser, LLM, records, custom)
   - Control flow primitives (sequential, parallel, branch, loop)
   - Schema format expectations

2. **User Context**
   - Connected integrations (what tools are available)
   - Existing records/tables (what data is accessible)
   - Previous workflows (patterns to reuse)

3. **Task Context**
   - User's natural language description
   - Any selected nodes (for extension)
   - Conversation history (for refinement)

4. **Output Schema**
   ```typescript
   interface GeneratedWorkflow {
     name: string;
     description: string;
     inputSchema: JSONSchema;
     outputSchema: JSONSchema;
     steps: GeneratedStep[];
     controlFlow: ControlFlowDefinition;
     bindings: BindingDefinition[];
   }
   ```

---

## Constraints

- **Composio tool availability** — Can only generate steps for tools user has connected
- **Schema compatibility** — Generated schemas must be valid JSON Schema
- **Transpiler support** — Generated workflow.json must transpile to valid Mastra code
- **Canvas layout** — Generated nodes need reasonable positions for visual clarity
- **Token limits** — Complex workflows may hit context limits; need chunking strategy

---

## Success Criteria

- [ ] User can describe workflow in natural language and see it visualized
- [ ] Generated workflow has valid schemas for all nodes
- [ ] Generated workflow transpiles and executes successfully
- [ ] User can refine workflow through follow-up messages
- [ ] Generation completes in under 10 seconds for typical workflows
- [ ] Generated layouts are readable (no overlapping nodes)
- [ ] Error states clearly communicate what went wrong

---

## Out of Scope

- Voice input for workflow description
- Real-time collaborative generation (multiple users)
- Workflow generation from documents/screenshots (see Screen Recording)
- Autonomous workflow discovery (see Proactive Suggestion)
- Multi-language support (English only for MVP)

---

## Open Questions

- How do we handle ambiguous descriptions? (Ask for clarification vs best guess)
- Should we show alternative workflow structures for the same description?
- How do we handle requests for capabilities the user hasn't connected?
- What's the maximum workflow complexity we should generate at once?
- How do we train/fine-tune for domain-specific workflows?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Empty State | Initial prompt UI | Text input, examples, template links |
| Generation Progress | Loading states | Stage indicators, cancel option |
| Generated Workflow | Result presentation | Nodes, connections, highlight new |
| Refinement Chat | Conversation UI | Message history, context awareness |
| Error State | Generation failure | Clear error, recovery options |

### Mockup Location

```
_docs/UXD/Pages/workflows/
├── natural-language-creation/
│   ├── empty-state.html
│   ├── generation-progress.html
│   ├── generated-workflow.html
│   ├── refinement-chat.html
│   └── error-states.html
```

---

## References

- North Star: `_docs/Product/ROADMAP/00-North-Star.md`
- Workflow Editor: `app/(pages)/workflows/editor/`
- Step Generator: `app/api/workflows/services/step-generator.ts`
- Mastra Workflows: https://mastra.ai/docs/workflows
- Vercel AI SDK Structured Output: https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data
