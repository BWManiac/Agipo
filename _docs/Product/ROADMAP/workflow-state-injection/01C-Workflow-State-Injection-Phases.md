# Workflow State Injection - Implementation Phases

## Phase 1: Backend State Support

### Goal
Add fixedInputs and initialState support to workflow execution.

### File Impact
- Modify: `_tables/types.ts`
- Modify: `app/api/tools/services/workflow-tools.ts`
- Modify: `app/api/workflows/services/workflow-loader.ts`
- Modify: `app/api/workforce/services/agent-config.ts`

### Pseudocode
```typescript
// _tables/types.ts
export interface WorkflowBinding {
  workflowId: string;
  connectionBindings: Record<string, string>;
  fixedInputs?: Record<string, unknown>;  // NEW
  initialState?: Record<string, unknown>; // NEW
}

// workflow-tools.ts
async (input: Record<string, unknown>) => {
  // Filter Mastra-injected keys
  const workflowInput = Object.entries(input)
    .filter(([key]) => !key.startsWith('__mastra'))
    .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {});
  
  // Merge fixed inputs (fixed → runtime)
  const mergedInput = {
    ...binding.fixedInputs,
    ...workflowInput
  };
  
  // Execute with initialState
  const run = await workflowExec.createRunAsync({ resourceId: userId });
  const result = await run.start({
    inputData: mergedInput,
    initialState: binding.initialState || {}
  });
  
  return result.output;
}

// workflow-loader.ts
export async function getWorkflowMetadata(workflowId: string) {
  const workflow = await getWorkflowExecutable(workflowId);
  
  return {
    id: workflow.id,
    inputSchema: workflow.inputSchema,
    outputSchema: workflow.outputSchema,
    stateSchema: workflow.stateSchema,  // NEW: Extract state schema
    steps: workflow.steps?.length || 0
  };
}
```

### Testing
```bash
# Test fixed inputs
curl -X POST /api/workforce/[agentId]/chat \
  -d '{"messages": [{"role": "user", "content": "run workflow"}]}'
# Verify fixed inputs applied in logs

# Test initial state
# Check workflow receives state in first step
```

---

## Phase 2: Trigger Data Mapping

### Goal
Map trigger data to workflow inputs automatically or manually.

### File Impact
- Modify: `_tables/types.ts`
- Create: `app/api/planner/services/trigger-executor.ts`
- Modify: `app/api/workforce/triggers/webhook/route.ts`

### Pseudocode
```typescript
// types.ts
export interface EventTrigger {
  id: string;
  name: string;
  app: string;
  event: string;
  action: 'chat' | 'workflow';
  workflowId?: string;
  inputMapping?: Record<string, string>;  // NEW: field mappings
}

// trigger-executor.ts
export async function executeWorkflowFromTrigger(
  trigger: EventTrigger,
  eventData: Record<string, unknown>
) {
  const workflow = await getWorkflowExecutable(trigger.workflowId!);
  const binding = await getWorkflowBinding(trigger.workflowId!);
  
  // Map trigger data to workflow inputs
  let mappedInputs: Record<string, unknown> = {};
  
  if (trigger.inputMapping) {
    // Manual mapping: { workflowField: triggerField }
    for (const [wfField, triggerField] of Object.entries(trigger.inputMapping)) {
      mappedInputs[wfField] = eventData[triggerField];
    }
  } else {
    // Auto-map matching field names
    const inputFields = Object.keys(workflow.inputSchema.shape || {});
    for (const field of inputFields) {
      if (eventData[field] !== undefined) {
        mappedInputs[field] = eventData[field];
      }
    }
  }
  
  // Merge: fixed → trigger → runtime
  const finalInputs = {
    ...binding?.fixedInputs,
    ...mappedInputs
  };
  
  // Execute workflow
  const run = await workflow.createRunAsync({ resourceId: trigger.userId });
  return await run.start({
    inputData: finalInputs,
    initialState: binding?.initialState || {}
  });
}
```

### Testing
```bash
# Create trigger with mapping
curl -X POST /api/workforce/[agentId]/planner/triggers \
  -d '{
    "app": "slack",
    "event": "message.created",
    "action": "workflow",
    "workflowId": "wf-123",
    "inputMapping": {"query": "text", "channel": "channel_name"}
  }'

# Simulate webhook
curl -X POST /api/workforce/triggers/webhook \
  -H "x-composio-signature: test" \
  -d '{"event": {"text": "test message", "channel_name": "general"}}'
```

---

## Phase 3: Frontend Configuration UI

### Goal
Build UI for configuring fixed inputs and trigger mappings.

### File Impact
- Modify: `store/slices/capabilitiesSlice.ts`
- Create: `components/WorkflowInputsDialog.tsx`
- Modify: `components/tabs/CapabilitiesTab.tsx`
- Modify: `components/TriggerDialog.tsx`

### Pseudocode
```tsx
// WorkflowInputsDialog.tsx
export function WorkflowInputsDialog({ binding, workflow, onSave }) {
  const [fixedInputs, setFixedInputs] = useState(binding.fixedInputs || {});
  const [initialState, setInitialState] = useState(binding.initialState || {});
  
  const inputFields = Object.entries(workflow.inputSchema?.shape || {});
  const stateFields = Object.entries(workflow.stateSchema?.shape || {});
  
  return (
    <Dialog>
      <Section title="Fixed Inputs">
        <p>Configure default values for workflow inputs</p>
        {inputFields.map(([key, schema]) => (
          <div key={key}>
            <Checkbox
              checked={fixedInputs[key] !== undefined}
              onChange={(checked) => {
                if (!checked) {
                  const { [key]: _, ...rest } = fixedInputs;
                  setFixedInputs(rest);
                } else {
                  setFixedInputs({ ...fixedInputs, [key]: '' });
                }
              }}
            />
            <Input
              label={key}
              value={fixedInputs[key] || ''}
              onChange={(value) => setFixedInputs({ ...fixedInputs, [key]: value })}
              disabled={fixedInputs[key] === undefined}
            />
          </div>
        ))}
      </Section>
      
      {stateFields.length > 0 && (
        <Section title="Initial State">
          <p>Set initial values for workflow state</p>
          {stateFields.map(([key, schema]) => (
            <Input
              key={key}
              label={key}
              value={initialState[key] || ''}
              onChange={(value) => setInitialState({ ...initialState, [key]: value })}
            />
          ))}
        </Section>
      )}
      
      <Button onClick={() => onSave({ fixedInputs, initialState })}>
        Save Configuration
      </Button>
    </Dialog>
  );
}

// TriggerDialog.tsx addition
{trigger.action === 'workflow' && (
  <Section title="Input Mapping">
    <p>Map event data to workflow inputs</p>
    {workflowInputs.map((inputField) => (
      <Select
        key={inputField}
        label={`Workflow: ${inputField}`}
        value={inputMapping[inputField] || ''}
        options={[
          { value: '', label: 'Auto-map' },
          ...triggerFields.map(f => ({ value: f, label: `Event: ${f}` }))
        ]}
        onChange={(value) => setInputMapping({ ...inputMapping, [inputField]: value })}
      />
    ))}
  </Section>
)}
```

---

## Success Metrics
- Fixed inputs merge correctly (100% accuracy)
- Initial state available in workflow steps
- Trigger data maps to workflow inputs
- UI validates against schemas
- No breaking changes to existing workflows