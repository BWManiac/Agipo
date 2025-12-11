# Workflow Observability in Chat

**Status:** Draft  
**Priority:** P1  
**North Star:** Enables users to monitor job application workflows in real-time, seeing each step (scrape job → analyze requirements → tailor resume → fill form) as it executes. Critical for building trust and debugging when workflows fail.

---

## Problem Statement

When agents invoke workflows during chat conversations, users have no visibility into what's happening. The workflow executes silently in the background, and users only see the final result (or error). This creates several problems:

1. **No Progress Feedback**: Users don't know if a workflow is running, stuck, or completed
2. **Poor Debugging**: When workflows fail, users can't see which step failed or why
3. **Low Trust**: "Black box" execution makes it hard to trust complex workflows
4. **No Context**: Users can't see intermediate outputs that might inform their next question

For the Job Application Agent, this is especially critical—users need to see:
- "Scraping job posting..." → "Analyzing requirements..." → "Tailoring resume..." → "Filling application form..."

---

## User Value

- **Real-time visibility** into workflow execution as it happens
- **Step-by-step progress** showing which step is running, completed, or failed
- **Intermediate outputs** visible before the final result (e.g., see the scraped job data before resume tailoring)
- **Better debugging** when workflows fail—see exactly where and why
- **Increased trust** through transparency into agent actions
- **Context for follow-up questions** by seeing what data was produced at each step

---

## User Flows

### Flow 1: Agent Invokes Workflow (First Time)

```
1. User asks agent: "Apply for this job: https://linkedin.com/job/123"
2. Agent decides to use "job-application" workflow
3. Chat message shows: "I'll apply for that job using the job-application workflow"
4. Workflow observability panel automatically opens on the right side of chat
5. Panel shows:
   - Workflow name: "job-application"
   - Status: "Running"
   - Steps list:
     • [Running] Scrape job posting
     • [Pending] Analyze requirements
     • [Pending] Tailor resume
     • [Pending] Fill application form
6. As each step completes, it updates in real-time:
   • [✓] Scrape job posting (completed)
   • [Running] Analyze requirements
7. User can see intermediate outputs by expanding each completed step
8. When workflow completes, panel shows final result
9. Agent responds with summary: "Application submitted successfully!"
```

### Flow 2: Multiple Workflows Running

```
1. User asks: "Apply to these 3 jobs" [provides 3 URLs]
2. Agent invokes workflow 3 times (one per job)
3. Observability panel shows:
   - Active Workflows (3)
     • job-application-1 [Running] - Step 2/4
     • job-application-2 [Running] - Step 1/4
     • job-application-3 [Pending] - Waiting
4. User can expand any workflow to see its step details
5. User can collapse completed workflows to reduce clutter
6. Panel auto-updates as workflows progress
```

### Flow 3: Workflow Failure Debugging

```
1. Workflow fails at "Fill application form" step
2. Observability panel shows:
   - Status: "Failed"
   - Failed step highlighted in red
   - Error message: "Form field 'phone' not found"
   - Previous steps show their outputs (for context)
3. User can expand failed step to see:
   - Input data that was passed to the step
   - Error details and stack trace
   - Suggestions for fixing (if available)
4. User asks agent: "Why did it fail?"
5. Agent can reference the observability data to explain
```

### Flow 4: User Closes/Reopens Panel

```
1. User closes observability panel (click X or drag divider)
2. Panel collapses, chat area expands
3. If workflow is still running, small indicator badge appears on chat
4. User clicks badge to reopen panel
5. Panel restores with current workflow state
```

---

## Code Areas

Domains/directories to research before implementation:

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/api/workforce/[agentId]/chat/` | Chat API that invokes workflows | `route.ts`, `services/chat-service.ts` |
| `app/api/tools/services/workflow-tools.ts` | Workflow execution wrapper | `getWorkflowToolExecutable()`, workflow.run() |
| `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/` | Chat UI components | `index.tsx`, `components/ChatArea.tsx` |
| `app/api/workflows/` | Workflow loading and execution | `services/workflow-loader.ts`, `services/workflow-builder.ts` |
| Mastra workflow streaming | Real-time event emission | `run.stream()`, `result.fullStream` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Streaming vs Polling** | Use Mastra's `.stream()` API | Real-time events, no polling overhead, built-in Mastra support |
| **Panel Location** | Right side of chat (split view) | Doesn't interfere with conversation, natural for "details" view |
| **Panel Persistence** | Auto-open when workflow starts, user can close | Balances visibility with UX—important info visible, but not forced |
| **Multiple Workflows** | Show all active workflows in collapsible list | Users may trigger multiple workflows; need to track all |
| **Step Output Display** | Expandable/collapsible per step | Full outputs can be large; let users choose what to see |
| **SSE vs WebSocket** | Server-Sent Events (SSE) | Simpler than WebSocket, works with existing Next.js streaming, one-way (server→client) is sufficient |
| **State Management** | New Zustand slice for workflow observability | Consistent with existing patterns (chatSlice, threadSlice) |
| **Workflow Run Tracking** | Store runId in chat message metadata | Link observability panel to specific message/workflow invocation |

---

## Constraints

- **Mastra API**: Must use Mastra's `.stream()` API—can't modify how workflows execute
- **Existing Chat UI**: Must integrate with current ChatTab structure without breaking existing functionality
- **SSE Limitations**: Server-Sent Events are one-way (server→client); can't send commands back through same connection
- **Workflow Tool Wrapping**: Current implementation uses `run.start()`—need to refactor to `run.stream()` while maintaining tool compatibility
- **Thread Context**: Workflow observability should be scoped to the current chat thread
- **Performance**: Streaming many workflows simultaneously shouldn't degrade chat performance

---

## Success Criteria

- [ ] When agent invokes a workflow, observability panel automatically opens
- [ ] Panel shows workflow name, status (running/success/failed), and step list
- [ ] Steps update in real-time as workflow executes (no page refresh needed)
- [ ] User can expand/collapse individual steps to see inputs/outputs
- [ ] Failed steps show error messages and stack traces
- [ ] Multiple concurrent workflows are all visible and tracked
- [ ] Panel can be closed/reopened without losing state
- [ ] Panel state persists across chat message loads (if workflow still running)
- [ ] Streaming works reliably for workflows with 1-10 steps
- [ ] No performance degradation when 3+ workflows run simultaneously

---

## Out of Scope

- **Workflow Control**: Users cannot pause/resume/cancel workflows from the panel (future enhancement)
- **Historical Workflows**: Panel only shows active/running workflows, not completed ones (future: workflow history tab)
- **Workflow Editing**: Cannot edit workflow definition from observability panel
- **Step-level Retry**: Cannot retry individual failed steps (workflow must be re-run)
- **Workflow Comparison**: Cannot compare outputs from multiple workflow runs
- **Export/Share**: Cannot export workflow execution logs (future enhancement)

---

## Open Questions

- **How to handle workflow runs that outlive the chat session?** (e.g., user closes browser, workflow still running)
  - Option A: Store run state in database, restore on page load
  - Option B: Only show workflows active during current session
- **Should we show workflows invoked by other agents in the same workspace?** (probably not for v1)
- **How to handle very long-running workflows?** (e.g., workflows that take 10+ minutes)
  - Do we keep SSE connection open? Or poll after initial stream completes?
- **What's the UX for workflows that suspend/wait for human input?** (Mastra supports `.waitForEvent()`)
  - Show "Waiting for approval" status?
  - Allow user to approve from panel?
- **Should observability panel be resizable?** (probably yes, but what are min/max widths?)
- **How to handle workflow streaming errors?** (network issues, server restart)
  - Auto-reconnect? Show error state? Queue events and replay?

---

## Technical Architecture (High-Level)

### Backend Changes

1. **Refactor Workflow Execution to Streaming**
   - Modify `app/api/tools/services/workflow-tools.ts`
   - Change from `run.start()` to `run.stream()`
   - Emit SSE events for each workflow step
   - Maintain tool compatibility (agent still gets final result)

2. **New SSE Endpoint**
   - `POST /api/workforce/[agentId]/chat/workflows/[runId]/stream`
   - Streams workflow execution events
   - Handles reconnection logic
   - Scoped to user/agent/thread

3. **Workflow Run Tracking**
   - Store `runId` in chat message metadata
   - Link workflow invocations to specific messages
   - Track active runs per thread

### Frontend Changes

1. **New Zustand Slice**
   - `app/(pages)/workforce/components/agent-modal/store/slices/workflowObservabilitySlice.ts`
   - State: `activeWorkflows: Map<runId, WorkflowState>`
   - Actions: `addWorkflow`, `updateWorkflowStep`, `removeWorkflow`, `togglePanel`

2. **Observability Panel Component**
   - `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/components/WorkflowObservabilityPanel.tsx`
   - Resizable split view (using `react-resizable-panels`)
   - Lists active workflows
   - Shows step-by-step progress
   - Expandable step details

3. **SSE Hook**
   - `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/hooks/useWorkflowStream.ts`
   - Connects to SSE endpoint
   - Updates Zustand store on events
   - Handles reconnection

4. **ChatTab Integration**
   - Modify `ChatTab/index.tsx` to include observability panel
   - Add split view layout
   - Auto-open panel when workflow starts

---

## References

- [Mastra Workflows Overview](https://mastra.ai/docs/workflows/overview) - Streaming API documentation
- [Mastra Workflow Streaming](https://mastra.ai/docs/workflows/overview#streaming) - `run.stream()` and `result.fullStream`
- Existing implementation: `app/api/tools/services/workflow-tools.ts` (current `run.start()` usage)
- Chat architecture: `app/(pages)/workforce/components/agent-modal/components/tabs/ChatTab/`
- Related feature: `_docs/Product/Features/01-Workflow-as-Code.md` (workflow execution patterns)
- Task reference: `_docs/_tasks/_completed/16-workflows-f/11-Phase11-Workflow-Runtime-Execution.md` (workflow execution research)

---

## Related Roadmap Items

- **Browser Automation Observability**: Similar pattern for browser automation sessions
- **Workflow History**: View completed workflow executions (complements this feature)
- **Workflow Debugging Tools**: Advanced debugging UI for failed workflows
- **Agent Action Transparency**: Show all agent actions (not just workflows) in observability panel
