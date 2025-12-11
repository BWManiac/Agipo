# Browser Workflow Integration - Implementation Phases

**Feature:** Browser Automation Workflow Integration  
**Task Document:** `04A-Workflow-Integration-Task.md`

---

## Phase 1: Backend Browser Step Types

### Goal
Add browser step type to workflow system with configuration and code generation.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/api/workflows/types/browser-step.ts` | Create | Browser step config types |
| `app/api/workflows/types/workflow.ts` | Modify | Add browser step type |
| `app/api/workflows/services/step-generator.ts` | Modify | Add browser code gen |

### Pseudocode

```typescript
// browser-step.ts
export type BrowserActionType = 
  | "navigate" | "extract" | "fill_form" 
  | "click" | "wait" | "screenshot" | "custom";

export interface BrowserStepConfig {
  action: BrowserActionType;
  profileName?: string;  // Use saved profile
  navigate?: { url: string; waitForSelector?: string };
  extract?: { instruction: string; schema: JSONSchema };
  fillForm?: { fields: FormField[]; submitSelector?: string };
  click?: { target: string; waitAfter?: number };
  wait?: { selector?: string; timeout?: number };
  screenshot?: { fullPage?: boolean };
  custom?: { description: string };
}

// In step-generator.ts
function generateBrowserStep(step: WorkflowStep): string {
  const config = step.browserConfig;
  
  switch(config.action) {
    case 'navigate':
      return `
        const browser = await ctx.browserSession;
        await browser.goto("${config.navigate.url}");
        ${config.navigate.waitForSelector ? 
          `await browser.waitForSelector("${config.navigate.waitForSelector}");` : ''}
        return { success: true, url: "${config.navigate.url}" };
      `;
    
    case 'extract':
      return `
        const browser = await ctx.browserSession;
        const result = await browser.extract(
          "${config.extract.instruction}",
          ${JSON.stringify(config.extract.schema)}
        );
        return { data: result };
      `;
    // ... other actions
  }
}
```

### Testing
```bash
# Verify TypeScript compilation
npm run build
# Test step generation
node -e "console.log(generateBrowserStep({...}))"
```

---

## Phase 2: Browser Session Management

### Goal
Manage browser sessions across workflow steps with reuse and cleanup.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/api/browser-automation/services/workflow-browser.ts` | Create | Session manager |
| `app/api/workflows/services/browser-step-executor.ts` | Create | Step executor |

### Pseudocode

```typescript
// workflow-browser.ts
class WorkflowBrowserManager {
  private sessions = new Map<string, BrowserSession>();
  
  async getOrCreateSession(workflowRunId: string, profileName?: string) {
    if (!this.sessions.has(workflowRunId)) {
      const session = await anchorClient.createSession({
        profileName,
        timeout: { maxDuration: 30 }
      });
      
      this.sessions.set(workflowRunId, {
        id: session.id,
        cdpUrl: session.cdpUrl,
        client: await createBrowserClient(session)
      });
    }
    
    return this.sessions.get(workflowRunId);
  }
  
  async cleanup(workflowRunId: string) {
    const session = this.sessions.get(workflowRunId);
    if (session) {
      await session.client.close();
      this.sessions.delete(workflowRunId);
    }
  }
}

// In workflow execution context
ctx.browserSession = await browserManager.getOrCreateSession(runId);
// ... execute steps
await browserManager.cleanup(runId);
```

### Testing
```bash
# Test session creation and reuse
curl -X POST /api/workflows/[id]/execute
# Verify single browser session used across steps
```

---

## Phase 3: Frontend Browser Nodes

### Goal
Add browser action nodes to visual workflow editor with configuration UI.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/workflows/editor/components/nodes/BrowserStepNode.tsx` | Create | Canvas node |
| `app/(pages)/workflows/editor/components/panels/BrowserStepConfig.tsx` | Create | Config panel |
| `app/(pages)/workflows/editor/components/toolkit/BrowserToolkit.tsx` | Create | Toolkit items |

### Pseudocode

```tsx
// BrowserStepNode.tsx
export function BrowserStepNode({ data }) {
  const icon = getBrowserActionIcon(data.browserConfig?.action);
  
  return (
    <div className="browser-step-node">
      <div className="node-header bg-blue-500">
        {icon} Browser: {data.browserConfig?.action}
      </div>
      <div className="node-body">
        {data.name || "Browser Action"}
      </div>
      <Handle type="target" position="left" />
      <Handle type="source" position="right" />
    </div>
  );
}

// BrowserStepConfig.tsx
export function BrowserStepConfig({ step, onChange }) {
  const [action, setAction] = useState(step.browserConfig?.action || 'navigate');
  
  return (
    <div>
      <Select value={action} onChange={e => {
        onChange({ 
          ...step, 
          browserConfig: { ...step.browserConfig, action: e.target.value }
        });
      }}>
        <MenuItem value="navigate">Navigate</MenuItem>
        <MenuItem value="extract">Extract Data</MenuItem>
        <MenuItem value="fill_form">Fill Form</MenuItem>
        <MenuItem value="click">Click Element</MenuItem>
      </Select>
      
      {action === 'navigate' && <NavigateConfig />}
      {action === 'extract' && <ExtractConfig />}
      {/* ... other action configs */}
    </div>
  );
}
```

### Testing
- Drag browser action from toolkit
- Configure action in panel
- Connect to other nodes
- Save and reload workflow

---

## Success Metrics

- Browser steps execute in < 5 seconds
- Session reuse reduces overhead by 50%
- Visual configuration intuitive
- Workflows with browser steps save/load correctly