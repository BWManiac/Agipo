# Planner System: Scheduled Jobs & Event Triggers

**Status:** Draft  
**Priority:** P1  
**North Star:** Enables the Job Application Agent to automatically check for new job postings (scheduled job) and respond to new emails about applications (event trigger). Both can start a chat with a template or execute a workflow.

---

## Problem Statement

Agents are currently reactive—they only act when users explicitly chat with them. There's no way to:
1. **Schedule recurring tasks** (e.g., "Check for new job postings every morning at 9am")
2. **Respond to external events** (e.g., "When a new email arrives, analyze it and respond")

The Planner tab exists in the UI but is non-functional—it shows mock data but users cannot create, edit, or manage scheduled jobs or event triggers.

For the Job Application Agent, this is critical:
- **Scheduled Job**: "Every Monday at 9am, check job boards for new postings matching my criteria"
- **Event Trigger**: "When I receive an email from a recruiter, analyze it and draft a response"

---

## User Value

- **Automated recurring tasks** - Agents can work on a schedule without user intervention
- **Proactive responses** - Agents react to external events (emails, Slack messages, etc.)
- **Two execution modes**:
  - **Chat with template**: Start a conversation with pre-filled context
  - **Workflow execution**: Run a defined workflow automatically
- **Easy trigger creation** - Simple UI for setting up scheduled jobs and event triggers
- **Background execution** - Jobs run in the background via Inngest
- **Event-driven automation** - Agents respond to real-world events via Composio

---

## User Flows

### Flow 1: Create Scheduled Job (Chat Template)

```
1. User opens Agent Modal → Planner tab
2. User clicks "+ Add Job" in Scheduled Jobs section
3. Dialog opens:
   - Name: "Morning Job Check"
   - Schedule: Cron expression picker (or presets: "Daily at 9am", "Weekly on Mondays")
   - Action Type: [ ] Start Chat [x] Execute Workflow
   - If "Start Chat":
     - Template: Textarea for message template
     - Example: "Good morning! Check job boards for new postings matching: {userCriteria}"
   - If "Execute Workflow":
     - Workflow selector dropdown
4. User selects "Start Chat" with template
5. User clicks "Create Job"
6. System:
   - Creates job in Inngest
   - Stores job config in agent config
   - Shows job in Scheduled Jobs list
7. Job appears in list with schedule, next run time
```

### Flow 2: Create Scheduled Job (Workflow)

```
1. User clicks "+ Add Job"
2. User selects "Execute Workflow"
3. User selects "job-application-check" workflow from dropdown
4. User sets schedule: "Daily at 9:00 AM"
5. User clicks "Create"
6. System:
   - Registers workflow with Inngest
   - Creates scheduled function in Inngest
   - Stores job config
7. Job executes workflow every day at 9am
```

### Flow 3: Create Event Trigger (Composio)

```
1. User clicks "+ Add Trigger" in Event Triggers section
2. Dialog opens:
   - Name: "New Email Alert"
   - Event Source: Dropdown (Gmail, Slack, GitHub, etc.)
   - Event Type: Dropdown (filtered by source)
     - If Gmail: "New Email", "Email with Label", etc.
   - Filters: (optional) JSON conditions
   - Action Type: [x] Start Chat [ ] Execute Workflow
   - If "Start Chat":
     - Template: "A new email arrived: {emailSubject}. Analyze and respond."
   - If "Execute Workflow":
     - Workflow selector
3. User selects Gmail → "New Email"
4. User selects "Start Chat" with template
5. User clicks "Create Trigger"
6. System:
   - Creates trigger in Composio
   - Sets up webhook subscription
   - Stores trigger config in agent
7. Trigger appears in list
8. When email arrives, Composio sends webhook → Agent starts chat
```

### Flow 4: Event Trigger Executes Workflow

```
1. User creates trigger: "New Lead in HubSpot" → "Execute Workflow: qualify-lead"
2. System registers trigger with Composio
3. When new lead created in HubSpot:
   - Composio sends webhook to our endpoint
   - System looks up trigger → finds agent + workflow
   - System executes workflow with event data as input
4. Workflow runs in background (via Inngest or direct execution)
5. User sees workflow execution in observability panel (if open)
```

### Flow 5: Edit/Delete Job or Trigger

```
1. User clicks job/trigger card
2. Edit dialog opens (same as create, pre-filled)
3. User modifies schedule/event/action
4. User clicks "Save"
5. System updates Inngest/Composio subscription
6. UI updates
```

---

## Code Areas

Domains/directories to research before implementation:

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/PlannerTab.tsx` | Current UI (needs functionality) | Current mock data structure |
| `app/api/workforce/[agentId]/chat/` | Chat execution | How to start chat programmatically |
| `app/api/workflows/` | Workflow execution | How to execute workflows |
| Inngest integration | Scheduled job execution | Mastra Inngest workflow docs |
| Composio triggers | Event trigger management | Composio triggers API |
| `app/api/workforce/[agentId]/chat/services/chat-service.ts` | Chat service | How to create agent and start chat |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Scheduled Jobs Backend** | Inngest (via Mastra) | Mastra has Inngest integration, handles background execution |
| **Event Triggers Backend** | Composio triggers API | Already integrated with Composio, they handle webhooks |
| **Job Storage** | Agent config file (`planner.jobs[]`) | Co-located with agent, simple for MVP |
| **Trigger Storage** | Agent config file (`planner.triggers[]`) | Co-located with agent |
| **Chat Template Format** | Simple string with optional variables | `{variableName}` syntax, replaced at runtime |
| **Workflow Input** | Event data passed as workflow input | Workflow receives trigger payload |
| **Execution Mode** | User chooses: Chat OR Workflow | Not both simultaneously (can add later) |
| **Cron UI** | Preset buttons + custom cron input | Balance ease-of-use with flexibility |
| **Webhook Endpoint** | `/api/workforce/triggers/webhook` | Centralized webhook handler for all triggers |

---

## Constraints

- **Inngest Setup**: Requires Inngest account and configuration (dev + prod)
- **Composio Webhooks**: Requires publicly accessible webhook URL (ngrok for dev)
- **Agent Config Structure**: Must extend existing `AgentConfig` type
- **Background Execution**: Chat/workflow must run without user session
- **Template Variables**: Simple variable replacement (no complex templating for MVP)
- **Webhook Security**: Must verify Composio webhook signatures

---

## Success Criteria

- [ ] User can create scheduled job with cron expression
- [ ] User can choose "Start Chat" or "Execute Workflow" for jobs
- [ ] Scheduled jobs execute at correct times via Inngest
- [ ] User can create event trigger from Composio events
- [ ] User can choose "Start Chat" or "Execute Workflow" for triggers
- [ ] Event triggers fire when external events occur
- [ ] Chat templates support variable replacement
- [ ] Workflows receive event data as input
- [ ] Jobs/triggers can be edited and deleted
- [ ] Jobs/triggers show status (active, paused, next run time)

---

## Out of Scope

- **Complex Templating**: Only simple `{variable}` replacement (no conditionals, loops)
- **Multiple Actions**: One job/trigger = one action (chat OR workflow, not both)
- **Trigger Conditions**: Advanced filtering beyond basic JSON conditions (future)
- **Job Dependencies**: Jobs that depend on other jobs (future)
- **Retry Logic**: Custom retry policies (use Inngest defaults)
- **Job History**: Execution history/logs (future - use Inngest dashboard)
- **Trigger Testing**: Manual trigger testing UI (future)

---

## Open Questions

- **Chat Template Variables**: What variables are available?
  - For scheduled jobs: `{date}`, `{time}`, custom user variables?
  - For event triggers: Event payload fields (e.g., `{emailSubject}`, `{emailFrom}`)
- **Workflow Input Mapping**: How to map event data to workflow inputSchema?
  - Pass entire event payload?
  - User-defined mapping?
- **Chat Thread Management**: Should scheduled chats create new threads or use existing?
  - Probably new thread per execution
- **Error Handling**: What happens if chat/workflow fails?
  - Show in UI? Send notification? Retry?
- **Inngest Dev Setup**: How to run Inngest locally for development?
  - Docker setup? Local server?
- **Webhook URL**: How to handle webhook URL in dev vs prod?
  - Environment variable? Dynamic based on environment?

---

## Technical Architecture (High-Level)

### Scheduled Jobs (Inngest)

1. **Job Creation**
   - User creates job in UI
   - System creates Inngest function with cron schedule
   - Function calls either:
     - Chat API with template
     - Workflow execution API

2. **Job Execution**
   - Inngest triggers function at scheduled time
   - Function executes chat or workflow
   - Results logged (future: show in UI)

3. **Job Storage**
   - Store in `agentConfig.planner.jobs[]`
   - Include: `id`, `name`, `schedule`, `action`, `config`

### Event Triggers (Composio)

1. **Trigger Creation**
   - User selects Composio event
   - System calls Composio API to create trigger
   - System stores webhook subscription ID
   - Store in `agentConfig.planner.triggers[]`

2. **Webhook Handler**
   - `POST /api/workforce/triggers/webhook`
   - Receives Composio webhook
   - Verifies signature
   - Looks up trigger → agent
   - Executes chat or workflow

3. **Trigger Storage**
   - Store in `agentConfig.planner.triggers[]`
   - Include: `id`, `name`, `event`, `composioTriggerId`, `action`, `config`

---

## References

- [Mastra Inngest Workflow](https://mastra.ai/docs/workflows/inngest-workflow) - Background workflow execution
- [Composio Triggers](https://docs.composio.dev/docs/using-triggers) - Event trigger management
- Existing UI: `app/(pages)/workforce/components/agent-modal/components/tabs/PlannerTab.tsx`
- Agent config: `_tables/types.ts` (AgentConfig.planner structure)
- Related feature: `_docs/Product/Features/04-Integrations-Platform.md` (Phase 4: Triggers)

---

## Related Roadmap Items

- **Workflow Observability**: See scheduled job/workflow executions in real-time
- **Advanced Trigger Conditions**: Complex filtering and conditions
- **Job Dependencies**: Jobs that depend on other jobs completing
- **Execution History**: View past job/trigger executions
