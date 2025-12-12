# Direct Workflow Execution from Editor

**Status:** Draft
**Priority:** P0
**North Star:** User clicks "Run" in workflow editor, fills in inputs via modal, watches real-time step progress, sees final output—all without leaving the editor or assigning to an agent.

---

## Problem Statement

Currently, to test or execute a workflow, users must:

1. Save the workflow
2. Navigate to Workforce
3. Open an agent's Capabilities tab
4. Assign the workflow with connection bindings
5. Navigate to the agent's Chat
6. Describe the task to the agent
7. Wait for the agent to interpret and execute

This friction makes iteration slow and debugging difficult. Users can't quickly test if their workflow works.

**The Gap:** No way to execute a workflow directly from the editor.

---

## User Value

- **Fast iteration** — Test changes immediately without context switching
- **Deterministic testing** — Same inputs = same execution (no LLM interpretation variance)
- **Debug visibility** — See exactly what each step produces as it happens
- **Reduced cognitive load** — Stay in the editor, stay in flow

---

## User Flows

### Flow 1: Execute Workflow with Inputs

```
1. User is editing workflow in editor
2. User clicks "Run" button (next to Save)
3. Modal appears: "Run Workflow"
4. If workflow has runtime inputs:
   - Form generated from inputSchema
   - User fills in values (e.g., "Email Address", "Website URL")
   - Default values pre-filled if defined
5. User clicks "Execute"
6. Modal transitions to execution view:
   - Shows workflow steps list
   - Current step highlighted with spinner
   - Completed steps show checkmark + output preview
   - Failed steps show error details
7. On completion:
   - Success: Final output displayed
   - Failed: Error details with failed step highlighted
8. User can close modal and return to editing
```

### Flow 2: Execute Workflow without Inputs

```
1. User clicks "Run"
2. Workflow has no runtime inputs
3. Modal skips input form, goes directly to execution view
4. Execution proceeds as above
```

### Flow 3: Connection Resolution

```
1. User clicks "Run"
2. System checks required connections (from workflow metadata)
3. If any connection not bound:
   - Modal shows "Missing Connections" warning
   - Lists required toolkits without bindings
   - User can select from their connected accounts
4. Once all connections bound, execution proceeds
```

---

## Technical Approach

### Execution Pattern (from existing workflow-tools.ts)

```typescript
// 1. Load workflow from registry
const workflow = getWorkflowFromRegistry(workflowId);

// 2. Create runtime context (Map, not object!)
const runtimeContext = new Map<string, unknown>();
runtimeContext.set("connections", connectionBindings);
runtimeContext.set("userId", userId);

// 3. Create run instance
const run = await workflow.createRunAsync({ resourceId: userId });

// 4. Execute with streaming
const stream = await run.streamVNext({ inputData });

// 5. Process stream events
for await (const chunk of stream) {
  // Emit progress to client via SSE
}
```

### Streaming Pattern (from Mastra docs)

Steps can emit custom events via `writer`:
```typescript
execute: async ({ inputData, writer }) => {
  await writer?.write({ type: "step-start", stepId: "abc" });
  // ... do work ...
  await writer?.write({ type: "step-complete", stepId: "abc", output: result });
  return result;
}
```

---

## Success Criteria

- [ ] "Run" button appears in editor header
- [ ] Modal opens with input form (schema-driven)
- [ ] Execution starts when user clicks "Execute"
- [ ] Real-time progress shown (current step, completed steps)
- [ ] Completed steps show output preview
- [ ] Failed steps show error details
- [ ] Final output displayed on completion
- [ ] User can close modal and return to editing

---

## Out of Scope (Phase 1)

- Saving execution history
- Comparing execution results
- Scheduled/triggered execution
- Partial re-execution (run from specific step)
- Editing inputs mid-execution

---

## Dependencies

- Workflow must be saved (transpiled) before execution
- Required connections must be available for user
- Mastra streaming API (`streamVNext`)

---

## Open Questions

- Should we auto-save before execution?
- How do we handle long-running workflows?
- Should execution history be stored?
- How do we visualize streaming text output from agent steps?

---

## References

- [Mastra Workflow Streaming](https://mastra.ai/docs/streaming/workflow-streaming)
- Existing execution: `app/api/tools/services/workflow-tools.ts`
- Input schema: `app/(pages)/workflows/editor/components/panels/inputs/`
