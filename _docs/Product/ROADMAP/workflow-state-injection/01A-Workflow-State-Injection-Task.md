# Task: Workflow State Injection & Deterministic Inputs

**Status:** Not Started  
**Roadmap:** `_docs/Product/ROADMAP/workflow-state-injection/01-Workflow-State-Injection.md`  
**Research Log:** `_docs/Product/ROADMAP/workflow-state-injection/01B-Workflow-State-Injection-Research.md`  
**Assigned:** TBD  
**Started:** YYYY-MM-DD  
**Completed:** YYYY-MM-DD

---

## Validation

### Approach Validation
✅ **Mastra supports initialState natively** - `run.start({ initialState })` API confirmed
✅ **State schema uses Zod** - Type-safe validation available
✅ **State persists across suspend/resume** - Automatic persistence confirmed
✅ **Fixed inputs merge pattern works** - Object spread for precedence

### Current State Analysis
- Workflow bindings have no fixedInputs or initialState fields
- Triggers don't pass data to workflows
- No UI for configuring fixed inputs
- State injection not implemented

## Deterministic Decisions

### Storage Decisions
- **Fixed Inputs**: Stored in `WorkflowBinding.fixedInputs`
- **Initial State**: Stored in `WorkflowBinding.initialState`
- **Input Mapping**: Stored in trigger `inputMapping` field
- **Merge Order**: Fixed → Trigger → Runtime (later wins)

### Implementation Decisions
- **Validation**: Use Zod schemas from workflow definitions
- **State Access**: Via `workflow.stateSchema` property
- **UI Location**: In WorkflowEditorPanel component
- **Auto-mapping**: Match field names when no manual mapping

---

## Overview

### Goal

Implement support for deterministic workflow inputs and initial state injection, enabling workflows to receive fixed inputs (e.g., always send to personal email) and trigger-based data (e.g., Slack message content) while supporting Mastra's `initialState` pattern for shared state across workflow steps.

### Relevant Research

**Current Workflow Execution:**
- Workflows are executed via `run.start({ inputData })` in `app/api/tools/services/workflow-tools.ts`
- Input data comes from agent tool calls, filtered to remove Mastra-injected keys
- Runtime context is a `Map<string, unknown>` containing connections and userId
- Workflow bindings are stored in `AgentConfig.workflows` as `WorkflowBinding[]`

**Mastra State Pattern:**
- Mastra supports `run.start({ inputData, initialState })` for initial state
- Workflows can define `stateSchema` on workflow and steps
- State persists across suspend/resume cycles
- State is shared across all steps via `state` and `setState`

**Workflow Binding Structure:**
- `WorkflowBinding` in `_tables/types.ts` contains `workflowId`, `connectionBindings`, etc.
- No current support for fixed inputs or initial state
- Bindings are configured in agent capabilities UI

**Planner System:**
- Planner supports scheduled jobs and event triggers (see `01-Planner-System.md`)
- Triggers can execute workflows but don't currently pass trigger data
- Scheduled jobs can start chats with templates but workflow execution needs input configuration

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `_tables/types.ts` | Modify | Add `fixedInputs` and `initialState` to `WorkflowBinding` | A |
| `_tables/types.ts` | Modify | Add trigger data mapping types for event triggers | B |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/tools/services/workflow-tools.ts` | Modify | Merge fixed inputs with runtime inputs, support `initialState` | A |
| `app/api/workflows/services/workflow-loader.ts` | Modify | Extract stateSchema from workflow definitions | A |
| `app/api/workforce/services/agent-config.ts` | Modify | Validate fixed inputs against workflow inputSchema | A |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/services/workflow-builder.ts` | Modify | Preserve stateSchema in workflow definitions | A |
| `app/api/planner/services/trigger-executor.ts` | Create | Execute workflows with trigger data mapping | B |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/components/agent-modal/store/slices/capabilitiesSlice.ts` | Modify | Store fixed inputs and initial state in workflow bindings | A |
| `app/(pages)/workforce/components/agent-modal/store/types.ts` | Modify | Add types for fixed inputs configuration | A |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workforce/components/agent-modal/components/tabs/CapabilitiesTab.tsx` | Modify | Show fixed inputs configuration UI | A |
| `app/(pages)/workforce/components/WorkflowEditorPanel.tsx` | Modify | Add UI for configuring fixed inputs per workflow binding | A |
| `app/(pages)/planner/components/TriggerDialog.tsx` | Modify | Add input mapping UI for event triggers | B |

---

## Part A: Fixed Inputs & Initial State Support

### Goal

Enable workflows to receive fixed inputs (pre-configured values) and initial state (Mastra pattern) when executed, stored in workflow bindings and applied at execution time.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `_tables/types.ts` | Modify | Add `fixedInputs?: Record<string, unknown>` and `initialState?: Record<string, unknown>` to `WorkflowBinding` | ~10 |
| `app/api/tools/services/workflow-tools.ts` | Modify | Merge fixed inputs with runtime inputs, pass `initialState` to `run.start()` | ~30 |
| `app/api/workflows/services/workflow-loader.ts` | Modify | Extract and return `stateSchema` from workflow definitions | ~20 |
| `app/api/workforce/services/agent-config.ts` | Modify | Validate fixed inputs against workflow's `inputSchema` | ~25 |
| `app/(pages)/workforce/components/agent-modal/store/types.ts` | Modify | Add types for fixed inputs configuration in UI state | ~15 |
| `app/(pages)/workforce/components/agent-modal/store/slices/capabilitiesSlice.ts` | Modify | Handle fixed inputs and initial state in workflow binding updates | ~40 |
| `app/(pages)/workforce/components/agent-modal/components/tabs/CapabilitiesTab.tsx` | Modify | Show fixed inputs indicator and link to configuration | ~20 |
| `app/(pages)/workforce/components/WorkflowEditorPanel.tsx` | Modify | Add UI for configuring fixed inputs per workflow binding | ~80 |

### Pseudocode

#### `_tables/types.ts`

```typescript
export interface WorkflowBinding {
  workflowId: string;
  connectionBindings: Record<string, string>;
  fixedInputs?: Record<string, unknown>;  // ← NEW: Pre-configured input values
  initialState?: Record<string, unknown>; // ← NEW: Initial state for workflow
}
```

#### `app/api/tools/services/workflow-tools.ts`

```typescript
async (input: Record<string, unknown>) => {
  // ... existing input filtering ...
  
  // Merge fixed inputs with runtime inputs (runtime takes precedence)
  const mergedInput = {
    ...binding.fixedInputs,  // ← Fixed inputs from binding
    ...workflowInput          // ← Runtime inputs (overrides fixed)
  };
  
  // Extract initial state from binding
  const initialState = binding.initialState || {};
  
  // Execute workflow with merged inputs and initial state
  const run = await workflowExec.createRunAsync({ resourceId: userId });
  const result = await run.start({
    inputData: mergedInput,      // ← Merged inputs
    initialState: initialState   // ← Initial state (Mastra pattern)
  });
  
  // ... rest of execution ...
}
```

#### `app/api/workflows/services/workflow-loader.ts`

```typescript
export async function getWorkflowMetadata(workflowId: string) {
  const workflow = await getWorkflowExecutable(workflowId);
  
  // Extract stateSchema if workflow has it
  const stateSchema = (workflow as any)?.stateSchema || null;
  
  return {
    // ... existing metadata ...
    stateSchema  // ← NEW: Return stateSchema for UI validation
  };
}
```

#### `app/(pages)/workforce/components/WorkflowEditorPanel.tsx`

```typescript
function WorkflowEditorPanel({ binding, workflowMetadata }) {
  const [fixedInputs, setFixedInputs] = useState(binding.fixedInputs || {});
  
  // Render input fields from workflow.inputSchema
  const inputFields = Object.entries(workflowMetadata.inputSchema.shape || {});
  
  return (
    <Dialog>
      {/* ... existing UI ... */}
      
      <Section title="Fixed Inputs">
        <p>Configure inputs that will always be used for this workflow</p>
        {inputFields.map(([key, schema]) => (
          <InputField
            key={key}
            label={key}
            value={fixedInputs[key]}
            onChange={(value) => setFixedInputs({ ...fixedInputs, [key]: value })}
            checkbox="Use default value"
          />
        ))}
      </Section>
      
      <Button onClick={() => saveBinding({ ...binding, fixedInputs })}>
        Save
      </Button>
    </Dialog>
  );
}
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Fixed inputs are stored in `WorkflowBinding` | Create workflow binding with fixed inputs, verify stored in agent config |
| AC-A.2 | Fixed inputs are merged with runtime inputs at execution | Execute workflow with fixed input "Email": "test@example.com" and runtime input "Email": "override@example.com", verify override wins |
| AC-A.3 | Initial state is passed to workflow execution | Execute workflow with initialState, verify workflow steps receive state via `state` parameter |
| AC-A.4 | UI shows fixed inputs configuration | Open workflow editor panel, verify fixed inputs section with input fields |
| AC-A.5 | Fixed inputs are validated against workflow inputSchema | Try to save invalid fixed input (wrong type), verify validation error |
| AC-A.6 | Existing workflows without fixed inputs continue to work | Execute workflow without fixed inputs, verify normal execution |

---

## Part B: Trigger Data Mapping

### Goal

Enable event triggers to automatically map trigger data (e.g., Slack message content) to workflow inputs, with support for manual field mapping configuration.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `_tables/types.ts` | Modify | Add `inputMapping?: Record<string, string>` to trigger/job types | ~10 |
| `app/api/planner/services/trigger-executor.ts` | Create | Execute workflows with trigger data mapping | ~60 |
| `app/(pages)/planner/components/TriggerDialog.tsx` | Modify | Add input mapping UI for event triggers executing workflows | ~50 |
| `app/(pages)/planner/components/JobDialog.tsx` | Modify | Add input configuration UI for scheduled jobs executing workflows | ~40 |

### Pseudocode

#### `_tables/types.ts`

```typescript
export interface EventTrigger {
  id: string;
  name: string;
  triggerType: "record_added" | "slack_message" | "email_received";
  workflowId?: string;
  inputMapping?: Record<string, string>;  // ← NEW: Map trigger fields to workflow inputs
  // ... existing fields ...
}

export interface ScheduledJob {
  id: string;
  name: string;
  schedule: string;
  workflowId?: string;
  workflowInputs?: Record<string, unknown>;  // ← NEW: Fixed inputs for workflow
  // ... existing fields ...
}
```

#### `app/api/planner/services/trigger-executor.ts`

```typescript
export async function executeWorkflowFromTrigger(
  workflowId: string,
  trigger: EventTrigger,
  triggerData: Record<string, unknown>
) {
  // Load workflow
  const workflow = await getWorkflowExecutable(workflowId);
  
  // Map trigger data to workflow inputs
  const workflowInput: Record<string, unknown> = {};
  
  if (trigger.inputMapping) {
    // Manual mapping: { "workflowInputField": "triggerDataField" }
    for (const [workflowField, triggerField] of Object.entries(trigger.inputMapping)) {
      workflowInput[workflowField] = triggerData[triggerField];
    }
  } else {
    // Auto-mapping: match field names
    const workflowSchema = workflow.inputSchema;
    for (const field of Object.keys(workflowSchema.shape || {})) {
      if (triggerData[field] !== undefined) {
        workflowInput[field] = triggerData[field];
      }
    }
  }
  
  // Get workflow binding for fixed inputs
  const binding = await getWorkflowBinding(workflowId);
  
  // Merge fixed inputs with mapped trigger data
  const mergedInput = {
    ...binding?.fixedInputs,
    ...workflowInput
  };
  
  // Execute workflow
  const run = await workflow.createRunAsync({ resourceId: trigger.userId });
  const result = await run.start({
    inputData: mergedInput,
    initialState: binding?.initialState || {}
  });
  
  return result;
}
```

#### `app/(pages)/planner/components/TriggerDialog.tsx`

```typescript
function TriggerDialog({ trigger, workflowMetadata }) {
  const [inputMapping, setInputMapping] = useState(trigger.inputMapping || {});
  
  // Get available trigger data fields (based on trigger type)
  const triggerFields = getTriggerFields(trigger.triggerType);
  
  // Get workflow input fields
  const workflowFields = Object.keys(workflowMetadata.inputSchema.shape || {});
  
  return (
    <Dialog>
      {/* ... existing trigger configuration ... */}
      
      {trigger.actionType === "workflow" && (
        <Section title="Input Mapping">
          <p>Map trigger data to workflow inputs</p>
          {workflowFields.map((workflowField) => (
            <Select
              key={workflowField}
              label={workflowField}
              value={inputMapping[workflowField]}
              options={triggerFields}
              onChange={(value) => setInputMapping({ ...inputMapping, [workflowField]: value })}
            />
          ))}
        </Section>
      )}
    </Dialog>
  );
}
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Trigger data is mapped to workflow inputs automatically | Create trigger for Slack message → workflow, verify message content mapped to workflow input |
| AC-B.2 | Manual input mapping overrides auto-mapping | Configure manual mapping, verify custom field mapping used |
| AC-B.3 | Trigger data is merged with fixed inputs | Trigger with mapped data + workflow with fixed input, verify both applied |
| AC-B.4 | UI shows input mapping configuration | Open trigger dialog for workflow execution, verify input mapping section |
| AC-B.5 | Scheduled jobs can configure workflow inputs | Create scheduled job executing workflow, verify input configuration UI |

---

## User Flows

### Flow 1: Configure Fixed Inputs

```
1. User opens Agent Modal → Capabilities → Workflows → "Manage" on workflow
2. WorkflowEditorPanel opens showing workflow inputs
3. User checks "Use default value" for "Email Address"
4. User enters "zen@example.com" as default
5. User saves binding
6. System validates input against workflow.inputSchema
7. Fixed input stored in WorkflowBinding.fixedInputs
8. Next workflow execution uses fixed input (unless overridden)
```

### Flow 2: Event Trigger with Data Mapping

```
1. User creates event trigger: "Slack message received"
2. User selects "Execute Workflow: Research and Summarize"
3. System shows input mapping UI:
   - Workflow input "query" → Map to trigger field "message"
   - Workflow input "source" → Map to trigger field "channel"
4. User saves trigger
5. When Slack message arrives:
   - Trigger executor extracts: { message: "...", channel: "#general" }
   - Maps to workflow input: { query: message, source: channel }
   - Executes workflow with mapped inputs + any fixed inputs
```

### Flow 3: Workflow with Initial State

```
1. User creates workflow with stateSchema: { processedCount: number }
2. User configures workflow binding with initialState: { processedCount: 0 }
3. Workflow executes:
   - run.start({ inputData: {...}, initialState: { processedCount: 0 } })
   - First step receives state.processedCount = 0
   - Step updates: setState({ processedCount: 1 })
   - Subsequent steps see processedCount = 1
```

---

## Out of Scope

- **State persistence across workflow runs** - State only persists within single execution
- **Complex trigger data transformations** - Simple field mapping only, no custom logic
- **Workflow input templates with variables** - Fixed values only, not template strings
- **State visualization UI** - No UI for viewing state during execution
- **Workflow state history** - No tracking of state changes across executions

---

## Open Questions

- [ ] Should fixed inputs be editable per workflow binding, or only at workflow definition?
- [ ] How should we handle validation errors for fixed inputs? Show in UI or at execution?
- [ ] Should trigger data mapping support nested fields (e.g., `triggerData.message.content`)?
- [ ] Do we need UI for configuring `initialState`, or is it only set programmatically?
- [ ] Should fixed inputs be visible in workflow editor, or only in agent capabilities?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| YYYY-MM-DD | Initial creation | TBD |
