# Workflow State Injection & Deterministic Inputs

**Status:** Draft  
**Priority:** P1  
**North Star:** Enables workflows to receive deterministic inputs for scheduled jobs and event triggers, making workflows reusable with fixed configurations (e.g., always send to personal email) while still accepting dynamic trigger data (e.g., Slack message content).

---

## Problem Statement

Workflows currently require all inputs to be provided at execution time, which creates friction for two critical use cases:

1. **Scheduled Jobs & Event Triggers**: When workflows are triggered by the Planner system (scheduled jobs or event triggers), we need to pass deterministic data:
   - **Trigger-level data**: Event-specific data (e.g., Slack message content, email body, new record data)
   - **Workflow-level defaults**: Values that should always be injected (e.g., always send to personal email, always use specific connection IDs)

2. **Workflow Reusability**: Workflows like "Send Site Content to Email" should be composable with:
   - Abstract inputs (e.g., "some string for the message") that can be filled by triggers
   - Fixed values (e.g., "always use my personal email address") that don't need to be specified each time

Currently, workflows must receive all inputs through `inputData` at execution time. There's no way to:
- Pre-configure certain inputs for a workflow binding
- Inject initial state (like Mastra's `initialState`) that persists across workflow steps
- Pass trigger context (e.g., Slack message) as workflow input automatically

---

## User Value

- **Deterministic workflow execution** - Workflows can have fixed inputs that don't need to be specified each time
- **Trigger context injection** - Event triggers automatically pass relevant data (Slack message, email content, record data) to workflows
- **Workflow configuration** - Users can configure workflows with default values when assigning them to agents
- **Better workflow composition** - Workflows can be designed with abstract inputs that get filled by triggers or fixed values
- **Scheduled job support** - Scheduled jobs can execute workflows with pre-configured inputs
- **Event-driven automation** - Event triggers can pass event data directly to workflows without manual mapping

---

## User Flows

### Flow 1: Configure Workflow with Fixed Inputs

```
1. User opens Agent Modal → Capabilities tab → Workflows section
2. User clicks "Manage" next to a workflow (e.g., "Send Site Content to Email")
3. Dialog opens showing workflow configuration:
   - Workflow name and description
   - Input fields from workflow's inputSchema:
     * "Email Address" [text input] [x] Use default value
       Default: "zen@example.com" (user's email)
     * "Website URL" [text input] [ ] Use default value
       (empty - will be provided at runtime)
4. User sets "Email Address" to always use their personal email
5. User saves configuration
6. Workflow binding now has fixed input: { "Email Address": "zen@example.com" }
```

### Flow 2: Event Trigger with Dynamic Input

```
1. User opens Agent Modal → Planner tab → Event Triggers section
2. User clicks "+ Add Trigger"
3. Dialog opens:
   - Name: "New Slack Message"
   - Trigger: "When Slack message received in #general"
   - Action: [x] Execute Workflow [ ] Start Chat
   - Workflow: "Research and Summarize"
   - Input Mapping:
     * "Message Content" → Workflow input "query" (auto-mapped from trigger)
     * "Channel" → Workflow input "source" (auto-mapped from trigger)
4. User saves trigger
5. When Slack message arrives:
   - Trigger fires
   - Event data extracted: { message: "...", channel: "#general" }
   - Workflow executes with: { query: message, source: channel }
```

### Flow 3: Scheduled Job with Template Input

```
1. User opens Agent Modal → Planner tab → Scheduled Jobs section
2. User clicks "+ Add Job"
3. Dialog opens:
   - Name: "Morning Briefing"
   - Schedule: "09:00 AM • Daily"
   - Action: [x] Start Chat [ ] Execute Workflow
   - Template: "Good morning. Here are the tasks for today: {tasks}"
   - (If workflow selected, shows workflow input configuration)
4. User saves job
5. At 9am daily:
   - Job executes
   - Template rendered with context (e.g., {tasks} filled from records)
   - Chat started with rendered message OR workflow executed with mapped inputs
```

### Flow 4: Workflow with Initial State

```
1. User creates workflow "Process Leads" with stateSchema:
   - processedCount: number
   - processedIds: string[]
2. User configures workflow binding with:
   - Fixed inputs: { "Email Address": "sales@company.com" }
   - Initial state: { processedCount: 0, processedIds: [] }
3. Workflow executes:
   - First step receives inputData + initialState
   - Steps can read/update state via state and setState
   - State persists across suspend/resume cycles
```

---

## Code Areas

Domains/directories to research before implementation:

| Area | Purpose | Key Files to Study |
|------|---------|-------------------|
| `app/api/workflows/` | Workflow execution and runtime | `services/workflow-loader.ts`, `services/workflow-builder.ts` |
| `app/api/tools/services/workflow-tools.ts` | Workflow tool execution | `workflow-tools.ts` |
| `app/api/workforce/` | Agent configuration and bindings | `services/agent-config.ts`, `[agentId]/` routes |
| `app/(pages)/workforce/` | Agent modal UI | `components/agent-modal/`, `store/` |
| `_tables/workflows/` | Workflow definitions and registry | `registry.ts`, `wf-*/workflow.ts` |
| `_tables/types.ts` | Type definitions | `WorkflowBinding`, `AgentConfig` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State injection mechanism | Support both `inputData` defaults and `initialState` (Mastra pattern) | `inputData` for workflow inputs, `initialState` for shared state across steps |
| Configuration storage | Store fixed inputs in `WorkflowBinding` object | Keeps configuration with the binding, easy to access at execution time |
| Trigger data mapping | Auto-map common trigger fields to workflow inputs | Reduces manual configuration, but allow manual override |
| Initial state schema | Define `stateSchema` on workflow (Mastra pattern) | Aligns with Mastra's workflow state model |
| Backward compatibility | Existing workflows without state/defaults continue to work | No breaking changes for current workflows |

---

## Constraints

- **Mastra API**: Must use Mastra's `run.start({ inputData, initialState })` API for state injection
- **Workflow registry**: Workflow definitions are transpiled and stored in `_tables/workflows/`
- **Type safety**: Workflow input schemas are Zod schemas, must validate fixed inputs
- **Runtime context**: Already uses `Map<string, unknown>` for connections, must preserve this
- **Backward compatibility**: Existing workflow executions must continue to work without changes

---

## Success Criteria

- [ ] Users can configure fixed inputs for workflows in the agent capabilities UI
- [ ] Fixed inputs are stored in `WorkflowBinding` and applied at execution time
- [ ] Event triggers can map trigger data to workflow inputs automatically
- [ ] Scheduled jobs can execute workflows with pre-configured inputs
- [ ] Workflows support `initialState` for shared state across steps (Mastra pattern)
- [ ] Workflow execution merges fixed inputs with runtime inputs (runtime takes precedence)
- [ ] UI shows which inputs are fixed vs. required at runtime
- [ ] Existing workflows without fixed inputs continue to work unchanged

---

## Out of Scope

- **Workflow state persistence across runs** - State only persists within a single workflow execution
- **Dynamic input validation UI** - Input validation happens at execution time, not in UI
- **Complex trigger data transformations** - Simple field mapping only, no custom transformation logic
- **Workflow input templates** - Fixed values only, not template strings with variables
- **State visualization** - No UI for viewing workflow state during execution (future enhancement)

---

## Open Questions

- [ ] Should fixed inputs be editable per workflow binding, or only at workflow definition level?
- [ ] How should we handle conflicts between fixed inputs and runtime inputs? (Runtime should win)
- [ ] Should trigger data mapping be automatic based on field names, or require explicit configuration?
- [ ] Do we need UI for configuring `initialState`, or is it only set programmatically?
- [ ] Should fixed inputs be visible in the workflow editor, or only in agent capabilities?

---

## References

- [Mastra Workflow State Documentation](https://mastra.ai/docs/workflows/workflow-state) - Initial state and state management patterns
- `_docs/Product/ROADMAP/planner/01-Planner-System.md` - Scheduled jobs and event triggers
- `app/api/tools/services/workflow-tools.ts` - Current workflow execution implementation
- `_tables/workflows/wf-auUlyla9_YGv/workflow.ts` - Example workflow with inputSchema
