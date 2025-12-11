# Task: Browser Automation Workflow Integration

**Status:** Not Started
**Roadmap:** `_docs/Product/ROADMAP/browser-automation/04-Workflow-Integration.md`
**Assigned:** TBD
**Started:** —
**Completed:** —

---

## Validation

### Approach Validation
✅ **Browser steps as workflow nodes is correct** - Aligns with IPO model
✅ **Step generator pattern works** - Existing pattern for Composio/custom steps
✅ **Session reuse across steps is efficient** - One browser session per workflow run
✅ **Natural language actions via Anchor** - Leverage agent.task() API

### Current State Analysis
- Workflow system exists with composio/custom step types
- Step generator creates TypeScript for runtime
- No browser step type yet
- Browser automation services exist but not integrated

## File Impact Analysis

The following files will be impacted:

### CREATE (New Files)
- `app/api/workflows/types/browser-step.ts` - Browser step configuration types
- `app/api/workflows/services/browser-step-executor.ts` - Runtime execution
- `app/api/browser-automation/services/workflow-browser.ts` - Session manager
- `app/(pages)/workflows/editor/components/nodes/BrowserStepNode.tsx` - Canvas node
- `app/(pages)/workflows/editor/components/panels/BrowserStepConfig.tsx` - Config panel
- `app/(pages)/workflows/editor/components/toolkit/BrowserToolkit.tsx` - Toolkit items

### MODIFY (Existing Files)
- `app/api/workflows/types/workflow.ts` - Add "browser" step type
- `app/api/workflows/services/step-generator.ts` - Add browser code generation
- `app/(pages)/workflows/editor/store/slices/toolkitSlice.ts` - Add browser tools

## Deterministic Decisions

### Storage Decisions
- **No New Storage**: Browser steps stored in existing workflow JSON
- **Session Cache**: Runtime browser sessions cached in memory during execution

### Implementation Decisions
- **Step Type**: Add "browser" to WorkflowStep type union
- **Action Types**: navigate, extract, fill_form, click, wait, screenshot, custom
- **Session Reuse**: One browser session per workflow execution
- **Profile Support**: Allow specifying profile name for authenticated actions
- **Error Handling**: Step fails if browser action fails, workflow continues/stops based on settings

### UI/UX Decisions
- **Node Color**: Blue for browser steps (distinct from green Composio)
- **Icon**: Globe icon for browser steps
- **Config Panel**: Action dropdown + dynamic config based on action type
- **Toolkit Section**: "Browser Actions" below Composio tools

---

## Overview

### Goal

Enable browser actions as first-class workflow steps. Users can add browser steps to the visual workflow editor, configure them (navigate, extract, fill form, click), and chain them with other steps (Composio tools, custom code, LLM processing).

### Relevant Research

**Workflow Step Types** (from `app/api/workflows/types/workflow.ts`):
```typescript
export type WorkflowStep = {
  id: string;
  type: "composio" | "custom" | "control" | "query_table" | "write_table";
  // ... need to add "browser"

  // For composio steps:
  toolId?: string;
  toolkitSlug?: string;

  // We'll need similar for browser:
  browserAction?: "navigate" | "extract" | "fill_form" | "click" | "custom";
  browserConfig?: BrowserStepConfig;

  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
};
```

**Step Generator Pattern** (from `step-generator.ts`):
- Each step type has a code generator
- Generates TypeScript for Mastra workflow step
- Returns `result.data` after execution

**Browser Services Available**:
- `anchor-client.ts` → Session creation, termination
- `anchor-agent.ts` → `executeAgentTask()` for natural language commands
- Stagehand (if integrated) → `act()`, `extract()`, `observe()`

**Workflow Registry** (from Phase 23):
- Workflows registered statically in `_tables/workflows/registry.ts`
- Each workflow is a Mastra workflow with steps

---

## File Impact

### Types

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/types/workflow.ts` | Modify | Add browser step type | A |
| `app/api/workflows/types/browser-step.ts` | Create | Browser step config types | A |

### Backend / API

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/workflows/services/step-generator.ts` | Modify | Add browser step code generation | B |
| `app/api/workflows/services/browser-step-executor.ts` | Create | Browser step runtime execution | B |
| `app/api/workflows/[workflowId]/route.ts` | Modify | Handle browser step transpilation | B |

### Backend / Services

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/api/browser-automation/services/workflow-browser.ts` | Create | Browser session management for workflows | B |

### Frontend / State

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/store/slices/toolkitSlice.ts` | Modify | Add browser to available tools | C |

### Frontend / Components

| File | Action | Purpose | Part |
|------|--------|---------|------|
| `app/(pages)/workflows/editor/components/nodes/BrowserStepNode.tsx` | Create | Browser step canvas node | D |
| `app/(pages)/workflows/editor/components/panels/BrowserStepConfig.tsx` | Create | Browser step configuration panel | D |
| `app/(pages)/workflows/editor/components/toolkit/BrowserToolkit.tsx` | Create | Browser tools in toolkit sidebar | D |

---

## Part A: Types and Schema

### Goal

Define types for browser workflow steps, including action types, configuration, and input/output schemas.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/types/browser-step.ts` | Create | Browser step types | ~120 |
| `app/api/workflows/types/workflow.ts` | Modify | Add browser to step type union | +30 |

### Pseudocode

#### `app/api/workflows/types/browser-step.ts`

```
export type BrowserActionType =
  | "navigate"
  | "extract"
  | "fill_form"
  | "click"
  | "wait"
  | "screenshot"
  | "custom"

export interface NavigateConfig {
  url: string                    // Can reference binding: "{{workflow.input.jobUrl}}"
  waitForSelector?: string       // Optional: wait for element before continuing
}

export interface ExtractConfig {
  instruction: string            // Natural language: "Extract job requirements"
  schema: JSONSchema             // Expected output structure
  waitForSelector?: string
}

export interface FillFormConfig {
  fields: Array<{
    selector?: string            // CSS selector (optional if using AI)
    description: string          // "First name input field"
    value: string                // Binding: "{{steps.step1.output.firstName}}"
  }>
  submitSelector?: string        // Optional: auto-submit after filling
}

export interface ClickConfig {
  target: string                 // Natural language: "the Apply Now button"
  waitAfter?: number             // ms to wait after click
}

export interface WaitConfig {
  selector?: string              // Wait for element
  timeout?: number               // Max wait time
  condition?: string             // "visible" | "hidden" | "exists"
}

export interface ScreenshotConfig {
  fullPage?: boolean
  selector?: string              // Screenshot specific element
}

export interface CustomBrowserConfig {
  instruction: string            // Natural language task
  expectedOutput?: JSONSchema    // Optional output schema
}

export type BrowserStepConfig =
  | { action: "navigate"; config: NavigateConfig }
  | { action: "extract"; config: ExtractConfig }
  | { action: "fill_form"; config: FillFormConfig }
  | { action: "click"; config: ClickConfig }
  | { action: "wait"; config: WaitConfig }
  | { action: "screenshot"; config: ScreenshotConfig }
  | { action: "custom"; config: CustomBrowserConfig }

export interface BrowserWorkflowSettings {
  profileName?: string           // Anchor profile for authenticated sessions
  sessionTimeout?: number        // Minutes before session auto-terminates
  createNewSession?: boolean     // vs reusing existing if available
}

// Input/output schema generators for each action type
export function getNavigateInputSchema(): JSONSchema
export function getNavigateOutputSchema(): JSONSchema
export function getExtractInputSchema(): JSONSchema
export function getExtractOutputSchema(userSchema: JSONSchema): JSONSchema
// ... etc for each action type
```

#### `app/api/workflows/types/workflow.ts` (modifications)

```
import { BrowserStepConfig, BrowserWorkflowSettings } from './browser-step'

export type WorkflowStep = {
  id: string
  type: "composio" | "custom" | "control" | "query_table" | "write_table" | "browser"  // ADD browser

  // Existing fields...
  toolId?: string
  toolkitSlug?: string
  code?: string

  // NEW: Browser step fields
  browserAction?: BrowserActionType
  browserConfig?: BrowserStepConfig

  // Existing...
  inputSchema: JSONSchema
  outputSchema: JSONSchema
  // ...
}

export interface WorkflowDefinition {
  // Existing fields...

  // NEW: Browser settings at workflow level
  browserSettings?: BrowserWorkflowSettings
}
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-A.1 | Browser step type added to union | TypeScript compiles with `type: "browser"` step |
| AC-A.2 | All action configs defined | Each BrowserActionType has corresponding config interface |
| AC-A.3 | Workflow definition has browser settings | Can set profileName at workflow level |
| AC-A.4 | Schema generators exist | `getExtractOutputSchema()` returns valid JSONSchema |

---

## Part B: Backend - Step Generation and Execution

### Goal

Generate executable Mastra step code for browser actions and create runtime executor.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `app/api/workflows/services/step-generator.ts` | Modify | Add browser step generator | +150 |
| `app/api/workflows/services/browser-step-executor.ts` | Create | Runtime browser execution | ~200 |
| `app/api/browser-automation/services/workflow-browser.ts` | Create | Session management | ~100 |

### Pseudocode

#### `app/api/workflows/services/step-generator.ts` (additions)

```
// Add case for browser steps
generateStepCode(step: WorkflowStep, workflowId: string): string
├── Switch on step.type:
│   ├── Case "composio": // existing
│   ├── Case "custom": // existing
│   ├── Case "browser":
│   │   └── Return generateBrowserStepCode(step)
│   └── ...

generateBrowserStepCode(step: WorkflowStep): string
├── Get browserConfig from step
├── Switch on browserConfig.action:
│   ├── Case "navigate":
│   │   └── Return `
│   │       import { browserExecutor } from '../services/browser-step-executor';
│   │
│   │       export const ${stepId} = createStep({
│   │         id: '${step.id}',
│   │         inputSchema: z.object({ url: z.string() }),
│   │         outputSchema: z.object({ currentUrl: z.string(), title: z.string() }),
│   │         execute: async ({ inputData, runtimeContext }) => {
│   │           const sessionId = runtimeContext.get('browserSessionId');
│   │           return browserExecutor.navigate(sessionId, inputData.url);
│   │         }
│   │       });
│   │       `
│   ├── Case "extract":
│   │   └── Return code that calls browserExecutor.extract()
│   ├── Case "fill_form":
│   │   └── Return code that calls browserExecutor.fillForm()
│   ├── Case "click":
│   │   └── Return code that calls browserExecutor.click()
│   └── ...
```

#### `app/api/workflows/services/browser-step-executor.ts`

```
import { getClient, createSession, terminateSession } from '../../browser-automation/services/anchor-client'
import { executeAgentTask } from '../../browser-automation/services/anchor-agent'

interface BrowserExecutor {
  // Session management
  initSession(profileName?: string): Promise<string>  // Returns sessionId
  destroySession(sessionId: string): Promise<void>

  // Actions
  navigate(sessionId: string, url: string): Promise<{ currentUrl: string; title: string }>
  extract(sessionId: string, instruction: string, schema: JSONSchema): Promise<unknown>
  fillForm(sessionId: string, fields: FillFormConfig['fields']): Promise<{ filled: number; errors: string[] }>
  click(sessionId: string, target: string): Promise<{ clicked: boolean; description: string }>
  wait(sessionId: string, config: WaitConfig): Promise<{ found: boolean; elapsed: number }>
  screenshot(sessionId: string, config: ScreenshotConfig): Promise<{ imageBase64: string }>
  custom(sessionId: string, instruction: string, expectedOutput?: JSONSchema): Promise<unknown>
}

export const browserExecutor: BrowserExecutor = {

  initSession: async (profileName?: string) => {
    ├── Call createSession({ profileName, persist: false })
    ├── Wait for session to be "running"
    └── Return sessionId
  },

  destroySession: async (sessionId: string) => {
    └── Call terminateSession(sessionId)
  },

  navigate: async (sessionId, url) => {
    ├── Build task: `Navigate to ${url}`
    ├── Call executeAgentTask(sessionId, task)
    ├── Extract currentUrl and title from result
    └── Return { currentUrl, title }
  },

  extract: async (sessionId, instruction, schema) => {
    ├── Build task: `${instruction}. Return JSON matching this schema: ${JSON.stringify(schema)}`
    ├── Call executeAgentTask with output schema
    ├── Parse and validate result against schema
    └── Return validated data
  },

  fillForm: async (sessionId, fields) => {
    ├── For each field:
    │   ├── Build task: `Fill the ${field.description} with "${field.value}"`
    │   ├── Execute task
    │   └── Track success/failure
    └── Return { filled: count, errors: [] }
  },

  click: async (sessionId, target) => {
    ├── Build task: `Click ${target}`
    ├── Call executeAgentTask(sessionId, task)
    └── Return { clicked: true, description: target }
  },

  // ... similar for wait, screenshot, custom
}
```

#### `app/api/browser-automation/services/workflow-browser.ts`

```
// Manages browser sessions for workflow execution
const workflowSessions = new Map<string, string>()  // workflowRunId → sessionId

initWorkflowSession(workflowRunId: string, settings: BrowserWorkflowSettings): Promise<string>
├── If settings.profileName:
│   └── Create session with profile
├── Else:
│   └── Create anonymous session
├── Store mapping: workflowSessions.set(workflowRunId, sessionId)
└── Return sessionId

getWorkflowSession(workflowRunId: string): string | null
├── Return workflowSessions.get(workflowRunId) ?? null

cleanupWorkflowSession(workflowRunId: string): Promise<void>
├── Get sessionId from map
├── If exists:
│   ├── Call terminateSession(sessionId)
│   └── workflowSessions.delete(workflowRunId)
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-B.1 | Navigate step generates valid code | Transpile workflow with navigate step → compiles |
| AC-B.2 | Extract step uses schema | Transpile with extract step → schema in generated code |
| AC-B.3 | Browser executor navigates | Call navigate() → browser goes to URL |
| AC-B.4 | Browser executor extracts | Call extract() → returns structured data |
| AC-B.5 | Session lifecycle managed | Init session → run steps → cleanup session |

---

## Part C: Frontend - State Management

### Goal

Add browser to the workflow editor toolkit and handle browser step state.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `store/slices/toolkitSlice.ts` (or equivalent) | Modify | Add browser toolkit | +50 |

### Pseudocode

#### `toolkitSlice.ts` (additions)

```
// Add browser to toolkit categories

interface ToolkitSlice {
  toolkits: Toolkit[]
  // ... existing
}

// Browser toolkit definition
const browserToolkit: Toolkit = {
  id: 'browser',
  name: 'Browser Automation',
  slug: 'browser',
  icon: 'globe',            // Or browser icon
  description: 'Automate web browser interactions',
  tools: [
    {
      id: 'browser-navigate',
      name: 'Navigate to URL',
      description: 'Open a URL in the browser',
      type: 'browser',
      browserAction: 'navigate',
      inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] },
      outputSchema: { type: 'object', properties: { currentUrl: { type: 'string' }, title: { type: 'string' } } }
    },
    {
      id: 'browser-extract',
      name: 'Extract Data',
      description: 'Extract structured data from the current page',
      type: 'browser',
      browserAction: 'extract',
      inputSchema: { type: 'object', properties: { instruction: { type: 'string' } } },
      outputSchema: { type: 'object' }  // User-defined
    },
    {
      id: 'browser-fill-form',
      name: 'Fill Form',
      description: 'Fill form fields on the current page',
      type: 'browser',
      browserAction: 'fill_form',
      inputSchema: { type: 'object', properties: { fields: { type: 'array' } } },
      outputSchema: { type: 'object', properties: { filled: { type: 'number' }, errors: { type: 'array' } } }
    },
    {
      id: 'browser-click',
      name: 'Click Element',
      description: 'Click a button, link, or other element',
      type: 'browser',
      browserAction: 'click',
      inputSchema: { type: 'object', properties: { target: { type: 'string' } }, required: ['target'] },
      outputSchema: { type: 'object', properties: { clicked: { type: 'boolean' } } }
    },
    {
      id: 'browser-custom',
      name: 'Custom Action',
      description: 'Describe any browser action in natural language',
      type: 'browser',
      browserAction: 'custom',
      inputSchema: { type: 'object', properties: { instruction: { type: 'string' } } },
      outputSchema: { type: 'object' }
    }
  ]
}

// Add to toolkits array
fetchToolkits():
├── Existing logic to fetch Composio toolkits
├── Add browserToolkit to the array
└── Return combined list
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-C.1 | Browser toolkit appears in sidebar | Open editor → see "Browser Automation" in toolkits |
| AC-C.2 | Browser tools draggable to canvas | Drag "Navigate to URL" → step appears |
| AC-C.3 | Browser tools have correct schemas | Add extract step → input/output schemas set |

---

## Part D: Frontend - Browser Step Components

### Goal

Create UI components for browser steps: canvas node and configuration panel.

### Files

| File | Action | Purpose | Lines |
|------|--------|---------|-------|
| `components/nodes/BrowserStepNode.tsx` | Create | Canvas node for browser steps | ~80 |
| `components/panels/BrowserStepConfig.tsx` | Create | Configuration panel | ~250 |
| `components/toolkit/BrowserToolkit.tsx` | Create | Toolkit sidebar section | ~60 |

### Pseudocode

#### `components/nodes/BrowserStepNode.tsx`

```
BrowserStepNode:
├── Props: data: NodeData (includes step config)
├── Get browserAction from step data
├── UI:
│   ├── Node container (same style as other step nodes)
│   ├── Header:
│   │   ├── Browser icon (globe or browser)
│   │   ├── Step name
│   │   └── Action type badge: "Navigate" | "Extract" | "Fill Form" | etc.
│   ├── Body:
│   │   ├── Summary of configuration:
│   │   │   ├── Navigate: Show URL (truncated)
│   │   │   ├── Extract: Show instruction (truncated)
│   │   │   ├── Fill Form: Show field count
│   │   │   └── Click: Show target
│   │   └── Binding indicators if values come from other steps
│   ├── Input handle (left)
│   └── Output handle (right)
├── On click: Select step, open config panel
```

#### `components/panels/BrowserStepConfig.tsx`

```
BrowserStepConfig:
├── Props: stepId, step: WorkflowStep
├── State: Local form state for editing
├── UI:
│   ├── Header: Step name editor
│   ├── Action type selector (if changing type allowed):
│   │   └── Dropdown: Navigate | Extract | Fill Form | Click | Custom
│   ├── Config section based on action type:
│   │   ├── If "navigate":
│   │   │   ├── URL input (with binding picker)
│   │   │   └── Wait for selector (optional)
│   │   ├── If "extract":
│   │   │   ├── Instruction textarea
│   │   │   ├── Schema editor (JSON or visual)
│   │   │   └── Wait for selector (optional)
│   │   ├── If "fill_form":
│   │   │   ├── Fields list:
│   │   │   │   └── For each field:
│   │   │   │       ├── Description input
│   │   │   │       ├── Value input (with binding picker)
│   │   │   │       └── Remove button
│   │   │   ├── Add field button
│   │   │   └── Submit selector (optional)
│   │   ├── If "click":
│   │   │   ├── Target description input
│   │   │   └── Wait after (ms) input
│   │   └── If "custom":
│   │       ├── Instruction textarea
│   │       └── Expected output schema (optional)
│   ├── Input schema display (read-only, auto-generated)
│   ├── Output schema display (editable for extract)
│   └── Delete step button
├── On change: Update step in workflow state
```

#### `components/toolkit/BrowserToolkit.tsx`

```
BrowserToolkit:
├── Props: none (uses browserToolkit from state)
├── UI:
│   ├── Section header: "Browser Automation"
│   │   └── Icon: globe
│   ├── Tool list:
│   │   └── For each browser tool:
│   │       ├── Tool card (draggable):
│   │       │   ├── Icon based on action type
│   │       │   ├── Tool name
│   │       │   └── Brief description
│   │       └── Drag handler → creates browser step on canvas
│   └── Profile selector (at bottom):
│       ├── Label: "Browser Profile"
│       ├── Dropdown of available profiles
│       └── "Manage Profiles" link
├── On drag start: Set drag data with step template
```

### Acceptance Criteria

| # | Criterion | Test |
|---|-----------|------|
| AC-D.1 | Browser step node renders on canvas | Add browser step → see node with icon and name |
| AC-D.2 | Config panel opens on node click | Click browser node → panel shows configuration |
| AC-D.3 | Navigate config works | Configure URL → saves to step data |
| AC-D.4 | Extract config includes schema editor | Open extract config → schema editor visible |
| AC-D.5 | Fill form allows adding fields | Click "Add Field" → new field row appears |
| AC-D.6 | Bindings work in config | Click binding picker → can select from previous step output |
| AC-D.7 | Browser toolkit draggable | Drag "Navigate" from toolkit → step appears on canvas |

---

## User Flows

### Flow 1: Build Job Scraping Workflow

```
1. User opens workflow editor
2. User clicks "Browser Automation" in toolkit sidebar
3. User drags "Navigate to URL" to canvas
4. Step appears with input/output handles
5. User clicks step → config panel opens
6. User enters URL: "{{workflow.input.jobUrl}}"
7. User connects workflow input to navigate step
8. User drags "Extract Data" to canvas
9. User connects navigate output to extract input
10. User configures extract:
    - Instruction: "Extract the job title, company, and requirements"
    - Schema: { title: string, company: string, requirements: string[] }
11. User adds LLM step to process extracted data
12. User saves workflow
13. Transpiler generates browser step code
14. Workflow registered and ready to run
```

### Flow 2: Execute Browser Workflow

```
1. User runs "Analyze Job Posting" workflow
2. Workflow execution starts:
   a. Browser session created (with profile if configured)
   b. Navigate step executes → browser goes to job URL
   c. Extract step executes → data extracted from page
   d. LLM step processes extracted data
3. User sees execution log with browser actions
4. Browser session cleaned up
5. Workflow result includes extracted and processed data
```

---

## Out of Scope

- Live browser view during workflow execution
- Browser step debugging/breakpoints
- Parallel browser actions
- Multiple browser sessions per workflow
- Screenshot step output (save for later)

---

## Open Questions

- [ ] How do we handle browser authentication mid-workflow?
- [ ] Should browser session persist across workflow retries?
- [ ] How do we show browser step failures in the workflow UI?
- [ ] Can we support conditional branching based on page content?
- [ ] How do we handle popup windows or new tabs?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Initial creation | Claude |
