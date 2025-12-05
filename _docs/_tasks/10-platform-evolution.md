# Task 10: Platform Evolution - Tool Builder & Resume Agent

**Status:** Planning  
**Date:** December 5, 2025  
**Priority:** High  
**Dependencies:** Task 9.1 (Memory Integration) - Complete

---

## 1. Executive Summary

This task focuses on evolving the Agipo platform to support more sophisticated agent capabilities, with the Resume/Job Agent as our north star use case. We need to:

1. **Clarify Tool vs Workflow distinction** - Establish clear architectural boundaries
2. **Build a Tool Builder** - For atomic, single-purpose capabilities
3. **Build a Workflow Builder** - For composing tools into complex sequences
4. **Enable Document RAG** - Store resumes/documents in Records
5. **Add Browser Automation** - For job scraping (and later, applying)
6. **Build the Resume Agent** - End-to-end proof of concept (validation that the platform works)

---

## 1.1 Core Philosophy: Tools vs Workflows

### The Distinction

| Aspect | Tool | Workflow |
|--------|------|----------|
| **Scope** | Atomic, single-purpose | Composition of tools/workflows |
| **Execution** | Immediate (call → return) | Complex (sequential, parallel, branching) |
| **State** | Stateless | Stateful across steps |
| **Human-in-loop** | No | Yes (suspend/resume) |
| **Schema** | Single input → Single output | Input → [steps] → Output |

### Visual Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              TOOL                                        │
│                                                                         │
│   Atomic unit of capability                                             │
│   ┌─────────┐    ┌─────────────────┐    ┌──────────┐                   │
│   │  Input  │ →  │     Execute     │ →  │  Output  │                   │
│   │ Schema  │    │ (code/API/etc)  │    │  Schema  │                   │
│   └─────────┘    └─────────────────┘    └──────────┘                   │
│                                                                         │
│   Examples:                                                             │
│   • GMAIL_SEND_EMAIL (Composio)                                        │
│   • scrape_page (Browser primitive)                                    │
│   • calculate_match_score (Custom code)                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ composed into
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            WORKFLOW                                      │
│                                                                         │
│   Composition of tools with control flow                                │
│                                                                         │
│   ┌────────┐     ┌────────┐     ┌────────┐                             │
│   │ Tool A │ ──▶ │ Tool B │ ──▶ │ Tool C │   (sequential)              │
│   └────────┘     └────────┘     └────────┘                             │
│                                                                         │
│   ┌────────┐                                                            │
│   │ Tool A │ ──┬──▶ ┌────────┐                                         │
│   └────────┘   │    │ Tool B │   (parallel)                            │
│                └──▶ │ Tool C │                                         │
│                     └────────┘                                         │
│                                                                         │
│   Features: .then(), .parallel(), .branch(), suspend/resume            │
│   State: Shared across steps                                           │
│   Can contain: Tools, other Workflows (recursive)                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### The Recursive Insight

A workflow can contain other workflows, so the distinction is really about **scope**:
- Small scope = Tool (atomic capability)
- Large scope = Workflow (orchestrated sequence)
- Both are "callable things" from an agent's perspective

### Two Builders

| Builder | Purpose | User Experience |
|---------|---------|-----------------|
| **Tool Builder** | Create atomic capabilities | Define input/output schema + code/API call |
| **Workflow Builder** | Compose tools | Visual canvas connecting tools + control flow |

**Tool types the Tool Builder can create:**
1. **Custom Code** - User writes JavaScript/TypeScript execute function
2. **Composio Wrapper** - Select from connected integrations
3. **Browser Primitive** - Stagehand actions (navigate, click, extract)
4. **HTTP Call** - External API integration

**Workflow Builder features:**
1. **Tool Palette** - Drag tools onto canvas
2. **Composio Tools** - Available as nodes
3. **Control Flow** - Sequential, parallel, branching nodes
4. **Human-in-loop** - Suspend points for approval
5. **Testing** - Run workflow with sample inputs

---

## 2. North Star: Resume Agent

### MVP User Flow

```
1. User creates a "Resume" record (structured data)
2. User pastes a job listing URL
3. Agent scrapes the job posting (browser tool)
4. Agent tailors resume to match job requirements
5. Agent outputs customized resume (PDF/text)
```

### Required Capabilities

| Capability | Current State | Needed |
|------------|---------------|--------|
| Document/Resume Storage | ❌ | Records with document type |
| Resume RAG | ❌ | Embeddings + semantic search |
| Browser Scraping | ❌ | Stagehand/Browserbase integration |
| Custom Tools | ⚠️ Buggy | Mastra workflow alignment |
| PDF Generation | ❌ | react-pdf or puppeteer |

---

## 3. Phase 10.1: Tool Builder Audit & Mastra Alignment

**Goal:** Understand current gaps and plan Mastra integration

### Current Architecture

```
Visual Canvas (React Flow)
       │
       ▼ transpileWorkflowToTool()
Generated JavaScript (tool.js)
       │
       ▼ dynamic import
AI SDK tool() definition
       │
       ▼ agent.stream()
Execution
```

### Mastra Workflow Pattern

```typescript
// Mastra uses createStep + createWorkflow
const scrapeJobStep = createStep({
  id: "scrape-job",
  inputSchema: z.object({ url: z.string() }),
  outputSchema: z.object({ 
    title: z.string(),
    company: z.string(),
    requirements: z.array(z.string()),
    description: z.string(),
  }),
  execute: async ({ inputData }) => {
    // Browser automation here
  }
});

const tailorResumeStep = createStep({
  id: "tailor-resume",
  inputSchema: z.object({
    requirements: z.array(z.string()),
    resumeData: z.object({...}),
  }),
  outputSchema: z.object({
    tailoredResume: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent("resume-writer");
    // Use agent to tailor
  }
});

const resumeWorkflow = createWorkflow({
  id: "tailor-resume-workflow",
  inputSchema: z.object({ jobUrl: z.string() }),
  outputSchema: z.object({ resume: z.string() }),
})
  .then(scrapeJobStep)
  .then(tailorResumeStep)
  .commit();
```

### Key Questions

1. Should visual nodes generate `createStep()` definitions?
2. How do we make Composio tools available as steps?
3. Can workflows be both:
   - Called by agents as tools?
   - Run standalone via UI?

### Acceptance Criteria

- [ ] AC1: Document current transpiler limitations
- [ ] AC2: Prototype Mastra workflow generation from canvas
- [ ] AC3: Composio tools appear in workflow builder palette
- [ ] AC4: Test: Create workflow visually → Agent calls it successfully

---

## 4. Phase 10.2: Document Storage in Records

**Goal:** Enable resume/document storage with RAG

### Schema Design

```typescript
// New record type: "document"
type DocumentRecord = {
  id: string;
  name: string;
  type: "pdf" | "docx" | "txt" | "md";
  content: string; // Extracted text
  metadata: {
    uploadedAt: Date;
    size: number;
    pages?: number;
  };
  embedding?: number[]; // Vector for semantic search
};

// Resume as a structured document
type ResumeRecord = {
  id: string;
  name: string; // "John's Resume v2"
  contact: {
    name: string;
    email: string;
    phone?: string;
    linkedin?: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate?: string;
    description: string;
    highlights: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationDate: string;
  }>;
  skills: string[];
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
};
```

### File Impact Analysis

| File | Change | Description |
|------|--------|-------------|
| `_tables/records/` | NEW | Document storage structure |
| `app/api/records/upload` | NEW | Document upload endpoint |
| `lib/embeddings.ts` | NEW | Embedding generation |
| `app/api/records/search` | NEW | Semantic search endpoint |

### Acceptance Criteria

- [ ] AC5: Can upload PDF/DOCX and extract text
- [ ] AC6: Documents stored in Records domain
- [ ] AC7: Embeddings generated on upload
- [ ] AC8: Agent can search documents semantically
- [ ] AC9: Resume schema defined and validated

---

## 5. Phase 10.3: Browser Automation Spike

**Goal:** Explore browser automation for job scraping

### Browser Automation as First-Class Capability

Browser automation needs to be a core platform feature, not an afterthought. Users should:
1. Be able to create browser-based tools easily
2. See what the agent is doing (visual feedback)
3. Trust that automation is reliable/deterministic

### Options Research

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Browserbase + Stagehand** | Cloud browsers + AI automation | Scalable, no infra, AI-powered element selection | Cost, external dependency |
| **Playwright** | Local browser automation | Free, self-hosted, full control | Need to run browser, more brittle selectors |
| **Puppeteer** | Chrome automation | Mature, well-documented | Chrome-only, similar issues to Playwright |
| **AgentQL** | AI-powered web scraping | Smart extraction, natural language queries | Newer, less documented |

### Stagehand Primitives (from Mastra template)

```typescript
// Navigate to URL
stagehandNavigateTool({ url: "https://linkedin.com/jobs/..." })

// Observe elements on page
stagehandObserveTool({ 
  instruction: "Find the job requirements section" 
})
// Returns: { elements: [{ selector, description, ... }] }

// Perform action
stagehandActTool({ 
  action: "click the Apply button" 
})

// Extract structured data
stagehandExtractTool({
  instruction: "Extract job title, company, and requirements",
  schema: z.object({
    title: z.string(),
    company: z.string(),
    requirements: z.array(z.string()),
  })
})
```

### Visual Feedback Requirement

When an agent uses browser automation, users should see:
1. **Live view** of browser actions (optional, for debugging)
2. **Step log** showing what actions were taken
3. **Screenshots** of key moments
4. **Extracted data** highlighted on page

This could be a "Browser Panel" in the agent modal.

### Research Questions

1. How does Stagehand + Browserbase work?
2. Can we run browser tools locally (Playwright) for dev?
3. How to show browser actions to user (visual feedback)?
4. Cost implications of cloud browser infrastructure?
5. How deterministic is AI-powered element selection?
6. Can we define "recipes" for common sites (LinkedIn, Indeed)?

### Prototype Scope

```typescript
// Minimal browser tool for job scraping
const scrapeJobListingTool = tool({
  description: "Scrape a job listing from a URL",
  parameters: z.object({
    url: z.string().url(),
  }),
  execute: async ({ url }) => {
    // Use Stagehand to:
    // 1. Navigate to URL
    // 2. Extract job title, company, requirements
    // 3. Return structured data
  },
});
```

### Acceptance Criteria

- [ ] AC10: Stagehand/Browserbase POC working
- [ ] AC11: Can scrape a LinkedIn job posting
- [ ] AC12: Structured data extraction works
- [ ] AC13: Decide: Cloud browser vs local Playwright
- [ ] AC14: Design visual feedback UX for browser actions

---

## 6. Phase 10.4: Resume Agent MVP

**Goal:** End-to-end agent that tailors resumes

### Agent Configuration

```typescript
const resumeAgent: AgentConfig = {
  id: "resume-agent",
  name: "Resume Tailor",
  role: "Career Assistant",
  systemPrompt: `You are a career assistant that helps users tailor their resumes 
    for specific job applications. You can:
    - Access and update the user's master resume
    - Scrape job listings to understand requirements
    - Generate tailored resumes that highlight relevant experience
    - Provide feedback on resume improvements`,
  toolIds: [
    "workflow-scrape_job_listing",
    "workflow-tailor_resume",
    "workflow-export_resume_pdf",
  ],
  connectionToolBindings: [
    // Gmail for sending applications?
  ],
};
```

### User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         RESUME AGENT                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User: "Tailor my resume for this job: [paste URL]"            │
│                                                                 │
│  Agent:                                                         │
│    1. Calls scrape_job_listing(url)                            │
│       → Returns: { title, company, requirements, description } │
│                                                                 │
│    2. Calls get_resume() from Records                          │
│       → Returns: { experience, skills, education, ... }        │
│                                                                 │
│    3. Analyzes match between resume and job                    │
│       → Identifies relevant experience to highlight            │
│       → Suggests skills to emphasize                           │
│                                                                 │
│    4. Calls tailor_resume({ job, resume })                     │
│       → Returns: { tailoredResume }                            │
│                                                                 │
│    5. Responds with tailored resume + explanation              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Acceptance Criteria

- [ ] AC14: Resume Agent defined and accessible
- [ ] AC15: Agent can retrieve user's resume from Records
- [ ] AC16: Agent can scrape job listing
- [ ] AC17: Agent generates tailored resume
- [ ] AC18: User can view/download tailored resume

---

## 7. Implementation Roadmap

| Phase | Name | Est. Effort | Dependencies |
|-------|------|-------------|--------------|
| 10.1 | Tool Builder Audit | 2-3 days | None |
| 10.2 | Document Storage | 3-4 days | 10.1 |
| 10.3 | Browser Spike | 2-3 days | 10.1 |
| 10.4 | Resume Agent MVP | 3-4 days | 10.2, 10.3 |

**Total estimated effort:** 10-14 days

---

## 8. Open Questions

1. **Mastra Workflows vs Current Transpiler**
   - Migrate fully to Mastra workflows?
   - Keep both and let workflows export as tools?

2. **Browser Infrastructure**
   - Browserbase (cloud, paid) vs Playwright (local, free)?
   - How to show browser actions to users?

3. **Composio in Workflow Builder**
   - How to make Composio tools available as workflow nodes?
   - Authentication flow for tools in workflows?

4. **Resume Versioning**
   - Keep history of resume versions?
   - Track which version was used for which job?

---

## 9. References

- [Mastra Workflows Overview](https://mastra.ai/docs/workflows/overview)
- [Mastra Browsing Agent Template](https://mastra.ai/templates/browsing-agent)
- [Stagehand by Browserbase](https://github.com/browserbase/stagehand)
- [Current Workflow Editor](/app/(pages)/tools/editor/)
- [Transpiler Service](/app/api/tools/services/transpiler.ts)

---

## 10. Success Criteria: Resume Agent MVP

The Resume Agent is our **validation that the platform works**. When we can build this agent entirely within Agipo, we know we've succeeded.

### The User Story

> "As a job seeker, I want to give the agent my resume and a job posting URL, and have it generate a tailored resume that highlights my relevant experience for that specific role."

### The Test Flow

```
User Flow:
1. User uploads their resume to Records (or already has one stored)
2. User opens Resume Agent in workforce
3. User says: "Tailor my resume for this job: [paste LinkedIn URL]"
4. Agent:
   a. Uses browser tool to scrape job posting → extracts requirements
   b. Retrieves user's resume from Records
   c. Analyzes match between resume and job requirements
   d. Generates tailored resume emphasizing relevant skills
   e. Saves tailored version to Records
5. User downloads/views tailored resume
```

### Working Backwards: What Do We Need?

**To build this agent, we need:**

#### Tools (Atomic Capabilities)

| Tool | Type | Description | Status |
|------|------|-------------|--------|
| `scrape_job_posting` | Browser | Navigate to URL, extract job requirements | 🔜 Need browser spike |
| `get_user_resume` | Custom | Retrieve resume from Records | 🔜 Need Records integration |
| `calculate_match_score` | Custom | Compare skills to requirements | 🔜 Create in Tool Builder |
| `generate_tailored_resume` | Custom | LLM call to rewrite resume | 🔜 Create in Tool Builder |
| `save_to_records` | Internal | Store result in Records | 🔜 Need Records integration |

#### Workflows (Orchestration)

| Workflow | Steps | Status |
|----------|-------|--------|
| `tailor_resume` | scrape → get_resume → match → generate → save | 🔜 Create in Workflow Builder |

#### Records (Data Storage)

| Record Type | Schema | Purpose |
|-------------|--------|---------|
| Resume | `{ skills: [], experience: [], education: [], contact: {} }` | User's base resume |
| Job Posting | `{ url, title, company, requirements: [], scraped_at }` | Cached job data |
| Tailored Resume | `{ base_resume_id, job_posting_id, content, created_at }` | Generated outputs |

### What This Validates

| Capability | Validated By | Priority |
|------------|--------------|----------|
| **Tool Builder** | Custom tools for resume operations | P0 |
| **Workflow Builder** | Scrape → Analyze → Generate flow | P0 |
| **Browser Automation** | Job listing scraping | P0 |
| **Records Integration** | Resume storage + retrieval | P1 |
| **Memory** | Agent remembers user preferences | ✅ Done |
| **Composio Integration** | Tools available in workflow | ✅ Done |

### MVP Scope (Minimal Path)

For the first iteration, we can simplify:

1. **Skip Records**: User pastes resume text directly in chat
2. **Skip Workflow Builder**: Agent chains tools directly
3. **Browser is key**: Must be able to scrape job postings

**MVP Flow:**
```
User: "Here's my resume: [paste text]. Tailor it for https://linkedin.com/job/123"

Agent:
1. Calls scrape_job_posting(url) → gets requirements
2. Calls generate_tailored_resume(resume_text, requirements) → returns tailored version
3. Responds with tailored resume text
```

This validates:
- ✅ Browser tool works
- ✅ Custom tool creation works
- ✅ Agent can chain tools
- ✅ Memory persists preferences

Then we iterate to add Records, Workflow Builder, etc.

---

## 11. Next Actions

1. [ ] Review and approve this plan
2. [ ] Decide: Start with Tool Builder audit OR Browser spike?
3. [ ] Research Browserbase/Stagehand integration options
4. [ ] Design Resume record schema
5. [ ] Sketch UX for browser action feedback

