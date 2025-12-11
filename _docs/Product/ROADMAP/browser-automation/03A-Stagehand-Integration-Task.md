# Task: Stagehand Integration

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/browser-automation/03-Stagehand-Integration.md`  
**Research Log:** `_docs/Product/ROADMAP/browser-automation/03B-Stagehand-Integration-Research.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Validation

### Approach Validation  
✅ **Stagehand v3 uses CDP directly** - Research confirms 44% faster than v2, no Playwright
✅ **Native Zod schema support** - No conversion needed, use Zod directly with .describe()
✅ **CDP URL from Anchor works** - Standard WebSocket endpoint compatible
✅ **Instance per session pattern correct** - One Stagehand instance per CDP connection

### Current State Analysis
- No Stagehand integration exists
- Anchor's `agent.task()` used for natural language automation
- CDP URL available from session creation
- Browser automation playground has chat interface

## File Impact Analysis

The following files will be impacted:

### CREATE (New Files)
- `app/api/browser-automation/services/stagehand-client.ts` - Stagehand wrapper
- `app/api/browser-automation/sessions/[sessionId]/stagehand/act/route.ts` - Act endpoint
- `app/api/browser-automation/sessions/[sessionId]/stagehand/extract/route.ts` - Extract endpoint
- `app/api/browser-automation/sessions/[sessionId]/stagehand/observe/route.ts` - Observe endpoint
- `app/(pages)/experiments/browser-automation/store/slices/stagehandSlice.ts` - State management
- All Stagehand UI components (5 files)

### MODIFY (Existing Files)
- `app/api/browser-automation/types.ts` - Add Stagehand types
- `app/(pages)/experiments/browser-automation/store/index.ts` - Add slice
- `app/(pages)/experiments/browser-automation/components/ChatPanel/index.tsx` - Integrate mode switcher

## Deterministic Decisions

### Implementation Decisions
- **Package**: Use `@browserbasehq/stagehand` npm package (v3)
- **Model**: Default to `openai/gpt-4o` (most tested in docs)
- **Instance Management**: One instance per session, destroy on session end
- **Schema Format**: Use Zod schemas directly (no conversion needed)
- **Connection**: Use `browserWSEndpoint` option with Anchor's CDP URL
- **Caching**: Enable `enableCaching: true` for LLM response caching

### UI/UX Decisions
- **Mode Location**: Toggle at top of chat panel
- **Input Tabs**: Act | Extract | Observe for Stagehand mode
- **Schema Editor**: Simple textarea with JSON validation
- **Templates**: Provide job, contact, and custom schema templates
- **Action Log**: Unified log shows both Anchor and Stagehand actions

### Error Handling Decisions
- **Invalid Schema**: Show clear JSON parse error below editor
- **Stagehand Failures**: Display error in action log with retry button
- **Session Not Found**: Return 404 from API endpoints
- **Rate Limiting**: No built-in rate limiting (rely on API keys)
- **Connection Timeout**: 30 second timeout for Stagehand init

---

## Overview

### Goal

Integrate Stagehand as an alternative/complement to Anchor's native `agent.task()` API. Stagehand provides `act()`, `extract()`, and `observe()` primitives for precise, schema-driven browser automation.

### Relevant Research

**Stagehand Integration Pattern** (from Anchor docs):
```python
# Python example from docs - need to adapt for Node.js/TypeScript
from stagehand import Stagehand

# Create Anchor session first
session = await create_browser_session()
cdp_url = session["cdp_url"]

# Initialize Stagehand with Anchor's CDP URL
stagehand = Stagehand(
    model_name="google/gemini-2.5-pro",
    env="LOCAL",
    local_browser_launch_options={"cdp_url": cdp_url}
)

await stagehand.init()
await stagehand.page.goto("https://example.com")
await stagehand.page.act("Click on the Learn more link")
```

**Stagehand Node.js API** (from Stagehand docs):
```typescript
import { Stagehand } from '@browserbasehq/stagehand';

const stagehand = new Stagehand({
  env: 'LOCAL',
  modelName: 'gpt-4o',  // or gemini
  localBrowserLaunchOptions: {
    cdpUrl: 'wss://...'  // CDP URL from Anchor
  }
});

await stagehand.init();

// Act - AI-powered element interaction
await stagehand.page.act('click the submit button');

// Extract - Schema-driven data extraction
const data = await stagehand.page.extract({
  instruction: 'extract job details',
  schema: z.object({
    title: z.string(),
    company: z.string(),
    salary: z.string().optional()
  })
});

// Observe - Understand page state
const actions = await stagehand.page.observe();
```

**Current Implementation**:
- No Stagehand integration
- Using Anchor's `agent.task()` via `anchor-agent.ts`
- CDP URL already available from session creation

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/browser-automation/types.ts` | Modify | Add Stagehand types | A |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/browser-automation/sessions/[sessionId]/stagehand/act/route.ts` | Create | Execute act() command | B |
| `app/api/browser-automation/sessions/[sessionId]/stagehand/extract/route.ts` | Create | Execute extract() with schema | B |
| `app/api/browser-automation/sessions/[sessionId]/stagehand/observe/route.ts` | Create | Execute observe() | B |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/browser-automation/services/stagehand-client.ts` | Create | Stagehand wrapper service | A |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/experiments/browser-automation/store/slices/stagehandSlice.ts` | Create | Stagehand mode state | C |
| `app/(pages)/experiments/browser-automation/store/index.ts` | Modify | Add stagehand slice | C |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `components/ChatPanel/ModeSwitcher.tsx` | Create | Toggle Anchor/Stagehand mode | D |
| `components/Stagehand/ExtractSchemaEditor.tsx` | Create | Zod schema editor | D |
| `components/Stagehand/ObserveResults.tsx` | Create | Display observe() output | D |
| `components/Stagehand/StagehandInput.tsx` | Create | Stagehand command input | D |
| `components/Stagehand/index.ts` | Create | Exports | D |

---

## Part A: Backend - Stagehand Service

### Goal

Create a service that manages Stagehand instances per session, connecting via CDP URL.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/browser-automation/types.ts` | Modify | Add Stagehand types | +40 |
| `app/api/browser-automation/services/stagehand-client.ts` | Create | Stagehand manager | ~180 |

### Pseudocode

#### `app/api/browser-automation/types.ts` (additions)

```
export interface StagehandActRequest {
  action: string           // Natural language action
  domSettleTimeoutMs?: number
}

export interface StagehandActResult {
  success: boolean
  message?: string
  error?: string
}

export interface StagehandExtractRequest {
  instruction: string
  schema: Record<string, unknown>  // JSON Schema (converted from Zod)
}

export interface StagehandExtractResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface StagehandObserveResult {
  actions: Array<{
    description: string
    selector?: string
    type: 'click' | 'input' | 'scroll' | 'other'
  }>
  extractableData: string[]
  pageInfo: {
    title: string
    url: string
    contentSummary: string
  }
}

export type BrowserMode = 'anchor' | 'stagehand'
```

#### `app/api/browser-automation/services/stagehand-client.ts`

```
import { Stagehand } from '@browserbasehq/stagehand'
import { z } from 'zod'

// Cache of Stagehand instances per session
const stagehandInstances = new Map<string, Stagehand>()

getOrCreateStagehand(sessionId: string, cdpUrl: string): Promise<Stagehand>
├── If stagehandInstances.has(sessionId):
│   └── Return cached instance
├── Create new Stagehand:
│   └── const stagehand = new Stagehand({
│         env: 'LOCAL',
│         modelName: 'google/gemini-2.0-flash',
│         modelApiKey: process.env.GOOGLE_API_KEY,
│         localBrowserLaunchOptions: {
│           cdpUrl: cdpUrl
│         }
│       })
├── await stagehand.init()
├── stagehandInstances.set(sessionId, stagehand)
└── Return stagehand

destroyStagehand(sessionId: string): Promise<void>
├── If stagehandInstances.has(sessionId):
│   ├── Get instance
│   ├── await instance.close() (if method exists)
│   └── stagehandInstances.delete(sessionId)

act(sessionId: string, cdpUrl: string, action: string): Promise<StagehandActResult>
├── Get or create stagehand instance
├── Try:
│   ├── await stagehand.page.act(action)
│   └── Return { success: true, message: `Executed: ${action}` }
├── Catch error:
│   └── Return { success: false, error: error.message }

extract<T>(sessionId: string, cdpUrl: string, instruction: string, schema: z.ZodSchema<T>): Promise<StagehandExtractResult<T>>
├── Get or create stagehand instance
├── Try:
│   ├── const data = await stagehand.page.extract({
│   │     instruction,
│   │     schema
│   │   })
│   └── Return { success: true, data }
├── Catch error:
│   └── Return { success: false, error: error.message }

observe(sessionId: string, cdpUrl: string): Promise<StagehandObserveResult>
├── Get or create stagehand instance
├── Try:
│   ├── const actions = await stagehand.page.observe()
│   ├── Get page info from stagehand.page
│   └── Return { actions, extractableData, pageInfo }
├── Catch error:
│   └── Throw error

// Helper: Convert JSON Schema to Zod (basic implementation)
jsonSchemaToZod(jsonSchema: Record<string, unknown>): z.ZodSchema
├── Handle type: 'string' → z.string()
├── Handle type: 'number' → z.number()
├── Handle type: 'boolean' → z.boolean()
├── Handle type: 'array' → z.array(recurse on items)
├── Handle type: 'object' → z.object(recurse on properties)
├── Handle optional via required array
└── Return composed schema
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Stagehand package installed | `npm ls @browserbasehq/stagehand` shows installed |
| AC-A.2 | Stagehand connects via CDP | Create instance with CDP URL → no connection error |
| AC-A.3 | Instance cached per session | Two calls with same sessionId → same instance |
| AC-A.4 | Instance destroyed on session end | Call destroyStagehand → instance removed |

---

## Part B: Backend - Stagehand API Endpoints

### Goal

Create API endpoints for act, extract, and observe operations.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/browser-automation/sessions/[sessionId]/stagehand/act/route.ts` | Create | Act endpoint | ~60 |
| `app/api/browser-automation/sessions/[sessionId]/stagehand/extract/route.ts` | Create | Extract endpoint | ~80 |
| `app/api/browser-automation/sessions/[sessionId]/stagehand/observe/route.ts` | Create | Observe endpoint | ~50 |

### Pseudocode

#### `sessions/[sessionId]/stagehand/act/route.ts`

```
POST /api/browser-automation/sessions/[sessionId]/stagehand/act
├── Get sessionId from params
├── Parse body: StagehandActRequest
├── Get session from storage to get CDP URL
├── If session not found: Return 404
├── Call stagehandClient.act(sessionId, cdpUrl, body.action)
├── If result.success:
│   └── Return 200 with result
├── Else:
│   └── Return 400 with error
```

#### `sessions/[sessionId]/stagehand/extract/route.ts`

```
POST /api/browser-automation/sessions/[sessionId]/stagehand/extract
├── Get sessionId from params
├── Parse body: StagehandExtractRequest
├── Get session from storage
├── If session not found: Return 404
├── Convert body.schema (JSON Schema) to Zod schema
│   └── Call jsonSchemaToZod(body.schema)
├── Call stagehandClient.extract(sessionId, cdpUrl, body.instruction, zodSchema)
├── If result.success:
│   └── Return 200 with { data: result.data }
├── Else:
│   └── Return 400 with validation/extraction error
```

#### `sessions/[sessionId]/stagehand/observe/route.ts`

```
GET /api/browser-automation/sessions/[sessionId]/stagehand/observe
├── Get sessionId from params
├── Get session from storage
├── If session not found: Return 404
├── Call stagehandClient.observe(sessionId, cdpUrl)
├── Return 200 with StagehandObserveResult
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Act endpoint executes action | POST with action → browser performs action |
| AC-B.2 | Extract returns structured data | POST with schema → get typed JSON back |
| AC-B.3 | Observe returns page analysis | GET observe → get actions and extractable data |
| AC-B.4 | Invalid session returns 404 | Request with bad sessionId → 404 |
| AC-B.5 | Schema validation errors returned | POST with invalid schema → clear error message |

---

## Part C: Frontend - State Management

### Goal

Add Zustand slice for Stagehand mode, schema editing, and results display.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `store/slices/stagehandSlice.ts` | Create | Stagehand state | ~150 |
| `store/index.ts` | Modify | Add slice | +5 |

### Pseudocode

#### `store/slices/stagehandSlice.ts`

```
interface StagehandSlice {
  // Mode
  mode: BrowserMode                // 'anchor' | 'stagehand'

  // Schema editing
  currentSchema: string            // JSON schema as string
  schemaError: string | null

  // Results
  lastObserveResult: StagehandObserveResult | null
  lastExtractResult: unknown | null

  // Loading states
  isActing: boolean
  isExtracting: boolean
  isObserving: boolean
  error: string | null

  // Actions
  setMode(mode: BrowserMode): void
  setSchema(schema: string): void
  validateSchema(): boolean

  act(sessionId: string, action: string): Promise<StagehandActResult>
  extract(sessionId: string, instruction: string): Promise<unknown>
  observe(sessionId: string): Promise<StagehandObserveResult>

  clearResults(): void
  clearError(): void
}

setMode(mode):
├── Set mode = mode
├── Clear results and errors

setSchema(schema):
├── Set currentSchema = schema
├── Try JSON.parse to validate syntax
├── Set schemaError if invalid

act(sessionId, action):
├── Set isActing = true
├── POST /api/browser-automation/sessions/{sessionId}/stagehand/act
├── Add to actions log (via actionsSlice)
├── Set isActing = false
├── Return result

extract(sessionId, instruction):
├── Set isExtracting = true
├── Validate currentSchema is valid JSON
├── POST /api/browser-automation/sessions/{sessionId}/stagehand/extract
│   with { instruction, schema: JSON.parse(currentSchema) }
├── Set lastExtractResult = response.data
├── Add to actions log
├── Set isExtracting = false
├── Return data

observe(sessionId):
├── Set isObserving = true
├── GET /api/browser-automation/sessions/{sessionId}/stagehand/observe
├── Set lastObserveResult = response
├── Add to actions log
├── Set isObserving = false
├── Return result
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-C.1 | Mode toggles between anchor and stagehand | Call setMode → mode state updates |
| AC-C.2 | Schema validation works | Set invalid JSON → schemaError set |
| AC-C.3 | Act updates action log | Call act → action appears in actionsSlice |
| AC-C.4 | Extract stores result | Call extract → lastExtractResult populated |
| AC-C.5 | Observe stores result | Call observe → lastObserveResult populated |

---

## Part D: Frontend - Stagehand UI Components

### Goal

Build UI for mode switching, schema editing, and Stagehand-specific interactions.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `components/ChatPanel/ModeSwitcher.tsx` | Create | Mode toggle | ~50 |
| `components/Stagehand/ExtractSchemaEditor.tsx` | Create | Schema editor | ~150 |
| `components/Stagehand/ObserveResults.tsx` | Create | Observe display | ~100 |
| `components/Stagehand/StagehandInput.tsx` | Create | Command input | ~120 |
| `components/Stagehand/index.ts` | Create | Exports | ~10 |
| `components/ChatPanel/index.tsx` | Modify | Integrate mode switching | +30 |

### Pseudocode

#### `components/ChatPanel/ModeSwitcher.tsx`

```
ModeSwitcher:
├── Props: none (uses store)
├── State from store:
│   └── mode, setMode
├── UI:
│   ├── Segmented control / toggle:
│   │   ├── Option 1: "Chat" (anchor mode)
│   │   │   └── Icon: chat bubble
│   │   └── Option 2: "Stagehand" (stagehand mode)
│   │       └── Icon: target/crosshair
│   ├── Tooltip explaining each mode
│   └── Visual indicator of current mode
├── On change: setMode(newMode)
```

#### `components/Stagehand/StagehandInput.tsx`

```
StagehandInput:
├── Props: sessionId
├── State from store:
│   ├── isActing, isExtracting, isObserving
│   ├── act, extract, observe
│   └── currentSchema
├── Local state:
│   ├── inputType: 'act' | 'extract' | 'observe'
│   ├── inputValue: string
├── UI:
│   ├── Tab bar: "Act" | "Extract" | "Observe"
│   ├── If 'act':
│   │   ├── Text input: "What should I do?"
│   │   ├── Example: "Click the submit button"
│   │   └── Submit button
│   ├── If 'extract':
│   │   ├── Instruction input: "What to extract?"
│   │   ├── ExtractSchemaEditor below
│   │   └── Extract button
│   ├── If 'observe':
│   │   ├── Explanation: "Analyze the current page"
│   │   └── Observe button
│   └── Loading spinner when executing
├── On submit:
│   ├── If 'act': act(sessionId, inputValue)
│   ├── If 'extract': extract(sessionId, inputValue)
│   └── If 'observe': observe(sessionId)
```

#### `components/Stagehand/ExtractSchemaEditor.tsx`

```
ExtractSchemaEditor:
├── Props: none (uses store)
├── State from store:
│   ├── currentSchema, setSchema, schemaError
├── UI:
│   ├── Label: "Extraction Schema (JSON)"
│   ├── Code editor / textarea with:
│   │   ├── Syntax highlighting for JSON
│   │   ├── Line numbers
│   │   └── Error highlighting
│   ├── Error message if schemaError
│   ├── Template buttons:
│   │   ├── "Job Posting" → insert job schema
│   │   ├── "Contact Info" → insert contact schema
│   │   └── "Custom" → blank object
│   └── Preview: Rendered schema as tree (optional)
├── On change: setSchema(newValue)
```

#### `components/Stagehand/ObserveResults.tsx`

```
ObserveResults:
├── Props: none (uses store)
├── State from store:
│   └── lastObserveResult
├── UI:
│   ├── If no result: "Run Observe to analyze the page"
│   ├── If result:
│   │   ├── Section: "Page Info"
│   │   │   ├── Title: {pageInfo.title}
│   │   │   ├── URL: {pageInfo.url}
│   │   │   └── Summary: {pageInfo.contentSummary}
│   │   ├── Section: "Available Actions"
│   │   │   └── List of actions with:
│   │   │       ├── Description
│   │   │       ├── Type badge (click, input, etc.)
│   │   │       └── "Use" button → populate act input
│   │   └── Section: "Extractable Data"
│   │       └── List of extractable items
│   └── Refresh button
```

#### `components/ChatPanel/index.tsx` (modifications)

```
ChatPanel:
├── Add ModeSwitcher to header
├── Conditionally render based on mode:
│   ├── If mode === 'anchor':
│   │   └── Existing ChatArea and ChatInput
│   └── If mode === 'stagehand':
│       ├── StagehandInput
│       ├── ObserveResults (collapsible)
│       └── Action log (shared)
├── Action log shows both Anchor and Stagehand actions
│   └── Different badges: "Anchor" vs "Stagehand"
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-D.1 | Mode switcher visible in chat panel | Open playground → see toggle |
| AC-D.2 | Switching mode changes input UI | Toggle to Stagehand → see Stagehand input |
| AC-D.3 | Can execute act command | Enter action, submit → action executes |
| AC-D.4 | Schema editor validates JSON | Enter invalid JSON → see error |
| AC-D.5 | Extract returns data | Enter instruction + schema → see extracted data |
| AC-D.6 | Observe shows page analysis | Click Observe → see actions and data |
| AC-D.7 | Actions logged with correct badge | Execute Stagehand action → "Stagehand" badge in log |

---

## User Flows

### Flow 1: First Stagehand Interaction

```
1. User has active browser session on a job posting page
2. User clicks "Stagehand" in mode switcher
3. UI changes to Stagehand input with tabs: Act | Extract | Observe
4. User clicks "Observe" tab, then "Observe Page"
5. Results show:
   - Available actions: "Apply Now button", "Save job button", etc.
   - Extractable data: "Job title", "Company name", "Requirements list"
6. User clicks "Use" next to "Apply Now button"
7. Act input populates: "Click the Apply Now button"
8. User submits
9. Browser clicks the button
10. Action log shows: "Stagehand: Click the Apply Now button (0.8s)"
```

### Flow 2: Extract Job Details with Schema

```
1. User is on job posting page, Stagehand mode active
2. User clicks "Extract" tab
3. User enters instruction: "Extract the job posting details"
4. User clicks "Job Posting" template button
5. Schema editor fills with:
   {
     "type": "object",
     "properties": {
       "title": { "type": "string" },
       "company": { "type": "string" },
       "location": { "type": "string" },
       "salary": { "type": "string" },
       "requirements": { "type": "array", "items": { "type": "string" } }
     },
     "required": ["title", "company"]
   }
6. User clicks "Extract"
7. Loading spinner shows
8. Results appear:
   {
     "title": "Senior Product Manager",
     "company": "Acme Corp",
     "location": "San Francisco, CA",
     "salary": "$150,000 - $200,000",
     "requirements": ["5+ years PM experience", "Technical background", ...]
   }
9. User copies data or uses in next step
```

---

## Out of Scope

- Custom LLM provider (hardcode Gemini)
- Stagehand configuration UI (timeout, retries)
- Parallel Stagehand + Anchor execution
- Stagehand caching
- Visual element highlighting (future enhancement)

---

## Open Questions

- [ ] Is `@browserbasehq/stagehand` available as npm package? **RESEARCH NEEDED**: Check npm registry
- [ ] Does Stagehand work with Anchor's CDP URL format? **RESEARCH NEEDED**: Test CDP compatibility
- ✅ How do we handle Stagehand rate limits / costs? **DECIDED**: Use API keys, no built-in limiting
- ✅ Should we persist extracted data to Records? **DECIDED**: Out of scope for now

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | Claude |
