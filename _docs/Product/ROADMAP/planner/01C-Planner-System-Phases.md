# Planner System - Implementation Phases

## Phase 1: Inngest Scheduled Jobs

### Goal
Implement scheduled job creation and execution using Inngest functions.

### File Impact
- Create: `app/api/workforce/services/inngest-jobs.ts`
- Create: `app/api/workforce/services/template-engine.ts`
- Create: `app/api/workforce/[agentId]/planner/jobs/route.ts`
- Modify: `_tables/types.ts`

### Pseudocode
```typescript
// inngest-jobs.ts
import { inngest } from "@mastra/inngest";

export function createJobFunction(job: ScheduledJob, agentId: string) {
  return inngest.createFunction(
    { id: `job-${job.id}`, name: job.name },
    { cron: job.schedule },
    async ({ event, step }) => {
      if (job.action === 'chat') {
        const message = replaceVariables(job.template, event.data);
        await executeChat(agentId, message);
      } else if (job.action === 'workflow') {
        await executeWorkflow(job.workflowId, event.data);
      }
    }
  );
}

// Store function reference in agent config
agentConfig.planner.jobs.push({
  id: nanoid(),
  name: "Daily Report",
  schedule: "0 9 * * *",
  action: "chat",
  template: "Generate daily report for {{date}}"
});
```

### Testing
```bash
# Create job
curl -X POST /api/workforce/[agentId]/planner/jobs \
  -d '{"name": "Daily Report", "schedule": "0 9 * * *", "action": "chat"}'

# Verify Inngest function created
curl http://localhost:8288/functions
```

---

## Phase 2: Composio Event Triggers  

### Goal
Implement event triggers using Composio webhooks.

### File Impact
- Create: `app/api/workforce/services/composio-triggers.ts`
- Create: `app/api/workforce/triggers/webhook/route.ts`
- Create: `app/api/workforce/[agentId]/planner/triggers/route.ts`

### Pseudocode
```typescript
// composio-triggers.ts
export async function createEventTrigger(trigger: EventTrigger, agentId: string) {
  const webhookUrl = `${process.env.APP_URL}/api/workforce/triggers/webhook`;
  
  const composioTrigger = await composioClient.triggers.create({
    app: trigger.app,
    event: trigger.event,
    webhookUrl,
    metadata: { agentId, triggerId: trigger.id }
  });
  
  return composioTrigger.id;
}

// webhook/route.ts
export async function POST(request) {
  const signature = request.headers.get('x-composio-signature');
  if (!verifySignature(signature, request.body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  
  const { event, metadata } = await request.json();
  const { agentId, triggerId } = metadata;
  
  const trigger = getTriggerById(agentId, triggerId);
  if (trigger.action === 'chat') {
    await executeChat(agentId, trigger.template, event.data);
  } else if (trigger.action === 'workflow') {
    await executeWorkflow(trigger.workflowId, event.data);
  }
  
  return NextResponse.json({ success: true });
}
```

### Testing
```bash
# Create trigger
curl -X POST /api/workforce/[agentId]/planner/triggers \
  -d '{"app": "github", "event": "issue.created", "action": "chat"}'

# Test webhook
curl -X POST /api/workforce/triggers/webhook \
  -H "x-composio-signature: test" \
  -d '{"event": {"type": "issue.created"}, "metadata": {"agentId": "123"}}'
```

---

## Phase 3: Frontend UI

### Goal
Build UI for creating and managing jobs/triggers.

### File Impact
- Create: `store/slices/plannerSlice.ts`
- Create: `components/CreateJobDialog.tsx`
- Create: `components/CreateTriggerDialog.tsx`
- Create: `components/CronPicker.tsx`
- Modify: `PlannerTab.tsx`

### Pseudocode
```tsx
// CreateJobDialog.tsx
export function CreateJobDialog({ agentId, onClose }) {
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('0 9 * * *');
  const [action, setAction] = useState<'chat' | 'workflow'>('chat');
  const [template, setTemplate] = useState('');
  
  const presets = [
    { label: 'Daily at 9am', value: '0 9 * * *' },
    { label: 'Weekly Monday', value: '0 9 * * 1' },
    { label: 'Monthly 1st', value: '0 9 1 * *' }
  ];
  
  return (
    <Dialog>
      <Input label="Job Name" value={name} onChange={setName} />
      
      <CronPicker 
        value={schedule} 
        onChange={setSchedule}
        presets={presets}
      />
      
      <RadioGroup value={action} onChange={setAction}>
        <Radio value="chat">Start Chat</Radio>
        <Radio value="workflow">Execute Workflow</Radio>
      </RadioGroup>
      
      {action === 'chat' && (
        <Textarea 
          label="Chat Template"
          value={template}
          onChange={setTemplate}
          placeholder="Generate report for {{date}}"
        />
      )}
      
      <Button onClick={handleCreate}>Create Job</Button>
    </Dialog>
  );
}
```

---

## Success Metrics
- Job creation < 2 seconds
- Webhook processing < 500ms
- Cron execution accuracy ± 1 minute
- Template variable replacement 100% accurate