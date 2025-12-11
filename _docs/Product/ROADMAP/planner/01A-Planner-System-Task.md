# Task: Planner System (Scheduled Jobs & Event Triggers)

**Status:** Not Started  
**Roadmap:** `_docs/Product/ROADMAP/planner/01-Planner-System.md`  
**Research Log:** `_docs/Product/ROADMAP/planner/01B-Planner-System-Research.md`  
**Assigned:** TBD  
**Started:** YYYY-MM-DD  
**Completed:** YYYY-MM-DD

---

## Validation

### Approach Validation
✅ **Inngest for scheduled jobs is correct** - Research confirms static function definition pattern
✅ **Composio triggers for events works** - Webhook-based event system
✅ **Mastra-Inngest bridge exists** - Can use @mastra/inngest package
✅ **Template engine approach is standard** - Variable replacement for chat messages

### Current State Analysis
- PlannerTab UI exists but shows mock data only
- No backend planner functionality
- AgentConfig has unused planner field
- Inngest/Composio not integrated

## File Impact Analysis

### CREATE (New Files)
- `app/api/workforce/services/inngest-jobs.ts` - Inngest function management
- `app/api/workforce/services/composio-triggers.ts` - Composio trigger management
- `app/api/workforce/services/template-engine.ts` - Template processing
- All planner API routes (6 files)
- Frontend dialogs (3 files)

### MODIFY (Existing Files)
- `_tables/types.ts` - Add ScheduledJob and EventTrigger types
- `PlannerTab.tsx` - Wire to real data

## Deterministic Decisions

### Storage Decisions
- **Job Storage**: In agent config planner.jobs array
- **Trigger Storage**: In agent config planner.triggers array
- **Execution Logs**: Store last 50 executions per job/trigger

### Implementation Decisions
- **Inngest Functions**: Static definition, not dynamic creation
- **Cron Format**: Standard cron expressions (5 fields)
- **Webhook Verification**: Verify Composio signatures
- **Template Variables**: Use {{variable}} syntax
- **Error Handling**: Log failures, retry with exponential backoff

### UI/UX Decisions
- **Cron Presets**: Daily, Weekly, Monthly buttons
- **Test Execution**: "Run Now" button for debugging
- **Execution History**: Show in expandable section
- **Status Indicators**: Active (green), Paused (yellow), Failed (red)

---

## Overview

### Goal

Implement the Planner system that enables agents to execute actions on a schedule (scheduled jobs via Inngest) or in response to external events (event triggers via Composio). Both scheduled jobs and event triggers can either start a chat with a template or execute a workflow.

This transforms agents from reactive chatbots into proactive digital employees that work autonomously.

### Relevant Research

**Current State:**
- PlannerTab UI exists with mock data (JobCard, TriggerCard components)
- No backend functionality - jobs/triggers don't actually work
- AgentConfig type has `planner` field defined but unused

**Inngest Integration:**
- Mastra supports Inngest workflows via `@mastra/inngest`
- Inngest functions can be scheduled with cron expressions
- Functions execute in background, can call workflows or APIs
- Setup: Docker for dev, Inngest cloud for prod

**Composio Triggers:**
- Composio API: `composio.triggers.create()` to create trigger
- Triggers send webhooks to our endpoint when events occur
- Webhook payload includes event data
- Must verify webhook signatures for security

**Chat Execution:**
- Can call chat API programmatically: `POST /api/workforce/[agentId]/chat`
- Need to create thread, format messages, stream response
- Template variables: Replace `{variable}` with actual values

**Workflow Execution:**
- Can execute workflow: `POST /api/workflows/[workflowId]/execute`
- Or use workflow tool execution pattern
- Event data becomes workflow input

**Agent Config Structure:**
- Currently: `AgentConfig` has optional `planner` field
- Need to extend: `planner: { jobs: ScheduledJob[], triggers: EventTrigger[] }`

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `_tables/types.ts` | Modify | Add ScheduledJob and EventTrigger types to AgentConfig | A, B |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workforce/[agentId]/planner/jobs/route.ts` | Create | GET list, POST create scheduled job | A |
| `app/api/workforce/[agentId]/planner/jobs/[jobId]/route.ts` | Create | PATCH update, DELETE job | A |
| `app/api/workforce/[agentId]/planner/triggers/route.ts` | Create | GET list, POST create event trigger | B |
| `app/api/workforce/[agentId]/planner/triggers/[triggerId]/route.ts` | Create | PATCH update, DELETE trigger | B |
| `app/api/workforce/triggers/webhook/route.ts` | Create | POST webhook handler for Composio events | B |
| `app/api/workforce/planner/execute/chat/route.ts` | Create | Internal API to start chat from job/trigger | A, B |
| `app/api/workforce/planner/execute/workflow/route.ts` | Create | Internal API to execute workflow from job/trigger | A, B |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workforce/services/planner-service.ts` | Create | Job/trigger CRUD, Inngest/Composio integration | A, B |
| `app/api/workforce/services/inngest-jobs.ts` | Create | Inngest function creation, scheduling | A |
| `app/api/workforce/services/composio-triggers.ts` | Create | Composio trigger creation, webhook management | B |
| `app/api/workforce/services/template-engine.ts` | Create | Template variable replacement | A, B |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/components/agent-modal/store/slices/plannerSlice.ts` | Create | Planner state (jobs, triggers) | C |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/PlannerTab.tsx` | Modify | Wire up to real data, add create/edit dialogs | C |
| `app/(pages)/workforce/components/agent-modal/components/tabs/PlannerTab/components/CreateJobDialog.tsx` | Create | Dialog for creating/editing scheduled jobs | C |
| `app/(pages)/workforce/components/agent-modal/components/tabs/PlannerTab/components/CreateTriggerDialog.tsx` | Create | Dialog for creating/editing event triggers | C |
| `app/(pages)/workforce/components/agent-modal/components/tabs/PlannerTab/components/CronPicker.tsx` | Create | UI for selecting cron schedule (presets + custom) | C |

---

## Part A: Scheduled Jobs (Inngest Integration)

### Goal

Implement scheduled jobs that execute chat or workflows at specified times using Inngest for background execution.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workforce/services/inngest-jobs.ts` | Create | Inngest function creation and management | ~200 |
| `app/api/workforce/services/template-engine.ts` | Create | Template variable replacement | ~100 |
| `app/api/workforce/planner/execute/chat/route.ts` | Create | Internal endpoint to start chat programmatically | ~150 |
| `app/api/workforce/[agentId]/planner/jobs/route.ts` | Create | CRUD API for scheduled jobs | ~150 |
| `app/api/workforce/[agentId]/planner/jobs/[jobId]/route.ts` | Create | Update/delete job endpoints | ~100 |

### Pseudocode

#### `app/api/workforce/services/inngest-jobs.ts`

```
InngestJobsService
├── createScheduledJob(job: ScheduledJob, agentId: string)
│   ├── Build Inngest function:
│   │   ├── id: `job-${job.id}`
│   │   ├── schedule: cron expression from job.schedule
│   │   └── handler: async () => {
│   │       ├── If job.action === 'chat':
│   │       │   ├── Replace template variables
│   │       │   ├── Call executeChat(agentId, template, variables)
│   │       │   └── Return result
│   │       └── If job.action === 'workflow':
│   │           ├── Get workflow input from job.config
│   │           ├── Call executeWorkflow(workflowId, input)
│   │           └── Return result
│   ├── Register function with Inngest
│   └── Return Inngest function ID
├── updateScheduledJob(jobId: string, updates: Partial<ScheduledJob>)
│   ├── Delete old Inngest function
│   ├── Create new function with updated config
│   └── Return new function ID
└── deleteScheduledJob(jobId: string)
    └── Delete Inngest function
```

#### `app/api/workforce/services/template-engine.ts`

```
TemplateEngine
├── replaceVariables(template: string, variables: Record<string, string>)
│   ├── Find all {variableName} patterns
│   ├── Replace with variables[variableName] or empty string
│   └── Return replaced string
├── getDefaultVariables()
│   ├── Return: { date, time, dayOfWeek, ... }
│   └── Common variables for scheduled jobs
└── getEventVariables(eventData: Record<string, unknown>)
    ├── Extract common fields from Composio event
    ├── Return: { emailSubject, emailFrom, ... }
    └── Event-specific variable extraction
```

#### `app/api/workforce/planner/execute/chat/route.ts`

```
POST /api/workforce/planner/execute/chat
├── Authenticate (internal, use service token)
├── Parse body: { agentId, template, variables?, threadId? }
├── Replace template variables:
│   └── templateEngine.replaceVariables(template, variables)
├── Create agent instance:
│   ├── loadAgentConfig(agentId)
│   ├── buildToolMap(userId, agentConfig)
│   └── createConfiguredAgent(userId, agentConfig, toolMap)
├── Start chat:
│   ├── Create thread (or use provided threadId)
│   ├── Format message: [{ role: "user", content: replacedTemplate }]
│   ├── Stream response (or generate if background)
│   └── Return result
└── Handle errors
```

#### `app/api/workforce/[agentId]/planner/jobs/route.ts`

```
GET /api/workforce/[agentId]/planner/jobs
├── Load agent config
├── Return agentConfig.planner?.jobs || []

POST /api/workforce/[agentId]/planner/jobs
├── Authenticate user
├── Parse body: { name, schedule, action, config }
├── Validate:
│   ├── schedule: valid cron expression
│   ├── action: "chat" | "workflow"
│   └── config: valid for action type
├── Create job object:
│   ├── id: generateId()
│   ├── name, schedule, action, config
│   └── createdAt, updatedAt
├── Create Inngest function:
│   └── inngestJobsService.createScheduledJob(job, agentId)
├── Update agent config:
│   ├── Add job to planner.jobs array
│   └── Save config file
└── Return { job, inngestFunctionId }
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | User can create scheduled job | POST to /jobs, verify job created |
| AC-A.2 | Job stored in agent config | Verify planner.jobs contains new job |
| AC-A.3 | Inngest function created | Verify function exists in Inngest dashboard |
| AC-A.4 | Job executes at scheduled time | Wait for cron time, verify execution |
| AC-A.5 | Chat template variables replaced | Verify {date}, {time} replaced in message |
| AC-A.6 | Workflow executes with correct input | Verify workflow receives event data |
| AC-A.7 | Job can be updated | PATCH job, verify Inngest function updated |
| AC-A.8 | Job can be deleted | DELETE job, verify removed from config and Inngest |

---

## Part B: Event Triggers (Composio Integration)

### Goal

Implement event triggers that execute chat or workflows when external events occur (via Composio webhooks).

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workforce/services/composio-triggers.ts` | Create | Composio trigger creation and management | ~200 |
| `app/api/workforce/triggers/webhook/route.ts` | Create | Webhook handler for Composio events | ~150 |
| `app/api/workforce/[agentId]/planner/triggers/route.ts` | Create | CRUD API for event triggers | ~150 |
| `app/api/workforce/[agentId]/planner/triggers/[triggerId]/route.ts` | Create | Update/delete trigger endpoints | ~100 |

### Pseudocode

#### `app/api/workforce/services/composio-triggers.ts`

```
ComposioTriggersService
├── createTrigger(trigger: EventTrigger, userId: string, agentId: string)
│   ├── Get Composio entity for user
│   ├── Call Composio API:
│   │   └── composio.triggers.create({
│   │       slug: trigger.event,
│   │       userId: entityId,
│   │       triggerConfig: trigger.filters,
│   │       webhookUrl: `${baseUrl}/api/workforce/triggers/webhook`
│   │     })
│   ├── Store composioTriggerId in trigger config
│   └── Return trigger with composioTriggerId
├── updateTrigger(triggerId: string, updates: Partial<EventTrigger>)
│   ├── Get existing trigger
│   ├── Update in Composio (if event/filters changed)
│   └── Update local config
└── deleteTrigger(triggerId: string, composioTriggerId: string)
    ├── Delete from Composio
    └── Remove from agent config
```

#### `app/api/workforce/triggers/webhook/route.ts`

```
POST /api/workforce/triggers/webhook
├── Verify Composio webhook signature:
│   ├── Get signature from headers
│   ├── Compute expected signature
│   └── Compare (fail if mismatch)
├── Parse webhook payload:
│   ├── type: trigger event type
│   ├── data: event data
│   └── log_id: unique event ID
├── Look up trigger:
│   ├── Find trigger with matching event type
│   ├── Get associated agentId
│   └── Get action config
├── Execute action:
│   ├── If action === 'chat':
│   │   ├── Extract variables from event data
│   │   ├── Replace template variables
│   │   └── Call executeChat(agentId, template, variables)
│   └── If action === 'workflow':
│       ├── Map event data to workflow input
│       └── Call executeWorkflow(workflowId, input)
├── Log execution result
└── Return 200 OK
```

#### `app/api/workforce/[agentId]/planner/triggers/route.ts`

```
GET /api/workforce/[agentId]/planner/triggers
├── Load agent config
├── Return agentConfig.planner?.triggers || []

POST /api/workforce/[agentId]/planner/triggers
├── Authenticate user
├── Parse body: { name, event, filters?, action, config }
├── Validate:
│   ├── event: valid Composio event slug
│   ├── action: "chat" | "workflow"
│   └── config: valid for action type
├── Create trigger in Composio:
│   └── composioTriggersService.createTrigger(trigger, userId, agentId)
├── Create trigger object:
│   ├── id: generateId()
│   ├── name, event, filters, action, config
│   ├── composioTriggerId: from Composio response
│   └── createdAt, updatedAt
├── Update agent config:
│   ├── Add trigger to planner.triggers array
│   └── Save config file
└── Return { trigger, composioTriggerId }
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | User can create event trigger | POST to /triggers, verify trigger created |
| AC-B.2 | Trigger registered with Composio | Verify trigger exists in Composio dashboard |
| AC-B.3 | Webhook URL configured | Verify Composio has correct webhook URL |
| AC-B.4 | Webhook receives events | Send test webhook, verify received |
| AC-B.5 | Webhook signature verified | Invalid signature rejected |
| AC-B.6 | Trigger executes chat on event | Event fires, verify chat started |
| AC-B.7 | Trigger executes workflow on event | Event fires, verify workflow executed |
| AC-B.8 | Event data mapped to template/workflow | Verify variables/input populated correctly |
| AC-B.9 | Trigger can be updated | PATCH trigger, verify Composio updated |
| AC-B.10 | Trigger can be deleted | DELETE trigger, verify removed from Composio and config |

---

## Part C: Frontend UI for Planner

### Goal

Build the UI for creating, editing, and managing scheduled jobs and event triggers in the Planner tab.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/PlannerTab.tsx` | Modify | Connect to real API, add create/edit functionality | ~150 |
| `app/(pages)/workforce/components/agent-modal/components/tabs/PlannerTab/components/CreateJobDialog.tsx` | Create | Dialog for creating/editing jobs | ~200 |
| `app/(pages)/workforce/components/agent-modal/components/tabs/PlannerTab/components/CreateTriggerDialog.tsx` | Create | Dialog for creating/editing triggers | ~250 |
| `app/(pages)/workforce/components/agent-modal/components/tabs/PlannerTab/components/CronPicker.tsx` | Create | Cron schedule selector UI | ~150 |
| `app/(pages)/workforce/components/agent-modal/store/slices/plannerSlice.ts` | Create | Planner state management | ~120 |

### Pseudocode

#### `app/(pages)/workforce/components/agent-modal/components/tabs/PlannerTab.tsx` (modifications)

```
PlannerTab
├── Load jobs/triggers from API:
│   ├── useEffect: fetchJobs(), fetchTriggers()
│   └── Store in plannerSlice
├── "+ Add Job" button:
│   └── Opens CreateJobDialog
├── "+ Add Trigger" button:
│   └── Opens CreateTriggerDialog
├── Job cards:
│   ├── Show job details (name, schedule, action)
│   ├── Edit button → opens CreateJobDialog (edit mode)
│   ├── Delete button → confirms and deletes
│   └── Status indicator (active, next run time)
└── Trigger cards:
    ├── Show trigger details (name, event, action)
    ├── Edit button → opens CreateTriggerDialog (edit mode)
    ├── Delete button → confirms and deletes
    ├── Test button → manually fires trigger
    └── Status indicator (active, last fired)
```

#### `app/(pages)/workforce/components/agent-modal/components/tabs/PlannerTab/components/CreateJobDialog.tsx`

```
CreateJobDialog({ job?, onSave, onCancel })
├── Form fields:
│   ├── Name: text input
│   ├── Schedule: CronPicker component
│   ├── Action Type: radio buttons (Start Chat | Execute Workflow)
│   ├── If "Start Chat":
│   │   ├── Template: textarea
│   │   └── Variables help text
│   └── If "Execute Workflow":
│       └── Workflow selector dropdown
├── Validation:
│   ├── Name required
│   ├── Schedule valid cron
│   └── Template/workflow required
├── On save:
│   ├── POST/PATCH to /api/workforce/[agentId]/planner/jobs
│   ├── Show loading state
│   ├── On success: close dialog, refresh list
│   └── On error: show error message
└── Render dialog with form
```

#### `app/(pages)/workforce/components/agent-modal/components/tabs/PlannerTab/components/CreateTriggerDialog.tsx`

```
CreateTriggerDialog({ trigger?, onSave, onCancel })
├── Form fields:
│   ├── Name: text input
│   ├── Event Source: dropdown (Gmail, Slack, GitHub, etc.)
│   ├── Event Type: dropdown (filtered by source)
│   ├── Filters: (optional) JSON editor or form
│   ├── Action Type: radio buttons (Start Chat | Execute Workflow)
│   ├── If "Start Chat":
│   │   ├── Template: textarea
│   │   └── Show available event variables
│   └── If "Execute Workflow":
│       └── Workflow selector dropdown
├── Load available events:
│   └── GET /api/connections/available/toolkits/[source]/triggers
├── Validation and save (similar to CreateJobDialog)
└── Render dialog with form
```

#### `app/(pages)/workforce/components/agent-modal/components/tabs/PlannerTab/components/CronPicker.tsx`

```
CronPicker({ value, onChange })
├── Preset buttons:
│   ├── "Daily at 9am" → "0 9 * * *"
│   ├── "Every Monday at 9am" → "0 9 * * 1"
│   ├── "Every hour" → "0 * * * *"
│   └── "Custom" → shows cron input
├── Custom cron input:
│   ├── Text input with validation
│   └── Help text: "Format: minute hour day month weekday"
├── Preview:
│   └── Show human-readable: "Runs daily at 9:00 AM"
└── Validate cron expression
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-C.1 | Jobs load from API | Verify jobs appear in list |
| AC-C.2 | Triggers load from API | Verify triggers appear in list |
| AC-C.3 | Create job dialog works | Fill form, save, verify job created |
| AC-C.4 | Create trigger dialog works | Fill form, save, verify trigger created |
| AC-C.5 | Cron picker shows presets | Click preset, verify cron set |
| AC-C.6 | Edit job works | Click edit, modify, save, verify updated |
| AC-C.7 | Edit trigger works | Click edit, modify, save, verify updated |
| AC-C.8 | Delete job works | Click delete, confirm, verify removed |
| AC-C.9 | Delete trigger works | Click delete, confirm, verify removed |
| AC-C.10 | Template variables shown | In chat template, show available variables |

---

## User Flows

### Flow 1: Create Scheduled Job

```
1. User clicks "+ Add Job"
2. Dialog opens
3. User enters:
   - Name: "Morning Briefing"
   - Schedule: "Daily at 9am" (preset)
   - Action: "Start Chat"
   - Template: "Good morning! Here's today's agenda: {agenda}"
4. User clicks "Create"
5. System creates job, shows in list
6. Job executes next day at 9am
```

### Flow 2: Create Event Trigger

```
1. User clicks "+ Add Trigger"
2. Dialog opens
3. User selects:
   - Event Source: "Gmail"
   - Event Type: "New Email"
   - Action: "Execute Workflow"
   - Workflow: "analyze-email"
4. User clicks "Create"
5. System creates Composio trigger, shows in list
6. When email arrives, workflow executes
```

---

## Out of Scope

- **Complex templating**: Only simple variable replacement
- **Multiple actions**: One job/trigger = one action
- **Job dependencies**: Jobs that depend on other jobs
- **Execution history UI**: View past executions (use Inngest/Composio dashboards)
- **Trigger testing UI**: Manual trigger firing (future)

---

## Open Questions

- [ ] How to handle Inngest dev setup? (Docker? Local server?)
- [ ] What's the webhook URL strategy? (Environment variable? Dynamic?)
- [ ] Should we show execution history in UI? (Probably not for MVP)
- [ ] How to handle template variable discovery? (Show available vars based on event type?)
- [ ] Should jobs/triggers be pausable? (Probably yes, add later)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| YYYY-MM-DD | Initial creation | TBD |
