# Implementation Phases: Stagehand Integration

## Phase 1: Stagehand Service Backend

### Goal
Create Stagehand wrapper service that manages instances per session via CDP URL.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/api/browser-automation/types.ts` | MODIFY | Add Stagehand types |
| `app/api/browser-automation/services/stagehand-client.ts` | CREATE | Stagehand manager |

### Pseudocode

#### `app/api/browser-automation/types.ts`
```typescript
// Add Stagehand types
export interface StagehandActRequest {
  action: string;
  domSettleTimeoutMs?: number;
}

export interface StagehandExtractRequest {
  instruction: string;
  schema: Record<string, unknown>;  // JSON Schema
}

export interface StagehandObserveResult {
  actions: Array<{
    description: string;
    selector?: string;
    type: 'click' | 'input' | 'scroll' | 'other';
  }>;
  extractableData: string[];
  pageInfo: {
    title: string;
    url: string;
    contentSummary: string;
  };
}

export type BrowserMode = 'anchor' | 'stagehand';
```

#### `app/api/browser-automation/services/stagehand-client.ts`
```typescript
import { Stagehand } from '@browserbasehq/stagehand';
import { z } from 'zod';

const stagehandInstances = new Map<string, Stagehand>();

export class StagehandService {
  async getOrCreateStagehand(sessionId: string, cdpUrl: string) {
    if (stagehandInstances.has(sessionId)) {
      return stagehandInstances.get(sessionId)!;
    }
    
    const stagehand = new Stagehand({
      env: 'LOCAL',
      modelName: 'google/gemini-2.0-flash',
      modelApiKey: process.env.GOOGLE_API_KEY,
      localBrowserLaunchOptions: { cdpUrl }
    });
    
    await stagehand.init();
    stagehandInstances.set(sessionId, stagehand);
    return stagehand;
  }
  
  async act(sessionId: string, cdpUrl: string, action: string) {
    const stagehand = await this.getOrCreateStagehand(sessionId, cdpUrl);
    
    try {
      await stagehand.page.act(action);
      return { success: true, message: `Executed: ${action}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async extract(sessionId: string, cdpUrl: string, instruction: string, jsonSchema: any) {
    const stagehand = await this.getOrCreateStagehand(sessionId, cdpUrl);
    const zodSchema = this.jsonSchemaToZod(jsonSchema);
    
    try {
      const data = await stagehand.page.extract({
        instruction,
        schema: zodSchema
      });
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  private jsonSchemaToZod(jsonSchema: any): z.ZodSchema {
    // Basic conversion logic
    if (jsonSchema.type === 'string') return z.string();
    if (jsonSchema.type === 'number') return z.number();
    if (jsonSchema.type === 'boolean') return z.boolean();
    
    if (jsonSchema.type === 'object') {
      const shape: any = {};
      for (const [key, value] of Object.entries(jsonSchema.properties || {})) {
        shape[key] = this.jsonSchemaToZod(value);
      }
      return z.object(shape);
    }
    
    if (jsonSchema.type === 'array') {
      return z.array(this.jsonSchemaToZod(jsonSchema.items));
    }
    
    return z.unknown();
  }
  
  async destroyStagehand(sessionId: string) {
    const stagehand = stagehandInstances.get(sessionId);
    if (stagehand) {
      // Close if method exists
      stagehandInstances.delete(sessionId);
    }
  }
}

export const stagehandService = new StagehandService();
```

### Testing

```bash
# Install Stagehand package
npm install @browserbasehq/stagehand

# Test service initialization
# Create session first, get CDP URL
# Then test Stagehand connection
```

---

## Phase 2: Stagehand API Endpoints

### Goal
Create API endpoints for act, extract, and observe operations.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/api/browser-automation/sessions/[sessionId]/stagehand/act/route.ts` | CREATE | Act endpoint |
| `app/api/browser-automation/sessions/[sessionId]/stagehand/extract/route.ts` | CREATE | Extract endpoint |
| `app/api/browser-automation/sessions/[sessionId]/stagehand/observe/route.ts` | CREATE | Observe endpoint |

### Pseudocode

#### `sessions/[sessionId]/stagehand/act/route.ts`
```typescript
export async function POST(request, { params }) {
  const { sessionId } = params;
  const body: StagehandActRequest = await request.json();
  
  // Get session to retrieve CDP URL
  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  
  const result = await stagehandService.act(
    sessionId,
    session.cdpUrl,
    body.action
  );
  
  if (result.success) {
    return NextResponse.json(result);
  } else {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }
}
```

#### `sessions/[sessionId]/stagehand/extract/route.ts`
```typescript
export async function POST(request, { params }) {
  const { sessionId } = params;
  const body: StagehandExtractRequest = await request.json();
  
  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  
  const result = await stagehandService.extract(
    sessionId,
    session.cdpUrl,
    body.instruction,
    body.schema
  );
  
  if (result.success) {
    return NextResponse.json({ data: result.data });
  } else {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }
}
```

#### `sessions/[sessionId]/stagehand/observe/route.ts`
```typescript
export async function GET(request, { params }) {
  const { sessionId } = params;
  
  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  
  const stagehand = await stagehandService.getOrCreateStagehand(
    sessionId,
    session.cdpUrl
  );
  
  try {
    const actions = await stagehand.page.observe();
    const pageInfo = {
      title: await stagehand.page.title(),
      url: stagehand.page.url(),
      contentSummary: 'Page analysis complete'
    };
    
    return NextResponse.json({
      actions,
      extractableData: [],  // Parse from actions
      pageInfo
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Testing

```bash
# Test act endpoint
curl -X POST http://localhost:3000/api/browser-automation/sessions/[id]/stagehand/act \
  -H "Content-Type: application/json" \
  -d '{"action": "Click the submit button"}'

# Test extract endpoint
curl -X POST http://localhost:3000/api/browser-automation/sessions/[id]/stagehand/extract \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "Extract job details",
    "schema": {
      "type": "object",
      "properties": {
        "title": {"type": "string"},
        "company": {"type": "string"}
      }
    }
  }'

# Test observe endpoint
curl http://localhost:3000/api/browser-automation/sessions/[id]/stagehand/observe
```

---

## Phase 3: Frontend State Management

### Goal
Add Zustand store for Stagehand mode and operations.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/experiments/browser-automation/store/slices/stagehandSlice.ts` | CREATE | Stagehand state |
| `app/(pages)/experiments/browser-automation/store/index.ts` | MODIFY | Add slice |

### Pseudocode

#### `store/slices/stagehandSlice.ts`
```typescript
interface StagehandSlice {
  mode: BrowserMode;
  currentSchema: string;
  schemaError: string | null;
  lastObserveResult: StagehandObserveResult | null;
  lastExtractResult: unknown | null;
  isActing: boolean;
  isExtracting: boolean;
  isObserving: boolean;
  
  setMode: (mode: BrowserMode) => void;
  setSchema: (schema: string) => void;
  act: (sessionId: string, action: string) => Promise<void>;
  extract: (sessionId: string, instruction: string) => Promise<void>;
  observe: (sessionId: string) => Promise<void>;
}

export const createStagehandSlice = (set, get) => ({
  mode: 'anchor',
  currentSchema: '{}',
  schemaError: null,
  lastObserveResult: null,
  lastExtractResult: null,
  isActing: false,
  isExtracting: false,
  isObserving: false,
  
  setMode: (mode) => {
    set({ mode, lastObserveResult: null, lastExtractResult: null });
  },
  
  setSchema: (schema) => {
    try {
      JSON.parse(schema);
      set({ currentSchema: schema, schemaError: null });
    } catch (e) {
      set({ schemaError: 'Invalid JSON schema' });
    }
  },
  
  act: async (sessionId, action) => {
    set({ isActing: true });
    
    const response = await fetch(
      `/api/browser-automation/sessions/${sessionId}/stagehand/act`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      }
    );
    
    const result = await response.json();
    
    // Add to action log
    get().addAction({
      type: 'stagehand',
      action: `Act: ${action}`,
      timestamp: new Date().toISOString(),
      success: result.success
    });
    
    set({ isActing: false });
  },
  
  extract: async (sessionId, instruction) => {
    const { currentSchema } = get();
    
    try {
      const schema = JSON.parse(currentSchema);
      set({ isExtracting: true });
      
      const response = await fetch(
        `/api/browser-automation/sessions/${sessionId}/stagehand/extract`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instruction, schema })
        }
      );
      
      const result = await response.json();
      set({ lastExtractResult: result.data, isExtracting: false });
      
    } catch (error) {
      set({ schemaError: error.message, isExtracting: false });
    }
  },
  
  observe: async (sessionId) => {
    set({ isObserving: true });
    
    const response = await fetch(
      `/api/browser-automation/sessions/${sessionId}/stagehand/observe`
    );
    
    const result = await response.json();
    set({ lastObserveResult: result, isObserving: false });
  }
});
```

### Testing

```bash
# Test in browser console
const store = useBrowserStore.getState();

# Switch mode
store.setMode('stagehand');

# Set schema
store.setSchema('{"type": "object", "properties": {"title": {"type": "string"}}}');

# Execute act
await store.act('session-id', 'Click submit');

# Execute observe
await store.observe('session-id');
```

---

## Phase 4: Frontend UI Components

### Goal
Build UI for Stagehand mode switching and operations.

### File Impact

| File | Action | Purpose |
|------|--------|---------|
| `app/(pages)/experiments/browser-automation/components/ChatPanel/ModeSwitcher.tsx` | CREATE | Mode toggle |
| `app/(pages)/experiments/browser-automation/components/Stagehand/StagehandInput.tsx` | CREATE | Command input |
| `app/(pages)/experiments/browser-automation/components/Stagehand/ExtractSchemaEditor.tsx` | CREATE | Schema editor |
| `app/(pages)/experiments/browser-automation/components/Stagehand/ObserveResults.tsx` | CREATE | Results display |
| `app/(pages)/experiments/browser-automation/components/ChatPanel/index.tsx` | MODIFY | Integrate mode |

### Pseudocode

#### `components/ChatPanel/ModeSwitcher.tsx`
```typescript
export function ModeSwitcher() {
  const { mode, setMode } = useBrowserStore();
  
  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded">
      <button
        className={cn(
          "px-3 py-1 rounded",
          mode === 'anchor' && "bg-white shadow"
        )}
        onClick={() => setMode('anchor')}
      >
        Chat
      </button>
      <button
        className={cn(
          "px-3 py-1 rounded",
          mode === 'stagehand' && "bg-white shadow"
        )}
        onClick={() => setMode('stagehand')}
      >
        Stagehand
      </button>
    </div>
  );
}
```

#### `components/Stagehand/StagehandInput.tsx`
```typescript
export function StagehandInput({ sessionId }) {
  const { act, extract, observe, isActing, isExtracting, isObserving } = useBrowserStore();
  const [tab, setTab] = useState<'act' | 'extract' | 'observe'>('act');
  const [action, setAction] = useState('');
  const [instruction, setInstruction] = useState('');
  
  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('act')}>Act</button>
        <button onClick={() => setTab('extract')}>Extract</button>
        <button onClick={() => setTab('observe')}>Observe</button>
      </div>
      
      {tab === 'act' && (
        <div>
          <input
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="What should I do?"
            className="w-full p-2 border rounded"
          />
          <button
            onClick={() => act(sessionId, action)}
            disabled={isActing}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            {isActing ? 'Acting...' : 'Execute'}
          </button>
        </div>
      )}
      
      {tab === 'extract' && (
        <div>
          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="What to extract?"
            className="w-full p-2 border rounded"
          />
          <ExtractSchemaEditor />
          <button
            onClick={() => extract(sessionId, instruction)}
            disabled={isExtracting}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            {isExtracting ? 'Extracting...' : 'Extract'}
          </button>
        </div>
      )}
      
      {tab === 'observe' && (
        <div>
          <p>Analyze the current page to see available actions</p>
          <button
            onClick={() => observe(sessionId)}
            disabled={isObserving}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            {isObserving ? 'Observing...' : 'Observe Page'}
          </button>
          <ObserveResults />
        </div>
      )}
    </div>
  );
}
```

### Testing

```bash
# Visual testing
# 1. Start browser session
# 2. Switch to Stagehand mode
# 3. Test Act: Enter "Click submit" and execute
# 4. Test Observe: Click observe, see results
# 5. Test Extract: Enter instruction and schema, extract data
```

---

## Acceptance Criteria Summary

### Phase 1
- [ ] Stagehand package installed
- [ ] Service connects via CDP URL
- [ ] Instances cached per session
- [ ] JSON to Zod conversion works

### Phase 2
- [ ] Act endpoint executes actions
- [ ] Extract endpoint returns data
- [ ] Observe endpoint analyzes page
- [ ] 404 returned for invalid sessions

### Phase 3
- [ ] Mode switches between anchor/stagehand
- [ ] Schema validation works
- [ ] Actions logged correctly
- [ ] Results stored in state

### Phase 4
- [ ] Mode switcher visible
- [ ] Stagehand input tabs work
- [ ] Schema editor validates JSON
- [ ] Observe results display
- [ ] Extract shows structured data

---

## Risk Mitigation

1. **Package Availability**: Check npm registry, fallback to GitHub
2. **CDP Compatibility**: Test with Anchor CDP URLs early
3. **Rate Limiting**: Monitor API usage, add delays if needed
4. **Schema Complexity**: Start with simple schemas, expand gradually
5. **Memory Leaks**: Destroy Stagehand instances on session end