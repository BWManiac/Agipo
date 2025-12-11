# Anchor Browser Tasks API Integration

**Status:** Draft
**Priority:** P0
**North Star:** Enable reusable, versioned browser automation scripts that can run in background (up to 3 hours) — foundation for "apply to 10 jobs" batch automation

---

## Problem Statement

Currently, our browser automation uses Anchor's `agent.task()` API for natural language control. This is great for interactive use, but has limitations:

1. **Not reusable** — Each task is one-off; can't save and re-run
2. **Synchronous only** — User must wait for completion
3. **No versioning** — Can't iterate on automation scripts
4. **Limited duration** — Tied to session timeout

Anchor's Tasks API solves these problems by allowing us to create, version, and execute reusable TypeScript automation scripts that run in Anchor's infrastructure.

**The Gap:** We haven't implemented the Tasks API. Users can't create reusable automation scripts or run long-running batch operations.

---

## User Value

- **Create once, run many times** — Save automation scripts for repeated use
- **Background execution** — Start a task and come back later (up to 3 hours)
- **Version control** — Iterate on scripts without breaking existing automations
- **Batch operations** — Run same script against multiple inputs (10 job applications)
- **Reliable execution** — Anchor manages infrastructure, retries, and scaling

---

## User Flows

### Flow 1: Create Task from Chat Interaction

```
1. User has active browser session
2. User successfully automates a task via chat: "Go to LinkedIn and extract all job postings for 'Product Manager'"
3. User clicks "Save as Task" button
4. System captures the automation logic as TypeScript
5. User names the task: "Extract LinkedIn Jobs"
6. User defines inputs: ANCHOR_SEARCH_QUERY, ANCHOR_MAX_RESULTS
7. Task saved as draft
8. User can test task with different inputs
```

### Flow 2: Execute Task in Background

```
1. User opens Tasks panel
2. User selects "Extract LinkedIn Jobs" task
3. User fills in inputs: search_query="Engineering Manager", max_results="50"
4. User clicks "Run in Background"
5. Task starts executing asynchronously
6. User sees task in "Running Tasks" list with progress
7. User can close browser and come back later
8. When done, results appear in task history
```

### Flow 3: Deploy and Reuse Task

```
1. User has tested task thoroughly in draft mode
2. User clicks "Deploy" to make task production-ready
3. Task is now versioned (v1.0.0)
4. User can run deployed version for reliable execution
5. User can create new draft to iterate without affecting production
6. Future: Task can be used as a step in workflows
```

---

## Code Areas

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/api/browser-automation/` | Existing browser API structure | `sessions/route.ts`, `services/anchor-client.ts` |
| Anchor Tasks API | External API reference | [docs.anchorbrowser.io/advanced/tasks](https://docs.anchorbrowser.io/advanced/tasks) |
| `_tables/` | Storage patterns | `workflows/`, `agents/` for file structure patterns |
| `app/(pages)/experiments/browser-automation/` | Playground UI | `store/`, `components/` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Task storage | Local metadata + Anchor-hosted code | Tasks run on Anchor; we track metadata locally |
| Task creation | From chat transcript or manual code | Start simple with transcript-to-code generation |
| Input naming | ANCHOR_ prefix convention | Required by Anchor's Tasks API |
| Execution mode | Support both sync and async | Async needed for long-running batch jobs |
| Task library | User-specific initially | No sharing for MVP |

---

## Constraints

- **Anchor API shape** — Must follow their task format (TypeScript, base64 encoded, ANCHOR_ prefixed inputs)
- **Task code lives on Anchor** — We send code to their API; they store and execute
- **3-hour max duration** — Anchor's limit for async tasks
- **Draft vs Deployed** — Can only run deployed versions in production context

---

## Success Criteria

- [ ] User can create a new task with name, description, and TypeScript code
- [ ] User can define input parameters with ANCHOR_ prefix
- [ ] User can test task in draft mode
- [ ] User can deploy task to production version
- [ ] User can execute task synchronously and see results
- [ ] User can execute task asynchronously and check status later
- [ ] Task list shows all user's tasks with status (draft/deployed)
- [ ] Task execution history persists across sessions

---

## Out of Scope

- **Chat-to-code generation** — Manual code writing for MVP; AI generation later
- **Task marketplace** — No sharing or publishing
- **Task scheduling** — No cron/trigger support yet
- **Task chaining** — No running tasks from within tasks

---

## Open Questions

- How do we help users write valid task code? (Templates? Validation?)
- Should we have a code editor in the playground UI?
- How do we handle task failures? (Retry logic, notifications)
- What's the UX for monitoring long-running tasks?

---

## UXD Requirements

### Required Mockups

| Mockup | Purpose | Must Show |
|--------|---------|-----------|
| Tasks Panel | List of user's tasks | Task list with name, status (draft/deployed), last run, run button |
| Create Task Dialog | Task creation flow | Name, description, code editor, input parameters |
| Task Detail View | View and run a task | Code viewer, input form, run button, execution history |
| Task Execution Status | Monitor running tasks | Progress indicator, logs, cancel button |
| Async Task Manager | Background task monitoring | List of running/completed tasks, results preview |

### Mockup Location

```
_docs/UXD/Pages/experiments/browser-automation/
├── tasks-api/
│   ├── tasks-panel.html
│   ├── create-task-dialog.html
│   ├── task-detail-view.html
│   ├── task-execution-status.html
│   └── async-task-manager.html
```

---

## References

- [Anchor Browser Tasks API](https://docs.anchorbrowser.io/advanced/tasks)
- [Anchor Browser SDK Quickstart](https://docs.anchorbrowser.io/quickstart/use-via-sdk)
- Existing implementation: `app/api/browser-automation/services/anchor-agent.ts`
