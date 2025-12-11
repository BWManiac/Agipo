# Browser Automation Workflow Integration

**Status:** Draft
**Priority:** P0
**North Star:** Enable browser actions as workflow steps so users can build end-to-end job application workflows — scrape job → analyze → tailor resume → fill form → submit

---

## Problem Statement

Browser automation currently lives in isolation (`/experiments/browser-automation`). Users can control browsers interactively, but they can't:

1. **Use browser actions in workflows** — Can't add "scrape job posting" as a workflow step
2. **Chain browser output to other steps** — Can't pass extracted data to LLM processing
3. **Combine browser + non-browser actions** — Can't mix scraping with document generation

The Job Application Agent requires seamless handoff between:
- Browser actions (navigate, scrape, fill forms)
- LLM processing (analyze requirements, tailor resume)
- Data operations (read resume from Records, save application status)

**The Gap:** No bridge between browser automation and the workflow editor.

---

## User Value

- **End-to-end automation** — Build complete workflows that include browser interaction
- **Data flow between browser and code** — Extract data from browser, process with LLM, use results
- **Reusable browser steps** — Save browser operations as reusable workflow components
- **Visual understanding** — See browser steps in the workflow canvas alongside other steps
- **LLM as transition layer** — Use AI to interpret browser output and prepare for next step

---

## User Flows

### Flow 1: Add Browser Step to Workflow

```
1. User opens workflow editor
2. User drags "Browser" from toolkit sidebar
3. Browser step appears on canvas
4. User configures step:
   - Action type: Navigate / Extract / Fill Form / Click / Custom
   - For Navigate: URL input (can bind from previous step)
   - For Extract: Schema definition, instruction
   - For Fill Form: Field mappings from workflow data
5. User connects step to previous/next steps
6. Data flows: previous step output → browser step → next step input
```

### Flow 2: Scrape and Process Job Posting

```
1. User creates workflow: "Analyze Job Posting"
2. Step 1: Browser Navigate
   - Input: job_url (workflow input)
3. Step 2: Browser Extract
   - Instruction: "Extract job requirements and qualifications"
   - Schema: { requirements: string[], qualifications: string[] }
4. Step 3: LLM Process (Composio or custom)
   - Prompt: "Compare these requirements to the candidate's resume"
   - Input: extracted data from Step 2 + resume from Records
5. Step 4: Output
   - Match score, missing qualifications, tailoring suggestions
6. User runs workflow with job_url
7. Browser opens, extracts data, LLM processes, user sees analysis
```

### Flow 3: Fill Job Application Form

```
1. User creates workflow: "Submit Application"
2. Step 1: Browser Navigate to application page
3. Step 2: Browser Fill Form
   - Map: firstName → candidate.firstName
   - Map: lastName → candidate.lastName
   - Map: email → candidate.email
   - Map: resume → candidate.resumeFile (file upload)
   - Map: coverLetter → generated.coverLetter (from previous step)
4. Step 3: Browser Click "Submit"
5. Step 4: Browser Extract confirmation
   - Schema: { confirmationNumber: string, status: string }
6. Step 5: Save to Records
   - Table: "Applications"
   - Data: job_url, confirmationNumber, status, timestamp
```

---

## Code Areas

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/(pages)/workflows/` | Workflow editor | `editor/`, `components/` |
| `app/api/workflows/` | Workflow API | `types/workflow.ts`, `services/` |
| `_tables/workflows/` | Workflow storage | `registry.ts`, workflow folders |
| `app/api/browser-automation/` | Browser API | All routes and services |
| `app/api/workflows/services/step-generator.ts` | Step code generation | Transpilation logic |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Browser step type | New step type alongside composio/custom | Clean separation, specific UI |
| Session management | Create session per workflow run | Isolation, cleanup on completion |
| Profile binding | Workflow-level profile selection | Reuse authenticated sessions |
| Execution mode | Anchor agent.task() for MVP | Simpler than Stagehand integration |
| Output handling | Structured JSON via extract | Type-safe data flow |

---

## Constraints

- **Workflow transpiler** — Must generate valid Mastra workflow code for browser steps
- **Session lifecycle** — Browser sessions must start/end cleanly with workflow run
- **Error handling** — Browser failures must propagate to workflow error handling
- **Profile persistence** — Must use Anchor profiles for authenticated workflows
- **Timeout management** — Browser operations may be slow; need appropriate timeouts

---

## Success Criteria

- [ ] "Browser" appears in workflow toolkit
- [ ] Can add browser step to canvas
- [ ] Can configure browser step (action type, parameters)
- [ ] Browser step input/output binds to other steps
- [ ] Workflow transpiles with browser step code
- [ ] Workflow executes browser step successfully
- [ ] Extracted data flows to subsequent steps
- [ ] Browser session created/destroyed with workflow run
- [ ] Profile selection works for authenticated workflows

---

## Out of Scope

- Real-time browser view during workflow execution (logs only)
- Interactive debugging of browser steps
- Parallel browser sessions
- Browser step branching based on page content
- Screenshot capture as step output (future enhancement)

---

## Open Questions

- How do we handle browser step failures? (Retry, skip, fail workflow?)
- Should browser sessions persist across workflow runs?
- How do we show browser step progress in workflow execution UI?
- Can we support multiple browser steps in sequence efficiently?
- How do we handle file uploads in form filling?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Browser Step Card | Step appearance on canvas | Icon, action type badge, input/output ports |
| Browser Step Config | Step configuration panel | Action type selector, parameter inputs, schema editor |
| Workflow Browser Profile | Profile selection for workflow | Dropdown in workflow settings or step config |
| Execution View | Browser step in execution | Log entries for browser actions, timing, screenshots (optional) |

### Mockup Location

```
_docs/UXD/Pages/workflows/
├── browser-integration/
│   ├── browser-step-card.html
│   ├── browser-step-config.html
│   ├── workflow-browser-profile.html
│   └── execution-view.html
```

---

## References

- Workflow Editor: `app/(pages)/workflows/editor/`
- Workflow Types: `app/api/workflows/types/workflow.ts`
- Step Generator: `app/api/workflows/services/step-generator.ts`
- Browser Services: `app/api/browser-automation/services/`
- North Star: `_docs/Product/ROADMAP/00-North-Star.md`
