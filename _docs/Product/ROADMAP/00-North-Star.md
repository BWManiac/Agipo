# North Star: The Job Application Agent

**Version:** 1.0  
**Status:** Active Guiding Thesis  
**Last Updated:** December 2025

---

## The Vision

**If Agipo can enable a user to build an agent that helps people apply for jobs, then we've achieved product-market fit.**

This agent represents the ultimate test of our platform's maturity. It requires every core capability working together: browser automation, document intelligence, workflow orchestration, custom tool creation, and agent reasoning—all orchestrated through natural language.

---

## Why This Is Our North Star

### 1. **Real-World Complexity**
Job applications aren't theoretical exercises—they're real problems people face daily. The process is:
- **Multi-step**: Scrape job listings → Analyze requirements → Tailor resume → Fill applications
- **Context-aware**: Must understand user's background, skills, and career goals
- **Site-specific**: Every job board has different forms, layouts, and requirements
- **Sensitive**: Deals with personal data, credentials, and career-critical documents

### 2. **Validates Platform Completeness**
If we can build this agent, it proves:
- ✅ **Browser Automation Works**: Can navigate sites, scrape content, fill forms, log in
- ✅ **Document Intelligence Works**: Can parse resumes, understand job requirements, match skills
- ✅ **RAG Works**: Can use resume as context to tailor applications intelligently
- ✅ **Workflows Work**: Can chain browser actions, LLM calls, and data transformations
- ✅ **Custom Tools Work**: Can create bespoke tools for resume tailoring, match scoring, etc.
- ✅ **Agents Work**: Can reason about complex, multi-step processes with context

### 3. **Universal Appeal**
Everyone understands the problem. If we can solve job applications, we can solve:
- Legal document review and processing
- Real estate listing aggregation and applications
- Grant application automation
- University application workflows
- Any complex, form-heavy, site-specific process

### 4. **Perfect IPO Decomposition**
The job application flow naturally maps to our Input-Process-Output model:

```
Input:  User's resume + Job posting URL
  ↓
Process: Scrape job → Analyze requirements → Match skills → Tailor resume → Fill form → Submit
  ↓
Output:  Application submitted + Tailored resume saved
```

Each step is atomic, testable, and composable.

---

## The Agent Capabilities

### Core Features

1. **Resume RAG Integration**
   - Stores user's resume as a document in Records
   - Uses RAG to retrieve relevant experience/skills when tailoring
   - Maintains context about user's background across sessions

2. **Job Site Scraping**
   - Navigates to job posting URLs (LinkedIn, Indeed, company sites)
   - Extracts job requirements, descriptions, and application fields
   - Handles different site structures dynamically

3. **Intelligent Resume Tailoring**
   - Analyzes job requirements vs. user's resume
   - Generates tailored resume highlighting relevant experience
   - Uses custom LLM tools to rewrite sections intelligently

4. **Browser Automation for Applications**
   - Logs into job sites (handling authentication flows)
   - Fills application forms with tailored content
   - Handles multi-step application processes
   - Submits applications and tracks status

5. **Workflow Orchestration**
   - Chains all steps into a reusable workflow
   - Handles errors gracefully (e.g., site changes, login failures)
   - Tracks progress and provides updates

---

## Platform Requirements (Validation Checklist)

For this agent to work, we need:

### ✅ Already Built
- [x] Workflow editor with visual canvas
- [x] Data bindings system (connecting step outputs to inputs)
- [x] Browser automation infrastructure (Playwright + Anchor Browser)
- [x] Agent framework (Mastra with memory)
- [x] Records system (for storing resumes/structured data)
- [x] Workflow transpilation (workflows → executable code)
- [x] Workflow registry (enabling agents to execute workflows)

### 🔄 In Progress / Needs Work
- [ ] **Resume document parsing** (PDF/DOCX → structured data)
- [ ] **RAG integration for Records** (vector search over resume content)
- [ ] **Custom tool builder** (for resume tailoring, match scoring tools)
- [ ] **Browser session management** (persistent profiles, credential storage)
- [ ] **Form detection and filling** (dynamic field mapping)
- [ ] **Error handling in workflows** (retry logic, fallbacks)

### 🔜 Future Enhancements
- [ ] **Multi-site templates** (pre-built scrapers for common job boards)
- [ ] **Application tracking** (dashboard of submitted applications)
- [ ] **A/B testing resumes** (track which tailored versions get responses)
- [ ] **Cover letter generation** (based on job description and resume)

---

## The User Journey

### Phase 1: Setup
```
User: "I want to build a job application agent"

Agent: "Great! First, I'll need your resume. You can upload it or paste the text."
  → User uploads resume
  → Resume stored in Records
  → Resume embedded for RAG retrieval
```

### Phase 2: First Application
```
User: "Apply for this job: https://company.com/careers/job-123"

Agent:
  1. Navigates to job posting
  2. Scrapes job requirements
  3. Retrieves relevant resume sections via RAG
  4. Generates tailored resume
  5. Logs into job site
  6. Fills application form
  7. Submits application
  8. Confirms submission

User: "Perfect! Save this workflow so I can use it for other jobs."
```

### Phase 3: Reuse & Scale
```
User: "Apply to these 10 jobs" [provides list]

Agent:
  - Uses saved workflow for each job
  - Tailors resume differently for each
  - Tracks progress across all applications
  - Reports completion status
```

---

## Success Criteria

We'll know we've achieved our North Star when:

1. **A non-technical user** can build a job application agent in < 30 minutes
2. **The agent successfully** scrapes job postings from 3+ different sites
3. **The agent generates** tailored resumes that pass human review
4. **The agent successfully** fills and submits applications on 2+ job sites
5. **The workflow is reusable** - one click to apply to multiple jobs
6. **The agent handles errors** gracefully (site changes, login failures, etc.)

---

## Why This Guides Development

Every feature we build should answer: **"Does this help us build the job application agent?"**

- **Browser automation?** → Need to scrape job sites and fill forms
- **RAG for documents?** → Need to use resume as context for tailoring
- **Workflow bindings?** → Need to pass job data → resume data → tailored output
- **Custom tools?** → Need resume tailoring and match scoring tools
- **Error handling?** → Sites change, need graceful degradation

This isn't about building features for their own sake—it's about enabling a complete, real-world use case that validates our entire platform.

---

## Tying It All Together

### Workflows → Agent Execution
The job application agent is built as **workflows** that become **tools** the agent can invoke. This validates:
- Visual workflow builder is powerful enough for complex processes
- Workflow → tool transpilation works seamlessly
- Agents can reason about when to use workflows

### Browser Automation → Real-World Interaction
Browser automation enables the agent to interact with real job sites. This validates:
- We can handle sites we haven't seen before (generalization)
- Authentication flows work reliably
- Form detection and filling adapts to different layouts

### RAG → Context-Aware Intelligence
Using the resume as RAG context enables intelligent tailoring. This validates:
- Document storage and retrieval works
- Semantic search finds relevant experience
- LLM tools can use RAG context effectively

### Records → Data Persistence
Storing resumes, job postings, and tailored versions in Records validates:
- Structured data storage is flexible enough
- Cross-workflow data sharing works
- Historical tracking enables improvement over time

---

## The Bigger Picture

The job application agent isn't the end goal—it's the **proof of concept** that Agipo can enable any complex automation.

Once we can build this agent, we can build:
- **Legal research agents** that scrape case law and draft briefs
- **Real estate agents** that monitor listings and schedule viewings
- **Grant application agents** that tailor proposals for different foundations
- **Research agents** that aggregate information across multiple sources

**The North Star isn't the destination—it's the compass that ensures we're building a platform, not just features.**

---

## Next Steps

1. **Validate browser automation** can handle real job sites
2. **Build resume parsing** and RAG integration
3. **Create custom tools** for resume tailoring
4. **Test workflow orchestration** with real job application flows
5. **Iterate based on real-world testing**

Every sprint should move us closer to this North Star.

---

*"If we can help someone automate their job search, we can help them automate anything."*


